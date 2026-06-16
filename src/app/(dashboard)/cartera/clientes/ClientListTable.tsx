"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, FileText } from "lucide-react";
import Link from "next/link";

type ClientWithPolicies = any;

export default function ClientListTable({ clients }: { clients: ClientWithPolicies[] }) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("name");

  const sortedAndFiltered = useMemo(() => {
    let result = clients.filter((c: any) => 
      c.name.toLowerCase().includes(search.toLowerCase()) || 
      (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
    );

    const withClosestRenewal = result.map((c: any) => {
      const futureRenewals = c.policies
        .map((p: any) => p.renewalDate ? new Date(p.renewalDate).getTime() : 0)
        .filter((d: number) => d > Date.now());
      
      const closestRenewal = futureRenewals.length > 0 ? Math.min(...futureRenewals) : Infinity;
      
      return { ...c, closestRenewal };
    });

    withClosestRenewal.sort((a: any, b: any) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === "policies") {
        return b.policies.length - a.policies.length;
      }
      if (sortBy === "vigencia") {
        return a.closestRenewal - b.closestRenewal;
      }
      return 0;
    });

    return withClosestRenewal;
  }, [clients, search, sortBy]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por nombre o correo..." 
            className="pl-9" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full md:w-64">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger>
              <SelectValue placeholder="Ordenar por..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Nombre (A-Z)</SelectItem>
              <SelectItem value="vigencia">Próxima Vigencia</SelectItem>
              <SelectItem value="policies">Cantidad de Pólizas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-auto max-h-[600px] border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre / Contacto</TableHead>
              <TableHead>Nacimiento</TableHead>
              <TableHead className="text-center">Pólizas</TableHead>
              <TableHead className="text-right">Prima Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedAndFiltered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                  No se encontraron resultados.
                </TableCell>
              </TableRow>
            ) : (
              sortedAndFiltered.map((client: any) => {
                const totalPremium = client.policies.reduce((acc: number, p: any) => acc + (p.annualPremium || 0), 0);
                return (
                  <TableRow key={client.id}>
                    <TableCell>
                      <Link href={`/cartera/clientes/${client.id}`} className="font-semibold text-primary hover:underline">{client.name}</Link>
                      <div className="text-xs text-muted-foreground flex flex-col mt-1">
                        {client.email && <span>{client.email}</span>}
                        {client.phone && <span>{client.phone}</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      {client.birthDate ? format(new Date(client.birthDate), "dd MMM yyyy", { locale: es }) : "N/A"}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="flex items-center w-fit mx-auto gap-1">
                        <FileText className="w-3 h-3" />
                        {client.policies.length}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(totalPremium)}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
