"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function provisionClientPortalUser(input: {
  clientId: string;
  email: string;
  temporaryPassword?: string;
  portalEnabled: boolean;
  portalWelcomeNote?: string;
  hiddenPolicyIds?: string[];
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: "No autorizado" };
    }

    const agentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true, agencyId: true, name: true },
    });

    if (!agentUser || agentUser.role === "CLIENTE") {
      return { success: false, message: "Permisos insuficientes" };
    }

    const isAdmin = agentUser.role === "ADMIN" || agentUser.role === "SUPER_ADMIN";
    const client = await prisma.client.findFirst({
      where: isAdmin
        ? { id: input.clientId, agencyId: agentUser.agencyId }
        : { id: input.clientId, userId: agentUser.id },
    });

    if (!client) {
      return { success: false, message: "Cliente no encontrado en tu cartera." };
    }

    const cleanEmail = input.email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      return {
        success: false,
        message: "Ingresa un correo electrónico válido (o usuario con formato @) para el cliente.",
      };
    }

    let portalUserId = (client as any).portalUserId as string | null;
    const tempPass = input.temporaryPassword?.trim() || "";

    if (tempPass && tempPass.length < 6) {
      return {
        success: false,
        message: "La contraseña temporal debe tener al menos 6 caracteres.",
      };
    }

    // Verificar que el email no pertenezca a un agente u otro usuario distinto
    const existingEmailUser = await prisma.user.findFirst({
      where: { email: { equals: cleanEmail, mode: "insensitive" } },
    });

    if (existingEmailUser && existingEmailUser.id !== portalUserId && existingEmailUser.role !== "CLIENTE") {
      return {
        success: false,
        message: "Ese correo electrónico ya pertenece a un Agente o Administrador en el sistema.",
      };
    }

    if (!portalUserId && existingEmailUser && existingEmailUser.role === "CLIENTE") {
      portalUserId = existingEmailUser.id;
    }

    if (!portalUserId) {
      if (!tempPass) {
        return {
          success: false,
          message: "Debes asignar una contraseña temporal de al menos 6 caracteres para crear el acceso.",
        };
      }
      const hashedPassword = await bcrypt.hash(tempPass, 10);
      const createdPortalUser = await prisma.user.create({
        data: {
          name: client.name,
          email: cleanEmail,
          password: hashedPassword,
          role: "CLIENTE",
          mustChangePassword: true,
          termsAccepted: true,
          termsAcceptedAt: new Date(),
          active: input.portalEnabled,
          agencyId: client.agencyId || agentUser.agencyId,
          reportsToId: client.userId,
          phone: client.phone,
        },
      });
      portalUserId = createdPortalUser.id;
    } else {
      const updateData: any = {
        name: client.name,
        email: cleanEmail,
        active: input.portalEnabled,
        termsAccepted: true,
      };
      if (tempPass) {
        updateData.password = await bcrypt.hash(tempPass, 10);
        updateData.mustChangePassword = true;
      }
      await prisma.user.update({
        where: { id: portalUserId },
        data: updateData,
      });
    }

    await prisma.client.update({
      where: { id: client.id },
      data: {
        email: cleanEmail,
        portalUserId,
        portalEnabled: input.portalEnabled,
        portalWelcomeNote: input.portalWelcomeNote ?? null,
        portalHiddenPolicyIds: JSON.stringify(input.hiddenPolicyIds || []),
      } as any,
    });

    revalidatePath(`/cartera/clientes/${client.id}`);
    revalidatePath(`/portal-clientes`);
    return {
      success: true,
      loginEmail: cleanEmail,
      temporaryPassword: tempPass || undefined,
    };
  } catch (error: any) {
    console.error("Error in provisionClientPortalUser:", error);
    return {
      success: false,
      message: error.message || "Error al configurar el acceso del cliente.",
    };
  }
}

export async function createClientPortalItem(input: {
  clientId?: string | null;
  isTemplate?: boolean;
  category: string;
  ramo?: string;
  title: string;
  description?: string;
  content?: string;
  fileUrl?: string;
  fileName?: string;
  emergencyPhone?: string;
  externalUrl?: string;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: "No autorizado" };
    }

    const agentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, agencyId: true, role: true },
    });

    if (!agentUser || agentUser.role === "CLIENTE") {
      return { success: false, message: "No autorizado" };
    }

    if (!input.title || !input.title.trim()) {
      return { success: false, message: "El título del instructivo es obligatorio." };
    }

    const item = await (prisma as any).clientPortalItem.create({
      data: {
        agencyId: agentUser.agencyId,
        userId: agentUser.id,
        clientId: input.clientId || null,
        isTemplate: Boolean(input.isTemplate),
        category: input.category || "SINIESTRO",
        ramo: input.ramo || "GENERAL",
        title: input.title.trim(),
        description: input.description?.trim() || null,
        content: input.content?.trim() || null,
        fileUrl: input.fileUrl || null,
        fileName: input.fileName || null,
        emergencyPhone: input.emergencyPhone?.trim() || null,
        externalUrl: input.externalUrl?.trim() || null,
        active: true,
      },
    });

    if (input.clientId) {
      revalidatePath(`/cartera/clientes/${input.clientId}`);
    }
    revalidatePath(`/portal-clientes`);
    revalidatePath(`/mi-portal`);

    return { success: true, item };
  } catch (error: any) {
    console.error("Error in createClientPortalItem:", error);
    return { success: false, message: error.message || "Error al guardar el instructivo." };
  }
}

export async function assignTemplateToClient(templateId: string, clientId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: "No autorizado" };
    }

    const template = await (prisma as any).clientPortalItem.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return { success: false, message: "Plantilla no encontrada." };
    }

    const created = await (prisma as any).clientPortalItem.create({
      data: {
        agencyId: template.agencyId,
        userId: session.user.id,
        clientId,
        isTemplate: false,
        category: template.category,
        ramo: template.ramo,
        title: template.title,
        description: template.description,
        content: template.content,
        fileUrl: template.fileUrl,
        fileName: template.fileName,
        emergencyPhone: template.emergencyPhone,
        externalUrl: template.externalUrl,
        active: true,
      },
    });

    revalidatePath(`/cartera/clientes/${clientId}`);
    revalidatePath(`/mi-portal`);
    return { success: true, item: created };
  } catch (error: any) {
    return { success: false, message: error.message || "Error al asignar instructivo." };
  }
}

export async function deleteClientPortalItem(itemId: string, clientId?: string | null) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: "No autorizado" };
    }

    await (prisma as any).clientPortalItem.delete({
      where: { id: itemId },
    });

    if (clientId) {
      revalidatePath(`/cartera/clientes/${clientId}`);
    }
    revalidatePath(`/portal-clientes`);
    revalidatePath(`/mi-portal`);
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message || "Error al eliminar el instructivo." };
  }
}
