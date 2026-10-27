"use client";

import React, { useState, useEffect } from "react";
import { getReferidoresConActividad, getAgentesParaSelect, createReferidor } from "./actions";
import {
    toggleMyReferidorStatus,
    deleteMyReferidor
} from "../../referidores/actions";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import {
    Loader2,
    Plus,
    Users,
    UserCheck,
    Activity,
    Trophy,
    Clock,
    PauseCircle,
    PlayCircle,
    Trash2,
    Eye,
    Percent,
    Flame,
    Search
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function AdminReferidoresClient() {
    const [referidores, setReferidores] = useState<any[]>([]);
    const [agentes, setAgentes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [agentFilter, setAgentFilter] = useState("ALL");

    // Modal state
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        linkedAgentId: "",
        tempPassword: "Temporal123!",
        commissionPct: 30,
        bonusPct: 0
    });

    const loadData = async () => {
        setLoading(true);
        const [refRes, agRes] = await Promise.all([
            getReferidoresConActividad(),
            getAgentesParaSelect()
        ]);

        if (refRes.success && refRes.data) setReferidores(refRes.data);
        if (agRes.success && agRes.data) setAgentes(agRes.data);
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsSubmitting(true);

        const res = await createReferidor(formData);

        if (res.success) {
            setIsOpen(false);
            setFormData({
                name: "",
                email: "",
                phone: "",
                linkedAgentId: "",
                tempPassword: "Temporal123!",
                commissionPct: 30,
                bonusPct: 0
            });
            await loadData();
        } else {
            setError(res.error || "Ocurrió un error al crear el referidor");
        }

        setIsSubmitting(false);
    };

    const handleToggleStatus = async (id: string) => {
        const res = await toggleMyReferidorStatus(id);
        if (res.success) {
            await loadData();
        } else {
            alert(res.error || "No se pudo cambiar el estado");
        }
    };

    const handleDelete = async (ref: any) => {
        if (
            !confirm(
                `¿Dar de baja definitivamente al referidor ${ref.name}? Esto liberará 1 espacio en la cuenta de ${ref.agentName}.`
            )
        )
            return;
        const res = await deleteMyReferidor(ref.id);
        if (res.success) {
            await loadData();
        } else {
            alert(res.error || "No se pudo dar de baja al referidor");
        }
    };

    const filteredReferidores = referidores.filter((r) => {
        const matchesAgent = agentFilter === "ALL" || r.linkedAgentId === agentFilter;
        const q = searchQuery.toLowerCase();
        const matchesSearch =
            !q ||
            (r.name || "").toLowerCase().includes(q) ||
            (r.email || "").toLowerCase().includes(q) ||
            (r.agentName || "").toLowerCase().includes(q);
        return matchesAgent && matchesSearch;
    });

    const activeCount = referidores.filter((r) => r.active).length;
    const activeTodayCount = referidores.filter((r) => (r.todayPoints || 0) > 0).length;
    const reached15TodayCount = referidores.filter((r) => (r.todayPoints || 0) >= 15).length;

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
                <p className="text-muted-foreground">Cargando referidores de la promotoría...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* KPIs de Adopción y Uso de App */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center justify-between">
                    <div>
                        <span className="text-[11px] font-bold uppercase text-slate-500 block">
                            Referidores Activos
                        </span>
                        <span className="text-2xl font-black text-slate-900">
                            {activeCount}{" "}
                            <span className="text-xs font-semibold text-slate-400">
                                / {referidores.length} total
                            </span>
                        </span>
                        <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">
                            Sin ocupar asientos SaaS
                        </span>
                    </div>
                    <Users className="w-8 h-8 text-teal-600" />
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center justify-between">
                    <div>
                        <span className="text-[11px] font-bold uppercase text-slate-500 block">
                            Usando la App Hoy
                        </span>
                        <span className="text-2xl font-black text-indigo-700">
                            {activeTodayCount}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                            Con puntos registrados hoy
                        </span>
                    </div>
                    <Activity className="w-8 h-8 text-indigo-600" />
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center justify-between">
                    <div>
                        <span className="text-[11px] font-bold uppercase text-slate-500 block">
                            Meta 15 Pts Cumplida Hoy
                        </span>
                        <span className="text-2xl font-black text-emerald-600">
                            {reached15TodayCount}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                            Referidores con ≥ 15 pts hoy
                        </span>
                    </div>
                    <Trophy className="w-8 h-8 text-emerald-500" />
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center justify-between">
                    <div>
                        <span className="text-[11px] font-bold uppercase text-slate-500 block">
                            Puntos de Referidores Hoy
                        </span>
                        <span className="text-2xl font-black text-teal-700">
                            {referidores.reduce((acc, r) => acc + (r.todayPoints || 0), 0)} pts
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                            Suma diaria de la red
                        </span>
                    </div>
                    <Flame className="w-8 h-8 text-orange-500" />
                </div>
            </div>

            {/* Barra de Filtros y Alta */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <Input
                            placeholder="Buscar referidor o agente..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 h-9 text-xs"
                        />
                    </div>

                    <select
                        value={agentFilter}
                        onChange={(e) => setAgentFilter(e.target.value)}
                        className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700"
                    >
                        <option value="ALL">Todos los Agentes Titulares</option>
                        {agentes.map((ag) => (
                            <option key={ag.id} value={ag.id}>
                                {ag.name} ({ag.referidoresCount}/{ag.maxAllowed} ref.)
                            </option>
                        ))}
                    </select>
                </div>

                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-teal-600 hover:bg-teal-700 text-white font-bold">
                            <Plus className="w-4 h-4 mr-2" />
                            Alta de Referidor
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="font-black">Dar de Alta Referidor</DialogTitle>
                            <DialogDescription className="text-xs">
                                Crea un nuevo referidor y asígnalo a un Agente (máximo 5 referidores por agente, sin consumir asientos del sistema).
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 py-2">
                            {error && (
                                <div className="bg-red-50 text-red-600 p-3 rounded-md text-xs font-semibold border border-red-200">
                                    {error}
                                </div>
                            )}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1.5 sm:col-span-2">
                                    <Label htmlFor="name" className="text-xs font-bold">
                                        Nombre Completo *
                                    </Label>
                                    <Input
                                        id="name"
                                        required
                                        value={formData.name}
                                        onChange={(e) =>
                                            setFormData({ ...formData, name: e.target.value })
                                        }
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="email" className="text-xs font-bold">
                                        Correo Electrónico *
                                    </Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={(e) =>
                                            setFormData({ ...formData, email: e.target.value })
                                        }
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="phone" className="text-xs font-bold">
                                        WhatsApp
                                    </Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) =>
                                            setFormData({ ...formData, phone: e.target.value })
                                        }
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor="agent" className="text-xs font-bold">
                                        Agente Asignado *
                                    </Label>
                                    <Select
                                        required
                                        value={formData.linkedAgentId}
                                        onValueChange={(val) =>
                                            setFormData({ ...formData, linkedAgentId: val })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecciona un Agente..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {agentes.map((ag) => (
                                                <SelectItem
                                                    key={ag.id}
                                                    value={ag.id}
                                                    disabled={ag.referidoresCount >= ag.maxAllowed}
                                                >
                                                    {ag.name} ({ag.referidoresCount}/{ag.maxAllowed})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="pass" className="text-xs font-bold">
                                        Contraseña Temporal *
                                    </Label>
                                    <Input
                                        id="pass"
                                        type="text"
                                        required
                                        value={formData.tempPassword}
                                        onChange={(e) =>
                                            setFormData({ ...formData, tempPassword: e.target.value })
                                        }
                                    />
                                </div>
                            </div>

                            {/* Cálculo de Bono por Referencia de Prospectos */}
                            <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-3.5 space-y-3">
                                <span className="text-xs font-black text-indigo-900 flex items-center gap-1.5">
                                    <Percent className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                    ¿Cómo calcularás el bono de referencia de prospectos para tu referidor?
                                </span>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-xs font-bold">
                                            % Base Referencia (30% a 50%)
                                        </Label>
                                        <Input
                                            type="number"
                                            min={30}
                                            max={50}
                                            value={formData.commissionPct}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    commissionPct: Math.max(
                                                        30,
                                                        Math.min(50, Number(e.target.value) || 30)
                                                    )
                                                })
                                            }
                                            className="bg-white font-bold"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs font-bold">
                                            % Bono Adicional (0% a 50%)
                                        </Label>
                                        <Input
                                            type="number"
                                            min={0}
                                            max={50}
                                            value={formData.bonusPct}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    bonusPct: Math.max(
                                                        0,
                                                        Math.min(50, Number(e.target.value) || 0)
                                                    )
                                                })
                                            }
                                            className="bg-white font-bold"
                                        />
                                    </div>
                                </div>
                            </div>

                            <DialogFooter className="pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsOpen(false)}
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
                                    Crear Referidor
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Tabla de Monitoreo de Referidores */}
            <div className="border rounded-xl bg-white overflow-hidden shadow-xs">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50 hover:bg-slate-50">
                            <TableHead className="font-bold text-slate-700">Referidor</TableHead>
                            <TableHead className="font-bold text-slate-700">Agente Titular</TableHead>
                            <TableHead className="font-bold text-slate-700">Cálculo Bono Referencia</TableHead>
                            <TableHead className="font-bold text-slate-700">Uso de App / Últ. Act.</TableHead>
                            <TableHead className="font-bold text-slate-700">Estado</TableHead>
                            <TableHead className="text-right font-bold text-slate-700">
                                Meta Hoy (15 Pts)
                            </TableHead>
                            <TableHead className="text-right font-bold text-slate-700">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredReferidores.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={7}
                                    className="text-center py-10 text-muted-foreground"
                                >
                                    No se encontraron referidores con los filtros seleccionados.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredReferidores.map((ref) => {
                                const pts = ref.todayPoints || 0;
                                const achieved = pts >= 15;
                                const isMid = pts >= 9 && pts < 15;

                                return (
                                    <TableRow key={ref.id} className="group">
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <Link
                                                    href={`/referidores/${ref.id}`}
                                                    className="font-bold text-slate-800 hover:text-teal-600 transition-colors"
                                                >
                                                    {ref.name}
                                                </Link>
                                                <span className="text-xs text-muted-foreground">
                                                    {ref.email}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <UserCheck className="w-4 h-4 text-teal-600" />
                                                <span className="text-xs font-bold text-slate-700">
                                                    {ref.agentName}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-800 border border-indigo-200/80 px-2.5 py-1 rounded-lg text-xs font-bold">
                                                <span>Base: {ref.commissionPct ?? 30}%</span>
                                                <span className="text-indigo-300">•</span>
                                                <span>Adic: {ref.bonusPct ?? 0}%</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col text-xs">
                                                {ref.lastActivityAt ? (
                                                    <>
                                                        <span className="font-semibold text-slate-700 flex items-center gap-1">
                                                            <Clock className="w-3 h-3 text-teal-600" />
                                                            {format(
                                                                new Date(ref.lastActivityAt),
                                                                "dd MMM yyyy HH:mm",
                                                                { locale: es }
                                                            )}
                                                        </span>
                                                        <span className="text-[11px] text-slate-400">
                                                            {ref.totalActiveDays || 0} días activos •{" "}
                                                            {ref.daysReached15 || 0} días ≥ 15 pts
                                                        </span>
                                                    </>
                                                ) : (
                                                    <span className="text-xs text-rose-500 font-medium">
                                                        Sin actividad registrada
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span
                                                className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                                    ref.active
                                                        ? "bg-emerald-100 text-emerald-700"
                                                        : "bg-amber-100 text-amber-800"
                                                }`}
                                            >
                                                {ref.active ? "Activo" : "Suspendido"}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <span
                                                    className={`text-sm font-black ${
                                                        achieved
                                                            ? "text-teal-600"
                                                            : isMid
                                                            ? "text-amber-600"
                                                            : "text-rose-600"
                                                    }`}
                                                >
                                                    {pts} / 15 pts
                                                </span>
                                                <span
                                                    className={`h-2.5 w-2.5 rounded-full ${
                                                        achieved
                                                            ? "bg-teal-500"
                                                            : isMid
                                                            ? "bg-amber-500"
                                                            : "bg-rose-500"
                                                    }`}
                                                />
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    asChild
                                                    className="h-8 w-8"
                                                    title="Ver historial de 15 puntos"
                                                >
                                                    <Link href={`/referidores/${ref.id}`}>
                                                        <Eye className="w-4 h-4 text-teal-600" />
                                                    </Link>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    title={
                                                        ref.active
                                                            ? "Suspender referidor"
                                                            : "Reactivar referidor"
                                                    }
                                                    onClick={() => handleToggleStatus(ref.id)}
                                                >
                                                    {ref.active ? (
                                                        <PauseCircle className="w-4 h-4 text-amber-600" />
                                                    ) : (
                                                        <PlayCircle className="w-4 h-4 text-emerald-600" />
                                                    )}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    title="Dar de baja"
                                                    onClick={() => handleDelete(ref)}
                                                >
                                                    <Trash2 className="w-4 h-4 text-red-600" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
