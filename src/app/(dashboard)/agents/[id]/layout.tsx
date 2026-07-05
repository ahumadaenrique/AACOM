import { ReactNode } from "react"
import Link from "next/link"
import prisma from "@/lib/prisma"
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
    <div className="flex h-full bg-neutral-950 text-neutral-50 overflow-hidden w-full">
      {/* Sidebar - Agents List */}
      <aside className="hidden lg:flex flex-col w-72 bg-neutral-900 border-r border-neutral-800 shrink-0">
        <div className="p-4 border-b border-neutral-800 flex items-center gap-2">
          <Link href="/" className="p-2 hover:bg-neutral-800 rounded-md transition-colors text-neutral-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2 font-bold text-lg tracking-tight">
            <div className="w-6 h-6 bg-emerald-500 rounded flex items-center justify-center text-xs text-white">AA</div>
            AACOM
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <div className="px-3 space-y-1">
            {allAgents.map((agent) => {
              const isActive = agent.id === currentAgent.id
              return (
                <Link
                  key={agent.id}
                  href={`/agents/${agent.id}/chat`}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${
                    isActive 
                      ? 'bg-neutral-800 text-white shadow-sm' 
                      : 'text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200'
                  }`}
                >
                  <AgentAvatar type={agent.type} name={agent.name} className="w-10 h-10" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{agent.name}</div>
                    <div className="text-xs text-neutral-500 truncate capitalize">
                      {getRoleDisplayName(agent.type)}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-neutral-950">
        <header className="h-16 border-b border-neutral-800 flex items-center justify-between px-4 md:px-6 bg-neutral-900/50 backdrop-blur">
          <div className="flex items-center gap-3">
            <Link href="/" className="lg:hidden p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </Link>
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
      </main>
    </div>
  )
}
