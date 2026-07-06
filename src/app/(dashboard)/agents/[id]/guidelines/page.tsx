import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"

export default async function GuidelinesPage({ params }: { params: { id: string } }) {
  const agent = await prisma.aIAgent.findUnique({
    where: { id: params.id }
  })

  if (!agent) notFound()

  const isExecutive = agent.type === 'EXECUTIVE_ASSISTANT'

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Directrices</h1>
        <p className="text-neutral-500">Usa este espacio para dar a {agent.name} instrucciones personalizadas.</p>
      </div>

      <div className="space-y-6">
        {isExecutive ? (
          <>
            <div className="bg-[#1A1A1A] border border-neutral-800 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-neutral-800 bg-[#1E1E1E]">
                <h3 className="font-semibold text-white">¿Reglas específicas para categorizar mejor tus correos?</h3>
              </div>
              <div className="p-6">
                <div className="flex gap-4 opacity-50">
                  <div className="w-6 h-6 rounded bg-neutral-800 text-neutral-400 flex items-center justify-center text-xs font-bold shrink-0 mt-1">1</div>
                  <input type="text" placeholder="Empieza a escribir..." className="bg-transparent border-none text-sm text-neutral-300 focus:outline-none w-full" />
                </div>
              </div>
            </div>

            <div className="bg-[#1A1A1A] border border-neutral-800 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-neutral-800 bg-[#1E1E1E]">
                <h3 className="font-semibold text-white">¿Cómo debo escribir los correos?</h3>
              </div>
              <div className="p-6">
                <div className="flex gap-4">
                  <div className="w-6 h-6 rounded bg-yellow-500/20 text-yellow-500 flex items-center justify-center text-xs font-bold shrink-0 mt-1">1</div>
                  <p className="text-sm text-neutral-300 leading-relaxed whitespace-pre-line">
                    **Tone:**
                    The tone is predominantly professional, efficient, and data-driven. It shifts between a formal, neutral tone used for automated reporting and a direct, assertive, and business-focused tone in manual correspondence. In interpersonal emails, the tone is confident and authoritative regarding performance metrics, yet remains collaborative and polite.

                    **Style:**
                    * **Functional & Systematic:** The writing is highly structured, especially when conveying performance data or reports.
                    * **Minimalist:** Avoids unnecessary pleasantries or "fluff." The focus is strictly on the objective of the communication.
                  </p>
                </div>
                <div className="flex gap-4 mt-6 opacity-50">
                  <div className="w-6 h-6 rounded bg-neutral-800 text-neutral-400 flex items-center justify-center text-xs font-bold shrink-0 mt-1">2</div>
                  <input type="text" placeholder="Empieza a escribir..." className="bg-transparent border-none text-sm text-neutral-300 focus:outline-none w-full" />
                </div>
              </div>
            </div>

            <div className="bg-[#1A1A1A] border border-neutral-800 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-neutral-800 bg-[#1E1E1E]">
                <h3 className="font-semibold text-white">¿A qué correos debo redactar una respuesta y a cuáles no?</h3>
              </div>
              <div className="p-6">
                <div className="flex gap-4">
                  <div className="w-6 h-6 rounded bg-yellow-500/20 text-yellow-500 flex items-center justify-center text-xs font-bold shrink-0 mt-1">1</div>
                  <p className="text-sm text-neutral-300 leading-relaxed">
                    Don't reply to cold emails from people trying to sell me something if we've never exchanged emails before.
                  </p>
                </div>
                <div className="flex gap-4 mt-6 opacity-50">
                  <div className="w-6 h-6 rounded bg-neutral-800 text-neutral-400 flex items-center justify-center text-xs font-bold shrink-0 mt-1">2</div>
                  <input type="text" placeholder="Empieza a escribir..." className="bg-transparent border-none text-sm text-neutral-300 focus:outline-none w-full" />
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="bg-[#1A1A1A] border border-neutral-800 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-neutral-800 bg-[#1E1E1E]">
                <h3 className="font-semibold text-white">Temas de contenido</h3>
              </div>
              <div className="p-6">
                <div className="flex gap-4">
                  <div className="w-6 h-6 rounded bg-yellow-500/20 text-yellow-500 flex items-center justify-center text-xs font-bold shrink-0 mt-1">1</div>
                  <p className="text-sm text-neutral-300 leading-relaxed">
                    **Frecuencia de publicación:** NO publicar más de 3 posts diarios bajo ninguna circunstancia.<br/><br/>
                    **Cultura organizacional y equipo:** Celebraciones internas, agradecimiento, trabajo en equipo y el reconocimiento a los logros de los colaboradores (ej. viajes e incentivos).<br/><br/>
                    **Educación financiera:** Consejos prácticos sobre el ahorro inteligente frente al consumo impulsivo y la importancia de tomar decisiones informadas.
                  </p>
                </div>
                <div className="flex gap-4 mt-6 opacity-50">
                  <div className="w-6 h-6 rounded bg-neutral-800 text-neutral-400 flex items-center justify-center text-xs font-bold shrink-0 mt-1">2</div>
                  <input type="text" placeholder="Empieza a escribir..." className="bg-transparent border-none text-sm text-neutral-300 focus:outline-none w-full" />
                </div>
              </div>
            </div>

            <div className="bg-[#1A1A1A] border border-neutral-800 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-neutral-800 bg-[#1E1E1E]">
                <h3 className="font-semibold text-white">Estilo de imagen</h3>
              </div>
              <div className="p-6">
                <div className="flex gap-4">
                  <div className="w-6 h-6 rounded bg-yellow-500/20 text-yellow-500 flex items-center justify-center text-xs font-bold shrink-0 mt-1">1</div>
                  <p className="text-sm text-neutral-300 leading-relaxed">
                    Directrices para diseñar posts en redes sociales con la misma estética y vibra:<br/><br/>
                    Colores principales:<br/>
                    - Verde pastel/menta como fondo dominante: #97C1B0<br/>
                    - Blanco puro para fondos limpios y texto: #FFFFFF<br/>
                    - Negro para textos principales: #000000
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
