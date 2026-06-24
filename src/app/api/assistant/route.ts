import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return new Response("No autenticado", { status: 401 });
        }

        const { messages, prompt } = await req.json();

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return new Response("API Key no configurada", { status: 500 });
        }

        const user = await prisma.user.findUnique({ 
            where: { email: session.user.email },
            include: { agency: true }
        });
        if (!user || !user.agencyId || !user.agency) {
            return new Response("Agencia no válida", { status: 403 });
        }
        
        const agencyName = user.agency.name || "SYSGPYA";

        // 1. Fetch active knowledge documents
        const activeDocs = await prisma.knowledgeDocument.findMany({
            where: { 
                active: true,
                OR: [
                    { agencyId: user.agencyId },
                    { isGlobalTemplate: true }
                ]
            },
            select: { title: true, content: true, isGlobalTemplate: true }
        });

        // 2. Format knowledge context
        let knowledgeContext = "BASE DE CONOCIMIENTOS OFICIAL:\n";
        if (activeDocs.length > 0) {
            activeDocs.forEach((doc, idx) => {
                knowledgeContext += `\n--- DOCUMENTO ${idx + 1} ${doc.isGlobalTemplate ? '(PLANTILLA GLOBAL)' : '(REGLA LOCAL DE AGENCIA)'}: ${doc.title} ---\n${doc.content}\n`;
            });
        } else {
            knowledgeContext += "(No hay documentos cargados. Responde con conocimientos generales sobre seguros pero aclara que no hay directivas internas activas.)\n";
        }

        // 3. Define rigid system instruction
        const systemInstruction = `Eres "Asistente ${agencyName}", el copiloto inteligente de la promotoría de seguros de vida, gastos médicos y ahorro.
Tu objetivo es dar soporte rápido, amigable y muy profesional a los agentes de seguros sobre lineamientos comerciales, cuadernos de bonos, adendums y condiciones generales de productos (como el Vitalicio o el Universal).

REGLAS ABSOLUTAS:
1. Basar tus respuestas de la manera más directa y estricta posible en la "BASE DE CONOCIMIENTOS OFICIAL" que se te provee más abajo.
2. REGLA DE ORO DE JERARQUÍA: Verás que algunos documentos están marcados como '(REGLA LOCAL DE AGENCIA)' y otros como '(PLANTILLA GLOBAL)'. Si hay CUALQUIER contradicción entre una regla local y una global, SIEMPRE dale prioridad y aplica la '(REGLA LOCAL DE AGENCIA)'. La regla local tiene autoridad absoluta.
3. Si la respuesta a la pregunta del agente no está contenida en la Base de Conocimientos oficial provista, responde textualmente:
"Lo lamento, no cuento con esa información en mis lineamientos comerciales oficiales en este momento. Por favor, consulta directamente con la dirección o el equipo administrativo."
Bajo ninguna circunstancia debes inventar porcentajes de comisiones, montos de bonos, plazos de productos o políticas comerciales.
4. Sé conciso y estructurado. Si respondes tablas o cifras, usa formato Markdown para que la lectura móvil sea impecable.
5. Responde en español de México.

${knowledgeContext}`;

        // 4. Form contents array
        const contents = [
            ...messages,
            {
                role: "user",
                parts: [{ text: prompt }]
            }
        ];

        // 5. Call Gemini API endpoint with STREAMING
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:streamGenerateContent?alt=sse&key=${apiKey}`;
        
        const googleRes = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents,
                systemInstruction: {
                    parts: [{ text: systemInstruction }]
                },
                generationConfig: {
                    temperature: 0.1,
                    topP: 0.95,
                    maxOutputTokens: 8192
                }
            })
        });

        if (!googleRes.ok) {
            const err = await googleRes.text();
            console.error("Google API Error:", err);
            return new Response("Error del servidor de IA", { status: 500 });
        }

        // Return the raw SSE stream directly to the client
        return new Response(googleRes.body, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive"
            }
        });

    } catch (error: any) {
        console.error("Error in streaming API:", error);
        return new Response("Error interno del servidor", { status: 500 });
    }
}
