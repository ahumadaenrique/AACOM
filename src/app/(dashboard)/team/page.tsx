import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import TeamClient from './TeamClient'

export default async function TeamPage() {
  const session = await auth();
  const dbUser = session?.user?.id ? await prisma.user.findUnique({ where: { id: session.user.id }, include: { agency: true } }) : null;
  const currentAgencyId = session?.user?.agencyId || dbUser?.agencyId;
  
  let agencyName = dbUser?.agency?.name || 'Agencia';
  if (currentAgencyId && currentAgencyId !== dbUser?.agencyId) {
     const impersonatedAgency = await prisma.agency.findUnique({ where: { id: currentAgencyId } });
     if (impersonatedAgency) {
         agencyName = impersonatedAgency.name;
     }
  }
  
  return <TeamClient agencyName={agencyName} />;
}
