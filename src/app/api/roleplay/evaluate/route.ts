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

    // 2. EVALUACIÓN PEDAGÓGICA RIGUROSA
    let score = 0;
    const aciertos: string[] = [];
    const errores: string[] = [];

    // Criterio 0: Presentación con Nombre y Firma (+15)
    const introWords = ['habla', 'mi nombre es', 'soy', 'te habla', 'le habla', 'servidor', 'servidora', 'aacom'];
    const sePresento = introWords.some(w => agentMessages.includes(w));
    if (sePresento) {
      score += 15;
      aciertos.push('Te presentaste formalmente al iniciar la llamada.');
    } else {
      errores.push('Faltó presentación: No mencionaste tu nombre ni a AACOM Seguros con claridad al inicio.');
    }

    // Criterio 1: Mención de referidor si aplicaba (+15)
    if (scenario?.origen?.tipo === 'referido_avisado' && scenario?.referidor) {
      const refWords = scenario.referidor.toLowerCase().split(' ');
      if (refWords.some((w: string) => w.length > 3 && agentMessages.includes(w))) {
        score += 15;
        aciertos.push(`Mencionaste a ${scenario.referidor} oportunamente para romper la barrera del prospecto.`);
      } else {
        errores.push(`El prospecto fue referido por ${scenario.referidor}, pero no lo mencionaste al inicio para generar confianza.`);
      }
    }

    // Criterio 2: Posicionamiento como Asesoría Financiera Personalizada (+20)
    const asesoriaWords = ['asesoría', 'asesoria', 'financiera', 'patrimonial', 'asesor', 'personalizada', 'análisis', 'diagnóstico', 'diagnostico'];
    if (asesoriaWords.some(w => agentMessages.includes(w))) {
      score += 20;
      aciertos.push('Posicionaste la llamada como una asesoría personalizada y no como venta telefónica.');
    } else {
      errores.push('Faltó enfatizar que en AACOM brindamos una asesoría financiera personalizada.');
    }

    // Criterio 3: Diagnóstico antes de Recetar / Amplitud de soluciones (+25)
    const palabrasVariedad = [
      'tantos productos', 'tantas soluciones', 'tantas opciones', 'tanta variedad',
      'muchos productos', 'muchas soluciones', 'muchas opciones', 'amplia gama', 'amplio portafolio',
      'variedad de soluciones', 'diferentes opciones', 'diversas opciones', 'diferentes soluciones',
      'diversas soluciones', 'diferentes productos', 'diversos productos', 'múltiples soluciones',
      'multiples soluciones', 'portafolio', 'abanico', 'varias soluciones', 'varios productos'
    ];
    const palabrasDiagnostico = [
      'sin conocer', 'sin conocerlo', 'sin conocerla', 'sin saber', 'más acertado', 'mas acertado',
      'le acomoda', 'le conviene', 'más adecuado', 'mas adecuado', 'necesita', 'requiere',
      'diagnóstico', 'diagnostico', 'conocer su situación', 'conocer sus metas', 'conocer sus necesidades',
      'conocer sus prioridades', 'revisar primero', 'analizar primero', 'platicar primero', 'platicar con usted',
      'conocerle', 'conocerlo primero', 'evaluar su caso', 'ver qué necesita', 'ver que necesita',
      'sería irresponsable', 'seria irresponsable', 'imposible saber', 'imposible darle', 'a ciegas'
    ];

    const tieneVariedad = palabrasVariedad.some(w => agentMessages.includes(w));
    const tieneDiagnostico = palabrasDiagnostico.some(w => agentMessages.includes(w));

    if (tieneVariedad && tieneDiagnostico) {
      score += 25;
      aciertos.push('Excelente argumento: Explicaste que manejan tantas opciones que sería irresponsable recomendar una sin conocer su situación primero.');
    } else {
      errores.push('Faltó el principio de diagnóstico antes de recetar: explica que manejamos tantas soluciones que no puedes recomendar nada sin conocerlo.');
    }

    // Criterio 4: Cierre con Doble Alternativa y tiempo de 30-40 min (+15)
    const alternativas = ['martes', 'miércoles', 'miercoles', 'jueves', 'viernes', 'lunes', 'sábado', 'sabado', 'mañana', 'tarde', 'en la mañana', 'en la tarde'];
    const tiempos = ['30', '40', 'treinta', 'cuarenta', 'media hora'];
    const ofreceAlternativa = alternativas.filter(a => agentMessages.includes(a)).length >= 2;
    const estipulaTiempo = tiempos.some(t => agentMessages.includes(t));

    if (ofreceAlternativa && estipulaTiempo) {
      score += 15;
      aciertos.push('Cierre impecable: Propusiste una reunión de 30-40 min dando dos opciones de horario (doble alternativa).');
    } else if (ofreceAlternativa || estipulaTiempo) {
      score += 8;
      if (!ofreceAlternativa) errores.push('Ofrece siempre dos alternativas concretas de horario (ej: "¿martes por la mañana o jueves por la tarde?").');
      if (!estipulaTiempo) errores.push('Aclara siempre que la reunión solo tomará 30 a 40 minutos.');
    } else {
      errores.push('Faltó proponer rango de tiempo de 30-40 minutos y dar doble alternativa de horario.');
    }

    // --- PENALIZACIONES SEVERAS ---

    // Penalización 1: Venta Prematura de Producto (-30 pts)
    const palabrasProducto = ['ppr', 'seguro de vida', 'te ofrezco un seguro', 'te vendo', 'venderte', 'te cotizo', 'cotización', 'cotizacion', 'gastos médicos', 'gastos medicos', 'póliza', 'poliza'];
    const productosMencionados = palabrasProducto.filter(w => agentMessages.includes(w));
    if (productosMencionados.length > 0) {
      score = Math.max(0, score - 30);
      errores.push(`Venta prematura de producto: Preguntaste directamente por "${productosMencionados.join(', ')}". En prospección nunca se ofrece un producto ni se pregunta "¿ya tienes PPR?"; el objetivo es vender la reunión de diagnóstico.`);
    }

    // Penalización 2: Pérdida de Postura Ejecutiva / Ruego (-25 pts)
    const palabrasRuego = ['no me cuelgues', 'no me cuelgue', 'por favor escúchame', 'por favor escuchame', 'dame 30 minutos', 'dame 40 minutos', 'dame chance', 'no seas malo', 'no seas mala'];
    const ruegosDetectados = palabrasRuego.filter(w => agentMessages.includes(w));
    if (ruegosDetectados.length > 0) {
      score = Math.max(0, score - 25);
      errores.push(`Pérdida de postura ejecutiva: Usaste frases de ruego o insistencia desesperada ("${ruegosDetectados.join(', ')}"). Mantén siempre postura profesional y de valor.`);
    }

    // Penalización 3: Fuga de datos técnicos / cifras (-20 pts)
    const penalizadas = ['suma asegurada', 'cobertura de', 'prima de', 'deducible', 'cuesta pesos', 'pesos mensuales', 'udi', 'udis'];
    const infracciones = penalizadas.filter(w => agentMessages.includes(w));
    if (infracciones.length > 0) {
      score = Math.max(0, score - 20);
      errores.push(`Fuga de datos técnicos: soltaste términos que no corresponden a una llamada telefónica (${infracciones.join(', ')}).`);
    }

    // Criterio 5: Cita Conseguida en el diálogo (+10)
    const cierreFrases = [
      'me parece bien', 'anótelo', 'anotelo', 'el jueves a las', 'el martes a las',
      'déjeme anotarlo', 'dejeme anotarlo', 'agendado', 'le espero', 'con gusto lo recibo',
      'anótalo', 'anotalo', 'nos vemos entonces'
    ];
    const rechazoFrases = [
      'no me interesa', 'no insista', 'no me haga perder', 'no puedo atenderlo', 'tengo que colgar', 'hasta luego', 'no gracias'
    ];

    const tieneFraseCierre = cierreFrases.some(f => prospectMessages.includes(f));
    const tieneRechazoFinal = rechazoFrases.some(f => prospectMessages.includes(f));

    // Solo se valida cita si NO hubo errores fatales (venta prematura o ruego) y hubo frase de cierre sin rechazo final
    const appointmentClosed = tieneFraseCierre && !tieneRechazoFinal && productosMencionados.length === 0 && ruegosDetectados.length === 0;

    if (appointmentClosed) {
      score += 10;
      aciertos.push('¡Cita Concretada con Éxito! El prospecto reservó la fecha en su agenda sin objeciones pendientes.');
    } else if (tieneRechazoFinal) {
      errores.push('Llamada cerrada sin cita: El prospecto rechazó la propuesta o dio por terminada la llamada.');
    }

    // Score final normalizado 0 - 100
    const finalScore = Math.min(100, Math.max(0, score));

    // Cálculo calibrado de XP:
    // Cita cerrada: 85 - 110 XP
    // Buen intento sin cierre: 35 - 55 XP
    // Mínimo intento: 15 - 25 XP
    let xpEarned = 0;
    if (finalScore >= 80) {
      xpEarned = appointmentClosed ? 95 : 65;
    } else if (finalScore >= 50) {
      xpEarned = appointmentClosed ? 75 : 45;
    } else {
      xpEarned = 20;
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

    const availableXpToday = Math.max(0, DAILY_XP_CAP - todayXp);
    const effectiveXpEarned = Math.min(xpEarned, availableXpToday);

    const newTotalXp = stats.xp + effectiveXpEarned;
    const newLevel = calculateLevelFromXp(newTotalXp);

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
        todayXp: todayXp + effectiveXpEarned,
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
