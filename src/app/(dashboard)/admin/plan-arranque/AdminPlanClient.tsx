"use client";

import { useState } from "react";
import { Plus, Edit, Trash2, Link as LinkIcon, FileText, Lock, Unlock, Users, PlusCircle, X, ArrowUp, ArrowDown } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createDay, updateDay, deleteDay, uploadPlanFile, reorderModule } from "./actions";
import { useToast } from "@/hooks/use-toast";

export function AdminPlanClient({ initialDays }: { initialDays: any[] }) {
  const { toast } = useToast();
  const [days, setDays] = useState(initialDays);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDay, setEditingDay] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const [formData, setFormData] = useState({
    dayNumber: "",
    title: "",
    instructions: "",
    videoUrls: [""],
    requiresAdminApproval: false,
    existingFiles: [] as {url: string, name: string}[],
    hasQuestionnaire: false,
    minPassingScore: "80",
  });

  const [questions, setQuestions] = useState<any[]>([]);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleOpenDialog = (day?: any) => {
    if (day) {
      setEditingDay(day);
      let parsedMedia = { videos: [], files: [] };
      if (day.additionalMediaJson) {
        try { parsedMedia = JSON.parse(day.additionalMediaJson); } catch (e) {}
      }
      
      const vids = [day.videoUrl, ...(parsedMedia.videos || [])].filter(Boolean);
      const fils = [];
      if (day.fileUrl) fils.push({ url: day.fileUrl, name: day.fileName || "Archivo" });
      fils.push(...(parsedMedia.files || []));

      setFormData({
        dayNumber: day.dayNumber.toString(),
        title: day.title,
        instructions: day.instructions || "",
        videoUrls: vids.length > 0 ? vids : [""],
        requiresAdminApproval: day.requiresAdminApproval,
        existingFiles: fils,
        hasQuestionnaire: day.hasQuestionnaire || false,
        minPassingScore: (day.minPassingScore || 80).toString(),
      });
      try {
        const parsed = day.questionnaireJson ? JSON.parse(day.questionnaireJson) : [];
        const fixed = parsed.map((q: any) => {
           // Auto-detect old workaround for open questions
           if (q.options.length === 0 || (q.options.length === 1 && q.options[0] === "")) {
               return { ...q, isOpenEnded: true, options: [] };
           }
           return q;
        });
        setQuestions(fixed);
      } catch (e) {
        setQuestions([]);
      }
    } else {
      setEditingDay(null);
      setFormData({
        dayNumber: (days.length + 1).toString(),
        title: "",
        instructions: "",
        videoUrls: [""],
        requiresAdminApproval: false,
        existingFiles: [],
        hasQuestionnaire: false,
        minPassingScore: "80",
      });
      setQuestions([]);
    }
    setSelectedFiles([]);
    setUploadProgress(0);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      toast({ title: "Iniciando guardado", description: "Preparando..." });
      let allFiles = [...formData.existingFiles];

      if (selectedFiles.length > 0) {
        toast({ title: "Subiendo archivo", description: "Iniciando upload seguro por servidor..." });
        for (let i = 0; i < selectedFiles.length; i++) {
          const file = selectedFiles[i];
          try {
            const fileFormData = new FormData();
            fileFormData.append("file", file);
            
            // Subir usando la acción de servidor, bypass total a @vercel/blob/client
            const uploadRes = await uploadPlanFile(fileFormData);
            
            if (uploadRes.success && uploadRes.url) {
              allFiles.push({ url: uploadRes.url, name: file.name });
              toast({ title: "Archivo subido", description: `Éxito: ${file.name}` });
            } else {
              throw new Error(uploadRes.error || "Error al subir archivo");
            }
          } catch (error: any) {
            toast({ title: "Error en la subida", description: error.message || `Error al subir ${file.name}`, variant: "destructive" });
            throw error; // Halt execution so it goes to the outer catch block and restores the button state
          }
        }
      }

      toast({ title: "Procesando formulario", description: "Guardando en base de datos..." });
      const cleanVideos = formData.videoUrls.filter(v => v.trim() !== "");
      const firstVideo = cleanVideos.length > 0 ? cleanVideos[0] : null;
      const restVideos = cleanVideos.length > 1 ? cleanVideos.slice(1) : [];

      const firstFile = allFiles.length > 0 ? allFiles[0] : null;
      const restFiles = allFiles.length > 1 ? allFiles.slice(1) : [];

      const dataToSave = {
        ...formData,
        videoUrl: firstVideo,
        fileUrl: firstFile ? firstFile.url : null,
        fileName: firstFile ? firstFile.name : null,
        additionalMediaJson: JSON.stringify({ videos: restVideos, files: restFiles }),
        minPassingScore: parseInt(formData.minPassingScore),
        questionnaireJson: formData.hasQuestionnaire ? JSON.stringify(questions) : null,
      };

      let newDay: any;
      if (editingDay) {
        newDay = await updateDay(editingDay.id, dataToSave);
        setDays(days.map(d => d.id === editingDay.id ? newDay : d));
        toast({ title: "Módulo actualizado correctamente" });
      } else {
        newDay = await createDay(dataToSave);
        setDays([...days, newDay].sort((a, b) => a.dayNumber - b.dayNumber));
        toast({ title: "Módulo creado correctamente" });
      }
      setIsDialogOpen(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de eliminar este módulo?")) {
      try {
        setIsLoading(true);
        await deleteDay(id);
        setDays(days.filter(d => d.id !== id));
        toast({ title: "Módulo eliminado" });
      } catch (error: any) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleReorder = async (id: string, direction: "up" | "down") => {
    if (isReordering) return;
    try {
      setIsReordering(true);
      const res = await reorderModule(id, direction);
      if (res.success) {
        // We will just reload the page to get the new order from the server properly
        window.location.reload();
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsReordering(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Plan de Arranque</h1>
          <p className="text-slate-500 dark:text-slate-400">Configura el plan de desarrollo paso a paso para tus agentes.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-900 dark:text-indigo-400">
            <Link href="/admin/plan-arranque/seguimiento">
              <Users className="h-4 w-4 mr-2" />
              Ver Avance de Agentes
            </Link>
          </Button>
          <Button onClick={() => handleOpenDialog()} className="bg-teal-600 hover:bg-teal-700 shadow-md">
            <Plus className="h-4 w-4 mr-2" />
            Añadir Módulo
          </Button>
        </div>
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
                <TableHead className="w-[80px]">Módulo</TableHead>
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
                    No hay módulos configurados.
                  </TableCell>
                </TableRow>
              ) : (
                days.map((day) => (
                  <TableRow key={day.id}>
                    <TableCell className="font-medium text-center bg-slate-50 dark:bg-zinc-900/50 w-12 border-r">{day.dayNumber}</TableCell>
                    <TableCell className="font-semibold">{day.title}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {(() => {
                           let vCount = day.videoUrl ? 1 : 0;
                           let fCount = day.fileUrl ? 1 : 0;
                           if (day.additionalMediaJson) {
                             try {
                               const p = JSON.parse(day.additionalMediaJson);
                               if (p.videos) vCount += p.videos.length;
                               if (p.files) fCount += p.files.length;
                             } catch(e) {}
                           }
                           return (
                             <>
                               {vCount > 0 && <span title={`${vCount} Video(s) vinculados`} className="flex items-center text-xs"><LinkIcon className="h-4 w-4 text-blue-500 mr-1" /> {vCount > 1 ? vCount : ''}</span>}
                               {fCount > 0 && <span title={`${fCount} Archivo(s) adjuntos`} className="flex items-center text-xs"><FileText className="h-4 w-4 text-orange-500 mr-1" /> {fCount > 1 ? fCount : ''}</span>}
                             </>
                           )
                        })()}
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
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" disabled={isReordering} onClick={() => handleReorder(day.id, 'up')}>
                          <ArrowUp className="h-4 w-4 text-slate-500 hover:text-teal-600" />
                        </Button>
                        <Button variant="ghost" size="icon" disabled={isReordering} onClick={() => handleReorder(day.id, 'down')}>
                          <ArrowDown className="h-4 w-4 text-slate-500 hover:text-teal-600" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(day)}>
                          <Edit className="h-4 w-4 text-slate-500 hover:text-teal-600" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(day.id)}>
                          <Trash2 className="h-4 w-4 text-slate-500 hover:text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingDay ? "Editar Módulo" : "Añadir Nuevo Módulo"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="dayNumber" className="text-right font-bold">Módulo No.</Label>
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
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right font-bold mt-2">YouTube URLs</Label>
              <div className="col-span-3 space-y-2">
                {formData.videoUrls.map((url, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      value={url}
                      onChange={(e) => {
                        const newUrls = [...formData.videoUrls];
                        newUrls[i] = e.target.value;
                        setFormData({ ...formData, videoUrls: newUrls });
                      }}
                      placeholder="https://youtube.com/watch?v=..."
                    />
                    <Button variant="outline" size="icon" onClick={() => {
                      const newUrls = formData.videoUrls.filter((_, idx) => idx !== i);
                      if (newUrls.length === 0) newUrls.push("");
                      setFormData({ ...formData, videoUrls: newUrls });
                    }}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="ghost" size="sm" onClick={() => setFormData({ ...formData, videoUrls: [...formData.videoUrls, ""] })}>
                  <PlusCircle className="h-4 w-4 mr-2" /> Añadir otro video
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right font-bold mt-2">Archivos (PDF/Office)</Label>
              <div className="col-span-3 space-y-2">
                <Input
                  type="file"
                  multiple
                  accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx"
                  onChange={(e) => {
                    if (e.target.files) {
                      const newFiles = Array.from(e.target.files);
                      const validFiles = newFiles.filter(f => f.size <= 10 * 1024 * 1024);
                      if (validFiles.length < newFiles.length) {
                        toast({ title: "Advertencia", description: "Algunos archivos exceden los 10MB y fueron omitidos.", variant: "destructive" });
                      }
                      if (formData.existingFiles.length + selectedFiles.length + validFiles.length > 5) {
                        toast({ title: "Error", description: "Máximo 5 archivos permitidos en total.", variant: "destructive" });
                        return;
                      }
                      setSelectedFiles([...selectedFiles, ...validFiles]);
                    }
                  }}
                />
                <p className="text-[10px] text-muted-foreground">Tamaño máximo: 10MB c/u. (Máximo 5)</p>
                <div className="space-y-1 mt-2">
                  {formData.existingFiles.map((f, i) => (
                     <div key={`exist-${i}`} className="flex items-center justify-between text-sm p-2 border rounded bg-slate-50 dark:bg-zinc-800">
                        <span className="truncate max-w-[200px]">{f.name}</span>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500" onClick={() => {
                          const newEx = formData.existingFiles.filter((_, idx) => idx !== i);
                          setFormData({ ...formData, existingFiles: newEx });
                        }}><X className="h-4 w-4" /></Button>
                     </div>
                  ))}
                  {selectedFiles.map((f, i) => (
                     <div key={`new-${i}`} className="flex items-center justify-between text-sm p-2 border rounded bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">
                        <span className="truncate max-w-[200px]">{f.name} (Nuevo)</span>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500" onClick={() => {
                          const newSel = selectedFiles.filter((_, idx) => idx !== i);
                          setSelectedFiles(newSel);
                        }}><X className="h-4 w-4" /></Button>
                     </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4 mt-2">
              <Label className="text-right font-bold">Candado</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="requiresApproval"
                  checked={formData.requiresAdminApproval}
                  onCheckedChange={(c) => setFormData({ ...formData, requiresAdminApproval: c })}
                />
                <Label htmlFor="requiresApproval" className="cursor-pointer">
                  Requerir aprobación del administrador para completar este día
                </Label>
              </div>

              <div className="flex items-center space-x-2 pt-2 border-t mt-4">
                <Switch
                  id="hasQuestionnaire"
                  checked={formData.hasQuestionnaire}
                  onCheckedChange={(c) => setFormData({ ...formData, hasQuestionnaire: c, requiresAdminApproval: c ? true : formData.requiresAdminApproval })}
                />
                <Label htmlFor="hasQuestionnaire" className="cursor-pointer font-bold text-indigo-700 dark:text-indigo-400">
                  Incluir Cuestionario de Evaluación
                </Label>
              </div>

              {formData.hasQuestionnaire && (
                <div className="col-span-4 p-4 border rounded-xl bg-slate-50 dark:bg-zinc-900/50 space-y-6">
                  <div className="flex items-center gap-4">
                    <Label className="font-bold whitespace-nowrap">Calificación mínima aprobatoria (%)</Label>
                    <Input
                      type="number"
                      value={formData.minPassingScore}
                      onChange={(e) => setFormData({ ...formData, minPassingScore: e.target.value })}
                      className="w-24"
                    />
                  </div>

                  {questions.map((q, qIndex) => (
                    <Card key={qIndex} className="p-4 relative">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-2 text-red-500"
                        onClick={() => {
                          const newQ = [...questions];
                          newQ.splice(qIndex, 1);
                          setQuestions(newQ);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Label className="font-bold">Pregunta {qIndex + 1}</Label>
                      <Input
                        value={q.question}
                        onChange={(e) => {
                          const newQ = [...questions];
                          newQ[qIndex].question = e.target.value;
                          setQuestions(newQ);
                        }}
                        className="mt-2 mb-4"
                        placeholder="Escribe la pregunta..."
                      />
                      
                      <div className="flex items-center space-x-2 mt-2 mb-4">
                        <Switch
                          checked={q.isOpenEnded || false}
                          onCheckedChange={(c) => {
                            const newQ = [...questions];
                            newQ[qIndex].isOpenEnded = c;
                            if (c) newQ[qIndex].options = [];
                            else newQ[qIndex].options = ["", "", "", ""];
                            setQuestions(newQ);
                          }}
                        />
                        <Label className="cursor-pointer font-semibold text-slate-600">Es una pregunta abierta (texto libre)</Label>
                      </div>

                      {!q.isOpenEnded ? (
                        <>
                          <Label className="font-bold text-sm text-slate-500">Opciones (Selecciona la correcta)</Label>
                          <div className="space-y-2 mt-2">
                            {q.options.map((opt: string, optIndex: number) => (
                              <div key={optIndex} className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  name={`correct-${qIndex}`}
                                  checked={q.correctOptionIndex === optIndex}
                                  onChange={() => {
                                    const newQ = [...questions];
                                    newQ[qIndex].correctOptionIndex = optIndex;
                                    setQuestions(newQ);
                                  }}
                                  className="w-4 h-4 text-indigo-600"
                                />
                                <Input
                                  value={opt}
                                  onChange={(e) => {
                                    const newQ = [...questions];
                                    newQ[qIndex].options[optIndex] = e.target.value;
                                    setQuestions(newQ);
                                  }}
                                  placeholder={`Opción ${optIndex + 1}`}
                                />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-400"
                                  onClick={() => {
                                    const newQ = [...questions];
                                    newQ[qIndex].options.splice(optIndex, 1);
                                    if (newQ[qIndex].correctOptionIndex >= newQ[qIndex].options.length) {
                                      newQ[qIndex].correctOptionIndex = 0;
                                    }
                                    setQuestions(newQ);
                                  }}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-2 text-xs"
                              onClick={() => {
                                const newQ = [...questions];
                                newQ[qIndex].options.push("");
                                setQuestions(newQ);
                              }}
                            >
                              <PlusCircle className="h-3 w-3 mr-1" /> Añadir Opción
                            </Button>
                          </div>
                        </>
                      ) : (
                        <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-md text-sm text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800">
                          <p>El agente responderá con texto libre en esta pregunta.</p>
                          <p className="mt-1 font-semibold">Nota: Esta pregunta no se califica automáticamente. Tendrás que evaluarla manualmente al revisar el avance.</p>
                        </div>
                      )}
                    </Card>
                  ))}

                  <Button
                    variant="outline"
                    className="w-full border-dashed border-2 text-indigo-600"
                    onClick={() => setQuestions([...questions, { question: "", options: ["", "", "", ""], correctOptionIndex: 0 }])}
                  >
                    <Plus className="h-4 w-4 mr-2" /> Añadir Nueva Pregunta
                  </Button>
                </div>
              )}
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
