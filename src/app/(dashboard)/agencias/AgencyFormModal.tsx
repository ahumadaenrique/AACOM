"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { createAgency, updateAgency } from "./actions";
import { Loader2, ShieldCheck } from "lucide-react";

export function AgencyFormModal({ children, agency }: { children: React.ReactNode, agency?: any }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      slug: (formData.get("slug") as string).toLowerCase().replace(/[^a-z0-9-]/g, ''),
      primaryColor: formData.get("primaryColor") as string,
      logoUrl: formData.get("logoUrl") as string,
      active: formData.get("active") === "on",
      adminName: formData.get("adminName") as string || undefined,
      adminEmail: formData.get("adminEmail") as string || undefined,
      adminPassword: formData.get("adminPassword") as string || undefined,
    };

    try {
      if (agency) {
        await updateAgency(agency.id, data);
      } else {
        await createAgency(data);
      }
      setOpen(false);
    } catch (err: any) {
      setError(err.message || "Error al guardar la agencia");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{agency ? "Editar Agencia" : "Nueva Agencia SaaS"}</DialogTitle>
            <DialogDescription>
              {agency ? "Modifica los datos de la agencia seleccionada." : "Crea una nueva instancia SaaS con marca blanca. El slug se usará para el subdominio."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-5 py-4">
            {error && <div className="text-red-500 text-sm font-medium bg-red-50 p-3 rounded-md border border-red-100">{error}</div>}
            
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre Comercial</Label>
              <Input id="name" name="name" defaultValue={agency?.name} required placeholder="Ej. Seguros XYZ" />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="slug">Subdominio (Slug)</Label>
              <div className="flex items-center gap-2">
                <Input 
                    id="slug" 
                    name="slug" 
                    defaultValue={agency?.slug} 
                    required 
                    placeholder="segurosxyz" 
                    className="flex-1 lowercase" 
                    pattern="[a-z0-9-]+" 
                    title="Solo minúsculas, números y guiones"
                />
                <span className="text-muted-foreground text-sm font-medium bg-slate-100 px-3 py-2 rounded-md border border-slate-200">.aacomsoft.com</span>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="primaryColor">Color Corporativo (Marca Blanca)</Label>
              <div className="flex gap-3">
                <div className="relative">
                    <Input 
                        type="color" 
                        id="colorPicker" 
                        defaultValue={agency?.primaryColor || "#4f46e5"} 
                        className="w-12 h-10 p-0 border-0 rounded overflow-hidden cursor-pointer absolute inset-0 opacity-0" 
                        onChange={(e) => {
                            const input = document.getElementById("primaryColor") as HTMLInputElement;
                            const preview = document.getElementById("colorPreview");
                            if (input) input.value = e.target.value;
                            if (preview) preview.style.backgroundColor = e.target.value;
                        }} 
                    />
                    <div id="colorPreview" className="w-12 h-10 rounded-md shadow-inner border border-slate-200 pointer-events-none" style={{ backgroundColor: agency?.primaryColor || "#4f46e5" }}></div>
                </div>
                <Input id="primaryColor" name="primaryColor" defaultValue={agency?.primaryColor || "#4f46e5"} placeholder="#4f46e5" className="flex-1 font-mono uppercase" />
              </div>
              <p className="text-xs text-muted-foreground">Este color reemplazará el branding de toda la aplicación.</p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="logoUrl">URL del Logo (Opcional)</Label>
              <Input id="logoUrl" name="logoUrl" defaultValue={agency?.logoUrl || ""} placeholder="https://..." />
            </div>

            {!agency && (
              <div className="p-4 border border-indigo-100 bg-indigo-50/50 rounded-lg space-y-3 mt-2">
                <h4 className="text-sm font-bold text-indigo-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" /> Administrador Principal
                </h4>
                <p className="text-xs text-indigo-700">Crea el primer usuario con acceso de administrador para esta agencia.</p>
                
                <div className="grid gap-2">
                  <Input id="adminName" name="adminName" placeholder="Nombre Completo" />
                </div>
                <div className="grid gap-2">
                  <Input id="adminEmail" name="adminEmail" type="email" placeholder="Correo Electrónico" />
                </div>
                <div className="grid gap-2">
                  <Input id="adminPassword" name="adminPassword" type="password" placeholder="Contraseña Temporal" />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg bg-slate-50">
              <div className="space-y-0.5">
                <Label htmlFor="active" className="text-base">Estado de la Agencia</Label>
                <p className="text-xs text-muted-foreground">Si se desactiva, los agentes no podrán iniciar sesión.</p>
              </div>
              <Switch id="active" name="active" defaultChecked={agency ? agency.active : true} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {agency ? "Actualizar Agencia" : "Crear Agencia"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
