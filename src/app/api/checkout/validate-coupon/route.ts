import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { code } = body;

    if (!code || code.trim() === "") {
      return NextResponse.json({ error: "Falta el código de descuento." }, { status: 400 });
    }

    const codeStr = code.trim().toUpperCase();
    const discount = await prisma.discountCode.findUnique({
      where: { code: codeStr },
    });

    if (!discount || !discount.active) {
      return NextResponse.json({ error: "Código de descuento inválido o inactivo." }, { status: 400 });
    }

    if (discount.maxUses && discount.uses >= discount.maxUses) {
      return NextResponse.json({ error: "El código de descuento ya alcanzó su límite de usos." }, { status: 400 });
    }

    if (discount.expiresAt && discount.expiresAt < new Date()) {
      return NextResponse.json({ error: "El código de descuento ha expirado." }, { status: 400 });
    }

    return NextResponse.json({
      valid: true,
      discountPercentage: discount.discountPercentage,
      code: discount.code,
    });
  } catch (error) {
    console.error("[VALIDATE_COUPON_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
