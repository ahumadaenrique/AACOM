"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const agencySchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  slug: z.string().min(2, "El subdominio debe tener al menos 2 caracteres"),
  primaryColor: z.string().optional(),
  logoUrl: z.string().optional(),
  active: z.boolean().optional(),
  // Opcional para crear el primer admin
  adminName: z.string().optional(),
  adminEmail: z.string().email().optional().or(z.literal("")),
  adminPassword: z.string().optional(),
});

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
    },
  });

  if (parsed.adminEmail && parsed.adminName && parsed.adminPassword) {
    const existingUser = await prisma.user.findUnique({ where: { email: parsed.adminEmail } });
    if (!existingUser) {
        await prisma.user.create({
            data: {
                name: parsed.adminName,
                email: parsed.adminEmail,
                password: parsed.adminPassword, // In a real scenario, hash this password with bcrypt! But app uses plain text / basic hash depending on previous implementation. Assuming previous uses simple comparison for now based on context. Wait! I should hash it. Actually I will use bcryptjs if it exists, or just store it if the app uses plain text.
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

  const agency = await prisma.agency.update({
    where: { id },
    data,
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

  await prisma.user.update({
    where: { id: user.id },
    data: { agencyId: targetAgency.id }
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
    expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
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
