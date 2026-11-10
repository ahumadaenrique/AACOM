import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { twilioClient, normalizePhoneForTwilio } from "@/lib/twilio";
import { SALES_ACTIVITIES } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    // Check Authorization header for Vercel Cron
    const authHeader = request.headers.get("authorization");
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const url = new URL(request.url);
        const testUserId = url.searchParams.get("testUserId");

        // 1. Get all active agencies authorized by Super Admin for WhatsApp Notifications
        const agencies = await prisma.agency.findMany({
            where: {
                active: true,
                enableWhatsAppPlanner: true,
            }
        });

        // Date in Mexico City timezone (YYYY-MM-DD)
        const dateStr = new Date().toLocaleDateString("en-CA", { timeZone: "America/Mexico_City" });
        const isoDateStr = `${dateStr}T00:00:00.000Z`;

        // Robust parsing of WhatsApp Sender Number
        const rawWaFrom = process.env.TWILIO_WHATSAPP_NUMBER || process.env.TWILIO_PHONE_NUMBER || "+14155238886";
        const cleanWaFrom = rawWaFrom.replace("whatsapp:", "").replace(/\s+/g, "").replace(/^\+/, "");
        const waFromNumber = `+${cleanWaFrom}`;

        // Plantilla para el corte de Puntos Reales (6:00 PM), con respaldo a la plantilla general si aún no se configura la nueva
        const templateSid =
            process.env.TWILIO_WA_TEMPLATE_REAL_POINTS_SID ||
            process.env.TWILIO_WA_TEMPLATE_PLANNER_SID ||
            "HX7f9aa2c868c568450acc5e5e9e3a3fab";

        let sentCount = 0;

        for (const agency of agencies) {
            // Find all active admins in this agency who opted in to the 6:00 PM Real Points report
            const admins = await prisma.user.findMany({
                where: {
                    agencyId: agency.id,
                    role: { in: ["ADMIN", "SUPER_ADMIN"] },
                    active: true,
                    ...(testUserId ? { id: testUserId } : { waNotify6pm: true }),
                    phone: { not: null },
                    waSelectedAgents: { not: null },
                },
                select: {
                    id: true,
                    name: true,
                    phone: true,
                    waSelectedAgents: true,
                }
            });

            const recipients: { phone: string; agentIds: Set<string> }[] = [];

            for (const admin of admins) {
                const formattedPhone = normalizePhoneForTwilio(admin.phone);
                const agentIds = (admin.waSelectedAgents || "")
                    .split(",")
                    .map(id => id.trim())
                    .filter(Boolean);
                if (formattedPhone && agentIds.length > 0) {
                    recipients.push({
                        phone: formattedPhone,
                        agentIds: new Set(agentIds),
                    });
                }
            }

            if (recipients.length === 0) continue;

            // Collect union of all agent IDs requested across all admins in this agency
            const allAgentIds = Array.from(
                new Set(recipients.flatMap(r => Array.from(r.agentIds)))
            );
            if (allAgentIds.length === 0) continue;

            // 2. Fetch users, their real ActivityLogs for today, and DailyRecords fallback (strictly scoped to agency.id)
            const users = await prisma.user.findMany({
                where: {
                    id: { in: allAgentIds },
                    agencyId: agency.id,
                    active: true,
                },
                include: {
                    activityLogs: {
                        where: { dateStr }
                    },
                    dailyRecords: {
                        where: { date: isoDateStr }
                    }
                }
            });

            // Precompute the 6:00 PM Real Points report per agent
            const agentReports = new Map<string, { userName: string; totalRealPts: number; msgText: string }>();

            for (const user of users) {
                let totalRealPts = 0;
                const details: string[] = [];

                if (user.activityLogs && user.activityLogs.length > 0) {
                    const countByActivity = new Map<string, number>();
                    for (const log of user.activityLogs) {
                        totalRealPts += log.points || 0;
                        const label = (log.activityName || "actividad").toLowerCase();
                        countByActivity.set(label, (countByActivity.get(label) || 0) + 1);
                    }
                    countByActivity.forEach((count, label) => {
                        details.push(`${count} ${label}`);
                    });
                } else if (user.dailyRecords && user.dailyRecords.length > 0) {
                    for (const record of user.dailyRecords) {
                        const realCount = record.real || 0;
                        if (realCount > 0) {
                            const act = SALES_ACTIVITIES.find(a => a.id === record.activityId);
                            if (act) {
                                totalRealPts += realCount * act.value;
                                details.push(`${realCount} ${act.name.toLowerCase()}`);
                            }
                        }
                    }
                }

                const userName = user.name || "Agente";
                const firstName = userName.split(" ")[0];
                const detailsStr = details.length > 0 ? `(${details.join(", ")})` : "";
                let msgText = "";

                if (totalRealPts === 0) {
                    msgText = `🔸 Corte 6:00 PM: Hoy registró 0 puntos reales de los 25 pts. ¿Qué pasó hoy ${firstName}?`;
                } else if (totalRealPts >= 25) {
                    msgText = `🏆 ¡Meta cumplida! Al corte de las 6:00 PM logró ${totalRealPts} puntos reales de 25 ${detailsStr}. ¡Excelente cierre de día!`;
                } else {
                    const missing = 25 - totalRealPts;
                    msgText = `📊 Corte 6:00 PM: Lleva ${totalRealPts} de 25 puntos reales ${detailsStr}. Le faltaron ${missing} puntos para la meta diaria.`;
                }

                agentReports.set(user.id, { userName, totalRealPts, msgText });
            }

            // 3. Send messages in parallel per recipient
            if (twilioClient) {
                const sendTasks: Promise<void>[] = [];

                for (const recipient of recipients) {
                    for (const agentId of Array.from(recipient.agentIds)) {
                        const report = agentReports.get(agentId);
                        if (!report) continue;

                        sendTasks.push(
                            twilioClient.messages
                                .create({
                                    from: `whatsapp:${waFromNumber}`,
                                    to: `whatsapp:${recipient.phone}`,
                                    contentSid: templateSid,
                                    contentVariables: JSON.stringify({
                                        "1": dateStr,
                                        "2": report.userName,
                                        "3": report.totalRealPts.toString(),
                                        "4": report.msgText,
                                    }),
                                })
                                .then(() => {
                                    sentCount++;
                                })
                                .catch((e) => {
                                    console.error(
                                        `Error sending WhatsApp 6pm real points report to ${recipient.phone} for agent ${report.userName}:`,
                                        e
                                    );
                                })
                        );
                    }
                }

                await Promise.allSettled(sendTasks);
            } else {
                console.warn("Twilio client is not configured, skipped sending 6pm messages.");
            }
        }

        return NextResponse.json({ success: true, sentCount, dateStr });
    } catch (error: any) {
        console.error("Cron daily real points report error:", error);
        return new NextResponse(error.message, { status: 500 });
    }
}
