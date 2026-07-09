"use client";

import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { 
    Activity, Target, BrainCircuit, CheckCircle2, 
    CalendarClock, Plus, TrendingUp, AlertTriangle, FileText, BarChart3, Archive
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { getCurrentMonthStats, submitPerformanceReview, getPerformanceReviews, authorizeReview, rejectReview, deleteReview } from "./actions";

// Recharts
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';

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
    const [expectedPuntos, setExpectedPuntos] = useState(0);
    const [expectedAdns, setExpectedAdns] = useState(0);
    
    // Captura manual
    const getCurrentMonthName = () => {
        const date = new Date();
        const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        return monthNames[date.getMonth()];
    };
    const [evalMonth, setEvalMonth] = useState(getCurrentMonthName());
    const [evalWeek, setEvalWeek] = useState("Semana 1");
    const [metaPrimasMensual, setMetaPrimasMensual] = useState("");
    const [avancePrimasActual, setAvancePrimasActual] = useState("");
    const [compromisos, setCompromisos] = useState("");
    const [editingReviewId, setEditingReviewId] = useState<string | null>(null);

    // Rechazo State
    const [rejectingId, setRejectingId] = useState<string | null>(null);
    const [rejectFeedback, setRejectFeedback] = useState("");

    // Modal de Lectura de Dictamen IA para la Tabla
    const [readingReview, setReadingReview] = useState<any>(null);

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

    const loadStats = async () => {
        setStatsLoading(true);
        const res = await getCurrentMonthStats();
        if (res.success) {
            setPuntosActividad(res.points || 0);
            setAdnsRealizados(res.adns || 0);
            setExpectedPuntos(res.expectedPoints || 0);
            setExpectedAdns(res.expectedAdns || 0);
        }
        setStatsLoading(false);
    };

    const handleOpenNewModal = (open: boolean) => {
        setOpenNew(open);
        if (open) {
            if (!editingReviewId) {
                loadStats();
                setEvalMonth(getCurrentMonthName());
                setEvalWeek("Semana 1");
                setMetaPrimasMensual("");
                setAvancePrimasActual("");
                setCompromisos("");
            }
        } else {
            setEditingReviewId(null);
        }
    };

    const handleEdit = (rev: any) => {
        setEditingReviewId(rev.id);
        setEvalMonth(rev.evalMonth || getCurrentMonthName());
        setEvalWeek(rev.evalWeek || "Semana 1");
        setMetaPrimasMensual(rev.metaPrimasMensual.toString());
        setAvancePrimasActual(rev.avancePrimasActual.toString());
        setCompromisos(rev.compromisos || "");
        loadStats();
        setOpenNew(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormLoading(true);
        const res = await submitPerformanceReview({
            reviewId: editingReviewId || undefined,
            evalMonth,
            evalWeek,
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

    const handleDeleteReview = async (id: string) => {
        if (!confirm("¿Estás seguro de eliminar permanentemente este reporte? Esta acción no se puede deshacer.")) return;
        const res = await deleteReview(id);
        if (res.success) {
            toast({ title: "Reporte Eliminado", description: "El reporte ha sido eliminado permanentemente de la base de datos." });
            loadReviews();
        } else {
            toast({ title: "Error", description: res.message, variant: "destructive" });
        }
    };

    const submitReject = async () => {
        if (!rejectingId || !rejectFeedback) return;
        const res = await rejectReview(rejectingId, rejectFeedback);
        if (res.success) {
            toast({ title: "Evaluación Rechazada", description: "Se ha devuelto la evaluación al agente con tus comentarios." });
            setRejectingId(null);
            setRejectFeedback("");
            loadReviews();
        } else {
            toast({ title: "Error", description: res.message, variant: "destructive" });
        }
    };

    // --- Lógica de Vistas (Tabs) ---
    const pendingReviews = reviews.filter(r => r.status === 'PENDING' || r.status === 'REJECTED');
    const historyReviews = reviews.filter(r => r.status === 'REVIEWED');

    // Preparar datos para gráfica (Cronológico, más antiguo primero)
    const chartData = [...historyReviews].reverse().map(r => ({
        name: format(new Date(r.createdAt), "dd MMM", { locale: es }),
        Puntos: r.puntosActividad,
        ADNs: r.adnsRealizados,
        agente: r.agent.name
    }));

    // Componente reutilizable para las tarjetas pendientes
    const renderPendingCard = (rev: any) => (
        <Card key={rev.id} className="overflow-hidden border-2 transition-all hover:border-indigo-200 dark:hover:border-indigo-900 shadow-md">
            <div className="flex flex-col md:flex-row">
                {/* Datos Duros */}
                <div className="bg-slate-50 dark:bg-zinc-900/50 p-6 md:w-1/3 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-200 dark:border-zinc-800">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <Badge variant="outline" className="font-bold border-indigo-200 text-indigo-700 dark:border-indigo-800 dark:text-indigo-400">
                                {format(new Date(rev.createdAt), "dd MMM yyyy", { locale: es })}
                            </Badge>
                            {rev.status === 'REJECTED' ? (
                                <Badge variant="destructive" className="border-red-200"><Activity className="w-3 h-3 mr-1" /> Rechazado</Badge>
                            ) : (
                                <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-100 border border-amber-200"><CalendarClock className="w-3 h-3 mr-1" /> Pendiente</Badge>
                            )}
                        </div>
                        <h3 className="text-lg font-black">{isAdmin ? rev.agent.name : "Tu Reporte"}</h3>
                        <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 mb-2">
                            {rev.evalMonth || "Mes Actual"} - {rev.evalWeek || "Corte de Mes"}
                        </p>
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
                                <span className="font-black text-slate-700 dark:text-zinc-300">{rev.puntosActividad}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground flex items-center gap-1"><FileText className="w-4 h-4"/> ADNs:</span>
                                <span className="font-black text-slate-700 dark:text-zinc-300">{rev.adnsRealizados}</span>
                            </div>
                        </div>
                    </div>
                    
                    {!isAdmin && (rev.status === 'PENDING' || rev.status === 'REJECTED') && (
                        <Button onClick={() => handleEdit(rev)} variant="outline" className="w-full mt-6 border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                            Editar Reporte
                        </Button>
                    )}

                    {isAdmin && (
                        <div className="flex flex-col gap-2 mt-6">
                            {rev.status === 'PENDING' && (
                                <>
                                    <Button onClick={() => handleAuthorize(rev.id)} className="w-full bg-teal-600 hover:bg-teal-700">
                                        <CheckCircle2 className="w-4 h-4 mr-2" /> Autorizar
                                    </Button>
                                    <Button onClick={() => setRejectingId(rev.id)} variant="outline" className="w-full text-red-600 hover:bg-red-50 border-red-200">
                                        Rechazar
                                    </Button>
                                </>
                            )}
                            <Button onClick={() => handleDeleteReview(rev.id)} variant="destructive" className="w-full">
                                Eliminar Reporte
                            </Button>
                        </div>
                    )}
                </div>

                {/* Dictamen IA */}
                <div className="p-6 md:w-2/3 flex flex-col justify-between">
                    <div>
                        {rev.status === 'REJECTED' && rev.feedback && (
                            <div className="mb-4 p-4 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-900">
                                <h3 className="text-red-800 dark:text-red-400 font-bold flex items-center gap-2 mb-1">
                                    <Activity className="w-4 h-4" /> Observaciones del Administrador
                                </h3>
                                <p className="text-sm text-red-700 dark:text-red-300">{rev.feedback}</p>
                            </div>
                        )}

                        <div className="flex items-center gap-2 mb-4">
                            <BrainCircuit className="w-5 h-5 text-indigo-600" />
                            <h3 className="font-bold text-slate-800 dark:text-zinc-200">Dictamen de Inteligencia Artificial</h3>
                        </div>
                        <div 
                            className="text-sm prose prose-slate dark:prose-invert max-w-none max-h-64 overflow-y-auto"
                            dangerouslySetInnerHTML={{ __html: rev.aiAnalysisResult || "<p>Sin análisis.</p>" }} 
                        />
                    </div>
                    
                    {rev.compromisos && (
                        <div className="mt-4 p-3 bg-slate-100 dark:bg-zinc-800 rounded border-l-4 border-slate-400">
                            <p className="text-xs font-bold text-slate-500 uppercase mb-1">Notas del Agente</p>
                            <p className="text-sm italic">{rev.compromisos}</p>
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );

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
                                        <div className="space-y-2">
                                            <Label htmlFor="evalMonth">Mes de la Meta</Label>
                                            <select id="evalMonth" value={evalMonth} onChange={(e) => setEvalMonth(e.target.value)} className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 dark:border-zinc-800 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50">
                                                {["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"].map(m => (
                                                    <option key={m} value={m} className="dark:bg-zinc-950">{m}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="evalWeek">Corte a Evaluar</Label>
                                            <select id="evalWeek" value={evalWeek} onChange={(e) => setEvalWeek(e.target.value)} className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 dark:border-zinc-800 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50">
                                                {["Semana 1", "Semana 2", "Semana 3", "Semana 4", "Cierre de Mes"].map(w => (
                                                    <option key={w} value={w} className="dark:bg-zinc-950">{w}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-3 rounded-lg text-center">
                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Acumulado Mes (Pts)</p>
                                            {statsLoading ? <div className="animate-pulse h-8 bg-slate-200 dark:bg-zinc-800 rounded w-16 mx-auto"></div> : 
                                            <div>
                                                <p className={`text-2xl font-black ${puntosActividad >= expectedPuntos ? 'text-teal-600' : 'text-amber-600'}`}>{puntosActividad}</p>
                                                <p className="text-xs text-muted-foreground mt-1">Esperado hoy: {expectedPuntos}</p>
                                            </div>}
                                        </div>
                                        <div className="bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-3 rounded-lg text-center">
                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Acumulado Mes (ADN)</p>
                                            {statsLoading ? <div className="animate-pulse h-8 bg-slate-200 dark:bg-zinc-800 rounded w-16 mx-auto"></div> : 
                                            <div>
                                                <p className={`text-2xl font-black ${adnsRealizados >= expectedAdns ? 'text-teal-600' : 'text-amber-600'}`}>{adnsRealizados}</p>
                                                <p className="text-xs text-muted-foreground mt-1">Esperado hoy: {expectedAdns}</p>
                                            </div>}
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
                <div className="h-64 rounded-xl bg-slate-100 dark:bg-zinc-900 animate-pulse" />
            ) : (
                <Tabs defaultValue="dashboard" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 max-w-md bg-slate-100/50 dark:bg-zinc-900/50 p-1 rounded-xl mb-6">
                        <TabsTrigger value="dashboard" className="rounded-lg font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-950 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 data-[state=active]:shadow-sm">
                            <BarChart3 className="w-4 h-4 mr-2" /> Dashboard
                        </TabsTrigger>
                        <TabsTrigger value="history" className="rounded-lg font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-950 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 data-[state=active]:shadow-sm">
                            <Archive className="w-4 h-4 mr-2" /> Archivo Histórico
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="dashboard" className="space-y-6">
                        {/* CHART SECTION */}
                        {historyReviews.length > 0 && (
                            <Card className="border-2 shadow-sm">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5 text-indigo-500" />
                                        Tendencia de Desempeño
                                    </CardTitle>
                                    <CardDescription>
                                        Análisis visual de los reportes autorizados.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="h-[300px] mt-4">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                            <XAxis 
                                                dataKey="name" 
                                                axisLine={false} 
                                                tickLine={false} 
                                                tick={{ fill: '#64748b', fontSize: 12 }} 
                                                dy={10}
                                            />
                                            <YAxis 
                                                yAxisId="left"
                                                axisLine={false} 
                                                tickLine={false} 
                                                tick={{ fill: '#64748b', fontSize: 12 }} 
                                            />
                                            <YAxis 
                                                yAxisId="right" 
                                                orientation="right" 
                                                axisLine={false} 
                                                tickLine={false} 
                                                tick={{ fill: '#64748b', fontSize: 12 }} 
                                            />
                                            <RechartsTooltip 
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
                                            />
                                            <Legend verticalAlign="top" height={36}/>
                                            <Line yAxisId="left" type="monotone" name="Puntos Operativos" dataKey="Puntos" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                            <Line yAxisId="right" type="monotone" name="ADN's Realizados" dataKey="ADNs" stroke="#14b8a6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        )}

                        {/* PENDING ACTIONS SECTION */}
                        <div className="pt-4">
                            <h2 className="text-lg font-black text-slate-800 dark:text-zinc-100 flex items-center gap-2 mb-4">
                                <AlertTriangle className="w-5 h-5 text-amber-500" />
                                {isAdmin ? "Bandeja de Aprobación" : "Requieren tu Atención"}
                            </h2>
                            {pendingReviews.length === 0 ? (
                                <div className="text-center p-8 border-2 border-dashed rounded-2xl bg-slate-50/50 dark:bg-zinc-900/50 text-muted-foreground">
                                    <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-teal-400" />
                                    <p className="font-medium text-slate-700 dark:text-zinc-300">¡Todo al día!</p>
                                    <p className="text-sm">No hay reportes pendientes de revisión.</p>
                                </div>
                            ) : (
                                <div className="grid gap-6">
                                    {pendingReviews.map(renderPendingCard)}
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="history">
                        <Card className="border-2 shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Archive className="w-5 h-5 text-slate-500" />
                                    Archivo Histórico
                                </CardTitle>
                                <CardDescription>
                                    Registro tabular de todos los reportes previamente autorizados.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {historyReviews.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground text-sm">
                                        Aún no hay reportes autorizados en el historial.
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className="text-xs text-slate-500 dark:text-zinc-400 uppercase bg-slate-50 dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800">
                                                <tr>
                                                    <th className="px-4 py-3 font-bold">Fecha</th>
                                                    {isAdmin && <th className="px-4 py-3 font-bold">Agente</th>}
                                                    <th className="px-4 py-3 font-bold text-center">Puntos</th>
                                                    <th className="px-4 py-3 font-bold text-center">ADNs</th>
                                                    <th className="px-4 py-3 font-bold text-right">Meta ($)</th>
                                                    <th className="px-4 py-3 font-bold text-right">Avance ($)</th>
                                                    <th className="px-4 py-3 font-bold text-center">Detalle IA</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {historyReviews.map((rev) => (
                                                    <tr key={rev.id} className="border-b border-slate-100 dark:border-zinc-800 hover:bg-slate-50/50 dark:hover:bg-zinc-900/50 transition-colors">
                                                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-zinc-100 whitespace-nowrap">
                                                            {format(new Date(rev.createdAt), "dd MMM yyyy", { locale: es })}
                                                        </td>
                                                        {isAdmin && <td className="px-4 py-3 font-bold text-indigo-600 dark:text-indigo-400">{rev.agent.name}</td>}
                                                        <td className="px-4 py-3 text-center">{rev.puntosActividad}</td>
                                                        <td className="px-4 py-3 text-center">{rev.adnsRealizados}</td>
                                                        <td className="px-4 py-3 text-right text-slate-600 dark:text-zinc-400">${rev.metaPrimasMensual.toLocaleString()}</td>
                                                        <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-zinc-100">${rev.avancePrimasActual.toLocaleString()}</td>
                                                        <td className="px-4 py-3 text-center">
                                                            <Button variant="ghost" size="sm" onClick={() => setReadingReview(rev)} className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 h-8 px-2">
                                                                <BrainCircuit className="w-4 h-4" />
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            )}

            {/* Modal de Lectura IA Histórico */}
            <Dialog open={!!readingReview} onOpenChange={(open) => !open && setReadingReview(null)}>
                <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <BrainCircuit className="w-5 h-5 text-indigo-600" />
                            Dictamen Histórico (IA)
                        </DialogTitle>
                        <DialogDescription>
                            {readingReview && format(new Date(readingReview.createdAt), "dd 'de' MMMM, yyyy", { locale: es })}
                        </DialogDescription>
                    </DialogHeader>
                    {readingReview && (
                        <div className="py-4">
                            <div 
                                className="text-sm prose prose-slate dark:prose-invert max-w-none"
                                dangerouslySetInnerHTML={{ __html: readingReview.aiAnalysisResult || "<p>Sin análisis disponible.</p>" }} 
                            />
                            {readingReview.compromisos && (
                                <div className="mt-6 p-4 bg-slate-50 dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800">
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Notas guardadas del agente</p>
                                    <p className="text-sm italic text-slate-700 dark:text-zinc-300">{readingReview.compromisos}</p>
                                </div>
                            )}
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setReadingReview(null)}>Cerrar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal de Rechazo para Admin */}
            <Dialog open={!!rejectingId} onOpenChange={(open) => !open && setRejectingId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rechazar Evaluación</DialogTitle>
                        <DialogDescription>Escribe tus observaciones. El agente deberá corregir su reporte basándose en estos comentarios.</DialogDescription>
                    </DialogHeader>
                    <textarea 
                        className="w-full h-24 p-3 border rounded-md text-sm mt-2" 
                        placeholder="Ej. Los compromisos no son específicos..."
                        value={rejectFeedback}
                        onChange={(e) => setRejectFeedback(e.target.value)}
                    />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectingId(null)}>Cancelar</Button>
                        <Button variant="destructive" onClick={submitReject}>Rechazar y Devolver</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
