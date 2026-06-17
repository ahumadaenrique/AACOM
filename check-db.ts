import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany();
  console.log('TOTAL USERS:', users.length);
  const admins = await prisma.user.findMany({ where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } } });
  console.log('ADMINS:', admins.map(u => ({ email: u.email, role: u.role, agencyId: u.agencyId })));
}
main().catch(console.error).finally(() => prisma.$disconnect());
