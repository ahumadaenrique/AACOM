"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Mail,
  Inbox,
  Send,
  FileEdit,
  Trash2,
  FolderGit2,
  FileText,
  Smartphone,
  Plus,
  Search,
  Star,
  ArrowLeft,
  Reply,
  CheckCircle2,
  Settings,
  Download,
  Copy,
  Check,
  Loader2,
  ShieldCheck,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  sendCorporateEmailAction,
  simulateIncomingClientEmailAction,
  updateEmailMessageStatusAction,
} from "@/app/(dashboard)/correos-corporativos/actions";

type FolderKey = "INBOX" | "SENT" | "DRAFTS" | "TRASH" | "MIGRATED";

export function AgentWebmailClient({ initialData }: { initialData: any }) {
  const router = useRouter();
  const [selectedFolder, setSelectedFolder] = useState<FolderKey>("INBOX");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(
    initialData.messages?.[0]?.id || null
  );
  const [mobileReadingView, setMobileReadingView] = useState<boolean>(false);

  // Modal: Redactar / Enviar Póliza
  const [composeOpen, setComposeOpen] = useState<boolean>(false);
  const [composePolicyMode, setComposePolicyMode] = useState<boolean>(false);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [selectedPolicyId, setSelectedPolicyId] = useState<string>("");
  const [toEmail, setToEmail] = useState<string>("");
  const [ccEmail, setCcEmail] = useState<string>("");
  const [subject, setSubject] = useState<string>("");
  const [bodyText, setBodyText] = useState<string>("");
  const [sending, setSending] = useState<boolean>(false);

  // Modal: Sincronizar con iPhone / Android
  const [mobileSyncOpen, setMobileSyncOpen] = useState<boolean>(false);
  const [mobileConfigData, setMobileConfigData] = useState<any | null>(null);
  const [loadingMobileConfig, setLoadingMobileConfig] = useState<boolean>(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Estado general
  const [toastMsg, setToastMsg] = useState<string>("");
  const [simulating, setSimulating] = useState<boolean>(false);

  const selectedMailbox = initialData.selectedMailbox;
  const accessibleMailboxes: any[] = initialData.accessibleMailboxes || [];
  const messages: any[] = initialData.messages || [];
  const clients: any[] = initialData.clients || [];
  const policies: any[] = initialData.policies || [];
  const activeForwards: any[] = initialData.activeForwards || [];

  const filteredMessages = useMemo(() => {
    return messages.filter((m) => {
      if (m.folder !== selectedFolder) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        (m.subject || "").toLowerCase().includes(q) ||
        (m.fromAddress || "").toLowerCase().includes(q) ||
        (m.fromName || "").toLowerCase().includes(q) ||
        (m.toAddresses || "").toLowerCase().includes(q) ||
        (m.snippet || "").toLowerCase().includes(q)
      );
    });
  }, [messages, selectedFolder, searchQuery]);

  const activeMessage = useMemo(() => {
    return (
      filteredMessages.find((m) => m.id === selectedMessageId) ||
      filteredMessages[0] ||
      null
    );
  }, [filteredMessages, selectedMessageId]);

  const unreadInboxCount = useMemo(
    () => messages.filter((m) => m.folder === "INBOX" && !m.isRead).length,
    [messages]
  );
  const migratedCount = useMemo(
    () => messages.filter((m) => m.folder === "MIGRATED").length,
    [messages]
  );

  const handleOpenCompose = (withPolicyTemplate: boolean) => {
    setComposePolicyMode(withPolicyTemplate);
    setSelectedClientId("");
    setSelectedPolicyId("");
    setToEmail("");
    setCcEmail("");
    if (withPolicyTemplate) {
      setSubject(`📄 Entrega de Póliza y Expediente | ${initialData.agency.name}`);
      setBodyText(
        `Estimado(a) asegurado(a),\n\nPor medio del presente correo oficial de ${initialData.agency.name} te comparto los datos de tu póliza vigente.\n\nQuedo a tu entera disposición para cualquier duda, endoso o siniestro.\n\nAtentamente,\n${selectedMailbox?.displayName || initialData.currentUser.name}\n${selectedMailbox?.emailAddress || ""}`
      );
    } else {
      setSubject("");
      setBodyText(
        `\n\n--\n${selectedMailbox?.displayName || initialData.currentUser.name}\n${initialData.agency.name}\n📧 ${selectedMailbox?.emailAddress || ""}`
      );
    }
    setComposeOpen(true);
  };

  const handleSelectClientForPolicy = (clientId: string) => {
    setSelectedClientId(clientId);
    const client = clients.find((c) => c.id === clientId);
    if (client?.email) {
      setToEmail(client.email);
    }
    const clientPolicies = policies.filter((p) => p.clientId === clientId);
    if (clientPolicies.length > 0) {
      handleSelectPolicyForTemplate(clientPolicies[0].id, client);
    }
  };

  const handleSelectPolicyForTemplate = (policyId: string, overrideClient?: any) => {
    setSelectedPolicyId(policyId);
    const policy = policies.find((p) => p.id === policyId);
    if (!policy) return;

    const client =
      overrideClient ||
      clients.find((c) => c.id === policy.clientId) ||
      clients.find((c) => c.id === selectedClientId);

    if (client?.email) {
      setToEmail(client.email);
    }

    const clientDisplayName =
      client?.name || policy.contractor || policy.insured || "Asegurado";
    const insurerName = policy.insuranceCompany || policy.insurer || "Aseguradora";
    const productName = policy.product || policy.ramo || "Seguro";
    const renewalStr = policy.renewalDate
      ? new Date(policy.renewalDate).toLocaleDateString("es-MX")
      : "Anual";

    setSubject(
      `📄 Póliza ${policy.policyNumber} (${insurerName} - ${productName}) | ${initialData.agency.name}`
    );

    setBodyText(
      `Hola ${clientDisplayName},\n\nTe envío desde mi correo corporativo oficial en AACOMSoft el resumen y expediente de tu póliza:\n\n• Número de Póliza: ${policy.policyNumber}\n• Aseguradora: ${insurerName}\n• Plan / Ramo: ${productName}\n• Contratante / Asegurado: ${policy.insured || clientDisplayName}\n• Fecha de Renovación: ${renewalStr}${
        policy.pdfUrl ? `\n• Descarga directa de carátula PDF: ${policy.pdfUrl}` : ""
      }\n\nPor favor conserva este correo para cualquier trámite, renovación o asistencia en siniestros.\n\nSaludos cordiales,\n${selectedMailbox?.displayName || initialData.currentUser.name}\n${initialData.agency.name}\n📧 ${selectedMailbox?.emailAddress || ""}`
    );
  };

  const handleReply = (msg: any) => {
    setComposePolicyMode(false);
    setToEmail(msg.fromAddress);
    setCcEmail("");
    setSubject(
      msg.subject?.toLowerCase().startsWith("re:") ? msg.subject : `Re: ${msg.subject}`
    );
    setBodyText(
      `\n\n---\nEl ${new Date(msg.receivedAt).toLocaleString("es-MX")}, ${
        msg.fromName || msg.fromAddress
      } escribió:\n> ${(msg.bodyText || msg.snippet || "").replace(/\n/g, "\n> ")}`
    );
    setComposeOpen(true);
  };

  const handleSendEmail = async (saveAsDraft: boolean) => {
    if (!selectedMailbox) return;
    if (!saveAsDraft && !toEmail.trim()) {
      alert("Por favor ingresa el correo del destinatario.");
      return;
    }

    setSending(true);
    try {
      const htmlFormatted = `<div style="font-family: sans-serif; color: #1e293b; line-height: 1.6; white-space: pre-wrap;">${bodyText
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")}</div>`;

      await sendCorporateEmailAction({
        mailboxId: selectedMailbox.id,
        to: toEmail,
        cc: ccEmail,
        subject: subject || "(Sin asunto)",
        bodyHtml: htmlFormatted,
        bodyText,
        relatedClientId: selectedClientId || undefined,
        relatedPolicyId: selectedPolicyId || undefined,
        saveAsDraft,
        targetAgencyId: initialData.agency.id,
      });

      setComposeOpen(false);
      setToastMsg(
        saveAsDraft
          ? "✓ Borrador guardado correctamente."
          : `✓ Correo enviado desde ${selectedMailbox.emailAddress}`
      );
      window.location.reload();
    } catch (err: any) {
      alert(err.message || "Error al enviar el correo.");
    } finally {
      setSending(false);
    }
  };

  const handleSelectMessage = async (msg: any) => {
    setSelectedMessageId(msg.id);
    setMobileReadingView(true);
    if (!msg.isRead) {
      try {
        await updateEmailMessageStatusAction({
          messageId: msg.id,
          isRead: true,
          targetAgencyId: initialData.agency.id,
        });
      } catch {
        // Ignore non-critical read status error
      }
    }
  };

  const handleMoveToTrash = async (msgId: string) => {
    await updateEmailMessageStatusAction({
      messageId: msgId,
      moveToFolder: "TRASH",
      targetAgencyId: initialData.agency.id,
    });
    window.location.reload();
  };

  const handleOpenMobileSyncModal = async () => {
    if (!selectedMailbox) return;
    setMobileSyncOpen(true);
    setLoadingMobileConfig(true);
    try {
      const res = await fetch(
        `/api/corporate-email/mobileconfig?mailboxId=${encodeURIComponent(
          selectedMailbox.id
        )}&format=json`
      );
      if (res.ok) {
        const json = await res.json();
        setMobileConfigData(json);
      }
    } catch {
      // Fallback
    } finally {
      setLoadingMobileConfig(false);
    }
  };

  const handleCopyText = (key: string, val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedField(key);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSimulateIncoming = async () => {
    if (!selectedMailbox) return;
    setSimulating(true);
    try {
      await simulateIncomingClientEmailAction({
        toEmail: selectedMailbox.emailAddress,
        targetAgencyId: initialData.agency.id,
      });
      window.location.reload();
    } catch (err: any) {
      alert(err.message || "Error simulando recepción");
    } finally {
      setSimulating(false);
    }
  };

  // Si aún no tiene buzón asignado en la promotoría
  if (!selectedMailbox) {
    return (
      <div className="max-w-3xl mx-auto py-10">
        <div className="rounded-3xl border border-sky-200 bg-white p-8 text-center shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto">
            <Mail className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">
            📧 Mi Correo Corporativo en AACOMSoft
          </h1>
          <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
            {initialData.currentUser?.isAdmin
              ? `Tu promotoría (${initialData.agency.name}) aún no ha activado su dominio oficial o no tiene buzones creados. Activa tus 20 buzones de 10 GB en 1 clic desde el panel de administración.`
              : `El administrador de tu promotoría (${initialData.agency.name}) aún no ha vinculado tu buzón corporativo personal. Solicítale que te asigne uno de los 20 lugares disponibles.`}
          </p>
          {initialData.currentUser?.isAdmin && (
            <div className="pt-2">
              <Link
                href={`/correos-corporativos?agencyId=${encodeURIComponent(
                  initialData.agency.id
                )}`}
              >
                <Button className="bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl h-11 px-6">
                  <Settings className="w-4 h-4 mr-2" />
                  Ir a Administrar Dominio y 20 Buzones
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 max-w-7xl mx-auto">
      {/* Barra Superior Mobile-First */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-4 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-sky-600 text-white shadow-sm">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-black text-slate-900">
                  📧 Mi Correo
                </h1>
                <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                  10 GB Titan Email
                </Badge>
              </div>
              <div className="text-xs font-mono font-bold text-sky-700">
                {selectedMailbox.emailAddress}
              </div>
            </div>
          </div>

          {/* Selector de buzón (si el usuario es Admin o tiene acceso a buzones departamentales) */}
          {accessibleMailboxes.length > 1 && (
            <select
              value={selectedMailbox.id}
              onChange={(e) => {
                window.location.href = `/mi-correo?mailboxId=${encodeURIComponent(
                  e.target.value
                )}&agencyId=${encodeURIComponent(initialData.agency.id)}`;
              }}
              className="h-9 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-mono font-bold text-slate-800"
            >
              {accessibleMailboxes.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.emailAddress} ({m.displayName})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Botones de Acción Rápida para el Agente */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            onClick={() => handleOpenCompose(true)}
            className="bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold text-xs h-9 rounded-xl shadow-sm"
          >
            <FileText className="w-3.5 h-3.5 mr-1.5" />
            Redactar / Enviar Póliza
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenCompose(false)}
            className="border-slate-200 text-slate-700 font-bold text-xs h-9 rounded-xl"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Correo Nuevo
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={handleOpenMobileSyncModal}
            className="border-sky-200 bg-sky-50/60 text-sky-700 hover:bg-sky-100 font-bold text-xs h-9 rounded-xl"
          >
            <Smartphone className="w-3.5 h-3.5 mr-1.5" />
            Sincronizar iPhone / Android
          </Button>

          {initialData.currentUser?.isAdmin && (
            <Link
              href={`/correos-corporativos?agencyId=${encodeURIComponent(
                initialData.agency.id
              )}`}
            >
              <Button
                type="button"
                variant="outline"
                className="border-slate-200 text-slate-700 font-bold text-xs h-9 rounded-xl"
              >
                <Settings className="w-3.5 h-3.5 mr-1.5" />
                20 Asientos
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Si este buzón está recibiendo Puentes de Cartera (Forwarders) de ex-agentes */}
      {activeForwards.length > 0 && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 px-4 py-2.5 text-xs text-emerald-900 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Puente de Cartera Activo:</strong> Tu bandeja también recibe automáticamente
              todos los correos que los asegurados envíen a{" "}
              {activeForwards.map((f) => (
                <code
                  key={f.id}
                  className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-emerald-200 mx-1"
                >
                  {f.sourceEmail}
                </code>
              ))}
            </span>
          </div>
        </div>
      )}

      {toastMsg && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-xs font-bold text-emerald-800">
          {toastMsg}
        </div>
      )}

      {/* Layout Principal del Cliente de Correo (3 columnas en Desktop, fluido Mobile-First en Celular) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[600px]">
        {/* Columna 1: Carpetas */}
        <div className="lg:col-span-2 flex lg:flex-col gap-1.5 overflow-x-auto pb-1 lg:pb-0">
          {[
            {
              id: "INBOX" as FolderKey,
              label: "Recibidos",
              icon: Inbox,
              badge: unreadInboxCount > 0 ? unreadInboxCount : undefined,
            },
            { id: "SENT" as FolderKey, label: "Enviados", icon: Send },
            { id: "DRAFTS" as FolderKey, label: "Borradores", icon: FileEdit },
            {
              id: "MIGRATED" as FolderKey,
              label: "Cartera Heredada",
              icon: FolderGit2,
              badge: migratedCount > 0 ? migratedCount : undefined,
            },
            { id: "TRASH" as FolderKey, label: "Papelera", icon: Trash2 },
          ].map((folder) => {
            const Icon = folder.icon;
            const active = selectedFolder === folder.id;
            return (
              <button
                key={folder.id}
                type="button"
                onClick={() => {
                  setSelectedFolder(folder.id);
                  setMobileReadingView(false);
                }}
                className={`flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  active
                    ? "bg-sky-600 text-white shadow-sm"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/70"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  {folder.label}
                </span>
                {folder.badge !== undefined && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                      active ? "bg-white text-sky-700" : "bg-sky-100 text-sky-800"
                    }`}
                  >
                    {folder.badge}
                  </span>
                )}
              </button>
            );
          })}

          <div className="hidden lg:block mt-auto pt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSimulateIncoming}
              disabled={simulating}
              className="w-full text-[11px] font-bold border-dashed border-slate-300 text-slate-600 hover:bg-slate-50 rounded-xl"
            >
              {simulating ? (
                <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 mr-1 text-sky-600" />
              )}
              Simular Correo Cliente
            </Button>
          </div>
        </div>

        {/* Columna 2: Lista de Mensajes */}
        <div
          className={`lg:col-span-4 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col overflow-hidden ${
            mobileReadingView ? "hidden lg:flex" : "flex"
          }`}
        >
          <div className="p-3 border-b border-slate-100">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por cliente, póliza o asunto..."
                className="pl-8 h-9 text-xs rounded-xl bg-slate-50 border-slate-200"
              />
            </div>
          </div>

          <div className="divide-y divide-slate-100 overflow-y-auto max-h-[560px]">
            {filteredMessages.length === 0 ? (
              <div className="p-10 text-center text-xs text-slate-400">
                No hay mensajes en esta carpeta.
              </div>
            ) : (
              filteredMessages.map((msg) => {
                const isSelected = activeMessage?.id === msg.id;
                return (
                  <button
                    key={msg.id}
                    type="button"
                    onClick={() => handleSelectMessage(msg)}
                    className={`w-full text-left p-3.5 transition-colors flex flex-col gap-1 ${
                      isSelected
                        ? "bg-sky-50/90 border-l-4 border-l-sky-600"
                        : !msg.isRead
                        ? "bg-white hover:bg-slate-50 font-semibold"
                        : "bg-slate-50/40 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-xs truncate ${
                          !msg.isRead ? "font-black text-slate-900" : "font-semibold text-slate-700"
                        }`}
                      >
                        {selectedFolder === "SENT"
                          ? `Para: ${msg.toAddresses}`
                          : msg.fromName || msg.fromAddress}
                      </span>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {new Date(msg.receivedAt).toLocaleDateString("es-MX", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </span>
                    </div>

                    <div
                      className={`text-xs line-clamp-1 ${
                        !msg.isRead ? "font-bold text-slate-900" : "text-slate-700"
                      }`}
                    >
                      {msg.subject}
                    </div>

                    <div className="text-[11px] text-slate-500 line-clamp-1">{msg.snippet}</div>

                    {msg.migratedFrom && (
                      <div className="pt-0.5">
                        <Badge
                          variant="outline"
                          className="text-[9px] px-1.5 py-0 border-emerald-300 bg-emerald-50 text-emerald-700"
                        >
                          Puente: {msg.migratedFrom}
                        </Badge>
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Columna 3: Visor del Mensaje */}
        <div
          className={`lg:col-span-6 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col overflow-hidden ${
            !mobileReadingView ? "hidden lg:flex" : "flex"
          }`}
        >
          {activeMessage ? (
            <>
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setMobileReadingView(false)}
                    className="lg:hidden h-8 px-2 text-xs font-bold"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" /> Volver
                  </Button>

                  <div className="flex items-center gap-1.5 ml-auto">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleReply(activeMessage)}
                      className="h-8 text-xs font-bold border-sky-200 text-sky-700 hover:bg-sky-50"
                    >
                      <Reply className="w-3.5 h-3.5 mr-1" />
                      Responder
                    </Button>
                    {activeMessage.folder !== "TRASH" && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMoveToTrash(activeMessage.id)}
                        className="h-8 text-xs text-slate-400 hover:text-red-600"
                        title="Mover a Papelera"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>

                <h2 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                  {activeMessage.subject}
                </h2>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-slate-500">
                  <div>
                    <span className="font-bold text-slate-800">
                      {activeMessage.fromName || activeMessage.fromAddress}
                    </span>{" "}
                    <span className="font-mono text-[11px]">&lt;{activeMessage.fromAddress}&gt;</span>
                    <div className="text-[11px]">
                      Para: <span className="font-mono">{activeMessage.toAddresses}</span>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {new Date(activeMessage.receivedAt).toLocaleString("es-MX")}
                  </div>
                </div>
              </div>

              <div className="p-5 flex-1 overflow-y-auto text-sm text-slate-800 leading-relaxed">
                {activeMessage.bodyHtml ? (
                  <div dangerouslySetInnerHTML={{ __html: activeMessage.bodyHtml }} />
                ) : (
                  <div className="whitespace-pre-wrap">{activeMessage.bodyText}</div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-10 text-center text-slate-400">
              <Mail className="w-10 h-10 mb-2 stroke-1" />
              <p className="text-xs font-medium">
                Selecciona un correo de la lista para leerlo o envía una póliza a tus asegurados.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal 4.2: Redactar Correo / Enviar Póliza Integrado con Cartera AACOMSoft */}
      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent className="sm:max-w-[640px] max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {composePolicyMode ? (
                <>
                  <FileText className="w-5 h-5 text-sky-600" />
                  Enviar Póliza / Expediente desde Mi Cartera AACOMSoft
                </>
              ) : (
                <>
                  <Mail className="w-5 h-5 text-sky-600" />
                  Redactar Correo Corporativo
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Remitente oficial:{" "}
              <strong className="font-mono text-slate-800">{selectedMailbox.emailAddress}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2">
            {/* Selector directo de Cliente y Póliza de AACOMSoft */}
            <div className="rounded-xl border border-sky-200 bg-sky-50/50 p-3 space-y-2.5">
              <div className="text-xs font-bold text-sky-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                Autocompletar con Cliente o Póliza de tu Cartera en AACOMSoft
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <Label className="text-[11px] font-semibold text-slate-600">
                    1. Elegir Cliente (Opcional)
                  </Label>
                  <select
                    value={selectedClientId}
                    onChange={(e) => handleSelectClientForPolicy(e.target.value)}
                    className="w-full h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-800"
                  >
                    <option value="">-- Seleccionar cliente --</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.email ? `(${c.email})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label className="text-[11px] font-semibold text-slate-600">
                    2. Insertar Póliza (Opcional)
                  </Label>
                  <select
                    value={selectedPolicyId}
                    onChange={(e) => handleSelectPolicyForTemplate(e.target.value)}
                    className="w-full h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-800"
                  >
                    <option value="">-- Seleccionar póliza --</option>
                    {policies
                      .filter((p) => !selectedClientId || p.clientId === selectedClientId)
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          #{p.policyNumber} — {p.insuranceCompany || p.insurer || "Póliza"} ({p.insured || p.contractor || "Cliente"})
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <Label className="text-xs font-bold">Para (Correo del Asegurado)</Label>
                <Input
                  type="email"
                  value={toEmail}
                  onChange={(e) => setToEmail(e.target.value)}
                  placeholder="cliente@correo.com"
                  className="h-9 text-xs font-mono"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold">CC (Opcional)</Label>
                <Input
                  value={ccEmail}
                  onChange={(e) => setCcEmail(e.target.value)}
                  placeholder="atencion@tupromotoria.com"
                  className="h-9 text-xs font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold">Asunto</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ej. Entrega de Póliza vigente y contactos de asistencia"
                className="h-9 text-xs font-semibold"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold">Mensaje</Label>
              <textarea
                rows={9}
                value={bodyText}
                onChange={(e) => setBodyText(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSendEmail(true)}
              disabled={sending}
              className="text-xs font-semibold"
            >
              Guardar en Borradores
            </Button>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setComposeOpen(false)}
                disabled={sending}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={() => handleSendEmail(false)}
                disabled={sending}
                className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs"
              >
                {sending && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
                <Send className="w-3.5 h-3.5 mr-1.5" />
                Enviar Correo Oficial
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal 4.3: Conector en 1 Clic para iPhone (.mobileconfig) y Android */}
      <Dialog open={mobileSyncOpen} onOpenChange={setMobileSyncOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-sky-600" />
              Sincronizar con mi iPhone / Android en 1 Clic
            </DialogTitle>
            <DialogDescription className="text-xs">
              Conecta <strong className="font-mono">{selectedMailbox.emailAddress}</strong> a la app
              nativa de tu celular sin configurar puertos manualmente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            {/* Opción 1: Apple iOS / macOS (.mobileconfig en 1 clic) */}
            <div className="rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 to-indigo-50/40 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-sky-950">
                  🍎 Opción A: iPhone, iPad o Mac (Apple Mail)
                </span>
                <Badge className="bg-sky-600 text-white text-[10px]">Automático 1 Clic</Badge>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Descarga el perfil oficial <code>.mobileconfig</code> preconfigurado con tus
                credenciales y servidores SSL. Al abrirlo en tu iPhone, solo pulsa{" "}
                <strong>&ldquo;Instalar Perfil&rdquo;</strong> en Configuración.
              </p>
              <a
                href={`/api/corporate-email/mobileconfig?mailboxId=${encodeURIComponent(
                  selectedMailbox.id
                )}`}
                download
                className="block"
              >
                <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs h-10 rounded-xl">
                  <Download className="w-4 h-4 mr-2" />
                  Descargar Perfil Automático para iPhone (.mobileconfig)
                </Button>
              </a>
            </div>

            {/* Opción 2: Android (Gmail / Outlook Móvil) */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
              <div className="text-xs font-black text-slate-800">
                🤖 Opción B: Android (App Gmail / Outlook Móvil)
              </div>
              {loadingMobileConfig ? (
                <div className="py-4 text-center text-xs text-slate-500">
                  <Loader2 className="w-4 h-4 animate-spin mx-auto mb-1" />
                  Cargando credenciales seguras...
                </div>
              ) : mobileConfigData ? (
                <div className="space-y-2 text-xs">
                  {[
                    { label: "Correo / Usuario", key: "email", val: mobileConfigData.emailAddress },
                    { label: "Contraseña App", key: "pass", val: mobileConfigData.password },
                    {
                      label: "Servidor Entrante (IMAP SSL)",
                      key: "imap",
                      val: `${mobileConfigData.imapHost}:${mobileConfigData.imapPort}`,
                    },
                    {
                      label: "Servidor Saliente (SMTP SSL)",
                      key: "smtp",
                      val: `${mobileConfigData.smtpHost}:${mobileConfigData.smtpPort}`,
                    },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between rounded-lg bg-white border border-slate-200 px-3 py-2"
                    >
                      <div>
                        <div className="text-[10px] text-slate-400 font-semibold">{item.label}</div>
                        <div className="font-mono font-bold text-slate-800">{item.val}</div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyText(item.key, item.val)}
                        className="h-7 px-2 text-xs text-sky-600"
                      >
                        {copiedField === item.key ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setMobileSyncOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
