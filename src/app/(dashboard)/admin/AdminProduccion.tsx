"use client";

import React, { useState, useEffect, useTransition, useMemo } from "react";
import Link from "next/link";
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
import { Switch } from "@/components/ui/switch";
import {
  getProductionDashboardData,
  updateAgentBudget,
  syncBudgetsFromPea,
  saveInsuranceCompany,
  toggleInsuranceCompanyActive,
  deleteInsuranceCompany,
  getProductionReconciliationAudit,
  reconcileHistoricalEmissionsToCartera,
} from "@/app/actions/productionActions";
import {
  markReceiptAsPaid,
  togglePolicyAdminApproval,
  togglePolicyRenewalFlag,
} from "@/app/(dashboard)/cartera/actions";
import QuickPdfAiPolicyDialog from "@/app/(dashboard)/cartera/QuickPdfAiPolicyDialog";
import GrokbotBridgePanel from "@/components/admin/GrokbotBridgePanel";
import { DEFAULT_COMPANIES } from "@/lib/productionConstants";
import {
  BusinessScope,
  CanonicalSubRamoKey,
  PeriodMode,
  RAMO_GROUPS,
  RamoGroupKey,
  SUB_RAMOS_CATALOG,
  VIDA_OBJETIVOS_CATALOG,
  VidaObjetivoKey,
  getDefaultSubPeriodForMonth,
} from "@/lib/ramosCatalog";
import {
  Shield,
  Award,
  TrendingUp,
  DollarSign,
  Calendar,
  Building2,
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
  Target,
  Layers,
  Eye,
  Scale,
  FlaskConical,
  ArrowRightLeft,
  Users,
  Check,
  XCircle,
  Bot,
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

const BIMESTRES = [
  { value: 1, name: "1er Bimestre (Ene–Feb)" },
  { value: 2, name: "2do Bimestre (Mar–Abr)" },
  { value: 3, name: "3er Bimestre (May–Jun)" },
  { value: 4, name: "4to Bimestre (Jul–Ago)" },
  { value: 5, name: "5to Bimestre (Sep–Oct)" },
  { value: 6, name: "6to Bimestre (Nov–Dic)" },
];

const TRIMESTRES = [
  { value: 1, name: "1er Trimestre Q1 (Ene–Mar)" },
  { value: 2, name: "2do Trimestre Q2 (Abr–Jun)" },
  { value: 3, name: "3er Trimestre Q3 (Jul–Sep)" },
  { value: 4, name: "4to Trimestre Q4 (Oct–Dic)" },
];

const SEMESTRES = [
  { value: 1, name: "1er Semestre (Ene–Jun)" },
  { value: 2, name: "2do Semestre (Jul–Dic)" },
];

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

export default function AdminProduccion() {
  const [activeSubTab, setActiveSubTab] = useState<
    "dashboard" | "ingreso" | "companias" | "evaluador" | "grokbot"
  >("dashboard");
  const [isPending, startTransition] = useTransition();

  // Filters & Temporality
  const [periodMode, setPeriodMode] = useState<PeriodMode>("MENSUAL");
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [subPeriod, setSubPeriod] = useState<number>(currentMonth);
  const [customStartDate, setCustomStartDate] = useState<string>(
    `${currentYear}-${String(currentMonth).padStart(2, "0")}-01`
  );
  const [customEndDate, setCustomEndDate] = useState<string>(
    `${currentYear}-${String(currentMonth).padStart(2, "0")}-28`
  );
  const [businessScope, setBusinessScope] = useState<BusinessScope>("NUEVA");
  const [ramoGroupFilter, setRamoGroupFilter] = useState<RamoGroupKey | "ALL">("ALL");
  const [subRamoFilter, setSubRamoFilter] = useState<CanonicalSubRamoKey | "ALL">("ALL");
  const [vidaObjetivoFilter, setVidaObjetivoFilter] = useState<VidaObjetivoKey | "ALL">("ALL");

  const [selectedAgency, setSelectedAgency] = useState<string>("DEFAULT");
  const [filterAgentId, setFilterAgentId] = useState<string>("ALL");
  const [filterCompanyId, setFilterCompanyId] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Dashboard Data State
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Evaluator (Antes vs Después) State
  const [auditData, setAuditData] = useState<any>(null);
  const [auditLoading, setAuditLoading] = useState<boolean>(false);
  const [auditFilter, setAuditFilter] = useState<
    "ALL" | "FALTA_EN_CARTERA" | "EXISTE_CON_DIFERENCIA" | "CONCILIADO_EXACTO"
  >("ALL");
  const [selectedGroupKeys, setSelectedGroupKeys] = useState<string[]>([]);
  const [dryRunResult, setDryRunResult] = useState<any>(null);

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

  // Modal: Detalle de Pólizas por Asesor
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailAgent, setDetailAgent] = useState<any>(null);
  const [detailCompanyFilter, setDetailCompanyFilter] = useState<string>("ALL");
  const [detailSearchQuery, setDetailSearchQuery] = useState<string>("");

  // Modal: Cobrar Recibo desde Cartera Unificada
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payTargetPolicy, setPayTargetPolicy] = useState<any>(null);
  const [payReceiptId, setPayReceiptId] = useState<string>("");
  const [payDateInput, setPayDateInput] = useState<string>(() =>
    new Date().toLocaleDateString("en-CA", { timeZone: "America/Mexico_City" })
  );
  const [payAmountInput, setPayAmountInput] = useState<string>("");
  const [payNotesInput, setPayNotesInput] = useState<string>("");

  // Feedback banner
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handlePeriodModeChange = (nextMode: PeriodMode) => {
    setPeriodMode(nextMode);
    if (nextMode === "MENSUAL") {
      setSubPeriod(selectedMonth);
    } else {
      setSubPeriod(getDefaultSubPeriodForMonth(nextMode, selectedMonth));
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const effectiveMonth =
        periodMode === "MENSUAL" ? subPeriod : selectedMonth;
      const res = await getProductionDashboardData({
        year: selectedYear,
        month: effectiveMonth,
        agencyId: selectedAgency,
        agentId: filterAgentId,
        companyId: filterCompanyId,
        periodMode,
        subPeriod: periodMode === "MENSUAL" ? selectedMonth : subPeriod,
        startDate: periodMode === "CUSTOM" ? customStartDate : undefined,
        endDate: periodMode === "CUSTOM" ? customEndDate : undefined,
        businessScope,
        ramoGroupFilter,
        subRamoFilter,
        vidaObjetivoFilter,
      });
      if (res.success) {
        setData(res);
        if (selectedAgency === "DEFAULT" && (res as any).selectedAgencyId) {
          setSelectedAgency((res as any).selectedAgencyId);
        }
      } else {
        setFeedback({ type: "error", text: res.message || "Error al cargar datos" });
      }
    } catch (err: any) {
      console.error(err);
      setFeedback({ type: "error", text: "Error de conexión al cargar producción" });
    } finally {
      setLoading(false);
    }
  };

  const fetchAudit = async (agencyOverride?: string) => {
    setAuditLoading(true);
    setDryRunResult(null);
    try {
      const res = await getProductionReconciliationAudit({
        year: selectedYear,
        agencyId: agencyOverride || selectedAgency,
      });
      if (res.success) {
        setAuditData(res);
        const pendingKeys = (res.reconciliationItems || [])
          .filter((i: any) => i.status !== "CONCILIADO_EXACTO")
          .map((i: any) => i.groupKey);
        setSelectedGroupKeys(pendingKeys);
      } else {
        setFeedback({ type: "error", text: res.message || "Error al auditar historial" });
      }
    } catch (err: any) {
      console.error(err);
      setFeedback({ type: "error", text: "Error al ejecutar evaluador Antes vs Después" });
    } finally {
      setAuditLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    periodMode,
    selectedYear,
    selectedMonth,
    subPeriod,
    customStartDate,
    customEndDate,
    businessScope,
    ramoGroupFilter,
    subRamoFilter,
    vidaObjetivoFilter,
    selectedAgency,
    filterAgentId,
    filterCompanyId,
  ]);

  useEffect(() => {
    if (activeSubTab === "evaluador") {
      fetchAudit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSubTab, selectedYear, selectedAgency]);

  const formatMoney = (val: number) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      maximumFractionDigits: 0,
    }).format(val || 0);

  const formatMoneyExact = (val: number) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val || 0);

  const getRamoIcon = (key: string) => {
    switch (key) {
      case "PROTECCION":
      case "VIDA":
      case "VIDA_INDIVIDUAL":
        return <Shield className="h-4 w-4" />;
      case "VIDA_GRUPO":
        return <Users className="h-4 w-4" />;
      case "AHORRO":
        return <PiggyBank className="h-4 w-4" />;
      case "EDUCACION":
        return <GraduationCap className="h-4 w-4" />;
      case "RETIRO":
        return <Palmtree className="h-4 w-4" />;
      case "GMM":
      case "GMM_INDIVIDUAL":
      case "GMM_COLECTIVO":
        return <HeartPulse className="h-4 w-4" />;
      case "AUTOS":
      case "AUTOS_INDIVIDUAL":
      case "AUTOS_FLOTILLA":
        return <Car className="h-4 w-4" />;
      case "DANOS":
        return <Building2 className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  // Detail Modal open
  const handleOpenDetailModal = (agent: any, companyId: string = "ALL") => {
    setDetailAgent(agent);
    setDetailCompanyFilter(companyId);
    setDetailSearchQuery("");
    setDetailModalOpen(true);
  };

  // Budget Modal
  const handleOpenBudgetModal = (row: any) => {
    setEditingBudgetAgent(row);
    setBudgetInputValue(
      String(row.selectedMonthBudgetPE ?? row.budget ?? 0)
    );
    setBudgetNotes("");
    setBudgetModalOpen(true);
  };

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
          text: `Presupuesto de ${editingBudgetAgent.agentName} (${MONTHS.find((m) => m.value === selectedMonth)?.name} ${selectedYear}) actualizado a ${formatMoney(val)}.`,
        });
        fetchData();
      } else {
        alert("Error: " + res.message);
      }
    });
  };

  const handleSyncPea = async () => {
    startTransition(async () => {
      const res = await syncBudgetsFromPea(selectedYear, selectedMonth, selectedAgency);
      if (res.success) {
        setFeedback({
          type: "success",
          text: `Sincronización completada: se importaron ${res.syncedCount} presupuestos de PEAs autorizados para ${MONTHS.find((m) => m.value === selectedMonth)?.name}.`,
        });
        fetchData();
      } else {
        alert("Error: " + res.message);
      }
    });
  };

  // Company Actions
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
        agencyId: selectedAgency,
      });

      if (res.success) {
        setCompanyModalOpen(false);
        setEditingCompany(null);
        setCompanyNameInput("");
        setCompanyColorInput("#0284c7");
        setCompanyLogoUrlInput("");
        setFeedback({
          type: "success",
          text: "Aseguradora guardada exitosamente para esta agencia.",
        });
        fetchData();
      } else {
        alert("Error: " + res.message);
      }
    });
  };

  const handleQuickEnableCompany = async (item: {
    companyName: string;
    existingCompanyId: string | null;
  }) => {
    startTransition(async () => {
      const res = item.existingCompanyId
        ? await toggleInsuranceCompanyActive(item.existingCompanyId, true, selectedAgency)
        : await saveInsuranceCompany({
            name: item.companyName,
            active: true,
            agencyId: selectedAgency,
          });
      if (res.success) {
        setFeedback({
          type: "success",
          text: `✓ ${item.companyName} activada para que aparezca como columna en tu tablero.`,
        });
        await fetchData();
      } else {
        setFeedback({ type: "error", text: res.message || "Error al activar aseguradora" });
      }
    });
  };

  const handleToggleCompanyActive = async (comp: any, nextActive: boolean) => {
    setData((prev: any) => {
      if (!prev) return prev;
      const updatedCatalog = (prev.catalogCompanies || []).map((c: any) =>
        c.id === comp.id ? { ...c, active: nextActive } : c
      );
      const updatedActive = updatedCatalog
        .filter((c: any) => c.active)
        .sort((a: any, b: any) => (a.order - b.order) || a.name.localeCompare(b.name));
      return {
        ...prev,
        catalogCompanies: updatedCatalog,
        companies: updatedActive,
      };
    });

    const res = await toggleInsuranceCompanyActive(comp.id, nextActive, selectedAgency);
    if (res.success) {
      setFeedback({
        type: "success",
        text: nextActive
          ? `✓ ${comp.name} activada para esta promotoría.`
          : `✓ ${comp.name} desactivada para esta promotoría (sin afectar a otras agencias).`,
      });
      fetchData();
    } else {
      alert("Error: " + res.message);
      fetchData();
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("El logo no debe exceder 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const rawUrl = event.target?.result as string;
      if (typeof window === "undefined") {
        setCompanyLogoUrlInput(rawUrl);
        return;
      }
      const img = new window.Image();
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 400;
          const scale = Math.min(1, MAX_WIDTH / img.width);
          canvas.width = Math.max(1, Math.round(img.width * scale));
          canvas.height = Math.max(1, Math.round(img.height * scale));
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            setCompanyLogoUrlInput(canvas.toDataURL("image/webp", 0.9));
          } else {
            setCompanyLogoUrlInput(rawUrl);
          }
        } catch {
          setCompanyLogoUrlInput(rawUrl);
        }
      };
      img.onerror = () => setCompanyLogoUrlInput(rawUrl);
      img.src = rawUrl;
    };
    reader.readAsDataURL(file);
  };

  // Inline Cartera Actions: Approval, Renewal Flag, Payment Modal
  const handleToggleAdminApproval = async (policyId: string, nextVal: boolean) => {
    startTransition(async () => {
      try {
        await togglePolicyAdminApproval(policyId, nextVal);
        setFeedback({
          type: "success",
          text: nextVal
            ? "✓ Póliza aprobada por Administración."
            : "Póliza marcada como pendiente de visto bueno.",
        });
        await fetchData();
      } catch (e: any) {
        setFeedback({ type: "error", text: e?.message || "Error al actualizar visto bueno" });
      }
    });
  };

  const handleToggleRenewalFlag = async (policyId: string, nextVal: boolean) => {
    startTransition(async () => {
      try {
        await togglePolicyRenewalFlag(policyId, nextVal);
        setFeedback({
          type: "success",
          text: nextVal
            ? "🔄 Póliza clasificada como Renovación (Año 2+)."
            : "✨ Póliza clasificada como Venta Nueva (Año 1).",
        });
        await fetchData();
        if (activeSubTab === "evaluador") {
          await fetchAudit();
        }
      } catch (e: any) {
        setFeedback({ type: "error", text: e?.message || "Error al cambiar clasificación" });
      }
    });
  };

  const openPayModal = (row: any) => {
    const unpaid = (row.receipts || []).find((r: any) => r.status !== "PAGADO") || row.receipts?.[0];
    if (!unpaid) {
      setFeedback({
        type: "error",
        text: `La póliza ${row.policyNumber} no tiene recibos pendientes.`,
      });
      return;
    }
    setPayTargetPolicy(row);
    setPayReceiptId(unpaid.id);
    setPayDateInput(
      unpaid.dueDate ||
        new Date().toLocaleDateString("en-CA", { timeZone: "America/Mexico_City" })
    );
    setPayAmountInput(String(Number((unpaid.paidAmount ?? unpaid.amount ?? 0).toFixed(2))));
    setPayNotesInput("");
    setPayModalOpen(true);
  };

  const handleConfirmReceiptPayment = async () => {
    if (!payReceiptId) return;
    startTransition(async () => {
      try {
        const parsedAmt = Number(payAmountInput);
        await markReceiptAsPaid({
          receiptId: payReceiptId,
          paidDate: payDateInput,
          paidAmount:
            payAmountInput !== "" && Number.isFinite(parsedAmt) && parsedAmt >= 0
              ? parsedAmt
              : undefined,
          paymentNotes: payNotesInput,
        });
        setPayModalOpen(false);
        setFeedback({
          type: "success",
          text: `✓ Recibo pagado en Mi Cartera para la póliza ${payTargetPolicy?.policyNumber} (${formatMoneyExact(parsedAmt || 0)} MXN).`,
        });
        await fetchData();
      } catch (e: any) {
        setFeedback({ type: "error", text: e?.message || "Error al registrar cobro" });
      }
    });
  };

  // Reconciliation Actions
  const handleRunDryRunReconcile = async () => {
    if (selectedGroupKeys.length === 0) {
      setFeedback({ type: "error", text: "Selecciona al menos un registro para simular." });
      return;
    }
    startTransition(async () => {
      const res = await reconcileHistoricalEmissionsToCartera({
        agencyId: selectedAgency,
        year: selectedYear,
        groupKeys: selectedGroupKeys,
        dryRun: true,
      });
      if (res.success) {
        setDryRunResult(res);
      } else {
        setFeedback({ type: "error", text: res.message || "Error en simulación" });
      }
    });
  };

  const handleExecuteReconcile = async () => {
    if (selectedGroupKeys.length === 0) {
      setFeedback({ type: "error", text: "Selecciona al menos un registro para conciliar." });
      return;
    }
    if (
      !confirm(
        `Se conciliarán ${selectedGroupKeys.length} póliza(s) hacia Mi Cartera de forma idempotente (sin duplicar ni borrar registros históricos de Producción). ¿Continuar?`
      )
    ) {
      return;
    }
    startTransition(async () => {
      const res = await reconcileHistoricalEmissionsToCartera({
        agencyId: selectedAgency,
        year: selectedYear,
        groupKeys: selectedGroupKeys,
        dryRun: false,
      });
      if (res.success) {
        setDryRunResult(null);
        setFeedback({
          type: "success",
          text: `✓ Conciliación aplicada: ${res.createdPolicies} póliza(s) creada(s) en Mi Cartera, ${res.updatedPolicies} enriquecida(s), ${res.markedReceiptsPaid} recibo(s) pagado(s).`,
        });
        await fetchData();
        await fetchAudit();
      } else {
        setFeedback({ type: "error", text: res.message || "Error al conciliar" });
      }
    });
  };

  // CSV Exports
  const handleExportCSV = () => {
    const rowsData = data?.ledgerRows || [];
    if (rowsData.length === 0) return;

    const label = (data?.periodInfo?.label || `${selectedYear}`).replace(/\s+/g, "_");
    const filename = `Produccion_Cartera_${label}.csv`;

    const headers = [
      "Folio / Poliza",
      "Aseguradora",
      "Asesor Titular",
      "Co-Agente",
      "% Compartida",
      "Cliente",
      "Grupo Ramo",
      "Sub-ramo",
      "Objetivo Vida",
      "Inicio Vigencia",
      "PE en Periodo MXN",
      "PPC en Periodo MXN",
      "Recibos Pagados Periodo",
      "Renovacion",
      "Visto Bueno Admin",
    ];

    const rows = rowsData.map((r: any) => [
      `"${r.policyNumber || ""}"`,
      `"${r.canonicalCompany || r.insuranceCompany || ""}"`,
      `"${r.ownerAgentName || ""}"`,
      `"${r.sharedWithAgentName || ""}"`,
      r.sharedPercentage || 0,
      `"${(r.clientName || "").replace(/"/g, '""')}"`,
      `"${r.ramoInfo?.groupLabel || ""}"`,
      `"${r.ramoInfo?.subRamoLabel || ""}"`,
      `"${r.ramoInfo?.vidaObjetivoLabel || ""}"`,
      `"${r.effectiveDate || ""}"`,
      r.peInPeriod || 0,
      r.ppcInPeriod || 0,
      r.paidReceiptsInPeriod || 0,
      r.isRenewalCapture ? "SI" : "NO",
      r.adminApproved ? "APROBADA" : "PENDIENTE",
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

  const handleExportAuditCSV = () => {
    const items = auditData?.reconciliationItems || [];
    if (items.length === 0) return;
    const headers = [
      "Estatus Conciliacion",
      "Poliza",
      "Cliente",
      "Aseguradora Produccion",
      "Aseguradora Cartera",
      "Agente Titular",
      "Co-Agente",
      "% Co-Agente",
      "Antes PE MXN",
      "Despues PE MXN",
      "Antes PPC MXN",
      "Despues PPC MXN",
      "Hallazgos",
    ];
    const rows = items.map((i: any) => [
      `"${i.status}"`,
      `"${i.policyNumber}"`,
      `"${(i.clientName || "").replace(/"/g, '""')}"`,
      `"${i.companyName || ""}"`,
      `"${i.existingCompanyName || ""}"`,
      `"${i.ownerAgentName || ""}"`,
      `"${i.sharedWithAgentName || ""}"`,
      i.sharedPercentage || 0,
      i.beforePE || 0,
      i.afterPE || 0,
      i.beforePPC || 0,
      i.afterPPC || 0,
      `"${(i.differences || []).join(" | ").replace(/"/g, '""')}"`,
    ]);
    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r: any[]) => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `Auditoria_Antes_Despues_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const kpis = data?.kpis;
  const companies = data?.companies || [];
  const catalogCompanies = data?.catalogCompanies || companies;
  const agentMatrix = data?.agentMatrix || [];
  const ledgerRows = data?.ledgerRows || [];
  const agencies = data?.agencies || [];
  const effectiveUiAgencyId =
    selectedAgency === "DEFAULT" ? data?.selectedAgencyId : selectedAgency;
  const selectedUiAgencyObj = agencies.find((ag: any) => ag.id === effectiveUiAgencyId);
  const isSelectedMainAgency = Boolean(
    selectedUiAgencyObj
      ? selectedUiAgencyObj.id === "aacom" || selectedUiAgencyObj.slug === "aacom"
      : data?.canAccessGrokbotBridge && effectiveUiAgencyId === data?.selectedAgencyId
  );
  const canShowGrokbotBridge =
    data?.currentUserRole === "SUPER_ADMIN" &&
    Boolean(data?.canAccessGrokbotBridge) &&
    isSelectedMainAgency;

  useEffect(() => {
    if (activeSubTab === "grokbot" && data && !canShowGrokbotBridge) {
      setActiveSubTab("dashboard");
    }
  }, [activeSubTab, data, canShowGrokbotBridge]);

  const periodInfo = data?.periodInfo;
  const periodLabel = periodInfo?.label || `${MONTHS.find((m) => m.value === selectedMonth)?.name} ${selectedYear}`;
  const currentAgencyName =
    agencies.find((ag: any) => ag.id === selectedAgency)?.name || "esta promotoría";

  const filteredLedgerRows = useMemo(() => {
    if (!searchQuery.trim()) return ledgerRows;
    const q = searchQuery.toLowerCase().trim();
    return ledgerRows.filter(
      (r: any) =>
        (r.policyNumber || "").toLowerCase().includes(q) ||
        (r.clientName || "").toLowerCase().includes(q) ||
        (r.ownerAgentName || "").toLowerCase().includes(q) ||
        (r.sharedWithAgentName || "").toLowerCase().includes(q) ||
        (r.canonicalCompany || "").toLowerCase().includes(q) ||
        (r.ramoInfo?.fullLabel || "").toLowerCase().includes(q)
    );
  }, [ledgerRows, searchQuery]);

  const filteredAuditItems = useMemo(() => {
    const items = auditData?.reconciliationItems || [];
    if (auditFilter === "ALL") return items;
    return items.filter((i: any) => i.status === auditFilter);
  }, [auditData, auditFilter]);

  const visibleSubRamoCards = useMemo(() => {
    if (ramoGroupFilter === "ALL") return SUB_RAMOS_CATALOG;
    return SUB_RAMOS_CATALOG.filter((sr) => sr.groupKey === ramoGroupFilter);
  }, [ramoGroupFilter]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Controls & Navigation Bar */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 pb-4 border-b border-slate-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-teal-700 to-emerald-600 flex items-center justify-center text-white shadow-md">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-zinc-100 flex flex-wrap items-center gap-2">
                Resultados de Producción y Primas
                <span className="text-xs font-bold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 px-2.5 py-0.5 rounded-full border border-teal-200 dark:border-teal-800">
                  {periodLabel}
                </span>
              </h2>
              <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">
                Fuente única en vivo desde <strong>Mi Cartera 360° (MXN)</strong> • Sin doble captura.
              </p>
            </div>
          </div>
        </div>

        {/* Sub-tab Navigation + Direct Cartera Capture */}
        <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto justify-between xl:justify-end">
          <div className="flex flex-wrap bg-slate-100 dark:bg-zinc-900 p-1 rounded-xl border border-slate-200 dark:border-zinc-800">
            <button
              onClick={() => setActiveSubTab("dashboard")}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeSubTab === "dashboard"
                  ? "bg-white dark:bg-zinc-800 text-teal-700 dark:text-teal-400 shadow-sm"
                  : "text-slate-600 dark:text-zinc-400 hover:text-slate-900"
              }`}
            >
              <Award className="h-3.5 w-3.5" /> Dashboard
            </button>
            <button
              onClick={() => setActiveSubTab("ingreso")}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeSubTab === "ingreso"
                  ? "bg-white dark:bg-zinc-800 text-teal-700 dark:text-teal-400 shadow-sm"
                  : "text-slate-600 dark:text-zinc-400 hover:text-slate-900"
              }`}
            >
              <FileSpreadsheet className="h-3.5 w-3.5" /> Pólizas y Cobranza
              {ledgerRows.length > 0 && (
                <Badge className="ml-0.5 bg-teal-600 text-white font-mono text-[10px] px-1.5 py-0">
                  {ledgerRows.length}
                </Badge>
              )}
            </button>
            <button
              onClick={() => setActiveSubTab("evaluador")}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeSubTab === "evaluador"
                  ? "bg-white dark:bg-zinc-800 text-indigo-700 dark:text-indigo-400 shadow-sm"
                  : "text-slate-600 dark:text-zinc-400 hover:text-slate-900"
              }`}
            >
              <Scale className="h-3.5 w-3.5" /> Evaluador Antes vs. Después
            </button>
            <button
              onClick={() => setActiveSubTab("companias")}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeSubTab === "companias"
                  ? "bg-white dark:bg-zinc-800 text-teal-700 dark:text-teal-400 shadow-sm"
                  : "text-slate-600 dark:text-zinc-400 hover:text-slate-900"
              }`}
            >
              <Building2 className="h-3.5 w-3.5" /> Aseguradoras
            </button>
            {canShowGrokbotBridge && (
              <button
                onClick={() => setActiveSubTab("grokbot")}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeSubTab === "grokbot"
                    ? "bg-white dark:bg-zinc-800 text-indigo-700 dark:text-indigo-400 shadow-sm"
                    : "text-slate-600 dark:text-zinc-400 hover:text-slate-900"
                }`}
              >
                <Bot className="h-3.5 w-3.5" /> Puente Grokbot
              </button>
            )}
          </div>

          <QuickPdfAiPolicyDialog
            targetAgencyId={selectedAgency}
            buttonLabel="Capturar en Mi Cartera"
            buttonClassName="bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-sm"
            onSavedSuccess={fetchData}
          />
        </div>
      </div>

      {/* Filter & Temporality Toolbar */}
      <Card className="border border-slate-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-950">
        <CardContent className="p-3.5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {/* Temporalidad */}
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-slate-400" />
                <select
                  value={periodMode}
                  onChange={(e) => handlePeriodModeChange(e.target.value as PeriodMode)}
                  className="text-xs font-bold py-1.5 px-2.5 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-sm cursor-pointer"
                >
                  <option value="MENSUAL">Mensual</option>
                  <option value="BIMESTRAL">Bimestral</option>
                  <option value="TRIMESTRAL">Trimestral</option>
                  <option value="SEMESTRAL">Semestral</option>
                  <option value="ANUAL">Anual</option>
                  <option value="CUSTOM">Rango Libre</option>
                </select>
              </div>

              {/* Sub-periodo contextual */}
              {periodMode === "MENSUAL" && (
                <select
                  value={selectedMonth}
                  onChange={(e) => {
                    const m = parseInt(e.target.value, 10);
                    setSelectedMonth(m);
                    setSubPeriod(m);
                  }}
                  className="text-xs font-bold py-1.5 px-2.5 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-sm cursor-pointer"
                >
                  {MONTHS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.name}
                    </option>
                  ))}
                </select>
              )}

              {periodMode === "BIMESTRAL" && (
                <select
                  value={subPeriod}
                  onChange={(e) => setSubPeriod(parseInt(e.target.value, 10))}
                  className="text-xs font-bold py-1.5 px-2.5 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-sm cursor-pointer"
                >
                  {BIMESTRES.map((b) => (
                    <option key={b.value} value={b.value}>
                      {b.name}
                    </option>
                  ))}
                </select>
              )}

              {periodMode === "TRIMESTRAL" && (
                <select
                  value={subPeriod}
                  onChange={(e) => setSubPeriod(parseInt(e.target.value, 10))}
                  className="text-xs font-bold py-1.5 px-2.5 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-sm cursor-pointer"
                >
                  {TRIMESTRES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.name}
                    </option>
                  ))}
                </select>
              )}

              {periodMode === "SEMESTRAL" && (
                <select
                  value={subPeriod}
                  onChange={(e) => setSubPeriod(parseInt(e.target.value, 10))}
                  className="text-xs font-bold py-1.5 px-2.5 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-sm cursor-pointer"
                >
                  {SEMESTRES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.name}
                    </option>
                  ))}
                </select>
              )}

              {periodMode !== "CUSTOM" ? (
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                  className="text-xs font-bold py-1.5 px-2.5 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-sm cursor-pointer"
                >
                  {[2024, 2025, 2026, 2027].map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="flex items-center gap-1.5">
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="text-xs font-semibold py-1 px-2 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                  />
                  <span className="text-xs text-slate-400">a</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="text-xs font-semibold py-1 px-2 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                  />
                </div>
              )}

              {/* Super Admin Agency */}
              {data?.currentUserRole === "SUPER_ADMIN" && agencies.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-slate-400" />
                  <select
                    value={selectedAgency}
                    onChange={(e) => {
                      setFilterAgentId("ALL");
                      setFilterCompanyId("ALL");
                      setSelectedAgency(e.target.value);
                    }}
                    className="text-xs font-bold py-1.5 px-2.5 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-sm cursor-pointer"
                  >
                    {agencies.map((ag: any) => (
                      <option key={ag.id} value={ag.id}>
                        {ag.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
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
                disabled={ledgerRows.length === 0}
                className="text-xs font-bold flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50"
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
          </div>

          {/* Segunda fila: Alcance Comercial (Nueva vs Renovación vs Ambas) & Filtro Ramo activo */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 mr-1">
                Alcance Comercial:
              </span>
              {(
                [
                  { id: "NUEVA", label: "✨ Venta Nueva (Año 1)" },
                  { id: "RENOVACION", label: "🔄 Renovaciones (Año 2+)" },
                  { id: "AMBAS", label: "📊 Ambas (Total Cartera)" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setBusinessScope(opt.id)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition ${
                    businessScope === opt.id
                      ? "bg-teal-700 text-white border-teal-700 shadow-sm"
                      : "bg-slate-50 dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:border-teal-400"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {(ramoGroupFilter !== "ALL" ||
              subRamoFilter !== "ALL" ||
              vidaObjetivoFilter !== "ALL") && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setRamoGroupFilter("ALL");
                  setSubRamoFilter("ALL");
                  setVidaObjetivoFilter("ALL");
                }}
                className="h-7 text-xs font-bold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50"
              >
                <XCircle className="h-3.5 w-3.5 mr-1" />
                Limpiar filtro de Ramo ({subRamoFilter !== "ALL" ? subRamoFilter : ramoGroupFilter})
              </Button>
            )}
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

      {/* SUBTAB 1: DASHBOARD DE RESULTADOS */}
      {activeSubTab === "dashboard" && (
        <div className="space-y-6">
          {!loading && companies.length === 0 && (
            <div className="p-4 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50/80 dark:bg-amber-950/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="text-xs text-amber-900 dark:text-amber-200">
                <strong className="font-black">Aún no hay aseguradoras activadas en esta promotoría.</strong>{" "}
                Enciende las compañías con las que trabaja tu equipo para habilitar sus columnas en el tablero.
              </div>
              <Button
                type="button"
                size="sm"
                onClick={() => setActiveSubTab("companias")}
                className="text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shrink-0"
              >
                <Building2 className="h-3.5 w-3.5 mr-1.5" />
                Activar Aseguradoras
              </Button>
            </div>
          )}

          {/* Unmapped insurers alert (policies exist in Mi Cartera for an inactive/missing company) */}
          {!loading && (data?.unmappedInsurersSummary?.length || 0) > 0 && (
            <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/70 dark:bg-indigo-950/30 space-y-2">
              <div className="text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-indigo-600 shrink-0" />
                Hay pólizas en Mi Cartera para aseguradoras aún apagadas en columnas del tablero:
              </div>
              <div className="flex flex-wrap gap-2">
                {data.unmappedInsurersSummary.map((u: any) => (
                  <Button
                    key={u.companyKey}
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isPending}
                    onClick={() => handleQuickEnableCompany(u)}
                    className="h-7 text-xs font-bold bg-white dark:bg-zinc-900 border-indigo-300 text-indigo-800 dark:text-indigo-200 hover:bg-indigo-100"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Activar {u.companyName} ({u.count} pól., PE {formatMoney(u.totalPE)}, PPC {formatMoney(u.totalPPC)})
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Header Banner */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-teal-900 via-teal-800 to-emerald-900 p-6 text-white shadow-xl">
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black tracking-widest uppercase text-emerald-300 bg-white/10 px-2.5 py-0.5 rounded-md">
                    Producción Unificada en Vivo
                  </span>
                  <span className="text-xs text-teal-200 font-medium">
                    {businessScope === "NUEVA"
                      ? "Venta Nueva (Año 1)"
                      : businessScope === "RENOVACION"
                      ? "Renovaciones (Año 2+)"
                      : "Nueva + Renovaciones"}
                  </span>
                </div>
                <h1 className="text-2xl md:text-4xl font-black tracking-tight text-white uppercase">
                  {periodLabel}
                </h1>
                <p className="text-xs text-teal-100/80 font-medium">
                  Primas en MXN calculadas desde Mi Cartera (PE por inicio de vigencia • PPC por fecha real de cobro del recibo).
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-xs text-teal-200 font-semibold">Tasa de Cumplimiento</div>
                  <div className="text-2xl font-black text-emerald-300">
                    {kpis?.compliancePercent || 0}%
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute right-0 top-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border border-slate-200 dark:border-zinc-800 shadow-sm bg-gradient-to-br from-white to-teal-50/40 dark:from-zinc-950 dark:to-teal-950/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-teal-700 dark:text-teal-400">
                    Pólizas Activas en Periodo
                  </span>
                  <div className="h-8 w-8 rounded-full bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center text-teal-700 dark:text-teal-300">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                </div>
                <div className="text-3xl md:text-4xl font-black text-slate-900 dark:text-zinc-100 mt-2">
                  {kpis?.totalPolicies || 0}
                </div>
                <p className="text-[11px] font-bold text-slate-500 mt-1">
                  {kpis?.emittedPoliciesCount || 0} emitidas • {kpis?.paidReceiptsCount || 0} recibos cobrados
                </p>
              </CardContent>
            </Card>

            <Card className="border border-slate-200 dark:border-zinc-800 shadow-sm bg-gradient-to-br from-white to-blue-50/40 dark:from-zinc-950 dark:to-blue-950/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-blue-700 dark:text-blue-400">
                    Prima Emitida (PE MXN)
                  </span>
                  <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-700 dark:text-blue-300">
                    <Shield className="h-4 w-4" />
                  </div>
                </div>
                <div className="text-2xl md:text-3xl font-black text-slate-900 dark:text-zinc-100 mt-2 truncate">
                  {formatMoney(kpis?.totalPE || 0)}
                </div>
                <p className="text-[11px] font-bold text-slate-500 mt-1">
                  Prima anualizada en pesos mexicanos
                </p>
              </CardContent>
            </Card>

            <Card className="border border-slate-200 dark:border-zinc-800 shadow-sm bg-gradient-to-br from-white to-emerald-50/40 dark:from-zinc-950 dark:to-emerald-950/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                    Prima Pagada (PPC MXN)
                  </span>
                  <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-700 dark:text-emerald-300">
                    <DollarSign className="h-4 w-4" />
                  </div>
                </div>
                <div className="text-2xl md:text-3xl font-black text-emerald-700 dark:text-emerald-400 mt-2 truncate">
                  {formatMoney(kpis?.totalPPC || 0)}
                </div>
                <p className="text-[11px] font-bold text-slate-500 mt-1">
                  Recibos cobrados en el periodo
                </p>
              </CardContent>
            </Card>

            <Card className="border border-slate-200 dark:border-zinc-800 shadow-sm bg-gradient-to-br from-white to-purple-50/40 dark:from-zinc-950 dark:to-purple-950/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-purple-700 dark:text-purple-400">
                    Presupuesto PEA ({periodInfo?.monthsIncluded?.length || 1}m)
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

          {/* SECCIÓN INTERACTIVA POR RAMOS Y SUB-RAMOS (MXN) */}
          <Card className="border border-slate-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-950">
            <CardHeader className="py-3.5 border-b border-slate-200 dark:border-zinc-800">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
                <div>
                  <CardTitle className="text-sm font-black uppercase tracking-wider text-slate-700 dark:text-zinc-200 flex items-center gap-2">
                    <Layers className="h-4 w-4 text-teal-700" />
                    Producción por Ramos y Sub-ramos (MXN)
                  </CardTitle>
                  <CardDescription className="text-[11px]">
                    Haz clic en cualquier grupo o sub-ramo para filtrar el tablero y ver su detalle en vivo.
                  </CardDescription>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setRamoGroupFilter("ALL");
                      setSubRamoFilter("ALL");
                      setVidaObjetivoFilter("ALL");
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
                      ramoGroupFilter === "ALL" && subRamoFilter === "ALL"
                        ? "bg-slate-900 text-white border-slate-900 dark:bg-zinc-100 dark:text-zinc-900"
                        : "bg-slate-50 dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-zinc-700"
                    }`}
                  >
                    Todos
                  </button>
                  {RAMO_GROUPS.map((g) => {
                    const gStat = kpis?.byRamoGroup?.find((b: any) => b.key === g.key);
                    const active = ramoGroupFilter === g.key;
                    return (
                      <button
                        key={g.key}
                        type="button"
                        onClick={() => {
                          setRamoGroupFilter(active ? "ALL" : g.key);
                          setSubRamoFilter("ALL");
                          if (g.key !== "VIDA") setVidaObjetivoFilter("ALL");
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition flex items-center gap-1 ${
                          active
                            ? "bg-teal-700 text-white border-teal-700"
                            : "bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:border-teal-400"
                        }`}
                      >
                        <span>{g.label}</span>
                        {gStat && (gStat.totalPE > 0 || gStat.totalPPC > 0) && (
                          <span className="opacity-75 font-mono text-[10px]">
                            ({gStat.count})
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
                {visibleSubRamoCards.map((sr) => {
                  const stat = kpis?.bySubRamo?.find((b: any) => b.key === sr.key);
                  const isActive = subRamoFilter === sr.key;
                  return (
                    <button
                      key={sr.key}
                      type="button"
                      onClick={() => {
                        const next = isActive ? "ALL" : sr.key;
                        setSubRamoFilter(next);
                        if (next !== "VIDA_INDIVIDUAL") setVidaObjetivoFilter("ALL");
                      }}
                      className={`p-3 rounded-xl border text-left transition flex flex-col justify-between gap-1 ${
                        isActive
                          ? "border-teal-600 bg-teal-50/70 dark:bg-teal-950/40 ring-2 ring-teal-500/30"
                          : "border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:border-teal-400"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <div className="h-7 w-7 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0">
                          {getRamoIcon(sr.key)}
                        </div>
                        <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0">
                          {stat?.count || 0} pól.
                        </Badge>
                      </div>
                      <div className="text-xs font-black text-slate-900 dark:text-zinc-100 leading-tight mt-1">
                        {sr.label}
                      </div>
                      <div className="space-y-0.5 text-[10px] font-mono">
                        <div className="text-slate-700 dark:text-zinc-300 font-bold">
                          PE: {formatMoney(stat?.totalPE || 0)}
                        </div>
                        <div className="text-emerald-700 dark:text-emerald-400 font-bold">
                          PPC: {formatMoney(stat?.totalPPC || 0)}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Sub-desglose Vida Individual (Protección / Ahorro / Retiro / Educación) */}
              {(ramoGroupFilter === "ALL" ||
                ramoGroupFilter === "VIDA" ||
                subRamoFilter === "VIDA_INDIVIDUAL") && (
                <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 dark:text-blue-300">
                    Objetivo Vida Individual:
                  </span>
                  {VIDA_OBJETIVOS_CATALOG.map((vo) => {
                    const st = kpis?.byVidaObjetivo?.find((x: any) => x.key === vo.key);
                    const active = vidaObjetivoFilter === vo.key;
                    return (
                      <button
                        key={vo.key}
                        type="button"
                        onClick={() => {
                          const next = active ? "ALL" : vo.key;
                          setVidaObjetivoFilter(next);
                          if (next !== "ALL") setSubRamoFilter("VIDA_INDIVIDUAL");
                        }}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition flex items-center gap-1.5 ${
                          active
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-blue-50/60 dark:bg-blue-950/30 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800 hover:bg-blue-100"
                        }`}
                      >
                        {getRamoIcon(vo.key)}
                        <span>{vo.label}:</span>
                        <span className="font-mono">
                          {st?.count || 0} • PE {formatMoney(st?.totalPE || 0)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* TABLA PRINCIPAL DE PRODUCCIÓN (MATRIZ AGENTES X ASEGURADORAS) */}
          <Card className="border border-slate-200 dark:border-zinc-800 shadow-md bg-white dark:bg-zinc-950 overflow-hidden">
            <CardHeader className="py-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-900/40">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <CardTitle className="text-base font-black text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                  <Award className="h-5 w-5 text-teal-700 dark:text-teal-400" />
                  Tabla de Emisiones por Asesor y Aseguradora (MXN)
                </CardTitle>
                <span className="text-xs text-slate-500 font-medium">
                  {agentMatrix.length} agentes registrados • Da clic en cualquier asesor para ver sus pólizas en Mi Cartera
                </span>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-zinc-900 border-b border-slate-300 dark:border-zinc-800 text-slate-700 dark:text-zinc-300">
                      <th
                        rowSpan={2}
                        className="py-3 px-3 font-black uppercase tracking-wider sticky left-0 bg-slate-100 dark:bg-zinc-900 z-10 border-r border-slate-200 dark:border-zinc-800 min-w-[160px]"
                      >
                        Agente / Asesor
                      </th>

                      {companies.map((comp: any) => (
                        <th
                          key={comp.id}
                          colSpan={3}
                          className="py-2.5 px-2 text-center font-black border-r border-slate-200 dark:border-zinc-800 bg-teal-900 text-white"
                          style={{
                            backgroundColor: comp.name.toLowerCase().includes("insignia")
                              ? "#134e4a"
                              : undefined,
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

                      <th
                        colSpan={3}
                        className="py-2.5 px-2 text-center font-black bg-slate-800 text-white border-r border-slate-700"
                      >
                        Totales Generales
                      </th>
                      <th
                        rowSpan={2}
                        className="py-3 px-3 text-center font-black uppercase bg-purple-900 text-white border-r border-purple-800 min-w-[110px]"
                      >
                        Presupuesto PEA
                      </th>
                      <th
                        rowSpan={2}
                        className="py-3 px-3 text-center font-black uppercase bg-emerald-900 text-white min-w-[90px]"
                      >
                        % Avance
                      </th>
                    </tr>

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

                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                    {agentMatrix.length === 0 ? (
                      <tr>
                        <td
                          colSpan={companies.length * 3 + 6}
                          className="py-12 text-center text-slate-500 font-semibold"
                        >
                          No hay agentes ni pólizas registradas para {periodLabel}.
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
                            <td
                              onClick={() => handleOpenDetailModal(row, "ALL")}
                              className="py-2.5 px-3 font-bold text-slate-900 dark:text-zinc-100 sticky left-0 bg-inherit z-10 border-r border-slate-200 dark:border-zinc-800 cursor-pointer group hover:bg-teal-50/70 dark:hover:bg-teal-950/30 transition-colors"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="h-6 w-6 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300 flex items-center justify-center font-black text-[10px] shrink-0">
                                    {row.agentName.charAt(0).toUpperCase()}
                                  </div>
                                  <span
                                    className="truncate max-w-[130px] text-xs group-hover:text-teal-700 dark:group-hover:text-teal-300 group-hover:underline"
                                    title={row.agentName}
                                  >
                                    {row.agentName}
                                  </span>
                                </div>
                                <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] bg-teal-100 text-teal-800 dark:bg-teal-900/80 dark:text-teal-200 px-1.5 py-0.5 rounded font-black flex items-center gap-0.5 shrink-0">
                                  <Eye className="h-2.5 w-2.5" /> Ver
                                </span>
                              </div>
                            </td>

                            {companies.map((comp: any) => {
                              const cData = row.companiesData[comp.id] || {
                                policies: 0,
                                pe: 0,
                                ppc: 0,
                              };
                              return (
                                <React.Fragment key={comp.id}>
                                  <td
                                    onClick={() =>
                                      cData.policies > 0 && handleOpenDetailModal(row, comp.id)
                                    }
                                    className={`py-2.5 px-2 text-center border-r border-slate-100 dark:border-zinc-800 font-mono ${
                                      cData.policies > 0
                                        ? "font-black text-teal-700 dark:text-teal-400 cursor-pointer hover:bg-teal-100/60"
                                        : "text-slate-300 dark:text-zinc-700"
                                    }`}
                                  >
                                    {cData.policies > 0 ? (
                                      <span className="inline-block px-1.5 py-0.5 rounded bg-teal-50 dark:bg-teal-950/60 border border-teal-200/60 text-teal-800 dark:text-teal-300 font-black">
                                        {cData.policies}
                                      </span>
                                    ) : (
                                      "-"
                                    )}
                                  </td>
                                  <td
                                    onClick={() =>
                                      cData.pe > 0 && handleOpenDetailModal(row, comp.id)
                                    }
                                    className={`py-2.5 px-2 text-right border-r border-slate-100 dark:border-zinc-800 font-mono ${
                                      cData.pe > 0
                                        ? "font-bold text-slate-900 dark:text-zinc-100 cursor-pointer"
                                        : "text-slate-300 dark:text-zinc-700"
                                    }`}
                                  >
                                    {cData.pe > 0 ? formatMoney(cData.pe).replace("$", "") : "-"}
                                  </td>
                                  <td
                                    onClick={() =>
                                      cData.ppc > 0 && handleOpenDetailModal(row, comp.id)
                                    }
                                    className={`py-2.5 px-2 text-right border-r border-slate-100 dark:border-zinc-800 font-mono ${
                                      cData.ppc > 0
                                        ? "font-semibold text-emerald-700 dark:text-emerald-400 cursor-pointer"
                                        : "text-slate-300 dark:text-zinc-700"
                                    }`}
                                  >
                                    {cData.ppc > 0 ? formatMoney(cData.ppc).replace("$", "") : "-"}
                                  </td>
                                </React.Fragment>
                              );
                            })}

                            <td
                              onClick={() =>
                                row.totalPolicies > 0 && handleOpenDetailModal(row, "ALL")
                              }
                              className={`py-2.5 px-2 text-center font-mono font-black border-r border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/40 ${
                                row.totalPolicies > 0
                                  ? "text-teal-700 dark:text-teal-400 cursor-pointer"
                                  : "text-slate-900 dark:text-zinc-100"
                              }`}
                            >
                              {row.totalPolicies > 0 ? row.totalPolicies : "-"}
                            </td>
                            <td
                              onClick={() => row.totalPE > 0 && handleOpenDetailModal(row, "ALL")}
                              className="py-2.5 px-2 text-right font-mono font-black text-slate-900 dark:text-zinc-100 bg-slate-50 dark:bg-zinc-900/40 border-r border-slate-200 dark:border-zinc-800 cursor-pointer"
                            >
                              {row.totalPE > 0 ? formatMoney(row.totalPE).replace("$", "") : "-"}
                            </td>
                            <td
                              onClick={() => row.totalPPC > 0 && handleOpenDetailModal(row, "ALL")}
                              className="py-2.5 px-2 text-right font-mono font-black text-emerald-700 dark:text-emerald-400 bg-slate-50 dark:bg-zinc-900/40 border-r border-slate-200 dark:border-zinc-800 cursor-pointer"
                            >
                              {row.totalPPC > 0 ? formatMoney(row.totalPPC).replace("$", "") : "-"}
                            </td>

                            <td className="py-2.5 px-2 text-right font-mono border-r border-slate-200 dark:border-zinc-800 bg-purple-50/30 dark:bg-purple-950/20">
                              <div className="flex items-center justify-end gap-1">
                                <span className="font-bold text-purple-900 dark:text-purple-300">
                                  {row.budget > 0 ? formatMoney(row.budget).replace("$", "") : "-"}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleOpenBudgetModal(row)}
                                  className="text-purple-500 hover:text-purple-700 p-0.5 rounded hover:bg-purple-100"
                                  title="Editar presupuesto del mes seleccionado"
                                >
                                  <Edit className="h-3 w-3" />
                                </button>
                              </div>
                            </td>

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

                  {agentMatrix.length > 0 && (
                    <tfoot>
                      <tr className="bg-slate-900 text-white font-black text-xs border-t-2 border-slate-900">
                        <td className="py-3 px-3 uppercase tracking-wider sticky left-0 bg-slate-900 z-10 border-r border-slate-800">
                          TOTALES
                        </td>

                        {companies.map((comp: any) => {
                          const cPolicies = agentMatrix.reduce(
                            (acc: number, curr: any) =>
                              acc + (curr.companiesData[comp.id]?.policies || 0),
                            0
                          );
                          const cPE = agentMatrix.reduce(
                            (acc: number, curr: any) =>
                              acc + (curr.companiesData[comp.id]?.pe || 0),
                            0
                          );
                          const cPPC = agentMatrix.reduce(
                            (acc: number, curr: any) =>
                              acc + (curr.companiesData[comp.id]?.ppc || 0),
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

                        <td className="py-3 px-2 text-center font-mono bg-slate-950 border-r border-slate-800 text-emerald-400">
                          {kpis?.totalPolicies || 0}
                        </td>
                        <td className="py-3 px-2 text-right font-mono bg-slate-950 border-r border-slate-800 text-emerald-400">
                          {formatMoney(kpis?.totalPE || 0).replace("$", "")}
                        </td>
                        <td className="py-3 px-2 text-right font-mono bg-slate-950 border-r border-slate-800 text-emerald-400">
                          {formatMoney(kpis?.totalPPC || 0).replace("$", "")}
                        </td>
                        <td className="py-3 px-2 text-right font-mono bg-purple-950 border-r border-purple-900 text-purple-200">
                          {formatMoney(kpis?.totalBudget || 0).replace("$", "")}
                        </td>
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
        </div>
      )}

      {/* SUBTAB 2: PÓLIZAS Y COBRANZA DESDE MI CARTERA (SIN DOBLE CAPTURA) */}
      {activeSubTab === "ingreso" && (
        <div className="space-y-6">
          <Card className="border border-slate-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-950 overflow-hidden">
            <CardHeader className="py-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base font-black text-slate-800 dark:text-zinc-100 flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4 text-teal-700" />
                    Pólizas y Cobranza Unificada — {periodLabel} ({filteredLedgerRows.length})
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Toda captura nueva se guarda directo en <strong>Mi Cartera</strong> y alimenta automáticamente Producción y Ranking en MXN.
                  </CardDescription>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative w-full sm:w-64">
                    <Search className="h-3.5 w-3.5 absolute left-3 top-3 text-slate-400" />
                    <Input
                      type="text"
                      placeholder="Buscar póliza, cliente, agente..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 text-xs py-1.5 bg-white dark:bg-zinc-900"
                    />
                  </div>
                  <QuickPdfAiPolicyDialog
                    targetAgencyId={selectedAgency}
                    buttonLabel="+ Nueva Póliza en Cartera"
                    buttonClassName="bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold"
                    onSavedSuccess={fetchData}
                  />
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {filteredLedgerRows.length === 0 ? (
                <div className="py-16 text-center text-slate-500 text-xs space-y-2">
                  <p>No hay pólizas con emisión o cobranza dentro del rango {periodLabel}.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-zinc-900 text-[10px] font-black uppercase text-slate-500 border-b border-slate-200 dark:border-zinc-800">
                      <tr>
                        <th className="py-2.5 px-3">Vigencia</th>
                        <th className="py-2.5 px-3">Asesor(es)</th>
                        <th className="py-2.5 px-3">Aseguradora</th>
                        <th className="py-2.5 px-3">Cliente / Folio</th>
                        <th className="py-2.5 px-3">Ramo / Sub-ramo</th>
                        <th className="py-2.5 px-3 text-right">PE Periodo</th>
                        <th className="py-2.5 px-3 text-right">PPC Periodo</th>
                        <th className="py-2.5 px-3 text-center">Clasificación / Visto Bueno</th>
                        <th className="py-2.5 px-3 text-center">Cobranza</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                      {filteredLedgerRows.map((row: any) => {
                        const hasUnpaidReceipt = (row.receipts || []).some(
                          (r: any) => r.status !== "PAGADO"
                        );
                        return (
                          <tr
                            key={row.policyId}
                            className="hover:bg-slate-50/70 dark:hover:bg-zinc-900/50 transition-colors"
                          >
                            <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-zinc-400 whitespace-nowrap">
                              {row.effectiveDate || "-"}
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-slate-900 dark:text-zinc-100">
                                {row.ownerAgentName}
                              </div>
                              {row.sharedWithUserId && (
                                <Badge
                                  variant="outline"
                                  className="mt-0.5 text-[10px] px-1.5 py-0 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300"
                                >
                                  🤝 {row.sharedPercentage}% {row.sharedWithAgentName}
                                </Badge>
                              )}
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-slate-700 dark:text-zinc-300">
                              {row.canonicalCompany}
                            </td>
                            <td className="py-2.5 px-3">
                              {row.clientId ? (
                                <Link
                                  href={`/cartera/clientes/${row.clientId}`}
                                  className="font-bold text-primary hover:underline block"
                                >
                                  {row.clientName}
                                </Link>
                              ) : (
                                <span className="font-bold text-slate-800 dark:text-zinc-200 block">
                                  {row.clientName}
                                </span>
                              )}
                              <div className="text-[10px] font-mono text-slate-400">
                                {row.policyNumber} • {row.paymentMethod || "Anual"}
                              </div>
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 dark:text-zinc-300">
                                {getRamoIcon(row.ramoInfo?.subRamoKey)}
                                {row.ramoInfo?.fullLabel}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-zinc-100 whitespace-nowrap">
                              {formatMoney(row.peInPeriod)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                              {formatMoney(row.ppcInPeriod)}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <div className="flex flex-col items-center gap-1">
                                <button
                                  type="button"
                                  disabled={isPending}
                                  onClick={() =>
                                    handleToggleAdminApproval(row.policyId, !row.adminApproved)
                                  }
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition ${
                                    row.adminApproved
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300"
                                      : "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300"
                                  }`}
                                  title="Alternar Visto Bueno de Administración"
                                >
                                  {row.adminApproved ? "✓ Aprobada" : "⏳ Pend. Visto Bueno"}
                                </button>
                                <button
                                  type="button"
                                  disabled={isPending}
                                  onClick={() =>
                                    handleToggleRenewalFlag(row.policyId, !row.isRenewalCapture)
                                  }
                                  className="text-[10px] text-slate-500 hover:text-indigo-600 underline"
                                >
                                  {row.isRenewalCapture ? "🔄 Renovación" : "✨ Venta Nueva"}
                                </button>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {hasUnpaidReceipt ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openPayModal(row)}
                                  className="h-7 text-[11px] font-bold border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                                >
                                  <DollarSign className="h-3 w-3 mr-1" />
                                  Cobrar Recibo
                                </Button>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200"
                                >
                                  ✓ Pagos al día
                                </Badge>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* SUBTAB 4: EVALUADOR ANTES VS. DESPUÉS Y CONCILIADOR NO DESTRUCTIVO */}
      {activeSubTab === "evaluador" && (
        <div className="space-y-6">
          <Card className="border border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-r from-indigo-50/70 via-white to-teal-50/60 dark:from-indigo-950/20 dark:via-zinc-950 dark:to-teal-950/20">
            <CardHeader className="py-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base font-black flex items-center gap-2 text-indigo-950 dark:text-indigo-200">
                    <Scale className="h-5 w-5 text-indigo-600" />
                    Evaluador Antes vs. Después — Año {selectedYear} (Auditable y No Destructivo)
                  </CardTitle>
                  <CardDescription className="text-xs mt-1">
                    Compara la <strong>Foto Antes</strong> (tabla histórica anterior de Producción) contra la{" "}
                    <strong>Foto Después</strong> (datos vivos en Mi Cartera). Tus registros históricos no se borran ni se modifican jamás.
                  </CardDescription>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={auditLoading}
                    onClick={() => fetchAudit()}
                    className="text-xs font-bold"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${auditLoading ? "animate-spin" : ""}`} />
                    Re-auditar {selectedYear}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={!auditData?.reconciliationItems?.length}
                    onClick={handleExportAuditCSV}
                    className="text-xs font-bold"
                  >
                    <Download className="h-3.5 w-3.5 mr-1.5" />
                    Exportar Auditoría CSV
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          {auditLoading || !auditData ? (
            <Card>
              <CardContent className="py-16 text-center text-sm text-muted-foreground">
                Analizando historial de Producción vs. Mi Cartera {selectedYear}...
              </CardContent>
            </Card>
          ) : (
            <>
              {/* 4 Tarjetas Comparativas Antes vs Después */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-slate-200 dark:border-zinc-800">
                  <CardContent className="p-4">
                    <span className="text-[11px] font-black uppercase text-slate-500">
                      Foto Antes • PE {selectedYear}
                    </span>
                    <div className="text-2xl font-black text-slate-900 dark:text-zinc-100 mt-1">
                      {formatMoneyExact(auditData.kpiBefore?.totalPE || 0)}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {auditData.kpiBefore?.emissionRowsCount || 0} capturas /{" "}
                      {auditData.kpiBefore?.uniquePoliciesCount || 0} pólizas lógicas
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-indigo-200 dark:border-indigo-800">
                  <CardContent className="p-4">
                    <span className="text-[11px] font-black uppercase text-indigo-600 dark:text-indigo-400">
                      Foto Después • PE Actual en Cartera
                    </span>
                    <div className="text-2xl font-black text-indigo-700 dark:text-indigo-300 mt-1">
                      {formatMoneyExact(auditData.kpiAfter?.totalPE || 0)}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Proyectado tras conciliar:{" "}
                      <strong>{formatMoneyExact(auditData.kpiProjectedAfterReconcile?.totalPE || 0)}</strong>
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-slate-200 dark:border-zinc-800">
                  <CardContent className="p-4">
                    <span className="text-[11px] font-black uppercase text-slate-500">
                      Foto Antes • PPC {selectedYear}
                    </span>
                    <div className="text-2xl font-black text-slate-900 dark:text-zinc-100 mt-1">
                      {formatMoneyExact(auditData.kpiBefore?.totalPPC || 0)}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Cobranza histórica registrada
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-emerald-200 dark:border-emerald-800">
                  <CardContent className="p-4">
                    <span className="text-[11px] font-black uppercase text-emerald-600 dark:text-emerald-400">
                      Foto Después • PPC Actual en Cartera
                    </span>
                    <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1">
                      {formatMoneyExact(auditData.kpiAfter?.totalPPC || 0)}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Proyectado tras conciliar:{" "}
                      <strong>{formatMoneyExact(auditData.kpiProjectedAfterReconcile?.totalPPC || 0)}</strong>
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Comparativas Mes por Mes y por Agente */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="py-3 border-b">
                    <CardTitle className="text-sm font-black">Comparativa Mes por Mes ({selectedYear})</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-muted/40 text-[10px] uppercase font-black text-muted-foreground">
                        <tr>
                          <th className="py-2 px-3">Mes</th>
                          <th className="py-2 px-3 text-right">Antes PE</th>
                          <th className="py-2 px-3 text-right">Después PE</th>
                          <th className="py-2 px-3 text-right">Antes PPC</th>
                          <th className="py-2 px-3 text-right">Después PPC</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {(auditData.monthlyComparison || []).map((m: any) => (
                          <tr key={m.month}>
                            <td className="py-2 px-3 font-bold">{m.monthName}</td>
                            <td className="py-2 px-3 text-right font-mono">{formatMoney(m.beforePE)}</td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-indigo-700 dark:text-indigo-300">
                              {formatMoney(m.afterPE)}
                            </td>
                            <td className="py-2 px-3 text-right font-mono">{formatMoney(m.beforePPC)}</td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                              {formatMoney(m.afterPPC)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="py-3 border-b">
                    <CardTitle className="text-sm font-black">Comparativa por Agente ({selectedYear})</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-muted/40 text-[10px] uppercase font-black text-muted-foreground">
                        <tr>
                          <th className="py-2 px-3">Agente</th>
                          <th className="py-2 px-3 text-right">Antes PE</th>
                          <th className="py-2 px-3 text-right">Después PE</th>
                          <th className="py-2 px-3 text-right">Antes PPC</th>
                          <th className="py-2 px-3 text-right">Después PPC</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {(auditData.agentComparison || []).map((a: any) => (
                          <tr key={a.agentId}>
                            <td className="py-2 px-3 font-bold truncate max-w-[150px]">{a.agentName}</td>
                            <td className="py-2 px-3 text-right font-mono">{formatMoney(a.beforePE)}</td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-indigo-700 dark:text-indigo-300">
                              {formatMoney(a.afterPE)}
                            </td>
                            <td className="py-2 px-3 text-right font-mono">{formatMoney(a.beforePPC)}</td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                              {formatMoney(a.afterPPC)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              </div>

              {/* Preview de Simulación Dry-Run */}
              {dryRunResult && (
                <Card className="border-amber-300 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/30">
                  <CardHeader className="py-3 border-b border-amber-200 dark:border-amber-900">
                    <CardTitle className="text-sm font-black text-amber-950 dark:text-amber-200 flex items-center gap-2">
                      <FlaskConical className="h-4 w-4 text-amber-600" />
                      Simulación (Dry-Run) sin cambios aplicados en Base de Datos
                    </CardTitle>
                    <CardDescription className="text-xs text-amber-900/80 dark:text-amber-200/80">
                      Se crearían <strong>{dryRunResult.createdPolicies}</strong> póliza(s) nuevas en Mi Cartera, se enriquecerían{" "}
                      <strong>{dryRunResult.updatedPolicies}</strong> existente(s) y se marcarían{" "}
                      <strong>{dryRunResult.markedReceiptsPaid}</strong> recibo(s) como PAGADO.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-3 max-h-60 overflow-y-auto space-y-1.5 text-xs">
                    {(dryRunResult.previewActions || []).map((act: any) => (
                      <div key={act.groupKey} className="p-2 rounded bg-white/80 dark:bg-zinc-900/80 border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <Badge variant="outline" className="text-[10px] mr-2 font-mono">
                            {act.action}
                          </Badge>
                          <strong>{act.policyNumber}</strong> ({act.clientName})
                        </div>
                        <span className="text-[11px] text-muted-foreground">{act.details}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Tabla de Hallazgos por Póliza + Barra de Conciliación */}
              <Card>
                <CardHeader className="py-4 border-b">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div>
                      <CardTitle className="text-sm font-black">
                        Auditoría Detallada por Póliza ({auditData.summaryCounts?.totalGroups || 0})
                      </CardTitle>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {(
                          [
                            { id: "ALL", label: `Todos (${auditData.summaryCounts?.totalGroups || 0})` },
                            {
                              id: "FALTA_EN_CARTERA",
                              label: `Falta en Cartera (${auditData.summaryCounts?.missingInCartera || 0})`,
                            },
                            {
                              id: "EXISTE_CON_DIFERENCIA",
                              label: `Con Diferencia (${auditData.summaryCounts?.withDifference || 0})`,
                            },
                            {
                              id: "CONCILIADO_EXACTO",
                              label: `Conciliado (${auditData.summaryCounts?.exactMatch || 0})`,
                            },
                          ] as const
                        ).map((tab) => (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setAuditFilter(tab.id)}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition ${
                              auditFilter === tab.id
                                ? "bg-indigo-600 text-white border-indigo-600"
                                : "bg-muted/40 text-muted-foreground border-border"
                            }`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={isPending || selectedGroupKeys.length === 0}
                        onClick={handleRunDryRunReconcile}
                        className="text-xs font-bold border-amber-300 text-amber-800 hover:bg-amber-50"
                      >
                        <FlaskConical className="h-3.5 w-3.5 mr-1.5" />
                        Simular Conciliación ({selectedGroupKeys.length})
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        disabled={isPending || selectedGroupKeys.length === 0}
                        onClick={handleExecuteReconcile}
                        className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <ArrowRightLeft className="h-3.5 w-3.5 mr-1.5" />
                        Conciliar Seleccionados hacia Mi Cartera
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-0 overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted/40 text-[10px] uppercase font-black text-muted-foreground border-b">
                      <tr>
                        <th className="py-2.5 px-3 w-8">
                          <input
                            type="checkbox"
                            checked={
                              filteredAuditItems.filter((i: any) => i.status !== "CONCILIADO_EXACTO").length > 0 &&
                              filteredAuditItems
                                .filter((i: any) => i.status !== "CONCILIADO_EXACTO")
                                .every((i: any) => selectedGroupKeys.includes(i.groupKey))
                            }
                            onChange={(e) => {
                              const pend = filteredAuditItems
                                .filter((i: any) => i.status !== "CONCILIADO_EXACTO")
                                .map((i: any) => i.groupKey);
                              setSelectedGroupKeys(e.target.checked ? pend : []);
                            }}
                          />
                        </th>
                        <th className="py-2.5 px-3">Estatus</th>
                        <th className="py-2.5 px-3">Póliza / Cliente</th>
                        <th className="py-2.5 px-3">Agente / Co-Agente</th>
                        <th className="py-2.5 px-3">Aseguradora</th>
                        <th className="py-2.5 px-3 text-right">Antes PE / PPC</th>
                        <th className="py-2.5 px-3 text-right">Después PE / PPC</th>
                        <th className="py-2.5 px-3">Hallazgos / Diferencias</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredAuditItems.map((item: any) => {
                        const checked = selectedGroupKeys.includes(item.groupKey);
                        return (
                          <tr key={item.groupKey} className="hover:bg-muted/20">
                            <td className="py-2.5 px-3">
                              {item.status !== "CONCILIADO_EXACTO" && (
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={(e) => {
                                    setSelectedGroupKeys((prev) =>
                                      e.target.checked
                                        ? [...prev, item.groupKey]
                                        : prev.filter((k) => k !== item.groupKey)
                                    );
                                  }}
                                />
                              )}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <Badge
                                variant="outline"
                                className={`text-[10px] font-bold ${
                                  item.status === "CONCILIADO_EXACTO"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : item.status === "EXISTE_CON_DIFERENCIA"
                                    ? "bg-amber-50 text-amber-800 border-amber-300"
                                    : "bg-rose-50 text-rose-700 border-rose-300"
                                }`}
                              >
                                {item.status === "CONCILIADO_EXACTO"
                                  ? "✓ Conciliado"
                                  : item.status === "EXISTE_CON_DIFERENCIA"
                                  ? "⚠ Con Diferencia"
                                  : "➕ Falta en Cartera"}
                              </Badge>
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="font-mono font-bold">{item.policyNumber}</div>
                              <div className="text-[11px] text-muted-foreground">{item.clientName}</div>
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="font-semibold">{item.ownerAgentName}</div>
                              {item.isShared && (
                                <Badge variant="outline" className="text-[10px] mt-0.5 bg-blue-50 text-blue-700 border-blue-200">
                                  🤝 {item.sharedWithAgentName} ({item.sharedPercentage}%)
                                </Badge>
                              )}
                            </td>
                            <td className="py-2.5 px-3">{item.companyName}</td>
                            <td className="py-2.5 px-3 text-right font-mono whitespace-nowrap">
                              <div>{formatMoneyExact(item.beforePE)}</div>
                              <div className="text-emerald-700 dark:text-emerald-400">
                                {formatMoneyExact(item.beforePPC)}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono whitespace-nowrap">
                              <div>{formatMoneyExact(item.afterPE)}</div>
                              <div className="text-emerald-700 dark:text-emerald-400">
                                {formatMoneyExact(item.afterPPC)}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 max-w-xs">
                              {item.differences?.length > 0 ? (
                                <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-muted-foreground">
                                  {item.differences.map((d: string, i: number) => (
                                    <li key={i}>{d}</li>
                                  ))}
                                </ul>
                              ) : (
                                <span className="text-[11px] text-emerald-700 font-semibold">
                                  Coincidencia exacta
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </CardContent>
              </Card>

              {/* Pólizas que SOLO existen en Mi Cartera (ej. importaciones Excel de renovaciones) */}
              {(auditData.carteraOnlyItems?.length || 0) > 0 && (
                <Card>
                  <CardHeader className="py-3 border-b">
                    <CardTitle className="text-sm font-black">
                      Pólizas en Mi Cartera sin registro previo en Producción ({auditData.carteraOnlyItems.length})
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Si alguna póliza importada (ej. de Excel) corresponde a una Renovación de años anteriores, márcala como Renovación para que no infle la Venta Nueva.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0 overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-muted/40 text-[10px] uppercase font-black text-muted-foreground border-b">
                        <tr>
                          <th className="py-2 px-3">Póliza</th>
                          <th className="py-2 px-3">Cliente</th>
                          <th className="py-2 px-3">Agente</th>
                          <th className="py-2 px-3">Vigencia</th>
                          <th className="py-2 px-3 text-right">Prima Anual MXN</th>
                          <th className="py-2 px-3 text-center">Clasificación</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {auditData.carteraOnlyItems.map((c: any) => (
                          <tr key={c.policyId}>
                            <td className="py-2 px-3 font-mono font-bold">{c.policyNumber}</td>
                            <td className="py-2 px-3">{c.clientName}</td>
                            <td className="py-2 px-3">{c.agentName}</td>
                            <td className="py-2 px-3 font-mono">{c.effectiveDate}</td>
                            <td className="py-2 px-3 text-right font-mono font-bold">
                              {formatMoney(c.annualPremium)}
                            </td>
                            <td className="py-2 px-3 text-center">
                              <Button
                                type="button"
                                size="sm"
                                variant={c.isRenewalCapture ? "secondary" : "outline"}
                                disabled={isPending}
                                onClick={() =>
                                  handleToggleRenewalFlag(c.policyId, !c.isRenewalCapture)
                                }
                                className="h-7 text-[11px] font-bold"
                              >
                                {c.isRenewalCapture
                                  ? "🔄 Marcada como Renovación (Clic para revertir)"
                                  : "🔄 Marcar como Renovación (Año 2+)"}
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      )}

      {/* SUBTAB 3: CATÁLOGO DE ASEGURADORAS & LOGOS */}
      {activeSubTab === "companias" && (
        <div className="space-y-6">
          <Card className="border border-slate-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-950">
            <CardHeader className="py-4 border-b border-slate-200 dark:border-zinc-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base font-black text-slate-800 dark:text-zinc-100 flex flex-wrap items-center gap-2">
                    <Building2 className="h-5 w-5 text-teal-700" />
                    <span>Catálogo de Aseguradoras & Logos</span>
                    <Badge className="bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800 font-bold text-[11px]">
                      {companies.length} activas de {catalogCompanies.length}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-xs mt-1">
                    Configuración exclusiva y aislada para <strong>{currentAgencyName}</strong>. Nunca afecta a ninguna otra promotoría.
                  </CardDescription>
                </div>
                <Button
                  onClick={() => {
                    setEditingCompany(null);
                    setCompanyNameInput("");
                    setCompanyColorInput("#0284c7");
                    setCompanyLogoUrlInput("");
                    setCompanyOrderInput(catalogCompanies.length + 1);
                    setCompanyModalOpen(true);
                  }}
                  className="text-xs font-bold bg-teal-700 hover:bg-teal-800 text-white shrink-0"
                >
                  <Plus className="h-4 w-4 mr-1.5" /> Nueva Aseguradora
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {catalogCompanies.map((comp: any) => {
                  const isBaseCompany = DEFAULT_COMPANIES.some(
                    (base) =>
                      base.name.trim().toLowerCase() ===
                      String(comp.name || "").trim().toLowerCase()
                  );
                  return (
                    <div
                      key={comp.id}
                      className={`p-4 rounded-xl border flex flex-col justify-between gap-3 transition-all ${
                        comp.active
                          ? "border-teal-300 dark:border-teal-800 bg-teal-50/30 dark:bg-teal-950/20 shadow-sm"
                          : "border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40 opacity-75"
                      }`}
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                              comp.active
                                ? "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                                : "bg-slate-200/70 text-slate-500 border-slate-300 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700"
                            }`}
                          >
                            {comp.active ? "Activa" : "Inactiva"}
                          </span>
                          <Switch
                            checked={!!comp.active}
                            onCheckedChange={(checked) => handleToggleCompanyActive(comp, checked)}
                            className="data-[state=checked]:bg-teal-600"
                          />
                        </div>

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

                        {!isBaseCompany && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                              if (!confirm(`¿Eliminar "${comp.name}" de ${currentAgencyName}?`))
                                return;
                              const res = await deleteInsuranceCompany(comp.id, selectedAgency);
                              if (res.success) fetchData();
                              else alert("Error: " + res.message);
                            }}
                            className="text-xs text-slate-400 hover:text-red-600 p-1"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* SUBTAB 5: PUENTE GROKBOT (EXCLUSIVO PROMOTORÍA TITULAR) */}
      {activeSubTab === "grokbot" && canShowGrokbotBridge && (
        <GrokbotBridgePanel onDataMutated={fetchData} />
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
              Modifica el presupuesto pactado para{" "}
              {MONTHS.find((m) => m.value === selectedMonth)?.name} {selectedYear}.
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
                placeholder="Ej. Re-negociación de meta..."
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
              Configura el nombre, color distintivo y logotipo oficial.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="block text-xs font-black uppercase text-slate-600 mb-1">
                Nombre de la Aseguradora *
              </label>
              <Input
                type="text"
                placeholder="Ej. GNP Seguros"
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
                  Orden
                </label>
                <Input
                  type="number"
                  value={companyOrderInput}
                  onChange={(e) => setCompanyOrderInput(parseInt(e.target.value, 10) || 0)}
                  className="text-xs font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-slate-600 mb-1">
                Logotipo Oficial
              </label>
              <div className="p-3 rounded-lg border bg-slate-50 dark:bg-zinc-900/50 flex items-center gap-3">
                <div className="h-12 w-20 rounded bg-white dark:bg-zinc-950 border flex items-center justify-center p-1 shrink-0">
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
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 text-xs font-bold">
                    <Upload className="h-3.5 w-3.5" />
                    Subir Imagen
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

      {/* MODAL 3: DETALLE DE PÓLIZAS POR ASESOR (DESDE MI CARTERA) */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="w-[96vw] max-w-5xl h-[90vh] max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-2xl">
          <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-900/80 shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <DialogTitle className="text-base sm:text-lg font-black flex items-center gap-2 text-slate-900 dark:text-zinc-100">
                  <FileSpreadsheet className="h-5 w-5 text-teal-700 shrink-0" />
                  <span className="truncate">Detalle de Pólizas — {detailAgent?.agentName}</span>
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 mt-0.5">
                  {periodLabel} • Primas en MXN calculadas desde Mi Cartera
                </DialogDescription>
              </div>

              <div className="flex items-center gap-2">
                <div className="px-3 py-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800/60 text-right">
                  <span className="block text-[10px] font-black uppercase text-teal-600">
                    PE Asesor
                  </span>
                  <span className="text-xs sm:text-sm font-black font-mono">
                    {formatMoney(detailAgent?.totalPE || 0)}
                  </span>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 text-right">
                  <span className="block text-[10px] font-black uppercase text-emerald-600">
                    PPC Asesor
                  </span>
                  <span className="text-xs sm:text-sm font-black font-mono text-emerald-700 dark:text-emerald-300">
                    {formatMoney(detailAgent?.totalPPC || 0)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 mt-3 pt-3 border-t">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 whitespace-nowrap">
                  Aseguradora:
                </span>
                <select
                  value={detailCompanyFilter}
                  onChange={(e) => setDetailCompanyFilter(e.target.value)}
                  className="text-xs font-semibold py-1.5 px-2.5 rounded-md border bg-white dark:bg-zinc-900"
                >
                  <option value="ALL">Todas las Aseguradoras</option>
                  {companies.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1 sm:w-56">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Buscar cliente o folio..."
                    value={detailSearchQuery}
                    onChange={(e) => setDetailSearchQuery(e.target.value)}
                    className="pl-8 h-8 text-xs"
                  />
                </div>
                <QuickPdfAiPolicyDialog
                  defaultAgentId={detailAgent?.agentId}
                  targetAgencyId={selectedAgency}
                  buttonLabel="+ Nueva Póliza"
                  buttonClassName="h-8 text-xs font-bold bg-teal-700 hover:bg-teal-800 text-white"
                  onSavedSuccess={fetchData}
                />
              </div>
            </div>
          </div>

          <div className="p-3 sm:p-5 overflow-y-auto flex-1">
            {(() => {
              const selectedCompName =
                detailCompanyFilter !== "ALL"
                  ? companies.find((c: any) => c.id === detailCompanyFilter)?.name?.toLowerCase()
                  : null;
              const agentPolicies = ledgerRows.filter((row: any) => {
                const participates =
                  row.ownerAgentId === detailAgent?.agentId ||
                  row.sharedWithUserId === detailAgent?.agentId;
                if (!participates) return false;
                if (
                  selectedCompName &&
                  (row.canonicalCompany || "").toLowerCase() !== selectedCompName
                ) {
                  return false;
                }
                if (detailSearchQuery.trim()) {
                  const q = detailSearchQuery.toLowerCase();
                  if (
                    !(row.clientName || "").toLowerCase().includes(q) &&
                    !(row.policyNumber || "").toLowerCase().includes(q) &&
                    !(row.canonicalCompany || "").toLowerCase().includes(q)
                  ) {
                    return false;
                  }
                }
                return true;
              });

              if (agentPolicies.length === 0) {
                return (
                  <div className="py-12 text-center text-sm text-muted-foreground">
                    No se encontraron pólizas en Mi Cartera para este asesor en {periodLabel}.
                  </div>
                );
              }

              return (
                <div className="border rounded-xl overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[700px]">
                    <thead className="bg-slate-100 dark:bg-zinc-900 border-b text-[11px] font-black uppercase text-slate-600">
                      <tr>
                        <th className="py-2.5 px-3">Folio / Póliza</th>
                        <th className="py-2.5 px-3">Cliente</th>
                        <th className="py-2.5 px-3">Aseguradora</th>
                        <th className="py-2.5 px-3">Sub-ramo</th>
                        <th className="py-2.5 px-3">Vigencia</th>
                        <th className="py-2.5 px-3 text-right">PE (MXN)</th>
                        <th className="py-2.5 px-3 text-right">PPC (MXN)</th>
                        <th className="py-2.5 px-3 text-center">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {agentPolicies.map((row: any) => {
                        const sharePct =
                          row.sharedWithUserId === detailAgent?.agentId
                            ? row.sharedPercentage
                            : row.sharedWithUserId
                            ? 100 - row.sharedPercentage
                            : 100;
                        const weight = sharePct / 100;
                        const hasUnpaid = (row.receipts || []).some(
                          (r: any) => r.status !== "PAGADO"
                        );
                        return (
                          <tr key={row.policyId} className="hover:bg-slate-50 dark:hover:bg-zinc-900/40">
                            <td className="py-2.5 px-3 font-mono font-bold">
                              {row.policyNumber}
                              {row.sharedWithUserId && (
                                <Badge variant="outline" className="ml-1.5 text-[10px] bg-blue-50 text-blue-700 border-blue-200">
                                  {sharePct}%
                                </Badge>
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              {row.clientId ? (
                                <Link
                                  href={`/cartera/clientes/${row.clientId}`}
                                  className="font-bold text-primary hover:underline"
                                >
                                  {row.clientName}
                                </Link>
                              ) : (
                                <span className="font-bold">{row.clientName}</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3">{row.canonicalCompany}</td>
                            <td className="py-2.5 px-3">{row.ramoInfo?.fullLabel}</td>
                            <td className="py-2.5 px-3 font-mono">{row.effectiveDate || "-"}</td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold">
                              {formatMoney((row.peInPeriod || 0) * weight)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                              {formatMoney((row.ppcInPeriod || 0) * weight)}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {hasUnpaid ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openPayModal(row)}
                                  className="h-7 text-[11px] font-bold border-emerald-300 text-emerald-700"
                                >
                                  Cobrar Recibo
                                </Button>
                              ) : (
                                <span className="text-[11px] text-emerald-600 font-semibold">
                                  ✓ Pagada
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>

          <div className="p-3 sm:p-4 border-t flex items-center justify-between shrink-0">
            <span className="text-[11px] text-slate-500">
              Cifras ponderadas por participación cuando la póliza es compartida.
            </span>
            <Button variant="outline" size="sm" onClick={() => setDetailModalOpen(false)}>
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL 4: COBRAR RECIBO DE PÓLIZA EN VIVO */}
      <Dialog open={payModalOpen} onOpenChange={setPayModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-black flex items-center gap-2">
              <Check className="h-5 w-5 text-emerald-600" />
              Registrar Pago en Mi Cartera — {payTargetPolicy?.policyNumber}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {payTargetPolicy?.clientName} • Se reflejará automáticamente en PPC del periodo elegido.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div>
              <label className="block text-xs font-bold mb-1">Recibo a Cobrar</label>
              <select
                value={payReceiptId}
                onChange={(e) => {
                  const rid = e.target.value;
                  setPayReceiptId(rid);
                  const found = (payTargetPolicy?.receipts || []).find((r: any) => r.id === rid);
                  if (found) {
                    setPayAmountInput(String(Number((found.paidAmount ?? found.amount ?? 0).toFixed(2))));
                    if (found.dueDate) setPayDateInput(found.dueDate);
                  }
                }}
                className="w-full text-xs font-semibold py-2 px-3 rounded-lg border bg-white dark:bg-zinc-900"
              >
                {(payTargetPolicy?.receipts || [])
                  .filter((r: any) => r.status !== "PAGADO")
                  .map((r: any) => (
                    <option key={r.id} value={r.id}>
                      Recibo {r.receiptNumber}/{r.totalInstallments} (Año {r.policyYear}) —{" "}
                      {formatMoneyExact(r.amount)} • Vence {r.dueDate}
                    </option>
                  ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold mb-1">Fecha Contable de Pago</label>
                <Input
                  type="date"
                  value={payDateInput}
                  onChange={(e) => setPayDateInput(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Monto Cobrado (MXN)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={payAmountInput}
                  onChange={(e) => setPayAmountInput(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">Nota de Pago (Opcional)</label>
              <Input
                type="text"
                placeholder="Ej. Pago aplicado en aseguradora"
                value={payNotesInput}
                onChange={(e) => setPayNotesInput(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setPayModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              disabled={isPending || !payReceiptId}
              onClick={handleConfirmReceiptPayment}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              {isPending ? "Aplicando..." : "Confirmar Cobro (MXN)"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
