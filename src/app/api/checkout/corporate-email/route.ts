import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { getOrCreateCorporateEmailPrice } from "@/lib/stripe-pricing";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.agencyId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const rawCount = Number(body.mailboxesCount || 1);
    const mailboxesCount = Math.min(5, Math.max(1, Math.round(rawCount)));
    const requestedDomain = String(body.requestedDomain || "").trim().toLowerCase();
    const mailboxes = Array.isArray(body.mailboxes) ? body.mailboxes.slice(0, mailboxesCount) : [];

    if (!requestedDomain || !requestedDomain.includes(".")) {
      return NextResponse.json(
        { error: "Ingresa un nombre de dominio válido (ej. segurosjuanperez.com)." },
        { status: 400 }
      );
    }

    const agency = await prisma.agency.findUnique({
      where: { id: session.user.agencyId },
    });

    if (!agency) {
      return NextResponse.json({ error: "Cuenta no encontrada" }, { status: 404 });
    }

    const { priceId } = await getOrCreateCorporateEmailPrice(mailboxesCount);

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

    const mailboxesJson = JSON.stringify(mailboxes);

    // Pre-guardar configuración solicitada en la agencia
    await prisma.agency.update({
      where: { id: agency.id },
      data: {
        corporateEmailDomain: requestedDomain,
        corporateEmailMailboxesJson: mailboxesJson,
      },
    });

    const protocol = req.headers.get("x-forwarded-proto") || "http";
    const host = req.headers.get("host");
    const origin = `${protocol}://${host}`;

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
      success_url: `${origin}/correo-corporativo?success=true`,
      cancel_url: `${origin}/correo-corporativo?canceled=true`,
      metadata: {
        agencyId: agency.id,
        isCorporateEmail: "true",
        mailboxesCount: mailboxesCount.toString(),
        requestedDomain,
        mailboxesJson: mailboxesJson.slice(0, 490),
      },
      subscription_data: {
        metadata: {
          agencyId: agency.id,
          isCorporateEmail: "true",
          mailboxesCount: mailboxesCount.toString(),
          requestedDomain,
        },
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error: any) {
    console.error("Error creating corporate email checkout:", error);
    return NextResponse.json(
      { error: error.message || "Error al generar la sesión de pago de Correo Corporativo" },
      { status: 500 }
    );
  }
}
