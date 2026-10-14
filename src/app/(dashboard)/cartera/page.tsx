import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Users,
  Wallet,
  Clock,
  FileText,
  Upload,
  User,
  Sparkles,
  CalendarClock,
  MessageCircle,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import CarteraTableClient from "./CarteraTableClient";
import CobranzaReceiptsClient from "./CobranzaReceiptsClient";
import QuickPdfAiPolicyDialog from "./QuickPdfAiPolicyDialog";
import CrossSellRadarClient from "./CrossSellRadarClient";
import PremiumGuard from "@/components/PremiumGuard";
import {
  computePolicyCycleInfo,
  computeReceiptLiveStatus,
  formatDateSafe,
  RAMO_LABELS,
} from "./dateUtils";
import { ensurePoliciesHaveReceipts } from "./actions";

export const dynamic = "force-dynamic";

export default async function CarteraDashboard({
  searchParams,
}: {
  searchParams: { days?: string };
}) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const daysFilter = parseInt(searchParams.days || "30", 10);

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, agencyId: true },
  });
  const currentAgencyId = (session.user.agencyId || dbUser?.agencyId || "aacom") as string;
  const isAdmin = dbUser?.role === "ADMIN" || dbUser?.role === "SUPER_ADMIN";

  const policiesWhereClause: any = isAdmin
    ? { agencyId: currentAgencyId, isArchived: false }
    : { userId: session.user.id, isArchived: false };

  const clientsWhereClause: any = isAdmin
    ? { agencyId: currentAgencyId, isArchived: false }
    : { userId: session.user.id, isArchived: false };

  let policies = await prisma.policy.findMany({
    where: policiesWhereClause,
    include: {
      client: true,
      user: { select: { name: true } },
      receipts: {
        orderBy: [{ policyYear: "asc" }, { receiptNumber: "asc" }],
      },
    },
    orderBy: { effectiveDate: "desc" },
  });

  // Inicializar recibos automáticamente para las pólizas activas que aún no tengan recibos
  const generatedAny = await ensurePoliciesHaveReceipts(policies);
  if (generatedAny) {
    policies = await prisma.policy.findMany({
      where: policiesWhereClause,
      include: {
        client: true,
        user: { select: { name: true } },
        receipts: {
          orderBy: [{ policyYear: "asc" }, { receiptNumber: "asc" }],
        },
      },
      orderBy: { effectiveDate: "desc" },
    });
  }

  const [clientsWithPolicies, adnDiagnostics] = await Promise.all([
    prisma.client.findMany({
      where: clientsWhereClause,
      include: {
        policies: { where: { isArchived: false } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.adnDiagnostic.findMany({
      where: isAdmin
        ? { agencyId: currentAgencyId }
        : { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  const clientsCount = clientsWithPolicies.length;

  // Enriquecer cada póliza con su ciclo real (Aniversario vs Renovación) y estatus
  const enrichedPolicies = policies.map((p) => {
    const cycle = computePolicyCycleInfo(p);
    const hasReceiptInGrace = (p.receipts || []).some((r) => {
      const live = computeReceiptLiveStatus(r);
      return live.liveStatus === "EN_GRACIA" || live.liveStatus === "POR_CONFIRMAR";
    });
    return {
      ...p,
      cycle,
      hasReceiptInGrace,
    };
  });

  const activePolicies = enrichedPolicies.filter(
    (p) => p.cycle.computedStatus !== "CANCELADA" && p.cycle.computedStatus !== "TERMINADA"
  );

  const atRiskPolicies = activePolicies.filter(
    (p) =>
      p.cycle.computedStatus === "EN_RIESGO" ||
      p.cycle.computedStatus === "POR_CONFIRMAR" ||
      p.hasReceiptInGrace
  );

  const totalActivePremium = activePolicies.reduce(
    (acc, curr) => acc + (curr.annualPremium || 0),
    0
  );

  const atRiskPremium = atRiskPolicies.reduce(
    (acc, curr) => acc + (curr.annualPremium || 0),
    0
  );

  const avgPoliciesPerClient =
    clientsCount > 0 ? (activePolicies.length / clientsCount).toFixed(1) : "0.0";

  // Filtrar las que cumplen aniversario o renuevan en los próximos X días (0 <= días <= daysFilter)
  const upcomingRenewals = activePolicies
    .filter(
      (p) =>
        p.cycle.daysUntilNextEvent !== null &&
        p.cycle.daysUntilNextEvent >= 0 &&
        p.cycle.daysUntilNextEvent <= daysFilter
    )
    .sort((a, b) => (a.cycle.daysUntilNextEvent ?? 999) - (b.cycle.daysUntilNextEvent ?? 999));

  const userRole = dbUser?.role ?? null;

  return (
    <PremiumGuard userRole={userRole} moduleName="Gestion de Cartera y Renovaciones">
      <div className="flex flex-col gap-6 p-4 md:p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Mi Cartera y Conservación</h1>
            <p className="text-muted-foreground">
              Control de pólizas vigentes, cobranza de recibos, lector PDF con IA y radar de venta cruzada.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <QuickPdfAiPolicyDialog />
            <Link href="/cartera/clientes">
              <Button variant="outline">
                <Users className="mr-2 h-4 w-4" />
                Directorio ({clientsCount})
              </Button>
            </Link>
            <Link href="/cartera/importar">
              <Button>
                <Upload className="mr-2 h-4 w-4" />
                Cargar Layout
              </Button>
            </Link>
          </div>
        </div>

        {/* KPI CARDS */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-gradient-to-br from-primary/10 via-background to-background border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Prima Anualizada Viva</CardTitle>
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
                Suma homologada en MXN de pólizas activas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Pólizas Vigentes</CardTitle>
              <FileText className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">{activePolicies.length}</span>
                {enrichedPolicies.length > activePolicies.length && (
                  <span className="text-xs text-muted-foreground">
                    de {enrichedPolicies.length} registradas
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {activePolicies.filter((p) => p.cycle.isLongTerm).length} Largo Plazo •{" "}
                {activePolicies.filter((p) => !p.cycle.isLongTerm).length} Anuales
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Clientes y Profundización</CardTitle>
              <Users className="h-4 w-4 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">{clientsCount}</span>
                <Badge variant="secondary" className="text-xs font-normal">
                  {avgPoliciesPerClient} pólizas / cliente
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Meta ideal de blindaje: ≥ 2.0 pólizas por cliente
              </p>
            </CardContent>
          </Card>

          <Card className={atRiskPolicies.length > 0 ? "border-amber-500/40 bg-amber-500/5" : ""}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Radar de Conservación</CardTitle>
              {atRiskPolicies.length > 0 ? (
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              ) : (
                <CalendarClock className="h-4 w-4 text-orange-500" />
              )}
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {upcomingRenewals.length}
                </span>
                <span className="text-xs text-muted-foreground">
                  aniversarios en {daysFilter} días
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {atRiskPolicies.length > 0
                  ? `${atRiskPolicies.length} póliza(s) con recibo en gracia (${new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(atRiskPremium)})`
                  : "100% de cartera activa al corriente"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* ETAPA 2: BANDEJA DE COBRANZA Y CONTROL DE RECIBOS */}
        <CobranzaReceiptsClient policies={policies} isAdmin={isAdmin} />

        {/* ETAPA 3: RADAR DE VENTA CRUZADA Y BRECHAS DE BLINDAJE */}
        <CrossSellRadarClient
          clients={clientsWithPolicies}
          adnDiagnostics={adnDiagnostics}
        />

        {/* RADAR DE ANIVERSARIOS Y RENOVACIONES */}
        <div className="mt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-500" />
                Radar de Próximos Aniversarios y Renovaciones Anuales
              </h2>
              <p className="text-xs text-muted-foreground">
                En Vida Individual se monitorea el aniversario anual de la póliza; en GMM, Autos y Daños su renovación de contrato.
              </p>
            </div>
            <div className="flex space-x-1 border rounded-md p-1 bg-muted/20 w-fit">
              {[30, 45, 60, 90].map((d) => (
                <Link key={d} href={`?days=${d}`}>
                  <Badge
                    variant={daysFilter === d ? "default" : "outline"}
                    className="cursor-pointer"
                  >
                    {d} días
                  </Badge>
                </Link>
              ))}
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              {upcomingRenewals.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
                  <Building2 className="w-12 h-12 mb-3 text-muted/30" />
                  <p>
                    No tienes pólizas con aniversario o renovación en los próximos {daysFilter} días.
                  </p>
                  <p className="text-xs mt-1">
                    Prueba ampliando el horizonte a 60 o 90 días con los botones superiores.
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {upcomingRenewals.map((policy) => {
                    const isAnniv = policy.cycle.eventType === "ANIVERSARIO";
                    const daysLeft = policy.cycle.daysUntilNextEvent ?? 0;
                    const cleanPhone = (policy.client?.phone || "").replace(/\D/g, "");
                    const clientName = policy.contractor || policy.client?.name || "Cliente";
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
                                  Aniversario {policy.cycle.policyYear ? `Año ${policy.cycle.policyYear}` : "Anual"}
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
                            Póliza <strong className="text-foreground">{policy.policyNumber}</strong> •{" "}
                            {policy.product || "Producto no especificado"} •{" "}
                            {policy.insuranceCompany || "Aseguradora"} •{" "}
                            {RAMO_LABELS[policy.ramo || "VIDA_INDIVIDUAL"] || policy.ramo}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 self-end md:self-center">
                          <div className="flex flex-col items-end text-right">
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={daysLeft <= 15 ? "destructive" : "secondary"}
                                className="text-xs"
                              >
                                {daysLeft === 0
                                  ? "¡Hoy!"
                                  : daysLeft === 1
                                  ? "Mañana"
                                  : `En ${daysLeft} días`}
                              </Badge>
                              <span className="font-bold text-sm text-orange-600 dark:text-orange-400">
                                {formatDateSafe(policy.cycle.nextEventDate, "dd MMM yyyy")}
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
                              {policy.paymentMethod ? `(${policy.paymentMethod})` : ""}
                            </span>
                          </div>

                          {cleanPhone.length >= 10 && (
                            <a
                              href={`https://wa.me/${cleanPhone.length === 10 ? "52" + cleanPhone : cleanPhone}?text=${encodeURIComponent(waMessage)}`}
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

        {/* FULL POLICIES TABLE (CLIENT COMPONENT) */}
        <div className="mt-4">
          <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-blue-500" />
            Detalle Completo de Pólizas
          </h2>
          <CarteraTableClient
            policies={policies}
            isAdmin={isAdmin}
          />
        </div>
      </div>
    </PremiumGuard>
  );
}
