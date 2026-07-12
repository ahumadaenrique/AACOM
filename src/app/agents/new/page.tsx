import { prisma } from "@/lib/prisma"
import { AgentForm } from "@/components/AgentForm"
import { SyncDbButton } from "@/components/SyncDbButton"
import { Settings } from "lucide-react"

import { auth } from "@/auth"
import { redirect } from "next/navigation"

export const dynamic = 'force-dynamic'

export default async function NewAgentPage() {
  const session = await auth()
  if (!session?.user?.email) {
    redirect("/login")
  }

  let dbUser = null
  try {
    dbUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    })
  } catch (e) {
    console.error("Failed to query user:", e)
  }

  if (!dbUser) {
    redirect("/login")
  }

  let deployedAgents: any[] = []
  let schemaError = false

  try {
    deployedAgents = await prisma.aIAgent.findMany({
      where: { userId: dbUser.id },
      select: { type: true }
    })
  } catch (e) {
    console.error("Failed to fetch deployed agents:", e)
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

  const deployedTypes = deployedAgents.map((a) => a.type)

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 selection:bg-indigo-500/30">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-neutral-950 to-neutral-950"></div>
      
      <main className="container mx-auto p-8 max-w-3xl">
        <header className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight">Nuevo Agente</h1>
          <p className="text-neutral-400 mt-2">Configura la personalidad y el rol de tu nueva IA.</p>
        </header>

        <div className="bg-white/5 border border-white/10 backdrop-blur-xl p-8 rounded-3xl">
          <AgentForm deployedTypes={deployedTypes} />
        </div>
      </main>
    </div>
  )
}
