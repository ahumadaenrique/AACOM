import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ShieldCheck, Zap, Users, TrendingUp, Mail, Phone, MapPin } from 'lucide-react';
import SoftAurora from '@/components/SoftAurora';

export default function InicioPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-teal-100 selection:text-teal-900">
      
      {/* Header / Navbar */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-teal-600 text-white p-1.5 rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="text-xl font-black tracking-tight text-slate-800">AACOM</span>
          </div>
          <nav className="hidden md:flex gap-8 text-sm font-medium text-slate-600">
            <a href="#caracteristicas" className="hover:text-teal-600 transition-colors">Características</a>
            <a href="#precios" className="hover:text-teal-600 transition-colors">Precios</a>
            <a href="#contacto" className="hover:text-teal-600 transition-colors">Contacto</a>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="text-slate-600 hover:text-slate-900 font-semibold">
                Iniciar Sesión
              </Button>
            </Link>
            <Link href="/login">
              <Button className="bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-md">
                Solicitar una demo
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-24 pb-32 overflow-hidden min-h-[80vh] flex flex-col justify-center bg-slate-950">
        {/* React Bits Soft Aurora Background */}
        <div className="absolute inset-0 w-full h-full z-0 overflow-hidden opacity-80">
          <SoftAurora 
            color1="#10B981"
            color2="#06B6D4"
            brightness={1.2}
            speed={1.0}
          />
        </div>

        <div className="container mx-auto px-4 text-center max-w-4xl relative z-10">
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight leading-tight mb-8 drop-shadow-lg">
            El sistema operativo definitivo para <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-400">Promotorías de Seguros</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-200 mb-10 max-w-2xl mx-auto leading-relaxed drop-shadow">
            Multi-cotizador, gestión de cartera, seguimiento de ADN y control de agentes. Todo en una sola plataforma en la nube diseñada para escalar tu promotoría.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/login">
              <Button size="lg" className="bg-teal-500 hover:bg-teal-600 text-white w-full sm:w-auto h-14 px-8 text-lg font-bold shadow-xl rounded-full">
                Comenzar ahora
              </Button>
            </Link>
            <Link href="#contacto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-lg font-bold rounded-full bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm">
                Contactar Ventas
              </Button>
            </Link>
          </div>
          <p className="mt-6 text-sm text-slate-400 font-medium">Se requiere tarjeta de crédito para iniciar.</p>
        </div>
      </section>

      {/* Features Section */}
      <section id="caracteristicas" className="py-24 bg-white border-y border-slate-100">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black text-slate-900 mb-4">Todo lo que tu promotoría necesita</h2>
            <p className="text-slate-600 max-w-xl mx-auto">Herramientas poderosas diseñadas específicamente para el sector asegurador en México.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-10 max-w-6xl mx-auto">
            {/* Feature 1 */}
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                <Zap className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Multi-Cotizador Rápido</h3>
              <p className="text-slate-600 leading-relaxed">
                Genera cotizaciones precisas de GMM y Vida en segundos. Exporta PDFs profesionales y compártelos inmediatamente con tus prospectos.
              </p>
            </div>
            {/* Feature 2 */}
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-teal-100 text-teal-600 rounded-2xl flex items-center justify-center mb-6">
                <Users className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Gestión de Agentes</h3>
              <p className="text-slate-600 leading-relaxed">
                Control total sobre tu estructura. Asigna licencias, monitorea la actividad de tu equipo y centraliza la comunicación en un solo lugar.
              </p>
            </div>
            {/* Feature 3 */}
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-6">
                <TrendingUp className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Reportes y Analítica</h3>
              <p className="text-slate-600 leading-relaxed">
                Visualiza el rendimiento de tu cartera, métricas de retención, prospección (ADN) y proyección de comisiones en tiempo real.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section (Stripe Requirement) */}
      <section id="precios" className="py-24 bg-slate-900 text-white">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black mb-4">Precios simples y transparentes</h2>
            <p className="text-slate-400 max-w-xl mx-auto">Escala tu promotoría sin límites. Paga solo por los usuarios que necesitas.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Plan Promotoría Base */}
            <div className="bg-slate-800 rounded-3xl p-8 border border-slate-700">
              <h3 className="text-2xl font-bold mb-2">Agencia SaaS</h3>
              <p className="text-slate-400 mb-6 h-12">Ideal para promotorías que van iniciando y requieren digitalizarse.</p>
              <div className="mb-8 flex items-baseline">
                <span className="text-4xl md:text-5xl font-black text-white">$2,499</span>
                <span className="text-slate-400 font-medium ml-2"> / mes</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3 text-slate-300">
                  <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0" />
                  <span>Hasta 10 usuarios/agentes incluidos</span>
                </li>
                <li className="flex items-start gap-3 text-slate-300">
                  <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0" />
                  <span>Acceso total al Multi-Cotizador</span>
                </li>
                <li className="flex items-start gap-3 text-slate-300">
                  <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0" />
                  <span>Panel Administrativo y Reportes</span>
                </li>
                <li className="flex items-start gap-3 text-slate-300">
                  <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0" />
                  <span>Soporte técnico estándar</span>
                </li>
              </ul>
              <Link href="/login">
                <Button className="w-full bg-white text-slate-900 hover:bg-slate-100 font-bold h-12 rounded-xl">Crear Agencia</Button>
              </Link>
            </div>

            {/* Plan Expansión */}
            <div className="bg-gradient-to-b from-teal-900 to-slate-800 rounded-3xl p-8 border border-teal-700 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-teal-500 text-white text-[10px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-wider">Más Popular</div>
              <h3 className="text-2xl font-bold mb-2">Asiento Adicional</h3>
              <p className="text-teal-100/70 mb-6 h-12">Para promotorías en crecimiento. Expande tu equipo de ventas a demanda.</p>
              <div className="mb-8 flex items-baseline">
                <span className="text-5xl font-black">$299</span>
                <span className="text-teal-100/70 font-medium ml-2">MXN / mes por usuario</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3 text-teal-50">
                  <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0" />
                  <span>Todos los beneficios del plan base</span>
                </li>
                <li className="flex items-start gap-3 text-teal-50">
                  <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0" />
                  <span>Capacidad de crecimiento infinito</span>
                </li>
                <li className="flex items-start gap-3 text-teal-50">
                  <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0" />
                  <span>Facturación recurrente en Stripe</span>
                </li>
                <li className="flex items-start gap-3 text-teal-50">
                  <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0" />
                  <span>Pago a cargo de la agencia o del agente</span>
                </li>
              </ul>
              <Link href="#contacto">
                <Button className="w-full bg-teal-500 hover:bg-teal-400 text-white font-bold h-12 rounded-xl shadow-lg shadow-teal-900/50">Contactar Ventas</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Contact & Legal Footer (Stripe Requirement) */}
      <footer id="contacto" className="bg-slate-50 pt-20 pb-10 border-t">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <div className="bg-teal-600 text-white p-1.5 rounded-lg">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <span className="text-2xl font-black text-slate-800 tracking-tight">AACOM</span>
              </div>
              <p className="text-slate-500 mb-6 max-w-sm leading-relaxed">
                Transformando la forma en que las promotorías y agentes de seguros gestionan su negocio en México.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-slate-600">
                  <Mail className="w-5 h-5 text-slate-400" />
                  <a href="mailto:soporte@aacomsoft.com" className="hover:text-teal-600 font-medium">soporte@aacomsoft.com</a>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <Phone className="w-5 h-5 text-slate-400" />
                  <span className="font-medium">+52 (55) 1234 5678</span>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <MapPin className="w-5 h-5 text-slate-400" />
                  <span className="font-medium">Ciudad de México, México</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-6 uppercase tracking-wider text-sm">Producto</h4>
              <ul className="space-y-4">
                <li><a href="#caracteristicas" className="text-slate-500 hover:text-teal-600 font-medium">Características</a></li>
                <li><a href="#precios" className="text-slate-500 hover:text-teal-600 font-medium">Precios</a></li>
                <li><Link href="/login" className="text-slate-500 hover:text-teal-600 font-medium">Iniciar Sesión</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-6 uppercase tracking-wider text-sm">Legal</h4>
              <ul className="space-y-4">
                <li><Link href="/terminos" className="text-slate-500 hover:text-teal-600 font-medium">Términos y Condiciones</Link></li>
                <li><Link href="/privacidad" className="text-slate-500 hover:text-teal-600 font-medium">Aviso de Privacidad</Link></li>
                <li><a href="#" className="text-slate-500 hover:text-teal-600 font-medium">Políticas de Reembolso</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-col items-center md:items-start gap-1">
              <p className="text-slate-500 text-sm font-medium">
                &copy; {new Date().getFullYear()} AACOM. Todos los derechos reservados.
              </p>
              <p className="text-slate-400 text-xs font-semibold">
                Aacomsoft es una empresa de grupo AACOM
              </p>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-6 bg-slate-200 rounded flex items-center justify-center text-[8px] font-black text-slate-400 uppercase tracking-widest">Stripe</div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
