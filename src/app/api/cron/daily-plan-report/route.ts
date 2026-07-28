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
        // 1. Get all agencies that have WhatsApp Planner enabled
        const agencies = await prisma.agency.findMany({
            where: {
                active: true,
                enableWhatsAppPlanner: true,
                whatsAppPlannerPhones: { not: null }
            }
        });

        const today = new Date();
        const year = today.getFullYear();
        const month = (today.getMonth() + 1).toString().padStart(2, "0");
        const day = today.getDate().toString().padStart(2, "0");
        const dateStr = `${year}-${month}-${day}`;

        const waFromNumber = process.env.TWILIO_WHATSAPP_NUMBER || process.env.TWILIO_PHONE_NUMBER || '+14155238886';
        
        // Plantilla
        const templateSid = process.env.TWILIO_WA_TEMPLATE_PLANNER_SID || "HX_TBD";

        let sentCount = 0;

        for (const agency of agencies) {
            const agentIdsStr = agency.whatsAppPlannerAgents;
            if (!agentIdsStr) continue;

            const agentIds = agentIdsStr.split(",").filter(id => id.trim() !== "");
            if (agentIds.length === 0) continue;

            const targetPhonesStr = agency.whatsAppPlannerPhones;
            if (!targetPhonesStr) continue;
            
            const targetPhones = targetPhonesStr.split(",").map(p => p.trim()).filter(p => p !== "");
            if (targetPhones.length === 0) continue;

            // 2. Fetch users and their daily records
            const users = await prisma.user.findMany({
                where: {
                    id: { in: agentIds },
                    agencyId: agency.id,
                    active: true,
                },
                include: {
                    dailyRecords: {
                        where: { date: dateStr }
                    }
                }
            });

            // 3. Build the report and send per user
            for (const user of users) {
                let totalPts = 0;
                let details = [];

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

                if (twilioClient) {
                    for (const phone of targetPhones) {
                        try {
                            const formattedPhone = phone.startsWith("+") ? phone : `+${phone}`;
                            await twilioClient.messages.create({
                                from: `whatsapp:${waFromNumber}`,
                                to: `whatsapp:${formattedPhone}`,
                                contentSid: templateSid,
                                contentVariables: JSON.stringify({
                                    "1": dateStr,
                                    "2": userName,
                                    "3": totalPts.toString(),
                                    "4": msgText
                                })
                            });
                            sentCount++;
                        } catch (e) {
                            console.error(`Error sending WhatsApp plan report to ${phone} for agent ${userName}:`, e);
                        }
                    }
                } else {
                    console.warn("Twilio client is not configured, skipped sending messages.");
                }
            }
        }

        return NextResponse.json({ success: true, sentCount });
    } catch (error: any) {
        console.error("Cron daily plan report error:", error);
        return new NextResponse(error.message, { status: 500 });
    }
}
