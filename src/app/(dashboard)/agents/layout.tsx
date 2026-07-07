import { ReactNode } from "react"
import { prisma } from "@/lib/prisma"
import { AgentsSidebar } from "@/components/AgentsSidebar"
import { auth } from "@/auth"

export const dynamic = 'force-dynamic'

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
      if (dbUser?.agency?.name) {
        agencyName = dbUser.agency.name
      }
    }
    
    agents = await prisma.aIAgent.findMany({
      where: {
        type: { not: 'RECEPTIONIST' }
      },
      orderBy: { createdAt: 'asc' }
    })
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
