import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import ActivityClient from './ActivityClient'

export default async function ActivityPage() {
  const session = await auth();
  const dbUser = session?.user?.id ? await prisma.user.findUnique({ where: { id: session.user.id }, include: { agency: true } }) : null;
  const agencyName = dbUser?.agency?.name || 'Agencia';
  
  return <ActivityClient agencyName={agencyName} />;
}
