import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    const session = await auth();
    
    // Solo vendedores o Super Admins pueden iniciar el modo demo de esta manera
    if (!session?.user || (session.user.role !== 'SELLER' && session.user.role !== 'SUPER_ADMIN')) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode") || "admin"; // "admin" o "agent"

    // Auto-crear la Agencia Demo si no existe en producción
    let demoAgency = await prisma.agency.findUnique({ where: { id: 'demo-agency-id' } });
    if (!demoAgency) {
        demoAgency = await prisma.agency.create({
            data: {
                id: 'demo-agency-id',
                name: 'Agencia Demo Élite',
                slug: 'demo',
                primaryColor: '#4f46e5',
                active: true,
                subscriptionStatus: 'active'
            }
        });
    }

    // Auto-crear el Usuario Demo Promotor si no existe en producción
    let demoUser = await prisma.user.findUnique({ where: { id: 'demo-user-id' } });
    if (!demoUser) {
        demoUser = await prisma.user.create({
            data: {
                id: 'demo-user-id',
                email: 'demo@aacommx.com',
                name: 'Promotor Demo (Modo Lectura)',
                role: 'ADMIN',
                active: true,
                agencyId: 'demo-agency-id'
            }
        });
    }

    // Auto-crear el Usuario Demo Agente si no existe en producción
    let demoAgent = await prisma.user.findUnique({ where: { id: 'demo-agent-user-id' } });
    if (!demoAgent) {
        await prisma.user.create({
            data: {
                id: 'demo-agent-user-id',
                email: 'agente.demo@aacommx.com',
                name: 'Carlos Agente Estrella (Modo Lectura)',
                role: 'AGENTE',
                active: true,
                agencyId: 'demo-agency-id'
            }
        });
    }

    // Establecer una cookie segura HttpOnly que expira en 2 horas (tiempo suficiente para una demo)
    cookies().set('demoMode', mode, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 2, // 2 horas
        path: '/'
    });

    return NextResponse.json({ success: true });
}
