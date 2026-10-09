import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { GraduationCap, Award, BookOpen, ArrowRight, ShieldAlert, Sparkles, CheckCircle2 } from "lucide-react"
import Link from "next/link"

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
  const isPromoter = dbUser?.role === 'ADMIN' || dbUser?.role === 'SUPER_ADMIN'
  const isSimulatorAllowed = dbUser?.role === 'SUPER_ADMIN' || (dbUser?.agency ? (dbUser.agency.allowRoleplaySimulator ?? true) : true)

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

        {/* Card 2: Simulador Cédula B */}
        <div className="flex flex-col justify-between p-8 rounded-3xl bg-gradient-to-br from-teal-950/20 to-slate-900/40 border border-teal-500/20 backdrop-blur-md shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl group-hover:bg-teal-500/20 transition-all duration-500"></div>
          
          <div className="space-y-4">
            <div className="h-16 w-16 bg-teal-50 dark:bg-teal-950/40 rounded-2xl flex items-center justify-center text-teal-600 dark:text-teal-400 transition-colors group-hover:bg-teal-600 group-hover:text-white">
              <Award className="h-8 w-8" />
            </div>
            
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800 dark:bg-teal-950/30 dark:text-teal-400 border border-teal-200/50">
                <CheckCircle2 className="h-3 w-3" /> Oficial CNSF
              </span>
              <h2 className="text-2xl font-black text-slate-800 dark:text-slate-200 group-hover:text-teal-500 dark:group-hover:text-teal-400 transition-colors">
                Simulador Cédula B
              </h2>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Módulo de entrenamiento oficial para la Cédula B de la CNSF (Riesgos Empresariales de Personas y Daños). Incluye 7 módulos interactivos, explicaciones técnicas por voz y exámenes de práctica reales de 80 preguntas.
            </p>

            <div className="flex flex-col gap-2 pt-2 text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                <span>7 módulos: Personas, Incendio, Transportes, RC y Ramos Técnicos</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                <span>645 reactivos con fundamento técnico y legal</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                <span>Días y licencias compartidos con Cédula A</span>
              </div>
            </div>
          </div>

          {isTrial ? (
            <div className="mt-8 flex flex-col gap-2">
              <button 
                disabled 
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-teal-950/40 text-slate-500 font-bold text-sm cursor-not-allowed border border-teal-500/10"
              >
                Módulo Bloqueado <ArrowRight className="h-4 w-4" />
              </button>
              <p className="text-[10px] text-amber-500 font-semibold text-center mt-1 bg-amber-500/10 py-1.5 px-3 rounded-lg border border-amber-500/20 animate-pulse">
                ⚠️ Módulo se desbloquea con cuentas permanentes.
              </p>
            </div>
          ) : (
            <a 
              href="/cedula-b/index.html" 
              className="mt-8 flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-sm transition-all duration-200 shadow-md shadow-teal-900/20"
            >
              Ingresar al Portal <ArrowRight className="h-4 w-4" />
            </a>
          )}
        </div>

        {/* Card 3: Academia PRO IA */}
        <div className="flex flex-col justify-between p-8 rounded-3xl bg-gradient-to-br from-indigo-950/20 to-slate-900/40 border border-indigo-500/20 backdrop-blur-md shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all duration-500"></div>

          <div className="space-y-4">
            <div className="h-16 w-16 bg-purple-50 dark:bg-purple-950/40 rounded-2xl flex items-center justify-center text-purple-600 dark:text-purple-400 transition-colors group-hover:bg-purple-600 group-hover:text-white">
              <Sparkles className="h-8 w-8" />
            </div>
            
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-950/30 dark:text-purple-400 border border-purple-200/50">
                ✨ Inteligencia Artificial • Voz en Vivo
              </span>
              <h2 className="text-2xl font-black text-slate-800 dark:text-slate-200 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                Academia PRO
              </h2>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Entrena tus llamadas telefónicas con prospectos interactivos simulados por IA. Supera objeciones, aplica la regla de diagnóstico antes de recetar y concreta citas de 30-40 minutos.
            </p>

            <div className="flex flex-col gap-2 pt-2 text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                <span>300+ escenarios procedurales adaptativos</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                <span>Evaluación pedagógica con Coach Tip por llamada</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                <span>Gamificación con niveles, rachas y auditoría de grabaciones</span>
              </div>
            </div>
          </div>

          {!isSimulatorAllowed ? (
            <div className="mt-8 flex flex-col gap-2">
              <button 
                disabled 
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-800/80 text-slate-500 font-bold text-sm cursor-not-allowed border border-slate-700/50"
              >
                Módulo Desactivado por Administración
              </button>
              <p className="text-[10px] text-amber-500 font-semibold text-center mt-1">
                🔒 Tu agencia no tiene habilitado el simulador de llamadas telefónicas.
              </p>
            </div>
          ) : (
            <Link 
              href="/academia/simulador" 
              className="mt-8 flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm transition-all duration-200 shadow-md shadow-purple-900/20"
            >
              Entrar a la Academia PRO <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>

      </div>
    </div>
  )
}
