export type AgencyModuleKey =
  | "newsletters"
  | "activity"
  | "pea_prp"
  | "cartera"
  | "team"
  | "ranking"
  | "referidores"
  | "encuesta_satisfaccion"
  | "documentacion"
  | "cotizador"
  | "adn"
  | "tips"
  | "plan_arranque"
  | "academia"
  | "assistant";

export type AgencyModulesConfig = Record<AgencyModuleKey, boolean>;

export interface AgencyModuleDefinition {
  key: AgencyModuleKey;
  label: string;
  description: string;
  pathPrefix: string;
  group: "main" | "tools" | "ai";
  emoji: string;
}

export const AGENCY_MODULE_DEFINITIONS: AgencyModuleDefinition[] = [
  // Barra Principal
  {
    key: "newsletters",
    label: "Newsletters",
    description: "Boletines informativos y noticias del sector para agentes.",
    pathPrefix: "/newsletters",
    group: "main",
    emoji: "📰",
  },
  {
    key: "activity",
    label: "25 Puntos (Actividad Diaria)",
    description: "Registro diario de prospección, citas, cierres y puntos.",
    pathPrefix: "/activity",
    group: "main",
    emoji: "✅",
  },
  {
    key: "pea_prp",
    label: "PEA / PRP / JEP",
    description: "Planeación estratégica anual y revisiones periódicas.",
    pathPrefix: "/pea-prp",
    group: "main",
    emoji: "🎯",
  },
  {
    key: "cartera",
    label: "Mi Cartera",
    description: "Gestión de clientes, pólizas, recibos, renovaciones y venta cruzada.",
    pathPrefix: "/cartera",
    group: "main",
    emoji: "💼",
  },
  {
    key: "team",
    label: "Equipo (Directorio)",
    description: "Directorio de miembros y perfiles de la promotoría.",
    pathPrefix: "/team",
    group: "main",
    emoji: "👥",
  },
  {
    key: "ranking",
    label: "Ranking",
    description: "Tablero mensual de líderes y campañas de incentivos.",
    pathPrefix: "/ranking",
    group: "main",
    emoji: "🏆",
  },
  {
    key: "referidores",
    label: "Mis Referidores",
    description: "Red de referidores vinculada a cada agente (requiere licencia activa).",
    pathPrefix: "/referidores",
    group: "main",
    emoji: "🌐",
  },

  // Menú Herramientas
  {
    key: "encuesta_satisfaccion",
    label: "Encuesta de Satisfacción",
    description: "Cuestionario de calidad de servicio y captación de referidos.",
    pathPrefix: "/encuesta-satisfaccion",
    group: "tools",
    emoji: "😊",
  },
  {
    key: "documentacion",
    label: "Mi Biblioteca",
    description: "Repositorio de manuales, formatos y folletos descargables.",
    pathPrefix: "/documentacion",
    group: "tools",
    emoji: "📚",
  },
  {
    key: "cotizador",
    label: "Cotizador",
    description: "Simulador financiero de ahorro, retiro y protección.",
    pathPrefix: "/cotizador",
    group: "tools",
    emoji: "🧮",
  },
  {
    key: "adn",
    label: "ADN (Diagnóstico)",
    description: "Análisis de Detección de Necesidades financieras para clientes.",
    pathPrefix: "/adn",
    group: "tools",
    emoji: "❤️",
  },
  {
    key: "tips",
    label: "TIPS (Taller en Vivo)",
    description: "Talleres interactivos grupales en tiempo real.",
    pathPrefix: "/tips",
    group: "tools",
    emoji: "🎯",
  },
  {
    key: "plan_arranque",
    label: "Plan de Arranque",
    description: "Ruta guiada de desarrollo e inducción para agentes.",
    pathPrefix: "/plan-arranque",
    group: "tools",
    emoji: "🚀",
  },
  {
    key: "academia",
    label: "Academia y Roleplay",
    description: "Cursos en video y simulador de objeciones con IA.",
    pathPrefix: "/academia",
    group: "tools",
    emoji: "🎓",
  },

  // Menú IA Avanzada
  {
    key: "assistant",
    label: "Asistente IA",
    description: "Copiloto inteligente de lineamientos, cartera y redacción comercial.",
    pathPrefix: "/assistant",
    group: "ai",
    emoji: "🤖",
  },
];

export const DEFAULT_AGENCY_MODULES_CONFIG: AgencyModulesConfig = {
  newsletters: true,
  activity: true,
  pea_prp: true,
  cartera: true,
  team: true,
  ranking: true,
  referidores: true,
  encuesta_satisfaccion: true,
  documentacion: true,
  cotizador: true,
  adn: true,
  tips: true,
  plan_arranque: true,
  academia: true,
  assistant: true,
};

export function parseAgencyModulesConfig(rawJson?: string | null): AgencyModulesConfig {
  const result: AgencyModulesConfig = { ...DEFAULT_AGENCY_MODULES_CONFIG };
  if (!rawJson) return result;
  try {
    const parsed = JSON.parse(rawJson);
    if (parsed && typeof parsed === "object") {
      for (const def of AGENCY_MODULE_DEFINITIONS) {
        if (typeof parsed[def.key] === "boolean") {
          result[def.key] = parsed[def.key];
        }
      }
    }
  } catch {
    // Fallback to defaults if corrupted JSON
  }
  return result;
}

export function isPathBlockedByModuleConfig(
  pathname: string,
  config: AgencyModulesConfig
): boolean {
  if (!pathname || pathname === "/") return false;
  // Never block admin, super-admin, support, profile, or auth paths
  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/agencias") ||
    pathname.startsWith("/support") ||
    pathname.startsWith("/votaciones") ||
    pathname.startsWith("/reportes") ||
    pathname.startsWith("/vendedor")
  ) {
    return false;
  }

  for (const def of AGENCY_MODULE_DEFINITIONS) {
    if (
      pathname === def.pathPrefix ||
      pathname.startsWith(`${def.pathPrefix}/`)
    ) {
      return config[def.key] === false;
    }
  }
  return false;
}
