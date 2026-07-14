'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function schedulePostAction({
  aiAgentId,
  content,
  imageUrl,
  platform,
  scheduledAt
}: {
  aiAgentId: string
  content: string
  imageUrl: string | null
  platform: string
  scheduledAt: string // ISO string
}) {
  try {
    const session = await auth()
    if (!session || !session.user || !session.user.email) {
      return { success: false, error: 'Sesión no iniciada o no autorizada' }
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    })
    if (!dbUser) {
      return { success: false, error: 'Usuario no encontrado en la base de datos' }
    }

    const agent = await prisma.aIAgent.findUnique({
      where: { id: aiAgentId }
    })
    if (!agent || agent.userId !== dbUser.id) {
      return { success: false, error: 'El agente no pertenece a tu cuenta' }
    }

    const newPost = await prisma.draftPost.create({
      data: {
        aiAgentId,
        content,
        imageUrl,
        platform,
        status: 'SCHEDULED',
        scheduledAt: new Date(scheduledAt)
      }
    })

    return { success: true, post: newPost }
  } catch (err: any) {
    console.error('Error in schedulePostAction:', err)
    return { success: false, error: err.message || 'Error interno del servidor' }
  }
}
