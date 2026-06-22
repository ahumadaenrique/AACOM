import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const u = await prisma.user.findUnique({ where: { email: 'enrique.ahumada@aacommx.com' }, include: { agency: true } });
    console.log("Datos actuales del usuario:", u);
    
    if (u && u.role !== 'SUPER_ADMIN') {
        await prisma.user.update({
            where: { email: 'enrique.ahumada@aacommx.com' },
            data: { role: 'SUPER_ADMIN' }
        });
        console.log("Restaurados privilegios a SUPER_ADMIN en la base de datos.");
    }
}
main().catch(console.error).finally(() => prisma.$disconnect());
