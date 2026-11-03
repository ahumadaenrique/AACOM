"use client";

import React, { useState, useEffect } from 'react';
import { getAgencyBillingContext } from './actions';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, ShieldCheck, Zap, ArrowRight, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function BillingPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [promoCode, setPromoCode] = useState("");
  const [accountType, setAccountType] = useState<"AGENCY" | "SOLO_AGENT">("AGENCY");

  useEffect(() => {
    getAgencyBillingContext().then((ctx) => {
      if (ctx?.accountType) setAccountType(ctx.accountType);
    });
  }, []);

  const handleCheckout = async (plan: string) => {
    setLoading(plan);
    try {
      const response = await fetch('/api/checkout/agency', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plan, promoCode }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Ocurrió un error al generar el enlace de pago: " + (data.error || "Desconocido"));
      }
    } catch (error) {
      console.error(error);
      alert("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setLoading(null);
    }
  };

  if (accountType === "SOLO_AGENT") {
    return (
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200 mb-3">
            AACOMSoft • Edición Agente Individual
          </span>
          <h1 className="text-4xl font-extrabold text-slate-900 sm:text-5xl">
            Elige el plan para tu Despacho de Agente
          </h1>
          <p className="mt-4 text-xl text-slate-600 max-w-3xl mx-auto">
            Acceso total a Mi Cartera, Portal de Clientes Asegurados, Proyecto 200, 25 Puntos, ADN, TIPS, Simuladores Cédula A/B y Asistente de IA con renovación automática.
          </p>
        </div>

        <div className="max-w-md mx-auto mb-10">
          <Input
            placeholder="¿Tienes un código de descuento?"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
            className="text-center font-bold tracking-wider"
          />
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {/* Plan Mensual */}
          <Card className="flex flex-col border-slate-200 shadow-sm hover:shadow-md transition-all">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-slate-800">Mensual</CardTitle>
              <CardDescription>Flexibilidad mes a mes.</CardDescription>
              <div className="mt-4">
                <span className="text-3xl font-extrabold text-slate-900">$339</span>
                <span className="text-slate-500 font-medium text-sm"> MXN / mes</span>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2.5 text-slate-700">
                  <CheckCircle2 className="h-5 w-5 text-teal-600 shrink-0" />
                  <span>Mi Cartera + Portal de Clientes ilimitado.</span>
                </li>
                <li className="flex items-start gap-2.5 text-slate-700">
                  <CheckCircle2 className="h-5 w-5 text-teal-600 shrink-0" />
                  <span>Proyecto 200, 25 Puntos, ADN, TIPS y Referidores.</span>
                </li>
                <li className="flex items-start gap-2.5 text-slate-700">
                  <CheckCircle2 className="h-5 w-5 text-teal-600 shrink-0" />
                  <span>Cargo automático mensual con tarjeta.</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full bg-slate-900 hover:bg-slate-800 text-white h-12 text-base font-semibold"
                onClick={() => handleCheckout('SOLO_1M')}
                disabled={loading !== null}
              >
                {loading === 'SOLO_1M' ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : 'Contratar Mensual'}
              </Button>
            </CardFooter>
          </Card>

          {/* Plan Trimestral */}
          <Card className="flex flex-col border-slate-200 shadow-sm hover:shadow-md transition-all">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-slate-800">Trimestral</CardTitle>
              <CardDescription>Equivale a $299 MXN / mes.</CardDescription>
              <div className="mt-4">
                <span className="text-3xl font-extrabold text-slate-900">$899</span>
                <span className="text-slate-500 font-medium text-sm"> MXN / 3 meses</span>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2.5 text-slate-700">
                  <CheckCircle2 className="h-5 w-5 text-teal-600 shrink-0" />
                  <span>Todo incluido por 90 días.</span>
                </li>
                <li className="flex items-start gap-2.5 text-slate-700">
                  <CheckCircle2 className="h-5 w-5 text-teal-600 shrink-0" />
                  <span>Simuladores Cédula A y B + Asistente IA.</span>
                </li>
                <li className="flex items-start gap-2.5 text-slate-700">
                  <CheckCircle2 className="h-5 w-5 text-teal-600 shrink-0" />
                  <span>Portal de Asegurados con instructivos personalizados.</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full bg-slate-900 hover:bg-slate-800 text-white h-12 text-base font-semibold"
                onClick={() => handleCheckout('SOLO_3M')}
                disabled={loading !== null}
              >
                {loading === 'SOLO_3M' ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : 'Contratar Trimestral'}
              </Button>
            </CardFooter>
          </Card>

          {/* Plan Semestral */}
          <Card className="flex flex-col border-teal-200 shadow-xl relative lg:scale-105 z-10 bg-white">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-teal-600 text-white px-4 py-1 rounded-full text-xs font-bold tracking-wide uppercase shadow-sm whitespace-nowrap">
              Más Popular
            </div>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-teal-900">Semestral</CardTitle>
              <CardDescription>Equivale a $274.83 MXN / mes.</CardDescription>
              <div className="mt-4">
                <span className="text-3xl font-extrabold text-slate-900">$1,649</span>
                <span className="text-slate-500 font-medium text-sm"> MXN / 6 meses</span>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2.5 text-slate-700">
                  <CheckCircle2 className="h-5 w-5 text-teal-600 shrink-0" />
                  <span className="font-medium text-slate-900">Ahorro frente al plan mensual y trimestral.</span>
                </li>
                <li className="flex items-start gap-2.5 text-slate-700">
                  <CheckCircle2 className="h-5 w-5 text-teal-600 shrink-0" />
                  <span>Diagnósticos ADN, Encuestas y Newsletters.</span>
                </li>
                <li className="flex items-start gap-2.5 text-slate-700">
                  <CheckCircle2 className="h-5 w-5 text-teal-600 shrink-0" />
                  <span>Subdominio propio para ti y tus clientes.</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full bg-teal-600 hover:bg-teal-700 text-white h-12 text-base font-bold shadow-md shadow-teal-200"
                onClick={() => handleCheckout('SOLO_6M')}
                disabled={loading !== null}
              >
                {loading === 'SOLO_6M' ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : 'Contratar Semestral'}
                {loading !== 'SOLO_6M' && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </CardFooter>
          </Card>

          {/* Plan Anual */}
          <Card className="flex flex-col border-indigo-200 shadow-md hover:shadow-lg transition-all bg-gradient-to-b from-white to-indigo-50/30">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-indigo-900">Anual Pro</CardTitle>
              <CardDescription>Solo $249.90 MXN / mes.</CardDescription>
              <div className="mt-4">
                <span className="text-3xl font-extrabold text-slate-900">$2,999</span>
                <span className="text-slate-500 font-medium text-sm"> MXN / año</span>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2.5 text-slate-700">
                  <CheckCircle2 className="h-5 w-5 text-teal-600 shrink-0" />
                  <span className="font-bold text-teal-700">Máximo ahorro anual garantizado.</span>
                </li>
                <li className="flex items-start gap-2.5 text-slate-700">
                  <CheckCircle2 className="h-5 w-5 text-indigo-500 shrink-0" />
                  <span>12 meses de Portal de Clientes + IA + Cartera.</span>
                </li>
                <li className="flex items-start gap-2.5 text-slate-700">
                  <Zap className="h-5 w-5 text-amber-500 shrink-0" />
                  <span>Soporte prioritario y actualizaciones incluidas.</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-12 text-base font-bold"
                onClick={() => handleCheckout('SOLO_12M')}
                disabled={loading !== null}
              >
                {loading === 'SOLO_12M' ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : 'Contratar Anual ($2,999)'}
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="max-w-4xl mx-auto mt-10 bg-slate-900 text-white rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-teal-400">Add-on Independiente Anual</span>
            <h3 className="text-xl font-extrabold mt-1">¿Necesitas Correo Electrónico Corporativo (10 GB por buzón)?</h3>
            <p className="text-sm text-slate-300 mt-1">
              Elige de 1 a 5 buzones empresariales (@tudominio.com) desde $999 MXN / año con renovación anual independiente.
            </p>
          </div>
          <Link href="/correo-corporativo">
            <Button className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold whitespace-nowrap">
              Configurar Correo Corporativo
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-extrabold text-slate-900 sm:text-5xl">
          Elige el plan ideal para tu Promotoría
        </h1>
        <p className="mt-4 text-xl text-slate-600 max-w-3xl mx-auto">
          Obtén acceso total a la plataforma + Inteligencia Artificial y lleva el control, la atracción y el desarrollo de tus agentes al siguiente nivel.
        </p>
      </div>

      <div className="max-w-md mx-auto mb-12">
        <div className="flex gap-2">
          <Input 
            placeholder="¿Tienes un código de descuento?" 
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
            className="text-center font-bold tracking-wider"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
        
        {/* Plan Bimestral */}
        <Card className="flex flex-col border-slate-200 shadow-sm hover:shadow-md transition-all">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-slate-800">Bimestral</CardTitle>
            <CardDescription>Flexibilidad total por 60 días.</CardDescription>
            <div className="mt-4">
              <span className="text-3xl font-extrabold text-slate-900">$5,200</span>
              <span className="text-slate-500 font-medium text-sm"> MXN / 60 días</span>
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2.5 text-slate-700">
                <CheckCircle2 className="h-5 w-5 text-indigo-500 shrink-0" />
                <span>Acceso completo por 60 días.</span>
              </li>
              <li className="flex items-start gap-2.5 text-slate-700">
                <CheckCircle2 className="h-5 w-5 text-indigo-500 shrink-0" />
                <span>Gestor de Pólizas, Cartera y CRM.</span>
              </li>
              <li className="flex items-start gap-2.5 text-slate-700">
                <CheckCircle2 className="h-5 w-5 text-indigo-500 shrink-0" />
                <span>Cobro automático con tarjeta cada 60 días.</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full bg-slate-900 hover:bg-slate-800 text-white h-12 text-base font-semibold"
              onClick={() => handleCheckout('2M')}
              disabled={loading !== null}
            >
              {loading === '2M' ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : 'Contratar Bimestral'}
            </Button>
          </CardFooter>
        </Card>

        {/* Plan Trimestral */}
        <Card className="flex flex-col border-slate-200 shadow-sm hover:shadow-md transition-all">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-slate-800">Trimestral</CardTitle>
            <CardDescription>Para empezar a ver resultados.</CardDescription>
            <div className="mt-4">
              <span className="text-3xl font-extrabold text-slate-900">$7,497</span>
              <span className="text-slate-500 font-medium text-sm"> MXN / 3 meses</span>
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2.5 text-slate-700">
                <CheckCircle2 className="h-5 w-5 text-indigo-500 shrink-0" />
                <span>Acceso completo a la plataforma (90 días).</span>
              </li>
              <li className="flex items-start gap-2.5 text-slate-700">
                <CheckCircle2 className="h-5 w-5 text-indigo-500 shrink-0" />
                <span>Gestor de Pólizas y CRM.</span>
              </li>
              <li className="flex items-start gap-2.5 text-slate-700">
                <CheckCircle2 className="h-5 w-5 text-indigo-500 shrink-0" />
                <span>Evaluación y Seguimiento de Agentes.</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full bg-slate-900 hover:bg-slate-800 text-white h-12 text-base font-semibold"
              onClick={() => handleCheckout('3M')}
              disabled={loading !== null}
            >
              {loading === '3M' ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : 'Contratar Trimestral'}
            </Button>
          </CardFooter>
        </Card>

        {/* Plan Semestral */}
        <Card className="flex flex-col border-indigo-200 shadow-xl relative lg:scale-105 z-10 bg-white">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-600 text-white px-4 py-1 rounded-full text-xs font-bold tracking-wide uppercase shadow-sm whitespace-nowrap">
            Más Popular
          </div>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-indigo-900">Semestral</CardTitle>
            <CardDescription>El balance perfecto de tiempo y valor.</CardDescription>
            <div className="mt-4">
              <span className="text-3xl font-extrabold text-slate-900">$14,394</span>
              <span className="text-slate-500 font-medium text-sm"> MXN / 6 meses</span>
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2.5 text-slate-700">
                <CheckCircle2 className="h-5 w-5 text-indigo-500 shrink-0" />
                <span className="font-medium text-slate-900">Ahorro frente al plan trimestral.</span>
              </li>
              <li className="flex items-start gap-2.5 text-slate-700">
                <CheckCircle2 className="h-5 w-5 text-indigo-500 shrink-0" />
                <span>Análisis Financieros (ADN) ilimitados.</span>
              </li>
              <li className="flex items-start gap-2.5 text-slate-700">
                <CheckCircle2 className="h-5 w-5 text-indigo-500 shrink-0" />
                <span>Motor de IA para prospección.</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-12 text-base font-bold shadow-md shadow-indigo-200"
              onClick={() => handleCheckout('6M')}
              disabled={loading !== null}
            >
              {loading === '6M' ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : 'Contratar Semestral'}
              {loading !== '6M' && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          </CardFooter>
        </Card>

        {/* Plan Anual */}
        <Card className="flex flex-col border-slate-200 shadow-sm hover:shadow-md transition-all">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-slate-800">Anual IA Completa</CardTitle>
            <CardDescription>Para equipos en máxima expansión.</CardDescription>
            <div className="mt-4">
              <span className="text-3xl font-extrabold text-slate-900">$25,200</span>
              <span className="text-slate-500 font-medium text-sm"> MXN / año</span>
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2.5 text-slate-700">
                <CheckCircle2 className="h-5 w-5 text-teal-500 shrink-0" />
                <span className="font-bold text-teal-700">Máximo ahorro a largo plazo.</span>
              </li>
              <li className="flex items-start gap-2.5 text-slate-700">
                <CheckCircle2 className="h-5 w-5 text-indigo-500 shrink-0" />
                <span>Soporte prioritario 24/7.</span>
              </li>
              <li className="flex items-start gap-2.5 text-slate-700">
                <Zap className="h-5 w-5 text-amber-500 shrink-0" />
                <span>Acceso anticipado a nuevas herramientas de IA.</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full bg-slate-900 hover:bg-slate-800 text-white h-12 text-base font-semibold"
              onClick={() => handleCheckout('12M')}
              disabled={loading !== null}
            >
              {loading === '12M' ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : 'Contratar Anual'}
            </Button>
          </CardFooter>
        </Card>

      </div>

      <div className="mt-16 flex items-center justify-center gap-2 text-slate-500">
        <ShieldCheck className="h-5 w-5 text-emerald-500" />
        <span>Tus pagos están protegidos de extremo a extremo por Stripe.</span>
      </div>
    </div>
  );
}
