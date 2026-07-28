"use client";

import React, { useState, useEffect } from "react";
import { getMisReferidores } from "./actions";
import { Loader2, User, Trophy, CalendarDays, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ReferidoresClient() {
    const [referidores, setReferidores] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            const res = await getMisReferidores();
            if (res.success && res.data) {
                setReferidores(res.data);
            }
            setLoading(false);
        };
        loadData();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
                <p className="text-muted-foreground">Cargando tus referidores...</p>
            </div>
        );
    }

    if (referidores.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800">No tienes referidores asignados</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                    Actualmente no tienes referidores ligados a tu cuenta. Contacta a tu administrador para dar de alta a tus referidores.
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {referidores.map((ref) => {
                const target = 15;
                const points = ref.todayPoints || 0;
                const progressPercent = Math.min(100, (points / target) * 100);
                const achieved = points >= target;

                return (
                    <Link href={`/referidores/${ref.id}`} key={ref.id} className="block">
                        <Card className="overflow-hidden hover:shadow-md transition-all duration-200 border-slate-200 cursor-pointer h-full">
                            <CardHeader className="pb-3 bg-slate-50 border-b border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                                        <User className="h-5 w-5 text-teal-700" />
                                    </div>
                                    <div className="overflow-hidden">
                                        <CardTitle className="text-base font-bold truncate text-slate-800">{ref.name}</CardTitle>
                                        <p className="text-xs text-slate-500 truncate">{ref.email}</p>
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
                                                {points}
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
                    </Link>
                );
            })}
        </div>
    );
}
