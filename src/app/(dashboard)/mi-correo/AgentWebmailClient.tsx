"use client";

import React, { useState, useTransition, useMemo, useRef } from "react";
import Link from "next/link";
import {
  Mail,
  Send,
  Inbox,
  FileText,
  Trash2,
  FolderSync,
  Star,
  Search,
  Plus,
  Paperclip,
  Smartphone,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Reply,
  ReplyAll,
  Forward,
  Sparkles,
  FileCheck2,
  Building2,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  Copy,
  Check,
  X,
  ChevronDown,
  Maximize2,
  Minimize2,
  Minus,
  Image as ImageIcon,
  FileSpreadsheet,
  Presentation,
  FileArchive,
  Download,
  Columns,
  Rows,
  PanelLeftClose,
  PanelLeftOpen,
  Printer,
  CheckSquare,
  Square,
  MailOpen,
  Bold,
  Italic,
  List,
  PenTool,
  SlidersHorizontal,
  Settings2,
  Lock,
  ExternalLink,
  Upload,
} from "lucide-react";
import { uploadPolicyPdfSmart } from "@/app/(dashboard)/cartera/pdfClientHelper";
import {
  sendCorporateEmailAction,
  updateEmailMessageStatusAction,
  bulkUpdateEmailMessagesAction,
  emptyTrashAction,
  syncMailboxImapAction,
  simulateIncomingClientEmailAction,
  saveMailboxSignatureAction,
} from "@/app/(dashboard)/correos-corporativos/actions";

interface AttachmentItem {
  filename: string;
  mimeType: string;
  size: number;
  contentBase64?: string;
  url?: string;
}

interface ClientItem {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

interface PolicyItem {
  id: string;
  policyNumber: string;
  insuranceCompany: string | null;
  product: string | null;
  ramo: string | null;
  contractor: string | null;
  insured: string | null;
  annualPremium: number | null;
  currency: string | null;
  effectiveDate: Date | string | null;
  renewalDate: Date | string | null;
  pdfUrl: string | null;
  clientId: string | null;
}

interface WebmailData {
  agency: {
    id: string;
    name: string;
    slug: string;
  };
  currentUser: {
    id: string;
    name: string | null;
    email: string;
    role: string;
    isAdmin: boolean;
    isSuperAdmin: boolean;
  };
  subscription: any;
  accessibleMailboxes: any[];
  selectedMailbox: any;
  activeForwards: any[];
  customSignature?: string | null;
  messages: any[];
  clients: ClientItem[];
  policies: PolicyItem[];
}

type FolderType = "INBOX" | "STARRED" | "SENT" | "DRAFTS" | "MIGRATED" | "TRASH";

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return "12 KB";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function cleanPersonName(raw: string | null | undefined): string {
  if (!raw) return "";
  return raw.replace(/\s+/g, " ").trim();
}

function normalizeNameTokens(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 2);
}

/**
 * Verifica con alta precisión si una póliza pertenece a un cliente específico,
 * ya sea por ID directo (policy.clientId === client.id) o por coincidencia de nombre/apellidos
 * entre el cliente y el contratante/asegurado (ej. "Eduardo Ahumada Felix" <-> "AHUMADA FELIX, EDUARDO").
 */
function doesPolicyBelongToClient(policy: PolicyItem, client: ClientItem): boolean {
  if (policy.clientId && policy.clientId === client.id) {
    return true;
  }
  const clientTokens = normalizeNameTokens(client.name);
  if (clientTokens.length < 2) return false;

  const contractorTokens = normalizeNameTokens(policy.contractor);
  const insuredTokens = normalizeNameTokens(policy.insured);

  const matchesAllTokens = (targetTokens: string[]) => {
    if (targetTokens.length < 2) return false;
    const matched = clientTokens.filter((ct) => targetTokens.includes(ct));
    return (
      matched.length >= Math.min(clientTokens.length, targetTokens.length) &&
      matched.length >= 2
    );
  };

  return matchesAllTokens(contractorTokens) || matchesAllTokens(insuredTokens);
}

function getAttachmentIcon(mimeType: string, filename: string) {
  const lower = (filename || "").toLowerCase();
  const mime = (mimeType || "").toLowerCase();
  if (mime.startsWith("image/") || /\.(png|jpg|jpeg|gif|webp|svg)$/.test(lower)) {
    return <ImageIcon className="h-4 w-4 text-emerald-600 shrink-0" />;
  }
  if (
    mime.includes("presentation") ||
    mime.includes("powerpoint") ||
    /\.(ppt|pptx|key)$/.test(lower)
  ) {
    return <Presentation className="h-4 w-4 text-amber-600 shrink-0" />;
  }
  if (
    mime.includes("spreadsheet") ||
    mime.includes("excel") ||
    /\.(xls|xlsx|csv)$/.test(lower)
  ) {
    return <FileSpreadsheet className="h-4 w-4 text-green-600 shrink-0" />;
  }
  if (mime.includes("zip") || mime.includes("compressed") || /\.(zip|rar|7z)$/.test(lower)) {
    return <FileArchive className="h-4 w-4 text-purple-600 shrink-0" />;
  }
  return <FileText className="h-4 w-4 text-rose-600 shrink-0" />;
}

export function AgentWebmailClient({ initialData }: { initialData: WebmailData }) {
  const [data, setData] = useState<WebmailData>(initialData);
  const [activeFolder, setActiveFolder] = useState<FolderType>("INBOX");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(
    initialData.messages.find((m) => m.folder === "INBOX")?.id ||
      initialData.messages[0]?.id ||
      null
  );

  // Configuración ergonómica del espacio de trabajo (Full-Viewport App Shell)
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [layoutMode, setLayoutMode] = useState<"SPLIT" | "LIST_FULL">("SPLIT");
  const [listWidthPreset, setListWidthPreset] = useState<"COMPACT" | "MEDIUM" | "WIDE">("MEDIUM");
  const [readingFullView, setReadingFullView] = useState<boolean>(false);

  // Selección múltiple (Checkboxes estilo Gmail)
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Sincronización IMAP
  const [lastSyncText, setLastSyncText] = useState<string>("Sincronizado");
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const activeMailbox = data.selectedMailbox;

  // Firma personalizable del buzón
  const buildDefaultSignature = (mb: any) =>
    `Atentamente,\n${mb?.displayName || "Asesor de Seguros"}\n${data.agency.name}\n${mb?.emailAddress || ""}`;

  const [customSignature, setCustomSignature] = useState<string>(
    initialData.customSignature || buildDefaultSignature(initialData.selectedMailbox)
  );
  const [showSignatureModal, setShowSignatureModal] = useState<boolean>(false);
  const [sigDraftDisplayName, setSigDraftDisplayName] = useState<string>(
    initialData.selectedMailbox?.displayName || ""
  );
  const [sigDraftText, setSigDraftText] = useState<string>(
    initialData.customSignature || buildDefaultSignature(initialData.selectedMailbox)
  );

  // Ventana de Redacción estilo Gmail (3 modos: Ventana Amplia, Acoplada a la derecha, o Minimizada)
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [composeSizeMode, setComposeSizeMode] = useState<"LARGE_MODAL" | "DOCKED_RIGHT">("LARGE_MODAL");
  const [composeMinimized, setComposeMinimized] = useState(false);
  const [composeModeLabel, setComposeModeLabel] = useState<string>("Mensaje nuevo");
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);

  const [composeTo, setComposeTo] = useState("");
  const [composeCc, setComposeCc] = useState("");
  const [composeBcc, setComposeBcc] = useState("");
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedPolicyId, setSelectedPolicyId] = useState("");
  const [composeAttachments, setComposeAttachments] = useState<AttachmentItem[]>([]);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // Autocompletado directo en el campo Para: / CC:
  const [showToSuggestions, setShowToSuggestions] = useState(false);
  const [showCcSuggestions, setShowCcSuggestions] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const policyPdfUploadInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploadingPolicyPdf, setIsUploadingPolicyPdf] = useState(false);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const bodyTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Modal de Configuración Móvil (IMAP / SMTP en iPhone y Android)
  const [showMobileSyncModal, setShowMobileSyncModal] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const notify = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 5000);
  };

  // Filtrar mensajes por carpeta y búsqueda
  const filteredMessages = useMemo(() => {
    return data.messages.filter((m) => {
      if (activeFolder === "STARRED") {
        if (!m.isStarred || m.folder === "TRASH") return false;
      } else if (m.folder !== activeFolder) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const attMatch = Array.isArray(m.attachmentsJson)
        ? m.attachmentsJson.some((a: any) => (a?.filename || "").toLowerCase().includes(q))
        : false;
      return (
        (m.subject || "").toLowerCase().includes(q) ||
        (m.fromAddress || "").toLowerCase().includes(q) ||
        (m.fromName || "").toLowerCase().includes(q) ||
        (m.toAddresses || "").toLowerCase().includes(q) ||
        (m.snippet || "").toLowerCase().includes(q) ||
        attMatch
      );
    });
  }, [data.messages, activeFolder, searchQuery]);

  const selectedMessage = useMemo(() => {
    return (
      filteredMessages.find((m) => m.id === selectedMessageId) ||
      data.messages.find((m) => m.id === selectedMessageId) ||
      filteredMessages[0] ||
      null
    );
  }, [filteredMessages, data.messages, selectedMessageId]);

  // Contadores de carpetas
  const counts = useMemo(() => {
    return {
      INBOX: data.messages.filter((m) => m.folder === "INBOX" && !m.isRead).length,
      STARRED: data.messages.filter((m) => m.isStarred && m.folder !== "TRASH").length,
      SENT: data.messages.filter((m) => m.folder === "SENT").length,
      DRAFTS: data.messages.filter((m) => m.folder === "DRAFTS").length,
      MIGRATED: data.messages.filter((m) => m.folder === "MIGRATED").length,
      TRASH: data.messages.filter((m) => m.folder === "TRASH").length,
    };
  }, [data.messages]);

  // ============================================================================
  // SISTEMA ANTI-EQUIVOCACIONES DE CARTERA (CANDADO CLIENTE <-> PÓLIZA <-> CORREO)
  // ============================================================================
  const selectedClientObj = useMemo(
    () => data.clients.find((c) => c.id === selectedClientId) || null,
    [data.clients, selectedClientId]
  );

  const selectedPolicyObj = useMemo(
    () => data.policies.find((p) => p.id === selectedPolicyId) || null,
    [data.policies, selectedPolicyId]
  );

  // Si hay un cliente seleccionado, el selector de pólizas SOLO muestra las pólizas de ese cliente
  const availablePoliciesForCompose = useMemo(() => {
    if (!selectedClientObj) {
      return data.policies;
    }
    return data.policies.filter((p) => doesPolicyBelongToClient(p, selectedClientObj));
  }, [data.policies, selectedClientObj]);

  // Identificar quién es el dueño real de la póliza seleccionada
  const policyOwnerClient = useMemo(() => {
    if (!selectedPolicyObj) return null;
    return (
      data.clients.find((c) => doesPolicyBelongToClient(selectedPolicyObj, c)) || null
    );
  }, [data.clients, selectedPolicyObj]);

  // Validar en tiempo real si el correo en "Para:" coincide con el titular de la póliza
  const policySecurityCheck = useMemo(() => {
    if (!selectedPolicyObj) return null;

    const ownerName = cleanPersonName(
      selectedPolicyObj.contractor ||
        selectedPolicyObj.insured ||
        policyOwnerClient?.name ||
        "Asegurado"
    );
    const expectedEmail = (policyOwnerClient?.email || "").trim().toLowerCase();
    const currentRecipient = composeTo
      .split(/[;,]/)
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)[0] || "";

    // ¿El correo puesto en Para: pertenece a OTRO cliente distinto en la base de datos?
    const otherClientWithThatEmail = currentRecipient
      ? data.clients.find(
          (c) =>
            c.email &&
            c.email.trim().toLowerCase() === currentRecipient &&
            (!policyOwnerClient || c.id !== policyOwnerClient.id) &&
            !doesPolicyBelongToClient(selectedPolicyObj, c)
        )
      : null;

    if (otherClientWithThatEmail) {
      return {
        status: "DANGER" as const,
        message: `¡CUIDADO! La póliza #${selectedPolicyObj.policyNumber} pertenece a ${ownerName}, pero el correo "${currentRecipient}" está registrado a nombre de OTRO cliente (${cleanPersonName(
          otherClientWithThatEmail.name
        )}).`,
      };
    }

    if (expectedEmail && currentRecipient && currentRecipient !== expectedEmail) {
      return {
        status: "WARNING" as const,
        message: `Atención: La póliza #${selectedPolicyObj.policyNumber} es de ${ownerName} (correo registrado: ${expectedEmail}), pero estás enviando a "${currentRecipient}". Verifica que sea correcto.`,
      };
    }

    if (expectedEmail && currentRecipient === expectedEmail) {
      return {
        status: "VERIFIED" as const,
        message: `Candado Anti-Equivocación Verificado: Póliza #${selectedPolicyObj.policyNumber} pertenece a ${ownerName} y se enviará a su correo oficial (${expectedEmail}).`,
      };
    }

    if (!expectedEmail) {
      return {
        status: "WARNING" as const,
        message: `Póliza #${selectedPolicyObj.policyNumber} de ${ownerName}. Este asegurado no tiene correo guardado en su ficha; verifica bien el destinatario antes de enviar.`,
      };
    }

    return null;
  }, [selectedPolicyObj, policyOwnerClient, composeTo, data.clients]);

  // Contactos combinados para Autocompletado instantáneo en Para/CC
  const addressBook = useMemo(() => {
    const items: Array<{ label: string; email: string; badge: string; clientId?: string }> = [];
    for (const c of data.clients) {
      if (c.email) {
        items.push({
          label: cleanPersonName(c.name),
          email: c.email.trim().toLowerCase(),
          badge: "Asegurado",
          clientId: c.id,
        });
      }
    }
    for (const mb of data.accessibleMailboxes) {
      if (mb.emailAddress) {
        items.push({
          label: mb.displayName,
          email: mb.emailAddress.toLowerCase(),
          badge: "Equipo",
        });
      }
    }
    return items;
  }, [data.clients, data.accessibleMailboxes]);

  const matchingToContacts = useMemo(() => {
    const lastToken = (composeTo.split(/[;,]/).pop() || "").trim().toLowerCase();
    if (!lastToken) return addressBook.slice(0, 6);
    return addressBook
      .filter(
        (c) =>
          c.label.toLowerCase().includes(lastToken) ||
          c.email.toLowerCase().includes(lastToken)
      )
      .slice(0, 6);
  }, [addressBook, composeTo]);

  const matchingCcContacts = useMemo(() => {
    const lastToken = (composeCc.split(/[;,]/).pop() || "").trim().toLowerCase();
    if (!lastToken) return addressBook.slice(0, 6);
    return addressBook
      .filter(
        (c) =>
          c.label.toLowerCase().includes(lastToken) ||
          c.email.toLowerCase().includes(lastToken)
      )
      .slice(0, 6);
  }, [addressBook, composeCc]);

  const applyContactSuggestion = (
    field: "TO" | "CC",
    contact: { label: string; email: string; clientId?: string }
  ) => {
    if (field === "TO") {
      const parts = composeTo
        .split(/[;,]/)
        .map((p) => p.trim())
        .filter(Boolean);
      if (parts.length <= 1) {
        setComposeTo(contact.email);
      } else {
        parts[parts.length - 1] = contact.email;
        setComposeTo(Array.from(new Set(parts)).join(", "));
      }
      if (contact.clientId) {
        handleSelectClient(contact.clientId);
      }
      setShowToSuggestions(false);
    } else {
      const parts = composeCc
        .split(/[;,]/)
        .map((p) => p.trim())
        .filter(Boolean);
      if (parts.length <= 1) {
        setComposeCc(contact.email);
      } else {
        parts[parts.length - 1] = contact.email;
        setComposeCc(Array.from(new Set(parts)).join(", "));
      }
      setShowCcSuggestions(false);
    }
  };

  // Si la promotoría aún no tiene suscripción activa o ningún buzón asignado:
  if (!data.subscription || !activeMailbox) {
    return (
      <div className="max-w-5xl mx-auto py-8 px-4 space-y-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-sky-50 border border-sky-200 text-sky-600 flex items-center justify-center mx-auto">
            <Mail className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Tu Bandeja de Correo Corporativo Oficial
          </h1>
          <p className="text-slate-600 max-w-xl mx-auto text-sm leading-relaxed">
            {data.currentUser.isAdmin
              ? "Aún no has activado el paquete de Correos Corporativos y Dominio Propio para tu promotoría. Actívalo ahora para habilitar hasta 20 cuentas oficiales conectadas con las pólizas y asegurados en aacomsoft."
              : "Tu promotoría aún no te ha asignado un buzón corporativo oficial. Solicita a tu Administrador que active tu cuenta en el panel de Correos Corporativos."}
          </p>
          {data.currentUser.isAdmin && (
            <div className="pt-2">
              <Link
                href="/correos-corporativos"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm shadow-md transition"
              >
                <span>Configurar Dominio y Activar mis 20 Buzones</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Generar el texto del correo para una póliza de forma limpia (sin espacios basura)
  const populateEmailWithPolicy = (policy: PolicyItem, clientOverride?: ClientItem | null) => {
    const aseguradora = cleanPersonName(policy.insuranceCompany) || "Aseguradora";
    const ramo = cleanPersonName(policy.ramo || policy.product) || "Seguro";
    const titular =
      cleanPersonName(policy.contractor || policy.insured || clientOverride?.name) ||
      "Estimado Asegurado";
    const vigenciaFin = policy.renewalDate
      ? new Date(policy.renewalDate).toLocaleDateString("es-MX")
      : "Vigente";

    setComposeSubject(
      `📄 Póliza ${policy.policyNumber} (${aseguradora} - ${ramo}) | ${data.agency.name}`
    );

    const policyBlock = `Estimado(a) ${titular},

Te comparto los datos oficiales y documentación de tu póliza registrada en nuestra promotoría ${data.agency.name}:

• Número de Póliza: ${policy.policyNumber}
• Aseguradora: ${aseguradora}
• Ramo / Producto: ${ramo}
• Prima Anual: $${Number(policy.annualPremium || 0).toLocaleString("es-MX")} ${
      policy.currency || "MXN"
    }
• Próxima Renovación: ${vigenciaFin}${
      policy.pdfUrl ? `\n• Descarga directa de Carátula PDF: ${policy.pdfUrl}` : ""
    }

Quedo a tu entera disposición en este correo oficial para cualquier endoso, renovación o asistencia en siniestros.

--
${customSignature}`;

    setComposeBody(policyBlock);

    const autoFilename = `Caratula_Poliza_${policy.policyNumber}.pdf`;
    setComposeAttachments((prev) => {
      // Quitar cualquier carátula de otra póliza anterior para evitar mezclar PDFs de distintos clientes
      const withoutOtherPolicies = prev.filter(
        (a) => !a.filename.startsWith("Caratula_Poliza_")
      );
      if (policy.pdfUrl) {
        return [
          ...withoutOtherPolicies,
          {
            filename: autoFilename,
            mimeType: "application/pdf",
            size: 245760,
            url: policy.pdfUrl,
          },
        ];
      }
      return withoutOtherPolicies;
    });
  };

  // Seleccionar Cliente con Candado Anti-Equivocación
  const handleSelectClient = (clientId: string) => {
    setSelectedClientId(clientId);

    if (!clientId) {
      setSelectedPolicyId("");
      setComposeAttachments((prev) =>
        prev.filter((a) => !a.filename.startsWith("Caratula_Poliza_"))
      );
      return;
    }

    const client = data.clients.find((c) => c.id === clientId);
    if (!client) return;

    // 1. Actualizar "Para:" SIEMPRE al correo del nuevo cliente (o vaciarlo si no tiene correo para NUNCA dejar el correo del cliente anterior)
    if (client.email && client.email.trim()) {
      setComposeTo(client.email.trim().toLowerCase());
    } else {
      setComposeTo("");
      notify(
        "error",
        `El asegurado ${cleanPersonName(client.name)} no tiene un correo registrado en su ficha. Escríbelo manualmente en "Para:".`
      );
    }

    // 2. Verificar si había una póliza seleccionada de OTRO cliente
    const currentPol = data.policies.find((p) => p.id === selectedPolicyId);
    const clientPolicies = data.policies.filter((p) =>
      doesPolicyBelongToClient(p, client)
    );

    if (currentPol && !doesPolicyBelongToClient(currentPol, client)) {
      // Limpiar de inmediato los datos del cliente anterior y si el nuevo cliente tiene pólizas, cargar la suya
      if (clientPolicies.length === 1) {
        const onlyPol = clientPolicies[0];
        setSelectedPolicyId(onlyPol.id);
        populateEmailWithPolicy(onlyPol, client);
        notify(
          "success",
          `Candado Anti-Equivocación: Se actualizó automáticamente a la póliza #${onlyPol.policyNumber} de ${cleanPersonName(
            client.name
          )}.`
        );
      } else {
        setSelectedPolicyId("");
        setComposeSubject("");
        setComposeBody(
          `Estimado(a) ${cleanPersonName(client.name)},\n\n\n\n--\n${customSignature}`
        );
        setComposeAttachments((prev) =>
          prev.filter((a) => !a.filename.startsWith("Caratula_Poliza_"))
        );
        notify(
          "success",
          `Candado Anti-Equivocación: Se limpió la póliza del cliente anterior. Ahora solo ves las pólizas de ${cleanPersonName(
            client.name
          )}.`
        );
      }
      return;
    }

    // Si no había póliza seleccionada y el cliente tiene exactamente 1 póliza, pre-seleccionarla
    if (!currentPol && clientPolicies.length === 1) {
      const onlyPol = clientPolicies[0];
      setSelectedPolicyId(onlyPol.id);
      populateEmailWithPolicy(onlyPol, client);
    } else if (!currentPol) {
      setComposeBody(
        `Estimado(a) ${cleanPersonName(client.name)},\n\n\n\n--\n${customSignature}`
      );
    }
  };

  // Seleccionar Póliza e inyectar bloque de datos + sincronizar automáticamente su Cliente dueño
  const handleSelectPolicy = (policyId: string) => {
    setSelectedPolicyId(policyId);
    if (!policyId) {
      setComposeAttachments((prev) =>
        prev.filter((a) => !a.filename.startsWith("Caratula_Poliza_"))
      );
      return;
    }

    const policy = data.policies.find((p) => p.id === policyId);
    if (!policy) return;

    // Buscar al cliente titular de esta póliza y sincronizar el Selector 1 + Para:
    const ownerClient =
      data.clients.find((c) => doesPolicyBelongToClient(policy, c)) || null;

    if (ownerClient) {
      setSelectedClientId(ownerClient.id);
      if (ownerClient.email && ownerClient.email.trim()) {
        setComposeTo(ownerClient.email.trim().toLowerCase());
      } else {
        setComposeTo("");
      }
    }

    populateEmailWithPolicy(policy, ownerClient);
  };

  // Insertar explícitamente el PDF de una póliza que ya está subida en el sistema
  const handleInsertPolicyPdf = (policyToInsert?: PolicyItem | null) => {
    const targetPol =
      policyToInsert ||
      selectedPolicyObj ||
      availablePoliciesForCompose.find((p) => Boolean(p.pdfUrl)) ||
      null;

    if (!targetPol) {
      notify("error", "Primero selecciona un asegurado o una póliza de tu cartera.");
      return;
    }

    if (!targetPol.pdfUrl) {
      notify(
        "error",
        `La póliza #${targetPol.policyNumber} aún no tiene su archivo PDF subido en el sistema. Puedes subirlo con el botón "Subir PDF a esta póliza".`
      );
      return;
    }

    // Si aún no estaba seleccionada como póliza activa, sincronizarla
    if (selectedPolicyId !== targetPol.id) {
      setSelectedPolicyId(targetPol.id);
    }

    const autoFilename = `Caratula_Poliza_${targetPol.policyNumber}.pdf`;
    const alreadyAttached = composeAttachments.some(
      (a) => a.filename === autoFilename
    );

    if (!alreadyAttached) {
      setComposeAttachments((prev) => [
        ...prev,
        {
          filename: autoFilename,
          mimeType: "application/pdf",
          size: 245760,
          url: targetPol.pdfUrl!,
        },
      ]);
    }

    // Asegurar que el enlace o mención también esté en el cuerpo si estaba vacío
    if (!composeBody.includes(targetPol.policyNumber)) {
      populateEmailWithPolicy(targetPol, selectedClientObj);
    } else if (targetPol.pdfUrl && !composeBody.includes(targetPol.pdfUrl)) {
      setComposeBody((prev) => {
        const sigIdx = prev.lastIndexOf("\n--\n");
        const pdfLine = `\n📄 Descarga directa de tu Póliza #${targetPol.policyNumber} (PDF): ${targetPol.pdfUrl}\n`;
        if (sigIdx !== -1) {
          return prev.slice(0, sigIdx) + pdfLine + prev.slice(sigIdx);
        }
        return prev + pdfLine;
      });
    }

    notify(
      "success",
      `📎 PDF de la Póliza #${targetPol.policyNumber} (${autoFilename}) insertado y adjuntado al correo.`
    );
  };

  // Subir PDF directamente a la póliza en el sistema (Mi Cartera) e insertarlo en el correo en 1 solo paso
  const handleUploadNewPolicyPdfAndInsert = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0 || !selectedPolicyObj) return;
    const file = fileList[0];
    setIsUploadingPolicyPdf(true);
    try {
      const { url } = await uploadPolicyPdfSmart(file, selectedPolicyObj.id);
      // Actualizar estado local para que la póliza ya tenga su pdfUrl en memoria
      const updatedPolicy: PolicyItem = { ...selectedPolicyObj, pdfUrl: url };
      setData((prev) => ({
        ...prev,
        policies: prev.policies.map((p) =>
          p.id === selectedPolicyObj.id ? updatedPolicy : p
        ),
      }));
      handleInsertPolicyPdf(updatedPolicy);
      notify(
        "success",
        `¡Listo! El PDF quedó guardado en Mi Cartera para la póliza #${selectedPolicyObj.policyNumber} y se adjuntó a este correo.`
      );
    } catch (err: any) {
      notify(
        "error",
        err?.message || "No se pudo subir el PDF a la póliza. Intenta adjuntarlo como archivo normal."
      );
    } finally {
      setIsUploadingPolicyPdf(false);
    }
  };

  // Procesar archivos subidos desde input o Drag & Drop
  const processUploadedFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    const maxFileSizeBytes = 10 * 1024 * 1024; // 10 MB por archivo
    const newItems: AttachmentItem[] = [];

    for (const file of Array.from(fileList)) {
      if (file.size > maxFileSizeBytes) {
        notify(
          "error",
          `El archivo "${file.name}" supera el límite de 10 MB por adjunto.`
        );
        continue;
      }

      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = typeof reader.result === "string" ? reader.result : "";
          const base64Part = result.includes(",") ? result.split(",")[1] : result;
          resolve(base64Part);
        };
        reader.onerror = () => reject(new Error("Error al leer el archivo"));
        reader.readAsDataURL(file);
      });

      newItems.push({
        filename: file.name,
        mimeType: file.type || "application/octet-stream",
        size: file.size,
        contentBase64: base64,
      });
    }

    if (newItems.length > 0) {
      setComposeAttachments((prev) => [...prev, ...newItems]);
      notify(
        "success",
        `${newItems.length} archivo(s) adjuntado(s) al correo.`
      );
    }
  };

  const removeAttachment = (index: number) => {
    setComposeAttachments((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Insertar formato o actualizar firma en el redactor
  const insertTextFormat = (type: "BOLD" | "ITALIC" | "LIST" | "SIGNATURE") => {
    const el = bodyTextareaRef.current;
    if (type === "SIGNATURE") {
      setComposeBody((prev) => {
        // Si ya existe un separador "--\n", reemplazar la firma anterior por la firma personalizada actual
        const sigMarkerIndex = prev.lastIndexOf("\n--\n");
        if (sigMarkerIndex !== -1) {
          return prev.slice(0, sigMarkerIndex) + `\n--\n${customSignature}`;
        }
        return `${prev.trimEnd()}\n\n--\n${customSignature}`;
      });
      notify("success", "Firma oficial insertada al pie del correo.");
      return;
    }

    if (!el) return;
    const start = el.selectionStart || 0;
    const end = el.selectionEnd || 0;
    const selected = composeBody.slice(start, end);

    let replacement = selected;
    if (type === "BOLD") {
      replacement = `**${selected || "texto en negrita"}**`;
    } else if (type === "ITALIC") {
      replacement = `_${selected || "texto en cursiva"}_`;
    } else if (type === "LIST") {
      replacement = selected
        ? selected
            .split("\n")
            .map((line) => `• ${line}`)
            .join("\n")
        : "\n• Punto 1\n• Punto 2\n• Punto 3";
    }

    const nextBody = composeBody.slice(0, start) + replacement + composeBody.slice(end);
    setComposeBody(nextBody);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start, start + replacement.length);
    }, 20);
  };

  // Guardar firma personalizada en base de datos
  const handleSaveCustomSignature = () => {
    if (!sigDraftText.trim()) {
      notify("error", "La firma no puede estar vacía.");
      return;
    }
    startTransition(async () => {
      try {
        const res = await saveMailboxSignatureAction({
          mailboxId: activeMailbox.id,
          displayName: sigDraftDisplayName.trim() || activeMailbox.displayName,
          signatureText: sigDraftText.trim(),
          targetAgencyId: data.agency.id,
        });
        setCustomSignature(res.signatureText);
        setData((prev) => ({
          ...prev,
          selectedMailbox: {
            ...prev.selectedMailbox,
            displayName: res.displayName,
          },
        }));
        // Si el redactor está abierto, actualizar la firma en vivo en el cuerpo del mensaje
        if (showComposeModal) {
          setComposeBody((prev) => {
            const idx = prev.lastIndexOf("\n--\n");
            if (idx !== -1) {
              return prev.slice(0, idx) + `\n--\n${res.signatureText}`;
            }
            return `${prev.trimEnd()}\n\n--\n${res.signatureText}`;
          });
        }
        setShowSignatureModal(false);
        notify("success", "Tu firma oficial ha sido actualizada y guardada.");
      } catch (err: any) {
        notify("error", err?.message || "No se pudo guardar la firma.");
      }
    });
  };

  // Verificar si el usuario escribió contenido real para auto-guardar en Borradores al cerrar
  const hasUnsavedDraftContent = (): boolean => {
    const bodyWithoutSig = composeBody.split("\n--\n")[0]?.trim() || "";
    return Boolean(
      composeTo.trim() ||
        composeCc.trim() ||
        composeSubject.trim() ||
        bodyWithoutSig.length > 0 ||
        composeAttachments.length > 0
    );
  };

  // Cerrar el redactor auto-guardando en Borradores (igual que Gmail)
  const handleCloseComposeWithAutoDraft = () => {
    if (!hasUnsavedDraftContent()) {
      setShowComposeModal(false);
      setComposeMinimized(false);
      setEditingDraftId(null);
      return;
    }

    const snapshotTo = composeTo.trim() || "borrador@pendiente.mx";
    const snapshotCc = composeCc.trim() || undefined;
    const snapshotBcc = composeBcc.trim() || undefined;
    const snapshotSubject = composeSubject.trim() || "(Sin asunto)";
    const snapshotBody = composeBody;
    const snapshotClientId = selectedClientId || undefined;
    const snapshotPolicyId = selectedPolicyId || undefined;
    const snapshotAttachments =
      composeAttachments.length > 0 ? [...composeAttachments] : undefined;
    const snapshotDraftId = editingDraftId || undefined;

    setShowComposeModal(false);
    setComposeMinimized(false);
    setEditingDraftId(null);

    startTransition(async () => {
      try {
        const res = await sendCorporateEmailAction({
          mailboxId: activeMailbox.id,
          to: snapshotTo,
          cc: snapshotCc,
          bcc: snapshotBcc,
          subject: snapshotSubject,
          bodyHtml: formatBodyToCleanHtml(snapshotBody),
          bodyText: snapshotBody,
          relatedClientId: snapshotClientId,
          relatedPolicyId: snapshotPolicyId,
          attachmentsJson: snapshotAttachments,
          saveAsDraft: true,
          draftId: snapshotDraftId,
          targetAgencyId: data.agency.id,
        });

        setData((prev) => {
          const withoutOld = snapshotDraftId
            ? prev.messages.filter((m) => m.id !== snapshotDraftId)
            : prev.messages;
          return {
            ...prev,
            messages: [res.message, ...withoutOld],
          };
        });

        notify("success", "Correo guardado automáticamente en tu carpeta Borradores.");
      } catch {
        // Silencioso en caso de cierre rápido
      }
    });
  };

  // Descartar borrador explícitamente con el ícono de papelera
  const handleDiscardDraftExplicitly = () => {
    const draftToRemove = editingDraftId;
    setShowComposeModal(false);
    setComposeMinimized(false);
    setEditingDraftId(null);
    setComposeAttachments([]);

    if (draftToRemove) {
      setData((prev) => ({
        ...prev,
        messages: prev.messages.filter((m) => m.id !== draftToRemove),
      }));
      bulkUpdateEmailMessagesAction({
        messageIds: [draftToRemove],
        deletePermanently: true,
        targetAgencyId: data.agency.id,
      }).catch(() => {});
    }
    notify("success", "Borrador descartado.");
  };

  // Abrir redactor para correo nuevo
  const openComposeNew = () => {
    setEditingDraftId(null);
    setComposeModeLabel("Mensaje nuevo");
    setComposeTo("");
    setComposeCc("");
    setComposeBcc("");
    setShowCcBcc(false);
    setComposeSubject("");
    setComposeBody(`\n\n--\n${customSignature}`);
    setSelectedClientId("");
    setSelectedPolicyId("");
    setComposeAttachments([]);
    setComposeMinimized(false);
    setComposeSizeMode("LARGE_MODAL");
    setShowComposeModal(true);
  };

  // 1. RESPONDER (Reply)
  const handleReplyMessage = (msg: any) => {
    setEditingDraftId(null);
    const replyTarget =
      msg.folder === "SENT" ? msg.toAddresses : msg.fromAddress;
    setComposeModeLabel(`Respondiendo a ${msg.fromName || replyTarget}`);
    setComposeTo(replyTarget);
    setComposeCc("");
    setComposeBcc("");
    setShowCcBcc(false);
    setSelectedClientId("");
    setSelectedPolicyId("");
    setComposeSubject(
      msg.subject?.toLowerCase().startsWith("re:")
        ? msg.subject
        : `Re: ${msg.subject}`
    );
    setComposeBody(
      `\n\n--\n${customSignature}\n\n--- El ${new Date(
        msg.receivedAt
      ).toLocaleString("es-MX")}, ${msg.fromName || msg.fromAddress} escribió: ---\n> ${(
        msg.bodyText ||
        msg.snippet ||
        ""
      )
        .split("\n")
        .join("\n> ")}`
    );
    setComposeAttachments([]);
    setComposeMinimized(false);
    setComposeSizeMode("DOCKED_RIGHT");
    setShowComposeModal(true);
  };

  // 2. RESPONDER A TODOS (Reply All)
  const handleReplyAllMessage = (msg: any) => {
    setEditingDraftId(null);
    const myEmail = (activeMailbox.emailAddress || "").toLowerCase();
    const replyTarget =
      msg.folder === "SENT" ? msg.toAddresses : msg.fromAddress;

    const allOthers = [
      ...(msg.toAddresses || "").split(/[;,]/),
      ...(msg.ccAddresses || "").split(/[;,]/),
    ]
      .map((e: string) => e.trim().toLowerCase())
      .filter((e: string) => Boolean(e) && e !== myEmail && e !== replyTarget.toLowerCase());

    const uniqueCc = Array.from(new Set(allOthers)).join(", ");

    setComposeModeLabel(`Responder a todos: ${msg.subject}`);
    setComposeTo(replyTarget);
    setComposeCc(uniqueCc);
    setComposeBcc("");
    setShowCcBcc(Boolean(uniqueCc));
    setSelectedClientId("");
    setSelectedPolicyId("");
    setComposeSubject(
      msg.subject?.toLowerCase().startsWith("re:")
        ? msg.subject
        : `Re: ${msg.subject}`
    );
    setComposeBody(
      `\n\n--\n${customSignature}\n\n--- El ${new Date(
        msg.receivedAt
      ).toLocaleString("es-MX")}, ${msg.fromName || msg.fromAddress} escribió: ---\n> ${(
        msg.bodyText ||
        msg.snippet ||
        ""
      )
        .split("\n")
        .join("\n> ")}`
    );
    setComposeAttachments([]);
    setComposeMinimized(false);
    setComposeSizeMode("DOCKED_RIGHT");
    setShowComposeModal(true);
  };

  // 3. REENVIAR (Forward) — Conservando todos los archivos adjuntos originales
  const handleForwardMessage = (msg: any) => {
    setEditingDraftId(null);
    setComposeModeLabel(`Reenviar correo: ${msg.subject}`);
    setComposeTo("");
    setComposeCc("");
    setComposeBcc("");
    setShowCcBcc(false);
    setSelectedClientId("");
    setSelectedPolicyId("");
    setComposeSubject(
      msg.subject?.toLowerCase().startsWith("fwd:") ||
        msg.subject?.toLowerCase().startsWith("rv:")
        ? msg.subject
        : `Fwd: ${msg.subject}`
    );

    const forwardedHeader = `\n\n--\n${customSignature}\n\n---------- Mensaje reenviado ----------\nDe: ${
      msg.fromName ? `${msg.fromName} <${msg.fromAddress}>` : msg.fromAddress
    }\nFecha: ${new Date(msg.receivedAt).toLocaleString("es-MX")}\nAsunto: ${
      msg.subject
    }\nPara: ${msg.toAddresses}${
      msg.ccAddresses ? `\nCC: ${msg.ccAddresses}` : ""
    }\n\n${msg.bodyText || msg.snippet || ""}`;

    setComposeBody(forwardedHeader);

    const originalAttachments: AttachmentItem[] = Array.isArray(msg.attachmentsJson)
      ? msg.attachmentsJson
      : [];
    setComposeAttachments(originalAttachments);

    setComposeMinimized(false);
    setComposeSizeMode("LARGE_MODAL");
    setShowComposeModal(true);
    if (originalAttachments.length > 0) {
      notify(
        "success",
        `Se incluyeron ${originalAttachments.length} archivo(s) adjunto(s) del correo original para reenviar.`
      );
    }
  };

  // 4. CONTINUAR EDITANDO BORRADOR (Draft)
  const handleOpenDraftInComposer = (draftMsg: any) => {
    setEditingDraftId(draftMsg.id);
    setComposeModeLabel("Editando borrador guardado");
    setComposeTo(
      draftMsg.toAddresses === "borrador@pendiente.mx"
        ? ""
        : draftMsg.toAddresses || ""
    );
    setComposeCc(draftMsg.ccAddresses || "");
    setComposeBcc("");
    setShowCcBcc(Boolean(draftMsg.ccAddresses));
    setComposeSubject(
      draftMsg.subject === "(Sin asunto)" ? "" : draftMsg.subject || ""
    );
    setComposeBody(draftMsg.bodyText || draftMsg.snippet || "");
    setSelectedClientId(draftMsg.relatedClientId || "");
    setSelectedPolicyId(draftMsg.relatedPolicyId || "");
    const draftAttachments: AttachmentItem[] = Array.isArray(draftMsg.attachmentsJson)
      ? draftMsg.attachmentsJson
      : [];
    setComposeAttachments(draftAttachments);
    setComposeMinimized(false);
    setComposeSizeMode("LARGE_MODAL");
    setShowComposeModal(true);
  };

  // 5. IMPRIMIR CORREO / GUARDAR PDF PARA EXPEDIENTE
  const handlePrintMessage = (msg: any) => {
    const printWin = window.open("", "_blank", "width=860,height=720");
    if (!printWin) {
      window.print();
      return;
    }
    const attList = Array.isArray(msg.attachmentsJson) ? msg.attachmentsJson : [];
    const attHtml =
      attList.length > 0
        ? `<div style="margin-top:24px;padding-top:16px;border-top:1px solid #e2e8f0;">
            <strong style="font-size:12px;color:#475569;text-transform:uppercase;">Archivos Adjuntos (${attList.length}):</strong>
            <ul style="margin-top:8px;font-size:13px;color:#1e293b;">
              ${attList.map((a: any) => `<li>${a.filename} (${formatBytes(a.size || 0)})</li>`).join("")}
            </ul>
          </div>`
        : "";

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${msg.subject} - ${activeMailbox.emailAddress}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; padding: 36px; line-height: 1.6; }
            .brand { font-size: 12px; color: #64748b; border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 20px; display: flex; justify-content: space-between; }
            h1 { font-size: 20px; margin: 0 0 16px 0; color: #0f172a; }
            .meta { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; font-size: 13px; margin-bottom: 24px; }
            .meta div { margin-bottom: 4px; }
          </style>
        </head>
        <body>
          <div class="brand">
            <strong>${data.agency.name} — Correo Corporativo Oficial (${activeMailbox.emailAddress})</strong>
            <span>Impreso desde aacomsoft</span>
          </div>
          <h1>${msg.subject}</h1>
          <div class="meta">
            <div><strong>De:</strong> ${msg.fromName ? `${msg.fromName} &lt;${msg.fromAddress}&gt;` : msg.fromAddress}</div>
            <div><strong>Para:</strong> ${msg.toAddresses}</div>
            ${msg.ccAddresses ? `<div><strong>CC:</strong> ${msg.ccAddresses}</div>` : ""}
            <div><strong>Fecha:</strong> ${new Date(msg.receivedAt).toLocaleString("es-MX")}</div>
          </div>
          <div>${msg.bodyHtml || `<pre style="white-space:pre-wrap;font-family:inherit;">${msg.bodyText || msg.snippet}</pre>`}</div>
          ${attHtml}
          <script>window.onload = function() { window.print(); };</script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  // Convertir texto con formato simple (**negrita**, _cursiva_) a HTML limpio al enviar
  const formatBodyToCleanHtml = (rawText: string) => {
    const escaped = rawText
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/_([^_]+)_/g, "<em>$1</em>");

    return `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b; line-height: 1.65; font-size: 14px;">${escaped
      .split("\n")
      .map((line) => `<p style="margin: 0 0 8px 0;">${line || "&nbsp;"}</p>`)
      .join("")}</div>`;
  };

  // Enviar correo o guardar borrador (con validación Anti-Equivocación)
  const handleSendEmail = (saveAsDraft = false) => {
    if (!saveAsDraft && (!composeTo.trim() || !composeSubject.trim())) {
      notify("error", "Por favor indica el destinatario (Para) y el Asunto del correo.");
      return;
    }

    // Bloqueo preventivo si el Candado Anti-Equivocación detectó que el correo pertenece a OTRO cliente
    if (!saveAsDraft && policySecurityCheck?.status === "DANGER") {
      const proceed = window.confirm(
        `⚠️ ALERTA DE SEGURIDAD ANTI-EQUIVOCACIÓN:\n\n${policySecurityCheck.message}\n\n¿Estás 100% seguro de que deseas enviar esta póliza a ese destinatario?`
      );
      if (!proceed) return;
    } else if (!saveAsDraft && policySecurityCheck?.status === "WARNING") {
      const proceed = window.confirm(
        `Aviso de verificación:\n\n${policySecurityCheck.message}\n\n¿Deseas continuar con el envío?`
      );
      if (!proceed) return;
    }

    startTransition(async () => {
      try {
        const res = await sendCorporateEmailAction({
          mailboxId: activeMailbox.id,
          to: composeTo || "borrador@pendiente.mx",
          cc: composeCc || undefined,
          bcc: composeBcc || undefined,
          subject: composeSubject || "(Sin asunto)",
          bodyHtml: formatBodyToCleanHtml(composeBody),
          bodyText: composeBody,
          relatedClientId: selectedClientId || undefined,
          relatedPolicyId: selectedPolicyId || undefined,
          attachmentsJson: composeAttachments.length > 0 ? composeAttachments : undefined,
          saveAsDraft,
          draftId: editingDraftId || undefined,
          targetAgencyId: data.agency.id,
        });

        setData((prev) => {
          const withoutOldDraft = editingDraftId
            ? prev.messages.filter((m) => m.id !== editingDraftId)
            : prev.messages;
          return {
            ...prev,
            messages: [res.message, ...withoutOldDraft],
          };
        });

        setShowComposeModal(false);
        setComposeMinimized(false);
        setEditingDraftId(null);
        setComposeAttachments([]);
        setActiveFolder(saveAsDraft ? "DRAFTS" : "SENT");
        setSelectedMessageId(res.message.id);
        notify(
          "success",
          saveAsDraft
            ? "Borrador guardado en tu carpeta Borradores."
            : `Correo enviado desde ${activeMailbox.emailAddress}${
                composeAttachments.length > 0
                  ? ` con ${composeAttachments.length} archivo(s) adjunto(s).`
                  : "."
              }`
        );
      } catch (err: any) {
        notify("error", err?.message || "Error al procesar el correo.");
      }
    });
  };

  // Sincronización IMAP entrante
  const handleSyncImap = () => {
    setIsSyncing(true);
    startTransition(async () => {
      try {
        const res = await syncMailboxImapAction({
          mailboxId: activeMailbox.id,
          targetAgencyId: data.agency.id,
        });
        const nowStr = new Date().toLocaleTimeString("es-MX", {
          hour: "2-digit",
          minute: "2-digit",
        });
        setLastSyncText(`Actualizado ${nowStr}`);
        notify("success", res.detail || "Bandeja sincronizada correctamente.");
        if (res.syncedCount && res.syncedCount > 0) {
          window.location.reload();
        }
      } catch (err: any) {
        notify("error", err?.message || "No se pudo sincronizar en este momento.");
      } finally {
        setIsSyncing(false);
      }
    });
  };

  // Marcar leído / destacado / papelera individual
  const handleSelectMessage = (msg: any) => {
    if (msg.folder === "DRAFTS") {
      setSelectedMessageId(msg.id);
      handleOpenDraftInComposer(msg);
      return;
    }

    setSelectedMessageId(msg.id);
    if (layoutMode === "LIST_FULL") {
      setReadingFullView(true);
    }
    if (!msg.isRead) {
      setData((prev) => ({
        ...prev,
        messages: prev.messages.map((m) =>
          m.id === msg.id ? { ...m, isRead: true } : m
        ),
      }));
      updateEmailMessageStatusAction({
        messageId: msg.id,
        isRead: true,
        targetAgencyId: data.agency.id,
      }).catch(() => {});
    }
  };

  const handleToggleRead = (msg: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const nextRead = !msg.isRead;
    setData((prev) => ({
      ...prev,
      messages: prev.messages.map((m) =>
        m.id === msg.id ? { ...m, isRead: nextRead } : m
      ),
    }));
    updateEmailMessageStatusAction({
      messageId: msg.id,
      isRead: nextRead,
      targetAgencyId: data.agency.id,
    }).catch(() => {});
  };

  const handleToggleStar = (msg: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const nextStar = !msg.isStarred;
    setData((prev) => ({
      ...prev,
      messages: prev.messages.map((m) =>
        m.id === msg.id ? { ...m, isStarred: nextStar } : m
      ),
    }));
    updateEmailMessageStatusAction({
      messageId: msg.id,
      isStarred: nextStar,
      targetAgencyId: data.agency.id,
    }).catch(() => {});
  };

  const handleMoveToTrash = (msgId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const targetMsg = data.messages.find((m) => m.id === msgId);
    if (targetMsg?.folder === "TRASH") {
      setData((prev) => ({
        ...prev,
        messages: prev.messages.filter((m) => m.id !== msgId),
      }));
      bulkUpdateEmailMessagesAction({
        messageIds: [msgId],
        deletePermanently: true,
        targetAgencyId: data.agency.id,
      }).catch(() => {});
      notify("success", "Correo eliminado definitivamente.");
      return;
    }

    setData((prev) => ({
      ...prev,
      messages: prev.messages.map((m) =>
        m.id === msgId ? { ...m, folder: "TRASH" } : m
      ),
    }));
    updateEmailMessageStatusAction({
      messageId: msgId,
      moveToFolder: "TRASH",
      targetAgencyId: data.agency.id,
    }).catch(() => {});
    notify("success", "Correo movido a la Papelera.");
  };

  // Selección múltiple (Checkboxes)
  const toggleSelectOne = (msgId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(msgId) ? prev.filter((id) => id !== msgId) : [...prev, msgId]
    );
  };

  const allVisibleSelected =
    filteredMessages.length > 0 &&
    filteredMessages.every((m) => selectedIds.includes(m.id));

  const toggleSelectAllVisible = () => {
    if (allVisibleSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredMessages.map((m) => m.id));
    }
  };

  const handleBulkAction = (action: "READ" | "UNREAD" | "STAR" | "TRASH" | "DELETE_FOREVER") => {
    if (selectedIds.length === 0) return;
    const ids = [...selectedIds];
    setSelectedIds([]);

    if (action === "DELETE_FOREVER") {
      setData((prev) => ({
        ...prev,
        messages: prev.messages.filter((m) => !ids.includes(m.id)),
      }));
      bulkUpdateEmailMessagesAction({
        messageIds: ids,
        deletePermanently: true,
        targetAgencyId: data.agency.id,
      }).catch(() => {});
      notify("success", `${ids.length} correo(s) eliminado(s) definitivamente.`);
      return;
    }

    if (action === "TRASH") {
      setData((prev) => ({
        ...prev,
        messages: prev.messages.map((m) =>
          ids.includes(m.id) ? { ...m, folder: "TRASH" } : m
        ),
      }));
      bulkUpdateEmailMessagesAction({
        messageIds: ids,
        moveToFolder: "TRASH",
        targetAgencyId: data.agency.id,
      }).catch(() => {});
      notify("success", `${ids.length} correo(s) movido(s) a la Papelera.`);
      return;
    }

    if (action === "READ" || action === "UNREAD") {
      const isRead = action === "READ";
      setData((prev) => ({
        ...prev,
        messages: prev.messages.map((m) =>
          ids.includes(m.id) ? { ...m, isRead } : m
        ),
      }));
      bulkUpdateEmailMessagesAction({
        messageIds: ids,
        isRead,
        targetAgencyId: data.agency.id,
      }).catch(() => {});
      notify(
        "success",
        `${ids.length} correo(s) marcado(s) como ${isRead ? "leído(s)" : "no leído(s)"}.`
      );
      return;
    }

    if (action === "STAR") {
      setData((prev) => ({
        ...prev,
        messages: prev.messages.map((m) =>
          ids.includes(m.id) ? { ...m, isStarred: true } : m
        ),
      }));
      bulkUpdateEmailMessagesAction({
        messageIds: ids,
        isStarred: true,
        targetAgencyId: data.agency.id,
      }).catch(() => {});
    }
  };

  const handleEmptyTrash = () => {
    startTransition(async () => {
      try {
        await emptyTrashAction({
          mailboxId: activeMailbox.id,
          targetAgencyId: data.agency.id,
        });
        setData((prev) => ({
          ...prev,
          messages: prev.messages.filter((m) => m.folder !== "TRASH"),
        }));
        notify("success", "La Papelera ha sido vaciada por completo.");
      } catch (err: any) {
        notify("error", err?.message || "No se pudo vaciar la papelera.");
      }
    });
  };

  const handleSimulateClientIncoming = () => {
    startTransition(async () => {
      try {
        const res = await simulateIncomingClientEmailAction({
          toEmail: activeMailbox.emailAddress,
          targetAgencyId: data.agency.id,
        });
        notify(
          "success",
          `Correo entrante recibido en ${res.deliveredTo}. Actualizando bandeja...`
        );
        window.location.reload();
      } catch (err: any) {
        notify("error", err?.message || "No se pudo simular el correo.");
      }
    });
  };

  const copyText = (key: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedField(key);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const selectedAttachments: AttachmentItem[] = Array.isArray(
    selectedMessage?.attachmentsJson
  )
    ? selectedMessage.attachmentsJson
    : [];

  const splitListWidthClass =
    listWidthPreset === "COMPACT"
      ? "lg:w-[320px] xl:w-[350px]"
      : listWidthPreset === "WIDE"
      ? "lg:w-[480px] xl:w-[540px]"
      : "lg:w-[380px] xl:w-[430px]";

  return (
    <div className="-mx-4 -my-4 md:-mx-8 md:-my-8 h-[calc(100vh-4rem)] flex flex-col bg-white overflow-hidden select-none sm:select-auto">
      {/* Notificación flotante */}
      {toast && (
        <div
          className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-[90] flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl border text-sm font-semibold transition-all ${
            toast.type === "success"
              ? "bg-slate-900 text-white border-slate-700"
              : "bg-rose-950 text-rose-100 border-rose-800"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
          )}
          <span>{toast.text}</span>
        </div>
      )}

      {/* BARRA SUPERIOR COMPACTA FULL-BLEED ESTILO GMAIL WORKSPACE (56px) */}
      <div className="h-14 px-3 sm:px-5 border-b border-slate-200 bg-slate-50/90 flex items-center justify-between gap-3 shrink-0">
        {/* Izquierda: Botón Hamburguesa + Identidad de Buzón Activo */}
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? "Mostrar panel de carpetas" : "Ocultar panel de carpetas para ganar espacio"}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 transition"
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="h-5 w-5" />
            ) : (
              <PanelLeftClose className="h-5 w-5" />
            )}
          </button>

          <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center shadow-sm shrink-0">
            <Mail className="h-4 w-4" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {data.accessibleMailboxes.length > 1 ? (
                <div className="relative">
                  <select
                    aria-label="Seleccionar buzón activo"
                    value={activeMailbox.id}
                    onChange={(e) => {
                      window.location.href = `/mi-correo?mailboxId=${e.target.value}`;
                    }}
                    className="appearance-none bg-white border border-slate-300 hover:border-sky-500 rounded-lg px-2.5 py-1 pr-7 text-xs sm:text-sm font-bold text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                  >
                    {data.accessibleMailboxes.map((mb) => (
                      <option key={mb.id} value={mb.id}>
                        {mb.emailAddress} ({mb.displayName})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              ) : (
                <span className="text-xs sm:text-sm font-bold text-slate-900 font-mono truncate">
                  {activeMailbox.emailAddress}
                </span>
              )}
              <span className="hidden xl:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck className="h-3 w-3" />3 GB
              </span>
            </div>
          </div>
        </div>

        {/* Centro: Omnibox de Búsqueda estilo Gmail */}
        <div className="flex-1 max-w-xl mx-2">
          <div className="relative">
            <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por cliente, correo, póliza, asunto o archivo adjunto..."
              className="w-full bg-white hover:bg-slate-100/60 focus:bg-white border border-slate-200/90 focus:border-sky-500 rounded-full pl-10 pr-9 py-1.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Derecha: Sincronizar IMAP + Firma + Selector de Vista + Celular + Admin */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleSyncImap}
            disabled={isSyncing || isPending}
            title="Sincronizar nuevos correos recibidos en el servidor"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold transition disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-sky-600 ${isSyncing ? "animate-spin" : ""}`} />
            <span className="hidden md:inline">{isSyncing ? "Sincronizando..." : lastSyncText}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSigDraftDisplayName(activeMailbox.displayName || "");
              setSigDraftText(customSignature);
              setShowSignatureModal(true);
            }}
            title="Configurar o modificar tu firma de correo"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold transition"
          >
            <PenTool className="h-3.5 w-3.5 text-sky-600" />
            <span className="hidden lg:inline">Mi Firma</span>
          </button>

          {/* Selector de Vista: Lista Ancho Completo (Gmail) vs Panel Dividido */}
          <div className="hidden md:flex items-center bg-slate-200/70 p-0.5 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setLayoutMode("LIST_FULL");
                setReadingFullView(false);
              }}
              title="Vista Lista de Ancho Completo (estilo Gmail)"
              className={`px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition ${
                layoutMode === "LIST_FULL"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Rows className="h-3.5 w-3.5" />
              <span className="hidden xl:inline">Lista Completa</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setLayoutMode("SPLIT");
                setReadingFullView(false);
              }}
              title="Vista de Panel Dividido (Lista + Lectura simultánea)"
              className={`px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition ${
                layoutMode === "SPLIT"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Columns className="h-3.5 w-3.5" />
              <span className="hidden xl:inline">Panel Dividido</span>
            </button>
          </div>

          {layoutMode === "SPLIT" && (
            <button
              type="button"
              onClick={() =>
                setListWidthPreset((prev) =>
                  prev === "COMPACT" ? "MEDIUM" : prev === "MEDIUM" ? "WIDE" : "COMPACT"
                )
              }
              title="Ajustar ancho de la columna de lista vs lectura"
              className="hidden lg:inline-flex items-center gap-1 px-2 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 text-xs font-semibold transition"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span className="text-[11px]">
                {listWidthPreset === "COMPACT"
                  ? "Lectura Amplia"
                  : listWidthPreset === "WIDE"
                  ? "Lista Amplia"
                  : "Equilibrado"}
              </span>
            </button>
          )}

          {data.currentUser.isAdmin && (
            <Link
              href="/correos-corporativos"
              title="Administrar los 20 buzones y Puente de Cartera"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition"
            >
              <Building2 className="h-3.5 w-3.5 text-sky-400" />
              <span className="hidden xl:inline">20 Asientos</span>
            </Link>
          )}
        </div>
      </div>

      {/* Banner de Puente de Cartera si este buzón recibe correos de ex-agentes */}
      {data.activeForwards.length > 0 && (
        <div className="bg-sky-50 border-b border-sky-200/80 px-4 py-1.5 flex items-center justify-between gap-2 text-xs text-sky-900 shrink-0">
          <div className="flex items-center gap-2 truncate">
            <FolderSync className="h-3.5 w-3.5 text-sky-600 shrink-0" />
            <span className="truncate">
              <strong>Puente de Cartera Activo:</strong> Recibes automáticamente los correos enviados a{" "}
              {data.activeForwards.map((f) => f.sourceEmail).join(", ")}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setActiveFolder("MIGRATED")}
            className="text-sky-700 hover:text-sky-950 font-bold underline shrink-0"
          >
            Ver Cartera Heredada
          </button>
        </div>
      )}

      {/* CUERPO PRINCIPAL EDGE-TO-EDGE (Sidebar + Lista + Lector) */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* 1. SIDEBAR IZQUIERDO DE CARPETAS (Colapsable con ☰) */}
        <div
          className={`${
            sidebarCollapsed ? "w-16" : "w-56 xl:w-60"
          } border-r border-slate-200 bg-slate-50/50 flex flex-col justify-between p-2.5 shrink-0 transition-all duration-150 overflow-y-auto`}
        >
          <div className="space-y-3">
            {/* Botones Principales: Redactar Correo y Enviar Póliza */}
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={openComposeNew}
                title="Redactar Correo Nuevo"
                className={`w-full flex items-center ${
                  sidebarCollapsed ? "justify-center px-0 py-3" : "gap-3 px-4 py-3"
                } rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm shadow-md shadow-sky-600/20 transition`}
              >
                <Plus className="h-5 w-5 shrink-0" />
                {!sidebarCollapsed && <span>Redactar Correo</span>}
              </button>

              {!sidebarCollapsed && (
                <button
                  type="button"
                  onClick={openComposeNew}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white hover:bg-sky-50 text-sky-700 border border-sky-200 font-semibold text-xs transition shadow-sm"
                >
                  <FileCheck2 className="h-3.5 w-3.5" />
                  <span>Enviar Póliza / Cartera</span>
                </button>
              )}
            </div>

            {/* Lista de Carpetas */}
            <nav className="space-y-0.5">
              {[
                {
                  id: "INBOX" as FolderType,
                  label: "Recibidos",
                  icon: Inbox,
                  badge: counts.INBOX,
                },
                {
                  id: "STARRED" as FolderType,
                  label: "Destacados",
                  icon: Star,
                  badge: counts.STARRED,
                },
                {
                  id: "SENT" as FolderType,
                  label: "Enviados",
                  icon: Send,
                  badge: 0,
                },
                {
                  id: "DRAFTS" as FolderType,
                  label: "Borradores",
                  icon: FileText,
                  badge: counts.DRAFTS,
                },
                {
                  id: "MIGRATED" as FolderType,
                  label: "Cartera Heredada",
                  icon: FolderSync,
                  badge: counts.MIGRATED,
                },
                {
                  id: "TRASH" as FolderType,
                  label: "Papelera",
                  icon: Trash2,
                  badge: counts.TRASH,
                },
              ].map((folder) => {
                const Icon = folder.icon;
                const isActive = activeFolder === folder.id;
                return (
                  <button
                    key={folder.id}
                    type="button"
                    title={folder.label}
                    onClick={() => {
                      setActiveFolder(folder.id);
                      setReadingFullView(false);
                      setSelectedIds([]);
                      const firstInFolder = data.messages.find((m) =>
                        folder.id === "STARRED"
                          ? m.isStarred && m.folder !== "TRASH"
                          : m.folder === folder.id
                      );
                      setSelectedMessageId(firstInFolder?.id || null);
                    }}
                    className={`w-full flex items-center ${
                      sidebarCollapsed ? "justify-center px-2 py-2.5" : "justify-between px-3 py-2"
                    } rounded-xl text-xs sm:text-sm font-semibold transition ${
                      isActive
                        ? "bg-sky-100/90 text-sky-950 font-bold"
                        : "text-slate-600 hover:bg-slate-200/60 hover:text-slate-900"
                    }`}
                  >
                    <span className="flex items-center gap-2.5 truncate">
                      <Icon
                        className={`h-4 w-4 shrink-0 ${
                          isActive ? "text-sky-700" : "text-slate-500"
                        }`}
                      />
                      {!sidebarCollapsed && <span className="truncate">{folder.label}</span>}
                    </span>
                    {!sidebarCollapsed && folder.badge > 0 && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          isActive
                            ? "bg-sky-600 text-white"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {folder.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Almacenamiento y Simulador inferior */}
          {!sidebarCollapsed && (
            <div className="space-y-2.5 pt-3 border-t border-slate-200/80">
              <div className="px-2 space-y-1">
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                  <span>Almacenamiento</span>
                  <span>
                    {activeMailbox.storageUsedMb || 18} MB / {(activeMailbox.storageLimitGb || 3) * 1024} MB
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-sky-600 rounded-full" style={{ width: "3%" }} />
                </div>
              </div>

              <button
                type="button"
                onClick={handleSimulateClientIncoming}
                disabled={isPending}
                className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 text-[11px] font-semibold transition disabled:opacity-50"
              >
                <Sparkles className="h-3 w-3 text-sky-600" />
                Simular Correo Entrante
              </button>
            </div>
          )}
        </div>

        {/* 2. COLUMNA DE LISTA DE CORREOS (Con Checkboxes, Acciones en Lote y Hover Actions) */}
        {!(layoutMode === "LIST_FULL" && readingFullView) && (
          <div
            className={`${
              layoutMode === "LIST_FULL"
                ? "flex-1"
                : `w-full ${splitListWidthClass} border-r border-slate-200`
            } flex flex-col bg-white min-h-0 shrink-0`}
          >
            {/* Barra de herramientas de la bandeja */}
            <div className="h-11 px-3 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={toggleSelectAllVisible}
                  title="Seleccionar todos los correos de esta vista"
                  className="p-1 rounded hover:bg-slate-200/70 text-slate-600 transition"
                >
                  {allVisibleSelected ? (
                    <CheckSquare className="h-4 w-4 text-sky-600" />
                  ) : (
                    <Square className="h-4 w-4 text-slate-400" />
                  )}
                </button>

                {selectedIds.length > 0 ? (
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-sky-800 bg-sky-100 px-2 py-0.5 rounded-md mr-1">
                      {selectedIds.length} seleccionados
                    </span>
                    <button
                      type="button"
                      onClick={() => handleBulkAction("READ")}
                      title="Marcar seleccionados como leídos"
                      className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1"
                    >
                      <MailOpen className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Leído</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBulkAction("UNREAD")}
                      title="Marcar seleccionados como no leídos"
                      className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1"
                    >
                      <Mail className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">No leído</span>
                    </button>
                    {activeFolder === "TRASH" ? (
                      <button
                        type="button"
                        onClick={() => handleBulkAction("DELETE_FOREVER")}
                        className="p-1.5 rounded-lg hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center gap-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Eliminar definitivo</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleBulkAction("TRASH")}
                        title="Mover seleccionados a la Papelera"
                        className="p-1.5 rounded-lg hover:bg-rose-100 text-rose-600 text-xs font-semibold flex items-center gap-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Eliminar</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {activeFolder === "INBOX" && "Bandeja de Recibidos"}
                    {activeFolder === "STARRED" && "Correos Destacados"}
                    {activeFolder === "SENT" && "Correos Enviados"}
                    {activeFolder === "DRAFTS" && "Borradores (Clic para continuar escribiendo)"}
                    {activeFolder === "MIGRATED" && "Cartera Heredada"}
                    {activeFolder === "TRASH" && "Papelera"}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {activeFolder === "TRASH" && filteredMessages.length > 0 && (
                  <button
                    type="button"
                    onClick={handleEmptyTrash}
                    disabled={isPending}
                    className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition"
                  >
                    Vaciar papelera ahora
                  </button>
                )}
                <span className="text-xs text-slate-400 font-medium">
                  {filteredMessages.length} mensaje(s)
                </span>
              </div>
            </div>

            {/* Filas de Mensajes */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {filteredMessages.length === 0 ? (
                <div className="p-12 text-center space-y-2">
                  <Inbox className="h-9 w-9 text-slate-300 mx-auto" />
                  <p className="text-sm font-semibold text-slate-600">
                    No hay correos en esta vista
                  </p>
                  <p className="text-xs text-slate-400">
                    Usa el botón Redactar Correo o sincroniza tu bandeja.
                  </p>
                </div>
              ) : (
                filteredMessages.map((msg) => {
                  const isSelected = selectedMessage?.id === msg.id;
                  const isChecked = selectedIds.includes(msg.id);
                  const msgAttachments: AttachmentItem[] = Array.isArray(msg.attachmentsJson)
                    ? msg.attachmentsJson
                    : [];

                  return (
                    <div
                      key={msg.id}
                      onClick={() => handleSelectMessage(msg)}
                      className={`group relative w-full text-left px-3 py-2.5 transition cursor-pointer flex items-start gap-2.5 ${
                        isChecked
                          ? "bg-sky-100/70"
                          : isSelected && layoutMode === "SPLIT"
                          ? "bg-sky-50/90 border-l-4 border-l-sky-600"
                          : !msg.isRead
                          ? "bg-white hover:bg-slate-50 font-semibold"
                          : "bg-slate-50/35 hover:bg-slate-100/60 text-slate-600"
                      }`}
                    >
                      {/* Checkbox + Estrella */}
                      <div className="flex items-center gap-1.5 pt-0.5 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => toggleSelectOne(msg.id, e)}
                          className="text-slate-400 hover:text-sky-600 transition"
                        >
                          {isChecked ? (
                            <CheckSquare className="h-4 w-4 text-sky-600" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleToggleStar(msg, e)}
                          className="text-slate-300 hover:text-amber-400 transition"
                        >
                          <Star
                            className={`h-4 w-4 ${
                              msg.isStarred ? "fill-amber-400 text-amber-400" : ""
                            }`}
                          />
                        </button>
                      </div>

                      {/* Contenido de la fila */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {!msg.isRead && (
                              <span className="w-2 h-2 rounded-full bg-sky-600 shrink-0" />
                            )}
                            <span
                              className={`text-xs sm:text-sm truncate ${
                                !msg.isRead ? "font-bold text-slate-900" : "font-medium text-slate-700"
                              }`}
                            >
                              {msg.folder === "SENT" || msg.folder === "DRAFTS"
                                ? `Para: ${
                                    msg.toAddresses === "borrador@pendiente.mx"
                                      ? "(Sin destinatario)"
                                      : msg.toAddresses
                                  }`
                                : msg.fromName || msg.fromAddress}
                            </span>
                            {msg.folder === "DRAFTS" && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                                Borrador
                              </span>
                            )}
                          </div>

                          <span className="text-[11px] text-slate-400 shrink-0 group-hover:hidden">
                            {new Date(msg.receivedAt).toLocaleDateString("es-MX", {
                              day: "2-digit",
                              month: "short",
                            })}
                          </span>

                          {/* Acciones rápidas en Hover */}
                          <div className="hidden group-hover:flex items-center gap-1 bg-white/95 px-1.5 py-0.5 rounded-lg shadow-sm border border-slate-200 shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReplyMessage(msg);
                              }}
                              title="Responder"
                              className="p-1 rounded hover:bg-slate-100 text-slate-600 hover:text-sky-600"
                            >
                              <Reply className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleForwardMessage(msg);
                              }}
                              title="Reenviar"
                              className="p-1 rounded hover:bg-slate-100 text-slate-600 hover:text-sky-600"
                            >
                              <Forward className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleToggleRead(msg, e)}
                              title={msg.isRead ? "Marcar como no leído" : "Marcar como leído"}
                              className="p-1 rounded hover:bg-slate-100 text-slate-600 hover:text-sky-600"
                            >
                              {msg.isRead ? (
                                <Mail className="h-3.5 w-3.5" />
                              ) : (
                                <MailOpen className="h-3.5 w-3.5" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleMoveToTrash(msg.id, e)}
                              title="Eliminar"
                              className="p-1 rounded hover:bg-rose-50 text-slate-600 hover:text-rose-600"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        <p
                          className={`text-xs sm:text-sm truncate mt-0.5 ${
                            !msg.isRead ? "font-bold text-slate-900" : "font-medium text-slate-800"
                          }`}
                        >
                          {msg.subject}
                        </p>

                        <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                          {msg.snippet}
                        </p>

                        {(msgAttachments.length > 0 || msg.migratedFrom) && (
                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            {msgAttachments.slice(0, 2).map((att, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200 max-w-[180px] truncate"
                              >
                                {getAttachmentIcon(att.mimeType, att.filename)}
                                <span className="truncate">{att.filename}</span>
                              </span>
                            ))}
                            {msgAttachments.length > 2 && (
                              <span className="text-[10px] font-bold text-slate-500">
                                +{msgAttachments.length - 2} más
                              </span>
                            )}
                            {msg.migratedFrom && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-100 text-sky-800">
                                <FolderSync className="h-2.5 w-2.5" />
                                Puente: {msg.migratedFrom}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* 3. PANEL DE LECTURA DEL CORREO */}
        {(layoutMode === "SPLIT" || readingFullView) && (
          <div className="flex-1 flex flex-col bg-white min-w-0 min-h-0 overflow-hidden">
            {!selectedMessage ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                <Mail className="h-12 w-12 text-slate-200 mb-3" />
                <p className="text-base font-semibold text-slate-600">
                  Selecciona un correo para leerlo
                </p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  Puedes responder, responder a todos, reenviar con archivos adjuntos o imprimir cualquier correo para tus expedientes en aacomsoft.
                </p>
              </div>
            ) : (
              <>
                {/* Barra de Acciones Superior del Lector */}
                <div className="h-12 px-4 sm:px-6 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between gap-2 shrink-0">
                  <div className="flex items-center gap-2">
                    {layoutMode === "LIST_FULL" && (
                      <button
                        type="button"
                        onClick={() => setReadingFullView(false)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition"
                      >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Volver a la lista
                      </button>
                    )}

                    {selectedMessage.folder === "DRAFTS" && (
                      <button
                        type="button"
                        onClick={() => handleOpenDraftInComposer(selectedMessage)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-sm transition"
                      >
                        <PenTool className="h-3.5 w-3.5" />
                        Continuar editando borrador
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleReplyMessage(selectedMessage)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition"
                    >
                      <Reply className="h-3.5 w-3.5 text-sky-600" />
                      Responder
                    </button>

                    <button
                      type="button"
                      onClick={() => handleReplyAllMessage(selectedMessage)}
                      className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition"
                    >
                      <ReplyAll className="h-3.5 w-3.5 text-sky-600" />
                      Responder a todos
                    </button>

                    <button
                      type="button"
                      onClick={() => handleForwardMessage(selectedMessage)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition"
                    >
                      <Forward className="h-3.5 w-3.5 text-indigo-600" />
                      Reenviar
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handlePrintMessage(selectedMessage)}
                      title="Imprimir correo o guardar como PDF para expediente"
                      className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 transition"
                    >
                      <Printer className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleRead(selectedMessage)}
                      title={selectedMessage.isRead ? "Marcar como no leído" : "Marcar como leído"}
                      className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 transition"
                    >
                      {selectedMessage.isRead ? (
                        <Mail className="h-4 w-4" />
                      ) : (
                        <MailOpen className="h-4 w-4 text-sky-600" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleStar(selectedMessage)}
                      title="Destacar con estrella"
                      className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 transition"
                    >
                      <Star
                        className={`h-4 w-4 ${
                          selectedMessage.isStarred ? "fill-amber-400 text-amber-400" : ""
                        }`}
                      />
                    </button>

                    {selectedMessage.folder === "TRASH" ? (
                      <button
                        type="button"
                        onClick={() => {
                          setData((prev) => ({
                            ...prev,
                            messages: prev.messages.map((m) =>
                              m.id === selectedMessage.id ? { ...m, folder: "INBOX" } : m
                            ),
                          }));
                          updateEmailMessageStatusAction({
                            messageId: selectedMessage.id,
                            moveToFolder: "INBOX",
                            targetAgencyId: data.agency.id,
                          });
                          notify("success", "Correo restaurado a Recibidos.");
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition"
                      >
                        Restaurar a Recibidos
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleMoveToTrash(selectedMessage.id)}
                        title="Mover a la Papelera"
                        className="p-1.5 rounded-lg bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 transition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Contenido Scrollable del Correo */}
                <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-6">
                  <div className="space-y-4 pb-5 border-b border-slate-100">
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
                      {selectedMessage.subject}
                    </h2>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-sky-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
                          {(selectedMessage.fromName || selectedMessage.fromAddress || "A")
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                        <div className="space-y-0.5 text-xs">
                          <div className="font-bold text-slate-900 text-sm">
                            {selectedMessage.fromName || selectedMessage.fromAddress}{" "}
                            <span className="font-mono font-normal text-slate-500 text-xs">
                              &lt;{selectedMessage.fromAddress}&gt;
                            </span>
                          </div>
                          <div className="text-slate-500">
                            Para:{" "}
                            <span className="font-mono text-slate-700">
                              {selectedMessage.toAddresses}
                            </span>
                            {selectedMessage.ccAddresses && (
                              <span className="ml-2">
                                • CC:{" "}
                                <span className="font-mono text-slate-700">
                                  {selectedMessage.ccAddresses}
                                </span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-xs text-slate-400 flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        {new Date(selectedMessage.receivedAt).toLocaleString("es-MX")}
                      </div>
                    </div>
                  </div>

                  {/* Tarjetas de Archivos Adjuntos Descargables */}
                  {selectedAttachments.length > 0 && (
                    <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                          <Paperclip className="h-3.5 w-3.5 text-sky-600" />
                          {selectedAttachments.length} Archivo(s) Adjunto(s)
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5">
                        {selectedAttachments.map((att, idx) => {
                          const downloadHref = att.url
                            ? att.url
                            : att.contentBase64
                            ? `data:${att.mimeType || "application/octet-stream"};base64,${att.contentBase64}`
                            : "#";

                          return (
                            <div
                              key={idx}
                              className="flex items-center justify-between gap-3 bg-white border border-slate-200 hover:border-sky-300 rounded-xl p-2.5 shadow-sm transition"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                                  {getAttachmentIcon(att.mimeType, att.filename)}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-slate-900 truncate">
                                    {att.filename}
                                  </p>
                                  <p className="text-[11px] text-slate-400">
                                    {formatBytes(att.size)}
                                  </p>
                                </div>
                              </div>

                              <a
                                href={downloadHref}
                                download={att.filename}
                                target={att.url ? "_blank" : undefined}
                                rel="noreferrer"
                                className="p-2 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 transition shrink-0"
                                title="Descargar archivo"
                              >
                                <Download className="h-4 w-4" />
                              </a>
                            </div>
                          );
                        })}
                      </div>

                      {selectedAttachments.some(
                        (a) => (a.mimeType || "").startsWith("image/") && a.contentBase64
                      ) && (
                        <div className="pt-2 flex flex-wrap gap-3">
                          {selectedAttachments
                            .filter(
                              (a) => (a.mimeType || "").startsWith("image/") && a.contentBase64
                            )
                            .map((img, i) => (
                              <img
                                key={i}
                                src={`data:${img.mimeType};base64,${img.contentBase64}`}
                                alt={img.filename}
                                className="max-h-52 rounded-xl border border-slate-200 shadow-sm object-contain bg-white"
                              />
                            ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Cuerpo del Correo */}
                  <div
                    className="prose prose-slate max-w-none text-sm text-slate-800 leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html:
                        selectedMessage.bodyHtml ||
                        `<p>${selectedMessage.bodyText || selectedMessage.snippet}</p>`,
                    }}
                  />

                  {/* Botones Inferiores Rápidos Estilo Gmail */}
                  <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleReplyMessage(selectedMessage)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs sm:text-sm font-bold transition shadow-sm"
                    >
                      <Reply className="h-4 w-4 text-sky-600" />
                      Responder
                    </button>

                    <button
                      type="button"
                      onClick={() => handleReplyAllMessage(selectedMessage)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs sm:text-sm font-bold transition shadow-sm"
                    >
                      <ReplyAll className="h-4 w-4 text-sky-600" />
                      Responder a todos
                    </button>

                    <button
                      type="button"
                      onClick={() => handleForwardMessage(selectedMessage)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs sm:text-sm font-bold transition shadow-sm"
                    >
                      <Forward className="h-4 w-4 text-indigo-600" />
                      Reenviar
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* REDACTOR DE CORREO ESTILO GMAIL (CON CANDADO ANTI-EQUIVOCACIÓN Y AUTO-GUARDADO EN BORRADORES AL SALIR) */}
      {showComposeModal && (
        <div
          onClick={() => {
            // Si hace clic en el fondo oscuro del modal, auto-guarda en Borradores y cierra igual que Gmail
            if (!composeMinimized && composeSizeMode === "LARGE_MODAL") {
              handleCloseComposeWithAutoDraft();
            }
          }}
          className={
            composeMinimized
              ? "fixed bottom-0 right-6 z-50 w-80 shadow-2xl rounded-t-2xl overflow-hidden border border-slate-300 bg-white"
              : composeSizeMode === "LARGE_MODAL"
              ? "fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-[2px] flex items-center justify-center p-2 sm:p-5"
              : "fixed bottom-0 right-4 z-50 w-full max-w-[650px] h-[82vh] shadow-2xl rounded-t-2xl overflow-hidden border border-slate-300 bg-white flex flex-col"
          }
          onDragOver={(e) => {
            e.preventDefault();
            if (!composeMinimized) setIsDraggingOver(true);
          }}
          onDragLeave={() => setIsDraggingOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDraggingOver(false);
            if (!composeMinimized && e.dataTransfer?.files?.length) {
              processUploadedFiles(e.dataTransfer.files);
            }
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={
              composeMinimized
                ? "w-full"
                : composeSizeMode === "LARGE_MODAL"
                ? "bg-white border border-slate-200 rounded-2xl max-w-5xl w-full h-[90vh] shadow-2xl flex flex-col overflow-hidden"
                : "flex-1 flex flex-col overflow-hidden"
            }
          >
            {/* Barra de título oscura estilo Gmail */}
            <div
              onClick={() => {
                if (composeMinimized) setComposeMinimized(false);
              }}
              className="bg-slate-900 text-white px-4 py-2.5 flex items-center justify-between cursor-pointer select-none shrink-0"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Mail className="h-4 w-4 text-sky-400 shrink-0" />
                <span className="text-xs sm:text-sm font-bold truncate">
                  {composeSubject ? composeSubject : composeModeLabel}
                </span>
                <span className="hidden md:inline-block text-[11px] text-slate-400 font-mono truncate">
                  ({activeMailbox.emailAddress})
                </span>
              </div>

              <div
                className="flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => setComposeMinimized(!composeMinimized)}
                  title={composeMinimized ? "Restaurar" : "Minimizar en barra inferior"}
                  className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setComposeMinimized(false);
                    setComposeSizeMode((prev) =>
                      prev === "LARGE_MODAL" ? "DOCKED_RIGHT" : "LARGE_MODAL"
                    );
                  }}
                  title={
                    composeSizeMode === "LARGE_MODAL"
                      ? "Acoplar a la derecha para leer el correo de fondo"
                      : "Expandir a ventana amplia centrada"
                  }
                  className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition"
                >
                  {composeSizeMode === "LARGE_MODAL" ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCloseComposeWithAutoDraft}
                  title="Cerrar y guardar automáticamente en Borradores"
                  className="p-1.5 rounded hover:bg-rose-600 text-slate-300 hover:text-white transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Contenido del Redactor */}
            {!composeMinimized && (
              <>
                <div className="flex-1 overflow-y-auto px-5 py-3 flex flex-col gap-2.5 relative">
                  {/* Overlay de Drag & Drop */}
                  {isDraggingOver && (
                    <div className="absolute inset-3 z-30 rounded-2xl border-2 border-dashed border-sky-500 bg-sky-50/95 flex flex-col items-center justify-center gap-2 pointer-events-none">
                      <Paperclip className="h-10 w-10 text-sky-600 animate-bounce" />
                      <p className="text-base font-bold text-sky-950">
                        Suelta tus archivos, imágenes, PDFs o presentaciones aquí
                      </p>
                      <p className="text-xs text-sky-700">
                        Se adjuntarán automáticamente a tu correo
                      </p>
                    </div>
                  )}

                  {/* BLOQUE DE CARTERA CON CANDADO ANTI-EQUIVOCACIÓN (CLIENTE <-> SUS PÓLIZAS) */}
                  <div className="bg-sky-50/90 border border-sky-200 rounded-xl p-3 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-sky-950">
                        <Lock className="h-3.5 w-3.5 text-sky-600 shrink-0" />
                        <span>Conectar con Cartera aacomsoft (Candado Anti-Equivocación):</span>
                      </div>

                      {(selectedClientId || selectedPolicyId) && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedClientId("");
                            setSelectedPolicyId("");
                            setComposeAttachments((prev) =>
                              prev.filter((a) => !a.filename.startsWith("Caratula_Poliza_"))
                            );
                          }}
                          className="text-[11px] font-semibold text-slate-500 hover:text-rose-600 underline"
                        >
                          Desvincular cliente/póliza
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {/* Selector 1: Asegurado */}
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-sky-800 mb-1">
                          1. Asegurado Titular ({data.clients.length})
                        </label>
                        <select
                          aria-label="Elegir Cliente de tu Cartera"
                          value={selectedClientId}
                          onChange={(e) => handleSelectClient(e.target.value)}
                          className="w-full bg-white border border-sky-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                        >
                          <option value="">👤 -- Seleccionar asegurado --</option>
                          {data.clients.map((c) => (
                            <option key={c.id} value={c.id}>
                              {cleanPersonName(c.name)} {c.email ? `(${c.email.trim()})` : "(Sin correo)"}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Selector 2: Pólizas acotadas estrictamente al asegurado elegido */}
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-sky-800 mb-1">
                          {selectedClientObj
                            ? `2. Pólizas exclusivas de ${cleanPersonName(selectedClientObj.name)} (${availablePoliciesForCompose.length})`
                            : `2. Póliza a enviar (${availablePoliciesForCompose.length})`}
                        </label>
                        <select
                          aria-label="Insertar Póliza de tu Cartera"
                          value={selectedPolicyId}
                          onChange={(e) => handleSelectPolicy(e.target.value)}
                          className="w-full bg-white border border-sky-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                        >
                          <option value="">
                            {selectedClientObj
                              ? availablePoliciesForCompose.length > 0
                                ? `📄 -- Elegir entre las ${availablePoliciesForCompose.length} póliza(s) de este cliente --`
                                : "⚠️ Este cliente no tiene pólizas registradas"
                              : "📄 -- Seleccionar póliza --"}
                          </option>
                          {availablePoliciesForCompose.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.policyNumber} — {cleanPersonName(p.insuranceCompany) || "Seguro"}{" "}
                              {p.pdfUrl ? "📎 [PDF en sistema]" : "[Sin PDF]"} (
                              {cleanPersonName(p.contractor || p.insured) || "Asegurado"})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* BOTÓN DIRECTO PARA INSERTAR EL PDF DE LA PÓLIZA SUBIDA EN EL SISTEMA */}
                    {selectedPolicyObj && (
                      <div className="bg-white border border-sky-200/90 rounded-lg px-3 py-2 flex flex-wrap items-center justify-between gap-2 shadow-sm">
                        {selectedPolicyObj.pdfUrl ? (
                          <>
                            <div className="flex items-center gap-2 text-xs text-slate-800">
                              <FileCheck2 className="h-4 w-4 text-emerald-600 shrink-0" />
                              <span>
                                <strong>PDF de Póliza #{selectedPolicyObj.policyNumber}</strong> disponible en el sistema
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5">
                              {composeAttachments.some(
                                (a) =>
                                  a.filename ===
                                  `Caratula_Poliza_${selectedPolicyObj.policyNumber}.pdf`
                              ) ? (
                                <button
                                  type="button"
                                  onClick={() => handleInsertPolicyPdf(selectedPolicyObj)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm"
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  <span>PDF de Póliza Insertado (Reinsertar texto/link)</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleInsertPolicyPdf(selectedPolicyObj)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition shadow-sm animate-pulse"
                                >
                                  <FileCheck2 className="h-3.5 w-3.5" />
                                  <span>📎 Insertar PDF de la Póliza en el Correo</span>
                                </button>
                              )}

                              <a
                                href={selectedPolicyObj.pdfUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                                title="Abrir y verificar el PDF de la póliza en una pestaña nueva"
                              >
                                <ExternalLink className="h-3 w-3" />
                                <span>Ver PDF</span>
                              </a>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center gap-2 text-xs text-amber-900">
                              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                              <span>
                                La póliza <strong>#{selectedPolicyObj.policyNumber}</strong> aún no tiene su PDF subido en Mi Cartera.
                              </span>
                            </div>
                            <div>
                              <input
                                ref={policyPdfUploadInputRef}
                                type="file"
                                accept="application/pdf,.pdf"
                                onChange={(e) => {
                                  handleUploadNewPolicyPdfAndInsert(e.target.files);
                                  e.target.value = "";
                                }}
                                className="hidden"
                              />
                              <button
                                type="button"
                                disabled={isUploadingPolicyPdf}
                                onClick={() => policyPdfUploadInputRef.current?.click()}
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition shadow-sm disabled:opacity-50"
                              >
                                <Upload className="h-3.5 w-3.5" />
                                <span>
                                  {isUploadingPolicyPdf
                                    ? "Subiendo e insertando PDF..."
                                    : "Subir PDF a esta póliza e insertarlo"}
                                </span>
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {/* Si eligió cliente pero aún no ha elegido cuál de sus pólizas con PDF insertar, mostrar botones rápidos */}
                    {!selectedPolicyObj &&
                      selectedClientObj &&
                      availablePoliciesForCompose.some((p) => Boolean(p.pdfUrl)) && (
                        <div className="bg-white border border-sky-200/90 rounded-lg px-3 py-2 flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-slate-700">
                            📎 Pólizas con PDF en el sistema de{" "}
                            <strong>{cleanPersonName(selectedClientObj.name)}</strong>:
                          </span>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {availablePoliciesForCompose
                              .filter((p) => Boolean(p.pdfUrl))
                              .map((pol) => (
                                <button
                                  key={pol.id}
                                  type="button"
                                  onClick={() => handleInsertPolicyPdf(pol)}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition shadow-sm"
                                >
                                  <FileCheck2 className="h-3.5 w-3.5" />
                                  <span>
                                    Insertar PDF Póliza #{pol.policyNumber} (
                                    {cleanPersonName(pol.insuranceCompany) || "Seguro"})
                                  </span>
                                </button>
                              ))}
                          </div>
                        </div>
                      )}

                    {/* Semáforo del Candado Anti-Equivocación en Vivo */}
                    {policySecurityCheck && (
                      <div
                        className={`flex items-start gap-2 px-3 py-2 rounded-lg text-xs font-semibold border ${
                          policySecurityCheck.status === "VERIFIED"
                            ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                            : policySecurityCheck.status === "DANGER"
                            ? "bg-rose-50 text-rose-900 border-rose-300 animate-pulse"
                            : "bg-amber-50 text-amber-900 border-amber-200"
                        }`}
                      >
                        {policySecurityCheck.status === "VERIFIED" ? (
                          <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <ShieldAlert
                            className={`h-4 w-4 shrink-0 mt-0.5 ${
                              policySecurityCheck.status === "DANGER"
                                ? "text-rose-600"
                                : "text-amber-600"
                            }`}
                          />
                        )}
                        <span>{policySecurityCheck.message}</span>
                      </div>
                    )}
                  </div>

                  {/* Campo PARA con Autocompletado Flotante Instantáneo */}
                  <div className="relative flex items-center gap-2 border-b border-slate-200 pb-1.5">
                    <span className="text-xs font-bold text-slate-500 w-14 shrink-0">
                      Para:
                    </span>
                    <input
                      type="text"
                      value={composeTo}
                      onFocus={() => setShowToSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowToSuggestions(false), 180)}
                      onChange={(e) => {
                        setComposeTo(e.target.value);
                        setShowToSuggestions(true);
                      }}
                      placeholder="Escribe nombre del cliente o correo (ej. cliente@correo.com)..."
                      className="flex-1 text-sm text-slate-900 focus:outline-none bg-transparent"
                    />
                    {!showCcBcc && (
                      <button
                        type="button"
                        onClick={() => setShowCcBcc(true)}
                        className="text-xs font-semibold text-slate-500 hover:text-sky-600 px-2 py-0.5 rounded"
                      >
                        CC / CCO
                      </button>
                    )}

                    {showToSuggestions && matchingToContacts.length > 0 && (
                      <div className="absolute left-14 top-9 z-40 w-full max-w-md bg-white border border-slate-200 rounded-xl shadow-xl py-1 overflow-hidden">
                        {matchingToContacts.map((c, i) => (
                          <button
                            key={i}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              applyContactSuggestion("TO", c);
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-sky-50 flex items-center justify-between gap-2 text-xs transition"
                          >
                            <div className="truncate">
                              <span className="font-bold text-slate-900">{c.label}</span>{" "}
                              <span className="font-mono text-slate-500">&lt;{c.email}&gt;</span>
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 shrink-0">
                              {c.badge}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Campos CC y CCO */}
                  {showCcBcc && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-b border-slate-200 pb-1.5">
                      <div className="relative flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500 w-14 shrink-0">
                          CC:
                        </span>
                        <input
                          type="text"
                          value={composeCc}
                          onFocus={() => setShowCcSuggestions(true)}
                          onBlur={() => setTimeout(() => setShowCcSuggestions(false), 180)}
                          onChange={(e) => {
                            setComposeCc(e.target.value);
                            setShowCcSuggestions(true);
                          }}
                          placeholder="Copia a..."
                          className="flex-1 text-sm text-slate-900 focus:outline-none bg-transparent"
                        />
                        {showCcSuggestions && matchingCcContacts.length > 0 && (
                          <div className="absolute left-14 top-8 z-40 w-full bg-white border border-slate-200 rounded-xl shadow-xl py-1 overflow-hidden">
                            {matchingCcContacts.map((c, i) => (
                              <button
                                key={i}
                                type="button"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  applyContactSuggestion("CC", c);
                                }}
                                className="w-full px-3 py-1.5 text-left hover:bg-sky-50 flex items-center justify-between gap-2 text-xs"
                              >
                                <span className="truncate font-bold text-slate-900">
                                  {c.label} ({c.email})
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500 w-12 shrink-0">
                          CCO:
                        </span>
                        <input
                          type="text"
                          value={composeBcc}
                          onChange={(e) => setComposeBcc(e.target.value)}
                          placeholder="Copia oculta..."
                          className="flex-1 text-sm text-slate-900 focus:outline-none bg-transparent"
                        />
                      </div>
                    </div>
                  )}

                  {/* Campo ASUNTO */}
                  <div className="flex items-center gap-2 border-b border-slate-200 pb-1.5">
                    <span className="text-xs font-bold text-slate-500 w-14 shrink-0">
                      Asunto:
                    </span>
                    <input
                      type="text"
                      value={composeSubject}
                      onChange={(e) => setComposeSubject(e.target.value)}
                      placeholder="Asunto del correo..."
                      className="flex-1 text-sm font-semibold text-slate-900 focus:outline-none bg-transparent"
                    />
                  </div>

                  {/* Barra de Formato + Insertar Firma + Editar Firma */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-1.5 text-slate-600">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => insertTextFormat("BOLD")}
                        title="Negrita"
                        className="p-1.5 rounded hover:bg-slate-100 text-slate-700"
                      >
                        <Bold className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertTextFormat("ITALIC")}
                        title="Cursiva"
                        className="p-1.5 rounded hover:bg-slate-100 text-slate-700"
                      >
                        <Italic className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertTextFormat("LIST")}
                        title="Lista de viñetas"
                        className="p-1.5 rounded hover:bg-slate-100 text-slate-700"
                      >
                        <List className="h-3.5 w-3.5" />
                      </button>
                      <div className="h-4 w-px bg-slate-200 mx-1" />
                      <button
                        type="button"
                        onClick={() => insertTextFormat("SIGNATURE")}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-sky-50 text-xs font-semibold text-slate-700 hover:text-sky-700 transition"
                      >
                        <PenTool className="h-3 w-3 text-sky-600" />
                        Insertar Firma
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSigDraftDisplayName(activeMailbox.displayName || "");
                          setSigDraftText(customSignature);
                          setShowSignatureModal(true);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-slate-100 text-xs font-semibold text-sky-700 transition"
                      >
                        <Settings2 className="h-3 w-3" />
                        Editar mi Firma
                      </button>
                    </div>

                    <span className="text-[11px] text-slate-400">
                      Si cierras con ✕ se guarda automáticamente en Borradores
                    </span>
                  </div>

                  {/* Área de Texto Principal Amplia */}
                  <textarea
                    ref={bodyTextareaRef}
                    value={composeBody}
                    onChange={(e) => setComposeBody(e.target.value)}
                    placeholder="Escribe tu mensaje aquí... (Puedes arrastrar y soltar archivos, PDFs, imágenes o presentaciones en cualquier parte de esta ventana)"
                    className="flex-1 min-h-[220px] w-full resize-none text-sm text-slate-900 leading-relaxed focus:outline-none font-sans"
                  />

                  {/* Tarjetas de Archivos Adjuntos Cargados */}
                  {composeAttachments.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          Archivos Adjuntos ({composeAttachments.length})
                        </span>
                        <button
                          type="button"
                          onClick={() => setComposeAttachments([])}
                          className="text-[11px] text-rose-600 hover:underline font-semibold"
                        >
                          Quitar todos
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {composeAttachments.map((att, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 text-xs"
                          >
                            {getAttachmentIcon(att.mimeType, att.filename)}
                            <span className="font-semibold text-slate-800 max-w-[200px] truncate">
                              {att.filename}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              ({formatBytes(att.size)})
                            </span>
                            <button
                              type="button"
                              onClick={() => removeAttachment(idx)}
                              className="text-slate-400 hover:text-rose-600 ml-1"
                              title="Quitar adjunto"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Barra de Herramientas Inferior del Redactor */}
                <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSendEmail(false)}
                      disabled={isPending}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-sky-600 hover:bg-sky-500 text-white text-sm font-bold shadow-md shadow-sky-600/20 transition disabled:opacity-50"
                    >
                      <Send className="h-4 w-4" />
                      {isPending ? "Enviando..." : "Enviar"}
                    </button>

                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.key,.zip,.txt,image/*"
                      onChange={(e) => {
                        processUploadedFiles(e.target.files);
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
                        processUploadedFiles(e.target.files);
                        e.target.value = "";
                      }}
                      className="hidden"
                    />

                    {(selectedPolicyObj?.pdfUrl ||
                      availablePoliciesForCompose.some((p) => Boolean(p.pdfUrl))) && (
                      <button
                        type="button"
                        onClick={() => handleInsertPolicyPdf(selectedPolicyObj)}
                        title="Insertar el PDF de la póliza del cliente que ya está subida en el sistema"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold transition shadow-sm"
                      >
                        <FileCheck2 className="h-4 w-4 text-emerald-600" />
                        <span>
                          {selectedPolicyObj?.pdfUrl
                            ? `Insertar PDF Póliza #${selectedPolicyObj.policyNumber}`
                            : "Insertar PDF de Póliza"}
                        </span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      title="Adjuntar archivos, PDFs, presentaciones PowerPoint (.pptx), Excel (.xlsx) o documentos"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition shadow-sm"
                    >
                      <Paperclip className="h-4 w-4 text-sky-600" />
                      <span>Adjuntar archivo / presentación</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      title="Adjuntar imágenes o fotografías"
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition shadow-sm"
                    >
                      <ImageIcon className="h-4 w-4 text-emerald-600" />
                      <span className="hidden sm:inline">Imagen</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSendEmail(true)}
                      disabled={isPending}
                      className="px-3.5 py-2 rounded-full bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold transition"
                    >
                      Guardar borrador
                    </button>
                    <button
                      type="button"
                      onClick={handleDiscardDraftExplicitly}
                      title="Descartar y eliminar este borrador sin guardar"
                      className="p-2 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* MODAL: PERSONALIZAR / EDITAR MI FIRMA DE CORREO */}
      {showSignatureModal && (
        <div className="fixed inset-0 z-[70] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 text-sky-600 flex items-center justify-center">
                  <PenTool className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Personalizar mi Firma Oficial de Correo
                  </h3>
                  <p className="text-xs text-slate-500">
                    Se agregará automáticamente en los correos que envíes desde{" "}
                    <span className="font-mono font-semibold text-slate-700">
                      {activeMailbox.emailAddress}
                    </span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSignatureModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tu Nombre o Cargo Visible (Remitente)
                </label>
                <input
                  type="text"
                  value={sigDraftDisplayName}
                  onChange={(e) => setSigDraftDisplayName(e.target.value)}
                  placeholder="Ej. Enrique Ahumada | Asesor Patrimonial"
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Texto de tu Firma al Pie del Correo
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setSigDraftText(
                        `Atentamente,\n${
                          sigDraftDisplayName || activeMailbox.displayName
                        }\nAsesor de Seguros y Fianzas | ${data.agency.name}\n✉️ ${
                          activeMailbox.emailAddress
                        }\n📱 Tel / WhatsApp: 55 0000 0000`
                      )
                    }
                    className="text-[11px] font-semibold text-sky-600 hover:underline"
                  >
                    Usar plantilla ejecutiva
                  </button>
                </div>
                <textarea
                  rows={6}
                  value={sigDraftText}
                  onChange={(e) => setSigDraftText(e.target.value)}
                  placeholder="Escribe tu nombre, cargo, teléfono, cédula o aviso de privacidad..."
                  className="w-full border border-slate-300 rounded-xl p-3 text-sm text-slate-900 leading-relaxed focus:outline-none focus:ring-2 focus:ring-sky-500 font-sans"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowSignatureModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveCustomSignature}
                disabled={isPending}
                className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md transition disabled:opacity-50"
              >
                {isPending ? "Guardando..." : "Guardar mi Firma"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SINCRONIZAR EN IPHONE / ANDROID / OUTLOOK */}
      {showMobileSyncModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 text-sky-600 flex items-center justify-center">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Conectar en tu iPhone, Android o Outlook
                  </h3>
                  <p className="text-xs text-slate-500">
                    Usa tu correo dentro de aacomsoft o llévalo también en la app de tu celular
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMobileSyncModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Cuenta de Correo:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-slate-900">
                    {activeMailbox.emailAddress}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyText("email", activeMailbox.emailAddress)}
                    className="text-sky-600 hover:text-sky-800"
                  >
                    {copiedField === "email" ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/80">
                <div>
                  <span className="text-slate-400 block">Servidor Entrante (IMAP):</span>
                  <span className="font-mono font-bold text-slate-800">
                    imap.titan.email
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Puerto: 993 (SSL/TLS)
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Servidor Saliente (SMTP):</span>
                  <span className="font-mono font-bold text-slate-800">
                    smtp.titan.email
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Puerto: 465 (SSL/TLS)
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowMobileSyncModal(false)}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
