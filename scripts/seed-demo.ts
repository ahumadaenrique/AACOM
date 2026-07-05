import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedDemo() {
    console.log("Seeding Demo Agency...");
    
    let demoAgency = await prisma.agency.findUnique({ where: { slug: 'demo' } });
    if (!demoAgency) {
        demoAgency = await prisma.agency.create({
            data: {
                id: 'demo-agency-id',
                name: 'Agencia Demo Élite',
                slug: 'demo',
                purchasedSeats: 50,
                subscriptionStatus: 'active',
                subscriptionEndDate: new Date('2030-12-31')
            }
        });
    }

    let demoUser = await prisma.user.findUnique({ where: { email: 'demo@aacommx.com' } });
    if (!demoUser) {
        demoUser = await prisma.user.create({
            data: {
                id: 'demo-user-id',
                name: 'Promotor Demo',
                email: 'demo@aacommx.com',
                password: 'demo',
                role: 'ADMIN',
                agencyId: demoAgency.id,
                active: true,
                termsAccepted: true
            }
        });
    }
    
    // Create a demo agent to populate ranking and charts
    let demoAgent = await prisma.user.findUnique({ where: { email: 'agente.demo@aacommx.com' } });
    if (!demoAgent) {
        demoAgent = await prisma.user.create({
            data: {
                id: 'demo-agent-id',
                name: 'Carlos Agente Estrella',
                email: 'agente.demo@aacommx.com',
                password: 'demo',
                role: 'AGENTE',
                agencyId: demoAgency.id,
                active: true,
                termsAccepted: true
            }
        });

        // Add some productivity logs
        await prisma.activityLog.create({
            data: {
                agencyId: demoAgency.id,
                userId: demoAgent.id,
                activityId: '1',
                activityName: 'Cita Nueva Generada',
                points: 10,
                prospectName: 'Prospecto Prueba',
                dateStr: new Date().toISOString().split('T')[0]
            }
        });
    }

    // Give the demo user Cédula A time
    const demoProgress = await prisma.estudioLicencia.findUnique({
        where: { promotor_email_agente_email: { promotor_email: 'demo@aacommx.com', agente_email: 'demo@aacommx.com' } }
    });
    if (!demoProgress) {
        await prisma.estudioLicencia.create({
            data: {
                promotor_email: 'demo@aacommx.com',
                agente_email: 'demo@aacommx.com',
                dias_asignados: 30,
                fecha_expiracion: new Date('2030-12-31')
            }
        });
    }

    console.log("Demo Agency Seeded!");
}

seedDemo().catch(console.error).finally(() => prisma.$disconnect());
