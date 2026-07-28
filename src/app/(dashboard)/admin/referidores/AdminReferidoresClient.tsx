"use client";

import React, { useState, useEffect } from "react";
import { getReferidoresConActividad, getAgentesParaSelect, createReferidor } from "./actions";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Users, UserCheck } from "lucide-react";

export default function AdminReferidoresClient() {
    const [referidores, setReferidores] = useState<any[]>([]);
    const [agentes, setAgentes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Modal state
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    
    // Form state
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        linkedAgentId: "",
        tempPassword: ""
    });

    const loadData = async () => {
        setLoading(true);
        const [refRes, agRes] = await Promise.all([
            getReferidoresConActividad(),
            getAgentesParaSelect()
        ]);
        
        if (refRes.success && refRes.data) setReferidores(refRes.data);
        if (agRes.success && agRes.data) setAgentes(agRes.data);
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsSubmitting(true);

        const res = await createReferidor(formData);
        
        if (res.success) {
            setIsOpen(false);
            setFormData({ name: "", email: "", linkedAgentId: "", tempPassword: "" });
            await loadData();
        } else {
            setError(res.error || "Ocurrió un error al crear el referidor");
        }
        
        setIsSubmitting(false);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
                <p className="text-muted-foreground">Cargando referidores...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-teal-600" />
                    <h2 className="text-lg font-semibold text-slate-800">Total Referidores: {referidores.length}</h2>
                </div>
                
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-teal-600 hover:bg-teal-700 text-white">
                            <Plus className="w-4 h-4 mr-2" />
                            Alta de Referidor
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Dar de Alta Referidor</DialogTitle>
                            <DialogDescription>
                                Crea un nuevo referidor y asígnalo a un Agente. El referidor deberá cambiar su contraseña al iniciar sesión por primera vez.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 py-4">
                            {error && (
                                <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-200">
                                    {error}
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="name">Nombre Completo</Label>
                                <Input 
                                    id="name" 
                                    required 
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Correo Electrónico</Label>
                                <Input 
                                    id="email" 
                                    type="email" 
                                    required 
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="agent">Agente Asignado</Label>
                                <Select 
                                    required 
                                    value={formData.linkedAgentId} 
                                    onValueChange={(val) => setFormData({...formData, linkedAgentId: val})}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecciona un Agente..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {agentes.map(ag => (
                                            <SelectItem key={ag.id} value={ag.id}>
                                                {ag.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="pass">Contraseña Temporal</Label>
                                <Input 
                                    id="pass" 
                                    type="text" 
                                    required 
                                    value={formData.tempPassword}
                                    placeholder="Ej. Temporal123!"
                                    onChange={(e) => setFormData({...formData, tempPassword: e.target.value})}
                                />
                            </div>
                            <DialogFooter className="pt-4">
                                <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isSubmitting}>
                                    Cancelar
                                </Button>
                                <Button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white" disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    Crear Referidor
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="border rounded-lg bg-white overflow-hidden shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50 hover:bg-slate-50">
                            <TableHead className="w-[300px] font-semibold text-slate-700">Referidor</TableHead>
                            <TableHead className="font-semibold text-slate-700">Agente Asignado</TableHead>
                            <TableHead className="font-semibold text-slate-700">Estado</TableHead>
                            <TableHead className="text-right font-semibold text-slate-700">Pts. Hoy</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {referidores.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                    No hay referidores registrados en la promotoría.
                                </TableCell>
                            </TableRow>
                        ) : (
                            referidores.map((ref) => (
                                <TableRow key={ref.id} className="group">
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-slate-800">{ref.name}</span>
                                            <span className="text-xs text-muted-foreground">{ref.email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <UserCheck className="w-4 h-4 text-slate-400" />
                                            <span className="text-sm font-medium text-slate-700">{ref.agentName}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${ref.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {ref.active ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <span className="text-sm font-bold text-slate-800">{ref.todayPoints}</span>
                                            <span className={`h-2.5 w-2.5 rounded-full ${ref.todayPoints >= 15 ? 'bg-teal-500' : ref.todayPoints >= 9 ? 'bg-amber-500' : 'bg-rose-500'}`} />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
