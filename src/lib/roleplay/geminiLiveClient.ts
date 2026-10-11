/**
 * Client-side adapter for Google Gemini Multimodal Live API (Bidirectional WebSocket)
 * Handles PCM 24kHz audio playback, native speech-to-text recognition (es-MX),
 * realtime turn synchronization, and live conversational transcripts.
 */

export interface GeminiLiveSessionConfig {
  wsUrl: string;
  systemPrompt: string;
  firstMessage?: string;
  voiceName?: string; // 'Puck' | 'Charon' | 'Aoede' | 'Fenrir' | 'Kore'
  inputDeviceId?: string;
  outputDeviceId?: string;
  onConnect?: (info: { conversationId: string }) => void;
  onDisconnect?: () => void;
  onError?: (error: any) => void;
  onMessage?: (msg: { source: 'ai' | 'user'; message: string }) => void;
  onUserSpeaking?: (speaking: boolean, volume: number) => void;
  onAiSpeaking?: (speaking: boolean) => void;
  onInterimSpeech?: (interimText: string) => void;
  onMicStatus?: (status: 'listening' | 'speaking' | 'idle' | 'error', details?: string) => void;
}

export class GeminiLiveSession {
  private ws: WebSocket | null = null;
  private audioCtx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private recognition: any = null;
  private silenceTimer: any = null;
  private pendingInterimText: string = '';
  
  // Audio playback state
  private audioQueue: AudioBufferSourceNode[] = [];
  private nextPlayTime: number = 0;
  private isAiSpeaking: boolean = false;
  private currentTranscript: { source: 'ai' | 'user'; message: string }[] = [];
  private currentAiTextBuffer: string = '';

  // Fallback raw mic streaming (only used if SpeechRecognition is not supported)
  private mediaStream: MediaStream | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private processor: ScriptProcessorNode | null = null;
  private muteGain: GainNode | null = null;

  private config: GeminiLiveSessionConfig;
  private isConnected: boolean = false;
  private isSetupComplete: boolean = false;
  private isIntentionallyClosed: boolean = false;
  private isListeningActive: boolean = false;
  private sessionId: string;

  constructor(config: GeminiLiveSessionConfig) {
    this.config = config;
    this.sessionId = 'gemini_' + Math.random().toString(36).substring(2, 11);
  }

  public async start(): Promise<void> {
    try {
      this.isIntentionallyClosed = false;
      this.isListeningActive = false;

      // 1. Initialize Web Audio Context for output playback
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
      if (this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume();
      }

      // Master output gain for AI playback
      this.masterGain = this.audioCtx.createGain();
      this.masterGain.gain.setValueAtTime(1.0, this.audioCtx.currentTime);
      this.masterGain.connect(this.audioCtx.destination);

      // Support specific output device if requested and supported
      if (this.config.outputDeviceId && typeof (this.audioCtx as any).setSinkId === 'function') {
        try {
          await (this.audioCtx as any).setSinkId(this.config.outputDeviceId);
        } catch (sinkErr) {
          console.warn('[Gemini Live] setSinkId not applied:', sinkErr);
        }
      }

      // 2. Connect to Gemini Live WebSocket
      this.ws = new WebSocket(this.config.wsUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        // Step 1: Send setup frame FIRST, then wait for setupComplete before sending audio/input
        this.sendSetupFrame();
      };

      this.ws.onmessage = (event) => {
        this.handleServerMessage(event.data);
      };

      this.ws.onerror = (err) => {
        console.error('[Gemini Live WS Error]', err);
        if (this.config.onError && !this.isIntentionallyClosed) {
          this.config.onError(err);
        }
      };

      this.ws.onclose = (ev) => {
        console.log('[Gemini Live WS Closed]', ev.code, ev.reason);
        const wasReady = this.isSetupComplete;
        this.isConnected = false;
        this.isSetupComplete = false;

        // Clean close or intentional user hangup
        if (this.isIntentionallyClosed || ev.code === 1000) {
          if (this.config.onDisconnect) this.config.onDisconnect();
          return;
        }

        // If the call was already established and running, treat as disconnect
        if (wasReady) {
          if (this.config.onDisconnect) this.config.onDisconnect();
          return;
        }

        // Only report an error if it closed prematurely before setupComplete
        const msg = ev.reason || (ev.code === 1007 || ev.code === 1008
          ? `API Key o permisos de Gemini no válidos (Código ${ev.code})`
          : `La conexión con Gemini se cerró antes de iniciar (Código ${ev.code})`);

        if (this.config.onError) {
          this.config.onError(new Error(msg));
        }
      };

    } catch (err) {
      console.error('[Gemini Live start failed]', err);
      if (this.config.onError) this.config.onError(err);
      this.end();
      throw err;
    }
  }

  private sendSetupFrame(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const voice = this.config.voiceName || 'Puck';

    const setupPayload = {
      setup: {
        model: 'models/gemini-3.8-live',
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: voice
              }
            }
          }
        },
        systemInstruction: {
          parts: [
            {
              text: `${this.config.systemPrompt}
IMPORTANTE: Estás en una llamada telefónica real en México. Habla siempre en español de México con tono y modismos ejecutivos realistas. Sé conciso y directo en tus respuestas telefónicas (1 a 3 oraciones como en una llamada real). NUNCA rompas el personaje ni digas que eres una IA.`
            }
          ]
        }
      }
    };

    this.ws.send(JSON.stringify(setupPayload));
  }

  private sendInitialTriggerTurn(greeting: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    // Trigger the model to speak the greeting aloud upon connection
    const triggerTurn = {
      clientContent: {
        turns: [
          {
            role: 'user',
            parts: [
              {
                text: `[El teléfono acaba de sonar y has descolgado. Contesta la llamada en voz alta de inmediato diciendo exactamente tu saludo inicial: "${greeting}"]`
              }
            ]
          }
        ],
        turnComplete: true
      }
    };

    try {
      this.ws.send(JSON.stringify(triggerTurn));
    } catch (err) {
      console.error('[Gemini Live trigger turn error]', err);
    }
  }

  /**
   * Public method to send a user utterance (voice transcript or typed test message)
   * into the active Gemini Live session with turnComplete: true.
   */
  /**
   * Public method to send a user utterance (voice transcript or typed test message)
   * into the active Gemini Live session with turnComplete: true.
   */
  public sendUserTurn(text: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('[Gemini Live] Cannot send user turn, WebSocket is not open.');
      return;
    }

    const trimmed = text.trim();
    if (!trimmed) return;

    console.log('[Gemini Live] Sending User Turn to Model:', trimmed);

    // 1. Clear any pending interim speech display
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
    this.pendingInterimText = '';
    if (this.config.onInterimSpeech) {
      this.config.onInterimSpeech('');
    }

    // 2. Add message to local transcript and trigger onMessage callback
    const lastMsg = this.currentTranscript[this.currentTranscript.length - 1];
    if (!lastMsg || lastMsg.source !== 'user' || lastMsg.message !== trimmed) {
      this.currentTranscript.push({ source: 'user', message: trimmed });
      if (this.config.onMessage) {
        this.config.onMessage({ source: 'user', message: trimmed });
      }
    }

    // 3. Send turn over WebSocket
    const userTurn = {
      clientContent: {
        turns: [
          {
            role: 'user',
            parts: [{ text: trimmed }]
          }
        ],
        turnComplete: true
      }
    };

    try {
      this.ws.send(JSON.stringify(userTurn));
    } catch (err) {
      console.error('[Gemini Live sendUserTurn error]', err);
    }
  }

  /**
   * Starts user voice listening after Alfonso finishes greeting.
   * Uses Web Speech API for zero-collision native speech recognition (es-MX)
   * with fallback to raw PCM getUserMedia if SpeechRecognition is unavailable.
   */
  private startVoiceListening(): void {
    if (this.isListeningActive || this.isIntentionallyClosed) return;
    this.isListeningActive = true;

    const SpeechRecClass = typeof window !== 'undefined' && 
      ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

    if (SpeechRecClass) {
      this.startNativeSpeechRecognition(SpeechRecClass);
    } else {
      console.log('[Gemini Live] SpeechRecognition not supported on this browser, using raw PCM audio stream.');
      this.startRawPcmMicStream();
    }
  }

  private startNativeSpeechRecognition(SpeechRecClass: any): void {
    try {
      this.recognition = new SpeechRecClass();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'es-MX';
      this.recognition.maxAlternatives = 1;

      this.recognition.onstart = () => {
        console.log('[Gemini Live] Native Speech Recognition is listening (es-MX)...');
        if (this.config.onMicStatus) {
          this.config.onMicStatus('listening');
        }
      };

      this.recognition.onspeechstart = () => {
        if (this.config.onUserSpeaking) this.config.onUserSpeaking(true, 0.7);
        if (this.config.onMicStatus) this.config.onMicStatus('speaking');
      };

      this.recognition.onspeechend = () => {
        if (this.config.onUserSpeaking) this.config.onUserSpeaking(false, 0);
        if (this.config.onMicStatus) this.config.onMicStatus('listening');

        // If the user stopped speaking and we have a pending utterance, commit it now!
        if (this.pendingInterimText) {
          const toSend = this.pendingInterimText;
          this.pendingInterimText = '';
          if (this.silenceTimer) {
            clearTimeout(this.silenceTimer);
            this.silenceTimer = null;
          }
          this.sendUserTurn(toSend);
        }
      };

      this.recognition.onresult = (event: any) => {
        let interimText = '';
        let finalUtterance = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i];
          if (item.isFinal) {
            finalUtterance += item[0].transcript;
          } else {
            interimText += item[0].transcript;
          }
        }

        const currentText = (finalUtterance || interimText).trim();

        // Broadcast interim speech to UI for real-time visualization as user speaks
        if (currentText && this.config.onInterimSpeech) {
          this.config.onInterimSpeech(currentText);
        }

        if (interimText || finalUtterance) {
          if (this.config.onUserSpeaking) this.config.onUserSpeaking(true, 0.8);
        }

        // Barge-in: if prospect is speaking and user starts talking, interrupt prospect
        if (this.isAiSpeaking && currentText.length > 4) {
          console.log('[Gemini Live] User interrupted AI speech, stopping playback.');
          this.stopAiAudioPlayback();
          if (this.config.onAiSpeaking) this.config.onAiSpeaking(false);
        }

        // If recognizer gave a final utterance, commit immediately
        if (finalUtterance.trim()) {
          this.pendingInterimText = '';
          if (this.silenceTimer) {
            clearTimeout(this.silenceTimer);
            this.silenceTimer = null;
          }
          this.sendUserTurn(finalUtterance.trim());
        } else if (interimText.trim()) {
          // If only interim text, store it and set silence debounce timer (1100ms)
          this.pendingInterimText = interimText.trim();
          if (this.silenceTimer) clearTimeout(this.silenceTimer);
          this.silenceTimer = setTimeout(() => {
            if (this.pendingInterimText) {
              const toSend = this.pendingInterimText;
              this.pendingInterimText = '';
              this.sendUserTurn(toSend);
            }
          }, 1100);
        }
      };

      this.recognition.onerror = (err: any) => {
        if (err.error !== 'no-speech' && err.error !== 'aborted') {
          console.warn('[Gemini Live SpeechRecognition Error]:', err.error);
        }
        if (err.error === 'not-allowed') {
          if (this.config.onMicStatus) {
            this.config.onMicStatus('error', 'Permiso de micrófono no otorgado en el navegador.');
          }
        } else if (err.error === 'audio-capture') {
          if (this.config.onMicStatus) {
            this.config.onMicStatus('error', 'No se detecta señal en tu micrófono. Revisa tu dispositivo.');
          }
        }
      };

      this.recognition.onend = () => {
        if (this.config.onUserSpeaking) this.config.onUserSpeaking(false, 0);

        // If there was any pending uncommitted speech, commit it
        if (this.pendingInterimText) {
          const toSend = this.pendingInterimText;
          this.pendingInterimText = '';
          if (this.silenceTimer) {
            clearTimeout(this.silenceTimer);
            this.silenceTimer = null;
          }
          this.sendUserTurn(toSend);
        }

        // Automatically restart speech recognition while call is active
        if (this.isConnected && !this.isIntentionallyClosed && this.isListeningActive) {
          try {
            setTimeout(() => {
              if (this.isConnected && !this.isIntentionallyClosed && this.isListeningActive) {
                this.recognition?.start();
              }
            }, 120);
          } catch (_) {}
        }
      };

      this.recognition.start();
    } catch (e) {
      console.warn('[Gemini Live] Failed to start native SpeechRecognition, falling back to raw PCM:', e);
      this.startRawPcmMicStream();
    }
  }

  private async startRawPcmMicStream(): Promise<void> {
    if (!this.audioCtx) return;

    try {
      const micConstraints: MediaStreamConstraints = {
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          ...(this.config.inputDeviceId ? { deviceId: { exact: this.config.inputDeviceId } } : {})
        }
      };
      this.mediaStream = await navigator.mediaDevices.getUserMedia(micConstraints);
      this.micSource = this.audioCtx.createMediaStreamSource(this.mediaStream);
      this.processor = this.audioCtx.createScriptProcessor(2048, 1, 1);

      this.processor.onaudioprocess = (e) => {
        if (!this.isConnected || !this.isSetupComplete || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
          return;
        }

        const inputBuffer = e.inputBuffer.getChannelData(0);
        const inputRate = this.audioCtx?.sampleRate || 48000;

        let sum = 0;
        for (let i = 0; i < inputBuffer.length; i++) {
          sum += inputBuffer[i] * inputBuffer[i];
        }
        const rms = Math.sqrt(sum / inputBuffer.length);
        const isSpeaking = rms > 0.02;

        if (this.config.onUserSpeaking) {
          this.config.onUserSpeaking(isSpeaking, Math.min(1, rms * 5));
        }

        const pcm16 = this.downsampleTo16k(inputBuffer, inputRate);
        const bytes = new Uint8Array(pcm16.buffer, pcm16.byteOffset, pcm16.byteLength);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64Audio = btoa(binary);

        const mediaChunk = {
          realtimeInput: {
            mediaChunks: [
              {
                mimeType: 'audio/pcm;rate=16000',
                data: base64Audio
              }
            ]
          }
        };

        try {
          this.ws?.send(JSON.stringify(mediaChunk));
        } catch (_) {}
      };

      this.muteGain = this.audioCtx.createGain();
      this.muteGain.gain.setValueAtTime(0, this.audioCtx.currentTime);

      this.micSource.connect(this.processor);
      this.processor.connect(this.muteGain);
      this.muteGain.connect(this.audioCtx.destination);
    } catch (err) {
      console.error('[Gemini Live startRawPcmMicStream error]', err);
    }
  }

  private downsampleTo16k(input: Float32Array, inputRate: number): Int16Array {
    if (inputRate === 16000) {
      const pcm16 = new Int16Array(input.length);
      for (let i = 0; i < input.length; i++) {
        const s = Math.max(-1, Math.min(1, input[i]));
        pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }
      return pcm16;
    }

    const ratio = inputRate / 16000;
    const newLength = Math.floor(input.length / ratio);
    const pcm16 = new Int16Array(newLength);

    for (let i = 0; i < newLength; i++) {
      const originIndex = i * ratio;
      const indexFloor = Math.floor(originIndex);
      const indexCeil = Math.min(input.length - 1, indexFloor + 1);
      const fraction = originIndex - indexFloor;
      const sample = (input[indexFloor] || 0) * (1 - fraction) + (input[indexCeil] || 0) * fraction;
      const s = Math.max(-1, Math.min(1, sample));
      pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }

    return pcm16;
  }

  private async handleServerMessage(data: any): Promise<void> {
    try {
      let rawText = '';
      if (typeof data === 'string') {
        rawText = data;
      } else if (data instanceof Blob) {
        rawText = await data.text();
      } else if (data instanceof ArrayBuffer) {
        rawText = new TextDecoder().decode(data);
      } else {
        return;
      }

      let json: any;
      try {
        json = JSON.parse(rawText);
      } catch (parseErr) {
        console.warn('[Gemini Live] Message parse error, rawText:', rawText, parseErr);
        return;
      }

      // Check for errors
      if (json.error) {
        console.error('[Gemini Live Server Error]', json.error);
        if (this.config.onError && !this.isIntentionallyClosed) {
          this.config.onError(json.error);
        }
        return;
      }

      // 1. Setup complete handshake acknowledgment
      if (json.setupComplete) {
        console.log('[Gemini Live] Setup complete acknowledged by server! Answering call...');
        this.isSetupComplete = true;

        if (this.config.onConnect) {
          this.config.onConnect({ conversationId: this.sessionId });
        }

        // Trigger prospect's spoken greeting FIRST.
        // Voice listening starts cleanly after Alfonso finishes greeting.
        const greeting = this.config.firstMessage || '¿Bueno? ¿Quién habla?';
        this.sendInitialTriggerTurn(greeting);
        return;
      }

      // 2. Interruption detection (barge-in): Gemini detected user speaking
      if (json.serverContent?.interrupted) {
        console.log('[Gemini Live] Interruption detected (barge-in)!');
        this.stopAiAudioPlayback();
        if (this.config.onAiSpeaking) this.config.onAiSpeaking(false);
        return;
      }

      // 3. Model Turn: Audio output & text transcripts
      const modelTurn = json.serverContent?.modelTurn;
      if (modelTurn?.parts) {
        for (const part of modelTurn.parts) {
          // A. Audio Chunk
          if (part.inlineData && part.inlineData.mimeType?.includes('audio/pcm')) {
            const rawBase64 = part.inlineData.data;
            this.playPcmAudioChunk(rawBase64);
          }

          // B. Text Transcript from model
          if (part.text) {
            this.currentAiTextBuffer += part.text;
          }
        }
      }

      // 4. Turn complete
      if (json.serverContent?.turnComplete) {
        console.log('[Gemini Live] Model turn complete.');
        let aiText = this.currentAiTextBuffer.trim();

        // If turn ended without explicit text part (native audio mode), fallback to firstMessage or recorded prompt
        if (!aiText && this.currentTranscript.length === 0) {
          aiText = this.config.firstMessage || '¿Bueno? ¿Quién habla?';
        }

        if (aiText) {
          this.currentTranscript.push({ source: 'ai', message: aiText });
          if (this.config.onMessage) {
            this.config.onMessage({ source: 'ai', message: aiText });
          }
        }
        this.currentAiTextBuffer = '';

        // Start listening to user voice once initial greeting turn has completed!
        if (!this.isListeningActive) {
          this.startVoiceListening();
        }
      }

    } catch (err) {
      console.error('[Gemini Live Parse Error]', err);
    }
  }

  private playPcmAudioChunk(base64Pcm: string): void {
    if (!this.audioCtx) return;

    try {
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }

      const binaryStr = atob(base64Pcm);
      const byteLen = binaryStr.length;
      if (byteLen < 2) return;

      const bytes = new Uint8Array(byteLen);
      for (let i = 0; i < byteLen; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }

      // Safe 16-bit PCM little-endian conversion using DataView
      const sampleCount = Math.floor(byteLen / 2);
      const dataView = new DataView(bytes.buffer, bytes.byteOffset, sampleCount * 2);
      const audioBuffer = this.audioCtx.createBuffer(1, sampleCount, 24000);
      const channelData = audioBuffer.getChannelData(0);

      for (let i = 0; i < sampleCount; i++) {
        const int16 = dataView.getInt16(i * 2, true);
        channelData[i] = int16 / 32768.0;
      }

      const sourceNode = this.audioCtx.createBufferSource();
      sourceNode.buffer = audioBuffer;
      sourceNode.connect(this.masterGain || this.audioCtx.destination);

      const currentTime = this.audioCtx.currentTime;
      if (this.nextPlayTime < currentTime) {
        this.nextPlayTime = currentTime;
      }

      sourceNode.start(this.nextPlayTime);
      this.nextPlayTime += audioBuffer.duration;

      this.audioQueue.push(sourceNode);

      if (!this.isAiSpeaking) {
        this.isAiSpeaking = true;
        if (this.config.onAiSpeaking) this.config.onAiSpeaking(true);
      }

      sourceNode.onended = () => {
        const idx = this.audioQueue.indexOf(sourceNode);
        if (idx !== -1) this.audioQueue.splice(idx, 1);
        if (this.audioQueue.length === 0) {
          this.isAiSpeaking = false;
          if (this.config.onAiSpeaking) this.config.onAiSpeaking(false);
        }
      };

    } catch (err) {
      console.error('[Play PCM Audio Chunk Error]', err);
    }
  }

  private stopAiAudioPlayback(): void {
    for (const node of this.audioQueue) {
      try { node.stop(); } catch (_) {}
    }
    this.audioQueue = [];
    if (this.audioCtx) {
      this.nextPlayTime = this.audioCtx.currentTime;
    }
    this.isAiSpeaking = false;
  }

  public end(): void {
    this.isIntentionallyClosed = true;
    this.isListeningActive = false;
    this.stopAiAudioPlayback();

    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
    this.pendingInterimText = '';

    if (this.recognition) {
      try { this.recognition.stop(); } catch (_) {}
      this.recognition = null;
    }

    if (this.processor) {
      try { this.processor.disconnect(); } catch (_) {}
      this.processor = null;
    }

    if (this.muteGain) {
      try { this.muteGain.disconnect(); } catch (_) {}
      this.muteGain = null;
    }

    if (this.micSource) {
      try { this.micSource.disconnect(); } catch (_) {}
      this.micSource = null;
    }

    if (this.masterGain) {
      try { this.masterGain.disconnect(); } catch (_) {}
      this.masterGain = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }

    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      try { this.audioCtx.close(); } catch (_) {}
      this.audioCtx = null;
    }

    if (this.ws) {
      try { this.ws.close(); } catch (_) {}
      this.ws = null;
    }

    this.isConnected = false;
    this.isSetupComplete = false;
  }

  public getTranscript(): { source: 'ai' | 'user'; message: string }[] {
    return this.currentTranscript;
  }
}
