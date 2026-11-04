import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import Stripe from "stripe";

function isAddOnMetadata(meta?: Stripe.Metadata | null): boolean {
  if (!meta) return false;
  return (
    meta.isAgencySeat === "true" ||
    meta.isCorporateEmail === "true" ||
    meta.type === "CORPORATE_EMAIL_PACKAGE" ||
    meta.isAgent === "true" ||
    meta.action === "upgrade_agent" ||
    meta.isPromoterPackage === "true" ||
    meta.isVoiceMinutesPackage === "true" ||
    meta.isTipsCreditsPackage === "true"
  );
}

export function resolvePlanDetailsFromStripe(
  sub?: Stripe.Subscription | null,
  session?: Stripe.Checkout.Session | null,
  isSoloAccount?: boolean
): {
  subscriptionPlan: string;
  studyTokens: number;
  inferredMonths: number;
  endDate: Date;
} {
  const subMeta = sub?.metadata || {};
  const sesMeta = session?.metadata || {};

  const monthsStr = subMeta.monthsToAdd || sesMeta.monthsToAdd;
  const daysStr = subMeta.daysToAdd || sesMeta.daysToAdd;
  const planCode = (subMeta.plan || sesMeta.plan || subMeta.planType || sesMeta.planType || "").toUpperCase();

  let inferredMonths = 3;

  if (monthsStr && !isNaN(parseInt(monthsStr, 10))) {
    inferredMonths = parseInt(monthsStr, 10);
  } else if (daysStr && !isNaN(parseInt(daysStr, 10))) {
    const d = parseInt(daysStr, 10);
    if (d >= 300) inferredMonths = 12;
    else if (d >= 150) inferredMonths = 6;
    else if (d >= 80) inferredMonths = 3;
    else if (d >= 50) inferredMonths = 2;
    else inferredMonths = 1;
  } else if (planCode) {
    if (planCode === "12M" || planCode === "ANNUAL" || planCode === "SOLO_12M") inferredMonths = 12;
    else if (planCode === "6M" || planCode === "SEMIANNUAL" || planCode === "SOLO_6M") inferredMonths = 6;
    else if (planCode === "3M" || planCode === "QUARTERLY" || planCode === "MONTHLY" || planCode === "SOLO_3M") inferredMonths = 3;
    else if (planCode === "2M" || planCode === "BIMONTHLY" || planCode === "BIMESTRAL") inferredMonths = 2;
    else if (planCode === "SOLO_1M" || planCode === "1M") inferredMonths = 1;
  } else if (sub?.items?.data?.[0]) {
    const firstItem = sub.items.data[0] as any;
    const recurring = firstItem?.price?.recurring || firstItem?.plan;
    if (recurring?.interval === "year") {
      inferredMonths = 12 * (recurring.interval_count || 1);
    } else if (recurring?.interval === "month") {
      inferredMonths = recurring.interval_count || 3;
    }
  }

  const isSolo =
    Boolean(isSoloAccount) ||
    subMeta.isSoloAgentPlan === "true" ||
    sesMeta.isSoloAgentPlan === "true" ||
    planCode.startsWith("SOLO_");

  let basePlan = "QUARTERLY";
  let studyTokens = 12;

  if (inferredMonths >= 12) {
    basePlan = "ANNUAL";
    studyTokens = 52;
  } else if (inferredMonths >= 6) {
    basePlan = "SEMIANNUAL";
    studyTokens = 25;
  } else if (inferredMonths >= 3) {
    basePlan = "QUARTERLY";
    studyTokens = 12;
  } else {
    basePlan = "BIMONTHLY";
    studyTokens = 8;
  }

  const subscriptionPlan = isSolo
    ? basePlan === "ANNUAL"
      ? "SOLO_12M"
      : basePlan === "SEMIANNUAL"
      ? "SOLO_6M"
      : basePlan === "QUARTERLY"
      ? "SOLO_3M"
      : "SOLO_1M"
    : basePlan;

  const periodEndUnix: number | undefined =
    (sub as any)?.current_period_end ||
    (sub?.items?.data?.[0] as any)?.current_period_end;

  let endDate: Date;
  if (periodEndUnix && periodEndUnix > 0) {
    endDate = new Date(periodEndUnix * 1000);
  } else {
    const createdUnix = sub?.created || session?.created || Math.floor(Date.now() / 1000);
    endDate = new Date(createdUnix * 1000);
    endDate.setMonth(endDate.getMonth() + inferredMonths);
  }
  endDate.setUTCHours(23, 59, 59, 999);

  return {
    subscriptionPlan,
    studyTokens,
    inferredMonths,
    endDate,
  };
}

async function applySyncedSubscriptionToAgency(
  agency: any,
  sub: Stripe.Subscription | null,
  session: Stripe.Checkout.Session | null,
  resolvedCustomerId?: string | null
) {
  const now = new Date();
  const details = resolvePlanDetailsFromStripe(
    sub,
    session,
    (agency as any)?.accountType === "SOLO_AGENT"
  );

  if (details.endDate <= now) {
    return agency;
  }

  const currentEnd = agency.subscriptionEndDate ? new Date(agency.subscriptionEndDate) : null;
  const finalEndDate =
    currentEnd && currentEnd > details.endDate ? currentEnd : details.endDate;

  const needsUpdate =
    agency.subscriptionStatus !== "active" ||
    !currentEnd ||
    finalEndDate.getTime() > currentEnd.getTime() + 60 * 1000 ||
    (!agency.stripeCustomerId && resolvedCustomerId);

  if (!needsUpdate) {
    return agency;
  }

  const wasExpiredOrTrial =
    agency.subscriptionStatus === "trialing" ||
    !currentEnd ||
    currentEnd < now;

  const updatedAgency = await prisma.agency.update({
    where: { id: agency.id },
    data: {
      subscriptionStatus: "active",
      subscriptionEndDate: finalEndDate,
      subscriptionPlan: details.subscriptionPlan,
      ...(resolvedCustomerId && !agency.stripeCustomerId
        ? { stripeCustomerId: resolvedCustomerId }
        : {}),
    },
  });

  if (wasExpiredOrTrial) {
    await prisma.promotorSaldo
      .upsert({
        where: { promotor_email: `agency_${agency.id}` },
        update: {
          dias_disponibles: details.studyTokens,
          fecha_actualizacion: new Date(),
        },
        create: {
          promotor_email: `agency_${agency.id}`,
          dias_disponibles: details.studyTokens,
          fecha_actualizacion: new Date(),
        },
      })
      .catch((err) => console.error("Error syncing promotorSaldo:", err));

    // Refiere y Gana: +60 días a la agencia que refirió si contrató al menos 3 meses
    if (agency.referredByAgencyId && details.inferredMonths >= 3) {
      const referrer = await prisma.agency.findUnique({
        where: { id: agency.referredByAgencyId },
      });
      if (referrer) {
        const referrerCurrentEnd =
          referrer.subscriptionEndDate && referrer.subscriptionEndDate > now
            ? new Date(referrer.subscriptionEndDate)
            : new Date(now);
        referrerCurrentEnd.setDate(referrerCurrentEnd.getDate() + 60);
        referrerCurrentEnd.setUTCHours(23, 59, 59, 999);
        await prisma.agency
          .update({
            where: { id: referrer.id },
            data: {
              subscriptionEndDate: referrerCurrentEnd,
              subscriptionStatus: "active",
            },
          })
          .catch(() => {});
      }
    }
  }

  agency.subscriptionStatus = updatedAgency.subscriptionStatus;
  agency.subscriptionEndDate = updatedAgency.subscriptionEndDate;
  agency.subscriptionPlan = updatedAgency.subscriptionPlan;
  agency.stripeCustomerId = updatedAgency.stripeCustomerId;

  return agency;
}

/**
 * Reconcilia una sola agencia con Stripe si aparece vencida o recién pagada.
 */
export async function syncSingleAgencyFromStripe<T extends Record<string, any>>(
  agency: T | null,
  adminEmailHint?: string | null
): Promise<T | null> {
  if (!agency) return null;
  if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === "dummy_key_for_build") {
    return agency;
  }

  try {
    let customerIdsToCheck: string[] = [];
    if (agency.stripeCustomerId) {
      customerIdsToCheck.push(agency.stripeCustomerId);
    }

    // Buscar también por el email del admin por si se creó un customer nuevo
    let emailToSearch = adminEmailHint?.toLowerCase();
    if (!emailToSearch) {
      const adminUser = await prisma.user.findFirst({
        where: { agencyId: agency.id, role: "ADMIN", active: true },
        select: { email: true },
        orderBy: { createdAt: "asc" },
      });
      emailToSearch = adminUser?.email?.toLowerCase();
    }

    if (emailToSearch) {
      const customers = await stripe.customers.list({
        email: emailToSearch,
        limit: 5,
      });
      for (const c of customers.data) {
        if (!customerIdsToCheck.includes(c.id)) {
          customerIdsToCheck.push(c.id);
        }
      }
    }

    // 1. Revisar suscripciones activas de los customerIds encontrados
    for (const custId of customerIdsToCheck) {
      const subs = await stripe.subscriptions.list({
        customer: custId,
        status: "active",
        limit: 10,
      });
      const validSub = subs.data.find((s) => !isAddOnMetadata(s.metadata));
      if (validSub) {
        await applySyncedSubscriptionToAgency(agency, validSub, null, custId);
        return agency;
      }
    }

    // 2. Fallback: revisar sesiones de checkout recientes por metadata.agencyId
    const sessions = await stripe.checkout.sessions.list({
      limit: 30,
      expand: ["data.subscription"],
    });

    for (const ses of sessions.data) {
      if (ses.status !== "complete" || ses.payment_status !== "paid") continue;
      if (isAddOnMetadata(ses.metadata)) continue;

      const matchesAgency =
        ses.metadata?.agencyId === agency.id ||
        ses.client_reference_id === agency.id ||
        (emailToSearch && ses.customer_details?.email?.toLowerCase() === emailToSearch);

      if (matchesAgency) {
        const subObj =
          typeof ses.subscription === "object" && ses.subscription
            ? (ses.subscription as Stripe.Subscription)
            : null;
        if (subObj && subObj.status !== "active" && subObj.status !== "trialing") {
          continue;
        }
        const custId =
          typeof ses.customer === "string"
            ? ses.customer
            : ses.customer?.id || null;
        await applySyncedSubscriptionToAgency(agency, subObj, ses, custId);
        return agency;
      }
    }
  } catch (err) {
    console.error("Error in syncSingleAgencyFromStripe:", err);
  }

  return agency;
}

/**
 * Reconcilia en lote una lista de agencias (usado en /agencias por el Super Admin)
 * con una sola consulta a Stripe para mantener tiempos de respuesta rápidos.
 */
export async function syncAgenciesListFromStripe(agencies: any[]): Promise<void> {
  if (!agencies || agencies.length === 0) return;
  if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === "dummy_key_for_build") {
    return;
  }

  const now = new Date();
  const candidates = agencies.filter((a) => {
    if (a.id === "aacom" || a.slug === "aacom") return false;
    const end = a.subscriptionEndDate ? new Date(a.subscriptionEndDate) : null;
    // Revisar agencias que aparecen vencidas, en prueba o próximas a vencer (<= 3 días)
    return (
      a.subscriptionStatus !== "active" ||
      !end ||
      end.getTime() <= now.getTime() + 3 * 24 * 60 * 60 * 1000
    );
  });

  if (candidates.length === 0) return;

  try {
    const [activeSubsRes, recentSessionsRes] = await Promise.all([
      stripe.subscriptions.list({
        status: "active",
        limit: 100,
        expand: ["data.customer"],
      }),
      stripe.checkout.sessions.list({
        limit: 50,
        expand: ["data.subscription"],
      }),
    ]);

    const activeSubs = activeSubsRes.data.filter((s) => !isAddOnMetadata(s.metadata));
    const recentPaidSessions = recentSessionsRes.data.filter(
      (ses) =>
        ses.status === "complete" &&
        ses.payment_status === "paid" &&
        !isAddOnMetadata(ses.metadata)
    );

    for (const agency of candidates) {
      const adminEmails: string[] = (agency.users || [])
        .map((u: any) => u.email?.toLowerCase())
        .filter(Boolean);

      // 1. Buscar en suscripciones activas de Stripe
      const matchedSub = activeSubs.find((sub) => {
        if (sub.metadata?.agencyId === agency.id) return true;
        const custId =
          typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
        if (agency.stripeCustomerId && custId === agency.stripeCustomerId) return true;
        const custEmail =
          typeof sub.customer === "object" &&
          sub.customer &&
          "email" in sub.customer &&
          sub.customer.email
            ? sub.customer.email.toLowerCase()
            : null;
        if (custEmail && adminEmails.includes(custEmail)) return true;
        return false;
      });

      if (matchedSub) {
        const custId =
          typeof matchedSub.customer === "string"
            ? matchedSub.customer
            : matchedSub.customer?.id || null;
        await applySyncedSubscriptionToAgency(agency, matchedSub, null, custId);
        continue;
      }

      // 2. Fallback: buscar en sesiones de checkout pagadas recientes
      const matchedSession = recentPaidSessions.find((ses) => {
        if (ses.metadata?.agencyId === agency.id) return true;
        if (ses.client_reference_id === agency.id) return true;
        const custId =
          typeof ses.customer === "string" ? ses.customer : ses.customer?.id;
        if (agency.stripeCustomerId && custId === agency.stripeCustomerId) return true;
        const sesEmail = ses.customer_details?.email?.toLowerCase();
        if (sesEmail && adminEmails.includes(sesEmail)) return true;
        return false;
      });

      if (matchedSession) {
        const subObj =
          typeof matchedSession.subscription === "object" &&
          matchedSession.subscription
            ? (matchedSession.subscription as Stripe.Subscription)
            : null;
        if (subObj && subObj.status !== "active" && subObj.status !== "trialing") {
          continue;
        }
        const custId =
          typeof matchedSession.customer === "string"
            ? matchedSession.customer
            : matchedSession.customer?.id || null;
        await applySyncedSubscriptionToAgency(agency, subObj, matchedSession, custId);
      }
    }
  } catch (err) {
    console.error("Error in syncAgenciesListFromStripe:", err);
  }
}
