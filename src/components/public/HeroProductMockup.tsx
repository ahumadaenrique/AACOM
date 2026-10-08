'use client';

import React, { useState } from 'react';
import {
  TrendingUp,
  Award,
  Phone,
  ShieldCheck,
  Flame,
  Zap,
  CheckCircle2,
  Users,
  Clock,
  Sparkles,
  ArrowUpRight,
  Mic,
  Volume2
} from 'lucide-react';

export function HeroProductMockup() {
  const [activeTab, setActiveTab] = useState<'productividad' | 'simulador' | 'cartera'>('productividad');

  return (
    <div className="relative mx-auto max-w-5xl mt-12 group">
      
      {/* Background Glow Halo */}
      <div className="absolute -inset-1.5 bg-gradient-to-r from-teal-500 via-cyan-500 to-indigo-500 rounded-[2.5rem] blur-2xl opacity-30 group-hover:opacity-45 transition duration-1000 -z-10" />

      {/* Main Glassmorphism Window */}
      <div className="relative rounded-3xl bg-slate-900/90 border border-slate-700/70 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] backdrop-blur-2xl overflow-hidden text-left">
        
        {/* macOS Window Title Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
            <span className="ml-3 text-xs font-mono text-slate-400 hidden sm:inline">
              app.aacomsoft.com/dashboard — Promotoría Activa
            </span>
            <span className="ml-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
              Datos de ejemplo
            </span>
          </div>

          {/* Interactive Mockup Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('productividad')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'productividad'
                  ? 'bg-teal-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Productividad & Ranking
            </button>
            <button
              onClick={() => setActiveTab('simulador')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'simulador'
                  ? 'bg-teal-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Simulador con IA
            </button>
            <button
              onClick={() => setActiveTab('cartera')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'cartera'
                  ? 'bg-teal-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Cartera & Renovaciones
            </button>
          </div>
        </div>

        {/* Top KPI Metrics Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 border-b border-slate-800/80 bg-slate-950/40">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Producción del Mes</span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-black text-white">$1,840,250</span>
              <span className="text-[11px] font-bold text-emerald-400 flex items-center">
                <ArrowUpRight className="w-3 h-3" /> +16.4%
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Actividad Semanal</span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-black text-teal-300">94.8%</span>
              <span className="text-[11px] text-slate-400">meta cumplida</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Conservación Cartera</span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-black text-cyan-300">92.4%</span>
              <span className="text-[11px] text-emerald-400 font-bold">Excelente</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Agentes Activos</span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-black text-white">28 / 30</span>
              <span className="text-[11px] text-slate-400">reportando</span>
            </div>
          </div>
        </div>

        {/* Tab 1: Productividad & Ranking */}
        {activeTab === 'productividad' && (
          <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-12 gap-6 animate-in fade-in duration-300">
            {/* Left: Leaderboard */}
            <div className="md:col-span-7 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-black uppercase tracking-wider text-slate-200">
                    Ranking de Actividad por Puntos (Semana Actual)
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20">
                  En Vivo
                </span>
              </div>

              <div className="space-y-2.5">
                {/* 1er lugar */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 to-slate-900 border border-amber-500/30 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-xl bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center shadow">
                      1
                    </span>
                    <div>
                      <div className="font-bold text-white text-sm flex items-center gap-2">
                        <span>Karla De la Torre</span>
                        <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                          Senior
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">8 citas efectivas · 3 cierres · 4 referidos</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black text-amber-400 flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-orange-400" /> 185 Puntos
                    </div>
                    <span className="text-[10px] text-emerald-400 font-semibold">+650 XP</span>
                  </div>
                </div>

                {/* 2do lugar */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-xl bg-slate-800 text-slate-300 font-black text-xs flex items-center justify-center">
                      2
                    </span>
                    <div>
                      <div className="font-bold text-slate-200 text-sm">Diego Ramirez</div>
                      <span className="text-[11px] text-slate-400">6 citas efectivas · 2 cierres · 3 referidos</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black text-slate-200">142 Puntos</div>
                    <span className="text-[10px] text-emerald-400 font-semibold">+490 XP</span>
                  </div>
                </div>

                {/* 3er lugar */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-xl bg-slate-800 text-slate-300 font-black text-xs flex items-center justify-center">
                      3
                    </span>
                    <div>
                      <div className="font-bold text-slate-200 text-sm">Mariana Morales</div>
                      <span className="text-[11px] text-slate-400">5 citas efectivas · 2 cierres · 2 referidos</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black text-slate-200">118 Puntos</div>
                    <span className="text-[10px] text-emerald-400 font-semibold">+380 XP</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Daily Goal Tracker */}
            <div className="md:col-span-5 p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-400">
                  Meta Diaria de Actividad
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  100% Cumplida
                </span>
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Progreso del equipo hoy</span>
                  <strong className="text-white">28 / 30 pts prom.</strong>
                </div>
                <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
                  <div className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full w-full shadow-sm" />
                </div>
              </div>

              {/* Breakdown */}
              <div className="grid grid-cols-2 gap-2 pt-2 text-[11px]">
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
                  <span className="block text-slate-400">Llamadas</span>
                  <strong className="text-sm text-white">42 realizadas</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
                  <span className="block text-slate-400">Citas de Cierre</span>
                  <strong className="text-sm text-emerald-400">9 agendadas</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
                  <span className="block text-slate-400">Referidos</span>
                  <strong className="text-sm text-amber-400">14 nuevos</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
                  <span className="block text-slate-400">Pólizas Emitidas</span>
                  <strong className="text-sm text-cyan-400">5 hoy</strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Simulador con IA */}
        {activeTab === 'simulador' && (
          <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-12 gap-6 animate-in fade-in duration-300">
            <div className="md:col-span-7 space-y-4">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-400">
                    <Mic className="w-4 h-4 text-emerald-400 animate-pulse" />
                    <span>Llamada de Prospección en Vivo</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-slate-950 uppercase tracking-wider">
                    Conectada
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <div className="text-xs font-bold text-slate-300">
                    Prospecto: Héctor De la Garza (38 años, Director Comercial)
                  </div>
                  <p className="text-xs text-slate-400 italic">
                    "Ya tengo seguro con el trabajo y la verdad no tengo tiempo ahorita, mándame la información por correo."
                  </p>
                </div>

                {/* Animated Voice Wave Bars */}
                <div className="flex items-center justify-center gap-1 py-2">
                  <span className="w-1 h-3 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.1s]" />
                  <span className="w-1 h-6 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1 h-8 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.3s]" />
                  <span className="w-1 h-5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.15s]" />
                  <span className="w-1 h-7 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.25s]" />
                  <span className="w-1 h-4 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.35s]" />
                </div>
              </div>
            </div>

            <div className="md:col-span-5 p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Evaluación & Feedback del Coach
              </span>
              <div className="space-y-2 text-xs text-slate-300">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
                  <span>Manejo de objeción tiempo</span>
                  <span className="text-emerald-400 font-bold">Excelente (95%)</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
                  <span>Tono de voz y seguridad</span>
                  <span className="text-teal-400 font-bold">Adecuado (90%)</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
                  <span>Cierre de cita concreta</span>
                  <span className="text-emerald-400 font-bold">Logrado (+90 XP)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Cartera & Renovaciones */}
        {activeTab === 'cartera' && (
          <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-12 gap-6 animate-in fade-in duration-300">
            <div className="md:col-span-8 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Próximas Renovaciones Críticas
                </span>
                <span className="text-xs text-rose-400 font-bold">14 pólizas a 30 días</span>
              </div>

              <div className="space-y-2 text-xs text-slate-300">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div>
                    <strong className="block text-white">Roberto Palacios García</strong>
                    <span className="text-slate-400">Póliza: POL-98421 · Vida Individual</span>
                  </div>
                  <div className="text-right">
                    <span className="block font-bold text-amber-400">$64,200 MXN</span>
                    <span className="text-[10px] text-rose-400 font-bold">Vence en 18 días</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div>
                    <strong className="block text-white">Consultoría Logística del Norte</strong>
                    <span className="text-slate-400">Póliza: POL-77312 · Hombre Clave</span>
                  </div>
                  <div className="text-right">
                    <span className="block font-bold text-cyan-400">$182,000 MXN</span>
                    <span className="text-[10px] text-amber-400 font-bold">Vence en 34 días</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="md:col-span-4 p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-400">
                Control de Conservación
              </span>
              <p className="text-xs text-slate-400 leading-relaxed">
                Alertas automáticas en 30, 45 y 60 días para que tu equipo contacte a tiempo a cada asegurado y no pierda comisiones.
              </p>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
                <span className="text-[11px] text-slate-400 block">Prima Anualizada en Riesgo</span>
                <span className="text-lg font-black text-rose-400">$246,200 MXN</span>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Floating 3D Micro-Badges */}
      <div className="hidden lg:flex items-center gap-2 absolute -top-5 -left-6 px-4 py-2 rounded-2xl bg-slate-900/95 border border-slate-700 shadow-xl backdrop-blur-xl animate-bounce [animation-duration:4s]">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
        <span className="text-xs font-bold text-white">IA y Voz activa en tiempo real</span>
      </div>

      <div className="hidden lg:flex items-center gap-2 absolute -bottom-5 -right-6 px-4 py-2 rounded-2xl bg-slate-900/95 border border-slate-700 shadow-xl backdrop-blur-xl">
        <ShieldCheck className="w-4 h-4 text-teal-400" />
        <span className="text-xs font-bold text-slate-200">Conexión segura SSL & aislamiento por promotoría</span>
      </div>

    </div>
  );
}
