"use client";

import React, { useState, useEffect, useTransition } from "react";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getProductionDashboardData,
  createEmission,
  updateEmission,
  deleteEmission,
  updateAgentBudget,
  syncBudgetsFromPea,
  saveInsuranceCompany,
  deleteInsuranceCompany,
} from "@/app/actions/productionActions";
import { RAMOS_CATALOGO } from "@/lib/productionConstants";
import {
  Shield,
  Award,
  TrendingUp,
  DollarSign,
  Calendar,
  Building2,
  Users,
  FileSpreadsheet,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Edit,
  CheckCircle2,
  AlertCircle,
  PiggyBank,
  GraduationCap,
  Palmtree,
  HeartPulse,
  Car,
  FileText,
  Upload,
  Download,
  Check,
  ChevronRight,
  Target,
  Sparkles,
  Layers,
} from "lucide-react";

const MONTHS = [
  { value: 1, name: "Enero" },
  { value: 2, name: "Febrero" },
  { value: 3, name: "Marzo" },
  { value: 4, name: "Abril" },
  { value: 5, name: "Mayo" },
  { value: 6, name: "Junio" },
  { value: 7, name: "Julio" },
  { value: 8, name: "Agosto" },
  { value: 9, name: "Septiembre" },
  { value: 10, name: "Octubre" },
  { value: 11, name: "Noviembre" },
  { value: 12, name: "Diciembre" },
];

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

export default function AdminProduccion() {
  const [activeSubTab, setActiveSubTab] = useState<"dashboard" | "ingreso" | "companias">("dashboard");
  const [isPending, startTransition] = useTransition();

  // Filters
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [selectedAgency, setSelectedAgency] = useState<string>("ALL");
  const [filterAgentId, setFilterAgentId] = useState<string>("ALL");
  const [filterCompanyId, setFilterCompanyId] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Data State
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Modal: Edit Budget
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [editingBudgetAgent, setEditingBudgetAgent] = useState<any>(null);
  const [budgetInputValue, setBudgetInputValue] = useState<string>("");
  const [budgetNotes, setBudgetNotes] = useState<string>("");

  // Modal: Edit/Create Company
  const [companyModalOpen, setCompanyModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<any>(null);
  const [companyNameInput, setCompanyNameInput] = useState("");
  const [companyColorInput, setCompanyColorInput] = useState("#0284c7");
  const [companyLogoUrlInput, setCompanyLogoUrlInput] = useState("");
  const [companyOrderInput, setCompanyOrderInput] = useState(0);

  // Form: Ingreso de Póliza
  const [formAgentId, setFormAgentId] = useState("");
  const [formCompanyId, setFormCompanyId] = useState("");
  const [formPolicyNumber, setFormPolicyNumber] = useState("");
  const [formClientName, setFormClientName] = useState("");
  const [formRamo, setFormRamo] = useState("Protección");
  const [formIssueDate, setFormIssueDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [formPrimaEmitida, setFormPrimaEmitida] = useState<string>("");
  const [formPrimaPagada, setFormPrimaPagada] = useState<string>("");
  const [formNotes, setFormNotes] = useState("");
  const [editingEmissionId, setEditingEmissionId] = useState<string | null>(null);

  // Feedback banner
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getProductionDashboardData({
        year: selectedYear,
        month: selectedMonth,
        agencyId: selectedAgency,
        agentId: filterAgentId,
        companyId: filterCompanyId,
      });
      if (res.success) {
        setData(res);
      } else {
        setFeedback({ type: "error", text: res.message || "Error al cargar datos" });
      }
    } catch (err: any) {
      console.error(err);
      setFeedback({ type: "error", text: "Error de conexión" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedYear, selectedMonth, selectedAgency, filterAgentId, filterCompanyId]);

  // Set default agent and company when data loads
  useEffect(() => {
    if (data?.agents?.length > 0 && !formAgentId) {
      setFormAgentId(data.agents[0].id);
    }
    if (data?.companies?.length > 0 && !formCompanyId) {
      setFormCompanyId(data.companies[0].id);
    }
  }, [data]);

  // Helper currency format
  const formatMoney = (val: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  // Helper Ramo icon
  const getRamoIcon = (ramo: string) => {
    switch (ramo) {
      case "Protección": return <Shield className="h-4 w-4" />;
      case "Ahorro": return <PiggyBank className="h-4 w-4" />;
      case "Educación": return <GraduationCap className="h-4 w-4" />;
      case "Retiro": return <Palmtree className="h-4 w-4" />;
      case "Gastos Médicos": return <HeartPulse className="h-4 w-4" />;
      case "Autos": return <Car className="h-4 w-4" />;
      case "Daños": return <Building2 className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  // 1. Submit Emission Form
  const handleSubmitEmission = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const selectedComp = data?.companies?.find((c: any) => c.id === formCompanyId);
    const companyName = selectedComp?.name || "Aseguradora";

    startTransition(async () => {
      let res;
      if (editingEmissionId) {
        res = await updateEmission(editingEmissionId, {
          agentId: formAgentId,
          companyId: formCompanyId,
          companyName,
          policyNumber: formPolicyNumber,
          clientName: formClientName,
          ramo: formRamo,
          issueDate: formIssueDate,
          primaEmitida: parseFloat(formPrimaEmitida) || 0,
          primaPagada: parseFloat(formPrimaPagada) || 0,
          notes: formNotes,
        });
      } else {
        res = await createEmission({
          agentId: formAgentId,
          companyId: formCompanyId,
          companyName,
          policyNumber: formPolicyNumber,
          clientName: formClientName,
          ramo: formRamo,
          issueDate: formIssueDate,
          primaEmitida: parseFloat(formPrimaEmitida) || 0,
          primaPagada: parseFloat(formPrimaPagada) || 0,
          notes: formNotes,
        });
      }

      if (res.success) {
        setFeedback({
          type: "success",
          text: editingEmissionId ? "¡Póliza actualizada exitosamente!" : "¡Póliza registrada con éxito en el sistema!",
        });
        // Reset form
        setFormPolicyNumber("");
        setFormClientName("");
        setFormPrimaEmitida("");
        setFormPrimaPagada("");
        setFormNotes("");
        setEditingEmissionId(null);
        await fetchData();
      } else {
        setFeedback({ type: "error", text: res.message || "Error al guardar la póliza" });
      }
    });
  };

  // 2. Edit Emission
  const handleEditEmissionClick = (em: any) => {
    setEditingEmissionId(em.id);
    setFormAgentId(em.agentId);
    setFormCompanyId(em.companyId || "");
    setFormPolicyNumber(em.policyNumber || "");
    setFormClientName(em.clientName || "");
    setFormRamo(em.ramo || "Protección");
    setFormIssueDate(new Date(em.issueDate).toISOString().split("T")[0]);
    setFormPrimaEmitida(em.primaEmitida?.toString() || "");
    setFormPrimaPagada(em.primaPagada?.toString() || "");
    setFormNotes(em.notes || "");
    setActiveSubTab("ingreso");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 3. Delete Emission
  const handleDeleteEmission = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar esta póliza emitida?")) return;
    const res = await deleteEmission(id);
    if (res.success) {
      setFeedback({ type: "success", text: "Póliza eliminada del sistema." });
      fetchData();
    } else {
      alert("Error: " + res.message);
    }
  };

  // 4. Open Budget Edit Modal
  const handleOpenBudgetModal = (row: any) => {
    setEditingBudgetAgent(row);
    setBudgetInputValue(row.budget?.toString() || "0");
    setBudgetNotes("");
    setBudgetModalOpen(true);
  };

  // 5. Save Agent Budget
  const handleSaveBudget = async () => {
    if (!editingBudgetAgent) return;
    const val = parseFloat(budgetInputValue) || 0;
    startTransition(async () => {
      const res = await updateAgentBudget({
        agentId: editingBudgetAgent.agentId,
        year: selectedYear,
        month: selectedMonth,
        budgetPE: val,
        notes: budgetNotes,
      });

      if (res.success) {
        setBudgetModalOpen(false);
        setFeedback({
          type: "success",
          text: `Presupuesto de ${editingBudgetAgent.agentName} actualizado a ${formatMoney(val)}.`,
        });
        fetchData();
      } else {
        alert("Error: " + res.message);
      }
    });
  };

  // 6. Sync PEA Budgets
  const handleSyncPea = async () => {
    startTransition(async () => {
      const res = await syncBudgetsFromPea(selectedYear, selectedMonth);
      if (res.success) {
        setFeedback({
          type: "success",
          text: `Sincronización completada: se importaron ${res.syncedCount} presupuestos de PEAs autorizados para ${MONTHS.find(m => m.value === selectedMonth)?.name}.`,
        });
        fetchData();
      } else {
        alert("Error: " + res.message);
      }
    });
  };

  // 7. Save Company
  const handleSaveCompany = async () => {
    if (!companyNameInput.trim()) {
      alert("El nombre de la aseguradora es obligatorio.");
      return;
    }

    startTransition(async () => {
      const res = await saveInsuranceCompany({
        id: editingCompany?.id,
        name: companyNameInput,
        color: companyColorInput,
        logoUrl: companyLogoUrlInput,
        order: companyOrderInput,
      });

      if (res.success) {
        setCompanyModalOpen(false);
        setFeedback({ type: "success", text: "Aseguradora guardada exitosamente." });
        fetchData();
      } else {
        alert("Error: " + res.message);
      }
    });
  };

  // 8. Handle Logo Image Upload (Base64)
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("El logo no debe exceder 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setCompanyLogoUrlInput(result);
    };
    reader.readAsDataURL(file);
  };

  // 9. Export to CSV (with Excel UTF-8 BOM)
  const handleExportCSV = () => {
    if (!data?.emissions) return;

    const monthLabel = MONTHS.find((m) => m.value === selectedMonth)?.name || selectedMonth;
    const filename = `Produccion_${monthLabel}_${selectedYear}.csv`;

    const headers = [
      "Agente",
      "Email Agente",
      "Aseguradora",
      "Folio / Poliza",
      "Cliente Asegurado",
      "Ramo",
      "Fecha Emision",
      "Prima Emitida (PE)",
      "Prima Pagada (PPC)",
      "Estatus",
      "Notas",
    ];

    const rows = data.emissions.map((em: any) => [
      `"${em.agent?.name || em.agent?.email || ""}"`,
      `"${em.agent?.email || ""}"`,
      `"${em.companyName || ""}"`,
      `"${em.policyNumber || ""}"`,
      `"${em.clientName || ""}"`,
      `"${em.ramo || ""}"`,
      `"${new Date(em.issueDate).toLocaleDateString("es-MX")}"`,
      em.primaEmitida || 0,
      em.primaPagada || 0,
      `"${em.status || ""}"`,
      `"${(em.notes || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r: any[]) => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const kpis = data?.kpis;
  const companies = data?.companies || [];
  const agentMatrix = data?.agentMatrix || [];
  const emissions = data?.emissions || [];
  const agencies = data?.agencies || [];
  const monthName = MONTHS.find((m) => m.value === selectedMonth)?.name || "";

  // Filter emissions in table by search query
  const filteredEmissions = emissions.filter((em: any) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (em.agent?.name || "").toLowerCase().includes(q) ||
      (em.clientName || "").toLowerCase().includes(q) ||
      (em.policyNumber || "").toLowerCase().includes(q) ||
      (em.companyName || "").toLowerCase().includes(q) ||
      (em.ramo || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Controls & Navigation Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-teal-700 to-emerald-600 flex items-center justify-center text-white shadow-md">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                Resultados de Producción
                <span className="text-sm font-bold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 px-2.5 py-0.5 rounded-full border border-teal-200 dark:border-teal-800">
                  {monthName} {selectedYear}
                </span>
              </h2>
              <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">
                Control de emisiones, primas por aseguradora y avance vs presupuesto mensual PEA.
              </p>
            </div>
          </div>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex bg-slate-100 dark:bg-zinc-900 p-1 rounded-xl border border-slate-200 dark:border-zinc-800 w-full md:w-auto">
          <button
            onClick={() => setActiveSubTab("dashboard")}
            className={`flex-1 md:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeSubTab === "dashboard"
                ? "bg-white dark:bg-zinc-800 text-teal-700 dark:text-teal-400 shadow-sm"
                : "text-slate-600 dark:text-zinc-400 hover:text-slate-900"
            }`}
          >
            <Award className="h-3.5 w-3.5" /> Dashboard de Resultados
          </button>
          <button
            onClick={() => setActiveSubTab("ingreso")}
            className={`flex-1 md:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeSubTab === "ingreso"
                ? "bg-white dark:bg-zinc-800 text-teal-700 dark:text-teal-400 shadow-sm"
                : "text-slate-600 dark:text-zinc-400 hover:text-slate-900"
            }`}
          >
            <Plus className="h-3.5 w-3.5" /> Ingreso de Pólizas
            {emissions.length > 0 && (
              <Badge className="ml-1 bg-teal-600 text-white font-mono text-[10px] px-1.5 py-0">
                {emissions.length}
              </Badge>
            )}
          </button>
          <button
            onClick={() => setActiveSubTab("companias")}
            className={`flex-1 md:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeSubTab === "companias"
                ? "bg-white dark:bg-zinc-800 text-teal-700 dark:text-teal-400 shadow-sm"
                : "text-slate-600 dark:text-zinc-400 hover:text-slate-900"
            }`}
          >
            <Building2 className="h-3.5 w-3.5" /> Aseguradoras & Logos
          </button>
        </div>
      </div>

      {/* Filter Toolbar (Month, Year, Agency, Export, Sync) */}
      <Card className="border border-slate-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-950">
        <CardContent className="p-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Mes */}
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-slate-400" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="text-xs font-bold py-1.5 px-3 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-sm cursor-pointer"
              >
                {MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Año */}
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="text-xs font-bold py-1.5 px-3 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-sm cursor-pointer"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>

            {/* Super Admin Agency */}
            {data?.currentUserRole === "SUPER_ADMIN" && agencies.length > 0 && (
              <div className="flex items-center gap-1.5">
                <Building2 className="h-4 w-4 text-slate-400" />
                <select
                  value={selectedAgency}
                  onChange={(e) => setSelectedAgency(e.target.value)}
                  className="text-xs font-bold py-1.5 px-3 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-sm cursor-pointer"
                >
                  <option value="ALL">Todas las Agencias</option>
                  {agencies.map((ag: any) => (
                    <option key={ag.id} value={ag.id}>
                      {ag.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleSyncPea}
              variant="outline"
              size="sm"
              disabled={isPending || loading}
              className="text-xs font-bold flex items-center gap-1.5 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 hover:bg-purple-50"
              title="Importar presupuestos mensuales de PEAs autorizados para este mes"
            >
              <Target className="h-3.5 w-3.5 text-purple-600" />
              Sincronizar PEA
            </Button>

            <Button
              onClick={handleExportCSV}
              variant="outline"
              size="sm"
              disabled={emissions.length === 0}
              className="text-xs font-bold flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50"
              title="Descargar archivo CSV compatible con Excel"
            >
              <Download className="h-3.5 w-3.5 text-emerald-600" />
              Descargar CSV
            </Button>

            <Button
              onClick={fetchData}
              variant="ghost"
              size="sm"
              disabled={loading}
              className="text-slate-500 hover:text-slate-900 p-2"
              title="Actualizar datos"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs font-bold shadow-sm ${
            feedback.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-900 dark:text-emerald-200"
              : "bg-red-50 dark:bg-red-950/40 border-red-300 text-red-900 dark:text-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="underline opacity-70 hover:opacity-100">
            Cerrar
          </button>
        </div>
      )}

      {/* SUBTAB 1: DASHBOARD DE RESULTADOS (DISEÑO FIEL Y SUPERIOR AL REPORTE AACOM) */}
      {activeSubTab === "dashboard" && (
        <div className="space-y-6">
          {/* Header Banner Estilo Reporte AACOM */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-teal-900 via-teal-800 to-emerald-900 p-6 text-white shadow-xl">
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black tracking-widest uppercase text-emerald-300 bg-white/10 px-2.5 py-0.5 rounded-md">
                    Resultados de Producción
                  </span>
                  <span className="text-xs text-teal-200 font-medium italic">
                    Más que seguros, tu tranquilidad
                  </span>
                </div>
                <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white uppercase">
                  {monthName} {selectedYear}
                </h1>
                <p className="text-xs text-teal-100/80 font-medium">
                  Seguimiento de primas emitidas (PE), primas pagadas (PPC) y cumplimiento del plan mensual.
                </p>
              </div>

              {/* Badges Rápidos */}
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-xs text-teal-200 font-semibold">Tasa de Cumplimiento</div>
                  <div className="text-2xl font-black text-emerald-300">
                    {kpis?.compliancePercent || 0}%
                  </div>
                </div>
              </div>
            </div>

            {/* Background Decorative Rings */}
            <div className="absolute right-0 top-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute left-1/3 bottom-0 w-48 h-48 bg-teal-400/10 rounded-full blur-2xl pointer-events-none" />
          </div>

          {/* KPI Cards (4 Columnas) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Total Pólizas */}
            <Card className="border border-slate-200 dark:border-zinc-800 shadow-sm bg-gradient-to-br from-white to-teal-50/40 dark:from-zinc-950 dark:to-teal-950/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-teal-700 dark:text-teal-400">
                    Total de Pólizas
                  </span>
                  <div className="h-8 w-8 rounded-full bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center text-teal-700 dark:text-teal-300">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                </div>
                <div className="text-3xl md:text-4xl font-black text-slate-900 dark:text-zinc-100 mt-2">
                  {kpis?.totalPolicies || 0}
                </div>
                <p className="text-[11px] font-bold text-slate-500 mt-1">
                  Pólizas cerradas en el mes
                </p>
              </CardContent>
            </Card>

            {/* Prima Emitida (PE) */}
            <Card className="border border-slate-200 dark:border-zinc-800 shadow-sm bg-gradient-to-br from-white to-blue-50/40 dark:from-zinc-950 dark:to-blue-950/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-blue-700 dark:text-blue-400">
                    Prima Emitida (PE)
                  </span>
                  <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-700 dark:text-blue-300">
                    <Shield className="h-4 w-4" />
                  </div>
                </div>
                <div className="text-2xl md:text-3xl font-black text-slate-900 dark:text-zinc-100 mt-2 truncate">
                  {formatMoney(kpis?.totalPE || 0)}
                </div>
                <p className="text-[11px] font-bold text-slate-500 mt-1">
                  Volumen total emitido
                </p>
              </CardContent>
            </Card>

            {/* Prima Pagada (PPC/PP) */}
            <Card className="border border-slate-200 dark:border-zinc-800 shadow-sm bg-gradient-to-br from-white to-emerald-50/40 dark:from-zinc-950 dark:to-emerald-950/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                    Prima Pagada (PPC/PP)
                  </span>
                  <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-700 dark:text-emerald-300">
                    <DollarSign className="h-4 w-4" />
                  </div>
                </div>
                <div className="text-2xl md:text-3xl font-black text-emerald-700 dark:text-emerald-400 mt-2 truncate">
                  {formatMoney(kpis?.totalPPC || 0)}
                </div>
                <p className="text-[11px] font-bold text-slate-500 mt-1">
                  Cobro efectivo ingresado
                </p>
              </CardContent>
            </Card>

            {/* Presupuesto PEA Meta */}
            <Card className="border border-slate-200 dark:border-zinc-800 shadow-sm bg-gradient-to-br from-white to-purple-50/40 dark:from-zinc-950 dark:to-purple-950/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-purple-700 dark:text-purple-400">
                    Presupuesto PEA (Meta)
                  </span>
                  <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-purple-700 dark:text-purple-300">
                    <Target className="h-4 w-4" />
                  </div>
                </div>
                <div className="text-2xl md:text-3xl font-black text-purple-700 dark:text-purple-400 mt-2 truncate">
                  {formatMoney(kpis?.totalBudget || 0)}
                </div>
                <div className="w-full bg-slate-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden mt-2">
                  <div
                    className={`h-full rounded-full transition-all ${
                      (kpis?.compliancePercent || 0) >= 100
                        ? "bg-emerald-500"
                        : (kpis?.compliancePercent || 0) >= 60
                        ? "bg-amber-500"
                        : "bg-red-500"
                    }`}
                    style={{ width: `${Math.min(100, kpis?.compliancePercent || 0)}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* TABLA PRINCIPAL DE PRODUCCIÓN (MATRIZ AGENTES X ASEGURADORAS) */}
          <Card className="border border-slate-200 dark:border-zinc-800 shadow-md bg-white dark:bg-zinc-950 overflow-hidden">
            <CardHeader className="py-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-900/40">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <CardTitle className="text-base font-black text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                  <Award className="h-5 w-5 text-teal-700 dark:text-teal-400" />
                  Tabla de Emisiones por Asesor y Aseguradora
                </CardTitle>
                <span className="text-xs text-slate-500 font-medium">
                  {agentMatrix.length} agentes registrados • Da clic en el lápiz de presupuesto para editar la meta
                </span>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  {/* Table Header with Company Logos */}
                  <thead>
                    <tr className="bg-slate-100 dark:bg-zinc-900 border-b border-slate-300 dark:border-zinc-800 text-slate-700 dark:text-zinc-300">
                      <th rowSpan={2} className="py-3 px-3 font-black uppercase tracking-wider sticky left-0 bg-slate-100 dark:bg-zinc-900 z-10 border-r border-slate-200 dark:border-zinc-800 min-w-[160px]">
                        Agente / Asesor
                      </th>

                      {/* Header for each Company */}
                      {companies.map((comp: any) => (
                        <th
                          key={comp.id}
                          colSpan={3}
                          className="py-2.5 px-2 text-center font-black border-r border-slate-200 dark:border-zinc-800 bg-teal-900 text-white"
                          style={{
                            backgroundColor: comp.name.toLowerCase().includes("insignia") ? "#134e4a" : undefined,
                          }}
                        >
                          <div className="flex items-center justify-center gap-2">
                            {comp.logoUrl ? (
                              <img
                                src={comp.logoUrl}
                                alt={comp.name}
                                className="h-5 max-w-[80px] object-contain rounded bg-white/90 p-0.5"
                              />
                            ) : (
                              <Building2 className="h-3.5 w-3.5" />
                            )}
                            <span className="truncate max-w-[120px]">{comp.name}</span>
                          </div>
                        </th>
                      ))}

                      {/* Summary Columns */}
                      <th colSpan={3} className="py-2.5 px-2 text-center font-black bg-slate-800 text-white border-r border-slate-700">
                        Totales Generales
                      </th>
                      <th rowSpan={2} className="py-3 px-3 text-center font-black uppercase bg-purple-900 text-white border-r border-purple-800 min-w-[110px]">
                        Presupuesto PEA
                      </th>
                      <th rowSpan={2} className="py-3 px-3 text-center font-black uppercase bg-emerald-900 text-white min-w-[90px]">
                        % Avance
                      </th>
                    </tr>

                    {/* Sub-headers: Pólizas, PE, PPC */}
                    <tr className="bg-slate-200 dark:bg-zinc-800 border-b border-slate-300 dark:border-zinc-700 text-[10px] font-black uppercase text-slate-600 dark:text-zinc-400">
                      {companies.map((comp: any) => (
                        <React.Fragment key={comp.id}>
                          <th className="py-1.5 px-2 text-center border-r border-slate-300 dark:border-zinc-700 w-12">
                            Pól.
                          </th>
                          <th className="py-1.5 px-2 text-right border-r border-slate-300 dark:border-zinc-700 min-w-[75px]">
                            PE
                          </th>
                          <th className="py-1.5 px-2 text-right border-r border-slate-300 dark:border-zinc-700 min-w-[75px]">
                            PPC
                          </th>
                        </React.Fragment>
                      ))}

                      {/* Totals sub-headers */}
                      <th className="py-1.5 px-2 text-center bg-slate-300 dark:bg-zinc-700 text-slate-800 dark:text-zinc-200 border-r border-slate-400 w-12">
                        Pól.
                      </th>
                      <th className="py-1.5 px-2 text-right bg-slate-300 dark:bg-zinc-700 text-slate-800 dark:text-zinc-200 border-r border-slate-400 min-w-[85px]">
                        PE Total
                      </th>
                      <th className="py-1.5 px-2 text-right bg-slate-300 dark:bg-zinc-700 text-slate-800 dark:text-zinc-200 border-r border-slate-400 min-w-[85px]">
                        PPC Total
                      </th>
                    </tr>
                  </thead>

                  {/* Body Rows */}
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                    {agentMatrix.length === 0 ? (
                      <tr>
                        <td colSpan={companies.length * 3 + 6} className="py-12 text-center text-slate-500 font-semibold">
                          No hay agentes ni pólizas registradas para {monthName} {selectedYear}.
                        </td>
                      </tr>
                    ) : (
                      agentMatrix.map((row: any, idx: number) => {
                        const isEven = idx % 2 === 0;
                        return (
                          <tr
                            key={row.agentId}
                            className={`transition-colors ${
                              row.hasEmissionsOrBudget
                                ? isEven
                                  ? "bg-white dark:bg-zinc-950 hover:bg-slate-50 dark:hover:bg-zinc-900/60"
                                  : "bg-slate-50/50 dark:bg-zinc-900/30 hover:bg-slate-100/60"
                                : "opacity-60 hover:opacity-100 bg-white dark:bg-zinc-950"
                            }`}
                          >
                            {/* Agent Column */}
                            <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-zinc-100 sticky left-0 bg-inherit z-10 border-r border-slate-200 dark:border-zinc-800">
                              <div className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300 flex items-center justify-center font-black text-[10px] shrink-0">
                                  {row.agentName.charAt(0).toUpperCase()}
                                </div>
                                <span className="truncate max-w-[140px] text-xs" title={row.agentName}>
                                  {row.agentName}
                                </span>
                              </div>
                            </td>

                            {/* Data for each Company */}
                            {companies.map((comp: any) => {
                              const cData = row.companiesData[comp.id] || { policies: 0, pe: 0, ppc: 0 };
                              const hasValues = cData.policies > 0 || cData.pe > 0;
                              return (
                                <React.Fragment key={comp.id}>
                                  <td className={`py-2.5 px-2 text-center border-r border-slate-100 dark:border-zinc-800 font-mono ${hasValues ? "font-bold text-slate-800 dark:text-zinc-200" : "text-slate-300 dark:text-zinc-700"}`}>
                                    {cData.policies > 0 ? cData.policies : "-"}
                                  </td>
                                  <td className={`py-2.5 px-2 text-right border-r border-slate-100 dark:border-zinc-800 font-mono ${hasValues ? "font-bold text-slate-900 dark:text-zinc-100" : "text-slate-300 dark:text-zinc-700"}`}>
                                    {cData.pe > 0 ? formatMoney(cData.pe).replace("$", "") : "-"}
                                  </td>
                                  <td className={`py-2.5 px-2 text-right border-r border-slate-100 dark:border-zinc-800 font-mono ${hasValues ? "font-semibold text-emerald-700 dark:text-emerald-400" : "text-slate-300 dark:text-zinc-700"}`}>
                                    {cData.ppc > 0 ? formatMoney(cData.ppc).replace("$", "") : "-"}
                                  </td>
                                </React.Fragment>
                              );
                            })}

                            {/* Summary Columns for Agent */}
                            <td className="py-2.5 px-2 text-center font-mono font-black text-slate-900 dark:text-zinc-100 bg-slate-50 dark:bg-zinc-900/40 border-r border-slate-200 dark:border-zinc-800">
                              {row.totalPolicies > 0 ? row.totalPolicies : "-"}
                            </td>
                            <td className="py-2.5 px-2 text-right font-mono font-black text-slate-900 dark:text-zinc-100 bg-slate-50 dark:bg-zinc-900/40 border-r border-slate-200 dark:border-zinc-800">
                              {row.totalPE > 0 ? formatMoney(row.totalPE).replace("$", "") : "-"}
                            </td>
                            <td className="py-2.5 px-2 text-right font-mono font-black text-emerald-700 dark:text-emerald-400 bg-slate-50 dark:bg-zinc-900/40 border-r border-slate-200 dark:border-zinc-800">
                              {row.totalPPC > 0 ? formatMoney(row.totalPPC).replace("$", "") : "-"}
                            </td>

                            {/* Budget Column (Editable) */}
                            <td className="py-2.5 px-2 text-right font-mono border-r border-slate-200 dark:border-zinc-800 bg-purple-50/30 dark:bg-purple-950/20">
                              <div className="flex items-center justify-end gap-1">
                                <span className="font-bold text-purple-900 dark:text-purple-300">
                                  {row.budget > 0 ? formatMoney(row.budget).replace("$", "") : "-"}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleOpenBudgetModal(row)}
                                  className="text-purple-500 hover:text-purple-700 p-0.5 rounded hover:bg-purple-100"
                                  title={`Editar presupuesto (${row.budgetSource === 'PEA_AUTO' ? 'Viene de PEA' : 'Manual'})`}
                                >
                                  <Edit className="h-3 w-3" />
                                </button>
                              </div>
                            </td>

                            {/* Compliance % Column */}
                            <td className="py-2.5 px-2 text-center font-bold font-mono">
                              {row.budget > 0 ? (
                                <span
                                  className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-black ${
                                    row.compliancePercent >= 100
                                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                                      : row.compliancePercent >= 60
                                      ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                                      : "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300"
                                  }`}
                                >
                                  {row.compliancePercent}%
                                </span>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>

                  {/* Table Footer: TOTALES GENERALES */}
                  {agentMatrix.length > 0 && (
                    <tfoot>
                      <tr className="bg-slate-900 text-white font-black text-xs border-t-2 border-slate-900">
                        <td className="py-3 px-3 uppercase tracking-wider sticky left-0 bg-slate-900 z-10 border-r border-slate-800">
                          TOTALES
                        </td>

                        {/* Sum per Company */}
                        {companies.map((comp: any) => {
                          const cPolicies = agentMatrix.reduce(
                            (acc: number, curr: any) => acc + (curr.companiesData[comp.id]?.policies || 0),
                            0
                          );
                          const cPE = agentMatrix.reduce(
                            (acc: number, curr: any) => acc + (curr.companiesData[comp.id]?.pe || 0),
                            0
                          );
                          const cPPC = agentMatrix.reduce(
                            (acc: number, curr: any) => acc + (curr.companiesData[comp.id]?.ppc || 0),
                            0
                          );
                          return (
                            <React.Fragment key={comp.id}>
                              <td className="py-3 px-2 text-center font-mono border-r border-slate-800">
                                {cPolicies > 0 ? cPolicies : "-"}
                              </td>
                              <td className="py-3 px-2 text-right font-mono border-r border-slate-800">
                                {cPE > 0 ? formatMoney(cPE).replace("$", "") : "-"}
                              </td>
                              <td className="py-3 px-2 text-right font-mono text-emerald-400 border-r border-slate-800">
                                {cPPC > 0 ? formatMoney(cPPC).replace("$", "") : "-"}
                              </td>
                            </React.Fragment>
                          );
                        })}

                        {/* Global Totals */}
                        <td className="py-3 px-2 text-center font-mono bg-slate-950 border-r border-slate-800 text-emerald-400">
                          {kpis?.totalPolicies || 0}
                        </td>
                        <td className="py-3 px-2 text-right font-mono bg-slate-950 border-r border-slate-800 text-emerald-400">
                          {formatMoney(kpis?.totalPE || 0).replace("$", "")}
                        </td>
                        <td className="py-3 px-2 text-right font-mono bg-slate-950 border-r border-slate-800 text-emerald-400">
                          {formatMoney(kpis?.totalPPC || 0).replace("$", "")}
                        </td>

                        {/* Total Budget */}
                        <td className="py-3 px-2 text-right font-mono bg-purple-950 border-r border-purple-900 text-purple-200">
                          {formatMoney(kpis?.totalBudget || 0).replace("$", "")}
                        </td>

                        {/* Global Compliance */}
                        <td className="py-3 px-2 text-center font-mono bg-emerald-950 text-emerald-300">
                          {kpis?.compliancePercent || 0}%
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Desglose Inferior por Ramos (Estilo Iconos Reporte AACOM) */}
          <div className="pt-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
              <Layers className="h-4 w-4 text-teal-700" />
              Distribución por Ramos de Protección y Ahorro
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3">
              {RAMOS_CATALOGO.map((ramo) => {
                const rStat = kpis?.byRamo?.find((r: any) => r.ramo === ramo.id);
                return (
                  <div
                    key={ramo.id}
                    className="p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm flex flex-col items-center text-center space-y-1.5"
                  >
                    <div className="h-8 w-8 rounded-full bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-400 flex items-center justify-center">
                      {getRamoIcon(ramo.id)}
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 truncate w-full">
                      {ramo.id}
                    </span>
                    <span className="text-[11px] font-mono font-black text-teal-700 dark:text-teal-400">
                      {rStat ? formatMoney(rStat.pe) : "$0"}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {rStat?.count || 0} {rStat?.count === 1 ? "póliza" : "pólizas"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: INGRESO Y CAPTURA MANUAL DE PÓLIZAS */}
      {activeSubTab === "ingreso" && (
        <div className="space-y-6">
          <Card className="border border-slate-200 dark:border-zinc-800 shadow-md bg-white dark:bg-zinc-950">
            <CardHeader className="border-b border-slate-200 dark:border-zinc-800 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-black text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                    <Plus className="h-5 w-5 text-teal-700" />
                    {editingEmissionId ? "Editar Emisión de Póliza" : "Capturar Nueva Emisión de Póliza"}
                  </CardTitle>
                  <CardDescription className="text-xs mt-1">
                    Registra los valores de la póliza cerrada por el agente para integrarla en tiempo real al reporte mensual.
                  </CardDescription>
                </div>
                {editingEmissionId && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingEmissionId(null);
                      setFormPolicyNumber("");
                      setFormClientName("");
                      setFormPrimaEmitida("");
                      setFormPrimaPagada("");
                      setFormNotes("");
                    }}
                    className="text-xs text-red-600 border-red-300"
                  >
                    Cancelar edición ✕
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-6">
              <form onSubmit={handleSubmitEmission} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Agente */}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-zinc-400 mb-1">
                      Agente / Asesor *
                    </label>
                    <select
                      value={formAgentId}
                      onChange={(e) => setFormAgentId(e.target.value)}
                      required
                      className="w-full text-sm font-semibold py-2 px-3 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-sm"
                    >
                      {data?.agents?.map((ag: any) => (
                        <option key={ag.id} value={ag.id}>
                          {ag.name || ag.email}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Aseguradora */}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-zinc-400 mb-1">
                      Compañía de Seguros *
                    </label>
                    <select
                      value={formCompanyId}
                      onChange={(e) => setFormCompanyId(e.target.value)}
                      required
                      className="w-full text-sm font-semibold py-2 px-3 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-sm"
                    >
                      {companies.map((comp: any) => (
                        <option key={comp.id} value={comp.id}>
                          {comp.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Fecha de Emisión */}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-zinc-400 mb-1">
                      Fecha de Emisión *
                    </label>
                    <Input
                      type="date"
                      value={formIssueDate}
                      onChange={(e) => setFormIssueDate(e.target.value)}
                      required
                      className="text-sm font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Folio / Póliza */}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-zinc-400 mb-1">
                      Número / Folio de Póliza
                    </label>
                    <Input
                      type="text"
                      placeholder="Ej. POL-128391"
                      value={formPolicyNumber}
                      onChange={(e) => setFormPolicyNumber(e.target.value)}
                      className="text-sm font-mono"
                    />
                  </div>

                  {/* Cliente */}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-zinc-400 mb-1">
                      Nombre del Cliente Asegurado
                    </label>
                    <Input
                      type="text"
                      placeholder="Ej. Dr. Mario Estrada"
                      value={formClientName}
                      onChange={(e) => setFormClientName(e.target.value)}
                      className="text-sm"
                    />
                  </div>

                  {/* Ramo */}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-zinc-400 mb-1">
                      Ramo / Producto
                    </label>
                    <select
                      value={formRamo}
                      onChange={(e) => setFormRamo(e.target.value)}
                      className="w-full text-sm font-semibold py-2 px-3 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-sm"
                    >
                      {RAMOS_CATALOGO.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Prima Emitida PE */}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-blue-700 dark:text-blue-400 mb-1">
                      Prima Emitida (PE) en MXN *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 font-bold text-slate-400">$</span>
                      <Input
                        type="number"
                        step="any"
                        placeholder="Ej. 45000"
                        value={formPrimaEmitida}
                        onChange={(e) => setFormPrimaEmitida(e.target.value)}
                        required
                        className="pl-7 font-mono font-bold text-base"
                      />
                    </div>
                  </div>

                  {/* Prima Pagada PPC */}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-1">
                      Prima Pagada / Cobrada (PPC / PP) en MXN *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 font-bold text-slate-400">$</span>
                      <Input
                        type="number"
                        step="any"
                        placeholder="Ej. 32000"
                        value={formPrimaPagada}
                        onChange={(e) => setFormPrimaPagada(e.target.value)}
                        required
                        className="pl-7 font-mono font-bold text-base text-emerald-700 dark:text-emerald-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Notas */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-zinc-400 mb-1">
                    Observaciones / Notas
                  </label>
                  <Input
                    type="text"
                    placeholder="Detalles adicionales, número de recibo o condiciones de la emisión..."
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    className="text-sm"
                  />
                </div>

                {/* Submit button */}
                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={isPending}
                    className="w-full py-6 text-base font-black bg-gradient-to-r from-teal-700 to-emerald-600 hover:from-teal-800 hover:to-emerald-700 text-white shadow-lg shadow-teal-700/20"
                  >
                    {isPending ? (
                      <>
                        <RefreshCw className="h-5 w-5 animate-spin mr-2" /> Guardando emisión...
                      </>
                    ) : editingEmissionId ? (
                      <>
                        <Check className="h-5 w-5 mr-2" /> Actualizar Póliza
                      </>
                    ) : (
                      <>
                        <Plus className="h-5 w-5 mr-2" /> Registrar Póliza
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Historial de Pólizas Capturadas en el Mes */}
          <Card className="border border-slate-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-950 overflow-hidden">
            <CardHeader className="py-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <CardTitle className="text-base font-black text-slate-800 dark:text-zinc-100 flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-teal-700" />
                  Pólizas Registradas en {monthName} {selectedYear} ({filteredEmissions.length})
                </CardTitle>

                {/* Buscador */}
                <div className="relative w-full sm:w-72">
                  <Search className="h-3.5 w-3.5 absolute left-3 top-3 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Buscar por cliente, póliza o agente..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 text-xs py-1.5 bg-white dark:bg-zinc-900"
                  />
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {filteredEmissions.length === 0 ? (
                <div className="py-16 text-center text-slate-500 text-xs">
                  No hay emisiones capturadas para los filtros seleccionados.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-zinc-900 text-[10px] font-black uppercase text-slate-500 border-b border-slate-200 dark:border-zinc-800">
                      <tr>
                        <th className="py-2.5 px-3">Fecha</th>
                        <th className="py-2.5 px-3">Asesor</th>
                        <th className="py-2.5 px-3">Aseguradora</th>
                        <th className="py-2.5 px-3">Cliente / Folio</th>
                        <th className="py-2.5 px-3">Ramo</th>
                        <th className="py-2.5 px-3 text-right">Prima Emitida (PE)</th>
                        <th className="py-2.5 px-3 text-right">Prima Pagada (PPC)</th>
                        <th className="py-2.5 px-3 text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                      {filteredEmissions.map((em: any) => (
                        <tr key={em.id} className="hover:bg-slate-50/70 dark:hover:bg-zinc-900/50 transition-colors">
                          <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-zinc-400">
                            {new Date(em.issueDate).toLocaleDateString("es-MX", {
                              day: "2-digit",
                              month: "short",
                            })}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-zinc-100">
                            {em.agent?.name || em.agent?.email}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-700 dark:text-zinc-300">
                            {em.companyName}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-medium text-slate-800 dark:text-zinc-200">
                              {em.clientName || <span className="italic text-slate-400">Sin cliente</span>}
                            </div>
                            {em.policyNumber && (
                              <div className="text-[10px] font-mono text-slate-400">
                                {em.policyNumber}
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 dark:text-zinc-300">
                              {getRamoIcon(em.ramo)} {em.ramo}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-zinc-100">
                            {formatMoney(em.primaEmitida)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                            {formatMoney(em.primaPagada)}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditEmissionClick(em)}
                                className="h-7 w-7 p-0 text-slate-500 hover:text-teal-700"
                                title="Editar"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteEmission(em.id)}
                                className="h-7 w-7 p-0 text-slate-500 hover:text-red-600"
                                title="Eliminar"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* SUBTAB 3: CATÁLOGO DE ASEGURADORAS & LOGOS */}
      {activeSubTab === "companias" && (
        <div className="space-y-6">
          <Card className="border border-slate-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-950">
            <CardHeader className="py-4 border-b border-slate-200 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-black text-slate-800 dark:text-zinc-100 flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-teal-700" />
                    Catálogo de Aseguradoras & Logos
                  </CardTitle>
                  <CardDescription className="text-xs mt-1">
                    Administra las compañías aseguradoras y sube sus logotipos para que el dashboard sea sumamente gráfico.
                  </CardDescription>
                </div>
                <Button
                  onClick={() => {
                    setEditingCompany(null);
                    setCompanyNameInput("");
                    setCompanyColorInput("#0284c7");
                    setCompanyLogoUrlInput("");
                    setCompanyOrderInput(companies.length + 1);
                    setCompanyModalOpen(true);
                  }}
                  className="text-xs font-bold bg-teal-700 hover:bg-teal-800 text-white"
                >
                  <Plus className="h-4 w-4 mr-1.5" /> Nueva Aseguradora
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {companies.map((comp: any) => (
                  <div
                    key={comp.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50 flex flex-col justify-between gap-3 hover:shadow-md transition-shadow"
                  >
                    <div className="space-y-2">
                      <div className="h-16 rounded-lg bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 p-2 flex items-center justify-center">
                        {comp.logoUrl ? (
                          <img
                            src={comp.logoUrl}
                            alt={comp.name}
                            className="max-h-full max-w-full object-contain"
                          />
                        ) : (
                          <div className="flex items-center gap-1.5 text-slate-400 font-bold text-xs">
                            <Building2 className="h-5 w-5" />
                            Sin logo cargado
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="font-black text-sm text-slate-900 dark:text-zinc-100 truncate">
                          {comp.name}
                        </span>
                        <div
                          className="h-3 w-3 rounded-full border border-white shadow-sm shrink-0"
                          style={{ backgroundColor: comp.color || "#0284c7" }}
                          title={`Color de marca: ${comp.color}`}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-zinc-800">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingCompany(comp);
                          setCompanyNameInput(comp.name);
                          setCompanyColorInput(comp.color || "#0284c7");
                          setCompanyLogoUrlInput(comp.logoUrl || "");
                          setCompanyOrderInput(comp.order || 0);
                          setCompanyModalOpen(true);
                        }}
                        className="text-xs font-bold text-teal-700 hover:text-teal-800 p-1"
                      >
                        <Edit className="h-3.5 w-3.5 mr-1" /> Editar Logo
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          if (!confirm(`¿Eliminar la aseguradora ${comp.name}?`)) return;
                          const res = await deleteInsuranceCompany(comp.id);
                          if (res.success) {
                            fetchData();
                          } else {
                            alert("Error: " + res.message);
                          }
                        }}
                        className="text-xs text-slate-400 hover:text-red-600 p-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* MODAL 1: EDITAR PRESUPUESTO MENSUAL PEA */}
      <Dialog open={budgetModalOpen} onOpenChange={setBudgetModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-black flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-600" />
              Presupuesto Mensual: {editingBudgetAgent?.agentName}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Modifica el presupuesto pactado para {monthName} {selectedYear}. Esta modificación quedará registrada como ajuste administrativo manual.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="block text-xs font-black uppercase text-slate-600 mb-1">
                Presupuesto Meta en Primas (PE) en MXN
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 font-bold text-slate-400">$</span>
                <Input
                  type="number"
                  step="any"
                  value={budgetInputValue}
                  onChange={(e) => setBudgetInputValue(e.target.value)}
                  className="pl-7 font-mono font-bold text-base"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-slate-600 mb-1">
                Motivo / Notas del Ajuste (Opcional)
              </label>
              <Input
                type="text"
                placeholder="Ej. Re-negociación de meta o corrección de captura..."
                value={budgetNotes}
                onChange={(e) => setBudgetNotes(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setBudgetModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleSaveBudget}
              disabled={isPending}
              className="bg-purple-700 hover:bg-purple-800 text-white font-bold"
            >
              {isPending ? "Guardando..." : "Guardar Presupuesto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: EDITAR / CARGAR LOGO DE ASEGURADORA */}
      <Dialog open={companyModalOpen} onOpenChange={setCompanyModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-black flex items-center gap-2">
              <Building2 className="h-5 w-5 text-teal-700" />
              {editingCompany ? `Editar: ${editingCompany.name}` : "Nueva Aseguradora"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Configura el nombre, color distintivo y sube el logotipo de la compañía de seguros.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="block text-xs font-black uppercase text-slate-600 mb-1">
                Nombre de la Aseguradora *
              </label>
              <Input
                type="text"
                placeholder="Ej. Insignia Life"
                value={companyNameInput}
                onChange={(e) => setCompanyNameInput(e.target.value)}
                className="text-sm font-semibold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-black uppercase text-slate-600 mb-1">
                  Color de Marca
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={companyColorInput}
                    onChange={(e) => setCompanyColorInput(e.target.value)}
                    className="h-8 w-12 rounded cursor-pointer border border-slate-300"
                  />
                  <Input
                    type="text"
                    value={companyColorInput}
                    onChange={(e) => setCompanyColorInput(e.target.value)}
                    className="text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-600 mb-1">
                  Orden de Aparición
                </label>
                <Input
                  type="number"
                  value={companyOrderInput}
                  onChange={(e) => setCompanyOrderInput(parseInt(e.target.value) || 0)}
                  className="text-xs font-mono"
                />
              </div>
            </div>

            {/* Logo Preview and Upload */}
            <div>
              <label className="block text-xs font-black uppercase text-slate-600 mb-1">
                Logotipo Oficial
              </label>
              <div className="p-3 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 flex items-center gap-3">
                <div className="h-12 w-20 rounded bg-white dark:bg-zinc-950 border border-slate-200 flex items-center justify-center p-1 shrink-0">
                  {companyLogoUrlInput ? (
                    <img
                      src={companyLogoUrlInput}
                      alt="Logo preview"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <span className="text-[10px] text-slate-400">Sin logo</span>
                  )}
                </div>

                <div className="space-y-1 flex-1">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 text-xs font-bold hover:bg-teal-100">
                    <Upload className="h-3.5 w-3.5" />
                    Subir Imagen (PNG/JPG)
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>
                  {companyLogoUrlInput && (
                    <button
                      type="button"
                      onClick={() => setCompanyLogoUrlInput("")}
                      className="block text-[11px] text-red-500 hover:underline"
                    >
                      Remover logo
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-slate-600 mb-1">
                O URL Directa de Imagen (Opcional)
              </label>
              <Input
                type="url"
                placeholder="https://..."
                value={companyLogoUrlInput.startsWith("data:") ? "" : companyLogoUrlInput}
                onChange={(e) => setCompanyLogoUrlInput(e.target.value)}
                className="text-xs font-mono"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setCompanyModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleSaveCompany}
              disabled={isPending}
              className="bg-teal-700 hover:bg-teal-800 text-white font-bold"
            >
              {isPending ? "Guardando..." : "Guardar Aseguradora"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
