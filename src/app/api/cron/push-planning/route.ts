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
        // 2. Obtener a todos los agentes activos que tienen al menos una suscripcin push
        const agents = await prisma.user.findMany({
            where: {
                role: 'AGENTE',
                active: true,
                pushSubscriptions: { some: {} }
            },
            include: {
                pushSubscriptions: true
            }
        });

        // 3. Configurar Web Push con llaves de Produccin
        webpush.setVapidDetails(
            process.env.VAPID_SUBJECT || 'mailto:test@aacommx.com',
            process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
            process.env.VAPID_PRIVATE_KEY || ''
        );

        let pushedCount = 0;

        // 4. Para cada agente, enviar notificacin matutina
        const pushPromises = agents.map(async (agent) => {
            const payload = JSON.stringify({
                title: "¡Buenos días! ☀️ Planea tu éxito",
                body: "Por favor recuerda enviar tu planeación del día. ¡Vamos por esos 25 puntos hoy!",
                url: "/activity"
            });

            const agentPushes = agent.pushSubscriptions.map(sub => 
                webpush.sendNotification({
                    endpoint: sub.endpoint,
                    keys: { p256dh: sub.p256dh, auth: sub.auth }
                }, payload).catch(err => {
                    console.error(`Cron Push Planning failed for sub ${sub.id}`, err.statusCode);
                })
            );

            await Promise.all(agentPushes);
            pushedCount++;
        });

        await Promise.all(pushPromises);

        return NextResponse.json({ success: true, pushedTo: pushedCount });

    } catch (error: any) {
        console.error("Cron Push Planning Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
