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
  const session = await auth()
  if (!session || !session.user || !session.user.email) {
    throw new Error('No autorizado')
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: session.user.email }
  })
  if (!dbUser) {
    throw new Error('Usuario no encontrado')
  }

  const agent = await prisma.aIAgent.findUnique({
    where: { id: aiAgentId }
  })
  if (!agent || agent.userId !== dbUser.id) {
    throw new Error('Agente no encontrado o no pertenece al usuario')
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
}
