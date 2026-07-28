"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function getReferidoresConActividad() {
    try {
        const session = await auth();
        if (!session?.user?.id) throw new Error("No autorizado");

        const adminUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true, agencyId: true }
        });

        if (!adminUser || (adminUser.role !== 'ADMIN' && adminUser.role !== 'SUPER_ADMIN')) {
            throw new Error("Acceso denegado");
        }

        // Fetch referidores in the same agency
        const referidores = await prisma.user.findMany({
            where: {
                role: 'REFERIDOR',
                agencyId: adminUser.agencyId
            },
            include: {
                linkedAgent: {
                    select: {
                        name: true,
                        email: true
                    }
                },
                dailyRecords: {
                    // Fetch today's records
                    where: {
                        date: {
                            gte: new Date(new Date().setHours(0, 0, 0, 0)),
                            lt: new Date(new Date().setHours(23, 59, 59, 999))
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Map data to calculate points
        const mapped = referidores.map(ref => {
            const todayPoints = ref.dailyRecords.reduce((acc, r) => acc + r.real, 0);
            return {
                id: ref.id,
                name: ref.name,
                email: ref.email,
                active: ref.active,
                createdAt: ref.createdAt,
                agentName: ref.linkedAgent?.name || "Sin Agente",
                todayPoints
            };
        });

        return { success: true, data: mapped };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getAgentesParaSelect() {
    try {
        const session = await auth();
        if (!session?.user?.id) throw new Error("No autorizado");

        const adminUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true, agencyId: true }
        });

        if (!adminUser || (adminUser.role !== 'ADMIN' && adminUser.role !== 'SUPER_ADMIN')) {
            throw new Error("Acceso denegado");
        }

        const agentes = await prisma.user.findMany({
            where: {
                agencyId: adminUser.agencyId,
                role: { in: ['AGENTE', 'AGENTE_LITE'] },
                active: true
            },
            select: { id: true, name: true, email: true },
            orderBy: { name: 'asc' }
        });

        return { success: true, data: agentes };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function createReferidor(data: { name: string, email: string, linkedAgentId: string, tempPassword?: string }) {
    try {
        const session = await auth();
        if (!session?.user?.id) throw new Error("No autorizado");

        const adminUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true, agencyId: true }
        });

        if (!adminUser || (adminUser.role !== 'ADMIN' && adminUser.role !== 'SUPER_ADMIN')) {
            throw new Error("Acceso denegado");
        }

        if (!data.name || !data.email || !data.linkedAgentId) {
            throw new Error("Faltan datos obligatorios");
        }

        const email = data.email.toLowerCase();

        // Check if user exists
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            throw new Error("El correo ya está registrado en el sistema");
        }

        const passwordToHash = data.tempPassword || "Temporal123!";
        const hashedPassword = await bcrypt.hash(passwordToHash, 10);

        await prisma.user.create({
            data: {
                name: data.name,
                email,
                password: hashedPassword,
                role: 'REFERIDOR',
                agencyId: adminUser.agencyId,
                linkedAgentId: data.linkedAgentId,
                mustChangePassword: true, // Forcing them to change password
                termsAccepted: false
            }
        });

        revalidatePath("/admin/referidores");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
