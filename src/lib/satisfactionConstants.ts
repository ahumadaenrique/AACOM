export interface SurveyReferralInput {
  fullName: string;
  phone: string;
  notes?: string;
}

export interface CreateSurveyInput {
  intervieweeName: string;
  q1Useful: boolean;
  q2Attractive: boolean;
  q3Professional: boolean;
  q4Clear: boolean;
  q5WouldRecommend: boolean;
  notes?: string;
  referrals: SurveyReferralInput[];
}

export const REFERRAL_STATUSES = [
  { value: "NO_CONTACTADO", label: "No contactado", color: "bg-slate-100 text-slate-700 border-slate-300 dark:bg-zinc-800 dark:text-zinc-300" },
  { value: "CONTACTADO", label: "Contactado", color: "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300" },
  { value: "AGENDADO", label: "Agendado", color: "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300" },
  { value: "PROPUESTA_PRESENTADA", label: "Propuesta presentada", color: "bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-950/40 dark:text-purple-300" },
  { value: "CERRADO_PAGADO", label: "Cerrado y pagado", color: "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300" },
] as const;
