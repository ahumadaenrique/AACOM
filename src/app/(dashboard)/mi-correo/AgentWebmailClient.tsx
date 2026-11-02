"use client";

import React, { useState, useMemo, useRef } from "react";
import Link from "next/link";
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
  Forward,
  CheckCircle2,
  Settings,
  Download,
  Copy,
  Check,
  Loader2,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  Paperclip,
  Image as ImageIcon,
  FileSpreadsheet,
  Presentation,
  FileArchive,
  X,
  Maximize2,
  Minimize2,
  Minus,
  Columns,
  Rows,
  Printer,
  HardDrive,
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

type FolderKey = "INBOX" | "STARRED" | "SENT" | "DRAFTS" | "MIGRATED" | "TRASH";

interface EmailAttachmentItem {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  contentBase64?: string;
  dataUrl?: string;
  url?: string;
  isPolicyPdf?: boolean;
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return "12 KB";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getInitials(name: string): string {
  const parts = (name || "AG").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "AG";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function getAttachmentIcon(mimeType = "", filename = "") {
  const lower = `${mimeType} ${filename}`.toLowerCase();
  if (lower.includes("image") || /\.(png|jpg|jpeg|webp|gif|svg)$/.test(lower)) {
    return ImageIcon;
  }
  if (lower.includes("presentation") || lower.includes("powerpoint") || /\.(ppt|pptx|key)$/.test(lower)) {
    return Presentation;
  }
  if (lower.includes("sheet") || lower.includes("excel") || lower.includes("csv") || /\.(xls|xlsx|csv)$/.test(lower)) {
    return FileSpreadsheet;
  }
  if (lower.includes("zip") || lower.includes("rar") || /\.(zip|rar|7z)$/.test(lower)) {
    return FileArchive;
  }
  return FileText;
}

export function AgentWebmailClient({ initialData }: { initialData: any }) {
  const [selectedFolder, setSelectedFolder] = useState<FolderKey>("INBOX");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewMode, setViewMode] = useState<"GMAIL_FULL" | "SPLIT">("GMAIL_FULL");
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);

  // Estado del Redactor estilo Gmail (anclado abajo a la derecha o pantalla completa)
  const [composeOpen, setComposeOpen] = useState<boolean>(false);
  const [composeMinimized, setComposeMinimized] = useState<boolean>(false);
  const [composeMaximized, setComposeMaximized] = useState<boolean>(true); // Por defecto amplio para máxima comodidad
  const [showCrmBar, setShowCrmBar] = useState<boolean>(true);
  const [showCc, setShowCc] = useState<boolean>(false);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [selectedPolicyId, setSelectedPolicyId] = useState<string>("");
  const [toEmail, setToEmail] = useState<string>("");
  const [ccEmail, setCcEmail] = useState<string>("");
  const [subject, setSubject] = useState<string>("");
  const [bodyText, setBodyText] = useState<string>("");
  const [attachments, setAttachments] = useState<EmailAttachmentItem[]>([]);
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);
  const [sending, setSending] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

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
  const [messagesState, setMessagesState] = useState<any[]>(initialData.messages || []);
  const clients: any[] = initialData.clients || [];
  const policies: any[] = initialData.policies || [];
  const activeForwards: any[] = initialData.activeForwards || [];

  const filteredMessages = useMemo(() => {
    return messagesState.filter((m) => {
      if (selectedFolder === "STARRED") {
        if (!m.isStarred || m.folder === "TRASH") return false;
      } else if (m.folder !== selectedFolder) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const attNames = Array.isArray(m.attachmentsJson)
        ? m.attachmentsJson.map((a: any) => a.filename || "").join(" ")
        : "";
      return (
        (m.subject || "").toLowerCase().includes(q) ||
        (m.fromAddress || "").toLowerCase().includes(q) ||
        (m.fromName || "").toLowerCase().includes(q) ||
        (m.toAddresses || "").toLowerCase().includes(q) ||
        (m.snippet || "").toLowerCase().includes(q) ||
        attNames.toLowerCase().includes(q)
      );
    });
  }, [messagesState, selectedFolder, searchQuery]);

  const activeMessage = useMemo(() => {
    if (!selectedMessageId) {
      return viewMode === "SPLIT" ? filteredMessages[0] || null : null;
    }
    return filteredMessages.find((m) => m.id === selectedMessageId) || null;
  }, [filteredMessages, selectedMessageId, viewMode]);

  const unreadInboxCount = useMemo(
    () => messagesState.filter((m) => m.folder === "INBOX" && !m.isRead).length,
    [messagesState]
  );
  const starredCount = useMemo(
    () => messagesState.filter((m) => m.isStarred && m.folder !== "TRASH").length,
    [messagesState]
  );
  const migratedCount = useMemo(
    () => messagesState.filter((m) => m.folder === "MIGRATED").length,
    [messagesState]
  );

  const usedGb = selectedMailbox
    ? (selectedMailbox.storageUsedMb / 1024).toFixed(2)
    : "0.04";
  const storagePct = selectedMailbox
    ? Math.min(100, Math.round((selectedMailbox.storageUsedMb / (3 * 1024)) * 100))
    : 2;

  const handleOpenCompose = (withPolicyTemplate: boolean) => {
    setComposeMinimized(false);
    setComposeMaximized(true);
    setShowCrmBar(withPolicyTemplate);
    setSelectedClientId("");
    setSelectedPolicyId("");
    setToEmail("");
    setCcEmail("");
    setAttachments([]);
    if (withPolicyTemplate) {
      setSubject(`Entrega de Póliza y Expediente | ${initialData.agency.name}`);
      setBodyText(
        `Estimado(a) asegurado(a),\n\nPor medio del presente correo oficial de ${initialData.agency.name} te comparto los documentos y datos de tu póliza vigente.\n\nQuedo a tu entera disposición para cualquier duda, endoso, presentación o reporte de siniestro.\n\nAtentamente,\n${selectedMailbox?.displayName || initialData.currentUser.name}\n${initialData.agency.name}\n${selectedMailbox?.emailAddress || ""}`
      );
    } else {
      setSubject("");
      setBodyText(
        `\n\n--\n${selectedMailbox?.displayName || initialData.currentUser.name}\n${initialData.agency.name}\n${selectedMailbox?.emailAddress || ""}`
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
      `Póliza ${policy.policyNumber} (${insurerName} - ${productName}) | ${initialData.agency.name}`
    );

    setBodyText(
      `Hola ${clientDisplayName},\n\nTe envío desde mi correo corporativo oficial en ${initialData.agency.name} el resumen y expediente de tu póliza:\n\n• Número de Póliza: ${policy.policyNumber}\n• Aseguradora: ${insurerName}\n• Plan / Ramo: ${productName}\n• Contratante / Asegurado: ${policy.insured || clientDisplayName}\n• Fecha de Renovación: ${renewalStr}${
        policy.pdfUrl ? `\n• Descarga directa de carátula PDF: ${policy.pdfUrl}` : ""
      }\n\nPor favor conserva este correo para cualquier trámite, renovación o asistencia en siniestros.\n\nSaludos cordiales,\n${selectedMailbox?.displayName || initialData.currentUser.name}\n${initialData.agency.name}\n${selectedMailbox?.emailAddress || ""}`
    );

    if (policy.pdfUrl) {
      setAttachments((prev) => {
        const filtered = prev.filter((a) => !a.isPolicyPdf);
        return [
          ...filtered,
          {
            id: `pol_${policy.id}`,
            filename: `Poliza_${policy.policyNumber}_${insurerName.replace(/\s+/g, "_")}.pdf`,
            mimeType: "application/pdf",
            size: 245000,
            url: policy.pdfUrl,
            isPolicyPdf: true,
          },
        ];
      });
    }
  };

  const handleFilesSelected = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const filesArray = Array.from(fileList);

    for (const file of filesArray) {
      if (file.size > 15 * 1024 * 1024) {
        alert(`El archivo "${file.name}" supera el límite de 15 MB por adjunto.`);
        continue;
      }

      const dataUrl: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
      });

      const base64Part = dataUrl.includes(",") ? dataUrl.split(",")[1] : "";

      setAttachments((prev) => [
        ...prev,
        {
          id: `att_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          filename: file.name,
          mimeType: file.type || "application/octet-stream",
          size: file.size,
          contentBase64: base64Part,
          dataUrl,
        },
      ]);
    }
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleReply = (msg: any) => {
    setComposeMinimized(false);
    setComposeMaximized(false);
    setShowCrmBar(false);
    setToEmail(msg.fromAddress);
    setCcEmail("");
    setAttachments([]);
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

  const handleForwardMessage = (msg: any) => {
    setComposeMinimized(false);
    setComposeMaximized(true);
    setShowCrmBar(false);
    setToEmail("");
    setCcEmail("");
    setAttachments(Array.isArray(msg.attachmentsJson) ? msg.attachmentsJson : []);
    setSubject(
      msg.subject?.toLowerCase().startsWith("fwd:") ? msg.subject : `Fwd: ${msg.subject}`
    );
    setBodyText(
      `\n\n---------- Mensaje reenviado ----------\nDe: ${msg.fromName || ""} <${msg.fromAddress}>\nFecha: ${new Date(msg.receivedAt).toLocaleString("es-MX")}\nAsunto: ${msg.subject}\nPara: ${msg.toAddresses}\n\n${msg.bodyText || msg.snippet || ""}`
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
      const escapedBody = bodyText
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

      const inlineImagesHtml = attachments
        .filter((a) => a.mimeType?.startsWith("image/") && a.dataUrl)
        .map(
          (img) =>
            `<div style="margin-top: 14px;"><p style="font-size: 11px; color: #64748b; margin-bottom: 4px;">📎 ${img.filename}</p><img src="${img.dataUrl}" alt="${img.filename}" style="max-width: 520px; border-radius: 8px; border: 1px solid #e2e8f0;" /></div>`
        )
        .join("");

      const htmlFormatted = `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b; line-height: 1.6; white-space: pre-wrap;">${escapedBody}${inlineImagesHtml}</div>`;

      await sendCorporateEmailAction({
        mailboxId: selectedMailbox.id,
        to: toEmail,
        cc: ccEmail,
        subject: subject || "(Sin asunto)",
        bodyHtml: htmlFormatted,
        bodyText,
        relatedClientId: selectedClientId || undefined,
        relatedPolicyId: selectedPolicyId || undefined,
        attachmentsJson: attachments.length > 0 ? attachments : undefined,
        saveAsDraft,
        targetAgencyId: initialData.agency.id,
      });

      setComposeOpen(false);
      setToastMsg(
        saveAsDraft
          ? "Borrador guardado correctamente."
          : `Correo enviado desde ${selectedMailbox.emailAddress}${
              attachments.length > 0 ? ` con ${attachments.length} archivo(s) adjunto(s)` : ""
            }.`
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
    if (!msg.isRead) {
      setMessagesState((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, isRead: true } : m))
      );
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

  const handleToggleStar = async (e: React.MouseEvent, msg: any) => {
    e.stopPropagation();
    const nextStarred = !msg.isStarred;
    setMessagesState((prev) =>
      prev.map((m) => (m.id === msg.id ? { ...m, isStarred: nextStarred } : m))
    );
    try {
      await updateEmailMessageStatusAction({
        messageId: msg.id,
        isStarred: nextStarred,
        targetAgencyId: initialData.agency.id,
      });
    } catch {
      // Ignore
    }
  };

  const handleMoveToTrash = async (msgId: string) => {
    setMessagesState((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, folder: "TRASH" } : m))
    );
    setSelectedMessageId(null);
    await updateEmailMessageStatusAction({
      messageId: msgId,
      moveToFolder: "TRASH",
      targetAgencyId: initialData.agency.id,
    });
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
    const hasActiveSubscription = Boolean(
      initialData.subscription && initialData.subscription.status === "active"
    );
    const domainName = initialData.subscription?.domainName;
    const agencyName = initialData.agency?.name || "tu promotoría";

    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 sm:p-10 text-center shadow-lg space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 text-sky-400 flex items-center justify-center mx-auto shadow-inner">
            <Mail className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <Badge
              variant="outline"
              className="px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-full border-sky-200 text-sky-700 bg-sky-50/50"
            >
              {hasActiveSubscription ? "Paquete Activo en tu Promotoría" : "Identidad Corporativa"}
            </Badge>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {hasActiveSubscription
                ? "Tu Correo Corporativo en aacomsoft"
                : "Impulsa tu Presencia con Correo Corporativo"}
            </h1>
          </div>

          <div className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-lg mx-auto">
            {hasActiveSubscription ? (
              <div className="space-y-3">
                <p>
                  Tu promotoría (<strong className="text-slate-800">{agencyName}</strong>) ya cuenta
                  con su dominio oficial{" "}
                  {domainName ? <strong className="text-sky-600">@{domainName}</strong> : null} y sus
                  buzones profesionales activos.
                </p>
                <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-100 text-sky-900 text-sm font-medium">
                  <strong>Dile a tu promotor que te asigne un lugar</strong> para que puedas comenzar a enviar pólizas, presentaciones y documentos a tus asegurados.
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p>Aún no cuentas con un buzón corporativo asignado a tu usuario.</p>
                <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-amber-950 text-sm font-medium">
                  <strong>Dile a tu promotor que puede adquirir el paquete de correo corporativo</strong> en aacomsoft para proyectar máxima confianza con los asegurados.
                </div>
              </div>
            )}
          </div>

          {initialData.currentUser?.isAdmin && (
            <div className="pt-2">
              <Link
                href={`/correos-corporativos?agencyId=${encodeURIComponent(
                  initialData.agency.id
                )}`}
              >
                <Button className="bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl h-11 px-6 shadow-sm">
                  <Settings className="w-4 h-4 mr-2 text-sky-400" />
                  {hasActiveSubscription
                    ? "Ir a Administrar y Asignar Buzones"
                    : "Ver Paquete de Dominio y 20 Correos ($999 MXN)"}
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 w-full max-w-[1600px] mx-auto pb-6">
      {/* Barra Superior Estilo Gmail Workspace */}
      <div className="rounded-2xl border border-slate-200/90 bg-white px-4 py-2.5 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Identidad del Buzón Activo */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="h-10 w-10 rounded-xl bg-[#0B1120] text-sky-400 flex items-center justify-center font-bold shadow-sm">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                Mi Correo
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                3 GB Titan
              </span>
            </div>
            {accessibleMailboxes.length > 1 ? (
              <select
                value={selectedMailbox.id}
                onChange={(e) => {
                  window.location.href = `/mi-correo?mailboxId=${encodeURIComponent(
                    e.target.value
                  )}&agencyId=${encodeURIComponent(initialData.agency.id)}`;
                }}
                className="text-xs font-mono font-bold text-sky-700 bg-transparent focus:outline-none cursor-pointer"
              >
                {accessibleMailboxes.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.emailAddress} ({m.displayName})
                  </option>
                ))}
              </select>
            ) : (
              <div className="text-xs font-mono font-bold text-sky-700">
                {selectedMailbox.emailAddress}
              </div>
            )}
          </div>
        </div>

        {/* Buscador Central Omnibox tipo Gmail */}
        <div className="flex-1 max-w-2xl">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar en el correo (cliente, número de póliza, asunto o archivo adjunto)..."
              className="pl-10 pr-8 h-10 text-xs sm:text-sm rounded-full bg-slate-100/90 hover:bg-slate-100 focus:bg-white border-transparent focus:border-sky-300 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Acciones Derecha: Modo de Vista + Sincronización Móvil + 20 Asientos */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Selector de vista Lista Completa Gmail vs Panel Dividido */}
          <div className="hidden md:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/70">
            <button
              type="button"
              onClick={() => {
                setViewMode("GMAIL_FULL");
                setSelectedMessageId(null);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                viewMode === "GMAIL_FULL"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              title="Vista amplia tipo Gmail"
            >
              <Rows className="w-3.5 h-3.5" />
              Lista Gmail
            </button>
            <button
              type="button"
              onClick={() => setViewMode("SPLIT")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                viewMode === "SPLIT"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              title="Vista con panel de lectura lateral"
            >
              <Columns className="w-3.5 h-3.5" />
              Panel Dividido
            </button>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleOpenMobileSyncModal}
            className="border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs h-9 rounded-xl"
          >
            <Smartphone className="w-3.5 h-3.5 mr-1.5 text-sky-600" />
            iPhone / Android
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
                className="border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs h-9 rounded-xl"
              >
                <Settings className="w-3.5 h-3.5 mr-1.5" />
                20 Asientos
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Aviso si recibe Puentes de Cartera */}
      {activeForwards.length > 0 && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-2 text-xs text-emerald-900 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Puente de Cartera Activo:</strong> Tu bandeja recibe automáticamente los correos enviados a{" "}
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
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-xs font-bold text-emerald-800 flex items-center justify-between">
          <span>✓ {toastMsg}</span>
          <button onClick={() => setToastMsg("")} className="text-emerald-700 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Cuerpo Principal estilo Gmail: Barra Lateral Izquierda + Área de Trabajo Amplia */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[calc(100dvh-210px)]">
        {/* Columna Lateral Izquierda (Gmail Sidebar: 2 columnas en desktop) */}
        <div className="lg:col-span-2 flex flex-col gap-3">
          {/* Botones Grandes de Redactar estilo Gmail */}
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
            <Button
              type="button"
              onClick={() => handleOpenCompose(false)}
              className="h-12 rounded-2xl bg-[#0B1120] hover:bg-slate-800 text-white font-extrabold text-xs sm:text-sm shadow-md flex items-center justify-start px-4 gap-3"
            >
              <Plus className="w-5 h-5 text-sky-400 shrink-0" />
              <span>Redactar Correo</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenCompose(true)}
              className="h-10 rounded-xl border-sky-200 bg-sky-50/70 hover:bg-sky-100/80 text-sky-900 font-bold text-xs flex items-center justify-start px-3.5 gap-2"
            >
              <FileText className="w-4 h-4 text-sky-600 shrink-0" />
              <span className="truncate">Enviar Póliza / Cartera</span>
            </Button>
          </div>

          {/* Lista de Carpetas */}
          <div className="flex lg:flex-col gap-1 overflow-x-auto pb-1 lg:pb-0">
            {[
              {
                id: "INBOX" as FolderKey,
                label: "Recibidos",
                icon: Inbox,
                badge: unreadInboxCount > 0 ? unreadInboxCount : undefined,
              },
              {
                id: "STARRED" as FolderKey,
                label: "Destacados",
                icon: Star,
                badge: starredCount > 0 ? starredCount : undefined,
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
                    if (viewMode === "GMAIL_FULL") {
                      setSelectedMessageId(null);
                    }
                  }}
                  className={`flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    active
                      ? "bg-sky-100/90 text-sky-950 font-extrabold"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${active ? "text-sky-600" : "text-slate-500"}`} />
                    {folder.label}
                  </span>
                  {folder.badge !== undefined && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        active ? "bg-sky-600 text-white" : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {folder.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Medidor de Almacenamiento de 3 GB + Simulador */}
          <div className="hidden lg:flex flex-col gap-3 mt-auto pt-4 border-t border-slate-200/80 px-1">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                <span className="flex items-center gap-1">
                  <HardDrive className="w-3.5 h-3.5 text-slate-400" /> Almacenamiento
                </span>
                <span className="tabular-nums">{usedGb} de 3 GB</span>
              </div>
              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sky-600 rounded-full"
                  style={{ width: `${Math.max(4, storagePct)}%` }}
                />
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSimulateIncoming}
              disabled={simulating}
              className="w-full text-[11px] font-bold border-dashed border-slate-300 text-slate-600 hover:bg-slate-50 rounded-xl"
            >
              {simulating ? (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 mr-1.5 text-sky-600" />
              )}
              Simular Correo Cliente
            </Button>
          </div>
        </div>

        {/* Área Principal (10 columnas en desktop) */}
        <div className="lg:col-span-10 flex flex-col">
          {/* MODO 1: VISTA AMPLIA ESTILO GMAIL (Lista completa de ancho completo -> Al hacer clic abre el correo a pantalla ancha) */}
          {viewMode === "GMAIL_FULL" ? (
            <div className="flex-1 rounded-2xl border border-slate-200/90 bg-white shadow-sm overflow-hidden flex flex-col">
              {!activeMessage ? (
                <>
                  {/* Barra de herramientas de la bandeja estilo Gmail */}
                  <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => window.location.reload()}
                        className="h-8 px-2.5 text-xs font-semibold text-slate-600"
                        title="Actualizar bandeja"
                      >
                        <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                        Actualizar
                      </Button>
                      <span className="text-xs text-slate-400">|</span>
                      <span className="text-xs font-semibold text-slate-600">
                        {filteredMessages.length} mensaje(s)
                      </span>
                    </div>

                    <div className="text-xs text-slate-400 hidden sm:block">
                      Haz clic en cualquier fila para abrir el correo completo
                    </div>
                  </div>

                  {/* Filas horizontales amplias estilo Gmail */}
                  <div className="divide-y divide-slate-100 overflow-y-auto flex-1">
                    {filteredMessages.length === 0 ? (
                      <div className="py-20 text-center text-slate-400 space-y-2">
                        <Mail className="w-10 h-10 mx-auto stroke-1" />
                        <p className="text-sm font-medium">No hay correos en esta carpeta.</p>
                      </div>
                    ) : (
                      filteredMessages.map((msg) => {
                        const msgAttachments: any[] = Array.isArray(msg.attachmentsJson)
                          ? msg.attachmentsJson
                          : [];
                        return (
                          <div
                            key={msg.id}
                            onClick={() => handleSelectMessage(msg)}
                            className={`group flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-3 cursor-pointer transition-colors ${
                              !msg.isRead
                                ? "bg-white hover:bg-sky-50/50 font-semibold"
                                : "bg-slate-50/40 hover:bg-slate-100/70 text-slate-600"
                            }`}
                          >
                            {/* Estrella + Remitente */}
                            <div className="flex items-center gap-3 sm:w-64 shrink-0 min-w-0">
                              <button
                                type="button"
                                onClick={(e) => handleToggleStar(e, msg)}
                                className="text-slate-300 hover:text-amber-400 transition-colors shrink-0"
                                title="Destacar correo"
                              >
                                <Star
                                  className={`w-4 h-4 ${
                                    msg.isStarred ? "fill-amber-400 text-amber-400" : ""
                                  }`}
                                />
                              </button>
                              <span
                                className={`text-xs sm:text-sm truncate ${
                                  !msg.isRead ? "font-extrabold text-slate-900" : "font-medium text-slate-700"
                                }`}
                              >
                                {selectedFolder === "SENT"
                                  ? `Para: ${msg.toAddresses}`
                                  : msg.fromName || msg.fromAddress}
                              </span>
                            </div>

                            {/* Asunto + Snippet + Chips de Archivos Adjuntos */}
                            <div className="flex-1 min-w-0 flex flex-col gap-1">
                              <div className="flex items-center gap-2 min-w-0">
                                {msg.migratedFrom && (
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] px-1.5 py-0 border-emerald-300 bg-emerald-50 text-emerald-700 shrink-0"
                                  >
                                    Puente: {msg.migratedFrom}
                                  </Badge>
                                )}
                                <span
                                  className={`text-xs sm:text-sm truncate ${
                                    !msg.isRead ? "font-bold text-slate-900" : "text-slate-800"
                                  }`}
                                >
                                  {msg.subject}
                                </span>
                                <span className="text-xs text-slate-400 hidden md:inline truncate">
                                  — {msg.snippet}
                                </span>
                              </div>

                              {/* Mostrar chips de adjuntos como en Gmail */}
                              {msgAttachments.length > 0 && (
                                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                                  {msgAttachments.slice(0, 3).map((att, idx) => {
                                    const AttIcon = getAttachmentIcon(att.mimeType, att.filename);
                                    return (
                                      <span
                                        key={idx}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-white border border-slate-200 text-slate-700 shadow-2xs"
                                      >
                                        <AttIcon className="w-3 h-3 text-sky-600 shrink-0" />
                                        <span className="max-w-[160px] truncate">{att.filename}</span>
                                      </span>
                                    );
                                  })}
                                  {msgAttachments.length > 3 && (
                                    <span className="text-[10px] text-slate-500 font-semibold">
                                      +{msgAttachments.length - 3} más
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Fecha y Acciones Rápidas al pasar el mouse */}
                            <div className="flex items-center justify-end gap-2 sm:w-32 shrink-0">
                              <span className="text-xs text-slate-500 tabular-nums group-hover:hidden">
                                {new Date(msg.receivedAt).toLocaleDateString("es-MX", {
                                  day: "2-digit",
                                  month: "short",
                                })}
                              </span>
                              <div className="hidden group-hover:flex items-center gap-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleReply(msg);
                                  }}
                                  className="h-7 px-2 text-xs text-slate-600 hover:text-sky-700"
                                  title="Responder"
                                >
                                  <Reply className="w-3.5 h-3.5" />
                                </Button>
                                {msg.folder !== "TRASH" && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleMoveToTrash(msg.id);
                                    }}
                                    className="h-7 px-2 text-xs text-slate-500 hover:text-rose-600"
                                    title="Eliminar"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </>
              ) : (
                /* Lector de Correo a Pantalla Completa estilo Gmail */
                <div className="flex flex-col h-full">
                  {/* Barra Superior del Lector */}
                  <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/60 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedMessageId(null)}
                        className="h-8 px-3 text-xs font-bold text-slate-700 hover:bg-slate-200/70 rounded-xl"
                      >
                        <ArrowLeft className="w-4 h-4 mr-1.5" />
                        Volver a {selectedFolder === "INBOX" ? "Recibidos" : "la lista"}
                      </Button>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleReply(activeMessage)}
                        className="h-8 text-xs font-bold rounded-xl border-slate-200 text-slate-800 hover:bg-slate-100"
                      >
                        <Reply className="w-3.5 h-3.5 mr-1.5 text-sky-600" />
                        Responder
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleForwardMessage(activeMessage)}
                        className="h-8 text-xs font-bold rounded-xl border-slate-200 text-slate-800 hover:bg-slate-100"
                      >
                        <Forward className="w-3.5 h-3.5 mr-1.5 text-slate-600" />
                        Reenviar
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => window.print()}
                        className="h-8 px-2.5 text-xs text-slate-500 hover:text-slate-900"
                        title="Imprimir correo"
                      >
                        <Printer className="w-4 h-4" />
                      </Button>
                      {activeMessage.folder !== "TRASH" && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMoveToTrash(activeMessage.id)}
                          className="h-8 px-2.5 text-xs text-slate-500 hover:text-rose-600"
                          title="Mover a Papelera"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Contenido del Correo estilo Gmail */}
                  <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6">
                    <div className="space-y-4 border-b border-slate-100 pb-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-snug">
                          {activeMessage.subject}
                        </h2>
                        <Badge variant="outline" className="text-xs font-semibold border-slate-200 text-slate-600">
                          {activeMessage.folder}
                        </Badge>
                      </div>

                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-slate-900 text-sky-300 flex items-center justify-center font-bold text-xs shrink-0">
                            {getInitials(activeMessage.fromName || activeMessage.fromAddress)}
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-bold text-slate-900">
                                {activeMessage.fromName || activeMessage.fromAddress}
                              </span>
                              <span className="text-xs font-mono text-slate-500">
                                &lt;{activeMessage.fromAddress}&gt;
                              </span>
                            </div>
                            <div className="text-xs text-slate-500">
                              para <span className="font-mono">{activeMessage.toAddresses}</span>
                              {activeMessage.ccAddresses ? (
                                <span> • cc: {activeMessage.ccAddresses}</span>
                              ) : null}
                            </div>
                          </div>
                        </div>

                        <div className="text-xs text-slate-400 tabular-nums shrink-0">
                          {new Date(activeMessage.receivedAt).toLocaleString("es-MX")}
                        </div>
                      </div>
                    </div>

                    {/* Cuerpo del mensaje */}
                    <div className="text-sm sm:text-[15px] text-slate-800 leading-relaxed max-w-4xl">
                      {activeMessage.bodyHtml ? (
                        <div dangerouslySetInnerHTML={{ __html: activeMessage.bodyHtml }} />
                      ) : (
                        <div className="whitespace-pre-wrap">{activeMessage.bodyText}</div>
                      )}
                    </div>

                    {/* Sección de Archivos Adjuntos del Correo (si tiene adjuntos) */}
                    {Array.isArray(activeMessage.attachmentsJson) &&
                      activeMessage.attachmentsJson.length > 0 && (
                        <div className="pt-6 border-t border-slate-200 space-y-3">
                          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                            <Paperclip className="w-3.5 h-3.5 text-sky-600" />
                            {activeMessage.attachmentsJson.length} Archivo(s) Adjunto(s)
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {activeMessage.attachmentsJson.map((att: any, idx: number) => {
                              const AttIcon = getAttachmentIcon(att.mimeType, att.filename);
                              const downloadHref =
                                att.dataUrl ||
                                att.url ||
                                (att.contentBase64
                                  ? `data:${att.mimeType || "application/octet-stream"};base64,${att.contentBase64}`
                                  : "#");
                              return (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3 hover:bg-slate-100/80 transition-colors"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="p-2 rounded-lg bg-white border border-slate-200 text-sky-600 shrink-0">
                                      <AttIcon className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0">
                                      <div className="text-xs font-bold text-slate-800 truncate">
                                        {att.filename}
                                      </div>
                                      <div className="text-[10px] text-slate-500">
                                        {formatBytes(att.size || 0)}
                                      </div>
                                    </div>
                                  </div>
                                  <a
                                    href={downloadHref}
                                    download={att.filename}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-sky-600 shrink-0"
                                    title="Descargar archivo"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                  </a>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                    {/* Botones inferiores rápidos estilo Gmail */}
                    <div className="pt-6 flex items-center gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleReply(activeMessage)}
                        className="rounded-full px-5 font-bold text-xs h-9 border-slate-300 text-slate-700 hover:bg-slate-100"
                      >
                        <Reply className="w-3.5 h-3.5 mr-2" />
                        Responder
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleForwardMessage(activeMessage)}
                        className="rounded-full px-5 font-bold text-xs h-9 border-slate-300 text-slate-700 hover:bg-slate-100"
                      >
                        <Forward className="w-3.5 h-3.5 mr-2" />
                        Reenviar
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* MODO 2: PANEL DIVIDIDO (Lista a la izquierda + Lectura a la derecha) */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1">
              <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
                <div className="p-3 border-b border-slate-100 bg-slate-50/60 text-xs font-bold text-slate-600 flex items-center justify-between">
                  <span>{filteredMessages.length} mensaje(s)</span>
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="text-sky-600 hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" /> Actualizar
                  </button>
                </div>
                <div className="divide-y divide-slate-100 overflow-y-auto max-h-[640px]">
                  {filteredMessages.map((msg) => {
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
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {selectedFolder === "SENT"
                              ? `Para: ${msg.toAddresses}`
                              : msg.fromName || msg.fromAddress}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(msg.receivedAt).toLocaleDateString("es-MX", {
                              day: "2-digit",
                              month: "short",
                            })}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-slate-800 line-clamp-1">
                          {msg.subject}
                        </div>
                        <div className="text-[11px] text-slate-500 line-clamp-1">{msg.snippet}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
                {activeMessage ? (
                  <div className="p-6 space-y-4 overflow-y-auto flex-1">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h2 className="text-lg font-extrabold text-slate-900">
                        {activeMessage.subject}
                      </h2>
                      <div className="flex items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReply(activeMessage)}
                          className="h-8 text-xs font-bold"
                        >
                          <Reply className="w-3.5 h-3.5 mr-1" /> Responder
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleForwardMessage(activeMessage)}
                          className="h-8 text-xs font-bold"
                        >
                          <Forward className="w-3.5 h-3.5 mr-1" /> Reenviar
                        </Button>
                      </div>
                    </div>
                    <div className="text-xs text-slate-500">
                      De: <strong className="text-slate-800">{activeMessage.fromName}</strong> &lt;
                      {activeMessage.fromAddress}&gt; • Para: {activeMessage.toAddresses}
                    </div>
                    <div className="text-sm text-slate-800 leading-relaxed pt-2">
                      {activeMessage.bodyHtml ? (
                        <div dangerouslySetInnerHTML={{ __html: activeMessage.bodyHtml }} />
                      ) : (
                        <div className="whitespace-pre-wrap">{activeMessage.bodyText}</div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center p-10 text-xs text-slate-400">
                    Selecciona un mensaje para leerlo.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* REDACTOR DE CORREO ESTILO GMAIL (Expandible a Pantalla Completa / Anclado Abajo a la Derecha / Minimizable + Adjuntos PDF, Imágenes y Presentaciones) */}
      {composeOpen && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDraggingOver(true);
          }}
          onDragLeave={() => setIsDraggingOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDraggingOver(false);
            handleFilesSelected(e.dataTransfer.files);
          }}
          className={`fixed z-50 transition-all duration-200 bg-white shadow-[0_25px_70px_-15px_rgba(15,23,42,0.45)] border border-slate-300 flex flex-col overflow-hidden ${
            composeMinimized
              ? "bottom-0 right-6 w-80 h-12 rounded-t-2xl"
              : composeMaximized
              ? "inset-3 sm:inset-6 lg:inset-10 rounded-2xl"
              : "bottom-0 right-4 sm:right-8 w-[95vw] sm:w-[680px] h-[640px] rounded-t-2xl"
          }`}
        >
          {/* Barra de Título Oscura estilo Gmail Compose */}
          <div
            onClick={() => composeMinimized && setComposeMinimized(false)}
            className="bg-[#0B1120] text-white px-4 py-3 flex items-center justify-between cursor-pointer select-none shrink-0"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Mail className="w-4 h-4 text-sky-400 shrink-0" />
              <span className="text-xs sm:text-sm font-bold truncate">
                {subject.trim() ? subject : "Mensaje nuevo"}
              </span>
              <span className="hidden sm:inline-block text-[11px] font-mono text-slate-400 truncate">
                ({selectedMailbox.emailAddress})
              </span>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setComposeMinimized(!composeMinimized);
                }}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
                title={composeMinimized ? "Restaurar" : "Minimizar"}
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setComposeMinimized(false);
                  setComposeMaximized(!composeMaximized);
                }}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
                title={composeMaximized ? "Tamaño ventana" : "Pantalla completa"}
              >
                {composeMaximized ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setComposeOpen(false);
                }}
                className="p-1.5 rounded-lg text-slate-300 hover:text-rose-400 hover:bg-white/10"
                title="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!composeMinimized && (
            <>
              {/* Barra inteligente de vinculación con Cartera / Pólizas de aacomsoft */}
              <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex flex-col gap-2 shrink-0">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setShowCrmBar(!showCrmBar)}
                    className="text-xs font-bold text-sky-700 hover:text-sky-900 flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                    {showCrmBar
                      ? "Ocultar selector de Clientes y Pólizas de aacomsoft"
                      : "Autocompletar con Cliente o Póliza de tu Cartera en aacomsoft"}
                  </button>
                  <span className="text-[11px] text-slate-400 hidden sm:inline">
                    Puedes arrastrar y soltar PDFs, imágenes o presentaciones aquí
                  </span>
                </div>

                {showCrmBar && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pb-1">
                    <select
                      value={selectedClientId}
                      onChange={(e) => handleSelectClientForPolicy(e.target.value)}
                      className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-800"
                    >
                      <option value="">1. Elegir Cliente de mi Cartera (Opcional)...</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.email ? `(${c.email})` : ""}
                        </option>
                      ))}
                    </select>

                    <select
                      value={selectedPolicyId}
                      onChange={(e) => handleSelectPolicyForTemplate(e.target.value)}
                      className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-800"
                    >
                      <option value="">2. Insertar Póliza / Carátula PDF (Opcional)...</option>
                      {policies
                        .filter((p) => !selectedClientId || p.clientId === selectedClientId)
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            #{p.policyNumber} — {p.insuranceCompany || p.insurer || "Póliza"} (
                            {p.insured || p.contractor || "Cliente"})
                          </option>
                        ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Campos Para / CC / Asunto estilo Gmail */}
              <div className="px-5 divide-y divide-slate-100 shrink-0">
                <div className="flex items-center gap-2 py-2">
                  <span className="text-xs font-semibold text-slate-400 w-14 shrink-0">Para</span>
                  <input
                    type="text"
                    value={toEmail}
                    onChange={(e) => setToEmail(e.target.value)}
                    placeholder="correo@asegurado.com (puedes separar varios con coma)"
                    className="flex-1 text-xs sm:text-sm font-mono text-slate-900 focus:outline-none"
                  />
                  {!showCc && (
                    <button
                      type="button"
                      onClick={() => setShowCc(true)}
                      className="text-xs font-semibold text-slate-400 hover:text-slate-700 px-2"
                    >
                      CC
                    </button>
                  )}
                </div>

                {showCc && (
                  <div className="flex items-center gap-2 py-2">
                    <span className="text-xs font-semibold text-slate-400 w-14 shrink-0">CC</span>
                    <input
                      type="text"
                      value={ccEmail}
                      onChange={(e) => setCcEmail(e.target.value)}
                      placeholder="copia@promotoria.com"
                      className="flex-1 text-xs sm:text-sm font-mono text-slate-900 focus:outline-none"
                    />
                  </div>
                )}

                <div className="flex items-center gap-2 py-2.5">
                  <span className="text-xs font-semibold text-slate-400 w-14 shrink-0">Asunto</span>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Asunto del correo..."
                    className="flex-1 text-xs sm:text-sm font-bold text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              {/* Área Principal de Redacción Amplia */}
              <div className="flex-1 px-5 py-3 flex flex-col min-h-0 relative overflow-y-auto">
                {isDraggingOver && (
                  <div className="absolute inset-3 rounded-2xl border-2 border-dashed border-sky-500 bg-sky-50/90 z-20 flex flex-col items-center justify-center text-sky-800 font-bold text-sm">
                    <Paperclip className="w-8 h-8 mb-2 text-sky-600 animate-bounce" />
                    Suelta tus archivos aquí para adjuntarlos al correo (PDFs, imágenes, presentaciones, Excel)
                  </div>
                )}

                <textarea
                  value={bodyText}
                  onChange={(e) => setBodyText(e.target.value)}
                  placeholder="Escribe tu mensaje aquí..."
                  className="w-full flex-1 min-h-[220px] resize-none border-0 text-sm sm:text-[15px] text-slate-800 leading-relaxed focus:outline-none"
                />

                {/* Bandeja de Archivos Adjuntos Cargados */}
                {attachments.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                      <span>Archivos adjuntos ({attachments.length})</span>
                      <span>
                        Total:{" "}
                        {formatBytes(
                          attachments.reduce((acc, item) => acc + (item.size || 0), 0)
                        )}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {attachments.map((att) => {
                        const AttIcon = getAttachmentIcon(att.mimeType, att.filename);
                        const isImage = att.mimeType?.startsWith("image/") && att.dataUrl;
                        return (
                          <div
                            key={att.id}
                            className="flex items-center justify-between gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 shadow-2xs"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              {isImage ? (
                                <img
                                  src={att.dataUrl}
                                  alt={att.filename}
                                  className="h-9 w-9 rounded-lg object-cover border border-slate-200 shrink-0"
                                />
                              ) : (
                                <div className="h-9 w-9 rounded-lg bg-white border border-slate-200 text-sky-600 flex items-center justify-center shrink-0">
                                  <AttIcon className="w-4 h-4" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-slate-800 truncate">
                                  {att.filename}
                                </div>
                                <div className="text-[10px] text-slate-500">
                                  {formatBytes(att.size)}
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveAttachment(att.id)}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 shrink-0"
                              title="Quitar adjunto"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Inputs ocultos para subir cualquier archivo o imágenes */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.key,.zip,.txt,image/*"
                onChange={(e) => {
                  handleFilesSelected(e.target.files);
                  e.target.value = "";
                }}
                className="hidden"
              />
              <input
                ref={imageInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => {
                  handleFilesSelected(e.target.files);
                  e.target.value = "";
                }}
                className="hidden"
              />

              {/* Barra Inferior de Herramientas y Envío estilo Gmail */}
              <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3 shrink-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    onClick={() => handleSendEmail(false)}
                    disabled={sending}
                    className="bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs sm:text-sm h-10 px-6 rounded-full shadow-sm"
                  >
                    {sending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}
                    Enviar
                  </Button>

                  {/* Botón Adjuntar Archivos (PDF, PPTX, XLSX, DOCX, etc.) */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-9 rounded-full border-slate-300 bg-white text-slate-700 hover:bg-slate-100 text-xs font-bold px-3.5"
                    title="Adjuntar archivos (PDF, Presentaciones PowerPoint, Excel, Word, etc.)"
                  >
                    <Paperclip className="w-4 h-4 mr-1.5 text-sky-600" />
                    Adjuntar archivo / presentación
                  </Button>

                  {/* Botón Insertar Imagen */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => imageInputRef.current?.click()}
                    className="h-9 rounded-full border-slate-300 bg-white text-slate-700 hover:bg-slate-100 text-xs font-bold px-3.5"
                    title="Insertar o adjuntar imágenes"
                  >
                    <ImageIcon className="w-4 h-4 mr-1.5 text-emerald-600" />
                    Imagen
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSendEmail(true)}
                    disabled={sending}
                    className="h-9 text-xs font-semibold text-slate-600 hover:text-slate-900"
                  >
                    Guardar borrador
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setComposeOpen(false)}
                    disabled={sending}
                    className="h-9 px-2.5 text-slate-400 hover:text-rose-600"
                    title="Descartar borrador"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Modal: Conector en 1 Clic para iPhone (.mobileconfig) y Android */}
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
            <div className="rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 to-slate-50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-sky-950">
                  Opción A: iPhone, iPad o Mac (Apple Mail)
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

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
              <div className="text-xs font-black text-slate-800">
                Opción B: Android (App Gmail / Outlook Móvil)
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
