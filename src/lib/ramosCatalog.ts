export type RamoGroupKey = "VIDA" | "GMM" | "AUTOS" | "DANOS" | "OTROS";

export type CanonicalSubRamoKey =
  | "VIDA_INDIVIDUAL"
  | "VIDA_GRUPO"
  | "GMM_INDIVIDUAL"
  | "GMM_COLECTIVO"
  | "AUTOS_INDIVIDUAL"
  | "AUTOS_FLOTILLA"
  | "DANOS"
  | "OTROS";

export type VidaObjetivoKey = "PROTECCION" | "AHORRO" | "RETIRO" | "EDUCACION";

export type PeriodMode =
  | "MENSUAL"
  | "BIMESTRAL"
  | "TRIMESTRAL"
  | "SEMESTRAL"
  | "ANUAL"
  | "CUSTOM";

export type BusinessScope = "NUEVA" | "RENOVACION" | "AMBAS";

export interface SubRamoDefinition {
  key: CanonicalSubRamoKey;
  groupKey: RamoGroupKey;
  label: string;
  shortLabel: string;
  groupLabel: string;
  policyRamo: string;
  policySubRamo: string;
  defaultVigencia: "LARGO_PLAZO" | "ANUAL_RENOVABLE";
  colorClass: string;
}

export const RAMO_GROUPS: Array<{
  key: RamoGroupKey;
  label: string;
  subRamos: CanonicalSubRamoKey[];
  accentColor: string;
}> = [
  {
    key: "VIDA",
    label: "Vida",
    subRamos: ["VIDA_INDIVIDUAL", "VIDA_GRUPO"],
    accentColor: "text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300",
  },
  {
    key: "GMM",
    label: "Gastos Médicos",
    subRamos: ["GMM_INDIVIDUAL", "GMM_COLECTIVO"],
    accentColor: "text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300",
  },
  {
    key: "AUTOS",
    label: "Autos",
    subRamos: ["AUTOS_INDIVIDUAL", "AUTOS_FLOTILLA"],
    accentColor: "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300",
  },
  {
    key: "DANOS",
    label: "Daños",
    subRamos: ["DANOS"],
    accentColor: "text-indigo-600 bg-indigo-50 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-300",
  },
  {
    key: "OTROS",
    label: "Otros",
    subRamos: ["OTROS"],
    accentColor: "text-slate-600 bg-slate-50 border-slate-200 dark:bg-slate-900/60 dark:text-slate-300",
  },
];

export const SUB_RAMOS_CATALOG: SubRamoDefinition[] = [
  {
    key: "VIDA_INDIVIDUAL",
    groupKey: "VIDA",
    label: "Vida Individual",
    shortLabel: "Vida Indiv.",
    groupLabel: "Vida",
    policyRamo: "VIDA_INDIVIDUAL",
    policySubRamo: "INDIVIDUAL",
    defaultVigencia: "LARGO_PLAZO",
    colorClass: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300",
  },
  {
    key: "VIDA_GRUPO",
    groupKey: "VIDA",
    label: "Vida Grupo",
    shortLabel: "Vida Grupo",
    groupLabel: "Vida",
    policyRamo: "VIDA_GRUPO",
    policySubRamo: "GRUPO",
    defaultVigencia: "ANUAL_RENOVABLE",
    colorClass: "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300",
  },
  {
    key: "GMM_INDIVIDUAL",
    groupKey: "GMM",
    label: "GMM Individual",
    shortLabel: "GMM Indiv.",
    groupLabel: "Gastos Médicos",
    policyRamo: "GMM",
    policySubRamo: "INDIVIDUAL",
    defaultVigencia: "ANUAL_RENOVABLE",
    colorClass: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300",
  },
  {
    key: "GMM_COLECTIVO",
    groupKey: "GMM",
    label: "GMM Colectivo",
    shortLabel: "GMM Colectivo",
    groupLabel: "Gastos Médicos",
    policyRamo: "GMM",
    policySubRamo: "COLECTIVO",
    defaultVigencia: "ANUAL_RENOVABLE",
    colorClass: "bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/40 dark:text-pink-300",
  },
  {
    key: "AUTOS_INDIVIDUAL",
    groupKey: "AUTOS",
    label: "Autos Individual",
    shortLabel: "Autos Indiv.",
    groupLabel: "Autos",
    policyRamo: "AUTOS",
    policySubRamo: "INDIVIDUAL",
    defaultVigencia: "ANUAL_RENOVABLE",
    colorClass: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300",
  },
  {
    key: "AUTOS_FLOTILLA",
    groupKey: "AUTOS",
    label: "Autos Flotillas",
    shortLabel: "Flotillas",
    groupLabel: "Autos",
    policyRamo: "AUTOS",
    policySubRamo: "FLOTILLA",
    defaultVigencia: "ANUAL_RENOVABLE",
    colorClass: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300",
  },
  {
    key: "DANOS",
    groupKey: "DANOS",
    label: "Daños",
    shortLabel: "Daños",
    groupLabel: "Daños",
    policyRamo: "DANOS",
    policySubRamo: "INDIVIDUAL",
    defaultVigencia: "ANUAL_RENOVABLE",
    colorClass: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300",
  },
  {
    key: "OTROS",
    groupKey: "OTROS",
    label: "Otros",
    shortLabel: "Otros",
    groupLabel: "Otros",
    policyRamo: "OTROS",
    policySubRamo: "INDIVIDUAL",
    defaultVigencia: "ANUAL_RENOVABLE",
    colorClass: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300",
  },
];

export const SUB_RAMO_MAP: Record<CanonicalSubRamoKey, SubRamoDefinition> = SUB_RAMOS_CATALOG.reduce(
  (acc, item) => {
    acc[item.key] = item;
    return acc;
  },
  {} as Record<CanonicalSubRamoKey, SubRamoDefinition>
);

export const VIDA_OBJETIVOS_CATALOG: Array<{
  key: VidaObjetivoKey;
  label: string;
  shortLabel: string;
  badgeClass: string;
}> = [
  {
    key: "PROTECCION",
    label: "Protección",
    shortLabel: "Protección",
    badgeClass: "bg-blue-500/10 text-blue-700 border-blue-500/30 dark:text-blue-300",
  },
  {
    key: "AHORRO",
    label: "Ahorro",
    shortLabel: "Ahorro",
    badgeClass: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-300",
  },
  {
    key: "RETIRO",
    label: "Retiro / PPR",
    shortLabel: "Retiro/PPR",
    badgeClass: "bg-purple-500/10 text-purple-700 border-purple-500/30 dark:text-purple-300",
  },
  {
    key: "EDUCACION",
    label: "Educación",
    shortLabel: "Educación",
    badgeClass: "bg-teal-500/10 text-teal-700 border-teal-500/30 dark:text-teal-300",
  },
];

function normRamoToken(val?: string | null): string {
  return String(val || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase()
    .replace(/[\s\-/.]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function normPlainText(val?: string | null): string {
  return String(val || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function getVidaObjetivoLabel(obj?: string | null): string {
  const norm = normRamoToken(obj);
  const found = VIDA_OBJETIVOS_CATALOG.find((v) => v.key === norm);
  return found ? found.label : "Protección";
}

export interface ClassifiedPolicyRamo {
  groupKey: RamoGroupKey;
  subRamoKey: CanonicalSubRamoKey;
  groupLabel: string;
  subRamoLabel: string;
  vidaObjetivo: VidaObjetivoKey | null;
  vidaObjetivoLabel: string | null;
  fullLabel: string;
}

export function classifyPolicyRamo(policy: {
  ramo?: string | null;
  subRamo?: string | null;
  vidaObjetivo?: string | null;
  product?: string | null;
  observations?: string | null;
  contractor?: string | null;
}): ClassifiedPolicyRamo {
  const rawRamo = normRamoToken(policy.ramo || "VIDA_INDIVIDUAL");
  const rawSubRamo = normRamoToken(policy.subRamo);
  const rawObjetivo = normRamoToken(policy.vidaObjetivo);
  const contextText = `${policy.product || ""} ${policy.observations || ""} ${policy.contractor || ""}`;
  const contextNorm = normPlainText(contextText);

  let subRamoKey: CanonicalSubRamoKey = "VIDA_INDIVIDUAL";
  let vidaObjetivo: VidaObjetivoKey | null = null;

  const isVidaGroupRamo =
    rawRamo === "VIDA_GRUPO" ||
    rawRamo === "VIDA_COLECTIVO" ||
    rawRamo === "VIDA_EMPRESARIAL" ||
    (rawRamo.startsWith("VIDA") && (rawSubRamo === "GRUPO" || rawSubRamo === "COLECTIVO"));

  const isGmmRamo =
    rawRamo === "GMM" ||
    rawRamo.startsWith("GMM_") ||
    rawRamo.startsWith("GASTOS_MEDICOS") ||
    rawRamo === "SALUD";

  const isAutosRamo =
    rawRamo === "AUTOS" ||
    rawRamo === "AUTO" ||
    rawRamo.startsWith("AUTOS_") ||
    rawRamo.startsWith("AUTO_") ||
    rawRamo === "AUTOMOVILES" ||
    rawRamo === "VEHICULOS" ||
    rawRamo === "FLOTILLA" ||
    rawRamo === "FLOTILLAS";

  const isDanosRamo =
    rawRamo === "DANOS" ||
    rawRamo === "DANO" ||
    rawRamo.startsWith("DANO") ||
    ["HOGAR", "CASA_HABITACION", "EMPRESARIAL", "PYME", "INCENDIO", "RC", "RESPONSABILIDAD_CIVIL", "TRANSPORTE"].includes(rawRamo);

  const isOtrosRamo =
    ["OTROS", "OTRO", "MASCOTAS", "VIAJE", "FUNERARIO", "ACCIDENTES_PERSONALES"].includes(rawRamo);

  const isVidaIndividualRamo =
    !isVidaGroupRamo &&
    (rawRamo === "" ||
      rawRamo.startsWith("VIDA") ||
      [
        "AHORRO_RETIRO",
        "PROTECCION",
        "AHORRO",
        "RETIRO",
        "PPR",
        "RETIRO_PPR",
        "EDUCACION",
        "DOTAL",
      ].includes(rawRamo));

  if (isVidaGroupRamo) {
    subRamoKey = "VIDA_GRUPO";
  } else if (isVidaIndividualRamo) {
    subRamoKey = "VIDA_INDIVIDUAL";

    if (rawObjetivo === "PROTECCION") {
      vidaObjetivo = "PROTECCION";
    } else if (rawObjetivo === "AHORRO" || rawObjetivo === "DOTAL") {
      vidaObjetivo = "AHORRO";
    } else if (rawObjetivo === "RETIRO" || rawObjetivo === "PPR" || rawObjetivo === "RETIRO_PPR") {
      vidaObjetivo = "RETIRO";
    } else if (rawObjetivo === "EDUCACION" || rawObjetivo === "BECA") {
      vidaObjetivo = "EDUCACION";
    } else if (rawRamo === "AHORRO_RETIRO" || rawRamo === "RETIRO" || rawRamo === "PPR" || rawRamo === "RETIRO_PPR") {
      vidaObjetivo = "RETIRO";
    } else if (rawRamo === "EDUCACION") {
      vidaObjetivo = "EDUCACION";
    } else if (rawRamo === "AHORRO" || rawRamo === "DOTAL") {
      vidaObjetivo = "AHORRO";
    } else if (rawRamo === "PROTECCION") {
      vidaObjetivo = "PROTECCION";
    } else if (/ppr|retiro|articulo\s*151|imagina\s*ser|consolida|optimaxx/.test(contextNorm)) {
      vidaObjetivo = "RETIRO";
    } else if (/educa|universi|profesional|segu\s*beca|beca/.test(contextNorm)) {
      vidaObjetivo = "EDUCACION";
    } else if (/ahorro|dotal|meta|inversion|vpl/.test(contextNorm)) {
      vidaObjetivo = "AHORRO";
    } else {
      vidaObjetivo = "PROTECCION";
    }
  } else if (isGmmRamo) {
    const gmmIsColectivo =
      rawRamo.includes("COLECTIV") ||
      rawRamo.includes("GRUPO") ||
      rawSubRamo === "COLECTIVO" ||
      rawSubRamo === "GRUPO" ||
      (!rawSubRamo &&
        !rawRamo.includes("INDIV") &&
        /colectiv|empresarial|grupo|pyme|s\.?\s*a\.?\s*de\s*c\.?\s*v|\bs\.?c\.?\b/.test(contextNorm));
    subRamoKey = gmmIsColectivo ? "GMM_COLECTIVO" : "GMM_INDIVIDUAL";
  } else if (isAutosRamo) {
    const autosIsFlotilla =
      rawRamo.includes("FLOT") ||
      rawSubRamo.includes("FLOT") ||
      (!rawSubRamo &&
        !rawRamo.includes("INDIV") &&
        /flotilla|flota|empresarial/.test(contextNorm));
    subRamoKey = autosIsFlotilla ? "AUTOS_FLOTILLA" : "AUTOS_INDIVIDUAL";
  } else if (isDanosRamo) {
    subRamoKey = "DANOS";
  } else if (isOtrosRamo) {
    subRamoKey = "OTROS";
  } else {
    subRamoKey = "OTROS";
  }

  const def = SUB_RAMO_MAP[subRamoKey];
  const vidaObjetivoLabel =
    subRamoKey === "VIDA_INDIVIDUAL" && vidaObjetivo
      ? getVidaObjetivoLabel(vidaObjetivo)
      : null;

  const fullLabel =
    subRamoKey === "VIDA_INDIVIDUAL" && vidaObjetivoLabel
      ? `${def.label} · ${vidaObjetivoLabel}`
      : def.label;

  return {
    groupKey: def.groupKey,
    subRamoKey,
    groupLabel: def.groupLabel,
    subRamoLabel: def.label,
    vidaObjetivo,
    vidaObjetivoLabel,
    fullLabel,
  };
}

export function mapFormSelectionToPolicyFields(
  subRamoKey: CanonicalSubRamoKey,
  vidaObjetivo?: VidaObjetivoKey | null
): {
  ramo: string;
  subRamo: string;
  vidaObjetivo: VidaObjetivoKey | null;
  defaultVigencia: "LARGO_PLAZO" | "ANUAL_RENOVABLE";
} {
  const def = SUB_RAMO_MAP[subRamoKey] || SUB_RAMO_MAP.VIDA_INDIVIDUAL;
  return {
    ramo: def.policyRamo,
    subRamo: def.policySubRamo,
    vidaObjetivo: subRamoKey === "VIDA_INDIVIDUAL" ? (vidaObjetivo || "PROTECCION") : null,
    defaultVigencia: def.defaultVigencia,
  };
}

export function resolveImportedRowRamo(input: {
  ramo?: string | null;
  subRamo?: string | null;
  vidaObjetivo?: string | null;
  product?: string | null;
  insuranceCompany?: string | null;
  observations?: string | null;
  contractor?: string | null;
  explicitTipoVigencia?: string | null;
}): {
  classified: ClassifiedPolicyRamo;
  ramo: string;
  subRamo: string;
  vidaObjetivo: VidaObjetivoKey | null;
  tipoVigencia: string;
} {
  const explicit = String(input.ramo || "").trim();
  const p = normPlainText(input.product);
  const c = normPlainText(input.insuranceCompany);

  let rawRamo = explicit;
  if (!rawRamo) {
    if (p.includes("gmm") || p.includes("gastos med") || p.includes("salud")) {
      rawRamo = "GMM";
    } else if (p.includes("flotilla") || p.includes("flota")) {
      rawRamo = "AUTOS_FLOTILLA";
    } else if (p.includes("auto") || p.includes("vehicul")) {
      rawRamo = "AUTOS";
    } else if (p.includes("vida grupo") || p.includes("grupo") || p.includes("colectiv")) {
      rawRamo = "VIDA_GRUPO";
    } else if (
      p.includes("hogar") ||
      p.includes("dano") ||
      p.includes("pyme") ||
      p.includes("incendio") ||
      /\brc\b/.test(p)
    ) {
      rawRamo = "DANOS";
    } else if (p.includes("ppr") || p.includes("retiro") || p.includes("articulo 151")) {
      rawRamo = "RETIRO";
    } else if (p.includes("educa") || p.includes("beca")) {
      rawRamo = "EDUCACION";
    } else if (p.includes("ahorro") || p.includes("dotal")) {
      rawRamo = "AHORRO";
    } else {
      rawRamo = "VIDA_INDIVIDUAL";
    }
  }

  const classified = classifyPolicyRamo({
    ramo: rawRamo,
    subRamo: input.subRamo,
    vidaObjetivo: input.vidaObjetivo,
    product: input.product,
    observations: input.observations,
    contractor: input.contractor,
  });

  const mapped = mapFormSelectionToPolicyFields(
    classified.subRamoKey,
    classified.vidaObjetivo
  );

  let tipoVigencia = input.explicitTipoVigencia || mapped.defaultVigencia;
  if (!input.explicitTipoVigencia && mapped.ramo === "VIDA_INDIVIDUAL" && c.includes("insignia")) {
    tipoVigencia = "LARGO_PLAZO";
  }

  return {
    classified,
    ramo: mapped.ramo,
    subRamo: mapped.subRamo,
    vidaObjetivo: mapped.vidaObjetivo,
    tipoVigencia,
  };
}

export function mapHistoricalEmissionRamoToPolicy(
  rawRamo: string | null | undefined,
  notes?: string | null,
  clientName?: string | null
): {
  ramo: string;
  subRamo: string;
  vidaObjetivo: VidaObjetivoKey | null;
  tipoVigencia: "LARGO_PLAZO" | "ANUAL_RENOVABLE";
  subRamoKey: CanonicalSubRamoKey;
} {
  const r = String(rawRamo || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
  const context = `${notes || ""} ${clientName || ""}`;

  if (/vida\s*grupo/i.test(context) || r.includes("vida grupo")) {
    return {
      ramo: "VIDA_GRUPO",
      subRamo: "GRUPO",
      vidaObjetivo: null,
      tipoVigencia: "ANUAL_RENOVABLE",
      subRamoKey: "VIDA_GRUPO",
    };
  }

  if (r.includes("gastos") || r.includes("gmm") || r.includes("salud")) {
    const isColectivo = /colectiv|grupo|empresarial|\bs\.?\s*c\.?\b|\bs\.?\s*a\.?\b/i.test(context);
    return {
      ramo: "GMM",
      subRamo: isColectivo ? "COLECTIVO" : "INDIVIDUAL",
      vidaObjetivo: null,
      tipoVigencia: "ANUAL_RENOVABLE",
      subRamoKey: isColectivo ? "GMM_COLECTIVO" : "GMM_INDIVIDUAL",
    };
  }

  if (r.includes("auto")) {
    const isFlotilla = /flotilla|flota|solucion\s+comercial|\bs\.?\s*a\.?\b|\bs\.?\s*c\.?\b/i.test(context);
    return {
      ramo: "AUTOS",
      subRamo: isFlotilla ? "FLOTILLA" : "INDIVIDUAL",
      vidaObjetivo: null,
      tipoVigencia: "ANUAL_RENOVABLE",
      subRamoKey: isFlotilla ? "AUTOS_FLOTILLA" : "AUTOS_INDIVIDUAL",
    };
  }

  if (r.includes("dano") || r.includes("empresarial")) {
    return {
      ramo: "DANOS",
      subRamo: "INDIVIDUAL",
      vidaObjetivo: null,
      tipoVigencia: "ANUAL_RENOVABLE",
      subRamoKey: "DANOS",
    };
  }

  if (r.includes("otro")) {
    return {
      ramo: "OTROS",
      subRamo: "INDIVIDUAL",
      vidaObjetivo: null,
      tipoVigencia: "ANUAL_RENOVABLE",
      subRamoKey: "OTROS",
    };
  }

  if (r.includes("retiro") || r.includes("ppr")) {
    return {
      ramo: "VIDA_INDIVIDUAL",
      subRamo: "INDIVIDUAL",
      vidaObjetivo: "RETIRO",
      tipoVigencia: "LARGO_PLAZO",
      subRamoKey: "VIDA_INDIVIDUAL",
    };
  }

  if (r.includes("ahorro") || r.includes("dotal")) {
    return {
      ramo: "VIDA_INDIVIDUAL",
      subRamo: "INDIVIDUAL",
      vidaObjetivo: "AHORRO",
      tipoVigencia: "LARGO_PLAZO",
      subRamoKey: "VIDA_INDIVIDUAL",
    };
  }

  if (r.includes("educa")) {
    return {
      ramo: "VIDA_INDIVIDUAL",
      subRamo: "INDIVIDUAL",
      vidaObjetivo: "EDUCACION",
      tipoVigencia: "LARGO_PLAZO",
      subRamoKey: "VIDA_INDIVIDUAL",
    };
  }

  // Default: Protección / Vida Individual
  return {
    ramo: "VIDA_INDIVIDUAL",
    subRamo: "INDIVIDUAL",
    vidaObjetivo: "PROTECCION",
    tipoVigencia: "LARGO_PLAZO",
    subRamoKey: "VIDA_INDIVIDUAL",
  };
}

// =========================================================================
// NORMALIZACIÓN CANÓNICA DE ASEGURADORAS
// =========================================================================

export function normalizeCompanyKey(raw: string | null | undefined): string {
  return String(raw || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export function canonicalCompanyName(raw: string | null | undefined): string {
  const key = normalizeCompanyKey(raw);
  switch (key) {
    case "insignia":
    case "insignia life":
      return "Insignia Life";
    case "gnp":
    case "gnp seguros":
    case "grupo nacional provincial":
      return "GNP Seguros";
    case "la latino":
    case "la latino seguros":
    case "la latinoamericana":
    case "la latinoamericana seguros":
      return "La Latinoamericana Seguros";
    case "plan seguro":
      return "Plan Seguro";
    case "smnyl":
    case "monterrey":
    case "seguros monterrey":
    case "seguros monterrey nyl":
    case "seguros monterrey (smnyl)":
      return "Seguros Monterrey NYL";
    case "axa":
    case "axa seguros":
      return "AXA Seguros";
    case "metlife":
      return "MetLife";
    case "qualitas":
      return "Quálitas";
    case "mapfre":
      return "Mapfre";
    case "allianz":
      return "Allianz";
    default:
      return String(raw || "").trim();
  }
}

// =========================================================================
// UTILIDADES DE FECHA SEGURAS (CALENDARIO YYYY-MM-DD) Y TEMPORALIDADES
// =========================================================================

export function toYmdKey(dateInput: Date | string | null | undefined): string | null {
  if (!dateInput) return null;
  if (typeof dateInput === "string") {
    const trimmed = dateInput.trim();
    const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) return `${match[1]}-${match[2]}-${match[3]}`;
    const parsed = new Date(trimmed);
    if (isNaN(parsed.getTime())) return null;
    const y = parsed.getUTCFullYear();
    const m = String(parsed.getUTCMonth() + 1).padStart(2, "0");
    const d = String(parsed.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  if (isNaN(dateInput.getTime())) return null;
  const y = dateInput.getUTCFullYear();
  const m = String(dateInput.getUTCMonth() + 1).padStart(2, "0");
  const d = String(dateInput.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function lastDayOfMonth(year: number, month1To12: number): number {
  return new Date(Date.UTC(year, month1To12, 0)).getUTCDate();
}

const MONTH_SHORT_ES = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

const MONTH_FULL_ES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export interface ResolvedPeriodRange {
  periodMode: PeriodMode;
  year: number;
  subPeriod: number;
  startYmd: string;
  endYmd: string;
  label: string;
  monthsIncluded: Array<{ year: number; month: number }>;
}

export function resolvePeriodDateRange(params: {
  periodMode?: PeriodMode;
  year: number;
  subPeriod?: number; // 1..12 mensual, 1..6 bimestral, 1..4 trimestral, 1..2 semestral
  startDate?: string | null;
  endDate?: string | null;
}): ResolvedPeriodRange {
  const mode: PeriodMode = params.periodMode || "MENSUAL";
  const year = Number(params.year) || new Date().getFullYear();

  const buildMonths = (y: number, startM: number, endM: number) => {
    const arr: Array<{ year: number; month: number }> = [];
    for (let m = startM; m <= endM; m++) {
      arr.push({ year: y, month: m });
    }
    return arr;
  };

  if (mode === "CUSTOM") {
    const fallbackStart = `${year}-01-01`;
    const fallbackEnd = `${year}-12-31`;
    let s = toYmdKey(params.startDate) || fallbackStart;
    let e = toYmdKey(params.endDate) || fallbackEnd;
    if (s > e) {
      const tmp = s;
      s = e;
      e = tmp;
    }

    const [sy, sm] = s.split("-").map((n) => parseInt(n, 10));
    const [ey, em] = e.split("-").map((n) => parseInt(n, 10));
    const monthsIncluded: Array<{ year: number; month: number }> = [];
    let cy = sy;
    let cm = sm;
    let guard = 0;
    while ((cy < ey || (cy === ey && cm <= em)) && guard < 36) {
      monthsIncluded.push({ year: cy, month: cm });
      cm += 1;
      if (cm > 12) {
        cm = 1;
        cy += 1;
      }
      guard += 1;
    }

    return {
      periodMode: "CUSTOM",
      year: sy,
      subPeriod: 1,
      startYmd: s,
      endYmd: e,
      label: `Del ${s} al ${e}`,
      monthsIncluded,
    };
  }

  if (mode === "ANUAL") {
    return {
      periodMode: "ANUAL",
      year,
      subPeriod: 1,
      startYmd: `${year}-01-01`,
      endYmd: `${year}-12-31`,
      label: `Año completo ${year}`,
      monthsIncluded: buildMonths(year, 1, 12),
    };
  }

  if (mode === "SEMESTRAL") {
    const sem = params.subPeriod === 2 ? 2 : 1;
    const startM = sem === 1 ? 1 : 7;
    const endM = sem === 1 ? 6 : 12;
    const startStr = String(startM).padStart(2, "0");
    const endStr = String(endM).padStart(2, "0");
    return {
      periodMode: "SEMESTRAL",
      year,
      subPeriod: sem,
      startYmd: `${year}-${startStr}-01`,
      endYmd: `${year}-${endStr}-${String(lastDayOfMonth(year, endM)).padStart(2, "0")}`,
      label: `Semestre ${sem} (${MONTH_SHORT_ES[startM - 1]}–${MONTH_SHORT_ES[endM - 1]} ${year})`,
      monthsIncluded: buildMonths(year, startM, endM),
    };
  }

  if (mode === "TRIMESTRAL") {
    const q = Math.min(4, Math.max(1, Number(params.subPeriod) || 1));
    const startM = (q - 1) * 3 + 1;
    const endM = startM + 2;
    return {
      periodMode: "TRIMESTRAL",
      year,
      subPeriod: q,
      startYmd: `${year}-${String(startM).padStart(2, "0")}-01`,
      endYmd: `${year}-${String(endM).padStart(2, "0")}-${String(lastDayOfMonth(year, endM)).padStart(2, "0")}`,
      label: `Trimestre ${q} (${MONTH_SHORT_ES[startM - 1]}–${MONTH_SHORT_ES[endM - 1]} ${year})`,
      monthsIncluded: buildMonths(year, startM, endM),
    };
  }

  if (mode === "BIMESTRAL") {
    const b = Math.min(6, Math.max(1, Number(params.subPeriod) || 1));
    const startM = (b - 1) * 2 + 1;
    const endM = startM + 1;
    return {
      periodMode: "BIMESTRAL",
      year,
      subPeriod: b,
      startYmd: `${year}-${String(startM).padStart(2, "0")}-01`,
      endYmd: `${year}-${String(endM).padStart(2, "0")}-${String(lastDayOfMonth(year, endM)).padStart(2, "0")}`,
      label: `Bimestre ${b} (${MONTH_SHORT_ES[startM - 1]}–${MONTH_SHORT_ES[endM - 1]} ${year})`,
      monthsIncluded: buildMonths(year, startM, endM),
    };
  }

  // MENSUAL
  const m = Math.min(12, Math.max(1, Number(params.subPeriod) || 1));
  const mStr = String(m).padStart(2, "0");
  return {
    periodMode: "MENSUAL",
    year,
    subPeriod: m,
    startYmd: `${year}-${mStr}-01`,
    endYmd: `${year}-${mStr}-${String(lastDayOfMonth(year, m)).padStart(2, "0")}`,
    label: `${MONTH_FULL_ES[m - 1]} ${year}`,
    monthsIncluded: [{ year, month: m }],
  };
}

export function getDefaultSubPeriodForMonth(mode: PeriodMode, month1To12: number): number {
  const m = Math.min(12, Math.max(1, month1To12));
  switch (mode) {
    case "BIMESTRAL":
      return Math.ceil(m / 2);
    case "TRIMESTRAL":
      return Math.ceil(m / 3);
    case "SEMESTRAL":
      return m <= 6 ? 1 : 2;
    case "ANUAL":
    case "CUSTOM":
      return 1;
    case "MENSUAL":
    default:
      return m;
  }
}
