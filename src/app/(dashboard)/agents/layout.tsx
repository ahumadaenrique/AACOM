import { ReactNode } from "react"
import { prisma } from "@/lib/prisma"
import { AgentsSidebar } from "@/components/AgentsSidebar"

export const dynamic = 'force-dynamic'

export default async function AgentsLayout({ children }: { children: ReactNode }) {
  let agents: any[] = []
  try {
    agents = await prisma.aIAgent.findMany({
      orderBy: { createdAt: 'asc' }
    })
  } catch (e) {
    console.error("Failed to query agents for layout:", e)
  }

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-4rem)] bg-neutral-950 text-neutral-50 overflow-hidden w-full -m-4 md:-m-8">
      <AgentsSidebar agents={agents} />
      <div className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden">
        {children}
      </div>
    </div>
  )
}
