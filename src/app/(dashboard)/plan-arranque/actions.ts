"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import twilio from "twilio";

export async function getAgentCurrentDay() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autorizado");

  let progress = await prisma.agentDevelopmentProgress.findUnique({
    where: { userId: session.user.id },
  });

  // Si no tiene progreso, iniciarlo
  if (!progress) {
    progress = await prisma.agentDevelopmentProgress.create({
      data: {
        userId: session.user.id,
        currentDayNumber: 1,
        status: "IN_PROGRESS",
      },
    });
  }

  // If the user doesn't have an agency (e.g. Super Admin viewing the page)
  if (!session.user.agencyId) {
    return {
      progress,
      dayData: null,
      totalDaysCount: 0,
      allDays: [],
    };
  }

  // Obtener todos los días ordenados para armar el Syllabus
  const allDays = await prisma.developmentPlanDay.findMany({
    where: { agencyId: session.user.agencyId },
    orderBy: { dayNumber: "asc" },
  });

  const dayData = allDays.find(d => d.dayNumber === progress.currentDayNumber) || null;
  const totalDaysCount = allDays.length;

  return {
    progress,
    dayData,
    totalDaysCount,
    allDays,
  };
}

export async function completeDay(answersJson?: string, score?: number) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autorizado");
  if (!session.user.agencyId) throw new Error("No tienes agencia asignada");

  const progress = await prisma.agentDevelopmentProgress.findUnique({
    where: { userId: session.user.id },
  });

  if (!progress) throw new Error("Progreso no encontrado");
  if (progress.status === "WAITING_APPROVAL") throw new Error("Ya estás esperando aprobación");

  const dayData = await prisma.developmentPlanDay.findFirst({
    where: {
      agencyId: session.user.agencyId!,
      dayNumber: progress.currentDayNumber,
    },
  });

  if (!dayData) throw new Error("Módulo no configurado por el administrador");

  const agentName = session.user.name || "Un agente";

  if (dayData.requiresAdminApproval || dayData.hasQuestionnaire) {
    // Poner en espera de aprobación y guardar intentos si aplica
    const isQuestionnaire = dayData.hasQuestionnaire && score !== undefined;
    
    await prisma.agentDevelopmentProgress.update({
      where: { userId: session.user.id },
      data: { 
        status: "WAITING_APPROVAL",
        ...(isQuestionnaire ? {
          latestScore: score,
          latestAnswersJson: answersJson,
          questionnaireAttempts: progress.questionnaireAttempts + 1
        } : {})
      },
    });

    // Enviar SMS a los administradores de la agencia
    try {
      let message = `Hola. Tu agente ${agentName} ha marcado el Dia ${dayData.dayNumber} como completado y requiere de tu aprobacion para avanzar en el Plan de Arranque.`;
      let waTemplate: { contentSid: string, contentVariables: Record<string, string> } = {
        contentSid: "HX83cba053486337b24157b6487460dd77",
        contentVariables: {
          "1": agentName,
          "2": dayData.dayNumber.toString()
        }
      };
      
      if (isQuestionnaire) {
        message = `Hola. Tu agente ${agentName} ha finalizado la evaluacion del Dia ${dayData.dayNumber} obteniendo un ${score}%. Por favor revisa sus resultados y aprueba su avance en el sistema.`;
        waTemplate = {
          contentSid: "HX64c40e44fd66c6424a2663b03bc18cd2",
          contentVariables: {
            "1": agentName,
            "2": dayData.dayNumber.toString(),
            "3": score!.toString()
          }
        };
      }

      await sendSmsToAdmins(session.user.agencyId!, message, waTemplate, session.user.id);
    } catch (e) {
      console.error("Error sending Twilio SMS:", e);
    }
  } else {
    // Avanzar automáticamente
    await prisma.agentDevelopmentProgress.update({
      where: { userId: session.user.id },
      data: { currentDayNumber: progress.currentDayNumber + 1 },
    });
  }

  revalidatePath("/plan-arranque");
  revalidatePath("/admin/plan-arranque/seguimiento");
  return { success: true };
}

// Función auxiliar para enviar SMS a todos los ADMIN y SUPER_ADMIN de la agencia que tengan teléfono
async function sendSmsToAdmins(agencyId: string, message: string, waTemplate?: { contentSid: string, contentVariables: Record<string, string> }, agentId?: string) {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER, TWILIO_WHATSAPP_NUMBER } = process.env;
  
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    console.warn("Faltan credenciales de Twilio en las variables de entorno.");
    return;
  }

  const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  const waFromNumber = TWILIO_WHATSAPP_NUMBER || TWILIO_PHONE_NUMBER || '+14155238886';

  let admins: { phone: string | null }[] = [];
  
  if (agentId) {
    const agent = await prisma.user.findUnique({ where: { id: agentId }, select: { reportsToId: true } });
    if (agent?.reportsToId) {
      const assignedAdmin = await prisma.user.findUnique({ where: { id: agent.reportsToId }, select: { phone: true } });
      if (assignedAdmin && assignedAdmin.phone) {
        admins.push(assignedAdmin);
      }
    }
  }

  if (admins.length === 0) {
    admins = await prisma.user.findMany({
      where: {
        agencyId,
        role: { in: ["ADMIN", "SUPER_ADMIN"] },
        phone: { not: null },
      },
      select: { phone: true },
    });
  }

  for (const admin of admins) {
    if (admin.phone) {
        let formattedPhone = admin.phone.startsWith("+") ? admin.phone : `+52${admin.phone}`;
        
        try {
          // Intentar por WhatsApp primero (con plantilla)
          let payload: any = {
            from: `whatsapp:${waFromNumber.startsWith('+') ? waFromNumber : '+' + waFromNumber}`,
            to: `whatsapp:${formattedPhone}`,
          };

          const waApprovalTemplate = process.env.TWILIO_WA_TEMPLATE_APPROVAL_SID || "HX83cba053486337b24157b6487460dd77";
          const waScoreTemplate = process.env.TWILIO_WA_TEMPLATE_SCORE_SID || "HX64c40e44fd66c6424a2663b03bc18cd2";
          
          if (waTemplate && waFromNumber !== '+14155238886') {
             // Reemplazar los hardcoded si existen en ENV
             if (waTemplate.contentSid === "HX83cba053486337b24157b6487460dd77") payload.contentSid = waApprovalTemplate;
             else if (waTemplate.contentSid === "HX64c40e44fd66c6424a2663b03bc18cd2") payload.contentSid = waScoreTemplate;
             else payload.contentSid = waTemplate.contentSid;
             
             payload.contentVariables = JSON.stringify(waTemplate.contentVariables);
          } else {
             payload.body = message;
          }

          await client.messages.create(payload);
        } catch (waErr: any) {
          console.log(`Fallo WhatsApp Template para ${admin.phone}: ${waErr.message}. Intentando WhatsApp Raw...`);
          try {
             // Fallback 1: Intentar WhatsApp sin plantilla (funcionará si hay ventana de 24 horas abierta)
             await client.messages.create({
                from: `whatsapp:${waFromNumber.startsWith('+') ? waFromNumber : '+' + waFromNumber}`,
                to: `whatsapp:${formattedPhone}`,
                body: message
             });
          } catch (rawWaErr: any) {
             console.log(`Fallo WhatsApp Raw para ${admin.phone}: ${rawWaErr.message}. Fallback a SMS...`);
             try {
                // Fallback 2: SMS tradicional
                if (TWILIO_PHONE_NUMBER) {
                  await client.messages.create({
                    body: message,
                    from: TWILIO_PHONE_NUMBER,
                    to: formattedPhone,
                  });
                }
             } catch (smsErr: any) {
                console.error(`Fallo total (Template, Raw, SMS) para ${admin.phone}:`, smsErr.message);
             }
          }
        }
    }
  }
}
