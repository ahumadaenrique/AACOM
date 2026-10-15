"use client";

import { useState, useRef } from "react";
import { uploadPolicyPdf, deletePolicyPdf, updatePolicyPdfUrl } from "../../actions";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, Trash2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function PolicyUpload({ policy }: { policy: any }) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPdfOpen, setIsPdfOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const router = useRouter();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast({
        title: "Archivo no válido",
        description: "Por favor selecciona un documento en formato PDF.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await uploadPolicyPdf(formData);
      if (res.error) throw new Error(res.error);
      if (!res.url) throw new Error("No se obtuvo la URL del archivo");

      const updateRes = await updatePolicyPdfUrl(policy.id, res.url);
      if (updateRes?.error) throw new Error(updateRes.error);

      toast({ title: "Carátula PDF guardada correctamente" });
      router.refresh();
    } catch (err: any) {
      toast({
        title: "Error al subir PDF",
        description: err.message || "Ocurrió un error",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async () => {
    if (!policy.pdfUrl) return;

    setIsDeleting(true);
    try {
      const res = await deletePolicyPdf(policy.pdfUrl);
      if (res.error) throw new Error(res.error);

      const updateRes = await updatePolicyPdfUrl(policy.id, null);
      if (updateRes?.error) throw new Error(updateRes.error);

      toast({ title: "Documento PDF desvinculado" });
      setConfirmDeleteOpen(false);
      router.refresh();
    } catch (err: any) {
      toast({
        title: "Error al eliminar PDF",
        description: err.message || "Ocurrió un error",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (policy.pdfUrl) {
    return (
      <div className="flex items-center justify-center gap-1">
        <Dialog open={isPdfOpen} onOpenChange={setIsPdfOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs border-blue-500/30 text-blue-700 dark:text-blue-300 hover:bg-blue-500/10"
              title="Abrir carátula PDF de la póliza"
            >
              <FileText className="w-3.5 h-3.5 mr-1" />
              Ver PDF
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 overflow-hidden">
            <DialogHeader className="p-4 pb-2 border-b flex flex-row items-center justify-between">
              <DialogTitle className="text-base">
                Carátula de Póliza {policy.policyNumber} — {policy.contractor || policy.client?.name}
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 w-full bg-muted">
              {isPdfOpen && (
                <iframe
                  src={`/api/pdf?url=${encodeURIComponent(policy.pdfUrl)}`}
                  className="w-full h-full border-0"
                  title="Visor de Póliza PDF"
                />
              )}
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              disabled={isDeleting}
              className="h-7 w-7 text-muted-foreground hover:text-rose-600"
              title="Quitar PDF adjunto"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>¿Quitar documento PDF?</DialogTitle>
              <DialogDescription>
                Se eliminará el archivo PDF adjunto a la póliza {policy.policyNumber}. Los datos de la póliza se conservarán intactos.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex gap-2 sm:justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmDeleteOpen(false)}
                disabled={isDeleting}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                ) : null}
                Quitar PDF
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      <input
        type="file"
        accept=".pdf"
        className="hidden"
        ref={fileInputRef}
        onChange={handleUpload}
      />
      <Button
        variant="ghost"
        size="sm"
        disabled={isUploading}
        onClick={() => fileInputRef.current?.click()}
        className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground border border-dashed border-border"
        title="Subir carátula PDF"
      >
        {isUploading ? (
          <>
            <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
            Subiendo...
          </>
        ) : (
          <>
            <Upload className="w-3.5 h-3.5 mr-1" />
            Subir PDF
          </>
        )}
      </Button>
    </div>
  );
}
