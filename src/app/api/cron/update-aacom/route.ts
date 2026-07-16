import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const bypass = searchParams.get('bypass');
    if (bypass !== 'aacom123') {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const agency = await prisma.agency.findUnique({
      where: { slug: 'aacom' }
    });

    if (!agency) {
      return NextResponse.json({ success: false, message: "Agency 'aacom' not found" });
    }

    const updated = await prisma.agency.update({
      where: { slug: 'aacom' },
      data: {
        name: 'AACOMSOFT',
        logoUrl: '/logo.png'
      }
    });

    return NextResponse.json({
      success: true,
      before: {
        name: agency.name,
        logoUrl: agency.logoUrl
      },
      after: {
        name: updated.name,
        logoUrl: updated.logoUrl
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
