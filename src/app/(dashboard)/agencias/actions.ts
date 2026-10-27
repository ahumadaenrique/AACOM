"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";
import bcrypt from "bcryptjs";

const agencySchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  slug: z.string().min(2, "El subdominio debe tener al menos 2 caracteres"),
  primaryColor: z.string().optional(),
  logoUrl: z.string().optional(),
  active: z.boolean().optional(),
  allowLiteAgents: z.boolean().optional(),
  allowReferidores: z.boolean().optional(),
  allowRoleplaySimulator: z.boolean().optional(),
  allowProyecto200Module: z.boolean().optional(),
  // WhatsApp Planner Config
  enableWhatsAppPlanner: z.boolean().optional(),
  whatsAppPlannerPhones: z.string().optional(),
  whatsAppPlannerAgents: z.string().optional(),
  // Opcional para crear el primer admin
  adminName: z.string().optional(),
  adminEmail: z.string().email().optional().or(z.literal("")),
  adminPassword: z.string().optional(),
  maxAdmins: z.coerce.number().optional(),
});

export async function getAgencyAgents(agencyId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autorizado");
  
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (user?.role !== "SUPER_ADMIN" && user?.role !== "ADMIN") throw new Error("Permisos insuficientes");

  return await prisma.user.findMany({
    where: { agencyId, role: { in: ["AGENTE", "LITE_AGENTE"] } },
    select: { id: true, name: true, email: true }
  });
}

export async function getAgencies() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autorizado");
  
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (user?.role !== "SUPER_ADMIN") throw new Error("Permisos insuficientes");

  // Auto-seed de la agencia matriz en la base de datos actual (para evitar problemas de desincronización)
  const matrizExists = await prisma.agency.findUnique({ where: { id: "aacom" } });
  if (!matrizExists) {
    await prisma.agency.create({
      data: {
        id: "aacom",
        name: "AACOM Seguros",
        slug: "aacom"
      }
    }).catch(() => {}); // Catch por si hay colisiones simultáneas
  }

  const [agencies, promotorSaldos] = await Promise.all([
    prisma.agency.findMany({
      include: {
        users: {
          where: { role: "ADMIN", active: true },
          select: { id: true, name: true, email: true, active: true },
          orderBy: { createdAt: "asc" }
        },
        _count: {
          select: { users: true, clients: true, policies: true }
        }
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.promotorSaldo.findMany(),
  ]);

  const { getAgencyStudyDaysLimit } = await import("@/lib/cedula/studyLimits");
  const saldoMap = new Map(
    promotorSaldos.map((s) => [s.promotor_email.toLowerCase(), s.dias_disponibles ?? 0])
  );

  return agencies.map((agency) => {
    const adminEmail = agency.users?.[0]?.email?.toLowerCase();
    const agencyKey = `agency_${agency.id}`.toLowerCase();
    let cedulaDaysBalance: number;
    if (saldoMap.has(agencyKey)) {
      cedulaDaysBalance = saldoMap.get(agencyKey)!;
    } else if (adminEmail && saldoMap.has(adminEmail)) {
      cedulaDaysBalance = saldoMap.get(adminEmail)!;
    } else {
      cedulaDaysBalance = agency.subscriptionStatus === "trialing" ? 0 : getAgencyStudyDaysLimit(agency);
    }

    return {
      ...agency,
      activeAdminsCount: agency.users?.length ?? 0,
      cedulaDaysBalance,
      academiaProMinutes: Math.floor((agency.voiceSecondsBalance || 0) / 60),
      tipsCreditsBalance: agency.tipsCreditsBalance || 0,
    };
  });
}

export async function createAgency(data: z.infer<typeof agencySchema>) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autorizado");
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (user?.role !== "SUPER_ADMIN") throw new Error("Permisos insuficientes");

  const parsed = agencySchema.parse(data);
  const existingSlug = await prisma.agency.findUnique({ where: { slug: parsed.slug } });
  if (existingSlug) throw new Error("El subdominio (slug) ya está en uso");

  const agency = await prisma.agency.create({
    data: {
      name: parsed.name,
      slug: parsed.slug,
      primaryColor: parsed.primaryColor || "#0f172a", // Default color
      logoUrl: parsed.logoUrl,
      active: parsed.active ?? true,
      allowLiteAgents: parsed.allowLiteAgents ?? false,
      allowReferidores: parsed.allowReferidores ?? false,
      allowRoleplaySimulator: parsed.allowRoleplaySimulator ?? false,
      allowProyecto200Module: parsed.allowProyecto200Module ?? false,
      enableWhatsAppPlanner: parsed.enableWhatsAppPlanner ?? false,
      whatsAppPlannerPhones: parsed.whatsAppPlannerPhones,
      whatsAppPlannerAgents: parsed.whatsAppPlannerAgents,
      maxAdmins: parsed.maxAdmins ?? 2,
    },
  });

  if (parsed.adminEmail && parsed.adminName && parsed.adminPassword) {
    const cleanAdminEmail = parsed.adminEmail.trim().toLowerCase();
    const existingUser = await prisma.user.findFirst({ where: { email: { equals: cleanAdminEmail, mode: 'insensitive' } } });
    if (!existingUser) {
        const hashedPassword = await bcrypt.hash(parsed.adminPassword.trim(), 10);
        await prisma.user.create({
            data: {
                name: parsed.adminName.trim(),
                email: cleanAdminEmail,
                password: hashedPassword,
                role: "ADMIN",
                agencyId: agency.id,
                active: true,
            }
        });
    }
  }
  revalidatePath("/agencias");
  return agency;
}

export async function updateAgency(id: string, data: Partial<z.infer<typeof agencySchema>>) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autorizado");
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (user?.role !== "SUPER_ADMIN") throw new Error("Permisos insuficientes");

  if (data.slug) {
    const existingSlug = await prisma.agency.findUnique({ where: { slug: data.slug } });
    if (existingSlug && existingSlug.id !== id) throw new Error("El subdominio (slug) ya está en uso");
  }

  // Remove admin fields so Prisma doesn't crash
  const { adminName, adminEmail, adminPassword, ...updateData } = data;

  const agency = await prisma.agency.update({
    where: { id },
    data: updateData,
  });

  revalidatePath("/agencias");
  return agency;
}

export async function switchAgency(agencyId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autorizado");
  
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (user?.role !== "SUPER_ADMIN") throw new Error("Permisos insuficientes");

  const targetAgency = await prisma.agency.findUnique({ where: { id: agencyId } });
  if (!targetAgency) throw new Error("Agencia no encontrada");

  // Set the cookie instead of updating the DB
  cookies().set('impersonateAgencyId', targetAgency.id, {
    path: '/',
    maxAge: 60 * 60 * 24 // 1 day
  });

  revalidatePath("/");
  return { success: true };
}

export async function deleteAgency(agencyId: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("No autorizado");
    
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (user?.role !== "SUPER_ADMIN") throw new Error("Permisos insuficientes");
  
    // Remove users agencyId before deleting agency
    await prisma.user.updateMany({
        where: { agencyId },
        data: { agencyId: null }
    });

    await prisma.agency.delete({ where: { id: agencyId } });
    revalidatePath("/agencias");
    return { success: true };
}

// ---- DISCOUNT CODES ACTIONS ---- //

const discountSchema = z.object({
  code: z.string().min(3, "El código debe tener al menos 3 caracteres").toUpperCase(),
  discountPercentage: z.number().min(1).max(100),
  maxUses: z.number().nullable().optional(),
  expiresAt: z.date().nullable().optional(),
});

export async function getDiscountCodes() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autorizado");
  
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (user?.role !== "SUPER_ADMIN") throw new Error("Permisos insuficientes");

  return await prisma.discountCode.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function createDiscountCode(data: any) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autorizado");
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (user?.role !== "SUPER_ADMIN") throw new Error("Permisos insuficientes");

  const parsed = discountSchema.parse({
    ...data,
    maxUses: data.maxUses ? parseInt(data.maxUses) : null,
    expiresAt: data.expiresAt ? new Date(`${data.expiresAt}T23:59:59-06:00`) : null,
  });

  const existingCode = await prisma.discountCode.findUnique({ where: { code: parsed.code } });
  if (existingCode) throw new Error("Este código de descuento ya existe");

  const discount = await prisma.discountCode.create({
    data: {
      code: parsed.code,
      discountPercentage: parsed.discountPercentage,
      maxUses: parsed.maxUses,
      expiresAt: parsed.expiresAt,
      active: true,
    },
  });

  revalidatePath("/agencias");
  return discount;
}

export async function toggleDiscountCode(id: string, active: boolean) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autorizado");
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (user?.role !== "SUPER_ADMIN") throw new Error("Permisos insuficientes");

  const discount = await prisma.discountCode.update({
    where: { id },
    data: { active },
  });

  revalidatePath("/agencias");
  return discount;
}

export async function updateDiscountCode(id: string, data: any) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autorizado");
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (user?.role !== "SUPER_ADMIN") throw new Error("Permisos insuficientes");

  const parsed = discountSchema.parse({
    ...data,
    maxUses: data.maxUses ? parseInt(data.maxUses.toString()) : null,
    expiresAt: data.expiresAt ? new Date(`${data.expiresAt}T23:59:59-06:00`) : null,
  });

  const existingCode = await prisma.discountCode.findUnique({ where: { code: parsed.code } });
  if (existingCode && existingCode.id !== id) throw new Error("Este código de descuento ya existe");

  const discount = await prisma.discountCode.update({
    where: { id },
    data: {
      code: parsed.code,
      discountPercentage: parsed.discountPercentage,
      maxUses: parsed.maxUses,
      expiresAt: parsed.expiresAt,
    },
  });

  revalidatePath("/agencias");
  return discount;
}

export async function deleteDiscountCode(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autorizado");
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (user?.role !== "SUPER_ADMIN") throw new Error("Permisos insuficientes");

  await prisma.discountCode.delete({ where: { id } });
  revalidatePath("/agencias");
  return { success: true };
}

// ---- REGALOS (GIFTING) ACTIONS ---- //

export async function addAgencySaaSDays(agencyId: string, days: number) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autorizado");
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (user?.role !== "SUPER_ADMIN") throw new Error("Permisos insuficientes");

  const agency = await prisma.agency.findUnique({ where: { id: agencyId } });
  if (!agency) throw new Error("Agencia no encontrada");

  let newDate = new Date();
  if (agency.subscriptionEndDate && agency.subscriptionEndDate > newDate) {
    newDate = new Date(agency.subscriptionEndDate);
  }
  newDate.setDate(newDate.getDate() + days);
  newDate.setUTCHours(23, 59, 59, 999);

  await prisma.agency.update({
    where: { id: agencyId },
    data: { 
      subscriptionEndDate: newDate,
      subscriptionStatus: "active" 
    },
  });

  revalidatePath("/agencias");
  return { success: true, message: `Se añadieron ${days} días a la suscripción.` };
}

export async function addAcademiaDaysToPromoter(agencyId: string, days: number) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autorizado");
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (user?.role !== "SUPER_ADMIN") throw new Error("Permisos insuficientes");

  // Encontrar al admin de la agencia para notificar o verificar, aunque el saldo es por agencia
  const agencyAdmin = await prisma.user.findFirst({
    where: { agencyId, role: "ADMIN" }
  });

  if (!agencyAdmin) {
    throw new Error("La agencia no tiene un administrador principal válido.");
  }

  const promoterId = `agency_${agencyId}`;

  const saldo = await prisma.promotorSaldo.upsert({
    where: { promotor_email: promoterId },
    update: { dias_disponibles: { increment: days }, fecha_actualizacion: new Date() },
    create: { promotor_email: promoterId, dias_disponibles: days, fecha_actualizacion: new Date() }
  });

  if (agencyAdmin?.email) {
    await prisma.promotorSaldo.updateMany({
      where: { promotor_email: agencyAdmin.email.toLowerCase() },
      data: { dias_disponibles: saldo.dias_disponibles, fecha_actualizacion: new Date() }
    }).catch(() => {});
  }

  revalidatePath("/agencias");
  return { success: true, message: `Se añadieron ${days} días al saldo de la Agencia.` };
}

export async function resetAgencyStudyDays(agencyId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autorizado");
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (user?.role !== "SUPER_ADMIN") throw new Error("Permisos insuficientes");

  const agency = await prisma.agency.findUnique({ where: { id: agencyId } });
  if (!agency) throw new Error("Agencia no encontrada");

  const { getAgencyStudyDaysLimit } = await import("@/lib/cedula/studyLimits");
  const limit = getAgencyStudyDaysLimit(agency);
  const promoterId = `agency_${agencyId}`;

  await prisma.promotorSaldo.upsert({
    where: { promotor_email: promoterId },
    update: { dias_disponibles: limit, fecha_actualizacion: new Date() },
    create: { promotor_email: promoterId, dias_disponibles: limit, fecha_actualizacion: new Date() }
  });

  const agencyAdmin = await prisma.user.findFirst({
    where: { agencyId, role: "ADMIN" }
  });
  if (agencyAdmin?.email) {
    await prisma.promotorSaldo.updateMany({
      where: { promotor_email: agencyAdmin.email.toLowerCase() },
      data: { dias_disponibles: limit, fecha_actualizacion: new Date() }
    }).catch(() => {});
  }

  revalidatePath("/agencias");
  return { success: true, message: `Saldo de la agencia ${agency.name} reseteado a ${limit} días según su plan.` };
}

export async function addAcademiaDaysToUser(agentEmail: string, agencyId: string, days: number) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autorizado");
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (user?.role !== "SUPER_ADMIN") throw new Error("Permisos insuficientes");

  // Usar el ID de la agencia compartida
  const promoterId = `agency_${agencyId}`;

  const currentLicense = await prisma.estudioLicencia.findUnique({
    where: {
      promotor_email_agente_email: {
        promotor_email: promoterId,
        agente_email: agentEmail
      }
    }
  });

  let newExpiration = new Date();
  if (currentLicense?.fecha_expiracion && currentLicense.fecha_expiracion > newExpiration) {
    newExpiration = new Date(currentLicense.fecha_expiracion);
  }
  newExpiration.setDate(newExpiration.getDate() + days);

  await prisma.estudioLicencia.upsert({
    where: {
      promotor_email_agente_email: {
        promotor_email: promoterId,
        agente_email: agentEmail
      }
    },
    update: {
      dias_asignados: { increment: days },
      fecha_expiracion: newExpiration
    },
    create: {
      promotor_email: promoterId,
      agente_email: agentEmail,
      dias_asignados: days,
      fecha_asignacion: new Date(),
      fecha_expiracion: newExpiration
    }
  });

  revalidatePath("/agencias");
  return { success: true, message: `Se añadieron ${days} días de estudio a ${agentEmail}.` };
}

export async function getAgencyUsers(agencyId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autorizado");
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (user?.role !== "SUPER_ADMIN") throw new Error("Permisos insuficientes");

  const [users, licenses] = await Promise.all([
    prisma.user.findMany({
      where: { agencyId, active: true },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        tipsCreditsBalance: true,
        voiceSecondsBalance: true,
      },
      orderBy: { name: "asc" },
    }),
    prisma.estudioLicencia.findMany({
      where: { promotor_email: `agency_${agencyId}` },
    }),
  ]);

  const now = new Date();
  const licenseMap = new Map(
    licenses.map((l) => {
      const exp = l.fecha_expiracion ? new Date(l.fecha_expiracion) : null;
      const daysLeft = exp && exp > now ? Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;
      return [l.agente_email.toLowerCase(), daysLeft];
    })
  );

  return users.map((u) => ({
    ...u,
    cedulaDaysLeft: licenseMap.get(u.email.toLowerCase()) || 0,
    academiaProMinutes: Math.floor((u.voiceSecondsBalance || 0) / 60),
    tipsCreditsBalance: u.tipsCreditsBalance || 0,
  }));
}

export async function toggleAgencyRoleplay(agencyId: string, allow: boolean) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autorizado");
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (user?.role !== "SUPER_ADMIN") throw new Error("Permisos insuficientes");

  const updated = await prisma.agency.update({
    where: { id: agencyId },
    data: { allowRoleplaySimulator: allow }
  });

  revalidatePath("/agencias");
  revalidatePath("/academia");
  return { success: true, allowRoleplaySimulator: updated.allowRoleplaySimulator };
}

export async function toggleAgencyAcademyModule(agencyId: string, allow: boolean) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autorizado");
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (user?.role !== "SUPER_ADMIN") throw new Error("Solo el Super Administrador puede habilitar o deshabilitar la Academia de Videos.");

  const updated = await prisma.agency.update({
    where: { id: agencyId },
    data: { allowAcademyModule: allow }
  });

  revalidatePath("/agencias");
  revalidatePath("/academia");
  revalidatePath("/academia/videos");
  return { success: true, allowAcademyModule: updated.allowAcademyModule };
}

export async function toggleAgencyProyecto200Module(agencyId: string, allow: boolean) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autorizado");
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (user?.role !== "SUPER_ADMIN") {
    throw new Error("Solo el Super Administrador puede habilitar o deshabilitar el módulo Proyecto 200.");
  }

  const updated = await prisma.agency.update({
    where: { id: agencyId },
    data: { allowProyecto200Module: allow }
  });

  revalidatePath("/agencias");
  revalidatePath("/proyecto-200");
  revalidatePath("/admin");
  revalidatePath("/", "layout");
  return { success: true, allowProyecto200Module: updated.allowProyecto200Module };
}

export async function toggleAgencyShareAacomVideos(agencyId: string, share: boolean) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autorizado");
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (user?.role !== "SUPER_ADMIN") throw new Error("Solo el Super Administrador puede activar o desactivar el compartir los videos de AACOM.");

  const updated = await prisma.agency.update({
    where: { id: agencyId },
    data: { shareAacomAcademyVideos: share }
  });

  revalidatePath("/agencias");
  revalidatePath("/academia");
  revalidatePath("/academia/videos");
  return { success: true, shareAacomAcademyVideos: updated.shareAacomAcademyVideos };
}

export async function giftAcademiaMinutes(agencyId: string, minutes: number, userEmail?: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autorizado");
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (user?.role !== "SUPER_ADMIN") throw new Error("Permisos insuficientes");

  if (!minutes || minutes <= 0) throw new Error("La cantidad de minutos debe ser mayor a 0");

  const seconds = minutes * 60;

  if (userEmail && userEmail.trim()) {
    const targetUser = await prisma.user.findUnique({ where: { email: userEmail.trim() } });
    if (!targetUser) throw new Error("Usuario destino no encontrado");

    await prisma.user.update({
      where: { id: targetUser.id },
      data: { voiceSecondsBalance: { increment: seconds } }
    });

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    await prisma.voiceMinutesPurchase.create({
      data: {
        userId: targetUser.id,
        seconds,
        secondsRemaining: seconds,
        expiresAt
      }
    });

    revalidatePath("/agencias");
    revalidatePath("/academia");
    return { success: true, message: `Se otorgaron ${minutes} minutos de cortesía a ${targetUser.name || targetUser.email}.` };
  } else {
    const agency = await prisma.agency.update({
      where: { id: agencyId },
      data: { voiceSecondsBalance: { increment: seconds } }
    });

    revalidatePath("/agencias");
    revalidatePath("/academia");
    return { success: true, message: `Se añadieron ${minutes} minutos de cortesía a la bolsa de ${agency.name}.` };
  }
}

export async function giftTipsCredits(agencyId: string, credits: number, userEmail?: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autorizado");
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (user?.role !== "SUPER_ADMIN") throw new Error("Permisos insuficientes");

  if (!credits || credits <= 0) throw new Error("La cantidad de créditos TIPS debe ser mayor a 0");

  const { grantTipsCreditsPackage } = await import("@/lib/tips-credits");

  if (userEmail && userEmail.trim()) {
    const targetUser = await prisma.user.findUnique({ where: { email: userEmail.trim() } });
    if (!targetUser) throw new Error("Usuario destino no encontrado");

    await grantTipsCreditsPackage({
      userId: targetUser.id,
      agencyId: null,
      target: "user",
      packageId: "tips_gift_superadmin",
      creditsToAdd: credits,
      amountPaidMxn: 0,
    });

    revalidatePath("/agencias");
    revalidatePath("/tips");
    return {
      success: true,
      message: `Se otorgaron ${credits} créditos TIPS (vigencia 90 días) a ${targetUser.name || targetUser.email}.`,
    };
  } else {
    const agency = await prisma.agency.findUnique({ where: { id: agencyId } });
    if (!agency) throw new Error("Agencia no encontrada");

    await grantTipsCreditsPackage({
      userId: user.id,
      agencyId: agency.id,
      target: "agency",
      packageId: "tips_gift_superadmin",
      creditsToAdd: credits,
      amountPaidMxn: 0,
    });

    revalidatePath("/agencias");
    revalidatePath("/tips");
    return {
      success: true,
      message: `Se añadieron ${credits} créditos TIPS (vigencia 90 días) a la bolsa de la promotoría ${agency.name}.`,
    };
  }
}

export async function updateAgencyAiEngine(agencyId: string, engine: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autorizado");
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (user?.role !== "SUPER_ADMIN") throw new Error("Permisos insuficientes");

  const validEngine = engine === "ELEVENLABS" ? "ELEVENLABS" : "GEMINI_LIVE";

  const updated = await prisma.agency.update({
    where: { id: agencyId },
    data: { voiceEngine: validEngine }
  });

  revalidatePath("/agencias");
  revalidatePath("/academia");
  return { success: true, voiceEngine: updated.voiceEngine };
}

export async function toggleAgencyByok(agencyId: string, active: boolean) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autorizado");
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (user?.role !== "SUPER_ADMIN" && (user?.agencyId !== agencyId || user?.role !== "ADMIN")) {
    throw new Error("Permisos insuficientes");
  }

  const updated = await prisma.agency.update({
    where: { id: agencyId },
    data: { byokActive: active }
  });

  revalidatePath("/agencias");
  revalidatePath("/academia");
  revalidatePath("/admin/agencia");
  return { success: true, byokActive: updated.byokActive };
}

export async function getAgencyUsageStats(agencyId?: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autorizado");
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const effectiveAgencyId = agencyId || user?.agencyId;

  const whereClause: any = {};
  if (!isSuperAdmin) {
    if (!effectiveAgencyId) return null;
    whereClause.agencyId = effectiveAgencyId;
  } else if (agencyId) {
    whereClause.agencyId = agencyId;
  }

  const calls = await prisma.roleplayCall.findMany({
    where: whereClause,
    select: {
      id: true,
      durationSeconds: true,
      engine: true,
      agencyId: true,
      createdAt: true
    }
  });

  let totalCalls = calls.length;
  let totalSeconds = calls.reduce((acc, c) => acc + (c.durationSeconds || 0), 0);
  let totalMinutes = Math.round((totalSeconds / 60) * 10) / 10;

  let geminiSeconds = calls.filter(c => c.engine !== "ELEVENLABS").reduce((acc, c) => acc + (c.durationSeconds || 0), 0);
  let geminiMinutes = Math.round((geminiSeconds / 60) * 10) / 10;

  let elevenSeconds = calls.filter(c => c.engine === "ELEVENLABS").reduce((acc, c) => acc + (c.durationSeconds || 0), 0);
  let elevenMinutes = Math.round((elevenSeconds / 60) * 10) / 10;

  // Gemini Live ~$0.46 MXN/min, ElevenLabs ~$1.60 MXN/min
  let estimatedCostMxn = Math.round((geminiMinutes * 0.46 + elevenMinutes * 1.60) * 100) / 100;

  return {
    totalCalls,
    totalMinutes,
    geminiMinutes,
    elevenMinutes,
    estimatedCostMxn
  };
}

export async function updateAgencyMaxAdmins(agencyId: string, maxAdmins: number) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autorizado");
  
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (user?.role !== "SUPER_ADMIN") throw new Error("Solo el Super Administrador puede modificar el cupo de administradores.");

  const safeCount = Math.max(1, Math.min(20, Math.floor(maxAdmins)));

  // Validar cuántos administradores activos tiene la promotoría actualmente
  const currentActiveAdmins = await prisma.user.count({
    where: {
      agencyId,
      role: "ADMIN",
      active: true
    }
  });

  if (safeCount < currentActiveAdmins) {
    throw new Error(
      `No es posible reducir el cupo a ${safeCount} administradores: la promotoría actualmente cuenta con ${currentActiveAdmins} administradores activos. Para reducir el cupo, primero se debe degradar o cambiar el rol de al menos ${currentActiveAdmins - safeCount} administrador(es) en la promotoría.`
    );
  }

  const updated = await prisma.agency.update({
    where: { id: agencyId },
    data: { maxAdmins: safeCount }
  });

  revalidatePath("/agencias");
  revalidatePath("/admin");
  return { success: true, maxAdmins: updated.maxAdmins, activeAdmins: currentActiveAdmins };
}
