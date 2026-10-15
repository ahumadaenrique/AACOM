"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Wallet,
  FileText,
  Users,
  CalendarClock,
  AlertTriangle,
  Receipt,
  Sparkles,
  MessageCircle,
  Building2,
  User,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import CarteraTableClient from "./CarteraTableClient";
import CobranzaReceiptsClient from "./CobranzaReceiptsClient";
import CrossSellRadarClient from "./CrossSellRadarClient";
import {
  computeReceiptLiveStatus,
  formatDateSafe,
  RAMO_LABELS,
} from "./dateUtils";
import { analyzeClientBlindaje } from "./protectionGapUtils";

type WorkspaceTab = "POLIZAS" | "RECIBOS" | "ANIVERSARIOS" | "OPORTUNIDADES";

export default function CarteraWorkspaceTabs({
  policies,
  activePolicies,
  atRiskPolicies,
  totalActivePremium,
  atRiskPremium,
  clientsCount,
  avgPoliciesPerClient,
  clientsWithPolicies,
  adnDiagnostics,
  isAdmin,
}: {
  policies: any[];
  activePolicies: any[];
  atRiskPolicies: any[];
  totalActivePremium: number;
  atRiskPremium: number;
  clientsCount: number;
  avgPoliciesPerClient: string;
  clientsWithPolicies: any[];
  adnDiagnostics: any[];
  isAdmin: boolean;
}) {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("POLIZAS");
  const [daysHorizon, setDaysHorizon] = useState<number>(30);

  // Contar recibos pendientes (en gracia + próximos 30 días)
  const { graceReceiptsCount, upcomingReceiptsCount } = useMemo(() => {
    let grace = 0;
    let upcoming = 0;
    for (const p of policies) {
      if (p.isArchived || p.status === "CANCELADA" || p.status === "TERMINADA") {
        continue;
      }
      for (const r of p.receipts || []) {
        const live = computeReceiptLiveStatus(r);
        if (live.liveStatus === "EN_GRACIA" || live.liveStatus === "POR_CONFIRMAR") {
          grace++;
        } else if (live.liveStatus === "PROXIMO") {
          upcoming++;
        }
      }
    }
    return { graceReceiptsCount: grace, upcomingReceiptsCount: upcoming };
  }, [policies]);

  const totalActionableReceipts = graceReceiptsCount + upcomingReceiptsCount;

  // Filtrar aniversarios y renovaciones dinámicamente en cliente sin recargar página
  const upcomingRenewals = useMemo(
    () =>
      activePolicies
        .filter(
          (p) =>
            p.cycle.daysUntilNextEvent !== null &&
            p.cycle.daysUntilNextEvent >= 0 &&
            p.cycle.daysUntilNextEvent <= daysHorizon
        )
        .sort(
          (a, b) =>
            (a.cycle.daysUntilNextEvent ?? 999) -
            (b.cycle.daysUntilNextEvent ?? 999)
        ),
    [activePolicies, daysHorizon]
  );

  // Contar oportunidades de venta cruzada
  const crossSellCount = useMemo(() => {
    let count = 0;
    for (const c of clientsWithPolicies) {
      if ((c.policies || []).length === 0) continue;
      const analysis = analyzeClientBlindaje(c, adnDiagnostics);
      if (analysis.primaryGap && analysis.coveredCount < 4) count++;
    }
    return count;
  }, [clientsWithPolicies, adnDiagnostics]);

  return (
    <div className="space-y-6">
      {/* KPI CARDS INTERACTIVOS (1 CLIC CAMBIA DE PESTAÑA) */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card
          onClick={() => setActiveTab("POLIZAS")}
          className={`cursor-pointer transition-all hover:shadow-md bg-gradient-to-br from-primary/10 via-background to-background ${
            activeTab === "POLIZAS"
              ? "ring-2 ring-primary border-primary/40"
              : "border-primary/20"
          }`}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              Prima Anualizada Activa
            </CardTitle>
            <Wallet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {new Intl.NumberFormat("es-MX", {
                style: "currency",
                currency: "MXN",
                maximumFractionDigits: 0,
              }).format(totalActivePremium)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {activePolicies.length} pólizas vigentes ({activePolicies.filter((p) => p.cycle.isLongTerm).length} largo plazo)
            </p>
          </CardContent>
        </Card>

        <Card
          onClick={() => setActiveTab("RECIBOS")}
          className={`cursor-pointer transition-all hover:shadow-md ${
            activeTab === "RECIBOS"
              ? "ring-2 ring-indigo-500 border-indigo-500/40"
              : graceReceiptsCount > 0
              ? "border-amber-500/40 bg-amber-500/5"
              : ""
          }`}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              Cobros y Recibos
            </CardTitle>
            {graceReceiptsCount > 0 ? (
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            ) : (
              <Receipt className="h-4 w-4 text-indigo-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">
                {totalActionableReceipts}
              </span>
              <span className="text-xs text-muted-foreground">
                por cobrar / confirmar
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {graceReceiptsCount > 0
                ? `${graceReceiptsCount} en periodo de gracia (${new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(atRiskPremium)})`
                : `${upcomingReceiptsCount} próximos en los siguientes 30 días`}
            </p>
          </CardContent>
        </Card>

        <Card
          onClick={() => setActiveTab("ANIVERSARIOS")}
          className={`cursor-pointer transition-all hover:shadow-md ${
            activeTab === "ANIVERSARIOS"
              ? "ring-2 ring-orange-500 border-orange-500/40"
              : ""
          }`}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              Próximos Aniversarios
            </CardTitle>
            <CalendarClock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {upcomingRenewals.length}
              </span>
              <span className="text-xs text-muted-foreground">
                en los próximos {daysHorizon} días
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Haz clic para enviar felicitación o aviso por WhatsApp
            </p>
          </CardContent>
        </Card>

        <Card
          onClick={() => setActiveTab("OPORTUNIDADES")}
          className={`cursor-pointer transition-all hover:shadow-md ${
            activeTab === "OPORTUNIDADES"
              ? "ring-2 ring-emerald-500 border-emerald-500/40"
              : ""
          }`}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              Oportunidades de Venta
            </CardTitle>
            <Sparkles className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {crossSellCount}
              </span>
              <Badge variant="secondary" className="text-xs font-normal">
                {avgPoliciesPerClient} pólizas / cliente
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Clientes con brechas de protección detectadas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* BARRA DE NAVEGACIÓN POR PESTAÑAS (CERO SCROLL INFINITO) */}
      <div className="flex flex-wrap items-center gap-2 border-b pb-3">
        <Button
          variant={activeTab === "POLIZAS" ? "default" : "outline"}
          onClick={() => setActiveTab("POLIZAS")}
          className="gap-2"
        >
          <FileText className="w-4 h-4" />
          Mis Pólizas
          <Badge
            variant={activeTab === "POLIZAS" ? "secondary" : "outline"}
            className="ml-0.5 px-1.5 py-0 text-xs"
          >
            {policies.length}
          </Badge>
        </Button>

        <Button
          variant={activeTab === "RECIBOS" ? "default" : "outline"}
          onClick={() => setActiveTab("RECIBOS")}
          className="gap-2"
        >
          <Receipt className="w-4 h-4" />
          Cobros y Recibos
          <Badge
            variant={
              graceReceiptsCount > 0
                ? "destructive"
                : activeTab === "RECIBOS"
                ? "secondary"
                : "outline"
            }
            className="ml-0.5 px-1.5 py-0 text-xs"
          >
            {totalActionableReceipts}
          </Badge>
        </Button>

        <Button
          variant={activeTab === "ANIVERSARIOS" ? "default" : "outline"}
          onClick={() => setActiveTab("ANIVERSARIOS")}
          className="gap-2"
        >
          <CalendarClock className="w-4 h-4" />
          Aniversarios y Renovaciones
          <Badge
            variant={activeTab === "ANIVERSARIOS" ? "secondary" : "outline"}
            className="ml-0.5 px-1.5 py-0 text-xs"
          >
            {upcomingRenewals.length}
          </Badge>
        </Button>

        <Button
          variant={activeTab === "OPORTUNIDADES" ? "default" : "outline"}
          onClick={() => setActiveTab("OPORTUNIDADES")}
          className="gap-2"
        >
          <Sparkles className="w-4 h-4" />
          Oportunidades de Venta
          <Badge
            variant={activeTab === "OPORTUNIDADES" ? "secondary" : "outline"}
            className="ml-0.5 px-1.5 py-0 text-xs"
          >
            {crossSellCount}
          </Badge>
        </Button>
      </div>

      {/* BANNER RÁPIDO SI HAY RECIBOS EN PERIODO DE GRACIA Y EL ASESOR ESTÁ EN MIS PÓLIZAS */}
      {activeTab === "POLIZAS" && graceReceiptsCount > 0 && (
        <div className="p-3 rounded-lg border border-amber-500/40 bg-amber-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-amber-800 dark:text-amber-300">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Tienes <strong>{graceReceiptsCount} recibo(s)</strong> en periodo de gracia o pendientes de confirmar pago.
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setActiveTab("RECIBOS")}
            className="h-8 text-xs border-amber-500/40 text-amber-800 dark:text-amber-300 hover:bg-amber-500/20 shrink-0"
          >
            Revisar recibos ahora
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
      )}

      {/* CONTENIDO DE LA PESTAÑA ACTIVA */}
      {activeTab === "POLIZAS" && (
        <CarteraTableClient policies={policies} isAdmin={isAdmin} />
      )}

      {activeTab === "RECIBOS" && (
        <CobranzaReceiptsClient policies={policies} isAdmin={isAdmin} />
      )}

      {activeTab === "ANIVERSARIOS" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <CalendarClock className="w-5 h-5 text-orange-500" />
                Próximos Aniversarios y Renovaciones Anuales
              </h2>
              <p className="text-xs text-muted-foreground">
                En Vida Individual se monitorea el aniversario anual de la póliza; en GMM, Autos y Daños su renovación de contrato.
              </p>
            </div>
            <div className="flex space-x-1 border rounded-md p-1 bg-muted/20 w-fit">
              {[30, 45, 60, 90].map((d) => (
                <Badge
                  key={d}
                  variant={daysHorizon === d ? "default" : "outline"}
                  onClick={() => setDaysHorizon(d)}
                  className="cursor-pointer"
                >
                  {d} días
                </Badge>
              ))}
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              {upcomingRenewals.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
                  <Building2 className="w-12 h-12 mb-3 text-muted/30" />
                  <p>
                    No tienes pólizas con aniversario o renovación en los próximos {daysHorizon} días.
                  </p>
                  <p className="text-xs mt-1">
                    Selecciona 60 o 90 días arriba para ver eventos más lejanos.
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {upcomingRenewals.map((policy) => {
                    const isAnniv = policy.cycle.eventType === "ANIVERSARIO";
                    const daysLeft = policy.cycle.daysUntilNextEvent ?? 0;
                    const cleanPhone = (policy.client?.phone || "").replace(/\D/g, "");
                    const clientName =
                      policy.contractor || policy.client?.name || "Cliente";
                    const eventDateFormatted = formatDateSafe(
                      policy.cycle.nextEventDate,
                      "dd 'de' MMM yyyy"
                    );
                    const waMessage = isAnniv
                      ? `Hola ${clientName}, te saludo con gusto. Te escribo porque el próximo ${eventDateFormatted} tu póliza ${policy.product || ""} (${policy.insuranceCompany || ""}) cumple su Aniversario Año ${policy.cycle.policyYear || ""}. ¿Tienes 5 minutos esta semana para revisar tu blindaje y beneficiarios?`
                      : `Hola ${clientName}, te saludo con gusto. El próximo ${eventDateFormatted} se renueva tu póliza ${policy.product || ""} (${policy.insuranceCompany || ""}). Te contacto con anticipación para revisar condiciones de renovación.`;

                    return (
                      <div
                        key={policy.id}
                        className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 hover:bg-muted/50 transition-colors gap-3"
                      >
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link
                              href={
                                policy.clientId
                                  ? `/cartera/clientes/${policy.clientId}`
                                  : "/cartera/clientes"
                              }
                              className="font-semibold text-base hover:underline text-primary"
                            >
                              {clientName}
                            </Link>
                            <Badge
                              variant="outline"
                              className={
                                isAnniv
                                  ? "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30 text-xs"
                                  : "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 text-xs"
                              }
                            >
                              {isAnniv ? (
                                <span className="flex items-center gap-1">
                                  <Sparkles className="w-3 h-3" />
                                  Aniversario{" "}
                                  {policy.cycle.policyYear
                                    ? `Año ${policy.cycle.policyYear}`
                                    : "Anual"}
                                </span>
                              ) : (
                                "Renovación de Contrato"
                              )}
                            </Badge>
                            {isAdmin && policy.user?.name && (
                              <Badge
                                variant="outline"
                                className="text-xs font-normal gap-1 text-muted-foreground"
                              >
                                <User className="w-3 h-3 text-indigo-500" />
                                {policy.user.name}
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            Póliza{" "}
                            <strong className="text-foreground">
                              {policy.policyNumber}
                            </strong>{" "}
                            • {policy.product || "Plan no especificado"} •{" "}
                            {policy.insuranceCompany || "Aseguradora"} •{" "}
                            {RAMO_LABELS[policy.ramo || "VIDA_INDIVIDUAL"] ||
                              policy.ramo}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 self-end md:self-center">
                          <div className="flex flex-col items-end text-right">
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={
                                  daysLeft <= 15 ? "destructive" : "secondary"
                                }
                                className="text-xs"
                              >
                                {daysLeft === 0
                                  ? "¡Hoy!"
                                  : daysLeft === 1
                                  ? "Mañana"
                                  : `En ${daysLeft} días`}
                              </Badge>
                              <span className="font-bold text-sm text-orange-600 dark:text-orange-400">
                                {formatDateSafe(
                                  policy.cycle.nextEventDate,
                                  "dd MMM yyyy"
                                )}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground mt-0.5">
                              Prima:{" "}
                              <strong className="text-foreground">
                                {new Intl.NumberFormat("es-MX", {
                                  style: "currency",
                                  currency: "MXN",
                                }).format(policy.annualPremium || 0)}
                              </strong>{" "}
                              {policy.paymentMethod
                                ? `(${policy.paymentMethod})`
                                : ""}
                            </span>
                          </div>

                          {cleanPhone.length >= 10 && (
                            <a
                              href={`https://wa.me/${
                                cleanPhone.length === 10
                                  ? "52" + cleanPhone
                                  : cleanPhone
                              }?text=${encodeURIComponent(waMessage)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Enviar recordatorio por WhatsApp"
                            >
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-emerald-500/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10"
                              >
                                <MessageCircle className="w-4 h-4 mr-1.5" />
                                WhatsApp
                              </Button>
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "OPORTUNIDADES" && (
        <CrossSellRadarClient
          clients={clientsWithPolicies}
          adnDiagnostics={adnDiagnostics}
        />
      )}
    </div>
  );
}
