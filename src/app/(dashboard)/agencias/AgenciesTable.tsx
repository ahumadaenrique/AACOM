"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { differenceInCalendarDays, format } from "date-fns";
import { es } from "date-fns/locale";
import { ShieldAlert, ShieldCheck, CheckCircle2, XCircle, Trash2, Gift, PhoneCall, PhoneOff, Bot, Sparkles, BookOpen, Coins, Video, Share2, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteAgency, getAgencyUsers, toggleAgencyRoleplay, updateAgencyMaxAdmins, toggleAgencyAcademyModule, toggleAgencyShareAacomVideos, toggleAgencyProyecto200Module } from "./actions";
import { useState, useEffect } from "react";
import { GiftModal } from "./GiftModal";
import { AgencyAiSettingsModal } from "./AgencyAiSettingsModal";

export function AgenciesTable({ agencies }: { agencies: any[] }) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingRoleId, setTogglingRoleId] = useState<string | null>(null);
  
  // Gift Modal States
  const [giftAgency, setGiftAgency] = useState<any | null>(null);
  const [giftAgencyUsers, setGiftAgencyUsers] = useState<any[]>([]);
  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
  const [giftInitialTab, setGiftInitialTab] = useState<string>("saas");
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [updatingMaxAdminsId, setUpdatingMaxAdminsId] = useState<string | null>(null);
  const [togglingAcademyId, setTogglingAcademyId] = useState<string | null>(null);
  const [togglingShareAacomId, setTogglingShareAacomId] = useState<string | null>(null);
  const [togglingProyecto200Id, setTogglingProyecto200Id] = useState<string | null>(null);

  const handleToggleProyecto200 = async (agencyId: string, current: boolean) => {
    try {
      setTogglingProyecto200Id(agencyId);
      await toggleAgencyProyecto200Module(agencyId, !current);
      setLocalAgencies(prev => prev.map(a => a.id === agencyId ? { ...a, allowProyecto200Module: !current } : a));
    } catch (e: any) {
      alert("Error al cambiar estado de Proyecto 200: " + (e.message || "Error"));
    } finally {
      setTogglingProyecto200Id(null);
    }
  };

  const handleToggleAcademy = async (agencyId: string, current: boolean) => {
    try {
      setTogglingAcademyId(agencyId);
      await toggleAgencyAcademyModule(agencyId, !current);
      setLocalAgencies(prev => prev.map(a => a.id === agencyId ? { ...a, allowAcademyModule: !current } : a));
    } catch (e: any) {
      alert("Error al cambiar estado de E-Learning: " + (e.message || "Error"));
    } finally {
      setTogglingAcademyId(null);
    }
  };

  const handleToggleShareAacom = async (agencyId: string, current: boolean) => {
    try {
      setTogglingShareAacomId(agencyId);
      await toggleAgencyShareAacomVideos(agencyId, !current);
      setLocalAgencies(prev => prev.map(a => a.id === agencyId ? { ...a, shareAacomAcademyVideos: !current } : a));
    } catch (e: any) {
      alert("Error al cambiar compartir videos de AACOM: " + (e.message || "Error"));
    } finally {
      setTogglingShareAacomId(null);
    }
  };
  const [localAgencies, setLocalAgencies] = useState<any[]>(agencies);

  // Sync if prop updates
  useEffect(() => {
    setLocalAgencies(agencies);
  }, [agencies]);

  const handleMaxAdminsChange = async (agencyId: string, value: number, activeAdmins: number) => {
    if (value < activeAdmins) {
      alert(
        `⚠️ ACCIÓN NO PERMITIDA: No puedes reducir el cupo a ${value} administradores.\n\n` +
        `Esta promotoría cuenta actualmente con ${activeAdmins} administradores activos.\n\n` +
        `Para poder reducir el límite, primero debes esperar a que en la promotoría degraden o cambien el rol de al menos ${activeAdmins - value} administrador(es).`
      );
      setLocalAgencies(prev => [...prev]);
      return;
    }

    try {
      setUpdatingMaxAdminsId(agencyId);
      await updateAgencyMaxAdmins(agencyId, value);
      setLocalAgencies(prev => prev.map(a => a.id === agencyId ? { ...a, maxAdmins: value } : a));
    } catch (e: any) {
      alert("Error al actualizar cupo de administradores: " + (e.message || "Error"));
    } finally {
      setUpdatingMaxAdminsId(null);
    }
  };

  // AI Modal States
  const [aiAgencyId, setAiAgencyId] = useState<string>("");
  const [aiAgencyName, setAiAgencyName] = useState<string>("");
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  const handleDelete = async (agencyId: string, agencyName: string) => {
    if (!confirm(`¿ESTÁS ABSOLUTAMENTE SEGURO de querer borrar a la agencia "${agencyName}"? Esta acción borrará la agencia por completo y no se puede deshacer.`)) {
      return;
    }
    
    try {
      setDeletingId(agencyId);
      await deleteAgency(agencyId);
    } catch (err: any) {
      alert("Error al borrar agencia: " + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleOpenGiftModal = async (agency: any, initialTab: string = "saas") => {
    setLoadingUsers(true);
    setGiftAgency(agency);
    setGiftInitialTab(initialTab);
    try {
      const users = await getAgencyUsers(agency.id);
      setGiftAgencyUsers(users);
      setIsGiftModalOpen(true);
    } catch (error) {
      console.error(error);
      alert("Error al obtener usuarios de la agencia.");
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleToggleRoleplay = async (agencyId: string, currentVal: boolean) => {
    try {
      setTogglingRoleId(agencyId);
      await toggleAgencyRoleplay(agencyId, !currentVal);
    } catch (err: any) {
      alert("Error cambiando acceso al simulador: " + err.message);
    } finally {
      setTogglingRoleId(null);
    }
  };

  return (
    <div className="mt-12 bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50">
        <h2 className="text-xl font-bold text-slate-800">Resumen de Clientes SaaS</h2>
        <p className="text-sm text-slate-500 mt-1">Estado de las suscripciones, vigencia, saldos (TIPS, Cédula, Academia PRO) y número de usuarios por agencia.</p>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 hover:bg-slate-50">
              <TableHead className="font-bold text-slate-600">Agencia y Saldos</TableHead>
              <TableHead className="font-bold text-slate-600">Administrador</TableHead>
              <TableHead className="font-bold text-slate-600 text-center">Usuarios</TableHead>
              <TableHead className="font-bold text-slate-600">Suscripción</TableHead>
              <TableHead className="font-bold text-slate-600 text-right">Vencimiento</TableHead>
              <TableHead className="font-bold text-slate-600 text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {localAgencies.map((agency) => {
              const admin = agency.users && agency.users.length > 0 ? agency.users[0] : null;
              const activeAdminsCount = agency.activeAdminsCount ?? agency.users?.length ?? (admin ? 1 : 0);
              
              const endDate = agency.subscriptionEndDate ? new Date(agency.subscriptionEndDate) : null;
              const now = new Date();
              const daysLeft = endDate ? differenceInCalendarDays(endDate, now) : 0;
              const SUBSCRIPTION_GRACE_MS = 36 * 60 * 60 * 1000;
              const isWithinGrace = endDate ? endDate.getTime() + SUBSCRIPTION_GRACE_MS >= now.getTime() : true;
              
              const isActive = (agency.subscriptionStatus === "active" || agency.subscriptionStatus === "trialing") && (!endDate || daysLeft >= 0 || isWithinGrace);
              const isWarning = isActive && endDate && daysLeft <= 7;
              const isExpired = Boolean(endDate && !isActive && daysLeft < 0);

              const cedulaDays = agency.cedulaDaysBalance ?? 0;
              const academiaMinutes = agency.academiaProMinutes ?? Math.floor((agency.voiceSecondsBalance || 0) / 60);
              const tipsCredits = agency.tipsCreditsBalance ?? 0;

              return (
                <TableRow key={agency.id} className="hover:bg-slate-50/80 transition-colors">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: agency.primaryColor || '#4f46e5' }}></div>
                      <span className="text-slate-800 font-bold">{agency.name}</span>
                      {!agency.active && <Badge variant="destructive" className="ml-2 text-[10px] px-1.5 py-0">Inactiva</Badge>}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">{agency.slug}.aacomsoft.com</div>
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 border gap-1 font-medium ${
                        (agency.voiceEngine || 'GEMINI_LIVE') === 'GEMINI_LIVE' 
                          ? 'border-indigo-200 text-indigo-700 bg-indigo-50/50' 
                          : 'border-purple-200 text-purple-700 bg-purple-50/50'
                      }`}>
                        <Sparkles className="w-2.5 h-2.5" />
                        {(agency.voiceEngine || 'GEMINI_LIVE') === 'GEMINI_LIVE' ? 'Gemini Live' : 'ElevenLabs'}
                      </Badge>
                      {agency.elevenLabsApiKey && (
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 border font-medium ${
                          (agency.byokActive ?? true) 
                            ? 'border-emerald-200 text-emerald-700 bg-emerald-50/50' 
                            : 'border-amber-200 text-amber-700 bg-amber-50/50'
                        }`}>
                          {(agency.byokActive ?? true) ? 'BYOK Activa' : 'BYOK Apagada'}
                        </Badge>
                      )}

                      {/* Saldo: Créditos TIPS */}
                      <button
                        type="button"
                        onClick={() => handleOpenGiftModal(agency, "tips")}
                        title="Click para regalar o gestionar Créditos TIPS"
                        className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border font-semibold transition cursor-pointer ${
                          tipsCredits > 0
                            ? "border-amber-300 text-amber-900 bg-amber-50 hover:bg-amber-100"
                            : "border-slate-200 text-slate-500 bg-slate-50 hover:bg-slate-100"
                        }`}
                      >
                        <Coins className="w-2.5 h-2.5 text-amber-600" />
                        TIPS: {tipsCredits} cr
                      </button>

                      {/* Saldo: Días de Cédula */}
                      <button
                        type="button"
                        onClick={() => handleOpenGiftModal(agency, "academia")}
                        title="Click para regalar o gestionar Días de Cédula"
                        className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border font-semibold transition cursor-pointer ${
                          cedulaDays > 0
                            ? "border-teal-300 text-teal-800 bg-teal-50 hover:bg-teal-100"
                            : "border-slate-200 text-slate-500 bg-slate-50 hover:bg-slate-100"
                        }`}
                      >
                        <BookOpen className="w-2.5 h-2.5 text-teal-600" />
                        Cédula: {cedulaDays}d
                      </button>

                      {/* Saldo: Minutos de Academia PRO (Simulador IA) */}
                      <button
                        type="button"
                        onClick={() => handleOpenGiftModal(agency, "simulador")}
                        title="Click para regalar o gestionar Minutos de Academia PRO (Simulador IA)"
                        className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border font-semibold transition cursor-pointer ${
                          academiaMinutes > 0
                            ? "border-purple-300 text-purple-800 bg-purple-50 hover:bg-purple-100"
                            : "border-slate-200 text-slate-500 bg-slate-50 hover:bg-slate-100"
                        }`}
                      >
                        <Sparkles className="w-2.5 h-2.5 text-purple-600" />
                        Academia PRO: {academiaMinutes}m
                      </button>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    {admin ? (
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm text-slate-800 font-bold">{admin.name || 'Sin Nombre'}</span>
                          {activeAdminsCount > 1 && (
                            <span 
                              className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-700 font-bold border border-indigo-200"
                              title={`Esta agencia tiene ${activeAdminsCount} administradores activos en total`}
                            >
                              +{activeAdminsCount - 1} más
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-500">{admin.email}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">No asignado</span>
                    )}
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200">
                        <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                        <span className="text-[11px] font-semibold text-slate-600">
                          Admins: <strong className="text-indigo-700 font-black">{activeAdminsCount}</strong> / {agency.maxAdmins ?? 2}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-400 font-medium">Cupo:</span>
                        <select
                          value={agency.maxAdmins ?? 2}
                          onChange={(e) => handleMaxAdminsChange(agency.id, Number(e.target.value), activeAdminsCount)}
                          disabled={updatingMaxAdminsId === agency.id}
                          className="text-[11px] font-bold bg-white hover:bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5 text-indigo-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-sm"
                          title="Límite máximo de administradores autorizados por el Super Admin para esta promotoría"
                        >
                          <option value={1}>1 Admin</option>
                          <option value={2}>2 Admins (Default)</option>
                          <option value={3}>3 Admins</option>
                          <option value={4}>4 Admins</option>
                          <option value={5}>5 Admins</option>
                          <option value={6}>6 Admins</option>
                          <option value={8}>8 Admins</option>
                          <option value={10}>10 Admins</option>
                        </select>
                      </div>
                      {updatingMaxAdminsId === agency.id && (
                        <span className="text-[10px] text-indigo-500 animate-pulse font-medium">Guardando...</span>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                      {agency._count?.users || 0}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    {isActive ? (
                      isWarning ? (
                        <div className="flex items-center gap-1.5 text-amber-600 text-sm font-semibold">
                          <ShieldAlert className="w-4 h-4" />
                          <span>{daysLeft <= 0 ? "En cobro hoy" : `Por vencer (${daysLeft} días)`}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-emerald-600 text-sm font-semibold">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Vigente</span>
                        </div>
                      )
                    ) : isExpired ? (
                      <div className="flex items-center gap-1.5 text-red-600 text-sm font-semibold">
                        <XCircle className="w-4 h-4" />
                        <span>Vencida</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-slate-500 text-sm font-semibold">
                        <XCircle className="w-4 h-4" />
                        <span>Inactiva/Cancelada</span>
                      </div>
                    )}
                  </TableCell>
                  
                  <TableCell className="text-right">
                    {endDate ? (
                      <div className="flex flex-col items-end">
                        <span className={`text-sm font-medium ${isExpired ? 'text-red-600' : 'text-slate-700'}`}>
                          {format(endDate, "dd MMM yyyy", { locale: es })}
                        </span>
                        {!isExpired && daysLeft > 7 && (
                          <span className="text-xs text-slate-400">Quedan {daysLeft} días</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-slate-400 italic">Ilimitada</span>
                    )}
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {/* Proyecto 200 (CRM y Piloto Automático) */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleProyecto200(agency.id, agency.allowProyecto200Module ?? (agency.id === "aacom" || agency.slug === "aacom"))}
                        disabled={togglingProyecto200Id === agency.id}
                        className={`text-xs h-7 px-2 border ${(agency.allowProyecto200Module ?? (agency.id === "aacom" || agency.slug === "aacom")) ? 'border-orange-300 text-orange-700 bg-orange-50 hover:bg-orange-100 font-bold' : 'border-slate-200 text-slate-400 bg-slate-50 hover:bg-slate-100'}`}
                        title={(agency.allowProyecto200Module ?? (agency.id === "aacom" || agency.slug === "aacom")) ? "Módulo Proyecto 200 HABILITADO (Click para Ocultar/Desactivar)" : "Módulo Proyecto 200 OCULTO/DESACTIVADO (Click para Habilitar)"}
                      >
                        <Flame className={`h-3.5 w-3.5 ${(agency.allowProyecto200Module ?? (agency.id === "aacom" || agency.slug === "aacom")) ? 'text-orange-600' : 'text-slate-400'}`} />
                      </Button>

                                            {/* Academia de Videos (Mini YouTube) */}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleToggleAcademy(agency.id, agency.allowAcademyModule ?? true)}
                        disabled={togglingAcademyId === agency.id}
                        className={`text-xs h-7 px-2 border ${(agency.allowAcademyModule ?? true) ? 'border-red-300 text-red-700 bg-red-50 hover:bg-red-100 font-bold' : 'border-slate-200 text-slate-400 bg-slate-50 hover:bg-slate-100'}`}
                        title={(agency.allowAcademyModule ?? true) ? "Módulo E-Learning HABILITADO (Click para Ocultar)" : "Módulo E-Learning OCULTO (Click para Habilitar)"}
                      >
                        <Video className={`h-3.5 w-3.5 ${(agency.allowAcademyModule ?? true) ? 'text-red-600' : 'text-slate-400'}`} />
                      </Button>

                      {/* Compartir Videos AACOM Oficiales */}
                      {agency.id !== "aacom" && agency.slug !== "aacom" && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleToggleShareAacom(agency.id, agency.shareAacomAcademyVideos ?? false)}
                          disabled={togglingShareAacomId === agency.id}
                          className={`text-xs h-7 px-2 border ${(agency.shareAacomAcademyVideos ?? false) ? 'border-indigo-300 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 font-bold' : 'border-slate-200 text-slate-400 bg-slate-50 hover:bg-slate-100'}`}
                          title={(agency.shareAacomAcademyVideos ?? false) ? "Videos Compartidos ACTIVOS con esta agencia (Click para Dejar de Compartir)" : "Videos Compartidos DESACTIVADOS con esta agencia (Click para Compartir)"}
                        >
                          <Share2 className={`h-3.5 w-3.5 ${(agency.shareAacomAcademyVideos ?? false) ? 'text-indigo-600' : 'text-slate-400'}`} />
                        </Button>
                      )}

<Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleToggleRoleplay(agency.id, agency.allowRoleplaySimulator ?? false)}
                        disabled={togglingRoleId === agency.id}
                        className={`text-xs h-7 px-2 border ${(agency.allowRoleplaySimulator ?? false) ? 'border-purple-300 text-purple-700 bg-purple-50 hover:bg-purple-100' : 'border-slate-200 text-slate-400 bg-slate-50 hover:bg-slate-100'}`}
                        title={(agency.allowRoleplaySimulator ?? false) ? "Simulador de Llamadas HABILITADO (Click para Bloquear)" : "Simulador de Llamadas BLOQUEADO (Click para Habilitar)"}
                      >
                        {(agency.allowRoleplaySimulator ?? false) ? <PhoneCall className="h-3.5 w-3.5 text-purple-600" /> : <PhoneOff className="h-3.5 w-3.5 text-slate-400" />}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleOpenGiftModal(agency)}
                        disabled={loadingUsers}
                        className="text-xs h-7 px-2 border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                        title="Regalos y Cortesías"
                      >
                        <Gift className="h-3.5 w-3.5" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => { setAiAgencyId(agency.id); setAiAgencyName(agency.name); setIsAiModalOpen(true); }}
                        className="text-xs h-7 px-2 border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                        title="Configuración IA (ElevenLabs BYOK)"
                      >
                        <Bot className="h-3.5 w-3.5" />
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => handleDelete(agency.id, agency.name)}
                        disabled={deletingId === agency.id}
                        className="text-xs h-7 px-2 bg-red-100 hover:bg-red-200 text-red-600 border border-red-200"
                        title="Borrar Agencia"
                      >
                        {deletingId === agency.id ? "..." : <Trash2 className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            
            {agencies.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                  No hay agencias registradas aún.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <GiftModal 
        isOpen={isGiftModalOpen}
        onClose={() => setIsGiftModalOpen(false)}
        agency={giftAgency}
        agencyUsers={giftAgencyUsers}
        initialTab={giftInitialTab}
      />

      <AgencyAiSettingsModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        agencyId={aiAgencyId}
        agencyName={aiAgencyName}
      />
    </div>
  );
}
