"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export async function createCheckoutSession(discountCodeStr?: string) {
  const session = await auth();
  if (!session?.user?.id || !session.user.agencyId) throw new Error("No autorizado");

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (user?.role !== "ADMIN" && user?.role !== "SUPER_ADMIN") throw new Error("Permisos insuficientes");

  const agency = await prisma.agency.findUnique({ where: { id: session.user.agencyId } });
  if (!agency) throw new Error("Agencia no encontrada");

  const hostList = headers();
  const host = hostList.get("host") || "";
  const protocol = host.includes("localhost") ? "http" : "https";
  const origin = `${protocol}://${host}`;

  let stripeCustomerId = agency.stripeCustomerId;

  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: agency.name,
      metadata: {
        agencyId: agency.id,
      },
    });
    stripeCustomerId = customer.id;
    await prisma.agency.update({
      where: { id: agency.id },
      data: { stripeCustomerId },
    });
  }

  // Verificar código de descuento si existe
  let stripeCouponId = undefined;
  if (discountCodeStr) {
    const discountCode = await prisma.discountCode.findUnique({
      where: { code: discountCodeStr },
    });
    if (discountCode && discountCode.active) {
      // Create a coupon on the fly in stripe, or assume one exists with the same ID
      // To keep it simple, we create an ephemeral coupon in Stripe matching the DB discount percentage
      const coupon = await stripe.coupons.create({
        percent_off: discountCode.discountPercentage,
        duration: "once", // Only for the first charge
        name: `Cupón ${discountCodeStr} (${discountCode.discountPercentage}%)`,
      });
      stripeCouponId = coupon.id;
    } else {
      throw new Error("Código de descuento inválido o expirado.");
    }
  }

  const priceId = process.env.STRIPE_PRICE_ID;
  if (!priceId) {
    throw new Error("No se ha configurado el producto de suscripción (STRIPE_PRICE_ID).");
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    discounts: stripeCouponId ? [{ coupon: stripeCouponId }] : undefined,
    success_url: `${origin}/admin/suscripcion?success=true`,
    cancel_url: `${origin}/admin/suscripcion?canceled=true`,
    metadata: {
      agencyId: agency.id,
    },
  });

  if (!checkoutSession.url) throw new Error("Error creando sesión de Stripe");
  redirect(checkoutSession.url);
}
