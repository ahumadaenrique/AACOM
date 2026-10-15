import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { put } from "@vercel/blob";
import { extractPolicyWithGeminiFromPdfBase64 } from "@/app/(dashboard)/cartera/pdfExtractorAi";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Sesión expirada. Por favor recarga la página." },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json(
        { error: "No se recibió ningún archivo PDF." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64Pdf = Buffer.from(arrayBuffer).toString("base64");

    const blobToken =
      process.env.BLOB_READ_WRITE_TOKEN ||
      "vercel_blob_rw_lXYhGKKGWTXJIQp0_j4iwqKaJJEy88BVAadlj42H1HNYn92";

    // Ejecutar subida a Vercel Blob y extracción IA en paralelo para máxima velocidad
    const [blobResult, extractResult] = await Promise.allSettled([
      put(`policies/${session.user.id}/${Date.now()}-${file.name}`, file, {
        access: "public",
        token: blobToken,
      }),
      extractPolicyWithGeminiFromPdfBase64(base64Pdf, file.name),
    ]);

    const pdfUrl =
      blobResult.status === "fulfilled" ? blobResult.value.url : null;

    if (extractResult.status === "rejected") {
      return NextResponse.json(
        {
          error:
            extractResult.reason?.message ||
            "No se pudo analizar la carátula PDF.",
          pdfUrl,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      extracted: extractResult.value,
      pdfUrl,
    });
  } catch (error: any) {
    console.error("API /api/cartera/extract-pdf error:", error);
    return NextResponse.json(
      {
        error:
          error?.message ||
          "Error al procesar el archivo PDF. Verifica que el archivo sea menor a 4.5 MB.",
      },
      { status: 500 }
    );
  }
}
