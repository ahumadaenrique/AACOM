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

    // Criterio 0: Mención de referidor si aplicaba (+15)
    if (scenario?.origen?.tipo === 'referido_avisado' && scenario?.referidor) {
      const refWords = scenario.referidor.toLowerCase().split(' ');
      if (refWords.some((w: string) => w.length > 3 && agentMessages.includes(w))) {
        score += 15;
        aciertos.push(`Mencionaste a ${scenario.referidor} oportunamente para romper la barrera del prospecto.`);
      } else {
        errores.push(`El prospecto ya sabía de la llamada de parte de ${scenario.referidor}, pero no lo mencionaste al inicio.`);
      }
    }

    // Criterio 1: Posicionamiento como Asesoría Financiera Personalizada (+25)
    const asesoriaWords = ['asesoría', 'asesoria', 'financiera', 'patrimonial', 'asesor', 'personalizada', 'análisis'];
    if (asesoriaWords.some(w => agentMessages.includes(w))) {
      score += 25;
      aciertos.push('Presentaste la llamada como una asesoría financiera personalizada y no como venta fría de un producto.');
    } else {
      errores.push('Faltó enfatizar que en AACOM brindamos una asesoría financiera personalizada.');
    }

    // Criterio 2: Diagnóstico antes de Recetar / Amplitud de soluciones (+25)
    const palabrasVariedad = [
      'tantos productos', 'tantas soluciones', 'tantas opciones', 'tanta variedad', 'tantos',
      'muchos productos', 'muchas soluciones', 'muchas opciones', 'amplia gama', 'amplio portafolio',
      'variedad de soluciones', 'diferentes opciones', 'diversas opciones', 'diferentes soluciones',
      'diversas soluciones', 'diferentes productos', 'diversos productos', 'múltiples soluciones',
      'multiples soluciones', 'portafolio', 'abanico', 'varias soluciones', 'varios productos',
      'soluciones', 'productos', 'opciones'
    ];
    const palabrasDiagnostico = [
      'sin conocer', 'sin conocerlo', 'sin conocerla', 'sin saber', 'más acertado', 'mas acertado',
      'le acomoda', 'le conviene', 'más adecuado', 'mas adecuado', 'necesita', 'requiere',
      'diagnóstico', 'diagnostico', 'conocer su situación', 'conocer sus metas', 'conocer sus necesidades',
      'conocer sus prioridades', 'revisar primero', 'analizar primero', 'platicar primero', 'platicar con usted',
      'conocerle', 'conocerlo primero', 'evaluar su caso', 'ver qué necesita', 'ver que necesita',
      'sería irresponsable', 'seria irresponsable', 'imposible saber', 'imposible darle', 'no podemos saber'
    ];

    const tieneVariedad = palabrasVariedad.some(w => agentMessages.includes(w));
    const tieneDiagnostico = palabrasDiagnostico.some(w => agentMessages.includes(w));
    const mencionDirecta = agentMessages.includes('tantos') ||
                           agentMessages.includes('imposible') ||
                           agentMessages.includes('sin conocer') ||
                           agentMessages.includes('más acertado') ||
                           agentMessages.includes('le acomoda');

    if ((tieneVariedad && tieneDiagnostico) || mencionDirecta) {
      score += 25;
      aciertos.push('Excelente argumento: Explicaste que tienen tantas soluciones que sería irresponsable recomendar una sin conocer su situación primero.');
    } else {
      errores.push('Faltó el principio de diagnóstico antes de recetar: explica que manejamos tantas soluciones que no puedes recomendar nada sin conocerlo.');
    }

    // Criterio 3: Disciplina telefónica / Evitar fuga de datos técnicos (+20)
    const penalizadas = ['suma asegurada', 'cobertura de', 'prima de', 'deducible', 'cuesta pesos', 'pesos mensuales', 'udi', 'udis'];
    const infracciones = penalizadas.filter(w => agentMessages.includes(w));
    if (infracciones.length > 0) {
      errores.push(`Fuga de información técnica: soltaste términos que no corresponden a prospección telefónica (${infracciones.join(', ')}).`);
    } else {
      score += 20;
      aciertos.push('Mantuviste el control sin soltar cotizaciones ni cifras que ahuyentan al prospecto por teléfono.');
    }

    // Criterio 4: Cierre con Doble Alternativa y tiempo de 30-40 min (+15)
    const alternativas = ['martes', 'miércoles', 'miercoles', 'jueves', 'viernes', 'lunes', 'sábado', 'sabado', 'mañana', 'tarde', 'en la mañana', 'en la tarde', '10', '11', '4', '5'];
    const tiempos = ['30', '40', 'treinta', 'cuarenta', 'media hora'];
    const ofreceAlternativa = alternativas.filter(a => agentMessages.includes(a)).length >= 2;
    const estipulaTiempo = tiempos.some(t => agentMessages.includes(t));

    if (ofreceAlternativa || estipulaTiempo) {
      score += 15;
      aciertos.push('Propusiste reunión con rango de tiempo adecuado (30-40 min) y opciones de horario.');
    } else {
      errores.push('Recuerda pedir únicamente 30 a 40 minutos y dar doble alternativa de horario.');
    }

    // Criterio 5: Cita Conseguida en el diálogo (+20)
    const cierreFrases = [
      'me parece bien', 'anótelo', 'anotelo', 'el jueves a las', 'el martes a las',
      'déjeme anotarlo', 'dejeme anotarlo', 'agendado', 'le espero', 'con gusto lo recibo'
    ];
    const appointmentClosed = cierreFrases.some(f => prospectMessages.includes(f));
    if (appointmentClosed) {
      score += 20;
      aciertos.push('¡Cita Concretada con Éxito! El prospecto agendó la sesión en su agenda.');
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
