"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { policySchema, PolicyFormValues } from "../../schema";
import { createPolicy, updatePolicy } from "../../actions";
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
import { FileText, Edit, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

export default function PolicyFormDialog({ 
  clientId, 
  policy, 
  triggerButton 
}: { 
  clientId: string, 
  policy?: any,
  triggerButton?: React.ReactNode 
}) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const isEditing = !!policy;

  const form = useForm<PolicyFormValues>({
    resolver: zodResolver(policySchema),
    defaultValues: {
      clientId,
      policyNumber: policy?.policyNumber || "",
      contractor: policy?.contractor || "",
      insured: policy?.insured || "",
      product: policy?.product || "",
      insuranceCompany: policy?.insuranceCompany || "",
      annualPremium: policy?.annualPremium || 0,
      paymentMethod: policy?.paymentMethod || "",
      effectiveDate: policy?.effectiveDate ? new Date(policy?.effectiveDate) : undefined,
      renewalDate: policy?.renewalDate ? new Date(policy?.renewalDate) : undefined,
      observations: policy?.observations || "",
    },
  });

  const onSubmit = async (data: PolicyFormValues) => {
    try {
      if (isEditing) {
        const res = await updatePolicy(policy.id, data);
        
        toast({ title: "Póliza actualizada correctamente" });
      } else {
        const res = await createPolicy(data);
        
        toast({ title: "Póliza creada correctamente" });
      }
      
      setOpen(false);
      router.refresh();
      if (!isEditing) form.reset();
    } catch (err: any) {
      toast({
        title: "Error al guardar póliza",
        description: err.message,
        variant: "destructive",
      });
    }
  };

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
          <DialogTitle>{isEditing ? "Editar Póliza" : "Agregar Póliza"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 md:grid-cols-2">
          
          <div className="space-y-2 md:col-span-2">
            <Label>Número de Póliza *</Label>
            <Input {...form.register("policyNumber")} placeholder="Ej. POL-12345" />
            {form.formState.errors.policyNumber && <p className="text-xs text-red-500">{form.formState.errors.policyNumber.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Contratante</Label>
            <Input {...form.register("contractor")} />
          </div>
          
          <div className="space-y-2">
            <Label>Asegurado</Label>
            <Input {...form.register("insured")} />
          </div>

          <div className="space-y-2">
            <Label>Aseguradora</Label>
            <Input {...form.register("insuranceCompany")} />
          </div>

          <div className="space-y-2">
            <Label>Producto</Label>
            <Input {...form.register("product")} />
          </div>

          <div className="space-y-2">
            <Label>Fecha de Inicio (Vigencia)</Label>
            <Input 
              type="date" 
              defaultValue={policy?.effectiveDate ? format(new Date(policy.effectiveDate), "yyyy-MM-dd") : ""}
              {...form.register("effectiveDate", { valueAsDate: true })} 
            />
          </div>

          <div className="space-y-2">
            <Label>Fecha de Renovación</Label>
            <Input 
              type="date" 
              defaultValue={policy?.renewalDate ? format(new Date(policy.renewalDate), "yyyy-MM-dd") : ""}
              {...form.register("renewalDate", { valueAsDate: true })} 
            />
          </div>

          <div className="space-y-2">
            <Label>Prima Anual (MXN)</Label>
            <Input type="number" step="0.01" {...form.register("annualPremium")} />
          </div>

          <div className="space-y-2">
            <Label>Forma de Pago</Label>
            <Input {...form.register("paymentMethod")} placeholder="Anual, Mensual, etc." />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Observaciones</Label>
            <Input {...form.register("observations")} />
          </div>

          <div className="md:col-span-2 pt-4">
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {isEditing ? "Guardar Cambios" : "Crear Póliza"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}


