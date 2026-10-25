"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
    Sparkles,
    Smartphone,
    Monitor,
    CheckCircle2,
    AlertTriangle,
    ArrowRight,
    Wallet,
    ClipboardCheck,
    Bot,
    Home,
    Menu,
    Phone,
    MessageCircle,
    FileText,
    ShieldAlert,
    TrendingUp,
    Layers,
    Palette,
    Type,
    LayoutGrid,
    Copy,
    Check,
    ChevronRight,
    Plus,
    Minus,
    Award,
    Search,
    Bell
} from "lucide-react";

type ViewMode = "proposal" | "current";
type DeviceMode = "mobile" | "desktop";
type ScreenTab = "home" | "cartera" | "activity";

const DIAGNOSTIC_FINDINGS = [
    {
        id: "nav-mobile",
        severity: "Crítico en iOS / Android",
        category: "Ergonomía Móvil y Pulgar",
        title: "Menú Hamburguesa de +22 enlaces vs. Barra Inferior Nativa (Bottom Tab Bar)",
        fileRef: "src/app/(dashboard)/layout.tsx & src/components/MobileNavigation.tsx",
        currentIssue:
            "En iPhone y Android, toda la navegación exige estirar el pulgar hasta la esquina superior izquierda para abrir un cajón lateral con más de 22 opciones verticales. No existe barra inferior fija (Bottom Navigation) ni soporte para env(safe-area-inset-bottom) en modo PWA.",
        stitchProposal:
            "Implementar un Bottom Tab Bar fijo de 5 accesos clave (Inicio, 25 Puntos, Cartera, Copiloto IA y Menú Más) en la zona natural del pulgar (< 768px), con objetivos táctiles de 48×48px y respeto al Home Indicator de iOS."
    },
    {
        id: "double-padding",
        severity: "Alto en Móvil (375px–393px)",
        category: "Aprovechamiento de Pantalla",
        title: "Doble Padding Anidado que comprime 64px de ancho útil en celulares",
        fileRef: "src/app/(dashboard)/layout.tsx (#L863) + src/app/(dashboard)/cartera/page.tsx (#L125)",
        currentIssue:
            "El layout principal aplica p-4 md:p-8 en <main> y los módulos internos (como Cartera, PEA, Admin) vuelven a envolver su contenido en otro div con p-4 md:p-8. En un iPhone de 375px de ancho se pierden 64px solo en márgenes laterales vacíos.",
        stitchProposal:
            "Regla de Contenedor Único (Single-Gutter Rule): mantener exactamente 16px (px-4) en móvil y 32px (px-8) en escritorio desde el layout central, ganando +18% de espacio horizontal para tarjetas y tablas."
    },
    {
        id: "rainbow-header",
        severity: "Medio-Alto (Jerarquía Visual)",
        category: "Calibración de Color (Stitch Taste)",
        title: "Efecto 'Arcoíris' en Barra Superior y Gradiente Pesado en Header",
        fileRef: "src/app/(dashboard)/layout.tsx (#L203–L515)",
        currentIssue:
            "El header superior combina un gradiente denso (bg-gradient-to-l from-primary) con íconos de 9 colores distintos al mismo tiempo (amber, teal, indigo, green, emerald, pink, orange, rose, purple). Cuando todo tiene color de alerta, nada destaca.",
        stitchProposal:
            "Superficie translúcida tipo cristal (bg-white/85 backdrop-blur-md border-b border-slate-200/80), íconos monocromáticos en reposo (slate-500) y un único color de acento activo (--primary / Teal-600) reservando verde/ámbar/rojo exclusivamente para semáforos reales de cobranza."
    },
    {
        id: "typography-tabular",
        severity: "Medio (Claridad Financiera)",
        category: "Arquitectura Tipográfica",
        title: "Fuente principal desactivada y cifras financieras sin alineación tabular",
        fileRef: "src/app/layout.tsx (#L2, #L10)",
        currentIssue:
            "La carga de fuente está comentada en src/app/layout.tsx, cayendo en fuentes genéricas distintas según el dispositivo, y las primas ($MXN), fechas de renovación y puntos no usan tabular-nums, dificultando escanear columnas rápido.",
        stitchProposal:
            "Tipografía geométrica ejecutiva (Plus Jakarta Sans / Geist) para encabezados con tracking-tight, combinada con numeración monoespaciada tabular (tabular-nums) obligatoria en primas, sumas aseguradas, recibos y rankings."
    },
    {
        id: "ios-safari-dvh",
        severity: "Alto en iPhone Safari / PWA",
        category: "Estabilidad de Viewport Móvil",
        title: "Uso de 100vh en vez de 100dvh y zoom involuntario en inputs (< 16px)",
        fileRef: "src/app/(dashboard)/layout.tsx (#L863) & componentes de formulario",
        currentIssue:
            "En iOS Safari, 100vh ignora la barra dinámica del navegador provocando saltos de scroll. Además, los inputs con clase text-xs o text-sm (< 16px) provocan que iPhone haga auto-zoom forzado al tocar un campo de búsqueda o captura.",
        stitchProposal:
            "Estandarizar min-h-dvh en toda la estructura y aplicar text-base md:text-sm (16px en móvil, 14px en PC) en todos los campos Input, Select y Textarea para eliminar por completo el zoom brusco en iOS."
    },
    {
        id: "table-to-cards",
        severity: "Alto en Operación de Campo",
        category: "Diseño Adaptativo de Datos",
        title: "Tablas anchas con scroll horizontal en lugar de Tarjetas de Acción Táctil",
        fileRef: "src/app/(dashboard)/cartera & src/app/(dashboard)/proyecto-200",
        currentIssue:
            "Cuando el agente consulta su cartera o prospectos desde el celular entre citas, las tablas de múltiples columnas obligan a hacer scroll horizontal para ver el botón de acción o el estatus del recibo.",
        stitchProposal:
            "Vista Dual Responsiva: Tabla de alta densidad en PC (>= 768px) que se transforma automáticamente en Tarjetas Ejecutivas de Póliza en móvil (< 768px) con botones directos de WhatsApp y Llamada de 1 toque."
    }
];

const STITCH_PROMPTS = [
    {
        title: "Prompt 1: Dashboard & Mobile Bottom Navigation Shell (iOS / Android + PC)",
        prompt: `An executive InsurTech SaaS dashboard and navigation shell for insurance agents (AACOMSOFT), designed for both mobile PWA (iOS/Android) and desktop web.

DESIGN SYSTEM (REQUIRED):
- Platform: Responsive WebApp (Mobile-first iOS/Android + Desktop Bento Grid)
- Theme: Light mode, Executive Fintech Precision, airy and trustworthy
- Background Canvas: Alabaster Slate (#F8FAFC)
- Elevated Surface: Pure White (#FFFFFF) with 1px Whisper Border (#E2E8F0) and subtle rounded corners (16px)
- Primary Brand Accent: Deep Emerald Teal (#0D9488) used strictly for primary CTAs, active tab indicator, and progress rings
- Text Primary: Deep Slate Ink (#0F172A), Text Secondary: Muted Graphite (#475569)
- Typography: Plus Jakarta Sans for headings (tight tracking), tabular monospace numerals for all currency ($MXN) and point counters

Page Structure:
1. Top Header: Translucent glass bar with agency logo on the left, compact XP/Streak pill badge and user avatar on the right (no heavy background gradients, monochrome icons).
2. Asymmetric Bento Hero: Daily "25 Points" progress ring on the left (18/25 pts completed) paired with 2 urgent renewal alerts on the right.
3. Quick Action Dock: 4 tactile action cards (Registrar Actividad, Subir Póliza PDF con IA, Simulador de Voz, Copiloto IA).
4. Mobile Bottom Tab Bar (visible on <768px): 5 thumb-friendly tabs (Inicio, 25 Pts, Cartera, Asistente IA, Más) with iOS safe-area bottom padding.`
    },
    {
        title: "Prompt 2: Mi Cartera & Renovaciones (Mobile Action Cards + Desktop Tabular View)",
        prompt: `A high-clarity insurance portfolio and renewal management screen for AACOMSOFT agents on mobile (iOS/Android) and desktop.

DESIGN SYSTEM (REQUIRED):
- Canvas: Alabaster Slate (#F8FAFC), Cards: Pure White (#FFFFFF) with 16px radius and 1px border (#E2E8F0)
- Semantic Status Badges: Emerald (#059669 on #ECFDF5) for Vigente, Amber (#D97706 on #FFFBEB) for Por Renovar, Rose (#E11D48 on #FFF1F2) for En Período de Gracia
- Numerals: Strict tabular-nums alignment for policy numbers, renewal dates, and MXN annual premiums

Page Structure:
1. KPI Strip: 3 clean metric cards (Prima Anual Activa $4,280,500 MXN, Pólizas en Riesgo / Gracia: 3, Conservación: 94.2%).
2. Search & Filter Bar: 16px mobile-safe search input with segmented pill filters (Todas, En Gracia, Próximas a Renovar, Vida, GMM).
3. Responsive Policy List: On desktop, a clean high-density table; on mobile, stacked tactile Policy Cards showing Client Name, Insurer Badge (GNP / AXA / Seguros Monterrey), Annual Premium, Renewal Countdown, and one-tap WhatsApp reminder button.`
    }
];

export default function StitchDiagnosticoPage() {
    const [viewMode, setViewMode] = useState<ViewMode>("proposal");
    const [deviceMode, setDeviceMode] = useState<DeviceMode>("mobile");
    const [screenTab, setScreenTab] = useState<ScreenTab>("home");
    const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
    const [demoPoints, setDemoPoints] = useState(19);

    const copyPrompt = async (text: string, idx: number) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedIdx(idx);
            setTimeout(() => setCopiedIdx(null), 2200);
        } catch {
            // ignore
        }
    };

    return (
        <div className="min-h-dvh bg-[#F8FAFC] text-slate-900 font-sans selection:bg-teal-600 selection:text-white pb-20">
            {/* TOP STICKY BAR */}
            <header className="sticky top-0 z-50 bg-white/85 backdrop-blur-md border-b border-slate-200/80 px-4 md:px-8 h-16 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs shrink-0">
                        <Sparkles className="h-4.5 w-4.5" />
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="text-sm md:text-base font-extrabold tracking-tight text-slate-900 truncate">
                                AACOM · Diagnóstico y Propuesta Google Stitch
                            </span>
                            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200/80">
                                Rama aislada · 100% Visual
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">
                            Auditoría UI/UX para iOS, Android y PC sin interferir con la operación en producción
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 transition-colors"
                    >
                        <span>Ir a la App actual</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 md:px-8 pt-6 md:pt-10 space-y-12">
                {/* 1. HERO SUMMARY & DESIGN PHILOSOPHY */}
                <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                    <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-6 md:p-8 shadow-xs flex flex-col justify-between space-y-6">
                        <div className="space-y-3">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                                <Layers className="h-3.5 w-3.5 text-teal-600" />
                                Metodología Oficial Google Labs Stitch (`design-md` + `taste-design`)
                            </div>
                            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-slate-900 leading-tight">
                                Evolución Visual hacia una experiencia{" "}
                                <span className="text-teal-600">Fintech Ejecutiva</span> en iOS, Android y PC.
                            </h1>
                            <p className="text-sm md:text-base text-slate-600 leading-relaxed max-w-2xl">
                                AACOM ya tiene una potencia funcional enorme (Cartera, IA, Simulador de Voz, ADN, Proyecto 200, E-Learning). El siguiente paso visual no es cambiar cómo funciona, sino <strong>eliminar la fricción táctil en celulares</strong> y <strong>ordenar la jerarquía visual</strong> para que se sienta como una app nativa de primer nivel.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                            <div className="rounded-xl bg-slate-50 border border-slate-200/70 p-3.5">
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                    <Smartphone className="h-4 w-4 text-teal-600" />
                                    iOS & Android Primero
                                </div>
                                <p className="mt-1 text-sm font-extrabold text-slate-900">
                                    Barra inferior de pulgar + 0 zoom forzado
                                </p>
                            </div>
                            <div className="rounded-xl bg-slate-50 border border-slate-200/70 p-3.5">
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                    <Palette className="h-4 w-4 text-teal-600" />
                                    Calibración de Color
                                </div>
                                <p className="mt-1 text-sm font-extrabold text-slate-900">
                                    1 acento activo · Adiós al efecto arcoíris
                                </p>
                            </div>
                            <div className="rounded-xl bg-slate-50 border border-slate-200/70 p-3.5">
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                    <Type className="h-4 w-4 text-teal-600" />
                                    Precisión Financiera
                                </div>
                                <p className="mt-1 text-sm font-extrabold text-slate-900">
                                    Cifras `tabular-nums` + +18% ancho útil
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* SCORE & QUICK METRICS CARD */}
                    <div className="lg:col-span-5 bg-slate-900 text-white rounded-2xl p-6 md:p-8 flex flex-col justify-between space-y-6">
                        <div className="space-y-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-teal-400">
                                Resultado de la Auditoría Visual
                            </span>
                            <h2 className="text-xl font-extrabold tracking-tight">
                                Impacto estimado al aplicar el sistema Stitch
                            </h2>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Evaluado bajo las métricas de ergonomía táctil móvil (Apple HIG / Material 3) y densidad de información en escritorio.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-xs font-bold mb-1.5">
                                    <span className="text-slate-300">Ergonomía a una mano (iOS / Android)</span>
                                    <span className="text-teal-400 font-mono tabular-nums">62% → 96%</span>
                                </div>
                                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                                    <div className="h-full bg-teal-400 rounded-full w-[96%]" />
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between text-xs font-bold mb-1.5">
                                    <span className="text-slate-300">Espacio horizontal aprovechado en móvil</span>
                                    <span className="text-teal-400 font-mono tabular-nums">78% → 94% (+18% área)</span>
                                </div>
                                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                                    <div className="h-full bg-teal-400 rounded-full w-[94%]" />
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between text-xs font-bold mb-1.5">
                                    <span className="text-slate-300">Limpieza cromática y contraste de lectura</span>
                                    <span className="text-teal-400 font-mono tabular-nums">70% → 98%</span>
                                </div>
                                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                                    <div className="h-full bg-teal-400 rounded-full w-[98%]" />
                                </div>
                            </div>
                        </div>

                        <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                            <span>Archivo maestro incluido en esta rama:</span>
                            <code className="px-2 py-1 rounded bg-slate-800 text-teal-300 font-mono">
                                /DESIGN.md
                            </code>
                        </div>
                    </div>
                </section>

                {/* 2. INTERACTIVE LIVE SIMULATOR: ANTES VS PROPUESTA STITCH */}
                <section className="space-y-5">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="h-2.5 w-2.5 rounded-full bg-teal-600" />
                                <h2 className="text-lg sm:text-xl font-black tracking-tight text-slate-900">
                                    Simulador Visual Interactivo: Actual vs. Propuesta Stitch
                                </h2>
                            </div>
                            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                                Alterna entre el diseño actual y la propuesta Stitch en vista Celular (iOS/Android) o PC:
                            </p>
                        </div>

                        {/* CONTROLS */}
                        <div className="flex flex-wrap items-center gap-2.5">
                            {/* View Mode Toggle */}
                            <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200/80">
                                <button
                                    type="button"
                                    onClick={() => setViewMode("current")}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                        viewMode === "current"
                                            ? "bg-white text-amber-700 shadow-xs"
                                            : "text-slate-600 hover:text-slate-900"
                                    }`}
                                >
                                    Diagnóstico Actual
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setViewMode("proposal")}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                        viewMode === "proposal"
                                            ? "bg-teal-600 text-white shadow-xs"
                                            : "text-slate-600 hover:text-slate-900"
                                    }`}
                                >
                                    ✨ Propuesta Stitch
                                </button>
                            </div>

                            {/* Device Toggle */}
                            <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200/80">
                                <button
                                    type="button"
                                    onClick={() => setDeviceMode("mobile")}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                        deviceMode === "mobile"
                                            ? "bg-white text-slate-900 shadow-xs"
                                            : "text-slate-600 hover:text-slate-900"
                                    }`}
                                >
                                    <Smartphone className="h-3.5 w-3.5" />
                                    iOS / Android
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setDeviceMode("desktop")}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                        deviceMode === "desktop"
                                            ? "bg-white text-slate-900 shadow-xs"
                                            : "text-slate-600 hover:text-slate-900"
                                    }`}
                                >
                                    <Monitor className="h-3.5 w-3.5" />
                                    PC / Escritorio
                                </button>
                            </div>

                            {/* Screen Selector */}
                            <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200/80">
                                <button
                                    type="button"
                                    onClick={() => setScreenTab("home")}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                        screenTab === "home"
                                            ? "bg-white text-slate-900 shadow-xs"
                                            : "text-slate-600 hover:text-slate-900"
                                    }`}
                                >
                                    1. Inicio & Menú
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setScreenTab("cartera")}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                        screenTab === "cartera"
                                            ? "bg-white text-slate-900 shadow-xs"
                                            : "text-slate-600 hover:text-slate-900"
                                    }`}
                                >
                                    2. Mi Cartera
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setScreenTab("activity")}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                        screenTab === "activity"
                                            ? "bg-white text-slate-900 shadow-xs"
                                            : "text-slate-600 hover:text-slate-900"
                                    }`}
                                >
                                    3. 25 Puntos
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* SIMULATOR STAGE */}
                    <div className="bg-slate-200/60 border border-slate-300/80 rounded-3xl p-3 sm:p-6 md:p-8 flex flex-col items-center justify-center">
                        {/* Annotation Banner above preview */}
                        <div className="max-w-3xl w-full mb-4">
                            {viewMode === "current" ? (
                                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 flex items-center gap-2.5 text-xs text-amber-900">
                                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                                    <span>
                                        <strong>Vista Actual:</strong> Observa el gradiente superior pesado, los íconos de múltiples colores, la ausencia de barra inferior en celular y el doble margen lateral que reduce el ancho útil.
                                    </span>
                                </div>
                            ) : (
                                <div className="bg-teal-50 border border-teal-200 rounded-xl px-4 py-2.5 flex items-center gap-2.5 text-xs text-teal-900">
                                    <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0" />
                                    <span>
                                        <strong>Propuesta Google Stitch:</strong> Header limpio tipo cristal, un solo acento semántico (`Teal-600`), números `tabular-nums`, margen único aprovechando el 94% del ancho en móvil y <strong>Bottom Tab Bar nativo</strong> para el pulgar en iOS y Android.
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* DEVICE FRAME */}
                        <div
                            className={`transition-all duration-300 bg-[#F8FAFC] border shadow-xl overflow-hidden flex flex-col ${
                                deviceMode === "mobile"
                                    ? "w-full max-w-[393px] rounded-[40px] border-[8px] border-slate-900 min-h-[720px]"
                                    : "w-full max-w-5xl rounded-2xl border-slate-300 min-h-[600px]"
                            }`}
                        >
                            {/* iOS Status Bar when in mobile frame */}
                            {deviceMode === "mobile" && (
                                <div className="bg-white px-6 pt-2 pb-1 flex items-center justify-between text-[11px] font-bold text-slate-900 select-none">
                                    <span className="font-mono">9:41</span>
                                    <div className="h-4 w-24 rounded-full bg-slate-900" />
                                    <span className="font-mono text-[10px]">5G · 100%</span>
                                </div>
                            )}

                            {/* SIMULATED APP HEADER */}
                            {viewMode === "current" ? (
                                /* CURRENT HEADER WITH HEAVY GRADIENT & RAINBOW ICONS */
                                <div className="h-14 px-3 md:px-5 border-b bg-gradient-to-l from-slate-800 from-[15%] via-slate-800/40 to-white flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        {deviceMode === "mobile" ? (
                                            <div className="h-9 w-9 rounded-lg border border-slate-300 bg-white flex items-center justify-center">
                                                <Menu className="h-4 w-4 text-slate-700" />
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-4 text-xs font-semibold">
                                                <span className="font-black text-slate-900">AACOM</span>
                                                <span className="flex items-center gap-1 text-slate-600">
                                                    <ClipboardCheck className="h-3.5 w-3.5 text-teal-600" /> 25 puntos
                                                </span>
                                                <span className="flex items-center gap-1 text-slate-600">
                                                    <Wallet className="h-3.5 w-3.5 text-green-600" /> Mi Cartera
                                                </span>
                                                <span className="flex items-center gap-1 text-slate-600">
                                                    <Award className="h-3.5 w-3.5 text-amber-500" /> Ranking
                                                </span>
                                                <span className="flex items-center gap-1 text-slate-600">
                                                    <Sparkles className="h-3.5 w-3.5 text-pink-500" /> Herramientas
                                                </span>
                                                <span className="flex items-center gap-1 text-slate-600">
                                                    <Bot className="h-3.5 w-3.5 text-indigo-500" /> IA Avanzada
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="px-2 py-0.5 rounded-full bg-amber-400/90 text-slate-950 text-[10px] font-black">
                                            Nv. 4 · 1,450 XP
                                        </span>
                                        <div className="h-8 w-8 rounded-full bg-white border border-slate-300 flex items-center justify-center text-xs font-bold text-slate-800">
                                            EA
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* STITCH PROPOSAL HEADER: CLEAN GLASS, MONOCHROME + SINGLE ACCENT */
                                <div className="h-14 px-4 md:px-6 border-b border-slate-200/80 bg-white/90 backdrop-blur-md flex items-center justify-between">
                                    <div className="flex items-center gap-6">
                                        <div className="flex items-center gap-2">
                                            <div className="h-7 w-7 rounded-lg bg-teal-600 text-white font-black text-xs flex items-center justify-center">
                                                A
                                            </div>
                                            <span className="font-extrabold text-sm tracking-tight text-slate-900">
                                                AACOM
                                            </span>
                                        </div>

                                        {deviceMode === "desktop" && (
                                            <nav className="flex items-center gap-1">
                                                {[
                                                    { id: "home", label: "Inicio", icon: Home },
                                                    { id: "activity", label: "25 Puntos", icon: ClipboardCheck },
                                                    { id: "cartera", label: "Mi Cartera", icon: Wallet }
                                                ].map((item) => {
                                                    const Icon = item.icon;
                                                    const active = screenTab === item.id;
                                                    return (
                                                        <button
                                                            key={item.id}
                                                            type="button"
                                                            onClick={() => setScreenTab(item.id as ScreenTab)}
                                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                                                                active
                                                                    ? "bg-teal-50 text-teal-700"
                                                                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                                                            }`}
                                                        >
                                                            <Icon
                                                                className={`h-3.5 w-3.5 ${
                                                                    active ? "text-teal-600" : "text-slate-400"
                                                                }`}
                                                            />
                                                            {item.label}
                                                        </button>
                                                    );
                                                })}
                                            </nav>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2.5">
                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200/80 text-[11px] font-bold text-slate-700 font-mono tabular-nums">
                                            <span className="h-1.5 w-1.5 rounded-full bg-teal-600" />
                                            <span>1,450 XP</span>
                                        </div>
                                        <button
                                            type="button"
                                            className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-600"
                                            aria-label="Notificaciones"
                                        >
                                            <Bell className="h-3.5 w-3.5" />
                                        </button>
                                        <div className="h-8 w-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold">
                                            EA
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* SIMULATED MAIN BODY */}
                            <div
                                className={`flex-1 overflow-y-auto ${
                                    viewMode === "current"
                                        ? deviceMode === "mobile"
                                            ? "p-7 bg-white" // Simulates the double p-4 + p-4 nested padding in current app
                                            : "p-10 bg-white"
                                        : deviceMode === "mobile"
                                        ? "p-4 bg-[#F8FAFC]" // Single 16px gutter in Stitch proposal
                                        : "p-6 md:p-8 bg-[#F8FAFC]"
                                }`}
                            >
                                {viewMode === "current" && deviceMode === "mobile" && (
                                    <div className="mb-3 rounded-lg border border-dashed border-amber-400 bg-amber-50/70 px-2.5 py-1.5 text-[10px] font-bold text-amber-800 text-center">
                                        ← Doble padding lateral actual (p-4 + p-4 = 32px por lado perdidos) →
                                    </div>
                                )}

                                {/* TAB 1: HOME / DASHBOARD */}
                                {screenTab === "home" && (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="text-lg font-black tracking-tight text-slate-900">
                                                    Hola, Enrique
                                                </h3>
                                                <p className="text-xs text-slate-500">
                                                    Resumen operativo de tu promotoría hoy
                                                </p>
                                            </div>
                                            {viewMode === "proposal" && (
                                                <span className="text-[11px] font-mono tabular-nums font-bold px-2.5 py-1 rounded-lg bg-white border border-slate-200/80 text-slate-700">
                                                    Meta Hoy: {demoPoints}/25 pts
                                                </span>
                                            )}
                                        </div>

                                        {/* Asymmetric Bento Grid in Proposal vs Stacked Cards in Current */}
                                        <div
                                            className={`grid gap-3.5 ${
                                                deviceMode === "desktop" ? "grid-cols-12" : "grid-cols-1"
                                            }`}
                                        >
                                            {/* Daily 25 Points Widget */}
                                            <div
                                                className={`${
                                                    deviceMode === "desktop" ? "col-span-7" : ""
                                                } bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs space-y-3`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                                        Ritmo Diario · 25 Puntos
                                                    </span>
                                                    <span className="text-xs font-extrabold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full font-mono tabular-nums">
                                                        {Math.round((demoPoints / 25) * 100)}% completado
                                                    </span>
                                                </div>
                                                <div className="flex items-baseline justify-between">
                                                    <div className="text-2xl font-black text-slate-900 font-mono tabular-nums">
                                                        {demoPoints}{" "}
                                                        <span className="text-sm font-semibold text-slate-400">
                                                            / 25 pts hoy
                                                        </span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setScreenTab("activity")}
                                                        className="text-xs font-bold text-teal-600 hover:text-teal-700 inline-flex items-center gap-1 cursor-pointer"
                                                    >
                                                        Registrar actividad <ChevronRight className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                                <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                                                    <div
                                                        className="h-full bg-teal-600 rounded-full transition-all duration-300"
                                                        style={{ width: `${Math.min(100, (demoPoints / 25) * 100)}%` }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Urgent Renewals Summary */}
                                            <div
                                                className={`${
                                                    deviceMode === "desktop" ? "col-span-5" : ""
                                                } bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex flex-col justify-between space-y-3`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                                        Cobranza y Conservación
                                                    </span>
                                                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200/70 font-mono tabular-nums">
                                                        2 por vencer
                                                    </span>
                                                </div>
                                                <div>
                                                    <div className="text-xl font-black text-slate-900 font-mono tabular-nums">
                                                        $148,500{" "}
                                                        <span className="text-xs font-semibold text-slate-400">
                                                            MXN
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-500 mt-0.5">
                                                        Prima anual en renovación esta semana
                                                    </p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setScreenTab("cartera")}
                                                    className="w-full h-9 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
                                                >
                                                    Ver pólizas por renovar
                                                </button>
                                            </div>
                                        </div>

                                        {/* Quick Access Grid */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setScreenTab("cartera")}
                                                className="bg-white hover:bg-slate-50/80 rounded-2xl border border-slate-200/80 p-3.5 text-left transition-all cursor-pointer flex items-start gap-3"
                                            >
                                                <div className="h-9 w-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                                                    <FileText className="h-4 w-4" />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-xs font-extrabold text-slate-900 truncate">
                                                        Lector PDF con IA
                                                    </div>
                                                    <div className="text-[11px] text-slate-500 truncate">
                                                        Extraer carátula en 3s
                                                    </div>
                                                </div>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setScreenTab("activity")}
                                                className="bg-white hover:bg-slate-50/80 rounded-2xl border border-slate-200/80 p-3.5 text-left transition-all cursor-pointer flex items-start gap-3"
                                            >
                                                <div className="h-9 w-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                                                    <TrendingUp className="h-4 w-4" />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-xs font-extrabold text-slate-900 truncate">
                                                        Diagnóstico ADN
                                                    </div>
                                                    <div className="text-[11px] text-slate-500 truncate">
                                                        Nuevo análisis F.O.R.D.
                                                    </div>
                                                </div>
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* TAB 2: MI CARTERA (TABLE VS MOBILE ACTION CARDS) */}
                                {screenTab === "cartera" && (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between gap-2">
                                            <div>
                                                <h3 className="text-lg font-black tracking-tight text-slate-900">
                                                    Mi Cartera
                                                </h3>
                                                <p className="text-xs text-slate-500">
                                                    Renovaciones y recibos activos
                                                </p>
                                            </div>
                                            <span className="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/70 text-xs font-bold font-mono tabular-nums">
                                                $4,280,500 MXN
                                            </span>
                                        </div>

                                        {/* Search input with 16px on mobile to prevent iOS auto-zoom */}
                                        <div className="relative">
                                            <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                            <input
                                                type="text"
                                                readOnly
                                                placeholder="Buscar cliente, póliza o aseguradora..."
                                                className="w-full h-11 pl-10 pr-4 rounded-xl bg-white border border-slate-200/90 text-base md:text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
                                            />
                                        </div>

                                        {viewMode === "current" && deviceMode === "mobile" ? (
                                            /* CURRENT MOBILE TABLE WITH HORIZONTAL SCROLL FRICTION */
                                            <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
                                                <div className="p-2 bg-amber-50 text-[10px] font-bold text-amber-800 border-b border-amber-200">
                                                    ⚠️ En la vista actual, las tablas anchas obligan a deslizar horizontalmente en celular:
                                                </div>
                                                <table className="min-w-[560px] w-full text-xs">
                                                    <thead className="bg-slate-50 text-slate-500">
                                                        <tr>
                                                            <th className="p-2.5 text-left">Cliente</th>
                                                            <th className="p-2.5 text-left">Póliza</th>
                                                            <th className="p-2.5 text-left">Aseguradora</th>
                                                            <th className="p-2.5 text-right">Prima</th>
                                                            <th className="p-2.5 text-center">Acción</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y">
                                                        <tr>
                                                            <td className="p-2.5 font-bold">Roberto Méndez</td>
                                                            <td className="p-2.5">GMM-88412</td>
                                                            <td className="p-2.5">GNP Seguros</td>
                                                            <td className="p-2.5 text-right">$64,200</td>
                                                            <td className="p-2.5 text-center">WhatsApp</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="p-2.5 font-bold"> Sofía Castellanos</td>
                                                            <td className="p-2.5">VID-10942</td>
                                                            <td className="p-2.5">Seguros Monterrey</td>
                                                            <td className="p-2.5 text-right">$84,300</td>
                                                            <td className="p-2.5 text-center">WhatsApp</td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            /* STITCH RESPONSIVE CARDS (MOBILE) OR TABULAR TABLE (DESKTOP) */
                                            <div className="space-y-2.5">
                                                {[
                                                    {
                                                        client: "Roberto Méndez Garza",
                                                        policy: "GMM-884120",
                                                        insurer: "GNP Seguros · Línea Azul",
                                                        premium: "$64,200 MXN",
                                                        status: "En Gracia (Vence en 4 días)",
                                                        statusTone:
                                                            "bg-rose-50 text-rose-700 border-rose-200/80"
                                                    },
                                                    {
                                                        client: "Sofía Castellanos Ruiz",
                                                        policy: "ORVI-109428",
                                                        insurer: "Seguros Monterrey NYL",
                                                        premium: "$84,300 MXN",
                                                        status: "Renueva 12 Nov",
                                                        statusTone:
                                                            "bg-amber-50 text-amber-700 border-amber-200/80"
                                                    },
                                                    {
                                                        client: "Grupo Industrial Del Norte",
                                                        policy: "FLOT-33910",
                                                        insurer: "Quálitas Compañía de Seguros",
                                                        premium: "$192,000 MXN",
                                                        status: "Vigente · Pagada",
                                                        statusTone:
                                                            "bg-emerald-50 text-emerald-700 border-emerald-200/80"
                                                    }
                                                ].map((item, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                                                    >
                                                        <div className="space-y-1 min-w-0">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span className="text-sm font-extrabold text-slate-900">
                                                                    {item.client}
                                                                </span>
                                                                <span
                                                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.statusTone}`}
                                                                >
                                                                    {item.status}
                                                                </span>
                                                            </div>
                                                            <div className="text-xs text-slate-500 flex items-center gap-2 font-mono tabular-nums">
                                                                <span>{item.policy}</span>
                                                                <span>•</span>
                                                                <span className="font-sans">{item.insurer}</span>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                                                            <div className="text-sm font-black text-slate-900 font-mono tabular-nums">
                                                                {item.premium}
                                                            </div>
                                                            <div className="flex items-center gap-1.5">
                                                                <button
                                                                    type="button"
                                                                    className="h-9 px-3 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                                                                >
                                                                    <MessageCircle className="h-3.5 w-3.5" />
                                                                    <span>WhatsApp</span>
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    className="h-9 w-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 inline-flex items-center justify-center transition-colors cursor-pointer"
                                                                    aria-label="Llamar"
                                                                >
                                                                    <Phone className="h-3.5 w-3.5" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* TAB 3: 25 PUNTOS (ERGONOMIC MOBILE COUNTER) */}
                                {screenTab === "activity" && (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="text-lg font-black tracking-tight text-slate-900">
                                                    Mis 25 Puntos Diarios
                                                </h3>
                                                <p className="text-xs text-slate-500">
                                                    Botones táctiles de 44×44px para registrar con el pulgar
                                                </p>
                                            </div>
                                            <span className="px-3 py-1 rounded-xl bg-teal-600 text-white font-mono tabular-nums text-xs font-black">
                                                {demoPoints} / 25 pts
                                            </span>
                                        </div>

                                        <div className="space-y-2.5">
                                            {[
                                                {
                                                    name: "Llamadas de Prospección Realizadas",
                                                    pts: "1 pt c/u",
                                                    count: 8
                                                },
                                                {
                                                    name: "Citas de Diagnóstico ADN (1ra Cita)",
                                                    pts: "3 pts c/u",
                                                    count: 2
                                                },
                                                {
                                                    name: "Citas de Cierre / Entrega de Propuesta",
                                                    pts: "5 pts c/u",
                                                    count: 1
                                                }
                                            ].map((act, i) => (
                                                <div
                                                    key={i}
                                                    className="bg-white rounded-2xl border border-slate-200/80 p-3.5 flex items-center justify-between gap-3"
                                                >
                                                    <div className="min-w-0">
                                                        <div className="text-xs sm:text-sm font-extrabold text-slate-900">
                                                            {act.name}
                                                        </div>
                                                        <div className="text-[11px] font-mono tabular-nums text-teal-700 font-bold">
                                                            Valor: {act.pts}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setDemoPoints((p) => Math.max(0, p - 1))
                                                            }
                                                            className="h-10 w-10 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-700 active:scale-95 transition-transform cursor-pointer"
                                                        >
                                                            <Minus className="h-4 w-4" />
                                                        </button>
                                                        <span className="w-6 text-center font-mono tabular-nums font-black text-sm">
                                                            {act.count}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => setDemoPoints((p) => p + 1)}
                                                            className="h-10 w-10 rounded-xl bg-teal-600 hover:bg-teal-700 text-white flex items-center justify-center active:scale-95 transition-transform cursor-pointer"
                                                        >
                                                            <Plus className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* SIMULATED MOBILE BOTTOM TAB BAR (ONLY IN STITCH PROPOSAL + MOBILE) */}
                            {deviceMode === "mobile" && viewMode === "proposal" && (
                                <div className="bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-2 pt-1.5 pb-4 grid grid-cols-5 gap-1 select-none">
                                    {[
                                        { id: "home", label: "Inicio", icon: Home },
                                        { id: "activity", label: "25 Pts", icon: ClipboardCheck },
                                        { id: "cartera", label: "Cartera", icon: Wallet },
                                        { id: "home", label: "Copiloto", icon: Bot },
                                        { id: "home", label: "Más", icon: LayoutGrid }
                                    ].map((tab, idx) => {
                                        const Icon = tab.icon;
                                        const isActive =
                                            (idx === 0 && screenTab === "home") ||
                                            (idx === 1 && screenTab === "activity") ||
                                            (idx === 2 && screenTab === "cartera");
                                        return (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => {
                                                    if (idx === 0) setScreenTab("home");
                                                    if (idx === 1) setScreenTab("activity");
                                                    if (idx === 2) setScreenTab("cartera");
                                                }}
                                                className={`flex flex-col items-center justify-center py-1 rounded-xl transition-colors cursor-pointer ${
                                                    isActive ? "text-teal-600" : "text-slate-400 hover:text-slate-700"
                                                }`}
                                            >
                                                <Icon className="h-4.5 w-4.5" />
                                                <span className="text-[10px] font-bold mt-0.5">{tab.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {/* iOS Home Indicator Bar */}
                            {deviceMode === "mobile" && (
                                <div className="bg-white pb-2 pt-1 flex justify-center">
                                    <div className="h-1 w-32 rounded-full bg-slate-300" />
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* 3. DETAILED DIAGNOSTIC CARDS (6 KEY FINDINGS) */}
                <section className="space-y-5">
                    <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-teal-600">
                            Auditoría de Código Actual
                        </span>
                        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 mt-0.5">
                            Los 6 Hallazgos Visuales Detectados en AACOM
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-500">
                            Cada punto está referenciado al archivo exacto del proyecto y puede aplicarse de forma modular sin alterar la base de datos ni las reglas de negocio.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {DIAGNOSTIC_FINDINGS.map((item) => (
                            <div
                                key={item.id}
                                className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs flex flex-col justify-between space-y-4"
                            >
                                <div className="space-y-2.5">
                                    <div className="flex items-center justify-between gap-2 flex-wrap">
                                        <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200/60">
                                            {item.category}
                                        </span>
                                        <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/60">
                                            Impacto: {item.severity}
                                        </span>
                                    </div>

                                    <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                                        {item.title}
                                    </h3>

                                    <div className="text-[11px] font-mono text-slate-400 truncate">
                                        📄 {item.fileRef}
                                    </div>
                                </div>

                                <div className="space-y-2.5 pt-2 border-t border-slate-100 text-xs leading-relaxed">
                                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-slate-600">
                                        <strong className="text-slate-900 block mb-0.5">
                                            Diagnóstico actual:
                                        </strong>
                                        {item.currentIssue}
                                    </div>
                                    <div className="p-3 rounded-xl bg-teal-50/50 border border-teal-200/60 text-slate-700">
                                        <strong className="text-teal-800 block mb-0.5">
                                            Propuesta Stitch:
                                        </strong>
                                        {item.stitchProposal}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 4. READY-TO-USE GOOGLE STITCH PROMPTS */}
                <section className="space-y-4">
                    <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-teal-600">
                            Skill Oficial `enhance-prompt`
                        </span>
                        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 mt-0.5">
                            Prompts Optimizados para Google Stitch (`stitch.withgoogle.com`)
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-500">
                            Si deseas generar variaciones adicionales directamente en el lienzo de Google Stitch, estos prompts ya incluyen los tokens de `DESIGN.md`:
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {STITCH_PROMPTS.map((item, idx) => (
                            <div
                                key={idx}
                                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs flex flex-col justify-between space-y-3"
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <h3 className="text-sm font-extrabold text-slate-900">
                                        {item.title}
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={() => copyPrompt(item.prompt, idx)}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-700 transition-colors cursor-pointer shrink-0"
                                    >
                                        {copiedIdx === idx ? (
                                            <>
                                                <Check className="h-3.5 w-3.5 text-emerald-600" />
                                                <span className="text-emerald-700">Copiado</span>
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="h-3.5 w-3.5" />
                                                <span>Copiar Prompt</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                                <pre className="text-[11px] font-mono text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-200/70 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
                                    {item.prompt}
                                </pre>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}
