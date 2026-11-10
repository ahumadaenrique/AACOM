"use client";

import React, { useState, useEffect } from "react";
import { getAdminWhatsAppSettings, saveAdminWhatsAppSettings } from "@/app/actions";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CheckSquare, Square, Loader2, MessageSquare, Lock, CheckCircle2, ShieldCheck, Users } from "lucide-react";

export default function AdminWhatsAppSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [agencyName, setAgencyName] = useState("");
  const [agencyAuthorized, setAgencyAuthorized] = useState(false);
  const [agencyAdmins, setAgencyAdmins] = useState<{ id: string; name: string; email: string }[]>([]);
  const [selectedAdminId, setSelectedAdminId] = useState<string>("");
  const [waNotify10am, setWaNotify10am] = useState(false);
  const [waNotify6pm, setWaNotify6pm] = useState(false);
  const [phone, setPhone] = useState("");
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [agents, setAgents] = useState<{ id: string; name: string | null; email: string }[]>([]);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async (targetAdminId?: string) => {
    setLoading(true);
    setStatusMsg(null);
    try {
      const res = await getAdminWhatsAppSettings(targetAdminId);
      if (res.success) {
        setIsSuperAdmin(Boolean(res.isSuperAdmin));
        setAgencyName(res.agencyName || "Tu Agencia");
        setAgencyAuthorized(Boolean(res.agencyAuthorized));
        setAgencyAdmins(res.agencyAdmins || []);
        setSelectedAdminId(res.activeAdminId || "");
        setWaNotify10am(Boolean(res.waNotify10am));
        setWaNotify6pm(Boolean(res.waNotify6pm));
        setPhone(res.phone || "");
        setSelectedAgents(res.selectedAgents || []);
        setAgents(res.agents || []);
      }
    } catch (err) {
      console.error("Failed to load WhatsApp settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminChange = (newAdminId: string) => {
    setSelectedAdminId(newAdminId);
    loadSettings(newAdminId);
  };

  const handleToggleAgent = (agentId: string) => {
    setSelectedAgents((prev) =>
      prev.includes(agentId) ? prev.filter((id) => id !== agentId) : [...prev, agentId]
    );
  };

  const handleToggleAllAgents = () => {
    if (selectedAgents.length === agents.length) {
      setSelectedAgents([]);
    } else {
      setSelectedAgents(agents.map((a) => a.id));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setStatusMsg(null);
    try {
      const res = await saveAdminWhatsAppSettings({
        targetAdminId: selectedAdminId || undefined,
        agencyAuthorized: isSuperAdmin ? agencyAuthorized : undefined,
        waNotify10am,
        waNotify6pm,
        phone,
        selectedAgents,
      });
      if (res.success) {
        if (typeof res.agencyAuthorized === "boolean") setAgencyAuthorized(res.agencyAuthorized);
        if (res.phone !== undefined) setPhone(res.phone);
        if (res.selectedAgents) setSelectedAgents(res.selectedAgents);
        setStatusMsg({
          type: "success",
          text: res.message || "Configuración de WhatsApp actualizada correctamente.",
        });
      } else {
        setStatusMsg({
          type: "error",
          text: res.message || "No se pudo guardar la configuración.",
        });
      }
    } catch (err: any) {
      setStatusMsg({
        type: "error",
        text: err.message || "Error de conexión al guardar.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-5 border border-green-200 rounded-xl bg-green-50/30 flex items-center justify-center gap-2 text-green-800 text-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        Cargando configuración de reportes WhatsApp...
      </div>
    );
  }

  if (!agencyAuthorized && !isSuperAdmin) {
    return (
      <div className="p-5 border border-slate-200 rounded-xl bg-slate-50/80 flex items-start gap-3">
        <div className="p-2 rounded-lg bg-slate-200/70 text-slate-600 shrink-0 mt-0.5">
          <Lock className="h-4 w-4" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-slate-800">
            Reportes de WhatsApp (10:00 AM y 6:00 PM)
          </h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            El envío automático de reportes diarios por WhatsApp aún no está habilitado para tu agencia. Solicita su activación al administrador general de <span className="font-semibold">aacomsoft</span>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col p-5 border border-green-200 rounded-xl bg-green-50/30 gap-4 shadow-sm">
      {/* Cabecera de Agencia y Control Super Admin */}
      <div className="flex flex-col gap-3 pb-3 border-b border-green-200/70">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-green-900 bg-green-100/80 border border-green-300 px-2.5 py-1 rounded-full">
            <ShieldCheck className="h-3.5 w-3.5 text-green-700" />
            Agencia activa: {agencyName}
          </span>

          {isSuperAdmin && (
            <div className="flex items-center gap-2 bg-white/90 px-3 py-1.5 rounded-lg border border-green-300">
              <Label htmlFor="superAdminAuthorizeWa" className="text-xs font-bold text-green-900 cursor-pointer">
                Autorizar WhatsApp en esta Agencia
              </Label>
              <Switch
                id="superAdminAuthorizeWa"
                checked={agencyAuthorized}
                onCheckedChange={setAgencyAuthorized}
              />
            </div>
          )}
        </div>

        {isSuperAdmin && agencyAdmins.length > 0 && (
          <div className="space-y-1">
            <Label htmlFor="selectAgencyAdmin" className="text-xs font-bold text-green-900 flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-green-700" />
              Configurando Administrador de {agencyName}:
            </Label>
            <select
              id="selectAgencyAdmin"
              value={selectedAdminId}
              onChange={(e) => handleAdminChange(e.target.value)}
              className="w-full h-9 rounded-md border border-green-300 bg-white px-3 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-green-600"
            >
              {agencyAdmins.map((adm) => (
                <option key={adm.id} value={adm.id}>
                  {adm.name} ({adm.email})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Switch 10:00 AM */}
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-0.5">
          <Label
            htmlFor="waNotify10am"
            className="text-base font-semibold text-green-900 flex items-center gap-2 cursor-pointer"
          >
            <MessageSquare className="h-4 w-4 text-green-700" />
            Reporte Planeación WhatsApp (10:00 AM)
          </Label>
          <p className="text-xs text-green-700">
            Envía un mensaje diario a las 10am con los 25pts planeados.
          </p>
        </div>
        <Switch
          id="waNotify10am"
          checked={waNotify10am}
          onCheckedChange={setWaNotify10am}
        />
      </div>

      {/* Switch 6:00 PM */}
      <div className="flex items-center justify-between gap-4 pt-3 border-t border-green-200/60">
        <div className="space-y-0.5">
          <Label
            htmlFor="waNotify6pm"
            className="text-base font-semibold text-green-900 flex items-center gap-2 cursor-pointer"
          >
            <MessageSquare className="h-4 w-4 text-green-700" />
            Reporte Puntos Reales WhatsApp (6:00 PM)
          </Label>
          <p className="text-xs text-green-700">
            Envía un mensaje diario a las 6pm con el número real de puntos que llevan tus agentes (de los 25pts).
          </p>
        </div>
        <Switch
          id="waNotify6pm"
          checked={waNotify6pm}
          onCheckedChange={setWaNotify6pm}
        />
      </div>

      {/* Configuración compartida: Teléfono del Admin y Lista de Agentes */}
      <div className="flex flex-col gap-4 pt-3 border-t border-green-200/60">
        <div className="space-y-1.5">
          <Label htmlFor="adminWaPhone" className="text-xs text-green-900 font-bold">
            Teléfono Registrado del Administrador (WhatsApp Destino)
          </Label>
          <Input
            id="adminWaPhone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+525540884207"
            className="h-9 text-sm bg-white border-green-200 focus-visible:ring-green-600"
          />
          <p className="text-[11px] text-green-700">
            Los reportes llegarán directamente a este número registrado. Debe incluir código de país (ej. +52). Cada administrador de la agencia puede configurar su propio número sin límite.
          </p>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-green-900 font-bold">
              Agentes Incluidos en el Reporte ({selectedAgents.length} de {agents.length})
            </Label>
            {agents.length > 0 && (
              <button
                type="button"
                onClick={handleToggleAllAgents}
                className="text-[11px] font-semibold text-green-800 hover:text-green-950 underline"
              >
                {selectedAgents.length === agents.length ? "Desmarcar todos" : "Seleccionar todos"}
              </button>
            )}
          </div>

          <div className="flex flex-col gap-1 max-h-44 overflow-y-auto border border-green-200 rounded-md p-2 bg-white/80">
            {agents.length === 0 ? (
              <p className="text-xs text-muted-foreground p-2 text-center">
                No hay agentes activos en {agencyName}.
              </p>
            ) : (
              agents.map((agent) => {
                const isSelected = selectedAgents.includes(agent.id);
                return (
                  <label
                    key={agent.id}
                    className="flex items-center gap-2.5 cursor-pointer p-1.5 hover:bg-green-100/50 rounded transition-colors"
                  >
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={isSelected}
                      onChange={() => handleToggleAgent(agent.id)}
                    />
                    {isSelected ? (
                      <CheckSquare className="h-4 w-4 text-green-600 shrink-0" />
                    ) : (
                      <Square className="h-4 w-4 text-slate-300 shrink-0" />
                    )}
                    <span className="text-xs text-slate-700 font-medium">
                      {agent.name || agent.email}
                    </span>
                  </label>
                );
              })
            )}
          </div>
          <p className="text-[11px] text-green-700">
            Esta lista aplica tanto para el reporte de las 10:00 AM como para el de las 6:00 PM.
          </p>
        </div>

        {statusMsg && (
          <div
            className={`p-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 ${
              statusMsg.type === "success"
                ? "bg-green-100 text-green-800 border border-green-300"
                : "bg-red-50 text-red-600 border border-red-200"
            }`}
          >
            {statusMsg.type === "success" && <CheckCircle2 className="h-4 w-4 shrink-0" />}
            <span>{statusMsg.text}</span>
          </div>
        )}

        <div className="flex justify-end pt-1">
          <Button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar Configuración WhatsApp
          </Button>
        </div>
      </div>
    </div>
  );
}
