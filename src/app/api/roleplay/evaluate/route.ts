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
      engine = 'GEMINI_LIVE',
      callAudioUrl = null
    } = body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, agencyId: true, voiceSecondsBalance: true }
    });
    const agencyId = user?.agencyId || null;

    const userTurns = transcript.filter((m: any) => m.source === 'user');
    const agentMessages = userTurns.map((m: any) => (m.message || '').toLowerCase()).join(' ');

    const todayStr = getLocalDateString();

    // 1. CONTROL: Solo si la llamada fue colgada inmediatamente o duró menos de 8 segundos sin interactuar
    const isVeryShort = durationSeconds < 8;
    const hasMeaningfulDuration = durationSeconds >= 20;
    const userSpokeEnough = userTurns.length > 0 && agentMessages.trim().length >= 8;

    if (isVeryShort || (!hasMeaningfulDuration && !userSpokeEnough)) {
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
          callAudioUrl: callAudioUrl || null,
          transcript,
          aciertos: [],
          errores: ['Llamada colgada sin interactuar o menor a 8 segundos.'],
          coachTip: 'Para recibir evaluación y ganar puntos de experiencia es indispensable dialogar con el prospecto.',
          objectionHandled: false,
          appointmentClosed: false
        }
      });

      const stats = await prisma.roleplayStats.findUnique({ where: { userId } });

      return NextResponse.json({
        success: true,
        callId: emptyCall.id,
        callAudioUrl: emptyCall.callAudioUrl || callAudioUrl || null,
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
    let transcriptText = transcript.map((m: any) => `${m.source === 'user' ? 'Asesor' : 'Prospecto'}: ${m.message}`).join('\n');
    if (!transcriptText || userTurns.length === 0) {
      transcriptText = `[Sesión telefónica completada por el Asesor con una duración de ${durationSeconds} segundos con el prospecto ${scenario?.prospecto?.nombre || 'Prospecto'}. El asesor dialogó y sostuvo la llamada activamente por voz.]\n` + (transcriptText || '');
    }

    let evalInstructions = '';
    if (moduleId === 'adn') {
      evalInstructions = `
      Módulo: Análisis de Necesidades (ADN) - Metodología Consultiva (Apertura Estratégica, Avance Temporal y Cierre).
      La llamada consta de Fase 1 (Apertura y F.O.R.D.), Transición Narrativa en Off, y Fase 2 (Conclusión y Cierre de 2da Cita).
      El asesor DEBE:
      1. PRESENTACIÓN FORMAL & CONFIDENCIALIDAD: Saludar con profesionalismo, presentarse formalmente y garantizar que la sesión y sus datos son estrictamente confidenciales.
      2. PROPÓSITO DEL DIAGNÓSTICO A LA MEDIDA: Explicar con claridad que la reunión es para realizar un diagnóstico de su situación actual para diseñar una propuesta a su medida (cero productos de catálogo hoy).
      3. TÉCNICA F.O.R.D. (Familia, Ocupación, Recreación y Sueños / Dinero): Indagar quién depende de él, su trabajo o negocio, proyectos de vida y metas patrimoniales.
      4. PRIORIZACIÓN DE METAS: Pedirle explícitamente al prospecto que jerarquice u ordene cuál de sus metas o inquietudes es su PRIORIDAD #1 hoy en día.
      5. ESCUCHA ACTIVA: Demostrar escucha activa y respeto, guardando silencio para dejar reflexionar y expresarse al prospecto sin interrumpir ni encimarse.
      6. CIERRE DE LA REUNIÓN DE ADN CON DOBLE ALTERNATIVA: Tras la transición narrativa de números, indicar que se llevará los datos a su despacho para armar la propuesta personalizada y agendar la Cita de Presentación / Cierre con técnica de doble alternativa (día y hora concretos).
      ERRORES FATALES: Vender pólizas, cotizar seguros o aseguradoras durante el diagnóstico, no garantizar confidencialidad o interrumpir constantemente al prospecto.`;
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
      aplicoTecnicaFord: z.boolean().describe('Verdadero si el asesor exploró activamente dimensiones de la vida del prospecto: Familia, Ocupación, Recreación o Sueños/Dinero (F.O.R.D.).').default(false),
      priorizoMetas: z.boolean().describe('Verdadero si el asesor le pidió explícitamente al prospecto ordenar o priorizar cuál es su meta o preocupación #1 en la vida.').default(false),
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

    const rawObject = object as any;
    let score: number = rawObject.score;
    let aciertos: string[] = rawObject.aciertos || [];
    let errores: string[] = rawObject.errores || [];
    let cometioErrorFatal: boolean = rawObject.cometioErrorFatal || false;
    let appointmentClosed: boolean = rawObject.appointmentClosed || false;
    let coachTip: string = rawObject.coachTip || '';
    let insigniasGanadas: string[] = rawObject.insigniasGanadas || [];
    const aplicoTecnicaFord: boolean = rawObject.aplicoTecnicaFord || false;
    const priorizoMetas: boolean = rawObject.priorizoMetas || false;

    let bonusXp = 0;
    if (moduleId === 'adn') {
      if (aplicoTecnicaFord) {
        bonusXp += 35;
        if (!aciertos.some((a: string) => a.toLowerCase().includes('ford'))) {
          aciertos.push('Excelente aplicación de la técnica F.O.R.D. para descubrir el entorno y prioridades del cliente (+35 XP).');
        }
      }
      if (priorizoMetas) {
        bonusXp += 35;
        if (!aciertos.some((a: string) => a.toLowerCase().includes('priorid') || a.toLowerCase().includes('jerarqu'))) {
          aciertos.push('Excelente jerarquización de metas al pedir al prospecto definir su prioridad #1 (+35 XP).');
        }
      }
    }

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
    const uniqueNewBadges = insigniasGanadas.filter((b: string) => !currentBadges.includes(b));
    const mergedBadges = [...currentBadges, ...uniqueNewBadges];

    // Ponderación de XP por módulo: ADN y Cierre reciben +25% por mayor duración y profundidad (15-20 min vs 3 min)
    const isHighDurationModule = moduleId === 'adn' || moduleId === 'objeciones';
    const xpMultiplier = isHighDurationModule ? 1.25 : 1.0;

    let xpEarned = Math.floor(score * 1.5 * xpMultiplier) + bonusXp;
    if (appointmentClosed) {
      xpEarned += Math.floor(50 * xpMultiplier); // +62 XP por concretar ADN o Cierre exitoso
    }
    
    const minRealisticSeconds = moduleId === 'adn' ? 45 : moduleId === 'objeciones' ? 30 : 12;
    if (durationSeconds < minRealisticSeconds && appointmentClosed) {
      appointmentClosed = false;
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
        callAudioUrl: callAudioUrl || null,
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
      callAudioUrl: roleplayCall.callAudioUrl || callAudioUrl || null,
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