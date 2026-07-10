const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  const agents = await prisma.aIAgent.findMany({
    select: {
      id: true,
      name: true,
      type: true,
      userId: true,
      User: {
        select: {
          id: true,
          name: true,
          email: true,
          googleAccessToken: true,
          googleRefreshToken: true
        }
      }
    }
  });
  console.log("Total agents found:", agents.length);
  for (const a of agents) {
    console.log(`Agent: ${a.name} (${a.type}) [id: ${a.id}]`);
    if (a.User) {
      console.log(`  Belongs to User: ${a.User.name} <${a.User.email}> (${a.User.id})`);
      console.log(`    Google Refresh Token: ${a.User.googleRefreshToken ? "Yes" : "No"}`);
    } else {
      console.log(`  Belongs to User ID: ${a.userId} (USER NOT FOUND IN DB)`);
    }
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
