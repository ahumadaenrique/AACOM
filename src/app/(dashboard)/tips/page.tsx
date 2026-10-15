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
  const [showBuyCreditsModal, setShowBuyCreditsModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedReportSession, setSelectedReportSession] = useState<any>(null);
  const [qrModalSession, setQrModalSession] = useState<any>(null);

  // Form crear sesión
  const [newTitle, setNewTitle] = useState('');
  const [newLocation, setNewLocation] = useState('Salón Presencial');
  const [newCapacity, setNewCapacity] = useState(50);
  const [newAllowNicknames, setNewAllowNicknames] = useState(true);
  const [newInactiveMin, setNewInactiveMin] = useState(3);
  const [creating, setCreating] = useState(false);

  // Form comprar créditos
  const [selectedPkgId, setSelectedPkgId] = useState('tips_70');
  const [promoCode, setPromoCode] = useState('');
  const [buyForAgency, setBuyForAgency] = useState(false);
  const [buying, setBuying] = useState(false);
  const [buyError, setBuyError] = useState('');

  // Form ajustes promotoría
  const [realRate, setRealRate] = useState(4.0);
  const [inflationRate, setInflationRate] = useState(4.5);
  const [lifeExpectancy, setLifeExpectancy] = useState(82.3);
  const [sharePool, setSharePool] = useState(true);
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
          setSharePool(json.agencyConfig.tipsShareAgencyCredits !== false);
          setPrivacyNotice(json.agencyConfig.tipsPrivacyNotice || '');
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

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/tips/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          location: newLocation.trim() || 'Presencial',
          expectedCapacity: newCapacity,
          allowNicknames: newAllowNicknames,
          inactiveThresholdSec: newInactiveMin * 60,
        }),
      });
      const json = await res.json();
      if (res.ok && json.session) {
        setShowCreateModal(false);
        setNewTitle('');
        router.push(`/tips/${json.session.id}/host`);
      } else {
        alert(json.error || 'Error al crear la sesión');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
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
          tipsShareAgencyCredits: sharePool,
          tipsRealReturnRate: Number(realRate),
          tipsInflationRate: Number(inflationRate),
          tipsLifeExpectancy: Number(lifeExpectancy),
          tipsPrivacyNotice: privacyNotice,
        }),
      });
      if (res.ok) {
        setShowSettingsModal(false);
        setBannerMsg('Parámetros de la promotoría actualizados correctamente.');
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
      'Apodo',
      'Celular',
      'Correo',
      'Consentimiento LFPDPPP',
      'Paso Alcanzado (de 8)',
      'Score Lead (0-100)',
      'Clasificacion',
      'Cliente Vinculado en Cartera',
    ];
    const rows = (sess.participants || []).map((p: any) => [
      `"${(p.fullName || '').replace(/"/g, '""')}"`,
      `"${(p.nickname || '').replace(/"/g, '""')}"`,
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
                <strong className="font-bold">{credits.agencyBalance} cr</strong>
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
                onClick={() => setShowCreateModal(true)}
                className="flex-1 bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 shadow"
              >
                <Plus className="w-4 h-4" />
                Nueva Sesión
              </button>
            </div>

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

        <div className="flex items-center gap-2">
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
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold"
            >
              <Settings className="w-3.5 h-3.5" />
              Parámetros y Aviso LFPDPPP
            </button>
          )}
          <button
            onClick={() => setShowCreateModal(true)}
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
            onClick={() => setShowCreateModal(true)}
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

                    <button
                      onClick={() => setQrModalSession(sess)}
                      className="p-2.5 rounded-xl bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 border border-slate-200 transition"
                      title="Ver QR y enlaces de acceso"
                    >
                      <QrCode className="w-5 h-5" />
                    </button>
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

      {/* MODAL 1: COMPRAR PAQUETES DE CRÉDITOS TIPS ($750/30, $1400/70, $3500/150) */}
      {showBuyCreditsModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
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
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
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
                    value={newCapacity}
                    onChange={(e) => setNewCapacity(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Alerta de Inactividad (min)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={15}
                    value={newInactiveMin}
                    onChange={(e) => setNewInactiveMin(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
                  />
                </div>
                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer p-2.5 rounded-xl border border-slate-200 bg-slate-50">
                    <input
                      type="checkbox"
                      checked={newAllowNicknames}
                      onChange={(e) => setNewAllowNicknames(e.target.checked)}
                      className="rounded text-indigo-600"
                    />
                    Permitir Apodo en Proyector
                  </label>
                </div>
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
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl text-center space-y-5">
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
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
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
                            {p.fullName || p.nickname || 'Anónimo'}
                          </div>
                          {p.nickname && p.fullName && (
                            <div className="text-[11px] text-slate-400">Apodo: {p.nickname}</div>
                          )}
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

      {/* MODAL 5: PARÁMETROS DE LA PROMOTORÍA Y AVISO DE PRIVACIDAD LFPDPPP */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveSettings}
            className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-extrabold text-slate-900">
                Configuración TIPS de la Promotoría
              </h3>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tasa Real Anual (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={realRate}
                  onChange={(e) => setRealRate(Number(e.target.value))}
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
                  value={inflationRate}
                  onChange={(e) => setInflationRate(Number(e.target.value))}
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
                  value={lifeExpectancy}
                  onChange={(e) => setLifeExpectancy(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={sharePool}
                onChange={(e) => setSharePool(e.target.checked)}
                className="rounded text-indigo-600"
              />
              Permitir que los agentes de mi promotoría utilicen la Bolsa Compartida de Créditos TIPS cuando no tengan saldo individual
            </label>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Aviso de Privacidad y Consentimiento Expreso (LFPDPPP)
              </label>
              <textarea
                rows={5}
                value={privacyNotice}
                onChange={(e) => setPrivacyNotice(e.target.value)}
                placeholder="Deja en blanco para utilizar el aviso LFPDPPP oficial que informa sobre la proyección del nombre/apodo y avance en pantalla..."
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
                {savingSettings ? 'Guardando...' : 'Guardar Parámetros'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
