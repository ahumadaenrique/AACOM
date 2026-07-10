"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getAgentsProgress() {
  const session = await auth();
  if (!session?.user?.id) return { users: [], totalDaysCount: 0 };
  if (!session.user.agencyId) return { users: [], totalDaysCount: 0 };

  // Obtener usuarios de la agencia (incluyendo al Super Admin Enrique)
  const users = await prisma.user.findMany({
    where: {
      agencyId: session.user.agencyId,
      OR: [
        { role: "AGENTE" },
        { email: "enrique.ahumada@aacommx.com" }
      ]
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      developmentProgress: true,
    },
    orderBy: { name: "asc" },
  });

  const totalDaysCount = await prisma.developmentPlanDay.count({
    where: { agencyId: session.user.agencyId },
  });

  return { users, totalDaysCount };
}

export async function approveAgentDay(userId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autorizado");

  const progress = await prisma.agentDevelopmentProgress.findUnique({
    where: { userId },
  });

  if (!progress) throw new Error("Progreso no encontrado");
  if (progress.status !== "WAITING_APPROVAL") throw new Error("El agente no está esperando aprobación");

  // Avanzar al siguiente día
  await prisma.agentDevelopmentProgress.update({
    where: { userId },
    data: {
      currentDayNumber: progress.currentDayNumber + 1,
      status: "IN_PROGRESS",
    },
  });

  revalidatePath("/admin/plan-arranque/seguimiento");
  return { success: true };
}

export async function updateAgentDay(userId: string, dayNumber: number) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autorizado");

  const adminUser = await prisma.user.findUnique({
    where: { id: session.user.id }
  });
  if (adminUser?.role !== 'ADMIN' && adminUser?.role !== 'SUPER_ADMIN') {
    throw new Error("No autorizado");
  }

  await prisma.agentDevelopmentProgress.upsert({
    where: { userId },
    update: {
      currentDayNumber: dayNumber,
      status: "IN_PROGRESS",
    },
    create: {
      userId,
      currentDayNumber: dayNumber,
      status: "IN_PROGRESS",
    }
  });

  revalidatePath("/admin/plan-arranque/seguimiento");
  return { success: true };
}
