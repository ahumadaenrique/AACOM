import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  Calendar,
  FileCheck2,
  MessageCircle,
  StickyNote,
} from "lucide-react";
import Link from "next/link";
import PolicyUpload from "./PolicyUpload";
import ClientFormDialog from "./ClientFormDialog";
import PolicyFormDialog from "./PolicyFormDialog";
import PolicyActions from "./PolicyActions";
import {
  computePolicyCycleInfo,
  formatDateSafe,
  RAMO_LABELS,
  STATUS_CONFIG,
  SUB_STATUS_LABELS,
} from "../../dateUtils";
import { ensurePoliciesHaveReceipts } from "../../actions";

export const dynamic = "force-dynamic";

export default async function ClienteDetalle({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, agencyId: true },
  });
  const isAdmin =
    currentUser?.role === "ADMIN" || currentUser?.role === "SUPER_ADMIN";
  const effectiveAgencyId = (session.user.agencyId ||
    currentUser?.agencyId ||
    "aacom") as string;

  let client = await prisma.client.findFirst({
    where: isAdmin
      ? { id: params.id, agencyId: effectiveAgencyId, isArchived: false }
      : { id: params.id, userId: session.user.id, isArchived: false },
    include: {
      policies: {
        where: { isArchived: false },
        include: {
          receipts: {
            orderBy: [{ policyYear: "asc" }, { receiptNumber: "asc" }],
          },
        },
        orderBy: { effectiveDate: "desc" },
      },
      user: { select: { name: true } },
    },
  });

  if (!client) {
    notFound();
  }

  // Asegurar que las pólizas activas del cliente tengan sus recibos generados
  const generated = await ensurePoliciesHaveReceipts(client.policies);
  if (generated) {
    const refreshed = await prisma.client.findFirst({
      where: { id: client.id },
      include: {
        policies: {
          where: { isArchived: false },
          include: {
            receipts: {
              orderBy: [{ policyYear: "asc" }, { receiptNumber: "asc" }],
            },
          },
          orderBy: { effectiveDate: "desc" },
        },
        user: { select: { name: true } },
      },
    });
    if (refreshed) client = refreshed;
  }

  const enrichedPolicies = client.policies.map((p) => ({
    ...p,
    cycle: computePolicyCycleInfo(p),
  }));

  const activePolicies = enrichedPolicies.filter(
    (p) =>
      p.cycle.computedStatus !== "CANCELADA" &&
      p.cycle.computedStatus !== "TERMINADA"
  );

  const totalPremium = activePolicies.reduce(
    (acc, p) => acc + (p.annualPremium || 0),
    0
  );

  const cleanPhone = (client.phone || "").replace(/\D/g, "");

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/cartera/clientes">
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{client.name}</h1>
            <p className="text-muted-foreground">
              Expediente de cliente, recibos y blindaje patrimonial contratado.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {cleanPhone.length >= 10 && (
            <a
              href={`https://wa.me/${cleanPhone.length === 10 ? "52" + cleanPhone : cleanPhone}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                variant="outline"
                className="border-emerald-500/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                WhatsApp
              </Button>
            </a>
          )}
          <ClientFormDialog client={client} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Información Personal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="break-all">{client.email || "Sin correo registrado"}</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
              <span>{client.phone || "Sin teléfono registrado"}</span>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
              <span>
                {client.birthDate
                  ? formatDateSafe(client.birthDate, "dd 'de' MMMM 'de' yyyy")
                  : "Fecha de nacimiento no registrada"}
              </span>
            </div>
            {client.rfc && (
              <div className="flex items-center gap-3">
                <FileCheck2 className="w-4 h-4 text-muted-foreground shrink-0" />
                <span>
                  RFC: <strong className="font-mono">{client.rfc}</strong>
                </span>
              </div>
            )}
            {client.notes && (
              <div className="flex items-start gap-3 pt-2 border-t">
                <StickyNote className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span className="text-xs text-muted-foreground">{client.notes}</span>
              </div>
            )}
            {isAdmin && (
              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border">
                <User className="w-4 h-4 text-primary shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground">Agente Asignado</div>
                  <div className="font-medium text-sm">
                    {client.user?.name || "Desconocido"}
                  </div>
                </div>
              </div>
            )}
            <hr className="my-4" />
            <div className="pt-1">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Prima Anual Activa del Cliente
              </div>
              <div className="text-2xl font-bold text-primary">
                {new Intl.NumberFormat("es-MX", {
                  style: "currency",
                  currency: "MXN",
                }).format(totalPremium)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {activePolicies.length} póliza(s) vigente(s)
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">
                Pólizas Contratadas ({enrichedPolicies.length})
              </CardTitle>
              <CardDescription>
                Detalle de coberturas, recibos, aniversarios, documentos y estatus de conservación.
              </CardDescription>
            </div>
            <PolicyFormDialog clientId={client.id} />
          </CardHeader>
          <CardContent className="p-0">
            {enrichedPolicies.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <p>El cliente no cuenta con pólizas activas registradas.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Póliza</TableHead>
                      <TableHead>Producto / Ramo</TableHead>
                      <TableHead>Estatus</TableHead>
                      <TableHead>Vigencia y Ciclo</TableHead>
                      <TableHead className="text-right">Prima Anual</TableHead>
                      <TableHead className="text-center">Carátula PDF</TableHead>
                      <TableHead className="text-center">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enrichedPolicies.map((policy) => {
                      const statusCfg =
                        STATUS_CONFIG[policy.cycle.computedStatus] ||
                        STATUS_CONFIG.VIGENTE;
                      const isAnniv = policy.cycle.eventType === "ANIVERSARIO";

                      return (
                        <TableRow key={policy.id}>
                          <TableCell className="font-medium text-xs">
                            <div className="font-semibold text-foreground">
                              {policy.policyNumber}
                            </div>
                            <div className="text-muted-foreground mt-0.5">
                              {policy.insuranceCompany}
                            </div>
                            {policy.paymentMethod && (
                              <div className="text-[10px] text-muted-foreground">
                                {policy.paymentMethod}
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
                                className={`text-[11px] ${statusCfg.badgeClass}`}
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
                            <div>
                              <span className="text-muted-foreground">Inicio: </span>
                              {formatDateSafe(policy.effectiveDate, "dd/MM/yyyy")}
                            </div>
                            {policy.cycle.nextEventDate && (
                              <div className="text-orange-600 dark:text-orange-400 font-medium mt-0.5">
                                {isAnniv
                                  ? `Aniv. Año ${policy.cycle.policyYear || ""}: `
                                  : "Renueva: "}
                                {formatDateSafe(
                                  policy.cycle.nextEventDate,
                                  "dd/MM/yyyy"
                                )}
                              </div>
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
                                  {policy.originalPremium} {policy.currency}
                                </div>
                              )}
                          </TableCell>

                          <TableCell className="text-center">
                            <PolicyUpload policy={policy} />
                          </TableCell>

                          <TableCell className="text-center">
                            <PolicyActions
                              policy={policy}
                              clientId={client.id}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
