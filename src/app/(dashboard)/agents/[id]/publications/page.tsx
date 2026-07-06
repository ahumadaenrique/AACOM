import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { Calendar as CalendarIcon, Clock, MoreHorizontal } from "lucide-react"

export default async function PublicationsPage({ params }: { params: { id: string } }) {
  const agent = await prisma.aIAgent.findUnique({
    where: { id: params.id },
    include: { DraftPost: true }
  })

  if (!agent) notFound()

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0,0,0,0)

  const logsForMonth = await prisma.interactionLog.findMany({
    where: {
      aiAgentId: agent.id,
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

  // Group posts by day (mock logic since we don't have real dates yet)
  const days = ["lun. 15", "mar. 16", "mié. 17", "jue. 18", "vie. 19", "sáb. 20"]

  return (
    <div className="flex flex-col h-full bg-neutral-950 p-6 overflow-x-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4 text-neutral-400">
          <button className="hover:text-white transition-colors">&lt;</button>
          <span className="font-medium text-white">jun 15 - jun 21</span>
          <button className="hover:text-white transition-colors">&gt;</button>
        </div>
        <div className="text-sm font-medium text-neutral-400 flex items-center gap-2 bg-neutral-900 border border-neutral-800 px-4 py-1.5 rounded-full shadow-sm">
          <span>Generaciones Mensuales:</span>
          <span className="text-indigo-400 font-bold">{generationCount} / 90</span>
        </div>
      </div>

      <div className="flex gap-4 min-w-max pb-8">
        {/* Unscheduled / Drafts Column */}
        <div className="w-64 shrink-0 flex flex-col gap-3">
          {/* Mock Post Card */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col gap-3">
            <p className="text-sm text-neutral-300 line-clamp-3">
              ¿Sabías que en México solo el 7% de la población cuenta con un seguro?...
            </p>
            <div className="aspect-square bg-emerald-100 rounded-lg overflow-hidden flex items-center justify-center relative">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-100 to-emerald-200"></div>
              <span className="relative z-10 font-bold text-emerald-900 text-center leading-tight">EL MERCADO<br/>DEL 7%<br/>¡TU MINA DE ORO!</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-5 h-5 rounded-full bg-[#1877F2] flex items-center justify-center text-white text-[10px] font-bold">f</div>
            </div>
          </div>
          
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col gap-3 opacity-50">
            <p className="text-sm text-neutral-300 line-clamp-3">
              ¿Cuántas veces has escuchado que "los seguros no pagan"?...
            </p>
            <div className="aspect-square bg-neutral-800 rounded-lg flex items-center justify-center text-xs text-neutral-500">
              No Image
            </div>
          </div>
        </div>

        {/* Days Columns */}
        {days.map((day, i) => (
          <div key={day} className="w-64 shrink-0 flex flex-col gap-3">
            <div className={`text-sm font-medium text-center pb-2 border-b-2 ${i === 0 ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-neutral-500'}`}>
              {day}
            </div>
            
            {/* Mock Scheduled Post */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col gap-3 hover:border-neutral-700 transition-colors cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded-full bg-[#1877F2] flex items-center justify-center text-white text-[8px] font-bold">f</div>
                  <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 flex items-center justify-center text-white text-[8px] font-bold">ig</div>
                </div>
                <div className="flex items-center gap-1 text-xs text-neutral-400">
                  <Clock className="w-3 h-3" />
                  9:00 AM
                </div>
              </div>
              <p className="text-sm text-neutral-300 line-clamp-2">
                Contenido del post de ejemplo para el {day}...
              </p>
              <div className="aspect-square bg-neutral-800 rounded-lg overflow-hidden flex items-center justify-center relative">
                <span className="text-neutral-500 text-xs">Preview</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
