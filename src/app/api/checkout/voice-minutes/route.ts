import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

const PACKAGES: Record<string, { name: string; seconds: number; basePrice: number }> = {
  basic: {
    name: "Paquete Básico - 30 Minutos",
    seconds: 30 * 60,
    basePrice: 19900, // $199.00 MXN in cents
  },
  standard: {
    name: "Paquete Estándar - 60 Minutos",
    seconds: 60 * 60,
    basePrice: 29900, // $299.00 MXN in cents
  },
  pro: {
    name: "Paquete Pro - 100 Minutos",
    seconds: 100 * 60,
    basePrice: 34900, // $349.00 MXN in cents
  },
};

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { agency: true },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const { packageId, promoCode } = body;

    const pkg = PACKAGES[packageId];
    if (!pkg) {
      return NextResponse.json({ error: "Paquete no válido." }, { status: 400 });
    }

    let unitAmount = pkg.basePrice;
    let stripeCoupon = null;
    let sellerId = null;

    // Validate and apply promo code if provided
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

        // Calculate discounted price
        const discountAmount = Math.round(pkg.basePrice * (discount.discountPercentage / 100));
        unitAmount = Math.max(0, pkg.basePrice - discountAmount);

        stripeCoupon = discount.code;
        sellerId = discount.sellerId;
      } else {
        return NextResponse.json({ error: "Código de descuento inválido o inactivo." }, { status: 400 });
      }
    }

    const origin = process.env.NEXT_PUBLIC_APP_URL || 'https://aacomsoft.com';

    // If discount brings the price to 0, credit minutes immediately
    if (unitAmount === 0) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          voiceSecondsBalance: { increment: pkg.seconds },
        },
      });

      const now = new Date();
      const expiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 días
      await prisma.voiceMinutesPurchase.create({
        data: {
          userId: user.id,
          seconds: pkg.seconds,
          secondsRemaining: pkg.seconds,
          expiresAt
        }
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

      return NextResponse.json({ url: `${origin}/agents?purchase_voice_success=true` });
    }

    // Enforce Stripe minimum payment limit for MXN ($10.00 MXN = 1000 cents)
    if (unitAmount > 0 && unitAmount < 1000) {
      unitAmount = 1000;
    }

    // Create Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: 'mxn',
            product_data: {
              name: pkg.name,
              description: `Añade ${pkg.seconds / 60} minutos de saldo para realizar llamadas de voz con tu Asistente Inteligente.`,
            },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/agents?purchase_voice_success=true`,
      cancel_url: `${origin}/agents`,
      metadata: {
        isVoiceMinutesPackage: 'true',
        userId: user.id,
        secondsToAdd: pkg.seconds.toString(),
        agencyId: user.agencyId || "",
        ...(stripeCoupon ? { discountCodeStr: stripeCoupon } : {}),
        ...(sellerId ? { sellerId } : {}),
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("[VOICE_MINUTES_CHECKOUT_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
