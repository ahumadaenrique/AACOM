import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import AssistantClient from './AssistantClient'

export default async function AssistantPage() {
  const session = await auth();
  
  let user = null;
  if (session?.user?.email) {
    user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { agency: true },
    });
  }

  let agency = user?.agency || null;
  if (!agency && session?.user?.agencyId) {
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
  
  const agencyName = agency?.name || 'AACOM';
  const userName = user?.name || session?.user?.name || 'Agente';
  const userKey = `${agency?.id || 'aacom'}_${user?.id || session?.user?.email || 'anon'}`;
  
  return (
    <AssistantClient
      agencyName={agencyName}
      userName={userName}
      userKey={userKey}
    />
  );
}
