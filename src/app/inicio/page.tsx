'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { SITE_CONFIG } from '@/config/site';
import { DemoForm } from '@/components/public/DemoForm';
import { WhatsAppFloatingButton } from '@/components/public/WhatsAppFloatingButton';
import { BrandLogo } from '@/components/public/BrandLogo';
import { HeroProductMockup } from '@/components/public/HeroProductMockup';
import SoftAurora from '@/components/SoftAurora';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import {
  ShieldCheck,
  Zap,
  TrendingUp,
  Users,
  Award,
  CheckCircle2,
  Lock,
  Sparkles,
  ArrowRight,
  Phone,
  Mail,
  MapPin,
  Bot,
  GraduationCap,
  Briefcase,
  Layers,
  Menu,
  X,
  FileCheck2,
  Clock,
  Laptop,
  Presentation,
  Target,
  Building2,
  UserCheck
} from 'lucide-react';

export default function InicioPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Headlines A/B testable via SITE_CONFIG
  const headlines = {
    '1': 'Una promotoría eficiente con los roles necesarios en una única plataforma.',
    '2': 'Dirección, reclutamiento, coaching y fuerza de ventas en una única plataforma.',
    '3': 'Menos hojas de cálculo, mayor control de actividad y más pólizas emitidas.',
  };
  const activeHeadline = headlines[SITE_CONFIG.headlineVariant] || headlines['1'];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        name: SITE_CONFIG.brandName,
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        description:
          'Plataforma integral de gestión para promotorías y agencias de seguros con arquitectura por roles (Promotor, Gerente de Reclutamiento, Coach y Agente), método de actividad por puntos, simuladores CNSF Cédula A y B, talleres interactivos TIPS, diagnóstico ADN y control de cartera.',
        offers: {
          '@type': 'Offer',
          price: '2499',
          priceCurrency: 'MXN'
        }
      },
      {
        '@type': 'Organization',
        name: SITE_CONFIG.brandName,
        url: 'https://www.aacomsoft.com',
        logo: 'https://www.aacomsoft.com/logo.png',
        email: SITE_CONFIG.supportEmail,
        telephone: SITE_CONFIG.phoneRaw
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: '¿aacomsoft es una promotoría?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'No. aacomsoft es una plataforma tecnológica B2B creada para la operación de promotorías y agencias de seguros. No intermedia ni comercializa pólizas al público; los agentes, prospectos y la cartera pertenecen exclusivamente a cada promotoría bajo convenio de confidencialidad firmado por escrito.'
            }
          },
          {
            '@type': 'Question',
            name: '¿Con qué aseguradoras es compatible la plataforma?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'La gestión de roles, actividad comercial, formación CNSF (Cédula A y B), talleres interactivos TIPS, diagnóstico financiero ADN, cartera y producción opera para promotorías de cualquier aseguradora en México (SMNYL, MetLife, Prudential, Insignia Life, GNP, AXA, entre otras).'
            }
          },
          {
            '@type': 'Question',
            name: '¿Cómo se garantiza la confidencialidad de la cartera y de los asegurados?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Se formaliza por escrito un convenio de confidencialidad antes de iniciar operaciones. Cada promotoría cuenta con aislamiento lógico de base de datos y control estricto de permisos por rol.'
            }
          },
          {
            '@type': 'Question',
            name: '¿Cuál es el esquema de inversión mensual?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'El plan Agencia tiene una inversión de $2,499 MXN al mes e incluye hasta 20 usuarios activos entre dirección, gerencia, coaching y agentes. Cada usuario adicional tiene un costo de $299 MXN al mes.'
            }
          },
          {
            '@type': 'Question',
            name: '¿Se requiere tarjeta de crédito para agendar la sesión demostrativa?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'No. La sesión demostrativa es una presentación ejecutiva de 20 minutos por videollamada, sin costo y sin compromiso comercial.'
            }
          }
        ]
      }
    ]
  };

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 selection:bg-teal-500 selection:text-white">
      {/* Schema JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      {/* 1. Navbar Fija */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl transition-all">
        <div className="container mx-auto px-4 h-18 flex items-center justify-between">
          
          {/* Logo aacomsoft Oficial */}
          <BrandLogo href="/" size="md" />

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-400">
            <a href="#roles" className="hover:text-teal-400 transition-colors">Roles</a>
            <a href="#funciones" className="hover:text-teal-400 transition-colors">Módulos</a>
            <a href="#seguridad" className="hover:text-teal-400 transition-colors">Seguridad</a>
            <a href="#precios" className="hover:text-teal-400 transition-colors">Inversión</a>
            <a href="#faq" className="hover:text-teal-400 transition-colors">Preguntas</a>
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <Link href="/login" className="text-sm font-semibold text-slate-300 hover:text-white transition-colors">
              Iniciar sesión
            </Link>
            <a href="#demo">
              <Button className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-teal-950/40 transition-all hover:scale-105">
                Agendar demo
              </Button>
            </a>
          </div>

          {/* Mobile Hamburger & Always-visible Demo Button */}
          <div className="flex md:hidden items-center gap-2.5">
            <a href="#demo">
              <Button size="sm" className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs px-3.5 py-1.5 rounded-lg shadow-md">
                Agendar demo
              </Button>
            </a>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
              aria-label="Menú"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-slate-800 bg-slate-950 p-6 space-y-4 animate-in slide-in-from-top-4">
            <nav className="flex flex-col space-y-3 text-sm font-semibold text-slate-300">
              <a href="#roles" onClick={() => setMobileMenuOpen(false)} className="py-2 hover:text-teal-400">Roles</a>
              <a href="#funciones" onClick={() => setMobileMenuOpen(false)} className="py-2 hover:text-teal-400">Módulos</a>
              <a href="#seguridad" onClick={() => setMobileMenuOpen(false)} className="py-2 hover:text-teal-400">Seguridad</a>
              <a href="#precios" onClick={() => setMobileMenuOpen(false)} className="py-2 hover:text-teal-400">Inversión</a>
              <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="py-2 hover:text-teal-400">Preguntas</a>
            </nav>
            <div className="pt-4 border-t border-slate-800 flex flex-col gap-3">
              <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="text-center py-2.5 text-sm font-bold text-slate-300 hover:text-white">
                Iniciar sesión
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* 2. Hero Section */}
      <section className="relative pt-20 pb-28 md:pt-28 md:pb-36 overflow-hidden flex flex-col justify-center">
        {/* Soft Aurora Animated Background */}
        <div className="absolute inset-0 w-full h-full z-0 overflow-hidden opacity-60">
          <SoftAurora 
            color1="#0d9488"
            color2="#0284c7"
            brightness={1.0}
            speed={0.8}
          />
        </div>

        <div className="container mx-auto px-4 text-center max-w-5xl relative z-10 space-y-8">
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-teal-500/10 text-teal-400 border border-teal-500/20 backdrop-blur-md shadow-inner">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Infraestructura Tecnológica para Promotorías de Seguros</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-white tracking-tight leading-[1.1] max-w-4xl mx-auto drop-shadow-md">
            {activeHeadline}
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            <strong className="text-white font-bold">{SITE_CONFIG.brandName}</strong> sincroniza la dirección, el reclutamiento, el coaching y la fuerza de ventas en un mismo ecosistema: control diario de actividad por puntos, simuladores CNSF para Cédula A y B, talleres interactivos TIPS en vivo, diagnóstico financiero ADN y administración integral de cartera.
          </p>

          {/* Hero CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <a href="#demo" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-base font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-2xl shadow-xl shadow-teal-950/60 transition-all hover:scale-105">
                <span>Agendar sesión demostrativa (20 min)</span>
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </a>
            
            <a
              href={SITE_CONFIG.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto"
            >
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-base font-bold rounded-2xl bg-slate-900/60 hover:bg-slate-800 text-white border-slate-700/80 backdrop-blur-md transition-all">
                <span>Contacto directo por WhatsApp</span>
              </Button>
            </a>
          </div>

          {/* Sin compromiso / Sin tarjeta */}
          <p className="text-xs sm:text-sm text-slate-400 font-medium">
            Sesión ejecutiva de 20 minutos con entorno real de demostración. Sin compromiso comercial.
          </p>

          {/* Interactive SaaS Browser Mockup */}
          <HeroProductMockup />
        </div>
      </section>

      {/* 3. Barra de Respaldo y Garantías Operativas */}
      <section className="py-6 border-y border-slate-800/80 bg-slate-900/60 backdrop-blur-sm">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs sm:text-sm font-bold text-slate-300">
            <div className="flex items-center justify-center gap-2.5 py-1">
              <Users className="w-4 h-4 text-teal-400 shrink-0" />
              <span>Arquitectura Multi-Rol Integrada</span>
            </div>
            <div className="flex items-center justify-center gap-2.5 py-1">
              <Lock className="w-4 h-4 text-teal-400 shrink-0" />
              <span>Convenio de Confidencialidad por Escrito</span>
            </div>
            <div className="flex items-center justify-center gap-2.5 py-1">
              <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" />
              <span>Aislamiento de Cartera por Agencia</span>
            </div>
            <div className="flex items-center justify-center gap-2.5 py-1">
              <Building2 className="w-4 h-4 text-teal-400 shrink-0" />
              <span>Operación Multi-Aseguradora</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Arquitectura Organizacional por Roles (#roles) */}
      <section id="roles" className="py-24 bg-slate-950 border-b border-slate-900">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16 space-y-4">
            <span className="text-xs font-black uppercase tracking-wider text-teal-400">Gobierno y Sincronización</span>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Cada rol de la promotoría con las herramientas exactas para su función
            </h2>
            <p className="text-slate-400 max-w-3xl mx-auto text-sm sm:text-base leading-relaxed">
              Una promotoría de alto desempeño no opera como un usuario aislado: requiere coordinación en tiempo real entre quien dirige la estrategia, quien recluta y desarrolla, quien acompaña en campo y quien ejecuta la venta.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Rol 1: Promotor / Dirección */}
            <div className="p-7 rounded-3xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between space-y-4 shadow-xl hover:border-teal-500/40 transition-colors">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-teal-400">Rol 01</span>
                  <h3 className="text-lg font-black text-white mt-0.5">Promotor / Dirección</h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Tablero ejecutivo de prima emitida vs. pagada, avance contra presupuesto anual, conservación de cartera y administración de créditos y permisos por agente.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-800/80 text-[11px] font-bold text-slate-300 flex items-center justify-between">
                <span>Visibilidad global</span>
                <span className="text-teal-400">Control 360°</span>
              </div>
            </div>

            {/* Rol 2: Gerencia / Reclutamiento */}
            <div className="p-7 rounded-3xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between space-y-4 shadow-xl hover:border-indigo-500/40 transition-colors">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-indigo-400">Rol 02</span>
                  <h3 className="text-lg font-black text-white mt-0.5">Gerencia y Desarrollo</h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Aceleración de agentes noveles mediante el Plan de Arranque de 15 módulos y seguimiento de calificaciones en simuladores oficiales CNSF Cédula A y Cédula B.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-800/80 text-[11px] font-bold text-slate-300 flex items-center justify-between">
                <span>Curva de inducción</span>
                <span className="text-indigo-400">Estandarizada</span>
              </div>
            </div>

            {/* Rol 3: Coaching Comercial */}
            <div className="p-7 rounded-3xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between space-y-4 shadow-xl hover:border-amber-500/40 transition-colors">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-amber-400">Rol 03</span>
                  <h3 className="text-lg font-black text-white mt-0.5">Coaching Comercial</h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Auditoría del {SITE_CONFIG.activityMethodLabel}, detección oportuna de cuellos de botella entre llamadas y cierres, y entrenamiento de objeciones con IA y voz.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-800/80 text-[11px] font-bold text-slate-300 flex items-center justify-between">
                <span>Acompañamiento</span>
                <span className="text-amber-400">Basado en datos</span>
              </div>
            </div>

            {/* Rol 4: Agente / Fuerza de Ventas */}
            <div className="p-7 rounded-3xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between space-y-4 shadow-xl hover:border-cyan-500/40 transition-colors">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <Target className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-cyan-400">Rol 04</span>
                  <h3 className="text-lg font-black text-white mt-0.5">Agente de Seguros</h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Ejecución comercial diaria desde celular o computadora: talleres interactivos TIPS con QR, diagnóstico financiero ADN (Número Mágico), cotizador y alertas de renovación.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-800/80 text-[11px] font-bold text-slate-300 flex items-center justify-between">
                <span>Productividad</span>
                <span className="text-cyan-400">En campo y móvil</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Diagnóstico Operativo (Problema / Dolor) */}
      <section className="py-24 bg-slate-900/40 relative">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-16 space-y-3">
            <span className="text-xs font-black uppercase tracking-wider text-rose-400">Diagnóstico Operativo</span>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              El costo oculto de operar con herramientas desconectadas
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-sm sm:text-base">
              Cuando la operación depende de hojas de cálculo aisladas y reportes manuales, el crecimiento de la promotoría se frena en cuatro frentes críticos:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="p-7 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3 shadow-lg">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center font-bold">
                1
              </div>
              <h3 className="text-base font-bold text-slate-200">
                Puntos ciegos en la actividad semanal
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Sin métricas diarias estandarizadas de llamadas, citas iniciales, citas de cierre y referidos, la baja en actividad se detecta cuando el mes ya cerró.
              </p>
            </div>

            <div className="p-7 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3 shadow-lg">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                2
              </div>
              <h3 className="text-base font-bold text-slate-200">
                Riesgo en conservación y renovaciones
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                La cartera dispersa en archivos individuales impide anticipar vencimientos a 30, 45 y 60 días, comprometiendo la prima de renovación y los bonos de conservación.
              </p>
            </div>

            <div className="p-7 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3 shadow-lg">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                3
              </div>
              <h3 className="text-base font-bold text-slate-200">
                Desgaste directivo en la formación de reclutas
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Certificar candidatos ante la CNSF y entrenarlos en manejo de objeciones consume cientos de horas operativas cuando no existe una academia automatizada.
              </p>
            </div>

            <div className="p-7 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3 shadow-lg">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                4
              </div>
              <h3 className="text-base font-bold text-slate-200">
                Consolidación manual de producción
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Cruzar prima emitida, prima pagada y avance contra presupuesto anual cada cierre de mes retrasa la toma de decisiones estratégicas en la dirección.
              </p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <p className="text-base sm:text-lg font-bold text-teal-400 max-w-2xl mx-auto">
              {SITE_CONFIG.brandName} centraliza la metodología comercial, el desarrollo de agentes y el control de cartera en un estándar institucional.
            </p>
          </div>
        </div>
      </section>

      {/* 6. Tres Pilares (#funciones) */}
      <section id="funciones" className="py-24 bg-slate-950 border-t border-slate-800">
        <div className="container mx-auto px-4 max-w-6xl">
          
          <div className="text-center mb-20 space-y-4">
            <span className="text-xs font-black uppercase tracking-wider text-teal-400">Ecosistema Modular</span>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Lo que una promotoría necesita para crecer
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-sm sm:text-base">
              Diseñado de origen para la realidad operativa, comercial y regulatoria del sector asegurador en México.
            </p>
          </div>

          <div className="space-y-16">
            
            {/* Pilar 1 — Reclutamiento, Inducción y Academia CNSF */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center p-8 sm:p-12 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <GraduationCap className="w-4 h-4" />
                  <span>Pilar 1 · Desarrollo de Fuerza de Ventas</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-white">
                  Reclutamiento, inducción y Academia CNSF
                </h3>
                <p className="text-base font-semibold text-indigo-300">
                  Ruta estructurada para llevar a cada agente nuevo desde el reclutamiento hasta la emisión constante.
                </p>
                <ul className="space-y-3.5 text-sm text-slate-300">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                    <span><strong>Plan de Arranque:</strong> 15 módulos de inducción comercial con video, cuaderno de trabajo, evaluación y validación directiva.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                    <span><strong>Academia CNSF (Cédula A y Cédula B):</strong> Simuladores oficiales con bancos completos de reactivos, estudio asistido por voz y exámenes cronometrados.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                    <span><strong>Simulador de prospección con IA y voz:</strong> Más de 300 perfiles y escenarios reales para practicar llamadas telefónicas con evaluación automática.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                    <span><strong>Biblioteca institucional:</strong> Manuales, guiones comerciales y materiales descargables organizados para toda la agencia.</span>
                  </li>
                </ul>
              </div>
              <div className="lg:col-span-5 bg-slate-950 p-6 rounded-2xl border border-slate-800/80 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-800">
                  <Laptop className="w-4 h-4 text-teal-400" /> Certificación & Entrenamiento
                </div>
                <div className="space-y-2.5 text-xs text-slate-300">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
                    <span>Simulador CNSF Cédula A y B</span>
                    <span className="text-emerald-400 font-bold">Activo 100%</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
                    <span>Roleplay telefónico con IA</span>
                    <span className="text-teal-400 font-bold">Voz en Tiempo Real</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
                    <span>Plan de Arranque (15 módulos)</span>
                    <span className="text-amber-400 font-bold">Validación por Rol</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pilar 2 — Productividad Diaria y Prospección Interactiva (REGLA LEGAL: "método de actividad por puntos", CERO "25 puntos") */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center p-8 sm:p-12 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Award className="w-4 h-4" />
                  <span>Pilar 2 · Ejecución Comercial, TIPS y ADN</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-white">
                  Productividad diaria y prospección interactiva
                </h3>
                <p className="text-base font-semibold text-amber-300">
                  Disciplina comercial medible combinada con herramientas digitales para captar y perfilar prospectos en vivo.
                </p>
                <ul className="space-y-3.5 text-sm text-slate-300">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                    <span><strong>{SITE_CONFIG.activityMethodLabel}:</strong> Seguimiento diario de llamadas, citas iniciales, citas efectivas, cierres, referidos y pólizas emitidas.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                    <span><strong>Talleres Interactivos TIPS en vivo:</strong> Salas grupales sincronizadas mediante código QR para impartir conferencias financieras y captar prospectos calificados al instante.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                    <span><strong>Diagnóstico Financiero ADN:</strong> Cálculo interactivo de metas de retiro (Número Mágico), educación y protección patrimonial con reporte ejecutivo en PDF.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                    <span><strong>Gamificación y analítica semanal:</strong> Niveles por desempeño, campañas de premiación, tendencias de 4 semanas por agente y exportación a CSV.</span>
                  </li>
                </ul>
              </div>
              <div className="lg:col-span-5 bg-slate-950 p-6 rounded-2xl border border-slate-800/80 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-800">
                  <TrendingUp className="w-4 h-4 text-amber-400" /> Actividad, Talleres TIPS & ADN
                </div>
                <div className="space-y-2.5 text-xs text-slate-300">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
                    <span>Meta Diaria de Actividad</span>
                    <span className="text-emerald-400 font-bold">Monitoreo en Vivo ✓</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
                    <span>Taller Interactivo TIPS (QR)</span>
                    <span className="text-amber-400 font-bold">Proyección Sincronizada</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
                    <span>Diagnóstico ADN & Número Mágico</span>
                    <span className="text-cyan-400 font-bold">Expediente Digital</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pilar 3 — Cartera y producción */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center p-8 sm:p-12 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <Briefcase className="w-4 h-4" />
                  <span>Pilar 3 · Conservación y Rentabilidad</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-white">
                  Control de cartera, renovaciones y producción
                </h3>
                <p className="text-base font-semibold text-cyan-300">
                  Visibilidad ejecutiva sobre clientes, pólizas vigentes, vencimientos y cumplimiento de presupuesto anual.
                </p>
                <ul className="space-y-3.5 text-sm text-slate-300">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                    <span><strong>Gestión de Cartera:</strong> Base centralizada de asegurados, pólizas y prima anualizada con alertas preventivas de renovación a 30, 45 y 60 días.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                    <span><strong>Producción contra presupuesto:</strong> Seguimiento de prima emitida y prima pagada con porcentaje de cumplimiento por agente, aseguradora y ramo.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                    <span><strong>Cotizador y análisis 50-30-20:</strong> Modelado financiero con generación de propuesta formal en PDF para el prospecto.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                    <span><strong>Migración ágil de datos:</strong> Importación masiva de cartera mediante layout estructurado y exportación inmediata a CSV.</span>
                  </li>
                </ul>
              </div>
              <div className="lg:col-span-5 bg-slate-950 p-6 rounded-2xl border border-slate-800/80 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-800">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" /> Conservación & Presupuesto
                </div>
                <div className="space-y-2.5 text-xs text-slate-300">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
                    <span>Alertas de Renovación (30/45/60 d)</span>
                    <span className="text-rose-400 font-bold">Automatizadas</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
                    <span>Avance contra Presupuesto Anual</span>
                    <span className="text-emerald-400 font-bold">104.2% Cumplido</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
                    <span>Propuesta Patrimonial 50-30-20</span>
                    <span className="text-teal-400 font-bold">PDF Institucional</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 7. Diferenciadores */}
      <section className="py-24 bg-slate-900/50 border-t border-slate-800">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16 space-y-3">
            <span className="text-xs font-black uppercase tracking-wider text-teal-400">Ventajas Competitivas</span>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Capacidades ausentes en un CRM genérico
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-7 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 shadow-lg hover:border-teal-500/40 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Inteligencia artificial especializada</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Asistente técnico y simulador de voz configurados con base en la normativa, guiones y reglamentos del sector asegurador.
              </p>
            </div>

            <div className="p-7 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 shadow-lg hover:border-teal-500/40 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Presentation className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Talleres TIPS y Diagnóstico ADN</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Herramientas interactivas con código QR para convertir sesiones grupales y citas iniciales en oportunidades financieras cuantificadas.
              </p>
            </div>

            <div className="p-7 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 shadow-lg hover:border-teal-500/40 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Academia CNSF Cédula A y B</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Simuladores oficiales para Cédula A y Cédula B con exámenes cronometrados, explicaciones por voz y métricas de avance por candidato.
              </p>
            </div>

            <div className="p-7 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 shadow-lg hover:border-teal-500/40 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Identidad institucional propia</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Entorno personalizado con el nombre, logotipo, colores corporativos y subdominio dedicado de cada promotoría.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Seguridad y Confidencialidad (#seguridad) */}
      <section id="seguridad" className="py-24 bg-slate-950 border-t border-slate-800">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <ShieldCheck className="w-4 h-4" />
              <span>Gobierno de Datos y Privacidad Empresarial</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Protección institucional de la cartera y la información comercial
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-sm sm:text-base">
              El patrimonio más valioso de una promotoría es su fuerza de ventas y su cartera de asegurados. La arquitectura de {SITE_CONFIG.brandName} garantiza su resguardo legal y técnico.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="p-7 rounded-3xl bg-slate-900/90 border border-slate-800 flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center shrink-0">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-white text-base">Convenio firmado por escrito</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Formalización de un acuerdo legal de confidencialidad y no competencia antes de iniciar la implementación.
                </p>
              </div>
            </div>

            <div className="p-7 rounded-3xl bg-slate-900/90 border border-slate-800 flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-white text-base">Propiedad absoluta de los datos</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  La información de agentes, prospectos, diagnósticos y pólizas pertenece única y exclusivamente a cada promotoría.
                </p>
              </div>
            </div>

            <div className="p-7 rounded-3xl bg-slate-900/90 border border-slate-800 flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-white text-base">Aislamiento multi-inquilino por agencia</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Cada promotoría opera en un espacio de trabajo lógicamente aislado, impidiendo cualquier cruce de información entre organizaciones.
                </p>
              </div>
            </div>

            <div className="p-7 rounded-3xl bg-slate-900/90 border border-slate-800 flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-white text-base">Permisos granulares por rol</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Cada nivel jerárquico (Dirección, Gerencia, Coach y Agente) accede estrictamente a la información correspondiente a su función.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <a href="#demo" className="inline-flex items-center gap-2 text-sm font-bold text-teal-400 hover:text-teal-300 underline underline-offset-4">
              <span>Solicitar el modelo de convenio de confidencialidad durante la sesión demostrativa</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>

        </div>
      </section>

      {/* 9. Cómo funciona */}
      <section className="py-24 bg-slate-900/60 border-t border-slate-800">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-16 space-y-3">
            <span className="text-xs font-black uppercase tracking-wider text-teal-400">Puesta en Marcha</span>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Implementación ejecutiva en 3 pasos
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-teal-500 text-slate-950 font-black text-xl flex items-center justify-center mx-auto shadow-lg shadow-teal-500/20">
                1
              </div>
              <h3 className="text-xl font-bold text-white">Sesión de 20 minutos</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Recorrido ejecutivo por los módulos y roles de la plataforma para evaluar el ajuste con la operación de la promotoría.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-teal-500 text-slate-950 font-black text-xl flex items-center justify-center mx-auto shadow-lg shadow-teal-500/20">
                2
              </div>
              <h3 className="text-xl font-bold text-white">Configuración y NDA</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Firma del convenio de confidencialidad, personalización de marca, alta de roles y carga inicial de cartera.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-teal-500 text-slate-950 font-black text-xl flex items-center justify-center mx-auto shadow-lg shadow-teal-500/20">
                3
              </div>
              <h3 className="text-xl font-bold text-white">Despliegue Comercial</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Activación del registro diario de actividad, talleres TIPS, Academia CNSF y tableros directivos en tiempo real.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 10. Precios (#precios) */}
      <section id="precios" className="py-24 bg-slate-950 border-t border-slate-800">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-16 space-y-4">
            <span className="text-xs font-black uppercase tracking-wider text-teal-400">Inversión Transparente</span>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Esquema claro en pesos mexicanos
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto text-sm sm:text-base">
              Inversión escalable alineada a la estructura y al tamaño de cada promotoría.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            
            {/* Plan Agencia */}
            <div className="p-8 sm:p-10 rounded-3xl bg-slate-900 border-2 border-teal-500/60 space-y-6 relative shadow-2xl flex flex-col justify-between">
              <div className="absolute -top-3.5 right-8 bg-teal-500 text-slate-950 text-[10px] font-black px-3.5 py-1 rounded-full uppercase tracking-widest shadow-md">
                Plan Institucional
              </div>

              <div className="space-y-4">
                <h3 className="text-2xl font-black text-white">Agencia</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Para promotorías y agencias que buscan profesionalizar su dirección, desarrollo de agentes y control de cartera en una única plataforma.
                </p>

                <div className="flex items-baseline gap-2 pt-2 pb-4 border-b border-slate-800">
                  <span className="text-4xl sm:text-5xl font-black text-white">$2,499</span>
                  <span className="text-sm font-bold text-slate-400">MXN / mes</span>
                </div>

                <ul className="space-y-3.5 text-xs text-slate-300">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                    <span><strong>Hasta 20 usuarios activos</strong> (dirección, gerencia, coaches y agentes)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                    <span><strong>Diagnóstico ADN, Talleres TIPS</strong> y cotizador patrimonial</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                    <span><strong>Tableros directivos</strong> de actividad, cartera y producción</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                    <span><strong>Plan de Arranque</strong> y simuladores CNSF Cédula A y Cédula B</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                    <span><strong>Convenio de confidencialidad</strong> y soporte técnico incluidos</span>
                  </li>
                </ul>
              </div>

              <a href="#demo" className="pt-6">
                <Button className="w-full h-12 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-sm shadow-lg shadow-teal-950/40">
                  Agendar sesión demostrativa
                </Button>
              </a>
            </div>

            {/* Asiento adicional */}
            <div className="p-8 sm:p-10 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 shadow-xl flex flex-col justify-between">
              <div className="space-y-4">
                <h3 className="text-2xl font-black text-white">Usuario adicional</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Para organizaciones de más de 20 integrantes. Escalamiento flexible conforme crece la fuerza de ventas.
                </p>

                <div className="flex items-baseline gap-2 pt-2 pb-4 border-b border-slate-800">
                  <span className="text-4xl sm:text-5xl font-black text-white">$299</span>
                  <span className="text-sm font-bold text-slate-400">MXN / mes por usuario</span>
                </div>

                <ul className="space-y-3.5 text-xs text-slate-300">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                    <span>Aplica a partir del usuario 21 dentro de la promotoría</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                    <span>Acceso completo según el rol asignado por la dirección</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                    <span>Esquema mensual flexible sin plazos forzosos</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                    <span>Reasignación inmediata de licencias ante rotación de reclutas</span>
                  </li>
                </ul>
              </div>

              <a href="#demo" className="pt-6">
                <Button variant="outline" className="w-full h-12 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border-slate-700 font-black text-sm">
                  Agendar sesión demostrativa
                </Button>
              </a>
            </div>

          </div>

          <div className="mt-12 text-center">
            <p className="text-xs sm:text-sm text-slate-400">
              ¿Operación con más de 50 agentes o múltiples oficinas regionales?{' '}
              <a href="#demo" className="text-teal-400 font-bold hover:underline">
                Solicitar cotización corporativa →
              </a>
            </p>
          </div>

        </div>
      </section>

      {/* 11. FAQ (#faq) */}
      <section id="faq" className="py-24 bg-slate-900/40 border-t border-slate-800">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-16 space-y-3">
            <span className="text-xs font-black uppercase tracking-wider text-teal-400">Información Ejecutiva</span>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Preguntas Frecuentes
            </h2>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            
            <AccordionItem value="item-1" className="border border-slate-800 rounded-2xl bg-slate-900/80 px-6">
              <AccordionTrigger className="text-sm sm:text-base font-bold text-white hover:text-teal-400 text-left py-5">
                ¿aacomsoft es una promotoría?
              </AccordionTrigger>
              <AccordionContent className="text-xs sm:text-sm text-slate-400 leading-relaxed pb-5">
                No. aacomsoft es una plataforma tecnológica B2B creada para la operación de promotorías y agencias de seguros. No intermedia ni comercializa pólizas al público; los agentes, prospectos y la cartera son propiedad exclusiva de cada promotoría y quedan resguardados bajo convenio de confidencialidad firmado por escrito.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="border border-slate-800 rounded-2xl bg-slate-900/80 px-6">
              <AccordionTrigger className="text-sm sm:text-base font-bold text-white hover:text-teal-400 text-left py-5">
                ¿Con qué aseguradoras es compatible la plataforma?
              </AccordionTrigger>
              <AccordionContent className="text-xs sm:text-sm text-slate-400 leading-relaxed pb-5">
                La arquitectura por roles, el control de actividad, la Academia CNSF (Cédula A y B), los talleres interactivos TIPS, el diagnóstico ADN, la cartera y el tablero de producción operan para promotorías de cualquier aseguradora (SMNYL, MetLife, Prudential, Insignia Life, GNP, AXA, entre otras). El cotizador tarifario incluye actualmente productos de Insignia Life.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="border border-slate-800 rounded-2xl bg-slate-900/80 px-6">
              <AccordionTrigger className="text-sm sm:text-base font-bold text-white hover:text-teal-400 text-left py-5">
                ¿Cómo se garantiza la confidencialidad de la cartera y de los asegurados?
              </AccordionTrigger>
              <AccordionContent className="text-xs sm:text-sm text-slate-400 leading-relaxed pb-5">
                Se firma un convenio formal de confidencialidad por escrito. Adicionalmente, cada promotoría opera en un entorno de datos lógicamente aislado con control estricto de accesos según el rol de cada usuario.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="border border-slate-800 rounded-2xl bg-slate-900/80 px-6">
              <AccordionTrigger className="text-sm sm:text-base font-bold text-white hover:text-teal-400 text-left py-5">
                ¿Cuál es el esquema de inversión mensual?
              </AccordionTrigger>
              <AccordionContent className="text-xs sm:text-sm text-slate-400 leading-relaxed pb-5">
                El plan Agencia tiene un costo de $2,499 MXN al mes e incluye hasta 20 usuarios activos; cada usuario adicional tiene un costo de $299 MXN al mes. Asimismo, el promotor cuenta con controles para administrar el uso de créditos de IA y talleres interactivos por agente.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5" className="border border-slate-800 rounded-2xl bg-slate-900/80 px-6">
              <AccordionTrigger className="text-sm sm:text-base font-bold text-white hover:text-teal-400 text-left py-5">
                ¿Se requiere tarjeta de crédito para agendar la sesión demostrativa?
              </AccordionTrigger>
              <AccordionContent className="text-xs sm:text-sm text-slate-400 leading-relaxed pb-5">
                No. La demostración es una sesión ejecutiva personalizada de 20 minutos por videollamada, sin costo y sin compromiso de contratación.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6" className="border border-slate-800 rounded-2xl bg-slate-900/80 px-6">
              <AccordionTrigger className="text-sm sm:text-base font-bold text-white hover:text-teal-400 text-left py-5">
                ¿Es posible importar la cartera actual de la promotoría?
              </AccordionTrigger>
              <AccordionContent className="text-xs sm:text-sm text-slate-400 leading-relaxed pb-5">
                Sí. El módulo de Cartera permite importar clientes y pólizas de forma masiva mediante un archivo de layout estructurado, así como exportar la información a CSV en cualquier momento.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-7" className="border border-slate-800 rounded-2xl bg-slate-900/80 px-6">
              <AccordionTrigger className="text-sm sm:text-base font-bold text-white hover:text-teal-400 text-left py-5">
                ¿Cómo apoya la plataforma la certificación CNSF de nuevos agentes?
              </AccordionTrigger>
              <AccordionContent className="text-xs sm:text-sm text-slate-400 leading-relaxed pb-5">
                La Academia integra simuladores oficiales de la CNSF tanto para Cédula A como para Cédula B, con módulos interactivos de estudio, explicaciones por voz, exámenes de práctica cronometrados y visibilidad de avance para el gerente de desarrollo.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-8" className="border border-slate-800 rounded-2xl bg-slate-900/80 px-6">
              <AccordionTrigger className="text-sm sm:text-base font-bold text-white hover:text-teal-400 text-left py-5">
                ¿La fuerza de ventas puede operar desde dispositivos móviles?
              </AccordionTrigger>
              <AccordionContent className="text-xs sm:text-sm text-slate-400 leading-relaxed pb-5">
                Sí. La plataforma cuenta con diseño responsivo y tecnología de aplicación web progresiva (PWA), permitiendo a directores, gerentes, coaches y agentes operar desde celular, tableta o computadora sin descargas pesadas.
              </AccordionContent>
            </AccordionItem>

          </Accordion>

        </div>
      </section>

      {/* 12. Formulario de Demo (#demo) */}
      <section id="demo" className="py-24 bg-slate-950 border-t border-slate-800">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            
            <div className="lg:col-span-5 space-y-6">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-teal-500/10 text-teal-400 border border-teal-500/20">
                <Clock className="w-3.5 h-3.5" />
                <span>Sesión Ejecutiva de 20 minutos</span>
              </span>

              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                Agendar sesión demostrativa
              </h2>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                Complete el registro para coordinar una presentación ejecutiva de {SITE_CONFIG.brandName} enfocada en la estructura y objetivos de la promotoría.
              </p>

              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-teal-500/10 text-teal-400 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <span className="text-xs sm:text-sm text-slate-300">Recorrido en vivo por los roles de Dirección, Gerencia, Coach y Agente</span>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-teal-500/10 text-teal-400 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <span className="text-xs sm:text-sm text-slate-300">Revisión del convenio de confidencialidad y esquema de aislamiento de datos</span>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-teal-500/10 text-teal-400 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <span className="text-xs sm:text-sm text-slate-300">Sin compromiso comercial ni solicitud de tarjeta</span>
                </div>
              </div>

              {/* WhatsApp Alternative */}
              <div className="pt-6 border-t border-slate-800/80">
                <p className="text-xs text-slate-400 mb-2">
                  ¿Prefiere atención ejecutiva directa por WhatsApp?
                </p>
                <a
                  href={SITE_CONFIG.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-bold text-[#25D366] hover:underline"
                >
                  <span>Iniciar conversación al {SITE_CONFIG.phone} →</span>
                </a>
              </div>
            </div>

            <div className="lg:col-span-7">
              <DemoForm originPage="/inicio" />
            </div>

          </div>
        </div>
      </section>

      {/* 13. CTA Final */}
      <section className="py-20 bg-gradient-to-b from-slate-950 to-slate-900 border-t border-slate-800 text-center">
        <div className="container mx-auto px-4 max-w-4xl space-y-6">
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Infraestructura ejecutiva para escalar el crecimiento de la promotoría
          </h2>
          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Conozca en 20 minutos cómo sincronizar la actividad comercial, acelerar la certificación de agentes y proteger la conservación de la cartera en una única plataforma.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <a href="#demo" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-base font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-2xl shadow-xl transition-all">
                Agendar sesión demostrativa
              </Button>
            </a>
            <a
              href={SITE_CONFIG.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto"
            >
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-base font-bold rounded-2xl bg-slate-900 hover:bg-slate-800 text-white border-slate-700">
                Contacto directo por WhatsApp
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* 14. Footer (Opción A: Marca Independiente, 4 columnas) */}
      <footer className="bg-slate-950 border-t border-slate-900 py-16 text-slate-400 text-xs">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            
            {/* Columna 1: Marca & Descripción */}
            <div className="space-y-4">
              <BrandLogo href="/" size="sm" />
              <p className="text-slate-400 leading-relaxed text-xs">
                Plataforma de gestión integral y desarrollo comercial para promotorías y agencias de seguros.
              </p>
            </div>

            {/* Columna 2: Producto */}
            <div className="space-y-3">
              <h4 className="font-bold text-white uppercase tracking-wider text-xs">Plataforma</h4>
              <ul className="space-y-2">
                <li><a href="#roles" className="hover:text-teal-400 transition-colors">Arquitectura por roles</a></li>
                <li><a href="#funciones" className="hover:text-teal-400 transition-colors">Módulos principales</a></li>
                <li><a href="#seguridad" className="hover:text-teal-400 transition-colors">Seguridad y NDA</a></li>
                <li><a href="#precios" className="hover:text-teal-400 transition-colors">Inversión</a></li>
                <li><a href="#faq" className="hover:text-teal-400 transition-colors">Preguntas frecuentes</a></li>
                <li><a href="#demo" className="hover:text-teal-400 transition-colors">Agendar sesión</a></li>
                <li><Link href="/login" className="hover:text-teal-400 transition-colors">Iniciar sesión</Link></li>
              </ul>
            </div>

            {/* Columna 3: Legal */}
            <div className="space-y-3">
              <h4 className="font-bold text-white uppercase tracking-wider text-xs">Legal</h4>
              <ul className="space-y-2">
                <li><Link href="/terminos" className="hover:text-teal-400 transition-colors">Términos y condiciones</Link></li>
                <li><Link href="/privacidad" className="hover:text-teal-400 transition-colors">Aviso de privacidad</Link></li>
                <li><Link href="/reembolso" className="hover:text-teal-400 transition-colors">Políticas de reembolso</Link></li>
              </ul>
            </div>

            {/* Columna 4: Contacto */}
            <div className="space-y-3">
              <h4 className="font-bold text-white uppercase tracking-wider text-xs">Contacto</h4>
              <ul className="space-y-2.5">
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-500 shrink-0" />
                  <a href={`mailto:${SITE_CONFIG.supportEmail}`} className="hover:text-teal-400 transition-colors">
                    {SITE_CONFIG.supportEmail}
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-500 shrink-0" />
                  <a href={`tel:${SITE_CONFIG.phoneRaw}`} className="hover:text-teal-400 transition-colors">
                    {SITE_CONFIG.phone}
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>Ciudad de México, México</span>
                </li>
              </ul>
            </div>

          </div>

          {/* Bottom Bar: Opción A - Cero Stripe, Cero AACOM */}
          <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
            <p>
              &copy; 2026 {SITE_CONFIG.brandName}. Plataforma tecnológica para promotorías y agencias de seguros.
            </p>
            <p>
              Todos los derechos reservados.
            </p>
          </div>

        </div>
      </footer>

      {/* Floating WhatsApp Action Button */}
      <WhatsAppFloatingButton />

    </div>
  );
}
