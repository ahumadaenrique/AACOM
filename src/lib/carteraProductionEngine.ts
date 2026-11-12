import { prisma } from "@/lib/prisma";
import {
  CanonicalSubRamoKey,
  ClassifiedPolicyRamo,
  RamoGroupKey,
  RAMO_GROUPS,
  SUB_RAMOS_CATALOG,
  VIDA_OBJETIVOS_CATALOG,
  VidaObjetivoKey,
  BusinessScope,
  canonicalCompanyName,
  classifyPolicyRamo,
  normalizeCompanyKey,
  toYmdKey,
} from "./ramosCatalog";

export interface CarteraProductionParams {
  agencyId: string;
  startYmd: string;
  endYmd: string;
  businessScope?: BusinessScope;
  allowedSubRamos?: CanonicalSubRamoKey[];
  ramoGroupFilter?: RamoGroupKey | "ALL";
  subRamoFilter?: CanonicalSubRamoKey | "ALL";
  vidaObjetivoFilter?: VidaObjetivoKey | "ALL";
  onlyAdminApproved?: boolean;
  filterAgentId?: string;
  filterCompanyKey?: string;
}

export interface AgentProductionEntry {
  agentId: string;
  totalPE: number;
  totalPPC: number;
  policyCount: number;
  emittedCount: number;
  paidReceiptsCount: number;
  sharedPoliciesCount: number;
  byCompany: Record<
    string,
    {
      companyName: string;
      totalPE: number;
      totalPPC: number;
      count: number;
    }
  >;
}

export interface BreakdownBucket {
  key: string;
  label: string;
  groupKey?: RamoGroupKey;
  count: number;
  totalPE: number;
  totalPPC: number;
}

export interface CarteraLedgerRow {
  policyId: string;
  clientId: string | null;
  policyNumber: string;
  clientName: string;
  insuranceCompany: string;
  canonicalCompany: string;
  companyKey: string;
  product: string | null;
  ramoInfo: ClassifiedPolicyRamo;
  paymentMethod: string | null;
  currency: string;
  annualPremium: number;
  effectiveDate: string | null;
  peInPeriod: number;
  ppcInPeriod: number;
  paidReceiptsInPeriod: number;
  isEmittedInPeriod: boolean;
  isRenewalCapture: boolean;
  adminApproved: boolean;
  status: string;
  subStatus: string | null;
  ownerAgentId: string;
  ownerAgentName: string;
  sharedWithUserId: string | null;
  sharedWithAgentName: string | null;
  sharedPercentage: number;
  observations: string | null;
  receipts: Array<{
    id: string;
    receiptNumber: number;
    totalInstallments: number;
    policyYear: number;
    dueDate: string | null;
    amount: number;
    paidAmount: number | null;
    status: string;
    paidAt: string | null;
    paymentNotes: string | null;
    adminApproved: boolean;
  }>;
}

export interface CarteraProductionResult {
  totals: {
    totalPE: number;
    totalPPC: number;
    uniquePoliciesCount: number;
    emittedPoliciesCount: number;
    paidReceiptsCount: number;
    pendingApprovalCount: number;
  };
  byAgent: Map<string, AgentProductionEntry>;
  byCompany: Array<{
    companyKey: string;
    companyName: string;
    totalPE: number;
    totalPPC: number;
    count: number;
  }>;
  byRamoGroup: BreakdownBucket[];
  bySubRamo: BreakdownBucket[];
  byVidaObjetivo: BreakdownBucket[];
  ledgerRows: CarteraLedgerRow[];
}

function getAnniversaryYmdInYear(effYmd: string, targetYear: number): string | null {
  const parts = effYmd.split("-");
  if (parts.length !== 3) return null;
  const effYear = parseInt(parts[0], 10);
  if (isNaN(effYear) || targetYear <= effYear) return null;
  const month = parts[1];
  let dayNum = parseInt(parts[2], 10);
  if (month === "02" && dayNum === 29) {
    const isLeap = (targetYear % 4 === 0 && targetYear % 100 !== 0) || targetYear % 400 === 0;
    if (!isLeap) dayNum = 28;
  }
  return `${targetYear}-${month}-${String(dayNum).padStart(2, "0")}`;
}

export async function computeAgencyCarteraProduction(
  params: CarteraProductionParams
): Promise<CarteraProductionResult> {
  const {
    agencyId,
    startYmd,
    endYmd,
    businessScope = "NUEVA",
    allowedSubRamos,
    ramoGroupFilter = "ALL",
    subRamoFilter = "ALL",
    vidaObjetivoFilter = "ALL",
    onlyAdminApproved = false,
    filterAgentId,
    filterCompanyKey,
  } = params;

  if (!agencyId || agencyId === "ALL") {
    throw new Error("El motor de producción requiere un agencyId específico.");
  }

  const normalizedFilterCompanyKey =
    filterCompanyKey && filterCompanyKey !== "ALL"
      ? normalizeCompanyKey(canonicalCompanyName(filterCompanyKey))
      : null;

  const allowedSet =
    allowedSubRamos && allowedSubRamos.length > 0 ? new Set(allowedSubRamos) : null;

  const policies = await prisma.policy.findMany({
    where: {
      isArchived: false,
      deletedAt: null,
      OR: [
        { agencyId },
        { agencyId: null, user: { agencyId } },
      ],
    },
    include: {
      client: { select: { id: true, name: true } },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          agencyId: true,
          active: true,
        },
      },
      sharedWithUser: {
        select: {
          id: true,
          name: true,
          email: true,
          agencyId: true,
          active: true,
        },
      },
      receipts: {
        orderBy: [{ policyYear: "asc" }, { receiptNumber: "asc" }],
      },
    },
  });

  const byAgent = new Map<string, AgentProductionEntry>();
  const companyMap = new Map<
    string,
    { companyKey: string; companyName: string; totalPE: number; totalPPC: number; policyIds: Set<string> }
  >();

  // Ramo buckets (populated before ramo/subRamo/vidaObjetivo filter when only period/agent/company apply,
  // or accurately reflecting active scope + agent + company so UI cards remain interactive)
  const ramoGroupStats = new Map<RamoGroupKey, { count: Set<string>; pe: number; ppc: number }>();
  for (const g of RAMO_GROUPS) {
    ramoGroupStats.set(g.key, { count: new Set(), pe: 0, ppc: 0 });
  }

  const subRamoStats = new Map<CanonicalSubRamoKey, { count: Set<string>; pe: number; ppc: number }>();
  for (const sr of SUB_RAMOS_CATALOG) {
    subRamoStats.set(sr.key, { count: new Set(), pe: 0, ppc: 0 });
  }

  const vidaObjStats = new Map<VidaObjetivoKey, { count: Set<string>; pe: number; ppc: number }>();
  for (const vo of VIDA_OBJETIVOS_CATALOG) {
    vidaObjStats.set(vo.key, { count: new Set(), pe: 0, ppc: 0 });
  }

  const activePolicySet = new Set<string>();
  const emittedPolicySet = new Set<string>();
  let totalPE = 0;
  let totalPPC = 0;
  let paidReceiptsCount = 0;
  let pendingApprovalCount = 0;

  const ledgerRows: CarteraLedgerRow[] = [];

  const startYear = parseInt(startYmd.slice(0, 4), 10) || new Date().getUTCFullYear();
  const endYear = parseInt(endYmd.slice(0, 4), 10) || startYear;

  const ensureAgentEntry = (agentId: string): AgentProductionEntry => {
    let entry = byAgent.get(agentId);
    if (!entry) {
      entry = {
        agentId,
        totalPE: 0,
        totalPPC: 0,
        policyCount: 0,
        emittedCount: 0,
        paidReceiptsCount: 0,
        sharedPoliciesCount: 0,
        byCompany: {},
      };
      byAgent.set(agentId, entry);
    }
    return entry;
  };

  for (const p of policies) {
    const isCancelledOrNTU =
      p.status === "CANCELADA" || p.subStatus === "NO_TOMADA";

    const ramoInfo = classifyPolicyRamo(p);

    // Agency allowed sub-ramos rule (e.g. from Ranking configuration)
    if (allowedSet && !allowedSet.has(ramoInfo.subRamoKey)) {
      continue;
    }

    const canonComp = canonicalCompanyName(p.insuranceCompany || "Sin Aseguradora") || "Sin Aseguradora";
    const compKey = normalizeCompanyKey(canonComp) || "sin aseguradora";

    if (normalizedFilterCompanyKey && compKey !== normalizedFilterCompanyKey) {
      continue;
    }

    // Build agent participation shares
    const shares: Array<{ agentId: string; weight: number; isSharedPartner: boolean }> = [];
    const hasValidCoAgent =
      Boolean(p.sharedWithUserId) &&
      p.sharedWithUserId !== p.userId &&
      (!p.sharedWithUser?.agencyId || p.sharedWithUser.agencyId === agencyId) &&
      Number(p.sharedPercentage) > 0 &&
      Number(p.sharedPercentage) <= 100;

    if (hasValidCoAgent && p.sharedWithUserId) {
      const coWeight = Math.min(100, Math.max(0, Number(p.sharedPercentage) || 0)) / 100;
      const primaryWeight = Number((1 - coWeight).toFixed(6));
      if (primaryWeight > 0) {
        shares.push({ agentId: p.userId, weight: primaryWeight, isSharedPartner: false });
      }
      if (coWeight > 0) {
        shares.push({ agentId: p.sharedWithUserId, weight: coWeight, isSharedPartner: true });
      }
    } else {
      shares.push({ agentId: p.userId, weight: 1, isSharedPartner: false });
    }

    const scopedShares =
      filterAgentId && filterAgentId !== "ALL"
        ? shares.filter((s) => s.agentId === filterAgentId)
        : shares;

    if (scopedShares.length === 0) {
      continue;
    }

    // Determine PE in period (MXN)
    const effYmd = toYmdKey(p.effectiveDate);
    const isPolicyMarkedRenewal = Boolean(p.isRenewalCapture) || p.subStatus === "RENOVACION";
    let isPeNewEvent = false;
    let isPeRenewalEvent = false;

    if (!isCancelledOrNTU && effYmd) {
      if (!isPolicyMarkedRenewal && effYmd >= startYmd && effYmd <= endYmd) {
        isPeNewEvent = true;
      } else if (isPolicyMarkedRenewal && effYmd >= startYmd && effYmd <= endYmd) {
        isPeRenewalEvent = true;
      } else if (
        p.tipoVigencia === "ANUAL_RENOVABLE" &&
        p.status !== "TERMINADA" &&
        effYmd < startYmd
      ) {
        for (let y = startYear; y <= endYear; y++) {
          const annivYmd = getAnniversaryYmdInYear(effYmd, y);
          if (annivYmd && annivYmd >= startYmd && annivYmd <= endYmd) {
            isPeRenewalEvent = true;
            break;
          }
        }
      }
    }

    const peQualifies =
      (businessScope === "NUEVA" && isPeNewEvent) ||
      (businessScope === "RENOVACION" && isPeRenewalEvent) ||
      (businessScope === "AMBAS" && (isPeNewEvent || isPeRenewalEvent));

    const policyAnnualMXN = Number(p.annualPremium) || 0;
    const rawPeForPolicy = peQualifies ? policyAnnualMXN : 0;

    // Determine PPC in period from PAGADO receipts (MXN)
    let rawPpcForPolicy = 0;
    let policyPaidReceiptsInPeriod = 0;

    for (const r of p.receipts || []) {
      if (r.status !== "PAGADO") continue;
      if (onlyAdminApproved && (p.adminApproved === false || r.adminApproved === false)) {
        continue;
      }
      const paidYmd = toYmdKey(r.paidAt || r.dueDate);
      if (!paidYmd || paidYmd < startYmd || paidYmd > endYmd) continue;

      const isRenewalReceipt =
        (r.policyYear || 1) >= 2 || isPolicyMarkedRenewal;

      const receiptQualifies =
        (businessScope === "NUEVA" && !isRenewalReceipt) ||
        (businessScope === "RENOVACION" && isRenewalReceipt) ||
        businessScope === "AMBAS";

      if (!receiptQualifies) continue;

      const receiptMXN = Number(r.paidAmount ?? r.amount) || 0;
      rawPpcForPolicy += receiptMXN;
      policyPaidReceiptsInPeriod += 1;
    }

    // Track pending approval items that would have contributed in this range
    if (!p.adminApproved && (rawPeForPolicy > 0 || (p.receipts || []).some((r) => {
      if (r.status !== "PAGADO") return false;
      const py = toYmdKey(r.paidAt || r.dueDate);
      return Boolean(py && py >= startYmd && py <= endYmd);
    }))) {
      pendingApprovalCount += 1;
    }

    if (onlyAdminApproved && p.adminApproved === false) {
      continue;
    }

    const totalShareWeightInFilter = scopedShares.reduce((sum, s) => sum + s.weight, 0);
    const weightedPeTotal = Number((rawPeForPolicy * totalShareWeightInFilter).toFixed(2));
    const weightedPpcTotal = Number((rawPpcForPolicy * totalShareWeightInFilter).toFixed(2));

    const hasActivity = weightedPeTotal > 0 || weightedPpcTotal > 0 || (peQualifies && rawPeForPolicy > 0);
    if (!hasActivity) {
      continue;
    }

    // Update interactive Ramo breakdowns BEFORE applying the Ramo visual filter cards,
    // so clicking a Ramo card filters the matrix without zeroing out the sibling Ramo cards!
    const gBucket = ramoGroupStats.get(ramoInfo.groupKey);
    if (gBucket) {
      gBucket.count.add(p.id);
      gBucket.pe += weightedPeTotal;
      gBucket.ppc += weightedPpcTotal;
    }
    const srBucket = subRamoStats.get(ramoInfo.subRamoKey);
    if (srBucket) {
      srBucket.count.add(p.id);
      srBucket.pe += weightedPeTotal;
      srBucket.ppc += weightedPpcTotal;
    }
    if (ramoInfo.subRamoKey === "VIDA_INDIVIDUAL" && ramoInfo.vidaObjetivo) {
      const voBucket = vidaObjStats.get(ramoInfo.vidaObjetivo);
      if (voBucket) {
        voBucket.count.add(p.id);
        voBucket.pe += weightedPeTotal;
        voBucket.ppc += weightedPpcTotal;
      }
    }

    // Apply Ramo / Sub-Ramo / Vida Objetivo UI Filters for Totals, Agents Matrix, Companies and Ledger
    if (ramoGroupFilter !== "ALL" && ramoInfo.groupKey !== ramoGroupFilter) {
      continue;
    }
    if (subRamoFilter !== "ALL" && ramoInfo.subRamoKey !== subRamoFilter) {
      continue;
    }
    if (vidaObjetivoFilter !== "ALL" && ramoInfo.vidaObjetivo !== vidaObjetivoFilter) {
      continue;
    }

    activePolicySet.add(p.id);
    if (weightedPeTotal > 0) emittedPolicySet.add(p.id);
    totalPE += weightedPeTotal;
    totalPPC += weightedPpcTotal;
    paidReceiptsCount += policyPaidReceiptsInPeriod;

    // Aggregate per Company
    let compEntry = companyMap.get(compKey);
    if (!compEntry) {
      compEntry = {
        companyKey: compKey,
        companyName: canonComp,
        totalPE: 0,
        totalPPC: 0,
        policyIds: new Set(),
      };
      companyMap.set(compKey, compEntry);
    }
    compEntry.totalPE += weightedPeTotal;
    compEntry.totalPPC += weightedPpcTotal;
    compEntry.policyIds.add(p.id);

    // Aggregate per Agent (respecting co-agent split weights)
    for (const share of scopedShares) {
      const aEntry = ensureAgentEntry(share.agentId);
      const pePart = rawPeForPolicy * share.weight;
      const ppcPart = rawPpcForPolicy * share.weight;

      aEntry.totalPE += pePart;
      aEntry.totalPPC += ppcPart;
      aEntry.policyCount += 1;
      if (pePart > 0) aEntry.emittedCount += 1;
      if (policyPaidReceiptsInPeriod > 0) {
        aEntry.paidReceiptsCount += policyPaidReceiptsInPeriod;
      }
      if (hasValidCoAgent) {
        aEntry.sharedPoliciesCount += 1;
      }

      if (!aEntry.byCompany[compKey]) {
        aEntry.byCompany[compKey] = {
          companyName: canonComp,
          totalPE: 0,
          totalPPC: 0,
          count: 0,
        };
      }
      aEntry.byCompany[compKey].totalPE += pePart;
      aEntry.byCompany[compKey].totalPPC += ppcPart;
      aEntry.byCompany[compKey].count += share.weight;
    }

    ledgerRows.push({
      policyId: p.id,
      clientId: p.clientId || null,
      policyNumber: p.policyNumber,
      clientName: p.contractor || p.insured || p.client?.name || "Sin Cliente",
      insuranceCompany: p.insuranceCompany || "Sin Aseguradora",
      canonicalCompany: canonComp,
      companyKey: compKey,
      product: p.product || null,
      ramoInfo,
      paymentMethod: p.paymentMethod || null,
      currency: p.currency || "MXN",
      annualPremium: policyAnnualMXN,
      effectiveDate: effYmd,
      peInPeriod: weightedPeTotal,
      ppcInPeriod: weightedPpcTotal,
      paidReceiptsInPeriod: policyPaidReceiptsInPeriod,
      isEmittedInPeriod: peQualifies && rawPeForPolicy > 0,
      isRenewalCapture: isPolicyMarkedRenewal,
      adminApproved: p.adminApproved !== false,
      status: p.status,
      subStatus: p.subStatus || null,
      ownerAgentId: p.userId,
      ownerAgentName: p.user?.name || p.user?.email || "Agente",
      sharedWithUserId: hasValidCoAgent ? p.sharedWithUserId || null : null,
      sharedWithAgentName: hasValidCoAgent
        ? p.sharedWithUser?.name || p.sharedWithUser?.email || null
        : null,
      sharedPercentage: hasValidCoAgent ? Number(p.sharedPercentage) || 0 : 0,
      observations: p.observations || null,
      receipts: (p.receipts || []).map((r) => ({
        id: r.id,
        receiptNumber: r.receiptNumber,
        totalInstallments: r.totalInstallments,
        policyYear: r.policyYear,
        dueDate: toYmdKey(r.dueDate),
        amount: Number(r.amount) || 0,
        paidAmount: r.paidAmount !== null && r.paidAmount !== undefined ? Number(r.paidAmount) : null,
        status: r.status,
        paidAt: toYmdKey(r.paidAt),
        paymentNotes: r.paymentNotes || null,
        adminApproved: r.adminApproved !== false,
      })),
    });
  }

  ledgerRows.sort((a, b) => {
    const dateA = a.effectiveDate || "";
    const dateB = b.effectiveDate || "";
    if (dateB !== dateA) return dateB.localeCompare(dateA);
    return b.peInPeriod + b.ppcInPeriod - (a.peInPeriod + a.ppcInPeriod);
  });

  return {
    totals: {
      totalPE: Number(totalPE.toFixed(2)),
      totalPPC: Number(totalPPC.toFixed(2)),
      uniquePoliciesCount: activePolicySet.size,
      emittedPoliciesCount: emittedPolicySet.size,
      paidReceiptsCount,
      pendingApprovalCount,
    },
    byAgent,
    byCompany: Array.from(companyMap.values())
      .map((c) => ({
        companyKey: c.companyKey,
        companyName: c.companyName,
        totalPE: Number(c.totalPE.toFixed(2)),
        totalPPC: Number(c.totalPPC.toFixed(2)),
        count: c.policyIds.size,
      }))
      .sort((a, b) => b.totalPE + b.totalPPC - (a.totalPE + a.totalPPC)),
    byRamoGroup: RAMO_GROUPS.map((g) => {
      const st = ramoGroupStats.get(g.key)!;
      return {
        key: g.key,
        label: g.label,
        groupKey: g.key,
        count: st.count.size,
        totalPE: Number(st.pe.toFixed(2)),
        totalPPC: Number(st.ppc.toFixed(2)),
      };
    }),
    bySubRamo: SUB_RAMOS_CATALOG.map((sr) => {
      const st = subRamoStats.get(sr.key)!;
      return {
        key: sr.key,
        label: sr.label,
        groupKey: sr.groupKey,
        count: st.count.size,
        totalPE: Number(st.pe.toFixed(2)),
        totalPPC: Number(st.ppc.toFixed(2)),
      };
    }),
    byVidaObjetivo: VIDA_OBJETIVOS_CATALOG.map((vo) => {
      const st = vidaObjStats.get(vo.key)!;
      return {
        key: vo.key,
        label: vo.label,
        groupKey: "VIDA" as RamoGroupKey,
        count: st.count.size,
        totalPE: Number(st.pe.toFixed(2)),
        totalPPC: Number(st.ppc.toFixed(2)),
      };
    }),
    ledgerRows,
  };
}
