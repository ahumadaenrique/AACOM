import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getAndSyncTipsBalance } from '@/lib/tips-credits';
import { evaluateTipsDiagnostic } from '@/lib/tips-calculator';

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
      // Un asistente solo está "Rezagado" si se quedó atrás en pasos ANTERIORES al actual
      // (completedStep < unlockedStep - 1) o si lleva inactivo más del umbral sin terminar el paso actual.
      const isBehindPreviousSteps =
        tipsSession.unlockedStep > 1 && p.completedStep < tipsSession.unlockedStep - 1;
      const isInactiveTooLong = nowMs - new Date(p.lastHeartbeatAt).getTime() > thresholdMs;
      const isLagging =
        p.status !== 'COMPLETED' &&
        p.completedStep < tipsSession.unlockedStep &&
        (isBehindPreviousSteps || isInactiveTooLong);

      const prevCalc = (p.calculatedResults as any) || null;
      let finalCalc = prevCalc;
      if (
        p.completedStep >= 1 &&
        (!prevCalc || (Number(prevCalc.monthlyIncome || 0) > 0 && Number(prevCalc.magicNumber || 0) === 0))
      ) {
        const recomputed = evaluateTipsDiagnostic({
          completedStep: p.completedStep,
          step1: p.step1General as any,
          step2: p.step2Patrimony as any,
          step3: p.step3Income as any,
          step4: p.step4Retirement as any,
          step5: p.step5Dreams as any,
          step6: p.step6Savings as any,
          step7: p.step7Insurance as any,
          customParams: tipsSession.customParams as any,
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

    const body = await req.json().catch(() => ({}));
    const { action } = body;

    if (action === 'UNLOCK_STEP') {
      const targetStep = Math.max(0, Math.min(8, Number(body.step ?? tipsSession.unlockedStep + 1)));
      const updated = await prisma.tipsSession.update({
        where: { id: tipsSession.id },
        data: {
          unlockedStep: targetStep,
          status: targetStep > 0 && tipsSession.status === 'LOBBY' ? 'ACTIVE' : tipsSession.status,
        },
      });

      // Si el Host libera el Paso 8, promover de inmediato en servidor a quienes ya completaron el Paso 7 (QA T1)
      if (targetStep >= 8) {
        const dueIn48h = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString().split('T')[0];
        for (const p of tipsSession.participants) {
          if (p.status !== 'KICKED' && p.completedStep === 7) {
            const prevCalc = (p.calculatedResults as any) || {};
            const calc = evaluateTipsDiagnostic({
              completedStep: 8,
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
            await prisma.tipsParticipant.update({
              where: { id: p.id },
              data: {
                completedStep: 8,
                currentStep: 8,
                status: 'COMPLETED',
                calculatedResults: mergedCalc as any,
                leadScore: calc.leadScore,
                leadTier: calc.leadTier,
              },
            });

            if (calc.leadTier === 'HOT' && p.privacyAccepted) {
              const cleanName = (p.fullName || p.nickname || 'Prospecto TIPS').trim();
              const taskTitle = `🔥 Cita Individual TIPS (48h): ${cleanName}`;
              const existingTask = await prisma.task.findFirst({
                where: { userId: tipsSession.hostId, title: taskTitle },
              });
              if (!existingTask) {
                const gapLabels =
                  calc.detectedGaps.map((g) => g.code).join(', ') || 'Revisión integral';
                await prisma.task.create({
                  data: {
                    userId: tipsSession.hostId,
                    title: taskTitle,
                    description: `Lead Caliente que completó 8/8 pasos del taller "${tipsSession.title}" (Score: ${calc.leadScore}/100). Tel: ${p.phone || 'S/N'}. Oportunidades detectadas: ${gapLabels}. Patrimonio Neto: $${calc.netWorth.toLocaleString('es-MX')} vs Número Mágico: $${calc.magicNumber.toLocaleString('es-MX')}.`,
                    dueDate: dueIn48h,
                    priority: 'HIGH',
                    completed: false,
                  },
                });
              }
            }
          }
        }
      }

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
        const tipsSummaryNote = `${sessionTag} "${tipsSession.title}" (${new Date().toLocaleDateString('es-MX')}) | Score: ${calc.leadScore}/100 (${calc.leadTier}) | Pasos: ${effectiveCompletedStep}/8 | Nac: ${s1.birthDate || 'S/D'} (${calc.age} años) | Edo. Civil: ${s1.maritalStatus || 'S/D'} | Dependientes: ${s1.dependentsCount ?? 0} | Ingreso: $${calc.monthlyIncome.toLocaleString('es-MX')}/mes | Patrimonio Neto: $${calc.netWorth.toLocaleString('es-MX')} vs Núm. Mágico: $${calc.magicNumber.toLocaleString('es-MX')} | Retiro deseado: ${s4.desiredRetirementAge || 65} años (Régimen: ${s4.imssRegime || 'S/D'}, Afore: $${Number(s4.aforeBalance || 0).toLocaleString('es-MX')}, PPR: ${s4.hasPpr ? 'Sí' : 'No'}) | Ahorro elegido: ${calc.selectedSavingsPct}% ($${calc.selectedMonthlySavings.toLocaleString('es-MX')}/mes) | Sueños: ${dreamsSummary} | Huecos: ${gapsSummary}`;

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

        // Criterio de aceptación: A los leads CALIENTES (8/8 pasos y >= 70 pts) o que pidieron cita se les crea tarea de "Cita individual" a 48h (idempotente)
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
                description: `Lead ${calc.leadTier === 'HOT' ? 'Caliente' : 'con Cita Solicitada'} del taller "${tipsSession.title}" (Score: ${calc.leadScore}/100)${slotNote}. Tel: ${cleanPhone || 'S/N'}. Oportunidades detectadas: ${gapLabels}. Patrimonio Neto: $${calc.netWorth.toLocaleString('es-MX')} vs Número Mágico: $${calc.magicNumber.toLocaleString('es-MX')}.`,
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
