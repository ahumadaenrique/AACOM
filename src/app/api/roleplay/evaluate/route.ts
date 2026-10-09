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
      moduleId = 'prospeccion'
    } = body;

    const userTurns = transcript.filter((m: any) => m.source === 'user');
    const agentMessages = userTurns.map((m: any) => (m.message || '').toLowerCase()).join(' ');

    const todayStr = getLocalDateString();

    // 1. CONTROL ESTRICTO: Si el agente no habló o colgó de inmediato
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
      Módulo: Análisis de Necesidades (ADN) - Metodología Patrimonial AACOM.
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
      Módulo: Objeciones y Cierre.
      El asesor DEBE:
      1. Mostrar empatía y validar la objeción inicial del prospecto.
      2. Aislar la objeción ("¿además de eso, hay algo más?").
      3. Usar una técnica de rebote (revertir la objeción mostrando valor o casos de éxito).
      4. Usar un cierre asumido (ej. "¿a qué tarjeta hacemos el cargo?" o "empecemos el trámite").
      ERRORES FATALES: Discutir, pelear o decirle al prospecto que está equivocado.`;
    } else {
      evalInstructions = `
      Módulo: Prospección Telefónica.
      El asesor DEBE:
      1. Presentarse profesionalmente.
      2. Si es referido, mencionar el nombre de quien lo recomienda oportunamente.
      3. Posicionar el valor de la asesoría (vender la cita, no la póliza).
      4. Manejar objeciones de tiempo.
      5. Cerrar con doble alternativa de horario (ej. "¿jueves a las 4 o viernes a las 10?").
      ERRORES FATALES: Usar jerga técnica, rogar por tiempo, o aceptar que el prospecto "le avise después".`;
    }

    const EvaluationSchema = z.object({
      score: z.number().min(0).max(100).describe('Calificación del 0 al 100 basada en la calidad del desempeño del asesor.'),
      aciertos: z.array(z.string()).describe('Lista de 1 a 3 cosas que el asesor hizo muy bien.'),
      errores: z.array(z.string()).describe('Lista de errores cometidos por el asesor. OBLIGATORIO: Debes incluir una cita textual (entre comillas) de la transcripci�n para demostrar exactamente en qu� momento cometi� el error.'),
      cometioErrorFatal: z.boolean().describe('Verdadero si el asesor cometió un error crítico según las instrucciones del módulo.'),
      appointmentClosed: z.boolean().describe('Verdadero SOLAMENTE si el asesor logró concretar explícitamente la agenda de la cita o el cierre (trámite/pago). No debe ser verdadero si el prospecto dijo "yo te aviso".'),
      coachTip: z.string().describe('Un consejo breve y técnico.'),
      insigniasGanadas: z.array(z.string()).describe('Lista de IDs de insignias desbloqueadas en la llamada. Devuelve solo los IDs. Si no ganó, devuelve []')
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
Adicionalmente, revisa si el asesor logró alguna de estas insignias en esta llamada y devuelve sus IDs:
${badgesText}`;

    const { object } = await generateObject({
      model: google('gemini-3.5-flash-lite'),
      schema: EvaluationSchema,
      prompt: promptText
    });

    let { score, aciertos, errores, cometioErrorFatal, appointmentClosed, coachTip, insigniasGanadas = [] } = object;

    const stats = await prisma.roleplayStats.findUnique({ where: { userId } });
    // Deduplicar insignias
    const currentBadges = stats?.badges || [];
    const uniqueNewBadges = insigniasGanadas.filter(b => !currentBadges.includes(b));
    const mergedBadges = [...currentBadges, ...uniqueNewBadges];

    if (cometioErrorFatal) {
      score = Math.max(0, score - 50);
    }
    
    if (!appointmentClosed && score > 80) {
      score = 75;
    }

    let xpEarned = Math.floor(score * 1.5);
    if (appointmentClosed) xpEarned += 50;
    
    if (durationSeconds < 25 && appointmentClosed) {
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

    let actualXpToAdd = xpEarned;
    if (todayXp + xpEarned > DAILY_XP_CAP) {
      actualXpToAdd = Math.max(0, DAILY_XP_CAP - todayXp);
    }

    currentXp += actualXpToAdd;
    todayXp += actualXpToAdd;
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
        todayCallsCount,
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
        todayCallsCount: 1,
        totalCalls: 1,
        closedCalls: appointmentClosed ? 1 : 0,
        lastActiveDate: todayStr
      }
    });

    const roleplayCall = await prisma.roleplayCall.create({
      data: {
        userId,
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