const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const agents = await prisma.user.findMany({
        where: { role: 'AGENTE', active: true },
        select: { id: true, name: true, email: true }
    });
    console.log("Active Agents: ", agents);
    
    const logs = await prisma.activityLog.findMany({
        where: { dateStr: '2026-06-01' }
    });
    console.log("Logs: ", logs);
}

main().catch(console.error).finally(() => prisma.$disconnect());
