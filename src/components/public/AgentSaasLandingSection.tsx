"use client";

import React from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/public/BrandLogo";
import SoftAurora from "@/components/SoftAurora";
import { Button } from "@/components/ui/button";
import {
  Building2,
  UserCheck,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Rocket,
  Mail,
  KeyRound,
  Wallet,
  Flame,
  ClipboardCheck,
  Network,
  SmilePlus,
  HeartPulse,
  Target,
  GraduationCap,
  Bot,
  Newspaper,
  Lock,
  HardDrive,
} from "lucide-react";

export function LandingAudienceGateway({
  onSelect,
}: {
  onSelect: (mode: "PROMOTORIA" | "AGENTE") => void;
}) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden">
      <div className="absolute inset-0 w-full h-full z-0 overflow-hidden opacity-55 pointer-events-none">
        <SoftAurora color1="#0d9488" color2="#4f46e5" brightness={1.0} speed={0.7} />
      </div>

      {/* Top Bar */}
      <header className="relative z-10 container mx-auto px-4 py-6 flex items-center justify-between">
        <BrandLogo href="/inicio" size="md" />
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-bold text-slate-300 hover:text-white px-4 py-2 rounded-xl border border-slate-800 bg-slate-900/70 transition-colors"
          >
            Iniciar sesión
          </Link>
        </div>
      </header>

      {/* Main Selector */}
      <main className="relative z-10 container mx-auto px-4 py-10 max-w-5xl flex-1 flex flex-col items-center justify-center text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-teal-500/10 text-teal-400 border border-teal-500/25 mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Ecosistema Tecnológico AACOMSoft</span>
        </div>

        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-tight max-w-4xl">
          ¿Cómo deseas utilizar <span className="text-teal-400">AACOMSoft</span> hoy?
        </h1>
        <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-2xl">
          Selecciona tu perfil para mostrarte los módulos, herramientas de Inteligencia Artificial y planes diseñados exactamente para tu operación.
        </p>

        <div className="grid md:grid-cols-2 gap-6 w-full mt-10 text-left">
          {/* Botón / Tarjeta 1: Promotoría / Agencia */}
          <button
            type="button"
            onClick={() => onSelect("PROMOTORIA")}
            className="group relative rounded-3xl p-8 bg-slate-900/85 hover:bg-slate-900 border-2 border-slate-800 hover:border-indigo-500/80 transition-all duration-300 shadow-2xl hover:shadow-indigo-950/50 flex flex-col justify-between text-left"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                  <Building2 className="w-7 h-7" />
                </div>
                <span className="text-xs font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                  Equipos y Fuerza de Ventas
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-white group-hover:text-indigo-300 transition-colors">
                Soy Promotoría / Agencia
              </h2>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                Sincroniza dirección, gerencia, reclutamiento, coaching y agentes en una sola plataforma multi-rol con marca blanca para tu promotoría.
              </p>

              <ul className="space-y-2 pt-2 text-xs sm:text-sm text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Arquitectura Multi-Rol (Promotor, Gerente, Coach, Agente)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Control de Producción, Ranking, PEA/PRP y Plan de Arranque</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Academia PRO, Roleplay IA, Proyecto 200, ADN y TIPS</span>
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-800 flex items-center justify-between text-indigo-400 font-black text-sm sm:text-base">
              <span>Entrar a la edición Promotorías y Agencias</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
            </div>
          </button>

          {/* Botón / Tarjeta 2: Agente Individual SaaS */}
          <button
            type="button"
            onClick={() => onSelect("AGENTE")}
            className="group relative rounded-3xl p-8 bg-slate-900/85 hover:bg-slate-900 border-2 border-teal-500/50 hover:border-teal-400 transition-all duration-300 shadow-2xl hover:shadow-teal-950/50 flex flex-col justify-between text-left"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400 group-hover:scale-110 transition-transform">
                  <UserCheck className="w-7 h-7" />
                </div>
                <span className="text-xs font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40">
                  Nuevo • SaaS Individual
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-white group-hover:text-teal-300 transition-colors">
                Soy Agente de Seguros
              </h2>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                Tu propio sistema SaaS con subdominio propio, Portal de Clientes para tus asegurados, Cartera 360°, herramientas comerciales e IA desde $249.90/mes.
              </p>

              <ul className="space-y-2 pt-2 text-xs sm:text-sm text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>
                    <strong>Nuevo Portal de Clientes:</strong> Usuario y contraseña para tus asegurados
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>Mi Cartera, Proyecto 200, 25 Puntos, Referidores, ADN y TIPS</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>Simuladores A y B, Asistente IA y Correo Corporativo (10 GB)</span>
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-800 flex items-center justify-between text-teal-400 font-black text-sm sm:text-base">
              <span>Entrar a la edición Agente Individual</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
            </div>
          </button>
        </div>
      </main>

      <footer className="relative z-10 py-6 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} AACOMSoft • Infraestructura Tecnológica para el Sector Asegurador.
      </footer>
    </div>
  );
}

const AGENT_MODULES = [
  {
    icon: KeyRound,
    title: "Portal de Clientes (Nuevo)",
    desc: "Crea usuario y contraseña temporal a cada cliente para que consulte tus datos de contacto, sus pólizas vigentes y los instructivos de siniestro que configures especialmente para él.",
    highlight: true,
  },
  {
    icon: Wallet,
    title: "Mi Cartera 360° + Lector IA",
    desc: "Sube tus carátulas PDF y deja que la IA extraiga fechas, recibos, sumas aseguradas y alertas de renovación y cobranza.",
  },
  {
    icon: Flame,
    title: "Proyecto 200",
    desc: "CRM de prospección con calificación inteligente y piloto automático para convertir tu mercado cálido y referidos en citas.",
  },
  {
    icon: ClipboardCheck,
    title: "Sistema de 25 Puntos",
    desc: "Disciplina diaria comercial para medir tus llamadas, citas obtenidas, cierres y solicitudes ingresadas todos los días.",
  },
  {
    icon: Network,
    title: "Mis Referidores",
    desc: "Administra tu propia red de alianzas y referidores con seguimiento transparente de prospectos y comisiones.",
  },
  {
    icon: HeartPulse,
    title: "Diagnóstico Financiero ADN",
    desc: "Detecta brechas de protección, retiro, ahorro y gastos médicos en vivo frente a tu prospecto con reporte ejecutivo.",
  },
  {
    icon: Target,
    title: "Talleres Interactivos TIPS",
    desc: "Imparte sesiones grupales con código QR en vivo y recibe al instante el termómetro financiero de cada asistente.",
  },
  {
    icon: SmilePlus,
    title: "Encuesta de Satisfacción",
    desc: "Evalúa la calidad de tu servicio post-venta y multiplica tus referidos de forma sistemática.",
  },
  {
    icon: Newspaper,
    title: "Newsletters Comerciales",
    desc: "Boletines informativos y contenido de valor listo para compartir con tu cartera y prospectos.",
  },
  {
    icon: GraduationCap,
    title: "Simuladores CNSF Cédula A y B",
    desc: "Entrena y acredita tus exámenes ante la CNSF con reactivos actualizados y explicaciones detalladas.",
  },
  {
    icon: Bot,
    title: "Asistente de IA Avanzada",
    desc: "Tu copiloto experto en condiciones generales, manejo de objeciones, redacción de correos y análisis de pólizas.",
  },
  {
    icon: Mail,
    title: "Correo Electrónico Corporativo (10 GB)",
    desc: "Adquiere de 1 a 5 buzones empresariales (@tudominio.com) de 10 GB c/u para ti, tu asistente o tu área de siniestros.",
  },
];

export function AgentSaasFullLanding({
  onSwitchToPromotoria,
}: {
  onSwitchToPromotoria: () => void;
}) {
  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 selection:bg-teal-500 selection:text-white">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-18 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <BrandLogo href="/inicio" size="md" />
            <span className="hidden sm:inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-teal-500/15 text-teal-300 border border-teal-500/30">
              Edición Agente Individual
            </span>
          </div>

          <nav className="hidden lg:flex items-center gap-6 text-sm font-semibold text-slate-300">
            <a href="#portal-clientes" className="hover:text-teal-400 transition-colors">
              Portal de Clientes
            </a>
            <a href="#modulos-agente" className="hover:text-teal-400 transition-colors">
              12 Módulos
            </a>
            <a href="#precios-agente" className="hover:text-teal-400 transition-colors">
              Precios Agente
            </a>
            <a href="#correo-corporativo" className="hover:text-teal-400 transition-colors">
              Correo 10 GB
            </a>
          </nav>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onSwitchToPromotoria}
              className="text-xs font-bold text-indigo-300 hover:text-white px-3 py-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 transition-colors"
            >
              ¿Eres Promotoría? Ver aquí
            </button>
            <Link
              href="/login"
              className="hidden sm:inline-block text-sm font-semibold text-slate-300 hover:text-white px-2"
            >
              Iniciar sesión
            </Link>
            <Link href="/registro?mode=agente">
              <Button className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-black px-4 py-2 rounded-xl shadow-lg shadow-teal-950/50">
                Probar 5 días gratis
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Agente Individual */}
      <section className="relative pt-16 pb-24 md:pt-24 md:pb-32 overflow-hidden">
        <div className="absolute inset-0 w-full h-full z-0 overflow-hidden opacity-55 pointer-events-none">
          <SoftAurora color1="#0d9488" color2="#0284c7" brightness={1.0} speed={0.8} />
        </div>

        <div className="container mx-auto px-4 text-center max-w-5xl relative z-10 space-y-7">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-teal-500/15 text-teal-300 border border-teal-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AACOMSoft para Agentes de Seguros Independientes</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-[1.1] max-w-4xl mx-auto">
            Tu propio SaaS de Seguros con{" "}
            <span className="text-teal-400">Portal de Clientes</span>, Cartera 360° e IA.
          </h1>

          <p className="text-base sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Personaliza tu plataforma con tu propio subdominio{" "}
            <span className="text-teal-300 font-mono font-bold">tunombre.aacomsoft.com</span>,
            entrega a cada cliente un usuario y contraseña para consultar sus pólizas e instructivos de siniestro, y domina tu actividad comercial en un solo lugar.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link href="/registro?mode=agente" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto h-14 px-8 text-base font-black bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-2xl shadow-xl shadow-teal-950/60"
              >
                <Rocket className="w-5 h-5 mr-2" />
                Crear mi SaaS de Agente (5 días gratis)
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <a href="#precios-agente" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto h-14 px-8 text-base font-bold rounded-2xl bg-slate-900/70 hover:bg-slate-800 text-white border-slate-700"
              >
                Ver Planes desde $249.90 / mes
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Spotlight: Nuevo Portal de Clientes */}
      <section id="portal-clientes" className="py-20 bg-slate-900/70 border-y border-slate-800">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-5">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-teal-500/15 text-teal-300 border border-teal-500/30">
                <KeyRound className="w-3.5 h-3.5" /> Nuevo Módulo Diferenciador
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight">
                El Portal privado donde tus Clientes ven sus Pólizas e Instructivos de Siniestro
              </h2>
              <p className="text-slate-300 leading-relaxed">
                Olvídate de que tu asegurado no encuentre su carátula a las 3:00 AM en una urgencia. Desde <strong>Mi Cartera</strong>, créale un usuario y una contraseña temporal en segundos:
              </p>
              <ul className="space-y-3 text-sm text-slate-200">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Contraseña Personal Segura:</strong> Al entrar por primera vez, el sistema le solicita elegir una contraseña que sí vaya a recordar.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>100% Personalizado por Cliente:</strong> Sube instructivos de siniestro, pasos de reembolso, directorios médicos y notas distintas para cada cliente.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Tu Marca Siempre Visible:</strong> El cliente solo ve tus datos de contacto, tu botón de WhatsApp de emergencia, sus pólizas y lo que tú configures para él.
                  </span>
                </li>
              </ul>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-teal-400">
                    Vista del Asegurado • app.aacomsoft.com/mi-portal
                  </span>
                  <h3 className="text-lg font-extrabold text-white mt-0.5">
                    Portal de Pólizas y Asistencia en Siniestros
                  </h3>
                </div>
                <ShieldCheck className="w-8 h-8 text-teal-400" />
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-teal-400 font-bold">Gastos Médicos Mayores</span>
                    <p className="font-bold text-white text-sm">Póliza #GMM-948201 • Vigente</p>
                  </div>
                  <span className="text-xs font-bold px-3 py-1.5 rounded-lg bg-indigo-600 text-white">
                    Descargar PDF
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-red-950/30 border border-red-500/30 space-y-1.5">
                  <span className="text-xs font-extrabold text-red-400 uppercase">
                    🚨 Instructivo asignado por tu Agente
                  </span>
                  <p className="text-sm font-bold text-white">
                    ¿Qué hacer en caso de ingreso hospitalario o accidente?
                  </p>
                  <p className="text-xs text-slate-300">
                    Guía paso a paso, formatos de reembolso y botón directo a Cabina de Siniestros y WhatsApp de tu Agente.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Los 12 Módulos Incluidos */}
      <section id="modulos-agente" className="py-20">
        <div className="container mx-auto px-4 max-w-6xl space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <h2 className="text-3xl sm:text-5xl font-black text-white">
              Todo el poder de <span className="text-teal-400">AACOMSoft</span> para tu despacho individual
            </h2>
            <p className="text-slate-400 text-base sm:text-lg">
              Incluye todos los módulos comerciales, de cartera, prospección e Inteligencia Artificial listos para usar desde el primer día.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {AGENT_MODULES.map((m, idx) => {
              const Icon = m.icon;
              return (
                <div
                  key={idx}
                  className={`rounded-2xl p-6 border transition-all ${
                    m.highlight
                      ? "bg-teal-950/30 border-teal-500/50 shadow-lg shadow-teal-950/30"
                      : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="w-11 h-11 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400 mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-extrabold text-white mb-2">{m.title}</h3>
                  <p className="text-sm text-slate-300 leading-relaxed">{m.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Precios Oficiales Agente Individual */}
      <section id="precios-agente" className="py-20 bg-slate-900/60 border-t border-slate-800">
        <div className="container mx-auto px-4 max-w-6xl space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-teal-500/15 text-teal-300 border border-teal-500/30">
              Inversión Transparente • Renovación Automática
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white">
              Planes Individuales para Agentes
            </h2>
            <p className="text-slate-300">
              Comienza con 5 días de prueba gratis. Todos los planes incluyen acceso completo a los módulos de Agente y al Portal de Clientes.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Mensual */}
            <div className="rounded-3xl p-7 bg-slate-950 border border-slate-800 flex flex-col justify-between">
              <div className="space-y-4">
                <h3 className="text-xl font-extrabold text-white">Mensual</h3>
                <div>
                  <span className="text-4xl font-black text-white">$339</span>
                  <span className="text-sm text-slate-400"> MXN / mes</span>
                </div>
                <p className="text-xs text-slate-400">Flexibilidad total mes a mes.</p>
                <ul className="space-y-2.5 text-xs text-slate-300 pt-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>Todos los módulos incluidos</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>Portal de Clientes ilimitado</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>Subdominio propio .aacomsoft.com</span>
                  </li>
                </ul>
              </div>
              <Link href="/registro?mode=agente" className="mt-8 block">
                <Button className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold">
                  Probar 5 días gratis
                </Button>
              </Link>
            </div>

            {/* Trimestral */}
            <div className="rounded-3xl p-7 bg-slate-950 border border-slate-800 flex flex-col justify-between">
              <div className="space-y-4">
                <h3 className="text-xl font-extrabold text-white">Trimestral</h3>
                <div>
                  <span className="text-4xl font-black text-white">$899</span>
                  <span className="text-sm text-slate-400"> MXN / 3 meses</span>
                </div>
                <p className="text-xs text-teal-400 font-semibold">Equivale a $299.67 MXN / mes</p>
                <ul className="space-y-2.5 text-xs text-slate-300 pt-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>Ahorro sobre el plan mensual</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>Simuladores Cédula A y B + IA</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>Proyecto 200, ADN y TIPS</span>
                  </li>
                </ul>
              </div>
              <Link href="/registro?mode=agente" className="mt-8 block">
                <Button className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold">
                  Probar 5 días gratis
                </Button>
              </Link>
            </div>

            {/* Semestral */}
            <div className="rounded-3xl p-7 bg-slate-900 border-2 border-teal-500 shadow-xl relative flex flex-col justify-between">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-teal-500 text-slate-950 text-[11px] font-black uppercase px-3 py-0.5 rounded-full">
                Más Popular
              </span>
              <div className="space-y-4">
                <h3 className="text-xl font-extrabold text-teal-300">Semestral</h3>
                <div>
                  <span className="text-4xl font-black text-white">$1,649</span>
                  <span className="text-sm text-slate-400"> MXN / 6 meses</span>
                </div>
                <p className="text-xs text-teal-400 font-semibold">Equivale a $274.83 MXN / mes</p>
                <ul className="space-y-2.5 text-xs text-slate-200 pt-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>Balance ideal de inversión</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>Portal de Asegurados con PDFs</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>Mis Referidores + Encuestas</span>
                  </li>
                </ul>
              </div>
              <Link href="/registro?mode=agente" className="mt-8 block">
                <Button className="w-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-black">
                  Comenzar Prueba Gratis
                </Button>
              </Link>
            </div>

            {/* Anual */}
            <div className="rounded-3xl p-7 bg-gradient-to-b from-indigo-950/60 to-slate-950 border-2 border-indigo-400/60 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-extrabold text-white">Anual Pro</h3>
                  <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                    Mejor Valor
                  </span>
                </div>
                <div>
                  <span className="text-4xl font-black text-white">$2,999</span>
                  <span className="text-sm text-slate-400"> MXN / año</span>
                </div>
                <p className="text-xs text-emerald-400 font-bold">Solo $249.90 MXN / mes</p>
                <ul className="space-y-2.5 text-xs text-slate-200 pt-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Máximo ahorro anual garantizado</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>12 meses de acceso total + IA</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Soporte prioritario incluido</span>
                  </li>
                </ul>
              </div>
              <Link href="/registro?mode=agente" className="mt-8 block">
                <Button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black">
                  Elegir Plan Anual
                </Button>
              </Link>
            </div>
          </div>

          {/* Sección Add-on Correo Corporativo */}
          <div
            id="correo-corporativo"
            className="mt-12 rounded-3xl p-8 bg-slate-950 border border-slate-800 space-y-6"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-extrabold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
                  <Mail className="w-4 h-4" /> Add-on Anual Opcional
                </span>
                <h3 className="text-2xl font-black text-white">
                  Correo Electrónico Corporativo (10 GB por buzón)
                </h3>
                <p className="text-sm text-slate-400">
                  Elige de 1 a 5 buzones con tu propio dominio (para ti, tu asistente, cobranza o siniestros):
                </p>
              </div>
              <Link href="/registro?mode=agente">
                <Button className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-black">
                  Activar en mi Cuenta
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
              {[
                { count: 1, price: "$999", label: "1 Buzón (10 GB)" },
                { count: 2, price: "$1,799", label: "2 Buzones (20 GB)" },
                { count: 3, price: "$2,499", label: "3 Buzones (30 GB)" },
                { count: 4, price: "$3,199", label: "4 Buzones (40 GB)" },
                { count: 5, price: "$3,799", label: "5 Buzones (50 GB)" },
              ].map((b) => (
                <div
                  key={b.count}
                  className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1"
                >
                  <span className="text-xs font-bold text-teal-400 block">{b.label}</span>
                  <span className="text-xl font-black text-white block">{b.price}</span>
                  <span className="text-[11px] text-slate-400 block">MXN / año</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export function AgentSaasLandingSection({
  mode,
  onSelectAgency,
  onSelectAgent,
}: {
  mode: "GATEWAY" | "AGENT";
  onSelectAgency: () => void;
  onSelectAgent: () => void;
  onBackToGateway?: () => void;
}) {
  if (mode === "GATEWAY") {
    return (
      <LandingAudienceGateway
        onSelect={(m) => {
          if (m === "PROMOTORIA") onSelectAgency();
          else onSelectAgent();
        }}
      />
    );
  }
  return <AgentSaasFullLanding onSwitchToPromotoria={onSelectAgency} />;
}
