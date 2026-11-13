import crypto from "crypto";
import { addDays, addMonths, differenceInCalendarDays } from "date-fns";
import { prisma } from "@/lib/prisma";
import {
  buildPolicyReceiptsDrafts,
  toCalendarDateLocal,
  toDateInputValue,
  toUTCNoonDate,
} from "@/app/(dashboard)/cartera/dateUtils";
import {
  canonicalCompanyName,
  normalizeCompanyKey,
  resolveImportedRowRamo,
  toYmdKey,
} from "@/lib/ramosCatalog";

export const LOCKED_AGENCY_SLUG = "aacom";

export const GROKBOT_SETTING_KEYS = {
  KEY_SHA256: "grokbot_ingest_key_sha256_aacom",
  KEY_HINT: "grokbot_ingest_key_hint_aacom",
  PAUSED: "grokbot_ingest_paused_aacom",
} as const;

export type InsurerKey = "INSIGNIA" | "LATINO";
export type ItemType = "INSIGNIA_RECEIPT" | "LATINO_EMISSION" | "LATINO_RECEIPT";

export interface RollbackLedger {
  originalExternalKey: string;
  createdClientId?: string | null;
  updatedClientSnapshot?: { id: string; name: string } | null;
  createdPolicyId?: string | null;
  updatedPolicySnapshot?: {
    id: string;
    annualPremium: number | null;
    paymentMethod: string | null;
    contractor: string | null;
    effectiveDate: string | null;
    renewalDate: string | null;
    sharedWithUserId: string | null;
    sharedPercentage: number | null;
  } | null;
  createdPendingReceiptIds?: string[];
  replacedUnpaidReceipts?: Array<{
    receiptNumber: number;
    totalInstallments: number;
    policyYear: number;
    dueDate: string;
    graceEndDate: string;
    amount: number;
    status: string;
  }>;
  createdReceiptId?: string | null;
  updatedReceiptSnapshot?: {
    id: string;
    status: string;
    paidAt: string | null;
    paidAmount: number | null;
    amount: number;
    paymentNotes: string | null;
    syncedEmissionId: string | null;
  } | null;
  createdEmissionIds: string[];
  updatedEmissionSnapshots?: Array<{
    id: string;
    primaEmitida: number;
    primaPagada: number;
    status: string;
    notes: string | null;
  }>;
}

export interface AgentShareSpec {
  externalCode: string;
  externalName: string | null;
  amountMxn: number;
  mappedUserId: string | null;
}

export interface NormalizedGrokbotItem {
  externalKey: string;
  insurerKey: InsurerKey;
  insurerCanonicalName: "Insignia Life" | "La Latinoamericana Seguros";
  itemType: ItemType;
  policyNumber: string;
  receiptRef: string | null;
  clientName: string;
  insuredName: string;
  product: string;
  ramoHint: string | null;
  subRamoHint: string | null;
  tipoVigenciaOverride: string | null;
  paymentMethod: string;
  totalInstallments: number;
  policyYear: number;
  receiptNumber: number;
  isExtraContribution: boolean;
  isRenewalCapture: boolean;
  amountMxn: number;
  annualPremiumEstimateMxn: number;
  effectiveYmd: string;
  renewalYmd: string | null;
  eventDateStr: string;
  dueDateStr: string;
  agentShares: AgentShareSpec[];
  externalAgentCode: string;
  externalAgentName: string | null;
  secondaryAgentCode: string | null;
  skipReason?: string;
  quarantineReason?: string;
  rawPayload: any;
}

export interface RunGrokbotIngestResult {
  ok: boolean;
  dryRun: boolean;
  agencyId: string;
  batchId: string | null;
  batchDateStr: string;
  source: "INSIGNIA" | "LATINO" | "COMBINED";
  status: string;
  counts: {
    parsed: number;
    applied: number;
    quarantined: number;
    skipped: number;
    skippedDuplicates: number;
    skippedCompensated: number;
  };
  totalAppliedMxn: number;
  unmappedAgents: Array<{
    insurerKey: InsurerKey;
    externalAgentCode: string;
    externalAgentName: string | null;
    itemsCount: number;
  }>;
  quarantinedHighlights: Array<{
    externalKey: string;
    policyNumber: string;
    reason: string;
    amountMxn: number;
    externalAgentCode: string;
  }>;
  appliedSamples: Array<{
    externalKey: string;
    itemType: ItemType;
    policyNumber: string;
    amountMxn: number;
    eventDateStr: string;
  }>;
}

// =========================================================================
// UTILIDADES GENERALES Y SEGURIDAD
// =========================================================================

export function getCdmxTodayYmd(now = new Date()): string {
  return now.toLocaleDateString("en-CA", {
    timeZone: "America/Mexico_City",
  });
}

export function cleanPersonName(raw: unknown, fallback = ""): string {
  const s = String(raw ?? "")
    .replace(/\s+/g, " ")
    .trim();
  return s || fallback;
}

function normalizeNameTokens(raw: string | null | undefined): string[] {
  return String(raw || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 2)
    .sort();
}

export async function resolveLockedAacomAgency() {
  const agency = await prisma.agency.findFirst({
    where: {
      OR: [{ slug: LOCKED_AGENCY_SLUG }, { id: LOCKED_AGENCY_SLUG }],
      active: true,
    },
    select: { id: true, name: true, slug: true },
  });
  if (!agency) {
    throw new Error("No se encontró la agencia titular activa para el puente Grokbot.");
  }
  return agency;
}

export async function getGrokbotBridgeSecurityState() {
  const keys = await prisma.setting.findMany({
    where: {
      key: {
        in: [
          GROKBOT_SETTING_KEYS.KEY_SHA256,
          GROKBOT_SETTING_KEYS.KEY_HINT,
          GROKBOT_SETTING_KEYS.PAUSED,
        ],
      },
    },
  });
  const map = new Map(keys.map((k) => [k.key, k.value]));
  const envKey = process.env.GROKBOT_INGEST_API_KEY?.trim() || "";
  const dbHash = map.get(GROKBOT_SETTING_KEYS.KEY_SHA256)?.trim() || "";
  return {
    hasEnvKey: envKey.length >= 32,
    hasDbKey: dbHash.length === 64,
    keyHint: map.get(GROKBOT_SETTING_KEYS.KEY_HINT) || null,
    isPaused: map.get(GROKBOT_SETTING_KEYS.PAUSED) === "true",
    envKey,
    dbHash,
  };
}

export async function verifyGrokbotIngestToken(
  providedToken: string | null | undefined
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const state = await getGrokbotBridgeSecurityState();

  if (state.isPaused) {
    return {
      ok: false,
      status: 423,
      error: "El puente de ingesta Grokbot está pausado temporalmente por el administrador.",
    };
  }

  if (!state.hasEnvKey && !state.hasDbKey) {
    return {
      ok: false,
      status: 503,
      error: "No hay API Key de ingesta configurada para Grokbot en aacomsoft.",
    };
  }

  const token = (providedToken || "").trim();
  if (!token) {
    return {
      ok: false,
      status: 401,
      error: "No autorizado. Envía Authorization: Bearer <API_KEY> o header x-api-key.",
    };
  }

  const providedDigest = crypto.createHash("sha256").update(token, "utf8").digest();

  if (state.hasEnvKey) {
    const envDigest = crypto.createHash("sha256").update(state.envKey, "utf8").digest();
    if (crypto.timingSafeEqual(envDigest, providedDigest)) {
      return { ok: true };
    }
  }

  if (state.hasDbKey) {
    const storedDigest = Buffer.from(state.dbHash, "hex");
    if (
      storedDigest.length === providedDigest.length &&
      crypto.timingSafeEqual(storedDigest, providedDigest)
    ) {
      return { ok: true };
    }
  }

  return {
    ok: false,
    status: 401,
    error: "Credencial de ingesta Grokbot inválida.",
  };
}

// =========================================================================
// MAPEO DE AGENTES (AUTO-EMPAREJAMIENTO ÚNICO SIN AMBIGÜEDADES)
// =========================================================================

async function ensureAgentMaps(
  agencyId: string,
  candidates: Array<{
    insurerKey: InsurerKey;
    externalAgentCode: string;
    externalAgentName: string | null;
  }>
): Promise<Map<string, string | null>> {
  const existingMaps = await prisma.grokbotAgentMap.findMany({
    where: { agencyId },
  });
  const mapByKey = new Map<string, string | null>();
  const seenKeySet = new Set<string>();

  for (const m of existingMaps) {
    const k = `${m.insurerKey}:${m.externalAgentCode}`;
    mapByKey.set(k, m.userId || null);
    seenKeySet.add(k);
  }

  const missing: Array<{
    insurerKey: InsurerKey;
    externalAgentCode: string;
    externalAgentName: string | null;
  }> = [];

  for (const c of candidates) {
    const code = c.externalAgentCode.trim();
    if (!code) continue;
    const k = `${c.insurerKey}:${code}`;
    if (!seenKeySet.has(k)) {
      seenKeySet.add(k);
      missing.push({
        insurerKey: c.insurerKey,
        externalAgentCode: code,
        externalAgentName: c.externalAgentName,
      });
    }
  }

  if (missing.length > 0) {
    const agencyUsers = await prisma.user.findMany({
      where: {
        agencyId,
        active: true,
        role: { in: ["AGENTE", "AGENTE_LITE", "ADMIN", "SUPER_ADMIN"] },
      },
      select: { id: true, name: true },
    });

    const userTokenIndex = agencyUsers.map((u) => ({
      id: u.id,
      tokens: normalizeNameTokens(u.name),
    }));

    for (const m of missing) {
      const extTokens = normalizeNameTokens(m.externalAgentName);
      let matchedUserId: string | null = null;
      let autoMatched = false;

      if (extTokens.length >= 2) {
        const extSet = new Set(extTokens);
        const exactMatches = userTokenIndex.filter((u) => {
          if (u.tokens.length < 2) return false;
          const uSet = new Set(u.tokens);
          if (uSet.size !== extSet.size) return false;
          return Array.from(uSet).every((t) => extSet.has(t));
        });
        if (exactMatches.length === 1) {
          matchedUserId = exactMatches[0].id;
          autoMatched = true;
        }
      }

      const mapKey = `${m.insurerKey}:${m.externalAgentCode}`;
      try {
        await prisma.grokbotAgentMap.create({
          data: {
            agencyId,
            insurerKey: m.insurerKey,
            externalAgentCode: m.externalAgentCode,
            externalAgentName: m.externalAgentName,
            userId: matchedUserId,
            autoMatched,
          },
        });
        mapByKey.set(mapKey, matchedUserId);
      } catch {
        // Concurrent request may have created it; re-read safely
        const found = await prisma.grokbotAgentMap.findUnique({
          where: {
            agencyId_insurerKey_externalAgentCode: {
              agencyId,
              insurerKey: m.insurerKey,
              externalAgentCode: m.externalAgentCode,
            },
          },
        });
        mapByKey.set(mapKey, found?.userId || null);
      }
    }
  }

  return mapByKey;
}

// =========================================================================
// PARSEADORES DETERMINISTAS (INSIGNIA LIFE & LA LATINOAMERICANA SEGUROS)
// =========================================================================

function parseYmdStrict(input: unknown, fallbackYmd: string): string {
  const s = String(input ?? "").trim();
  if (!s) return fallbackYmd;
  const d = toUTCNoonDate(s);
  if (!d) return fallbackYmd;
  return toDateInputValue(d) || fallbackYmd;
}

function parseInsigniaConsecutivo(raw: unknown): {
  receiptNumber: number;
  totalInstallments: number;
} {
  const str = String(raw ?? "").trim();
  const match = str.match(/^(\d+)\s*de\s*(\d+)$/i);
  if (match) {
    return {
      receiptNumber: parseInt(match[1], 10) || 0,
      totalInstallments: Math.max(1, parseInt(match[2], 10) || 1),
    };
  }
  return { receiptNumber: 0, totalInstallments: 1 };
}

function mapInsigniaPaymentMethod(rawFormaPago: unknown, parsedTotalInst: number): {
  paymentMethod: string;
  totalInstallments: number;
} {
  const raw = String(rawFormaPago ?? "").trim().toUpperCase();
  if (raw.includes("MENSUAL")) return { paymentMethod: "Mensual", totalInstallments: 12 };
  if (raw.includes("TRIMESTRAL")) return { paymentMethod: "Trimestral", totalInstallments: 4 };
  if (raw.includes("SEMESTRAL")) return { paymentMethod: "Semestral", totalInstallments: 2 };
  if (raw.includes("ANUAL") || raw === "AGENTE" || raw === "CONTADO") {
    return { paymentMethod: "Anual", totalInstallments: 1 };
  }
  if (parsedTotalInst === 12) return { paymentMethod: "Mensual", totalInstallments: 12 };
  if (parsedTotalInst === 4) return { paymentMethod: "Trimestral", totalInstallments: 4 };
  if (parsedTotalInst === 2) return { paymentMethod: "Semestral", totalInstallments: 2 };
  return { paymentMethod: "Anual", totalInstallments: 1 };
}

function mapInsigniaRamoHint(ramoAgrupador: unknown, ramoText: unknown, product: unknown) {
  const agr = String(ramoAgrupador ?? "").trim().toUpperCase();
  if (agr === "VG") return { ramoHint: "VIDA_GRUPO", subRamoHint: "GRUPO" };
  const txt = `${String(ramoText || "")} ${String(product || "")}`.toLowerCase();
  if (txt.includes("retiro") || txt.includes("ppr")) {
    return { ramoHint: "RETIRO", subRamoHint: "INDIVIDUAL" };
  }
  if (txt.includes("educa")) return { ramoHint: "EDUCACION", subRamoHint: "INDIVIDUAL" };
  return { ramoHint: "VIDA_INDIVIDUAL", subRamoHint: "INDIVIDUAL" };
}

function extractInsigniaArray(rawInput: any): any[] {
  if (!rawInput) return [];
  if (Array.isArray(rawInput)) return rawInput;
  if (Array.isArray(rawInput.items)) return rawInput.items;
  if (Array.isArray(rawInput.primas)) return rawInput.primas;
  if (Array.isArray(rawInput.data)) return rawInput.data;
  return [];
}

function parseInsigniaPayload(rawInput: any, todayYmd: string): NormalizedGrokbotItem[] {
  const rows = extractInsigniaArray(rawInput);
  if (rows.length === 0) return [];

  // Agrupar por (numeroPoliza, idRecibo) para manejar co-agentes y cancelaciones/re-aplicaciones
  const groups = new Map<string, any[]>();
  for (const r of rows) {
    const pol = String(r?.numeroPoliza ?? "").trim();
    const recId = String(r?.idRecibo ?? r?.recibo ?? "").trim();
    if (!pol || !recId) continue;
    const key = `${pol}::${recId}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(r);
  }

  const out: NormalizedGrokbotItem[] = [];

  for (const [, groupRows] of Array.from(groups.entries())) {
    const positiveRows = groupRows.filter((r) => Number(r?.primaTotalRecibo || 0) > 0);
    const rep = positiveRows[0] || groupRows[0];

    const pol = String(rep.numeroPoliza).trim();
    const idRecibo = String(rep.idRecibo ?? rep.recibo).trim();
    const externalKey = `INSIGNIA:${pol}:${idRecibo}`;

    // Consolidar monto neto por agente (absorbe +X / -X / +X contables del mismo agente)
    const perAgent = new Map<
      string,
      { code: string; name: string | null; netMxn: number; latestDateRaw: string }
    >();

    for (const r of groupRows) {
      const code = String(r?.idAgente ?? "").trim() || "UNKNOWN";
      const name = cleanPersonName(r?.nomAgente) || null;
      const amt = Number(r?.primaTotalRecibo ?? r?.primaBaseCmptMn ?? 0) || 0;
      const prev = perAgent.get(code) || {
        code,
        name,
        netMxn: 0,
        latestDateRaw: String(r?.fechaContableRecibo || ""),
      };
      prev.netMxn = Number((prev.netMxn + amt).toFixed(2));
      if (amt > 0 && r?.fechaContableRecibo) {
        prev.latestDateRaw = String(r.fechaContableRecibo);
      }
      if (!prev.name && name) prev.name = name;
      perAgent.set(code, prev);
    }

    const activeAgents = Array.from(perAgent.values()).filter((a) => Math.abs(a.netMxn) >= 0.01);
    const groupTotalMxn = Number(
      Array.from(perAgent.values())
        .reduce((s, a) => s + a.netMxn, 0)
        .toFixed(2)
    );

    const parsedCons = parseInsigniaConsecutivo(rep.consecutivo);
    const pmInfo = mapInsigniaPaymentMethod(rep.formaPago, parsedCons.totalInstallments);
    const agr = String(rep.ramoAgrupador ?? "").trim().toUpperCase();
    const isExtraContribution = agr === "AE" || parsedCons.receiptNumber === 0;
    const isRenewalCapture = agr === "VIR";
    const policyYear = Math.max(1, parseInt(String(rep.anioPoliza || "1").trim(), 10) || 1);

    // AE ("0 DE 12" / "0 DE 0") recibe un consecutivo determinista único (>= 9000) para no chocar con @@unique
    const idDigits = parseInt(idRecibo.replace(/\D/g, "").slice(-4), 10) || 1;
    const receiptNumber = isExtraContribution
      ? 9000 + (idDigits % 999) + 1
      : parsedCons.receiptNumber;

    const effectiveYmd = parseYmdStrict(rep.inicioVigenciaPoliza, todayYmd);
    const renewalYmd = rep.terminoVigenciaPoliza
      ? parseYmdStrict(rep.terminoVigenciaPoliza, effectiveYmd)
      : null;
    const eventDateStr = parseYmdStrict(
      positiveRows[positiveRows.length - 1]?.fechaContableRecibo ?? rep.fechaContableRecibo,
      effectiveYmd
    );

    const clientName = cleanPersonName(rep.contratante, `Contratante Póliza ${pol}`);
    const insuredName = cleanPersonName(rep.asegurado, clientName);
    const product = cleanPersonName(rep.producto, "Insignia Life");
    const ramoMeta = mapInsigniaRamoHint(rep.ramoAgrupador, rep.ramo, product);

    const sortedPositiveAgents = [...activeAgents]
      .filter((a) => a.netMxn > 0)
      .sort((a, b) => b.netMxn - a.netMxn);

    const primaryAgent = sortedPositiveAgents[0] || Array.from(perAgent.values())[0];
    const secondaryAgent = sortedPositiveAgents[1] || null;

    let skipReason: string | undefined;
    let quarantineReason: string | undefined;

    if (Math.abs(groupTotalMxn) < 0.01) {
      skipReason = "COMPENSATED_ZERO_NET";
    } else if (groupTotalMxn < 0) {
      quarantineReason = "NEGATIVE_RECEIPT_ADJUSTMENT";
    } else if (groupTotalMxn > 10_000_000) {
      quarantineReason = "SANITY_LIMIT_EXCEEDED";
    } else if (sortedPositiveAgents.length > 2) {
      quarantineReason = "MULTI_AGENT_SPLIT_MANUAL";
    }

    const annualPremiumEstimateMxn = isExtraContribution
      ? 0
      : Number((Math.max(0, groupTotalMxn) * pmInfo.totalInstallments).toFixed(2));

    out.push({
      externalKey,
      insurerKey: "INSIGNIA",
      insurerCanonicalName: "Insignia Life",
      itemType: "INSIGNIA_RECEIPT",
      policyNumber: pol,
      receiptRef: idRecibo,
      clientName,
      insuredName,
      product,
      ramoHint: ramoMeta.ramoHint,
      subRamoHint: ramoMeta.subRamoHint,
      tipoVigenciaOverride: ramoMeta.ramoHint === "VIDA_GRUPO" ? "ANUAL_RENOVABLE" : "LARGO_PLAZO",
      paymentMethod: pmInfo.paymentMethod,
      totalInstallments: pmInfo.totalInstallments,
      policyYear,
      receiptNumber,
      isExtraContribution,
      isRenewalCapture,
      amountMxn: groupTotalMxn,
      annualPremiumEstimateMxn,
      effectiveYmd,
      renewalYmd,
      eventDateStr,
      dueDateStr: eventDateStr,
      agentShares: sortedPositiveAgents.map((a) => ({
        externalCode: a.code,
        externalName: a.name,
        amountMxn: a.netMxn,
        mappedUserId: null,
      })),
      externalAgentCode: primaryAgent?.code || "UNKNOWN",
      externalAgentName: primaryAgent?.name || null,
      secondaryAgentCode: secondaryAgent?.code || null,
      skipReason,
      quarantineReason,
      rawPayload: groupRows,
    });
  }

  return out;
}

function mapLatinoRamoHint(row: any): {
  ramoHint: string;
  subRamoHint: string;
  product: string;
} {
  const ramo = String(row?.ramopresupuesto ?? "").trim().toUpperCase();
  const sub = String(row?.subramopresupuesto ?? "").trim().toUpperCase();
  const indFlot = String(row?.inD_FLOT ?? "").trim().toUpperCase();

  if (ramo.includes("AUTO")) {
    const isFlotilla = sub.includes("FLOT") || indFlot === "F";
    return {
      ramoHint: isFlotilla ? "AUTOS_FLOTILLA" : "AUTOS_INDIVIDUAL",
      subRamoHint: isFlotilla ? "FLOTILLA" : "INDIVIDUAL",
      product: cleanPersonName(row?.subramopresupuesto, isFlotilla ? "Autos Flotilla" : "Autos"),
    };
  }
  if (ramo.includes("GASTOS MED") || sub.includes("MEDICA") || sub.includes("SALUD")) {
    const isColectivo = sub.includes("COLECTIV") || sub.includes("UMAS") || sub.includes("GRUPO");
    return {
      ramoHint: isColectivo ? "GMM_COLECTIVO" : "GMM_INDIVIDUAL",
      subRamoHint: isColectivo ? "COLECTIVO" : "INDIVIDUAL",
      product: cleanPersonName(row?.subramopresupuesto, "Gastos Médicos Mayores"),
    };
  }
  if (ramo.includes("ACCIDENTES")) {
    return {
      ramoHint: "OTROS",
      subRamoHint: "INDIVIDUAL",
      product: cleanPersonName(row?.subramopresupuesto, "Accidentes Personales"),
    };
  }
  return {
    ramoHint: ramo || "DANOS",
    subRamoHint: "INDIVIDUAL",
    product: cleanPersonName(row?.subramopresupuesto || row?.ramopresupuesto, "La Latinoamericana"),
  };
}

function mapLatinoPaymentMethod(rawFmaPago: unknown): {
  paymentMethod: string;
  totalInstallments: number;
} {
  const c = String(rawFmaPago ?? "").trim().toUpperCase();
  if (c === "M") return { paymentMethod: "Mensual", totalInstallments: 12 };
  if (c === "T" || c === "Q") return { paymentMethod: "Trimestral", totalInstallments: 4 };
  if (c === "S") return { paymentMethod: "Semestral", totalInstallments: 2 };
  return { paymentMethod: "Anual", totalInstallments: 1 };
}

function parseLatinoPayload(rawInput: any, todayYmd: string): NormalizedGrokbotItem[] {
  const reportes = rawInput?.reportes && typeof rawInput.reportes === "object"
    ? rawInput.reportes
    : rawInput;
  if (!reportes || typeof reportes !== "object") return [];

  const out: NormalizedGrokbotItem[] = [];

  // 1) EMISIONES (emitido_autos, emitido_personas, emitido_diversos) -> SIEMPRE PRIMERO
  for (const reportKey of ["emitido_autos", "emitido_personas", "emitido_diversos"]) {
    const repBlock = reportes[reportKey];
    const items: any[] = Array.isArray(repBlock?.items)
      ? repBlock.items
      : Array.isArray(repBlock)
      ? repBlock
      : [];
    if (items.length === 0) continue;

    // Agrupar por (poliza, viG_DESDE) para consolidar flotillas/coberturas/cancelaciones
    const groups = new Map<string, any[]>();
    for (const row of items) {
      const pol = String(row?.poliza ?? "").trim();
      if (!pol) continue;
      const vigDesde = parseYmdStrict(row?.viG_DESDE, todayYmd);
      const gk = `${pol}::${vigDesde}`;
      if (!groups.has(gk)) groups.set(gk, []);
      groups.get(gk)!.push(row);
    }

    for (const [gk, rows] of Array.from(groups.entries())) {
      const [pol, vigDesdeYmd] = gk.split("::");
      const netMxn = Number(
        rows.reduce((s, r) => s + (Number(r?.primA_NETA) || 0), 0).toFixed(2)
      );

      // Elegir la fila con prima positiva más grande (ej. "MEDICA LATINO 360" sobre "ASISTENCIA MEDICA")
      const positiveRows = rows.filter((r) => Number(r?.primA_NETA || 0) > 0);
      positiveRows.sort((a, b) => (Number(b?.primA_NETA) || 0) - (Number(a?.primA_NETA) || 0));
      const rep = positiveRows[0] || rows[0];

      const vigHastaYmd = rep?.viG_HASTA
        ? parseYmdStrict(rep.viG_HASTA, vigDesdeYmd)
        : null;
      const eventDateStr = parseYmdStrict(rep?.f_CTBLE, vigDesdeYmd);
      const agentCode = String(rep?.agte ?? "").trim() || "UNKNOWN";
      const agentName = cleanPersonName(rep?.nomprod) || null;
      const ramoMeta = mapLatinoRamoHint(rep);
      const isRenewalCapture = String(rep?.inI_REN ?? "").trim().toUpperCase() === "R";

      let skipReason: string | undefined;
      let quarantineReason: string | undefined;
      if (Math.abs(netMxn) < 0.01) {
        skipReason = "COMPENSATED_ZERO_NET";
      } else if (netMxn < 0) {
        quarantineReason = "NEGATIVE_NET_ADJUSTMENT";
      } else if (netMxn > 15_000_000) {
        quarantineReason = "SANITY_LIMIT_EXCEEDED";
      }

      const contractor = cleanPersonName(
        rep?.contratante,
        `Contratante Póliza ${pol}`
      );

      out.push({
        externalKey: `LATINO:EMI:${reportKey}:${pol}:${vigDesdeYmd}`,
        insurerKey: "LATINO",
        insurerCanonicalName: "La Latinoamericana Seguros",
        itemType: "LATINO_EMISSION",
        policyNumber: pol,
        receiptRef: `EMI-${vigDesdeYmd}`,
        clientName: contractor,
        insuredName: contractor,
        product: ramoMeta.product,
        ramoHint: ramoMeta.ramoHint,
        subRamoHint: ramoMeta.subRamoHint,
        tipoVigenciaOverride: "ANUAL_RENOVABLE",
        paymentMethod: "Anual",
        totalInstallments: 1,
        policyYear: isRenewalCapture ? 2 : 1,
        receiptNumber: 1,
        isExtraContribution: false,
        isRenewalCapture,
        amountMxn: netMxn,
        annualPremiumEstimateMxn: Math.max(0, netMxn),
        effectiveYmd: vigDesdeYmd,
        renewalYmd: vigHastaYmd,
        eventDateStr,
        dueDateStr: vigDesdeYmd,
        agentShares:
          netMxn > 0
            ? [
                {
                  externalCode: agentCode,
                  externalName: agentName,
                  amountMxn: netMxn,
                  mappedUserId: null,
                },
              ]
            : [],
        externalAgentCode: agentCode,
        externalAgentName: agentName,
        secondaryAgentCode: null,
        skipReason,
        quarantineReason,
        rawPayload: rows.length > 10 ? { summaryRowsCount: rows.length, sample: rep, netMxn } : rows,
      });
    }
  }

  // 2) COBRANZA (pagado_danos, pagado_personas)
  for (const reportKey of ["pagado_danos", "pagado_personas"]) {
    const repBlock = reportes[reportKey];
    const items: any[] = Array.isArray(repBlock?.items)
      ? repBlock.items
      : Array.isArray(repBlock)
      ? repBlock
      : [];
    if (items.length === 0) continue;

    const getRowAmt = (r: any) =>
      reportKey === "pagado_danos"
        ? Number(r?.primA_LATINO ?? r?.prima ?? 0) || 0
        : Number(r?.imP_PRIMA_NETA ?? r?.prima ?? 0) || 0;

    // Paso A: detectar periodos (poliza, viG_DESRBO) compensados completamente a 0 (pagos + reversos)
    const periodGroups = new Map<string, any[]>();
    for (const r of items) {
      const pol = String(r?.poliza ?? "").trim();
      if (!pol) continue;
      const periodStart = parseYmdStrict(r?.viG_DESRBO || r?.f_INI_VIGENCIA, todayYmd);
      const pk = `${pol}::${periodStart}`;
      if (!periodGroups.has(pk)) periodGroups.set(pk, []);
      periodGroups.get(pk)!.push(r);
    }

    const remainingRows: any[] = [];
    for (const [pk, pRows] of Array.from(periodGroups.entries())) {
      const hasNeg = pRows.some((r) => getRowAmt(r) < 0);
      const netPeriod = Number(
        pRows.reduce((s, r) => s + getRowAmt(r), 0).toFixed(2)
      );
      if (hasNeg && Math.abs(netPeriod) < 0.01) {
        const [pol, periodStart] = pk.split("::");
        const rep = pRows[0];
        const ramoMeta = mapLatinoRamoHint(rep);
        const pmInfo = mapLatinoPaymentMethod(rep?.fmapago);
        out.push({
          externalKey: `LATINO:PAG:${reportKey}:${pol}:PERIOD_${periodStart}`,
          insurerKey: "LATINO",
          insurerCanonicalName: "La Latinoamericana Seguros",
          itemType: "LATINO_RECEIPT",
          policyNumber: pol,
          receiptRef: `PERIOD_${periodStart}`,
          clientName: cleanPersonName(rep?.contratante, `Contratante Póliza ${pol}`),
          insuredName: cleanPersonName(rep?.contratante, `Contratante Póliza ${pol}`),
          product: ramoMeta.product,
          ramoHint: ramoMeta.ramoHint,
          subRamoHint: ramoMeta.subRamoHint,
          tipoVigenciaOverride: "ANUAL_RENOVABLE",
          paymentMethod: pmInfo.paymentMethod,
          totalInstallments: pmInfo.totalInstallments,
          policyYear: 1,
          receiptNumber: 1,
          isExtraContribution: false,
          isRenewalCapture: String(rep?.inI_REN ?? "").trim().toUpperCase() === "R",
          amountMxn: 0,
          annualPremiumEstimateMxn: 0,
          effectiveYmd: parseYmdStrict(rep?.f_INI_VIGENCIA, periodStart),
          renewalYmd: rep?.f_FIN_VIGENCIA ? parseYmdStrict(rep.f_FIN_VIGENCIA, periodStart) : null,
          eventDateStr: parseYmdStrict(rep?.f_CTBLE, periodStart),
          dueDateStr: periodStart,
          agentShares: [],
          externalAgentCode: String(rep?.agte ?? "").trim() || "UNKNOWN",
          externalAgentName: cleanPersonName(rep?.nomprod) || null,
          secondaryAgentCode: null,
          skipReason: "COMPENSATED_ZERO_RECEIPT_PERIOD",
          rawPayload: pRows,
        });
      } else {
        remainingRows.push(...pRows);
      }
    }

    // Paso B: agrupar filas restantes por (poliza, recibo) para unir coberturas de un mismo recibo
    const byReceipt = new Map<string, any[]>();
    for (const r of remainingRows) {
      const pol = String(r?.poliza ?? "").trim();
      const rec = String(r?.recibo ?? "").trim() || parseYmdStrict(r?.viG_DESRBO, todayYmd);
      const rk = `${pol}::${rec}`;
      if (!byReceipt.has(rk)) byReceipt.set(rk, []);
      byReceipt.get(rk)!.push(r);
    }

    for (const [rk, rRows] of Array.from(byReceipt.entries())) {
      const [pol, recibo] = rk.split("::");
      const netMxn = Number(
        rRows.reduce((s, r) => s + getRowAmt(r), 0).toFixed(2)
      );

      const posRows = [...rRows].sort((a, b) => getRowAmt(b) - getRowAmt(a));
      const rep = posRows[0] || rRows[0];
      const ramoMeta = mapLatinoRamoHint(rep);
      const pmInfo = mapLatinoPaymentMethod(rep?.fmapago);
      const isRenewalCapture = String(rep?.inI_REN ?? "").trim().toUpperCase() === "R";

      const effectiveYmd = parseYmdStrict(
        rep?.f_INI_VIGENCIA || rep?.viG_DESRBO,
        todayYmd
      );
      const renewalYmd = rep?.f_FIN_VIGENCIA
        ? parseYmdStrict(rep.f_FIN_VIGENCIA, effectiveYmd)
        : null;
      const dueDateStr = parseYmdStrict(rep?.viG_DESRBO || rep?.f_INI_VIGENCIA, effectiveYmd);
      const eventDateStr = parseYmdStrict(rep?.f_CTBLE, dueDateStr);

      let skipReason: string | undefined;
      let quarantineReason: string | undefined;
      if (Math.abs(netMxn) < 0.01) {
        skipReason = "COMPENSATED_ZERO_NET";
      } else if (netMxn < 0) {
        quarantineReason = "NEGATIVE_RECEIPT_ADJUSTMENT";
      } else if (netMxn > 15_000_000) {
        quarantineReason = "SANITY_LIMIT_EXCEEDED";
      }

      const contractor = cleanPersonName(
        rep?.contratante,
        `Contratante Póliza ${pol}`
      );
      const agentCode = String(rep?.agte ?? "").trim() || "UNKNOWN";
      const agentName = cleanPersonName(rep?.nomprod) || null;

      // Calcular policyYear aproximado comparando viG_DESRBO contra f_INI_VIGENCIA
      const effCal = toCalendarDateLocal(effectiveYmd);
      const dueCal = toCalendarDateLocal(dueDateStr);
      let policyYear = isRenewalCapture ? 2 : 1;
      if (effCal && dueCal) {
        const diffDays = differenceInCalendarDays(dueCal, effCal);
        if (diffDays >= 330) {
          policyYear = Math.max(policyYear, Math.floor((diffDays + 35) / 365) + 1);
        }
      }

      out.push({
        externalKey: `LATINO:PAG:${reportKey}:${pol}:${recibo}`,
        insurerKey: "LATINO",
        insurerCanonicalName: "La Latinoamericana Seguros",
        itemType: "LATINO_RECEIPT",
        policyNumber: pol,
        receiptRef: recibo,
        clientName: contractor,
        insuredName: contractor,
        product: ramoMeta.product,
        ramoHint: ramoMeta.ramoHint,
        subRamoHint: ramoMeta.subRamoHint,
        tipoVigenciaOverride: "ANUAL_RENOVABLE",
        paymentMethod: pmInfo.paymentMethod,
        totalInstallments: pmInfo.totalInstallments,
        policyYear,
        receiptNumber: 1,
        isExtraContribution: false,
        isRenewalCapture,
        amountMxn: netMxn,
        annualPremiumEstimateMxn:
          netMxn > 0
            ? Number((netMxn * pmInfo.totalInstallments).toFixed(2))
            : 0,
        effectiveYmd,
        renewalYmd,
        eventDateStr,
        dueDateStr,
        agentShares:
          netMxn > 0
            ? [
                {
                  externalCode: agentCode,
                  externalName: agentName,
                  amountMxn: netMxn,
                  mappedUserId: null,
                },
              ]
            : [],
        externalAgentCode: agentCode,
        externalAgentName: agentName,
        secondaryAgentCode: null,
        skipReason,
        quarantineReason,
        rawPayload: rRows,
      });
    }
  }

  return out;
}

export function normalizeIncomingGrokbotPayload(
  rawInput: any,
  todayYmd: string
): {
  source: "INSIGNIA" | "LATINO" | "COMBINED";
  items: NormalizedGrokbotItem[];
} {
  let insigniaPayload: any = null;
  let latinoPayload: any = null;

  if (rawInput && typeof rawInput === "object" && !Array.isArray(rawInput)) {
    if ("insignia" in rawInput || "latino" in rawInput) {
      insigniaPayload = rawInput.insignia ?? null;
      latinoPayload = rawInput.latino ?? null;
    } else if ("reportes" in rawInput || "emitido_autos" in rawInput || "pagado_danos" in rawInput) {
      latinoPayload = rawInput;
    } else if ("items" in rawInput || "producerId" in rawInput || "primas" in rawInput) {
      insigniaPayload = rawInput;
    }
  } else if (Array.isArray(rawInput) && rawInput.length > 0) {
    if ("numeroPoliza" in rawInput[0] || "idRecibo" in rawInput[0]) {
      insigniaPayload = rawInput;
    } else if ("poliza" in rawInput[0]) {
      latinoPayload = { emitido_autos: { items: rawInput } };
    }
  }

  const insigniaItems = insigniaPayload ? parseInsigniaPayload(insigniaPayload, todayYmd) : [];
  const latinoItems = latinoPayload ? parseLatinoPayload(latinoPayload, todayYmd) : [];

  const source: "INSIGNIA" | "LATINO" | "COMBINED" =
    insigniaPayload && latinoPayload
      ? "COMBINED"
      : latinoPayload
      ? "LATINO"
      : "INSIGNIA";

  // Orden: LATINO_EMISSION primero, luego INSIGNIA_RECEIPT y LATINO_RECEIPT
  const items = [...latinoItems, ...insigniaItems].sort((a, b) => {
    const rank = (t: ItemType) =>
      t === "LATINO_EMISSION" ? 0 : t === "INSIGNIA_RECEIPT" ? 1 : 2;
    const dr = rank(a.itemType) - rank(b.itemType);
    if (dr !== 0) return dr;
    return a.eventDateStr.localeCompare(b.eventDateStr);
  });

  return { source, items };
}

// =========================================================================
// MOTOR TRANSACCIONAL DE APLICACIÓN NO DESTRUCTIVA POR ÍTEM
// =========================================================================

async function applyNormalizedItemToDatabase(params: {
  agencyId: string;
  item: NormalizedGrokbotItem;
  appliedDateStr: string;
  insurerCompaniesByKey: Map<string, { id: string; name: string }>;
  allowNegativeOverride?: boolean;
}): Promise<{ applied: true; ledger: RollbackLedger } | { applied: false; quarantineReason: string }> {
  const { agencyId, item, appliedDateStr, insurerCompaniesByKey, allowNegativeOverride } = params;

  if (item.quarantineReason && !allowNegativeOverride) {
    return { applied: false, quarantineReason: item.quarantineReason };
  }

  const primaryShare = item.agentShares[0];
  const secondaryShare = item.agentShares[1] || null;
  if (!primaryShare?.mappedUserId) {
    return { applied: false, quarantineReason: "UNMAPPED_AGENT" };
  }
  if (secondaryShare && !secondaryShare.mappedUserId) {
    return { applied: false, quarantineReason: "UNMAPPED_SHARED_AGENT" };
  }

  const primaryUserId = primaryShare.mappedUserId;
  const secondaryUserId = secondaryShare?.mappedUserId || null;
  const sharedPercentage =
    secondaryShare && item.amountMxn > 0
      ? Number(((secondaryShare.amountMxn / item.amountMxn) * 100).toFixed(2))
      : 0;

  const companyLookupKey = normalizeCompanyKey(
    canonicalCompanyName(item.insurerCanonicalName)
  );
  const compMeta = insurerCompaniesByKey.get(companyLookupKey) || null;
  const canonicalCompany = compMeta?.name || item.insurerCanonicalName;

  const ramoResolved = resolveImportedRowRamo({
    ramo: item.ramoHint,
    subRamo: item.subRamoHint,
    product: item.product,
    insuranceCompany: canonicalCompany,
    contractor: item.clientName,
    explicitTipoVigencia: item.tipoVigenciaOverride,
  });

  const grokTag = `[GROKBOT:${item.externalKey}]`;

  try {
    return await prisma.$transaction(async (tx) => {
      const ledger: RollbackLedger = {
        originalExternalKey: item.externalKey,
        createdClientId: null,
        updatedClientSnapshot: null,
        createdPolicyId: null,
        updatedPolicySnapshot: null,
        createdPendingReceiptIds: [],
        replacedUnpaidReceipts: [],
        createdReceiptId: null,
        updatedReceiptSnapshot: null,
        createdEmissionIds: [],
        updatedEmissionSnapshots: [],
      };

      const existingPolicy = await tx.policy.findUnique({
        where: { policyNumber: item.policyNumber },
        include: {
          client: true,
          receipts: { orderBy: [{ policyYear: "asc" }, { receiptNumber: "asc" }] },
        },
      });

      if (existingPolicy && existingPolicy.agencyId !== agencyId) {
        return { applied: false as const, quarantineReason: "CROSS_TENANT_POLICY_COLLISION" };
      }
      if (existingPolicy && (existingPolicy.deletedAt !== null || existingPolicy.isArchived)) {
        return { applied: false as const, quarantineReason: "ARCHIVED_OR_DELETED_POLICY" };
      }

      let policyRecord = existingPolicy;

      // 1. CREAR CLIENTE + PÓLIZA SI NO EXISTE
      if (!policyRecord) {
        const isGenericClient = item.clientName.startsWith("Contratante Póliza ");
        let clientRecord = !isGenericClient
          ? await tx.client.findFirst({
              where: {
                agencyId,
                deletedAt: null,
                name: { equals: item.clientName, mode: "insensitive" },
              },
            })
          : null;

        if (!clientRecord) {
          clientRecord = await tx.client.create({
            data: {
              agencyId,
              userId: primaryUserId,
              name: item.clientName,
              notes: `Creado automáticamente por puente Grokbot ${grokTag}`,
            },
          });
          ledger.createdClientId = clientRecord.id;
        }

        const effDate = toUTCNoonDate(item.effectiveYmd) || toUTCNoonDate(item.eventDateStr)!;
        const renDate = item.renewalYmd ? toUTCNoonDate(item.renewalYmd) : null;

        const createdPol = await tx.policy.create({
          data: {
            agencyId,
            userId: primaryUserId,
            sharedWithUserId: secondaryUserId,
            sharedPercentage: secondaryUserId ? sharedPercentage : 0,
            clientId: clientRecord.id,
            policyNumber: item.policyNumber,
            contractor: item.clientName,
            insured: item.insuredName,
            insuranceCompany: canonicalCompany,
            product: item.product,
            ramo: ramoResolved.ramo,
            subRamo: ramoResolved.subRamo,
            vidaObjetivo: ramoResolved.vidaObjetivo,
            tipoVigencia: ramoResolved.tipoVigencia,
            paymentMethod: item.paymentMethod,
            annualPremium: item.annualPremiumEstimateMxn,
            originalPremium: item.annualPremiumEstimateMxn,
            currency: "MXN",
            effectiveDate: effDate,
            renewalDate: renDate,
            anniversaryDay: effDate.getUTCDate(),
            anniversaryMonth: effDate.getUTCMonth() + 1,
            status: "VIGENTE",
            subStatus: item.isRenewalCapture ? "RENOVACION" : null,
            isRenewalCapture: item.isRenewalCapture,
            adminApproved: true,
            observations: `Sincronizada vía puente Grokbot ${grokTag}`,
          },
        });
        ledger.createdPolicyId = createdPol.id;

        // Generar calendario del año póliza objetivo SIN auto-marcar históricos como PAGADO
        const effCal = toCalendarDateLocal(effDate) || new Date();
        const cycleRefCal = addDays(
          addMonths(effCal, Math.max(0, item.policyYear - 1) * 12),
          1
        );
        const drafts = item.isExtraContribution
          ? []
          : buildPolicyReceiptsDrafts(createdPol, {
              autoMarkHistoricalPaid: false,
              referenceDate: cycleRefCal,
            });

        for (const dr of drafts) {
          await tx.policyReceipt.create({
            data: {
              policyId: createdPol.id,
              agencyId,
              userId: createdPol.userId,
              receiptNumber: dr.receiptNumber,
              totalInstallments: dr.totalInstallments,
              policyYear: dr.policyYear,
              dueDate: dr.dueDate,
              graceEndDate: dr.graceEndDate,
              amount: dr.amount,
              status: dr.status,
              paidAt: null,
              paidAmount: null,
              adminApproved: true,
            },
          });
        }

        policyRecord = await tx.policy.findUnique({
          where: { id: createdPol.id },
          include: {
            client: true,
            receipts: { orderBy: [{ policyYear: "asc" }, { receiptNumber: "asc" }] },
          },
        });
      } else {
        // 2. ENRIQUECIMIENTO NO DESTRUCTIVO DE PÓLIZA EXISTENTE
        const policyPatch: any = {};
        let shouldSnapshotPolicy = false;

        // Nunca sobrescribir contratante real existente con genérico; sí mejorar genérico con real
        if (
          policyRecord.contractor?.startsWith("Contratante Póliza ") &&
          !item.clientName.startsWith("Contratante Póliza ")
        ) {
          policyPatch.contractor = item.clientName;
          shouldSnapshotPolicy = true;
          if (
            policyRecord.client &&
            policyRecord.client.name.startsWith("Contratante Póliza ")
          ) {
            ledger.updatedClientSnapshot = {
              id: policyRecord.client.id,
              name: policyRecord.client.name,
            };
            await tx.client.update({
              where: { id: policyRecord.client.id },
              data: { name: item.clientName },
            });
          }
        }

        // Enriquecer prima anual si estaba en 0
        if (
          (Number(policyRecord.annualPremium) || 0) <= 0 &&
          item.annualPremiumEstimateMxn > 0 &&
          !item.isExtraContribution
        ) {
          policyPatch.annualPremium = item.annualPremiumEstimateMxn;
          shouldSnapshotPolicy = true;
        }

        // En La Latino, si LATINO_EMISSION dejó paymentMethod="Anual" sin recibos pagados y llega cobranza fraccionada
        const hasAnyPaidReceipt = (policyRecord.receipts || []).some(
          (r) => r.status === "PAGADO"
        );
        if (
          item.itemType === "LATINO_RECEIPT" &&
          !hasAnyPaidReceipt &&
          item.totalInstallments > 1 &&
          policyRecord.paymentMethod === "Anual"
        ) {
          policyPatch.paymentMethod = item.paymentMethod;
          shouldSnapshotPolicy = true;

          const unpaidInYear = (policyRecord.receipts || []).filter(
            (r) => r.status !== "PAGADO" && r.policyYear === item.policyYear
          );
          if (unpaidInYear.length > 0) {
            ledger.replacedUnpaidReceipts = unpaidInYear.map((r) => ({
              receiptNumber: r.receiptNumber,
              totalInstallments: r.totalInstallments,
              policyYear: r.policyYear,
              dueDate: r.dueDate.toISOString(),
              graceEndDate: r.graceEndDate.toISOString(),
              amount: r.amount,
              status: r.status,
            }));
            await tx.policyReceipt.deleteMany({
              where: { id: { in: unpaidInYear.map((r) => r.id) } },
            });
          }

          const effCal = toCalendarDateLocal(policyRecord.effectiveDate) || new Date();
          const cycleRefCal = addDays(
            addMonths(effCal, Math.max(0, item.policyYear - 1) * 12),
            1
          );
          const updatedForDraft = {
            ...policyRecord,
            paymentMethod: item.paymentMethod,
            annualPremium:
              policyPatch.annualPremium ?? policyRecord.annualPremium ?? item.annualPremiumEstimateMxn,
          };
          const drafts = buildPolicyReceiptsDrafts(updatedForDraft, {
            autoMarkHistoricalPaid: false,
            referenceDate: cycleRefCal,
          });
          for (const dr of drafts) {
            const existsSlot = await tx.policyReceipt.findUnique({
              where: {
                policyId_policyYear_receiptNumber: {
                  policyId: policyRecord.id,
                  policyYear: dr.policyYear,
                  receiptNumber: dr.receiptNumber,
                },
              },
            });
            if (!existsSlot) {
              const createdPending = await tx.policyReceipt.create({
                data: {
                  policyId: policyRecord.id,
                  agencyId,
                  userId: policyRecord.userId,
                  receiptNumber: dr.receiptNumber,
                  totalInstallments: dr.totalInstallments,
                  policyYear: dr.policyYear,
                  dueDate: dr.dueDate,
                  graceEndDate: dr.graceEndDate,
                  amount: dr.amount,
                  status: dr.status,
                  paidAt: null,
                  paidAmount: null,
                  adminApproved: true,
                },
              });
              ledger.createdPendingReceiptIds!.push(createdPending.id);
            }
          }
        }

        if (shouldSnapshotPolicy) {
          ledger.updatedPolicySnapshot = {
            id: policyRecord.id,
            annualPremium: policyRecord.annualPremium,
            paymentMethod: policyRecord.paymentMethod,
            contractor: policyRecord.contractor,
            effectiveDate: policyRecord.effectiveDate
              ? policyRecord.effectiveDate.toISOString()
              : null,
            renewalDate: policyRecord.renewalDate
              ? policyRecord.renewalDate.toISOString()
              : null,
            sharedWithUserId: policyRecord.sharedWithUserId,
            sharedPercentage: policyRecord.sharedPercentage,
          };
          await tx.policy.update({
            where: { id: policyRecord.id },
            data: policyPatch,
          });
        }

        policyRecord = await tx.policy.findUnique({
          where: { id: policyRecord.id },
          include: {
            client: true,
            receipts: { orderBy: [{ policyYear: "asc" }, { receiptNumber: "asc" }] },
          },
        });
      }

      if (!policyRecord) {
        throw new Error("No se pudo resolver la póliza en transacción.");
      }

      // 3. MARCAR O CREAR RECIBO PAGADO (SOLO PARA INSIGNIA_RECEIPT O LATINO_RECEIPT)
      let touchedReceiptId: string | null = null;
      const paidDateUTC =
        toUTCNoonDate(item.eventDateStr) || toUTCNoonDate(item.dueDateStr)!;
      const dueDateUTC = toUTCNoonDate(item.dueDateStr) || paidDateUTC;

      if (item.itemType === "INSIGNIA_RECEIPT" || item.itemType === "LATINO_RECEIPT") {
        let targetReceipt: (typeof policyRecord.receipts)[number] | null = null;

        if (item.itemType === "INSIGNIA_RECEIPT") {
          if (!item.isExtraContribution && item.receiptNumber > 0) {
            targetReceipt =
              policyRecord.receipts.find(
                (r) =>
                  r.policyYear === item.policyYear &&
                  r.receiptNumber === item.receiptNumber
              ) || null;
          }
        } else {
          // LATINO_RECEIPT: buscar por referencia [recibo:...] o recibo no pagado cercano en fecha
          const recMarker = `[recibo:${item.receiptRef}]`;
          targetReceipt =
            policyRecord.receipts.find((r) =>
              (r.paymentNotes || "").includes(recMarker)
            ) || null;

          if (!targetReceipt) {
            const targetDueCal = toCalendarDateLocal(dueDateUTC) || new Date();
            const unpaidCandidates = policyRecord.receipts.filter(
              (r) => r.status !== "PAGADO"
            );
            if (unpaidCandidates.length > 0) {
              unpaidCandidates.sort((a, b) => {
                const aCal = toCalendarDateLocal(a.dueDate) || targetDueCal;
                const bCal = toCalendarDateLocal(b.dueDate) || targetDueCal;
                return (
                  Math.abs(differenceInCalendarDays(aCal, targetDueCal)) -
                  Math.abs(differenceInCalendarDays(bCal, targetDueCal))
                );
              });
              const closestCal =
                toCalendarDateLocal(unpaidCandidates[0].dueDate) || targetDueCal;
              if (Math.abs(differenceInCalendarDays(closestCal, targetDueCal)) <= 50) {
                targetReceipt = unpaidCandidates[0];
              }
            }
          }
        }

        const noteRef = item.receiptRef
          ? `Pago sincronizado Grokbot [recibo:${item.receiptRef}] ${grokTag}`
          : `Pago sincronizado Grokbot ${grokTag}`;

        if (targetReceipt) {
          ledger.updatedReceiptSnapshot = {
            id: targetReceipt.id,
            status: targetReceipt.status,
            paidAt: targetReceipt.paidAt ? targetReceipt.paidAt.toISOString() : null,
            paidAmount: targetReceipt.paidAmount,
            amount: targetReceipt.amount,
            paymentNotes: targetReceipt.paymentNotes,
            syncedEmissionId: targetReceipt.syncedEmissionId,
          };

          const shouldPreserveManualAmount =
            targetReceipt.status === "PAGADO" &&
            targetReceipt.paidAmount !== null &&
            Math.abs(Number(targetReceipt.paidAmount) - item.amountMxn) <= 1;

          const updatedRec = await tx.policyReceipt.update({
            where: { id: targetReceipt.id },
            data: {
              status: "PAGADO",
              paidAt: targetReceipt.paidAt || paidDateUTC,
              paidAmount: shouldPreserveManualAmount
                ? targetReceipt.paidAmount
                : item.amountMxn,
              adminApproved: true,
              paymentNotes: targetReceipt.paymentNotes
                ? `${targetReceipt.paymentNotes} | ${noteRef}`
                : noteRef,
            },
          });
          touchedReceiptId = updatedRec.id;
        } else {
          // Encontrar slot seguro de receiptNumber en ese policyYear sin chocar con @@unique
          const sameYearNumbers = new Set(
            policyRecord.receipts
              .filter((r) => r.policyYear === item.policyYear)
              .map((r) => r.receiptNumber)
          );
          let nextReceiptNum =
            item.itemType === "INSIGNIA_RECEIPT" ? item.receiptNumber : 1;
          while (sameYearNumbers.has(nextReceiptNum) || nextReceiptNum <= 0) {
            nextReceiptNum += 1;
          }

          const graceDate =
            toUTCNoonDate(addDays(toCalendarDateLocal(dueDateUTC) || new Date(), 30)) ||
            dueDateUTC;

          const createdRec = await tx.policyReceipt.create({
            data: {
              policyId: policyRecord.id,
              agencyId,
              userId: policyRecord.userId,
              receiptNumber: nextReceiptNum,
              totalInstallments: item.totalInstallments,
              policyYear: item.policyYear,
              dueDate: dueDateUTC,
              graceEndDate: graceDate,
              amount: item.amountMxn,
              status: "PAGADO",
              paidAt: paidDateUTC,
              paidAmount: item.amountMxn,
              adminApproved: true,
              paymentNotes: noteRef,
            },
          });
          ledger.createdReceiptId = createdRec.id;
          touchedReceiptId = createdRec.id;
        }
      }

      // 4. SINCRONIZAR CON HISTORIAL DE PRODUCCIÓN (AgentEmission)
      const issueUTC = toUTCNoonDate(item.eventDateStr) || paidDateUTC;
      const issueYear = issueUTC.getUTCFullYear();
      const issueMonth = issueUTC.getUTCMonth() + 1;
      const effYear =
        policyRecord.effectiveDate?.getUTCFullYear() ||
        parseInt(item.effectiveYmd.slice(0, 4), 10) ||
        issueYear;

      const emissionNotesTag = `${grokTag}${
        item.receiptRef ? ` Recibo ${item.receiptNumber}/${item.totalInstallments}` : ""
      }`;

      for (const share of item.agentShares) {
        if (!share.mappedUserId || share.amountMxn <= 0) continue;

        const existingByTag = await tx.agentEmission.findFirst({
          where: {
            agencyId,
            agentId: share.mappedUserId,
            notes: { contains: grokTag },
          },
        });
        if (existingByTag) continue;

        // Si es LATINO_RECEIPT y existe una emisión EMITIDA sin cobrar del mismo año/mes, enlazarla en lugar de duplicar fila
        if (item.itemType === "LATINO_RECEIPT") {
          const pendingEmission = await tx.agentEmission.findFirst({
            where: {
              agencyId,
              agentId: share.mappedUserId,
              policyNumber: item.policyNumber,
              year: issueYear,
              primaPagada: { lte: 0.01 },
            },
            orderBy: { createdAt: "desc" },
          });

          if (pendingEmission) {
            ledger.updatedEmissionSnapshots!.push({
              id: pendingEmission.id,
              primaEmitida: pendingEmission.primaEmitida,
              primaPagada: pendingEmission.primaPagada,
              status: pendingEmission.status,
              notes: pendingEmission.notes,
            });
            await tx.agentEmission.update({
              where: { id: pendingEmission.id },
              data: {
                primaPagada: Number(
                  ((pendingEmission.primaPagada || 0) + share.amountMxn).toFixed(2)
                ),
                status: "PAGADA",
                notes: pendingEmission.notes
                  ? `${pendingEmission.notes} | ${emissionNotesTag}`
                  : emissionNotesTag,
              },
            });
            if (touchedReceiptId && !ledger.updatedReceiptSnapshot?.syncedEmissionId) {
              await tx.policyReceipt.update({
                where: { id: touchedReceiptId },
                data: { syncedEmissionId: pendingEmission.id },
              });
            }
            continue;
          }
        }

        // Calcular Prima Emitida correspondiente (para no duplicar PE en mensualidades)
        const shareRatio =
          item.amountMxn > 0 ? share.amountMxn / item.amountMxn : 1;
        let primaEmitida = 0;
        let primaPagada = 0;
        let emissionStatus = "EMITIDA";

        if (item.itemType === "LATINO_EMISSION") {
          primaEmitida = share.amountMxn;
          primaPagada = 0;
          emissionStatus = "EMITIDA";
        } else {
          primaPagada = share.amountMxn;
          emissionStatus = "PAGADA";
          const qualifiesInitialEmission =
            item.itemType === "INSIGNIA_RECEIPT" &&
            !item.isExtraContribution &&
            !item.isRenewalCapture &&
            item.policyYear === 1 &&
            item.receiptNumber === 1 &&
            effYear === issueYear;

          if (qualifiesInitialEmission) {
            const alreadyHasYearPe = await tx.agentEmission.findFirst({
              where: {
                agencyId,
                agentId: share.mappedUserId,
                policyNumber: item.policyNumber,
                year: issueYear,
                primaEmitida: { gt: 0 },
              },
              select: { id: true },
            });
            if (!alreadyHasYearPe) {
              primaEmitida = Number(
                (item.annualPremiumEstimateMxn * shareRatio).toFixed(2)
              );
            }
          }
        }

        const createdEm = await tx.agentEmission.create({
          data: {
            agencyId,
            agentId: share.mappedUserId,
            companyId: compMeta?.id || null,
            companyName: canonicalCompany,
            policyNumber: item.policyNumber,
            clientName: policyRecord.contractor || item.clientName,
            ramo: ramoResolved.classified.groupLabel,
            issueDate: issueUTC,
            year: issueYear,
            month: issueMonth,
            primaEmitida,
            primaPagada,
            status: emissionStatus,
            notes: emissionNotesTag,
          },
        });
        ledger.createdEmissionIds.push(createdEm.id);

        if (touchedReceiptId && !ledger.updatedReceiptSnapshot?.syncedEmissionId) {
          await tx.policyReceipt.update({
            where: { id: touchedReceiptId },
            data: { syncedEmissionId: createdEm.id },
          });
        }
      }

      return { applied: true as const, ledger };
    });
  } catch (err: any) {
    console.error("Grokbot apply item error:", item.externalKey, err);
    return {
      applied: false,
      quarantineReason: `APPLY_ERROR:${String(err?.message || "TX_FAILED").slice(0, 100)}`,
    };
  }
}

function buildStoredRawPayloadJson(item: NormalizedGrokbotItem): any {
  const { rawPayload, ...normalized } = item;
  return JSON.parse(JSON.stringify({ normalized, raw: rawPayload }));
}

// =========================================================================
// PUNTO DE ENTRADA DE INGESTA DE LOTE (USADO POR API Y POR UI MANUAL)
// =========================================================================

export async function runGrokbotIngestion(params: {
  payload: any;
  dryRun?: boolean;
  triggeredBy?: "GROKBOT_API" | "ADMIN_UI";
}): Promise<RunGrokbotIngestResult> {
  const agency = await resolveLockedAacomAgency();
  const batchDateStr = getCdmxTodayYmd();
  const dryRun = Boolean(params.dryRun);
  const triggeredBy = params.triggeredBy || "GROKBOT_API";

  const { source, items } = normalizeIncomingGrokbotPayload(
    params.payload,
    batchDateStr
  );

  // Recolectar todos los agentes candidatos presentes en el payload
  const agentCandidates: Array<{
    insurerKey: InsurerKey;
    externalAgentCode: string;
    externalAgentName: string | null;
  }> = [];
  for (const it of items) {
    for (const s of it.agentShares) {
      agentCandidates.push({
        insurerKey: it.insurerKey,
        externalAgentCode: s.externalCode,
        externalAgentName: s.externalName,
      });
    }
    if (it.agentShares.length === 0 && it.externalAgentCode) {
      agentCandidates.push({
        insurerKey: it.insurerKey,
        externalAgentCode: it.externalAgentCode,
        externalAgentName: it.externalAgentName,
      });
    }
  }

  // En modo dryRun, consultar el mapa existente sin escribir agentes nuevos ni mutar cartera
  const existingAgentMaps = dryRun
    ? new Map(
        (await prisma.grokbotAgentMap.findMany({ where: { agencyId: agency.id } })).map(
          (m) => [`${m.insurerKey}:${m.externalAgentCode}`, m.userId || null]
        )
      )
    : await ensureAgentMaps(agency.id, agentCandidates);

  // Rellenar mappedUserId en cada share
  for (const it of items) {
    for (const s of it.agentShares) {
      s.mappedUserId =
        existingAgentMaps.get(`${it.insurerKey}:${s.externalCode}`) || null;
    }
  }

  // Consultar duplicados ya procesados en batches previos (por externalKey único)
  const allExternalKeys = items.map((i) => i.externalKey);
  const existingItems =
    allExternalKeys.length > 0
      ? await prisma.grokbotSyncItem.findMany({
          where: {
            externalKey: { in: allExternalKeys },
          },
          select: { externalKey: true, status: true },
        })
      : [];
  const existingByKey = new Map(existingItems.map((e) => [e.externalKey, e.status]));

  // Catálogo de aseguradoras de la agencia titular
  const agencyCompanies = await prisma.insuranceCompany.findMany({
    where: { agencyId: agency.id, active: true },
    select: { id: true, name: true },
  });
  const insurerCompaniesByKey = new Map<string, { id: string; name: string }>();
  for (const c of agencyCompanies) {
    insurerCompaniesByKey.set(normalizeCompanyKey(canonicalCompanyName(c.name)), c);
  }

  const unmappedAccumulator = new Map<
    string,
    {
      insurerKey: InsurerKey;
      externalAgentCode: string;
      externalAgentName: string | null;
      itemsCount: number;
    }
  >();

  let appliedCount = 0;
  let quarantinedCount = 0;
  let skippedDuplicates = 0;
  let skippedCompensated = 0;
  let totalAppliedMxn = 0;

  const quarantinedHighlights: RunGrokbotIngestResult["quarantinedHighlights"] = [];
  const appliedSamples: RunGrokbotIngestResult["appliedSamples"] = [];

  if (dryRun) {
    for (const item of items) {
      if (existingByKey.has(item.externalKey)) {
        skippedDuplicates += 1;
        continue;
      }
      if (item.skipReason) {
        skippedCompensated += 1;
        continue;
      }

      let qReason = item.quarantineReason;
      if (!qReason) {
        const primary = item.agentShares[0];
        const secondary = item.agentShares[1];
        if (!primary?.mappedUserId) qReason = "UNMAPPED_AGENT";
        else if (secondary && !secondary.mappedUserId) qReason = "UNMAPPED_SHARED_AGENT";
      }

      if (qReason) {
        quarantinedCount += 1;
        if (qReason === "UNMAPPED_AGENT" || qReason === "UNMAPPED_SHARED_AGENT") {
          for (const s of item.agentShares) {
            if (!s.mappedUserId) {
              const uk = `${item.insurerKey}:${s.externalCode}`;
              const prev = unmappedAccumulator.get(uk) || {
                insurerKey: item.insurerKey,
                externalAgentCode: s.externalCode,
                externalAgentName: s.externalName,
                itemsCount: 0,
              };
              prev.itemsCount += 1;
              unmappedAccumulator.set(uk, prev);
            }
          }
        }
        if (quarantinedHighlights.length < 30) {
          quarantinedHighlights.push({
            externalKey: item.externalKey,
            policyNumber: item.policyNumber,
            reason: qReason,
            amountMxn: item.amountMxn,
            externalAgentCode: item.externalAgentCode,
          });
        }
      } else {
        appliedCount += 1;
        totalAppliedMxn = Number((totalAppliedMxn + item.amountMxn).toFixed(2));
        if (appliedSamples.length < 20) {
          appliedSamples.push({
            externalKey: item.externalKey,
            itemType: item.itemType,
            policyNumber: item.policyNumber,
            amountMxn: item.amountMxn,
            eventDateStr: item.eventDateStr,
          });
        }
      }
    }

    return {
      ok: true,
      dryRun: true,
      agencyId: agency.id,
      batchId: null,
      batchDateStr,
      source,
      status: "DRY_RUN",
      counts: {
        parsed: items.length,
        applied: appliedCount,
        quarantined: quarantinedCount,
        skipped: skippedDuplicates + skippedCompensated,
        skippedDuplicates,
        skippedCompensated,
      },
      totalAppliedMxn,
      unmappedAgents: Array.from(unmappedAccumulator.values()),
      quarantinedHighlights,
      appliedSamples,
    };
  }

  // Crear lote real en BD
  const batch = await prisma.grokbotSyncBatch.create({
    data: {
      agencyId: agency.id,
      batchDateStr,
      source,
      triggeredBy,
      status: "PROCESSING",
      totalParsed: items.length,
    },
  });

  for (const item of items) {
    if (existingByKey.has(item.externalKey)) {
      skippedDuplicates += 1;
      continue;
    }

    if (item.skipReason) {
      skippedCompensated += 1;
      await prisma.grokbotSyncItem.create({
        data: {
          batchId: batch.id,
          agencyId: agency.id,
          externalKey: item.externalKey,
          insurerKey: item.insurerKey,
          itemType: item.itemType,
          policyNumber: item.policyNumber,
          receiptRef: item.receiptRef,
          clientName: item.clientName,
          externalAgentCode: item.externalAgentCode,
          externalAgentName: item.externalAgentName,
          secondaryAgentCode: item.secondaryAgentCode,
          mappedUserId: null,
          amountMxn: item.amountMxn,
          eventDateStr: item.eventDateStr,
          status: "SKIPPED",
          quarantineReason: item.skipReason,
          rawPayloadJson: buildStoredRawPayloadJson(item),
        },
      });
      continue;
    }

    const res = await applyNormalizedItemToDatabase({
      agencyId: agency.id,
      item,
      appliedDateStr: batchDateStr,
      insurerCompaniesByKey,
    });

    if (res.applied) {
      appliedCount += 1;
      totalAppliedMxn = Number((totalAppliedMxn + item.amountMxn).toFixed(2));
      await prisma.grokbotSyncItem.create({
        data: {
          batchId: batch.id,
          agencyId: agency.id,
          externalKey: item.externalKey,
          insurerKey: item.insurerKey,
          itemType: item.itemType,
          policyNumber: item.policyNumber,
          receiptRef: item.receiptRef,
          clientName: item.clientName,
          externalAgentCode: item.externalAgentCode,
          externalAgentName: item.externalAgentName,
          secondaryAgentCode: item.secondaryAgentCode,
          mappedUserId: item.agentShares[0]?.mappedUserId || null,
          amountMxn: item.amountMxn,
          eventDateStr: item.eventDateStr,
          appliedDateStr: batchDateStr,
          status: "APPLIED",
          quarantineReason: null,
          rawPayloadJson: buildStoredRawPayloadJson(item),
          rollbackLedgerJson: res.ledger as any,
          appliedAt: new Date(),
        },
      });

      if (appliedSamples.length < 20) {
        appliedSamples.push({
          externalKey: item.externalKey,
          itemType: item.itemType,
          policyNumber: item.policyNumber,
          amountMxn: item.amountMxn,
          eventDateStr: item.eventDateStr,
        });
      }
    } else {
      quarantinedCount += 1;
      if (
        res.quarantineReason === "UNMAPPED_AGENT" ||
        res.quarantineReason === "UNMAPPED_SHARED_AGENT"
      ) {
        for (const s of item.agentShares) {
          if (!s.mappedUserId) {
            const uk = `${item.insurerKey}:${s.externalCode}`;
            const prev = unmappedAccumulator.get(uk) || {
              insurerKey: item.insurerKey,
              externalAgentCode: s.externalCode,
              externalAgentName: s.externalName,
              itemsCount: 0,
            };
            prev.itemsCount += 1;
            unmappedAccumulator.set(uk, prev);
          }
        }
      }
      if (quarantinedHighlights.length < 30) {
        quarantinedHighlights.push({
          externalKey: item.externalKey,
          policyNumber: item.policyNumber,
          reason: res.quarantineReason,
          amountMxn: item.amountMxn,
          externalAgentCode: item.externalAgentCode,
        });
      }

      await prisma.grokbotSyncItem.create({
        data: {
          batchId: batch.id,
          agencyId: agency.id,
          externalKey: item.externalKey,
          insurerKey: item.insurerKey,
          itemType: item.itemType,
          policyNumber: item.policyNumber,
          receiptRef: item.receiptRef,
          clientName: item.clientName,
          externalAgentCode: item.externalAgentCode,
          externalAgentName: item.externalAgentName,
          secondaryAgentCode: item.secondaryAgentCode,
          mappedUserId: item.agentShares[0]?.mappedUserId || null,
          amountMxn: item.amountMxn,
          eventDateStr: item.eventDateStr,
          status: "QUARANTINED",
          quarantineReason: res.quarantineReason,
          rawPayloadJson: buildStoredRawPayloadJson(item),
        },
      });
    }
  }

  const finalStatus =
    appliedCount > 0 && quarantinedCount > 0
      ? "PARTIAL_QUARANTINE"
      : appliedCount > 0
      ? "APPLIED"
      : quarantinedCount > 0
      ? "QUARANTINED_ONLY"
      : "NO_CHANGES";

  const summary = {
    source,
    parsed: items.length,
    appliedCount,
    quarantinedCount,
    skippedDuplicates,
    skippedCompensated,
    totalAppliedMxn,
    unmappedAgents: Array.from(unmappedAccumulator.values()),
  };

  await prisma.grokbotSyncBatch.update({
    where: { id: batch.id },
    data: {
      status: finalStatus,
      appliedCount,
      quarantinedCount,
      skippedCount: skippedDuplicates + skippedCompensated,
      totalAppliedMxn,
      summaryJson: summary as any,
    },
  });

  return {
    ok: true,
    dryRun: false,
    agencyId: agency.id,
    batchId: batch.id,
    batchDateStr,
    source,
    status: finalStatus,
    counts: {
      parsed: items.length,
      applied: appliedCount,
      quarantined: quarantinedCount,
      skipped: skippedDuplicates + skippedCompensated,
      skippedDuplicates,
      skippedCompensated,
    },
    totalAppliedMxn,
    unmappedAgents: Array.from(unmappedAccumulator.values()),
    quarantinedHighlights,
    appliedSamples,
  };
}

// =========================================================================
// RE-APLICACIÓN DE ÍTEMS EN CUARENTENA (TRAS MAPEAR AGENTE O APROBAR 1-CLIC)
// =========================================================================

export async function applyQuarantinedItems(params: {
  itemIds?: string[];
  insurerKey?: InsurerKey;
  externalAgentCode?: string;
  forceApproveAnomalies?: boolean;
}) {
  const agency = await resolveLockedAacomAgency();
  const appliedDateStr = getCdmxTodayYmd();

  const whereClause: any = {
    agencyId: agency.id,
    status: "QUARANTINED",
  };
  if (params.itemIds && params.itemIds.length > 0) {
    whereClause.id = { in: params.itemIds };
  }
  if (params.insurerKey) {
    whereClause.insurerKey = params.insurerKey;
  }
  if (params.externalAgentCode) {
    whereClause.OR = [
      { externalAgentCode: params.externalAgentCode },
      { secondaryAgentCode: params.externalAgentCode },
    ];
  }

  const pendingItems = await prisma.grokbotSyncItem.findMany({
    where: whereClause,
    orderBy: [{ createdAt: "asc" }],
  });

  if (pendingItems.length === 0) {
    return { appliedCount: 0, remainingQuarantined: 0 };
  }

  const maps = await prisma.grokbotAgentMap.findMany({
    where: { agencyId: agency.id },
  });
  const mapByKey = new Map(
    maps.map((m) => [`${m.insurerKey}:${m.externalAgentCode}`, m.userId || null])
  );

  const agencyCompanies = await prisma.insuranceCompany.findMany({
    where: { agencyId: agency.id, active: true },
    select: { id: true, name: true },
  });
  const insurerCompaniesByKey = new Map<string, { id: string; name: string }>();
  for (const c of agencyCompanies) {
    insurerCompaniesByKey.set(normalizeCompanyKey(canonicalCompanyName(c.name)), c);
  }

  let appliedCount = 0;
  let remainingQuarantined = 0;
  const touchedBatchIds = new Set<string>();

  for (const row of pendingItems) {
    const rawJson = row.rawPayloadJson as any;
    const norm: NormalizedGrokbotItem | undefined = rawJson?.normalized;
    if (!norm) {
      remainingQuarantined += 1;
      continue;
    }

    for (const s of norm.agentShares) {
      s.mappedUserId = mapByKey.get(`${norm.insurerKey}:${s.externalCode}`) || null;
    }

    // Si la cuarentena era solo por agente faltante y ya fue mapeado, quitar marca
    const isAnomaly =
      norm.quarantineReason === "NEGATIVE_RECEIPT_ADJUSTMENT" ||
      norm.quarantineReason === "NEGATIVE_NET_ADJUSTMENT" ||
      norm.quarantineReason === "SANITY_LIMIT_EXCEEDED";

    if (isAnomaly && !params.forceApproveAnomalies) {
      remainingQuarantined += 1;
      continue;
    }

    const res = await applyNormalizedItemToDatabase({
      agencyId: agency.id,
      item: norm,
      appliedDateStr,
      insurerCompaniesByKey,
      allowNegativeOverride: Boolean(params.forceApproveAnomalies),
    });

    if (res.applied) {
      appliedCount += 1;
      touchedBatchIds.add(row.batchId);
      await prisma.grokbotSyncItem.update({
        where: { id: row.id },
        data: {
          status: "APPLIED",
          quarantineReason: null,
          mappedUserId: norm.agentShares[0]?.mappedUserId || null,
          appliedDateStr,
          appliedAt: new Date(),
          rollbackLedgerJson: res.ledger as any,
        },
      });
    } else {
      remainingQuarantined += 1;
      await prisma.grokbotSyncItem.update({
        where: { id: row.id },
        data: {
          quarantineReason: res.quarantineReason,
        },
      });
    }
  }

  for (const batchId of Array.from(touchedBatchIds)) {
    await refreshBatchCounters(batchId);
  }

  return { appliedCount, remainingQuarantined };
}

async function refreshBatchCounters(batchId: string) {
  const counts = await prisma.grokbotSyncItem.groupBy({
    by: ["status"],
    where: { batchId },
    _count: { _all: true },
    _sum: { amountMxn: true },
  });

  let applied = 0;
  let quarantined = 0;
  let skipped = 0;
  let rolledBack = 0;
  let appliedMxn = 0;

  for (const c of counts) {
    if (c.status === "APPLIED") {
      applied = c._count._all;
      appliedMxn = Number((c._sum.amountMxn || 0).toFixed(2));
    } else if (c.status === "QUARANTINED") {
      quarantined = c._count._all;
    } else if (c.status === "SKIPPED" || c.status === "IGNORED") {
      skipped += c._count._all;
    } else if (c.status === "ROLLED_BACK") {
      rolledBack += c._count._all;
    }
  }

  const nextStatus =
    applied > 0 && quarantined > 0
      ? "PARTIAL_QUARANTINE"
      : applied > 0
      ? "APPLIED"
      : quarantined > 0
      ? "QUARANTINED_ONLY"
      : rolledBack > 0
      ? "ROLLED_BACK"
      : "NO_CHANGES";

  await prisma.grokbotSyncBatch.update({
    where: { id: batchId },
    data: {
      appliedCount: applied,
      quarantinedCount: quarantined,
      skippedCount: skipped,
      totalAppliedMxn: appliedMxn,
      status: nextStatus,
    },
  });
}

// =========================================================================
// MOTOR DE ROLLBACK POR FECHA Y POR LOTE
// =========================================================================

async function executeReverseRollbackOnItems(params: {
  agencyId: string;
  items: Array<{
    id: string;
    batchId: string;
    externalKey: string;
    rollbackLedgerJson: any;
  }>;
  adminUserId?: string;
}) {
  const { agencyId, adminUserId } = params;
  // Garantizar que ítems que crearon una póliza se reviertan DESPUÉS de ítems hijos sobre la misma póliza,
  // incluso si ocurrieron dentro del mismo milisegundo.
  const items = [...params.items].sort((a, b) => {
    const aTime = (a as any).appliedAt ? new Date((a as any).appliedAt).getTime() : 0;
    const bTime = (b as any).appliedAt ? new Date((b as any).appliedAt).getTime() : 0;
    if (bTime !== aTime) return bTime - aTime;
    const aCreator = (a.rollbackLedgerJson as RollbackLedger | null)?.createdPolicyId ? 1 : 0;
    const bCreator = (b.rollbackLedgerJson as RollbackLedger | null)?.createdPolicyId ? 1 : 0;
    return aCreator - bCreator;
  });
  let revertedItems = 0;
  let deletedPolicies = 0;
  let deletedClients = 0;
  let deletedReceipts = 0;
  let restoredReceipts = 0;
  let deletedEmissions = 0;

  const touchedBatchIds = new Set<string>();
  const stamp = Date.now();

  for (let idx = 0; idx < items.length; idx++) {
    const item = items[idx];
    const ledger = (item.rollbackLedgerJson || {}) as RollbackLedger;
    touchedBatchIds.add(item.batchId);

    await prisma.$transaction(async (tx) => {
      // 1. Revertir AgentEmission
      if (Array.isArray(ledger.createdEmissionIds) && ledger.createdEmissionIds.length > 0) {
        const delEm = await tx.agentEmission.deleteMany({
          where: {
            id: { in: ledger.createdEmissionIds },
            agencyId,
          },
        });
        deletedEmissions += delEm.count;
      }

      if (
        Array.isArray(ledger.updatedEmissionSnapshots) &&
        ledger.updatedEmissionSnapshots.length > 0
      ) {
        for (const emSnap of ledger.updatedEmissionSnapshots) {
          const existsEm = await tx.agentEmission.findFirst({
            where: { id: emSnap.id, agencyId },
          });
          if (existsEm) {
            await tx.agentEmission.update({
              where: { id: emSnap.id },
              data: {
                primaEmitida: emSnap.primaEmitida,
                primaPagada: emSnap.primaPagada,
                status: emSnap.status,
                notes: emSnap.notes,
              },
            });
          }
        }
      }

      // 2. Revertir PolicyReceipt creado o actualizado
      if (ledger.createdReceiptId) {
        const delRec = await tx.policyReceipt.deleteMany({
          where: { id: ledger.createdReceiptId, agencyId },
        });
        deletedReceipts += delRec.count;
      }

      if (ledger.updatedReceiptSnapshot) {
        const rSnap = ledger.updatedReceiptSnapshot;
        const existsRec = await tx.policyReceipt.findFirst({
          where: { id: rSnap.id, agencyId },
        });
        if (existsRec) {
          await tx.policyReceipt.update({
            where: { id: rSnap.id },
            data: {
              status: rSnap.status,
              paidAt: rSnap.paidAt ? new Date(rSnap.paidAt) : null,
              paidAmount: rSnap.paidAmount,
              amount: rSnap.amount,
              paymentNotes: rSnap.paymentNotes,
              syncedEmissionId: rSnap.syncedEmissionId,
            },
          });
          restoredReceipts += 1;
        }
      }

      // 3. Limpiar recibos pendientes generados al cambiar modalidad
      if (
        Array.isArray(ledger.createdPendingReceiptIds) &&
        ledger.createdPendingReceiptIds.length > 0
      ) {
        await tx.policyReceipt.deleteMany({
          where: { id: { in: ledger.createdPendingReceiptIds }, agencyId },
        });
      }

      // 4. Si una póliza existente fue modificada, restaurarla o recrear recibos pendientes
      if (ledger.updatedPolicySnapshot && !ledger.createdPolicyId) {
        const pSnap = ledger.updatedPolicySnapshot;
        const existsPol = await tx.policy.findFirst({
          where: { id: pSnap.id, agencyId },
        });
        if (existsPol) {
          await tx.policy.update({
            where: { id: pSnap.id },
            data: {
              annualPremium: pSnap.annualPremium,
              paymentMethod: pSnap.paymentMethod,
              contractor: pSnap.contractor,
            },
          });

          if (
            Array.isArray(ledger.replacedUnpaidReceipts) &&
            ledger.replacedUnpaidReceipts.length > 0
          ) {
            for (const oldRec of ledger.replacedUnpaidReceipts) {
              const slotExists = await tx.policyReceipt.findUnique({
                where: {
                  policyId_policyYear_receiptNumber: {
                    policyId: pSnap.id,
                    policyYear: oldRec.policyYear,
                    receiptNumber: oldRec.receiptNumber,
                  },
                },
              });
              if (!slotExists) {
                await tx.policyReceipt.create({
                  data: {
                    policyId: pSnap.id,
                    agencyId,
                    userId: existsPol.userId,
                    receiptNumber: oldRec.receiptNumber,
                    totalInstallments: oldRec.totalInstallments,
                    policyYear: oldRec.policyYear,
                    dueDate: new Date(oldRec.dueDate),
                    graceEndDate: new Date(oldRec.graceEndDate),
                    amount: oldRec.amount,
                    status: oldRec.status,
                    adminApproved: true,
                  },
                });
              }
            }
          }
        }
      }

      // 5. Eliminar Policy si fue creada por este ítem y ya no tiene recibos PAGADO activos
      if (ledger.createdPolicyId) {
        const pol = await tx.policy.findFirst({
          where: { id: ledger.createdPolicyId, agencyId },
          include: {
            receipts: { select: { id: true, status: true } },
          },
        });
        if (pol) {
          const stillHasPaidReceipts = pol.receipts.some((r) => r.status === "PAGADO");
          const otherActiveItems = await tx.grokbotSyncItem.count({
            where: {
              agencyId,
              policyNumber: pol.policyNumber,
              status: "APPLIED",
              id: { not: item.id },
            },
          });
          if (!stillHasPaidReceipts && otherActiveItems === 0) {
            await tx.policy.delete({ where: { id: pol.id } });
            deletedPolicies += 1;
          }
        }
      }

      // 6. Restaurar o eliminar Client si fue creado por este ítem y quedó sin pólizas
      if (ledger.updatedClientSnapshot && !ledger.createdClientId) {
        const cSnap = ledger.updatedClientSnapshot;
        await tx.client.updateMany({
          where: { id: cSnap.id, agencyId },
          data: { name: cSnap.name },
        });
      }

      if (ledger.createdClientId) {
        const remainingPolicies = await tx.policy.count({
          where: { clientId: ledger.createdClientId },
        });
        if (remainingPolicies === 0) {
          const delCli = await tx.client.deleteMany({
            where: { id: ledger.createdClientId, agencyId },
          });
          deletedClients += delCli.count;
        }
      }

      // 7. Marcar el item como ROLLED_BACK y liberar externalKey para futura re-ingesta limpia
      const cleanBaseKey = item.externalKey.split("#rb_")[0];
      await tx.grokbotSyncItem.update({
        where: { id: item.id },
        data: {
          status: "ROLLED_BACK",
          rolledBackAt: new Date(),
          externalKey: `${cleanBaseKey}#rb_${stamp}_${idx}`,
        },
      });
    });

    revertedItems += 1;
  }

  for (const batchId of Array.from(touchedBatchIds)) {
    await refreshBatchCounters(batchId);
    const remainingApplied = await prisma.grokbotSyncItem.count({
      where: { batchId, status: "APPLIED" },
    });
    if (remainingApplied === 0) {
      await prisma.grokbotSyncBatch.update({
        where: { id: batchId },
        data: {
          status: "ROLLED_BACK",
          rolledBackAt: new Date(),
          rolledBackById: adminUserId || null,
        },
      });
    }
  }

  return {
    revertedItems,
    deletedPolicies,
    deletedClients,
    deletedReceipts,
    restoredReceipts,
    deletedEmissions,
  };
}

export async function previewRollbackByDateRange(params: {
  fromDateStr: string;
  toDateStr?: string;
  dateField?: "appliedDateStr" | "eventDateStr";
}) {
  const agency = await resolveLockedAacomAgency();
  const fromYmd = params.fromDateStr.trim();
  const toYmd = (params.toDateStr || fromYmd).trim();
  const field = params.dateField === "eventDateStr" ? "eventDateStr" : "appliedDateStr";

  const items = await prisma.grokbotSyncItem.findMany({
    where: {
      agencyId: agency.id,
      status: "APPLIED",
      [field]: {
        gte: fromYmd,
        lte: toYmd,
      },
    },
    select: {
      id: true,
      batchId: true,
      amountMxn: true,
      rollbackLedgerJson: true,
    },
  });

  const batchIds = new Set(items.map((i) => i.batchId));
  let newPoliciesCount = 0;
  let newEmissionsCount = 0;
  let totalMxn = 0;

  for (const it of items) {
    totalMxn += Number(it.amountMxn || 0);
    const ledger = ((it.rollbackLedgerJson as unknown) || {}) as RollbackLedger;
    if (ledger.createdPolicyId) newPoliciesCount += 1;
    if (Array.isArray(ledger.createdEmissionIds)) {
      newEmissionsCount += ledger.createdEmissionIds.length;
    }
  }

  return {
    agencyId: agency.id,
    fromDateStr: fromYmd,
    toDateStr: toYmd,
    dateField: field,
    itemsCount: items.length,
    batchesCount: batchIds.size,
    newPoliciesCount,
    newEmissionsCount,
    totalMxn: Number(totalMxn.toFixed(2)),
  };
}

export async function rollbackByDateRange(params: {
  fromDateStr: string;
  toDateStr?: string;
  dateField?: "appliedDateStr" | "eventDateStr";
  adminUserId?: string;
}) {
  const agency = await resolveLockedAacomAgency();
  const fromYmd = params.fromDateStr.trim();
  const toYmd = (params.toDateStr || fromYmd).trim();
  const field = params.dateField === "eventDateStr" ? "eventDateStr" : "appliedDateStr";

  const items = await prisma.grokbotSyncItem.findMany({
    where: {
      agencyId: agency.id,
      status: "APPLIED",
      [field]: {
        gte: fromYmd,
        lte: toYmd,
      },
    },
    orderBy: [{ appliedAt: "desc" }, { createdAt: "desc" }, { id: "desc" }],
    select: {
      id: true,
      batchId: true,
      externalKey: true,
      appliedAt: true,
      rollbackLedgerJson: true,
    },
  });

  return executeReverseRollbackOnItems({
    agencyId: agency.id,
    items,
    adminUserId: params.adminUserId,
  });
}

export async function rollbackBatchById(params: {
  batchId: string;
  adminUserId?: string;
}) {
  const agency = await resolveLockedAacomAgency();

  const batch = await prisma.grokbotSyncBatch.findFirst({
    where: { id: params.batchId, agencyId: agency.id },
    select: { id: true },
  });
  if (!batch) {
    throw new Error("Lote no encontrado para esta promotoría.");
  }

  const items = await prisma.grokbotSyncItem.findMany({
    where: {
      agencyId: agency.id,
      batchId: params.batchId,
      status: "APPLIED",
    },
    orderBy: [{ appliedAt: "desc" }, { createdAt: "desc" }, { id: "desc" }],
    select: {
      id: true,
      batchId: true,
      externalKey: true,
      appliedAt: true,
      rollbackLedgerJson: true,
    },
  });

  return executeReverseRollbackOnItems({
    agencyId: agency.id,
    items,
    adminUserId: params.adminUserId,
  });
}
