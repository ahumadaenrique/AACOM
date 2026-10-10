/**
 * Client-side adapter for Google Gemini Multimodal Live API (Bidirectional WebSocket)
 * Handles PCM 16kHz mic audio streaming, 24kHz PCM audio buffer playback,
 * turn-taking, interruption handling (barge-in), and realtime transcripts.
 */

export interface GeminiLiveSessionConfig {
  wsUrl: string;
  systemPrompt: string;
  firstMessage?: string;
  voiceName?: string; // 'Puck' | 'Charon' | 'Aoede' | 'Fenrir' | 'Kore'
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
  private sessionId: string;

  constructor(config: GeminiLiveSessionConfig) {
    this.config = config;
    this.sessionId = 'gemini_' + Math.random().toString(36).substring(2, 11);
  }

  public async start(): Promise<void> {
    try {
      // 1. Initialize Web Audio Context
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
      if (this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume();
      }

      // 2. Request user microphone
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // 3. Connect to Gemini Live WebSocket
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
        if (this.config.onError) this.config.onError(err);
      };

      this.ws.onclose = (ev) => {
        console.log('[Gemini Live WS Closed]', ev.code, ev.reason);
        const wasReady = this.isSetupComplete;
        this.isConnected = false;
        this.isSetupComplete = false;

        if (!wasReady) {
          const msg = ev.reason || (ev.code === 1007 || ev.code === 1008 ? 'API Key de Gemini no válida o rechazada por Google (Código ' + ev.code + ')' : 'La conexión con Gemini se cerró antes de iniciar (Código ' + ev.code + ')');
          if (this.config.onError) this.config.onError(new Error(msg));
        } else {
          if (this.config.onDisconnect) this.config.onDisconnect();
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
IMPORTANTE: Estás en una llamada telefónica real en México. Habla siempre en español mexicano con tono y modismos ejecutivos realistas. Sé conciso y directo en tus respuestas telefónicas (1 a 3 oraciones como en una llamada real). NUNCA rompas el personaje ni digas que eres una IA.`
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

      // Downsample input from browser native rate (44.1k/48k) to exactly 16kHz PCM
      const pcm16 = this.downsampleTo16k(inputBuffer, inputRate);

      // Base64 encode PCM bytes
      const bytes = new Uint8Array(pcm16.buffer);
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

    this.micSource.connect(this.processor);
    this.processor.connect(this.audioCtx.destination);
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
    const newLength = Math.round(input.length / ratio);
    const pcm16 = new Int16Array(newLength);

    for (let i = 0; i < newLength; i++) {
      const originIndex = i * ratio;
      const indexFloor = Math.floor(originIndex);
      const indexCeil = Math.min(input.length - 1, indexFloor + 1);
      const fraction = originIndex - indexFloor;
      const sample = input[indexFloor] * (1 - fraction) + input[indexCeil] * fraction;
      const s = Math.max(-1, Math.min(1, sample));
      pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }

    return pcm16;
  }

  private handleServerMessage(data: any): void {
    try {
      let json: any;
      if (typeof data === 'string') {
        json = JSON.parse(data);
      } else {
        return;
      }

      // Check for errors
      if (json.error) {
        console.error('[Gemini Live Server Error]', json.error);
        if (this.config.onError) this.config.onError(json.error);
        return;
      }

      // 1. Setup complete handshake acknowledgment
      if (json.setupComplete) {
        console.log('[Gemini Live] Setup complete acknowledged by server.');
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
      const binaryStr = atob(base64Pcm);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }

      // Gemini Live outputs 16-bit PCM at 24kHz
      const pcm16 = new Int16Array(bytes.buffer);
      const audioBuffer = this.audioCtx.createBuffer(1, pcm16.length, 24000);
      const channelData = audioBuffer.getChannelData(0);

      for (let i = 0; i < pcm16.length; i++) {
        channelData[i] = pcm16[i] / 32768.0;
      }

      const sourceNode = this.audioCtx.createBufferSource();
      sourceNode.buffer = audioBuffer;
      sourceNode.connect(this.audioCtx.destination);

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
    this.stopAiAudioPlayback();

    if (this.processor) {
      try { this.processor.disconnect(); } catch (_) {}
      this.processor = null;
    }

    if (this.micSource) {
      try { this.micSource.disconnect(); } catch (_) {}
      this.micSource = null;
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
