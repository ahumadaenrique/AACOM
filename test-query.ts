import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const adns = await prisma.adnDiagnostic.findMany({
        include: { user: { select: { email: true, agencyId: true } } }
    });
    console.log('Total ADNs en BD:', adns.length);
    if (adns.length > 0) {
        console.log('Muestra de ADNs:');
        console.log(adns.map(a => ({
            id: a.id,
            userEmail: a.user?.email,
            userAgencyId: a.user?.agencyId,
            adnAgencyId: a.agencyId
        })).slice(0, 10));
    }

    const cots = await prisma.cotizacion.findMany({
        include: { user: { select: { email: true, agencyId: true } } }
    });
    console.log('Total Cotizaciones en BD:', cots.length);
    if (cots.length > 0) {
        console.log('Muestra de Cotizaciones:');
        console.log(cots.map(a => ({
            id: a.id,
            userEmail: a.user?.email,
            userAgencyId: a.user?.agencyId,
            cotAgencyId: a.agencyId
        })).slice(0, 10));
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
