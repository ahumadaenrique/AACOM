"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { policySchema, PolicyFormValues } from "../../schema";
import {
  createPolicy,
  updatePolicy,
  getCarteraFormCatalogs,
} from "../../actions";
import { uploadAndExtractPolicyPdfSmart } from "../../pdfClientHelper";
import {
  toDateInputValue,
  STATUS_CONFIG,
  SUB_STATUS_LABELS,
  COMMON_INSURERS,
  PAYMENT_METHODS,
  getInstallmentsForPaymentMethod,
} from "../../dateUtils";
import {
  SUB_RAMOS_CATALOG,
  VIDA_OBJETIVOS_CATALOG,
  CanonicalSubRamoKey,
  VidaObjetivoKey,
  classifyPolicyRamo,
  mapFormSelectionToPolicyFields,
} from "@/lib/ramosCatalog";
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
  Users,
  DollarSign,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface CatalogAgent {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface CatalogCompany {
  id: string;
  name: string;
  active: boolean;
  color: string | null;
}

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

  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUserId, setCurrentUserId] = useState("");
  const [agencyAgents, setAgencyAgents] = useState<CatalogAgent[]>([]);
  const [agencyCompanies, setAgencyCompanies] = useState<CatalogCompany[]>([]);

  const isEditing = !!policy;

  const initialClassified = classifyPolicyRamo(policy || { ramo: "VIDA_INDIVIDUAL" });
  const [selectedSubRamoKey, setSelectedSubRamoKey] = useState<CanonicalSubRamoKey>(
    initialClassified.subRamoKey
  );
  const [selectedVidaObjetivo, setSelectedVidaObjetivo] = useState<VidaObjetivoKey>(
    initialClassified.vidaObjetivo || "PROTECCION"
  );
  const [isShared, setIsShared] = useState<boolean>(
    Boolean(policy?.sharedWithUserId && (policy?.sharedPercentage || 0) > 0)
  );
  const [firstReceiptAmountEdited, setFirstReceiptAmountEdited] = useState(false);

  const { toast } = useToast();
  const router = useRouter();

  const getInitialValues = (): PolicyFormValues => {
    const cls = classifyPolicyRamo(policy || { ramo: "VIDA_INDIVIDUAL" });
    const mapped = mapFormSelectionToPolicyFields(cls.subRamoKey, cls.vidaObjetivo);
    return {
      clientId: clientId || policy?.clientId || "",
      policyNumber: policy?.policyNumber || "",
      contractor: policy?.contractor || "",
      insured: policy?.insured || "",
      product: policy?.product || "",
      insuranceCompany: policy?.insuranceCompany || "",
      ramo: policy?.ramo || mapped.ramo,
      subRamo: policy?.subRamo || mapped.subRamo,
      vidaObjetivo: policy?.vidaObjetivo || mapped.vidaObjetivo,
      tipoVigencia: policy?.tipoVigencia || mapped.defaultVigencia,
      currency: policy?.currency || "MXN",
      originalPremium: policy?.originalPremium ?? null,
      status: policy?.status || "VIGENTE",
      subStatus: policy?.subStatus || "",
      annualPremium: policy?.annualPremium || ("" as any),
      paymentMethod: policy?.paymentMethod || "Anual",
      effectiveDate: toDateInputValue(policy?.effectiveDate || new Date()),
      renewalDate: toDateInputValue(policy?.renewalDate),
      approximateCommission: policy?.approximateCommission || 0,
      approximateBonus: policy?.approximateBonus || 0,
      observations: policy?.observations || "",
      pdfUrl: policy?.pdfUrl || null,
      ownerAgentId: policy?.userId || "",
      sharedWithUserId: policy?.sharedWithUserId || "",
      sharedPercentage: policy?.sharedPercentage || 50,
      firstReceiptPaid: false,
      firstReceiptPaidDate: toDateInputValue(policy?.effectiveDate || new Date()),
      firstReceiptPaidAmount: null,
      isRenewalCapture: Boolean(policy?.isRenewalCapture) || policy?.subStatus === "RENOVACION",
    };
  };

  const form = useForm<PolicyFormValues>({
    resolver: zodResolver(policySchema),
    defaultValues: getInitialValues(),
  });

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const cls = classifyPolicyRamo(policy || { ramo: "VIDA_INDIVIDUAL" });
    setSelectedSubRamoKey(cls.subRamoKey);
    setSelectedVidaObjetivo(cls.vidaObjetivo || "PROTECCION");
    setIsShared(Boolean(policy?.sharedWithUserId && (policy?.sharedPercentage || 0) > 0));
    setFirstReceiptAmountEdited(false);
    form.reset(getInitialValues());
    setExtractedFileName(null);
    setShowAdvanced(
      isEditing &&
        (policy?.currency !== "MXN" ||
          Boolean(policy?.subStatus) ||
          Boolean(policy?.observations))
    );

    getCarteraFormCatalogs()
      .then((cat) => {
        if (cancelled) return;
        setIsAdmin(cat.isAdmin);
        setCurrentUserId(cat.currentUserId);
        setAgencyAgents(cat.agencyAgents);
        setAgencyCompanies(cat.agencyCompanies);
        if (!policy?.userId && cat.currentUserId) {
          form.setValue("ownerAgentId", cat.currentUserId);
        }
        const activeList = cat.agencyCompanies.filter((c) => c.active);
        if (!isEditing && !form.getValues("insuranceCompany") && activeList.length === 1) {
          form.setValue("insuranceCompany", activeList[0].name);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, policy]);

  const watchedCurrency = form.watch("currency");
  const watchedTipoVigencia = form.watch("tipoVigencia");
  const watchedPremium = form.watch("annualPremium");
  const watchedPaymentMethod = form.watch("paymentMethod");
  const watchedFirstReceiptPaid = form.watch("firstReceiptPaid");
  const watchedOwnerAgentId = form.watch("ownerAgentId");
  const watchedSharedWithUserId = form.watch("sharedWithUserId");
  const watchedSharedPercentage = form.watch("sharedPercentage");
  const watchedIsRenewalCapture = form.watch("isRenewalCapture");
  const watchedCompany = form.watch("insuranceCompany");

  const activeAgencyInsurers = useMemo(
    () => agencyCompanies.filter((c) => c.active),
    [agencyCompanies]
  );

  const mergedInsurerSuggestions = useMemo(() => {
    const names = [
      ...agencyCompanies.map((c) => c.name),
      ...COMMON_INSURERS.filter((i) => i !== "Otra"),
    ];
    return Array.from(new Set(names));
  }, [agencyCompanies]);

  const suggestedInstallmentAmount = useMemo(() => {
    const prem = Number(watchedPremium) || 0;
    if (prem <= 0) return "";
    const installments = getInstallmentsForPaymentMethod(watchedPaymentMethod || "Anual");
    return Number((prem / installments).toFixed(2));
  }, [watchedPremium, watchedPaymentMethod]);

  const handleSubRamoChange = (nextSubRamo: CanonicalSubRamoKey) => {
    setSelectedSubRamoKey(nextSubRamo);
    const mapped = mapFormSelectionToPolicyFields(nextSubRamo, selectedVidaObjetivo);
    form.setValue("ramo", mapped.ramo);
    form.setValue("subRamo", mapped.subRamo);
    form.setValue("vidaObjetivo", mapped.vidaObjetivo);
    form.setValue("tipoVigencia", mapped.defaultVigencia);
  };

  const handleVidaObjetivoChange = (nextObj: VidaObjetivoKey) => {
    setSelectedVidaObjetivo(nextObj);
    const mapped = mapFormSelectionToPolicyFields(selectedSubRamoKey, nextObj);
    form.setValue("vidaObjetivo", mapped.vidaObjetivo);
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
      const res = await uploadAndExtractPolicyPdfSmart(file);
      const ext = res.extracted;
      const cls = classifyPolicyRamo({
        ramo: ext.ramo,
        subRamo: ext.subRamo,
        vidaObjetivo: ext.vidaObjetivo,
        product: ext.product,
        observations: ext.observations,
        contractor: ext.contractor,
      });
      const mapped = mapFormSelectionToPolicyFields(
        cls.subRamoKey,
        cls.vidaObjetivo || "PROTECCION"
      );
      setSelectedSubRamoKey(cls.subRamoKey);
      if (cls.vidaObjetivo) setSelectedVidaObjetivo(cls.vidaObjetivo);

      if (ext.policyNumber) form.setValue("policyNumber", ext.policyNumber);
      if (ext.insuranceCompany) form.setValue("insuranceCompany", ext.insuranceCompany);
      if (ext.product) form.setValue("product", ext.product);
      form.setValue("ramo", mapped.ramo);
      form.setValue("subRamo", mapped.subRamo);
      form.setValue("vidaObjetivo", mapped.vidaObjetivo);
      form.setValue("tipoVigencia", ext.tipoVigencia || mapped.defaultVigencia);
      if (ext.contractor) form.setValue("contractor", ext.contractor);
      if (ext.insured) form.setValue("insured", ext.insured);
      if (ext.effectiveDate) {
        form.setValue("effectiveDate", ext.effectiveDate);
        form.setValue("firstReceiptPaidDate", ext.effectiveDate);
      }
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
      const mapped = mapFormSelectionToPolicyFields(
        selectedSubRamoKey,
        selectedVidaObjetivo
      );

      let sharedUserId: string | null = null;
      let sharedPct = 0;
      if (isShared) {
        if (!data.sharedWithUserId) {
          toast({
            title: "Agente compartido requerido",
            description: "Selecciona al segundo agente con quien compartes la póliza.",
            variant: "destructive",
          });
          return;
        }
        const effectiveOwner = data.ownerAgentId || currentUserId;
        if (data.sharedWithUserId === effectiveOwner) {
          toast({
            title: "Agentes idénticos",
            description: "El agente compartido debe ser distinto al agente titular.",
            variant: "destructive",
          });
          return;
        }
        const pctNum = Number(data.sharedPercentage) || 0;
        if (pctNum <= 0 || pctNum >= 100) {
          toast({
            title: "Porcentaje inválido",
            description: "El porcentaje del co-agente debe estar entre 1% y 99%.",
            variant: "destructive",
          });
          return;
        }
        sharedUserId = data.sharedWithUserId;
        sharedPct = pctNum;
      }

      const payload: PolicyFormValues = {
        ...data,
        ramo: mapped.ramo,
        subRamo: mapped.subRamo,
        vidaObjetivo: mapped.vidaObjetivo,
        ownerAgentId: isAdmin && data.ownerAgentId ? data.ownerAgentId : null,
        sharedWithUserId: sharedUserId,
        sharedPercentage: sharedPct,
        firstReceiptPaidAmount:
          !isEditing && data.firstReceiptPaid
            ? Number(
                firstReceiptAmountEdited && data.firstReceiptPaidAmount != null
                  ? data.firstReceiptPaidAmount
                  : suggestedInstallmentAmount || data.annualPremium || 0
              )
            : null,
      };

      if (isEditing) {
        await updatePolicy(policy.id, payload);
        toast({ title: "Póliza actualizada correctamente" });
      } else {
        await createPolicy(payload);
        toast({
          title: "Póliza creada correctamente",
          description: payload.firstReceiptPaid
            ? "Primer recibo marcado como pagado y reflejado en Producción."
            : undefined,
        });
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

        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="grid gap-3.5 md:grid-cols-2">
          {isAdmin && agencyAgents.length > 0 && (
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                Agente Titular Responsable *
              </Label>
              <select
                className={selectClassName}
                value={watchedOwnerAgentId || ""}
                onChange={(e) => form.setValue("ownerAgentId", e.target.value)}
              >
                {agencyAgents.map((ag) => (
                  <option key={ag.id} value={ag.id}>
                    {ag.name} ({ag.email})
                  </option>
                ))}
              </select>
            </div>
          )}

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
              list="policy-dialog-insurers-list"
              {...form.register("insuranceCompany")}
              placeholder="Selecciona o escribe aseguradora"
            />
            <datalist id="policy-dialog-insurers-list">
              {mergedInsurerSuggestions.map((ins) => (
                <option key={ins} value={ins} />
              ))}
            </datalist>
            {activeAgencyInsurers.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-0.5">
                {activeAgencyInsurers.map((comp) => (
                  <button
                    key={comp.id}
                    type="button"
                    onClick={() => form.setValue("insuranceCompany", comp.name)}
                    className={`text-[10px] px-2 py-0.5 rounded-full border transition ${
                      (watchedCompany || "").toLowerCase() === comp.name.toLowerCase()
                        ? "bg-teal-600 text-white border-teal-600 font-bold"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted border-border"
                    }`}
                  >
                    {comp.name}
                  </button>
                ))}
              </div>
            )}
            {form.formState.errors.insuranceCompany && (
              <p className="text-xs text-red-500">
                {form.formState.errors.insuranceCompany.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Ramo y Sub-ramo *</Label>
            <select
              className={selectClassName}
              value={selectedSubRamoKey}
              onChange={(e) => handleSubRamoChange(e.target.value as CanonicalSubRamoKey)}
            >
              {SUB_RAMOS_CATALOG.map((sr) => (
                <option key={sr.key} value={sr.key}>
                  {sr.groupLabel} — {sr.label}
                </option>
              ))}
            </select>
          </div>

          {selectedSubRamoKey === "VIDA_INDIVIDUAL" ? (
            <div className="space-y-1.5">
              <Label>Objetivo Vida Individual</Label>
              <select
                className={selectClassName}
                value={selectedVidaObjetivo}
                onChange={(e) => handleVidaObjetivoChange(e.target.value as VidaObjetivoKey)}
              >
                {VIDA_OBJETIVOS_CATALOG.map((obj) => (
                  <option key={obj.key} value={obj.key}>
                    {obj.label}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label>Producto / Plan</Label>
              <Input
                {...form.register("product")}
                placeholder="Ej. Plan Médico, Colectivo, Flotilla..."
              />
            </div>
          )}

          {selectedSubRamoKey === "VIDA_INDIVIDUAL" && (
            <div className="space-y-1.5 md:col-span-2">
              <Label>Producto / Plan Comercial</Label>
              <Input
                {...form.register("product")}
                placeholder="Ej. Temporal 20, Orvi 99, Imagina Ser, Star Dotal..."
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Inicio de Vigencia</Label>
            <Input
              type="date"
              min="1980-01-01"
              max="2100-12-31"
              {...form.register("effectiveDate")}
            />
            {form.formState.errors.effectiveDate && (
              <p className="text-xs text-red-500">
                {form.formState.errors.effectiveDate.message as string}
              </p>
            )}
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
            <Label>Prima Anual Emitida en Pesos (MXN) *</Label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              {...form.register("annualPremium")}
            />
            {form.formState.errors.annualPremium && (
              <p className="text-xs text-red-500">
                {form.formState.errors.annualPremium.message}
              </p>
            )}
          </div>

          {/* PRIMER RECIBO PAGADO (NUEVA CREACIÓN) */}
          {!isEditing && (
            <div className="md:col-span-2 p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 space-y-2.5">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                <input
                  type="checkbox"
                  checked={Boolean(watchedFirstReceiptPaid)}
                  onChange={(e) => {
                    form.setValue("firstReceiptPaid", e.target.checked);
                    if (e.target.checked && !form.getValues("firstReceiptPaidDate")) {
                      form.setValue("firstReceiptPaidDate", form.getValues("effectiveDate") || toDateInputValue(new Date()));
                    }
                  }}
                  className="rounded border-emerald-500"
                />
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                El primer recibo ya fue pagado (reflejar PPC de inmediato en Producción)
              </label>

              {watchedFirstReceiptPaid && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <div className="space-y-1">
                    <Label className="text-[11px]">Fecha de Pago del 1er Recibo</Label>
                    <Input
                      type="date"
                      {...form.register("firstReceiptPaidDate")}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Monto Real Pagado en MXN (Editable)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={
                        firstReceiptAmountEdited
                          ? String(form.watch("firstReceiptPaidAmount") ?? "")
                          : String(suggestedInstallmentAmount || "")
                      }
                      onChange={(e) => {
                        setFirstReceiptAmountEdited(true);
                        form.setValue(
                          "firstReceiptPaidAmount",
                          e.target.value === "" ? null : Number(e.target.value)
                        );
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PÓLIZA COMPARTIDA ENTRE 2 AGENTES */}
          <div className="md:col-span-2 p-3 rounded-lg border border-blue-500/30 bg-blue-500/5 space-y-2.5">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-blue-800 dark:text-blue-300">
              <input
                type="checkbox"
                checked={isShared}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setIsShared(checked);
                  if (!checked) {
                    form.setValue("sharedWithUserId", "");
                    form.setValue("sharedPercentage", 0);
                  } else {
                    form.setValue("sharedPercentage", 50);
                  }
                }}
                className="rounded border-blue-500"
              />
              <Users className="w-3.5 h-3.5 text-blue-600" />
              ¿Póliza compartida entre 2 agentes? (Split % de PE y PPC)
            </label>

            {isShared && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                <div className="sm:col-span-2 space-y-1">
                  <Label className="text-[11px]">Co-Agente Participante</Label>
                  <select
                    className={selectClassName}
                    value={watchedSharedWithUserId || ""}
                    onChange={(e) => form.setValue("sharedWithUserId", e.target.value)}
                  >
                    <option value="">Selecciona agente...</option>
                    {agencyAgents
                      .filter((a) => a.id !== (watchedOwnerAgentId || currentUserId))
                      .map((ag) => (
                        <option key={ag.id} value={ag.id}>
                          {ag.name} ({ag.email})
                        </option>
                      ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">% Co-Agente (1-99)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="99"
                    value={watchedSharedPercentage || 50}
                    onChange={(e) =>
                      form.setValue("sharedPercentage", Number(e.target.value) || 0)
                    }
                  />
                  <span className="text-[10px] text-muted-foreground block">
                    Titular: {Math.max(0, 100 - (Number(watchedSharedPercentage) || 0))}%
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* CAPTURA DE RENOVACIÓN */}
          <div className="md:col-span-2">
            <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(watchedIsRenewalCapture)}
                onChange={(e) => {
                  form.setValue("isRenewalCapture", e.target.checked);
                  if (e.target.checked) {
                    form.setValue("subStatus", "RENOVACION");
                  } else if (form.getValues("subStatus") === "RENOVACION") {
                    form.setValue("subStatus", "");
                  }
                }}
              />
              🔄 Captura de Renovación (Año 2+): no contar en Ranking/Tablero de Venta Nueva
            </label>
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
                {form.formState.errors.originalPremium && (
                  <p className="text-xs text-red-500">
                    {form.formState.errors.originalPremium.message as string}
                  </p>
                )}
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
                <Input
                  type="date"
                  min="1980-01-01"
                  max="2100-12-31"
                  {...form.register("renewalDate")}
                />
                {form.formState.errors.renewalDate && (
                  <p className="text-xs text-red-500">
                    {form.formState.errors.renewalDate.message as string}
                  </p>
                )}
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
