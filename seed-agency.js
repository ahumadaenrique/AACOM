const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Checking production agency...");
  
  // Find or create the AACOM agency
  let agency = await prisma.agency.findUnique({ where: { slug: 'aacom' } });
  if (!agency) {
    agency = await prisma.agency.create({
      data: {
        name: 'AACOM Seguros',
        slug: 'aacom',
        primaryColor: '#E54A4C',
        active: true,
      }
    });
    console.log("Agency created:", agency.id);
  } else {
    console.log("Agency already exists:", agency.id);
  }

  // Assign ALL users without an agency to this one (safe - doesn't touch existing data)
  const result = await prisma.user.updateMany({
    where: { agencyId: null },
    data: { agencyId: agency.id }
  });
  console.log(`Assigned ${result.count} users to agency AACOM`);

  // Show all users now
  const users = await prisma.user.findMany({ 
    select: { name: true, email: true, role: true, agencyId: true },
    take: 10 
  });
  console.log("Users in production:", users);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
