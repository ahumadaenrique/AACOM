"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { generateText } from 'ai'

async function lazyResetAndGetBalance(userId: string) {
  const now = new Date()
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      voicePurchases: {
        where: {
          expiresAt: { gt: now },
          secondsRemaining: { gt: 0 }
        },
        orderBy: {
          purchasedAt: 'asc'
        }
      }
    }
  })
  
  if (!user) throw new Error("Usuario no encontrado")

  let freeBalance = user.freeSecondsBalance
  let lastReset = user.lastFreeMinutesReset
  
  const msIn30Days = 30 * 24 * 60 * 60 * 1000
  const elapsedMs = now.getTime() - lastReset.getTime()
  
  if (elapsedMs >= msIn30Days) {
    const periods = Math.floor(elapsedMs / msIn30Days)
    const newReset = new Date(lastReset.getTime() + periods * msIn30Days)
    freeBalance = 300 // Resetea a 5 minutos, no acumulativo
    
    await prisma.user.update({
      where: { id: userId },
      data: {
        freeSecondsBalance: freeBalance,
        lastFreeMinutesReset: newReset
      }
    })
  }

  const paidSeconds = user.voicePurchases.reduce((acc, p) => acc + p.secondsRemaining, 0)
  const totalBalance = freeBalance + paidSeconds

  if (user.voiceSecondsBalance !== totalBalance) {
    await prisma.user.update({
      where: { id: userId },
      data: { voiceSecondsBalance: totalBalance }
    })
  }

  return {
    totalBalance,
    freeSecondsBalance: freeBalance,
    voicePurchases: user.voicePurchases
  }
}

export async function getVoiceBalance() {
  const session = await auth()
  if (!session?.user?.email) throw new Error("No autenticado")

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true }
  })
  if (!user) return 0

  const { totalBalance } = await lazyResetAndGetBalance(user.id)
  return totalBalance
}

export async function deductVoiceSeconds(secondsUsed: number) {
  if (secondsUsed <= 0) return { success: true }
  
  const session = await auth()
  if (!session?.user?.email) throw new Error("No autenticado")

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true }
  })
  if (!user) throw new Error("Usuario no encontrado")

  const { freeSecondsBalance, voicePurchases } = await lazyResetAndGetBalance(user.id)

  let remainingToDeduct = secondsUsed
  let newFreeBalance = freeSecondsBalance

  if (remainingToDeduct <= freeSecondsBalance) {
    newFreeBalance = freeSecondsBalance - remainingToDeduct
    remainingToDeduct = 0
  } else {
    remainingToDeduct -= freeSecondsBalance
    newFreeBalance = 0

    // Descontar cronológicamente (más antiguos primero)
    for (const purchase of voicePurchases) {
      if (remainingToDeduct <= 0) break

      if (remainingToDeduct <= purchase.secondsRemaining) {
        await prisma.voiceMinutesPurchase.update({
          where: { id: purchase.id },
          data: { secondsRemaining: purchase.secondsRemaining - remainingToDeduct }
        })
        remainingToDeduct = 0
      } else {
        remainingToDeduct -= purchase.secondsRemaining
        await prisma.voiceMinutesPurchase.update({
          where: { id: purchase.id },
          data: { secondsRemaining: 0 }
        })
      }
    }
  }

  // Actualizar el User
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      freeSecondsBalance: newFreeBalance
    }
  })

  // Recalcular saldo total para caché
  const { totalBalance } = await lazyResetAndGetBalance(user.id)

  return { success: true, remainingBalance: totalBalance }
}

export async function getElevenLabsAgentId() {
  // Aquí podemos retornar el Agent ID configurado en las variables de entorno
  // O buscarlo en la base de datos si fuera dinámico por agencia
  return process.env.ELEVENLABS_AGENT_ID || ""
}

export async function getVoiceAgentPrompt(agentId: string) {
  const session = await auth()
  if (!session?.user?.email) throw new Error("No autenticado")

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      FrequentContact: true
    }
  })

  const agent = await prisma.aIAgent.findUnique({
    where: { id: agentId },
    select: { name: true, systemPrompt: true }
  })
  const agentName = agent?.name || "María"
  const instruccionesExtra = agent?.systemPrompt || ""

  // Retornamos las variables dinámicas
  let contactosList = "No tienes contactos frecuentes configurados."
  if (user?.FrequentContact && user.FrequentContact.length > 0) {
    contactosList = user.FrequentContact.map(c => `- ${c.name}: ${c.email}`).join(', ')
  }

  // Ajustar la fecha a la zona horaria de México para evitar saltos de día por UTC
  const mxDate = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Mexico_City" }));
  const today = mxDate.getFullYear() + "-" + String(mxDate.getMonth() + 1).padStart(2, '0') + "-" + String(mxDate.getDate()).padStart(2, '0');

  return {
    fecha_de_hoy: today,
    contactos_frecuentes: contactosList,
    nombre_agente: agentName,
    instrucciones_adicionales: instruccionesExtra
  }
}

function parseRelativeDate(dateStr: string | undefined): string {
  const mxDate = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Mexico_City" }));
  
  const formatDate = (d: Date) => {
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, '0') + "-" + String(d.getDate()).padStart(2, '0');
  };

  if (!dateStr) {
    return formatDate(mxDate);
  }

  const normalized = dateStr.toLowerCase().trim();

  if (normalized === 'hoy' || normalized === 'today') {
    return formatDate(mxDate);
  }
  
  if (normalized === 'mañana' || normalized === 'tomorrow') {
    const tomorrow = new Date(mxDate);
    tomorrow.setDate(mxDate.getDate() + 1);
    return formatDate(tomorrow);
  }

  if (normalized === 'ayer' || normalized === 'yesterday') {
    const yesterday = new Date(mxDate);
    yesterday.setDate(mxDate.getDate() - 1);
    return formatDate(yesterday);
  }

  // If it's already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return normalized;
  }

  // If it has a T (e.g. ISO format)
  if (normalized.includes('t')) {
    const part = normalized.split('t')[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(part)) {
      return part;
    }
  }

  try {
    const parsedDate = new Date(dateStr);
    if (!isNaN(parsedDate.getTime())) {
      return formatDate(parsedDate);
    }
  } catch (e) {}

  return formatDate(mxDate);
}

export async function getVoiceAgenda(dateStr: string, agentId: string) {
  const session = await auth()
  if (!session?.user?.email) return "No estás autenticado para ver la agenda."

  const agent = await prisma.aIAgent.findUnique({ where: { id: agentId } })
  if (!agent) return "Agente no encontrado."

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return "Usuario no encontrado."

  const sanitizedDate = parseRelativeDate(dateStr)

  // 1. Intentar obtener la agenda desde Google Calendar con un timeout de seguridad
  let events: any[] = []
  let fetchedFromGoogle = false

  try {
    const calendar = await getGoogleCalendarClient(user.id)
    if (calendar) {
      const timeMin = `${sanitizedDate}T00:00:00-06:00`
      const timeMax = `${sanitizedDate}T23:59:59-06:00`
      
      const googleCall = calendar.events.list({
        calendarId: 'primary',
        timeMin: new Date(timeMin).toISOString(),
        timeMax: new Date(timeMax).toISOString(),
        singleEvents: true,
        orderBy: 'startTime'
      })

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Google Calendar API Timeout")), 3200)
      )

      const response = await Promise.race([googleCall, timeoutPromise])
      events = response.data.items || []
      fetchedFromGoogle = true
    }
  } catch (err) {
    console.error("Error or timeout fetching from Google Calendar, falling back to local DB:", err)
  }

  if (fetchedFromGoogle) {
    if (events.length === 0) {
      return `No tienes reuniones agendadas en tu Google Calendar para el día ${sanitizedDate}.`
    }
    
    const list = events.map(e => {
      const start = e.start?.dateTime || e.start?.date || ""
      let timeFormatted = "Todo el día"
      if (start.includes('T')) {
        const eventDate = new Date(start)
        const localTimeStr = eventDate.toLocaleTimeString('es-MX', { timeZone: 'America/Mexico_City', hour: '2-digit', minute: '2-digit', hour12: false })
        timeFormatted = localTimeStr
      }
      return `- ${timeFormatted}: ${e.summary}`
    }).join('\n')
    
    return `Reuniones agendadas en tu Google Calendar para el ${sanitizedDate}:\n${list}`
  }

  // 2. Fallback a la base de datos local
  const localMeetings = await prisma.meeting.findMany({
    where: {
      userId: user.id,
      date: sanitizedDate // YYYY-MM-DD
    },
    orderBy: { time: 'asc' }
  })

  if (localMeetings.length === 0) {
    return `No tienes reuniones agendadas para la fecha ${sanitizedDate}.`
  }

  const list = localMeetings.map(m => `- ${m.time}: ${m.title}`).join('\n')
  return `Reuniones agendadas para el ${sanitizedDate} (local):\n${list}`
}

export async function scheduleVoiceMeeting(title: string, date: string, time: string, duration: number, agentId: string) {
  const session = await auth()
  if (!session?.user?.email) return "No estás autenticado para agendar reuniones."

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return "Usuario no encontrado."

  const sanitizedDate = parseRelativeDate(date)

  try {
    const meeting = await prisma.meeting.create({
      data: {
        title,
        date: sanitizedDate, // YYYY-MM-DD
        time, // HH:MM
        duration,
        userId: user.id
      }
    })

    // Intentar sincronizar con Google Calendar
    try {
      const calendar = await getGoogleCalendarClient(user.id)
      if (calendar) {
        // Al crear la fecha en Vercel (UTC), agregamos el offset de México (-06:00) para que no la tome como UTC
        const startDate = new Date(`${sanitizedDate}T${time}:00-06:00`);
        const endDate = new Date(startDate.getTime() + duration * 60000);

        await calendar.events.insert({
          calendarId: 'primary',
          requestBody: {
            summary: title,
            start: {
              dateTime: startDate.toISOString(),
              timeZone: 'America/Mexico_City'
            },
            end: {
              dateTime: endDate.toISOString(),
              timeZone: 'America/Mexico_City'
            }
          }
        });
        return `Reunión agendada exitosamente en tu agenda local y sincronizada con Google Calendar: "${meeting.title}" el ${meeting.date} a las ${meeting.time} (${meeting.duration} minutos).`
      }
    } catch (calError) {
      console.error("Error sincronizando con Google Calendar:", calError)
      // Fallback silencioso si falla la sincronización, pero se guardó en local
    }

    return `Reunión agendada exitosamente en el calendario local (sin Google Calendar): "${meeting.title}" el ${meeting.date} a las ${meeting.time} (${meeting.duration} minutos).`
  } catch (error: any) {
    console.error("Error agendando reunión:", error)
    return `No se pudo agendar la reunión debido a un error: ${error.message}`
  }
}

import { getGmailClient, getGoogleCalendarClient } from '@/lib/google-clients'

export async function draftVoiceEmail(to: string, subject: string, body: string, agentId: string) {
  const session = await auth()
  if (!session?.user?.email) return "No estás autenticado para mandar correos."

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return "Usuario no encontrado."

  try {
    const gmail = await getGmailClient(user.id)
    if (!gmail) {
      return 'No tienes una cuenta de Google conectada o no has concedido permisos para Gmail.'
    }

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

    await gmail.users.drafts.create({
      userId: 'me',
      requestBody: {
        message: { raw }
      }
    })
    
    return `Borrador de correo creado exitosamente en tu Gmail para "${cleanTo}" con el asunto "${subject}". Ya puedes revisarlo y enviarlo desde tu bandeja de Borradores.`
  } catch (error: any) {
    console.error("Error creando borrador:", error)
    return `No se pudo procesar el correo debido a un error: ${error.message}`
  }
}

export async function createVoiceTask(title: string, description: string | undefined, priority: 'LOW' | 'MEDIUM' | 'HIGH', dueDate: string | undefined, agentId: string) {
  const session = await auth()
  if (!session?.user?.email) return "No autenticado"

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return "Usuario no encontrado"

  try {
    const existingTask = await prisma.task.findFirst({
      where: { userId: user.id, title, createdAt: { gte: new Date(Date.now() - 15000) } }
    })
    
    if (existingTask) {
      return `La tarea ya fue creada hace un momento. ID: ${existingTask.id}`
    }

    const task = await prisma.task.create({
      data: { title, description, priority: priority || 'MEDIUM', dueDate, userId: user.id }
    })
    
    return `Tarea creada exitosamente: "${task.title}".`
  } catch (e: any) {
    return `Error al crear la tarea: ${e.message}`
  }
}

export async function listVoiceTasks(completed: boolean, agentId: string) {
  const session = await auth()
  if (!session?.user?.email) return "No autenticado"

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return "Usuario no encontrado"

  try {
    const tasks = await prisma.task.findMany({
      where: { userId: user.id, completed },
      orderBy: { createdAt: 'desc' }
    })

    if (tasks.length === 0) {
      return `No tienes tareas ${completed ? 'completadas' : 'pendientes'} actualmente.`
    }

    return `Tareas ${completed ? 'completadas' : 'pendientes'}:\n` + tasks.map(t => 
      `- [${t.priority}] ${t.title} (ID: ${t.id})${t.dueDate ? ` - Vence: ${t.dueDate}` : ''}`
    ).join('\n')
  } catch (e: any) {
    return `Error al listar las tareas: ${e.message}`
  }
}

export async function completeVoiceTask(title: string, agentId: string) {
  const session = await auth()
  if (!session?.user?.email) return "No autenticado"

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return "Usuario no encontrado"

  try {
    const tasks = await prisma.task.findMany({
      where: { userId: user.id, completed: false }
    })
    const matched = tasks.find(t => t.title.toLowerCase().includes(title.toLowerCase()))
    
    if (!matched) {
      return `No encontré ninguna tarea pendiente que se llame "${title}".`
    }

    await prisma.task.update({
      where: { id: matched.id },
      data: { completed: true }
    })
    return `La tarea "${matched.title}" ha sido completada.`
  } catch (e: any) {
    return `Error al completar la tarea: ${e.message}`
  }
}

export async function deleteVoiceTask(title: string, agentId: string) {
  const session = await auth()
  if (!session?.user?.email) return "No autenticado"

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return "Usuario no encontrado"

  try {
    const tasks = await prisma.task.findMany({
      where: { userId: user.id }
    })
    const matched = tasks.find(t => t.title.toLowerCase().includes(title.toLowerCase()))
    
    if (!matched) {
      return `No encontré ninguna tarea que se llame "${title}".`
    }

    await prisma.task.delete({
      where: { id: matched.id }
    })
    return `La tarea "${matched.title}" ha sido eliminada.`
  } catch (e: any) {
    return `Error al eliminar la tarea: ${e.message}`
  }
}

export async function syncVoiceCallSummary(conversationId: string, agentId: string) {
  const session = await auth()
  if (!session?.user?.email) return { success: false, error: "No autenticado" }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return { success: false, error: "Usuario no encontrado" }

  const apiKey = process.env.ELEVENLABS_API_KEY || "";
  if (!apiKey) {
    console.error("ELEVENLABS_API_KEY no está configurada en las variables de entorno.");
    return { success: false, error: "API Key de ElevenLabs no configurada" }
  }

  try {
    // 1. Consultar detalles de la conversación en ElevenLabs
    const response = await fetch(`https://api.elevenlabs.io/v1/convai/conversations/${conversationId}`, {
      method: 'GET',
      headers: {
        'xi-api-key': apiKey
      }
    });

    if (!response.ok) {
      throw new Error(`Error de ElevenLabs: ${response.statusText}`);
    }

    const data = await response.json();
    const summary = data.analysis?.summary || "";
    const transcript = data.transcript || [];

    if (!summary && transcript.length === 0) {
      return { success: true, message: "Llamada vacía, no se generó resumen." };
    }

    // 2. Intentar generar minuta estructurada con Gemini a partir de la transcripción
    let executiveSummary = "";
    if (transcript.length > 0) {
      try {
        const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
        if (geminiApiKey) {
          const google = createGoogleGenerativeAI({ apiKey: geminiApiKey });
          
          const rawTranscriptText = transcript.map((t: any) => {
            const role = t.role === 'user' ? 'Usuario' : 'Asistente';
            return `${role}: ${t.message}`;
          }).join('\n');

          const prompt = `Actúa como un asistente administrativo profesional experto en redacción de minutas de negocio. A continuación se muestra la transcripción de una llamada de voz.
Genera un resumen ejecutivo estructurado con este formato exacto en Markdown:

### 📋 Minuta y Acuerdos de Llamada
**Resumen General**:
(Escribe aquí un resumen breve y directo de 2-3 oraciones sobre lo platicado)

**Decisiones y Acuerdos**:
- (Lista con viñetas de lo que se decidió)

**Tareas y Compromisos (Action Items)**:
- (Lista con viñetas de las tareas pendientes de cada uno)

Transcripción de la llamada:
"""
${rawTranscriptText}
"""

Responde únicamente con la minuta estructurada en Markdown. Sé conciso y profesional, evita introducciones o saludos.`;

          const { text } = await generateText({
            model: google('gemini-2.5-flash'),
            prompt,
          });
          
          executiveSummary = text;
        }
      } catch (geminiError) {
        console.error("Error generating executive summary with Gemini:", geminiError);
      }
    }

    // 3. Dar formato estético final al mensaje
    let content = `📞 **Resumen de Llamada de Voz**\n\n`;
    
    if (executiveSummary) {
      content += `${executiveSummary}\n\n`;
    } else if (summary) {
      content += `### 📋 Resumen General\n${summary}\n\n`;
    } else {
      content += `> *Llamada completada (sin resumen disponible).* \n\n`;
    }

    if (transcript.length > 0) {
      content += `\n---\n<details>\n<summary>💬 Ver transcripción completa de la llamada</summary>\n\n`;
      transcript.forEach((t: any) => {
        const roleName = t.role === 'user' ? 'Tú' : 'María';
        content += `* **${roleName}:** ${t.message}\n`;
      });
      content += `\n</details>`;
    }

    // 4. Crear el registro en el historial de chat (InteractionLog)
    await prisma.interactionLog.create({
      data: {
        aiAgentId: agentId,
        userId: user.id,
        role: 'assistant', // Lo guardamos como mensaje del asistente
        content
      }
    });

    return { success: true, summary, transcriptCount: transcript.length };
  } catch (error: any) {
    console.error("Error al sincronizar resumen de voz:", error);
    return { success: false, error: error.message };
  }
}

export async function getVoiceWeeklyEvents(agentId: string) {
  const session = await auth()
  if (!session?.user?.email) return { success: false, error: "No autenticado" }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return { success: false, error: "Usuario no encontrado" }

  const mxDate = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Mexico_City" }))
  
  const formatDate = (d: Date) => {
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, '0') + "-" + String(d.getDate()).padStart(2, '0');
  };

  const todayStr = formatDate(mxDate)
  
  const futureDate = new Date(mxDate)
  futureDate.setDate(mxDate.getDate() + 7)
  const maxDateStr = formatDate(futureDate)

  let googleEvents: any[] = []
  let localMeetings: any[] = []
  let fetchedFromGoogle = false

  // 1. Fetch from Google Calendar
  try {
    const calendar = await getGoogleCalendarClient(user.id)
    if (calendar) {
      const timeMin = `${todayStr}T00:00:00-06:00`
      const timeMax = `${maxDateStr}T23:59:59-06:00`
      
      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: new Date(timeMin).toISOString(),
        timeMax: new Date(timeMax).toISOString(),
        singleEvents: true,
        orderBy: 'startTime'
      })
      googleEvents = response.data.items || []
      fetchedFromGoogle = true
    }
  } catch (err) {
    console.error("Error fetching weekly google events:", err)
  }

  // 2. Fetch from Local Database
  try {
    localMeetings = await prisma.meeting.findMany({
      where: {
        userId: user.id,
        date: {
          gte: todayStr,
          lte: maxDateStr
        }
      },
      orderBy: [
        { date: 'asc' },
        { time: 'asc' }
      ]
    })
  } catch (err) {
    console.error("Error fetching weekly local meetings:", err)
  }

  return {
    success: true,
    fetchedFromGoogle,
    todayStr,
    maxDateStr,
    googleEvents: googleEvents.map(e => ({
      summary: e.summary,
      start: e.start,
      end: e.end,
      id: e.id
    })),
    localMeetings: localMeetings.map(m => ({
      title: m.title,
      date: m.date,
      time: m.time,
      duration: m.duration
    }))
  }
}
