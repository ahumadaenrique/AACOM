import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { SettingsModal } from "@/components/SettingsModal"

export default async function SettingsPage({ params }: { params: { id: string } }) {
  const agent = await prisma.aIAgent.findUnique({
    where: { id: params.id },
    include: { User: true }
  })

  if (!agent) {
    notFound()
  }

  return (
    <div className="relative h-full w-full bg-neutral-950/50 flex items-center justify-center">
      <div className="absolute inset-0 bg-neutral-950">
        {/* Fake background to simulate the chat underneath being blurred */}
        <div className="w-full h-full opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at center, #333 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
      </div>
      
      <SettingsModal agent={agent} />
    </div>
  )
}
