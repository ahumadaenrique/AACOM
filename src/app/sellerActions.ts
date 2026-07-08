"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

// ----------------------------------------------------------------------
// SUPER ADMIN ACTIONS
// ----------------------------------------------------------------------

export async function getSellers() {
    const session = await auth();
    if (!session?.user || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN')) {
        throw new Error("Unauthorized");
    }

    const sellers = await prisma.user.findMany({
        where: { role: 'SELLER' },
        include: {
            discountCodes: true,
            commissions: true,
            referredAgencies: {
                select: { id: true, name: true, createdAt: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    return sellers;
}

export async function createSeller(data: { name: string, email: string, commissionRate: number }) {
    const session = await auth();
    if (!session?.user || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN')) {
        throw new Error("Unauthorized");
    }

    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
        throw new Error("El correo ya está registrado.");
    }

    const seller = await prisma.user.create({
        data: {
            name: data.name,
            email: data.email,
            password: "seller123", // Contraseña por defecto
            role: 'SELLER',
            sellerCommissionRate: data.commissionRate,
            active: true
        }
    });

    revalidatePath("/admin/vendedores");
    return seller;
}

export async function updateSeller(sellerId: string, data: { name: string, commissionRate: number }) {
    const session = await auth();
    if (!session?.user || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN')) {
        throw new Error("Unauthorized");
    }

    const seller = await prisma.user.update({
        where: { id: sellerId },
        data: {
            name: data.name,
            sellerCommissionRate: data.commissionRate
        }
    });

    revalidatePath("/admin/vendedores");
    return seller;
}

export async function deleteSeller(sellerId: string) {
    const session = await auth();
    if (!session?.user || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN')) {
        throw new Error("Unauthorized");
    }

    // Soft delete para mantener historial de comisiones y agencias referidas
    const seller = await prisma.user.update({
        where: { id: sellerId },
        data: {
            active: false
        }
    });

    revalidatePath("/admin/vendedores");
    return seller;
}

export async function updateSellerCommission(sellerId: string, commissionRate: number) {
    const session = await auth();
    if (!session?.user || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN')) {
        throw new Error("Unauthorized");
    }

    await prisma.user.update({
        where: { id: sellerId },
        data: { sellerCommissionRate: commissionRate }
    });

    revalidatePath("/admin/vendedores");
}

export async function generateSellerCoupon(sellerId: string, code: string, discountPercentage: number) {
    const session = await auth();
    if (!session?.user || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN')) {
        throw new Error("Unauthorized");
    }

    // El descuento máximo permitido a nivel sistema es 30%
    if (discountPercentage > 30) {
        throw new Error("El descuento no puede ser mayor al 30%");
    }

    const seller = await prisma.user.findUnique({ where: { id: sellerId } });
    if (!seller || !seller.sellerCommissionRate) {
        throw new Error("Vendedor no válido");
    }

    if (discountPercentage > seller.sellerCommissionRate) {
        throw new Error("El descuento no puede superar la comisión base del vendedor.");
    }

    const existingCode = await prisma.discountCode.findUnique({ where: { code } });
    if (existingCode) {
        throw new Error("El código ya existe.");
    }

    const coupon = await prisma.discountCode.create({
        data: {
            code: code.toUpperCase(),
            discountPercentage,
            sellerId,
            active: true
        }
    });

    revalidatePath("/admin/vendedores");
    return coupon;
}

export async function markCommissionAsPaid(commissionId: string) {
    const session = await auth();
    if (!session?.user || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN')) {
        throw new Error("Unauthorized");
    }

    await prisma.commissionLedger.update({
        where: { id: commissionId },
        data: { status: 'PAID', updatedAt: new Date() }
    });

    revalidatePath("/admin/vendedores");
}

export async function markAllSellerCommissionsAsPaid(sellerId: string) {
    const session = await auth();
    if (!session?.user || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN')) {
        throw new Error("Unauthorized");
    }

    await prisma.commissionLedger.updateMany({
        where: { sellerId, status: 'PENDING' },
        data: { status: 'PAID', updatedAt: new Date() }
    });

    revalidatePath("/admin/vendedores");
}

// ----------------------------------------------------------------------
// SELLER ACTIONS
// ----------------------------------------------------------------------

export async function getSellerDashboard() {
    const session = await auth();
    if (!session?.user?.email || session.user.role !== 'SELLER') {
        throw new Error("Unauthorized");
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email.toLowerCase() },
        include: {
            discountCodes: true,
            commissions: {
                orderBy: { createdAt: 'desc' }
            },
            referredAgencies: {
                select: { id: true, name: true, createdAt: true, subscriptionStatus: true }
            }
        }
    });

    return user;
}
