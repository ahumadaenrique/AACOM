import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const superAdmins = await prisma.user.findMany({ where: { role: 'SUPER_ADMIN' } });
  
  let agency = await prisma.agency.findFirst();
  if (!agency) {
    console.log("No agency found. Creating AACOM agency.");
    agency = await prisma.agency.create({
      data: {
        name: "AACOM",
        slug: "aacom",
        primaryColor: "#4f46e5"
      }
    });
  }

  for (const sa of superAdmins) {
    if (!sa.agencyId) {
      await prisma.user.update({
        where: { id: sa.id },
        data: { agencyId: agency.id }
      });
      console.log(`Updated SUPER_ADMIN ${sa.email} to agency ${agency.name}`);
    }
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
