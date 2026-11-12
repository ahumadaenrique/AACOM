"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Receipt, CheckCircle2, RotateCcw, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import {
  computeReceiptLiveStatus,
  formatDateSafe,
  toDateInputValue,
} from "../../dateUtils";
import { markReceiptAsPaid, updateReceiptStatus } from "../../actions";

export default function PolicyReceiptsDialog({ policy }: { policy: any }) {
  const [open, setOpen] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [paidDate, setPaidDate] = useState<string>(() => toDateInputValue(new Date()));
  const [paidAmounts, setPaidAmounts] = useState<Record<string, string>>({});
  const router = useRouter();
  const { toast } = useToast();

  const receipts = policy?.receipts || [];

  const handleMarkPaid = async (receipt: any) => {
    setLoadingId(receipt.id);
    try {
      const rawAmount = paidAmounts[receipt.id];
      const parsedAmount =
        rawAmount !== undefined && rawAmount !== ""
          ? Number(rawAmount)
          : Number(receipt.paidAmount ?? receipt.amount ?? 0);

      const res = await markReceiptAsPaid({
        receiptId: receipt.id,
        paidDate: paidDate || toDateInputValue(new Date()),
        paidAmount:
          Number.isFinite(parsedAmount) && parsedAmount >= 0
            ? parsedAmount
            : undefined,
      });
      toast({
        title: "Recibo marcado como pagado",
        description: res.syncedToProduction
          ? "Prima pagada (MXN) reflejada automáticamente en Producción y Ranking."
          : "Recibo actualizado.",
      });
      router.refresh();
    } catch (e: any) {
      toast({
        title: "Error al actualizar recibo",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setLoadingId(null);
    }
  };

  const handleRevert = async (receiptId: string) => {
    setLoadingId(receiptId);
    try {
      await updateReceiptStatus({
        receiptId,
        status: "PENDIENTE",
      });
      toast({ title: "Recibo marcado como pendiente" });
      router.refresh();
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-indigo-600 hover:text-indigo-700"
          title="Ver calendario de recibos y cobranza"
        >
          <Receipt className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-indigo-600" />
            Recibos de la Póliza {policy.policyNumber}
          </DialogTitle>
          <DialogDescription>
            {policy.contractor || policy.client?.name} • {policy.product} (
            {policy.insuranceCompany}) • Forma de Pago:{" "}
            <strong>{policy.paymentMethod || "Anual"}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-md border bg-muted/30 text-xs">
          <span className="text-muted-foreground">
            Fecha de pago que se registrará al marcar un recibo como pagado:
          </span>
          <input
            type="date"
            value={paidDate}
            onChange={(e) => setPaidDate(e.target.value)}
            className="h-8 rounded border border-input bg-background px-2.5 text-xs"
          />
        </div>

        {receipts.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground text-sm">
            Esta póliza no tiene recibos activos generados.
          </div>
        ) : (
          <div className="border rounded-md overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Recibo</TableHead>
                  <TableHead>Año Póliza</TableHead>
                  <TableHead>Fecha de pago</TableHead>
                  <TableHead>Fecha límite (Gracia)</TableHead>
                  <TableHead>Estatus</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead className="text-center">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receipts.map((r: any) => {
                  const live = computeReceiptLiveStatus(r);
                  const isPaid = live.liveStatus === "PAGADO";

                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs font-semibold">
                        {r.receiptNumber} de {r.totalInstallments}
                      </TableCell>
                      <TableCell className="text-xs">Año {r.policyYear}</TableCell>
                      <TableCell className="text-xs whitespace-nowrap">
                        {formatDateSafe(r.dueDate, "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap">
                        {formatDateSafe(r.graceEndDate, "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-[11px] ${live.badgeClass}`}
                        >
                          {live.label}
                        </Badge>
                        {isPaid && r.paidAt && (
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            Pagado: {formatDateSafe(r.paidAt, "dd/MM/yyyy")}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium text-xs whitespace-nowrap">
                        {!isPaid ? (
                          <div className="flex items-center justify-end gap-1">
                            <span className="text-[10px] text-muted-foreground">$</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={
                                paidAmounts[r.id] !== undefined
                                  ? paidAmounts[r.id]
                                  : String(Number((r.paidAmount ?? r.amount ?? 0).toFixed(2)))
                              }
                              onChange={(e) =>
                                setPaidAmounts((prev) => ({
                                  ...prev,
                                  [r.id]: e.target.value,
                                }))
                              }
                              title="Monto real pagado en MXN (editable por UDI/USD)"
                              className="h-7 w-24 rounded border border-input bg-background px-2 text-right text-xs"
                            />
                          </div>
                        ) : (
                          <div>
                            {new Intl.NumberFormat("es-MX", {
                              style: "currency",
                              currency: "MXN",
                            }).format(r.paidAmount ?? r.amount ?? 0)}
                            {r.paidAmount != null &&
                              Math.abs(r.paidAmount - (r.amount || 0)) > 0.01 && (
                                <div className="text-[10px] text-muted-foreground">
                                  Est.:{" "}
                                  {new Intl.NumberFormat("es-MX", {
                                    style: "currency",
                                    currency: "MXN",
                                  }).format(r.amount || 0)}
                                </div>
                              )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {!isPaid ? (
                          <Button
                            size="sm"
                            disabled={loadingId === r.id}
                            onClick={() => handleMarkPaid(r)}
                            className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            {loadingId === r.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                                Pagado
                              </>
                            )}
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={loadingId === r.id}
                            onClick={() => handleRevert(r.id)}
                            className="h-7 text-xs text-muted-foreground"
                          >
                            {loadingId === r.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <>
                                <RotateCcw className="w-3 h-3 mr-1" />
                                Deshacer
                              </>
                            )}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
