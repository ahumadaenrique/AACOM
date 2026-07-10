const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'enrique.ahumada@aacommx.com' },
    include: { agency: true }
  });
  console.log("Enrique User:", user);
}

main().catch(console.error).finally(() => prisma.$disconnect());
