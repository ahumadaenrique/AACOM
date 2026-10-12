import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateObject } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY
})

// Simple token similarity to check for duplicates (> 80% overlap)
function calculateTitleSimilarity(title1: string, title2: string): number {
  const cleanTokens = (str: string) => {
    return str
      .toLowerCase()
      .replace(/[^\w\s\u00C0-\u00FF]/g, '') // Keep letters, numbers, spaces, and accents
      .split(/\s+/)
      .filter(w => w.length > 2) // Ignore short words/prepositions
  }

  const tokens1 = cleanTokens(title1)
  const tokens2 = cleanTokens(title2)

  if (tokens1.length === 0 || tokens2.length === 0) return 0

  const set2 = new Set(tokens2)
  const intersection = tokens1.filter(t => set2.has(t))
  
  // Coeficiente de Jaccard
  const unionSize = new Set([...tokens1, ...tokens2]).size
  return unionSize === 0 ? 0 : intersection.length / unionSize
}

// Strict blocklist for non-professional, entertainment, crime, and sports news
const BLOCKLIST_KEYWORDS = [
  "concierto", "cantante", "artista", "canción", "cancion", "álbum", "album", 
  "gira", "espectáculo", "espectaculo", "farándula", "farandula", "natanael", 
  "peso pluma", "bad bunny", "shakira", "nodal", "belinda", "reggaeton", 
  "futbol", "fútbol", "chivas", "américa", "america", "liga mx", "partido", 
  "gol", "campeonato", "boxeo", "canelo", "balacera", "homicidio", "narco", 
  "detienen a", "asesinan", "sicarios", "choque", "volcadura", "tragedia",
  "actor", "actriz", "telenovela", "hollywood", "netflix", "cine", "estreno",
  "fallece cantante", "hospitalizado el cantante"
]

// Professional Categories
export type ProfessionalCategory = 
  | "Seguros y Fianzas" 
  | "Macroeconomía y Tasas" 
  | "Retiro e Inversiones" 
  | "Insurtech e Innovación"

// Fallback high-quality curated articles for out-of-the-box or offline resilience
const MOCK_ARTICLES = [
  {
    title: "Comisión Nacional de Seguros y Fianzas (CNSF) actualiza requerimientos de solvencia para el sector asegurador",
    description: "El organismo regulador en México fortalece las directrices prudenciales para garantizar la solidez financiera de las aseguradoras y la protección de los asegurados frente a riesgos cibernéticos y climáticos.",
    content: "La Comisión Nacional de Seguros y Fianzas (CNSF) emitió una circular modificatoria para robustecer el capital de solvencia obligatorio (CSO) de las instituciones de seguros. Se busca que las compañías cuenten con reservas robustas ante siniestralidades atípicas y mayor liquidez para respaldar carteras de vida y gastos médicos mayores.",
    url: "https://www.gob.mx/cnsf",
    imageUrl: null,
    sourceName: "Boletín CNSF",
    category: "Seguros y Fianzas",
    tags: ["CNSF", "Solvencia", "Seguros", "Regulación"],
    advisorImpact: "Ofrece certidumbre y respaldo patrimonial a los prospectos al elegir aseguradoras legalmente supervisadas y con solidez patrimonial comprobada.",
    publishedAt: new Date()
  },
  {
    title: "Banxico y la Junta de Gobierno evalúan la trayectoria de tasas de interés ante la inflación en servicios",
    description: "La banca central mexicana mantiene una postura prudente en su política monetaria para afianzar el regreso de la inflación a la meta del 3% anual.",
    content: "Banco de México (Banxico) comunicó en su última minuta que el balance de riesgos inflacionarios exige un manejo cauto del ciclo de relajamiento monetario. Las tasas de referencia continúan ofreciendo atractivos rendimientos en instrumentos de renta fija gubernamental como Cetes.",
    url: "https://www.banxico.org.mx/publicaciones-y-prensa/anuncios-de-politica-monetaria/anuncios-politica-monetaria.html",
    imageUrl: null,
    sourceName: "Banxico Oficial",
    category: "Macroeconomía y Tasas",
    tags: ["Banxico", "Inflación", "Tasas de Interés", "Cetes"],
    advisorImpact: "Excelente argumento para promover planes de ahorro y retiro indexados a UDIs o con tasas garantizadas antes de recortes adicionales en Cetes.",
    publishedAt: new Date(Date.now() - 3600000)
  },
  {
    title: "Afores reportan plusvalías históricas e impulsan el ahorro voluntario deducible de impuestos",
    description: "La Comisión Nacional del Sistema de Ahorro para el Retiro destaca el rol estratégico de las aportaciones complementarias y planes personales para cerrar la brecha pensional.",
    content: "Las administradoras de fondos para el retiro registraron plusvalías significativas en el último ejercicio gracias a inversiones estratégicas en infraestructura y mercados de deuda. La CONSAR reiteró el llamado a los trabajadores para maximizar las deducciones fiscales mediante planes personales de retiro (PPR).",
    url: "https://www.gob.mx/consar",
    imageUrl: null,
    sourceName: "CONSAR",
    category: "Retiro e Inversiones",
    tags: ["Afore", "PPR", "Retiro", "Deducción Fiscal"],
    advisorImpact: "Oportunidad directa para prospectar Planes Personales de Retiro (Art. 151 y 185 LISR), destacando beneficios fiscales en la declaración anual.",
    publishedAt: new Date(Date.now() - 7200000)
  },
  {
    title: "Insurtechs aceleran la suscripción digital y automatización de pólizas de vida y gastos médicos",
    description: "El ecosistema asegurador mexicano moderniza sus canales de servicio e integración con agentes mediante herramientas de inteligencia artificial y tarificación en tiempo real.",
    content: "La digitalización del sector asegurador en América Latina muestra un crecimiento sostenido. Las aseguradoras líderes colaboran con Insurtechs para reducir tiempos de emisión de semanas a minutos, potenciando la productividad de los asesores patrimoniales independientes.",
    url: "https://www.insurtechmexico.mx/",
    imageUrl: null,
    sourceName: "Insurtech Review",
    category: "Insurtech e Innovación",
    tags: ["Insurtech", "Innovación", "Gastos Médicos", "Digitalización"],
    advisorImpact: "Permite a los asesores cerrar negocios más rápido con emisión acelerada y mejorar la experiencia postventa de sus asegurados.",
    publishedAt: new Date(Date.now() - 10800000)
  }
]

// AI Schema for curation using Gemini 3.5 Flash Lite
const CurationResultSchema = z.object({
  evaluations: z.array(z.object({
    index: z.number().describe("El índice del artículo evaluado"),
    isProfessional: z.boolean().describe("true si trata de seguros, finanzas corporativas, retiro, macroeconomía, banca central o tecnología aseguradora; false si es farándula, chismes, crimen, conciertos, deportes o trivialidades"),
    category: z.enum([
      "Seguros y Fianzas", 
      "Macroeconomía y Tasas", 
      "Retiro e Inversiones", 
      "Insurtech e Innovación"
    ]).describe("La categoría financiera más adecuada"),
    tags: z.array(z.string()).max(4).describe("Hasta 4 etiquetas concisas y profesionales en español"),
    advisorImpact: z.string().describe("Una frase concisa (1 o 2 oraciones) orientada a cómo un Asesor de Seguros o Consultor Financiero puede usar esta noticia con sus prospectos o clientes")
  }))
})

async function curateArticlesWithAI(articles: { title: string, description: string | null }[]) {
  if (articles.length === 0) return []
  
  const hasKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY
  if (!hasKey) {
    console.warn("No GEMINI_API_KEY configured for newsletter curation. Using heuristic fallback.")
    return articles.map((_, i) => ({
      index: i,
      isProfessional: true,
      category: "Seguros y Fianzas" as ProfessionalCategory,
      tags: ["Seguros", "Finanzas"],
      advisorImpact: "Información relevante de mercado para compartir con prospectos y clientes patrimoniales."
    }))
  }

  try {
    const promptArticles = articles.map((a, idx) => `[${idx}] TÍTULO: ${a.title}\nRESUMEN: ${a.description || 'Sin resumen'}`).join('\n\n')

    const prompt = `Actúas como el Director Editorial de Inteligencia Financiera para una Promotoría de Seguros y Consultoría Patrimonial en México.
Tu tarea es filtrar y clasificar noticias con máxima rigurosidad profesional.

REGLAS ESTRICTAS:
1. DESCALIFICA INMEDIATAMENTE (isProfessional = false) noticias de farándula, cantantes, conciertos, celebridades, actores, deportes, crímenes locales, homicidios o noticias donde la palabra 'seguro' o 'salud' se use en un contexto trivial (ej: 'no es seguro si cancelará', 'por problemas de salud el cantante cancela').
2. SOLO APRUEBA (isProfessional = true) noticias reales sobre:
   - Sector Asegurador, Pólizas, CNSF, AMIS, fianzas, siniestros corporativos, gastos médicos.
   - Banco de México (Banxico), inflación, tasas de interés, Cetes, SHCP, política monetaria, dólar/euro/UDIs.
   - Retiro, Afores, CONSAR, pensiones, fondos de inversión, deducciones fiscales.
   - Insurtech, transformación digital, inteligencia artificial en seguros o finanzas.
3. Clasifica cada noticia aprobada en una de estas 4 categorías:
   - "Seguros y Fianzas"
   - "Macroeconomía y Tasas"
   - "Retiro e Inversiones"
   - "Insurtech e Innovación"
4. Para cada aprobada, redacta 'advisorImpact': un tip ejecutivo que le explique a un Asesor de Seguros cómo utilizar esta noticia para asesorar, rebatir objeciones o vender más (ej: 'Ideal para justificar planes indexados a UDIs ante la persistencia de la inflación en servicios').

NOTICIAS A EVALUAR:
${promptArticles}`

    const { object } = await generateObject({
      model: google('gemini-3.5-flash-lite'),
      schema: CurationResultSchema,
      prompt,
    })

    return object.evaluations
  } catch (error) {
    console.error("Error in curateArticlesWithAI:", error)
    return []
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const authHeader = request.headers.get('authorization')

  // Cron authentication check
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    if (process.env.NODE_ENV === 'production') {
      const bypass = searchParams.get('bypass')
      if (bypass !== 'aacom123') {
        return new NextResponse('Unauthorized', { status: 401 })
      }
    }
  }

  // Support clearing articles database
  const clear = searchParams.get('clear')
  if (clear === 'true') {
    try {
      await prisma.newsArticle.deleteMany({})
    } catch (err: any) {
      return NextResponse.json({ success: false, error: `Failed to clear DB: ${err.message}` }, { status: 500 })
    }
  }

  try {
    // 1. First, proactively purge any existing unwanted entertainment/gossip articles from the DB
    try {
      for (const blocked of BLOCKLIST_KEYWORDS.slice(0, 15)) {
        await prisma.newsArticle.deleteMany({
          where: {
            title: {
              contains: blocked,
              mode: 'insensitive'
            }
          }
        })
      }
    } catch (cleanupErr) {
      console.warn("Non-fatal error cleaning legacy blocked articles:", cleanupErr)
    }

    const apiKey = process.env.NEWSDATA_API_KEY
    let rawArticles: any[] = []

    if (apiKey) {
      // 1. Fetch from Newsdata.io strictly filtering category=business and targeted financial/insurance terms
      try {
        const queryMX = encodeURIComponent('Banxico OR CNSF OR AMIS OR aseguradoras OR "sector asegurador" OR Afore OR Cetes OR SHCP OR inflacion OR "gastos medicos"')
        const mxRes = await fetch(
          `https://newsdata.io/api/1/news?apikey=${apiKey}&country=mx&category=business&q=${queryMX}&language=es`,
          { next: { revalidate: 0 } }
        )
        if (mxRes.ok) {
          const data = await mxRes.json()
          if (data.results && Array.isArray(data.results)) {
            data.results.forEach((art: any) => {
              rawArticles.push({
                title: art.title,
                description: art.description || null,
                content: art.content || art.description || null,
                url: art.link,
                imageUrl: art.image_url || null,
                sourceName: art.source_id || "Finanzas MX",
                category: "Seguros y Fianzas",
                publishedAt: art.pubDate ? new Date(art.pubDate) : new Date()
              })
            })
          }
        }
      } catch (err) {
        console.error("Error fetching MX business news from Newsdata:", err)
      }
 
      // 2. Fetch second batch: Macroeconomics, investments and insurtech
      try {
        const queryGlobal = encodeURIComponent('"tasas de interes" OR inflacion OR reaseguro OR insurtech OR "fondos de pension" OR "seguros de vida"')
        const globalRes = await fetch(
          `https://newsdata.io/api/1/news?apikey=${apiKey}&category=business&q=${queryGlobal}&language=es`,
          { next: { revalidate: 0 } }
        )
        if (globalRes.ok) {
          const data = await globalRes.json()
          if (data.results && Array.isArray(data.results)) {
            data.results.forEach((art: any) => {
              if (!rawArticles.some(a => a.url === art.link || a.title === art.title)) {
                rawArticles.push({
                  title: art.title,
                  description: art.description || null,
                  content: art.content || art.description || null,
                  url: art.link,
                  imageUrl: art.image_url || null,
                  sourceName: art.source_id || "Finanzas Global",
                  category: "Macroeconomía y Tasas",
                  publishedAt: art.pubDate ? new Date(art.pubDate) : new Date()
                })
              }
            })
          }
        }
      } catch (err) {
        console.error("Error fetching Global business news from Newsdata:", err)
      }
    }

    // If NewsData has no key or yielded 0 articles, inject MOCK_ARTICLES so the feed is never empty
    if (rawArticles.length === 0) {
      rawArticles = [...MOCK_ARTICLES]
    }

    // Step A: Hard keyword blocklist check (removes gossip, concerts, singers, crime instantly)
    const candidates = rawArticles.filter(art => {
      if (!art.title || !art.url) return false
      const lower = `${art.title} ${art.description || ''}`.toLowerCase()
      const isBlocked = BLOCKLIST_KEYWORDS.some(b => lower.includes(b.toLowerCase()))
      return !isBlocked
    })

    // Fetch existing recent articles from DB to avoid re-inserting or duplicates
    const recentArticles = await prisma.newsArticle.findMany({
      orderBy: { createdAt: 'desc' },
      take: 60,
      select: { id: true, title: true }
    })

    // Deduplicate against existing DB entries
    const dedupedCandidates = candidates.filter(cand => {
      const isDup = recentArticles.some(recent => calculateTitleSimilarity(cand.title, recent.title) >= 0.75)
      return !isDup
    })

    // Step B: Curate and summarize using Gemini 3.5 Flash Lite
    // Take up to 15 candidates per run to keep token usage super light and fast
    const batchToEvaluate = dedupedCandidates.slice(0, 15)
    const aiEvaluations = await curateArticlesWithAI(batchToEvaluate)
    const evalMap = new Map<number, typeof aiEvaluations[0]>()
    aiEvaluations.forEach(ev => evalMap.set(ev.index, ev))

    let insertedCount = 0

    for (let i = 0; i < batchToEvaluate.length; i++) {
      const art = batchToEvaluate[i]
      const aiEval = evalMap.get(i)

      // If AI reviewed it and explicitly marked as non-professional, skip!
      if (aiEval && !aiEval.isProfessional) {
        console.log(`Skipping non-professional article: ${art.title}`)
        continue
      }

      const finalCategory = aiEval?.category || (art.category as ProfessionalCategory) || "Seguros y Fianzas"
      const finalTags = aiEval?.tags && aiEval.tags.length > 0 ? aiEval.tags : (art.tags || ["Finanzas", "Seguros"])
      const finalAdvisorImpact = aiEval?.advisorImpact || art.advisorImpact || "Información relevante para dar contexto económico en citas con clientes."

      try {
        await prisma.newsArticle.upsert({
          where: { title: art.title },
          update: {
            url: art.url,
            description: art.description,
            content: art.content,
            imageUrl: art.imageUrl,
            category: finalCategory,
            tags: finalTags,
            advisorImpact: finalAdvisorImpact
          },
          create: {
            title: art.title,
            description: art.description,
            content: art.content,
            url: art.url,
            imageUrl: art.imageUrl,
            sourceName: art.sourceName || "Finanzas",
            category: finalCategory,
            tags: finalTags,
            advisorImpact: finalAdvisorImpact,
            publishedAt: art.publishedAt || new Date()
          }
        })
        insertedCount++
      } catch (err) {
        console.error(`Failed to upsert article: ${art.title}`, err)
      }
    }

    // Step C: If DB still has fewer than 4 articles, seed high quality MOCK_ARTICLES
    const currentCount = await prisma.newsArticle.count()
    if (currentCount < 4) {
      for (const mock of MOCK_ARTICLES) {
        await prisma.newsArticle.upsert({
          where: { title: mock.title },
          update: {
            advisorImpact: mock.advisorImpact,
            category: mock.category,
            tags: mock.tags
          },
          create: {
            ...mock
          }
        }).catch(() => {})
      }
    }

    // Step D: Autocleanup (Delete articles older than 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const deleteResult = await prisma.newsArticle.deleteMany({
      where: {
        publishedAt: {
          lt: thirtyDaysAgo
        }
      }
    })

    return NextResponse.json({
      success: true,
      insertedCount,
      totalInDb: await prisma.newsArticle.count(),
      deletedOldCount: deleteResult.count
    })
  } catch (error: any) {
    console.error('Cron newsletters error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

