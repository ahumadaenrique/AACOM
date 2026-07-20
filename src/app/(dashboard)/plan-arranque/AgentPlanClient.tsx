"use client";

import { useState, useEffect } from "react";
import { CheckCircle, Lock, PlayCircle, DownloadCloud, Trophy, AlertCircle, Clock, FileText, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { completeDay } from "./actions";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import confetti from "canvas-confetti";
import { cn } from "@/lib/utils";

export function AgentPlanClient({ progress, dayData, totalDaysCount, allDays, userName }: { progress: any, dayData: any, totalDaysCount: number, allDays: any[], userName: string }) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [answers, setAnswers] = useState<number[]>([]);
  const [questionnaireScore, setQuestionnaireScore] = useState<number | null>(null);

  const questions = dayData?.questionnaireJson ? (() => {
    try { return JSON.parse(dayData.questionnaireJson) } catch (e) { return [] }
  })() : [];

  // Trigger confetti if the whole plan is completed and not waiting for approval
  useEffect(() => {
    if (progress.currentDayNumber > totalDaysCount && progress.status !== "WAITING_APPROVAL" && totalDaysCount > 0) {
      fireConfetti();
    }
  }, [progress.currentDayNumber, totalDaysCount, progress.status]);

  const fireConfetti = () => {
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#0d9488", "#14b8a6", "#f59e0b"]
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#0d9488", "#14b8a6", "#f59e0b"]
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  };

  const handleCompleteDay = async () => {
    try {
      setIsLoading(true);

      if (dayData.hasQuestionnaire) {
        if (answers.length < questions.length || answers.some(a => a === undefined)) {
          toast({ title: "Examen Incompleto", description: "Por favor responde todas las preguntas.", variant: "destructive" });
          setIsLoading(false);
          return;
        }

        let correctCount = 0;
        questions.forEach((q: any, idx: number) => {
          if (answers[idx] === q.correctOptionIndex) correctCount++;
        });

        const finalScore = Math.round((correctCount / questions.length) * 100);
        setQuestionnaireScore(finalScore);

        await completeDay(JSON.stringify(answers), finalScore);

        if (finalScore >= (dayData.minPassingScore || 80)) {
          confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.6 },
            colors: ["#0d9488", "#14b8a6", "#f59e0b"]
          });
          toast({ title: "¡Examen aprobado!", description: "Tu promotor ha sido notificado para revisar tus resultados." });
        } else {
          toast({ title: "Examen no aprobado", description: `Obtuviste ${finalScore}%. Tu promotor revisará tus resultados.` });
        }
      } else {
        await completeDay();
        
        if (!dayData.requiresAdminApproval) {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ["#0d9488", "#14b8a6", "#f59e0b"]
          });
        }

        toast({ 
          title: dayData.requiresAdminApproval ? "Objetivo enviado a revisión" : "¡Felicidades! Objetivo logrado.", 
          description: dayData.requiresAdminApproval ? "Tu promotor recibirá un SMS para aprobar tu avance." : "Has avanzado al siguiente día de tu Plan de Arranque."
        });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // Si el plan no tiene días configurados
  if (totalDaysCount === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <Trophy className="h-16 w-16 text-slate-300" />
        <h2 className="text-2xl font-bold text-slate-700">Aún no hay plan configurado</h2>
        <p className="text-slate-500">Tu agencia todavía no ha configurado el Plan de Arranque.</p>
      </div>
    );
  }

  const isPlanFinished = progress.currentDayNumber > totalDaysCount && progress.status !== "WAITING_APPROVAL";
  const progressPercentage = Math.round((Math.min(progress.currentDayNumber - (progress.status === "WAITING_APPROVAL" ? 0 : 1), totalDaysCount) / totalDaysCount) * 100);

  return (
    <div className="w-full max-w-7xl mx-auto pb-12 grid grid-cols-1 lg:grid-cols-4 gap-8">
      
      {/* Sidebar: Syllabus Timeline */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-slate-100 dark:border-zinc-800 p-6 sticky top-24">
          <h3 className="font-bold text-lg mb-6 text-slate-900 dark:text-white flex items-center gap-2">
            <Trophy className="h-5 w-5 text-teal-500" />
            Tu Ruta de Éxito
          </h3>
          
          <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 dark:before:via-zinc-800 before:to-transparent">
            {allDays.map((day, index) => {
              const isPast = day.dayNumber < progress.currentDayNumber || isPlanFinished;
              const isCurrent = day.dayNumber === progress.currentDayNumber && !isPlanFinished;
              const isFuture = day.dayNumber > progress.currentDayNumber;
              const isWaitingHere = isCurrent && progress.status === "WAITING_APPROVAL";
              
              return (
                <div key={day.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-full border-4 shrink-0 z-10 font-bold text-sm shadow-sm transition-colors",
                    isPast ? "bg-teal-500 border-teal-100 text-white dark:border-teal-900/50" :
                    isCurrent ? "bg-white border-teal-500 text-teal-600 dark:bg-zinc-900" :
                    "bg-slate-100 border-slate-50 text-slate-400 dark:bg-zinc-800 dark:border-zinc-900"
                  )}>
                    {isPast ? <CheckCircle2 className="h-5 w-5" /> : day.dayNumber}
                  </div>
                  
                  <div className={cn(
                    "w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border transition-all",
                    isPast ? "bg-slate-50 border-slate-100 dark:bg-zinc-900/50 dark:border-zinc-800" :
                    isCurrent ? "bg-white border-teal-200 shadow-md shadow-teal-500/5 dark:bg-zinc-900 dark:border-teal-900/50" :
                    "bg-transparent border-transparent opacity-50"
                  )}>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className={cn(
                        "font-bold text-sm",
                        isPast ? "text-slate-700 dark:text-slate-300" :
                        isCurrent ? "text-teal-700 dark:text-teal-400" :
                        "text-slate-500"
                      )}>
                        Día {day.dayNumber}
                      </span>
                      {day.requiresAdminApproval && <Lock className="h-3 w-3 text-amber-500" />}
                    </div>
                    <p className={cn(
                      "text-xs line-clamp-2",
                      isCurrent ? "text-slate-600 dark:text-slate-400" : "text-slate-500"
                    )}>
                      {day.title}
                    </p>
                    {isWaitingHere && (
                      <span className="text-[10px] font-bold text-amber-600 uppercase mt-2 block bg-amber-100 w-fit px-2 py-0.5 rounded-full">
                        En revisión
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="lg:col-span-3 space-y-6">
        
        {/* Header Progreso */}
        <div className="space-y-3 bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-zinc-800">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-sm font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider mb-1">
                Plan de Arranque
              </p>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white">
                {isPlanFinished ? "¡Plan Completado!" : <>Día {progress.currentDayNumber} <span className="text-slate-400 font-medium">de {totalDaysCount}</span></>}
              </h1>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-slate-800 dark:text-slate-200">{progressPercentage}%</span>
              <p className="text-xs text-slate-500 font-medium">Completado global</p>
            </div>
          </div>
          <Progress value={progressPercentage} className="h-3 bg-slate-100 dark:bg-zinc-800" indicatorClassName="bg-teal-500" />
        </div>

        {isPlanFinished ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 bg-white dark:bg-zinc-900 rounded-3xl border border-slate-100 dark:border-zinc-800">
            <div className="h-32 w-32 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center border-4 border-teal-500/20 shadow-xl shadow-teal-500/10">
              <Trophy className="h-16 w-16 text-teal-600 dark:text-teal-400" />
            </div>
            <div className="space-y-2 max-w-lg">
              <h2 className="text-4xl font-black text-slate-900 dark:text-white">¡Felicidades, {userName}!</h2>
              <p className="text-lg text-slate-600 dark:text-slate-400">Has completado exitosamente los {totalDaysCount} días de tu Plan de Arranque. Estás listo para llevar tu carrera al siguiente nivel.</p>
            </div>
          </div>
        ) : progress.status === "WAITING_APPROVAL" ? (
          <Card className="w-full border-2 border-amber-200 dark:border-amber-900/50 shadow-xl shadow-amber-500/5 rounded-3xl overflow-hidden">
            <CardHeader className="text-center space-y-4 pb-8 pt-12 bg-amber-50/50 dark:bg-amber-950/20">
              <div className="mx-auto h-24 w-24 rounded-full bg-amber-100 flex items-center justify-center dark:bg-amber-900/40 shadow-inner">
                <Clock className="h-12 w-12 text-amber-600 dark:text-amber-500" />
              </div>
              <CardTitle className="text-3xl font-bold text-slate-900 dark:text-white">Día Completado</CardTitle>
              <CardDescription className="text-lg max-w-md mx-auto">
                Has logrado el objetivo del Día {progress.currentDayNumber}, pero requiere verificación para continuar.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              {dayData?.hasQuestionnaire && (progress.latestScore !== null || questionnaireScore !== null) && (() => {
                const displayScore = progress.latestScore !== null ? progress.latestScore : questionnaireScore;
                return (
                  <Alert className={cn(
                    "rounded-2xl p-6 border-2",
                    displayScore! >= (dayData.minPassingScore || 80)
                      ? "bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-900/20 dark:border-emerald-900/50 dark:text-emerald-300"
                      : "bg-red-50 border-red-200 text-red-900 dark:bg-red-900/20 dark:border-red-900/50 dark:text-red-300"
                  )}>
                    <Trophy className="h-6 w-6 mt-1" />
                    <div className="ml-3">
                      <AlertTitle className="font-bold text-lg mb-1">Resultados de la Evaluación</AlertTitle>
                      <AlertDescription className="text-base font-medium">
                        Obtuviste una calificación de {displayScore}%. 
                        {displayScore! >= (dayData.minPassingScore || 80)
                          ? " ¡Excelente trabajo! Espera la confirmación final de tu promotor."
                          : " No alcanzaste el mínimo requerido. Tu promotor revisará tus resultados para retroalimentarte."}
                      </AlertDescription>
                    </div>
                  </Alert>
                );
              })()}

              <Alert className="bg-amber-100/50 border-amber-200 text-amber-900 dark:bg-amber-900/20 dark:border-amber-900/50 dark:text-amber-300 rounded-2xl p-6">
                <Lock className="h-6 w-6 mt-1" />
                <div className="ml-3">
                  <AlertTitle className="font-bold text-lg mb-2">Esperando revisión de tu promotor</AlertTitle>
                  <AlertDescription className="text-base opacity-90 leading-relaxed">
                    Hemos enviado una notificación por SMS a tu promotor para que revise tus resultados. Una vez que apruebe tu avance en el sistema, se desbloqueará automáticamente el siguiente día.
                  </AlertDescription>
                </div>
              </Alert>
            </CardContent>
          </Card>
        ) : !dayData ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-white dark:bg-zinc-900 rounded-3xl border border-slate-100 dark:border-zinc-800">
            <AlertCircle className="h-16 w-16 text-amber-500" />
            <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-200">Día no disponible</h2>
            <p className="text-slate-500">Parece que este día no ha sido configurado por tu administrador.</p>
          </div>
        ) : (
          <Card className="border-0 shadow-xl shadow-slate-200/40 dark:shadow-none dark:bg-zinc-900/50 rounded-3xl overflow-hidden transition-all">
            <CardHeader className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-8 lg:p-10">
              <CardTitle className="text-3xl lg:text-4xl font-black leading-tight">{dayData.title}</CardTitle>
              <CardDescription className="text-slate-300 font-medium text-lg mt-3">
                Objetivos y material de estudio para hoy.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="p-8 lg:p-10 space-y-10">
              {/* Instrucciones */}
              {dayData.instructions && (
                <div className="prose prose-slate dark:prose-invert max-w-none">
                  <div className="whitespace-pre-wrap text-slate-700 dark:text-slate-300 text-lg leading-relaxed bg-slate-50 dark:bg-zinc-900/50 p-6 md:p-8 rounded-3xl border border-slate-100 dark:border-zinc-800 shadow-inner">
                    {dayData.instructions}
                  </div>
                </div>
              )}

              {/* Recursos Multimedia */}
              <div className="grid md:grid-cols-2 gap-8">
                {/* Video */}
                {dayData.videoUrl && (
                  <div className="space-y-4">
                    <h3 className="font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200 text-lg">
                      <PlayCircle className="h-6 w-6 text-red-500" />
                      Video del día
                    </h3>
                    <div className="rounded-3xl overflow-hidden aspect-video bg-black shadow-lg border border-slate-200 dark:border-zinc-800 ring-4 ring-slate-50 dark:ring-zinc-900/50 transition-all hover:scale-[1.02]">
                      {getYouTubeId(dayData.videoUrl) ? (
                        <iframe
                          width="100%"
                          height="100%"
                          src={`https://www.youtube.com/embed/${getYouTubeId(dayData.videoUrl)}`}
                          title="YouTube video player"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        ></iframe>
                      ) : (
                        <div className="flex items-center justify-center h-full text-slate-400 p-4 text-center text-sm">
                          No se pudo cargar el video. Revisa que el enlace sea válido.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Archivo Adjunto */}
                {dayData.fileUrl && (
                  <div className="space-y-4">
                    <h3 className="font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200 text-lg">
                      <DownloadCloud className="h-6 w-6 text-blue-500" />
                      Material Adjunto
                    </h3>
                    <a 
                      href={dayData.fileUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="group flex flex-col items-center justify-center h-[calc(100%-2.5rem)] min-h-[200px] rounded-3xl border-2 border-dashed border-slate-300 dark:border-zinc-700 hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-all hover:scale-[1.02] shadow-sm hover:shadow-md"
                    >
                      <div className="h-16 w-16 bg-slate-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-teal-100 dark:group-hover:bg-teal-900/50 transition-colors">
                        <FileText className="h-8 w-8 text-slate-400 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors" />
                      </div>
                      <span className="font-semibold text-slate-700 dark:text-slate-300 px-6 text-center text-lg">
                        {dayData.fileName || "Descargar material del día"}
                      </span>
                      <span className="text-sm text-slate-500 mt-3 font-medium bg-slate-100 dark:bg-zinc-800 px-3 py-1.5 rounded-lg group-hover:bg-white dark:group-hover:bg-zinc-900 transition-colors">Abrir en nueva pestaña</span>
                    </a>
                  </div>
                )}
              </div>

              {/* Cuestionario */}
              {dayData.hasQuestionnaire && questions.length > 0 && (
                <div className="space-y-6 pt-6 border-t border-slate-100 dark:border-zinc-800">
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-100 dark:bg-indigo-900/50 p-3 rounded-2xl">
                      <FileText className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xl text-slate-800 dark:text-slate-200">Evaluación del Día</h3>
                      <p className="text-sm text-slate-500">Responde correctamente para avanzar. (Mínimo {dayData.minPassingScore}%)</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {questions.map((q: any, qIndex: number) => (
                      <div key={qIndex} className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm">
                        <p className="font-semibold text-lg text-slate-800 dark:text-slate-200 mb-4">
                          {qIndex + 1}. {q.question}
                        </p>
                        <div className="space-y-3">
                          {q.options.map((opt: string, optIndex: number) => (
                            <label
                              key={optIndex}
                              onClick={() => {
                                const newAnswers = [...answers];
                                newAnswers[qIndex] = optIndex;
                                setAnswers(newAnswers);
                              }}
                              className={cn(
                                "flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all",
                                answers[qIndex] === optIndex
                                  ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 dark:border-indigo-500"
                                  : "border-slate-100 hover:border-slate-300 dark:border-zinc-800 dark:hover:border-zinc-700 bg-slate-50 dark:bg-zinc-900/50"
                              )}
                            >
                              <div className={cn(
                                "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                                answers[qIndex] === optIndex
                                  ? "border-indigo-600 dark:border-indigo-400"
                                  : "border-slate-300 dark:border-zinc-600"
                              )}>
                                {answers[qIndex] === optIndex && (
                                  <div className="w-2.5 h-2.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
                                )}
                              </div>
                              <span className={cn(
                                "font-medium",
                                answers[qIndex] === optIndex ? "text-indigo-900 dark:text-indigo-200" : "text-slate-600 dark:text-slate-400"
                              )}>
                                {opt}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {questionnaireScore !== null && (
                    <Alert className={cn(
                      "mt-6 rounded-2xl p-6 border-2",
                      questionnaireScore >= (dayData.minPassingScore || 80)
                        ? "bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-900/20 dark:border-emerald-900/50 dark:text-emerald-300"
                        : "bg-red-50 border-red-200 text-red-900 dark:bg-red-900/20 dark:border-red-900/50 dark:text-red-300"
                    )}>
                      <Trophy className="h-6 w-6 mt-1" />
                      <div className="ml-3">
                        <AlertTitle className="font-bold text-lg mb-1">Resultados de la Evaluación</AlertTitle>
                        <AlertDescription className="text-base font-medium">
                          Obtuviste una calificación de {questionnaireScore}%. 
                          {questionnaireScore >= (dayData.minPassingScore || 80)
                            ? " ¡Excelente trabajo! Espera la confirmación final de tu promotor."
                            : " No alcanzaste el mínimo requerido. Tu promotor revisará tus resultados para retroalimentarte."}
                        </AlertDescription>
                      </div>
                    </Alert>
                  )}
                </div>
              )}
            </CardContent>

            <CardFooter className="bg-slate-50 dark:bg-zinc-950/50 p-8 lg:p-10 flex flex-col lg:flex-row items-center justify-between gap-6 border-t border-slate-100 dark:border-zinc-800">
              <div className="flex-1 w-full">
                {dayData.requiresAdminApproval || dayData.hasQuestionnaire ? (
                  <div className="flex items-center gap-3 text-sm text-amber-700 dark:text-amber-500 font-semibold bg-amber-100/50 dark:bg-amber-900/20 px-4 py-3 rounded-xl w-fit border border-amber-200 dark:border-amber-900/50">
                    <Lock className="h-5 w-5" />
                    Este día requiere validación de tu promotor para avanzar
                  </div>
                ) : (
                  <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400 font-medium px-4 py-3">
                    <CheckCircle2 className="h-5 w-5 text-teal-500" />
                    Avanzarás automáticamente al terminar
                  </div>
                )}
              </div>
              
              <Button 
                size="lg" 
                className="w-full lg:w-auto h-16 px-12 text-lg rounded-2xl bg-teal-600 hover:bg-teal-500 shadow-lg shadow-teal-600/30 hover:shadow-teal-500/50 transition-all font-black uppercase tracking-wider hover:-translate-y-1"
                onClick={handleCompleteDay}
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="animate-pulse flex items-center">
                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3" />
                    Procesando...
                  </span>
                ) : (
                  <>
                    <CheckCircle className="h-6 w-6 mr-3" />
                    {dayData.hasQuestionnaire ? "Calificar Evaluación" : "Logré el objetivo"}
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
}
