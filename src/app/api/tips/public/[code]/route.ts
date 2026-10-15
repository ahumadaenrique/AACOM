import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { consumeOneTipsCredit } from '@/lib/tips-credits';
import { evaluateTipsDiagnostic } from '@/lib/tips-calculator';

export const dynamic = 'force-dynamic';

const DEFAULT_PRIVACY_NOTICE = `AVISO DE PRIVACIDAD Y CONSENTIMIENTO EXPRESO (LFPDPPP):
Al participar en este Taller Integral de Planeación y Seguridad (TIPS), autorizo expresamente que mi nombre o apodo elegido y mi porcentaje de avance por etapa se proyecten en el tablero grupal de la sesión en vivo frente a los demás participantes.
Mis datos personales (nombre, teléfono, correo electrónico) y mis datos financieros o patrimoniales capturados durante el taller serán tratados de forma estrictamente confidencial y cifrada únicamente por el asesor titular de la sesión y su promotoría con la finalidad de elaborar mi Diagnóstico Patrimonial personalizado y brindarme asesoría sobre alternativas de protección, ahorro y retiro. En ningún momento se mostrarán montos, edades ni resultados financieros en la pantalla pública del taller.`;

export async function GET(
  req: Request,
  { params }: { params: { code: string } }
) {
  try {
    const code = decodeURIComponent(params.code || '').trim().toUpperCase();
    const { searchParams } = new URL(req.url);
    const deviceToken = searchParams.get('deviceToken')?.trim() || '';

    // QA T9: Modo Demo virtual sin consumo de créditos ni persistencia en base de datos
    if (code === 'DEMO') {
      return NextResponse.json({
        session: {
          id: 'demo_session_virtual',
          code: 'DEMO',
          title: 'Taller TIPS — Modo Demo y Capacitación (Sin Consumo de Créditos)',
          location: 'Simulador Interactivo',
          status: 'ACTIVE',
          unlockedStep: 8,
          allowNicknames: true,
          customParams: { realReturnRatePct: 4.0, inflationRatePct: 4.5, lifeExpectancy: 82.3 },
          hostName: 'Asesor Demo TIPS',
          hostPhone: '',
          hostEmail: '',
          brandName: 'TIPS · Modo Capacitación',
          brandLogo: null,
          brandColor: '#4f46e5',
          privacyNoticeText: DEFAULT_PRIVACY_NOTICE,
          isDemo: true,
        },
        participant: null,
      });
    }

    const tipsSession = await prisma.tipsSession.findUnique({
      where: { code },
      include: {
        host: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            brandColor: true,
            brandLogo: true,
          },
        },
        agency: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            primaryColor: true,
            tipsPrivacyNotice: true,
          },
        },
      },
    });

    if (!tipsSession) {
      return NextResponse.json(
        { error: 'El código de sesión TIPS no existe o fue escrito incorrectamente.' },
        { status: 404 }
      );
    }

    let participant = null;
    if (deviceToken) {
      participant = await prisma.tipsParticipant.findUnique({
        where: { deviceToken },
      });
      if (participant && participant.sessionId !== tipsSession.id) {
        participant = null;
      }
      if (participant && participant.status !== 'KICKED') {
        await prisma.tipsParticipant.update({
          where: { id: participant.id },
          data: { lastHeartbeatAt: new Date() },
        });
      }
    }

    return NextResponse.json({
      session: {
        id: tipsSession.id,
        code: tipsSession.code,
        title: tipsSession.title,
        location: tipsSession.location,
        status: tipsSession.status,
        unlockedStep: tipsSession.unlockedStep,
        allowNicknames: tipsSession.allowNicknames,
        customParams: tipsSession.customParams,
        hostName: tipsSession.host?.name || 'Tu Asesor Patrimonial',
        hostPhone: tipsSession.host?.phone || '',
        hostEmail: tipsSession.host?.email || '',
        brandName: tipsSession.agency?.name || tipsSession.host?.name || 'TIPS Planeación Patrimonial',
        brandLogo: tipsSession.agency?.logoUrl || tipsSession.host?.brandLogo || null,
        brandColor: tipsSession.agency?.primaryColor || tipsSession.host?.brandColor || '#4f46e5',
        privacyNoticeText: tipsSession.agency?.tipsPrivacyNotice || DEFAULT_PRIVACY_NOTICE,
      },
      participant,
    });
  } catch (error) {
    console.error('[TIPS_PUBLIC_GET_ERROR]', error);
    return NextResponse.json({ error: 'Error al conectar con la sesión TIPS' }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { code: string } }
) {
  try {
    const code = decodeURIComponent(params.code || '').trim().toUpperCase();
    const body = await req.json().catch(() => ({}));
    const { action, deviceToken } = body;

    if (!deviceToken || String(deviceToken).trim().length < 6) {
      return NextResponse.json({ error: 'Token de dispositivo inválido.' }, { status: 400 });
    }

    const cleanToken = String(deviceToken).trim();

    // QA T9: Si es el modo DEMO, responder sin consumir créditos ni crear registros en BD
    if (code === 'DEMO') {
      const demoSession = {
        id: 'demo_session_virtual',
        code: 'DEMO',
        title: 'Taller TIPS — Modo Demo y Capacitación (Sin Consumo de Créditos)',
        status: 'ACTIVE',
        unlockedStep: 8,
        allowNicknames: true,
        isDemo: true,
      };
      const stepNum =
        action === 'ACCEPT_PRIVACY_AND_STEP1'
          ? 1
          : action === 'REQUEST_APPOINTMENT'
          ? 8
          : Number(body.stepNumber || body.currentStep || 1);
      return NextResponse.json({
        ok: true,
        session: demoSession,
        participant: {
          id: 'demo_participant',
          deviceToken: cleanToken,
          nickname: body.nickname || 'Demo',
          fullName: body.fullName || body.nickname || 'Participante Demo',
          phone: body.phone || '',
          email: body.email || '',
          privacyAccepted: true,
          creditConsumed: false,
          currentStep: Math.min(8, Math.max(1, stepNum)),
          completedStep: Math.min(8, Math.max(1, stepNum)),
          status: stepNum >= 8 ? 'COMPLETED' : 'ACTIVE',
        },
        kicked: false,
      });
    }

    const tipsSession = await prisma.tipsSession.findUnique({
      where: { code },
    });

    if (!tipsSession) {
      return NextResponse.json({ error: 'Sesión no encontrada.' }, { status: 404 });
    }

    if (tipsSession.status === 'CLOSED' && action !== 'REQUEST_APPOINTMENT' && action !== 'HEARTBEAT') {
      return NextResponse.json(
        { error: 'Esta sesión del taller TIPS ya ha concluido.', sessionClosed: true },
        { status: 400 }
      );
    }

    // 1. ENTRAR AL LOBBY CON APODO / NOMBRE PÚBLICO (Sin cobrar crédito aún)
    if (action === 'JOIN_LOBBY') {
      const nickname = String(body.nickname || '').trim();
      if (!nickname) {
        return NextResponse.json(
          { error: 'Por favor ingresa tu nombre o apodo para aparecer en el tablero.' },
          { status: 400 }
        );
      }

      const existing = await prisma.tipsParticipant.findUnique({
        where: { deviceToken: cleanToken },
      });

      if (existing && existing.sessionId === tipsSession.id) {
        if (existing.status === 'KICKED') {
          return NextResponse.json({ error: 'Tu acceso a esta sesión fue retirado por el host.' }, { status: 403 });
        }
        const updated = await prisma.tipsParticipant.update({
          where: { id: existing.id },
          data: {
            nickname,
            lastHeartbeatAt: new Date(),
          },
        });
        return NextResponse.json({ participant: updated, session: tipsSession });
      }

      const created = await prisma.tipsParticipant.create({
        data: {
          sessionId: tipsSession.id,
          agencyId: tipsSession.agencyId,
          deviceToken: cleanToken,
          nickname,
          currentStep: 0,
          completedStep: 0,
          status: 'ACTIVE',
          lastHeartbeatAt: new Date(),
        },
      });

      return NextResponse.json({ participant: created, session: tipsSession });
    }

    // 2. ACEPTAR AVISO DE PRIVACIDAD LFPDPPP + CAPTURAR PASO 1 (Descuenta 1 crédito de forma idempotente)
    if (action === 'ACCEPT_PRIVACY_AND_STEP1') {
      const { privacyAccepted, fullName, phone, email, step1Data, nickname } = body;

      if (!privacyAccepted) {
        return NextResponse.json(
          {
            error:
              'Debes aceptar el Aviso de Privacidad y Consentimiento LFPDPPP para poder guardar tus datos e iniciar el diagnóstico.',
          },
          { status: 400 }
        );
      }

      const cleanFullName = String(fullName || step1Data?.fullName || '').trim();
      const cleanPhone = String(phone || '').trim();
      const cleanEmail = String(email || '').trim().toLowerCase();

      if (!cleanFullName || cleanPhone.length < 8) {
        return NextResponse.json(
          { error: 'Por favor ingresa tu nombre completo y tu número celular (10 dígitos).' },
          { status: 400 }
        );
      }

      const forwardedFor = req.headers.get('x-forwarded-for');
      const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : '0.0.0.0';

      // Buscar si este mismo asistente ya se había registrado en esta sesión desde otro navegador (mismo teléfono)
      const phoneDigits = cleanPhone.replace(/\D/g, '').slice(-10);
      let existingByPhone = null;
      if (phoneDigits.length >= 8) {
        existingByPhone = await prisma.tipsParticipant.findFirst({
          where: {
            sessionId: tipsSession.id,
            phone: { contains: phoneDigits.slice(-8) },
          },
        });
      }

      let currentParticipant = await prisma.tipsParticipant.findUnique({
        where: { deviceToken: cleanToken },
      });

      // Si re-escaneó el QR en otro navegador (ej. cámara nativa vs Chrome) y ya tenía crédito consumido por su teléfono:
      if (
        existingByPhone &&
        (!currentParticipant || existingByPhone.id !== currentParticipant.id)
      ) {
        if (currentParticipant && !currentParticipant.creditConsumed) {
          await prisma.tipsParticipant.delete({ where: { id: currentParticipant.id } }).catch(() => {});
        }
        currentParticipant = await prisma.tipsParticipant.update({
          where: { id: existingByPhone.id },
          data: {
            deviceToken: cleanToken,
            lastHeartbeatAt: new Date(),
          },
        });
      }

      let creditConsumed = Boolean(currentParticipant?.creditConsumed);
      let creditSource = currentParticipant?.creditSource || null;

      // Si aún no ha consumido crédito en esta sesión, descontar 1 crédito de la bolsa del Host o Promotoría
      if (!creditConsumed) {
        const creditResult = await consumeOneTipsCredit({
          hostId: tipsSession.hostId,
          agencyId: tipsSession.agencyId,
        });

        if (!creditResult.success) {
          return NextResponse.json(
            {
              error:
                'El cupo de créditos activos del organizador se ha agotado. Pide al expositor que habilite más lugares desde su panel.',
              noCredits: true,
            },
            { status: 402 }
          );
        }

        creditConsumed = true;
        creditSource = creditResult.source || 'USER';
      }

      const step1Payload = {
        fullName: cleanFullName,
        birthDate: step1Data?.birthDate || '1986-01-01',
        age: step1Data?.age ? Number(step1Data.age) : undefined,
        maritalStatus: step1Data?.maritalStatus || 'CASADO',
        dependentsCount: Number(step1Data?.dependentsCount ?? 0),
        dependentsDetail: step1Data?.dependentsDetail || [],
      };

      const nextCompletedStep = Math.max(currentParticipant?.completedStep || 0, 1);
      const calc = evaluateTipsDiagnostic({
        completedStep: nextCompletedStep,
        step1: step1Payload as any,
        step2: (currentParticipant?.step2Patrimony as any) || null,
        step3: (currentParticipant?.step3Income as any) || null,
        step4: (currentParticipant?.step4Retirement as any) || null,
        step5: (currentParticipant?.step5Dreams as any) || null,
        step6: (currentParticipant?.step6Savings as any) || null,
        step7: (currentParticipant?.step7Insurance as any) || null,
        customParams: tipsSession.customParams as any,
      });

      const saved = currentParticipant
        ? await prisma.tipsParticipant.update({
            where: { id: currentParticipant.id },
            data: {
              nickname: nickname ? String(nickname).trim() : currentParticipant.nickname || cleanFullName.split(' ')[0],
              fullName: cleanFullName,
              phone: cleanPhone,
              email: cleanEmail || null,
              privacyAccepted: true,
              privacyAcceptedAt: currentParticipant.privacyAcceptedAt || new Date(),
              privacyVersion: '1.0',
              privacyIp: clientIp,
              creditConsumed: true,
              creditSource,
              step1General: step1Payload as any,
              currentStep: Math.max(1, currentParticipant.currentStep),
              completedStep: nextCompletedStep,
              calculatedResults: calc as any,
              leadScore: calc.leadScore,
              leadTier: calc.leadTier,
              lastHeartbeatAt: new Date(),
            },
          })
        : await prisma.tipsParticipant.create({
            data: {
              sessionId: tipsSession.id,
              agencyId: tipsSession.agencyId,
              deviceToken: cleanToken,
              nickname: nickname ? String(nickname).trim() : cleanFullName.split(' ')[0],
              fullName: cleanFullName,
              phone: cleanPhone,
              email: cleanEmail || null,
              privacyAccepted: true,
              privacyAcceptedAt: new Date(),
              privacyVersion: '1.0',
              privacyIp: clientIp,
              creditConsumed: true,
              creditSource,
              step1General: step1Payload as any,
              currentStep: 1,
              completedStep: 1,
              calculatedResults: calc as any,
              leadScore: calc.leadScore,
              leadTier: calc.leadTier,
              lastHeartbeatAt: new Date(),
            },
          });

      return NextResponse.json({
        participant: saved,
        session: tipsSession,
      });
    }

    // 3. GUARDAR AVANCE DE UN PASO (2 al 8) — Requiere consentimiento LFPDPPP y que el Host haya liberado el paso
    if (action === 'SAVE_STEP') {
      const stepNumber = Number(body.stepNumber || 0);
      const stepData = body.stepData || {};

      const participant = await prisma.tipsParticipant.findUnique({
        where: { deviceToken: cleanToken },
      });

      if (!participant || participant.sessionId !== tipsSession.id) {
        return NextResponse.json({ error: 'Participante no encontrado en la sesión.' }, { status: 404 });
      }

      if (participant.status === 'KICKED') {
        return NextResponse.json({ error: 'Tu acceso a la sesión fue retirado.' }, { status: 403 });
      }

      // Criterio de aceptación: Sin consentimiento aceptado no se guarda ningún dato financiero
      if (!participant.privacyAccepted || !participant.creditConsumed) {
        return NextResponse.json(
          { error: 'Debes aceptar primero el aviso de privacidad en el Paso 1.' },
          { status: 403 }
        );
      }

      if (tipsSession.status === 'PAUSED') {
        return NextResponse.json(
          { error: 'La sesión está en pausa por el expositor. Espera a que se reanude.', sessionPaused: true },
          { status: 409 }
        );
      }

      // Criterio de aceptación: Ningún asistente puede pasar a un paso que el host no haya liberado
      if (stepNumber > tipsSession.unlockedStep) {
        return NextResponse.json(
          {
            error: `El expositor aún no ha liberado el Paso ${stepNumber}.`,
            unlockedStep: tipsSession.unlockedStep,
          },
          { status: 403 }
        );
      }

      const updateFields: Record<string, any> = {};
      if (stepNumber === 1) updateFields.step1General = stepData;
      if (stepNumber === 2) updateFields.step2Patrimony = stepData;
      if (stepNumber === 3) updateFields.step3Income = stepData;
      if (stepNumber === 4) updateFields.step4Retirement = stepData;
      if (stepNumber === 5) updateFields.step5Dreams = stepData;
      if (stepNumber === 6) updateFields.step6Savings = stepData;
      if (stepNumber === 7) updateFields.step7Insurance = stepData;

      const rawNextCompleted = Math.max(participant.completedStep, stepNumber);
      // Si el participante acaba de guardar el Paso 7 y el Paso 8 ya está desbloqueado, completar 8/8 automáticamente
      const nextCompleted =
        rawNextCompleted === 7 && tipsSession.unlockedStep >= 8 ? 8 : rawNextCompleted;
      const nextCurrent = Math.min(8, Math.max(participant.currentStep, nextCompleted));

      const calc = evaluateTipsDiagnostic({
        completedStep: nextCompleted,
        step1: (stepNumber === 1 ? stepData : participant.step1General) as any,
        step2: (stepNumber === 2 ? stepData : participant.step2Patrimony) as any,
        step3: (stepNumber === 3 ? stepData : participant.step3Income) as any,
        step4: (stepNumber === 4 ? stepData : participant.step4Retirement) as any,
        step5: (stepNumber === 5 ? stepData : participant.step5Dreams) as any,
        step6: (stepNumber === 6 ? stepData : participant.step6Savings) as any,
        step7: (stepNumber === 7 ? stepData : participant.step7Insurance) as any,
        customParams: tipsSession.customParams as any,
      });

      const prevCalc = (participant.calculatedResults as any) || {};
      const mergedCalc = {
        ...calc,
        appointmentRequested: Boolean(prevCalc.appointmentRequested),
        preferredSlot: prevCalc.preferredSlot || null,
      };

      const updated = await prisma.tipsParticipant.update({
        where: { id: participant.id },
        data: {
          ...updateFields,
          currentStep: nextCurrent,
          completedStep: nextCompleted,
          status: nextCompleted >= 8 ? 'COMPLETED' : 'ACTIVE',
          calculatedResults: mergedCalc as any,
          leadScore: calc.leadScore,
          leadTier: calc.leadTier,
          lastHeartbeatAt: new Date(),
        },
      });

      // Si completó 8/8 y es Caliente (HOT >= 70 pts), disparar creación de tarea 48h de forma idempotente (QA T1)
      if (nextCompleted >= 8 && calc.leadTier === 'HOT') {
        const cleanName = (updated.fullName || updated.nickname || 'Prospecto TIPS').trim();
        const dueIn48h = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString().split('T')[0];
        const taskTitle = `🔥 Cita Individual TIPS (48h): ${cleanName}`;
        const existingTask = await prisma.task.findFirst({
          where: { userId: tipsSession.hostId, title: taskTitle },
        });
        if (!existingTask) {
          const gapLabels = calc.detectedGaps.map((g) => g.code).join(', ') || 'Revisión integral';
          await prisma.task.create({
            data: {
              userId: tipsSession.hostId,
              title: taskTitle,
              description: `Agendar sesión individual 1 a 1 tras taller TIPS "${tipsSession.title}" (Score: ${calc.leadScore}/100 - CALIENTE). Tel: ${updated.phone || 'S/N'}. Oportunidades: ${gapLabels}.`,
              dueDate: dueIn48h,
              priority: 'HIGH',
              completed: false,
            },
          });
        }
      }

      return NextResponse.json({
        participant: updated,
        session: {
          status: tipsSession.status,
          unlockedStep: tipsSession.unlockedStep,
        },
      });
    }

    // 4. SOLICITAR CITA INDIVIDUAL EN 1 CLIC (Desde Paso 8 Diagnóstico)
    if (action === 'REQUEST_APPOINTMENT') {
      const preferredSlot = String(body.preferredSlot || 'Próximas 48 horas').trim();
      const participant = await prisma.tipsParticipant.findUnique({
        where: { deviceToken: cleanToken },
      });

      if (!participant || participant.sessionId !== tipsSession.id) {
        return NextResponse.json({ error: 'Participante no encontrado.' }, { status: 404 });
      }

      const calc = evaluateTipsDiagnostic({
        completedStep: Math.max(8, participant.completedStep),
        step1: participant.step1General as any,
        step2: participant.step2Patrimony as any,
        step3: participant.step3Income as any,
        step4: participant.step4Retirement as any,
        step5: participant.step5Dreams as any,
        step6: participant.step6Savings as any,
        step7: participant.step7Insurance as any,
        customParams: tipsSession.customParams as any,
      });

      const mergedCalc = {
        ...calc,
        appointmentRequested: true,
        preferredSlot,
        appointmentRequestedAt: new Date().toISOString(),
      };

      const cleanName = (participant.fullName || participant.nickname || 'Prospecto TIPS').trim();
      const cleanPhone = (participant.phone || '').trim();
      const cleanEmail = (participant.email || '').trim().toLowerCase();

      let targetClientId = participant.linkedClientId;

      if (!targetClientId && (cleanPhone || cleanEmail)) {
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

        const gapsSummary = calc.detectedGaps.map((g) => g.code).join(', ') || 'Revisión integral';
        const sessionTag = `[Taller TIPS #${tipsSession.code}]`;
        const tipsSummaryNote = `${sessionTag} "${tipsSession.title}" (${new Date().toLocaleDateString('es-MX')}) | 📅 PIDIÓ CITA (${preferredSlot}) | Score: ${calc.leadScore}/100 (${calc.leadTier}) | Número Mágico: $${calc.magicNumber.toLocaleString('es-MX')} | Patrimonio Neto: $${calc.netWorth.toLocaleString('es-MX')} | Huecos: ${gapsSummary}`;

        if (existingClient) {
          targetClientId = existingClient.id;
          const currentNotes = existingClient.notes || '';
          if (!currentNotes.includes(sessionTag)) {
            await prisma.client.update({
              where: { id: existingClient.id },
              data: {
                notes: currentNotes ? `${currentNotes}\n${tipsSummaryNote}` : tipsSummaryNote,
              },
            });
          }
        } else {
          const step1 = (participant.step1General as any) || {};
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
        }
      }

      const dueIn48h = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString().split('T')[0];
      const taskTitle = `🔥 Cita Individual TIPS (48h): ${cleanName}`;
      const existingTask = await prisma.task.findFirst({
        where: {
          userId: tipsSession.hostId,
          title: taskTitle,
        },
      });

      if (!existingTask) {
        const gapLabels = calc.detectedGaps.map((g) => g.code).join(', ') || 'Revisión integral';
        await prisma.task.create({
          data: {
            userId: tipsSession.hostId,
            title: taskTitle,
            description: `¡El prospecto solicitó su cita individual desde el celular! Horario preferido: ${preferredSlot}. Taller: "${tipsSession.title}" (Score: ${calc.leadScore}/100). Tel: ${cleanPhone || 'S/N'}. Oportunidades: ${gapLabels}.`,
            dueDate: dueIn48h,
            priority: 'HIGH',
            completed: false,
          },
        });
      }

      const updated = await prisma.tipsParticipant.update({
        where: { id: participant.id },
        data: {
          currentStep: 8,
          completedStep: 8,
          status: 'COMPLETED',
          calculatedResults: mergedCalc as any,
          leadScore: calc.leadScore,
          leadTier: calc.leadTier,
          linkedClientId: targetClientId,
          lastHeartbeatAt: new Date(),
        },
      });

      return NextResponse.json({
        ok: true,
        participant: updated,
      });
    }

    // 5. HEARTBEAT EN TIEMPO REAL (<= 2s)
    if (action === 'HEARTBEAT') {
      const requestedViewStep = Number(body.currentStep || 0);
      let participant = await prisma.tipsParticipant.findUnique({
        where: { deviceToken: cleanToken },
      });

      if (participant && participant.sessionId === tipsSession.id && participant.status !== 'KICKED') {
        const validCurrentStep = Math.min(tipsSession.unlockedStep, Math.max(0, requestedViewStep));

        // QA T1: Si el Host ya liberó el Paso 8 y el participante ya había completado el Paso 7,
        // marcar automáticamente 8/8 (COMPLETED), recalcular score a HOT y generar tarea 48h
        if (tipsSession.unlockedStep >= 8 && participant.completedStep === 7) {
          const calc = evaluateTipsDiagnostic({
            completedStep: 8,
            step1: participant.step1General as any,
            step2: participant.step2Patrimony as any,
            step3: participant.step3Income as any,
            step4: participant.step4Retirement as any,
            step5: participant.step5Dreams as any,
            step6: participant.step6Savings as any,
            step7: participant.step7Insurance as any,
            customParams: tipsSession.customParams as any,
          });
          const prevCalc = (participant.calculatedResults as any) || {};
          const mergedCalc = {
            ...calc,
            appointmentRequested: Boolean(prevCalc.appointmentRequested),
            preferredSlot: prevCalc.preferredSlot || null,
          };

          participant = await prisma.tipsParticipant.update({
            where: { id: participant.id },
            data: {
              currentStep: 8,
              completedStep: 8,
              status: 'COMPLETED',
              calculatedResults: mergedCalc as any,
              leadScore: calc.leadScore,
              leadTier: calc.leadTier,
              lastHeartbeatAt: new Date(),
            },
          });

          if (calc.leadTier === 'HOT') {
            const cleanName = (participant.fullName || participant.nickname || 'Prospecto TIPS').trim();
            const dueIn48h = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString().split('T')[0];
            const taskTitle = `🔥 Cita Individual TIPS (48h): ${cleanName}`;
            const existingTask = await prisma.task.findFirst({
              where: { userId: tipsSession.hostId, title: taskTitle },
            });
            if (!existingTask) {
              const gapLabels = calc.detectedGaps.map((g) => g.code).join(', ') || 'Revisión integral';
              await prisma.task.create({
                data: {
                  userId: tipsSession.hostId,
                  title: taskTitle,
                  description: `Agendar sesión individual 1 a 1 tras taller TIPS "${tipsSession.title}" (Score: ${calc.leadScore}/100 - CALIENTE). Tel: ${participant.phone || 'S/N'}. Oportunidades: ${gapLabels}.`,
                  dueDate: dueIn48h,
                  priority: 'HIGH',
                  completed: false,
                },
              });
            }
          }
        } else {
          participant = await prisma.tipsParticipant.update({
            where: { id: participant.id },
            data: {
              lastHeartbeatAt: new Date(),
              ...(validCurrentStep > 0 ? { currentStep: validCurrentStep } : {}),
            },
          });
        }
      }

      return NextResponse.json({
        session: {
          status: tipsSession.status,
          unlockedStep: tipsSession.unlockedStep,
          allowNicknames: tipsSession.allowNicknames,
        },
        participant,
        kicked: participant?.status === 'KICKED',
      });
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (error) {
    console.error('[TIPS_PUBLIC_POST_ERROR]', error);
    return NextResponse.json({ error: 'Error al procesar datos en la sesión TIPS' }, { status: 500 });
  }
}
