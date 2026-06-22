"use client";

import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { 
    Activity, Target, BrainCircuit, CheckCircle2, 
    CalendarClock, Plus, TrendingUp, AlertTriangle, FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getCurrentWeekStats, submitPerformanceReview, getPerformanceReviews, authorizeReview } from "./actions";

export default function PeaPrpClient({ userRole }: { userRole: string }) {
    const { toast } = useToast();
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Formulario Nueva Evaluación
    const [openNew, setOpenNew] = useState(false);
    const [statsLoading, setStatsLoading] = useState(false);
    const [formLoading, setFormLoading] = useState(false);
    
    // Auto-calculados
    const [puntosActividad, setPuntosActividad] = useState(0);
    const [adnsRealizados, setAdnsRealizados] = useState(0);
    
    // Captura manual
    const [metaPrimasMensual, setMetaPrimasMensual] = useState("");
    const [avancePrimasActual, setAvancePrimasActual] = useState("");
    const [compromisos, setCompromisos] = useState("");

    const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';

    const loadReviews = async () => {
        setLoading(true);
        const res = await getPerformanceReviews();
        if (res.success) {
            setReviews(res.reviews || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadReviews();
    }, []);

    // Al abrir el modal, auto-calcular la semana
    const handleOpenNewModal = async (open: boolean) => {
        setOpenNew(open);
        if (open) {
            setStatsLoading(true);
            const res = await getCurrentWeekStats();
            if (res.success) {
                setPuntosActividad(res.points || 0);
                setAdnsRealizados(res.adns || 0);
            }
            setStatsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormLoading(true);
        const res = await submitPerformanceReview({
            metaPrimasMensual: Number(metaPrimasMensual),
            avancePrimasActual: Number(avancePrimasActual),
            puntosActividad,
            adnsRealizados,
            compromisos
        });
        
        if (res.success) {
            toast({ title: "Evaluación enviada", description: "La Inteligencia Artificial ha procesado tu reporte." });
            setOpenNew(false);
            setMetaPrimasMensual("");
            setAvancePrimasActual("");
            setCompromisos("");
            loadReviews();
        } else {
            toast({ title: "Error", description: res.message, variant: "destructive" });
        }
        setFormLoading(false);
    };

    const handleAuthorize = async (id: string) => {
        if (!confirm("¿Deseas autorizar formalmente esta evaluación semanal?")) return;
        const res = await authorizeReview(id);
        if (res.success) {
            toast({ title: "Evaluación Autorizada", description: "El registro ha sido validado exitosamente." });
            loadReviews();
        } else {
            toast({ title: "Error", description: res.message, variant: "destructive" });
        }
    };

    return (
        <div className="flex flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight flex items-center gap-2">
                        <Target className="h-8 w-8 text-indigo-600" />
                        Desempeño Operativo
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Motor de Inteligencia Artificial para la gestión del ciclo de vida (PEA/PRP)
                    </p>
                </div>
                
                {!isAdmin && (
                    <Dialog open={openNew} onOpenChange={handleOpenNewModal}>
                        <DialogTrigger asChild>
                            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-200 dark:shadow-none">
                                <Plus className="mr-2 h-4 w-4" /> Enviar Reporte Semanal
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <form onSubmit={handleSubmit}>
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2 text-xl">
                                        <Activity className="h-5 w-5 text-indigo-500" /> Reporte de Actividad
                                    </DialogTitle>
                                    <DialogDescription>
                                        El sistema ha extraído automáticamente tu actividad semanal. Captura tu avance financiero.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-3 rounded-lg text-center">
                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Puntos Semana</p>
                                            {statsLoading ? <div className="animate-pulse h-8 bg-slate-200 dark:bg-zinc-800 rounded w-16 mx-auto"></div> : 
                                            <p className={`text-2xl font-black ${puntosActividad >= 125 ? 'text-teal-600' : 'text-amber-600'}`}>{puntosActividad}</p>}
                                        </div>
                                        <div className="bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-3 rounded-lg text-center">
                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">ADN's Creados</p>
                                            {statsLoading ? <div className="animate-pulse h-8 bg-slate-200 dark:bg-zinc-800 rounded w-16 mx-auto"></div> : 
                                            <p className={`text-2xl font-black ${adnsRealizados >= 10 ? 'text-teal-600' : 'text-amber-600'}`}>{adnsRealizados}</p>}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="meta">Meta Mensual ($)</Label>
                                            <Input id="meta" type="number" required placeholder="Ej. 150000" value={metaPrimasMensual} onChange={(e) => setMetaPrimasMensual(e.target.value)} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="avance">Avance Actual ($)</Label>
                                            <Input id="avance" type="number" required placeholder="Ej. 45000" value={avancePrimasActual} onChange={(e) => setAvancePrimasActual(e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="compromisos">Compromisos y Notas (Opcional)</Label>
                                        <textarea id="compromisos" placeholder="Detalla aquí los acuerdos cualitativos o prospectos clave..." value={compromisos} onChange={(e) => setCompromisos(e.target.value)} className="flex w-full rounded-md border border-slate-200 dark:border-zinc-800 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 resize-none h-20" />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setOpenNew(false)}>Cancelar</Button>
                                    <Button type="submit" disabled={formLoading || statsLoading} className="bg-indigo-600 hover:bg-indigo-700">
                                        {formLoading ? "Procesando con IA..." : "Evaluar y Enviar"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            {loading ? (
                <div className="grid gap-6 md:grid-cols-2">
                    {[1,2,3,4].map(i => <div key={i} className="h-64 rounded-xl bg-slate-100 dark:bg-zinc-900 animate-pulse" />)}
                </div>
            ) : reviews.length === 0 ? (
                <div className="text-center p-12 border-2 border-dashed rounded-2xl bg-slate-50/50 dark:bg-zinc-900/50 text-muted-foreground flex flex-col items-center">
                    <BrainCircuit className="h-12 w-12 mb-4 text-slate-300 dark:text-zinc-700" />
                    <p className="text-lg font-medium text-slate-700 dark:text-zinc-300">No hay evaluaciones registradas</p>
                    <p className="text-sm">Los reportes enviados aparecerán aquí junto con el dictamen de IA.</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {reviews.map((rev) => (
                        <Card key={rev.id} className="overflow-hidden border-2 transition-all hover:border-indigo-200 dark:hover:border-indigo-900 shadow-md">
                            <div className="flex flex-col md:flex-row">
                                {/* Datos Duros - Lateral Izquierdo */}
                                <div className="bg-slate-50 dark:bg-zinc-900/50 p-6 md:w-1/3 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-200 dark:border-zinc-800">
                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                            <Badge variant="outline" className="font-bold border-indigo-200 text-indigo-700 dark:border-indigo-800 dark:text-indigo-400">
                                                {format(new Date(rev.createdAt), "dd MMM yyyy", { locale: es })}
                                            </Badge>
                                            {rev.status === 'REVIEWED' ? (
                                                <Badge className="bg-teal-100 text-teal-800 hover:bg-teal-100 border border-teal-200"><CheckCircle2 className="w-3 h-3 mr-1" /> Autorizado</Badge>
                                            ) : (
                                                <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-100 border border-amber-200"><CalendarClock className="w-3 h-3 mr-1" /> Pendiente</Badge>
                                            )}
                                        </div>
                                        <h3 className="text-lg font-black">{isAdmin ? rev.agent.name : "Tu Reporte"}</h3>
                                        <div className="mt-4 space-y-3">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-muted-foreground flex items-center gap-1"><Target className="w-4 h-4"/> Meta:</span>
                                                <span className="font-bold">${rev.metaPrimasMensual.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-muted-foreground flex items-center gap-1"><TrendingUp className="w-4 h-4"/> Avance:</span>
                                                <span className="font-bold">${rev.avancePrimasActual.toLocaleString()}</span>
                                            </div>
                                            <div className="h-2 w-full bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden mt-1">
                                                <div className="h-full bg-indigo-500" style={{ width: `${Math.min(100, (rev.avancePrimasActual / rev.metaPrimasMensual) * 100)}%` }}></div>
                                            </div>
                                            <div className="flex justify-between items-center text-sm pt-2">
                                                <span className="text-muted-foreground flex items-center gap-1"><Activity className="w-4 h-4"/> Puntos:</span>
                                                <span className={`font-black ${rev.puntosActividad >= 125 ? 'text-teal-600' : 'text-red-500'}`}>{rev.puntosActividad} / 125</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-muted-foreground flex items-center gap-1"><FileText className="w-4 h-4"/> ADNs:</span>
                                                <span className={`font-black ${rev.adnsRealizados >= 10 ? 'text-teal-600' : 'text-red-500'}`}>{rev.adnsRealizados} / 10</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {isAdmin && rev.status === 'PENDING' && (
                                        <Button onClick={() => handleAuthorize(rev.id)} className="w-full mt-6 bg-teal-600 hover:bg-teal-700">
                                            <CheckCircle2 className="w-4 h-4 mr-2" /> Autorizar
                                        </Button>
                                    )}
                                </div>

                                {/* Dictamen IA - Lateral Derecho */}
                                <div className="p-6 md:w-2/3">
                                    <div className="flex items-center gap-2 mb-4">
                                        <BrainCircuit className="w-5 h-5 text-indigo-600" />
                                        <h3 className="font-bold text-slate-800 dark:text-zinc-200">Dictamen de Inteligencia Artificial</h3>
                                    </div>
                                    <div 
                                        className="text-sm prose prose-slate dark:prose-invert max-w-none"
                                        dangerouslySetInnerHTML={{ __html: rev.aiAnalysisResult || "<p>Sin análisis.</p>" }} 
                                    />
                                    {rev.compromisos && (
                                        <div className="mt-4 p-3 bg-slate-100 dark:bg-zinc-800 rounded border-l-4 border-slate-400">
                                            <p className="text-xs font-bold text-slate-500 uppercase mb-1">Notas del Agente</p>
                                            <p className="text-sm italic">{rev.compromisos}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
