"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { clientSchema, ClientFormValues } from "../../schema";
import { updateClient } from "../../actions";
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
import { Edit, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

export default function ClientFormDialog({ client }: { client: any }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: client.name,
      email: client.email || "",
      phone: client.phone || "",
      // HTML date input expects YYYY-MM-DD string as its value natively, but with react-hook-form valueAsDate we pass dates
      birthDate: client.birthDate ? new Date(client.birthDate) : undefined,
    },
  });

  const onSubmit = async (data: ClientFormValues) => {
    try {
      const res = await updateClient(client.id, data);
      
      
      toast({ title: "Cliente actualizado correctamente" });
      setOpen(false);
      router.refresh();
    } catch (err: any) {
      toast({
        title: "Error al actualizar",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary">
          <Edit className="w-4 h-4 mr-2" />
          Editar Cliente
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Cliente</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre Completo</Label>
            <Input {...form.register("name")} />
            {form.formState.errors.name && <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Correo ElectrÃ³nico</Label>
            <Input type="email" {...form.register("email")} />
            {form.formState.errors.email && <p className="text-xs text-red-500">{form.formState.errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>TelÃ©fono</Label>
            <Input {...form.register("phone")} />
          </div>
          <div className="space-y-2">
            <Label>Fecha de Nacimiento</Label>
            <Input 
              type="date" 
              defaultValue={client.birthDate ? format(new Date(client.birthDate), "yyyy-MM-dd") : ""}
              {...form.register("birthDate", { valueAsDate: true })} 
            />
          </div>
          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Guardar Cambios
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}


