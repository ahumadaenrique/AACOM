import { computePolicyCycleInfo } from "./dateUtils";

export interface PillarStatus {
  id: "VIDA" | "RETIRO_AHORRO" | "GMM" | "PATRIMONIO";
  title: string;
  shortTitle: string;
  description: string;
  coveredInCartera: boolean;
  coveredInAdnExternal: boolean;
  matchingPolicies: any[];
  crossSellPitch: string;
}

export interface ClientBlindajeAnalysis {
  pillars: PillarStatus[];
  coveredCount: number;
  shieldPercentage: number;
  primaryGap: PillarStatus | null;
  matchedAdn: any | null;
  matchedQuotes: any[];
  recommendedSumaAseguradaVida: number | null;
}

function normalizeName(str?: string | null): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function isNameMatch(nameA?: string | null, nameB?: string | null): boolean {
  const a = normalizeName(nameA);
  const b = normalizeName(nameB);
  if (!a || !b) return false;
  if (a === b || a.includes(b) || b.includes(a)) return true;

  const tokensA = a.split(" ").filter((t) => t.length > 2);
  const tokensB = b.split(" ").filter((t) => t.length > 2);
  if (tokensA.length < 2 || tokensB.length < 2) return false;

  const shared = tokensA.filter((t) => tokensB.includes(t));
  return shared.length >= 2;
}

export function analyzeClientBlindaje(
  client: any,
  adnDiagnostics: any[] = [],
  cotizaciones: any[] = []
): ClientBlindajeAnalysis {
  const activePolicies = (client?.policies || []).filter((p: any) => {
    if (p.isArchived) return false;
    const cycle = computePolicyCycleInfo(p);
    return (
      cycle.computedStatus !== "CANCELADA" &&
      cycle.computedStatus !== "TERMINADA"
    );
  });

  const matchedAdn =
    adnDiagnostics.find((adn) =>
      isNameMatch(client?.name, adn?.clienteNombre)
    ) || null;

  const matchedQuotes = cotizaciones.filter((cot) =>
    isNameMatch(client?.name, cot?.cliente)
  );

  const vidaPolicies = activePolicies.filter((p: any) => {
    const r = (p.ramo || "").toUpperCase();
    const prod = (p.product || "").toLowerCase();
    return (
      r === "VIDA_INDIVIDUAL" ||
      r === "VIDA_GRUPO" ||
      prod.includes("temporal") ||
      prod.includes("orvi") ||
      prod.includes("vpl") ||
      prod.includes("vida")
    );
  });

  const retiroPolicies = activePolicies.filter((p: any) => {
    const r = (p.ramo || "").toUpperCase();
    const prod = (p.product || "").toLowerCase();
    return (
      r === "AHORRO_RETIRO" ||
      prod.includes("ppr") ||
      prod.includes("retiro") ||
      prod.includes("dotal") ||
      prod.includes("ahorro") ||
      prod.includes("imagina") ||
      prod.includes("educa")
    );
  });

  const gmmPolicies = activePolicies.filter((p: any) => {
    const r = (p.ramo || "").toUpperCase();
    const prod = (p.product || "").toLowerCase();
    return (
      r === "GMM" ||
      prod.includes("gmm") ||
      prod.includes("gastos med") ||
      prod.includes("medical") ||
      prod.includes("salud") ||
      prod.includes("linea azul")
    );
  });

  const patrimonioPolicies = activePolicies.filter((p: any) => {
    const r = (p.ramo || "").toUpperCase();
    const prod = (p.product || "").toLowerCase();
    return (
      r === "AUTOS" ||
      r === "DANOS" ||
      prod.includes("auto") ||
      prod.includes("hogar") ||
      prod.includes("daño") ||
      prod.includes("pyme")
    );
  });

  const clientFirstName = (client?.name || "Cliente").split(" ")[0];

  const pillars: PillarStatus[] = [
    {
      id: "VIDA",
      title: "Protección Vida y Familia",
      shortTitle: "Vida Individual",
      description: "Respaldo económico por fallecimiento o invalidez total y permanente.",
      coveredInCartera: vidaPolicies.length > 0,
      coveredInAdnExternal: !!matchedAdn?.hasSeguroVida,
      matchingPolicies: vidaPolicies,
      crossSellPitch: `Hola ${clientFirstName}, revisando tu expediente patrimonial veo que aún tenemos pendiente blindar el pilar de Protección por Fallecimiento e Invalidez (Seguro de Vida) para garantizar la estabilidad de tu familia. ¿Te parece si lo revisamos 10 minutos esta semana?`,
    },
    {
      id: "RETIRO_AHORRO",
      title: "Ahorro y Retiro Deducible (PPR)",
      shortTitle: "Retiro / PPR / Dotal",
      description: "Capital garantizado en UDIs/USD para retiro o metas con beneficio fiscal (Art. 151/93).",
      coveredInCartera: retiroPolicies.length > 0,
      coveredInAdnExternal: !!(matchedAdn?.hasPpr || matchedAdn?.hasSeguroAhorro),
      matchingPolicies: retiroPolicies,
      crossSellPitch: `Hola ${clientFirstName}, dado que ya cuentas con protección en nuestra cartera, me gustaría mostrarte cómo complementar tu estrategia con un Plan Personal de Retiro (PPR) o ahorro en UDIs para hacer deducibles tus aportaciones ante el SAT. ¿Tienes 10 minutos este martes o jueves?`,
    },
    {
      id: "GMM",
      title: "Salud y Gastos Médicos Mayores",
      shortTitle: "Gastos Médicos (GMM)",
      description: "Blindaje patrimonial ante hospitalizaciones, cirugías y enfermedades catastróficas.",
      coveredInCartera: gmmPolicies.length > 0,
      coveredInAdnExternal: !!matchedAdn?.hasGmm,
      matchingPolicies: gmmPolicies,
      crossSellPitch: `Hola ${clientFirstName}, revisando tu blindaje integral vi que ya tenemos cubierta tu póliza de Vida, pero aún tenemos abierta la brecha de Gastos Médicos Mayores para proteger tu patrimonio ante cualquier imprevisto hospitalario. ¿Te gustaría que te prepare una comparativa?`,
    },
    {
      id: "PATRIMONIO",
      title: "Patrimonio (Autos, Hogar o Negocio)",
      shortTitle: "Autos / Daños",
      description: "Protección de bienes materiales, vehículos y responsabilidad civil.",
      coveredInCartera: patrimonioPolicies.length > 0,
      coveredInAdnExternal: false,
      matchingPolicies: patrimonioPolicies,
      crossSellPitch: `Hola ${clientFirstName}, te escribo para recordarte que además de tus pólizas personales también podemos blindar tus Autos, Hogar o Negocio con condiciones preferenciales en cartera. Cuando se acerque la renovación de tu auto avísame para cotizarte.`,
    },
  ];

  const coveredCount = pillars.filter(
    (p) => p.coveredInCartera || p.coveredInAdnExternal
  ).length;
  const shieldPercentage = Math.round((coveredCount / pillars.length) * 100);

  // Priorizar brecha principal (Vida -> Retiro/PPR -> GMM -> Patrimonio)
  const primaryGap =
    pillars.find((p) => !p.coveredInCartera && !p.coveredInAdnExternal) || null;

  // Regla financiera: Suma asegurada recomendada en Vida = 5 a 10 años de ingresos o gastos anuales
  let recommendedSumaAseguradaVida: number | null = null;
  if (matchedAdn?.ingresosNetos && matchedAdn.ingresosNetos > 0) {
    recommendedSumaAseguradaVida = matchedAdn.ingresosNetos * 12 * 5;
  }

  return {
    pillars,
    coveredCount,
    shieldPercentage,
    primaryGap,
    matchedAdn,
    matchedQuotes,
    recommendedSumaAseguradaVida,
  };
}
