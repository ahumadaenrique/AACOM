"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function getNetworkCommissions() {
    try {
        const session = await auth();
        if (!session?.user?.id) throw new Error("No autenticado");

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true }
        });

        if (user?.role !== "SUPER_ADMIN") {
            throw new Error("No tienes permisos para ver esta sección.");
        }

        // Obtener todos los vendedores (SELLER)
        const sellers = await prisma.user.findMany({
            where: { role: "SELLER" },
            select: {
                id: true,
                name: true,
                email: true,
                image: true
            }
        });

        const rawCommissions = await prisma.commissionLedger.findMany({
            orderBy: { createdAt: 'desc' }
        });

        const agencies = await prisma.agency.findMany({
            select: { id: true, name: true, slug: true }
        });
        
        const commissions = rawCommissions.map(c => ({
            ...c,
            agency: agencies.find(a => a.id === c.agencyId) || null
        }));

        // Agrupar comisiones por vendedor y nivel
        const network = sellers.map(seller => {
            const sellerCommissions = commissions.filter(c => c.sellerId === seller.id);
            
            const level1 = sellerCommissions.filter(c => c.level === 1);
            const level2 = sellerCommissions.filter(c => c.level === 2);
            const level3 = sellerCommissions.filter(c => c.level === 3);

            return {
                seller,
                stats: {
                    totalEarned: sellerCommissions.reduce((acc, c) => acc + c.commissionEarned, 0),
                    level1Total: level1.reduce((acc, c) => acc + c.commissionEarned, 0),
                    level2Total: level2.reduce((acc, c) => acc + c.commissionEarned, 0),
                    level3Total: level3.reduce((acc, c) => acc + c.commissionEarned, 0),
                    pendingTotal: sellerCommissions.filter(c => c.status === 'PENDING').reduce((acc, c) => acc + c.commissionEarned, 0),
                    paidTotal: sellerCommissions.filter(c => c.status === 'PAID').reduce((acc, c) => acc + c.commissionEarned, 0)
                },
                commissions: {
                    level1,
                    level2,
                    level3
                }
            };
        });

        return { success: true, network };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}
