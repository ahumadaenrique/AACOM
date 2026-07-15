"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export async function createCheckoutSession(
  planId: string,
  daysToAdd: number,
  discountCodeStr?: string
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, message: "No autorizado (Falta ID de usuario)" };
    
    // We fetch the user to get the true agencyId because session might be stale
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
      return { success: false, message: "Permisos insuficientes" };
    }

    if (!user.agencyId) {
      return { success: false, message: "No tienes una agencia asignada. Ve a la página anterior y recarga." };
    }

    const agency = await prisma.agency.findUnique({ where: { id: user.agencyId } });
    if (!agency) return { success: false, message: "Agencia no encontrada en la base de datos" };

    const hostList = headers();
    const host = hostList.get("host") || "";
    const protocol = host.includes("localhost") ? "http" : "https";
    const origin = `${protocol}://${host}`;

    // Map planId to real Stripe price ID from server env variables
    let actualPriceId = "";
    if (planId === "trimestral") {
      actualPriceId = process.env.STRIPE_PLAN_3M_PRICE_ID || process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY || "";
    } else if (planId === "semiannual") {
      actualPriceId = process.env.STRIPE_PLAN_6M_PRICE_ID || process.env.NEXT_PUBLIC_STRIPE_PRICE_SEMIANNUAL || "";
    } else if (planId === "annual") {
      actualPriceId = process.env.STRIPE_PLAN_12M_PRICE_ID || process.env.NEXT_PUBLIC_STRIPE_PRICE_ANNUAL || "";
    }

    if (!actualPriceId) {
      return { success: false, message: "Las llaves de precio de Stripe no están configuradas en Vercel." };
    }

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
      
      if (!discountCode || !discountCode.active) {
        return { success: false, message: "Código de descuento inválido o inactivo." };
      }
      
      if (discountCode.expiresAt && new Date() > new Date(discountCode.expiresAt)) {
        return { success: false, message: "Este código de descuento ha expirado." };
      }
      
      if (discountCode.maxUses !== null && discountCode.uses >= discountCode.maxUses) {
        return { success: false, message: "Este código de descuento ha alcanzado su límite de usos." };
      }

      if (discountCode.discountPercentage > 0) {
        const coupon = await stripe.coupons.create({
          percent_off: discountCode.discountPercentage,
          duration: "once",
          name: `Cupón ${discountCodeStr} (${discountCode.discountPercentage}%)`,
        });
        stripeCouponId = coupon.id;
      }
    }

    if (!actualPriceId) {
      return { success: false, message: "ID de producto no válido." };
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: actualPriceId,
          quantity: 1,
        },
      ],
      discounts: stripeCouponId ? [{ coupon: stripeCouponId }] : undefined,
      success_url: `${origin}/admin/suscripcion?success=true`,
      cancel_url: `${origin}/admin/suscripcion?canceled=true`,
      metadata: {
        agencyId: agency.id,
        daysToAdd: daysToAdd.toString(),
        discountCodeStr: discountCodeStr || "",
      },
      subscription_data: {
        metadata: {
          agencyId: agency.id,
          daysToAdd: daysToAdd.toString(),
          discountCodeStr: discountCodeStr || "",
        }
      }
    });

    if (!checkoutSession.url) return { success: false, message: "Error al generar la URL de pago de Stripe." };
    return { success: true, url: checkoutSession.url };

  } catch (error: any) {
    return { success: false, message: error.message || "Error desconocido al procesar la suscripción con Stripe." };
  }
}
