const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  const models = ['user', 'aIAgent', 'meeting', 'task', 'interactionLog', 'companyProfile'];
  for (const m of models) {
    try {
      const count = await prisma[m].count();
      console.log(`Table ${m}: ${count} rows`);
    } catch (err) {
      console.error(`Error counting model ${m}:`, err.message);
    }
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
