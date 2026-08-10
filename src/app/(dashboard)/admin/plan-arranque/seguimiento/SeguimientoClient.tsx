"use client";

import { useState, useTransition } from "react";
import { CheckCircle, Clock, CheckCircle2, UserCircle2, Settings, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { approveAgentDay, updateAgentDay, rejectAgentProgress, assignAgentSupervisor } from "./actions";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
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

export function SeguimientoClient({ initialAgents, admins, totalDaysCount, days }: { initialAgents: any[], admins: any[], totalDaysCount: number, days: any[] }) {
  const { toast } = useToast();
  const [agents, setAgents] = useState(initialAgents);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [reviewingAgent, setReviewingAgent] = useState<any | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleApprove = (userId: string) => {
    startTransition(async () => {
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
        
        setReviewingAgent(null);
        toast({ title: "Agente aprobado", description: "Ha avanzado al siguiente día exitosamente." });
      } catch (error: any) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } finally {
        setLoadingId(null);
      }
    });
  };

  const handleReject = (agentId: string) => {
    startTransition(async () => {
      try {
        setLoadingId(agentId);
        await rejectAgentProgress(agentId);
        setAgents(agents.map(a => a.id === agentId ? { ...a, developmentProgress: { ...a.developmentProgress, status: "IN_PROGRESS" } } : a));
        toast({ title: "Agente rechazado", description: "Se le ha pedido al agente que repita el módulo." });
        setReviewingAgent(null);
      } catch (error: any) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } finally {
        setLoadingId(null);
      }
    });
  };

  const handleDayChange = (userId: string, dayNumber: number) => {
    startTransition(async () => {
      try {
        setLoadingId(userId);
        const result = await updateAgentDay(userId, dayNumber);
        
        if (result.success) {
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
            title: "Módulo actualizado", 
            description: `El agente ha sido movido al ${dayNumber > totalDaysCount ? 'Plan Completado' : `Módulo ${dayNumber}`} exitosamente.` 
          });
        }
      } catch (error: any) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } finally {
        setLoadingId(null);
      }
    });
  };

  const handleAssignAdmin = (userId: string, adminId: string) => {
    startTransition(async () => {
      try {
        setLoadingId(userId);
        const dbAdminId = adminId === "none" ? null : adminId;
        await assignAgentSupervisor(userId, dbAdminId);
        
        setAgents(agents.map(a => {
          if (a.id === userId) {
            return { ...a, reportsToId: dbAdminId };
          }
          return a;
        }));
        
        toast({ title: "Responsable asignado", description: "Se ha actualizado el responsable de este agente." });
      } catch (error: any) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } finally {
        setLoadingId(null);
      }
    });
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
          <CardDescription>Lista de agentes y su módulo de entrenamiento actual.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agente</TableHead>
                <TableHead>Responsable</TableHead>
                <TableHead className="w-[30%]">Progreso del Plan</TableHead>
                <TableHead>Estado Actual</TableHead>
                <TableHead className="text-right">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-slate-500">
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
                        <Select 
                          value={agent.reportsToId || "none"} 
                          onValueChange={(val) => handleAssignAdmin(agent.id, val)}
                        >
                          <SelectTrigger className="w-[180px] h-8 text-xs">
                            <SelectValue placeholder="Todos los Admins" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Todos los Admins</SelectItem>
                            {admins.map(admin => (
                              <SelectItem key={admin.id} value={admin.id}>
                                {admin.name || admin.email}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-1.5 w-full pr-4">
                          <div className="flex justify-between text-xs font-medium">
                            <span className={cn(isFinished ? "text-teal-600 dark:text-teal-400 font-bold" : "text-slate-600 dark:text-slate-400")}>
                              {isFinished ? "¡Completado!" : `Módulo ${dayNum}`}
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
                          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-500 dark:border-blue-500/50 gap-1.5 py-1">
                            <CheckCircle className="h-3.5 w-3.5" />
                            En Curso
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {status === "WAITING_APPROVAL" && (
                            <Button 
                              type="button"
                              onClick={() => {
                                const currentDayData = days.find(d => d.dayNumber === dayNum);
                                if (currentDayData?.hasQuestionnaire) {
                                  setReviewingAgent(agent);
                                } else {
                                  handleApprove(agent.id);
                                }
                              }} 
                              disabled={loadingId === agent.id}
                              size="sm"
                              className={cn(
                                "text-white shadow-md h-9",
                                days.find(d => d.dayNumber === dayNum)?.hasQuestionnaire
                                  ? "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20"
                                  : "bg-amber-500 hover:bg-amber-600 shadow-amber-500/20"
                              )}
                            >
                              {loadingId === agent.id ? "Cargando..." : (days.find(d => d.dayNumber === dayNum)?.hasQuestionnaire ? "Revisar Evaluación" : "Aprobar")}
                            </Button>
                          )}
                          <div className="w-[130px] text-left">
                            <Select
                              value={String(dayNum)}
                              onValueChange={(val) => handleDayChange(agent.id, Number(val))}
                              disabled={loadingId === agent.id}
                            >
                              <SelectTrigger className="h-9">
                                <SelectValue placeholder="Módulo" />
                              </SelectTrigger>
                              <SelectContent>
                                {Array.from({ length: totalDaysCount }).map((_, i) => (
                                  <SelectItem key={i + 1} value={(i + 1).toString()}>
                                    Módulo {i + 1}
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

      {reviewingAgent && (() => {
        const progress = reviewingAgent.developmentProgress;
        const dayNum = progress.currentDayNumber;
        const dayData = days.find(d => d.dayNumber === dayNum);
        const questions = dayData?.questionnaireJson ? JSON.parse(dayData.questionnaireJson) : [];
        const answers = progress.latestAnswersJson ? JSON.parse(progress.latestAnswersJson) : [];
        const isPassed = (progress.latestScore || 0) >= (dayData?.minPassingScore || 80);

        return (
          <Dialog open={!!reviewingAgent} onOpenChange={(o) => !o && setReviewingAgent(null)}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
              <DialogHeader className="pb-4 border-b">
                <DialogTitle>Resultados de Evaluación - Módulo {dayNum}</DialogTitle>
                <DialogDescription>
                  Revisión del agente <span className="font-bold text-slate-800 dark:text-slate-200">{reviewingAgent.name}</span>. 
                  Intentos realizados: {progress.questionnaireAttempts}
                </DialogDescription>
              </DialogHeader>

              <div className="py-4 space-y-6">
                <div className="flex items-center justify-between bg-slate-50 dark:bg-zinc-900 p-4 rounded-xl border">
                  <div>
                    <p className="text-sm text-slate-500">Calificación obtenida</p>
                    <p className={cn(
                      "text-3xl font-black",
                      progress.latestScore === null ? "text-indigo-600 dark:text-indigo-400" : 
                      isPassed ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                    )}>
                      {progress.latestScore !== null ? `${progress.latestScore}%` : 'Pendiente'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-500">Mínimo requerido</p>
                    <p className="text-xl font-bold text-slate-700 dark:text-slate-300">{dayData?.minPassingScore}%</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold text-lg border-b pb-2">Desglose de Respuestas</h3>
                  {questions.map((q: any, qIndex: number) => {
                    const agentAnswer = answers[qIndex];
                    
                    if (q.isOpenEnded) {
                       return (
                         <div key={qIndex} className="p-4 rounded-xl border bg-slate-50 dark:bg-zinc-950/50">
                           <p className="font-semibold text-slate-800 dark:text-slate-200 mb-2">
                             {qIndex + 1}. {q.question}
                           </p>
                           <div className="mt-3 p-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                             {agentAnswer || <span className="text-slate-400 italic">No respondió</span>}
                           </div>
                         </div>
                       );
                    }

                    const agentAnswerIdx = typeof agentAnswer === 'number' ? agentAnswer : -1;
                    const isCorrect = agentAnswerIdx === q.correctOptionIndex;

                    return (
                      <div key={qIndex} className="p-4 rounded-xl border bg-slate-50 dark:bg-zinc-950/50">
                        <p className="font-semibold text-slate-800 dark:text-slate-200 mb-2">
                          {qIndex + 1}. {q.question}
                        </p>
                        <div className="grid gap-2">
                          {q.options.map((opt: string, optIndex: number) => {
                            const isAgentChoice = agentAnswerIdx === optIndex;
                            const isActualCorrect = q.correctOptionIndex === optIndex;
                            let style = "border-slate-200 bg-white text-slate-600 dark:border-zinc-800 dark:bg-zinc-900";
                            
                            if (isActualCorrect) {
                              style = "border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-300 font-medium";
                            } else if (isAgentChoice && !isActualCorrect) {
                              style = "border-red-500 bg-red-50 text-red-900 dark:bg-red-900/30 dark:border-red-800 dark:text-red-300 font-medium line-through opacity-80";
                            }

                            return (
                              <div key={optIndex} className={cn("p-2 rounded-lg border text-sm flex items-center justify-between", style)}>
                                <span>{opt}</span>
                                {isActualCorrect && <CheckCircle2 className="h-4 w-4" />}
                                {isAgentChoice && !isActualCorrect && <AlertCircle className="h-4 w-4" />}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <DialogFooter className="gap-2 sm:justify-between">
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => handleReject(reviewingAgent.id)}
                  disabled={loadingId === reviewingAgent.id}
                  className="border-red-200 text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  {loadingId === reviewingAgent.id ? "Procesando..." : "Rechazar y Forzar Repetición"}
                </Button>
                <Button 
                  type="button"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => handleApprove(reviewingAgent.id)}
                  disabled={loadingId === reviewingAgent.id}
                >
                  {loadingId === reviewingAgent.id ? "Aprobando..." : "Aprobar Avance al Siguiente Módulo"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        );
      })()}
    </div>
  );
}
