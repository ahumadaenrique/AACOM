const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const agents = await prisma.user.findMany({
        where: { name: { contains: 'Alejandra' } },
        select: { id: true, name: true }
    });
    console.log("Alejandra: ", agents);
    
    if (agents.length > 0) {
        const logs = await prisma.activityLog.findMany({
            where: { userId: agents[0].id }
        });
        console.log("Alejandra's logs count: ", logs.length);
        if (logs.length > 0) {
            console.log("Sample logs: ", logs.slice(0, 3));
            console.log("All dates: ", [...new Set(logs.map(l => l.dateStr))]);
        }
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
