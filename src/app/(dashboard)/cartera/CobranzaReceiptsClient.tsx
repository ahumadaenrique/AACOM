"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Receipt,
  CheckCircle2,
  AlertTriangle,
  CalendarClock,
  MessageCircle,
  Loader2,
  RotateCcw,
  TrendingUp,
  User,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import {
  computeReceiptLiveStatus,
  formatDateSafe,
  toDateInputValue,
  RAMO_LABELS,
} from "./dateUtils";
import { markReceiptAsPaid, updateReceiptStatus } from "./actions";

export default function CobranzaReceiptsClient({
  policies,
  isAdmin,
}: {
  policies: any[];
  isAdmin: boolean;
}) {
  const [activeTab, setActiveTab] = useState<"GRACIA" | "PROXIMOS" | "PAGADOS">("GRACIA");
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);
  const [paidDate, setPaidDate] = useState<string>(() => toDateInputValue(new Date()));
  const [paymentNotes, setPaymentNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [revertingId, setRevertingId] = useState<string | null>(null);

  const router = useRouter();
  const { toast } = useToast();

  // Aplanar todos los recibos de las pólizas activas con su estado en vivo
  const allReceipts = useMemo(() => {
    const list: any[] = [];
    for (const policy of policies) {
      if (policy.isArchived || policy.status === "CANCELADA" || policy.status === "TERMINADA") {
        continue;
      }
      const receipts = policy.receipts || [];
      for (const r of receipts) {
        const live = computeReceiptLiveStatus(r);
        list.push({
          ...r,
          policy,
          live,
        });
      }
    }
    return list;
  }, [policies]);

  const graceAndConfirmReceipts = useMemo(
    () =>
      allReceipts
        .filter(
          (r) => r.live.liveStatus === "EN_GRACIA" || r.live.liveStatus === "POR_CONFIRMAR"
        )
        .sort((a, b) => b.live.daysSinceDue - a.live.daysSinceDue),
    [allReceipts]
  );

  const upcomingReceipts = useMemo(
    () =>
      allReceipts
        .filter((r) => r.live.liveStatus === "PROXIMO")
        .sort((a, b) => a.live.daysUntilDue - b.live.daysUntilDue),
    [allReceipts]
  );

  const paidReceipts = useMemo(
    () =>
      allReceipts
        .filter((r) => r.live.liveStatus === "PAGADO")
        .sort((a, b) => {
          const tA = a.paidAt ? new Date(a.paidAt).getTime() : 0;
          const tB = b.paidAt ? new Date(b.paidAt).getTime() : 0;
          return tB - tA;
        })
        .slice(0, 30),
    [allReceipts]
  );

  // Si no hay recibos en gracia pero sí próximos, mostrar primero la pestaña de próximos al cargar
  const currentList =
    activeTab === "GRACIA"
      ? graceAndConfirmReceipts
      : activeTab === "PROXIMOS"
      ? upcomingReceipts
      : paidReceipts;

  const totalGraceAmount = graceAndConfirmReceipts.reduce(
    (acc, r) => acc + (r.amount || 0),
    0
  );

  const totalUpcomingAmount = upcomingReceipts.reduce(
    (acc, r) => acc + (r.amount || 0),
    0
  );

  const openPayDialog = (receipt: any) => {
    setSelectedReceipt(receipt);
    setPaidDate(toDateInputValue(new Date()));
    setPaymentNotes("");
  };

  const handleConfirmPayment = async () => {
    if (!selectedReceipt) return;
    setIsSubmitting(true);
    try {
      const res = await markReceiptAsPaid({
        receiptId: selectedReceipt.id,
        paidDate,
        paymentNotes,
      });

      toast({
        title: "✅ Recibo registrado como Pagado",
        description: res.syncedToProduction
          ? "La prima pagada se sincronizó automáticamente con el módulo de Producción."
          : "El estado de conservación de la póliza está al corriente.",
      });
      setSelectedReceipt(null);
      router.refresh();
    } catch (e: any) {
      toast({
        title: "Error al registrar pago",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevertPayment = async (receiptId: string) => {
    setRevertingId(receiptId);
    try {
      await updateReceiptStatus({
        receiptId,
        status: "PENDIENTE",
      });
      toast({
        title: "Pago revertido",
        description: "El recibo volvió a estado pendiente.",
      });
      router.refresh();
    } catch (e: any) {
      toast({
        title: "Error al revertir",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setRevertingId(null);
    }
  };

  return (
    <Card className="border-indigo-500/20 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <Receipt className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Bandeja de Cobranza y Control de Recibos
            </CardTitle>
            <CardDescription>
              Seguimiento de recibos fraccionados (mensuales, trimestrales, semestrales y anuales), control de los 30 días de periodo de gracia y sincronización automática con Producción.
            </CardDescription>
          </div>

          <div className="flex flex-wrap gap-1.5 bg-muted/40 p-1 rounded-lg border w-fit">
            <Button
              size="sm"
              variant={activeTab === "GRACIA" ? "default" : "ghost"}
              onClick={() => setActiveTab("GRACIA")}
              className="text-xs h-8 gap-1.5"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              En Gracia / Confirmar
              <Badge
                variant={activeTab === "GRACIA" ? "secondary" : "outline"}
                className="ml-1 px-1.5 py-0 text-[10px]"
              >
                {graceAndConfirmReceipts.length}
              </Badge>
            </Button>

            <Button
              size="sm"
              variant={activeTab === "PROXIMOS" ? "default" : "ghost"}
              onClick={() => setActiveTab("PROXIMOS")}
              className="text-xs h-8 gap-1.5"
            >
              <CalendarClock className="w-3.5 h-3.5 text-blue-500" />
              Próximos 30 días
              <Badge
                variant={activeTab === "PROXIMOS" ? "secondary" : "outline"}
                className="ml-1 px-1.5 py-0 text-[10px]"
              >
                {upcomingReceipts.length}
              </Badge>
            </Button>

            <Button
              size="sm"
              variant={activeTab === "PAGADOS" ? "default" : "ghost"}
              onClick={() => setActiveTab("PAGADOS")}
              className="text-xs h-8 gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              Pagados
              <Badge
                variant={activeTab === "PAGADOS" ? "secondary" : "outline"}
                className="ml-1 px-1.5 py-0 text-[10px]"
              >
                {paidReceipts.length}
              </Badge>
            </Button>
          </div>
        </div>

        {/* Resumen monetario rápido de la pestaña */}
        <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-muted-foreground">
          <span>
            En Periodo de Gracia / Por Confirmar:{" "}
            <strong className="text-amber-600 dark:text-amber-400">
              {new Intl.NumberFormat("es-MX", {
                style: "currency",
                currency: "MXN",
              }).format(totalGraceAmount)}
            </strong>
          </span>
          <span>•</span>
          <span>
            Por cobrar en próximos 30 días:{" "}
            <strong className="text-blue-600 dark:text-blue-400">
              {new Intl.NumberFormat("es-MX", {
                style: "currency",
                currency: "MXN",
              }).format(totalUpcomingAmount)}
            </strong>
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-0 border-t">
        {currentList.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
            <CheckCircle2 className="w-10 h-10 mb-2 text-emerald-500/40" />
            {activeTab === "GRACIA" && (
              <p className="text-sm">
                ¡Excelente! No tienes recibos vencidos ni en periodo de gracia pendientes de pago.
              </p>
            )}
            {activeTab === "PROXIMOS" && (
              <p className="text-sm">
                No hay recibos programados para vencer en los próximos 30 días.
              </p>
            )}
            {activeTab === "PAGADOS" && (
              <p className="text-sm">Aún no hay recibos marcados como pagados.</p>
            )}
          </div>
        ) : (
          <div className="divide-y max-h-[420px] overflow-y-auto">
            {currentList.map((r) => {
              const policy = r.policy;
              const clientName =
                policy.contractor || policy.client?.name || "Cliente";
              const cleanPhone = (policy.client?.phone || "").replace(/\D/g, "");
              const dueFormatted = formatDateSafe(r.dueDate, "dd 'de' MMM yyyy");
              const graceFormatted = formatDateSafe(
                r.graceEndDate,
                "dd 'de' MMM yyyy"
              );
              const amountFormatted = new Intl.NumberFormat("es-MX", {
                style: "currency",
                currency: "MXN",
              }).format(r.amount || 0);

              const waText =
                r.live.liveStatus === "EN_GRACIA" ||
                r.live.liveStatus === "POR_CONFIRMAR"
                  ? `Hola ${clientName}, espero que estés muy bien. Te escribo para recordarte que el recibo ${r.receiptNumber}/${r.totalInstallments} de tu póliza ${policy.policyNumber} (${policy.product || policy.insuranceCompany || ""}) por ${amountFormatted} inició vigencia el ${dueFormatted} y se encuentra dentro de su periodo de gracia (fecha límite: ${graceFormatted}). ¿Me confirmas si ya quedó aplicado o si te apoyo con tu línea de pago para mantener tu cobertura intacta?`
                  : `Hola ${clientName}, te saludo con gusto. Te recuerdo que el próximo ${dueFormatted} corresponde el pago del recibo ${r.receiptNumber}/${r.totalInstallments} de tu póliza ${policy.policyNumber} (${policy.product || policy.insuranceCompany || ""}) por ${amountFormatted}. Quedo atento por si necesitas tu ficha o cargo domiciliado.`;

              const isComputable =
                r.policyYear <= 1 ||
                ["GMM", "AUTOS", "VIDA_GRUPO", "DANOS"].includes(
                  (policy.ramo || "").toUpperCase()
                );

              return (
                <div
                  key={r.id}
                  className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 hover:bg-muted/40 transition-colors gap-3"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={
                          policy.clientId
                            ? `/cartera/clientes/${policy.clientId}`
                            : "/cartera/clientes"
                        }
                        className="font-semibold text-sm hover:underline text-primary"
                      >
                        {clientName}
                      </Link>
                      <Badge variant="outline" className="text-[11px] font-mono">
                        Recibo {r.receiptNumber}/{r.totalInstallments} • Año Póliza{" "}
                        {r.policyYear}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`text-[11px] ${r.live.badgeClass}`}
                      >
                        {r.live.label}
                      </Badge>
                      {isComputable && r.live.liveStatus !== "PAGADO" && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] gap-1 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300"
                          title="Al marcar como pagado suma automáticamente a tu meta de Producción"
                        >
                          <TrendingUp className="w-3 h-3" />
                          Computa a Producción
                        </Badge>
                      )}
                      {r.syncedEmissionId && r.live.liveStatus === "PAGADO" && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] gap-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                        >
                          <TrendingUp className="w-3 h-3" />
                          Sincronizado en Producción
                        </Badge>
                      )}
                      {isAdmin && policy.user?.name && (
                        <Badge
                          variant="outline"
                          className="text-[10px] font-normal gap-1 text-muted-foreground"
                        >
                          <User className="w-3 h-3 text-indigo-500" />
                          {policy.user.name}
                        </Badge>
                      )}
                    </div>

                    <span className="text-xs text-muted-foreground">
                      Póliza <strong className="text-foreground">{policy.policyNumber}</strong> •{" "}
                      {policy.product || "Plan"} ({policy.insuranceCompany}) •{" "}
                      {RAMO_LABELS[policy.ramo || "VIDA_INDIVIDUAL"] || policy.ramo} •{" "}
                      Exigible: <strong>{formatDateSafe(r.dueDate, "dd/MM/yyyy")}</strong>{" "}
                      (Límite Gracia:{" "}
                      <strong>{formatDateSafe(r.graceEndDate, "dd/MM/yyyy")}</strong>)
                    </span>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    <div className="text-right mr-2">
                      <div className="font-bold text-sm">{amountFormatted}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {policy.paymentMethod || "Anual"}
                      </div>
                    </div>

                    {cleanPhone.length >= 10 && r.live.liveStatus !== "PAGADO" && (
                      <a
                        href={`https://wa.me/${
                          cleanPhone.length === 10 ? "52" + cleanPhone : cleanPhone
                        }?text=${encodeURIComponent(waText)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs border-emerald-500/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10"
                        >
                          <MessageCircle className="w-3.5 h-3.5 mr-1" />
                          WhatsApp
                        </Button>
                      </a>
                    )}

                    {r.live.liveStatus !== "PAGADO" ? (
                      <Button
                        size="sm"
                        onClick={() => openPayDialog(r)}
                        className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        Marcar Pagado
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={revertingId === r.id}
                        onClick={() => handleRevertPayment(r.id)}
                        className="h-8 text-xs text-muted-foreground hover:text-foreground"
                        title="Revertir a pendiente"
                      >
                        {revertingId === r.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <>
                            <RotateCcw className="w-3.5 h-3.5 mr-1" />
                            Deshacer
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      {/* Modal para confirmar fecha contable de pago */}
      <Dialog
        open={!!selectedReceipt}
        onOpenChange={(val) => !val && setSelectedReceipt(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Registrar Pago de Recibo {selectedReceipt?.receiptNumber}/
              {selectedReceipt?.totalInstallments}
            </DialogTitle>
            <DialogDescription>
              Póliza <strong>{selectedReceipt?.policy?.policyNumber}</strong> de{" "}
              <strong>
                {selectedReceipt?.policy?.contractor ||
                  selectedReceipt?.policy?.client?.name}
              </strong>{" "}
              por{" "}
              <strong>
                {new Intl.NumberFormat("es-MX", {
                  style: "currency",
                  currency: "MXN",
                }).format(selectedReceipt?.amount || 0)}
              </strong>
              .
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Fecha de Aplicación / Pago Contable</Label>
              <Input
                type="date"
                value={paidDate}
                onChange={(e) => setPaidDate(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">
                Si este recibo corresponde a Primer Año (Vida) o a GMM/Autos/Grupo, se sumará automáticamente a tu Producción del mes seleccionado.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>Referencia o Nota de Pago (Opcional)</Label>
              <Input
                placeholder="Ej. Cargo automático tarjeta terminación 4421"
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setSelectedReceipt(null)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmPayment}
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-2" />
              )}
              Confirmar Pago
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
