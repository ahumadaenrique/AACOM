const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: 'Miguel', mode: 'insensitive' } },
        { email: { contains: 'miguel', mode: 'insensitive' } }
      ]
    },
    include: {
      agency: true
    }
  });
  console.log("Users matching Miguel:", users);

  for (const user of users) {
    const agents = await prisma.aIAgent.findMany({
      where: { userId: user.id }
    });
    console.log(`Agents for ${user.email} (${user.id}):`, agents);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
