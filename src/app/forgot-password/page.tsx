"use client"

import { useState } from "react"
import Link from "next/link"
import { requestPasswordReset } from "../actions/passwordReset"
import { Mail, CheckCircle2, ArrowLeft } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setMessage("")

    try {
      const res = await requestPasswordReset(email)
      if (res.success) {
        setSuccess(true)
        setMessage(res.message)
      } else {
        setError(res.message || "Error al solicitar enlace de recuperación.")
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
            Recuperar Contraseña
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Ingresa tu correo y te enviaremos un enlace de recuperación.
          </p>
        </div>

        {success ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-4 bg-teal-50 border border-teal-200 text-teal-800 rounded-xl text-sm font-semibold leading-relaxed">
              <CheckCircle2 className="h-5 w-5 text-teal-600 shrink-0" />
              <span>{message}</span>
            </div>
            <div className="pt-2 text-center">
              <Link href="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-500 transition-colors">
                <ArrowLeft className="h-4 w-4" /> Volver al Inicio de Sesión
              </Link>
            </div>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500">Correo Electrónico</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  className="relative block w-full rounded-lg border-0 p-3 pl-10 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  placeholder="ejemplo@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Mail className="absolute left-3 top-2.5 h-4.5 w-4.5 text-gray-400" />
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center font-semibold">{error}</div>
            )}

            <div className="flex flex-col gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center rounded-lg bg-indigo-600 px-3 py-3 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors disabled:bg-indigo-400 disabled:cursor-not-allowed"
              >
                {loading ? "Enviando..." : "Enviar Enlace de Recuperación"}
              </button>

              <Link href="/login" className="flex items-center justify-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-500 transition-colors pt-2">
                <ArrowLeft className="h-4 w-4" /> Volver al Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
