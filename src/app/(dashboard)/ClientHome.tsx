"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowUpRight, Sparkles, Megaphone, ZoomIn, X, Link as LinkIcon, User } from "lucide-react"

interface Announcement {
  id: string
  type: string
  imageUrl: string
  linkUrl: string | null
  active: boolean
  createdAt: Date
}

interface ClientHomeProps {
  announcements: Announcement[]
  isBirthday?: boolean
  currentUser?: {
    name: string | null
    image: string | null
  } | null
}

export default function ClientHome({ announcements, isBirthday = false, currentUser = null }: ClientHomeProps) {
  const [selectedAd, setSelectedAd] = useState<Announcement | null>(null)
  const [showBirthday, setShowBirthday] = useState(false)

  useEffect(() => {
    if (isBirthday) {
      const dismissed = sessionStorage.getItem("birthday_dismissed")
      if (dismissed !== "true") {
        setShowBirthday(true)
      }
    }
  }, [isBirthday])

  const handleCloseBirthday = () => {
    sessionStorage.setItem("birthday_dismissed", "true")
    setShowBirthday(false)
  }
  
  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedAd(null)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const hasAnnouncements = announcements && announcements.length > 0

  return (
    <div className="space-y-6">
      {hasAnnouncements ? (
        <div className="space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-zinc-800">
            <Megaphone className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            <h2 className="text-base font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Comunicados y Campañas Activas
            </h2>
            <span className="text-[10px] text-muted-foreground ml-auto bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full font-bold">
              Haz clic en cualquier imagen para ampliar
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {announcements.map((ad, idx) => {
              // If it's the very first banner and there are multiple, make it look featured
              const isFeatured = idx === 0 && announcements.length > 1
              const cardColSpan = isFeatured ? "col-span-1 md:col-span-2 lg:col-span-2" : "col-span-1"
              const cardHeight = "h-72 md:h-80"

              return (
                <div 
                  key={ad.id}
                  onClick={() => setSelectedAd(ad)}
                  className={`${cardColSpan} ${cardHeight} overflow-hidden rounded-xl border border-slate-200/60 dark:border-zinc-800/80 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer relative`}
                >
                  <div className="relative w-full h-full bg-slate-50 dark:bg-zinc-950 flex items-center justify-center">
                    {/* Blurred background of the image to handle different ratios gracefully */}
                    <div 
                      className="absolute inset-0 bg-cover bg-center blur-md scale-105 opacity-30 select-none pointer-events-none" 
                      style={{ backgroundImage: `url(${ad.imageUrl})` }}
                    />
                    
                    {/* The actual sharp image */}
                    <img 
                      src={ad.imageUrl} 
                      alt="Comunicado AACOM" 
                      className="relative z-10 max-w-full max-h-full object-contain transition-all duration-500 group-hover:scale-[1.02]" 
                    />

                    {/* Premium Dark Overlay on Hover to invite Zooming */}
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-2 z-20">
                      <div className="h-10 w-10 bg-teal-600 text-white rounded-full flex items-center justify-center shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                        <ZoomIn className="h-5 w-5" />
                      </div>
                      <span className="text-[10px] text-white font-bold uppercase tracking-wider">Ampliar Comunicado</span>
                      {ad.linkUrl && (
                        <span className="text-[8px] bg-white/20 text-white border border-white/25 px-2 py-0.5 rounded-full flex items-center gap-1 font-bold">
                          <LinkIcon className="h-2.5 w-2.5" /> Contiene Enlace
                        </span>
                      )}
                    </div>
                    
                    {/* Floating mini-indicator if it has a click link */}
                    {ad.linkUrl && (
                      <div className="absolute top-3 right-3 z-15 bg-teal-600 text-white p-1.5 rounded-full shadow opacity-90 group-hover:opacity-0 transition-opacity duration-300">
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </div>
                    )}

                    {/* Subtle border overlay */}
                    <div className="absolute inset-0 border border-transparent group-hover:border-teal-500/20 rounded-xl transition-all duration-300 pointer-events-none z-30" />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        /* Fallback original static banners if no dynamic ones exist */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="col-span-1 md:col-span-2 lg:col-span-2 overflow-hidden border-0 shadow-lg relative h-64 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-center hover:scale-[1.01] hover:shadow-xl transition-all duration-300">
            <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1574&q=80')] bg-cover bg-center"></div>
            <div className="relative z-10 text-center p-6">
              <h2 className="text-4xl font-extrabold mb-2 tracking-tight">CAMPAÑA 2025</h2>
              <p className="text-lg font-medium opacity-90">¡Supera tus metas y gana un viaje a Cancún!</p>
            </div>
          </Card>

          <Card className="overflow-hidden border-0 shadow-md relative h-64 bg-zinc-900 text-white flex items-center justify-center hover:scale-[1.01] hover:shadow-xl transition-all duration-300">
            <div className="text-center p-6">
              <h3 className="text-2xl font-bold mb-2 tracking-tight">Aviso Importante</h3>
              <p className="text-sm opacity-80">Recuerda subir tus pólizas antes del corte del viernes.</p>
            </div>
          </Card>

          <Card className="col-span-1 md:col-span-3 h-48 bg-gray-50 dark:bg-zinc-900 border-dashed border-2 flex flex-col items-center justify-center text-muted-foreground rounded-xl border-slate-300/80">
            <Sparkles className="h-6 w-6 text-slate-400 mb-2 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Espacio para comunicados de administración</span>
            <span className="text-[10px] text-slate-400 mt-1 text-center max-w-md px-4">Los avisos y banners mensuales subidos por el administrador se mostrarán aquí de forma dinámica.</span>
          </Card>
        </div>
      )}

      {/* FULL-SCREEN LIGHTBOX MODAL ZOOM VIEW */}
      {selectedAd && (
        <div 
          onClick={() => setSelectedAd(null)}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md p-4 sm:p-6 md:p-10 animate-in fade-in duration-300"
        >
          {/* Close button on top-right */}
          <button 
            onClick={() => setSelectedAd(null)}
            className="absolute top-4 right-4 z-55 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2.5 rounded-full transition-all duration-200 shadow-md"
            title="Cerrar (Esc)"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Immersive centered image container */}
          <div 
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the flyer itself
            className="relative max-w-full max-h-[78vh] flex items-center justify-center z-50 rounded-lg overflow-hidden border border-white/10 shadow-2xl bg-zinc-900/50"
          >
            <img 
              src={selectedAd.imageUrl} 
              alt="Comunicado ampliado" 
              className="max-w-[95vw] max-h-[76vh] md:max-h-[78vh] object-contain select-none"
            />
          </div>

          {/* Campaign Action bar at the bottom */}
          <div 
            onClick={(e) => e.stopPropagation()}
            className="mt-6 flex flex-col sm:flex-row items-center gap-4 z-50 w-full max-w-xl text-center bg-zinc-900/80 border border-white/10 backdrop-blur-lg p-4 rounded-2xl shadow-xl text-white"
          >
            <div className="flex-1 text-left">
              <span className="text-[9px] bg-teal-500 text-white font-extrabold px-2 py-0.5 rounded tracking-widest uppercase block w-fit mb-1">
                Visualización Completa
              </span>
              <p className="text-xs text-zinc-300 truncate">
                Cargado el: {new Date(selectedAd.createdAt).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
            
            <div className="flex gap-3 w-full sm:w-auto shrink-0">
              {selectedAd.linkUrl && (
                <a 
                  href={selectedAd.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-none bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-md hover:shadow-teal-500/20 transition-all duration-200"
                >
                  <ArrowUpRight className="h-4 w-4" /> Abrir Enlace de Campaña
                </a>
              )}
              <button 
                onClick={() => setSelectedAd(null)}
                className="flex-1 sm:flex-none bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 hover:text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-colors duration-200"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* CUMPLEANOS OVERLAY */}
      {showBirthday && currentUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 sm:p-6 animate-in fade-in duration-300">
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes confetti-fall {
              0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
              100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
            }
            .confetti-particle {
              position: absolute;
              top: -20px;
              width: 10px;
              height: 10px;
              border-radius: 50%;
              animation: confetti-fall 4s linear infinite;
            }
            @keyframes border-glow {
              0%, 100% { border-color: rgba(234, 179, 8, 0.4); box-shadow: 0 0 15px rgba(234, 179, 8, 0.2); }
              50% { border-color: rgba(234, 179, 8, 0.8); box-shadow: 0 0 30px rgba(234, 179, 8, 0.5); }
            }
            .birthday-card {
              animation: border-glow 3s infinite;
            }
          `}} />

          {/* Falling Confetti Particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
            {[...Array(30)].map((_, i) => {
              const left = (i * 3.3) + Math.random() * 2;
              const delay = Math.random() * 4;
              const duration = 2.5 + Math.random() * 2.5;
              const colors = ["#facc15", "#14b8a6", "#6366f1", "#f43f5e", "#ec4899", "#0ea5e9", "#22c55e"];
              const randColor = colors[i % colors.length];
              
              return (
                <div 
                  key={i} 
                  className="confetti-particle"
                  style={{
                    left: `${left}%`,
                    backgroundColor: randColor,
                    animationDelay: `${delay}s`,
                    animationDuration: `${duration}s`,
                    transform: `scale(${0.5 + Math.random() * 0.8})`
                  }}
                />
              );
            })}
          </div>

          <div 
            className="birthday-card w-full max-w-md bg-zinc-900/90 text-white border-2 border-yellow-500/50 rounded-3xl p-8 text-center relative shadow-2xl animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Confetti sparkle */}
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-yellow-400 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]">
              <Sparkles className="h-16 w-16 animate-pulse" />
            </div>

            {/* Close Button */}
            <button 
              onClick={handleCloseBirthday}
              className="absolute top-4 right-4 text-white/60 hover:text-white bg-white/5 hover:bg-white/10 p-1.5 rounded-full transition-all duration-200"
              title="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Celebrating Agent Profile Picture with Rotating gold circle */}
            <div className="relative h-32 w-32 mx-auto mb-6 mt-4">
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-yellow-500 via-amber-400 to-yellow-600 animate-spin blur-[2px]" style={{ animationDuration: '4s' }} />
              <div className="absolute inset-0.5 rounded-full bg-zinc-900" />
              <div className="absolute inset-1.5 rounded-full overflow-hidden flex items-center justify-center bg-zinc-800">
                {currentUser.image ? (
                  <img 
                    src={currentUser.image} 
                    alt={currentUser.name || "Agente"} 
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-tr from-yellow-500 to-amber-600 text-zinc-950 font-black text-4xl flex items-center justify-center">
                    {currentUser.name ? currentUser.name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase() : <User className="h-12 w-12" />}
                  </div>
                )}
              </div>
            </div>

            {/* Greeting messages */}
            <div className="space-y-4">
              <h2 className="text-3xl font-black bg-gradient-to-r from-yellow-400 via-amber-200 to-yellow-500 bg-clip-text text-transparent uppercase tracking-wider">
                ¡Feliz Cumpleaños!
              </h2>
              
              <h3 className="text-lg font-bold text-white tracking-tight">
                {currentUser.name || "Apreciable Agente"}
              </h3>

              <div className="h-0.5 w-16 bg-yellow-500/50 mx-auto rounded-full" />

              <p className="text-xs text-zinc-300 leading-relaxed max-w-sm mx-auto">
                Hoy es un día especial y todo el equipo de <strong>AACOM Seguros</strong> quiere celebrarte. Te deseamos un año lleno de salud, felicidad, éxitos personales y muchas pólizas emitidas. 
              </p>

              <p className="text-[10px] text-yellow-400 font-extrabold uppercase tracking-widest animate-pulse mt-2">
                ¡Gracias por ser parte esencial de nuestra familia! 🎂🎉
              </p>
            </div>

            {/* Dismiss Button */}
            <div className="mt-8">
              <button
                onClick={handleCloseBirthday}
                className="w-full bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-zinc-950 font-black text-xs px-6 py-3.5 rounded-2xl shadow-lg hover:shadow-yellow-500/20 active:scale-[0.98] transition-all duration-200"
              >
                Muchas Gracias 🍰
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
