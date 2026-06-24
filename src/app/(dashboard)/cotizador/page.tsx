import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
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
  
  return <CotizadorClient agencyName={agencyName} agencyLogo={agencyLogo} />;
}
