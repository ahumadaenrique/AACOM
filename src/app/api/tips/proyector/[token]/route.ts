import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * Canal Público de Solo Lectura para el Proyector (Tablero en Vivo estilo Kahoot).
 * GARANTÍA DE PRIVACIDAD LFPDPPP:
 * - Jamás consulta ni incluye montos, edades, teléfono, correo ni resultados financieros.
 * - Si allowNicknames = true y el asistente tiene apodo, muestra únicamente su apodo.
 */
export async function GET(
  _req: Request,
  { params }: { params: { token: string } }
) {
  try {
    const rawToken = decodeURIComponent(params.token || '').trim();

    const tipsSession = await prisma.tipsSession.findFirst({
      where: {
        OR: [{ projectorToken: rawToken }, { code: rawToken.toUpperCase() }],
      },
      select: {
        id: true,
        code: true,
        title: true,
        location: true,
        expectedCapacity: true,
        status: true,
        unlockedStep: true,
        allowNicknames: true,
        showBoardOnProjector: true,
        inactiveThresholdSec: true,
        host: {
          select: {
            name: true,
            brandColor: true,
            brandLogo: true,
          },
        },
        agency: {
          select: {
            name: true,
            logoUrl: true,
            primaryColor: true,
          },
        },
        // SELECT ESTRICTO: cero columnas financieras o personales sensibles
        participants: {
          where: { status: { not: 'KICKED' } },
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            nickname: true,
            fullName: true,
            currentStep: true,
            completedStep: true,
            status: true,
            lastHeartbeatAt: true,
          },
        },
      },
    });

    if (!tipsSession) {
      return NextResponse.json({ error: 'Sesión no encontrada' }, { status: 404 });
    }

    const nowMs = Date.now();
    const thresholdMs = (tipsSession.inactiveThresholdSec || 180) * 1000;

    const publicParticipants = tipsSession.participants.map((p, index) => {
      // Si el host habilitó apodos y el participante capturó apodo, jamás mostrar fullName en pantalla pública
      const displayName =
        tipsSession.allowNicknames && p.nickname && p.nickname.trim().length > 0
          ? p.nickname.trim()
          : (p.fullName || p.nickname || `Asistente #${index + 1}`).trim();

      const inactiveSeconds = Math.max(
        0,
        Math.floor((nowMs - new Date(p.lastHeartbeatAt).getTime()) / 1000)
      );

      const isReady =
        tipsSession.unlockedStep === 0
          ? true
          : p.completedStep >= tipsSession.unlockedStep;

      const activeStep =
        tipsSession.unlockedStep === 0
          ? 0
          : p.completedStep >= 8
          ? 8
          : Math.min(
              tipsSession.unlockedStep,
              Math.max(p.currentStep || 1, p.completedStep + 1)
            );

      const isBehindPreviousSteps =
        tipsSession.unlockedStep > 1 && p.completedStep < tipsSession.unlockedStep - 1;
      const isInactive = nowMs - new Date(p.lastHeartbeatAt).getTime() > thresholdMs;
      const isLagging =
        p.status !== 'COMPLETED' &&
        tipsSession.status === 'ACTIVE' &&
        !isReady &&
        (isBehindPreviousSteps || isInactive);

      const progressPct = Math.round((Math.min(8, Math.max(0, p.completedStep)) / 8) * 100);

      return {
        id: p.id,
        displayName,
        currentStep: activeStep,
        completedStep: p.completedStep,
        progressPct,
        status: p.completedStep >= 8 ? 'COMPLETED' : isInactive ? 'INACTIVE' : 'ACTIVE',
        inactiveSeconds,
        isReady,
        isLagging,
      };
    });

    const readyCount = publicParticipants.filter((p) => p.isReady).length;
    const completedCount = publicParticipants.filter((p) => p.completedStep >= 8).length;
    const laggingNames = publicParticipants
      .filter((p) => p.isLagging)
      .map((p) => ({
        id: p.id,
        displayName: p.displayName,
        currentStep: p.currentStep,
        completedStep: p.completedStep,
        inactiveSeconds: p.inactiveSeconds,
      }));

    // Contadores por paso (0 a 8)
    const stepCounts: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 };
    for (const p of publicParticipants) {
      const s = Math.max(0, Math.min(8, p.completedStep));
      stepCounts[s] = (stepCounts[s] || 0) + 1;
    }

    return NextResponse.json({
      session: {
        code: tipsSession.code,
        title: tipsSession.title,
        location: tipsSession.location,
        expectedCapacity: tipsSession.expectedCapacity,
        status: tipsSession.status,
        unlockedStep: tipsSession.unlockedStep,
        allowNicknames: tipsSession.allowNicknames,
        showBoardOnProjector: tipsSession.showBoardOnProjector,
        inactiveThresholdSec: tipsSession.inactiveThresholdSec,
        brandName: tipsSession.agency?.name || tipsSession.host?.name || 'TIPS Planeación Patrimonial',
        brandLogo: tipsSession.agency?.logoUrl || tipsSession.host?.brandLogo || null,
        brandColor: tipsSession.agency?.primaryColor || tipsSession.host?.brandColor || '#4f46e5',
        hostName: tipsSession.host?.name || 'Asesor Patrimonial',
      },
      counters: {
        connected: publicParticipants.length,
        expectedCapacity: tipsSession.expectedCapacity,
        readyForUnlockedStep: readyCount,
        completedAll: completedCount,
        laggingCount: laggingNames.length,
        stepCounts,
      },
      laggingList: laggingNames,
      participants: publicParticipants,
    });
  } catch (error) {
    console.error('[TIPS_PROJECTOR_GET_ERROR]', error);
    return NextResponse.json({ error: 'Error al cargar el tablero en vivo' }, { status: 500 });
  }
}
