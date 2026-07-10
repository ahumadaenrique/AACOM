import { ReactNode } from "react"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { AgentsSidebar } from "@/components/AgentsSidebar"
import { auth, signOut } from "@/auth"
import { Building2, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SubscriptionBlocker } from "@/components/SubscriptionBlocker"

export const dynamic = 'force-dynamic'

async function ensureDefaultAgents(userId: string) {
  try {
    // 1. Clean up duplicate agents of the same type for this user first
    const userAgents = await prisma.aIAgent.findMany({
      where: { userId, type: { not: 'RECEPTIONIST' } },
      orderBy: { createdAt: 'asc' }
    });

    const seenTypes = new Set<string>();
    for (const agent of userAgents) {
      if (seenTypes.has(agent.type)) {
        await prisma.aIAgent.delete({ where: { id: agent.id } });
      } else {
        seenTypes.add(agent.type);
      }
    }

    // 2. Ensure default generic agents exist
    const existingExecutive = await prisma.aIAgent.findFirst({
      where: { userId, type: "EXECUTIVE_ASSISTANT" }
    })
    if (!existingExecutive) {
      await prisma.aIAgent.create({
        data: {
          name: "Asistente Ejecutiva",
          type: "EXECUTIVE_ASSISTANT",
          userId,
          isActive: true,
          systemPrompt: "Eres un Asistente Ejecutivo altamente proactivo y profesional. Tu objetivo es ayudar a organizar la agenda, crear minutas de reuniones y enviar recordatorios."
        }
      })
    } else if (existingExecutive.name === "María la Asistente") {
      // Automatically genericize if it still has the old default name
      await prisma.aIAgent.update({
        where: { id: existingExecutive.id },
        data: { name: "Asistente Ejecutiva" }
      })
    }

    const existingMkt = await prisma.aIAgent.findFirst({
      where: { userId, type: "SOCIAL_MEDIA_MANAGER" }
    })
    if (!existingMkt) {
      await prisma.aIAgent.create({
        data: {
          name: "Social Media Manager",
          type: "SOCIAL_MEDIA_MANAGER",
          userId,
          isActive: true,
          systemPrompt: "Eres un creativo social media manager encargado de diseñar posts, mockups e imágenes publicitarias para redes sociales de tu agencia."
        }
      })
    } else if (existingMkt.name === "Ramiro el de MKT") {
      // Automatically genericize if it still has the old default name
      await prisma.aIAgent.update({
        where: { id: existingMkt.id },
        data: { name: "Social Media Manager" }
      })
    }
  } catch (e) {
    console.error("ensureDefaultAgents error:", e)
  }
}

export default async function AgentsLayout({ children }: { children: ReactNode }) {
  const session = await auth()
  
  if (!session?.user?.email) {
      const { redirect } = await import("next/navigation");
      redirect("/login");
  }

  const dbUser = await prisma.user.findUnique({
      where: { email: session!.user!.email as string },
      include: { agency: true }
  })

  // SECURITY BLOCK
  const headersList = headers();
  const slug = headersList.get('x-agency-slug') || 'aacom';
  let agency = dbUser?.agency || await prisma.agency.findUnique({ where: { slug } });
  
  const isOrphan = dbUser && !dbUser?.agencyId && dbUser?.role !== 'SUPER_ADMIN' && dbUser?.role !== 'SELLER' && dbUser?.email !== 'enrique.ahumada@aacommx.com';
  const isAgencyInactive = dbUser?.agencyId && (!agency || agency.active === false);
  const isDeletedUser = session?.user?.email && !dbUser;

  if (isDeletedUser || (dbUser && (dbUser.active === false || isOrphan || isAgencyInactive))) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
              <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full border border-red-100">
                  <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Building2 className="w-10 h-10" />
                  </div>
                  <h1 className="text-2xl font-extrabold text-slate-800 mb-2">Agencia No Disponible</h1>
                  <p className="text-slate-600 mb-8 leading-relaxed">
                      La agencia a la que pertenece esta cuenta ha sido desactivada o eliminada permanentemente del sistema. Por seguridad, tu acceso ha sido revocado.
                  </p>
                  <form action={async () => {
                      "use server";
                      const { cookies } = await import("next/headers");
                      cookies().delete('demoMode');
                      const { signOut } = await import("@/auth");
                      await signOut();
                  }}>
                      <Button type="submit" className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-bold text-lg rounded-xl shadow-md transition-all">
                          <LogOut className="w-5 h-5 mr-2" />
                          Cerrar Sesión Segura
                      </Button>
                  </form>
              </div>
          </div>
      );
  }

  let agencyName = agency?.name || "AACOM"
  let agents: any[] = []
  
  try {
    if (dbUser) {
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
  } catch (e) {
    console.error("Failed to query agents for layout:", e)
  }

  const isSuperAdmin = dbUser?.role === 'SUPER_ADMIN';
  const endDate = agency?.subscriptionEndDate ? new Date(agency.subscriptionEndDate) : null;
  const now = new Date();
  const isSubscriptionActive = (agency?.subscriptionStatus === "active" || agency?.subscriptionStatus === "trialing") && (!endDate || endDate >= now);

  return (
    <div className="flex flex-col md:flex-row h-screen bg-neutral-950 text-neutral-50 w-full overflow-hidden">
      <SubscriptionBlocker isActive={isSubscriptionActive} isSuperAdmin={isSuperAdmin}>
        <div className="flex flex-col md:flex-row h-screen bg-neutral-950 text-neutral-50 overflow-hidden w-full">
            <AgentsSidebar agents={agents} agencyName={agencyName} />
            <div className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden">
                {children}
            </div>
        </div>
      </SubscriptionBlocker>
    </div>
  )
}
