import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id && !session?.user?.email) {
      return new NextResponse('No autorizado', { status: 401 });
    }

    const conversationId = params.conversationId;
    if (!conversationId) {
      return new NextResponse('Falta conversationId', { status: 400 });
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return new NextResponse('ELEVENLABS_API_KEY no configurada', { status: 500 });
    }

    // Call ElevenLabs endpoint for conversation audio
    const elevenResp = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversations/${conversationId}/audio`,
      {
        headers: {
          'xi-api-key': apiKey
        }
      }
    );

    if (!elevenResp.ok) {
      const errText = await elevenResp.text();
      console.warn(`ElevenLabs audio not ready for ${conversationId}:`, errText);
      return new NextResponse('Grabación no disponible aún o procesándose', { status: 404 });
    }

    const audioBuffer = await elevenResp.arrayBuffer();

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=86400, immutable'
      }
    });
  } catch (error: any) {
    console.error('Error fetching conversation audio:', error);
    return new NextResponse(error.message || 'Error al obtener audio', { status: 500 });
  }
}
