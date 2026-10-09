import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const text = searchParams.get("text");
  const questionId = searchParams.get("id");

  if (!text) {
    return NextResponse.json({ error: "Parámetro 'text' requerido" }, { status: 400 });
  }

  // Clave de ElevenLabs del sistema
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "ELEVENLABS_API_KEY no configurada", fallback: true },
      { status: 503 }
    );
  }

  // Voz mexicana profesional predeterminada de ElevenLabs
  const voiceId = process.env.ELEVENLABS_STUDY_VOICE_ID || "TNuNcwk4LzbPpi1XEANc";

  try {
    const elResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
          "Accept": "audio/mpeg"
        },
        body: JSON.stringify({
          text: text.slice(0, 1500), // Límite de seguridad
          model_id: "eleven_flash_v2_5", // Modelo más rápido y económico
          voice_settings: {
            stability: 0.55,
            similarity_boost: 0.8,
            speed: 0.98
          }
        })
      }
    );

    if (!elResponse.ok) {
      const errText = await elResponse.text();
      console.error("ElevenLabs TTS Error:", elResponse.status, errText);
      return NextResponse.json(
        { error: "Error de ElevenLabs", details: errText, fallback: true },
        { status: 502 }
      );
    }

    const audioBuffer = await elResponse.arrayBuffer();

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Audio-Source": "ElevenLabs-Flash-v2.5"
      }
    });
  } catch (err: any) {
    console.error("Error generating Cedula A audio:", err);
    return NextResponse.json(
      { error: "Error interno al sintetizar audio", fallback: true },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, questionId } = body;

    if (!text) {
      return NextResponse.json({ error: "Texto requerido" }, { status: 400 });
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "ELEVENLABS_API_KEY no configurada", fallback: true },
        { status: 503 }
      );
    }

    const voiceId = process.env.ELEVENLABS_STUDY_VOICE_ID || "TNuNcwk4LzbPpi1XEANc";

    const elResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
          "Accept": "audio/mpeg"
        },
        body: JSON.stringify({
          text: text.slice(0, 1500),
          model_id: "eleven_flash_v2_5",
          voice_settings: {
            stability: 0.55,
            similarity_boost: 0.8,
            speed: 0.98
          }
        })
      }
    );

    if (!elResponse.ok) {
      const errText = await elResponse.text();
      return NextResponse.json(
        { error: "Error de ElevenLabs", details: errText, fallback: true },
        { status: 502 }
      );
    }

    const audioBuffer = await elResponse.arrayBuffer();

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=31536000, immutable"
      }
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Error interno", fallback: true },
      { status: 500 }
    );
  }
}
