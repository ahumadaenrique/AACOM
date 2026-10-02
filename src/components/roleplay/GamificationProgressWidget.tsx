import { prisma } from "@/lib/prisma";
import { Award, Star, Lock, Unlock, Zap, TrendingUp } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { LEVELS_CONFIG, DEFAULT_BENEFITS } from "@/lib/roleplay/gamification";

const LEVELS = Object.values(LEVELS_CONFIG).map((levelInfo) => {
  let iconComponent = <Star className="h-4 w-4 text-slate-400" />;
  if (levelInfo.level === 2) iconComponent = <TrendingUp className="h-4 w-4 text-emerald-400" />;
  if (levelInfo.level === 3) iconComponent = <Zap className="h-4 w-4 text-amber-400" />;
  if (levelInfo.level === 4) iconComponent = <Award className="h-4 w-4 text-purple-400" />;
  if (levelInfo.level >= 5) iconComponent = <Award className="h-4 w-4 text-yellow-500" />;

  return {
    level: levelInfo.level,
    maxXP: levelInfo.maxXp === 999999 ? 999999 : levelInfo.maxXp + 1,
    name: levelInfo.title,
    benefit: DEFAULT_BENEFITS[levelInfo.level]?.[0] || '',
    icon: iconComponent
  };
});

export async function GamificationProgressWidget({ userId }: { userId: string }) {
  if (!userId) return null;

  const stats = await prisma.roleplayStats.findUnique({
    where: { userId },
  });

  if (!stats) return null;

  const currentLevel = stats.level;
  const currentXP = stats.xp;
  
  const currentLevelIndex = LEVELS.findIndex(l => l.level === currentLevel);
  const currentLevelData = LEVELS[currentLevelIndex] || LEVELS[LEVELS.length - 1];
  const nextLevelData = LEVELS[currentLevelIndex + 1];

  const maxXP = currentLevelData.maxXP;
  // Calculate percentage for current level progress
  let progressPercentage = 100;
  if (nextLevelData) {
    const prevMax = currentLevelIndex > 0 ? LEVELS[currentLevelIndex - 1].maxXP : 0;
    const xpInCurrentLevel = currentXP - prevMax;
    const xpNeededForNext = maxXP - prevMax;
    progressPercentage = Math.min(100, Math.max(0, (xpInCurrentLevel / xpNeededForNext) * 100));
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white transition-colors border border-slate-700 shadow-sm shrink-0">
          <Award className="h-4 w-4 text-amber-400" />
          <div className="flex flex-col items-start gap-0.5 hidden sm:flex">
            <div className="flex items-center justify-between w-full gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">Nivel {currentLevel}</span>
              <span className="text-[9px] text-slate-400">{currentXP} XP</span>
            </div>
            {nextLevelData && (
              <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full" 
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            )}
          </div>
        </button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-72 p-2 rounded-2xl shadow-xl border-slate-200">
        <DropdownMenuLabel className="pb-2">
          <h3 className="text-sm font-black text-slate-800">Tu Progreso (Nivel {currentLevel})</h3>
          <p className="text-xs text-slate-500 font-normal mt-0.5">Sube de nivel completando llamadas exitosas para desbloquear recompensas.</p>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <div className="space-y-1 py-1">
          {LEVELS.map((lvl) => {
            const isUnlocked = currentLevel >= lvl.level;
            const isCurrent = currentLevel === lvl.level;
            
            return (
              <div 
                key={lvl.level} 
                className={`flex items-start gap-3 p-2.5 rounded-xl transition-colors ${
                  isCurrent 
                    ? 'bg-indigo-50 border border-indigo-100' 
                    : isUnlocked 
                      ? 'bg-transparent' 
                      : 'bg-slate-50 opacity-60'
                }`}
              >
                <div className={`mt-0.5 shrink-0 ${isUnlocked ? 'text-emerald-500' : 'text-slate-400'}`}>
                  {isUnlocked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                </div>
                <div>
                  <h4 className={`text-xs font-bold ${isCurrent ? 'text-indigo-900' : 'text-slate-700'}`}>
                    Nivel {lvl.level}: {lvl.name}
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">{lvl.benefit}</p>
                </div>
              </div>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
