import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return new NextResponse('No autorizado', { status: 401 });
    }

    const conversationId = params.conversationId;
    if (!conversationId) {
      return new NextResponse('Falta conversationId', { status: 400 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true, agencyId: true }
    });

    if (!dbUser) {
      return new NextResponse('Usuario no encontrado', { status: 404 });
    }

    // Verify call record in database
    const call = await prisma.roleplayCall.findFirst({
      where: { conversationId },
      include: { user: { select: { id: true, agencyId: true } } }
    });

    if (!call) {
      return new NextResponse('Llamada no encontrada', { status: 404 });
    }

    // Permissions:
    // - SUPER_ADMIN: can listen to any call
    // - ADMIN: can listen to calls from their agency
    // - Regular Agent: can ONLY listen to their own calls
    const isOwner = call.userId === dbUser.id;
    const isAgencyAdmin = dbUser.role === 'ADMIN' && call.user?.agencyId === dbUser.agencyId;
    const isSuperAdmin = dbUser.role === 'SUPER_ADMIN';

    if (!isOwner && !isAgencyAdmin && !isSuperAdmin) {
      return new NextResponse('Acceso denegado: solo administradores o el autor de la llamada pueden escuchar esta grabación', { status: 403 });
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
