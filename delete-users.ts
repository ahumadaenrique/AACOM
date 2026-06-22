import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Borrando usuarios de prueba...');
    const result = await prisma.user.deleteMany({
        where: {
            OR: [
                { email: 'judith@rnb.com' },
                { email: 'Pedro@agencia1.com' },
                { email: 'pedro@agencia1.com' }
            ]
        }
    });
    console.log(`Usuarios eliminados exitosamente: ${result.count}`);
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
