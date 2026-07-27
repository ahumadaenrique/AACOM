import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { getOrCreateIndividualPremiumPrice } from "@/lib/stripe-pricing";

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user) {
            return new NextResponse("User not found", { status: 404 });
        }

        // We only allow AGENTE_LITE to upgrade
        if (user.role !== 'AGENTE_LITE') {
            return new NextResponse("Solo los agentes limitados pueden hacer upgrade por este medio", { status: 403 });
        }

        const priceId = await getOrCreateIndividualPremiumPrice();

        // Check if user already has a customer ID, else create one
        let customerId = user.stripeCustomerId;
        if (!customerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                name: user.name || undefined,
                metadata: {
                    userId: user.id
                }
            });
            customerId = customer.id;
            await prisma.user.update({
                where: { id: user.id },
                data: { stripeCustomerId: customerId }
            });
        }

        const stripeSession = await stripe.checkout.sessions.create({
            customer: customerId,
            mode: "subscription",
            payment_method_types: ["card"],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            success_url: `${process.env.NEXT_PUBLIC_APP_URL}/cotizador?upgrade=success`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/cotizador?upgrade=cancelled`,
            metadata: {
                userId: user.id,
                action: "upgrade_agent"
            }
        });

        return NextResponse.json({ url: stripeSession.url });

    } catch (error) {
        console.error("[UPGRADE_AGENT_CHECKOUT]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}
