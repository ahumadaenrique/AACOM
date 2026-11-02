import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getAndSyncTipsBalance } from '@/lib/tips-credits';
import { evaluateTipsDiagnostic } from '@/lib/tips-calculator';

// Estado efímero en memoria para que /tips/DEMO/host sea 100% interactivo en demos comerciales sin gastar créditos
const demoHostState = {
  status: 'ACTIVE' as 'LOBBY' | 'ACTIVE' | 'PAUSED' | 'CLOSED',
  unlockedStep: 8,
  showBoardOnProjector: true,
  allowNicknames: false,
  inactiveThresholdSec: 180,
};

function buildDemoHostPayload(hostUser: { id: string; name?: string | null; email?: string | null; phone?: string | null; agencyId?: string | null }) {
  const customParams = { realReturnRatePct: 4.0, inflationRatePct: 4.5, lifeExpectancy: 82.3 };

  const demoStep1A = {
    fullName: 'Carlos Mendoza Rivera (Demo)',
    birthDate: '1988-05-14',
    age: 38,
    maritalStatus: 'CASADO' as const,
    dependentsCount: 2,
    dependentsDetail: [
      { name: 'Sofía', age: 8, relationship: 'Hijo(a)' },
      { name: 'Mateo', age: 5, relationship: 'Hijo(a)' },
    ],
  };
  const demoStep2A = {
    assets: [
      { id: 'a1', category: 'INMUEBLE' as const, description: 'Departamento familiar', value: 2400000, annualRatePct: 6.0, liquidity: 'BAJA' as const },
      { id: 'a2', category: 'INVERSION' as const, description: 'CETES / Pagaré Bancario', value: 320000, annualRatePct: 9.5, liquidity: 'ALTA' as const },
    ],
    debts: [
      { id: 'd1', type: 'BUENA' as const, description: 'Hipoteca Bancaria', balance: 1100000, annualCatPct: 10.5, monthlyPayment: 11800 },
    ],
  };
  const demoStep3A = { monthlyIncome: 45000 };
  const demoStep4A = {
    desiredRetirementAge: 65,
    desiredPensionPct: 80,
    imssRegime: 'LEY_97' as const,
    aforeBalance: 380000,
    hasPpr: false,
    pprBalance: 0,
    pprMonthlyContribution: 0,
  };
  const demoStep5A = {
    dreams: [
      { id: 'dr1', name: 'Universidad de los hijos', category: 'DEPENDIENTES' as const, targetAmount: 900000, yearsToGoal: 10, priority: 1 },
      { id: 'dr2', name: 'Libertad Financiera / Retiro', category: 'PROPIO' as const, targetAmount: 2500000, yearsToGoal: 20, priority: 2 },
    ],
  };
  const demoStep6A = { savingsPct: 16, monthlySavingsAmount: 7200 };
  const demoStep7A = {
    policies: [],
    hasLifeInsurance: false,
    hasDisabilityInsurance: false,
    hasGmm: false,
    hasAutoInsurance: true,
    hasHomeInsurance: false,
  };

  const calcA = evaluateTipsDiagnostic({
    completedStep: Math.min(8, demoHostState.unlockedStep || 8),
    step1: demoStep1A,
    step2: demoStep2A,
    step3: demoStep3A,
    step4: demoStep4A,
    step5: demoStep5A,
    step6: demoStep6A,
    step7: demoStep7A,
    customParams,
  });

  const demoStep1B = {
    fullName: 'Laura Gómez Torres (Demo)',
    birthDate: '1992-09-20',
    age: 34,
    maritalStatus: 'SOLTERO' as const,
    dependentsCount: 0,
    dependentsDetail: [],
  };
  const demoStep2B = {
    assets: [
      { id: 'b1', category: 'FONDO_EMERGENCIA' as const, description: 'Fondo de liquidez', value: 180000, annualRatePct: 5.0, liquidity: 'ALTA' as const },
    ],
    debts: [],
  };
  const demoStep3B = { monthlyIncome: 35000 };
  const demoStep4B = {
    desiredRetirementAge: 60,
    desiredPensionPct: 80,
    imssRegime: 'LEY_97' as const,
    aforeBalance: 210000,
    hasPpr: true,
    pprBalance: 95000,
    pprMonthlyContribution: 2500,
  };
  const calcB = evaluateTipsDiagnostic({
    completedStep: Math.min(6, demoHostState.unlockedStep || 6),
    step1: demoStep1B,
    step2: demoStep2B,
    step3: demoStep3B,
    step4: demoStep4B,
    customParams,
  });

  const participants = [
    {
      id: 'demo_part_1',
      nickname: 'Carlos M.',
      fullName: 'Carlos Mendoza Rivera (Demo)',
      phone: '5512345678',
      email: 'carlos.demo@ejemplo.com',
      privacyAccepted: true,
      creditConsumed: false,
      currentStep: Math.min(8, Math.max(1, demoHostState.unlockedStep)),
      completedStep: Math.min(8, Math.max(1, demoHostState.unlockedStep)),
      activeStep: Math.min(8, Math.max(1, demoHostState.unlockedStep)),
      status: demoHostState.unlockedStep >= 8 ? 'COMPLETED' : 'ACTIVE',
      step1General: demoStep1A,
      step2Patrimony: demoStep2A,
      step3Income: demoStep3A,
      step4Retirement: demoStep4A,
      step5Dreams: demoStep5A,
      step6Savings: demoStep6A,
      step7Insurance: demoStep7A,
      calculatedResults: {
        ...calcA,
        appointmentRequested: true,
        preferredSlot: 'En las próximas 48 horas (Zoom o Presencial)',
      },
      leadScore: calcA.leadScore,
      leadTier: calcA.leadTier,
      inactiveSeconds: 12,
      isLagging: false,
      isReadyForCurrentStep: true,
      linkedClientId: null,
      linkedClient: null,
    },
    {
      id: 'demo_part_2',
      nickname: 'Laura G.',
      fullName: 'Laura Gómez Torres (Demo)',
      phone: '5587654321',
      email: 'laura.demo@ejemplo.com',
      privacyAccepted: true,
      creditConsumed: false,
      currentStep: Math.min(6, Math.max(1, demoHostState.unlockedStep)),
      completedStep: Math.min(6, Math.max(1, demoHostState.unlockedStep)),
      activeStep: Math.min(6, Math.max(1, demoHostState.unlockedStep)),
      status: 'ACTIVE',
      step1General: demoStep1B,
      step2Patrimony: demoStep2B,
      step3Income: demoStep3B,
      step4Retirement: demoStep4B,
      step5Dreams: { dreams: [] },
      step6Savings: { savingsPct: 12 },
      step7Insurance: null,
      calculatedResults: calcB,
      leadScore: calcB.leadScore,
      leadTier: calcB.leadTier,
      inactiveSeconds: 28,
      isLagging: false,
      isReadyForCurrentStep: demoHostState.unlockedStep <= 6,
      linkedClientId: null,
      linkedClient: null,
    },
  ];

  return {
    session: {
      id: 'DEMO',
      code: 'DEMO',
      projectorToken: 'DEMO',
      title: 'Taller TIPS — Consola Demo de Práctica (Sin Consumo de Créditos)',
      location: 'Modo Simulación Comercial',
      expectedCapacity: 30,
      status: demoHostState.status,
      unlockedStep: demoHostState.unlockedStep,
      allowNicknames: demoHostState.allowNicknames,
      showBoardOnProjector: demoHostState.showBoardOnProjector,
      inactiveThresholdSec: demoHostState.inactiveThresholdSec,
      customParams,
      isDemo: true,
      host: {
        id: hostUser.id,
        name: hostUser.name || 'Asesor Anfitrión',
        email: hostUser.email || '',
        phone: hostUser.phone || '',
      },
      agency: {
        id: hostUser.agencyId || 'aacom',
        name: 'aacomsoft',
      },
      participants,
    },
    stats: {
      totalConnected: participants.length,
      readyForUnlockedStep: participants.filter((p) => p.isReadyForCurrentStep).length,
      laggingCount: 0,
      completedAllCount: participants.filter((p) => p.completedStep >= 8).length,
    },
  };
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    if (String(params.id || '').toUpperCase() === 'DEMO') {
      const creditStatus = await getAndSyncTipsBalance(user.id, user.agencyId);
      const demoPayload = buildDemoHostPayload(user);
      return NextResponse.json({
        ...demoPayload,
        credits: creditStatus,
      });
    }

    const tipsSession = await prisma.tipsSession.findUnique({
      where: { id: params.id },
      include: {
        host: {
          select: { id: true, name: true, email: true, phone: true, brandColor: true, brandLogo: true },
        },
        agency: {
          select: { id: true, name: true, logoUrl: true, primaryColor: true },
        },
        participants: {
          where: { status: { not: 'KICKED' } },
          orderBy: { createdAt: 'asc' },
          include: {
            linkedClient: {
              select: {
                id: true,
                name: true,
                policies: {
                  where: { isArchived: false },
                  select: { id: true, policyNumber: true, ramo: true, product: true, insuranceCompany: true, annualPremium: true },
                },
              },
            },
          },
        },
      },
    });

    if (!tipsSession) {
      return NextResponse.json({ error: 'Sesión no encontrada' }, { status: 404 });
    }

    // Seguridad Multi-Tenant y por Rol: Un agente no puede ver las sesiones ni diagnósticos de otro agente
    const isSameAgencyManager =
      (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') &&
      (user.role === 'SUPER_ADMIN' || tipsSession.agencyId === user.agencyId);

    if (tipsSession.hostId !== user.id && !isSameAgencyManager) {
      return NextResponse.json(
        { error: 'No tienes permiso para ver los datos de esta sesión.' },
        { status: 403 }
      );
    }

    const nowMs = Date.now();
    const thresholdMs = (tipsSession.inactiveThresholdSec || 180) * 1000;

    const rawCustomParams = (tipsSession.customParams as any) || {};
    const normalizedCustomParams = {
      realReturnRatePct: Number(rawCustomParams.realReturnRatePct ?? 4.0),
      inflationRatePct: Number(rawCustomParams.inflationRatePct ?? 4.5),
      lifeExpectancy:
        !rawCustomParams.lifeExpectancy || Number(rawCustomParams.lifeExpectancy) === 85
          ? 82.3
          : Number(rawCustomParams.lifeExpectancy),
    };

    const enrichedParticipants = tipsSession.participants.map((p) => {
      const inactiveSeconds = Math.max(
        0,
        Math.floor((nowMs - new Date(p.lastHeartbeatAt).getTime()) / 1000)
      );
      const activeStep =
        tipsSession.unlockedStep === 0
          ? 0
          : p.completedStep >= 8
          ? 8
          : Math.min(
              tipsSession.unlockedStep,
              Math.max(p.currentStep || 1, p.completedStep + 1)
            );
      // Un asistente solo está "Rezagado" si la sesión está activa, no ha terminado y lleva inactivo más del umbral
      const isBehindPreviousSteps =
        tipsSession.unlockedStep > 1 && p.completedStep < tipsSession.unlockedStep - 1;
      const isInactiveTooLong = nowMs - new Date(p.lastHeartbeatAt).getTime() > thresholdMs;
      const isLagging =
        tipsSession.status === 'ACTIVE' &&
        p.status !== 'COMPLETED' &&
        p.completedStep < tipsSession.unlockedStep &&
        (isBehindPreviousSteps || isInactiveTooLong);

      const prevCalc = (p.calculatedResults as any) || null;
      let finalCalc = prevCalc;
      if (p.completedStep >= 1) {
        const recomputed = evaluateTipsDiagnostic({
          completedStep: p.completedStep,
          step1: p.step1General as any,
          step2: p.step2Patrimony as any,
          step3: p.step3Income as any,
          step4: p.step4Retirement as any,
          step5: p.step5Dreams as any,
          step6: p.step6Savings as any,
          step7: p.step7Insurance as any,
          customParams: normalizedCustomParams,
        });
        finalCalc = {
          ...recomputed,
          appointmentRequested: Boolean(prevCalc?.appointmentRequested),
          preferredSlot: prevCalc?.preferredSlot || null,
        };
      }

      return {
        ...p,
        calculatedResults: finalCalc,
        activeStep,
        inactiveSeconds,
        isLagging,
        isReadyForCurrentStep:
          tipsSession.unlockedStep === 0
            ? true
            : p.completedStep >= tipsSession.unlockedStep,
      };
    });

    const readyCount = enrichedParticipants.filter((p) => p.isReadyForCurrentStep).length;
    const laggingList = enrichedParticipants.filter((p) => p.isLagging);

    const creditStatus = await getAndSyncTipsBalance(tipsSession.hostId, tipsSession.agencyId);

    return NextResponse.json({
      session: {
        ...tipsSession,
        customParams: normalizedCustomParams,
        participants: enrichedParticipants,
      },
      stats: {
        totalConnected: enrichedParticipants.length,
        readyForUnlockedStep: readyCount,
        laggingCount: laggingList.length,
        completedAllCount: enrichedParticipants.filter((p) => p.completedStep >= 8).length,
      },
      credits: creditStatus,
    });
  } catch (error) {
    console.error('[TIPS_HOST_GET_ERROR]', error);
    return NextResponse.json({ error: 'Error al consultar consola del host' }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const { action } = body;

    // Soporte interactivo para Consola Demo (/tips/DEMO/host)
    if (String(params.id || '').toUpperCase() === 'DEMO') {
      if (action === 'UNLOCK_STEP') {
        demoHostState.unlockedStep = Math.max(0, Math.min(8, Number(body.step ?? demoHostState.unlockedStep + 1)));
        if (demoHostState.unlockedStep > 0 && demoHostState.status === 'LOBBY') {
          demoHostState.status = 'ACTIVE';
        }
      } else if (action === 'TOGGLE_PAUSE') {
        demoHostState.status = demoHostState.status === 'PAUSED' ? 'ACTIVE' : 'PAUSED';
      } else if (action === 'TOGGLE_PROJECTOR_BOARD') {
        demoHostState.showBoardOnProjector = !demoHostState.showBoardOnProjector;
      } else if (action === 'REOPEN_SESSION') {
        demoHostState.status = 'ACTIVE';
      } else if (action === 'CLOSE_SESSION') {
        demoHostState.status = 'CLOSED';
        return NextResponse.json({
          session: { id: 'DEMO', status: 'CLOSED' },
          funnelSummary: { clientsCreated: 0, clientsLinked: 0, tasksCreated: 0 },
        });
      }
      return NextResponse.json({ session: { id: 'DEMO', ...demoHostState } });
    }

    const tipsSession = await prisma.tipsSession.findUnique({
      where: { id: params.id },
      include: { participants: true },
    });

    if (!tipsSession) {
      return NextResponse.json({ error: 'Sesión no encontrada' }, { status: 404 });
    }

    const isSameAgencyManager =
      (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') &&
      (user.role === 'SUPER_ADMIN' || tipsSession.agencyId === user.agencyId);

    if (tipsSession.hostId !== user.id && !isSameAgencyManager) {
      return NextResponse.json({ error: 'No autorizado para controlar esta sesión' }, { status: 403 });
    }

    if (action === 'UNLOCK_STEP') {
      const targetStep = Math.max(0, Math.min(8, Number(body.step ?? tipsSession.unlockedStep + 1)));
      if (targetStep >= 1) {
        const consumedParticipants = tipsSession.participants.filter((p) => p.creditConsumed).length;
        if (consumedParticipants === 0) {
          const creditStatus = await getAndSyncTipsBalance(
            tipsSession.hostId,
            tipsSession.agencyId
          );
          if (creditStatus.totalAvailableForHost <= 0) {
            return NextResponse.json(
              {
                error: !creditStatus.agencySharesPool
                  ? 'No cuentas con créditos TIPS propios ni autorización para usar la bolsa de la promotoría. No es posible iniciar el taller sin créditos.'
                  : 'No hay créditos TIPS disponibles para iniciar este taller.',
                noCredits: true,
              },
              { status: 402 }
            );
          }
        }
      }
      const updated = await prisma.tipsSession.update({
        where: { id: tipsSession.id },
        data: {
          unlockedStep: targetStep,
          status: targetStep > 0 && tipsSession.status === 'LOBBY' ? 'ACTIVE' : tipsSession.status,
        },
      });

      // Nota: Ya no forzamos completedStep = 8 al desbloquear el Paso 8 desde el Host;
      // cada asistente pasará a "✓ Paso 8 listo" cuando abra/complete el Paso 8 en su celular.
      return NextResponse.json({ session: updated });
    }

    if (action === 'TOGGLE_PAUSE') {
      const nextStatus = tipsSession.status === 'PAUSED' ? 'ACTIVE' : 'PAUSED';
      const updated = await prisma.tipsSession.update({
        where: { id: tipsSession.id },
        data: { status: nextStatus },
      });
      return NextResponse.json({ session: updated });
    }

    if (action === 'TOGGLE_PROJECTOR_BOARD') {
      const updated = await prisma.tipsSession.update({
        where: { id: tipsSession.id },
        data: { showBoardOnProjector: !tipsSession.showBoardOnProjector },
      });
      return NextResponse.json({ session: updated });
    }

    if (action === 'TOGGLE_NICKNAMES') {
      const updated = await prisma.tipsSession.update({
        where: { id: tipsSession.id },
        data: { allowNicknames: !tipsSession.allowNicknames },
      });
      return NextResponse.json({ session: updated });
    }

    if (action === 'KICK_PARTICIPANT') {
      const { participantId } = body;
      if (participantId) {
        await prisma.tipsParticipant.update({
          where: { id: participantId },
          data: { status: 'KICKED' },
        });
      }
      return NextResponse.json({ ok: true });
    }

    if (action === 'CLEAN_INACTIVE') {
      const cutoff = new Date(Date.now() - (tipsSession.inactiveThresholdSec || 180) * 1000);
      const res = await prisma.tipsParticipant.updateMany({
        where: {
          sessionId: tipsSession.id,
          status: { not: 'KICKED' },
          completedStep: { lt: 8 },
          lastHeartbeatAt: { lt: cutoff },
        },
        data: { status: 'KICKED' },
      });
      return NextResponse.json({ ok: true, cleanedCount: res.count });
    }

    if (action === 'EXTEND_TIME') {
      const extraSec = Math.max(60, Math.min(600, Number(body.extraSeconds) || 120));
      const updated = await prisma.tipsSession.update({
        where: { id: tipsSession.id },
        data: {
          inactiveThresholdSec: Math.min(1800, (tipsSession.inactiveThresholdSec || 180) + extraSec),
        },
      });
      await prisma.tipsParticipant.updateMany({
        where: { sessionId: tipsSession.id, status: 'ACTIVE' },
        data: { lastHeartbeatAt: new Date() },
      });
      return NextResponse.json({ session: updated });
    }

    if (action === 'REOPEN_SESSION') {
      const updated = await prisma.tipsSession.update({
        where: { id: tipsSession.id },
        data: {
          status: 'ACTIVE',
          closedAt: null,
        },
      });
      return NextResponse.json({ session: updated });
    }

    if (action === 'CLOSE_SESSION') {
      // 1. Cerrar la sesión
      const closedSession = await prisma.tipsSession.update({
        where: { id: tipsSession.id },
        data: {
          status: 'CLOSED',
          closedAt: new Date(),
        },
      });

      // 2. Procesar cada asistente identificado y enviarlo automáticamente al embudo del Agente Host
      let clientsCreated = 0;
      let clientsLinked = 0;
      let tasksCreated = 0;

      const dueIn48h = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString().split('T')[0];

      for (const p of tipsSession.participants) {
        if (p.status === 'KICKED' || !p.privacyAccepted) continue;

        const effectiveCompletedStep = p.completedStep >= 7 ? 8 : p.completedStep;
        const prevCalc = (p.calculatedResults as any) || {};
        const calc = evaluateTipsDiagnostic({
          completedStep: effectiveCompletedStep,
          step1: p.step1General as any,
          step2: p.step2Patrimony as any,
          step3: p.step3Income as any,
          step4: p.step4Retirement as any,
          step5: p.step5Dreams as any,
          step6: p.step6Savings as any,
          step7: p.step7Insurance as any,
          customParams: tipsSession.customParams as any,
        });

        const mergedCalc = {
          ...calc,
          appointmentRequested: Boolean(prevCalc.appointmentRequested),
          preferredSlot: prevCalc.preferredSlot || null,
        };

        const cleanName = (p.fullName || p.nickname || 'Prospecto TIPS').trim();
        const cleanPhone = (p.phone || '').trim();
        const cleanEmail = (p.email || '').trim().toLowerCase();

        const s1 = (p.step1General as any) || {};
        const s4 = (p.step4Retirement as any) || {};
        const s5 = (p.step5Dreams as any) || {};
        const dreamsSummary =
          Array.isArray(s5.dreams) && s5.dreams.length > 0
            ? s5.dreams.map((d: any) => `${d.name} ($${Number(d.targetAmount || 0).toLocaleString('es-MX')} en ${d.yearsToGoal}a)`).join(', ')
            : 'Sin sueños registrados';
        const gapsSummary = calc.detectedGaps.map((g) => g.code).join(', ') || 'Sin huecos críticos';
        const sessionTag = `[Taller TIPS #${tipsSession.code}]`;
        const tipsSummaryNote = `${sessionTag} "${tipsSession.title}" (${new Date().toLocaleDateString('es-MX')}) | Potencial Comercial: ${calc.leadScore}/100 (${calc.leadTier}) | Salud Patrimonial: ${calc.patrimonyQualificationScore}/100 (${calc.patrimonySemaphore}) | Pasos: ${effectiveCompletedStep}/8 | Nac: ${s1.birthDate || 'S/D'} (${calc.age} años) | Edo. Civil: ${s1.maritalStatus || 'S/D'} | Dependientes: ${s1.dependentsCount ?? 0} | Ingreso: $${calc.monthlyIncome.toLocaleString('es-MX')}/mes | Patrimonio Neto: $${calc.netWorth.toLocaleString('es-MX')} vs Núm. Mágico: $${calc.magicNumber.toLocaleString('es-MX')} | Retiro deseado: ${s4.desiredRetirementAge || 65} años (Régimen: ${s4.imssRegime || 'S/D'}, Afore: $${Number(s4.aforeBalance || 0).toLocaleString('es-MX')}, PPR: ${s4.hasPpr ? 'Sí' : 'No'}) | Ahorro elegido: ${calc.selectedSavingsPct}% ($${calc.selectedMonthlySavings.toLocaleString('es-MX')}/mes) | Sueños: ${dreamsSummary} | Huecos: ${gapsSummary}`;

        let targetClientId = p.linkedClientId;

        if (targetClientId) {
          const preLinked = await prisma.client.findUnique({
            where: { id: targetClientId },
          });
          if (preLinked) {
            clientsLinked++;
            const currentNotes = preLinked.notes || '';
            const updatedNotes = currentNotes.includes(sessionTag)
              ? currentNotes
                  .split('\n')
                  .map((line) => (line.includes(sessionTag) ? tipsSummaryNote : line))
                  .join('\n')
              : currentNotes
              ? `${currentNotes}\n${tipsSummaryNote}`
              : tipsSummaryNote;
            await prisma.client.update({
              where: { id: preLinked.id },
              data: { notes: updatedNotes },
            });
          } else {
            targetClientId = null;
          }
        }

        if (!targetClientId && (cleanPhone || cleanEmail || cleanName)) {
          // Deduplicar por celular o correo dentro de la cartera del Agente Host
          const orConditions: any[] = [];
          const digits = cleanPhone.replace(/\D/g, '');
          if (digits.length >= 7) {
            orConditions.push({ phone: { contains: digits.slice(-8) } });
          }
          if (cleanEmail.includes('@')) {
            orConditions.push({ email: { equals: cleanEmail, mode: 'insensitive' } });
          }

          const existingClient =
            orConditions.length > 0
              ? await prisma.client.findFirst({
                  where: {
                    userId: tipsSession.hostId,
                    agencyId: tipsSession.agencyId,
                    isArchived: false,
                    OR: orConditions,
                  },
                })
              : null;

          if (existingClient) {
            targetClientId = existingClient.id;
            clientsLinked++;
            const currentNotes = existingClient.notes || '';
            const updatedNotes = currentNotes.includes(sessionTag)
              ? currentNotes
                  .split('\n')
                  .map((line) => (line.includes(sessionTag) ? tipsSummaryNote : line))
                  .join('\n')
              : currentNotes
              ? `${currentNotes}\n${tipsSummaryNote}`
              : tipsSummaryNote;
            await prisma.client.update({
              where: { id: existingClient.id },
              data: {
                notes: updatedNotes,
              },
            });
          } else {
            const step1 = (p.step1General as any) || {};
            const parsedBirth = step1.birthDate ? new Date(step1.birthDate) : null;
            const newClient = await prisma.client.create({
              data: {
                name: cleanName,
                phone: cleanPhone || null,
                email: cleanEmail || null,
                birthDate: parsedBirth && !isNaN(parsedBirth.getTime()) ? parsedBirth : null,
                notes: tipsSummaryNote,
                userId: tipsSession.hostId,
                agencyId: tipsSession.agencyId,
              },
            });
            targetClientId = newClient.id;
            clientsCreated++;
          }
        }

        // Actualizar participante con su score definitivo y cliente vinculado
        await prisma.tipsParticipant.update({
          where: { id: p.id },
          data: {
            completedStep: effectiveCompletedStep,
            currentStep: effectiveCompletedStep,
            calculatedResults: mergedCalc as any,
            leadScore: calc.leadScore,
            leadTier: calc.leadTier,
            linkedClientId: targetClientId,
            status: effectiveCompletedStep >= 8 ? 'COMPLETED' : p.status,
          },
        });

        // A los leads CALIENTES (8/8 pasos y >= 70 pts) o que pidieron cita se les crea tarea de "Cita individual" a 48h (idempotente)
        if (calc.leadTier === 'HOT' || mergedCalc.appointmentRequested) {
          const taskTitle = `🔥 Cita Individual TIPS (48h): ${cleanName}`;
          const existingTask = await prisma.task.findFirst({
            where: {
              userId: tipsSession.hostId,
              title: taskTitle,
            },
          });

          if (!existingTask) {
            const gapLabels = calc.detectedGaps.map((g) => g.code).join(', ') || 'Revisión integral';
            const slotNote = mergedCalc.preferredSlot
              ? ` | Horario preferido: ${mergedCalc.preferredSlot}`
              : '';
            await prisma.task.create({
              data: {
                userId: tipsSession.hostId,
                title: taskTitle,
                description: `Lead ${calc.leadTier === 'HOT' ? 'Caliente' : 'con Cita Solicitada'} del taller "${tipsSession.title}" (Potencial Comercial: ${calc.leadScore}/100 | Salud Patrimonial: ${calc.patrimonyQualificationScore}/100)${slotNote}. Tel: ${cleanPhone || 'S/N'}. Oportunidades detectadas: ${gapLabels}. Patrimonio Neto: $${calc.netWorth.toLocaleString('es-MX')} vs Número Mágico: $${calc.magicNumber.toLocaleString('es-MX')}.`,
                dueDate: dueIn48h,
                priority: 'HIGH',
                completed: false,
              },
            });
            tasksCreated++;
          }
        }
      }

      return NextResponse.json({
        session: closedSession,
        funnelSummary: {
          clientsCreated,
          clientsLinked,
          tasksCreated,
        },
      });
    }

    return NextResponse.json({ error: 'Acción no reconocida' }, { status: 400 });
  } catch (error) {
    console.error('[TIPS_HOST_PATCH_ERROR]', error);
    return NextResponse.json({ error: 'Error al ejecutar comando del host' }, { status: 500 });
  }
}
