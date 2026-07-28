"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { put, del } from "@vercel/blob";

export async function getDays() {
  const session = await auth();
  if (!session?.user?.id) return [];
  if (!session.user.agencyId) return [];

  return await prisma.developmentPlanDay.findMany({
    where: { agencyId: session.user.agencyId },
    orderBy: { dayNumber: "asc" },
  });
}

export async function createDay(data: any) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autorizado");
  if (!session.user.agencyId) throw new Error("Sin agencia asignada");

  const day = await prisma.developmentPlanDay.create({
    data: {
      agencyId: session.user.agencyId,
      dayNumber: parseInt(data.dayNumber),
      title: data.title,
      instructions: data.instructions || null,
      videoUrl: data.videoUrl || null,
      fileUrl: data.fileUrl || null,
      fileName: data.fileName || null,
      additionalMediaJson: data.additionalMediaJson || null,
      requiresAdminApproval: data.requiresAdminApproval || false,
      hasQuestionnaire: data.hasQuestionnaire || false,
      questionnaireJson: data.questionnaireJson || null,
      minPassingScore: data.minPassingScore || 80,
    },
  });

  revalidatePath("/admin/plan-arranque");
  revalidatePath("/plan-arranque");
  return day;
}

export async function updateDay(id: string, data: any) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autorizado");
  if (!session.user.agencyId) throw new Error("Sin agencia asignada");

  const existing = await prisma.developmentPlanDay.findFirst({
    where: { id, agencyId: session.user.agencyId },
  });
  if (!existing) throw new Error("Día no encontrado");

  const day = await prisma.developmentPlanDay.update({
    where: { id },
    data: {
      dayNumber: parseInt(data.dayNumber),
      title: data.title,
      instructions: data.instructions || null,
      videoUrl: data.videoUrl || null,
      fileUrl: data.fileUrl !== undefined ? data.fileUrl : existing.fileUrl,
      fileName: data.fileName !== undefined ? data.fileName : existing.fileName,
      additionalMediaJson: data.additionalMediaJson !== undefined ? data.additionalMediaJson : existing.additionalMediaJson,
      requiresAdminApproval: data.requiresAdminApproval !== undefined ? data.requiresAdminApproval : existing.requiresAdminApproval,
      hasQuestionnaire: data.hasQuestionnaire !== undefined ? data.hasQuestionnaire : existing.hasQuestionnaire,
      questionnaireJson: data.questionnaireJson !== undefined ? data.questionnaireJson : existing.questionnaireJson,
      minPassingScore: data.minPassingScore !== undefined ? data.minPassingScore : existing.minPassingScore,
    },
  });

  revalidatePath("/admin/plan-arranque");
  revalidatePath("/plan-arranque");
  return day;
}

export async function deleteDay(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autorizado");
  if (!session.user.agencyId) throw new Error("Sin agencia asignada");

  const existing = await prisma.developmentPlanDay.findFirst({
    where: { id, agencyId: session.user.agencyId },
  });
  if (!existing) throw new Error("Día no encontrado");

  if (existing.fileUrl) {
    try {
      await del(existing.fileUrl);
    } catch (e) {
      console.error("Failed to delete blob", e);
    }
  }

  await prisma.developmentPlanDay.delete({
    where: { id },
  });

  revalidatePath("/admin/plan-arranque");
  revalidatePath("/plan-arranque");
  return { success: true };
}

export async function reorderModule(id: string, direction: "up" | "down") {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autorizado");
  if (!session.user.agencyId) throw new Error("Sin agencia asignada");

  const agencyId = session.user.agencyId;

  // Get current module
  const currentModule = await prisma.developmentPlanDay.findUnique({
    where: { id },
  });

  if (!currentModule || currentModule.agencyId !== agencyId) {
    throw new Error("Módulo no encontrado");
  }

  // Get the target module to swap with
  const targetModule = await prisma.developmentPlanDay.findFirst({
    where: {
      agencyId,
      dayNumber: direction === "up" 
        ? { lt: currentModule.dayNumber }
        : { gt: currentModule.dayNumber }
    },
    orderBy: {
      dayNumber: direction === "up" ? "desc" : "asc"
    }
  });

  if (!targetModule) {
    // Already at the very top or bottom, nothing to do
    return { success: false, message: "No se puede mover más" };
  }

  // Swap their dayNumbers safely avoiding unique constraint collision
  await prisma.$transaction([
    // 1. Temporarily move current out of the way
    prisma.developmentPlanDay.update({
      where: { id: currentModule.id },
      data: { dayNumber: -1 }
    }),
    // 2. Move target to current's old position
    prisma.developmentPlanDay.update({
      where: { id: targetModule.id },
      data: { dayNumber: currentModule.dayNumber }
    }),
    // 3. Move current to target's old position
    prisma.developmentPlanDay.update({
      where: { id: currentModule.id },
      data: { dayNumber: targetModule.dayNumber }
    })
  ]);

  revalidatePath("/admin/plan-arranque");
  revalidatePath("/plan-arranque");
  return { success: true };
}

export async function uploadPlanFile(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: "No autorizado" };
    if (!session.user.agencyId) return { error: "Sin agencia asignada" };

    const file = formData.get("file") as File;
    if (!file) return { error: "No se proporcionó archivo" };

    // Limite de 10 MB
    if (file.size > 10 * 1024 * 1024) {
      return { error: "El archivo excede el límite de 10MB" };
    }

    const token = process.env.BLOB_READ_WRITE_TOKEN || "vercel_blob_rw_lXYhGKKGWTXJIQp0_j4iwqKaJJEy88BVAadlj42H1HNYn92";

    const blob = await put(`plan-arranque/${session.user.agencyId}/${Date.now()}-${file.name}`, file, {
      access: "public",
      token: token,
    });

    return { success: true, url: blob.url, fileName: file.name };
  } catch (error: any) {
    console.error("Vercel Blob Upload Error:", error);
    return { error: error.message || "Error al subir a Vercel Blob" };
  }
}
