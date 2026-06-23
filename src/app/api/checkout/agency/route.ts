import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.agencyId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { plan } = body; // '3M', '6M', '12M'

    // Determinar el Price ID según el plan
    let priceId = "";
    let monthsToAdd = 0;

    if (plan === "3M") {
      priceId = process.env.STRIPE_PLAN_3M_PRICE_ID || "";
      monthsToAdd = 3;
    } else if (plan === "6M") {
      priceId = process.env.STRIPE_PLAN_6M_PRICE_ID || "";
      monthsToAdd = 6;
    } else if (plan === "12M") {
      priceId = process.env.STRIPE_PLAN_12M_PRICE_ID || "";
      monthsToAdd = 12;
    }

    if (!priceId) {
      return NextResponse.json({ error: `No se ha configurado el Price ID para el plan ${plan} en las variables de entorno.` }, { status: 400 });
    }

    const agency = await prisma.agency.findUnique({
      where: { id: session.user.agencyId },
    });

    if (!agency) {
      return NextResponse.json({ error: "Agencia no encontrada" }, { status: 404 });
    }

    // Usar el cliente existente o crear uno nuevo
    let customerId = agency.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.user.email!,
        name: agency.name,
        metadata: {
          agencyId: agency.id,
        },
      });
      customerId = customer.id;

      await prisma.agency.update({
        where: { id: agency.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const protocol = req.headers.get("x-forwarded-proto") || "http";
    const host = req.headers.get("host");
    const origin = `${protocol}://${host}`;

    // Crear sesión de Checkout
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${origin}/login?welcome=true`,
      cancel_url: `${origin}/billing`,
      metadata: {
        agencyId: agency.id,
        isMainLicense: "true",
        monthsToAdd: monthsToAdd.toString(),
      },
      subscription_data: {
        metadata: {
          agencyId: agency.id,
          isMainLicense: "true",
          monthsToAdd: monthsToAdd.toString(),
        }
      }
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error: any) {
    console.error("Error creating agency checkout session:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
