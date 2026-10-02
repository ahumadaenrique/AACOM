"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bot, Key, KeyRound, Loader2, Save, ExternalLink } from "lucide-react";

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
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (isOpen && agencyId) {
      loadSettings();
    } else {
      setApiKey("");
      setVoiceId("");
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
          elevenLabsVoiceId: voiceId
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar");

      setSuccessMsg("¡Configuración de IA encriptada y guardada exitosamente!");
      setTimeout(() => {
        onClose();
      }, 2000);
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
          <div className="space-y-6 py-2">
            
            {/* Guide Banner */}
            <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 text-sm text-indigo-900">
              <p className="font-semibold mb-1 flex items-center gap-1">
                <KeyRound className="w-4 h-4" /> ¿Cómo obtener tu API Key?
              </p>
              <ol className="list-decimal pl-5 space-y-1 mt-2 text-indigo-800">
                <li>Crea una cuenta en <a href="https://elevenlabs.io" target="_blank" rel="noreferrer" className="underline font-medium hover:text-indigo-600">ElevenLabs.io</a>.</li>
                <li>Haz clic en tu Perfil (esquina inferior izquierda) y ve a <strong>Profile &gt; API Keys</strong>.</li>
                <li>Genera una nueva llave, cópiala y pégala aquí abajo.</li>
              </ol>
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiKey" className="font-semibold text-slate-700">ElevenLabs API Key</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="sk_..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="font-mono text-sm"
              />
              <p className="text-xs text-slate-500">
                Al guardar, la llave se almacena cifrada en la bóveda de base de datos.
                Si ves <code>sk-...</code> seguido de asteriscos o caracteres aleatorios, ya hay una llave cifrada configurada.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-100">
                {errorMsg}
              </div>
            )}
            
            {successMsg && (
              <div className="p-3 bg-emerald-50 text-emerald-700 text-sm rounded-md border border-emerald-100">
                {successMsg}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 mt-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || loading || !apiKey}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando Segura...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Guardar API Key
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
