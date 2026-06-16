import { z } from "zod";

export const clientSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "El nombre es requerido"),
  email: z.string().email("Correo invÃ¡lido").optional().or(z.literal("")),
  phone: z.string().optional(),
  birthDate: z.date().optional().nullable(),
});

export const policySchema = z.object({
  id: z.string().optional(),
  clientId: z.string().optional().nullable(),
  policyNumber: z.string().min(1, "El nÃºmero de pÃ³liza es requerido"),
  contractor: z.string().optional(),
  insured: z.string().optional(),
  product: z.string().optional(),
  insuranceCompany: z.string().optional(),
  effectiveDate: z.date().optional().nullable(),
  renewalDate: z.date().optional().nullable(),
  anniversaryDay: z.coerce.number().min(1).max(31).optional().nullable(),
  anniversaryMonth: z.coerce.number().min(1).max(12).optional().nullable(),
  annualPremium: z.coerce.number().optional().nullable(),
  paymentMethod: z.string().optional(),
  approximateCommission: z.coerce.number().optional().nullable(),
  approximateBonus: z.coerce.number().optional().nullable(),
  observations: z.string().optional(),
  pdfUrl: z.string().optional().nullable(),
});

export type ClientFormValues = z.infer<typeof clientSchema>;
export type PolicyFormValues = z.infer<typeof policySchema>;

