import { prisma } from '@/lib/prisma';
import { normalizePhone10 } from '@/lib/constants';

export { normalizePhone10 };

export async function syncReferralToProject200AndUnifiedBase(params: {
  userId: string;
  agencyId: string | null;
  fullName: string;
  phone: string;
  notes?: string | null;
  referredByName?: string | null;
  source: 'REFERIDO_25_PUNTOS' | 'ENCUESTA_SATISFACCION';
  existingSurveyReferralId?: string | null;
}): Promise<{
  contactId: string;
  surveyReferralId: string;
  alreadyExisted: boolean;
}> {
  const fullName = String(params.fullName || '').trim();
  const cleanPhone = normalizePhone10(params.phone);
  const notes = String(params.notes || '').trim() || null;
  const referredByName = String(params.referredByName || '').trim() || null;
  const agencyId = params.agencyId || 'aacom';

  if (fullName.length < 2) {
    throw new Error('El nombre completo del referido es obligatorio.');
  }
  if (cleanPhone.length !== 10) {
    throw new Error('El teléfono del referido debe tener 10 dígitos válidos.');
  }

  // 1. Buscar si ya existe en Proyecto 200 (por surveyReferralId o por teléfono de 10 dígitos)
  const existingContacts = await prisma.project200Contact.findMany({
    where: { userId: params.userId },
    select: { id: true, phone: true, surveyReferralId: true },
  });

  let existingContact = existingContacts.find(
    (c) =>
      (params.existingSurveyReferralId &&
        c.surveyReferralId === params.existingSurveyReferralId) ||
      normalizePhone10(c.phone) === cleanPhone
  );

  let alreadyExisted = Boolean(existingContact);
  let contactId = existingContact?.id || '';

  if (!existingContact) {
    const relationship = referredByName
      ? `Referido por ${referredByName}`
      : params.source === 'REFERIDO_25_PUNTOS'
      ? 'Referido calificado (25 Puntos)'
      : 'Referido en Encuesta de Satisfacción';

    const createdContact = await prisma.project200Contact.create({
      data: {
        userId: params.userId,
        agencyId,
        fullName,
        phone: cleanPhone,
        relationship,
        estimatedSalary: 0,
        closingProbability: 'MEDIA',
        classification: 'PROSPECTO',
        status: 'POR_CONTACTAR',
        priorityScore: 53,
        source: params.source,
        referredByName,
        surveyReferralId: params.existingSurveyReferralId || null,
        notes,
      },
      select: { id: true },
    });

    contactId = createdContact.id;

    await prisma.project200Log.create({
      data: {
        contactId,
        userId: params.userId,
        agencyId,
        actionType: 'ALTA_CONTACTO',
        outcome:
          params.source === 'REFERIDO_25_PUNTOS'
            ? 'Incorporado automáticamente desde 25 Puntos (Referido obtenido)'
            : `Incorporado automáticamente desde Encuesta de Satisfacción${
                referredByName ? ` (Referido por ${referredByName})` : ''
              }`,
        notes,
      },
    });
  }

  // 2. Garantizar registro en la base unificada de Referidos (SurveyReferral)
  let unifiedReferralId = params.existingSurveyReferralId || '';

  if (unifiedReferralId) {
    await prisma.surveyReferral
      .update({
        where: { id: unifiedReferralId },
        data: { project200ContactId: contactId },
      })
      .catch(() => {});
  } else {
    const existingReferrals = await prisma.surveyReferral.findMany({
      where: { userId: params.userId },
      select: { id: true, phone: true, project200ContactId: true },
    });

    const matchedReferral = existingReferrals.find(
      (r) =>
        r.project200ContactId === contactId || normalizePhone10(r.phone) === cleanPhone
    );

    if (matchedReferral) {
      unifiedReferralId = matchedReferral.id;
      if (matchedReferral.project200ContactId !== contactId) {
        await prisma.surveyReferral.update({
          where: { id: matchedReferral.id },
          data: { project200ContactId: contactId },
        });
      }
    } else {
      const createdReferral = await prisma.surveyReferral.create({
        data: {
          surveyId: null,
          userId: params.userId,
          agencyId,
          fullName,
          phone: cleanPhone,
          notes,
          status: 'NO_CONTACTADO',
          source: 'ACTIVIDAD_25_PUNTOS',
          project200ContactId: contactId,
        },
        select: { id: true },
      });
      unifiedReferralId = createdReferral.id;
    }
  }

  return {
    contactId,
    surveyReferralId: unifiedReferralId,
    alreadyExisted,
  };
}
