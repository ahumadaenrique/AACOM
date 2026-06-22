"use client"

import { useState, useEffect, useRef } from "react"
import { 
    getLibraryData, 
    createDocumentPack, 
    deleteDocumentPack, 
    uploadGlobalDocument, 
    deleteGlobalDocument,
    toggleAgencyPack,
    uploadAgencyDocument,
    deleteAgencyDocument
} from "../documentacion/actions"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { RefreshCw, Trash2, Upload, FileText, Plus, Folder, AlertCircle } from "lucide-react"

export default function BibliotecaAdmin() {
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<any>(null)
    const [uploadingPackId, setUploadingPackId] = useState<string | null>(null)
    const [uploadingAgency, setUploadingAgency] = useState(false)
    
    // Formularios
    const [newPackName, setNewPackName] = useState("")
    const [newPackDesc, setNewPackDesc] = useState("")

    const fileInputRef = useRef<{ [key: string]: HTMLInputElement | null }>({})
    const agencyFileRef = useRef<HTMLInputElement | null>(null)

    const loadData = async () => {
        setLoading(true)
        const res = await getLibraryData()
        if (res.success) {
            setData(res)
        }
        setLoading(false)
    }

    useEffect(() => {
        loadData()
    }, [])

    const handleCreatePack = async () => {
        if (!newPackName.trim()) return
        const res = await createDocumentPack(newPackName, newPackDesc)
        if (res.success) {
            setNewPackName("")
            setNewPackDesc("")
            loadData()
        } else {
            alert(res.message)
        }
    }

    const handleUploadToPack = async (packId: string, files: FileList) => {
        setUploadingPackId(packId)
        
        let successCount = 0;
        for (let i = 0; i < files.length; i++) {
            const formData = new FormData()
            formData.append("file", files[i])
            
            const res = await uploadGlobalDocument(packId, formData)
            if (res.success) {
                successCount++;
            } else {
                alert(`Error al subir ${files[i].name}: ${res.message}`)
            }
        }

        if (successCount > 0) {
            loadData()
        }
        setUploadingPackId(null)
        if (fileInputRef.current[packId]) {
            fileInputRef.current[packId]!.value = ""
        }
    }

    const handleUploadAgencyDoc = async (file: File) => {
        setUploadingAgency(true)
        const formData = new FormData()
        formData.append("file", file)
        
        const res = await uploadAgencyDocument(formData)
        if (res.success) {
            loadData()
        } else {
            alert(res.message)
        }
        setUploadingAgency(false)
        if (agencyFileRef.current) agencyFileRef.current.value = ""
    }

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    if (loading && !data) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-slate-500">
                <RefreshCw className="h-8 w-8 animate-spin mb-4 text-teal-600" />
                <p>Cargando biblioteca...</p>
            </div>
        )
    }

    const isSuperAdmin = data?.role === 'SUPER_ADMIN'
    const storagePercent = data?.storage ? (data.storage.usedBytes / data.storage.maxBytes) * 100 : 0

    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            
            {/* VISTA DEL SUPER ADMIN: CREAR PACKS GLOBALES */}
            {isSuperAdmin && (
                <Card className="border shadow-sm border-amber-200">
                    <CardHeader className="bg-amber-50/50 border-b border-amber-100">
                        <CardTitle className="text-amber-800 flex items-center gap-2">
                            <Folder className="h-5 w-5" /> 
                            Gestión Global de Packs (Super Admin)
                        </CardTitle>
                        <CardDescription>Crea carpetas maestras y sube PDFs que las agencias podrán habilitar.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                        {/* Formulario Crear Pack */}
                        <div className="flex flex-col md:flex-row gap-4 items-end bg-slate-50 p-4 rounded-lg border">
                            <div className="space-y-2 flex-1">
                                <Label>Nombre del Pack (Ej. Insignia Life)</Label>
                                <Input value={newPackName} onChange={(e) => setNewPackName(e.target.value)} placeholder="Nombre oficial" />
                            </div>
                            <div className="space-y-2 flex-1">
                                <Label>Descripción (Opcional)</Label>
                                <Input value={newPackDesc} onChange={(e) => setNewPackDesc(e.target.value)} placeholder="Breve descripción..." />
                            </div>
                            <Button onClick={handleCreatePack} className="bg-amber-600 hover:bg-amber-700 text-white">
                                <Plus className="h-4 w-4 mr-2" /> Crear Pack
                            </Button>
                        </div>

                        {/* Lista de Packs y sus Archivos */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {data?.allPacks?.map((pack: any) => (
                                <Card key={pack.id} className="border shadow-sm">
                                    <CardHeader className="bg-slate-50 border-b py-3 flex flex-row items-center justify-between">
                                        <div>
                                            <CardTitle className="text-sm font-bold text-slate-800">{pack.name}</CardTitle>
                                            {pack.description && <p className="text-xs text-slate-500 mt-1">{pack.description}</p>}
                                        </div>
                                        <Button variant="ghost" size="sm" onClick={() => deleteDocumentPack(pack.id).then(loadData)} className="text-red-500 h-8 w-8 p-0">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </CardHeader>
                                    <CardContent className="p-4 space-y-4">
                                        <div className="space-y-2">
                                            {pack.documents?.length === 0 ? (
                                                <p className="text-xs text-slate-400 italic">No hay documentos en este pack.</p>
                                            ) : (
                                                pack.documents?.map((doc: any) => (
                                                    <div key={doc.id} className="flex items-center justify-between bg-white border p-2 rounded text-xs">
                                                        <div className="flex items-center gap-2 truncate">
                                                            <FileText className="h-3 w-3 text-blue-500 flex-shrink-0" />
                                                            <span className="truncate">{doc.name}</span>
                                                            <span className="text-slate-400 text-[10px]">({formatBytes(doc.fileSize)})</span>
                                                        </div>
                                                        <Button variant="ghost" size="sm" onClick={() => deleteGlobalDocument(doc.id).then(loadData)} className="text-red-500 h-6 w-6 p-0">
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 pt-2 border-t">
                                            <Input 
                                                type="file" 
                                                className="text-xs file:text-xs" 
                                                accept=".pdf,.doc,.docx,.txt"
                                                multiple
                                                ref={(el) => { fileInputRef.current[pack.id] = el }}
                                                onChange={(e) => {
                                                    const files = e.target.files
                                                    if (files && files.length > 0) {
                                                        handleUploadToPack(pack.id, files)
                                                    }
                                                }}
                                                disabled={uploadingPackId === pack.id}
                                            />
                                            {uploadingPackId === pack.id && <RefreshCw className="h-4 w-4 animate-spin text-teal-600" />}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* VISTA DEL ADMIN: SUSCRIPCION A PACKS GLOBALES */}
            <Card className="border shadow-sm">
                <CardHeader className="bg-slate-50/50 border-b">
                    <CardTitle className="text-slate-800">Catálogo de Packs Oficiales</CardTitle>
                    <CardDescription>Habilita los manuales y documentos globales que deseas que vean los agentes de tu promotoría.</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {data?.allPacks?.map((pack: any) => {
                            const isEnabled = data.enabledPacksList?.includes(pack.id)
                            return (
                                <div key={pack.id} className={`p-4 rounded-lg border flex items-start justify-between gap-4 transition-colors ${isEnabled ? 'bg-teal-50/30 border-teal-200' : 'bg-white'}`}>
                                    <div>
                                        <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                                            <Folder className="h-4 w-4 text-amber-500" />
                                            {pack.name}
                                        </h4>
                                        <p className="text-xs text-slate-500 mt-1">{pack.documents?.length || 0} archivos incluidos</p>
                                    </div>
                                    <Switch 
                                        checked={isEnabled} 
                                        onCheckedChange={(checked) => toggleAgencyPack(pack.id, checked).then(loadData)} 
                                    />
                                </div>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* VISTA DEL ADMIN: DOCUMENTOS PROPIOS (80MB) */}
            <Card className="border shadow-sm">
                <CardHeader className="bg-slate-50/50 border-b">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <CardTitle className="text-slate-800">Documentos Internos de la Agencia</CardTitle>
                            <CardDescription>Sube guías y políticas exclusivas para tu equipo.</CardDescription>
                        </div>
                        {data?.storage && (
                            <div className="text-right">
                                <div className="text-xs font-medium text-slate-600 mb-1">
                                    Almacenamiento: {formatBytes(data.storage.usedBytes)} / {formatBytes(data.storage.maxBytes)}
                                </div>
                                <div className="w-full md:w-48 h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full transition-all ${storagePercent > 90 ? 'bg-red-500' : storagePercent > 70 ? 'bg-amber-500' : 'bg-teal-500'}`} 
                                        style={{ width: `${Math.min(100, storagePercent)}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-6">
                        
                        {/* Zona de Subida */}
                        <div className="md:w-1/3 space-y-4">
                            <div className="p-6 border-2 border-dashed rounded-xl bg-slate-50 text-center space-y-4">
                                <div className="mx-auto w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center border">
                                    <Upload className="h-5 w-5 text-slate-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-700">Subir nuevo documento</p>
                                    <p className="text-xs text-slate-500 mt-1">PDF, Word o TXT</p>
                                </div>
                                
                                <Input 
                                    type="file" 
                                    className="cursor-pointer"
                                    accept=".pdf,.doc,.docx,.txt"
                                    ref={agencyFileRef}
                                    onChange={(e) => {
                                        const file = e.target.files?.[0]
                                        if (file) handleUploadAgencyDoc(file)
                                    }}
                                    disabled={uploadingAgency || storagePercent >= 100}
                                />
                                {uploadingAgency && <p className="text-xs text-teal-600 animate-pulse">Subiendo a la nube...</p>}
                            </div>
                            
                            <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-xs flex items-start gap-2">
                                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                                <p>Recomendamos comprimir tus PDFs antes de subirlos para no agotar tus 80MB de capacidad.</p>
                            </div>
                        </div>

                        {/* Lista de Documentos */}
                        <div className="md:w-2/3 border rounded-lg overflow-hidden">
                            <div className="bg-slate-50 px-4 py-2 border-b text-xs font-bold text-slate-500">Archivos Subidos</div>
                            <div className="divide-y max-h-[400px] overflow-y-auto">
                                {data?.agencyDocs?.length === 0 ? (
                                    <div className="p-8 text-center text-slate-400 text-sm">
                                        No has subido ningún documento interno aún.
                                    </div>
                                ) : (
                                    data?.agencyDocs?.map((doc: any) => (
                                        <div key={doc.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <FileText className="h-8 w-8 text-slate-300" />
                                                <div>
                                                    <p className="text-sm font-medium text-slate-800">{doc.name}</p>
                                                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                                                        <span>{formatBytes(doc.fileSize)}</span>
                                                        <span>&bull;</span>
                                                        <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button variant="outline" size="sm" asChild className="text-xs">
                                                    <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">Ver</a>
                                                </Button>
                                                <Button variant="ghost" size="sm" onClick={() => deleteAgencyDocument(doc.id).then(loadData)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                    </div>
                </CardContent>
            </Card>

        </div>
    )
}
