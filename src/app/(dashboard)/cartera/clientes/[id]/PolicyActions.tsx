"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Archive, Loader2, Edit } from "lucide-react";
import { deletePolicy } from "../../actions";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import PolicyFormDialog from "./PolicyFormDialog";
import PolicyReceiptsDialog from "./PolicyReceiptsDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function PolicyActions({
  policy,
  clientId,
}: {
  policy: any;
  clientId: string;
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleArchive = async () => {
    setIsDeleting(true);
    try {
      await deletePolicy(policy.id);
      toast({
        title: "Póliza archivada",
        description: `La póliza ${policy.policyNumber} fue dada de baja de la vista activa.`,
      });
      setConfirmOpen(false);
      router.refresh();
    } catch (e: any) {
      toast({
        title: "Error al archivar",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex items-center justify-center gap-0.5">
      <PolicyReceiptsDialog policy={policy} />

      <PolicyFormDialog
        clientId={clientId || policy.clientId || ""}
        policy={policy}
        triggerButton={
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-blue-600 hover:text-blue-700"
            title="Editar póliza"
          >
            <Edit className="w-4 h-4" />
          </Button>
        }
      />

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-rose-600 hover:text-rose-700"
            title="Archivar / Dar de baja póliza"
          >
            <Archive className="w-4 h-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>¿Archivar póliza {policy.policyNumber}?</DialogTitle>
            <DialogDescription>
              Esta acción ocultará la póliza de tu cartera activa sin destruir su historial ni su documento PDF en la base de datos. Si la póliza cambió de estatus (ej. Cancelada o Terminada), también puedes editar su estatus en lugar de archivarla.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleArchive}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Sí, Archivar Póliza
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
