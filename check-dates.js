const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.activityLog.count();
  console.log('Total logs:', count);
  const sample = await prisma.activityLog.findFirst({
    orderBy: { createdAt: 'desc' }
  });
  console.log('Sample dateStr:', sample?.dateStr);
  const uniqueDates = await prisma.activityLog.findMany({
    select: { dateStr: true },
    distinct: ['dateStr'],
    take: 5
  });
  console.log('Unique dates:', uniqueDates);
}
main().catch(console.error).finally(() => prisma.$disconnect());
