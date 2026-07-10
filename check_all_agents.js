const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const agents = await prisma.aIAgent.findMany({
    include: {
      User: true
    }
  });
  console.log("All AI Agents in database:", agents.map(a => ({
    id: a.id,
    name: a.name,
    type: a.type,
    userId: a.userId,
    userEmail: a.User?.email,
    userName: a.User?.name
  })));
}

main().catch(console.error).finally(() => prisma.$disconnect());
