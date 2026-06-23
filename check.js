const { PrismaClient } = require('@prisma/client'); 
const prisma = new PrismaClient(); 

async function main() { 
    const revs = await prisma.performanceReview.findMany({
        include: { agent: true }
    }); 
    
    console.log(JSON.stringify(revs.map(r => ({
        id: r.id, 
        agentName: r.agent?.name, 
        puntos: r.puntosActividad, 
        adns: r.adnsRealizados,
        createdAt: r.createdAt
    })), null, 2));
} 
main().finally(() => prisma.$disconnect());
