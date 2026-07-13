"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function getVoiceBalance() {
  const session = await auth()
  if (!session?.user?.email) throw new Error("No autenticado")

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { voiceSecondsBalance: true }
  })

  return user?.voiceSecondsBalance || 0
}

export async function deductVoiceSeconds(secondsUsed: number) {
  if (secondsUsed <= 0) return { success: true }
  
  const session = await auth()
  if (!session?.user?.email) throw new Error("No autenticado")

  const user = await prisma.user.update({
    where: { email: session.user.email },
    data: {
      voiceSecondsBalance: {
        decrement: secondsUsed
      }
    }
  })

  return { success: true, remainingBalance: user.voiceSecondsBalance }
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
    where: { id: agentId }
  })
  if (!agent) return "Eres un asistente de Inteligencia Artificial."

  let prompt = `Eres ${agent.name}, un agente de Inteligencia Artificial.
Rol: Asistente Ejecutivo
Directiva principal: ${agent.systemPrompt || ''}
Lineamientos: ${agent.guidelines || ''}

Importante: Responde de forma hablada. Sé conciso y amigable. No uses viñetas ni formato Markdown porque tu respuesta se convertirá en voz.`

  if (user?.FrequentContact && user.FrequentContact.length > 0) {
    const contactsList = user.FrequentContact.map(c => `- ${c.name}: ${c.email}`).join('\n')
    prompt += `\n\nCONTACTOS FRECUENTES DE TU USUARIO (Úsalos para resolver nombres a direcciones de correo electrónico de forma directa):\n${contactsList}`
  }

  return prompt
}

export async function getVoiceAgenda(dateStr: string, agentId: string) {
  const session = await auth()
  if (!session?.user?.email) return "No estás autenticado para ver la agenda."

  const agent = await prisma.aIAgent.findUnique({ where: { id: agentId } })
  if (!agent) return "Agente no encontrado."

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return "Usuario no encontrado."

  const localMeetings = await prisma.meeting.findMany({
    where: {
      userId: user.id,
      date: dateStr // YYYY-MM-DD
    },
    orderBy: { time: 'asc' }
  })

  if (localMeetings.length === 0) {
    return `No tienes reuniones agendadas para la fecha ${dateStr}.`
  }

  const list = localMeetings.map(m => `- ${m.time}: ${m.title}`).join('\n')
  return `Reuniones agendadas para el ${dateStr}:\n${list}`
}

export async function scheduleVoiceMeeting(title: string, date: string, time: string, duration: number, agentId: string) {
  const session = await auth()
  if (!session?.user?.email) return "No estás autenticado para agendar reuniones."

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return "Usuario no encontrado."

  try {
    const meeting = await prisma.meeting.create({
      data: {
        title,
        date, // YYYY-MM-DD
        time, // HH:MM
        duration,
        userId: user.id
      }
    })
    return `Reunión agendada exitosamente en el calendario local: "${meeting.title}" el ${meeting.date} a las ${meeting.time} (${meeting.duration} minutos).`
  } catch (error: any) {
    console.error("Error agendando reunión:", error)
    return `No se pudo agendar la reunión debido a un error: ${error.message}`
  }
}

import { getGmailClient } from '@/lib/google-clients'

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
