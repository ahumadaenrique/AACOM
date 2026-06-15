const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const logs = await prisma.activityLog.findMany({
        where: {
            dateStr: { gte: '2026-06-01', lte: '2026-06-07' }
        }
    });
    console.log("Found " + logs.length + " logs between 01 and 07");
    
    const allDates = await prisma.activityLog.findMany({
        select: { dateStr: true },
        distinct: ['dateStr']
    });
    console.log('Available dates in DB:', allDates.map(d => d.dateStr));
}

main().catch(console.error).finally(() => prisma.$disconnect());
