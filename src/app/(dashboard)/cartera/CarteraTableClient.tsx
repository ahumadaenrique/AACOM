"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, Search } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

export default function CarteraTableClient({ policies, isAdmin }: { policies: any[], isAdmin: boolean }) {
    const [searchTerm, setSearchTerm] = useState("")
    const [agentFilter, setAgentFilter] = useState("ALL")

    // Extraer agentes únicos para el filtro
    const uniqueAgents = Array.from(new Set(policies.map(p => p.user?.name).filter(Boolean))) as string[]

    const filteredPolicies = policies.filter(policy => {
        const term = searchTerm.toLowerCase();
        const matchesSearch = term === "" || 
            policy.policyNumber?.toLowerCase().includes(term) ||
            policy.contractor?.toLowerCase().includes(term) ||
            policy.product?.toLowerCase().includes(term) ||
            policy.insuranceCompany?.toLowerCase().includes(term);
            
        const matchesAgent = agentFilter === "ALL" || policy.user?.name === agentFilter;

        return matchesSearch && matchesAgent;
    })

    const handleDownloadCSV = () => {
        // Generar encabezados
        const headers = ["Poliza", isAdmin ? "Agente" : null, "Contratante", "Producto", "Aseguradora", "Vigencia Inicio", "Vigencia Fin", "Prima"].filter(Boolean)
        
        // Generar filas
        const rows = filteredPolicies.map(p => {
            return [
                p.policyNumber || "",
                isAdmin ? (p.user?.name || "Sin Asignar") : null,
                p.contractor || "",
                p.product || "",
                p.insuranceCompany || "",
                p.effectiveDate ? format(new Date(p.effectiveDate), "dd/MM/yyyy") : "",
                p.renewalDate ? format(new Date(p.renewalDate), "dd/MM/yyyy") : "",
                p.annualPremium || 0
            ].filter(v => v !== null).map(v => `"${v}"`).join(",")
        })

        const csvContent = [headers.join(","), ...rows].join("\n")
        
        // BOM para que Excel lea los acentos correctamente
        const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `Cartera_Filtrada_${format(new Date(), "yyyy-MM-dd")}.csv`
        a.click()
        URL.revokeObjectURL(url)
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 items-end sm:items-center justify-between p-4 bg-white dark:bg-zinc-950 rounded-md border">
                <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full">
                    <div className="relative w-full sm:max-w-xs">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar póliza, cliente..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {isAdmin && uniqueAgents.length > 0 && (
                        <Select value={agentFilter} onValueChange={setAgentFilter}>
                            <SelectTrigger className="w-full sm:max-w-xs">
                                <SelectValue placeholder="Todos los Agentes" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Todos los Agentes</SelectItem>
                                {uniqueAgents.map((agent) => (
                                    <SelectItem key={agent} value={agent}>{agent}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>
                <Button variant="outline" onClick={handleDownloadCSV} className="w-full sm:w-auto shrink-0">
                    <Download className="mr-2 h-4 w-4" /> Exportar CSV
                </Button>
            </div>
            
            <div className="overflow-auto max-h-[500px] border rounded-md bg-white dark:bg-zinc-950">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Póliza</TableHead>
                            {isAdmin && <TableHead>Agente</TableHead>}
                            <TableHead>Contratante</TableHead>
                            <TableHead>Producto</TableHead>
                            <TableHead>Aseguradora</TableHead>
                            <TableHead>Vigencia</TableHead>
                            <TableHead className="text-right">Prima</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredPolicies.map((policy) => (
                            <TableRow key={policy.id} className="hover:bg-muted/50">
                                <TableCell className="font-medium text-xs">
                                    {policy.policyNumber}
                                </TableCell>
                                {isAdmin && (
                                    <TableCell className="text-xs font-semibold text-indigo-600">
                                        {policy.user?.name || "Sin Asignar"}
                                    </TableCell>
                                )}
                                <TableCell>
                                    <Link href={`/cartera/clientes/${policy.clientId}`} className="hover:underline font-semibold text-primary">
                                        {policy.contractor}
                                    </Link>
                                </TableCell>
                                <TableCell>{policy.product}</TableCell>
                                <TableCell>{policy.insuranceCompany}</TableCell>
                                <TableCell className="text-xs">
                                    {policy.effectiveDate ? format(new Date(policy.effectiveDate), "dd/MM/yyyy") : "-"} a {policy.renewalDate ? format(new Date(policy.renewalDate), "dd/MM/yyyy") : "-"}
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                    {new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(policy.annualPremium || 0)}
                                </TableCell>
                            </TableRow>
                        ))}
                        {filteredPolicies.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={isAdmin ? 7 : 6} className="text-center p-4 text-muted-foreground">
                                    No se encontraron resultados para tu búsqueda.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
