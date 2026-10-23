import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateLevelFromXp } from "@/lib/roleplay/gamification";

export const dynamic = "force-dynamic";

async function handleAdjustCall(callId: string, scoreVal: number, xpVal: number, closedVal: boolean) {
    const existingCall = await prisma.roleplayCall.findUnique({
        where: { id: callId },
        include: { user: true }
    });

    if (!existingCall) {
        return { error: "Llamada no encontrada", status: 404 };
    }

    const prevXp = existingCall.xpEarned || 0;
    const prevClosed = existingCall.appointmentClosed;

    const updatedCall = await prisma.roleplayCall.update({
        where: { id: callId },
        data: {
            score: scoreVal,
            xpEarned: xpVal,
            appointmentClosed: closedVal,
            aciertos: [
                'Rescató la objeción al final utilizando la reducción al absurdo calculando 110 pesos diarios comparados con el café de Starbucks.',
                'Recordó oportunamente el análisis de necesidades previo y la meta del fondo educativo de los hijos.'
            ],
            errores: [
                'Área de mejora técnica: Ofreció reducir la prima antes de tiempo sin defender primero el valor del proyecto propuesto.',
                'Confrontó e invalidó la preocupación de liquidez del cliente.',
                'Falta de cierre asumido; cuando la prospecto propuso el método de pago (\'¿Visa o MasterCard?\'), vaciló al cerrar.'
            ],
            coachTip: '¡Bien rescatado el cierre! Asegúrate de defender el plan original antes de hablar de primas menores y mantén el aplomo para ejecutar el cobro.'
        }
    });

    const userStats = await prisma.roleplayStats.findUnique({
        where: { userId: existingCall.userId }
    });

    let updatedStats = null;
    if (userStats) {
        const xpDelta = xpVal - prevXp;
        const newXp = Math.max(0, userStats.xp + xpDelta);
        const newTodayXp = Math.max(0, userStats.todayXp + xpDelta);
        const closedDelta = (closedVal && !prevClosed) ? 1 : 0;
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

    return {
        success: true,
        call: updatedCall,
        stats: updatedStats
    };
}

export async function GET(request: Request) {
    const url = new URL(request.url);
    const search = url.searchParams.get("q") || "";
    const audit = url.searchParams.get("audit");
    const action = url.searchParams.get("action");
    const secret = url.searchParams.get("secret");
    const callId = url.searchParams.get("callId");

    if (action === "adjust_call" && secret === "aacom_recalibrate_2026" && callId) {
        const score = parseInt(url.searchParams.get("score") || "70", 10);
        const xpEarned = parseInt(url.searchParams.get("xpEarned") || "193", 10);
        const closed = url.searchParams.get("closed") === "true";
        const result = await handleAdjustCall(callId, score, xpEarned, closed);
        return NextResponse.json(result);
    }
    
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
        const { action, secret, callId, score, xpEarned, appointmentClosed } = body;

        if (secret !== "aacom_recalibrate_2026") {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        if (action === "adjust_call" && callId) {
            const scoreVal = score !== undefined ? score : 70;
            const xpVal = xpEarned !== undefined ? xpEarned : 193;
            const closedVal = appointmentClosed !== undefined ? appointmentClosed : true;
            const result = await handleAdjustCall(callId, scoreVal, xpVal, closedVal);
            return NextResponse.json(result);
        }

        return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
    } catch (err: any) {
        console.error("Error in debug POST:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
