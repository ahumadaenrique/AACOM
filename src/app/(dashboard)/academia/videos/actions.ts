"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { extractYouTubeId, getYouTubeThumbnail } from "@/lib/youtube";

export async function getAcademyVideosData() {
  const session = await auth();
  if (!session?.user?.email) {
    return { success: false, error: "No autenticado", allowed: false, videos: [], canManage: false, agency: null };
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { agency: true }
  });

  if (!dbUser) {
    return { success: false, error: "Usuario no encontrado", allowed: false, videos: [], canManage: false, agency: null };
  }

  const isSuperAdmin = dbUser.role === "SUPER_ADMIN";
  const isAdmin = dbUser.role === "ADMIN" || isSuperAdmin;
  const userAgencyId = dbUser.agencyId || "aacom";

  const agency = dbUser.agency || (await prisma.agency.findUnique({ where: { id: userAgencyId } }));

  // Validación de acceso al módulo:
  // Super Admin siempre tiene acceso. Para el resto de promotorías, activo por defecto a menos que se restrinja explícitamente.
  const isModuleAllowed = isSuperAdmin || (agency ? (agency.allowAcademyModule ?? true) : true);

  if (!isModuleAllowed) {
    return {
      success: true,
      allowed: false,
      videos: [],
      canManage: false,
      agency: agency ? { id: agency.id, name: agency.name, slug: agency.slug } : null,
      isSuperAdmin,
    };
  }

  // Multi-Tenancy Scoping:
  // 1. Videos propios de la agencia
  // 2. Si el Super Admin activó "shareAacomAcademyVideos", también se incluyen los videos con isAacomOfficial = true
  const orConditions: any[] = [
    { agencyId: userAgencyId }
  ];

  if (agency?.shareAacomAcademyVideos && userAgencyId !== "aacom") {
    orConditions.push({ isAacomOfficial: true, active: true });
  }

  const whereClause: any = {
    OR: orConditions,
  };

  // Si es un agente regular, solo ve videos activos
  if (!isAdmin) {
    whereClause.active = true;
  }

  const videos = await prisma.academyVideo.findMany({
    where: whereClause,
    include: {
      createdBy: {
        select: { id: true, name: true, email: true }
      },
      agency: {
        select: { id: true, name: true, slug: true }
      }
    },
    orderBy: [
      { order: "asc" },
      { createdAt: "desc" }
    ]
  });

  return {
    success: true,
    allowed: true,
    videos: videos.map(v => ({
      ...v,
      isFromCurrentAgency: v.agencyId === userAgencyId,
    })),
    canManage: isAdmin,
    isSuperAdmin,
    userAgencyId,
    agency: agency ? {
      id: agency.id,
      name: agency.name,
      slug: agency.slug,
      allowAcademyModule: agency.allowAcademyModule,
      shareAacomAcademyVideos: agency.shareAacomAcademyVideos,
    } : null
  };
}

export async function createAcademyVideo(data: {
  title: string;
  youtubeUrl: string;
  category?: string;
  description?: string;
  duration?: string;
  thumbnailUrl?: string;
  isAacomOfficial?: boolean;
}) {
  const session = await auth();
  if (!session?.user?.email) throw new Error("No autenticado");

  const dbUser = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!dbUser) throw new Error("Usuario no encontrado");

  const isSuperAdmin = dbUser.role === "SUPER_ADMIN";
  const isAdmin = dbUser.role === "ADMIN" || isSuperAdmin;

  if (!isAdmin) {
    throw new Error("No tienes permisos de Administrador para subir videos.");
  }

  if (!data.title || !data.title.trim()) {
    throw new Error("El título del video es obligatorio.");
  }

  const cleanUrl = data.youtubeUrl ? data.youtubeUrl.trim() : "";
  const youtubeId = extractYouTubeId(cleanUrl);

  if (!youtubeId) {
    throw new Error(
      "⚠️ Enlace no válido. Por políticas de almacenamiento y desempeño, el video debe pertenecer forzosamente a YouTube (público u oculto). Ejemplos: https://www.youtube.com/watch?v=... o https://youtu.be/..."
    );
  }

  const userAgencyId = dbUser.agencyId || "aacom";

  // Generar thumbnail automático de YouTube si no se especificó uno personalizado
  const resolvedThumbnail = data.thumbnailUrl?.trim() || getYouTubeThumbnail(youtubeId, "hq");

  // Solo Super Admin o usuarios de la agencia AACOM pueden marcar videos como oficiales para compartir
  const canMarkOfficial = isSuperAdmin || userAgencyId === "aacom";
  const markAsOfficial = Boolean(data.isAacomOfficial && canMarkOfficial);

  const video = await prisma.academyVideo.create({
    data: {
      title: data.title.trim(),
      description: data.description?.trim() || null,
      youtubeUrl: cleanUrl,
      youtubeId,
      thumbnailUrl: resolvedThumbnail,
      category: data.category?.trim() || "General",
      duration: data.duration?.trim() || null,
      isAacomOfficial: markAsOfficial,
      agencyId: userAgencyId,
      createdById: dbUser.id,
      active: true,
    }
  });

  revalidatePath("/academia");
  revalidatePath("/academia/videos");
  return { success: true, video };
}

export async function updateAcademyVideo(
  id: string,
  data: {
    title?: string;
    youtubeUrl?: string;
    category?: string;
    description?: string;
    duration?: string;
    thumbnailUrl?: string;
    active?: boolean;
    isAacomOfficial?: boolean;
  }
) {
  const session = await auth();
  if (!session?.user?.email) throw new Error("No autenticado");

  const dbUser = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!dbUser) throw new Error("Usuario no encontrado");

  const isSuperAdmin = dbUser.role === "SUPER_ADMIN";
  const isAdmin = dbUser.role === "ADMIN" || isSuperAdmin;

  if (!isAdmin) {
    throw new Error("No tienes permisos para editar este video.");
  }

  const existing = await prisma.academyVideo.findUnique({
    where: { id },
  });

  if (!existing) throw new Error("Video no encontrado");

  // Aislamiento Multi-Inquilino: un admin regular solo puede editar videos de su propia agencia
  if (!isSuperAdmin && existing.agencyId !== dbUser.agencyId) {
    throw new Error("No tienes permisos para modificar videos de otra promotoría.");
  }

  const updateData: any = {};

  if (data.title !== undefined) updateData.title = data.title.trim();
  if (data.description !== undefined) updateData.description = data.description?.trim() || null;
  if (data.category !== undefined) updateData.category = data.category?.trim() || "General";
  if (data.duration !== undefined) updateData.duration = data.duration?.trim() || null;
  if (data.active !== undefined) updateData.active = data.active;

  if (data.youtubeUrl !== undefined) {
    const cleanUrl = data.youtubeUrl.trim();
    const youtubeId = extractYouTubeId(cleanUrl);
    if (!youtubeId) {
      throw new Error("El enlace debe ser una URL válida de YouTube.");
    }
    updateData.youtubeUrl = cleanUrl;
    updateData.youtubeId = youtubeId;
    if (!data.thumbnailUrl) {
      updateData.thumbnailUrl = getYouTubeThumbnail(youtubeId, "hq");
    }
  }

  if (data.thumbnailUrl !== undefined) {
    updateData.thumbnailUrl = data.thumbnailUrl.trim() || null;
  }

  if (data.isAacomOfficial !== undefined && (isSuperAdmin || dbUser.agencyId === "aacom")) {
    updateData.isAacomOfficial = data.isAacomOfficial;
  }

  const updated = await prisma.academyVideo.update({
    where: { id },
    data: updateData
  });

  revalidatePath("/academia");
  revalidatePath("/academia/videos");
  return { success: true, video: updated };
}

export async function deleteAcademyVideo(id: string) {
  const session = await auth();
  if (!session?.user?.email) throw new Error("No autenticado");

  const dbUser = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!dbUser) throw new Error("Usuario no encontrado");

  const isSuperAdmin = dbUser.role === "SUPER_ADMIN";
  const isAdmin = dbUser.role === "ADMIN" || isSuperAdmin;

  if (!isAdmin) {
    throw new Error("No tienes permisos para eliminar este video.");
  }

  const existing = await prisma.academyVideo.findUnique({
    where: { id },
  });

  if (!existing) throw new Error("Video no encontrado");

  // Aislamiento Multi-Inquilino
  if (!isSuperAdmin && existing.agencyId !== dbUser.agencyId) {
    throw new Error("No puedes eliminar videos de otra promotoría.");
  }

  await prisma.academyVideo.delete({
    where: { id },
  });

  revalidatePath("/academia");
  revalidatePath("/academia/videos");
  return { success: true };
}
