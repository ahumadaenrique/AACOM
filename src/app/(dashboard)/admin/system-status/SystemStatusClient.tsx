"use client";

import React, { useState, useEffect } from "react";
import { Activity, Server, Database, Globe, Mail, MessageSquare, CreditCard, RefreshCw, ExternalLink, CheckCircle2, XCircle, Newspaper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { checkAllSystemsStatus, triggerDailyPlanReport } from "./actions";

export default function SystemStatusClient() {
    const { toast } = useToast();
    const [systems, setSystems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [triggeringCron, setTriggeringCron] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    useEffect(() => {
        loadStatus();
    }, []);

    const loadStatus = async () => {
        setLoading(true);
        const res = await checkAllSystemsStatus();
        if (res.success && res.results) {
            setSystems(res.results);
            setLastUpdated(new Date());
        } else {
            toast({ title: "Error al cargar sistemas", description: res.message, variant: "destructive" });
        }
        setLoading(false);
    };

    const runWACron = async () => {
        if (!confirm("¿Estás seguro de enviar los reportes diarios de WhatsApp ahora?")) return;
        setTriggeringCron(true);
        const res = await triggerDailyPlanReport();
        if (res.success) {
            toast({ title: "WhatsApp Enviados", description: `Se procesaron y enviaron ${res.sentCount} mensajes a agentes.` });
        } else {
            toast({ title: "Error", description: res.message, variant: "destructive" });
        }
        setTriggeringCron(false);
    };

    const getIcon = (id: string) => {
        switch (id) {
            case 'stripe': return <CreditCard className="h-6 w-6" />;
            case 'twilio': return <MessageSquare className="h-6 w-6" />;
            case 'neon': return <Database className="h-6 w-6" />;
            case 'banxico': return <Globe className="h-6 w-6" />;
            case 'vercel_blob': return <Server className="h-6 w-6" />;
            case 'resend': return <Mail className="h-6 w-6" />;
            case 'gemini': return <Activity className="h-6 w-6" />;
            case 'tavily': return <Globe className="h-6 w-6" />;
            case 'newsdata': return <Newspaper className="h-6 w-6" />;
            default: return <Server className="h-6 w-6" />;
        }
    };

    return (
        <div className="flex flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight flex items-center gap-2">
                        <Activity className="h-8 w-8 text-blue-600" />
                        Centro de Comando (APIs)
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Monitoreo en tiempo real de saldos y disponibilidad de las APIs de terceros.
                    </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                        <Button onClick={runWACron} disabled={triggeringCron} variant="secondary" className="flex items-center gap-2 bg-green-100 text-green-700 hover:bg-green-200 border border-green-300">
                            <MessageSquare className={`h-4 w-4 ${triggeringCron ? 'animate-pulse' : ''}`} />
                            Probar Reporte WA
                        </Button>
                        <Button onClick={loadStatus} disabled={loading} className="flex items-center gap-2">
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            Forzar Revisión Ahora
                        </Button>
                    </div>
                    {lastUpdated && (
                        <p className="text-xs text-muted-foreground">
                            Última revisión: {lastUpdated.toLocaleTimeString()}
                        </p>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {loading && systems.length === 0 ? (
                    Array(8).fill(0).map((_, i) => (
                        <Card key={i} className="animate-pulse h-40 border-slate-200 dark:border-zinc-800" />
                    ))
                ) : (
                    systems.map((sys) => {
                        const isOk = sys.status === 'ok';
                        return (
                            <Card key={sys.id} className={`overflow-hidden border-t-4 shadow-sm transition-all hover:shadow-md ${isOk ? 'border-t-teal-500' : 'border-t-rose-500'}`}>
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <div className={`p-2 rounded-lg ${isOk ? 'bg-teal-50 text-teal-600 dark:bg-teal-950 dark:text-teal-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400'}`}>
                                            {getIcon(sys.id)}
                                        </div>
                                        {isOk ? (
                                            <Badge status="ok" />
                                        ) : (
                                            <Badge status="error" />
                                        )}
                                    </div>
                                    <CardTitle className="text-lg mt-2 font-bold">{sys.name}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className={`text-sm font-medium ${isOk ? 'text-slate-600 dark:text-slate-300' : 'text-rose-600 dark:text-rose-400'}`}>
                                        {sys.message}
                                    </p>
                                    
                                    <a 
                                        href={sys.link} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="mt-4 flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                                    >
                                        Ir al Panel de Facturación
                                        <ExternalLink className="h-3 w-3" />
                                    </a>
                                </CardContent>
                            </Card>
                        );
                    })
                )}
            </div>
        </div>
    );
}

function Badge({ status }: { status: 'ok' | 'error' }) {
    if (status === 'ok') {
        return (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-400 text-xs font-bold uppercase tracking-wider">
                <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></div>
                Operativo
            </div>
        );
    }
    return (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-400 text-xs font-bold uppercase tracking-wider">
            <XCircle className="w-3 h-3 text-rose-500" />
            Caído
        </div>
    );
}
