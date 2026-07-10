const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const agency = await prisma.agency.findUnique({
    where: { slug: 'aacom' }
  });
  if (!agency) {
    console.error("Agency 'aacom' not found");
    return;
  }
  const user = await prisma.user.update({
    where: { email: 'enrique.ahumada@aacommx.com' },
    data: { agencyId: agency.id }
  });
  console.log("Updated Enrique user with agencyId:", user.agencyId);
}

main().catch(console.error).finally(() => prisma.$disconnect());
