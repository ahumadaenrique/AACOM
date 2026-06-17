import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get("Stripe-Signature") as string;

  let event: Stripe.Event;

  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error("Missing STRIPE_WEBHOOK_SECRET");
    }
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error: any) {
    console.error("⚠️ Webhook signature verification failed.", error.message);
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }

  // Función auxiliar para procesar el pago y extender la suscripción
  const processSubscriptionPayment = async (agencyId: string, daysToAddStr: string | undefined) => {
    const agency = await prisma.agency.findUnique({
      where: { id: agencyId },
    });

    if (agency) {
      const daysToAdd = daysToAddStr ? parseInt(daysToAddStr, 10) : 365; // Default 365 if not found

      const now = new Date();
      const currentEndDate = agency.subscriptionEndDate && agency.subscriptionEndDate > now 
          ? agency.subscriptionEndDate 
          : now;
      
      const newEndDate = new Date(currentEndDate);
      newEndDate.setDate(newEndDate.getDate() + daysToAdd);

      await prisma.agency.update({
        where: { id: agencyId },
        data: {
          subscriptionStatus: "active",
          subscriptionEndDate: newEndDate,
        },
      });

      // "Refiere y Gana" Logic: Add 60 days to the referrer if this is their first payment.
      if (agency.referredByAgencyId && (!agency.subscriptionEndDate || agency.subscriptionEndDate < now)) {
        const referrer = await prisma.agency.findUnique({
          where: { id: agency.referredByAgencyId },
        });

        if (referrer) {
          const referrerCurrentEnd = referrer.subscriptionEndDate && referrer.subscriptionEndDate > now
            ? referrer.subscriptionEndDate
            : now;
          
          const referrerNewEnd = new Date(referrerCurrentEnd);
          referrerNewEnd.setDate(referrerNewEnd.getDate() + 60); // +60 days reward

          await prisma.agency.update({
            where: { id: referrer.id },
            data: {
              subscriptionEndDate: referrerNewEnd,
              subscriptionStatus: "active",
            },
          });
        }
      }
    }
  };

  // Handle checkout.session.completed (First payment)
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const agencyId = session.metadata?.agencyId;
    const daysToAddStr = session.metadata?.daysToAdd;
    
    if (agencyId) {
      await processSubscriptionPayment(agencyId, daysToAddStr);
    }
  }

  // Handle invoice.payment_succeeded (Renewals)
  if (event.type === "invoice.payment_succeeded") {
    const invoice = event.data.object as Stripe.Invoice;
    // For renewals, the billing reason is usually subscription_cycle
    if (invoice.billing_reason === "subscription_cycle") {
      const subscriptionId = (invoice as any).subscription as string;
      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const agencyId = subscription.metadata?.agencyId;
        const daysToAddStr = subscription.metadata?.daysToAdd;
        
        if (agencyId) {
          await processSubscriptionPayment(agencyId, daysToAddStr);
        }
      }
    }
  }

  return new NextResponse("Webhook processed successfully", { status: 200 });
}
