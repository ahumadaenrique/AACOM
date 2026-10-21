"use client"

import { useState, useEffect, useMemo } from "react"
import { getLibraryData } from "./actions"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    FileText,
    Folder,
    Download,
    RefreshCw,
    FolderOpen,
    ChevronRight,
    BookOpen,
    Search,
    Building2,
    ExternalLink,
} from "lucide-react"

const CATEGORIES = ["Comercial", "Marketing", "Formatos", "Condiciones generales", "Otros"]

export default function AgentLibraryClient({ agencyName }: { agencyName: string }) {
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<any>(null)
    const [selectedInsurer, setSelectedInsurer] = useState<string>("ALL")
    const [selectedRamo, setSelectedRamo] = useState<string>("ALL")
    const [cgSearch, setCgSearch] = useState<string>("")

    useEffect(() => {
        const loadData = async () => {
            const res = await getLibraryData()
            if (res.success) {
                setData(res)
            }
            setLoading(false)
        }
        loadData()
    }, [])

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    const marketCgDocs: any[] = data?.marketCgDocs || []

    const availableInsurers = useMemo(() => {
        const map = new Map<string, number>()
        for (const doc of marketCgDocs) {
            map.set(doc.aseguradora, (map.get(doc.aseguradora) || 0) + 1)
        }
        return Array.from(map.entries())
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => a.name.localeCompare(b.name))
    }, [marketCgDocs])

    const availableRamos = useMemo(() => {
        const set = new Set<string>()
        for (const doc of marketCgDocs) {
            if (selectedInsurer === "ALL" || doc.aseguradora === selectedInsurer) {
                if (doc.ramo) set.add(doc.ramo)
            }
        }
        return Array.from(set).sort((a, b) => a.localeCompare(b))
    }, [marketCgDocs, selectedInsurer])

    const filteredCgDocs = useMemo(() => {
        const q = cgSearch.trim().toLowerCase()
        return marketCgDocs.filter((doc) => {
            if (selectedInsurer !== "ALL" && doc.aseguradora !== selectedInsurer) return false
            if (selectedRamo !== "ALL" && doc.ramo !== selectedRamo) return false
            if (q) {
                const hay = `${doc.aseguradora} ${doc.ramo} ${doc.producto} ${doc.year || ""} ${doc.notes || ""}`.toLowerCase()
                if (!hay.includes(q)) return false
            }
            return true
        })
    }, [marketCgDocs, selectedInsurer, selectedRamo, cgSearch])

    const groupedByInsurer = useMemo(() => {
        const map = new Map<string, any[]>()
        for (const doc of filteredCgDocs) {
            if (!map.has(doc.aseguradora)) map.set(doc.aseguradora, [])
            map.get(doc.aseguradora)!.push(doc)
        }
        return Array.from(map.entries())
    }, [filteredCgDocs])

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-slate-500">
                <RefreshCw className="h-8 w-8 animate-spin mb-4 text-teal-600" />
                <p>Cargando biblioteca...</p>
            </div>
        )
    }

    // Filtrar packs globales para que solo vea los que su admin prendió
    const enabledPacks = data?.allPacks?.filter((p: any) => data?.enabledPacksList?.includes(p.id)) || []
    const agencyDocs = data?.agencyDocs || []

    return (
        <div className="space-y-12 animate-in fade-in duration-500">
            
            {/* SECCION 1: CONDICIONES GENERALES OFICIALES POR ASEGURADORA (AUTORIZADAS PARA LA PROMOTORIA) */}
            <div className="space-y-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="h-5 w-5 text-indigo-700" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h2 className="text-xl font-bold text-slate-800">Condiciones Generales de Aseguradoras</h2>
                                <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-indigo-200 font-bold">
                                    {marketCgDocs.length} pólizas vigentes
                                </Badge>
                            </div>
                            <p className="text-sm text-slate-500">
                                Catálogo oficial de Condiciones Generales (CNSF) de las compañías habilitadas para {agencyName}.
                            </p>
                        </div>
                    </div>

                    {marketCgDocs.length > 0 && (
                        <div className="relative w-full md:w-80">
                            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <Input
                                value={cgSearch}
                                onChange={(e) => setCgSearch(e.target.value)}
                                placeholder="Buscar producto, cobertura o registro..."
                                className="pl-9 h-9 bg-white text-sm"
                            />
                        </div>
                    )}
                </div>

                {marketCgDocs.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed">
                        <p className="text-sm text-slate-500 italic">
                            No hay aseguradoras habilitadas en el Banco de Condiciones Generales para tu promotoría en este momento.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Filtros por Aseguradora */}
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedInsurer("ALL")
                                    setSelectedRamo("ALL")
                                }}
                                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                                    selectedInsurer === "ALL"
                                        ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                        : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-700"
                                }`}
                            >
                                Todas las Aseguradoras ({marketCgDocs.length})
                            </button>
                            {availableInsurers.map((ins) => (
                                <button
                                    key={ins.name}
                                    type="button"
                                    onClick={() => {
                                        setSelectedInsurer(ins.name)
                                        setSelectedRamo("ALL")
                                    }}
                                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border flex items-center gap-1.5 ${
                                        selectedInsurer === ins.name
                                            ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                            : "bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:text-indigo-700"
                                    }`}
                                >
                                    <Building2 className="h-3 w-3 opacity-75" />
                                    {ins.name}
                                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                                        selectedInsurer === ins.name ? "bg-indigo-500 text-white" : "bg-slate-100 text-slate-600"
                                    }`}>
                                        {ins.count}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* Filtro secundario por Ramo */}
                        {availableRamos.length > 1 && (
                            <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1">Ramo:</span>
                                <button
                                    type="button"
                                    onClick={() => setSelectedRamo("ALL")}
                                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                                        selectedRamo === "ALL"
                                            ? "bg-slate-800 text-white"
                                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                    }`}
                                >
                                    Todos
                                </button>
                                {availableRamos.map((ramo) => (
                                    <button
                                        key={ramo}
                                        type="button"
                                        onClick={() => setSelectedRamo(ramo)}
                                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                                            selectedRamo === ramo
                                                ? "bg-slate-800 text-white"
                                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                        }`}
                                    >
                                        {ramo}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Listado agrupado por Aseguradora */}
                        {groupedByInsurer.length === 0 ? (
                            <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed">
                                <p className="text-sm text-slate-500">No se encontraron pólizas que coincidan con tu búsqueda.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {groupedByInsurer.map(([insurerName, docs]) => (
                                    <Card key={insurerName} className="border shadow-sm overflow-hidden">
                                        <details
                                            className="group"
                                            open={selectedInsurer !== "ALL" || cgSearch.trim().length > 0 || groupedByInsurer.length <= 2}
                                        >
                                            <summary className="bg-slate-50/80 hover:bg-slate-100/70 transition-colors px-5 py-3.5 cursor-pointer list-none select-none flex items-center justify-between border-b">
                                                <div className="flex items-center gap-3">
                                                    <ChevronRight className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-90" />
                                                    <Building2 className="h-4 w-4 text-indigo-600" />
                                                    <span className="font-bold text-slate-800 text-sm md:text-base">{insurerName}</span>
                                                    <Badge variant="outline" className="text-xs bg-white">
                                                        {docs.length} {docs.length === 1 ? "documento" : "documentos"}
                                                    </Badge>
                                                </div>
                                                <span className="text-xs text-slate-400 hidden sm:inline">
                                                    Clic para desplegar / contraer
                                                </span>
                                            </summary>
                                            <CardContent className="p-0">
                                                <div className="divide-y max-h-[460px] overflow-y-auto">
                                                    {docs.map((doc: any) => {
                                                        const pdfUrl = doc.downloadUrl || doc.productPageUrl
                                                        return (
                                                            <div
                                                                key={doc.id}
                                                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-5 py-3 hover:bg-slate-50/80 transition-colors"
                                                            >
                                                                <div className="min-w-0 flex-1">
                                                                    <div className="flex items-center gap-2 flex-wrap">
                                                                        <span className="font-semibold text-sm text-slate-800">
                                                                            {doc.producto}
                                                                        </span>
                                                                        {doc.ramo && (
                                                                            <Badge variant="secondary" className="text-[10px] bg-slate-100 text-slate-600">
                                                                                {doc.ramo}
                                                                            </Badge>
                                                                        )}
                                                                        {doc.year && (
                                                                            <Badge variant="outline" className="text-[10px] text-indigo-600 border-indigo-200 bg-indigo-50/40">
                                                                                {doc.year}
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                    {doc.notes && (
                                                                        <p className="text-xs text-slate-500 line-clamp-1 mt-0.5" title={doc.notes}>
                                                                            {doc.notes}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                                                                    {pdfUrl ? (
                                                                        <Button
                                                                            asChild
                                                                            variant="outline"
                                                                            size="sm"
                                                                            className="h-8 text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                                                                        >
                                                                            <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                                                                                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                                                                                Ver / Descargar PDF
                                                                            </a>
                                                                        </Button>
                                                                    ) : (
                                                                        <span className="text-xs text-slate-400 italic">Indexado en Asistente IA</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </CardContent>
                                        </details>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* SECCION 2: DOCUMENTOS INTERNOS DE LA AGENCIA */}
            <div className="space-y-4 pt-6 border-t">
                <div className="flex items-center gap-2 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-teal-700" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Documentos de {agencyName}</h2>
                        <p className="text-sm text-slate-500">Políticas internas, guías y formatos exclusivos de tu promotoría.</p>
                    </div>
                </div>

                {agencyDocs.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed">
                        <p className="text-sm text-slate-500 italic">No hay documentos internos disponibles en este momento.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {CATEGORIES.map(cat => {
                            const docsInCat = agencyDocs.filter((d: any) => (d.category || "Otros") === cat)
                            if (docsInCat.length === 0) return null;
                            
                            return (
                                <details key={cat} className="group">
                                    <summary className="text-sm font-bold text-slate-700 flex items-center gap-2 border-b pb-2 cursor-pointer list-none select-none hover:text-teal-600 transition-colors">
                                        <ChevronRight className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-90" />
                                        <FolderOpen className="h-4 w-4" /> {cat}
                                    </summary>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-3">
                                        {docsInCat.map((doc: any) => (
                                            <Card key={doc.id} className="border shadow-sm hover:shadow-md transition-shadow group/card">
                                                <CardContent className="p-5 flex items-start gap-4">
                                                    <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 group-hover/card:bg-teal-50 transition-colors">
                                                        <FileText className="h-6 w-6 text-slate-400 group-hover/card:text-teal-600 transition-colors" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-bold text-sm text-slate-800 line-clamp-2" title={doc.name}>{doc.name}</h3>
                                                        <p className="text-xs text-slate-500 mt-1">{formatBytes(doc.fileSize)} &bull; {new Date(doc.createdAt).toLocaleDateString()}</p>
                                                        <Button asChild variant="link" className="p-0 h-auto text-teal-600 mt-2 text-xs">
                                                            <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">Ver documento</a>
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </details>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* SECCION 3: PACKS GLOBALES */}
            <div className="space-y-4 pt-6 border-t">
                <div className="flex items-center gap-2 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                        <Folder className="h-5 w-5 text-amber-700" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Catálogos Oficiales</h2>
                        <p className="text-sm text-slate-500">Material oficial de aseguradoras habilitado por tu promotor.</p>
                    </div>
                </div>

                {enabledPacks.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed">
                        <p className="text-sm text-slate-500 italic">No hay catálogos oficiales habilitados en este momento.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {enabledPacks.map((pack: any) => (
                            <Card key={pack.id} className="border shadow-sm overflow-hidden">
                                <CardHeader className="bg-slate-50/50 border-b py-4">
                                    <CardTitle className="text-lg text-slate-800">{pack.name}</CardTitle>
                                    {pack.description && <CardDescription>{pack.description}</CardDescription>}
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="divide-y">
                                        {pack.documents?.length === 0 ? (
                                            <div className="p-4 text-center text-sm text-slate-400">Pack vacío</div>
                                        ) : (
                                            <div className="divide-y">
                                                {CATEGORIES.map(cat => {
                                                    const docsInCat = pack.documents?.filter((d: any) => (d.category || "Otros") === cat) || [];
                                                    if (docsInCat.length === 0) return null;
                                                    
                                                    return (
                                                        <details key={cat} className="pt-2 pb-1 group">
                                                            <summary className="px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2 cursor-pointer list-none select-none hover:bg-slate-50 transition-colors">
                                                                <ChevronRight className="h-3 w-3 text-slate-400 transition-transform group-open:rotate-90" />
                                                                <FolderOpen className="h-3 w-3" /> {cat}
                                                            </summary>
                                                            <div className="space-y-1">
                                                                {docsInCat.map((doc: any) => (
                                                                    <div key={doc.id} className="flex items-center justify-between p-2 pl-8 hover:bg-slate-50 transition-colors">
                                                                        <div className="flex items-center gap-3">
                                                                            <FileText className="h-4 w-4 text-amber-500" />
                                                                            <span className="text-sm font-medium text-slate-700">{doc.name}</span>
                                                                        </div>
                                                                        <Button asChild variant="outline" size="sm" className="text-xs h-8">
                                                                            <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                                                                                <Download className="h-3 w-3 mr-2" />
                                                                                Descargar
                                                                            </a>
                                                                        </Button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </details>
                                                    )
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

        </div>
    )
}
