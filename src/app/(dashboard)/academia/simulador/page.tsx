import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PhoneCall, FileText, ShieldAlert, Bot, Lock, ArrowRight, Star } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Hub del Simulador IA | AACOM Seguros",
  description: "Entrenamiento gamificado de ventas con inteligencia artificial."
};

export default async function SimuladorHubPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      role: true,
      agency: {
        select: {
          id: true,
          name: true,
          allowRoleplaySimulator: true,
          elevenLabsApiKey: true
        }
      }
    }
  });

  if (!dbUser) {
    redirect("/login");
  }

  // Permisos Super Admin (bypass allowRoleplaySimulator)
  const isSuperAdmin = dbUser.role === 'SUPER_ADMIN';

  if (!isSuperAdmin && dbUser.agency && dbUser.agency.allowRoleplaySimulator === false) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-5 shadow-2xl">
        <div className="h-16 w-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 text-2xl">
          📵
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white">Módulo Desactivado</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            El <strong>Simulador de Prospección IA</strong> ha sido desactivado para tu agencia por la administración.
          </p>
        </div>
        <div className="pt-2">
          <Link href="/academia" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors">
            ← Volver a Academia
          </Link>
        </div>
      </div>
    );
  }

  // BYOK Bloqueo Comercial
  const hasByokKey = !!dbUser.agency?.elevenLabsApiKey || !!process.env.ELEVENLABS_API_KEY;
  if (!hasByokKey && !isSuperAdmin) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-5 shadow-2xl">
        <div className="h-16 w-16 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
          <Bot className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white">Falta Configuración IA</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Tu Promotoría ({dbUser.agency?.name}) aún no ha configurado su Llave de Inteligencia Artificial (API Key).
          </p>
          <p className="text-xs text-slate-500 mt-2">
            Pide a tu Promotor que acceda al panel de <strong>Agencias &gt; Configuración IA</strong> para conectar ElevenLabs y activar tu entrenamiento.
          </p>
        </div>
        <div className="pt-2">
          <Link href="/academia" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors">
            ← Volver a Academia
          </Link>
        </div>
      </div>
    );
  }

  // Cargar estadísticas para bloquear disciplinas avanzadas
  const stats = await prisma.roleplayStats.findUnique({
    where: { userId: dbUser.id }
  });
  const currentLevel = stats?.level || 1;

  const misiones = [
    {
      id: "prospeccion",
      titulo: "Llamada de Prospección",
      descripcion: "Aprende a romper el hielo, vender la cita de diagnóstico y rebatir las objeciones iniciales de la llamada fría.",
      icono: <PhoneCall className="w-5 h-5" />,
      color: "blue",
      nivelRequerido: 1,
      link: "/academia/simulador/prospeccion"
    },
    {
      id: "adn",
      titulo: "Análisis de Necesidades (ADN)",
      descripcion: "Simulador de cita de diagnóstico. Entrénate para detectar dolores, prioridades (F.O.R.D.) y capacidad de ahorro sin sonar intrusivo.",
      icono: <FileText className="w-5 h-5" />,
      color: "emerald",
      nivelRequerido: 2,
      link: "/academia/simulador/adn"
    },
    {
      id: "objeciones",
      titulo: "Objeciones y Cierre",
      descripcion: "Simulador de Cierre. El prospecto ya vio la cotización y lanzará objeciones duras (precio, competencia, tiempo). Aprende a rebatirlas.",
      icono: <ShieldAlert className="w-5 h-5" />,
      color: "amber",
      nivelRequerido: 3,
      link: "/academia/simulador/objeciones"
    }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Hub de Entrenamiento IA</h1>
        <p className="text-sm text-slate-500">Selecciona la disciplina de ventas que deseas practicar con tu Copiloto.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {misiones.map((mision) => {
          const locked = currentLevel < mision.nivelRequerido;
          
          return (
            <div 
              key={mision.id}
              className={`relative overflow-hidden rounded-2xl border p-6 transition-all duration-300 ${
                locked 
                  ? "bg-slate-50 border-slate-200" 
                  : "bg-white border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 group"
              }`}
            >
              {locked && (
                <div className="absolute inset-0 bg-slate-50/80 backdrop-blur-[1px] flex flex-col items-center justify-center z-10 p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center mb-3">
                    <Lock className="w-5 h-5 text-slate-500" />
                  </div>
                  <h3 className="font-semibold text-slate-700 text-sm">Bloqueado</h3>
                  <p className="text-xs text-slate-500 mt-1">Alcanza el <strong>Nivel {mision.nivelRequerido}</strong> en prospección para desbloquear.</p>
                </div>
              )}
              
              <div className={`w-12 h-12 rounded-xl mb-4 flex items-center justify-center ${
                mision.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                mision.color === 'emerald' ? 'bg-emerald-100 text-emerald-600' :
                'bg-amber-100 text-amber-600'
              }`}>
                {mision.icono}
              </div>
              
              <h3 className="text-lg font-bold text-slate-900 mb-2">{mision.titulo}</h3>
              <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                {mision.descripcion}
              </p>
              
              {!locked && (
                <Link 
                  href={mision.link}
                  className={`inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg transition-colors ${
                    mision.color === 'blue' ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' :
                    mision.color === 'emerald' ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' :
                    'bg-amber-50 text-amber-700 hover:bg-amber-100'
                  }`}
                >
                  Iniciar Misión <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              )}
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-6 flex flex-col md:flex-row items-center gap-6">
        <div className="w-16 h-16 rounded-full bg-indigo-100 flex-shrink-0 flex items-center justify-center">
          <Star className="w-8 h-8 text-indigo-600" />
        </div>
        <div>
          <h3 className="text-base font-bold text-indigo-900">Tu Nivel Actual: {currentLevel}</h3>
          <p className="text-sm text-indigo-800 mt-1 leading-relaxed">
            Sigue practicando llamadas de prospección para acumular experiencia y desbloquear las disciplinas avanzadas de <strong>Análisis de Necesidades</strong> y <strong>Cierre</strong>. ¡La constancia es la clave del éxito!
          </p>
        </div>
      </div>
    </div>
  );
}
