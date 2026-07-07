import { ReactNode } from "react"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { Settings, MessageSquare, Calendar, ChevronLeft, ArrowLeft, FileText, Phone, CheckSquare } from "lucide-react"
import { AgentAvatar } from "@/components/AgentAvatar"
import { SyncDbButton } from "@/components/SyncDbButton"

export default async function AgentWorkspaceLayout({
  children,
  params,
}: {
  children: ReactNode
  params: { id: string }
}) {
  let currentAgent = null
  let logsForMonth: any[] = []
  let allAgents: any[] = []
  let schemaError = false

  try {
    currentAgent = await prisma.aIAgent.findUnique({
      where: { id: params.id }
    })
  } catch (e) {
    console.error("Layout error: AIAgent query failed", e)
    schemaError = true
  }

  if (currentAgent) {
    try {
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0,0,0,0)

      logsForMonth = await prisma.interactionLog.findMany({
        where: {
          aiAgentId: currentAgent.id,
          createdAt: {
            gte: startOfMonth
          }
        }
      })
    } catch (e) {
      console.error("Layout error: InteractionLog query failed", e)
    }
  }

  try {
    allAgents = await prisma.aIAgent.findMany({
      orderBy: { createdAt: 'asc' }
    })
  } catch (e) {
    console.error("Layout error: allAgents query failed", e)
    schemaError = true
  }

  if (schemaError || !currentAgent) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-6 text-neutral-200">
        <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-3xl p-8 text-center flex flex-col items-center gap-6 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Settings className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white mb-2">Base de datos desincronizada</h2>
            <p className="text-sm text-neutral-400 leading-relaxed mb-1">
              La base de datos compartida en Neon ha sido modificada por cambios o despliegues de otra rama y no contiene la estructura requerida para los agentes.
            </p>
          </div>
          <SyncDbButton />
        </div>
      </div>
    )
  }

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

  const getRoleDisplayName = (type: string) => {
    switch (type) {
      case 'EXECUTIVE_ASSISTANT':
        return 'Asistente Ejecutiva';
      case 'SOCIAL_MEDIA_MANAGER':
        return 'Social Media Manager';
      case 'RECEPTIONIST':
        return 'Recepcionista (Voz)';
      default:
        return type.replace(/_/g, ' ').toLowerCase();
    }
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full bg-neutral-950">
      <header className="h-16 border-b border-neutral-800 flex items-center justify-between px-4 md:px-6 bg-[#0E0E0E]/90 backdrop-blur shrink-0">
        <div className="flex items-center gap-3">
          <AgentAvatar type={currentAgent.type} name={currentAgent.name} className="w-8 h-8" />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-sm">{currentAgent.name}</h2>
              {currentAgent.type === 'SOCIAL_MEDIA_MANAGER' && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 border border-neutral-700 font-medium">
                  {generationCount}/90 publicaciones
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-500 capitalize">{getRoleDisplayName(currentAgent.type)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {currentAgent.type !== 'SOCIAL_MEDIA_MANAGER' && (
            <div className="flex bg-neutral-900 p-1 rounded-lg border border-neutral-800">
              <Link 
                href={`/agents/${currentAgent.id}/chat`}
                className="flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                Chat
              </Link>

              {currentAgent.type === 'RECEPTIONIST' && (
                <Link 
                  href={`/agents/${currentAgent.id}/calls`}
                  className="flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  Llamadas
                </Link>
              )}

              {currentAgent.type === 'EXECUTIVE_ASSISTANT' ? (
                <Link 
                  href={`/agents/${currentAgent.id}/tasks`}
                  className="flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                >
                  <CheckSquare className="w-4 h-4" />
                  Tareas
                </Link>
              ) : (
                currentAgent.type !== 'RECEPTIONIST' && (
                  <Link 
                    href={`/agents/${currentAgent.id}/guidelines`}
                    className="flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    Directrices
                  </Link>
                )
              )}
            </div>
          )}
          {currentAgent.type !== 'SOCIAL_MEDIA_MANAGER' && <div className="w-px h-6 bg-neutral-800 mx-2"></div>}
          <Link href={`/agents/${currentAgent.id}/settings`}>
            <button className="w-9 h-9 flex items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors">
              <Settings className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </header>
      
      <div className="flex-1 overflow-y-auto relative">
        {children}
      </div>
    </div>
  )
}
