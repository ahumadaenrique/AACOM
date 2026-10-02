import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PhoneCall, FileText, ShieldAlert, Bot, Lock, ArrowRight, Star, Trophy, Zap, Award, TrendingUp } from "lucide-react";
import Link from "next/link";
import { LEVELS_CONFIG, DEFAULT_BENEFITS } from "@/lib/roleplay/gamification";

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

  // Permisos Super Admin
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

  // Cargar estadísticas
  const stats = await prisma.roleplayStats.findUnique({
    where: { userId: dbUser.id }
  });
  
  const currentLevel = stats?.level || 1;
  const currentXP = stats?.xp || 0;
  const currentLevelInfo = LEVELS_CONFIG[currentLevel] || LEVELS_CONFIG[1];
  const nextLevelInfo = LEVELS_CONFIG[currentLevel + 1];

  let progressPercentage = 100;
  let xpNeeded = 0;
  if (nextLevelInfo) {
    const prevMax = currentLevelInfo.minXp;
    const xpInCurrentLevel = currentXP - prevMax;
    const totalXpForNext = nextLevelInfo.minXp - prevMax;
    progressPercentage = Math.min(100, Math.max(0, (xpInCurrentLevel / totalXpForNext) * 100));
    xpNeeded = nextLevelInfo.minXp - currentXP;
  }

  // Cargar Leaderboard (Top 10 de la Agencia)
  const leaderboard = await prisma.roleplayStats.findMany({
    where: {
      user: {
        agencyId: dbUser.agency?.id,
        active: true
      }
    },
    orderBy: { xp: 'desc' },
    take: 10,
    include: {
      user: { select: { id: true, name: true, image: true, role: true } }
    }
  });

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
      descripcion: "Simulador de cita de diagnóstico. Entrénate para detectar dolores, prioridades (F.O.R.D.) y capacidad de ahorro.",
      icono: <FileText className="w-5 h-5" />,
      color: "emerald",
      nivelRequerido: 2,
      link: "/academia/simulador/adn"
    },
    {
      id: "objeciones",
      titulo: "Objeciones y Cierre",
      descripcion: "Simulador de Cierre. El prospecto ya vio la cotización y lanzará objeciones duras (precio, competencia, tiempo).",
      icono: <ShieldAlert className="w-5 h-5" />,
      color: "amber",
      nivelRequerido: 3,
      link: "/academia/simulador/objeciones"
    }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 py-6">
      
      {/* HEADER SECTION */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Hub de Entrenamiento IA</h1>
        <p className="text-sm text-slate-500">Selecciona la disciplina de ventas, compite con tu agencia y sube de nivel.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: MODULES & PROGRESS */}
        <div className="col-span-1 lg:col-span-2 space-y-8">
          
          {/* BIG PROGRESS BAR */}
          <div className="bg-slate-900 rounded-2xl p-6 md:p-8 text-white relative overflow-hidden shadow-xl border border-slate-800">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Star className="w-32 h-32" />
            </div>
            <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-4 flex-1">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-2xl">
                    {currentLevelInfo.icon}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Nivel {currentLevel}: {currentLevelInfo.title}</h2>
                    <p className="text-slate-400 text-sm">
                      {currentXP.toLocaleString()} XP Totales • Racha: {stats?.streak || 0} 🔥
                    </p>
                  </div>
                </div>
                
                {nextLevelInfo ? (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold text-slate-300">
                      <span>Progreso hacia Nivel {currentLevel + 1}</span>
                      <span className="text-emerald-400">Faltan {xpNeeded.toLocaleString()} XP</span>
                    </div>
                    <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full relative" 
                        style={{ width: `${progressPercentage}%` }}
                      >
                        <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="inline-block bg-amber-500/20 text-amber-400 px-4 py-2 rounded-lg text-sm font-bold border border-amber-500/30">
                    🏆 ¡Has alcanzado el Nivel Máximo!
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* MODULES GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {misiones.map((mision) => {
              const locked = currentLevel < mision.nivelRequerido;
              
              return (
                <div 
                  key={mision.id}
                  className={`relative overflow-hidden rounded-2xl border p-6 transition-all duration-300 flex flex-col ${
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
                      <p className="text-xs text-slate-500 mt-1">Alcanza el <strong>Nivel {mision.nivelRequerido}</strong> para desbloquear.</p>
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
                  <p className="text-sm text-slate-500 mb-6 leading-relaxed flex-1">
                    {mision.descripcion}
                  </p>
                  
                  {!locked && (
                    <Link 
                      href={mision.link}
                      className={`inline-flex items-center justify-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors w-full ${
                        mision.color === 'blue' ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' :
                        mision.color === 'emerald' ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' :
                        'bg-amber-50 text-amber-700 hover:bg-amber-100'
                      }`}
                    >
                      Iniciar Misión <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  )}
                </div>
              );
            })}
          </div>

        </div>

        {/* RIGHT COLUMN: LEADERBOARD & ESCALAFON */}
        <div className="col-span-1 space-y-6">
          
          {/* LEADERBOARD CARD */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                <Trophy className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Ranking de la Agencia</h3>
                <p className="text-xs text-slate-500">Top 10 agentes por XP</p>
              </div>
            </div>
            
            <div className="p-2 flex-1">
              {leaderboard.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500">
                  Aún no hay agentes clasificados. ¡Sé el primero!
                </div>
              ) : (
                <ul className="space-y-1">
                  {leaderboard.map((lb, index) => {
                    const isMe = lb.user.id === dbUser.id;
                    return (
                      <li key={lb.userId} className={`flex items-center justify-between p-3 rounded-xl ${isMe ? 'bg-indigo-50 border border-indigo-100' : 'hover:bg-slate-50'}`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            index === 0 ? 'bg-amber-100 text-amber-600' :
                            index === 1 ? 'bg-slate-200 text-slate-600' :
                            index === 2 ? 'bg-orange-100 text-orange-600' :
                            'text-slate-400'
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <p className={`text-xs font-bold truncate max-w-[120px] ${isMe ? 'text-indigo-900' : 'text-slate-700'}`}>
                              {lb.user.name} {isMe && "(Tú)"}
                            </p>
                            <p className="text-[10px] text-slate-500">Nivel {lb.level}</p>
                          </div>
                        </div>
                        <div className="text-xs font-black text-slate-700">
                          {lb.xp.toLocaleString()} <span className="text-slate-400 font-normal">XP</span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          {/* ESCALAFON (TIER LIST) */}
          <div className="bg-[#0f172a] rounded-2xl border border-slate-800 shadow-sm overflow-hidden flex flex-col text-slate-200">
            <div className="p-5 border-b border-slate-800 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <SparklesIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Beneficios por Nivel</h3>
                <p className="text-xs text-slate-400">Alcanza los objetivos para desbloquear</p>
              </div>
            </div>
            <div className="p-4 space-y-3">
              {Object.values(LEVELS_CONFIG).map((lvl) => {
                const isUnlocked = currentLevel >= lvl.level;
                const isCurrent = currentLevel === lvl.level;
                return (
                  <div 
                    key={lvl.level}
                    className={`p-3 rounded-xl border ${
                      isCurrent 
                        ? 'bg-slate-800/80 border-slate-700' 
                        : isUnlocked 
                          ? 'bg-slate-900/50 border-slate-800' 
                          : 'bg-slate-900/20 border-slate-800 opacity-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base">{lvl.icon}</span>
                      <h4 className={`text-xs font-bold ${isUnlocked ? 'text-white' : 'text-slate-500'}`}>
                        Nivel {lvl.level}: {lvl.title}
                      </h4>
                    </div>
                    <ul className="pl-7 list-disc text-[11px] text-slate-400 space-y-0.5">
                      {DEFAULT_BENEFITS[lvl.level]?.map((benefit, i) => (
                        <li key={i}>{benefit}</li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function SparklesIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    </svg>
  );
}
