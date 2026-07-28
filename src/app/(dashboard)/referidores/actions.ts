"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function getMisReferidores() {
    try {
        const session = await auth();
        if (!session?.user?.id) throw new Error("No autorizado");

        // Fetch referidores assigned to this agent
        const referidores = await prisma.user.findMany({
            where: {
                role: 'REFERIDOR',
                linkedAgentId: session.user.id,
                active: true
            },
            include: {
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
            orderBy: { name: 'asc' }
        });

        // Map data to calculate points
        const mapped = referidores.map(ref => {
            const todayPoints = ref.dailyRecords.reduce((acc, r) => acc + r.real, 0);
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
