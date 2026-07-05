'use server'

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createAgent(formData: FormData) {
  const name = formData.get('name') as string
  const type = formData.get('type') as string
  const systemPrompt = formData.get('systemPrompt') as string
  const designStyle = formData.get('designStyle') as string

  if (!name || !type) {
    return { error: 'Name and type are required' }
  }

  // Get a default user for MVP
  const user = await prisma.user.findFirst()
  if (!user) {
    return { error: 'No user found in database' }
  }

  // Check constraint: only 1 agent of each type allowed
  const existingAgent = await prisma.aIAgent.findFirst({
    where: { type, userId: user.id }
  })

  if (existingAgent) {
    return { error: `Ya existe un agente con el rol ${type}. Solo puedes tener uno por categoría.` }
  }

  // Pre-configured default prompts based on type
  let defaultPrompt = ""
  if (type === 'EXECUTIVE_ASSISTANT') {
    defaultPrompt = "Eres un Asistente Ejecutivo altamente proactivo y profesional. Tu objetivo es ayudar a organizar la agenda, crear minutas de reuniones y enviar recordatorios."
  } else if (type === 'SOCIAL_MEDIA_MANAGER') {
    defaultPrompt = "Eres un Social Media Manager experto en tendencias virales, redacción persuasiva y análisis de métricas para X, LinkedIn, Facebook e Instagram."
  } else if (type === 'RECEPTIONIST') {
    defaultPrompt = "Eres un Recepcionista telefónico cordial y eficiente. Respondes dudas frecuentes y puedes agendar citas si se te solicita."
  }

  const finalPrompt = systemPrompt || defaultPrompt

  await prisma.aIAgent.create({
    data: {
      name,
      type,
      systemPrompt: finalPrompt,
      designStyle: designStyle || "Realista",
      userId: user.id
    }
  })

  revalidatePath('/')
  redirect('/')
}

export async function updateAgent(id: string, formData: FormData) {
  const name = formData.get('name') as string
  const type = formData.get('type') as string
  const systemPrompt = formData.get('systemPrompt') as string
  const designStyle = formData.get('designStyle') as string

  // We skip type constraint check on update if it's the same type
  const agent = await prisma.aIAgent.findUnique({ where: { id } })
  if (agent && agent.type !== type) {
    const existingAgent = await prisma.aIAgent.findFirst({
      where: { type, userId: agent.userId }
    })
    if (existingAgent) {
      return { error: `Ya existe un agente con el rol ${type}. Solo puedes tener uno por categoría.` }
    }
  }

  await prisma.aIAgent.update({
    where: { id },
    data: {
      name,
      type,
      systemPrompt,
      designStyle,
    }
  })

  revalidatePath('/')
  redirect('/')
}

export async function deleteAgent(id: string) {
  await prisma.aIAgent.delete({
    where: { id }
  })
  
  revalidatePath('/')
  redirect('/')
}
