import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import webpush from 'web-push';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const mexicoTime = new Date(new Date().toLocaleString("en-US", {timeZone: "America/Mexico_City"}));
        const currentHour = mexicoTime.getHours();
        const currentDateStr = `${mexicoTime.getFullYear()}-${String(mexicoTime.getMonth() + 1).padStart(2, '0')}-${String(mexicoTime.getDate()).padStart(2, '0')}`;

        const scheduledPushes = await prisma.scheduledPush.findMany({
            where: {
                timeHour: currentHour,
                OR: [
                    { frequency: 'DAILY' },
                    { frequency: 'ONCE', runDate: currentDateStr }
                ]
            }
        });

        if (scheduledPushes.length === 0) {
            return NextResponse.json({ status: "No scheduled pushes for this hour." });
        }

        webpush.setVapidDetails(
            process.env.VAPID_SUBJECT || 'mailto:test@aacommx.com',
            process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
            process.env.VAPID_PRIVATE_KEY || ''
        );

        let pushedCount = 0;

        for (const sp of scheduledPushes) {
            const payload = JSON.stringify({
                title: "Notificación Programada",
                body: sp.message,
                url: "/"
            });

            let usersFilter: any;
            if (sp.recipientId === "ALL" || sp.recipientId.includes("ALL")) {
                usersFilter = { role: "AGENTE", active: true };
            } else {
                const ids = sp.recipientId.split(',');
                usersFilter = { id: { in: ids }, active: true };
            }

            const agents = await prisma.user.findMany({
                where: usersFilter,
                include: { pushSubscriptions: true }
            });

            for (const agent of agents) {
                const subs = agent.pushSubscriptions;
                const promises = subs.map(sub => 
                    webpush.sendNotification({
                        endpoint: sub.endpoint,
                        keys: { p256dh: sub.p256dh, auth: sub.auth }
                    }, payload, { urgency: 'high' }).catch(err => {
                        console.error(`Cron Push Master failed for sub ${sub.id}`, err.statusCode);
                    })
                );
                await Promise.all(promises);
                if (subs.length > 0) pushedCount++;
            }

            if (sp.frequency === 'ONCE') {
                await prisma.scheduledPush.delete({ where: { id: sp.id } });
            }
        }

        return NextResponse.json({ success: true, agentsPushed: pushedCount, pushesProcessed: scheduledPushes.length });
    } catch (error: any) {
        console.error("Error in master push cron:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
