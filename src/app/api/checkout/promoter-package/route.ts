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
                stripeCoupon = discount.code;
                sellerId = discount.sellerId;
            } else {
                return NextResponse.json({ error: "Código de descuento inválido o inactivo." }, { status: 400 });
            }
        }

        const origin = process.env.NEXT_PUBLIC_APP_URL || 'https://aacomsoft.com';

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
                        unit_amount: 29900, // $299.00 MXN
                    },
                    quantity: 1,
                },
            ],
            mode: "payment",
            ...(stripeCoupon ? { discounts: [{ coupon: stripeCoupon }] } : {}),
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
