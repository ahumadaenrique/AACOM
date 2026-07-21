const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando migración de datos huérfanos...");
  const defaultAgency = process.env.NEXT_PUBLIC_DEFAULT_AGENCY_SLUG || 'aacom';

  console.log(`Asignando clientes huérfanos a la agencia: ${defaultAgency}`);
  const clientsRes = await prisma.client.updateMany({ 
    where: { agencyId: null }, 
    data: { agencyId: defaultAgency } 
  });
  console.log(`Clientes actualizados: ${clientsRes.count}`);

  console.log(`Asignando pólizas huérfanas a la agencia: ${defaultAgency}`);
  const policiesRes = await prisma.policy.updateMany({ 
    where: { agencyId: null }, 
    data: { agencyId: defaultAgency } 
  });
  console.log(`Pólizas actualizadas: ${policiesRes.count}`);

  console.log(`Asignando registros diarios huérfanos a la agencia: ${defaultAgency}`);
  const dailyRecordsRes = await prisma.dailyRecord.updateMany({ 
    where: { agencyId: null }, 
    data: { agencyId: defaultAgency } 
  });
  console.log(`Registros actualizados: ${dailyRecordsRes.count}`);

  console.log("Migración completada exitosamente.");
}

main()
  .catch((e) => {
    console.error("Error ejecutando migración:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
