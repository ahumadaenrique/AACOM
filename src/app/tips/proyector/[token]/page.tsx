'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  PauseCircle,
  Trophy,
  Sparkles,
  Maximize2,
  Minimize2,
  Presentation,
  Users,
} from 'lucide-react';

const STEP_SLIDES: Record<number, string> = {
  0: '/tips/slides/slide-0-lobby.webp',
  1: '/tips/slides/slide-1-datos.webp',
  2: '/tips/slides/slide-2-patrimonio.webp',
  3: '/tips/slides/slide-3-numero-magico.webp',
  4: '/tips/slides/slide-4-retiro.webp',
  5: '/tips/slides/slide-5-suenos.webp',
  6: '/tips/slides/slide-6-ahorro.webp',
  7: '/tips/slides/slide-7-seguros.webp',
  8: '/tips/slides/slide-8-diagnostico.webp',
};

const STEP_NAMES: Record<number, string> = {
  0: 'Sala de Espera — Escanea el QR para conectarte',
  1: 'Bloque 1: Datos Generales',
  2: 'Bloque 2: Tu Patrimonio por Categorías y Deudas',
  3: 'Bloque 3: Tu Sueldo y El Número Mágico',
  4: 'Bloque 4: La Cinta Métrica de tu Jubilación',
  5: 'Bloque 5: Tus Sueños y Prioridades',
  6: 'Bloque 6: Regla de Oro del Ahorro (16%)',
  7: 'Bloque 7: Protección de Capital Humano y Seguros',
  8: 'Bloque 8: Diagnóstico Patrimonial Preliminar',
};

const STEP_SPOTLIGHTS: Record<
  number,
  { badge: string; headline: string; formulaOrRule: string; prompt: string }
> = {
  1: {
    badge: 'PASO 1 EN VIVO · PUNTO DE PARTIDA',
    headline: 'Tu Horizonte de Vida y Dependientes Económicos',
    formulaOrRule: '🔒 Tus datos están cifrados en tu celular (Protección LFPDPPP)',
    prompt: 'Acepta el aviso de privacidad en tu teléfono y registra tu fecha de nacimiento.',
  },
  2: {
    badge: 'PASO 2 EN VIVO · ARQUITECTURA PATRIMONIAL',
    headline: 'Activos, Diversificación (HHI) y Deuda Buena vs. Deuda Mala',
    formulaOrRule: '📊 Tasa Real Integrada vs. Inflación · Índice Herfindahl-Hirschman',
    prompt: 'Captura tus inmuebles, inversiones y pasivos para descubrir si tu dinero vence a la inflación.',
  },
  3: {
    badge: 'PASO 3 EN VIVO · EL NÚMERO MÁGICO',
    headline: '“Lo que ya tendrías que tener construido a estas alturas de tu vida”',
    formulaOrRule: '✨ Fórmula: ((Edad² × 0.05) − (Edad × 1.1)) × Ingreso Mensual',
    prompt: 'Ingresa tu sueldo mensual promedio en tu celular y descubre cuánto patrimonio deberías llevar acumulado hoy.',
  },
  4: {
    badge: 'PASO 4 EN VIVO · LA CINTA MÉTRICA DE TU VIDA',
    headline: 'Años Vividos vs. Años Productivos Restantes',
    formulaOrRule: '⏳ Esperanza de Vida: 82.3 Años · ¿Cuántos veranos productivos te quedan?',
    prompt: 'Elige a qué edad deseas retirarte y con qué ingreso mensual quieres vivir.',
  },
  5: {
    badge: 'PASO 5 EN VIVO · MAPA DE SUEÑOS Y PRIORIDADES',
    headline: 'Un sueño sin fecha ni monto mensual es sólo una ilusión',
    formulaOrRule: '🎯 Cálculo Actuarial PMT (Ahorro Mensual Indexado a Rendimiento Real)',
    prompt: 'Selecciona o agrega tus metas (Universidad, Casa, Negocio, Legado) en tu celular.',
  },
  6: {
    badge: 'PASO 6 EN VIVO · REGLA DE ORO DEL AHORRO (16%)',
    headline: '1% Corto Plazo · 5% Mediano Plazo · 10% Largo Plazo (Retiro)',
    formulaOrRule: '💡 Ahorrar el 16% de tu ingreso financia tus sueños sin sacrificar tu estilo de vida',
    prompt: 'Mueve el deslizador en tu celular y comprueba qué metas se vuelven alcanzables hoy.',
  },
  7: {
    badge: 'PASO 7 EN VIVO · BLINDAJE DE CAPITAL HUMANO',
    headline: 'La máquina de hacer dinero más valiosa eres tú',
    formulaOrRule: '🛡️ Regla Internacional: Proteger de 7 a 10 años de ingreso ante Vida e Invalidez',
    prompt: 'Verifica en tu pantalla el valor total de tu Capital Humano y tus coberturas actuales.',
  },
  8: {
    badge: 'PASO 8 EN VIVO · DIAGNÓSTICO PERSONALIZADO LISTO',
    headline: 'Tu Semáforo Patrimonial ya está disponible en tu celular',
    formulaOrRule: '📅 Solicita tu sesión privada 1 a 1 (30 min) directamente desde tu pantalla',
    prompt: 'Elige tu horario preferido (Mañana, Tarde o Noche) y descarga tu reporte en PDF.',
  },
};

export default function TipsProjectorBoardPage() {
  const params = useParams();
  const token = String(params?.token || '');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [slideOnlyOverride, setSlideOnlyOverride] = useState<boolean | null>(null);

  const fetchBoard = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`/api/tips/proyector/${encodeURIComponent(token)}`, {
        cache: 'no-store',
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Error polling projector board:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchBoard();
    const interval = setInterval(fetchBoard, 2000);
    return () => clearInterval(interval);
  }, [fetchBoard]);

  const toggleFullscreen = () => {
    if (typeof document === 'undefined') return;
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-indigo-200 font-semibold">
            Conectando Tablero en Vivo TIPS...
          </p>
        </div>
      </div>
    );
  }

  if (!data?.session) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6 text-center">
        <p className="text-xl font-bold text-slate-400">Sesión TIPS no encontrada.</p>
      </div>
    );
  }

  const sess = data.session;
  const counters = data.counters || {
    connected: 0,
    expectedCapacity: 50,
    readyForUnlockedStep: 0,
    completedAll: 0,
    laggingCount: 0,
    stepCounts: {},
  };
  const laggingList: any[] = data.laggingList || [];
  const participants: any[] = data.participants || [];
  const originUrl = typeof window !== 'undefined' ? window.location.origin : 'https://aacomsoft.com';
  const joinUrl = `${originUrl}/tips/sala/${sess.code}`;
  const currentSlideUrl = STEP_SLIDES[sess.unlockedStep ?? 0] || STEP_SLIDES[0];
  const showFullSlideOnly =
    slideOnlyOverride !== null ? slideOnlyOverride : !sess.showBoardOnProjector;

  const gridColsClass =
    participants.length > 40
      ? 'grid-cols-3 sm:grid-cols-4 xl:grid-cols-5'
      : participants.length > 20
      ? 'grid-cols-2 sm:grid-cols-3 xl:grid-cols-4'
      : 'grid-cols-2 sm:grid-cols-3';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white p-4 sm:p-6 flex flex-col justify-between select-none overflow-hidden">
      {/* Encabezado Superior con QR, Título y Contador Gigante "X de 50 listos" */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-4 sm:p-5">
        <div className="flex items-center gap-4">
          <div className="bg-white p-2 rounded-2xl shadow-lg shrink-0">
            <QRCodeSVG value={joinUrl} size={80} level="M" includeMargin={false} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider bg-indigo-500/30 border border-indigo-400/40 text-indigo-200 px-2.5 py-0.5 rounded-full">
                {sess.brandName} · TIPS
              </span>
              <span className="text-xs font-mono font-black bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-md">
                CÓDIGO: {sess.code}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight mt-1">{sess.title}</h1>
            <p className="text-xs sm:text-sm text-indigo-200 font-semibold mt-0.5">
              {STEP_NAMES[sess.unlockedStep] || `Paso ${sess.unlockedStep} de 8`}
            </p>
          </div>
        </div>

        {/* Indicador Gigante: "X de 50 listos" + Botones de Vista y Pantalla Completa */}
        <div className="flex items-center gap-3 flex-wrap justify-end">
          <div className="bg-indigo-600/30 border-2 border-indigo-400/50 rounded-2xl px-5 py-2.5 text-center shadow-inner">
            <span className="text-[11px] uppercase tracking-widest text-indigo-200 font-bold block">
              Avance del Grupo en Paso {sess.unlockedStep}/8
            </span>
            <div className="text-2xl sm:text-3xl font-black text-amber-300">
              {counters.readyForUnlockedStep} de{' '}
              {counters.connected || counters.expectedCapacity}{' '}
              <span className="text-base font-extrabold text-white">listos</span>
            </div>
          </div>

          <div className="hidden xl:grid grid-cols-2 gap-2 text-center bg-white/5 border border-white/10 rounded-2xl p-2.5 text-xs">
            <div className="px-2">
              <span className="text-indigo-300 block text-[10px]">Conectados</span>
              <strong className="text-base font-black">{counters.connected}</strong>
            </div>
            <div className="px-2 border-l border-white/10">
              <span className="text-emerald-300 block text-[10px]">Terminaron 8/8</span>
              <strong className="text-base font-black text-emerald-400">
                {counters.completedAll}
              </strong>
            </div>
          </div>

          <button
            onClick={() => setSlideOnlyOverride(!showFullSlideOnly)}
            className="px-3.5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-extrabold text-amber-300 inline-flex items-center gap-1.5 transition"
            title="Alternar entre Lámina a Pantalla Completa o Vista Dividida (Lámina + Tablero)"
          >
            {showFullSlideOnly ? (
              <>
                <Users className="w-4 h-4" />
                Lámina + Tablero
              </>
            ) : (
              <>
                <Presentation className="w-4 h-4" />
                Lámina Completa
              </>
            )}
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-3 rounded-2xl bg-white/5 hover:bg-white/15 border border-white/10 text-indigo-200 transition"
            title="Pantalla Completa para Proyector"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Contenido Central */}
      {sess.status === 'PAUSED' ? (
        <div className="my-auto text-center space-y-4 py-16">
          <PauseCircle className="w-20 h-20 text-amber-400 mx-auto animate-pulse" />
          <h2 className="text-4xl font-black">Sesión en Pausa</h2>
          <p className="text-lg text-indigo-200 max-w-xl mx-auto">
            Presta atención a la explicación del expositor. En unos momentos se habilitará el
            siguiente bloque en tu celular.
          </p>
        </div>
      ) : showFullSlideOnly ? (
        /* MODO LÁMINA DE APOYO A PANTALLA COMPLETA */
        <div className="my-auto flex flex-col lg:flex-row items-center justify-center gap-6 py-3">
          <div className="w-full max-w-5xl rounded-3xl overflow-hidden border-2 border-indigo-400/40 shadow-2xl bg-slate-950">
            <img
              src={currentSlideUrl}
              alt={STEP_NAMES[sess.unlockedStep] || 'Slide TIPS'}
              className="w-full h-auto object-contain max-h-[72vh] mx-auto"
            />
          </div>
          {sess.unlockedStep === 0 && (
            <div className="bg-white/10 border border-white/20 rounded-3xl p-6 text-center space-y-3 shrink-0">
              <div className="bg-white p-4 rounded-2xl shadow-xl border-4 border-amber-400 inline-block">
                <QRCodeSVG value={joinUrl} size={190} level="H" includeMargin={false} />
              </div>
              <div className="text-sm font-bold text-indigo-200">
                Escanea con tu celular
                <span className="block text-2xl font-mono font-black text-amber-300 mt-0.5">
                  {sess.code}
                </span>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* MODO COMBINADO: LÁMINA DEL PASO ACTUAL + TABLERO EN VIVO */
        <div className="flex-1 flex flex-col justify-between gap-4 my-3">
          {/* SECCIÓN DE PRESIÓN DE GRUPO: "FALTAN:" */}
          {sess.unlockedStep > 0 && laggingList.length > 0 && (
            <div className="bg-amber-500/15 border-2 border-amber-400/60 rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center gap-3 shadow-lg">
              <div className="flex items-center gap-2 shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-400 animate-bounce" />
                <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-amber-300">
                  Faltan por completar el Paso {sess.unlockedStep} ({laggingList.length}):
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {laggingList.map((lag) => (
                  <span
                    key={lag.id}
                    className="px-2.5 py-0.5 rounded-xl bg-amber-400 text-slate-950 font-extrabold text-xs shadow"
                  >
                    ⏳ {lag.displayName}{' '}
                    <span className="text-[10px] font-bold opacity-80">
                      ({lag.completedStep}/8)
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center my-auto">
            {/* Columna Izquierda: Lámina Visual Oficial del Paso Actual */}
            <div className="lg:col-span-7 rounded-3xl overflow-hidden border-2 border-indigo-400/40 shadow-2xl bg-slate-950">
              <img
                src={currentSlideUrl}
                alt={STEP_NAMES[sess.unlockedStep] || 'Slide TIPS'}
                className="w-full h-auto object-contain max-h-[62vh] mx-auto"
              />
            </div>

            {/* Columna Derecha: QR de Sala (si no hay conectados en Lobby) o Tablero de Participantes en Vivo */}
            <div className="lg:col-span-5 flex flex-col justify-center">
              {sess.unlockedStep === 0 && participants.length === 0 ? (
                <div className="bg-white/5 border border-white/15 rounded-3xl p-6 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="bg-white p-4 rounded-3xl shadow-2xl border-4 border-amber-400">
                    <QRCodeSVG value={joinUrl} size={190} level="H" includeMargin={false} />
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-xl sm:text-2xl font-black text-white">
                      ¡Escanea el QR con tu celular!
                    </h2>
                    <p className="text-sm text-indigo-200">
                      Código de sala:{' '}
                      <strong className="text-amber-300 font-mono text-lg">{sess.code}</strong>
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-indigo-200 px-1">
                    <span>Tablero de Participantes ({participants.length})</span>
                    <span className="text-emerald-300">
                      ✓ {counters.readyForUnlockedStep} listos en este paso
                    </span>
                  </div>
                  <div className={`grid ${gridColsClass} gap-2.5 max-h-[56vh] overflow-y-auto pr-1`}>
                    {participants.map((p) => {
                      const isDoneAll = p.completedStep >= 8;
                      const isReadyCurrent = p.isReady;
                      const isLag = p.isLagging;

                      return (
                        <div
                          key={p.id}
                          className={`rounded-2xl p-2.5 sm:p-3 border transition-all flex flex-col justify-between ${
                            isDoneAll
                              ? 'bg-emerald-500/20 border-emerald-400/60 text-white'
                              : isLag
                              ? 'bg-amber-500/20 border-2 border-amber-400 text-amber-100 animate-pulse'
                              : isReadyCurrent
                              ? 'bg-indigo-500/20 border-indigo-400/40 text-white'
                              : 'bg-white/5 border-white/10 text-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-extrabold text-xs sm:text-sm truncate">
                              {p.displayName}
                            </span>
                            {isDoneAll ? (
                              <Trophy className="w-4 h-4 text-amber-300 shrink-0" />
                            ) : isReadyCurrent ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            ) : (
                              <Clock className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                            )}
                          </div>

                          <div className="mt-2 space-y-1">
                            <div className="flex items-center justify-between text-[10px] font-bold">
                              <span>
                                Paso {p.currentStep || p.completedStep}/8{' '}
                                {isReadyCurrent ? '✓' : '✍️'}
                              </span>
                              <span>{p.progressPct}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  isDoneAll
                                    ? 'bg-emerald-400'
                                    : isLag
                                    ? 'bg-amber-400'
                                    : 'bg-indigo-400'
                                }`}
                                style={{ width: `${Math.max(8, p.progressPct)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Barra Inferior: Contadores por Paso (1 al 8) y Aviso de Privacidad */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((stepNum) => {
            const isUnlocked = sess.unlockedStep >= stepNum;
            const isCurrent = sess.unlockedStep === stepNum;
            const countInStep = counters.stepCounts?.[stepNum] || 0;
            return (
              <div
                key={stepNum}
                className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 ${
                  isCurrent
                    ? 'bg-amber-400 text-slate-950'
                    : isUnlocked
                    ? 'bg-indigo-500/30 text-indigo-100'
                    : 'bg-white/5 text-slate-500'
                }`}
              >
                <span>Paso {stepNum}</span>
                <span className="px-1.5 py-0.2 rounded bg-black/20 text-[10px]">
                  {countInStep}
                </span>
              </div>
            );
          })}
        </div>
        <span className="text-[11px] text-indigo-300/80">
          🔒 Privacidad protegida (LFPDPPP): Esta pantalla jamás muestra montos ni resultados financieros.
        </span>
      </div>
    </div>
  );
}
