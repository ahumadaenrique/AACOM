import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { searchMarketConditionsForAssistant } from "@/lib/marketCgSearch";

const CACHE_TTL_MS = 60_000;

const knowledgeCache = new Map<
    string,
    { docs: { title: string; content: string; isGlobalTemplate: boolean }[]; expiresAt: number }
>();

const portfolioCache = new Map<
    string,
    {
        rows: {
            policyNumber: string | null;
            insuranceCompany: string | null;
            product: string | null;
            renewalDate: Date | null;
            annualPremium: number | null;
            contractor: string | null;
            clientName: string | null;
            agentName: string | null;
        }[];
        expiresAt: number;
    }
>();

const PORTFOLIO_INTENT_REGEX =
    /\b(cartera|p[oó]liza|polizas|p[oó]lizas|cliente|clientes|asegurad[oa]|contratante|renova|renovaci[oó]n|renovaciones|vence|vencimiento|vencen|prima|primas|recibo|vigencia|qu[ií]en|quienes|cu[aá]ntas|cuantos|mayor|top|mis\s+clientes|mi\s+cartera)\b/i;

export async function POST(req: Request) {
    try {
        // 0. Start auth() and request body parsing in parallel (eliminates first waterfall)
        const [session, body] = await Promise.all([auth(), req.json()]);

        if (!session?.user?.email) {
            return new Response("No autenticado", { status: 401 });
        }

        const { messages = [], prompt = "" } = body || {};

        const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
        if (!apiKey) {
            return new Response("API Key no configurada", { status: 500 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: {
                id: true,
                role: true,
                agencyId: true,
                agency: { select: { name: true } },
            },
        });
        if (!user || !user.agencyId || !user.agency) {
            return new Response("Agencia no válida", { status: 403 });
        }

        const agencyId = user.agencyId;
        const agencyName = user.agency.name || "SYSGPYA";
        const isSuperAdmin = user.role === "SUPER_ADMIN" || user.role === "SUPERADMIN";
        const isAdmin = isSuperAdmin || user.role === "ADMIN";

        const recentHistoryText = Array.isArray(messages)
            ? messages
                  .slice(-4)
                  .map((m: any) => (m?.parts || []).map((p: any) => p?.text || "").join(" "))
                  .join(" ")
            : "";

        const combinedQueryText = `${prompt} ${recentHistoryText}`.trim();
        const isPortfolioQuery = PORTFOLIO_INTENT_REGEX.test(combinedQueryText);

        const now = Date.now();

        // 1. Knowledge Documents (cached per agencyId for 60s, strictly multi-tenant isolated)
        const getActiveDocs = async () => {
            const cached = knowledgeCache.get(agencyId);
            if (cached && cached.expiresAt > now) {
                return cached.docs;
            }
            const docs = await prisma.knowledgeDocument.findMany({
                where: {
                    active: true,
                    OR: [{ agencyId }, { isGlobalTemplate: true }],
                },
                select: { title: true, content: true, isGlobalTemplate: true },
            });
            knowledgeCache.set(agencyId, { docs, expiresAt: now + CACHE_TTL_MS });
            return docs;
        };

        // 2. Portfolio Policies (cached per agencyId + scope for 60s, lightweight projection)
        const getPortfolioRows = async () => {
            const scopeKey = `${agencyId}:${isAdmin ? "ADMIN" : user.id}`;
            const cached = portfolioCache.get(scopeKey);
            if (cached && cached.expiresAt > now) {
                return cached.rows;
            }
            const policyWhereClause = isAdmin ? { agencyId } : { userId: user.id, agencyId };
            const rawPolicies = await prisma.policy.findMany({
                where: policyWhereClause,
                select: {
                    policyNumber: true,
                    insuranceCompany: true,
                    product: true,
                    renewalDate: true,
                    annualPremium: true,
                    contractor: true,
                    client: { select: { name: true } },
                    user: { select: { name: true } },
                },
                orderBy: { renewalDate: "asc" },
                take: 1500,
            });
            const rows = rawPolicies.map((p) => ({
                policyNumber: p.policyNumber,
                insuranceCompany: p.insuranceCompany,
                product: p.product,
                renewalDate: p.renewalDate,
                annualPremium: p.annualPremium,
                contractor: p.contractor,
                clientName: p.client?.name || null,
                agentName: p.user?.name || null,
            }));
            portfolioCache.set(scopeKey, { rows, expiresAt: now + CACHE_TTL_MS });
            return rows;
        };

        // Run all 3 context lookups in parallel (eliminates sequential DB waterfall)
        const [activeDocs, marketChunks, agentPolicies] = await Promise.all([
            getActiveDocs(),
            searchMarketConditionsForAssistant({
                prompt: String(prompt || ""),
                recentHistoryText,
                agencyId,
                isSuperAdmin,
                limit: 8,
            }),
            getPortfolioRows(),
        ]);

        // 3. Smart Portfolio Context Injection:
        // Avoid dumping 1,500 policies into Gemini on every single non-portfolio question.
        let portfolioContext = "";
        if (agentPolicies.length > 0) {
            // Check if any specific client/contractor name from the portfolio is mentioned in the prompt
            const promptLower = String(prompt || "").toLowerCase();
            const matchedByName =
                promptLower.length >= 3
                    ? agentPolicies.filter((p) => {
                          const cName = (p.clientName || p.contractor || "").toLowerCase();
                          if (!cName || cName.length < 3) return false;
                          const tokens = cName.split(/\s+/).filter((t) => t.length >= 4);
                          return tokens.some((t) => promptLower.includes(t));
                      })
                    : [];

            if (isPortfolioQuery || matchedByName.length > 0 || agentPolicies.length <= 120) {
                const rowsToInclude =
                    matchedByName.length > 0 && !isPortfolioQuery
                        ? matchedByName
                        : agentPolicies.slice(0, 600);

                portfolioContext = `\nBASE DE DATOS DE CARTERA DEL AGENTE (SOLO LECTURA — Total en cartera: ${agentPolicies.length} pólizas):\n`;
                portfolioContext +=
                    "Esta es la información real y confidencial de la cartera de clientes y pólizas. Úsala para responder preguntas sobre sus renovaciones, primas o clientes.\n\n";

                for (const p of rowsToInclude) {
                    const clientName = p.clientName || p.contractor || "Sin Nombre";
                    const agentName = p.agentName ? ` (Agente: ${p.agentName})` : "";
                    const renDate = p.renewalDate
                        ? new Date(p.renewalDate).toLocaleDateString("es-MX")
                        : "N/A";
                    const prima = p.annualPremium
                        ? `$${p.annualPremium.toLocaleString("es-MX")} MXN`
                        : "No especificada";
                    portfolioContext += `- Cliente: ${clientName}${agentName} | Póliza: ${p.policyNumber || "S/N"} | Compañía: ${p.insuranceCompany || "N/A"} | Producto: ${p.product || "N/A"} | Renovación: ${renDate} | Prima: ${prima}\n`;
                }
            } else {
                portfolioContext = `\nRESUMEN DE CARTERA DEL AGENTE: El agente cuenta con ${agentPolicies.length} pólizas registradas en su cartera activa.\n`;
            }
        }

        // 4. Format knowledge context (placed at the top of systemInstruction for Gemini Implicit Caching)
        let knowledgeContext = "BASE DE CONOCIMIENTOS OFICIAL:\n";
        if (activeDocs.length > 0) {
            activeDocs.forEach((doc, idx) => {
                knowledgeContext += `\n--- DOCUMENTO ${idx + 1} ${doc.isGlobalTemplate ? "(PLANTILLA GLOBAL)" : "(REGLA LOCAL DE AGENCIA)"}: ${doc.title} ---\n${doc.content}\n`;
            });
        } else {
            knowledgeContext += "(No hay directivas internas locales cargadas.)\n";
        }

        let marketCgContext = "";
        if (marketChunks.length > 0) {
            marketCgContext =
                "\nBANCO OFICIAL DE CONDICIONES GENERALES DEL MERCADO ASEGURADOR (FRAGMENTOS RELEVANTES):\n";
            marketCgContext +=
                "Usa estos fragmentos contractuales oficiales de las aseguradoras para responder dudas sobre coberturas, períodos de espera, exclusiones, deducibles o cláusulas. Si citas un producto y tiene URL de descarga oficial, compártela al final en formato Markdown [Descargar Condiciones Generales Oficiales](URL).\n\n";
            marketChunks.forEach((chunk, i) => {
                const linkInfo = chunk.downloadUrl ? ` | PDF Oficial: ${chunk.downloadUrl}` : "";
                const notesInfo = chunk.notes ? ` | Registro/Notas: ${chunk.notes}` : "";
                marketCgContext += `\n[FRAGMENTO CG #${i + 1} — Aseguradora: ${chunk.aseguradora} | Ramo: ${chunk.ramo} | Producto: ${chunk.producto} (${chunk.year})${linkInfo}${notesInfo}]\n${chunk.content}\n`;
            });
        }

        // 5. Define system instruction (static instructions + agency knowledge first for implicit cache hits)
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

        // 6. Form contents array (keep last 10 turns max to avoid bloated history latency)
        const recentMessages = Array.isArray(messages) ? messages.slice(-10) : [];
        const contents = [
            ...recentMessages,
            {
                role: "user",
                parts: [{ text: prompt }],
            },
        ];

        // 7. Call Gemini 3.x API endpoint with STREAMING and minimal thinking latency
        const candidateModels = ["gemini-3.5-flash-lite", "gemini-3.8-flash"];

        const buildPayload = (includeThinkingConfig: boolean) =>
            JSON.stringify({
                contents,
                systemInstruction: {
                    parts: [{ text: systemInstruction }],
                },
                generationConfig: {
                    temperature: 0.1,
                    topP: 0.95,
                    maxOutputTokens: 4096,
                    ...(includeThinkingConfig
                        ? {
                              thinkingConfig: {
                                  thinkingLevel: "MINIMAL",
                              },
                          }
                        : {}),
                },
            });

        let googleRes: Response | null = null;
        let lastErrText = "";

        for (const modelName of candidateModels) {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:streamGenerateContent?alt=sse&key=${apiKey}`;
            let res = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: buildPayload(true),
            });

            // Fallback without thinkingConfig if the specific model endpoint rejects the field
            if (res.status === 400) {
                res = await fetch(url, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: buildPayload(false),
                });
            }

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
                "Connection": "keep-alive",
            },
        });
    } catch (error: any) {
        console.error("Error in streaming API:", error);
        return new Response("Error interno del servidor", { status: 500 });
    }
}
