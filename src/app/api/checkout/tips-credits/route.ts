import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { TIPS_PACKAGES, grantTipsCreditsPackage } from '@/lib/tips-credits';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { agency: true },
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const { packageId, promoCode, forAgency } = body;

    const pkg = TIPS_PACKAGES[packageId];
    if (!pkg) {
      return NextResponse.json({ error: 'Paquete de créditos TIPS no válido.' }, { status: 400 });
    }

    const isAgencyPurchase =
      Boolean(forAgency && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN')) &&
      Boolean(user.agencyId);

    let unitAmount = pkg.priceCents;
    let stripeCoupon: string | null = null;
    let sellerId: string | null = null;

    if (promoCode && promoCode.trim() !== '') {
      const codeStr = promoCode.trim().toUpperCase();
      const discount = await prisma.discountCode.findUnique({ where: { code: codeStr } });

      if (discount && discount.active) {
        if (discount.maxUses && discount.uses >= discount.maxUses) {
          return NextResponse.json(
            { error: 'El código de descuento ya alcanzó su límite de usos.' },
            { status: 400 }
          );
        }
        if (discount.expiresAt && discount.expiresAt < new Date()) {
          return NextResponse.json(
            { error: 'El código de descuento ha expirado.' },
            { status: 400 }
          );
        }

        const discountAmount = Math.round(pkg.priceCents * (discount.discountPercentage / 100));
        unitAmount = Math.max(0, pkg.priceCents - discountAmount);
        stripeCoupon = discount.code;
        sellerId = discount.sellerId;
      } else {
        return NextResponse.json(
          { error: 'Código de descuento inválido o inactivo.' },
          { status: 400 }
        );
      }
    }

    const origin = process.env.NEXT_PUBLIC_APP_URL || 'https://aacomsoft.com';
    const successUrl = `${origin}/tips?purchase_tips_success=true&credits=${pkg.credits}`;
    const cancelUrl = `${origin}/tips`;

    // Si un cupón del 100% deja el costo en $0 MXN, acreditamos inmediatamente
    if (unitAmount === 0) {
      await grantTipsCreditsPackage({
        userId: user.id,
        agencyId: user.agencyId,
        target: isAgencyPurchase ? 'agency' : 'user',
        packageId: pkg.id,
        creditsToAdd: pkg.credits,
        amountPaidMxn: 0,
        stripeSessionId: null,
      });

      if (stripeCoupon) {
        try {
          await prisma.discountCode.update({
            where: { code: stripeCoupon },
            data: { uses: { increment: 1 } },
          });
        } catch (err) {
          console.error('Error updating discount code uses:', err);
        }
      }

      return NextResponse.json({ url: successUrl });
    }

    // Límite mínimo de Stripe MXN ($10.00 MXN = 1000 centavos)
    if (unitAmount > 0 && unitAmount < 1000) {
      unitAmount = 1000;
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'mxn',
            product_data: {
              name: isAgencyPurchase ? `${pkg.name} (Bolsa de Promotoría)` : pkg.name,
              description: isAgencyPurchase
                ? `Añade ${pkg.credits} créditos TIPS a la bolsa compartida de tu promotoría (vigencia 90 días).`
                : `Añade ${pkg.credits} créditos TIPS a tu cuenta para talleres en vivo con prospectos (vigencia 90 días).`,
            },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        isTipsCreditsPackage: 'true',
        packageId: pkg.id,
        userId: user.id,
        target: isAgencyPurchase && user.agencyId ? 'agency' : 'user',
        agencyId: user.agencyId || '',
        creditsToAdd: pkg.credits.toString(),
        ...(stripeCoupon ? { discountCodeStr: stripeCoupon } : {}),
        ...(sellerId ? { sellerId } : {}),
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error('[TIPS_CREDITS_CHECKOUT_ERROR]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
