import { format, differenceInCalendarDays } from "date-fns";
import { es } from "date-fns/locale";

/**
 * Convierte cualquier Date o string de la BD (incluso aquellos guardados a las 00:00:00 UTC)
 * en un objeto Date local al mediodía del mismo día calendario UTC.
 * Esto elimina de raíz el BUG-02 (desfase de -1 día en zona horaria America/Mexico_City UTC-6).
 */
export function toCalendarDateLocal(input: Date | string | number | null | undefined): Date | null {
  if (!input) return null;

  if (typeof input === "string") {
    const trimmed = input.trim();
    if (!trimmed) return null;

    // Si viene exactamente como YYYY-MM-DD (de un <input type="date">)
    const ymdMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (ymdMatch) {
      const year = parseInt(ymdMatch[1], 10);
      const month = parseInt(ymdMatch[2], 10) - 1;
      const day = parseInt(ymdMatch[3], 10);
      const d = new Date(year, month, day, 12, 0, 0);
      return isNaN(d.getTime()) ? null : d;
    }

    // Si viene como DD/MM/YYYY o DD-MM-YYYY
    const dmyMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
    if (dmyMatch) {
      const day = parseInt(dmyMatch[1], 10);
      const month = parseInt(dmyMatch[2], 10) - 1;
      let yearStr = dmyMatch[3];
      if (yearStr.length === 2) {
        yearStr = (parseInt(yearStr, 10) > 50 ? "19" : "20") + yearStr;
      }
      const d = new Date(parseInt(yearStr, 10), month, day, 12, 0, 0);
      return isNaN(d.getTime()) ? null : d;
    }
  }

  const d = input instanceof Date ? input : new Date(input);
  if (isNaN(d.getTime())) return null;

  // Extraemos año, mes y día en UTC para que 2023-03-01T00:00:00.000Z sea siempre 1 de marzo de 2023
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 12, 0, 0);
}

/**
 * Convierte una fecha de entrada de formulario o Excel a Date en 12:00:00 UTC
 * para almacenarla en PostgreSQL sin riesgo de cambio de día por huso horario.
 */
export function toUTCNoonDate(input: Date | string | number | null | undefined): Date | null {
  const localCal = toCalendarDateLocal(input);
  if (!localCal) return null;
  return new Date(
    Date.UTC(localCal.getFullYear(), localCal.getMonth(), localCal.getDate(), 12, 0, 0)
  );
}

/**
 * Formatea una fecha garantizando que no sufra el desfase de -1 día por UTC.
 */
export function formatDateSafe(
  input: Date | string | number | null | undefined,
  pattern: string = "dd/MM/yyyy",
  fallback: string = "-"
): string {
  const calDate = toCalendarDateLocal(input);
  if (!calDate) return fallback;
  try {
    return format(calDate, pattern, { locale: es });
  } catch {
    return fallback;
  }
}

/**
 * Devuelve "YYYY-MM-DD" exacto para pre-llenar <input type="date"> sin perder un día ni quedar vacío (BUG-04).
 */
export function toDateInputValue(input: Date | string | number | null | undefined): string {
  const calDate = toCalendarDateLocal(input);
  if (!calDate) return "";
  const yyyy = calDate.getFullYear();
  const mm = String(calDate.getMonth() + 1).padStart(2, "0");
  const dd = String(calDate.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export interface PolicyCycleInfo {
  isLongTerm: boolean;
  eventType: "ANIVERSARIO" | "RENOVACION";
  nextEventDate: Date | null;
  daysUntilNextEvent: number | null;
  policyYear: number | null;
  effectiveCalDate: Date | null;
  renewalCalDate: Date | null;
  maturityDate: Date | null;
  computedStatus: "VIGENTE" | "EN_RIESGO" | "POR_CONFIRMAR" | "CANCELADA" | "TERMINADA";
}

/**
 * Calcula de forma inteligente si una póliza es de Largo Plazo (Vida Individual / Retiro)
 * o Anual Renovable (GMM / Autos / Daños / Vida Grupo), su próximo aniversario o renovación,
 * y el año póliza en curso (resolviendo BUG-01 de las 54 pólizas de Insignia Life).
 */
export function computePolicyCycleInfo(policy: any, referenceDate: Date = new Date()): PolicyCycleInfo {
  const todayCal = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
    12,
    0,
    0
  );

  const effectiveCalDate = toCalendarDateLocal(policy?.effectiveDate);
  const renewalCalDate = toCalendarDateLocal(policy?.renewalDate);

  const rawRamo = (policy?.ramo || "").toUpperCase();
  const rawTipo = (policy?.tipoVigencia || "").toUpperCase();
  const rawProduct = (policy?.product || "").toLowerCase();
  const rawCompany = (policy?.insuranceCompany || "").toLowerCase();

  // Determinar si es póliza de largo plazo (Vida Individual / Ahorro / Retiro)
  let isLongTerm = true;
  if (rawTipo === "ANUAL_RENOVABLE") {
    isLongTerm = false;
  } else if (rawTipo === "LARGO_PLAZO") {
    isLongTerm = true;
  } else if (["GMM", "AUTOS", "DANOS", "VIDA_GRUPO"].includes(rawRamo)) {
    isLongTerm = false;
  } else if (
    rawProduct.includes("gmm") ||
    rawProduct.includes("gastos med") ||
    rawProduct.includes("auto") ||
    rawProduct.includes("hogar") ||
    rawProduct.includes("grupo")
  ) {
    isLongTerm = false;
  } else if (rawCompany.includes("insignia") || rawRamo === "VIDA_INDIVIDUAL" || rawRamo === "AHORRO_RETIRO") {
    isLongTerm = true;
  }

  // En pólizas de Vida de largo plazo, cuando el usuario importó el layout de Insignia,
  // la columna "Fin de Vigencia" (renewalDate) solía traer el aniversario del Año 1 (ej. 1 año después de effectiveDate).
  // Solo consideramos renewalDate como "Fin de Cobertura Definitivo (Maturity)" en largo plazo si está a >= 5 años del inicio.
  let maturityDate: Date | null = null;
  if (isLongTerm && effectiveCalDate && renewalCalDate) {
    const yearsSpan = renewalCalDate.getFullYear() - effectiveCalDate.getFullYear();
    if (yearsSpan >= 5) {
      maturityDate = renewalCalDate;
    }
  } else if (!isLongTerm && renewalCalDate) {
    maturityDate = renewalCalDate;
  }

  // Calcular próximo aniversario o renovación
  let nextEventDate: Date | null = null;
  const annivMonth =
    policy?.anniversaryMonth != null
      ? Number(policy.anniversaryMonth) - 1
      : effectiveCalDate
      ? effectiveCalDate.getMonth()
      : renewalCalDate
      ? renewalCalDate.getMonth()
      : null;

  const annivDay =
    policy?.anniversaryDay != null
      ? Number(policy.anniversaryDay)
      : effectiveCalDate
      ? effectiveCalDate.getDate()
      : renewalCalDate
      ? renewalCalDate.getDate()
      : null;

  if (annivMonth !== null && annivDay !== null) {
    // Construir fecha de aniversario/renovación en el año actual
    let candidate = new Date(todayCal.getFullYear(), annivMonth, annivDay, 12, 0, 0);
    // Si ya pasó hoy (hace más de 0 días), proyectar al siguiente año
    if (differenceInCalendarDays(candidate, todayCal) < 0) {
      candidate = new Date(todayCal.getFullYear() + 1, annivMonth, annivDay, 12, 0, 0);
    }
    nextEventDate = candidate;
  } else if (renewalCalDate) {
    nextEventDate = renewalCalDate;
  }

  const daysUntilNextEvent = nextEventDate
    ? differenceInCalendarDays(nextEventDate, todayCal)
    : null;

  let policyYear: number | null = null;
  if (effectiveCalDate && nextEventDate) {
    policyYear = Math.max(1, nextEventDate.getFullYear() - effectiveCalDate.getFullYear());
  }

  // Estatus de conservación limpio (5 estados principales)
  const rawStatus = (policy?.status || "VIGENTE").toUpperCase();
  let computedStatus: PolicyCycleInfo["computedStatus"] = "VIGENTE";
  if (
    rawStatus === "VIGENTE" ||
    rawStatus === "EN_RIESGO" ||
    rawStatus === "POR_CONFIRMAR" ||
    rawStatus === "CANCELADA" ||
    rawStatus === "TERMINADA"
  ) {
    computedStatus = rawStatus as PolicyCycleInfo["computedStatus"];
  }

  // Si tiene fecha fin de cobertura definitiva (maturityDate en largo plazo >=5 años) y ya pasó, sugerir TERMINADA/POR_CONFIRMAR
  if (
    isLongTerm &&
    maturityDate &&
    differenceInCalendarDays(maturityDate, todayCal) < 0 &&
    computedStatus === "VIGENTE"
  ) {
    computedStatus = "POR_CONFIRMAR";
  }

  return {
    isLongTerm,
    eventType: isLongTerm ? "ANIVERSARIO" : "RENOVACION",
    nextEventDate,
    daysUntilNextEvent,
    policyYear,
    effectiveCalDate,
    renewalCalDate,
    maturityDate,
    computedStatus,
  };
}

export const RAMO_LABELS: Record<string, string> = {
  VIDA_INDIVIDUAL: "Vida Individual",
  AHORRO_RETIRO: "Ahorro / Retiro (PPR)",
  GMM: "Gastos Médicos (GMM)",
  AUTOS: "Autos",
  VIDA_GRUPO: "Vida Grupo",
  DANOS: "Daños / Hogar / PyME",
};

export const STATUS_CONFIG: Record<
  string,
  { label: string; badgeClass: string }
> = {
  VIGENTE: {
    label: "Vigente",
    badgeClass: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  },
  EN_RIESGO: {
    label: "En Gracia / Riesgo",
    badgeClass: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  },
  POR_CONFIRMAR: {
    label: "Por Confirmar",
    badgeClass: "bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30",
  },
  CANCELADA: {
    label: "Cancelada",
    badgeClass: "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30",
  },
  TERMINADA: {
    label: "Terminada / Vencida",
    badgeClass: "bg-slate-500/15 text-slate-700 dark:text-slate-400 border-slate-500/30",
  },
};

export const SUB_STATUS_LABELS: Record<string, string> = {
  SALDADA: "Saldada",
  PRORROGADA: "Prorrogada",
  RESCATADA: "Rescatada",
  NO_TOMADA: "No Tomada (NTU)",
  SINIESTRADA: "Siniestrada",
};

export const COMMON_INSURERS = [
  "Insignia Life",
  "GNP Seguros",
  "AXA Seguros",
  "Seguros Monterrey (SMNYL)",
  "MetLife",
  "Allianz",
  "Prudential",
  "Mapfre",
  "Quálitas",
  "Skandia",
  "Bupa",
  "Chubb",
  "Zurich",
  "Afirme Seguros",
  "Banorte Seguros",
  "Otra",
];

export const PAYMENT_METHODS = [
  "Anual",
  "Semestral",
  "Trimestral",
  "Mensual",
  "Pago Único",
];
