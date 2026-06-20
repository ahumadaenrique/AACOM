"use client";

import { useState } from "react";
import { updateAgencySettings, uploadAgencyLogo } from "@/app/actions/agencyActions";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Upload, Image as ImageIcon } from "lucide-react";

interface Props {
  slug: string;
  initialName: string;
  initialColor: string;
  initialLogo: string | null;
}

export default function AgencySettingsForm({ slug, initialName, initialColor, initialLogo }: Props) {
  const { toast } = useToast();
  
  const [name, setName] = useState(initialName);
  const [color, setColor] = useState(initialColor);
  const [logoPreview, setLogoPreview] = useState<string | null>(initialLogo);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      const res = await updateAgencySettings(slug, { name, primaryColor: color });
      if (res.success) {
        toast({ title: "Guardado exitoso", description: "La configuración ha sido actualizada. Recarga la página para ver todos los cambios aplicados globalmente." });
      }
    } catch (e) {
      toast({ title: "Error", description: "No se pudo guardar la configuración", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Archivo inválido", description: "Sube un archivo de imagen válido", variant: "destructive" });
      return;
    }

    try {
      setIsUploading(true);
      
      // Update local preview immediately
      const objectUrl = URL.createObjectURL(file);
      setLogoPreview(objectUrl);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("slug", slug);

      const res = await uploadAgencyLogo(formData);
      if (res.success) {
        toast({ title: "Logo actualizado", description: "El logotipo se ha subido exitosamente." });
      } else {
        throw new Error(res.error);
      }
    } catch (e) {
      toast({ title: "Error", description: "No se pudo subir el logotipo. ¿Tienes Vercel Blob configurado correctamente?", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Settings Form */}
      <Card>
        <CardHeader>
          <CardTitle>Identidad Visual</CardTitle>
          <CardDescription>Actualiza el nombre y color de tu marca.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="agency-name">Nombre de la Agencia</Label>
            <Input 
              id="agency-name" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="Ej. AACOM Seguros" 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="agency-color">Color Primario</Label>
            <div className="flex items-center gap-3">
              <Input 
                id="agency-color" 
                type="color" 
                value={color} 
                onChange={(e) => setColor(e.target.value)} 
                className="w-16 h-12 p-1 cursor-pointer"
              />
              <Input 
                value={color} 
                onChange={(e) => setColor(e.target.value)} 
                className="font-mono uppercase flex-1"
                placeholder="#000000"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Este color se usará en botones, menús y elementos destacados.</p>
          </div>
        </CardContent>
        <CardFooter className="bg-slate-50 dark:bg-zinc-900 border-t px-6 py-4">
          <Button onClick={handleSaveSettings} disabled={isSaving} className="w-full sm:w-auto ml-auto" style={{ backgroundColor: color }}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar Cambios
          </Button>
        </CardFooter>
      </Card>

      {/* Logo Upload Form */}
      <Card>
        <CardHeader>
          <CardTitle>Logotipo</CardTitle>
          <CardDescription>Sube el logo de tu agencia (recomendado PNG transparente).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 flex flex-col items-center justify-center">
          
          <div className="w-full flex items-center justify-center p-6 border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50/50 dark:bg-zinc-900/50 relative">
            {logoPreview ? (
              <img src={logoPreview} alt="Logo Preview" className="h-20 w-auto max-w-full object-contain" />
            ) : (
              <div className="flex flex-col items-center text-slate-400 gap-2">
                <ImageIcon className="h-10 w-10" />
                <span className="text-sm">Sin logotipo</span>
              </div>
            )}
            {isUploading && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center rounded-xl z-10">
                <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
              </div>
            )}
          </div>

          <div className="w-full">
            <Label htmlFor="logo-upload" className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900 transition-colors">
              <Upload className="h-4 w-4" />
              Seleccionar Nueva Imagen
            </Label>
            <Input 
              id="logo-upload" 
              type="file" 
              accept="image/*" 
              onChange={handleFileChange} 
              className="hidden" 
              disabled={isUploading}
            />
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
