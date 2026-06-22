import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import CotizadorClient from './CotizadorClient'

export default async function CotizadorPage() {
  const headersList = headers();
  const slug = headersList.get('x-agency-slug') || 'aacom';
  
  let agency = await prisma.agency.findUnique({ where: { slug } });
  if (!agency) {
    agency = await prisma.agency.findUnique({ where: { slug: 'aacom' } });
  }
  
  const agencyName = agency?.name || 'AACOM Seguros';
  const agencyLogo = agency?.logoUrl || '/logo.png';
  
  return <CotizadorClient agencyName={agencyName} agencyLogo={agencyLogo} />;
}
