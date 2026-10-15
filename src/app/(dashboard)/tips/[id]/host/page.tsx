'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import {
  Play,
  Pause,
  Unlock,
  Lock,
  Monitor,
  Eye,
  EyeOff,
  UserX,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  QrCode,
  Coins,
  LockKeyhole,
  ExternalLink,
  Copy,
  Check,
  Smartphone,
  Clock,
  MessageCircle,
  BookOpen,
  CalendarCheck,
  RotateCcw,
} from 'lucide-react';

const STEP_DEFINITIONS = [
  {
    step: 1,
    title: '1. Datos Generales',
    desc: 'Nombre, fecha de nacimiento, estado civil y dependientes',
    speakerScript:
      '💬 Guion: "Es momento de usar tu programa. Acepten el aviso de privacidad para proteger sus datos y capturen su fecha de nacimiento y dependientes económicos."',
  },
  {
    step: 2,
    title: '2. Patrimonio y Deudas',
    desc: 'Activos por categoría, tasa integrada y diversificación',
    speakerScript:
      '💬 Guion: "Registren sus inmuebles, inversiones, negocios y vehículos. Recuerden separar las deudas buenas (como hipoteca) de las deudas malas (tarjetas de crédito con CAT del 40-70%)."',
  },
  {
    step: 3,
    title: '3. Sueldo y Número Mágico',
    desc: 'Cálculo del Número Mágico frente al patrimonio actual',
    speakerScript:
      '💬 Guion: "Capturen su ingreso mensual promedio. El programa aplicará la fórmula (Edad² × 0.05 − Edad × 1.1) × Ingreso para revelar su Número Mágico y compararlo con su patrimonio."',
  },
  {
    step: 4,
    title: '4. Jubilación (Cinta Métrica)',
    desc: 'Años vividos, productivos y brecha de retiro',
    speakerScript:
      '💬 Guion: "Vean en pantalla la cinta métrica de su vida: cuántos años han vivido, cuántos les quedan para acumular y cuántos vivirán en el retiro (esperanza de vida 82.3 años)."',
  },
  {
    step: 5,
    title: '5. Sueños y Prioridades',
    desc: 'Sueños propios, dependientes y trascendencia con PMT',
    speakerScript:
      '💬 Guion: "Elijan o capturen sus sueños: universidad de los hijos, casa, negocio o herencia. La app calculará cuánto ahorro mensual requiere cada meta."',
  },
  {
    step: 6,
    title: '6. Regla de Ahorro (16%)',
    desc: 'Personalización de ahorro mensual y sueños alcanzables',
    speakerScript:
      '💬 Guion: "La regla de oro es ahorrar al menos el 16% de nuestros ingresos. Muevan el deslizador en su celular y descubran cuáles de sus sueños son alcanzables hoy."',
  },
  {
    step: 7,
    title: '7. Riesgos y Seguros',
    desc: 'Capital humano y detección de huecos de protección',
    speakerScript:
      '💬 Guion: "Observen su Capital Humano: todo el dinero que producirán de aquí a su retiro. Una suma asegurada sana en Vida e Invalidez debe cubrir de 7 a 10 años de su ingreso."',
  },
  {
    step: 8,
    title: '8. Diagnóstico Preliminar',
    desc: 'Semáforo patrimonial, PDF descargable y agendar cita',
    speakerScript:
      '💬 Guion: "¡Felicidades por llegar al paso 8! Descarguen su diagnóstico preliminar en PDF y presionen el botón amarillo para agendar nuestra cita individual de 30 minutos esta semana."',
  },
];

export default function TipsHostConsolePage() {
  const params = useParams();
  const sessionId = String(params?.id || '');

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionBusy, setActionBusy] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<any>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [closeSummary, setCloseSummary] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [filterMode, setFilterMode] = useState<
    'all' | 'appointments' | 'hot' | 'gaps' | 'lagging'
  >('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchHostState = useCallback(async () => {
    if (!sessionId) return;
    try {
      const res = await fetch(`/api/tips/sessions/${sessionId}/host`, { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Error polling host state:', err);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchHostState();
    const interval = setInterval(fetchHostState, 2000);
    return () => clearInterval(interval);
  }, [fetchHostState]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedParticipant(null);
        setShowQrModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const sendCommand = async (payload: Record<string, any>) => {
    setActionBusy(true);
    try {
      const res = await fetch(`/api/tips/sessions/${sessionId}/host`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (res.ok) {
        if (payload.action === 'CLOSE_SESSION' && json.funnelSummary) {
          setCloseSummary(json.funnelSummary);
        }
        await fetchHostState();
      } else {
        alert(json.error || 'Error al ejecutar comando');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionBusy(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="max-w-7xl mx-auto p-8 text-center text-slate-500">
        Cargando Consola en Vivo del Host...
      </div>
    );
  }

  if (!data?.session) {
    return (
      <div className="max-w-3xl mx-auto p-8 text-center space-y-4">
        <p className="text-slate-700 font-bold">No se encontró la sesión o no tienes acceso.</p>
        <Link href="/tips" className="text-indigo-600 font-semibold underline text-sm">
          Volver al panel TIPS
        </Link>
      </div>
    );
  }

  const sess = data.session;
  const stats = data.stats || {
    totalConnected: 0,
    readyForUnlockedStep: 0,
    laggingCount: 0,
    completedAllCount: 0,
  };
  const credits = data.credits || { totalAvailableForHost: 0 };
  const participants: any[] = sess.participants || [];
  const laggingParticipants = participants.filter((p) => p.isLagging);
  const originUrl = typeof window !== 'undefined' ? window.location.origin : 'https://aacomsoft.com';
  const joinUrl = `${originUrl}/tips/sala/${sess.code}`;
  const projectorUrl = `${originUrl}/tips/proyector/${sess.projectorToken}`;

  const currentStepDef = STEP_DEFINITIONS.find((d) => d.step === sess.unlockedStep);

  const alreadyBilledCount = participants.filter((p) => p.creditConsumed).length;
  const remainingExpectedSeats = Math.max(0, (sess.expectedCapacity || 30) - alreadyBilledCount);
  const hasCreditShortfall =
    sess.status !== 'CLOSED' && (credits.totalAvailableForHost || 0) < remainingExpectedSeats;

  const appointmentCount = participants.filter(
    (p) => p.calculatedResults?.appointmentRequested
  ).length;
  const hotLeadsCount = participants.filter((p) => p.leadTier === 'HOT').length;
  const withGapsCount = participants.filter(
    (p) => (p.calculatedResults?.detectedGaps || []).length > 0
  ).length;

  const filteredParticipants = participants.filter((p) => {
    if (filterMode === 'appointments' && !p.calculatedResults?.appointmentRequested) return false;
    if (filterMode === 'hot' && p.leadTier !== 'HOT') return false;
    if (filterMode === 'gaps' && (p.calculatedResults?.detectedGaps || []).length === 0)
      return false;
    if (filterMode === 'lagging' && !p.isLagging) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const nameMatch = (p.fullName || '').toLowerCase().includes(q);
      const nickMatch = (p.nickname || '').toLowerCase().includes(q);
      const phoneMatch = (p.phone || '').toLowerCase().includes(q);
      if (!nameMatch && !nickMatch && !phoneMatch) return false;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Barra Superior de Navegación y Estado en Vivo */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <Link
              href="/tips"
              className="inline-flex items-center gap-1 text-xs text-slate-300 hover:text-white bg-white/10 px-2.5 py-1 rounded-lg"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Panel TIPS
            </Link>
            <span className="text-xs font-mono font-extrabold bg-indigo-500 text-white px-3 py-1 rounded-lg">
              CÓDIGO QR: {sess.code}
            </span>
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full ${
                sess.status === 'ACTIVE'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                  : sess.status === 'PAUSED'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                  : sess.status === 'CLOSED'
                  ? 'bg-slate-700 text-slate-300'
                  : 'bg-indigo-500/20 text-indigo-200 border border-indigo-400/30'
              }`}
            >
              {sess.status === 'LOBBY'
                ? '🟢 Sala de Espera Abierta'
                : sess.status === 'ACTIVE'
                ? `🔥 En Curso · Paso ${sess.unlockedStep} de 8`
                : sess.status === 'PAUSED'
                ? '⏸️ Sesión en Pausa'
                : '🔒 Sesión Cerrada'}
            </span>
            <span className="text-xs bg-amber-400/15 text-amber-300 border border-amber-400/30 px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1">
              <Coins className="w-3.5 h-3.5" />
              Créditos disponibles: {credits.totalAvailableForHost}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold pt-1">{sess.title}</h1>
        </div>

        {/* Botonera Maestra del Host */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowQrModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition"
          >
            <QrCode className="w-4 h-4" />
            Mostrar QR
          </button>

          <Link
            href={joinUrl}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-indigo-200 text-xs font-bold transition"
            title="Probar la vista móvil como si fueras un asistente"
          >
            <Smartphone className="w-4 h-4" />
            Simular Celular
            <ExternalLink className="w-3 h-3 opacity-70" />
          </Link>

          <Link
            href={projectorUrl}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow"
          >
            <Monitor className="w-4 h-4" />
            Abrir Proyector
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <button
            onClick={() => sendCommand({ action: 'TOGGLE_PROJECTOR_BOARD' })}
            disabled={actionBusy}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition"
            title="Mostrar u ocultar el tablero en el proyector"
          >
            {sess.showBoardOnProjector ? (
              <>
                <Eye className="w-4 h-4 text-emerald-400" />
                Proyector Visible
              </>
            ) : (
              <>
                <EyeOff className="w-4 h-4 text-amber-400" />
                Proyector Oculto
              </>
            )}
          </button>

          {sess.status !== 'CLOSED' ? (
            <>
              <button
                onClick={() => sendCommand({ action: 'EXTEND_TIME', extraSeconds: 120 })}
                disabled={actionBusy}
                className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-amber-200 text-xs font-semibold transition"
                title="Dar 2 minutos adicionales a los rezagados antes de marcarlos inactivos"
              >
                <Clock className="w-4 h-4" />
                +2 min Paso
              </button>

              <button
                onClick={() => sendCommand({ action: 'TOGGLE_PAUSE' })}
                disabled={actionBusy}
                className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
                  sess.status === 'PAUSED'
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                    : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                }`}
              >
                {sess.status === 'PAUSED' ? (
                  <>
                    <Play className="w-4 h-4" />
                    Reanudar Captura
                  </>
                ) : (
                  <>
                    <Pause className="w-4 h-4" />
                    Pausar Celulares
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  if (
                    confirm(
                      '¿Cerrar la sesión TIPS? Todos los prospectos identificados se enviarán a tu Cartera y se agendarán tareas a 48h para los leads calientes.'
                    )
                  ) {
                    sendCommand({ action: 'CLOSE_SESSION' });
                  }
                }}
                disabled={actionBusy}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition"
              >
                <Lock className="w-4 h-4" />
                Cerrar Taller y Enviar al Embudo
              </button>
            </>
          ) : (
            <button
              onClick={() => sendCommand({ action: 'REOPEN_SESSION' })}
              disabled={actionBusy}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition"
            >
              <RotateCcw className="w-4 h-4" />
              Reabrir Sesión
            </button>
          )}
        </div>
      </div>

      {/* Alerta Preventiva de Créditos vs. Aforo Esperado */}
      {hasCreditShortfall && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-amber-900 block">
                Aviso Preventivo de Capacidad de Créditos
              </span>
              <p className="text-xs text-amber-800 mt-0.5">
                Tu sesión tiene un cupo esperado de <strong>{sess.expectedCapacity} asistentes</strong>{' '}
                (faltan por ingresar hasta {remainingExpectedSeats}), pero actualmente cuentas con{' '}
                <strong>{credits.totalAvailableForHost} créditos disponibles</strong> (Personales +
                Bolsa de Promotoría). Si ingresan más asistentes que tu saldo, verán un aviso de cupo
                agotado al aceptar el aviso de privacidad.
              </p>
            </div>
          </div>
          <Link
            href="/tips"
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shrink-0 inline-flex items-center gap-1.5"
          >
            <Coins className="w-3.5 h-3.5" />
            Recargar Créditos →
          </Link>
        </div>
      )}

      {/* Teleprompter / Guion del Expositor en Vivo */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-indigo-600 text-white shrink-0 mt-0.5">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-700 block">
              Guía del Expositor ·{' '}
              {sess.unlockedStep === 0
                ? 'Bienvenida y Escaneo QR'
                : currentStepDef?.title || `Paso ${sess.unlockedStep}`}
            </span>
            <p className="text-xs sm:text-sm font-medium text-indigo-950 mt-0.5">
              {sess.unlockedStep === 0
                ? '💬 Guion: "Bienvenidos al Taller Integral de Planeación y Seguridad (TIPS). Apunten la cámara de su celular al código QR en pantalla y escriban su nombre o apodo para aparecer en el tablero."'
                : currentStepDef?.speakerScript}
            </p>
          </div>
        </div>
      </div>

      {/* Notificación de Cierre e Inyección al Embudo */}
      {closeSummary && (
        <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-base font-extrabold text-emerald-950 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              ¡Sesión cerrada y prospectos inyectados en tu embudo!
            </h3>
            <p className="text-xs text-emerald-800">
              Nuevos clientes en Cartera: <strong>{closeSummary.clientsCreated}</strong> · Clientes
              existentes vinculados: <strong>{closeSummary.clientsLinked}</strong> · Tareas de cita
              individual (48h) creadas para Leads Calientes:{' '}
              <strong>{closeSummary.tasksCreated}</strong>.
            </p>
          </div>
          <Link
            href="/cartera/clientes"
            className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shrink-0"
          >
            Ir a mi Cartera →
          </Link>
        </div>
      )}

      {/* Indicador Gigante: "X de 50 listos" + Control Paso a Paso (Gating del Host) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between space-y-5">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              Pulso en Tiempo Real (≤ 2s)
            </span>
            <div className="mt-3 bg-indigo-950 text-white rounded-2xl p-5 text-center space-y-1">
              <div className="text-xs text-indigo-300 font-semibold uppercase">
                Listos en el Paso Actual ({sess.unlockedStep}/8)
              </div>
              <div className="text-4xl sm:text-5xl font-black tracking-tight text-amber-300">
                {stats.readyForUnlockedStep} de {stats.totalConnected || sess.expectedCapacity}{' '}
                <span className="text-xl font-bold text-white">listos</span>
              </div>
              <div className="text-[11px] text-indigo-200 pt-1">
                Conectados: {stats.totalConnected} (Cupo meta: {sess.expectedCapacity}) · Terminaron
                8/8: {stats.completedAllCount}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Rezagados en este bloque ({laggingParticipants.length})
              </span>
              <span className="text-[11px] text-slate-400">
                Tú decides si esperarlos o liberar
              </span>
            </div>

            {laggingParticipants.length === 0 ? (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-3 text-xs font-medium text-center">
                ¡Todos los asistentes conectados están al corriente!
              </div>
            ) : (
              <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
                {laggingParticipants.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs"
                  >
                    <div>
                      <span className="font-bold text-amber-950">
                        {p.fullName || p.nickname || 'Asistente'}
                      </span>
                      <span className="text-[11px] text-amber-700 ml-2">
                        (Va en paso {p.completedStep}/8)
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-amber-700">
                      {Math.floor((p.inactiveSeconds || 0) / 60)}m inactivo
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {sess.status !== 'CLOSED' && (
            <div className="space-y-2">
              <button
                onClick={() =>
                  sendCommand({
                    action: 'UNLOCK_STEP',
                    step: Math.min(8, (sess.unlockedStep || 0) + 1),
                  })
                }
                disabled={actionBusy || sess.unlockedStep >= 8}
                className="w-full py-3.5 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-extrabold text-sm shadow-lg transition flex items-center justify-center gap-2"
              >
                <Unlock className="w-4 h-4" />
                {sess.unlockedStep === 0
                  ? 'Iniciar Taller: Liberar Paso 1 (Datos Generales)'
                  : sess.unlockedStep < 8
                  ? `Liberar Paso ${sess.unlockedStep + 1} a todos los celulares`
                  : 'Los 8 Pasos ya están liberados'}
              </button>
              {sess.unlockedStep > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const prev = Math.max(0, (sess.unlockedStep || 1) - 1);
                    if (
                      confirm(
                        prev === 0
                          ? '¿Volver a bloquear el Paso 1 y regresar los celulares a la Sala de Espera?'
                          : `¿Volver a bloquear el Paso ${sess.unlockedStep} y regresar los celulares al Paso ${prev}?`
                      )
                    ) {
                      sendCommand({ action: 'UNLOCK_STEP', step: prev });
                    }
                  }}
                  disabled={actionBusy}
                  className="w-full py-2 px-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold text-xs transition flex items-center justify-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  {sess.unlockedStep === 1
                    ? 'Volver a bloquear Paso 1 (Regresar a Lobby)'
                    : `Volver a bloquear Paso ${sess.unlockedStep} (Regresar a Paso ${sess.unlockedStep - 1})`}
                </button>
              )}
            </div>
          )}
        </div>

        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                Control de Bloques ("Es momento de usar tu programa")
              </h2>
              <p className="text-xs text-slate-500">
                Ningún asistente puede adelantarse a un paso bloqueado. Cuando liberas un bloque,
                los celulares de quienes ya terminaron avanzan solos.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {STEP_DEFINITIONS.map((item) => {
              const isUnlocked = sess.unlockedStep >= item.step;
              const isCurrent = sess.unlockedStep === item.step;
              const completedThisStepCount = participants.filter(
                (p) => p.completedStep >= item.step
              ).length;

              return (
                <div
                  key={item.step}
                  className={`rounded-2xl border p-4 transition flex flex-col justify-between gap-3 ${
                    isCurrent
                      ? 'border-2 border-indigo-600 bg-indigo-50/40 shadow-sm'
                      : isUnlocked
                      ? 'border-emerald-200 bg-emerald-50/20'
                      : 'border-slate-200 bg-slate-50/60 opacity-80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-slate-900">{item.title}</span>
                        {isCurrent && (
                          <span className="text-[10px] font-bold bg-indigo-600 text-white px-2 py-0.5 rounded-full">
                            ACTUAL
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{item.desc}</p>
                    </div>
                    <span className="text-xs font-extrabold text-indigo-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shrink-0">
                      {completedThisStepCount}/{participants.length} listos
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 gap-2">
                    <span className="text-[11px] font-semibold text-slate-500">
                      {isUnlocked ? '🔓 Abierto en celulares' : '🔒 Bloqueado'}
                    </span>
                    {sess.status !== 'CLOSED' && (
                      <div className="flex items-center gap-1.5">
                        {isUnlocked && (
                          <button
                            type="button"
                            onClick={() => {
                              const prevStep = item.step - 1;
                              if (
                                confirm(
                                  prevStep === 0
                                    ? '¿Bloquear nuevamente el Paso 1 y regresar a la Sala de Espera?'
                                    : `¿Volver a bloquear desde el Paso ${item.step} y dejar la sesión en el Paso ${prevStep}?`
                                )
                              ) {
                                sendCommand({ action: 'UNLOCK_STEP', step: prevStep });
                              }
                            }}
                            disabled={actionBusy}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-100 hover:bg-amber-200 text-amber-900 transition"
                            title={`Volver a bloquear el Paso ${item.step}`}
                          >
                            🔒 Bloquear
                          </button>
                        )}
                        {!isCurrent && (
                          <button
                            type="button"
                            onClick={() => sendCommand({ action: 'UNLOCK_STEP', step: item.step })}
                            disabled={actionBusy}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                              isUnlocked
                                ? 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                            }`}
                          >
                            {isUnlocked ? 'Fijar aquí' : `Liberar Paso ${item.step}`}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tabla Privada de Asistentes */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-xs font-bold uppercase text-indigo-600 flex items-center gap-1">
              <LockKeyhole className="w-3.5 h-3.5" />
              Vista Privada Exclusiva del Host (Cifrada LFPDPPP)
            </span>
            <h2 className="text-lg font-extrabold text-slate-900">
              Participantes Conectados y Diagnóstico en Tiempo Real ({participants.length})
            </h2>
          </div>
          <span className="text-xs text-slate-500">
            Haz clic en <strong>"Ver Diagnóstico Privado"</strong> para inspeccionar montos,
            patrimonio, número mágico y huecos de seguro.
          </span>
        </div>

        {/* Barra de Filtros Rápidos 1-Click y Buscador en Vivo */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: `Todos (${participants.length})` },
              {
                id: 'appointments',
                label: `📅 Pidieron Cita (${appointmentCount})`,
              },
              { id: 'hot', label: `🔥 Calientes 70+ (${hotLeadsCount})` },
              { id: 'gaps', label: `⚠️ Con Brecha de Seguro (${withGapsCount})` },
              {
                id: 'lagging',
                label: `⏳ Rezagados (${laggingParticipants.length})`,
              },
            ].map((pill) => (
              <button
                key={pill.id}
                type="button"
                onClick={() => setFilterMode(pill.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  filterMode === pill.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre, apodo o WhatsApp..."
            className="w-full md:w-64 rounded-xl border border-slate-200 px-3.5 py-1.5 text-xs focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-2xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-600 border-b border-slate-200">
                <th className="py-3 px-4 font-bold">Asistente (Real / Apodo)</th>
                <th className="py-3 px-4 font-bold">Contacto</th>
                <th className="py-3 px-4 font-bold">Paso Actual</th>
                <th className="py-3 px-4 font-bold">Patrimonio vs Número Mágico</th>
                <th className="py-3 px-4 font-bold">Huecos Detectados</th>
                <th className="py-3 px-4 font-bold">Score Lead</th>
                <th className="py-3 px-4 font-bold text-right">Acciones Host</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredParticipants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    {participants.length === 0
                      ? `Esperando a que los asistentes escaneen el código QR (${sess.code})...`
                      : 'Ningún participante coincide con el filtro seleccionado.'}
                  </td>
                </tr>
              ) : (
                filteredParticipants.map((p) => {
                  const calc = p.calculatedResults || {};
                  const gaps = Array.isArray(calc.detectedGaps) ? calc.detectedGaps : [];
                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-slate-50 ${p.isLagging ? 'bg-amber-50/40' : ''}`}
                    >
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
                          {p.fullName || p.nickname || 'Conectando...'}
                          {p.isLagging && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                              Rezagado
                            </span>
                          )}
                          {calc.appointmentRequested && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold flex items-center gap-1">
                              <CalendarCheck className="w-3 h-3" /> Pidió Cita
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Apodo proyector: {p.nickname || '—'} ·{' '}
                          {p.privacyAccepted ? '✓ LFPDPPP Aceptado' : 'En Lobby'}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <div className="font-semibold flex items-center gap-1.5">
                          {p.phone || '—'}
                          {p.phone && (
                            <a
                              href={`https://wa.me/${p.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                                `Hola ${p.fullName || p.nickname}, gracias por participar hoy en el taller TIPS "${sess.title}". ¿Cuándo te queda bien que revisemos tu diagnóstico patrimonial?`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-600 hover:text-emerald-700"
                              title="Enviar WhatsApp directo al prospecto"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400">{p.email || ''}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-extrabold text-indigo-700">
                          Paso {p.completedStep} / 8
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {p.completedStep >= 3 ? (
                          <div>
                            <div className="font-bold text-slate-800">
                              Patrimonio: ${(calc.netWorth || 0).toLocaleString('es-MX')}
                            </div>
                            <div className="text-[11px] text-indigo-600 font-semibold">
                              Núm. Mágico: ${(calc.magicNumber || 0).toLocaleString('es-MX')}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400">Pendiente paso 3</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {gaps.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {gaps.map((g: any) => (
                              <span
                                key={g.code}
                                className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 font-bold text-[10px]"
                              >
                                {g.code}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-black text-slate-900">{p.leadScore || 0} pts</div>
                        <div className="text-[10px] font-bold">
                          {p.leadTier === 'HOT'
                            ? '🔥 Caliente'
                            : p.leadTier === 'WARM'
                            ? '🟡 Tibio'
                            : '❄️ Frío'}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => setSelectedParticipant(p)}
                          className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs"
                        >
                          Ver Diagnóstico Privado
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('¿Expulsar a este asistente de la sesión?')) {
                              sendCommand({ action: 'KICK_PARTICIPANT', participantId: p.id });
                            }
                          }}
                          className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50"
                          title="Expulsar asistente"
                        >
                          <UserX className="w-4 h-4 inline" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DETALLE PRIVADO DEL ASISTENTE */}
      {selectedParticipant && (
        <div
          onClick={() => setSelectedParticipant(null)}
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold uppercase text-indigo-600">
                  Expediente Confidencial del Prospecto · Paso {selectedParticipant.completedStep}/8
                </span>
                <h3 className="text-2xl font-extrabold text-slate-900">
                  {selectedParticipant.fullName || selectedParticipant.nickname}
                </h3>
                <p className="text-xs text-slate-500">
                  Tel: {selectedParticipant.phone || 'S/N'} · Email:{' '}
                  {selectedParticipant.email || 'S/N'} · Edad:{' '}
                  {selectedParticipant.calculatedResults?.age || '—'} años
                </p>
              </div>
              <button
                onClick={() => setSelectedParticipant(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            {selectedParticipant.calculatedResults ? (
              <div className="space-y-4">
                {selectedParticipant.calculatedResults.appointmentRequested && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 text-xs text-emerald-900 font-bold">
                    📅 Este prospecto ya solicitó cita individual desde su celular. Horario
                    preferido: {selectedParticipant.calculatedResults.preferredSlot || '48h'}.
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200">
                    <span className="text-[11px] text-slate-500 block">Ingreso Mensual</span>
                    <strong className="text-base font-black text-slate-900">
                      $
                      {(
                        selectedParticipant.calculatedResults.monthlyIncome || 0
                      ).toLocaleString('es-MX')}
                    </strong>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200">
                    <span className="text-[11px] text-slate-500 block">Patrimonio Neto</span>
                    <strong className="text-base font-black text-emerald-700">
                      $
                      {(selectedParticipant.calculatedResults.netWorth || 0).toLocaleString(
                        'es-MX'
                      )}
                    </strong>
                  </div>
                  <div className="bg-indigo-50 rounded-2xl p-3.5 border border-indigo-200">
                    <span className="text-[11px] text-indigo-700 block">Número Mágico</span>
                    <strong className="text-base font-black text-indigo-950">
                      $
                      {(selectedParticipant.calculatedResults.magicNumber || 0).toLocaleString(
                        'es-MX'
                      )}
                    </strong>
                  </div>
                  <div className="bg-rose-50 rounded-2xl p-3.5 border border-rose-200">
                    <span className="text-[11px] text-rose-700 block">Capital Humano</span>
                    <strong className="text-base font-black text-rose-950">
                      $
                      {(
                        selectedParticipant.calculatedResults.humanCapitalValue || 0
                      ).toLocaleString('es-MX')}
                    </strong>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                    <span className="text-slate-500 block">Tasa Integrada / Diversificación</span>
                    <strong className="text-slate-900">
                      {selectedParticipant.calculatedResults.integratedReturnRatePct}% anual ·
                      Score Div: {selectedParticipant.calculatedResults.diversificationScore}/100
                    </strong>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                    <span className="text-slate-500 block">Brecha de Jubilación</span>
                    <strong className="text-slate-900">
                      $
                      {(selectedParticipant.calculatedResults.retirementGap || 0).toLocaleString(
                        'es-MX'
                      )}
                    </strong>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                    <span className="text-slate-500 block">Ahorro Mensual Elegido</span>
                    <strong className="text-slate-900">
                      {selectedParticipant.calculatedResults.selectedSavingsPct}% ($
                      {(
                        selectedParticipant.calculatedResults.selectedMonthlySavings || 0
                      ).toLocaleString('es-MX')}
                      /mes)
                    </strong>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase text-slate-700">
                    Oportunidades de Venta / Huecos de Protección Detectados
                  </h4>
                  {(selectedParticipant.calculatedResults.detectedGaps || []).length === 0 ? (
                    <p className="text-xs text-slate-500">
                      Aún no se detectan huecos o el participante no ha llegado al paso de seguros.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {selectedParticipant.calculatedResults.detectedGaps.map((gap: any) => (
                        <div
                          key={gap.code}
                          className="bg-rose-50/70 border border-rose-200 rounded-xl p-3 text-xs flex items-start justify-between gap-3"
                        >
                          <div>
                            <span className="font-extrabold text-rose-950">{gap.title}</span>
                            <p className="text-rose-800 mt-0.5">{gap.reason}</p>
                          </div>
                          <span className="px-2.5 py-1 rounded-lg bg-white border border-rose-200 font-bold text-rose-700 shrink-0">
                            Brecha: ${(gap.gapAmount || 0).toLocaleString('es-MX')}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {selectedParticipant.linkedClient?.policies?.length > 0 && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-2">
                    <h4 className="text-xs font-bold text-emerald-950">
                      ✓ Pólizas Vigentes Cruzadas en Cartera aacomsoft
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedParticipant.linkedClient.policies.map((pol: any) => (
                        <span
                          key={pol.id}
                          className="px-2.5 py-1 rounded-lg bg-white border border-emerald-300 text-xs font-semibold text-emerald-900"
                        >
                          {pol.ramo}: {pol.policyNumber} ({pol.insuranceCompany || 'Aseguradora'})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                Este asistente aún se encuentra en la sala de espera.
              </p>
            )}
          </div>
        </div>
      )}

      {/* MODAL QR PARA PROYECTAR DESDE EL HOST */}
      {showQrModal && (
        <div
          onClick={() => setShowQrModal(false)}
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 text-center space-y-5 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-indigo-600">
                Escanea con tu celular para unirte
              </span>
              <button
                onClick={() => setShowQrModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>
            <div className="bg-white p-4 rounded-2xl border-2 border-indigo-100 inline-block mx-auto">
              <QRCodeSVG value={joinUrl} size={230} level="H" includeMargin={true} />
            </div>
            <div className="text-3xl font-mono font-black tracking-widest text-indigo-700">
              {sess.code}
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(joinUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-2"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              {copied ? '¡Enlace copiado!' : joinUrl}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
