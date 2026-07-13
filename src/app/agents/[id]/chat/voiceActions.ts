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

  const agent = await prisma.aIAgent.findUnique({
    where: { id: agentId }
  })
  if (!agent) return "Eres un asistente de Inteligencia Artificial."

  const prompt = `Eres ${agent.name}, un agente de Inteligencia Artificial.
Rol: Asistente Ejecutivo
Directiva principal: ${agent.systemPrompt || ''}
Lineamientos: ${agent.guidelines || ''}

Importante: Responde de forma hablada. Sé conciso y amigable. No uses viñetas ni formato Markdown porque tu respuesta se convertirá en voz. Si te piden tu agenda, usa la herramienta de consultar_agenda.`

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
