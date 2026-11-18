export type ActivityCaptureType =
  | 'SIMPLE'
  | 'PROSPECT_NAME'
  | 'FULL_NAME'
  | 'REFERRAL_P200'
  | 'ISSUED_POLICY';

export interface SalesActivityItem {
  id: string;
  name: string;
  value: number;
  description: string;
  captureType: ActivityCaptureType;
  active: boolean;
}

export type ActivityLogDetails =
  | {
      kind: 'CLOSING_APPOINTMENT';
      firstName: string;
      lastName: string;
      fullName: string;
    }
  | {
      kind: 'REFERRAL';
      firstName: string;
      lastName: string;
      fullName: string;
      phone: string;
      notes: string;
      project200ContactId?: string;
    }
  | {
      kind: 'ISSUED_POLICY';
      contractor: string;
      ramo: string;
      indicativePremium: number;
      isIndicativeOnly: true;
    };

export const ACTIVITY_CATALOG_SETTING_PREFIX = 'agency_activity_catalog_';

export const ISSUED_POLICY_RAMOS = [
  'Vida Individual',
  'Gastos Médicos Individual',
  'Autos Individual',
  'Vida Grupo',
  'Gastos Médicos Colectivo',
  'Autos Flotilla',
  'Daños',
  'Otros',
] as const;

export const SALES_ACTIVITIES: SalesActivityItem[] = [
  {
    id: '1',
    name: 'Llamada telefónica',
    value: 1,
    description:
      'Hiciste una llamada que derivó en una cita programada CON FECHA Y HORA ó Hiciste una llamada que derivó en al menos 2 referidos.',
    captureType: 'SIMPLE',
    active: true,
  },
  {
    id: '2',
    name: 'Cita Agendada',
    value: 2,
    description:
      'Agendaste una reunión en tu calendario para ver a un prospecto NUEVO (No se incluyen renovaciones, cobranza, seguimiento, etc...).',
    captureType: 'PROSPECT_NAME',
    active: true,
  },
  {
    id: '3',
    name: 'Cita Efectiva',
    value: 3,
    description:
      'Tuviste una cita con un CLIENTE NUEVO, o un cliente tuyo para revisar un PRODUCTO NUEVO.',
    captureType: 'PROSPECT_NAME',
    active: true,
  },
  {
    id: '4',
    name: 'Cita de cierre de póliza',
    value: 5,
    description:
      'Tuviste una reunión con un prospecto o cliente para presentar y cerrar un NUEVO PRODUCTO.',
    captureType: 'FULL_NAME',
    active: true,
  },
  {
    id: '5',
    name: 'Referido obtenido',
    value: 3,
    description:
      'Obtuviste un referido CALIFICADO con nombre, teléfono e información de él.',
    captureType: 'REFERRAL_P200',
    active: true,
  },
  {
    id: '6',
    name: 'Póliza emitida y pagada',
    value: 8,
    description:
      'La compañía emitió y tu cliente PAGÓ una póliza ó producto asesorado por ti.',
    captureType: 'ISSUED_POLICY',
    active: true,
  },
  {
    id: '7',
    name: 'RDA',
    value: 8,
    description:
      'Referido de Asesor, le trajiste un asesor ó futuro asesor que INICIÓ proceso con tu promotoría.',
    captureType: 'SIMPLE',
    active: true,
  },
];

export const TRAFFIC_LIGHT_THRESHOLDS = {
  RED: 15, // 0-15
  YELLOW: 24, // 16-24
  // GREEN: 25+
};

const VALID_CATALOG_IDS = new Set(['1', '2', '3', '4', '5', '6', '7', '8']);

const FIXED_CAPTURE_TYPES: Record<string, ActivityCaptureType> = {
  '1': 'SIMPLE',
  '2': 'PROSPECT_NAME',
  '3': 'PROSPECT_NAME',
  '4': 'FULL_NAME',
  '5': 'REFERRAL_P200',
  '6': 'ISSUED_POLICY',
  '7': 'SIMPLE',
  '8': 'SIMPLE',
};

export function getDefaultSalesActivities(): SalesActivityItem[] {
  return SALES_ACTIVITIES.map((a) => ({ ...a }));
}

export function validateCustomActivityCatalog(
  items: SalesActivityItem[]
): { ok: true; normalized: SalesActivityItem[] } | { ok: false; message: string } {
  if (!Array.isArray(items)) {
    return { ok: false, message: 'Formato de catálogo inválido.' };
  }

  const seenIds = new Set<string>();
  const normalized: SalesActivityItem[] = [];

  for (const raw of items) {
    const id = String(raw?.id || '').trim();
    if (!VALID_CATALOG_IDS.has(id)) {
      return { ok: false, message: `Identificador de actividad no válido: "${id}".` };
    }
    if (seenIds.has(id)) {
      return { ok: false, message: `Concepto duplicado con ID ${id}.` };
    }
    seenIds.add(id);

    const active = raw?.active !== false;
    const name = String(raw?.name || '').trim();
    const description = String(raw?.description || '').trim();
    const value = Math.round(Number(raw?.value));

    if (active) {
      if (name.length < 2) {
        return {
          ok: false,
          message: `Todos los conceptos activos deben tener un nombre de al menos 2 caracteres (concepto #${id}).`,
        };
      }
      if (!Number.isInteger(value) || value < 1 || value > 25) {
        return {
          ok: false,
          message: `El puntaje de "${name}" debe ser un número entero entre 1 y 25.`,
        };
      }
      if (!description) {
        return {
          ok: false,
          message: `El concepto "${name}" debe incluir una descripción de cuándo cuenta para puntos.`,
        };
      }
    }

    normalized.push({
      id,
      name: name || SALES_ACTIVITIES.find((a) => a.id === id)?.name || `Concepto ${id}`,
      value: Number.isInteger(value) && value >= 1 && value <= 25 ? value : 1,
      description:
        description ||
        SALES_ACTIVITIES.find((a) => a.id === id)?.description ||
        'Actividad comercial personalizada de la promotoría.',
      captureType: FIXED_CAPTURE_TYPES[id] || 'SIMPLE',
      active,
    });
  }

  const activeItems = normalized.filter((item) => item.active);
  if (activeItems.length < 6 || activeItems.length > 8) {
    return {
      ok: false,
      message: `Debes mantener mínimo 6 y máximo 8 conceptos activos (actualmente tienes ${activeItems.length}).`,
    };
  }

  normalized.sort((a, b) => Number(a.id) - Number(b.id));
  return { ok: true, normalized };
}

export function parseAgencyEditorCatalog(rawJson?: string | null): SalesActivityItem[] {
  const defaults = getDefaultSalesActivities();
  if (!rawJson) return defaults;

  try {
    const parsed = JSON.parse(rawJson);
    if (!Array.isArray(parsed)) return defaults;

    const byId = new Map<string, any>();
    for (const row of parsed) {
      const id = String(row?.id || '').trim();
      if (VALID_CATALOG_IDS.has(id)) {
        byId.set(id, row);
      }
    }

    const merged: SalesActivityItem[] = defaults.map((def) => {
      const saved = byId.get(def.id);
      if (!saved) return def;
      const numVal = Math.round(Number(saved.value));
      return {
        id: def.id,
        name: String(saved.name || '').trim() || def.name,
        value: Number.isInteger(numVal) && numVal >= 1 && numVal <= 25 ? numVal : def.value,
        description: String(saved.description || '').trim() || def.description,
        captureType: FIXED_CAPTURE_TYPES[def.id] || def.captureType,
        active: saved.active !== false,
      };
    });

    const savedEight = byId.get('8');
    if (savedEight) {
      const numVal = Math.round(Number(savedEight.value));
      merged.push({
        id: '8',
        name: String(savedEight.name || '').trim() || 'Actividad personalizada',
        value: Number.isInteger(numVal) && numVal >= 1 && numVal <= 25 ? numVal : 2,
        description:
          String(savedEight.description || '').trim() ||
          'Actividad comercial adicional definida por tu promotoría.',
        captureType: 'SIMPLE',
        active: savedEight.active !== false,
      });
    }

    const check = validateCustomActivityCatalog(merged);
    return check.ok ? check.normalized : defaults;
  } catch {
    return defaults;
  }
}

export function parseAgencyActivityCatalog(rawJson?: string | null): SalesActivityItem[] {
  return parseAgencyEditorCatalog(rawJson).filter((item) => item.active !== false);
}

function normalizePhoneSegment(rawSegment: string): string {
  let str = String(rawSegment || '').trim();
  if (!str) return '';

  if (/^[+-]?\d+(\.\d+)?e[+-]?\d+$/i.test(str)) {
    const num = Number(str);
    if (!Number.isNaN(num) && Number.isFinite(num)) {
      str = Math.round(num).toString();
    }
  }

  str = str.replace(/\.0+$/, '');
  str = str.replace(/\b(ext|extension|extensi[oó]n|x)\.?\s*\d+.*$/i, '');

  const digits = str.replace(/\D/g, '');
  if (!digits) return '';

  if (
    digits.length === 13 &&
    (digits.startsWith('521') || digits.startsWith('044') || digits.startsWith('045'))
  ) {
    return digits.slice(3);
  }
  if (digits.length === 12 && (digits.startsWith('52') || digits.startsWith('01'))) {
    return digits.slice(2);
  }
  if (digits.length === 11 && digits.startsWith('1')) {
    return digits.slice(1);
  }
  if (digits.length > 10) {
    return digits.slice(-10);
  }
  return digits;
}

export function normalizePhone10(rawPhone: string | number | null | undefined): string {
  const rawStr =
    typeof rawPhone === 'number' && Number.isFinite(rawPhone)
      ? Math.round(rawPhone).toString()
      : String(rawPhone ?? '').trim();
  if (!rawStr) return '';

  const segments = rawStr.split(/[\/|;]|\s+o\s+/i);
  for (const seg of segments) {
    const candidate = normalizePhoneSegment(seg);
    if (candidate.length === 10) return candidate;
  }
  return normalizePhoneSegment(rawStr);
}
