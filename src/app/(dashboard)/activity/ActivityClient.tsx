"use client";

import React, { useState, useEffect } from "react";
import { 
    saveActivityLogEntry, 
    deleteActivityLogEntry, 
    getDailyActivitySummary, 
    getActivityHistory,
    removeLastActivityLogEntry
} from "@/app/actions";
import { SALES_ACTIVITIES, TRAFFIC_LIGHT_THRESHOLDS } from "@/lib/constants";
import { 
    Phone, 
    Calendar, 
    CalendarCheck, 
    ShieldCheck, 
    UserPlus, 
    FileCheck2, 
    Award, 
    Plus, 
    Trash2, 
    ChevronDown, 
    ChevronUp, 
    Loader2, 
    CheckCircle2, 
    AlertCircle, 
    X,
    CalendarDays
} from "lucide-react";

interface LogEntry {
    id: string;
    activityId: string;
    activityName: string;
    points: number;
    prospectName: string | null;
    dateStr: string;
    createdAt: Date | string;
}

interface HistoryGroup {
    dateStr: string;
    totalPoints: number;
    logs: LogEntry[];
}

export default function ActivityPage({ agencyName = "AACOM" }: { agencyName?: string }) {
    // State
    const [todayLogs, setTodayLogs] = useState<LogEntry[]>([]);
    const [totalPoints, setTotalPoints] = useState(0);
    const [history, setHistory] = useState<HistoryGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    
    // Modal state for prospect name
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedActivity, setSelectedActivity] = useState<typeof SALES_ACTIVITIES[0] | null>(null);
    const [prospectName, setProspectName] = useState("");
    const [modalError, setModalError] = useState("");
    
    // Month filter for history
    const generateLast6Months = () => {
        const months = [];
        const now = new Date();
        for (let i = 0; i < 6; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            months.push({
                value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
                label: d.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase())
            });
        }
        return months;
    };
    
    const availableMonths = generateLast6Months();
    const [selectedMonth, setSelectedMonth] = useState(availableMonths[0].value);

    // Accordion state for history
    const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});

    // Load initial data
    const loadData = async () => {
        try {
            setLoading(true);
            const daily = await getDailyActivitySummary();
            if (daily.success) {
                setTodayLogs(daily.logs as any);
                setTotalPoints(daily.totalPoints);
            }
            
            const hist = await getActivityHistory();
            if (hist.success) {
                setHistory(hist.history as any);
            }
        } catch (error) {
            console.error("Error loading daily activities:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // Get color theme based on score (Semáforo)
    const getSemaforoDetails = (points: number) => {
        if (points >= 25) {
            return {
                color: "teal",
                strokeClass: "stroke-teal-500 dark:stroke-teal-400",
                textClass: "text-teal-600 dark:text-teal-400",
                bgClass: "bg-teal-50 dark:bg-teal-950/30 border-teal-200 dark:border-teal-900/50",
                badge: "¡Meta Cumplida! 🎉",
                label: "Excelente desempeño, meta superada."
            };
        } else if (points >= 16) {
            return {
                color: "amber",
                strokeClass: "stroke-amber-500 dark:stroke-amber-400",
                textClass: "text-amber-600 dark:text-amber-400",
                bgClass: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50",
                badge: "En Progreso ⚡",
                label: "Buen ritmo, estás muy cerca del objetivo."
            };
        } else {
            return {
                color: "rose",
                strokeClass: "stroke-rose-500 dark:stroke-rose-400",
                textClass: "text-rose-600 dark:text-rose-400",
                bgClass: "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50",
                badge: "Inicial 🔴",
                label: "Continúa registrando actividades del día."
            };
        }
    };

    const semaforo = getSemaforoDetails(totalPoints);

    // Map activity IDs to standard Lucide icons
    const getActivityIcon = (id: string, className = "h-5 w-5") => {
        switch (id) {
            case "1": return <Phone className={`${className} text-blue-500`} />;
            case "2": return <Calendar className={`${className} text-orange-500`} />;
            case "3": return <CalendarCheck className={`${className} text-amber-500`} />;
            case "4": return <ShieldCheck className={`${className} text-emerald-500`} />;
            case "5": return <UserPlus className={`${className} text-indigo-500`} />;
            case "6": return <FileCheck2 className={`${className} text-purple-500`} />;
            case "7": return <Award className={`${className} text-teal-500`} />;
            default: return <Plus className={className} />;
        }
    };

    // Handle Quick click or Modal triggering
    const handleActivityClick = async (activity: typeof SALES_ACTIVITIES[0]) => {
        // Cita agendada (ID '2') or Cita Efectiva (ID '3') requires prospect name
        if (activity.id === "2" || activity.id === "3") {
            setSelectedActivity(activity);
            setProspectName("");
            setModalError("");
            setIsModalOpen(true);
        } else {
            // Log directly
            await registerActivity(activity.id);
        }
    };

    // Handle Quick click subtraction
    const handleActivityMinusClick = async (activity: typeof SALES_ACTIVITIES[0]) => {
        try {
            setSubmitting(true);
            const res = await removeLastActivityLogEntry(activity.id);
            if (res.success) {
                await loadData();
            } else {
                alert(res.message);
            }
        } catch (err) {
            console.error("Failed to subtract activity:", err);
            alert("Ocurrió un error al reducir la actividad.");
        } finally {
            setSubmitting(false);
        }
    };

    // Save activity API wrapper
    const registerActivity = async (id: string, nameProspect?: string) => {
        try {
            setSubmitting(true);
            const res = await saveActivityLogEntry(id, nameProspect);
            if (res.success) {
                await loadData();
                setIsModalOpen(false);
            } else {
                alert(res.message);
            }
        } catch (err) {
            console.error("Failed to log activity:", err);
            alert("Ocurrió un error al registrar la actividad.");
        } finally {
            setSubmitting(false);
        }
    };

    // Modal submit handler
    const handleModalSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prospectName.trim()) {
            setModalError("El nombre del prospecto es obligatorio.");
            return;
        }
        if (selectedActivity) {
            await registerActivity(selectedActivity.id, prospectName);
        }
    };

    // Delete log entry wrapper
    const handleDeleteEntry = async (logId: string) => {
        if (!confirm("¿Estás seguro de que deseas eliminar este registro de actividad? Los puntos se restarán.")) {
            return;
        }
        try {
            setSubmitting(true);
            const res = await deleteActivityLogEntry(logId);
            if (res.success) {
                await loadData();
            } else {
                alert(res.message);
            }
        } catch (err) {
            console.error("Failed to delete log:", err);
        } finally {
            setSubmitting(false);
        }
    };

    // Toggle history accordion
    const toggleDateExpanded = (dateStr: string) => {
        setExpandedDates(prev => ({
            ...prev,
            [dateStr]: !prev[dateStr]
        }));
    };

    // SVG Circular Ring details
    const radius = 52;
    const circumference = 2 * Math.PI * radius;
    const progressPercent = Math.min(100, (totalPoints / 25) * 100);
    const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

    // Helper to format Date nicely
    const formatSpanishDate = (dateStr: string) => {
        const [year, month, day] = dateStr.split('-').map(Number);
        // month is 0-indexed in JS Dates
        const dateObj = new Date(year, month - 1, day);
        return dateObj.toLocaleDateString("es-MX", { 
            weekday: "long", 
            day: "numeric", 
            month: "long", 
            year: "numeric" 
        });
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="h-12 w-12 text-teal-600 animate-spin" />
                <p className="text-sm text-muted-foreground font-semibold">Cargando módulo {agencyName} 25...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 w-full max-w-lg mx-auto py-2 md:max-w-4xl md:px-0">
            {/* TOP HEADER & TITLE */}
            <div className="flex flex-col gap-1.5 px-4 md:px-0">
                <div className="flex items-center gap-2">
                    <h1 className="text-3xl font-black tracking-tight text-slate-800 dark:text-zinc-100">
                        {agencyName} 25
                    </h1>
                    <span className="bg-teal-100 text-teal-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider dark:bg-teal-900/40 dark:text-teal-400">
                        Puntaje Diario
                    </span>
                </div>
                <p className="text-xs text-muted-foreground font-medium">
                    Recuerda actualizar tu actividad del día de forma constante. Meta diaria: 25 puntos.
                </p>
            </div>

            {/* DYNAMIC PROGRESS CARD (SEMÁFORO) */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                <div className="md:col-span-2 bg-card rounded-2xl border shadow-md p-6 flex flex-col items-center justify-center text-center relative overflow-hidden group">
                    {/* Ring highlight shadow inside card */}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-50/20 dark:to-zinc-950/20 pointer-events-none" />
                    
                    {/* SVG Progress Ring */}
                    <div className="relative h-36 w-36 mb-4 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                            {/* Background Gray Ring */}
                            <circle
                                cx="72"
                                cy="72"
                                r={radius}
                                className="stroke-slate-100 dark:stroke-zinc-800/80 fill-transparent"
                                strokeWidth="12"
                            />
                            {/* Color Colored Ring */}
                            <circle
                                cx="72"
                                cy="72"
                                r={radius}
                                className={`fill-transparent transition-all duration-700 ease-out ${semaforo.strokeClass}`}
                                strokeWidth="12"
                                strokeDasharray={circumference}
                                strokeDashoffset={strokeDashoffset}
                                strokeLinecap="round"
                            />
                        </svg>
                        {/* Centered Score */}
                        <div className="absolute flex flex-col items-center justify-center">
                            <span className="text-3xl font-black tracking-tight">{totalPoints}</span>
                            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">de 25</span>
                        </div>
                    </div>

                    {/* Badge and labels */}
                    <div className="space-y-1.5 z-10">
                        <span className={`inline-block px-3 py-0.5 text-xs font-black rounded-full border uppercase tracking-wider ${semaforo.bgClass} ${semaforo.textClass}`}>
                            {semaforo.badge}
                        </span>
                        <p className="text-xs text-muted-foreground max-w-[200px] leading-relaxed">
                            {totalPoints >= 25 
                                ? "¡Espectacular! Has completado el objetivo del día."
                                : `Te faltan ${Math.max(0, 25 - totalPoints)} puntos para alcanzar la meta diaria.`
                            }
                        </p>
                    </div>
                </div>

                {/* INCREMENTAL ACTIONS PANEL */}
                <div className="md:col-span-3 bg-card rounded-2xl border shadow-md p-6 flex flex-col gap-4">
                    <h2 className="text-sm font-black text-slate-700 dark:text-zinc-300 uppercase tracking-widest border-b pb-2">
                        Registrar Nueva Actividad
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {SALES_ACTIVITIES.map((act) => (
                            <div
                                key={act.id}
                                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-900/30 shadow-sm transition-all"
                            >
                                {/* Left Side: Clickable area to add points */}
                                <button
                                    disabled={submitting}
                                    onClick={() => handleActivityClick(act)}
                                    className="flex items-center gap-3 flex-1 min-w-0 text-left group hover:translate-x-0.5 active:scale-[0.99] transition-all"
                                    title={`Sumar ${act.name}`}
                                >
                                    <div className="h-10 w-10 shrink-0 bg-white dark:bg-zinc-950 rounded-lg flex items-center justify-center shadow-sm border border-slate-100/80 dark:border-zinc-800 group-hover:shadow-md transition-shadow">
                                        {getActivityIcon(act.id)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-slate-800 dark:text-zinc-200 truncate group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                                            {act.name}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-wider">
                                            +{act.value} {act.value === 1 ? 'punto' : 'puntos'}
                                        </p>
                                    </div>
                                </button>

                                {/* Right Side: Minus and Plus Quick Controls */}
                                <div className="flex items-center gap-1.5 ml-2 shrink-0">
                                    {/* Minus Button */}
                                    <button
                                        disabled={submitting}
                                        onClick={() => handleActivityMinusClick(act)}
                                        className="h-7 w-7 rounded-full bg-slate-100 hover:bg-rose-50 dark:bg-zinc-800/80 dark:hover:bg-rose-950/20 flex items-center justify-center text-slate-500 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400 active:scale-90 transition-all border border-slate-200/40 dark:border-zinc-700/30"
                                        title="Quitar último"
                                    >
                                        <span className="text-base font-black leading-none -translate-y-[1px]">−</span>
                                    </button>

                                    {/* Plus Button */}
                                    <button
                                        disabled={submitting}
                                        onClick={() => handleActivityClick(act)}
                                        className="h-7 w-7 rounded-full bg-slate-100 hover:bg-teal-600 dark:bg-zinc-800/80 dark:hover:bg-teal-500 flex items-center justify-center text-slate-500 hover:text-white dark:text-zinc-400 dark:hover:text-white active:scale-90 transition-all border border-slate-200/40 dark:border-zinc-700/30"
                                        title="Sumar uno"
                                    >
                                        <Plus className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* TODAY'S DETAILED LOG FEED */}
            <div className="bg-card rounded-2xl border shadow-md p-6">
                <h2 className="text-sm font-black text-slate-700 dark:text-zinc-300 uppercase tracking-widest border-b pb-2 mb-4">
                    Detalle de Actividad de Hoy
                </h2>

                {todayLogs.length > 0 ? (
                    <div className="divide-y divide-slate-100 dark:divide-zinc-800 max-h-64 overflow-y-auto pr-1">
                        {todayLogs.map((log) => (
                            <div key={log.id} className="py-3 flex items-center justify-between gap-4 group">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="h-8 w-8 rounded-lg bg-slate-50 dark:bg-zinc-900 flex items-center justify-center border border-slate-100/50 dark:border-zinc-800">
                                        {getActivityIcon(log.activityId, "h-4.5 w-4.5")}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-black text-slate-800 dark:text-zinc-200">
                                            {log.activityName}
                                        </p>
                                        {log.prospectName && (
                                            <p className="text-[10px] text-teal-600 dark:text-teal-400 font-extrabold truncate">
                                                Prospecto: {log.prospectName}
                                            </p>
                                        )}
                                        <p className="text-[8px] text-muted-foreground font-medium">
                                            {new Date(log.createdAt).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-black bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 px-2 py-0.5 rounded">
                                        +{log.points} pts
                                    </span>
                                    <button
                                        onClick={() => handleDeleteEntry(log.id)}
                                        disabled={submitting}
                                        className="text-muted-foreground hover:text-red-500 p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-950/20 opacity-80 group-hover:opacity-100 transition-all"
                                        title="Eliminar registro"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-8 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
                        <CheckCircle2 className="h-8 w-8 text-slate-300 animate-pulse" />
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Sin registros hoy</span>
                        <p className="text-[10px] text-slate-400 max-w-xs">
                            Aún no has registrado ninguna actividad. Utiliza el panel superior para sumar tus primeros puntos.
                        </p>
                    </div>
                )}
            </div>

            {/* HISTORICAL ACCORDION FEED */}
            <div className="bg-card rounded-2xl border shadow-md p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 mb-4">
                    <div className="flex items-center gap-2">
                        <CalendarDays className="h-4.5 w-4.5 text-teal-600 dark:text-teal-400" />
                        <h2 className="text-sm font-black text-slate-700 dark:text-zinc-300 uppercase tracking-widest">
                            Historial de Actividades
                        </h2>
                    </div>
                    <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    >
                        {availableMonths.map((m) => (
                            <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                    </select>
                </div>

                {history.filter(g => g.dateStr.startsWith(selectedMonth)).length > 0 ? (
                    <div className="space-y-3">
                        {history.filter(g => g.dateStr.startsWith(selectedMonth)).map((group) => {
                            const isExpanded = expandedDates[group.dateStr];
                            const histSemaforo = getSemaforoDetails(group.totalPoints);
                            
                            return (
                                <div 
                                    key={group.dateStr}
                                    className="border border-slate-100 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm"
                                >
                                    {/* Accordion Trigger */}
                                    <button
                                        onClick={() => toggleDateExpanded(group.dateStr)}
                                        className="w-full flex items-center justify-between p-4 bg-slate-50/50 dark:bg-zinc-900/30 hover:bg-slate-50 dark:hover:bg-zinc-900/60 transition-colors text-left"
                                    >
                                        <div className="flex items-center gap-3">
                                            {/* Colored Semáforo Dot */}
                                            <span className={`h-3 w-3 rounded-full border border-white/20 animate-pulse ${
                                                group.totalPoints >= 25 ? 'bg-teal-500' : group.totalPoints >= 16 ? 'bg-amber-500' : 'bg-rose-500'
                                            }`} />
                                            <div>
                                                <p className="text-xs font-black text-slate-800 dark:text-zinc-200 capitalize">
                                                    {formatSpanishDate(group.dateStr)}
                                                </p>
                                                <p className="text-[10px] text-muted-foreground font-semibold">
                                                    {group.logs.length} {group.logs.length === 1 ? 'actividad' : 'actividades'} registradas
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <span className={`text-xs font-black px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${histSemaforo.bgClass} ${histSemaforo.textClass}`}>
                                                {group.totalPoints} pts
                                            </span>
                                            {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                                        </div>
                                    </button>

                                    {/* Accordion Content */}
                                    {isExpanded && (
                                        <div className="p-4 bg-white dark:bg-zinc-950 border-t border-slate-100 dark:border-zinc-800 divide-y divide-slate-50 dark:divide-zinc-900">
                                            {group.logs.map((log) => (
                                                <div key={log.id} className="py-2.5 flex items-center justify-between gap-4">
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        {getActivityIcon(log.activityId, "h-4 w-4")}
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                                                                {log.activityName}
                                                            </p>
                                                            {log.prospectName && (
                                                                <p className="text-[10px] text-teal-600 dark:text-teal-400 font-extrabold">
                                                                    Prospecto: {log.prospectName}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <span className="text-[10px] font-black text-slate-500 bg-slate-100 dark:bg-zinc-900 px-2 py-0.5 rounded shrink-0">
                                                        +{log.points} pts
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="py-6 text-center text-muted-foreground text-xs font-medium">
                        Historial vacío. Tu actividad de días anteriores se visualizará aquí.
                    </div>
                )}
            </div>

            {/* MODAL OVERLAY FOR PROSPECT NAME */}
            {isModalOpen && selectedActivity && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div 
                        className="w-full max-w-sm bg-card border rounded-2xl shadow-xl p-6 relative animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close Button */}
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>

                        <div className="flex items-center gap-3 mb-4 border-b pb-2">
                            <div className="h-9 w-9 bg-teal-50 dark:bg-teal-950/20 rounded-lg flex items-center justify-center border border-teal-100/50 dark:border-teal-900/50">
                                {getActivityIcon(selectedActivity.id, "h-5 w-5")}
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-slate-800 dark:text-zinc-100">
                                    Registrar {selectedActivity.name}
                                </h3>
                                <p className="text-[10px] text-muted-foreground font-bold uppercase">
                                    Valor: +{selectedActivity.value} puntos
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleModalSubmit} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                                    Nombre del Nuevo Prospecto / Cliente
                                </label>
                                <input
                                    type="text"
                                    required
                                    autoFocus
                                    placeholder="Ej: Enrique Ahumada"
                                    value={prospectName}
                                    onChange={(e) => {
                                        setProspectName(e.target.value);
                                        setModalError("");
                                    }}
                                    className="w-full rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-900/30 px-3.5 py-2 text-sm text-slate-800 dark:text-zinc-100 placeholder:text-muted-foreground/60 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-colors"
                                />
                                {modalError && (
                                    <div className="flex items-center gap-1 text-[10px] text-rose-500 font-extrabold mt-1">
                                        <AlertCircle className="h-3 w-3 shrink-0" />
                                        <span>{modalError}</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 justify-end pt-2">
                                <button
                                    type="button"
                                    disabled={submitting}
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-4 py-2 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-md hover:shadow-teal-500/20 transition-all flex items-center gap-1.5"
                                >
                                    {submitting ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                        <Plus className="h-3.5 w-3.5" />
                                    )}
                                    Confirmar y Sumar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
