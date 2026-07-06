"use client"

import { useState } from "react"
import { createKnowledgeAsset } from "./actions"
import { Search, Image as ImageIcon, FileText, Globe, AlignLeft, LayoutGrid, List, Plus, X, Upload } from "lucide-react"

export default function KnowledgeGrid({ initialAssets }: { initialAssets: any[] }) {
  const [assets, setAssets] = useState(initialAssets)
  const [filter, setFilter] = useState("ALL")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [viewMode, setViewMode] = useState("grid") // grid or list
  const [uploading, setUploading] = useState(false)

  // Form State
  const [type, setType] = useState("IMAGE")
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [url, setUrl] = useState("")
  const [file, setFile] = useState<File | null>(null)

  const filteredAssets = filter === "ALL" ? assets : assets.filter(a => a.type === filter)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUploading(true)

    const formData = new FormData()
    formData.append("type", type)
    formData.append("title", title)
    if (content) formData.append("content", content)
    if (url) formData.append("url", url)
    if (file) formData.append("file", file)

    await createKnowledgeAsset(formData)
    
    // Optimistic UI update (requires real reload to get image URL if file uploaded, but fine for demo)
    setAssets([{
      id: Math.random().toString(),
      type,
      title,
      content,
      url: file ? URL.createObjectURL(file) : url,
      createdAt: new Date()
    }, ...assets])

    setIsModalOpen(false)
    setUploading(false)
    setTitle("")
    setContent("")
    setUrl("")
    setFile(null)
  }

  const renderCard = (asset: any) => {
    return (
      <div key={asset.id} className="bg-[#1A1A1A] border border-neutral-800 rounded-xl overflow-hidden hover:border-neutral-700 transition-colors group flex flex-col">
        {asset.type === 'IMAGE' && asset.url && (
          <div className="w-full aspect-video bg-neutral-900 relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={asset.url} alt={asset.title} className="w-full h-full object-cover" />
          </div>
        )}
        
        <div className="p-4 flex-1 flex flex-col">
          {asset.type === 'MEMORY' && (
            <p className="text-sm text-neutral-300 leading-relaxed mb-4 line-clamp-4 flex-1">
              {asset.content}
            </p>
          )}

          <div className="mt-auto">
            <h4 className="font-medium text-white text-sm mb-2 truncate">{asset.title}</h4>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-400 text-black text-[10px] font-bold rounded">
                Publicar
              </span>
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  <div className="w-5 h-5 rounded-full bg-emerald-500 border border-[#1A1A1A] z-10"></div>
                  <div className="w-5 h-5 rounded-full bg-yellow-500 border border-[#1A1A1A] z-0 flex items-center justify-center text-[8px] font-bold text-black">+4</div>
                </div>
                <span className="text-[10px] text-neutral-500">
                  {new Date(asset.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[1400px] mx-auto py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Conocimientos</h1>
        <p className="text-neutral-500">Gestiona las memorias y archivos multimedia que tus Empleados IA utilizan para trabajar de manera más inteligente y rápida</p>
      </div>

      {/* Filters & Actions */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2 text-neutral-500" />
            <input 
              type="text" 
              placeholder="Buscar" 
              className="bg-transparent border border-neutral-800 rounded-full pl-9 pr-4 py-1.5 text-sm text-white focus:outline-none focus:border-neutral-600"
            />
          </div>
          <button 
            onClick={() => setFilter("ALL")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === "ALL" ? "bg-emerald-500 text-black" : "border border-neutral-800 text-neutral-400 hover:text-white"}`}
          >
            Todo
          </button>
          <button 
            onClick={() => setFilter("MEMORY")}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === "MEMORY" ? "bg-emerald-500 text-black" : "border border-neutral-800 text-neutral-400 hover:text-white"}`}
          >
            <AlignLeft className="w-4 h-4" /> Memorias
          </button>
          <button 
            onClick={() => setFilter("IMAGE")}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === "IMAGE" ? "bg-emerald-500 text-black" : "border border-neutral-800 text-neutral-400 hover:text-white"}`}
          >
            <ImageIcon className="w-4 h-4" /> Imágenes
          </button>
          <button 
            onClick={() => setFilter("WEB_PAGE")}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === "WEB_PAGE" ? "bg-emerald-500 text-black" : "border border-neutral-800 text-neutral-400 hover:text-white"}`}
          >
            <Globe className="w-4 h-4" /> Páginas web
          </button>
          <button 
            onClick={() => setFilter("DOCUMENT")}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === "DOCUMENT" ? "bg-emerald-500 text-black" : "border border-neutral-800 text-neutral-400 hover:text-white"}`}
          >
            <FileText className="w-4 h-4" /> Documentos
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-lg p-0.5">
            <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded-md ${viewMode === "grid" ? "bg-neutral-800 text-white" : "text-neutral-500"}`}>
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode("list")} className={`p-1.5 rounded-md ${viewMode === "list" ? "bg-neutral-800 text-white" : "text-neutral-500"}`}>
              <List className="w-4 h-4" />
            </button>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-black px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" /> Agregar conocimiento
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className={`grid gap-6 ${viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"}`}>
        {filteredAssets.map(renderCard)}
        {filteredAssets.length === 0 && (
          <div className="col-span-full py-12 text-center text-neutral-500">
            No hay conocimientos guardados de este tipo.
          </div>
        )}
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1A1A1A] border border-neutral-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-neutral-800">
              <h2 className="text-lg font-semibold text-white">Agregar conocimiento</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-neutral-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1">Tipo de conocimiento</label>
                <select 
                  value={type} 
                  onChange={(e) => setType(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-neutral-700"
                >
                  <option value="IMAGE">Imagen</option>
                  <option value="MEMORY">Memoria (Texto)</option>
                  <option value="WEB_PAGE">Página Web (Link)</option>
                  <option value="DOCUMENT">Documento (PDF/Docx)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1">Título</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej. Logo principal, FAQs internas..."
                  required
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-neutral-700"
                />
              </div>

              {type === 'MEMORY' && (
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">Contenido</label>
                  <textarea 
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    required
                    rows={4}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-neutral-700"
                  />
                </div>
              )}

              {type === 'WEB_PAGE' && (
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">URL</label>
                  <input 
                    type="url" 
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    required
                    placeholder="https://"
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-neutral-700"
                  />
                </div>
              )}

              {(type === 'IMAGE' || type === 'DOCUMENT') && (
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">Archivo</label>
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-neutral-800 border-dashed rounded-lg cursor-pointer bg-neutral-900/50 hover:bg-neutral-900">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-6 h-6 text-neutral-500 mb-2" />
                      <p className="text-sm text-neutral-400">
                        {file ? file.name : <><span className="font-semibold text-white">Haz click para subir</span> o arrastra y suelta</>}
                      </p>
                    </div>
                    <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} required />
                  </label>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-neutral-400 hover:text-white">
                  Cancelar
                </button>
                <button disabled={uploading} type="submit" className="bg-yellow-400 hover:bg-yellow-500 text-black px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50">
                  {uploading ? "Subiendo..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
