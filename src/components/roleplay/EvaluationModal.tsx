'use client';

import React from 'react';
import { Award, CheckCircle2, XCircle, Lightbulb, Zap, ArrowRight, Flame, Volume2, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface EvaluationModalProps {
  isOpen: boolean;
  evaluation: {
    score: number;
    xpEarned: number;
    appointmentClosed: boolean;
    aciertos: string[];
    errores: string[];
    coachTip: string;
    conversationId?: string | null;
  } | null;
  stats: {
    xp: number;
    level: number;
    streak: number;
    todayXp: number;
    dailyCap: number;
  } | null;
  onNextCall: () => void;
}

export function EvaluationModal({ isOpen, evaluation, stats, onNextCall }: EvaluationModalProps) {
  React.useEffect(() => {
    if (isOpen && evaluation?.appointmentClosed) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [isOpen, evaluation]);

  if (!isOpen || !evaluation) return null;

  const isSuccess = evaluation.appointmentClosed;
  const isGoodAttempt = evaluation.score >= 50;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-slate-100">
        
        {/* Header con Score */}
        <div className={`px-6 py-6 border-b ${isSuccess ? 'bg-gradient-to-r from-emerald-950/60 to-slate-900 border-emerald-500/30' : 'bg-gradient-to-r from-indigo-950/60 to-slate-900 border-slate-800'}`}>
          <div className="flex items-center justify-between">
            <div>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${isSuccess ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : isGoodAttempt ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40' : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'}`}>
                {isSuccess ? '🎯 CITA CONSEGUIDA' : isGoodAttempt ? '⚡ BUEN INTENTO' : '📵 ÁREA DE PRÁCTICA'}
              </span>
              <h2 className="text-2xl font-black text-white mt-2">
                {isSuccess ? '¡Excelente Cierre de Cita!' : 'Retroalimentación Pedagógica'}
              </h2>
            </div>

            {/* Score Circular / Badge */}
            <div className="flex flex-col items-center justify-center h-20 w-20 rounded-2xl bg-slate-800/80 border border-slate-700 shadow-inner">
              <span className="text-2xl font-black text-white">{evaluation.score}</span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Puntos</span>
            </div>
          </div>

          {/* XP & Streak Bar */}
          <div className="mt-4 flex flex-wrap items-center gap-3 pt-3 border-t border-slate-800/80 text-xs">
            {evaluation.xpEarned < 0 ? (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 font-bold animate-pulse">
                <AlertCircle className="h-4 w-4 text-rose-400" />
                <span>{evaluation.xpEarned} XP (Penalización por técnica incorrecta)</span>
              </div>
            ) : evaluation.xpEarned === 0 ? (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 font-bold">
                <Zap className="h-4 w-4" />
                <span>0 XP</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold">
                <Zap className="h-4 w-4" />
                <span>+{evaluation.xpEarned} XP Ganados</span>
              </div>
            )}

            {stats && (
              <>
                <div className="flex items-center gap-1 px-3 py-1 rounded-xl bg-slate-800/80 text-slate-300">
                  <Award className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Nivel {stats.level}</span>
                </div>

                <div className="flex items-center gap-1 px-3 py-1 rounded-xl bg-slate-800/80 text-slate-300">
                  <Flame className="h-3.5 w-3.5 text-orange-400" />
                  <span>Racha: {stats.streak} días</span>
                </div>

                <div className="ml-auto text-slate-400">
                  Tope diario: <strong className="text-slate-200">{stats.todayXp} / {stats.dailyCap} XP</strong>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-6 space-y-5 text-sm">
          
          {/* Coach Tip Táctico */}
          {evaluation.coachTip && (
            <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 flex gap-3">
              <div className="h-8 w-8 rounded-lg bg-indigo-500/20 flex-shrink-0 flex items-center justify-center text-indigo-400">
                <Lightbulb className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-bold text-indigo-300 uppercase tracking-wide">Tip del Coach para este Escenario</div>
                <div className="text-xs text-slate-300 leading-relaxed">{evaluation.coachTip}</div>
              </div>
            </div>
          )}

          {/* Audio Player if conversation ID available */}
          {evaluation.conversationId && (
            <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/60 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
                <Volume2 className="h-4 w-4 text-emerald-400" />
                <span>Grabación de la llamada</span>
              </div>
              <audio
                controls
                className="h-8 max-w-[240px]"
                src={`/api/roleplay/audio/${evaluation.conversationId}`}
              />
            </div>
          )}

          {/* Aciertos */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" /> Aciertos en la llamada
            </h3>
            {evaluation.aciertos.length > 0 ? (
              <div className="space-y-1.5">
                {evaluation.aciertos.map((a, i) => (
                  <div key={i} className="text-xs p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-emerald-300/90 flex items-start gap-2">
                    <span className="text-emerald-400 font-bold mt-0.5">•</span>
                    <span>{a}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-500 italic p-2 bg-slate-800/30 rounded-xl">Sin aciertos detectados en este intento.</div>
            )}
          </div>

          {/* Errores / Oportunidades */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
              <XCircle className="h-4 w-4" /> Oportunidades de Mejora
            </h3>
            {evaluation.errores.length > 0 ? (
              <div className="space-y-1.5">
                {evaluation.errores.map((e, i) => (
                  <div key={i} className="text-xs p-2.5 rounded-xl bg-rose-950/20 border border-rose-500/20 text-rose-300/90 flex items-start gap-2">
                    <span className="text-rose-400 font-bold mt-0.5">•</span>
                    <span>{e}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-emerald-400 italic p-2 bg-emerald-950/20 rounded-xl">¡Impecable! No se detectaron errores graves.</div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Escenario procedural evaluado con éxito
          </span>
          <button
            onClick={onNextCall}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-900/30 transition-all hover:scale-105"
          >
            <span>Siguiente Llamada</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
