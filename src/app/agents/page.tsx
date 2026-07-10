import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Bot, Mic, Share2, Calendar, Settings, MessageSquare } from "lucide-react"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import Radar from "@/components/ui/Radar"
import { AgentAvatar } from "@/components/AgentAvatar"
import { SyncDbButton } from "@/components/SyncDbButton"
import { auth } from "@/auth"

const AgentIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'EXECUTIVE_ASSISTANT': return <Calendar className="w-6 h-6 text-blue-400" />;
    case 'SOCIAL_MEDIA_MANAGER': return <Share2 className="w-6 h-6 text-pink-400" />;
    case 'RECEPTIONIST': return <Mic className="w-6 h-6 text-emerald-400" />;
    default: return <Bot className="w-6 h-6 text-gray-400" />;
  }
}

const AgentTypeLabel = ({ type }: { type: string }) => {
  switch (type) {
    case 'EXECUTIVE_ASSISTANT': return "Asistente Ejecutiva";
    case 'SOCIAL_MEDIA_MANAGER': return "Social Media Manager";
    case 'RECEPTIONIST': return "Recepcionista";
    default: return "Agente Genérico";
  }
}

export const dynamic = 'force-dynamic'

export default async function Dashboard() {
  const session = await auth()
  let agencyName = "AACOM"
  let dbUser = null
  try {
    if (session?.user?.email) {
      dbUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { agency: true }
      })
      if (dbUser?.agency?.name) {
        agencyName = dbUser.agency.name
      }
    }
  } catch (e) {
    console.error("Failed to query agency name for agents dashboard:", e)
  }


  let agents: any[] = []
  let schemaError = false
  try {
    if (dbUser) {
      agents = await prisma.aIAgent.findMany({
        where: {
          userId: dbUser.id,
          type: { not: 'RECEPTIONIST' }
        },
        orderBy: { createdAt: 'desc' }
      })
    }
  } catch (e) {
    console.error("Failed to query agents:", e)
    schemaError = true
  }

  if (schemaError) {
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

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0,0,0,0)

  let agentsWithLogs = []
  try {
    if (dbUser) {
      // 1. Fetch all ADMIN and SUPER_ADMIN users in this agency
      let adminUserIds = [dbUser.id]
      if (dbUser.agencyId) {
        const agencyAdmins = await prisma.user.findMany({
          where: {
            agencyId: dbUser.agencyId,
            role: { in: ['ADMIN', 'SUPER_ADMIN'] }
          },
          select: { id: true }
        })
        adminUserIds = agencyAdmins.map(u => u.id)
      }

      // 2. Query all logs for these admins in the current month
      const logs = await prisma.interactionLog.findMany({
        where: {
          userId: { in: adminUserIds },
          createdAt: {
            gte: startOfMonth
          }
        }
      })

      let totalAdminGenerations = 0
      logs.forEach(log => {
        if (log.toolInvocations) {
          try {
            const parsed = typeof log.toolInvocations === 'string'
              ? JSON.parse(log.toolInvocations)
              : log.toolInvocations;
            if (Array.isArray(parsed)) {
              const hasGraphicDesign = parsed.some((inv: any) => inv.toolName === 'generateGraphicDesign');
              if (hasGraphicDesign) totalAdminGenerations++;
            }
          } catch (e) {}
        }
      })

      agentsWithLogs = agents.map(agent => ({
        ...agent,
        generationCount: totalAdminGenerations
      }))
    } else {
      agentsWithLogs = agents.map(agent => ({ ...agent, generationCount: 0 }))
    }
  } catch (e) {
    console.error("Failed to map agents with logs:", e)
    agentsWithLogs = agents.map(agent => ({ ...agent, generationCount: 0 }))
  }

  const hasExecutive = agents.some(a => a.type === 'EXECUTIVE_ASSISTANT')
  const hasMkt = agents.some(a => a.type === 'SOCIAL_MEDIA_MANAGER')
  const isCreateDisabled = hasExecutive && hasMkt

  return (
    <div className="h-full overflow-auto relative text-neutral-5 selection:bg-indigo-500/30">
      {/* Background gradients for glassmorphism effect */}
      <div className="absolute inset-0 z-0 bg-neutral-950 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/20 via-neutral-950 to-neutral-950 pointer-events-none"></div>
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-emerald-900/10 via-neutral-950/0 to-neutral-950/0 pointer-events-none"></div>

      {/* Dynamic WebGL Radar Background */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none mix-blend-screen">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="radar-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="50%" cy="50%" r="40%" fill="url(#radar-glow)" />
          <circle cx="50%" cy="50%" r="30%" stroke="#312e81" strokeWidth="1" strokeDasharray="4 8" fill="none" />
          <circle cx="50%" cy="50%" r="20%" stroke="#1e1b4b" strokeWidth="1" fill="none" />
          <line x1="50%" y1="0%" x2="50%" y2="100%" stroke="#1e1b4b" strokeWidth="0.5" strokeDasharray="2 4" />
          <line x1="0%" y1="50%" x2="100%" y2="50%" stroke="#1e1b4b" strokeWidth="0.5" strokeDasharray="2 4" />
        </svg>
      </div>

      <main className="relative z-10 container mx-auto p-8 max-w-7xl">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-neutral-100 to-neutral-500">
              Módulo de Agentes
            </h1>
            <p className="text-neutral-400 mt-2">Gestiona tu equipo de inteligencia artificial {agencyName}.</p>
          </div>
          {isCreateDisabled ? (
            <Button disabled className="bg-neutral-800 text-neutral-500 rounded-full px-6 cursor-not-allowed border border-white/5">
              <Plus className="mr-2 h-4 w-4" />
              Crear Agente (Límite alcanzado)
            </Button>
          ) : (
            <Link href="/agents/new">
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 transition-all duration-300 hover:shadow-[0_0_20px_rgba(79,70,229,0.4)]">
                <Plus className="mr-2 h-4 w-4" />
                Crear Agente
              </Button>
            </Link>
          )}
        </header>

        {agents.length === 0 ? (
          <div className="text-center py-24 rounded-3xl border border-white/5 bg-white/5 backdrop-blur-xl">
            <Bot className="mx-auto h-16 w-16 text-neutral-500 mb-4 opacity-50" />
            <h2 className="text-2xl font-semibold mb-2">No tienes agentes activos</h2>
            <p className="text-neutral-400 mb-6 max-w-md mx-auto">
              Configura tu primer asistente ejecutiva, recepcionista o social media manager para comenzar a automatizar tus tareas.
            </p>
            <Link href="/agents/new">
              <Button variant="outline" className="border-white/10 hover:bg-white/10 text-black dark:text-white">
                Comenzar ahora
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agentsWithLogs.map((agent) => (
              <Card key={agent.id} className="bg-white/5 border-white/10 backdrop-blur-md hover:bg-white/10 transition-all duration-300 group">
                <CardHeader className="flex flex-row items-center gap-4 pb-2">
                  <AgentAvatar type={agent.type} name={agent.name} className="w-14 h-14 group-hover:scale-110 transition-transform duration-300 shrink-0" />
                  <div>
                    <CardTitle className="text-xl text-neutral-100">{agent.name}</CardTitle>
                    <CardDescription className="text-neutral-400">
                      <AgentTypeLabel type={(agent as any).type} />
                    </CardDescription>
                  </div>
                </CardHeader>
                  <div className="flex flex-col gap-2 mt-4 px-6 pb-4">
                    <div className="flex items-center gap-2">
                      <Badge variant={agent.isActive ? "default" : "secondary"} className={agent.isActive ? "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30" : ""}>
                        {agent.isActive ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                    {agent.type === 'SOCIAL_MEDIA_MANAGER' && (
                      <div className="mt-2 text-xs text-neutral-400">
                        Uso mensual: <span className="text-white font-medium">{agent.generationCount}/90 generaciones</span>
                      </div>
                    )}
                  </div>
                <CardFooter className="flex justify-between pt-4 border-t border-white/5">
                  <Link href={`/agents/${agent.id}/chat`}>
                    <Button variant="ghost" size="sm" className="text-neutral-300 hover:text-white hover:bg-white/10">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Interactuar
                    </Button>
                  </Link>
                  <Link href={`/agents/${agent.id}/settings`}>
                    <Button variant="ghost" size="sm" className="text-neutral-400 hover:text-white hover:bg-white/10">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
