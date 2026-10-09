import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { DEFAULT_BENEFITS, LEVELS_CONFIG } from '@/lib/roleplay/gamification';

export async function GET() {
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

    // Agency isolation: SUPER_ADMIN sees all, ADMIN only sees agents from their own agency
    const agencyFilter = dbUser.role === 'SUPER_ADMIN'
      ? {}
      : { user: { agencyId: dbUser.agencyId || undefined } };

    // Load recent calls and ranking concurrently with optimized field selection
    const [calls, agentStats] = await Promise.all([
      prisma.roleplayCall.findMany({
        where: agencyFilter,
        take: 30,
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
      prisma.roleplayStats.findMany({
        where: agencyFilter,
        take: 30,
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

    return NextResponse.json({
      success: true,
      calls,
      agentStats,
      levelsConfig: LEVELS_CONFIG,
      defaultBenefits: DEFAULT_BENEFITS
    });
  } catch (error: any) {
    console.error('Error in roleplay admin route:', error);
    return NextResponse.json({ error: error.message || 'Error en auditoría' }, { status: 500 });
  }
}
