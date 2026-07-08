"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Users, DollarSign, Tag, CheckCircle, Plus, Trash2, Edit2, X, Save } from "lucide-react"
import { createSeller, updateSeller, deleteSeller, updateSellerCommission, generateSellerCoupon, deleteSellerCoupon, markCommissionAsPaid, markAllSellerCommissionsAsPaid } from "@/app/sellerActions"
import { useToast } from "@/hooks/use-toast"

export default function VendedoresClient({ initialSellers }: { initialSellers: any[] }) {
    const { toast } = useToast()
    const [sellers, setSellers] = useState(initialSellers.filter(s => s.active))
    const [loading, setLoading] = useState(false)
    const [newSeller, setNewSeller] = useState({ name: "", email: "", commissionRate: 40, password: "" })
    const [newCoupon, setNewCoupon] = useState({ sellerId: "", code: "", discountPercentage: 10 })
    const [editingSellerId, setEditingSellerId] = useState<string | null>(null)
    const [editSellerData, setEditSellerData] = useState({ name: "", commissionRate: 40 })

    const handleCreateSeller = async () => {
        if (!newSeller.name || !newSeller.email) return toast({ variant: "destructive", title: "Faltan datos" });
        setLoading(true);
        try {
            await createSeller(newSeller);
            toast({ title: `Vendedor creado y contraseña temporal asignada` });
            window.location.reload();
        } catch (e: any) {
            toast({ variant: "destructive", title: e.message });
        }
        setLoading(false);
    }

    const handleDeleteCoupon = async (couponId: string) => {
        if (!confirm("¿Estás seguro de eliminar este cupón de descuento?")) return;
        setLoading(true);
        try {
            await deleteSellerCoupon(couponId);
            toast({ title: "Cupón eliminado con éxito" });
            window.location.reload();
        } catch (e: any) {
            toast({ variant: "destructive", title: e.message });
        }
        setLoading(false);
    }

    const handleDeleteSeller = async (sellerId: string) => {
        if (!confirm("¿Estás seguro de eliminar a este vendedor? Ya no tendrá acceso al sistema ni cobrará comisiones nuevas.")) return;
        setLoading(true);
        try {
            await deleteSeller(sellerId);
            toast({ title: "Vendedor eliminado" });
            window.location.reload();
        } catch (e: any) {
            toast({ variant: "destructive", title: e.message });
        }
        setLoading(false);
    }

    const handleUpdateSeller = async (sellerId: string) => {
        if (!editSellerData.name) return toast({ variant: "destructive", title: "El nombre no puede estar vacío" });
        setLoading(true);
        try {
            await updateSeller(sellerId, editSellerData);
            toast({ title: "Vendedor actualizado" });
            window.location.reload();
        } catch (e: any) {
            toast({ variant: "destructive", title: e.message });
        }
        setLoading(false);
    }

    const handleCreateCoupon = async (sellerId: string) => {
        if (!newCoupon.code || newCoupon.discountPercentage > 30) return toast({ variant: "destructive", title: "Código inválido o descuento > 30%" });
        setLoading(true);
        try {
            await generateSellerCoupon(sellerId, newCoupon.code, newCoupon.discountPercentage);
            toast({ title: "Cupón creado con éxito" });
            window.location.reload();
        } catch (e: any) {
            toast({ variant: "destructive", title: e.message });
        }
        setLoading(false);
    }

    const handlePayCommissions = async (sellerId: string) => {
        if (!confirm("¿Marcar todas las comisiones pendientes de este vendedor como PAGADAS?")) return;
        setLoading(true);
        try {
            await markAllSellerCommissionsAsPaid(sellerId);
            toast({ title: "Comisiones marcadas como pagadas" });
            window.location.reload();
        } catch (e: any) {
            toast({ variant: "destructive", title: e.message });
        }
        setLoading(false);
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">Red de Afiliados</h1>
                    <p className="text-muted-foreground mt-1">Administra tus vendedores, cupones y comisiones.</p>
                </div>
            </div>

            {/* Crear Vendedor */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Alta de Vendedor</CardTitle>
                    <CardDescription>Crea un nuevo acceso de vendedor en el sistema</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-4 items-end">
                        <div className="space-y-1">
                            <label className="text-xs font-medium">Nombre</label>
                            <Input placeholder="Ej. Carlos Pérez" value={newSeller.name} onChange={(e) => setNewSeller({...newSeller, name: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium">Correo Electrónico</label>
                            <Input type="email" placeholder="carlos@ventas.com" value={newSeller.email} onChange={(e) => setNewSeller({...newSeller, email: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium">Comisión Base (%)</label>
                            <Input type="number" min="0" max="100" value={newSeller.commissionRate} onChange={(e) => setNewSeller({...newSeller, commissionRate: Number(e.target.value)})} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium">Contraseña Temporal</label>
                            <Input placeholder="Ej. Ventas2026*" value={newSeller.password} onChange={(e) => setNewSeller({...newSeller, password: e.target.value})} />
                        </div>
                        <Button onClick={handleCreateSeller} disabled={loading} className="gap-2">
                            <Plus className="w-4 h-4" /> Crear Vendedor
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Lista de Vendedores */}
            <div className="space-y-6">
                {sellers.map(seller => {
                    const pendingCommissions = seller.commissions.filter((c:any) => c.status === 'PENDING').reduce((acc: number, c: any) => acc + c.commissionEarned, 0);
                    const paidCommissions = seller.commissions.filter((c:any) => c.status === 'PAID').reduce((acc: number, c: any) => acc + c.commissionEarned, 0);
                    const totalSales = seller.commissions.reduce((acc: number, c: any) => acc + c.amountPaid, 0);

                    return (
                        <Card key={seller.id} className="overflow-hidden border-indigo-100 dark:border-indigo-900/30">
                            <div className="bg-indigo-50/50 dark:bg-indigo-950/20 p-4 border-b border-indigo-100 dark:border-indigo-900/30 flex flex-col sm:flex-row justify-between items-center gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center">
                                        <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <div>
                                        {editingSellerId === seller.id ? (
                                            <div className="flex items-center gap-2">
                                                <Input className="h-7 w-40 text-sm" value={editSellerData.name} onChange={e => setEditSellerData({...editSellerData, name: e.target.value})} />
                                                <span className="text-sm">Comisión:</span>
                                                <Input type="number" className="h-7 w-20 text-sm" max="100" value={editSellerData.commissionRate} onChange={e => setEditSellerData({...editSellerData, commissionRate: Number(e.target.value)})} />%
                                            </div>
                                        ) : (
                                            <>
                                                <h3 className="text-lg font-semibold text-indigo-900 dark:text-indigo-300">{seller.name}</h3>
                                                <p className="text-sm text-indigo-700/70 dark:text-indigo-400/70">{seller.email} • Comisión Base: {seller.sellerCommissionRate}%</p>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-4 text-center">
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Ventas Netas</p>
                                        <p className="font-bold text-slate-700 dark:text-slate-300">${totalSales.toFixed(2)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Por Pagar</p>
                                        <p className="font-bold text-amber-600 dark:text-amber-500">${pendingCommissions.toFixed(2)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Pagado</p>
                                        <p className="font-bold text-emerald-600 dark:text-emerald-500">${paidCommissions.toFixed(2)}</p>
                                    </div>
                                    
                                    {/* Controles del Vendedor */}
                                    <div className="flex flex-col gap-2 ml-4 border-l pl-4 border-indigo-100 dark:border-indigo-900/30">
                                        {editingSellerId === seller.id ? (
                                            <>
                                                <Button size="sm" variant="default" onClick={() => handleUpdateSeller(seller.id)} disabled={loading} className="h-7 text-xs bg-indigo-600 hover:bg-indigo-700 text-white">
                                                    <Save className="w-3 h-3 mr-1" /> Guardar
                                                </Button>
                                                <Button size="sm" variant="ghost" onClick={() => setEditingSellerId(null)} disabled={loading} className="h-7 text-xs">
                                                    <X className="w-3 h-3 mr-1" /> Cancelar
                                                </Button>
                                            </>
                                        ) : (
                                            <>
                                                <Button size="sm" variant="outline" onClick={() => { setEditingSellerId(seller.id); setEditSellerData({ name: seller.name, commissionRate: seller.sellerCommissionRate || 0 }); }} disabled={loading} className="h-7 text-xs text-indigo-700 border-indigo-200 hover:bg-indigo-50">
                                                    <Edit2 className="w-3 h-3 mr-1" /> Editar
                                                </Button>
                                                <Button size="sm" variant="outline" onClick={() => handleDeleteSeller(seller.id)} disabled={loading} className="h-7 text-xs text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700">
                                                    <Trash2 className="w-3 h-3 mr-1" /> Eliminar
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <CardContent className="p-0">
                                <div className="grid grid-cols-1 md:grid-cols-2">
                                    {/* Cupones */}
                                    <div className="p-6 border-r border-slate-100 dark:border-zinc-800">
                                        <div className="flex justify-between items-center mb-4">
                                            <h4 className="font-medium text-sm text-slate-800 dark:text-zinc-200 flex items-center gap-2">
                                                <Tag className="w-4 h-4" /> Cupones Asignados
                                            </h4>
                                        </div>
                                        <div className="space-y-2 mb-4">
                                            {seller.discountCodes.length === 0 ? (
                                                <p className="text-xs text-muted-foreground">Sin cupones asignados</p>
                                            ) : seller.discountCodes.map((code: any) => (
                                                <div key={code.id} className="flex justify-between items-center p-2 rounded-lg bg-slate-50 dark:bg-zinc-900/50 text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono font-bold tracking-wider">{code.code}</span>
                                                        <Badge variant="outline">-{code.discountPercentage}%</Badge>
                                                    </div>
                                                    <Button 
                                                        size="icon" 
                                                        variant="ghost" 
                                                        className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md"
                                                        onClick={() => handleDeleteCoupon(code.id)}
                                                        disabled={loading}
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                        {/* Crear Cupón */}
                                        <div className="flex gap-2">
                                            <Input 
                                                placeholder="CÓDIGO" 
                                                className="uppercase"
                                                value={newCoupon.sellerId === seller.id ? newCoupon.code : ""} 
                                                onChange={(e) => setNewCoupon({sellerId: seller.id, code: e.target.value.toUpperCase(), discountPercentage: newCoupon.discountPercentage})} 
                                            />
                                            <Input 
                                                type="number" 
                                                placeholder="%" 
                                                className="w-20"
                                                max="30"
                                                value={newCoupon.sellerId === seller.id ? newCoupon.discountPercentage : 10} 
                                                onChange={(e) => setNewCoupon({...newCoupon, sellerId: seller.id, discountPercentage: Number(e.target.value)})} 
                                            />
                                            <Button size="sm" variant="secondary" onClick={() => handleCreateCoupon(seller.id)} disabled={loading}>
                                                Añadir
                                            </Button>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground mt-2">Máximo 30% permitido por sistema.</p>
                                    </div>

                                    {/* Comisiones */}
                                    <div className="p-6">
                                        <div className="flex justify-between items-center mb-4">
                                            <h4 className="font-medium text-sm text-slate-800 dark:text-zinc-200 flex items-center gap-2">
                                                <DollarSign className="w-4 h-4" /> Comisiones Recientes
                                            </h4>
                                            {pendingCommissions > 0 && (
                                                <Button size="sm" onClick={() => handlePayCommissions(seller.id)} disabled={loading} className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
                                                    Liquidar Adeudo
                                                </Button>
                                            )}
                                        </div>
                                        <div className="space-y-3">
                                            {seller.commissions.length === 0 ? (
                                                <p className="text-xs text-muted-foreground">Sin ventas registradas</p>
                                            ) : seller.commissions.slice(0, 5).map((c: any) => (
                                                <div key={c.id} className="flex justify-between items-center text-sm border-b border-slate-100 dark:border-zinc-800 pb-2 last:border-0">
                                                    <div>
                                                        <p className="font-medium text-slate-700 dark:text-slate-300">{c.description}</p>
                                                        <p className="text-[10px] text-muted-foreground">{new Date(c.createdAt).toLocaleDateString()}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-bold text-emerald-600 dark:text-emerald-500">+${c.commissionEarned.toFixed(2)}</p>
                                                        <Badge variant={c.status === 'PAID' ? 'secondary' : 'default'} className={c.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}>
                                                            {c.status}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
        </div>
    )
}
