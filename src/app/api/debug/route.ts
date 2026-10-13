import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
    const url = new URL(request.url);
    const search = url.searchParams.get("q") || "";
    const audit = url.searchParams.get("audit");
    
    if (audit === "true") {
        const calls = await prisma.roleplayCall.findMany({
            take: 60,
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                userId: true,
                user: { select: { name: true, email: true } },
                prospectName: true,
                durationSeconds: true,
                score: true,
                xpEarned: true,
                callAudioUrl: true,
                conversationId: true,
                engine: true,
                appointmentClosed: true,
                aciertos: true,
                errores: true,
                createdAt: true
            }
        });
        const stats = await prisma.roleplayStats.findMany({
            take: 30,
            orderBy: { updatedAt: "desc" },
            include: {
                user: { select: { name: true, email: true } }
            }
        });
        return NextResponse.json({ calls, stats });
    }

    const agencies = await prisma.agency.findMany({
        where: { name: { contains: search, mode: "insensitive" } }
    });
    
    const users = await prisma.user.findMany({
        where: { name: { contains: search, mode: "insensitive" } }
    });

    return NextResponse.json({ agencies, users });
}
