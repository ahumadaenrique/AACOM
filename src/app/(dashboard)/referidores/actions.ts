"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

const MAX_REFERIDORES_PER_AGENT = 5;

async function getAuthenticatedAgent() {
    const session = await auth();
    if (!session?.user?.id && !session?.user?.email) {
        throw new Error("No autorizado");
    }

    const dbUser = session?.user?.id
        ? await prisma.user.findUnique({
              where: { id: session.user.id },
              select: { id: true, name: true, email: true, role: true, agencyId: true, active: true }
          })
        : await prisma.user.findUnique({
              where: { email: session.user.email!.toLowerCase() },
              select: { id: true, name: true, email: true, role: true, agencyId: true, active: true }
          });

    if (!dbUser || !dbUser.active) {
        throw new Error("Usuario no encontrado o inactivo");
    }

    if (dbUser.role === "REFERIDOR" || dbUser.role === "AGENTE_LITE" || dbUser.role === "SELLER") {
        throw new Error("Tu tipo de cuenta no tiene acceso a gestionar referidores");
    }

    return {
        ...dbUser,
        effectiveAgencyId: (session?.user as any)?.agencyId || dbUser.agencyId
    };
}

export async function getMisReferidores() {
    try {
        const agent = await getAuthenticatedAgent();
        const dateStr = new Date().toLocaleDateString("en-CA", { timeZone: "America/Mexico_City" });

        const referidores = await prisma.user.findMany({
            where: {
                role: "REFERIDOR",
                linkedAgentId: agent.id,
                ...(agent.effectiveAgencyId ? { agencyId: agent.effectiveAgencyId } : {})
            },
            include: {
                activityLogs: {
                    orderBy: { createdAt: "desc" },
                    take: 60
                },
                _count: {
                    select: {
                        project200Contacts: true
                    }
                }
            },
            orderBy: [
                { active: "desc" },
                { createdAt: "desc" }
            ]
        });

        const mapped = referidores.map((ref) => {
            const todayLogs = ref.activityLogs.filter((log) => log.dateStr === dateStr);
            const todayPoints = todayLogs.reduce((acc, log) => acc + log.points, 0);
            const lastActivityAt = ref.activityLogs.length > 0 ? ref.activityLogs[0].createdAt : null;

            // Puntos últimos 7 días
            const uniqueActiveDays = new Set(ref.activityLogs.map((l) => l.dateStr)).size;

            return {
                id: ref.id,
                name: ref.name || "Sin nombre",
                email: ref.email,
                phone: ref.phone || "",
                active: ref.active,
                createdAt: ref.createdAt,
                todayPoints,
                lastActivityAt,
                uniqueActiveDays,
                project200Count: ref._count?.project200Contacts || 0,
                commissionPct: ref.referidorCommissionPct ?? 30,
                bonusPct: ref.referidorBonusPct ?? 0
            };
        });

        return {
            success: true,
            data: mapped,
            maxAllowed: MAX_REFERIDORES_PER_AGENT,
            currentCount: mapped.length
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function createMyReferidor(data: {
    name: string;
    email: string;
    phone?: string;
    tempPassword?: string;
    commissionPct: number;
    bonusPct: number;
}) {
    try {
        const agent = await getAuthenticatedAgent();

        const cleanName = (data.name || "").trim();
        const cleanEmail = (data.email || "").trim().toLowerCase();
        const cleanPhone = (data.phone || "").trim();
        const tempPassword = (data.tempPassword || "Temporal123!").trim();

        if (!cleanName || !cleanEmail) {
            throw new Error("El nombre y el correo electrónico son obligatorios.");
        }

        if (tempPassword.length < 6) {
            throw new Error("La contraseña temporal debe tener al menos 6 caracteres.");
        }

        const commissionPct = Number(data.commissionPct ?? 30);
        const bonusPct = Number(data.bonusPct ?? 0);

        if (isNaN(commissionPct) || commissionPct < 30 || commissionPct > 50) {
            throw new Error("El % de comisión compartida debe estar entre 30% y 50%.");
        }

        if (isNaN(bonusPct) || bonusPct < 0 || bonusPct > 50) {
            throw new Error("El % de bonos compartidos debe estar entre 0% y 50%.");
        }

        // Verificar límite de 5 referidores por agente
        const currentReferidoresCount = await prisma.user.count({
            where: {
                role: "REFERIDOR",
                linkedAgentId: agent.id
            }
        });

        if (currentReferidoresCount >= MAX_REFERIDORES_PER_AGENT) {
            throw new Error(
                `Has alcanzado tu límite máximo de ${MAX_REFERIDORES_PER_AGENT} referidores dados de alta. Para registrar uno nuevo, primero debes dar de baja a uno de tus referidores actuales.`
            );
        }

        const existingUser = await prisma.user.findFirst({
            where: { email: { equals: cleanEmail, mode: "insensitive" } }
        });

        if (existingUser) {
            throw new Error("Este correo electrónico ya está registrado en el sistema.");
        }

        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        const created = await prisma.user.create({
            data: {
                name: cleanName,
                email: cleanEmail,
                phone: cleanPhone || null,
                password: hashedPassword,
                role: "REFERIDOR",
                agencyId: agent.effectiveAgencyId,
                linkedAgentId: agent.id,
                active: true,
                mustChangePassword: true,
                termsAccepted: false,
                referidorCommissionPct: commissionPct,
                referidorBonusPct: bonusPct
            }
        });

        revalidatePath("/referidores");
        revalidatePath("/admin/referidores");
        revalidatePath("/admin");

        return {
            success: true,
            referidor: {
                id: created.id,
                name: created.name,
                email: created.email,
                phone: created.phone,
                tempPassword,
                commissionPct,
                bonusPct
            }
        };
    } catch (error: any) {
        return { success: false, error: error.message || "Error al dar de alta al referidor" };
    }
}

export async function updateMyReferidorAgreement(data: {
    referidorId: string;
    name?: string;
    phone?: string;
    commissionPct: number;
    bonusPct: number;
}) {
    try {
        const agent = await getAuthenticatedAgent();
        const isAdmin = agent.role === "ADMIN" || agent.role === "SUPER_ADMIN";

        const target = await prisma.user.findFirst({
            where: {
                id: data.referidorId,
                role: "REFERIDOR",
                ...(isAdmin
                    ? { agencyId: agent.effectiveAgencyId }
                    : { linkedAgentId: agent.id })
            }
        });

        if (!target) {
            throw new Error("Referidor no encontrado o no tienes permisos para editarlo.");
        }

        const commissionPct = Number(data.commissionPct);
        const bonusPct = Number(data.bonusPct);

        if (isNaN(commissionPct) || commissionPct < 30 || commissionPct > 50) {
            throw new Error("El % de comisión compartida debe estar entre 30% y 50%.");
        }

        if (isNaN(bonusPct) || bonusPct < 0 || bonusPct > 50) {
            throw new Error("El % de bonos compartidos debe estar entre 0% y 50%.");
        }

        await prisma.user.update({
            where: { id: target.id },
            data: {
                ...(data.name !== undefined && data.name.trim() ? { name: data.name.trim() } : {}),
                ...(data.phone !== undefined ? { phone: data.phone.trim() || null } : {}),
                referidorCommissionPct: commissionPct,
                referidorBonusPct: bonusPct
            }
        });

        revalidatePath("/referidores");
        revalidatePath(`/referidores/${target.id}`);
        revalidatePath("/admin/referidores");

        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message || "Error al actualizar acuerdo comercial" };
    }
}

export async function toggleMyReferidorStatus(referidorId: string) {
    try {
        const agent = await getAuthenticatedAgent();
        const isAdmin = agent.role === "ADMIN" || agent.role === "SUPER_ADMIN";

        const target = await prisma.user.findFirst({
            where: {
                id: referidorId,
                role: "REFERIDOR",
                ...(isAdmin
                    ? { agencyId: agent.effectiveAgencyId }
                    : { linkedAgentId: agent.id })
            }
        });

        if (!target) {
            throw new Error("Referidor no encontrado o no tienes permiso para modificarlo.");
        }

        const updated = await prisma.user.update({
            where: { id: target.id },
            data: { active: !target.active }
        });

        revalidatePath("/referidores");
        revalidatePath(`/referidores/${target.id}`);
        revalidatePath("/admin/referidores");
        revalidatePath("/admin");

        return {
            success: true,
            active: updated.active,
            message: updated.active
                ? "Referidor reactivado exitosamente."
                : "Referidor suspendido temporalmente."
        };
    } catch (error: any) {
        return { success: false, error: error.message || "Error al cambiar el estado del referidor" };
    }
}

export async function resetMyReferidorPassword(referidorId: string, newTempPassword: string) {
    try {
        const agent = await getAuthenticatedAgent();
        const isAdmin = agent.role === "ADMIN" || agent.role === "SUPER_ADMIN";

        const cleanPass = (newTempPassword || "").trim();
        if (cleanPass.length < 6) {
            throw new Error("La contraseña debe tener al menos 6 caracteres.");
        }

        const target = await prisma.user.findFirst({
            where: {
                id: referidorId,
                role: "REFERIDOR",
                ...(isAdmin
                    ? { agencyId: agent.effectiveAgencyId }
                    : { linkedAgentId: agent.id })
            }
        });

        if (!target) {
            throw new Error("Referidor no encontrado o no tienes permiso para modificarlo.");
        }

        const hashedPassword = await bcrypt.hash(cleanPass, 10);

        await prisma.user.update({
            where: { id: target.id },
            data: {
                password: hashedPassword,
                mustChangePassword: true
            }
        });

        revalidatePath("/referidores");
        revalidatePath(`/referidores/${target.id}`);
        revalidatePath("/admin/referidores");

        return {
            success: true,
            message: "Contraseña temporal actualizada. El referidor deberá personalizarla al iniciar sesión."
        };
    } catch (error: any) {
        return { success: false, error: error.message || "Error al restablecer la contraseña" };
    }
}

export async function deleteMyReferidor(referidorId: string) {
    try {
        const agent = await getAuthenticatedAgent();
        const isAdmin = agent.role === "ADMIN" || agent.role === "SUPER_ADMIN";

        const target = await prisma.user.findFirst({
            where: {
                id: referidorId,
                role: "REFERIDOR",
                ...(isAdmin
                    ? { agencyId: agent.effectiveAgencyId }
                    : { linkedAgentId: agent.id })
            }
        });

        if (!target) {
            throw new Error("Referidor no encontrado o no tienes permiso para darlo de baja.");
        }

        // Limpieza segura de registros dependientes para liberar el espacio entre los 5 permitidos
        await prisma.$transaction([
            prisma.activityLog.deleteMany({ where: { userId: target.id } }),
            prisma.dailyRecord.deleteMany({ where: { userId: target.id } }),
            prisma.project200Log.deleteMany({ where: { userId: target.id } }),
            prisma.project200Contact.deleteMany({ where: { userId: target.id } }),
            prisma.pushSubscription.deleteMany({ where: { userId: target.id } }),
            prisma.pollVote.deleteMany({ where: { userId: target.id } }),
            prisma.user.delete({ where: { id: target.id } })
        ]);

        revalidatePath("/referidores");
        revalidatePath("/admin/referidores");
        revalidatePath("/admin");

        return {
            success: true,
            message: "Referidor dado de baja definitivamente. Se ha liberado 1 espacio en tu cuenta."
        };
    } catch (error: any) {
        return { success: false, error: error.message || "Error al dar de baja al referidor" };
    }
}

export async function getReferidorDetails(referidorId: string) {
    try {
        const agent = await getAuthenticatedAgent();
        const isAdmin = agent.role === "ADMIN" || agent.role === "SUPER_ADMIN";

        const dateStr = new Date().toLocaleDateString("en-CA", { timeZone: "America/Mexico_City" });

        const referidor = await prisma.user.findFirst({
            where: {
                id: referidorId,
                role: "REFERIDOR",
                ...(isAdmin
                    ? { agencyId: agent.effectiveAgencyId }
                    : { linkedAgentId: agent.id })
            },
            include: {
                linkedAgent: {
                    select: { id: true, name: true, email: true }
                },
                activityLogs: {
                    orderBy: { createdAt: "desc" },
                    take: 150
                },
                project200Contacts: {
                    orderBy: { updatedAt: "desc" },
                    take: 25,
                    select: {
                        id: true,
                        fullName: true,
                        phone: true,
                        status: true,
                        closingProbability: true,
                        updatedAt: true
                    }
                }
            }
        });

        if (!referidor) {
            throw new Error("Referidor no encontrado o no tienes permiso para verlo");
        }

        const todayLogs = referidor.activityLogs.filter((log: any) => log.dateStr === dateStr);
        const todayPoints = todayLogs.reduce((acc: number, log: any) => acc + log.points, 0);

        // Agrupar puntos por día para ver cumplimiento de 15 pts
        const pointsByDate: Record<string, number> = {};
        referidor.activityLogs.forEach((log: any) => {
            pointsByDate[log.dateStr] = (pointsByDate[log.dateStr] || 0) + log.points;
        });
        const daysReached15 = Object.values(pointsByDate).filter((pts) => pts >= 15).length;
        const totalActiveDays = Object.keys(pointsByDate).length;

        return {
            success: true,
            data: {
                id: referidor.id,
                name: referidor.name || "Sin nombre",
                email: referidor.email,
                phone: referidor.phone || "",
                active: referidor.active,
                createdAt: referidor.createdAt,
                linkedAgentName: referidor.linkedAgent?.name || "Agente",
                commissionPct: referidor.referidorCommissionPct ?? 30,
                bonusPct: referidor.referidorBonusPct ?? 0,
                todayPoints,
                daysReached15,
                totalActiveDays,
                logs: referidor.activityLogs,
                project200Contacts: referidor.project200Contacts
            }
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
