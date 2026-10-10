// MOTOR DE GAMIFICACIÓN, NIVELES, PENALIZACIONES Y BENEFICIOS DE AACOM

export interface LevelInfo {
  level: number;
  title: string;
  icon: string;
  minXp: number;
  maxXp: number;
}

export const LEVELS_CONFIG: Record<number, LevelInfo> = {
  1: { level: 1, title: 'Novato', icon: '🥉', minXp: 0, maxXp: 1499 },
  2: { level: 2, title: 'Intermedio', icon: '🎖️', minXp: 1500, maxXp: 3999 },
  3: { level: 3, title: 'Avanzado', icon: '🥈', minXp: 4000, maxXp: 7499 },
  4: { level: 4, title: 'Experto', icon: '🥇', minXp: 7500, maxXp: 11999 },
  5: { level: 5, title: 'Maestro', icon: '💎', minXp: 12000, maxXp: 999999 }
};

export const BADGES_CATALOG = [
  { id: 'primera_cita', name: 'Primer Cierre', desc: 'Cerró su primera cita telefónica', icon: '🎯' },
  { id: 'racha_3_dias', name: 'Constancia de Acero', desc: '3 días seguidos cumpliendo meta', icon: '🔥' },
  { id: 'maestro_objecion', name: 'Escudo Blindado', desc: 'Superó objeciones complejas con maestría', icon: '🛡️' },
  { id: 'experto_frio', name: 'Cazador Glacial', desc: 'Cerró cita en llamada en frío total', icon: '❄️' },
  { id: 'dia_perfecto', name: 'Racha Imparable', desc: 'Alcanzó el tope diario de 500 XP', icon: '⚡' },
  { id: 'lobo_aacom', name: 'Lobo de AACOM', desc: 'Alcanzó el Nivel 5 de élite', icon: '👑' }
];

export const DEFAULT_BENEFITS: Record<number, string[]> = {
  1: ["Acceso al Módulo de Prospección Telefónica"],
  2: ["Desbloquea el Módulo de Análisis de Necesidades (ADN)"],
  3: ["Desbloquea el Módulo de Objeciones y Cierre"],
  4: ["Desbloquea Voces Premium y Casos Complejos"],
  5: ["1 perdón de multas/retardos al mes", "Insignia Master en el directorio de la Agencia"]
};

export const DAILY_XP_CAP = 500;
export const MISSED_DAY_PENALTY_XP = 250;
export const DAILY_GOAL_CALLS = 3;

export function calculateLevelFromXp(xp: number): number {
  const safeXp = Math.max(0, xp);
  if (safeXp >= 12000) return 5;
  if (safeXp >= 7500) return 4;
  if (safeXp >= 4000) return 3;
  if (safeXp >= 1500) return 2;
  return 1;
}

export function isBusinessDay(date: Date): boolean {
  const day = date.getDay();
  return day !== 0 && day !== 6; // 0 = Domingo, 6 = Sábado
}

/**
 * Revisa si el agente faltó días hábiles y aplica penalización de -700 XP por día hábil omitido
 */
export function getLocalDateString(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Mexico_City',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(date);
}
export function checkAndApplyInactivityPenalty(stats: {
  xp: number;
  lastActiveDate: string | null;
  streak: number;
}): { newXp: number; newStreak: number; penalizedDays: number; penaltyXp: number } {
  if (!stats.lastActiveDate) {
    return { newXp: stats.xp, newStreak: stats.streak, penalizedDays: 0, penaltyXp: 0 };
  }

  const todayStr = getLocalDateString();
  if (stats.lastActiveDate === todayStr) {
    return { newXp: stats.xp, newStreak: stats.streak, penalizedDays: 0, penaltyXp: 0 };
  }

  const lastDate = new Date(stats.lastActiveDate);
  const today = new Date(todayStr);

  let missedBusinessDays = 0;
  const cur = new Date(lastDate);
  cur.setDate(cur.getDate() + 1);

  while (cur < today) {
    if (isBusinessDay(cur)) {
      missedBusinessDays++;
    }
    cur.setDate(cur.getDate() + 1);
  }

  if (missedBusinessDays > 0) {
    const penalty = missedBusinessDays * MISSED_DAY_PENALTY_XP;
    const newXp = Math.max(0, stats.xp - penalty);
    return {
      newXp,
      newStreak: 0, // Pierde la racha
      penalizedDays: missedBusinessDays,
      penaltyXp: penalty
    };
  }

  return { newXp: stats.xp, newStreak: stats.streak, penalizedDays: 0, penaltyXp: 0 };
}
