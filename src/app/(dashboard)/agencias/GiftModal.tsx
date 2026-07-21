"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { addAgencySaaSDays, addAcademiaDaysToPromoter, addAcademiaDaysToUser } from "./actions";
import { Gift, BookOpen, Monitor, Users } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type GiftModalProps = {
  isOpen: boolean;
  onClose: () => void;
  agency: any;
  agencyUsers: any[];
};

export function GiftModal({ isOpen, onClose, agency, agencyUsers }: GiftModalProps) {
  const [loading, setLoading] = useState(false);
  
  // Form states
  const [saasDays, setSaasDays] = useState<number>(30);
  const [academiaAgencyDays, setAcademiaAgencyDays] = useState<number>(10);
  const [academiaUserDays, setAcademiaUserDays] = useState<number>(10);
  const [selectedUserEmail, setSelectedUserEmail] = useState<string>("");

  if (!agency) return null;

  const handleGiftSaaS = async () => {
    if (saasDays <= 0) return alert("Ingresa una cantidad válida de días.");
    setLoading(true);
    try {
      const res = await addAgencySaaSDays(agency.id, saasDays);
      if (res.success) {
        alert(res.message);
        onClose();
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
    setLoading(false);
  };

  const handleGiftAcademiaToPromoter = async () => {
    if (academiaAgencyDays <= 0) return alert("Ingresa una cantidad válida de días.");
    setLoading(true);
    try {
      const res = await addAcademiaDaysToPromoter(agency.id, academiaAgencyDays);
      if (res.success) {
        alert(res.message);
        onClose();
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
    setLoading(false);
  };

  const handleGiftAcademiaToUser = async () => {
    if (academiaUserDays <= 0) return alert("Ingresa una cantidad válida de días.");
    if (!selectedUserEmail) return alert("Selecciona un usuario.");
    setLoading(true);
    try {
      const res = await addAcademiaDaysToUser(selectedUserEmail, agency.id, academiaUserDays);
      if (res.success) {
        alert(res.message);
        onClose();
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
    setLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] border-slate-200">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Gift className="w-5 h-5 text-indigo-500" />
            Regalos y Cortesías
          </DialogTitle>
          <DialogDescription>
            Otorgar días gratis a la agencia <strong className="text-slate-800">{agency.name}</strong>.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="saas" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="saas" className="flex items-center gap-2">
              <Monitor className="w-4 h-4" /> App SaaS
            </TabsTrigger>
            <TabsTrigger value="academia" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" /> Academia
            </TabsTrigger>
          </TabsList>

          {/* TAB: SAAS */}
          <TabsContent value="saas" className="space-y-4 pt-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
              <Label className="text-slate-700 font-bold">Días Extra de Uso (SaaS)</Label>
              <p className="text-xs text-slate-500">
                Se extenderá la fecha de <code>subscriptionEndDate</code> de la agencia.
              </p>
              <div className="flex gap-3">
                <Input 
                  type="number" 
                  value={saasDays} 
                  onChange={(e) => setSaasDays(parseInt(e.target.value))}
                  min={1}
                />
                <Button 
                  onClick={handleGiftSaaS} 
                  disabled={loading}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  Regalar Días
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* TAB: ACADEMIA */}
          <TabsContent value="academia" className="space-y-6 pt-4">
            
            {/* Academia: By Agency (Promoter) */}
            <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 space-y-3">
              <Label className="text-indigo-800 font-bold flex items-center gap-2">
                <Users className="w-4 h-4" /> Al Saldo de la Agencia
              </Label>
              <p className="text-xs text-indigo-600/70">
                Se sumarán a la "bolsa" del Administrador para que él los asigne.
              </p>
              <div className="flex gap-3">
                <Input 
                  type="number" 
                  value={academiaAgencyDays} 
                  onChange={(e) => setAcademiaAgencyDays(parseInt(e.target.value))}
                  min={1}
                />
                <Button 
                  onClick={handleGiftAcademiaToPromoter} 
                  disabled={loading}
                  variant="outline"
                  className="border-indigo-200 text-indigo-700 hover:bg-indigo-100"
                >
                  Regalar a Agencia
                </Button>
              </div>
            </div>

            {/* Academia: By User */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
              <Label className="text-slate-700 font-bold">Directo a un Agente</Label>
              <p className="text-xs text-slate-500">
                Se activarán los días directamente en la licencia de estudio del agente.
              </p>
              <div className="space-y-3">
                <Select value={selectedUserEmail} onValueChange={setSelectedUserEmail}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un agente..." />
                  </SelectTrigger>
                  <SelectContent>
                    {agencyUsers.filter(u => u.role !== 'SUPER_ADMIN').map((u) => (
                      <SelectItem key={u.id} value={u.email}>
                        {u.name || "Sin nombre"} ({u.email})
                      </SelectItem>
                    ))}
                    {agencyUsers.length === 0 && (
                      <SelectItem value="empty" disabled>No hay usuarios en esta agencia</SelectItem>
                    )}
                  </SelectContent>
                </Select>

                <div className="flex gap-3">
                  <Input 
                    type="number" 
                    value={academiaUserDays} 
                    onChange={(e) => setAcademiaUserDays(parseInt(e.target.value))}
                    min={1}
                  />
                  <Button 
                    onClick={handleGiftAcademiaToUser} 
                    disabled={loading || !selectedUserEmail}
                    className="bg-teal-600 hover:bg-teal-700"
                  >
                    Regalar a Agente
                  </Button>
                </div>
              </div>
            </div>

          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-2">
          <Button variant="ghost" onClick={onClose}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
