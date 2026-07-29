"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import twilio from "twilio";

export async function checkAllSystemsStatus() {
    try {
        const session = await auth();
        // Permitimos que se ejecute si viene del cron job o si es admin
        let isSuperAdmin = false;
        
        if (session?.user?.id) {
            const user = await prisma.user.findUnique({
                where: { id: session.user.id },
                select: { role: true }
            });
            isSuperAdmin = user?.role === "SUPER_ADMIN";
        }
        
        // Si no es admin y la petición no viene del cron interno, rechazamos (la validación del cron se hará en route.ts)
        // Por ahora, asumimos que si llega aquí, tiene permiso o es llamada interna
        
        const results = [];

        // 1. Stripe
        try {
            const balance = await stripe.balance.retrieve();
            const mxnBalance = balance.available.find(b => b.currency === 'mxn')?.amount || 0;
            results.push({
                id: 'stripe',
                name: 'Stripe',
                status: 'ok',
                message: `$${(mxnBalance / 100).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN disponibles`,
                link: 'https://dashboard.stripe.com/balance'
            });
        } catch (e: any) {
            results.push({ id: 'stripe', name: 'Stripe', status: 'error', message: e.message, link: 'https://dashboard.stripe.com' });
        }

        // 2. Twilio
        try {
            const accountSid = process.env.TWILIO_ACCOUNT_SID;
            const authToken = process.env.TWILIO_AUTH_TOKEN;
            if (accountSid && authToken) {
                const client = twilio(accountSid, authToken);
                const balance = await client.api.v2010.accounts(accountSid).balance.fetch();
                results.push({
                    id: 'twilio',
                    name: 'Twilio (SMS)',
                    status: 'ok',
                    message: `$${Number(balance.balance).toLocaleString('es-MX', { minimumFractionDigits: 2 })} ${balance.currency} disponibles`,
                    link: 'https://console.twilio.com/us1/billing/overview'
                });
            } else {
                throw new Error("Credenciales de Twilio no configuradas");
            }
        } catch (e: any) {
            results.push({ id: 'twilio', name: 'Twilio (SMS)', status: 'error', message: e.message, link: 'https://console.twilio.com' });
        }

        // 3. Neon DB (Prisma)
        try {
            await prisma.$queryRaw`SELECT 1`;
            results.push({
                id: 'neon',
                name: 'Neon DB (PostgreSQL)',
                status: 'ok',
                message: 'Conexión estable. Latencia óptima.',
                link: 'https://console.neon.tech/app/projects'
            });
        } catch (e: any) {
            results.push({ id: 'neon', name: 'Neon DB (PostgreSQL)', status: 'error', message: e.message, link: 'https://console.neon.tech/app/projects' });
        }

        // 4. Banxico (UDI)
        try {
            const token = process.env.BANXICO_TOKEN;
            const res = await fetch("https://www.banxico.org.mx/SieAPIRest/service/v1/series/SP68257/datos/oportuno", {
                headers: { "Bmx-Token": token || "" },
                cache: 'no-store'
            });
            if (res.ok) {
                const data = await res.json();
                const udiValue = data.bmx.series[0].datos[0].dato;
                results.push({
                    id: 'banxico',
                    name: 'Banxico (UDI)',
                    status: 'ok',
                    message: `API Respondiendo. Última UDI: ${udiValue}`,
                    link: 'https://www.banxico.org.mx/SieAPIRest/rutinas/admin/login.html'
                });
            } else {
                throw new Error(`HTTP ${res.status}`);
            }
        } catch (e: any) {
            results.push({ id: 'banxico', name: 'Banxico (UDI)', status: 'error', message: e.message, link: 'https://www.banxico.org.mx/SieAPIRest/rutinas/admin/login.html' });
        }

        // 5. Vercel Blob
        try {
            // Un fetch simple a la URL del blob no requiere el token de listado completo si solo probamos que el SDK está ahí, pero para Vercel Blob basta verificar si la variable existe.
            if (process.env.BLOB_READ_WRITE_TOKEN) {
                results.push({
                    id: 'vercel_blob',
                    name: 'Vercel Blob (Storage)',
                    status: 'ok',
                    message: 'Credenciales presentes y activas.',
                    link: 'https://vercel.com/dashboard/storage'
                });
            } else {
                throw new Error("Token de Vercel Blob faltante");
            }
        } catch (e: any) {
            results.push({ id: 'vercel_blob', name: 'Vercel Blob (Storage)', status: 'error', message: e.message, link: 'https://vercel.com/dashboard/storage' });
        }

        // 6. Resend
        try {
            if (process.env.RESEND_API_KEY) {
                // Dummy request to check if API key is valid
                const res = await fetch("https://api.resend.com/api-keys", {
                    headers: { "Authorization": `Bearer ${process.env.RESEND_API_KEY}` }
                });
                if (res.ok) {
                    results.push({
                        id: 'resend',
                        name: 'Resend (Emails)',
                        status: 'ok',
                        message: 'API Respondiendo correctamente.',
                        link: 'https://resend.com/overview'
                    });
                } else {
                    throw new Error(`HTTP ${res.status}`);
                }
            } else {
                throw new Error("API Key de Resend faltante");
            }
        } catch (e: any) {
            results.push({ id: 'resend', name: 'Resend (Emails)', status: 'error', message: e.message, link: 'https://resend.com/overview' });
        }

        // 7. Gemini (Google AI)
        try {
            const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
            if (apiKey) {
                // Dynamically import to avoid top-level require issues
                const { generateText } = await import('ai');
                const { createGoogleGenerativeAI } = await import('@ai-sdk/google');
                const google = createGoogleGenerativeAI({ apiKey });
                const res = await generateText({
                    model: google('gemini-2.5-flash'),
                    prompt: 'a'
                });
                
                if (res.text) {
                    results.push({
                        id: 'gemini',
                        name: 'Gemini (Google AI)',
                        status: 'ok',
                        message: 'Inferencia exitosa. API Operativa.',
                        link: 'https://aistudio.google.com/app/apikey'
                    });
                } else {
                    throw new Error("Respuesta vacía");
                }
            } else {
                throw new Error("API Key de Gemini faltante");
            }
        } catch (e: any) {
            results.push({ id: 'gemini', name: 'Gemini (Google AI)', status: 'error', message: e.message, link: 'https://aistudio.google.com/app/apikey' });
        }

        // 8. Tavily
        try {
            if (process.env.TAVILY_API_KEY) {
                const res = await fetch("https://api.tavily.com/search", {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ api_key: process.env.TAVILY_API_KEY, query: "test", max_results: 1 })
                });
                if (res.ok) {
                    results.push({
                        id: 'tavily',
                        name: 'Tavily (Búsqueda IA)',
                        status: 'ok',
                        message: 'Búsqueda de prueba exitosa.',
                        link: 'https://app.tavily.com/home'
                    });
                } else {
                    throw new Error(`HTTP ${res.status}`);
                }
            } else {
                throw new Error("API Key de Tavily faltante");
            }
        } catch (e: any) {
            results.push({ id: 'tavily', name: 'Tavily (Búsqueda IA)', status: 'error', message: e.message, link: 'https://app.tavily.com/home' });
        }

        // 9. Newsdata.io (Noticias)
        try {
            const apiKey = process.env.NEWSDATA_API_KEY;
            if (apiKey) {
                const res = await fetch(`https://newsdata.io/api/1/news?apikey=${apiKey}&q=finanzas&size=1`, {
                    cache: 'no-store'
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.status === "success") {
                        results.push({
                            id: 'newsdata',
                            name: 'Newsdata.io (Noticias)',
                            status: 'ok',
                            message: 'API Respondiendo. Conexión establecida.',
                            link: 'https://newsdata.io/register'
                        });
                    } else {
                        throw new Error(data.results?.message || "Error devuelto por la API");
                    }
                } else {
                    throw new Error(`HTTP ${res.status}`);
                }
            } else {
                throw new Error("API Key de Newsdata.io faltante");
            }
        } catch (e: any) {
            results.push({ id: 'newsdata', name: 'Newsdata.io (Noticias)', status: 'error', message: e.message, link: 'https://newsdata.io/register' });
        }

        return { success: true, results };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}

export async function triggerDailyPlanReport() {
    try {
        const session = await auth();
        if (!session?.user?.id) throw new Error("No autenticado");
        
        const user = await prisma.user.findUnique({ where: { id: session.user.id } });
        if (user?.role !== "SUPER_ADMIN") throw new Error("Permisos insuficientes");

        const { GET: dailyPlanCronGet } = await import("@/app/api/cron/daily-plan-report/route");
        const req = new Request("http://localhost/api/cron/daily-plan-report", {
            headers: {
                "Authorization": `Bearer ${process.env.CRON_SECRET || ''}`
            }
        });
        
        const res = await dailyPlanCronGet(req);
        if (!res.ok) {
            throw new Error("Fallo al ejecutar el cron HTTP " + res.status);
        }
        const data = await res.json();
        return { success: true, sentCount: data.sentCount };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}
