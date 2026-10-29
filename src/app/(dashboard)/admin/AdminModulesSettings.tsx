"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ShieldCheck, RefreshCw, CheckCircle2, Eye, EyeOff, LayoutGrid, Wrench, Bot, RotateCcw } from "lucide-react"
import {
    AGENCY_MODULE_DEFINITIONS,
    DEFAULT_AGENCY_MODULES_CONFIG,
    type AgencyModuleKey,
    type AgencyModulesConfig,
} from "@/lib/agencyModules"
import { getAgencyModulesConfig, saveAgencyModulesConfig } from "@/app/actions"

export default function AdminModulesSettings() {
    const router = useRouter()
    const [config, setConfig] = useState<AgencyModulesConfig>({ ...DEFAULT_AGENCY_MODULES_CONFIG })
    const [loading, setLoading] = useState<boolean>(true)
    const [savingKey, setSavingKey] = useState<string | null>(null)
    const [statusMsg, setStatusMsg] = useState<string>("")
    const [allowProyecto200, setAllowProyecto200] = useState<boolean>(false)
    const [allowCorporateEmail, setAllowCorporateEmail] = useState<boolean>(false)

    const loadConfig = async () => {
        setLoading(true)
        try {
            const res = await getAgencyModulesConfig()
            if (res.success && res.config) {
                setConfig(res.config)
                if (typeof (res as any).allowProyecto200Module === "boolean") setAllowProyecto200((res as any).allowProyecto200Module)
                if (typeof (res as any).allowCorporateEmailModule === "boolean") setAllowCorporateEmail((res as any).allowCorporateEmailModule)
            }
        } catch (err) {
            console.error("Error loading agency modules config:", err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadConfig()
    }, [])

    const handleToggleModule = async (key: AgencyModuleKey) => {
        const nextValue = !config[key]
        const previousConfig = { ...config }

        // Optimistic update
        setConfig((prev) => ({ ...prev, [key]: nextValue }))
        setSavingKey(key)
        setStatusMsg("Guardando cambios en tu promotoría...")

        try {
            const res = await saveAgencyModulesConfig({ [key]: nextValue })
            if (res.success && res.config) {
                setConfig(res.config)
                if (typeof (res as any).allowProyecto200Module === "boolean") setAllowProyecto200((res as any).allowProyecto200Module)
                setStatusMsg("✓ Configuración actualizada. El menú de tu promotoría se actualizó al instante.")
                router.refresh()
                setTimeout(() => setStatusMsg(""), 4000)
            } else {
                setConfig(previousConfig)
                setStatusMsg(res.message || "Error al guardar la configuración")
            }
        } catch (err: any) {
            setConfig(previousConfig)
            setStatusMsg(`Error de red: ${err.message || "No se pudo guardar"}`)
        } finally {
            setSavingKey(null)
        }
    }

    const handleEnableAll = async () => {
        const previousConfig = { ...config }
        setConfig({ ...DEFAULT_AGENCY_MODULES_CONFIG })
        setSavingKey("ALL")
        setStatusMsg("Activando todos los módulos...")

        try {
            const res = await saveAgencyModulesConfig({ ...DEFAULT_AGENCY_MODULES_CONFIG })
            if (res.success && res.config) {
                setConfig(res.config)
                if (typeof (res as any).allowProyecto200Module === "boolean") setAllowProyecto200((res as any).allowProyecto200Module)
                setStatusMsg("✓ Todos los módulos y menús están activos y visibles.")
                router.refresh()
                setTimeout(() => setStatusMsg(""), 4000)
            } else {
                setConfig(previousConfig)
                setStatusMsg(res.message || "Error al restaurar módulos")
            }
        } catch (err: any) {
            setConfig(previousConfig)
            setStatusMsg(`Error: ${err.message || "Fallo de red"}`)
        } finally {
            setSavingKey(null)
        }
    }

    const groups: {
        id: "main" | "tools" | "ai"
        title: string
        subtitle: string
        icon: React.ReactNode
        accentClass: string
    }[] = [
        {
            id: "main",
            title: "1. Barra de Navegación Principal",
            subtitle: "Módulos que aparecen directamente en la barra superior y menú móvil principal de tus agentes.",
            icon: <LayoutGrid className="h-5 w-5 text-teal-600" />,
            accentClass: "from-teal-50/70 to-emerald-50/30 dark:from-teal-950/20 dark:to-emerald-950/10",
        },
        {
            id: "tools",
            title: "2. Menú Desplegable: Herramientas",
            subtitle: "Sub-módulos dentro del menú «Herramientas». Si apagas todos, el menú completo de Herramientas se ocultará automáticamente.",
            icon: <Wrench className="h-5 w-5 text-indigo-600" />,
            accentClass: "from-indigo-50/70 to-blue-50/30 dark:from-indigo-950/20 dark:to-blue-950/10",
        },
        {
            id: "ai",
            title: "3. Menú Desplegable: Inteligencia Artificial Avanzada",
            subtitle: "Asistente conversacional de IA para tu promotoría.",
            icon: <Bot className="h-5 w-5 text-pink-600" />,
            accentClass: "from-pink-50/70 to-rose-50/30 dark:from-pink-950/20 dark:to-rose-950/10",
        },
    ]

    const visibleDefinitions = AGENCY_MODULE_DEFINITIONS.filter(
        (m) =>
            (m.key !== "proyecto_200" || allowProyecto200) &&
            (m.key !== "correo_corporativo" || allowCorporateEmail)
    )
    const totalModules = visibleDefinitions.length
    const activeModulesCount = visibleDefinitions.filter((m) => config[m.key]).length


    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Banner Informativo Superior */}
            <Card className="border shadow-sm bg-gradient-to-r from-slate-900 via-slate-800 to-teal-900 text-white overflow-hidden">
                <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5 max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-200 text-xs font-bold">
                            <ShieldCheck className="h-3.5 w-3.5" /> Control Exclusivo de tu Promotoría
                        </div>
                        <h2 className="text-xl font-black tracking-tight">
                            Interruptores de Módulos y Menús Visibles
                        </h2>
                        <p className="text-xs text-slate-300 leading-relaxed">
                            Enciende o apaga los módulos que deseas utilizar en tu promotoría. Al apagar un módulo, se ocultará inmediatamente del menú de tus agentes y se bloqueará su acceso directo por enlace, <strong>sin borrar ningún dato histórico</strong>. El menú de <strong>Admin</strong> permanece siempre activo para que nunca pierdas el control.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                        <div className="bg-white/10 backdrop-blur px-4 py-2.5 rounded-xl border border-white/15 text-center">
                            <div className="text-2xl font-black text-teal-300">
                                {activeModulesCount} <span className="text-sm font-medium text-slate-300">/ {totalModules}</span>
                            </div>
                            <div className="text-[10px] uppercase tracking-wider text-slate-300 font-bold">
                                Módulos Activos
                            </div>
                        </div>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={handleEnableAll}
                            disabled={loading || savingKey !== null || activeModulesCount === totalModules}
                            className="font-bold text-xs h-11 px-4 rounded-xl shadow-sm"
                        >
                            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                            Encender Todos
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Mensaje de estado en vivo */}
            {statusMsg && (
                <div className="flex items-center justify-between gap-2 px-4 py-3 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-200 text-xs font-bold shadow-sm">
                    <span className="flex items-center gap-2">
                        {savingKey ? (
                            <RefreshCw className="h-4 w-4 animate-spin text-teal-600" />
                        ) : (
                            <CheckCircle2 className="h-4 w-4 text-teal-600" />
                        )}
                        {statusMsg}
                    </span>
                </div>
            )}

            {loading ? (
                <div className="p-12 text-center bg-white dark:bg-zinc-900 rounded-2xl border shadow-sm">
                    <RefreshCw className="h-7 w-7 animate-spin text-teal-600 mx-auto mb-3" />
                    <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                        Cargando configuración de módulos de tu promotoría...
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    {groups.map((group) => {
                        const items = visibleDefinitions.filter((m) => m.group === group.id)
                        return (
                            <Card key={group.id} className="border shadow-sm overflow-hidden">
                                <CardHeader className={`py-4 border-b bg-gradient-to-r ${group.accentClass}`}>
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2.5">
                                            <div className="p-2 rounded-lg bg-white dark:bg-zinc-900 shadow-sm border">
                                                {group.icon}
                                            </div>
                                            <div>
                                                <CardTitle className="text-base font-black text-slate-800 dark:text-slate-100">
                                                    {group.title}
                                                </CardTitle>
                                                <CardDescription className="text-xs mt-0.5">
                                                    {group.subtitle}
                                                </CardDescription>
                                            </div>
                                        </div>
                                        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-white/80 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 border">
                                            {items.filter((i) => config[i.key]).length} de {items.length} activos
                                        </span>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4 md:p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {items.map((mod) => {
                                            const isEnabled = config[mod.key]
                                            const isSavingThis = savingKey === mod.key || savingKey === "ALL"

                                            return (
                                                <div
                                                    key={mod.key}
                                                    onClick={() => !isSavingThis && handleToggleModule(mod.key)}
                                                    className={`group cursor-pointer rounded-xl border p-4 transition-all flex items-start justify-between gap-4 ${
                                                        isEnabled
                                                            ? "bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 hover:border-teal-400 shadow-sm"
                                                            : "bg-slate-50/80 dark:bg-zinc-950/60 border-dashed border-slate-200 dark:border-zinc-800 opacity-75 hover:opacity-100"
                                                    }`}
                                                >
                                                    <div className="flex items-start gap-3 min-w-0">
                                                        <div
                                                            className={`h-10 w-10 rounded-xl flex items-center justify-center text-lg shrink-0 border transition-colors ${
                                                                isEnabled
                                                                    ? "bg-teal-50/70 dark:bg-teal-950/40 border-teal-200 dark:border-teal-900"
                                                                    : "bg-slate-100 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 grayscale"
                                                            }`}
                                                        >
                                                            {mod.emoji}
                                                        </div>
                                                        <div className="space-y-1 min-w-0">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
                                                                    {mod.label}
                                                                </span>
                                                                {isEnabled ? (
                                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                                                                        <Eye className="h-2.5 w-2.5" /> Visible
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-slate-200 text-slate-600 dark:bg-zinc-800 dark:text-slate-400">
                                                                        <EyeOff className="h-2.5 w-2.5" /> Oculto
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-muted-foreground leading-relaxed">
                                                                {mod.description}
                                                            </p>
                                                            <span className="inline-block text-[10px] font-mono text-slate-400">
                                                                Ruta: {mod.pathPrefix}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Switch iOS Style */}
                                                    <button
                                                        type="button"
                                                        role="switch"
                                                        aria-checked={isEnabled}
                                                        disabled={isSavingThis}
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            if (!isSavingThis) handleToggleModule(mod.key)
                                                        }}
                                                        className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none mt-1 ${
                                                            isEnabled
                                                                ? "bg-teal-600"
                                                                : "bg-slate-300 dark:bg-zinc-700"
                                                        } ${isSavingThis ? "opacity-50 cursor-wait" : ""}`}
                                                    >
                                                        <span className="sr-only">Cambiar visibilidad de {mod.label}</span>
                                                        <span
                                                            className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                                                isEnabled ? "translate-x-5" : "translate-x-0"
                                                            }`}
                                                        />
                                                    </button>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
