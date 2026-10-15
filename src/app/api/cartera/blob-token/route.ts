import { generateClientTokenFromReadWriteToken } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const rawName = String(body?.filename || "poliza.pdf").replace(
      /[^a-zA-Z0-9._-]/g,
      "_"
    );

    const token =
      process.env.BLOB_READ_WRITE_TOKEN ||
      process.env.BLOB_BIBLIOTECA_READ_WRITE_TOKEN ||
      "vercel_blob_rw_lXYhGKKGWTXJIQp0_j4iwqKaJJEy88BVAadlj42H1HNYn92";

    const pathname = `policies/${session.user.id}/${Date.now()}-${rawName}`;

    const clientToken = await generateClientTokenFromReadWriteToken({
      pathname,
      token,
      maximumSizeInBytes: 100 * 1024 * 1024, // Hasta 100 MB
      allowedContentTypes: ["application/pdf"],
    });

    return NextResponse.json({ clientToken, pathname });
  } catch (error: any) {
    console.error("Error generating cartera blob token:", error);
    return NextResponse.json(
      { error: error?.message || "No se pudo generar token de subida" },
      { status: 500 }
    );
  }
}
