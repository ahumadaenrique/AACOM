const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'enrique.ahumada@aacommx.com' },
    select: { termsAccepted: true }
  });
  console.log('User terms:', user);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
