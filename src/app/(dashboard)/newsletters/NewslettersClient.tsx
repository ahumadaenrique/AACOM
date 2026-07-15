"use client"

import { useState } from 'react'
import { Search, Calendar, Globe, BookOpen, ExternalLink, RefreshCw } from 'lucide-react'

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
  publishedAt: Date | string
}

export default function NewslettersClient({ initialArticles, isSuperAdmin = false }: { initialArticles: NewsArticle[], isSuperAdmin?: boolean }) {
  const [articles, setArticles] = useState<NewsArticle[]>(initialArticles)
  const [selectedCategory, setSelectedCategory] = useState<string>("Todos")
  const [searchQuery, setSearchQuery] = useState("")
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Handle manual curation refresh trigger
  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      const res = await fetch('/api/cron/newsletters?bypass=aacom123')
      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          // Fetch updated list from a temporary getter or refresh the page
          window.location.reload()
        }
      }
    } catch (err) {
      console.error("Failed to trigger news curation:", err)
    } finally {
      setIsRefreshing(false)
    }
  }

  // Filter logic
  const filteredArticles = articles.filter(art => {
    const matchesCategory = selectedCategory === "Todos" || art.category === selectedCategory
    const matchesSearch = 
      art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (art.description && art.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      art.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    return matchesCategory && matchesSearch
  })

  // Format date helper (CDMX style Spanish format)
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
                  Terminal de Inteligencia Financiera AACOM
                </span>
                <h1 className="whitepaper-title text-4xl md:text-5xl font-black mt-2 tracking-tight text-zinc-950 dark:text-white">
                  NEWSLETTERS
                </h1>
              </div>
              <div className="flex items-center gap-3">
                {isSuperAdmin && (
                  <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="flex items-center gap-2 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 text-xs font-bold px-4 py-2 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                    title="Actualizar feed de noticias"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                    {isRefreshing ? 'Actualizando...' : 'Actualizar'}
                  </button>
                )}
              </div>
            </div>
            
            {/* Top Meta Line */}
            <div className="flex flex-col md:flex-row justify-between items-center border-t border-zinc-300 dark:border-zinc-800 mt-4 pt-3 text-[11px] font-mono tracking-wider text-zinc-500 uppercase gap-2">
              <div>Edición Financiera Diaria</div>
              <div className="flex items-center gap-2">
                <Calendar className="w-3 h-3" />
                {new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
              <div>Curación Automatizada</div>
            </div>
          </header>

          {/* Filtering & Search panel */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-zinc-200 dark:border-zinc-800 pb-4">
            <div className="flex flex-wrap gap-1">
              {["Todos", "Mexico", "Global"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-xs font-mono tracking-widest uppercase px-4 py-2 rounded transition-colors ${
                    selectedCategory === cat
                      ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 font-black"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                  }`}
                >
                  {cat === "Mexico" ? "México" : cat}
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
                placeholder="Buscar por tag o palabra clave..."
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg text-xs focus:ring-1 focus:ring-zinc-950 focus:border-zinc-950 outline-none transition-shadow font-sans dark:text-zinc-100"
              />
            </div>
          </div>

          {/* Feed Content */}
          {filteredArticles.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-2xl">
              <BookOpen className="w-10 h-10 text-zinc-400 mx-auto mb-4" />
              <h3 className="whitepaper-title font-bold text-lg text-zinc-800 dark:text-zinc-200">No se encontraron noticias</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto font-sans leading-relaxed">
                Prueba buscando otro término o haz clic en "Actualizar" para traer las últimas novedades de finanzas y seguros.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-12">
              {filteredArticles.map((art) => (
                <article key={art.id} className="group flex flex-col justify-between border-b border-zinc-200 dark:border-zinc-800 pb-8 last:border-0 md:last:border-b">
                  
                  {/* Article header metadata */}
                  <div className="flex items-center justify-between text-[10px] font-mono tracking-wider uppercase text-zinc-500 dark:text-zinc-400 mb-2">
                    <span className="font-bold text-zinc-800 dark:text-zinc-300">
                      {art.sourceName || "Finanzas"}
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
                    <p className="font-sans text-[13.5px] leading-relaxed text-zinc-600 dark:text-zinc-400 mb-4 line-clamp-3">
                      {art.description}
                    </p>
                  )}

                  {/* Bottom Tags and Category Line */}
                  <div className="mt-auto pt-2 flex flex-wrap items-center justify-between gap-3">
                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5">
                      <span className="font-mono text-[9px] font-black uppercase bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 px-1.5 py-0.5 rounded">
                        {art.category === "Mexico" ? "MÉX" : "GLOB"}
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
                      Ver boletín original
                    </a>
                  </div>

                </article>
              ))}
            </div>
          )}

          {/* Whitepaper Footer info */}
          <footer className="mt-20 border-t border-zinc-400 dark:border-zinc-800 pt-8 text-center text-[10px] font-mono tracking-wider text-zinc-500 uppercase">
            <div>© {new Date().getFullYear()} AACOM Seguros. Todos los derechos reservados.</div>
            <div className="mt-1">Servicio de inteligencia de mercados y curación financiera automatizada v4.0.</div>
          </footer>

        </div>
      </div>
    </>
  )
}
