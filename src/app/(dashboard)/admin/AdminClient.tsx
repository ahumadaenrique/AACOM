"use client"

import React, { useState, useEffect } from "react"
import { getCotizaciones, saveUdiSetting, getUdiSetting, getAgents, createAgent, deleteAgent, getAdnDiagnostics, createAgentUser, getUsers, updateUserPassword, toggleUserActiveStatus, deleteUser, toggleAdnDiagnosticClosedStatus, getAnnouncements, createAnnouncement, toggleAnnouncementActiveStatus, deleteAnnouncement, getAdminActivityReport, updateAgentProfile, deleteActivityLogEntry, getCurrentUser, sendAdminPushNotification, createRankingAd, getMonthlyAdnRankings, getAdminSettings, toggleAdminSetting, getScheduledPushes, createScheduledPush, deleteScheduledPush } from "@/app/actions"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import BibliotecaAdmin from "./BibliotecaAdmin"
import { AdminPollManager } from "./AdminPollManager"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { 
  FileSpreadsheet, Award,
  Search, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Calendar, 
  ShieldCheck, 
  FilterX, 
  RefreshCw,
  Lock,
  Coins,
  CheckCircle2,
  BarChart3,
  BookOpen,
  Eye,
  Download,
  X,
  Sparkles,
  Percent,
  Check,
  Heart,
  ClipboardCheck,
  Trash2,
  MessageSquare,
  Upload,
  BellRing,
  Book
} from "lucide-react"
import { resolveImageUrl } from "@/lib/utils"

// Recharts for Agent Weekly performance chart & Quote Rescue Area chart
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  ReferenceArea,
  ReferenceLine
} from "recharts"

export default function AdminClient() {

  // Admin Data states
  const [cotizaciones, setCotizaciones] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [productFilter, setProductFilter] = useState<string>("todos")
  const [error, setError] = useState<string>("")

  // Admin Dashboard Tabs
  const [activeTab, setActiveTab] = useState<"historico" | "productividad" | "agentes" | "adn" | "comunicados" | "actividad" | "asistente" | "notificaciones" | "biblioteca" | "votaciones">("productividad")

  // Chatbot Knowledge Base states
  const [knowledgeDocs, setKnowledgeDocs] = useState<any[]>([])
  const [loadingDocs, setLoadingDocs] = useState<boolean>(false)
  const [docTitle, setDocTitle] = useState<string>("")
  const [docContent, setDocContent] = useState<string>("")
  const [docIsGlobalTemplate, setDocIsGlobalTemplate] = useState<boolean>(false)
  const [currentUserRole, setCurrentUserRole] = useState<string>("ADMIN")
  const [currentUserData, setCurrentUserData] = useState<any | null>(null)
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null)
  const [savingDoc, setSavingDoc] = useState<boolean>(false)
  const [docMsg, setDocMsg] = useState<string>("")

  // Rescued quote state
  const [selectedQuote, setSelectedQuote] = useState<any | null>(null)

  // Agent Management states
  const [dbAgentsList, setDbAgentsList] = useState<any[]>([])
  const [newAgentName, setNewAgentName] = useState<string>("")
  const [submittingAgent, setSubmittingAgent] = useState<boolean>(false)
  const [loadingAgents, setLoadingAgents] = useState<boolean>(false)
  const [agentMessage, setAgentMessage] = useState<string>("")

  // UDI Settings states (Correction 5: Admin sets UDI rate)
  const [defaultUdi, setDefaultUdi] = useState<number>(8.25)
  const [udiSaving, setUdiSaving] = useState<string>("")
  
  // ADN AACOM states
  const [adnList, setAdnList] = useState<any[]>([])
  const [loadingAdn, setLoadingAdn] = useState<boolean>(false)
  const [searchAdnQuery, setSearchAdnQuery] = useState<string>("")
  const [adnAgentFilter, setAdnAgentFilter] = useState<string>("ALL")
  const [adnStartDate, setAdnStartDate] = useState<string>("")
  const [adnEndDate, setAdnEndDate] = useState<string>("")
  const [selectedAdn, setSelectedAdn] = useState<any | null>(null)
  const [expandedAdnAgents, setExpandedAdnAgents] = useState<Record<string, boolean>>({})
  const [expandedAdnDates, setExpandedAdnDates] = useState<Record<string, boolean>>({})
  
  // Agent Credentials registration state
  const [agentEmailInput, setAgentEmailInput] = useState<string>("")
  const [agentNameInput, setAgentNameInput] = useState<string>("")
  const [agentPasswordInput, setAgentPasswordInput] = useState<string>("")
  const [agentRoleInput, setAgentRoleInput] = useState<string>("AGENTE")
  const [savingAgentUser, setSavingAgentUser] = useState<boolean>(false)
  const [userRegistrationMessage, setUserRegistrationMessage] = useState<string>("")
  const [agentPhoneInput, setAgentPhoneInput] = useState<string>("")
  const [syncToAgentCheckbox, setSyncToAgentCheckbox] = useState<boolean>(true)
  const [usersList, setUsersList] = useState<any[]>([])
  const [loadingUsers, setLoadingUsers] = useState<boolean>(false)
  const [editingUserPasswordId, setEditingUserPasswordId] = useState<string | null>(null)
  const [newPasswordInput, setNewPasswordInput] = useState<string>("")
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [loadingAnnouncements, setLoadingAnnouncements] = useState<boolean>(false)

  // Ranking Banner states
  const [rankingBanner, setRankingBanner] = useState<string | null>(null)
  const [savingRankingBanner, setSavingRankingBanner] = useState<boolean>(false)
  const [rankingBannerMsg, setRankingBannerMsg] = useState<string>("")
  const [announcementLinkInput, setAnnouncementLinkInput] = useState<string>("")
  
  // AACOM 25 Activity Report states
  const [activityLogs, setActivityLogs] = useState<any[]>([])
  const [loadingActivityLogs, setLoadingActivityLogs] = useState<boolean>(false)
  const [reportAgentFilter, setReportAgentFilter] = useState<string>("ALL")
  const [reportStartDate, setReportStartDate] = useState<string>("")
  const [reportEndDate, setReportEndDate] = useState<string>("")
  const [expandedAgents, setExpandedAgents] = useState<Record<string, boolean>>({})
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({})

  // Edit agent profile states
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<any | null>(null)
  const [editName, setEditName] = useState<string>("")
  const [editPhone, setEditPhone] = useState<string>("")
  const [editBirthDate, setEditBirthDate] = useState<string>("")
  const [editImage, setEditImage] = useState<string>("")
  const [savingProfile, setSavingProfile] = useState<boolean>(false)
  const [announcementMsg, setAnnouncementMsg] = useState<string>("")
  const [savingAnnouncement, setSavingAnnouncement] = useState<boolean>(false)

  // Push Notifications Admin States
  const [pushRecipient, setPushRecipient] = useState<string>("ALL")
  const [pushMessage, setPushMessage] = useState<string>("")
  const [pushPin, setPushPin] = useState<string>("")
  const [pushStatus, setPushStatus] = useState<string>("")
  const [pushLoading, setPushLoading] = useState<boolean>(false)

  // Scheduled Push States
  const [scheduledPushes, setScheduledPushes] = useState<any[]>([])
  const [pushPointsEnabled, setPushPointsEnabled] = useState(true)
  const [pushPlanningEnabled, setPushPlanningEnabled] = useState(true)
  const [schedFreq, setSchedFreq] = useState("DAILY")
  const [schedHour, setSchedHour] = useState("9")
  const [schedDate, setSchedDate] = useState("")

  const handleTogglePointsSetting = async () => {
    if (!pushPin.trim()) { setPushStatus("Ingresa el PIN en el cuadro de abajo primero."); return; }
    setPushStatus("Guardando...");
    const res = await toggleAdminSetting('push_points_enabled', !pushPointsEnabled, pushPin);
    if (res.success) {
      setPushPointsEnabled(!pushPointsEnabled);
      setPushStatus("Ajuste guardado.");
    } else {
      setPushStatus("Error: " + res.message);
    }
  };

  const handleTogglePlanningSetting = async () => {
    if (!pushPin.trim()) { setPushStatus("Ingresa el PIN en el cuadro de abajo primero."); return; }
    setPushStatus("Guardando...");
    const res = await toggleAdminSetting('push_planning_enabled', !pushPlanningEnabled, pushPin);
    if (res.success) {
      setPushPlanningEnabled(!pushPlanningEnabled);
      setPushStatus("Ajuste guardado.");
    } else {
      setPushStatus("Error: " + res.message);
    }
  };

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pushMessage.trim() || !pushPin.trim()) return;
    setPushLoading(true);
    setPushStatus("Programando...");
    const res = await createScheduledPush({
      message: pushMessage,
      frequency: schedFreq,
      timeHour: parseInt(schedHour),
      recipientId: pushRecipient,
      runDate: schedFreq === "ONCE" ? schedDate : undefined
    }, pushPin);
    
    if (res.success) {
      setPushStatus("�Notificaci�n programada con �xito!");
      setPushMessage("");
      const schedRes = await getScheduledPushes();
      if (Array.isArray(schedRes)) setScheduledPushes(schedRes);
    } else {
      setPushStatus("Error: " + res.message);
    }
    setPushLoading(false);
  };

  const handleDeleteSchedule = async (id: string) => {
    if (!pushPin.trim()) { setPushStatus("Ingresa el PIN abajo primero."); return; }
    setPushStatus("Borrando...");
    const res = await deleteScheduledPush(id, pushPin);
    if (res.success) {
      setPushStatus("Notificaci�n borrada.");
      const schedRes = await getScheduledPushes();
      if (Array.isArray(schedRes)) setScheduledPushes(schedRes);
    } else {
      setPushStatus("Error: " + res.message);
    }
  };

  const handleSendPush = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pushMessage.trim() || !pushPin.trim()) return
    setPushLoading(true)
    setPushStatus("Enviando notificación...")
    try {
      const res = await sendAdminPushNotification(pushRecipient, pushMessage.trim(), pushPin.trim())
      if (res.success) {
        setPushStatus(`¡Éxito! ${res.message}`)
        setPushMessage("")
        setPushPin("")
        setTimeout(() => setPushStatus(""), 5000)
      } else {
        setPushStatus(`Error: ${res.message}`)
      }
    } catch (err: any) {
      setPushStatus(`Error de red: ${err.message}`)
    } finally {
      setPushLoading(false)
    }
  }



  // Fetch users list
  const fetchUsersList = async () => {
    setLoadingUsers(true)
    try {
      const res = await getUsers()
      if (res.success && res.users) {
        setUsersList(res.users)
      }
    } catch (err) {
      console.error("Error fetching users:", err)
    } finally {
      setLoadingUsers(false)
    }
  }

  // Toggle user active status
  const handleToggleUserActive = async (id: string) => {
    try {
      const res = await toggleUserActiveStatus(id)
      if (res.success) {
        fetchUsersList()
      } else {
        alert(res.message || "Error al cambiar estatus")
      }
    } catch (err) {
      console.error(err)
      alert("Error de red al cambiar estatus")
    }
  }

  // Update user password
  const handleUpdatePassword = async (id: string) => {
    if (!newPasswordInput.trim()) {
      alert("La contraseña no puede estar vacía")
      return
    }
    try {
      const res = await updateUserPassword(id, newPasswordInput.trim())
      if (res.success) {
        setEditingUserPasswordId(null)
        setNewPasswordInput("")
        alert("Contraseña actualizada con éxito")
        fetchUsersList()
      } else {
        alert(res.message || "Error al actualizar contraseña")
      }
    } catch (err) {
      console.error(err)
      alert("Error de red al actualizar contraseña")
    }
  }

  // Delete user account
  const handleDeleteUser = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar a este usuario? Esto revocará su acceso por completo de manera permanente.")) return
    try {
      const res = await deleteUser(id)
      if (res.success) {
        fetchUsersList()
      } else {
        alert(res.message || "Error al eliminar usuario")
      }
    } catch (err) {
      console.error(err)
      alert("Error de red al eliminar usuario")
    }
  }

  // Toggle ADN Diagnostic closed/paid status
  const handleToggleAdnClosed = async (id: string) => {
    try {
      // Optimistic UI update
      setAdnList(prev => prev.map(adn => 
        adn.id === id ? { ...adn, cerradaPagada: !adn.cerradaPagada } : adn
      ))

      const res = await toggleAdnDiagnosticClosedStatus(id)
      if (!res.success) {
        alert(res.message || "Error al actualizar estado")
        const adnRes = await getAdnDiagnostics()
        if (adnRes.success && adnRes.diagnostics) {
          setAdnList(adnRes.diagnostics)
        }
      }
    } catch (err) {
      console.error(err)
      alert("Error de red al actualizar estado")
      const adnRes = await getAdnDiagnostics()
      if (adnRes.success && adnRes.diagnostics) {
        setAdnList(adnRes.diagnostics)
      }
    }
  }

  // Fetch announcements list
  const fetchAnnouncementsList = async () => {
    setLoadingAnnouncements(true)
    try {
      const res = await getAnnouncements()
      if (res.success && res.announcements) {
        setAnnouncements(res.announcements)
      }
    } catch (err) {
      console.error("Error fetching announcements:", err)
    } finally {
      setLoadingAnnouncements(false)
    }
  }

  // Toggle announcement active status
  const handleToggleAnnouncementActive = async (id: string) => {
    try {
      // Optimistic update
      setAnnouncements(prev => prev.map(ad => 
        ad.id === id ? { ...ad, active: !ad.active } : ad
      ))
      const res = await toggleAnnouncementActiveStatus(id)
      if (!res.success) {
        alert(res.message || "Error al cambiar estatus")
        fetchAnnouncementsList()
      }
    } catch (err) {
      console.error(err)
      alert("Error de red")
      fetchAnnouncementsList()
    }
  }

  // Delete announcement banner
  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este comunicado de forma permanente? Se borrará el archivo de imagen de la plataforma.")) return
    try {
      const res = await deleteAnnouncement(id)
      if (res.success) {
        fetchAnnouncementsList()
      } else {
        alert(res.message || "Error al eliminar")
      }
    } catch (err) {
      console.error(err)
      alert("Error de red")
    }
  }

  // Upload Ranking Banner
  const handleUploadRankingBanner = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setRankingBannerMsg("Error: El archivo supera los 5 MB permitidos.")
      return
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      setRankingBannerMsg("Error: Solo se permiten imágenes JPG, JPEG, PNG o GIF.")
      return
    }

    setSavingRankingBanner(true)
    setRankingBannerMsg("Subiendo campaña de ranking...")

    try {
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64 = reader.result as string
        const res = await createRankingAd(base64, file.name)
        if (res.success && res.rankingAd) {
          setRankingBanner(res.rankingAd.imageUrl)
          setRankingBannerMsg("¡Campaña de Ranking subida con éxito!")
          e.target.value = ""
          setTimeout(() => setRankingBannerMsg(""), 5000)
        } else {
          setRankingBannerMsg(res.message || "Error al subir campaña de ranking")
        }
        setSavingRankingBanner(false)
      }
      reader.onerror = () => {
        setRankingBannerMsg("Error al procesar la imagen")
        setSavingRankingBanner(false)
      }
      reader.readAsDataURL(file)
    } catch (err) {
      console.error(err)
      setRankingBannerMsg("Error inesperado")
      setSavingRankingBanner(false)
    }
  }

  // Upload new announcement banner
  const handleUploadAnnouncement = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate size (< 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setAnnouncementMsg("Error: El archivo supera los 5 MB permitidos.")
      return
    }

    // Validate type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      setAnnouncementMsg("Error: Solo se permiten imágenes JPG, JPEG, PNG o GIF.")
      return
    }

    setSavingAnnouncement(true)
    setAnnouncementMsg("Subiendo imagen...")

    try {
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64 = reader.result as string
        const res = await createAnnouncement(base64, file.name, announcementLinkInput.trim() || undefined)
        if (res.success) {
          setAnnouncementMsg("¡Imagen de comunicado subida con éxito!")
          setAnnouncementLinkInput("")
          // Clear input element
          e.target.value = ""
          fetchAnnouncementsList()
          setTimeout(() => setAnnouncementMsg(""), 5000)
        } else {
          setAnnouncementMsg(res.message || "Error al subir comunicado")
        }
        setSavingAnnouncement(false)
      }
      reader.onerror = () => {
        setAnnouncementMsg("Error al leer el archivo.")
        setSavingAnnouncement(false)
      }
      reader.readAsDataURL(file)
    } catch (err: any) {
      setAnnouncementMsg(`Error: ${err.message || "Fallo de red"}`)
      setSavingAnnouncement(false)
    }
  }

  // Fetch agents list
  const fetchAgentsList = async () => {
    setLoadingAgents(true)
    try {
      const res = await getAgents()
      if (res.success && res.agents) {
        setDbAgentsList(res.agents)
      }
    } catch (err) {
      console.error("Error fetching agents in admin:", err)
    } finally {
      setLoadingAgents(false)
    }
  }

  // Load cotizaciones and UDI setting from DB
  const loadData = async () => {
    setLoading(true)
    setError("")
    setLoadingAdn(true)
    try {
      const userPromise = getCurrentUser().then(res => {
        if (res.success && res.user) {
          setCurrentUserRole(res.user.role)
          setCurrentUserData(res.user)
        }
      });

      const quotesPromise = getCotizaciones().then(res => {
        if (res.success && res.cotizaciones) {
          setCotizaciones(res.cotizaciones)
        } else {
          setError(res.message || "Error al cargar los datos.")
        }
      });

      const udiPromise = getUdiSetting().then(res => {
        if (res.success && res.value) {
          setDefaultUdi(res.value)
        }
      });

      const adnPromise = getAdnDiagnostics().then(res => {
        if (res.success && res.diagnostics) {
          setAdnList(res.diagnostics)
        }
      });

      const rankingPromise = getMonthlyAdnRankings().then(res => {
        if (res.success && res.rankingAd) {
          setRankingBanner(res.rankingAd.imageUrl)
        }
      });

      await Promise.all([
        userPromise,
        quotesPromise,
        udiPromise,
        adnPromise,
        rankingPromise,
        fetchAgentsList(),
        fetchUsersList(),
        fetchAnnouncementsList(),
        fetchActivityLogsList(),
        fetchKnowledgeDocsList()
      ]);
      
    } catch (err) {
      console.error(err)
      setError("Fallo al conectar con el servidor.")
    } finally {
      setLoading(false)
      setLoadingAdn(false)
    }
  }

  const fetchKnowledgeDocsList = async () => {
    try {
      setLoadingDocs(true)
      const { getKnowledgeDocuments } = await import("@/app/actions")
      const res = await getKnowledgeDocuments()
      if (res.success && res.docs) {
        setKnowledgeDocs(res.docs)
      }
    } catch (err) {
      console.error("Error fetching knowledge docs:", err)
    } finally {
      setLoadingDocs(false)
    }
  }

  const handleSaveDoc = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!docTitle.trim() || !docContent.trim()) return
    setSavingDoc(true)
    setDocMsg("Guardando...")
    try {
      const { saveKnowledgeDocument } = await import("@/app/actions")
      const res = await saveKnowledgeDocument(selectedDocId, docTitle.trim(), docContent.trim(), docIsGlobalTemplate)
      if (res.success) {
        setDocMsg("¡Documento guardado con éxito!")
        setDocTitle("")
        setDocContent("")
        setDocIsGlobalTemplate(false)
        setSelectedDocId(null)
        await fetchKnowledgeDocsList()
        setTimeout(() => setDocMsg(""), 3000)
      } else {
        setDocMsg(`Error: ${res.message}`)
      }
    } catch (err: any) {
      console.error(err)
      setDocMsg(`Error: ${err.message || "Error al conectar"}`)
    } finally {
      setSavingDoc(false)
    }
  }

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setDocMsg("Cargando y procesando PDF...")
    
    const loadPdfJs = () => {
      return new Promise<void>((resolve, reject) => {
        if ((window as any).pdfjsLib) {
          resolve()
          return
        }
        const script = document.createElement("script")
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"
        script.onload = () => {
          ;(window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"
          resolve()
        }
        script.onerror = reject
        document.head.appendChild(script)
      })
    }

    const fileReader = new FileReader()
    fileReader.onload = async function () {
      try {
        const typedarray = new Uint8Array(this.result as ArrayBuffer)
        await loadPdfJs()
        const pdfjsLib = (window as any).pdfjsLib
        const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise
        
        let extractedText = ""
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i)
          const textContent = await page.getTextContent()
          const pageText = textContent.items.map((item: any) => item.str).join(" ")
          extractedText += pageText + "\n"
        }

        if (!extractedText.trim()) {
          setDocMsg("El PDF se leyó pero no se pudo extraer texto (puede que contenga solo imágenes).")
          return
        }

        setDocContent(extractedText)
        const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, "")
        setDocTitle(fileNameWithoutExt)
        setDocMsg(`¡Texto extraído de ${pdf.numPages} páginas con éxito!`)
      } catch (err: any) {
        console.error("Error al extraer PDF:", err)
        setDocMsg(`Error al extraer PDF: ${err.message}`)
      } finally {
        e.target.value = ""
      }
    }
    fileReader.onerror = () => {
      setDocMsg("Error al leer el archivo PDF.")
    }
    fileReader.readAsArrayBuffer(file)
  }

  const handleDeleteDoc = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este documento de la base de conocimientos? Gemini ya no podrá consultarlo.")) return
    try {
      const { deleteKnowledgeDocument } = await import("@/app/actions")
      const res = await deleteKnowledgeDocument(id)
      if (res.success) {
        await fetchKnowledgeDocsList()
      } else {
        alert(res.message || "Error al eliminar")
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleToggleDocActive = async (id: string) => {
    try {
      const { toggleKnowledgeDocumentActiveStatus } = await import("@/app/actions")
      const res = await toggleKnowledgeDocumentActiveStatus(id)
      if (res.success) {
        await fetchKnowledgeDocsList()
      } else {
        alert(res.message || "Error al cambiar estatus")
      }
    } catch (err) {
      console.error(err)
    }
  }

  const fetchActivityLogsList = async () => {
    try {
      setLoadingActivityLogs(true)
      const res = await getAdminActivityReport(
        reportAgentFilter === "ALL" ? undefined : reportAgentFilter,
        reportStartDate || undefined,
        reportEndDate || undefined
      )
      if (res.success && res.logs) {
        setActivityLogs(res.logs)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingActivityLogs(false)
    }
  }

  const handleOpenEditProfileModal = (user: any) => {
    setSelectedUserForEdit(user)
    setEditName(user.name || "")
    setEditPhone(user.phone || "")
    setEditImage(user.image || "")
    if (user.birthDate) {
      const d = new Date(user.birthDate)
      const year = d.getUTCFullYear()
      const month = String(d.getUTCMonth() + 1).padStart(2, '0')
      const day = String(d.getUTCDate()).padStart(2, '0')
      setEditBirthDate(`${year}-${month}-${day}`)
    } else {
      setEditBirthDate("")
    }
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUserForEdit) return
    setSavingProfile(true)
    try {
      const res = await updateAgentProfile(selectedUserForEdit.id, {
        name: editName.trim(),
        phone: editPhone.trim(),
        birthDate: editBirthDate || undefined,
        image: editImage || undefined
      })
      if (res.success) {
        alert("Perfil de agente actualizado correctamente.")
        setSelectedUserForEdit(null)
        loadData()
      } else {
        alert(res.message || "Error al actualizar perfil")
      }
    } catch (err) {
      console.error(err)
      alert("Error de conexión al guardar perfil")
    } finally {
      setSavingProfile(false)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    if (file.size > 2 * 1024 * 1024) {
      alert("La imagen excede los 2 MB de tamaño permitido.")
      return
    }

    const reader = new FileReader()
    reader.onload = (upEv) => {
      const base64 = upEv.target?.result as string
      setEditImage(base64)
    }
    reader.readAsDataURL(file)
  }

  const handleDeleteActivityLog = async (logId: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este registro de actividad? Los puntos correspondientes le serán restados al agente.")) return
    try {
      const res = await deleteActivityLogEntry(logId)
      if (res.success) {
        await fetchActivityLogsList()
      } else {
        alert(res.message || "Error al eliminar registro")
      }
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Save UDI default setting
  const handleSaveUdi = async () => {
    setUdiSaving("Guardando...")
    try {
      const res = await saveUdiSetting(defaultUdi)
      if (res.success) {
        setUdiSaving("¡Guardado!")
        setTimeout(() => setUdiSaving(""), 3000)
      } else {
        setUdiSaving("Error")
      }
    } catch (err) {
      console.error(err)
      setUdiSaving("Error")
    }
  }

  // Create new Agent
  const handleAddAgent = async () => {
    if (!newAgentName.trim()) return
    setSubmittingAgent(true)
    setAgentMessage("")
    try {
      const res = await createAgent(newAgentName.trim())
      if (res.success) {
        setNewAgentName("")
        setAgentMessage("¡Agente registrado con éxito!")
        setTimeout(() => setAgentMessage(""), 5000)
        fetchAgentsList()
      } else {
        setAgentMessage(res.message || "Error al registrar el agente")
      }
    } catch (err: any) {
      setAgentMessage(`Error: ${err.message || 'Fallo de red'}`)
    } finally {
      setSubmittingAgent(false)
    }
  }

  // Delete an Agent
  const handleDeleteAgent = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar a este agente? Esto no borrará sus cotizaciones históricas, pero ya no aparecerá como opción para nuevas cotizaciones.")) return
    try {
      const res = await deleteAgent(id)
      if (res.success) {
        fetchAgentsList()
      } else {
        alert(res.message || "Error al eliminar agente")
      }
    } catch (err) {
      console.error(err)
      alert("Error al conectar para eliminar agente")
    }
  }

  // Create Agent User Credentials Account
  const handleCreateAgentUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!agentNameInput.trim() || !agentEmailInput.trim() || !agentPasswordInput.trim()) {
      setUserRegistrationMessage("Por favor rellena todos los campos obligatorios")
      return
    }
    setSavingAgentUser(true)
    setUserRegistrationMessage("")
    try {
      const res = await createAgentUser({
        name: agentNameInput.trim(),
        email: agentEmailInput.trim(),
        role: agentRoleInput,
        password: agentPasswordInput,
        phone: agentPhoneInput.trim() || undefined,
        syncToAgent: syncToAgentCheckbox
      })
      if (res.success) {
        setAgentNameInput("")
        setAgentEmailInput("")
        setAgentPasswordInput("")
        setAgentPhoneInput("")
        setUserRegistrationMessage("¡Usuario de agente creado exitosamente!")
        setTimeout(() => setUserRegistrationMessage(""), 5000)
        loadData()
      } else {
        setUserRegistrationMessage(res.message || "Error al crear usuario de agente")
      }
    } catch (err: any) {
      setUserRegistrationMessage(`Error: ${err.message || "Fallo de red"}`)
    } finally {
      setSavingAgentUser(false)
    }
  }

  // Filter cotizaciones based on search and dropdown
  const filteredCotizaciones = cotizaciones.filter(item => {
    const matchesSearch = 
      item.cliente.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.telefono.includes(searchQuery) ||
      item.agente.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesProduct = productFilter === "todos" || item.producto === productFilter
    
    return matchesSearch && matchesProduct
  })

  // Date utilities
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() // 0-indexed

  const isThisMonth = (date: Date) => {
    return date.getFullYear() === currentYear && date.getMonth() === currentMonth
  }

  const isLastMonth = (date: Date) => {
    const targetYear = currentMonth === 0 ? currentYear - 1 : currentYear
    const targetMonth = currentMonth === 0 ? 11 : currentMonth - 1
    return date.getFullYear() === targetYear && date.getMonth() === targetMonth
  }

  const isThisYear = (date: Date) => {
    return date.getFullYear() === currentYear
  }

  const getWeekDiff = (date: Date) => {
    const diffTime = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    return Math.floor(diffDays / 7)
  }

  // AGENT PRODUCTIVITY CALCULATIONS
  const agentStatsMap: {
    [agentName: string]: {
      name: string
      total: number
      thisMonth: number
      lastMonth: number
      thisYear: number
      totalPremium: number
      avgPremium: number
      mostCotizedProduct: string
      weeklyCounts: number[] // [semanaActual, hace1Sem, hace2Sem, hace3Sem]
    }
  } = {}

  const agentProductCounts: { [agentName: string]: { [product: string]: number } } = {}
  const globalProductCounts: { [product: string]: number } = {}

  cotizaciones.forEach(item => {
    const agentName = item.agente || "Sin Agente"
    const date = new Date(item.createdAt)
    const prod = item.producto

    // Global counts
    globalProductCounts[prod] = (globalProductCounts[prod] || 0) + 1

    // Agent counts
    if (!agentProductCounts[agentName]) {
      agentProductCounts[agentName] = {}
    }
    agentProductCounts[agentName][prod] = (agentProductCounts[agentName][prod] || 0) + 1

    if (!agentStatsMap[agentName]) {
      agentStatsMap[agentName] = {
        name: agentName,
        total: 0,
        thisMonth: 0,
        lastMonth: 0,
        thisYear: 0,
        totalPremium: 0,
        avgPremium: 0,
        mostCotizedProduct: "",
        weeklyCounts: [0, 0, 0, 0]
      }
    }

    const stats = agentStatsMap[agentName]
    stats.total += 1
    stats.totalPremium += item.primaAnual

    if (isThisMonth(date)) stats.thisMonth += 1
    if (isLastMonth(date)) stats.lastMonth += 1
    if (isThisYear(date)) stats.thisYear += 1

    const weekDiff = getWeekDiff(date)
    if (weekDiff >= 0 && weekDiff < 4) {
      stats.weeklyCounts[weekDiff] += 1
    }
  })

  // Finalize averages and favorite products
  const agentStatsList = Object.values(agentStatsMap).map(stats => {
    stats.avgPremium = stats.total > 0 ? stats.totalPremium / stats.total : 0
    
    // Find favorite product
    const counts = agentProductCounts[stats.name]
    let favoriteProduct = "Ninguno"
    let maxCount = -1
    if (counts) {
      Object.entries(counts).forEach(([prod, count]) => {
        if (count > maxCount) {
          maxCount = count
          favoriteProduct = prod
        }
      })
    }
    stats.mostCotizedProduct = favoriteProduct
    return stats
  }).sort((a, b) => b.total - a.total) // Sort by total quotes desc

  // Calculate Global Metrics
  const totalCount = filteredCotizaciones.length
  const totalPrimasPesos = filteredCotizaciones.reduce((acc, item) => acc + item.primaAnual, 0)
  const totalAhorroPesos = filteredCotizaciones.reduce((acc, item) => acc + item.ahorro, 0)
  const avgPrimasPesos = totalCount > 0 ? totalPrimasPesos / totalCount : 0

  // Download rescued PDF dynamically with html2pdf.js
  const handleDownloadRescuedPdf = async () => {
    if (!selectedQuote) return
    const html2pdf = (await import("html2pdf.js")).default
    const element = document.getElementById("admin-printable-report")
    if (!element) return

    const sanitizedClientName = (selectedQuote.cliente || "Cotizacion").replace(/[^a-zA-Z0-9]/g, "_")
    
    const opt = {
      margin:       8,
      filename:     `Cotizacion_${sanitizedClientName}_${new Date(selectedQuote.createdAt).toISOString().slice(0,10)}.pdf`,
      image:        { type: 'jpeg' as const, quality: 0.98 },
      html2canvas:  { scale: 2.5, useCORS: true, letterRendering: true },
      jsPDF:        { unit: 'mm' as const, format: 'letter' as const, orientation: 'portrait' as const }
    }

    html2pdf().from(element).set(opt).save()
  }



  // RENDER MAIN ADMIN PAGE IF AUTHORIZED
  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto animate-in fade-in duration-300">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="AACOM Seguros" className="h-10 w-auto object-contain" />
          <div className="h-8 w-px bg-slate-300 dark:bg-zinc-700 hidden sm:block"></div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              Administración de Cotizaciones <ShieldCheck className="h-5 w-5 text-teal-600" />
            </h1>
            <p className="text-xs text-muted-foreground">
              Auditoría, rescatado de propuestas y análisis de productividad comercial de tus agentes.
            </p>
          </div>
        </div>

        <Button variant="outline" onClick={loadData} disabled={loading} className="border-slate-200 shrink-0">
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Actualizar Datos
        </Button>
      </div>

      {/* Config Card: Default UDI Exchange Rate (Correction 5) */}
      <Card className="border shadow-sm bg-gradient-to-r from-teal-50/20 to-emerald-50/20 dark:from-zinc-900/30 dark:to-zinc-800/10">
        <CardContent className="p-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-400 rounded-full flex items-center justify-center">
              <Coins className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Valor de la UDI Predeterminado</h3>
              <p className="text-xs text-muted-foreground">
                Define el tipo de cambio que se mostrará en el formulario inicial del agente.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-40">
              <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">$</span>
              <Input
                type="number"
                step="0.0001"
                value={defaultUdi}
                onChange={(e) => setDefaultUdi(parseFloat(e.target.value) || 0)}
                className="pl-7 font-bold text-slate-800 dark:text-slate-100"
              />
            </div>
            <Button onClick={handleSaveUdi} className="bg-teal-600 hover:bg-teal-700 text-white font-bold shrink-0">
              Fijar Tasa
            </Button>
            {udiSaving && (
              <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-1 rounded border border-teal-200 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> {udiSaving}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs Selector Navigation */}
      <div className="flex border-b overflow-x-auto hide-scrollbar whitespace-nowrap">
        <button
          onClick={() => setActiveTab("productividad")}
          className={`px-6 py-3 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "productividad"
              ? "border-teal-600 text-teal-600 dark:text-teal-400"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <BarChart3 className="h-4.5 w-4.5" /> Productividad de Agentes
        </button>
        <button
          onClick={() => setActiveTab("historico")}
          className={`px-6 py-3 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "historico"
              ? "border-teal-600 text-teal-600 dark:text-teal-400"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <BookOpen className="h-4.5 w-4.5" /> Historial de Cotizaciones
        </button>
        <button
          onClick={() => setActiveTab("agentes")}
          className={`px-6 py-3 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "agentes"
              ? "border-teal-600 text-teal-600 dark:text-teal-400"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Users className="h-4.5 w-4.5" /> Gestión de Agentes
        </button>
        <button
          onClick={() => setActiveTab("adn")}
          className={`px-6 py-3 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "adn"
              ? "border-teal-600 text-teal-600 dark:text-teal-400"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Heart className="h-4.5 w-4.5" /> Diagnóstico ADN
        </button>
        <button
          onClick={() => setActiveTab("comunicados")}
          className={`px-6 py-3 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "comunicados"
              ? "border-teal-600 text-teal-600 dark:text-teal-400"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Sparkles className="h-4.5 w-4.5 text-amber-500" /> Banners de Inicio
        </button>
        <button
          onClick={() => setActiveTab("actividad")}
          className={`px-6 py-3 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "actividad"
              ? "border-teal-600 text-teal-600 dark:text-teal-400"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <ClipboardCheck className="h-4.5 w-4.5" /> Actividad 25
        </button>
        <button
          onClick={() => setActiveTab("asistente")}
          className={`px-6 py-3 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "asistente"
              ? "border-teal-600 text-teal-600 dark:text-teal-400"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <MessageSquare className="h-4.5 w-4.5 text-pink-500" /> Asistente (Conocimiento)
        </button>
        <button
          onClick={() => setActiveTab("notificaciones")}
          className={`px-6 py-3 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "notificaciones"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <BellRing className="h-4.5 w-4.5 text-blue-500" /> Push Notifications
        </button>
        <button
          onClick={() => setActiveTab("biblioteca")}
          className={`px-6 py-3 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "biblioteca"
              ? "border-teal-600 text-teal-600 dark:text-teal-400"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Book className="h-4.5 w-4.5" /> Biblioteca de Documentos
        </button>
                {currentUserRole === 'SUPER_ADMIN' && (
            <button
              onClick={() => setActiveTab('votaciones')}
              className={`px-6 py-3 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${activeTab === "votaciones" ? "border-amber-500 text-amber-500" : "border-transparent text-slate-500 hover:text-slate-800"}`}
            >
              <Sparkles className="h-4.5 w-4.5 text-amber-500" /> Control de Votaciones
            </button>
          )}
        </div>

      {/* TAB CONTENT 1: AGENT PRODUCTIVITY DASHBOARD */}
      {activeTab === "productividad" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Ranking Banner Upload Section */}
          <Card className="border shadow-sm bg-gradient-to-br from-amber-50 to-orange-50/30">
            <CardHeader className="py-4 border-b bg-white/50">
              <CardTitle className="text-sm font-black text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
                <Award className="h-4.5 w-4.5" /> Campaña de Premiación (Ranking #1)
              </CardTitle>
              <CardDescription className="text-xs">
                Sube una imagen para incentivar a los agentes. Se mostrará en la parte superior de su pantalla de Ranking.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              <div className="flex flex-col md:flex-row gap-6 items-center">
                <div className="w-full md:w-1/2 space-y-3">
                  <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all hover:bg-white/60 ${savingRankingBanner ? "opacity-50 pointer-events-none" : "border-amber-300 hover:border-amber-500"}`}>
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Download className="w-8 h-8 text-amber-500 mb-2" />
                      <p className="text-[10px] text-amber-700 font-bold uppercase">Haz clic para subir campaña</p>
                      <p className="text-[9px] text-amber-600/70">JPG, PNG o GIF hasta 5 MB</p>
                    </div>
                    <input type="file" accept="image/jpeg,image/png,image/gif" onChange={handleUploadRankingBanner} className="hidden" disabled={savingRankingBanner} />
                  </label>
                  {rankingBannerMsg && (
                    <p className={`text-xs font-bold text-center ${rankingBannerMsg.includes("Error") ? "text-red-500" : "text-emerald-600 animate-pulse"}`}>
                      {rankingBannerMsg}
                    </p>
                  )}
                </div>
                <div className="w-full md:w-1/2 flex justify-center">
                  {rankingBanner ? (
                    <div className="relative rounded-xl overflow-hidden shadow-sm border border-amber-200 w-full flex items-center justify-center bg-white p-2">
                      <img src={rankingBanner} alt="Campaña de Ranking" className="max-w-full max-h-48 object-contain rounded" />
                    </div>
                  ) : (
                    <div className="h-32 w-full rounded-xl border border-dashed border-amber-200 flex items-center justify-center text-amber-500 font-medium text-xs italic bg-white/40">
                      Sin campaña activa actualmente.
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Global Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Global product mix bar card */}
            <Card className="md:col-span-2 border shadow-sm">
              <CardHeader className="py-4 border-b bg-slate-50/50">
                <CardTitle className="text-sm font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <BarChart3 className="h-4 w-4 text-teal-600" /> Mix de Productos Cotizados (Global)
                </CardTitle>
                <CardDescription className="text-xs">
                  Participación del volumen de cotizaciones acumulado por producto
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {Object.keys(globalProductCounts).length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground text-xs">Sin registros de productos</div>
                ) : (
                  Object.entries(globalProductCounts).map(([prod, count]) => {
                    const pct = totalCount > 0 ? (count / totalCount) * 100 : 0
                    return (
                      <div key={prod} className="space-y-1">
                        <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                          <span>{prod}</span>
                          <span>{count} cotizaciones ({pct.toFixed(1)}%)</span>
                        </div>
                        <div className="h-3 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden border">
                          <div 
                            className="h-full bg-teal-600 rounded-full transition-all duration-500" 
                            style={{ width: `${pct}%` }}
                          ></div>
                        </div>
                      </div>
                    )
                  })
                )}
              </CardContent>
            </Card>

            {/* General metrics summaries */}
            <div className="flex flex-col gap-4">
              <Card className="shadow-sm border border-slate-100 flex-1">
                <CardContent className="p-5 flex items-center justify-between h-full">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">Agentes Activos</span>
                    <span className="text-3xl font-black text-slate-800 dark:text-slate-100 mt-1 block">
                      {agentStatsList.length}
                    </span>
                    <span className="text-xs text-slate-400 block mt-1">Con al menos 1 cotización</span>
                  </div>
                  <div className="h-12 w-12 bg-teal-50 dark:bg-zinc-800 text-teal-600 dark:text-teal-400 rounded-full flex items-center justify-center">
                    <Users className="h-6 w-6" />
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm border border-slate-100 flex-1">
                <CardContent className="p-5 flex items-center justify-between h-full">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">Volumen Primas Global</span>
                    <span className="text-2xl font-black text-teal-600 dark:text-teal-400 mt-1 block leading-tight">
                      ${totalPrimasPesos.toLocaleString("es-MX", { maximumFractionDigits: 0 })}
                    </span>
                    <span className="text-xs text-slate-400 block mt-1">Suma de primas anuales</span>
                  </div>
                  <div className="h-12 w-12 bg-emerald-50 dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center">
                    <DollarSign className="h-6 w-6" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Productivity Table/Grid of Agents */}
          <Card className="border shadow-sm overflow-hidden">
            <CardHeader className="py-4 border-b">
              <CardTitle className="text-base font-bold text-slate-800 dark:text-slate-200">
                Tabla de Productividad de Agentes
              </CardTitle>
              <CardDescription>
                Resumen analítico detallado del desempeño, volumen cotizado y métricas temporales de cada agente.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="h-8 w-8 animate-spin text-teal-600" />
                  <span>Calculando estadísticas...</span>
                </div>
              ) : agentStatsList.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground text-xs flex flex-col items-center justify-center gap-2">
                  <Users className="h-8 w-8 text-slate-400" />
                  <span>No hay agentes registrados en el sistema de cotizaciones aún.</span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table className="text-xs">
                    <TableHeader className="bg-slate-50 dark:bg-zinc-800">
                      <TableRow>
                        <TableHead className="font-bold py-3 pl-4">Agente</TableHead>
                        <TableHead className="font-bold py-3 text-center">Total Cotizaciones</TableHead>
                        <TableHead className="font-bold py-3 text-center bg-teal-50/30">Este Mes</TableHead>
                        <TableHead className="font-bold py-3 text-center">Mes Pasado</TableHead>
                        <TableHead className="font-bold py-3 text-center">Este Año</TableHead>
                        <TableHead className="font-bold py-3 text-right">Prima Promedio</TableHead>
                        <TableHead className="font-bold py-3 text-center">Producto Más Cotizado</TableHead>
                        <TableHead className="font-bold py-3 text-center pr-4">Estadística de Cotizaciones (4 semanas)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {agentStatsList.map((agent) => (
                        <TableRow key={agent.name} className="hover:bg-slate-50/50">
                          {/* Agent Name */}
                          <TableCell className="font-bold text-slate-800 dark:text-slate-200 py-3.5 pl-4">
                            <div className="flex items-center gap-2">
                              <span className="h-7 w-7 rounded-full bg-teal-600 text-white flex items-center justify-center font-black text-[10px] shadow-sm uppercase">
                                {agent.name.split(" ").map(w => w[0]).slice(0, 2).join("")}
                              </span>
                              <span>{agent.name}</span>
                            </div>
                          </TableCell>
                          
                          {/* Quote Counts */}
                          <TableCell className="text-center py-3.5 font-bold text-slate-700 dark:text-slate-300">
                            {agent.total}
                          </TableCell>
                          
                          <TableCell className="text-center py-3.5 font-black text-teal-700 dark:text-teal-400 bg-teal-50/20">
                            {agent.thisMonth}
                          </TableCell>
                          
                          <TableCell className="text-center py-3.5 font-medium text-slate-600 dark:text-slate-400">
                            {agent.lastMonth}
                          </TableCell>
                          
                          <TableCell className="text-center py-3.5 font-bold text-slate-700 dark:text-slate-300">
                            {agent.thisYear}
                          </TableCell>
                          
                          {/* Average Premium */}
                          <TableCell className="text-right py-3.5 font-bold text-slate-800 dark:text-slate-200">
                            ${agent.avgPremium.toLocaleString("es-MX", { maximumFractionDigits: 0 })}
                          </TableCell>
                          
                          {/* Favorite Product */}
                          <TableCell className="text-center py-3.5">
                            <span className="inline-block px-2.5 py-0.5 rounded-full font-bold text-[9px] bg-emerald-50 dark:bg-zinc-800 text-emerald-800 dark:text-emerald-300 border border-emerald-200/50">
                              {agent.mostCotizedProduct}
                            </span>
                          </TableCell>
                          
                          {/* Weekly Sparkline/Indicator */}
                          <TableCell className="py-3.5 pr-4">
                            <div className="flex items-center justify-center gap-1.5">
                              {agent.weeklyCounts.map((count, wIdx) => {
                                const labels = ["Act", "Sem1", "Sem2", "Sem3"]
                                return (
                                  <div 
                                    key={wIdx} 
                                    className="flex flex-col items-center justify-center p-1 rounded border min-w-10 bg-slate-50 dark:bg-zinc-800/50"
                                    title={`Hace ${wIdx} semanas: ${count} cotizaciones`}
                                  >
                                    <span className="text-[8px] text-slate-400 uppercase font-bold">{labels[wIdx]}</span>
                                    <span className={`text-[10px] font-black ${count > 0 ? "text-teal-600" : "text-slate-400"}`}>{count}</span>
                                  </div>
                                )
                              })}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB CONTENT 2: GENERAL HISTORY TABLE & ACTION TO RESCUE QUOTE */}
      {activeTab === "historico" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Top Aggregation Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="shadow-sm border-slate-100">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] md:text-xs font-bold text-slate-500 uppercase">Cotizaciones Filtradas</span>
                  <span className="text-xl md:text-2xl font-black text-slate-800 dark:text-slate-100 block mt-1">
                    {totalCount}
                  </span>
                </div>
                <div className="h-10 w-10 bg-teal-50 dark:bg-zinc-800 text-teal-600 dark:text-teal-400 rounded-full flex items-center justify-center">
                  <Users className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-slate-100">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] md:text-xs font-bold text-slate-500 uppercase">Volumen Primas</span>
                  <span className="text-xl md:text-2xl font-black text-teal-600 dark:text-teal-400 block mt-1">
                    ${totalPrimasPesos.toLocaleString("es-MX", { maximumFractionDigits: 0 })}
                  </span>
                </div>
                <div className="h-10 w-10 bg-emerald-50 dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center">
                  <DollarSign className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-slate-100">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] md:text-xs font-bold text-slate-500 uppercase">Ahorro Proyectado</span>
                  <span className="text-xl md:text-2xl font-black text-emerald-600 dark:text-emerald-400 block mt-1">
                    ${totalAhorroPesos.toLocaleString("es-MX", { maximumFractionDigits: 0 })}
                  </span>
                </div>
                <div className="h-10 w-10 bg-emerald-50 dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-slate-100">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] md:text-xs font-bold text-slate-500 uppercase">Prima Promedio</span>
                  <span className="text-xl md:text-2xl font-black text-slate-800 dark:text-slate-100 block mt-1">
                    ${avgPrimasPesos.toLocaleString("es-MX", { maximumFractionDigits: 0 })}
                  </span>
                </div>
                <div className="h-10 w-10 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-400 rounded-full flex items-center justify-center">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters Bar */}
          <Card className="shadow-sm border-slate-100">
            <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-muted-foreground" />
                <Input
                  placeholder="Buscar por cliente, teléfono o agente..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="flex gap-4 w-full md:w-auto">
                <select
                  value={productFilter}
                  onChange={(e) => setProductFilter(e.target.value)}
                  className="flex h-10 w-full md:w-56 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none"
                >
                  <option value="todos">Todos los Productos</option>
                  <option value="VPL">VPL</option>
                  <option value="VPL PPR">VPL PPR</option>
                </select>

                {(searchQuery !== "" || productFilter !== "todos") && (
                  <Button 
                    variant="ghost" 
                    onClick={() => { setSearchQuery(""); setProductFilter("todos"); }} 
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    <FilterX className="mr-1.5 h-4 w-4" /> Limpiar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Database History Table */}
          <Card className="shadow-sm border-slate-100 overflow-hidden">
            <CardHeader className="py-4 border-b">
              <CardTitle className="text-base font-bold text-slate-800 dark:text-slate-200">
                Registro Histórico de Cotizaciones
              </CardTitle>
              <CardDescription>
                Lista completa de cotizaciones con capacidad de rescatado visual e impresión inmediata.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="h-8 w-8 animate-spin text-teal-600" />
                  <span>Cargando cotizaciones...</span>
                </div>
              ) : filteredCotizaciones.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
                  <FileSpreadsheet className="h-8 w-8 text-slate-400" />
                  <span>No se encontraron cotizaciones.</span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table className="text-xs">
                    <TableHeader className="bg-slate-50 dark:bg-zinc-800">
                      <TableRow>
                        <TableHead className="font-bold py-3 pl-4">Cliente</TableHead>
                        <TableHead className="font-bold py-3">Teléfono</TableHead>
                        <TableHead className="font-bold py-3 text-center">Producto</TableHead>
                        <TableHead className="font-bold py-3 text-right">Prima Anual</TableHead>
                        <TableHead className="font-bold py-3 text-right">Prima Total</TableHead>
                        <TableHead className="font-bold py-3 text-right">Ahorro Proyectado (65)</TableHead>
                        <TableHead className="font-bold py-3 text-center">Rendimiento (65)</TableHead>
                        <TableHead className="font-bold py-3">Agente</TableHead>
                        <TableHead className="font-bold py-3 text-center">Fecha</TableHead>
                        <TableHead className="font-bold py-3 text-center pr-4">Rescatar</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCotizaciones.map((item) => (
                        <TableRow key={item.id} className="hover:bg-slate-50/50">
                          <TableCell className="font-bold text-slate-700 dark:text-slate-300 py-3.5 pl-4">{item.cliente}</TableCell>
                          <TableCell className="text-slate-600 dark:text-slate-400 py-3.5">{item.telefono}</TableCell>
                          <TableCell className="text-center py-3.5">
                            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 dark:bg-zinc-800 text-teal-800 dark:text-teal-200 border">
                              {item.producto}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-medium py-3.5">
                            ${item.primaAnual.toLocaleString("es-MX", { maximumFractionDigits: 0 })}
                          </TableCell>
                          <TableCell className="text-right text-slate-600 dark:text-slate-400 py-3.5">
                            ${item.totalPrima.toLocaleString("es-MX", { maximumFractionDigits: 0 })}
                          </TableCell>
                          <TableCell className="text-right font-bold text-emerald-600 py-3.5">
                            ${item.ahorro.toLocaleString("es-MX", { maximumFractionDigits: 0 })}
                          </TableCell>
                          <TableCell className="text-center font-bold text-teal-600 py-3.5">
                            {item.rendimiento.toFixed(1)}%
                          </TableCell>
                          <TableCell className="text-slate-700 dark:text-slate-300 font-medium py-3.5">{item.agente}</TableCell>
                          <TableCell className="text-center text-slate-500 py-3.5">
                            <span className="flex items-center justify-center gap-1">
                              <Calendar className="h-3.5 w-3.5 text-slate-400" />
                              {new Date(item.createdAt).toLocaleDateString("es-MX", { timeZone: 'America/Mexico_City' })}
                            </span>
                          </TableCell>
                          <TableCell className="text-center py-3.5 pr-4">
                            <Button
                              onClick={() => setSelectedQuote(item)}
                              size="sm"
                              className="bg-teal-600 hover:bg-teal-700 text-white font-bold h-7 px-2.5 flex items-center gap-1 mx-auto text-[10px]"
                            >
                              <Eye className="h-3.5 w-3.5" /> Ver Propuesta
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "agentes" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Main Grid: Columns layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* Left Column: Forms for Creation */}
            <div className="flex flex-col gap-6">
              
              {/* Form to create a new user credentials account */}
              <Card className="border shadow-sm bg-gradient-to-br from-white to-slate-50/30">
                <CardHeader className="py-4 border-b bg-slate-50/50">
                  <CardTitle className="text-sm font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="h-4.5 w-4.5 text-teal-600 animate-pulse" /> Crear Cuenta de Usuario
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Crea credenciales oficiales (correo y contraseña) para permitir acceso a la plataforma.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5">
                  <form onSubmit={handleCreateAgentUser} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 uppercase">Nombre Completo</label>
                      <Input 
                        type="text" 
                        placeholder="Ej. Miguel Angel Cruz" 
                        value={agentNameInput}
                        onChange={e => setAgentNameInput(e.target.value)}
                        className="text-xs h-9"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 uppercase">Correo Electrónico (Login)</label>
                      <Input 
                        type="email" 
                        placeholder="ejemplo@aacommx.com" 
                        value={agentEmailInput}
                        onChange={e => setAgentEmailInput(e.target.value)}
                        className="text-xs h-9"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 uppercase">Teléfono (Contacto)</label>
                      <Input 
                        type="tel" 
                        placeholder="Ej. 5512345678" 
                        value={agentPhoneInput}
                        onChange={e => setAgentPhoneInput(e.target.value)}
                        className="text-xs h-9"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 uppercase">Contraseña Acceso</label>
                      <Input 
                        type="password" 
                        placeholder="Mínimo 6 caracteres" 
                        value={agentPasswordInput}
                        onChange={e => setAgentPasswordInput(e.target.value)}
                        className="text-xs h-9"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 uppercase">Rol de Acceso</label>
                      <select 
                        value={agentRoleInput}
                        onChange={e => setAgentRoleInput(e.target.value)}
                        className="border p-2 rounded-lg w-full text-xs bg-white focus:outline-teal-500 h-9"
                      >
                        <option value="AGENTE">Agente de Seguros</option>
                        <option value="ADMIN">Administrador General</option>
                      </select>
                    </div>

                    {/* Checkbox to sync with Agent list (Cotizador) */}
                    <div className="flex items-center gap-2 py-1">
                      <input
                        type="checkbox"
                        id="sync-to-agent-checkbox"
                        checked={syncToAgentCheckbox}
                        onChange={e => setSyncToAgentCheckbox(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                      />
                      <label htmlFor="sync-to-agent-checkbox" className="text-[11px] font-bold text-slate-600 cursor-pointer">
                        Habilitar en el Cotizador (Nombre Agente)
                      </label>
                    </div>

                    {userRegistrationMessage && (
                      <p className={`text-xs font-bold text-center mt-2 ${userRegistrationMessage.includes("exitosamente") || userRegistrationMessage.includes("éxito") ? "text-teal-600" : "text-red-500"}`}>
                        {userRegistrationMessage}
                      </p>
                    )}

                    <Button 
                      type="submit" 
                      disabled={savingAgentUser}
                      className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold h-9 text-xs"
                    >
                      {savingAgentUser ? "Creando..." : "Registrar Cuenta"}
                    </Button>
                  </form>
                </CardContent>
              </Card>



            </div>

            {/* Right Column: Tables List (Credential accounts & Simple Cotizador list) */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              
              {/* User Accounts Dashboard (Credentials Table) */}
              <Card className="border shadow-sm overflow-hidden flex flex-col justify-between">
                <CardHeader className="py-4 border-b bg-slate-50/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-sm font-black text-slate-700 uppercase tracking-wider">
                      Cuentas de Usuarios con Acceso (Login)
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Administra el acceso del personal: activa/suspende cuentas, redefine contraseñas y elimina credenciales.
                    </CardDescription>
                  </div>

                  {currentUserData?.agency && (
                    <div className="flex flex-col items-start md:items-end gap-1.5 bg-white p-3 rounded-xl border border-slate-200 shadow-sm w-full md:w-auto">
                      <div className="flex items-center gap-2 text-xs font-black text-slate-700">
                        <Users className="h-4 w-4 text-indigo-500" />
                        Capacidad: {usersList.length} / {10 + (currentUserData.agency.purchasedSeats || 0)}
                      </div>
                      <p className="text-[10px] text-muted-foreground font-semibold">
                        (10 lugares base + {currentUserData.agency.purchasedSeats || 0} extra)
                      </p>
                      <Button 
                        size="sm" 
                        onClick={async () => {
                          try {
                            const res = await fetch('/api/checkout/seat', { method: 'POST' });
                            if (res.ok) {
                              const data = await res.json();
                              window.location.href = data.url;
                            } else {
                              alert("Error al iniciar la compra del asiento. Por favor contacta a soporte.");
                            }
                          } catch (err) {
                            alert("Error de conexión al servidor de pagos.");
                          }
                        }}
                        className="w-full mt-1 bg-teal-600 hover:bg-teal-700 text-white text-[10px] h-7 rounded-lg shadow-sm font-bold"
                      >
                        Aumentar Capacidad (+1 Lugar) - $299 MXN
                      </Button>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="p-0">
                  {loadingUsers ? (
                    <div className="p-12 text-center text-slate-400 text-xs">
                      <RefreshCw className="h-6 w-6 animate-spin text-teal-600 mx-auto mb-2" />
                      Cargando cuentas de usuarios...
                    </div>
                  ) : usersList.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 text-xs italic">
                      No hay cuentas de usuario registradas.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table className="text-xs">
                        <TableHeader className="bg-slate-50 font-bold">
                          <TableRow>
                            <TableHead className="font-bold py-3 pl-4">Usuario</TableHead>
                            <TableHead className="font-bold py-3">Contacto</TableHead>
                            <TableHead className="font-bold py-3 text-center">Rol</TableHead>
                            <TableHead className="font-bold py-3 text-center">Estatus</TableHead>
                            <TableHead className="font-bold py-3 text-center pr-4">Acciones Administrativas</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {usersList.map((user) => (
                            <TableRow key={user.id} className="hover:bg-slate-50/50 border-b">
                              {/* Name & Email */}
                              <TableCell className="py-3 pl-4 font-bold text-slate-800">
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="h-6 w-6 rounded-full bg-teal-600 text-white flex items-center justify-center font-black text-[9px] uppercase shadow-sm">
                                      {(user.name || "U").split(" ").map((w: string) => w[0]).slice(0, 2).join("")}
                                    </span>
                                    <span>{user.name || "Usuario Sin Nombre"}</span>
                                  </div>
                                  <span className="text-[10px] text-slate-400 font-normal block pl-7.5 mt-0.5">{user.email}</span>
                                </div>
                              </TableCell>
                              
                              {/* Contact Phone */}
                              <TableCell className="py-3 text-slate-600 font-medium">
                                {user.phone || <span className="text-slate-400 italic">No registrado</span>}
                              </TableCell>
                              
                              {/* Role */}
                              <TableCell className="py-3 text-center">
                                <span className={`inline-block px-2 py-0.5 rounded font-black text-[9px] uppercase border ${
                                  user.role === 'ADMIN' 
                                    ? "bg-purple-50 text-purple-700 border-purple-200" 
                                    : "bg-blue-50 text-blue-700 border-blue-200"
                                }`}>
                                  {user.role}
                                </span>
                              </TableCell>
                              
                              {/* Status Badge */}
                              <TableCell className="py-3 text-center">
                                <span className={`inline-block px-2 py-0.5 rounded font-bold text-[9px] uppercase border ${
                                  user.active 
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                                    : "bg-red-50 text-red-700 border-red-200"
                                }`}>
                                  {user.active ? "Activo" : "Suspendido"}
                                </span>
                              </TableCell>
                              
                              {/* Administrative Actions */}
                              <TableCell className="py-3 text-center pr-4">
                                {editingUserPasswordId === user.id ? (
                                  <div className="flex items-center justify-center gap-1.5 min-w-[200px] animate-in slide-in-from-right-1 duration-150">
                                    <Input
                                      type="password"
                                      placeholder="Nueva contraseña"
                                      value={newPasswordInput}
                                      onChange={(e) => setNewPasswordInput(e.target.value)}
                                      className="text-xs h-7 w-28 px-1.5 py-0.5 border-teal-400 focus-visible:ring-teal-400"
                                    />
                                    <Button
                                      onClick={() => handleUpdatePassword(user.id)}
                                      size="sm"
                                      className="bg-emerald-600 hover:bg-emerald-700 text-white h-7 px-2 font-bold text-[10px]"
                                    >
                                      ✔ Guardar
                                    </Button>
                                    <Button
                                      onClick={() => { setEditingUserPasswordId(null); setNewPasswordInput(""); }}
                                      variant="outline"
                                      size="sm"
                                      className="h-7 px-2 text-slate-500 font-bold text-[10px]"
                                    >
                                      ✕
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-center gap-1.5">
                                    <Button
                                      onClick={() => handleOpenEditProfileModal(user)}
                                      variant="outline"
                                      size="sm"
                                      className="text-teal-600 hover:text-teal-800 hover:bg-teal-50 font-bold text-[10px] h-7 px-2.5"
                                    >
                                      Editar Perfil
                                    </Button>
                                    <Button
                                      onClick={() => { setEditingUserPasswordId(user.id); setNewPasswordInput(""); }}
                                      variant="outline"
                                      size="sm"
                                      className="text-slate-600 hover:text-slate-800 font-bold text-[10px] h-7 px-2.5"
                                    >
                                      Cambiar Pass
                                    </Button>
                                    <Button
                                      onClick={() => handleToggleUserActive(user.id)}
                                      variant="outline"
                                      size="sm"
                                      className={`${user.active ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50" : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"} font-bold text-[10px] h-7 px-2.5`}
                                    >
                                      {user.active ? "Suspender" : "Activar"}
                                    </Button>
                                    <Button
                                      onClick={() => handleDeleteUser(user.id)}
                                      variant="ghost"
                                      size="sm"
                                      className="text-red-500 hover:text-red-600 hover:bg-red-50 font-bold text-[10px] h-7 px-2.5"
                                    >
                                      Eliminar
                                    </Button>
                                  </div>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Cotizador Agent List */}
              <Card className="border shadow-sm overflow-hidden flex flex-col justify-between">
                <CardHeader className="py-4 border-b bg-slate-50/50">
                  <CardTitle className="text-sm font-black text-slate-700 uppercase tracking-wider">
                    Nombres Autorizados en Cotizador
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Lista oficial de nombres que aparecen en el dropdown del Cotizador de propuestas técnicas.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {loadingAgents ? (
                    <div className="p-12 text-center text-slate-400 text-xs">
                      <RefreshCw className="h-6 w-6 animate-spin text-teal-600 mx-auto mb-2" />
                      Cargando lista de agentes del cotizador...
                    </div>
                  ) : dbAgentsList.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 text-xs italic">
                      No hay agentes registrados en la lista del Cotizador.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table className="text-xs">
                        <TableHeader className="bg-slate-50 font-bold">
                          <TableRow>
                            <TableHead className="font-bold py-3 pl-4">Nombre del Agente</TableHead>
                            <TableHead className="font-bold py-3">Fecha de Alta</TableHead>
                            <TableHead className="font-bold py-3 text-center pr-4">Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {dbAgentsList.map((agent) => (
                            <TableRow key={agent.id} className="hover:bg-slate-50/50 border-b">
                              <TableCell className="font-bold text-slate-800 py-3 pl-4">
                                <div className="flex items-center gap-1.5">
                                  <span className="h-6 w-6 rounded-full bg-slate-600 text-white flex items-center justify-center font-black text-[9px] uppercase shadow-sm">
                                    {agent.name.split(" ").map((w: string) => w[0]).slice(0, 2).join("")}
                                  </span>
                                  <span>{agent.name}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-slate-500 py-3 font-normal">
                                {new Date(agent.createdAt).toLocaleDateString("es-MX", { timeZone: 'America/Mexico_City',  day: "numeric", month: "long", year: "numeric" })}
                              </TableCell>
                              <TableCell className="text-center py-3 pr-4">
                                <Button
                                  onClick={() => handleDeleteAgent(agent.id)}
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-500 hover:text-red-600 hover:bg-red-50 font-bold text-xs h-7 px-2.5"
                                >
                                  Eliminar
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>

            </div>

          </div>

        </div>
      )}

      {activeTab === "adn" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* ADN Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="shadow-sm border-slate-100 bg-white dark:bg-zinc-900">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">Total de ADNs Guardados</span>
                  <span className="text-3xl font-black text-slate-800 dark:text-slate-100 mt-1 block">
                    {adnList.length}
                  </span>
                  <span className="text-xs text-slate-400 block mt-1">Diagnósticos patrimoniales</span>
                </div>
                <div className="h-12 w-12 bg-teal-50 dark:bg-zinc-800 text-teal-600 dark:text-teal-400 rounded-full flex items-center justify-center">
                  <Heart className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-slate-100 bg-white dark:bg-zinc-900">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">Cierres Exitosos (Pólizas)</span>
                  <span className="text-3xl font-black text-emerald-600 mt-1 block">
                    {adnList.filter(item => item.cerradaPagada).length}
                  </span>
                  <span className="text-xs text-slate-400 block mt-1">Propuestas aceptadas y pagadas</span>
                </div>
                <div className="h-12 w-12 bg-emerald-50 dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-slate-100 bg-white dark:bg-zinc-900">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">Efectividad de Cierre</span>
                  <span className="text-3xl font-black text-teal-600 mt-1 block">
                    {adnList.length > 0 
                      ? `${((adnList.filter(item => item.cerradaPagada).length / adnList.length) * 100).toFixed(1)}%`
                      : "0.0%"
                    }
                  </span>
                  <span className="text-xs text-slate-400 block mt-1">Ratio de éxito comercial</span>
                </div>
                <div className="h-12 w-12 bg-teal-50 dark:bg-zinc-800 text-teal-600 dark:text-teal-400 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ADN Diagnostics Accordion Section */}
          <Card className="border shadow-sm flex flex-col justify-between">
            <CardHeader className="py-4 border-b bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="text-sm font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Heart className="h-4.5 w-4.5 text-teal-600 animate-pulse" /> Historial de ADN
                </CardTitle>
                <CardDescription className="text-xs">
                  Consulta y descarga los diagnósticos patrimoniales de los clientes agrupados de manera estructurada.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {/* Filters Area */}
              <div className="flex flex-col md:flex-row gap-4 items-center bg-slate-50/40 dark:bg-zinc-900/30 p-4 rounded-xl border border-slate-100">
                <div className="w-full md:w-56 space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block font-black">Filtrar por Agente</label>
                  <select
                    value={adnAgentFilter}
                    onChange={(e) => setAdnAgentFilter(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs focus-visible:outline-none"
                  >
                    <option value="ALL">Todos los Agentes</option>
                    {usersList.map((u) => (
                      <option key={u.id} value={u.id}>{u.name || u.email}</option>
                    ))}
                  </select>
                </div>

                <div className="w-full md:w-44 space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block font-black">Fecha Inicio</label>
                  <Input
                    type="date"
                    value={adnStartDate}
                    onChange={(e) => setAdnStartDate(e.target.value)}
                    className="text-xs h-9"
                  />
                </div>

                <div className="w-full md:w-44 space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block font-black">Fecha Fin</label>
                  <Input
                    type="date"
                    value={adnEndDate}
                    onChange={(e) => setAdnEndDate(e.target.value)}
                    className="text-xs h-9"
                  />
                </div>

                <div className="w-full md:w-64 space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block font-black">Buscar por Cliente</label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <Input 
                      type="text" 
                      placeholder="Nombre del cliente..." 
                      value={searchAdnQuery}
                      onChange={e => setSearchAdnQuery(e.target.value)}
                      className="pl-8 text-xs h-9 rounded-lg"
                    />
                  </div>
                </div>

                <div className="w-full md:w-auto pt-5 flex gap-2">
                  {(adnAgentFilter !== "ALL" || adnStartDate !== "" || adnEndDate !== "" || searchAdnQuery !== "") && (
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setAdnAgentFilter("ALL")
                        setAdnStartDate("")
                        setAdnEndDate("")
                        setSearchAdnQuery("")
                      }}
                      className="text-red-500 hover:bg-red-50 hover:text-red-600 h-9 text-xs"
                    >
                      Limpiar
                    </Button>
                  )}
                </div>
              </div>

              {/* Grouped Accordions list */}
              <div>
                {loadingAdn ? (
                  <div className="text-center py-16 text-slate-400 text-xs">
                    <RefreshCw className="h-6 w-6 animate-spin text-teal-600 mx-auto mb-2" />
                    Cargando reportes estructurados de ADN...
                  </div>
                ) : adnList.length === 0 ? (
                  <div className="text-center py-16 text-slate-400 text-xs italic bg-slate-50/10 rounded-xl">
                    No se registran diagnósticos ADN con los filtros seleccionados.
                  </div>
                ) : (
                  (() => {
                    // Filter ADN diagnostics first
                    const filteredAdns = adnList.filter(item => {
                      const query = searchAdnQuery.toLowerCase().trim()
                      const matchesSearch = !query || 
                        item.clienteNombre.toLowerCase().includes(query) ||
                        (item.user?.name || "").toLowerCase().includes(query) ||
                        (item.user?.email || "").toLowerCase().includes(query);

                      const matchesAgent = adnAgentFilter === "ALL" || item.userId === adnAgentFilter;

                      // CreatedAt comparison
                      const itemDateStr = new Date(item.createdAt).toISOString().split('T')[0]
                      const matchesStartDate = !adnStartDate || itemDateStr >= adnStartDate;
                      const matchesEndDate = !adnEndDate || itemDateStr <= adnEndDate;

                      return matchesSearch && matchesAgent && matchesStartDate && matchesEndDate;
                    });

                    if (filteredAdns.length === 0) {
                      return (
                        <div className="text-center py-12 text-slate-400 text-xs italic bg-slate-50/25 border rounded-xl">
                          Ningún diagnóstico coincide con los filtros de búsqueda aplicados.
                        </div>
                      )
                    }

                    // Helper to group ADNs by Agent and Date
                    const groups: Record<string, {
                      agentName: string;
                      agentEmail: string;
                      agentId: string;
                      dates: Record<string, any[]>;
                      totalDiagnostics: number;
                      closedDiagnostics: number;
                    }> = {};

                    filteredAdns.forEach(item => {
                      const userId = item.userId;
                      const name = item.user?.name || item.user?.email || "Agente";
                      const email = item.user?.email || "";
                      const dateStr = new Date(item.createdAt).toISOString().split('T')[0]

                      if (!groups[userId]) {
                        groups[userId] = {
                          agentName: name,
                          agentEmail: email,
                          agentId: userId,
                          dates: {},
                          totalDiagnostics: 0,
                          closedDiagnostics: 0
                        };
                      }

                      if (!groups[userId].dates[dateStr]) {
                        groups[userId].dates[dateStr] = [];
                      }

                      groups[userId].dates[dateStr].push(item);
                      groups[userId].totalDiagnostics += 1;
                      if (item.cerradaPagada) {
                        groups[userId].closedDiagnostics += 1;
                      }
                    });

                    const groupedAdns = Object.values(groups).map(g => ({
                      ...g,
                      dates: Object.entries(g.dates).map(([dateStr, dateItems]) => ({
                        dateStr,
                        diagnostics: dateItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
                      })).sort((a, b) => b.dateStr.localeCompare(a.dateStr))
                    })).sort((a, b) => b.totalDiagnostics - a.totalDiagnostics);

                    return (
                      <div className="space-y-3">
                        {groupedAdns.map((agentGroup) => {
                          const isAgentExpanded = expandedAdnAgents[agentGroup.agentId];

                          return (
                            <Card key={agentGroup.agentId} className="shadow-sm border border-slate-200 dark:border-zinc-800 overflow-hidden hover:shadow-md transition-shadow">
                              {/* Agent Header Block */}
                              <div 
                                onClick={() => setExpandedAdnAgents(prev => ({ ...prev, [agentGroup.agentId]: !isAgentExpanded }))}
                                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50/50 dark:bg-zinc-900/30 cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors gap-3 select-none animate-in fade-in duration-200"
                              >
                                <div className="flex items-center gap-3">
                                  <span className="h-9 w-9 rounded-full bg-teal-500 text-white flex items-center justify-center font-black text-xs uppercase shadow-inner">
                                    {agentGroup.agentName.split(" ").map(w => w[0]).slice(0, 2).join("")}
                                  </span>
                                  <div>
                                    <h3 className="font-extrabold text-slate-800 dark:text-zinc-100 text-xs sm:text-sm">
                                      {agentGroup.agentName}
                                    </h3>
                                    <span className="text-[9px] text-slate-400 block mt-0.5">
                                      {agentGroup.agentEmail}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-[9px] font-black bg-teal-50 dark:bg-teal-950/20 text-teal-700 dark:text-teal-400 border border-teal-200 px-2 py-1 rounded-full uppercase tracking-wider">
                                    {agentGroup.totalDiagnostics} ADNs
                                  </span>
                                  {agentGroup.closedDiagnostics > 0 && (
                                    <span className="text-[9px] font-black bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 px-2 py-1 rounded-full uppercase tracking-wider">
                                      {agentGroup.closedDiagnostics} Cierres
                                    </span>
                                  )}
                                  <svg 
                                    xmlns="http://www.w3.org/2000/svg" 
                                    fill="none" 
                                    viewBox="0 0 24 24" 
                                    strokeWidth={3} 
                                    stroke="currentColor" 
                                    className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isAgentExpanded ? 'rotate-180' : ''}`}
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                                  </svg>
                                </div>
                              </div>

                              {/* Agent Expanded Content */}
                              {isAgentExpanded && (
                                <CardContent className="p-4 bg-white dark:bg-zinc-950 border-t space-y-3 animate-in slide-in-from-top-1 duration-200">
                                  {agentGroup.dates.map((dateGroup) => {
                                    const dateKey = `${agentGroup.agentId}_${dateGroup.dateStr}`;
                                    const isDateExpanded = expandedAdnDates[dateKey];

                                    // Format Date beautifully
                                    const dParts = dateGroup.dateStr.split('-')
                                    const dObj = new Date(Number(dParts[0]), Number(dParts[1]) - 1, Number(dParts[2]))
                                    const prettyDate = dObj.toLocaleDateString("es-MX", { timeZone: 'America/Mexico_City',  weekday: "long", day: "numeric", month: "long" })

                                    return (
                                      <div key={dateGroup.dateStr} className="border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
                                        {/* Date Header Accordion */}
                                        <div 
                                          onClick={() => setExpandedAdnDates(prev => ({ ...prev, [dateKey]: !isDateExpanded }))}
                                          className="flex items-center justify-between px-3.5 py-2 bg-slate-50/30 dark:bg-zinc-900/10 cursor-pointer hover:bg-slate-50/80 dark:hover:bg-zinc-900/40 select-none text-xs"
                                        >
                                          <span className="font-bold text-slate-700 dark:text-zinc-300 capitalize flex items-center gap-1.5 font-black">
                                            <Calendar className="h-3.5 w-3.5 text-teal-600" /> {prettyDate}
                                          </span>
                                          <div className="flex items-center gap-2">
                                            <span className="text-[9px] font-black bg-slate-100 dark:bg-zinc-800 text-slate-600 border px-2 py-0.5 rounded">
                                              {dateGroup.diagnostics.length} adn(s)
                                            </span>
                                            <svg 
                                              xmlns="http://www.w3.org/2000/svg" 
                                              fill="none" 
                                              viewBox="0 0 24 24" 
                                              strokeWidth={3} 
                                              stroke="currentColor" 
                                              className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${isDateExpanded ? 'rotate-180' : ''}`}
                                            >
                                              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                                            </svg>
                                          </div>
                                        </div>

                                        {/* Date Expanded Diagnostics details */}
                                        {isDateExpanded && (
                                          <div className="p-3 bg-white dark:bg-zinc-950 border-t space-y-2 animate-in slide-in-from-top-1 duration-150">
                                            {dateGroup.diagnostics.map((adn) => (
                                              <div key={adn.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 bg-slate-50/20 dark:bg-zinc-900/5 hover:bg-slate-50/50 dark:hover:bg-zinc-900/20 rounded-xl border border-slate-100 dark:border-zinc-900 gap-3 text-xs">
                                                <div className="space-y-1">
                                                  <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-extrabold text-slate-800 dark:text-zinc-200">
                                                      👤 Cliente: {adn.clienteNombre} ({adn.clienteEdad} años)
                                                    </span>
                                                    <span className="text-[9px] text-slate-400 font-bold">
                                                      Registrado: {new Date(adn.createdAt).toLocaleTimeString("es-MX", { timeZone: 'America/Mexico_City',  hour: "2-digit", minute: "2-digit" })}
                                                    </span>
                                                  </div>
                                                  <div className="flex items-center gap-2">
                                                    <span className="px-2 py-0.5 rounded bg-teal-50 dark:bg-teal-950/20 text-teal-700 dark:text-teal-400 font-bold text-[9px] uppercase border">
                                                      Modalidad: {adn.modalidad}
                                                    </span>
                                                  </div>
                                                </div>

                                                <div className="flex items-center justify-end gap-3">
                                                  {/* Estatus Cierre toggle button */}
                                                  <button
                                                    onClick={() => handleToggleAdnClosed(adn.id)}
                                                    className={`inline-block px-2.5 py-1 rounded-full font-bold text-[9px] uppercase border transition-colors ${
                                                      adn.cerradaPagada 
                                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" 
                                                        : "bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100"
                                                    }`}
                                                    title="Haz clic para alternar estatus de cierre"
                                                  >
                                                    {adn.cerradaPagada ? "✓ Cerrada y Pagada" : "Pendiente"}
                                                  </button>
                                                  {adn.latitude && adn.longitude && (
                                                    <a
                                                      href={`https://www.google.com/maps?q=${adn.latitude},${adn.longitude}`}
                                                      target="_blank"
                                                      rel="noopener noreferrer"
                                                      className="text-blue-600 hover:text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 font-black text-[10px] uppercase flex items-center gap-1 px-2.5 py-1.5 rounded-md transition-colors"
                                                      title="Abrir ubicación GPS en Google Maps"
                                                    >
                                                      📍 Mapa
                                                    </a>
                                                  )}

                                                  <Button
                                                    onClick={() => setSelectedAdn(adn)}
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-teal-600 hover:text-teal-700 hover:bg-teal-50 dark:hover:bg-teal-950/20 font-black text-xs flex items-center gap-1"
                                                  >
                                                    <Eye className="h-3.5 w-3.5" /> Ver Diagnóstico
                                                  </Button>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    )
                                  })}
                                </CardContent>
                              )}
                            </Card>
                          )
                        })}
                      </div>
                    )
                  })()
                )}
              </div>
            </CardContent>
          </Card>

        </div>
      )}

      {activeTab === "comunicados" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* Left Column: Form to upload a new announcement banner */}
            <Card className="border shadow-sm bg-gradient-to-br from-white to-slate-50/30">
              <CardHeader className="py-4 border-b bg-slate-50/50">
                <CardTitle className="text-sm font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-4.5 w-4.5 text-amber-500 animate-pulse" /> Subir Nuevo Comunicado
                </CardTitle>
                <CardDescription className="text-xs">
                  Sube una imagen JPG, PNG o GIF (menor de 5 MB) con anuncios, metas o avisos para la página de inicio.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 uppercase">Enlace Opcional (URL al hacer clic)</label>
                  <Input 
                    type="url" 
                    placeholder="https://ejemplo.com/comunicado-meta" 
                    value={announcementLinkInput}
                    onChange={e => setAnnouncementLinkInput(e.target.value)}
                    className="text-xs h-9"
                    disabled={savingAnnouncement}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 uppercase block">Seleccionar Imagen (JPG, PNG, GIF)</label>
                  <div className="flex items-center justify-center w-full">
                    <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all hover:bg-slate-50 ${
                      savingAnnouncement ? "opacity-50 pointer-events-none" : "border-slate-300 hover:border-teal-500"
                    }`}>
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Download className="w-8 h-8 text-slate-400 mb-2" />
                        <p className="text-[10px] text-slate-500 font-bold uppercase">Haz clic para buscar imagen</p>
                        <p className="text-[9px] text-slate-400">JPG, PNG o GIF hasta 5 MB</p>
                      </div>
                      <input 
                        type="file" 
                        accept="image/jpeg,image/png,image/gif"
                        onChange={handleUploadAnnouncement}
                        className="hidden" 
                        disabled={savingAnnouncement}
                      />
                    </label>
                  </div>
                </div>

                {announcementMsg && (
                  <p className={`text-xs font-bold text-center mt-2 ${
                    announcementMsg.includes("Error") ? "text-red-500" : "text-teal-600 animate-pulse"
                  }`}>
                    {announcementMsg}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Right Column: Grid list of Active & Inactive Announcements */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="border shadow-sm overflow-hidden">
                <CardHeader className="py-4 border-b bg-slate-50/50">
                  <CardTitle className="text-sm font-black text-slate-700 uppercase tracking-wider">
                    Galería de Banners de Inicio
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Revisa las imágenes de avisos activas en la página principal. Puedes pausar su visualización o eliminarlas definitivamente.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  {loadingAnnouncements ? (
                    <div className="text-center py-12 text-slate-400 text-xs">
                      <RefreshCw className="h-6 w-6 animate-spin text-teal-600 mx-auto mb-2" />
                      Cargando comunicados...
                    </div>
                  ) : announcements.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-xs italic">
                      No hay imágenes de comunicados o avisos registradas en la página de inicio.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {announcements.map((ad) => (
                        <div key={ad.id} className={`border rounded-xl overflow-hidden bg-slate-50 dark:bg-zinc-800 shadow-sm transition-all flex flex-col justify-between ${
                          !ad.active ? "opacity-60 border-dashed" : "border-slate-200"
                        }`}>
                          
                          {/* Image Preview Container */}
                          <div className="relative aspect-video w-full overflow-hidden bg-slate-200 flex items-center justify-center border-b">
                            <img 
                              src={ad.imageUrl} 
                              alt="Anuncio de Inicio" 
                              className="w-full h-full object-cover" 
                            />
                            {!ad.active && (
                              <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center">
                                <span className="px-2.5 py-1 rounded bg-amber-500 text-white font-black text-[9px] uppercase tracking-wider shadow">
                                  Pausado (Oculto)
                                </span>
                              </div>
                            )}
                          </div>
                          
                          {/* Details and Actions */}
                          <div className="p-4 space-y-3">
                            <div className="text-[10px] text-slate-400 font-semibold flex justify-between items-center">
                              <span>Subido: {new Date(ad.createdAt).toLocaleDateString("es-MX", { timeZone: 'America/Mexico_City',  day: "numeric", month: "short" })}</span>
                              <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                                ad.active ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                              }`}>
                                {ad.active ? "Activo" : "Inactivo"}
                              </span>
                            </div>

                            {ad.linkUrl && (
                              <p className="text-[10px] text-teal-600 truncate font-semibold">
                                Enlace: <a href={ad.linkUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">{ad.linkUrl}</a>
                              </p>
                            )}

                            <div className="flex gap-2 pt-1 border-t">
                              <Button
                                onClick={() => handleToggleAnnouncementActive(ad.id)}
                                variant="outline"
                                size="sm"
                                className={`flex-1 font-bold text-[10px] h-7 px-2.5 ${
                                  ad.active ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50" : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                }`}
                              >
                                {ad.active ? "Pausar" : "Mostrar"}
                              </Button>
                              <Button
                                onClick={() => handleDeleteAnnouncement(ad.id)}
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-600 hover:bg-red-50 font-bold text-[10px] h-7 px-2.5"
                              >
                                Eliminar
                              </Button>
                            </div>
                          </div>

                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

          </div>

        </div>
      )}

      {/* TAB CONTENT 6: AACOM 25 ACTIVITY REPORT */}
      {activeTab === "actividad" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <Card className="border shadow-sm">
            <CardHeader className="py-4 border-b bg-slate-50/50">
              <CardTitle className="text-sm font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <ClipboardCheck className="h-4.5 w-4.5 text-teal-600" /> Reporte de Actividad Comercial 25
              </CardTitle>
              <CardDescription className="text-xs">
                Audita y visualiza a nivel detallado la actividad incremental diaria, llamadas y prospectos ingresados por tus agentes.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {/* Filters Area */}
              <div className="flex flex-col md:flex-row gap-4 items-center bg-slate-50/40 dark:bg-zinc-900/30 p-4 rounded-xl border border-slate-100">
                <div className="w-full md:w-56 space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Filtrar por Agente</label>
                  <select
                    value={reportAgentFilter}
                    onChange={(e) => setReportAgentFilter(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs focus-visible:outline-none"
                  >
                    <option value="ALL">Todos los Agentes</option>
                    {usersList.map((u) => (
                      <option key={u.id} value={u.id}>{u.name || u.email}</option>
                    ))}
                  </select>
                </div>

                <div className="w-full md:w-44 space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Fecha Inicio</label>
                  <Input
                    type="date"
                    value={reportStartDate}
                    onChange={(e) => setReportStartDate(e.target.value)}
                    className="text-xs h-9"
                  />
                </div>

                <div className="w-full md:w-44 space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Fecha Fin</label>
                  <Input
                    type="date"
                    value={reportEndDate}
                    onChange={(e) => setReportEndDate(e.target.value)}
                    className="text-xs h-9"
                  />
                </div>

                <div className="w-full md:w-auto pt-5 flex gap-2">
                  <Button 
                    onClick={fetchActivityLogsList} 
                    className="bg-teal-600 hover:bg-teal-700 text-white font-bold h-9 text-xs"
                    disabled={loadingActivityLogs}
                  >
                    <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loadingActivityLogs ? 'animate-spin' : ''}`} /> Filtrar Actividades
                  </Button>
                  
                  {(reportAgentFilter !== "ALL" || reportStartDate !== "" || reportEndDate !== "") && (
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setReportAgentFilter("ALL")
                        setReportStartDate("")
                        setReportEndDate("")
                        // Load all
                        setTimeout(() => fetchActivityLogsList(), 50)
                      }}
                      className="text-red-500 hover:bg-red-50 hover:text-red-600 h-9 text-xs"
                    >
                      Limpiar
                    </Button>
                  )}
                </div>
              </div>

              {/* Statistics Panel */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-zinc-900 border rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-bold text-slate-500 uppercase block">Total Puntos Sumados</span>
                    <span className="text-xl font-black text-slate-800 dark:text-zinc-100 block mt-1">
                      {activityLogs.reduce((acc, log) => acc + log.points, 0)} pts
                    </span>
                  </div>
                  <ClipboardCheck className="h-7 w-7 text-teal-600" />
                </div>

                <div className="p-4 bg-slate-50 dark:bg-zinc-900 border rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-bold text-slate-500 uppercase block">Días con Actividad</span>
                    <span className="text-xl font-black text-slate-800 dark:text-zinc-100 block mt-1">
                      {new Set(activityLogs.map(l => `${l.userId}_${l.dateStr}`)).size} días
                    </span>
                  </div>
                  <Calendar className="h-7 w-7 text-teal-600" />
                </div>

                <div className="p-4 bg-slate-50 dark:bg-zinc-900 border rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-bold text-slate-500 uppercase block">Promedio de Puntos Diario</span>
                    <span className="text-xl font-black text-slate-800 dark:text-zinc-100 block mt-1">
                      {(() => {
                        const days = new Set(activityLogs.map(l => `${l.userId}_${l.dateStr}`)).size
                        const pts = activityLogs.reduce((acc, log) => acc + log.points, 0)
                        return days > 0 ? (pts / days).toFixed(1) : 0
                      })()} pts
                    </span>
                  </div>
                  <TrendingUp className="h-7 w-7 text-teal-600" />
                </div>
              </div>

              {/* Grouped Accordion and Monthly cumulative view */}
              <div className="space-y-6">
                {/* 1. Monthly Cumulative Report (If specific agent selected in main filter) */}
                {reportAgentFilter !== "ALL" && (
                  (() => {
                    const now = new Date()
                    const year = now.getFullYear()
                    const month = String(now.getMonth() + 1).padStart(2, '0')
                    const monthStr = `${year}-${month}`
                    const monthName = now.toLocaleDateString("es-MX", { timeZone: 'America/Mexico_City',  month: "long", year: "numeric" })
                    
                    const agentLogs = activityLogs.filter(log => log.userId === reportAgentFilter)
                    const agentName = usersList.find(u => u.id === reportAgentFilter)?.name || "Agente"

                    // Monthly cumulative
                    const monthlyLogs = agentLogs.filter(log => log.dateStr.startsWith(monthStr))
                    const monthlyCitasEfectivas = monthlyLogs.filter(log => log.activityId === "3")
                    const monthlyCitasAgendadas = monthlyLogs.filter(log => log.activityId === "2")

                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
                        {/* Citas Efectivas Card */}
                        <Card className="border-t-4 border-t-emerald-500 shadow-md">
                          <CardHeader className="pb-3 flex flex-row items-center justify-between">
                            <div>
                              <CardTitle className="text-sm font-black text-slate-800 dark:text-zinc-100 uppercase tracking-wider">
                                Citas Efectivas Acumuladas
                              </CardTitle>
                              <CardDescription className="text-[10px]">
                                {monthName} • {agentName}
                              </CardDescription>
                            </div>
                            <div className="h-10 w-10 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center font-black text-lg">
                              {monthlyCitasEfectivas.length}
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">Historial de Citas Efectivas este mes:</span>
                            {monthlyCitasEfectivas.length === 0 ? (
                              <p className="text-xs text-slate-400 italic py-2 text-center">Sin citas efectivas registradas este mes.</p>
                            ) : (
                              <div className="max-h-44 overflow-y-auto space-y-2 pr-1">
                                {monthlyCitasEfectivas.map(log => (
                                  <div key={log.id} className="flex justify-between items-center bg-emerald-50/40 dark:bg-emerald-950/10 px-3 py-2.5 rounded-xl border border-emerald-100/50 dark:border-emerald-900/30 text-xs">
                                    <div className="space-y-0.5">
                                      <span className="font-extrabold text-slate-800 dark:text-zinc-200 block">
                                        👥 {log.prospectName || "Sin Nombre"}
                                      </span>
                                      <span className="text-[9px] text-slate-400 block">
                                        Registrado: {new Date(log.createdAt).toLocaleTimeString("es-MX", { timeZone: 'America/Mexico_City',  hour: "2-digit", minute: "2-digit" })}
                                      </span>
                                    </div>
                                    <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-white dark:bg-zinc-900 px-2 py-0.5 rounded border border-emerald-200">
                                      {log.dateStr}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </CardContent>
                        </Card>

                        {/* Citas Agendadas Card */}
                        <Card className="border-t-4 border-t-orange-500 shadow-md">
                          <CardHeader className="pb-3 flex flex-row items-center justify-between">
                            <div>
                              <CardTitle className="text-sm font-black text-slate-800 dark:text-zinc-100 uppercase tracking-wider">
                                Citas Agendadas
                              </CardTitle>
                              <CardDescription className="text-[10px]">
                                {monthName} • {agentName}
                              </CardDescription>
                            </div>
                            <div className="h-10 w-10 bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 rounded-full flex items-center justify-center font-black text-lg">
                              {monthlyCitasAgendadas.length}
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">Historial de Citas Agendadas este mes:</span>
                            {monthlyCitasAgendadas.length === 0 ? (
                              <p className="text-xs text-slate-400 italic py-2 text-center">Sin citas agendadas registradas este mes.</p>
                            ) : (
                              <div className="max-h-44 overflow-y-auto space-y-2 pr-1">
                                {monthlyCitasAgendadas.map(log => (
                                  <div key={log.id} className="flex justify-between items-center bg-orange-50/40 dark:bg-orange-950/10 px-3 py-2.5 rounded-xl border border-orange-100/50 dark:border-orange-900/30 text-xs">
                                    <div className="space-y-0.5">
                                      <span className="font-extrabold text-slate-800 dark:text-zinc-200 block">
                                        📅 {log.prospectName || "Sin Nombre"}
                                      </span>
                                      <span className="text-[9px] text-slate-400 block">
                                        Registrado: {new Date(log.createdAt).toLocaleTimeString("es-MX", { timeZone: 'America/Mexico_City',  hour: "2-digit", minute: "2-digit" })}
                                      </span>
                                    </div>
                                    <span className="text-[10px] font-black text-orange-600 dark:text-orange-400 bg-white dark:bg-zinc-900 px-2 py-0.5 rounded border border-orange-200">
                                      {log.dateStr}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    )
                  })()
                )}

                {/* 2. Three-Tier Collapsible Activity Logs List (Agent -> Date -> Details) */}
                <div className="space-y-4">
                  {loadingActivityLogs ? (
                    <Card className="shadow-sm">
                      <CardContent className="text-center py-16 text-slate-400 text-xs">
                        <RefreshCw className="h-6 w-6 animate-spin text-teal-600 mx-auto mb-2" />
                        Cargando reporte estructurado de actividades...
                      </CardContent>
                    </Card>
                  ) : activityLogs.length === 0 ? (
                    <Card className="shadow-sm">
                      <CardContent className="text-center py-16 text-slate-400 text-xs italic bg-slate-50/10">
                        No se registran actividades con los filtros seleccionados.
                      </CardContent>
                    </Card>
                  ) : (
                    (() => {
                      // Helper to group logs inside render
                      const groups: Record<string, {
                        agentName: string;
                        agentEmail: string;
                        agentId: string;
                        dates: Record<string, any[]>;
                        totalPoints: number;
                      }> = {};

                      activityLogs.forEach(log => {
                        const userId = log.userId;
                        const name = log.user?.name || log.user?.email || "Agente";
                        const email = log.user?.email || "";
                        const date = log.dateStr;

                        if (!groups[userId]) {
                          groups[userId] = {
                            agentName: name,
                            agentEmail: email,
                            agentId: userId,
                            dates: {},
                            totalPoints: 0
                          };
                        }

                        if (!groups[userId].dates[date]) {
                          groups[userId].dates[date] = [];
                        }

                        groups[userId].dates[date].push(log);
                        groups[userId].totalPoints += log.points;
                      });

                      const groupedData = Object.values(groups).map(g => ({
                        ...g,
                        dates: Object.entries(g.dates).map(([dateStr, dateLogs]) => ({
                          dateStr,
                          logs: dateLogs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
                          totalPoints: dateLogs.reduce((sum, l) => sum + l.points, 0)
                        })).sort((a, b) => b.dateStr.localeCompare(a.dateStr))
                      })).sort((a, b) => b.totalPoints - a.totalPoints);

                      // Date helpers for monthly stats
                      const now = new Date()
                      const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

                      return (
                        <div className="space-y-3">
                          {groupedData.map((agentGroup) => {
                            const isAgentExpanded = expandedAgents[agentGroup.agentId];
                            
                            // Calculate monthly stats for the badge
                            const agentMonthLogs = activityLogs.filter(l => l.userId === agentGroup.agentId && l.dateStr.startsWith(currentMonthStr));
                            const monthCitasEfectivasCount = agentMonthLogs.filter(l => l.activityId === "3").length;
                            const monthCitasAgendadasCount = agentMonthLogs.filter(l => l.activityId === "2").length;

                            return (
                              <Card key={agentGroup.agentId} className="shadow-sm border border-slate-200 dark:border-zinc-800 overflow-hidden hover:shadow-md transition-shadow">
                                {/* Agent Header Block */}
                                <div 
                                  onClick={() => setExpandedAgents(prev => ({ ...prev, [agentGroup.agentId]: !isAgentExpanded }))}
                                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50/50 dark:bg-zinc-900/30 cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors gap-3 select-none animate-in fade-in duration-200"
                                >
                                  <div className="flex items-center gap-3">
                                    <span className="h-9 w-9 rounded-full bg-teal-500 text-white flex items-center justify-center font-black text-xs uppercase shadow-inner">
                                      {agentGroup.agentName.split(" ").map(w => w[0]).slice(0, 2).join("")}
                                    </span>
                                    <div>
                                      <h3 className="font-extrabold text-slate-800 dark:text-zinc-100 text-xs sm:text-sm">
                                        {agentGroup.agentName}
                                      </h3>
                                      <span className="text-[9px] text-slate-400 block mt-0.5">
                                        {agentGroup.agentEmail}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex flex-wrap items-center gap-2">
                                    {/* Monthly metrics badges */}
                                    <span className="text-[9px] font-black bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 px-2 py-1 rounded-full uppercase tracking-wider">
                                      {monthCitasEfectivasCount} Citas Efectivas
                                    </span>
                                    {monthCitasAgendadasCount > 0 && (
                                      <span className="text-[9px] font-black bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-400 border border-orange-200 px-2 py-1 rounded-full uppercase tracking-wider">
                                        {monthCitasAgendadasCount} Agendadas
                                      </span>
                                    )}
                                    <span className="text-[10px] font-black bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 border px-2.5 py-1 rounded-full">
                                      {agentGroup.totalPoints} pts
                                    </span>
                                    <svg 
                                      xmlns="http://www.w3.org/2000/svg" 
                                      fill="none" 
                                      viewBox="0 0 24 24" 
                                      strokeWidth={3} 
                                      stroke="currentColor" 
                                      className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isAgentExpanded ? 'rotate-180' : ''}`}
                                    >
                                      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                                    </svg>
                                  </div>
                                </div>

                                {/* Agent Expanded Content */}
                                {isAgentExpanded && (
                                  <CardContent className="p-4 bg-white dark:bg-zinc-950 border-t space-y-4 animate-in slide-in-from-top-1 duration-200">
                                    {/* 2.1 Agent Monthly Cumulative Citas inside collapsed card for convenience */}
                                    {reportAgentFilter === "ALL" && (
                                      <div className="p-3 bg-slate-50 dark:bg-zinc-900 border rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-inner">
                                        <div className="space-y-0.5">
                                          <span className="text-[9px] font-black text-teal-600 dark:text-teal-400 uppercase tracking-widest block font-black">Resumen Acumulado de Citas</span>
                                          <span className="text-[10px] text-slate-500 font-bold block">
                                            Actividad total en el mes de {now.toLocaleDateString("es-MX", { timeZone: 'America/Mexico_City',  month: "long", year: "numeric" })}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs font-bold text-slate-700 dark:text-zinc-300">
                                          <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-950 border px-3 py-1.5 rounded-xl shadow-sm">
                                            <span className="h-2 w-2 rounded-full bg-emerald-500 block animate-pulse" />
                                            <span>Efectivas: <strong className="text-emerald-600 text-sm font-black">{monthCitasEfectivasCount}</strong></span>
                                          </div>
                                          <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-950 border px-3 py-1.5 rounded-xl shadow-sm">
                                            <span className="h-2 w-2 rounded-full bg-orange-500 block" />
                                            <span>Agendadas: <strong className="text-orange-600 text-sm font-black">{monthCitasAgendadasCount}</strong></span>
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {/* 2.2 Collapsible Dates list */}
                                    <div className="space-y-2">
                                      <span className="text-[10px] font-black text-slate-400 uppercase block tracking-wider">Historial diario detallado:</span>
                                      {agentGroup.dates.map((dateGroup) => {
                                        const dateKey = `${agentGroup.agentId}_${dateGroup.dateStr}`;
                                        const isDateExpanded = expandedDates[dateKey];

                                        // Format Date beautifully
                                        const dParts = dateGroup.dateStr.split('-')
                                        const dObj = new Date(Number(dParts[0]), Number(dParts[1]) - 1, Number(dParts[2]))
                                        const prettyDate = dObj.toLocaleDateString("es-MX", { timeZone: 'America/Mexico_City',  weekday: "long", day: "numeric", month: "long" })

                                        return (
                                          <div key={dateGroup.dateStr} className="border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
                                            {/* Date Header Accordion */}
                                            <div 
                                              onClick={() => setExpandedDates(prev => ({ ...prev, [dateKey]: !isDateExpanded }))}
                                              className="flex items-center justify-between px-3.5 py-2.5 bg-slate-50/30 dark:bg-zinc-900/10 cursor-pointer hover:bg-slate-50/80 dark:hover:bg-zinc-900/40 select-none text-xs"
                                            >
                                              <span className="font-bold text-slate-700 dark:text-zinc-300 capitalize flex items-center gap-1.5">
                                                <Calendar className="h-3.5 w-3.5 text-teal-600" /> {prettyDate}
                                              </span>
                                              <div className="flex items-center gap-2">
                                                <span className="text-[9px] font-black bg-slate-100 dark:bg-zinc-800 text-slate-600 border px-2 py-0.5 rounded">
                                                  {dateGroup.logs.length} act
                                                </span>
                                                <span className="text-[10px] font-black text-teal-700 dark:text-teal-400">
                                                  +{dateGroup.totalPoints} pts
                                                </span>
                                                <svg 
                                                  xmlns="http://www.w3.org/2000/svg" 
                                                  fill="none" 
                                                  viewBox="0 0 24 24" 
                                                  strokeWidth={3} 
                                                  stroke="currentColor" 
                                                  className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${isDateExpanded ? 'rotate-180' : ''}`}
                                                >
                                                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                                                </svg>
                                              </div>
                                            </div>

                                            {/* Date Expanded Logs details */}
                                            {isDateExpanded && (
                                              <div className="p-3 bg-white dark:bg-zinc-950 border-t space-y-2 animate-in slide-in-from-top-1 duration-150">
                                                {dateGroup.logs.map((log) => (
                                                  <div key={log.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 bg-slate-50/20 dark:bg-zinc-900/5 hover:bg-slate-50/50 dark:hover:bg-zinc-900/20 rounded-xl border border-slate-100 dark:border-zinc-900 gap-3 text-xs">
                                                    <div className="flex items-start gap-2.5">
                                                      {/* Micro icon for activity */}
                                                      <span className="mt-0.5 p-1.5 bg-white dark:bg-zinc-900 rounded border shadow-sm shrink-0">
                                                        {(() => {
                                                          switch (log.activityId) {
                                                            case "1": return <span className="text-blue-500 font-extrabold text-[10px]" title="Llamada">📞</span>
                                                            case "2": return <span className="text-orange-500 font-extrabold text-[10px]" title="Agendada">📅</span>
                                                            case "3": return <span className="text-amber-500 font-extrabold text-[10px]" title="Efectiva">🤝</span>
                                                            case "4": return <span className="text-emerald-500 font-extrabold text-[10px]" title="Cierre">💼</span>
                                                            case "5": return <span className="text-indigo-500 font-extrabold text-[10px]" title="Referido">👥</span>
                                                            case "6": return <span className="text-purple-500 font-extrabold text-[10px]" title="Emitida">📝</span>
                                                            case "7": return <span className="text-teal-500 font-extrabold text-[10px]" title="RDA">🏆</span>
                                                            default: return <span className="text-slate-500 font-extrabold text-[10px]">➕</span>
                                                          }
                                                        })()}
                                                      </span>
                                                      <div className="space-y-0.5">
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                          <span className="font-extrabold text-slate-800 dark:text-zinc-200">
                                                            {log.activityName}
                                                          </span>
                                                          <span className="text-[9px] text-slate-400">
                                                            {new Date(log.createdAt).toLocaleTimeString("es-MX", { timeZone: 'America/Mexico_City',  hour: "2-digit", minute: "2-digit" })}
                                                          </span>
                                                        </div>
                                                        {log.prospectName ? (
                                                          <span className="text-teal-600 dark:text-teal-400 font-extrabold text-[10px] block">
                                                            👤 Prospecto: {log.prospectName}
                                                          </span>
                                                        ) : (
                                                          <span className="text-slate-400 italic text-[10px] block">Sin prospecto registrado</span>
                                                        )}
                                                      </div>
                                                    </div>

                                                    <div className="flex items-center justify-end gap-2.5">
                                                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-black bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 border">
                                                        +{log.points} pts
                                                      </span>
                                                      <Button
                                                        onClick={() => handleDeleteActivityLog(log.id)}
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 p-1 h-7 rounded"
                                                        title="Eliminar registro"
                                                      >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                      </Button>
                                                    </div>
                                                  </div>
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                        )
                                      })}
                                    </div>
                                  </CardContent>
                                )}
                              </Card>
                            )
                          })}
                        </div>
                      )
                    })()
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB CONTENT 7: CHATBOT KNOWLEDGE BASE */}
      {activeTab === "asistente" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* Left Column: Form to upload/paste new document */}
            <Card className="border shadow-sm bg-gradient-to-br from-white to-slate-50/30">
              <CardHeader className="py-4 border-b bg-slate-50/50">
                <CardTitle className="text-sm font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="h-4.5 w-4.5 text-pink-500 animate-pulse" />
                  {selectedDocId ? "Editar Documento" : "Cargar Lineamiento / Cuaderno"}
                </CardTitle>
                <CardDescription className="text-xs">
                  Carga lineamientos comerciales, cuadernos de bonos o condiciones generales. Gemini responderá basándose en esta información.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <form onSubmit={handleSaveDoc} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 uppercase block">Título del Documento</label>
                    <Input 
                      type="text" 
                      placeholder="Ej. Lineamientos Comerciales Insignia 2026" 
                      value={docTitle}
                      onChange={e => setDocTitle(e.target.value)}
                      className="text-xs h-9 font-semibold"
                      disabled={savingDoc}
                      required
                    />
                  </div>

                  <div className="space-y-1.5 p-3.5 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl">
                    <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1">
                      <Upload className="h-3.5 w-3.5 text-teal-600 animate-bounce" />
                      Extraer Texto desde PDF (Opcional)
                    </label>
                    <input 
                      type="file" 
                      accept=".pdf"
                      onChange={handlePdfUpload}
                      disabled={savingDoc}
                      className="block w-full text-[11px] text-slate-500 font-semibold
                        file:mr-3.5 file:py-1.5 file:px-3 file:rounded-lg file:border-0
                        file:text-[10px] file:font-black file:uppercase file:tracking-wider
                        file:bg-teal-600 file:text-white hover:file:bg-teal-700
                        file:cursor-pointer cursor-pointer"
                    />
                    <span className="text-[9px] text-slate-500 leading-normal block">
                      Selecciona un archivo PDF local para extraer su contenido de texto de forma automática. Podrás editarlo antes de guardarlo.
                    </span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 uppercase block">Contenido del Lineamiento (Copiar y Pegar Texto)</label>
                    <textarea 
                      placeholder="Pega aquí el contenido de texto del PDF o página web..." 
                      value={docContent}
                      onChange={e => setDocContent(e.target.value)}
                      rows={12}
                      className="w-full text-xs font-medium p-3 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500"
                      disabled={savingDoc}
                      required
                    />
                  </div>

                  {currentUserRole === 'SUPER_ADMIN' && (
                    <div className="flex items-center space-x-2 py-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl">
                      <input 
                        type="checkbox" 
                        id="global-template-checkbox"
                        checked={docIsGlobalTemplate}
                        onChange={(e) => setDocIsGlobalTemplate(e.target.checked)}
                        className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-amber-300 rounded cursor-pointer"
                        disabled={savingDoc}
                      />
                      <label htmlFor="global-template-checkbox" className="text-xs font-bold text-amber-700 dark:text-amber-500 cursor-pointer flex items-center gap-1 select-none">
                        💡 Compartir como Plantilla Base (Aplicará en tiempo real a TODAS las agencias actuales y nuevas)
                      </label>
                    </div>
                  )}

                  {docMsg && (
                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest text-center animate-pulse">
                      {docMsg}
                    </p>
                  )}

                  <div className="flex gap-2">
                    {selectedDocId && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedDocId(null)
                          setDocTitle("")
                          setDocContent("")
                          setDocIsGlobalTemplate(false)
                        }}
                        className="flex-1 font-bold text-xs"
                      >
                        Cancelar
                      </Button>
                    )}
                    <Button
                      type="submit"
                      size="sm"
                      disabled={savingDoc}
                      className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs"
                    >
                      {savingDoc ? <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
                      {selectedDocId ? "Actualizar Documento" : "Guardar Documento"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Right Column: List of current documents */}
            <Card className="lg:col-span-2 border shadow-sm">
              <CardHeader className="py-4 border-b bg-slate-50/50 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen className="h-4.5 w-4.5 text-teal-600" /> Documentos de Entrenamiento Activos
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Listado de cuadernos, políticas y PDFs vigentes de los que el asistente aprende.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {loadingDocs ? (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    <RefreshCw className="h-6 w-6 animate-spin text-teal-600 mx-auto mb-2" />
                    Cargando base de conocimientos...
                  </div>
                ) : knowledgeDocs.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs italic">
                    No hay documentos de conocimiento guardados en la plataforma aún.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {knowledgeDocs.map((doc) => (
                      <div 
                        key={doc.id} 
                        className={`border rounded-xl p-4 bg-slate-50/50 dark:bg-zinc-900/30 flex flex-col sm:flex-row justify-between sm:items-center gap-4 transition-all ${
                          !doc.active ? "opacity-60 border-dashed border-slate-300" : "border-slate-200"
                        }`}
                      >
                        <div className="space-y-1 flex-1 min-w-0">
                          <h4 className="text-xs font-black text-slate-800 dark:text-zinc-200 truncate flex flex-wrap items-center gap-1.5">
                            {doc.title}
                            {doc.isGlobalTemplate && (
                              <span className="bg-amber-100 text-amber-700 border border-amber-200 text-[8px] px-1.5 py-0.5 rounded uppercase tracking-widest font-black">
                                Plantilla Default
                              </span>
                            )}
                          </h4>
                          <p className="text-[10px] text-slate-500 font-semibold line-clamp-2">
                            {doc.content}
                          </p>
                          <div className="text-[9px] text-slate-400 font-bold flex gap-3 pt-1">
                            <span>Modificado: {new Date(doc.updatedAt).toLocaleDateString("es-MX", { timeZone: 'America/Mexico_City' })}</span>
                            <span>{doc.content.length} caracteres</span>
                          </div>
                        </div>

                        <div className="flex sm:flex-col gap-2 shrink-0">
                          {doc.isGlobalTemplate && currentUserRole !== 'SUPER_ADMIN' ? (
                            <div className="flex items-center justify-center bg-slate-100 dark:bg-zinc-800 rounded px-3 py-1.5 border border-slate-200 dark:border-zinc-700">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                🔒 Solo Lectura
                              </span>
                            </div>
                          ) : (
                            <>
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => {
                                    setSelectedDocId(doc.id)
                                    setDocTitle(doc.title)
                                    setDocContent(doc.content)
                                    setDocIsGlobalTemplate(doc.isGlobalTemplate || false)
                                  }}
                                  variant="outline"
                                  size="sm"
                                  className="font-bold text-[10px] h-7 px-2.5"
                                >
                                  Editar
                                </Button>
                                <Button
                                  onClick={() => handleToggleDocActive(doc.id)}
                                  variant="outline"
                                  size="sm"
                                  className={`font-bold text-[10px] h-7 px-2.5 ${
                                    doc.active ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50" : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                  }`}
                                >
                                    {doc.active ? "Pausar" : "Activar"}
                                </Button>
                              </div>
                              <Button
                                onClick={() => handleDeleteDoc(doc.id)}
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-600 hover:bg-red-50 font-bold text-[10px] h-7 px-2.5"
                              >
                                Eliminar
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
        </div>
      )}

      {/* DETAILED VIEW MODAL FOR SELECTED ADN DIAGNOSTIC */}
      {selectedAdn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-950 w-full max-w-5xl rounded-2xl border shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="bg-slate-100 dark:bg-zinc-900 border-b p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src="/logo.png" alt="AACOM" className="h-7 w-auto object-contain" />
                <div className="h-5 w-px bg-slate-300"></div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 dark:text-slate-100">
                    ADN Digital Rescatado: {selectedAdn.clienteNombre}
                  </h3>
                  <p className="text-[10px] text-muted-foreground">
                    Diagnosticado el {new Date(selectedAdn.createdAt).toLocaleDateString("es-MX", { timeZone: 'America/Mexico_City' })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button 
                  onClick={() => window.print()} 
                  className="bg-teal-600 hover:bg-teal-700 text-white font-bold h-8 px-4 text-xs flex items-center gap-1.5 shadow"
                >
                  <Download className="h-4 w-4" /> Descargar PDF
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedAdn(null)} 
                  className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900 shrink-0"
                >
                  <X className="h-4.5 w-4.5" />
                </Button>
              </div>
            </div>

            {/* Modal Body / Projection Re-render Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* RECREATION CONTAINER START */}
              <div id="admin-printable-report" className="space-y-6 bg-white p-2 text-slate-800">
                
                {/* Print Title Header */}
                <div className="border-b-2 border-teal-500 pb-4 flex flex-row items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-teal-600 uppercase tracking-widest block">
                      Diagnóstico Patrimonial Digital
                    </span>
                    <h2 className="text-xl font-extrabold text-slate-800">
                      ADN DIGITAL AACOM
                    </h2>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-[11px] text-slate-500">
                      <span><strong>Cliente:</strong> {selectedAdn.clienteNombre}</span>
                      <span>•</span>
                      <span><strong>Edad:</strong> {selectedAdn.clienteEdad} años</span>
                      <span>•</span>
                      <span><strong>Fecha:</strong> {new Date(selectedAdn.createdAt).toLocaleDateString("es-MX", { timeZone: 'America/Mexico_City',  day: "numeric", month: "long", year: "numeric" })}</span>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <img src="/logo.png" alt="AACOM Seguros" className="h-8 w-auto object-contain mb-1" />
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-wide">AACOM cotizador</span>
                    <span className="text-[9px] text-slate-400"><strong>Agente:</strong> {selectedAdn.user?.name || selectedAdn.user?.email || "Sin Agente"}</span>
                  </div>
                </div>

                {/* Profile detail */}
                <div className="bg-slate-50 border p-4 rounded-xl grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div>
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">Cliente</span>
                    <span className="text-xs font-bold text-slate-800 block mt-0.5">{selectedAdn.clienteNombre}</span>
                  </div>
                  <div>
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">Edad</span>
                    <span className="text-xs font-bold text-slate-800 block mt-0.5">{selectedAdn.clienteEdad} años</span>
                  </div>
                  <div>
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">Cónyuge</span>
                    <span className="text-xs font-bold text-slate-800 block mt-0.5">{selectedAdn.conyugeNombre ? `${selectedAdn.conyugeNombre} (${selectedAdn.conyugeEdad} años)` : 'No registrado'}</span>
                  </div>
                  <div>
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">Situación Laboral</span>
                    <span className="text-xs font-bold text-slate-800 block mt-0.5">{selectedAdn.situacionLaboral}</span>
                  </div>
                  <div>
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">Ubicación (GPS)</span>
                    {selectedAdn.latitude && selectedAdn.longitude ? (
                      <a 
                        href={`https://www.google.com/maps?q=${selectedAdn.latitude},${selectedAdn.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline block mt-0.5 flex items-center gap-1"
                      >
                        📍 Ver en Mapa
                      </a>
                    ) : (
                      <span className="text-xs font-bold text-slate-500 block mt-0.5">Sin registro</span>
                    )}
                  </div>
                </div>

                {/* Hijos list */}
                {selectedAdn.hijosData && JSON.parse(selectedAdn.hijosData).length > 0 && (
                  <div className="border border-slate-200 p-3.5 rounded-xl space-y-1.5">
                    <span className="text-[9px] font-black text-slate-600 uppercase block tracking-wider">Estructura de Protección Familiar (Hijos)</span>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {JSON.parse(selectedAdn.hijosData).map((h: any, i: number) => (
                        <div key={i} className="border-l-2 border-teal-500 pl-2">
                          <span className="text-xs font-bold text-slate-800 block">{h.nombre}</span>
                          <span className="text-[9px] text-slate-500 block">{h.edad} años</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Salud y Hábitos */}
                <div className="border border-slate-200 p-3.5 rounded-xl space-y-1.5 mt-4">
                  <span className="text-[9px] font-black text-slate-600 uppercase block tracking-wider">Salud y Hábitos</span>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">Estatura</span>
                      <span className="text-xs font-bold text-slate-800 block mt-0.5">{selectedAdn.estatura || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">Peso</span>
                      <span className="text-xs font-bold text-slate-800 block mt-0.5">{selectedAdn.peso || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">Fumador</span>
                      <span className="text-xs font-bold text-slate-800 block mt-0.5">{selectedAdn.fumador ? 'SI' : 'NO'}</span>
                    </div>
                    <div>
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">Padecimientos</span>
                      <span className="text-xs font-bold text-slate-800 block mt-0.5">{selectedAdn.padecimientos || 'Ninguno'}</span>
                    </div>
                  </div>
                </div>

                {/* Calculations metrics */}
                {(() => {
                  const parsedGastos = JSON.parse(selectedAdn.gastosData)
                  const income = selectedAdn.ingresosNetos || 0
                  const totalEgresos = selectedAdn.totalGastos || 0
                  
                  let necesidades = 0
                  let deseos = 0
                  let ahorro = 0

                  // Sumar aportes de seguros que son tipo Ahorro / PPR
                  if (selectedAdn.hasSeguroAhorro && selectedAdn.ahorroAporte) {
                    const aporte = selectedAdn.ahorroAporte
                    ahorro += selectedAdn.ahorroFrecuencia === 'MENSUAL' ? aporte : aporte / 12
                  }
                  if (selectedAdn.hasPpr && selectedAdn.pprAporte) {
                    const aporte = selectedAdn.pprAporte
                    ahorro += selectedAdn.pprFrecuencia === 'MENSUAL' ? aporte : aporte / 12
                  }

                  let catVivienda = 0
                  let catTransporte = 0
                  let catEducacion = 0
                  let catDeudas = 0
                  let catEntretenimiento = 0
                  let catAlimentacion = 0
                  let catCuidadoPersonal = 0
                  let catAhorro = ahorro
                  let catMascotas = 0

                  if (selectedAdn.modalidad === 'DETALLADO') {
                    const g = parsedGastos
                    // AJUSTE 2 & 4: Mensualizar anuales (Predial, Tenencia, Verificacion, Mantenimiento, Seguro)
                    catVivienda = (g.renta || 0) + (g.hipoteca || 0) + (g.mantenimiento || 0) + (g.luz || 0) + (g.gas || 0) + (g.agua || 0) + (g.telefono || 0) + (g.internet || 0) + (g.streamings || 0) + (g.celular || 0) + (g.otrosServicios || 0) + ((g.predial || 0) / 12)
                    catTransporte = (g.mensualidadAuto || 0) + ((g.tenencia || 0) / 12) + ((g.verificacion || 0) / 12) + ((g.mantenimientoAuto || 0) / 12) + ((g.seguroAuto || 0) / 12) + (g.gasolina || 0) + (g.transportePublico || 0) + (g.uber || 0) + (g.estacionamientos || 0)
                    catEducacion = (g.escuelaHijos || 0) + (g.escuelaPropia || 0) + (g.utiles || 0) + (g.materiales || 0) + (g.libros || 0)
                    catDeudas = (g.prestamos || 0) + (g.creditos || 0)
                    catAlimentacion = (g.supermercado || 0) + (g.mercado || 0) + (g.accesoriosCasa || 0)
                    catCuidadoPersonal = (g.estetica || 0) + (g.accesoriosBelleza || 0) + (g.medicamentos || 0) + (g.checkups || 0)
                    catMascotas = (g.comidaMascota || 0) + (g.saludMascota || 0) + (g.vacunasMascota || 0) + (g.esteticaMascota || 0) + (g.accesoriosMascota || 0)
                    catEntretenimiento = (g.hobbies || 0) + (g.finDeSemana || 0) + (g.vacaciones || 0) + (g.cineTeatro || 0) + (g.comidasEsparcimiento || 0) + (g.baresRecreacion || 0) + (g.cafecitos || 0) + (g.clubSocial || 0) + (g.amazonCompras || 0)
                    catAhorro += (g.inversiones || 0)

                    necesidades = catVivienda + catTransporte + catEducacion + catDeudas + catAlimentacion + catCuidadoPersonal + catMascotas
                    deseos = catEntretenimiento
                  } else if (selectedAdn.modalidad === 'RESUMIDO') {
                    const r = parsedGastos
                    catVivienda = r.vivienda || 0
                    catTransporte = r.transporte || 0
                    catEducacion = r.educacion || 0
                    catDeudas = r.deudas || 0
                    catAlimentacion = r.alimentacion || 0
                    catCuidadoPersonal = r.cuidadoPersonal || 0
                    catMascotas = r.mascotas || 0
                    catEntretenimiento = r.entretenimiento || 0
                    catAhorro += r.ahorro || 0

                    necesidades = catVivienda + catTransporte + catEducacion + catDeudas + catAlimentacion + catCuidadoPersonal + catMascotas
                    deseos = catEntretenimiento
                  } else {
                    necesidades = totalEgresos * 0.7
                    deseos = totalEgresos * 0.3
                    
                    catVivienda = totalEgresos * 0.4
                    catTransporte = totalEgresos * 0.15
                    catEducacion = totalEgresos * 0.1
                    catDeudas = totalEgresos * 0.1
                    catEntretenimiento = totalEgresos * 0.1
                    catAlimentacion = totalEgresos * 0.1
                    catCuidadoPersonal = totalEgresos * 0.05
                  }

                  const pctNecesidades = Math.round((necesidades / (income || 1)) * 100)
                  const pctDeseos = Math.round((deseos / (income || 1)) * 100)
                  const pctAhorro = Math.round((ahorro / (income || 1)) * 100)

                  const p1_retiro = !selectedAdn.hasPpr
                  const p2_gmm = !selectedAdn.hasGmm
                  const idealMonths = selectedAdn.hasGmm ? 1 : 3
                  const fondoIdeal = income * idealMonths
                  const p3_fondo_isOk = (selectedAdn.ahorroActual || 0) >= fondoIdeal
                  const p3_fondo_gap = Math.max(0, fondoIdeal - (selectedAdn.ahorroActual || 0))

                  const tieneHijosChicos = selectedAdn.hijosData && JSON.parse(selectedAdn.hijosData).some((h: any) => h.edad >= 0 && h.edad <= 9)
                  const p4_educacion = tieneHijosChicos && !selectedAdn.hasSeguroAhorro

                  // PPR Plazo and Suficiencia Math Logic (AJUSTE 5)
                  const retirementGoal = income * 12 * 20
                  const pprAporteMensual = selectedAdn.pprFrecuencia === 'MENSUAL' ? Number(selectedAdn.pprAporte || 0) : Number(selectedAdn.pprAporte || 0) / 12
                  const pprAporteAnual = pprAporteMensual * 12
                  let plazoAnios = 0
                  if (selectedAdn.pprAniosPlazo === '65') {
                    plazoAnios = Math.max(0, 65 - Number(selectedAdn.clienteEdad || 0))
                  } else {
                    plazoAnios = Number(selectedAdn.pprAniosPlazo || 10)
                  }
                  // Proyección acumulada inflacionada con tasa del 4% anual
                  let projectedPprAccumulation = 0
                  let tempAporte = pprAporteAnual
                  for (let i = 0; i < plazoAnios; i++) {
                    projectedPprAccumulation = (projectedPprAccumulation + tempAporte) * 1.04
                    tempAporte = tempAporte * 1.04
                  }
                  const brechaRetiro = Math.max(0, retirementGoal - projectedPprAccumulation)
                  const isPprSufficient = projectedPprAccumulation >= retirementGoal
                  const adicionalMensualSugerido = plazoAnios > 0 ? (brechaRetiro / plazoAnios) / 12 : 0

                  return (
                    <>
                      {/* Seguros y Ahorros Activos (AJUSTE 1: Suma Asegurada Vida) */}
                      <div className="border border-slate-200 p-4 rounded-xl space-y-2 bg-slate-50/40">
                        <span className="text-[9px] font-black text-slate-600 uppercase block tracking-wider">
                          Seguros y Ahorros Activos
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-slate-800">
                          {selectedAdn.hasPpr && (
                            <div className="border-l-2 border-emerald-500 pl-2">
                              <span className="text-xs font-bold text-slate-800 block">PPR (Retiro)</span>
                              <span className="text-[9px] text-slate-500 block">
                                Aporte: ${selectedAdn.pprAporte?.toLocaleString('es-MX')} ({selectedAdn.pprFrecuencia === 'MENSUAL' ? 'Mensual' : 'Anual'})
                                <br />
                                Plazo: {selectedAdn.pprAniosPlazo === '65' ? 'Hasta edad 65' : `${selectedAdn.pprAniosPlazo} años`}
                              </span>
                            </div>
                          )}
                          {selectedAdn.hasSeguroAhorro && (
                            <div className="border-l-2 border-emerald-500 pl-2">
                              <span className="text-xs font-bold text-slate-800 block">Ahorro / Plan Educativo</span>
                              <span className="text-[9px] text-slate-500 block">
                                Aporte: ${selectedAdn.ahorroAporte?.toLocaleString('es-MX')} ({selectedAdn.ahorroFrecuencia === 'MENSUAL' ? 'Mensual' : 'Anual'})
                              </span>
                            </div>
                          )}
                          {selectedAdn.hasGmm && (
                            <div className="border-l-2 border-teal-500 pl-2">
                              <span className="text-xs font-bold text-slate-800 block">Gastos Médicos (GMM)</span>
                              <span className="text-[9px] text-slate-500 block">Póliza de Salud Activa</span>
                            </div>
                          )}
                          {selectedAdn.hasSeguroVida && (
                            <div className="border-l-2 border-teal-500 pl-2">
                              <span className="text-xs font-bold text-slate-800 block">Seguro de Vida</span>
                              <span className="text-[9px] text-slate-500 block">
                                {selectedAdn.vidaSumaAsegurada 
                                  ? `Suma Asegurada: $${selectedAdn.vidaSumaAsegurada.toLocaleString('es-MX')} pesos`
                                  : 'Póliza de Protección Activa'}
                              </span>
                            </div>
                          )}
                          {!selectedAdn.hasPpr && !selectedAdn.hasSeguroAhorro && !selectedAdn.hasGmm && !selectedAdn.hasSeguroVida && (
                            <span className="text-xs text-slate-400 italic col-span-4">Ninguno registrado.</span>
                          )}
                        </div>
                      </div>

                        {/* Tarjetas de Crédito */}
                        <div className="border border-slate-200 p-3.5 rounded-xl space-y-2 mt-4">
                          <span className="text-[9px] font-black text-slate-600 uppercase block tracking-wider">Tarjetas de Crédito</span>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">¿Cuenta con TC?</span>
                              <span className="text-xs font-bold text-slate-800 block mt-0.5">{selectedAdn.hasTarjetasCredito ? 'Sí' : 'No'}</span>
                            </div>
                            {selectedAdn.hasTarjetasCredito && (
                              <>
                                <div className="col-span-2">
                                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">Cuáles</span>
                                  <span className="text-xs font-bold text-slate-800 block mt-0.5">{selectedAdn.tarjetasCuales || 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">Límite de Crédito</span>
                                  <span className="text-xs font-bold text-slate-800 block mt-0.5">{selectedAdn.tarjetasLimite || 'N/A'}</span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                      {/* Financial 50-30-20 Summary */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="border p-4 rounded-xl space-y-3 bg-white">
                          <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">Flujo Mensual de Efectivo</h4>
                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between border-b pb-1">
                              <span className="font-semibold text-slate-500">Ingresos Netos:</span>
                              <span className="font-bold text-slate-800">${income.toLocaleString('es-MX')} MXN</span>
                            </div>
                            <div className="flex justify-between border-b pb-1">
                              <span className="font-semibold text-slate-500">Gastos Necesidades (Fijos):</span>
                              <span className="font-bold text-slate-800">${necesidades.toLocaleString('es-MX')} MXN ({pctNecesidades}%)</span>
                            </div>
                            <div className="flex justify-between border-b pb-1">
                              <span className="font-semibold text-slate-500">Ahorro y Patrimonio:</span>
                              <span className="font-bold text-emerald-600">${ahorro.toLocaleString('es-MX')} MXN ({pctAhorro}%)</span>
                            </div>
                            <div className="flex justify-between border-b pb-1">
                              <span className="font-semibold text-slate-500">Deseos y Esparcimiento:</span>
                              <span className="font-bold text-amber-600">${deseos.toLocaleString('es-MX')} MXN ({pctDeseos}%)</span>
                            </div>
                            <div className="flex justify-between pt-1">
                              <span className="font-bold text-teal-800">Remanente de Caja:</span>
                              <span className="font-bold text-teal-700">${Math.max(0, income - totalEgresos).toLocaleString('es-MX')} MXN</span>
                            </div>
                          </div>
                        </div>

                        {/* Warren Percent BarChart */}
                        <div className="border p-4 rounded-xl space-y-3.5 flex flex-col justify-between bg-white">
                          <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">Comparación Warren 50-30-20</h4>
                          <div className="h-48 w-full mt-2">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={[
                                { name: 'Necesidades', Recomendado: Math.round((income || 1) * 0.5), Real: necesidades },
                                { name: 'Ahorro', Recomendado: Math.round((income || 1) * 0.3), Real: ahorro },
                                { name: 'Deseos', Recomendado: Math.round((income || 1) * 0.2), Real: deseos }
                              ]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <XAxis dataKey="name" stroke="#888888" fontSize={9} tickLine={false} axisLine={false} />
                                <YAxis stroke="#888888" fontSize={9} tickLine={false} axisLine={false} tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`} />
                                <Tooltip formatter={(val: number) => [`$${val.toLocaleString('es-MX')}`, '']} />
                                <Legend wrapperStyle={{ fontSize: '9px', fontWeight: 'bold' }} />
                                <Bar dataKey="Recomendado" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Real" fill="#0f766e" radius={[4, 4, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </div>

                      {/* AJUSTE 6: Resumen de Gastos por Ramo Principal */}
                      <div className="border p-4 rounded-xl space-y-3 bg-white text-slate-800">
                        <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">Resumen de Gastos por Ramo Principal</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-[11px] border-collapse">
                            <thead>
                              <tr className="bg-slate-50 text-slate-700 uppercase tracking-wider font-bold border-b text-[10px]">
                                <th className="py-2 px-3">Ramo de Gasto</th>
                                <th className="py-2 px-3 text-center">Gasto Mensualizado</th>
                                <th className="py-2 px-3 text-center">Porcentaje del Ingreso</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-800">
                              <tr className="hover:bg-slate-50/50">
                                <td className="py-1.5 px-3 font-semibold">Vivienda y Servicios (incluye Predial)</td>
                                <td className="py-1.5 px-3 text-center">${catVivienda.toLocaleString('es-MX', {maximumFractionDigits:0})}</td>
                                <td className="py-1.5 px-3 text-center font-bold text-teal-600">{Math.round((catVivienda / (income || 1)) * 100)}%</td>
                              </tr>
                              <tr className="hover:bg-slate-50/50">
                                <td className="py-1.5 px-3 font-semibold">Transporte y Auto (anuales mensualizados)</td>
                                <td className="py-1.5 px-3 text-center">${catTransporte.toLocaleString('es-MX', {maximumFractionDigits:0})}</td>
                                <td className="py-1.5 px-3 text-center font-bold text-teal-600">{Math.round((catTransporte / (income || 1)) * 100)}%</td>
                              </tr>
                              <tr className="hover:bg-slate-50/50">
                                <td className="py-1.5 px-3 font-semibold">Educación</td>
                                <td className="py-1.5 px-3 text-center">${catEducacion.toLocaleString('es-MX', {maximumFractionDigits:0})}</td>
                                <td className="py-1.5 px-3 text-center font-bold text-teal-600">{Math.round((catEducacion / (income || 1)) * 100)}%</td>
                              </tr>
                              <tr className="hover:bg-slate-50/50">
                                <td className="py-1.5 px-3 font-semibold">Deudas y Créditos</td>
                                <td className="py-1.5 px-3 text-center">${catDeudas.toLocaleString('es-MX', {maximumFractionDigits:0})}</td>
                                <td className="py-1.5 px-3 text-center font-bold text-teal-600">{Math.round((catDeudas / (income || 1)) * 100)}%</td>
                              </tr>
                              <tr className="hover:bg-slate-50/50">
                                <td className="py-1.5 px-3 font-semibold">Diversión y Entretenimiento (Deseos)</td>
                                <td className="py-1.5 px-3 text-center">${catEntretenimiento.toLocaleString('es-MX', {maximumFractionDigits:0})}</td>
                                <td className="py-1.5 px-3 text-center font-bold text-teal-600">{Math.round((catEntretenimiento / (income || 1)) * 100)}%</td>
                              </tr>
                              <tr className="hover:bg-slate-50/50">
                                <td className="py-1.5 px-3 font-semibold">Alimentación y Despensa</td>
                                <td className="py-1.5 px-3 text-center">${catAlimentacion.toLocaleString('es-MX', {maximumFractionDigits:0})}</td>
                                <td className="py-1.5 px-3 text-center font-bold text-teal-600">{Math.round((catAlimentacion / (income || 1)) * 100)}%</td>
                              </tr>
                              <tr className="hover:bg-slate-50/50">
                                <td className="py-1.5 px-3 font-semibold">Cuidado Personal y Salud</td>
                                <td className="py-1.5 px-3 text-center">${catCuidadoPersonal.toLocaleString('es-MX', {maximumFractionDigits:0})}</td>
                                <td className="py-1.5 px-3 text-center font-bold text-teal-600">{Math.round((catCuidadoPersonal / (income || 1)) * 100)}%</td>
                              </tr>
                              {catMascotas > 0 && (
                                <tr className="hover:bg-slate-50/50">
                                  <td className="py-1.5 px-3 font-semibold">Mascotas</td>
                                  <td className="py-1.5 px-3 text-center">${catMascotas.toLocaleString('es-MX', {maximumFractionDigits:0})}</td>
                                  <td className="py-1.5 px-3 text-center font-bold text-teal-600">{Math.round((catMascotas / (income || 1)) * 100)}%</td>
                                </tr>
                              )}
                              <tr className="hover:bg-slate-50/50 bg-slate-50">
                                <td className="py-1.5 px-3 font-bold text-teal-800">Ahorro e Inversiones Totales</td>
                                <td className="py-1.5 px-3 text-center font-bold text-teal-800">${catAhorro.toLocaleString('es-MX', {maximumFractionDigits:0})}</td>
                                <td className="py-1.5 px-3 text-center font-bold text-teal-800">{Math.round((catAhorro / (income || 1)) * 100)}%</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* 5 Priorities Semáforo Evaluation */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1">
                          <ShieldCheck className="h-4 w-4 text-teal-600" /> Evaluación de Blindaje y Recomendaciones
                        </h4>
                        
                        <div className="space-y-3">
                          {/* Pilar 1: Retiro / PPR */}
                          <div className="border p-3 rounded-lg flex items-start gap-3 bg-white">
                            <span className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${p1_retiro ? 'bg-red-500 animate-pulse' : (!isPprSufficient ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500')}`} />
                            <div className="text-xs w-full">
                              <span className="font-extrabold text-[9px] tracking-wider text-slate-400 block uppercase">Pilar 1: Plan Personal para Retiro (PPR)</span>
                              <p className="text-slate-600 mt-0.5">
                                {p1_retiro 
                                  ? '⚠️ Alerta: El cliente no cuenta con plan para retiro. Es crítico iniciar un ahorro deducible bajo el Art. 151 LISR para construir su independencia a edad de retiro.'
                                  : <>
                                      <span className="font-bold text-slate-700">✅ Registrado: </span> El cliente aporta <strong>${selectedAdn.pprAporte?.toLocaleString('es-MX')}</strong> ({selectedAdn.pprFrecuencia === 'MENSUAL' ? 'Mensual' : 'Anual'}) a un plazo contratado de <strong>{selectedAdn.pprAniosPlazo === '65' ? 'Hasta edad 65' : `${selectedAdn.pprAniosPlazo} años`}</strong>.
                                      <span className="block mt-2 pt-2 border-t border-slate-100 text-slate-700">
                                        <strong>Meta de Retiro (20 años de ingresos):</strong> ${retirementGoal.toLocaleString('es-MX')} pesos.
                                        <br />
                                        <strong>Acumulación PPR Proyectada:</strong> ${projectedPprAccumulation.toLocaleString('es-MX')} pesos.
                                      </span>
                                      {!isPprSufficient ? (
                                        <span className="block mt-2 bg-red-50 text-red-800 p-2 rounded-md font-semibold border border-red-100">
                                          ⚠️ Brecha Financiera Detectada: Faltan <strong>${brechaRetiro.toLocaleString('es-MX')} pesos</strong> para alcanzar la meta. 
                                          Se sugiere incrementar sustancialmente su aportación para lograr su meta de retiro.
                                        </span>
                                      ) : (
                                        <span className="block mt-2 bg-emerald-50 text-emerald-800 p-2 rounded-md font-semibold border border-emerald-100">
                                          🎉 ¡Excelente! La acumulación proyectada de su PPR actual es suficiente para cubrir la meta de retiro sugerida.
                                        </span>
                                      )}
                                    </>
                                }
                              </p>
                            </div>
                          </div>

                          {/* Pilar 2: GMM */}
                          <div className="border p-3 rounded-lg flex items-start gap-3 bg-white">
                            <span className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${p2_gmm ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
                            <div className="text-xs">
                              <span className="font-extrabold text-[9px] tracking-wider text-slate-400 block uppercase">Pilar 2: Gastos Médicos Mayores (GMM)</span>
                              <p className="text-slate-600 mt-0.5">
                                {p2_gmm 
                                  ? '⚠️ Alerta: Sin póliza de GMM. Un accidente o enfermedad grave extinguirá de inmediato sus fondos líquidos de emergencia e inversiones.'
                                  : '✅ Cubierto: Salud y patrimonio blindados con póliza de Gastos Médicos Mayores.'}
                              </p>
                            </div>
                          </div>

                          {/* Pilar 3: Fondo de Emergencia */}
                          {!p3_fondo_isOk && (
                            <div className="border p-3 rounded-lg flex items-start gap-3 bg-white">
                              <span className="h-2 w-2 rounded-full mt-1.5 shrink-0 bg-red-500" />
                              <div className="text-xs">
                                <span className="font-extrabold text-[9px] tracking-wider text-slate-400 block uppercase">Pilar 3: Fondo de Emergencia</span>
                                <p className="text-slate-600 mt-0.5">
                                  ⚠️ Insuficiente: Fondo de emergencia óptimo sugerido: ${fondoIdeal.toLocaleString('es-MX')} (equivalente a {idealMonths} meses). Cuenta actualmente con ${(selectedAdn.ahorroActual || 0).toLocaleString('es-MX')} pesos (Faltante: ${p3_fondo_gap.toLocaleString('es-MX')} pesos).
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Pilar 4: Seguro Educativo */}
                          {tieneHijosChicos && (
                            <div className="border p-3 rounded-lg flex items-start gap-3 bg-white">
                              <span className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${p4_educacion ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                              <div className="text-xs">
                                <span className="font-extrabold text-[9px] tracking-wider text-slate-400 block uppercase">Pilar 4: Seguro Educativo</span>
                                <p className="text-slate-600 mt-0.5">
                                  {p4_educacion 
                                    ? '⚠️ Recomendación: Cuenta con hijos pequeños (0-9 años) sin plan educativo. Iniciar una póliza de ahorro universitario garantiza su carrera profesional y reduce sustancialmente el costo mensual.'
                                    : '✅ Cubierto: Cuentas con un plan de ahorro educativo previsto.'}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* AJUSTE: Evidencia para Modalidad BASICA */}
                      {selectedAdn.modalidad === 'BASICO' && selectedAdn.evidenciaBase64 && (
                        <div className="border border-slate-200 p-4 rounded-xl space-y-2 bg-slate-50/40">
                          <span className="text-[9px] font-black text-slate-600 uppercase block tracking-wider">
                            Evidencia Adjunta (Ingreso y Gasto Total)
                          </span>
                          <div className="flex justify-center w-full mt-2">
                            {selectedAdn.evidenciaBase64.startsWith('data:application/pdf') ? (
                              <div className="w-full h-[500px] border border-slate-300 rounded-lg overflow-hidden bg-white">
                                <embed src={selectedAdn.evidenciaBase64} type="application/pdf" width="100%" height="100%" />
                              </div>
                            ) : (
                              <div className="w-full bg-white border border-slate-200 rounded-lg p-2 flex justify-center shadow-sm">
                                <img 
                                  src={selectedAdn.evidenciaBase64} 
                                  alt="Evidencia Diagnóstico Básico" 
                                  className="max-w-full max-h-[600px] object-contain rounded" 
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )
                })()}

                {/* Modal footer signature */}
                <div className="border-t pt-4 flex flex-row justify-between items-center text-[9px] text-slate-400 gap-2">
                  <span>* Reporte de diagnóstico ilustrativo generado de forma segura desde la base de datos de desarrollo.</span>
                  <div className="flex items-center gap-1 font-bold text-slate-600">
                    <span>Respaldado por la plataforma</span>
                    <img src="/logo.png" alt="AACOM" className="w-auto object-contain" style={{ height: '18px' }} />
                    <span>AACOM cotizador</span>
                  </div>
                </div>

              </div>
              {/* RECREATION CONTAINER END */}

            </div>

            {/* Modal Footer actions */}
            <div className="bg-slate-50 dark:bg-zinc-900 border-t p-4 flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => setSelectedAdn(null)} 
                className="h-9 px-4 text-xs font-bold"
              >
                Cerrar Diagnóstico
              </Button>
            </div>

          </div>
        </div>
      )}
      {selectedQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-950 w-full max-w-5xl rounded-2xl border shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="bg-slate-100 dark:bg-zinc-900 border-b p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src="/logo.png" alt="AACOM" className="h-7 w-auto object-contain" />
                <div className="h-5 w-px bg-slate-300"></div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 dark:text-slate-100">
                    Propuesta Rescatada: {selectedQuote.cliente}
                  </h3>
                  <p className="text-[10px] text-muted-foreground">
                    Cotizado por {selectedQuote.agente} el {new Date(selectedQuote.createdAt).toLocaleDateString("es-MX", { timeZone: 'America/Mexico_City' })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Print button inside Modal */}
                <Button 
                  onClick={handleDownloadRescuedPdf} 
                  className="bg-teal-600 hover:bg-teal-700 text-white font-bold h-8 px-4 text-xs flex items-center gap-1.5 shadow"
                >
                  <Download className="h-4 w-4" /> Descargar PDF
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedQuote(null)} 
                  className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900 shrink-0"
                >
                  <X className="h-4.5 w-4.5" />
                </Button>
              </div>
            </div>

            {/* Modal Body / Projection Re-render Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {!selectedQuote.projectionData ? (
                <div className="p-12 text-center space-y-3 bg-amber-50 rounded-xl border border-amber-200">
                  <ShieldCheck className="h-10 w-10 text-amber-500 mx-auto" />
                  <h4 className="font-bold text-amber-800 text-sm">Rescatado Parcial</h4>
                  <p className="text-xs text-amber-700 max-w-md mx-auto">
                    Esta propuesta fue generada con una versión anterior del cotizador que no guardaba el desglose anual completo en base de datos. Solo se pueden consultar las métricas generales.
                  </p>
                  <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto pt-4 text-xs">
                    <div className="border bg-white p-3 rounded-lg text-center">
                      <span className="font-semibold text-slate-500 block">Prima Anual</span>
                      <span className="font-bold text-slate-800 block mt-0.5">${selectedQuote.primaAnual.toLocaleString("es-MX")}</span>
                    </div>
                    <div className="border bg-white p-3 rounded-lg text-center">
                      <span className="font-semibold text-slate-500 block">Ahorro Proyectado</span>
                      <span className="font-bold text-emerald-600 block mt-0.5">${selectedQuote.ahorro.toLocaleString("es-MX")}</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* RECREATION CONTAINER START */
                <div id="admin-printable-report" className="space-y-6 bg-white dark:bg-zinc-950 p-2 text-slate-800">
                  
                  {/* Print Title Header */}
                  <div className="border-b-2 border-teal-500 pb-4 flex flex-row items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] font-bold text-teal-600 uppercase tracking-widest block">
                        Propuesta Rescatada
                      </span>
                      <h2 className="text-xl font-extrabold text-slate-800">
                        Análisis Financiero de {selectedQuote.producto}
                      </h2>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-[11px] text-slate-500">
                        <span><strong>Cliente:</strong> {selectedQuote.cliente}</span>
                        <span>•</span>
                        <span><strong>Teléfono:</strong> {selectedQuote.telefono}</span>
                        <span>•</span>
                        <span><strong>Fecha original:</strong> {new Date(selectedQuote.createdAt).toLocaleDateString("es-MX", { timeZone: 'America/Mexico_City',  day: "numeric", month: "long", year: "numeric" })}</span>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <img src="/logo.png" alt="AACOM Seguros" className="h-8 w-auto object-contain mb-1" />
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-wide">AACOM cotizador</span>
                      <span className="text-[9px] text-slate-400"><strong>Agente:</strong> {selectedQuote.agente}</span>
                    </div>
                  </div>

                  {/* Calculations and Metrics Cards */}
                  {(() => {
                    const parsedCoverages = selectedQuote.coberturas ? JSON.parse(selectedQuote.coberturas) : { itp: false, epp: false, ma: false }
                    const parsedRows = JSON.parse(selectedQuote.projectionData)
                    
                    // Recompute ppr calculations inside Modal Scope
                    const benefitFiscalTotal = selectedQuote.producto === "VPL PPR" 
                      ? selectedQuote.totalPrima * ((selectedQuote.isr || 35) / 100)
                      : 0
                    
                    const benefitFiscalAnual = selectedQuote.producto === "VPL PPR"
                      ? selectedQuote.primaAnual * ((selectedQuote.isr || 35) / 100)
                      : 0

                    const pprAhorroRealEfectivo = selectedQuote.totalPrima - benefitFiscalTotal
                    const pprRentabilidadReal = pprAhorroRealEfectivo > 0 
                      ? (selectedQuote.ahorro / pprAhorroRealEfectivo) * 100 
                      : 0

                    // SA progression computations
                    const saY1 = parsedRows[0]?.saPesos || 0
                    const rowY10 = parsedRows.find((r: any) => r.anio === 10) || parsedRows[parsedRows.length - 1]
                    const saY10 = rowY10 ? rowY10.saPesos : 0
                    const rowY20 = parsedRows.find((r: any) => r.anio === 20) || parsedRows[parsedRows.length - 1]
                    const saY20 = rowY20 ? rowY20.saPesos : 0
                    const rowY30 = parsedRows.find((r: any) => r.anio === 30) || parsedRows[parsedRows.length - 1]
                    const saY30 = rowY30 ? rowY30.saPesos : 0

                    // Find the exact age when the payments stop (indicator marker)
                    const paymentDurationNum = parseInt(selectedQuote.duracion)
                    const endPaymentRow = parsedRows.find((r: any) => 
                      !isNaN(paymentDurationNum) ? r.anio === paymentDurationNum : r.edad === 65
                    )
                    const endPaymentAge = endPaymentRow ? endPaymentRow.edad : null
                    const startAge = parsedRows[0]?.edad || null

                    return (
                      <>
                        {/* Top Summary Metrics */}
                        <div className={`grid gap-4 ${selectedQuote.producto.includes("PPR") ? "grid-cols-2 lg:grid-cols-5" : "grid-cols-2 lg:grid-cols-4"}`}>
                          <Card className="shadow-none border border-slate-100 bg-slate-50/50">
                            <CardContent className="p-3">
                              <span className="text-[9px] font-bold text-slate-500 uppercase block">Ahorro a Edad 65</span>
                              <span className="text-lg font-black text-emerald-600 block mt-1">
                                ${selectedQuote.ahorro.toLocaleString("es-MX", { maximumFractionDigits: 0 })}
                              </span>
                            </CardContent>
                          </Card>

                          <Card className="shadow-none border border-slate-100 bg-slate-50/50">
                            <CardContent className="p-3">
                              <span className="text-[9px] font-bold text-slate-500 uppercase block">Aportación Total</span>
                              <span className="text-lg font-black text-slate-800 block mt-1">
                                ${selectedQuote.totalPrima.toLocaleString("es-MX", { maximumFractionDigits: 0 })}
                              </span>
                            </CardContent>
                          </Card>

                          <Card className="shadow-none border border-slate-100 bg-slate-50/50">
                            <CardContent className="p-3">
                              <span className="text-[9px] font-bold text-slate-500 uppercase block">Rendimiento (65)</span>
                              <span className="text-lg font-black text-teal-600 block mt-1">
                                {selectedQuote.rendimiento.toFixed(1)}%
                              </span>
                            </CardContent>
                          </Card>

                          {selectedQuote.producto.includes("PPR") && (
                            <>
                              <Card className="shadow-none border border-slate-100 bg-slate-50/50">
                                <CardContent className="p-3">
                                  <span className="text-[9px] font-bold text-slate-500 uppercase block">Beneficio Fiscal PPR</span>
                                  <span className="text-lg font-black text-teal-700 block mt-1">
                                    ${benefitFiscalTotal.toLocaleString("es-MX", { maximumFractionDigits: 0 })}
                                  </span>
                                </CardContent>
                              </Card>

                              <Card className="shadow-none border border-teal-200 bg-teal-50/30">
                                <CardContent className="p-3">
                                  <span className="text-[9px] font-bold text-slate-500 uppercase block">Ahorro real efectivo</span>
                                  <span className="text-lg font-black text-teal-800 block mt-1">
                                    ${pprAhorroRealEfectivo.toLocaleString("es-MX", { maximumFractionDigits: 0 })}
                                  </span>
                                  <span className="text-[8px] font-bold text-emerald-600 block mt-0.5">
                                    % Real de Rentabilidad: {pprRentabilidadReal.toFixed(1)}%
                                  </span>
                                </CardContent>
                              </Card>
                            </>
                          )}
                        </div>

                        {/* Mid Section: Params & SA Growth Timeline & Recharts */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                          
                          {/* Params and Suma Asegurada cards */}
                          <div className="md:col-span-5 space-y-4 flex flex-col">
                            <Card className="border shadow-none flex-1">
                              <CardHeader className="py-2.5 px-3 bg-slate-50 border-b">
                                <CardTitle className="text-[10px] font-black text-slate-700 uppercase tracking-widest">
                                  Parámetros Originales
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="p-3 text-[11px] space-y-1.5">
                                <div className="flex justify-between border-b pb-1">
                                  <span className="text-slate-500 font-medium">Producto</span>
                                  <span className="font-bold text-slate-800">{selectedQuote.producto}</span>
                                </div>
                                <div className="flex justify-between border-b pb-1">
                                  <span className="text-slate-500 font-medium">Duración de Pagos</span>
                                  <span className="font-bold text-slate-800">
                                    {selectedQuote.duracion === "EA65" ? "Edad Alcanzada 65 Años" : `${selectedQuote.duracion} Años`}
                                  </span>
                                </div>
                                <div className="flex justify-between border-b pb-1">
                                  <span className="text-slate-500 font-medium">UDI Inicial</span>
                                  <span className="font-bold text-slate-800">${(selectedQuote.valorUdi || 8.25).toFixed(4)}</span>
                                </div>
                                <div className="flex justify-between border-b pb-1">
                                  <span className="text-slate-500 font-medium">Inflación UDI Anual</span>
                                  <span className="font-bold text-teal-600">{(selectedQuote.inflacionUdi || 5.0).toFixed(1)}%</span>
                                </div>
                                {selectedQuote.producto.includes("PPR") && (
                                  <div className="flex justify-between">
                                    <span className="text-slate-500 font-medium">ISR Deductible</span>
                                    <span className="font-bold text-slate-800">{selectedQuote.isr || 35}%</span>
                                  </div>
                                )}
                              </CardContent>
                            </Card>

                            <Card className="border shadow-none">
                              <CardHeader className="py-2.5 px-3 bg-slate-50 border-b">
                                <CardTitle className="text-[10px] font-black text-slate-700 uppercase tracking-widest flex items-center gap-1">
                                  <Sparkles className="h-3.5 w-3.5 text-teal-600" /> Crecimiento Suma Asegurada
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="p-3 text-[11px]">
                                <div className="relative border-l border-teal-200 pl-4 space-y-1.5">
                                  <div className="relative">
                                    <span className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-teal-600"></span>
                                    <div className="flex justify-between text-[10px]">
                                      <span className="text-slate-500">Año 1</span>
                                      <span className="font-bold text-slate-800">${saY1.toLocaleString("es-MX", {maximumFractionDigits:0})}</span>
                                    </div>
                                  </div>
                                  {saY10 > 0 && (
                                    <div className="relative">
                                      <span className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-teal-600"></span>
                                      <div className="flex justify-between text-[10px]">
                                        <span className="text-slate-500">Año 10</span>
                                        <span className="font-bold text-slate-800">${saY10.toLocaleString("es-MX", {maximumFractionDigits:0})}</span>
                                      </div>
                                    </div>
                                  )}
                                  {saY20 > 0 && (
                                    <div className="relative">
                                      <span className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-teal-600"></span>
                                      <div className="flex justify-between text-[10px]">
                                        <span className="text-slate-500">Año 20</span>
                                        <span className="font-bold text-slate-800">${saY20.toLocaleString("es-MX", {maximumFractionDigits:0})}</span>
                                      </div>
                                    </div>
                                  )}
                                  {saY30 > 0 && (
                                    <div className="relative">
                                      <span className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-teal-600"></span>
                                      <div className="flex justify-between text-[10px]">
                                        <span className="text-slate-500">Año 30</span>
                                        <span className="font-bold text-slate-800">${saY30.toLocaleString("es-MX", {maximumFractionDigits:0})}</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <div className="text-[9px] text-slate-500 font-medium mt-2.5 border-t pt-1.5 flex items-center gap-1.5">
                                  <span className="text-[8px] bg-teal-600 text-white font-extrabold px-1.5 py-0.5 rounded tracking-widest uppercase">
                                    PROTECCIÓN
                                  </span>
                                  <span>Monto por fallecimiento garantizado.</span>
                                </div>
                              </CardContent>
                            </Card>
                          </div>

                          {/* Recharts Area Chart */}
                          <div className="md:col-span-7 border rounded-2xl p-4 flex flex-col justify-between min-h-56 shadow-none">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">
                                Proyección del Ahorro Garantizado
                              </span>
                              <span className="text-[9px] text-muted-foreground">Valores en Pesos</span>
                            </div>
                            
                            <div className="h-44 w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                <AreaChart
                                  data={parsedRows}
                                  margin={{ top: 2, right: 2, left: 2, bottom: 2 }}
                                >
                                  <defs>
                                    <linearGradient id="adminColorAhorro" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.01}/>
                                    </linearGradient>
                                    <linearGradient id="adminColorAportado" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#64748b" stopOpacity={0.1}/>
                                      <stop offset="95%" stopColor="#64748b" stopOpacity={0.01}/>
                                    </linearGradient>
                                  </defs>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0"/>
                                  {/* Shading/ReferenceArea for payment period */}
                                  {endPaymentAge && startAge && (
                                    <ReferenceArea
                                      x1={startAge}
                                      x2={endPaymentAge}
                                      fill="#3b82f6"
                                      fillOpacity={0.06}
                                      label={{
                                        value: "Periodo de Pago",
                                        position: "insideBottomLeft",
                                        fill: "#1e3a8a",
                                        fontSize: 9,
                                        fontWeight: "bold",
                                        opacity: 0.6
                                      }}
                                    />
                                  )}
                                  {/* Vertical line marker at Fin de Aportaciones */}
                                  {endPaymentAge && (
                                    <ReferenceLine
                                      x={endPaymentAge}
                                      stroke="#1e3a8a"
                                      strokeWidth={2}
                                      strokeDasharray="4 4"
                                      label={{
                                        value: `Fin de Pagos (Edad ${endPaymentAge})`,
                                        position: "top",
                                        fill: "#1e3a8a",
                                        fontSize: 9,
                                        fontWeight: "black"
                                      }}
                                    />
                                  )}
                                  <XAxis dataKey="edad" tickLine={false} axisLine={false} tick={{ fontSize: 9 }} />
                                  <YAxis 
                                    tickLine={false} 
                                    axisLine={false} 
                                    tick={{ fontSize: 9 }} 
                                    tickFormatter={(v) => {
                                      if (v >= 1000000) return `$${(v/1000000).toFixed(1)}M`
                                      if (v >= 1000) return `$${(v/1000).toFixed(0)}k`
                                      return `$${v}`
                                    }} 
                                  />
                                  <Tooltip 
                                    labelFormatter={(label) => `Edad: ${label}`}
                                    formatter={(value: any) => [`$${value.toLocaleString("es-MX", {maximumFractionDigits:0})}`, ""]} 
                                  />
                                  <Legend iconSize={8} wrapperStyle={{ fontSize: 9 }} />
                                  <Area name="Ahorro Garantizado ($)" type="monotone" dataKey="valoresPesos" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#adminColorAhorro)" />
                                  <Area name="Aportación Acumulada ($)" type="monotone" dataKey="accumulatedPremiumPesos" stroke="#64748b" strokeWidth={1.5} fillOpacity={1} fill="url(#adminColorAportado)" />
                                </AreaChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        </div>

                        {/* Projection Table */}
                        <div className="space-y-2">
                          <h4 className="text-[10px] font-black text-slate-700 uppercase tracking-widest">
                            Tabla Completa de Beneficios Garantizados
                          </h4>
                          <div className="border rounded-xl overflow-hidden max-h-80 overflow-y-auto">
                            <Table className="w-full text-xs">
                              <TableHeader className="bg-[#87D1B5] sticky top-0 z-10">
                                <TableRow>
                                  <TableHead className="font-bold text-white text-center py-2">Año</TableHead>
                                  <TableHead className="font-bold text-white text-center py-2">Edad</TableHead>
                                  <TableHead className="font-bold text-white text-center py-2">Valor UDI</TableHead>
                                  <TableHead className="font-bold text-white text-center py-2">Prima UDIS</TableHead>
                                  <TableHead className="font-bold text-white text-center py-2">Prima Pesos</TableHead>
                                  <TableHead className="font-bold text-white text-center py-2">SA UDIS</TableHead>
                                  <TableHead className="font-bold text-white text-center py-2">SA Pesos</TableHead>
                                  <TableHead className="font-bold text-white text-center py-2">Ahorro UDIS</TableHead>
                                  <TableHead className="font-bold text-white text-center py-2">Ahorro Pesos</TableHead>
                                  <TableHead className="font-bold text-white text-center py-2">Rendimiento</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {parsedRows.map((row: any, idx: number) => {
                                  let rowStyle = "bg-white text-slate-800"
                                  if (idx % 2 === 0) rowStyle = "bg-slate-50/40 text-slate-800"

                                  const paymentDurationNum = parseInt(selectedQuote.duracion || "")
                                  const isPaymentEndRow = !isNaN(paymentDurationNum)
                                    ? row.anio === paymentDurationNum
                                    : (selectedQuote.duracion === "EA65" && row.edad === 65)

                                  const isGreenRow = row.edad === 65 && !isPaymentEndRow

                                  if (isPaymentEndRow) {
                                    rowStyle = "bg-[#1e3a8a] text-white font-black"
                                  } else if (isGreenRow) {
                                    rowStyle = "bg-[#77ac52] text-white font-bold"
                                  }

                                  const cellClass = (baseClass: string, colorClass: string) => {
                                    if (isPaymentEndRow || isGreenRow) {
                                      return `${baseClass} text-white font-bold`
                                    }
                                    return `${baseClass} ${colorClass}`
                                  }

                                  return (
                                    <TableRow key={idx} className={`border-b ${rowStyle}`}>
                                      <TableCell className={cellClass("text-center py-1.5 font-medium", "text-slate-800")}>{row.anio}</TableCell>
                                      <TableCell className={cellClass("text-center py-1.5", "text-slate-800")}>{row.edad}</TableCell>
                                      <TableCell className={cellClass("text-center py-1.5", "text-slate-600")}>{row.udiValue.toFixed(4)}</TableCell>
                                      <TableCell className={cellClass("text-center py-1.5 font-semibold", "text-slate-800")}>
                                        {row.primaUdis.toLocaleString("es-MX", { maximumFractionDigits: 0 })}
                                      </TableCell>
                                      <TableCell className={cellClass("text-center py-1.5 font-medium", "text-slate-800")}>
                                        ${row.primaPesos.toLocaleString("es-MX", { maximumFractionDigits: 0 })}
                                      </TableCell>
                                      <TableCell className={cellClass("text-center py-1.5", "text-slate-800")}>
                                        {row.saUdis.toLocaleString("es-MX", { maximumFractionDigits: 0 })}
                                      </TableCell>
                                      <TableCell className={cellClass("text-center py-1.5 font-semibold", "text-slate-800")}>
                                        ${row.saPesos.toLocaleString("es-MX", { maximumFractionDigits: 0 })}
                                      </TableCell>
                                      <TableCell className={cellClass("text-center py-1.5 font-semibold", "text-teal-700")}>
                                        {row.ahorroUdis.toLocaleString("es-MX", { maximumFractionDigits: 0 })}
                                      </TableCell>
                                      <TableCell className={cellClass("text-center py-1.5 font-bold", "text-emerald-600")}>
                                        ${row.valoresPesos.toLocaleString("es-MX", { maximumFractionDigits: 0 })}
                                      </TableCell>
                                      <TableCell className={cellClass("text-center py-1.5 font-semibold", "text-slate-700")}>
                                        {(row.rendimiento * 100).toFixed(1)}%
                                      </TableCell>
                                    </TableRow>
                                  )
                                })}
                              </TableBody>
                            </Table>
                          </div>
                        </div>

                        {/* Dynamic Coverages Table */}
                        <div className="bg-slate-50 border p-4 rounded-xl">
                          <span className="text-[9px] font-black text-slate-500 uppercase block tracking-wider mb-2">
                            Resumen de Coberturas Contratadas
                          </span>
                          <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
                            <Table className="w-full text-xs">
                              <TableHeader className="bg-slate-100">
                                <TableRow>
                                  <TableHead className="font-bold text-slate-700 py-1.5">Cobertura</TableHead>
                                  <TableHead className="font-bold text-slate-700 py-1.5 text-center">Tipo</TableHead>
                                  <TableHead className="font-bold text-slate-700 py-1.5 text-center">Suma Asegurada Inicial</TableHead>
                                  <TableHead className="font-bold text-slate-700 py-1.5 text-center">Estado</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                <TableRow className="border-b">
                                  <TableCell className="font-bold py-1.5">Fallecimiento (Cobertura Base)</TableCell>
                                  <TableCell className="text-center py-1.5"><span className="px-2 py-0.5 rounded bg-slate-100 text-[9px] font-semibold">Básica</span></TableCell>
                                  <TableCell className="text-center py-1.5 font-semibold">${saY1.toLocaleString("es-MX", {maximumFractionDigits:0})} MXN</TableCell>
                                  <TableCell className="text-center py-1.5"><span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[9px] font-bold">Amparada</span></TableCell>
                                </TableRow>
                                {parsedCoverages.itp && (
                                  <TableRow className="border-b">
                                    <TableCell className="font-bold py-1.5">Invalidez Total y Permanente (ITP)</TableCell>
                                    <TableCell className="text-center py-1.5"><span className="px-2 py-0.5 rounded bg-teal-50 text-teal-700 text-[9px] font-semibold">Adicional</span></TableCell>
                                    <TableCell className="text-center py-1.5 font-semibold">${saY1.toLocaleString("es-MX", {maximumFractionDigits:0})} MXN</TableCell>
                                    <TableCell className="text-center py-1.5"><span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[9px] font-bold">Amparada</span></TableCell>
                                  </TableRow>
                                )}
                                {parsedCoverages.epp && (
                                  <TableRow className="border-b">
                                    <TableCell className="font-bold py-1.5">Exención de Pago de Primas por ITP (EPP)</TableCell>
                                    <TableCell className="text-center py-1.5"><span className="px-2 py-0.5 rounded bg-teal-50 text-teal-700 text-[9px] font-semibold">Adicional</span></TableCell>
                                    <TableCell className="text-center py-1.5 font-semibold">Exención de Aportaciones</TableCell>
                                    <TableCell className="text-center py-1.5"><span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[9px] font-bold">Amparada</span></TableCell>
                                  </TableRow>
                                )}
                                {parsedCoverages.ma && (
                                  <TableRow>
                                    <TableCell className="font-bold py-1.5">Muerte Accidental (MA)</TableCell>
                                    <TableCell className="text-center py-1.5"><span className="px-2 py-0.5 rounded bg-teal-50 text-teal-700 text-[9px] font-semibold">Adicional</span></TableCell>
                                    <TableCell className="text-center py-1.5 font-semibold">${saY1.toLocaleString("es-MX", {maximumFractionDigits:0})} MXN</TableCell>
                                    <TableCell className="text-center py-1.5"><span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[9px] font-bold">Amparada</span></TableCell>
                                  </TableRow>
                                )}
                              </TableBody>
                            </Table>
                          </div>
                        </div>

                        {/* Fiscal Benefit Section */}
                        {selectedQuote.producto.includes("PPR") && (
                          <div className="bg-teal-50/40 border border-teal-200 p-4 rounded-xl space-y-2">
                            <div className="flex items-center gap-2">
                              <Percent className="h-4.5 w-4.5 text-teal-700" />
                              <h4 className="text-xs font-black text-teal-800 uppercase tracking-wider">
                                Detalle del Beneficio Fiscal Especial (PPR - Art 151 LISR)
                              </h4>
                            </div>
                            <p className="text-[11px] text-slate-600">
                              Estrategia de deducción anual acumulada basada en la tasa fiscal marginal recomendada de **{selectedQuote.isr || 35}%**:
                            </p>
                            <div className="grid grid-cols-2 gap-4 pt-1">
                              <div className="border bg-white p-2.5 rounded-lg text-center text-xs">
                                <span className="text-[9px] font-bold text-slate-500 block">Ahorro Fiscal Declaración Anual</span>
                                <span className="text-sm font-extrabold text-teal-700 block mt-0.5">
                                  ${benefitFiscalAnual.toLocaleString("es-MX", { maximumFractionDigits: 0 })} pesos
                                </span>
                              </div>
                              <div className="border bg-white p-2.5 rounded-lg text-center text-xs">
                                <span className="text-[9px] font-bold text-slate-500 block">Ahorro Fiscal Acumulado Total</span>
                                <span className="text-sm font-extrabold text-emerald-600 block mt-0.5">
                                  ${benefitFiscalTotal.toLocaleString("es-MX", { maximumFractionDigits: 0 })} pesos
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Modal disclaimer footer */}
                        <div className="border-t pt-3 flex justify-between items-center text-[9px] text-slate-400">
                          <span>* Cotización rescatada desde el registro histórico central de la promotoría.</span>
                          <span className="font-semibold text-slate-500">AACOM cotizador</span>
                        </div>
                      </>
                    )
                  })()}

                </div>
                /* RECREATION CONTAINER END */
              )}

            </div>

            {/* Modal Footer actions */}
            <div className="bg-slate-50 dark:bg-zinc-900 border-t p-4 flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => setSelectedQuote(null)} 
                className="h-9 px-4 text-xs font-bold"
              >
                Cerrar Vista
              </Button>
            </div>

          </div>
        </div>
      )}

      {/* TAB CONTENT 8: PUSH NOTIFICATIONS */}
            {activeTab === "notificaciones" && (
        <div className="space-y-6 animate-in fade-in duration-300 pb-10">
          <div className="max-w-xl mx-auto space-y-6">
            
            {/* Toggles del Sistema */}
            <Card className="border shadow-sm">
              <CardHeader className="bg-slate-50 border-b pb-4">
                <CardTitle className="text-lg font-black text-slate-700 flex items-center gap-2">
                  <BellRing className="h-5 w-5" /> Notificaciones Autom�ticas (Sistema)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-xl">
                  <div>
                    <h4 className="font-bold text-sm">Validaci�n 25 Puntos</h4>
                    <p className="text-xs text-slate-500">Alerta de Lunes a Viernes a las 5:00 PM</p>
                  </div>
                  <Button variant={pushPointsEnabled ? "default" : "outline"} onClick={handleTogglePointsSetting} className={pushPointsEnabled ? "bg-teal-600 hover:bg-teal-700 text-white" : ""}>
                    {pushPointsEnabled ? "Encendida" : "Apagada"}
                  </Button>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-xl">
                  <div>
                    <h4 className="font-bold text-sm">Planeaci�n Diaria</h4>
                    <p className="text-xs text-slate-500">Alerta de Lunes a Viernes a las 8:30 AM</p>
                  </div>
                  <Button variant={pushPlanningEnabled ? "default" : "outline"} onClick={handleTogglePlanningSetting} className={pushPlanningEnabled ? "bg-teal-600 hover:bg-teal-700 text-white" : ""}>
                    {pushPlanningEnabled ? "Encendida" : "Apagada"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Crear / Enviar Push */}
            <Card className="border shadow-sm border-blue-100 dark:border-blue-900/30">
              <CardHeader className="bg-blue-50/50 dark:bg-blue-950/20 border-b pb-4">
                <CardTitle className="text-lg font-black text-blue-700 dark:text-blue-400 flex items-center gap-2">
                  <BellRing className="h-5 w-5" /> Enviar o Programar Notificaci�n Push
                </CardTitle>
                <CardDescription>
                  Env�a un mensaje al instante o progr�malo para que se env�e autom�ticamente.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Destinatario</label>
                    <select
                      className="flex h-10 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:ring-offset-zinc-950 dark:placeholder:text-zinc-400"
                      value={pushRecipient}
                      onChange={(e) => setPushRecipient(e.target.value)}
                    >
                      <option value="ALL">Todos los agentes</option>
                      {usersList.filter(u => u.role === 'AGENTE' && u.active).map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Mensaje a mostrar</label>
                    <Input 
                      placeholder="Ej. �ltimo d�a de cierre! Manda tus cotizaciones antes de las 4 PM." 
                      value={pushMessage}
                      onChange={(e) => setPushMessage(e.target.value)}
                      maxLength={150}
                      className="rounded-xl border-slate-200"
                    />
                    <p className="text-xs text-muted-foreground text-right">{pushMessage.length}/150</p>
                  </div>

                  <div className="space-y-2 border-t pt-4">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">�Cu�ndo enviar?</label>
                    <select
                      className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-teal-600"
                      value={schedFreq}
                      onChange={(e) => setSchedFreq(e.target.value)}
                    >
                      <option value="NOW">En este momento</option>
                      <option value="ONCE">Una sola vez en el futuro</option>
                      <option value="DAILY">Diario (Lunes a Viernes)</option>
                    </select>
                  </div>

                  {schedFreq !== "NOW" && (
                    <div className="flex gap-3">
                      <div className="flex-1 space-y-2">
                        <label className="text-xs font-bold text-slate-500">Hora (M�xico)</label>
                        <select
                          className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                          value={schedHour}
                          onChange={(e) => setSchedHour(e.target.value)}
                        >
                          {[...Array(24)].map((_, i) => (
                            <option key={i} value={i}>{i === 0 ? "12 AM" : i < 12 ? i + " AM" : i === 12 ? "12 PM" : (i - 12) + " PM"}</option>
                          ))}
                        </select>
                      </div>
                      {schedFreq === "ONCE" && (
                        <div className="flex-1 space-y-2">
                          <label className="text-xs font-bold text-slate-500">Fecha</label>
                          <Input type="date" value={schedDate} onChange={e => setSchedDate(e.target.value)} required={schedFreq === "ONCE"} className="rounded-xl" />
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-2 border-t pt-4">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">PIN de Autorizaci�n</label>
                    <Input 
                      type="password"
                      placeholder="Ingresa el PIN de seguridad de 10 d�gitos" 
                      value={pushPin}
                      onChange={(e) => setPushPin(e.target.value)}
                      className="rounded-xl border-slate-200"
                    />
                  </div>

                  {pushStatus && (
                    <div className={"p-3 rounded-lg text-sm font-semibold text-center " + (pushStatus.includes("Error") ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600")}>
                      {pushStatus}
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    {schedFreq === "NOW" ? (
                      <Button onClick={handleSendPush} disabled={pushLoading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl h-11">
                        {pushLoading ? "Enviando..." : "Enviar Ahora Mismo"}
                      </Button>
                    ) : (
                      <Button onClick={handleCreateSchedule} disabled={pushLoading} className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl h-11">
                        {pushLoading ? "Programando..." : "Guardar Programaci�n"}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lista de Notificaciones Programadas */}
            {scheduledPushes.length > 0 && (
              <Card className="border shadow-sm">
                <CardHeader className="bg-slate-50 border-b py-3">
                  <CardTitle className="text-sm font-bold text-slate-700">Notificaciones Programadas</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="pl-4">Mensaje</TableHead>
                        <TableHead>Frecuencia / Hora</TableHead>
                        <TableHead className="w-[80px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {scheduledPushes.map(sp => (
                        <TableRow key={sp.id}>
                          <TableCell className="text-xs pl-4 font-medium">{sp.message}</TableCell>
                          <TableCell className="text-xs text-slate-500">
                            {sp.frequency === 'DAILY' ? 'Diario (L-V)' : "Una vez (" + sp.runDate + ")"} <br/>
                            a las {sp.timeHour === 0 ? "12 AM" : sp.timeHour < 12 ? sp.timeHour + " AM" : sp.timeHour === 12 ? "12 PM" : (sp.timeHour - 12) + " PM"}
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteSchedule(sp.id)} className="text-red-500 hover:bg-red-50">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT 9: BIBLIOTECA ADMIN */}
      {activeTab === "biblioteca" && (
        <BibliotecaAdmin />
      )}

      {activeTab === "votaciones" && currentUserRole === 'SUPER_ADMIN' && (
        <div className="space-y-6 animate-in fade-in duration-300 pb-10">
          <AdminPollManager />
        </div>
      )}

      {/* Styles inject for print layout within Admin preview */}
      <style jsx global>{`
        @media print {
          /* Admin Printable Report overlay overrides */
          body * {
            visibility: hidden !important;
          }
          #admin-printable-report, #admin-printable-report * {
            visibility: visible !important;
          }
          #admin-printable-report {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background-color: white !important;
          }
          /* Ensure headers color, padding, and font-size to prevent horizontal cutoff */
          th {
            background-color: #87D1B5 !important;
            color: white !important;
            padding: 4px 2px !important;
            font-size: 9px !important;
            text-align: center !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          td {
            padding: 4px 2px !important;
            font-size: 9px !important;
            text-align: center !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          tr.bg-\\[\\#1e3a8a\\] td {
            background-color: #1e3a8a !important;
            color: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          tr.bg-\\[\\#77ac52\\] td {
            background-color: #77ac52 !important;
            color: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>

      {/* MODAL EDITAR PERFIL DE AGENTE */}
      {selectedUserForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div 
            className="bg-white dark:bg-zinc-950 w-full max-w-md rounded-2xl border shadow-2xl flex flex-col p-6 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b pb-2 mb-4">
              <h3 className="text-sm font-black text-slate-800 dark:text-zinc-100 flex items-center gap-1.5">
                <Users className="h-5 w-5 text-teal-600" /> Editar Perfil de Agente
              </h3>
              <button 
                onClick={() => setSelectedUserForEdit(null)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-md"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-600 dark:text-zinc-400 uppercase">Nombre Completo</label>
                <Input
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="text-xs h-9"
                />
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-600 dark:text-zinc-400 uppercase">Teléfono</label>
                <Input
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="text-xs h-9"
                  placeholder="Ej: 5512345678"
                />
              </div>

              {/* BirthDate */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-600 dark:text-zinc-400 uppercase">Fecha de Nacimiento</label>
                <Input
                  type="date"
                  value={editBirthDate}
                  onChange={(e) => setEditBirthDate(e.target.value)}
                  className="text-xs h-9"
                />
              </div>

              {/* Photo Option: URL or File */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-600 dark:text-zinc-400 uppercase block font-black">Fotografía del Agente</label>
                
                {/* Preview */}
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full border bg-slate-50 overflow-hidden flex items-center justify-center shrink-0 shadow-inner">
                    {editImage ? (
                      <img 
                        src={resolveImageUrl(editImage)} 
                        alt="Preview" 
                        className="h-full w-full object-cover" 
                        onError={(e) => {
                          e.currentTarget.src = "/logo.png"
                        }}
                      />
                    ) : (
                      <Users className="h-8 w-8 text-slate-300" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="space-y-1">
                      <span className="text-[8px] font-black text-slate-400 uppercase block font-black">Opción 1: Pegar URL de Imagen</span>
                      <Input
                        type="url"
                        placeholder="https://ejemplo.com/foto-agente.jpg"
                        value={editImage && !editImage.startsWith("data:") ? editImage : ""}
                        onChange={(e) => setEditImage(e.target.value)}
                        className="text-[10px] h-7 px-2"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <span className="text-[8px] font-black text-slate-400 uppercase block font-black">Opción 2: Subir Archivo Local</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="text-[9px] text-slate-500 w-full cursor-pointer"
                      />
                      <p className="text-[8px] text-slate-400">JPG, PNG hasta 2 MB (Se guardará como Base64).</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-zinc-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedUserForEdit(null)}
                  className="font-bold text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={savingProfile}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs"
                >
                  {savingProfile ? <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
                  Guardar Cambios
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}






