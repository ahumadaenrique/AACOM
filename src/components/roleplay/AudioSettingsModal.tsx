'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Headphones,
  Settings,
  Check,
  AlertCircle,
  Play,
  Square,
  Sparkles,
  X
} from 'lucide-react';

interface AudioSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedInputId: string;
  selectedOutputId: string;
  onSaveDevices: (inputId: string, outputId: string) => void;
  isInCall?: boolean;
}

export function AudioSettingsModal({
  isOpen,
  onClose,
  selectedInputId,
  selectedOutputId,
  onSaveDevices,
  isInCall = false
}: AudioSettingsModalProps) {
  const [inputDevices, setInputDevices] = useState<MediaDeviceInfo[]>([]);
  const [outputDevices, setOutputDevices] = useState<MediaDeviceInfo[]>([]);
  const [currentInputId, setCurrentInputId] = useState(selectedInputId);
  const [currentOutputId, setCurrentOutputId] = useState(selectedOutputId);

  // Mic test
  const [micLevel, setMicLevel] = useState(0); // 0 to 100
  const [isMicTesting, setIsMicTesting] = useState(true);
  const [micPermissionDenied, setMicPermissionDenied] = useState(false);

  // Speaker test
  const [isSpeakerPlaying, setIsSpeakerPlaying] = useState(false);
  const [supportsOutputSelection, setSupportsOutputSelection] = useState(false);

  // Refs for audio test cleanup
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const speakerTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync prop changes
  useEffect(() => {
    setCurrentInputId(selectedInputId);
  }, [selectedInputId]);

  useEffect(() => {
    setCurrentOutputId(selectedOutputId);
  }, [selectedOutputId]);

  // Stop mic test stream
  const stopMicTest = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      try {
        audioCtxRef.current.close();
      } catch (_) {}
      audioCtxRef.current = null;
    }
    setMicLevel(0);
  }, []);

  // Start mic test stream
  const startMicTest = useCallback(async (deviceId?: string) => {
    stopMicTest();
    if (!isOpen) return;

    try {
      const constraints: MediaStreamConstraints = {
        audio: deviceId ? { deviceId: { exact: deviceId } } : true,
        video: false
      };

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (fallbackErr) {
        // Fallback to any audio if exact device fails
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }

      streamRef.current = stream;
      setMicPermissionDenied(false);

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const audioCtx = new AudioCtx();
      audioCtxRef.current = audioCtx;
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.4;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateMeter = () => {
        if (!streamRef.current) return;
        analyser.getByteFrequencyData(dataArray);

        // Calculate average volume
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        // Map 0-128 to 0-100%
        const normalized = Math.min(100, Math.round((avg / 64) * 100));
        setMicLevel(normalized);

        animFrameRef.current = requestAnimationFrame(updateMeter);
      };

      updateMeter();
    } catch (err: any) {
      console.warn('Error starting mic test:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setMicPermissionDenied(true);
      }
    }
  }, [isOpen, stopMicTest]);

  // Load and enumerate devices
  const enumerateAudioDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;

    try {
      let devices = await navigator.mediaDevices.enumerateDevices();

      // Check if device labels are populated; if not, request temporary permission
      const hasLabels = devices.some(
        d => (d.kind === 'audioinput' || d.kind === 'audiooutput') && d.label.trim() !== ''
      );

      if (!hasLabels) {
        try {
          const tempStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          tempStream.getTracks().forEach(t => t.stop());
          devices = await navigator.mediaDevices.enumerateDevices();
        } catch (permErr) {
          setMicPermissionDenied(true);
        }
      }

      const inputs = devices.filter(d => d.kind === 'audioinput');
      const outputs = devices.filter(d => d.kind === 'audiooutput');

      setInputDevices(inputs);
      setOutputDevices(outputs);

      // Check setSinkId support in HTMLAudioElement
      const supportsSink = 'setSinkId' in HTMLMediaElement.prototype;
      setSupportsOutputSelection(supportsSink && outputs.length > 0);

      // Set initial input if not set or invalid
      if (!currentInputId && inputs.length > 0) {
        const defaultIn = inputs.find(d => d.deviceId === 'default') || inputs[0];
        setCurrentInputId(defaultIn.deviceId);
      }

      // Set initial output if not set or invalid
      if (!currentOutputId && outputs.length > 0) {
        const defaultOut = outputs.find(d => d.deviceId === 'default') || outputs[0];
        setCurrentOutputId(defaultOut.deviceId);
      }
    } catch (err) {
      console.error('Error enumerating devices:', err);
    }
  }, [currentInputId, currentOutputId]);

  // When modal opens/closes
  useEffect(() => {
    if (isOpen) {
      enumerateAudioDevices();
      // Only run mic test if NOT in a live call (so we don't steal the mic while talking)
      if (!isInCall) {
        startMicTest(currentInputId);
      }
    } else {
      stopMicTest();
    }

    return () => {
      stopMicTest();
      if (speakerTimeoutRef.current) clearTimeout(speakerTimeoutRef.current);
    };
  }, [isOpen, isInCall, enumerateAudioDevices, startMicTest, stopMicTest, currentInputId]);

  // Handle device change event (e.g. plugged headphones / AirPods)
  useEffect(() => {
    if (!navigator.mediaDevices?.addEventListener) return;
    const handleDeviceChange = () => {
      enumerateAudioDevices();
    };
    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
    };
  }, [enumerateAudioDevices]);

  // Handle Input change
  const handleInputChange = (deviceId: string) => {
    setCurrentInputId(deviceId);
    if (!isInCall) {
      startMicTest(deviceId);
    }
  };

  // Handle Output change
  const handleOutputChange = (deviceId: string) => {
    setCurrentOutputId(deviceId);
  };

  // Play test tone on selected output
  const playTestSpeaker = async () => {
    if (isSpeakerPlaying) return;
    setIsSpeakerPlaying(true);

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      // Check setSinkId on AudioContext if supported
      if (currentOutputId && 'setSinkId' in ctx) {
        try {
          await (ctx as any).setSinkId(currentOutputId);
        } catch (_) {}
      }

      // Play pleasant 3-tone chime: C5 (523.25), E5 (659.25), G5 (783.99)
      const notes = [
        { freq: 523.25, time: 0 },
        { freq: 659.25, time: 0.18 },
        { freq: 783.99, time: 0.36 }
      ];

      const now = ctx.currentTime;
      notes.forEach(note => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(note.freq, now + note.time);

        gain.gain.setValueAtTime(0.001, now + note.time);
        gain.gain.exponentialRampToValueAtTime(0.2, now + note.time + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + note.time + 0.3);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + note.time);
        osc.stop(now + note.time + 0.35);
      });

      speakerTimeoutRef.current = setTimeout(() => {
        setIsSpeakerPlaying(false);
        try { ctx.close(); } catch (_) {}
      }, 900);
    } catch (err) {
      console.warn('Error testing speaker:', err);
      setIsSpeakerPlaying(false);
    }
  };

  // Save and close
  const handleSave = () => {
    stopMicTest();
    onSaveDevices(currentInputId, currentOutputId);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col text-slate-100">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Headphones className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Configuración de Audio</h3>
              <p className="text-xs text-slate-400">
                Selecciona tus vías de micrófono y altavoz (Zoom / Teams / Meet)
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopMicTest();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* Permission Warning if any */}
          {micPermissionDenied && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-rose-400" />
              <div>
                <strong className="block font-semibold">Permiso de Micrófono Bloqueado</strong>
                <span>
                  Tu navegador bloqueó el acceso al micrófono. Haz clic en el ícono de candado o cámara en la barra de direcciones de tu navegador y permite el acceso al micrófono.
                </span>
              </div>
            </div>
          )}

          {/* Section 1: Microphone (Audio Input) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <Mic className="h-4 w-4 text-emerald-400" />
                <span>Micrófono (Vía de Entrada)</span>
              </label>
              <span className="text-[11px] text-slate-400">
                {inputDevices.length} dispositivo(s)
              </span>
            </div>

            <select
              value={currentInputId}
              onChange={e => handleInputChange(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700/80 text-white text-xs font-medium focus:outline-none focus:border-indigo-500 transition-colors"
            >
              {inputDevices.length === 0 ? (
                <option value="">Predeterminado del sistema</option>
              ) : (
                inputDevices.map((device, idx) => (
                  <option key={device.deviceId || idx} value={device.deviceId}>
                    {device.label || `Micrófono ${idx + 1}`}
                  </option>
                ))
              )}
            </select>

            {/* Live Mic VU Meter */}
            {!isInCall ? (
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                    <span className={`w-2 h-2 rounded-full ${micLevel > 5 ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'}`} />
                    Nivel de entrada en vivo:
                  </span>
                  <span className={`font-mono font-bold ${micLevel > 5 ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {micLevel}%
                  </span>
                </div>

                {/* Progress VU Bar */}
                <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800 p-0.5">
                  <div
                    className={`h-full rounded-full transition-all duration-75 ${
                      micLevel > 70
                        ? 'bg-gradient-to-r from-emerald-500 via-yellow-400 to-rose-500'
                        : micLevel > 15
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                        : 'bg-emerald-600/40'
                    }`}
                    style={{ width: `${Math.max(3, micLevel)}%` }}
                  />
                </div>

                <p className="text-[10px] text-slate-500 italic">
                  💡 Habla ahora frente a tu computadora o auricular. Si la barra verde se llena al hablar, tu voz se escuchará perfectamente.
                </p>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-indigo-950/20 border border-indigo-500/20 text-[11px] text-indigo-300">
                🟢 Llamada en curso: Al seleccionar un nuevo micrófono, el cambio se aplicará en tiempo real.
              </div>
            )}
          </div>

          {/* Section 2: Speakers / Headphones (Audio Output) */}
          <div className="space-y-3 pt-3 border-t border-slate-800/80">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <Volume2 className="h-4 w-4 text-cyan-400" />
                <span>Altavoces / Auriculares (Vía de Salida)</span>
              </label>
              {supportsOutputSelection && (
                <span className="text-[11px] text-slate-400">
                  {outputDevices.length} dispositivo(s)
                </span>
              )}
            </div>

            {supportsOutputSelection ? (
              <select
                value={currentOutputId}
                onChange={e => handleOutputChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700/80 text-white text-xs font-medium focus:outline-none focus:border-indigo-500 transition-colors"
              >
                {outputDevices.map((device, idx) => (
                  <option key={device.deviceId || idx} value={device.deviceId}>
                    {device.label || `Altavoz ${idx + 1}`}
                  </option>
                ))}
              </select>
            ) : (
              <div className="px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-400 text-xs">
                Altavoz predeterminado del sistema (Mac/Safari o control de SO)
              </div>
            )}

            {/* Test speaker button */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={playTestSpeaker}
                disabled={isSpeakerPlaying}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition-all hover:scale-102 active:scale-98 disabled:opacity-60"
              >
                {isSpeakerPlaying ? (
                  <>
                    <Volume2 className="h-3.5 w-3.5 text-cyan-400 animate-bounce" />
                    <span className="text-cyan-400">Reproduciendo tono...</span>
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5 text-slate-300" />
                    <span>Probar sonido de altavoz</span>
                  </>
                )}
              </button>

              <span className="text-[10px] text-slate-500">
                Verifica que escuches las 3 notas
              </span>
            </div>
          </div>

          {/* Quick tips for Mac & PC */}
          <div className="p-3.5 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 text-[11px] text-slate-300 space-y-1">
            <strong className="text-indigo-400 flex items-center gap-1.5 font-semibold">
              <Sparkles className="h-3.5 w-3.5" /> Recomendación para PC & Mac:
            </strong>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Si usas auriculares Bluetooth (AirPods, Galaxy Buds, etc.) o diadema USB, asegúrate de elegirlos tanto en la vía de Micrófono como en la de Altavoz para evitar eco durante el roleplay.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              stopMicTest();
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-950/50 transition-all hover:scale-102"
          >
            <Check className="h-4 w-4" />
            <span>Guardar Dispositivos</span>
          </button>
        </div>

      </div>
    </div>
  );
}
