import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { getAgencyActivityCatalogById } from '@/lib/activityCatalogServer'
import ActivityClient from './ActivityClient'

export default async function ActivityPage() {
  const session = await auth();
  const dbUser = session?.user?.id ? await prisma.user.findUnique({ where: { id: session.user.id }, include: { agency: true } }) : null;
  const impersonateId = dbUser?.role === 'SUPER_ADMIN' ? cookies().get('impersonateAgencyId')?.value : undefined;
  const currentAgencyId = (impersonateId || session?.user?.agencyId || dbUser?.agencyId || 'aacom') as string;
  
  let agencyName = dbUser?.agency?.name || 'Agencia';
  if (currentAgencyId && currentAgencyId !== dbUser?.agencyId) {
     const impersonatedAgency = await prisma.agency.findUnique({ where: { id: currentAgencyId } });
     if (impersonatedAgency) {
         agencyName = impersonatedAgency.name;
     }
  }
  
  const isReferidor = dbUser?.role === 'REFERIDOR';
  const initialActivities = await getAgencyActivityCatalogById(currentAgencyId);
  
  return <ActivityClient agencyName={agencyName} isReferidor={isReferidor} initialActivities={initialActivities} />;
}
