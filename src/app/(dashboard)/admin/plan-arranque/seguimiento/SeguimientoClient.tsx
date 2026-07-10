"use client";

import { useState } from "react";
import { CheckCircle, Clock, CheckCircle2, UserCircle2, Settings } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { approveAgentDay, updateAgentDay } from "./actions";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function SeguimientoClient({ initialAgents, totalDaysCount }: { initialAgents: any[], totalDaysCount: number }) {
  const { toast } = useToast();
  const [agents, setAgents] = useState(initialAgents);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleApprove = async (userId: string) => {
    try {
      setLoadingId(userId);
      await approveAgentDay(userId);
      
      setAgents(agents.map(a => {
        if (a.id === userId && a.developmentProgress) {
          return {
            ...a,
            developmentProgress: {
              ...a.developmentProgress,
              currentDayNumber: a.developmentProgress.currentDayNumber + 1,
              status: "IN_PROGRESS"
            }
          };
        }
        return a;
      }));
      
      toast({ title: "Agente aprobado", description: "Ha avanzado al siguiente día exitosamente." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoadingId(null);
    }
  };

  const handleDayChange = async (userId: string, dayNumber: number) => {
    try {
      setLoadingId(userId);
      await updateAgentDay(userId, dayNumber);
      
      setAgents(agents.map(a => {
        if (a.id === userId) {
          const prevProgress = a.developmentProgress || { currentDayNumber: 1, status: "IN_PROGRESS" };
          return {
            ...a,
            developmentProgress: {
              ...prevProgress,
              currentDayNumber: dayNumber,
              status: "IN_PROGRESS"
            }
          };
        }
        return a;
      }));
      
      toast({ 
        title: "Día actualizado", 
        description: `El agente ha sido movido al ${dayNumber > totalDaysCount ? 'Plan Completado' : `Día ${dayNumber}`} exitosamente.` 
      });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Seguimiento de Agentes</h1>
          <p className="text-slate-500 dark:text-slate-400">Revisa el progreso de los aspirantes y aprueba sus metas diarias.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" className="border-teal-200 text-teal-700 hover:bg-teal-50 dark:border-teal-900 dark:text-teal-400">
            <Link href="/admin/plan-arranque">
              <Settings className="h-4 w-4 mr-2" />
              Configurar Temario
            </Link>
          </Button>
        </div>
      </div>

      <Card className="border-0 shadow-lg shadow-slate-200/50 dark:shadow-none dark:border dark:border-zinc-800">
        <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/50 border-b border-slate-100 dark:border-zinc-800">
          <CardTitle>Estado Actual</CardTitle>
          <CardDescription>Lista de agentes y su día de entrenamiento actual.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agente</TableHead>
                <TableHead className="w-[30%]">Progreso del Plan</TableHead>
                <TableHead>Estado Actual</TableHead>
                <TableHead className="text-right">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                    No hay agentes en la agencia.
                  </TableCell>
                </TableRow>
              ) : (
                agents.map((agent) => {
                  const progress = agent.developmentProgress;
                  const dayNum = progress?.currentDayNumber || 1;
                  const status = progress?.status || "IN_PROGRESS";
                  
                  // Calcular porcentaje visual basado en si ya terminó o si está esperando aprobación
                  const isFinished = dayNum > totalDaysCount && status !== "WAITING_APPROVAL";
                  const effectiveDayNum = Math.min(dayNum - (status === "WAITING_APPROVAL" ? 0 : 1), totalDaysCount);
                  const progressPercentage = totalDaysCount > 0 ? Math.round((effectiveDayNum / totalDaysCount) * 100) : 0;

                  return (
                    <TableRow key={agent.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={agent.image || ""} alt={agent.name} />
                            <AvatarFallback><UserCircle2 className="h-5 w-5 text-slate-400" /></AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-semibold text-sm">{agent.name || "Sin nombre"}</span>
                            <span className="text-xs text-slate-500">{agent.email}</span>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-1.5 w-full pr-4">
                          <div className="flex justify-between text-xs font-medium">
                            <span className={cn(isFinished ? "text-teal-600 dark:text-teal-400 font-bold" : "text-slate-600 dark:text-slate-400")}>
                              {isFinished ? "¡Completado!" : `Día ${dayNum}`}
                            </span>
                            <span className="text-slate-500">{progressPercentage}%</span>
                          </div>
                          <Progress 
                            value={progressPercentage} 
                            className="h-2 bg-slate-100 dark:bg-zinc-800" 
                            indicatorClassName={isFinished ? "bg-teal-500" : "bg-blue-500"} 
                          />
                        </div>
                      </TableCell>

                      <TableCell>
                        {status === "WAITING_APPROVAL" ? (
                          <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-500 dark:border-amber-800/50 gap-1.5 py-1">
                            <Clock className="h-3.5 w-3.5" />
                            Esperando Aprobación
                          </Badge>
                        ) : isFinished ? (
                          <Badge variant="outline" className="bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/30 dark:text-teal-500 dark:border-teal-800/50 gap-1.5 py-1">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Plan Terminado
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-500 dark:border-blue-800/50 gap-1.5 py-1">
                            <CheckCircle className="h-3.5 w-3.5" />
                            En Curso
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {status === "WAITING_APPROVAL" && (
                            <Button 
                              onClick={() => handleApprove(agent.id)} 
                              disabled={loadingId === agent.id}
                              size="sm"
                              className="bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20 h-9"
                            >
                              {loadingId === agent.id ? "Aprobando..." : "Aprobar"}
                            </Button>
                          )}
                          <div className="w-[130px] text-left">
                            <Select
                              value={String(dayNum)}
                              onValueChange={(val) => handleDayChange(agent.id, Number(val))}
                              disabled={loadingId === agent.id}
                            >
                              <SelectTrigger className="h-9">
                                <SelectValue placeholder="Día" />
                              </SelectTrigger>
                              <SelectContent>
                                {Array.from({ length: totalDaysCount }).map((_, i) => (
                                  <SelectItem key={i + 1} value={String(i + 1)}>
                                    Día {i + 1}
                                  </SelectItem>
                                ))}
                                <SelectItem value={String(totalDaysCount + 1)}>
                                  Completado
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
