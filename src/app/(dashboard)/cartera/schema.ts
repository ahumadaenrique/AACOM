import { z } from "zod";

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
        const digits = val.replace(/\D/g, "");
        return digits.length >= 10 && digits.length <= 15;
      },
      { message: "El teléfono debe contener al menos 10 dígitos numéricos" }
    ),
  birthDate: z.union([z.string(), z.date()]).optional().nullable(),
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
  originalPremium: z.coerce.number().min(0, "La prima no puede ser negativa").optional().nullable(),
  status: z.string().optional().default("VIGENTE"),
  subStatus: z.string().optional().nullable(),
  effectiveDate: z.union([z.string(), z.date()]).optional().nullable(),
  renewalDate: z.union([z.string(), z.date()]).optional().nullable(),
  anniversaryDay: z.coerce.number().min(1).max(31).optional().nullable(),
  anniversaryMonth: z.coerce.number().min(1).max(12).optional().nullable(),
  annualPremium: z.coerce.number().min(0, "La prima anual no puede ser negativa").optional().nullable(),
  paymentMethod: z.string().optional().nullable(),
  approximateCommission: z.coerce.number().min(0).optional().nullable(),
  approximateBonus: z.coerce.number().min(0).optional().nullable(),
  observations: z.string().optional().nullable(),
  pdfUrl: z.string().optional().nullable(),
});

export type ClientFormValues = z.infer<typeof clientSchema>;
export type PolicyFormValues = z.infer<typeof policySchema>;
