"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { 
  Upload, 
  X, 
  PlusSquare, 
  MessageSquare,
  Sparkles,
  Smartphone
} from "lucide-react"

export default function PwaInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showPrompt, setShowPrompt] = useState<boolean>(false)
  const [isIOS, setIsIOS] = useState<boolean>(false)
  const [showIOSGuide, setShowIOSGuide] = useState<boolean>(false)

  useEffect(() => {
    // 1. Register the Service Worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js")
        .then(reg => {
          // SW registered successfully
        })
        .catch(err => {
          console.error("Service worker registration failed:", err)
        })
    }

    // 2. Detect if already installed (standalone mode)
    const isStandalone = () => {
      const nav = window.navigator as any
      return nav.standalone || window.matchMedia("(display-mode: standalone)").matches
    }

    if (isStandalone()) {
      return // Already installed, no need to show prompt
    }

    // 3. Check if user dismissed prompt recently
    const dismissedTime = localStorage.getItem("pwa_install_dismissed")
    if (dismissedTime) {
      const now = new Date().getTime()
      const diff = now - parseInt(dismissedTime, 10)
      const sevenDays = 7 * 24 * 60 * 60 * 1000
      if (diff < sevenDays) {
        return // Do not show again for 7 days
      }
    }

    // 4. Android/Chrome Install Prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowPrompt(true)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    // 5. iOS Safari Detection
    const isIOSDevice = () => {
      const ua = window.navigator.userAgent
      const ipad = !!ua.match(/iPad/i)
      const iphone = !!ua.match(/iPhone/i)
      const ipod = !!ua.match(/iPod/i)
      return (ipad || iphone || ipod) && !(window as any).MSStream
    }

    const isSafariBrowser = () => {
      const ua = window.navigator.userAgent
      return ua.includes("Safari") && !ua.includes("CriOS") && !ua.includes("FxiOS")
    }

    if (isIOSDevice() && isSafariBrowser()) {
      setIsIOS(true)
      setShowPrompt(true)
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSGuide(true)
      return
    }

    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === "accepted") {
      setShowPrompt(false)
    }
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem("pwa_install_dismissed", new Date().getTime().toString())
  }

  if (!showPrompt) return null

  return (
    <>
      {/* Installation Banner */}
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-in slide-in-from-bottom duration-500">
        <div className="bg-gradient-to-r from-teal-900 to-teal-850 text-white rounded-2xl p-4 shadow-2xl border border-teal-500/20 backdrop-blur-md flex flex-col gap-3">
          
          <div className="flex items-start justify-between">
            <div className="flex gap-3">
              <div className="p-2.5 bg-teal-800/80 rounded-xl border border-teal-500/30 flex items-center justify-center shrink-0">
                <Smartphone className="h-5 w-5 text-teal-300 animate-pulse" />
              </div>
              <div className="flex flex-col">
                <h4 className="font-bold text-xs tracking-wide uppercase flex items-center gap-1 text-teal-200">
                  <Sparkles className="h-3.5 w-3.5 text-yellow-400" />
                  Instalar Aplicación
                </h4>
                <p className="text-[11px] font-medium text-slate-100 mt-0.5 leading-relaxed">
                  Agrega "AACOM Seguros" a tu pantalla de inicio para un acceso rápido y notificaciones.
                </p>
              </div>
            </div>
            <button 
              onClick={handleDismiss}
              className="p-1 text-teal-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex gap-2 justify-end mt-1">
            <Button
              onClick={handleDismiss}
              variant="ghost"
              size="sm"
              className="text-[10px] font-black text-teal-300 hover:text-white hover:bg-white/5 uppercase tracking-wider"
            >
              Quizás luego
            </Button>
            <Button
              onClick={handleInstallClick}
              size="sm"
              className="bg-teal-500 hover:bg-teal-400 text-teal-950 font-black text-[10px] uppercase tracking-wider px-4 rounded-xl shadow-lg shadow-teal-500/20"
            >
              Instalar ahora
            </Button>
          </div>

        </div>
      </div>

      {/* iOS Safari Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div 
            className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl border border-slate-100 flex flex-col gap-5 text-slate-800 animate-in zoom-in-95 duration-300"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b pb-3.5">
              <h3 className="font-black text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Smartphone className="h-4.5 w-4.5 text-teal-600 animate-pulse" />
                Instalar en tu iPhone / iPad
              </h3>
              <button 
                onClick={() => setShowIOSGuide(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-col gap-4 text-xs font-semibold text-slate-600">
              
              <div className="flex gap-3.5 items-start">
                <div className="h-6 w-6 rounded-full bg-teal-50 text-teal-600 font-bold flex items-center justify-center shrink-0 text-[11px] border border-teal-100">
                  1
                </div>
                <div className="flex flex-col gap-1">
                  <p>Presiona el botón de **Compartir** en Safari.</p>
                  <p className="text-[10px] text-slate-400 font-medium">
                    (Ubicado en la barra de navegación inferior en tu celular).
                  </p>
                  {/* Visual Share Icon */}
                  <div className="inline-flex items-center gap-1.5 self-start px-2 py-1 bg-slate-100 rounded-md border text-[10px] font-bold text-slate-700 mt-1">
                    <svg className="h-3.5 w-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Botón Compartir
                  </div>
                </div>
              </div>

              <div className="flex gap-3.5 items-start">
                <div className="h-6 w-6 rounded-full bg-teal-50 text-teal-600 font-bold flex items-center justify-center shrink-0 text-[11px] border border-teal-100">
                  2
                </div>
                <div className="flex flex-col gap-1">
                  <p>Desplázate hacia abajo y selecciona **"Agregar al inicio"**.</p>
                  {/* Visual Add to Home Screen Icon */}
                  <div className="inline-flex items-center gap-1.5 self-start px-2 py-1 bg-slate-100 rounded-md border text-[10px] font-bold text-slate-700 mt-1">
                    <PlusSquare className="h-3.5 w-3.5 text-slate-800" />
                    Agregar al inicio
                  </div>
                </div>
              </div>

              <div className="flex gap-3.5 items-start">
                <div className="h-6 w-6 rounded-full bg-teal-50 text-teal-600 font-bold flex items-center justify-center shrink-0 text-[11px] border border-teal-100">
                  3
                </div>
                <p className="mt-1">
                  Presiona **"Agregar"** en la esquina superior derecha del celular para confirmar la instalación.
                </p>
              </div>

            </div>

            <Button
              onClick={() => setShowIOSGuide(false)}
              className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs w-full py-2.5 rounded-xl mt-2"
            >
              Entendido
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
