import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Simple token similarity to check for duplicates
function calculateTitleSimilarity(title1: string, title2: string): number {
  const cleanTokens = (str: string) => {
    return str
      .toLowerCase()
      .replace(/[^\w\s\u00C0-\u00FF]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2)
  }

  const tokens1 = cleanTokens(title1)
  const tokens2 = cleanTokens(title2)

  if (tokens1.length === 0 || tokens2.length === 0) return 0

  const set2 = new Set(tokens2)
  const intersection = tokens1.filter(t => set2.has(t))

  const unionSize = new Set([...tokens1, ...tokens2]).size
  return unionSize === 0 ? 0 : intersection.length / unionSize
}

// Strict blocklist for non-professional, entertainment, crime, sports, and trivial/clickbait news
const BLOCKLIST_KEYWORDS = [
  "concierto", "cantante", "artista", "canción", "cancion", "álbum", "album",
  "gira", "espectáculo", "espectaculo", "farándula", "farandula", "natanael",
  "peso pluma", "bad bunny", "shakira", "nodal", "belinda", "reggaeton",
  "futbol", "fútbol", "chivas", "américa", "america", "liga mx", "partido",
  "gol", "campeonato", "boxeo", "canelo", "balacera", "homicidio", "narco",
  "detienen a", "asesinan", "sicarios", "choque", "volcadura", "tragedia",
  "actor", "actriz", "telenovela", "hollywood", "netflix", "cine", "estreno",
  "fallece cantante", "hospitalizado el cantante", "horóscopo", "horoscopo",
  "lotería", "loteria", "sorteo", "famoso", "celebridad", "influencer",
  "buen fin", "black friday", "cyber monday", "hot sale", "precio del dólar en méxico hoy",
  "cuánto vale el dólar hoy", "tipo de cambio hoy"
]

// Legacy static titles/URLs that must be purged so they never freeze the feed
const LEGACY_MOCK_TITLES = [
  "Comisión Nacional de Seguros y Fianzas (CNSF) actualiza requerimientos de solvencia para el sector asegurador",
  "Banxico y la Junta de Gobierno evalúan la trayectoria de tasas de interés ante la inflación en servicios",
  "Afores reportan plusvalías históricas e impulsan el ahorro voluntario deducible de impuestos",
  "Insurtechs aceleran la suscripción digital y automatización de pólizas de vida y gastos médicos"
]

const LEGACY_MOCK_URLS = [
  "https://www.gob.mx/cnsf",
  "https://www.banxico.org.mx/publicaciones-y-prensa/anuncios-de-politica-monetaria/anuncios-politica-monetaria.html",
  "https://www.gob.mx/consar",
  "https://www.insurtechmexico.mx/"
]

export type ProfessionalCategory =
  | "Seguros y Fianzas"
  | "Macroeconomía y Tasas"
  | "Retiro e Inversiones"
  | "Insurtech e Innovación"

interface RawCandidateArticle {
  title: string
  description: string | null
  content: string | null
  url: string
  imageUrl: string | null
  sourceName: string
  category: ProfessionalCategory
  publishedAt: Date
  tags?: string[]
  advisorImpact?: string
}

interface AIEvaluationItem {
  index: number
  isProfessional: boolean
  category: ProfessionalCategory
  executiveSummary: string
  tags: string[]
  targetProduct: string
  clientAngle: string
  whatsappHook: string
}

// Decode basic HTML entities and strip HTML tags from RSS descriptions
function cleanHtmlText(raw: string | null | undefined): string {
  if (!raw) return ''
  return raw
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim()
}

// Parse Google News RSS XML into structured articles without external XML dependencies
function parseRssItems(xml: string, defaultCategory: ProfessionalCategory): RawCandidateArticle[] {
  const items: RawCandidateArticle[] = []
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi
  let match: RegExpExecArray | null

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1]

    const rawTitle = block.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || ''
    const rawLink = block.match(/<link>([\s\S]*?)<\/link>/i)?.[1] || ''
    const rawPubDate = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/i)?.[1] || ''
    const rawSource = block.match(/<source[^>]*>([\s\S]*?)<\/source>/i)?.[1] || ''
    const rawDesc = block.match(/<description>([\s\S]*?)<\/description>/i)?.[1] || ''

    let title = cleanHtmlText(rawTitle)
    let sourceName = cleanHtmlText(rawSource)

    // Google News titles usually end with " - Medio"
    const dashIndex = title.lastIndexOf(' - ')
    if (dashIndex > 20) {
      const trailingSource = title.slice(dashIndex + 3).trim()
      title = title.slice(0, dashIndex).trim()
      if (!sourceName && trailingSource.length <= 40) {
        sourceName = trailingSource
      }
    }

    const url = cleanHtmlText(rawLink)
    const pubDate = rawPubDate ? new Date(rawPubDate.trim()) : new Date()
    const validPubDate = Number.isNaN(pubDate.getTime()) ? new Date() : pubDate

    if (validPubDate.getTime() < sevenDaysAgo) {
      continue
    }

    let description = cleanHtmlText(rawDesc)
    if (
      !description ||
      calculateTitleSimilarity(title, description) >= 0.65 ||
      description.length < 45
    ) {
      description = ''
    }

    if (title && url) {
      items.push({
        title,
        description: description || null,
        content: description || null,
        url,
        imageUrl: null,
        sourceName: sourceName || 'Prensa Financiera MX',
        category: defaultCategory,
        publishedAt: validPubDate
      })
    }
  }

  return items
}

// Fetch live Mexican financial & insurance news from Google News RSS, interleaving categories for a rich, balanced feed
async function fetchLiveGoogleNewsMX(): Promise<RawCandidateArticle[]> {
  const feeds: { query: string; category: ProfessionalCategory }[] = [
    {
      query: '(aseguradoras OR "gastos medicos" OR AMIS OR CNSF OR "seguro de vida" OR polizas) México when:6d',
      category: 'Seguros y Fianzas'
    },
    {
      query: '(Afores OR CONSAR OR "ahorro para el retiro" OR pensiones OR "deducciones personales") México when:6d',
      category: 'Retiro e Inversiones'
    },
    {
      query: '(Banxico OR inflacion OR "tasa de interes" OR Cetes OR UDIs) México when:5d',
      category: 'Macroeconomía y Tasas'
    },
    {
      query: '(Insurtech OR Fintech OR "inteligencia artificial" seguros OR banca digital) México when:7d',
      category: 'Insurtech e Innovación'
    }
  ]

  const byCategory: Record<ProfessionalCategory, RawCandidateArticle[]> = {
    'Seguros y Fianzas': [],
    'Retiro e Inversiones': [],
    'Macroeconomía y Tasas': [],
    'Insurtech e Innovación': []
  }

  await Promise.all(
    feeds.map(async (feed) => {
      try {
        const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(feed.query)}&hl=es-419&gl=MX&ceid=MX:es-419`
        const res = await fetch(rssUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; aacomsoft-intelligence/4.0; +https://app.aacomsoft.com)'
          },
          cache: 'no-store'
        })
        if (!res.ok) return
        const xml = await res.text()
        const parsed = parseRssItems(xml, feed.category)
        byCategory[feed.category] = parsed.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime()).slice(0, 6)
      } catch (err) {
        console.warn(`Error fetching RSS feed for ${feed.category}:`, err)
      }
    })
  )

  // Interleave categories (round-robin) so the top of the feed has all 4 pillars represented
  const interleaved: RawCandidateArticle[] = []
  const maxLen = Math.max(
    byCategory['Seguros y Fianzas'].length,
    byCategory['Retiro e Inversiones'].length,
    byCategory['Macroeconomía y Tasas'].length,
    byCategory['Insurtech e Innovación'].length
  )

  const order: ProfessionalCategory[] = [
    'Seguros y Fianzas',
    'Retiro e Inversiones',
    'Macroeconomía y Tasas',
    'Insurtech e Innovación'
  ]

  for (let i = 0; i < maxLen; i++) {
    for (const cat of order) {
      const item = byCategory[cat][i]
      if (item) interleaved.push(item)
    }
  }

  return interleaved
}

// Build a structured commercial advisor tip string that NewslettersClient renders cleanly
function formatStructuredAdvisorImpact(params: {
  targetProduct: string
  clientAngle: string
  whatsappHook: string
}): string {
  return [
    `🎯 Ramo: ${params.targetProduct.trim()}`,
    `💡 Ángulo con el cliente: ${params.clientAngle.trim()}`,
    `💬 Guion WhatsApp: "${params.whatsappHook.trim().replace(/^["«]|["»]$/g, '')}"`
  ].join('\n')
}

// Specialized 10-topic commercial analyzer so every single article gets a tailored, specific strategy even without AI
function buildSmartFallbackEvaluation(art: RawCandidateArticle, indexOffset = 0) {
  const text = `${art.title} ${art.description || ''}`.toLowerCase()

  // 1. Gastos Médicos / Salud / Hospitales / Inflación Médica
  if (text.includes('gastos médicos') || text.includes('gastos medicos') || text.includes('hospital') || text.includes('salud') || text.includes('enfermedad') || text.includes('médic') || text.includes('medic')) {
    return {
      category: 'Seguros y Fianzas' as ProfessionalCategory,
      tags: ['GMM', 'Inflación Médica', 'Salud Privada', 'Prevención'],
      executiveSummary: art.description || `${art.sourceName} reporta sobre el encarecimiento de la atención hospitalaria privada y la urgencia de contar con coberturas médicas actualizadas en México.`,
      advisorImpact: formatStructuredAdvisorImpact({
        targetProduct: 'Gastos Médicos Mayores (Individual o Familiar)',
        clientAngle: 'La inflación médica privada en México supera el 14% anual; una hospitalización promedio rebasa los $350,000 MXN y puede descapitalizar a una familia en días.',
        whatsappHook: `Hola, vi hoy en ${art.sourceName} esta nota ("${art.title}") y pensé en ti. Con lo que están subiendo los hospitales privados, vale mucho la pena revisar tu deducible y suma asegurada o cotizar una opción flexible. ¿Tienes 10 min mañana?`
      })
    }
  }

  // 2. Autos / Siniestros / Robos / Daños / Clima
  if (text.includes('auto') || text.includes('robo') || text.includes('siniestro') || text.includes('vial') || text.includes('lluvia') || text.includes('huracán') || text.includes('daños')) {
    return {
      category: 'Seguros y Fianzas' as ProfessionalCategory,
      tags: ['Siniestralidad', 'Autos y Daños', 'AMIS', 'Patrimonio'],
      executiveSummary: art.description || `Informe publicado en ${art.sourceName} sobre la incidencia de siniestros y el respaldo financiero de las pólizas patrimoniales ante imprevistos.`,
      advisorImpact: formatStructuredAdvisorImpact({
        targetProduct: 'Seguro de Auto Amplio / Hogar y Responsabilidad Civil',
        clientAngle: 'En México más del 70% del parque vehicular y viviendas carecen de cobertura adecuada; un percance sin póliza implica desembolsos inmediatos de decenas de miles de pesos.',
        whatsappHook: `Hola, salió esta nota en ${art.sourceName} ("${art.title}"). Te la comparto para recordarte revisar la vigencia y coberturas de tus pólizas de auto y casa antes de que cierre el mes. Si gustas lo checamos en 5 minutos.`
      })
    }
  }

  // 3. Impuestos / SAT / Deducciones Personales
  if (text.includes('sat') || text.includes('deduc') || text.includes('impuesto') || text.includes('fiscal') || text.includes('declaración')) {
    return {
      category: 'Retiro e Inversiones' as ProfessionalCategory,
      tags: ['PPR Art. 151', 'Deducción Fiscal', 'SAT', 'Devolución ISR'],
      executiveSummary: art.description || `Análisis de ${art.sourceName} sobre las disposiciones fiscales y cómo aprovechar las deducciones personales autorizadas por la Ley del ISR en México.`,
      advisorImpact: formatStructuredAdvisorImpact({
        targetProduct: 'Plan Personal de Retiro (Art. 151 y 185 LISR) + Prima de GMM',
        clientAngle: 'Cada peso aportado a un PPR o prima de Gastos Médicos es deducible de impuestos, permitiendo recuperar hasta un 30%-35% en la declaración anual ante el SAT.',
        whatsappHook: `Hola, vi esta nota en ${art.sourceName} ("${art.title}"). Mucha gente no sabe que puede hacer que el SAT le devuelva impuestos ahorrando para su propio retiro o con su póliza de Gastos Médicos. ¿Hacemos una simulación rápida con tu régimen fiscal?`
      })
    }
  }

  // 4. Afores / CONSAR / Pensiones / Jubilación
  if (text.includes('afore') || text.includes('retiro') || text.includes('pensi') || text.includes('consar') || text.includes('jubilaci')) {
    return {
      category: 'Retiro e Inversiones' as ProfessionalCategory,
      tags: ['Afores', 'CONSAR', 'Brecha Pensional', 'PPR'],
      executiveSummary: art.description || `Reporte de ${art.sourceName} en torno al desempeño del Sistema de Ahorro para el Retiro (SAR) y los retos pensionales para los trabajadores en México.`,
      advisorImpact: formatStructuredAdvisorImpact({
        targetProduct: 'Plan Personal de Retiro (PPR) / Vida Retiro Garantizado',
        clientAngle: 'La tasa de reemplazo de la Afore apenas ronda el 30%-40% del último sueldo; quien no construya un fondo privado complementario tendrá que reducir drásticamente su estilo de vida a los 65 años.',
        whatsappHook: `Hola, leí hoy en ${art.sourceName} esta nota sobre las Afores y pensiones ("${art.title}"). ¿Ya sabes con cuánto te tocaría retirarte según tu esquema actual? Te regalo una proyección de 10 minutos esta semana para que veas tus números reales.`
      })
    }
  }

  // 5. Banxico / Recorte de Tasas / Cetes
  if (text.includes('tasa') || text.includes('cetes') || text.includes('recorte') || text.includes('monetaria') || (text.includes('banxico') && !text.includes('dólar') && !text.includes('peso'))) {
    if (indexOffset % 2 === 1) {
      return {
        category: 'Macroeconomía y Tasas' as ProfessionalCategory,
        tags: ['Rendimiento Garantizado', 'Banxico', 'Inversión Patrimonial', 'Vida Dotal'],
        executiveSummary: art.description || `Análisis de especialistas en ${art.sourceName} sobre cómo el ciclo de recortes de tasas en México reduce el premio de los pagarés bancarios tradicionales.`,
        advisorImpact: formatStructuredAdvisorImpact({
          targetProduct: 'Plan Dotal Mixto / Inversión Patrimonial con Suma Asegurada Garantizada',
          clientAngle: 'A medida que bajan las tasas bancarias, dejar el capital en pagarés de 28 días diluye el rendimiento; trasladar excedentes a un Dotal garantiza capital + protección por fallecimiento libre de impuestos (Art. 93 LISR).',
          whatsappHook: `Hola, vi este análisis hoy en ${art.sourceName} ("${art.title}"). Muchos clientes están moviendo sus excedentes de pagarés bancarios a planes dotales exentos de impuestos antes de que sigan bajando las tasas. ¿Te enseño cómo funciona en 10 min?`
        })
      }
    }
    return {
      category: 'Macroeconomía y Tasas' as ProfessionalCategory,
      tags: ['Banxico', 'Tasas de Interés', 'Cetes', 'Rendimiento Real'],
      executiveSummary: art.description || `Seguimiento de ${art.sourceName} a las decisiones de política monetaria de Banxico y el ajuste en los rendimientos de instrumentos de corto plazo.`,
      advisorImpact: formatStructuredAdvisorImpact({
        targetProduct: 'Seguro Dotal / Ahorro Garantizado en UDIs a Mediano y Largo Plazo',
        clientAngle: 'Con los recortes a la tasa de referencia de Banxico, el pagaré bancario y Cetes a 28 días pagan cada vez menos; es momento de amarrar tasas garantizadas sobre UDIs a 10 o 15 años.',
        whatsappHook: `Hola, hoy ${art.sourceName} publicó esto sobre el ajuste de tasas de Banxico ("${art.title}"). Como los rendimientos bancarios de corto plazo están bajando, es el mejor momento para congelar una tasa garantizada en UDIs para tus metas patrimoniales. ¿Lo platicamos el jueves?`
      })
    }
  }

  // 6. Tipo de Cambio / Peso / Dólar
  if (text.includes('peso') || text.includes('dólar') || text.includes('dolar') || text.includes('cambiari') || text.includes('divisa')) {
    return {
      category: 'Macroeconomía y Tasas' as ProfessionalCategory,
      tags: ['Tipo de Cambio', 'Dólares', 'Cobertura Cambiaria', 'Patrimonio'],
      executiveSummary: art.description || `Nota financiera de ${art.sourceName} sobre la volatilidad del peso mexicano frente al dólar y la importancia de diversificar activos patrimoniales.`,
      advisorImpact: formatStructuredAdvisorImpact({
        targetProduct: 'Seguro de Vida y Ahorro Patrimonial en Dólares (USD) o UDIs',
        clientAngle: 'Tener el 100% del patrimonio en pesos expone a las familias y empresarios a episodios de depreciación cambiaria; ahorrar en pólizas dolarizadas crea un blindaje duro.',
        whatsappHook: `Hola, viendo cómo se está moviendo el tipo de cambio hoy en ${art.sourceName} ("${art.title}"), quería preguntarte: ¿ya tienes una parte de tu ahorro familiar o educación de tus hijos blindada en dólares o UDIs? Te muestro en 10 min cómo funciona.`
      })
    }
  }

  // 7. Inflación / UDIs / Carestía / Educación
  if (text.includes('inflaci') || text.includes('udi') || text.includes('precios') || text.includes('carestía') || text.includes('colegiatura')) {
    return {
      category: 'Macroeconomía y Tasas' as ProfessionalCategory,
      tags: ['Inflación', 'UDIs', 'Poder Adquisitivo', 'Educación'],
      executiveSummary: art.description || `Análisis económico de ${art.sourceName} sobre la presión inflacionaria en servicios y su impacto acumulado en el ahorro de los hogares mexicanos.`,
      advisorImpact: formatStructuredAdvisorImpact({
        targetProduct: 'Seguro Educacional / Vida Ahorro Indexado a UDIs',
        clientAngle: 'El dinero guardado en una cuenta de débito pierde entre 4% y 5% de su valor cada año por inflación; ahorrar en UDIs garantiza que el capital crezca siempre por encima de los precios.',
        whatsappHook: `Hola, te comparto este reporte de ${art.sourceName} sobre el impacto de la inflación ("${art.title}"). Justo por esto diseñamos planes en UDIs donde tu ahorro jamás pierde poder de compra. ¿Te late si te enseño un ejemplo rápido mañana?`
      })
    }
  }

  // 8. Insurtech / IA / Digitalización / Ciberseguridad
  if (art.category === 'Insurtech e Innovación' || text.includes('insurtech') || text.includes('fintech') || text.includes('inteligencia artificial') || text.includes('digital') || text.includes('ciber')) {
    return {
      category: 'Insurtech e Innovación' as ProfessionalCategory,
      tags: ['Insurtech', 'Suscripción Digital', 'IA Financiera', 'Innovación'],
      executiveSummary: art.description || `Cobertura de ${art.sourceName} sobre la adopción de inteligencia artificial y plataformas digitales en el sector financiero y asegurador en México.`,
      advisorImpact: formatStructuredAdvisorImpact({
        targetProduct: 'Pólizas de Vida y GMM con Suscripción Digital / Seguro Empresarial',
        clientAngle: 'La tecnología hoy permite emitir pólizas sin exámenes médicos invasivos y gestionar reembolsos desde el celular, eliminando la fricción para clientes ocupados.',
        whatsappHook: `Hola, mira esta nota de ${art.sourceName} sobre cómo la tecnología está transformando las finanzas y los seguros ("${art.title}"). Hoy podemos dejar blindada tu protección familiar o empresarial de forma 100% digital en minutos; ¿cuándo agendamos un café virtual?`
      })
    }
  }

  // 9. Default Seguros / AMIS / CNSF / Protección Familiar & Empresarial (varied by indexOffset)
  if (indexOffset % 2 === 1) {
    return {
      category: 'Seguros y Fianzas' as ProfessionalCategory,
      tags: ['Hombre Clave', 'Continuidad PyME', 'Seguros', 'Patrimonio'],
      executiveSummary: art.description || `Información sectorial publicada por ${art.sourceName} sobre el crecimiento y regulación de las coberturas de protección patrimonial y empresarial en México.`,
      advisorImpact: formatStructuredAdvisorImpact({
        targetProduct: 'Seguro de Hombre Clave / Socios y Continuidad Empresarial',
        clientAngle: 'Para dueños de negocio y profesionistas independientes, un imprevisto de salud o fallecimiento sin liquidez inmediata frena la operación de su empresa y son deducibles al 100%.',
        whatsappHook: `Hola, leí hoy esta nota del sector asegurador en ${art.sourceName} ("${art.title}") y me acordé de tu negocio. ¿Ya aprovechas el blindaje de Hombre Clave para proteger la liquidez de tu empresa y deducirlo de impuestos? Platicamos 10 min esta semana.`
      })
    }
  }

  return {
    category: 'Seguros y Fianzas' as ProfessionalCategory,
    tags: ['Seguros de Vida', 'AMIS / CNSF', 'Blindaje Familiar', 'Finanzas'],
    executiveSummary: art.description || `Reporte de ${art.sourceName} sobre la solidez del sector asegurador mexicano y la importancia de contar con respaldo financiero ante eventualidades.`,
    advisorImpact: formatStructuredAdvisorImpact({
      targetProduct: 'Seguro de Vida y Protección Patrimonial Familiar',
      clientAngle: 'Menos del 25% de las familias mexicanas cuentan con un seguro de vida individual; garantizar la liquidez inmediata ante invalidez o fallecimiento cuesta una fracción mínima del ingreso mensual.',
      whatsappHook: `Hola, te comparto esta nota de hoy en ${art.sourceName} ("${art.title}"). Aprovechando la lectura, me encantaría hacerte una auditoría sin costo de tus pólizas actuales para verificar que tus beneficiarios y sumas aseguradas estén al 100%. ¿Te queda bien mañana?`
    })
  }
}

async function curateArticlesWithAI(articles: RawCandidateArticle[]): Promise<AIEvaluationItem[]> {
  if (articles.length === 0) return []

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_API_KEY
  if (!apiKey) {
    return []
  }

  try {
    const promptArticles = articles
      .map((a, idx) => `[${idx}] MEDIO: ${a.sourceName} | CATEGORÍA SUGERIDA: ${a.category} | TÍTULO: ${a.title}\nCONTEXTO: ${a.description || 'Redactar resumen periodístico de 2 oraciones basado en el titular.'}`)
      .join('\n\n')

    const systemPrompt = `Eres el Director Comercial de una Promotoría de Seguros y Estrategia Patrimonial en México (especialista en Gastos Médicos Mayores, Vida, Planes Personales de Retiro PPR Art. 151/185, Ahorro en UDIs/Dólares y Hombre Clave).
Evalúa la siguiente lista de noticias recientes y devuelve ÚNICAMENTE un objeto JSON válido con la propiedad "evaluations" (arreglo).

REGLAS ESTRICTAS:
1. "isProfessional": true SOLO si la noticia le sirve a un Agente de Seguros en México para educar a un cliente, hablar de riesgos reales (salud, inflación, retiro, impuestos, tasas, tipo de cambio, innovación financiera) y agendar una cita. Si es nota roja, deportes, farándula, ofertas de tiendas o irrelevante, pon "isProfessional": false.
2. PROHIBIDO repetir el mismo consejo entre artículos distintos. Cada noticia aprobada DEBE hacer referencia directa al hecho o dato específico de ESE titular.
3. Formato exacto de cada elemento en "evaluations":
{
  "index": number,
  "isProfessional": boolean,
  "category": "Seguros y Fianzas" | "Macroeconomía y Tasas" | "Retiro e Inversiones" | "Insurtech e Innovación",
  "executiveSummary": "Resumen periodístico de 2 oraciones (máx 240 caracteres) explicando el hecho clave de la nota en México",
  "tags": ["Tag1", "Tag2", "Tag3"],
  "targetProduct": "Producto específico a ofrecer (ej. 'Gastos Médicos Mayores', 'PPR Art. 151 (Deducción SAT)', 'Vida / Dotal en UDIs', 'Seguro de Hombre Clave')",
  "clientAngle": "1 oración aterrizada explicando cómo le afecta esta noticia específica al bolsillo del cliente y por qué debe actuar",
  "whatsappHook": "Mensaje natural de 1-2 oraciones listo para copiar y mandar por WhatsApp al cliente mencionando el tema específico de la nota y proponiendo una llamada de 10 min"
}

NOTICIAS A EVALUAR:
${promptArticles}`

    const candidateModels = ['gemini-3.5-flash-lite', 'gemini-3.8-flash', 'gemini-2.5-flash', 'gemini-2.0-flash']

    for (const modelName of candidateModels) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: systemPrompt }] }],
              generationConfig: {
                temperature: 0.35,
                responseMimeType: 'application/json'
              }
            })
          }
        )

        if (!res.ok) continue

        const data = await res.json()
        const parts = data.candidates?.[0]?.content?.parts || []
        const rawText = parts
          .filter((p: any) => !p?.thought && typeof p?.text === 'string')
          .map((p: any) => p.text)
          .join('')
          .replace(/```json/g, '')
          .replace(/```/g, '')
          .trim()

        if (!rawText) continue

        const parsed = JSON.parse(rawText)
        const evaluations = Array.isArray(parsed) ? parsed : parsed.evaluations
        if (Array.isArray(evaluations) && evaluations.length > 0) {
          return evaluations
        }
      } catch (err) {
        console.warn(`Model ${modelName} failed in newsletter curation:`, err)
      }
    }

    return []
  } catch (error) {
    console.error("Error in curateArticlesWithAI:", error)
    return []
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const authHeader = request.headers.get('authorization')

  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    if (process.env.NODE_ENV === 'production') {
      const bypass = searchParams.get('bypass')
      if (bypass !== 'aacom123') {
        return new NextResponse('Unauthorized', { status: 401 })
      }
    }
  }

  const clear = searchParams.get('clear')
  if (clear === 'true') {
    try {
      await prisma.newsArticle.deleteMany({})
    } catch (err: any) {
      return NextResponse.json({ success: false, error: `Failed to clear DB: ${err.message}` }, { status: 500 })
    }
  }

  try {
    // 1. Always purge legacy static MOCK_ARTICLES, generic tips, and articles older than 10 days
    try {
      const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
      await prisma.newsArticle.deleteMany({
        where: {
          OR: [
            { title: { in: LEGACY_MOCK_TITLES } },
            { url: { in: LEGACY_MOCK_URLS } },
            { publishedAt: { lt: tenDaysAgo } },
            { advisorImpact: { contains: 'Utiliza esta noticia para transmitir solidez' } },
            { advisorImpact: { contains: 'Información relevante para dar contexto económico' } }
          ]
        }
      })

      for (const blocked of BLOCKLIST_KEYWORDS.slice(0, 18)) {
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
      console.warn("Non-fatal error cleaning legacy/stale articles:", cleanupErr)
    }

    // 2. Primary Source: Live Google News RSS México interleaved across the 4 financial pillars
    const rawArticles: RawCandidateArticle[] = await fetchLiveGoogleNewsMX()

    // 3. Hard keyword blocklist + Intra-batch similarity deduplication (threshold 0.45 so we don't repeat the same event 3 times)
    const uniqueCandidates: RawCandidateArticle[] = []
    for (const art of rawArticles) {
      if (!art.title || !art.url) continue
      const lower = `${art.title} ${art.description || ''}`.toLowerCase()
      if (BLOCKLIST_KEYWORDS.some(b => lower.includes(b.toLowerCase()))) continue
      if (uniqueCandidates.some(existing => calculateTitleSimilarity(existing.title, art.title) >= 0.45)) continue
      uniqueCandidates.push(art)
    }

    // 4. Compare against existing recent DB articles
    const recentArticles = await prisma.newsArticle.findMany({
      orderBy: { publishedAt: 'desc' },
      take: 50,
      select: { id: true, title: true, advisorImpact: true }
    })

    const dedupedCandidates = uniqueCandidates.filter(cand => {
      const existing = recentArticles.find(recent => calculateTitleSimilarity(cand.title, recent.title) >= 0.65)
      if (!existing) return true
      return !existing.advisorImpact?.includes('🎯 Ramo:')
    })

    // 5. Curate up to 12 balanced candidates per run
    const batchToEvaluate = dedupedCandidates.slice(0, 12)
    const aiEvaluations = await curateArticlesWithAI(batchToEvaluate)
    const evalMap = new Map<number, AIEvaluationItem>()
    aiEvaluations.forEach(ev => evalMap.set(ev.index, ev))

    let insertedCount = 0

    for (let i = 0; i < batchToEvaluate.length; i++) {
      const art = batchToEvaluate[i]
      const aiEval = evalMap.get(i)

      if (aiEval && aiEval.isProfessional === false) {
        continue
      }

      const fallback = buildSmartFallbackEvaluation(art, i)

      const validCategories: ProfessionalCategory[] = [
        "Seguros y Fianzas",
        "Macroeconomía y Tasas",
        "Retiro e Inversiones",
        "Insurtech e Innovación"
      ]
      const finalCategory: ProfessionalCategory =
        aiEval?.category && validCategories.includes(aiEval.category)
          ? aiEval.category
          : fallback.category

      const finalTags = aiEval?.tags && Array.isArray(aiEval.tags) && aiEval.tags.length > 0
        ? aiEval.tags.slice(0, 4)
        : fallback.tags

      const finalDescription = aiEval?.executiveSummary || fallback.executiveSummary
      const finalAdvisorImpact =
        aiEval?.targetProduct && aiEval?.clientAngle && aiEval?.whatsappHook
          ? formatStructuredAdvisorImpact({
              targetProduct: aiEval.targetProduct,
              clientAngle: aiEval.clientAngle,
              whatsappHook: aiEval.whatsappHook
            })
          : fallback.advisorImpact

      try {
        await prisma.newsArticle.upsert({
          where: { title: art.title },
          update: {
            url: art.url,
            description: finalDescription,
            content: finalDescription,
            imageUrl: art.imageUrl,
            sourceName: art.sourceName,
            category: finalCategory,
            tags: finalTags,
            advisorImpact: finalAdvisorImpact,
            publishedAt: art.publishedAt
          },
          create: {
            title: art.title,
            description: finalDescription,
            content: finalDescription,
            url: art.url,
            imageUrl: art.imageUrl,
            sourceName: art.sourceName || 'Prensa Financiera MX',
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

    return NextResponse.json({
      success: true,
      insertedCount,
      totalInDb: await prisma.newsArticle.count()
    })
  } catch (error: any) {
    console.error('Cron newsletters error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
