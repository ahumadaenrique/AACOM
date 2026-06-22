import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import TeamClient from './TeamClient'

export default async function TeamPage() {
  const session = await auth();
  const dbUser = session?.user?.id ? await prisma.user.findUnique({ where: { id: session.user.id }, include: { agency: true } }) : null;
  const agencyName = dbUser?.agency?.name || 'Agencia';
  
  return <TeamClient agencyName={agencyName} />;
}
