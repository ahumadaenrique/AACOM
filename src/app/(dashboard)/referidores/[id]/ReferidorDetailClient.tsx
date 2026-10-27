"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    getReferidorDetails,
    updateMyReferidorAgreement,
    toggleMyReferidorStatus
} from "../actions";
import {
    User,
    Activity,
    Trophy,
    Calendar,
    Clock,
    ChevronLeft,
    Percent,
    Flame,
    PauseCircle,
    PlayCircle,
    Loader2
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ReferidorDetailClient({ referidorId }: { referidorId: string }) {
    const [loading, setLoading] = useState(true);
    const [referidor, setReferidor] = useState<any>(null);
    const [error, setError] = useState("");
    const [editingAgreement, setEditingAgreement] = useState(false);
    const [commissionPct, setCommissionPct] = useState(30);
    const [bonusPct, setBonusPct] = useState(0);
    const [saving, setSaving] = useState(false);

    const loadData = async () => {
        setLoading(true);
        const res = await getReferidorDetails(referidorId);
        if (res.success && res.data) {
            setReferidor(res.data);
            setCommissionPct(res.data.commissionPct ?? 30);
            setBonusPct(res.data.bonusPct ?? 0);
        } else {
            setError(res.error || "Ocurrió un error");
        }
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, [referidorId]);

    const handleSaveAgreement = async () => {
        setSaving(true);
        const res = await updateMyReferidorAgreement({
            referidorId,
            commissionPct: Number(commissionPct),
            bonusPct: Number(bonusPct)
        });
        if (res.success) {
            setEditingAgreement(false);
            await loadData();
        } else {
            alert(res.error || "Error al actualizar cálculo de bono por referencia");
        }
        setSaving(false);
    };

    const handleToggleActive = async () => {
        const res = await toggleMyReferidorStatus(referidorId);
        if (res.success) {
            await loadData();
        } else {
            alert(res.error || "Error al cambiar estado");
        }
    };

    if (loading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
        );
    }

    if (error || !referidor) {
        return (
            <div className="text-center p-8 text-rose-500 font-medium">
                {error || "No se pudo cargar la información del referidor."}
            </div>
        );
    }

    const target = 15;
    const progressPercent = Math.min((referidor.todayPoints / target) * 100, 100);
    const achieved = referidor.todayPoints >= target;
    const isMid = referidor.todayPoints >= 9 && referidor.todayPoints < target;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" asChild className="h-9 w-9 rounded-xl">
                        <Link href="/referidores">
                            <ChevronLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-2.5">
                            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-zinc-100">
                                {referidor.name}
                            </h1>
                            <span
                                className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase ${
                                    referidor.active
                                        ? "bg-emerald-100 text-emerald-700"
                                        : "bg-amber-100 text-amber-800"
                                }`}
                            >
                                {referidor.active ? "Activo" : "Suspendido"}
                            </span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-500">
                            {referidor.email} {referidor.phone ? `• WhatsApp: ${referidor.phone}` : ""}
                        </p>
                    </div>
                </div>

                <Button
                    variant="outline"
                    onClick={handleToggleActive}
                    className={`font-bold text-xs ${
                        referidor.active
                            ? "border-amber-200 text-amber-700 hover:bg-amber-50"
                            : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                    }`}
                >
                    {referidor.active ? (
                        <>
                            <PauseCircle className="w-4 h-4 mr-1.5" />
                            Suspender Referidor
                        </>
                    ) : (
                        <>
                            <PlayCircle className="w-4 h-4 mr-1.5" />
                            Reactivar Referidor
                        </>
                    )}
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-6 md:col-span-1">
                    {/* Tarjeta 1: 15 Puntos Diarios */}
                    <Card className="overflow-hidden border-slate-200 shadow-xs">
                        <CardHeader className="pb-3 bg-slate-50 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                                    <User className="h-5 w-5 text-teal-700" />
                                </div>
                                <div className="overflow-hidden">
                                    <CardTitle className="text-base font-bold truncate text-slate-800">
                                        Monitoreo 15 Puntos
                                    </CardTitle>
                                    <p className="text-xs text-slate-500 truncate">
                                        Meta diaria de Referidor
                                    </p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4 pb-5">
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 text-sm font-medium text-slate-600">
                                        <Activity className="w-4 h-4 text-teal-600" />
                                        <span>Puntos Hoy</span>
                                    </div>
                                    <div className="flex items-baseline gap-1">
                                        <span
                                            className={`text-3xl font-black ${
                                                achieved
                                                    ? "text-teal-600"
                                                    : isMid
                                                    ? "text-amber-600"
                                                    : "text-rose-600"
                                            }`}
                                        >
                                            {referidor.todayPoints}
                                        </span>
                                        <span className="text-xs text-slate-400 font-bold uppercase">
                                            / {target}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
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
                                    <div className="flex justify-between text-[11px] font-semibold text-slate-500">
                                        <span>Días activos: {referidor.totalActiveDays || 0}</span>
                                        <span>{progressPercent.toFixed(0)}% hoy</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-center">
                                    <div className="bg-slate-50 rounded-lg p-2">
                                        <span className="text-[10px] font-bold uppercase text-slate-400 block">
                                            Días ≥ 15 pts
                                        </span>
                                        <span className="text-lg font-black text-teal-700">
                                            {referidor.daysReached15 || 0}
                                        </span>
                                    </div>
                                    <div className="bg-slate-50 rounded-lg p-2">
                                        <span className="text-[10px] font-bold uppercase text-slate-400 block">
                                            Contactos P200
                                        </span>
                                        <span className="text-lg font-black text-orange-600">
                                            {referidor.project200Contacts?.length || 0}
                                        </span>
                                    </div>
                                </div>

                                {achieved && (
                                    <div className="bg-teal-50 border border-teal-100 rounded-md p-2 flex items-center gap-2 mt-1">
                                        <Trophy className="w-4 h-4 text-teal-600" />
                                        <span className="text-xs font-semibold text-teal-700">
                                            ¡Meta diaria de 15 puntos alcanzada!
                                        </span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tarjeta 2: Cálculo de Bono por Referencia de Prospectos */}
                    <Card className="border-indigo-200 bg-indigo-50/30 shadow-xs">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-xs font-black uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                                    <Percent className="w-4 h-4 text-indigo-600 shrink-0" />
                                    Bono de Referencia de Prospectos
                                </CardTitle>
                                {!editingAgreement && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setEditingAgreement(true)}
                                        className="h-7 text-xs font-bold text-indigo-700"
                                    >
                                        Editar
                                    </Button>
                                )}
                            </div>
                            <CardDescription className="text-[11px] text-indigo-700/80">
                                ¿Cómo calcularás el bono de referencia de prospectos para tu referidor? (Privado)
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {!editingAgreement ? (
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-white rounded-xl p-3 border border-indigo-100 text-center">
                                        <span className="text-[10px] font-bold uppercase text-indigo-500 block">
                                            % Base Referencia
                                        </span>
                                        <span className="text-2xl font-black text-indigo-900">
                                            {referidor.commissionPct ?? 30}%
                                        </span>
                                        <span className="text-[10px] text-slate-400 block">Rango 30–50%</span>
                                    </div>
                                    <div className="bg-white rounded-xl p-3 border border-indigo-100 text-center">
                                        <span className="text-[10px] font-bold uppercase text-indigo-500 block">
                                            % Bono Adicional
                                        </span>
                                        <span className="text-2xl font-black text-indigo-900">
                                            {referidor.bonusPct ?? 0}%
                                        </span>
                                        <span className="text-[10px] text-slate-400 block">Rango 0–50%</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3 bg-white p-3 rounded-xl border border-indigo-200">
                                    <div className="space-y-1">
                                        <Label className="text-xs font-bold">
                                            % Base para bono de referencia (30% a 50%)
                                        </Label>
                                        <Input
                                            type="number"
                                            min={30}
                                            max={50}
                                            value={commissionPct}
                                            onChange={(e) =>
                                                setCommissionPct(
                                                    Math.max(30, Math.min(50, Number(e.target.value) || 30))
                                                )
                                            }
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs font-bold">
                                            % Adicional por metas (0% a 50%)
                                        </Label>
                                        <Input
                                            type="number"
                                            min={0}
                                            max={50}
                                            value={bonusPct}
                                            onChange={(e) =>
                                                setBonusPct(
                                                    Math.max(0, Math.min(50, Number(e.target.value) || 0))
                                                )
                                            }
                                        />
                                    </div>
                                    <div className="flex justify-end gap-2 pt-1">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setEditingAgreement(false)}
                                            disabled={saving}
                                        >
                                            Cancelar
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={handleSaveAgreement}
                                            disabled={saving}
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                                        >
                                            {saving && <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />}
                                            Guardar
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Columna Derecha: Historial de Actividades de 15 Puntos + Proyecto 200 */}
                <div className="md:col-span-2 space-y-6">
                    <Card className="border-slate-200 shadow-xs">
                        <CardHeader className="border-b border-slate-100 bg-white">
                            <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <Activity className="h-5 w-5 text-teal-600" />
                                Historial de Actividades (15 Puntos Diarios)
                            </CardTitle>
                            <CardDescription>
                                Últimos registros capturados por {referidor.name} en la app
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            {referidor.logs && referidor.logs.length > 0 ? (
                                <div className="divide-y divide-slate-100 max-h-[460px] overflow-y-auto">
                                    {referidor.logs.map((log: any) => (
                                        <div
                                            key={log.id}
                                            className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                                        >
                                            <div className="flex flex-col gap-1">
                                                <span className="font-semibold text-sm text-slate-800">
                                                    {log.activityName}
                                                </span>
                                                {log.prospectName && (
                                                    <span className="text-xs text-slate-600 font-medium">
                                                        Prospecto: <strong>{log.prospectName}</strong>
                                                    </span>
                                                )}
                                                <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" />
                                                        {format(new Date(log.createdAt), "dd MMM yyyy", {
                                                            locale: es
                                                        })}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        {format(new Date(log.createdAt), "HH:mm")}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="bg-teal-50 text-teal-700 px-3 py-1 rounded-full text-sm font-bold border border-teal-100">
                                                +{log.points} pts
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center flex flex-col items-center justify-center text-slate-500 space-y-2">
                                    <Activity className="h-8 w-8 text-slate-300" />
                                    <p className="text-sm font-medium">
                                        No hay actividades registradas aún por este referidor.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Resumen de Prospectos en Proyecto 200 del Referidor */}
                    {referidor.project200Contacts && referidor.project200Contacts.length > 0 && (
                        <Card className="border-slate-200 shadow-xs">
                            <CardHeader className="border-b border-slate-100 bg-white">
                                <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                                    <Flame className="h-5 w-5 text-orange-500" />
                                    Prospectos Recientes en Proyecto 200 ({referidor.project200Contacts.length})
                                </CardTitle>
                                <CardDescription>
                                    Contactos que este referidor está trabajando en su módulo de Proyecto 200
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto">
                                    {referidor.project200Contacts.map((c: any) => (
                                        <div
                                            key={c.id}
                                            className="px-4 py-3 flex items-center justify-between text-xs hover:bg-slate-50"
                                        >
                                            <div>
                                                <span className="font-bold text-slate-800 block">
                                                    {c.fullName}
                                                </span>
                                                <span className="text-slate-500">{c.phone}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="px-2 py-0.5 rounded-full font-bold bg-orange-50 text-orange-700 border border-orange-200">
                                                    {c.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
