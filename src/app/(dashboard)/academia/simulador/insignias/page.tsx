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
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const stats = await prisma.roleplayStats.findUnique({
    where: { userId: session.user.id }
  });

  const unlockedIds = stats?.badges || [];
  const totalBadges = BADGES.length;
  const unlockedCount = unlockedIds.length;
  const isMaster = unlockedCount >= 34; // Needs all except the final one to get it (or all 35)

  const progressPct = Math.round((unlockedCount / totalBadges) * 100);

  return (
    <div className="max-w-7xl mx-auto space-y-8 py-6">
      
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/academia/simulador" className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Trofeos e Insignias</h1>
          <p className="text-sm text-slate-500">Colecciona las {totalBadges} insignias para desbloquear tu bono especial.</p>
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
                  ? '¡Felicidades! Has completado el Álbum y desbloqueado tu premio.'
                  : `Te faltan ${totalBadges - unlockedCount} insignias para el bono de $1,500 MXN.`}
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
                  const isUnlocked = unlockedIds.includes(badge.id) || (badge.id === 'c_maestro' && isMaster);
                  
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
}
