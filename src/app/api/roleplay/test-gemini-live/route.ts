import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  if (!geminiApiKey) {
    return NextResponse.json({ 
      success: false, 
      error: 'GEMINI_API_KEY not configured in environment variables.' 
    }, { status: 500 });
  }

  const logs: string[] = [];
  const log = (msg: string) => {
    console.log(`[Test Gemini Live] ${msg}`);
    logs.push(`${new Date().toISOString().substring(11, 23)} - ${msg}`);
  };

  try {
    log(`Starting Gemini Live Diagnostic Test with key prefix: ${geminiApiKey.substring(0, 6)}... (length: ${geminiApiKey.length})`);

    const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${geminiApiKey}`;
    log(`Connecting to WebSocket: generativelanguage.googleapis.com (v1beta BidiGenerateContent)`);

    const WebSocketClass = (globalThis as any).WebSocket;
    if (!WebSocketClass) {
      throw new Error('Global WebSocket is not available in this Node runtime.');
    }

    const testResult = await new Promise<{
      success: boolean;
      events: string[];
      greetingModelAudioBytes: number;
      greetingModelText: string;
      userTurnResponseAudioBytes: number;
      userTurnResponseText: string;
      error?: string;
    }>((resolve) => {
      const ws = new WebSocketClass(wsUrl);

      let step = 'connecting';
      let greetingAudioBytes = 0;
      let greetingText = '';
      let userTurnAudioBytes = 0;
      let userTurnText = '';
      let initialTurnDone = false;
      let userTurnDone = false;

      const timeout = setTimeout(() => {
        log(`TIMEOUT reached at step: ${step}`);
        try { ws.close(); } catch (_) {}
        resolve({
          success: false,
          events: logs,
          greetingModelAudioBytes: greetingAudioBytes,
          greetingModelText: greetingText,
          userTurnResponseAudioBytes: userTurnAudioBytes,
          userTurnResponseText: userTurnText,
          error: `Test timed out at step: ${step}`
        });
      }, 18000);

      ws.onopen = () => {
        step = 'setup';
        log('WebSocket connected (OPEN). Sending BidiGenerateContent setup frame...');
        
        const setupPayload = {
          setup: {
            model: 'models/gemini-3.8-live',
            generationConfig: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName: 'Puck'
                  }
                }
              }
            },
            systemInstruction: {
              parts: [
                {
                  text: 'Eres Alfonso Junco, un prospecto de 42 años en México. Estás en una llamada telefónica real. Responde siempre en español de México de forma natural, realista y concisa (1 o 2 oraciones).'
                }
              ]
            }
          }
        };

        ws.send(JSON.stringify(setupPayload));
      };

      ws.onmessage = async (event: any) => {
        try {
          let raw = '';
          if (typeof event.data === 'string') {
            raw = event.data;
          } else if (event.data && typeof event.data.text === 'function') {
            raw = await event.data.text();
          } else if (event.data instanceof ArrayBuffer) {
            raw = new TextDecoder().decode(event.data);
          } else if (typeof Buffer !== 'undefined' && Buffer.isBuffer(event.data)) {
            raw = event.data.toString('utf8');
          } else {
            raw = String(event.data);
          }
          const json = JSON.parse(raw);

          if (json.error) {
            log(`ERROR from server: ${JSON.stringify(json.error)}`);
            clearTimeout(timeout);
            try { ws.close(); } catch (_) {}
            resolve({
              success: false,
              events: logs,
              greetingModelAudioBytes: greetingAudioBytes,
              greetingModelText: greetingText,
              userTurnResponseAudioBytes: userTurnAudioBytes,
              userTurnResponseText: userTurnText,
              error: JSON.stringify(json.error)
            });
            return;
          }

          if (json.setupComplete) {
            log('setupComplete received from Google! Initializing Phase 1 (Trigger greeting)...');
            step = 'greeting_sent';

            const triggerTurn = {
              clientContent: {
                turns: [
                  {
                    role: 'user',
                    parts: [
                      {
                        text: '[El teléfono acaba de sonar y has descolgado. Di exactamente tu saludo inicial: "¡Bueno! Sí, dígame."]'
                      }
                    ]
                  }
                ],
                turnComplete: true
              }
            };

            ws.send(JSON.stringify(triggerTurn));
            return;
          }

          // Model turn parts (audio or text)
          const modelTurn = json.serverContent?.modelTurn;
          if (modelTurn?.parts) {
            for (const part of modelTurn.parts) {
              if (part.inlineData?.data) {
                const chunkLen = part.inlineData.data.length;
                if (!initialTurnDone) {
                  greetingAudioBytes += chunkLen;
                } else {
                  userTurnAudioBytes += chunkLen;
                }
              }
              if (part.text) {
                if (!initialTurnDone) {
                  greetingText += part.text;
                } else {
                  userTurnText += part.text;
                }
              }
            }
          }

          if (json.serverContent?.interrupted) {
            log('Interruption event detected (barge-in)');
          }

          // Turn complete
          if (json.serverContent?.turnComplete) {
            if (!initialTurnDone) {
              initialTurnDone = true;
              log(`Greeting turn completed by Alfonso! (Audio Base64 bytes: ${greetingAudioBytes}, Text: "${greetingText || '(native audio)'}")`);
              log('Now sending USER TURN: "Hola Alfonso, buenas tardes, soy Enrique Ahumada de AACOM..."');
              step = 'user_turn_sent';

              const userTurn = {
                clientContent: {
                  turns: [
                    {
                      role: 'user',
                      parts: [
                        {
                          text: 'Hola Alfonso, buenas tardes, soy Enrique Ahumada de AACOM, ¿cómo te encuentras hoy?'
                        }
                      ]
                    }
                  ],
                  turnComplete: true
                }
              };

              ws.send(JSON.stringify(userTurn));
            } else {
              userTurnDone = true;
              log(`User turn response completed by Alfonso! (Audio Base64 bytes: ${userTurnAudioBytes}, Text: "${userTurnText || '(native audio)'}")`);
              clearTimeout(timeout);
              try { ws.close(); } catch (_) {}
              resolve({
                success: true,
                events: logs,
                greetingModelAudioBytes: greetingAudioBytes,
                greetingModelText: greetingText,
                userTurnResponseAudioBytes: userTurnAudioBytes,
                userTurnResponseText: userTurnText
              });
            }
          }

        } catch (e: any) {
          log(`Error parsing message: ${e?.message}`);
        }
      };

      ws.onerror = (err: any) => {
        log(`WebSocket error: ${err?.message || 'unknown error'}`);
      };

      ws.onclose = (ev: any) => {
        log(`WebSocket closed: code ${ev.code}, reason: "${ev.reason}"`);
        if (!userTurnDone && step !== 'connecting') {
          clearTimeout(timeout);
          resolve({
            success: initialTurnDone && userTurnAudioBytes > 0,
            events: logs,
            greetingModelAudioBytes: greetingAudioBytes,
            greetingModelText: greetingText,
            userTurnResponseAudioBytes: userTurnAudioBytes,
            userTurnResponseText: userTurnText,
            error: `Closed prematurely with code ${ev.code}`
          });
        }
      };
    });

    return NextResponse.json(testResult);
  } catch (err: any) {
    log(`Fatal test error: ${err?.message}`);
    return NextResponse.json({
      success: false,
      events: logs,
      error: err?.message
    }, { status: 500 });
  }
}
