"use client";

import React, { useEffect, useState, useTransition } from "react";
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
  generateOrRotateGrokbotIngestKey,
  getGrokbotBridgeDashboard,
  previewGrokbotRollbackByDateAction,
  executeGrokbotRollbackByDateAction,
  executeGrokbotRollbackBatchAction,
  resolveQuarantinedItemAction,
  runManualGrokbotJsonIngest,
  saveGrokbotAgentMapping,
  toggleGrokbotIngestPause,
} from "@/app/actions/grokbotSyncActions";
import {
  AlertTriangle,
  Bot,
  Check,
  CheckCircle2,
  Copy,
  Database,
  History,
  KeyRound,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Upload,
  UserCheck,
} from "lucide-react";

interface GrokbotBridgePanelProps {
  onDataMutated?: () => void;
}

const REASON_LABELS: Record<string, string> = {
  UNMAPPED_AGENT: "Agente sin mapear en tabla de claves",
  UNMAPPED_SHARED_AGENT: "Co-agente (póliza compartida) sin mapear",
  NEGATIVE_RECEIPT_ADJUSTMENT: "Ajuste o cancelación con monto negativo",
  NEGATIVE_NET_ADJUSTMENT: "Emisión neta negativa",
  SANITY_LIMIT_EXCEEDED: "Monto excede umbral de seguridad (> $10M MXN)",
  MULTI_AGENT_SPLIT_MANUAL: "Póliza compartida con más de 2 agentes",
  CROSS_TENANT_POLICY_COLLISION: "Número de póliza pertenece a otra promotoría",
  ARCHIVED_OR_DELETED_POLICY: "Póliza archivada o eliminada manualmente en Mi Cartera",
};

function formatMoneyExact(val: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val || 0);
}

export default function GrokbotBridgePanel({ onDataMutated }: GrokbotBridgePanelProps) {
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<any>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  // API Key Reveal Modal
  const [newKeyModalOpen, setNewKeyModalOpen] = useState(false);
  const [revealedPlainKey, setRevealedPlainKey] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Manual JSON Upload / Dry-Run Modal
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [manualJsonText, setManualJsonText] = useState("");
  const [manualDryRunRes, setManualDryRunRes] = useState<any>(null);

  // Rollback por Fecha State
  const [rbFromDate, setRbFromDate] = useState<string>(() =>
    new Date().toLocaleDateString("en-CA", { timeZone: "America/Mexico_City" })
  );
  const [rbToDate, setRbToDate] = useState<string>(() =>
    new Date().toLocaleDateString("en-CA", { timeZone: "America/Mexico_City" })
  );
  const [rbDateField, setRbDateField] = useState<"appliedDateStr" | "eventDateStr">(
    "appliedDateStr"
  );
  const [rbPreview, setRbPreview] = useState<any>(null);

  // Local Agent Mapping Drafts
  const [draftUserByMapId, setDraftUserByMapId] = useState<Record<string, string>>({});

  // Bottom view switch: quarantine vs batches
  const [listView, setListView] = useState<"quarantine" | "batches">("quarantine");

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const res = await getGrokbotBridgeDashboard();
      if (res.success) {
        setDashboard(res);
        if (res.todayYmd) {
          setRbFromDate((prev) => prev || res.todayYmd);
          setRbToDate((prev) => prev || res.todayYmd);
        }
        const drafts: Record<string, string> = {};
        for (const m of res.agentMaps || []) {
          drafts[m.id] = m.userId || "";
        }
        setDraftUserByMapId(drafts);
      } else {
        setFeedback({ type: "error", text: res.message || "Error al cargar puente Grokbot" });
      }
    } catch {
      setFeedback({ type: "error", text: "Error de conexión cargando puente Grokbot" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleGenerateKey = () => {
    if (
      dashboard?.security?.hasDbKey &&
      !confirm(
        "¿Rotar la API Key de ingesta? La llave anterior guardada en base de datos dejará de funcionar de inmediato."
      )
    ) {
      return;
    }
    startTransition(async () => {
      const res = await generateOrRotateGrokbotIngestKey();
      if (res.success && res.plainKey) {
        setRevealedPlainKey(res.plainKey);
        setNewKeyModalOpen(true);
        await loadDashboard();
      } else {
        setFeedback({ type: "error", text: res.message || "No se pudo generar la llave" });
      }
    });
  };

  const handleTogglePause = () => {
    const nextPaused = !dashboard?.security?.isPaused;
    startTransition(async () => {
      const res = await toggleGrokbotIngestPause(nextPaused);
      if (res.success) {
        setFeedback({
          type: "success",
          text: nextPaused
            ? "Puente Grokbot PAUSADO. Toda escritura remota queda bloqueada hasta reactivar."
            : "Puente Grokbot REANUDADO y listo para recibir lotes.",
        });
        await loadDashboard();
      } else {
        setFeedback({ type: "error", text: res.message || "Error cambiando pausa" });
      }
    });
  };

  const handleSaveAgentMap = (mapRow: any, applyPending: boolean) => {
    const selectedUserId = draftUserByMapId[mapRow.id] || null;
    startTransition(async () => {
      const res = await saveGrokbotAgentMapping({
        insurerKey: mapRow.insurerKey,
        externalAgentCode: mapRow.externalAgentCode,
        externalAgentName: mapRow.externalAgentName,
        userId: selectedUserId,
        applyPending,
      });
      if (res.success) {
        setFeedback({
          type: "success",
          text:
            applyPending && (res.appliedPendingCount || 0) > 0
              ? `Clave ${mapRow.externalAgentCode} guardada y ${res.appliedPendingCount} registro(s) de cuarentena aplicados automáticamente.`
              : `Mapeo para clave ${mapRow.externalAgentCode} guardado.`,
        });
        await loadDashboard();
        if ((res.appliedPendingCount || 0) > 0) onDataMutated?.();
      } else {
        setFeedback({ type: "error", text: res.message || "Error al guardar mapeo" });
      }
    });
  };

  const handleResolveQuarantine = (itemId: string, action: "APPROVE" | "IGNORE") => {
    if (
      action === "APPROVE" &&
      !confirm("¿Aprobar y aplicar este registro en Mi Cartera e Historial?")
    ) {
      return;
    }
    startTransition(async () => {
      const res = await resolveQuarantinedItemAction({ itemId, action });
      if (res.success) {
        setFeedback({
          type: "success",
          text:
            action === "APPROVE"
              ? "Registro aprobado y aplicado (con respaldo completo de rollback)."
              : "Registro marcado como ignorado.",
        });
        await loadDashboard();
        if (action === "APPROVE") onDataMutated?.();
      } else {
        setFeedback({ type: "error", text: res.message || "No se pudo resolver registro" });
      }
    });
  };

  const handlePreviewRollbackByDate = () => {
    setRbPreview(null);
    startTransition(async () => {
      const res = await previewGrokbotRollbackByDateAction({
        fromDateStr: rbFromDate,
        toDateStr: rbToDate,
        dateField: rbDateField,
      });
      if (res.success) {
        setRbPreview(res.preview);
      } else {
        setFeedback({ type: "error", text: res.message || "Error en previsualización" });
      }
    });
  };

  const handleExecuteRollbackByDate = () => {
    const label =
      rbFromDate === rbToDate ? rbFromDate : `${rbFromDate} al ${rbToDate}`;
    if (
      !confirm(
        `¿Confirmas ejecutar ROLLBACK TOTAL del periodo ${label}? Se revertirán pólizas nuevas creadas por el puente, recibos pagados y emisiones históricas de esas fechas sin tocar capturas manuales.`
      )
    ) {
      return;
    }
    startTransition(async () => {
      const res = await executeGrokbotRollbackByDateAction({
        fromDateStr: rbFromDate,
        toDateStr: rbToDate,
        dateField: rbDateField,
      });
      if (res.success && res.summary) {
        const s = res.summary;
        setRbPreview(null);
        setFeedback({
          type: "success",
          text: `Rollback completado (${label}): ${s.revertedItems} movimientos revertidos · ${s.deletedPolicies} pólizas eliminadas · ${s.restoredReceipts + s.deletedReceipts} recibos restaurados · ${s.deletedEmissions} emisiones revertidas.`,
        });
        await loadDashboard();
        onDataMutated?.();
      } else {
        setFeedback({ type: "error", text: res.message || "Error al ejecutar rollback" });
      }
    });
  };

  const handleExecuteBatchRollback = (batch: any) => {
    if (
      !confirm(
        `¿Revertir por completo el lote del ${batch.batchDateStr} (${batch.source}, ${batch.appliedCount} aplicados)?`
      )
    ) {
      return;
    }
    startTransition(async () => {
      const res = await executeGrokbotRollbackBatchAction(batch.id);
      if (res.success && res.summary) {
        const s = res.summary;
        setFeedback({
          type: "success",
          text: `Lote revertido: ${s.revertedItems} movimientos deshechos, ${s.deletedPolicies} pólizas eliminadas, ${s.restoredReceipts + s.deletedReceipts} recibos restaurados.`,
        });
        await loadDashboard();
        onDataMutated?.();
      } else {
        setFeedback({ type: "error", text: res.message || "Error al revertir lote" });
      }
    });
  };

  const handleManualFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setManualJsonText(String(reader.result || ""));
      setManualDryRunRes(null);
    };
    reader.readAsText(file, "utf-8");
  };

  const handleRunManualJson = (dryRun: boolean) => {
    if (!manualJsonText.trim()) return;
    if (
      !dryRun &&
      !confirm("¿Aplicar este JSON a producción ahora? (Quedará cubierto por el Rollback por fecha).")
    ) {
      return;
    }
    startTransition(async () => {
      const res = await runManualGrokbotJsonIngest({
        rawJsonText: manualJsonText,
        dryRun,
      });
      if (res.success && res.result) {
        setManualDryRunRes(res.result);
        if (!dryRun) {
          setFeedback({
            type: "success",
            text: `Carga manual aplicada: ${res.result.counts.applied} aplicados, ${res.result.counts.quarantined} en cuarentena, ${res.result.counts.skipped} omitidos.`,
          });
          await loadDashboard();
          onDataMutated?.();
        }
      } else {
        setFeedback({ type: "error", text: res.message || "Error procesando JSON manual" });
      }
    });
  };

  const buildGrokbotPromptText = (apiKeyPlaceholder: string) => {
    const origin =
      typeof window !== "undefined" && window.location.hostname.includes("aacomsoft")
        ? window.location.origin
        : "https://app.aacomsoft.com";
    return `Instrucciones para sincronizar reportes diarios hacia aacomsoft:
1. Descarga intactos (sin resumir ni recalcular montos) los JSON crudos del puente Linux:
   - Insignia Life: GET /primas.json
   - La Latinoamericana Seguros: GET /latino/todo.json
2. Envía un POST a ${origin}/api/internal/grokbot/ingest con headers:
   - Content-Type: application/json
   - Authorization: Bearer ${apiKeyPlaceholder}
   Body JSON:
   {
     "insignia": <JSON completo de /primas.json>,
     "latino": <JSON completo de /latino/todo.json>
   }
3. Nota de seguridad: No calcules comisiones, tipos de cambio ni deducciones; aacomsoft valida determinísticamente, filtra duplicados/cancelaciones en $0 y manda a cuarentena cualquier clave sin asignar.
4. Repórtame el resumen devuelto: counts.applied, totalAppliedMxn, counts.quarantined y unmappedAgents.`;
  };

  if (loading && !dashboard) {
    return (
      <Card className="border border-slate-200 dark:border-zinc-800">
        <CardContent className="p-8 text-center text-sm text-muted-foreground">
          Cargando panel del puente blindado Grokbot...
        </CardContent>
      </Card>
    );
  }

  const security = dashboard?.security || {};
  const stats = dashboard?.stats || {};
  const agents = dashboard?.agents || [];
  const agentMaps = dashboard?.agentMaps || [];
  const quarantinedItems = dashboard?.quarantinedItems || [];
  const batches = dashboard?.batches || [];

  return (
    <div className="space-y-6">
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs font-semibold ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200"
              : "bg-red-50 border-red-200 text-red-900 dark:bg-red-950/40 dark:border-red-800 dark:text-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs underline opacity-75 hover:opacity-100"
          >
            Ocultar
          </button>
        </div>
      )}

      {/* 1. CABECERA SEGURIDAD, KILL-SWITCH Y CREDENCIALES */}
      <Card className="border-2 border-indigo-200 dark:border-indigo-900/60 bg-white dark:bg-zinc-950 shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-zinc-800">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <Bot className="h-5 w-5 text-indigo-600" />
                <CardTitle className="text-base font-black">
                  Puente Blindado de Ingesta Batch (Exclusivo Promotoría Titular)
                </CardTitle>
                <Badge
                  className={
                    security.isPaused
                      ? "bg-amber-100 text-amber-900 border border-amber-300"
                      : "bg-emerald-100 text-emerald-900 border border-emerald-300"
                  }
                >
                  {security.isPaused ? "EN PAUSA (Bloqueado)" : "ACTIVO · Semiautomático"}
                </Badge>
              </div>
              <CardDescription className="text-xs">
                Grokbot envía JSON crudos de Insignia Life y La Latinoamericana Seguros;{" "}
                <strong>aacomsoft</strong> valida determinísticamente, protege capturas manuales y
                mantiene historial completo para <strong>Rollback por Fecha o por Lote</strong>.
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadDashboard}
                disabled={loading || isPending}
                className="text-xs font-bold"
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
                Actualizar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setManualDryRunRes(null);
                  setManualModalOpen(true);
                }}
                disabled={isPending}
                className="text-xs font-bold border-indigo-300 text-indigo-700"
              >
                <Upload className="h-3.5 w-3.5 mr-1.5" />
                Probar / Subir JSON
              </Button>
              <Button
                variant={security.isPaused ? "default" : "outline"}
                size="sm"
                onClick={handleTogglePause}
                disabled={isPending}
                className={`text-xs font-bold ${
                  security.isPaused
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : "border-amber-300 text-amber-800 hover:bg-amber-50"
                }`}
              >
                {security.isPaused ? (
                  <>
                    <PlayCircle className="h-3.5 w-3.5 mr-1.5" /> Reanudar Puente
                  </>
                ) : (
                  <>
                    <PauseCircle className="h-3.5 w-3.5 mr-1.5" /> Pausar Puente
                  </>
                )}
              </Button>
              <Button
                size="sm"
                onClick={handleGenerateKey}
                disabled={isPending}
                className="text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <KeyRound className="h-3.5 w-3.5 mr-1.5" />
                {security.hasDbKey ? "Rotar API Key" : "Generar API Key"}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-900 border">
              <div className="text-[11px] font-bold text-slate-500 uppercase">
                Aplicados Hoy ({dashboard?.todayYmd})
              </div>
              <div className="text-lg font-black text-emerald-700 dark:text-emerald-400">
                {stats.todayAppliedItems || 0} movs
              </div>
              <div className="text-xs font-mono text-slate-600 dark:text-zinc-400">
                {formatMoneyExact(stats.todayAppliedMxn || 0)}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-900 border">
              <div className="text-[11px] font-bold text-slate-500 uppercase">
                Total Sincronizado Activo
              </div>
              <div className="text-lg font-black text-slate-900 dark:text-zinc-100">
                {stats.totalAppliedItems || 0} movs
              </div>
              <div className="text-xs font-mono text-slate-600 dark:text-zinc-400">
                {formatMoneyExact(stats.totalAppliedMxn || 0)}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900">
              <div className="text-[11px] font-bold text-amber-800 dark:text-amber-300 uppercase">
                En Cuarentena (Pendiente)
              </div>
              <div className="text-lg font-black text-amber-800 dark:text-amber-300">
                {stats.totalQuarantined || 0}
              </div>
              <div className="text-[11px] text-amber-700 dark:text-amber-400">
                {stats.unmappedCodesCount || 0} claves de agente sin asignar
              </div>
            </div>
            <div className="p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900">
              <div className="text-[11px] font-bold text-indigo-800 dark:text-indigo-300 uppercase">
                Credencial de Ingesta
              </div>
              <div className="text-xs font-mono font-bold text-indigo-900 dark:text-indigo-200 mt-1 truncate">
                {security.hasDbKey
                  ? security.keyHint || "Llave activa en BD"
                  : security.hasEnvKey
                  ? "Configurada por variable ENV"
                  : "Pendiente — Haz clic en Generar API Key"}
              </div>
              <button
                type="button"
                onClick={() =>
                  copyText(
                    buildGrokbotPromptText("<PEGA_AQUI_TU_API_KEY_GENERADA>"),
                    "prompt-tpl"
                  )
                }
                className="mt-1 text-[11px] font-bold text-indigo-700 dark:text-indigo-300 hover:underline flex items-center gap-1"
              >
                <Copy className="h-3 w-3" />
                {copiedId === "prompt-tpl"
                  ? "Prompt copiado"
                  : "Copiar instrucciones para Grokbot"}
              </button>
            </div>
          </div>

          {/* 2. CENTRO DE ROLLBACK POR FECHA */}
          <div className="p-4 rounded-xl border-2 border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/15 space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4 text-rose-600" />
                <span className="text-sm font-black text-rose-900 dark:text-rose-200">
                  Centro de Rollback por Fecha (Deshacer Sincronización)
                </span>
              </div>
              <span className="text-[11px] text-rose-800 dark:text-rose-300 font-medium">
                Revierte pólizas creadas por el puente, pagos de recibos y emisiones de producción
                sin borrar capturas manuales.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 items-end">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  Desde fecha
                </label>
                <Input
                  type="date"
                  value={rbFromDate}
                  onChange={(e) => {
                    setRbFromDate(e.target.value);
                    setRbPreview(null);
                  }}
                  className="bg-white dark:bg-zinc-900 text-xs h-9"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  Hasta fecha
                </label>
                <Input
                  type="date"
                  value={rbToDate}
                  onChange={(e) => {
                    setRbToDate(e.target.value);
                    setRbPreview(null);
                  }}
                  className="bg-white dark:bg-zinc-900 text-xs h-9"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  Criterio de fecha
                </label>
                <select
                  value={rbDateField}
                  onChange={(e) => {
                    setRbDateField(e.target.value as any);
                    setRbPreview(null);
                  }}
                  className="w-full h-9 text-xs font-semibold rounded-md border px-2.5 bg-white dark:bg-zinc-900"
                >
                  <option value="appliedDateStr">Fecha de sincronización (Lote)</option>
                  <option value="eventDateStr">Fecha contable de aseguradora</option>
                </select>
              </div>
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={handlePreviewRollbackByDate}
                className="h-9 text-xs font-bold border-rose-300 text-rose-800 bg-white hover:bg-rose-50"
              >
                Previsualizar Impacto
              </Button>
              <Button
                type="button"
                disabled={isPending}
                onClick={handleExecuteRollbackByDate}
                className="h-9 text-xs font-black bg-rose-600 hover:bg-rose-700 text-white"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                Rollback por Fecha
              </Button>
            </div>

            {rbPreview && (
              <div className="p-3 rounded-lg bg-white dark:bg-zinc-900 border border-rose-200 dark:border-rose-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <div className="font-black text-rose-800 dark:text-rose-200">
                    Impacto estimado del rollback ({rbPreview.fromDateStr} → {rbPreview.toDateStr}):
                  </div>
                  <div className="text-slate-600 dark:text-zinc-400">
                    <strong>{rbPreview.itemsCount}</strong> movimientos en{" "}
                    <strong>{rbPreview.batchesCount}</strong> lotes ·{" "}
                    <strong>{rbPreview.newPoliciesCount}</strong> pólizas nuevas a eliminar ·{" "}
                    <strong>{rbPreview.newEmissionsCount}</strong> registros históricos · Monto total:{" "}
                    <strong className="font-mono">{formatMoneyExact(rbPreview.totalMxn)}</strong>
                  </div>
                </div>
                {rbPreview.itemsCount === 0 && (
                  <Badge variant="outline" className="text-slate-500">
                    Sin movimientos aplicados en esas fechas
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 3. MAPEO DE CLAVES DE AGENTE */}
      <Card className="border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <CardHeader className="py-4 border-b border-slate-100 dark:border-zinc-800">
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle className="text-sm font-black flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-teal-600" />
                Mapeo de Claves de Agente (Insignia Life y La Latinoamericana Seguros)
              </CardTitle>
              <CardDescription className="text-xs">
                Asigna cada clave numérica externa al asesor en aacomsoft. Al hacer clic en{" "}
                <strong>Guardar y Aplicar</strong>, sus movimientos retenidos en cuarentena se
                sincronizarán al instante.
              </CardDescription>
            </div>
            <Badge variant="outline" className="font-mono text-[11px]">
              {agentMaps.length} claves detectadas
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {agentMaps.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">
              Aún no se han recibido lotes con claves externas. Cuando Grokbot envíe el primer reporte
              (o subas un JSON de prueba), aquí aparecerán las claves para confirmarlas.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-zinc-900 border-b text-[11px] uppercase font-bold text-slate-500">
                  <tr>
                    <th className="py-2.5 px-3">Aseguradora</th>
                    <th className="py-2.5 px-3">Clave Externa</th>
                    <th className="py-2.5 px-3">Nombre Reportado</th>
                    <th className="py-2.5 px-3">Asesor en aacomsoft</th>
                    <th className="py-2.5 px-3 text-center">Cuarentena</th>
                    <th className="py-2.5 px-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {agentMaps.map((m: any) => {
                    const isUnmapped = !m.userId;
                    return (
                      <tr
                        key={m.id}
                        className={
                          isUnmapped
                            ? "bg-amber-50/40 dark:bg-amber-950/10"
                            : "hover:bg-slate-50 dark:hover:bg-zinc-900/40"
                        }
                      >
                        <td className="py-2 px-3">
                          <Badge
                            variant="outline"
                            className={
                              m.insurerKey === "INSIGNIA"
                                ? "border-sky-300 text-sky-800 bg-sky-50"
                                : "border-indigo-300 text-indigo-800 bg-indigo-50"
                            }
                          >
                            {m.insurerKey === "INSIGNIA" ? "Insignia Life" : "La Latino"}
                          </Badge>
                        </td>
                        <td className="py-2 px-3 font-mono font-bold">{m.externalAgentCode}</td>
                        <td className="py-2 px-3 font-medium">
                          {m.externalAgentName || "-"}
                          {m.autoMatched && (
                            <span className="ml-1.5 text-[10px] text-emerald-700 font-bold">
                              (Auto-detectado)
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3">
                          <select
                            value={draftUserByMapId[m.id] ?? ""}
                            onChange={(e) =>
                              setDraftUserByMapId((prev) => ({
                                ...prev,
                                [m.id]: e.target.value,
                              }))
                            }
                            className="w-full max-w-[260px] text-xs font-semibold py-1.5 px-2 rounded-md border bg-white dark:bg-zinc-900"
                          >
                            <option value="">-- Sin asignar (Mantener en cuarentena) --</option>
                            {agents.map((ag: any) => (
                              <option key={ag.id} value={ag.id}>
                                {ag.name || ag.email}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 px-3 text-center font-mono font-bold">
                          {m.pendingCount > 0 ? (
                            <Badge className="bg-amber-100 text-amber-900 border border-amber-300">
                              {m.pendingCount} pend.
                            </Badge>
                          ) : (
                            <span className="text-slate-400">0</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-right">
                          <Button
                            size="sm"
                            variant={m.pendingCount > 0 ? "default" : "outline"}
                            disabled={isPending}
                            onClick={() => handleSaveAgentMap(m, true)}
                            className={`h-7 text-[11px] font-bold ${
                              m.pendingCount > 0
                                ? "bg-teal-700 hover:bg-teal-800 text-white"
                                : ""
                            }`}
                          >
                            <Check className="h-3 w-3 mr-1" />
                            {m.pendingCount > 0 ? "Guardar y Aplicar" : "Guardar"}
                          </Button>
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

      {/* 4. BANDEJA DE CUARENTENA E HISTORIAL DE LOTES */}
      <Card className="border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <CardHeader className="py-3.5 border-b border-slate-100 dark:border-zinc-800">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-2 bg-slate-100 dark:bg-zinc-900 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setListView("quarantine")}
                className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 ${
                  listView === "quarantine"
                    ? "bg-white dark:bg-zinc-800 text-amber-700 shadow-sm"
                    : "text-slate-600"
                }`}
              >
                <ShieldAlert className="h-3.5 w-3.5" />
                Cuarentena ({quarantinedItems.length})
              </button>
              <button
                type="button"
                onClick={() => setListView("batches")}
                className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 ${
                  listView === "batches"
                    ? "bg-white dark:bg-zinc-800 text-indigo-700 shadow-sm"
                    : "text-slate-600"
                }`}
              >
                <History className="h-3.5 w-3.5" />
                Historial de Lotes y Rollback ({batches.length})
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {listView === "quarantine" ? (
            quarantinedItems.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
                <ShieldCheck className="h-7 w-7 text-emerald-600" />
                <span>Bandeja limpia: no hay movimientos retenidos en cuarentena.</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-zinc-900 border-b text-[11px] uppercase font-bold text-slate-500">
                    <tr>
                      <th className="py-2.5 px-3">Fecha</th>
                      <th className="py-2.5 px-3">Origen</th>
                      <th className="py-2.5 px-3">Póliza</th>
                      <th className="py-2.5 px-3">Contratante</th>
                      <th className="py-2.5 px-3">Agente Ext.</th>
                      <th className="py-2.5 px-3 text-right">Monto MXN</th>
                      <th className="py-2.5 px-3">Motivo</th>
                      <th className="py-2.5 px-3 text-right">Decisión</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {quarantinedItems.map((q: any) => (
                      <tr key={q.id} className="hover:bg-slate-50 dark:hover:bg-zinc-900/40">
                        <td className="py-2 px-3 font-mono">{q.eventDateStr || "-"}</td>
                        <td className="py-2 px-3">{q.insurerKey}</td>
                        <td className="py-2 px-3 font-mono font-bold">{q.policyNumber}</td>
                        <td className="py-2 px-3 max-w-[180px] truncate">{q.clientName}</td>
                        <td className="py-2 px-3 text-[11px]">
                          <span className="font-mono font-bold">{q.externalAgentCode}</span>{" "}
                          {q.externalAgentName ? `· ${q.externalAgentName}` : ""}
                        </td>
                        <td
                          className={`py-2 px-3 text-right font-mono font-bold ${
                            q.amountMxn < 0 ? "text-rose-600" : ""
                          }`}
                        >
                          {formatMoneyExact(q.amountMxn)}
                        </td>
                        <td className="py-2 px-3">
                          <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300">
                            {REASON_LABELS[q.quarantineReason] || q.quarantineReason}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right">
                          <div className="flex justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isPending}
                              onClick={() => handleResolveQuarantine(q.id, "APPROVE")}
                              className="h-7 px-2 text-[11px] font-bold border-emerald-300 text-emerald-700"
                            >
                              Aprobar
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={isPending}
                              onClick={() => handleResolveQuarantine(q.id, "IGNORE")}
                              className="h-7 px-2 text-[11px] text-slate-500 hover:text-rose-600"
                            >
                              Ignorar
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : batches.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              Aún no se han procesado lotes.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-zinc-900 border-b text-[11px] uppercase font-bold text-slate-500">
                  <tr>
                    <th className="py-2.5 px-3">Fecha Lote</th>
                    <th className="py-2.5 px-3">Fuente / Vía</th>
                    <th className="py-2.5 px-3 text-center">Aplicados</th>
                    <th className="py-2.5 px-3 text-center">Cuarentena</th>
                    <th className="py-2.5 px-3 text-center">Omitidos</th>
                    <th className="py-2.5 px-3 text-right">Monto Aplicado</th>
                    <th className="py-2.5 px-3">Estado</th>
                    <th className="py-2.5 px-3 text-right">Rollback</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {batches.map((b: any) => {
                    const canRollback =
                      b.status !== "ROLLED_BACK" && (b.appliedCount || 0) > 0;
                    return (
                      <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-zinc-900/40">
                        <td className="py-2.5 px-3 font-mono font-bold">{b.batchDateStr}</td>
                        <td className="py-2.5 px-3">
                          <span className="font-bold">{b.source}</span>{" "}
                          <span className="text-[11px] text-slate-500">({b.triggeredBy})</span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-700">
                          {b.appliedCount}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-amber-700">
                          {b.quarantinedCount}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-slate-500">
                          {b.skippedCount}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold">
                          {formatMoneyExact(b.totalAppliedMxn)}
                        </td>
                        <td className="py-2.5 px-3">
                          <Badge
                            variant="outline"
                            className={
                              b.status === "ROLLED_BACK"
                                ? "border-slate-300 text-slate-500"
                                : b.status === "PARTIAL_QUARANTINE"
                                ? "border-amber-300 text-amber-800 bg-amber-50"
                                : "border-emerald-300 text-emerald-800 bg-emerald-50"
                            }
                          >
                            {b.status}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {canRollback ? (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isPending}
                              onClick={() => handleExecuteBatchRollback(b)}
                              className="h-7 px-2.5 text-[11px] font-bold border-rose-300 text-rose-700 hover:bg-rose-50"
                            >
                              <RotateCcw className="h-3 w-3 mr-1" /> Revertir Lote
                            </Button>
                          ) : (
                            <span className="text-[11px] text-slate-400">
                              {b.status === "ROLLED_BACK" ? "Revertido" : "-"}
                            </span>
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

      {/* MODAL: LLAVE GENERADA UNA SOLA VEZ */}
      <Dialog open={newKeyModalOpen} onOpenChange={setNewKeyModalOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-black flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-indigo-600" />
              Nueva API Key de Ingesta Grokbot (Guárdala ahora)
            </DialogTitle>
            <DialogDescription className="text-xs">
              Por seguridad solo almacenamos el hash SHA-256. Esta es la única vez que verás la
              llave completa en pantalla.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="p-3 rounded-lg bg-slate-900 text-emerald-300 font-mono text-xs break-all flex items-center justify-between gap-2">
              <span>{revealedPlainKey}</span>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => copyText(revealedPlainKey, "modal-key")}
                className="shrink-0 h-7 text-xs"
              >
                <Copy className="h-3.5 w-3.5 mr-1" />
                {copiedId === "modal-key" ? "Copiada" : "Copiar Key"}
              </Button>
            </div>

            <div className="space-y-1.5">
              <div className="text-xs font-bold">Prompt listo para enviar a Grokbot:</div>
              <textarea
                readOnly
                rows={9}
                value={buildGrokbotPromptText(revealedPlainKey)}
                className="w-full text-[11px] font-mono p-2.5 rounded-lg border bg-slate-50 dark:bg-zinc-900"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  copyText(buildGrokbotPromptText(revealedPlainKey), "modal-prompt")
                }
                className="text-xs font-bold"
              >
                <Copy className="h-3.5 w-3.5 mr-1.5" />
                {copiedId === "modal-prompt"
                  ? "Prompt Completo Copiado"
                  : "Copiar Prompt Completo con Key"}
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button size="sm" onClick={() => setNewKeyModalOpen(false)}>
              Ya la guardé
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: PROBAR / SUBIR JSON MANUALMENTE */}
      <Dialog open={manualModalOpen} onOpenChange={setManualModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-base font-black flex items-center gap-2">
              <Database className="h-5 w-5 text-indigo-600" />
              Simulador Dry-Run / Carga Manual JSON (primas.json o todo.json)
            </DialogTitle>
            <DialogDescription className="text-xs">
              Sube o pega un JSON crudo para simular exactamente qué aplicaría y qué iría a
              cuarentena antes de automatizar con Grokbot.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 overflow-y-auto py-2">
            <Input type="file" accept=".json,application/json" onChange={handleManualFileSelect} />
            <textarea
              rows={8}
              value={manualJsonText}
              onChange={(e) => setManualJsonText(e.target.value)}
              placeholder='Pega aquí el contenido crudo de /primas.json, /latino/todo.json o {"insignia": ..., "latino": ...}'
              className="w-full text-xs font-mono p-2.5 rounded-lg border bg-slate-50 dark:bg-zinc-900"
            />

            {manualDryRunRes && (
              <div className="p-3 rounded-lg border bg-indigo-50/50 dark:bg-indigo-950/20 text-xs space-y-1.5">
                <div className="font-black text-indigo-900 dark:text-indigo-200">
                  Resultado {manualDryRunRes.dryRun ? "SIMULACIÓN (Dry-Run)" : "APLICADO"} · Fuente:{" "}
                  {manualDryRunRes.source}
                </div>
                <div>
                  Leídos: <strong>{manualDryRunRes.counts.parsed}</strong> · Aplicables:{" "}
                  <strong className="text-emerald-700">{manualDryRunRes.counts.applied}</strong> (
                  {formatMoneyExact(manualDryRunRes.totalAppliedMxn)}) · Cuarentena:{" "}
                  <strong className="text-amber-700">{manualDryRunRes.counts.quarantined}</strong> ·
                  Omitidos (duplicados/compensados $0):{" "}
                  <strong>{manualDryRunRes.counts.skipped}</strong>
                </div>
                {manualDryRunRes.unmappedAgents?.length > 0 && (
                  <div className="text-[11px] text-amber-800 dark:text-amber-300">
                    Claves sin mapear:{" "}
                    {manualDryRunRes.unmappedAgents
                      .map((u: any) => `${u.insurerKey}:${u.externalAgentCode} (${u.itemsCount})`)
                      .join(", ")}
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setManualModalOpen(false)}>
              Cerrar
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={isPending || !manualJsonText.trim()}
              onClick={() => handleRunManualJson(true)}
              className="border-indigo-300 text-indigo-700 font-bold"
            >
              Simular (Dry-Run)
            </Button>
            <Button
              size="sm"
              disabled={isPending || !manualJsonText.trim()}
              onClick={() => handleRunManualJson(false)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
            >
              Aplicar Lote Real
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
