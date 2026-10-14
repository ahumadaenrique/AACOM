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
import { Sparkles, UploadCloud, Loader2, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function QuickPdfAiPolicyDialog() {
  const [open, setOpen] = useState(false);
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
        description: "Verifica los datos extraídos y confirma para guardar en Cartera.",
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
        title: "✅ Cliente, Póliza y Recibos creados",
        description: `Póliza ${formState.policyNumber} agregada exitosamente a tu cartera.`,
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
        <Button
          variant="secondary"
          className="border border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-500/20"
        >
          <Sparkles className="w-4 h-4 mr-2 text-indigo-500" />
          Alta con PDF (IA)
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            Alta Inteligente de Póliza desde Carátula PDF (Gemini IA)
          </DialogTitle>
          <DialogDescription>
            Sube el PDF de cualquier aseguradora (Insignia Life, GNP, AXA, SMNYL, MetLife, Quálitas). Gemini extraerá automáticamente los datos del cliente y de la póliza y proyectará sus recibos.
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 border-2 border-dashed border-indigo-500/30 rounded-lg bg-indigo-500/5 flex flex-col items-center justify-center text-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={handleFileChange}
          />
          {isExtracting ? (
            <div className="flex flex-col items-center py-3 gap-2">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
              <p className="text-sm font-medium">
                Analizando carátula PDF con Gemini IA...
              </p>
              <p className="text-xs text-muted-foreground">
                Extrayendo contratante, vigencia, moneda, prima y plan
              </p>
            </div>
          ) : fileName ? (
            <div className="flex flex-col items-center py-1 gap-1.5">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                {fileName}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                Subir otro PDF diferente
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center py-2 gap-2">
              <UploadCloud className="w-10 h-10 text-indigo-500" />
              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Seleccionar Carátula PDF
              </Button>
              <span className="text-xs text-muted-foreground">
                Se vinculará automáticamente a un cliente existente o creará uno nuevo
              </span>
            </div>
          )}
        </div>

        <form onSubmit={handleSave} className="grid gap-3 md:grid-cols-2 pt-2">
          <div className="space-y-1 md:col-span-2">
            <Label>Nombre del Cliente / Contratante *</Label>
            <Input
              value={formState.clientName}
              onChange={(e) =>
                setFormState({ ...formState, clientName: e.target.value })
              }
              placeholder="Nombre completo del asegurado o contratante"
              required
            />
          </div>

          <div className="space-y-1">
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

          <div className="space-y-1">
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

          <div className="space-y-1">
            <Label>Ramo</Label>
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

          <div className="space-y-1">
            <Label>Producto / Plan</Label>
            <Input
              value={formState.product}
              onChange={(e) =>
                setFormState({ ...formState, product: e.target.value })
              }
              placeholder="Ej. Temporal 20, Orvi 99, Alfa Medical..."
            />
          </div>

          <div className="space-y-1">
            <Label>Inicio de Vigencia</Label>
            <Input
              type="date"
              value={formState.effectiveDate}
              onChange={(e) =>
                setFormState({ ...formState, effectiveDate: e.target.value })
              }
            />
          </div>

          <div className="space-y-1">
            <Label>Aniversario / Renovación</Label>
            <Input
              type="date"
              value={formState.renewalDate}
              onChange={(e) =>
                setFormState({ ...formState, renewalDate: e.target.value })
              }
            />
          </div>

          <div className="space-y-1">
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

          <div className="space-y-1">
            <Label>Moneda</Label>
            <select
              className={selectClassName}
              value={formState.currency}
              onChange={(e) =>
                setFormState({ ...formState, currency: e.target.value })
              }
            >
              <option value="MXN">MXN</option>
              <option value="UDI">UDI</option>
              <option value="USD">USD</option>
            </select>
          </div>

          <div className="space-y-1">
            <Label>Prima Anualizada (MXN)</Label>
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

          <div className="space-y-1">
            <Label>Teléfono / WhatsApp del Cliente (Opcional)</Label>
            <Input
              value={formState.clientPhone}
              onChange={(e) =>
                setFormState({ ...formState, clientPhone: e.target.value })
              }
              placeholder="10 dígitos"
            />
          </div>

          <div className="space-y-1 md:col-span-2">
            <Label>Observaciones / Suma Asegurada</Label>
            <Input
              value={formState.observations}
              onChange={(e) =>
                setFormState({ ...formState, observations: e.target.value })
              }
            />
          </div>

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
              Guardar Póliza y Generar Recibos
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
