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
  
  const agencyId = agency?.id || user?.agencyId || 'aacom';
  const agencyName = agency?.name || 'AACOM';
  const userName = user?.name || session?.user?.name || 'Agente';
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  // Fetch active knowledge documents (titles only) for UI transparency & 1-click queries
  const activeDocs = await prisma.knowledgeDocument.findMany({
    where: {
      active: true,
      OR: [
        { agencyId },
        { isGlobalTemplate: true },
      ],
    },
    select: {
      id: true,
      title: true,
      isGlobalTemplate: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  // Fetch count of policies accessible to this user/agency
  const policyWhereClause = isAdmin ? { agencyId } : user?.id ? { userId: user.id } : { agencyId };
  const policiesCount = await prisma.policy.count({
    where: policyWhereClause,
  });
  
  return (
    <AssistantClient
      agencyName={agencyName}
      userName={userName}
      isAdmin={isAdmin}
      activeDocs={activeDocs}
      policiesCount={policiesCount}
    />
  );
}
