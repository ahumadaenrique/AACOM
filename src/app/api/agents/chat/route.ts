import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { streamText, tool, generateText, isStepCount } from 'ai'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY
})
import { getGoogleCalendarClient, getGmailClient } from '@/lib/google-clients'

export const maxDuration = 30

function convertUiMessagesToModelMessages(uiMessages: any[]): any[] {
  const modelMessages: any[] = [];

  for (const msg of uiMessages) {
    if (msg.role === 'user') {
      modelMessages.push({
        role: 'user',
        content: msg.content
      });
    } else if (msg.role === 'system') {
      modelMessages.push({
        role: 'system',
        content: msg.content
      });
    } else if (msg.role === 'assistant') {
      if (msg.parts && msg.parts.length > 0) {
        const assistantParts: any[] = [];
        const toolResultParts: any[] = [];

        for (const part of msg.parts) {
          if (part.type === 'text') {
            if (part.text && part.text.trim() !== '') {
              assistantParts.push({
                type: 'text',
                text: part.text
              });
            }
          } else {
            const isToolInvocation = part.type === 'tool-invocation';
            const isNewToolPart = part.type === 'dynamic-tool' || (typeof part.type === 'string' && part.type.startsWith('tool-'));

            if (isToolInvocation) {
              const { toolInvocation } = part;
              assistantParts.push({
                type: 'tool-call',
                toolCallId: toolInvocation.toolCallId,
                toolName: toolInvocation.toolName,
                input: toolInvocation.args
              });

              if (toolInvocation.state === 'result') {
                const output = typeof toolInvocation.result === 'object' && toolInvocation.result !== null
                  ? { type: 'json', value: toolInvocation.result }
                  : { type: 'text', value: String(toolInvocation.result) };

                toolResultParts.push({
                  type: 'tool-result',
                  toolCallId: toolInvocation.toolCallId,
                  toolName: toolInvocation.toolName,
                  output
                });
              }
            } else if (isNewToolPart) {
              let toolName = part.toolName;
              if (!toolName && typeof part.type === 'string' && part.type.startsWith('tool-')) {
                toolName = part.type.slice(5);
              }
              
              assistantParts.push({
                type: 'tool-call',
                toolCallId: part.toolCallId,
                toolName,
                input: part.args !== undefined ? part.args : part.input
              });

              const hasResult = part.state === 'output-available' || part.state === 'result';
              if (hasResult) {
                const resultVal = part.result !== undefined ? part.result : part.output;
                const output = typeof resultVal === 'object' && resultVal !== null
                  ? { type: 'json', value: resultVal }
                  : { type: 'text', value: String(resultVal) };

                toolResultParts.push({
                  type: 'tool-result',
                  toolCallId: part.toolCallId,
                  toolName,
                  output
                });
              }
            }
          }
        }

        if (assistantParts.length > 0) {
          modelMessages.push({
            role: 'assistant',
            content: assistantParts
          });
        } else {
          modelMessages.push({
            role: 'assistant',
            content: msg.content || ''
          });
        }

        if (toolResultParts.length > 0) {
          modelMessages.push({
            role: 'tool',
            content: toolResultParts
          });
        }
      } else {
        // Fallback to checking toolInvocations (from database)
        if (msg.toolInvocations && msg.toolInvocations.length > 0) {
          const assistantParts: any[] = [];
          const toolResultParts: any[] = [];

          for (const inv of msg.toolInvocations) {
            assistantParts.push({
              type: 'tool-call',
              toolCallId: inv.toolCallId,
              toolName: inv.toolName,
              input: inv.args !== undefined ? inv.args : inv.input
            });

            if (inv.state === 'result' || inv.state === 'output-available') {
              const resultVal = inv.result !== undefined ? inv.result : inv.output;
              const output = typeof resultVal === 'object' && resultVal !== null
                ? { type: 'json', value: resultVal }
                : { type: 'text', value: String(resultVal) };

              toolResultParts.push({
                type: 'tool-result',
                toolCallId: inv.toolCallId,
                toolName: inv.toolName,
                output
              });
            }
          }

          modelMessages.push({
            role: 'assistant',
            content: assistantParts
          });

          if (toolResultParts.length > 0) {
            modelMessages.push({
              role: 'tool',
              content: toolResultParts
            });
          }
        } else {
          modelMessages.push({
            role: 'assistant',
            content: msg.content || ''
          });
        }
      }
    }
  }

  return modelMessages;
}

export async function POST(req: Request) {
  try {
    // Load .env variables dynamically in case the Next.js process was started before they were added
    if (!process.env.TAVILY_API_KEY || !process.env.FAL_KEY) {
      try {
        const fs = require('fs');
        const path = require('path');
        const envPath = path.resolve(process.cwd(), '.env');
        if (fs.existsSync(envPath)) {
          const envFile = fs.readFileSync(envPath, 'utf8');
          envFile.split('\n').forEach((line: string) => {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) return;
            const parts = trimmed.split('=');
            if (parts.length >= 2) {
              const key = parts[0].trim();
              const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
              if (key && val) {
                process.env[key] = val;
              }
            }
          });
        }
      } catch (envError) {
        console.error("Failed to load .env manually:", envError);
      }
    }

    const body = await req.json()
    const messages = body.messages
    const url = new URL(req.url)
    const agentId = body.agentId || url.searchParams.get('agentId')

    if (!agentId) {
      return new Response('Agent ID is required', { status: 400 })
    }

    // 1. Fetch Agent
    const agent = await prisma.aIAgent.findUnique({
      where: { id: agentId }
    })

    if (!agent) {
      return new Response('Agent not found', { status: 404 })
    }

    // 1.5 Fetch agent's owner/user to know their agency
    const dbUser = await prisma.user.findUnique({
      where: { id: agent.userId }
    })

    if (!dbUser) {
      return new Response('User not found', { status: 404 });
    }

    const session = await auth();
    if (!session?.user?.email) {
      return new Response('Unauthorized', { status: 401 });
    }

    if (dbUser?.email !== session.user.email && session.user.role !== 'SUPER_ADMIN') {
      return new Response('Forbidden: You do not own this agent.', { status: 403 });
    }

    // 2. Fetch CompanyProfile (Identity) belonging specifically to this user
    const companyProfile = await prisma.companyProfile.findUnique({
      where: { userId: dbUser.id }
    })

    // 3. Fetch Knowledge
    const knowledgeAssets = await prisma.knowledgeAsset.findMany({ where: { agentId: agent.id } })

    // Get Agency Name
    let agencyName = "AACOM"
    if (dbUser?.agencyId) {
      const agency = await prisma.agency.findUnique({
        where: { id: dbUser.agencyId }
      })
      if (agency?.name) {
        agencyName = agency.name
      }
    }

    // 4. Build System Prompt
    let systemPrompt = `Eres un asistente de IA trabajando para la plataforma ${agencyName}.\n\n`
    
    // Role based prompt
    systemPrompt += `ROL PRINCIPAL: Eres un ${agent.type.replace(/_/g, ' ').toLowerCase()}.\n`
    systemPrompt += `Tu nombre es: ${agent.name}.\n\n`

    // Current date/time for time-based calculations (scheduling)
    let mxDate = ''
    let year = ''
    let month = ''
    let day = ''
    try {
      const now = new Date()
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Mexico_City',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).formatToParts(now)

      year = parts.find(p => p.type === 'year')?.value || ''
      month = parts.find(p => p.type === 'month')?.value || ''
      day = parts.find(p => p.type === 'day')?.value || ''
      const hour = parts.find(p => p.type === 'hour')?.value || ''
      const minute = parts.find(p => p.type === 'minute')?.value || ''
      const second = parts.find(p => p.type === 'second')?.value || ''

      mxDate = `${year}-${month}-${day} ${hour}:${minute}:${second}`
    } catch (e) {
      console.warn("Intl timezone not supported, falling back to local time", e)
      const now = new Date()
      year = String(now.getFullYear())
      month = String(now.getMonth() + 1).padStart(2, '0')
      day = String(now.getDate()).padStart(2, '0')
      const hour = String(now.getHours()).padStart(2, '0')
      const minute = String(now.getMinutes()).padStart(2, '0')
      const second = String(now.getSeconds()).padStart(2, '0')
      mxDate = `${year}-${month}-${day} ${hour}:${minute}:${second}`
    }

    systemPrompt += `FECHA Y HORA DE HOY: ${mxDate} (Zona Horaria: America/Mexico_City, Formato: YYYY-MM-DD HH:MM:SS).\n`
    systemPrompt += `Usa esta fecha como referencia para cálculos de tiempo relativo (por ejemplo, hoy es ${year}-${month}-${day}, así que mañana es el siguiente día, etc.).\n\n`

    if (agent.systemPrompt) {
      systemPrompt += `INSTRUCCIONES ESPECÍFICAS:\n${agent.systemPrompt}\n\n`
    }

    if (agent.type === 'EXECUTIVE_ASSISTANT') {
      const contacts = await prisma.frequentContact.findMany({
        where: { userId: agent.userId },
        orderBy: { name: 'asc' }
      })
      if (contacts.length > 0) {
        systemPrompt += `CONTACTOS FRECUENTES DE TU USUARIO (Úsalos para resolver nombres a direcciones de correo electrónico de forma directa y silenciosa sin preguntar):\n`
        contacts.forEach(c => {
          systemPrompt += `- ${c.name}: ${c.email}\n`
        })
        systemPrompt += `\n`
      }

      systemPrompt += `INSTRUCCIONES DE ROL MANDATORIAS (Asistente Ejecutiva):
Eres un Asistente Ejecutivo altamente proactivo y profesional. Tu objetivo es ayudar a organizar la agenda, crear resumenes de reuniones, enviar recordatorios, y el resumen de la agenda de manera diaria.

Cuando te pidan agendar una reunión siempre tienes que tener la siguiente información:
- Duración de la reunión (pídela si no se especifica).
- Fecha y Hora específicas (pídelas si no se especifican).
- Tema ó título de la reunión (pídelo si no se especifica).
- Tipo de conexión: Debes preguntar SIEMPRE de forma explícita si la reunión será virtual y si la sesión se realizará por Google Meet, Microsoft Teams o Zoom.

REGLAS DE AGENDAMIENTO CRÍTICAS:
1. Si el usuario te pide agendar una reunión y NO tienes toda la información requerida (Duración, Fecha y Hora, Tema/Título, o la confirmación de la plataforma de videoconferencia Teams/Meet/Zoom), NO debes inventar ni asumir valores ficticios. Debes responder amablemente solicitando los datos faltantes.
2. SÍ tienes la capacidad de agendar a horas exactas y específicas (ej. 10:00 AM es 10:00, 3:30 PM es 15:30).
3. Once and only when you have all the required details, calculate the date (YYYY-MM-DD) and time (HH:MM) in 24-hour format and run 'scheduleMeeting' immediately.
4. Para cancelar reuniones, tienes la herramienta 'cancelMeeting'. Si el usuario te pide cancelar una reunión (ej. "Siempre no vamos a tener esa reunión", "cancela la de revisar guiones"), NO le pidas el ID de la reunión al usuario. En su lugar, llama a 'cancelMeeting' pasando el título o consulta de la reunión que el usuario quiere cancelar en el parámetro 'title' y el servidor la buscará y cancelará de forma inteligente.
5. EVITAR CONFLICTOS DE HORARIO: La herramienta 'scheduleMeeting' validará si ya tienes otros eventos programados que choquen con el horario solicitado. Si la herramienta retorna un error de conflicto ('CONFLICT: ...'), debes informar de inmediato y de forma muy atenta al usuario qué eventos específicos causan el choque de agenda, y preguntarle explícitamente si desea agendar la reunión de todos modos (en cuyo caso volverás a ejecutar la herramienta pasando ignoreConflict: true) o si prefiere cambiar la hora o fecha.
6. CORREOS ELECTRÓNICOS (Gmail): Tienes acceso a Gmail a través de dos herramientas:
   - 'listEmails': te permite buscar o listar correos del usuario.
     * REGLA DE FILTRADO CRÍTICA: Al listar correos para buscar pendientes, tareas o temas importantes, debes evitar notificaciones automatizadas, códigos de verificación (OTP), alertas de seguridad, newsletters, encuestas y correos de publicidad.
     * Para lograr esto, utiliza de forma experta operadores de búsqueda en el parámetro 'query' de 'listEmails'. Por ejemplo, usa:
       "category:primary -noreply -no-reply -notification -verification -security -marketing -promo"
       para excluir remitentes robóticos y correos transaccionales y centrarte en personas reales.
     * También puedes usar "after:YYYY/MM/DD" para limitar los resultados en el tiempo (por ejemplo, últimos 7 días).
     * Analiza críticamente los correos que recibas: si en el resultado devuelto de todos modos se cuelan correos irrelevantes (como códigos de GitHub, descargas de WeTransfer, confirmaciones de cuentas), FÍLTRALOS tú mismo en tu mente y NO se los listes ni resumas al usuario. Preséntale únicamente los correos de personas reales o con pendientes de negocios reales.
   - 'sendEmail': te permite redactar un correo y enviarlo. Por defecto (cuando no se pida expresamente enviarlo directo), debes guardarlo como BORRADOR (sendDirectly: false) para que el usuario lo de de alta y revise en su bandeja de borrador de Gmail antes de enviar, lo cual es muy profesional.
7. REGLAS PARA MOSTRAR LA AGENDA / CALENDARIO:
   - Al consultar la agenda, utiliza la herramienta 'listMeetings'. Puedes pasar range: "week" para obtener todas las reuniones de los siguientes 7 días en un solo paso, o range: "day" para un día específico.
   - NUNCA ejecutes la herramienta múltiples veces por día si puedes hacerlo en una sola llamada de rango de fecha.
   - Al responder al usuario con el resumen del calendario (del día o de la semana), debes hacerlo **SIEMPRE EN UN ÚNICO MENSAJE (CUADRO DE TEXTO)**. No dividas la respuesta por días ni mandes múltiples respuestas separadas.
   - Para cada reunión listada, muestra un resumen muy conciso de **máximo 3 o 4 líneas por evento**, conteniendo únicamente:
     * **Fecha:** [Fecha del evento]
     * **Hora:** [Hora de inicio y duración]
     * **Título:** [Nombre de la reunión]
     * **Asistentes:** [Nombres o correos de los asistentes]
     No agregues explicaciones largas ni detalles innecesarios. Mantén un formato de lista muy limpio y profesional.
8. GESTOR DE TAREAS PENDIENTES (CHECKLIST):
   - Tienes acceso a cuatro herramientas para gestionar la lista de tareas del usuario:
     * 'createTask': Crea un pendiente con título, descripción opcional, fecha límite y prioridad.
     * 'listTasks': Muestra la lista de pendientes (por defecto las no completadas).
     * 'completeTask': Marca un pendiente como completado buscando por su título o ID.
     * 'deleteTask': Elimina un pendiente de la lista.
   - REGLA DE USO PROACTIVO: Si el usuario te menciona algún pendiente o tarea a realizar, o te pide acordarte de algo, debes ofrecerte a anotarlo o hacerlo directamente llamando a 'createTask'.
   - Igualmente, cuando te pregunte por sus tareas, utiliza 'listTasks' para obtener la lista real en lugar de inventarlas.
  8. MÓDULO DE CARTERA (CLIENTES Y PÓLIZAS):
     - Tienes acceso directo a la cartera de seguros del agente a través de herramientas especializadas.
     - Si te preguntan sobre un cliente (ej. "Cuándo renueva Miguel?", "¿Cuánto paga Luis?"), usa 'searchClients' para encontrar su ID, y luego INMEDIATAMENTE usa 'getClientPolicies' con ese ID para leer sus pólizas y darle la respuesta exacta al usuario.
     - Si te preguntan "¿Qué pólizas se vencen este mes?" o similar, usa 'getUpcomingRenewals'.
     - Si te preguntan "¿Cuánto tengo en primas?" o "¿Cuántos clientes tengo?", usa 'getPortfolioStats'.\n\n`
    }

    if (agent.type === 'SOCIAL_MEDIA_MANAGER') {
      systemPrompt += `INSTRUCCIONES DE ROL MANDATORIAS (Social Media Manager):
Eres un Social Media Manager experto en tendencias virales, redacción persuasiva y análisis de métricas para X, LinkedIn, Facebook e Instagram.

REGLAS DE FLUJO DE TRABAJO CRÍTICAS:
1. Si el usuario te pide "ideas" genéricas sobre qué publicar o te hace una petición abierta (ej. "hazme un post para hoy"), **NO** debes generar el diseño gráfico de inmediato. En su lugar, propón **entre 3 y 5 ideas o alternativas diferentes** en texto plano.
2. Espera a que el usuario confirme cuál idea prefiere.
3. **EXCEPCIÓN CRÍTICA:** Si el usuario te pide EXPLÍCITAMENTE "otro diseño", "genera la imagen", "dame un post sobre X", "haz otra variante" o aprueba una idea, **DEBES INVOCAR INMEDIATAMENTE** la herramienta 'generateGraphicDesign'. No respondas solo con texto describiendo la imagen; es obligatorio ejecutar la herramienta.

--- LINEAMIENTOS DE SEGURIDAD (CRÍTICO) ---
1. Tienes ESTRICTAMENTE PROHIBIDO generar diseños o imágenes que contengan agresión, violencia o contenido sexual.
2. Tienes ESTRICTAMENTE PROHIBIDO generar imágenes con menores de edad SOLOS. Los menores de edad SOLO pueden aparecer si están en un contexto familiar explícito (con padres/adultos) o en un contexto claro de educación y protección infantil.
3. Si el usuario pide un diseño que viole estos lineamientos (ej. un niño solo, o contenido violento), NO debes usar la herramienta 'generateGraphicDesign'.
4. En caso de violación, DEBES responder textualmente con este mensaje y nada más: "No se pudo generar por que de acuerdo a los lineamientos de AACOMSoft 'No se pueden generar imagenes con menores de edad solos'." (o ajusta el final a 'con contenido violento/sexual' según corresponda).
------------------------------------------\n\n`
    }

    if (agent.type === 'COMMUNITY_MANAGER' && agent.toneUrl) {
      systemPrompt += `TONO DE VOZ DE REDES SOCIALES: Basado en ${agent.toneUrl}\n\n`
    }

    // Identity Context
    if (companyProfile) {
      systemPrompt += `--- CONTEXTO CORPORATIVO (IDENTIDAD) ---\n`
      if (companyProfile.industry) systemPrompt += `Industria: ${companyProfile.industry}\n`
      if (companyProfile.targetAudience) systemPrompt += `Clientes Objetivo: ${companyProfile.targetAudience}\n`
      if (companyProfile.websiteUrl) systemPrompt += `Sitio Web: ${companyProfile.websiteUrl}\n`
      if (companyProfile.description) systemPrompt += `Descripción de la empresa: ${companyProfile.description}\n\n`
    }

    // Knowledge Context
    if (knowledgeAssets.length > 0) {
      systemPrompt += `--- BASE DE CONOCIMIENTOS ---\n`
      systemPrompt += `Usa la siguiente información como tu fuente principal de conocimiento si te preguntan sobre la empresa:\n`
      knowledgeAssets.forEach(asset => {
        if (asset.type === 'MEMORY') {
          systemPrompt += `- [Memoria] ${asset.title}: ${asset.content}\n`
        } else if (asset.type === 'WEB_PAGE') {
          systemPrompt += `- [Página Web] ${asset.title}: ${asset.url}\n`
        } else {
          systemPrompt += `- [Archivo] ${asset.title}: ${asset.url}\n`
        }
      })
      systemPrompt += `\n`
    }

    // Extract the latest user message to save it
    const lastMessage = messages[messages.length - 1]
    if (lastMessage && lastMessage.role === 'user') {
      await prisma.interactionLog.create({
        data: {
          aiAgentId: agent.id,
          userId: agent.userId,
          role: 'user',
          content: lastMessage.content
        }
      })
      revalidatePath(`/agents/${agent.id}/chat`)
    }

    // Determine tools based on agent type
    const tools: Record<string, any> = {}

    if (agent.type === 'EXECUTIVE_ASSISTANT') {
      tools.scheduleMeeting = (tool as any)({
        description: 'Agenda una nueva reunión en el calendario del usuario.',
        parameters: z.object({
          title: z.string().describe('El título o tema de la reunión'),
          date: z.string().describe('Fecha en formato YYYY-MM-DD (ej. "2026-06-30")'),
          time: z.string().describe('Hora en formato HH:MM de 24 horas (ej. "14:30")'),
          duration: z.number().optional().describe('Duración en minutos (ej. 30, 60). Opcional, por defecto 60.'),
          videoconference: z.enum(['none', 'meet', 'teams', 'zoom']).optional().default('none').describe('Tipo de videoconferencia ("meet" para Google Meet, "teams" para MS Teams, "zoom" para Zoom, "none" para ninguna).'),
          description: z.string().optional().describe('Una descripción corta opcional de la reunión'),
          ignoreConflict: z.boolean().optional().default(false).describe('Si es true, agenda la reunión incluso si hay un choque de horarios con otra reunión.'),
        }),
        execute: async ({ title, date, time, duration, videoconference, description, ignoreConflict }: { title?: string, date?: string, time?: string, duration?: number, videoconference?: 'none' | 'meet' | 'teams' | 'zoom', description?: string, ignoreConflict?: boolean }) => {
          try {
            // Safe fallbacks to prevent undefined trim crashes
            const safeTitle = title || 'Reunión sin título';
            const safeDateStr = date || '';
            const safeTimeStr = time || '';

            // Robust parsing and formatting to local CDMX time ISO-8601 string
            let cleanDate = safeDateStr.trim();
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(cleanDate)) {
              // Fallback to today if format is invalid (like "mañana" literal text or empty)
              const now = new Date();
              const y = now.getFullYear();
              const m = String(now.getMonth() + 1).padStart(2, '0');
              const d = String(now.getDate()).padStart(2, '0');
              cleanDate = `${y}-${m}-${d}`;
            }

            let cleanTime = safeTimeStr.trim().toLowerCase();

            let hours = 0;
            let minutes = 0;

            const isPM = cleanTime.includes('pm');
            const isAM = cleanTime.includes('am');

            cleanTime = cleanTime.replace(/am|pm/g, '').trim();

            const parts = cleanTime.split(':');
            if (parts.length >= 1) {
              hours = parseInt(parts[0], 10) || 0;
            }
            if (parts.length >= 2) {
              minutes = parseInt(parts[1], 10) || 0;
            }

            if (isPM && hours < 12) {
              hours += 12;
            }
            if (isAM && hours === 12) {
              hours = 0;
            }

            const [y, m, d] = cleanDate.split('-').map(Number);
            const pad = (n: number) => String(n).padStart(2, '0');
            
            const startIso = `${cleanDate}T${pad(hours)}:${pad(minutes)}:00-06:00`;
            
            const safeDuration = typeof duration === 'number' && !isNaN(duration) ? duration : 60;
            
            const startMillis = Date.parse(startIso);
            const endMillis = isNaN(startMillis) ? (Date.now() + safeDuration * 60000) : (startMillis + safeDuration * 60000);
            
            const cdmxDate = new Date(endMillis - (6 * 60 * 60 * 1000));
            
            const endYear = cdmxDate.getUTCFullYear();
            const endMonth = pad(cdmxDate.getUTCMonth() + 1);
            const endDate = pad(cdmxDate.getUTCDate());
            const endHour = pad(cdmxDate.getUTCHours());
            const endMinute = pad(cdmxDate.getUTCMinutes());
            
            const endIso = `${endYear}-${endMonth}-${endDate}T${endHour}:${endMinute}:00-06:00`;

            // Check for duplicate execution (idempotency check) in the last 15 seconds
            // Note: We remove title check here because title phrasing might vary slightly on browser reconnection retries
            const fifteenSecondsAgo = new Date(Date.now() - 15000);
            const duplicate = await prisma.meeting.findFirst({
              where: {
                userId: agent.userId,
                date: cleanDate,
                time: `${pad(hours)}:${pad(minutes)}`,
                createdAt: {
                  gte: fifteenSecondsAgo
                }
              }
            });

            if (duplicate) {
              console.log("Duplicate meeting scheduling request detected. Bypassing Google Calendar insert.");
              return `Reunión agendada en tu Google Calendar:
ID: ${duplicate.googleEventId || duplicate.id}
Título: ${duplicate.title}
Fecha: ${duplicate.date}
Hora: ${duplicate.time}
Duración: ${duplicate.duration} minutos
Enlace: ${duplicate.googleEventLink || ''}
${duplicate.googleMeetLink ? `Videoconferencia (Google Meet): ${duplicate.googleMeetLink}` : ''}
${duplicate.description ? `Descripción: ${duplicate.description}` : ''}`;
            }

            // Check for schedule conflicts (overlapping events) unless ignoreConflict is true
            if (!ignoreConflict) {
              let conflictWarnings: string[] = [];
              const calendarCheck = await getGoogleCalendarClient(agent.userId)
              
              if (calendarCheck) {
                try {
                  // Buffer times to query overlaps: startIso to endIso
                  const conflictRes = await calendarCheck.events.list({
                    calendarId: 'primary',
                    timeMin: startIso,
                    timeMax: endIso,
                    singleEvents: true
                  });
                  const conflictingEvents = conflictRes.data.items || [];
                  if (conflictingEvents.length > 0) {
                    conflictWarnings = conflictingEvents.map(e => {
                      const estart = e.start?.dateTime || e.start?.date || '';
                      const eend = e.end?.dateTime || e.end?.date || '';
                      const tStart = estart.includes('T') ? estart.split('T')[1].slice(0, 5) : 'todo el día';
                      const tEnd = eend.includes('T') ? eend.split('T')[1].slice(0, 5) : 'todo el día';
                      return `"${e.summary}" (de ${tStart} a ${tEnd})`;
                    });
                  }
                } catch (calErr) {
                  console.error("Conflict checking in Google Calendar failed:", calErr);
                }
              } else {
                // Local DB fallback overlap check
                const localMeetings = await prisma.meeting.findMany({
                  where: {
                    userId: agent.userId,
                    date: cleanDate
                  }
                });

                const proposedStart = hours * 60 + minutes;
                const proposedEnd = proposedStart + safeDuration;

                for (const m of localMeetings) {
                  const [mHours, mMinutes] = m.time.split(':').map(Number);
                  const mStart = mHours * 60 + mMinutes;
                  const mEnd = mStart + m.duration;

                  if (proposedStart < mEnd && proposedEnd > mStart) {
                    conflictWarnings.push(`"${m.title}" (de ${m.time} a las ${Math.floor(mEnd / 60)}:${String(mEnd % 60).padStart(2, '0')})`);
                  }
                }
              }

              if (conflictWarnings.length > 0) {
                return `CONFLICT: Se detectó un conflicto de horario con los siguientes eventos: ${conflictWarnings.join(', ')}. Por favor, avísale al usuario sobre esto y pregúntale si desea agendarla de todos modos (volviendo a ejecutar la herramienta con ignoreConflict: true) o si prefiere cambiar la hora o fecha.`;
              }
            }

            const cleanDescription = videoconference === 'teams'
              ? `[Videoconferencia: MS Teams] ${description || ''}`
              : (videoconference === 'zoom' ? `[Videoconferencia: Zoom] ${description || ''}` : description);

            const calendar = await getGoogleCalendarClient(agent.userId)
            if (calendar) {
              const requestBody: any = {
                summary: safeTitle,
                description: cleanDescription || undefined,
                start: { dateTime: startIso, timeZone: 'America/Mexico_City' },
                end: { dateTime: endIso, timeZone: 'America/Mexico_City' }
              }

              if (videoconference === 'meet') {
                requestBody.conferenceData = {
                  createRequest: {
                    requestId: `meet-${Date.now()}`,
                    conferenceSolutionKey: {
                      type: 'hangoutsMeet'
                    }
                  }
                }
              }

              const event = await calendar.events.insert({
                calendarId: 'primary',
                conferenceDataVersion: videoconference === 'meet' ? 1 : undefined,
                requestBody
              })

              const meetLink = event.data.hangoutLink || '';

              // Save to local DB to prevent duplicates on fast retry streams
              await prisma.meeting.create({
                data: {
                  title: safeTitle,
                  date: cleanDate,
                  time: `${pad(hours)}:${pad(minutes)}`,
                  duration: safeDuration,
                  description: cleanDescription || undefined,
                  userId: agent.userId,
                  googleEventId: event.data.id || null,
                  googleEventLink: event.data.htmlLink || null,
                  googleMeetLink: meetLink || null
                }
              });

              return `Reunión agendada en tu Google Calendar:
ID: ${event.data.id}
Título: ${event.data.summary}
Fecha: ${cleanDate}
Hora: ${pad(hours)}:${pad(minutes)}
Duración: ${safeDuration} minutos
Enlace: ${event.data.htmlLink}
${meetLink ? `Videoconferencia (Google Meet): ${meetLink}` : ''}
${cleanDescription ? `Descripción: ${cleanDescription}` : ''}`
            }

            const meeting = await prisma.meeting.create({
              data: {
                title: safeTitle,
                date: cleanDate,
                time: `${pad(hours)}:${pad(minutes)}`,
                duration: safeDuration,
                description: cleanDescription,
                userId: agent.userId,
              }
            })
            return `Reunión agendada exitosamente en el calendario local:
ID: ${meeting.id}
Título: ${meeting.title}
Fecha: ${meeting.date}
Hora: ${meeting.time}
Duración: ${meeting.duration} minutos
${meeting.description ? `Descripción: ${meeting.description}` : ''}`
          } catch (e: any) {
            console.error("Error scheduling meeting:", e)
            return `No se pudo agendar la reunión debido a un error interno: ${e.message || e}`
          }
        },
      })

      tools.listMeetings = (tool as any)({
        description: 'Muestra la lista de reuniones agendadas para cualquier fecha o rango de tiempo.',
        parameters: z.object({
          date: z.string().optional().describe('Fecha de inicio en formato YYYY-MM-DD (ej. "2026-06-30"). Si se omite, se asume hoy.'),
          range: z.enum(['day', 'week']).optional().default('day').describe('El rango de tiempo a consultar. "week" lista reuniones de los siguientes 7 días a partir de la fecha. "day" lista solo las de esa fecha.'),
        }),
        execute: async ({ date, range }: { date?: string, range?: 'day' | 'week' }) => {
          try {
            // Default to today in Mexico City timezone if no date provided
            let targetDate = date
            if (!targetDate) {
              try {
                targetDate = new Intl.DateTimeFormat('en-CA', {
                  timeZone: 'America/Mexico_City',
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit'
                }).format(new Date())
              } catch (err) {
                console.warn("listMeetings timezone formatting failed, using local time fallback:", err)
                const now = new Date()
                const y = now.getFullYear()
                const m = String(now.getMonth() + 1).padStart(2, '0')
                const d = String(now.getDate()).padStart(2, '0')
                targetDate = `${y}-${m}-${d}`
              }
            }

            const calendar = await getGoogleCalendarClient(agent.userId)
            const isWeek = range === 'week'

            if (calendar) {
              const timeMin = `${targetDate}T00:00:00-06:00`
              
              const [y, m, d] = targetDate.split('-').map(Number);
              const endDateObj = new Date(Date.UTC(y, m - 1, d, 23, 59, 59));
              if (isWeek) {
                endDateObj.setUTCDate(endDateObj.getUTCDate() + 6);
              }
              const endY = endDateObj.getUTCFullYear();
              const endM = String(endDateObj.getUTCMonth() + 1).padStart(2, '0');
              const endD = String(endDateObj.getUTCDate()).padStart(2, '0');
              const timeMax = `${endY}-${endM}-${endD}T23:59:59-06:00`;

              // Fetch the list of calendars, only querying those that are primary or selected/visible
              const calendarsRes = await calendar.calendarList.list()
              const calendarIds = (calendarsRes.data.items || [])
                .filter(c => c.primary || c.selected)
                .map(c => c.id)
                .filter((id): id is string => !!id)

              if (calendarIds.length === 0) {
                calendarIds.push('primary')
              }

              const allEventsPromises = calendarIds.map(async (calId) => {
                try {
                  const r = await calendar.events.list({
                    calendarId: calId,
                    timeMin,
                    timeMax,
                    timeZone: 'America/Mexico_City',
                    singleEvents: true,
                  })
                  return r.data.items || []
                } catch (err) {
                  console.error(`Error querying calendar ${calId}:`, err)
                  return []
                }
              })

              const eventsLists = await Promise.all(allEventsPromises)
              const events = eventsLists.flat().sort((a, b) => {
                const aTime = new Date(a.start?.dateTime || a.start?.date || 0).getTime()
                const bTime = new Date(b.start?.dateTime || b.start?.date || 0).getTime()
                return aTime - bTime
              })

              if (events.length === 0) {
                return `No tienes reuniones ni eventos agendados en tus calendarios para ${isWeek ? 'esta semana' : `el ${targetDate}`}.`
              }
              return `Eventos agendados para ${isWeek ? 'la semana del ' + targetDate : targetDate}:\n` + events.map(m => {
                const start = m.start?.dateTime || m.start?.date || ''
                const end = m.end?.dateTime || m.end?.date || ''
                const startTimeStr = start.includes('T') ? start.split('T')[1].slice(0, 5) : 'Todo el día'
                const durationMins = m.start?.dateTime && m.end?.dateTime 
                  ? Math.round((new Date(m.end.dateTime).getTime() - new Date(m.start.dateTime).getTime()) / 60000)
                  : 0
                const attendeesList = (m.attendees || [])
                  .map(att => att.displayName || att.email || '')
                  .filter(Boolean)
                  .join(', ') || 'Solo yo'
                return `- ID: ${m.id} | "${m.summary}" | Fecha: ${start.slice(0, 10)} | Hora: ${startTimeStr} | Duración: ${durationMins} mins | Asistentes: ${attendeesList}`
              }).join('\n')
            }

            const [ly, lm, ld] = targetDate.split('-').map(Number);
            const localEndDateObj = new Date(Date.UTC(ly, lm - 1, ld));
            if (isWeek) {
              localEndDateObj.setUTCDate(localEndDateObj.getUTCDate() + 6);
            }
            const endDateStr = `${localEndDateObj.getUTCFullYear()}-${String(localEndDateObj.getUTCMonth() + 1).padStart(2, '0')}-${String(localEndDateObj.getUTCDate()).padStart(2, '0')}`;

            const meetings = await prisma.meeting.findMany({
              where: {
                userId: agent.userId,
                date: isWeek ? {
                  gte: targetDate,
                  lte: endDateStr
                } : targetDate
              },
              orderBy: [
                { date: 'asc' },
                { time: 'asc' }
              ]
            })

            if (meetings.length === 0) {
              return `No tienes reuniones agendadas en tu calendario local para ${isWeek ? 'esta semana' : `el ${targetDate}`}.`
            }

            return `Reuniones agendadas en tu calendario local para ${isWeek ? 'la semana del ' + targetDate : targetDate}:\n` + meetings.map(m => (
              `- ID: ${m.id} | "${m.title}" | Fecha: ${m.date} | Hora: ${m.time} | Duración: ${m.duration} mins | Asistentes: Solo yo`
            )).join('\n')
          } catch (e: any) {
            console.error("Error listing meetings:", e)
            return `No se pudieron consultar las reuniones debido a un error interno: ${e.message || e}`
          }
        }
      })

      tools.cancelMeeting = (tool as any)({
        description: 'Cancela o elimina una reunión del calendario de forma inteligente. Puedes pasar el ID de la reunión si lo conoces, o una palabra clave del título o tema de la reunión (ej. "revisar guiones") para buscarla y eliminarla automáticamente.',
        parameters: z.object({
          meetingId: z.string().optional().describe('El ID de la reunión (si se conoce)'),
          title: z.string().optional().describe('El título, tema o palabra clave de la reunión a cancelar (ej. "revisar guiones")'),
        }),
        execute: async ({ meetingId, title }: { meetingId?: string, title?: string }) => {
          try {
            let actualMeetingId = meetingId ? meetingId.trim() : undefined;
            let meetingTitle = title ? title.trim() : '';

            const calendar = await getGoogleCalendarClient(agent.userId)

            // 1. If no ID is passed, search local DB using token-based smart word match
            if (!actualMeetingId && meetingTitle) {
              const searchTitle = meetingTitle.toLowerCase();
              const stopwords = new Set(['de', 'del', 'la', 'el', 'a', 'para', 'y', 'con', 'en', 'reunion', 'reunión']);
              const queryWords = searchTitle.split(/\s+/).filter(w => w.length > 2 && !stopwords.has(w));

              const userMeetings = await prisma.meeting.findMany({
                where: { userId: agent.userId },
                orderBy: { createdAt: 'desc' }
              });

              const matched = userMeetings.find(m => {
                const meetingTitleLower = m.title.toLowerCase();
                // Match if exact query is in title, or if any query significant word is in the title
                if (meetingTitleLower.includes(searchTitle)) return true;
                return queryWords.length > 0 && queryWords.some(word => meetingTitleLower.includes(word));
              });

              if (matched) {
                actualMeetingId = matched.googleEventId || matched.id;
                meetingTitle = matched.title;
              }
            }

            // 2. If still no ID, search Google Calendar directly using smart query fallbacks
            if (!actualMeetingId && meetingTitle && calendar) {
              const now = new Date();
              const timeMin = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days back
              const timeMax = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString(); // 60 days ahead
              
              // Try exact query search first
              let listRes = await calendar.events.list({
                calendarId: 'primary',
                timeMin,
                timeMax,
                singleEvents: true,
                q: meetingTitle
              });

              let items = listRes.data.items || [];

              // Fallback: search by longest keyword
              if (items.length === 0) {
                const stopwords = new Set(['de', 'del', 'la', 'el', 'a', 'para', 'y', 'con', 'en', 'reunion', 'reunión']);
                const words = meetingTitle.toLowerCase().split(/\s+/).filter(w => w.length > 2 && !stopwords.has(w));
                if (words.length > 0) {
                  const mainKeyword = words.sort((a, b) => b.length - a.length)[0];
                  listRes = await calendar.events.list({
                    calendarId: 'primary',
                    timeMin,
                    timeMax,
                    singleEvents: true,
                    q: mainKeyword
                  });
                  items = listRes.data.items || [];
                }
              }

              if (items.length > 0) {
                const stopwords = new Set(['de', 'del', 'la', 'el', 'a', 'para', 'y', 'con', 'en', 'reunion', 'reunión']);
                const queryWords = meetingTitle.toLowerCase().split(/\s+/).filter(w => w.length > 2 && !stopwords.has(w));
                
                const bestMatch = items.find(item => {
                  const summary = (item.summary || '').toLowerCase();
                  return queryWords.some(word => summary.includes(word));
                }) || items[0];

                actualMeetingId = bestMatch.id || undefined;
                meetingTitle = bestMatch.summary || meetingTitle;
              }
            }

            if (!actualMeetingId) {
              return `No pude encontrar ninguna reunión que coincida con "${meetingTitle || meetingId}". Por favor, indícame un título más específico.`
            }

            // 3. Delete from Google Calendar if connected
            if (calendar) {
              try {
                await calendar.events.delete({
                  calendarId: 'primary',
                  eventId: actualMeetingId
                });

                // Clean up local record too
                await prisma.meeting.deleteMany({
                  where: {
                    OR: [
                      { googleEventId: actualMeetingId },
                      { id: actualMeetingId }
                    ],
                    userId: agent.userId
                  }
                });

                return `La reunión "${meetingTitle}" ha sido cancelada y eliminada de tu Google Calendar exitosamente.`
              } catch (calErr: any) {
                console.error("Google Calendar delete failed, fallback to local database:", calErr);
              }
            }

            // 4. Fallback to local database delete
            const localMeeting = await prisma.meeting.findFirst({
              where: {
                OR: [
                  { id: actualMeetingId },
                  { googleEventId: actualMeetingId }
                ],
                userId: agent.userId
              }
            });

            if (!localMeeting) {
              return `No se encontró ninguna reunión activa con el título o ID "${meetingTitle || actualMeetingId}".`
            }

            await prisma.meeting.delete({
              where: { id: localMeeting.id }
            });

            return `La reunión "${localMeeting.title}" agendada para el ${localMeeting.date} ha sido cancelada de tu calendario local exitosamente.`
          } catch (e: any) {
            console.error("Error cancelling meeting:", e)
            return `No se pudo cancelar la reunión debido a un error: ${e.message || e}`
          }
        }
      })

      const createTaskParams = z.object({
        title: z.string().describe('El título de la tarea o pendiente (ej. "Revisar contratos")'),
        description: z.string().optional().describe('Detalles o notas adicionales sobre la tarea'),
        priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional().default('MEDIUM').describe('Prioridad de la tarea (LOW = Baja, MEDIUM = Media, HIGH = Alta)'),
        dueDate: z.string().optional().describe('Fecha límite de cumplimiento en formato YYYY-MM-DD (ej. "2026-07-01")'),
      })

      tools.createTask = (tool as any)({
        description: 'Crea un pendiente o tarea en el gestor de tareas del usuario.',
        parameters: createTaskParams,
        execute: async ({ title, description, priority, dueDate }: z.infer<typeof createTaskParams>) => {
          try {
            // Duplicate prevention: check if a task with the same title was created in the last 15 seconds
            const fifteenSecondsAgo = new Date(Date.now() - 15 * 1000)
            const existingTask = await prisma.task.findFirst({
              where: {
                title: title.trim(),
                userId: agent.userId,
                createdAt: {
                  gte: fifteenSecondsAgo
                }
              }
            })

            if (existingTask) {
              return `Tarea creada con éxito (ya existía):
ID: ${existingTask.id}
Título: ${existingTask.title}
Prioridad: ${existingTask.priority === 'HIGH' ? 'Alta' : existingTask.priority === 'MEDIUM' ? 'Media' : 'Baja'}
Fecha Límite: ${existingTask.dueDate || 'Sin fecha'}`
            }

            const task = await prisma.task.create({
              data: {
                title: title.trim(),
                description: description ? description.trim() : null,
                priority: priority || 'MEDIUM',
                dueDate: dueDate || null,
                userId: agent.userId,
              }
            })
            return `Tarea creada con éxito:
ID: ${task.id}
Título: ${task.title}
Prioridad: ${task.priority === 'HIGH' ? 'Alta' : task.priority === 'MEDIUM' ? 'Media' : 'Baja'}
Fecha Límite: ${task.dueDate || 'Sin fecha'}`
          } catch (e: any) {
            console.error("Error creating task:", e)
            return `No se pudo crear la tarea debido a un error: ${e.message || e}`
          }
        }
      })

      const listTasksParams = z.object({
        completed: z.boolean().optional().describe('Filtrar tareas por estado completado (true = completadas, false = pendientes). Si se omite, muestra las pendientes.'),
      })

      tools.listTasks = (tool as any)({
        description: 'Lista los pendientes o tareas activas del usuario.',
        parameters: listTasksParams,
        execute: async ({ completed }: z.infer<typeof listTasksParams>) => {
          try {
            const filterCompleted = completed === undefined ? false : completed
            const tasks = await prisma.task.findMany({
              where: {
                userId: agent.userId,
                completed: filterCompleted
              },
              orderBy: [
                { priority: 'desc' },
                { createdAt: 'desc' }
              ]
            })

            if (tasks.length === 0) {
              return `No tienes tareas ${filterCompleted ? 'completadas' : 'pendientes'} registradas.`
            }

            return `Tareas ${filterCompleted ? 'completadas' : 'pendientes'}:\n` + tasks.map(t => {
              const priorityText = t.priority === 'HIGH' ? 'Alta' : t.priority === 'MEDIUM' ? 'Media' : 'Baja'
              return `- ID: ${t.id} | "${t.title}" | Prioridad: ${priorityText} | Límite: ${t.dueDate || 'Sin fecha'}`
            }).join('\n')
          } catch (e: any) {
            console.error("Error listing tasks:", e)
            return `No se pudieron consultar las tareas debido a un error: ${e.message || e}`
          }
        }
      })

      const completeTaskParams = z.object({
        taskId: z.string().optional().describe('El ID de la tarea a completar (si se conoce)'),
        title: z.string().optional().describe('El título o palabras clave del pendiente a marcar como hecho'),
      })

      tools.completeTask = (tool as any)({
        description: 'Marca una tarea o pendiente como completada.',
        parameters: completeTaskParams,
        execute: async ({ taskId, title }: z.infer<typeof completeTaskParams>) => {
          try {
            let actualTaskId = taskId ? taskId.trim() : undefined
            let searchTitle = title ? title.trim().toLowerCase() : ''

            if (!actualTaskId && searchTitle) {
              const userTasks = await prisma.task.findMany({
                where: {
                  userId: agent.userId,
                  completed: false
                }
              })
              const matched = userTasks.find(t => t.title.toLowerCase().includes(searchTitle))
              if (matched) {
                actualTaskId = matched.id
              }
            }

            if (!actualTaskId) {
              return `No pude encontrar ninguna tarea pendiente que coincida con "${title || taskId}".`
            }

            const updated = await prisma.task.update({
              where: { id: actualTaskId },
              data: { completed: true }
            })

            return `Tarea "${updated.title}" marcada como completada con éxito.`
          } catch (e: any) {
            console.error("Error completing task:", e)
            return `No se pudo completar la tarea debido a un error: ${e.message || e}`
          }
        }
      })

      const deleteTaskParams = z.object({
        taskId: z.string().optional().describe('El ID de la tarea a eliminar (si se conoce)'),
        title: z.string().optional().describe('El título o palabras clave del pendiente a eliminar'),
      })

      tools.deleteTask = (tool as any)({
        description: 'Elimina una tarea del listado de pendientes.',
        parameters: deleteTaskParams,
        execute: async ({ taskId, title }: z.infer<typeof deleteTaskParams>) => {
          try {
            let actualTaskId = taskId ? taskId.trim() : undefined
            let searchTitle = title ? title.trim().toLowerCase() : ''

            if (!actualTaskId && searchTitle) {
              const userTasks = await prisma.task.findMany({
                where: { userId: agent.userId }
              })
              const matched = userTasks.find(t => t.title.toLowerCase().includes(searchTitle))
              if (matched) {
                actualTaskId = matched.id
              }
            }

            if (!actualTaskId) {
              return `No pude encontrar ninguna tarea que coincida con "${title || taskId}" para eliminar.`
            }

            const deleted = await prisma.task.delete({
              where: { id: actualTaskId }
            })

            return `Tarea "${deleted.title}" eliminada con éxito.`
          } catch (e: any) {
            console.error("Error deleting task:", e)
            return `No se pudo eliminar la tarea debido a un error: ${e.message || e}`
          }
        }
      })

      tools.listEmails = (tool as any)({
        description: 'Lista o busca correos electrónicos en la bandeja de entrada del usuario.',
        parameters: z.object({
          query: z.string().optional().describe('Consulta o palabra clave de búsqueda en formato Gmail. Para correos personales importantes de personas reales usa "category:primary -noreply -no-reply -notification -verification -security -marketing -promo".'),
          maxResults: z.number().optional().default(15).describe('Número de correos a mostrar (por defecto 15, máximo 30)'),
        }),
        execute: async ({ query, maxResults }: { query?: string, maxResults?: number }) => {
          try {
            const gmail = await getGmailClient(agent.userId)
            if (!gmail) {
              return 'No tienes una cuenta de Google conectada o no has concedido permisos para Gmail.'
            }

            const limit = Math.min(maxResults || 15, 30)
            const listRes = await gmail.users.messages.list({
              userId: 'me',
              q: query || undefined,
              maxResults: limit
            })

            const messages = listRes.data.messages || []
            if (messages.length === 0) {
              return `No se encontraron correos electrónicos que coincidan con la búsqueda ${query ? `"${query}"` : ''}.`
            }

            const emailDetails = await Promise.all(
              messages.map(async (msg) => {
                try {
                  const detail = await gmail.users.messages.get({
                    userId: 'me',
                    id: msg.id || ''
                  })
                  
                  const headers = detail.data.payload?.headers || []
                  const subject = headers.find(h => h.name?.toLowerCase() === 'subject')?.value || '(Sin asunto)'
                  const from = headers.find(h => h.name?.toLowerCase() === 'from')?.value || 'Desconocido'
                  const dateHeader = headers.find(h => h.name?.toLowerCase() === 'date')?.value || ''
                  const snippet = detail.data.snippet || ''

                  return `- **De:** ${from}\n  **Asunto:** ${subject}\n  **Fecha:** ${dateHeader}\n  **Resumen:** ${snippet}\n  **ID:** ${msg.id}\n`
                } catch (err) {
                  return `- (No se pudo cargar el detalle del correo ID ${msg.id})`
                }
              })
            )

            return `Correos encontrados:\n\n${emailDetails.join('\n')}`
          } catch (e: any) {
            console.error("Error listing emails:", e)
            return `No se pudieron listar los correos debido a un error: ${e.message || e}`
          }
        }
      })

      tools.sendEmail = (tool as any)({
        description: 'Envía un correo electrónico o lo guarda como un borrador en la bandeja del usuario.',
        parameters: z.object({
          to: z.string().describe('Correo del destinatario (ej. "cliente@ejemplo.com")'),
          subject: z.string().describe('El asunto del correo'),
          body: z.string().describe('El contenido del mensaje (se admite texto plano o HTML básico)'),
          sendDirectly: z.boolean().optional().default(false).describe('Si es true, envía el correo directamente. Si es false (recomendado), lo guarda en Borradores (Drafts) para revisión del usuario.'),
        }),
        execute: async ({ to, subject, body, sendDirectly }: { to: string, subject: string, body: string, sendDirectly?: boolean }) => {
          try {
            const gmail = await getGmailClient(agent.userId)
            if (!gmail) {
              return 'No tienes una cuenta de Google conectada o no has concedido permisos para Gmail.'
            }

             // Sanitize and clean the "to" parameter to avoid invalid formatting errors (like quotes, angle brackets, spaces, etc.)
             const cleanTo = to.split(',')
               .map(email => {
                 let trimmed = email.trim();
                 const match = trimmed.match(/^([^<]*)\s*<([^>]+)>$/);
                 if (match) {
                   const name = match[1].trim().replace(/^['"]|['"]$/g, '');
                   const addr = match[2].trim().replace(/^['"<]+|['">]+$/g, '').trim();
                   if (name) {
                     return `"${name.replace(/"/g, '\\"')}" <${addr}>`;
                   }
                   return addr;
                 } else {
                   return trimmed.replace(/^['"<]+|['">]+$/g, '').trim();
                 }
               })
               .join(', ');

             const emailLines = [
               'From: me',
               `To: ${cleanTo}`,
               'Content-Type: text/html; charset=utf-8',
               'MIME-Version: 1.0',
               `Subject: =?utf-8?B?${Buffer.from(subject).toString('base64')}?=`,
               '',
               body
             ]
             const emailContent = emailLines.join('\r\n')
             const raw = Buffer.from(emailContent)
               .toString('base64')
               .replace(/\+/g, '-')
               .replace(/\//g, '_')
               .replace(/=+$/, '')
 
             if (sendDirectly) {
               await gmail.users.messages.send({
                 userId: 'me',
                 requestBody: { raw }
               })
               return `Correo enviado exitosamente a "${cleanTo}" con el asunto "${subject}".`
            } else {
              await gmail.users.drafts.create({
                userId: 'me',
                requestBody: {
                  message: { raw }
                }
              })
              return `Borrador de correo creado exitosamente en tu Gmail para "${cleanTo}" con el asunto "${subject}". Ya puedes revisarlo y enviarlo desde tu bandeja de Borradores.`
            }
          } catch (e: any) {
            console.error("Error with email tool:", e)
            return `No se pudo procesar el correo debido a un error: ${e.message || e}`
          }
        }
      })

        // --- CARTERA TOOLS ---
        const isAdmin = dbUser.role === 'ADMIN' || dbUser.role === 'SUPERADMIN' || dbUser.role === 'SUPER_ADMIN';
        const carteraWhereClause = isAdmin && dbUser.agencyId ? { agencyId: dbUser.agencyId } : { userId: agent.userId };

        tools.searchClients = (tool as any)({
          description: 'Busca un cliente por nombre o apellido en la cartera de seguros del usuario.',
          parameters: z.object({
            name: z.string().describe('Nombre o apellido del cliente a buscar'),
          }),
          execute: async ({ name }: { name: string }) => {
            const clients = await prisma.client.findMany({
              where: { 
                ...carteraWhereClause,
                name: { contains: name, mode: 'insensitive' }
              },
              take: 5,
              select: { id: true, name: true, email: true, phone: true }
            })
            return clients.length ? clients : 'No se encontraron clientes con ese nombre.'
          }
        })

        tools.getClientPolicies = (tool as any)({
          description: 'Obtiene las pólizas de seguros (activas o inactivas) de un cliente específico mediante su ID.',
          parameters: z.object({
            clientId: z.string().describe('El ID del cliente'),
          }),
          execute: async ({ clientId }: { clientId: string }) => {
            const policies = await prisma.policy.findMany({
              where: { 
                ...carteraWhereClause,
                clientId: clientId
              },
              select: {
                policyNumber: true,
                insuranceCompany: true,
                product: true,
                effectiveDate: true,
                renewalDate: true,
                annualPremium: true,
                paymentMethod: true,
                contractor: true,
                insured: true
              }
            })
            return policies.length ? policies : 'El cliente no tiene pólizas registradas.'
          }
        })

        tools.getUpcomingRenewals = (tool as any)({
          description: 'Obtiene una lista de las pólizas que están por renovarse (vencer) en los próximos X días.',
          parameters: z.object({
            days: z.number().describe('Cantidad de días hacia adelante para buscar renovaciones (ej. 30, 60, 90)'),
          }),
          execute: async ({ days }: { days: number }) => {
            const startDate = new Date()
            const endDate = new Date()
            endDate.setDate(endDate.getDate() + days)
            
            const policies = await prisma.policy.findMany({
              where: {
                ...carteraWhereClause,
                renewalDate: {
                  gte: startDate,
                  lte: endDate
                }
              },
              orderBy: { renewalDate: 'asc' },
              select: {
                policyNumber: true,
                insuranceCompany: true,
                product: true,
                renewalDate: true,
                annualPremium: true,
                client: { select: { name: true } }
              },
              take: 15
            })
            return policies.length ? policies : `No hay pólizas por renovarse en los próximos ${days} días.`
          }
        })

        tools.getPortfolioStats = (tool as any)({
          description: 'Obtiene las estadísticas generales de la cartera del usuario, como el total de primas y el número de pólizas activas.',
          parameters: z.object({}),
          execute: async () => {
            const result = await prisma.policy.aggregate({
              where: { ...carteraWhereClause },
              _sum: { annualPremium: true },
              _count: { id: true }
            })
            return {
              totalPolicies: result._count.id,
              totalAnnualPremium: result._sum.annualPremium || 0
            }
          }
        })
    } else if (agent.type === 'SOCIAL_MEDIA_MANAGER') {
      tools.postToSocial = (tool as any)({
        description: 'Publica un mensaje en redes sociales',
        parameters: z.object({
          platform: z.enum(['Instagram', 'Facebook', 'LinkedIn', 'X']),
          content: z.string().describe('El contenido del post'),
        }),
        execute: async ({ platform, content }: { platform: any, content: any }) => {
          return `Post programado exitosamente en ${platform}.`
        },
      })

      const { fal } = await import('@fal-ai/client')
      
      tools.generateGraphicDesign = (tool as any)({
        description: 'Genera un diseño gráfico publicitario para redes sociales con una persona recortada sin fondo, colores de marca y texto superpuesto.',
        parameters: z.object({
          prompt: z.string().describe('Descripción detallada en inglés de la PERSONA o PERSONAS (sujetos humanos) a generar (ej. "a happy Mexican family hugging in a cozy living room, warm lighting" o "a relieved father inspecting a pipe in his kitchen"). DEBE contener humanos de forma obligatoria. NUNCA describas casas solas, objetos o símbolos sin personas, de lo contrario la eliminación de fondo (birefnet) borrará todo y el diseño quedará vacío.'),
          copyText: z.string().describe('El texto persuasivo corto (máximo 8 palabras) que aparecerá en el diseño.'),
          subtitle: z.string().describe('Un subtítulo muy corto (máximo 12 palabras) debajo del texto principal.'),
          socialMediaCaption: z.string().describe('El texto completo de la publicación para redes sociales (con emojis y hashtags) que acompañará a la imagen.'),
          backgroundData: z.string().describe('Un dato clave, estadística (ej. "7%") o palabra impactante para poner sutilmente gigante en el fondo del diseño.'),
        }),
        execute: async ({ prompt, copyText, subtitle, socialMediaCaption, backgroundData }: { prompt?: string, copyText?: string, subtitle?: string, socialMediaCaption?: string, backgroundData?: string }) => {
          try {
             // Check monthly generations limit (90 generations limit)
             const startOfMonth = new Date()
             startOfMonth.setDate(1)
             startOfMonth.setHours(0,0,0,0)

             // Fetch all ADMIN and SUPER_ADMIN users in this agency
             let adminUserIds = [agent.userId]
             if (dbUser?.agencyId) {
               const agencyAdmins = await prisma.user.findMany({
                 where: {
                   agencyId: dbUser.agencyId,
                   role: { in: ['ADMIN', 'SUPER_ADMIN'] }
                 },
                 select: { id: true }
               })
               adminUserIds = agencyAdmins.map(u => u.id)
             }

             const logs = await prisma.interactionLog.findMany({
               where: {
                 userId: { in: adminUserIds },
                 createdAt: {
                   gte: startOfMonth
                 }
               }
             })

             let generationCount = 0
             logs.forEach(log => {
               if (log.toolInvocations) {
                 try {
                   const parsed = typeof log.toolInvocations === 'string'
                     ? JSON.parse(log.toolInvocations)
                     : log.toolInvocations;
                   
                   if (Array.isArray(parsed)) {
                     const hasGraphicDesign = parsed.some((inv: any) => inv.toolName === 'generateGraphicDesign');
                     if (hasGraphicDesign) {
                       generationCount++;
                     }
                   }
                 } catch (err) {
                   // Ignore parse errors
                 }
               }
             })

             if (generationCount >= 90) {
               return `LIMIT_EXCEEDED: Se ha alcanzado el límite mensual de 90 generaciones de diseños gráficos para los administradores de esta agencia. Se han consumido ${generationCount}/90 generaciones.`
             }

            // Provide default fallbacks if the LLM hallucinated an empty argument object
            prompt = prompt || "professional insurance agent smiling";
            copyText = copyText || "El mejor seguro para ti";
            subtitle = subtitle || "";
            socialMediaCaption = socialMediaCaption || `¡Contáctanos hoy mismo para asegurar tu futuro! 🛡️💼 #Seguros #${agencyName.replace(/\s+/g, '')}`;
            backgroundData = backgroundData || "100%";

            // 1. Validate Agent Generation Limits
            const now = new Date();
            let currentCount = agent.imageGenerationsCount || 0;
            const resetDate = agent.imageGenerationsReset ? new Date(agent.imageGenerationsReset) : null;
            
            // Check if month has changed, if so, reset counter
            if (!resetDate || resetDate.getMonth() !== now.getMonth() || resetDate.getFullYear() !== now.getFullYear()) {
              currentCount = 0;
            }

            if (currentCount >= 45) {
              return "LIMIT_EXCEEDED: Se ha alcanzado el límite mensual de 45 diseños gráficos para este Agente IA. El límite se reiniciará el próximo mes.";
            }

            // 2. Generate image with flux (Upgraded to Flux Dev for ultra-premium anatomical rendering and realistic human extremities)
            let styleModifier = "";
            let premiumModifiers = "";
            const normalizedStyle = agent.designStyle ? agent.designStyle.toLowerCase() : "realista";

            if (normalizedStyle === 'realista' || normalizedStyle === 'realism' || !agent.designStyle) {
              styleModifier = ", ultra-realistic macro photograph";
              premiumModifiers = ", 8k resolution, cinematic studio lighting, shot on 85mm lens, extreme depth of field, hyper-detailed, award-winning advertising photography, centered main subject, isolated on a clean solid white backdrop with zero background artifacts, high contrast edge lighting";
            } else if (normalizedStyle === 'ilustración' || normalizedStyle === 'ilustracion' || normalizedStyle === 'illustration') {
              styleModifier = ", stunning 2.5D vector illustration";
              premiumModifiers = ", dribbble trending, vivid bold colors, highly detailed, professional graphic design, masterpiece, thick outlines, solid shapes, isolated on a clean solid white backdrop with zero background artifacts";
            } else if (normalizedStyle === '3d' || normalizedStyle === '3d render' || normalizedStyle === 'modelado 3d') {
              styleModifier = ", hyper-realistic 3D octane render";
              premiumModifiers = ", unreal engine 5, claymation masterpiece, cute incredibly detailed character, Pixar style, subsurface scattering, rim lighting, artstation trending, isolated on a clean solid white backdrop with zero background artifacts";
            } else if (normalizedStyle === 'dibujo animado' || normalizedStyle === 'cartoon' || normalizedStyle === 'caricatura') {
              styleModifier = ", spectacular modern cartoon illustration";
              premiumModifiers = ", crisp line art, vibrant neon colors, comic book masterpiece, highly detailed digital art, high resolution, isolated on a clean solid white backdrop with zero background artifacts";
            } else {
              styleModifier = `, masterpiece ${agent.designStyle} style`;
              premiumModifiers = ", ultra high quality, incredibly detailed, professional artwork, isolated on a clean solid white backdrop with zero background artifacts";
            }

            const fluxResult = await fal.subscribe("fal-ai/flux/dev", {
              input: {
                prompt: prompt + styleModifier + premiumModifiers,
                image_size: "square",
                num_inference_steps: 28,
                guidance_scale: 3.5,
                enable_safety_checker: true
              },
            }) as any;

            if (!fluxResult.data?.images?.[0]?.url) throw new Error("Flux failed to generate image")
            const originalUrl = fluxResult.data.images[0].url

            // 2. Remove background using birefnet
            const bgRemovalResult = await fal.subscribe("fal-ai/birefnet", {
              input: {
                image_url: originalUrl
              },
            }) as any;

            if (!bgRemovalResult.data?.image?.url) throw new Error("Background removal failed")
            const transparentUrl = bgRemovalResult.data.image.url

            // Prevent sending massive base64 strings in the stream payload
            const logo = companyProfile?.logoUrl || dbUser?.brandLogo;
            const isBase64 = logo && logo.startsWith('data:image');
            
            // Update agent's generation count
            await prisma.aIAgent.update({
              where: { id: agent.id },
              data: {
                imageGenerationsCount: currentCount + 1,
                imageGenerationsReset: now
              }
            });

            return {
              transparentUrl,
              copyText,
              subtitle,
              socialMediaCaption,
              backgroundData,
              brandPrimaryColor: companyProfile?.primaryColor || dbUser?.brandColor || '#0f172a',
              brandSecondaryColor: companyProfile?.secondaryColor || null,
              brandLogo: isBase64 ? null : (companyProfile?.logoUrl || dbUser?.brandLogo || logo),
              industry: companyProfile?.industry || 'Seguros'
            }
          } catch (e: any) {
            console.error('Fal AI Error:', e)
            return `Error generando el diseño: ${e.message || String(e)}`
          }
        }
      })
    }

    // Tools available to ALL agents
    const { tavily } = await import('@tavily/core')
    const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY || 'tvly-xxx' }) // Fallback so it doesn't crash if env missing

    tools.webSearch = (tool as any)({
      description: 'Busca información actualizada en internet sobre noticias, tendencias, o datos específicos de la industria.',
      parameters: z.object({
        query: z.string().optional().describe('La consulta de búsqueda a realizar en Google/Internet.'),
      }),
      execute: async ({ query }: { query: any }) => {
        try {
          let searchQuery = query;
          if (!searchQuery || searchQuery.trim() === '') {
            // Fallback to the last user message in the message list
            const lastUserMsg = [...messages].reverse().find((m: any) => m.role === 'user');
            searchQuery = lastUserMsg?.content || 'Aumento en el precio del seguro de Gastos Médicos Mayores';
          }

          const response = await tvly.search(searchQuery, {
            searchDepth: "basic",
            maxResults: 3
          });
          return response.results.map(r => `Fuente: ${r.title}\nContenido: ${r.content}`).join('\n\n');
        } catch (e: any) {
          console.error("Tavily Error:", e);
          const errorMsg = e.message || String(e);
          try {
            require('fs').writeFileSync('tavily-error.txt', errorMsg);
          } catch (writeErr) {
            console.error("Failed to write tavily-error.txt:", writeErr);
          }
          return `No se pudo realizar la búsqueda en internet en este momento: ${errorMsg}`;
        }
      }
    })

    systemPrompt += `
      Reglas importantes:
      1. Siempre responde en el idioma en el que te hablan.
      2. Mantén un tono profesional pero accesible.
      3. Utiliza las herramientas disponibles solo cuando sea estrictamente necesario.
      4. NUNCA inventes que usaste una herramienta si no lo hiciste.
      5. NUNCA incluyas URLs de imágenes o el resultado crudo de las herramientas en tus respuestas finales.
      6. BÚSQUEDAS WEB CONTEXTUALIZADAS: Cuando el usuario te pida buscar "noticias recientes", "novedades" o haga consultas ambiguas, DEBES contextualizar automáticamente el 'query' de tu herramienta 'webSearch' al mundo de los seguros, finanzas, Banco de México, SAT o economía mexicana. NO busques noticias deportivas, internacionales genéricas ni farándula. Por ejemplo, tu 'query' debe ser algo como "Noticias recientes finanzas seguros economía México SAT" en lugar de solo "noticias recientes".
    `
    
    if (agent.type !== 'SOCIAL_MEDIA_MANAGER') {
      systemPrompt += `      7. Si el usuario te pide generar una imagen, responde con este formato: ![Ilustración](https://image.pollinations.ai/prompt/DESCRIPCION?model=flux&width=1024&height=1024&nologo=true) (Reemplaza DESCRIPCION por un prompt en inglés con %20).`
    } else {
      systemPrompt += `      7. Si el usuario te pide diseñar una imagen, post, gráfica publicitaria o foto para redes sociales, DEBES usar obligatoriamente la herramienta 'generateGraphicDesign'.
      8. REGLAS MANDATORIAS PARA 'generateGraphicDesign':
         Al llamar a 'generateGraphicDesign', DEBES generar de forma obligatoria y 100% personalizada cada uno de los parámetros basados en la noticia, datos o el tema que investigaste. NUNCA dejes valores vacíos ni uses valores genéricos.
         - 'prompt': Describe en inglés al sujeto o elemento de la imagen de forma detallada y contextualizada.
           * Si el tema es inflación médica o precios altos de seguros: "a worried Mexican middle-aged man holding hospital bills, hospital background, cinematic lighting, sharp focus" o "a professional female doctor looking serious, pointing at a rising medical cost chart, studio lighting".
           * Si el tema es retiro o vejez: "a happy senior couple walking on a beach, cinematic sunset, warm colors".
           * Si el tema es accidentes o autos: "a family standing safely next to a car, modern urban background".
           * Si el tema es hogar o casa: "a happy family hugging inside their cozy living room, warm ambient lighting" o "a relieved homeowner standing inside a safe house, soft cinematic lighting".
           * REGLA DE ORO DE LA FOTO: Evita generar siempre el típico "smiling agent". Ajusta la persona, su edad, profesión y emoción al contexto exacto de la nota. PROHIBIDO pedir logos, íconos, vectores planos, símbolos (como "un escudo", "un billete", "una flecha") o texto escrito dentro de la imagen. El 'prompt' debe describir EXCLUSIVAMENTE escenas fotográficas cinematográficas, sujetos humanos, o personajes 3D hiper-detallados en situaciones reales.
         - 'copyText': El título o gancho visual principal de la tarjeta. Debe ser un extracto llamativo y corto (máximo 8 palabras) de la noticia o el gancho principal (ej. "+20% Inflación Médica", "Seguro de Auto 2026", "Asegura Tu Retiro", "Gasto Médico Sube"). NUNCA uses "El mejor seguro para ti" a menos que sea genérico.
         - 'subtitle': Un subtítulo muy corto de soporte (máximo 12 palabras) que complemente al título (ej. "Los costos hospitalarios subirán este año en México" o "Protégete frente al incremento de precios").
         - 'backgroundData': La estadística clave, porcentaje o palabra de impacto corta que irá gigante y semitransparente en el fondo (ej. "20%", "2026", "ALERTA", "SALUD").
         - 'socialMediaCaption': La redacción de la publicación completa para redes sociales (con emojis, hashtags, datos persuasivos y un fuerte llamado a la acción). Debe ser profesional y estar completamente adaptada a la nota o noticia. Escribe un texto completo y atractivo de al menos 2 párrafos cortos. DEBES incluir SIEMPRE el hashtag #${agencyName.replace(/\s+/g, '')} al final de la publicación.
      9. REGLA DE RESPUESTA CRÍTICA: En tu mensaje de texto final para el usuario, **NUNCA** imprimas, repitas o enlaces la URL de la imagen de salida (transparentUrl) ni el resultado crudo de la herramienta (como el JSON). El sistema renderiza la imagen automáticamente en un componente visual del chat, por lo que imprimir la URL en tu texto es confuso e incómodo. Concéntrate únicamente en entregar el texto de la publicación y tu análisis.`
    }

    const coreMessages = convertUiMessagesToModelMessages(messages)

    let currentMessages = [...coreMessages]

    let loopCount = 0
    const maxLoops = 3
    let hasMoreSearchCalls = true

    while (hasMoreSearchCalls && loopCount < maxLoops) {
      loopCount++
      
      const response = await generateText({
        model: google('gemini-2.5-flash'),
        system: systemPrompt,
        messages: currentMessages,
        tools: tools as any,
      })

      if (response.toolCalls && response.toolCalls.length > 0) {
        const hasWebSearch = response.toolCalls.some(tc => tc.toolName === 'webSearch')
        const hasOtherTools = response.toolCalls.some(tc => tc.toolName !== 'webSearch')

        if (hasWebSearch && !hasOtherTools) {
          // Construct assistant message with tool calls
          const assistantParts: any[] = []
          if (response.text) {
            assistantParts.push({ type: 'text', text: response.text })
          }
          for (const tc of response.toolCalls) {
            assistantParts.push({
              type: 'tool-call',
              toolCallId: tc.toolCallId,
              toolName: tc.toolName,
              input: tc.input
            })
          }
          currentMessages.push({
            role: 'assistant',
            content: assistantParts
          })

          // Execute search tool calls
          const toolResultParts: any[] = []
          for (const tc of response.toolCalls) {
            if (tc.toolName === 'webSearch') {
              const result = await tools.webSearch.execute(tc.input, { toolCallId: tc.toolCallId, messages: currentMessages })
              toolResultParts.push({
                type: 'tool-result',
                toolCallId: tc.toolCallId,
                toolName: tc.toolName,
                output: { type: 'text', value: result }
              })
            }
          }
          currentMessages.push({
            role: 'tool',
            content: toolResultParts
          })
        } else {
          // If it has non-webSearch tools (or mixed), we break and let streamText handle it
          hasMoreSearchCalls = false
        }
      } else {
        // No tool calls, break and stream the final response
        hasMoreSearchCalls = false
      }
    }

    const result = await streamText({
      model: google('gemini-2.5-flash'),
      system: systemPrompt,
      messages: currentMessages,
      tools: tools as any,
      stopWhen: isStepCount(5),
      async onFinish(eventArgs) {
        const { text, toolCalls, toolResults } = eventArgs
        console.log("--- onFinish called ---", { textLength: text?.length, toolCalls: toolCalls?.length })
        
        let toolInvocations = null
        if (toolCalls && toolCalls.length > 0) {
          toolInvocations = toolCalls.map((call) => {
            const tr = toolResults?.find(r => r.toolCallId === call.toolCallId)
            return {
              state: 'result',
              toolCallId: call.toolCallId,
              toolName: call.toolName,
              args: (call as any).args !== undefined ? (call as any).args : (call as any).input,
              result: (tr as any).result !== undefined ? (tr as any).result : (tr as any).output,
            }
          })
        }

        try {
          // Save assistant response when stream finishes
          await prisma.interactionLog.create({
            data: {
              aiAgentId: agent.id,
              userId: agent.userId,
              role: 'assistant',
              content: text || '',
              toolInvocations: (toolInvocations ? toolInvocations : undefined) as any
            }
          })
          revalidatePath(`/agents/${agent.id}/chat`)
        } catch (onFinishError: any) {
          console.error("onFinish Error:", onFinishError)
        }
      }
    })

    return result.toUIMessageStreamResponse()
    
  } catch (error: any) {
    console.error("Chat API Error:", error)
    return new Response(error.message || String(error), { status: 500 })
  }
}
