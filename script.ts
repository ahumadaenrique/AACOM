import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const user = await prisma.user.findUnique({
        where: { email: 'ferfierro@gmail.com' },
        include: { developmentProgress: true }
    });
    console.log(JSON.stringify(user?.developmentProgress, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
