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
