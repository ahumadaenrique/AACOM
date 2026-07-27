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
  // WhatsApp Planner Config
  enableWhatsAppPlanner: z.boolean().optional(),
  whatsAppPlannerPhones: z.string().optional(),
  whatsAppPlannerAgents: z.string().optional(),
  // Opcional para crear el primer admin
  adminName: z.string().optional(),
  adminEmail: z.string().email().optional().or(z.literal("")),
  adminPassword: z.string().optional(),
});

export async function getAgencyAgents(agencyId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autorizado");
  
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (user?.role !== "SUPER_ADMIN" && user?.role !== "ADMIN") throw new Error("Permisos insuficientes");

  return await prisma.user.findMany({
    where: { agencyId, role: { in: ["AGENT", "LITE_AGENT"] } },
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

  return await prisma.agency.findMany({
    include: {
      users: {
        where: { role: "ADMIN" },
        take: 1,
      },
      _count: {
        select: { users: true, clients: true, policies: true }
      }
    },
    orderBy: { createdAt: "desc" },
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
      enableWhatsAppPlanner: parsed.enableWhatsAppPlanner ?? false,
      whatsAppPlannerPhones: parsed.whatsAppPlannerPhones,
      whatsAppPlannerAgents: parsed.whatsAppPlannerAgents,
    },
  });

  if (parsed.adminEmail && parsed.adminName && parsed.adminPassword) {
    const existingUser = await prisma.user.findUnique({ where: { email: parsed.adminEmail } });
    if (!existingUser) {
        const hashedPassword = await bcrypt.hash(parsed.adminPassword, 10);
        await prisma.user.create({
            data: {
                name: parsed.adminName,
                email: parsed.adminEmail,
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

  revalidatePath("/agencias");
  return { success: true, message: `Se añadieron ${days} días al saldo de la Agencia.` };
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

  return { success: true, message: `Se añadieron ${days} días de estudio a ${agentEmail}.` };
}

export async function getAgencyUsers(agencyId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autorizado");
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (user?.role !== "SUPER_ADMIN") throw new Error("Permisos insuficientes");

  const users = await prisma.user.findMany({
    where: { agencyId, active: true },
    select: { id: true, name: true, email: true, role: true },
    orderBy: { name: 'asc' }
  });

  return users;
}
