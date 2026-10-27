"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import * as XLSX from "xlsx";
import confetti from "canvas-confetti";
import {
  Phone,
  MessageCircle,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Upload,
  Download,
  Plus,
  Search,
  Filter,
  Sparkles,
  UserCheck,
  Users,
  UserX,
  TrendingUp,
  Clock,
  ShieldAlert,
  ArrowRight,
  ChevronRight,
  BarChart3,
  FileSpreadsheet,
  PhoneForwarded,
  PhoneOff,
  Award,
  Target,
  DollarSign,
  Briefcase,
  RefreshCw,
  Eye,
  EyeOff,
  SlidersHorizontal,
  Trash2,
  Edit3,
  History,
  Crown,
  Check,
  Info,
  HelpCircle,
  Lock,
  Flame,
  Zap,
  Bell,
  FileText,
} from "lucide-react";
import {
  getProject200DashboardData,
  bulkImportProject200Contacts,
  createProject200Contact,
  updateProject200Contact,
  recordGuidedProspectingAction,
  addProject200ContactLogAndSchedule,
  deleteProject200Contact,
  getAdminProject200Analytics,
  toggleProject200AgentTracking,
} from "./actions";

interface Proyecto200ClientProps {
  currentUser: {
    id: string;
    name: string;
    email: string;
    role: string;
    agencyId: string;
    agencyName: string;
  };
  initialData: any;
  initialAdminData: any;
  initialTab?: string;
}

const OBJECTION_GUIDES = [
  {
    id: "whatsapp",
    label: "📲 «Mándamelo por WhatsApp / Correo»",
    response:
      "«Te entiendo perfecto, justamente por respeto a tu tiempo no envío folletos genéricos porque las prioridades de una persona soltera no son iguales a las de alguien casado o con hijos. Mi trabajo es hacerte un diagnóstico financiero sin costo en 20 minutos para ver qué sí te funciona a ti. ¿Te queda mejor mañana martes a las 5:00 PM o el jueves a las 10:00 AM?»",
  },
  {
    id: "seguros",
    label: "🛡️ «¿Qué es? ¿Son seguros?»",
    response:
      "«Una parte de nuestro portafolio puede incluir blindaje patrimonial, pero no forzosamente. Manejamos una gama amplia de estrategias de optimización financiera, ahorro e inversión, y para saber si alguna te hace sentido primero hacemos una radiografía rápida de tus metas sin costo. ¿Prefieres que platiquemos el miércoles por la mañana o el jueves por la tarde?»",
  },
  {
    id: "tiempo",
    label: "⏳ «Ahorita no tengo tiempo / Estoy ocupado»",
    response:
      "«Precisamente porque sé que tienes la agenda a tope te llamo solo para agendar una sesión ejecutiva de 20 minutos por Zoom en un horario que no interfiera con tu trabajo. Somos como médicos de las finanzas: hacemos un chequeo rápido y tú decides. ¿Te acomoda más el martes a las 7:00 PM o el sábado a las 10:00 AM?»",
  },
  {
    id: "gastado",
    label: "💸 «Por el momento ando muy gastado»",
    response:
      "«Con mayor razón vale la pena que nos sentemos. La asesoría es 100% gratuita y sin ningún compromiso de contratar algo hoy; al contrario, te ayuda a poner orden en tu flujo financiero y detectar fugas de dinero para que tengas mayor liquidez. ¿Nos vemos este miércoles a las 6:00 PM o el viernes a las 11:00 AM?»",
  },
  {
    id: "diciembre",
    label: "🎄 «Ahorita no, búscame en Diciembre / Más adelante»",
    response:
      "«¡Excelente que ya tengas en mente revisar tus finanzas en esa fecha! Si quieres, podemos hacer hoy el diagnóstico gratuito de 15 minutos para que llegues a ese mes con el plan claro, o bien dime qué día exacto te marco para dejar agendado tu recordatorio prioritario desde ahorita.»",
  },
];

function computePresetDateString(
  preset: "1W" | "15D" | "NEXT_MONTH" | "DEC"
): string {
  const now = new Date();
  if (preset === "1W") {
    const d = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return d.toISOString().split("T")[0];
  }
  if (preset === "15D") {
    const d = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
    return d.toISOString().split("T")[0];
  }
  if (preset === "NEXT_MONTH") {
    const d = new Date(now.getFullYear(), now.getMonth() + 1, 2, 12, 0, 0);
    return d.toISOString().split("T")[0];
  }
  // DEC: 2 de diciembre del año en curso (o del siguiente si ya estamos en diciembre avanzado)
  const targetYear =
    now.getMonth() === 11 && now.getDate() >= 15
      ? now.getFullYear() + 1
      : now.getFullYear();
  const decDate = new Date(targetYear, 11, 2, 12, 0, 0);
  return decDate.toISOString().split("T")[0];
}

const COMMON_DISQUALIFICATION_REASONS = [
  "Número telefónico inexistente o fuera de servicio definitivemente",
  "Sin capacidad de ahorro ni ingresos comprobables actualmente",
  "Solicitó explícitamente no volver a ser contactado",
  "Ya cuenta con asesor patrimonial directo en la misma firma",
  "Fallecimiento o condición médica que impide contratación",
  "Reside permanentemente fuera del país sin vínculos fiscales en México",
];

function formatCurrencyMXN(value: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatDateTime(dateInput?: string | Date | null) {
  if (!dateInput) return "Sin registro";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "Sin registro";
  return d.toLocaleString("es-MX", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Proyecto200Client({
  currentUser,
  initialData,
  initialAdminData,
  initialTab,
}: Proyecto200ClientProps) {
  const isAdmin =
    currentUser.role === "ADMIN" || currentUser.role === "SUPER_ADMIN";

  const [activeTab, setActiveTab] = useState<
    "piloto" | "crm" | "importador" | "estadisticas" | "admin"
  >(() => {
    if (initialTab === "admin" && isAdmin) return "admin";
    if (
      initialTab === "crm" ||
      initialTab === "importador" ||
      initialTab === "estadisticas"
    ) {
      return initialTab;
    }
    const total = initialData?.stats?.totalContacts || 0;
    return total > 0 ? "piloto" : "importador";
  });

  const [contacts, setContacts] = useState<any[]>(
    initialData?.contacts || []
  );
  const [unimportedReferrals, setUnimportedReferrals] = useState<any[]>(
    initialData?.unimportedReferrals || []
  );
  const [recentLogs, setRecentLogs] = useState<any[]>(
    initialData?.recentLogs || []
  );
  const [stats, setStats] = useState<any>(
    initialData?.stats || {
      totalContacts: 0,
      goalThreshold: 200,
      missingFor200: 200,
      hasReached200: false,
      progressPercentage: 0,
      prospectosCount: 0,
      referidoresCount: 0,
      descalificadosCount: 0,
      porContactarCount: 0,
      enSeguimientoCount: 0,
      citasAgendadasCount: 0,
      totalAttempts: 0,
      estimatedMarketValue: 0,
      estimatedMonthlySavingsPotential: 0,
    }
  );

  const [adminData, setAdminData] = useState<any>(initialAdminData);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  // Estado Piloto Automático Secuencial
  const [selectedQueueContactId, setSelectedQueueContactId] = useState<
    string | null
  >(null);
  const [activeObjectionId, setActiveObjectionId] = useState<string>("whatsapp");
  const [callSeconds, setCallSeconds] = useState<number>(0);
  const [actionNotes, setActionNotes] = useState<string>("");
  const [pilotoActionModal, setPilotoActionModal] = useState<
    null | "CITA" | "RECORDATORIO" | "DESCALIFICAR"
  >(null);
  const [scheduledDate, setScheduledDate] = useState<string>(() => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    return tomorrow.toISOString().split("T")[0];
  });
  const [scheduledTime, setScheduledTime] = useState<string>("17:00");
  const [reminderDate, setReminderDate] = useState<string>(() =>
    computePresetDateString("15D")
  );
  const [reminderTime, setReminderTime] = useState<string>("10:00");
  const [reminderReasonInput, setReminderReasonInput] = useState<string>("");
  const [disqReasonInput, setDisqReasonInput] = useState<string>("");
  const [disqPreset, setDisqPreset] = useState<string>("");
  const [submittingAction, setSubmittingAction] = useState<boolean>(false);

  // Estado Filtros CRM
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterClassification, setFilterClassification] =
    useState<string>("ALL");
  const [filterProbability, setFilterProbability] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  // Modal Nuevo / Editar Contacto o Importar Referido de Encuesta
  const [contactModalOpen, setContactModalOpen] = useState<boolean>(false);
  const [editingContact, setEditingContact] = useState<any | null>(null);
  const [formFullName, setFormFullName] = useState<string>("");
  const [formPhone, setFormPhone] = useState<string>("");
  const [formRelationship, setFormRelationship] = useState<string>("");
  const [formSalary, setFormSalary] = useState<string>("");
  const [formProbability, setFormProbability] = useState<string>("ALTA");
  const [formClassification, setFormClassification] =
    useState<string>("PROSPECTO");
  const [formDisqReason, setFormDisqReason] = useState<string>("");
  const [formNotes, setFormNotes] = useState<string>("");
  const [formSource, setFormSource] = useState<string>("MANUAL");
  const [formSurveyReferralId, setFormSurveyReferralId] = useState<
    string | undefined
  >(undefined);
  const [savingContact, setSavingContact] = useState<boolean>(false);

  // Modal de Descalificación Obligatoria desde la tabla CRM
  const [crmDisqualifyContact, setCrmDisqualifyContact] = useState<any | null>(
    null
  );
  const [crmDisqReason, setCrmDisqReason] = useState<string>("");
  const [crmDisqPreset, setCrmDisqPreset] = useState<string>("");

  // Modal Expediente 360° y Bitácora Interactiva de Contacto
  const [historyContact, setHistoryContact] = useState<any | null>(null);
  const [drawerMode, setDrawerMode] = useState<
    "NOTA" | "RECORDATORIO" | "CITA"
  >("NOTA");
  const [drawerNoteInput, setDrawerNoteInput] = useState<string>("");
  const [drawerScheduledDate, setDrawerScheduledDate] = useState<string>(() =>
    computePresetDateString("15D")
  );
  const [drawerScheduledTime, setDrawerScheduledTime] =
    useState<string>("10:00");
  const [savingDrawerAction, setSavingDrawerAction] = useState<boolean>(false);

  // Estado Importador Excel / CSV
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState<boolean>(false);
  const [importReport, setImportReport] = useState<any | null>(null);

  // Estado Admin Drill-Down
  const [adminSelectedAgentId, setAdminSelectedAgentId] =
    useState<string>("ALL");
  const [adminSearch, setAdminSearch] = useState<string>("");
  const [adminFilterClass, setAdminFilterClass] = useState<string>("ALL");
  const [adminFilterStatus, setAdminFilterStatus] = useState<string>("ALL");
  const [adminSubView, setAdminSubView] = useState<
    "agentes" | "contactos" | "bitacora"
  >("agentes");
  const [hiddenAgentIds, setHiddenAgentIds] = useState<string[]>(
    initialAdminData?.hiddenAgentIds || []
  );
  const [showAgentVisibilityDrawer, setShowAgentVisibilityDrawer] =
    useState<boolean>(false);
  const [togglingAgentId, setTogglingAgentId] = useState<string | null>(null);

  // Estado Anti-WhatsApp en Piloto Automático: rastrea si el agente ya intentó llamar por teléfono al contacto actual
  const [dialedContactIds, setDialedContactIds] = useState<
    Record<string, boolean>
  >({});

  const showToast = (
    type: "success" | "error" | "info",
    message: string
  ) => {
    setFeedbackToast({ type, message });
    setTimeout(() => {
      setFeedbackToast((prev) => (prev?.message === message ? null : prev));
    }, 5500);
  };

  const refreshAllData = async () => {
    setIsRefreshing(true);
    try {
      const [dash, adm] = await Promise.all([
        getProject200DashboardData(),
        isAdmin ? getAdminProject200Analytics() : Promise.resolve(null),
      ]);
      if (dash?.success) {
        setContacts(dash.contacts || []);
        setUnimportedReferrals(dash.unimportedReferrals || []);
        setRecentLogs(dash.recentLogs || []);
        setStats(dash.stats);
      }
      if (adm?.success) {
        setAdminData(adm);
        if (Array.isArray(adm.hiddenAgentIds)) {
          setHiddenAgentIds(adm.hiddenAgentIds);
        }
      }
    } catch (err) {
      console.error("Error refreshing Proyecto 200:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Recordatorios programados cuya fecha ya llegó (hoy o vencidos)
  const remindersDueToday = useMemo(() => {
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    return contacts.filter(
      (c) =>
        c.classification !== "DESCALIFICADO" &&
        c.status === "RECORDATORIO_PROGRAMADO" &&
        c.nextActionAt &&
        new Date(c.nextActionAt) <= endOfToday
    );
  }, [contacts]);

  // Cola priorizada para el Piloto Automático de Prospección
  const activeQueue = useMemo(() => {
    const now = new Date();
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // Contactos elegibles hoy: excluye descalificados, citas agendadas y recordatorios futuros que aún no vencen
    const eligible = contacts.filter((c) => {
      if (
        c.classification === "DESCALIFICADO" ||
        c.status === "DESCARTADO" ||
        c.status === "CITA_AGENDADA"
      ) {
        return false;
      }
      if (c.status === "RECORDATORIO_PROGRAMADO") {
        // Solo entran a la cola hoy si su fecha de recordatorio ya llegó
        return Boolean(c.nextActionAt && new Date(c.nextActionAt) <= endOfToday);
      }
      return true;
    });

    const readyNow = eligible.filter(
      (c) =>
        c.status === "RECORDATORIO_PROGRAMADO" ||
        !c.nextActionAt ||
        new Date(c.nextActionAt) <= now
    );

    const listToSort = readyNow.length > 0 ? readyNow : eligible;

    return [...listToSort].sort((a, b) => {
      const aIsDueReminder = a.status === "RECORDATORIO_PROGRAMADO" ? 1 : 0;
      const bIsDueReminder = b.status === "RECORDATORIO_PROGRAMADO" ? 1 : 0;
      if (bIsDueReminder !== aIsDueReminder) {
        return bIsDueReminder - aIsDueReminder;
      }
      if (b.priorityScore !== a.priorityScore) {
        return b.priorityScore - a.priorityScore;
      }
      return (a.attemptsCount || 0) - (b.attemptsCount || 0);
    });
  }, [contacts]);

  const currentPilotoContact = useMemo(() => {
    if (selectedQueueContactId) {
      const found =
        activeQueue.find((c) => c.id === selectedQueueContactId) ||
        contacts.find((c) => c.id === selectedQueueContactId);
      if (found) return found;
    }
    return activeQueue[0] || null;
  }, [activeQueue, contacts, selectedQueueContactId]);

  // Cronómetro en vivo por tarjeta en Piloto Automático
  useEffect(() => {
    setCallSeconds(0);
    setActionNotes("");
    setPilotoActionModal(null);
    setReminderReasonInput("");
    setDisqReasonInput("");
    setDisqPreset("");
  }, [currentPilotoContact?.id]);

  useEffect(() => {
    if (activeTab !== "piloto" || !currentPilotoContact) return;
    const interval = setInterval(() => {
      setCallSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [activeTab, currentPilotoContact?.id]);

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60)
      .toString()
      .padStart(2, "0");
    const rem = (secs % 60).toString().padStart(2, "0");
    return `${mins}:${rem}`;
  };

  // Filtrado de contactos en el CRM
  const filteredCrmContacts = useMemo(() => {
    return contacts.filter((c) => {
      if (
        filterClassification !== "ALL" &&
        c.classification !== filterClassification
      ) {
        return false;
      }
      if (
        filterProbability !== "ALL" &&
        c.closingProbability !== filterProbability
      ) {
        return false;
      }
      if (filterStatus !== "ALL" && c.status !== filterStatus) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = (c.fullName || "").toLowerCase().includes(q);
        const matchPhone = (c.phone || "").includes(q);
        const matchRel = (c.relationship || "").toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchRel) return false;
      }
      return true;
    });
  }, [
    contacts,
    filterClassification,
    filterProbability,
    filterStatus,
    searchQuery,
  ]);

  // Descargar Plantilla Oficial Excel (.xlsx)
  const handleDownloadTemplate = () => {
    const sampleRows = [
      {
        "Nombre Completo": "Alejandro Morales Méndez",
        Telefono: "5512345678",
        Relacion: "Amigo de la Universidad",
        "Sueldo Estimado": 65000,
        "Probabilidad Cierre": "Alta",
        Clasificacion: "Prospecto",
        Notas: "Casado, 1 hijo recién nacido, trabaja en corporativo",
      },
      {
        "Nombre Completo": "Dra. Mariana Gómez Torres",
        Telefono: "5587654321",
        Relacion: "Familiar / Prima",
        "Sueldo Estimado": 90000,
        "Probabilidad Cierre": "Alta",
        Clasificacion: "Prospecto",
        Notas: "Médico especialista con consultorio privado",
      },
      {
        "Nombre Completo": "Lic. Roberto Villarreal Soto",
        Telefono: "8112349876",
        Relacion: "Ex jefe / Mentor",
        "Sueldo Estimado": 110000,
        "Probabilidad Cierre": "Media",
        Clasificacion: "Referidor",
        Notas: "Excelente centro de influencia empresarial",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleRows);
    worksheet["!cols"] = [
      { wch: 30 },
      { wch: 16 },
      { wch: 26 },
      { wch: 18 },
      { wch: 20 },
      { wch: 16 },
      { wch: 42 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Proyecto_200");
    XLSX.writeFile(workbook, "Plantilla_Oficial_Proyecto_200.xlsx");
    showToast(
      "info",
      "Plantilla oficial descargada. Recuerda llenar todos los campos obligatorios."
    );
  };

  // Procesar archivo Excel / CSV con el Validador Inteligente
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingFile(true);
    setImportReport(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rawJson: Record<string, any>[] = XLSX.utils.sheet_to_json(
        worksheet,
        { defval: "" }
      );

      if (!rawJson || rawJson.length === 0) {
        showToast(
          "error",
          "El archivo seleccionado está vacío o no tiene filas legibles."
        );
        setIsUploadingFile(false);
        return;
      }

      const mappedRows = rawJson.map((row) => {
        const normalizedKeys: Record<string, any> = {};
        for (const key of Object.keys(row)) {
          const cleanKey = key
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim();
          normalizedKeys[cleanKey] = row[key];
        }

        const fullName =
          normalizedKeys["nombre completo"] ??
          normalizedKeys["nombre"] ??
          normalizedKeys["prospecto"] ??
          normalizedKeys["contacto"] ??
          "";

        const phone =
          normalizedKeys["telefono"] ??
          normalizedKeys["celular"] ??
          normalizedKeys["whatsapp"] ??
          normalizedKeys["numero"] ??
          normalizedKeys["tel"] ??
          "";

        const relationship =
          normalizedKeys["relacion"] ??
          normalizedKeys["parentesco"] ??
          normalizedKeys["vinculo"] ??
          normalizedKeys["origen"] ??
          "";

        const estimatedSalary =
          normalizedKeys["sueldo estimado"] ??
          normalizedKeys["sueldo"] ??
          normalizedKeys["ingreso"] ??
          normalizedKeys["ingreso mensual"] ??
          normalizedKeys["ingresos"] ??
          "";

        const closingProbability =
          normalizedKeys["probabilidad cierre"] ??
          normalizedKeys["probabilidad de cierre"] ??
          normalizedKeys["probabilidad"] ??
          "";

        const classification =
          normalizedKeys["clasificacion"] ??
          normalizedKeys["tipo"] ??
          normalizedKeys["categoria"] ??
          "PROSPECTO";

        const disqualificationReason =
          normalizedKeys["motivo descalificacion"] ??
          normalizedKeys["razon descalificacion"] ??
          normalizedKeys["motivo"] ??
          "";

        const notes =
          normalizedKeys["notas"] ??
          normalizedKeys["observaciones"] ??
          normalizedKeys["comentarios"] ??
          "";

        return {
          fullName: String(fullName),
          phone: String(phone),
          relationship: String(relationship),
          estimatedSalary,
          closingProbability: String(closingProbability),
          classification: String(classification),
          disqualificationReason: String(disqualificationReason),
          notes: String(notes),
        };
      });

      const response = await bulkImportProject200Contacts(mappedRows);

      if (!response.success) {
        showToast(
          "error",
          response.error || "Error al validar el archivo Excel/CSV."
        );
      } else {
        setImportReport(response);
        await refreshAllData();
        if (response.hasReached200) {
          confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
        }
        showToast("success", response.message || "Archivo procesado.");
      }
    } catch (error: any) {
      console.error("Error parsing file:", error);
      showToast(
        "error",
        "No se pudo leer el archivo. Asegúrate de subir un archivo .xlsx o .csv válido."
      );
    } finally {
      setIsUploadingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Abrir modal para crear contacto nuevo o importar referido de encuesta
  const openNewContactModal = (prefill?: {
    fullName?: string;
    phone?: string;
    relationship?: string;
    notes?: string;
    source?: string;
    surveyReferralId?: string;
    referredByContactId?: string;
  }) => {
    setEditingContact(null);
    setFormFullName(prefill?.fullName || "");
    setFormPhone(prefill?.phone || "");
    setFormRelationship(prefill?.relationship || "");
    setFormSalary("");
    setFormProbability("ALTA");
    setFormClassification("PROSPECTO");
    setFormDisqReason("");
    setFormNotes(prefill?.notes || "");
    setFormSource(prefill?.source || "MANUAL");
    setFormSurveyReferralId(prefill?.surveyReferralId);
    setContactModalOpen(true);
  };

  const openEditContactModal = (contact: any) => {
    setEditingContact(contact);
    setFormFullName(contact.fullName || "");
    setFormPhone(contact.phone || "");
    setFormRelationship(contact.relationship || "");
    setFormSalary(String(contact.estimatedSalary || ""));
    setFormProbability(contact.closingProbability || "ALTA");
    setFormClassification(contact.classification || "PROSPECTO");
    setFormDisqReason(contact.disqualificationReason || "");
    setFormNotes(contact.notes || "");
    setFormSource(contact.source || "MANUAL");
    setFormSurveyReferralId(undefined);
    setContactModalOpen(true);
  };

  const handleSaveContactModal = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      formClassification === "DESCALIFICADO" &&
      formDisqReason.trim().length < 3
    ) {
      showToast(
        "error",
        "Es obligatorio indicar por qué se descalifica al candidato."
      );
      return;
    }

    setSavingContact(true);
    try {
      if (editingContact) {
        const res = await updateProject200Contact(editingContact.id, {
          fullName: formFullName,
          phone: formPhone,
          relationship: formRelationship,
          estimatedSalary: Number(formSalary),
          closingProbability: formProbability,
          classification: formClassification,
          disqualificationReason:
            formClassification === "DESCALIFICADO" ? formDisqReason : "",
          notes: formNotes,
        });
        if (!res.success) {
          showToast("error", res.error || "No se pudo actualizar.");
          return;
        }
        showToast("success", "Contacto actualizado correctamente.");
      } else {
        const res = await createProject200Contact({
          fullName: formFullName,
          phone: formPhone,
          relationship: formRelationship,
          estimatedSalary: Number(formSalary),
          closingProbability: formProbability,
          classification: formClassification,
          disqualificationReason:
            formClassification === "DESCALIFICADO" ? formDisqReason : "",
          notes: formNotes,
          source: formSource,
          surveyReferralId: formSurveyReferralId,
        });
        if (!res.success) {
          showToast("error", res.error || "No se pudo registrar el contacto.");
          return;
        }
        showToast(
          "success",
          "Contacto agregado e integrado a tu cola de prioridad."
        );
      }

      setContactModalOpen(false);
      await refreshAllData();
    } finally {
      setSavingContact(false);
    }
  };

  // Ejecutar acción en el Piloto Automático de Prospección
  const handlePilotoOutcome = async (
    actionType:
      | "CITA_AGENDADA"
      | "RECORDATORIO_PROGRAMADO"
      | "NO_CONTESTO"
      | "SEGUIMIENTO_WHATSAPP"
      | "CONVERTIR_REFERIDOR"
      | "DESCALIFICAR"
  ) => {
    if (!currentPilotoContact) return;

    const hasAttemptedCall =
      (currentPilotoContact.attemptsCount || 0) >= 1 ||
      Boolean(dialedContactIds[currentPilotoContact.id]);

    if (actionType === "SEGUIMIENTO_WHATSAPP" && !hasAttemptedCall) {
      showToast(
        "error",
        "Regla Teléfono Primero: En el 1er contacto debes marcar por teléfono antes de enviarlo a seguimiento por WhatsApp."
      );
      return;
    }

    const finalDisqReason =
      disqPreset === "OTRO"
        ? disqReasonInput.trim()
        : disqPreset || disqReasonInput.trim();

    if (actionType === "DESCALIFICAR" && finalDisqReason.length < 3) {
      showToast(
        "error",
        "Es obligatorio escribir o seleccionar el motivo por el cual descalificas al candidato."
      );
      return;
    }

    const combinedNotesForReminder =
      reminderReasonInput.trim() || actionNotes.trim();

    if (
      actionType === "RECORDATORIO_PROGRAMADO" &&
      combinedNotesForReminder.length < 3
    ) {
      showToast(
        "error",
        "Es obligatorio escribir qué te comentó el prospecto y por qué pidió que le llames en esa fecha (ej. 'Búscame en diciembre con el aguinaldo')."
      );
      return;
    }

    setSubmittingAction(true);
    try {
      const res = await recordGuidedProspectingAction({
        contactId: currentPilotoContact.id,
        actionType,
        scheduledDate:
          actionType === "CITA_AGENDADA"
            ? scheduledDate
            : actionType === "RECORDATORIO_PROGRAMADO"
            ? reminderDate
            : undefined,
        scheduledTime:
          actionType === "CITA_AGENDADA"
            ? scheduledTime
            : actionType === "RECORDATORIO_PROGRAMADO"
            ? reminderTime
            : undefined,
        disqualificationReason:
          actionType === "DESCALIFICAR" ? finalDisqReason : undefined,
        notes:
          actionType === "RECORDATORIO_PROGRAMADO"
            ? combinedNotesForReminder
            : actionNotes.trim() || undefined,
      });

      if (!res.success) {
        showToast("error", res.error || "No se pudo registrar la actividad.");
        return;
      }

      if (actionType === "CITA_AGENDADA") {
        confetti({ particleCount: 80, spread: 65, origin: { y: 0.65 } });
        showToast(
          "success",
          `¡Excelente! Cita agendada con ${currentPilotoContact.fullName}. Cargando siguiente contacto prioritario...`
        );
      } else if (actionType === "RECORDATORIO_PROGRAMADO") {
        showToast(
          "success",
          `⏰ Recordatorio programado para ${currentPilotoContact.fullName} el ${reminderDate}. El sistema te avisará puntualmente ese día.`
        );
      } else if (actionType === "NO_CONTESTO") {
        showToast(
          "info",
          `Intento registrado para ${currentPilotoContact.fullName}. Se reprogramó automáticamente y avanzamos al siguiente contacto.`
        );
      } else if (actionType === "SEGUIMIENTO_WHATSAPP") {
        showToast(
          "info",
          `Seguimiento registrado con ${currentPilotoContact.fullName}. Avanzando al siguiente contacto prioritario.`
        );
      } else if (actionType === "CONVERTIR_REFERIDOR") {
        showToast(
          "success",
          `${currentPilotoContact.fullName} ahora está clasificado como Referidor.`
        );
      } else if (actionType === "DESCALIFICAR") {
        showToast(
          "info",
          `Candidato descalificado con motivo registrado. Avanzando al siguiente contacto.`
        );
      }

      setSelectedQueueContactId(null);
      setPilotoActionModal(null);
      setReminderReasonInput("");
      await refreshAllData();
    } finally {
      setSubmittingAction(false);
    }
  };

  // Abrir Expediente 360° y Bitácora Interactiva de cualquier prospecto
  const openContactHistoryModal = (
    contact: any,
    initialMode: "NOTA" | "RECORDATORIO" | "CITA" = "NOTA"
  ) => {
    setHistoryContact(contact);
    setDrawerMode(initialMode);
    setDrawerNoteInput("");
    if (contact.nextActionAt) {
      const d = new Date(contact.nextActionAt);
      if (!isNaN(d.getTime()) && d > new Date()) {
        setDrawerScheduledDate(d.toISOString().split("T")[0]);
      } else {
        setDrawerScheduledDate(computePresetDateString("15D"));
      }
    } else {
      setDrawerScheduledDate(computePresetDateString("15D"));
    }
    setDrawerScheduledTime("10:00");
  };

  // Guardar nota, recordatorio o cita directamente desde el Expediente 360° en el CRM
  const handleSaveDrawerAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!historyContact) return;

    setSavingDrawerAction(true);
    try {
      const res = await addProject200ContactLogAndSchedule({
        contactId: historyContact.id,
        mode: drawerMode,
        notes: drawerNoteInput,
        scheduledDate:
          drawerMode === "RECORDATORIO" || drawerMode === "CITA"
            ? drawerScheduledDate
            : undefined,
        scheduledTime:
          drawerMode === "RECORDATORIO" || drawerMode === "CITA"
            ? drawerScheduledTime
            : undefined,
      });

      if (!res.success) {
        showToast(
          "error",
          res.error || "No se pudo guardar en la bitácora del prospecto."
        );
        return;
      }

      if (res.contact) {
        setHistoryContact(res.contact);
      }
      setDrawerNoteInput("");

      if (drawerMode === "RECORDATORIO") {
        showToast(
          "success",
          `⏰ Recordatorio agendado para ${historyContact.fullName} el ${drawerScheduledDate} (${drawerScheduledTime} hrs).`
        );
      } else if (drawerMode === "CITA") {
        confetti({ particleCount: 65, spread: 60, origin: { y: 0.65 } });
        showToast(
          "success",
          `📅 Cita agendada con ${historyContact.fullName} el ${drawerScheduledDate} a las ${drawerScheduledTime}.`
        );
      } else {
        showToast(
          "success",
          `📝 Comentario guardado en la bitácora de ${historyContact.fullName}.`
        );
      }

      await refreshAllData();
    } finally {
      setSavingDrawerAction(false);
    }
  };

  // Reclasificación rápida en el CRM
  const handleQuickClassificationChange = async (
    contact: any,
    targetClassification: "PROSPECTO" | "REFERIDOR" | "DESCALIFICADO"
  ) => {
    if (targetClassification === "DESCALIFICADO") {
      setCrmDisqualifyContact(contact);
      setCrmDisqReason(contact.disqualificationReason || "");
      setCrmDisqPreset("");
      return;
    }

    const res = await updateProject200Contact(contact.id, {
      classification: targetClassification,
    });
    if (!res.success) {
      showToast("error", res.error || "Error al reclasificar.");
      return;
    }
    showToast(
      "success",
      `${contact.fullName} clasificado como ${targetClassification}.`
    );
    await refreshAllData();
  };

  const handleConfirmCrmDisqualify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!crmDisqualifyContact) return;

    const finalReason =
      crmDisqPreset === "OTRO"
        ? crmDisqReason.trim()
        : crmDisqPreset || crmDisqReason.trim();

    if (finalReason.length < 3) {
      showToast(
        "error",
        "Debes especificar obligatoriamente el motivo de descalificación."
      );
      return;
    }

    setSavingContact(true);
    try {
      const res = await updateProject200Contact(crmDisqualifyContact.id, {
        classification: "DESCALIFICADO",
        disqualificationReason: finalReason,
      });
      if (!res.success) {
        showToast("error", res.error || "No se pudo descalificar.");
        return;
      }
      showToast(
        "info",
        `${crmDisqualifyContact.fullName} fue marcado como Descalificado.`
      );
      setCrmDisqualifyContact(null);
      await refreshAllData();
    } finally {
      setSavingContact(false);
    }
  };

  const handleDeleteContact = async (contact: any) => {
    if (
      !window.confirm(
        `¿Estás seguro de eliminar a ${contact.fullName} de tu Proyecto 200?`
      )
    ) {
      return;
    }
    const res = await deleteProject200Contact(contact.id);
    if (res.success) {
      showToast("info", "Contacto eliminado.");
      await refreshAllData();
    } else {
      showToast("error", res.error || "No se pudo eliminar.");
    }
  };

  // Filtrado de contactos en el Panel Ejecutivo de Admin
  const filteredAdminContacts = useMemo(() => {
    const all = adminData?.allContacts || [];
    return all.filter((c: any) => {
      if (
        adminSelectedAgentId !== "ALL" &&
        c.userId !== adminSelectedAgentId
      ) {
        return false;
      }
      if (
        adminFilterClass !== "ALL" &&
        c.classification !== adminFilterClass
      ) {
        return false;
      }
      if (adminFilterStatus !== "ALL" && c.status !== adminFilterStatus) {
        return false;
      }
      if (adminSearch.trim()) {
        const q = adminSearch.toLowerCase();
        const matchName = (c.fullName || "").toLowerCase().includes(q);
        const matchPhone = (c.phone || "").includes(q);
        const matchAgent = (c.user?.name || c.user?.email || "")
          .toLowerCase()
          .includes(q);
        const matchRel = (c.relationship || "").toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchAgent && !matchRel) return false;
      }
      return true;
    });
  }, [
    adminData,
    adminSelectedAgentId,
    adminFilterClass,
    adminFilterStatus,
    adminSearch,
  ]);

  const filteredAdminLogs = useMemo(() => {
    const logs = adminData?.recentLogs || [];
    if (adminSelectedAgentId === "ALL") return logs;
    return logs.filter((l: any) => l.userId === adminSelectedAgentId);
  }, [adminData, adminSelectedAgentId]);

  const handleToggleAgentTracking = async (
    targetAgentId: string,
    hideFromDashboard: boolean
  ) => {
    setTogglingAgentId(targetAgentId);
    // Actualización optimista inmediata
    setHiddenAgentIds((prev) =>
      hideFromDashboard
        ? Array.from(new Set([...prev, targetAgentId]))
        : prev.filter((id) => id !== targetAgentId)
    );
    try {
      const res = await toggleProject200AgentTracking(
        targetAgentId,
        hideFromDashboard
      );
      if (res.success && Array.isArray(res.hiddenAgentIds)) {
        setHiddenAgentIds(res.hiddenAgentIds);
        showToast(
          "info",
          hideFromDashboard
            ? `${res.agentName || "Agente"} fue ocultado del tablero de seguimiento (su cuenta sigue activa).`
            : `${res.agentName || "Agente"} fue activado nuevamente en el tablero de Tanques de Gasolina.`
        );
      } else if (!res.success) {
        showToast("error", res.error || "No se pudo actualizar visibilidad.");
      }
    } finally {
      setTogglingAgentId(null);
    }
  };

  const visibleAgentSummaries = useMemo(() => {
    const all = adminData?.agentSummaries || [];
    return all.filter((ag: any) => !hiddenAgentIds.includes(ag.agentId));
  }, [adminData, hiddenAgentIds]);

  const adminExecutiveKpis = useMemo(() => {
    const summaries = visibleAgentSummaries;
    const totalAgents = summaries.length;
    const agentsAt200 = summaries.filter((a: any) => a.hasReached200).length;
    const agentsOptimalFuel = summaries.filter(
      (a: any) =>
        (a.qualifiedCount ?? a.prospectosCount + a.referidoresCount) >= 100
    ).length;
    const agentsLowFuel = summaries.filter(
      (a: any) =>
        (a.qualifiedCount ?? a.prospectosCount + a.referidoresCount) < 65
    ).length;
    const totalContacts = summaries.reduce(
      (acc: number, a: any) => acc + a.totalContacts,
      0
    );
    const totalQualified = summaries.reduce(
      (acc: number, a: any) =>
        acc + (a.qualifiedCount ?? a.prospectosCount + a.referidoresCount),
      0
    );
    const totalReferralsOrigin = summaries.reduce(
      (acc: number, a: any) => acc + (a.referralsOriginCount ?? a.referidoresCount),
      0
    );
    const totalCitas = summaries.reduce(
      (acc: number, a: any) => acc + a.citasAgendadasCount,
      0
    );
    const totalTouches = summaries.reduce(
      (acc: number, a: any) => acc + a.totalAttempts,
      0
    );
    const totalDescalificados = summaries.reduce(
      (acc: number, a: any) => acc + a.descalificadosCount,
      0
    );
    const totalMarketSalary = summaries.reduce(
      (acc: number, a: any) => acc + a.estimatedMarketSalarySum,
      0
    );

    return {
      totalAgents,
      agentsAt200,
      agentsOptimalFuel,
      agentsLowFuel,
      totalContacts,
      totalQualified,
      totalReferralsOrigin,
      totalCitas,
      totalTouches,
      totalDescalificados,
      totalMarketSalary,
    };
  }, [adminData]);

  return (
    <div className="space-y-6 pb-16">
      {/* Toast flotante de retroalimentación */}
      {feedbackToast && (
        <div
          className={`fixed bottom-6 right-6 z-50 max-w-md rounded-2xl border p-4 shadow-2xl transition-all duration-300 flex items-start gap-3 ${
            feedbackToast.type === "success"
              ? "bg-emerald-950/95 border-emerald-500 text-emerald-100"
              : feedbackToast.type === "error"
              ? "bg-rose-950/95 border-rose-500 text-rose-100"
              : "bg-slate-900/95 border-indigo-500 text-indigo-100"
          }`}
        >
          {feedbackToast.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : feedbackToast.type === "error" ? (
            <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
          ) : (
            <Sparkles className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
          )}
          <div className="text-sm font-medium leading-relaxed">
            {feedbackToast.message}
          </div>
        </div>
      )}

      {/* Encabezado Principal + Termómetro Meta 200 Contactos */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 md:p-8 shadow-xl border border-indigo-500/20">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              Sistema Vivo de Prospección y Ejecución Secuencial
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">
              Proyecto 200 — CRM & Piloto Automático de Prospección
            </h1>
            <p className="text-slate-300 text-sm md:text-base leading-relaxed">
              Construye tu inventario inicial de 200 contactos calificados,
              prioriza por capacidad económica y probabilidad de cierre, y deja
              que el sistema te indique exactamente tu siguiente llamada.
            </p>
          </div>

          {/* Tarjetas Duales: Inventario 200 + Tanque de Gasolina (100 Calificados Activos) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full lg:w-auto lg:min-w-[620px]">
            {/* Tarjeta 1: Meta 200 Contactos */}
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-200">
                  1. Inventario Total (Meta 200)
                </span>
                {stats.hasReached200 ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    <CheckCircle2 className="h-3 w-3" /> ¡Meta 200!
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                    <AlertTriangle className="h-3 w-3" /> Faltan{" "}
                    {stats.missingFor200}
                  </span>
                )}
              </div>

              <div className="flex items-baseline justify-between mb-2">
                <div className="text-2xl font-black text-white">
                  {stats.totalContacts}{" "}
                  <span className="text-xs font-semibold text-slate-300">
                    / 200 registrados
                  </span>
                </div>
                <span className="text-xs font-bold text-indigo-300">
                  {stats.progressPercentage}%
                </span>
              </div>

              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    stats.hasReached200
                      ? "bg-gradient-to-r from-emerald-400 to-teal-500"
                      : "bg-gradient-to-r from-amber-400 via-orange-500 to-indigo-500"
                  }`}
                  style={{ width: `${stats.progressPercentage}%` }}
                />
              </div>

              <p className="text-[11px] text-slate-300 leading-snug">
                Descalificados:{" "}
                <strong className="text-rose-300">
                  {stats.descalificadosCount}
                </strong>{" "}
                · Citas:{" "}
                <strong className="text-emerald-300">
                  {stats.citasAgendadasCount}
                </strong>{" "}
                · Posicionados a futuro:{" "}
                <strong className="text-amber-300">
                  {stats.recordatoriosProgramadosCount || 0}
                </strong>
              </p>
            </div>

            {/* Tarjeta 2: Mi Tanque de Gasolina Comercial (Mínimo 100 Calificados No Descalificados) */}
            {(() => {
              const qualifiedCount =
                stats.qualifiedCount ??
                stats.prospectosCount + stats.referidoresCount;
              const fuelPct = Math.min(100, Math.round((qualifiedCount / 100) * 100));
              const referralsCount =
                stats.referralsOriginCount ?? stats.referidoresCount;
              const baseCount = Math.max(0, qualifiedCount - referralsCount);
              const isOptimal = qualifiedCount >= 100;
              const isMedium = qualifiedCount >= 65 && qualifiedCount < 100;
              const isReserve = qualifiedCount >= 35 && qualifiedCount < 65;

              const badgeStyle = isOptimal
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/40"
                : isMedium
                ? "bg-amber-500/20 text-amber-300 border-amber-400/40"
                : isReserve
                ? "bg-orange-500/25 text-orange-300 border-orange-400/40"
                : "bg-rose-500/30 text-rose-200 border-rose-400/50 animate-pulse";

              const barStyle = isOptimal
                ? "bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500"
                : isMedium
                ? "bg-gradient-to-r from-amber-400 to-yellow-500"
                : isReserve
                ? "bg-gradient-to-r from-orange-500 to-amber-500"
                : "bg-gradient-to-r from-rose-600 to-orange-500";

              const statusLabel = isOptimal
                ? "🟢 Tanque Lleno · Ritmo Óptimo"
                : isMedium
                ? "🟡 Medio Tanque · Recargar"
                : isReserve
                ? "🟠 En Reserva (< 10 días)"
                : "🔴 ¡Peligro de Paro!";

              return (
                <div className="bg-slate-950/55 backdrop-blur-md border border-indigo-400/30 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-amber-300">
                      <Flame className="h-3.5 w-3.5 text-amber-400" />
                      2. Tanque de Gasolina (Calificados)
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black border ${badgeStyle}`}
                    >
                      {statusLabel}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between mb-2">
                    <div className="text-2xl font-black text-white">
                      {qualifiedCount}{" "}
                      <span className="text-xs font-semibold text-slate-300">
                        / 100 calificados vivos
                      </span>
                    </div>
                    <span className="text-xs font-black text-amber-300">
                      {fuelPct}%
                    </span>
                  </div>

                  <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden mb-2">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${barStyle}`}
                      style={{ width: `${fuelPct}%` }}
                    />
                  </div>

                  <p className="text-[11px] text-slate-300 leading-snug">
                    Base:{" "}
                    <strong className="text-indigo-200">{baseCount}</strong> ·
                    Referidos/COI:{" "}
                    <strong className="text-amber-300">{referralsCount}</strong>{" "}
                    {qualifiedCount < 100 && (
                      <span className="text-amber-200 font-bold">
                        (Suma +{100 - qualifiedCount} calificados)
                      </span>
                    )}
                  </p>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Puente Automático con Encuesta de Satisfacción (Sugerencias de Referidos) */}
      {unimportedReferrals.length > 0 && (
        <div className="rounded-2xl bg-gradient-to-r from-amber-50 via-orange-50/70 to-amber-50 border border-amber-200/80 p-4 md:p-5 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500 text-white shadow-sm shrink-0">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm md:text-base font-bold text-slate-900">
                  ¡Tienes {unimportedReferrals.length} referido(s) obtenidos en
                  Encuestas de Satisfacción listos para sumarse a tu Proyecto
                  200!
                </h3>
                <p className="text-xs text-slate-600">
                  Haz clic en «Calificar e Integrar» para asignarles sueldo
                  estimado y probabilidad de cierre e inyectarlos en el tope de
                  tu cola de llamadas.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {unimportedReferrals.slice(0, 6).map((ref: any) => (
              <div
                key={ref.id}
                className="bg-white rounded-xl p-3.5 border border-amber-200/90 shadow-xs flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="font-bold text-sm text-slate-900 truncate">
                    {ref.fullName}
                  </div>
                  <div className="text-xs text-slate-600 font-medium">
                    📞 {ref.phone}
                  </div>
                  <div className="text-[11px] text-amber-700 font-medium truncate">
                    Referido por:{" "}
                    {ref.survey?.intervieweeName || "Encuesta de Satisfacción"}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    openNewContactModal({
                      fullName: ref.fullName,
                      phone: ref.phone,
                      relationship: `Referido por ${
                        ref.survey?.intervieweeName || "Cliente"
                      }`,
                      notes: ref.notes || "Obtenido en Encuesta de Satisfacción",
                      source: "ENCUESTA_SATISFACCION",
                      surveyReferralId: ref.id,
                    })
                  }
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shrink-0 transition shadow-xs"
                >
                  + Calificar e Integrar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Radar Automático de Recordatorios Programados para Hoy / Vencidos */}
      {remindersDueToday.length > 0 && (
        <div className="rounded-2xl bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 text-white border border-amber-400/50 p-4 md:p-5 shadow-md space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-amber-400 text-slate-950 shadow-sm shrink-0">
                <Bell className="h-5 w-5 animate-bounce" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-black uppercase tracking-wider mb-1">
                  Radar de Seguimiento Puntual Proyecto 200
                </div>
                <h3 className="text-sm md:text-base font-black text-white">
                  ¡Hoy toca contactar a {remindersDueToday.length} prospecto(s)
                  que te pidieron buscarlos en esta fecha!
                </h3>
                <p className="text-xs text-slate-300">
                  Estos prospectos ya fueron colocados automáticamente hasta
                  arriba de tu Piloto Automático con la nota exacta que dejaste
                  en su bitácora.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedQueueContactId(remindersDueToday[0].id);
                setActiveTab("piloto");
              }}
              className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black shrink-0 transition shadow-sm"
            >
              📞 Atender Recordatorios Ahora
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {remindersDueToday.slice(0, 6).map((rem: any) => (
              <div
                key={rem.id}
                className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/15 flex items-center justify-between gap-2.5"
              >
                <div className="min-w-0">
                  <div className="font-bold text-xs text-white truncate">
                    {rem.fullName}{" "}
                    <span className="text-amber-300 font-mono">
                      ({rem.phone})
                    </span>
                  </div>
                  <div className="text-[11px] text-amber-200 font-semibold">
                    ⏰ Programado: {formatDateTime(rem.nextActionAt)}
                  </div>
                  {rem.notes && (
                    <div className="text-[11px] text-slate-300 italic truncate mt-0.5">
                      «{rem.notes}»
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => openContactHistoryModal(rem, "NOTA")}
                    className="px-2.5 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-[11px] font-bold transition"
                    title="Abrir Bitácora 360°"
                  >
                    📋 Bitácora
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedQueueContactId(rem.id);
                      setActiveTab("piloto");
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-black transition"
                  >
                    Llamar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Barra de Navegación del Módulo */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("piloto")}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === "piloto"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <PhoneForwarded className="h-4 w-4" />
            Piloto Automático (Siguiente Acción)
            {activeQueue.length > 0 && (
              <span
                className={`px-2 py-0.5 rounded-full text-xs ${
                  activeTab === "piloto"
                    ? "bg-white/20 text-white"
                    : "bg-indigo-100 text-indigo-700"
                }`}
              >
                {activeQueue.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("crm")}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === "crm"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <Users className="h-4 w-4" />
            Mi CRM Proyecto 200 ({stats.totalContacts})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("importador")}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === "importador"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <FileSpreadsheet className="h-4 w-4" />
            Importador Excel / CSV
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("estadisticas")}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === "estadisticas"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            Mis Estadísticas
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={() => setActiveTab("admin")}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === "admin"
                  ? "bg-slate-900 text-amber-400 shadow-md border border-amber-400/40"
                  : "bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-300"
              }`}
            >
              <Crown className="h-4 w-4 text-amber-500" />
              Dashboard Ejecutivo Promotoría
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => openNewContactModal()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs md:text-sm font-bold shadow-xs transition"
          >
            <Plus className="h-4 w-4" /> Nuevo Contacto / Referido
          </button>
          <button
            type="button"
            onClick={refreshAllData}
            disabled={isRefreshing}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
            title="Actualizar datos"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* =====================================================================
          TAB 1: PILOTO AUTOMÁTICO DE PROSPECCIÓN (SIGUIENTE ACCIÓN INTELIGENTE)
      ===================================================================== */}
      {activeTab === "piloto" && (
        <div className="space-y-6">
          {!currentPilotoContact ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center max-w-2xl mx-auto space-y-4 shadow-xs">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                <PhoneForwarded className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-black text-slate-900">
                Tu Cola de Piloto Automático está vacía por ahora
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                {stats.totalContacts === 0
                  ? "Aún no has cargado contactos a tu Proyecto 200. Sube tu plantilla de Excel o agrega tus primeros prospectos para activar la ejecución secuencial."
                  : "Todos tus contactos activos ya tienen cita agendada o han sido descalificados."}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("importador")}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition"
                >
                  Subir Excel / CSV de Proyecto 200
                </button>
                <button
                  type="button"
                  onClick={() => openNewContactModal()}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition"
                >
                  + Agregar Contacto Manualmente
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Columna Izquierda (7 cols): Tarjeta de Enfoque Único y Script Dinámico */}
              <div className="lg:col-span-7 space-y-5">
                {/* Tarjeta del Contacto Actual */}
                <div className="bg-white rounded-3xl border-2 border-indigo-500/80 shadow-lg overflow-hidden">
                  <div className="bg-gradient-to-r from-indigo-600 to-slate-900 px-6 py-4 text-white flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="px-2.5 py-1 rounded-lg bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider">
                        Prioridad #{activeQueue.indexOf(currentPilotoContact) + 1} ({currentPilotoContact.priorityScore} pts)
                      </span>
                      <span className="text-xs font-semibold text-indigo-100">
                        Siguiente Acción Inteligente Asignada
                      </span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-xs font-mono font-bold">
                      <Clock className="h-3.5 w-3.5 text-amber-300 animate-pulse" />
                      Tiempo en estación: {formatTimer(callSeconds)}
                    </div>
                  </div>

                  <div className="p-6 space-y-6">
                    {currentPilotoContact.status === "RECORDATORIO_PROGRAMADO" && (
                      <div className="rounded-2xl bg-amber-50 border-2 border-amber-400 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-start gap-2.5">
                          <Bell className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                          <div className="text-xs text-amber-950">
                            <strong className="font-black block">
                              🔔 RECORDATORIO PROGRAMADO PARA HOY (
                              {formatDateTime(currentPilotoContact.nextActionAt)}
                              )
                            </strong>
                            <span>
                              Este prospecto te pidió que lo volvieras a buscar
                              en esta fecha. Revisa su bitácora abajo antes de
                              marcarle.
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            openContactHistoryModal(
                              currentPilotoContact,
                              "NOTA"
                            )
                          }
                          className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black shrink-0 transition"
                        >
                          📋 Ver Bitácora ({currentPilotoContact.logs?.length || 0})
                        </button>
                      </div>
                    )}

                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                              currentPilotoContact.classification ===
                              "REFERIDOR"
                                ? "bg-purple-100 text-purple-800 border border-purple-200"
                                : "bg-indigo-100 text-indigo-800 border border-indigo-200"
                            }`}
                          >
                            {currentPilotoContact.classification === "REFERIDOR"
                              ? "🤝 Centro de Influencia / Referidor"
                              : "🎯 Prospecto Directo"}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                              currentPilotoContact.closingProbability === "ALTA"
                                ? "bg-emerald-100 text-emerald-800"
                                : currentPilotoContact.closingProbability ===
                                  "MEDIA"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            Probabilidad{" "}
                            {currentPilotoContact.closingProbability}
                          </span>
                          {currentPilotoContact.source ===
                            "ENCUESTA_SATISFACCION" && (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900">
                              ⭐ Referido Encuesta
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              openContactHistoryModal(
                                currentPilotoContact,
                                "NOTA"
                              )
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 hover:bg-indigo-100 text-slate-700 hover:text-indigo-900 border border-slate-300 transition"
                          >
                            <History className="h-3 w-3" /> Bitácora 360° (
                            {currentPilotoContact.logs?.length || 0})
                          </button>
                        </div>

                        <h2 className="text-2xl md:text-3xl font-black text-slate-900">
                          {currentPilotoContact.fullName}
                        </h2>
                        <p className="text-sm text-slate-600 font-medium">
                          Relación / Vínculo:{" "}
                          <strong className="text-slate-900">
                            {currentPilotoContact.relationship}
                          </strong>
                        </p>
                      </div>

                      {/* Botones de Acción Telefónica Directa (Metodología Teléfono Primero / Anti-WhatsApp) */}
                      <div className="flex flex-col items-end gap-1.5">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <a
                            href={`tel:${currentPilotoContact.phone}`}
                            onClick={() =>
                              setDialedContactIds((prev) => ({
                                ...prev,
                                [currentPilotoContact.id]: true,
                              }))
                            }
                            className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-md shadow-emerald-600/20 transition"
                          >
                            <Phone className="h-4 w-4" />
                            Llamar Ahora ({currentPilotoContact.phone})
                          </a>

                          {(currentPilotoContact.attemptsCount || 0) >= 1 ||
                          dialedContactIds[currentPilotoContact.id] ||
                          currentPilotoContact.status === "CITA_AGENDADA" ? (
                            <a
                              href={`https://wa.me/52${
                                currentPilotoContact.phone
                              }?text=${encodeURIComponent(
                                `¡Hola ${
                                  currentPilotoContact.fullName.split(" ")[0]
                                }! Te escribe ${
                                  currentUser.name.split(" ")[0]
                                }. Te marqué hace un momento por teléfono y no logré localizarte. No quiero quitarte tiempo por mensaje, ¿a qué hora del día de hoy o mañana te puedo marcar 2 minutos?`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-300 font-bold text-xs shadow-xs transition"
                            >
                              <MessageCircle className="h-4 w-4 text-teal-600" />
                              WhatsApp de Rescate (Doble Toque)
                            </a>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                showToast(
                                  "info",
                                  "Regla de Oro Proyecto 200: En el 1er contacto primero marca por teléfono. El botón de WhatsApp se desbloquea automáticamente como rescate si no te contestan."
                                )
                              }
                              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-slate-100 text-slate-500 border border-slate-200 font-bold text-xs cursor-not-allowed"
                              title="En el 1er contacto debes llamar primero por teléfono"
                            >
                              <Lock className="h-3.5 w-3.5 text-slate-400" />
                              WhatsApp bloqueado en 1er toque (Llama primero)
                            </button>
                          )}
                        </div>
                        <span className="text-[11px] font-semibold text-slate-500">
                          📞 Regla de Oro: Nunca prospectes en frío por texto. Usa WhatsApp solo si no contestó tu llamada.
                        </span>
                      </div>
                    </div>

                    {/* Métricas Financieras del Prospecto */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                      <div>
                        <div className="text-[11px] font-bold uppercase text-slate-400">
                          Sueldo Estimado
                        </div>
                        <div className="text-base font-black text-slate-900">
                          {formatCurrencyMXN(
                            currentPilotoContact.estimatedSalary
                          )}
                          /mes
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] font-bold uppercase text-slate-400">
                          Capacidad Ahorro (10%)
                        </div>
                        <div className="text-base font-black text-emerald-700">
                          {formatCurrencyMXN(
                            Math.round(
                              currentPilotoContact.estimatedSalary * 0.1
                            )
                          )}
                          /mes
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] font-bold uppercase text-slate-400">
                          Intentos Previos
                        </div>
                        <div className="text-base font-black text-slate-900">
                          {currentPilotoContact.attemptsCount} toques
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] font-bold uppercase text-slate-400">
                          Último Contacto
                        </div>
                        <div className="text-xs font-bold text-slate-700 mt-1">
                          {formatDateTime(currentPilotoContact.lastAttemptAt)}
                        </div>
                      </div>
                    </div>

                    {currentPilotoContact.notes && (
                      <div className="rounded-xl bg-amber-50/80 border border-amber-200 px-4 py-3 text-xs text-amber-950">
                        <strong className="font-bold">
                          Notas de Contexto:{" "}
                        </strong>
                        {currentPilotoContact.notes}
                      </div>
                    )}

                    {/* Guion Dinámico en Pantalla */}
                    <div className="space-y-4 border-t border-slate-200 pt-5">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-black uppercase tracking-wider text-indigo-950 flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-indigo-600" />
                          {currentPilotoContact.classification === "REFERIDOR"
                            ? "Guion Oficial para Centro de Influencia / Referidor"
                            : "Guion Oficial de los 5 Pilares para Agendar Cita"}
                        </h3>
                        <button
                          type="button"
                          onClick={() =>
                            openNewContactModal({
                              relationship: `Referido por ${currentPilotoContact.fullName}`,
                              source: "REFERIDO_DIRECTO",
                              notes: `Obtenido durante llamada con ${currentPilotoContact.fullName}`,
                            })
                          }
                          className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200 transition"
                        >
                          <Plus className="h-3.5 w-3.5" /> Capturar Referido en
                          Llamada
                        </button>
                      </div>

                      {currentPilotoContact.classification === "REFERIDOR" ? (
                        <div className="bg-purple-50/70 border border-purple-200 rounded-2xl p-4 space-y-2.5 text-sm text-slate-800 leading-relaxed">
                          <p>
                            <strong>1. Saludo y Reconocimiento:</strong> «¡Hola{" "}
                            <strong>
                              {currentPilotoContact.fullName.split(" ")[0]}
                            </strong>
                            ! Te saluda <strong>{currentUser.name}</strong> de{" "}
                            <strong>{currentUser.agencyName}</strong>. Te llamo
                            porque valoro mucho tu criterio profesional y la
                            relación que tenemos ({currentPilotoContact.relationship}).»
                          </p>
                          <p>
                            <strong>2. Explicación de Valor:</strong> «Estoy
                            expandiendo mi práctica de consultoría financiera y
                            diagnóstico patrimonial sin costo para profesionales
                            y familias que buscan blindar y optimizar su
                            dinero.»
                          </p>
                          <p>
                            <strong>3. Petición de Referidos o Cita:</strong>{" "}
                            «¿Conoces a 2 o 3 personas de tu círculo cercano a
                            quienes les sería valioso un diagnóstico financiero
                            gratuito, o te gustaría que primero lo hagamos
                            contigo esta semana: te queda mejor miércoles a las
                            5:00 PM o viernes a las 11:00 AM?»
                          </p>
                        </div>
                      ) : (
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5 text-sm text-slate-800 leading-relaxed">
                          <p>
                            <span className="inline-block px-2 py-0.5 rounded bg-indigo-600 text-white text-[11px] font-bold mr-2">
                              Pilar 1, 2 y 3
                            </span>
                            «¡Hola{" "}
                            <strong>
                              {currentPilotoContact.fullName.split(" ")[0]}
                            </strong>
                            ! Te saluda <strong>{currentUser.name}</strong> de{" "}
                            <strong>{currentUser.agencyName}</strong>. Te marco
                            por nuestra relación de{" "}
                            <strong>{currentPilotoContact.relationship}</strong>
                            .»
                          </p>
                          <p>
                            <span className="inline-block px-2 py-0.5 rounded bg-indigo-600 text-white text-[11px] font-bold mr-2">
                              Pilar 4 (Valor)
                            </span>
                            «Nuestra labor es actuar como{" "}
                            <strong>médicos de las finanzas</strong>: realizamos
                            un diagnóstico de salud financiera 100% gratuito y
                            personalizado de 20 minutos para ayudarte a
                            optimizar tu flujo, proteger tu patrimonio y
                            alcanzar metas sin compromiso.»
                          </p>
                          <p>
                            <span className="inline-block px-2 py-0.5 rounded bg-emerald-600 text-white text-[11px] font-bold mr-2">
                              Pilar 5 (2 Horarios)
                            </span>
                            «Para platicar brevemente por Zoom o en persona,
                            ¿te queda mejor{" "}
                            <strong>mañana a las 6:00 PM</strong> o prefieres{" "}
                            <strong>el jueves a las 11:00 AM</strong>?»
                          </p>
                        </div>
                      )}

                      {/* Escudo Anti-Objeciones en Vivo */}
                      <div className="space-y-2">
                        <div className="text-xs font-bold uppercase text-slate-500">
                          Escudo Anti-Objeciones en Tiempo Real (Clic para ver
                          respuesta exacta + doble alternativa):
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {OBJECTION_GUIDES.map((obj) => (
                            <button
                              key={obj.id}
                              type="button"
                              onClick={() => setActiveObjectionId(obj.id)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                                activeObjectionId === obj.id
                                  ? "bg-slate-900 text-white shadow-xs"
                                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                              }`}
                            >
                              {obj.label}
                            </button>
                          ))}
                        </div>
                        <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200 text-xs md:text-sm text-indigo-950 font-medium leading-relaxed">
                          {
                            OBJECTION_GUIDES.find(
                              (o) => o.id === activeObjectionId
                            )?.response
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Columna Derecha (5 cols): Candado de Resolución Obligatoria y Siguientes en Cola */}
              <div className="lg:col-span-5 space-y-5">
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                  <div>
                    <h3 className="text-base font-black text-slate-900">
                      Registra el Resultado para Avanzar al Siguiente
                    </h3>
                    <p className="text-xs text-slate-500">
                      El sistema cargará inmediatamente a tu siguiente contacto
                      mejor calificado en cuanto registres qué ocurrió en este
                      toque.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nota rápida de la llamada (opcional):
                    </label>
                    <input
                      type="text"
                      value={actionNotes}
                      onChange={(e) => setActionNotes(e.target.value)}
                      placeholder="Ej. Me pidió marcarle saliendo de junta / Muy receptivo..."
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  {/* Botones de Resolución Secuencial */}
                  <div className="grid grid-cols-1 gap-2.5">
                    <button
                      type="button"
                      disabled={submittingAction}
                      onClick={() =>
                        setPilotoActionModal(
                          pilotoActionModal === "CITA" ? null : "CITA"
                        )
                      }
                      className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-md shadow-emerald-600/20 transition"
                    >
                      <span className="flex items-center gap-2.5">
                        <Calendar className="h-5 w-5" />
                        ¡Cita de Diagnóstico Agendada!
                      </span>
                      <ChevronRight className="h-4 w-4" />
                    </button>

                    {/* Sub-panel para confirmar fecha y hora de la cita */}
                    {pilotoActionModal === "CITA" && (
                      <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3">
                        <div className="text-xs font-bold text-emerald-950">
                          Selecciona el día y horario acordado con{" "}
                          {currentPilotoContact.fullName}:
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[11px] font-bold text-emerald-800 mb-1">
                              Fecha de la Cita
                            </label>
                            <input
                              type="date"
                              value={scheduledDate}
                              onChange={(e) => setScheduledDate(e.target.value)}
                              className="w-full rounded-lg border border-emerald-300 bg-white px-2.5 py-1.5 text-xs font-bold"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-emerald-800 mb-1">
                              Hora
                            </label>
                            <input
                              type="time"
                              value={scheduledTime}
                              onChange={(e) => setScheduledTime(e.target.value)}
                              className="w-full rounded-lg border border-emerald-300 bg-white px-2.5 py-1.5 text-xs font-bold"
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          disabled={submittingAction}
                          onClick={() => handlePilotoOutcome("CITA_AGENDADA")}
                          className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black uppercase tracking-wider transition"
                        >
                          {submittingAction
                            ? "Guardando..."
                            : "Confirmar Cita y Pasar al Siguiente Contacto →"}
                        </button>
                      </div>
                    )}

                    {/* Botón: Posponer / Agendar Recordatorio Futuro ("Ahorita no, pero en Diciembre / X fecha") */}
                    <button
                      type="button"
                      disabled={submittingAction}
                      onClick={() =>
                        setPilotoActionModal(
                          pilotoActionModal === "RECORDATORIO"
                            ? null
                            : "RECORDATORIO"
                        )
                      }
                      className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm shadow-sm shadow-indigo-500/20 transition"
                    >
                      <span className="flex items-center gap-2.5 text-left">
                        <Bell className="h-4 w-4 text-amber-300 shrink-0" />
                        <span>
                          ⏰ Posponer / Agendar Recordatorio («En Diciembre / Otra
                          Fecha»)
                        </span>
                      </span>
                      <ChevronRight className="h-4 w-4 shrink-0" />
                    </button>

                    {/* Sub-panel para programar Recordatorio Futuro con Atajos de 1 Clic */}
                    {pilotoActionModal === "RECORDATORIO" && (
                      <div className="p-4 rounded-2xl bg-indigo-50 border-2 border-indigo-300 space-y-3">
                        <div className="text-xs font-black text-indigo-950">
                          ¿Cuándo te pidió {currentPilotoContact.fullName} que lo
                          vuelvas a buscar?
                        </div>

                        {/* Atajos rápidos de 1 clic */}
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setReminderDate(computePresetDateString("1W"));
                              if (!reminderReasonInput) {
                                setReminderReasonInput(
                                  "Pidió que le llame la próxima semana."
                                );
                              }
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-indigo-100 border border-indigo-200 text-[11px] font-bold text-indigo-900 transition text-left"
                          >
                            📅 En 1 semana
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setReminderDate(computePresetDateString("15D"));
                              if (!reminderReasonInput) {
                                setReminderReasonInput(
                                  "Pidió que lo contacte en 15 días (quincena)."
                                );
                              }
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-indigo-100 border border-indigo-200 text-[11px] font-bold text-indigo-900 transition text-left"
                          >
                            📆 En 15 días
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setReminderDate(
                                computePresetDateString("NEXT_MONTH")
                              );
                              if (!reminderReasonInput) {
                                setReminderReasonInput(
                                  "Pidió hablar a inicios del próximo mes."
                                );
                              }
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-indigo-100 border border-indigo-200 text-[11px] font-bold text-indigo-900 transition text-left"
                          >
                            🗓️ Inicio próx. mes
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setReminderDate(computePresetDateString("DEC"));
                              if (!reminderReasonInput) {
                                setReminderReasonInput(
                                  "Me dijo «Ahorita no, búscame en diciembre con el aguinaldo»."
                                );
                              }
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 border border-amber-300 text-[11px] font-black text-amber-950 transition text-left"
                          >
                            🎄 En Diciembre (Aguinaldo)
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[11px] font-bold text-indigo-900 mb-1">
                              Fecha Exacta del Recordatorio *
                            </label>
                            <input
                              type="date"
                              value={reminderDate}
                              onChange={(e) => setReminderDate(e.target.value)}
                              className="w-full rounded-lg border border-indigo-300 bg-white px-2.5 py-1.5 text-xs font-bold"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-indigo-900 mb-1">
                              Hora sugerida
                            </label>
                            <input
                              type="time"
                              value={reminderTime}
                              onChange={(e) => setReminderTime(e.target.value)}
                              className="w-full rounded-lg border border-indigo-300 bg-white px-2.5 py-1.5 text-xs font-bold"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-black text-indigo-950 mb-1">
                            ¿Qué sucedió y qué debes recordar ese día? (Obligatorio
                            en Bitácora) *
                          </label>
                          <textarea
                            rows={2}
                            value={reminderReasonInput}
                            onChange={(e) =>
                              setReminderReasonInput(e.target.value)
                            }
                            placeholder="Ej. Me comentó que ahorita está pagando colegiaturas pero en diciembre recibe su aguinaldo y quiere revisar ahorro..."
                            className="w-full rounded-xl border border-indigo-300 bg-white px-3 py-2 text-xs text-slate-900"
                          />
                        </div>

                        <button
                          type="button"
                          disabled={submittingAction}
                          onClick={() =>
                            handlePilotoOutcome("RECORDATORIO_PROGRAMADO")
                          }
                          className="w-full py-2.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-black uppercase tracking-wider transition"
                        >
                          {submittingAction
                            ? "Guardando Recordatorio..."
                            : "Guardar Recordatorio en Bitácora y Pasar al Siguiente →"}
                        </button>
                      </div>
                    )}

                    <button
                      type="button"
                      disabled={submittingAction}
                      onClick={() => handlePilotoOutcome("NO_CONTESTO")}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm transition shadow-xs"
                    >
                      <span className="flex items-center gap-2.5">
                        <PhoneOff className="h-4 w-4" />
                        No Contestó / Buzón (Reprogramar + Siguiente)
                      </span>
                      <ArrowRight className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      disabled={submittingAction}
                      onClick={() =>
                        handlePilotoOutcome("SEGUIMIENTO_WHATSAPP")
                      }
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border font-bold text-sm transition ${
                        (currentPilotoContact.attemptsCount || 0) >= 1 ||
                        dialedContactIds[currentPilotoContact.id]
                          ? "bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border-indigo-200"
                          : "bg-slate-50 hover:bg-slate-100 text-slate-500 border-slate-200"
                      }`}
                    >
                      <span className="flex items-center gap-2.5 text-left">
                        {(currentPilotoContact.attemptsCount || 0) >= 1 ||
                        dialedContactIds[currentPilotoContact.id] ? (
                          <MessageCircle className="h-4 w-4 text-indigo-600 shrink-0" />
                        ) : (
                          <Lock className="h-4 w-4 text-slate-400 shrink-0" />
                        )}
                        <span>
                          Rescate por WhatsApp tras llamada (Acordar horario de
                          llamada)
                        </span>
                      </span>
                      <ArrowRight className="h-4 w-4 text-indigo-600 shrink-0" />
                    </button>

                    <button
                      type="button"
                      disabled={submittingAction}
                      onClick={() => handlePilotoOutcome("CONVERTIR_REFERIDOR")}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 font-bold text-sm transition"
                    >
                      <span className="flex items-center gap-2.5">
                        <Users className="h-4 w-4 text-purple-600" />
                        Clasificar como Centro de Influencia / Referidor
                      </span>
                      <ArrowRight className="h-4 w-4 text-purple-600" />
                    </button>

                    <button
                      type="button"
                      disabled={submittingAction}
                      onClick={() =>
                        setPilotoActionModal(
                          pilotoActionModal === "DESCALIFICAR"
                            ? null
                            : "DESCALIFICAR"
                        )
                      }
                      className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-bold text-sm transition"
                    >
                      <span className="flex items-center gap-2.5">
                        <UserX className="h-4 w-4 text-rose-600" />
                        Descalificar Candidato (Motivo Obligatorio)
                      </span>
                      <ChevronRight className="h-4 w-4 text-rose-600" />
                    </button>

                    {/* Sub-panel Candado Obligatorio de Descalificación */}
                    {pilotoActionModal === "DESCALIFICAR" && (
                      <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 space-y-3">
                        <div className="flex items-start gap-2 text-xs font-bold text-rose-900">
                          <ShieldAlert className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                          <span>
                            Candado de Calidad Proyecto 200: Es forzoso registrar
                            el motivo exacto por el cual descalificas a este
                            candidato.
                          </span>
                        </div>

                        <select
                          value={disqPreset}
                          onChange={(e) => setDisqPreset(e.target.value)}
                          className="w-full rounded-xl border border-rose-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800"
                        >
                          <option value="">
                            -- Selecciona una causa o escribe abajo --
                          </option>
                          {COMMON_DISQUALIFICATION_REASONS.map((reason) => (
                            <option key={reason} value={reason}>
                              {reason}
                            </option>
                          ))}
                          <option value="OTRO">
                            Otro motivo específico (especificar abajo)
                          </option>
                        </select>

                        <textarea
                          rows={2}
                          value={disqReasonInput}
                          onChange={(e) => setDisqReasonInput(e.target.value)}
                          placeholder="Escribe el motivo detallado de la descalificación..."
                          className="w-full rounded-xl border border-rose-300 bg-white px-3 py-2 text-xs text-slate-900"
                        />

                        <button
                          type="button"
                          disabled={submittingAction}
                          onClick={() => handlePilotoOutcome("DESCALIFICAR")}
                          className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black uppercase tracking-wider transition"
                        >
                          {submittingAction
                            ? "Procesando..."
                            : "Confirmar Descalificación y Pasar al Siguiente →"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Siguientes en la Cola de Prioridad */}
                <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                      Siguientes Contactos en Cola por Prioridad
                    </h4>
                    <span className="text-xs font-bold text-indigo-600">
                      {activeQueue.length} activos
                    </span>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {activeQueue.slice(0, 6).map((item, idx) => {
                      const isCurrent = item.id === currentPilotoContact.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setSelectedQueueContactId(item.id)}
                          className={`w-full text-left p-3 rounded-2xl border transition flex items-center justify-between gap-3 ${
                            isCurrent
                              ? "bg-indigo-50/90 border-indigo-400 shadow-xs"
                              : "bg-slate-50/60 hover:bg-slate-100 border-slate-200/80"
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-indigo-700">
                                #{idx + 1}
                              </span>
                              <span className="text-sm font-bold text-slate-900 truncate">
                                {item.fullName}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 truncate">
                              {item.relationship} •{" "}
                              {formatCurrencyMXN(item.estimatedSalary)} • Prob.{" "}
                              {item.closingProbability}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="inline-block px-2 py-0.5 rounded-md bg-slate-900 text-white text-[11px] font-bold">
                              {item.priorityScore} pts
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          TAB 2: MI CRM PROYECTO 200 (INVENTARIO, CALIFICACIÓN Y SEGUIMIENTO)
      ===================================================================== */}
      {activeTab === "crm" && (
        <div className="space-y-5">
          {/* Barra de Filtros y Búsqueda */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre, teléfono de 10 dígitos o relación..."
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={filterClassification}
                onChange={(e) => setFilterClassification(e.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 bg-slate-50"
              >
                <option value="ALL">Todas las Clasificaciones</option>
                <option value="PROSPECTO">🎯 Prospectos</option>
                <option value="REFERIDOR">🤝 Referidores</option>
                <option value="DESCALIFICADO">🚫 Descalificados</option>
              </select>

              <select
                value={filterProbability}
                onChange={(e) => setFilterProbability(e.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 bg-slate-50"
              >
                <option value="ALL">Cualquier Probabilidad</option>
                <option value="ALTA">🔥 Probabilidad Alta</option>
                <option value="MEDIA">⚡ Probabilidad Media</option>
                <option value="BAJA">❄️ Probabilidad Baja</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 bg-slate-50"
              >
                <option value="ALL">Todos los Estatus</option>
                <option value="POR_CONTACTAR">🆕 Por Contactar</option>
                <option value="EN_SEGUIMIENTO">⏳ En Seguimiento</option>
                <option value="RECORDATORIO_PROGRAMADO">
                  ⏰ Recordatorio Programado
                </option>
                <option value="CITA_AGENDADA">📅 Cita Agendada</option>
                <option value="DESCARTADO">🚫 Descartado</option>
              </select>
            </div>
          </div>

          {/* Tabla Viva CRM */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black uppercase tracking-wider text-slate-500">
                    <th className="py-3.5 px-4">Prioridad</th>
                    <th className="py-3.5 px-4">Contacto y Teléfono</th>
                    <th className="py-3.5 px-4">Relación / Origen</th>
                    <th className="py-3.5 px-4">Sueldo Est.</th>
                    <th className="py-3.5 px-4">Probabilidad</th>
                    <th className="py-3.5 px-4">
                      Calificación en Proyecto 200
                    </th>
                    <th className="py-3.5 px-4">Estatus / Seguimiento</th>
                    <th className="py-3.5 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredCrmContacts.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="py-12 text-center text-slate-500 text-sm"
                      >
                        No se encontraron contactos con los filtros actuales.
                      </td>
                    </tr>
                  ) : (
                    filteredCrmContacts.map((contact) => (
                      <tr
                        key={contact.id}
                        className="hover:bg-slate-50/80 transition"
                      >
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 text-white text-xs font-black">
                            {contact.priorityScore} pts
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <button
                            type="button"
                            onClick={() =>
                              openContactHistoryModal(contact, "NOTA")
                            }
                            className="text-left group focus:outline-none"
                            title="Haz clic para abrir el Expediente 360°, revisar su bitácora o agendar un recordatorio"
                          >
                            <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition flex items-center gap-1.5">
                              <span className="underline decoration-slate-300 group-hover:decoration-indigo-500 underline-offset-2">
                                {contact.fullName}
                              </span>
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-black">
                                📋 {contact.logs?.length || 0}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 font-mono flex items-center gap-2 mt-0.5">
                              <span>📞 {contact.phone}</span>
                              <span className="text-[10px] font-sans font-bold text-indigo-600 opacity-80 group-hover:opacity-100">
                                Ver bitácora / Agendar →
                              </span>
                            </div>
                            {contact.notes && (
                              <div className="mt-1 text-[11px] text-slate-600 bg-amber-50/70 border border-amber-200/70 rounded-lg px-2 py-0.5 max-w-xs truncate italic">
                                💬 «{contact.notes}»
                              </div>
                            )}
                          </button>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="text-xs font-semibold text-slate-800">
                            {contact.relationship}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {contact.source === "ENCUESTA_SATISFACCION"
                              ? "⭐ Encuesta Satisfacción"
                              : contact.source === "EXCEL"
                              ? "📥 Plantilla Excel"
                              : "✍️ Registro Directo"}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-bold text-slate-900">
                            {formatCurrencyMXN(contact.estimatedSalary)}
                          </div>
                          <div className="text-[11px] text-emerald-700 font-semibold">
                            Ahorro 10%:{" "}
                            {formatCurrencyMXN(
                              Math.round(contact.estimatedSalary * 0.1)
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                              contact.closingProbability === "ALTA"
                                ? "bg-emerald-100 text-emerald-800"
                                : contact.closingProbability === "MEDIA"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {contact.closingProbability}
                          </span>
                        </td>

                        {/* Calificación Interactiva con Candado en Descalificado */}
                        <td className="py-3.5 px-4">
                          <div className="inline-flex rounded-xl bg-slate-100 p-1 gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                handleQuickClassificationChange(
                                  contact,
                                  "PROSPECTO"
                                )
                              }
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                                contact.classification === "PROSPECTO"
                                  ? "bg-indigo-600 text-white shadow-xs"
                                  : "text-slate-600 hover:text-slate-900"
                              }`}
                            >
                              Prospecto
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleQuickClassificationChange(
                                  contact,
                                  "REFERIDOR"
                                )
                              }
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                                contact.classification === "REFERIDOR"
                                  ? "bg-purple-600 text-white shadow-xs"
                                  : "text-slate-600 hover:text-slate-900"
                              }`}
                            >
                              Referidor
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleQuickClassificationChange(
                                  contact,
                                  "DESCALIFICADO"
                                )
                              }
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                                contact.classification === "DESCALIFICADO"
                                  ? "bg-rose-600 text-white shadow-xs"
                                  : "text-slate-600 hover:text-rose-700"
                              }`}
                            >
                              Descalificado
                            </button>
                          </div>
                          {contact.classification === "DESCALIFICADO" &&
                            contact.disqualificationReason && (
                              <div className="mt-1.5 text-[11px] text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-2 py-1 max-w-xs">
                                <strong>Motivo:</strong>{" "}
                                {contact.disqualificationReason}
                              </div>
                            )}
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              contact.status === "CITA_AGENDADA"
                                ? "bg-emerald-100 text-emerald-800"
                                : contact.status === "RECORDATORIO_PROGRAMADO"
                                ? "bg-indigo-100 text-indigo-900 border border-indigo-300"
                                : contact.status === "EN_SEGUIMIENTO"
                                ? "bg-amber-100 text-amber-800"
                                : contact.status === "DESCARTADO"
                                ? "bg-rose-100 text-rose-800"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {contact.status === "CITA_AGENDADA"
                              ? "📅 Cita Agendada"
                              : contact.status === "RECORDATORIO_PROGRAMADO"
                              ? "⏰ Recordatorio Programado"
                              : contact.status === "EN_SEGUIMIENTO"
                              ? "⏳ En Seguimiento"
                              : contact.status === "DESCARTADO"
                              ? "🚫 Descartado"
                              : "🆕 Por Contactar"}
                          </span>
                          <div className="text-[11px] text-slate-500 mt-1">
                            {contact.attemptsCount} toques •{" "}
                            {contact.status === "CITA_AGENDADA" &&
                            contact.scheduledMeetingAt
                              ? `Cita: ${formatDateTime(
                                  contact.scheduledMeetingAt
                                )}`
                              : contact.status === "RECORDATORIO_PROGRAMADO" &&
                                contact.nextActionAt
                              ? `🔔 Toca llamar: ${formatDateTime(
                                  contact.nextActionAt
                                )}`
                              : formatDateTime(contact.lastAttemptAt)}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            {contact.classification !== "DESCALIFICADO" && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedQueueContactId(contact.id);
                                  setActiveTab("piloto");
                                }}
                                className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition"
                                title="Atender ahora en Piloto Automático"
                              >
                                <PhoneForwarded className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() =>
                                openContactHistoryModal(contact, "RECORDATORIO")
                              }
                              className="p-1.5 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 transition"
                              title="Agendar recordatorio futuro (ej. Búscame en diciembre)"
                            >
                              <Bell className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                openContactHistoryModal(contact, "NOTA")
                              }
                              className="px-2.5 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-indigo-700 text-xs font-bold inline-flex items-center gap-1 transition"
                              title="Abrir Expediente 360° y Bitácora de comentarios"
                            >
                              <History className="h-3.5 w-3.5" /> Bitácora
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditContactModal(contact)}
                              className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                              title="Editar contacto"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteContact(contact)}
                              className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition"
                              title="Eliminar contacto"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 3: IMPORTADOR Y VALIDADOR INTELIGENTE EXCEL / CSV
      ===================================================================== */}
      {activeTab === "importador" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Instrucciones de Layout Estricto */}
            <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold">
                <FileSpreadsheet className="h-4 w-4" />
                Reglas del Validador Inteligente Proyecto 200
              </div>
              <h2 className="text-xl font-black text-slate-900">
                Layout Oficial para tus 200 Contactos
              </h2>
              <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
                Nuestro validador audita fila por fila tu archivo Excel o CSV.{" "}
                <strong className="text-slate-900">
                  Cualquier fila que no cumpla con TODOS los requisitos
                  obligatorios será excluida automáticamente
                </strong>{" "}
                y el sistema te informará cuántos contactos te faltan para
                completar los 200 requeridos.
              </p>

              <div className="space-y-2.5 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="font-bold text-slate-900">
                    1. Nombre Completo (Obligatorio)
                  </div>
                  <div className="text-slate-600">
                    Nombre y apellido del prospecto o referidor.
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="font-bold text-slate-900">
                    2. Teléfono Celular a 10 Dígitos (Obligatorio)
                  </div>
                  <div className="text-slate-600">
                    Es forzoso que cada registro tenga número telefónico válido
                    de 10 dígitos para el contacto.
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="font-bold text-slate-900">
                    3. Relación con el Agente (Obligatorio)
                  </div>
                  <div className="text-slate-600">
                    Ej. Amigo de universidad, Familiar, Ex compañero de trabajo,
                    Referido, Vecino.
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="font-bold text-slate-900">
                    4. Sueldo Mensual Estimado (Obligatorio &gt; $0)
                  </div>
                  <div className="text-slate-600">
                    Ingreso mensual aproximado en pesos (ej. 45000).
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="font-bold text-slate-900">
                    5. Probabilidad de Cierre (Obligatorio)
                  </div>
                  <div className="text-slate-600">
                    Valores permitidos: <strong>Alta</strong>,{" "}
                    <strong>Media</strong> o <strong>Baja</strong>.
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-sm transition"
              >
                <Download className="h-4 w-4" />
                Descargar Plantilla Oficial (.xlsx)
              </button>
            </div>

            {/* Zona de Carga y Reporte de Auditoría */}
            <div className="lg:col-span-7 space-y-5">
              <div className="bg-white rounded-3xl border-2 border-dashed border-indigo-300 hover:border-indigo-500 p-8 text-center transition space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                  <Upload className="h-8 w-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-slate-900">
                    Sube tu archivo Excel (.xlsx) o CSV (.csv)
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Puedes subir tu archivo en una sola carga o en varias
                    entregas hasta alcanzar y superar tus 200 contactos válidos.
                  </p>
                </div>

                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="proyecto200-file-upload"
                  />
                  <label
                    htmlFor="proyecto200-file-upload"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm cursor-pointer shadow-md shadow-indigo-500/20 transition"
                  >
                    <Upload className="h-4 w-4" />
                    {isUploadingFile
                      ? "Validando filas y teléfonos..."
                      : "Seleccionar Archivo Excel / CSV"}
                  </label>
                </div>
              </div>

              {/* Resultado del Validador Inteligente */}
              {importReport && (
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
                    <div>
                      <h3 className="text-lg font-black text-slate-900">
                        Dictamen del Validador Inteligente
                      </h3>
                      <p className="text-xs text-slate-600">
                        {importReport.message}
                      </p>
                    </div>
                    {importReport.hasReached200 ? (
                      <span className="px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-black">
                        ✅ Meta de 200 Contactos Completada (
                        {importReport.totalValidContactsInDb}/200)
                      </span>
                    ) : (
                      <span className="px-3 py-1.5 rounded-xl bg-amber-100 text-amber-900 text-xs font-black">
                        ⚠️ Te faltan {importReport.missingFor200} contactos para
                        los 200
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200">
                      <div className="text-xs font-bold text-emerald-800">
                        Importados Válidos
                      </div>
                      <div className="text-2xl font-black text-emerald-950">
                        {importReport.importedCount}
                      </div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200">
                      <div className="text-xs font-bold text-rose-800">
                        Filas Excluidas
                      </div>
                      <div className="text-2xl font-black text-rose-950">
                        {importReport.excludedCount}
                      </div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200">
                      <div className="text-xs font-bold text-indigo-800">
                        Acumulado Válido
                      </div>
                      <div className="text-2xl font-black text-indigo-950">
                        {importReport.totalValidContactsInDb} / 200
                      </div>
                    </div>
                  </div>

                  {!importReport.hasReached200 && (
                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-xs text-amber-950 flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="font-black block mb-0.5">
                          Aún no alcanzas los 200 contactos obligatorios para
                          iniciar el programa:
                        </strong>
                        Actualmente cuentas con{" "}
                        <strong>
                          {importReport.totalValidContactsInDb} contactos
                          válidos
                        </strong>
                        . Te faltan{" "}
                        <strong className="underline">
                          {importReport.missingFor200} contactos completos
                        </strong>{" "}
                        (con nombre, teléfono de 10 dígitos, relación, sueldo
                        estimado y probabilidad). Corrige las filas excluidas y
                        vuelve a subirlas.
                      </div>
                    </div>
                  )}

                  {importReport.excludedRows &&
                    importReport.excludedRows.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-black uppercase tracking-wider text-rose-700">
                          Detalle de Filas Excluidas por Datos Incompletos (
                          {importReport.excludedRows.length}):
                        </h4>
                        <div className="max-h-60 overflow-y-auto rounded-2xl border border-rose-200 divide-y divide-rose-100">
                          {importReport.excludedRows.map(
                            (ex: any, idx: number) => (
                              <div
                                key={idx}
                                className="p-3 bg-rose-50/40 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                              >
                                <div>
                                  <span className="font-black text-rose-900">
                                    Fila #{ex.rowNumber}:
                                  </span>{" "}
                                  <span className="font-semibold text-slate-800">
                                    {ex.fullName}
                                  </span>
                                </div>
                                <div className="text-rose-700 font-medium">
                                  Motivo de exclusión:{" "}
                                  <strong>{ex.reasons.join(" | ")}</strong>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 4: MIS ESTADÍSTICAS Y EMBUDO DE CONVERSIÓN
      ===================================================================== */}
      {activeTab === "estadisticas" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="text-xs font-bold uppercase text-slate-400">
                Valor de Mercado (Sueldos)
              </div>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {formatCurrencyMXN(stats.estimatedMarketValue)}
              </div>
              <div className="text-xs text-emerald-700 font-bold mt-1">
                Potencial de ahorro (10%):{" "}
                {formatCurrencyMXN(stats.estimatedMonthlySavingsPotential)}/mes
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="text-xs font-bold uppercase text-slate-400">
                Composición del Inventario
              </div>
              <div className="text-2xl font-black text-indigo-700 mt-1">
                {stats.prospectosCount} Prospectos
              </div>
              <div className="text-xs text-slate-600 font-semibold mt-1">
                {stats.referidoresCount} Referidores •{" "}
                {stats.descalificadosCount} Descalificados
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="text-xs font-bold uppercase text-slate-400">
                Citas Agendadas
              </div>
              <div className="text-2xl font-black text-emerald-600 mt-1">
                {stats.citasAgendadasCount} Citas
              </div>
              <div className="text-xs text-slate-600 font-semibold mt-1">
                {stats.enSeguimientoCount} en seguimiento activo
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="text-xs font-bold uppercase text-slate-400">
                Actividad Telefónica
              </div>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {stats.totalAttempts} Toques
              </div>
              <div className="text-xs text-slate-600 font-semibold mt-1">
                {stats.porContactarCount} pendientes por primer toque
              </div>
            </div>
          </div>

          {/* Bitácora Reciente del Agente */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-base font-black text-slate-900">
              Mi Bitácora Reciente de Ejecución en Proyecto 200
            </h3>
            {recentLogs.length === 0 ? (
              <p className="text-sm text-slate-500">
                Aún no hay actividad registrada. Inicia tu sesión en Piloto
                Automático.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentLogs.map((log: any) => (
                  <div
                    key={log.id}
                    className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900">
                        {log.contact?.fullName || "Contacto"}
                      </span>{" "}
                      —{" "}
                      <span className="text-slate-700 font-medium">
                        {log.outcome}
                      </span>
                      {log.notes && (
                        <span className="text-slate-500 italic ml-2">
                          «{log.notes}»
                        </span>
                      )}
                    </div>
                    <span className="text-slate-400 font-mono">
                      {formatDateTime(log.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 5: DASHBOARD EJECUTIVO DE PROMOTORÍA (ADMIN / SUPER_ADMIN)
      ===================================================================== */}
      {activeTab === "admin" && isAdmin && (
        <div className="space-y-6">
          {/* Banner Ejecutivo */}
          <div className="rounded-3xl bg-slate-900 text-white p-6 border border-amber-400/30 shadow-lg space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 text-amber-400 text-xs font-black uppercase tracking-wider mb-1">
                  <Crown className="h-4 w-4" />
                  Torre de Control Ejecutiva — {currentUser.agencyName}
                </div>
                <h2 className="text-xl md:text-2xl font-black">
                  Auditoría Integral de Proyecto 200 por Agente y Contacto
                </h2>
                <p className="text-xs text-slate-300">
                  Supervisa cuántos agentes ya completaron sus 200 contactos,
                  audita el estatus de cada prospecto y revisa los motivos de
                  descalificación en tiempo real.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAdminSubView("agentes")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                    adminSubView === "agentes"
                      ? "bg-amber-400 text-slate-950"
                      : "bg-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  Resumen por Agente
                </button>
                <button
                  type="button"
                  onClick={() => setAdminSubView("contactos")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                    adminSubView === "contactos"
                      ? "bg-amber-400 text-slate-950"
                      : "bg-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  Detalle de Contactos ({adminData?.allContacts?.length || 0})
                </button>
                <button
                  type="button"
                  onClick={() => setAdminSubView("bitacora")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                    adminSubView === "bitacora"
                      ? "bg-amber-400 text-slate-950"
                      : "bg-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  Bitácora en Vivo
                </button>
              </div>
            </div>

            {/* KPIs Ejecutivos de la Promotoría */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5">
                <div className="text-[11px] text-slate-400 font-bold uppercase">
                  Agentes Activos
                </div>
                <div className="text-2xl font-black text-white mt-0.5">
                  {adminExecutiveKpis.totalAgents}
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5">
                <div className="text-[11px] text-amber-300 font-bold uppercase">
                  Inventario 200 Listo
                </div>
                <div className="text-2xl font-black text-emerald-400 mt-0.5">
                  {adminExecutiveKpis.agentsAt200} /{" "}
                  {adminExecutiveKpis.totalAgents}
                </div>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-400/30 rounded-2xl p-3.5">
                <div className="text-[11px] text-emerald-300 font-bold uppercase">
                  ⛽ Tanque Lleno (≥100 Calif.)
                </div>
                <div className="text-2xl font-black text-emerald-400 mt-0.5">
                  {adminExecutiveKpis.agentsOptimalFuel} /{" "}
                  {adminExecutiveKpis.totalAgents}
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5">
                <div className="text-[11px] text-indigo-300 font-bold uppercase">
                  Calificados Vivos / Total
                </div>
                <div className="text-2xl font-black text-white mt-0.5">
                  {adminExecutiveKpis.totalQualified}{" "}
                  <span className="text-xs font-semibold text-slate-400">
                    / {adminExecutiveKpis.totalContacts}
                  </span>
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5">
                <div className="text-[11px] text-emerald-300 font-bold uppercase">
                  Citas Agendadas
                </div>
                <div className="text-2xl font-black text-emerald-400 mt-0.5">
                  {adminExecutiveKpis.totalCitas}
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5">
                <div className="text-[11px] text-rose-300 font-bold uppercase">
                  Quemados / Descalif.
                </div>
                <div className="text-2xl font-black text-rose-400 mt-0.5">
                  {adminExecutiveKpis.totalDescalificados}
                </div>
              </div>
            </div>
          </div>

          {/* Subvista 1: Tablero de Tanques de Gasolina + Tabla Ejecutiva por Agente */}
          {adminSubView === "agentes" && (
            <div className="space-y-6">
              {/* TABLERO VISUAL DE TANQUES DE GASOLINA COMERCIAL POR ASESOR */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 md:p-6 space-y-5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[11px] font-black uppercase tracking-wider">
                      <Flame className="h-3.5 w-3.5 text-amber-600" />
                      Metodología LIMRA / MDRT 200 Totales · 100 Calificados Vivos
                    </div>
                    <h3 className="text-lg font-black text-slate-900">
                      ⛽ Tanques de Gasolina Comercial por Asesor (Ritmo y Combustible Activo)
                    </h3>
                    <p className="text-xs text-slate-600 max-w-3xl">
                      Todo asesor debe tener <strong>200 prospectos registrados</strong>, pero su ritmo real depende de mantener siempre al menos{" "}
                      <strong className="text-emerald-700">100 prospectos calificados (no descalificados)</strong> combinando{" "}
                      <span className="font-bold text-indigo-700">Contactos Base</span> +{" "}
                      <span className="font-bold text-amber-700">Referidos (Octanaje Premium)</span>. Si el tanque baja de 65 calificados, debe recargar pidiendo referidos de inmediato.
                    </p>
                  </div>

                  {/* Leyenda de Semáforo de Gasolina + Botón Gestionar Agentes Visibles */}
                  <div className="flex flex-col items-start lg:items-end gap-2.5">
                    <button
                      type="button"
                      onClick={() =>
                        setShowAgentVisibilityDrawer((prev) => !prev)
                      }
                      className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black border transition shadow-xs ${
                        showAgentVisibilityDrawer
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-indigo-50 hover:bg-indigo-100 text-indigo-950 border-indigo-200"
                      }`}
                    >
                      <SlidersHorizontal className="h-3.5 w-3.5" />
                      Gestionar Agentes Visibles ({visibleAgentSummaries.length} en seguimiento
                      {hiddenAgentIds.length > 0
                        ? ` · ${hiddenAgentIds.length} ocultos`
                        : ""}
                      )
                    </button>

                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                        ≥100 Óptimo (4-5 sem)
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 text-amber-800 border border-amber-200">
                        <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                        65–99 Medio (Recargar)
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-orange-50 text-orange-800 border border-orange-200">
                        <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
                        35–64 Reserva (&lt;10 días)
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-50 text-rose-800 border border-rose-200">
                        <span className="h-2.5 w-2.5 rounded-full bg-rose-600" />
                        &lt;35 Peligro de Paro
                      </span>
                    </div>
                  </div>
                </div>

                {/* Gaveta Desplegable para Activar / Desactivar Agentes del Tablero de Seguimiento */}
                {showAgentVisibilityDrawer && (
                  <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                          Selector de Agentes en Seguimiento Cercano (Proyecto 200)
                        </h4>
                        <p className="text-xs text-slate-600">
                          Los agentes desactivados aquí <strong>conservan su cuenta activa</strong> en la plataforma, pero se ocultan del Tablero de Tanques de Gasolina y no alteran los KPIs de tu promotoría hasta que decidas volver a activarlos.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowAgentVisibilityDrawer(false)}
                        className="text-xs font-bold text-slate-500 hover:text-slate-900 self-end sm:self-center"
                      >
                        Cerrar panel ✕
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
                      {(adminData?.agentSummaries || []).map((ag: any) => {
                        const isHidden = hiddenAgentIds.includes(ag.agentId);
                        const isBusy = togglingAgentId === ag.agentId;
                        return (
                          <div
                            key={ag.agentId}
                            className={`flex items-center justify-between gap-2 p-2.5 rounded-xl border transition ${
                              isHidden
                                ? "bg-slate-100/80 border-slate-200 opacity-75"
                                : "bg-white border-emerald-200 shadow-2xs"
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-900 truncate">
                                {ag.name}
                              </div>
                              <div className="text-[10px] text-slate-500 truncate">
                                {ag.totalContacts}/200 contactos ·{" "}
                                {ag.qualifiedCount ??
                                  ag.prospectosCount + ag.referidoresCount}{" "}
                                calificados
                              </div>
                            </div>
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() =>
                                handleToggleAgentTracking(ag.agentId, !isHidden)
                              }
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-black transition shrink-0 ${
                                isHidden
                                  ? "bg-slate-200 hover:bg-emerald-600 text-slate-700 hover:text-white"
                                  : "bg-emerald-100 hover:bg-rose-100 text-emerald-900 hover:text-rose-800 border border-emerald-300"
                              }`}
                            >
                              {isHidden ? (
                                <>
                                  <Eye className="h-3 w-3" /> Activar
                                </>
                              ) : (
                                <>
                                  <EyeOff className="h-3 w-3" /> Ocultar
                                </>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Grid de Tanques por Asesor */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {visibleAgentSummaries.map((ag: any) => {
                    const qualifiedCount =
                      ag.qualifiedCount ??
                      ag.prospectosCount + ag.referidoresCount;
                    const referralsCount =
                      ag.referralsOriginCount ?? ag.referidoresCount;
                    const baseCount =
                      ag.baseContactsCount ??
                      Math.max(0, qualifiedCount - referralsCount);
                    const disqualifiedCount = ag.descalificadosCount || 0;
                    const fuelPct = Math.min(
                      100,
                      Math.round((qualifiedCount / 100) * 100)
                    );

                    const isOptimal = qualifiedCount >= 100;
                    const isMedium =
                      qualifiedCount >= 65 && qualifiedCount < 100;
                    const isReserve =
                      qualifiedCount >= 35 && qualifiedCount < 65;

                    const cardBorder = isOptimal
                      ? "border-emerald-200 bg-gradient-to-br from-emerald-50/40 via-white to-white"
                      : isMedium
                      ? "border-amber-200 bg-gradient-to-br from-amber-50/40 via-white to-white"
                      : isReserve
                      ? "border-orange-300 bg-gradient-to-br from-orange-50/50 via-white to-white"
                      : "border-rose-300 bg-gradient-to-br from-rose-50/60 via-white to-white";

                    const tankFillStyle = isOptimal
                      ? "bg-gradient-to-t from-emerald-600 via-emerald-500 to-teal-400"
                      : isMedium
                      ? "bg-gradient-to-t from-amber-600 via-amber-500 to-yellow-400"
                      : isReserve
                      ? "bg-gradient-to-t from-orange-600 via-orange-500 to-amber-400"
                      : "bg-gradient-to-t from-rose-700 via-rose-600 to-orange-500";

                    const badgeStyle = isOptimal
                      ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                      : isMedium
                      ? "bg-amber-100 text-amber-900 border-amber-300"
                      : isReserve
                      ? "bg-orange-100 text-orange-900 border-orange-300"
                      : "bg-rose-100 text-rose-900 border-rose-300 animate-pulse";

                    const statusText = isOptimal
                      ? "🟢 Tanque Lleno · Ritmo Sano (4–5 sem)"
                      : isMedium
                      ? `🟡 Medio Tanque · Faltan ${100 - qualifiedCount} calif.`
                      : isReserve
                      ? `🟠 En Reserva (<10 días) · Urgente +${100 - qualifiedCount} ref.`
                      : `🔴 ¡Peligro de Paro! Solo ${qualifiedCount} calificados`;

                    // Porcentajes sobre la meta de 200 para la barra de composición de contactos + referidos
                    const baseBarPct = Math.min(
                      100,
                      Math.round((baseCount / 200) * 100)
                    );
                    const refBarPct = Math.min(
                      100 - baseBarPct,
                      Math.round((referralsCount / 200) * 100)
                    );
                    const disqBarPct = Math.min(
                      100 - baseBarPct - refBarPct,
                      Math.round((disqualifiedCount / 200) * 100)
                    );

                    const totalLoggedTouches =
                      (ag.phoneTouchesCount || 0) +
                      (ag.whatsappTouchesCount || 0);
                    const waRatio = ag.whatsappRatioPct || 0;
                    const phoneRatio =
                      totalLoggedTouches > 0 ? 100 - waRatio : 100;
                    const hasExcessWhatsapp =
                      totalLoggedTouches >= 3 && waRatio > 30;

                    return (
                      <div
                        key={ag.agentId}
                        className={`rounded-2xl border p-4 shadow-xs transition hover:shadow-md flex flex-col justify-between gap-3.5 ${cardBorder}`}
                      >
                        {/* Encabezado de Asesor + Tanque Vertical Visual */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-black text-slate-900 truncate">
                                {ag.name}
                              </h4>
                              {ag.hasReached200 && (
                                <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-black">
                                  200/200
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 truncate">
                              {ag.email}
                            </p>
                            <div className="mt-2">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black border ${badgeStyle}`}
                              >
                                {statusText}
                              </span>
                            </div>
                          </div>

                          {/* Cilindro Visual de Tanque de Gasolina */}
                          <div className="flex flex-col items-center shrink-0">
                            <div className="w-5 h-1.5 bg-slate-300 rounded-t-sm" />
                            <div className="relative w-12 h-20 rounded-xl border-2 border-slate-700 bg-slate-900 overflow-hidden flex flex-col justify-end shadow-inner">
                              {/* Marcas de medición del tanque (Full, 3/4, 1/2, R) */}
                              <div className="absolute inset-x-0 top-[25%] border-t border-dashed border-white/20 z-10" />
                              <div className="absolute inset-x-0 top-[50%] border-t border-dashed border-white/25 z-10" />
                              <div className="absolute inset-x-0 top-[75%] border-t border-dashed border-rose-400/40 z-10" />
                              <div
                                className={`w-full transition-all duration-700 ${tankFillStyle}`}
                                style={{ height: `${Math.max(6, fuelPct)}%` }}
                              />
                              <div className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none">
                                <span className="text-xs font-black text-white drop-shadow">
                                  {fuelPct}%
                                </span>
                                <span className="text-[9px] font-bold text-white/80 uppercase">
                                  {qualifiedCount}/100
                                </span>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold text-slate-500 mt-1">
                              Calificados
                            </span>
                          </div>
                        </div>

                        {/* Barra de Composición: Contactos Base vs Referidos vs Descalificados (sobre 200) */}
                        <div className="space-y-1.5 bg-white/90 rounded-xl p-3 border border-slate-200/80">
                          <div className="flex items-center justify-between text-[11px] font-bold">
                            <span className="text-slate-700">
                              Composición de Inventario ({ag.totalContacts} / 200)
                            </span>
                            <span className="text-emerald-700 font-black">
                              {qualifiedCount} Vivos · {disqualifiedCount} Quemados
                            </span>
                          </div>

                          {/* Barra apilada de Contactos + Referidos + Quemados */}
                          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
                            {baseBarPct > 0 && (
                              <div
                                className="h-full bg-indigo-600 transition-all"
                                style={{ width: `${baseBarPct}%` }}
                                title={`Contactos Base Calificados: ${baseCount}`}
                              />
                            )}
                            {refBarPct > 0 && (
                              <div
                                className="h-full bg-amber-500 transition-all"
                                style={{ width: `${refBarPct}%` }}
                                title={`Referidos y Centros de Influencia: ${referralsCount}`}
                              />
                            )}
                            {disqBarPct > 0 && (
                              <div
                                className="h-full bg-rose-400 transition-all"
                                style={{ width: `${disqBarPct}%` }}
                                title={`Descalificados (Quemados): ${disqualifiedCount}`}
                              />
                            )}
                          </div>

                          <div className="grid grid-cols-4 gap-1 pt-1 text-[10px] font-bold">
                            <div className="flex items-center gap-1 text-indigo-900">
                              <span className="h-2 w-2 rounded-full bg-indigo-600 shrink-0" />
                              Base: <strong>{baseCount}</strong>
                            </div>
                            <div className="flex items-center gap-1 text-amber-900">
                              <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                              Ref.: <strong>{referralsCount}</strong>
                            </div>
                            <div className="flex items-center gap-1 text-purple-900">
                              <span className="h-2 w-2 rounded-full bg-purple-500 shrink-0" />
                              Futuro:{" "}
                              <strong>
                                {ag.recordatoriosProgramadosCount || 0}
                              </strong>
                            </div>
                            <div className="flex items-center gap-1 text-rose-800">
                              <span className="h-2 w-2 rounded-full bg-rose-400 shrink-0" />
                              Descalif.: <strong>{disqualifiedCount}</strong>
                            </div>
                          </div>
                        </div>

                        {/* Pie de Tarjeta: Ratio Teléfono vs WhatsApp + Botón Auditar */}
                        <div className="flex items-center justify-between gap-2 pt-1">
                          <div className="text-[11px]">
                            {totalLoggedTouches > 0 ? (
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg font-bold ${
                                  hasExcessWhatsapp
                                    ? "bg-rose-100 text-rose-800 border border-rose-200"
                                    : "bg-slate-100 text-slate-700"
                                }`}
                              >
                                📞 {phoneRatio}% Tel · 💬 {waRatio}% WA
                                {hasExcessWhatsapp && " ⚠️ Exceso WA"}
                              </span>
                            ) : (
                              <span className="text-slate-400 font-semibold">
                                Sin llamadas registradas aún
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() =>
                                handleToggleAgentTracking(ag.agentId, true)
                              }
                              title="Ocultar asesor de este tablero de seguimiento (conserva su cuenta activa)"
                              className="inline-flex items-center gap-1 px-2 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-800 text-[11px] font-bold transition"
                            >
                              <EyeOff className="h-3 w-3" /> Ocultar del seguimiento
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setAdminSelectedAgentId(ag.agentId);
                                setAdminSubView("contactos");
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white text-[11px] font-bold transition"
                            >
                              <Eye className="h-3 w-3" /> Auditar ({ag.citasAgendadasCount} citas)
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tabla Ejecutiva Detallada */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Rendimiento y Avance hacia los 200 Contactos por Agente
                  </h3>
                  <p className="text-xs text-slate-500">
                    Haz clic en «Auditar Contactos» en cualquier agente para
                    inspeccionar sus prospectos, estatus y motivos de
                    descalificación.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black uppercase tracking-wider text-slate-500">
                      <th className="py-3.5 px-4">Agente</th>
                      <th className="py-3.5 px-4">Progreso Meta 200</th>
                      <th className="py-3.5 px-4">Prospectos</th>
                      <th className="py-3.5 px-4">Referidores</th>
                      <th className="py-3.5 px-4">Descalificados</th>
                      <th className="py-3.5 px-4">Citas Agendadas</th>
                      <th className="py-3.5 px-4">Toques / Llamadas</th>
                      <th className="py-3.5 px-4">Última Actividad</th>
                      <th className="py-3.5 px-4 text-right">Nivel Detalle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {visibleAgentSummaries.map((ag: any) => {
                      const pct = Math.min(
                        100,
                        Math.round((ag.totalContacts / 200) * 100)
                      );
                      return (
                        <tr
                          key={ag.agentId}
                          className="hover:bg-slate-50/80 transition"
                        >
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900">
                              {ag.name}
                            </div>
                            <div className="text-xs text-slate-500">
                              {ag.email}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 min-w-[200px]">
                            <div className="flex items-center justify-between text-xs font-bold mb-1">
                              <span>{ag.totalContacts} / 200</span>
                              {ag.hasReached200 ? (
                                <span className="text-emerald-600">
                                  ¡Completo!
                                </span>
                              ) : (
                                <span className="text-amber-600">
                                  Faltan {ag.missingFor200}
                                </span>
                              )}
                            </div>
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  ag.hasReached200
                                    ? "bg-emerald-500"
                                    : "bg-indigo-600"
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-indigo-700">
                            {ag.prospectosCount}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-purple-700">
                            {ag.referidoresCount}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-rose-600">
                            {ag.descalificadosCount}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black">
                              {ag.citasAgendadasCount} citas
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-800">
                            {ag.totalAttempts}
                          </td>
                          <td className="py-3.5 px-4 text-xs text-slate-500">
                            {formatDateTime(ag.lastActivityAt)}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="inline-flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  handleToggleAgentTracking(ag.agentId, true)
                                }
                                title="Ocultar del seguimiento (mantiene su cuenta activa)"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-800 text-xs font-bold transition"
                              >
                                <EyeOff className="h-3.5 w-3.5" /> Ocultar del seguimiento
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setAdminSelectedAgentId(ag.agentId);
                                  setAdminSubView("contactos");
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white text-xs font-bold transition"
                              >
                                <Eye className="h-3.5 w-3.5" /> Auditar Contactos
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              </div>
            </div>
          )}

          {/* Subvista 2: Nivel de Detalle Granular de Todos los Contactos */}
          {adminSubView === "contactos" && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={adminSelectedAgentId}
                    onChange={(e) => setAdminSelectedAgentId(e.target.value)}
                    className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold text-slate-900 bg-amber-50/60"
                  >
                    <option value="ALL">
                      👥 Todos los Agentes de la Promotoría
                    </option>
                    {(adminData?.agentSummaries || []).map((ag: any) => (
                      <option key={ag.agentId} value={ag.agentId}>
                        {ag.name} ({ag.totalContacts}/200 contactos)
                      </option>
                    ))}
                  </select>

                  <select
                    value={adminFilterClass}
                    onChange={(e) => setAdminFilterClass(e.target.value)}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700"
                  >
                    <option value="ALL">Todas las Clasificaciones</option>
                    <option value="PROSPECTO">Prospectos</option>
                    <option value="REFERIDOR">Referidores</option>
                    <option value="DESCALIFICADO">Descalificados</option>
                  </select>

                  <select
                    value={adminFilterStatus}
                    onChange={(e) => setAdminFilterStatus(e.target.value)}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700"
                  >
                    <option value="ALL">Todos los Estatus</option>
                    <option value="POR_CONTACTAR">🆕 Por Contactar</option>
                    <option value="EN_SEGUIMIENTO">⏳ En Seguimiento</option>
                    <option value="RECORDATORIO_PROGRAMADO">
                      ⏰ Recordatorio Programado
                    </option>
                    <option value="CITA_AGENDADA">📅 Cita Agendada</option>
                    <option value="DESCARTADO">🚫 Descartado</option>
                  </select>
                </div>

                <div className="relative min-w-[260px]">
                  <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={adminSearch}
                    onChange={(e) => setAdminSearch(e.target.value)}
                    placeholder="Buscar contacto, teléfono o agente..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black uppercase tracking-wider text-slate-500">
                        <th className="py-3.5 px-4">Agente Propietario</th>
                        <th className="py-3.5 px-4">Contacto y Teléfono</th>
                        <th className="py-3.5 px-4">Relación / Sueldo Est.</th>
                        <th className="py-3.5 px-4">Probabilidad / Prioridad</th>
                        <th className="py-3.5 px-4">
                          Clasificación y Motivo Descalificación
                        </th>
                        <th className="py-3.5 px-4">Estatus y Toques</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {filteredAdminContacts.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="py-12 text-center text-slate-500 text-sm"
                          >
                            No hay contactos registrados para este filtro.
                          </td>
                        </tr>
                      ) : (
                        filteredAdminContacts.map((c: any) => (
                          <tr
                            key={c.id}
                            className="hover:bg-slate-50/80 transition"
                          >
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-slate-900 text-xs">
                                {c.user?.name || c.user?.email || "Agente"}
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <button
                                type="button"
                                onClick={() => openContactHistoryModal(c, "NOTA")}
                                className="text-left group focus:outline-none"
                                title="Haz clic para abrir el Expediente 360° y Bitácora de este contacto"
                              >
                                <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition flex items-center gap-1.5">
                                  <span className="underline decoration-slate-300 group-hover:decoration-indigo-500 underline-offset-2">
                                    {c.fullName}
                                  </span>
                                  <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[10px] font-black">
                                    📋 {c.logs?.length || 0}
                                  </span>
                                </div>
                                <div className="text-xs text-slate-500 font-mono">
                                  📞 {c.phone}
                                </div>
                                {c.notes && (
                                  <div className="mt-1 text-[11px] text-slate-600 bg-amber-50/70 border border-amber-200/70 rounded-lg px-2 py-0.5 max-w-xs truncate italic">
                                    💬 «{c.notes}»
                                  </div>
                                )}
                              </button>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="text-xs font-semibold text-slate-800">
                                {c.relationship}
                              </div>
                              <div className="text-xs font-bold text-emerald-700">
                                {formatCurrencyMXN(c.estimatedSalary)}/mes
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="px-2 py-0.5 rounded bg-slate-900 text-white text-[11px] font-bold mr-1.5">
                                {c.priorityScore} pts
                              </span>
                              <span className="text-xs font-bold text-slate-700">
                                Prob. {c.closingProbability}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                  c.classification === "DESCALIFICADO"
                                    ? "bg-rose-100 text-rose-800"
                                    : c.classification === "REFERIDOR"
                                    ? "bg-purple-100 text-purple-800"
                                    : "bg-indigo-100 text-indigo-800"
                                }`}
                              >
                                {c.classification}
                              </span>
                              {c.classification === "DESCALIFICADO" &&
                                c.disqualificationReason && (
                                  <div className="mt-1 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-2.5 py-1">
                                    <strong>Por qué se descalificó:</strong>{" "}
                                    {c.disqualificationReason}
                                  </div>
                                )}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="text-xs font-bold text-slate-900">
                                {c.status === "RECORDATORIO_PROGRAMADO"
                                  ? "⏰ Recordatorio Programado"
                                  : c.status}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {c.attemptsCount} intentos •{" "}
                                {c.status === "RECORDATORIO_PROGRAMADO" &&
                                c.nextActionAt
                                  ? `🔔 Toca llamar: ${formatDateTime(
                                      c.nextActionAt
                                    )}`
                                  : `Último: ${formatDateTime(c.lastAttemptAt)}`}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Subvista 3: Bitácora Cronológica de Actividad de todos los Agentes */}
          {adminSubView === "bitacora" && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h3 className="text-base font-black text-slate-900">
                  Bitácora de Actividad en Tiempo Real (Llamadas, Citas y
                  Descalificaciones)
                </h3>
                <select
                  value={adminSelectedAgentId}
                  onChange={(e) => setAdminSelectedAgentId(e.target.value)}
                  className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-900"
                >
                  <option value="ALL">Todos los Agentes</option>
                  {(adminData?.agentSummaries || []).map((ag: any) => (
                    <option key={ag.agentId} value={ag.agentId}>
                      {ag.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="divide-y divide-slate-100">
                {filteredAdminLogs.length === 0 ? (
                  <p className="text-sm text-slate-500 py-6 text-center">
                    Sin registros de actividad para este filtro.
                  </p>
                ) : (
                  filteredAdminLogs.map((log: any) => (
                    <div
                      key={log.id}
                      className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div>
                          <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-800 font-bold mr-2">
                            {log.user?.name || log.user?.email}
                          </span>
                          <span className="font-black text-slate-900">
                            {log.contact?.fullName || "Contacto"}
                          </span>{" "}
                          <span className="text-slate-400 font-mono">
                            ({log.contact?.phone})
                          </span>
                        </div>
                        <div className="text-slate-700 font-medium">
                          {log.outcome}
                          {log.notes && (
                            <span className="text-slate-500 italic ml-2">
                              — Nota: «{log.notes}»
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-slate-400 font-mono shrink-0">
                        {formatDateTime(log.createdAt)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          MODAL: NUEVO / EDITAR CONTACTO O INTEGRAR REFERIDO DE ENCUESTA
      ===================================================================== */}
      {contactModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900">
                {editingContact
                  ? "Editar Contacto de Proyecto 200"
                  : formSurveyReferralId
                  ? "Calificar e Integrar Referido de Encuesta"
                  : "Nuevo Contacto / Referido para Proyecto 200"}
              </h3>
              <button
                type="button"
                onClick={() => setContactModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSaveContactModal} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  value={formFullName}
                  onChange={(e) => setFormFullName(e.target.value)}
                  placeholder="Ej. Ing. Carlos Mendoza Ruiz"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Teléfono Celular (10 dígitos forzoso) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="5512345678"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Relación con el Agente *
                  </label>
                  <input
                    type="text"
                    required
                    value={formRelationship}
                    onChange={(e) => setFormRelationship(e.target.value)}
                    placeholder="Ej. Amigo, Familiar, Referido..."
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Sueldo Mensual Estimado (MXN) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={formSalary}
                    onChange={(e) => setFormSalary(e.target.value)}
                    placeholder="Ej. 55000"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Probabilidad de Cierre *
                  </label>
                  <select
                    value={formProbability}
                    onChange={(e) => setFormProbability(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-bold"
                  >
                    <option value="ALTA">🔥 Alta</option>
                    <option value="MEDIA">⚡ Media</option>
                    <option value="BAJA">❄️ Baja</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Clasificación en Proyecto 200 *
                </label>
                <select
                  value={formClassification}
                  onChange={(e) => setFormClassification(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-bold"
                >
                  <option value="PROSPECTO">🎯 Prospecto</option>
                  <option value="REFERIDOR">
                    🤝 Centro de Influencia / Referidor
                  </option>
                  <option value="DESCALIFICADO">
                    🚫 Descalificado (Requiere motivo forzoso)
                  </option>
                </select>
              </div>

              {formClassification === "DESCALIFICADO" && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-300 space-y-2">
                  <label className="block text-xs font-black text-rose-900">
                    Motivo de Descalificación (Obligatorio) *
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={formDisqReason}
                    onChange={(e) => setFormDisqReason(e.target.value)}
                    placeholder="Explica por qué se descalifica a este candidato..."
                    className="w-full rounded-xl border border-rose-300 bg-white px-3 py-2 text-xs"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Notas de Contexto (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Ocupación, hijos, metas o mejor horario para localizarlo..."
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setContactModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingContact}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-wider"
                >
                  {savingContact ? "Guardando..." : "Guardar en Proyecto 200"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: CANDADO FORZOSO AL DESCALIFICAR DESDE LA TABLA CRM
      ===================================================================== */}
      {crmDisqualifyContact && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border-2 border-rose-300 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5 text-rose-700">
                <ShieldAlert className="h-6 w-6 shrink-0" />
                <h3 className="text-base font-black">
                  Motivo Obligatorio de Descalificación
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCrmDisqualifyContact(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Para marcar a{" "}
              <strong className="text-slate-900">
                {crmDisqualifyContact.fullName}
              </strong>{" "}
              como <strong>Descalificado</strong> en tu Proyecto 200, es forzoso
              registrar la razón para estadísticas y auditoría de tu promotoría:
            </p>

            <form onSubmit={handleConfirmCrmDisqualify} className="space-y-3">
              <select
                value={crmDisqPreset}
                onChange={(e) => setCrmDisqPreset(e.target.value)}
                className="w-full rounded-xl border border-rose-300 bg-rose-50/40 px-3 py-2 text-xs font-bold text-slate-800"
              >
                <option value="">-- Selecciona un motivo frecuente --</option>
                {COMMON_DISQUALIFICATION_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
                <option value="OTRO">Otro motivo (especificar abajo)</option>
              </select>

              <textarea
                rows={3}
                value={crmDisqReason}
                onChange={(e) => setCrmDisqReason(e.target.value)}
                placeholder="Detalla el motivo por el cual se descalifica al candidato..."
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCrmDisqualifyContact(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingContact}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black"
                >
                  {savingContact
                    ? "Guardando..."
                    : "Confirmar Descalificación"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL EXPEDIENTE 360° Y BITÁCORA VIVA DEL PROSPECTO
      ===================================================================== */}
      {historyContact && (
        <div className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
            {/* Encabezado 360° del Prospecto */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 md:p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-full bg-indigo-500/30 border border-indigo-400/40 text-indigo-200 text-[10px] font-black uppercase tracking-wider">
                      Expediente 360° y Bitácora Viva
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black">
                      {historyContact.priorityScore} pts · Prob.{" "}
                      {historyContact.closingProbability}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-white/15 text-white text-[10px] font-bold">
                      {historyContact.classification}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-white">
                    {historyContact.fullName}
                  </h3>
                  <div className="text-xs text-slate-300 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <a
                      href={`tel:${historyContact.phone}`}
                      className="font-mono font-bold text-emerald-300 hover:underline"
                    >
                      📞 {historyContact.phone}
                    </a>
                    <span>• {historyContact.relationship}</span>
                    <span>
                      • Sueldo est.:{" "}
                      <strong className="text-white">
                        {formatCurrencyMXN(historyContact.estimatedSalary)}/mes
                      </strong>
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setHistoryContact(null)}
                  className="text-slate-400 hover:text-white transition"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              {/* Cinta de Estatus Actual / Fecha de Recordatorio o Cita + Acciones Rápidas */}
              <div className="mt-4 pt-3 border-t border-white/15 flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs">
                  {historyContact.status === "RECORDATORIO_PROGRAMADO" &&
                  historyContact.nextActionAt ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-400/20 border border-amber-400/40 text-amber-200 font-bold">
                      <Bell className="h-3.5 w-3.5 text-amber-300" />⏰
                      Recordatorio Programado:{" "}
                      {formatDateTime(historyContact.nextActionAt)}
                    </span>
                  ) : historyContact.status === "CITA_AGENDADA" &&
                    historyContact.scheduledMeetingAt ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 font-bold">
                      <Calendar className="h-3.5 w-3.5 text-emerald-300" />📅
                      Cita Agendada:{" "}
                      {formatDateTime(historyContact.scheduledMeetingAt)}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/10 text-slate-200 font-semibold">
                      Estatus: <strong>{historyContact.status}</strong> ·{" "}
                      {historyContact.attemptsCount || 0} toques
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {historyContact.classification !== "DESCALIFICADO" && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedQueueContactId(historyContact.id);
                        setHistoryContact(null);
                        setActiveTab("piloto");
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black transition"
                    >
                      <PhoneForwarded className="h-3.5 w-3.5" /> Atender en
                      Piloto
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      const target = historyContact;
                      setHistoryContact(null);
                      openEditContactModal(target);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition"
                  >
                    <Edit3 className="h-3.5 w-3.5" /> Editar Datos
                  </button>
                </div>
              </div>
            </div>

            {/* Cuerpo scrollable del Expediente 360° */}
            <div className="p-5 md:p-6 overflow-y-auto space-y-5 flex-1">
              {/* Bloque Interactivo: Registrar Comentario, Agendar Recordatorio Futuro o Cita */}
              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-700">
                    ¿Qué deseas registrar o programar para este prospecto?
                  </span>
                  <div className="inline-flex rounded-xl bg-slate-200/80 p-1 gap-1">
                    <button
                      type="button"
                      onClick={() => setDrawerMode("NOTA")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                        drawerMode === "NOTA"
                          ? "bg-slate-900 text-white shadow-2xs"
                          : "text-slate-700 hover:text-slate-900"
                      }`}
                    >
                      📝 Anotar Comentario
                    </button>
                    <button
                      type="button"
                      onClick={() => setDrawerMode("RECORDATORIO")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                        drawerMode === "RECORDATORIO"
                          ? "bg-indigo-600 text-white shadow-2xs"
                          : "text-slate-700 hover:text-indigo-900"
                      }`}
                    >
                      ⏰ Agendar Recordatorio
                    </button>
                    <button
                      type="button"
                      onClick={() => setDrawerMode("CITA")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                        drawerMode === "CITA"
                          ? "bg-emerald-600 text-white shadow-2xs"
                          : "text-slate-700 hover:text-emerald-900"
                      }`}
                    >
                      📅 Agendar Cita
                    </button>
                  </div>
                </div>

                <form onSubmit={handleSaveDrawerAction} className="space-y-3">
                  {drawerMode === "RECORDATORIO" && (
                    <div className="space-y-2.5 p-3 rounded-xl bg-indigo-50/80 border border-indigo-200">
                      <div className="text-[11px] font-bold text-indigo-950">
                        Atajos rápidos («Ahorita no, búscame en...»):
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setDrawerScheduledDate(computePresetDateString("1W"));
                            if (!drawerNoteInput) {
                              setDrawerNoteInput(
                                "Pidió que lo contacte en 1 semana."
                              );
                            }
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-indigo-100 border border-indigo-200 text-[11px] font-bold text-indigo-900 transition"
                        >
                          📅 En 1 semana
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDrawerScheduledDate(
                              computePresetDateString("15D")
                            );
                            if (!drawerNoteInput) {
                              setDrawerNoteInput(
                                "Pidió que le marque en 15 días (quincena)."
                              );
                            }
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-indigo-100 border border-indigo-200 text-[11px] font-bold text-indigo-900 transition"
                        >
                          📆 En 15 días
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDrawerScheduledDate(
                              computePresetDateString("NEXT_MONTH")
                            );
                            if (!drawerNoteInput) {
                              setDrawerNoteInput(
                                "Pidió hablar a inicios del próximo mes."
                              );
                            }
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-indigo-100 border border-indigo-200 text-[11px] font-bold text-indigo-900 transition"
                        >
                          🗓️ Próx. mes
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDrawerScheduledDate(computePresetDateString("DEC"));
                            if (!drawerNoteInput) {
                              setDrawerNoteInput(
                                "Me dijo «Ahorita no, búscame en diciembre con el aguinaldo»."
                              );
                            }
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 border border-amber-300 text-[11px] font-black text-amber-950 transition"
                        >
                          🎄 En Diciembre
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div>
                          <label className="block text-[11px] font-bold text-indigo-900 mb-1">
                            Fecha para Contactarlo *
                          </label>
                          <input
                            type="date"
                            required
                            value={drawerScheduledDate}
                            onChange={(e) =>
                              setDrawerScheduledDate(e.target.value)
                            }
                            className="w-full rounded-lg border border-indigo-300 bg-white px-2.5 py-1.5 text-xs font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-indigo-900 mb-1">
                            Hora del Recordatorio
                          </label>
                          <input
                            type="time"
                            value={drawerScheduledTime}
                            onChange={(e) =>
                              setDrawerScheduledTime(e.target.value)
                            }
                            className="w-full rounded-lg border border-indigo-300 bg-white px-2.5 py-1.5 text-xs font-bold"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {drawerMode === "CITA" && (
                    <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                      <div>
                        <label className="block text-[11px] font-bold text-emerald-900 mb-1">
                          Fecha de la Cita *
                        </label>
                        <input
                          type="date"
                          required
                          value={drawerScheduledDate}
                          onChange={(e) =>
                            setDrawerScheduledDate(e.target.value)
                          }
                          className="w-full rounded-lg border border-emerald-300 bg-white px-2.5 py-1.5 text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-emerald-900 mb-1">
                          Hora Acordada *
                        </label>
                        <input
                          type="time"
                          required
                          value={drawerScheduledTime}
                          onChange={(e) =>
                            setDrawerScheduledTime(e.target.value)
                          }
                          className="w-full rounded-lg border border-emerald-300 bg-white px-2.5 py-1.5 text-xs font-bold"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {drawerMode === "RECORDATORIO"
                        ? "¿Por qué pidió que lo busques en esa fecha y qué debes recordar? *"
                        : drawerMode === "CITA"
                        ? "Notas o acuerdos para la cita (opcional):"
                        : "Escribe tu nota o comentario para la bitácora (¿Qué sucedió?): *"}
                    </label>
                    <textarea
                      rows={2}
                      value={drawerNoteInput}
                      onChange={(e) => setDrawerNoteInput(e.target.value)}
                      placeholder={
                        drawerMode === "RECORDATORIO"
                          ? "Ej. Me pidió llamarle en diciembre cuando reciba su aguinaldo y fondo de ahorro..."
                          : "Ej. Platicamos hoy, está interesado en plan de retiro pero revisará presupuesto con su esposa..."
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={savingDrawerAction}
                      className={`px-4 py-2 rounded-xl text-white text-xs font-black uppercase tracking-wider transition shadow-xs ${
                        drawerMode === "RECORDATORIO"
                          ? "bg-indigo-600 hover:bg-indigo-700"
                          : drawerMode === "CITA"
                          ? "bg-emerald-600 hover:bg-emerald-700"
                          : "bg-slate-900 hover:bg-slate-800"
                      }`}
                    >
                      {savingDrawerAction
                        ? "Guardando..."
                        : drawerMode === "RECORDATORIO"
                        ? "⏰ Guardar Recordatorio en Bitácora"
                        : drawerMode === "CITA"
                        ? "📅 Confirmar Cita Agendada"
                        : "📝 Guardar Comentario en Bitácora"}
                    </button>
                  </div>
                </form>
              </div>

              {/* Resumen de Notas Acumuladas */}
              {historyContact.notes && (
                <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200 text-xs text-amber-950 space-y-1">
                  <div className="font-black uppercase tracking-wider text-[10px] text-amber-800">
                    Resumen de Notas y Contexto del Prospecto:
                  </div>
                  <div className="leading-relaxed font-medium">
                    {historyContact.notes}
                  </div>
                </div>
              )}

              {/* Línea de Tiempo Cronológica — Bitácora Histórica Completa */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-black uppercase tracking-wider text-slate-500">
                    Línea de Tiempo Cronológica ({historyContact.logs?.length || 0}{" "}
                    registros en bitácora)
                  </div>
                </div>

                {!historyContact.logs || historyContact.logs.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-500">
                    Aún no se han registrado llamadas ni notas en la bitácora de
                    este prospecto. Usa el panel superior para anotar un
                    comentario o programar un recordatorio.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {historyContact.logs.map((l: any) => {
                      const isReminder =
                        l.actionType === "RECORDATORIO_PROGRAMADO";
                      const isCita = l.actionType === "CITA_AGENDADA";
                      const isNote = l.actionType === "NOTA_BITACORA";
                      const isDisq = l.actionType === "DESCALIFICAR";

                      const badgeClass = isCita
                        ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                        : isReminder
                        ? "bg-indigo-100 text-indigo-900 border-indigo-300"
                        : isNote
                        ? "bg-amber-100 text-amber-900 border-amber-300"
                        : isDisq
                        ? "bg-rose-100 text-rose-900 border-rose-300"
                        : "bg-slate-100 text-slate-800 border-slate-200";

                      return (
                        <div
                          key={l.id}
                          className="p-3.5 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-1.5 text-xs"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${badgeClass}`}
                            >
                              {l.actionType}
                            </span>
                            <span className="text-slate-400 font-mono text-[11px]">
                              {formatDateTime(l.createdAt)}
                            </span>
                          </div>
                          <div className="font-semibold text-slate-800">
                            {l.outcome}
                          </div>
                          {l.notes && (
                            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-700 italic">
                              «{l.notes}»
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
