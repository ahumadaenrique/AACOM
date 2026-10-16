'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, ArrowRight, PlayCircle } from 'lucide-react';

export default function TipsPublicJoinPage() {
  const router = useRouter();
  const [code, setCode] = useState('');

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = code.trim().toUpperCase();
    if (!clean) return;
    router.push(`/tips/sala/${encodeURIComponent(clean)}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white text-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-md">
            <Sparkles className="w-6 h-6" />
          </div>
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-indigo-600 block">
            Taller Integral de Planeación y Seguridad
          </span>
          <h1 className="text-2xl font-black text-slate-900">Unirse a una Sala TIPS</h1>
          <p className="text-xs text-slate-500">
            Ingresa el código de 6 caracteres que aparece en la pantalla del expositor.
          </p>
        </div>

        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 text-center">
              Código de Sala
            </label>
            <input
              type="text"
              required
              maxLength={10}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Ej. A7K9M2"
              className="w-full rounded-2xl border-2 border-slate-200 focus:border-indigo-600 px-4 py-3.5 text-center font-mono text-2xl font-black tracking-widest uppercase outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={!code.trim()}
            className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-extrabold text-sm shadow-lg transition flex items-center justify-center gap-2"
          >
            Entrar al Taller en Vivo
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-4 border-t border-slate-100 text-center space-y-2">
          <p className="text-[11px] text-slate-500">
            ¿Eres asesor y deseas capacitar o recorrer los 8 pasos sin gastar créditos?
          </p>
          <Link
            href="/tips/sala/DEMO"
            className="w-full py-2.5 px-4 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs inline-flex items-center justify-center gap-1.5 transition"
          >
            <PlayCircle className="w-4 h-4" />
            Probar Modo Demo Interactivo (Sin Créditos)
          </Link>
        </div>
      </div>
    </div>
  );
}
