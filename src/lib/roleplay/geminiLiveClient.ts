/**
 * Client-side adapter for Google Gemini Multimodal Live API (Bidirectional WebSocket)
 * Handles PCM 16kHz mic audio streaming, 24kHz PCM audio buffer playback,
 * turn-taking, barge-in echo suppression, and realtime transcripts.
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
}

export class GeminiLiveSession {
  private ws: WebSocket | null = null;
  private audioCtx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private muteGain: GainNode | null = null;
  private mediaStream: MediaStream | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private processor: ScriptProcessorNode | null = null;
  
  // Audio playback state
  private audioQueue: AudioBufferSourceNode[] = [];
  private nextPlayTime: number = 0;
  private isAiSpeaking: boolean = false;
  private currentTranscript: { source: 'ai' | 'user'; message: string }[] = [];
  private currentAiTextBuffer: string = '';

  private config: GeminiLiveSessionConfig;
  private isConnected: boolean = false;
  private isSetupComplete: boolean = false;
  private isIntentionallyClosed: boolean = false;
  private sessionId: string;

  constructor(config: GeminiLiveSessionConfig) {
    this.config = config;
    this.sessionId = 'gemini_' + Math.random().toString(36).substring(2, 11);
  }

  public async start(): Promise<void> {
    try {
      this.isIntentionallyClosed = false;

      // 1. Initialize Web Audio Context
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

      // 2. Request user microphone
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

      // 3. Connect to Gemini Live WebSocket
      this.ws = new WebSocket(this.config.wsUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        // Send setup frame FIRST, then wait for setupComplete before sending audio/input
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

  private startMicRecording(): void {
    if (!this.audioCtx || !this.mediaStream) return;

    this.micSource = this.audioCtx.createMediaStreamSource(this.mediaStream);
    // 2048 buffer size = ~42ms at 48kHz, responsive and stable
    this.processor = this.audioCtx.createScriptProcessor(2048, 1, 1);

    this.processor.onaudioprocess = (e) => {
      if (!this.isConnected || !this.isSetupComplete || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
        return;
      }

      const inputBuffer = e.inputBuffer.getChannelData(0);
      const inputRate = this.audioCtx?.sampleRate || 48000;

      // Calculate volume for UI visualizer
      let sum = 0;
      for (let i = 0; i < inputBuffer.length; i++) {
        sum += inputBuffer[i] * inputBuffer[i];
      }
      const rms = Math.sqrt(sum / inputBuffer.length);
      const isSpeaking = rms > 0.02;

      if (this.config.onUserSpeaking) {
        this.config.onUserSpeaking(isSpeaking, Math.min(1, rms * 5));
      }

      // Continuous audio streaming: stream all 16kHz PCM frames to Google without interruption
      // Google server-side Voice Activity Detection (VAD) requires continuous baseline audio to accurately detect speech onset and offset
      const pcm16 = this.downsampleTo16k(inputBuffer, inputRate);

      // Base64 encode PCM bytes
      const bytes = new Uint8Array(pcm16.buffer, pcm16.byteOffset, pcm16.byteLength);
      let binary = '';
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64Audio = btoa(binary);

      // Send realtimeInput chunk
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
        this.ws.send(JSON.stringify(mediaChunk));
      } catch (_) {}
    };

    // CRITICAL FIX: To prevent microphone feedback loop into the user's speakers
    // (which immediately triggers Google's barge-in and cuts off the prospect's voice),
    // connect the processor to a gain node of value 0 before connecting to destination.
    this.muteGain = this.audioCtx.createGain();
    this.muteGain.gain.setValueAtTime(0, this.audioCtx.currentTime);

    this.micSource.connect(this.processor);
    this.processor.connect(this.muteGain);
    this.muteGain.connect(this.audioCtx.destination);
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

        // Start mic recording now that setup is complete
        this.startMicRecording();

        // Trigger prospect's spoken greeting aloud
        const greeting = this.config.firstMessage || '¿Bueno? ¿Quién habla?';
        this.sendInitialTriggerTurn(greeting);
        return;
      }

      // 2. Interruption detection (barge-in): Gemini detected user speaking
      if (json.serverContent?.interrupted) {
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
      // Prevents RangeError when chunk length is odd
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
    this.stopAiAudioPlayback();

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
