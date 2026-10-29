import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email && !session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    let userId = session.user.id;
    if (!userId && session.user.email) {
      const u = await prisma.user.findFirst({
        where: { email: { equals: session.user.email.trim(), mode: 'insensitive' } },
        select: { id: true, role: true }
      });
      if (u?.role === 'REFERIDOR') {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
      }
      if (u) userId = u.id;
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | Blob | null;
    const conversationId = formData.get('conversationId') as string;

    if (!file || !conversationId) {
      return NextResponse.json({ error: 'Faltan parámetros requeridos (file, conversationId)' }, { status: 400 });
    }

    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      return NextResponse.json({ error: 'Configuración de almacenamiento incompleta (BLOB_READ_WRITE_TOKEN)' }, { status: 500 });
    }

    const safeConvId = conversationId.replace(/[^a-zA-Z0-9_-]/g, '');
    const isMp4 = (file.type && file.type.toLowerCase().includes('mp4')) || ((file as any).name && String((file as any).name).endsWith('.mp4'));
    const ext = isMp4 ? 'mp4' : 'webm';
    const contentType = file.type || (isMp4 ? 'audio/mp4' : 'audio/webm');
    const filename = `recordings/${safeConvId}.${ext}`;

    const blob = await put(filename, file, {
      access: 'public',
      contentType,
      token
    });

    console.log(`[Upload Recording] Call recording uploaded to Vercel Blob: ${blob.url} (convId: ${safeConvId})`);

    // Update RoleplayCall in DB scoped to the authenticated user
    await prisma.roleplayCall.updateMany({
      where: userId ? { conversationId, userId } : { conversationId },
      data: { callAudioUrl: blob.url }
    });

    return NextResponse.json({
      success: true,
      url: blob.url
    });
  } catch (err: any) {
    console.error('[Upload Recording Error]:', err);
    return NextResponse.json({ error: err?.message || 'Error subiendo grabación' }, { status: 500 });
  }
}
