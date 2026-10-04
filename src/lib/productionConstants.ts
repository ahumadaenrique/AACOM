export interface RamoDef {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export const RAMOS_CATALOGO: RamoDef[] = [
  { id: "Protección", name: "Protección / Vida", icon: "Shield", color: "text-blue-600 bg-blue-50 border-blue-200" },
  { id: "Ahorro", name: "Ahorro", icon: "PiggyBank", color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  { id: "Educación", name: "Educación", icon: "GraduationCap", color: "text-teal-600 bg-teal-50 border-teal-200" },
  { id: "Retiro", name: "Retiro / PPR", icon: "Palmtree", color: "text-purple-600 bg-purple-50 border-purple-200" },
  { id: "Gastos Médicos", name: "Gastos Médicos Mayores (GMM)", icon: "HeartPulse", color: "text-red-600 bg-red-50 border-red-200" },
  { id: "Autos", name: "Autos y Movilidad", icon: "Car", color: "text-amber-600 bg-amber-50 border-amber-200" },
  { id: "Daños", name: "Daños / Empresarial", icon: "Building2", color: "text-indigo-600 bg-indigo-50 border-indigo-200" },
  { id: "Otros", name: "Otros Ramos", icon: "FileText", color: "text-slate-600 bg-slate-50 border-slate-200" },
];

export const DEFAULT_COMPANIES = [
  { name: "Insignia Life", color: "#1e3a8a", order: 1, logoUrl: "" },
  { name: "GNP Seguros", color: "#ea580c", order: 2, logoUrl: "" },
  { name: "Seguros Monterrey NYL", color: "#0284c7", order: 3, logoUrl: "" },
  { name: "AXA Seguros", color: "#dc2626", order: 4, logoUrl: "" },
  { name: "MetLife", color: "#0891b2", order: 5, logoUrl: "" },
  { name: "Quálitas", color: "#7c3aed", order: 6, logoUrl: "" },
  { name: "Mapfre", color: "#b91c1c", order: 7, logoUrl: "" },
  { name: "Allianz", color: "#1d4ed8", order: 8, logoUrl: "" },
];

export const MONTH_NAMES_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];
