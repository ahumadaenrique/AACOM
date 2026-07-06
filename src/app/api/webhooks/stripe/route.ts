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
  const processSubscriptionPayment = async (agencyId: string, daysToAddStr?: string, monthsToAddStr?: string) => {
    const agency = await prisma.agency.findUnique({
      where: { id: agencyId },
    });

    if (agency) {
      const now = new Date();
      const currentEndDate = agency.subscriptionEndDate && agency.subscriptionEndDate > now 
          ? agency.subscriptionEndDate 
          : now;
      
      const newEndDate = new Date(currentEndDate);
      let daysToAdd = 365;
      
      if (monthsToAddStr) {
        const months = parseInt(monthsToAddStr, 10);
        daysToAdd = months * 30; // Approximated days for referral check
        newEndDate.setMonth(newEndDate.getMonth() + months);
      } else {
        daysToAdd = daysToAddStr ? parseInt(daysToAddStr, 10) : 365; // Default 365 if not found
        newEndDate.setDate(newEndDate.getDate() + daysToAdd);
      }

      await prisma.agency.update({
        where: { id: agencyId },
        data: {
          subscriptionStatus: "active",
          subscriptionEndDate: newEndDate,
        },
      });

      // "Refiere y Gana" Logic: Add 60 days to the referrer if this is their first payment AND they paid for at least a quarter (90 days).
      if (agency.referredByAgencyId && (agency.subscriptionStatus === "trialing" || !agency.subscriptionEndDate || agency.subscriptionEndDate < now) && daysToAdd >= 90) {
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

  const logCommission = async (
    sellerId: string | null,
    agencyId: string | null,
    description: string,
    amountPaid: number,
    stripeChargeId: string,
    discountCodeStr?: string | null
  ) => {
    try {
      if (!sellerId && !agencyId) return;

      // Si no pasaron sellerId explícito (ej. en renovaciones de agencia), buscamos si la agencia tiene un afiliador
      let finalSellerId = sellerId;
      if (!finalSellerId && agencyId) {
        const agency = await prisma.agency.findUnique({ where: { id: agencyId } });
        if (agency?.referredById) {
          finalSellerId = agency.referredById;
        }
      }

      if (!finalSellerId) return;

      const seller = await prisma.user.findUnique({ where: { id: finalSellerId } });
      if (!seller || !seller.sellerCommissionRate) return;

      let discountPercentage = 0;
      if (discountCodeStr) {
        const code = await prisma.discountCode.findUnique({ where: { code: discountCodeStr } });
        if (code) discountPercentage = code.discountPercentage;
      }

      let netRate = seller.sellerCommissionRate - discountPercentage;
      if (netRate <= 0) return; // Si el descuento se comió la comisión, no ganan nada
      
      const commissionEarned = amountPaid * (netRate / 100);

      // Si el pago viene de un descuento nuevo y la agencia no estaba ligada, la ligamos
      if (agencyId && finalSellerId && !sellerId) {
          // Ya estaba ligada si la sacamos de la db
      } else if (agencyId && sellerId) {
          await prisma.agency.update({
              where: { id: agencyId },
              data: { referredById: sellerId, discountLocked: true }
          });
      }

      await prisma.commissionLedger.create({
        data: {
          sellerId: finalSellerId,
          agencyId,
          stripeChargeId,
          description,
          originalPrice: amountPaid / (1 - (discountPercentage / 100)), // Estimado
          amountPaid,
          discountPercentage,
          commissionEarned,
          status: 'PENDING'
        }
      });
    } catch (err) {
      console.error("Error logging commission:", err);
    }
  };

  // Handle checkout.session.completed (First payment)
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const isAgent = session.metadata?.isAgent === 'true';
    const isAgencySeat = session.metadata?.isAgencySeat === 'true';

    if (isAgent) {
      const agencyId = session.metadata?.agencyId;
      const email = session.metadata?.email;
      const name = session.metadata?.name;

      if (agencyId && email) {
        const existing = await prisma.user.findUnique({ where: { email } });
        if (!existing) {
            await prisma.user.create({
                data: {
                    name: name || "Agente",
                    email: email,
                    agencyId: agencyId,
                    role: 'AGENTE',
                    isSelfPaid: true,
                    stripeCustomerId: session.customer as string,
                    stripeSubscriptionId: session.subscription as string,
                    password: "password123",
                    mustChangePassword: true,
                }
            });
        } else {
            await prisma.user.update({
                where: { email: email },
                data: {
                    isSelfPaid: true,
                    stripeCustomerId: session.customer as string,
                    stripeSubscriptionId: session.subscription as string,
                    active: true 
                }
            });
        }
      }
      } else if (isAgencySeat) {
        const agencyId = session.metadata?.agencyId;
        if (agencyId) {
          await prisma.agency.update({
            where: { id: agencyId },
            data: { purchasedSeats: { increment: 1 } }
          });
          
          await logCommission(
            session.metadata?.sellerId || null, 
            agencyId, 
            "Compra de Asiento Extra", 
            (session.amount_total || 0) / 100, 
            session.payment_intent as string
          );
        }
      } else if (session.metadata?.isPromoterPackage === 'true') {
        const promoterEmail = session.metadata?.promoterEmail;
        const discountCodeStr = session.metadata?.discountCodeStr;
        const sellerId = session.metadata?.sellerId || null;
  
        if (promoterEmail) {
          await prisma.promotorSaldo.upsert({
            where: { promotor_email: promoterEmail },
            create: { promotor_email: promoterEmail, dias_disponibles: 7 },
            update: { dias_disponibles: { increment: 7 } },
          });

          await logCommission(
            sellerId, 
            null, 
            "Paquete Promotor (7 días Academia)", 
            (session.amount_total || 0) / 100, 
            session.payment_intent as string,
            discountCodeStr
          );
        }

      if (discountCodeStr) {
        try {
          await prisma.discountCode.update({
            where: { code: discountCodeStr },
            data: { uses: { increment: 1 } },
          });
        } catch (err) {
          console.error("Error updating discount code uses:", err);
        }
      }
    } else {
        const agencyId = session.metadata?.agencyId;
        const daysToAddStr = session.metadata?.daysToAdd;
        const monthsToAddStr = session.metadata?.monthsToAdd;
        const discountCodeStr = session.metadata?.discountCodeStr;
        const sellerId = session.metadata?.sellerId || null;
        
        if (agencyId) {
          await processSubscriptionPayment(agencyId, daysToAddStr, monthsToAddStr);

          await logCommission(
            sellerId, 
            agencyId, 
            "Suscripción SaaS Agencia", 
            (session.amount_total || 0) / 100, 
            session.payment_intent as string,
            discountCodeStr
          );
        }

      if (discountCodeStr) {
        try {
          await prisma.discountCode.update({
            where: { code: discountCodeStr },
            data: { uses: { increment: 1 } },
          });
        } catch (err) {
          console.error("Error updating discount code uses:", err);
        }
      }
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
        const monthsToAddStr = subscription.metadata?.monthsToAdd;
        
        if (agencyId) {
            await processSubscriptionPayment(agencyId, daysToAddStr, monthsToAddStr);

            await logCommission(
              null, 
              agencyId, 
              "Renovación Suscripción SaaS Agencia", 
              (invoice.amount_paid || 0) / 100, 
              ((invoice as any).payment_intent as string) || invoice.id
            );
          }
      }
    }
  }

  // Handle customer.subscription.deleted (Agent or Seat cancellation)
  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    const isAgencySeat = subscription.metadata?.isAgencySeat === 'true';
    
    if (isAgencySeat) {
        const agencyId = subscription.metadata?.agencyId;
        if (agencyId) {
            const agency = await prisma.agency.findUnique({ where: { id: agencyId } });
            if (agency && agency.purchasedSeats > 0) {
                await prisma.agency.update({
                    where: { id: agencyId },
                    data: { purchasedSeats: { decrement: 1 } }
                });
            }
        }
    } else {
        await prisma.user.updateMany({
            where: { stripeSubscriptionId: subscription.id },
            data: { active: false }
        });
    }
  }

  return new NextResponse("Webhook processed successfully", { status: 200 });
}
