import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | Blob | null;
    const conversationId = formData.get('conversationId') as string;

    if (!file || !conversationId) {
      return NextResponse.json({ error: 'Faltan parámetros requeridos (file, conversationId)' }, { status: 400 });
    }

    const token = process.env.BLOB_READ_WRITE_TOKEN || 'vercel_blob_rw_lXYhGKKGWTXJIQp0_j4iwqKaJJEy88BVAadlj42H1HNYn92';
    const filename = `recordings/${conversationId}.webm`;

    const blob = await put(filename, file, {
      access: 'public',
      token
    });

    console.log(`[Upload Recording] Call recording uploaded to Vercel Blob: ${blob.url} (convId: ${conversationId})`);

    // Update RoleplayCall in DB if already created
    await prisma.roleplayCall.updateMany({
      where: { conversationId },
      data: { callAudioUrl: blob.url }
    });

    return NextResponse.json({
      success: true,
      url: blob.url
    });
  } catch (err: any) {
    console.error('[Upload Recording Error]', err);
    return NextResponse.json({ error: err.message || 'Error al subir grabación' }, { status: 500 });
  }
}
