const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const agencies = await prisma.agency.findMany({
    select: { id: true, name: true, slug: true, purchasedSeats: true }
  });

  console.log(JSON.stringify(agencies, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
