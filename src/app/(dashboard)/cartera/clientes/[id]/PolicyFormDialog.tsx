"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { policySchema, PolicyFormValues } from "../../schema";
import { createPolicy, updatePolicy } from "../../actions";
import {
  toDateInputValue,
  RAMO_LABELS,
  STATUS_CONFIG,
  SUB_STATUS_LABELS,
  COMMON_INSURERS,
  PAYMENT_METHODS,
} from "../../dateUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { FileText, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PolicyFormDialog({
  clientId,
  policy,
  triggerButton,
}: {
  clientId: string;
  policy?: any;
  triggerButton?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const isEditing = !!policy;

  const getInitialValues = (): PolicyFormValues => ({
    clientId: clientId || policy?.clientId || "",
    policyNumber: policy?.policyNumber || "",
    contractor: policy?.contractor || "",
    insured: policy?.insured || "",
    product: policy?.product || "",
    insuranceCompany: policy?.insuranceCompany || "Insignia Life",
    ramo: policy?.ramo || "VIDA_INDIVIDUAL",
    tipoVigencia: policy?.tipoVigencia || "LARGO_PLAZO",
    currency: policy?.currency || "MXN",
    originalPremium: policy?.originalPremium ?? undefined,
    status: policy?.status || "VIGENTE",
    subStatus: policy?.subStatus || "",
    annualPremium: policy?.annualPremium || 0,
    paymentMethod: policy?.paymentMethod || "Anual",
    effectiveDate: toDateInputValue(policy?.effectiveDate),
    renewalDate: toDateInputValue(policy?.renewalDate),
    approximateCommission: policy?.approximateCommission || 0,
    approximateBonus: policy?.approximateBonus || 0,
    observations: policy?.observations || "",
  });

  const form = useForm<PolicyFormValues>({
    resolver: zodResolver(policySchema),
    defaultValues: getInitialValues(),
  });

  // Asegurar que al abrir el modal de edición siempre se carguen las fechas y valores exactos (corrige BUG-04)
  useEffect(() => {
    if (open) {
      form.reset(getInitialValues());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, policy]);

  const watchedRamo = form.watch("ramo");
  const watchedCurrency = form.watch("currency");
  const watchedTipoVigencia = form.watch("tipoVigencia");

  const handleRamoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRamo = e.target.value;
    form.setValue("ramo", newRamo);
    if (["GMM", "AUTOS", "VIDA_GRUPO", "DANOS"].includes(newRamo)) {
      form.setValue("tipoVigencia", "ANUAL_RENOVABLE");
    } else {
      form.setValue("tipoVigencia", "LARGO_PLAZO");
    }
  };

  const onSubmit = async (data: PolicyFormValues) => {
    try {
      if (isEditing) {
        await updatePolicy(policy.id, data);
        toast({ title: "Póliza actualizada correctamente" });
      } else {
        await createPolicy(data);
        toast({ title: "Póliza creada correctamente" });
      }

      setOpen(false);
      router.refresh();
      if (!isEditing) form.reset(getInitialValues());
    } catch (err: any) {
      toast({
        title: "Error al guardar póliza",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const selectClassName =
    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button size="sm">
            <FileText className="w-4 h-4 mr-2" />
            Agregar Póliza
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? `Editar Póliza ${policy.policyNumber}` : "Agregar Nueva Póliza"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Número de Póliza *</Label>
            <Input {...form.register("policyNumber")} placeholder="Ej. 308299" />
            {form.formState.errors.policyNumber && (
              <p className="text-xs text-red-500">
                {form.formState.errors.policyNumber.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Aseguradora *</Label>
            <Input
              list="insurers-datalist"
              {...form.register("insuranceCompany")}
              placeholder="Selecciona o escribe aseguradora"
            />
            <datalist id="insurers-datalist">
              {COMMON_INSURERS.map((ins) => (
                <option key={ins} value={ins} />
              ))}
            </datalist>
          </div>

          <div className="space-y-1.5">
            <Label>Ramo *</Label>
            <select
              className={selectClassName}
              value={watchedRamo || "VIDA_INDIVIDUAL"}
              onChange={handleRamoChange}
            >
              {Object.entries(RAMO_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label>Tipo de Vigencia</Label>
            <select
              className={selectClassName}
              {...form.register("tipoVigencia")}
            >
              <option value="LARGO_PLAZO">
                Largo Plazo / Vitalicia (Aniversario Anual)
              </option>
              <option value="ANUAL_RENOVABLE">
                Anual Renovable (Renovación de Contrato)
              </option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label>Producto / Plan</Label>
            <Input
              {...form.register("product")}
              placeholder="Ej. Temporal 20, Orvi 99, VPL, Alfa Medical..."
            />
          </div>

          <div className="space-y-1.5">
            <Label>Forma de Pago</Label>
            <select
              className={selectClassName}
              {...form.register("paymentMethod")}
            >
              <option value="">Seleccionar...</option>
              {PAYMENT_METHODS.map((pm) => (
                <option key={pm} value={pm}>
                  {pm}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label>Contratante</Label>
            <Input {...form.register("contractor")} placeholder="Nombre del contratante" />
          </div>

          <div className="space-y-1.5">
            <Label>Asegurado Titular</Label>
            <Input {...form.register("insured")} placeholder="Nombre del asegurado" />
          </div>

          <div className="space-y-1.5">
            <Label>Inicio de Vigencia (Emisión)</Label>
            <Input
              type="date"
              {...form.register("effectiveDate")}
            />
          </div>

          <div className="space-y-1.5">
            <Label>
              {watchedTipoVigencia === "LARGO_PLAZO"
                ? "Próximo Aniversario / Fin de Plazo"
                : "Fecha de Renovación Anual"}
            </Label>
            <Input
              type="date"
              {...form.register("renewalDate")}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Moneda de Póliza</Label>
            <select className={selectClassName} {...form.register("currency")}>
              <option value="MXN">MXN (Pesos Mexicanos)</option>
              <option value="UDI">UDI (Unidades de Inversión)</option>
              <option value="USD">USD (Dólares)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label>Prima Anualizada en MXN *</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              {...form.register("annualPremium")}
            />
            {form.formState.errors.annualPremium && (
              <p className="text-xs text-red-500">
                {form.formState.errors.annualPremium.message}
              </p>
            )}
          </div>

          {watchedCurrency && watchedCurrency !== "MXN" && (
            <div className="space-y-1.5 md:col-span-2">
              <Label>Prima en Moneda Original ({watchedCurrency}) — Opcional</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder={`Monto en ${watchedCurrency} (ej. 3,500 ${watchedCurrency})`}
                {...form.register("originalPremium")}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Estatus de Conservación</Label>
            <select className={selectClassName} {...form.register("status")}>
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>
                  {cfg.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label>Sub-estatus Técnico (Opcional)</Label>
            <select className={selectClassName} {...form.register("subStatus")}>
              <option value="">Ninguno (Normal)</option>
              {Object.entries(SUB_STATUS_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <Label>Observaciones / Notas de Póliza</Label>
            <Input
              {...form.register("observations")}
              placeholder="Ej. Domiciliada a tarjeta BBVA, beneficiario hijo..."
            />
          </div>

          <div className="md:col-span-2 pt-2">
            <Button
              type="submit"
              className="w-full"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              {isEditing ? "Guardar Cambios" : "Crear Póliza"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
