"use client";

import { useState, useRef } from "react";
import {
  extractPolicyFromPdfAction,
  createClientAndPolicyFromAi,
} from "./actions";
import {
  RAMO_LABELS,
  COMMON_INSURERS,
  PAYMENT_METHODS,
} from "./dateUtils";
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
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function QuickPdfAiPolicyDialog({
  existingClients = [],
}: {
  existingClients?: { id: string; name: string; phone?: string | null }[];
}) {
  const [open, setOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const [formState, setFormState] = useState({
    clientName: "",
    clientRfc: "",
    clientPhone: "",
    clientEmail: "",
    clientBirthDate: "",
    policyNumber: "",
    insuranceCompany: "Insignia Life",
    product: "",
    ramo: "VIDA_INDIVIDUAL",
    tipoVigencia: "LARGO_PLAZO",
    effectiveDate: "",
    renewalDate: "",
    paymentMethod: "Anual",
    currency: "MXN",
    annualPremium: 0,
    originalPremium: "" as string | number,
    observations: "",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const router = useRouter();

  const handleClientNameChange = (val: string) => {
    const matched = existingClients.find(
      (c) => c.name.trim().toLowerCase() === val.trim().toLowerCase()
    );
    setFormState((prev) => ({
      ...prev,
      clientName: val,
      clientPhone:
        prev.clientPhone || (matched?.phone ? matched.phone : prev.clientPhone),
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
      const fd = new FormData();
      fd.append("file", file);

      const res = await extractPolicyFromPdfAction(fd);
      if (res.error || !res.extracted) {
        throw new Error(res.error || "No se pudo analizar el PDF");
      }

      const ext = res.extracted;
      setFileName(file.name);
      setPdfUrl(res.pdfUrl || null);

      if (ext.currency && ext.currency !== "MXN") {
        setShowAdvanced(true);
      }

      setFormState({
        clientName: ext.contractor || ext.insured || "",
        clientRfc: ext.contractorRfc || "",
        clientPhone: ext.contractorPhone || "",
        clientEmail: ext.contractorEmail || "",
        clientBirthDate: ext.insuredBirthDate || "",
        policyNumber: ext.policyNumber || "",
        insuranceCompany: ext.insuranceCompany || "Insignia Life",
        product: ext.product || "",
        ramo: ext.ramo || "VIDA_INDIVIDUAL",
        tipoVigencia: ext.tipoVigencia || "LARGO_PLAZO",
        effectiveDate: ext.effectiveDate || "",
        renewalDate: ext.renewalDate || "",
        paymentMethod: ext.paymentMethod || "Anual",
        currency: ext.currency || "MXN",
        annualPremium: ext.annualPremium || 0,
        originalPremium: ext.originalPremium ?? "",
        observations: ext.observations || "",
      });

      toast({
        title: "✨ Carátula leída con IA",
        description: "Revisa los datos y haz clic en Guardar Póliza.",
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.policyNumber.trim() || !formState.clientName.trim()) {
      toast({
        title: "Datos incompletos",
        description: "El nombre del cliente y el número de póliza son obligatorios.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      await createClientAndPolicyFromAi({
        clientName: formState.clientName,
        clientRfc: formState.clientRfc || null,
        clientEmail: formState.clientEmail || null,
        clientPhone: formState.clientPhone || null,
        clientBirthDate: formState.clientBirthDate || null,
        policyData: {
          policyNumber: formState.policyNumber,
          contractor: formState.clientName,
          insured: formState.clientName,
          insuranceCompany: formState.insuranceCompany,
          product: formState.product,
          ramo: formState.ramo,
          tipoVigencia: formState.tipoVigencia,
          effectiveDate: formState.effectiveDate || null,
          renewalDate: formState.renewalDate || null,
          paymentMethod: formState.paymentMethod,
          currency: formState.currency,
          annualPremium: Number(formState.annualPremium) || 0,
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
        title: "✅ Póliza guardada en tu Cartera",
        description: `Póliza ${formState.policyNumber} registrada con sus recibos programados.`,
      });
      setOpen(false);
      setFileName(null);
      router.refresh();
    } catch (err: any) {
      toast({
        title: "Error al guardar",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const selectClassName =
    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
          <Plus className="w-4 h-4 mr-1.5" />
          Nueva Póliza
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            Registrar Nueva Póliza
          </DialogTitle>
          <DialogDescription>
            Sube la carátula en PDF para llenar todo automáticamente con IA, o captura los 7 datos básicos manualmente.
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
                  Extrayendo cliente, vigencia, prima y aseguradora
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

        <form onSubmit={handleSave} className="grid gap-3.5 md:grid-cols-2 pt-1">
          {/* 7 CAMPOS ESENCIALES */}
          <div className="space-y-1.5 md:col-span-2">
            <Label>Cliente / Contratante *</Label>
            <Input
              list="existing-clients-list"
              value={formState.clientName}
              onChange={(e) => handleClientNameChange(e.target.value)}
              placeholder="Escribe el nombre o selecciona un cliente existente..."
              required
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
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label>Aseguradora *</Label>
            <Input
              list="quick-insurers"
              value={formState.insuranceCompany}
              onChange={(e) =>
                setFormState({ ...formState, insuranceCompany: e.target.value })
              }
            />
            <datalist id="quick-insurers">
              {COMMON_INSURERS.map((ins) => (
                <option key={ins} value={ins} />
              ))}
            </datalist>
          </div>

          <div className="space-y-1.5">
            <Label>Ramo *</Label>
            <select
              className={selectClassName}
              value={formState.ramo}
              onChange={(e) => {
                const r = e.target.value;
                setFormState({
                  ...formState,
                  ramo: r,
                  tipoVigencia: ["GMM", "AUTOS", "VIDA_GRUPO", "DANOS"].includes(r)
                    ? "ANUAL_RENOVABLE"
                    : "LARGO_PLAZO",
                });
              }}
            >
              {Object.entries(RAMO_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label>Producto / Plan</Label>
            <Input
              value={formState.product}
              onChange={(e) =>
                setFormState({ ...formState, product: e.target.value })
              }
              placeholder="Ej. Temporal 20, Orvi 99, Alfa Medical..."
            />
          </div>

          <div className="space-y-1.5">
            <Label>Inicio de Vigencia</Label>
            <Input
              type="date"
              value={formState.effectiveDate}
              onChange={(e) =>
                setFormState({ ...formState, effectiveDate: e.target.value })
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
            <Label>Prima Anual en Pesos (MXN) *</Label>
            <Input
              type="number"
              step="0.01"
              value={formState.annualPremium}
              onChange={(e) =>
                setFormState({
                  ...formState,
                  annualPremium: parseFloat(e.target.value) || 0,
                })
              }
            />
          </div>

          <div className="space-y-1.5">
            <Label>WhatsApp del Cliente (Opcional)</Label>
            <Input
              value={formState.clientPhone}
              onChange={(e) =>
                setFormState({ ...formState, clientPhone: e.target.value })
              }
              placeholder="10 dígitos para enviar recordatorios"
            />
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
                : "Opciones avanzadas (Moneda UDI/USD, Fin de vigencia, RFC, Notas)"}
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
              Guardar Póliza
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
