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
