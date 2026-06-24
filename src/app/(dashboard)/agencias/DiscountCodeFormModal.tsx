"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createDiscountCode, updateDiscountCode } from "./actions";
import { Loader2 } from "lucide-react";

export function DiscountCodeFormModal({ children, discount }: { children: React.ReactNode, discount?: any }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [code, setCode] = useState(discount?.code || "");
  const [discountPercentage, setDiscountPercentage] = useState(discount?.discountPercentage?.toString() || "50");
  const [maxUses, setMaxUses] = useState(discount?.maxUses?.toString() || "");

  const formatDateForInput = (dateStr: string | null | undefined) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzOffset).toISOString().split('T')[0];
  };

  const [expiresAt, setExpiresAt] = useState(formatDateForInput(discount?.expiresAt));

  // Update state when modal opens with new props
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      setCode(discount?.code || "");
      setDiscountPercentage(discount?.discountPercentage?.toString() || "50");
      setMaxUses(discount?.maxUses?.toString() || "");
      setExpiresAt(formatDateForInput(discount?.expiresAt));
      setError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (discount?.id) {
        await updateDiscountCode(discount.id, {
          code: code.trim().toUpperCase(),
          discountPercentage: Number(discountPercentage),
          maxUses: maxUses ? Number(maxUses) : null,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
        });
      } else {
        await createDiscountCode({
          code: code.trim().toUpperCase(),
          discountPercentage: Number(discountPercentage),
          maxUses: maxUses ? Number(maxUses) : null,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
        });
      }
      setOpen(false);
      
      // Reset form
      if (!discount) {
        setCode("");
        setDiscountPercentage("50");
        setMaxUses("");
        setExpiresAt("");
      }
    } catch (err: any) {
      setError(err.message || "Ocurrió un error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{discount ? "Editar Cupón" : "Nuevo Cupón de Descuento"}</DialogTitle>
          <DialogDescription>
            {discount ? "Modifica los valores del cupón seleccionado." : "Crea un código promocional. Este código podrá ser usado en la pantalla de pago de las agencias."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="code">Código (ej. BUENFIN50)</Label>
            <Input 
              id="code" 
              required 
              value={code} 
              onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} 
              placeholder="NAVIDAD2026"
              className="font-mono uppercase"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="discount">Porcentaje de Descuento (%)</Label>
            <Input 
              id="discount" 
              type="number" 
              required 
              min="1" 
              max="100" 
              value={discountPercentage} 
              onChange={e => setDiscountPercentage(e.target.value)} 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxUses">Límite de usos (Opcional)</Label>
            <Input 
              id="maxUses" 
              type="number" 
              min="1" 
              value={maxUses} 
              onChange={e => setMaxUses(e.target.value)} 
              placeholder="Ej. 100 (Dejar vacío para ilimitado)"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="expiresAt">Fecha de Vencimiento (Opcional)</Label>
            <Input 
              id="expiresAt" 
              type="date" 
              value={expiresAt} 
              onChange={e => setExpiresAt(e.target.value)} 
            />
          </div>
          
          {error && <p className="text-sm font-medium text-red-500">{error}</p>}
          
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {discount ? "Guardar Cambios" : "Crear Cupón"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
