'use client';

import React from 'react';
import { BookOpen, X, CheckCircle2, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';

interface MasterTacticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MasterTacticsModal({ isOpen, onClose }: MasterTacticsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[85vh] bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Manual Táctico de Prospección AACOM</h2>
              <p className="text-xs text-slate-400">Guía metodológica para agendar citas de 30-40 minutos sin vender por teléfono</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 space-y-6 text-sm text-slate-300">
          
          {/* Regla de Oro */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <AlertTriangle className="h-4 w-4" /> REGLA DE ORO DE LA LLAMADA TELEFÓNICA
            </div>
            <p className="text-xs text-amber-200/90 leading-relaxed">
              <strong>El teléfono es exclusivamente para "vender la cita", JAMÁS para vender la póliza ni cotizar.</strong> En cuanto mencionas primas, sumas aseguradas o coberturas técnicas, el prospecto se desconecta y te pide que se lo mandes por correo.
            </p>
          </div>

          {/* Los 4 Pilares */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
                <CheckCircle2 className="h-4 w-4" /> 1. Posicionamiento Consultivo
              </div>
              <p className="text-xs text-slate-300">
                Preséntate como asesor de <strong>AACOM Seguros</strong> brindando una <em>asesoría financiera personalizada</em>. No eres un vendedor de seguros, eres un estratega patrimonial.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50 space-y-2">
              <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs">
                <ShieldCheck className="h-4 w-4" /> 2. Diagnóstico Antes de Recetar
              </div>
              <p className="text-xs text-slate-300">
                Tu escudo contra la objeción <em>"¿De qué números estamos hablando?"</em>: <strong>"Manejamos tantas soluciones y opciones que sería irresponsable recomendarle una sin antes platicar y conocer su situación."</strong>
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50 space-y-2">
              <div className="flex items-center gap-2 text-purple-400 font-semibold text-xs">
                <Zap className="h-4 w-4" /> 3. Doble Alternativa de Cierre
              </div>
              <p className="text-xs text-slate-300">
                Nunca preguntes <em>"¿Cuándo podría?"</em>. Da dos opciones cerradas: <strong>"¿Le queda mejor el martes a las 11:00 am o el jueves a las 4:00 pm en su oficina?"</strong>
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs">
                <CheckCircle2 className="h-4 w-4" /> 4. Tiempo Estipulado (30-40 min)
              </div>
              <p className="text-xs text-slate-300">
                Garantiza que la reunión no le quitará toda la tarde. Pide <strong>30 a 40 minutos</strong>. Esto genera confianza y elimina el miedo a una reunión interminable.
              </p>
            </div>

          </div>

          {/* Manejo de Objeciones Frecuentes */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Respuestas Maestras a Objeciones</h3>
            
            <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800 space-y-1">
              <div className="text-xs font-bold text-red-400">Objeción: "Mándamelo por WhatsApp / Correo y yo lo checo"</div>
              <div className="text-xs text-slate-300 italic">
                "Con gusto se lo comparto, pero justamente como manejamos un abanico tan amplio de opciones, no sabría exactamente qué enviarle sin conocer sus metas primero. Tomará solo 30 minutos platicarlo. ¿Prefiere que nos veamos el martes o el jueves?"
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800 space-y-1">
              <div className="text-xs font-bold text-red-400">Objeción: "Ya tengo seguros con otra compañía / con mi banco"</div>
              <div className="text-xs text-slate-300 italic">
                "Excelente, me da mucho gusto que tenga esa previsión. Justamente lo que hacemos no es competir ni venderle otro seguro, sino una auditoría para verificar que sus coberturas actuales no tengan duplicidades y optimizar deducibles. ¿Le queda mejor el miércoles o el viernes?"
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800 space-y-1">
              <div className="text-xs font-bold text-red-400">Objeción: "Dígame rápido de cuánto dinero estamos hablando al mes"</div>
              <div className="text-xs text-slate-300 italic">
                "Sería irresponsable de mi parte darle una cifra al aire como si fuera un catálogo general. Primero diagnosticamos sus prioridades y se ajusta a su presupuesto exacto. Platiquémoslo 30 minutos; ¿le queda mejor martes en la mañana o jueves por la tarde?"
              </div>
            </div>

          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors"
          >
            Entendido, volver a la llamada
          </button>
        </div>

      </div>
    </div>
  );
}
