"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  KeyRound,
  ShieldCheck,
  Plus,
  Trash2,
  MessageCircle,
  Copy,
  Check,
  FileUp,
  Loader2,
  Sparkles,
  Phone,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  provisionClientPortalUser,
  createClientPortalItem,
  assignTemplateToClient,
  deleteClientPortalItem,
} from "@/app/(dashboard)/mi-portal/actions";
import { useRouter } from "next/navigation";

interface ClientPortalManagerDialogProps {
  client: any;
  agentTemplates?: any[];
  agencySlug?: string;
}

export default function ClientPortalManagerDialog({
  client,
  agentTemplates = [],
  agencySlug = "app",
}: ClientPortalManagerDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"acceso" | "instructivos" | "polizas">("acceso");

  // Estado de Acceso
  const [email, setEmail] = useState<string>(client.email || "");
  const [tempPassword, setTempPassword] = useState<string>("");
  const [portalEnabled, setPortalEnabled] = useState<boolean>(
    client.portalEnabled !== undefined ? Boolean(client.portalEnabled) : true
  );
  const [welcomeNote, setWelcomeNote] = useState<string>(client.portalWelcomeNote || "");
  const [hiddenPolicyIds, setHiddenPolicyIds] = useState<string[]>(() => {
    try {
      if (client.portalHiddenPolicyIds) {
        const parsed = JSON.parse(client.portalHiddenPolicyIds);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  const [savingAccess, setSavingAccess] = useState(false);
  const [lastProvisioned, setLastProvisioned] = useState<{
    email: string;
    tempPass?: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Estado de Nuevo Instructivo para este cliente
  const [category, setCategory] = useState("SINIESTRO");
  const [ramo, setRamo] = useState("GENERAL");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [saveAsTemplateToo, setSaveAsTemplateToo] = useState(false);
  const [savingItem, setSavingItem] = useState(false);

  const generateRandomTempPass = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    let res = "Seg-";
    for (let i = 0; i < 6; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setTempPassword(res);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      setFeedback({ type: "error", text: "El archivo no debe superar 4 MB." });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setFileUrl(reader.result);
        setFileName(file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setSavingAccess(true);
    try {
      const res = await provisionClientPortalUser({
        clientId: client.id,
        email,
        temporaryPassword: tempPassword,
        portalEnabled,
        portalWelcomeNote: welcomeNote,
        hiddenPolicyIds,
      });

      if (res.success) {
        setLastProvisioned({
          email: res.loginEmail!,
          tempPass: res.temporaryPassword,
        });
        setFeedback({
          type: "success",
          text: res.temporaryPassword
            ? "¡Acceso creado/actualizado! El cliente deberá cambiar su contraseña temporal al iniciar sesión."
            : "¡Configuración del portal del cliente guardada!",
        });
        router.refresh();
      } else {
        setFeedback({ type: "error", text: res.message || "Error al guardar." });
      }
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Error inesperado." });
    } finally {
      setSavingAccess(false);
    }
  };

  const handleCreateInstruction = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setSavingItem(true);
    try {
      const res = await createClientPortalItem({
        clientId: client.id,
        isTemplate: false,
        category,
        ramo,
        title,
        description,
        content,
        emergencyPhone,
        externalUrl,
        fileUrl,
        fileName,
      });

      if (saveAsTemplateToo && res.success) {
        await createClientPortalItem({
          clientId: null,
          isTemplate: true,
          category,
          ramo,
          title,
          description,
          content,
          emergencyPhone,
          externalUrl,
          fileUrl,
          fileName,
        });
      }

      if (res.success) {
        setTitle("");
        setDescription("");
        setContent("");
        setEmergencyPhone("");
        setExternalUrl("");
        setFileUrl("");
        setFileName("");
        setFeedback({
          type: "success",
          text: "Instructivo agregado al portal de este cliente.",
        });
        router.refresh();
      } else {
        setFeedback({ type: "error", text: res.message || "No se pudo guardar." });
      }
    } finally {
      setSavingItem(false);
    }
  };

  const handleAssignTemplate = async (templateId: string) => {
    setFeedback(null);
    const res = await assignTemplateToClient(templateId, client.id);
    if (res.success) {
      setFeedback({ type: "success", text: "Plantilla asignada a este cliente." });
      router.refresh();
    } else {
      setFeedback({ type: "error", text: res.message || "Error al asignar." });
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    await deleteClientPortalItem(itemId, client.id);
    router.refresh();
  };

  const togglePolicyVisibility = (policyId: string) => {
    setHiddenPolicyIds((prev) =>
      prev.includes(policyId) ? prev.filter((id) => id !== policyId) : [...prev, policyId]
    );
  };

  const portalUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/login`
      : `https://${agencySlug}.aacomsoft.com/login`;

  const cleanPhone = (client.phone || "").replace(/\D/g, "");
  const waPhone = cleanPhone.length === 10 ? `52${cleanPhone}` : cleanPhone;

  const whatsappShareText = `Hola ${client.name}, te comparto tu acceso personal a tu *Portal de Asegurado* donde podrás consultar y descargar tus pólizas, fechas de vigencia e instructivos en caso de siniestro:\n\n🔗 *Portal:* ${portalUrl}\n👤 *Usuario:* ${email}\n🔑 *Contraseña temporal:* ${
    lastProvisioned?.tempPass || tempPassword || "(Asignada)"
  }\n\n⚠️ *Importante:* Al ingresar por primera vez, el sistema te pedirá elegir una contraseña personal que sí recuerdes.`;

  const clientItems = (client.portalItems || []) as any[];
  const policies = (client.policies || []) as any[];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-teal-600 hover:bg-teal-700 text-white font-bold gap-2 shadow-sm">
          <KeyRound className="w-4 h-4" />
          Portal del Cliente {client.portalUserId ? "(Activo)" : "(Crear Acceso)"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-teal-600" />
            Portal Personalizado del Cliente: {client.name}
          </DialogTitle>
          <DialogDescription>
            Crea su usuario y contraseña temporal, elige qué pólizas puede ver y súbele instructivos o pasos de siniestro exclusivos para este asegurado.
          </DialogDescription>
        </DialogHeader>

        {/* Pestañas internas */}
        <div className="flex gap-2 border-b pb-2 mt-2">
          <button
            type="button"
            onClick={() => setActiveTab("acceso")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "acceso"
                ? "bg-teal-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            1. Usuario y Contraseña Temporal
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("instructivos")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "instructivos"
                ? "bg-teal-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            2. Instructivos y Siniestros ({clientItems.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("polizas")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "polizas"
                ? "bg-teal-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            3. Pólizas Visibles ({policies.length - hiddenPolicyIds.length}/{policies.length})
          </button>
        </div>

        {feedback && (
          <div
            className={`p-3 rounded-xl text-xs font-semibold ${
              feedback.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {feedback.text}
          </div>
        )}

        {/* TAB 1: ACCESO Y CONTRASEÑA TEMPORAL */}
        {activeTab === "acceso" && (
          <form onSubmit={handleSaveAccess} className="space-y-4 pt-2">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">
                  Correo / Usuario de Acceso del Cliente
                </Label>
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="cliente@correo.com"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">
                  {client.portalUserId
                    ? "Nueva Contraseña Temporal (opcional para resetear)"
                    : "Contraseña Temporal Inicial"}
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    required={!client.portalUserId}
                    value={tempPassword}
                    onChange={(e) => setTempPassword(e.target.value)}
                    placeholder="Mín. 6 caracteres"
                    className="font-mono"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={generateRandomTempPass}
                    className="shrink-0 text-xs font-bold"
                  >
                    Generar
                  </Button>
                </div>
                <p className="text-[11px] text-slate-500">
                  Al entrar por primera vez, el sistema lo obligará a cambiarla por una que sí vaya a recordar.
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">
                Nota de Bienvenida o Indicaciones Generales para {client.name} (Opcional)
              </Label>
              <textarea
                rows={3}
                value={welcomeNote}
                onChange={(e) => setWelcomeNote(e.target.value)}
                placeholder="Ej. Hola Carlos, aquí tienes siempre a la mano tus pólizas de Gastos Médicos y Autos. En caso de urgencia llámame primero a mi celular..."
                className="w-full rounded-md border border-slate-200 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div>
                <span className="text-sm font-bold text-slate-800 block">
                  Estado del Portal para este Cliente
                </span>
                <span className="text-xs text-slate-500">
                  Puedes habilitar o pausar el acceso de este cliente cuando quieras.
                </span>
              </div>
              <Button
                type="button"
                variant={portalEnabled ? "default" : "outline"}
                onClick={() => setPortalEnabled(!portalEnabled)}
                className={portalEnabled ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}
              >
                {portalEnabled ? "Acceso Habilitado" : "Acceso Pausado"}
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <Button
                type="submit"
                disabled={savingAccess}
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold"
              >
                {savingAccess ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" /> Guardando...
                  </>
                ) : (
                  "Guardar Usuario y Configuración"
                )}
              </Button>

              {(client.portalUserId || lastProvisioned) && (
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(whatsappShareText);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="gap-1.5 text-xs font-semibold"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    Copiar Accesos
                  </Button>
                  {waPhone.length >= 10 && (
                    <a
                      href={`https://wa.me/${waPhone}?text=${encodeURIComponent(whatsappShareText)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button
                        type="button"
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 text-xs"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        Enviar Accesos por WhatsApp
                      </Button>
                    </a>
                  )}
                </div>
              )}
            </div>
          </form>
        )}

        {/* TAB 2: INSTRUCTIVOS Y GUÍAS DE SINIESTRO POR CLIENTE */}
        {activeTab === "instructivos" && (
          <div className="space-y-6 pt-2">
            {/* Plantillas rápidas del agente */}
            {agentTemplates.length > 0 && (
              <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-4 space-y-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Asignar Instructivo de tu Biblioteca en 1 Clic
                </span>
                <div className="flex flex-wrap gap-2">
                  {agentTemplates.map((tpl) => (
                    <Button
                      key={tpl.id}
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleAssignTemplate(tpl.id)}
                      className="bg-white text-xs font-semibold border-indigo-200 hover:bg-indigo-100"
                    >
                      <Plus className="w-3 h-3 mr-1 text-indigo-600" />
                      {tpl.title}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Lista de instructivos actuales de este cliente */}
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-slate-800">
                Instructivos configurados actualmente para {client.name} ({clientItems.length})
              </h4>
              {clientItems.length === 0 ? (
                <p className="text-xs text-slate-500 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  Aún no has agregado instructivos específicos para este cliente. Usa el formulario de abajo para subirle una guía de siniestro, pasos de reembolso o PDF.
                </p>
              ) : (
                <div className="space-y-2">
                  {clientItems.map((it) => (
                    <div
                      key={it.id}
                      className="flex items-start justify-between gap-3 p-3.5 rounded-xl border border-slate-200 bg-white"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-[10px]">
                            {it.category}
                          </Badge>
                          <strong className="text-sm text-slate-900">{it.title}</strong>
                        </div>
                        {it.description && (
                          <p className="text-xs text-slate-600">{it.description}</p>
                        )}
                        {it.emergencyPhone && (
                          <p className="text-xs text-red-600 font-semibold flex items-center gap-1">
                            <Phone className="w-3 h-3" /> Emergencia: {it.emergencyPhone}
                          </p>
                        )}
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteItem(it.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Formulario para agregar nuevo instructivo personalizado */}
            <form
              onSubmit={handleCreateInstruction}
              className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-200"
            >
              <h4 className="text-sm font-extrabold text-slate-900">
                + Agregar Nuevo Instructivo / Guía en Caso de Siniestro para {client.name}
              </h4>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-bold">Tipo de Instructivo</Label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold"
                  >
                    <option value="SINIESTRO">🚨 Qué hacer en caso de Siniestro</option>
                    <option value="REEMBOLSO">💳 Guía de Reembolso / Formatos</option>
                    <option value="RED_MEDICA">🏥 Red Hospitalaria / Talleres</option>
                    <option value="INSTRUCTIVO">📘 Instructivo General de Póliza</option>
                    <option value="CONTACTO_EMERGENCIA">📞 Teléfonos de Emergencia Aseguradora</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold">Ramo Relacionado</Label>
                  <select
                    value={ramo}
                    onChange={(e) => setRamo(e.target.value)}
                    className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold"
                  >
                    <option value="GENERAL">General / Todas sus pólizas</option>
                    <option value="GMM_INDIVIDUAL">Gastos Médicos Mayores (GMM)</option>
                    <option value="AUTOS">Seguro de Autos</option>
                    <option value="VIDA_INDIVIDUAL">Seguro de Vida / Ahorro</option>
                    <option value="DANOS_HOGAR">Hogar / Daños</option>
                  </select>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-bold">Título del Instructivo *</Label>
                  <Input
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ej. Pasos en caso de Accidente Automovilístico Quálitas"
                    className="bg-white h-9 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold">Teléfono Cabina de Siniestros (Opcional)</Label>
                  <Input
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                    placeholder="Ej. 800 800 2880"
                    className="bg-white h-9 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold">
                  Instrucciones paso a paso para el cliente
                </Label>
                <textarea
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="1. Mantén la calma y ten a la mano tu número de póliza.&#10;2. Llama a la cabina o escríbeme por WhatsApp.&#10;3. Si ingresas a hospital, solicita el formato de Informe Médico..."
                  className="w-full rounded-md border border-slate-200 bg-white p-2.5 text-sm"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-bold">Adjuntar PDF o Imagen (Opcional)</Label>
                  <Input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={handleFileChange}
                    className="bg-white h-9 text-xs"
                  />
                  {fileName && (
                    <span className="text-[11px] text-emerald-700 font-semibold block">
                      Archivo listo: {fileName}
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold">Enlace Externo / Red Médica (Opcional)</Label>
                  <Input
                    value={externalUrl}
                    onChange={(e) => setExternalUrl(e.target.value)}
                    placeholder="https://..."
                    className="bg-white h-9 text-sm"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-700 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={saveAsTemplateToo}
                  onChange={(e) => setSaveAsTemplateToo(e.target.checked)}
                  className="rounded border-slate-300"
                />
                Guardar también en mi Biblioteca de Plantillas para poder asignarlo en 1 clic a otros clientes.
              </label>

              <Button
                type="submit"
                disabled={savingItem}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
              >
                {savingItem ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> Guardando...
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5 mr-1.5" /> Agregar Instructivo al Cliente
                  </>
                )}
              </Button>
            </form>
          </div>
        )}

        {/* TAB 3: CONTROL DE PÓLIZAS VISIBLES PARA ESTE CLIENTE */}
        {activeTab === "polizas" && (
          <div className="space-y-4 pt-2">
            <p className="text-xs text-slate-600">
              Selecciona cuáles de las pólizas registradas para <strong>{client.name}</strong> quieres que sean visibles dentro de su Portal de Cliente:
            </p>
            {policies.length === 0 ? (
              <p className="text-xs text-slate-500">
                Este cliente aún no tiene pólizas cargadas.
              </p>
            ) : (
              <div className="space-y-2">
                {policies.map((pol) => {
                  const isHidden = hiddenPolicyIds.includes(pol.id);
                  return (
                    <div
                      key={pol.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white"
                    >
                      <div>
                        <p className="text-sm font-bold text-slate-900">
                          {pol.insuranceCompany || "Aseguradora"} — #{pol.policyNumber}
                        </p>
                        <p className="text-xs text-slate-500">
                          {pol.product || pol.ramo} • {pol.pdfUrl ? "Con Carátula PDF" : "Sin PDF"}
                        </p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant={isHidden ? "outline" : "default"}
                        onClick={() => togglePolicyVisibility(pol.id)}
                        className={
                          isHidden
                            ? "text-slate-500"
                            : "bg-emerald-600 hover:bg-emerald-700 text-white"
                        }
                      >
                        {isHidden ? (
                          <>
                            <EyeOff className="w-3.5 h-3.5 mr-1.5" /> Oculta en Portal
                          </>
                        ) : (
                          <>
                            <Eye className="w-3.5 h-3.5 mr-1.5" /> Visible en Portal
                          </>
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
            <Button
              type="button"
              onClick={handleSaveAccess}
              disabled={savingAccess}
              className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs"
            >
              Guardar Visibilidad de Pólizas
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
