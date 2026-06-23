"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, ShieldCheck, Zap, ArrowRight, Loader2 } from 'lucide-react';

import { Input } from '@/components/ui/input';

export default function BillingPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [promoCode, setPromoCode] = useState("");

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

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-extrabold text-slate-900 sm:text-5xl">
          Elige el plan ideal para tu Promotoría
        </h1>
        <p className="mt-4 text-xl text-slate-600 max-w-3xl mx-auto">
          Obtén acceso total a SYSGPYA + Inteligencia Artificial y lleva el control, la atracción y el desarrollo de tus agentes al siguiente nivel.
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

      <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        
        {/* Plan Trimestral */}
        <Card className="flex flex-col border-slate-200 shadow-sm hover:shadow-md transition-all">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-slate-800">Trimestral</CardTitle>
            <CardDescription>Para empezar a ver resultados.</CardDescription>
            <div className="mt-4">
              <span className="text-4xl font-extrabold text-slate-900">$5,997</span>
              <span className="text-slate-500 font-medium"> MXN / 3 meses</span>
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-slate-700">
                <CheckCircle2 className="h-5 w-5 text-indigo-500 shrink-0" />
                <span>Acceso completo a la plataforma SYSGPYA.</span>
              </li>
              <li className="flex items-start gap-3 text-slate-700">
                <CheckCircle2 className="h-5 w-5 text-indigo-500 shrink-0" />
                <span>Gestor de Políticas y CRM.</span>
              </li>
              <li className="flex items-start gap-3 text-slate-700">
                <CheckCircle2 className="h-5 w-5 text-indigo-500 shrink-0" />
                <span>Evaluación Básica de Agentes.</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full bg-slate-900 hover:bg-slate-800 text-white h-12 text-lg font-semibold"
              onClick={() => handleCheckout('3M')}
              disabled={loading !== null}
            >
              {loading === '3M' ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : 'Contratar Trimestral'}
            </Button>
          </CardFooter>
        </Card>

        {/* Plan Semestral (Destacado) */}
        <Card className="flex flex-col border-indigo-200 shadow-xl relative scale-105 z-10 bg-white">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-600 text-white px-4 py-1 rounded-full text-sm font-bold tracking-wide uppercase shadow-sm">
            Más Popular
          </div>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-indigo-900">Semestral</CardTitle>
            <CardDescription>El balance perfecto de tiempo y valor.</CardDescription>
            <div className="mt-4">
              <span className="text-4xl font-extrabold text-slate-900">$10,999</span>
              <span className="text-slate-500 font-medium"> MXN / 6 meses</span>
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-slate-700">
                <CheckCircle2 className="h-5 w-5 text-indigo-500 shrink-0" />
                <span className="font-medium text-slate-900">Ahorro frente al plan trimestral.</span>
              </li>
              <li className="flex items-start gap-3 text-slate-700">
                <CheckCircle2 className="h-5 w-5 text-indigo-500 shrink-0" />
                <span>Análisis Financieros (ADN) ilimitados.</span>
              </li>
              <li className="flex items-start gap-3 text-slate-700">
                <CheckCircle2 className="h-5 w-5 text-indigo-500 shrink-0" />
                <span>Motor de IA para prospección.</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-12 text-lg font-bold shadow-md shadow-indigo-200"
              onClick={() => handleCheckout('6M')}
              disabled={loading !== null}
            >
              {loading === '6M' ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : 'Contratar Semestral'}
              {loading !== '6M' && <ArrowRight className="ml-2 h-5 w-5" />}
            </Button>
          </CardFooter>
        </Card>

        {/* Plan Anual */}
        <Card className="flex flex-col border-slate-200 shadow-sm hover:shadow-md transition-all">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-slate-800">Anual IA Completa</CardTitle>
            <CardDescription>Para equipos en máxima expansión.</CardDescription>
            <div className="mt-4">
              <span className="text-4xl font-extrabold text-slate-900">$20,999</span>
              <span className="text-slate-500 font-medium"> MXN / año</span>
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-slate-700">
                <CheckCircle2 className="h-5 w-5 text-teal-500 shrink-0" />
                <span className="font-bold text-teal-700">Máximo ahorro a largo plazo.</span>
              </li>
              <li className="flex items-start gap-3 text-slate-700">
                <CheckCircle2 className="h-5 w-5 text-indigo-500 shrink-0" />
                <span>Soporte prioritario 24/7.</span>
              </li>
              <li className="flex items-start gap-3 text-slate-700">
                <Zap className="h-5 w-5 text-amber-500 shrink-0" />
                <span>Acceso anticipado a nuevas herramientas de IA.</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full bg-slate-900 hover:bg-slate-800 text-white h-12 text-lg font-semibold"
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
