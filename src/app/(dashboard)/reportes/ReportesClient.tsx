"use client";

import React, { useState, useEffect } from "react";
import { getWeeklyReportData } from "@/app/actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Loader2, CalendarRange, Users, Search } from "lucide-react";

interface AgentReport {
    id: string;
    name: string;
    totalPoints: number;
    citasAgendadas: string[]; // prospect names
    citasEfectivas: string[];
    adns: string[]; // cliente names
    llamadas: number;
    polizas: number;
    referidos: number;
}

export default function ReportesClient() {
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [loading, setLoading] = useState(true);
    const [reportData, setReportData] = useState<AgentReport[]>([]);
    const [searchTerm, setSearchTerm] = useState("");

    // Calculate default dates (Last Monday to Last Sunday)
    useEffect(() => {
        const today = new Date();
        const dayOfWeek = today.getDay() === 0 ? 7 : today.getDay();
        const daysToLastMonday = dayOfWeek + 6;
        
        const lastMonday = new Date(today);
        lastMonday.setDate(today.getDate() - daysToLastMonday);
        
        const lastSunday = new Date(lastMonday);
        lastSunday.setDate(lastMonday.getDate() + 6);

        const format = (d: Date) => {
            const tzOffset = d.getTimezoneOffset() * 60000;
            return new Date(d.getTime() - tzOffset).toISOString().split('T')[0];
        };

        setStartDate(format(lastMonday));
        setEndDate(format(lastSunday));
    }, []);

    useEffect(() => {
        if (startDate && endDate) {
            loadData();
        }
    }, [startDate, endDate]);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await getWeeklyReportData(startDate, endDate);
            if (res.success && res.agents) {
                // Initialize map
                const agentMap = new Map<string, AgentReport>();
                res.agents.forEach((a: any) => {
                    agentMap.set(a.id, {
                        id: a.id,
                        name: a.name,
                        totalPoints: 0,
                        citasAgendadas: [],
                        citasEfectivas: [],
                        adns: [],
                        llamadas: 0,
                        polizas: 0,
                        referidos: 0
                    });
                });

                // Process logs
                res.logs?.forEach((log: any) => {
                    const agent = agentMap.get(log.userId);
                    if (agent) {
                        agent.totalPoints += log.points;
                        
                        // ID 1 = Llamadas, 2 = Citas Agendadas, 3 = Citas Efectivas, 4 = Cierres, 5 = Referidos, 6 = Poliza Emitida
                        switch(log.activityId) {
                            case "1":
                                agent.llamadas += 1;
                                break;
                            case "2":
                                if (log.prospectName) agent.citasAgendadas.push(log.prospectName);
                                break;
                            case "3":
                                if (log.prospectName) agent.citasEfectivas.push(log.prospectName);
                                break;
                            case "4":
                            case "6":
                                agent.polizas += 1; // Assuming both 4 and 6 count towards Polizas/Cierres
                                break;
                            case "5":
                                agent.referidos += 1;
                                break;
                        }
                    }
                });

                // Process ADNs
                res.adns?.forEach((adn: any) => {
                    const agent = agentMap.get(adn.userId);
                    if (agent) {
                        agent.adns.push(adn.clienteNombre);
                    }
                });

                // Sort alphabetically
                const finalData = Array.from(agentMap.values()).sort((a, b) => a.name.localeCompare(b.name));
                setReportData(finalData);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleExportCSV = () => {
        const headers = [
            "Nombre del Agente",
            "Puntos Totales",
            "Numero de Citas Agendadas",
            "Prospectos (Agendadas)",
            "Numero de Citas Efectivas",
            "Prospectos (Efectivas)",
            "Adn's realizados",
            "Clientes (ADNs)",
            "Numero de Llamadas",
            "Polizas emitidas",
            "Referidos Obtenidos"
        ];

        const rows = reportData.map(a => [
            `"${a.name}"`,
            a.totalPoints,
            a.citasAgendadas.length,
            `"${a.citasAgendadas.join(', ')}"`,
            a.citasEfectivas.length,
            `"${a.citasEfectivas.join(', ')}"`,
            a.adns.length,
            `"${a.adns.join(', ')}"`,
            a.llamadas,
            a.polizas,
            a.referidos
        ]);

        const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
            + headers.join(",") + "\n" 
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Reporte_Actividad_${startDate}_${endDate}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const filteredData = reportData.filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-3xl font-black text-slate-800 dark:text-zinc-100 tracking-tight flex items-center gap-2">
                        <Users className="h-8 w-8 text-indigo-600 dark:text-indigo-500" />
                        Reporte de Actividad
                    </h2>
                    <p className="text-muted-foreground text-sm font-medium">
                        Resumen gerencial de la productividad del equipo AACOM.
                    </p>
                </div>
                
                <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 p-1.5 rounded-xl border shadow-sm">
                    <div className="flex items-center gap-2 px-2">
                        <CalendarRange className="h-4 w-4 text-slate-400" />
                        <span className="text-xs font-bold text-slate-600">Periodo:</span>
                    </div>
                    <Input 
                        type="date" 
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="h-8 w-32 text-xs border-0 bg-slate-50"
                    />
                    <span className="text-slate-300">-</span>
                    <Input 
                        type="date" 
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="h-8 w-32 text-xs border-0 bg-slate-50"
                    />
                </div>
            </div>

            <Card className="shadow-lg border-0 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm">
                <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-lg text-slate-800 flex items-center gap-2">
                            Métricas Semanales
                        </CardTitle>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Buscar agente..."
                                className="pl-9 w-[200px] h-9 text-xs rounded-xl bg-white"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button onClick={handleExportCSV} disabled={loading || reportData.length === 0} className="h-9 gap-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-md">
                            <Download className="h-4 w-4" />
                            <span className="hidden sm:inline">Exportar CSV</span>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex flex-col justify-center items-center h-64 text-slate-400 gap-3">
                            <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
                            <p className="text-sm font-semibold animate-pulse">Cruzando bases de datos...</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-slate-50 dark:bg-zinc-800/50">
                                    <TableRow className="hover:bg-transparent border-b-2">
                                        <TableHead className="font-black text-slate-700 min-w-[150px]">Nombre del Agente</TableHead>
                                        <TableHead className="font-black text-slate-700 text-center">Puntos Totales</TableHead>
                                        <TableHead className="font-black text-slate-700 min-w-[200px]">Citas Agendadas</TableHead>
                                        <TableHead className="font-black text-slate-700 min-w-[200px]">Citas Efectivas</TableHead>
                                        <TableHead className="font-black text-slate-700 min-w-[200px]">Adn's Realizados</TableHead>
                                        <TableHead className="font-black text-slate-700 text-center">Número de Llamadas</TableHead>
                                        <TableHead className="font-black text-slate-700 text-center">Pólizas Emitidas</TableHead>
                                        <TableHead className="font-black text-slate-700 text-center">Referidos Obtenidos</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredData.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="h-32 text-center text-slate-500 font-medium">
                                                No hay registros en este periodo.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredData.map((agent) => (
                                            <TableRow key={agent.id} className="group hover:bg-indigo-50/40 dark:hover:bg-indigo-900/10 transition-colors">
                                                <TableCell className="font-bold text-slate-800 dark:text-zinc-200">
                                                    {agent.name}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-black bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400">
                                                        {agent.totalPoints} pts
                                                    </span>
                                                </TableCell>
                                                
                                                <TableCell>
                                                    <div className="flex flex-col gap-1.5">
                                                        <span className="text-lg font-black text-slate-700 dark:text-slate-300">{agent.citasAgendadas.length}</span>
                                                        {agent.citasAgendadas.length > 0 && (
                                                            <div className="flex flex-col gap-0.5 mt-1 border-l-2 border-orange-300 pl-2">
                                                                {agent.citasAgendadas.map((name, i) => (
                                                                    <span key={i} className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-tight leading-tight">{name}</span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>

                                                <TableCell>
                                                    <div className="flex flex-col gap-1.5">
                                                        <span className="text-lg font-black text-slate-700 dark:text-slate-300">{agent.citasEfectivas.length}</span>
                                                        {agent.citasEfectivas.length > 0 && (
                                                            <div className="flex flex-col gap-0.5 mt-1 border-l-2 border-amber-400 pl-2">
                                                                {agent.citasEfectivas.map((name, i) => (
                                                                    <span key={i} className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-tight leading-tight">{name}</span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>

                                                <TableCell>
                                                    <div className="flex flex-col gap-1.5">
                                                        <span className="text-lg font-black text-slate-700 dark:text-slate-300">{agent.adns.length}</span>
                                                        {agent.adns.length > 0 && (
                                                            <div className="flex flex-col gap-0.5 mt-1 border-l-2 border-teal-400 pl-2">
                                                                {agent.adns.map((name, i) => (
                                                                    <span key={i} className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-tight leading-tight">{name}</span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>

                                                <TableCell className="text-center text-lg font-black text-slate-700 dark:text-slate-300">
                                                    {agent.llamadas}
                                                </TableCell>
                                                
                                                <TableCell className="text-center text-lg font-black text-slate-700 dark:text-slate-300">
                                                    {agent.polizas}
                                                </TableCell>

                                                <TableCell className="text-center text-lg font-black text-slate-700 dark:text-slate-300">
                                                    {agent.referidos}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
