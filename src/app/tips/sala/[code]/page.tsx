'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import {
  evaluateTipsDiagnostic,
  ASSET_REFERENCE_RATES,
  TipsAssetCategory,
  TipsAssetItem,
  TipsDebtItem,
  TipsDreamItem,
  TipsInsuranceItem,
} from '@/lib/tips-calculator';
import {
  ShieldCheck,
  Lock,
  PauseCircle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  Sparkles,
  TrendingUp,
  HeartHandshake,
  Download,
  MessageCircle,
  AlertCircle,
  WifiOff,
  Clock,
} from 'lucide-react';

export default function TipsParticipantMobilePage() {
  const params = useParams();
  const code = String(params?.code || '').toUpperCase();

  const [deviceToken, setDeviceToken] = useState<string>('');
  const [session, setSession] = useState<any>(null);
  const [participant, setParticipant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [offlinePending, setOfflinePending] = useState(false);

  // Paso activo en la vista móvil (0 = Lobby / Consentimiento, 1..8 = Pasos)
  const [viewStep, setViewStep] = useState<number>(0);

  // Lobby & Paso 1: Datos Generales + Consentimiento LFPDPPP
  const [nickname, setNickname] = useState('');
  const [inLobbyJoined, setInLobbyJoined] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [birthDate, setBirthDate] = useState('1984-05-15');
  const [maritalStatus, setMaritalStatus] = useState<
    'SOLTERO' | 'CASADO' | 'UNION_LIBRE' | 'DIVORCIADO' | 'VIUDO'
  >('CASADO');
  const [dependentsCount, setDependentsCount] = useState(2);

  // Paso 2: Patrimonio y Deudas
  const [assets, setAssets] = useState<TipsAssetItem[]>([
    {
      id: 'ast_1',
      category: 'INMUEBLE',
      description: 'Casa / Departamento',
      value: 0,
      annualRatePct: 6.0,
      liquidity: 'BAJA',
    },
    {
      id: 'ast_2',
      category: 'FONDO_EMERGENCIA',
      description: 'Ahorro en Banco / CETES',
      value: 0,
      annualRatePct: 8.0,
      liquidity: 'ALTA',
    },
  ]);
  const [debts, setDebts] = useState<TipsDebtItem[]>([]);

  // Paso 3: Sueldo Mensual
  const [monthlyIncome, setMonthlyIncome] = useState<number>(45000);

  // Paso 4: Jubilación (Cinta Métrica)
  const [desiredRetirementAge, setDesiredRetirementAge] = useState<number>(65);
  const [desiredPensionPct, setDesiredPensionPct] = useState<number>(80);
  const [imssRegime, setImssRegime] = useState<'LEY_73' | 'LEY_97' | 'NINGUNO' | 'NO_SE'>('LEY_97');
  const [aforeBalance, setAforeBalance] = useState<number>(150000);
  const [hasPpr, setHasPpr] = useState<boolean>(false);
  const [pprBalance, setPprBalance] = useState<number>(0);
  const [pprMonthlyContribution, setPprMonthlyContribution] = useState<number>(0);

  // Paso 5: Sueños y Prioridades
  const [dreams, setDreams] = useState<TipsDreamItem[]>([
    {
      id: 'drm_1',
      name: 'Universidad de los hijos / Posgrado',
      category: 'DEPENDIENTES',
      targetAmount: 800000,
      yearsToGoal: 10,
      priority: 1,
    },
    {
      id: 'drm_2',
      name: 'Propiedad / Inversión Patrimonial',
      category: 'PROPIO',
      targetAmount: 1500000,
      yearsToGoal: 8,
      priority: 2,
    },
  ]);

  // Paso 6: Ahorro Mensual (Regla del 16%)
  const [savingsPct, setSavingsPct] = useState<number>(16);

  // Paso 7: Seguros y Riesgos
  const [hasLifeInsurance, setHasLifeInsurance] = useState<boolean>(false);
  const [lifeInsuredSum, setLifeInsuredSum] = useState<number>(0);
  const [lifePerception, setLifePerception] = useState<number>(3);
  const [hasDisabilityInsurance, setHasDisabilityInsurance] = useState<boolean>(false);
  const [hasGmm, setHasGmm] = useState<boolean>(false);
  const [hasAutoInsurance, setHasAutoInsurance] = useState<boolean>(false);
  const [hasHomeInsurance, setHasHomeInsurance] = useState<boolean>(false);

  // Inicializar o recuperar Device Token en localStorage
  useEffect(() => {
    if (typeof window === 'undefined' || !code) return;
    const storageKey = `tips_device_token_${code}`;
    let token = localStorage.getItem(storageKey);
    if (!token) {
      token = `dev_${code}_${Math.random().toString(36).substring(2, 10)}_${Date.now().toString(36)}`;
      localStorage.setItem(storageKey, token);
    }
    setDeviceToken(token);
  }, [code]);

  // Cargar sesión y restaurar datos del participante si se reconecta
  const fetchInitialState = useCallback(async () => {
    if (!code || !deviceToken) return;
    try {
      setLoading(true);
      const res = await fetch(
        `/api/tips/public/${encodeURIComponent(code)}?deviceToken=${encodeURIComponent(deviceToken)}`,
        { cache: 'no-store' }
      );
      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json.error || 'No se pudo cargar la sesión.');
        return;
      }

      setSession(json.session);
      if (json.participant) {
        const p = json.participant;
        setParticipant(p);
        setInLobbyJoined(true);
        if (p.nickname) setNickname(p.nickname);
        if (p.fullName) setFullName(p.fullName);
        if (p.phone) setPhone(p.phone);
        if (p.email) setEmail(p.email);
        setPrivacyAccepted(Boolean(p.privacyAccepted));

        if (p.step1General) {
          if (p.step1General.birthDate) setBirthDate(p.step1General.birthDate);
          if (p.step1General.maritalStatus) setMaritalStatus(p.step1General.maritalStatus);
          if (typeof p.step1General.dependentsCount === 'number')
            setDependentsCount(p.step1General.dependentsCount);
        }
        if (p.step2Patrimony) {
          if (Array.isArray(p.step2Patrimony.assets)) setAssets(p.step2Patrimony.assets);
          if (Array.isArray(p.step2Patrimony.debts)) setDebts(p.step2Patrimony.debts);
        }
        if (p.step3Income?.monthlyIncome) {
          setMonthlyIncome(Number(p.step3Income.monthlyIncome));
        }
        if (p.step4Retirement) {
          if (p.step4Retirement.desiredRetirementAge)
            setDesiredRetirementAge(Number(p.step4Retirement.desiredRetirementAge));
          if (p.step4Retirement.desiredPensionPct)
            setDesiredPensionPct(Number(p.step4Retirement.desiredPensionPct));
          if (p.step4Retirement.imssRegime) setImssRegime(p.step4Retirement.imssRegime);
          if (typeof p.step4Retirement.aforeBalance === 'number')
            setAforeBalance(p.step4Retirement.aforeBalance);
          if (typeof p.step4Retirement.hasPpr === 'boolean') setHasPpr(p.step4Retirement.hasPpr);
          if (typeof p.step4Retirement.pprBalance === 'number')
            setPprBalance(p.step4Retirement.pprBalance);
          if (typeof p.step4Retirement.pprMonthlyContribution === 'number')
            setPprMonthlyContribution(p.step4Retirement.pprMonthlyContribution);
        }
        if (p.step5Dreams?.dreams && Array.isArray(p.step5Dreams.dreams)) {
          setDreams(p.step5Dreams.dreams);
        }
        if (p.step6Savings?.savingsPct !== undefined) {
          setSavingsPct(Number(p.step6Savings.savingsPct));
        }
        if (p.step7Insurance) {
          setHasLifeInsurance(Boolean(p.step7Insurance.hasLifeInsurance));
          setHasDisabilityInsurance(Boolean(p.step7Insurance.hasDisabilityInsurance));
          setHasGmm(Boolean(p.step7Insurance.hasGmm));
          setHasAutoInsurance(Boolean(p.step7Insurance.hasAutoInsurance));
          setHasHomeInsurance(Boolean(p.step7Insurance.hasHomeInsurance));
          const lifePol = (p.step7Insurance.policies || []).find((x: any) => x.type === 'VIDA');
          if (lifePol) {
            setLifeInsuredSum(Number(lifePol.insuredSum || 0));
            setLifePerception(Number(lifePol.perceptionScore || 3));
          }
        }

        // Posicionar en el paso donde iba (sin rebasar el paso liberado por el host)
        const unlocked = json.session?.unlockedStep || 0;
        if (!p.privacyAccepted) {
          setViewStep(unlocked >= 1 ? 1 : 0);
        } else {
          const nextStep = Math.min(unlocked, Math.max(1, (p.completedStep || 1) + 1));
          setViewStep(nextStep);
        }
      }
    } catch (err) {
      console.error('Error loading participant state:', err);
    } finally {
      setLoading(false);
    }
  }, [code, deviceToken]);

  useEffect(() => {
    if (deviceToken) {
      fetchInitialState();
    }
  }, [deviceToken, fetchInitialState]);

  // Heartbeat en tiempo real cada 2 segundos + Reintento de cola offline
  useEffect(() => {
    if (!code || !deviceToken || !inLobbyJoined) return;

    const interval = setInterval(async () => {
      try {
        // Si había un envío pendiente por red débil en el salón, reintentarlo primero
        const queuedRaw = localStorage.getItem(`tips_queue_${code}`);
        if (queuedRaw) {
          const queuedPayload = JSON.parse(queuedRaw);
          const retryRes = await fetch(`/api/tips/public/${encodeURIComponent(code)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(queuedPayload),
          });
          if (retryRes.ok) {
            localStorage.removeItem(`tips_queue_${code}`);
            setOfflinePending(false);
          }
        }

        const res = await fetch(`/api/tips/public/${encodeURIComponent(code)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'HEARTBEAT',
            deviceToken,
            currentStep: viewStep,
          }),
        });
        if (res.ok) {
          const json = await res.json();
          if (json.session) {
            setSession((prev: any) => {
              const prevUnlocked = prev?.unlockedStep || 0;
              const newUnlocked = json.session.unlockedStep || 0;
              // Si el host acaba de abrir el paso 1 y estábamos en el lobby, avanzar automáticamente al paso 1
              if (prevUnlocked === 0 && newUnlocked >= 1 && viewStep === 0) {
                setViewStep(1);
              }
              return { ...prev, ...json.session };
            });
          }
        }
      } catch (_) {
        // Red débil en el salón: ignorar silenciosamente y reintentar en 2s
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [code, deviceToken, inLobbyJoined, viewStep]);

  // Cálculo reactivo local en vivo para gráficas instantáneas
  const liveCalc = useMemo(() => {
    const policies: TipsInsuranceItem[] = [];
    if (hasLifeInsurance && lifeInsuredSum > 0) {
      policies.push({
        id: 'pol_vida',
        type: 'VIDA',
        company: 'Actual',
        insuredSum: lifeInsuredSum,
        perceptionScore: lifePerception,
      });
    }
    return evaluateTipsDiagnostic({
      completedStep: participant?.completedStep || viewStep,
      step1: { fullName, birthDate, maritalStatus, dependentsCount },
      step2: { assets, debts },
      step3: { monthlyIncome },
      step4: {
        desiredRetirementAge,
        desiredPensionPct,
        imssRegime,
        aforeBalance,
        hasPpr,
        pprBalance,
        pprMonthlyContribution,
      },
      step5: { dreams },
      step6: { savingsPct },
      step7: {
        policies,
        hasLifeInsurance,
        hasDisabilityInsurance,
        hasGmm,
        hasAutoInsurance,
        hasHomeInsurance,
      },
      customParams: session?.customParams || null,
    });
  }, [
    participant?.completedStep,
    viewStep,
    fullName,
    birthDate,
    maritalStatus,
    dependentsCount,
    assets,
    debts,
    monthlyIncome,
    desiredRetirementAge,
    desiredPensionPct,
    imssRegime,
    aforeBalance,
    hasPpr,
    pprBalance,
    pprMonthlyContribution,
    dreams,
    savingsPct,
    hasLifeInsurance,
    lifeInsuredSum,
    lifePerception,
    hasDisabilityInsurance,
    hasGmm,
    hasAutoInsurance,
    hasHomeInsurance,
    session?.customParams,
  ]);

  // Unirse a la sala de espera (Lobby)
  const handleJoinLobby = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) return;
    setSaving(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/tips/public/${encodeURIComponent(code)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'JOIN_LOBBY',
          deviceToken,
          nickname: nickname.trim(),
        }),
      });
      const json = await res.json();
      if (res.ok) {
        setParticipant(json.participant);
        setInLobbyJoined(true);
        if ((json.session?.unlockedStep || session?.unlockedStep || 0) >= 1) {
          setViewStep(1);
        }
      } else {
        setErrorMsg(json.error || 'No se pudo conectar a la sala.');
      }
    } catch (err) {
      setErrorMsg('Verifica tu conexión a internet e intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  // Guardar Paso 1 + Consentimiento LFPDPPP (Consume 1 crédito de forma idempotente)
  const handleSaveStep1AndConsent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!privacyAccepted) {
      setErrorMsg('Debes aceptar el Aviso de Privacidad LFPDPPP para continuar.');
      return;
    }
    setSaving(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/tips/public/${encodeURIComponent(code)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ACCEPT_PRIVACY_AND_STEP1',
          deviceToken,
          nickname: nickname.trim() || fullName.split(' ')[0],
          fullName: fullName.trim(),
          phone: phone.trim(),
          email: email.trim(),
          privacyAccepted: true,
          step1Data: {
            fullName: fullName.trim(),
            birthDate,
            maritalStatus,
            dependentsCount,
          },
        }),
      });
      const json = await res.json();
      if (res.ok) {
        setParticipant(json.participant);
        const unlocked = json.session?.unlockedStep || session?.unlockedStep || 1;
        if (unlocked >= 2) {
          setViewStep(2);
        }
      } else {
        setErrorMsg(json.error || 'Error al registrar el Paso 1.');
      }
    } catch (err) {
      setErrorMsg('Señal débil detectada. Intenta presionar Guardar nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  // Guardar Pasos 2 al 8 (Con cola offline si falla el Wi-Fi del salón)
  const handleSaveStep = async (stepNumber: number, stepData: any) => {
    setSaving(true);
    setErrorMsg(null);
    const payload = {
      action: 'SAVE_STEP',
      deviceToken,
      stepNumber,
      stepData,
    };

    try {
      const res = await fetch(`/api/tips/public/${encodeURIComponent(code)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (res.ok) {
        setParticipant(json.participant);
        const unlocked = json.session?.unlockedStep ?? session?.unlockedStep ?? stepNumber;
        if (stepNumber < unlocked) {
          setViewStep(stepNumber + 1);
        }
      } else {
        setErrorMsg(json.error || 'No se pudo guardar el avance.');
      }
    } catch (err) {
      // Guardar en cola offline para sincronización automática
      localStorage.setItem(`tips_queue_${code}`, JSON.stringify(payload));
      setOfflinePending(true);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-indigo-200">
            Conectando con tu Taller TIPS ({code})...
          </p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6 text-center">
        <div className="max-w-sm space-y-3">
          <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
          <h1 className="text-xl font-extrabold">Código TIPS no encontrado</h1>
          <p className="text-xs text-slate-400">
            Verifica con el expositor el código de 6 caracteres proyectado en la pantalla.
          </p>
        </div>
      </div>
    );
  }

  // Si el Host pausó la sesión: mostrar "Pausa" en <= 2s
  if (session.status === 'PAUSED') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-950 to-slate-950 text-white flex items-center justify-center p-6 text-center">
        <div className="max-w-sm space-y-4">
          <PauseCircle className="w-16 h-16 text-amber-400 mx-auto animate-pulse" />
          <span className="text-xs uppercase font-bold tracking-widest text-amber-300 bg-amber-400/10 px-3 py-1 rounded-full">
            Pausa Activa
          </span>
          <h1 className="text-2xl font-black">Momento de escuchar al expositor</h1>
          <p className="text-sm text-indigo-200 leading-relaxed">
            Tus datos están guardados de forma segura. En cuanto el expositor indique{' '}
            <strong>"Es momento de usar tu programa"</strong>, tu pantalla se desbloqueará
            automáticamente.
          </p>
        </div>
      </div>
    );
  }

  const unlockedStep = session.unlockedStep || 0;
  const completedStep = participant?.completedStep || 0;
  const isWaitingForNextUnlock =
    inLobbyJoined &&
    ((unlockedStep === 0 && viewStep === 0) ||
      (completedStep >= unlockedStep && viewStep === unlockedStep && unlockedStep < 8));

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* Encabezado Móvil con Progreso */}
      <header className="bg-indigo-950 text-white px-4 py-3.5 sticky top-0 z-30 shadow-md">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-200">
                {session.brandName} · TIPS
              </span>
            </div>
            <h1 className="text-sm font-bold truncate max-w-[220px]">{session.title}</h1>
          </div>

          <div className="text-right">
            <span className="text-[11px] font-mono bg-white/10 px-2 py-0.5 rounded text-amber-300 font-bold">
              Paso {Math.min(8, Math.max(1, viewStep))}/8
            </span>
            {offlinePending && (
              <div className="text-[10px] text-amber-300 flex items-center gap-1 mt-0.5">
                <WifiOff className="w-3 h-3" /> Guardado en cola
              </div>
            )}
          </div>
        </div>

        {/* Barra de progreso de los 8 pasos */}
        <div className="max-w-lg mx-auto mt-2.5 grid grid-cols-8 gap-1">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => {
            const done = completedStep >= s;
            const active = viewStep === s;
            const unlocked = unlockedStep >= s;
            return (
              <button
                key={s}
                type="button"
                disabled={!unlocked || !participant?.privacyAccepted}
                onClick={() => unlocked && participant?.privacyAccepted && setViewStep(s)}
                className={`h-1.5 rounded-full transition-all ${
                  active
                    ? 'bg-amber-400'
                    : done
                    ? 'bg-emerald-400'
                    : unlocked
                    ? 'bg-indigo-400/50'
                    : 'bg-white/15'
                }`}
              />
            );
          })}
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-5 space-y-5">
        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-3.5 text-xs font-semibold flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* VISTA 0: ENTRADA AL LOBBY (Escaneo de QR < 15s) */}
        {!inLobbyJoined ? (
          <form
            onSubmit={handleJoinLobby}
            className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5"
          >
            <div className="space-y-1 text-center">
              <span className="inline-block text-xs font-extrabold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                Bienvenido al Taller en Vivo
              </span>
              <h2 className="text-xl font-black text-slate-900 pt-1">{session.title}</h2>
              <p className="text-xs text-slate-500">
                Anfitrión: <strong>{session.hostName}</strong>
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {session.allowNicknames
                  ? '¿Con qué nombre o apodo quieres aparecer en la pantalla del salón?'
                  : 'Escribe tu nombre para aparecer en el tablero del taller:'}
              </label>
              <input
                type="text"
                required
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder={session.allowNicknames ? 'Ej. Dr. Roberto / Rober84' : 'Tu Nombre'}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base font-bold text-slate-900 focus:border-indigo-600 focus:outline-none"
              />
              {session.allowNicknames && (
                <p className="text-[11px] text-slate-400 mt-1">
                  Puedes usar un apodo para proteger tu identidad en el proyector público.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm shadow-lg transition"
            >
              {saving ? 'Conectando...' : 'Entrar al Taller →'}
            </button>
          </form>
        ) : unlockedStep === 0 ? (
          /* SALA DE ESPERA: Esperando a que el Host abra el Paso 1 */
          <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-4 shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-slate-900">
              ¡Ya estás en el tablero, {nickname}!
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Mira la pantalla proyectada en el salón. En cuanto el expositor libere el{' '}
              <strong>Paso 1</strong>, tu teléfono avanzará automáticamente.
            </p>
          </div>
        ) : viewStep === 1 || !participant?.privacyAccepted ? (
          /* PASO 1: CONSENTIMIENTO LFPDPPP + DATOS GENERALES */
          <form
            onSubmit={handleSaveStep1AndConsent}
            className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-5"
          >
            <div>
              <span className="text-xs font-extrabold uppercase text-indigo-600">
                Paso 1 de 8 · Es momento de usar tu programa
              </span>
              <h2 className="text-xl font-black text-slate-900 mt-0.5">
                Datos Generales y Privacidad
              </h2>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre Completo (Privado para tu diagnóstico) *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nombre y Apellidos"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Celular / WhatsApp (10 dígitos) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="55 1234 5678"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Correo Electrónico *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tucorreo@ejemplo.com"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Fecha de Nacimiento *
                  </label>
                  <input
                    type="date"
                    required
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Edad Calculada
                  </label>
                  <div className="w-full rounded-xl bg-indigo-50 border border-indigo-200 px-3.5 py-2.5 text-sm font-black text-indigo-900">
                    {liveCalc.age} años
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Estado Civil
                  </label>
                  <select
                    value={maritalStatus}
                    onChange={(e) => setMaritalStatus(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm bg-white"
                  >
                    <option value="CASADO">Casado(a)</option>
                    <option value="SOLTERO">Soltero(a)</option>
                    <option value="UNION_LIBRE">Unión Libre</option>
                    <option value="DIVORCIADO">Divorciado(a)</option>
                    <option value="VIUDO">Viudo(a)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Dependientes Económicos
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={15}
                    value={dependentsCount}
                    onChange={(e) => setDependentsCount(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Aviso de Privacidad LFPDPPP Obligatorio */}
            <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                Aviso de Privacidad y Consentimiento LFPDPPP
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed max-h-28 overflow-y-auto">
                {session.privacyNoticeText}
              </p>
              <label className="flex items-start gap-2.5 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  required
                  checked={privacyAccepted}
                  onChange={(e) => setPrivacyAccepted(e.target.checked)}
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs font-bold text-slate-800">
                  Acepto el Aviso de Privacidad y autorizo que mi nombre o apodo ({nickname}) y mi
                  avance de etapa se proyecten en el tablero grupal (nunca montos ni resultados).
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm shadow-lg"
            >
              {saving ? 'Guardando Paso 1...' : 'Guardar Paso 1 y Continuar →'}
            </button>
          </form>
        ) : viewStep === 2 ? (
          /* PASO 2: PATRIMONIO POR CATEGORÍAS Y DEUDAS */
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-5">
            <div>
              <span className="text-xs font-extrabold uppercase text-indigo-600">
                Paso 2 de 8 · Patrimonio y Diversificación
              </span>
              <h2 className="text-xl font-black text-slate-900 mt-0.5">
                Tu Patrimonio por Categorías
              </h2>
              <p className="text-xs text-slate-500">
                Registra el valor aproximado de tus activos y tus deudas (buenas como hipoteca, o
                malas como tarjetas).
              </p>
            </div>

            {/* Tarjeta de Calificación en Vivo */}
            <div className="grid grid-cols-3 gap-2 bg-indigo-950 text-white rounded-2xl p-3.5 text-center">
              <div>
                <span className="text-[10px] text-indigo-300 block">Patrimonio Neto</span>
                <strong className="text-sm font-black text-emerald-300">
                  ${liveCalc.netWorth.toLocaleString('es-MX')}
                </strong>
              </div>
              <div className="border-x border-white/10">
                <span className="text-[10px] text-indigo-300 block">Tasa Integrada</span>
                <strong className="text-sm font-black text-amber-300">
                  {liveCalc.integratedReturnRatePct}% anual
                </strong>
              </div>
              <div>
                <span className="text-[10px] text-indigo-300 block">Diversificación</span>
                <strong className="text-sm font-black text-white">
                  {liveCalc.diversificationScore}/100
                </strong>
              </div>
            </div>

            {/* Lista de Activos */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold uppercase text-slate-700">
                  Mis Activos ({assets.length})
                </h3>
                <button
                  type="button"
                  onClick={() =>
                    setAssets([
                      ...assets,
                      {
                        id: `ast_${Date.now()}`,
                        category: 'INVERSION',
                        description: '',
                        value: 0,
                        annualRatePct: 8.5,
                        liquidity: 'MEDIA',
                      },
                    ])
                  }
                  className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" /> Agregar Activo
                </button>
              </div>

              {assets.map((ast, idx) => (
                <div
                  key={ast.id}
                  className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <select
                      value={ast.category}
                      onChange={(e) => {
                        const cat = e.target.value as TipsAssetCategory;
                        const next = [...assets];
                        next[idx] = {
                          ...ast,
                          category: cat,
                          annualRatePct: ASSET_REFERENCE_RATES[cat]?.defaultRatePct ?? 5,
                        };
                        setAssets(next);
                      }}
                      className="flex-1 rounded-xl border border-slate-300 px-2.5 py-1.5 text-xs font-bold bg-white"
                    >
                      {Object.entries(ASSET_REFERENCE_RATES).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v.label}
                        </option>
                      ))}
                    </select>
                    {assets.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setAssets(assets.filter((_, i) => i !== idx))}
                        className="text-rose-500 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500">
                        Valor Actual ($ MXN)
                      </label>
                      <input
                        type="number"
                        min={0}
                        step={10000}
                        value={ast.value || ''}
                        onChange={(e) => {
                          const next = [...assets];
                          next[idx] = { ...ast, value: Number(e.target.value) };
                          setAssets(next);
                        }}
                        placeholder="Ej. 2500000"
                        className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500">
                        Rendimiento Anual (%)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        value={ast.annualRatePct}
                        onChange={(e) => {
                          const next = [...assets];
                          next[idx] = { ...ast, annualRatePct: Number(e.target.value) };
                          setAssets(next);
                        }}
                        className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-xs"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Lista de Deudas (Buenas vs Malas) */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold uppercase text-slate-700">
                  Mis Deudas ({debts.length})
                </h3>
                <button
                  type="button"
                  onClick={() =>
                    setDebts([
                      ...debts,
                      {
                        id: `dbt_${Date.now()}`,
                        type: 'BUENA',
                        description: 'Crédito Hipotecario',
                        balance: 0,
                        annualCatPct: 10.5,
                        monthlyPayment: 0,
                      },
                    ])
                  }
                  className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" /> Agregar Deuda
                </button>
              </div>

              {debts.map((dbt, idx) => (
                <div
                  key={dbt.id}
                  className="bg-rose-50/40 rounded-2xl p-3.5 border border-rose-200 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <select
                      value={dbt.type}
                      onChange={(e) => {
                        const next = [...debts];
                        const t = e.target.value as 'BUENA' | 'MALA';
                        next[idx] = {
                          ...dbt,
                          type: t,
                          annualCatPct: t === 'BUENA' ? 10.5 : 55.0,
                        };
                        setDebts(next);
                      }}
                      className="flex-1 rounded-xl border border-rose-300 px-2.5 py-1.5 text-xs font-bold bg-white"
                    >
                      <option value="BUENA">Deuda Buena (Hipoteca / Negocio 9–12%)</option>
                      <option value="MALA">Deuda Mala (Tarjeta TDC / Personal CAT 40–70%)</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => setDebts(debts.filter((_, i) => i !== idx))}
                      className="text-rose-500 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500">
                        Saldo Pendiente ($ MXN)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={dbt.balance || ''}
                        onChange={(e) => {
                          const next = [...debts];
                          next[idx] = { ...dbt, balance: Number(e.target.value) };
                          setDebts(next);
                        }}
                        placeholder="0"
                        className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500">
                        Tasa / CAT Anual (%)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        value={dbt.annualCatPct}
                        onChange={(e) => {
                          const next = [...debts];
                          next[idx] = { ...dbt, annualCatPct: Number(e.target.value) };
                          setDebts(next);
                        }}
                        className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-xs"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              disabled={saving}
              onClick={() => handleSaveStep(2, { assets, debts })}
              className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm shadow-lg"
            >
              {saving ? 'Guardando Paso 2...' : 'Guardar Patrimonio →'}
            </button>
          </div>
        ) : viewStep === 3 ? (
          /* PASO 3: SUELDO MENSUAL Y EL NÚMERO MÁGICO */
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-5">
            <div>
              <span className="text-xs font-extrabold uppercase text-indigo-600">
                Paso 3 de 8 · El Número Mágico
              </span>
              <h2 className="text-xl font-black text-slate-900 mt-0.5">
                Tu Ingreso y tu Número Mágico
              </h2>
              <p className="text-xs text-slate-500">
                Cantidad de patrimonio que debes tener hoy a tus <strong>{liveCalc.age} años</strong>{' '}
                para alcanzar tu libertad financiera al momento de tu jubilación.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Ingreso Mensual Promedio ($ MXN)
              </label>
              <input
                type="number"
                min={0}
                step={5000}
                value={monthlyIncome || ''}
                onChange={(e) => setMonthlyIncome(Number(e.target.value))}
                className="w-full rounded-2xl border-2 border-indigo-200 px-4 py-3 text-xl font-black text-slate-900"
              />
            </div>

            {/* Tarjeta del Número Mágico */}
            <div className="bg-gradient-to-br from-indigo-950 to-slate-900 text-white rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-indigo-300 font-bold">
                  Tu Número Mágico Ideal Hoy
                </span>
                <span className="text-xs font-mono bg-amber-400/20 text-amber-300 px-2.5 py-0.5 rounded-full font-bold">
                  {liveCalc.magicNumberMultiplier}× tu sueldo
                </span>
              </div>
              <div className="text-3xl font-black text-amber-300">
                ${liveCalc.magicNumber.toLocaleString('es-MX')} MXN
              </div>

              {/* Comparativa Gráfica Patrimonio vs Número Mágico */}
              <div className="space-y-2 pt-2 border-t border-white/10 text-xs">
                <div className="flex justify-between">
                  <span className="text-indigo-200">Tu Patrimonio Neto Actual:</span>
                  <strong className="text-emerald-300">
                    ${liveCalc.netWorth.toLocaleString('es-MX')} ({liveCalc.magicNumberRatioPct}%)
                  </strong>
                </div>
                <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      liveCalc.magicNumberRatioPct >= 90
                        ? 'bg-emerald-400'
                        : liveCalc.magicNumberRatioPct >= 50
                        ? 'bg-amber-400'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(5, liveCalc.magicNumberRatioPct))}%` }}
                  />
                </div>
                {liveCalc.magicNumberGap > 0 ? (
                  <p className="text-[11px] text-rose-300 pt-1">
                    Brecha por construir para alcanzar tu Número Mágico:{' '}
                    <strong>${liveCalc.magicNumberGap.toLocaleString('es-MX')}</strong>
                  </p>
                ) : (
                  <p className="text-[11px] text-emerald-300 pt-1">
                    ¡Felicidades! Tu patrimonio actual supera tu Número Mágico.
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              disabled={saving}
              onClick={() => handleSaveStep(3, { monthlyIncome })}
              className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm shadow-lg"
            >
              {saving ? 'Guardando Paso 3...' : 'Guardar Número Mágico →'}
            </button>
          </div>
        ) : viewStep === 4 ? (
          /* PASO 4: JUBILACIÓN — LA CINTA MÉTRICA */
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-5">
            <div>
              <span className="text-xs font-extrabold uppercase text-indigo-600">
                Paso 4 de 8 · La Cinta Métrica de tu Vida
              </span>
              <h2 className="text-xl font-black text-slate-900 mt-0.5">
                Planeación de Jubilación
              </h2>
            </div>

            {/* Representación visual de la Cinta Métrica */}
            <div className="bg-slate-900 text-white rounded-2xl p-4 space-y-3">
              <div className="flex justify-between text-[11px] font-bold">
                <span className="text-slate-400">Vividos: {liveCalc.age}a</span>
                <span className="text-emerald-400">
                  Para acumular: {liveCalc.tapeMeasure.productiveYearsLeft} años
                </span>
                <span className="text-amber-300">
                  Retiro: {liveCalc.tapeMeasure.retirementYears} años (hasta{' '}
                  {liveCalc.tapeMeasure.lifeExpectancy})
                </span>
              </div>
              <div className="w-full h-5 rounded-xl overflow-hidden flex font-extrabold text-[10px] text-slate-950">
                <div
                  className="bg-slate-400 flex items-center justify-center"
                  style={{ width: `${Math.round((liveCalc.age / 85) * 100)}%` }}
                >
                  {liveCalc.age}
                </div>
                <div
                  className="bg-emerald-400 flex items-center justify-center"
                  style={{
                    width: `${Math.round((liveCalc.tapeMeasure.productiveYearsLeft / 85) * 100)}%`,
                  }}
                >
                  +{liveCalc.tapeMeasure.productiveYearsLeft}a
                </div>
                <div className="bg-amber-400 flex-1 flex items-center justify-center">
                  {liveCalc.tapeMeasure.retirementYears}a retiro
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ¿A qué edad te quieres jubilar?
                </label>
                <input
                  type="number"
                  min={liveCalc.age + 1}
                  max={80}
                  value={desiredRetirementAge}
                  onChange={(e) => setDesiredRetirementAge(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pensión Deseada (% de tu sueldo)
                </label>
                <input
                  type="number"
                  min={30}
                  max={120}
                  step={5}
                  value={desiredPensionPct}
                  onChange={(e) => setDesiredPensionPct(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Régimen IMSS / ISSSTE
                </label>
                <select
                  value={imssRegime}
                  onChange={(e) => setImssRegime(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold bg-white"
                >
                  <option value="LEY_97">Ley 97 (Afore)</option>
                  <option value="LEY_73">Ley 73 (Antes jul 1997)</option>
                  <option value="NINGUNO">Independiente / Sin IMSS</option>
                  <option value="NO_SE">No estoy seguro</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Saldo en Afore ($ MXN)
                </label>
                <input
                  type="number"
                  min={0}
                  step={10000}
                  value={aforeBalance || ''}
                  onChange={(e) => setAforeBalance(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Saldo Actual en PPR ($)
                </label>
                <input
                  type="number"
                  min={0}
                  value={pprBalance || ''}
                  onChange={(e) => setPprBalance(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Aportación Mensual PPR ($)
                </label>
                <input
                  type="number"
                  min={0}
                  value={pprMonthlyContribution || ''}
                  onChange={(e) => setPprMonthlyContribution(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-600">Pensión mensual deseada:</span>
                <strong className="text-slate-900">
                  ${liveCalc.desiredMonthlyPension.toLocaleString('es-MX')}/mes
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Capital requerido a los {desiredRetirementAge} años:</span>
                <strong className="text-indigo-900">
                  ${liveCalc.retirementCapitalRequired.toLocaleString('es-MX')}
                </strong>
              </div>
              <div className="flex justify-between pt-1 border-t border-indigo-200">
                <span className="font-bold text-rose-700">Brecha de Jubilación por cubrir:</span>
                <strong className="font-black text-rose-700">
                  ${liveCalc.retirementGap.toLocaleString('es-MX')}
                </strong>
              </div>
            </div>

            <button
              type="button"
              disabled={saving}
              onClick={() =>
                handleSaveStep(4, {
                  desiredRetirementAge,
                  desiredPensionPct,
                  imssRegime,
                  aforeBalance,
                  hasPpr: pprBalance > 0 || pprMonthlyContribution > 0,
                  pprBalance,
                  pprMonthlyContribution,
                })
              }
              className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm shadow-lg"
            >
              {saving ? 'Guardando Paso 4...' : 'Guardar Plan de Jubilación →'}
            </button>
          </div>
        ) : viewStep === 5 ? (
          /* PASO 5: SUEÑOS Y PRIORIDADES */
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-5">
            <div>
              <span className="text-xs font-extrabold uppercase text-indigo-600">
                Paso 5 de 8 · Metas Patrimoniales
              </span>
              <h2 className="text-xl font-black text-slate-900 mt-0.5">
                Tus Sueños y Prioridades
              </h2>
              <p className="text-xs text-slate-500">
                Define tus sueños propios, de tus dependientes y de trascendencia. Calcularemos el
                ahorro mensual necesario para cada uno.
              </p>
            </div>

            <div className="space-y-3">
              {dreams.map((drm, idx) => (
                <div
                  key={drm.id}
                  className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      value={drm.name}
                      onChange={(e) => {
                        const next = [...dreams];
                        next[idx] = { ...drm, name: e.target.value };
                        setDreams(next);
                      }}
                      placeholder="Nombre del sueño"
                      className="flex-1 rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-bold"
                    />
                    {dreams.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setDreams(dreams.filter((_, i) => i !== idx))}
                        className="text-rose-500 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500">Tipo</label>
                      <select
                        value={drm.category}
                        onChange={(e) => {
                          const next = [...dreams];
                          next[idx] = { ...drm, category: e.target.value as any };
                          setDreams(next);
                        }}
                        className="w-full rounded-xl border border-slate-300 px-2 py-1.5 text-[11px] bg-white font-semibold"
                      >
                        <option value="PROPIO">Propio</option>
                        <option value="DEPENDIENTES">Dependientes</option>
                        <option value="TRASCENDENCIA">Trascender</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500">
                        Monto ($ MXN)
                      </label>
                      <input
                        type="number"
                        min={10000}
                        step={50000}
                        value={drm.targetAmount || ''}
                        onChange={(e) => {
                          const next = [...dreams];
                          next[idx] = { ...drm, targetAmount: Number(e.target.value) };
                          setDreams(next);
                        }}
                        className="w-full rounded-xl border border-slate-300 px-2.5 py-1.5 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500">
                        Plazo (Años)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={40}
                        value={drm.yearsToGoal}
                        onChange={(e) => {
                          const next = [...dreams];
                          next[idx] = { ...drm, yearsToGoal: Number(e.target.value) };
                          setDreams(next);
                        }}
                        className="w-full rounded-xl border border-slate-300 px-2.5 py-1.5 text-xs font-bold"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() =>
                  setDreams([
                    ...dreams,
                    {
                      id: `drm_${Date.now()}`,
                      name: 'Nuevo Sueño Familiar',
                      category: 'PROPIO',
                      targetAmount: 500000,
                      yearsToGoal: 5,
                      priority: dreams.length + 1,
                    },
                  ])
                }
                className="w-full py-2.5 rounded-xl border border-dashed border-indigo-300 text-indigo-600 text-xs font-bold hover:bg-indigo-50"
              >
                + Agregar otro sueño
              </button>
            </div>

            <button
              type="button"
              disabled={saving}
              onClick={() => handleSaveStep(5, { dreams })}
              className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm shadow-lg"
            >
              {saving ? 'Guardando Paso 5...' : 'Guardar Mis Sueños →'}
            </button>
          </div>
        ) : viewStep === 6 ? (
          /* PASO 6: REGLA DE ORO DEL AHORRO (16%) */
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-5">
            <div>
              <span className="text-xs font-extrabold uppercase text-indigo-600">
                Paso 6 de 8 · Regla de Oro del Ahorro
              </span>
              <h2 className="text-xl font-black text-slate-900 mt-0.5">
                Personaliza tu % de Ahorro (Recomendado: 16%)
              </h2>
            </div>

            <div className="bg-indigo-950 text-white rounded-2xl p-5 text-center space-y-3">
              <div className="text-xs text-indigo-200 font-semibold">
                Porcentaje de tu ingreso destinado a construir patrimonio:
              </div>
              <div className="text-4xl font-black text-amber-300">
                {savingsPct}%{' '}
                <span className="text-lg font-bold text-white">
                  (${liveCalc.selectedMonthlySavings.toLocaleString('es-MX')}/mes)
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={50}
                step={1}
                value={savingsPct}
                onChange={(e) => setSavingsPct(Number(e.target.value))}
                className="w-full accent-amber-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-indigo-300">
                <span>0%</span>
                <span className="text-amber-300 font-bold">16% Regla de Oro</span>
                <span>50%</span>
              </div>
            </div>

            {/* Simulador de qué sueños se alcanzan con este ahorro */}
            <div className="space-y-2">
              <h3 className="text-xs font-extrabold uppercase text-slate-700">
                Viabilidad de tus Sueños con tu Ahorro Actual
              </h3>
              {liveCalc.evaluatedDreams.map((ed) => (
                <div
                  key={ed.id}
                  className={`rounded-2xl p-3.5 border text-xs flex items-center justify-between ${
                    ed.reachableWithCurrentSavings
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                      : 'bg-amber-50 border-amber-200 text-amber-950'
                  }`}
                >
                  <div>
                    <div className="font-bold">{ed.name}</div>
                    <div className="text-[11px] opacity-80">
                      Requiere ${ed.monthlyPmtRequired.toLocaleString('es-MX')}/mes por{' '}
                      {ed.yearsToGoal} años
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full font-extrabold text-[10px] ${
                      ed.reachableWithCurrentSavings
                        ? 'bg-emerald-600 text-white'
                        : 'bg-amber-400 text-slate-950'
                    }`}
                  >
                    {ed.reachableWithCurrentSavings
                      ? '✓ Alcanzable'
                      : `Faltan $${ed.shortfallMonthly.toLocaleString('es-MX')}/mes`}
                  </span>
                </div>
              ))}
            </div>

            <button
              type="button"
              disabled={saving}
              onClick={() =>
                handleSaveStep(6, {
                  savingsPct,
                  monthlySavingsAmount: liveCalc.selectedMonthlySavings,
                })
              }
              className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm shadow-lg"
            >
              {saving ? 'Guardando Paso 6...' : 'Confirmar Meta de Ahorro →'}
            </button>
          </div>
        ) : viewStep === 7 ? (
          /* PASO 7: RIESGOS, CAPITAL HUMANO Y SEGUROS */
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-5">
            <div>
              <span className="text-xs font-extrabold uppercase text-indigo-600">
                Paso 7 de 8 · Blindaje Patrimonial
              </span>
              <h2 className="text-xl font-black text-slate-900 mt-0.5">
                Riesgos, Capital Humano y Seguros
              </h2>
            </div>

            {/* Impacto por fallecimiento o invalidez (Capital Humano) */}
            <div className="bg-rose-950 text-white rounded-2xl p-4 space-y-2">
              <span className="text-[11px] uppercase tracking-wider text-rose-200 font-bold block">
                Tu Capital Humano (Sueldo acumulado de hoy a tu retiro)
              </span>
              <div className="text-2xl sm:text-3xl font-black text-amber-300">
                ${liveCalc.humanCapitalValue.toLocaleString('es-MX')} MXN
              </div>
              <p className="text-[11px] text-rose-100 leading-relaxed">
                Regla de oro: Tu Seguro de Vida e Invalidez debe cubrir al menos{' '}
                <strong>7 a 10 años de tu ingreso</strong> ($
                {liveCalc.recommendedLifeSumMin.toLocaleString('es-MX')} MXN) para proteger a tu
                familia.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <label className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 bg-slate-50 cursor-pointer">
                <span className="font-bold text-slate-800">
                  ¿Tienes Seguro de Vida Individual o con Ahorro?
                </span>
                <input
                  type="checkbox"
                  checked={hasLifeInsurance}
                  onChange={(e) => setHasLifeInsurance(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600"
                />
              </label>

              {hasLifeInsurance && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Suma Asegurada ($ MXN)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={100000}
                      value={lifeInsuredSum || ''}
                      onChange={(e) => setLifeInsuredSum(Number(e.target.value))}
                      placeholder="Ej. 3000000"
                      className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      ¿Qué tan seguro te sientes? (1-5)
                    </label>
                    <select
                      value={lifePerception}
                      onChange={(e) => setLifePerception(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-300 px-2.5 py-1.5 text-xs bg-white font-bold"
                    >
                      <option value={5}>⭐⭐⭐⭐⭐ Muy seguro</option>
                      <option value={4}>⭐⭐⭐⭐ Bien cubierto</option>
                      <option value={3}>⭐⭐⭐ No recuerdo coberturas</option>
                      <option value={2}>⭐⭐ Suma baja / Solo prestación</option>
                      <option value={1}>⭐ Desactualizado</option>
                    </select>
                  </div>
                </div>
              )}

              <label className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 bg-slate-50 cursor-pointer">
                <span className="font-bold text-slate-800">
                  ¿Cuentas con cobertura de Invalidez Total y Permanente?
                </span>
                <input
                  type="checkbox"
                  checked={hasDisabilityInsurance}
                  onChange={(e) => setHasDisabilityInsurance(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 bg-slate-50 cursor-pointer">
                <span className="font-bold text-slate-800">
                  ¿Tienes Póliza de Gastos Médicos Mayores (GMM)?
                </span>
                <input
                  type="checkbox"
                  checked={hasGmm}
                  onChange={(e) => setHasGmm(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600"
                />
              </label>

              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 bg-slate-50 cursor-pointer">
                  <span className="font-bold text-slate-800">¿Seguro de Auto?</span>
                  <input
                    type="checkbox"
                    checked={hasAutoInsurance}
                    onChange={(e) => setHasAutoInsurance(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600"
                  />
                </label>
                <label className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 bg-slate-50 cursor-pointer">
                  <span className="font-bold text-slate-800">¿Seguro de Hogar?</span>
                  <input
                    type="checkbox"
                    checked={hasHomeInsurance}
                    onChange={(e) => setHasHomeInsurance(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600"
                  />
                </label>
              </div>
            </div>

            <button
              type="button"
              disabled={saving}
              onClick={async () => {
                const policies: TipsInsuranceItem[] = [];
                if (hasLifeInsurance && lifeInsuredSum > 0) {
                  policies.push({
                    id: 'pol_vida',
                    type: 'VIDA',
                    company: 'Declarado en TIPS',
                    insuredSum: lifeInsuredSum,
                    perceptionScore: lifePerception,
                  });
                }
                await handleSaveStep(7, {
                  policies,
                  hasLifeInsurance,
                  hasDisabilityInsurance,
                  hasGmm,
                  hasAutoInsurance,
                  hasHomeInsurance,
                });
                if (unlockedStep >= 8) {
                  await handleSaveStep(8, { finishedAt: new Date().toISOString() });
                  setViewStep(8);
                }
              }}
              className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm shadow-lg"
            >
              {saving ? 'Calculando Diagnóstico...' : 'Generar Mi Diagnóstico Patrimonial →'}
            </button>
          </div>
        ) : (
          /* PASO 8: DIAGNÓSTICO PRELIMINAR + DESCARGABLE PDF + AGENDAR CITA CON AGENTE */
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-md space-y-6 print:shadow-none print:border-none">
            <div className="text-center space-y-1 border-b border-slate-100 pb-4">
              <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-600">
                {session.brandName} · Diagnóstico Patrimonial TIPS
              </span>
              <h2 className="text-2xl font-black text-slate-900">
                Resultados de {fullName || nickname}
              </h2>
              <p className="text-xs text-slate-500">
                Para revisar en tu cita individual con <strong>{session.hostName}</strong>
              </p>
            </div>

            {/* Tarjetas de Resumen Ejecutivo */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200">
                <span className="text-[11px] text-slate-500 block">Patrimonio Neto Actual</span>
                <strong className="text-lg font-black text-slate-900">
                  ${liveCalc.netWorth.toLocaleString('es-MX')}
                </strong>
                <span className="text-[10px] text-emerald-700 font-bold block mt-0.5">
                  Tasa Integrada: {liveCalc.integratedReturnRatePct}%
                </span>
              </div>
              <div className="bg-indigo-50 rounded-2xl p-3.5 border border-indigo-200">
                <span className="text-[11px] text-indigo-700 block">Tu Número Mágico</span>
                <strong className="text-lg font-black text-indigo-950">
                  ${liveCalc.magicNumber.toLocaleString('es-MX')}
                </strong>
                <span className="text-[10px] text-indigo-700 font-bold block mt-0.5">
                  Cobertura actual: {liveCalc.magicNumberRatioPct}%
                </span>
              </div>
              <div className="bg-amber-50 rounded-2xl p-3.5 border border-amber-200">
                <span className="text-[11px] text-amber-800 block">Brecha de Jubilación</span>
                <strong className="text-lg font-black text-amber-950">
                  ${liveCalc.retirementGap.toLocaleString('es-MX')}
                </strong>
                <span className="text-[10px] text-amber-800 font-bold block mt-0.5">
                  Retiro deseado: {desiredRetirementAge} años
                </span>
              </div>
              <div className="bg-rose-50 rounded-2xl p-3.5 border border-rose-200">
                <span className="text-[11px] text-rose-700 block">Capital Humano a Proteger</span>
                <strong className="text-lg font-black text-rose-950">
                  ${liveCalc.humanCapitalValue.toLocaleString('es-MX')}
                </strong>
                <span className="text-[10px] text-rose-700 font-bold block mt-0.5">
                  Vida sugerido: ${liveCalc.recommendedLifeSumMin.toLocaleString('es-MX')}
                </span>
              </div>
            </div>

            {/* Huecos de Protección y Oportunidades Detectadas */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-extrabold uppercase text-slate-700">
                Áreas Prioritarias Detectadas para tu Cita Individual
              </h3>
              {liveCalc.detectedGaps.map((gap) => (
                <div
                  key={gap.code}
                  className="bg-rose-50/70 border border-rose-200 rounded-2xl p-3.5 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <strong className="font-extrabold text-rose-950">{gap.title}</strong>
                    <span className="text-[10px] font-black bg-rose-600 text-white px-2 py-0.5 rounded-full">
                      PRIORIDAD {gap.severity}
                    </span>
                  </div>
                  <p className="text-rose-800 text-[11px]">{gap.reason}</p>
                </div>
              ))}
            </div>

            {/* Botones de Cierre: Agendar Cita por WhatsApp + Descargar PDF */}
            <div className="space-y-2.5 pt-2 print:hidden">
              <a
                href={`https://wa.me/${(session.hostPhone || '').replace(/\D/g, '')}?text=${encodeURIComponent(
                  `Hola ${session.hostName}, acabo de completar mi diagnóstico en el taller TIPS "${session.title}". Soy ${fullName || nickname} y me gustaría agendar mi cita individual para revisar mi Número Mágico ($${liveCalc.magicNumber.toLocaleString('es-MX')}) y mis prioridades.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleSaveStep(8, { completedAt: new Date().toISOString() })}
                className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-lg flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                Agendar Cita Individual con {session.hostName}
              </a>

              <button
                type="button"
                onClick={() => {
                  handleSaveStep(8, { completedAt: new Date().toISOString() });
                  window.print();
                }}
                className="w-full py-3 rounded-2xl border-2 border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-extrabold text-xs flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Descargar Diagnóstico Completo en PDF
              </button>
            </div>
          </div>
        )}

        {/* Banner cuando completó el paso actual pero el Host aún no libera el siguiente */}
        {isWaitingForNextUnlock && viewStep > 0 && viewStep < 8 && (
          <div className="bg-indigo-900 text-white rounded-2xl p-4 text-center space-y-1 shadow">
            <div className="flex items-center justify-center gap-1.5 text-amber-300 text-xs font-extrabold">
              <Clock className="w-4 h-4 animate-spin" />
              ¡Paso {completedStep} Guardado!
            </div>
            <p className="text-xs text-indigo-100">
              En cuanto el expositor libere el <strong>Paso {completedStep + 1}</strong>, tu
              pantalla avanzará automáticamente.
            </p>
          </div>
        )}

        {/* Navegación entre pasos ya desbloqueados por el Host */}
        {inLobbyJoined && participant?.privacyAccepted && unlockedStep > 1 && (
          <div className="flex items-center justify-between pt-2 print:hidden">
            <button
              type="button"
              disabled={viewStep <= 1}
              onClick={() => setViewStep((s) => Math.max(1, s - 1))}
              className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 disabled:opacity-30 px-3 py-2 rounded-xl bg-white border border-slate-200"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Paso Anterior
            </button>
            <button
              type="button"
              disabled={viewStep >= unlockedStep}
              onClick={() => setViewStep((s) => Math.min(unlockedStep, s + 1))}
              className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 disabled:opacity-30 px-3 py-2 rounded-xl bg-white border border-indigo-200"
            >
              Siguiente Paso Desbloqueado <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
