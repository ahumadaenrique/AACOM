"use client"

import React, { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    Building2,
    Search,
    RefreshCw,
    ShieldCheck,
    Globe,
    Lock,
    FileText,
    ExternalLink,
    CheckCircle2,
    Database,
    Layers,
    Check,
    Crown,
} from "lucide-react"
import {
    getMarketCgAdminSummary,
    toggleMarketCgSaasGlobal,
    toggleMarketCgInsurerStatus,
    toggleMarketCgDocumentStatus,
    saveAgencyMarketInsurers,
} from "@/app/actions"

interface MarketCgDocItem {
    id: string
    fileKey: string
    aseguradora: string
    ramo: string
    producto: string
    year: number
    downloadUrl: string | null
    productPageUrl: string | null
    notes: string | null
    charCount: number
    chunkCount: number
    active: boolean
    isGlobalAuthorized: boolean
}

interface AgencyInsurerConfig {
    id: string
    name: string
    slug: string
    allowedInsurers: string[]
}

const DEFAULT_INSURERS = [
    "Allianz México",
    "AXA Seguros México",
    "GNP Seguros",
    "La Latinoamericana Seguros",
    "Seguros Monterrey New York Life",
    "GMX Seguros",
    "Insignia Life",
    "Plan Seguro",
    "Quálitas",
    "MetLife México",
]

export default function AdminMarketCgManager() {
    const [loading, setLoading] = useState<boolean>(true)
    const [saasGlobalEnabled, setSaasGlobalEnabled] = useState<boolean>(true)
    const [documents, setDocuments] = useState<MarketCgDocItem[]>([])
    const [agencies, setAgencies] = useState<AgencyInsurerConfig[]>([])
    const [allInsurers, setAllInsurers] = useState<string[]>(DEFAULT_INSURERS)
    const [selectedInsurer, setSelectedInsurer] = useState<string>("ALL")
    const [searchQuery, setSearchQuery] = useState<string>("")
    const [statusMsg, setStatusMsg] = useState<string>("")
    const [busyKey, setBusyKey] = useState<string | null>(null)
    const [viewMode, setViewMode] = useState<"agencies" | "catalog">("agencies")

    const loadSummary = async () => {
        setLoading(true)
        try {
            const res = await getMarketCgAdminSummary()
            if (res.success) {
                if (res.documents) setDocuments(res.documents)
                setSaasGlobalEnabled(res.saasGlobalEnabled ?? true)
                if (res.agencies) setAgencies(res.agencies)
                if (res.allInsurerNames) setAllInsurers(res.allInsurerNames)
            }
        } catch (err) {
            console.error("Error loading Market CG summary:", err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadSummary()
    }, [])

    const insurerSummaryList = useMemo(() => {
        const map = new Map<
            string,
            {
                aseguradora: string
                total: number
                activeCount: number
                globalCount: number
                chunksCount: number
            }
        >()
        for (const doc of documents) {
            const existing = map.get(doc.aseguradora) || {
                aseguradora: doc.aseguradora,
                total: 0,
                activeCount: 0,
                globalCount: 0,
                chunksCount: 0,
            }
            existing.total += 1
            if (doc.active) existing.activeCount += 1
            if (doc.isGlobalAuthorized) existing.globalCount += 1
            existing.chunksCount += doc.chunkCount || 0
            map.set(doc.aseguradora, existing)
        }
        return Array.from(map.values()).sort((a, b) => b.total - a.total)
    }, [documents])

    const filteredDocs = useMemo(() => {
        const q = searchQuery.trim().toLowerCase()
        return documents.filter((d) => {
            if (selectedInsurer !== "ALL" && d.aseguradora !== selectedInsurer) return false
            if (!q) return true
            return (
                d.producto.toLowerCase().includes(q) ||
                d.aseguradora.toLowerCase().includes(q) ||
                d.ramo.toLowerCase().includes(q) ||
                (d.notes || "").toLowerCase().includes(q) ||
                d.fileKey.toLowerCase().includes(q)
            )
        })
    }, [documents, selectedInsurer, searchQuery])

    const totalChunks = useMemo(
        () => documents.reduce((acc, d) => acc + (d.chunkCount || 0), 0),
        [documents]
    )
    const totalActiveDocs = useMemo(
        () => documents.filter((d) => d.active).length,
        [documents]
    )

    const handleToggleGlobalSaas = async () => {
        const nextVal = !saasGlobalEnabled
        setSaasGlobalEnabled(nextVal)
        setBusyKey("SAAS_GLOBAL")
        try {
            const res = await toggleMarketCgSaasGlobal(nextVal)
            if (res.success) {
                setStatusMsg(
                    nextVal
                        ? "✓ Autorización por Promotoría activada. Cada agencia verá únicamente las aseguradoras que le asignes abajo."
                        : "✓ Modo Privado activado: Solo tu promotoría principal (AACOM) puede consultar el banco de Condiciones Generales."
                )
                setTimeout(() => setStatusMsg(""), 4000)
            } else {
                setSaasGlobalEnabled(!nextVal)
            }
        } finally {
            setBusyKey(null)
        }
    }

    const handleToggleAgencyInsurer = async (agency: AgencyInsurerConfig, insurerName: string) => {
        if (agency.id === "aacom" || agency.slug === "aacom") return
        const hasIt = agency.allowedInsurers.includes(insurerName)
        const nextList = hasIt
            ? agency.allowedInsurers.filter((x) => x !== insurerName)
            : [...agency.allowedInsurers, insurerName]

        setBusyKey(`ag_${agency.id}_${insurerName}`)
        setAgencies((prev) =>
            prev.map((a) => (a.id === agency.id ? { ...a, allowedInsurers: nextList } : a))
        )

        try {
            const res = await saveAgencyMarketInsurers(agency.id, nextList)
            if (res.success) {
                setStatusMsg(
                    `✓ Promotoría «${agency.name}» actualizada (${nextList.length} aseguradoras autorizadas).`
                )
                setTimeout(() => setStatusMsg(""), 3500)
            } else {
                await loadSummary()
            }
        } finally {
            setBusyKey(null)
        }
    }

    const handleSetAllAgencyInsurers = async (agency: AgencyInsurerConfig, enableAll: boolean) => {
        if (agency.id === "aacom" || agency.slug === "aacom") return
        const nextList = enableAll ? [...allInsurers] : []

        setBusyKey(`ag_all_${agency.id}`)
        setAgencies((prev) =>
            prev.map((a) => (a.id === agency.id ? { ...a, allowedInsurers: nextList } : a))
        )

        try {
            const res = await saveAgencyMarketInsurers(agency.id, nextList)
            if (res.success) {
                setStatusMsg(
                    enableAll
                        ? `✓ Se autorizaron las ${allInsurers.length} aseguradoras para «${agency.name}».`
                        : `✓ Se retiró el acceso a aseguradoras para «${agency.name}».`
                )
                setTimeout(() => setStatusMsg(""), 3500)
            } else {
                await loadSummary()
            }
        } finally {
            setBusyKey(null)
        }
    }

    const handleToggleInsurer = async (
        aseguradora: string,
        field: "active" | "isGlobalAuthorized",
        nextVal: boolean
    ) => {
        setBusyKey(`${aseguradora}_${field}`)
        setDocuments((prev) =>
            prev.map((d) => (d.aseguradora === aseguradora ? { ...d, [field]: nextVal } : d))
        )
        try {
            const res = await toggleMarketCgInsurerStatus(aseguradora, field, nextVal)
            if (res.success) {
                setStatusMsg(`✓ ${aseguradora} actualizada correctamente.`)
                setTimeout(() => setStatusMsg(""), 3500)
            } else {
                await loadSummary()
            }
        } finally {
            setBusyKey(null)
        }
    }

    const handleToggleDoc = async (
        doc: MarketCgDocItem,
        field: "active" | "isGlobalAuthorized"
    ) => {
        const nextVal = !doc[field]
        setBusyKey(`${doc.id}_${field}`)
        setDocuments((prev) =>
            prev.map((d) => (d.id === doc.id ? { ...d, [field]: nextVal } : d))
        )
        try {
            const res = await toggleMarketCgDocumentStatus(doc.id, field, nextVal)
            if (!res.success) {
                await loadSummary()
            }
        } finally {
            setBusyKey(null)
        }
    }

    return (
        <Card className="border-2 border-indigo-200 dark:border-indigo-900 shadow-md overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-indigo-950 via-slate-900 to-teal-950 text-white p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-300/30 text-amber-200 text-[11px] font-black uppercase tracking-wider">
                            <ShieldCheck className="h-3.5 w-3.5" /> Exclusivo Super Admin
                        </div>
                        <CardTitle className="text-xl font-black flex items-center gap-2">
                            <Database className="h-5 w-5 text-teal-400" />
                            Banco Maestro de Condiciones Generales del Mercado (RAG)
                        </CardTitle>
                        <CardDescription className="text-slate-300 text-xs max-w-2xl">
                            Tú tienes acceso a las 10 aseguradoras completas, y aquí mismo puedes elegir exactamente qué aseguradoras (ej. 2 o 3 compañías) puede consultar cada promotoría en su Asistente de IA.
                        </CardDescription>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 shrink-0">
                        <div className="bg-white/10 border border-white/15 rounded-xl px-4 py-2 text-center">
                            <div className="text-lg font-black text-teal-300">
                                {totalActiveDocs} <span className="text-xs text-slate-300">/ {documents.length}</span>
                            </div>
                            <div className="text-[10px] uppercase tracking-wider text-slate-300 font-bold">
                                Pólizas Activas
                            </div>
                        </div>
                        <div className="bg-white/10 border border-white/15 rounded-xl px-4 py-2 text-center">
                            <div className="text-lg font-black text-indigo-300">
                                {totalChunks.toLocaleString("es-MX")}
                            </div>
                            <div className="text-[10px] uppercase tracking-wider text-slate-300 font-bold">
                                Fragmentos Indexados
                            </div>
                        </div>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={loadSummary}
                            disabled={loading}
                            className="font-bold text-xs h-10 rounded-xl"
                        >
                            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
                            Refrescar
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
                {/* Switch Maestro de Autorización Global SaaS */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border bg-slate-50 dark:bg-zinc-900">
                    <div className="flex items-start gap-3">
                        <div
                            className={`p-2.5 rounded-xl border ${
                                saasGlobalEnabled
                                    ? "bg-teal-100/80 border-teal-300 text-teal-800 dark:bg-teal-950 dark:text-teal-300"
                                    : "bg-amber-100/80 border-amber-300 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            }`}
                        >
                            {saasGlobalEnabled ? <Globe className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
                        </div>
                        <div>
                            <h4 className="text-sm font-black text-slate-800 dark:text-slate-100">
                                {saasGlobalEnabled
                                    ? "Acceso Multi-Promotoría Activo: Cada promotoría ve las aseguradoras asignadas abajo"
                                    : "Modo Privado AACOM: Solo tu promotoría principal puede consultar este banco de Condiciones Generales"}
                            </h4>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Si apagas este interruptor general, ninguna otra promotoría podrá consultar las Condiciones Generales sin importar lo que tenga seleccionado.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        role="switch"
                        aria-checked={saasGlobalEnabled}
                        disabled={busyKey === "SAAS_GLOBAL"}
                        onClick={handleToggleGlobalSaas}
                        className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                            saasGlobalEnabled ? "bg-teal-600" : "bg-slate-300 dark:bg-zinc-700"
                        }`}
                    >
                        <span
                            className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                                saasGlobalEnabled ? "translate-x-5" : "translate-x-0"
                            }`}
                        />
                    </button>
                </div>

                {statusMsg && (
                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 text-teal-800 dark:text-teal-200 text-xs font-bold">
                        <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0" />
                        {statusMsg}
                    </div>
                )}

                {/* Selector de Vista: 1) Asignar Aseguradoras por Promotoría vs 2) Ver Catálogo de las 604 Pólizas */}
                <div className="flex flex-wrap items-center gap-2 border-b pb-3">
                    <button
                        type="button"
                        onClick={() => setViewMode("agencies")}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                            viewMode === "agencies"
                                ? "bg-indigo-600 text-white shadow-sm"
                                : "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                        }`}
                    >
                        <Building2 className="h-4 w-4" />
                        1. Aseguradoras por Promotoría ({agencies.length} agencias)
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewMode("catalog")}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                            viewMode === "catalog"
                                ? "bg-teal-600 text-white shadow-sm"
                                : "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                        }`}
                    >
                        <Layers className="h-4 w-4" />
                        2. Catálogo de Pólizas por Aseguradora ({documents.length} PDFs)
                    </button>
                </div>

                {/* VISTA 1: MATRIZ DE ASEGURADORAS POR PROMOTORÍA */}
                {viewMode === "agencies" && (
                    <div className="space-y-4">
                        <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 rounded-xl p-3.5 text-xs text-slate-700 dark:text-slate-300">
                            <strong>¿Cómo funciona?</strong> Haz clic sobre los botones de cada aseguradora para encenderlos (verde) o apagarlos (gris) en cada promotoría. Si a una promotoría le dejas encendidas solo <strong>2 o 3 aseguradoras</strong>, el Asistente de IA de sus agentes únicamente responderá sobre esas compañías y no verá el resto.
                        </div>

                        <div className="space-y-3">
                            {agencies.map((ag) => {
                                const isMainAacom = ag.id === "aacom" || ag.slug === "aacom"
                                return (
                                    <div
                                        key={ag.id}
                                        className={`rounded-xl border p-4 transition-all ${
                                            isMainAacom
                                                ? "bg-gradient-to-r from-amber-50/60 to-teal-50/40 dark:from-amber-950/20 dark:to-teal-950/20 border-amber-300/70"
                                                : "bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800"
                                        }`}
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b">
                                            <div className="flex items-center gap-2.5">
                                                <div
                                                    className={`h-8 w-8 rounded-lg flex items-center justify-center font-black text-xs ${
                                                        isMainAacom
                                                            ? "bg-amber-500 text-white"
                                                            : "bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300"
                                                    }`}
                                                >
                                                    {isMainAacom ? (
                                                        <Crown className="h-4 w-4" />
                                                    ) : (
                                                        ag.name.slice(0, 2).toUpperCase()
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-black text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                                        {ag.name}
                                                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-500">
                                                            ID: {ag.id}
                                                        </span>
                                                    </div>
                                                    <div className="text-[11px] text-muted-foreground">
                                                        {isMainAacom
                                                            ? "Tu Promotoría Principal — Acceso Total Garantizado a las 10 Aseguradoras"
                                                            : `${ag.allowedInsurers.length} de ${allInsurers.length} aseguradoras autorizadas para sus agentes`}
                                                    </div>
                                                </div>
                                            </div>

                                            {!isMainAacom && (
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleSetAllAgencyInsurers(ag, true)}
                                                        disabled={
                                                            busyKey === `ag_all_${ag.id}` ||
                                                            ag.allowedInsurers.length === allInsurers.length
                                                        }
                                                        className="h-7 text-[11px] font-bold px-2.5"
                                                    >
                                                        Todas (10)
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleSetAllAgencyInsurers(ag, false)}
                                                        disabled={
                                                            busyKey === `ag_all_${ag.id}` ||
                                                            ag.allowedInsurers.length === 0
                                                        }
                                                        className="h-7 text-[11px] font-bold px-2.5 text-slate-500"
                                                    >
                                                        Ninguna (0)
                                                    </Button>
                                                </div>
                                            )}
                                        </div>

                                        <div className="pt-3 flex flex-wrap gap-2">
                                            {allInsurers.map((insName) => {
                                                const enabled =
                                                    isMainAacom || ag.allowedInsurers.includes(insName)
                                                return (
                                                    <button
                                                        key={insName}
                                                        type="button"
                                                        disabled={isMainAacom}
                                                        onClick={() =>
                                                            handleToggleAgencyInsurer(ag, insName)
                                                        }
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 ${
                                                            enabled
                                                                ? "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-400 text-emerald-800 dark:text-emerald-300 shadow-sm"
                                                                : "bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-400 hover:text-slate-600"
                                                        } ${
                                                            isMainAacom
                                                                ? "cursor-default"
                                                                : "cursor-pointer hover:scale-[1.02]"
                                                        }`}
                                                    >
                                                        <span
                                                            className={`h-3.5 w-3.5 rounded-full flex items-center justify-center ${
                                                                enabled
                                                                    ? "bg-emerald-600 text-white"
                                                                    : "border border-slate-300"
                                                            }`}
                                                        >
                                                            {enabled && <Check className="h-2.5 w-2.5" />}
                                                        </span>
                                                        {insName}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* VISTA 2: CATÁLOGO DE PÓLIZAS POR ASEGURADORA */}
                {viewMode === "catalog" && (
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                                    <Building2 className="h-4 w-4 text-indigo-600" />
                                    Resumen por Aseguradora ({insurerSummaryList.length} compañías)
                                </h3>
                                {selectedInsurer !== "ALL" && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setSelectedInsurer("ALL")}
                                        className="h-7 text-xs font-bold text-indigo-600"
                                    >
                                        Ver todas las aseguradoras
                                    </Button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                                {insurerSummaryList.map((ins) => {
                                    const allActive = ins.activeCount === ins.total && ins.total > 0
                                    const allGlobal = ins.globalCount === ins.total && ins.total > 0
                                    const isSelected = selectedInsurer === ins.aseguradora

                                    return (
                                        <div
                                            key={ins.aseguradora}
                                            onClick={() =>
                                                setSelectedInsurer(
                                                    isSelected ? "ALL" : ins.aseguradora
                                                )
                                            }
                                            className={`cursor-pointer rounded-xl border p-3.5 transition-all flex flex-col justify-between gap-3 ${
                                                isSelected
                                                    ? "border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/30 ring-2 ring-indigo-500/20"
                                                    : "bg-white dark:bg-zinc-900 hover:border-slate-300"
                                            }`}
                                        >
                                            <div>
                                                <div className="font-black text-xs text-slate-800 dark:text-slate-100 line-clamp-1">
                                                    {ins.aseguradora}
                                                </div>
                                                <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-2">
                                                    <span>
                                                        {ins.activeCount}/{ins.total} CGs
                                                    </span>
                                                    <span>•</span>
                                                    <span>{ins.chunksCount} bloques</span>
                                                </div>
                                            </div>

                                            <div
                                                className="pt-2 border-t flex flex-col gap-1.5"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <label className="flex items-center justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                                                    <span>Activa en IA</span>
                                                    <input
                                                        type="checkbox"
                                                        checked={allActive}
                                                        onChange={(e) =>
                                                            handleToggleInsurer(
                                                                ins.aseguradora,
                                                                "active",
                                                                e.target.checked
                                                            )
                                                        }
                                                        className="h-3.5 w-3.5 accent-teal-600 rounded cursor-pointer"
                                                    />
                                                </label>
                                                <label className="flex items-center justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                                                    <span>Disponible SaaS</span>
                                                    <input
                                                        type="checkbox"
                                                        checked={allGlobal}
                                                        onChange={(e) =>
                                                            handleToggleInsurer(
                                                                ins.aseguradora,
                                                                "isGlobalAuthorized",
                                                                e.target.checked
                                                            )
                                                        }
                                                        className="h-3.5 w-3.5 accent-indigo-600 rounded cursor-pointer"
                                                    />
                                                </label>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Buscador y Lista de Condiciones Generales */}
                        <div className="space-y-3 pt-2 border-t">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="relative flex-1 max-w-md">
                                    <Search className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
                                    <Input
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Buscar producto (ej. Alfa Medical, OptiMaxx, Planmed, Met99)..."
                                        className="pl-9 text-xs h-9"
                                    />
                                </div>
                                <div className="text-xs text-muted-foreground font-semibold">
                                    Mostrando <strong>{Math.min(filteredDocs.length, 100)}</strong> de{" "}
                                    <strong>{filteredDocs.length}</strong> condiciones generales
                                    {selectedInsurer !== "ALL" ? ` en ${selectedInsurer}` : ""}
                                </div>
                            </div>

                            <div className="border rounded-xl overflow-hidden max-h-[420px] overflow-y-auto">
                                <table className="w-full text-left border-collapse text-xs">
                                    <thead className="bg-slate-100 dark:bg-zinc-800 sticky top-0 z-10">
                                        <tr>
                                            <th className="py-2.5 px-3 font-black text-slate-600 dark:text-slate-300">
                                                Aseguradora / Ramo
                                            </th>
                                            <th className="py-2.5 px-3 font-black text-slate-600 dark:text-slate-300">
                                                Producto Vigente
                                            </th>
                                            <th className="py-2.5 px-3 font-black text-slate-600 dark:text-slate-300 text-center">
                                                Año
                                            </th>
                                            <th className="py-2.5 px-3 font-black text-slate-600 dark:text-slate-300 text-center">
                                                Fragmentos
                                            </th>
                                            <th className="py-2.5 px-3 font-black text-slate-600 dark:text-slate-300 text-center">
                                                Activa IA
                                            </th>
                                            <th className="py-2.5 px-3 font-black text-slate-600 dark:text-slate-300 text-center">
                                                Global SaaS
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {filteredDocs.slice(0, 100).map((doc) => (
                                            <tr
                                                key={doc.id}
                                                className="hover:bg-slate-50/80 dark:hover:bg-zinc-900/50"
                                            >
                                                <td className="py-2.5 px-3">
                                                    <div className="font-bold text-slate-800 dark:text-slate-200">
                                                        {doc.aseguradora}
                                                    </div>
                                                    <div className="text-[10px] text-slate-500">
                                                        {doc.ramo}
                                                    </div>
                                                </td>
                                                <td className="py-2.5 px-3">
                                                    <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                                        <FileText className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                                                        <span className="line-clamp-1">
                                                            {doc.producto}
                                                        </span>
                                                        {doc.downloadUrl && (
                                                            <a
                                                                href={doc.downloadUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                title="Abrir PDF oficial de la aseguradora"
                                                                className="text-indigo-600 hover:text-indigo-800 shrink-0"
                                                            >
                                                                <ExternalLink className="h-3.5 w-3.5" />
                                                            </a>
                                                        )}
                                                    </div>
                                                    {doc.notes && (
                                                        <div className="text-[10px] text-slate-400 line-clamp-1">
                                                            {doc.notes}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-600 dark:text-slate-400">
                                                    {doc.year}
                                                </td>
                                                <td className="py-2.5 px-3 text-center">
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300">
                                                        <Layers className="h-3 w-3 text-indigo-500" />
                                                        {doc.chunkCount}
                                                    </span>
                                                </td>
                                                <td className="py-2.5 px-3 text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={doc.active}
                                                        onChange={() =>
                                                            handleToggleDoc(doc, "active")
                                                        }
                                                        className="h-4 w-4 accent-teal-600 rounded cursor-pointer"
                                                    />
                                                </td>
                                                <td className="py-2.5 px-3 text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={doc.isGlobalAuthorized}
                                                        onChange={() =>
                                                            handleToggleDoc(
                                                                doc,
                                                                "isGlobalAuthorized"
                                                            )
                                                        }
                                                        className="h-4 w-4 accent-indigo-600 rounded cursor-pointer"
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredDocs.length === 0 && !loading && (
                                            <tr>
                                                <td
                                                    colSpan={6}
                                                    className="py-8 text-center text-slate-400 font-medium"
                                                >
                                                    No se encontraron condiciones generales con ese filtro.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
