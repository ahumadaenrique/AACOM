import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { twilioClient } from "@/lib/twilio";
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

        // Robust parsing of WhatsApp Sender Number to prevent Twilio API rejections
        const rawWaFrom = process.env.TWILIO_WHATSAPP_NUMBER || process.env.TWILIO_PHONE_NUMBER || "+14155238886";
        const cleanWaFrom = rawWaFrom.replace("whatsapp:", "").replace(/\s+/g, "").replace(/^\+/, "");
        const waFromNumber = `+${cleanWaFrom}`;

        // Plantilla de Planeación (10:00 AM)
        const templateSid = process.env.TWILIO_WA_TEMPLATE_PLANNER_SID || "HX7f9aa2c868c568450acc5e5e9e3a3fab";

        let sentCount = 0;

        for (const agency of agencies) {
            // Find all active admins in this agency who opted in to the 10:00 AM report
            const admins = await prisma.user.findMany({
                where: {
                    agencyId: agency.id,
                    role: { in: ["ADMIN", "SUPER_ADMIN"] },
                    active: true,
                    ...(testUserId ? { id: testUserId } : { waNotify10am: true }),
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

            // Build recipient list: [{ phone, agentIds: Set<string> }]
            const recipients: { phone: string; agentIds: Set<string> }[] = [];

            for (const admin of admins) {
                const rawPhone = (admin.phone || "").trim();
                const agentIds = (admin.waSelectedAgents || "")
                    .split(",")
                    .map(id => id.trim())
                    .filter(Boolean);
                if (rawPhone && agentIds.length > 0) {
                    const digitsOnly = rawPhone.replace(/[\s()-]/g, "").replace(/^\+/, "");
                    const formattedPhone = /^\d{10}$/.test(digitsOnly)
                        ? `+52${digitsOnly}`
                        : `+${digitsOnly}`;
                    recipients.push({
                        phone: formattedPhone,
                        agentIds: new Set(agentIds),
                    });
                }
            }

            // Legacy fallback if no admin has individual config yet (only during normal cron, not single-user test)
            if (!testUserId && recipients.length === 0 && agency.whatsAppPlannerPhones && agency.whatsAppPlannerAgents) {
                const legacyAgents = agency.whatsAppPlannerAgents.split(",").map(id => id.trim()).filter(Boolean);
                const legacyPhones = agency.whatsAppPlannerPhones.split(",").map(p => p.trim()).filter(Boolean);
                if (legacyAgents.length > 0 && legacyPhones.length > 0) {
                    for (const lp of legacyPhones) {
                        const formattedPhone = lp.startsWith("+") ? lp : `+${lp}`;
                        recipients.push({
                            phone: formattedPhone,
                            agentIds: new Set(legacyAgents),
                        });
                    }
                }
            }

            if (recipients.length === 0) continue;

            // Collect union of all agent IDs requested across all admins in this agency
            const allAgentIds = Array.from(
                new Set(recipients.flatMap(r => Array.from(r.agentIds)))
            );
            if (allAgentIds.length === 0) continue;

            // 2. Fetch users and their daily records (strictly scoped to agency.id)
            const users = await prisma.user.findMany({
                where: {
                    id: { in: allAgentIds },
                    agencyId: agency.id,
                    active: true,
                },
                include: {
                    dailyRecords: {
                        where: { date: isoDateStr }
                    }
                }
            });

            // Precompute the report variables per agent
            const agentReports = new Map<string, { userName: string; totalPts: number; msgText: string }>();

            for (const user of users) {
                let totalPts = 0;
                const details: string[] = [];

                for (const record of user.dailyRecords) {
                    const pts = record.planned || 0;
                    if (pts > 0) {
                        const act = SALES_ACTIVITIES.find(a => a.id === record.activityId);
                        if (act) {
                            totalPts += pts * act.value;
                            details.push(`${pts} ${act.name.toLowerCase()}`);
                        }
                    }
                }

                const userName = user.name || "Agente";
                const firstName = userName.split(" ")[0];
                const detailsStr = details.length > 0 ? `(${details.join(", ")})` : "";
                let msgText = "";

                if (totalPts === 0) {
                    msgText = `🔸 Hoy no planeó nada, seguro está de vacaciones o se quedó dormid@. ¿Nos confirmas ${firstName}?`;
                } else if (totalPts >= 25) {
                    msgText = `✅ Planeó los puntos correctos ${detailsStr}. Muy bien, avísanos cómo te ayudamos para que SI los cumplas.`;
                } else {
                    const missing = 25 - totalPts;
                    msgText = `⚠️ Faltan ${missing} puntos para la meta ${detailsStr}. ¿Qué vas a hacer adicional?`;
                }

                agentReports.set(user.id, { userName, totalPts, msgText });
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
                                        "3": report.totalPts.toString(),
                                        "4": report.msgText,
                                    }),
                                })
                                .then(() => {
                                    sentCount++;
                                })
                                .catch((e) => {
                                    console.error(
                                        `Error sending WhatsApp 10am plan report to ${recipient.phone} for agent ${report.userName}:`,
                                        e
                                    );
                                })
                        );
                    }
                }

                await Promise.allSettled(sendTasks);
            } else {
                console.warn("Twilio client is not configured, skipped sending 10am messages.");
            }
        }

        return NextResponse.json({ success: true, sentCount, dateStr });
    } catch (error: any) {
        console.error("Cron daily plan report error:", error);
        return new NextResponse(error.message, { status: 500 });
    }
}
