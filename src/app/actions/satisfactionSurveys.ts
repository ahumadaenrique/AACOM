'use server';

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { SurveyReferralInput, CreateSurveyInput, REFERRAL_STATUSES } from "@/lib/satisfactionConstants";
export type { SurveyReferralInput, CreateSurveyInput };

export async function createSatisfactionSurvey(input: CreateSurveyInput) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { success: false, message: "No estás autenticado" };
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, agencyId: true, role: true, name: true },
    });

    if (!user) {
      return { success: false, message: "Usuario no encontrado" };
    }

    const trimmedName = (input.intervieweeName || "").trim();
    if (!trimmedName) {
      return { success: false, message: "El nombre de la persona entrevistada es obligatorio." };
    }

    // Filter out completely blank referral rows
    const validReferrals = (input.referrals || [])
      .map(r => ({
        fullName: (r.fullName || "").trim(),
        phone: (r.phone || "").trim(),
        notes: (r.notes || "").trim() || null,
      }))
      .filter(r => r.fullName.length > 0 || r.phone.length > 0);

    // Save survey and referrals in transaction
    const createdSurvey = await prisma.$transaction(async (tx) => {
      const survey = await tx.satisfactionSurvey.create({
        data: {
          userId: user.id,
          agencyId: user.agencyId,
          intervieweeName: trimmedName,
          q1Useful: input.q1Useful ?? true,
          q2Attractive: input.q2Attractive ?? true,
          q3Professional: input.q3Professional ?? true,
          q4Clear: input.q4Clear ?? true,
          q5WouldRecommend: input.q5WouldRecommend ?? true,
          notes: input.notes?.trim() || null,
        },
      });

      if (validReferrals.length > 0) {
        await tx.surveyReferral.createMany({
          data: validReferrals.map((ref) => ({
            surveyId: survey.id,
            userId: user.id,
            agencyId: user.agencyId,
            fullName: ref.fullName || "Sin nombre",
            phone: ref.phone || "Sin teléfono",
            notes: ref.notes,
            status: "NO_CONTACTADO",
          })),
        });
      }

      return survey;
    });

    revalidatePath("/encuesta-satisfaccion");
    revalidatePath("/admin");

    return {
      success: true,
      surveyId: createdSurvey.id,
      totalReferralsSaved: validReferrals.length,
    };
  } catch (error: any) {
    console.error("Error creating satisfaction survey:", error);
    return { success: false, message: error?.message || "Error al guardar la encuesta." };
  }
}

export async function getAgentSurveysAndReferrals() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { success: false, message: "No autenticado", surveys: [], referrals: [], stats: null };
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, agencyId: true, name: true },
    });

    if (!user) {
      return { success: false, message: "Usuario no encontrado", surveys: [], referrals: [], stats: null };
    }

    const [surveys, referrals] = await Promise.all([
      prisma.satisfactionSurvey.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        include: {
          referrals: {
            orderBy: { createdAt: "asc" },
          },
        },
      }),
      prisma.surveyReferral.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        include: {
          survey: {
            select: {
              intervieweeName: true,
              createdAt: true,
            },
          },
        },
      }),
    ]);

    const statusCounts: Record<string, number> = {
      NO_CONTACTADO: 0,
      CONTACTADO: 0,
      AGENDADO: 0,
      PROPUESTA_PRESENTADA: 0,
      CERRADO_PAGADO: 0,
    };

    referrals.forEach((r) => {
      if (statusCounts[r.status] !== undefined) {
        statusCounts[r.status]++;
      } else {
        statusCounts.NO_CONTACTADO++;
      }
    });

    const stats = {
      totalSurveys: surveys.length,
      totalReferrals: referrals.length,
      averageReferrals: surveys.length > 0 ? (referrals.length / surveys.length).toFixed(1) : "0",
      statusCounts,
      closedRate: referrals.length > 0 ? Math.round((statusCounts.CERRADO_PAGADO / referrals.length) * 100) : 0,
    };

    return {
      success: true,
      surveys,
      referrals,
      stats,
    };
  } catch (error: any) {
    console.error("Error fetching agent surveys and referrals:", error);
    return { success: false, message: error?.message || "Error al cargar datos", surveys: [], referrals: [], stats: null };
  }
}

export async function updateReferralStatus(referralId: string, newStatus: string) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { success: false, message: "No autenticado" };
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true, agencyId: true },
    });

    if (!user) {
      return { success: false, message: "Usuario no encontrado" };
    }

    const existing = await prisma.surveyReferral.findUnique({
      where: { id: referralId },
      select: { id: true, userId: true, agencyId: true },
    });

    if (!existing) {
      return { success: false, message: "Referido no encontrado" };
    }

    // Permission check: owner or ADMIN in same agency or SUPER_ADMIN
    const isOwner = existing.userId === user.id;
    const isSuperAdmin = user.role === "SUPER_ADMIN";
    const isAdminSameAgency = user.role === "ADMIN" && user.agencyId === existing.agencyId;

    if (!isOwner && !isSuperAdmin && !isAdminSameAgency) {
      return { success: false, message: "No tienes permiso para actualizar este referido." };
    }

    const validStatuses = ["NO_CONTACTADO", "CONTACTADO", "AGENDADO", "PROPUESTA_PRESENTADA", "CERRADO_PAGADO"];
    if (!validStatuses.includes(newStatus)) {
      return { success: false, message: "Estatus no válido" };
    }

    const updated = await prisma.surveyReferral.update({
      where: { id: referralId },
      data: { status: newStatus },
    });

    revalidatePath("/encuesta-satisfaccion");
    revalidatePath("/admin");

    return { success: true, referral: updated };
  } catch (error: any) {
    console.error("Error updating referral status:", error);
    return { success: false, message: error?.message || "Error al actualizar estatus" };
  }
}

export async function deleteSurveyReferral(referralId: string) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { success: false, message: "No autenticado" };
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true, agencyId: true },
    });

    if (!user) {
      return { success: false, message: "Usuario no encontrado" };
    }

    const existing = await prisma.surveyReferral.findUnique({
      where: { id: referralId },
    });

    if (!existing) {
      return { success: false, message: "Referido no encontrado" };
    }

    const isOwner = existing.userId === user.id;
    const isSuperAdmin = user.role === "SUPER_ADMIN";
    const isAdminSameAgency = user.role === "ADMIN" && user.agencyId === existing.agencyId;

    if (!isOwner && !isSuperAdmin && !isAdminSameAgency) {
      return { success: false, message: "No tienes permiso para eliminar este referido." };
    }

    await prisma.surveyReferral.delete({
      where: { id: referralId },
    });

    revalidatePath("/encuesta-satisfaccion");
    revalidatePath("/admin");

    return { success: true };
  } catch (error: any) {
    console.error("Error deleting survey referral:", error);
    return { success: false, message: error?.message || "Error al eliminar" };
  }
}

export async function deleteSatisfactionSurvey(surveyId: string) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { success: false, message: "No autenticado" };
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true, agencyId: true },
    });

    if (!user) {
      return { success: false, message: "Usuario no encontrado" };
    }

    const existing = await prisma.satisfactionSurvey.findUnique({
      where: { id: surveyId },
    });

    if (!existing) {
      return { success: false, message: "Encuesta no encontrada" };
    }

    const isOwner = existing.userId === user.id;
    const isSuperAdmin = user.role === "SUPER_ADMIN";
    const isAdminSameAgency = user.role === "ADMIN" && user.agencyId === existing.agencyId;

    if (!isOwner && !isSuperAdmin && !isAdminSameAgency) {
      return { success: false, message: "No tienes permiso para eliminar esta encuesta." };
    }

    await prisma.satisfactionSurvey.delete({
      where: { id: surveyId },
    });

    revalidatePath("/encuesta-satisfaccion");
    revalidatePath("/admin");

    return { success: true };
  } catch (error: any) {
    console.error("Error deleting satisfaction survey:", error);
    return { success: false, message: error?.message || "Error al eliminar" };
  }
}

export async function getAdminSatisfactionData(filterAgencyId?: string) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { success: false, message: "No autenticado" };
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true, agencyId: true },
    });

    if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
      return { success: false, message: "Acceso no autorizado para administradores." };
    }

    // Agency scoping (SaaS Multi-tenancy Isolation)
    const effectiveAgencyId = (user.role === "SUPER_ADMIN" && filterAgencyId && filterAgencyId !== "ALL" && filterAgencyId !== "DEFAULT")
      ? filterAgencyId
      : (user.agencyId || "aacom");

    const whereScope = { agencyId: effectiveAgencyId };

    // Parallel queries
    const [surveys, referrals, agencies, usersInScope] = await Promise.all([
      prisma.satisfactionSurvey.findMany({
        where: whereScope,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { id: true, name: true, email: true, image: true, agency: { select: { id: true, name: true } } },
          },
          referrals: true,
        },
      }),
      prisma.surveyReferral.findMany({
        where: whereScope,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { id: true, name: true, email: true, agency: { select: { id: true, name: true } } },
          },
          survey: {
            select: { intervieweeName: true, createdAt: true },
          },
        },
      }),
      user.role === "SUPER_ADMIN"
        ? prisma.agency.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } })
        : Promise.resolve([]),
      prisma.user.findMany({
        where: {
          agencyId: effectiveAgencyId,
          active: true,
        },
        select: {
          id: true,
          name: true,
          email: true,
          agencyId: true,
          agency: { select: { id: true, name: true } },
        },
      }),
    ]);

    // Calculate Global Stats
    const totalSurveys = surveys.length;
    const totalReferrals = referrals.length;

    const statusCounts: Record<string, number> = {
      NO_CONTACTADO: 0,
      CONTACTADO: 0,
      AGENDADO: 0,
      PROPUESTA_PRESENTADA: 0,
      CERRADO_PAGADO: 0,
    };

    referrals.forEach((r) => {
      if (statusCounts[r.status] !== undefined) {
        statusCounts[r.status]++;
      } else {
        statusCounts.NO_CONTACTADO++;
      }
    });

    // 4 SI's + 5th SI percentage
    const qAverages = {
      q1: totalSurveys > 0 ? Math.round((surveys.filter((s) => s.q1Useful).length / totalSurveys) * 100) : 100,
      q2: totalSurveys > 0 ? Math.round((surveys.filter((s) => s.q2Attractive).length / totalSurveys) * 100) : 100,
      q3: totalSurveys > 0 ? Math.round((surveys.filter((s) => s.q3Professional).length / totalSurveys) * 100) : 100,
      q4: totalSurveys > 0 ? Math.round((surveys.filter((s) => s.q4Clear).length / totalSurveys) * 100) : 100,
      q5: totalSurveys > 0 ? Math.round((surveys.filter((s) => s.q5WouldRecommend).length / totalSurveys) * 100) : 100,
    };

    // Calculate per-agent metrics
    const agentMap = new Map<string, any>();

    // Seed all active users in scope
    usersInScope.forEach((u) => {
      agentMap.set(u.id, {
        id: u.id,
        name: u.name || u.email,
        email: u.email,
        agencyName: u.agency?.name || "Sin agencia",
        surveysCount: 0,
        referralsCount: 0,
        noContactado: 0,
        contactado: 0,
        agendado: 0,
        propuesta: 0,
        cerrado: 0,
        conversionRate: 0,
      });
    });

    // Aggregate surveys
    surveys.forEach((s) => {
      let item = agentMap.get(s.userId);
      if (!item) {
        item = {
          id: s.userId,
          name: s.user?.name || s.user?.email || "Desconocido",
          email: s.user?.email || "",
          agencyName: s.user?.agency?.name || "Sin agencia",
          surveysCount: 0,
          referralsCount: 0,
          noContactado: 0,
          contactado: 0,
          agendado: 0,
          propuesta: 0,
          cerrado: 0,
          conversionRate: 0,
        };
        agentMap.set(s.userId, item);
      }
      item.surveysCount++;
    });

    // Aggregate referrals
    referrals.forEach((r) => {
      let item = agentMap.get(r.userId);
      if (!item) {
        item = {
          id: r.userId,
          name: r.user?.name || r.user?.email || "Desconocido",
          email: r.user?.email || "",
          agencyName: r.user?.agency?.name || "Sin agencia",
          surveysCount: 0,
          referralsCount: 0,
          noContactado: 0,
          contactado: 0,
          agendado: 0,
          propuesta: 0,
          cerrado: 0,
          conversionRate: 0,
        };
        agentMap.set(r.userId, item);
      }
      item.referralsCount++;
      if (r.status === "NO_CONTACTADO") item.noContactado++;
      else if (r.status === "CONTACTADO") item.contactado++;
      else if (r.status === "AGENDADO") item.agendado++;
      else if (r.status === "PROPUESTA_PRESENTADA") item.propuesta++;
      else if (r.status === "CERRADO_PAGADO") item.cerrado++;
    });

    // Compute conversion rate for each agent
    const agentStats = Array.from(agentMap.values()).map((a) => {
      const rate = a.referralsCount > 0 ? Math.round((a.cerrado / a.referralsCount) * 100) : 0;
      return {
        ...a,
        conversionRate: rate,
      };
    });

    // Sort agents by total referrals descending, then surveys
    agentStats.sort((a, b) => b.referralsCount - a.referralsCount || b.surveysCount - a.surveysCount);

    return {
      success: true,
      currentUserRole: user.role,
      userAgencyId: user.agencyId,
      agencies,
      stats: {
        totalSurveys,
        totalReferrals,
        statusCounts,
        qAverages,
        avgReferralsPerSurvey: totalSurveys > 0 ? (totalReferrals / totalSurveys).toFixed(1) : "0",
        globalConversionRate: totalReferrals > 0 ? Math.round((statusCounts.CERRADO_PAGADO / totalReferrals) * 100) : 0,
      },
      agentStats,
      surveys,
      referrals,
    };
  } catch (error: any) {
    console.error("Error fetching admin satisfaction data:", error);
    return { success: false, message: error?.message || "Error al cargar datos de administración" };
  }
}
