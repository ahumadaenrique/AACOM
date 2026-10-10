import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import {
  calculateLevelFromXp,
  getLocalDateString,
  DAILY_XP_CAP,
  checkAndApplyInactivityPenalty
} from '@/lib/roleplay/gamification';
import { BADGES } from '@/lib/roleplay/badges';
import { generateObject } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { z } from 'zod';

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY
});

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
      moduleId = 'prospeccion',
      engine = 'GEMINI_LIVE'
    } = body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, agencyId: true, voiceSecondsBalance: true }
    });
    const agencyId = user?.agencyId || null;

    const userTurns = transcript.filter((m: any) => m.source === 'user');
    const agentMessages = userTurns.map((m: any) => (m.message || '').toLowerCase()).join(' ');

    const todayStr = getLocalDateString();

    // 1. CONTROL ESTRICTO: Si el agente no habló o colgó de inmediato
    if (userTurns.length === 0 || agentMessages.trim().length < 8 || durationSeconds < 6) {
      const emptyCall = await prisma.roleplayCall.create({
        data: {
          userId,
          agencyId,
          engine,
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

    // 2. EVALUACIÓN CON IA (LLM-as-a-Judge)
    const transcriptText = transcript.map((m: any) => `${m.source === 'user' ? 'Asesor' : 'Prospecto'}: ${m.message}`).join('\n');

    let evalInstructions = '';
    if (moduleId === 'adn') {
      evalInstructions = `
      Módulo: Análisis de Necesidades (ADN) - Metodología Patrimonial Consultiva.
      El asesor DEBE:
      1. POSICIONAMIENTO & REGLA 50-30-20: Explicar que actúa como Asesor Patrimonial y fundamentar el análisis en la Regla 50-30-20 de Elizabeth Warren (50% Necesidades y fijos, 30% Deseos y estilo de vida, 20% Ahorro y protección futura) como estándar de oro mundial.
      2. PERMISO DIAGNÓSTICO: Pedir permiso formal y explícito para realizar las preguntas del cuestionario financiero.
      3. FLEXIBILIDAD EN GASTOS: Preguntar a detalle si el cliente lo permite, o tener la habilidad de resumir en bloques grandes (Vivienda, Transporte, Educación, Estilo de vida) si el prospecto se resiste al desglose de centavos.
      4. MANEJO DE RESISTENCIA Y CONFIDENCIALIDAD: Si el cliente duda en revelar sus finanzas, garantizar confidencialidad y usar la analogía médica ("somos médicos patrimoniales, no podemos recetar una solución sin un análisis previo").
      5. DETECCIÓN DEL DOLOR: Indagar y escuchar profundamente para descubrir la necesidad prioritaria del prospecto (Retiro/PPR, Blindaje familiar por fallecimiento/invalidez, Fondo universitario para hijos, o Desorden de deudas).
      6. CAPACIDAD DE AHORRO: Calcular o consensuar el monto real que el cliente puede comprometer al ahorro mensual para su futuro.
      7. CIERRE DE LA REUNIÓN DE ADN: Indicar que se llevará la información a su despacho para diseñar una estrategia personalizada y agendar la Cita de Presentación/Cierre con doble alternativa de horario.
      ERRORES FATALES: Vender pólizas, dar costos o cotizar aseguradoras durante el diagnóstico, o discutir con el cliente si este prefiere resumir gastos en lugar de dar centavos.`;
    } else if (moduleId === 'objeciones') {
      evalInstructions = `
      Módulo: Cierre de Ventas y Manejo de Objeciones - Metodología Consultiva.
      El asesor DEBE:
      1. VALIDACIÓN EMPÁTICA: Recibir la resistencia o cortina de humo inicial del prospecto ("déjame pensarlo", "está caro", "lo consulto con mi esposa") con serenidad y empatía profesional. Jamás confrontar ni molestarse.
      2. AISLAMIENTO QUIRÚRGICO DE LA OBJECIÓN: Preguntar con precisión si además de ese tiempo para pensar o consultar existe alguna otra inquietud sobre el plan, sumas aseguradas o costos, para despejar la cortina de humo y llegar a la objeción de raíz.
      3. TÉCNICA DE REBOTE Y VALOR: Desmantelar la duda de fondo utilizando técnicas reconocidas de la industria:
         - Técnica del Boomerang (convertir la misma objeción en la razón primordial para contratar hoy).
         - Siente - Sentían - Comprobaron (validar casos de éxito de clientes similares).
         - Reducción al Absurdo / Costo Diario (dividir la prima en un costo diario accesible de $100-$200 pesos vs un café/comida).
         - Costo de la Inacción (recordar que la edad y la salud no se congelan y el riesgo corre desde hoy).
         - Blindaje vs Inversión (separar ahorro garantizado con indemnización por fallecimiento/invalidez de instrumentos especulativos como CETES o bienes raíces).
      4. CIERRE ASUMIDO CON DOBLE ALTERNATIVA: Al percibir la apertura o resolución de dudas, no quedarse pasivo esperando que el cliente compre solo; debe empujar el cierre con doble alternativa de trámite o método de pago (ej: "¿Te queda mejor domiciliarlo a tarjeta de crédito para acumular puntos o con cuenta de débito?", "¿Iniciamos con tu RFC personal o facturamos a la empresa?").
      ERRORES FATALES:
      - Rendirse y decir frases pasivas como "Bueno, piénsalo y me avisas", "Mándame un WhatsApp cuando gustes" o dejar la decisión abierta sin rebatir.
      - Discutir, pelear o decirle al prospecto que está equivocado.
      - Bajar la prima o suma asegurada de inmediato sin haber defendido el valor del proyecto primero.`;
    } else {
      evalInstructions = `
      Módulo: Prospección Telefónica.
      El asesor DEBE:
      1. Presentarse profesionalmente (mencionando su nombre y el de su promotoría o despacho).
      2. Si es referido, mencionar el nombre de quien lo recomienda oportunamente.
      3. Posicionar el valor de la asesoría (vender la cita, no la póliza).
      4. Manejar objeciones de tiempo.
      5. Cerrar con doble alternativa de horario (ej. "¿jueves a las 4 o viernes a las 10?").
      ERRORES FATALES: Usar jerga técnica, rogar por tiempo, o aceptar que el prospecto "le avise después".`;
    }

    const EvaluationSchema = z.object({
      score: z.number().min(0).max(100).describe('Calificación del 0 al 100 basada en la calidad del desempeño del asesor.'),
      aciertos: z.array(z.string()).describe('Lista de 1 a 3 cosas que el asesor hizo muy bien.'),
      errores: z.array(z.string()).describe('Lista de errores cometidos por el asesor. OBLIGATORIO: Debes incluir una cita textual (entre comillas) de la transcripción para demostrar exactamente en qué momento cometió el error.'),
      cometioErrorFatal: z.boolean().describe('Verdadero si el asesor cometió un error crítico según las instrucciones del módulo.'),
      appointmentClosed: z.boolean().describe('Verdadero SOLAMENTE si el asesor logró concretar explícitamente la agenda de la cita o el cierre mediante técnica profesional (ej. doble alternativa de horario). Debe ser FALSO si el prospecto sugirió la cita o el horario por su cuenta sin que el asesor lo propusiera, si el asesor rogó/titubeó, o si el prospecto dijo "yo te aviso".'),
      coachTip: z.string().describe('Un consejo breve y técnico.'),
      insigniasGanadas: z.array(z.string()).describe('Lista de IDs de insignias desbloqueadas. COMO MÁXIMO 1 insignia por llamada, y SOLAMENTE si score >= 85 y la cita cerró con éxito. Si no califica o no cerró la cita, devuelve []')
    });

    const moduleBadges = BADGES.filter(b => b.moduleId === moduleId || b.moduleId === 'general');
    const badgesText = moduleBadges.map(b => `- ${b.id}: ${b.name} (${b.description})`).join('\n');

    const promptText = `Eres un Master Coach de Ventas de Seguros evaluando una simulación de rol entre un Asesor y un Prospecto.
Evalúa la siguiente transcripción basándote estrictamente en esta rúbrica:

${evalInstructions}

<transcripcion>
${transcriptText}
</transcripcion>

Extrae la calificación, aciertos, errores, si hubo error fatal y si se logró la cita. Sé un juez imparcial y estricto.

### REGLAS ESTRICTAS PARA CONCESIÓN DE INSIGNIAS (DIFICULTAD MÁXIMA - RETO DE 30 DÍAS):
- Las insignias son trofeos de élite y no se regalan. Para mantener una progresión que le tome a los asesores cerca de 1 mes:
1. CONDICIÓN PREVIA OBLIGATORIA: Si appointmentClosed es false, o si score es menor a 85, o si la llamada no concluyó el proceso completo, TIENES ESTRICTAMENTE PROHIBIDO OTORGAR INSIGNIAS. Devuelve insigniasGanadas: [].
2. LÍMITE DE 1 INSIGNIA: Incluso en una sesión sobresaliente (score >= 85 y cita cerrada), el asesor puede recibir COMO MÁXIMO UNA (1) SOLA INSIGNIA en toda la llamada. Selecciona únicamente la insignia que mejor demuestre su técnica más destacada.
3. NUNCA devuelvas más de una insignia por intento.

Catálogo disponible:
${badgesText}`;

    const { object } = await generateObject({
      model: google('gemini-3.8-flash'),
      schema: EvaluationSchema,
      prompt: promptText
    });

    let { score, aciertos, errores, cometioErrorFatal, appointmentClosed, coachTip, insigniasGanadas = [] } = object;

    if (cometioErrorFatal) {
      score = Math.max(0, score - 50);
    }
    
    if (!appointmentClosed && score > 80) {
      score = 75;
    }

    // Validación estricta en servidor de insignias ganadas:
    // Requiere cita lograda, score >= 85 y máximo 1 insignia por llamada para progresión paulatina de 1 mes
    if (!appointmentClosed || score < 85) {
      insigniasGanadas = [];
    } else {
      insigniasGanadas = insigniasGanadas.slice(0, 1);
    }

    const stats = await prisma.roleplayStats.findUnique({ where: { userId } });
    // Deduplicar insignias
    const currentBadges = stats?.badges || [];
    const uniqueNewBadges = insigniasGanadas.filter(b => !currentBadges.includes(b));
    const mergedBadges = [...currentBadges, ...uniqueNewBadges];

    // Ponderación de XP por módulo: ADN y Cierre reciben +25% por mayor duración y profundidad (15-20 min vs 3 min)
    const isHighDurationModule = moduleId === 'adn' || moduleId === 'objeciones';
    const xpMultiplier = isHighDurationModule ? 1.25 : 1.0;

    let xpEarned = Math.floor(score * 1.5 * xpMultiplier);
    if (appointmentClosed) {
      xpEarned += Math.floor(50 * xpMultiplier); // +62 XP por concretar ADN o Cierre exitoso
    }
    
    const minRealisticSeconds = moduleId === 'adn' ? 90 : moduleId === 'objeciones' ? 60 : 25;
    if (durationSeconds < minRealisticSeconds && appointmentClosed) {
      xpEarned = 0;
    }

    let currentXp = stats?.xp || 0;
    let todayXp = stats?.todayXp || 0;
    let todayCallsCount = stats?.todayCallsCount || 0;
    let closedCalls = stats?.closedCalls || 0;
    let streak = stats?.streak || 0;
    const lastActiveDate = stats?.lastActiveDate || '';
    if (lastActiveDate !== todayStr) {
      const { newStreak, newXp: xpAfterPenalty } = checkAndApplyInactivityPenalty(stats || { xp: 0, streak: 0, lastActiveDate: '' });
      streak = newStreak;
      currentXp = xpAfterPenalty;
      todayXp = 0;
      todayCallsCount = 0;
    }

    // CONTROL ESTRICTO: Límite de 500 XP diaria verificado contra llamadas reales del día
    const recentCalls = await prisma.roleplayCall.findMany({
      where: {
        userId,
        createdAt: { gte: new Date(Date.now() - 36 * 60 * 60 * 1000) }
      },
      select: { xpEarned: true, createdAt: true }
    });

    const xpEarnedTodayFromCalls = recentCalls
      .filter(c => getLocalDateString(c.createdAt) === todayStr)
      .reduce((sum, c) => sum + (c.xpEarned || 0), 0);

    const effectiveTodayXp = Math.max(todayXp, xpEarnedTodayFromCalls);
    const remainingDailyXp = Math.max(0, DAILY_XP_CAP - effectiveTodayXp);
    const actualXpToAdd = Math.min(xpEarned, remainingDailyXp);

    currentXp += actualXpToAdd;
    todayXp = Math.min(DAILY_XP_CAP, effectiveTodayXp + actualXpToAdd);
    todayCallsCount += 1;

    if (appointmentClosed) {
      closedCalls += 1;
    }

    const currentLevel = calculateLevelFromXp(currentXp);

    const updatedStats = await prisma.roleplayStats.upsert({
      where: { userId },
      update: {
        xp: currentXp,
        level: currentLevel,
        badges: mergedBadges,
        streak,
        todayXp,
        todayDate: todayStr,
        todayCallsCount,
        totalCalls: { increment: 1 },
        closedCalls,
        lastActiveDate: todayStr
      },
      create: {
        userId,
        xp: currentXp,
        level: currentLevel,
        badges: mergedBadges,
        streak: score > 30 ? 1 : 0,
        todayXp,
        todayDate: todayStr,
        todayCallsCount: 1,
        totalCalls: 1,
        closedCalls: appointmentClosed ? 1 : 0,
        lastActiveDate: todayStr
      }
    });

    const roleplayCall = await prisma.roleplayCall.create({
      data: {
        userId,
        agencyId,
        engine,
        scenarioId: scenario?.origen?.tipo || 'general',
        prospectName: scenario?.prospecto?.nombre || 'Prospecto',
        scenarioTitle: scenario?.origen?.titulo || 'Módulo de Práctica',
        level: scenario?.difficultyLevel || 1,
        durationSeconds,
        score,
        xpEarned: actualXpToAdd,
        conversationId,
        transcript,
        evaluation: { rawScore: score, cometioErrorFatal },
        aciertos,
        errores,
        coachTip,
        objectionHandled: true,
        appointmentClosed
      }
    });

    // Descontar segundos consumidos si corrió bajo bolsa de AACOM (no BYOK)
    if (durationSeconds > 0 && agencyId) {
      try {
        const agency = await prisma.agency.findUnique({
          where: { id: agencyId },
          select: { id: true, voiceSecondsBalance: true, byokActive: true, elevenLabsApiKey: true }
        });
        const isUsingByok = engine === 'ELEVENLABS' && (agency?.byokActive ?? true) && agency?.elevenLabsApiKey;
        
        if (!isUsingByok) {
          if (agency && agency.voiceSecondsBalance > 0) {
            await prisma.agency.update({
              where: { id: agency.id },
              data: { voiceSecondsBalance: { decrement: Math.min(agency.voiceSecondsBalance, durationSeconds) } }
            });
          } else if (user && user.voiceSecondsBalance > 0) {
            await prisma.user.update({
              where: { id: user.id },
              data: { voiceSecondsBalance: { decrement: Math.min(user.voiceSecondsBalance, durationSeconds) } }
            });
          }
        }
      } catch (e) {
        console.error("Error decrementing voiceSecondsBalance:", e);
      }
    }

    return NextResponse.json({
      success: true,
      callId: roleplayCall.id,
      score,
      xpEarned: actualXpToAdd,
      appointmentClosed,
      aciertos,
      errores,
      coachTip,
      insigniasNuevas: uniqueNewBadges,
      stats: {
        xp: updatedStats.xp,
        level: updatedStats.level,
        streak: updatedStats.streak,
        todayXp: updatedStats.todayXp,
        todayCallsCount: updatedStats.todayCallsCount
      }
    });

  } catch (error: any) {
    console.error('Error evaluating roleplay:', error);
    return NextResponse.json({ error: 'Error interno del servidor evaluando la llamada' }, { status: 500 });
  }
}