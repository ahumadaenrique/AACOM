"use client";

import { useState, useRef } from "react";
import { uploadPolicyPdf, deletePolicyPdf } from "../../actions";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileDown, Trash2, Loader2, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function PolicyUpload({ policy }: { policy: any }) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPdfOpen, setIsPdfOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const router = useRouter();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast({
        title: "Archivo inválido",
        description: "Por favor selecciona un archivo PDF",
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
      
      const { updatePolicyPdfUrl } = await import("../../actions");
      const updateRes = await updatePolicyPdfUrl(policy.id, res.url);
      if (updateRes?.error) throw new Error(updateRes.error);

      toast({ title: "Póliza subida correctamente" });
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
    if (!confirm("¿Estás seguro de eliminar este PDF?")) return;

    setIsDeleting(true);
    try {
      const res = await deletePolicyPdf(policy.pdfUrl);
      if (res.error) throw new Error(res.error);
      
      // Update policy in DB
      const { updatePolicyPdfUrl } = await import("../../actions");
      const updateRes = await updatePolicyPdfUrl(policy.id, null);
      if (updateRes?.error) throw new Error(updateRes.error);

      toast({ title: "Póliza eliminada" });
      router.refresh();
    } catch (err: any) {
      toast({
        title: "Error al eliminar",
        description: err.message || "Ocurrió un error",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (policy.pdfUrl) {
    return (
      <div className="flex items-center gap-2">
        <Dialog open={isPdfOpen} onOpenChange={setIsPdfOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <FileDown className="w-4 h-4 mr-1" />
              Ver PDF
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 overflow-hidden">
            <DialogHeader className="p-4 pb-0">
              <DialogTitle>Documento de la Póliza</DialogTitle>
            </DialogHeader>
            <div className="flex-1 w-full bg-muted mt-2">
              {isPdfOpen && (
                <iframe 
                  src={`/api/pdf?url=${encodeURIComponent(policy.pdfUrl)}`} 
                  className="w-full h-full border-0" 
                  title="PDF Viewer" 
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
        <Button variant="destructive" size="icon" onClick={handleDelete} disabled={isDeleting} className="h-9 w-9">
          {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
        </Button>
      </div>
    );
  }

  return (
    <div>
      <input
        type="file"
        accept=".pdf"
        className="hidden"
        ref={fileInputRef}
        onChange={handleUpload}
      />
      <Button
        variant="secondary"
        size="sm"
        disabled={isUploading}
        onClick={() => fileInputRef.current?.click()}
      >
        {isUploading ? (
          <>
            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            Subiendo...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4 mr-1" />
            Subir PDF
          </>
        )}
      </Button>
    </div>
  );
}

