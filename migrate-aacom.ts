import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // Find AACOM agency
    const aacom = await prisma.agency.findUnique({
        where: { slug: 'aacom' }
    });

    if (!aacom) {
        console.log("Error: Agencia AACOM no encontrada");
        return;
    }

    const agencyId = aacom.id;
    console.log(`Asignando historial huerfano a la agencia AACOM (ID: ${agencyId})...`);

    // Actualizar usuarios
    const users = await prisma.user.updateMany({
        where: { agencyId: null },
        data: { agencyId }
    });
    console.log(`Usuarios actualizados: ${users.count}`);

    // Actualizar Clientes
    const clients = await prisma.client.updateMany({
        where: { agencyId: null },
        data: { agencyId }
    });
    console.log(`Clientes actualizados: ${clients.count}`);

    // Actualizar Policies
    const policies = await prisma.policy.updateMany({
        where: { agencyId: null },
        data: { agencyId }
    });
    console.log(`Polizas actualizadas: ${policies.count}`);

    // Actualizar Cotizaciones
    const cotizaciones = await prisma.cotizacion.updateMany({
        where: { agencyId: null },
        data: { agencyId }
    });
    console.log(`Cotizaciones actualizadas: ${cotizaciones.count}`);

    // Actualizar AdnDiagnostics
    const adns = await prisma.adnDiagnostic.updateMany({
        where: { agencyId: null },
        data: { agencyId }
    });
    console.log(`ADNs actualizados: ${adns.count}`);

    // Actualizar ActivityLogs
    const logs = await prisma.activityLog.updateMany({
        where: { agencyId: null },
        data: { agencyId }
    });
    console.log(`Actividades (Puntos) actualizadas: ${logs.count}`);
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
