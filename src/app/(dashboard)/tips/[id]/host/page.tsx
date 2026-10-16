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
  Printer,
  FileText,
} from 'lucide-react';

const MARITAL_LABELS: Record<string, string> = {
  SOLTERO: 'Soltero(a)',
  CASADO: 'Casado(a)',
  UNION_LIBRE: 'Unión Libre',
  DIVORCIADO: 'Divorciado(a)',
  VIUDO: 'Viudo(a)',
};

const ASSET_CATEGORY_LABELS: Record<string, string> = {
  INMUEBLE: 'Bienes Inmuebles',
  INVERSION: 'Inversiones / Fondos / CETES',
  NEGOCIO: 'Negocios Propios',
  SEGURO_AHORRO: 'Seguros con Ahorro / PPR',
  FONDO_EMERGENCIA: 'Fondo de Emergencia / Liquidez',
  ARTE_JOYAS: 'Arte, Joyas o Colecciones',
  VEHICULO: 'Vehículos / Autos',
  OTRO: 'Otros Activos',
};

const IMSS_REGIME_LABELS: Record<string, string> = {
  LEY_73: 'Ley 73 (IMSS antes de Jul 1997)',
  LEY_97: 'Ley 97 / Afore (Cuentas Individuales)',
  NINGUNO: 'Independiente / Sin IMSS ni ISSSTE',
  NO_SE: 'No está seguro de su régimen',
};

const DREAM_CATEGORY_LABELS: Record<string, string> = {
  PROPIO: 'Sueño Propio',
  DEPENDIENTES: 'Dependientes / Hijos',
  TRASCENDENCIA: 'Trascendencia / Legado',
};

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
  const [copiedDossier, setCopiedDossier] = useState(false);
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

  const activeParticipant = selectedParticipant
    ? participants.find((item) => item.id === selectedParticipant.id) || selectedParticipant
    : null;

  const copyParticipantDossierText = (p: any) => {
    if (!p) return;
    const s1 = p.step1General || {};
    const s2 = p.step2Patrimony || {};
    const s3 = p.step3Income || {};
    const s4 = p.step4Retirement || {};
    const s5 = p.step5Dreams || {};
    const s7 = p.step7Insurance || {};
    const calc = p.calculatedResults || {};
    const assets: any[] = Array.isArray(s2.assets) ? s2.assets : [];
    const debts: any[] = Array.isArray(s2.debts) ? s2.debts : [];
    const dreams: any[] = Array.isArray(calc.evaluatedDreams)
      ? calc.evaluatedDreams
      : Array.isArray(s5.dreams)
      ? s5.dreams
      : [];
    const gaps: any[] = Array.isArray(calc.detectedGaps) ? calc.detectedGaps : [];

    const lines = [
      `📋 FICHA TÉCNICA CONFIDENCIAL DEL PROSPECTO (TIPS)`,
      `Taller: ${sess.title} (Código: ${sess.code})`,
      `Fecha: ${new Date().toLocaleDateString('es-MX')}`,
      `--------------------------------------------------`,
      `1. DATOS PERSONALES Y FAMILIARES`,
      `• Nombre Completo: ${p.fullName || s1.fullName || p.nickname || 'S/D'}`,
      `• Apodo en Sala: ${p.nickname || '—'}`,
      `• Fecha de Nacimiento: ${s1.birthDate || 'No capturada'} (${calc.age || '—'} años)`,
      `• Estado Civil: ${MARITAL_LABELS[s1.maritalStatus] || s1.maritalStatus || 'No capturado'}`,
      `• Dependientes Económicos: ${s1.dependentsCount ?? 0}`,
      `• Teléfono / WhatsApp: ${p.phone || 'S/N'}`,
      `• Correo Electrónico: ${p.email || 'S/N'}`,
      `• Progreso Taller: Paso ${p.completedStep}/8 · Score: ${p.leadScore || 0}/100 (${p.leadTier || 'COLD'})`,
      calc.appointmentRequested
        ? `• Cita Individual Solicitada: SÍ (Preferencia: ${calc.preferredSlot || '48h'})`
        : `• Cita Individual Solicitada: Pendiente`,
      ``,
      `2. INGRESOS Y NÚMERO MÁGICO`,
      `• Ingreso Mensual Declarado: $${Number(calc.monthlyIncome ?? s3.monthlyIncome ?? 0).toLocaleString('es-MX')}`,
      `• Ingreso Anual: $${Number(calc.annualIncome || 0).toLocaleString('es-MX')}`,
      `• Número Mágico (Lo que ya debería tener acumulado a su edad): $${Number(calc.magicNumber || 0).toLocaleString('es-MX')} (${calc.magicNumberMultiplier || 0}x su sueldo)`,
      `• Patrimonio Neto Actual: $${Number(calc.netWorth || 0).toLocaleString('es-MX')} (${calc.magicNumberRatioPct || 0}% de su Número Mágico)`,
      `• Brecha vs Número Mágico: $${Number(calc.magicNumberGap || 0).toLocaleString('es-MX')}`,
      ``,
      `3. RADIOGRAFÍA DE ACTIVOS Y DEUDAS`,
      `• Total Activos: $${Number(calc.totalAssets || 0).toLocaleString('es-MX')} | Tasa Integrada: ${calc.integratedReturnRatePct || 0}% anual | Diversificación: ${calc.diversificationScore || 0}/100`,
      ...(assets.length > 0
        ? assets.map(
            (a, idx) =>
              `  - Activo #${idx + 1}: [${ASSET_CATEGORY_LABELS[a.category] || a.category}] ${a.description || 'Sin descripción'}: $${Number(a.value || 0).toLocaleString('es-MX')} (Rendimiento: ${a.annualRatePct ?? 0}% anual, Liquidez: ${a.liquidity || 'MEDIA'})`
          )
        : ['  - Sin activos detallados']),
      `• Total Deudas: $${Number(calc.totalDebts || 0).toLocaleString('es-MX')} (Buenas: $${Number(calc.totalGoodDebts || 0).toLocaleString('es-MX')} / Malas: $${Number(calc.totalBadDebts || 0).toLocaleString('es-MX')})`,
      ...(debts.length > 0
        ? debts.map(
            (d, idx) =>
              `  - Deuda #${idx + 1}: [Deuda ${d.type || 'MALA'}] ${d.description || 'Sin descripción'}: $${Number(d.balance || 0).toLocaleString('es-MX')} (CAT: ${d.annualCatPct ?? 0}% anual)`
          )
        : ['  - Sin deudas registradas']),
      ``,
      `4. RETIRO Y CINTA MÉTRICA DE VIDA`,
      `• Edad Deseada de Retiro: ${s4.desiredRetirementAge || calc.tapeMeasure?.desiredRetirementAge || 65} años (Años productivos restantes: ${calc.tapeMeasure?.productiveYearsLeft ?? '—'})`,
      `• Pensión Mensual Deseada: ${s4.desiredPensionPct || 80}% de su sueldo ($${Number(calc.desiredMonthlyPension || 0).toLocaleString('es-MX')}/mes)`,
      `• Régimen IMSS / ISSSTE: ${IMSS_REGIME_LABELS[s4.imssRegime] || s4.imssRegime || 'No especificado'}`,
      `• Saldo Actual en Afore: $${Number(s4.aforeBalance || 0).toLocaleString('es-MX')}`,
      `• ¿Cuenta con PPR?: ${s4.hasPpr ? `Sí (Saldo: $${Number(s4.pprBalance || 0).toLocaleString('es-MX')}, Aportación: $${Number(s4.pprMonthlyContribution || 0).toLocaleString('es-MX')}/mes)` : 'No'}`,
      `• Capital Requerido para Jubilación: $${Number(calc.retirementCapitalRequired || 0).toLocaleString('es-MX')}`,
      `• Capital Proyectado Actual: $${Number(calc.retirementCapitalProjected || 0).toLocaleString('es-MX')}`,
      `• Brecha de Jubilación: $${Number(calc.retirementGap || 0).toLocaleString('es-MX')} (Ahorro mensual requerido PMT: $${Number(calc.retirementMonthlySavingsNeeded || 0).toLocaleString('es-MX')}/mes)`,
      ``,
      `5. MAPA DE SUEÑOS Y REGLA DE AHORRO (16%)`,
      `• Ahorro Mensual Elegido: ${calc.selectedSavingsPct ?? 16}% ($${Number(calc.selectedMonthlySavings || 0).toLocaleString('es-MX')}/mes) vs Recomendado 16% ($${Number(calc.recommendedMonthlySavings || 0).toLocaleString('es-MX')}/mes)`,
      ...(dreams.length > 0
        ? dreams.map(
            (dr, idx) =>
              `  - Prioridad #${dr.priority || idx + 1}: ${dr.name} (${DREAM_CATEGORY_LABELS[dr.category] || dr.category}) · Meta: $${Number(dr.targetAmount || 0).toLocaleString('es-MX')} en ${dr.yearsToGoal} años · PMT requerido: $${Number(dr.monthlyPmtRequired || 0).toLocaleString('es-MX')}/mes (${dr.reachableWithCurrentSavings ? 'Alcanzable hoy' : 'Requiere incrementar ahorro'})`
          )
        : ['  - Sin sueños capturados']),
      ``,
      `6. RIESGOS, CAPITAL HUMANO Y SEGUROS ACTUALES`,
      `• Capital Humano Total (Valor económico futuro): $${Number(calc.humanCapitalValue || 0).toLocaleString('es-MX')}`,
      `• Suma Asegurada Vida Recomendada: Mínimo (7x) $${Number(calc.recommendedLifeSumMin || 0).toLocaleString('es-MX')} | Ideal (10x) $${Number(calc.recommendedLifeSumIdeal || 0).toLocaleString('es-MX')}`,
      `• ¿Tiene Seguro de Vida?: ${s7.hasLifeInsurance ? `Sí (Suma Asegurada declarada: $${Number(calc.currentLifeSum || 0).toLocaleString('es-MX')})` : 'NO'}`,
      `• ¿Tiene Seguro de Invalidez?: ${s7.hasDisabilityInsurance ? 'Sí' : 'NO'}`,
      `• ¿Tiene Gastos Médicos Mayores (GMM)?: ${s7.hasGmm ? 'Sí' : 'NO'}`,
      `• ¿Tiene Seguro de Auto?: ${s7.hasAutoInsurance ? 'Sí' : 'NO'}`,
      `• ¿Tiene Seguro de Hogar?: ${s7.hasHomeInsurance ? 'Sí' : 'NO'}`,
      ``,
      `7. HUECOS DE PROTECCIÓN Y OPORTUNIDADES DE VENTA DETECTADAS`,
      ...(gaps.length > 0
        ? gaps.map(
            (g) =>
              `  - [${g.code} · Severidad ${g.severity}] ${g.title}: Brecha $${Number(g.gapAmount || 0).toLocaleString('es-MX')} — ${g.reason}`
          )
        : ['  - Ningún hueco detectado todavía']),
    ];

    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedDossier(true);
    setTimeout(() => setCopiedDossier(false), 2500);
  };

  const printParticipantDossier = (p: any) => {
    if (!p || typeof window === 'undefined') return;
    const s1 = p.step1General || {};
    const s2 = p.step2Patrimony || {};
    const s3 = p.step3Income || {};
    const s4 = p.step4Retirement || {};
    const s5 = p.step5Dreams || {};
    const s7 = p.step7Insurance || {};
    const calc = p.calculatedResults || {};
    const assets: any[] = Array.isArray(s2.assets) ? s2.assets : [];
    const debts: any[] = Array.isArray(s2.debts) ? s2.debts : [];
    const dreams: any[] = Array.isArray(calc.evaluatedDreams)
      ? calc.evaluatedDreams
      : Array.isArray(s5.dreams)
      ? s5.dreams
      : [];
    const gaps: any[] = Array.isArray(calc.detectedGaps) ? calc.detectedGaps : [];
    const lifePol = Array.isArray(s7.policies) ? s7.policies[0] : null;

    const printWin = window.open('', '_blank', 'width=980,height=850');
    if (!printWin) {
      alert('Por favor permite ventanas emergentes para descargar/imprimir la Ficha en PDF.');
      return;
    }

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Ficha Confidencial TIPS - ${p.fullName || p.nickname || 'Prospecto'}</title>
  <style>
    * { box-sizing: border-box; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif; }
    body { margin: 0; padding: 24px; color: #0f172a; background: #ffffff; font-size: 12px; line-height: 1.45; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #4f46e5; padding-bottom: 14px; margin-bottom: 16px; }
    .badge { display: inline-block; padding: 3px 8px; border-radius: 6px; font-weight: 700; font-size: 10px; text-transform: uppercase; background: #eef2ff; color: #4338ca; }
    .badge-hot { background: #fee2e2; color: #b91c1c; }
    .badge-appt { background: #d1fae5; color: #047857; }
    h1 { margin: 4px 0 2px; font-size: 20px; font-weight: 900; color: #0f172a; }
    h2 { margin: 14px 0 8px; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.4px; color: #1e1b4b; border-left: 4px solid #4f46e5; padding-left: 8px; }
    .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 12px; }
    .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 12px; }
    .grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 12px; }
    .card { border: 1px solid #cbd5e1; border-radius: 10px; padding: 9px 11px; background: #f8fafc; }
    .card-highlight { border-color: #c7d2fe; background: #eef2ff; }
    .card-danger { border-color: #fecdd3; background: #fff1f2; }
    .label { font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: 700; display: block; }
    .val { font-size: 14px; font-weight: 900; color: #0f172a; margin-top: 2px; display: block; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 11px; }
    th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
    th { background: #f1f5f9; font-weight: 800; color: #334155; font-size: 10px; text-transform: uppercase; }
    .notes-box { border: 1px dashed #94a3b8; border-radius: 10px; height: 95px; padding: 10px; margin-top: 8px; color: #64748b; font-size: 11px; }
    @media print {
      body { padding: 10px; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom:14px; display:flex; justify-content:space-between; align-items:center; background:#0f172a; color:#fff; padding:10px 16px; border-radius:10px;">
    <span><strong>Ficha Confidencial del Prospecto para Cita 1 a 1</strong> · Lista para guardar en PDF o imprimir</span>
    <button onclick="window.print()" style="background:#4f46e5; color:#fff; border:none; padding:7px 14px; border-radius:8px; font-weight:800; cursor:pointer;">🖨️ Imprimir / Guardar como PDF</button>
  </div>

  <div class="header">
    <div>
      <span class="badge">Expediente Confidencial para el Agente · Paso ${p.completedStep}/8</span>
      ${p.leadTier === 'HOT' ? '<span class="badge badge-hot">🔥 Lead Caliente (' + (p.leadScore || 0) + ' pts)</span>' : ''}
      ${calc.appointmentRequested ? '<span class="badge badge-appt">📅 Solicitó Cita (' + (calc.preferredSlot || '48h') + ')</span>' : ''}
      <h1>${p.fullName || s1.fullName || p.nickname || 'Prospecto TIPS'}</h1>
      <div style="color:#475569; font-size:11px;">
        Taller: <strong>${sess.title}</strong> (#${sess.code}) · Agente Host: <strong>${sess.host?.name || 'Asesor Patrimonial'}</strong> · Fecha: ${new Date().toLocaleDateString('es-MX')}
      </div>
    </div>
    <div style="text-align:right; font-size:11px;">
      <div><strong>Tel / WhatsApp:</strong> ${p.phone || 'S/N'}</div>
      <div><strong>Email:</strong> ${p.email || 'S/N'}</div>
      <div><strong>Apodo en Sala:</strong> ${p.nickname || '—'}</div>
      <div><strong>LFPDPPP:</strong> ${p.privacyAccepted ? '✓ Aceptado' : 'Pendiente'}</div>
    </div>
  </div>

  <h2>1. Perfil Personal, Familiar y Demográfico (Paso 1)</h2>
  <div class="grid-4">
    <div class="card">
      <span class="label">Fecha de Nacimiento</span>
      <span class="val">${s1.birthDate || 'No capturada'}</span>
    </div>
    <div class="card">
      <span class="label">Edad Actual</span>
      <span class="val">${calc.age || '—'} años</span>
    </div>
    <div class="card">
      <span class="label">Estado Civil</span>
      <span class="val">${MARITAL_LABELS[s1.maritalStatus] || s1.maritalStatus || 'No capturado'}</span>
    </div>
    <div class="card">
      <span class="label">Dependientes Económicos</span>
      <span class="val">${s1.dependentsCount ?? 0} personas</span>
    </div>
  </div>

  <h2>2. Resumen Financiero, Sueldo y Número Mágico (Paso 3)</h2>
  <div class="grid-4">
    <div class="card">
      <span class="label">Ingreso Mensual Declarado</span>
      <span class="val">$${Number(calc.monthlyIncome ?? s3.monthlyIncome ?? 0).toLocaleString('es-MX')}</span>
      <small style="color:#64748b;">Anual: $${Number(calc.annualIncome || 0).toLocaleString('es-MX')}</small>
    </div>
    <div class="card card-highlight">
      <span class="label">Número Mágico a su Edad</span>
      <span class="val">$${Number(calc.magicNumber || 0).toLocaleString('es-MX')}</span>
      <small style="color:#4338ca;">${calc.magicNumberMultiplier || 0}x su sueldo mensual</small>
    </div>
    <div class="card">
      <span class="label">Patrimonio Neto Actual</span>
      <span class="val">$${Number(calc.netWorth || 0).toLocaleString('es-MX')}</span>
      <small style="color:#64748b;">Cubre ${calc.magicNumberRatioPct || 0}% del Número Mágico</small>
    </div>
    <div class="card card-danger">
      <span class="label">Capital Humano Total</span>
      <span class="val">$${Number(calc.humanCapitalValue || 0).toLocaleString('es-MX')}</span>
      <small style="color:#be123c;">Ingresos futuros por proteger</small>
    </div>
  </div>

  <h2>3. Radiografía Exacta de Activos y Deudas Declaradas (Paso 2)</h2>
  <div class="grid-3">
    <div class="card">
      <span class="label">Total Activos Declarados</span>
      <span class="val">$${Number(calc.totalAssets || 0).toLocaleString('es-MX')}</span>
    </div>
    <div class="card">
      <span class="label">Total Deudas (Buenas / Malas)</span>
      <span class="val">$${Number(calc.totalDebts || 0).toLocaleString('es-MX')}</span>
      <small style="color:#64748b;">Buenas: $${Number(calc.totalGoodDebts || 0).toLocaleString('es-MX')} · Malas: $${Number(calc.totalBadDebts || 0).toLocaleString('es-MX')}</small>
    </div>
    <div class="card">
      <span class="label">Tasa Integrada y Diversificación</span>
      <span class="val">${calc.integratedReturnRatePct || 0}% anual</span>
      <small style="color:#64748b;">Score Diversificación: ${calc.diversificationScore || 0}/100 · Semáforo: ${calc.patrimonySemaphore || '—'}</small>
    </div>
  </div>
  <div class="grid-2">
    <div>
      <table>
        <thead>
          <tr><th>Categoría Activo</th><th>Descripción</th><th>Valor ($)</th><th>Tasa / Liquidez</th></tr>
        </thead>
        <tbody>
          ${
            assets.length > 0
              ? assets
                  .map(
                    (a) =>
                      `<tr><td>${ASSET_CATEGORY_LABELS[a.category] || a.category}</td><td>${a.description || '—'}</td><td><strong>$${Number(a.value || 0).toLocaleString('es-MX')}</strong></td><td>${a.annualRatePct ?? 0}% (${a.liquidity || 'MEDIA'})</td></tr>`
                  )
                  .join('')
              : '<tr><td colspan="4" style="text-align:center;color:#64748b;">Sin activos registrados</td></tr>'
          }
        </tbody>
      </table>
    </div>
    <div>
      <table>
        <thead>
          <tr><th>Tipo Deuda</th><th>Descripción</th><th>Saldo ($)</th><th>CAT Anual</th></tr>
        </thead>
        <tbody>
          ${
            debts.length > 0
              ? debts
                  .map(
                    (d) =>
                      `<tr><td><strong>${d.type === 'BUENA' ? 'Deuda Buena' : 'Deuda Mala (TDC/Consumo)'}</strong></td><td>${d.description || '—'}</td><td><strong>$${Number(d.balance || 0).toLocaleString('es-MX')}</strong></td><td>${d.annualCatPct ?? 0}%</td></tr>`
                  )
                  .join('')
              : '<tr><td colspan="4" style="text-align:center;color:#64748b;">Sin deudas registradas</td></tr>'
          }
        </tbody>
      </table>
    </div>
  </div>

  <h2>4. Jubilación, Régimen IMSS/Afore/PPR y Cinta Métrica de Vida (Paso 4)</h2>
  <div class="grid-4">
    <div class="card">
      <span class="label">Edad Deseada de Retiro</span>
      <span class="val">${s4.desiredRetirementAge || calc.tapeMeasure?.desiredRetirementAge || 65} años</span>
      <small style="color:#64748b;">Quedan ${calc.tapeMeasure?.productiveYearsLeft ?? '—'} años productivos</small>
    </div>
    <div class="card">
      <span class="label">Pensión Mensual Deseada</span>
      <span class="val">$${Number(calc.desiredMonthlyPension || 0).toLocaleString('es-MX')}/mes</span>
      <small style="color:#64748b;">${s4.desiredPensionPct || 80}% de su ingreso actual</small>
    </div>
    <div class="card">
      <span class="label">Régimen de Retiro y Afore</span>
      <span class="val" style="font-size:12px;">${IMSS_REGIME_LABELS[s4.imssRegime] || s4.imssRegime || 'No especificado'}</span>
      <small style="color:#64748b;">Saldo Afore: $${Number(s4.aforeBalance || 0).toLocaleString('es-MX')}</small>
    </div>
    <div class="card">
      <span class="label">Plan Personal de Retiro (PPR)</span>
      <span class="val">${s4.hasPpr ? 'SÍ TIENE PPR' : 'NO TIENE PPR'}</span>
      <small style="color:#64748b;">Saldo: $${Number(s4.pprBalance || 0).toLocaleString('es-MX')} · Aporta: $${Number(s4.pprMonthlyContribution || 0).toLocaleString('es-MX')}/mes</small>
    </div>
  </div>
  <div class="grid-3">
    <div class="card">
      <span class="label">Capital Requerido al Retiro</span>
      <span class="val">$${Number(calc.retirementCapitalRequired || 0).toLocaleString('es-MX')}</span>
    </div>
    <div class="card">
      <span class="label">Capital Proyectado Actual</span>
      <span class="val">$${Number(calc.retirementCapitalProjected || 0).toLocaleString('es-MX')}</span>
    </div>
    <div class="card card-danger">
      <span class="label">Brecha de Jubilación / PMT Mensual</span>
      <span class="val">$${Number(calc.retirementGap || 0).toLocaleString('es-MX')}</span>
      <small style="color:#be123c;">Requiere ahorrar: $${Number(calc.retirementMonthlySavingsNeeded || 0).toLocaleString('es-MX')}/mes</small>
    </div>
  </div>

  <h2>5. Mapa de Sueños y Regla de Ahorro del 16% (Pasos 5 y 6)</h2>
  <div style="margin-bottom:8px; font-size:11px;">
    <strong>Ahorro Mensual Elegido por el Prospecto:</strong> ${calc.selectedSavingsPct ?? 16}% ($${Number(calc.selectedMonthlySavings || 0).toLocaleString('es-MX')}/mes)
    &nbsp;|&nbsp; <strong>Meta Recomendada (16%):</strong> $${Number(calc.recommendedMonthlySavings || 0).toLocaleString('es-MX')}/mes
  </div>
  <table>
    <thead>
      <tr><th>Prioridad</th><th>Sueño / Meta Declarada</th><th>Categoría</th><th>Monto Meta ($)</th><th>Plazo</th><th>PMT Mensual Requerido</th><th>Viabilidad Hoy</th></tr>
    </thead>
    <tbody>
      ${
        dreams.length > 0
          ? dreams
              .map(
                (dr, idx) =>
                  `<tr><td>#${dr.priority || idx + 1}</td><td><strong>${dr.name}</strong></td><td>${DREAM_CATEGORY_LABELS[dr.category] || dr.category}</td><td>$${Number(dr.targetAmount || 0).toLocaleString('es-MX')}</td><td>${dr.yearsToGoal} años</td><td><strong>$${Number(dr.monthlyPmtRequired || 0).toLocaleString('es-MX')}/mes</strong></td><td>${dr.reachableWithCurrentSavings ? '✓ Alcanzable con ahorro actual' : '⚠️ Faltan $' + Number(dr.shortfallMonthly || 0).toLocaleString('es-MX') + '/mes'}</td></tr>`
              )
              .join('')
          : '<tr><td colspan="7" style="text-align:center;color:#64748b;">Sin sueños capturados</td></tr>'
      }
    </tbody>
  </table>

  <h2>6. Checklist de Seguros Actuales y Oportunidades Comerciales (Pasos 7 y 8)</h2>
  <div class="grid-3">
    <div class="card">
      <span class="label">Seguro de Vida Actual</span>
      <span class="val">${s7.hasLifeInsurance ? 'SÍ ($' + Number(calc.currentLifeSum || 0).toLocaleString('es-MX') + ')' : 'NO TIENE'}</span>
      <small style="color:#64748b;">Ideal (10x): $${Number(calc.recommendedLifeSumIdeal || 0).toLocaleString('es-MX')} · Percepción: ${lifePol?.perceptionScore ? lifePol.perceptionScore + '/5 ★' : '—'}</small>
    </div>
    <div class="card">
      <span class="label">Invalidez y Gastos Médicos (GMM)</span>
      <span class="val" style="font-size:12px;">Invalidez: ${s7.hasDisabilityInsurance ? 'SÍ' : 'NO'} · GMM: ${s7.hasGmm ? 'SÍ' : 'NO'}</span>
    </div>
    <div class="card">
      <span class="label">Seguros Patrimoniales (Auto / Hogar)</span>
      <span class="val" style="font-size:12px;">Auto: ${s7.hasAutoInsurance ? 'SÍ' : 'NO'} · Hogar: ${s7.hasHomeInsurance ? 'SÍ' : 'NO'}</span>
    </div>
  </div>

  <table>
    <thead>
      <tr><th>Ramo / Oportunidad</th><th>Severidad</th><th>Diagnóstico para el Agente</th><th>Brecha Estimada ($)</th></tr>
    </thead>
    <tbody>
      ${
        gaps.length > 0
          ? gaps
              .map(
                (g) =>
                  `<tr><td><strong>${g.title}</strong> (${g.code})</td><td>${g.severity}</td><td>${g.reason}</td><td><strong>$${Number(g.gapAmount || 0).toLocaleString('es-MX')}</strong></td></tr>`
              )
              .join('')
          : '<tr><td colspan="4" style="text-align:center;color:#64748b;">Sin huecos críticos detectados</td></tr>'
      }
    </tbody>
  </table>

  <div class="notes-box">
    <strong>Notas del Agente para la Cita Individual (Acuerdos, presupuesto mensual confirmado, aseguradora sugerida):</strong>
  </div>
</body>
</html>`;

    printWin.document.open();
    printWin.document.write(html);
    printWin.document.close();
    printWin.focus();
  };

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
                        (En paso {p.activeStep || p.currentStep || p.completedStep}/8 · {p.completedStep} guardados)
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
                        <span className="font-extrabold text-indigo-700 block">
                          Paso {p.activeStep ?? p.currentStep ?? p.completedStep} / 8
                        </span>
                        <span
                          className={`text-[10px] font-bold ${
                            p.completedStep >= (sess.unlockedStep || 1)
                              ? 'text-emerald-600'
                              : 'text-indigo-500'
                          }`}
                        >
                          {p.completedStep >= (sess.unlockedStep || 1)
                            ? `✓ Paso ${p.completedStep} listo`
                            : `✍️ Capturando (${p.completedStep}/8 listos)`}
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
                      <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => setSelectedParticipant(p)}
                          className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs inline-flex items-center gap-1"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          Ver Ficha Completa
                        </button>
                        <button
                          onClick={() => printParticipantDossier(p)}
                          className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
                          title="Descargar / Imprimir Ficha Técnica en PDF"
                        >
                          <Printer className="w-4 h-4 inline" />
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

      {/* MODAL EXPEDIENTE CONFIDENCIAL Y FICHA TÉCNICA COMPLETA DEL PROSPECTO */}
      {activeParticipant && (() => {
        const s1 = activeParticipant.step1General || {};
        const s2 = activeParticipant.step2Patrimony || {};
        const s3 = activeParticipant.step3Income || {};
        const s4 = activeParticipant.step4Retirement || {};
        const s5 = activeParticipant.step5Dreams || {};
        const s7 = activeParticipant.step7Insurance || {};
        const calc = activeParticipant.calculatedResults || null;
        const assets: any[] = Array.isArray(s2.assets) ? s2.assets : [];
        const debts: any[] = Array.isArray(s2.debts) ? s2.debts : [];
        const dreams: any[] = Array.isArray(calc?.evaluatedDreams)
          ? calc.evaluatedDreams
          : Array.isArray(s5.dreams)
          ? s5.dreams
          : [];
        const gaps: any[] = Array.isArray(calc?.detectedGaps) ? calc.detectedGaps : [];
        const lifePolicy = Array.isArray(s7.policies) ? s7.policies[0] : null;

        return (
          <div
            onClick={() => setSelectedParticipant(null)}
            className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl max-w-4xl w-full p-5 sm:p-8 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto"
            >
              {/* Encabezado y Acciones de Descarga / Copia */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-extrabold uppercase text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                      Expediente Confidencial · Paso {activeParticipant.completedStep}/8
                    </span>
                    <span className="text-xs font-extrabold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800">
                      Score: {activeParticipant.leadScore || 0}/100 (
                      {activeParticipant.leadTier === 'HOT'
                        ? '🔥 Caliente'
                        : activeParticipant.leadTier === 'WARM'
                        ? '🟡 Tibio'
                        : '❄️ Frío'}
                      )
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mt-1.5">
                    {activeParticipant.fullName || s1.fullName || activeParticipant.nickname}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Apodo en Sala: <strong>{activeParticipant.nickname || '—'}</strong> · Tel:{' '}
                    <strong>{activeParticipant.phone || 'S/N'}</strong> · Email:{' '}
                    <strong>{activeParticipant.email || 'S/N'}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => printParticipantDossier(activeParticipant)}
                    className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold inline-flex items-center gap-1.5 shadow-sm"
                  >
                    <Printer className="w-4 h-4" />
                    Descargar / Imprimir Ficha (PDF)
                  </button>
                  <button
                    onClick={() => copyParticipantDossierText(activeParticipant)}
                    className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold inline-flex items-center gap-1.5"
                  >
                    {copiedDossier ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ¡Ficha Copiada!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copiar Resumen
                      </>
                    )}
                  </button>
                  {activeParticipant.phone && (
                    <a
                      href={`https://wa.me/${activeParticipant.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                        `Hola ${activeParticipant.fullName || activeParticipant.nickname}, gracias por participar en el taller TIPS "${sess.title}". Tengo lista tu radiografía patrimonial para que la revisemos en nuestra sesión 1 a 1.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      WhatsApp
                    </a>
                  )}
                  <button
                    onClick={() => setSelectedParticipant(null)}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 font-bold text-base"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {calc?.appointmentRequested && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 text-xs text-emerald-900 font-bold flex items-center justify-between flex-wrap gap-2">
                  <span>
                    📅 Este prospecto ya solicitó cita individual desde su celular. Horario
                    preferido: <u>{calc.preferredSlot || 'Próximas 48 horas'}</u>.
                  </span>
                </div>
              )}

              {/* SECCIÓN 1: DATOS DEMOGRÁFICOS Y FAMILIARES (PASO 1) */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-indigo-900 border-l-4 border-indigo-600 pl-2.5">
                  1. Datos Personales, Fecha de Nacimiento y Familia (Paso 1)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                    <span className="text-[11px] text-slate-500 block">Fecha de Nacimiento</span>
                    <strong className="text-sm font-black text-slate-900">
                      {s1.birthDate || 'No capturada'}
                    </strong>
                    <span className="text-[11px] text-indigo-600 font-semibold block">
                      Edad calculada: {calc?.age || '—'} años
                    </span>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                    <span className="text-[11px] text-slate-500 block">Estado Civil</span>
                    <strong className="text-sm font-black text-slate-900">
                      {MARITAL_LABELS[s1.maritalStatus] || s1.maritalStatus || 'No capturado'}
                    </strong>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                    <span className="text-[11px] text-slate-500 block">Dependientes Económicos</span>
                    <strong className="text-sm font-black text-slate-900">
                      {s1.dependentsCount ?? 0} personas
                    </strong>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                    <span className="text-[11px] text-slate-500 block">Aviso LFPDPPP</span>
                    <strong className="text-sm font-black text-emerald-700">
                      {activeParticipant.privacyAccepted ? '✓ Aceptado' : 'Pendiente'}
                    </strong>
                    {activeParticipant.privacyAcceptedAt && (
                      <span className="text-[10px] text-slate-400 block">
                        {new Date(activeParticipant.privacyAcceptedAt).toLocaleTimeString('es-MX')}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {calc ? (
                <>
                  {/* SECCIÓN 2: RESUMEN EJECUTIVO DE INDICADORES */}
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-indigo-900 border-l-4 border-indigo-600 pl-2.5">
                      2. Indicadores Patrimoniales y Número Mágico (Paso 3)
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200">
                        <span className="text-[11px] text-slate-500 block">Ingreso Mensual</span>
                        <strong className="text-base font-black text-slate-900">
                          ${Number(calc.monthlyIncome ?? s3.monthlyIncome ?? 0).toLocaleString('es-MX')}
                        </strong>
                        <span className="text-[10px] text-slate-500 block">
                          Anual: ${Number(calc.annualIncome || 0).toLocaleString('es-MX')}
                        </span>
                      </div>
                      <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200">
                        <span className="text-[11px] text-slate-500 block">Patrimonio Neto Hoy</span>
                        <strong className="text-base font-black text-emerald-700">
                          ${Number(calc.netWorth || 0).toLocaleString('es-MX')}
                        </strong>
                        <span className="text-[10px] text-slate-500 block">
                          Cubre {calc.magicNumberRatioPct || 0}% de su meta
                        </span>
                      </div>
                      <div className="bg-indigo-50 rounded-2xl p-3.5 border border-indigo-200">
                        <span className="text-[11px] text-indigo-700 block">
                          Número Mágico ({calc.magicNumberMultiplier || 0}x)
                        </span>
                        <strong className="text-base font-black text-indigo-950">
                          ${Number(calc.magicNumber || 0).toLocaleString('es-MX')}
                        </strong>
                        <span className="text-[10px] text-indigo-700 block">
                          Brecha: ${Number(calc.magicNumberGap || 0).toLocaleString('es-MX')}
                        </span>
                      </div>
                      <div className="bg-rose-50 rounded-2xl p-3.5 border border-rose-200">
                        <span className="text-[11px] text-rose-700 block">Capital Humano Total</span>
                        <strong className="text-base font-black text-rose-950">
                          ${Number(calc.humanCapitalValue || 0).toLocaleString('es-MX')}
                        </strong>
                        <span className="text-[10px] text-rose-700 block">
                          Ingresos futuros por proteger
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* SECCIÓN 3: ACTIVOS Y DEUDAS CAPTURADAS (PASO 2) */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-indigo-900 border-l-4 border-indigo-600 pl-2.5">
                        3. Radiografía Detallada de Activos y Deudas (Paso 2)
                      </h4>
                      <span className="text-xs font-bold text-slate-600">
                        Tasa Integrada: <strong>{calc.integratedReturnRatePct}% anual</strong> ·
                        Diversificación: <strong>{calc.diversificationScore}/100</strong> · Semáforo:{' '}
                        <strong>{calc.patrimonySemaphore}</strong>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between font-bold text-slate-800 border-b border-slate-200 pb-1.5">
                          <span>Activos Declarados ({assets.length})</span>
                          <span className="text-emerald-700">
                            Total: ${Number(calc.totalAssets || 0).toLocaleString('es-MX')}
                          </span>
                        </div>
                        {assets.length === 0 ? (
                          <p className="text-slate-400">No registró activos detallados.</p>
                        ) : (
                          <div className="space-y-1.5">
                            {assets.map((a, idx) => (
                              <div
                                key={a.id || idx}
                                className="flex items-center justify-between bg-white p-2 rounded-xl border border-slate-200"
                              >
                                <div>
                                  <span className="font-bold text-slate-900 block">
                                    {ASSET_CATEGORY_LABELS[a.category] || a.category}
                                  </span>
                                  <span className="text-[11px] text-slate-500">
                                    {a.description || 'Sin descripción'} · Liquidez:{' '}
                                    {a.liquidity || 'MEDIA'}
                                  </span>
                                </div>
                                <div className="text-right">
                                  <strong className="text-slate-900 block">
                                    ${Number(a.value || 0).toLocaleString('es-MX')}
                                  </strong>
                                  <span className="text-[10px] text-indigo-600 font-bold">
                                    {a.annualRatePct ?? 0}% anual
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between font-bold text-slate-800 border-b border-slate-200 pb-1.5">
                          <span>Deudas Declaradas ({debts.length})</span>
                          <span className="text-rose-700">
                            Total: ${Number(calc.totalDebts || 0).toLocaleString('es-MX')}
                          </span>
                        </div>
                        {debts.length === 0 ? (
                          <p className="text-slate-400">Sin deudas registradas.</p>
                        ) : (
                          <div className="space-y-1.5">
                            {debts.map((d, idx) => (
                              <div
                                key={d.id || idx}
                                className="flex items-center justify-between bg-white p-2 rounded-xl border border-slate-200"
                              >
                                <div>
                                  <span
                                    className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                                      d.type === 'BUENA'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : 'bg-rose-100 text-rose-800'
                                    }`}
                                  >
                                    Deuda {d.type === 'BUENA' ? 'Buena (Patrimonial)' : 'Mala (Consumo/TDC)'}
                                  </span>
                                  <span className="font-semibold text-slate-800 block mt-0.5">
                                    {d.description || 'Sin descripción'}
                                  </span>
                                </div>
                                <div className="text-right">
                                  <strong className="text-slate-900 block">
                                    ${Number(d.balance || 0).toLocaleString('es-MX')}
                                  </strong>
                                  <span className="text-[10px] text-rose-600 font-bold">
                                    CAT: {d.annualCatPct ?? 0}%
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* SECCIÓN 4: JUBILACIÓN, AFORE, PPR Y CINTA MÉTRICA (PASO 4) */}
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-indigo-900 border-l-4 border-indigo-600 pl-2.5">
                      4. Jubilación, Régimen IMSS / Afore / PPR y Cinta Métrica (Paso 4)
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                        <span className="text-[11px] text-slate-500 block">Edad Deseada Retiro</span>
                        <strong className="text-sm font-black text-slate-900">
                          {s4.desiredRetirementAge || calc.tapeMeasure?.desiredRetirementAge || 65}{' '}
                          años
                        </strong>
                        <span className="text-[10px] text-slate-500 block">
                          Quedan {calc.tapeMeasure?.productiveYearsLeft ?? '—'} años productivos
                        </span>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                        <span className="text-[11px] text-slate-500 block">
                          Pensión Mensual Deseada ({s4.desiredPensionPct || 80}%)
                        </span>
                        <strong className="text-sm font-black text-slate-900">
                          ${Number(calc.desiredMonthlyPension || 0).toLocaleString('es-MX')}/mes
                        </strong>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                        <span className="text-[11px] text-slate-500 block">Régimen y Afore</span>
                        <strong className="text-xs font-black text-slate-900 block">
                          {IMSS_REGIME_LABELS[s4.imssRegime] || s4.imssRegime || 'No especificado'}
                        </strong>
                        <span className="text-[11px] text-indigo-700 font-bold block mt-0.5">
                          Afore: ${Number(s4.aforeBalance || 0).toLocaleString('es-MX')}
                        </span>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                        <span className="text-[11px] text-slate-500 block">¿Cuenta con PPR?</span>
                        <strong className="text-sm font-black text-slate-900">
                          {s4.hasPpr ? 'Sí tiene PPR' : 'No tiene PPR'}
                        </strong>
                        <span className="text-[10px] text-slate-500 block">
                          Saldo: ${Number(s4.pprBalance || 0).toLocaleString('es-MX')} · Aporta: $
                          {Number(s4.pprMonthlyContribution || 0).toLocaleString('es-MX')}/mes
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                        <span className="text-slate-500 block">Capital Requerido al Retiro</span>
                        <strong className="text-slate-900 text-sm">
                          ${Number(calc.retirementCapitalRequired || 0).toLocaleString('es-MX')}
                        </strong>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                        <span className="text-slate-500 block">Capital Proyectado Actual</span>
                        <strong className="text-slate-900 text-sm">
                          ${Number(calc.retirementCapitalProjected || 0).toLocaleString('es-MX')}
                        </strong>
                      </div>
                      <div className="bg-amber-50 rounded-xl p-3 border border-amber-200">
                        <span className="text-amber-800 block">
                          Brecha de Jubilación / PMT Necesario
                        </span>
                        <strong className="text-amber-950 text-sm">
                          ${Number(calc.retirementGap || 0).toLocaleString('es-MX')}
                        </strong>
                        <span className="text-[10px] text-amber-800 font-bold block">
                          Requiere ahorrar: $
                          {Number(calc.retirementMonthlySavingsNeeded || 0).toLocaleString('es-MX')}
                          /mes
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* SECCIÓN 5: SUEÑOS Y REGLA DE AHORRO 16% (PASOS 5 Y 6) */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-indigo-900 border-l-4 border-indigo-600 pl-2.5">
                        5. Mapa de Sueños y Regla de Ahorro (Pasos 5 y 6)
                      </h4>
                      <span className="text-xs font-bold bg-indigo-50 text-indigo-900 px-3 py-1 rounded-xl border border-indigo-200">
                        Ahorro Mensual Elegido: <strong>{calc.selectedSavingsPct}%</strong> ($
                        {Number(calc.selectedMonthlySavings || 0).toLocaleString('es-MX')}/mes) ·
                        Ideal 16%: $
                        {Number(calc.recommendedMonthlySavings || 0).toLocaleString('es-MX')}/mes
                      </span>
                    </div>

                    {dreams.length === 0 ? (
                      <p className="text-xs text-slate-400">No capturó sueños en el Paso 5.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                        {dreams.map((dr, idx) => (
                          <div
                            key={dr.id || idx}
                            className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex items-center justify-between gap-2"
                          >
                            <div>
                              <span className="text-[10px] font-extrabold uppercase text-indigo-600">
                                Prioridad #{dr.priority || idx + 1} ·{' '}
                                {DREAM_CATEGORY_LABELS[dr.category] || dr.category}
                              </span>
                              <strong className="text-slate-900 block text-sm">{dr.name}</strong>
                              <span className="text-[11px] text-slate-500">
                                Meta: ${Number(dr.targetAmount || 0).toLocaleString('es-MX')} en{' '}
                                {dr.yearsToGoal} años
                              </span>
                            </div>
                            <div className="text-right shrink-0">
                              <strong className="text-indigo-950 block">
                                PMT: ${Number(dr.monthlyPmtRequired || 0).toLocaleString('es-MX')}/mes
                              </strong>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-1 ${
                                  dr.reachableWithCurrentSavings
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {dr.reachableWithCurrentSavings
                                  ? '✓ Alcanzable hoy'
                                  : `Faltan $${Number(dr.shortfallMonthly || 0).toLocaleString('es-MX')}/mes`}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* SECCIÓN 6: RESPUESTAS DE SEGUROS ACTUALES (PASO 7) */}
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-indigo-900 border-l-4 border-indigo-600 pl-2.5">
                      6. Seguros Actuales Declarados por el Prospecto (Paso 7)
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
                      <div
                        className={`rounded-xl p-3 border ${
                          s7.hasLifeInsurance
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                            : 'bg-rose-50 border-rose-200 text-rose-950'
                        }`}
                      >
                        <span className="text-[10px] uppercase font-bold block opacity-75">
                          Seguro de Vida
                        </span>
                        <strong className="text-sm font-black block">
                          {s7.hasLifeInsurance ? 'SÍ TIENE' : 'NO TIENE'}
                        </strong>
                        {s7.hasLifeInsurance && (
                          <span className="text-[10px] font-semibold block mt-0.5">
                            SA: ${Number(calc.currentLifeSum || 0).toLocaleString('es-MX')} (
                            {lifePolicy?.perceptionScore || 3}★)
                          </span>
                        )}
                      </div>
                      <div
                        className={`rounded-xl p-3 border ${
                          s7.hasDisabilityInsurance
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                            : 'bg-rose-50 border-rose-200 text-rose-950'
                        }`}
                      >
                        <span className="text-[10px] uppercase font-bold block opacity-75">
                          Invalidez Total
                        </span>
                        <strong className="text-sm font-black block">
                          {s7.hasDisabilityInsurance ? 'SÍ TIENE' : 'NO TIENE'}
                        </strong>
                      </div>
                      <div
                        className={`rounded-xl p-3 border ${
                          s7.hasGmm
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                            : 'bg-rose-50 border-rose-200 text-rose-950'
                        }`}
                      >
                        <span className="text-[10px] uppercase font-bold block opacity-75">
                          Gastos Médicos (GMM)
                        </span>
                        <strong className="text-sm font-black block">
                          {s7.hasGmm ? 'SÍ TIENE' : 'NO TIENE'}
                        </strong>
                      </div>
                      <div
                        className={`rounded-xl p-3 border ${
                          s7.hasAutoInsurance
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                            : 'bg-amber-50 border-amber-200 text-amber-950'
                        }`}
                      >
                        <span className="text-[10px] uppercase font-bold block opacity-75">
                          Seguro de Auto
                        </span>
                        <strong className="text-sm font-black block">
                          {s7.hasAutoInsurance ? 'SÍ TIENE' : 'NO TIENE'}
                        </strong>
                      </div>
                      <div
                        className={`rounded-xl p-3 border ${
                          s7.hasHomeInsurance
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                            : 'bg-amber-50 border-amber-200 text-amber-950'
                        }`}
                      >
                        <span className="text-[10px] uppercase font-bold block opacity-75">
                          Seguro de Hogar
                        </span>
                        <strong className="text-sm font-black block">
                          {s7.hasHomeInsurance ? 'SÍ TIENE' : 'NO TIENE'}
                        </strong>
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-600 bg-slate-50 rounded-xl px-3.5 py-2 border border-slate-200">
                      💡 <strong>Suma Asegurada en Vida Recomendada para su familia:</strong> Mínimo
                      (7x sueldo anual):{' '}
                      <strong>${Number(calc.recommendedLifeSumMin || 0).toLocaleString('es-MX')}</strong>{' '}
                      · Ideal (10x sueldo anual):{' '}
                      <strong>${Number(calc.recommendedLifeSumIdeal || 0).toLocaleString('es-MX')}</strong>
                    </div>
                  </div>

                  {/* SECCIÓN 7: OPORTUNIDADES DE VENTA DETECTADAS (PASO 8) */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-indigo-900 border-l-4 border-indigo-600 pl-2.5">
                      7. Argumentario Comercial: Huecos de Protección Detectados
                    </h4>
                    {gaps.length === 0 ? (
                      <p className="text-xs text-slate-500">
                        Aún no se detectan huecos o el participante no ha llegado al paso de seguros.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {gaps.map((gap: any) => (
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

                  {activeParticipant.linkedClient?.policies?.length > 0 && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-2">
                      <h4 className="text-xs font-bold text-emerald-950">
                        ✓ Pólizas Vigentes Cruzadas en Cartera aacomsoft
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {activeParticipant.linkedClient.policies.map((pol: any) => (
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
                </>
              ) : (
                <p className="text-xs text-slate-500">
                  Este asistente aún se encuentra en la sala de espera.
                </p>
              )}
            </div>
          </div>
        );
      })()}

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
