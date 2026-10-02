import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import {
  calculateLevelFromXp,
  DAILY_XP_CAP,
  DAILY_GOAL_CALLS,
  LEVELS_CONFIG,
  DEFAULT_BENEFITS
} from '@/lib/roleplay/gamification';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id && !session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
    }

    let userId = session.user.id;
    if (!userId && session.user.email) {
      const u = await prisma.user.findUnique({ where: { email: session.user.email } });
      if (u) userId = u.id;
    }

    if (!userId) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const body = await req.json();
    const {
      transcript = [],
      durationSeconds = 0,
      scenario = null,
      conversationId = null
    } = body;

    const userTurns = transcript.filter((m: any) => m.source === 'user');
    const agentMessages = userTurns.map((m: any) => (m.message || '').toLowerCase()).join(' ');
    const prospectTurns = transcript.filter((m: any) => m.source === 'ai');
    const prospectMessages = prospectTurns.map((m: any) => (m.message || '').toLowerCase()).join(' ');

    const todayStr = new Date().toISOString().split('T')[0];

    // 1. CONTROL ESTRICTO: Si el agente no habló o colgó de inmediato (Anti-bug de 0 palabras)
    if (userTurns.length === 0 || agentMessages.trim().length < 8 || durationSeconds < 6) {
      const emptyCall = await prisma.roleplayCall.create({
        data: {
          userId,
          scenarioId: scenario?.origen?.tipo || 'frio_total',
          prospectName: scenario?.prospecto?.nombre || 'Prospecto',
          scenarioTitle: scenario?.origen?.titulo || 'Llamada',
          level: scenario?.difficultyLevel || 1,
          durationSeconds,
          score: 0,
          xpEarned: 0,
          conversationId,
          transcript,
          aciertos: [],
          errores: ['Llamada colgada sin interactuar o menor a 6 segundos.'],
          coachTip: 'Para recibir evaluación y ganar puntos de experiencia es indispensable dialogar con el prospecto.',
          objectionHandled: false,
          appointmentClosed: false
        }
      });

      // Fetch user stats
      const stats = await prisma.roleplayStats.findUnique({ where: { userId } });

      return NextResponse.json({
        success: true,
        callId: emptyCall.id,
        score: 0,
        xpEarned: 0,
        appointmentClosed: false,
        aciertos: [],
        errores: ['Colgaste la llamada sin interactuar con el prospecto (0 Puntos).'],
        coachTip: scenario?.origen?.tipPostLlamada || 'Practica abrir la llamada con confianza y presentarte con calma.',
        stats: stats ? {
          xp: stats.xp,
          level: stats.level,
          streak: stats.streak,
          todayXp: stats.todayXp,
          todayCallsCount: stats.todayCallsCount
        } : null
      });
    }

    // 2. EVALUACIÓN PEDAGÓGICA RIGUROSA Y CALIBRADA
    let score = 0;
    const aciertos: string[] = [];
    const errores: string[] = [];

    // Criterio 0: Presentación con Nombre y Firma (+15)
    const introPatterns = [
      /\b(habla|mi nombre es|soy|le habla|te habla|servidor|servidora|agente|asesor)\b/i
    ];
    const sePresento = introPatterns.some(p => p.test(agentMessages));
    if (sePresento) {
      score += 15;
      aciertos.push('Te presentaste formalmente al iniciar la llamada.');
    } else {
      errores.push('Faltó presentación: No mencionaste tu nombre ni a AACOM Seguros con claridad al inicio.');
    }

    // Criterio 1: Mención de referidor si aplicaba (+15)
    if (scenario?.origen?.tipo === 'referido_avisado' && scenario?.referidor) {
      const refWords = scenario.referidor.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3);
      const mencionoReferidor = refWords.some((w: string) => agentMessages.includes(w));
      if (mencionoReferidor) {
        score += 15;
        aciertos.push(`Mencionaste a ${scenario.referidor} oportunamente para romper la barrera del prospecto.`);
      } else {
        errores.push(`El prospecto fue referido por ${scenario.referidor}, pero no lo mencionaste al inicio para generar confianza.`);
      }
    }

    // Criterio 2: Posicionamiento como Asesoría Financiera / Patrimonial (+20)
    const asesoriaPatterns = [
      /\b(asesor[ií]a|financiera|patrimonial|asesor|personalizada|an[aá]lisis|diagn[oó]stico|protecci[oó]n familiar|planeaci[oó]n|metas|retiro|ahorro)\b/i
    ];
    if (asesoriaPatterns.some(p => p.test(agentMessages))) {
      score += 20;
      aciertos.push('Posicionaste la llamada como una asesoría personalizada y no como venta telefónica.');
    } else {
      errores.push('Faltó enfatizar que en AACOM brindamos una asesoría financiera / patrimonial personalizada.');
    }

    // Criterio 4: Cierre con Doble Alternativa y tiempo de 30-40 min (+15)
    const diasHorasRegex = /\b(lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo|mañana|tarde|en la mañana|en la tarde)\b/gi;
    const matchesDias = (agentMessages.match(diasHorasRegex) || []).map((d: string) => d.toLowerCase());
    const uniqueDias = new Set(matchesDias);
    const ofreceAlternativa = uniqueDias.size >= 2;
    const estipulaTiempo = /\b(30|40|treinta|cuarenta|media hora)\b/i.test(agentMessages);

    if (ofreceAlternativa && estipulaTiempo) {
      score += 15;
      aciertos.push('Cierre impecable: Propusiste una reunión de 30-40 min dando dos opciones de horario (doble alternativa).');
    } else if (ofreceAlternativa || estipulaTiempo) {
      score += 8;
      if (!ofreceAlternativa) errores.push('Ofrece siempre dos alternativas concretas de horario (ej: "¿martes o jueves?").');
      if (!estipulaTiempo) errores.push('Aclara siempre que la reunión solo tomará 30 a 40 minutos.');
    } else {
      errores.push('Faltó proponer rango de tiempo de 30-40 minutos y dar doble alternativa de horario.');
    }

    // DETECCIÓN INTELIGENTE DE CITA AGENDADA POR EL PROSPECTO
    const acuerdoCierrePatterns = [
      /\b(me queda bien|me parece bien|de acuerdo|perfecto|trato hecho|quedamos as[ií]|te espero|lo espero|le espero|agendado|an[oó]talo|an[oó]telo|nos vemos entonces|ah[ií] nos vemos|m[aá]ndame la invitaci[oó]n|m[aá]ndame el link|m[aá]ndame el meeting|m[aá]ndame el zoom)\b/i,
      /\b(el\s+)?(lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)\s+(a\s+las\s+)?(\d+|tres|cuatro|cinco|diez|once|doce|una|dos)/i
    ];
    const prospectAceptoCita = acuerdoCierrePatterns.some(p => p.test(prospectMessages));

    // Criterio 3: Diagnóstico antes de Recetar / Amplitud de soluciones (+25)
    const palabrasVariedad = /\b(tantos? productos?|tantas? soluciones?|tantas? opciones?|tanta variedad|muchos? productos?|muchas? soluciones?|muchas? opciones?|amplia gama|amplio portafolio|variedad de|diversas?|m[uú]ltiples?|portafolio|abanico)\b/i;
    const palabrasDiagnostico = /\b(sin conocer|sin saber|m[aá]s acertado|le acomoda|le conviene|m[aá]s adecuado|diagn[oó]stico|conocer su situaci[oó]n|conocer sus metas|conocer sus necesidades|revisar primero|platicar primero|conocerle|evaluar|a ciegas)\b/i;

    const explicoDiagnostico = palabrasVariedad.test(agentMessages) && palabrasDiagnostico.test(agentMessages);

    if (explicoDiagnostico) {
      score += 25;
      aciertos.push('Excelente argumento: Explicaste que manejan tantas opciones que sería irresponsable recomendar una sin conocer su situación primero.');
    } else if (prospectAceptoCita && !agentMessages.includes('cotiz') && !agentMessages.includes('cuesta')) {
      // Si el prospecto aceptó rápido la cita sin pedir cotización, el asesor fue ágil y efectivo
      score += 25;
      aciertos.push('Cierre ágil y efectivo: Concretaste la cita directamente sin rodeos innecesarios ni venta de producto.');
    } else {
      errores.push('Faltó el principio de diagnóstico antes de recetar: ante objeciones o dudas, explica que manejamos tantas soluciones que no puedes recomendar nada sin conocerlo.');
    }

    // --- PENALIZACIONES ESTRICTAS (PALABRAS COMPLETAS CON LÍMITES \b) ---

    // Penalización 1: Venta Prematura de Producto (-30 pts)
    const regexProducto = /\b(ppr|seguro de vida|te ofrezco un seguro|te vendo|venderte|te cotizo|cotizaci[oó]n|gastos m[eé]dicos|p[oó]liza)\b/i;
    const productosMatch = agentMessages.match(regexProducto);
    const productosMencionados = productosMatch ? [productosMatch[0]] : [];
    if (productosMatch) {
      score = Math.max(0, score - 30);
      errores.push(`Venta prematura de producto: Mencionaste "${productosMatch[0]}". En prospección nunca se ofrece un producto ni se pregunta "¿ya tienes PPR?"; el objetivo es vender la reunión de diagnóstico.`);
    }

    // Penalización 2: Pérdida de Postura Ejecutiva / Ruego (-25 pts)
    const regexRuego = /\b(no me cuelgues?|por favor esc[uú]chame|por favor escuchame|dame 30 minutos|dame 40 minutos|dame chance|no seas mal[oa])\b/i;
    const ruegosMatch = agentMessages.match(regexRuego);
    const ruegosDetectados = ruegosMatch ? [ruegosMatch[0]] : [];
    if (ruegosMatch) {
      score = Math.max(0, score - 25);
      errores.push(`Pérdida de postura ejecutiva: Usaste frases de ruego o insistencia desesperada ("${ruegosMatch[0]}"). Mantén siempre postura profesional y de valor.`);
    }

    // Penalización 3: Fuga de datos técnicos / cifras (-20 pts)
    // udis? como palabra aislada \budis?\b para evitar falsos positivos con "Claudia", "estudiar", etc.
    const regexTecnicos = /\b(suma asegurada|cobertura de|prima de|deducible|pesos mensuales|cuesta pesos|\$|udis?)\b/i;
    const tecnicosMatch = agentMessages.match(regexTecnicos);
    if (tecnicosMatch) {
      score = Math.max(0, score - 20);
      errores.push(`Fuga de datos técnicos: soltaste términos que no corresponden a una llamada telefónica (${tecnicosMatch[0]}).`);
    }

    // Criterio 5: Cita Conseguida en el diálogo (+10)
    // RECHAZO REAL (NO incluye despedidas educadas como 'hasta luego', 'que le vaya bien' o 'tengo que colgar')
    const regexRechazoReal = /\b(no me interesa|no insista|no me vuelva a llamar|no me llame m[aá]s|no quiero nada|b[oó]rreme de su lista|pierde su tiempo)\b/i;
    const tieneRechazoReal = regexRechazoReal.test(prospectMessages);

    // Solo se valida cita si NO hubo errores fatales (venta prematura o ruego) y hubo confirmación de cita sin rechazo real
    const appointmentClosed = prospectAceptoCita && !tieneRechazoReal && !productosMatch && !ruegosMatch;

    if (appointmentClosed) {
      score += 10;
      aciertos.push('¡Cita Concretada con Éxito! El prospecto reservó la fecha en su agenda sin objeciones pendientes.');
    } else if (tieneRechazoReal) {
      errores.push('Llamada cerrada sin cita: El prospecto rechazó tajantemente la propuesta de reunión.');
    } else {
      errores.push('Llamada terminada sin agendar cita en firme.');
    }

    // Score final normalizado 0 - 100
    const finalScore = Math.min(100, Math.max(0, score));

    // Cálculo calibrado de XP:
    // Cita cerrada con excelencia: 95 XP
    // Buen intento profesional sin cierre (score >= 60): 45 XP
    // Intento regular (score 40-59): 15 XP
    // PENALIZACIONES DE XP:
    // - Errores fatales (Venta prematura de producto / Ruego): -50 XP
    // - Reprobado por baja técnica (score < 40): -25 XP
    let xpEarned = 0;
    const cometioErrorFatal = productosMencionados.length > 0 || ruegosDetectados.length > 0;

    if (cometioErrorFatal) {
      xpEarned = -50; // Penalización por técnica destructiva
    } else if (finalScore >= 80) {
      xpEarned = appointmentClosed ? 95 : 65;
    } else if (finalScore >= 60) {
      xpEarned = appointmentClosed ? 80 : 45;
    } else if (finalScore >= 40) {
      xpEarned = appointmentClosed ? 60 : 15;
    } else {
      xpEarned = -25; // Penalización por reprobar llamada
    }

    // Actualización de Estadísticas en Base de Datos
    let stats = await prisma.roleplayStats.findUnique({ where: { userId } });
    if (!stats) {
      stats = await prisma.roleplayStats.create({
        data: {
          userId,
          xp: 0,
          level: 1,
          streak: 0,
          todayXp: 0,
          todayDate: todayStr,
          todayCallsCount: 0,
          totalCalls: 0,
          closedCalls: 0,
          badges: [],
          unlockedBenefits: DEFAULT_BENEFITS[1]
        }
      });
    }

    // Respetar límite diario de 500 XP
    let todayXp = stats.todayDate === todayStr ? stats.todayXp : 0;
    let todayCallsCount = stats.todayDate === todayStr ? stats.todayCallsCount + 1 : 1;

    let effectiveXpEarned = xpEarned;
    if (xpEarned > 0) {
      const availableXpToday = Math.max(0, DAILY_XP_CAP - todayXp);
      effectiveXpEarned = Math.min(xpEarned, availableXpToday);
      todayXp += effectiveXpEarned;
    }

    const newTotalXp = Math.max(0, stats.xp + effectiveXpEarned);
    const newLevel = calculateLevelFromXp(newTotalXp);
    const newBenefits = DEFAULT_BENEFITS[newLevel] || [];

    // Calcular racha de días (si hoy cumple la meta de 3 llamadas)
    let newStreak = stats.streak;
    if (todayCallsCount === DAILY_GOAL_CALLS) {
      newStreak += 1;
    }

    // Actualizar insignias ganadas
    const currentBadges = new Set(stats.badges);
    if (appointmentClosed) currentBadges.add('primera_cita');
    if (newStreak >= 3) currentBadges.add('racha_3_dias');
    if (finalScore >= 85) currentBadges.add('maestro_objecion');
    if (scenario?.origen?.tipo === 'frio_total' && appointmentClosed) currentBadges.add('experto_frio');
    if (todayXp + effectiveXpEarned >= DAILY_XP_CAP) currentBadges.add('dia_perfecto');
    if (newLevel === 6) currentBadges.add('lobo_aacom');

    const updatedBadges = Array.from(currentBadges);

    // Persistir llamada
    const savedCall = await prisma.roleplayCall.create({
      data: {
        userId,
        scenarioId: scenario?.origen?.tipo || 'frio_total',
        prospectName: scenario?.prospecto?.nombre || 'Prospecto',
        scenarioTitle: scenario?.origen?.titulo || 'Llamada de Prospección',
        level: scenario?.difficultyLevel || 1,
        durationSeconds,
        score: finalScore,
        xpEarned: effectiveXpEarned,
        conversationId,
        transcript,
        aciertos,
        errores,
        coachTip: scenario?.origen?.tipPostLlamada || 'Sigue practicando el principio de diagnóstico previo y la doble alternativa.',
        objectionHandled: finalScore >= 50,
        appointmentClosed
      }
    });

    // Actualizar estadísticas del usuario
    const updatedStats = await prisma.roleplayStats.update({
      where: { userId },
      data: {
        xp: newTotalXp,
        level: newLevel,
        streak: newStreak,
        lastActiveDate: todayStr,
        todayXp: Math.max(0, todayXp),
        todayDate: todayStr,
        todayCallsCount,
        totalCalls: stats.totalCalls + 1,
        closedCalls: stats.closedCalls + (appointmentClosed ? 1 : 0),
        badges: updatedBadges,
        unlockedBenefits: DEFAULT_BENEFITS[newLevel] || []
      }
    });

    return NextResponse.json({
      success: true,
      callId: savedCall.id,
      score: finalScore,
      xpEarned: effectiveXpEarned,
      appointmentClosed,
      aciertos,
      errores,
      coachTip: scenario?.origen?.tipPostLlamada || 'Excelente esfuerzo en la llamada.',
      stats: {
        xp: updatedStats.xp,
        level: updatedStats.level,
        levelInfo: LEVELS_CONFIG[updatedStats.level],
        streak: updatedStats.streak,
        todayXp: updatedStats.todayXp,
        dailyCap: DAILY_XP_CAP,
        todayCallsCount: updatedStats.todayCallsCount,
        totalCalls: updatedStats.totalCalls,
        closedCalls: updatedStats.closedCalls,
        badges: updatedStats.badges,
        unlockedBenefits: updatedStats.unlockedBenefits
      }
    });
  } catch (error: any) {
    console.error("Error evaluating roleplay call:", error);
    return NextResponse.json({ error: error.message || 'Error en evaluación' }, { status: 500 });
  }
}
