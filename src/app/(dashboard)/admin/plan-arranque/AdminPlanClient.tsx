"use client";

import { useState } from "react";
import { Plus, Edit, Trash2, Link as LinkIcon, FileText, Lock, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createDay, updateDay, deleteDay, uploadPlanFile } from "./actions";
import { useToast } from "@/hooks/use-toast";

export function AdminPlanClient({ initialDays }: { initialDays: any[] }) {
  const { toast } = useToast();
  const [days, setDays] = useState(initialDays);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDay, setEditingDay] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const [formData, setFormData] = useState({
    dayNumber: "",
    title: "",
    instructions: "",
    videoUrl: "",
    requiresAdminApproval: false,
    fileUrl: "",
    fileName: "",
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleOpenDialog = (day?: any) => {
    if (day) {
      setEditingDay(day);
      setFormData({
        dayNumber: day.dayNumber.toString(),
        title: day.title,
        instructions: day.instructions || "",
        videoUrl: day.videoUrl || "",
        requiresAdminApproval: day.requiresAdminApproval,
        fileUrl: day.fileUrl || "",
        fileName: day.fileName || "",
      });
    } else {
      setEditingDay(null);
      setFormData({
        dayNumber: (days.length + 1).toString(),
        title: "",
        instructions: "",
        videoUrl: "",
        requiresAdminApproval: false,
        fileUrl: "",
        fileName: "",
      });
    }
    setSelectedFile(null);
    setUploadProgress(0);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      let uploadedFileUrl = formData.fileUrl;
      let uploadedFileName = formData.fileName;

      if (selectedFile) {
        try {
          // 1. Obtener el client token del servidor
          const tokenRes = await fetch(`/api/upload?filename=${encodeURIComponent(selectedFile.name)}`, {
            method: "POST",
          });
          
          if (!tokenRes.ok) {
            const errData = await tokenRes.json().catch(() => ({}));
            throw new Error(errData.error || `Error HTTP: ${tokenRes.status}`);
          }
          
          const { clientToken, pathname } = await tokenRes.json();
          if (!clientToken || !pathname) throw new Error("No se pudo obtener el token de subida o el pathname");

          // 2. Subir directamente a Vercel usando el client token
          const { put } = await import('@vercel/blob/client');
          const newBlob = await put(pathname, selectedFile, {
            access: 'public',
            token: clientToken,
            onUploadProgress: (progressEvent) => {
              if (progressEvent.percentage) {
                setUploadProgress(progressEvent.percentage);
              }
            }
          });
          
          uploadedFileUrl = newBlob.url;
          uploadedFileName = selectedFile.name;
        } catch (error: any) {
          toast({ title: "Error", description: error.message || "Error al subir el archivo", variant: "destructive" });
          setIsLoading(false);
          setUploadProgress(0);
          return;
        }
      }

      const dataToSave = {
        ...formData,
        fileUrl: uploadedFileUrl,
        fileName: uploadedFileName,
      };

      let newDay: any;
      if (editingDay) {
        newDay = await updateDay(editingDay.id, dataToSave);
        setDays(days.map(d => d.id === editingDay.id ? newDay : d));
        toast({ title: "Día actualizado correctamente" });
      } else {
        newDay = await createDay(dataToSave);
        setDays([...days, newDay].sort((a, b) => a.dayNumber - b.dayNumber));
        toast({ title: "Día creado correctamente" });
      }
      setIsDialogOpen(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de eliminar este día?")) {
      try {
        setIsLoading(true);
        await deleteDay(id);
        setDays(days.filter(d => d.id !== id));
        toast({ title: "Día eliminado" });
      } catch (error: any) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Plan de Arranque</h1>
          <p className="text-slate-500 dark:text-slate-400">Configura el plan de desarrollo paso a paso para tus agentes.</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="bg-teal-600 hover:bg-teal-700">
          <Plus className="h-4 w-4 mr-2" />
          Añadir Día
        </Button>
      </div>

      <Card className="border-0 shadow-lg shadow-slate-200/50 dark:shadow-none dark:border dark:border-zinc-800">
        <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/50 border-b border-slate-100 dark:border-zinc-800">
          <CardTitle>Temario del Plan</CardTitle>
          <CardDescription>Visualiza y organiza los días de entrenamiento.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Día</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Recursos</TableHead>
                <TableHead className="text-center">Candado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {days.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                    No hay días configurados.
                  </TableCell>
                </TableRow>
              ) : (
                days.map((day) => (
                  <TableRow key={day.id}>
                    <TableCell className="font-medium text-center bg-slate-50 dark:bg-zinc-900/50 w-12 border-r">{day.dayNumber}</TableCell>
                    <TableCell className="font-semibold">{day.title}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {day.videoUrl && <span title="Video vinculado"><LinkIcon className="h-4 w-4 text-blue-500" /></span>}
                        {day.fileUrl && <span title={day.fileName || "Archivo adjunto"}><FileText className="h-4 w-4 text-orange-500" /></span>}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {day.requiresAdminApproval ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-500">
                          <Lock className="h-3 w-3 mr-1" />
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-slate-400">
                          <Unlock className="h-3 w-3 mr-1" />
                          No
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(day)}>
                        <Edit className="h-4 w-4 text-slate-500 hover:text-teal-600" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(day.id)}>
                        <Trash2 className="h-4 w-4 text-slate-500 hover:text-red-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingDay ? "Editar Día" : "Añadir Nuevo Día"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="dayNumber" className="text-right font-bold">Día No.</Label>
              <Input
                id="dayNumber"
                type="number"
                value={formData.dayNumber}
                onChange={(e) => setFormData({ ...formData, dayNumber: e.target.value })}
                className="col-span-1"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right font-bold">Título</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="col-span-3"
                placeholder="Ej: Curso Onboarding"
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="instructions" className="text-right font-bold mt-2">Instrucciones</Label>
              <textarea
                id="instructions"
                value={formData.instructions}
                onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                className="col-span-3 flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Metas del día, qué estudiar, llamadas a realizar, etc..."
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="videoUrl" className="text-right font-bold">YouTube URL</Label>
              <Input
                id="videoUrl"
                value={formData.videoUrl}
                onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                className="col-span-3"
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right font-bold">Archivo (PDF/PPT)</Label>
              <div className="col-span-3 space-y-2">
                <Input
                  type="file"
                  accept=".pdf,.ppt,.pptx"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 10 * 1024 * 1024) {
                        toast({ title: "Error", description: "El archivo no puede exceder 10MB", variant: "destructive" });
                        e.target.value = "";
                        return;
                      }
                      setSelectedFile(file);
                    }
                  }}
                />
                {formData.fileName && !selectedFile && (
                  <p className="text-xs text-muted-foreground">Actual: {formData.fileName}</p>
                )}
                <p className="text-[10px] text-muted-foreground">Tamaño máximo: 10MB</p>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4 mt-2">
              <Label className="text-right font-bold">Candado</Label>
              <div className="col-span-3 flex items-center space-x-2">
                <Switch
                  checked={formData.requiresAdminApproval}
                  onCheckedChange={(checked) => setFormData({ ...formData, requiresAdminApproval: checked })}
                />
                <Label className="text-sm text-slate-500 font-normal">
                  Requiere aprobación del promotor para avanzar al siguiente día.
                </Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isLoading || !formData.title || !formData.dayNumber} className="bg-teal-600 hover:bg-teal-700">
              {isLoading ? (uploadProgress > 0 ? `Subiendo... ${uploadProgress}%` : "Guardando...") : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
