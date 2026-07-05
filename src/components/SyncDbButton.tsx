"use client"
import { useState } from "react"
import { syncDatabaseSchemaAction } from "@/app/workspace/actions"
import { Loader2, RefreshCw } from "lucide-react"

export function SyncDbButton() {
  const [loading, setLoading] = useState(false)

  const handleSync = async () => {
    setLoading(true)
    const res = await syncDatabaseSchemaAction() as any
    if (res.success) {
      alert("¡Base de datos restaurada con éxito! La página se recargará ahora.")
      window.location.reload()
    } else {
      alert("Error al restaurar base de datos: " + res.error)
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleSync}
      disabled={loading}
      className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl transition-all flex items-center gap-2 shadow-lg hover:shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <RefreshCw className="w-5 h-5" />
      )}
      {loading ? "Restaurando..." : "Restaurar Estructura y Agentes"}
    </button>
  )
}
