import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

async function linkPdfUrlToPolicy(
  userId: string,
  sessionAgencyId: string | null | undefined,
  policyId: string,
  pdfUrl: string
) {
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, agencyId: true },
  });
  const isAdmin = dbUser?.role === "ADMIN" || dbUser?.role === "SUPER_ADMIN";
  const agencyId = (sessionAgencyId || dbUser?.agencyId || "aacom") as string;

  const existing = await prisma.policy.findFirst({
    where: isAdmin ? { id: policyId, agencyId } : { id: policyId, userId },
  });

  if (existing) {
    await prisma.policy.update({
      where: { id: policyId },
      data: { pdfUrl },
    });
    revalidatePath("/cartera");
    revalidatePath("/cartera/clientes");
    if (existing.clientId) {
      revalidatePath(`/cartera/clientes/${existing.clientId}`);
    }
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const contentType = request.headers.get("content-type") || "";

    // MODO 1: JSON ligero cuando el archivo (> 3.5 MB, hasta 100 MB) ya se subió directo a Vercel Blob desde el navegador
    if (contentType.includes("application/json")) {
      const body = await request.json();
      const pdfUrl = body?.pdfUrl as string | null;
      const policyId = body?.policyId as string | null;

      if (!pdfUrl) {
        return NextResponse.json(
          { error: "No se recibió la URL del PDF" },
          { status: 400 }
        );
      }

      if (policyId) {
        await linkPdfUrlToPolicy(
          session.user.id,
          session.user.agencyId,
          policyId,
          pdfUrl
        );
      }

      return NextResponse.json({
        success: true,
        url: pdfUrl,
      });
    }

    // MODO 2: FormData directo (archivos <= 3.5 MB)
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const policyId = formData.get("policyId") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "No se recibió el archivo PDF" },
        { status: 400 }
      );
    }

    const token =
      process.env.BLOB_READ_WRITE_TOKEN ||
      process.env.BLOB_BIBLIOTECA_READ_WRITE_TOKEN ||
      "vercel_blob_rw_lXYhGKKGWTXJIQp0_j4iwqKaJJEy88BVAadlj42H1HNYn92";

    const blob = await put(
      `policies/${session.user.id}/${Date.now()}-${file.name}`,
      file,
      {
        access: "public",
        token,
      }
    );

    if (policyId) {
      await linkPdfUrlToPolicy(
        session.user.id,
        session.user.agencyId,
        policyId,
        blob.url
      );
    }

    return NextResponse.json({
      success: true,
      url: blob.url,
    });
  } catch (error: any) {
    console.error("API /api/cartera/upload-pdf error:", error);
    return NextResponse.json(
      {
        error: error?.message || "Error al subir el PDF.",
      },
      { status: 500 }
    );
  }
}
