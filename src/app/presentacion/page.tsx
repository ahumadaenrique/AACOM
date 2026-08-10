"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ShieldCheck, Check, X, Users, Wallet, Sparkles, Zap, 
  ArrowRight, Shield, Globe, Award, Database, TrendingUp, Play, MessageSquare, Flame, CheckSquare
} from "lucide-react";
import SoftAurora from "@/components/SoftAurora";

export default function PresentacionPage() {
  const [agents, setAgents] = useState(15);
  const [activeTab, setActiveTab] = useState("cotizador");

  // Cost calculations
  const baseAgentsIncluded = 10;
  const baseAacomPrice = 2499;
  const extraAgentPrice = 299;
  
  const aacomCost = agents <= baseAgentsIncluded 
    ? baseAacomPrice 
    : baseAacomPrice + (agents - baseAgentsIncluded) * extraAgentPrice;

  // Alternative costs (which in reality scale per user/agent)
  const assistantVirtualCost = 1500;
  const crmCost = 1000 + (150 * agents);
  const marketingCost = 3000;
  const cotizadorCost = 1000 + (100 * agents);
  const digitalCardCost = 99 * agents;
  const aiGeneratorCost = 800;
  const academyCost = 1200;

  const totalAlternativeCost = assistantVirtualCost + crmCost + marketingCost + cotizadorCost + digitalCardCost + aiGeneratorCost + academyCost;
  const totalSavings = totalAlternativeCost - aacomCost;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      maximumFractionDigits: 0
    }).format(val);
  };

  const featureTabs = [
    {
      id: "cotizador",
      title: "Multi-Cotizador de Vida",
      description: "Genera cotizaciones profesionales y proyecciones de ahorro y retiro para tus clientes en segundos.",
      details: [
        "Cotizaciones estructuradas de Vida con rendimientos.",
        "Proyecciones personalizadas de ahorro a largo plazo.",
        "Exportación instantánea a PDF con la marca de tu promotoría."
      ],
      points: "Agiliza el tiempo de respuesta y aumenta tus ventas de productos de Vida hasta un 40%."
    },
    {
      id: "marketing",
      title: "Asistente Virtual e IA",
      description: "Asistente inteligente para resolver dudas sobre condiciones de pólizas y generador de posts automáticos.",
      details: [
        "Asistente Virtual IA entrenada para atender consultas técnicas de tus agentes.",
        "Generador de copys persuasivos para prospección e imágenes de marketing.",
        "Alineado con el estilo gráfico y discursivo de tu promotoría."
      ],
      points: "Ahorra miles de pesos en consultoría interna, diseñadores y creadores de contenido."
    },
    {
      id: "cartera",
      title: "Control de Cartera Viva",
      description: "Monitorea la retención, renovaciones y primas netas sin depender de hojas de cálculo obsoletas.",
      details: [
        "Línea de tiempo interactiva con alertas de renovación (30, 45, 60 días).",
        "Control de primas anuales promedio y comisiones estimadas.",
        "Directorio telefónico y perfiles completos de clientes."
      ],
      points: "Cero pólizas perdidas o vencidas por falta de seguimiento."
    },
    {
      id: "desempeno",
      title: "Tableros PEA / PRP y 25 Puntos",
      description: "Monitorea la prospección diaria de tus agentes con la bitácora de 25 puntos y evaluaciones PEA/PRP/JEP.",
      details: [
        "Seguimiento visual del avance de metas diarias por puntos de prospección.",
        "Compromisos semanales documentados y firmados digitalmente.",
        "Análisis de brechas asistido por IA para guiar a tus agentes."
      ],
      points: "Promotoría moderna y transparente con toma de decisiones guiada por datos."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 selection:bg-teal-500 selection:text-white overflow-x-hidden">
      
      {/* Background Aurora */}
      <div className="absolute inset-0 w-full h-[150vh] z-0 overflow-hidden opacity-40 pointer-events-none">
        <SoftAurora 
          color1="#10B981"
          color2="#6366F1"
          brightness={1.5}
          speed={0.8}
        />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-slate-950/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-r from-teal-500 to-indigo-600 text-white p-2 rounded-xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <span className="text-2xl font-black tracking-tight text-white">AACOM<span className="text-teal-400">Soft</span></span>
          </div>
          <Link href="/login">
            <Button className="bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-600 hover:to-indigo-700 text-white font-bold px-6 py-2 rounded-full shadow-lg shadow-teal-500/20 transition-all hover:scale-[1.03]">
              Iniciar Sesión
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 z-10">
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <Badge className="bg-teal-500/10 text-teal-400 border border-teal-500/25 px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase mb-6 animate-pulse">
            El Ecosistema Todo en Uno para Seguros
          </Badge>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white mb-8 leading-tight">
            Digitaliza tu Promotoría con{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-emerald-400 to-indigo-400">
              Poder Tecnológico
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Deja atrás las herramientas fragmentadas y los costos redundantes. AACOMSoft reúne CRM, multi-cotizador de Vida, asistente de IA y academia en una sola consola premium.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link href="/login">
              <Button size="lg" className="bg-teal-500 hover:bg-teal-600 text-white font-black h-14 px-8 rounded-full shadow-xl shadow-teal-500/10 text-lg w-full sm:w-auto">
                Solicitar Demo Gratuita <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <a href="#calculadora">
              <Button size="lg" variant="outline" className="h-14 px-8 rounded-full border-white/10 bg-white/5 hover:bg-white/10 text-white font-bold text-lg w-full sm:w-auto">
                Ver Tabla de Ahorros
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Interactive Savings Simulator (Calculadora ROI) */}
      <section id="calculadora" className="py-20 relative z-10">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-4">¿Cuánto dinero te estás ahorrando?</h2>
            <p className="text-slate-400 max-w-lg mx-auto">Compara el costo de usar herramientas individuales versus la plataforma integrada de AACOMSoft.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            
            {/* Control & Details (8 Columns) */}
            <div className="lg:col-span-7 bg-white/5 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-white/10 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-white">Número de Agentes / Usuarios</h3>
                  <span className="text-3xl font-black text-teal-400 bg-teal-500/10 border border-teal-500/20 px-4 py-1 rounded-xl">
                    {agents} {agents === 1 ? "Agente" : "Agentes"}
                  </span>
                </div>
                
                {/* Custom Styled Slider */}
                <div className="mb-10">
                  <input 
                    type="range" 
                    min="1" 
                    max="100" 
                    value={agents}
                    onChange={(e) => setAgents(Number(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-400"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-2 font-mono">
                    <span>1 Agente</span>
                    <span>50 Agentes</span>
                    <span>100 Agentes</span>
                  </div>
                </div>

                {/* Savings Breakdown Table */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Desglose de Costos de Mercado (Estimados)</h4>
                  
                  <div className="divide-y divide-white/5 text-sm">
                    <div className="flex justify-between py-2">
                      <span className="text-slate-400">Asistente Virtual Inteligente (IA)</span>
                      <span className="text-white font-semibold font-mono">{formatCurrency(assistantVirtualCost)} / mes</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-slate-400">Diseño & Contenido de Mkt (Agencia o Diseñador)</span>
                      <span className="text-white font-semibold font-mono">{formatCurrency(marketingCost)} / mes</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-slate-400">CRM de Seguros Especializado</span>
                      <span className="text-white font-semibold font-mono">{formatCurrency(crmCost)} / mes</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-slate-400">Multi-Cotizador Externo de Vida</span>
                      <span className="text-white font-semibold font-mono">{formatCurrency(cotizadorCost)} / mes</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-slate-400">Tarjetas de Presentación Digitales (NFC/Web)</span>
                      <span className="text-white font-semibold font-mono">{formatCurrency(digitalCardCost)} / mes</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-slate-400">IA de Redacción e Imágenes (Suscripciones varias)</span>
                      <span className="text-white font-semibold font-mono">{formatCurrency(aiGeneratorCost)} / mes</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-slate-400">Preparación / Simulador de Examen Cédula A</span>
                      <span className="text-white font-semibold font-mono">{formatCurrency(academyCost)} / mes</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left bg-slate-900/50 p-4 rounded-2xl border border-white/5">
                <div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Costo Alternativo Combinado</div>
                  <div className="text-2xl font-black text-red-400 font-mono mt-1">{formatCurrency(totalAlternativeCost)} <span className="text-xs text-slate-400 font-medium">/ mes</span></div>
                </div>
                <div className="h-6 w-[1px] bg-white/10 hidden sm:block"></div>
                <div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Plan AACOMSoft Base + Extras</div>
                  <div className="text-2xl font-black text-white font-mono mt-1">{formatCurrency(aacomCost)} <span className="text-xs text-slate-400 font-medium">/ mes</span></div>
                </div>
              </div>
            </div>

            {/* Savings Result Card (4 Columns) */}
            <div className="lg:col-span-5 bg-gradient-to-b from-teal-500/20 via-indigo-900/10 to-slate-900 rounded-3xl p-8 border border-teal-500/20 flex flex-col justify-between items-center text-center shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-transparent pointer-events-none"></div>
              
              <div className="w-16 h-16 bg-teal-500/10 text-teal-400 border border-teal-500/20 rounded-2xl flex items-center justify-center mb-6">
                <Sparkles className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-300 mb-2">Tu Ahorro Neto Mensual</h3>
                <div className="text-5xl md:text-6xl font-black text-teal-400 tracking-tight font-mono mb-4">
                  {formatCurrency(totalSavings)}
                </div>
                <p className="text-sm text-slate-400 leading-relaxed px-4">
                  Equivalente a un ahorro anual de <strong className="text-white font-mono">{formatCurrency(totalSavings * 12)} MXN</strong> en herramientas redundantes.
                </p>
              </div>

              <div className="w-full mt-8 space-y-3">
                <div className="bg-slate-900/80 backdrop-blur border border-white/5 py-3 px-6 rounded-2xl text-xs font-bold text-teal-300">
                  ⚡ Todo incluido en tu suscripción mensual
                </div>
                <Link href="/login" className="block w-full">
                  <Button className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold h-12 rounded-xl shadow-lg shadow-teal-500/20 transition-all hover:scale-[1.02]">
                    Registrar mi Promotoría
                  </Button>
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Feature Tour (Miniaturas de Pantallas Reales e Interactivas) */}
      <section className="py-20 bg-slate-900/30 border-y border-white/5 relative z-10">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-16">
            <Badge className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase mb-3">
              ¿Qué obtienes?
            </Badge>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">Explora el Sistema</h2>
            <p className="text-slate-400 max-w-md mx-auto">Una suite unificada para maximizar el desempeño de tu equipo de ventas.</p>
          </div>

          {/* Tabs header */}
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {featureTabs.map((tab) => (
              <Button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                variant="ghost"
                className={`px-5 py-6 rounded-2xl text-sm font-bold transition-all gap-2 ${
                  activeTab === tab.id 
                    ? "bg-gradient-to-r from-teal-500/15 to-indigo-500/15 border border-teal-500/30 text-white shadow-lg" 
                    : "text-slate-400 border border-transparent hover:text-slate-200"
                }`}
              >
                {tab.id === "cotizador" && <Wallet className="w-4 h-4" />}
                {tab.id === "marketing" && <MessageSquare className="w-4 h-4" />}
                {tab.id === "cartera" && <Database className="w-4 h-4" />}
                {tab.id === "desempeno" && <TrendingUp className="w-4 h-4" />}
                {tab.title.split(" ")[0]}
              </Button>
            ))}
          </div>

          {/* Active Tab Details */}
          {featureTabs.map((tab) => {
            if (tab.id !== activeTab) return null;
            return (
              <div key={tab.id} className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-md">
                
                {/* Details (7 columns) */}
                <div className="md:col-span-7 space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">{tab.title}</h3>
                    <p className="text-slate-400 leading-relaxed text-sm">{tab.description}</p>
                  </div>

                  <ul className="space-y-3">
                    {tab.details.map((detail, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm text-slate-300">
                        <Check className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="bg-slate-900/60 p-4 rounded-2xl border border-white/5 flex items-start gap-3">
                    <Zap className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5 animate-pulse" />
                    <div>
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Impacto en la Promotoría</div>
                      <p className="text-sm text-slate-200 mt-1">{tab.points}</p>
                    </div>
                  </div>
                </div>

                {/* Visual Interactive Screen Mockups (5 columns) */}
                <div className="md:col-span-5 bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl border border-white/10 p-5 min-h-[300px] flex flex-col justify-between relative overflow-hidden shadow-2xl">
                  
                  {/* Top Bar simulating real App */}
                  <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500/80"></div>
                    </div>
                    <div className="text-[10px] uppercase font-mono tracking-widest text-slate-500">
                      aacomsoft.com/app
                    </div>
                  </div>
                  
                  {/* Dynamic Module Interface */}
                  <div className="flex-1 flex flex-col justify-center">
                    {activeTab === "cotizador" && (
                      <div className="space-y-3 text-xs">
                        <div className="text-center font-bold text-slate-200 mb-2">Simulador de Ahorro / Retiro</div>
                        <div className="bg-white/5 p-2.5 rounded-xl border border-white/5 space-y-2">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Ahorro Mensual:</span>
                            <span className="text-teal-400 font-mono font-bold">$2,500 MXN</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Plazo Elegido:</span>
                            <span className="text-indigo-400 font-bold">25 Años</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Total Proyectado:</span>
                            <span className="text-white font-mono font-bold">$1,894,500 MXN</span>
                          </div>
                        </div>
                        <Button size="sm" className="w-full bg-teal-500 text-white font-bold h-8 rounded-lg text-[10px]">
                          Generar Proyección PDF
                        </Button>
                      </div>
                    )}

                    {activeTab === "marketing" && (
                      <div className="space-y-3 text-[11px]">
                        <div className="bg-slate-900 p-2.5 rounded-xl border border-teal-500/20 text-slate-300">
                          <div className="font-bold text-teal-400 mb-1">🤖 Asistente Virtual:</div>
                          "Carlos, las tarifas de comisión para este plan de Vida son del 40% en primer año y 5% de conservación..."
                        </div>
                        <div className="bg-white/5 p-2 rounded-xl border border-white/5 flex items-center justify-between">
                          <span className="text-slate-400">Crear post de prospección</span>
                          <Badge className="bg-indigo-500/20 text-indigo-300 border-none text-[9px]">Listo</Badge>
                        </div>
                      </div>
                    )}

                    {activeTab === "cartera" && (
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between items-center p-2 rounded-lg bg-white/5 border border-white/5">
                          <div>
                            <div className="font-bold text-slate-200">Montserrat Ruiz</div>
                            <div className="text-[9px] text-slate-400">Póliza Vida Individual</div>
                          </div>
                          <Badge className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 text-[9px]">Vence 12d</Badge>
                        </div>
                        <div className="flex justify-between items-center p-2 rounded-lg bg-white/5 border border-white/5">
                          <div>
                            <div className="font-bold text-slate-200">Carlos Pérez</div>
                            <div className="text-[9px] text-slate-400">Póliza Retiro Ahorro</div>
                          </div>
                          <Badge className="bg-teal-500/10 text-teal-400 border border-teal-500/20 text-[9px]">Vence 45d</Badge>
                        </div>
                      </div>
                    )}

                    {activeTab === "desempeno" && (
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between items-center bg-white/5 p-2 rounded-xl border border-white/5">
                          <span className="text-slate-300">Montserrat Ruiz</span>
                          <span className="font-mono font-bold text-teal-400">28 Puntos (Meta ✓)</span>
                        </div>
                        <div className="flex justify-between items-center bg-white/5 p-2 rounded-xl border border-white/5">
                          <span className="text-slate-300">Carlos Pérez</span>
                          <span className="font-mono font-bold text-yellow-400">15 Puntos</span>
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-400 px-1 pt-1 font-mono">
                          <span>PEA: 85%</span>
                          <span>PRP: Activo</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Decorative Footer */}
                  <div className="pt-2 border-t border-white/5 mt-3 flex justify-between items-center text-[8px] text-slate-500 font-mono">
                    <span>SEGUROS AACOM</span>
                    <span>PRODUCCIÓN V1.2</span>
                  </div>
                </div>

              </div>
            );
          })}

        </div>
      </section>

      {/* Competitor Comparison Matrix */}
      <section className="py-20 relative z-10">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-16">
            <Badge className="bg-teal-500/10 text-teal-400 border border-teal-500/25 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase mb-3">
              ¿Por qué nosotros?
            </Badge>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">Matriz Comparativa</h2>
            <p className="text-slate-400 max-w-md mx-auto">Vence la ineficiencia de usar múltiples aplicaciones individuales.</p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-900/80 border-b border-white/10">
                    <th className="p-4 sm:p-5 font-bold text-white text-base">Beneficio / Módulo</th>
                    <th className="p-4 sm:p-5 text-center font-black text-teal-400 text-base bg-teal-500/5">
                      AACOMSoft
                    </th>
                    <th className="p-4 sm:p-5 text-center text-slate-400 font-medium">Excel / Manual</th>
                    <th className="p-4 sm:p-5 text-center text-slate-400 font-medium">Monday.com</th>
                    <th className="p-4 sm:p-5 text-center text-slate-400 font-medium">Salesforce</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <tr>
                    <td className="p-4 sm:p-5 font-bold text-white">Multi-Cotizador de Vida & Retiro</td>
                    <td className="p-4 sm:p-5 text-center bg-teal-500/5"><Check className="mx-auto w-5 h-5 text-teal-400" /></td>
                    <td className="p-4 sm:p-5 text-center"><X className="mx-auto w-4 h-4 text-slate-600" /></td>
                    <td className="p-4 sm:p-5 text-center"><X className="mx-auto w-4 h-4 text-slate-600" /></td>
                    <td className="p-4 sm:p-5 text-center"><X className="mx-auto w-4 h-4 text-slate-600" /></td>
                  </tr>
                  <tr>
                    <td className="p-4 sm:p-5 font-bold text-white">Asistente Virtual Inteligente (IA)</td>
                    <td className="p-4 sm:p-5 text-center bg-teal-500/5"><Check className="mx-auto w-5 h-5 text-teal-400" /></td>
                    <td className="p-4 sm:p-5 text-center"><X className="mx-auto w-4 h-4 text-slate-600" /></td>
                    <td className="p-4 sm:p-5 text-center"><X className="mx-auto w-4 h-4 text-slate-600" /></td>
                    <td className="p-4 sm:p-5 text-center"><X className="mx-auto w-4 h-4 text-slate-600" /></td>
                  </tr>
                  <tr>
                    <td className="p-4 sm:p-5 font-bold text-white">Academia Simulador Cédula A</td>
                    <td className="p-4 sm:p-5 text-center bg-teal-500/5"><Check className="mx-auto w-5 h-5 text-teal-400" /></td>
                    <td className="p-4 sm:p-5 text-center"><X className="mx-auto w-4 h-4 text-slate-600" /></td>
                    <td className="p-4 sm:p-5 text-center"><X className="mx-auto w-4 h-4 text-slate-600" /></td>
                    <td className="p-4 sm:p-5 text-center"><X className="mx-auto w-4 h-4 text-slate-600" /></td>
                  </tr>
                  <tr>
                    <td className="p-4 sm:p-5 font-bold text-white">Tarjetas Digitales Integradas</td>
                    <td className="p-4 sm:p-5 text-center bg-teal-500/5"><Check className="mx-auto w-5 h-5 text-teal-400" /></td>
                    <td className="p-4 sm:p-5 text-center"><X className="mx-auto w-4 h-4 text-slate-600" /></td>
                    <td className="p-4 sm:p-5 text-center"><X className="mx-auto w-4 h-4 text-slate-600" /></td>
                    <td className="p-4 sm:p-5 text-center"><X className="mx-auto w-4 h-4 text-slate-600" /></td>
                  </tr>
                  <tr>
                    <td className="p-4 sm:p-5 font-bold text-white">Bitácora de Métricas de 25 Puntos</td>
                    <td className="p-4 sm:p-5 text-center bg-teal-500/5"><Check className="mx-auto w-5 h-5 text-teal-400" /></td>
                    <td className="p-4 sm:p-5 text-center text-slate-400 font-medium">Manual (Lento)</td>
                    <td className="p-4 sm:p-5 text-center text-slate-400 font-medium">Manual (Lento)</td>
                    <td className="p-4 sm:p-5 text-center"><X className="mx-auto w-4 h-4 text-slate-600" /></td>
                  </tr>
                  <tr>
                    <td className="p-4 sm:p-5 font-bold text-white">Evaluaciones de Desempeño PEA/PRP/JEP</td>
                    <td className="p-4 sm:p-5 text-center bg-teal-500/5"><Check className="mx-auto w-5 h-5 text-teal-400" /></td>
                    <td className="p-4 sm:p-5 text-center"><X className="mx-auto w-4 h-4 text-slate-600" /></td>
                    <td className="p-4 sm:p-5 text-center text-slate-400 font-medium">Parcial (Manual)</td>
                    <td className="p-4 sm:p-5 text-center text-slate-400 font-medium">Parcial (Costoso)</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            {/* Note on Salesforce Cost */}
            <div className="bg-slate-900/60 p-6 border-t border-white/10 text-xs text-slate-400 leading-relaxed">
              <strong className="text-white">Nota de Costo Estimado:</strong> Salesforce, para poder implementar flujos y reportes equivalentes de CRM y Cartera (sin incluir módulos inexistentes como el Multi-Cotizador de Vida, bitácora de 25 puntos, tarjetas de presentación digitales o simulador de Cédula A), requiere un costo estimado inicial desde <strong>$12,000 MXN mensuales</strong> fijos + un cobro recurrente promedio de <strong>$500 MXN mensuales</strong> por cada licencia de usuario activa.
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 py-12 border-t border-white/5 relative z-10 text-center text-slate-500 text-sm">
        <div className="container mx-auto px-4 space-y-4">
          <div className="flex justify-center items-center gap-2">
            <div className="bg-teal-600 text-white p-1 rounded-lg">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="text-lg font-bold text-white">AACOMSoft</span>
          </div>
          <p>&copy; {new Date().getFullYear()} AACOM. Todos los derechos reservados.</p>
          <p className="text-xs">Aacomsoft es una empresa de grupo AACOM</p>
        </div>
      </footer>

    </div>
  );
}
