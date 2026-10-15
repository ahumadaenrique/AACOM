import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

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
      const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true, agencyId: true },
      });
      const isAdmin =
        dbUser?.role === "ADMIN" || dbUser?.role === "SUPER_ADMIN";
      const agencyId = (session.user.agencyId ||
        dbUser?.agencyId ||
        "aacom") as string;

      const existing = await prisma.policy.findFirst({
        where: isAdmin
          ? { id: policyId, agencyId }
          : { id: policyId, userId: session.user.id },
      });

      if (existing) {
        await prisma.policy.update({
          where: { id: policyId },
          data: { pdfUrl: blob.url },
        });
        revalidatePath("/cartera");
        revalidatePath("/cartera/clientes");
        if (existing.clientId) {
          revalidatePath(`/cartera/clientes/${existing.clientId}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      url: blob.url,
    });
  } catch (error: any) {
    console.error("API /api/cartera/upload-pdf error:", error);
    return NextResponse.json(
      {
        error:
          error?.message ||
          "Error al subir el PDF. Verifica que sea menor a 4.5 MB.",
      },
      { status: 500 }
    );
  }
}
