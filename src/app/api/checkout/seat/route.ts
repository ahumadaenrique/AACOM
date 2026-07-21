import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { getOrCreateTieredSeatPrice } from "@/lib/stripe-pricing";

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

        if (!user || !user.agencyId || !user.agency) {
            return new NextResponse("User or Agency not found", { status: 404 });
        }

        if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
            return new NextResponse("Forbidden", { status: 403 });
        }

        let quantity = 1;
        try {
            const body = await req.json();
            if (body && body.quantity) {
                quantity = parseInt(body.quantity, 10);
                if (isNaN(quantity) || quantity < 1) quantity = 1;
            }
        } catch (e) {
            // No body provided, default to 1
        }

        // Obtener o crear el precio escalonado automáticamente
        const priceId = await getOrCreateTieredSeatPrice();

        // Si ya hay un customer ID, buscar suscripciones existentes de asientos
        if (user.agency.stripeCustomerId) {
            const subscriptions = await stripe.subscriptions.list({
                customer: user.agency.stripeCustomerId,
                status: 'active',
            });

            // Encontrar la suscripción actual de asientos
            const existingSeatSub = subscriptions.data.find(
                (sub) => sub.metadata?.isAgencySeat === 'true'
            );

            if (existingSeatSub) {
                // Opción 2 (Prorrateo): Actualizar la suscripción existente!
                // Esto generará un cobro o crédito automático por los días no usados
                const subItem = existingSeatSub.items.data[0];

                await stripe.subscriptions.update(existingSeatSub.id, {
                    items: [
                        {
                            id: subItem.id,
                            price: priceId,
                            quantity: quantity,
                        },
                    ],
                    proration_behavior: 'create_prorations',
                    metadata: {
                        isAgencySeat: 'true',
                        agencyId: user.agencyId,
                        seatQuantity: quantity.toString(),
                    }
                });

                // Actualizar DB de inmediato porque no habrá un nuevo webhook checkout.session.completed
                // (Aunque stripe mandará customer.subscription.updated que podríamos atrapar)
                await prisma.agency.update({
                    where: { id: user.agencyId },
                    data: { purchasedSeats: quantity }
                });

                return NextResponse.json({ 
                    success: true, 
                    message: "Suscripción actualizada con éxito. El prorrateo se ha aplicado.",
                    url: null // Indica al frontend que no hay redirección a checkout
                });
            }
        }

        // Si no tiene suscripción activa de asientos, crear un Checkout Session nuevo
        const checkoutSession = await stripe.checkout.sessions.create({
            customer: user.agency.stripeCustomerId || undefined, // si tiene customer id lo usamos
            payment_method_types: ["card"],
            line_items: [
                {
                    price: priceId,
                    quantity: quantity,
                },
            ],
            mode: "subscription",
            success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://aacomsoft.com'}/admin?seat_success=true`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://aacomsoft.com'}/admin`,
            metadata: {
                isAgencySeat: 'true',
                agencyId: user.agencyId,
                seatQuantity: quantity.toString(),
            },
            subscription_data: {
                metadata: {
                    isAgencySeat: 'true',
                    agencyId: user.agencyId,
                    seatQuantity: quantity.toString(),
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
