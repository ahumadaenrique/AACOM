"use client";

import React, { useState, useEffect } from "react";
import {
    getMisReferidores,
    createMyReferidor,
    updateMyReferidorAgreement,
    toggleMyReferidorStatus,
    resetMyReferidorPassword,
    deleteMyReferidor
} from "./actions";
import {
    Loader2,
    User,
    Trophy,
    Activity,
    Plus,
    MoreVertical,
    PauseCircle,
    PlayCircle,
    Trash2,
    KeyRound,
    Percent,
    CheckCircle2,
    Copy,
    Share2,
    Eye,
    Sparkles,
    ShieldCheck,
    Flame,
    Clock,
    Users
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function ReferidoresClient({ agentName = "Agente" }: { agentName?: string }) {
    const [referidores, setReferidores] = useState<any[]>([]);
    const [maxAllowed, setMaxAllowed] = useState(5);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "SUSPENDED">("ALL");

    // Modal Alta state
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState("");
    const [createdSuccessData, setCreatedSuccessData] = useState<any | null>(null);
    const [copiedInvite, setCopiedInvite] = useState(false);

    const [createForm, setCreateForm] = useState({
        name: "",
        email: "",
        phone: "",
        tempPassword: "Temporal123!",
        commissionPct: 30,
        bonusPct: 0
    });

    // Modal Editar Cálculo de Bono por Referencia
    const [editingReferidor, setEditingReferidor] = useState<any | null>(null);
    const [editForm, setEditForm] = useState({
        name: "",
        phone: "",
        commissionPct: 30,
        bonusPct: 0
    });
    const [editError, setEditError] = useState("");
    const [savingEdit, setSavingEdit] = useState(false);

    // Modal Cambiar Contraseña
    const [passwordTarget, setPasswordTarget] = useState<any | null>(null);
    const [newTempPassword, setNewTempPassword] = useState("Temporal123!");
    const [savingPassword, setSavingPassword] = useState(false);
    const [passwordMsg, setPasswordMsg] = useState("");

    // Modal Confirmar Baja Definitiva
    const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
    const [deleting, setDeleting] = useState(false);

    const loadData = async () => {
        setLoading(true);
        const res = await getMisReferidores();
        if (res.success && res.data) {
            setReferidores(res.data);
            if (res.maxAllowed) setMaxAllowed(res.maxAllowed);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const generateRandomPassword = () => {
        const num = Math.floor(1000 + Math.random() * 9000);
        return `Referidor${num}!`;
    };

    const handleOpenCreateModal = () => {
        setFormError("");
        setCreatedSuccessData(null);
        setCopiedInvite(false);
        setCreateForm({
            name: "",
            email: "",
            phone: "",
            tempPassword: generateRandomPassword(),
            commissionPct: 30,
            bonusPct: 0
        });
        setIsCreateOpen(true);
    };

    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError("");
        setIsSubmitting(true);

        const res = await createMyReferidor(createForm);
        if (res.success && res.referidor) {
            setCreatedSuccessData(res.referidor);
            await loadData();
        } else {
            setFormError(res.error || "No se pudo dar de alta al referidor.");
        }
        setIsSubmitting(false);
    };

    const buildInviteMessage = (refData: any) => {
        const origin = typeof window !== "undefined" ? window.location.origin : "https://app.aacom.mx";
        return `¡Hola ${refData.name}! 👋\n\nTe he dado de alta como Referidor en nuestra plataforma de *${agentName}* para llevar juntos el seguimiento de tus *15 puntos diarios*, capacitaciones E-Learning y tu lista de Proyecto 200.\n\n🔗 *Enlace de acceso:* ${origin}/login\n📧 *Usuario:* ${refData.email}\n🔑 *Contraseña temporal:* ${refData.tempPassword}\n\n*(Al ingresar por primera vez el sistema te pedirá elegir tu propia contraseña personal).*`;
    };

    const handleCopyInvite = (refData: any) => {
        const text = buildInviteMessage(refData);
        navigator.clipboard.writeText(text);
        setCopiedInvite(true);
        setTimeout(() => setCopiedInvite(false), 3000);
    };

    const handleSendWhatsApp = (refData: any) => {
        const text = encodeURIComponent(buildInviteMessage(refData));
        const cleanDigits = String(refData.phone || "").replace(/\D/g, "");
        const phoneParam = cleanDigits.length >= 10 ? `52${cleanDigits.slice(-10)}` : "";
        const url = phoneParam
            ? `https://wa.me/${phoneParam}?text=${text}`
            : `https://wa.me/?text=${text}`;
        window.open(url, "_blank");
    };

    const handleOpenEditAgreement = (ref: any) => {
        setEditError("");
        setEditingReferidor(ref);
        setEditForm({
            name: ref.name || "",
            phone: ref.phone || "",
            commissionPct: ref.commissionPct ?? 30,
            bonusPct: ref.bonusPct ?? 0
        });
    };

    const handleSaveAgreement = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingReferidor) return;
        setEditError("");
        setSavingEdit(true);

        const res = await updateMyReferidorAgreement({
            referidorId: editingReferidor.id,
            name: editForm.name,
            phone: editForm.phone,
            commissionPct: Number(editForm.commissionPct),
            bonusPct: Number(editForm.bonusPct)
        });

        if (res.success) {
            setEditingReferidor(null);
            await loadData();
        } else {
            setEditError(res.error || "Error al guardar el cálculo del bono por referencia.");
        }
        setSavingEdit(false);
    };

    const handleToggleStatus = async (ref: any) => {
        const res = await toggleMyReferidorStatus(ref.id);
        if (res.success) {
            await loadData();
        } else {
            alert(res.error || "Error al cambiar el estado del referidor");
        }
    };

    const handleSavePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!passwordTarget) return;
        setSavingPassword(true);
        setPasswordMsg("");

        const res = await resetMyReferidorPassword(passwordTarget.id, newTempPassword);
        if (res.success) {
            setPasswordMsg(res.message || "Contraseña actualizada.");
            setTimeout(() => {
                setPasswordTarget(null);
                setPasswordMsg("");
            }, 1500);
        } else {
            alert(res.error || "Error al actualizar la contraseña");
        }
        setSavingPassword(false);
    };

    const handleConfirmDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        const res = await deleteMyReferidor(deleteTarget.id);
        if (res.success) {
            setDeleteTarget(null);
            await loadData();
        } else {
            alert(res.error || "No se pudo dar de baja al referidor");
        }
        setDeleting(false);
    };

    const totalCount = referidores.length;
    const activeCount = referidores.filter((r) => r.active).length;
    const suspendedCount = referidores.filter((r) => !r.active).length;
    const quotaReached = totalCount >= maxAllowed;

    const filteredReferidores = referidores.filter((r) => {
        if (statusFilter === "ACTIVE") return r.active;
        if (statusFilter === "SUSPENDED") return !r.active;
        return true;
    });

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
                <p className="text-muted-foreground text-sm font-medium">Cargando tu red de referidores...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Banner Superior de Capacidad y Control */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2.5">
                        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                            <Users className="w-6 h-6 text-teal-600" />
                            Mis Referidores
                        </h1>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800">
                            Cupo: {totalCount} / {maxAllowed} registrados
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                            Sin costo de asiento en promotoría
                        </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400">
                        Da de alta hasta <strong>{maxAllowed} referidores</strong>, lleva el registro privado de cómo calcularás su <strong>bono de referencia de prospectos</strong> y monitorea su meta de <strong>15 puntos diarios</strong>.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    {/* Barra visual de cupo */}
                    <div className="bg-slate-50 dark:bg-zinc-950 border border-slate-200/80 dark:border-zinc-800 rounded-xl px-4 py-2.5 min-w-[200px]">
                        <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                            <span className="text-slate-600 dark:text-zinc-400">Espacios de Agente</span>
                            <span className={quotaReached ? "text-amber-600" : "text-teal-600"}>
                                {maxAllowed - totalCount} disponibles
                            </span>
                        </div>
                        <div className="h-2 w-full bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all duration-500 ${
                                    quotaReached ? "bg-amber-500" : "bg-teal-600"
                                }`}
                                style={{ width: `${Math.min(100, (totalCount / maxAllowed) * 100)}%` }}
                            />
                        </div>
                    </div>

                    <Button
                        onClick={handleOpenCreateModal}
                        disabled={quotaReached}
                        className="bg-teal-600 hover:bg-teal-700 text-white font-bold h-11 px-5 rounded-xl shadow-sm"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        {quotaReached ? "Cupo Lleno (5/5)" : "Dar de Alta Referidor"}
                    </Button>
                </div>
            </div>

            {/* Filtros de Estado y Resumen Rápido */}
            {totalCount > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200/70 dark:border-zinc-800">
                        <button
                            type="button"
                            onClick={() => setStatusFilter("ALL")}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                statusFilter === "ALL"
                                    ? "bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 shadow-xs"
                                    : "text-slate-500 hover:text-slate-800"
                            }`}
                        >
                            Todos ({totalCount})
                        </button>
                        <button
                            type="button"
                            onClick={() => setStatusFilter("ACTIVE")}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                statusFilter === "ACTIVE"
                                    ? "bg-white dark:bg-zinc-800 text-emerald-700 dark:text-emerald-400 shadow-xs"
                                    : "text-slate-500 hover:text-slate-800"
                            }`}
                        >
                            Activos ({activeCount})
                        </button>
                        <button
                            type="button"
                            onClick={() => setStatusFilter("SUSPENDED")}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                statusFilter === "SUSPENDED"
                                    ? "bg-white dark:bg-zinc-800 text-amber-700 dark:text-amber-400 shadow-xs"
                                    : "text-slate-500 hover:text-slate-800"
                            }`}
                        >
                            Suspendidos ({suspendedCount})
                        </button>
                    </div>

                    {quotaReached && (
                        <p className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
                            💡 Tienes {maxAllowed}/{maxAllowed} referidores registrados. Si deseas agregar uno nuevo, da de baja a uno existente.
                        </p>
                    )}
                </div>
            )}

            {/* Estado Vacío */}
            {totalCount === 0 ? (
                <div className="bg-white dark:bg-zinc-900 border border-dashed border-slate-300 dark:border-zinc-800 rounded-2xl flex flex-col items-center justify-center py-16 px-4 gap-4 text-center">
                    <div className="w-16 h-16 bg-teal-50 dark:bg-teal-950/40 rounded-2xl flex items-center justify-center">
                        <Users className="w-8 h-8 text-teal-600" />
                    </div>
                    <div className="space-y-1 max-w-md">
                        <h3 className="text-lg font-extrabold text-slate-800 dark:text-zinc-100">
                            Comienza a armar tu equipo de Referidores
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
                            Puedes dar de alta hasta <strong>5 referidores</strong> sin ocupar asientos de la promotoría. Ellos tendrán acceso a sus <strong>15 puntos diarios</strong>, <strong>Proyecto 200</strong>, <strong>E-Learning</strong> e <strong>IA Avanzada</strong>.
                        </p>
                    </div>
                    <Button
                        onClick={handleOpenCreateModal}
                        className="bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl mt-1"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Dar de Alta mi Primer Referidor
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredReferidores.map((ref) => {
                        const target = 15;
                        const points = ref.todayPoints || 0;
                        const progressPercent = Math.min(100, (points / target) * 100);
                        const achieved = points >= target;
                        const isMid = points >= 9 && points < target;

                        return (
                            <Card
                                key={ref.id}
                                className={`overflow-hidden transition-all duration-200 border flex flex-col justify-between ${
                                    ref.active
                                        ? "border-slate-200 dark:border-zinc-800 hover:shadow-md bg-white dark:bg-zinc-900"
                                        : "border-amber-200/80 bg-slate-50/70 dark:bg-zinc-900/50 opacity-85"
                                }`}
                            >
                                <div>
                                    <CardHeader className="pb-3 bg-slate-50/80 dark:bg-zinc-950/50 border-b border-slate-100 dark:border-zinc-800">
                                        <div className="flex items-start justify-between gap-2">
                                            <Link
                                                href={`/referidores/${ref.id}`}
                                                className="flex items-center gap-3 min-w-0 group flex-1"
                                            >
                                                <div
                                                    className={`h-11 w-11 rounded-full flex items-center justify-center shrink-0 font-black text-sm ${
                                                        ref.active
                                                            ? "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300"
                                                            : "bg-amber-100 text-amber-800"
                                                    }`}
                                                >
                                                    {(ref.name || "R")
                                                        .split(" ")
                                                        .map((w: string) => w[0])
                                                        .slice(0, 2)
                                                        .join("")
                                                        .toUpperCase()}
                                                </div>
                                                <div className="overflow-hidden">
                                                    <div className="flex items-center gap-2">
                                                        <CardTitle className="text-base font-extrabold truncate text-slate-800 dark:text-zinc-100 group-hover:text-teal-600 transition-colors">
                                                            {ref.name}
                                                        </CardTitle>
                                                    </div>
                                                    <p className="text-xs text-slate-500 truncate">{ref.email}</p>
                                                    <div className="mt-1 flex items-center gap-1.5">
                                                        <span
                                                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                                                                ref.active
                                                                    ? "bg-emerald-100 text-emerald-700"
                                                                    : "bg-amber-100 text-amber-800"
                                                            }`}
                                                        >
                                                            {ref.active ? "Activo" : "Suspendido"}
                                                        </span>
                                                        {ref.project200Count > 0 && (
                                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200 flex items-center gap-1">
                                                                <Flame className="w-3 h-3 text-orange-500" />
                                                                {ref.project200Count} P200
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </Link>

                                            {/* Menú de Acciones del Agente */}
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                                                        <MoreVertical className="h-4 w-4 text-slate-500" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-60">
                                                    <DropdownMenuLabel className="text-xs">
                                                        Gestionar a {ref.name}
                                                    </DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem asChild className="cursor-pointer text-xs font-medium">
                                                        <Link href={`/referidores/${ref.id}`} className="flex items-center gap-2">
                                                            <Eye className="w-4 h-4 text-teal-600" />
                                                            Ver Actividad y Prospectos
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => handleOpenEditAgreement(ref)}
                                                        className="cursor-pointer text-xs font-medium flex items-center gap-2"
                                                    >
                                                        <Percent className="w-4 h-4 text-indigo-600" />
                                                        Configurar Bono por Referencia
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setPasswordTarget(ref);
                                                            setNewTempPassword(generateRandomPassword());
                                                            setPasswordMsg("");
                                                        }}
                                                        className="cursor-pointer text-xs font-medium flex items-center gap-2"
                                                    >
                                                        <KeyRound className="w-4 h-4 text-blue-600" />
                                                        Asignar Nueva Contraseña
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={() => handleToggleStatus(ref)}
                                                        className="cursor-pointer text-xs font-semibold flex items-center gap-2"
                                                    >
                                                        {ref.active ? (
                                                            <>
                                                                <PauseCircle className="w-4 h-4 text-amber-600" />
                                                                <span className="text-amber-700">Suspender Acceso</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <PlayCircle className="w-4 h-4 text-emerald-600" />
                                                                <span className="text-emerald-700">Reactivar Acceso</span>
                                                            </>
                                                        )}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => setDeleteTarget(ref)}
                                                        className="cursor-pointer text-xs font-bold text-red-600 focus:text-red-600 flex items-center gap-2"
                                                    >
                                                        <Trash2 className="w-4 h-4 text-red-600" />
                                                        Dar de Baja (Liberar espacio)
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="pt-4 pb-4 space-y-4">
                                        {/* Record Privado de Cálculo de Bono por Referencia */}
                                        <div className="bg-indigo-50/60 dark:bg-indigo-950/25 border border-indigo-100 dark:border-indigo-900/40 rounded-xl p-2.5 flex items-center justify-between gap-2">
                                            <div className="space-y-0.5">
                                                <span className="text-[10px] font-extrabold uppercase tracking-wide text-indigo-700 dark:text-indigo-300 block">
                                                    Bono por Referencia de Prospectos
                                                </span>
                                                <div className="flex items-center gap-3">
                                                    <div>
                                                        <span className="text-[10px] font-semibold text-indigo-500 block">
                                                            Factor Base
                                                        </span>
                                                        <span className="text-sm font-black text-indigo-900 dark:text-indigo-200">
                                                            {ref.commissionPct ?? 30}%
                                                        </span>
                                                    </div>
                                                    <div className="h-6 w-px bg-indigo-200 dark:bg-indigo-800" />
                                                    <div>
                                                        <span className="text-[10px] font-semibold text-indigo-500 block">
                                                            Bono Adicional
                                                        </span>
                                                        <span className="text-sm font-black text-indigo-900 dark:text-indigo-200">
                                                            {ref.bonusPct ?? 0}%
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleOpenEditAgreement(ref)}
                                                className="h-7 px-2 text-[11px] font-bold text-indigo-700 hover:text-indigo-900 hover:bg-indigo-100/70"
                                            >
                                                Ajustar
                                            </Button>
                                        </div>

                                        {/* Monitoreo de 15 Puntos Diarios */}
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-zinc-300">
                                                    <Activity className="w-4 h-4 text-teal-600" />
                                                    <span>Meta Diaria (15 Puntos)</span>
                                                </div>
                                                <div className="flex items-baseline gap-1">
                                                    <span
                                                        className={`text-2xl font-black ${
                                                            achieved
                                                                ? "text-teal-600"
                                                                : isMid
                                                                ? "text-amber-600"
                                                                : "text-rose-600"
                                                        }`}
                                                    >
                                                        {points}
                                                    </span>
                                                    <span className="text-xs text-slate-400 font-bold">/ {target} pts</span>
                                                </div>
                                            </div>

                                            <div className="space-y-1">
                                                <div className="h-2.5 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full transition-all duration-500 ${
                                                            achieved
                                                                ? "bg-teal-500"
                                                                : isMid
                                                                ? "bg-amber-400"
                                                                : "bg-rose-400"
                                                        }`}
                                                        style={{ width: `${progressPercent}%` }}
                                                    />
                                                </div>
                                                <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3 text-slate-400" />
                                                        {ref.lastActivityAt
                                                            ? `Últ. act: ${format(new Date(ref.lastActivityAt), "dd MMM HH:mm", { locale: es })}`
                                                            : "Sin actividad registrada"}
                                                    </span>
                                                    <span className="font-bold">{progressPercent.toFixed(0)}%</span>
                                                </div>
                                            </div>

                                            {achieved && (
                                                <div className="bg-teal-50 border border-teal-200 rounded-lg p-2 flex items-center gap-2">
                                                    <Trophy className="w-4 h-4 text-teal-600 shrink-0" />
                                                    <span className="text-xs font-bold text-teal-800">
                                                        ¡Cumplió sus 15 puntos hoy!
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </div>

                                <div className="px-4 py-2.5 bg-slate-50/70 dark:bg-zinc-950/40 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between">
                                    <Link
                                        href={`/referidores/${ref.id}`}
                                        className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1"
                                    >
                                        Ver bitácora de 15 puntos →
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={() => handleToggleStatus(ref)}
                                        className={`text-[11px] font-bold hover:underline ${
                                            ref.active ? "text-amber-600" : "text-emerald-600"
                                        }`}
                                    >
                                        {ref.active ? "Suspender" : "Reactivar"}
                                    </button>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* MODAL 1: ALTA DE REFERIDOR + CÁLCULO DE BONO DE REFERENCIA + INVITACIÓN WHATSAPP */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="sm:max-w-lg">
                    {!createdSuccessData ? (
                        <>
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2 text-xl font-black">
                                    <Plus className="w-5 h-5 text-teal-600" />
                                    Dar de Alta Nuevo Referidor
                                </DialogTitle>
                                <DialogDescription className="text-xs sm:text-sm">
                                    Crea su cuenta de acceso y registra cómo calcularás su bono de referencia de prospectos. Ocupará 1 de tus {maxAllowed} espacios disponibles ({totalCount}/{maxAllowed} en uso).
                                </DialogDescription>
                            </DialogHeader>

                            <form onSubmit={handleCreateSubmit} className="space-y-4 py-2">
                                {formError && (
                                    <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-semibold border border-red-200">
                                        {formError}
                                    </div>
                                )}

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="space-y-1.5 sm:col-span-2">
                                        <Label htmlFor="ref-name" className="text-xs font-bold">
                                            Nombre Completo *
                                        </Label>
                                        <Input
                                            id="ref-name"
                                            required
                                            placeholder="Ej. Carlos Méndez"
                                            value={createForm.name}
                                            onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="ref-email" className="text-xs font-bold">
                                            Correo Electrónico *
                                        </Label>
                                        <Input
                                            id="ref-email"
                                            type="email"
                                            required
                                            placeholder="carlos@correo.com"
                                            value={createForm.email}
                                            onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="ref-phone" className="text-xs font-bold">
                                            WhatsApp (10 dígitos)
                                        </Label>
                                        <Input
                                            id="ref-phone"
                                            type="tel"
                                            placeholder="5512345678"
                                            value={createForm.phone}
                                            onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="ref-pass" className="text-xs font-bold">
                                            Contraseña Temporal *
                                        </Label>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setCreateForm({ ...createForm, tempPassword: generateRandomPassword() })
                                            }
                                            className="text-[11px] font-bold text-teal-600 hover:underline"
                                        >
                                            Generar otra clave
                                        </button>
                                    </div>
                                    <Input
                                        id="ref-pass"
                                        type="text"
                                        required
                                        value={createForm.tempPassword}
                                        onChange={(e) => setCreateForm({ ...createForm, tempPassword: e.target.value })}
                                    />
                                    <p className="text-[11px] text-slate-400">
                                        El referidor deberá cambiarla por una personal la primera vez que inicie sesión.
                                    </p>
                                </div>

                                {/* Bloque Cálculo de Bono por Referencia de Prospectos */}
                                <div className="bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-900 rounded-xl p-4 space-y-4">
                                    <div className="space-y-1">
                                        <h4 className="text-xs font-black text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                                            <Percent className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                            ¿Cómo calcularás el bono de referencia de prospectos para tu referidor?
                                        </h4>
                                        <p className="text-[11px] text-indigo-700/80 dark:text-indigo-300/80 leading-relaxed">
                                            Registro privado de tus parámetros internos para calcular su <strong>bono por referencia de prospectos</strong> (solo visible para ti y Administración).
                                        </p>
                                    </div>

                                    {/* % Factor Base: 30% a 50% */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                                                % Base para cálculo del bono por referencia (Mín. 30% - Máx. 50%)
                                            </Label>
                                            <div className="flex items-center gap-1">
                                                <Input
                                                    type="number"
                                                    min={30}
                                                    max={50}
                                                    step={1}
                                                    value={createForm.commissionPct}
                                                    onChange={(e) => {
                                                        const val = Math.max(30, Math.min(50, Number(e.target.value) || 30));
                                                        setCreateForm({ ...createForm, commissionPct: val });
                                                    }}
                                                    className="w-18 h-8 text-center font-black text-indigo-900 bg-white"
                                                />
                                                <span className="text-xs font-black text-indigo-900">%</span>
                                            </div>
                                        </div>
                                        <input
                                            type="range"
                                            min={30}
                                            max={50}
                                            step={1}
                                            value={createForm.commissionPct}
                                            onChange={(e) =>
                                                setCreateForm({ ...createForm, commissionPct: Number(e.target.value) })
                                            }
                                            className="w-full accent-indigo-600 cursor-pointer"
                                        />
                                        <div className="flex justify-between text-[10px] font-bold text-indigo-500">
                                            <span>30% (Mínimo)</span>
                                            <span>40%</span>
                                            <span>50% (Máximo)</span>
                                        </div>
                                    </div>

                                    {/* % Bono Adicional: 0% a 50% */}
                                    <div className="space-y-1.5 pt-1 border-t border-indigo-200/60">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                                                % Adicional por metas / productividad (Mín. 0% - Máx. 50%)
                                            </Label>
                                            <div className="flex items-center gap-1">
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    max={50}
                                                    step={1}
                                                    value={createForm.bonusPct}
                                                    onChange={(e) => {
                                                        const val = Math.max(0, Math.min(50, Number(e.target.value) || 0));
                                                        setCreateForm({ ...createForm, bonusPct: val });
                                                    }}
                                                    className="w-18 h-8 text-center font-black text-indigo-900 bg-white"
                                                />
                                                <span className="text-xs font-black text-indigo-900">%</span>
                                            </div>
                                        </div>
                                        <input
                                            type="range"
                                            min={0}
                                            max={50}
                                            step={1}
                                            value={createForm.bonusPct}
                                            onChange={(e) =>
                                                setCreateForm({ ...createForm, bonusPct: Number(e.target.value) })
                                            }
                                            className="w-full accent-indigo-600 cursor-pointer"
                                        />
                                        <div className="flex justify-between text-[10px] font-bold text-indigo-500">
                                            <span>0% (Sin adicional)</span>
                                            <span>25%</span>
                                            <span>50% (Máximo)</span>
                                        </div>
                                    </div>
                                </div>

                                <DialogFooter className="pt-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsCreateOpen(false)}
                                        disabled={isSubmitting}
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="bg-teal-600 hover:bg-teal-700 text-white font-bold"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                        Crear Cuenta de Referidor
                                    </Button>
                                </DialogFooter>
                            </form>
                        </>
                    ) : (
                        /* Pantalla Post-Alta: Compartir por WhatsApp en 1 Clic */
                        <div className="space-y-5 py-3">
                            <div className="flex flex-col items-center text-center space-y-2">
                                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                    <CheckCircle2 className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-black text-slate-900">
                                    ¡{createdSuccessData.name} ya tiene acceso!
                                </h3>
                                <p className="text-xs text-slate-500 max-w-sm">
                                    Envíale sus credenciales por WhatsApp para que inicie sesión y comience a registrar sus 15 puntos diarios.
                                </p>
                            </div>

                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-slate-500 font-medium">Usuario / Correo:</span>
                                    <span className="font-bold text-slate-900">{createdSuccessData.email}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500 font-medium">Contraseña Temporal:</span>
                                    <span className="font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                                        {createdSuccessData.tempPassword}
                                    </span>
                                </div>
                                <div className="flex justify-between pt-2 border-t border-slate-200/80">
                                    <span className="text-slate-500 font-medium">Bono por referencia (Privado):</span>
                                    <span className="font-bold text-indigo-700">
                                        {createdSuccessData.commissionPct}% Base • {createdSuccessData.bonusPct}% Adicional
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-2.5">
                                <Button
                                    type="button"
                                    onClick={() => handleSendWhatsApp(createdSuccessData)}
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                                >
                                    <Share2 className="w-4 h-4 mr-2" />
                                    Enviar Accesos por WhatsApp
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => handleCopyInvite(createdSuccessData)}
                                    className="font-bold"
                                >
                                    <Copy className="w-4 h-4 mr-2" />
                                    {copiedInvite ? "¡Copiado!" : "Copiar Mensaje"}
                                </Button>
                            </div>

                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    className="w-full font-bold"
                                    onClick={() => {
                                        setCreatedSuccessData(null);
                                        setIsCreateOpen(false);
                                    }}
                                >
                                    Listo, volver a Mis Referidores
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* MODAL 2: CONFIGURAR CÁLCULO DE BONO DE REFERENCIA DE PROSPECTOS */}
            <Dialog open={!!editingReferidor} onOpenChange={(open) => !open && setEditingReferidor(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 font-black text-base">
                            <Percent className="w-5 h-5 text-indigo-600 shrink-0" />
                            ¿Cómo calcularás el bono de referencia de prospectos para {editingReferidor?.name}?
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Actualiza tu registro privado de parámetros para calcular el bono por referencia de prospectos (Base: 30% a 50% y Adicional: 0% a 50%).
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSaveAgreement} className="space-y-4 py-2">
                        {editError && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-semibold border border-red-200">
                                {editError}
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs font-bold">Nombre</Label>
                                <Input
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs font-bold">WhatsApp</Label>
                                <Input
                                    value={editForm.phone}
                                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                    placeholder="10 dígitos"
                                />
                            </div>
                        </div>

                        <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-4 space-y-4">
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-bold text-slate-800">
                                        % Base para bono de referencia (30% a 50%)
                                    </Label>
                                    <div className="flex items-center gap-1">
                                        <Input
                                            type="number"
                                            min={30}
                                            max={50}
                                            value={editForm.commissionPct}
                                            onChange={(e) =>
                                                setEditForm({
                                                    ...editForm,
                                                    commissionPct: Math.max(30, Math.min(50, Number(e.target.value) || 30))
                                                })
                                            }
                                            className="w-18 h-8 text-center font-black bg-white"
                                        />
                                        <span className="text-xs font-black">%</span>
                                    </div>
                                </div>
                                <input
                                    type="range"
                                    min={30}
                                    max={50}
                                    step={1}
                                    value={editForm.commissionPct}
                                    onChange={(e) =>
                                        setEditForm({ ...editForm, commissionPct: Number(e.target.value) })
                                    }
                                    className="w-full accent-indigo-600 cursor-pointer"
                                />
                            </div>

                            <div className="space-y-1.5 pt-2 border-t border-indigo-200/60">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-bold text-slate-800">
                                        % Adicional por metas (0% a 50%)
                                    </Label>
                                    <div className="flex items-center gap-1">
                                        <Input
                                            type="number"
                                            min={0}
                                            max={50}
                                            value={editForm.bonusPct}
                                            onChange={(e) =>
                                                setEditForm({
                                                    ...editForm,
                                                    bonusPct: Math.max(0, Math.min(50, Number(e.target.value) || 0))
                                                })
                                            }
                                            className="w-18 h-8 text-center font-black bg-white"
                                        />
                                        <span className="text-xs font-black">%</span>
                                    </div>
                                </div>
                                <input
                                    type="range"
                                    min={0}
                                    max={50}
                                    step={1}
                                    value={editForm.bonusPct}
                                    onChange={(e) =>
                                        setEditForm({ ...editForm, bonusPct: Number(e.target.value) })
                                    }
                                    className="w-full accent-indigo-600 cursor-pointer"
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setEditingReferidor(null)}
                                disabled={savingEdit}
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                                disabled={savingEdit}
                            >
                                {savingEdit && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Guardar Cálculo de Bono
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* MODAL 3: RESETEAR CONTRASEÑA TEMPORAL */}
            <Dialog open={!!passwordTarget} onOpenChange={(open) => !open && setPasswordTarget(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 font-black">
                            <KeyRound className="w-5 h-5 text-blue-600" />
                            Nueva Contraseña Temporal
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Asígnale una contraseña temporal a <strong>{passwordTarget?.name}</strong> ({passwordTarget?.email}). Al entrar se le pedirá crear una propia.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSavePassword} className="space-y-4 py-2">
                        {passwordMsg && (
                            <div className="bg-emerald-50 text-emerald-700 p-3 rounded-xl text-xs font-bold border border-emerald-200">
                                {passwordMsg}
                            </div>
                        )}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold">Contraseña Temporal</Label>
                            <Input
                                value={newTempPassword}
                                onChange={(e) => setNewTempPassword(e.target.value)}
                                required
                                minLength={6}
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setPasswordTarget(null)}>
                                Cancelar
                            </Button>
                            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold" disabled={savingPassword}>
                                {savingPassword && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Actualizar Contraseña
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* MODAL 4: CONFIRMAR BAJA DEFINITIVA */}
            <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-red-600 font-black flex items-center gap-2">
                            <Trash2 className="w-5 h-5" />
                            ¿Dar de baja definitivamente a {deleteTarget?.name}?
                        </DialogTitle>
                        <DialogDescription className="text-xs leading-relaxed pt-1">
                            Esta acción eliminará su cuenta de referidor y liberará <strong>1 espacio</strong> dentro de tu límite de {maxAllowed} referidores.
                            <br /><br />
                            💡 <em>Si solo deseas pausar su acceso temporalmente sin borrar su historial, usa la opción <strong>Suspender Acceso</strong>.</em>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
                            Cancelar
                        </Button>
                        <Button
                            type="button"
                            onClick={handleConfirmDelete}
                            className="bg-red-600 hover:bg-red-700 text-white font-bold"
                            disabled={deleting}
                        >
                            {deleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Sí, Dar de Baja y Liberar Espacio
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
