import { ReactNode } from "react"
import { prisma } from "@/lib/prisma"
import { AgentsSidebar } from "@/components/AgentsSidebar"
import { auth } from "@/auth"

export const dynamic = 'force-dynamic'

async function ensureDefaultAgents(userId: string) {
  try {
    const existingExecutive = await prisma.aIAgent.findFirst({
      where: { userId, type: "EXECUTIVE_ASSISTANT" }
    })
    if (!existingExecutive) {
      await prisma.aIAgent.create({
        data: {
          name: "María la Asistente",
          type: "EXECUTIVE_ASSISTANT",
          userId,
          isActive: true,
          systemPrompt: "Eres un Asistente Ejecutivo altamente proactivo y profesional. Tu objetivo es ayudar a organizar la agenda, crear minutas de reuniones y enviar recordatorios."
        }
      })
    }

    const existingMkt = await prisma.aIAgent.findFirst({
      where: { userId, type: "SOCIAL_MEDIA_MANAGER" }
    })
    if (!existingMkt) {
      await prisma.aIAgent.create({
        data: {
          name: "Ramiro el de MKT",
          type: "SOCIAL_MEDIA_MANAGER",
          userId,
          isActive: true,
          systemPrompt: "Eres Ramiro el de MKT, un creativo social media manager encargado de diseñar posts, mockups e imágenes publicitarias para redes sociales de tu agencia."
        }
      })
    }
  } catch (e) {
    console.error("ensureDefaultAgents error:", e)
  }
}

export default async function AgentsLayout({ children }: { children: ReactNode }) {
  const session = await auth()
  let agencyName = "AACOM"
  let agents: any[] = []
  try {
    if (session?.user?.email) {
      const dbUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { agency: true }
      })
      if (dbUser) {
        if (dbUser.agency?.name) {
          agencyName = dbUser.agency.name
        }
        
        // Ensure this user has María and Ramiro configured
        await ensureDefaultAgents(dbUser.id)
        
        // Query agents belonging to this user
        agents = await prisma.aIAgent.findMany({
          where: {
            userId: dbUser.id,
            type: { not: 'RECEPTIONIST' }
          },
          orderBy: { createdAt: 'asc' }
        })
      }
    }
  } catch (e) {
    console.error("Failed to query agents for layout:", e)
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-neutral-950 text-neutral-50 overflow-hidden w-full">
      <AgentsSidebar agents={agents} agencyName={agencyName} />
      <div className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden">
        {children}
      </div>
    </div>
  )
}
