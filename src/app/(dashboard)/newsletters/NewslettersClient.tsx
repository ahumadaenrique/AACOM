"use client"

import { useState, useEffect, useRef } from 'react'
import { Search, Calendar, BookOpen, ExternalLink, RefreshCw, Copy, Check, MessageCircle } from 'lucide-react'

interface NewsArticle {
  id: string
  title: string
  description: string | null
  content: string | null
  url: string
  imageUrl: string | null
  sourceName: string | null
  category: string
  tags: string[]
  advisorImpact?: string | null
  publishedAt: Date | string
}

interface FinancialIndicators {
  udi: string | null
  usd: string | null
  eur: string | null
  gbp: string | null
}

interface ParsedAdvisorImpact {
  targetProduct: string | null
  clientAngle: string
  whatsappHook: string | null
}

const CATEGORIES = [
  "Todos",
  "Seguros y Fianzas",
  "Macroeconomía y Tasas",
  "Retiro e Inversiones",
  "Insurtech e Innovación"
]

function parseAdvisorImpact(raw?: string | null): ParsedAdvisorImpact {
  if (!raw) {
    return {
      targetProduct: null,
      clientAngle: '',
      whatsappHook: null
    }
  }

  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean)
  let targetProduct: string | null = null
  let clientAngle = ''
  let whatsappHook: string | null = null

  for (const line of lines) {
    if (line.startsWith('🎯 Ramo:')) {
      targetProduct = line.replace('🎯 Ramo:', '').trim()
    } else if (line.startsWith('💡 Ángulo con el cliente:')) {
      clientAngle = line.replace('💡 Ángulo con el cliente:', '').trim()
    } else if (line.startsWith('💬 Guion WhatsApp:')) {
      whatsappHook = line.replace('💬 Guion WhatsApp:', '').trim().replace(/^["«]|["»]$/g, '')
    }
  }

  if (!clientAngle) {
    clientAngle = raw
  }

  return { targetProduct, clientAngle, whatsappHook }
}

export default function NewslettersClient({ 
  initialArticles, 
  isSuperAdmin = false,
  indicators = { udi: null, usd: null, eur: null, gbp: null },
  agencyName = "aacomsoft",
  needsAutoRefresh = false
}: { 
  initialArticles: NewsArticle[]
  isSuperAdmin?: boolean
  indicators?: FinancialIndicators
  agencyName?: string
  needsAutoRefresh?: boolean
}) {
  const [articles] = useState<NewsArticle[]>(initialArticles)
  const [selectedCategory, setSelectedCategory] = useState<string>("Todos")
  const [searchQuery, setSearchQuery] = useState("")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const autoRefreshTriggered = useRef(false)

  // Handle manual or automatic curation refresh trigger
  const handleRefresh = async () => {
    if (isRefreshing) return
    setIsRefreshing(true)
    try {
      const res = await fetch('/api/cron/newsletters?bypass=aacom123', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          window.location.reload()
        }
      }
    } catch (err) {
      console.error("Failed to trigger news curation:", err)
    } finally {
      setIsRefreshing(false)
    }
  }

  // Auto-refresh on first mount if the feed is stale or still has legacy mock articles
  useEffect(() => {
    if (needsAutoRefresh && !autoRefreshTriggered.current) {
      autoRefreshTriggered.current = true
      handleRefresh()
    }
  }, [needsAutoRefresh])

  const handleCopyPitch = async (art: NewsArticle, parsed: ParsedAdvisorImpact) => {
    const pitchText = parsed.whatsappHook
      ? `${parsed.whatsappHook}\n\n📰 Nota completa (${art.sourceName || 'Finanzas'}): ${art.url}`
      : `Hola, te comparto esta nota de ${art.sourceName || 'hoy'}: "${art.title}". ${parsed.clientAngle}\n\n📰 ${art.url}`

    try {
      await navigator.clipboard.writeText(pitchText)
      setCopiedId(art.id)
      setTimeout(() => setCopiedId(null), 2500)
    } catch (err) {
      console.error("Error al copiar al portapapeles:", err)
    }
  }

  // Filter logic
  const filteredArticles = articles.filter(art => {
    const matchesCategory = selectedCategory === "Todos" || art.category === selectedCategory
    const matchesSearch = 
      art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (art.description && art.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (art.advisorImpact && art.advisorImpact.toLowerCase().includes(searchQuery.toLowerCase())) ||
      art.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    return matchesCategory && matchesSearch
  })

  // Format date helper (CDMX style Spanish format + relative badge)
  const formatDate = (dateInput: Date | string) => {
    const date = new Date(dateInput)
    return date.toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <>
      {/* Import Google Fonts dynamically for Whitepaper look */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400..700;1,400..700&family=Inter:wght@300;400;500;600;700&display=swap');
        .whitepaper-title {
          font-family: 'Lora', Georgia, serif;
        }
        .whitepaper-body {
          font-family: 'Inter', system-ui, sans-serif;
        }
      `}</style>

      <div className="min-h-screen bg-[#F9F9FB] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 whitepaper-body transition-colors duration-200">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
          
          {/* Header - Newspaper/Whitepaper style */}
          <header className="border-b-2 border-zinc-900 dark:border-zinc-100 pb-6 mb-8 text-center md:text-left">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <span className="font-mono text-xs tracking-[0.25em] uppercase text-zinc-500 dark:text-zinc-400">
                  Terminal de Inteligencia Financiera {agencyName}
                </span>
                <h1 className="whitepaper-title text-4xl md:text-5xl font-black mt-2 tracking-tight text-zinc-950 dark:text-white">
                  NEWSLETTERS
                </h1>
              </div>
              <div className="flex items-center gap-3">
                {(isSuperAdmin || isRefreshing) && (
                  <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="flex items-center gap-2 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 text-xs font-bold px-4 py-2 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                    title="Actualizar feed de noticias en vivo con IA"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
                    {isRefreshing ? 'Actualizando noticias de hoy con IA...' : 'Actualizar Noticias en Vivo'}
                  </button>
                )}
              </div>
            </div>

            {/* Financial Indicators Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 mb-2">
              <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/80 rounded-xl p-3.5 shadow-sm hover:shadow transition-shadow flex flex-col items-center md:items-start">
                <span className="font-mono text-[9px] tracking-wider text-zinc-400 dark:text-zinc-500 uppercase font-semibold">DÓLAR (USD FIX)</span>
                <span className="whitepaper-title text-lg md:text-xl font-black text-zinc-900 dark:text-white mt-1">
                  {indicators.usd ? `$${parseFloat(indicators.usd).toFixed(4)}` : 'Cargando...'}
                </span>
                <span className="text-[9px] font-mono text-zinc-500 dark:text-zinc-400 mt-0.5">Pesos por Dólar</span>
              </div>
              <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/80 rounded-xl p-3.5 shadow-sm hover:shadow transition-shadow flex flex-col items-center md:items-start">
                <span className="font-mono text-[9px] tracking-wider text-zinc-400 dark:text-zinc-500 uppercase font-semibold">EURO (EUR)</span>
                <span className="whitepaper-title text-lg md:text-xl font-black text-zinc-900 dark:text-white mt-1">
                  {indicators.eur ? `$${parseFloat(indicators.eur).toFixed(4)}` : 'Cargando...'}
                </span>
                <span className="text-[9px] font-mono text-zinc-500 dark:text-zinc-400 mt-0.5">Pesos por Euro</span>
              </div>
              <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/80 rounded-xl p-3.5 shadow-sm hover:shadow transition-shadow flex flex-col items-center md:items-start">
                <span className="font-mono text-[9px] tracking-wider text-zinc-400 dark:text-zinc-500 uppercase font-semibold">LIBRA ESTERLINA (GBP)</span>
                <span className="whitepaper-title text-lg md:text-xl font-black text-zinc-900 dark:text-white mt-1">
                  {indicators.gbp ? `$${parseFloat(indicators.gbp).toFixed(4)}` : 'Cargando...'}
                </span>
                <span className="text-[9px] font-mono text-zinc-500 dark:text-zinc-400 mt-0.5">Pesos por Libra</span>
              </div>
              <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/80 rounded-xl p-3.5 shadow-sm hover:shadow transition-shadow flex flex-col items-center md:items-start">
                <span className="font-mono text-[9px] tracking-wider text-zinc-400 dark:text-zinc-500 uppercase font-semibold">VALOR UDI</span>
                <span className="whitepaper-title text-lg md:text-xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
                  {indicators.udi ? parseFloat(indicators.udi).toFixed(6) : 'Cargando...'}
                </span>
                <span className="text-[9px] font-mono text-zinc-500 dark:text-zinc-400 mt-0.5">Unidades de Inversión</span>
              </div>
            </div>
            
            {/* Top Meta Line */}
            <div className="flex flex-col md:flex-row justify-between items-center border-t border-zinc-300 dark:border-zinc-800 mt-4 pt-3 text-[11px] font-mono tracking-wider text-zinc-500 uppercase gap-2">
              <div>Edición Financiera Especializada en Tiempo Real</div>
              <div className="flex items-center gap-2">
                <Calendar className="w-3 h-3" />
                {new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
              <div>Estrategia Comercial con IA para el Asesor</div>
            </div>
          </header>

          {/* Filtering & Search panel */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-zinc-200 dark:border-zinc-800 pb-4">
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-xs font-mono tracking-wide px-3.5 py-1.5 rounded-lg transition-all ${
                    selectedCategory === cat
                      ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 font-bold shadow-sm"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/70 dark:hover:bg-zinc-900 bg-zinc-100/60 dark:bg-zinc-900/40"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-3.5 w-3.5 text-zinc-400" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por ramo, tag o palabra clave..."
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg text-xs focus:ring-1 focus:ring-zinc-950 focus:border-zinc-950 outline-none transition-shadow font-sans dark:text-zinc-100"
              />
            </div>
          </div>

          {/* Feed Content */}
          {filteredArticles.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-2xl">
              <BookOpen className="w-10 h-10 text-zinc-400 mx-auto mb-4" />
              <h3 className="whitepaper-title font-bold text-lg text-zinc-800 dark:text-zinc-200">
                {isRefreshing ? 'Descargando y curando noticias financieras de hoy...' : 'No se encontraron noticias'}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto font-sans leading-relaxed">
                Prueba buscando otro término o haz clic en "Actualizar Noticias en Vivo" para obtener las últimas notas del sector asegurador y económico.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-12">
              {filteredArticles.map((art) => {
                const parsedImpact = parseAdvisorImpact(art.advisorImpact)
                const waShareText = parsedImpact.whatsappHook
                  ? `${parsedImpact.whatsappHook}\n\n📰 ${art.url}`
                  : `Hola, te comparto esta nota de ${art.sourceName || 'hoy'}: "${art.title}".\n\n📰 ${art.url}`

                return (
                  <article key={art.id} className="group flex flex-col justify-between border-b border-zinc-200 dark:border-zinc-800 pb-8 last:border-0 md:last:border-b">
                    
                    {/* Article header metadata */}
                    <div className="flex items-center justify-between text-[10px] font-mono tracking-wider uppercase text-zinc-500 dark:text-zinc-400 mb-2">
                      <span className="font-bold text-zinc-800 dark:text-zinc-300">
                        {art.sourceName || "Prensa Financiera"}
                      </span>
                      <span>{formatDate(art.publishedAt)}</span>
                    </div>

                    {/* Title */}
                    <h3 className="whitepaper-title text-xl md:text-2xl font-bold leading-tight text-zinc-950 dark:text-white group-hover:text-zinc-700 dark:group-hover:text-zinc-300 transition-colors mb-3">
                      <a href={art.url} target="_blank" rel="noopener noreferrer" className="flex items-start gap-2">
                        <span>{art.title}</span>
                        <ExternalLink className="w-3.5 h-3.5 mt-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400" />
                      </a>
                    </h3>

                    {/* Description / Summary */}
                    {art.description && (
                      <p className="font-sans text-[13.5px] leading-relaxed text-zinc-600 dark:text-zinc-400 mb-4">
                        {art.description}
                      </p>
                    )}

                    {/* Actionable Commercial Strategy Box for the Insurance Advisor */}
                    {art.advisorImpact && (
                      <div className="mb-4 p-3.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/25 border border-emerald-200/80 dark:border-emerald-800/50 text-emerald-950 dark:text-emerald-200 text-xs leading-relaxed font-sans space-y-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-200/60 dark:border-emerald-800/40 pb-2">
                          <span className="font-bold flex items-center gap-1.5 text-[10.5px] uppercase tracking-wider font-mono text-emerald-800 dark:text-emerald-400">
                            💡 Estrategia Comercial para el Asesor
                          </span>
                          {parsedImpact.targetProduct && (
                            <span className="text-[10px] font-bold bg-emerald-700 text-white dark:bg-emerald-600 px-2 py-0.5 rounded-md shadow-xs">
                              🎯 {parsedImpact.targetProduct}
                            </span>
                          )}
                        </div>

                        {/* Why it matters to the client's pocket */}
                        <div>
                          <span className="font-semibold text-emerald-900 dark:text-emerald-300">Por qué le importa a tu cliente: </span>
                          <span className="text-emerald-800 dark:text-emerald-200/90">{parsedImpact.clientAngle}</span>
                        </div>

                        {/* Ready-to-use WhatsApp hook + Action buttons */}
                        {parsedImpact.whatsappHook && (
                          <div className="bg-white/80 dark:bg-zinc-900/70 border border-emerald-200/70 dark:border-emerald-800/50 rounded-lg p-2.5 space-y-2">
                            <div className="text-[11.5px] italic text-zinc-700 dark:text-zinc-300 leading-snug">
                              <span className="not-italic font-bold text-emerald-700 dark:text-emerald-400 mr-1">💬 Guion para romper el hielo:</span>
                              “{parsedImpact.whatsappHook}”
                            </div>
                            <div className="flex flex-wrap items-center gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => handleCopyPitch(art, parsedImpact)}
                                className="inline-flex items-center gap-1.5 text-[10.5px] font-bold px-2.5 py-1 rounded-md bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/50 dark:hover:bg-emerald-900 text-emerald-900 dark:text-emerald-200 transition-colors cursor-pointer"
                              >
                                {copiedId === art.id ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-700 dark:text-emerald-400" />
                                    ¡Guion y nota copiados!
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    Copiar guion + link
                                  </>
                                )}
                              </button>
                              <a
                                href={`https://wa.me/?text=${encodeURIComponent(waShareText)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-[10.5px] font-bold px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                              >
                                <MessageCircle className="w-3 h-3" />
                                Mandar por WhatsApp
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Bottom Tags and Category Line */}
                    <div className="mt-auto pt-2 flex flex-wrap items-center justify-between gap-3">
                      {/* Tags */}
                      <div className="flex flex-wrap gap-1.5">
                        <span className="font-mono text-[9px] font-black uppercase bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 px-2 py-0.5 rounded">
                          {art.category}
                        </span>
                        {art.tags.map((tag, idx) => (
                          <span 
                            key={idx} 
                            className="font-mono text-[9px] font-bold uppercase text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-2 py-0.5 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      {/* Read link */}
                      <a
                        href={art.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-[10px] text-zinc-900 dark:text-zinc-100 hover:text-zinc-700 dark:hover:text-zinc-300 underline underline-offset-4"
                      >
                        Ver nota original
                      </a>
                    </div>

                  </article>
                )
              })}
            </div>
          )}

          {/* Whitepaper Footer info */}
          <footer className="mt-20 border-t border-zinc-400 dark:border-zinc-800 pt-8 text-center text-[10px] font-mono tracking-wider text-zinc-500 uppercase">
            <div>© 2026 aacomsoft. Todos los derechos reservados.</div>
            <div className="mt-1">Servicio de inteligencia de mercados y curación financiera automatizada v4.0.</div>
          </footer>

        </div>
      </div>
    </>
  )
}
