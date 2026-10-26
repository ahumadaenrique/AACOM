"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

function calculatePriorityScore(params: {
  closingProbability: string;
  estimatedSalary: number;
  relationship: string;
  source?: string;
  attemptsCount?: number;
}): number {
  let score = 0;

  const prob = (params.closingProbability || "MEDIA").toUpperCase();
  if (prob === "ALTA") score += 45;
  else if (prob === "MEDIA") score += 25;
  else score += 10;

  const salary = Number(params.estimatedSalary) || 0;
  if (salary >= 80000) score += 30;
  else if (salary >= 50000) score += 22;
  else if (salary >= 30000) score += 15;
  else if (salary >= 15000) score += 8;
  else score += 3;

  const rel = (params.relationship || "").toLowerCase();
  const src = (params.source || "").toUpperCase();

  if (src === "ENCUESTA_SATISFACCION" || src === "REFERIDO_DIRECTO" || rel.includes("referid")) {
    score += 20;
  } else if (rel.includes("familiar") || rel.includes("amigo") || rel.includes("hermano") || rel.includes("primo")) {
    score += 18;
  } else if (rel.includes("trabajo") || rel.includes("compañero") || rel.includes("colega") || rel.includes("socio") || rel.includes("cliente")) {
    score += 14;
  } else {
    score += 8;
  }

  if ((params.attemptsCount || 0) === 0) {
    score += 5;
  }

  return Math.max(1, Math.min(100, score));
}

function normalizePhone(rawPhone: string): string {
  const digits = String(rawPhone || "").replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("52")) {
    return digits.slice(2);
  }
  if (digits.length === 13 && digits.startsWith("521")) {
    return digits.slice(3);
  }
  return digits.slice(-10);
}

async function getAuthenticatedUser() {
  const session = await auth();
  if (!session?.user?.email) {
    throw new Error("No autenticado");
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: session.user.email.toLowerCase() },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      agencyId: true,
      agency: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!dbUser) {
    throw new Error("Usuario no encontrado");
  }

  return dbUser;
}

export async function getProject200DashboardData() {
  try {
    const user = await getAuthenticatedUser();
    const effectiveAgencyId = user.agencyId || "aacom";

    const [contacts, surveyReferrals, recentLogs] = await Promise.all([
      prisma.project200Contact.findMany({
        where: { userId: user.id },
        include: {
          logs: {
            orderBy: { createdAt: "desc" },
            take: 8,
          },
        },
        orderBy: [
          { priorityScore: "desc" },
          { createdAt: "desc" },
        ],
      }),
      prisma.surveyReferral.findMany({
        where: {
          userId: user.id,
        },
        include: {
          survey: {
            select: {
              intervieweeName: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.project200Log.findMany({
        where: { userId: user.id },
        include: {
          contact: {
            select: { fullName: true, phone: true, classification: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 40,
      }),
    ]);

    const linkedReferralIds = new Set(
      contacts.map((c) => c.surveyReferralId).filter(Boolean)
    );
    const existingPhones = new Set(
      contacts.map((c) => normalizePhone(c.phone))
    );

    const pendingSurveyReferrals = surveyReferrals.filter(
      (sr) =>
        !linkedReferralIds.has(sr.id) &&
        !existingPhones.has(normalizePhone(sr.phone))
    );

    const totalContacts = contacts.length;
    const goalThreshold = 200;
    const missingFor200 = Math.max(0, goalThreshold - totalContacts);
    const hasReached200 = totalContacts >= goalThreshold;
    const progressPercentage = Math.min(
      100,
      Math.round((totalContacts / goalThreshold) * 100)
    );

    const prospectosCount = contacts.filter((c) => c.classification === "PROSPECTO").length;
    const referidoresCount = contacts.filter((c) => c.classification === "REFERIDOR").length;
    const descalificadosCount = contacts.filter((c) => c.classification === "DESCALIFICADO").length;

    const qualifiedCount = prospectosCount + referidoresCount;
    const qualifiedGoalThreshold = 100;
    const missingFor100Qualified = Math.max(0, qualifiedGoalThreshold - qualifiedCount);
    const fuelLevelPct = Math.min(100, Math.round((qualifiedCount / qualifiedGoalThreshold) * 100));
    const fuelStatus: "OPTIMO" | "MEDIO" | "RESERVA" | "CRITICO" =
      qualifiedCount >= 100
        ? "OPTIMO"
        : qualifiedCount >= 65
        ? "MEDIO"
        : qualifiedCount >= 35
        ? "RESERVA"
        : "CRITICO";

    const referralsOriginCount = contacts.filter(
      (c) =>
        c.classification !== "DESCALIFICADO" &&
        (c.source === "ENCUESTA_SATISFACCION" ||
          c.source === "REFERIDO_DIRECTO" ||
          c.classification === "REFERIDOR" ||
          (c.relationship || "").toLowerCase().includes("referid"))
    ).length;
    const baseContactsCount = Math.max(0, qualifiedCount - referralsOriginCount);

    const porContactarCount = contacts.filter((c) => c.status === "POR_CONTACTAR").length;
    const enSeguimientoCount = contacts.filter((c) => c.status === "EN_SEGUIMIENTO").length;
    const citasAgendadasCount = contacts.filter((c) => c.status === "CITA_AGENDADA").length;
    const activeCallableCount = contacts.filter(
      (c) =>
        c.classification !== "DESCALIFICADO" &&
        (c.status === "POR_CONTACTAR" || c.status === "EN_SEGUIMIENTO")
    ).length;

    const totalAttempts = contacts.reduce((acc, c) => acc + (c.attemptsCount || 0), 0);
    const estimatedMarketValue = contacts
      .filter((c) => c.classification !== "DESCALIFICADO")
      .reduce((acc, c) => acc + (Number(c.estimatedSalary) || 0), 0);
    const estimatedMonthlySavingsPotential = Math.round(estimatedMarketValue * 0.1);

    const stats = {
      totalContacts,
      goalThreshold,
      missingFor200,
      hasReached200,
      progressPercentage,
      prospectosCount,
      referidoresCount,
      descalificadosCount,
      qualifiedCount,
      qualifiedGoalThreshold,
      missingFor100Qualified,
      fuelLevelPct,
      fuelStatus,
      referralsOriginCount,
      baseContactsCount,
      activeCallableCount,
      porContactarCount,
      enSeguimientoCount,
      citasAgendadasCount,
      totalAttempts,
      estimatedMarketValue,
      estimatedMonthlySavingsPotential,
    };

    return {
      success: true,
      user: {
        id: user.id,
        name: user.name || "Asesor",
        email: user.email,
        role: user.role,
        agencyId: effectiveAgencyId,
        agencyName: user.agency?.name || "Grupo AACOM",
      },
      contacts,
      pendingSurveyReferrals,
      unimportedReferrals: pendingSurveyReferrals,
      recentLogs,
      stats,
    };
  } catch (error: any) {
    console.error("Error in getProject200DashboardData:", error);
    return {
      success: false,
      error: error.message || "Error al cargar el Proyecto 200",
    };
  }
}

export interface BulkImportRowInput {
  fullName: string;
  phone: string;
  relationship: string;
  estimatedSalary: number | string;
  closingProbability: string;
  classification?: string;
  disqualificationReason?: string;
  notes?: string;
}

export async function bulkImportProject200Contacts(rows: BulkImportRowInput[]) {
  try {
    const user = await getAuthenticatedUser();
    const effectiveAgencyId = user.agencyId || "aacom";

    if (!Array.isArray(rows) || rows.length === 0) {
      return { success: false, error: "No se recibieron contactos válidos para importar." };
    }

    const existingContacts = await prisma.project200Contact.findMany({
      where: { userId: user.id },
      select: { phone: true },
    });

    const existingPhones = new Set(existingContacts.map((c) => normalizePhone(c.phone)));
    const validToCreate: any[] = [];
    const excludedRows: { rowNumber: number; fullName: string; reasons: string[] }[] = [];
    let skippedDuplicates = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2; // Considerando encabezado en fila 1
      const fullName = String(row.fullName || "").trim();
      const cleanPhone = normalizePhone(row.phone);
      const relationship = String(row.relationship || "").trim();
      const rawSalary = String(row.estimatedSalary ?? "").replace(/[^0-9.]/g, "");
      const estimatedSalary = Number(rawSalary) || 0;
      const probRaw = String(row.closingProbability || "")
        .trim()
        .toUpperCase();

      let closingProbability = "";
      if (probRaw.includes("ALT") || probRaw === "A") closingProbability = "ALTA";
      else if (probRaw.includes("MED") || probRaw === "M") closingProbability = "MEDIA";
      else if (probRaw.includes("BAJ") || probRaw === "B") closingProbability = "BAJA";

      const reasons: string[] = [];
      if (fullName.length < 2) reasons.push("Falta Nombre Completo");
      if (cleanPhone.length !== 10) reasons.push("Teléfono inválido (debe tener 10 dígitos)");
      if (!relationship) reasons.push("Falta Relación con el agente");
      if (estimatedSalary <= 0) reasons.push("Falta Sueldo Estimado (> $0)");
      if (!closingProbability) reasons.push("Falta Probabilidad de Cierre (Alta, Media o Baja)");

      const classRaw = String(row.classification || "PROSPECTO").trim().toUpperCase();
      let classification = "PROSPECTO";
      if (classRaw.includes("REF")) classification = "REFERIDOR";
      else if (classRaw.includes("DESC")) classification = "DESCALIFICADO";

      const disqReason = String(row.disqualificationReason || "").trim();
      if (classification === "DESCALIFICADO" && disqReason.length < 3) {
        reasons.push("Descalificado sin motivo especificado");
      }

      if (reasons.length > 0) {
        excludedRows.push({
          rowNumber,
          fullName: fullName || "(Sin nombre)",
          reasons,
        });
        continue;
      }

      if (existingPhones.has(cleanPhone)) {
        skippedDuplicates++;
        excludedRows.push({
          rowNumber,
          fullName,
          reasons: [`Teléfono duplicado (${cleanPhone} ya existe en tu Proyecto 200)`],
        });
        continue;
      }

      existingPhones.add(cleanPhone);

      const priorityScore = calculatePriorityScore({
        closingProbability,
        estimatedSalary,
        relationship,
        source: "EXCEL",
        attemptsCount: 0,
      });

      validToCreate.push({
        userId: user.id,
        agencyId: effectiveAgencyId,
        fullName,
        phone: cleanPhone,
        relationship,
        estimatedSalary,
        closingProbability,
        classification,
        disqualificationReason: classification === "DESCALIFICADO" ? disqReason : null,
        status: classification === "DESCALIFICADO" ? "DESCARTADO" : "POR_CONTACTAR",
        priorityScore,
        source: "EXCEL",
        notes: row.notes ? String(row.notes).trim() : null,
      });
    }

    if (validToCreate.length > 0) {
      await prisma.project200Contact.createMany({
        data: validToCreate,
      });
    }

    const totalAfter = await prisma.project200Contact.count({
      where: { userId: user.id },
    });

    const missingFor200 = Math.max(0, 200 - totalAfter);
    const hasReached200 = totalAfter >= 200;

    const message = hasReached200
      ? `¡Excelente! Se importaron ${validToCreate.length} contactos válidos (${excludedRows.length} filas excluidas). Ya cuentas con ${totalAfter} contactos y cumpliste la meta de 200.`
      : `Se importaron ${validToCreate.length} contactos válidos y se excluyeron ${excludedRows.length} filas incompletas. Actualmente tienes ${totalAfter} contactos; aún te faltan ${missingFor200} contactos válidos para llegar a los 200 requeridos.`;

    revalidatePath("/proyecto-200");
    return {
      success: true,
      importedCount: validToCreate.length,
      excludedCount: excludedRows.length,
      excludedRows,
      skippedDuplicates,
      totalContacts: totalAfter,
      totalValidContactsInDb: totalAfter,
      missingFor200,
      hasReached200,
      message,
    };
  } catch (error: any) {
    console.error("Error in bulkImportProject200Contacts:", error);
    return {
      success: false,
      error: error.message || "Error al importar los contactos.",
    };
  }
}

export async function createProject200Contact(input: {
  fullName: string;
  phone: string;
  relationship: string;
  estimatedSalary: number;
  closingProbability: string;
  classification?: string;
  disqualificationReason?: string;
  source?: string;
  referredByName?: string;
  surveyReferralId?: string;
  notes?: string;
}) {
  try {
    const user = await getAuthenticatedUser();
    const effectiveAgencyId = user.agencyId || "aacom";

    const fullName = String(input.fullName || "").trim();
    const cleanPhone = normalizePhone(input.phone);
    const relationship = String(input.relationship || "").trim();
    const estimatedSalary = Number(input.estimatedSalary) || 0;
    const closingProbability = ["ALTA", "MEDIA", "BAJA"].includes(
      String(input.closingProbability || "").toUpperCase()
    )
      ? String(input.closingProbability).toUpperCase()
      : "MEDIA";

    const classification = ["PROSPECTO", "REFERIDOR", "DESCALIFICADO"].includes(
      String(input.classification || "").toUpperCase()
    )
      ? String(input.classification).toUpperCase()
      : "PROSPECTO";

    if (fullName.length < 2) {
      return { success: false, error: "El nombre completo del contacto es obligatorio." };
    }
    if (cleanPhone.length !== 10) {
      return { success: false, error: "El número telefónico es obligatorio y debe tener 10 dígitos válidos." };
    }
    if (!relationship) {
      return { success: false, error: "La relación con el contacto es obligatoria." };
    }
    if (estimatedSalary <= 0) {
      return { success: false, error: "El sueldo mensual estimado debe ser mayor a $0." };
    }

    const disqReason = String(input.disqualificationReason || "").trim();
    if (classification === "DESCALIFICADO" && disqReason.length < 3) {
      return {
        success: false,
        error: "Es obligatorio especificar el motivo por el cual se descalifica al contacto.",
      };
    }

    const source = input.source || (input.surveyReferralId ? "ENCUESTA_SATISFACCION" : "MANUAL");
    const priorityScore = calculatePriorityScore({
      closingProbability,
      estimatedSalary,
      relationship,
      source,
      attemptsCount: 0,
    });

    const newContact = await prisma.project200Contact.create({
      data: {
        userId: user.id,
        agencyId: effectiveAgencyId,
        fullName,
        phone: cleanPhone,
        relationship,
        estimatedSalary,
        closingProbability,
        classification,
        disqualificationReason: classification === "DESCALIFICADO" ? disqReason : null,
        status: classification === "DESCALIFICADO" ? "DESCARTADO" : "POR_CONTACTAR",
        priorityScore,
        source,
        referredByName: input.referredByName ? String(input.referredByName).trim() : null,
        surveyReferralId: input.surveyReferralId || null,
        notes: input.notes ? String(input.notes).trim() : null,
      },
    });

    if (input.surveyReferralId) {
      await prisma.surveyReferral
        .update({
          where: { id: input.surveyReferralId },
          data: { status: "EN_PROYECTO_200" },
        })
        .catch(() => {});
    }

    await prisma.project200Log.create({
      data: {
        contactId: newContact.id,
        userId: user.id,
        agencyId: effectiveAgencyId,
        actionType: "ALTA_CONTACTO",
        outcome:
          source === "ENCUESTA_SATISFACCION"
            ? `Incorporado desde Encuesta de Satisfacción (Referido por ${input.referredByName || "Cliente"})`
            : `Contacto registrado como ${classification}`,
        notes: input.notes || null,
      },
    });

    revalidatePath("/proyecto-200");
    return { success: true, contact: newContact };
  } catch (error: any) {
    console.error("Error in createProject200Contact:", error);
    return {
      success: false,
      error: error.message || "Error al guardar el contacto.",
    };
  }
}

export async function updateProject200Contact(
  contactId: string,
  input: {
    fullName?: string;
    phone?: string;
    relationship?: string;
    estimatedSalary?: number;
    closingProbability?: string;
    classification?: string;
    disqualificationReason?: string;
    status?: string;
    notes?: string;
  }
) {
  try {
    const user = await getAuthenticatedUser();
    const effectiveAgencyId = user.agencyId || "aacom";

    const existing = await prisma.project200Contact.findUnique({
      where: { id: contactId },
    });

    if (!existing) {
      return { success: false, error: "Contacto no encontrado." };
    }

    const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";
    if (existing.userId !== user.id && !(isAdmin && existing.agencyId === effectiveAgencyId)) {
      return { success: false, error: "No autorizado para modificar este contacto." };
    }

    const nextClassification = input.classification
      ? input.classification.toUpperCase()
      : existing.classification;

    const nextDisqReason =
      input.disqualificationReason !== undefined
        ? String(input.disqualificationReason || "").trim()
        : existing.disqualificationReason || "";

    if (nextClassification === "DESCALIFICADO" && nextDisqReason.length < 3) {
      return {
        success: false,
        error: "Es obligatorio indicar el motivo por el cual se descalifica al candidato.",
      };
    }

    const nextPhone = input.phone !== undefined ? normalizePhone(input.phone) : existing.phone;
    if (nextPhone.length !== 10) {
      return {
        success: false,
        error: "El número telefónico debe contar forzosamente con 10 dígitos.",
      };
    }

    const nextSalary =
      input.estimatedSalary !== undefined ? Number(input.estimatedSalary) : existing.estimatedSalary;
    const nextProb = input.closingProbability
      ? input.closingProbability.toUpperCase()
      : existing.closingProbability;
    const nextRel = input.relationship !== undefined ? input.relationship.trim() : existing.relationship;

    const priorityScore = calculatePriorityScore({
      closingProbability: nextProb,
      estimatedSalary: nextSalary,
      relationship: nextRel,
      source: existing.source,
      attemptsCount: existing.attemptsCount,
    });

    let nextStatus = input.status || existing.status;
    if (nextClassification === "DESCALIFICADO") {
      nextStatus = "DESCARTADO";
    } else if (existing.classification === "DESCALIFICADO" && nextClassification !== "DESCALIFICADO") {
      nextStatus = "POR_CONTACTAR";
    }

    const updated = await prisma.project200Contact.update({
      where: { id: contactId },
      data: {
        fullName: input.fullName !== undefined ? input.fullName.trim() : existing.fullName,
        phone: nextPhone,
        relationship: nextRel,
        estimatedSalary: nextSalary,
        closingProbability: nextProb,
        classification: nextClassification,
        disqualificationReason: nextClassification === "DESCALIFICADO" ? nextDisqReason : null,
        status: nextStatus,
        priorityScore,
        notes: input.notes !== undefined ? input.notes : existing.notes,
      },
    });

    if (nextClassification !== existing.classification) {
      await prisma.project200Log.create({
        data: {
          contactId,
          userId: user.id,
          agencyId: existing.agencyId || effectiveAgencyId,
          actionType: nextClassification === "DESCALIFICADO" ? "DESCALIFICACION" : "RECLASIFICACION",
          outcome:
            nextClassification === "DESCALIFICADO"
              ? `Descalificado: ${nextDisqReason}`
              : `Reclasificado de ${existing.classification} a ${nextClassification}`,
          notes: input.notes || null,
        },
      });
    }

    revalidatePath("/proyecto-200");
    return { success: true, contact: updated };
  } catch (error: any) {
    console.error("Error in updateProject200Contact:", error);
    return {
      success: false,
      error: error.message || "Error al actualizar el contacto.",
    };
  }
}

export async function recordGuidedProspectingAction(input: {
  contactId: string;
  actionType:
    | "CITA_AGENDADA"
    | "NO_CONTESTO"
    | "SEGUIMIENTO_WHATSAPP"
    | "CONVERTIR_REFERIDOR"
    | "DESCALIFICAR";
  scheduledDate?: string;
  scheduledTime?: string;
  disqualificationReason?: string;
  notes?: string;
}) {
  try {
    const user = await getAuthenticatedUser();
    const effectiveAgencyId = user.agencyId || "aacom";

    const contact = await prisma.project200Contact.findUnique({
      where: { id: input.contactId },
    });

    if (!contact || contact.userId !== user.id) {
      return { success: false, error: "Contacto no encontrado." };
    }

    const now = new Date();
    let nextStatus = contact.status;
    let nextClassification = contact.classification;
    let nextDisqReason = contact.disqualificationReason;
    let nextActionAt: Date | null = contact.nextActionAt;
    let scheduledMeetingAt: Date | null = contact.scheduledMeetingAt;
    let outcomeText = "";

    if (input.actionType === "DESCALIFICAR") {
      const reason = String(input.disqualificationReason || "").trim();
      if (reason.length < 3) {
        return {
          success: false,
          error: "Es obligatorio indicar el motivo por el cual se descalifica al candidato.",
        };
      }
      nextClassification = "DESCALIFICADO";
      nextStatus = "DESCARTADO";
      nextDisqReason = reason;
      nextActionAt = null;
      outcomeText = `Descalificado — Motivo: ${reason}`;
    } else if (input.actionType === "CITA_AGENDADA") {
      if (!input.scheduledDate || !input.scheduledTime) {
        return {
          success: false,
          error: "Debes indicar el día y la hora de la cita agendada.",
        };
      }
      const meetingDate = new Date(`${input.scheduledDate}T${input.scheduledTime}:00`);
      scheduledMeetingAt = isNaN(meetingDate.getTime()) ? now : meetingDate;
      nextStatus = "CITA_AGENDADA";
      nextActionAt = scheduledMeetingAt;
      outcomeText = `¡Cita Agendada! (${input.scheduledDate} a las ${input.scheduledTime})`;
    } else if (input.actionType === "NO_CONTESTO") {
      nextStatus = "EN_SEGUIMIENTO";
      // Programar siguiente toque automático en 4 horas para rotar la cola inmediatamente
      nextActionAt = new Date(now.getTime() + 4 * 60 * 60 * 1000);
      outcomeText = `Intento #${contact.attemptsCount + 1}: No contestó / Buzón. Reprogramado automáticamente.`;
    } else if (input.actionType === "SEGUIMIENTO_WHATSAPP") {
      nextStatus = "EN_SEGUIMIENTO";
      nextActionAt = new Date(now.getTime() + 18 * 60 * 60 * 1000);
      outcomeText = `Intento #${contact.attemptsCount + 1}: Contacto en seguimiento / WhatsApp enviado.`;
    } else if (input.actionType === "CONVERTIR_REFERIDOR") {
      nextClassification = "REFERIDOR";
      nextStatus = "EN_SEGUIMIENTO";
      nextActionAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      outcomeText = "Clasificado como Centro de Influencia / Referidor activo.";
    }

    const newAttemptsCount = contact.attemptsCount + 1;
    const priorityScore = calculatePriorityScore({
      closingProbability: contact.closingProbability,
      estimatedSalary: contact.estimatedSalary,
      relationship: contact.relationship,
      source: contact.source,
      attemptsCount: newAttemptsCount,
    });

    const updated = await prisma.project200Contact.update({
      where: { id: contact.id },
      data: {
        classification: nextClassification,
        disqualificationReason: nextDisqReason,
        status: nextStatus,
        attemptsCount: newAttemptsCount,
        lastAttemptAt: now,
        nextActionAt,
        scheduledMeetingAt,
        priorityScore,
        notes: input.notes
          ? contact.notes
            ? `${contact.notes} | ${input.notes.trim()}`
            : input.notes.trim()
          : contact.notes,
      },
    });

    await prisma.project200Log.create({
      data: {
        contactId: contact.id,
        userId: user.id,
        agencyId: effectiveAgencyId,
        actionType: input.actionType,
        outcome: outcomeText,
        notes: input.notes || null,
      },
    });

    revalidatePath("/proyecto-200");
    return { success: true, contact: updated };
  } catch (error: any) {
    console.error("Error in recordGuidedProspectingAction:", error);
    return {
      success: false,
      error: error.message || "Error al registrar la actividad.",
    };
  }
}

export async function deleteProject200Contact(contactId: string) {
  try {
    const user = await getAuthenticatedUser();
    const existing = await prisma.project200Contact.findUnique({
      where: { id: contactId },
    });

    if (!existing || existing.userId !== user.id) {
      return { success: false, error: "Contacto no encontrado o sin permisos." };
    }

    await prisma.project200Contact.delete({
      where: { id: contactId },
    });

    revalidatePath("/proyecto-200");
    return { success: true };
  } catch (error: any) {
    console.error("Error in deleteProject200Contact:", error);
    return { success: false, error: "Error al eliminar el contacto." };
  }
}

export async function getAdminProject200Analytics() {
  try {
    const user = await getAuthenticatedUser();
    const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";

    if (!isAdmin) {
      return { success: false, error: "Acceso restringido a administradores de promotoría." };
    }

    // Regla de Oro SaaS Multi-Tenancy: aislamiento estricto por agencyId
    const effectiveAgencyId = user.agencyId || "aacom";

    const [agencyAgents, allContacts, recentLogs, actionCountsByAgent] = await Promise.all([
      prisma.user.findMany({
        where: {
          agencyId: effectiveAgencyId,
          active: true,
          role: { in: ["AGENTE", "ADMIN", "SUPER_ADMIN"] },
        },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          createdAt: true,
        },
        orderBy: { name: "asc" },
      }),
      prisma.project200Contact.findMany({
        where: { agencyId: effectiveAgencyId },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: [{ priorityScore: "desc" }, { updatedAt: "desc" }],
      }),
      prisma.project200Log.findMany({
        where: { agencyId: effectiveAgencyId },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          contact: {
            select: {
              id: true,
              fullName: true,
              phone: true,
              classification: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 150,
      }),
      prisma.project200Log.groupBy({
        by: ["userId", "actionType"],
        where: { agencyId: effectiveAgencyId },
        _count: { _all: true },
      }),
    ]);

    const agentMap = new Map<
      string,
      {
        agentId: string;
        name: string;
        email: string;
        image: string | null;
        role: string;
        totalContacts: number;
        missingFor200: number;
        hasReached200: boolean;
        prospectosCount: number;
        referidoresCount: number;
        descalificadosCount: number;
        qualifiedCount: number;
        missingFor100Qualified: number;
        fuelLevelPct: number;
        fuelStatus: "OPTIMO" | "MEDIO" | "RESERVA" | "CRITICO";
        referralsOriginCount: number;
        baseContactsCount: number;
        activeCallableCount: number;
        porContactarCount: number;
        enSeguimientoCount: number;
        citasAgendadasCount: number;
        totalAttempts: number;
        phoneTouchesCount: number;
        whatsappTouchesCount: number;
        whatsappRatioPct: number;
        estimatedMarketSalarySum: number;
        lastActivityAt: Date | null;
      }
    >();

    for (const ag of agencyAgents) {
      agentMap.set(ag.id, {
        agentId: ag.id,
        name: ag.name || ag.email,
        email: ag.email,
        image: ag.image,
        role: ag.role,
        totalContacts: 0,
        missingFor200: 200,
        hasReached200: false,
        prospectosCount: 0,
        referidoresCount: 0,
        descalificadosCount: 0,
        qualifiedCount: 0,
        missingFor100Qualified: 100,
        fuelLevelPct: 0,
        fuelStatus: "CRITICO",
        referralsOriginCount: 0,
        baseContactsCount: 0,
        activeCallableCount: 0,
        porContactarCount: 0,
        enSeguimientoCount: 0,
        citasAgendadasCount: 0,
        totalAttempts: 0,
        phoneTouchesCount: 0,
        whatsappTouchesCount: 0,
        whatsappRatioPct: 0,
        estimatedMarketSalarySum: 0,
        lastActivityAt: null,
      });
    }

    for (const c of allContacts) {
      let entry = agentMap.get(c.userId);
      if (!entry && c.user) {
        entry = {
          agentId: c.user.id,
          name: c.user.name || c.user.email,
          email: c.user.email,
          image: null,
          role: "AGENTE",
          totalContacts: 0,
          missingFor200: 200,
          hasReached200: false,
          prospectosCount: 0,
          referidoresCount: 0,
          descalificadosCount: 0,
          qualifiedCount: 0,
          missingFor100Qualified: 100,
          fuelLevelPct: 0,
          fuelStatus: "CRITICO",
          referralsOriginCount: 0,
          baseContactsCount: 0,
          activeCallableCount: 0,
          porContactarCount: 0,
          enSeguimientoCount: 0,
          citasAgendadasCount: 0,
          totalAttempts: 0,
          phoneTouchesCount: 0,
          whatsappTouchesCount: 0,
          whatsappRatioPct: 0,
          estimatedMarketSalarySum: 0,
          lastActivityAt: null,
        };
        agentMap.set(c.userId, entry);
      }

      if (entry) {
        entry.totalContacts += 1;
        entry.missingFor200 = Math.max(0, 200 - entry.totalContacts);
        entry.hasReached200 = entry.totalContacts >= 200;

        if (c.classification === "PROSPECTO") {
          entry.prospectosCount += 1;
          entry.estimatedMarketSalarySum += Number(c.estimatedSalary) || 0;
        } else if (c.classification === "REFERIDOR") {
          entry.referidoresCount += 1;
        } else if (c.classification === "DESCALIFICADO") {
          entry.descalificadosCount += 1;
        }

        const isReferralOrigin =
          c.classification !== "DESCALIFICADO" &&
          (c.source === "ENCUESTA_SATISFACCION" ||
            c.source === "REFERIDO_DIRECTO" ||
            c.classification === "REFERIDOR" ||
            (c.relationship || "").toLowerCase().includes("referid"));
        if (isReferralOrigin) {
          entry.referralsOriginCount += 1;
        }

        if (c.status === "POR_CONTACTAR") entry.porContactarCount += 1;
        else if (c.status === "EN_SEGUIMIENTO") entry.enSeguimientoCount += 1;
        else if (c.status === "CITA_AGENDADA") entry.citasAgendadasCount += 1;

        if (
          c.classification !== "DESCALIFICADO" &&
          (c.status === "POR_CONTACTAR" || c.status === "EN_SEGUIMIENTO")
        ) {
          entry.activeCallableCount += 1;
        }

        entry.totalAttempts += c.attemptsCount || 0;

        const touchDate = c.lastAttemptAt || c.updatedAt;
        if (!entry.lastActivityAt || touchDate > entry.lastActivityAt) {
          entry.lastActivityAt = touchDate;
        }
      }
    }

    for (const grp of actionCountsByAgent) {
      const entry = agentMap.get(grp.userId);
      if (!entry) continue;
      const cnt = grp._count._all || 0;
      if (grp.actionType === "SEGUIMIENTO_WHATSAPP") {
        entry.whatsappTouchesCount += cnt;
      } else if (
        grp.actionType === "CITA_AGENDADA" ||
        grp.actionType === "NO_CONTESTO" ||
        grp.actionType === "CONVERTIR_REFERIDOR" ||
        grp.actionType === "DESCALIFICAR" ||
        grp.actionType === "VOLVER_PROSPECTO"
      ) {
        entry.phoneTouchesCount += cnt;
      }
    }

    for (const entry of Array.from(agentMap.values())) {
      entry.qualifiedCount = entry.prospectosCount + entry.referidoresCount;
      entry.missingFor100Qualified = Math.max(0, 100 - entry.qualifiedCount);
      entry.baseContactsCount = Math.max(0, entry.qualifiedCount - entry.referralsOriginCount);
      entry.fuelLevelPct = Math.min(100, Math.round((entry.qualifiedCount / 100) * 100));
      entry.fuelStatus =
        entry.qualifiedCount >= 100
          ? "OPTIMO"
          : entry.qualifiedCount >= 65
          ? "MEDIO"
          : entry.qualifiedCount >= 35
          ? "RESERVA"
          : "CRITICO";

      const totalLoggedTouches = entry.phoneTouchesCount + entry.whatsappTouchesCount;
      entry.whatsappRatioPct =
        totalLoggedTouches > 0
          ? Math.round((entry.whatsappTouchesCount / totalLoggedTouches) * 100)
          : 0;
    }

    const agentSummaries = Array.from(agentMap.values()).sort(
      (a, b) => b.qualifiedCount - a.qualifiedCount || b.totalContacts - a.totalContacts
    );

    return {
      success: true,
      agencyId: effectiveAgencyId,
      agentSummaries,
      allContacts,
      recentLogs,
    };
  } catch (error: any) {
    console.error("Error in getAdminProject200Analytics:", error);
    return {
      success: false,
      error: error.message || "Error al cargar el tablero ejecutivo de Proyecto 200.",
    };
  }
}
