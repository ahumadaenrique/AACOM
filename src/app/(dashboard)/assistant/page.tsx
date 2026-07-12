import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import AssistantClient from './AssistantClient'

export default async function AssistantPage() {
  const session = await auth();
  
  let agency = null;
  if (session?.user?.agencyId) {
    agency = await prisma.agency.findUnique({ where: { id: session.user.agencyId } });
  }

  if (!agency) {
    const headersList = headers();
    const slug = headersList.get('x-agency-slug') || process.env.NEXT_PUBLIC_DEFAULT_AGENCY_SLUG || 'aacom';
    agency = await prisma.agency.findUnique({ where: { slug } });
  }
  if (!agency) {
    agency = await prisma.agency.findUnique({ where: { slug: process.env.NEXT_PUBLIC_DEFAULT_AGENCY_SLUG || 'aacom' } });
  }
  
  const agencyName = agency?.name || 'SYSGPYA';
  
  return <AssistantClient agencyName={agencyName} />;
}
