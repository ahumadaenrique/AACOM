import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: { agency: true }
        });

        if (!user || !user.agencyId) {
            return new NextResponse("User or Agency not found", { status: 404 });
        }

        if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
            return new NextResponse("Forbidden", { status: 403 });
        }

        // Se requiere configurar esta variable de entorno en Vercel
        const priceId = process.env.STRIPE_SEAT_PRICE_ID;
        if (!priceId) {
            return new NextResponse("Stripe Seat Price ID not configured", { status: 500 });
        }

        const checkoutSession = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: "subscription",
            success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://aacomsoft.com'}/admin?seat_success=true`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://aacomsoft.com'}/admin`,
            metadata: {
                isAgencySeat: 'true',
                agencyId: user.agencyId,
            },
            subscription_data: {
                metadata: {
                    isAgencySeat: 'true',
                    agencyId: user.agencyId,
                }
            },
            client_reference_id: user.agencyId,
        });

        return NextResponse.json({ url: checkoutSession.url });
    } catch (error) {
        console.error("[SEAT_CHECKOUT_ERROR]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
