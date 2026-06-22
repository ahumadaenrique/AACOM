import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import AssistantClient from './AssistantClient'

export default async function AssistantPage() {
  const headersList = headers();
  const slug = headersList.get('x-agency-slug') || 'aacom';
  
  let agency = await prisma.agency.findUnique({ where: { slug } });
  if (!agency) {
    agency = await prisma.agency.findUnique({ where: { slug: 'aacom' } });
  }
  
  const agencyName = agency?.name || 'AACOM Seguros';
  
  return <AssistantClient agencyName={agencyName} />;
}
