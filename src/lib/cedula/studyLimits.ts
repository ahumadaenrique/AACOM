/**
 * Utility to calculate study day quotas based on agency subscription plan:
 * - Anual (12M): 52 días
 * - Semestral (6M): 25 días
 * - Trimestral (3M): 12 días
 */
export function getAgencyStudyDaysLimit(agency?: {
  slug?: string | null;
  subscriptionPlan?: string | null;
  subscriptionEndDate?: Date | string | null;
} | null): number {
  if (!agency) return 12;

  // Cuentas fundadoras o internas de AACOM siempre nivel Anual completo
  if (agency.slug && ['aacom', 'aacomsoft', 'demo'].includes(agency.slug)) {
    return 52;
  }

  const plan = agency.subscriptionPlan?.toUpperCase();
  if (plan === 'ANNUAL' || plan === '12M') return 52;
  if (plan === 'SEMIANNUAL' || plan === '6M') return 25;
  if (plan === 'QUARTERLY' || plan === '3M') return 12;

  // Si no tiene plan explícito pero tiene fecha de fin de suscripción:
  if (agency.subscriptionEndDate) {
    const end = new Date(agency.subscriptionEndDate).getTime();
    const now = Date.now();
    const daysRemaining = (end - now) / (1000 * 60 * 60 * 24);
    if (daysRemaining > 200) return 52;
    if (daysRemaining > 100) return 25;
    return 12;
  }

  return 12;
}
