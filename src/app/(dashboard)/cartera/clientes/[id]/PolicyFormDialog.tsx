"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { policySchema, PolicyFormValues } from "../../schema";
import {
  createPolicy,
  updatePolicy,
  extractPolicyFromPdfAction,
} from "../../actions";
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
import {
  FileText,
  Loader2,
  Sparkles,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Settings2,
} from "lucide-react";
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
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isExtractingPdf, setIsExtractingPdf] = useState(false);
  const [extractedFileName, setExtractedFileName] = useState<string | null>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

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
    pdfUrl: policy?.pdfUrl || null,
  });

  const form = useForm<PolicyFormValues>({
    resolver: zodResolver(policySchema),
    defaultValues: getInitialValues(),
  });

  useEffect(() => {
    if (open) {
      form.reset(getInitialValues());
      setExtractedFileName(null);
      setShowAdvanced(
        isEditing &&
          (policy?.currency !== "MXN" ||
            Boolean(policy?.subStatus) ||
            Boolean(policy?.observations))
      );
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

  const handlePdfAiUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast({
        title: "Archivo inválido",
        description: "Selecciona un archivo PDF de carátula de póliza.",
        variant: "destructive",
      });
      return;
    }

    setIsExtractingPdf(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/cartera/extract-pdf", {
        method: "POST",
        body: formData,
      });
      const res = await response.json().catch(() => null);

      if (!response.ok || !res || res.error || !res.extracted) {
        throw new Error(
          res?.error ||
            (response.status === 413
              ? "El archivo PDF supera el límite permitido (4.5 MB)."
              : "No se pudo leer la carátula PDF.")
        );
      }

      const ext = res.extracted;
      if (ext.policyNumber) form.setValue("policyNumber", ext.policyNumber);
      if (ext.insuranceCompany) form.setValue("insuranceCompany", ext.insuranceCompany);
      if (ext.product) form.setValue("product", ext.product);
      if (ext.ramo) form.setValue("ramo", ext.ramo);
      if (ext.tipoVigencia) form.setValue("tipoVigencia", ext.tipoVigencia);
      if (ext.contractor) form.setValue("contractor", ext.contractor);
      if (ext.insured) form.setValue("insured", ext.insured);
      if (ext.effectiveDate) form.setValue("effectiveDate", ext.effectiveDate);
      if (ext.renewalDate) form.setValue("renewalDate", ext.renewalDate);
      if (ext.paymentMethod) form.setValue("paymentMethod", ext.paymentMethod);
      if (ext.currency) form.setValue("currency", ext.currency);
      if (ext.annualPremium > 0) form.setValue("annualPremium", ext.annualPremium);
      if (ext.originalPremium) form.setValue("originalPremium", ext.originalPremium);
      if (ext.observations) form.setValue("observations", ext.observations);
      if (res.pdfUrl) form.setValue("pdfUrl", res.pdfUrl);

      if (ext.currency && ext.currency !== "MXN") {
        setShowAdvanced(true);
      }

      setExtractedFileName(file.name);
      toast({
        title: "✨ Carátula leída con IA exitosamente",
        description: `Se autocompletaron los datos de la póliza ${ext.policyNumber || ""}${
          res.pdfUrl ? " y se adjuntó el PDF." : "."
        }`,
      });
    } catch (err: any) {
      toast({
        title: "Error al analizar PDF con IA",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsExtractingPdf(false);
      if (pdfInputRef.current) pdfInputRef.current.value = "";
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

        {/* Lector Inteligente de Carátula PDF con Gemini */}
        <div className="p-3 rounded-lg border border-indigo-500/30 bg-indigo-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              Autocompletar subiendo la Carátula PDF (Opcional)
            </div>
            <p className="text-[11px] text-muted-foreground">
              {extractedFileName ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Datos extraídos de: {extractedFileName}
                </span>
              ) : (
                "Sube el PDF de la póliza y llenaremos los campos automáticamente."
              )}
            </p>
          </div>
          <div>
            <input
              ref={pdfInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handlePdfAiUpload}
            />
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={isExtractingPdf}
              onClick={() => pdfInputRef.current?.click()}
              className="w-full sm:w-auto border border-indigo-500/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-500/15"
            >
              {isExtractingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Leyendo PDF...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                  Leer Carátula PDF
                </>
              )}
            </Button>
          </div>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-3.5 md:grid-cols-2">
          {/* 7 CAMPOS ESENCIALES */}
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
            <Label>Producto / Plan</Label>
            <Input
              {...form.register("product")}
              placeholder="Ej. Temporal 20, Orvi 99, Alfa Medical..."
            />
          </div>

          <div className="space-y-1.5">
            <Label>Inicio de Vigencia</Label>
            <Input type="date" {...form.register("effectiveDate")} />
          </div>

          <div className="space-y-1.5">
            <Label>Forma de Pago</Label>
            <select
              className={selectClassName}
              {...form.register("paymentMethod")}
            >
              {PAYMENT_METHODS.map((pm) => (
                <option key={pm} value={pm}>
                  {pm}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <Label>Prima Anual en Pesos (MXN) *</Label>
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

          {/* BOTÓN DE REVELACIÓN PROGRESIVA */}
          <div className="md:col-span-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <Settings2 className="w-3.5 h-3.5" />
              {showAdvanced
                ? "Ocultar opciones avanzadas"
                : "Opciones avanzadas (Moneda UDI/USD, Asegurado distinto, Estatus, Notas)"}
              {showAdvanced ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {showAdvanced && (
            <div className="md:col-span-2 grid gap-3.5 md:grid-cols-2 p-3.5 rounded-lg border bg-muted/20">
              <div className="space-y-1.5">
                <Label>Contratante</Label>
                <Input {...form.register("contractor")} placeholder="Nombre del contratante" />
              </div>

              <div className="space-y-1.5">
                <Label>Asegurado Titular</Label>
                <Input {...form.register("insured")} placeholder="Nombre del asegurado" />
              </div>

              <div className="space-y-1.5">
                <Label>Moneda de la Póliza</Label>
                <select className={selectClassName} {...form.register("currency")}>
                  <option value="MXN">MXN (Pesos Mexicanos)</option>
                  <option value="UDI">UDI (Unidades de Inversión)</option>
                  <option value="USD">USD (Dólares)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label>
                  Prima en Moneda Original ({watchedCurrency || "UDI/USD"})
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Opcional si está en UDI o USD"
                  {...form.register("originalPremium")}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Tipo de Duración</Label>
                <select
                  className={selectClassName}
                  {...form.register("tipoVigencia")}
                >
                  <option value="LARGO_PLAZO">
                    Largo Plazo / Vitalicia (Aniversario Anual)
                  </option>
                  <option value="ANUAL_RENOVABLE">
                    Anual Renovable (Renovación cada año)
                  </option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label>
                  {watchedTipoVigencia === "LARGO_PLAZO"
                    ? "Fecha Fin de Plazo (Opcional)"
                    : "Fecha de Renovación Anual"}
                </Label>
                <Input type="date" {...form.register("renewalDate")} />
              </div>

              <div className="space-y-1.5">
                <Label>Estatus de la Póliza</Label>
                <select className={selectClassName} {...form.register("status")}>
                  {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                    <option key={key} value={key}>
                      {cfg.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label>Detalle Especial (Opcional)</Label>
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
                <Label>Notas / Suma Asegurada</Label>
                <Input
                  {...form.register("observations")}
                  placeholder="Ej. Suma Asegurada $5,000,000 MXN, domiciliada a BBVA..."
                />
              </div>
            </div>
          )}

          <div className="md:col-span-2 pt-2">
            <Button
              type="submit"
              className="w-full"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              {isEditing ? "Guardar Cambios" : "Guardar Póliza"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
