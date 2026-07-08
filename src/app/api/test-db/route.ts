import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const dbUrl = process.env.DATABASE_URL || "";
    // Mask password in DB URL
    const maskedUrl = dbUrl.replace(/:[^:@]+@/, ":****@");

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        agencyId: true
      }
    });

    const agencies = await prisma.agency.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        active: true,
        subscriptionStatus: true,
        subscriptionEndDate: true
      }
    });

    return NextResponse.json({
      dbUrl: maskedUrl,
      usersCount: users.length,
      users,
      agencies
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
