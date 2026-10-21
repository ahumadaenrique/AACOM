import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { searchMarketConditionsForAssistant } from "@/lib/marketCgSearch";

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
        const isSuperAdmin = user.role === "SUPER_ADMIN" || user.role === "SUPERADMIN";
        const isAdmin = isSuperAdmin || user.role === "ADMIN";

        // 1. Fetch active local/global knowledge documents (short agency guidelines)
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

        // 2. Smart RAG search on the 640+ Market Condiciones Generales (only top matching fragments)
        const recentHistoryText = Array.isArray(messages)
            ? messages
                  .slice(-4)
                  .map((m: any) => (m?.parts || []).map((p: any) => p?.text || "").join(" "))
                  .join(" ")
            : "";

        const marketChunks = await searchMarketConditionsForAssistant({
            prompt: String(prompt || ""),
            recentHistoryText,
            agencyId: user.agencyId,
            isSuperAdmin,
            limit: 8,
        });

        // 3. Fetch agent's portfolio (Cartera)
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

        // 4. Format knowledge context
        let knowledgeContext = "BASE DE CONOCIMIENTOS OFICIAL:\n";
        if (activeDocs.length > 0) {
            activeDocs.forEach((doc, idx) => {
                knowledgeContext += `\n--- DOCUMENTO ${idx + 1} ${doc.isGlobalTemplate ? '(PLANTILLA GLOBAL)' : '(REGLA LOCAL DE AGENCIA)'}: ${doc.title} ---\n${doc.content}\n`;
            });
        } else {
            knowledgeContext += "(No hay directivas internas locales cargadas.)\n";
        }

        let marketCgContext = "";
        if (marketChunks.length > 0) {
            marketCgContext = "\nBANCO OFICIAL DE CONDICIONES GENERALES DEL MERCADO ASEGURADOR (FRAGMENTOS RELEVANTES):\n";
            marketCgContext += "Usa estos fragmentos contractuales oficiales de las aseguradoras para responder dudas sobre coberturas, períodos de espera, exclusiones, deducibles o cláusulas. Si citas un producto y tiene URL de descarga oficial, compártela al final en formato Markdown [Descargar Condiciones Generales Oficiales](URL).\n\n";
            marketChunks.forEach((chunk, i) => {
                const linkInfo = chunk.downloadUrl ? ` | PDF Oficial: ${chunk.downloadUrl}` : "";
                const notesInfo = chunk.notes ? ` | Registro/Notas: ${chunk.notes}` : "";
                marketCgContext += `\n[FRAGMENTO CG #${i + 1} — Aseguradora: ${chunk.aseguradora} | Ramo: ${chunk.ramo} | Producto: ${chunk.producto} (${chunk.year})${linkInfo}${notesInfo}]\n${chunk.content}\n`;
            });
        }

        // 5. Define system instruction
        const systemInstruction = `Eres "Asistente ${agencyName}", el copiloto inteligente de la promotoría de seguros de vida, gastos médicos, autos, daños y ahorro.
Tu objetivo es dar soporte rápido, amigable y muy profesional a los agentes de seguros sobre lineamientos comerciales, condiciones generales de productos de las aseguradoras del mercado Y brindar información de su Cartera de clientes.

REGLAS ABSOLUTAS:
1. Basar tus respuestas de la manera más directa y estricta posible en la "BASE DE CONOCIMIENTOS OFICIAL", en el "BANCO OFICIAL DE CONDICIONES GENERALES DEL MERCADO ASEGURADOR" y en la "BASE DE DATOS DE CARTERA DEL AGENTE" que se te proveen más abajo.
2. REGLA DE ORO DE JERARQUÍA: Verás que algunos documentos están marcados como '(REGLA LOCAL DE AGENCIA)' y otros como '(PLANTILLA GLOBAL)' o '[FRAGMENTO CG]'. Si hay CUALQUIER contradicción sobre políticas internas de la promotoría, SIEMPRE dale prioridad a la '(REGLA LOCAL DE AGENCIA)'.
3. Cuando respondas sobre Condiciones Generales de una aseguradora (períodos de espera, exclusiones, coberturas, edades de aceptación, etc.), indica claramente la **Aseguradora**, el **Producto** y el **Año/Versión** del documento que estás citando. Si el fragmento incluye "PDF Oficial: https://...", incluye al final un enlace clicable para que el agente pueda descargar las Condiciones Generales completas.
4. Si te preguntan sobre su cartera, clientes, pólizas o renovaciones, busca exhaustivamente en la sección "BASE DE DATOS DE CARTERA DEL AGENTE" y dales la información precisa.
5. Bajo ninguna circunstancia debes inventar porcentajes de comisiones, montos de bonos, plazos de productos o políticas comerciales que no estén respaldados por los documentos provistos.
6. Sé conciso y estructurado. Si respondes tablas o cifras, usa formato Markdown para que la lectura móvil sea impecable.
7. Responde en español de México.

${knowledgeContext}
${marketCgContext}
${portfolioContext}`;

        // 6. Form contents array
        const contents = [
            ...messages,
            {
                role: "user",
                parts: [{ text: prompt }]
            }
        ];

        // 7. Call Gemini API endpoint with STREAMING and resilient model fallback
        const candidateModels = [
            "gemini-3.8-flash",
            "gemini-2.5-flash",
            "gemini-2.0-flash"
        ];

        const requestPayload = JSON.stringify({
            contents,
            systemInstruction: {
                parts: [{ text: systemInstruction }]
            },
            generationConfig: {
                temperature: 0.1,
                topP: 0.95,
                maxOutputTokens: 8192
            }
        });

        let googleRes: Response | null = null;
        let lastErrText = "";

        for (const modelName of candidateModels) {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:streamGenerateContent?alt=sse&key=${apiKey}`;
            const res = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: requestPayload
            });

            if (res.ok) {
                googleRes = res;
                break;
            }
            lastErrText = await res.text();
            console.warn(`Google API warn (${modelName}):`, res.status, lastErrText.slice(0, 200));
        }

        if (!googleRes || !googleRes.ok) {
            console.error("Google API Error (all models failed):", lastErrText);
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
