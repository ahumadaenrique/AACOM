import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShieldCheck, Mail, Phone } from 'lucide-react';
import { SITE_CONFIG } from '@/config/site';

export const metadata: Metadata = {
  title: 'Políticas de Reembolso y Cancelación · aacomsoft',
  description: 'Términos y condiciones de reembolso y cancelación del servicio SaaS aacomsoft para promotorías y agencias de seguros.',
};

export default function ReembolsoPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-teal-100 selection:text-teal-900">
      
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/inicio">
              <Button variant="ghost" size="icon" className="shrink-0 text-slate-500">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <div className="bg-teal-600 text-white p-1.5 rounded-lg shadow-sm">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="text-xl font-black tracking-tight text-slate-900">{SITE_CONFIG.brandName}</span>
            </div>
          </div>

          <Link href="/demo">
            <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-sm">
              Agendar demo
            </Button>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-white p-8 md:p-12 rounded-3xl border shadow-sm space-y-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-950 mb-2">
              POLÍTICAS DE REEMBOLSO Y CANCELACIÓN
            </h1>
            <p className="text-sm font-semibold text-teal-600">
              aacomsoft · Soluciones tecnológicas para promotorías y agencias de seguros
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Última actualización: Octubre 2026
            </p>
          </div>

          <div className="space-y-8 text-slate-600 leading-relaxed text-sm">
            
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900 border-b pb-2">
                1. Naturaleza del Servicio y Suscripción SaaS
              </h2>
              <p>
                aacomsoft es una solución de software como servicio (SaaS) en la nube dirigida a promotorías, directores de agencia y agentes de seguros. Al contratar el servicio, el suscriptor adquiere acceso a las funcionalidades contratadas (gestión de actividad comercial, formación, cotizador y control de cartera) bajo un esquema de facturación mensual o anual recurrente.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900 border-b pb-2">
                2. Política de Cancelación
              </h2>
              <p>
                El suscriptor puede solicitar la cancelación de su suscripción en cualquier momento enviando un correo a <a href={`mailto:${SITE_CONFIG.supportEmail}`} className="text-teal-600 font-semibold">{SITE_CONFIG.supportEmail}</a> o a través del panel de administración de su agencia.
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  La cancelación surtirá efecto al término del periodo de facturación en curso.
                </li>
                <li>
                  El acceso a la plataforma continuará activo hasta la fecha de corte del ciclo ya cubierto.
                </li>
                <li>
                  No existen plazos forzosos para el plan mensual estándar; el suscriptor es libre de cancelar sin penalización.
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900 border-b pb-2">
                3. Condiciones de Reembolso
              </h2>
              <p>
                Dado que los recursos en la nube y el licenciamiento se aprovisionan de inmediato tras la activación, los cobros recurrentes de mensualidades ya iniciadas no son reembolsables salvo en los siguientes supuestos:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Cargos duplicados o errores de facturación:</strong> Si por una falla técnica atribuible a la pasarela de pagos se realiza un cobro doble o indebido, se reembolsará el 100% del cargo excedente tras la notificación del cliente.
                </li>
                <li>
                  <strong>Interrupción crítica de servicio prolongada:</strong> Si la plataforma presentara una indisponibilidad imputable a aacomsoft por más de 72 horas continuas, el cliente podrá solicitar un crédito prorrateado aplicable a su siguiente factura o el reembolso equivalente a dicho periodo.
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900 border-b pb-2">
                4. Procedimiento para Solicitar Aclaraciones o Devoluciones
              </h2>
              <p>
                Para cualquier aclaración sobre facturación o solicitud de devolución:
              </p>
              <ol className="list-decimal pl-5 space-y-2">
                <li>
                  Envía un correo electrónico a <a href={`mailto:${SITE_CONFIG.supportEmail}`} className="text-teal-600 font-semibold">{SITE_CONFIG.supportEmail}</a> indicando el nombre de tu promotoría, correo registrado y comprobante de cargo.
                </li>
                <li>
                  Nuestro equipo de soporte revisará la solicitud y emitirá respuesta en un plazo no mayor a 3 días hábiles.
                </li>
                <li>
                  En caso de proceder el reembolso, este será emitido a través del mismo método de pago original en los tiempos fijados por la institución bancaria emisora (típicamente de 5 a 10 días hábiles).
                </li>
              </ol>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900 border-b pb-2">
                5. Contacto
              </h2>
              <p>
                Para dudas sobre esta política o tu facturación:
              </p>
              <div className="space-y-1 text-slate-700">
                <p>📧 Correo: <a href={`mailto:${SITE_CONFIG.supportEmail}`} className="text-teal-600 font-semibold">{SITE_CONFIG.supportEmail}</a></p>
                <p>📞 Teléfono / WhatsApp: <a href={`tel:${SITE_CONFIG.phoneRaw}`} className="text-teal-600 font-semibold">{SITE_CONFIG.phone}</a></p>
                <p>📍 Ciudad de México, México</p>
              </div>
            </section>

          </div>
        </div>
      </main>
    </div>
  );
}
