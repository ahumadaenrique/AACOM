"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import {
    saveActivityLogEntry,
    deleteActivityLogEntry,
    getDailyActivitySummary,
    getActivityHistory,
    removeLastActivityLogEntry,
    saveDailyPlan,
} from "@/app/actions";
import {
    ISSUED_POLICY_RAMOS,
    getDefaultSalesActivities,
    normalizePhone10,
    type ActivityLogDetails,
    type SalesActivityItem,
} from "@/lib/constants";
import {
    Phone,
    Calendar,
    CalendarCheck,
    ShieldCheck,
    UserPlus,
    FileCheck2,
    Award,
    Sparkles,
    Plus,
    Trash2,
    ChevronDown,
    ChevronUp,
    Loader2,
    CheckCircle2,
    AlertCircle,
    X,
    CalendarDays,
    Target,
    HelpCircle,
    Flame,
    Info,
} from "lucide-react";

interface LogEntry {
    id: string;
    activityId: string;
    activityName: string;
    points: number;
    prospectName: string | null;
    detailsJson?: ActivityLogDetails | Record<string, any> | null;
    dateStr: string;
    createdAt: Date | string;
}

interface HistoryGroup {
    dateStr: string;
    totalPoints: number;
    logs: LogEntry[];
}

export default function ActivityClient({
    agencyName = "Tu Agencia",
    isReferidor = false,
    initialActivities,
}: {
    agencyName?: string;
    isReferidor?: boolean;
    initialActivities?: SalesActivityItem[];
}) {
    const TARGET = isReferidor ? 15 : 25;
    const { toast } = useToast();

    // State
    const [activities, setActivities] = useState<SalesActivityItem[]>(() =>
        initialActivities && initialActivities.length > 0 ? initialActivities : getDefaultSalesActivities()
    );
    const [todayLogs, setTodayLogs] = useState<LogEntry[]>([]);
    const [plannedGoals, setPlannedGoals] = useState<Record<string, number>>({});
    const [totalPoints, setTotalPoints] = useState(0);
    const [history, setHistory] = useState<HistoryGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Day Planner Modal State
    const [isPlannerModalOpen, setIsPlannerModalOpen] = useState(false);
    const [plannerState, setPlannerState] = useState<Record<string, number>>({});
    const [savingPlanner, setSavingPlanner] = useState(false);
    const [plannerError, setPlannerError] = useState("");

    // Dynamic Capture Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedActivity, setSelectedActivity] = useState<SalesActivityItem | null>(null);
    const [prospectName, setProspectName] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [referralPhone, setReferralPhone] = useState("");
    const [referralNotes, setReferralNotes] = useState("");
    const [policyContractor, setPolicyContractor] = useState("");
    const [policyRamo, setPolicyRamo] = useState<string>(ISSUED_POLICY_RAMOS[0]);
    const [policyPremium, setPolicyPremium] = useState("");
    const [modalError, setModalError] = useState("");

    // Month filter for history
    const generateLast6Months = () => {
        const months = [];
        const now = new Date();
        for (let i = 0; i < 6; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            months.push({
                value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
                label: d.toLocaleDateString("es-MX", { month: "long", year: "numeric" }).replace(/^\w/, (c) => c.toUpperCase()),
            });
        }
        return months;
    };

    const availableMonths = generateLast6Months();
    const [selectedMonth, setSelectedMonth] = useState(availableMonths[0].value);

    // Accordion state for history
    const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});
    const pendingOpsRef = useRef(0);

    // Load initial data
    const loadData = async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const daily = await getDailyActivitySummary();
            if (daily.success && pendingOpsRef.current === 0) {
                setTodayLogs(daily.logs as any);
                setPlannedGoals(daily.plannedGoals || {});
                setTotalPoints(daily.totalPoints);
                if (Array.isArray((daily as any).activities) && (daily as any).activities.length > 0) {
                    setActivities((daily as any).activities);
                }
            }

            const hist = await getActivityHistory();
            if (hist.success && pendingOpsRef.current === 0) {
                setHistory(hist.history as any);
            }
        } catch (error) {
            console.error("Error loading daily activities:", error);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // Semáforo color theme
    const getSemaforoDetails = (points: number) => {
        if (points >= TARGET) {
            return {
                color: "teal",
                strokeClass: "stroke-teal-500 dark:stroke-teal-400",
                textClass: "text-teal-600 dark:text-teal-400",
                bgClass: "bg-teal-50 dark:bg-teal-950/30 border-teal-200 dark:border-teal-900/50",
                badge: "¡Meta Cumplida! 🎉",
                label: "Excelente desempeño, meta superada.",
            };
        } else if (points >= (isReferidor ? 9 : 16)) {
            return {
                color: "amber",
                strokeClass: "stroke-amber-500 dark:stroke-amber-400",
                textClass: "text-amber-600 dark:text-amber-400",
                bgClass: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50",
                badge: "En Progreso ⚡",
                label: "Buen ritmo, estás muy cerca del objetivo.",
            };
        } else {
            return {
                color: "rose",
                strokeClass: "stroke-rose-500 dark:stroke-rose-400",
                textClass: "text-rose-600 dark:text-rose-400",
                bgClass: "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50",
                badge: "Inicial 🔴",
                label: "Continúa registrando actividades del día.",
            };
        }
    };

    const semaforo = getSemaforoDetails(totalPoints);

    // Map activity IDs to standard Lucide icons
    const getActivityIcon = (id: string, className = "h-5 w-5") => {
        switch (id) {
            case "1":
                return <Phone className={`${className} text-blue-500`} />;
            case "2":
                return <Calendar className={`${className} text-orange-500`} />;
            case "3":
                return <CalendarCheck className={`${className} text-amber-500`} />;
            case "4":
                return <ShieldCheck className={`${className} text-emerald-500`} />;
            case "5":
                return <UserPlus className={`${className} text-indigo-500`} />;
            case "6":
                return <FileCheck2 className={`${className} text-purple-500`} />;
            case "7":
                return <Award className={`${className} text-teal-500`} />;
            case "8":
                return <Sparkles className={`${className} text-pink-500`} />;
            default:
                return <Plus className={className} />;
        }
    };

    const resetCaptureFields = () => {
        setProspectName("");
        setFirstName("");
        setLastName("");
        setReferralPhone("");
        setReferralNotes("");
        setPolicyContractor("");
        setPolicyRamo(ISSUED_POLICY_RAMOS[0]);
        setPolicyPremium("");
        setModalError("");
    };

    // Handle Quick click or Modal triggering
    const handleActivityClick = async (activity: SalesActivityItem) => {
        if (activity.captureType !== "SIMPLE") {
            setSelectedActivity(activity);
            resetCaptureFields();
            setIsModalOpen(true);
        } else {
            await registerActivity(activity.id);
        }
    };

    // Handle Quick click subtraction
    const handleActivityMinusClick = async (activity: SalesActivityItem) => {
        const hasExisting = todayLogs.some((log) => log.activityId === activity.id);
        if (!hasExisting) return;

        let removedPoints = activity.value;
        setTodayLogs((prev) => {
            const idx = prev.findIndex((l) => l.activityId === activity.id);
            if (idx === -1) return prev;
            removedPoints = prev[idx].points || activity.value;
            const next = [...prev];
            next.splice(idx, 1);
            return next;
        });
        setTotalPoints((prev) => Math.max(0, prev - removedPoints));

        pendingOpsRef.current += 1;
        try {
            const res = await removeLastActivityLogEntry(activity.id);
            if (!res.success) {
                toast({
                    title: "Aviso",
                    description: res.message || "No se pudo restar la actividad.",
                    variant: "destructive",
                });
            }
        } catch (err) {
            console.error("Failed to subtract activity:", err);
            toast({
                title: "Error",
                description: "Ocurrió un error al reducir la actividad.",
                variant: "destructive",
            });
        } finally {
            pendingOpsRef.current = Math.max(0, pendingOpsRef.current - 1);
            if (pendingOpsRef.current === 0) {
                await loadData(true);
            }
        }
    };

    // Save activity API wrapper
    const registerActivity = async (
        id: string,
        nameProspect?: string,
        extra?: {
            firstName?: string;
            lastName?: string;
            phone?: string;
            notes?: string;
            contractor?: string;
            ramo?: string;
            indicativePremium?: number;
        },
        optimisticDetails?: ActivityLogDetails
    ) => {
        const actDef = activities.find((a) => a.id === id);
        if (!actDef) return;

        const isModalCapture = actDef.captureType !== "SIMPLE";
        const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const optimisticEntry: LogEntry = {
            id: tempId,
            activityId: actDef.id,
            activityName: actDef.name,
            points: actDef.value,
            prospectName: nameProspect?.trim() || null,
            detailsJson: optimisticDetails || null,
            dateStr: new Date().toLocaleDateString("en-CA", { timeZone: "America/Mexico_City" }),
            createdAt: new Date().toISOString(),
        };

        setTodayLogs((prev) => [optimisticEntry, ...prev]);
        setTotalPoints((prev) => prev + actDef.value);
        if (isModalCapture) {
            setIsModalOpen(false);
        }

        pendingOpsRef.current += 1;
        try {
            if (isModalCapture) setSubmitting(true);
            const res = await saveActivityLogEntry(id, nameProspect, extra);
            if (!res.success) {
                toast({
                    title: "Error",
                    description: res.message || "No se pudo registrar la actividad.",
                    variant: "destructive",
                });
            } else if ((res as any).sentToProject200) {
                toast({
                    title: "Referido guardado y enviado a Proyecto 200",
                    description: `${nameProspect} ya aparece en tu base de referidos y en tu cola de Proyecto 200 (+${actDef.value} pts).`,
                });
            }
        } catch (err) {
            console.error("Failed to log activity:", err);
            toast({
                title: "Error",
                description: "Ocurrió un error al registrar la actividad.",
                variant: "destructive",
            });
        } finally {
            if (isModalCapture) setSubmitting(false);
            pendingOpsRef.current = Math.max(0, pendingOpsRef.current - 1);
            if (pendingOpsRef.current === 0) {
                await loadData(true);
            }
        }
    };

    // Modal submit handler
    const handleModalSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedActivity) return;

        if (selectedActivity.captureType === "PROSPECT_NAME") {
            if (!prospectName.trim()) {
                setModalError("El nombre del prospecto es obligatorio.");
                return;
            }
            await registerActivity(selectedActivity.id, prospectName.trim());
            return;
        }

        if (selectedActivity.captureType === "FULL_NAME") {
            const fName = firstName.trim();
            const lName = lastName.trim();
            if (!fName || !lName) {
                setModalError("Captura tanto el nombre como el apellido de la persona visitada.");
                return;
            }
            const fullName = `${fName} ${lName}`;
            await registerActivity(
                selectedActivity.id,
                fullName,
                { firstName: fName, lastName: lName },
                { kind: "CLOSING_APPOINTMENT", firstName: fName, lastName: lName, fullName }
            );
            return;
        }

        if (selectedActivity.captureType === "REFERRAL_P200") {
            const fName = firstName.trim();
            const lName = lastName.trim();
            const cleanPhone = normalizePhone10(referralPhone);
            const cleanNotes = referralNotes.trim();
            if (!fName || !lName) {
                setModalError("El nombre y apellido del referido son obligatorios.");
                return;
            }
            if (cleanPhone.length !== 10) {
                setModalError("El teléfono del referido es obligatorio (debe tener 10 dígitos válidos).");
                return;
            }
            if (!cleanNotes) {
                setModalError("Los comentarios / información de contexto del referido son obligatorios.");
                return;
            }
            const fullName = `${fName} ${lName}`;
            await registerActivity(
                selectedActivity.id,
                fullName,
                { firstName: fName, lastName: lName, phone: cleanPhone, notes: cleanNotes },
                {
                    kind: "REFERRAL",
                    firstName: fName,
                    lastName: lName,
                    fullName,
                    phone: cleanPhone,
                    notes: cleanNotes,
                }
            );
            return;
        }

        if (selectedActivity.captureType === "ISSUED_POLICY") {
            const cleanContractor = policyContractor.trim();
            const parsedPremium = Number(policyPremium);
            if (!cleanContractor) {
                setModalError("El nombre del contratante es obligatorio.");
                return;
            }
            if (!policyRamo) {
                setModalError("Selecciona el ramo de la póliza.");
                return;
            }
            if (!Number.isFinite(parsedPremium) || parsedPremium <= 0) {
                setModalError("Captura una prima aproximada válida mayor a $0.");
                return;
            }
            await registerActivity(
                selectedActivity.id,
                cleanContractor,
                {
                    contractor: cleanContractor,
                    ramo: policyRamo,
                    indicativePremium: parsedPremium,
                },
                {
                    kind: "ISSUED_POLICY",
                    contractor: cleanContractor,
                    ramo: policyRamo,
                    indicativePremium: parsedPremium,
                    isIndicativeOnly: true,
                }
            );
        }
    };

    // Planner Modal functions
    const openPlannerModal = () => {
        const initialPlannerState: Record<string, number> = {};
        activities.forEach((act) => {
            initialPlannerState[act.id] = plannedGoals[act.id] || 0;
        });
        setPlannerState(initialPlannerState);
        setPlannerError("");
        setIsPlannerModalOpen(true);
    };

    const updatePlannerState = (activityId: string, delta: number) => {
        setPlannerState((prev) => {
            const current = prev[activityId] || 0;
            const next = Math.max(0, current + delta);
            return { ...prev, [activityId]: next };
        });
        setPlannerError("");
    };

    const handlePlannerSubmit = async () => {
        let totalSimulatedPoints = 0;
        for (const act of activities) {
            const count = plannerState[act.id] || 0;
            totalSimulatedPoints += count * act.value;
        }

        if (totalSimulatedPoints < TARGET) {
            setPlannerError(
                `Debes planear un mínimo de ${TARGET} puntos para alcanzar la meta diaria. Actualmente tienes: ${totalSimulatedPoints} puntos.`
            );
            return;
        }

        try {
            setSavingPlanner(true);
            const res = await saveDailyPlan(plannerState);
            if (res.success) {
                await loadData(true);
                setIsPlannerModalOpen(false);
                toast({ title: "Planeación guardada", description: "Tus metas del día han sido actualizadas." });
            } else {
                setPlannerError(res.message);
            }
        } catch (err) {
            console.error("Failed to save plan:", err);
            setPlannerError("Ocurrió un error al guardar tu planeación.");
        } finally {
            setSavingPlanner(false);
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
                await loadData(true);
            } else {
                toast({ title: "Error", description: res.message, variant: "destructive" });
            }
        } catch (err) {
            console.error("Failed to delete log:", err);
        } finally {
            setSubmitting(false);
        }
    };

    // Toggle history accordion
    const toggleDateExpanded = (dateStr: string) => {
        setExpandedDates((prev) => ({
            ...prev,
            [dateStr]: !prev[dateStr],
        }));
    };

    // SVG Circular Ring details
    const radius = 52;
    const circumference = 2 * Math.PI * radius;
    const progressPercent = Math.min(100, (totalPoints / TARGET) * 100);
    const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

    // Helper to format Date nicely
    const formatSpanishDate = (dateStr: string) => {
        const [year, month, day] = dateStr.split("-").map(Number);
        const dateObj = new Date(year, month - 1, day);
        return dateObj.toLocaleDateString("es-MX", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    };

    // Helper to render structured metadata of an ActivityLog
    const renderLogDetails = (log: LogEntry) => {
        const details = log.detailsJson as any;

        if (details?.kind === "CLOSING_APPOINTMENT") {
            return (
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold break-words">
                    👤 Persona visitada: {details.fullName || `${details.firstName} ${details.lastName}`}
                </p>
            );
        }

        if (details?.kind === "REFERRAL") {
            return (
                <div className="space-y-0.5 mt-0.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] text-indigo-700 dark:text-indigo-400 font-bold break-words">
                            👥 Referido: {details.fullName || log.prospectName}
                        </span>
                        {details.phone && (
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                                📞 {details.phone}
                            </span>
                        )}
                        <Link
                            href="/proyecto-200"
                            className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 border border-orange-200 dark:border-orange-900/50 hover:bg-orange-200 transition-colors"
                        >
                            <Flame className="h-2.5 w-2.5" />
                            En Proyecto 200
                        </Link>
                    </div>
                    {details.notes && (
                        <p className="text-[10px] text-slate-500 dark:text-zinc-400 italic break-words">
                            «{details.notes}»
                        </p>
                    )}
                </div>
            );
        }

        if (details?.kind === "ISSUED_POLICY") {
            const formattedPremium = Number(details.indicativePremium || 0).toLocaleString("es-MX", {
                style: "currency",
                currency: "MXN",
                maximumFractionDigits: 0,
            });
            return (
                <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                    <span className="text-[11px] text-purple-700 dark:text-purple-400 font-bold break-words">
                        📝 Contratante: {details.contractor}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-900/40">
                        {details.ramo}
                    </span>
                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/40">
                        Prima aprox: {formattedPremium}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                        (Solo indicativo)
                    </span>
                </div>
            );
        }

        if (log.prospectName) {
            return (
                <p className="text-[11px] text-teal-600 dark:text-teal-400 font-extrabold break-words">
                    Prospecto: {log.prospectName}
                </p>
            );
        }

        return null;
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="h-12 w-12 text-teal-600 animate-spin" />
                <p className="text-sm text-muted-foreground font-semibold">
                    Cargando módulo {isReferidor ? "Mi Actividad" : `${agencyName} 25`}...
                </p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-3 space-y-6">
            {/* TOP HEADER & TITLE */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-800 dark:text-zinc-100">
                            {isReferidor ? "Mi Actividad" : `${agencyName} 25`}
                        </h1>
                        <div className="bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            Módulo
                        </div>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-zinc-400 max-w-xl leading-relaxed font-medium">
                        Recuerda actualizar tu actividad del día de forma constante. Meta diaria: {TARGET} puntos.
                    </p>
                </div>

                <button
                    onClick={openPlannerModal}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-sm font-bold rounded-xl shadow-sm transition-all shrink-0"
                >
                    🗓️ Planear mi día
                </button>
            </div>

            {/* RESPONSIVE TWO-COLUMN MAIN WORKSPACE + RIGHT GUIDE PANEL */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* LEFT COLUMN: SEMÁFORO, REGISTRAR ACTIVIDADES, FEED DE HOY E HISTORIAL */}
                <div className="lg:col-span-8 space-y-6 min-w-0">
                    {/* DYNAMIC PROGRESS CARD + INCREMENTAL PANEL */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                        {/* Semáforo Card */}
                        <div className="md:col-span-5 bg-card rounded-2xl border shadow-md p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-50/20 dark:to-zinc-950/20 pointer-events-none" />

                            <div className="relative h-36 w-36 mb-4 flex items-center justify-center">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle
                                        cx="72"
                                        cy="72"
                                        r={radius}
                                        className="stroke-slate-100 dark:stroke-zinc-800/80 fill-transparent"
                                        strokeWidth="12"
                                    />
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
                                <div className="absolute flex flex-col items-center justify-center">
                                    <span className="text-3xl font-black tracking-tight">{totalPoints}</span>
                                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                                        de {TARGET}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-1.5 z-10">
                                <span
                                    className={`inline-block px-3 py-0.5 text-xs font-black rounded-full border uppercase tracking-wider ${semaforo.bgClass} ${semaforo.textClass}`}
                                >
                                    {semaforo.badge}
                                </span>
                                <p className="text-xs text-muted-foreground max-w-[220px] leading-relaxed">
                                    {totalPoints >= TARGET
                                        ? "¡Felicidades! Has cumplido la meta del día."
                                        : `Te faltan ${Math.max(0, TARGET - totalPoints)} puntos para alcanzar la meta diaria.`}
                                </p>
                            </div>
                        </div>

                        {/* Incremental Actions Panel */}
                        <div className="md:col-span-7 bg-card rounded-2xl border shadow-md p-5 sm:p-6 flex flex-col gap-4 min-w-0">
                            <h2 className="text-sm font-black text-slate-700 dark:text-zinc-300 uppercase tracking-widest border-b pb-2">
                                Registrar Nueva Actividad
                            </h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {activities.map((act) => {
                                    const achievedCount = todayLogs.filter((log) => log.activityId === act.id).length;
                                    const plannedCount = plannedGoals[act.id];

                                    return (
                                        <div
                                            key={act.id}
                                            className="flex items-center justify-between gap-2 p-3 rounded-xl border border-slate-100 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-900/30 shadow-sm transition-all min-w-0"
                                        >
                                            <button
                                                type="button"
                                                onClick={() => handleActivityClick(act)}
                                                className="flex items-start gap-2.5 flex-1 min-w-0 text-left group hover:translate-x-0.5 active:scale-[0.99] transition-all"
                                                title={`Sumar ${act.name}`}
                                            >
                                                <div className="h-9 w-9 shrink-0 bg-white dark:bg-zinc-950 rounded-lg flex items-center justify-center shadow-sm border border-slate-100/80 dark:border-zinc-800 group-hover:shadow-md transition-shadow mt-0.5">
                                                    {getActivityIcon(act.id, "h-4.5 w-4.5")}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-bold text-slate-800 dark:text-zinc-200 whitespace-normal break-words leading-snug group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                                                        {act.name}
                                                    </p>
                                                    <div className="flex items-center gap-1.5 flex-wrap mt-1">
                                                        <span className="text-[10px] text-muted-foreground font-black uppercase tracking-wider">
                                                            +{act.value} {act.value === 1 ? "punto" : "puntos"}
                                                        </span>

                                                        {plannedCount !== undefined && (
                                                            <span
                                                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider ${
                                                                    achievedCount >= plannedCount
                                                                        ? "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400"
                                                                        : "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400"
                                                                }`}
                                                            >
                                                                Meta: {achievedCount} / {plannedCount}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </button>

                                            <div className="flex items-center gap-1 shrink-0">
                                                <button
                                                    type="button"
                                                    disabled={achievedCount === 0}
                                                    onClick={() => handleActivityMinusClick(act)}
                                                    className="h-7 w-7 rounded-full bg-slate-100 hover:bg-rose-50 dark:bg-zinc-800/80 dark:hover:bg-rose-950/20 flex items-center justify-center text-slate-500 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400 active:scale-90 transition-all border border-slate-200/40 dark:border-zinc-700/30 disabled:opacity-35 disabled:pointer-events-none"
                                                    title={achievedCount === 0 ? "Sin registros para quitar" : "Quitar último"}
                                                >
                                                    <span className="text-base font-black leading-none -translate-y-[1px]">−</span>
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => handleActivityClick(act)}
                                                    className="h-7 w-7 rounded-full bg-slate-100 hover:bg-teal-600 dark:bg-zinc-800/80 dark:hover:bg-teal-500 flex items-center justify-center text-slate-500 hover:text-white dark:text-zinc-400 dark:hover:text-white active:scale-90 transition-all border border-slate-200/40 dark:border-zinc-700/30"
                                                    title="Sumar uno"
                                                >
                                                    <Plus className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* TODAY'S DETAILED LOG FEED */}
                    <div className="bg-card rounded-2xl border shadow-md p-5 sm:p-6">
                        <h2 className="text-sm font-black text-slate-700 dark:text-zinc-300 uppercase tracking-widest border-b pb-2 mb-4">
                            Detalle de Actividad de Hoy
                        </h2>

                        {todayLogs.length > 0 ? (
                            <div className="divide-y divide-slate-100 dark:divide-zinc-800 max-h-72 overflow-y-auto pr-1">
                                {todayLogs.map((log) => (
                                    <div key={log.id} className="py-3 flex items-start justify-between gap-3 group">
                                        <div className="flex items-start gap-3 min-w-0 flex-1">
                                            <div className="h-8 w-8 rounded-lg bg-slate-50 dark:bg-zinc-900 flex items-center justify-center border border-slate-100/50 dark:border-zinc-800 shrink-0 mt-0.5">
                                                {getActivityIcon(log.activityId, "h-4.5 w-4.5")}
                                            </div>
                                            <div className="min-w-0 flex-1 space-y-0.5">
                                                <p className="text-xs font-black text-slate-800 dark:text-zinc-200 break-words">
                                                    {log.activityName}
                                                </p>
                                                {renderLogDetails(log)}
                                                <p className="text-[10px] text-muted-foreground font-medium">
                                                    {new Date(log.createdAt).toLocaleTimeString("es-MX", {
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className="text-xs font-black bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 px-2 py-0.5 rounded whitespace-nowrap">
                                                +{log.points} pts
                                            </span>
                                            <button
                                                type="button"
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
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                    Sin registros hoy
                                </span>
                                <p className="text-[11px] text-slate-400 max-w-xs">
                                    Aún no has registrado ninguna actividad. Utiliza el panel superior para sumar tus primeros puntos.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* HISTORICAL ACCORDION FEED */}
                    <div className="bg-card rounded-2xl border shadow-md p-5 sm:p-6">
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
                                    <option key={m.value} value={m.value}>
                                        {m.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {history.filter((g) => g.dateStr.startsWith(selectedMonth)).length > 0 ? (
                            <div className="space-y-3">
                                {history
                                    .filter((g) => g.dateStr.startsWith(selectedMonth))
                                    .map((group) => {
                                        const isExpanded = expandedDates[group.dateStr];
                                        const histSemaforo = getSemaforoDetails(group.totalPoints);

                                        return (
                                            <div
                                                key={group.dateStr}
                                                className="border border-slate-100 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm"
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() => toggleDateExpanded(group.dateStr)}
                                                    className="w-full flex items-center justify-between p-4 bg-slate-50/50 dark:bg-zinc-900/30 hover:bg-slate-50 dark:hover:bg-zinc-900/60 transition-colors text-left gap-3"
                                                >
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <span
                                                            className={`h-3 w-3 rounded-full shrink-0 border border-white/20 animate-pulse ${
                                                                group.totalPoints >= TARGET
                                                                    ? "bg-teal-500"
                                                                    : group.totalPoints >= TARGET * 0.6
                                                                    ? "bg-amber-500"
                                                                    : "bg-rose-500"
                                                            }`}
                                                        />
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-black text-slate-800 dark:text-zinc-200 capitalize truncate">
                                                                {formatSpanishDate(group.dateStr)}
                                                            </p>
                                                            <p className="text-[10px] text-muted-foreground font-semibold">
                                                                {group.logs.length} {group.logs.length === 1 ? "actividad" : "actividades"} registradas
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <span
                                                            className={`text-xs font-black px-2.5 py-0.5 rounded-full border uppercase tracking-wider whitespace-nowrap ${histSemaforo.bgClass} ${histSemaforo.textClass}`}
                                                        >
                                                            {group.totalPoints} pts
                                                        </span>
                                                        {isExpanded ? (
                                                            <ChevronUp className="h-4 w-4 text-slate-400" />
                                                        ) : (
                                                            <ChevronDown className="h-4 w-4 text-slate-400" />
                                                        )}
                                                    </div>
                                                </button>

                                                {isExpanded && (
                                                    <div className="p-4 bg-white dark:bg-zinc-950 border-t border-slate-100 dark:border-zinc-800 divide-y divide-slate-50 dark:divide-zinc-900">
                                                        {group.logs.map((log) => (
                                                            <div
                                                                key={log.id}
                                                                className="py-2.5 flex items-start justify-between gap-3"
                                                            >
                                                                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                                                                    <span className="mt-0.5 shrink-0">
                                                                        {getActivityIcon(log.activityId, "h-4 w-4")}
                                                                    </span>
                                                                    <div className="min-w-0 flex-1 space-y-0.5">
                                                                        <p className="text-xs font-bold text-slate-700 dark:text-zinc-300 break-words">
                                                                            {log.activityName}
                                                                        </p>
                                                                        {renderLogDetails(log)}
                                                                    </div>
                                                                </div>
                                                                <span className="text-[10px] font-black text-slate-500 bg-slate-100 dark:bg-zinc-900 px-2 py-0.5 rounded shrink-0 whitespace-nowrap">
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
                </div>

                {/* RIGHT COLUMN: GUIDE PANEL "¿CUÁNDO CUENTA PARA PUNTOS CADA ACTIVIDAD?" */}
                <aside className="lg:col-span-4 lg:sticky lg:top-20 space-y-4">
                    <div className="bg-card rounded-2xl border shadow-md p-5 space-y-4">
                        <div className="border-b pb-3 space-y-1">
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-lg bg-teal-50 dark:bg-teal-950/40 border border-teal-200/70 dark:border-teal-900/60 flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0">
                                    <HelpCircle className="h-4.5 w-4.5" />
                                </div>
                                <h2 className="text-sm font-black text-slate-800 dark:text-zinc-100 leading-snug">
                                    ¿Cuándo cuenta para puntos cada actividad?
                                </h2>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                                Criterios oficiales de tu promotoría para sumar rumbo a la meta diaria de {TARGET} puntos.
                            </p>
                        </div>

                        <div className="space-y-3">
                            {activities.map((act) => (
                                <div
                                    key={act.id}
                                    className="p-3 rounded-xl border border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40 space-y-1.5"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-start gap-2 min-w-0">
                                            <span className="mt-0.5 shrink-0">
                                                {getActivityIcon(act.id, "h-4 w-4")}
                                            </span>
                                            <span className="text-xs font-extrabold text-slate-800 dark:text-zinc-100 whitespace-normal break-words leading-snug">
                                                {act.name}
                                            </span>
                                        </div>
                                        <span className="shrink-0 text-[10px] font-black px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-200 dark:border-teal-800 whitespace-nowrap">
                                            +{act.value} {act.value === 1 ? "pt" : "pts"}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-relaxed break-words">
                                        {act.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </aside>
            </div>

            {/* DYNAMIC MODAL FOR STRUCTURED ACTIVITY CAPTURE */}
            {isModalOpen && selectedActivity && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div
                        className="w-full max-w-md bg-card border rounded-2xl shadow-xl p-6 relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>

                        <div className="flex items-start gap-3 mb-4 border-b pb-3 pr-6">
                            <div className="h-9 w-9 bg-teal-50 dark:bg-teal-950/20 rounded-lg flex items-center justify-center border border-teal-100/50 dark:border-teal-900/50 shrink-0">
                                {getActivityIcon(selectedActivity.id, "h-5 w-5")}
                            </div>
                            <div className="min-w-0">
                                <h3 className="text-sm font-black text-slate-800 dark:text-zinc-100 break-words leading-snug">
                                    Registrar {selectedActivity.name}
                                </h3>
                                <p className="text-[10px] text-muted-foreground font-bold uppercase mt-0.5">
                                    Valor: +{selectedActivity.value} {selectedActivity.value === 1 ? "punto" : "puntos"}
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleModalSubmit} noValidate className="space-y-4">
                            {selectedActivity.captureType === "PROSPECT_NAME" && (
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block">
                                        Nombre del Nuevo Prospecto / Cliente *
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
                                </div>
                            )}

                            {selectedActivity.captureType === "FULL_NAME" && (
                                <>
                                    <p className="text-xs text-slate-500 dark:text-zinc-400">
                                        Captura el nombre y apellido de la persona que visitaste e intentaste cerrar.
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block">
                                                Nombre(s) *
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                autoFocus
                                                placeholder="Ej: Carlos"
                                                value={firstName}
                                                onChange={(e) => {
                                                    setFirstName(e.target.value);
                                                    setModalError("");
                                                }}
                                                className="w-full rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-900/30 px-3.5 py-2 text-sm text-slate-800 dark:text-zinc-100 placeholder:text-muted-foreground/60 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-colors"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block">
                                                Apellido(s) *
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="Ej: Mendoza"
                                                value={lastName}
                                                onChange={(e) => {
                                                    setLastName(e.target.value);
                                                    setModalError("");
                                                }}
                                                className="w-full rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-900/30 px-3.5 py-2 text-sm text-slate-800 dark:text-zinc-100 placeholder:text-muted-foreground/60 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-colors"
                                            />
                                        </div>
                                    </div>
                                </>
                            )}

                            {selectedActivity.captureType === "REFERRAL_P200" && (
                                <>
                                    <div className="p-2.5 rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/50 flex items-center gap-2 text-[11px] font-bold text-orange-800 dark:text-orange-300">
                                        <Flame className="h-4 w-4 text-orange-500 shrink-0" />
                                        <span>Se guardará en tu Base Unificada de Referidos y pasará automáticamente a Proyecto 200.</span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block">
                                                Nombre(s) *
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                autoFocus
                                                placeholder="Ej: Mariana"
                                                value={firstName}
                                                onChange={(e) => {
                                                    setFirstName(e.target.value);
                                                    setModalError("");
                                                }}
                                                className="w-full rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-900/30 px-3.5 py-2 text-sm text-slate-800 dark:text-zinc-100 placeholder:text-muted-foreground/60 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-colors"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block">
                                                Apellido(s) *
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="Ej: Garza"
                                                value={lastName}
                                                onChange={(e) => {
                                                    setLastName(e.target.value);
                                                    setModalError("");
                                                }}
                                                className="w-full rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-900/30 px-3.5 py-2 text-sm text-slate-800 dark:text-zinc-100 placeholder:text-muted-foreground/60 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-colors"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block">
                                            Teléfono celular (10 dígitos) *
                                        </label>
                                        <input
                                            type="tel"
                                            required
                                            placeholder="Ej: 55 1234 5678"
                                            value={referralPhone}
                                            onChange={(e) => {
                                                setReferralPhone(e.target.value);
                                                setModalError("");
                                            }}
                                            className="w-full rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-900/30 px-3.5 py-2 text-sm font-mono text-slate-800 dark:text-zinc-100 placeholder:text-muted-foreground/60 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block">
                                            Comentarios / Información del referido *
                                        </label>
                                        <textarea
                                            rows={3}
                                            required
                                            placeholder="Ej: Es director de ventas, referido por Roberto Pérez, tiene 2 hijos pequeños."
                                            value={referralNotes}
                                            onChange={(e) => {
                                                setReferralNotes(e.target.value);
                                                setModalError("");
                                            }}
                                            className="w-full rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-900/30 px-3.5 py-2 text-sm text-slate-800 dark:text-zinc-100 placeholder:text-muted-foreground/60 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-colors"
                                        />
                                    </div>
                                </>
                            )}

                            {selectedActivity.captureType === "ISSUED_POLICY" && (
                                <>
                                    <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50 flex items-start gap-2 text-[11px] font-semibold text-purple-800 dark:text-purple-300">
                                        <Info className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
                                        <span>
                                            Registro únicamente <strong>indicativo</strong> para que tu promotoría dé seguimiento. No contabiliza para Producción ni Ranking.
                                        </span>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block">
                                            Nombre del Contratante *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            autoFocus
                                            placeholder="Ej: Sofía Valdés"
                                            value={policyContractor}
                                            onChange={(e) => {
                                                setPolicyContractor(e.target.value);
                                                setModalError("");
                                            }}
                                            className="w-full rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-900/30 px-3.5 py-2 text-sm text-slate-800 dark:text-zinc-100 placeholder:text-muted-foreground/60 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-colors"
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block">
                                                Ramo *
                                            </label>
                                            <select
                                                value={policyRamo}
                                                onChange={(e) => {
                                                    setPolicyRamo(e.target.value);
                                                    setModalError("");
                                                }}
                                                className="w-full rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-900/30 px-3 py-2 text-sm text-slate-800 dark:text-zinc-100 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-colors"
                                            >
                                                {ISSUED_POLICY_RAMOS.map((ramo) => (
                                                    <option key={ramo} value={ramo}>
                                                        {ramo}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block">
                                                Prima aprox. (MXN) *
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                step="any"
                                                required
                                                placeholder="Ej: 24000"
                                                value={policyPremium}
                                                onChange={(e) => {
                                                    setPolicyPremium(e.target.value);
                                                    setModalError("");
                                                }}
                                                className="w-full rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-900/30 px-3.5 py-2 text-sm text-slate-800 dark:text-zinc-100 placeholder:text-muted-foreground/60 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-colors"
                                            />
                                        </div>
                                    </div>
                                </>
                            )}

                            {modalError && (
                                <div className="flex items-start gap-1.5 text-[11px] text-rose-600 font-extrabold bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl p-2.5">
                                    <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                    <span>{modalError}</span>
                                </div>
                            )}

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
                                    ) : selectedActivity.captureType === "REFERRAL_P200" ? (
                                        <Flame className="h-3.5 w-3.5" />
                                    ) : (
                                        <Plus className="h-3.5 w-3.5" />
                                    )}
                                    {selectedActivity.captureType === "REFERRAL_P200"
                                        ? "Guardar y pasar a Proyecto 200"
                                        : "Confirmar y Sumar"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* DAY PLANNER MODAL */}
            {isPlannerModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-zinc-950 rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-100 dark:border-zinc-800 flex flex-col max-h-[90vh]">
                        <div className="flex items-start justify-between mb-2 shrink-0">
                            <div>
                                <h3 className="text-lg font-black tracking-tight text-slate-800 dark:text-zinc-100 flex items-center gap-2">
                                    🗓️ Planear mi día
                                </h3>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Simula cuántas actividades lograrás hoy. Mínimo {TARGET} puntos.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsPlannerModalOpen(false)}
                                className="h-8 w-8 rounded-full bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 flex items-center justify-center text-slate-500 dark:text-zinc-400 transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto min-h-0 py-4 pr-1">
                            <div className="flex flex-col gap-3">
                                {activities.map((act) => {
                                    const count = plannerState[act.id] || 0;
                                    return (
                                        <div
                                            key={act.id}
                                            className="flex items-center justify-between gap-2 p-3 rounded-xl border border-slate-100 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-900/30"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="h-8 w-8 shrink-0 bg-white dark:bg-zinc-950 rounded-lg flex items-center justify-center shadow-sm border border-slate-100/80 dark:border-zinc-800">
                                                    {getActivityIcon(act.id, "h-4 w-4")}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold text-slate-800 dark:text-zinc-200 whitespace-normal break-words leading-snug">
                                                        {act.name}
                                                    </p>
                                                    <p className="text-[10px] text-muted-foreground">+{act.value} pts c/u</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <button
                                                    type="button"
                                                    onClick={() => updatePlannerState(act.id, -1)}
                                                    className="h-8 w-8 rounded-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 flex items-center justify-center text-slate-500 hover:text-rose-500 hover:border-rose-200 transition-colors"
                                                >
                                                    <span className="text-lg font-black leading-none -translate-y-[1px]">−</span>
                                                </button>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={count}
                                                    onChange={(e) => {
                                                        const val = parseInt(e.target.value) || 0;
                                                        setPlannerState((prev) => ({
                                                            ...prev,
                                                            [act.id]: Math.max(0, val),
                                                        }));
                                                    }}
                                                    onFocus={(e) => e.target.select()}
                                                    className="w-12 text-center text-sm font-black bg-transparent border-none focus:ring-0 m-0 p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-slate-800 dark:text-zinc-200"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => updatePlannerState(act.id, 1)}
                                                    className="h-8 w-8 rounded-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 flex items-center justify-center text-slate-500 hover:text-teal-500 hover:border-teal-200 transition-colors"
                                                >
                                                    <Plus className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {plannerError && (
                            <div className="p-3 mb-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-start gap-2 shrink-0">
                                <AlertCircle className="h-4 w-4 text-rose-500 mt-0.5 shrink-0" />
                                <p className="text-xs text-rose-700 dark:text-rose-300 font-medium">{plannerError}</p>
                            </div>
                        )}

                        <div className="pt-4 border-t border-slate-100 dark:border-zinc-800 shrink-0">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-sm font-bold text-slate-600 dark:text-zinc-400">Total Simulado:</span>
                                <span
                                    className={`text-lg font-black ${
                                        Object.entries(plannerState).reduce(
                                            (acc, [id, count]) =>
                                                acc + count * (activities.find((a) => a.id === id)?.value || 0),
                                            0
                                        ) >= TARGET
                                            ? "text-teal-600 dark:text-teal-400"
                                            : "text-rose-500 dark:text-rose-400"
                                    }`}
                                >
                                    {Object.entries(plannerState).reduce(
                                        (acc, [id, count]) =>
                                            acc + count * (activities.find((a) => a.id === id)?.value || 0),
                                        0
                                    )}{" "}
                                    pts
                                </span>
                            </div>

                            <div className="flex gap-3 justify-end">
                                <button
                                    type="button"
                                    disabled={savingPlanner}
                                    onClick={() => setIsPlannerModalOpen(false)}
                                    className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    onClick={handlePlannerSubmit}
                                    disabled={savingPlanner}
                                    className="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-indigo-500/20 transition-all flex items-center gap-1.5"
                                >
                                    {savingPlanner ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                        <CalendarDays className="h-3.5 w-3.5" />
                                    )}
                                    Guardar Planeación
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
