import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { SITE_CONFIG } from '@/config/site';
import { DemoForm } from '@/components/public/DemoForm';
import { WhatsAppFloatingButton } from '@/components/public/WhatsAppFloatingButton';
import { BrandLogo } from '@/components/public/BrandLogo';
import { ShieldCheck, CheckCircle2, Clock, Lock, Sparkles, MessageSquare } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Agendar Demo de 20 Minutos · aacomsoft',
  description: 'Conoce en 20 minutos cómo aacomsoft ayuda a tu promotoría o agencia de seguros a medir actividad por puntos, preparar agentes para la Cédula A y controlar cartera.',
};

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-teal-100 selection:text-teal-900">
      
      {/* Top Navbar Minimal */}
      <header className="w-full border-b bg-white/90 backdrop-blur-md sticky top-0 z-40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <BrandLogo href="/inicio" theme="light" size="sm" />

          <div className="flex items-center gap-4">
            <Link href="/inicio" className="text-sm font-semibold text-slate-600 hover:text-teal-600 transition-colors">
              Volver al inicio
            </Link>
            <Link href="/login" className="text-sm font-semibold text-teal-600 hover:text-teal-700 transition-colors">
              Iniciar Sesión
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 md:py-20 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Column: Value Prop */}
          <div className="lg:col-span-5 space-y-8">
            <div className="space-y-4">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200">
                <Clock className="w-3.5 h-3.5" />
                <span>Demo Personalizada de 20 Minutos</span>
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-950 tracking-tight leading-tight">
                Descubre cómo opera tu promotoría con <span className="text-teal-600">{SITE_CONFIG.brandName}</span>
              </h1>
              <p className="text-base text-slate-600 leading-relaxed">
                Sin presentaciones teóricas ni pérdidas de tiempo. En 20 minutos te mostramos la plataforma con datos de ejemplo y resolvemos tus dudas específicas de operación y confidencialidad.
              </p>
            </div>

            {/* 3 Key Bullets */}
            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3.5">
                <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Demo con datos de ejemplo</h4>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    Visualiza el dashboard de actividad, el simulador de prospección con IA y el control de cartera tal como lo verían tus asesores.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Confidencialidad garantizada</h4>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    Tu información es tuya. Firmamos convenio de confidencialidad por escrito antes de cualquier migración de datos.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Sin compromiso</h4>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    No se requiere tarjeta de crédito ni compromiso de compra para agendar.
                  </p>
                </div>
              </div>
            </div>

            {/* Direct WhatsApp Box */}
            <div className="p-6 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-3">
              <div className="flex items-center gap-2 font-bold text-emerald-900 text-sm">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <span>¿Prefieres atención inmediata por WhatsApp?</span>
              </div>
              <p className="text-xs text-emerald-800 leading-relaxed">
                Si deseas respuesta rápida o acordar un horario directamente con nuestro equipo:
              </p>
              <a
                href={SITE_CONFIG.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs rounded-xl shadow-md transition-all"
              >
                <span>Escríbenos al {SITE_CONFIG.phone}</span>
              </a>
            </div>

          </div>

          {/* Right Column: Form */}
          <div className="lg:col-span-7">
            <DemoForm originPage="/demo" />
          </div>

        </div>
      </main>

      <WhatsAppFloatingButton />

    </div>
  );
}
