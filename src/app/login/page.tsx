import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import LoginClient from './LoginClient'

export default async function LoginPage() {
  const headersList = headers();
  const slug = headersList.get('x-agency-slug') || 'aacom';
  
  let agency = await prisma.agency.findUnique({ where: { slug } });
  if (!agency) {
    agency = await prisma.agency.findUnique({ where: { slug: 'aacom' } });
  }
  
  const agencyName = agency?.name || 'AACOM Seguros';
  const agencyLogo = agency?.logoUrl || '/logo.png';
  
  return <LoginClient agencyName={agencyName} agencyLogo={agencyLogo} />;
}
