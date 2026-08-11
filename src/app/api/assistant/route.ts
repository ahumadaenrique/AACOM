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

        // 2. Fetch agent's portfolio (Cartera)
        const isAdmin = user.role === 'ADMIN' || user.role === 'SUPERADMIN';
        const policyWhereClause = isAdmin && user.agencyId ? { agencyId: user.agencyId } : { userId: user.id };

        const agentPolicies = await prisma.policy.findMany({
            where: policyWhereClause,
            include: { client: true, user: true },
            take: 2000 // safeguard against huge payloads
        });

        let portfolioContext = "";
        if (agentPolicies.length > 0) {
            portfolioContext = "\nBASE DE DATOS DE CARTERA DEL AGENTE (SOLO LECTURA):\n";
            portfolioContext += "Esta es la información real y confidencial de la cartera de clientes y pólizas. Úsala para responder preguntas sobre sus renovaciones, primas o clientes.\n\n";
            
            agentPolicies.forEach(p => {
                const clientName = p.client?.name || p.contractor || "Sin Nombre";
                const agentName = p.user?.name ? ` (Agente: ${p.user.name})` : "";
                const renDate = p.renewalDate ? new Date(p.renewalDate).toLocaleDateString('es-MX') : "N/A";
                const prima = p.annualPremium ? `$${p.annualPremium.toLocaleString('es-MX')} MXN` : "No especificada";
                portfolioContext += `- Cliente: ${clientName}${agentName} | Póliza: ${p.policyNumber || 'S/N'} | Compañía: ${p.insuranceCompany || 'N/A'} | Producto: ${p.product || 'N/A'} | Renovación: ${renDate} | Prima: ${prima}\n`;
            });
        }

        // 3. Format knowledge context
        let knowledgeContext = "BASE DE CONOCIMIENTOS OFICIAL:\n";
        if (activeDocs.length > 0) {
            activeDocs.forEach((doc, idx) => {
                knowledgeContext += `\n--- DOCUMENTO ${idx + 1} ${doc.isGlobalTemplate ? '(PLANTILLA GLOBAL)' : '(REGLA LOCAL DE AGENCIA)'}: ${doc.title} ---\n${doc.content}\n`;
            });
        } else {
            knowledgeContext += "(No hay documentos cargados. Responde con conocimientos generales sobre seguros pero aclara que no hay directivas internas activas.)\n";
        }

        // 4. Define rigid system instruction
        const systemInstruction = `Eres "Asistente ${agencyName}", el copiloto inteligente de la promotoría de seguros de vida, gastos médicos y ahorro.
Tu objetivo es dar soporte rápido, amigable y muy profesional a los agentes de seguros sobre lineamientos comerciales, cuadernos de bonos, adendums, condiciones generales de productos (como el Vitalicio o el Universal) Y brindar información de su Cartera de clientes.

REGLAS ABSOLUTAS:
1. Basar tus respuestas de la manera más directa y estricta posible en la "BASE DE CONOCIMIENTOS OFICIAL" y en la "BASE DE DATOS DE CARTERA DEL AGENTE" que se te proveen más abajo.
2. REGLA DE ORO DE JERARQUÍA: Verás que algunos documentos están marcados como '(REGLA LOCAL DE AGENCIA)' y otros como '(PLANTILLA GLOBAL)'. Si hay CUALQUIER contradicción entre una regla local y una global, SIEMPRE dale prioridad y aplica la '(REGLA LOCAL DE AGENCIA)'. La regla local tiene autoridad absoluta.
3. Si te preguntan sobre su cartera, clientes, pólizas o renovaciones, busca exhaustivamente en la sección "BASE DE DATOS DE CARTERA DEL AGENTE" y dales la información precisa.
4. Si la respuesta a la pregunta del agente no está contenida en la Base de Conocimientos ni en su Cartera de Clientes, responde textualmente:
"Lo lamento, no cuento con esa información en mis registros ni lineamientos comerciales en este momento. Por favor, consulta directamente con la dirección o el equipo administrativo."
Bajo ninguna circunstancia debes inventar porcentajes de comisiones, montos de bonos, plazos de productos o políticas comerciales.
5. Sé conciso y estructurado. Si respondes tablas o cifras, usa formato Markdown para que la lectura móvil sea impecable.
6. Responde en español de México.

${knowledgeContext}
${portfolioContext}`;

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
