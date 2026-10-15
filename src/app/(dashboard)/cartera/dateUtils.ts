import { format, differenceInCalendarDays, addMonths, addDays } from "date-fns";
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

/**
 * Calcula la edad actual exacta del cliente y cuántos días faltan para su próximo cumpleaños.
 */
export function calculateClientAgeInfo(
  birthDate: Date | string | number | null | undefined,
  referenceDate: Date = new Date()
): { age: number; daysUntilBirthday: number } | null {
  const birthCal = toCalendarDateLocal(birthDate);
  if (!birthCal) return null;

  const todayCal = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
    12,
    0,
    0
  );

  let age = todayCal.getFullYear() - birthCal.getFullYear();
  const monthDiff = todayCal.getMonth() - birthCal.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && todayCal.getDate() < birthCal.getDate())) {
    age--;
  }
  if (age < 0 || age > 120) return null;

  let nextBirthday = new Date(
    todayCal.getFullYear(),
    birthCal.getMonth(),
    birthCal.getDate(),
    12,
    0,
    0
  );
  if (nextBirthday.getTime() < todayCal.getTime()) {
    nextBirthday = new Date(
      todayCal.getFullYear() + 1,
      birthCal.getMonth(),
      birthCal.getDate(),
      12,
      0,
      0
    );
  }
  const daysUntilBirthday = differenceInCalendarDays(nextBirthday, todayCal);

  return { age, daysUntilBirthday };
}

export interface PolicyCycleInfo {
  isLongTerm: boolean;
  eventType: "ANIVERSARIO" | "RENOVACION";
  nextEventDate: Date | null;
  daysUntilNextEvent: number | null;
  policyYear: number | null;
  currentPolicyYear: number;
  currentCycleStartDate: Date | null;
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

  let maturityDate: Date | null = null;
  if (isLongTerm && effectiveCalDate && renewalCalDate) {
    const yearsSpan = renewalCalDate.getFullYear() - effectiveCalDate.getFullYear();
    if (yearsSpan >= 5) {
      maturityDate = renewalCalDate;
    }
  } else if (!isLongTerm && renewalCalDate) {
    maturityDate = renewalCalDate;
  }

  let nextEventDate: Date | null = null;
  let currentCycleStartDate: Date | null = null;

  const firstReceiptCalDate =
    Array.isArray(policy?.receipts) && policy.receipts.length > 0
      ? toCalendarDateLocal(policy.receipts[0]?.dueDate)
      : null;
  const createdCalDate = toCalendarDateLocal(policy?.createdAt);
  const fallbackRefDate =
    effectiveCalDate || renewalCalDate || firstReceiptCalDate || createdCalDate;

  const rawAnnivMonth =
    policy?.anniversaryMonth != null ? Number(policy.anniversaryMonth) : NaN;
  const rawAnnivDay =
    policy?.anniversaryDay != null ? Number(policy.anniversaryDay) : NaN;

  const annivMonth =
    !isNaN(rawAnnivMonth) && rawAnnivMonth >= 1 && rawAnnivMonth <= 12
      ? rawAnnivMonth - 1
      : fallbackRefDate
      ? fallbackRefDate.getMonth()
      : null;

  const annivDay =
    !isNaN(rawAnnivDay) && rawAnnivDay >= 1 && rawAnnivDay <= 31
      ? rawAnnivDay
      : fallbackRefDate
      ? fallbackRefDate.getDate()
      : null;

  if (annivMonth !== null && annivDay !== null) {
    const annivThisYear = new Date(todayCal.getFullYear(), annivMonth, annivDay, 12, 0, 0);
    if (differenceInCalendarDays(annivThisYear, todayCal) < 0) {
      currentCycleStartDate = annivThisYear;
      nextEventDate = new Date(todayCal.getFullYear() + 1, annivMonth, annivDay, 12, 0, 0);
    } else {
      currentCycleStartDate = new Date(todayCal.getFullYear() - 1, annivMonth, annivDay, 12, 0, 0);
      if (effectiveCalDate && differenceInCalendarDays(currentCycleStartDate, effectiveCalDate) < 0) {
        currentCycleStartDate = effectiveCalDate;
      }
      nextEventDate = annivThisYear;
    }
  } else if (renewalCalDate) {
    nextEventDate = renewalCalDate;
    currentCycleStartDate = effectiveCalDate;
  }

  const daysUntilNextEvent = nextEventDate
    ? differenceInCalendarDays(nextEventDate, todayCal)
    : null;

  let policyYear: number | null = null;
  let currentPolicyYear = 1;
  if (effectiveCalDate && nextEventDate) {
    policyYear = Math.max(1, nextEventDate.getFullYear() - effectiveCalDate.getFullYear());
  }
  if (effectiveCalDate && currentCycleStartDate) {
    currentPolicyYear = Math.max(
      1,
      currentCycleStartDate.getFullYear() - effectiveCalDate.getFullYear() + 1
    );
  }

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
    currentPolicyYear,
    currentCycleStartDate,
    effectiveCalDate,
    renewalCalDate,
    maturityDate,
    computedStatus,
  };
}

/**
 * Determina cuántos recibos al año genera una forma de pago.
 */
export function getInstallmentsForPaymentMethod(paymentMethod?: string | null): number {
  const pm = (paymentMethod || "").toLowerCase().trim();
  if (pm.includes("mensual") || pm === "12") return 12;
  if (pm.includes("trimestral") || pm === "4") return 4;
  if (pm.includes("semestral") || pm === "2") return 2;
  return 1; // Anual o Pago Único
}

export interface GeneratedReceiptDraft {
  policyId: string;
  agencyId: string | null;
  userId: string;
  receiptNumber: number;
  totalInstallments: number;
  policyYear: number;
  dueDate: Date;
  graceEndDate: Date;
  amount: number;
  status: string;
  paidAt: Date | null;
}

/**
 * Construye el calendario de recibos del año póliza en curso para una póliza.
 * Si `autoMarkHistoricalPaid` es true (ej. al inicializar recibos de pólizas históricas ya vigentes),
 * los recibos cuya fecha límite de gracia venció hace más de 35 días se marcan como PAGADO
 * para no inundar la bandeja del agente con recibos antiguos de principios de año.
 */
export function buildPolicyReceiptsDrafts(
  policy: any,
  options: { autoMarkHistoricalPaid?: boolean; referenceDate?: Date } = {}
): GeneratedReceiptDraft[] {
  const referenceDate = options.referenceDate || new Date();
  const autoMarkHistoricalPaid = options.autoMarkHistoricalPaid ?? true;

  const todayCal = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
    12,
    0,
    0
  );

  const cycle = computePolicyCycleInfo(policy, referenceDate);
  const startCal = cycle.currentCycleStartDate || cycle.effectiveCalDate || todayCal;
  const policyYear = cycle.currentPolicyYear || 1;
  const totalInstallments = getInstallmentsForPaymentMethod(policy?.paymentMethod);
  const monthsStep = 12 / totalInstallments;
  const installmentAmount = Number(
    ((Number(policy?.annualPremium) || 0) / totalInstallments).toFixed(2)
  );

  const drafts: GeneratedReceiptDraft[] = [];

  for (let i = 1; i <= totalInstallments; i++) {
    const dueLocal = addMonths(startCal, (i - 1) * monthsStep);
    const graceEndLocal = addDays(dueLocal, 30);

    const dueUTC = toUTCNoonDate(dueLocal) || dueLocal;
    const graceUTC = toUTCNoonDate(graceEndLocal) || graceEndLocal;

    const daysSinceDue = differenceInCalendarDays(todayCal, dueLocal);

    let status = "PENDIENTE";
    let paidAt: Date | null = null;

    if (autoMarkHistoricalPaid && daysSinceDue > 40) {
      // Recibo histórico anterior al mes actual en póliza vigente
      status = "PAGADO";
      paidAt = dueUTC;
    } else if (daysSinceDue >= 0 && daysSinceDue <= 30) {
      status = "EN_GRACIA";
    } else if (daysSinceDue > 30) {
      status = "POR_CONFIRMAR";
    }

    drafts.push({
      policyId: policy.id,
      agencyId: policy.agencyId || null,
      userId: policy.userId,
      receiptNumber: i,
      totalInstallments,
      policyYear,
      dueDate: dueUTC,
      graceEndDate: graceUTC,
      amount: installmentAmount,
      status,
      paidAt,
    });
  }

  // Además, si el próximo aniversario/renovación está a <= 45 días, pre-generar el Recibo 1 del nuevo año póliza
  if (
    cycle.nextEventDate &&
    cycle.daysUntilNextEvent !== null &&
    cycle.daysUntilNextEvent >= 0 &&
    cycle.daysUntilNextEvent <= 45 &&
    cycle.policyYear &&
    cycle.policyYear > policyYear
  ) {
    const nextDueLocal = cycle.nextEventDate;
    const nextGraceLocal = addDays(nextDueLocal, 30);
    drafts.push({
      policyId: policy.id,
      agencyId: policy.agencyId || null,
      userId: policy.userId,
      receiptNumber: 1,
      totalInstallments,
      policyYear: cycle.policyYear,
      dueDate: toUTCNoonDate(nextDueLocal) || nextDueLocal,
      graceEndDate: toUTCNoonDate(nextGraceLocal) || nextGraceLocal,
      amount: installmentAmount,
      status: "PENDIENTE",
      paidAt: null,
    });
  }

  return drafts;
}

export interface ReceiptLiveInfo {
  liveStatus: "PAGADO" | "EN_GRACIA" | "POR_CONFIRMAR" | "PROXIMO" | "PENDIENTE" | "NO_PAGADO";
  label: string;
  badgeClass: string;
  daysSinceDue: number;
  daysUntilDue: number;
  graceDay: number | null;
  daysLeftInGrace: number | null;
}

/**
 * Calcula en tiempo real el estado de cobranza y días de gracia de un recibo.
 */
export function computeReceiptLiveStatus(
  receipt: any,
  referenceDate: Date = new Date()
): ReceiptLiveInfo {
  const todayCal = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
    12,
    0,
    0
  );

  const dueCal = toCalendarDateLocal(receipt?.dueDate) || todayCal;
  const daysSinceDue = differenceInCalendarDays(todayCal, dueCal);
  const daysUntilDue = differenceInCalendarDays(dueCal, todayCal);

  if (receipt?.status === "PAGADO") {
    return {
      liveStatus: "PAGADO",
      label: "Pagado",
      badgeClass: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
      daysSinceDue,
      daysUntilDue,
      graceDay: null,
      daysLeftInGrace: null,
    };
  }

  if (receipt?.status === "NO_PAGADO") {
    return {
      liveStatus: "NO_PAGADO",
      label: "No Pagado",
      badgeClass: "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30",
      daysSinceDue,
      daysUntilDue,
      graceDay: null,
      daysLeftInGrace: null,
    };
  }

  // Si está en sus 30 días naturales de periodo de gracia (0 <= daysSinceDue <= 30)
  if (daysSinceDue >= 0 && daysSinceDue <= 30) {
    const graceDay = Math.max(1, daysSinceDue);
    const daysLeftInGrace = Math.max(0, 30 - daysSinceDue);
    return {
      liveStatus: "EN_GRACIA",
      label: `En Gracia (Día ${graceDay}/30 • Quedan ${daysLeftInGrace}d)`,
      badgeClass: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/40",
      daysSinceDue,
      daysUntilDue,
      graceDay,
      daysLeftInGrace,
    };
  }

  // Si ya pasaron los 30 días de gracia sin confirmación de pago (Gracia Presunta -> Por Confirmar)
  if (daysSinceDue > 30) {
    return {
      liveStatus: "POR_CONFIRMAR",
      label: `Por Confirmar (+${daysSinceDue}d desde inicio)`,
      badgeClass: "bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/40",
      daysSinceDue,
      daysUntilDue,
      graceDay: 30,
      daysLeftInGrace: 0,
    };
  }

  // Si vence en los próximos 30 días
  if (daysUntilDue >= 0 && daysUntilDue <= 30) {
    return {
      liveStatus: "PROXIMO",
      label: daysUntilDue === 0 ? "Vence Hoy" : `Vence en ${daysUntilDue}d`,
      badgeClass: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30",
      daysSinceDue,
      daysUntilDue,
      graceDay: null,
      daysLeftInGrace: null,
    };
  }

  return {
    liveStatus: "PENDIENTE",
    label: `Programado (${formatDateSafe(dueCal, "dd MMM yyyy")})`,
    badgeClass: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
    daysSinceDue,
    daysUntilDue,
    graceDay: null,
    daysLeftInGrace: null,
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
