import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import VotacionesClient from "./VotacionesClient"

export const metadata = {
  title: "Votaciones de Mejoras",
}

export default async function VotacionesPage() {
  const session = await auth()
  if (!session?.user?.email) {
    redirect("/login")
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: session.user.email },
  })

  if (!dbUser || (dbUser.role !== 'ADMIN' && dbUser.role !== 'SUPER_ADMIN')) {
    redirect("/")
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight text-slate-800">Mejoras de Plataforma</h2>
      </div>
      <VotacionesClient />
    </div>
  )
}
