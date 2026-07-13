"use client"

import { useState } from "react"
import { X, Check, Loader2, CreditCard, Sparkles, Clock } from "lucide-react"

interface BuyMinutesModalProps {
  isOpen: boolean
  onClose: () => void
}

interface Package {
  id: string
  name: string
  minutes: number
  price: number // in MXN
  popular?: boolean
}

const PACKAGES: Package[] = [
  {
    id: "basic",
    name: "Paquete Básico",
    minutes: 30,
    price: 199,
  },
  {
    id: "standard",
    name: "Paquete Estándar",
    minutes: 60,
    price: 299,
    popular: true,
  },
  {
    id: "pro",
    name: "Paquete Pro",
    minutes: 100,
    price: 349,
  },
]

export function BuyMinutesModal({ isOpen, onClose }: BuyMinutesModalProps) {
  const [selectedPkg, setSelectedPkg] = useState<string>("standard")
  const [promoCode, setPromoCode] = useState<string>("")
  const [isValidating, setIsValidating] = useState<boolean>(false)
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; percentage: number } | null>(null)
  const [couponError, setCouponError] = useState<string | null>(null)
  const [isRedirecting, setIsRedirecting] = useState<boolean>(false)

  if (!isOpen) return null

  const activePkg = PACKAGES.find((p) => p.id === selectedPkg)!
  const originalPrice = activePkg.price
  const discountAmount = appliedDiscount ? Math.round(originalPrice * (appliedDiscount.percentage / 100)) : 0
  const finalPrice = Math.max(0, originalPrice - discountAmount)

  const handleValidateCoupon = async () => {
    if (!promoCode.trim()) return
    setIsValidating(true)
    setCouponError(null)
    try {
      const res = await fetch("/api/checkout/validate-coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoCode }),
      })
      const data = await res.json()
      if (res.ok && data.valid) {
        setAppliedDiscount({ code: data.code, percentage: data.discountPercentage })
      } else {
        setCouponError(data.error || "Cupón inválido.")
        setAppliedDiscount(null)
      }
    } catch (err) {
      setCouponError("Error al validar el cupón.")
    } finally {
      setIsValidating(false)
    }
  }

  const handleBuy = async () => {
    setIsRedirecting(true)
    try {
      const res = await fetch("/api/checkout/voice-minutes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId: selectedPkg,
          promoCode: appliedDiscount?.code || null,
        }),
      })
      const data = await res.json()
      if (res.ok && data.url) {
        window.location.href = data.url
      } else {
        alert(data.error || "Ocurrió un error al procesar el pago.")
        setIsRedirecting(false)
      }
    } catch (err) {
      alert("Error de conexión.")
      setIsRedirecting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      {/* Modal Card */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="p-6 pb-4 border-b border-neutral-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-500/10 rounded-xl">
              <Sparkles className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Cargar Minutos de Voz</h3>
              <p className="text-xs text-neutral-500">Elige un paquete para tu Asistente</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-300 transition-colors p-1 rounded-lg hover:bg-neutral-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {/* Package Selector */}
          <div className="space-y-3">
            {PACKAGES.map((pkg) => {
              const isSelected = selectedPkg === pkg.id
              return (
                <button
                  key={pkg.id}
                  onClick={() => setSelectedPkg(pkg.id)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between relative ${
                    isSelected 
                      ? "bg-indigo-950/20 border-indigo-500/80 shadow-md shadow-indigo-500/5" 
                      : "bg-neutral-900/40 border-neutral-800 hover:border-neutral-700"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                      isSelected ? "border-indigo-500 bg-indigo-600 text-white" : "border-neutral-700"
                    }`}>
                      {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-white">{pkg.name}</span>
                        {pkg.popular && (
                          <span className="bg-indigo-500/10 text-indigo-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-500/20">
                            Popular
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-neutral-500">Agrega {pkg.minutes} minutos de conversación</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-white">${pkg.price} MXN</span>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Expiration Notice Banner */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 flex items-start gap-2.5">
            <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-[11px] text-amber-500 leading-normal">
              <span className="font-bold">Nota de vigencia:</span> Los minutos comprados tienen una validez de <span className="font-bold">90 días</span> a partir de la fecha de pago. Consumiremos primero tu saldo gratuito mensual de forma automática.
            </div>
          </div>

          {/* Promo Code Input */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-neutral-400">¿Tienes un código de descuento?</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="EJ. PROMOTER50"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                disabled={appliedDiscount !== null}
                className="flex-1 bg-neutral-900 border border-neutral-800 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-neutral-700 uppercase placeholder:text-neutral-700 disabled:opacity-50"
              />
              {appliedDiscount ? (
                <button
                  onClick={() => {
                    setAppliedDiscount(null)
                    setPromoCode("")
                  }}
                  className="bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-2 rounded-xl text-xs font-medium hover:bg-red-500/20 transition-colors"
                >
                  Quitar
                </button>
              ) : (
                <button
                  onClick={handleValidateCoupon}
                  disabled={isValidating || !promoCode.trim()}
                  className="bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-neutral-300 px-4 py-2 rounded-xl text-xs font-medium transition-colors disabled:opacity-50"
                >
                  {isValidating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Validar"}
                </button>
              )}
            </div>
            {appliedDiscount && (
              <p className="text-xs text-green-500 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> ¡Cupón "{appliedDiscount.code}" aplicado con -{appliedDiscount.percentage}% de descuento!
              </p>
            )}
            {couponError && (
              <p className="text-xs text-red-500">{couponError}</p>
            )}
          </div>

          {/* Pricing breakdown */}
          <div className="bg-neutral-900/30 border border-neutral-900 rounded-2xl p-4 space-y-2.5">
            <div className="flex justify-between text-xs text-neutral-500">
              <span>Precio original</span>
              <span>${originalPrice}.00 MXN</span>
            </div>
            {appliedDiscount && (
              <div className="flex justify-between text-xs text-green-500">
                <span>Descuento ({appliedDiscount.percentage}%)</span>
                <span>-${discountAmount}.00 MXN</span>
              </div>
            )}
            <div className="h-px bg-neutral-900" />
            <div className="flex justify-between text-sm font-bold text-white">
              <span>Total a pagar</span>
              <span>${finalPrice}.00 MXN</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-neutral-900/10 border-t border-neutral-900 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-xl py-3 text-xs font-semibold transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleBuy}
            disabled={isRedirecting}
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-3 text-xs font-bold transition-all shadow-lg hover:shadow-indigo-500/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRedirecting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Cargando pago...</span>
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4" />
                <span>Pagar con Stripe</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  )
}
