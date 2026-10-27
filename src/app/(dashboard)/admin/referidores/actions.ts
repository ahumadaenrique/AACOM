"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

const MAX_REFERIDORES_PER_AGENT = 5;

async function getAuthenticatedAdmin() {
    const session = await auth();
    if (!session?.user?.id && !session?.user?.email) {
        throw new Error("No autorizado");
    }

    const adminUser = session?.user?.id
        ? await prisma.user.findUnique({
              where: { id: session.user.id },
              select: { id: true, role: true, agencyId: true }
          })
        : await prisma.user.findUnique({
              where: { email: session.user.email!.toLowerCase() },
              select: { id: true, role: true, agencyId: true }
          });

    if (!adminUser || (adminUser.role !== "ADMIN" && adminUser.role !== "SUPER_ADMIN")) {
        throw new Error("Acceso denegado");
    }

    const effectiveAgencyId = (session?.user as any)?.agencyId || adminUser.agencyId;
    return { ...adminUser, effectiveAgencyId };
}

export async function getReferidoresConActividad() {
    try {
        const adminUser = await getAuthenticatedAdmin();
        const dateStr = new Date().toLocaleDateString("en-CA", { timeZone: "America/Mexico_City" });

        const referidores = await prisma.user.findMany({
            where: {
                role: "REFERIDOR",
                agencyId: adminUser.effectiveAgencyId
            },
            include: {
                linkedAgent: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                activityLogs: {
                    orderBy: { createdAt: "desc" },
                    take: 80
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
            const todayLogs = ref.activityLogs.filter((l) => l.dateStr === dateStr);
            const todayPoints = todayLogs.reduce((acc, r) => acc + r.points, 0);
            const lastActivityAt = ref.activityLogs.length > 0 ? ref.activityLogs[0].createdAt : null;

            const pointsByDate: Record<string, number> = {};
            ref.activityLogs.forEach((l) => {
                pointsByDate[l.dateStr] = (pointsByDate[l.dateStr] || 0) + l.points;
            });
            const daysReached15 = Object.values(pointsByDate).filter((pts) => pts >= 15).length;
            const totalActiveDays = Object.keys(pointsByDate).length;

            return {
                id: ref.id,
                name: ref.name || "Sin nombre",
                email: ref.email,
                phone: ref.phone || "",
                active: ref.active,
                createdAt: ref.createdAt,
                linkedAgentId: ref.linkedAgentId || "",
                agentName: ref.linkedAgent?.name || "Sin Agente Asignado",
                agentEmail: ref.linkedAgent?.email || "",
                commissionPct: ref.referidorCommissionPct ?? 30,
                bonusPct: ref.referidorBonusPct ?? 0,
                todayPoints,
                lastActivityAt,
                daysReached15,
                totalActiveDays,
                project200Count: ref._count?.project200Contacts || 0
            };
        });

        return { success: true, data: mapped };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getAgentesParaSelect() {
    try {
        const adminUser = await getAuthenticatedAdmin();

        const agentes = await prisma.user.findMany({
            where: {
                agencyId: adminUser.effectiveAgencyId,
                role: { in: ["AGENTE", "ADMIN", "SUPER_ADMIN"] },
                active: true
            },
            select: {
                id: true,
                name: true,
                email: true,
                _count: {
                    select: {
                        referidores: true
                    }
                }
            },
            orderBy: { name: "asc" }
        });

        return {
            success: true,
            data: agentes.map((a) => ({
                id: a.id,
                name: a.name || a.email,
                email: a.email,
                referidoresCount: a._count?.referidores || 0,
                maxAllowed: MAX_REFERIDORES_PER_AGENT
            }))
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function createReferidor(data: {
    name: string;
    email: string;
    phone?: string;
    linkedAgentId: string;
    tempPassword?: string;
    commissionPct?: number;
    bonusPct?: number;
}) {
    try {
        const adminUser = await getAuthenticatedAdmin();

        if (!data.name || !data.email || !data.linkedAgentId) {
            throw new Error("Faltan datos obligatorios");
        }

        const email = data.email.trim().toLowerCase();
        const commissionPct = Number(data.commissionPct ?? 30);
        const bonusPct = Number(data.bonusPct ?? 0);

        if (isNaN(commissionPct) || commissionPct < 30 || commissionPct > 50) {
            throw new Error("El % de comisión compartida debe estar entre 30% y 50%.");
        }

        if (isNaN(bonusPct) || bonusPct < 0 || bonusPct > 50) {
            throw new Error("El % de bonos compartidos debe estar entre 0% y 50%.");
        }

        // Verificar que el agente asignado no supere los 5 referidores
        const agentRefCount = await prisma.user.count({
            where: {
                role: "REFERIDOR",
                linkedAgentId: data.linkedAgentId
            }
        });

        if (agentRefCount >= MAX_REFERIDORES_PER_AGENT) {
            throw new Error(
                `El agente seleccionado ya tiene el máximo de ${MAX_REFERIDORES_PER_AGENT} referidores dados de alta.`
            );
        }

        const existing = await prisma.user.findFirst({
            where: { email: { equals: email, mode: "insensitive" } }
        });
        if (existing) {
            throw new Error("El correo ya está registrado en el sistema");
        }

        const passwordToHash = (data.tempPassword || "Temporal123!").trim();
        const hashedPassword = await bcrypt.hash(passwordToHash, 10);

        await prisma.user.create({
            data: {
                name: data.name.trim(),
                email,
                phone: data.phone?.trim() || null,
                password: hashedPassword,
                role: "REFERIDOR",
                agencyId: adminUser.effectiveAgencyId,
                linkedAgentId: data.linkedAgentId,
                mustChangePassword: true,
                termsAccepted: false,
                referidorCommissionPct: commissionPct,
                referidorBonusPct: bonusPct
            }
        });

        revalidatePath("/admin/referidores");
        revalidatePath("/referidores");
        revalidatePath("/admin");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
