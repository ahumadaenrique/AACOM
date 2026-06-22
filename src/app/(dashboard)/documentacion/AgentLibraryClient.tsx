"use client"

import { useState, useEffect } from "react"
import { getLibraryData } from "./actions"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Folder, Download, RefreshCw } from "lucide-react"

export default function AgentLibraryClient({ agencyName }: { agencyName: string }) {
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<any>(null)

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
            
            {/* SECCION 1: DOCUMENTOS INTERNOS DE LA AGENCIA */}
            <div className="space-y-4">
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {agencyDocs.map((doc: any) => (
                            <Card key={doc.id} className="border shadow-sm hover:shadow-md transition-shadow group">
                                <CardContent className="p-5 flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 group-hover:bg-teal-50 transition-colors">
                                        <FileText className="h-6 w-6 text-slate-400 group-hover:text-teal-600 transition-colors" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-sm text-slate-800 truncate" title={doc.name}>{doc.name}</h3>
                                        <p className="text-xs text-slate-500 mt-1">{formatBytes(doc.fileSize)} &bull; {new Date(doc.createdAt).toLocaleDateString()}</p>
                                        <Button asChild variant="link" className="p-0 h-auto text-teal-600 mt-2 text-xs">
                                            <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">Ver documento</a>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* SECCION 2: PACKS GLOBALES */}
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
                                            <div className="p-4 text-center text-sm text-slate-400">Carpeta vacía</div>
                                        ) : (
                                            pack.documents?.map((doc: any) => (
                                                <div key={doc.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <FileText className="h-5 w-5 text-amber-500" />
                                                        <span className="text-sm font-medium text-slate-700">{doc.name}</span>
                                                    </div>
                                                    <Button asChild variant="outline" size="sm" className="text-xs h-8">
                                                        <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                                                            <Download className="h-3 w-3 mr-2" />
                                                            Descargar
                                                        </a>
                                                    </Button>
                                                </div>
                                            ))
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
