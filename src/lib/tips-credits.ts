import { prisma } from '@/lib/prisma';

export interface TipsPackageDef {
  id: 'tips_30' | 'tips_70' | 'tips_150';
  name: string;
  credits: number;
  priceMxn: number;
  priceCents: number;
  validityDays: number;
  badge?: string;
  description: string;
}

export const TIPS_PACKAGES: Record<string, TipsPackageDef> = {
  tips_30: {
    id: 'tips_30',
    name: 'Paquete Taller Inicial — 30 Créditos TIPS',
    credits: 30,
    priceMxn: 750,
    priceCents: 75000, // $750.00 MXN
    validityDays: 90,
    description: 'Ideal para 1 taller presencial de hasta 30 prospectos identificados. Vigencia de 90 días.',
  },
  tips_70: {
    id: 'tips_70',
    name: 'Paquete Taller Pro — 70 Créditos TIPS',
    credits: 70,
    priceMxn: 1400,
    priceCents: 140000, // $1,400.00 MXN ($20/crédito)
    validityDays: 90,
    badge: 'Más Popular ($20/crédito)',
    description: 'Para 1 taller lleno (50-70 asistentes) o 2 talleres medianos. Vigencia de 90 días.',
  },
  tips_150: {
    id: 'tips_150',
    name: 'Paquete Promotoría / Escala — 150 Créditos TIPS',
    credits: 150,
    priceMxn: 2700,
    priceCents: 270000, // $2,700.00 MXN ($18/crédito)
    validityDays: 90,
    badge: 'Mejor Valor ($18/crédito)',
    description: 'Bolsa de alto volumen con el menor costo unitario ($18/prospecto) para múltiples talleres en el trimestre. Vigencia de 90 días.',
  },
};

/**
 * Sincroniza el saldo de créditos vigentes (no expirados a 90 días) del Usuario y su Promotoría
 */
export async function getAndSyncTipsBalance(
  userId: string,
  agencyId?: string | null,
  overrideRole?: string | null
) {
  const now = new Date();

  // 1. Compras vigentes individuales del agente
  const userPurchases = await prisma.tipsCreditPurchase.findMany({
    where: {
      userId,
      agencyId: null,
      expiresAt: { gt: now },
      creditsRemaining: { gt: 0 },
    },
    orderBy: { expiresAt: 'asc' },
  });

  const validUserPurchaseCredits = userPurchases.reduce((acc, p) => acc + p.creditsRemaining, 0);

  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { tipsCreditsBalance: true, agencyId: true, role: true },
  });

  // Si hubo compras con vencimiento, el saldo real es la suma de lotes vigentes (o saldo manual si no hay lotes)
  const totalUserPurchasesEver = await prisma.tipsCreditPurchase.count({
    where: { userId, agencyId: null },
  });

  let effectiveUserBalance = Math.max(0, dbUser?.tipsCreditsBalance || 0);
  if (totalUserPurchasesEver > 0 && effectiveUserBalance !== validUserPurchaseCredits) {
    effectiveUserBalance = validUserPurchaseCredits;
    await prisma.user.update({
      where: { id: userId },
      data: { tipsCreditsBalance: effectiveUserBalance },
    });
  }

  // 2. Compras vigentes de la Promotoría (Agency)
  const effectiveAgencyId = agencyId || dbUser?.agencyId || null;
  let effectiveAgencyBalance = 0;
  let agencyGlobalShareEnabled = false;
  let allowedAgentIds: string[] | null = null;
  let agencySharesPool = false;
  let agencyPurchases: typeof userPurchases = [];

  if (effectiveAgencyId) {
    agencyPurchases = await prisma.tipsCreditPurchase.findMany({
      where: {
        agencyId: effectiveAgencyId,
        expiresAt: { gt: now },
        creditsRemaining: { gt: 0 },
      },
      orderBy: { expiresAt: 'asc' },
    });

    const validAgencyPurchaseCredits = agencyPurchases.reduce((acc, p) => acc + p.creditsRemaining, 0);
    const totalAgencyPurchasesEver = await prisma.tipsCreditPurchase.count({
      where: { agencyId: effectiveAgencyId },
    });

    const dbAgency = await prisma.agency.findUnique({
      where: { id: effectiveAgencyId },
      select: {
        tipsCreditsBalance: true,
        tipsShareAgencyCredits: true,
        tipsAllowedAgentIds: true,
      },
    });

    effectiveAgencyBalance = Math.max(0, dbAgency?.tipsCreditsBalance || 0);

    if (
      typeof dbAgency?.tipsAllowedAgentIds === 'string' &&
      dbAgency.tipsAllowedAgentIds.trim() !== ''
    ) {
      try {
        const parsed = JSON.parse(dbAgency.tipsAllowedAgentIds);
        if (Array.isArray(parsed)) {
          allowedAgentIds = parsed.map((id) => String(id));
        }
      } catch (_) {
        allowedAgentIds = dbAgency.tipsAllowedAgentIds
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
      }
    }

    // Regla estricta: Por default es "No compartir" (false).
    // Solo se comparte si tipsShareAgencyCredits === true Y existe una configuración explícita de agentes autorizados.
    agencyGlobalShareEnabled =
      Boolean(dbAgency?.tipsShareAgencyCredits) && allowedAgentIds !== null;

    const effectiveRole = overrideRole || dbUser?.role || 'AGENTE';
    const isManager = effectiveRole === 'ADMIN' || effectiveRole === 'SUPER_ADMIN';
    if (isManager) {
      // El Promotor / Admin titular siempre puede usar la bolsa de su promotoría cuando él imparte un taller
      agencySharesPool = true;
    } else if (!agencyGlobalShareEnabled) {
      agencySharesPool = false;
    } else if (Array.isArray(allowedAgentIds)) {
      agencySharesPool = allowedAgentIds.includes(userId);
    } else {
      agencySharesPool = false;
    }

    if (totalAgencyPurchasesEver > 0 && effectiveAgencyBalance !== validAgencyPurchaseCredits) {
      effectiveAgencyBalance = validAgencyPurchaseCredits;
      await prisma.agency.update({
        where: { id: effectiveAgencyId },
        data: { tipsCreditsBalance: effectiveAgencyBalance },
      });
    }
  }

  const totalAvailableForHost =
    effectiveUserBalance + (agencySharesPool ? effectiveAgencyBalance : 0);

  return {
    effectiveAgencyId,
    userBalance: effectiveUserBalance,
    agencyBalance: effectiveAgencyBalance,
    agencySharesPool,
    agencyGlobalShareEnabled,
    allowedAgentIds,
    totalAvailableForHost,
    userPurchases,
    agencyPurchases,
  };
}

/**
 * Descuenta 1 crédito FIFO (primero el lote próximo a vencer < 90 días).
 * Prioridad: 1) Bolsa individual del Agente Host -> 2) Bolsa compartida de la Promotoría (solo si está autorizado)
 */
export async function consumeOneTipsCredit(params: {
  hostId: string;
  agencyId?: string | null;
}): Promise<{
  success: boolean;
  source?: 'USER' | 'AGENCY';
  remainingTotal: number;
  error?: string;
}> {
  const { hostId, agencyId } = params;
  const status = await getAndSyncTipsBalance(hostId, agencyId);
  const targetAgencyId = agencyId || status.effectiveAgencyId;

  if (status.totalAvailableForHost <= 0) {
    return {
      success: false,
      remainingTotal: 0,
      error:
        'Sin créditos TIPS disponibles. Solicita autorización a tu promotoría o adquiere tu propio paquete de créditos.',
    };
  }

  // 1. Intentar descontar de la bolsa individual del Agente Host
  if (status.userBalance > 0) {
    const earliestBatch = status.userPurchases[0];
    const nextUserBalance = Math.max(0, status.userBalance - 1);
    if (earliestBatch) {
      await prisma.tipsCreditPurchase.update({
        where: { id: earliestBatch.id },
        data: { creditsRemaining: Math.max(0, earliestBatch.creditsRemaining - 1) },
      });
    }
    await prisma.user.update({
      where: { id: hostId },
      data: { tipsCreditsBalance: nextUserBalance },
    });

    return {
      success: true,
      source: 'USER',
      remainingTotal: Math.max(0, status.totalAvailableForHost - 1),
    };
  }

  // 2. Intentar descontar de la bolsa compartida de la Promotoría (solo si el agente está autorizado)
  if (targetAgencyId && status.agencySharesPool && status.agencyBalance > 0) {
    const earliestAgencyBatch = status.agencyPurchases[0];
    const nextAgencyBalance = Math.max(0, status.agencyBalance - 1);
    if (earliestAgencyBatch) {
      await prisma.tipsCreditPurchase.update({
        where: { id: earliestAgencyBatch.id },
        data: { creditsRemaining: Math.max(0, earliestAgencyBatch.creditsRemaining - 1) },
      });
    }
    await prisma.agency.update({
      where: { id: targetAgencyId },
      data: { tipsCreditsBalance: nextAgencyBalance },
    });

    return {
      success: true,
      source: 'AGENCY',
      remainingTotal: Math.max(0, status.totalAvailableForHost - 1),
    };
  }

  return {
    success: false,
    remainingTotal: 0,
    error: 'No hay créditos vigentes o autorizados disponibles para esta sesión.',
  };
}

/**
 * Acredita un paquete de créditos comprado (30, 70 o 150) con vigencia de 90 días
 */
export async function grantTipsCreditsPackage(params: {
  userId: string;
  agencyId?: string | null;
  target: 'user' | 'agency';
  packageId: string;
  creditsToAdd: number;
  amountPaidMxn: number;
  stripeSessionId?: string | null;
}) {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 días exactos

  // Evitar duplicados si el webhook de Stripe se dispara 2 veces
  if (params.stripeSessionId) {
    const existing = await prisma.tipsCreditPurchase.findFirst({
      where: { stripeSessionId: params.stripeSessionId },
    });
    if (existing) return existing;
  }

  if (params.target === 'agency' && params.agencyId) {
    const purchase = await prisma.tipsCreditPurchase.create({
      data: {
        userId: params.userId,
        agencyId: params.agencyId,
        packageId: params.packageId,
        creditsTotal: params.creditsToAdd,
        creditsRemaining: params.creditsToAdd,
        amountPaid: params.amountPaidMxn,
        stripeSessionId: params.stripeSessionId || null,
        expiresAt,
      },
    });
    await prisma.agency.update({
      where: { id: params.agencyId },
      data: { tipsCreditsBalance: { increment: params.creditsToAdd } },
    });
    return purchase;
  } else {
    const purchase = await prisma.tipsCreditPurchase.create({
      data: {
        userId: params.userId,
        agencyId: null,
        packageId: params.packageId,
        creditsTotal: params.creditsToAdd,
        creditsRemaining: params.creditsToAdd,
        amountPaid: params.amountPaidMxn,
        stripeSessionId: params.stripeSessionId || null,
        expiresAt,
      },
    });
    await prisma.user.update({
      where: { id: params.userId },
      data: { tipsCreditsBalance: { increment: params.creditsToAdd } },
    });
    return purchase;
  }
}
