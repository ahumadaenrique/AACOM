"use client";

import React, { useState, useEffect, useTransition } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  createSatisfactionSurvey,
  getAgentSurveysAndReferrals,
  updateReferralStatus,
  deleteSurveyReferral,
  deleteSatisfactionSurvey,
} from "@/app/actions/satisfactionSurveys";
import {
  REFERRAL_STATUSES,
  type SurveyReferralInput,
} from "@/lib/satisfactionConstants";
import {
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  Save,
  Users,
  Phone,
  MessageCircle,
  Search,
  Sparkles,
  HelpCircle,
  Check,
  ChevronRight,
  TrendingUp,
  RefreshCw,
  Clock,
  UserCheck,
  Calendar,
  DollarSign,
  AlertCircle,
  Copy,
} from "lucide-react";

interface Props {
  currentUser: {
    id: string;
    name?: string | null;
    email: string;
    role: string;
    agencyId?: string | null;
  };
}

const TRIGGER_QUESTIONS = [
  {
    icon: "👶",
    title: "¿Bebé en camino o reciente?",
    text: "¿Conoces a alguien que haya sido papá o mamá en los últimos 3 años?",
    reason: "Protección familiar y fideicomisos educativos universitarios.",
  },
  {
    icon: "👔",
    title: "¿Líder en una empresa?",
    text: "¿Conoces a alguien que sea líder, director o dueño de negocio?",
    reason: "Hombre clave, deducción de impuestos y protección patrimonial.",
  },
  {
    icon: "💸",
    title: "¿Gastos descontrolados?",
    text: "¿Conoces a alguien que gasta mucho dinero y necesita control y orden financiero?",
    reason: "Estrategias de ahorro forzoso e inversión garantizada.",
  },
  {
    icon: "📊",
    title: "¿Dolor de cabeza fiscal?",
    text: "¿Conoces a alguien que necesite ayuda con sus impuestos o busque deducir en su declaración anual?",
    reason: "Planes PPR y Art. 185 LISR 100% deducibles.",
  },
  {
    icon: "🚀",
    title: "¿Crecimiento laboral?",
    text: "¿Conoces a alguien que haya sido promovido o cambiado de empleo con mejor sueldo en los últimos 6 meses?",
    reason: "Capacidad de ahorro fresca lista para optimizarse.",
  },
  {
    icon: "🛡️",
    title: "¿Sin fondo de emergencia?",
    text: "¿Conoces a alguien que no tenga control en sus gastos o viva con incertidumbre ante emergencias?",
    reason: "Planes flexibles de respaldo con liquidez.",
  },
];

export default function EncuestaSatisfaccionClient({ currentUser }: Props) {
  const [activeTab, setActiveTab] = useState<"nueva" | "historico">("nueva");
  const [isPending, startTransition] = useTransition();

  // Form State
  const [intervieweeName, setIntervieweeName] = useState("");
  const [q1Useful, setQ1Useful] = useState(true);
  const [q2Attractive, setQ2Attractive] = useState(true);
  const [q3Professional, setQ3Professional] = useState(true);
  const [q4Clear, setQ4Clear] = useState(true);
  const [q5WouldRecommend, setQ5WouldRecommend] = useState(true);
  const [surveyNotes, setSurveyNotes] = useState("");
  const [referrals, setReferrals] = useState<SurveyReferralInput[]>([
    { fullName: "", phone: "", notes: "" },
    { fullName: "", phone: "", notes: "" },
    { fullName: "", phone: "", notes: "" },
  ]);

  // Alert & feedback
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // History State
  const [surveysHistory, setSurveysHistory] = useState<any[]>([]);
  const [referralsHistory, setReferralsHistory] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [copiedQuestion, setCopiedQuestion] = useState<string | null>(null);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await getAgentSurveysAndReferrals();
      if (res.success) {
        setSurveysHistory(res.surveys || []);
        setReferralsHistory(res.referrals || []);
        setStats(res.stats || null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleAddReferralRow = () => {
    setReferrals((prev) => [...prev, { fullName: "", phone: "", notes: "" }]);
  };

  const handleRemoveReferralRow = (index: number) => {
    if (referrals.length <= 1) {
      setReferrals([{ fullName: "", phone: "", notes: "" }]);
      return;
    }
    setReferrals((prev) => prev.filter((_, i) => i !== index));
  };

  const handleReferralChange = (
    index: number,
    field: keyof SurveyReferralInput,
    value: string
  ) => {
    setReferrals((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleCopyTriggerQuestion = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedQuestion(text);
    setTimeout(() => setCopiedQuestion(null), 2000);
  };

  const handleSubmitSurvey = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackMessage(null);

    if (!intervieweeName.trim()) {
      setFeedbackMessage({
        type: "error",
        text: "Por favor escribe el nombre de la persona a la que le estás realizando la entrevista.",
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    startTransition(async () => {
      const res = await createSatisfactionSurvey({
        intervieweeName: intervieweeName.trim(),
        q1Useful,
        q2Attractive,
        q3Professional,
        q4Clear,
        q5WouldRecommend,
        notes: surveyNotes.trim() || undefined,
        referrals,
      });

      if (res.success) {
        setFeedbackMessage({
          type: "success",
          text: `¡Encuesta guardada con éxito! Se registraron ${res.totalReferralsSaved} referidos en tu embudo de seguimiento.`,
        });
        // Reset form
        setIntervieweeName("");
        setQ1Useful(true);
        setQ2Attractive(true);
        setQ3Professional(true);
        setQ4Clear(true);
        setQ5WouldRecommend(true);
        setSurveyNotes("");
        setReferrals([
          { fullName: "", phone: "", notes: "" },
          { fullName: "", phone: "", notes: "" },
          { fullName: "", phone: "", notes: "" },
        ]);
        // Refresh history
        await fetchHistory();
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setFeedbackMessage({
          type: "error",
          text: res.message || "Ocurrió un error al guardar la encuesta.",
        });
      }
    });
  };

  const handleStatusChange = async (referralId: string, newStatus: string) => {
    // Optimistic update
    setReferralsHistory((prev) =>
      prev.map((r) => (r.id === referralId ? { ...r, status: newStatus } : r))
    );

    const res = await updateReferralStatus(referralId, newStatus);
    if (!res.success) {
      alert("Error al actualizar el estado: " + res.message);
      fetchHistory();
    } else {
      fetchHistory();
    }
  };

  const handleDeleteReferral = async (referralId: string) => {
    if (!confirm("¿Seguro que deseas eliminar este referido?")) return;
    const res = await deleteSurveyReferral(referralId);
    if (res.success) {
      fetchHistory();
    } else {
      alert("Error al eliminar: " + res.message);
    }
  };

  const handleDeleteSurvey = async (surveyId: string) => {
    if (
      !confirm(
        "¿Seguro que deseas eliminar esta encuesta y todos los referidos asociados a ella?"
      )
    )
      return;
    const res = await deleteSatisfactionSurvey(surveyId);
    if (res.success) {
      fetchHistory();
    } else {
      alert("Error al eliminar: " + res.message);
    }
  };

  // Filtered referrals
  const filteredReferrals = referralsHistory.filter((r) => {
    const matchesSearch =
      (r.fullName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.phone || "").includes(searchTerm) ||
      (r.notes || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.survey?.intervieweeName || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "ALL" || r.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const s = REFERRAL_STATUSES.find((item) => item.value === status);
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
          s?.color || "bg-slate-100 text-slate-700 border-slate-300"
        }`}
      >
        {s?.label || status}
      </span>
    );
  };

  const totalSiCount =
    (q1Useful ? 1 : 0) +
    (q2Attractive ? 1 : 0) +
    (q3Professional ? 1 : 0) +
    (q4Clear ? 1 : 0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-slate-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-zinc-100 tracking-tight">
                Encuesta de Satisfacción
              </h1>
              <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">
                Técnica de los 4 SÍes para la obtención y prospección natural de referidos.
              </p>
            </div>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex bg-slate-100 dark:bg-zinc-900 p-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 w-full md:w-auto">
          <button
            onClick={() => setActiveTab("nueva")}
            className={`flex-1 md:flex-initial px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === "nueva"
                ? "bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-sm"
                : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
            }`}
          >
            <Plus className="h-4 w-4" />
            Nueva Encuesta
          </button>
          <button
            onClick={() => setActiveTab("historico")}
            className={`flex-1 md:flex-initial px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === "historico"
                ? "bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-sm"
                : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
            }`}
          >
            <Users className="h-4 w-4" />
            Mis Referidos & Histórico
            {referralsHistory.length > 0 && (
              <Badge className="ml-1 bg-emerald-600 text-white font-mono text-xs px-2 py-0">
                {referralsHistory.length}
              </Badge>
            )}
          </button>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedbackMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 shadow-md animate-in slide-in-from-top-2 duration-300 ${
            feedbackMessage.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200"
              : "bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-800 text-red-900 dark:text-red-200"
          }`}
        >
          <div className="flex items-center gap-3">
            {feedbackMessage.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
            )}
            <p className="text-sm font-semibold">{feedbackMessage.text}</p>
          </div>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="text-xs font-bold underline opacity-70 hover:opacity-100"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* TAB 1: NUEVA ENCUESTA */}
      {activeTab === "nueva" && (
        <form onSubmit={handleSubmitSurvey} className="space-y-8">
          {/* Entrevistado Header Card */}
          <Card className="border border-slate-200 dark:border-zinc-800 shadow-sm bg-gradient-to-br from-white to-slate-50/50 dark:from-zinc-950 dark:to-zinc-900">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-black text-slate-800 dark:text-zinc-100 flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-emerald-600" />
                  1. Datos de la Persona Entrevistada
                </CardTitle>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/50 px-2.5 py-1 rounded-md">
                  Paso Inicial
                </span>
              </div>
              <CardDescription>
                Registra el nombre de tu cliente o prospecto al que le estás realizando la entrevista.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-zinc-400 mb-1.5">
                  Nombre completo del Cliente o Prospecto *
                </label>
                <Input
                  type="text"
                  placeholder="Ej. Ing. Carlos Mendoza Torres"
                  value={intervieweeName}
                  onChange={(e) => setIntervieweeName(e.target.value)}
                  required
                  className="text-base font-semibold py-6 bg-white dark:bg-zinc-900 border-slate-300 dark:border-zinc-700 focus:ring-emerald-500"
                />
              </div>
            </CardContent>
          </Card>

          {/* Las 5 Preguntas - Técnica de los 4 SIs */}
          <Card className="border border-slate-200 dark:border-zinc-800 shadow-md overflow-hidden bg-white dark:bg-zinc-950">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 text-white">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div>
                  <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    2. La Técnica de los 4 SÍ&apos;s y la Recomendación
                  </h3>
                  <p className="text-xs text-emerald-100 font-medium">
                    Haz las 4 preguntas de validación. Al responder &quot;SÍ&quot; en todas, la quinta pregunta de referidos se convierte en una respuesta afirmativa natural.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs font-black shrink-0">
                  <span>{totalSiCount} de 4 SÍes confirmados</span>
                </div>
              </div>
            </div>

            <CardContent className="p-6 space-y-6">
              {/* Pregunta 1 */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                    Pregunta 1 de 4 (Utilidad)
                  </span>
                  <p className="text-base font-bold text-slate-800 dark:text-zinc-100">
                    1) ¿Encuentras útil la asesoría que te acabo de brindar?
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setQ1Useful(true)}
                    className={`px-6 py-2.5 rounded-lg text-sm font-black transition-all flex items-center gap-1.5 ${
                      q1Useful
                        ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30 scale-105"
                        : "bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-300 dark:border-zinc-700 hover:bg-slate-100"
                    }`}
                  >
                    <Check className="h-4 w-4" /> Sí
                  </button>
                  <button
                    type="button"
                    onClick={() => setQ1Useful(false)}
                    className={`px-5 py-2.5 rounded-lg text-sm font-black transition-all flex items-center gap-1.5 ${
                      !q1Useful
                        ? "bg-red-600 text-white shadow-md shadow-red-600/30 scale-105"
                        : "bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-300 dark:border-zinc-700 hover:bg-slate-100"
                    }`}
                  >
                    <XCircle className="h-4 w-4" /> No
                  </button>
                </div>
              </div>

              {/* Pregunta 2 */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                    Pregunta 2 de 4 (Propuesta de Valor)
                  </span>
                  <p className="text-base font-bold text-slate-800 dark:text-zinc-100">
                    2) ¿Encuentras atractivos las soluciones y diagnósticos que te entregamos?
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setQ2Attractive(true)}
                    className={`px-6 py-2.5 rounded-lg text-sm font-black transition-all flex items-center gap-1.5 ${
                      q2Attractive
                        ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30 scale-105"
                        : "bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-300 dark:border-zinc-700 hover:bg-slate-100"
                    }`}
                  >
                    <Check className="h-4 w-4" /> Sí
                  </button>
                  <button
                    type="button"
                    onClick={() => setQ2Attractive(false)}
                    className={`px-5 py-2.5 rounded-lg text-sm font-black transition-all flex items-center gap-1.5 ${
                      !q2Attractive
                        ? "bg-red-600 text-white shadow-md shadow-red-600/30 scale-105"
                        : "bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-300 dark:border-zinc-700 hover:bg-slate-100"
                    }`}
                  >
                    <XCircle className="h-4 w-4" /> No
                  </button>
                </div>
              </div>

              {/* Pregunta 3 */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                    Pregunta 3 de 4 (Profesionalismo)
                  </span>
                  <p className="text-base font-bold text-slate-800 dark:text-zinc-100">
                    3) ¿Mi asesoría fue profesional en todos los sentidos?
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setQ3Professional(true)}
                    className={`px-6 py-2.5 rounded-lg text-sm font-black transition-all flex items-center gap-1.5 ${
                      q3Professional
                        ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30 scale-105"
                        : "bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-300 dark:border-zinc-700 hover:bg-slate-100"
                    }`}
                  >
                    <Check className="h-4 w-4" /> Sí
                  </button>
                  <button
                    type="button"
                    onClick={() => setQ3Professional(false)}
                    className={`px-5 py-2.5 rounded-lg text-sm font-black transition-all flex items-center gap-1.5 ${
                      !q3Professional
                        ? "bg-red-600 text-white shadow-md shadow-red-600/30 scale-105"
                        : "bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-300 dark:border-zinc-700 hover:bg-slate-100"
                    }`}
                  >
                    <XCircle className="h-4 w-4" /> No
                  </button>
                </div>
              </div>

              {/* Pregunta 4 */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                    Pregunta 4 de 4 (Claridad)
                  </span>
                  <p className="text-base font-bold text-slate-800 dark:text-zinc-100">
                    4) ¿Mi asesoría fue clara?
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setQ4Clear(true)}
                    className={`px-6 py-2.5 rounded-lg text-sm font-black transition-all flex items-center gap-1.5 ${
                      q4Clear
                        ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30 scale-105"
                        : "bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-300 dark:border-zinc-700 hover:bg-slate-100"
                    }`}
                  >
                    <Check className="h-4 w-4" /> Sí
                  </button>
                  <button
                    type="button"
                    onClick={() => setQ4Clear(false)}
                    className={`px-5 py-2.5 rounded-lg text-sm font-black transition-all flex items-center gap-1.5 ${
                      !q4Clear
                        ? "bg-red-600 text-white shadow-md shadow-red-600/30 scale-105"
                        : "bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-300 dark:border-zinc-700 hover:bg-slate-100"
                    }`}
                  >
                    <XCircle className="h-4 w-4" /> No
                  </button>
                </div>
              </div>

              {/* Pregunta 5 - LA CLAVE */}
              <div className="p-5 rounded-2xl border-2 border-emerald-500/50 dark:border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-teal-500/10 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-emerald-700 dark:text-emerald-300 uppercase tracking-wider bg-emerald-200/60 dark:bg-emerald-950 px-2 py-0.5 rounded-md">
                      🎯 El Cierre / Pregunta 5
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      Petición de Referidos
                    </span>
                  </div>
                  <p className="text-lg font-black text-slate-900 dark:text-zinc-50">
                    5) ¿Recomendarías mis servicios a gente que pueda encontrar utilidad en ellos?
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setQ5WouldRecommend(true)}
                    className={`px-7 py-3 rounded-xl text-base font-black transition-all flex items-center gap-2 ${
                      q5WouldRecommend
                        ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 scale-105 ring-2 ring-emerald-400"
                        : "bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-300 dark:border-zinc-700 hover:bg-slate-100"
                    }`}
                  >
                    <Check className="h-5 w-5" /> ¡Sí!
                  </button>
                  <button
                    type="button"
                    onClick={() => setQ5WouldRecommend(false)}
                    className={`px-5 py-3 rounded-xl text-base font-black transition-all flex items-center gap-2 ${
                      !q5WouldRecommend
                        ? "bg-red-600 text-white shadow-lg shadow-red-600/30 scale-105"
                        : "bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-300 dark:border-zinc-700 hover:bg-slate-100"
                    }`}
                  >
                    <XCircle className="h-5 w-5" /> No
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sección 3: A quién? (Campos Ilimitados para los Referidos) */}
          <Card className="border border-slate-200 dark:border-zinc-800 shadow-md bg-white dark:bg-zinc-950">
            <CardHeader className="border-b border-slate-200 dark:border-zinc-800 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-xl font-black text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                    <Users className="h-5 w-5 text-emerald-600" />
                    3. ¿A quién? (Captura de Referidos)
                  </CardTitle>
                  <CardDescription className="text-sm mt-1">
                    Captura en tiempo real los contactos que tu entrevistado te recomiende. Puedes agregar todos los que necesites.
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  onClick={handleAddReferralRow}
                  variant="outline"
                  className="font-bold border-emerald-500 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 flex items-center gap-2 shadow-sm self-start sm:self-auto"
                >
                  <Plus className="h-4 w-4" /> Agregar otro contacto
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-4">
              {/* Header de columnas */}
              <div className="hidden md:grid md:grid-cols-12 gap-3 pb-2 text-xs font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                <div className="col-span-4">Nombre del Contacto</div>
                <div className="col-span-3">Teléfono</div>
                <div className="col-span-4">Notas / Observaciones (Sin límite)</div>
                <div className="col-span-1 text-center">Acción</div>
              </div>

              {/* Filas de referidos */}
              <div className="space-y-3">
                {referrals.map((ref, idx) => (
                  <div
                    key={idx}
                    className="p-3 md:p-2 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 grid grid-cols-1 md:grid-cols-12 gap-3 items-center hover:border-emerald-300 dark:hover:border-emerald-800 transition-colors"
                  >
                    <div className="col-span-1 md:col-span-4">
                      <label className="block md:hidden text-xs font-bold text-slate-500 mb-1">
                        Nombre #{idx + 1}
                      </label>
                      <Input
                        type="text"
                        placeholder={`Nombre completo #${idx + 1}`}
                        value={ref.fullName}
                        onChange={(e) =>
                          handleReferralChange(idx, "fullName", e.target.value)
                        }
                        className="bg-white dark:bg-zinc-900 text-sm font-semibold"
                      />
                    </div>
                    <div className="col-span-1 md:col-span-3">
                      <label className="block md:hidden text-xs font-bold text-slate-500 mb-1">
                        Teléfono
                      </label>
                      <div className="relative">
                        <Phone className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
                        <Input
                          type="tel"
                          placeholder="Ej. 55 1234 5678"
                          value={ref.phone}
                          onChange={(e) =>
                            handleReferralChange(idx, "phone", e.target.value)
                          }
                          className="pl-9 bg-white dark:bg-zinc-900 text-sm font-medium font-mono"
                        />
                      </div>
                    </div>
                    <div className="col-span-1 md:col-span-4">
                      <label className="block md:hidden text-xs font-bold text-slate-500 mb-1">
                        Notas / Observaciones
                      </label>
                      <Input
                        type="text"
                        placeholder="Ej. Es hermano, trabaja en Finanzas, tiene 2 hijos"
                        value={ref.notes || ""}
                        onChange={(e) =>
                          handleReferralChange(idx, "notes", e.target.value)
                        }
                        className="bg-white dark:bg-zinc-900 text-sm"
                      />
                    </div>
                    <div className="col-span-1 md:col-span-1 flex justify-end md:justify-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveReferralRow(idx)}
                        disabled={referrals.length === 1 && !ref.fullName && !ref.phone}
                        className="text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 p-2"
                        title="Eliminar fila"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Botón rápido para sumar filas */}
              <div className="pt-2 flex justify-start">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddReferralRow}
                  className="w-full md:w-auto font-bold border-dashed border-2 border-emerald-400 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                >
                  <Plus className="h-4 w-4 mr-2" /> Agregar otra fila de referido
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Sección 4: Acordeón con Preguntas de Ayuda para el Agente */}
          <Card className="border border-amber-200 dark:border-amber-900/40 bg-gradient-to-br from-amber-50/70 via-white to-amber-50/30 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-black text-amber-900 dark:text-amber-300 flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-amber-600 shrink-0" />
                💡 Guía del Asesor: Preguntas Disparadoras de Referidos
              </CardTitle>
              <CardDescription className="text-xs text-amber-800/80 dark:text-zinc-400 font-medium">
                Si tu cliente dice &quot;No se me ocurre nadie en este momento&quot;, utiliza estas 6 preguntas de ayuda para destrabar su mente:
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="disparadores" className="border-b-0">
                  <AccordionTrigger className="text-sm font-bold text-amber-800 dark:text-amber-400 py-2 hover:no-underline">
                    Ver las 6 preguntas de ayuda recomendadas
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3">
                      {TRIGGER_QUESTIONS.map((tq, i) => (
                        <div
                          key={i}
                          className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-white dark:bg-zinc-900 shadow-sm flex flex-col justify-between gap-2"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black uppercase text-amber-700 dark:text-amber-400">
                                {tq.icon} {tq.title}
                              </span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCopyTriggerQuestion(tq.text)}
                                className="h-6 px-2 text-[10px] font-bold text-slate-500 hover:text-amber-700"
                                title="Copiar pregunta"
                              >
                                {copiedQuestion === tq.text ? (
                                  <span className="text-emerald-600 flex items-center gap-1">
                                    <Check className="h-3 w-3" /> Copiado
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1">
                                    <Copy className="h-3 w-3" /> Copiar
                                  </span>
                                )}
                              </Button>
                            </div>
                            <p className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                              {tq.text}
                            </p>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium italic">
                            🎯 Razón: {tq.reason}
                          </p>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* Notas generales de la entrevista */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
              Observaciones adicionales de la sesión (Opcional)
            </label>
            <Textarea
              placeholder="Anota cualquier compromiso, detalle de la cita o comentario relevante del cliente..."
              value={surveyNotes}
              onChange={(e) => setSurveyNotes(e.target.value)}
              rows={2}
              className="bg-white dark:bg-zinc-900 text-sm"
            />
          </div>

          {/* BOTÓN DE GUARDAR GRANDE Y CLARO */}
          <div className="pt-4 pb-12 flex flex-col items-center">
            <Button
              type="submit"
              disabled={isPending}
              className="w-full max-w-2xl py-8 text-lg md:text-xl font-black rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white shadow-2xl shadow-emerald-600/40 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-3 border-2 border-emerald-400/40"
            >
              {isPending ? (
                <>
                  <RefreshCw className="h-7 w-7 animate-spin" />
                  GUARDANDO ENCUESTA Y REFERIDOS...
                </>
              ) : (
                <>
                  <Save className="h-7 w-7" />
                  GUARDAR ENCUESTA Y REFERIDOS
                </>
              )}
            </Button>
            <p className="text-xs text-slate-400 dark:text-zinc-500 mt-2 font-medium">
              Al guardar, los referidos se agregarán automáticamente a tu embudo para seguimiento inmediato.
            </p>
          </div>
        </form>
      )}

      {/* TAB 2: HISTÓRICO Y MIS REFERIDOS */}
      {activeTab === "historico" && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* KPIs del Agente */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border shadow-sm bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/10">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                      Encuestas
                    </span>
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="text-3xl font-black text-slate-900 dark:text-zinc-100 mt-2">
                    {stats.totalSurveys}
                  </div>
                  <p className="text-[11px] font-bold text-slate-500 mt-1">
                    Entrevistas realizadas
                  </p>
                </CardContent>
              </Card>

              <Card className="border shadow-sm bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/10">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-blue-700 dark:text-blue-400">
                      Referidos
                    </span>
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="text-3xl font-black text-slate-900 dark:text-zinc-100 mt-2">
                    {stats.totalReferrals}
                  </div>
                  <p className="text-[11px] font-bold text-slate-500 mt-1">
                    Promedio: {stats.averageReferrals} por encuesta
                  </p>
                </CardContent>
              </Card>

              <Card className="border shadow-sm bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/10">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-purple-700 dark:text-purple-400">
                      Agendados
                    </span>
                    <Calendar className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="text-3xl font-black text-slate-900 dark:text-zinc-100 mt-2">
                    {stats.statusCounts?.AGENDADO || 0}
                  </div>
                  <p className="text-[11px] font-bold text-slate-500 mt-1">
                    Citas en agenda
                  </p>
                </CardContent>
              </Card>

              <Card className="border shadow-sm bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/10">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
                      Cerrados & Pagados
                    </span>
                    <DollarSign className="h-4 w-4 text-amber-600" />
                  </div>
                  <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
                    {stats.statusCounts?.CERRADO_PAGADO || 0}
                  </div>
                  <p className="text-[11px] font-bold text-slate-500 mt-1">
                    {stats.closedRate}% efectividad de cierre
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Filtros y Buscador */}
          <Card className="border border-slate-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-950">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                <div className="relative flex-1">
                  <Search className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Buscar por nombre de referido, teléfono, notas o entrevistador..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 bg-slate-50 dark:bg-zinc-900 text-sm font-medium"
                  />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
                  <Button
                    size="sm"
                    variant={filterStatus === "ALL" ? "default" : "outline"}
                    onClick={() => setFilterStatus("ALL")}
                    className="text-xs font-bold shrink-0"
                  >
                    Todos ({referralsHistory.length})
                  </Button>
                  {REFERRAL_STATUSES.map((st) => (
                    <Button
                      key={st.value}
                      size="sm"
                      variant={filterStatus === st.value ? "default" : "outline"}
                      onClick={() => setFilterStatus(st.value)}
                      className="text-xs font-bold shrink-0"
                    >
                      {st.label} (
                      {referralsHistory.filter((r) => r.status === st.value).length})
                    </Button>
                  ))}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={fetchHistory}
                    disabled={loadingHistory}
                    className="shrink-0 text-slate-500"
                    title="Actualizar datos"
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${loadingHistory ? "animate-spin" : ""}`}
                    />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabla de Referidos */}
          <Card className="border border-slate-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-950 overflow-hidden">
            <CardHeader className="py-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-black text-slate-800 dark:text-zinc-100 flex items-center gap-2">
                  <Users className="h-4 w-4 text-emerald-600" />
                  Lista de Referidos ({filteredReferrals.length})
                </CardTitle>
                <span className="text-xs font-bold text-slate-500">
                  Cambia el estatus en tiempo real en la columna Estado
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {filteredReferrals.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <Users className="h-12 w-12 text-slate-300 dark:text-zinc-700 mx-auto" />
                  <p className="text-base font-bold text-slate-600 dark:text-zinc-400">
                    No hay referidos registrados con este criterio.
                  </p>
                  <p className="text-xs text-slate-400">
                    Captura una nueva encuesta de satisfacción para alimentar tu embudo.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 dark:bg-zinc-900 text-xs font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400 border-b border-slate-200 dark:border-zinc-800">
                      <tr>
                        <th className="py-3 px-4">Contacto</th>
                        <th className="py-3 px-4">Teléfono & Acciones</th>
                        <th className="py-3 px-4">Referido por</th>
                        <th className="py-3 px-4">Notas / Observaciones</th>
                        <th className="py-3 px-4">Estado del Embudo</th>
                        <th className="py-3 px-4 text-center">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                      {filteredReferrals.map((ref) => {
                        const cleanPhone = (ref.phone || "").replace(/\D/g, "");
                        const waUrl = cleanPhone
                          ? `https://wa.me/52${cleanPhone}?text=${encodeURIComponent(
                              `Hola ${ref.fullName}, me dio tus datos ${ref.survey?.intervieweeName || "nuestro contacto en común"} para saludarte y compartirte una información de valor.`
                            )}`
                          : null;

                        return (
                          <tr
                            key={ref.id}
                            className="hover:bg-slate-50/80 dark:hover:bg-zinc-900/50 transition-colors"
                          >
                            <td className="py-3 px-4 font-bold text-slate-900 dark:text-zinc-100">
                              {ref.fullName}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs text-slate-700 dark:text-zinc-300">
                                  {ref.phone}
                                </span>
                                {cleanPhone && (
                                  <div className="flex items-center gap-1">
                                    <a
                                      href={`tel:${cleanPhone}`}
                                      className="p-1 rounded-md bg-slate-100 dark:bg-zinc-800 hover:bg-emerald-100 text-slate-600 hover:text-emerald-700"
                                      title="Llamar"
                                    >
                                      <Phone className="h-3.5 w-3.5" />
                                    </a>
                                    <a
                                      href={waUrl || "#"}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-1 rounded-md bg-emerald-100 dark:bg-emerald-950/60 hover:bg-emerald-200 text-emerald-700"
                                      title="WhatsApp"
                                    >
                                      <MessageCircle className="h-3.5 w-3.5" />
                                    </a>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-xs font-semibold text-slate-600 dark:text-zinc-400">
                              <div>{ref.survey?.intervieweeName || "Encuesta"}</div>
                              <div className="text-[10px] text-slate-400">
                                {new Date(ref.createdAt).toLocaleDateString("es-MX", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-xs text-slate-600 dark:text-zinc-400 max-w-xs truncate">
                              {ref.notes || <span className="italic text-slate-400">Sin notas</span>}
                            </td>
                            <td className="py-3 px-4">
                              <select
                                value={ref.status}
                                onChange={(e) =>
                                  handleStatusChange(ref.id, e.target.value)
                                }
                                className="text-xs font-bold py-1 px-2.5 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-sm focus:ring-emerald-500 focus:border-emerald-500 cursor-pointer"
                              >
                                {REFERRAL_STATUSES.map((st) => (
                                  <option key={st.value} value={st.value}>
                                    {st.label}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteReferral(ref.id)}
                                className="text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 p-1.5"
                                title="Eliminar referido"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Histórico de Encuestas Completadas */}
          <Card className="border border-slate-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-950">
            <CardHeader className="py-4 border-b border-slate-200 dark:border-zinc-800">
              <CardTitle className="text-base font-black text-slate-800 dark:text-zinc-100 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Historial de Encuestas Realizadas ({surveysHistory.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {surveysHistory.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">
                  Aún no has registrado encuestas.
                </p>
              ) : (
                surveysHistory.map((s) => (
                  <div
                    key={s.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/30 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-zinc-100 text-base">
                          {s.intervieweeName}
                        </span>
                        <Badge variant="outline" className="text-xs font-mono">
                          {s.referrals?.length || 0} referidos
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span>
                          Fecha:{" "}
                          {new Date(s.createdAt).toLocaleDateString("es-MX", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          Respuestas:
                          <span
                            className={
                              s.q1Useful ? "text-emerald-600 font-bold" : "text-red-500"
                            }
                          >
                            Q1:{s.q1Useful ? "Sí" : "No"}
                          </span>
                          <span
                            className={
                              s.q2Attractive
                                ? "text-emerald-600 font-bold"
                                : "text-red-500"
                            }
                          >
                            Q2:{s.q2Attractive ? "Sí" : "No"}
                          </span>
                          <span
                            className={
                              s.q3Professional
                                ? "text-emerald-600 font-bold"
                                : "text-red-500"
                            }
                          >
                            Q3:{s.q3Professional ? "Sí" : "No"}
                          </span>
                          <span
                            className={
                              s.q4Clear ? "text-emerald-600 font-bold" : "text-red-500"
                            }
                          >
                            Q4:{s.q4Clear ? "Sí" : "No"}
                          </span>
                          <span
                            className={
                              s.q5WouldRecommend
                                ? "text-emerald-600 font-black"
                                : "text-red-500 font-black"
                            }
                          >
                            Q5:{s.q5WouldRecommend ? "Sí" : "No"}
                          </span>
                        </span>
                      </div>
                      {s.notes && (
                        <p className="text-xs text-slate-600 dark:text-zinc-400 italic">
                          Nota: {s.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSurvey(s.id)}
                        className="text-slate-400 hover:text-red-600 text-xs"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" /> Eliminar Encuesta
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
