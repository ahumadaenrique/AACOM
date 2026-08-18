"use client"
import React, { useState } from 'react'

export default function AdminCotizadorSettings({ agencyId, initialSettings }: { agencyId: string, initialSettings: any }) {
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState("")
  
  const [settings, setSettings] = useState({
    quoterLifeCompany: initialSettings?.quoterLifeCompany || "Insignia Life",
    quoterEnableVPL: initialSettings?.quoterEnableVPL ?? true,
    quoterEnableVPLPPR: initialSettings?.quoterEnableVPLPPR ?? true,
    quoterEnableUniversal: initialSettings?.quoterEnableUniversal ?? true,
    quoterShowAccumulatedPremium: initialSettings?.quoterShowAccumulatedPremium ?? false
  })

  const handleSave = async () => {
    setLoading(true)
    setSuccessMsg("")
    try {
      const res = await fetch('/api/admin/agency-quoter-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })
      if (res.ok) {
        setSuccessMsg("¡Ajustes guardados correctamente!")
      } else {
        alert("Error al guardar ajustes.")
      }
    } catch (e) {
      alert("Error de conexión.")
    }
    setLoading(false)
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
      <h2 className="text-xl font-bold text-slate-800 mb-6">Parámetros del Cotizador Modular</h2>
      
      <div className="space-y-6 max-w-2xl">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">Compañía de Seguros (Vida)</label>
          <input 
            type="text"
            className="w-full border rounded-md p-2 focus:ring-2 focus:ring-emerald-500 outline-none"
            value={settings.quoterLifeCompany}
            onChange={(e) => setSettings({...settings, quoterLifeCompany: e.target.value})}
          />
        </div>

        <div className="pt-4 border-t border-slate-100">
          <h3 className="text-md font-semibold text-slate-800 mb-4">Productos Habilitados</h3>
          <div className="space-y-3">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input 
                type="checkbox" 
                className="w-5 h-5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                checked={settings.quoterEnableVPL}
                onChange={(e) => setSettings({...settings, quoterEnableVPL: e.target.checked})}
              />
              <span className="text-slate-700">Vida Pagos Limitados (VPL)</span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input 
                type="checkbox" 
                className="w-5 h-5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                checked={settings.quoterEnableVPLPPR}
                onChange={(e) => setSettings({...settings, quoterEnableVPLPPR: e.target.checked})}
              />
              <span className="text-slate-700">Vida Pagos Limitados (VPL PPR)</span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input 
                type="checkbox" 
                className="w-5 h-5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                checked={settings.quoterEnableUniversal}
                onChange={(e) => setSettings({...settings, quoterEnableUniversal: e.target.checked})}
              />
              <span className="text-slate-700">Insignia Life Universal</span>
            </label>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <h3 className="text-md font-semibold text-slate-800 mb-4">Opciones de Proyección (Tabla)</h3>
          <label className="flex items-center space-x-3 cursor-pointer">
            <input 
              type="checkbox" 
              className="w-5 h-5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
              checked={settings.quoterShowAccumulatedPremium}
              onChange={(e) => setSettings({...settings, quoterShowAccumulatedPremium: e.target.checked})}
            />
            <span className="text-slate-700">Mostrar columna "Prima en Pesos Acumulada"</span>
          </label>
          <p className="text-xs text-slate-500 mt-1 ml-8">Si se activa, el cotizador mostrará la suma acumulativa de la prima proyectada año con año.</p>
        </div>

        <div className="pt-6">
          <button 
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-2 bg-emerald-600 text-white rounded-md font-medium hover:bg-emerald-700 disabled:opacity-50"
          >
            {loading ? "Guardando..." : "Guardar Ajustes"}
          </button>
          {successMsg && <p className="text-emerald-600 mt-3 font-medium">{successMsg}</p>}
        </div>
      </div>
    </div>
  )
}
