"use client"

import React, { useState, useEffect } from "react"
import { RefreshCw, Lock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import AdminClient from "./AdminClient"

export default function AdminPage() {
    const [isAuthorized, setIsAuthorized] = useState<boolean>(false)
    const [loadingAuth, setLoadingAuth] = useState<boolean>(true)
    const [passwordInput, setPasswordInput] = useState<string>("")
    const [passwordError, setPasswordError] = useState<string>("")

    useEffect(() => {
        const verifyAdminSession = async () => {
            try {
                const res = await fetch('/api/admin/check')
                const data = await res.json()
                if (data.isAdmin) {
                    setIsAuthorized(true)
                }
            } catch (err) {
                console.error("Error verifying admin role:", err)
            } finally {
                setLoadingAuth(false)
            }
        }
        verifyAdminSession()
    }, [])

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (passwordInput === "Saldivar0" || passwordInput === "Mike0") {
            setIsAuthorized(true)
            setPasswordError("")
        } else {
            setPasswordError("Contraseña incorrecta. Acceso denegado.")
        }
    }

    if (loadingAuth) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <RefreshCw className="h-12 w-12 text-teal-600 animate-spin" />
                <p className="text-sm text-muted-foreground font-semibold">Verificando credenciales de Administrador...</p>
            </div>
        )
    }

    if (!isAuthorized) {
        return (
            <div className="flex min-h-[70vh] items-center justify-center p-4">
                <Card className="w-full max-w-md shadow-lg border-t-4 border-t-teal-600 animate-in fade-in duration-300">
                    <CardHeader className="text-center space-y-2">
                        <div className="h-12 w-12 bg-teal-50 dark:bg-zinc-800 text-teal-600 dark:text-teal-400 rounded-full flex items-center justify-center mx-auto shadow-sm">
                            <Lock className="h-5 w-5" />
                        </div>
                        <CardTitle className="text-xl font-black">Acceso de Propietario</CardTitle>
                        <CardDescription>
                            Introduce tu contraseña de administrador para consultar el historial de cotizaciones.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handlePasswordSubmit} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Contraseña Administrador</label>
                                <Input
                                    type="password"
                                    placeholder="••••••••"
                                    value={passwordInput}
                                    onChange={(e) => setPasswordInput(e.target.value)}
                                    className="p-3 text-center tracking-widest text-lg"
                                />
                            </div>

                            {passwordError && (
                                <p className="text-xs text-red-500 font-semibold text-center mt-2 animate-bounce">
                                    {passwordError}
                                </p>
                            )}

                            <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5">
                                Verificar Contraseña
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return <AdminClient />
}
