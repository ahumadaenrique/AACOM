'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Conversation } from '@elevenlabs/react';
import {
  Phone,
  PhoneOff,
  Flame,
  Zap,
  BookOpen,
  Award,
  ShieldCheck,
  Volume2,
  VolumeX,
  History,
  RotateCcw,
  Sparkles,
  Info,
  CheckCircle2,
  Clock,
  Mic,
  Headphones,
  Settings
} from 'lucide-react';
import { MasterTacticsModal } from './MasterTacticsModal';
import { EvaluationModal } from './EvaluationModal';
import { SupervisionPanel } from './SupervisionPanel';
import { AudioSettingsModal } from './AudioSettingsModal';

interface RoleplayClientProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    role?: string;
  };
  isAdmin: boolean;
}

export function RoleplayClient({ user, isAdmin }: RoleplayClientProps) {
  // Tabs: 'simulador' | 'historial' | 'admin'
  const [activeTab, setActiveTab] = useState<'simulador' | 'historial' | 'admin'>('simulador');
  const [isTacticsOpen, setIsTacticsOpen] = useState(false);
  const [isEvalOpen, setIsEvalOpen] = useState(false);

  // Sound Mute
  const [isMuted, setIsMuted] = useState(false);

  // Audio Devices (Zoom / Teams / Meet style)
  const [isAudioSettingsOpen, setIsAudioSettingsOpen] = useState(false);
  const [selectedInputId, setSelectedInputId] = useState<string>('');
  const [selectedOutputId, setSelectedOutputId] = useState<string>('');
  const [inputDeviceLabel, setInputDeviceLabel] = useState<string>('Micrófono');
  const [outputDeviceLabel, setOutputDeviceLabel] = useState<string>('Altavoz');
  const [userMicVolume, setUserMicVolume] = useState<number>(0);
  const [userSpeaking, setUserSpeaking] = useState<boolean>(false);
  const micIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Scenario & Session
  const [scenario, setScenario] = useState<any>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [loadingScenario, setLoadingScenario] = useState(true);

  // Call State
  const [isCalling, setIsCalling] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [prospectSpeaking, setProspectSpeaking] = useState(false);
  const [callStatusText, setCallStatusText] = useState('Listo para iniciar llamada');
  const [transcript, setTranscript] = useState<{ source: 'ai' | 'user'; message: string }[]>([]);
  const [currentEval, setCurrentEval] = useState<any>(null);

  // History
  const [historyCalls, setHistoryCalls] = useState<any[]>([]);

  // References
  const conversationRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const ringRef = useRef<NodeJS.Timeout | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const conversationIdRef = useRef<string | null>(null);
  const startTimeRef = useRef<number>(0);

  // 1. Audio FX Generator
  const initAudioCtx = () => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) audioCtxRef.current = new AudioCtx();
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  const playRing = () => {
    if (isMuted) return;
    initAudioCtx();
    if (!audioCtxRef.current) return;
    stopRing();

    const ring = () => {
      if (isMuted || !audioCtxRef.current) return;
      const now = audioCtxRef.current.currentTime;
      const osc1 = audioCtxRef.current.createOscillator();
      const osc2 = audioCtxRef.current.createOscillator();
      const gain = audioCtxRef.current.createGain();

      osc1.frequency.setValueAtTime(440, now);
      osc2.frequency.setValueAtTime(480, now);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.setValueAtTime(0.06, now + 1.2);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.3);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(audioCtxRef.current.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 1.3);
      osc2.stop(now + 1.3);
    };

    ring();
    ringRef.current = setInterval(ring, 2800);
  };

  const stopRing = () => {
    if (ringRef.current) {
      clearInterval(ringRef.current);
      ringRef.current = null;
    }
  };

  const playChime = (type: 'pickup' | 'hangup') => {
    if (isMuted) return;
    initAudioCtx();
    if (!audioCtxRef.current) return;
    const now = audioCtxRef.current.currentTime;
    const osc = audioCtxRef.current.createOscillator();
    const gain = audioCtxRef.current.createGain();

    if (type === 'pickup') {
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(380, now + 0.12);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    } else {
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.12);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    }
    osc.connect(gain);
    gain.connect(audioCtxRef.current.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  };

  // 2. Fetch or load session
  const initSession = async () => {
    try {
      setLoadingScenario(true);
      const res = await fetch('/api/roleplay/session', { method: 'POST' });
      if (!res.ok) throw new Error('Error al cargar sesión');
      const data = await res.json();
      setScenario(data.scenario);
      setSignedUrl(data.signedUrl);
      setStats(data.stats);
      setCallStatusText(`Expediente asignado. Listo para marcar a ${data.scenario.prospecto.nombre}.`);
    } catch (err: any) {
      console.error(err);
      setCallStatusText('⚠️ Error conectando con el servicio de prospección.');
    } finally {
      setLoadingScenario(false);
    }
  };

  useEffect(() => {
    initSession();

    // Load saved devices from localStorage
    if (typeof window !== 'undefined') {
      const savedInput = localStorage.getItem('roleplay_input_device_id') || '';
      const savedOutput = localStorage.getItem('roleplay_output_device_id') || '';
      if (savedInput) setSelectedInputId(savedInput);
      if (savedOutput) setSelectedOutputId(savedOutput);

      if (navigator.mediaDevices?.enumerateDevices) {
        navigator.mediaDevices.enumerateDevices().then(devices => {
          if (savedInput) {
            const matchIn = devices.find(d => d.deviceId === savedInput);
            if (matchIn && matchIn.label) setInputDeviceLabel(matchIn.label);
          } else {
            const defIn = devices.find(d => d.kind === 'audioinput' && d.label);
            if (defIn) setInputDeviceLabel(defIn.label);
          }

          if (savedOutput) {
            const matchOut = devices.find(d => d.deviceId === savedOutput);
            if (matchOut && matchOut.label) setOutputDeviceLabel(matchOut.label);
          } else {
            const defOut = devices.find(d => d.kind === 'audiooutput' && d.label);
            if (defOut) setOutputDeviceLabel(defOut.label);
          }
        }).catch(() => {});
      }
    }

    return () => {
      stopRing();
      if (timerRef.current) clearInterval(timerRef.current);
      if (micIntervalRef.current) clearInterval(micIntervalRef.current);
      if (conversationRef.current) {
        try { conversationRef.current.endSession(); } catch (_) {}
      }
    };
  }, []);

  // Save selected audio devices
  const handleSaveAudioDevices = async (inputId: string, outputId: string) => {
    setSelectedInputId(inputId);
    setSelectedOutputId(outputId);
    if (typeof window !== 'undefined') {
      if (inputId) localStorage.setItem('roleplay_input_device_id', inputId);
      if (outputId) localStorage.setItem('roleplay_output_device_id', outputId);

      if (navigator.mediaDevices?.enumerateDevices) {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const matchIn = devices.find(d => d.deviceId === inputId);
          if (matchIn && matchIn.label) setInputDeviceLabel(matchIn.label);
          const matchOut = devices.find(d => d.deviceId === outputId);
          if (matchOut && matchOut.label) setOutputDeviceLabel(matchOut.label);
        } catch (_) {}
      }
    }

    // If call is actively running, change devices live!
    if (conversationRef.current) {
      try {
        if (inputId && typeof conversationRef.current.changeInputDevice === 'function') {
          await conversationRef.current.changeInputDevice({ inputDeviceId: inputId });
        }
        if (outputId && typeof conversationRef.current.changeOutputDevice === 'function') {
          await conversationRef.current.changeOutputDevice({ outputDeviceId: outputId });
        }
      } catch (err) {
        console.error('Error switching devices live:', err);
      }
    }
  };

  // 3. Start call
  const startCall = async () => {
    if (isCalling || isConnecting || !signedUrl) return;

    try {
      setIsConnecting(true);
      setTranscript([]);
      setCallDuration(0);
      setCallStatusText(`Marcando a ${scenario.prospecto.nombre}...`);
      playRing();

      const conv = await Conversation.startSession({
        signedUrl,
        inputDeviceId: selectedInputId || undefined,
        outputDeviceId: selectedOutputId || undefined,
        workletPaths: {
          rawAudioProcessor: '/worklets/rawAudioProcessor.js',
          audioConcatProcessor: '/worklets/audioConcatProcessor.js'
        },
        onConnect: ({ conversationId }) => {
          stopRing();
          playChime('pickup');
          setIsConnecting(false);
          setIsCalling(true);
          conversationIdRef.current = conversationId || null;
          startTimeRef.current = Date.now();
          setCallStatusText(`🟢 En llamada con ${scenario.prospecto.nombre}`);

          // Timer
          timerRef.current = setInterval(() => {
            const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
            setCallDuration(elapsed);
            // Hard limit de 3 minutos para prospección
            if (elapsed >= 180) {
              hangupCall();
            }
          }, 1000);

          // Monitor User Mic in real-time
          if (micIntervalRef.current) clearInterval(micIntervalRef.current);
          micIntervalRef.current = setInterval(() => {
            if (conversationRef.current && typeof conversationRef.current.getInputVolume === 'function') {
              const vol = conversationRef.current.getInputVolume();
              setUserMicVolume(vol);
              setUserSpeaking(vol > 0.04);
            }
          }, 120);
        },
        onDisconnect: () => {
          stopRing();
          playChime('hangup');
          if (micIntervalRef.current) {
            clearInterval(micIntervalRef.current);
            micIntervalRef.current = null;
          }
          setUserSpeaking(false);
          setUserMicVolume(0);
          handleCallEnded();
        },
        onError: (err) => {
          stopRing();
          console.error("Conversation error:", err);
          setCallStatusText('⚠️ Detalle en conexión de audio.');
        },
        onModeChange: ({ mode }) => {
          setProspectSpeaking(mode === 'speaking');
          if (mode === 'speaking') {
            setCallStatusText(`🗣️ ${scenario.prospecto.nombre.split(' ')[0]} está hablando...`);
          } else {
            setCallStatusText(`👂 ${scenario.prospecto.nombre.split(' ')[0]} te está escuchando...`);
          }
        },
        onMessage: ({ message, source }) => {
          if (message) {
            setTranscript(prev => [...prev, { source: source === 'ai' ? 'ai' : 'user', message }]);
          }
        }
      });

      conversationRef.current = conv;
    } catch (err: any) {
      stopRing();
      setIsConnecting(false);
      setIsCalling(false);
      if (micIntervalRef.current) {
        clearInterval(micIntervalRef.current);
        micIntervalRef.current = null;
      }
      setUserSpeaking(false);
      alert('No se pudo conectar la llamada: ' + (err.message || 'Verifica permisos de micrófono'));
      setCallStatusText('Error al conectar. Revisa tu micrófono.');
    }
  };

  // 4. Hang up
  const hangupCall = async () => {
    stopRing();
    playChime('hangup');
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (micIntervalRef.current) {
      clearInterval(micIntervalRef.current);
      micIntervalRef.current = null;
    }
    setUserSpeaking(false);
    setUserMicVolume(0);

    if (conversationRef.current) {
      try {
        await conversationRef.current.endSession();
      } catch (e) {
        console.warn('Error ending session:', e);
      }
      conversationRef.current = null;
    }

    handleCallEnded();
  };

  // 5. Evaluate Call
  const handleCallEnded = async () => {
    if (!isCalling && !isConnecting) return;
    setIsCalling(false);
    setIsConnecting(false);
    setProspectSpeaking(false);
    if (timerRef.current) clearInterval(timerRef.current);

    const elapsed = Math.max(callDuration, Math.floor((Date.now() - (startTimeRef.current || Date.now())) / 1000));
    setCallStatusText('Evaluando desempeño y técnica de prospección...');

    try {
      const res = await fetch('/api/roleplay/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript,
          durationSeconds: elapsed,
          scenario,
          conversationId: conversationIdRef.current
        })
      });

      if (!res.ok) throw new Error('Error al evaluar');
      const evalData = await res.json();
      setCurrentEval({ ...evalData, conversationId: conversationIdRef.current });
      if (evalData.stats) {
        setStats(evalData.stats);
      }

      // Add to local history
      setHistoryCalls(prev => [
        {
          id: evalData.callId || Date.now().toString(),
          prospectName: scenario.prospecto.nombre,
          score: evalData.score,
          xpEarned: evalData.xpEarned,
          appointmentClosed: evalData.appointmentClosed,
          durationSeconds: elapsed,
          conversationId: conversationIdRef.current,
          createdAt: new Date().toISOString()
        },
        ...prev
      ]);

      setIsEvalOpen(true);
    } catch (e) {
      console.error("Error evaluating call:", e);
      setCallStatusText('La llamada terminó.');
    }
  };

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      
      {/* Top Gamification Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800 text-slate-100 shadow-md">
        
        {/* Level and XP */}
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center text-2xl shadow-inner">
            {stats?.levelInfo?.icon || '⭐'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white">{stats?.levelInfo?.title || `Nivel ${stats?.level || 1}`}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                Nivel {stats?.level || 1}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-36 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-500"
                  style={{
                    width: `${Math.min(100, ((stats?.xp || 0) / (stats?.levelInfo?.maxXp || 500)) * 100)}%`
                  }}
                />
              </div>
              <span className="text-[11px] font-bold text-amber-400">{stats?.xp || 0} XP</span>
            </div>
          </div>
        </div>

        {/* Hot Streak & Daily Cap */}
        <div className="flex items-center gap-3 text-xs">
          
          {/* Racha */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400 font-bold" title="Días consecutivos cumpliendo meta de 3 llamadas">
            <Flame className="h-4 w-4 text-orange-400" />
            <span>Racha: {stats?.streak || 0} días</span>
          </div>

          {/* Tope Diario */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300">
            <Zap className="h-4 w-4 text-amber-400" />
            <span>Tope Hoy: <strong>{stats?.todayXp || 0} / 500 XP</strong></span>
          </div>

          {/* Audio toggle */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title={isMuted ? 'Activar sonido' : 'Silenciar sonido'}
          >
            {isMuted ? <VolumeX className="h-4 w-4 text-rose-400" /> : <Volume2 className="h-4 w-4 text-emerald-400" />}
          </button>

          {/* Configuración de Audio (Zoom / Teams / Meet style) */}
          <button
            onClick={() => setIsAudioSettingsOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-bold transition-colors"
            title="Seleccionar micrófono y altavoces (Zoom / Teams / Meet)"
          >
            <Headphones className="h-4 w-4 text-indigo-400" />
            <span className="hidden sm:inline">Vía de Audio</span>
            <span className="sm:hidden">Audio</span>
          </button>

          {/* Manual Táctico */}
          <button
            onClick={() => setIsTacticsOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold transition-colors"
          >
            <BookOpen className="h-4 w-4" />
            <span>Manual Táctico</span>
          </button>

        </div>

      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab('simulador')}
          className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-t-xl transition-colors border-t border-x ${activeTab === 'simulador' ? 'bg-slate-900 border-slate-800 text-indigo-400' : 'text-slate-400 hover:text-slate-200 border-transparent'}`}
        >
          <Phone className="h-4 w-4" />
          <span>Simulador Telefónico</span>
        </button>

        <button
          onClick={() => setActiveTab('historial')}
          className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-t-xl transition-colors border-t border-x ${activeTab === 'historial' ? 'bg-slate-900 border-slate-800 text-indigo-400' : 'text-slate-400 hover:text-slate-200 border-transparent'}`}
        >
          <History className="h-4 w-4" />
          <span>Mi Historial de Llamadas</span>
        </button>

        {isAdmin && (
          <button
            onClick={() => setActiveTab('admin')}
            className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-t-xl transition-colors border-t border-x ${activeTab === 'admin' ? 'bg-slate-900 border-slate-800 text-indigo-400' : 'text-slate-400 hover:text-slate-200 border-transparent'}`}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Supervisión & Grabaciones (Admin)</span>
          </button>
        )}
      </div>

      {/* TAB 1: SIMULADOR */}
      {activeTab === 'simulador' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Softphone Card */}
          <div className="lg:col-span-8 space-y-6">
            
            <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
              
              {/* Prospect Profile Header */}
              {loadingScenario || !scenario ? (
                <div className="p-12 text-center text-slate-500 text-sm">
                  Cargando expediente del prospecto asignado...
                </div>
              ) : (
                <div className="p-6 md:p-8 border-b border-slate-800/80 bg-gradient-to-br from-slate-950/60 to-slate-900">
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
                    
                    {/* Avatar con Ondas de Voz */}
                    <div className="relative">
                      <div className={`h-28 w-28 rounded-full overflow-hidden border-2 transition-all duration-300 relative ${prospectSpeaking ? 'border-emerald-400 scale-105 shadow-xl shadow-emerald-500/20' : 'border-slate-700'}`}>
                        <img
                          src={scenario.prospecto.avatar}
                          alt={scenario.prospecto.nombre}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      {prospectSpeaking && (
                        <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-slate-950 uppercase tracking-wider animate-bounce">
                          Hablando
                        </span>
                      )}
                    </div>

                    {/* Prospect Info */}
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${scenario.origen.tipo === 'referido_avisado' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' : scenario.origen.tipo === 'inbound_solicitado' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'}`}>
                          <span>{scenario.origen.icono}</span>
                          <span>{scenario.origen.titulo}</span>
                        </span>

                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                          Dificultad Nivel {scenario.difficultyLevel}
                        </span>
                      </div>

                      <h2 className="text-2xl font-black text-white">{scenario.prospecto.nombre}</h2>
                      <p className="text-xs text-slate-400">
                        {scenario.prospecto.puesto} • {scenario.prospecto.edad} años
                      </p>
                      <p className="text-xs text-slate-500 italic">
                        "{scenario.prospecto.contexto}"
                      </p>
                    </div>

                  </div>

                  {/* Pre-Call Mini Briefing Card */}
                  <div className="mt-6 p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 text-xs space-y-1">
                    <div className="font-bold text-indigo-400 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                      <Info className="h-4 w-4" /> Contexto Previo de la Llamada:
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                      {scenario.origen.brief}
                    </p>
                  </div>

                </div>
              )}

              {/* Call Controls & Live Status */}
              <div className="p-6 md:p-8 space-y-6">

                {/* Audio Route Quick Selector Strip (Zoom / Meet / Teams style) */}
                <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs">
                  <div className="flex items-center gap-3 overflow-hidden text-slate-300">
                    <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5 flex-shrink-0">
                      <Mic className="h-3.5 w-3.5 text-emerald-400" /> Mic:
                    </span>
                    <span className="font-medium text-white truncate max-w-[140px] sm:max-w-[220px]" title={inputDeviceLabel}>
                      {inputDeviceLabel || 'Predeterminado'}
                    </span>

                    <span className="text-slate-600 hidden sm:inline">•</span>

                    <span className="text-[11px] font-semibold text-slate-400 hidden sm:flex items-center gap-1.5 flex-shrink-0">
                      <Volume2 className="h-3.5 w-3.5 text-cyan-400" /> Salida:
                    </span>
                    <span className="font-medium text-white truncate max-w-[140px] hidden sm:inline" title={outputDeviceLabel}>
                      {outputDeviceLabel || 'Predeterminado'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsAudioSettingsOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold transition-colors flex-shrink-0 border border-slate-700/60"
                  >
                    <Settings className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Configurar Vía de Audio</span>
                  </button>
                </div>
                
                {/* Timer & Status text */}
                <div className="flex flex-col items-center justify-center text-center space-y-2">
                  <div className="text-4xl font-mono font-black text-slate-100 tracking-wider">
                    {formatTime(callDuration)}
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${isCalling ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`} />
                    <span>{callStatusText}</span>
                  </div>

                  {/* Real-time Voice Activity Indicator (Confirming mic is picking up user voice) */}
                  {isCalling && (
                    <div className="flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-950/90 border border-slate-800 text-[11px] mt-1 shadow-inner animate-in fade-in">
                      <span className={`w-2 h-2 rounded-full ${userSpeaking ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'}`} />
                      <Mic className={`h-3 w-3 ${userSpeaking ? 'text-emerald-400' : 'text-slate-400'}`} />
                      <span className={userSpeaking ? 'text-emerald-300 font-bold' : 'text-slate-400'}>
                        {userSpeaking ? 'Tu voz: Transmitiendo en vivo' : 'Micrófono activo (listo)'}
                      </span>
                      {userSpeaking && (
                        <div className="flex items-center gap-0.5 ml-1">
                          <span className="w-1 h-2.5 bg-emerald-400 rounded-full animate-bounce" />
                          <span className="w-1 h-3.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.15s]" />
                          <span className="w-1 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.3s]" />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Big Action Buttons */}
                <div className="flex items-center justify-center gap-6">
                  {!isCalling ? (
                    <button
                      onClick={startCall}
                      disabled={isConnecting || loadingScenario}
                      className="flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base shadow-xl shadow-emerald-950/50 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Phone className="h-5 w-5" />
                      <span>{isConnecting ? 'Conectando...' : 'Iniciar Llamada'}</span>
                    </button>
                  ) : (
                    <button
                      onClick={hangupCall}
                      className="flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-base shadow-xl shadow-rose-950/50 transition-all hover:scale-105 animate-pulse"
                    >
                      <PhoneOff className="h-5 w-5" />
                      <span>Colgar y Evaluar</span>
                    </button>
                  )}
                </div>

                {/* Live Transcript Box */}
                <div className="space-y-2 pt-4 border-t border-slate-800">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-semibold uppercase tracking-wider text-[10px]">Transcripción en Vivo</span>
                    <span>{transcript.length} intervenciones</span>
                  </div>

                  <div className="h-44 overflow-y-auto p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs">
                    {transcript.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-slate-600 italic">
                        Presiona "Iniciar Llamada" para hablar con el prospecto por tu micrófono...
                      </div>
                    ) : (
                      transcript.map((t, idx) => (
                        <div
                          key={idx}
                          className={`p-2.5 rounded-xl ${t.source === 'ai' ? 'bg-slate-900 border border-slate-800 text-indigo-300' : 'bg-indigo-950/30 border border-indigo-500/20 text-slate-100 ml-6'}`}
                        >
                          <strong className="block text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">
                            {t.source === 'ai' ? scenario?.prospecto?.nombre?.split(' ')[0] : 'Tú'}:
                          </strong>
                          <span>{t.message}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

            </div>

          </div>

          {/* Right Column: Mission and Badges */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Daily Mission Card */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-lg">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Clock className="h-4 w-4 text-cyan-400" /> Misión Diaria de Citas
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  Días Hábiles
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Llamadas hoy:</span>
                  <strong className="text-white">{stats?.todayCallsCount || 0} / 3 requeridas</strong>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-500 transition-all duration-300"
                    style={{ width: `${Math.min(100, ((stats?.todayCallsCount || 0) / 3) * 100)}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
                  💡 Mantén tu racha diaria activa para evitar la penalización de <strong className="text-rose-400">-700 XP</strong> por día hábil omitido.
                </p>
              </div>

              {/* Reglas de XP */}
              <div className="space-y-1.5 text-xs text-slate-400 pt-1">
                <div className="flex items-center justify-between">
                  <span>Tope diario de XP:</span>
                  <span className="font-bold text-slate-200">500 XP max</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Cita agendada:</span>
                  <span className="font-bold text-emerald-400">~95 XP</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Meta a Nivel 6:</span>
                  <span className="font-bold text-amber-400">6,500 XP (min 15 días)</span>
                </div>
              </div>
            </div>

            {/* Vitrina de Insignias */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-lg">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Award className="h-4 w-4 text-amber-400" /> Insignias Desbloqueadas
              </h3>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'primera_cita', name: 'Primer Cierre', icon: '🎯' },
                  { id: 'racha_3_dias', name: 'Constancia', icon: '🔥' },
                  { id: 'maestro_objecion', name: 'Escudo', icon: '🛡️' },
                  { id: 'experto_frio', name: 'Frío Total', icon: '❄️' },
                  { id: 'dia_perfecto', name: '500 XP', icon: '⚡' },
                  { id: 'lobo_aacom', name: 'Nivel 6', icon: '👑' }
                ].map(badge => {
                  const unlocked = stats?.badges?.includes(badge.id);
                  return (
                    <div
                      key={badge.id}
                      className={`p-3 rounded-2xl border text-center transition-all ${unlocked ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' : 'bg-slate-950/40 border-slate-800/80 text-slate-600 opacity-60'}`}
                      title={badge.name}
                    >
                      <div className="text-2xl">{badge.icon}</div>
                      <div className="text-[10px] font-bold mt-1 truncate">{badge.name}</div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* TAB 2: MI HISTORIAL */}
      {activeTab === 'historial' && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <History className="h-5 w-5 text-indigo-400" /> Historial Reciente de Llamadas
          </h3>

          {historyCalls.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 italic">
              Aún no has realizado llamadas en esta sesión. Realiza tu primera llamada para ver aquí tu historial y audios.
            </div>
          ) : (
            <div className="space-y-3">
              {historyCalls.map((h, i) => (
                <div key={i} className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold text-xs ${h.appointmentClosed ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-700 text-slate-300'}`}>
                      {h.score} pts
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <span>Llamada con {h.prospectName}</span>
                        {h.appointmentClosed && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                            ✓ Cita Agendada
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Duración: {h.durationSeconds}s • +{h.xpEarned} XP
                      </div>
                    </div>
                  </div>

                  {h.conversationId && (
                    <audio
                      controls
                      className="h-8 max-w-[220px]"
                      src={`/api/roleplay/audio/${h.conversationId}`}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ADMIN / SUPERVISION */}
      {activeTab === 'admin' && isAdmin && (
        <SupervisionPanel />
      )}

      {/* Modals */}
      <AudioSettingsModal
        isOpen={isAudioSettingsOpen}
        onClose={() => setIsAudioSettingsOpen(false)}
        selectedInputId={selectedInputId}
        selectedOutputId={selectedOutputId}
        onSaveDevices={handleSaveAudioDevices}
        isInCall={isCalling}
      />

      <MasterTacticsModal
        isOpen={isTacticsOpen}
        onClose={() => setIsTacticsOpen(false)}
      />

      <EvaluationModal
        isOpen={isEvalOpen}
        evaluation={currentEval}
        stats={stats}
        onNextCall={() => {
          setIsEvalOpen(false);
          initSession();
        }}
      />

    </div>
  );
}
