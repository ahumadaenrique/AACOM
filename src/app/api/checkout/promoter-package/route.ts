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
            where: { email: session.user.email }
        });

        if (!user) {
            return new NextResponse("User not found", { status: 404 });
        }

        const isPromoter = user.email.toLowerCase().includes("promotor") || user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
        if (!isPromoter) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const body = await req.json().catch(() => ({}));
        const promoCode = body.promoCode;
        let stripeCoupon = null;
        let sellerId = null;
        let unitAmount = 29900; // $299.00 MXN default

        if (promoCode && promoCode.trim() !== "") {
            const codeStr = promoCode.trim().toUpperCase();
            const discount = await prisma.discountCode.findUnique({ where: { code: codeStr } });
            
            if (discount && discount.active) {
                if (discount.maxUses && discount.uses >= discount.maxUses) {
                    return NextResponse.json({ error: "El código de descuento ya alcanzó su límite de usos." }, { status: 400 });
                }
                if (discount.expiresAt && discount.expiresAt < new Date()) {
                    return NextResponse.json({ error: "El código de descuento ha expirado." }, { status: 400 });
                }

                // Calculate discounted price locally
                const discountAmount = Math.round(29900 * (discount.discountPercentage / 100));
                unitAmount = Math.max(0, 29900 - discountAmount);

                stripeCoupon = discount.code;
                sellerId = discount.sellerId;
            } else {
                return NextResponse.json({ error: "Código de descuento inválido o inactivo." }, { status: 400 });
            }
        }

        const origin = process.env.NEXT_PUBLIC_APP_URL || 'https://aacomsoft.com';

        // Stripe minimum charge amount in MXN is $10.00 MXN (1000 cents)
        // If the coupon brings the price down to $0 (100% discount)
        if (unitAmount === 0) {
            // Apply promoter package benefits immediately since it is free
            await prisma.promotorSaldo.upsert({
                where: { promotor_email: user.email },
                create: { promotor_email: user.email, dias_disponibles: 7 },
                update: { dias_disponibles: { increment: 7 } },
            });

            if (stripeCoupon) {
                try {
                    await prisma.discountCode.update({
                        where: { code: stripeCoupon },
                        data: { uses: { increment: 1 } },
                    });
                } catch (err) {
                    console.error("Error updating discount code uses:", err);
                }
            }

            return NextResponse.json({ url: `${origin}/academia?purchase_success=true` });
        }

        // If amount is positive but below Stripe's minimum charge of $10.00 MXN
        if (unitAmount > 0 && unitAmount < 1000) {
            unitAmount = 1000; // Enforce Stripe minimum of $10.00 MXN to prevent API crash
        }

        const checkoutSession = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: 'mxn',
                        product_data: {
                            name: 'Paquete 7 Días Promotor - Academia',
                            description: 'Añade 7 días de acceso al simulador para distribuir entre tu estructura de agentes.',
                        },
                        unit_amount: unitAmount, // Dynamic discounted price
                    },
                    quantity: 1,
                },
            ],
            mode: "payment",
            success_url: `${origin}/academia?purchase_success=true`,
            cancel_url: `${origin}/academia`,
            metadata: {
                isPromoterPackage: 'true',
                promoterEmail: user.email,
                ...(stripeCoupon ? { discountCodeStr: stripeCoupon } : {}),
                ...(sellerId ? { sellerId } : {})
            },
        });

        return NextResponse.json({ url: checkoutSession.url });
    } catch (error) {
        console.error("[PROMOTER_PACKAGE_CHECKOUT_ERROR]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
