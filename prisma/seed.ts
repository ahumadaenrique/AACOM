
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const adminEmail = 'admin@example.com'

    const upsertAdmin = await prisma.user.upsert({
        where: { email: adminEmail },
        update: {},
        create: {
            email: adminEmail,
            name: 'Admin User',
            password: 'password123', // In real app, hash this!
            role: 'ADMIN',
        },
    })

    console.log({ upsertAdmin })

    const initialAgents = [
        "Miguel Angel Cruz",
        "Alejandra Ahumada",
        "Jorge Antonio Araoz",
        "Raul Alberto Coka",
        "Dalia Sandoval",
        "Samantha Ramos",
        "Viridiana Habana",
        "Claudia Quijada",
        "Areli Arce"
    ]

    console.log("Seeding agents...")
    for (const agentName of initialAgents) {
        const agent = await prisma.agent.upsert({
            where: { name: agentName },
            update: {},
            create: { name: agentName }
        })
        console.log(`Upserted agent: ${agent.name}`)
    }
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
