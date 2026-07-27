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

            // 3. Build the report string
            let reportText = `*Reporte de Planeación - ${dateStr}*\n\n`;

            for (const user of users) {
                const record = user.dailyRecords[0];
                const plannedObj = record?.planned ? (typeof record.planned === "string" ? JSON.parse(record.planned) : record.planned) : {};
                
                let totalPts = 0;
                let details = [];

                for (const act of SALES_ACTIVITIES) {
                    const pts = plannedObj[act.id] || 0;
                    if (pts > 0) {
                        totalPts += pts * act.value;
                        details.push(`${pts} ${act.name.toLowerCase()}`);
                    }
                }

                const userName = user.name || "Agente";
                const firstName = userName.split(" ")[0];

                if (totalPts === 0) {
                    reportText += `🔸 *${userName}* hoy no planeó nada, seguro está de vacaciones o se quedó dormid@. ¿Nos confirmas ${firstName}?\n\n`;
                } else if (totalPts >= 25) {
                    reportText += `✅ *${userName}* planeó ${totalPts} puntos (${details.join(", ")}). Muy bien, avísanos cómo te ayudamos para que SI los cumplas.\n\n`;
                } else {
                    const missing = 25 - totalPts;
                    reportText += `⚠️ *${userName}* ha planeado ${totalPts} puntos (${details.join(", ")}). Venga, te faltan ${missing} puntos para una planeación ideal, ¿Cuéntanos qué vas a hacer adicional?\n\n`;
                }
            }

            // 4. Send to all target phones
            if (twilioClient) {
                for (const phone of targetPhones) {
                    try {
                        const formattedPhone = phone.startsWith("+") ? phone : `+${phone}`;
                        await twilioClient.messages.create({
                            from: `whatsapp:${waFromNumber}`,
                            to: `whatsapp:${formattedPhone}`,
                            contentSid: templateSid,
                            contentVariables: JSON.stringify({
                                "1": reportText.substring(0, 32000) 
                            })
                        });
                        sentCount++;
                    } catch (e) {
                        console.error(`Error sending WhatsApp plan report to ${phone}:`, e);
                    }
                }
            } else {
                console.warn("Twilio client is not configured, skipped sending messages.");
            }
        }

        return NextResponse.json({ success: true, sentCount });
    } catch (error: any) {
        console.error("Cron daily plan report error:", error);
        return new NextResponse(error.message, { status: 500 });
    }
}
