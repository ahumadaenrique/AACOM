import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const aacom = await prisma.agency.findUnique({
            where: { slug: 'aacom' }
        });

        if (!aacom) {
            return NextResponse.json({ success: false, error: "Agencia AACOM no encontrada" });
        }

        const agencyId = aacom.id;

        const users = await prisma.user.updateMany({
            where: { agencyId: null },
            data: { agencyId }
        });
        const clients = await prisma.client.updateMany({
            where: { agencyId: null },
            data: { agencyId }
        });
        const policies = await prisma.policy.updateMany({
            where: { agencyId: null },
            data: { agencyId }
        });
        const cotizaciones = await prisma.cotizacion.updateMany({
            where: { agencyId: null },
            data: { agencyId }
        });
        const adns = await prisma.adnDiagnostic.updateMany({
            where: { agencyId: null },
            data: { agencyId }
        });
        const logs = await prisma.activityLog.updateMany({
            where: { agencyId: null },
            data: { agencyId }
        });

        return NextResponse.json({
            success: true,
            message: "Datos historicos migrados a AACOM exitosamente",
            results: {
                users: users.count,
                clients: clients.count,
                policies: policies.count,
                cotizaciones: cotizaciones.count,
                adns: adns.count,
                logs: logs.count
            }
        });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message });
    }
}
