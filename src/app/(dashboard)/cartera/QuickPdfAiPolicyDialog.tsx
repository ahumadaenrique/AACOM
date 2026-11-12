"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import {
  createClientAndPolicyFromAi,
  getCarteraFormCatalogs,
} from "./actions";
import { uploadAndExtractPolicyPdfSmart } from "./pdfClientHelper";
import {
  COMMON_INSURERS,
  PAYMENT_METHODS,
  getInstallmentsForPaymentMethod,
  toDateInputValue,
} from "./dateUtils";
import {
  SUB_RAMOS_CATALOG,
  VIDA_OBJETIVOS_CATALOG,
  CanonicalSubRamoKey,
  VidaObjetivoKey,
  mapFormSelectionToPolicyFields,
  classifyPolicyRamo,
} from "@/lib/ramosCatalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Sparkles,
  UploadCloud,
  Loader2,
  CheckCircle2,
  Plus,
  Settings2,
  ChevronDown,
  ChevronUp,
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

const getInitialFormState = (defaultAgentId?: string) => ({
  clientName: "",
  clientRfc: "",
  clientPhone: "",
  clientEmail: "",
  clientBirthDate: "",
  policyNumber: "",
  insuranceCompany: "",
  product: "",
  subRamoKey: "VIDA_INDIVIDUAL" as CanonicalSubRamoKey,
  vidaObjetivo: "PROTECCION" as VidaObjetivoKey,
  tipoVigencia: "LARGO_PLAZO",
  effectiveDate: toDateInputValue(new Date()),
  renewalDate: "",
  paymentMethod: "Anual",
  currency: "MXN",
  annualPremium: "" as string | number,
  originalPremium: "" as string | number,
  observations: "",
  ownerAgentId: defaultAgentId || "",
  isShared: false,
  sharedWithUserId: "",
  sharedPercentage: "50",
  firstReceiptPaid: false,
  firstReceiptPaidDate: toDateInputValue(new Date()),
  firstReceiptPaidAmount: "",
  firstReceiptAmountEdited: false,
  isRenewalCapture: false,
});

export default function QuickPdfAiPolicyDialog({
  existingClients = [],
  defaultAgentId,
  targetAgencyId,
  buttonLabel = "Nueva Póliza",
  buttonClassName,
  onSavedSuccess,
}: {
  existingClients?: { id: string; name: string; phone?: string | null }[];
  defaultAgentId?: string;
  targetAgencyId?: string;
  buttonLabel?: string;
  buttonClassName?: string;
  onSavedSuccess?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [formError, setFormError] = useState<string>("");

  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUserId, setCurrentUserId] = useState("");
  const [agencyAgents, setAgencyAgents] = useState<CatalogAgent[]>([]);
  const [agencyCompanies, setAgencyCompanies] = useState<CatalogCompany[]>([]);

  const [formState, setFormState] = useState(() =>
    getInitialFormState(defaultAgentId)
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    getCarteraFormCatalogs(targetAgencyId)
      .then((cat) => {
        if (cancelled) return;
        setIsAdmin(cat.isAdmin);
        setCurrentUserId(cat.currentUserId);
        setAgencyAgents(cat.agencyAgents);
        setAgencyCompanies(cat.agencyCompanies);
        setFormState((prev) => ({
          ...prev,
          ownerAgentId:
            prev.ownerAgentId ||
            defaultAgentId ||
            cat.currentUserId ||
            "",
        }));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [open, defaultAgentId, targetAgencyId]);

  const resetDialogState = () => {
    setFormState(getInitialFormState(defaultAgentId || currentUserId));
    setFileName(null);
    setPdfUrl(null);
    setShowAdvanced(false);
    setFormError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      resetDialogState();
    } else {
      setFormState(getInitialFormState(defaultAgentId || currentUserId));
      setFormError("");
    }
  };

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
    const prem = Number(formState.annualPremium) || 0;
    if (prem <= 0) return "";
    const installments = getInstallmentsForPaymentMethod(formState.paymentMethod);
    return (prem / installments).toFixed(2);
  }, [formState.annualPremium, formState.paymentMethod]);

  const handleClientNameChange = (val: string) => {
    const matched = existingClients.find(
      (c) => c.name.trim().toLowerCase() === val.trim().toLowerCase()
    );
    setFormState((prev) => ({
      ...prev,
      clientName: val,
      clientPhone: matched?.phone ? matched.phone : prev.clientPhone,
    }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast({
        title: "Archivo no válido",
        description: "Por favor selecciona un archivo PDF de póliza.",
        variant: "destructive",
      });
      return;
    }

    setIsExtracting(true);
    try {
      const res = await uploadAndExtractPolicyPdfSmart(file);
      const ext = res.extracted;
      setFileName(file.name);
      setPdfUrl(res.pdfUrl || null);

      if (ext.currency && ext.currency !== "MXN") {
        setShowAdvanced(true);
      }

      const classified = classifyPolicyRamo({
        ramo: ext.ramo,
        subRamo: ext.subRamo,
        vidaObjetivo: ext.vidaObjetivo,
        product: ext.product,
        observations: ext.observations,
        contractor: ext.contractor,
      });

      const effDate = ext.effectiveDate || formState.effectiveDate || "";

      setFormState((prev) => ({
        ...prev,
        clientName: ext.contractor || ext.insured || prev.clientName || "",
        clientRfc: ext.contractorRfc || prev.clientRfc || "",
        clientPhone: ext.contractorPhone || prev.clientPhone || "",
        clientEmail: ext.contractorEmail || prev.clientEmail || "",
        clientBirthDate: ext.insuredBirthDate || prev.clientBirthDate || "",
        policyNumber: ext.policyNumber || prev.policyNumber || "",
        insuranceCompany: ext.insuranceCompany || prev.insuranceCompany || "",
        product: ext.product || prev.product || "",
        subRamoKey: classified.subRamoKey,
        vidaObjetivo: classified.vidaObjetivo || "PROTECCION",
        tipoVigencia: ext.tipoVigencia || prev.tipoVigencia,
        effectiveDate: effDate,
        renewalDate: ext.renewalDate || prev.renewalDate || "",
        paymentMethod: ext.paymentMethod || "Anual",
        currency: ext.currency || "MXN",
        annualPremium: ext.annualPremium || prev.annualPremium || 0,
        originalPremium: ext.originalPremium ?? "",
        observations: ext.observations || prev.observations || "",
        firstReceiptPaidDate: effDate || prev.firstReceiptPaidDate,
      }));

      toast({
        title: "✨ Carátula PDF cargada y analizada",
        description: "Verifica los datos y haz clic en Guardar Póliza.",
      });
    } catch (err: any) {
      toast({
        title: "Error al leer carátula PDF",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsExtracting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const validateYearStr = (dateStr: string): boolean => {
    if (!dateStr || !dateStr.trim()) return true;
    const yearMatch = dateStr.trim().match(/^(\d{4})-/);
    if (!yearMatch) return false;
    const yr = parseInt(yearMatch[1], 10);
    return yr >= 1980 && yr <= 2100;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formState.clientName.trim()) {
      const msg = "Por favor, ingresa el nombre del cliente o contratante.";
      setFormError(msg);
      toast({ title: "Datos incompletos", description: msg, variant: "destructive" });
      return;
    }

    if (!formState.policyNumber.trim()) {
      const msg = "Por favor, ingresa el número de póliza.";
      setFormError(msg);
      toast({ title: "Datos incompletos", description: msg, variant: "destructive" });
      return;
    }

    if (!formState.insuranceCompany.trim()) {
      const msg = "Por favor, selecciona o escribe la aseguradora.";
      setFormError(msg);
      toast({ title: "Aseguradora requerida", description: msg, variant: "destructive" });
      return;
    }

    const premiumRaw = String(formState.annualPremium ?? "").trim();
    const premiumNum = Number(premiumRaw);
    if (!premiumRaw || isNaN(premiumNum) || premiumNum <= 0) {
      const msg = "La prima anual debe ser un monto positivo mayor a $0 MXN.";
      setFormError(msg);
      toast({ title: "Prima anual inválida", description: msg, variant: "destructive" });
      return;
    }

    if (formState.originalPremium !== "" && formState.originalPremium !== null) {
      const origNum = Number(formState.originalPremium);
      if (isNaN(origNum) || origNum < 0) {
        const msg = "La prima en moneda original no puede ser negativa.";
        setFormError(msg);
        toast({ title: "Prima original inválida", description: msg, variant: "destructive" });
        return;
      }
    }

    if (formState.clientPhone.trim() !== "") {
      const phoneVal = formState.clientPhone.trim();
      const digits = phoneVal.replace(/\D/g, "");
      if (/[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(phoneVal) || digits.length < 10 || digits.length > 15) {
        const msg = "El teléfono o WhatsApp debe contener de 10 a 15 dígitos numéricos (sin letras).";
        setFormError(msg);
        toast({ title: "Teléfono inválido", description: msg, variant: "destructive" });
        return;
      }
    }

    if (!validateYearStr(formState.effectiveDate)) {
      const msg = "El año de Inicio de Vigencia debe ser válido (entre 1980 y 2100).";
      setFormError(msg);
      toast({ title: "Fecha de vigencia inválida", description: msg, variant: "destructive" });
      return;
    }

    if (!validateYearStr(formState.renewalDate)) {
      const msg = "El año de Aniversario / Fin de Vigencia debe ser válido (entre 1980 y 2100).";
      setFormError(msg);
      toast({ title: "Fecha de renovación inválida", description: msg, variant: "destructive" });
      return;
    }

    let sharedUserId: string | null = null;
    let sharedPct = 0;
    if (formState.isShared) {
      sharedPct = Number(formState.sharedPercentage);
      if (!formState.sharedWithUserId) {
        const msg = "Selecciona al segundo agente con quien se comparte la póliza.";
        setFormError(msg);
        toast({ title: "Agente compartido requerido", description: msg, variant: "destructive" });
        return;
      }
      const effectiveOwner = formState.ownerAgentId || currentUserId;
      if (formState.sharedWithUserId === effectiveOwner) {
        const msg = "El agente compartido debe ser distinto al agente titular.";
        setFormError(msg);
        toast({ title: "Agentes idénticos", description: msg, variant: "destructive" });
        return;
      }
      if (isNaN(sharedPct) || sharedPct <= 0 || sharedPct >= 100) {
        const msg = "El porcentaje del co-agente debe estar entre 1% y 99%.";
        setFormError(msg);
        toast({ title: "Porcentaje inválido", description: msg, variant: "destructive" });
        return;
      }
      sharedUserId = formState.sharedWithUserId;
    }

    const mappedRamo = mapFormSelectionToPolicyFields(
      formState.subRamoKey,
      formState.vidaObjetivo
    );

    const paidAmountToSend = formState.firstReceiptPaid
      ? Number(
          formState.firstReceiptAmountEdited && formState.firstReceiptPaidAmount !== ""
            ? formState.firstReceiptPaidAmount
            : suggestedInstallmentAmount || premiumNum
        )
      : null;

    setIsSaving(true);
    try {
      await createClientAndPolicyFromAi({
        clientName: formState.clientName,
        clientRfc: formState.clientRfc || null,
        clientEmail: formState.clientEmail || null,
        clientPhone: formState.clientPhone || null,
        clientBirthDate: formState.clientBirthDate || null,
        targetAgencyId,
        policyData: {
          policyNumber: formState.policyNumber,
          contractor: formState.clientName,
          insured: formState.clientName,
          insuranceCompany: formState.insuranceCompany.trim(),
          product: formState.product,
          ramo: mappedRamo.ramo,
          subRamo: mappedRamo.subRamo,
          vidaObjetivo: mappedRamo.vidaObjetivo,
          tipoVigencia: formState.tipoVigencia,
          ownerAgentId: isAdmin && formState.ownerAgentId ? formState.ownerAgentId : null,
          sharedWithUserId: sharedUserId,
          sharedPercentage: sharedPct,
          firstReceiptPaid: formState.firstReceiptPaid,
          firstReceiptPaidDate: formState.firstReceiptPaid
            ? (formState.firstReceiptPaidDate || formState.effectiveDate || null)
            : null,
          firstReceiptPaidAmount: paidAmountToSend,
          isRenewalCapture: formState.isRenewalCapture,
          effectiveDate: formState.effectiveDate || null,
          renewalDate: formState.renewalDate || null,
          paymentMethod: formState.paymentMethod,
          currency: formState.currency,
          annualPremium: premiumNum,
          originalPremium:
            formState.originalPremium !== ""
              ? Number(formState.originalPremium)
              : null,
          status: "VIGENTE",
          observations: formState.observations,
          pdfUrl: pdfUrl,
        },
      });

      toast({
        title: "✅ Póliza guardada en Mi Cartera",
        description: formState.firstReceiptPaid
          ? `Póliza ${formState.policyNumber} registrada con primer recibo pagado y reflejada en Producción.`
          : `Póliza ${formState.policyNumber} registrada con recibos pendientes de cobro.`,
      });
      resetDialogState();
      setOpen(false);
      router.refresh();
      if (onSavedSuccess) onSavedSuccess();
    } catch (err: any) {
      const errMsg = err?.message || "Revisa los campos capturados.";
      setFormError(errMsg);
      toast({
        title: "Error al guardar",
        description: errMsg,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const selectClassName =
    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

  const sharedPctNum = Math.min(99, Math.max(0, Number(formState.sharedPercentage) || 0));
  const ownerPctNum = 100 - sharedPctNum;
  const effectiveOwnerId = formState.ownerAgentId || currentUserId;
  const coAgentCandidates = agencyAgents.filter((a) => a.id !== effectiveOwnerId);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          className={
            buttonClassName ||
            "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
          }
        >
          <Plus className="w-4 h-4 mr-1.5" />
          {buttonLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            Registrar Nueva Póliza (Cartera ↔ Producción)
          </DialogTitle>
          <DialogDescription>
            Captura una sola vez: alimenta Mi Cartera, Cobranza, Producción y Ranking en tiempo real.
          </DialogDescription>
        </DialogHeader>

        {/* ZONA OPCIONAL DE AUTOCOMPLETADO CON PDF */}
        <div className="p-3.5 border-2 border-dashed border-indigo-500/30 rounded-lg bg-indigo-500/5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={handleFileChange}
          />
          {isExtracting ? (
            <div className="flex items-center gap-3 py-1 w-full justify-center">
              <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
              <div className="text-left">
                <p className="text-sm font-medium">
                  Leyendo carátula PDF con Gemini IA...
                </p>
                <p className="text-xs text-muted-foreground">
                  Extrayendo cliente, ramo, vigencia, prima y aseguradora
                </p>
              </div>
            </div>
          ) : fileName ? (
            <div className="flex items-center justify-between w-full gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 truncate max-w-[260px]">
                  {fileName}
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                Cambiar PDF
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2.5 text-left">
                <UploadCloud className="w-7 h-7 text-indigo-500 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                    ¿Tienes la carátula en PDF?
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Súbela y la IA llenará los campos y adjuntará el archivo en 1 paso.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white shrink-0 w-full sm:w-auto"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Autocompletar con PDF
              </Button>
            </>
          )}
        </div>

        <form onSubmit={handleSave} noValidate className="grid gap-3.5 md:grid-cols-2 pt-1">
          {/* SELECTOR DE AGENTE TITULAR (SOLO ADMIN) */}
          {isAdmin && agencyAgents.length > 0 && (
            <div className="space-y-1.5 md:col-span-2 p-2.5 rounded-lg border bg-indigo-50/50 dark:bg-indigo-950/20">
              <Label className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
                👤 Agente Titular de la Póliza (Vista Admin)
              </Label>
              <select
                className={selectClassName}
                value={formState.ownerAgentId}
                onChange={(e) =>
                  setFormState((prev) => ({
                    ...prev,
                    ownerAgentId: e.target.value,
                    sharedWithUserId:
                      prev.sharedWithUserId === e.target.value
                        ? ""
                        : prev.sharedWithUserId,
                  }))
                }
              >
                {agencyAgents.map((ag) => (
                  <option key={ag.id} value={ag.id}>
                    {ag.name} ({ag.email})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* CLIENTE */}
          <div className="space-y-1.5 md:col-span-2">
            <Label>Cliente / Contratante *</Label>
            <Input
              list="existing-clients-list"
              value={formState.clientName}
              onChange={(e) => handleClientNameChange(e.target.value)}
              placeholder="Escribe el nombre o selecciona un cliente existente..."
            />
            {existingClients.length > 0 && (
              <datalist id="existing-clients-list">
                {existingClients.map((c) => (
                  <option key={c.id} value={c.name} />
                ))}
              </datalist>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Número de Póliza *</Label>
            <Input
              value={formState.policyNumber}
              onChange={(e) =>
                setFormState({ ...formState, policyNumber: e.target.value })
              }
              placeholder="Ej. 308299"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Aseguradora *</Label>
            <Input
              list="quick-insurers"
              value={formState.insuranceCompany}
              placeholder="Selecciona o escribe aseguradora..."
              onChange={(e) =>
                setFormState({ ...formState, insuranceCompany: e.target.value })
              }
            />
            <datalist id="quick-insurers">
              {mergedInsurerSuggestions.map((ins) => (
                <option key={ins} value={ins} />
              ))}
            </datalist>
            {activeAgencyInsurers.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-0.5">
                {activeAgencyInsurers.slice(0, 5).map((comp) => (
                  <button
                    key={comp.id}
                    type="button"
                    onClick={() =>
                      setFormState((prev) => ({
                        ...prev,
                        insuranceCompany: comp.name,
                      }))
                    }
                    className={`text-[10px] px-2 py-0.5 rounded-full border transition ${
                      formState.insuranceCompany.toLowerCase() ===
                      comp.name.toLowerCase()
                        ? "bg-indigo-600 text-white border-indigo-600 font-semibold"
                        : "bg-muted/60 hover:bg-muted text-muted-foreground"
                    }`}
                  >
                    {comp.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RAMO Y SUB-RAMO HOMOLOGADO */}
          <div className="space-y-1.5">
            <Label>Ramo y Sub-ramo *</Label>
            <select
              className={selectClassName}
              value={formState.subRamoKey}
              onChange={(e) => {
                const nextKey = e.target.value as CanonicalSubRamoKey;
                const def = mapFormSelectionToPolicyFields(
                  nextKey,
                  formState.vidaObjetivo
                );
                setFormState((prev) => ({
                  ...prev,
                  subRamoKey: nextKey,
                  tipoVigencia: def.defaultVigencia,
                }));
              }}
            >
              <optgroup label="Vida">
                {SUB_RAMOS_CATALOG.filter((s) => s.groupKey === "VIDA").map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Gastos Médicos">
                {SUB_RAMOS_CATALOG.filter((s) => s.groupKey === "GMM").map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Autos">
                {SUB_RAMOS_CATALOG.filter((s) => s.groupKey === "AUTOS").map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Daños y Otros">
                {SUB_RAMOS_CATALOG.filter(
                  (s) => s.groupKey === "DANOS" || s.groupKey === "OTROS"
                ).map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label>Producto / Plan</Label>
            <Input
              value={formState.product}
              onChange={(e) =>
                setFormState({ ...formState, product: e.target.value })
              }
              placeholder="Ej. Temporal 20, VPL, Alfa Medical..."
            />
          </div>

          {/* OBJETIVO COMERCIAL (SOLO VIDA INDIVIDUAL) */}
          {formState.subRamoKey === "VIDA_INDIVIDUAL" && (
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs">Objetivo Comercial (Vida Individual)</Label>
              <div className="flex flex-wrap gap-1.5">
                {VIDA_OBJETIVOS_CATALOG.map((obj) => {
                  const selected = formState.vidaObjetivo === obj.key;
                  return (
                    <button
                      key={obj.key}
                      type="button"
                      onClick={() =>
                        setFormState((prev) => ({
                          ...prev,
                          vidaObjetivo: obj.key,
                        }))
                      }
                      className={`px-3 py-1 rounded-md text-xs font-medium border transition ${
                        selected
                          ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                          : "bg-background text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {obj.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Inicio de Vigencia / Emisión *</Label>
            <Input
              type="date"
              min="1980-01-01"
              max="2100-12-31"
              value={formState.effectiveDate}
              onChange={(e) =>
                setFormState((prev) => ({
                  ...prev,
                  effectiveDate: e.target.value,
                  firstReceiptPaidDate: prev.firstReceiptPaid
                    ? prev.firstReceiptPaidDate
                    : e.target.value,
                }))
              }
            />
          </div>

          <div className="space-y-1.5">
            <Label>Forma de Pago</Label>
            <select
              className={selectClassName}
              value={formState.paymentMethod}
              onChange={(e) =>
                setFormState({ ...formState, paymentMethod: e.target.value })
              }
            >
              {PAYMENT_METHODS.map((pm) => (
                <option key={pm} value={pm}>
                  {pm}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label>Prima Anual Emitida en Pesos (MXN) *</Label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="Ej. 25000"
              value={formState.annualPremium}
              onChange={(e) =>
                setFormState({
                  ...formState,
                  annualPremium: e.target.value,
                })
              }
            />
          </div>

          <div className="space-y-1.5">
            <Label>WhatsApp del Cliente (Opcional)</Label>
            <Input
              type="tel"
              value={formState.clientPhone}
              onChange={(e) =>
                setFormState({ ...formState, clientPhone: e.target.value })
              }
              placeholder="10 dígitos numéricos (ej. 5512345678)"
            />
          </div>

          {/* CHECKBOX: PRIMER RECIBO YA PAGADO */}
          <div className="md:col-span-2 p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 space-y-2.5">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-emerald-500 accent-emerald-600"
                checked={formState.firstReceiptPaid}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setFormState((prev) => ({
                    ...prev,
                    firstReceiptPaid: checked,
                    firstReceiptPaidDate:
                      prev.firstReceiptPaidDate ||
                      prev.effectiveDate ||
                      toDateInputValue(new Date()),
                  }));
                }}
              />
              <span className="text-xs font-semibold flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300">
                <DollarSign className="w-3.5 h-3.5" />
                El primer recibo ya fue pagado (computa de inmediato en Prima Pagada MXN)
              </span>
            </label>

            {formState.firstReceiptPaid && (
              <div className="grid gap-3 md:grid-cols-2 pt-1">
                <div className="space-y-1">
                  <Label className="text-xs">Fecha real de pago</Label>
                  <Input
                    type="date"
                    value={formState.firstReceiptPaidDate}
                    onChange={(e) =>
                      setFormState((prev) => ({
                        ...prev,
                        firstReceiptPaidDate: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">
                    Monto pagado en MXN (editable)
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder={suggestedInstallmentAmount || "0.00"}
                    value={
                      formState.firstReceiptAmountEdited
                        ? formState.firstReceiptPaidAmount
                        : suggestedInstallmentAmount
                    }
                    onChange={(e) =>
                      setFormState((prev) => ({
                        ...prev,
                        firstReceiptPaidAmount: e.target.value,
                        firstReceiptAmountEdited: true,
                      }))
                    }
                  />
                </div>
              </div>
            )}
          </div>

          {/* TOGGLE: PÓLIZA COMPARTIDA ENTRE 2 AGENTES */}
          <div className="md:col-span-2 p-3 rounded-lg border bg-muted/20 space-y-2.5">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                className="h-4 w-4 rounded accent-indigo-600"
                checked={formState.isShared}
                onChange={(e) =>
                  setFormState((prev) => ({
                    ...prev,
                    isShared: e.target.checked,
                  }))
                }
              />
              <span className="text-xs font-semibold flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-600" />
                ¿Póliza compartida entre 2 agentes? (divide PE y PPC en Producción/Ranking)
              </span>
            </label>

            {formState.isShared && (
              <div className="grid gap-3 md:grid-cols-3 pt-1">
                <div className="space-y-1 md:col-span-2">
                  <Label className="text-xs">Segundo Agente (Co-participante) *</Label>
                  <select
                    className={selectClassName}
                    value={formState.sharedWithUserId}
                    onChange={(e) =>
                      setFormState((prev) => ({
                        ...prev,
                        sharedWithUserId: e.target.value,
                      }))
                    }
                  >
                    <option value="">Selecciona un agente de tu agencia...</option>
                    {coAgentCandidates.map((ag) => (
                      <option key={ag.id} value={ag.id}>
                        {ag.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">% para Segundo Agente</Label>
                  <Input
                    type="number"
                    min="1"
                    max="99"
                    step="0.01"
                    value={formState.sharedPercentage}
                    onChange={(e) =>
                      setFormState((prev) => ({
                        ...prev,
                        sharedPercentage: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="md:col-span-3 text-[11px] text-muted-foreground flex items-center justify-between bg-background px-2.5 py-1.5 rounded border">
                  <span>
                    Titular: <strong>{ownerPctNum.toFixed(1)}%</strong>
                  </span>
                  <span>
                    Compartido: <strong>{sharedPctNum.toFixed(1)}%</strong>
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* OPCIONES AVANZADAS COLAPSABLES */}
          <div className="md:col-span-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <Settings2 className="w-3.5 h-3.5" />
              {showAdvanced
                ? "Ocultar opciones avanzadas"
                : "Opciones avanzadas (Moneda UDI/USD, Renovación Año 2+, RFC, Notas)"}
              {showAdvanced ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {showAdvanced && (
            <div className="md:col-span-2 grid gap-3 md:grid-cols-2 p-3.5 rounded-lg border bg-muted/20">
              <div className="space-y-1">
                <Label>Moneda de la Póliza</Label>
                <select
                  className={selectClassName}
                  value={formState.currency}
                  onChange={(e) =>
                    setFormState({ ...formState, currency: e.target.value })
                  }
                >
                  <option value="MXN">MXN (Pesos)</option>
                  <option value="UDI">UDI (Unidades de Inversión)</option>
                  <option value="USD">USD (Dólares)</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label>Prima en Moneda Original (UDI / USD)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Opcional"
                  value={formState.originalPremium}
                  onChange={(e) =>
                    setFormState({
                      ...formState,
                      originalPremium: e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-1">
                <Label>Aniversario / Fin de Vigencia</Label>
                <Input
                  type="date"
                  min="1980-01-01"
                  max="2100-12-31"
                  value={formState.renewalDate}
                  onChange={(e) =>
                    setFormState({ ...formState, renewalDate: e.target.value })
                  }
                />
              </div>

              <div className="space-y-1">
                <Label>RFC del Cliente (Opcional)</Label>
                <Input
                  value={formState.clientRfc}
                  onChange={(e) =>
                    setFormState({ ...formState, clientRfc: e.target.value })
                  }
                  placeholder="RFC"
                />
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded accent-amber-600"
                    checked={formState.isRenewalCapture}
                    onChange={(e) =>
                      setFormState((prev) => ({
                        ...prev,
                        isRenewalCapture: e.target.checked,
                      }))
                    }
                  />
                  <span>
                    🔄 Marcar como Renovación histórica (Año 2+ — no cuenta como Venta Nueva Año 1)
                  </span>
                </label>
              </div>

              <div className="space-y-1 md:col-span-2">
                <Label>Observaciones / Suma Asegurada</Label>
                <Input
                  value={formState.observations}
                  onChange={(e) =>
                    setFormState({ ...formState, observations: e.target.value })
                  }
                  placeholder="Ej. Suma Asegurada $5,000,000 MXN..."
                />
              </div>
            </div>
          )}

          {formError && (
            <div className="md:col-span-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-xs font-semibold text-red-700 dark:text-red-300">
              ⚠️ {formError}
            </div>
          )}

          <div className="md:col-span-2 pt-2">
            <Button
              type="submit"
              className="w-full"
              disabled={isSaving || isExtracting}
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-2" />
              )}
              Guardar Póliza en Cartera
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
