"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Tag, Activity, Pencil, Trash2 } from "lucide-react";
import { toggleDiscountCode, deleteDiscountCode } from "./actions";
import { Switch } from "@/components/ui/switch";
import { DiscountCodeFormModal } from "./DiscountCodeFormModal";

export function DiscountCodesTable({ discountCodes }: { discountCodes: any[] }) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleToggle = async (id: string, currentStatus: boolean) => {
    try {
      setLoadingId(id);
      await toggleDiscountCode(id, !currentStatus);
    } catch (error: any) {
      alert("Error al actualizar: " + error.message);
    } finally {
      setLoadingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este código de descuento? Esta acción no se puede deshacer.")) return;
    try {
      setLoadingId(id);
      await deleteDiscountCode(id);
    } catch (error: any) {
      alert("Error al eliminar: " + error.message);
    } finally {
      setLoadingId(null);
    }
  };

  const isExpired = (date: Date | null) => {
    if (!date) return false;
    return new Date(date) < new Date();
  };

  return (
    <Card className="border-slate-200/60 shadow-sm bg-white/50 backdrop-blur-xl">
      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow>
              <TableHead className="w-[200px]">Código</TableHead>
              <TableHead>Descuento</TableHead>
              <TableHead>Usos</TableHead>
              <TableHead>Vencimiento</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {discountCodes.map((code) => {
              const expired = isExpired(code.expiresAt);
              const maxedOut = code.maxUses && code.uses >= code.maxUses;
              const actuallyActive = code.active && !expired && !maxedOut;

              return (
                <TableRow key={code.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-indigo-500" />
                      <span className="font-mono text-slate-900 bg-slate-100 px-2 py-1 rounded">{code.code}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-emerald-600 font-bold">{code.discountPercentage}%</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Activity className="w-4 h-4" />
                      {code.uses} {code.maxUses ? `/ ${code.maxUses}` : '(Ilimitado)'}
                      {maxedOut && <Badge variant="destructive" className="ml-2 text-[10px]">Agotado</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>
                    {code.expiresAt ? (
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(code.expiresAt).toLocaleDateString()}</span>
                        {expired && <Badge variant="destructive" className="ml-2 text-[10px]">Vencido</Badge>}
                      </div>
                    ) : (
                      <span className="text-slate-400 text-sm">Sin límite</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch 
                        checked={code.active} 
                        onCheckedChange={() => handleToggle(code.id, code.active)} 
                        disabled={loadingId === code.id}
                      />
                      <Badge variant={actuallyActive ? "default" : "secondary"} className={actuallyActive ? "bg-emerald-500" : ""}>
                        {code.active ? (actuallyActive ? 'Activo' : 'Pausado') : 'Apagado'}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <DiscountCodeFormModal discount={code}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-indigo-600">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </DiscountCodeFormModal>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-slate-500 hover:text-red-600"
                        onClick={() => handleDelete(code.id)}
                        disabled={loadingId === code.id}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {discountCodes.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-slate-500">
                  No tienes códigos de descuento creados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
