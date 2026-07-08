"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DollarSign, Tag, PlayCircle, Users, ExternalLink, Calendar, Copy, CheckCircle2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"

export default function VendedorClient({ sellerData }: { sellerData: any }) {
    const { toast } = useToast()
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

    const pendingCommissions = sellerData.commissions.filter((c:any) => c.status === 'PENDING').reduce((acc: number, c: any) => acc + c.commissionEarned, 0);
    const paidCommissions = sellerData.commissions.filter((c:any) => c.status === 'PAID').reduce((acc: number, c: any) => acc + c.commissionEarned, 0);
    const totalSales = sellerData.commissions.reduce((acc: number, c: any) => acc + c.amountPaid, 0);

    const handleCopy = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        toast({ title: `Código ${code} copiado al portapapeles` });
        setTimeout(() => setCopiedCode(null), 2000);
    }

    const startDemo = async (mode: 'admin' | 'agent') => {
        // Enviar la request al API para inyectar la cookie "demoMode"
        toast({ title: "Preparando Entorno de Demo..." });
        try {
            const res = await fetch(`/api/auth/demo?mode=${mode}`, { method: "POST" });
            if (res.ok) {
                toast({ title: `¡Modo Demo (${mode === 'admin' ? 'Promotor' : 'Agente'}) Activado!` });
                window.location.href = "/";
            } else {
                toast({ variant: "destructive", title: "Error al iniciar Demo" });
            }
        } catch (error) {
            toast({ variant: "destructive", title: "Error al iniciar Demo" });
        }
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">Hola, {sellerData.name}</h1>
                    <p className="text-muted-foreground mt-1">Bienvenido a tu panel de socio afiliado.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <Button onClick={() => startDemo('admin')} className="bg-amber-500 hover:bg-amber-600 text-white font-bold h-12 px-5 shadow-lg shadow-amber-500/20 gap-2 rounded-xl transition-all hover:scale-[1.02]">
                        <PlayCircle className="w-5 h-5" />
                        Presentar Demo (Promotor/Admin)
                    </Button>
                    <Button onClick={() => startDemo('agent')} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-12 px-5 shadow-lg shadow-indigo-600/20 gap-2 rounded-xl transition-all hover:scale-[1.02]">
                        <PlayCircle className="w-5 h-5" />
                        Presentar Demo (Agente)
                    </Button>
                </div>
            </div>

            {/* Resumen Financiero */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/30 dark:bg-indigo-950/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                            <Tag className="w-4 h-4 text-indigo-500" />
                            Ventas Netas Generadas
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-slate-800 dark:text-zinc-100">${totalSales.toFixed(2)}</p>
                    </CardContent>
                </Card>
                
                <Card className="border-amber-100 dark:border-amber-900/50 bg-amber-50/30 dark:bg-amber-950/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-amber-500" />
                            Comisiones por Pagar
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-amber-600 dark:text-amber-500">${pendingCommissions.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground mt-1">Corte mensual próximo</p>
                    </CardContent>
                </Card>

                <Card className="border-emerald-100 dark:border-emerald-900/50 bg-emerald-50/30 dark:bg-emerald-950/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            Total Cobrado
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-500">${paidCommissions.toFixed(2)}</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Códigos Promocionales */}
                <Card className="lg:col-span-1 border-slate-200 dark:border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-lg">Tus Cupones</CardTitle>
                        <CardDescription>Comparte estos códigos con tus prospectos. El descuento se resta de tu comisión base ({sellerData.sellerCommissionRate}%).</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {sellerData.discountCodes.length === 0 ? (
                            <div className="text-center p-6 bg-slate-50 dark:bg-zinc-900/50 rounded-xl">
                                <p className="text-sm text-muted-foreground">Aún no tienes cupones asignados. Solicita uno al administrador.</p>
                            </div>
                        ) : (
                            sellerData.discountCodes.map((coupon: any) => (
                                <div key={coupon.id} className="p-4 bg-slate-50 dark:bg-zinc-900/50 rounded-xl border border-slate-100 dark:border-zinc-800 flex items-center justify-between group">
                                    <div>
                                        <p className="text-xl font-black font-mono text-slate-800 dark:text-zinc-200 tracking-wider">{coupon.code}</p>
                                        <p className="text-xs text-emerald-600 font-medium">Otorga {coupon.discountPercentage}% de descuento</p>
                                        <p className="text-[10px] text-muted-foreground mt-1">Tu ganancia neta: {sellerData.sellerCommissionRate - coupon.discountPercentage}%</p>
                                    </div>
                                    <button 
                                        onClick={() => handleCopy(coupon.code)}
                                        className="w-10 h-10 rounded-full flex items-center justify-center bg-white dark:bg-zinc-800 shadow-sm border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-700 transition-colors text-slate-600 dark:text-zinc-400"
                                    >
                                        {copiedCode === coupon.code ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>

                {/* Agencias Afiliadas y Comisiones */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Users className="w-5 h-5 text-blue-500" /> Tus Clientes (Agencias)
                            </CardTitle>
                            <CardDescription>Ganas comisiones vitalicias de todas las compras futuras de estas agencias.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {sellerData.referredAgencies.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-6">Aún no tienes agencias registradas con tus cupones.</p>
                            ) : (
                                <div className="space-y-3">
                                    {sellerData.referredAgencies.map((agency: any) => (
                                        <div key={agency.id} className="flex justify-between items-center p-3 border border-slate-100 dark:border-zinc-800 rounded-lg">
                                            <div>
                                                <p className="font-semibold text-slate-800 dark:text-zinc-200">{agency.name}</p>
                                                <p className="text-xs text-muted-foreground">Afiliada el {new Date(agency.createdAt).toLocaleDateString()}</p>
                                            </div>
                                            <Badge variant={agency.subscriptionStatus === 'active' ? 'default' : 'secondary'} className={agency.subscriptionStatus === 'active' ? 'bg-emerald-100 text-emerald-700' : ''}>
                                                {agency.subscriptionStatus || 'Inactiva'}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <DollarSign className="w-5 h-5 text-emerald-500" /> Historial de Comisiones
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {sellerData.commissions.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-6">Aún no tienes comisiones generadas.</p>
                            ) : (
                                <div className="space-y-3">
                                    {sellerData.commissions.map((c: any) => (
                                        <div key={c.id} className="flex justify-between items-center text-sm border-b border-slate-100 dark:border-zinc-800 pb-2 last:border-0">
                                            <div>
                                                <p className="font-medium text-slate-700 dark:text-slate-300">{c.description}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Calendar className="w-3 h-3 text-muted-foreground" />
                                                    <p className="text-[10px] text-muted-foreground">{new Date(c.createdAt).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-emerald-600 dark:text-emerald-500">+${c.commissionEarned.toFixed(2)}</p>
                                                <Badge variant={c.status === 'PAID' ? 'secondary' : 'default'} className={c.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}>
                                                    {c.status}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
