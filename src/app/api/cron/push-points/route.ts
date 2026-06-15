import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import webpush from 'web-push';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    // 1. Validar Token Seguro de Vercel Cron
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const setting = await prisma.setting.findUnique({ where: { key: 'push_points_enabled' } });
        if (setting && setting.value === 'false') return new NextResponse('Disabled', { status: 200 });
        // 2. Calcular la fecha actual en la CDMX ('YYYY-MM-DD')
        const todayDateStr = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' });

        // 3. Obtener a todos los agentes activos que tienen al menos una suscripción push
        const agents = await prisma.user.findMany({
            where: {
                role: 'AGENTE',
                active: true,
                pushSubscriptions: { some: {} }
            },
            include: {
                activityLogs: {
                    where: { dateStr: todayDateStr }
                },
                pushSubscriptions: true
            }
        });

        // 4. Configurar Web Push con llaves de Producción
        webpush.setVapidDetails(
            process.env.VAPID_SUBJECT || 'mailto:test@aacommx.com',
            process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
            process.env.VAPID_PRIVATE_KEY || ''
        );

        let pushedCount = 0;

        // 5. Para cada agente, sumar sus puntos y validar meta
        const pushPromises = agents.map(async (agent) => {
            const todayPoints = agent.activityLogs.reduce((acc, log) => acc + log.points, 0);

            if (todayPoints < 25) {
                const missingPoints = 25 - todayPoints;
                const payload = JSON.stringify({
                    title: "¡Tú puedes cerrar bien tu día! 🚀",
                    body: `Llevas ${todayPoints} puntos. Ya solo te faltan ${missingPoints} puntos para tu meta diaria de 25. ¡Venga!`,
                    url: "/activity"
                });

                const agentPushes = agent.pushSubscriptions.map(sub => 
                    webpush.sendNotification({
                        endpoint: sub.endpoint,
                        keys: { p256dh: sub.p256dh, auth: sub.auth }
                    }, payload, { urgency: 'high' }).catch(err => {
                        console.error(`Cron Push failed for sub ${sub.id}`, err.statusCode);
                    })
                );

                await Promise.all(agentPushes);
                pushedCount++;
            }
        });

        await Promise.all(pushPromises);

        return NextResponse.json({ success: true, pushedTo: pushedCount, dateStr: todayDateStr });

    } catch (error: any) {
        console.error("Cron Push Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}


