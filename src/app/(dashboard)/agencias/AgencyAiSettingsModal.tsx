"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bot, Key, KeyRound, Loader2, Save, ExternalLink, Sparkles, Cpu, PhoneCall } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface AgencyAiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  agencyId: string;
  agencyName: string;
}

export function AgencyAiSettingsModal({ isOpen, onClose, agencyId, agencyName }: AgencyAiSettingsModalProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [voiceId, setVoiceId] = useState("");
  const [voiceEngine, setVoiceEngine] = useState("GEMINI_LIVE");
  const [byokActive, setByokActive] = useState(true);
  const [voiceSecondsBalance, setVoiceSecondsBalance] = useState(0);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (isOpen && agencyId) {
      loadSettings();
    } else {
      setApiKey("");
      setVoiceId("");
      setVoiceEngine("GEMINI_LIVE");
      setByokActive(true);
      setVoiceSecondsBalance(0);
      setIsSuperAdmin(false);
      setSuccessMsg("");
      setErrorMsg("");
    }
  }, [isOpen, agencyId]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      const res = await fetch(`/api/agencies/${agencyId}/ai-settings`);
      if (!res.ok) throw new Error("Error al cargar configuración");
      const data = await res.json();
      
      setApiKey(data.elevenLabsApiKey || "");
      setVoiceId(data.elevenLabsVoiceId || "");
      setVoiceEngine(data.voiceEngine || "GEMINI_LIVE");
      setByokActive(data.byokActive ?? true);
      setVoiceSecondsBalance(data.voiceSecondsBalance || 0);
      setIsSuperAdmin(Boolean(data.isSuperAdmin));
    } catch (err: any) {
      setErrorMsg(err.message || "Error al cargar configuración");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setSuccessMsg("");
      setErrorMsg("");
      
      const res = await fetch(`/api/agencies/${agencyId}/ai-settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          elevenLabsApiKey: apiKey,
          elevenLabsVoiceId: voiceId,
          voiceEngine,
          byokActive
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar");

      setSuccessMsg("¡Configuración de IA guardada exitosamente!");
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Bot className="w-5 h-5 text-indigo-600" />
            Configuración IA (BYOK)
          </DialogTitle>
          <DialogDescription>
            Configura la API Key de ElevenLabs para <strong>{agencyName}</strong>. 
            La llave se encriptará con AES-256-GCM para máxima seguridad.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : (
          <div className="space-y-5 py-2">
            {/* Balance Badge */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-xs font-semibold text-slate-800">Bolsa de Minutos AACOM</p>
                  <p className="text-[11px] text-slate-500">Minutos de cortesía o paquetes prepagados asignados a esta agencia.</p>
                </div>
              </div>
              <span className="font-bold text-sm px-3 py-1 bg-white border border-slate-200 rounded-lg text-purple-700 shadow-sm">
                {Math.floor(voiceSecondsBalance / 60)} min
              </span>
            </div>

            {/* Motor de Voz (Engine Selector) */}
            <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-bold text-indigo-950 flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-indigo-600" /> Motor Conversacional Predeterminado
                  </Label>
                  <p className="text-xs text-indigo-700 mt-0.5">
                    Selecciona qué tecnología procesa las llamadas cuando se consumen minutos de la plataforma.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setVoiceEngine("GEMINI_LIVE")}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    voiceEngine === "GEMINI_LIVE"
                      ? "bg-white border-indigo-600 shadow-md ring-2 ring-indigo-500/20"
                      : "bg-white/60 border-slate-200 hover:bg-white text-slate-600"
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Google Gemini Live
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-tight">
                    Ultra rápido (~300ms), bajo costo y alta empatía conversacional.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setVoiceEngine("ELEVENLABS")}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    voiceEngine === "ELEVENLABS"
                      ? "bg-white border-purple-600 shadow-md ring-2 ring-purple-500/20"
                      : "bg-white/60 border-slate-200 hover:bg-white text-slate-600"
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                    <PhoneCall className="w-3.5 h-3.5 text-purple-600" /> ElevenLabs ConvAI
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-tight">
                    Voces clonadas personalizadas de catálogo ElevenLabs.
                  </p>
                </button>
              </div>
            </div>

            {/* BYOK Toggle */}
            <div className="p-4 border border-slate-200 rounded-xl space-y-3 bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="byokActive" className="text-sm font-bold text-slate-900">
                    Conexión BYOK (ElevenLabs Propio)
                  </Label>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Permite a la agencia usar su propia cuenta de ElevenLabs.
                  </p>
                </div>
                <Switch
                  id="byokActive"
                  checked={byokActive}
                  onCheckedChange={setByokActive}
                />
              </div>

              {!byokActive && (
                <div className="p-2.5 bg-amber-50 border border-amber-200/60 rounded-lg text-xs text-amber-800">
                  ⚠️ <strong>API Apagada:</strong> Tus agentes solo podrán usar el simulador si cuentas con saldo de minutos en AACOM. Si el saldo es 0, el módulo se bloqueará para ellos.
                </div>
              )}

              {byokActive && (
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="space-y-1.5">
                    <Label htmlFor="apiKey" className="text-xs font-semibold text-slate-700">ElevenLabs API Key</Label>
                    <Input
                      id="apiKey"
                      type="password"
                      placeholder="sk_..."
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="font-mono text-xs h-9"
                    />
                    <p className="text-[11px] text-slate-400">
                      Cifrado AES-256 en la bóveda de la base de datos.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-600 text-xs rounded-lg border border-red-100">
                {errorMsg}
              </div>
            )}
            
            {successMsg && (
              <div className="p-3 bg-emerald-50 text-emerald-700 text-xs rounded-lg border border-emerald-100">
                {successMsg}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 mt-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Guardar Configuración
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
