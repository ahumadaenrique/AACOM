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
  ChevronRight,
  Menu,
  X,
  FileCheck2,
  Calendar,
  Clock,
  Laptop
} from 'lucide-react';

export default function InicioPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Headlines A/B testable via SITE_CONFIG
  const headlines = {
    '1': 'Tu promotoría más productiva, con todo tu equipo en una sola plataforma.',
    '2': 'Recluta, forma y haz crecer a tus agentes desde una sola plataforma.',
    '3': 'Menos hojas de cálculo, más citas y más pólizas emitidas.',
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
              text: 'No. aacomsoft es una compañía de soluciones tecnológicas diseñada para promotorías y agencias de seguros. aacomsoft no vende seguros directamente al público ni comercializa pólizas; tu información, agentes y cartera pertenecen exclusivamente a tu promotoría bajo un estricto compromiso de confidencialidad por escrito.'
            }
          },
          {
            '@type': 'Question',
            name: '¿Con qué aseguradoras funciona?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'La gestión de actividad, cartera, producción, formación e IA funciona para promotorías de cualquier aseguradora (SMNYL, MetLife, Prudential, Insignia Life, GNP, AXA, etc.). El cotizador hoy incluye productos de Insignia Life.'
            }
          },
          {
            '@type': 'Question',
            name: '¿Qué pasa con la confidencialidad de mi información y la de mis clientes?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Firmamos contigo una cláusula de confidencialidad por escrito. Tu información y cartera son exclusivamente tuyas y cada promotoría opera en un entorno completamente aislado.'
            }
          },
          {
            '@type': 'Question',
            name: '¿Cuánto cuesta?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'El plan Agencia cuesta $2,499 MXN al mes e incluye hasta 10 usuarios; cada usuario adicional cuesta $299 MXN al mes.'
            }
          },
          {
            '@type': 'Question',
            name: '¿Necesito tarjeta de crédito para la demo?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'No. La demo es una videollamada personalizada de 20 minutos, sin costo y sin compromiso de compra.'
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
            <a href="#funciones" className="hover:text-teal-400 transition-colors">Funciones</a>
            <a href="#seguridad" className="hover:text-teal-400 transition-colors">Seguridad</a>
            <a href="#precios" className="hover:text-teal-400 transition-colors">Precios</a>
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
              <a href="#funciones" onClick={() => setMobileMenuOpen(false)} className="py-2 hover:text-teal-400">Funciones</a>
              <a href="#seguridad" onClick={() => setMobileMenuOpen(false)} className="py-2 hover:text-teal-400">Seguridad</a>
              <a href="#precios" onClick={() => setMobileMenuOpen(false)} className="py-2 hover:text-teal-400">Precios</a>
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
            <span>Solución Tecnológica B2B para Promotorías</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-white tracking-tight leading-[1.1] max-w-4xl mx-auto drop-shadow-md">
            {activeHeadline}
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            <strong className="text-white font-bold">{SITE_CONFIG.brandName}</strong> es la plataforma tecnológica para promotorías y agencias de seguros: actividad diaria con gamificación, formación con simulador para la Cédula A de la CNSF, cartera y renovaciones, producción contra presupuesto e inteligencia artificial para tu equipo.
          </p>

          {/* Hero CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <a href="#demo" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-base font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-2xl shadow-xl shadow-teal-950/60 transition-all hover:scale-105">
                <span>Agendar demo de 20 min</span>
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
                <span>Escríbenos por WhatsApp</span>
              </Button>
            </a>
          </div>

          {/* Sin compromiso / Sin tarjeta */}
          <p className="text-xs sm:text-sm text-slate-400 font-medium">
            Demo personalizada de 20 minutos. Sin compromiso.
          </p>

          {/* Interactive SaaS Browser Mockup */}
          <HeroProductMockup />
        </div>
      </section>

      {/* 3. Barra de prueba (debajo del hero) */}
      <section className="py-6 border-y border-slate-800/80 bg-slate-900/60 backdrop-blur-sm">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 text-xs sm:text-sm font-bold text-slate-300">
            <div className="flex items-center gap-2.5">
              <Users className="w-4 h-4 text-teal-400" />
              <span>Ya lo usan 3 promotorías</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Lock className="w-4 h-4 text-teal-400" />
              <span>Confidencialidad por escrito y firmada</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Quiénes somos (Opción A) */}
      <section className="py-8 bg-slate-950 text-center border-b border-slate-900">
        <div className="container mx-auto px-4 max-w-4xl">
          <p className="text-xs sm:text-sm text-slate-400 font-medium leading-relaxed">
            {SITE_CONFIG.brandName} es una compañía de soluciones tecnológicas diseñada exclusivamente para promotorías y agencias de seguros en México.
          </p>
        </div>
      </section>

      {/* 5. Problema / Dolor */}
      <section className="py-24 bg-slate-900/40 relative">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-16 space-y-3">
            <span className="text-xs font-black uppercase tracking-wider text-rose-400">El desafío de operar</span>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              ¿Te suena familiar?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="p-7 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3 shadow-lg">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center font-bold">
                1
              </div>
              <h3 className="text-base font-bold text-slate-200">
                Falta de visibilidad de actividad
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                No sabes cuántas llamadas, citas y cierres hizo cada agente esta semana hasta que ya es tarde.
              </p>
            </div>

            <div className="p-7 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3 shadow-lg">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-rose-500/20 text-amber-400 flex items-center justify-center font-bold">
                2
              </div>
              <h3 className="text-base font-bold text-slate-200">
                Renovaciones en riesgo
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Las renovaciones se te escapan porque la cartera vive dispersa en hojas de cálculo y notas personales.
              </p>
            </div>

            <div className="p-7 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3 shadow-lg">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-rose-500/20 text-blue-400 flex items-center justify-center font-bold">
                3
              </div>
              <h3 className="text-base font-bold text-slate-200">
                Formación lenta y desgastante
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Formar a un agente nuevo y prepararlo para la cédula toma meses y absorbe demasiado tiempo de tu equipo.
              </p>
            </div>

            <div className="p-7 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3 shadow-lg">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-rose-500/20 text-purple-400 flex items-center justify-center font-bold">
                4
              </div>
              <h3 className="text-base font-bold text-slate-200">
                Cierres de mes artesanales
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                La producción contra presupuesto se tiene que armar a mano cada fin de mes en hojas de cálculo.
              </p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <p className="text-base sm:text-lg font-bold text-teal-400 max-w-xl mx-auto">
              aacomsoft junta todo eso en un solo lugar, pensado para cómo opera una promotoría.
            </p>
          </div>
        </div>
      </section>

      {/* 6. Tres Pilares (#funciones) */}
      <section id="funciones" className="py-24 bg-slate-950 border-t border-slate-800">
        <div className="container mx-auto px-4 max-w-6xl">
          
          <div className="text-center mb-20 space-y-4">
            <span className="text-xs font-black uppercase tracking-wider text-teal-400">Funcionalidades Integrales</span>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Todo lo que tu promotoría necesita para crecer
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-sm sm:text-base">
              Diseñado de origen para la realidad comercial del sector asegurador en México.
            </p>
          </div>

          <div className="space-y-16">
            
            {/* Pilar 1 — Reclutar y formar */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center p-8 sm:p-12 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <GraduationCap className="w-4 h-4" />
                  <span>Pilar 1</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-white">
                  Reclutar y formar
                </h3>
                <p className="text-base font-semibold text-indigo-300">
                  "Lleva a cada agente nuevo de cero a productivo con un camino claro."
                </p>
                <ul className="space-y-3.5 text-sm text-slate-300">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                    <span><strong>Plan de Arranque:</strong> 15 módulos de inducción con video, evaluación y validación directa del promotor.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                    <span><strong>Academia CNSF:</strong> Simulador para la Cédula A de la CNSF con 6 módulos y exámenes de 40 preguntas (Cédula B próximamente).</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                    <span><strong>Simulador de prospección con IA y voz:</strong> Más de 300 escenarios para practicar llamadas telefónicas con feedback en tiempo real.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                    <span><strong>Biblioteca digital:</strong> Manuales, argumentos y materiales descargables centralizados para tu equipo.</span>
                  </li>
                </ul>
              </div>
              <div className="lg:col-span-5 bg-slate-950 p-6 rounded-2xl border border-slate-800/80 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-800">
                  <Laptop className="w-4 h-4 text-teal-400" /> Plan de Arranque & Simulador
                </div>
                <div className="space-y-2.5 text-xs text-slate-300">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
                    <span>Módulo 1: Mentalidad y Cédula A</span>
                    <span className="text-emerald-400 font-bold">Completado 100%</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
                    <span>Práctica telefónica con IA</span>
                    <span className="text-teal-400 font-bold">Voz en Vivo Activa</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
                    <span>Evaluación técnica de coach</span>
                    <span className="text-amber-400 font-bold">Feedback Inmediato</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pilar 2 — Productividad diaria (REGLA LEGAL: "método de actividad por puntos", CERO "25 puntos") */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center p-8 sm:p-12 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Award className="w-4 h-4" />
                  <span>Pilar 2</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-white">
                  Productividad diaria
                </h3>
                <p className="text-base font-semibold text-amber-300">
                  "Haz visible la actividad de cada agente y conviértela en un juego que motiva."
                </p>
                <ul className="space-y-3.5 text-sm text-slate-300">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                    <span><strong>{SITE_CONFIG.activityMethodLabel}:</strong> Registro diario y transparente de llamadas, citas iniciales, citas efectivas, cierres, referidos y pólizas emitidas.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                    <span><strong>Gamificación:</strong> Experiencia (XP), niveles por rango y ranking general con campañas de premiación.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                    <span><strong>Referidores activos:</strong> Metas de referidos y encuesta de satisfacción automatizada para clientes finales.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                    <span><strong>Dashboard de productividad:</strong> Tendencias de 4 semanas por asesor y reportes semanales de actividad exportables a CSV.</span>
                  </li>
                </ul>
              </div>
              <div className="lg:col-span-5 bg-slate-950 p-6 rounded-2xl border border-slate-800/80 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-800">
                  <TrendingUp className="w-4 h-4 text-amber-400" /> Tablero de Actividad y Ranking
                </div>
                <div className="space-y-2.5 text-xs text-slate-300">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
                    <span>Meta Diaria de Actividad</span>
                    <span className="text-emerald-400 font-bold">Cumplida ✓</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
                    <span>Nivel de Desempeño</span>
                    <span className="text-amber-400 font-bold">Nivel 4 (Master)</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
                    <span>Reporte semanal</span>
                    <span className="text-cyan-400 font-bold">Exportable CSV</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pilar 3 — Cartera y producción */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center p-8 sm:p-12 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <Briefcase className="w-4 h-4" />
                  <span>Pilar 3</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-white">
                  Cartera y producción
                </h3>
                <p className="text-base font-semibold text-cyan-300">
                  "Controla clientes, pólizas, renovaciones y producción sin hojas de cálculo."
                </p>
                <ul className="space-y-3.5 text-sm text-slate-300">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                    <span><strong>Mi Cartera:</strong> Base centralizada de clientes, pólizas y prima anualizada con alertas de renovaciones a 30, 45 y 60 días.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                    <span><strong>Producción y primas:</strong> Prima emitida y pagada, presupuesto anual y porcentaje de cumplimiento por asesor, aseguradora y ramo.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                    <span><strong>Cotizador y diagnóstico patrimonial:</strong> Análisis 50-30-20 con generación de propuesta en PDF para el prospecto.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                    <span><strong>Importación rápida:</strong> Carga masiva de cartera por archivo layout y exportación a CSV con un clic.</span>
                  </li>
                </ul>
              </div>
              <div className="lg:col-span-5 bg-slate-950 p-6 rounded-2xl border border-slate-800/80 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-800">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" /> Control de Renovaciones & Cartera
                </div>
                <div className="space-y-2.5 text-xs text-slate-300">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
                    <span>Renovaciones a 30 días</span>
                    <span className="text-rose-400 font-bold">12 pólizas</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
                    <span>Cumplimiento Presupuesto</span>
                    <span className="text-emerald-400 font-bold">104.2%</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
                    <span>Diagnóstico Patrimonial</span>
                    <span className="text-teal-400 font-bold">PDF Generado</span>
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
            <span className="text-xs font-black uppercase tracking-wider text-teal-400">Ventajas Específicas</span>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Lo que no encontrarás en un CRM genérico
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-7 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 shadow-lg hover:border-teal-500/40 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Inteligencia artificial</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Asistente con IA que responde con base en los documentos de tu promotoría, más agentes de IA de asistente ejecutiva y de marketing.
              </p>
            </div>

            <div className="p-7 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 shadow-lg hover:border-teal-500/40 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Gamificación</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Puntos diarios, niveles, ranking y campañas de premiación que convierten la actividad comercial en hábito.
              </p>
            </div>

            <div className="p-7 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 shadow-lg hover:border-teal-500/40 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Academia CNSF</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Simulador para la Cédula A con exámenes de práctica y voz, más simulador de prospección con IA.
              </p>
            </div>

            <div className="p-7 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 shadow-lg hover:border-teal-500/40 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Tu propia marca</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Plataforma personalizada con el nombre y colores de tu promotoría en tu propio subdominio dedicado.
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
              <span>Privacidad Empresarial</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Tu información y la de tus clientes, protegida
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-sm sm:text-base">
              La confianza y el secreto profesional son la base de la intermediación de seguros.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="p-7 rounded-3xl bg-slate-900/90 border border-slate-800 flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center shrink-0">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-white text-base">Cláusula por escrito</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Firmamos contigo una cláusula formal de confidencialidad por escrito antes de iniciar.
                </p>
              </div>
            </div>

            <div className="p-7 rounded-3xl bg-slate-900/90 border border-slate-800 flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-white text-base">Propiedad de los datos</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Seguridad de datos como parte del servicio: tu información y cartera son exclusivamente tuyas.
                </p>
              </div>
            </div>

            <div className="p-7 rounded-3xl bg-slate-900/90 border border-slate-800 flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-white text-base">Aislamiento por agencia</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Cada promotoría trabaja en su propio espacio digital, completamente separado de las demás.
                </p>
              </div>
            </div>

            <div className="p-7 rounded-3xl bg-slate-900/90 border border-slate-800 flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-white text-base">Accesos por rol</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Control granular de permisos: cada usuario y asesor visualiza únicamente la información que le corresponde.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <a href="#demo" className="inline-flex items-center gap-2 text-sm font-bold text-teal-400 hover:text-teal-300 underline underline-offset-4">
              <span>Pide el modelo de convenio de confidencialidad en tu demo</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>

        </div>
      </section>

      {/* 9. Cómo funciona */}
      <section className="py-24 bg-slate-900/60 border-t border-slate-800">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-16 space-y-3">
            <span className="text-xs font-black uppercase tracking-wider text-teal-400">Implementación</span>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Empieza en 3 pasos
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-teal-500 text-slate-950 font-black text-xl flex items-center justify-center mx-auto shadow-lg shadow-teal-500/20">
                1
              </div>
              <h3 className="text-xl font-bold text-white">Demo de 20 minutos</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Te mostramos la plataforma con datos de ejemplo y resolvemos tus dudas operativas.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-teal-500 text-slate-950 font-black text-xl flex items-center justify-center mx-auto shadow-lg shadow-teal-500/20">
                2
              </div>
              <h3 className="text-xl font-bold text-white">Configuración</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Damos de alta tu promotoría, tu equipo y tu cartera, y firmamos el convenio de confidencialidad.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-teal-500 text-slate-950 font-black text-xl flex items-center justify-center mx-auto shadow-lg shadow-teal-500/20">
                3
              </div>
              <h3 className="text-xl font-bold text-white">Arranque</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Tu equipo empieza a registrar actividad diaria y tus agentes nuevos inician su Plan de Arranque.
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
              Precios claros, en pesos mexicanos
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto text-sm sm:text-base">
              Paga únicamente por la estructura y capacidad que tu promotoría requiere.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            
            {/* Plan Agencia */}
            <div className="p-8 sm:p-10 rounded-3xl bg-slate-900 border-2 border-teal-500/60 space-y-6 relative shadow-2xl flex flex-col justify-between">
              <div className="absolute -top-3.5 right-8 bg-teal-500 text-slate-950 text-[10px] font-black px-3.5 py-1 rounded-full uppercase tracking-widest shadow-md">
                Recomendado
              </div>

              <div className="space-y-4">
                <h3 className="text-2xl font-black text-white">Agencia</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Para promotorías y agencias que buscan digitalizar su operación, formación y control de cartera.
                </p>

                <div className="flex items-baseline gap-2 pt-2 pb-4 border-b border-slate-800">
                  <span className="text-4xl sm:text-5xl font-black text-white">$2,499</span>
                  <span className="text-sm font-bold text-slate-400">MXN / mes</span>
                </div>

                <ul className="space-y-3.5 text-xs text-slate-300">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                    <span><strong>Hasta 10 usuarios</strong> (agentes y administradores incluidos)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                    <span><strong>Cotizador</strong> y diagnóstico patrimonial</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                    <span><strong>Panel de administración</strong> y reportes exportables</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                    <span><strong>Plan de Arranque</strong> y simulador de Cédula A</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                    <span><strong>Soporte técnico estándar</strong> incluido</span>
                  </li>
                </ul>
              </div>

              <a href="#demo" className="pt-6">
                <Button className="w-full h-12 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-sm shadow-lg shadow-teal-950/40">
                  Agendar demo
                </Button>
              </a>
            </div>

            {/* Asiento adicional */}
            <div className="p-8 sm:p-10 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 shadow-xl flex flex-col justify-between">
              <div className="space-y-4">
                <h3 className="text-2xl font-black text-white">Usuario adicional</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Para equipos de más de 10 usuarios. Crece tu fuerza de ventas a demanda según tus reclutas.
                </p>

                <div className="flex items-baseline gap-2 pt-2 pb-4 border-b border-slate-800">
                  <span className="text-4xl sm:text-5xl font-black text-white">$299</span>
                  <span className="text-sm font-bold text-slate-400">MXN / mes por usuario</span>
                </div>

                <ul className="space-y-3.5 text-xs text-slate-300">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                    <span>Para equipos de más de 10 usuarios</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                    <span>Mismos accesos y herramientas del plan base</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                    <span>Facturación flexible mes a mes</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                    <span>Sin penalizaciones por ajustes de equipo</span>
                  </li>
                </ul>
              </div>

              <a href="#demo" className="pt-6">
                <Button variant="outline" className="w-full h-12 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border-slate-700 font-black text-sm">
                  Agendar demo
                </Button>
              </a>
            </div>

          </div>

          <div className="mt-12 text-center">
            <p className="text-xs sm:text-sm text-slate-400">
              ¿Más de 50 agentes o varias oficinas?{' '}
              <a href="#demo" className="text-teal-400 font-bold hover:underline">
                Hablemos de un plan a tu medida →
              </a>
            </p>
          </div>

        </div>
      </section>

      {/* 11. FAQ (#faq) */}
      <section id="faq" className="py-24 bg-slate-900/40 border-t border-slate-800">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-16 space-y-3">
            <span className="text-xs font-black uppercase tracking-wider text-teal-400">Respuestas Claras</span>
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
                No. aacomsoft es una compañía de soluciones tecnológicas desarrollada exclusivamente para promotorías y agencias de seguros. aacomsoft no vende seguros directamente al público ni comercializa pólizas; tu información, agentes y cartera son 100% propiedad de tu promotoría y quedan protegidos bajo cláusula formal de confidencialidad por escrito.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="border border-slate-800 rounded-2xl bg-slate-900/80 px-6">
              <AccordionTrigger className="text-sm sm:text-base font-bold text-white hover:text-teal-400 text-left py-5">
                ¿Con qué aseguradoras funciona?
              </AccordionTrigger>
              <AccordionContent className="text-xs sm:text-sm text-slate-400 leading-relaxed pb-5">
                La gestión de actividad, cartera, producción, formación e IA funciona para promotorías de cualquier aseguradora (SMNYL, MetLife, Prudential, Insignia Life, GNP, AXA, etc.). El cotizador hoy incluye productos de Insignia Life.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="border border-slate-800 rounded-2xl bg-slate-900/80 px-6">
              <AccordionTrigger className="text-sm sm:text-base font-bold text-white hover:text-teal-400 text-left py-5">
                ¿Qué pasa con la confidencialidad de mi información y la de mis clientes?
              </AccordionTrigger>
              <AccordionContent className="text-xs sm:text-sm text-slate-400 leading-relaxed pb-5">
                Firmamos contigo una cláusula de confidencialidad por escrito. Tu información y cartera son exclusivamente tuyas y cada agencia trabaja en un entorno completamente aislado.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="border border-slate-800 rounded-2xl bg-slate-900/80 px-6">
              <AccordionTrigger className="text-sm sm:text-base font-bold text-white hover:text-teal-400 text-left py-5">
                ¿Cuánto cuesta?
              </AccordionTrigger>
              <AccordionContent className="text-xs sm:text-sm text-slate-400 leading-relaxed pb-5">
                El plan Agencia cuesta $2,499 MXN al mes e incluye hasta 10 usuarios; cada usuario adicional cuesta $299 MXN al mes.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5" className="border border-slate-800 rounded-2xl bg-slate-900/80 px-6">
              <AccordionTrigger className="text-sm sm:text-base font-bold text-white hover:text-teal-400 text-left py-5">
                ¿Necesito tarjeta de crédito para la demo?
              </AccordionTrigger>
              <AccordionContent className="text-xs sm:text-sm text-slate-400 leading-relaxed pb-5">
                No. La demo es una videollamada personalizada de 20 minutos, sin costo y sin compromiso de compra.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6" className="border border-slate-800 rounded-2xl bg-slate-900/80 px-6">
              <AccordionTrigger className="text-sm sm:text-base font-bold text-white hover:text-teal-400 text-left py-5">
                ¿Puedo subir mi cartera actual?
              </AccordionTrigger>
              <AccordionContent className="text-xs sm:text-sm text-slate-400 leading-relaxed pb-5">
                Sí. Mi Cartera permite cargar clientes y pólizas mediante un archivo de layout estructurado y exportar a CSV en cualquier momento.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-7" className="border border-slate-800 rounded-2xl bg-slate-900/80 px-6">
              <AccordionTrigger className="text-sm sm:text-base font-bold text-white hover:text-teal-400 text-left py-5">
                ¿Sirve para preparar a mis agentes para la cédula?
              </AccordionTrigger>
              <AccordionContent className="text-xs sm:text-sm text-slate-400 leading-relaxed pb-5">
                Sí. La Academia incluye un simulador para la Cédula A de la CNSF con 6 módulos y exámenes de 40 preguntas. El simulador para la Cédula B está en desarrollo.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-8" className="border border-slate-800 rounded-2xl bg-slate-900/80 px-6">
              <AccordionTrigger className="text-sm sm:text-base font-bold text-white hover:text-teal-400 text-left py-5">
                ¿Mis agentes lo pueden usar desde el celular?
              </AccordionTrigger>
              <AccordionContent className="text-xs sm:text-sm text-slate-400 leading-relaxed pb-5">
                Sí. La plataforma está 100% optimizada para navegadores móviles (Safari, Chrome). Tus agentes pueden usarla directamente desde su celular sin necesidad de descargar aplicaciones pesadas de ninguna tienda, con la opción de agregar un acceso directo en su pantalla de inicio.
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
                <span>Demo Personalizada de 20 minutos</span>
              </span>

              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                Agenda tu demo de 20 minutos
              </h2>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                Déjanos tus datos y te mostramos cómo aacomsoft puede funcionar en tu promotoría.
              </p>

              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-teal-500/10 text-teal-400 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <span className="text-xs sm:text-sm text-slate-300">Demo interactiva con datos de ejemplo</span>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-teal-500/10 text-teal-400 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <span className="text-xs sm:text-sm text-slate-300">Resolvemos todas tus dudas de confidencialidad</span>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-teal-500/10 text-teal-400 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <span className="text-xs sm:text-sm text-slate-300">Sin compromiso ni solicitud de tarjeta</span>
                </div>
              </div>

              {/* WhatsApp Alternative */}
              <div className="pt-6 border-t border-slate-800/80">
                <p className="text-xs text-slate-400 mb-2">
                  ¿Prefieres contacto directo e inmediato?
                </p>
                <a
                  href={SITE_CONFIG.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-bold text-[#25D366] hover:underline"
                >
                  <span>Escríbenos por WhatsApp al {SITE_CONFIG.phone} →</span>
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
            Dale a tu equipo la plataforma que merece
          </h2>
          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            En 20 minutos te mostramos cómo medir la actividad, formar a tus agentes y controlar tu cartera desde un solo lugar.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <a href="#demo" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-base font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-2xl shadow-xl transition-all">
                Agendar demo
              </Button>
            </a>
            <a
              href={SITE_CONFIG.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto"
            >
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-base font-bold rounded-2xl bg-slate-900 hover:bg-slate-800 text-white border-slate-700">
                Escríbenos por WhatsApp
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
                Soluciones tecnológicas para promotorías y agencias de seguros.
              </p>
            </div>

            {/* Columna 2: Producto */}
            <div className="space-y-3">
              <h4 className="font-bold text-white uppercase tracking-wider text-xs">Producto</h4>
              <ul className="space-y-2">
                <li><a href="#funciones" className="hover:text-teal-400 transition-colors">Funciones</a></li>
                <li><a href="#seguridad" className="hover:text-teal-400 transition-colors">Seguridad</a></li>
                <li><a href="#precios" className="hover:text-teal-400 transition-colors">Precios</a></li>
                <li><a href="#faq" className="hover:text-teal-400 transition-colors">Preguntas frecuentes</a></li>
                <li><a href="#demo" className="hover:text-teal-400 transition-colors">Agendar demo</a></li>
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
              &copy; 2026 {SITE_CONFIG.brandName}. Soluciones tecnológicas para promotorías y agencias de seguros.
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
