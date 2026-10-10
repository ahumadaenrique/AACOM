import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { DEFAULT_BENEFITS, LEVELS_CONFIG } from '@/lib/roleplay/gamification';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    const isAuthorized =
      dbUser?.role === 'ADMIN' ||
      dbUser?.role === 'SUPER_ADMIN';

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Acceso restringido: Se requieren permisos de ADMIN o SUPER_ADMIN' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1);
    const pageSize = Math.max(1, Math.min(100, parseInt(searchParams.get('pageSize') || '30') || 30));
    const skip = (page - 1) * pageSize;

    // SaaS Multi-Tenancy: Strict isolation per agency (Super Admin defaults to user's main agency)
    const effectiveAgencyId = dbUser.agencyId || (dbUser.role === 'SUPER_ADMIN' ? 'aacom' : undefined);
    const agencyFilter = effectiveAgencyId
      ? { user: { agencyId: effectiveAgencyId } }
      : {};

    // Load recent calls (paginated), total count, and leaderboard
    const [calls, totalCallsCount, rawAgentStats] = await Promise.all([
      prisma.roleplayCall.findMany({
        where: agencyFilter,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          prospectName: true,
          scenarioTitle: true,
          level: true,
          durationSeconds: true,
          score: true,
          xpEarned: true,
          conversationId: true,
          appointmentClosed: true,
          coachTip: true,
          aciertos: true,
          errores: true,
          transcript: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true
            }
          }
        }
      }),
      prisma.roleplayCall.count({
        where: agencyFilter
      }),
      prisma.roleplayStats.findMany({
        where: agencyFilter,
        take: 50,
        orderBy: { xp: 'desc' },
        select: {
          id: true,
          level: true,
          xp: true,
          streak: true,
          totalCalls: true,
          closedCalls: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      })
    ]);

    // Reconcile and auto-heal totalCalls for agents if their stats record was out of sync
    const userIds = rawAgentStats.map(s => s.user?.id).filter(Boolean) as string[];
    const callCounts = userIds.length > 0 ? await prisma.roleplayCall.groupBy({
      by: ['userId'],
      _count: { id: true },
      where: { userId: { in: userIds } }
    }) : [];

    const realCountsMap = new Map<string, number>();
    callCounts.forEach(c => realCountsMap.set(c.userId, c._count.id));

    const agentStats = await Promise.all(rawAgentStats.map(async st => {
      const realCallCount = realCountsMap.get(st.user?.id || '') || 0;
      const accurateTotal = Math.max(st.totalCalls || 0, realCallCount, st.closedCalls || 0);

      // Auto-heal DB record asynchronously if out of sync
      if ((st.totalCalls || 0) < accurateTotal) {
        prisma.roleplayStats.update({
          where: { id: st.id },
          data: { totalCalls: accurateTotal }
        }).catch(err => console.error("Error auto-healing totalCalls:", err));
      }

      return {
        ...st,
        totalCalls: accurateTotal
      };
    }));

    return NextResponse.json({
      success: true,
      calls,
      pagination: {
        page,
        pageSize,
        totalCalls: totalCallsCount,
        totalPages: Math.max(1, Math.ceil(totalCallsCount / pageSize))
      },
      agentStats,
      levelsConfig: LEVELS_CONFIG,
      defaultBenefits: DEFAULT_BENEFITS
    });
  } catch (error: any) {
    console.error('Error in roleplay admin route:', error);
    return NextResponse.json({ error: error.message || 'Error en auditoría' }, { status: 500 });
  }
}
