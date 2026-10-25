import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

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

export const ALL_MARKET_INSURERS = [
    "Allianz México",
    "AXA Seguros México",
    "GNP Seguros",
    "La Latinoamericana Seguros",
    "Seguros Monterrey New York Life",
    "GMX Seguros",
    "Insignia Life",
    "Plan Seguro",
    "Quálitas",
    "MetLife México",
] as const;

let seedCheckPromise: Promise<void> | null = null;
let isSeeded = false;

const allowedInsurersCache = new Map<string, { value: string[] | "ALL"; expiresAt: number }>();
const ALLOWED_INSURERS_TTL_MS = 60_000;

/**
 * Garantiza que la tabla market_cg_documents esté sembrada en cualquier rama de base de datos (Dev o Prod).
 */
export async function ensureMarketCgSeeded(): Promise<void> {
    if (isSeeded) return;
    if (seedCheckPromise) return seedCheckPromise;

    seedCheckPromise = (async () => {
        try {
            // Inicializar por única vez las promotorías existentes con sólo ["Insignia Life"] (excepto aacom).
            // Las promotorías nuevas creadas en el futuro no tendrán registro y su default será [] (0 compañías).
            const initFlag = await prisma.setting.findUnique({
                where: { key: "market_cg_existing_agencies_insignia_init_v1" },
            });
            if (!initFlag) {
                const existingAgencies = await prisma.agency.findMany({
                    select: { id: true, slug: true },
                });
                for (const ag of existingAgencies) {
                    if (ag.id === "aacom" || ag.slug === "aacom") continue;
                    const key = `market_cg_agency_insurers_${ag.id}`;
                    await prisma.setting.upsert({
                        where: { key },
                        update: { value: JSON.stringify(["Insignia Life"]) },
                        create: { key, value: JSON.stringify(["Insignia Life"]) },
                    });
                }
                await prisma.setting.upsert({
                    where: { key: "market_cg_existing_agencies_insignia_init_v1" },
                    update: { value: "true" },
                    create: { key: "market_cg_existing_agencies_insignia_init_v1", value: "true" },
                });
            }

            const count = await prisma.marketCgDocument.count();
            if (count > 0) {
                isSeeded = true;
                return;
            }

            const catalogPath = path.join(process.cwd(), "prisma", "market_cg_catalog.json");
            if (!fs.existsSync(catalogPath)) return;

            const raw = fs.readFileSync(catalogPath, "utf8");
            const catalog = JSON.parse(raw);
            if (!Array.isArray(catalog) || catalog.length === 0) return;

            const docRows = catalog.map((d: any) => ({
                id: d.id,
                fileKey: d.fileKey,
                aseguradora: d.aseguradora,
                ramo: d.ramo,
                producto: d.producto,
                year: d.year || 2025,
                productPageUrl: d.productPageUrl || null,
                downloadUrl: d.downloadUrl || null,
                notes: d.notes || null,
                charCount: d.charCount || 0,
                chunkCount: d.chunkCount || 1,
                active: true,
                isGlobalAuthorized: true,
            }));

            await prisma.marketCgDocument.createMany({
                data: docRows,
                skipDuplicates: true,
            });

            const chunkRows = catalog
                .filter((d: any) => d.previewChunk)
                .map((d: any) => ({
                    id: `${d.id}_c0`,
                    documentId: d.id,
                    chunkIndex: 0,
                    aseguradora: d.aseguradora,
                    ramo: d.ramo,
                    producto: d.producto,
                    year: d.year || 2025,
                    content: d.previewChunk,
                }));

            if (chunkRows.length > 0) {
                await prisma.marketCgChunk.createMany({
                    data: chunkRows,
                    skipDuplicates: true,
                });
            }
            isSeeded = true;
        } catch (err) {
            console.error("Error in ensureMarketCgSeeded:", err);
            seedCheckPromise = null;
        }
    })();

    return seedCheckPromise;
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
 * Obtiene la lista de aseguradoras autorizadas para una agencia específica.
 * - AACOM ("aacom") o Super Admin tiene acceso a TODAS las aseguradoras activas.
 * - Otras promotorías tienen acceso únicamente a las aseguradoras que el Super Admin les haya encendido
 *   en `market_cg_agency_insurers_${agencyId}` (por defecto todas las marcadas como Global si aún no se personaliza).
 */
export async function getAllowedInsurersForAgency(
    agencyId: string,
    isSuperAdmin: boolean = false
): Promise<string[] | "ALL"> {
    if (agencyId === "aacom" || isSuperAdmin) {
        return "ALL";
    }

    const cacheKey = `agency:${agencyId}`;
    const cached = allowedInsurersCache.get(cacheKey);
    const now = Date.now();
    if (cached && cached.expiresAt > now) {
        return cached.value;
    }

    const [scopeSetting, agencySetting] = await Promise.all([
        prisma.setting.findUnique({ where: { key: "market_cg_saas_enabled" } }),
        prisma.setting.findUnique({ where: { key: `market_cg_agency_insurers_${agencyId}` } }),
    ]);

    const allowForAllSaas = scopeSetting ? scopeSetting.value !== "false" : true;
    if (!allowForAllSaas) {
        allowedInsurersCache.set(cacheKey, { value: [], expiresAt: now + ALLOWED_INSURERS_TTL_MS });
        return [];
    }

    if (agencySetting && agencySetting.value) {
        try {
            const parsed = JSON.parse(agencySetting.value);
            if (Array.isArray(parsed)) {
                const result = parsed.filter((x) => typeof x === "string");
                allowedInsurersCache.set(cacheKey, { value: result, expiresAt: now + ALLOWED_INSURERS_TTL_MS });
                return result;
            }
        } catch {
            // fallback below
        }
    }

    // Promotorías nuevas sin configuración explícita tienen 0 compañías por defecto
    allowedInsurersCache.set(cacheKey, { value: [], expiresAt: now + ALLOWED_INSURERS_TTL_MS });
    return [];
}

/**
 * Busca los fragmentos más relevantes del Banco de Condiciones Generales del Mercado
 * respetando las aseguradoras asignadas por el Super Admin a cada promotoría.
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
        await ensureMarketCgSeeded();

        const isMainAgency = agencyId === "aacom" || isSuperAdmin;
        const allowedInsurers = await getAllowedInsurersForAgency(agencyId, isSuperAdmin);

        if (Array.isArray(allowedInsurers) && allowedInsurers.length === 0) {
            return [];
        }

        const combinedContextText = `${prompt} ${recentHistoryText}`.trim();
        let mentionedInsurers = detectMentionedInsurers(combinedContextText);

        // Si la promotoría tiene una lista restringida de aseguradoras (ej. solo 2 o 3 compañías),
        // intersectamos cualquier mención con sus aseguradoras autorizadas.
        if (Array.isArray(allowedInsurers)) {
            if (mentionedInsurers.length > 0) {
                mentionedInsurers = mentionedInsurers.filter((ins) => allowedInsurers.includes(ins));
                if (mentionedInsurers.length === 0) {
                    // Preguntó por una aseguradora que esta promotoría NO tiene contratada/autorizada
                    return [];
                }
            }
        }

        const terms = extractSearchTerms(prompt);
        if (terms.length === 0 && mentionedInsurers.length === 0) {
            return [];
        }

        const tsQueryOr = terms.length > 0 ? terms.join(" | ") : "cobertura | espera | deducible";

        // Filtro efectivo de aseguradoras para la consulta SQL
        const targetInsurers =
            mentionedInsurers.length > 0
                ? mentionedInsurers
                : Array.isArray(allowedInsurers)
                ? allowedInsurers
                : null;

        if (targetInsurers && targetInsurers.length > 0) {
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
                targetInsurers,
                limit
            );

            if (rows.length > 0 || Array.isArray(allowedInsurers)) {
                return rows;
            }
        }

        // Búsqueda abierta en todas las aseguradoras autorizadas (cuando allowedInsurers === "ALL")
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
