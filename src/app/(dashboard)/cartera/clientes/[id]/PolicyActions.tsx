"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2, Edit } from "lucide-react";
import { deletePolicy } from "../../actions";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import PolicyFormDialog from "./PolicyFormDialog";

export default function PolicyActions({ policy, clientId }: { policy: any, clientId: string }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!confirm("Â¿Seguro que deseas eliminar esta pÃ³liza?")) return;
    setIsDeleting(true);
    try {
      const res = await deletePolicy(policy.id);
      
      toast({ title: "PÃ³liza eliminada" });
      router.refresh();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex items-center justify-center gap-1">
      <PolicyFormDialog 
        clientId={clientId} 
        policy={policy} 
        triggerButton={
          <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600">
            <Edit className="w-4 h-4" />
          </Button>
        } 
      />
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-8 w-8 text-red-600 hover:text-red-700" 
        onClick={handleDelete}
        disabled={isDeleting}
      >
        {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
      </Button>
    </div>
  );
}


