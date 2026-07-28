"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getReferidorDetails } from "../actions";
import { User, Activity, Trophy, Calendar, Clock, ChevronLeft } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function ReferidorDetailClient({ referidorId }: { referidorId: string }) {
    const [loading, setLoading] = useState(true);
    const [referidor, setReferidor] = useState<any>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadData = async () => {
            const res = await getReferidorDetails(referidorId);
            if (res.success && res.data) {
                setReferidor(res.data);
            } else {
                setError(res.error || "Ocurrió un error");
            }
            setLoading(false);
        };
        loadData();
    }, [referidorId]);

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

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild className="h-8 w-8">
                    <Link href="/referidores">
                        <ChevronLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Detalle del Referidor</h1>
                    <p className="text-sm text-slate-500">Visualiza el progreso y actividad de {referidor.name}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-1 overflow-hidden border-slate-200">
                    <CardHeader className="pb-3 bg-slate-50 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                                <User className="h-5 w-5 text-teal-700" />
                            </div>
                            <div className="overflow-hidden">
                                <CardTitle className="text-base font-bold truncate text-slate-800">{referidor.name}</CardTitle>
                                <p className="text-xs text-slate-500 truncate">{referidor.email}</p>
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
                                    <span className={`text-2xl font-black ${achieved ? 'text-teal-600' : 'text-slate-800'}`}>
                                        {referidor.todayPoints}
                                    </span>
                                    <span className="text-xs text-slate-400 font-bold uppercase">/ {target}</span>
                                </div>
                            </div>
                            
                            <div className="space-y-1.5">
                                <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full transition-all duration-500 ${achieved ? 'bg-teal-500' : progressPercent > 60 ? 'bg-amber-400' : 'bg-rose-400'}`}
                                        style={{ width: `${progressPercent}%` }}
                                    />
                                </div>
                                <div className="flex justify-end">
                                    <span className="text-[10px] font-semibold text-slate-500">
                                        {progressPercent.toFixed(0)}% completado
                                    </span>
                                </div>
                            </div>

                            {achieved && (
                                <div className="bg-teal-50 border border-teal-100 rounded-md p-2 flex items-center gap-2 mt-1">
                                    <Trophy className="w-4 h-4 text-teal-600" />
                                    <span className="text-xs font-semibold text-teal-700">¡Meta diaria alcanzada!</span>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2 border-slate-200 shadow-sm">
                    <CardHeader className="border-b border-slate-100 bg-white">
                        <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <Activity className="h-5 w-5 text-teal-600" />
                            Historial de Actividades
                        </CardTitle>
                        <CardDescription>Últimos puntos registrados por el referidor</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        {referidor.logs && referidor.logs.length > 0 ? (
                            <div className="divide-y divide-slate-100">
                                {referidor.logs.map((log: any) => (
                                    <div key={log.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                        <div className="flex flex-col gap-1">
                                            <span className="font-semibold text-sm text-slate-800">{log.activityName}</span>
                                            {log.prospectName && (
                                                <span className="text-xs text-slate-500 font-medium">Prospecto: {log.prospectName}</span>
                                            )}
                                            <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {format(new Date(log.createdAt), "dd MMM yyyy", { locale: es })}
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
                                <p className="text-sm font-medium">No hay actividades registradas aún.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
