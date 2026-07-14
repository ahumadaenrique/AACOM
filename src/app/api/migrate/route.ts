import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const aacom = await prisma.agency.findUnique({
            where: { slug: process.env.NEXT_PUBLIC_DEFAULT_AGENCY_SLUG || 'aacom' }
        });

        if (!aacom) {
            return NextResponse.json({ success: false, error: "Agencia AACOM no encontrada" });
        }

        const agencyId = aacom.id;

        const users = await prisma.user.findMany({ select: { id: true, email: true, agencyId: true, role: true } });
        const cots = await prisma.cotizacion.findMany({ select: { id: true, userId: true, agencyId: true } });
        const adns = await prisma.adnDiagnostic.findMany({ select: { id: true, userId: true, agencyId: true } });
        
        return NextResponse.json({
            success: true,
            message: "Reporte de la base de datos actual de Vercel",
            databaseState: {
                users,
                cotizacionesCount: cots.length,
                cotizacionesSample: cots.slice(0, 10),
                adnsCount: adns.length,
                adnsSample: adns.slice(0, 10)
            }
        });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message });
    }
}
