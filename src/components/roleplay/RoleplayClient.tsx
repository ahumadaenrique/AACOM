'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BADGES } from '@/lib/roleplay/badges';
import { BADGES_CATALOG } from '@/lib/roleplay/gamification';
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
  Settings,
  Video,
  VideoOff,
  LogOut,
  FastForward,
  MicOff,
  Users,
  PieChart
} from 'lucide-react';
import { MasterTacticsModal } from './MasterTacticsModal';
import { EvaluationModal } from './EvaluationModal';
import { EvaluatingModal } from './EvaluatingModal';
import { SupervisionPanel } from './SupervisionPanel';
import { AudioSettingsModal } from './AudioSettingsModal';
import { GeminiLiveSession } from '@/lib/roleplay/geminiLiveClient';

interface RoleplayClientProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    role?: string;
  };
  isAdmin: boolean;
  moduleId?: 'prospeccion' | 'adn' | 'objeciones';
}

function getBadgeDetails(badgeId: string) {
  const found = BADGES.find(b => b.id === badgeId);
  if (found) {
    return {
      id: found.id,
      name: found.name,
      description: found.description,
      icon: found.icon,
      moduleId: found.moduleId
    };
  }
  const legacy = BADGES_CATALOG.find(b => b.id === badgeId);
  if (legacy) {
    return {
      id: legacy.id,
      name: legacy.name,
      description: legacy.desc,
      icon: legacy.icon,
      moduleId: 'general'
    };
  }
  return {
    id: badgeId,
    name: badgeId,
    description: 'Insignia por desempeño y técnica en el simulador.',
    icon: '🏅',
    moduleId: 'general'
  };
}

// Safari / iOS WebKit AudioWorklet Patch & Resilience
if (typeof window !== 'undefined' && typeof (window as any).AudioWorklet !== 'undefined') {
  const origAddModule = (window as any).AudioWorklet.prototype.addModule;
  if (!origAddModule.__patched) {
    const patchedAddModule = async function (this: any, moduleUrl: string | URL, options?: any) {
      let urlStr = typeof moduleUrl === 'string' ? moduleUrl : moduleUrl?.toString?.() || '';

      // 1. Interceptar libsamplerate (prevenir fallos por CDN cross-origin en Safari / iOS)
      if (urlStr.includes('libsamplerate')) {
        const localLibUrl = `${window.location.origin}/worklets/libsamplerate.worklet.js?v=2`;
        try {
          return await origAddModule.call(this, localLibUrl, options);
        } catch (libErr) {
          console.warn('[AudioWorklet] Advertencia: libsamplerate no pudo cargarse en Safari, continuando llamada sin remuestreador:', libErr);
          return;
        }
      }

      // 2. Resolver rutas relativas a absolutas y cache-busting v=2 para Safari
      if (urlStr.startsWith('/')) {
        const sep = urlStr.includes('?') ? '&' : '?';
        urlStr = `${window.location.origin}${urlStr}${urlStr.includes('v=') ? '' : sep + 'v=2'}`;
      }

      try {
        return await origAddModule.call(this, urlStr, options);
      } catch (err: any) {
        console.error(`[AudioWorklet.addModule] Error cargando ${urlStr}:`, err);
        throw new Error(`[Worklet: ${urlStr.split('/').pop()?.split('?')[0]}] ${err?.message || err}`);
      }
    };
    patchedAddModule.__patched = true;
    (window as any).AudioWorklet.prototype.addModule = patchedAddModule;
  }
}

export function RoleplayClient({ user, isAdmin, moduleId = 'prospeccion' }: RoleplayClientProps) {
  const isADN = moduleId === 'adn';
  const isObjeciones = moduleId === 'objeciones';

  // Tabs: 'simulador' | 'historial' | 'admin'
  const [activeTab, setActiveTab] = useState<'simulador' | 'historial' | 'admin'>('simulador');
  const [isTacticsOpen, setIsTacticsOpen] = useState(false);
  const [isEvalOpen, setIsEvalOpen] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);

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
  const [wsUrl, setWsUrl] = useState<string | null>(null);
  const [voiceName, setVoiceName] = useState<string | null>(null);
  const [engine, setEngine] = useState<'GEMINI_LIVE' | 'ELEVENLABS'>('GEMINI_LIVE');
  const [stats, setStats] = useState<any>(null);
  const [loadingScenario, setLoadingScenario] = useState(true);

  // References
  const geminiSessionRef = useRef<GeminiLiveSession | null>(null);

  // Call State
  const [isCalling, setIsCalling] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [prospectSpeaking, setProspectSpeaking] = useState(false);
  const [callStatusText, setCallStatusText] = useState(
    isADN 
      ? 'Listo para iniciar reunión ADN' 
      : isObjeciones 
        ? 'Listo para iniciar sesión de cierre' 
        : 'Listo para iniciar llamada'
  );
  const [transcript, setTranscript] = useState<{ source: 'ai' | 'user'; message: string }[]>([]);
  const transcriptRef = useRef<{ source: 'ai' | 'user'; message: string }[]>([]);
  const [currentEval, setCurrentEval] = useState<any>(null);

  // ADN Fast-Forward State (2 Fases: Apertura F.O.R.D. y Cierre de Cita)
  const [adnPhase, setAdnPhase] = useState<1 | 2>(1);
  const [adnTransitioning, setAdnTransitioning] = useState<boolean>(false);
  const [adnTransitionProgress, setAdnTransitionProgress] = useState<number>(0);
  const adnTransitionTriggeredRef = useRef<boolean>(false);
  const phase2StartTimeRef = useRef<number>(0);

  // Live Speech State
  const [interimSpeech, setInterimSpeech] = useState<string>('');
  const [micStatus, setMicStatus] = useState<{ status: string; details?: string }>({ status: 'idle' });
  const [hoveredBadge, setHoveredBadge] = useState<{ id: string; name: string; description: string; icon: string; moduleId?: string } | null>(null);

  // History
  const [historyCalls, setHistoryCalls] = useState<any[]>([]);

  // References
  const conversationRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const ringRef = useRef<NodeJS.Timeout | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const conversationIdRef = useRef<string | null>(null);
  const startTimeRef = useRef<number>(0);
  const connectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentOscillatorsRef = useRef<{ osc1: OscillatorNode; osc2: OscillatorNode } | null>(null);
  const isEvaluatingRef = useRef<boolean>(false);
  const userHungUpRef = useRef<boolean>(false);
  const sessionUrlConsumedRef = useRef<boolean>(false);
  const sessionUrlCreatedAtRef = useRef<number>(0);
  const autoRetriedSafeVoiceRef = useRef<boolean>(false);

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
      currentOscillatorsRef.current = { osc1, osc2 };
    };

    ring();
    ringRef.current = setInterval(ring, 2800);
  };

  const stopRing = () => {
    if (ringRef.current) {
      clearInterval(ringRef.current);
      ringRef.current = null;
    }
    if (currentOscillatorsRef.current) {
      try { currentOscillatorsRef.current.osc1.stop(); } catch (_) {}
      try { currentOscillatorsRef.current.osc2.stop(); } catch (_) {}
      currentOscillatorsRef.current = null;
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

  const playTransitionChime = () => {
    if (isMuted) return;
    initAudioCtx();
    if (!audioCtxRef.current) return;
    const now = audioCtxRef.current.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, idx) => {
      const osc = audioCtxRef.current!.createOscillator();
      const gain = audioCtxRef.current!.createGain();
      const startTime = now + (idx * 0.1);
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.08, startTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.35);
      osc.connect(gain);
      gain.connect(audioCtxRef.current!.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.4);
    });
  };

  const triggerAdnFastForward = () => {
    if (adnTransitionTriggeredRef.current || !isCalling || !isADN) return;
    adnTransitionTriggeredRef.current = true;
    setAdnTransitioning(true);
    setAdnTransitionProgress(0);

    // 1. Silenciar inmediatamente el audio de ambos motores (ElevenLabs y Gemini Live) y micrófonos
    if (conversationRef.current && typeof conversationRef.current.setVolume === 'function') {
      try { conversationRef.current.setVolume({ volume: 0 }); } catch (_) {}
    }
    if (geminiSessionRef.current) {
      geminiSessionRef.current.suppressAiOutput(true);
      geminiSessionRef.current.setMuted(true);
    }
    setProspectSpeaking(false);
    setUserSpeaking(false);
    setInterimSpeech('');

    playTransitionChime();

    // 2. Animar barra de progreso durante 5 segundos
    const interval = setInterval(() => {
      setAdnTransitionProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 5;
      });
    }, 250);

    const finalize = () => {
      clearInterval(interval);
      setAdnTransitionProgress(100);
      setAdnTransitioning(false);
      setAdnPhase(2);
      phase2StartTimeRef.current = Date.now();

      // Restaurar volumen y desmutear micrófono del asesor
      if (conversationRef.current && typeof conversationRef.current.setVolume === 'function') {
        try { conversationRef.current.setVolume({ volume: 1 }); } catch (_) {}
        // Enviar actualización de contexto silenciosa a ElevenLabs sin forzar voz prematura
        try {
          if (typeof conversationRef.current.sendContextualUpdate === 'function') {
            conversationRef.current.sendContextualUpdate(
              "[Aviso de tiempo: Han transcurrido 30 minutos de sesión. Ya capturaron todos los números del cuestionario en la libreta. Ahora el asesor tomará la palabra para agendar la siguiente reunión. Espera a que el asesor hable para responderle con naturalidad.]"
            );
          }
        } catch (_) {}
      }

      if (geminiSessionRef.current) {
        geminiSessionRef.current.suppressAiOutput(false);
        geminiSessionRef.current.setMuted(false);
      }

      // Agregar marcador de sistema a la bitácora (NO como diálogo inventado de Karla)
      const transitionMarker = {
        source: 'ai' as const,
        message: '⏩ [30 minutos después]: Se han capturado todos los números del cuestionario financiero en la libreta. Es momento de concluir la reunión.'
      };
      transcriptRef.current = [...transcriptRef.current, transitionMarker];
      setTranscript(prev => [...prev, transitionMarker]);

      setCallStatusText('⏩ Fase 2 iniciada: Toma la palabra para explicar los siguientes pasos y agendar la Cita de Cierre con Doble Alternativa.');
    };

    setTimeout(() => {
      finalize();
    }, 5000);
  };

  // 2. Fetch or load session
  const initSession = async () => {
    try {
      setLoadingScenario(true);
      // Limpiar inmediatamente el caso anterior para que no quede en pantalla
      setCallDuration(0);
      setTranscript([]);
      setAdnPhase(1);
      setAdnTransitioning(false);
      setAdnTransitionProgress(0);
      adnTransitionTriggeredRef.current = false;
      phase2StartTimeRef.current = 0;
      setProspectSpeaking(false);
      setUserSpeaking(false);
      setUserMicVolume(0);

      const res = await fetch('/api/roleplay/session', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleId })
      });
      if (!res.ok) throw new Error('Error al cargar sesión');
      const data = await res.json();
      setScenario(data.scenario);
      setEngine(data.engine || 'GEMINI_LIVE');
      setSignedUrl(data.signedUrl);
      setWsUrl(data.wsUrl);
      setVoiceName(data.voiceName);
      sessionUrlConsumedRef.current = false;
      sessionUrlCreatedAtRef.current = Date.now();
      userHungUpRef.current = false;
      autoRetriedSafeVoiceRef.current = false;
      setStats(data.stats);
      if (Array.isArray(data.historyCalls)) {
        setHistoryCalls(data.historyCalls);
      }
      const engineLabel = (data.engine || 'GEMINI_LIVE') === 'GEMINI_LIVE' ? 'Gemini Live' : 'ElevenLabs';
      setCallStatusText(`Expediente listo (${engineLabel}). Listo para marcar a ${data.scenario.prospecto.nombre}.`);
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
  const startCall = async (retryFlag?: any) => {
    const isAutoRetry = retryFlag === true;
    if (!isAutoRetry && (isCalling || isConnecting || (!signedUrl && !wsUrl))) return;

    try {
      if (!isAutoRetry) {
        userHungUpRef.current = false;
        autoRetriedSafeVoiceRef.current = false;
      }
      isEvaluatingRef.current = false;
      startTimeRef.current = 0;
      setIsConnecting(true);
      transcriptRef.current = [];
      setTranscript([]);
      setCallDuration(0);
      if (isADN) {
        setCallStatusText(`Ingresando a la sala de diagnóstico con ${scenario.prospecto.nombre}...`);
      } else if (isObjeciones) {
        setCallStatusText(`Iniciando sesión de cierre con ${scenario.prospecto.nombre}...`);
      } else {
        setCallStatusText(`Marcando a ${scenario.prospecto.nombre}...`);
        playRing();
      }

      // Si el token de sesión ya fue consumido en un intento previo o tiene más de 30s, refrescarlo conservando al prospecto en pantalla
      let activeSignedUrl = signedUrl;
      let activeWsUrl = wsUrl;
      let activeScenario = scenario;
      const needsFreshUrl = isAutoRetry || sessionUrlConsumedRef.current || (Date.now() - sessionUrlCreatedAtRef.current > 30000);
      if (needsFreshUrl && scenario) {
        try {
          const refreshRes = await fetch('/api/roleplay/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              moduleId,
              preserveScenario: scenario,
              forceSafeVoice: isAutoRetry
            })
          });
          if (refreshRes.ok) {
            const refreshData = await refreshRes.json();
            if (refreshData.signedUrl) {
              activeSignedUrl = refreshData.signedUrl;
              setSignedUrl(refreshData.signedUrl);
            }
            if (refreshData.wsUrl) {
              activeWsUrl = refreshData.wsUrl;
              setWsUrl(refreshData.wsUrl);
            }
            if (refreshData.scenario) {
              activeScenario = refreshData.scenario;
              setScenario(refreshData.scenario);
            }
            sessionUrlCreatedAtRef.current = Date.now();
          }
        } catch (refreshErr) {
          console.warn('Error refreshing session URL before call:', refreshErr);
        }
      }
      sessionUrlConsumedRef.current = true;

      // Safeguard: nunca dejar la UI colgada en "Conectando..." si el WebSocket o red tarda de más
      if (connectTimeoutRef.current) clearTimeout(connectTimeoutRef.current);
      connectTimeoutRef.current = setTimeout(() => {
        setIsConnecting(prev => {
          if (prev) {
            stopRing();
            setIsCalling(false);
            setCallStatusText('⚠️ Tiempo de espera agotado al conectar. Revisa tu micrófono e intenta de nuevo.');
            return false;
          }
          return prev;
        });
      }, 12000);

      if (engine === 'GEMINI_LIVE' && activeWsUrl) {
        // --- GOOGLE GEMINI LIVE API ENGINE ---
        const geminiSession = new GeminiLiveSession({
          wsUrl: activeWsUrl,
          systemPrompt: activeScenario.systemPrompt,
          firstMessage: activeScenario.firstMessage,
          voiceName: voiceName || (activeScenario.prospecto.genero === 'F' ? 'Aoede' : 'Puck'),
          inputDeviceId: selectedInputId || undefined,
          outputDeviceId: selectedOutputId || undefined,
          onConnect: ({ conversationId }) => {
            if (connectTimeoutRef.current) {
              clearTimeout(connectTimeoutRef.current);
              connectTimeoutRef.current = null;
            }
            stopRing();
            playChime('pickup');
            setIsConnecting(false);
            setIsCalling(true);
            conversationIdRef.current = conversationId || null;
            startTimeRef.current = Date.now();
            if (isADN) {
              setCallStatusText(`En reunión de diagnóstico ADN con ${activeScenario.prospecto.nombre} (Gemini Live)`);
            } else if (isObjeciones) {
              setCallStatusText(`En sesión de cierre con ${activeScenario.prospecto.nombre} (Gemini Live)`);
            } else {
              setCallStatusText(`🟢 En llamada con ${activeScenario.prospecto.nombre} (Gemini Live)`);
            }

            timerRef.current = setInterval(() => {
              const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
              setCallDuration(elapsed);

              if (isADN) {
                // Auto-trigger transición a los 5 minutos (300 segundos) de Fase 1
                if (elapsed >= 300 && !adnTransitionTriggeredRef.current) {
                  triggerAdnFastForward();
                }

                // Límite de Fase 2 (3 minutos desde que terminó la transición) o 8 minutos totales (480s)
                const phase2Secs = phase2StartTimeRef.current 
                  ? Math.floor((Date.now() - phase2StartTimeRef.current) / 1000) 
                  : 0;

                if (phase2StartTimeRef.current && phase2Secs >= 180) {
                  userHungUpRef.current = true;
                  hangupCall();
                  return;
                }

                if (elapsed >= 480) {
                  userHungUpRef.current = true;
                  hangupCall();
                  return;
                }
              } else {
                const maxDuration = isObjeciones ? 1200 : 300;
                if (elapsed >= maxDuration) {
                  userHungUpRef.current = true;
                  hangupCall();
                  return;
                }
              }
            }, 1000);
          },
          onDisconnect: () => {
            const elapsedSecs = startTimeRef.current ? Math.floor((Date.now() - startTimeRef.current) / 1000) : 0;
            const userTurnsCount = transcriptRef.current.filter(t => t.source === 'user').length;
            if (!userHungUpRef.current && elapsedSecs < 4 && userTurnsCount === 0) {
              stopRing();
              if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
              }
              setIsConnecting(false);
              setIsCalling(false);
              setCallStatusText('⚠️ La línea tuvo una interrupción al conectar. Presiona Iniciar Llamada para volver a marcar.');
              return;
            }
            hangupCall();
          },
          onError: (err: any) => {
            console.error("Gemini Live Error:", err);
            stopRing();
            setIsConnecting(false);
            setIsCalling(false);
            if (connectTimeoutRef.current) {
              clearTimeout(connectTimeoutRef.current);
              connectTimeoutRef.current = null;
            }
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            if (geminiSessionRef.current) {
              try { geminiSessionRef.current.end(); } catch (_) {}
              geminiSessionRef.current = null;
            }
            setCallStatusText('⚠️ Error de conexión con Google Gemini Live. Intenta marcar nuevamente.');
            alert(
              'No se pudo conectar con Google Gemini Live:\n\n' +
              (err?.message || 'Error de conexión') +
              '\n\nPor favor intenta marcar nuevamente.'
            );
          },
          onMessage: ({ source, message }) => {
            transcriptRef.current = [...transcriptRef.current, { source, message }];
            setTranscript(prev => [...prev, { source, message }]);
          },
          onUserSpeaking: (speaking, vol) => {
            setUserSpeaking(speaking);
            setUserMicVolume(vol);
          },
          onAiSpeaking: (speaking) => {
            setProspectSpeaking(speaking);
            if (speaking) {
              setCallStatusText(`🗣️ ${activeScenario.prospecto.nombre.split(' ')[0]} está hablando...`);
            } else {
              setCallStatusText(`👂 ${activeScenario.prospecto.nombre.split(' ')[0]} te está escuchando...`);
            }
          },
          onInterimSpeech: (interim) => {
            setInterimSpeech(interim);
          },
          onMicStatus: (status, details) => {
            setMicStatus({ status, details });
          }
        });

        geminiSessionRef.current = geminiSession;
        await geminiSession.start();
      } else if (activeSignedUrl) {
        // --- ELEVENLABS CONVAI ENGINE ---
        const conv = await Conversation.startSession({
          signedUrl: activeSignedUrl,
          inputDeviceId: selectedInputId || undefined,
          outputDeviceId: selectedOutputId || undefined,
          workletPaths: {
            rawAudioProcessor: '/worklets/rawAudioProcessor.js?v=2',
            audioConcatProcessor: '/worklets/audioConcatProcessor.js?v=2'
          },
          libsampleratePath: '/worklets/libsamplerate.worklet.js?v=2',
          ...(isAutoRetry
            ? {}
            : {
                overrides: {
                  agent: {
                    prompt: {
                      prompt: activeScenario.systemPrompt
                    },
                    firstMessage: activeScenario.firstMessage,
                    language: 'es'
                  },
                  tts: {
                    voiceId: activeScenario.prospecto.voiceId,
                    stability: 0.75,
                    similarityBoost: 0.85,
                    speed: 1.0
                  }
                }
              }),
          onConnect: ({ conversationId }) => {
            if (connectTimeoutRef.current) {
              clearTimeout(connectTimeoutRef.current);
              connectTimeoutRef.current = null;
            }
            stopRing();
            playChime('pickup');
            setIsConnecting(false);
            setIsCalling(true);
            conversationIdRef.current = conversationId || null;
            startTimeRef.current = Date.now();
            if (isADN) {
              setCallStatusText(`En reunión de diagnóstico ADN con ${activeScenario.prospecto.nombre}`);
            } else if (isObjeciones) {
              setCallStatusText(`En sesión de cierre con ${activeScenario.prospecto.nombre}`);
            } else {
              setCallStatusText(`🟢 En llamada con ${activeScenario.prospecto.nombre}`);
            }

            // Timer
            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = setInterval(() => {
              const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
              setCallDuration(elapsed);

              if (isADN) {
                // Auto-trigger transición a los 5 minutos (300 segundos) de Fase 1
                if (elapsed >= 300 && !adnTransitionTriggeredRef.current) {
                  triggerAdnFastForward();
                }

                // Límite de Fase 2 (3 minutos desde que terminó la transición) o 8 minutos totales (480s)
                const phase2Secs = phase2StartTimeRef.current 
                  ? Math.floor((Date.now() - phase2StartTimeRef.current) / 1000) 
                  : 0;

                if (phase2StartTimeRef.current && phase2Secs >= 180) {
                  userHungUpRef.current = true;
                  hangupCall();
                  return;
                }

                if (elapsed >= 480) {
                  userHungUpRef.current = true;
                  hangupCall();
                  return;
                }
              } else {
                const maxDuration = isObjeciones ? 1200 : 300;
                if (elapsed >= maxDuration) {
                  userHungUpRef.current = true;
                  hangupCall();
                  return;
                }
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
            if (micIntervalRef.current) {
              clearInterval(micIntervalRef.current);
              micIntervalRef.current = null;
            }
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            setUserSpeaking(false);
            setUserMicVolume(0);

            const elapsedSecs = startTimeRef.current ? Math.floor((Date.now() - startTimeRef.current) / 1000) : 0;
            const userTurnsCount = transcriptRef.current.filter(t => t.source === 'user').length;

            // Si la llamada se cortó sola en los primeros 4 segundos sin que el asesor hablara ni colgara:
            if (!userHungUpRef.current && elapsedSecs < 4 && userTurnsCount === 0) {
              conversationRef.current = null;
              if (!autoRetriedSafeVoiceRef.current) {
                console.warn('[ElevenLabs] Corte prematuro (<4s) detectado. Reintentando con configuración segura de respaldo...');
                autoRetriedSafeVoiceRef.current = true;
                setCallStatusText(`Reconectando línea con ${activeScenario.prospecto.nombre}...`);
                startCall(true);
                return;
              }
              stopRing();
              setIsConnecting(false);
              setIsCalling(false);
              setCallStatusText('⚠️ La línea tuvo una interrupción al conectar. Presiona Iniciar Llamada para volver a marcar.');
              return;
            }

            stopRing();
            playChime('hangup');
            handleCallEnded();
          },
          onError: (err) => {
            stopRing();
            setIsConnecting(false);
            setIsCalling(false);
            console.error("Conversation error:", err);
            setCallStatusText('⚠️ Detalle en conexión de audio con el prospecto.');
          },
          onModeChange: ({ mode }) => {
            setProspectSpeaking(mode === 'speaking');
            if (mode === 'speaking') {
              setCallStatusText(`🗣️ ${activeScenario.prospecto.nombre.split(' ')[0]} está hablando...`);
            } else {
              setCallStatusText(`👂 ${activeScenario.prospecto.nombre.split(' ')[0]} te está escuchando...`);
            }
          },
          onMessage: ({ message, source }) => {
            if (message) {
              const item: { source: 'ai' | 'user'; message: string } = { source: source === 'ai' ? 'ai' : 'user', message };
              transcriptRef.current = [...transcriptRef.current, item];
              setTranscript(prev => [...prev, item]);
            }
          }
        });

        conversationRef.current = conv;
      }
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
    userHungUpRef.current = true;
    if (connectTimeoutRef.current) {
      clearTimeout(connectTimeoutRef.current);
      connectTimeoutRef.current = null;
    }
    stopRing();
    setIsConnecting(false);
    setIsCalling(false);
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
    setInterimSpeech('');

    let recordingBlob: Blob | null = null;
    if (geminiSessionRef.current) {
      try {
        const geminiTurns = geminiSessionRef.current.getTranscript();
        if (geminiTurns && geminiTurns.length > transcriptRef.current.length) {
          transcriptRef.current = geminiTurns;
          setTranscript(geminiTurns);
        }
        recordingBlob = await geminiSessionRef.current.stopRecording();
      } catch (e) {
        console.warn('Error stopping Gemini Live recording:', e);
      }
      try {
        geminiSessionRef.current.end();
      } catch (e) {
        console.warn('Error ending Gemini Live session:', e);
      }
      geminiSessionRef.current = null;
    }

    if (conversationRef.current) {
      try {
        await conversationRef.current.endSession();
      } catch (e) {
        console.warn('Error ending ElevenLabs session:', e);
      }
      conversationRef.current = null;
    }

    await handleCallEnded(recordingBlob);
  };

  // 5. Evaluate Call
  const handleCallEnded = async (recordingBlob?: Blob | null) => {
    if (isEvaluatingRef.current) return;
    const elapsed = startTimeRef.current
      ? Math.max(callDuration, Math.floor((Date.now() - startTimeRef.current) / 1000))
      : callDuration;
    const userTurnsCount = transcriptRef.current.filter(t => t.source === 'user').length;

    // Nunca evaluar ni penalizar con 0 puntos si la llamada se cortó técnicamente (<4s) sin que el usuario colgara ni hablara
    if (!userHungUpRef.current && elapsed < 4 && userTurnsCount === 0) {
      setIsCalling(false);
      setIsConnecting(false);
      setProspectSpeaking(false);
      setIsEvaluating(false);
      setCallStatusText('⚠️ La llamada se desconectó antes de iniciar. Presiona Iniciar Llamada para volver a marcar.');
      return;
    }

    isEvaluatingRef.current = true;
    setIsCalling(false);
    setIsConnecting(false);
    setProspectSpeaking(false);
    setIsEvaluating(true);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setCallStatusText(
      isADN 
        ? 'Evaluando diagnóstico patrimonial y técnica 50-30-20...' 
        : isObjeciones 
          ? 'Evaluando manejo de objeciones y técnicas de cierre...' 
          : 'Evaluando desempeño y técnica de prospección...'
    );

    // Upload call recording to Vercel Blob if available
    let uploadedAudioUrl: string | null = null;
    if (recordingBlob && recordingBlob.size > 0 && conversationIdRef.current) {
      try {
        setCallStatusText('Guardando grabación de audio y evaluando...');
        const formData = new FormData();
        formData.append('file', recordingBlob, `${conversationIdRef.current}.webm`);
        formData.append('conversationId', conversationIdRef.current);

        const upRes = await fetch('/api/roleplay/upload-recording', {
          method: 'POST',
          body: formData
        });

        if (upRes.ok) {
          const upJson = await upRes.json();
          uploadedAudioUrl = upJson.url || null;
        }
      } catch (recUploadErr) {
        console.warn('Error subiendo grabación de llamada:', recUploadErr);
      }
    }

    try {
      const geminiTurns = geminiSessionRef.current ? geminiSessionRef.current.getTranscript() : [];
      const effectiveTranscript = (transcriptRef.current && transcriptRef.current.length > 0)
        ? transcriptRef.current
        : (geminiTurns && geminiTurns.length > 0 ? geminiTurns : transcript);

      const res = await fetch('/api/roleplay/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: effectiveTranscript,
          durationSeconds: elapsed,
          scenario,
          conversationId: conversationIdRef.current,
          moduleId,
          engine,
          callAudioUrl: uploadedAudioUrl
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
          callAudioUrl: uploadedAudioUrl || evalData.callAudioUrl || null,
          engine: engine,
          createdAt: new Date().toISOString()
        },
        ...prev
      ]);

      setIsEvaluating(false);
      setIsEvalOpen(true);
    } catch (e) {
      console.error("Error evaluating call:", e);
      setIsEvaluating(false);
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
          {isADN ? <Video className="h-4 w-4 text-emerald-400" /> : isObjeciones ? <Award className="h-4 w-4 text-amber-400" /> : <Phone className="h-4 w-4" />}
          <span>{isADN ? 'Sala de Diagnóstico ADN' : isObjeciones ? 'Simulador de Cierre' : 'Simulador Telefónico'}</span>
        </button>

        <button
          onClick={() => setActiveTab('historial')}
          className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-t-xl transition-colors border-t border-x ${activeTab === 'historial' ? 'bg-slate-900 border-slate-800 text-indigo-400' : 'text-slate-400 hover:text-slate-200 border-transparent'}`}
        >
          <History className="h-4 w-4" />
          <span>{isADN ? 'Historial de Sesiones ADN' : isObjeciones ? 'Historial de Cierres' : 'Mi Historial de Llamadas'}</span>
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
              ) : (isADN || isObjeciones) ? (
                /* VISTA EJECUTIVA: SALA DE REUNIÓN / FRENTE A LA MESA (ADN & CIERRE) */
                <div className="p-6 md:p-8 border-b border-slate-800/80 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/40 space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <span className="flex h-3 w-3 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                      </span>
                      <span className="text-xs font-black tracking-wider uppercase text-slate-200 flex items-center gap-1.5">
                        <Video className={`w-4 h-4 ${isADN ? 'text-emerald-400' : 'text-purple-400'}`} />
                        {isADN ? 'Sala Ejecutiva • Diagnóstico ADN' : 'Sala Ejecutiva • Presentación de Proyecto y Cierre'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {isADN ? (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> Regla 50-30-20 Elizabeth Warren
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> Técnicas de Cierre Consultivo
                        </span>
                      )}
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                        Nivel {scenario.difficultyLevel}
                      </span>
                    </div>
                  </div>

                  {/* Escenario de Videoconferencia / Frente a la mesa */}
                  <div
                    className={`relative w-full aspect-video max-h-[340px] sm:max-h-[380px] rounded-2xl overflow-hidden border-2 transition-all duration-500 bg-slate-950 shadow-2xl flex items-center justify-center ${
                      prospectSpeaking ? 'border-emerald-500 shadow-emerald-500/20' : 'border-slate-800'
                    }`}
                  >
                    <img
                      src={scenario.prospecto.avatar}
                      alt={scenario.prospecto.nombre}
                      className={`w-full h-full object-cover object-top transition-transform duration-700 ${
                        prospectSpeaking ? 'scale-105 brightness-105' : 'scale-100 brightness-95'
                      }`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-black/40 pointer-events-none" />

                    {/* Tag Superior Cámara */}
                    <div className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-[10px] text-white font-medium">
                      <span className={`w-2 h-2 rounded-full ${prospectSpeaking ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
                      <span>Cámara de {scenario.prospecto.nombre.split(' ')[0]} (En Vivo)</span>
                    </div>

                    {/* Indicador Hablando */}
                    {prospectSpeaking && (
                      <div className="absolute top-3 right-3 flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black tracking-wider uppercase shadow-lg animate-bounce">
                        <Mic className="w-3 h-3" /> Hablando
                      </div>
                    )}

                    {/* Barra Inferior Identidad del Prospecto */}
                    <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-end justify-between gap-3 p-3.5 rounded-xl bg-slate-950/85 backdrop-blur-md border border-white/10">
                      <div>
                        <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                          {scenario.prospecto.nombre}
                          <span className="text-xs font-normal text-slate-400">({scenario.prospecto.edad} años)</span>
                        </h2>
                        <p className="text-xs text-indigo-300 font-semibold">
                          {scenario.prospecto.puesto}
                        </p>
                        <p className="text-[11px] text-slate-400 italic line-clamp-1">
                          "{scenario.prospecto.contexto}"
                        </p>
                      </div>
                      <div className="text-right hidden sm:block">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Posición</span>
                        <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1 justify-end">
                          <CheckCircle2 className="w-3.5 h-3.5" /> {isObjeciones ? 'Revisando propuesta en pantalla' : 'Al otro lado de la mesa'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Pre-Meeting Briefing Card */}
                  <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 text-xs space-y-2">
                    <div className="font-bold text-indigo-300 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                      <Info className="h-4 w-4 text-indigo-400" /> {isObjeciones ? 'Expediente & Propuesta en Pantalla:' : 'Expediente & Contexto de la Cita:'}
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                      {scenario.origen.brief}
                    </p>
                    <div className="pt-2 border-t border-indigo-500/10 text-[11px] text-slate-400 leading-snug">
                      <strong className="text-amber-300">Protocolo de Oro: </strong>
                      {isADN ? (
                        <>Preséntate como asesor patrimonial, explica la Regla 50-30-20, pide permiso para el cuestionario y adapta tus preguntas (detalle o resumen en bloques si hay resistencia). Al final agenda la siguiente cita para entregar el proyecto. <strong>No vendas pólizas hoy.</strong></>
                      ) : (
                        <>Valida con empatía la duda del cliente, aísla la cortina de humo para llegar a la objeción real, rebate con técnica consultiva (Boomerang, Siente-Sentían-Comprobaron o Costo Diario) y remata con Cierre Asumido con doble alternativa. <strong>Jamás digas "piénsalo y me avisas".</strong></>
                      )}
                    </div>
                  </div>
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

                {/* Headphone / No Echo Tip */}
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-indigo-950/20 border border-indigo-500/20 text-[11px] text-slate-400">
                  <Headphones className="h-3.5 w-3.5 text-indigo-400 flex-shrink-0" />
                  <span>Tip de audio: Te recomendamos usar audífonos para evitar que tu micrófono capte el sonido del altavoz (eco acústico).</span>
                </div>
                
                {/* Timer & Status text */}
                <div className="flex flex-col items-center justify-center text-center space-y-2">
                  <div className="text-4xl font-mono font-black text-slate-100 tracking-wider">
                    {formatTime(callDuration)}
                  </div>
                  <div className="text-xs text-slate-400 flex items-center justify-center gap-2 flex-wrap">
                    <span className={`w-2 h-2 rounded-full ${isCalling ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`} />
                    <span>{callStatusText}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-medium">
                      {engine === 'GEMINI_LIVE' ? '⚡ Google Gemini Live' : '🎙️ ElevenLabs ConvAI'}
                    </span>
                  </div>

                  {/* Real-time Voice Activity Indicator (Confirming mic is picking up user voice) */}
                  {isCalling && (
                    <div className="flex flex-col items-center gap-2 mt-1">
                      <div className="flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-950/90 border border-slate-800 text-[11px] shadow-inner animate-in fade-in">
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

                      {/* Live Interim Speech Preview (User sees words as they speak!) */}
                      {interimSpeech && (
                        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-indigo-950/70 border border-indigo-500/40 text-xs text-indigo-200 shadow-lg animate-pulse">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                          <span className="text-[11px] text-slate-400 font-medium">Captando tu voz:</span>
                          <span className="italic font-bold text-white">"{interimSpeech}..."</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* ADN Active Phase, Countdown Timer & Fast-Forward Controls */}
                {isCalling && isADN && (
                  <div className="p-4 rounded-3xl bg-slate-950/80 border border-indigo-500/30 space-y-3 shadow-xl">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-3 py-1 rounded-xl font-black uppercase tracking-wider text-xs ${
                          adnPhase === 1 
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        }`}>
                          {adnPhase === 1 ? 'Fase 1 de 2: Apertura & Metas' : 'Fase 2 de 2: Cierre de Cita'}
                        </span>
                        
                        {/* Countdown Timers */}
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono font-bold">
                          <Clock className={`h-3.5 w-3.5 ${adnPhase === 1 ? 'text-amber-400' : 'text-emerald-400'}`} />
                          <span className="text-slate-400">
                            {adnPhase === 1 ? 'Te quedan:' : 'Restante Cierre:'}
                          </span>
                          <span className={`text-sm font-black ${adnPhase === 1 ? 'text-amber-300' : 'text-emerald-300'}`}>
                            {adnPhase === 1 
                              ? formatTime(Math.max(0, 300 - callDuration)) 
                              : formatTime(Math.max(0, Math.min(180 - (phase2StartTimeRef.current ? Math.floor((Date.now() - phase2StartTimeRef.current) / 1000) : 0), 480 - callDuration)))}
                          </span>
                        </div>
                      </div>

                      {adnPhase === 1 && !adnTransitioning && (
                        <button
                          type="button"
                          onClick={triggerAdnFastForward}
                          className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all hover:scale-105"
                          title="Avanzar automáticamente los 30 minutos de desglose financiero y pasar al cierre"
                        >
                          <FastForward className="h-4 w-4" />
                          <span>Completar preguntas y pasar al Cierre de Sesión</span>
                        </button>
                      )}
                    </div>

                    {/* Barra Visual de Transición Cinemática */}
                    {adnTransitioning && (
                      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/40 space-y-2.5 animate-in fade-in zoom-in-95">
                        <div className="flex items-center justify-between text-xs font-bold text-amber-300">
                          <span className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-amber-400 animate-spin" />
                            <span>Avance temporal: 30 minutos de sesión...</span>
                          </span>
                          <span className="font-mono">{adnTransitionProgress}%</span>
                        </div>
                        <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-700">
                          <div 
                            className="bg-gradient-to-r from-amber-500 to-amber-300 h-full rounded-full transition-all duration-300"
                            style={{ width: `${adnTransitionProgress}%` }}
                          />
                        </div>
                        <p className="text-[11px] text-slate-300 text-center italic">
                          "Se concluye la captura de cifras financieras en la libreta. Preparando cierre de reunión..."
                        </p>
                      </div>
                    )}

                    {/* Banner de Acción Inmediata para el Asesor al entrar a Fase 2 */}
                    {adnPhase === 2 && !adnTransitioning && (
                      <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 flex items-start gap-3 shadow-lg shadow-emerald-950/30 animate-in fade-in">
                        <Sparkles className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                        <div className="text-xs space-y-1">
                          <strong className="text-emerald-300 font-bold block text-sm">
                            👉 Es tu turno: Toma la palabra por el micrófono
                          </strong>
                          <p className="text-slate-200 leading-relaxed">
                            Explícale al cliente que te llevarás su radiografía a tu despacho para diseñar la propuesta y <strong>agenda la Cita de Presentación con Doble Alternativa</strong> (ej: <em>"¿Te queda mejor vernos el martes a las 11:00 am o el jueves a las 4:00 pm?"</em>).
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                      {adnPhase === 1 ? (
                        <>
                          <strong className="text-amber-300 font-bold block sm:inline">📌 Instrucciones Fase 1: </strong>
                          Tienes <strong>hasta 5 minutos</strong> para explicar la intención de la sesión, marco de confidencialidad y explorar prioridades de vida (F.O.R.D.). Cuando vayas a pasar al cuestionario detallado y cierre, da clic en el botón amarillo o espera a que concluya el tiempo para la transición automática.
                        </>
                      ) : (
                        <>
                          <strong className="text-emerald-300 font-bold block sm:inline">🎯 Instrucciones Fase 2: </strong>
                          Tienes <strong>hasta 3 minutos</strong> para explicar que te llevarás los números a tu despacho para estructurar la solución y agendar la <strong>Cita de Cierre con Doble Alternativa</strong> de fecha y horario.
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Big Action Buttons */}
                <div className="flex items-center justify-center gap-6">
                  {!isCalling ? (
                    <button
                      onClick={startCall}
                      disabled={isConnecting || loadingScenario}
                      className={`flex items-center justify-center gap-3 px-8 py-4 rounded-2xl text-white font-bold text-base shadow-xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                        (isADN || isObjeciones)
                          ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-950/50' 
                          : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/50'
                      }`}
                    >
                      {(isADN || isObjeciones) ? <Video className="h-5 w-5" /> : <Phone className="h-5 w-5" />}
                      <span>
                        {isConnecting 
                          ? 'Conectando...' 
                          : isADN 
                            ? 'Empezar Reunión ADN' 
                            : moduleId === 'objeciones'
                              ? 'Iniciar Sesión de Cierre'
                              : 'Iniciar Llamada'}
                      </span>
                    </button>
                  ) : (
                    <button
                      onClick={hangupCall}
                      className="flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-base shadow-xl shadow-rose-950/50 transition-all hover:scale-105 animate-pulse"
                    >
                      {(isADN || isObjeciones) ? <LogOut className="h-5 w-5" /> : <PhoneOff className="h-5 w-5" />}
                      <span>
                        {isADN 
                          ? 'Finalizar Reunión y Evaluar' 
                          : moduleId === 'objeciones'
                            ? 'Concluir Cierre y Evaluar'
                            : 'Colgar y Evaluar'}
                      </span>
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
                        {isADN 
                          ? 'Presiona "Empezar Reunión ADN" para abrir la sesión con el cliente...' 
                          : 'Presiona "Iniciar Llamada" para hablar con el prospecto por tu micrófono...'}
                      </div>
                    ) : (
                      transcript.map((t, idx) => {
                        const isSystemMarker = t.message.startsWith('⏩') || t.message.startsWith('🎙️') || (t.source as any) === 'system';
                        if (isSystemMarker) {
                          return (
                            <div 
                              key={idx} 
                              className="my-3 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-center justify-center gap-2 text-center shadow-inner animate-in fade-in"
                            >
                              <Sparkles className="h-4 w-4 text-amber-400 shrink-0" />
                              <span className="font-medium leading-relaxed">
                                {t.message.replace(/^🎙️\s*(\[Director de Escena\]:?)?\s*/i, '').replace(/^⏩\s*/, '')}
                              </span>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={idx}
                            className={`p-2.5 rounded-xl ${t.source === 'ai' ? 'bg-slate-900 border border-slate-800 text-indigo-300' : 'bg-indigo-950/30 border border-indigo-500/20 text-slate-100 ml-6'}`}
                          >
                            <strong className="block text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">
                              {(t.source === 'ai' ? scenario?.prospecto?.nombre?.split(' ')[0] : 'Tú') + ':'}
                            </strong>
                            <span>{t.message}</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

              </div>

            </div>

          </div>

          {/* Right Column: Mission and Badges */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Widget ADN: Protocolo Consultivo en 2 Fases */}
            {isADN && (
              <div className="p-6 rounded-3xl bg-slate-900 border border-amber-500/30 space-y-4 shadow-lg relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-400" /> Protocolo ADN (2 Fases)
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    5 a 6 Minutos
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-3 rounded-2xl bg-slate-950/70 border border-amber-500/20 space-y-1.5">
                    <div className="flex items-center justify-between font-bold text-amber-300">
                      <span>Fase 1: Apertura & Técnica F.O.R.D.</span>
                      <span className="text-[10px] text-slate-400">0:00 - 3:00 min</span>
                    </div>
                    <ul className="text-[11px] text-slate-300 space-y-1 list-disc list-inside">
                      <li><strong>Confidencialidad:</strong> Garantiza que la información es 100% privada.</li>
                      <li><strong>Diagnóstico a la Medida:</strong> No productos genéricos ni ventas hoy.</li>
                      <li><strong>F.O.R.D.:</strong> Familia, Ocupación, Recreación y Sueños/Dinero.</li>
                      <li><strong>Priorizar:</strong> Pídele jerarquizar su meta #1 de vida (+35 XP).</li>
                      <li><strong>Escucha Activa:</strong> Permite que hable sin interrumpirlo.</li>
                    </ul>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-950/70 border border-emerald-500/20 space-y-1.5">
                    <div className="flex items-center justify-between font-bold text-emerald-300">
                      <span>Fase 2: Conclusión & Cierre de Cita</span>
                      <span className="text-[10px] text-slate-400">3:00 - 5:30 min</span>
                    </div>
                    <ul className="text-[11px] text-slate-300 space-y-1 list-disc list-inside">
                      <li><strong>En Despacho:</strong> Analizarás los datos contra la metodología.</li>
                      <li><strong>Segunda Cita:</strong> Presentación de solución personalizada.</li>
                      <li><strong>Doble Alternativa:</strong> Ofrece 2 opciones claras de día y hora.</li>
                    </ul>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200 space-y-1">
                  <strong className="block text-amber-300 font-bold">💡 Regla de Oro:</strong>
                  <p>
                    Prohibido vender pólizas o cotizar aseguradoras hoy. El éxito es concretar la Cita de Cierre con Doble Alternativa.
                  </p>
                </div>
              </div>
            )}

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
                  💡 Mantén tu racha diaria activa para evitar la penalización de <strong className="text-rose-400">-300 XP</strong> por día hábil omitido.
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
                  <span className="font-bold text-amber-400">6,500 XP</span>
                </div>
              </div>
            </div>

            {/* Vitrina de Insignias - Últimas 5 obtenidas */}
            {(() => {
              const userBadgeIds: string[] = Array.isArray(stats?.badges) ? stats.badges : [];
              const recentBadges = userBadgeIds.slice(-5).reverse().map(id => getBadgeDetails(id));

              return (
                <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-lg">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Award className="h-4 w-4 text-amber-400" /> Insignias Desbloqueadas
                    </h3>
                    {userBadgeIds.length > 0 ? (
                      <Link
                        href="/academia/simulador/insignias"
                        className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1"
                        title="Ver álbum completo de insignias"
                      >
                        <span>Ver Álbum ({userBadgeIds.length})</span>
                        <span>→</span>
                      </Link>
                    ) : (
                      <span className="text-[10px] text-slate-500 font-medium">0 obtenidas</span>
                    )}
                  </div>

                  {recentBadges.length === 0 ? (
                    <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/80 text-center space-y-2">
                      <div className="text-3xl opacity-60">🎯</div>
                      <p className="text-xs font-bold text-slate-300">Aún no tienes insignias desbloqueadas</p>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Completa llamadas exitosas (cita lograda y calificación 85+) para ganar tus primeras insignias.
                      </p>
                      <Link
                        href="/academia/simulador/insignias"
                        className="inline-block text-[11px] font-semibold text-amber-400 hover:underline pt-1"
                      >
                        Ver catálogo del álbum →
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="text-[11px] text-slate-400 flex items-center justify-between">
                        <span>Últimas {recentBadges.length} obtenidas:</span>
                        <span className="text-[10px] text-slate-500">Pasa el mouse para ver el logro</span>
                      </div>

                      <div className={`grid gap-2 ${recentBadges.length <= 3 ? 'grid-cols-3' : recentBadges.length === 4 ? 'grid-cols-4' : 'grid-cols-5'}`}>
                        {recentBadges.map((badge, idx) => (
                          <div
                            key={`${badge.id}-${idx}`}
                            onMouseEnter={() => setHoveredBadge(badge)}
                            onMouseLeave={() => setHoveredBadge(null)}
                            className="group relative p-2.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 hover:border-amber-400/60 text-amber-300 text-center transition-all cursor-pointer flex flex-col items-center justify-center shadow-sm"
                            title={`${badge.name}: ${badge.description}`}
                          >
                            <div className="text-2xl group-hover:scale-110 transition-transform">
                              {badge.icon}
                            </div>
                            <div className="text-[10px] font-bold mt-1 truncate w-full text-amber-200">
                              {badge.name}
                            </div>

                            {/* Tooltip flotante al pasar el mouse */}
                            <div className={`opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 absolute bottom-full mb-2.5 z-40 w-52 p-3 rounded-2xl bg-slate-950/95 border border-amber-500/40 text-left shadow-2xl backdrop-blur-md ${idx === 0 ? 'left-0' : idx === recentBadges.length - 1 ? 'right-0' : 'left-1/2 -translate-x-1/2'}`}>
                              <div className="flex items-center gap-2 mb-1.5 border-b border-slate-800 pb-1">
                                <span className="text-lg">{badge.icon}</span>
                                <span className="text-xs font-bold text-white">{badge.name}</span>
                              </div>
                              <div className="text-[11px] text-slate-300 leading-snug">
                                <span className="text-amber-400 font-semibold block text-[10px] uppercase tracking-wider mb-0.5">
                                  ¿Cómo te la ganaste?
                                </span>
                                {badge.description}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Panel explicativo interactivo al pasar el mouse */}
                      <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-xs transition-all">
                        {hoveredBadge ? (
                          <div className="space-y-1 animate-in fade-in duration-150">
                            <div className="flex items-center gap-1.5 font-bold text-amber-300 text-xs">
                              <span>{hoveredBadge.icon}</span>
                              <span>{hoveredBadge.name}</span>
                            </div>
                            <p className="text-[11px] text-slate-300 leading-relaxed">
                              <strong className="text-amber-400 font-medium">¿Cómo te la ganaste?: </strong>
                              {hoveredBadge.description}
                            </p>
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-500 italic text-center">
                            💡 Pasa el cursor por encima de cualquier insignia para saber exactamente cómo la ganaste.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

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
                    (h.callAudioUrl || h.engine !== 'GEMINI_LIVE') ? (
                      <audio
                        controls
                        className="h-8 max-w-[220px]"
                        src={h.callAudioUrl || `/api/roleplay/audio/${h.conversationId}`}
                      />
                    ) : (
                      <span className="text-[10px] text-slate-500 italic px-2.5 py-1 rounded-lg bg-slate-800/40 border border-slate-700/30">
                        Sin grabación
                      </span>
                    )
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
        moduleId={moduleId}
      />

      <EvaluatingModal
        isOpen={isEvaluating}
        moduleId={moduleId}
        prospectName={scenario?.prospecto?.nombre}
      />

      <EvaluationModal
        isOpen={isEvalOpen}
        evaluation={currentEval}
        stats={stats}
        moduleId={moduleId}
        onNextCall={() => {
          setIsEvalOpen(false);
          setTranscript([]);
          setCallDuration(0);
          initSession();
        }}
      />

    </div>
  );
}
