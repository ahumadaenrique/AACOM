"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { addAgencySaaSDays, addAcademiaDaysToPromoter, addAcademiaDaysToUser, giftAcademiaMinutes, giftTipsCredits, resetAgencyStudyDays } from "./actions";
import { Gift, BookOpen, Monitor, Users, Sparkles, RefreshCw, Coins } from "lucide-react";
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
  const [saasDays, setSaasDays] = useState<number | "">(30);
  const [academiaAgencyDays, setAcademiaAgencyDays] = useState<number | "">(10);
  const [academiaUserDays, setAcademiaUserDays] = useState<number | "">(10);
  const [selectedUserEmail, setSelectedUserEmail] = useState<string>("");

  // AI Voice Minutes states
  const [aiAgencyMinutes, setAiAgencyMinutes] = useState<number | "">(30);
  const [aiUserMinutes, setAiUserMinutes] = useState<number | "">(15);
  const [selectedAiUserEmail, setSelectedAiUserEmail] = useState<string>("");

  // TIPS Credits states
  const [tipsAgencyCredits, setTipsAgencyCredits] = useState<number | "">(30);
  const [tipsUserCredits, setTipsUserCredits] = useState<number | "">(30);
  const [selectedTipsUserEmail, setSelectedTipsUserEmail] = useState<string>("");

  if (!agency) return null;

  const handleGiftSaaS = async () => {
    const val = Number(saasDays);
    if (!val || val <= 0) return alert("Ingresa una cantidad válida de días.");
    setLoading(true);
    try {
      const res = await addAgencySaaSDays(agency.id, val);
      if (res.success) {
        alert(res.message);
        onClose();
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
    setLoading(false);
  };

  const handleResetToPlanQuota = async () => {
    if (!confirm(`¿Restablecer el saldo de Cédula de ${agency.name} a su cuota garantizada por plan (ej. 52 días para Anual)?`)) return;
    setLoading(true);
    try {
      const res = await resetAgencyStudyDays(agency.id);
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
    const val = Number(academiaAgencyDays);
    if (!val || val <= 0) return alert("Ingresa una cantidad válida de días.");
    setLoading(true);
    try {
      const res = await addAcademiaDaysToPromoter(agency.id, val);
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
    const val = Number(academiaUserDays);
    if (!val || val <= 0) return alert("Ingresa una cantidad válida de días.");
    if (!selectedUserEmail) return alert("Selecciona un usuario.");
    setLoading(true);
    try {
      const res = await addAcademiaDaysToUser(selectedUserEmail, agency.id, val);
      if (res.success) {
        alert(res.message);
        onClose();
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
    setLoading(false);
  };

  const handleGiftAiToAgency = async () => {
    const val = Number(aiAgencyMinutes);
    if (!val || val <= 0) return alert("Ingresa una cantidad válida de minutos.");
    setLoading(true);
    try {
      const res = await giftAcademiaMinutes(agency.id, val);
      if (res.success) {
        alert(res.message);
        onClose();
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
    setLoading(false);
  };

  const handleGiftAiToUser = async () => {
    const val = Number(aiUserMinutes);
    if (!val || val <= 0) return alert("Ingresa una cantidad válida de minutos.");
    if (!selectedAiUserEmail) return alert("Selecciona un usuario.");
    setLoading(true);
    try {
      const res = await giftAcademiaMinutes(agency.id, val, selectedAiUserEmail);
      if (res.success) {
        alert(res.message);
        onClose();
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
    setLoading(false);
  };

  const handleGiftTipsToAgency = async () => {
    const val = Number(tipsAgencyCredits);
    if (!val || val <= 0) return alert("Ingresa una cantidad válida de créditos TIPS.");
    setLoading(true);
    try {
      const res = await giftTipsCredits(agency.id, val);
      if (res.success) {
        alert(res.message);
        onClose();
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
    setLoading(false);
  };

  const handleGiftTipsToUser = async () => {
    const val = Number(tipsUserCredits);
    if (!val || val <= 0) return alert("Ingresa una cantidad válida de créditos TIPS.");
    if (!selectedTipsUserEmail) return alert("Selecciona un usuario.");
    setLoading(true);
    try {
      const res = await giftTipsCredits(agency.id, val, selectedTipsUserEmail);
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
      <DialogContent className="sm:max-w-[540px] border-slate-200">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Gift className="w-5 h-5 text-indigo-500" />
            Regalos y Cortesías
          </DialogTitle>
          <DialogDescription>
            Otorgar beneficios a la agencia <strong className="text-slate-800">{agency.name}</strong>.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="saas" className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="saas" className="flex items-center gap-1.5 text-xs">
              <Monitor className="w-3.5 h-3.5" /> App SaaS
            </TabsTrigger>
            <TabsTrigger value="academia" className="flex items-center gap-1.5 text-xs">
              <BookOpen className="w-3.5 h-3.5" /> Cédulas
            </TabsTrigger>
            <TabsTrigger value="simulador" className="flex items-center gap-1.5 text-xs">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" /> Minutos IA
            </TabsTrigger>
            <TabsTrigger value="tips" className="flex items-center gap-1.5 text-xs">
              <Coins className="w-3.5 h-3.5 text-amber-500" /> TIPS
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
                  onChange={(e) => setSaasDays(e.target.value === "" ? "" : parseInt(e.target.value))}
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
                  onChange={(e) => setAcademiaAgencyDays(e.target.value === "" ? "" : parseInt(e.target.value))}
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
              <div className="pt-2 border-t border-indigo-100/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-[11px] text-slate-500">¿Requiere sincronizar a su plan? (52 anual / 25 semestral / 12 trimestral)</span>
                <Button
                  onClick={handleResetToPlanQuota}
                  disabled={loading}
                  size="sm"
                  variant="ghost"
                  className="text-xs text-indigo-700 hover:text-indigo-900 hover:bg-indigo-100 font-semibold flex items-center gap-1.5 h-8 shrink-0"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Restablecer a cuota de plan
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
                    onChange={(e) => setAcademiaUserDays(e.target.value === "" ? "" : parseInt(e.target.value))}
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

          {/* TAB: SIMULADOR IA */}
          <TabsContent value="simulador" className="space-y-4 pt-4">
            <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100 space-y-3">
              <Label className="text-purple-900 font-bold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-600" /> Bolsa Común de la Agencia (Minutos)
              </Label>
              <p className="text-xs text-purple-700">
                Minutos de práctica que cualquier agente de la promotoría puede consumir para entrenar en la Academia PRO.
              </p>
              <div className="flex gap-3">
                <Input 
                  type="number" 
                  value={aiAgencyMinutes} 
                  onChange={(e) => setAiAgencyMinutes(e.target.value === "" ? "" : parseInt(e.target.value))}
                  min={1}
                />
                <Button 
                  onClick={handleGiftAiToAgency} 
                  disabled={loading}
                  className="bg-purple-600 hover:bg-purple-700 shrink-0 text-white"
                >
                  Regalar a Agencia
                </Button>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
              <Label className="text-slate-700 font-bold">Directo a un Agente Específico</Label>
              <p className="text-xs text-slate-500">
                Minutos de saldo asignados exclusivamente a la cuenta del agente seleccionado.
              </p>
              <div className="space-y-3">
                <Select value={selectedAiUserEmail} onValueChange={setSelectedAiUserEmail}>
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
                    value={aiUserMinutes} 
                    onChange={(e) => setAiUserMinutes(e.target.value === "" ? "" : parseInt(e.target.value))}
                    min={1}
                  />
                  <Button 
                    onClick={handleGiftAiToUser} 
                    disabled={loading || !selectedAiUserEmail}
                    className="bg-indigo-600 hover:bg-indigo-700 shrink-0 text-white"
                  >
                    Asignar al Agente
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* TAB: CRÉDITOS TIPS */}
          <TabsContent value="tips" className="space-y-4 pt-4">
            <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-amber-950 font-bold flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-amber-600" /> Bolsa TIPS de la Promotoría
                </Label>
                <span className="text-[11px] font-bold bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full">
                  Saldo actual: {agency.tipsCreditsBalance || 0} cr
                </span>
              </div>
              <p className="text-xs text-amber-800">
                Créditos TIPS (vigencia 90 días) para la bolsa de la promotoría. El promotor decide con qué agentes los comparte.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {[15, 30, 70, 150].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setTipsAgencyCredits(preset)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition ${
                      Number(tipsAgencyCredits) === preset
                        ? "bg-amber-600 text-white border-amber-600"
                        : "bg-white text-amber-900 border-amber-200 hover:bg-amber-100"
                    }`}
                  >
                    +{preset} cr
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <Input 
                  type="number" 
                  value={tipsAgencyCredits} 
                  onChange={(e) => setTipsAgencyCredits(e.target.value === "" ? "" : parseInt(e.target.value))}
                  min={1}
                  placeholder="Ej. 30"
                />
                <Button 
                  onClick={handleGiftTipsToAgency} 
                  disabled={loading}
                  className="bg-amber-600 hover:bg-amber-700 shrink-0 text-white"
                >
                  Regalar a Promotoría
                </Button>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
              <Label className="text-slate-700 font-bold">Directo a un Agente o Promotor Específico</Label>
              <p className="text-xs text-slate-500">
                Créditos TIPS personales (vigencia 90 días) abonados directamente a la bolsa individual del usuario seleccionado.
              </p>
              <div className="space-y-3">
                <Select value={selectedTipsUserEmail} onValueChange={setSelectedTipsUserEmail}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un usuario de esta agencia..." />
                  </SelectTrigger>
                  <SelectContent>
                    {agencyUsers.filter(u => u.role !== 'SUPER_ADMIN').map((u) => (
                      <SelectItem key={u.id} value={u.email}>
                        {u.name || "Sin nombre"} ({u.email}) — {u.tipsCreditsBalance || 0} cr
                      </SelectItem>
                    ))}
                    {agencyUsers.length === 0 && (
                      <SelectItem value="empty" disabled>No hay usuarios en esta agencia</SelectItem>
                    )}
                  </SelectContent>
                </Select>

                <div className="flex flex-wrap gap-1.5">
                  {[10, 30, 70, 150].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setTipsUserCredits(preset)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition ${
                        Number(tipsUserCredits) === preset
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-indigo-50"
                      }`}
                    >
                      +{preset} cr
                    </button>
                  ))}
                </div>

                <div className="flex gap-3">
                  <Input 
                    type="number" 
                    value={tipsUserCredits} 
                    onChange={(e) => setTipsUserCredits(e.target.value === "" ? "" : parseInt(e.target.value))}
                    min={1}
                    placeholder="Ej. 30"
                  />
                  <Button 
                    onClick={handleGiftTipsToUser} 
                    disabled={loading || !selectedTipsUserEmail}
                    className="bg-indigo-600 hover:bg-indigo-700 shrink-0 text-white"
                  >
                    Regalar al Agente
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
