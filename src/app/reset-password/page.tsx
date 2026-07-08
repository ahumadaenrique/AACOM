"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { resetPassword } from "../actions/passwordReset"
import { Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react"

export default function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token") || ""

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [message, setMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!token) {
      setError("Token de restablecimiento inválido o ausente.")
      return
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.")
      return
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.")
      return
    }

    setLoading(true)
    setError("")
    setMessage("")

    try {
      const res = await resetPassword(token, password)
      if (res.success) {
        setSuccess(true)
        setMessage(res.message)
      } else {
        setError(res.message || "Error al restablecer la contraseña.")
      }
    } catch (err: any) {
      setError(err.message || "Error inesperado.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md space-y-6 rounded-xl bg-white p-10 shadow-md">
        <div className="text-center">
          <h2 className="text-2xl font-extrabold text-gray-900">
            Establecer Nueva Contraseña
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Elige una nueva contraseña para ingresar a tu cuenta.
          </p>
        </div>

        {!token ? (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-sm font-semibold">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
            <span>Enlace inválido. El token de restablecimiento no está presente en la URL.</span>
          </div>
        ) : success ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-4 bg-teal-50 border border-teal-200 text-teal-800 rounded-xl text-sm font-semibold">
              <CheckCircle2 className="h-5 w-5 text-teal-600 shrink-0" />
              <span>{message}</span>
            </div>
            <div className="pt-2">
              <Link href="/login" className="flex w-full justify-center rounded-lg bg-indigo-600 px-3 py-3 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 transition-colors">
                Iniciar Sesión
              </Link>
            </div>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500">Nueva Contraseña</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    className="relative block w-full rounded-lg border-0 p-3 pr-10 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 z-20 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500">Confirmar Nueva Contraseña</label>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className="relative block w-full rounded-lg border-0 p-3 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  placeholder="Confirma tu contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center font-semibold">{error}</div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center rounded-lg bg-indigo-600 px-3 py-3 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors disabled:bg-indigo-400 disabled:cursor-not-allowed"
              >
                {loading ? "Guardando..." : "Restablecer Contraseña"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
