import { generateClientTokenFromReadWriteToken } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    if (!session.user.agencyId) return NextResponse.json({ error: "Sin agencia asignada" }, { status: 403 });

    const filename = new URL(request.url).searchParams.get("filename") || "archivo";

    const token = process.env.BLOB_READ_WRITE_TOKEN || "vercel_blob_rw_lXYhGKKGWTXJIQp0_j4iwqKaJJEy88BVAadlj42H1HNYn92";
    const blobPathname = `plan-arranque/${session.user.agencyId}/${Date.now()}-${filename}`;

    const clientToken = await generateClientTokenFromReadWriteToken({
      pathname: blobPathname,
      token: token,
      maximumSizeInBytes: 50 * 1024 * 1024, // 50MB
      allowedContentTypes: [
        'application/pdf', 
        'application/vnd.ms-powerpoint', 
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ],
    });

    return NextResponse.json({ clientToken, pathname: blobPathname });
  } catch (error: any) {
    console.error("Upload API Error:", error);
    return NextResponse.json({ error: error.message || "Error al generar token de Vercel Blob" }, { status: 500 });
  }
}


