const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Creating AACOM agency...");
  
  // Create or upsert the AACOM agency
  const agency = await prisma.agency.upsert({
    where: { slug: 'aacom' },
    update: {},
    create: {
      name: 'AACOM Seguros',
      slug: 'aacom',
      primaryColor: '#E54A4C',
      active: true,
    }
  });
  console.log("Agency created:", agency.id, agency.slug);

  // Assign the test admin user to this agency
  const user = await prisma.user.update({
    where: { email: 'admin_prueba@aacom.com' },
    data: { agencyId: agency.id }
  });
  console.log("User updated:", user.name, "-> agencyId:", user.agencyId);

  // Also assign all users without an agency to this one
  const updatedUsers = await prisma.user.updateMany({
    where: { agencyId: null },
    data: { agencyId: agency.id }
  });
  console.log("Additional users assigned to agency:", updatedUsers.count);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
