import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Home, Calendar } from 'lucide-react';
import { SITE_CONFIG } from '@/config/site';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4 selection:bg-teal-500 selection:text-white">
      <div className="max-w-md w-full text-center space-y-6">
        
        {/* Brand Logo */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 mb-2">
          <div className="bg-teal-500 text-white p-1 rounded-md">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <span className="text-sm font-black tracking-tight text-white">{SITE_CONFIG.brandName}</span>
        </div>

        {/* 404 Code & Badge */}
        <div className="relative">
          <div className="text-8xl sm:text-9xl font-black text-slate-800 tracking-widest select-none">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-teal-500/10 text-teal-400 border border-teal-500/20 backdrop-blur-sm">
              Página no encontrada
            </span>
          </div>
        </div>

        {/* Copy */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            No encontramos esta página
          </h1>
          <p className="text-slate-400 text-sm max-w-sm mx-auto leading-relaxed">
            Es posible que el enlace haya cambiado, haya expirado o ya no exista.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <Link href="/inicio" className="w-full sm:w-auto">
            <Button
              variant="outline"
              className="w-full sm:w-auto gap-2 bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white font-bold h-12 px-6 rounded-xl"
            >
              <Home className="w-4 h-4" />
              <span>Ir al inicio</span>
            </Button>
          </Link>

          <Link href="/demo" className="w-full sm:w-auto">
            <Button
              className="w-full sm:w-auto gap-2 bg-teal-600 hover:bg-teal-500 text-white font-bold h-12 px-6 rounded-xl shadow-lg shadow-teal-950/50"
            >
              <Calendar className="w-4 h-4" />
              <span>Agendar demo</span>
            </Button>
          </Link>
        </div>

        {/* Direct WhatsApp link */}
        <div className="pt-6 border-t border-slate-800 text-xs text-slate-500">
          ¿Buscabas algo específico?{' '}
          <a
            href={SITE_CONFIG.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-teal-400 hover:underline font-semibold"
          >
            Escríbenos por WhatsApp
          </a>
        </div>

      </div>
    </div>
  );
}
