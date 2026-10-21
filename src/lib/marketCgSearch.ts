import { prisma } from "@/lib/prisma";

export interface MarketCgChunkMatch {
    chunkId: string;
    documentId: string;
    aseguradora: string;
    ramo: string;
    producto: string;
    year: number;
    downloadUrl: string | null;
    productPageUrl: string | null;
    notes: string | null;
    content: string;
    rank: number;
}

const INSURER_ALIASES: { canonical: string; patterns: RegExp[] }[] = [
    {
        canonical: "GNP Seguros",
        patterns: [/\bgnp\b/i, /\bgrupo nacional provincial\b/i, /\bl[ií]nea azul\b/i, /\bconsolida\b/i, /\bproyecta\b/i, /\btrasciende\b/i, /\bcapitaliza\b/i, /\bprivilegio\b/i],
    },
    {
        canonical: "AXA Seguros México",
        patterns: [/\baxa\b/i, /\bplanmed\b/i, /\bflex\s*plus\b/i, /\baliados\b/i, /\bprotgt\b/i, /\bglobalmex\b/i, /\bvida inteligente\b/i],
    },
    {
        canonical: "Seguros Monterrey New York Life",
        patterns: [/\bmonterrey\b/i, /\bsmnyl\b/i, /\bmnyl\b/i, /\bnew york life\b/i, /\balfa medical\b/i, /\bopta medical\b/i, /\bimagina ser\b/i, /\borvi\b/i, /\bsegubeca\b/i, /\brealiza\b/i, /\bplenitud\b/i, /\bstardotal\b/i, /\bstartemporal\b/i],
    },
    {
        canonical: "Allianz México",
        patterns: [/\ballianz\b/i, /\boptimaxx\b/i, /\ballianz care\b/i, /\ballianz simple\b/i],
    },
    {
        canonical: "Insignia Life",
        patterns: [/\binsignia\b/i, /\binsignia life\b/i, /\binsignia premia\b/i],
    },
    {
        canonical: "MetLife México",
        patterns: [/\bmetlife\b/i, /\bmet\s*99\b/i, /\bmedicalife\b/i],
    },
    {
        canonical: "Plan Seguro",
        patterns: [/\bplan seguro\b/i, /\bgolden salud\b/i, /\bsalud [oó]ptima\b/i, /\bsalud integral\b/i],
    },
    {
        canonical: "La Latinoamericana Seguros",
        patterns: [/\blatinoamericana\b/i, /\bla latino\b/i, /\blatino seguros\b/i, /\bm[eé]dica latino\b/i, /\bvalor latino\b/i],
    },
    {
        canonical: "GMX Seguros",
        patterns: [/\bgmx\b/i, /\bmedipet\b/i],
    },
    {
        canonical: "Quálitas",
        patterns: [/\bqu[aá]litas\b/i],
    },
];

/**
 * Detecta qué aseguradoras se mencionan en la consulta o historial reciente del chat.
 */
export function detectMentionedInsurers(text: string): string[] {
    const detected = new Set<string>();
    for (const item of INSURER_ALIASES) {
        if (item.patterns.some((rx) => rx.test(text))) {
            detected.add(item.canonical);
        }
    }
    return Array.from(detected);
}

/**
 * Limpia y extrae las palabras clave significativas en español para construir una consulta FTS segura.
 */
function extractSearchTerms(query: string): string[] {
    const stopWords = new Set([
        "el", "la", "los", "las", "un", "una", "unos", "unas", "de", "del", "al", "a", "en",
        "con", "por", "para", "sin", "sobre", "entre", "hacia", "hasta", "desde", "que", "qué",
        "cual", "cuál", "cuales", "cuáles", "como", "cómo", "cuando", "cuándo", "donde", "dónde",
        "cuanto", "cuánto", "es", "son", "esta", "está", "estan", "están", "tiene", "tienen",
        "hay", "puede", "puedo", "pueden", "me", "te", "se", "nos", "mi", "mis", "tu", "tus",
        "su", "sus", "lo", "le", "les", "si", "sí", "no", "mas", "más", "pero", "o", "u", "y", "e",
        "hola", "buenos", "dias", "días", "tardes", "noches", "favor", "gracias", "dime", "explícame",
        "explicame", "saber", "quiero", "necesito", "póliza", "poliza", "seguro", "seguros",
        "condiciones", "generales"
    ]);

    return query
        .toLowerCase()
        .replace(/[^\wáéíóúüñ\s]/gi, " ")
        .split(/\s+/)
        .map((w) => w.trim())
        .filter((w) => w.length >= 3 && !stopWords.has(w))
        .slice(0, 12);
}

/**
 * Busca los fragmentos más relevantes del Banco de Condiciones Generales del Mercado
 * respetando la autorización configurada por el Super Admin.
 */
export async function searchMarketConditionsForAssistant(params: {
    prompt: string;
    recentHistoryText?: string;
    agencyId: string;
    isSuperAdmin?: boolean;
    limit?: number;
}): Promise<MarketCgChunkMatch[]> {
    const { prompt, recentHistoryText = "", agencyId, isSuperAdmin = false, limit = 8 } = params;

    try {
        // 1. Verificar configuración global de Super Admin para otras promotorías
        const isMainAgency = agencyId === "aacom" || isSuperAdmin;
        const scopeSetting = await prisma.setting.findUnique({
            where: { key: "market_cg_saas_enabled" }
        });
        // Por defecto activo para AACOM; para otras agencias depende de market_cg_saas_enabled (default true si isGlobalAuthorized=true)
        const allowForAllSaas = scopeSetting ? scopeSetting.value !== "false" : true;

        if (!isMainAgency && !allowForAllSaas) {
            return [];
        }

        const combinedContextText = `${prompt} ${recentHistoryText}`.trim();
        const mentionedInsurers = detectMentionedInsurers(combinedContextText);
        const terms = extractSearchTerms(prompt);

        if (terms.length === 0 && mentionedInsurers.length === 0) {
            return [];
        }

        // Construir expresión tsquery OR/AND ponderada en español
        const tsQueryOr = terms.length > 0 ? terms.join(" | ") : "cobertura | espera | deducible";

        // Si el usuario mencionó aseguradoras específicas, filtramos prioritariamente esas aseguradoras
        if (mentionedInsurers.length > 0) {
            const rows = await prisma.$queryRawUnsafe<MarketCgChunkMatch[]>(
                `
                SELECT
                    c."id" AS "chunkId",
                    c."documentId",
                    c."aseguradora",
                    c."ramo",
                    c."producto",
                    c."year",
                    d."downloadUrl",
                    d."productPageUrl",
                    d."notes",
                    c."content",
                    (
                        ts_rank_cd(
                            to_tsvector('spanish', c."aseguradora" || ' ' || c."producto" || ' ' || c."content"),
                            to_tsquery('spanish', $1)
                        )
                        + CASE WHEN c."year" >= 2025 THEN 0.25 WHEN c."year" >= 2023 THEN 0.12 ELSE 0 END
                    ) AS "rank"
                FROM "market_cg_chunks" c
                INNER JOIN "market_cg_documents" d ON d."id" = c."documentId"
                WHERE d."active" = true
                  AND ($2::boolean = true OR d."isGlobalAuthorized" = true)
                  AND c."aseguradora" = ANY($3::text[])
                  AND to_tsvector('spanish', c."aseguradora" || ' ' || c."producto" || ' ' || c."content") @@ to_tsquery('spanish', $1)
                ORDER BY "rank" DESC, c."year" DESC
                LIMIT $4
                `,
                tsQueryOr,
                isMainAgency,
                mentionedInsurers,
                limit
            );

            if (rows.length > 0) {
                return rows;
            }
        }

        // Búsqueda abierta en todas las aseguradoras autorizadas si no hubo match por aseguradora específica o si fue una pregunta comparativa de mercado
        if (terms.length > 0) {
            const openRows = await prisma.$queryRawUnsafe<MarketCgChunkMatch[]>(
                `
                SELECT
                    c."id" AS "chunkId",
                    c."documentId",
                    c."aseguradora",
                    c."ramo",
                    c."producto",
                    c."year",
                    d."downloadUrl",
                    d."productPageUrl",
                    d."notes",
                    c."content",
                    (
                        ts_rank_cd(
                            to_tsvector('spanish', c."aseguradora" || ' ' || c."producto" || ' ' || c."content"),
                            to_tsquery('spanish', $1)
                        )
                        + CASE WHEN c."year" >= 2025 THEN 0.25 WHEN c."year" >= 2023 THEN 0.12 ELSE 0 END
                    ) AS "rank"
                FROM "market_cg_chunks" c
                INNER JOIN "market_cg_documents" d ON d."id" = c."documentId"
                WHERE d."active" = true
                  AND ($2::boolean = true OR d."isGlobalAuthorized" = true)
                  AND to_tsvector('spanish', c."aseguradora" || ' ' || c."producto" || ' ' || c."content") @@ to_tsquery('spanish', $1)
                ORDER BY "rank" DESC, c."year" DESC
                LIMIT $3
                `,
                tsQueryOr,
                isMainAgency,
                limit
            );

            return openRows;
        }

        return [];
    } catch (err) {
        console.error("Error in searchMarketConditionsForAssistant:", err);
        return [];
    }
}
