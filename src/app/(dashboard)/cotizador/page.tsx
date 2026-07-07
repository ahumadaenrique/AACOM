import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import CotizadorClient from './CotizadorClient'

export default async function CotizadorPage() {
  const session = await auth();
  
  let agency = null;
  if (session?.user?.agencyId) {
    agency = await prisma.agency.findUnique({ where: { id: session.user.agencyId } });
  }

  if (!agency) {
    const headersList = headers();
    const slug = headersList.get('x-agency-slug') || 'aacom';
    agency = await prisma.agency.findUnique({ where: { slug } });
  }
  if (!agency) {
    agency = await prisma.agency.findUnique({ where: { slug: 'aacom' } });
  }
  
  const agencyName = agency?.name || 'SYSGPYA';
  const agencyLogo = agency?.logoUrl || '/logo.png';

  let currentUserName = "";
  let agencyUsers: string[] = [];

  if (session?.user?.email) {
    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    });
    if (dbUser) {
      currentUserName = dbUser.name || "";
      
      const users = await prisma.user.findMany({
        where: { agencyId: dbUser.agencyId },
        select: { name: true },
        orderBy: { name: 'asc' }
      });
      agencyUsers = users.map(u => u.name).filter((name): name is string => !!name);
    }
  }
  
  return <CotizadorClient agencyName={agencyName} agencyLogo={agencyLogo} currentUserName={currentUserName} agencyUsers={agencyUsers} />;
}
