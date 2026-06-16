"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { clientSchema, ClientFormValues } from "../../schema";
import { createClient, updateClient } from "../../actions";
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
import { Edit, Loader2, Plus, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

export default function ClientFormDialog({ client, triggerButton }: { client?: any, triggerButton?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const isEditing = !!client;

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: client?.name || "",
      email: client?.email || "",
      phone: client?.phone || "",
      birthDate: client?.birthDate ? new Date(client.birthDate) : undefined,
    },
  });

  const onSubmit = async (data: ClientFormValues) => {
    try {
      if (isEditing) {
        await updateClient(client.id, data);
        toast({ title: "Cliente actualizado correctamente" });
      } else {
        const res = await createClient(data);
        toast({ title: "Cliente creado correctamente" });
        // Optional: redirect to the new client's page
        // router.push(/cartera/clientes/);
      }
      
      if (!isEditing) form.reset();
      setOpen(false);
      router.refresh();
    } catch (err: any) {
      toast({
        title: isEditing ? "Error al actualizar" : "Error al crear cliente",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      setOpen(val);
      if (val && !isEditing) form.reset();
    }}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button variant={isEditing ? "secondary" : "default"}>
            {isEditing ? <Edit className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            {isEditing ? "Editar Cliente" : "Nuevo Cliente"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Cliente" : "Nuevo Cliente"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre Completo *</Label>
            <Input {...form.register("name")} placeholder="Ej. Juan Pérez" />
            {form.formState.errors.name && <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Correo Electrónico</Label>
            <Input type="email" {...form.register("email")} placeholder="ejemplo@correo.com" />
            {form.formState.errors.email && <p className="text-xs text-red-500">{form.formState.errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Teléfono</Label>
            <Input {...form.register("phone")} placeholder="555-555-5555" />
          </div>
          <div className="space-y-2">
            <Label>Fecha de Nacimiento</Label>
            <Input 
              type="date" 
              defaultValue={client?.birthDate ? format(new Date(client.birthDate), "yyyy-MM-dd") : ""}
              {...form.register("birthDate", { valueAsDate: true })} 
            />
          </div>
          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            {isEditing ? "Guardar Cambios" : "Crear Cliente"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
