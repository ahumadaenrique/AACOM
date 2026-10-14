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
  formatDateSafe,
  RAMO_LABELS,
  STATUS_CONFIG,
  SUB_STATUS_LABELS,
} from "./dateUtils";
import PolicyActions from "./clientes/[id]/PolicyActions";

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

  const uniqueAgents = useMemo(
    () =>
      Array.from(
        new Set(policies.map((p) => p.user?.name).filter(Boolean))
      ) as string[],
    [policies]
  );

  const enrichedPolicies = useMemo(
    () =>
      policies.map((p) => ({
        ...p,
        cycle: computePolicyCycleInfo(p),
      })),
    [policies]
  );

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

      return matchesSearch && matchesAgent && matchesRamo && matchesStatus;
    });
  }, [enrichedPolicies, searchTerm, agentFilter, ramoFilter, statusFilter]);

  const handleDownloadCSV = () => {
    const headers = [
      "Poliza",
      isAdmin ? "Agente" : null,
      "Contratante",
      "Asegurado",
      "Ramo",
      "Producto",
      "Aseguradora",
      "Estatus",
      "Inicio Vigencia",
      "Proximo Aniversario o Renovacion",
      "Forma de Pago",
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
        p.product || "",
        p.insuranceCompany || "",
        statusObj.label,
        formatDateSafe(p.effectiveDate, "dd/MM/yyyy", ""),
        formatDateSafe(p.cycle.nextEventDate, "dd/MM/yyyy", ""),
        p.paymentMethod || "",
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

  return (
    <div className="space-y-4">
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
              <TableHead>Contratante</TableHead>
              <TableHead>Producto / Ramo</TableHead>
              <TableHead>Estatus</TableHead>
              <TableHead>Inicio Vigencia</TableHead>
              <TableHead>Próx. Aniversario / Renovación</TableHead>
              <TableHead className="text-right">Prima Anual</TableHead>
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
                    {policy.paymentMethod && (
                      <div className="text-[11px] text-muted-foreground">
                        Pago: {policy.paymentMethod}
                      </div>
                    )}
                  </TableCell>

                  <TableCell>
                    <div className="text-sm font-medium">
                      {policy.product || "No especificado"}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {RAMO_LABELS[policy.ramo || "VIDA_INDIVIDUAL"] ||
                        policy.ramo}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-col gap-1 items-start">
                      <Badge
                        variant="outline"
                        className={`text-[11px] font-medium ${statusCfg.badgeClass}`}
                      >
                        {statusCfg.label}
                      </Badge>
                      {policy.subStatus && (
                        <span className="text-[10px] text-muted-foreground">
                          {SUB_STATUS_LABELS[policy.subStatus] ||
                            policy.subStatus}
                        </span>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="text-xs whitespace-nowrap">
                    {formatDateSafe(policy.effectiveDate, "dd/MM/yyyy", "-")}
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
