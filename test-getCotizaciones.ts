import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findUnique({
        where: { email: 'enrique.ahumada@aacommx.com' }
    });

    console.log("Usuario:", user?.email, "Role:", user?.role, "AgencyId:", user?.agencyId);

    let whereClause: any = { agencyId: user?.agencyId };
    if (user?.role !== 'SUPER_ADMIN' && user?.role !== 'ADMIN') {
        console.log("Aplicando filtro restrictivo por userId...");
        whereClause.userId = user?.id;
    }

    console.log("Where clause:", whereClause);

    const list = await prisma.cotizacion.findMany({
        where: whereClause,
        orderBy: {
            createdAt: 'desc'
        }
    });

    console.log("Cotizaciones devueltas:", list.length);
    if(list.length > 0) {
        console.log("Primera cotizacion:", list[0]);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
