import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import ChatInterface from "./ChatInterface"
import { auth } from "@/auth"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AgentChatPage({ params }: { params: { id: string } }) {
  const session = await auth()
  if (!session || !session.user || !session.user.email) {
    notFound()
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: session.user.email }
  })
  if (!dbUser) notFound()

  const hasGoogleConnection = !!dbUser.googleRefreshToken;

  const agent = await prisma.aIAgent.findUnique({
    where: { id: params.id }
  })

  if (!agent || agent.userId !== dbUser.id) notFound()

  let fallbackLogoUrl = null
  const companyProfile = await prisma.companyProfile.findUnique({
    where: { userId: dbUser.id }
  })
  fallbackLogoUrl = companyProfile?.logoUrl || null

  const interactionLogs = await prisma.interactionLog.findMany({
    where: { 
      aiAgentId: agent.id,
      userId: dbUser.id
    },
    orderBy: { createdAt: 'asc' }
  })

  const initialMessages = interactionLogs.map(m => {
    let toolInvocations = undefined;
    if (m.toolInvocations) {
      try {
        let parsed = typeof m.toolInvocations === 'string' 
          ? JSON.parse(m.toolInvocations) 
          : m.toolInvocations;
        
        if (Array.isArray(parsed)) {
          parsed = parsed.map(inv => {
            if (inv.state === 'result' && !inv.result) {
              inv.result = {
                transparentUrl: "https://placehold.co/800x800/1e1e24/a3a3a3?text=Recuperado",
                copyText: "Diseño recuperado de una sesión anterior.",
                subtitle: "Recuperado",
                brandPrimaryColor: "#5c6ac4",
                industry: "General"
              };
            }
            return inv;
          });
        }
        toolInvocations = parsed;
      } catch (e) {
        console.error("Failed to parse toolInvocations", e);
      }
    }

    return {
      id: m.id,
      role: m.role,
      content: m.content,
      toolInvocations
    }
  })

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0,0,0,0)

  const logsForMonth = await prisma.interactionLog.findMany({
    where: {
      aiAgentId: agent.id,
      userId: dbUser.id,
      createdAt: {
        gte: startOfMonth
      }
    }
  })

  let generationCount = 0
  logsForMonth.forEach(log => {
    if (log.toolInvocations) {
      try {
        const parsed = typeof log.toolInvocations === 'string'
          ? JSON.parse(log.toolInvocations)
          : log.toolInvocations;
        if (Array.isArray(parsed)) {
          const hasGraphicDesign = parsed.some((inv: any) => inv.toolName === 'generateGraphicDesign');
          if (hasGraphicDesign) generationCount++;
        }
      } catch (e) {}
    }
  })

  return (
    <div className="h-full">
      <ChatInterface 
        agent={agent} 
        initialMessages={initialMessages} 
        fallbackLogoUrl={fallbackLogoUrl} 
        generationCount={generationCount} 
        hasGoogleConnection={hasGoogleConnection} 
        userRole={dbUser.role}
      />
    </div>
  )
}
