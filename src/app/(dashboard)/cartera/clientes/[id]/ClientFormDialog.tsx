"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { clientSchema, ClientFormValues } from "../../schema";
import { createClient, updateClient } from "../../actions";
import { toDateInputValue } from "../../dateUtils";
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
import { Edit, Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ClientFormDialog({
  client,
  triggerButton,
}: {
  client?: any;
  triggerButton?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const isEditing = !!client;

  const getInitialValues = (): ClientFormValues => ({
    name: client?.name || "",
    email: client?.email || "",
    phone: client?.phone || "",
    birthDate: toDateInputValue(client?.birthDate),
    rfc: client?.rfc || "",
    notes: client?.notes || "",
  });

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: getInitialValues(),
  });

  useEffect(() => {
    if (open) {
      form.reset(getInitialValues());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, client]);

  const onSubmit = async (data: ClientFormValues) => {
    try {
      if (isEditing) {
        await updateClient(client.id, data);
        toast({ title: "Cliente actualizado correctamente" });
      } else {
        await createClient(data);
        toast({ title: "Cliente creado correctamente" });
      }

      if (!isEditing) form.reset(getInitialValues());
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button variant={isEditing ? "secondary" : "default"}>
            {isEditing ? (
              <Edit className="w-4 h-4 mr-2" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            {isEditing ? "Editar Cliente" : "Nuevo Cliente"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Información del Cliente" : "Registrar Nuevo Cliente"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nombre Completo / Razón Social *</Label>
            <Input {...form.register("name")} placeholder="Ej. Juan Pérez García" />
            {form.formState.errors.name && (
              <p className="text-xs text-red-500">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Teléfono / WhatsApp (10 dígitos)</Label>
              <Input
                type="tel"
                {...form.register("phone")}
                placeholder="Ej. 55 1234 5678"
              />
              {form.formState.errors.phone && (
                <p className="text-xs text-red-500">
                  {form.formState.errors.phone.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Fecha de Nacimiento</Label>
              <Input type="date" {...form.register("birthDate")} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Correo Electrónico</Label>
              <Input
                type="email"
                {...form.register("email")}
                placeholder="ejemplo@correo.com"
              />
              {form.formState.errors.email && (
                <p className="text-xs text-red-500">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>RFC (Opcional)</Label>
              <Input
                {...form.register("rfc")}
                placeholder="Ej. PEGJ850101XXX"
                className="uppercase"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Notas del Cliente (Opcional)</Label>
            <Input
              {...form.register("notes")}
              placeholder="Ej. Prefiere contacto por WhatsApp en las tardes"
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : null}
            {isEditing ? "Guardar Cambios" : "Crear Cliente"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
