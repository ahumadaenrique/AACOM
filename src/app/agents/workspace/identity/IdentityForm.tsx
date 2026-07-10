"use client"

import { useState, useRef } from "react"
import { updateCompanyProfile } from "../actions"

export default function IdentityForm({ initialData }: { initialData: any }) {
  const [formData, setFormData] = useState({
    targetAudience: initialData?.targetAudience || "",
    websiteUrl: initialData?.websiteUrl || "",
    industry: initialData?.industry || "",
    description: initialData?.description || "",
    primaryColor: initialData?.primaryColor || "#4f46e5",
    secondaryColor: initialData?.secondaryColor || "#10b981",
    logoUrl: initialData?.logoUrl || ""
  })
  
  const [isSaving, setIsSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleBlur = async () => {
    setIsSaving(true)
    await updateCompanyProfile(formData)
    setIsSaving(false)
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result as string
        handleChange("logoUrl", base64String)
        // Auto-save when logo is uploaded
        updateCompanyProfile({ ...formData, logoUrl: base64String })
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      
      {/* BRAND ASSETS (Logos y Colores) */}
      <div className="bg-[#1A1A1A] border border-neutral-800 rounded-2xl p-6 mb-6 flex flex-col md:flex-row gap-6 items-start">
        <div className="flex-1">
          <h3 className="font-semibold text-white mb-1">Identidad Visual</h3>
          <p className="text-sm text-neutral-500 mb-4">Carga el logotipo de tu empresa y define tus colores corporativos para las plantillas de diseño.</p>
          
          <div className="flex gap-4 mb-4">
            <div className="flex flex-col">
              <label className="text-xs text-neutral-400 mb-1">Color Principal</label>
              <input 
                type="color" 
                className="w-12 h-12 rounded cursor-pointer bg-transparent border-0 p-0"
                value={formData.primaryColor}
                onChange={(e) => handleChange("primaryColor", e.target.value)}
                onBlur={handleBlur}
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-neutral-400 mb-1">Color Secundario</label>
              <input 
                type="color" 
                className="w-12 h-12 rounded cursor-pointer bg-transparent border-0 p-0"
                value={formData.secondaryColor}
                onChange={(e) => handleChange("secondaryColor", e.target.value)}
                onBlur={handleBlur}
              />
            </div>
          </div>
        </div>
        
        <div className="w-48 h-48 rounded-xl border-2 border-dashed border-neutral-700 flex flex-col items-center justify-center overflow-hidden relative group bg-neutral-900 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
          {formData.logoUrl ? (
            <img src={formData.logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
          ) : (
            <div className="text-neutral-500 flex flex-col items-center p-4 text-center">
              <svg className="w-8 h-8 mb-2 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span className="text-xs font-medium">Subir Logo (PNG/JPG)</span>
            </div>
          )}
          <input type="file" className="hidden" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" />
        </div>
      </div>

      {/* DESCRIPCIÓN DE LA COMPAÑÍA */}
      <div className="bg-[#1A1A1A] border border-neutral-800 rounded-2xl p-6 mb-6">
        <h3 className="font-semibold text-white mb-1">El Alma de tu Empresa</h3>
        <p className="text-sm text-neutral-500 mb-4">Describe qué hace tu empresa, tus valores y tu propuesta de valor única.</p>
        
        <textarea 
          className="w-full h-32 bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-sm text-neutral-300 focus:outline-none focus:border-neutral-700"
          value={formData.description}
          onChange={(e) => handleChange("description", e.target.value)}
          onBlur={handleBlur}
          placeholder="Ej. (Tu promotoría) es una promotoría enfocada en desarrollar a los mejores agentes de seguros..."
        />
      </div>
      
      {/* CLIENTES OBJETIVO */}
      <div className="bg-[#1A1A1A] border border-neutral-800 rounded-2xl p-6 mb-6">
        <h3 className="font-semibold text-white mb-1">Público Objetivo</h3>
        <p className="text-sm text-neutral-500 mb-4">¿A quién le hablamos? Describe a tus clientes ideales.</p>
        
        <textarea 
          className="w-full h-24 bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-sm text-neutral-300 focus:outline-none focus:border-neutral-700"
          value={formData.targetAudience}
          onChange={(e) => handleChange("targetAudience", e.target.value)}
          onBlur={handleBlur}
        />
      </div>

      {/* INFORMACIÓN BÁSICA */}
      <div className="bg-[#1A1A1A] border border-neutral-800 rounded-2xl p-6 mb-6">
        <div className="flex justify-between items-center mb-1">
          <h3 className="font-semibold text-white">Información Básica</h3>
          {isSaving && <span className="text-xs text-green-400">Guardando...</span>}
        </div>
        <p className="text-sm text-neutral-500 mb-4">Ingresa el sitio web de tu negocio y la industria a la que perteneces.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-neutral-400 font-medium">Sitio web</label>
            <input 
              type="text" 
              className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-sm text-neutral-300 focus:outline-none focus:border-neutral-700 w-full" 
              placeholder="Ej. www.miempresa.com"
              value={formData.websiteUrl}
              onChange={(e) => handleChange("websiteUrl", e.target.value)}
              onBlur={handleBlur}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-neutral-400 font-medium">Industria o Ramo</label>
            <input 
              type="text" 
              className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-sm text-neutral-300 focus:outline-none focus:border-neutral-700 w-full" 
              placeholder="Ej. Seguros y Finanzas"
              value={formData.industry}
              onChange={(e) => handleChange("industry", e.target.value)}
              onBlur={handleBlur}
            />
          </div>
        </div>
      </div>

      {/* BOTÓN DE GUARDAR */}
      <div className="flex justify-end mt-6">
        <button 
          onClick={handleBlur}
          disabled={isSaving}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-6 rounded-lg transition-colors flex items-center gap-2"
        >
          {isSaving ? (
            <>
              <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
              Guardando...
            </>
          ) : (
            'Guardar Cambios'
          )}
        </button>
      </div>

    </div>
  )
}
