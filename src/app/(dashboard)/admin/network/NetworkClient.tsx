"use client";

import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Network, Activity, CalendarClock, CheckCircle2, AlertTriangle, Users, FileText, BarChart3, ChevronDown, ChevronRight, DollarSign, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getNetworkCommissions } from "./actions";

export default function NetworkClient() {
    const { toast } = useToast();
    const [network, setNetwork] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedSellers, setExpandedSellers] = useState<Record<string, boolean>>({});

    useEffect(() => {
        loadNetwork();
    }, []);

    const loadNetwork = async () => {
        setLoading(true);
        const res = await getNetworkCommissions();
        if (res.success) {
            setNetwork(res.network || []);
        } else {
            toast({ title: "Error al cargar la red", description: res.message, variant: "destructive" });
        }
        setLoading(false);
    };

    const toggleSeller = (sellerId: string) => {
        setExpandedSellers(prev => ({ ...prev, [sellerId]: !prev[sellerId] }));
    };

    const renderCommissionRow = (comm: any, levelLabel: string, colorClass: string) => (
        <div key={comm.id} className={`flex items-center justify-between p-3 rounded-lg border ${colorClass} mb-2 bg-slate-50/50 dark:bg-zinc-900/30`}>
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className={`font-bold ${colorClass}`}>
                        {levelLabel}
                    </Badge>
                    <span className="text-sm font-semibold text-slate-800 dark:text-zinc-200">
                        {comm.agency?.name || "Agencia"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                        ({format(new Date(comm.createdAt), "dd MMM yyyy", { locale: es })})
                    </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                    {comm.description} | {comm.discountPercentage > 0 ? `Descuento: ${comm.discountPercentage}%` : 'Sin descuento'}
                </p>
            </div>
            <div className="text-right">
                <p className="font-black text-lg text-slate-800 dark:text-zinc-100">
                    ${comm.commissionEarned.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </p>
                <div className="mt-1">
                    {comm.status === 'PENDING' ? (
                        <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200 text-[10px] uppercase">Pendiente</Badge>
                    ) : (
                        <Badge variant="default" className="bg-teal-100 text-teal-800 border-teal-200 text-[10px] uppercase">Pagado</Badge>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight flex items-center gap-2">
                        <Network className="h-8 w-8 text-indigo-600" />
                        Red de Afiliados (Multinivel)
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Auditoría de comisiones jerárquicas (Directas, Nivel 2 y Nivel 3)
                    </p>
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 gap-6">
                    {[1, 2, 3].map(i => (
                        <Card key={i} className="animate-pulse h-32 border-slate-200 dark:border-zinc-800" />
                    ))}
                </div>
            ) : network.length === 0 ? (
                <div className="text-center py-20">
                    <Layers className="h-12 w-12 text-slate-300 dark:text-zinc-700 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-600 dark:text-zinc-400">No hay vendedores registrados</h3>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {network.map((item: any) => {
                        const isExpanded = expandedSellers[item.seller.id];
                        const hasCommissions = item.stats.totalEarned > 0;
                        
                        return (
                            <Card key={item.seller.id} className="overflow-hidden border-2 transition-all hover:border-indigo-200 dark:hover:border-indigo-900 shadow-sm">
                                <div 
                                    className="p-4 md:p-6 cursor-pointer flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-zinc-950"
                                    onClick={() => toggleSeller(item.seller.id)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-lg">
                                            {item.seller.name ? item.seller.name.substring(0, 2).toUpperCase() : 'SE'}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black">{item.seller.name || "Vendedor Anónimo"}</h3>
                                            <p className="text-sm text-muted-foreground">{item.seller.email}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-wrap items-center gap-4 md:gap-8 bg-slate-50 dark:bg-zinc-900/50 p-3 md:p-4 rounded-xl border border-slate-100 dark:border-zinc-800">
                                        <div className="text-center">
                                            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Por Pagar</p>
                                            <p className="text-lg font-black text-amber-600 dark:text-amber-500">
                                                ${item.stats.pendingTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                            </p>
                                        </div>
                                        <div className="hidden md:block w-px h-8 bg-slate-200 dark:bg-zinc-800"></div>
                                        <div className="text-center">
                                            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Histórico</p>
                                            <p className="text-lg font-black text-teal-600 dark:text-teal-500">
                                                ${item.stats.paidTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                            </p>
                                        </div>
                                        <div className="hidden md:block w-px h-8 bg-slate-200 dark:bg-zinc-800"></div>
                                        <div className="text-center">
                                            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Total Generado</p>
                                            <p className="text-xl font-black text-indigo-600 dark:text-indigo-400">
                                                ${item.stats.totalEarned.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                            </p>
                                        </div>
                                        
                                        <Button variant="ghost" size="icon" className="ml-2 rounded-full h-8 w-8 bg-slate-200 dark:bg-zinc-800">
                                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </div>
                                
                                {isExpanded && (
                                    <div className="border-t border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/20 p-4 md:p-6">
                                        {!hasCommissions ? (
                                            <p className="text-center text-muted-foreground py-4 text-sm">Aún no hay comisiones generadas por este vendedor o su red.</p>
                                        ) : (
                                            <div className="space-y-6">
                                                {/* NIVEL 1 */}
                                                {item.commissions.level1.length > 0 && (
                                                    <div>
                                                        <div className="flex items-center justify-between mb-3">
                                                            <h4 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                                                <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                                                                Nivel 1 (Directos - 40%)
                                                            </h4>
                                                            <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 hover:bg-indigo-100">
                                                                ${item.stats.level1Total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                                            </Badge>
                                                        </div>
                                                        <div className="pl-4 border-l-2 border-indigo-200 dark:border-indigo-900/50">
                                                            {item.commissions.level1.map((c: any) => 
                                                                renderCommissionRow(c, "L1", "border-indigo-200 dark:border-indigo-900 text-indigo-700 dark:text-indigo-400")
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* NIVEL 2 */}
                                                {item.commissions.level2.length > 0 && (
                                                    <div>
                                                        <div className="flex items-center justify-between mb-3">
                                                            <h4 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                                                <div className="w-2 h-2 rounded-full bg-fuchsia-500"></div>
                                                                Nivel 2 (Referidos 1ra Gen - 20%)
                                                            </h4>
                                                            <Badge className="bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200 hover:bg-fuchsia-100">
                                                                ${item.stats.level2Total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                                            </Badge>
                                                        </div>
                                                        <div className="pl-4 border-l-2 border-fuchsia-200 dark:border-fuchsia-900/50">
                                                            {item.commissions.level2.map((c: any) => 
                                                                renderCommissionRow(c, "L2", "border-fuchsia-200 dark:border-fuchsia-900 text-fuchsia-700 dark:text-fuchsia-400")
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* NIVEL 3 */}
                                                {item.commissions.level3.length > 0 && (
                                                    <div>
                                                        <div className="flex items-center justify-between mb-3">
                                                            <h4 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                                                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                                                Nivel 3 (Referidos 2da Gen - 10%)
                                                            </h4>
                                                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100">
                                                                ${item.stats.level3Total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                                            </Badge>
                                                        </div>
                                                        <div className="pl-4 border-l-2 border-emerald-200 dark:border-emerald-900/50">
                                                            {item.commissions.level3.map((c: any) => 
                                                                renderCommissionRow(c, "L3", "border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400")
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
