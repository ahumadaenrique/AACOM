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
      conversationId = null,
      moduleId = 'prospeccion'
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
    // 2. EVALUACIÓN PEDAGÓGICA RIGUROSA Y CALIBRADA
    let score = 0;
    const aciertos: string[] = [];
    const errores: string[] = [];
    let appointmentClosed = false;
    let cometioErrorFatal = false;
    let xpEarned = 0;

    if (moduleId === 'adn') {
      // EVALUACIÓN DE ADN (ANÁLISIS DE NECESIDADES)
      
      // 1. Rompehielo (F.O.R.D) (+20)
      const rompeHieloPatterns = /\b(a qu[eé] te dedicas|cu[aá]ntos hijos|tu familia|tu espos[oa]|tu pareja|tus hijos|qu[eé] haces en tu tiempo libre|hobbies|pasatiempos|a d[oó]nde te gusta viajar|cu[aá]les son tus metas|qu[eé] negocio)\b/i;
      if (rompeHieloPatterns.test(agentMessages)) {
        score += 20;
        aciertos.push('Hiciste rapport/rompehielo e indagaste sobre sus prioridades personales (F.O.R.D.).');
      } else {
        errores.push('Faltó rompehielo: Entraste a números sin indagar primero preguntas específicas sobre su familia, metas o hobbies.');
      }

      // 2. Riesgo (Dolor) (+30)
      const dolorPatterns = /\b(qu[eé] pasar[ií]a|si llegaras a faltar|c[oó]mo te ves|tu retiro|qu[eé] suceder[ií]a|qui[eé]n depende de ti|depende financieramente|te has imaginado|qu[eé] har[ií]a tu familia)\b/i;
      if (dolorPatterns.test(agentMessages)) {
        score += 30;
        aciertos.push('Hiciste preguntas de alto impacto sobre riesgos e impactos financieros.');
      } else {
        errores.push('Faltó detección del dolor: No preguntaste abiertamente qué pasaría si falta, o cómo se visualiza en el futuro/retiro.');
      }

      // 3. Presupuesto Sensible (+20)
      const presPatterns = /\b(cu[aá]nto podr[ií]as|capacidad de ahorro|presupuesto mensual|destinar al mes|ahorrar mensualmente|cu[aá]nto te gustar[ií]a destinar)\b/i;
      if (presPatterns.test(agentMessages)) {
        score += 20;
        aciertos.push('Indagaste correctamente su capacidad de ahorro o presupuesto.');
      } else {
        errores.push('No definiste explícitamente cuánto podría destinar mensualmente.');
      }

      // 4. Cierre Cita Presentación (+20)
      const citaPatterns = /\b(propuesta a la medida|traje a la medida|siguiente cita|reuni[oó]n para presentarte|siguiente paso|nos vemos el|nos vemos ma[ñn]ana|nos vemos la pr[oó]xima|dise[ñn]ar algo|hacer el an[aá]lisis)\b/i;
      if (citaPatterns.test(agentMessages)) {
        score += 20;
        aciertos.push('Agendaste correctamente la siguiente cita para presentar la solución/proyecto a la medida.');
        appointmentClosed = true;
      } else {
        errores.push('No agendaste claramente la siguiente cita (Cita de Presentación o Cierre).');
      }

      // Penalizaciones ADN
      const productoPrematuro = /\b(cotizarte|te cotizo|costo de la p[oó]liza|prima anual|venderte un ppr|tu seguro de vida cuesta|te vendo|gastos m[eé]dicos)\b/i;
      if (productoPrematuro.test(agentMessages)) {
        score = Math.max(0, score - 50);
        cometioErrorFatal = true;
        errores.push('Venta prematura: Intentaste hablar de costos o pólizas sin haber terminado el diagnóstico completo.');
      }

      const duracionAgente = agentMessages.split(' ').length;
      const duracionProspecto = prospectMessages.split(' ').length;
      if (duracionAgente > (duracionProspecto * 1.6)) {
        score = Math.max(0, score - 20);
        errores.push('Monólogo: Hablaste mucho más que el cliente. Un buen ADN requiere escuchar la mayor parte del tiempo.');
      }

    } else if (moduleId === 'objeciones') {
      // EVALUACIÓN DE OBJECIONES Y CIERRE
      
      // 1. Empatía / Validar Objeción (+25)
      const empatiaPatterns = /\b(te entiendo|comprendo c[oó]mo te sientes|es muy normal|tienes toda la raz[oó]n|comprendo perfectamente|me pongo en tu lugar|tiene todo el sentido)\b/i;
      if (empatiaPatterns.test(agentMessages)) {
        score += 25;
        aciertos.push('Amortiguaste la objeción mostrando empatía antes de rebatir.');
      } else {
        errores.push('Faltó empatía: Atacaste la objeción directamente sin validar al prospecto primero.');
      }

      // 2. Aislamiento (+25)
      const aislarPatterns = /\b(adem[aá]s de|fuera de eso|hay algo m[aá]s|es la [uú]nica|existe alguna otra raz[oó]n|es lo [uú]nico que te detiene|si resolvi[eé]ramos|suponiendo que)\b/i;
      if (aislarPatterns.test(agentMessages)) {
        score += 25;
        aciertos.push('Aislaste la objeción correctamente para asegurar que no hay objeciones ocultas.');
      } else {
        errores.push('No aislaste la objeción ("¿Además de eso hay algo más?") para descubrir motivos ocultos.');
      }

      // 3. Técnica de Rebote (+25)
      const rebotePatterns = /\b(precisamente por eso|muchos clientes sent[ií]an|otros clientes|al principio pensaban|se dieron cuenta|lo importante es el valor|rentabilidad a largo plazo|no es un gasto|es una inversi[oó]n)\b/i;
      if (rebotePatterns.test(agentMessages)) {
        score += 25;
        aciertos.push('Usaste una técnica de reversión o Boomerang para aportar valor frente al costo.');
      } else {
        errores.push('Faltó técnica de rebote: No lograste rebatir la objeción de manera estructurada.');
      }

      // 4. Cierre Asumido (+25)
      const cierrePatterns = /\b(iniciamos el tr[aá]mite|llenamos la solicitud|a nombre de qui[eé]n|a qui[eé]n dejamos de beneficiario|tarjeta de cr[eé]dito|transferencia|para apartar tu|poner el cargo|lo domiciliamos|te env[ií]o la liga de pago)\b/i;
      if (cierrePatterns.test(agentMessages)) {
        score += 25;
        aciertos.push('Usaste un cierre asumido o de doble alternativa para concretar el trámite.');
        appointmentClosed = true;
      } else {
        errores.push('Rebatiste la objeción, pero no empujaste la solicitud hacia el cierre (pago o firma).');
      }

      // Penalizaciones Objeciones
      const pelearPatterns = /\b(est[aá]s equivocado|eso no es cierto|no me est[aá]s entendiendo|est[aá]s mal|te equivocas|no no no)\b/i;
      if (pelearPatterns.test(agentMessages)) {
        score = Math.max(0, score - 50);
        cometioErrorFatal = true;
        errores.push('Discutiste con el cliente. Nunca contraataques o le digas al cliente que está equivocado.');
      }
      
      const rendicionPatterns = /\b(bueno pi[eé]nsalo|te llamo despu[eé]s|est[aá] bien, te marco|m[aá]ndame mensaje cuando|ni hablar)\b/i;
      if (rendicionPatterns.test(agentMessages)) {
        score = Math.max(0, score - 30);
        errores.push('Rendición prematura: Cediste a la primera objeción sin pelear por el valor de la asesoría.');
      }

    } else {
      // EVALUACIÓN DE PROSPECCIÓN (ORIGINAL)

      // Criterio 0: Presentación con Nombre y Firma (+15)
      const introPatterns = [
        /\b(mi nombre es|soy|le habla|te habla)\b/i
      ];
      const sePresento = introPatterns.some(p => p.test(agentMessages));
      if (sePresento) {
        score += 15;
        aciertos.push('Te presentaste formalmente al iniciar la llamada.');
      } else {
        errores.push('Faltó presentación: No mencionaste explícitamente "soy [tu nombre]" o "mi nombre es".');
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
        errores.push('Faltó enfatizar que brindas una asesoría financiera / patrimonial (evitando sonar a ventas).');
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
      const brushOffPattern = /\b(m[aá]ndame info|m[aá]ndamelo|m[aá]ndame un correo|m[aá]ndame la info|env[ií]amelo|luego lo checo|no tengo tiempo|estoy ocupad[oa]|reviso el fin de semana|d[eé]jame revisarlo|d[eé]jame verlo|d[eé]jame checarlo)\b/i;
      
      const hayAcuerdoExplicito = acuerdoCierrePatterns.some(p => p.test(prospectMessages));
      const intentaDeshacerseDelAgente = brushOffPattern.test(prospectMessages);

      // Solo consideramos cita cerrada si aceptó explícitamente y no intentó batearlo pidiendo info por correo
      const prospectAceptoCita = hayAcuerdoExplicito && !intentaDeshacerseDelAgente;

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

      // --- PENALIZACIONES ESTRICTAS PROSPECCIÓN ---
      const regexProducto = /\b(ppr|seguro de vida|te ofrezco un seguro|te vendo|venderte|te cotizo|cotizaci[oó]n|gastos m[eé]dicos|p[oó]liza)\b/i;
      if (regexProducto.test(agentMessages)) {
        score = Math.max(0, score - 30);
        cometioErrorFatal = true;
        errores.push(`Venta prematura de producto: Mencionaste palabras de venta técnica. En prospección el objetivo es vender la reunión.`);
      }

      const regexRuego = /\b(no me cuelgues?|por favor esc[uú]chame|por favor escuchame|dame 30 minutos|dame 40 minutos|dame chance|no seas mal[oa])\b/i;
      if (regexRuego.test(agentMessages)) {
        score = Math.max(0, score - 25);
        cometioErrorFatal = true;
        errores.push(`Pérdida de postura ejecutiva: Usaste frases de ruego o insistencia desesperada. Mantén siempre postura profesional.`);
      }

      const regexTecnicos = /\b(suma asegurada|cobertura de|prima de|deducible|pesos mensuales|cuesta pesos|\$|udis?)\b/i;
      const tecnicosMatch = agentMessages.match(regexTecnicos);
      if (tecnicosMatch) {
        score = Math.max(0, score - 20);
        errores.push(`Fuga de datos técnicos: soltaste términos que no corresponden a una llamada telefónica (${tecnicosMatch[0]}).`);
      }

      const regexRechazoReal = /\b(no me interesa|no insista|no me vuelva a llamar|no me llame m[aá]s|no quiero nada|b[oó]rreme de su lista|pierde su tiempo)\b/i;
      const tieneRechazoReal = regexRechazoReal.test(prospectMessages);

      appointmentClosed = prospectAceptoCita && !tieneRechazoReal && !regexProducto.test(agentMessages) && !regexRuego.test(agentMessages);

      if (appointmentClosed) {
        score += 10;
        aciertos.push('¡Cita Concretada con Éxito! El prospecto reservó la fecha en su agenda sin objeciones pendientes.');
      } else if (tieneRechazoReal) {
        errores.push('Llamada cerrada sin cita: El prospecto rechazó tajantemente la propuesta de reunión.');
      } else {
        errores.push('Llamada terminada sin agendar cita en firme.');
      }
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
    xpEarned = 0;
    // If not already true from the branches
    if (!cometioErrorFatal && finalScore < 40) {
      cometioErrorFatal = false; // Just to make sure it exists safely
    }

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
