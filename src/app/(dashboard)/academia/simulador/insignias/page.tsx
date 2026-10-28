import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { BADGES } from '@/lib/roleplay/badges';
import Link from 'next/link';
import { ArrowLeft, Award, Lock, Trophy } from 'lucide-react';

export const metadata = {
  title: 'Álbum de Insignias | Academia PRO',
  description: 'Colección de insignias y recompensas del simulador IA.'
};

export default async function InsigniasPage() {
  try {
    const session = await auth();
    if (!session?.user?.email && !session?.user?.id) redirect('/login');

    const user = await prisma.user.findFirst({
      where: session.user.id ? { id: session.user.id } : { email: session.user.email! },
      select: { id: true, role: true, agency: true }
    });

    if (!user) redirect('/login');

    if (user.role === 'REFERIDOR') {
      redirect('/academia/videos');
    }

    const stats = await prisma.roleplayStats.findUnique({
      where: { userId: user.id }
    });

    const agency = user.agency;
    const rewardActive = agency?.roleplayRewardActive ?? true;
    const rewardAmount = agency?.roleplayRewardAmount ?? 1500;
    const rewardTitle = agency?.roleplayRewardTitle || 'Bono por Álbum Completo';

    const rawUnlockedIds = stats?.badges || [];
    const validCatalogMap = new Map(BADGES.map(b => [b.id, b]));
    const unlockedSet = new Set(rawUnlockedIds.filter((id: string) => validCatalogMap.has(id)));
    
    // Si completó las 34 regulares, califica para c_maestro
    const regularBadges = BADGES.filter(b => b.id !== 'c_maestro');
    const regularUnlockedCount = regularBadges.filter(b => unlockedSet.has(b.id)).length;
    if (regularUnlockedCount >= regularBadges.length) {
      unlockedSet.add('c_maestro');
    }
    
    const totalBadges = BADGES.length;
    const unlockedCount = unlockedSet.size;
    const isMaster = unlockedSet.has('c_maestro');
    const progressPct = Math.min(100, Math.round((unlockedCount / totalBadges) * 100));

  return (
    <div className="max-w-7xl mx-auto space-y-8 py-6">
      
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/academia/simulador" className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Trofeos e Insignias</h1>
          <p className="text-sm text-slate-500">
            {rewardActive
              ? `Colecciona las ${totalBadges} insignias para desbloquear tu bono de $${rewardAmount.toLocaleString('es-MX')} MXN.`
              : `Colecciona las ${totalBadges} insignias para alcanzar la Maestría Patrimonial de élite.`}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-slate-900 rounded-3xl p-8 relative overflow-hidden shadow-xl border border-slate-800 text-white">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Trophy className="w-32 h-32 text-amber-500" />
        </div>
        <div className="relative z-10 space-y-4">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Award className="w-6 h-6 text-amber-400" />
                {unlockedCount} / {totalBadges} Insignias
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                {unlockedCount === totalBadges 
                  ? (rewardActive 
                      ? `¡Felicidades! Has completado el Álbum y desbloqueado tu ${rewardTitle} de $${rewardAmount.toLocaleString('es-MX')} MXN.`
                      : '¡Felicidades! Has completado el Álbum y alcanzado la Maestría de Élite.')
                  : (rewardActive
                      ? `Te faltan ${totalBadges - unlockedCount} insignias para el bono de $${rewardAmount.toLocaleString('es-MX')} MXN.`
                      : `Te faltan ${totalBadges - unlockedCount} insignias para completar el Álbum.`)}
              </p>
            </div>
            <span className="text-3xl font-black text-slate-700">{progressPct}%</span>
          </div>
          
          <div className="w-full h-4 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-1000"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Badge Grid */}
      <div className="space-y-12">
        
        {['prospeccion', 'adn', 'objeciones', 'general'].map((modulo) => {
          const moduleBadges = BADGES.filter(b => b.moduleId === modulo);
          if (moduleBadges.length === 0) return null;

          const moduleTitle = modulo === 'prospeccion' ? 'Prospección Telefónica' :
                              modulo === 'adn' ? 'Análisis de Necesidades' :
                              modulo === 'objeciones' ? 'Objeciones y Cierre' : 'Maestría General';

          return (
            <div key={modulo} className="space-y-4">
              <h3 className="text-lg font-bold text-slate-800 border-b pb-2">{moduleTitle}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {moduleBadges.map((badge) => {
                  const isUnlocked = unlockedSet.has(badge.id);
                  
                  return (
                    <div 
                      key={badge.id}
                      className={`relative p-4 rounded-2xl border text-center transition-all duration-300 ${
                        isUnlocked 
                          ? 'bg-white border-amber-200 shadow-lg shadow-amber-500/10 hover:-translate-y-1'
                          : 'bg-slate-50 border-slate-200 opacity-60 grayscale hover:grayscale-0'
                      }`}
                    >
                      {!isUnlocked && (
                        <div className="absolute top-2 right-2">
                          <Lock className="w-3 h-3 text-slate-400" />
                        </div>
                      )}
                      <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center text-2xl mb-3 ${
                        isUnlocked ? 'bg-amber-100' : 'bg-slate-200'
                      }`}>
                        {badge.icon}
                      </div>
                      <h4 className={`text-sm font-bold mb-1 ${isUnlocked ? 'text-slate-900' : 'text-slate-500'}`}>
                        {badge.name}
                      </h4>
                      <p className="text-[10px] leading-snug text-slate-500">
                        {badge.description}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
        
      </div>
    </div>
  );
  } catch (error: any) {
    if (error?.digest?.startsWith('NEXT_REDIRECT') || error?.message === 'NEXT_REDIRECT') {
      throw error;
    }
    console.error("Error en insignias/page.tsx:", error);
    return (
      <div className="max-w-xl mx-auto my-16 p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-4 text-white shadow-xl">
        <div className="h-14 w-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 text-2xl">
          ⚠️
        </div>
        <h2 className="text-xl font-bold">Detalle al cargar las Insignias</h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          {error?.message || "Ocurrió un problema temporal al sincronizar el catálogo de insignias."}
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <Link href="/academia/simulador" className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300">
            ← Volver al Hub
          </Link>
          <a href="/academia/simulador/insignias" className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white">
            Recargar
          </a>
        </div>
      </div>
    );
  }
}
