"use client"

import React, { useState } from "react"
import { forceUpdatePassword } from "@/app/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ShieldAlert, Loader2, LockKeyhole } from "lucide-react"

export function ForcePasswordChange({ userId, email }: { userId: string, email: string }) {
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        if (password.length < 6) {
            setError("La contraseña debe tener al menos 6 caracteres por seguridad.")
            return
        }

        if (password !== confirmPassword) {
            setError("Las contraseñas no coinciden. Intenta de nuevo.")
            return
        }

        setLoading(true)
        try {
            const res = await forceUpdatePassword(userId, password)
            if (res.success) {
                setSuccess(true)
                // Esperar un segundo y recargar la página para limpiar el bloqueo
                setTimeout(() => {
                    window.location.href = "/"
                }, 1500)
            } else {
                setError(res.message || "Error al actualizar. Intenta de nuevo.")
            }
        } catch (err: any) {
            setError(err.message || "Fallo de conexión.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[100] bg-slate-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-center mb-6">
                    <div className="h-16 w-16 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center border-4 border-white dark:border-zinc-900 shadow-sm">
                        <ShieldAlert className="h-8 w-8 text-teal-600 dark:text-teal-400" />
                    </div>
                </div>

                <Card className="border-slate-200 shadow-xl">
                    <CardHeader className="text-center pb-2">
                        <CardTitle className="text-2xl font-black text-slate-800 dark:text-zinc-100">
                            Actualización Obligatoria
                        </CardTitle>
                        <CardDescription className="text-sm">
                            Por seguridad, debes cambiar la contraseña temporal asignada por tu Administrador antes de acceder a tu panel.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4">
                        {success ? (
                            <div className="text-center py-6 space-y-4">
                                <div className="mx-auto w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                                    <LockKeyhole className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <h3 className="font-bold text-emerald-600 dark:text-emerald-400">¡Contraseña Guardada!</h3>
                                <p className="text-xs text-slate-500">Redirigiendo a tu panel...</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-1 text-center mb-4">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Usuario</span>
                                    <p className="text-sm font-semibold text-slate-700 dark:text-zinc-300">{email}</p>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-600 uppercase">Nueva Contraseña</label>
                                    <Input 
                                        type="password" 
                                        placeholder="Mínimo 6 caracteres" 
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        className="h-10 text-sm"
                                        required
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-600 uppercase">Confirmar Contraseña</label>
                                    <Input 
                                        type="password" 
                                        placeholder="Repite tu contraseña" 
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                        className="h-10 text-sm"
                                        required
                                    />
                                </div>

                                {error && (
                                    <div className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs p-3 rounded-lg border border-red-100 dark:border-red-900/50 font-medium text-center">
                                        {error}
                                    </div>
                                )}

                                <Button 
                                    type="submit" 
                                    className="w-full h-10 font-bold bg-teal-600 hover:bg-teal-700 text-white"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</>
                                    ) : "Guardar y Entrar"}
                                </Button>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
