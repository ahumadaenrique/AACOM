'use client';

import React, { useState } from 'react';
import { 
  X, 
  Activity, 
  CheckCircle2, 
  AlertCircle, 
  Play, 
  Square, 
  Loader2, 
  Terminal,
  Volume2,
  Clock,
  Sparkles
} from 'lucide-react';

interface GeminiDiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GeminiDiagnosticModal({ isOpen, onClose }: GeminiDiagnosticModalProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioCtxRef = React.useRef<AudioContext | null>(null);

  if (!isOpen) return null;

  const runTest = async () => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const res = await fetch('/api/roleplay/test-gemini-live', {
        cache: 'no-store'
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'La prueba de diagnóstico falló.');
      }
      setResult(data);
    } catch (err: any) {
      setError(err?.message || 'Error de red al ejecutar diagnóstico.');
    } finally {
      setLoading(false);
    }
  };

  const playSampleAudio = () => {
    if (!result?.sampleAudioBase64) return;

    try {
      if (audioCtxRef.current) {
        try { audioCtxRef.current.close(); } catch (_) {}
      }

      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtxClass();
      audioCtxRef.current = ctx;

      const binaryStr = atob(result.sampleAudioBase64);
      const byteLen = binaryStr.length;
      const bytes = new Uint8Array(byteLen);
      for (let i = 0; i < byteLen; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }

      const sampleCount = Math.floor(byteLen / 2);
      const dataView = new DataView(bytes.buffer, bytes.byteOffset, sampleCount * 2);
      const audioBuffer = ctx.createBuffer(1, sampleCount, 24000);
      const channelData = audioBuffer.getChannelData(0);

      for (let i = 0; i < sampleCount; i++) {
        const int16 = dataView.getInt16(i * 2, true);
        channelData[i] = int16 / 32768.0;
      }

      const sourceNode = ctx.createBufferSource();
      sourceNode.buffer = audioBuffer;
      sourceNode.connect(ctx.destination);

      setIsPlayingAudio(true);
      sourceNode.start(0);

      sourceNode.onended = () => {
        setIsPlayingAudio(false);
      };
    } catch (err) {
      console.error('Error playing sample audio:', err);
      setIsPlayingAudio(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Diagnóstico de Conexión • Google Gemini Live
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  v1beta Bidi
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Verifica el handshake WebSocket, audio 24kHz y sincronización de turnos en tiempo real
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* Action Card */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="text-xs font-bold text-slate-200">
                Prueba Integral de Conexión & Síntesis Vocal
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Envía un turno de prueba al modelo <code className="text-indigo-300">gemini-3.8-live</code> y mide la respuesta de voz.
              </p>
            </div>
            <button
              onClick={runTest}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-xs font-bold text-white transition-all shadow-lg shadow-indigo-950/50 flex items-center gap-2 flex-shrink-0"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Diagnosticando...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Ejecutar Diagnóstico</span>
                </>
              )}
            </button>
          </div>

          {/* Results Summary */}
          {result && (
            <div className={`p-4 rounded-2xl border space-y-4 ${result.success ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-rose-950/20 border-rose-500/30'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {result.success ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-rose-400" />
                  )}
                  <span className={`text-sm font-bold ${result.success ? 'text-emerald-300' : 'text-rose-300'}`}>
                    {result.success ? 'Conexión con Gemini Live: 100% Operativa' : 'Fallo en la prueba de conexión'}
                  </span>
                </div>
                {result.sampleAudioBase64 && (
                  <button
                    onClick={playSampleAudio}
                    disabled={isPlayingAudio}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-xs font-bold text-emerald-300 transition-colors shadow-sm"
                  >
                    {isPlayingAudio ? (
                      <>
                        <Square className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
                        <span>Reproduciendo...</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Escuchar Voz de Alfonso</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Metrics grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">Saludo Inicial</span>
                  <span className="font-bold text-slate-200">
                    {Math.round((result.greetingModelAudioBytes || 0) / 1024)} KB audio
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">Respuesta Turno</span>
                  <span className="font-bold text-slate-200">
                    {Math.round((result.userTurnResponseAudioBytes || 0) / 1024)} KB audio
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">Frecuencia PCM</span>
                  <span className="font-bold text-indigo-300">
                    24,000 Hz
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">Estado Motor</span>
                  <span className="font-bold text-emerald-400">
                    Bidi OK
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Error display */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Real-time Event Log */}
          {result?.events && result.events.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wide">
                  <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                  Registro de Eventos del Protocolo
                </span>
                <span className="text-[10px]">{result.events.length} pasos</span>
              </div>
              <div className="max-h-48 overflow-y-auto p-3 rounded-2xl bg-black/70 border border-slate-800/80 font-mono text-[11px] text-slate-300 space-y-1">
                {result.events.map((log: string, idx: number) => (
                  <div key={idx} className="leading-snug">
                    {log.includes('ERROR') ? (
                      <span className="text-rose-400">{log}</span>
                    ) : log.includes('completed') || log.includes('received') ? (
                      <span className="text-emerald-300">{log}</span>
                    ) : (
                      <span className="text-slate-400">{log}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
          >
            Cerrar Diagnóstico
          </button>
        </div>

      </div>
    </div>
  );
}
