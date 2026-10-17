'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import {
  Sparkles,
  Plus,
  QrCode,
  Monitor,
  Smartphone,
  Users,
  Coins,
  Calendar,
  MapPin,
  ArrowRight,
  Download,
  Settings,
  CheckCircle2,
  Flame,
  Clock,
  ShieldCheck,
  TrendingUp,
  Copy,
  Check,
  BarChart3,
  ExternalLink,
  RefreshCw,
  MessageCircle,
  Trash2,
  AlertTriangle,
} from 'lucide-react';

interface TipsPackage {
  id: string;
  name: string;
  credits: number;
  priceMxn: number;
  validityDays: number;
  badge?: string;
  description: string;
}

export default function TipsDashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [scope, setScope] = useState<'mine' | 'agency'>('mine');

  // Modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showNoCreditsModal, setShowNoCreditsModal] = useState(false);
  const [showBuyCreditsModal, setShowBuyCreditsModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedReportSession, setSelectedReportSession] = useState<any>(null);
  const [qrModalSession, setQrModalSession] = useState<any>(null);
  const [sessionToDelete, setSessionToDelete] = useState<any>(null);
  const [deletingSession, setDeletingSession] = useState(false);

  // Form crear sesión
  const [newTitle, setNewTitle] = useState('');
  const [newLocation, setNewLocation] = useState('Salón Presencial');
  const [newCapacity, setNewCapacity] = useState<number | ''>(50);
  const [newInactiveMin, setNewInactiveMin] = useState<number | ''>(3);
  const [creating, setCreating] = useState(false);

  // Form comprar créditos
  const [selectedPkgId, setSelectedPkgId] = useState('tips_70');
  const [promoCode, setPromoCode] = useState('');
  const [buyForAgency, setBuyForAgency] = useState(false);
  const [buying, setBuying] = useState(false);
  const [buyError, setBuyError] = useState('');

  // Form ajustes promotoría y permisos de créditos por agente
  const [realRate, setRealRate] = useState<number | ''>(4.0);
  const [inflationRate, setInflationRate] = useState<number | ''>(4.5);
  const [lifeExpectancy, setLifeExpectancy] = useState<number | ''>(82.3);
  const [sharePool, setSharePool] = useState(false);
  const [allowedAgentIds, setAllowedAgentIds] = useState<string[]>([]);
  const [agentSearch, setAgentSearch] = useState('');
  const [privacyNotice, setPrivacyNotice] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);

  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [bannerMsg, setBannerMsg] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/tips/sessions?scope=${scope}`, { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        setData(json);
        if (json.agencyConfig) {
          setRealRate(json.agencyConfig.tipsRealReturnRate ?? 4.0);
          setInflationRate(json.agencyConfig.tipsInflationRate ?? 4.5);
          setLifeExpectancy(json.agencyConfig.tipsLifeExpectancy ?? 82.3);
          const isSharing = Boolean(json.agencyConfig.tipsShareAgencyCredits);
          setSharePool(isSharing);
          setPrivacyNotice(json.agencyConfig.tipsPrivacyNotice || '');

          const rawAllowed = json.agencyConfig.tipsAllowedAgentIds;
          const allAgentsList: any[] = (json.agencyAgents || []).filter(
            (u: any) => u.role !== 'ADMIN' && u.role !== 'SUPER_ADMIN'
          );

          if (typeof rawAllowed === 'string' && rawAllowed.trim() !== '') {
            try {
              const parsed = JSON.parse(rawAllowed);
              if (Array.isArray(parsed)) {
                setAllowedAgentIds(parsed.map((id) => String(id)));
              } else {
                setAllowedAgentIds([]);
              }
            } catch (_) {
              setAllowedAgentIds(
                rawAllowed
                  .split(',')
                  .map((s: string) => s.trim())
                  .filter(Boolean)
              );
            }
          } else {
            setAllowedAgentIds([]);
          }
        }
      }
    } catch (err) {
      console.error('Error loading TIPS dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, [scope]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  useEffect(() => {
    if (searchParams?.get('purchase_tips_success') === 'true') {
      const cr = searchParams.get('credits') || '';
      setBannerMsg(
        `¡Recarga exitosa! Se abonaron ${cr} créditos TIPS con vigencia de 90 días a tu cuenta.`
      );
      fetchDashboard();
    }
  }, [searchParams, fetchDashboard]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowBuyCreditsModal(false);
        setShowCreateModal(false);
        setShowNoCreditsModal(false);
        setQrModalSession(null);
        setSelectedReportSession(null);
        setShowSettingsModal(false);
        setSessionToDelete(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleOpenCreateModal = () => {
    const available = data?.credits?.totalAvailableForHost ?? 0;
    if (available <= 0) {
      setShowNoCreditsModal(true);
      return;
    }
    setShowCreateModal(true);
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const cap = Number(newCapacity) || 50;
      const inact = Number(newInactiveMin) || 3;
      const res = await fetch('/api/tips/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          location: newLocation.trim() || 'Presencial',
          expectedCapacity: cap,
          allowNicknames: false,
          inactiveThresholdSec: inact * 60,
          agencyId: data?.agencyConfig?.id || data?.user?.agencyId,
        }),
      });
      const json = await res.json();
      if (res.ok && json.session) {
        setShowCreateModal(false);
        setNewTitle('');
        router.push(`/tips/${json.session.id}/host`);
      } else {
        if (res.status === 402 || json.code === 'NO_TIPS_CREDITS') {
          setShowCreateModal(false);
          setShowNoCreditsModal(true);
        } else {
          alert(json.error || 'Error al crear la sesión');
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteSession = async () => {
    if (!sessionToDelete) return;
    setDeletingSession(true);
    try {
      const res = await fetch(
        `/api/tips/sessions?sessionId=${encodeURIComponent(sessionToDelete.id)}`,
        {
          method: 'DELETE',
        }
      );
      const json = await res.json();
      if (res.ok && json.success) {
        setBannerMsg(
          `El evento "${sessionToDelete.title}" (Código ${sessionToDelete.code}) fue eliminado permanentemente.`
        );
        setSessionToDelete(null);
        fetchDashboard();
      } else {
        alert(json.error || 'No se pudo eliminar la sesión.');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión al intentar eliminar la sesión.');
    } finally {
      setDeletingSession(false);
    }
  };

  const handleBuyCredits = async () => {
    setBuying(true);
    setBuyError('');
    try {
      const res = await fetch('/api/checkout/tips-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: selectedPkgId,
          promoCode: promoCode.trim(),
          forAgency: buyForAgency,
        }),
      });
      const json = await res.json();
      if (res.ok && json.url) {
        window.location.href = json.url;
      } else {
        setBuyError(json.error || 'No se pudo iniciar el pago en Stripe.');
      }
    } catch (err) {
      setBuyError('Error de conexión al procesar la compra.');
    } finally {
      setBuying(false);
    }
  };

  const handleGrantSuperAdminBonus = async (target: 'user' | 'agency') => {
    try {
      const res = await fetch('/api/tips/sessions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'GRANT_BONUS_CREDITS',
          credits: 30,
          target,
          agencyId: data?.agencyConfig?.id || data?.user?.agencyId,
        }),
      });
      if (res.ok) {
        setBannerMsg(`Se abonaron +30 créditos de prueba a la bolsa (${target === 'agency' ? 'Promotoría' : 'Personal'}).`);
        fetchDashboard();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await fetch('/api/tips/sessions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agencyId: data?.agencyConfig?.id || data?.user?.agencyId,
          tipsShareAgencyCredits: sharePool,
          tipsAllowedAgentIds: sharePool ? allowedAgentIds : [],
          tipsRealReturnRate: Number(realRate || 4.0),
          tipsInflationRate: Number(inflationRate || 4.5),
          tipsLifeExpectancy: Number(lifeExpectancy || 82.3),
          tipsPrivacyNotice: privacyNotice,
        }),
      });
      if (res.ok) {
        setShowSettingsModal(false);
        setBannerMsg(
          sharePool
            ? `Configuración guardada: Bolsa compartida habilitada para ${allowedAgentIds.length} agente(s) autorizado(s).`
            : 'Configuración guardada: Bolsa de Promotoría bloqueada para agentes (cada agente paga sus propios créditos).'
        );
        fetchDashboard();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingSettings(false);
    }
  };

  const exportSessionCsv = (sess: any) => {
    const headers = [
      'Nombre Completo',
      'Celular',
      'Correo',
      'Consentimiento LFPDPPP',
      'Paso Alcanzado (de 8)',
      'Score Lead (0-100)',
      'Clasificacion',
      'Cliente Vinculado en Cartera',
    ];
    const rows = (sess.participants || []).map((p: any) => [
      `"${(p.fullName || p.nickname || '').replace(/"/g, '""')}"`,
      `"${p.phone || ''}"`,
      `"${p.email || ''}"`,
      p.privacyAccepted ? 'SI' : 'NO',
      `${p.completedStep}/8`,
      p.leadScore || 0,
      p.leadTier || 'COLD',
      p.linkedClientId ? 'SI' : 'NO',
    ]);

    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((r: any[]) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_tips_${sess.code}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isManager = data?.user?.role === 'ADMIN' || data?.user?.role === 'SUPER_ADMIN';
  const isSuperAdmin = data?.user?.role === 'SUPER_ADMIN';
  const sessions = data?.sessions || [];
  const credits = data?.credits || { userBalance: 0, agencyBalance: 0, totalAvailableForHost: 0 };
  const packages: TipsPackage[] = data?.packages || [];

  const originUrl = typeof window !== 'undefined' ? window.location.origin : 'https://aacomsoft.com';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Banner de confirmación */}
      {bannerMsg && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between text-emerald-900 shadow-sm">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-sm font-medium">{bannerMsg}</span>
          </div>
          <button
            onClick={() => setBannerMsg(null)}
            className="text-xs font-bold text-emerald-700 hover:underline"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Encabezado Principal */}
      <div className="bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              Add-on Interactivo en Vivo · Marca Blanca
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              TIPS: Taller Integral de Planeación y Seguridad
            </h1>
            <p className="text-indigo-200 text-sm sm:text-base leading-relaxed">
              Dirige talleres patrimoniales en vivo estilo Kahoot. Los asistentes escanean tu QR,
              avanzan paso a paso a tu ritmo y al cierre recibes los leads calientes directamente en
              tu cartera y agenda de citas.
            </p>
          </div>

          {/* Tarjeta de Bolsa de Créditos (Vigencia 90 días) */}
          <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-5 min-w-[290px] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-indigo-200 font-semibold flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-amber-300" />
                Créditos TIPS Disponibles
              </span>
              <span className="text-[11px] bg-amber-400/20 text-amber-200 px-2 py-0.5 rounded-full font-medium">
                Vigencia 90 días
              </span>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-black text-white">
                {credits.totalAvailableForHost}
              </span>
              <span className="text-xs text-indigo-200">
                prospectos disponibles
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/10 text-xs text-indigo-100">
              <div>
                <span className="text-indigo-300 block text-[11px]">Bolsa Personal:</span>
                <strong className="font-bold">{credits.userBalance} cr</strong>
              </div>
              <div>
                <span className="text-indigo-300 block text-[11px]">Bolsa Promotoría:</span>
                <strong className="font-bold">
                  {credits.agencySharesPool === false && !isManager
                    ? '0 cr (Pago propio)'
                    : `${credits.agencyBalance} cr`}
                </strong>
                {isManager ? (
                  <span className="text-[10px] text-amber-200 block mt-0.5">
                    {sharePool
                      ? `✓ Compartida (${allowedAgentIds.length} agentes)`
                      : '🔒 No compartida con agentes'}
                  </span>
                ) : credits.agencySharesPool === false ? (
                  <span className="text-[10px] text-amber-300 block mt-0.5">
                    🔒 Requiere tus propios créditos
                  </span>
                ) : (
                  <span className="text-[10px] text-emerald-300 block mt-0.5">
                    ✓ Autorizada por tu promotoría
                  </span>
                )}
              </div>
            </div>

            <div className="pt-2 flex flex-wrap gap-2">
              <button
                onClick={() => setShowBuyCreditsModal(true)}
                className="flex-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 shadow"
              >
                <Coins className="w-4 h-4" />
                Comprar Créditos
              </button>
              <button
                onClick={handleOpenCreateModal}
                className="flex-1 bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 shadow"
              >
                <Plus className="w-4 h-4" />
                Nueva Sesión
              </button>
            </div>

            {isManager && (
              <button
                type="button"
                onClick={() => setShowSettingsModal(true)}
                className="w-full py-1.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-[11px] font-bold text-indigo-100 flex items-center justify-center gap-1.5 transition"
              >
                <Settings className="w-3.5 h-3.5 text-amber-300" />
                Configurar quién puede usar créditos de Promotoría
              </button>
            )}

            {isSuperAdmin && (
              <div className="pt-1 flex items-center gap-2">
                <button
                  onClick={() => handleGrantSuperAdminBonus('user')}
                  className="text-[11px] text-indigo-200 hover:text-white underline"
                >
                  +30 cr Prueba (Agente)
                </button>
                <span className="text-indigo-400">·</span>
                <button
                  onClick={() => handleGrantSuperAdminBonus('agency')}
                  className="text-[11px] text-indigo-200 hover:text-white underline"
                >
                  +30 cr Prueba (Promotoría)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Barra de controles y filtros */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-slate-900">Sesiones de Taller TIPS</h2>
          {isManager && (
            <div className="inline-flex rounded-xl bg-slate-100 p-1 ml-2">
              <button
                onClick={() => setScope('mine')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  scope === 'mine'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Mis Talleres
              </button>
              <button
                onClick={() => setScope('agency')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  scope === 'agency'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Toda mi Promotoría
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/tips/sala/DEMO"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold"
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
            Modo Demo / Práctica (Gratis)
          </Link>
          <button
            onClick={fetchDashboard}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Actualizar
          </button>
          {isManager && (
            <button
              onClick={() => setShowSettingsModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-900 text-xs font-bold"
            >
              <Settings className="w-3.5 h-3.5 text-indigo-600" />
              Permisos de Créditos y Parámetros
            </button>
          )}
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Crear Sesión en Vivo
          </button>
        </div>
      </div>

      {/* Lista de Sesiones */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 text-sm">
          Cargando sesiones del módulo TIPS...
        </div>
      ) : sessions.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <QrCode className="w-7 h-7" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-lg font-bold text-slate-900">
              Aún no has creado ningún taller TIPS
            </h3>
            <p className="text-xs sm:text-sm text-slate-500">
              Crea tu primera sesión presencial para obtener tu código de 6 letras, tu código QR
              para los celulares de los asistentes y el enlace del tablero para el proyector.
            </p>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow"
          >
            <Plus className="w-4 h-4" />
            Crear mi Primera Sesión TIPS
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {sessions.map((sess: any) => {
            const participants = sess.participants || [];
            const identifiedCount = participants.filter((p: any) => p.privacyAccepted).length;
            const completedCount = participants.filter((p: any) => p.completedStep >= 8).length;
            const hotCount = participants.filter((p: any) => p.leadTier === 'HOT').length;
            const warmCount = participants.filter((p: any) => p.leadTier === 'WARM').length;
            const consumedCreditsCount = participants.filter((p: any) => p.creditConsumed).length;
            const canDeleteSession =
              isManager || (sess.hostId === data?.user?.id && consumedCreditsCount === 0);

            const statusColors: Record<string, string> = {
              LOBBY: 'bg-amber-100 text-amber-800 border-amber-200',
              ACTIVE: 'bg-emerald-100 text-emerald-800 border-emerald-200',
              PAUSED: 'bg-orange-100 text-orange-800 border-orange-200',
              CLOSED: 'bg-slate-100 text-slate-700 border-slate-200',
            };

            const statusLabels: Record<string, string> = {
              LOBBY: 'Sala de Espera (Lobby)',
              ACTIVE: `En Curso · Paso ${sess.unlockedStep}/8`,
              PAUSED: 'En Pausa',
              CLOSED: 'Finalizada',
            };

            return (
              <div
                key={sess.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition p-6 flex flex-col justify-between gap-5"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                            statusColors[sess.status] || statusColors.LOBBY
                          }`}
                        >
                          {statusLabels[sess.status] || sess.status}
                        </span>
                        <span className="text-xs font-mono font-bold bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-lg border border-indigo-200">
                          Código: {sess.code}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mt-2">{sess.title}</h3>
                      <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {sess.location || 'Presencial'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(sess.createdAt).toLocaleDateString('es-MX', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                        {sess.host?.name && (
                          <span className="text-slate-600 font-medium">
                            Host: {sess.host.name}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setQrModalSession(sess)}
                        className="p-2.5 rounded-xl bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 border border-slate-200 transition"
                        title="Ver QR y enlaces de acceso"
                      >
                        <QrCode className="w-5 h-5" />
                      </button>
                      {canDeleteSession && (
                        <button
                          onClick={() => setSessionToDelete(sess)}
                          className="p-2.5 rounded-xl bg-rose-50/70 hover:bg-rose-100 text-rose-600 hover:text-rose-700 border border-rose-200 transition"
                          title="Eliminar evento / sala TIPS"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Métricas del taller */}
                  <div className="grid grid-cols-4 gap-2 bg-slate-50 rounded-xl p-3 border border-slate-100 text-center">
                    <div>
                      <span className="text-[11px] text-slate-500 block">Conectados</span>
                      <strong className="text-base font-extrabold text-slate-900">
                        {participants.length}/{sess.expectedCapacity}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 block">Identificados</span>
                      <strong className="text-base font-extrabold text-indigo-600">
                        {identifiedCount}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 block">Terminaron 8/8</span>
                      <strong className="text-base font-extrabold text-emerald-600">
                        {completedCount}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 block">🔥 Calientes</span>
                      <strong className="text-base font-extrabold text-rose-600">
                        {hotCount}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Botones de Acción */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/tips/${sess.id}/host`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition"
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      {sess.status === 'CLOSED' ? 'Ver Consola / Detalle' : 'Dirigir Sesión (Host)'}
                    </Link>
                    <Link
                      href={`/tips/proyector/${sess.projectorToken}`}
                      target="_blank"
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition"
                    >
                      <Monitor className="w-3.5 h-3.5" />
                      Proyector
                      <ExternalLink className="w-3 h-3 opacity-70" />
                    </Link>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(
                        `✨ *Invitación al Taller Interactivo TIPS: ${sess.title}*\n📍 Sede: ${
                          sess.location || 'Presencial'
                        }\n🔑 Código de sala: *${
                          sess.code
                        }*\n\nConéctate desde tu celular sin instalar nada para descubrir tu Número Mágico y tu Diagnóstico Patrimonial en vivo:\n👉 ${originUrl}/tips/sala/${
                          sess.code
                        }`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition"
                      title="Enviar invitación ejecutiva por WhatsApp"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                      Invitar
                    </a>
                    <button
                      onClick={() => setSelectedReportSession(sess)}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold"
                    >
                      <BarChart3 className="w-3.5 h-3.5" />
                      Embudo ({hotCount}🔥 {warmCount}🟡)
                    </button>
                    <button
                      onClick={() => exportSessionCsv(sess)}
                      className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600"
                      title="Descargar CSV de asistentes"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: COMPRAR PAQUETES DE CRÉDITOS TIPS ($750/30, $1400/70, $2700/150) */}
      {showBuyCreditsModal && (
        <div
          onClick={() => setShowBuyCreditsModal(false)}
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                  Recarga Instantánea con Stripe
                </span>
                <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
                  Adquirir Paquetes de Créditos TIPS
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Cada asistente que escanea el QR, acepta el aviso de privacidad e inicia su
                  diagnóstico consume <strong>1 crédito</strong>. Si se desconecta y reconecta en el
                  mismo taller, no consume créditos adicionales. <strong>Vigencia: 90 días.</strong>
                </p>
              </div>
              <button
                onClick={() => setShowBuyCreditsModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {isManager && (
              <div className="bg-indigo-50/80 border border-indigo-200 rounded-2xl p-3.5 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-indigo-950 block">
                    ¿A qué bolsa deseas abonar los créditos?
                  </span>
                  <span className="text-[11px] text-indigo-700">
                    La bolsa de Promotoría puede ser utilizada por los agentes de tu organización.
                  </span>
                </div>
                <div className="inline-flex rounded-xl bg-white p-1 border border-indigo-200">
                  <button
                    type="button"
                    onClick={() => setBuyForAgency(false)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      !buyForAgency ? 'bg-indigo-600 text-white' : 'text-slate-600'
                    }`}
                  >
                    Mi Cuenta
                  </button>
                  <button
                    type="button"
                    onClick={() => setBuyForAgency(true)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      buyForAgency ? 'bg-indigo-600 text-white' : 'text-slate-600'
                    }`}
                  >
                    Bolsa Promotoría
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {packages.map((pkg) => {
                const isSelected = selectedPkgId === pkg.id;
                const costPerCredit = (pkg.priceMxn / pkg.credits).toFixed(2);
                return (
                  <div
                    key={pkg.id}
                    onClick={() => setSelectedPkgId(pkg.id)}
                    className={`cursor-pointer rounded-2xl border-2 p-4 transition flex flex-col justify-between relative ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/40 shadow-md'
                        : 'border-slate-200 hover:border-indigo-300 bg-white'
                    }`}
                  >
                    {pkg.badge && (
                      <span className="absolute -top-2.5 right-3 bg-amber-400 text-slate-950 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow-sm">
                        {pkg.badge}
                      </span>
                    )}
                    <div>
                      <div className="text-xs font-bold text-indigo-600 uppercase">
                        {pkg.credits} Créditos
                      </div>
                      <div className="text-2xl font-black text-slate-900 mt-1">
                        ${pkg.priceMxn.toLocaleString('es-MX')}{' '}
                        <span className="text-xs font-normal text-slate-500">MXN</span>
                      </div>
                      <div className="text-[11px] font-semibold text-emerald-700 mt-0.5">
                        ${costPerCredit} MXN por prospecto
                      </div>
                      <p className="text-xs text-slate-500 mt-3 leading-relaxed">
                        {pkg.description}
                      </p>
                    </div>
                    <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <span>Vigencia: 90 días</span>
                      <span
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300'
                        }`}
                      >
                        {isSelected && '✓'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="w-full sm:flex-1">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Código Promocional (Opcional)
                </label>
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  placeholder="Ej. PROMOTIPS"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm uppercase"
                />
              </div>
              <button
                onClick={handleBuyCredits}
                disabled={buying}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-sm shadow flex items-center justify-center gap-2"
              >
                <Coins className="w-4 h-4" />
                {buying ? 'Redirigiendo a Stripe...' : 'Proceder al Pago Seguro'}
              </button>
            </div>

            {buyError && (
              <div className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-3">
                {buyError}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: CREAR NUEVA SESIÓN EN VIVO */}
      {showCreateModal && (
        <div
          onClick={() => setShowCreateModal(false)}
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleCreateSession}
            className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-5"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-extrabold text-slate-900">
                Crear Sesión en Vivo TIPS
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Título del Taller *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ej. Taller Patrimonial Médicos Hospital Ángeles"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Sede / Ubicación
                  </label>
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="Salón Presencial"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Cupo Esperado (máx 100)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={100}
                    placeholder="50"
                    value={newCapacity}
                    onChange={(e) =>
                      setNewCapacity(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Alerta de Inactividad para Rezagados (minutos)
                </label>
                <input
                  type="number"
                  min={1}
                  max={15}
                  placeholder="3"
                  value={newInactiveMin}
                  onChange={(e) =>
                    setNewInactiveMin(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
                />
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 text-xs text-amber-950 space-y-1.5">
                <div className="font-bold flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-amber-600 shrink-0" />
                  Aviso sobre consumo de créditos en sesiones reales
                </div>
                <p className="text-[11px] text-amber-900 leading-relaxed">
                  Las sesiones en vivo descuentan <strong>1 crédito</strong> cuando un participante
                  firma el Paso 1. Si solo quieres{' '}
                  <strong>explorar, picarle o practicar cómo funciona la app</strong> sin gastar
                  créditos, utiliza el{' '}
                  <Link
                    href="/tips/sala/DEMO"
                    target="_blank"
                    className="font-extrabold text-indigo-700 underline"
                  >
                    Modo Demo / Práctica (100% Gratis)
                  </Link>
                  .
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={creating}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow"
              >
                {creating ? 'Generando QR y Sala...' : 'Crear y Abrir Consola Host'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 3: QR Y ENLACES DE LA SESIÓN */}
      {qrModalSession && (
        <div
          onClick={() => setQrModalSession(null)}
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl text-center space-y-5"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                Acceso Rápido QR (&lt;15s sin instalar nada)
              </span>
              <button
                onClick={() => setQrModalSession(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <h3 className="text-lg font-extrabold text-slate-900">{qrModalSession.title}</h3>

            <div className="bg-white p-5 rounded-2xl border-2 border-indigo-100 inline-block mx-auto shadow-inner">
              <QRCodeSVG
                value={`${originUrl}/tips/sala/${qrModalSession.code}`}
                size={210}
                level="H"
                includeMargin={true}
              />
            </div>

            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200">
              <span className="text-[11px] text-slate-500 block">Código de Sesión</span>
              <span className="text-2xl font-mono font-black tracking-widest text-indigo-700">
                {qrModalSession.code}
              </span>
            </div>

            <div className="space-y-2 text-left">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  `✨ *Invitación al Taller Interactivo TIPS: ${qrModalSession.title}*\n📍 Sede: ${
                    qrModalSession.location || 'Presencial'
                  }\n🔑 Código de sala: *${
                    qrModalSession.code
                  }*\n\nConéctate desde tu celular sin instalar nada para descubrir tu Número Mágico y tu Diagnóstico Patrimonial en vivo:\n👉 ${originUrl}/tips/sala/${
                    qrModalSession.code
                  }`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-xs font-extrabold text-emerald-900"
              >
                <span className="flex items-center gap-1.5">
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  Compartir invitación ejecutiva por WhatsApp
                </span>
                <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
              </a>
              <button
                onClick={() =>
                  handleCopy(`${originUrl}/tips/sala/${qrModalSession.code}`, 'link_movil')
                }
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700"
              >
                <span>📱 Copiar enlace móvil para asistentes</span>
                {copiedText === 'link_movil' ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4 text-slate-400" />
                )}
              </button>
              <button
                onClick={() =>
                  handleCopy(
                    `${originUrl}/tips/proyector/${qrModalSession.projectorToken}`,
                    'link_proyector'
                  )
                }
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700"
              >
                <span>🖥️ Copiar enlace público del Proyector</span>
                {copiedText === 'link_proyector' ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4 text-slate-400" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: REPORTE DE EMBUDO Y CONVERSIÓN POST-SESIÓN */}
      {selectedReportSession && (
        <div
          onClick={() => setSelectedReportSession(null)}
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase text-indigo-600">
                  Reporte de Retención y Scoring · Código {selectedReportSession.code}
                </span>
                <h3 className="text-2xl font-extrabold text-slate-900">
                  {selectedReportSession.title}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => exportSessionCsv(selectedReportSession)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                >
                  <Download className="w-3.5 h-3.5" />
                  Exportar CSV
                </button>
                <button
                  onClick={() => setSelectedReportSession(null)}
                  className="text-slate-400 hover:text-slate-600 font-bold px-2"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Embudo paso a paso (Dónde se cayó la gente) */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Embudo de Avance por Paso (1 al 8)
              </h4>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {[
                  { step: 1, label: '1. Datos' },
                  { step: 2, label: '2. Patrim.' },
                  { step: 3, label: '3. Sueldo' },
                  { step: 4, label: '4. Retiro' },
                  { step: 5, label: '5. Sueños' },
                  { step: 6, label: '6. Ahorro' },
                  { step: 7, label: '7. Seguros' },
                  { step: 8, label: '8. Cierre' },
                ].map((item) => {
                  const total = (selectedReportSession.participants || []).length || 1;
                  const reached = (selectedReportSession.participants || []).filter(
                    (p: any) => p.completedStep >= item.step
                  ).length;
                  const pct = Math.round((reached / total) * 100);
                  return (
                    <div
                      key={item.step}
                      className="bg-white rounded-xl p-2.5 border border-slate-200 text-center"
                    >
                      <span className="text-[10px] font-semibold text-slate-500 block">
                        {item.label}
                      </span>
                      <strong className="text-base font-black text-slate-900">{reached}</strong>
                      <span className="text-[10px] text-indigo-600 font-bold block">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tabla de participantes y leads */}
            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 border-b border-slate-200">
                    <th className="py-3 px-4 font-bold">Participante</th>
                    <th className="py-3 px-4 font-bold">Contacto</th>
                    <th className="py-3 px-4 font-bold">Avance</th>
                    <th className="py-3 px-4 font-bold">Score</th>
                    <th className="py-3 px-4 font-bold">Clasificación</th>
                    <th className="py-3 px-4 font-bold">Estado Cartera</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(selectedReportSession.participants || []).length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        Sin participantes registrados en esta sesión.
                      </td>
                    </tr>
                  ) : (
                    (selectedReportSession.participants || []).map((p: any) => (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">
                            {p.fullName || p.nickname || 'Participante'}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          <div>{p.phone || '—'}</div>
                          <div className="text-[11px] text-slate-400">{p.email || ''}</div>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-800">
                          {p.completedStep} / 8 pasos
                        </td>
                        <td className="py-3 px-4 font-black text-indigo-700">
                          {p.leadScore || 0} pts
                        </td>
                        <td className="py-3 px-4">
                          {p.leadTier === 'HOT' ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[11px]">
                              🔥 Caliente (Cita 48h)
                            </span>
                          ) : p.leadTier === 'WARM' ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[11px]">
                              🟡 Tibio
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold text-[11px]">
                              ❄️ Frío
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {p.linkedClientId ? (
                            <span className="text-emerald-700 font-bold">✓ En Cartera</span>
                          ) : (
                            <span className="text-slate-400">Pendiente cierre</span>
                          )}
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

      {/* MODAL 5: PARÁMETROS DE LA PROMOTORÍA, PERMISOS DE CRÉDITOS POR AGENTE Y AVISO LFPDPPP */}
      {showSettingsModal && (
        <div
          onClick={() => setShowSettingsModal(false)}
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSaveSettings}
            className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-600">
                  Control Financiero y de Créditos
                </span>
                <h3 className="text-xl font-extrabold text-slate-900">
                  Configuración TIPS de la Promotoría
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            {/* BLOQUE 1: SWITCH Y CHECKBOXES DE BOLSA DE CRÉDITOS POR AGENTE */}
            <div className="rounded-2xl border-2 border-indigo-100 bg-indigo-50/40 p-4 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <Coins className="w-4 h-4 text-indigo-600 shrink-0" />
                    ¿Compartir los créditos de la Promotoría con tus agentes?
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Decide si tus agentes pueden utilizar los créditos de la Bolsa de Promotoría o
                    si cada agente debe pagar sus propios créditos. Si activas compartir, puedes
                    elegir con un checkbox exactamente <strong>a qué agentes sí autorizas</strong>{' '}
                    para evitar consumos no autorizados o por error.
                  </p>
                </div>

                {/* Switch Toggle */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={sharePool}
                  onClick={() => setSharePool(!sharePool)}
                  className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    sharePool ? 'bg-indigo-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      sharePool ? 'translate-x-7' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Estado del Switch */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSharePool(false)}
                  className={`text-left p-3 rounded-xl border text-xs transition ${
                    !sharePool
                      ? 'bg-slate-900 text-white border-slate-900 font-bold shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="font-extrabold">🔒 No compartir créditos</div>
                  <div className={`text-[11px] mt-0.5 ${!sharePool ? 'text-slate-300' : 'text-slate-500'}`}>
                    Cada agente paga sus propios créditos. Solo el Promotor/Admin usa la bolsa de la promotoría.
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setSharePool(true)}
                  className={`text-left p-3 rounded-xl border text-xs transition ${
                    sharePool
                      ? 'bg-indigo-600 text-white border-indigo-600 font-bold shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="font-extrabold">✅ Compartir con agentes autorizados</div>
                  <div className={`text-[11px] mt-0.5 ${sharePool ? 'text-indigo-100' : 'text-slate-500'}`}>
                    Elige en la lista inferior qué agentes específicos tienen permiso de usar la bolsa.
                  </div>
                </button>
              </div>

              {/* Lista de Agentes con Checkboxes cuando sharePool === true */}
              {sharePool && (() => {
                const allAgencyUsers: any[] = data?.agencyAgents || [];
                const agentOnlyList = allAgencyUsers.filter(
                  (u) => u.role !== 'ADMIN' && u.role !== 'SUPER_ADMIN'
                );
                const filteredAgents = agentOnlyList.filter((u) => {
                  if (!agentSearch.trim()) return true;
                  const q = agentSearch.toLowerCase();
                  return (
                    String(u.name || '').toLowerCase().includes(q) ||
                    String(u.email || '').toLowerCase().includes(q)
                  );
                });

                return (
                  <div className="bg-white rounded-2xl border border-indigo-200 p-3.5 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="text-xs font-extrabold text-slate-900 block">
                          Selecciona los agentes autorizados ({allowedAgentIds.length} de{' '}
                          {agentOnlyList.length})
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Solo los agentes con palomita [✓] podrán consumir créditos de la promotoría.
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            setAllowedAgentIds(agentOnlyList.map((u) => String(u.id)))
                          }
                          className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] border border-indigo-200"
                        >
                          ✓ Marcar todos
                        </button>
                        <button
                          type="button"
                          onClick={() => setAllowedAgentIds([])}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] border border-slate-200"
                        >
                          ✕ Desmarcar todos
                        </button>
                      </div>
                    </div>

                    {agentOnlyList.length > 4 && (
                      <input
                        type="text"
                        value={agentSearch}
                        onChange={(e) => setAgentSearch(e.target.value)}
                        placeholder="Buscar agente por nombre o correo..."
                        className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs"
                      />
                    )}

                    {agentOnlyList.length === 0 ? (
                      <div className="text-xs text-slate-400 py-4 text-center">
                        No hay agentes registrados en esta promotoría.
                      </div>
                    ) : (
                      <div className="max-h-52 overflow-y-auto divide-y divide-slate-100 border border-slate-100 rounded-xl">
                        {filteredAgents.map((ag) => {
                          const isChecked = allowedAgentIds.includes(String(ag.id));
                          return (
                            <label
                              key={ag.id}
                              className={`flex items-center justify-between gap-3 px-3 py-2.5 cursor-pointer transition ${
                                isChecked ? 'bg-emerald-50/40 hover:bg-emerald-50/80' : 'hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    const idStr = String(ag.id);
                                    if (e.target.checked) {
                                      setAllowedAgentIds((prev) =>
                                        prev.includes(idStr) ? prev : [...prev, idStr]
                                      );
                                    } else {
                                      setAllowedAgentIds((prev) =>
                                        prev.filter((item) => item !== idStr)
                                      );
                                    }
                                  }}
                                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                                />
                                <div className="truncate">
                                  <div className="text-xs font-bold text-slate-900 truncate">
                                    {ag.name || 'Agente sin nombre'}
                                  </div>
                                  <div className="text-[11px] text-slate-500 truncate">
                                    {ag.email}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                  Propios: {ag.tipsCreditsBalance || 0} cr
                                </span>
                                <span
                                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                                    isChecked
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-slate-100 text-slate-500'
                                  }`}
                                >
                                  {isChecked ? '✓ Autorizado' : 'Pago propio'}
                                </span>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* BLOQUE 2: PARÁMETROS FINANCIEROS */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tasa Real Anual (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="4.0"
                  value={realRate}
                  onChange={(e) =>
                    setRealRate(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Inflación Estimada (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="4.5"
                  value={inflationRate}
                  onChange={(e) =>
                    setInflationRate(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Esperanza de Vida
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="82.3"
                  value={lifeExpectancy}
                  onChange={(e) =>
                    setLifeExpectancy(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Aviso de Privacidad y Consentimiento Expreso (LFPDPPP)
              </label>
              <textarea
                rows={4}
                value={privacyNotice}
                onChange={(e) => setPrivacyNotice(e.target.value)}
                placeholder="Deja en blanco para utilizar el aviso LFPDPPP oficial que informa sobre la proyección del nombre y avance en pantalla..."
                className="w-full rounded-xl border border-slate-300 p-3 text-xs leading-relaxed"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={savingSettings}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
              >
                {savingSettings ? 'Guardando...' : 'Guardar Permisos y Parámetros'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 6: BLOQUEO POR FALTA DE CRÉDITOS TIPS */}
      {showNoCreditsModal && (
        <div
          onClick={() => setShowNoCreditsModal(false)}
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-5 text-center"
          >
            <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
              <Coins className="w-7 h-7" />
            </div>
            <div className="space-y-2">
              <span className="inline-block text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700">
                Saldo Insuficiente (0 Créditos)
              </span>
              <h3 className="text-xl font-extrabold text-slate-900">
                No puedes crear una sala sin créditos TIPS
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {!isManager && credits.agencySharesPool === false
                  ? 'Tu promotoría tiene desactivado el uso compartido de su bolsa de créditos para tu cuenta y tu saldo personal actual es de 0 créditos.'
                  : 'Actualmente no cuentas con créditos TIPS disponibles en tu bolsa personal ni en la bolsa de tu promotoría.'}
              </p>
              <p className="text-xs text-slate-500 bg-slate-50 rounded-xl p-3 border border-slate-200">
                💡 Si solo deseas explorar o practicar cómo funciona el taller en el celular sin gastar créditos, utiliza el botón{' '}
                <strong className="text-emerald-700">Modo Demo / Práctica (Gratis)</strong>.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNoCreditsModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowNoCreditsModal(false);
                  setShowBuyCreditsModal(true);
                }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-extrabold flex items-center justify-center gap-1.5 shadow"
              >
                <Coins className="w-4 h-4" />
                Adquirir Créditos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 7: CONFIRMACIÓN Y ALERTA PARA ELIMINAR UN EVENTO TIPS */}
      {sessionToDelete && (
        <div
          onClick={() => !deletingSession && setSessionToDelete(null)}
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-5"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600">
                  Acción Irreversible
                </span>
                <h3 className="text-lg font-extrabold text-slate-900">
                  ¿Eliminar este evento TIPS?
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sala <strong className="text-slate-800">{sessionToDelete.title}</strong> · Código{' '}
                  <span className="font-mono font-bold text-indigo-700">{sessionToDelete.code}</span>
                </p>
              </div>
            </div>

            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 space-y-2 text-xs text-rose-900">
              <p className="font-bold flex items-center gap-1.5">
                ⚠️ Aviso importante antes de borrar:
              </p>
              <ul className="list-disc pl-4 space-y-1 text-rose-800">
                <li>
                  Se cerrará y eliminará de forma permanente el código QR y la sala{' '}
                  <strong>{sessionToDelete.code}</strong>.
                </li>
                <li>
                  Se borrarán los registros de los{' '}
                  <strong>{(sessionToDelete.participants || []).length} asistente(s)</strong>{' '}
                  conectados a esta sala (los prospectos que ya hayan sido exportados a Cartera se
                  conservan en Clientes).
                </li>
                {(sessionToDelete.participants || []).filter((p: any) => p.creditConsumed).length >
                  0 && (
                  <li className="font-semibold">
                    Esta sesión ya consumió{' '}
                    {(sessionToDelete.participants || []).filter((p: any) => p.creditConsumed).length}{' '}
                    crédito(s) TIPS. Los créditos ya utilizados no son reembolsables al borrar el
                    evento.
                  </li>
                )}
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={deletingSession}
                onClick={() => setSessionToDelete(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deletingSession}
                onClick={handleDeleteSession}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm"
              >
                <Trash2 className="w-4 h-4" />
                {deletingSession ? 'Eliminando...' : 'Sí, Eliminar Evento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
