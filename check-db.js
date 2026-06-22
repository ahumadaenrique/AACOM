const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const agencies = await prisma.agency.findMany();
  console.log("Agencies:", agencies.map(a => a.slug));
  const user = await prisma.user.findUnique({ where: { email: 'admin_prueba@aacom.com' }});
  console.log("Test user agencyId:", user?.agencyId);
}

main().finally(() => prisma.$disconnect());
