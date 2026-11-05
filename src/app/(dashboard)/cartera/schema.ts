import { z } from "zod";

function isValidYearRange(val: unknown, minYear: number, maxYear: number): boolean {
  if (!val) return true;
  if (typeof val === "string" && val.trim() === "") return true;
  const d = val instanceof Date ? val : new Date(String(val));
  if (isNaN(d.getTime())) return false;
  const year = typeof val === "string" && /^\d{4}-/.test(val.trim())
    ? parseInt(val.trim().slice(0, 4), 10)
    : d.getUTCFullYear();
  return year >= minYear && year <= maxYear;
}

export const clientSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "El nombre completo es requerido (mínimo 2 caracteres)"),
  email: z.string().email("Correo electrónico inválido").optional().or(z.literal("")),
  phone: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine(
      (val) => {
        if (!val || val.trim() === "") return true;
        if (/[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(val)) return false;
        const digits = val.replace(/\D/g, "");
        return digits.length >= 10 && digits.length <= 15;
      },
      { message: "El teléfono debe contener de 10 a 15 dígitos numéricos (sin letras)" }
    ),
  birthDate: z
    .union([z.string(), z.date()])
    .optional()
    .nullable()
    .refine((val) => isValidYearRange(val, 1910, new Date().getFullYear()), {
      message: "La fecha de nacimiento debe tener un año válido (1910 al año actual)",
    }),
  rfc: z.string().optional().nullable(),
  curp: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const policySchema = z.object({
  id: z.string().optional(),
  clientId: z.string().optional().nullable(),
  policyNumber: z.string().min(1, "El número de póliza es requerido"),
  contractor: z.string().optional().nullable(),
  insured: z.string().optional().nullable(),
  product: z.string().optional().nullable(),
  insuranceCompany: z.string().optional().nullable(),
  ramo: z.string().optional().default("VIDA_INDIVIDUAL"),
  tipoVigencia: z.string().optional().default("LARGO_PLAZO"),
  currency: z.string().optional().default("MXN"),
  originalPremium: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
    z.number({ invalid_type_error: "La prima original debe ser numérica" }).min(0, "La prima no puede ser negativa").nullable().optional()
  ),
  status: z.string().optional().default("VIGENTE"),
  subStatus: z.string().optional().nullable(),
  effectiveDate: z
    .union([z.string(), z.date()])
    .optional()
    .nullable()
    .refine((val) => isValidYearRange(val, 1980, 2100), {
      message: "El inicio de vigencia debe tener un año válido (entre 1980 y 2100)",
    }),
  renewalDate: z
    .union([z.string(), z.date()])
    .optional()
    .nullable()
    .refine((val) => isValidYearRange(val, 1980, 2100), {
      message: "La fecha de renovación/fin de plazo debe tener un año válido (entre 1980 y 2100)",
    }),
  anniversaryDay: z.coerce.number().min(1).max(31).optional().nullable(),
  anniversaryMonth: z.coerce.number().min(1).max(12).optional().nullable(),
  annualPremium: z.coerce
    .number({ invalid_type_error: "Ingresa una prima anual válida" })
    .gt(0, "La prima anual debe ser mayor a $0 (no se permiten primas en $0 o negativas)"),
  paymentMethod: z.string().optional().nullable(),
  approximateCommission: z.coerce.number().min(0).optional().nullable(),
  approximateBonus: z.coerce.number().min(0).optional().nullable(),
  observations: z.string().optional().nullable(),
  pdfUrl: z.string().optional().nullable(),
});

export type ClientFormValues = z.infer<typeof clientSchema>;
export type PolicyFormValues = z.infer<typeof policySchema>;
