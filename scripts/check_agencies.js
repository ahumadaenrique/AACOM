const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const agencies = await prisma.agency.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      subscriptionStatus: true,
      subscriptionEndDate: true,
      createdAt: true
    }
  });
  console.log('Agencias:', JSON.stringify(agencies, null, 2));

  const saldos = await prisma.promotorSaldo.findMany();
  console.log('Promotor Saldos:', JSON.stringify(saldos, null, 2));

  const licencias = await prisma.estudioLicencia.findMany();
  console.log('Estudio Licencias:', JSON.stringify(licencias, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
