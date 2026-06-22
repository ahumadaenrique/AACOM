"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { differenceInDays, format } from "date-fns";
import { es } from "date-fns/locale";
import { ShieldAlert, CheckCircle2, XCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteAgency } from "./actions";
import { useState } from "react";

export function AgenciesTable({ agencies }: { agencies: any[] }) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (agencyId: string, agencyName: string) => {
    if (!confirm(`¿ESTÁS ABSOLUTAMENTE SEGURO de querer borrar a la agencia "${agencyName}"? Esta acción borrará la agencia por completo y no se puede deshacer.`)) {
      return;
    }
    
    try {
      setDeletingId(agencyId);
      await deleteAgency(agencyId);
    } catch (err: any) {
      alert("Error al borrar agencia: " + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="mt-12 bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50">
        <h2 className="text-xl font-bold text-slate-800">Resumen de Clientes SaaS</h2>
        <p className="text-sm text-slate-500 mt-1">Estado de las suscripciones, vigencia y número de usuarios por agencia.</p>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 hover:bg-slate-50">
              <TableHead className="font-bold text-slate-600">Agencia</TableHead>
              <TableHead className="font-bold text-slate-600">Administrador</TableHead>
              <TableHead className="font-bold text-slate-600 text-center">Usuarios</TableHead>
              <TableHead className="font-bold text-slate-600">Suscripción</TableHead>
              <TableHead className="font-bold text-slate-600 text-right">Vencimiento</TableHead>
              <TableHead className="font-bold text-slate-600 text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agencies.map((agency) => {
              const admin = agency.users && agency.users.length > 0 ? agency.users[0] : null;
              
              const endDate = agency.subscriptionEndDate ? new Date(agency.subscriptionEndDate) : null;
              const now = new Date();
              const daysLeft = endDate ? differenceInDays(endDate, now) : 0;
              
              const isActive = agency.subscriptionStatus === "active" && (!endDate || daysLeft >= 0);
              const isWarning = isActive && endDate && daysLeft <= 7 && daysLeft > 0;
              const isExpired = endDate && daysLeft < 0;

              return (
                <TableRow key={agency.id} className="hover:bg-slate-50/80 transition-colors">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: agency.primaryColor || '#4f46e5' }}></div>
                      <span className="text-slate-800 font-bold">{agency.name}</span>
                      {!agency.active && <Badge variant="destructive" className="ml-2 text-[10px] px-1.5 py-0">Inactiva</Badge>}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">{agency.slug}.aacomsoft.com</div>
                  </TableCell>
                  
                  <TableCell>
                    {admin ? (
                      <div className="flex flex-col">
                        <span className="text-sm text-slate-700 font-medium">{admin.name || 'Sin Nombre'}</span>
                        <span className="text-xs text-slate-500">{admin.email}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">No asignado</span>
                    )}
                  </TableCell>
                  
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                      {agency._count?.users || 0}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    {isActive ? (
                      isWarning ? (
                        <div className="flex items-center gap-1.5 text-amber-600 text-sm font-semibold">
                          <ShieldAlert className="w-4 h-4" />
                          <span>Por vencer ({daysLeft} días)</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-emerald-600 text-sm font-semibold">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Vigente</span>
                        </div>
                      )
                    ) : isExpired ? (
                      <div className="flex items-center gap-1.5 text-red-600 text-sm font-semibold">
                        <XCircle className="w-4 h-4" />
                        <span>Vencida</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-slate-500 text-sm font-semibold">
                        <XCircle className="w-4 h-4" />
                        <span>Inactiva/Cancelada</span>
                      </div>
                    )}
                  </TableCell>
                  
                  <TableCell className="text-right">
                    {endDate ? (
                      <div className="flex flex-col items-end">
                        <span className={`text-sm font-medium ${isExpired ? 'text-red-600' : 'text-slate-700'}`}>
                          {format(endDate, "dd MMM yyyy", { locale: es })}
                        </span>
                        {!isExpired && daysLeft > 7 && (
                          <span className="text-xs text-slate-400">Quedan {daysLeft} días</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-slate-400 italic">Ilimitada</span>
                    )}
                  </TableCell>

                  <TableCell className="text-right">
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => handleDelete(agency.id, agency.name)}
                      disabled={deletingId === agency.id}
                      className="text-xs h-7 px-2 bg-red-100 hover:bg-red-200 text-red-600 border border-red-200"
                    >
                      {deletingId === agency.id ? "Borrando..." : <Trash2 className="h-3.5 w-3.5" />}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
            
            {agencies.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                  No hay agencias registradas aún.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
