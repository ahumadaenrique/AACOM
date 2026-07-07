import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { GraduationCap, Award, BookOpen, ArrowRight, ShieldAlert, Sparkles, CheckCircle2 } from "lucide-react"

export default async function AcademiaPage() {
  const session = await auth()
  
  let dbUser = null
  if (session?.user?.email) {
    dbUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { agency: true }
    })
  }

  const isTrial = dbUser?.agency?.subscriptionStatus === "trialing"
  const isPromoter = session?.user?.email?.toLowerCase().includes("promotor") || dbUser?.role === 'ADMIN' || dbUser?.role === 'SUPER_ADMIN'

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 px-4 md:px-6">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
        <h1 className="text-3xl font-black tracking-tight text-indigo-900 dark:text-indigo-400 flex items-center gap-2">
          <GraduationCap className="h-8 w-8 text-indigo-600 animate-pulse" /> Academia
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Centro de capacitación y formación profesional para agentes y promotores de seguros.
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        
        {/* Card 1: Simulador Cédula A */}
        <div className="flex flex-col justify-between p-8 rounded-3xl bg-gradient-to-br from-indigo-950/20 to-slate-900/40 border border-indigo-500/20 backdrop-blur-md shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all duration-500"></div>
          
          <div className="space-y-4">
            <div className="h-16 w-16 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
              <GraduationCap className="h-8 w-8" />
            </div>
            
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800 dark:bg-teal-950/30 dark:text-teal-400 border border-teal-200/50">
                <CheckCircle2 className="h-3 w-3" /> Oficial CNSF
              </span>
              <h2 className="text-2xl font-black text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                Simulador Cédula A
              </h2>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Prepárate para la certificación oficial de la CNSF. Incluye módulos de estudio interactivos con explicaciones por voz sintética y simulacros de examen reales de 40 preguntas balanceadas.
            </p>

            <div className="flex flex-col gap-2 pt-2 text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                <span>6 módulos completos de la guía oficial</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                <span>Explicaciones contextuales inmediatas</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                <span>{isPromoter ? "Panel administrativo de promotor" : "Tiempos de estudio y récord guardados"}</span>
              </div>
            </div>
          </div>

          {isTrial ? (
            <div className="mt-8 flex flex-col gap-2">
              <button 
                disabled 
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-indigo-950/40 text-slate-500 font-bold text-sm cursor-not-allowed border border-indigo-500/10"
              >
                Módulo Bloqueado <ArrowRight className="h-4 w-4" />
              </button>
              <p className="text-[10px] text-amber-500 font-semibold text-center mt-1 bg-amber-500/10 py-1.5 px-3 rounded-lg border border-amber-500/20 animate-pulse">
                ⚠️ Módulo se desbloquea con cuentas permanentes.
              </p>
            </div>
          ) : (
            <a 
              href="/cedula-a/index.html" 
              className="mt-8 flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all duration-200 shadow-md shadow-indigo-900/20"
            >
              Ingresar al Portal <ArrowRight className="h-4 w-4" />
            </a>
          )}
        </div>

        {/* Card 2: Cédula B (Próximamente) */}
        <div className="flex flex-col justify-between p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm relative overflow-hidden opacity-75 hover:opacity-90 transition-opacity">
          <div className="space-y-4">
            <div className="h-16 w-16 bg-slate-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-slate-500">
              <Award className="h-8 w-8" />
            </div>
            
            <div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-zinc-850 dark:text-zinc-400">
                Próximamente
              </span>
              <h2 className="text-xl font-bold text-slate-800 dark:text-zinc-200 mt-2">
                Simulador Cédula B
              </h2>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Módulo de entrenamiento para la Cédula B de la CNSF. Enfocado en riesgos de daños especiales, ramos comerciales y reaseguro internacional.
            </p>
          </div>

          <button 
            disabled 
            className="mt-8 flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-100 dark:bg-zinc-850 text-slate-400 dark:text-zinc-600 font-bold text-sm cursor-not-allowed"
          >
            Bloqueado
          </button>
        </div>

        {/* Card 3: Formación de Ventas (Próximamente) */}
        <div className="flex flex-col justify-between p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm relative overflow-hidden opacity-75 hover:opacity-90 transition-opacity">
          <div className="space-y-4">
            <div className="h-16 w-16 bg-slate-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-slate-500">
              <BookOpen className="h-8 w-8" />
            </div>
            
            <div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-zinc-850 dark:text-zinc-400">
                Próximamente
              </span>
              <h2 className="text-xl font-bold text-slate-800 dark:text-zinc-200 mt-2">
                Academia de Ventas AACOM
              </h2>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Cursos avanzados de prospección en frío, negociación y técnicas de cierre consultivo. Domina el arte de vender seguros de vida y ahorro.
            </p>
          </div>

          <button 
            disabled 
            className="mt-8 flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-100 dark:bg-zinc-850 text-slate-400 dark:text-zinc-600 font-bold text-sm cursor-not-allowed"
          >
            Bloqueado
          </button>
        </div>

      </div>
    </div>
  )
}
