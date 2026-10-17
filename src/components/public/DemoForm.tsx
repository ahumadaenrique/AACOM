'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { SITE_CONFIG } from '@/config/site';
import { CheckCircle2, Loader2, ArrowRight, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';

const INSURERS_OPTIONS = [
  'SMNYL',
  'MetLife',
  'Prudential',
  'Insignia Life',
  'GNP',
  'AXA',
  'Otra'
];

const AGENTS_COUNT_OPTIONS = [
  '1–10 agentes',
  '11–25 agentes',
  '26–50 agentes',
  '51–100 agentes',
  'Más de 100 agentes'
];

interface DemoFormProps {
  originPage?: string;
}

export function DemoForm({ originPage = '/inicio' }: DemoFormProps) {
  const [fullName, setFullName] = useState('');
  const [agencyName, setAgencyName] = useState('');
  const [selectedInsurers, setSelectedInsurers] = useState<string[]>([]);
  const [otherInsurer, setOtherInsurer] = useState('');
  const [city, setCity] = useState('');
  const [agentsCount, setAgentsCount] = useState(AGENTS_COUNT_OPTIONS[0]);
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [honeypot, setHoneypot] = useState('');

  // UTMs
  const [utms, setUtms] = useState({
    utmSource: '',
    utmMedium: '',
    utmCampaign: '',
    utmContent: '',
    utmTerm: ''
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Capture UTMs from URL or sessionStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const source = params.get('utm_source') || sessionStorage.getItem('utm_source') || '';
      const medium = params.get('utm_medium') || sessionStorage.getItem('utm_medium') || '';
      const campaign = params.get('utm_campaign') || sessionStorage.getItem('utm_campaign') || '';
      const content = params.get('utm_content') || sessionStorage.getItem('utm_content') || '';
      const term = params.get('utm_term') || sessionStorage.getItem('utm_term') || '';

      if (source) sessionStorage.setItem('utm_source', source);
      if (medium) sessionStorage.setItem('utm_medium', medium);
      if (campaign) sessionStorage.setItem('utm_campaign', campaign);
      if (content) sessionStorage.setItem('utm_content', content);
      if (term) sessionStorage.setItem('utm_term', term);

      setUtms({
        utmSource: source,
        utmMedium: medium,
        utmCampaign: campaign,
        utmContent: content,
        utmTerm: term
      });
    }
  }, []);

  const toggleInsurer = (ins: string) => {
    setSelectedInsurers((prev) =>
      prev.includes(ins) ? prev.filter((i) => i !== ins) : [...prev, ins]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!fullName.trim() || fullName.trim().length < 3) {
      setErrorMsg('Por favor ingrese el nombre completo (mínimo 3 caracteres).');
      return;
    }
    if (!agencyName.trim() || agencyName.trim().length < 2) {
      setErrorMsg('Por favor ingrese el nombre de la promotoría o agencia.');
      return;
    }
    if (selectedInsurers.length === 0) {
      setErrorMsg('Seleccione al menos una aseguradora con la que opera la promotoría.');
      return;
    }
    if (!city.trim()) {
      setErrorMsg('Por favor ingrese la ciudad sede de la promotoría.');
      return;
    }
    const cleanPhone = whatsapp.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setErrorMsg('Por favor ingrese un número de WhatsApp válido (10 dígitos).');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Por favor ingrese un correo electrónico válido.');
      return;
    }
    if (!privacyAccepted) {
      setErrorMsg('Es necesario aceptar el aviso de privacidad para continuar.');
      return;
    }

    setLoading(true);

    try {
      const finalInsurers = selectedInsurers.map((i) =>
        i === 'Otra' && otherInsurer.trim() ? `Otra (${otherInsurer.trim()})` : i
      );

      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          agencyName,
          insurers: finalInsurers,
          city,
          agentsCount,
          whatsapp: cleanPhone,
          email,
          privacyAccepted,
          honeypot,
          originPage,
          ...utms
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al enviar la solicitud.');
      }

      setSubmitted(true);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Ocurrió un error al procesar la solicitud. Por favor intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-xl border border-slate-200 text-center animate-in fade-in zoom-in-95 duration-300">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
          <CheckCircle2 className="w-9 h-9" />
        </div>
        <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mb-3 tracking-tight">
          ¡Solicitud Recibida con Éxito!
        </h3>
        <p className="text-slate-600 max-w-md mx-auto mb-6 leading-relaxed text-sm sm:text-base">
          Gracias, <strong>{fullName}</strong>. El equipo ejecutivo establecerá contacto a la brevedad en días hábiles para coordinar la sesión demostrativa de 20 minutos para <strong>{agencyName}</strong>.
        </p>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-500 mb-8 max-w-md mx-auto space-y-1">
          <p>✓ Sesión ejecutiva de 20 minutos con entorno demostrativo</p>
          <p>✓ Revisión de arquitectura de seguridad y convenio de confidencialidad</p>
          <p>✓ Sin compromiso comercial ni requerimiento de tarjeta</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href={SITE_CONFIG.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold rounded-xl shadow-lg transition-all"
          >
            <span>Atención directa e inmediata por WhatsApp</span>
          </a>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-3xl p-6 sm:p-10 shadow-xl border border-slate-200 space-y-5 text-left"
    >
      {/* Honeypot field (hidden from humans) */}
      <div className="hidden" aria-hidden="true">
        <input
          type="text"
          name="honeypot"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Row 1: Nombre & Promotoría */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Nombre Completo *
          </label>
          <input
            type="text"
            required
            placeholder="Ej. Roberto Sánchez"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm text-slate-900 bg-slate-50/50"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Promotoría o Agencia *
          </label>
          <input
            type="text"
            required
            placeholder="Ej. Promotoría Atlas Seguros"
            value={agencyName}
            onChange={(e) => setAgencyName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm text-slate-900 bg-slate-50/50"
          />
        </div>
      </div>

      {/* Row 2: Aseguradoras con las que opera */}
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
          Aseguradora(s) con las que opera la promotoría *
        </label>
        <div className="flex flex-wrap gap-2 pt-1">
          {INSURERS_OPTIONS.map((ins) => {
            const isSelected = selectedInsurers.includes(ins);
            return (
              <button
                key={ins}
                type="button"
                onClick={() => toggleInsurer(ins)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  isSelected
                    ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                    : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                }`}
              >
                {isSelected ? '✓ ' : '+ '}
                {ins}
              </button>
            );
          })}
        </div>
        {selectedInsurers.includes('Otra') && (
          <input
            type="text"
            placeholder="Especifique otra aseguradora"
            value={otherInsurer}
            onChange={(e) => setOtherInsurer(e.target.value)}
            className="mt-2 w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm text-slate-900 bg-slate-50/50"
          />
        )}
      </div>

      {/* Row 3: Ciudad & Número de agentes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Ciudad Sede *
          </label>
          <input
            type="text"
            required
            placeholder="Ej. Guadalajara, CDMX, Monterrey"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm text-slate-900 bg-slate-50/50"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Tamaño de la Fuerza de Ventas *
          </label>
          <select
            value={agentsCount}
            onChange={(e) => setAgentsCount(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm text-slate-900 bg-slate-50/50"
          >
            {AGENTS_COUNT_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Row 4: WhatsApp & Correo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            WhatsApp / Teléfono Directo *
          </label>
          <input
            type="tel"
            inputMode="tel"
            required
            placeholder="10 dígitos (Ej. 55 1234 5678)"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm text-slate-900 bg-slate-50/50"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Correo Electrónico Corporativo *
          </label>
          <input
            type="email"
            inputMode="email"
            required
            placeholder="direccion@promotoria.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm text-slate-900 bg-slate-50/50"
          />
        </div>
      </div>

      {/* Checkbox Privacidad */}
      <div className="pt-2">
        <label className="flex items-start gap-3 cursor-pointer text-xs text-slate-600 leading-relaxed">
          <input
            type="checkbox"
            checked={privacyAccepted}
            onChange={(e) => setPrivacyAccepted(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 shrink-0"
          />
          <span>
            He leído y acepto el{' '}
            <Link href="/privacidad" target="_blank" className="text-teal-600 underline font-semibold hover:text-teal-700">
              Aviso de privacidad
            </Link>{' '}
            para el contacto ejecutivo y la coordinación de la sesión demostrativa de 20 minutos.
          </span>
        </label>
      </div>

      {/* Submit Button */}
      <div className="pt-3">
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 px-6 rounded-2xl bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white font-black text-base shadow-lg shadow-teal-900/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Procesando solicitud...</span>
            </>
          ) : (
            <>
              <span>Solicitar Sesión Demostrativa (20 min)</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>

      <p className="text-center text-[11px] text-slate-400">
        🔒 Información protegida bajo estándares de confidencialidad empresarial. Atención en días hábiles.
      </p>
    </form>
  );
}
