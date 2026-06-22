import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import ActivityClient from './ActivityClient'

export default async function ActivityPage() {
  const headersList = headers();
  const slug = headersList.get('x-agency-slug') || 'aacom';
  
  let agency = await prisma.agency.findUnique({ where: { slug } });
  if (!agency) {
    agency = await prisma.agency.findUnique({ where: { slug: 'aacom' } });
  }
  
  const agencyName = agency?.name || 'AACOM Seguros';
  
  return <ActivityClient agencyName={agencyName} />;
}
