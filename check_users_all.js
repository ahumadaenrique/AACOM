const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const allUsers = await prisma.user.findMany({
        select: { id: true, name: true, role: true, active: true }
    });
    console.log(allUsers);
}
main().catch(console.error).finally(() => prisma.$disconnect());
