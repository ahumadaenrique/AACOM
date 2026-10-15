"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, Search } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import {
  computePolicyCycleInfo,
  computeReceiptLiveStatus,
  formatDateSafe,
  RAMO_LABELS,
  STATUS_CONFIG,
  SUB_STATUS_LABELS,
} from "./dateUtils";
import PolicyActions from "./clientes/[id]/PolicyActions";
import PolicyUpload from "./clientes/[id]/PolicyUpload";

export default function CarteraTableClient({
  policies,
  isAdmin,
}: {
  policies: any[];
  isAdmin: boolean;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [agentFilter, setAgentFilter] = useState("ALL");
  const [ramoFilter, setRamoFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [emissionFilter, setEmissionFilter] = useState<"ALL" | "NUEVA" | "RENOVACION">("ALL");

  const uniqueAgents = useMemo(
    () =>
      Array.from(
        new Set(policies.map((p) => p.user?.name).filter(Boolean))
      ) as string[],
    [policies]
  );

  const enrichedPolicies = useMemo(
    () =>
      policies.map((p) => {
        const cycle = computePolicyCycleInfo(p);
        const isRenewal =
          p.subStatus === "RENOVACION" ||
          (p.subStatus !== "NUEVA" && (cycle.currentPolicyYear || 1) >= 2);
        const emissionType: "NUEVA" | "RENOVACION" = isRenewal
          ? "RENOVACION"
          : "NUEVA";

        const receipts = Array.isArray(p.receipts) ? p.receipts : [];
        let paidReceiptsCount = 0;
        let paidReceiptsAmount = 0;
        for (const r of receipts) {
          const live = computeReceiptLiveStatus(r);
          if (live.liveStatus === "PAGADO" || r.status === "PAGADO") {
            paidReceiptsCount++;
            paidReceiptsAmount += Number(r.amount || 0);
          }
        }

        return {
          ...p,
          cycle,
          emissionType,
          paidReceiptsCount,
          paidReceiptsAmount,
          totalReceiptsCount: receipts.length,
        };
      }),
    [policies]
  );

  // Resumen dedicado de GMM y Autos: Nuevas vs Renovaciones (QA C2)
  const gmmAutosBreakdown = useMemo(() => {
    const targetPolicies = enrichedPolicies.filter((p) => {
      const r = p.ramo || "VIDA_INDIVIDUAL";
      if (ramoFilter === "GMM" || ramoFilter === "AUTOS") {
        return r === ramoFilter;
      }
      return r === "GMM" || r === "AUTOS";
    });
    let nuevasCount = 0;
    let nuevasPremium = 0;
    let renovacionesCount = 0;
    let renovacionesPremium = 0;

    for (const p of targetPolicies) {
      if (
        p.cycle.computedStatus === "CANCELADA" ||
        p.cycle.computedStatus === "TERMINADA"
      )
        continue;
      if (p.emissionType === "NUEVA") {
        nuevasCount++;
        nuevasPremium += Number(p.annualPremium || 0);
      } else {
        renovacionesCount++;
        renovacionesPremium += Number(p.annualPremium || 0);
      }
    }

    return {
      nuevasCount,
      nuevasPremium,
      renovacionesCount,
      renovacionesPremium,
    };
  }, [enrichedPolicies, ramoFilter]);

  // Resumen dedicado de Vida Grupo contando recibos pagados (QA C5)
  const vidaGrupoMetrics = useMemo(() => {
    const vgPolicies = enrichedPolicies.filter(
      (p) => (p.ramo || "") === "VIDA_GRUPO"
    );
    let activeCount = 0;
    let totalPaidReceipts = 0;
    let totalPaidAmount = 0;
    let totalAnnualPremium = 0;

    for (const p of vgPolicies) {
      if (
        p.cycle.computedStatus !== "CANCELADA" &&
        p.cycle.computedStatus !== "TERMINADA"
      ) {
        activeCount++;
        totalAnnualPremium += Number(p.annualPremium || 0);
      }
      totalPaidReceipts += p.paidReceiptsCount || 0;
      totalPaidAmount += p.paidReceiptsAmount || 0;
    }

    return {
      totalPolicies: vgPolicies.length,
      activeCount,
      totalPaidReceipts,
      totalPaidAmount,
      totalAnnualPremium,
    };
  }, [enrichedPolicies]);

  const filteredPolicies = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return enrichedPolicies.filter((policy) => {
      const matchesSearch =
        term === "" ||
        policy.policyNumber?.toLowerCase().includes(term) ||
        policy.contractor?.toLowerCase().includes(term) ||
        policy.insured?.toLowerCase().includes(term) ||
        policy.product?.toLowerCase().includes(term) ||
        policy.insuranceCompany?.toLowerCase().includes(term);

      const matchesAgent =
        agentFilter === "ALL" || policy.user?.name === agentFilter;

      const policyRamo = policy.ramo || "VIDA_INDIVIDUAL";
      const matchesRamo = ramoFilter === "ALL" || policyRamo === ramoFilter;

      const matchesStatus =
        statusFilter === "ALL" || policy.cycle.computedStatus === statusFilter;

      const matchesEmission =
        emissionFilter === "ALL" || policy.emissionType === emissionFilter;

      return (
        matchesSearch &&
        matchesAgent &&
        matchesRamo &&
        matchesStatus &&
        matchesEmission
      );
    });
  }, [
    enrichedPolicies,
    searchTerm,
    agentFilter,
    ramoFilter,
    statusFilter,
    emissionFilter,
  ]);

  const handleDownloadCSV = () => {
    const headers = [
      "Poliza",
      isAdmin ? "Agente" : null,
      "Contratante",
      "Asegurado",
      "Ramo",
      "Tipo Emision",
      "Producto",
      "Aseguradora",
      "Estatus",
      "Inicio Vigencia",
      "Proximo Aniversario o Renovacion",
      "Forma de Pago",
      "Recibos Pagados",
      "Moneda",
      "Prima Anual MXN",
    ].filter(Boolean);

    const rows = filteredPolicies.map((p) => {
      const statusObj =
        STATUS_CONFIG[p.cycle.computedStatus] || STATUS_CONFIG.VIGENTE;
      return [
        p.policyNumber || "",
        isAdmin ? p.user?.name || "Sin Asignar" : null,
        p.contractor || p.client?.name || "",
        p.insured || p.contractor || "",
        RAMO_LABELS[p.ramo || "VIDA_INDIVIDUAL"] || p.ramo || "Vida Individual",
        p.emissionType === "NUEVA" ? "Nueva (Año 1)" : `Renovación (Año ${p.cycle.currentPolicyYear || 2})`,
        p.product || "",
        p.insuranceCompany || "",
        statusObj.label,
        formatDateSafe(p.effectiveDate, "dd/MM/yyyy", ""),
        formatDateSafe(p.cycle.nextEventDate, "dd/MM/yyyy", ""),
        (p.paymentMethod || "").trim(),
        `${p.paidReceiptsCount || 0}/${p.totalReceiptsCount || 0}`,
        p.currency || "MXN",
        p.annualPremium || 0,
      ]
        .filter((v) => v !== null)
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Cartera_Filtrada_${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const fmtCurrency = (val: number) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      maximumFractionDigits: 0,
    }).format(val);

  return (
    <div className="space-y-4">
      {/* BARRA RÁPIDA DE SEGMENTACIÓN: NUEVO VS RENOVACIÓN (GMM/AUTOS - QA C2) Y VIDA GRUPO (QA C5) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2 p-3.5 rounded-lg border bg-white dark:bg-zinc-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
              Desglose GMM y Autos (Nuevas vs. Renovaciones)
            </span>
            <div className="flex flex-wrap items-center gap-3 mt-1 text-xs">
              <button
                type="button"
                onClick={() =>
                  setEmissionFilter(emissionFilter === "NUEVA" ? "ALL" : "NUEVA")
                }
                className={`px-2.5 py-1 rounded-md border transition font-medium ${
                  emissionFilter === "NUEVA"
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/20 hover:bg-emerald-500/20"
                }`}
              >
                ✨ Nuevas (Año 1): <strong>{gmmAutosBreakdown.nuevasCount}</strong> (
                {fmtCurrency(gmmAutosBreakdown.nuevasPremium)})
              </button>
              <button
                type="button"
                onClick={() =>
                  setEmissionFilter(
                    emissionFilter === "RENOVACION" ? "ALL" : "RENOVACION"
                  )
                }
                className={`px-2.5 py-1 rounded-md border transition font-medium ${
                  emissionFilter === "RENOVACION"
                    ? "bg-amber-600 text-white border-amber-600"
                    : "bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/20 hover:bg-amber-500/20"
                }`}
              >
                🔄 Renovaciones (Año 2+):{" "}
                <strong>{gmmAutosBreakdown.renovacionesCount}</strong> (
                {fmtCurrency(gmmAutosBreakdown.renovacionesPremium)})
              </button>
              {emissionFilter !== "ALL" && (
                <button
                  type="button"
                  onClick={() => setEmissionFilter("ALL")}
                  className="text-[11px] text-muted-foreground underline"
                >
                  Limpiar filtro
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              type="button"
              size="sm"
              variant={ramoFilter === "GMM" ? "default" : "outline"}
              onClick={() => setRamoFilter(ramoFilter === "GMM" ? "ALL" : "GMM")}
              className="h-7 text-xs px-2.5"
            >
              GMM
            </Button>
            <Button
              type="button"
              size="sm"
              variant={ramoFilter === "AUTOS" ? "default" : "outline"}
              onClick={() =>
                setRamoFilter(ramoFilter === "AUTOS" ? "ALL" : "AUTOS")
              }
              className="h-7 text-xs px-2.5"
            >
              Autos
            </Button>
          </div>
        </div>

        <div
          onClick={() =>
            setRamoFilter(ramoFilter === "VIDA_GRUPO" ? "ALL" : "VIDA_GRUPO")
          }
          className={`p-3.5 rounded-lg border cursor-pointer transition flex items-center justify-between gap-3 ${
            ramoFilter === "VIDA_GRUPO"
              ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 ring-1 ring-indigo-600"
              : "bg-white dark:bg-zinc-950 hover:border-indigo-400"
          }`}
        >
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
              🏢 Vista Vida Grupo (Recibos Pagados)
            </span>
            <div className="text-xs text-muted-foreground mt-1">
              Pólizas: <strong className="text-foreground">{vidaGrupoMetrics.activeCount}</strong>{" "}
              • Recibos pagados:{" "}
              <strong className="text-emerald-600 dark:text-emerald-400">
                {vidaGrupoMetrics.totalPaidReceipts}
              </strong>{" "}
              ({fmtCurrency(vidaGrupoMetrics.totalPaidAmount)})
            </div>
          </div>
          <Badge
            variant={ramoFilter === "VIDA_GRUPO" ? "default" : "outline"}
            className="text-[10px] shrink-0"
          >
            {ramoFilter === "VIDA_GRUPO" ? "Filtro Activo" : "Filtrar"}
          </Badge>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between p-4 bg-white dark:bg-zinc-950 rounded-md border">
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 flex-1">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar póliza, cliente, plan..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Select value={ramoFilter} onValueChange={setRamoFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Todos los Ramos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos los Ramos</SelectItem>
              {Object.entries(RAMO_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={emissionFilter}
            onValueChange={(v) =>
              setEmissionFilter(v as "ALL" | "NUEVA" | "RENOVACION")
            }
          >
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Nuevo / Renovación" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todas (Nuevas y Renov.)</SelectItem>
              <SelectItem value="NUEVA">✨ Póliza Nueva (Año 1)</SelectItem>
              <SelectItem value="RENOVACION">🔄 Renovación (Año 2+)</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Todos los Estatus" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos los Estatus</SelectItem>
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <SelectItem key={key} value={key}>
                  {cfg.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {isAdmin && uniqueAgents.length > 0 && (
            <Select value={agentFilter} onValueChange={setAgentFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Todos los Agentes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos los Agentes</SelectItem>
                {uniqueAgents.map((agent) => (
                  <SelectItem key={agent} value={agent}>
                    {agent}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <Button
          variant="outline"
          onClick={handleDownloadCSV}
          className="w-full lg:w-auto shrink-0"
        >
          <Download className="mr-2 h-4 w-4" /> Exportar CSV ({filteredPolicies.length})
        </Button>
      </div>

      <div className="overflow-auto max-h-[600px] border rounded-md bg-white dark:bg-zinc-950">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Póliza / Aseguradora</TableHead>
              {isAdmin && <TableHead>Agente</TableHead>}
              <TableHead>Cliente / Contratante</TableHead>
              <TableHead>Plan / Ramo</TableHead>
              <TableHead>Estatus / Tipo</TableHead>
              <TableHead>Próx. Aniversario / Renovación</TableHead>
              <TableHead className="text-right">Prima Anual</TableHead>
              <TableHead>Carátula PDF</TableHead>
              <TableHead className="text-center">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPolicies.map((policy) => {
              const statusCfg =
                STATUS_CONFIG[policy.cycle.computedStatus] ||
                STATUS_CONFIG.VIGENTE;
              const isAnniv = policy.cycle.eventType === "ANIVERSARIO";

              return (
                <TableRow key={policy.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium text-xs">
                    <div className="font-semibold text-foreground">
                      {policy.policyNumber}
                    </div>
                    <div className="text-muted-foreground">
                      {policy.insuranceCompany || "Sin aseguradora"}
                    </div>
                  </TableCell>

                  {isAdmin && (
                    <TableCell className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                      {policy.user?.name || "Sin Asignar"}
                    </TableCell>
                  )}

                  <TableCell>
                    {policy.clientId ? (
                      <Link
                        href={`/cartera/clientes/${policy.clientId}`}
                        className="hover:underline font-semibold text-primary text-sm"
                      >
                        {policy.contractor || policy.client?.name || "Cliente"}
                      </Link>
                    ) : (
                      <span className="font-semibold text-sm">
                        {policy.contractor || "Cliente"}
                      </span>
                    )}
                    {policy.paymentMethod?.trim() && (
                      <div className="text-[11px] text-muted-foreground">
                        Pago: {policy.paymentMethod.trim()}
                      </div>
                    )}
                  </TableCell>

                  <TableCell>
                    <div className="text-sm font-medium">
                      {policy.product || "No especificado"}
                    </div>
                    <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 flex-wrap">
                      <span>
                        {RAMO_LABELS[policy.ramo || "VIDA_INDIVIDUAL"] ||
                          policy.ramo}
                      </span>
                      {(policy.ramo === "VIDA_GRUPO" ||
                        ramoFilter === "VIDA_GRUPO") && (
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                        >
                          ✓ {policy.paidReceiptsCount || 0} recibo(s) pagado(s)
                        </Badge>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-col gap-1 items-start">
                      <div className="flex items-center gap-1 flex-wrap">
                        <Badge
                          variant="outline"
                          className={`text-[11px] font-medium ${statusCfg.badgeClass}`}
                        >
                          {statusCfg.label}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={
                            policy.emissionType === "NUEVA"
                              ? "text-[10px] px-1.5 py-0 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                              : "text-[10px] px-1.5 py-0 bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30"
                          }
                        >
                          {policy.emissionType === "NUEVA"
                            ? "✨ Nueva"
                            : `🔄 Renovación (Año ${policy.cycle.currentPolicyYear || 2})`}
                        </Badge>
                      </div>
                      {policy.subStatus && (
                        <span className="text-[10px] text-muted-foreground">
                          {SUB_STATUS_LABELS[policy.subStatus] ||
                            policy.subStatus}
                        </span>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="text-xs whitespace-nowrap">
                    {policy.cycle.nextEventDate ? (
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {formatDateSafe(
                            policy.cycle.nextEventDate,
                            "dd/MM/yyyy"
                          )}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {isAnniv
                            ? `Aniversario ${
                                policy.cycle.policyYear
                                  ? `(Año ${policy.cycle.policyYear})`
                                  : ""
                              }`
                            : "Renovación Anual"}
                        </span>
                      </div>
                    ) : (
                      "-"
                    )}
                  </TableCell>

                  <TableCell className="text-right font-medium whitespace-nowrap">
                    <div>
                      {new Intl.NumberFormat("es-MX", {
                        style: "currency",
                        currency: "MXN",
                      }).format(policy.annualPremium || 0)}
                    </div>
                    {policy.currency &&
                      policy.currency !== "MXN" &&
                      policy.originalPremium && (
                        <div className="text-[11px] text-muted-foreground">
                          {new Intl.NumberFormat("es-MX", {
                            maximumFractionDigits: 2,
                          }).format(policy.originalPremium)}{" "}
                          {policy.currency}
                        </div>
                      )}
                  </TableCell>

                  <TableCell>
                    <PolicyUpload policy={policy} />
                  </TableCell>

                  <TableCell className="text-center">
                    <PolicyActions
                      policy={policy}
                      clientId={policy.clientId || ""}
                    />
                  </TableCell>
                </TableRow>
              );
            })}

            {filteredPolicies.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={isAdmin ? 9 : 8}
                  className="text-center p-6 text-muted-foreground"
                >
                  No se encontraron pólizas para los filtros seleccionados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
