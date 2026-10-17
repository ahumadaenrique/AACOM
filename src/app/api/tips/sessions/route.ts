import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getAndSyncTipsBalance, TIPS_PACKAGES, grantTipsCreditsPackage } from '@/lib/tips-credits';

function generateSessionCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateProjectorToken(): string {
  const chars = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'proj_';
  for (let i = 0; i < 20; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { agency: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const requestedAgencyId = searchParams.get('agencyId');

    // Aislamiento estricto Multi-Tenant (Regla de Oro: jamás "ALL", default siempre user.agencyId)
    const effectiveAgencyId =
      user.role === 'SUPER_ADMIN' && requestedAgencyId && requestedAgencyId !== 'ALL'
        ? requestedAgencyId
        : user.agencyId || 'aacom';

    const creditStatus = await getAndSyncTipsBalance(user.id, effectiveAgencyId);

    const isManager = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
    const viewScope = searchParams.get('scope'); // 'agency' | 'mine'

    const whereClause =
      isManager && viewScope === 'agency'
        ? { agencyId: effectiveAgencyId }
        : { hostId: user.id, agencyId: effectiveAgencyId };

    const sessions = await prisma.tipsSession.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        host: {
          select: { id: true, name: true, email: true },
        },
        participants: {
          select: {
            id: true,
            nickname: true,
            fullName: true,
            phone: true,
            email: true,
            privacyAccepted: true,
            creditConsumed: true,
            currentStep: true,
            completedStep: true,
            status: true,
            leadScore: true,
            leadTier: true,
            linkedClientId: true,
            lastHeartbeatAt: true,
          },
        },
      },
    });

    const agencyConfig = effectiveAgencyId
      ? await prisma.agency.findUnique({
          where: { id: effectiveAgencyId },
          select: {
            id: true,
            name: true,
            logoUrl: true,
            primaryColor: true,
            allowTipsModule: true,
            tipsCreditsBalance: true,
            tipsShareAgencyCredits: true,
            tipsAllowedAgentIds: true,
            tipsPrivacyNotice: true,
            tipsRealReturnRate: true,
            tipsInflationRate: true,
            tipsLifeExpectancy: true,
          },
        })
      : null;

    // Lista de agentes activos de la promotoría (aislamiento estricto por agencyId) para el selector de créditos compartidos
    const agencyAgents =
      isManager && effectiveAgencyId
        ? await prisma.user.findMany({
            where: {
              agencyId: effectiveAgencyId,
              active: true,
            },
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              tipsCreditsBalance: true,
            },
            orderBy: { name: 'asc' },
          })
        : [];

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        agencyId: effectiveAgencyId,
      },
      agencyConfig,
      agencyAgents,
      credits: creditStatus,
      packages: Object.values(TIPS_PACKAGES),
      sessions,
    });
  } catch (error) {
    console.error('[TIPS_SESSIONS_GET_ERROR]', error);
    return NextResponse.json({ error: 'Error al consultar sesiones TIPS' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { agency: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const {
      title,
      location = 'Presencial',
      expectedCapacity = 50,
      allowNicknames = true,
      inactiveThresholdSec = 180,
    } = body;

    if (!title || String(title).trim().length < 3) {
      return NextResponse.json(
        { error: 'Por favor ingresa un título para el taller (mínimo 3 caracteres).' },
        { status: 400 }
      );
    }

    const effectiveAgencyId = user.agencyId || 'aacom';
    const creditStatus = await getAndSyncTipsBalance(user.id, effectiveAgencyId);

    if (creditStatus.totalAvailableForHost <= 0) {
      return NextResponse.json(
        {
          error: !creditStatus.agencySharesPool
            ? 'No cuentas con créditos TIPS propios ni autorización para usar la bolsa de la promotoría. Adquiere tu paquete de créditos individuales o pide autorización a tu promotor. (Si solo deseas explorar o practicar sin costo, usa el botón "Modo Demo / Práctica").'
            : 'No hay créditos TIPS disponibles en tu cuenta ni en la bolsa de la promotoría. Recarga créditos para abrir una sesión en vivo o utiliza el "Modo Demo / Práctica" sin costo.',
          noCredits: true,
        },
        { status: 402 }
      );
    }

    // Generar código único de 6 caracteres
    let code = generateSessionCode();
    for (let attempt = 0; attempt < 5; attempt++) {
      const exists = await prisma.tipsSession.findUnique({ where: { code } });
      if (!exists) break;
      code = generateSessionCode();
    }

    const projectorToken = generateProjectorToken();

    const customParams = {
      realReturnRatePct: user.agency?.tipsRealReturnRate ?? 4.0,
      inflationRatePct: user.agency?.tipsInflationRate ?? 4.5,
      lifeExpectancy: user.agency?.tipsLifeExpectancy ?? 82.3,
    };

    const created = await prisma.tipsSession.create({
      data: {
        code,
        projectorToken,
        hostId: user.id,
        agencyId: effectiveAgencyId,
        title: String(title).trim(),
        location: String(location || 'Presencial').trim(),
        expectedCapacity: Math.max(5, Math.min(100, Number(expectedCapacity) || 50)),
        status: 'LOBBY',
        unlockedStep: 0,
        allowNicknames: Boolean(allowNicknames),
        showBoardOnProjector: true,
        inactiveThresholdSec: Math.max(60, Math.min(900, Number(inactiveThresholdSec) || 180)),
        customParams,
      },
    });

    return NextResponse.json({ session: created });
  } catch (error) {
    console.error('[TIPS_SESSIONS_POST_ERROR]', error);
    return NextResponse.json({ error: 'Error al crear la sesión TIPS' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const effectiveAgencyId = user.agencyId || 'aacom';

    // Si es SUPER_ADMIN y desea abonar créditos de cortesía / prueba
    if (body.action === 'GRANT_BONUS_CREDITS' && user.role === 'SUPER_ADMIN') {
      const credits = Math.max(1, Math.min(500, Number(body.credits) || 30));
      const target = body.target === 'agency' ? 'agency' : 'user';
      await grantTipsCreditsPackage({
        userId: user.id,
        agencyId: effectiveAgencyId,
        target,
        packageId: 'tips_bonus',
        creditsToAdd: credits,
        amountPaidMxn: 0,
      });
      const updatedCredits = await getAndSyncTipsBalance(user.id, effectiveAgencyId);
      return NextResponse.json({ ok: true, credits: updatedCredits });
    }

    // Actualizar parámetros de la promotoría
    const updatedAgency = await prisma.agency.update({
      where: { id: effectiveAgencyId },
      data: {
        ...(typeof body.tipsShareAgencyCredits === 'boolean'
          ? { tipsShareAgencyCredits: body.tipsShareAgencyCredits }
          : {}),
        ...(Array.isArray(body.tipsAllowedAgentIds)
          ? { tipsAllowedAgentIds: JSON.stringify(body.tipsAllowedAgentIds) }
          : body.tipsAllowedAgentIds === null
          ? { tipsAllowedAgentIds: null }
          : {}),
        ...(typeof body.tipsRealReturnRate === 'number'
          ? { tipsRealReturnRate: body.tipsRealReturnRate }
          : {}),
        ...(typeof body.tipsInflationRate === 'number'
          ? { tipsInflationRate: body.tipsInflationRate }
          : {}),
        ...(typeof body.tipsLifeExpectancy === 'number'
          ? { tipsLifeExpectancy: body.tipsLifeExpectancy }
          : {}),
        ...(typeof body.tipsPrivacyNotice === 'string'
          ? { tipsPrivacyNotice: body.tipsPrivacyNotice }
          : {}),
      },
    });

    return NextResponse.json({ ok: true, agencyConfig: updatedAgency });
  } catch (error) {
    console.error('[TIPS_SESSIONS_PATCH_ERROR]', error);
    return NextResponse.json({ error: 'Error al actualizar configuración TIPS' }, { status: 500 });
  }
}
