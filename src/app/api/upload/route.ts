import { handleUpload } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function POST(request: Request) {
  const body = await request.json();

  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN || "vercel_blob_rw_lXYhGKKGWTXJIQp0_j4iwqKaJJEy88BVAadlj42H1HNYn92";

    const jsonResponse = await handleUpload({
      body,
      request,
      token, // <-- pass token here!
      onBeforeGenerateToken: async (pathname) => {
        const session = await auth();
        if (!session?.user?.id || !session.user.agencyId) {
          throw new Error("No autorizado");
        }

        return {
          allowedContentTypes: [
            'application/pdf', 
            'application/vnd.ms-powerpoint', 
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          ],
          tokenPayload: JSON.stringify({
            agencyId: session.user.agencyId,
          }),
          maximumSizeInBytes: 50 * 1024 * 1024,
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // Here we could update the database, but we do it on the client after upload finishes.
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error: any) {
    console.error("Upload API Error:", error);
    return NextResponse.json(
      { error: error.message || "Error al generar token de Vercel Blob" },
      { status: 400 } // <-- Return 400 so Vercel Blob client throws immediately instead of retrying 10 times.
    );
  }
}

