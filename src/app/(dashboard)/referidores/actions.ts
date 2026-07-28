"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function getMisReferidores() {
    try {
        const session = await auth();
        if (!session?.user?.id) throw new Error("No autorizado");

        const dateStr = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' });

        // Fetch referidores assigned to this agent
        const referidores = await prisma.user.findMany({
            where: {
                role: 'REFERIDOR',
                linkedAgentId: session.user.id,
                active: true
            },
            include: {
                activityLogs: {
                    where: { dateStr }
                }
            },
            orderBy: { name: 'asc' }
        });

        // Map data to calculate points
        const mapped = referidores.map(ref => {
            const todayPoints = ref.activityLogs.reduce((acc, log) => acc + log.points, 0);
            return {
                id: ref.id,
                name: ref.name,
                email: ref.email,
                todayPoints
            };
        });

        return { success: true, data: mapped };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getReferidorDetails(referidorId: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) throw new Error("No autorizado");

        const dateStr = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' });

        // Verify referidor belongs to agent
        const referidor = await prisma.user.findFirst({
            where: {
                id: referidorId,
                role: 'REFERIDOR',
                linkedAgentId: session.user.id
            },
            include: {
                activityLogs: {
                    orderBy: { createdAt: 'desc' },
                    take: 50
                }
            }
        });

        if (!referidor) throw new Error("Referidor no encontrado o no tienes permiso para verlo");

        // Calculate today points from activity logs
        const todayLogs = referidor.activityLogs.filter((log: any) => log.dateStr === dateStr);
        const todayPoints = todayLogs.reduce((acc: number, log: any) => acc + log.points, 0);

        return {
            success: true,
            data: {
                id: referidor.id,
                name: referidor.name,
                email: referidor.email,
                todayPoints,
                logs: referidor.activityLogs
            }
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
