import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateLevelFromXp } from "@/lib/roleplay/gamification";

export const dynamic = "force-dynamic";

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

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { action, secret, callId, score, xpEarned, appointmentClosed, aciertos, errores, coachTip } = body;

        if (secret !== "aacom_recalibrate_2026") {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        if (action === "adjust_call" && callId) {
            const existingCall = await prisma.roleplayCall.findUnique({
                where: { id: callId },
                include: { user: true }
            });

            if (!existingCall) {
                return NextResponse.json({ error: "Llamada no encontrada" }, { status: 404 });
            }

            const prevXp = existingCall.xpEarned || 0;
            const prevClosed = existingCall.appointmentClosed;

            const updatedCall = await prisma.roleplayCall.update({
                where: { id: callId },
                data: {
                    score: score !== undefined ? score : existingCall.score,
                    xpEarned: xpEarned !== undefined ? xpEarned : existingCall.xpEarned,
                    appointmentClosed: appointmentClosed !== undefined ? appointmentClosed : existingCall.appointmentClosed,
                    aciertos: aciertos || existingCall.aciertos,
                    errores: errores || existingCall.errores,
                    coachTip: coachTip || existingCall.coachTip
                }
            });

            const userStats = await prisma.roleplayStats.findUnique({
                where: { userId: existingCall.userId }
            });

            let updatedStats = null;
            if (userStats) {
                const xpDelta = (xpEarned !== undefined ? xpEarned : prevXp) - prevXp;
                const newXp = Math.max(0, userStats.xp + xpDelta);
                const newTodayXp = Math.max(0, userStats.todayXp + xpDelta);
                const closedDelta = (appointmentClosed === true && !prevClosed) ? 1 : 0;
                const newClosedCalls = userStats.closedCalls + closedDelta;
                const newLevel = calculateLevelFromXp(newXp);

                updatedStats = await prisma.roleplayStats.update({
                    where: { userId: existingCall.userId },
                    data: {
                        xp: newXp,
                        level: newLevel,
                        todayXp: newTodayXp,
                        closedCalls: newClosedCalls
                    }
                });
            }

            return NextResponse.json({
                success: true,
                call: updatedCall,
                stats: updatedStats
            });
        }

        return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
    } catch (err: any) {
        console.error("Error in debug POST:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
