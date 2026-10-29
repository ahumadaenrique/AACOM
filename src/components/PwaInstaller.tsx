"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { 
  X, 
  PlusSquare, 
  Sparkles,
  Smartphone,
  Compass
} from "lucide-react"

export default function PwaInstaller({ agencyName = "AACOMSoft" }: { agencyName?: string }) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showPrompt, setShowPrompt] = useState<boolean>(false)
  const [isIOS, setIsIOS] = useState<boolean>(false)
  const [isIOSInApp, setIsIOSInApp] = useState<boolean>(false)
  const [showIOSGuide, setShowIOSGuide] = useState<boolean>(false)

  useEffect(() => {
    // 1. Register the Service Worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js")
        .then(() => {
          // SW registered successfully
        })
        .catch(err => {
          console.error("Service worker registration failed:", err)
        })
    }

    // 2. Detect if already installed (standalone mode)
    const isStandalone = () => {
      const nav = window.navigator as any
      return Boolean(nav.standalone) || window.matchMedia("(display-mode: standalone)").matches
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

    // 5. iOS & iPadOS 13+ Detection (including Safari, Chrome CriOS, and WhatsApp/In-App browsers)
    const isIOSDevice = () => {
      const ua = window.navigator.userAgent || ""
      const isIPhoneOrIPod = /iPad|iPhone|iPod/i.test(ua) && !(window as any).MSStream
      const isIPadOS13Plus = window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1
      return isIPhoneOrIPod || isIPadOS13Plus
    }

    const isInAppWebView = () => {
      const ua = window.navigator.userAgent || ""
      return /WhatsApp|FBAN|FBAV|Instagram|Line|MicroMessenger/i.test(ua)
    }

    if (isIOSDevice()) {
      setIsIOS(true)
      setIsIOSInApp(isInAppWebView())
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
                <p className="text-[13px] text-teal-100/90 mt-1">
                  Agrega &ldquo;{agencyName}&rdquo; a tu pantalla de inicio para un acceso rápido y pantalla completa.
                </p>
              </div>
            </div>
            <button 
              onClick={handleDismiss}
              className="p-1 text-teal-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Cerrar aviso de instalación"
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

      {/* iOS Safari / Chrome Installation Guide Modal */}
      {showIOSGuide && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300"
          onClick={() => setShowIOSGuide(false)}
        >
          <div 
            className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl border border-slate-100 flex flex-col gap-5 text-slate-800 animate-in zoom-in-95 duration-300"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b pb-3.5">
              <h3 className="font-black text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Smartphone className="h-4 w-4 text-teal-600 animate-pulse" />
                Instalar en tu iPhone / iPad
              </h3>
              <button 
                onClick={() => setShowIOSGuide(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {isIOSInApp && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 font-semibold flex items-start gap-2">
                <Compass className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  Estás abriendo el enlace desde un navegador interno (ej. WhatsApp). Primero toca el ícono de <strong>Abrir en Safari</strong> abajo a la derecha.
                </div>
              </div>
            )}

            <div className="flex flex-col gap-4 text-xs font-semibold text-slate-600">
              
              <div className="flex gap-3.5 items-start">
                <div className="h-6 w-6 rounded-full bg-teal-50 text-teal-600 font-bold flex items-center justify-center shrink-0 text-[11px] border border-teal-100">
                  1
                </div>
                <div className="flex flex-col gap-1">
                  <p>Presiona el botón de <strong className="text-slate-900">Compartir</strong> en la barra de tu navegador (Safari o Chrome).</p>
                  <p className="text-[10px] text-slate-400 font-medium">
                    (En Safari está en la barra inferior; en Chrome en la esquina superior derecha).
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
                  <p>Desplázate hacia abajo en el menú y selecciona <strong className="text-slate-900">&ldquo;Agregar a pantalla de inicio&rdquo;</strong>.</p>
                  {/* Visual Add to Home Screen Icon */}
                  <div className="inline-flex items-center gap-1.5 self-start px-2 py-1 bg-slate-100 rounded-md border text-[10px] font-bold text-slate-700 mt-1">
                    <PlusSquare className="h-3.5 w-3.5 text-slate-800" />
                    Agregar a pantalla de inicio
                  </div>
                </div>
              </div>

              <div className="flex gap-3.5 items-start">
                <div className="h-6 w-6 rounded-full bg-teal-50 text-teal-600 font-bold flex items-center justify-center shrink-0 text-[11px] border border-teal-100">
                  3
                </div>
                <p className="mt-1">
                  Presiona <strong className="text-slate-900">&ldquo;Agregar&rdquo;</strong> en la esquina superior derecha para instalar el ícono en tu celular.
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
