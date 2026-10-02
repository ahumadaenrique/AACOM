"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  getAdminSatisfactionData,
  updateReferralStatus,
  REFERRAL_STATUSES,
} from "@/app/actions/satisfactionSurveys";
import {
  Sparkles,
  Users,
  CheckCircle2,
  Calendar,
  DollarSign,
  TrendingUp,
  Search,
  RefreshCw,
  Phone,
  MessageCircle,
  Building2,
  Filter,
  BarChart3,
  Award,
} from "lucide-react";

export default function AdminSatisfactionSurveys() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [selectedAgency, setSelectedAgency] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [selectedAgentId, setSelectedAgentId] = useState<string>("ALL");
  const [subTab, setSubTab] = useState<"agentes" | "referidos" | "encuestas">("agentes");

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getAdminSatisfactionData(selectedAgency);
      if (res.success) {
        setData(res);
      } else {
        alert(res.message || "Error al cargar datos.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedAgency]);

  const handleStatusChange = async (referralId: string, newStatus: string) => {
    const res = await updateReferralStatus(referralId, newStatus);
    if (!res.success) {
      alert("Error al actualizar estado: " + res.message);
    } else {
      fetchData();
    }
  };

  if (loading && !data) {
    return (
      <div className="py-24 text-center space-y-4">
        <RefreshCw className="h-10 w-10 text-emerald-600 animate-spin mx-auto" />
        <p className="text-sm font-bold text-slate-500">Cargando métricas de satisfacción y referidos...</p>
      </div>
    );
  }

  const stats = data?.stats;
  const agentStats = data?.agentStats || [];
  const allSurveys = data?.surveys || [];
  const allReferrals = data?.referrals || [];
  const agencies = data?.agencies || [];
  const isSuperAdmin = data?.currentUserRole === "SUPER_ADMIN";

  // Filtered referrals
  const filteredReferrals = allReferrals.filter((r: any) => {
    const matchesSearch =
      (r.fullName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.phone || "").includes(searchTerm) ||
      (r.notes || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.user?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.survey?.intervieweeName || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === "ALL" || r.status === filterStatus;
    const matchesAgent = selectedAgentId === "ALL" || r.userId === selectedAgentId;

    return matchesSearch && matchesStatus && matchesAgent;
  });

  // Filtered surveys
  const filteredSurveys = allSurveys.filter((s: any) => {
    const matchesSearch =
      (s.intervieweeName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.user?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.notes || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAgent = selectedAgentId === "ALL" || s.userId === selectedAgentId;

    return matchesSearch && matchesAgent;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-200 dark:border-zinc-800">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-zinc-100 flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-emerald-600" />
            Control de Encuestas & Referidos
          </h2>
          <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">
            Supervisión integral de la técnica de los 4 SÍes, pipeline de referidos y desempeño por asesor.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Super Admin Agency Switcher */}
          {isSuperAdmin && agencies.length > 0 && (
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-slate-400" />
              <select
                value={selectedAgency}
                onChange={(e) => setSelectedAgency(e.target.value)}
                className="text-xs font-bold py-2 px-3 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-sm"
              >
                <option value="ALL">Todas las Promotorías</option>
                {agencies.map((ag: any) => (
                  <option key={ag.id} value={ag.id}>
                    {ag.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <Button
            onClick={fetchData}
            variant="outline"
            size="sm"
            disabled={loading}
            className="font-bold flex items-center gap-2 shadow-sm"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Global KPIs Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="border shadow-sm bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/10">
            <CardContent className="p-4">
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                Total Encuestas
              </span>
              <div className="text-3xl font-black text-slate-900 dark:text-zinc-100 mt-1">
                {stats.totalSurveys}
              </div>
              <p className="text-[11px] font-bold text-slate-500 mt-1">
                Entrevistas levantadas
              </p>
            </CardContent>
          </Card>

          <Card className="border shadow-sm bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/10">
            <CardContent className="p-4">
              <span className="text-[11px] font-black uppercase tracking-wider text-blue-700 dark:text-blue-400">
                Total Referidos
              </span>
              <div className="text-3xl font-black text-slate-900 dark:text-zinc-100 mt-1">
                {stats.totalReferrals}
              </div>
              <p className="text-[11px] font-bold text-slate-500 mt-1">
                {stats.avgReferralsPerSurvey} promedio x encuesta
              </p>
            </CardContent>
          </Card>

          <Card className="border shadow-sm bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/10">
            <CardContent className="p-4">
              <span className="text-[11px] font-black uppercase tracking-wider text-purple-700 dark:text-purple-400">
                En Prospección
              </span>
              <div className="text-3xl font-black text-slate-900 dark:text-zinc-100 mt-1">
                {(stats.statusCounts?.CONTACTADO || 0) + (stats.statusCounts?.AGENDADO || 0)}
              </div>
              <p className="text-[11px] font-bold text-slate-500 mt-1">
                {stats.statusCounts?.AGENDADO || 0} agendados
              </p>
            </CardContent>
          </Card>

          <Card className="border shadow-sm bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/10">
            <CardContent className="p-4">
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
                Propuestas
              </span>
              <div className="text-3xl font-black text-slate-900 dark:text-zinc-100 mt-1">
                {stats.statusCounts?.PROPUESTA_PRESENTADA || 0}
              </div>
              <p className="text-[11px] font-bold text-slate-500 mt-1">
                Presentadas
              </p>
            </CardContent>
          </Card>

          <Card className="border shadow-sm bg-gradient-to-br from-emerald-100 to-green-100 dark:from-emerald-950/40 dark:to-green-950/30">
            <CardContent className="p-4">
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                Cerrados & Pagados
              </span>
              <div className="text-3xl font-black text-emerald-700 dark:text-emerald-400 mt-1">
                {stats.statusCounts?.CERRADO_PAGADO || 0}
              </div>
              <p className="text-[11px] font-black text-emerald-700 dark:text-emerald-400 mt-1">
                {stats.globalConversionRate}% tasa de cierre
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 4 SI's Quality Thermometer */}
      {stats?.qAverages && (
        <Card className="border border-slate-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-950">
          <CardHeader className="py-3 px-6 border-b border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40">
            <CardTitle className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-zinc-300 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-emerald-600" />
              Efectividad de la Técnica de los 4 SÍes (% de respuestas afirmativas)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
                <span className="text-[11px] font-bold text-slate-500">1. ¿Útil?</span>
                <div className="text-2xl font-black text-emerald-600 mt-1">
                  {stats.qAverages.q1}%
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
                <span className="text-[11px] font-bold text-slate-500">2. ¿Atractivo?</span>
                <div className="text-2xl font-black text-emerald-600 mt-1">
                  {stats.qAverages.q2}%
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
                <span className="text-[11px] font-bold text-slate-500">3. ¿Profesional?</span>
                <div className="text-2xl font-black text-emerald-600 mt-1">
                  {stats.qAverages.q3}%
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
                <span className="text-[11px] font-bold text-slate-500">4. ¿Clara?</span>
                <div className="text-2xl font-black text-emerald-600 mt-1">
                  {stats.qAverages.q4}%
                </div>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800">
                <span className="text-[11px] font-black text-emerald-700 dark:text-emerald-300">
                  5. ¿Recomendarías?
                </span>
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                  {stats.qAverages.q5}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sub Tabs Navigation */}
      <div className="flex border-b border-slate-200 dark:border-zinc-800">
        <button
          onClick={() => setSubTab("agentes")}
          className={`px-6 py-3 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
            subTab === "agentes"
              ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Award className="h-4 w-4" /> Desempeño por Asesor ({agentStats.length})
        </button>
        <button
          onClick={() => setSubTab("referidos")}
          className={`px-6 py-3 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
            subTab === "referidos"
              ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Users className="h-4 w-4" /> Todos los Referidos ({allReferrals.length})
        </button>
        <button
          onClick={() => setSubTab("encuestas")}
          className={`px-6 py-3 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
            subTab === "encuestas"
              ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <CheckCircle2 className="h-4 w-4" /> Historial de Encuestas ({allSurveys.length})
        </button>
      </div>

      {/* SUBTAB 1: DESEMPEÑO POR ASESOR */}
      {subTab === "agentes" && (
        <Card className="border border-slate-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-950 overflow-hidden">
          <CardHeader className="py-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-black text-slate-800 dark:text-zinc-100 flex items-center gap-2">
                <Award className="h-5 w-5 text-emerald-600" />
                Métricas Individuales de Prospección por Agente
              </CardTitle>
              <span className="text-xs font-bold text-slate-500">
                Ordenado por mayor número de referidos capturados
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-zinc-900 text-xs font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400 border-b border-slate-200 dark:border-zinc-800">
                  <tr>
                    <th className="py-3 px-4">Asesor</th>
                    <th className="py-3 px-4">Agencia</th>
                    <th className="py-3 px-4 text-center">Encuestas</th>
                    <th className="py-3 px-4 text-center">Referidos Totales</th>
                    <th className="py-3 px-4 text-center">Contactados</th>
                    <th className="py-3 px-4 text-center">Agendados</th>
                    <th className="py-3 px-4 text-center">Propuestas</th>
                    <th className="py-3 px-4 text-center">Cerrados</th>
                    <th className="py-3 px-4 text-center">Efectividad</th>
                    <th className="py-3 px-4 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                  {agentStats.map((agent: any) => (
                    <tr
                      key={agent.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-zinc-900/50 transition-colors"
                    >
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-zinc-100">
                        <div>{agent.name}</div>
                        <div className="text-[11px] font-normal text-slate-500">
                          {agent.email}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs font-semibold text-slate-600 dark:text-zinc-400">
                        {agent.agencyName}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-800 dark:text-zinc-200">
                        {agent.surveysCount}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-black text-emerald-600 dark:text-emerald-400 text-base">
                          {agent.referralsCount}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-xs font-bold text-slate-600 dark:text-zinc-300">
                        {agent.contactado}
                      </td>
                      <td className="py-3 px-4 text-center text-xs font-bold text-amber-600">
                        {agent.agendado}
                      </td>
                      <td className="py-3 px-4 text-center text-xs font-bold text-purple-600">
                        {agent.propuesta}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                          {agent.cerrado}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-black text-xs text-slate-700 dark:text-zinc-300">
                        {agent.conversionRate}%
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedAgentId(agent.id);
                            setSubTab("referidos");
                          }}
                          className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                        >
                          Ver Contactos
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* SUBTAB 2: TODOS LOS REFERIDOS */}
      {subTab === "referidos" && (
        <div className="space-y-4">
          {/* Controls */}
          <Card className="border border-slate-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-950">
            <CardContent className="p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              <div className="relative flex-1">
                <Search className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Buscar referido, teléfono, notas, asesor o cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-slate-50 dark:bg-zinc-900 text-sm font-medium"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {selectedAgentId !== "ALL" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedAgentId("ALL")}
                    className="text-xs font-bold text-red-600 border-red-300"
                  >
                    Quitar filtro de asesor ✕
                  </Button>
                )}

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="text-xs font-bold py-1.5 px-3 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-sm"
                >
                  <option value="ALL">Todos los Estados</option>
                  {REFERRAL_STATUSES.map((st) => (
                    <option key={st.value} value={st.value}>
                      {st.label}
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          <Card className="border border-slate-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-950 overflow-hidden">
            <CardHeader className="py-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40">
              <CardTitle className="text-base font-black text-slate-800 dark:text-zinc-100 flex items-center justify-between">
                <span>Lista Detallada de Contactos Referidos ({filteredReferrals.length})</span>
                {selectedAgentId !== "ALL" && (
                  <span className="text-xs font-bold text-emerald-600">
                    Filtrado por asesor seleccionado
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {filteredReferrals.length === 0 ? (
                <div className="py-16 text-center text-slate-500 text-sm font-medium">
                  No se encontraron referidos con estos filtros.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 dark:bg-zinc-900 text-xs font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400 border-b border-slate-200 dark:border-zinc-800">
                      <tr>
                        <th className="py-3 px-4">Contacto</th>
                        <th className="py-3 px-4">Teléfono</th>
                        <th className="py-3 px-4">Asesor Responsable</th>
                        <th className="py-3 px-4">Referido por (Cliente)</th>
                        <th className="py-3 px-4">Notas</th>
                        <th className="py-3 px-4">Estado del Embudo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                      {filteredReferrals.map((ref: any) => {
                        const cleanPhone = (ref.phone || "").replace(/\D/g, "");
                        const waUrl = cleanPhone
                          ? `https://wa.me/52${cleanPhone}`
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
                            <td className="py-3 px-4 text-xs font-semibold text-slate-700 dark:text-zinc-300">
                              <div>{ref.user?.name || ref.user?.email || "Asesor"}</div>
                              <div className="text-[10px] text-slate-400">
                                {ref.user?.agency?.name || "Sin agencia"}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-xs font-semibold text-slate-600 dark:text-zinc-400">
                              <div>{ref.survey?.intervieweeName || "Entrevista"}</div>
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
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* SUBTAB 3: HISTORIAL DE ENCUESTAS */}
      {subTab === "encuestas" && (
        <Card className="border border-slate-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-950 overflow-hidden">
          <CardHeader className="py-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40">
            <CardTitle className="text-base font-black text-slate-800 dark:text-zinc-100 flex items-center justify-between">
              <span>Encuestas Realizadas ({filteredSurveys.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {filteredSurveys.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-8">
                No hay encuestas registradas con este criterio.
              </p>
            ) : (
              filteredSurveys.map((s: any) => (
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
                      <Badge className="bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 text-[10px]">
                        Asesor: {s.user?.name || s.user?.email}
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
                      <span className="flex items-center gap-1 font-mono">
                        <span className={s.q1Useful ? "text-emerald-600 font-bold" : "text-red-500"}>
                          Q1:{s.q1Useful ? "Sí" : "No"}
                        </span>
                        <span className={s.q2Attractive ? "text-emerald-600 font-bold" : "text-red-500"}>
                          Q2:{s.q2Attractive ? "Sí" : "No"}
                        </span>
                        <span className={s.q3Professional ? "text-emerald-600 font-bold" : "text-red-500"}>
                          Q3:{s.q3Professional ? "Sí" : "No"}
                        </span>
                        <span className={s.q4Clear ? "text-emerald-600 font-bold" : "text-red-500"}>
                          Q4:{s.q4Clear ? "Sí" : "No"}
                        </span>
                        <span className={s.q5WouldRecommend ? "text-emerald-600 font-black" : "text-red-500 font-black"}>
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
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
