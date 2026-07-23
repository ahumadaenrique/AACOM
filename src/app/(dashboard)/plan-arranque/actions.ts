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

  if (!dayData) throw new Error("Día no configurado por el administrador");

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
      
      if (isQuestionnaire) {
        message = `Hola. Tu agente ${agentName} ha finalizado la evaluacion del Dia ${dayData.dayNumber} obteniendo un ${score}%. Por favor revisa sus resultados y aprueba su avance en el sistema.`;
      }

      await sendSmsToAdmins(session.user.agencyId!, message);
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
async function sendSmsToAdmins(agencyId: string, message: string) {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER } = process.env;
  
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    console.warn("Faltan credenciales de Twilio en las variables de entorno.");
    return;
  }

  const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

  const admins = await prisma.user.findMany({
    where: {
      agencyId,
      role: { in: ["ADMIN", "SUPER_ADMIN"] },
      phone: { not: null },
    },
    select: { phone: true },
  });

  for (const admin of admins) {
    if (admin.phone) {
        let formattedPhone = admin.phone.startsWith("+") ? admin.phone : `+52${admin.phone}`;
        
        try {
          // Intentar por WhatsApp primero (más barato)
          await client.messages.create({
            body: message,
            from: `whatsapp:${TWILIO_PHONE_NUMBER.startsWith('+') ? TWILIO_PHONE_NUMBER : '+' + TWILIO_PHONE_NUMBER}`,
            to: `whatsapp:${formattedPhone}`,
          });
        } catch (waErr) {
          // Si falla (ej. no tiene WhatsApp), hacer fallback a SMS normal
          console.log(`Fallback a SMS para ${admin.phone} (WhatsApp falló)`);
          try {
            await client.messages.create({
              body: message,
              from: TWILIO_PHONE_NUMBER,
              to: formattedPhone,
            });
          } catch (smsErr) {
            console.error(`Fallo al enviar SMS a ${admin.phone}`, smsErr);
          }
        }
    }
  }
}
