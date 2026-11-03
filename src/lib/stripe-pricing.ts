import { stripe } from "@/lib/stripe";

/**
 * Busca o crea el precio escalonado para asientos extras en Stripe.
 * Esto evita tener que configurarlo a mano en el dashboard de Stripe o usar scripts manuales.
 */
export async function getOrCreateTieredSeatPrice(): Promise<string> {
  // 1. Buscar si ya existe un precio con nuestro metadato especial
  const prices = await stripe.prices.list({
    active: true,
    limit: 100,
  });

  const existingPrice = prices.data.find(
    (p) => p.metadata?.isTieredSeatPrice === "true"
  );

  if (existingPrice) {
    return existingPrice.id;
  }

  // 2. Si no existe, creamos el producto y el precio
  console.log("Creando producto y precio escalonado en Stripe por primera vez...");
  const product = await stripe.products.create({
    name: 'Asiento Extra - Promotoría',
    description: 'Asiento adicional para usuarios en la agencia',
    metadata: {
      isAgencySeatProduct: "true"
    }
  });

  const price = await stripe.prices.create({
    product: product.id,
    currency: 'mxn',
    recurring: {
      interval: 'month',
    },
    billing_scheme: 'tiered',
    tiers_mode: 'volume', // El precio del nivel aplica a TODAS las unidades
    tiers: [
      { up_to: 10, unit_amount: 29900 },   // 1-10 extras (11-20 totales): $299
      { up_to: 20, unit_amount: 24900 },   // 11-20 extras (21-30 totales): $249
      { up_to: 40, unit_amount: 20900 },   // 21-40 extras (31-50 totales): $209
      { up_to: 'inf', unit_amount: 19900 },// 41+ extras (51+ totales): $199
    ],
    metadata: {
      isTieredSeatPrice: "true",
      isAgencySeat: "true"
    }
  });

  return price.id;
}

/**
 * Busca o crea el precio para agentes individuales (Premium/AGENTE).
 */
export async function getOrCreateIndividualPremiumPrice(): Promise<string> {
  const prices = await stripe.prices.list({
    active: true,
    limit: 100,
  });

  const existingPrice = prices.data.find(
    (p) => p.metadata?.isIndividualPremiumPrice === "true"
  );

  if (existingPrice) {
    return existingPrice.id;
  }

  console.log("Creando producto y precio individual premium en Stripe por primera vez...");
  const product = await stripe.products.create({
    name: 'Suscripción Agente Premium',
    description: 'Acceso completo a Cotizador 3.0, Cartera, Newsletters y más',
    metadata: {
      isIndividualPremiumProduct: "true"
    }
  });

  const price = await stripe.prices.create({
    product: product.id,
    currency: 'mxn',
    recurring: {
      interval: 'month',
    },
    unit_amount: 39900, // $399 MXN
    metadata: {
      isIndividualPremiumPrice: "true"
    }
  });

  return price.id;
}

/**
 * Busca o crea el precio para el Plan Bimestral de Promotoría ($5,200 MXN cada 60 días).
 */
export async function getOrCreateBimonthlyAgencyPrice(): Promise<string> {
  if (process.env.STRIPE_PLAN_2M_PRICE_ID) {
    return process.env.STRIPE_PLAN_2M_PRICE_ID;
  }

  const prices = await stripe.prices.list({
    active: true,
    limit: 100,
  });

  const existingPrice = prices.data.find(
    (p) =>
      p.metadata?.isBimonthlyAgencyPrice === "true" &&
      p.unit_amount === 520000 &&
      p.currency === "mxn"
  );

  if (existingPrice) {
    return existingPrice.id;
  }

  console.log("Creando producto y precio Bimestral ($5,200 MXN / 60 días) en Stripe...");
  const product = await stripe.products.create({
    name: "Licencia Corporativa Promotoría - Plan Bimestral (60 días)",
    description: "Suscripción bimestral (60 días) a la plataforma completa para promotoría.",
    metadata: {
      isBimonthlyAgencyProduct: "true",
    },
  });

  const price = await stripe.prices.create({
    product: product.id,
    currency: "mxn",
    recurring: {
      interval: "day",
      interval_count: 60,
    },
    unit_amount: 520000, // $5,200.00 MXN
    metadata: {
      isBimonthlyAgencyPrice: "true",
      daysToAdd: "60",
    },
  });

  return price.id;
}


export const SOLO_AGENT_PLANS: Record<
  "1M" | "3M" | "6M" | "12M",
  {
    label: string;
    amountMxn: number;
    unitAmount: number;
    interval: "month" | "year";
    intervalCount: number;
    monthsToAdd: number;
    daysToAdd: number;
  }
> = {
  "1M": {
    label: "Mensual",
    amountMxn: 339,
    unitAmount: 33900,
    interval: "month",
    intervalCount: 1,
    monthsToAdd: 1,
    daysToAdd: 30,
  },
  "3M": {
    label: "Trimestral",
    amountMxn: 899,
    unitAmount: 89900,
    interval: "month",
    intervalCount: 3,
    monthsToAdd: 3,
    daysToAdd: 90,
  },
  "6M": {
    label: "Semestral",
    amountMxn: 1649,
    unitAmount: 164900,
    interval: "month",
    intervalCount: 6,
    monthsToAdd: 6,
    daysToAdd: 180,
  },
  "12M": {
    label: "Anual",
    amountMxn: 2999,
    unitAmount: 299900,
    interval: "year",
    intervalCount: 1,
    monthsToAdd: 12,
    daysToAdd: 365,
  },
};

export async function getOrCreateSoloAgentPrice(
  plan: "1M" | "3M" | "6M" | "12M"
): Promise<string> {
  const cfg = SOLO_AGENT_PLANS[plan] || SOLO_AGENT_PLANS["12M"];
  const envKey = `STRIPE_SOLO_AGENT_${plan}_PRICE_ID`;
  if (process.env[envKey]) {
    return process.env[envKey]!;
  }

  const prices = await stripe.prices.list({
    active: true,
    limit: 100,
  });

  const existingPrice = prices.data.find(
    (p) =>
      p.metadata?.isSoloAgentSaasPrice === "true" &&
      p.metadata?.planKey === plan &&
      p.unit_amount === cfg.unitAmount &&
      p.currency === "mxn"
  );

  if (existingPrice) {
    return existingPrice.id;
  }

  const product = await stripe.products.create({
    name: `AACOMSoft Agente SaaS - Plan ${cfg.label}`,
    description: `Suscripción ${cfg.label.toLowerCase()} de AACOMSoft para Agente Individual.`,
    metadata: {
      isSoloAgentSaasProduct: "true",
      planKey: plan,
    },
  });

  const price = await stripe.prices.create({
    product: product.id,
    currency: "mxn",
    recurring: {
      interval: cfg.interval,
      interval_count: cfg.intervalCount,
    },
    unit_amount: cfg.unitAmount,
    metadata: {
      isSoloAgentSaasPrice: "true",
      planKey: plan,
      monthsToAdd: cfg.monthsToAdd.toString(),
      daysToAdd: cfg.daysToAdd.toString(),
    },
  });

  return price.id;
}

export const CORPORATE_EMAIL_PACKAGES: Record<
  number,
  { mailboxes: number; amountMxn: number; unitAmount: number; name: string }
> = {
  1: { mailboxes: 1, amountMxn: 999, unitAmount: 99900, name: "Individual (1 Buzón de 10 GB)" },
  2: { mailboxes: 2, amountMxn: 1799, unitAmount: 179900, name: "Dúo (2 Buzones de 10 GB c/u)" },
  3: { mailboxes: 3, amountMxn: 2499, unitAmount: 249900, name: "Despacho 3 (3 Buzones de 10 GB c/u)" },
  4: { mailboxes: 4, amountMxn: 3199, unitAmount: 319900, name: "Despacho 4 (4 Buzones de 10 GB c/u)" },
  5: { mailboxes: 5, amountMxn: 3799, unitAmount: 379900, name: "Despacho Full (5 Buzones de 10 GB c/u)" },
};

export async function getOrCreateCorporateEmailPrice(
  mailboxesCount: number
): Promise<{ priceId: string; amountMxn: number }> {
  const safeCount = Math.min(5, Math.max(1, Math.round(mailboxesCount)));
  const pkg = CORPORATE_EMAIL_PACKAGES[safeCount];

  const prices = await stripe.prices.list({
    active: true,
    limit: 100,
  });

  const existingPrice = prices.data.find(
    (p) =>
      p.metadata?.isCorporateEmailPrice === "true" &&
      p.metadata?.mailboxesCount === safeCount.toString() &&
      p.unit_amount === pkg.unitAmount &&
      p.currency === "mxn"
  );

  if (existingPrice) {
    return { priceId: existingPrice.id, amountMxn: pkg.amountMxn };
  }

  const product = await stripe.products.create({
    name: `Correo Corporativo AACOMSoft - ${pkg.name}`,
    description: `Paquete anual de correo electrónico empresarial (${safeCount} ${safeCount === 1 ? "buzón" : "buzones"} de 10 GB c/u) con renovación anual automática.`,
    metadata: {
      isCorporateEmailProduct: "true",
      mailboxesCount: safeCount.toString(),
    },
  });

  const price = await stripe.prices.create({
    product: product.id,
    currency: "mxn",
    recurring: {
      interval: "year",
      interval_count: 1,
    },
    unit_amount: pkg.unitAmount,
    metadata: {
      isCorporateEmailPrice: "true",
      mailboxesCount: safeCount.toString(),
    },
  });

  return { priceId: price.id, amountMxn: pkg.amountMxn };
}
