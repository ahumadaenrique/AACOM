import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import {
  calculateLevelFromXp,
  getLocalDateString,
  DAILY_XP_CAP,
  checkAndApplyInactivityPenalty,
  calculateConsecutiveBusinessDaysStreak,
  LEVELS_CONFIG
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
        insigniasNuevas: [],
        stats: stats ? {
          xp: stats.xp,
          level: stats.level,
          levelInfo: LEVELS_CONFIG[stats.level],
          streak: stats.streak,
          todayXp: stats.todayXp,
          dailyCap: DAILY_XP_CAP,
          todayCallsCount: stats.todayCallsCount,
          totalCalls: stats.totalCalls,
          closedCalls: stats.closedCalls,
          badges: stats.badges,
          unlockedBenefits: stats.unlockedBenefits
        } : null
      });
    }

    // 2. OBTENER STATS ACTUALES PARA EVALUACIÓN INTELIGENTE DE INSIGNIAS
    const stats = await prisma.roleplayStats.findUnique({ where: { userId } });
    const currentBadges: string[] = stats?.badges || [];

    // Filtrar insignias que el asesor aún tiene pendientes en este módulo
    const moduleBadges = BADGES.filter(b => (b.moduleId === moduleId || b.moduleId === 'general') && b.id !== 'c_maestro');
    const availableBadges = moduleBadges.filter(b => !currentBadges.includes(b.id));
    const badgesText = availableBadges.length > 0
      ? availableBadges.map(b => `- ${b.id}: ${b.name} (${b.description})`).join('\n')
      : '(El asesor ya ha desbloqueado todas las insignias de este módulo)';

    // 3. EVALUACIÓN CON IA (LLM-as-a-Judge)
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
      Módulo: Prospección Telefónica (Llamada para Agendar).
      Evalúa con precisión de auditoría consultiva los siguientes bloques:

      A) LO QUE SÍ DEBE MENCIONAR EL ASESOR OBLIGATORIAMENTE (LOS 5 PILARES):
      1. PRESENTARSE CON SU NOMBRE (pilar1NombreAsesor): Que el agente diga su nombre.
      2. PRESENTAR A LA EMPRESA (pilar2NombreEmpresa): Son 100% VÁLIDAS cualquiera de estas formas: "Grupo AACOM", "AACOM Seguros", "AACOM", "AACOMSoft", el nombre de su promotoría, o transcripciones fonéticas del micrófono como "Acom", "Acomsoft", "Grupo Acom", "Acom Seguros", "Grupo ACO", "Aconseguros", "Grupo A como". NUNCA penalices por la transcripción fonética si dijo alguna de estas.
      3. ORIGEN DEL CONTACTO (pilar3OrigenContacto): Que el agente diga de dónde sacaron sus datos y contacto (referido por alguien, dejó sus datos para informes en internet, o se conocieron en un desayuno/evento).
      4. EXPLICAR DE QUÉ SE TRATA LA ASESORÍA (pilar4ExplicacionAsesoria): Que explique el concepto de la asesoría que le quiere brindar (podría decirle que es una asesoría gratuita, que somos como médicos/doctores de las finanzas, que somos expertos financieros, que somos expertos en finanzas, o que hacemos un diagnóstico de salud financiera y variantes de este estilo). ¡ATENCIÓN! Si el asesor solo dice "quiero agendar una reunión para conocer tus necesidades y hacerte un plan" sin explicar que es una asesoría financiera / diagnóstico financiero / expertos en finanzas, marca pilar4ExplicacionAsesoria = false.
      5. TÉCNICA DE LOS 2 HORARIOS (pilar5DosHorarios): Que aplique la doble alternativa proponiendo dos opciones concretas con día y hora (ej. "¿miércoles a las 10:00 am o jueves a las 5:00 pm?"). Si solo dice días sin hora ("¿lunes o viernes?") o pregunta abierto ("¿cuándo puedes?"), marca pilar5DosHorarios = false.

      B) LO QUE A TODA COSTA DEBE EVITAR (ERRORES FATALES -> cometioErrorFatal = true y appointmentClosed = false):
      1. ENVIAR INFORMACIÓN POR WHATSAPP O CORREO PREVIO A LA CITA (aceptoEnviarInfoWhatsAppOCorreo = true): El asesor JAMÁS debe ceder a mandar folletos, brochures o información por WhatsApp o correo antes de la reunión (enviar un mensaje únicamente para confirmar la dirección/calendario DESPUÉS de que el prospecto ya aceptó el día y la hora SÍ es válido; lo prohibido es enviar información del producto o temario para que el prospecto decida).
      2. MENCIONAR PRODUCTOS EXPLÍCITAMENTE, TASAS O NÚMEROS PREVIOS A LA CITA (mencionoProductosTasasONumeros = true): Está prohibido mencionar productos específicos por teléfono (ej. "seguro de vida", "plan privado de retiro", "seguro de persona clave"), mencionar tasas/porcentajes de rendimiento (ej. "5%"), o mencionar montos/rangos de dinero (ej. "de $1,500 a $50,000" o "de $10,000 a $1 millón").
      3. QUE NO LE DEN LA REUNIÓN (appointmentClosed = false).

      C) MANEJO INTELIGENTE DE OBJECIONES (rebatioObjecionConArgumentoYDosHorarios):
      Verifica que cuando el prospecto lanzó su objeción, el asesor haya respondido con argumentos sólidos y vuelto a cerrar con los 2 horarios:
      - Si dijo "Envíamelo por correo/WhatsApp": Explicar que para enviar algo necesitamos conocer su situación (ej. que la situación de un soltero no es la misma que la de un casado o padre de familia, o que las prioridades de una persona no son las mismas que las de otras) + 2 horarios.
      - Si dijo "¿Qué es? ¿Son seguros?": Mencionar que una parte de nuestro portafolio sí podría ser seguros, pero no forzosamente; que tenemos una gama de productos tan amplia que la solución no solo está enfocada en protección, pero para determinarlo y darle una solución a su medida necesitamos conocer su situación + 2 horarios.
      - Si dijo "No tengo tiempo": Explicar brevemente el valor de la asesoría (médicos de las finanzas / asesoría gratuita breve de 20-30 min) y ofrecer rápidamente 2 opciones de fecha y hora.
      - Si dijo "Por el momento ando muy gastado": Mencionar que justamente nuestra asesoría es para ayudar a personas que necesitan poner orden en sus finanzas personales y que no se preocupe porque no hay ningún compromiso de tener que adquirir algo que no necesita + 2 horarios.
      - Si pidió montos o tasas: Negarse con tacto consultivo explicando que como expertos/médicos de las finanzas todo depende de conocer primero su situación + 2 horarios.`;
    }

    const EvaluationSchema = z.object({
      pilaresProspeccion: z.object({
        pilar1NombreAsesor: z.boolean().describe('Verdadero si el agente se presentó con su nombre.'),
        pilar2NombreEmpresa: z.boolean().describe('Verdadero si el agente presentó a la empresa (Grupo AACOM, AACOM Seguros, AACOMSoft o variante fonética).'),
        pilar3OrigenContacto: z.boolean().describe('Verdadero si el agente dijo de dónde sacaron sus datos/contacto.'),
        pilar4ExplicacionAsesoria: z.boolean().describe('Verdadero si explicó de qué se trata la asesoría financiera (asesoría gratuita, médicos de las finanzas, expertos financieros, diagnóstico de salud financiera). Falso si solo pidió cita sin explicar qué es la asesoría.'),
        pilar5DosHorarios: z.boolean().describe('Verdadero si aplicó la técnica de los 2 horarios con día y hora específicos.')
      }).optional(),
      erroresFatalesProspeccion: z.object({
        aceptoEnviarInfoWhatsAppOCorreo: z.boolean().describe('Verdadero si el asesor cedió a enviar información/brochure por WhatsApp o correo antes de agendar.'),
        mencionoProductosTasasONumeros: z.boolean().describe('Verdadero si el asesor mencionó productos explícitamente (seguros específicos, plan de retiro), tasas de rendimiento (%) o montos/rangos de dinero previos a la cita.'),
        confundioNombreProspecto: z.boolean().describe('Verdadero si el asesor llamó al prospecto por un nombre equivocado (ej. el nombre del referidor).')
      }).optional(),
      rebatioObjecionConArgumentoYDosHorarios: z.boolean().describe('En prospección: verdadero si el asesor rebatió la objeción del prospecto con argumentos sólidos de valor y volvió a ofrecer o confirmar los 2 horarios.').default(true),
      score: z.number().min(0).max(100).describe('Calificación del 0 al 100 basada en la calidad del desempeño del asesor.'),
      aciertos: z.array(z.string()).describe('Lista de 1 a 3 cosas que el asesor hizo muy bien.'),
      errores: z.array(z.string()).describe('Lista de errores u omisiones cometidos por el asesor. OBLIGATORIO: incluye cita textual entre comillas de la transcripción o señala explícitamente qué pilar faltó.'),
      cometioErrorFatal: z.boolean().describe('Verdadero si el asesor cometió un error fatal según las instrucciones del módulo (ej. enviar info previa por WhatsApp/correo o mencionar productos, tasas o montos en prospección).'),
      appointmentClosed: z.boolean().describe('Verdadero SOLAMENTE si el asesor logró concretar explícitamente la agenda de la cita con día y hora mediante técnica profesional, cubrió la explicación de la asesoría y los 2 horarios, Y NO cometió ningún error fatal.'),
      aplicoTecnicaFord: z.boolean().describe('Verdadero si el asesor exploró activamente dimensiones de la vida del prospecto: Familia, Ocupación, Recreación o Sueños/Dinero (F.O.R.D.).').default(false),
      priorizoMetas: z.boolean().describe('Verdadero si el asesor le pidió explícitamente al prospecto ordenar o priorizar cuál es su meta o preocupación #1 en la vida.').default(false),
      coachTip: z.string().describe('Un consejo breve, accionable y técnico.'),
      insigniasGanadas: z.array(z.string()).describe('Lista de IDs de insignias desbloqueadas. COMO MÁXIMO 1 insignia por llamada, y SOLAMENTE si score >= 85 y la cita cerró con éxito. Si no califica o no cerró la cita, devuelve []')
    });


    const promptText = `Eres un Master Coach de Ventas de Seguros evaluando una simulación de rol entre un Asesor y un Prospecto.
Evalúa la siguiente transcripción basándote estrictamente en esta rúbrica:

${evalInstructions}

<transcripcion>
${transcriptText}
</transcripcion>

Extrae la calificación, aciertos, errores, si hubo error fatal y si se logró la cita. Sé un juez imparcial y profesional.

### CATÁLOGO DE INSIGNIAS A EVALUAR:
- Insignias que el asesor YA POSEE (PROHIBIDO volver a otorgar cualquiera de estas):
${currentBadges.length > 0 ? currentBadges.join(', ') : 'Ninguna (el asesor aún no tiene insignias)'}

- Insignias DISPONIBLES que el asesor aún puede desbloquear en esta sesión:
${badgesText}

### REGLAS PARA CONCESIÓN DE INSIGNIA:
1. Si el asesor cometió una falta grave/fatal, DEVUELVE insigniasGanadas: [].
2. Si el asesor demostró con claridad la técnica de ALGUNA de las insignias disponibles (ej. romper el hielo, aislar objeción, técnica F.O.R.D., doble alternativa, resistir el filtro sin ceder info, etc.), indícala en insigniasGanadas (máximo 1).
3. Si no demostró el mérito específico de ninguna insignia disponible, devuelve insigniasGanadas: [].`;

    let rawObject: any = null;
    try {
      let evalResult;
      try {
        evalResult = await generateObject({
          model: google('gemini-3.8-flash'),
          schema: EvaluationSchema,
          prompt: promptText
        });
      } catch (_primaryErr) {
        evalResult = await generateObject({
          model: google('gemini-2.5-flash'),
          schema: EvaluationSchema,
          prompt: promptText
        });
      }
      rawObject = evalResult.object as any;
    } catch (aiErr) {
      console.warn('[Evaluate] Fallback a evaluación heurística local:', aiErr);
      const transcriptList = Array.isArray(transcript) ? transcript : [];
      const aiUtterances = transcriptList.filter((t: any) => t.source === 'ai').map((t: any) => t.message || '').join(' ').toLowerCase();
      const userUtterances = transcriptList.filter((t: any) => t.source === 'user').map((t: any) => t.message || '').join(' ').toLowerCase();

      const hasDoubleAlt = /\b(lunes|martes|mi[eé]rcoles|jueves|viernes|ma[nñ]ana)\b/i.test(userUtterances) && /\b(\d{1,2}|diez|once|doce|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve)\b/i.test(userUtterances);
      const hasFord = userUtterances.includes('familia') || userUtterances.includes('hijo') || userUtterances.includes('trabajo') || userUtterances.includes('meta') || userUtterances.includes('ahorro');
      const hasClosingAgreement = /\b(nos\s+vemos|quedamos\s+entonces|anotado|lo\s+anoto|me\s+queda\s+mejor|agendamos\s+para)\b/i.test(aiUtterances);
      const hasProspectRejection = /\b(no\s+agendo|no\s+voy\s+a\s+agendar|mejor\s+ni\s+agendamos|mejor\s+no\s+agendo|no\s+me\s+da\s+confianza|cuelgo|perd[ií]o\s+para\s+m[ií])\b/i.test(aiUtterances);

      const appointmentAchieved = hasDoubleAlt && hasClosingAgreement && !hasProspectRejection;
      const computedScore = appointmentAchieved ? 88 : (transcriptList.length >= 6 ? 68 : 50);

      rawObject = {
        score: computedScore,
        aciertos: [
          'Postura profesional y fluidez en el desarrollo de la conversación.',
          hasDoubleAlt ? 'Manejo de alternativas concretas de horario para la reunión.' : 'Cordialidad y respeto por los tiempos del prospecto.'
        ],
        errores: [
          !hasDoubleAlt ? 'Asegurar siempre el uso de doble alternativa de horario al agendar.' : (!appointmentAchieved ? 'No se concretó el acuerdo final de fecha y hora con el prospecto.' : '')
        ].filter(Boolean),
        cometioErrorFatal: false,
        appointmentClosed: appointmentAchieved,
        coachTip: appointmentAchieved 
          ? '¡Gran trabajo! Lograste una sesión estructurada y una cita confirmada.' 
          : 'Enfócate en responder directamente la duda del prospecto y cerrar ofreciendo dos horarios específicos.',
        insigniasGanadas: appointmentAchieved && computedScore >= 85 ? ['p_doble_alt'] : [],
        aplicoTecnicaFord: hasFord,
        priorizoMetas: userUtterances.includes('prioridad') || userUtterances.includes('importante') || userUtterances.includes('principal')
      };
    }
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

    if (moduleId === 'prospeccion') {
      const p = rawObject.pilaresProspeccion || {
        pilar1NombreAsesor: true,
        pilar2NombreEmpresa: true,
        pilar3OrigenContacto: true,
        pilar4ExplicacionAsesoria: true,
        pilar5DosHorarios: true
      };
      const ef = rawObject.erroresFatalesProspeccion || {
        aceptoEnviarInfoWhatsAppOCorreo: false,
        mencionoProductosTasasONumeros: false,
        confundioNombreProspecto: false
      };

      // Auditoría determinista en servidor exclusivamente sobre lo que dijo el ASESOR (agentMessages)
      const advisorText = userTurns.map((m: any) => (m.message || '')).join(' ');
      const advisorLower = advisorText.toLowerCase();

      // 1. Detectar si el asesor mencionó productos prohibidos, beneficios fiscales específicos, tasas o montos en Prospección
      const forbiddenProductMatch = advisorText.match(/\b(ppr|plan(?:es)?\s+personal(?:es)?\s+de\s+retiro|plan(?:es)?\s+privado(?:s)?\s+de\s+retiro|plan(?:es)?\s+de\s+retiro|deducible(?:s)?\s+de\s+impuestos|deducir\s+impuestos|seguro\s+de\s+vida|seguro\s+de\s+hombre\s+clave|seguro\s+de\s+persona\s+clave|seguro\s+de\s+gastos\s+m[eé]dicos|insignia\s+life|metlife|allianz|gnp|monterrey\s+new\s+york)\b/i);
      const forbiddenRateOrAmountMatch = advisorText.match(/\b(\d+(?:[.,]\d+)?\s*%|por\s+ciento|tasa\s+de(?:l)?\s+\d|rendimiento\s+de(?:l)?\s+\d|inter[eé]s\s+de(?:l)?\s+\d|\d+\s*mil\s*pesos|mill[oó]n\s+de\s+pesos|pesos\s+mensuales|pesos\s+al\s+mes|pesos\s+anuales|presupuesto\s+de\s+\d)/i);
      const forbiddenPriorInfoMatch = advisorText.match(/\b(ya\s+te\s+mand[eé]\s+un|te\s+acabo\s+de\s+mandar\s+por\s+whatsapp|revisa\s+el\s+brochure|p[aá]same\s+tu\s+correo\s+para\s+mandarte|puedes\s+darme\s+tu\s+direcci[oó]n\s+de\s+correo)/i);

      if (forbiddenProductMatch || forbiddenRateOrAmountMatch) {
        ef.mencionoProductosTasasONumeros = true;
        const snippet = (forbiddenProductMatch?.[0] || forbiddenRateOrAmountMatch?.[0] || '').trim();
        if (!errores.some((e: string) => e.toLowerCase().includes(snippet.toLowerCase()))) {
          errores.unshift(`Error Fatal: Mencionaste productos explícitamente, beneficios fiscales o tasas/montos previos a la cita ("${snippet}"). En la llamada de prospección está prohibido hablar de productos o números.`);
        }
      }

      if (forbiddenPriorInfoMatch) {
        ef.aceptoEnviarInfoWhatsAppOCorreo = true;
        const snippet = forbiddenPriorInfoMatch[0].trim();
        if (!errores.some((e: string) => e.toLowerCase().includes('whatsapp') || e.toLowerCase().includes('correo'))) {
          errores.unshift(`Error Fatal: Cediste a enviar información previa antes de la cita ("${snippet}").`);
        }
      }

      // 2. Verificar determinísticamente en la voz del ASESOR si dijo el origen del contacto (no vale si solo dijo "¿te acuerdas de mí?" y el prospecto lo completó)
      const referidorName = (scenario?.referidor || '').toLowerCase().split(' ').filter((w: string) => w.length > 3);
      const mentionedReferidor = referidorName.some((w: string) => advisorLower.includes(w));
      const mentionedOriginKeywords = /\b(pas[oó]\s+tu\s+contacto|dio\s+tu\s+contacto|comparti[oó]\s+tu\s+contacto|recomend[oó]|habl[oó]\s+de\s+ti|desayuno|evento|conferencia|networking|dejaste\s+tus\s+datos|pediste\s+informes|solicitaste\s+informes|formulario|p[aá]gina|redes\s+sociales|internet|platicamos\s+hace)\b/i.test(advisorText);
      if (!mentionedReferidor && !mentionedOriginKeywords && scenario?.origen?.tipo !== 'frio_total') {
        p.pilar3OrigenContacto = false;
      }

      // 3. Verificar determinísticamente si el ASESOR explicó de qué trata la asesoría financiera
      const mentionedAdvisoryConcept = /\b(asesor[ií]a\s+financiera|asesor[ií]as\s+financieras|asesor[ií]a\s+patrimonial|diagn[oó]stico|salud\s+financiera|m[eé]dicos\s+de\s+las\s+finanzas|doctores\s+de\s+las\s+finanzas|expertos\s+financieros|expertos\s+en\s+finanzas|asesor[ií]a\s+gratuita|orden\s+en\s+tus\s+finanzas|estrategia\s+financiera)\b/i.test(advisorText);
      if (!mentionedAdvisoryConcept) {
        p.pilar4ExplicacionAsesoria = false;
      }

      if (ef?.aceptoEnviarInfoWhatsAppOCorreo) {
        cometioErrorFatal = true;
        if (!errores.some((e: string) => e.toLowerCase().includes('whatsapp') || e.toLowerCase().includes('correo'))) {
          errores.push('Error Fatal: Aceptaste o prometiste enviar información previa por WhatsApp o correo antes de la cita.');
        }
      }
      if (ef?.mencionoProductosTasasONumeros) {
        cometioErrorFatal = true;
        if (!errores.some((e: string) => e.toLowerCase().includes('tasa') || e.toLowerCase().includes('monto') || e.toLowerCase().includes('producto') || e.toLowerCase().includes('rango'))) {
          errores.push('Error Fatal: Mencionaste productos explícitamente, tasas de rendimiento o números/rangos previos a la cita.');
        }
      }
      if (ef?.confundioNombreProspecto) {
        score = Math.max(0, score - 15);
        if (!errores.some((e: string) => e.toLowerCase().includes('nombre'))) {
          errores.push('Confundiste el nombre del prospecto durante la llamada (-15 pts).');
        }
      }

      if (p) {
        if (!p.pilar1NombreAsesor) {
          score = Math.max(0, score - 10);
          if (!errores.some((e: string) => e.toLowerCase().includes('present') || e.toLowerCase().includes('nombre'))) {
            errores.push('Omitiste presentarte con tu nombre al inicio de la llamada.');
          }
        }
        if (!p.pilar2NombreEmpresa) {
          score = Math.max(0, score - 10);
          if (!errores.some((e: string) => e.toLowerCase().includes('empresa') || e.toLowerCase().includes('aacom') || e.toLowerCase().includes('acom'))) {
            errores.push('Omitiste presentar a la empresa (Grupo AACOM / AACOM Seguros / AACOMSoft).');
          }
        }
        if (!p.pilar3OrigenContacto) {
          score = Math.max(0, score - 15);
          appointmentClosed = false;
          if (!errores.some((e: string) => e.toLowerCase().includes('origen') || e.toLowerCase().includes('contacto') || e.toLowerCase().includes('datos') || e.toLowerCase().includes('conocen'))) {
            errores.push('Omitiste mencionar explícitamente de dónde obtuviste sus datos o de dónde se conocen (decir solo "¿te acuerdas de mí?" sin mencionar el desayuno, referido o formulario es incorrecto).');
          }
        }
        if (!p.pilar4ExplicacionAsesoria) {
          score = Math.max(0, score - 15);
          appointmentClosed = false;
          if (!errores.some((e: string) => e.toLowerCase().includes('asesoría') || e.toLowerCase().includes('diagnóstico') || e.toLowerCase().includes('médicos'))) {
            errores.push('Omitiste explicar de qué se trata la asesoría financiera (ej. asesoría gratuita, médicos de las finanzas o expertos financieros).');
          }
        }
        if (!p.pilar5DosHorarios) {
          score = Math.max(0, score - 15);
          appointmentClosed = false;
          if (!errores.some((e: string) => e.toLowerCase().includes('horario') || e.toLowerCase().includes('doble alternativa'))) {
            errores.push('No aplicaste correctamente la técnica de los 2 horarios concretos con día y hora.');
          }
        }
      }

      if (rawObject.rebatioObjecionConArgumentoYDosHorarios === false) {
        score = Math.min(score, 68);
        appointmentClosed = false;
      }
    }

    if (cometioErrorFatal) {
      score = Math.max(0, score - 50);
      appointmentClosed = false;
    }

    if (!appointmentClosed && score > 78) {
      score = 72;
    }

    // Insignias deterministas automáticas por mérito comprobable (si no hubo falta fatal):
    if (!cometioErrorFatal) {
      // 1. Ninja del tiempo: Concluyó la cita en 90 segundos o menos con buena técnica
      if (durationSeconds > 0 && durationSeconds <= 90 && appointmentClosed && score >= 75 && !currentBadges.includes('p_ninja_tiempo')) {
        if (!insigniasGanadas.includes('p_ninja_tiempo')) insigniasGanadas.push('p_ninja_tiempo');
      }
      // 2. Impecable: 100 de calificación en Prospección
      if (score === 100 && moduleId === 'prospeccion' && !currentBadges.includes('p_impecable')) {
        if (!insigniasGanadas.includes('p_impecable')) insigniasGanadas.push('p_impecable');
      }
      // 3. Estratega F.O.R.D. en ADN:
      if (aplicoTecnicaFord && score >= 75 && !currentBadges.includes('a_ford')) {
        if (!insigniasGanadas.includes('a_ford')) insigniasGanadas.push('a_ford');
      }
      // 4. Experto en Prioridades en ADN:
      if (priorizoMetas && score >= 75 && !currentBadges.includes('a_prioridades')) {
        if (!insigniasGanadas.includes('a_prioridades')) insigniasGanadas.push('a_prioridades');
      }
      // 5. Diagnóstico Perfecto: 100 de calificación en ADN
      if (score === 100 && moduleId === 'adn' && !currentBadges.includes('a_perfecto')) {
        if (!insigniasGanadas.includes('a_perfecto')) insigniasGanadas.push('a_perfecto');
      }
      // 6. Contacto Frío Exitoso:
      if (scenario?.origen?.tipo === 'frio' && appointmentClosed && score >= 75 && !currentBadges.includes('p_frio_exitoso')) {
        if (!insigniasGanadas.includes('p_frio_exitoso')) insigniasGanadas.push('p_frio_exitoso');
      }
    }

    // Regla de salvaguarda: si hubo falta grave o score reprobatorio (< 70), anular cualquier insignia
    if (cometioErrorFatal || score < 70) {
      insigniasGanadas = [];
    }

    // Deduplicar, filtrar solo las válidas no obtenidas y limitar a máx 1 nueva por llamada
    const validCatalogIds = new Set(BADGES.map(b => b.id));
    const candidateNewBadges = insigniasGanadas.filter(
      (b: string) => validCatalogIds.has(b) && !currentBadges.includes(b) && b !== 'c_maestro'
    );
    const uniqueNewBadges = candidateNewBadges.slice(0, 1);
    let mergedBadges = [...currentBadges, ...uniqueNewBadges];

    // Otorgar automáticamente la insignia final c_maestro si completó las 34 anteriores
    const regularCatalog = BADGES.filter(b => b.id !== 'c_maestro');
    const regularCompleted = regularCatalog.filter(b => mergedBadges.includes(b.id));
    if (regularCompleted.length >= regularCatalog.length && !mergedBadges.includes('c_maestro')) {
      mergedBadges.push('c_maestro');
      uniqueNewBadges.push('c_maestro');
    }

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
    let closedCalls = stats?.closedCalls || 0;
    let streak = stats?.streak || 0;
    const lastActiveDate = stats?.lastActiveDate || '';

    // CONTROL ESTRICTO: Límite de 500 XP diaria y Racha verificados contra llamadas reales en BD
    const recentCalls = await prisma.roleplayCall.findMany({
      where: {
        userId,
        createdAt: { gte: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000) }
      },
      select: { xpEarned: true, durationSeconds: true, score: true, createdAt: true }
    });

    const todayRealCalls = recentCalls.filter(
      c => getLocalDateString(c.createdAt) === todayStr && (c.durationSeconds >= 8 || (c.score || 0) > 0)
    );
    const xpEarnedTodayFromCalls = todayRealCalls.reduce((sum, c) => sum + (c.xpEarned || 0), 0);

    const activeDateStrings = recentCalls
      .filter(c => c.durationSeconds >= 15 || (c.score || 0) > 0)
      .map(c => getLocalDateString(c.createdAt));
    if (durationSeconds >= 15 || score > 0) {
      activeDateStrings.push(todayStr);
    }
    const historyStreak = calculateConsecutiveBusinessDaysStreak(activeDateStrings, todayStr);

    if (lastActiveDate !== todayStr) {
      const { newStreak, newXp: xpAfterPenalty } = checkAndApplyInactivityPenalty(
        stats || { xp: 0, streak: 0, lastActiveDate: '' }
      );
      currentXp = xpAfterPenalty;
      // Al completar su primera llamada válida del día, incrementa la racha en +1
      streak = score > 0 || durationSeconds >= 15
        ? Math.max(newStreak + 1, historyStreak)
        : Math.max(newStreak, historyStreak);
    } else {
      streak = Math.max(streak, historyStreak, score > 0 || durationSeconds >= 15 ? 1 : 0);
    }

    // La única fuente de verdad del tope diario (500 XP) son las llamadas reales de hoy
    const effectiveTodayXp = Math.min(DAILY_XP_CAP, xpEarnedTodayFromCalls);
    const remainingDailyXp = Math.max(0, DAILY_XP_CAP - effectiveTodayXp);
    const actualXpToAdd = Math.min(xpEarned, remainingDailyXp);

    currentXp += actualXpToAdd;
    const todayXp = Math.min(DAILY_XP_CAP, effectiveTodayXp + actualXpToAdd);
    const todayCallsCount = todayRealCalls.length + 1;

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
        streak: Math.max(1, historyStreak),
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