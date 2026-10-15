// Motor Matemático y de Scoring para TIPS (Taller Integral de Planeación y Seguridad)
// 100% Marca Blanca para aacomsoft y promotorías

export interface TipsStep1General {
  fullName: string;
  birthDate: string; // YYYY-MM-DD
  age?: number;
  maritalStatus: 'SOLTERO' | 'CASADO' | 'UNION_LIBRE' | 'DIVORCIADO' | 'VIUDO';
  dependentsCount: number;
  dependentsDetail?: Array<{ name?: string; age: number; relationship: string }>;
}

export type TipsAssetCategory =
  | 'INMUEBLE'
  | 'VEHICULO'
  | 'INVERSION'
  | 'NEGOCIO'
  | 'SEGURO_AHORRO'
  | 'ARTE_JOYAS'
  | 'FONDO_EMERGENCIA'
  | 'OTRO';

export interface TipsAssetItem {
  id: string;
  category: TipsAssetCategory;
  description: string;
  value: number;
  annualRatePct: number; // ej. 6 para 6%
  liquidity: 'ALTA' | 'MEDIA' | 'BAJA';
}

export interface TipsDebtItem {
  id: string;
  type: 'BUENA' | 'MALA'; // BUENA = Hipoteca / PyME, MALA = TDC / Consumo CAT alto
  description: string;
  balance: number;
  annualCatPct: number;
  monthlyPayment: number;
}

export interface TipsStep2Patrimony {
  assets: TipsAssetItem[];
  debts: TipsDebtItem[];
}

export interface TipsStep3Income {
  monthlyIncome: number;
}

export interface TipsStep4Retirement {
  desiredRetirementAge: number;
  desiredPensionPct: number; // % del sueldo mensual actual, ej. 80%
  imssRegime: 'LEY_73' | 'LEY_97' | 'NINGUNO' | 'NO_SE';
  aforeBalance: number;
  hasPpr: boolean;
  pprBalance: number;
  pprMonthlyContribution: number;
}

export type TipsDreamCategory = 'PROPIO' | 'DEPENDIENTES' | 'TRASCENDENCIA';

export interface TipsDreamItem {
  id: string;
  name: string;
  category: TipsDreamCategory;
  targetAmount: number;
  yearsToGoal: number;
  priority: number;
}

export interface TipsStep5Dreams {
  dreams: TipsDreamItem[];
}

export interface TipsStep6Savings {
  savingsPct: number; // Recomendado 16%
  monthlySavingsAmount?: number;
}

export type TipsInsuranceType =
  | 'VIDA'
  | 'INVALIDEZ'
  | 'GMM'
  | 'VIDA_AHORRO'
  | 'AUTO'
  | 'HOGAR';

export interface TipsInsuranceItem {
  id: string;
  type: TipsInsuranceType;
  company: string;
  insuredSum: number;
  annualPremium?: number;
  perceptionScore: number; // 1 a 5 estrellas
}

export interface TipsStep7Insurance {
  policies: TipsInsuranceItem[];
  hasLifeInsurance: boolean;
  hasDisabilityInsurance: boolean;
  hasGmm: boolean;
  hasAutoInsurance: boolean;
  hasHomeInsurance: boolean;
}

export interface TipsCustomParams {
  realReturnRatePct: number; // default 4.0%
  inflationRatePct: number; // default 4.5%
  lifeExpectancy: number; // default 82.3
}

export interface TipsOpportunityGap {
  code: 'VIDA' | 'INVALIDEZ' | 'GMM' | 'RETIRO_PPR' | 'AUTOS' | 'HOGAR';
  ramo: string;
  title: string;
  severity: 'ALTA' | 'MEDIA' | 'BAJA';
  recommendedCoverage: number;
  currentCoverage: number;
  gapAmount: number;
  reason: string;
}

export interface TipsCalculatedResults {
  age: number;
  monthlyIncome: number;
  annualIncome: number;
  // Paso 2: Patrimonio
  totalAssets: number;
  totalGoodDebts: number;
  totalBadDebts: number;
  totalDebts: number;
  netWorth: number;
  integratedReturnRatePct: number;
  diversificationScore: number; // 0 - 100
  patrimonyQualificationScore: number; // 0 - 100
  patrimonySemaphore: 'VERDE' | 'AMARILLO' | 'ROJO';
  assetsByCategory: Record<string, number>;
  // Paso 3: Número Mágico
  magicNumber: number;
  magicNumberMultiplier: number;
  magicNumberRatioPct: number; // Qué % del número mágico cubre hoy su patrimonio neto
  magicNumberGap: number;
  // Paso 4: Jubilación y Cinta Métrica
  tapeMeasure: {
    yearsLived: number;
    productiveYearsLeft: number;
    retirementYears: number;
    desiredRetirementAge: number;
    lifeExpectancy: number;
  };
  desiredMonthlyPension: number;
  retirementCapitalRequired: number;
  retirementCapitalProjected: number;
  retirementGap: number;
  retirementMonthlySavingsNeeded: number;
  // Paso 5 y 6: Sueños y Ahorro 16%
  recommendedSavingsPct: number;
  recommendedMonthlySavings: number;
  selectedSavingsPct: number;
  selectedMonthlySavings: number;
  evaluatedDreams: Array<
    TipsDreamItem & {
      monthlyPmtRequired: number;
      reachableWithCurrentSavings: boolean;
      shortfallMonthly: number;
    }
  >;
  totalDreamsMonthlyRequired: number;
  // Paso 7: Capital Humano y Huecos de Seguro
  humanCapitalValue: number;
  recommendedLifeSumMin: number; // 7x ingreso anual
  recommendedLifeSumIdeal: number; // 10x ingreso anual
  currentLifeSum: number;
  detectedGaps: TipsOpportunityGap[];
  // Scoring
  leadScore: number;
  leadTier: 'HOT' | 'WARM' | 'COLD';
  scoreBreakdown: {
    progressPoints: number; // max 40
    completenessPoints: number; // max 25
    gapsPoints: number; // max 25
    rhythmPoints: number; // max 10
  };
}

export const DEFAULT_TIPS_PARAMS: TipsCustomParams = {
  realReturnRatePct: 4.0,
  inflationRatePct: 4.5,
  lifeExpectancy: 82.3,
};

export const ASSET_REFERENCE_RATES: Record<TipsAssetCategory, { label: string; defaultRatePct: number; hint: string }> = {
  INMUEBLE: { label: 'Bienes Inmuebles', defaultRatePct: 6.0, hint: '4% a 8% anual sobre inflación' },
  INVERSION: { label: 'Inversiones / Fondos / CETES', defaultRatePct: 8.5, hint: 'Rendimiento financiero anual' },
  NEGOCIO: { label: 'Negocios Propios', defaultRatePct: 18.0, hint: '15% a 30% anual estimado' },
  SEGURO_AHORRO: { label: 'Seguros con Ahorro / PPR', defaultRatePct: 7.5, hint: 'Garantizado + rendimientos UDI/USD' },
  FONDO_EMERGENCIA: { label: 'Fondo de Emergencia / Liquidez', defaultRatePct: 5.0, hint: 'Cuenta a la vista o pagaré' },
  ARTE_JOYAS: { label: 'Arte, Joyas o Colecciones', defaultRatePct: 3.0, hint: 'Conservación de valor' },
  VEHICULO: { label: 'Vehículos / Autos', defaultRatePct: -15.0, hint: '-30% año 1 y -15% anual después' },
  OTRO: { label: 'Otros Activos', defaultRatePct: 4.0, hint: 'Otros bienes patrimoniales' },
};

/**
 * Calcula la edad exacta a partir de fecha de nacimiento YYYY-MM-DD
 */
export function calculateAgeFromBirthDate(birthDate?: string | null, fallbackAge = 35): number {
  if (!birthDate) return fallbackAge;
  const parsed = new Date(birthDate);
  if (isNaN(parsed.getTime())) return fallbackAge;
  const now = new Date();
  let age = now.getUTCFullYear() - parsed.getUTCFullYear();
  const m = now.getUTCMonth() - parsed.getUTCMonth();
  if (m < 0 || (m === 0 && now.getUTCDate() < parsed.getUTCDate())) {
    age--;
  }
  return Math.max(18, Math.min(99, age));
}

/**
 * Fórmula oficial Número Mágico:
 * numero_magico = max(0, (edad² × 0.05 − edad × 1.1) × ingreso_mensual)
 * Criterio de aceptación: edad 42 e ingreso 50,000 => 2,100,000; < 22 años => 0
 */
export function calculateMagicNumber(age: number, monthlyIncome: number): {
  magicNumber: number;
  multiplier: number;
} {
  if (age < 22 || monthlyIncome <= 0) {
    return { magicNumber: 0, multiplier: 0 };
  }
  const rawMultiplier = age * age * 0.05 - age * 1.1;
  const cleanMultiplier = Math.max(0, Math.round(rawMultiplier * 10000) / 10000);
  const magicNumber = Math.round(cleanMultiplier * monthlyIncome);
  return {
    magicNumber,
    multiplier: cleanMultiplier,
  };
}

/**
 * Fórmula oficial Capital Humano (Impacto por fallecimiento o invalidez):
 * (Edad jubilación − Edad actual) × Sueldo anual
 * Criterio de aceptación: 45 años, jubilación 65, sueldo 50,000 mensuales => 12,000,000
 */
export function calculateHumanCapital(
  currentAge: number,
  desiredRetirementAge: number,
  monthlyIncome: number
): number {
  const productiveYears = Math.max(0, desiredRetirementAge - currentAge);
  const annualIncome = Math.max(0, monthlyIncome) * 12;
  return Math.round(productiveYears * annualIncome);
}

/**
 * Pago mensual requerido (PMT) para alcanzar un monto futuro con tasa mensual real
 */
export function calculateMonthlyPmt(
  targetAmount: number,
  years: number,
  annualRealRatePct: number
): number {
  const months = Math.max(1, Math.round(years * 12));
  if (targetAmount <= 0) return 0;
  const monthlyRate = annualRealRatePct / 100 / 12;
  if (monthlyRate <= 0) {
    return Math.round(targetAmount / months);
  }
  const factor = Math.pow(1 + monthlyRate, months) - 1;
  if (factor <= 0) return Math.round(targetAmount / months);
  return Math.round((targetAmount * monthlyRate) / factor);
}

/**
 * Ejecuta el motor completo de los 8 pasos de TIPS y genera el diagnóstico + scoring
 */
export function evaluateTipsDiagnostic(input: {
  completedStep: number;
  isLagging?: boolean;
  step1?: Partial<TipsStep1General> | null;
  step2?: Partial<TipsStep2Patrimony> | null;
  step3?: Partial<TipsStep3Income> | null;
  step4?: Partial<TipsStep4Retirement> | null;
  step5?: Partial<TipsStep5Dreams> | null;
  step6?: Partial<TipsStep6Savings> | null;
  step7?: Partial<TipsStep7Insurance> | null;
  customParams?: Partial<TipsCustomParams> | null;
}): TipsCalculatedResults {
  const params: TipsCustomParams = {
    ...DEFAULT_TIPS_PARAMS,
    ...(input.customParams || {}),
  };

  // Paso 1: Edad
  const age =
    typeof input.step1?.age === 'number' && input.step1.age > 0
      ? input.step1.age
      : calculateAgeFromBirthDate(input.step1?.birthDate, 38);

  // Paso 3: Ingreso mensual
  const monthlyIncome = Math.max(0, Number(input.step3?.monthlyIncome || 0));
  const annualIncome = monthlyIncome * 12;

  // Paso 2: Patrimonio Neto, Tasa Integrada y Diversificación
  const assets = Array.isArray(input.step2?.assets) ? input.step2!.assets : [];
  const debts = Array.isArray(input.step2?.debts) ? input.step2!.debts : [];

  const assetsByCategory: Record<string, number> = {};
  let totalAssets = 0;
  let weightedRateSum = 0;

  for (const item of assets) {
    const val = Math.max(0, Number(item.value || 0));
    const rate = Number(item.annualRatePct ?? ASSET_REFERENCE_RATES[item.category]?.defaultRatePct ?? 0);
    totalAssets += val;
    weightedRateSum += val * rate;
    const cat = item.category || 'OTRO';
    assetsByCategory[cat] = (assetsByCategory[cat] || 0) + val;
  }

  let totalGoodDebts = 0;
  let totalBadDebts = 0;
  for (const debt of debts) {
    const bal = Math.max(0, Number(debt.balance || 0));
    if (debt.type === 'BUENA') {
      totalGoodDebts += bal;
    } else {
      totalBadDebts += bal;
    }
  }
  const totalDebts = totalGoodDebts + totalBadDebts;
  const netWorth = totalAssets - totalDebts;
  const integratedReturnRatePct =
    totalAssets > 0 ? Number((weightedRateSum / totalAssets).toFixed(2)) : 0;

  // Índice de Diversificación (1 - HHI normalizado sobre hasta 5 categorías productivas)
  let diversificationScore = 0;
  if (totalAssets > 0) {
    let hhi = 0;
    for (const cat of Object.keys(assetsByCategory)) {
      const share = assetsByCategory[cat] / totalAssets;
      hhi += share * share;
    }
    // Si tiene 1 sola categoría hhi=1 -> score 15; si reparte en 4+ categorías -> ~85-100
    const rawDiv = ((1 - hhi) / 0.75) * 100;
    diversificationScore = Math.max(10, Math.min(100, Math.round(rawDiv)));
  }

  // Calificación integral del patrimonio (0-100)
  const badDebtPenalty =
    totalAssets > 0 ? Math.min(40, Math.round((totalBadDebts / totalAssets) * 100)) : totalBadDebts > 0 ? 40 : 0;
  const rateScore = Math.max(0, Math.min(100, Math.round(((integratedReturnRatePct + 5) / 15) * 100)));
  const patrimonyQualificationScore =
    totalAssets === 0 && totalDebts === 0
      ? 0
      : Math.max(5, Math.min(100, Math.round(diversificationScore * 0.5 + rateScore * 0.5 - badDebtPenalty)));

  const patrimonySemaphore: 'VERDE' | 'AMARILLO' | 'ROJO' =
    patrimonyQualificationScore >= 70 ? 'VERDE' : patrimonyQualificationScore >= 45 ? 'AMARILLO' : 'ROJO';

  // Paso 3: Número Mágico
  const { magicNumber, multiplier: magicNumberMultiplier } = calculateMagicNumber(age, monthlyIncome);
  const magicNumberRatioPct =
    magicNumber > 0 ? Math.max(0, Math.min(200, Math.round((netWorth / magicNumber) * 100))) : 0;
  const magicNumberGap = Math.max(0, magicNumber - Math.max(0, netWorth));

  // Paso 4: Jubilación y Cinta Métrica
  const desiredRetirementAge = Math.max(
    age + 1,
    Math.min(85, Number(input.step4?.desiredRetirementAge || 65))
  );
  const effectiveLifeExpectancy = Math.max(params.lifeExpectancy, desiredRetirementAge + 5);
  const productiveYearsLeft = Math.max(0, desiredRetirementAge - age);
  const retirementYears = Number(Math.max(1, effectiveLifeExpectancy - desiredRetirementAge).toFixed(1));

  const desiredPensionPct = Math.max(10, Math.min(150, Number(input.step4?.desiredPensionPct || 80)));
  const desiredMonthlyPension = Math.round(monthlyIncome * (desiredPensionPct / 100));

  // Capital requerido a valor presente al momento del retiro con tasa real
  const monthlyRealRate = params.realReturnRatePct / 100 / 12;
  const retirementMonths = Math.round(retirementYears * 12);
  const retirementCapitalRequired =
    monthlyRealRate > 0
      ? Math.round(
          desiredMonthlyPension * ((1 - Math.pow(1 + monthlyRealRate, -retirementMonths)) / monthlyRealRate)
        )
      : Math.round(desiredMonthlyPension * retirementMonths);

  // Proyección de fondos actuales de retiro (Afore + PPR + Inversiones/Seguros de ahorro)
  const currentRetirementSeed =
    Math.max(0, Number(input.step4?.aforeBalance || 0)) +
    Math.max(0, Number(input.step4?.pprBalance || 0)) +
    (assetsByCategory['SEGURO_AHORRO'] || 0) +
    (assetsByCategory['INVERSION'] || 0) * 0.5;

  const pprMonthly = Math.max(0, Number(input.step4?.pprMonthlyContribution || 0));
  const accumulationMonths = productiveYearsLeft * 12;

  const fvSeed =
    accumulationMonths > 0
      ? currentRetirementSeed * Math.pow(1 + monthlyRealRate, accumulationMonths)
      : currentRetirementSeed;
  const fvContributions =
    accumulationMonths > 0 && monthlyRealRate > 0
      ? pprMonthly * ((Math.pow(1 + monthlyRealRate, accumulationMonths) - 1) / monthlyRealRate)
      : pprMonthly * accumulationMonths;

  const retirementCapitalProjected = Math.round(fvSeed + fvContributions);
  const retirementGap = Math.max(0, retirementCapitalRequired - retirementCapitalProjected);
  const retirementMonthlySavingsNeeded =
    productiveYearsLeft > 0
      ? calculateMonthlyPmt(retirementGap, productiveYearsLeft, params.realReturnRatePct)
      : 0;

  // Paso 5 y 6: Sueños y Ahorro (16% recomendado)
  const recommendedSavingsPct = 16;
  const recommendedMonthlySavings = Math.round(monthlyIncome * 0.16);
  const selectedSavingsPct = Math.max(
    0,
    Math.min(80, Number(input.step6?.savingsPct ?? recommendedSavingsPct))
  );
  const selectedMonthlySavings = Math.round(monthlyIncome * (selectedSavingsPct / 100));

  const rawDreams = Array.isArray(input.step5?.dreams) ? [...input.step5!.dreams] : [];
  rawDreams.sort((a, b) => (a.priority || 99) - (b.priority || 99));

  let remainingMonthlyBudget = selectedMonthlySavings;
  let totalDreamsMonthlyRequired = 0;

  const evaluatedDreams = rawDreams.map((dream, idx) => {
    const amount = Math.max(0, Number(dream.targetAmount || 0));
    const years = Math.max(1, Number(dream.yearsToGoal || 5));
    const monthlyPmtRequired = calculateMonthlyPmt(amount, years, params.realReturnRatePct);
    totalDreamsMonthlyRequired += monthlyPmtRequired;

    const reachableWithCurrentSavings = remainingMonthlyBudget >= monthlyPmtRequired && monthlyPmtRequired > 0;
    const shortfallMonthly = reachableWithCurrentSavings
      ? 0
      : Math.max(0, monthlyPmtRequired - Math.max(0, remainingMonthlyBudget));

    remainingMonthlyBudget = Math.max(0, remainingMonthlyBudget - monthlyPmtRequired);

    return {
      ...dream,
      priority: dream.priority || idx + 1,
      monthlyPmtRequired,
      reachableWithCurrentSavings,
      shortfallMonthly,
    };
  });

  // Paso 7: Capital Humano y Huecos de Seguro
  const humanCapitalValue = calculateHumanCapital(age, desiredRetirementAge, monthlyIncome);
  const recommendedLifeSumMin = annualIncome * 7;
  const recommendedLifeSumIdeal = annualIncome * 10;

  const insurancePolicies = Array.isArray(input.step7?.policies) ? input.step7!.policies : [];
  const currentLifeSum = insurancePolicies
    .filter((p) => p.type === 'VIDA' || p.type === 'VIDA_AHORRO')
    .reduce((acc, p) => acc + Math.max(0, Number(p.insuredSum || 0)), 0);

  const hasDisability =
    Boolean(input.step7?.hasDisabilityInsurance) ||
    insurancePolicies.some((p) => p.type === 'INVALIDEZ' && Number(p.insuredSum || 0) > 0);
  const hasGmm =
    Boolean(input.step7?.hasGmm) ||
    insurancePolicies.some((p) => p.type === 'GMM');
  const hasAuto =
    Boolean(input.step7?.hasAutoInsurance) ||
    insurancePolicies.some((p) => p.type === 'AUTO');
  const hasHome =
    Boolean(input.step7?.hasHomeInsurance) ||
    insurancePolicies.some((p) => p.type === 'HOGAR');

  const detectedGaps: TipsOpportunityGap[] = [];

  if (annualIncome > 0 && currentLifeSum < recommendedLifeSumMin) {
    detectedGaps.push({
      code: 'VIDA',
      ramo: 'VIDA_INDIVIDUAL',
      title: 'Protección de Vida e Ingreso Familiar (7× a 10× Sueldo Anual)',
      severity: 'ALTA',
      recommendedCoverage: recommendedLifeSumMin,
      currentCoverage: currentLifeSum,
      gapAmount: Math.max(0, recommendedLifeSumMin - currentLifeSum),
      reason:
        currentLifeSum === 0
          ? 'No cuenta con suma asegurada por fallecimiento para respaldar su capital humano.'
          : `Su suma asegurada actual cubre menos de 7 años de ingreso familiar.`,
    });
  }

  if (!hasDisability && humanCapitalValue > 0) {
    detectedGaps.push({
      code: 'INVALIDEZ',
      ramo: 'VIDA_INDIVIDUAL',
      title: 'Blindaje por Invalidez Total y Permanente',
      severity: 'ALTA',
      recommendedCoverage: humanCapitalValue,
      currentCoverage: 0,
      gapAmount: humanCapitalValue,
      reason: `En caso de invalidez antes de los ${desiredRetirementAge} años, están en riesgo $${humanCapitalValue.toLocaleString('es-MX')} de ingresos futuros.`,
    });
  }

  if (!hasGmm) {
    detectedGaps.push({
      code: 'GMM',
      ramo: 'GMM',
      title: 'Gastos Médicos Mayores (Blindaje Patrimonial)',
      severity: 'ALTA',
      recommendedCoverage: 50000000,
      currentCoverage: 0,
      gapAmount: 50000000,
      reason: 'Un evento médico mayor sin póliza obligaría a liquidar activos o adquirir deuda cara.',
    });
  }

  if (retirementGap > 0) {
    detectedGaps.push({
      code: 'RETIRO_PPR',
      ramo: 'AHORRO_RETIRO',
      title: 'Plan Personal de Retiro (PPR / Seguro con Ahorro)',
      severity: retirementGap > annualIncome * 3 ? 'ALTA' : 'MEDIA',
      recommendedCoverage: retirementCapitalRequired,
      currentCoverage: retirementCapitalProjected,
      gapAmount: retirementGap,
      reason: `Existe una brecha de retiro de $${retirementGap.toLocaleString('es-MX')} para alcanzar la pensión deseada a los ${desiredRetirementAge} años.`,
    });
  }

  if ((assetsByCategory['VEHICULO'] || 0) > 0 && !hasAuto) {
    detectedGaps.push({
      code: 'AUTOS',
      ramo: 'AUTOS',
      title: 'Seguro de Automóvil y Responsabilidad Civil',
      severity: 'MEDIA',
      recommendedCoverage: assetsByCategory['VEHICULO'],
      currentCoverage: 0,
      gapAmount: assetsByCategory['VEHICULO'],
      reason: 'Declaró vehículos en su patrimonio sin póliza vigente registrada.',
    });
  }

  if ((assetsByCategory['INMUEBLE'] || 0) > 0 && !hasHome) {
    detectedGaps.push({
      code: 'HOGAR',
      ramo: 'DANOS',
      title: 'Seguro de Hogar / Protección Patrimonial Inmobiliaria',
      severity: 'MEDIA',
      recommendedCoverage: assetsByCategory['INMUEBLE'],
      currentCoverage: 0,
      gapAmount: assetsByCategory['INMUEBLE'],
      reason: 'Cuenta con bienes inmuebles sin cobertura contra daños, sismo o responsabilidad civil.',
    });
  }

  // 6. Scoring del Lead (0-100 puntos)
  // - Avance (pasos completados de 8): 40%
  // - Completitud de campos clave (ingreso, patrimonio, sueños, seguros): 25%
  // - Huecos de seguro detectados (vida < 7x, sin invalidez, sin GMM): 25%
  // - Ritmo / tiempo activo: 10%
  const clampedStep = Math.max(0, Math.min(8, input.completedStep || 0));
  const progressPoints = Math.round((clampedStep / 8) * 40);

  let completenessPoints = 0;
  if (monthlyIncome > 0) completenessPoints += 8;
  if (assets.length > 0 || debts.length > 0) completenessPoints += 6;
  if (rawDreams.length > 0) completenessPoints += 6;
  if (input.step7 !== undefined && input.step7 !== null) completenessPoints += 5;

  let gapsPoints = 0;
  if (detectedGaps.some((g) => g.code === 'VIDA')) gapsPoints += 10;
  if (detectedGaps.some((g) => g.code === 'INVALIDEZ')) gapsPoints += 8;
  if (detectedGaps.some((g) => g.code === 'GMM')) gapsPoints += 7;
  else if (detectedGaps.some((g) => g.code === 'RETIRO_PPR')) gapsPoints += 7;
  gapsPoints = Math.min(25, gapsPoints);

  const rhythmPoints = input.isLagging ? 4 : clampedStep >= 4 ? 10 : 6;

  const leadScore = Math.max(
    0,
    Math.min(100, progressPoints + completenessPoints + gapsPoints + rhythmPoints)
  );

  // Clasificación confirmada en ficha:
  // Caliente (HOT): completa 8/8 pasos y tiene >= 70 puntos
  // Tibio (WARM): entre 40 y 69 (o >= 70 sin haber terminado 8/8)
  // Frío (COLD): < 40 puntos
  const leadTier: 'HOT' | 'WARM' | 'COLD' =
    clampedStep >= 8 && leadScore >= 70 ? 'HOT' : leadScore >= 40 ? 'WARM' : 'COLD';

  return {
    age,
    monthlyIncome,
    annualIncome,
    totalAssets,
    totalGoodDebts,
    totalBadDebts,
    totalDebts,
    netWorth,
    integratedReturnRatePct,
    diversificationScore,
    patrimonyQualificationScore,
    patrimonySemaphore,
    assetsByCategory,
    magicNumber,
    magicNumberMultiplier,
    magicNumberRatioPct,
    magicNumberGap,
    tapeMeasure: {
      yearsLived: age,
      productiveYearsLeft,
      retirementYears,
      desiredRetirementAge,
      lifeExpectancy: effectiveLifeExpectancy,
    },
    desiredMonthlyPension,
    retirementCapitalRequired,
    retirementCapitalProjected,
    retirementGap,
    retirementMonthlySavingsNeeded,
    recommendedSavingsPct,
    recommendedMonthlySavings,
    selectedSavingsPct,
    selectedMonthlySavings,
    evaluatedDreams,
    totalDreamsMonthlyRequired,
    humanCapitalValue,
    recommendedLifeSumMin,
    recommendedLifeSumIdeal,
    currentLifeSum,
    detectedGaps,
    leadScore,
    leadTier,
    scoreBreakdown: {
      progressPoints,
      completenessPoints,
      gapsPoints,
      rhythmPoints,
    },
  };
}
