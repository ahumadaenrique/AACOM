import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import AgentLibraryClient from './AgentLibraryClient'

export const dynamic = 'force-dynamic'

export default async function LibraryPage() {
  const session = await auth();
  if (!session?.user?.email) return null;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { agency: true }
  });

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-8 pb-32">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">Mi Biblioteca</h1>
        <p className="text-slate-500 text-sm">
          Consulta y descarga documentos, manuales y políticas de {user?.agency?.name || 'tu agencia'}.
        </p>
      </div>

      <AgentLibraryClient agencyName={user?.agency?.name || 'la Agencia'} />
    </div>
  )
}
