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

    const contentType = request.headers.get("content-type") || "";

    // MODO 1: JSON ligero cuando el archivo (> 3.5 MB, hasta 100 MB) ya se subió directo a Vercel Blob
    if (contentType.includes("application/json")) {
      const body = await request.json();
      const pdfUrl = body?.pdfUrl as string | null;
      const fileName = (body?.fileName as string) || "poliza.pdf";

      if (!pdfUrl) {
        return NextResponse.json(
          { error: "No se recibió la URL del PDF." },
          { status: 400 }
        );
      }

      // Descargar de servidor a servidor (sin límite de 4.5 MB de request entrante)
      const fileRes = await fetch(pdfUrl);
      if (!fileRes.ok) {
        throw new Error("No se pudo descargar el PDF almacenado para su lectura.");
      }
      const arrayBuffer = await fileRes.arrayBuffer();
      const base64Pdf = Buffer.from(arrayBuffer).toString("base64");

      const extracted = await extractPolicyWithGeminiFromPdfBase64(
        base64Pdf,
        fileName
      );

      return NextResponse.json({
        success: true,
        extracted,
        pdfUrl,
      });
    }

    // MODO 2: FormData directo (archivos <= 3.5 MB o fragmento de carátula optimizado)
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const preUploadedUrl = formData.get("pdfUrl") as string | null;
    const originalFileName =
      (formData.get("fileName") as string) || file?.name || "poliza.pdf";

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
      process.env.BLOB_BIBLIOTECA_READ_WRITE_TOKEN ||
      "vercel_blob_rw_lXYhGKKGWTXJIQp0_j4iwqKaJJEy88BVAadlj42H1HNYn92";

    const uploadPromise = preUploadedUrl
      ? Promise.resolve({ url: preUploadedUrl })
      : put(`policies/${session.user.id}/${Date.now()}-${originalFileName}`, file, {
          access: "public",
          token: blobToken,
        });

    const [blobResult, extractResult] = await Promise.allSettled([
      uploadPromise,
      extractPolicyWithGeminiFromPdfBase64(base64Pdf, originalFileName),
    ]);

    const pdfUrl =
      preUploadedUrl ||
      (blobResult.status === "fulfilled" ? blobResult.value.url : null);

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
          "Error al procesar el archivo PDF.",
      },
      { status: 500 }
    );
  }
}
