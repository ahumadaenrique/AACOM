import prisma from "@/lib/prisma"
import { notFound } from "next/navigation"
import { Phone, Filter, PlayCircle } from "lucide-react"

export default async function CallsPage({ params }: { params: { id: string } }) {
  const agent = await prisma.aIAgent.findUnique({
    where: { id: params.id }
  })

  if (!agent) notFound()

  const calls = [
    {
      id: 1,
      phone: "+525515015502",
      isTest: true,
      duration: "1m 46s",
      sentiment: "Positive",
      sentimentColor: "text-emerald-500",
      date: "08 jun 2026",
      summary: "Ramón Valdez called wanting to join our sales team and talked about his sales experience. I tried to transfer him to the CFO, but it didn't go through, so I said I'd let the CEO know to call him back.",
      avatarColor: "bg-blue-500"
    },
    {
      id: 2,
      phone: "+525515015502",
      isTest: true,
      duration: "1m 56s",
      sentiment: "Positive",
      sentimentColor: "text-emerald-500",
      date: "04 jun 2026",
      summary: "Daniela called asking about getting a new life insurance policy. I took down her name, phone number, and email, and told her I'd pass her info to the right team for follow-up. She didn't have any other questions.",
      avatarColor: "bg-emerald-500"
    },
    {
      id: 3,
      phone: "+525568085562",
      isTest: false,
      duration: "3m 07s",
      sentiment: "Positive",
      sentimentColor: "text-emerald-500",
      date: "27 may 2026",
      summary: "Roberto called asking about when Enrique Ahumada is available for a meeting. I checked Enrique's schedule, shared the open slots, but Roberto said he just wanted the info—not to actually book anything. He thanked me and hung up.",
      avatarColor: "bg-purple-500"
    },
    {
      id: 4,
      phone: "+525515015502",
      isTest: true,
      duration: "0m 32s",
      sentiment: "Neutral",
      sentimentColor: "text-yellow-500",
      date: "20 may 2026",
      summary: "I took a call from someone who saw our ad and wanted more info. I asked if they were new to insurance or already experienced; they said they had experience. The call ended before we could talk further.",
      avatarColor: "bg-blue-500"
    }
  ]

  return (
    <div className="flex flex-col h-full bg-[#111111] p-8">
      <div className="max-w-5xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-medium text-white mb-1">Número de {agent.name} <span className="text-neutral-400 font-normal">+525588972069</span></h2>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center justify-between mb-8">
          <div className="relative w-96">
            <input 
              type="text" 
              placeholder="Buscar por teléfono" 
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-neutral-700 transition-colors"
            />
            <svg className="w-4 h-4 absolute left-3 top-2.5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          <div className="flex items-center gap-3 text-sm relative group">
            <button className="flex items-center gap-2 px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-300 hover:text-white transition-colors">
              <Filter className="w-4 h-4" />
              Filtros
            </button>
            {/* Filter Popover Mockup (hidden by default, shown on group hover for demo) */}
            <div className="absolute right-[90px] top-full mt-2 w-72 bg-[#1A1A1A] border border-neutral-800 rounded-xl shadow-2xl p-4 hidden group-hover:block z-50">
              <h3 className="text-sm font-medium text-white mb-4">Filtrar llamadas</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-neutral-400 block mb-1">Rango de fechas</label>
                  <select className="w-full bg-[#111] border border-neutral-800 rounded-md p-2 text-sm text-white focus:outline-none focus:border-neutral-700">
                    <option>Todo el tiempo</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-neutral-400 block mb-1">Sentimiento</label>
                  <select className="w-full bg-[#111] border border-neutral-800 rounded-md p-2 text-sm text-neutral-500 focus:outline-none focus:border-neutral-700">
                    <option>Selecciona sentimientos</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-neutral-400 block mb-1">Duración de la llamada</label>
                  <select className="w-full bg-[#111] border border-neutral-800 rounded-md p-2 text-sm text-neutral-500 focus:outline-none focus:border-neutral-700">
                    <option>Selecciona duraciones</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-neutral-400 block mb-2">Tipo de llamada</label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm text-neutral-300 cursor-pointer">
                      <input type="checkbox" className="rounded border-neutral-700 bg-[#111] text-yellow-400 focus:ring-yellow-400/20" />
                      Normal
                    </label>
                    <label className="flex items-center gap-2 text-sm text-neutral-300 cursor-pointer">
                      <input type="checkbox" className="rounded border-neutral-700 bg-[#111] text-yellow-400 focus:ring-yellow-400/20" />
                      De prueba
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <span className="text-neutral-500">10 llamadas</span>
          </div>
        </div>

        {/* Calls List */}
        <div className="space-y-4">
          {calls.map((call) => (
            <div key={call.id} className="group relative pl-8 pb-4">
              {/* Timeline dot and line */}
              <div className="absolute left-0 top-6 w-2 h-2 rounded-full bg-neutral-700"></div>
              <div className="absolute left-[3px] top-10 bottom-0 w-px bg-neutral-800 group-last:hidden"></div>

              {/* Date */}
              <div className="text-[11px] text-neutral-600 mb-2 uppercase tracking-wider font-semibold">{call.date}</div>

              {/* Call Card */}
              <div className="bg-[#1A1A1A] border border-neutral-800 rounded-xl p-5 flex flex-col hover:border-neutral-700 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="w-1/3">
                    <div className="flex items-center gap-2 mb-2">
                      <Phone className="w-4 h-4 text-neutral-400" />
                      <span className="font-semibold text-white">{call.phone}</span>
                      {call.isTest && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold text-yellow-500 border border-yellow-500/30 bg-yellow-500/10">Test Call</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-neutral-400">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {call.duration}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${call.sentiment === 'Positive' ? 'bg-emerald-500' : 'bg-yellow-500'}`}></div>
                        {call.sentiment}
                      </span>
                    </div>
                  </div>

                  <div className="w-2/3 pl-6 border-l border-neutral-800/50">
                    <div className="flex items-start gap-3">
                      <div className={`w-6 h-6 rounded-full ${call.avatarColor} shrink-0 mt-0.5 flex items-center justify-center`}>
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                      </div>
                      <p className="text-sm text-neutral-300 italic leading-relaxed">"{call.summary}"</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end mt-4 pt-4 border-t border-neutral-800/50">
                  <button className="text-neutral-500 hover:text-white transition-colors">
                    <PlayCircle className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
