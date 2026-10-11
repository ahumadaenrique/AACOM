'use client';

import React, { useEffect, useState } from 'react';
import { Sparkles, Brain, CheckCircle2, Loader2, ShieldCheck, Award } from 'lucide-react';

interface EvaluatingModalProps {
  isOpen: boolean;
  moduleId?: 'prospeccion' | 'adn' | 'objeciones';
  prospectName?: string;
}

const COACH_TIPS = [
  'En una llamada de prospección, el objetivo nunca es vender la póliza, sino vender el valor de la cita.',
  'La Regla 50-30-20 de Elizabeth Warren te posiciona como un asesor patrimonial de élite, no como un vendedor tradicional.',
  'Cierre con Doble Alternativa: Siempre ofrece dos opciones claras (ej. "¿jueves a las 4 o viernes a las 10?") para facilitar la decisión.',
  'Cuando el cliente diga "déjame pensarlo", valida con empatía y aísla si existe alguna duda de fondo sobre coberturas o presupuesto.',
  'La técnica del Boomerang convierte la misma objeción del prospecto en la razón principal para protegerse hoy.',
  'Un buen diagnóstico financiero siempre pide permiso antes de preguntar gastos e ingresos detallados.'
];

export function EvaluatingModal({
  isOpen,
  moduleId = 'prospeccion',
  prospectName = 'el prospecto'
}: EvaluatingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [progressPercent, setProgressPercent] = useState(15);

  const steps = [
    'Guardando grabación de audio y sincronizando diálogo...',
    'Analizando transcripción con rúbrica pedagógica...',
    'Evaluando técnica de apertura, empatía y objeciones...',
    'Calculando puntaje, puntos de experiencia (XP) e insignias...'
  ];

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0);
      setCurrentTipIndex(0);
      setProgressPercent(15);
      return;
    }

    // Advance steps every 4.5 seconds
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 4500);

    // Rotate tips every 5.5 seconds
    const tipInterval = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % COACH_TIPS.length);
    }, 5500);

    // Smoothly increment progress bar up to 92%
    const progressInterval = setInterval(() => {
      setProgressPercent((prev) => {
        if (prev >= 92) return 92;
        return prev + 2;
      });
    }, 500);

    return () => {
      clearInterval(stepInterval);
      clearInterval(tipInterval);
      clearInterval(progressInterval);
    };
  }, [isOpen, steps.length]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-lg bg-slate-900 border border-indigo-500/40 rounded-3xl shadow-2xl p-6 sm:p-8 flex flex-col items-center text-center text-slate-100 overflow-hidden">
        
        {/* Glow ambient lights */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Central Animated Badge */}
        <div className="relative mb-5 flex items-center justify-center">
          <div className="absolute inset-0 rounded-3xl bg-indigo-500/20 blur-xl animate-pulse" />
          <div className="relative h-20 w-20 rounded-3xl bg-gradient-to-br from-indigo-500/30 to-purple-600/30 border border-indigo-400/50 flex items-center justify-center shadow-inner">
            <Brain className="h-10 w-10 text-indigo-300 animate-pulse" />
          </div>
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
          </span>
        </div>

        {/* Status Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 mb-3 uppercase tracking-wider">
          <Sparkles className="h-3.5 w-3.5 text-indigo-400 animate-spin" />
          Evaluación Pedagógica en Proceso
        </div>

        {/* User-Requested Headline */}
        <h2 className="text-xl sm:text-2xl font-black text-white leading-tight mb-2">
          Ten paciencia, tu coach está revisando tu desempeño
        </h2>
        
        <p className="text-xs text-slate-400 max-w-sm mb-6">
          Analizando cada turno y técnica de la llamada con{' '}
          <span className="text-indigo-300 font-semibold">{prospectName}</span>.
        </p>

        {/* Animated Progress Bar */}
        <div className="w-full bg-slate-800/80 rounded-full h-2.5 mb-6 overflow-hidden border border-slate-700/60 p-0.5">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 rounded-full transition-all duration-500 ease-out shadow-sm"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Dynamic Checklist Steps */}
        <div className="w-full space-y-2.5 mb-6 text-left bg-slate-950/50 border border-slate-800 rounded-2xl p-4">
          {steps.map((step, idx) => {
            const isFinished = idx < currentStep;
            const isCurrent = idx === currentStep;

            return (
              <div
                key={idx}
                className={`flex items-center gap-3 text-xs transition-all duration-300 ${
                  isFinished
                    ? 'text-emerald-400 font-medium'
                    : isCurrent
                    ? 'text-indigo-200 font-bold'
                    : 'text-slate-600'
                }`}
              >
                {isFinished ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                ) : isCurrent ? (
                  <Loader2 className="h-4 w-4 text-indigo-400 animate-spin shrink-0" />
                ) : (
                  <div className="h-4 w-4 rounded-full border border-slate-700 shrink-0" />
                )}
                <span className="truncate">{step}</span>
              </div>
            );
          })}
        </div>

        {/* Master Coach Wisdom Card */}
        <div className="w-full rounded-2xl bg-indigo-950/30 border border-indigo-500/20 p-3.5 text-left text-xs space-y-1">
          <div className="flex items-center gap-1.5 text-indigo-400 font-bold text-[11px] uppercase tracking-wider">
            <ShieldCheck className="h-3.5 w-3.5" /> Consejo del Master Coach:
          </div>
          <p className="text-slate-300 text-[11px] leading-relaxed italic animate-in fade-in duration-300">
            "{COACH_TIPS[currentTipIndex]}"
          </p>
        </div>

      </div>
    </div>
  );
}
