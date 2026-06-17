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

  // Handle checkout.session.completed
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const agencyId = session.metadata?.agencyId;
    if (agencyId) {
      const agency = await prisma.agency.findUnique({
        where: { id: agencyId },
      });

      if (agency) {
        // Calculate new end date (add 1 year by default for this example, can be adjusted)
        const now = new Date();
        const currentEndDate = agency.subscriptionEndDate && agency.subscriptionEndDate > now 
            ? agency.subscriptionEndDate 
            : now;
        
        const newEndDate = new Date(currentEndDate);
        newEndDate.setFullYear(newEndDate.getFullYear() + 1); // 1 year extension

        await prisma.agency.update({
          where: { id: agencyId },
          data: {
            subscriptionStatus: "active",
            subscriptionEndDate: newEndDate,
          },
        });

        // "Refiere y Gana" Logic: Add 60 days to the referrer if this is their first payment.
        // We need to ensure we only reward once. Let's add a flag or check if it was previously inactive.
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
    }
  }

  return new NextResponse("Webhook processed successfully", { status: 200 });
}
