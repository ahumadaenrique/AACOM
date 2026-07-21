import { generateClientTokenFromReadWriteToken } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    if (!session.user.agencyId) return NextResponse.json({ error: "Sin agencia asignada" }, { status: 403 });

    const filename = new URL(request.url).searchParams.get("filename") || "archivo";

    const token = process.env.BLOB_BIBLIOTECA_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN || "vercel_blob_rw_lXYhGKKGWTXJIQp0_j4iwqKaJJEy88BVAadlj42H1HNYn92";
    const blobPathname = `agency_${session.user.agencyId}/${Date.now()}_${filename}`;

    const clientToken = await generateClientTokenFromReadWriteToken({
      pathname: blobPathname,
      token: token,
      maximumSizeInBytes: 80 * 1024 * 1024, // 80MB
      allowedContentTypes: [
        'application/pdf', 
        'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ],
    });

    return NextResponse.json({ clientToken, pathname: blobPathname });
  } catch (error: any) {
    console.error("Upload Agency Doc API Error:", error);
    return NextResponse.json({ error: error.message || "Error al generar token de Vercel Blob" }, { status: 500 });
  }
}
