"use client";

import React from "react";
import { ManualMockupType } from "./manualData";
import {
  CheckCircle2,
  MessageCircle,
  FileText,
  Sparkles,
  Plus,
  HeartPulse,
  Users,
  Bot,
  Send,
  ShieldCheck,
  TrendingUp,
  Star,
  RefreshCw,
  Award,
  Share2,
  QrCode,
  Download,
  LifeBuoy,
  BookOpen,
  Calendar,
  AlertCircle,
  Vote,
  Filter
} from "lucide-react";

export function ManualMockupPreview({ type }: { type: ManualMockupType }) {
  const BrowserChrome = ({ title, badge, children }: { title: string; badge?: string; children: React.ReactNode }) => (
    <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm overflow-hidden">
      <div className="bg-slate-900 text-white px-4 py-2.5 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span className="text-xs font-semibold text-slate-300 ml-2">{title}</span>
        </div>
        {badge && (
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
            {badge}
          </span>
        )}
      </div>
      <div className="p-4 md:p-6 bg-slate-50/60 dark:bg-zinc-900/40">{children}</div>
    </div>
  );

  switch (type) {
    case "cobros-recibos":
      return (
        <BrowserChrome title="Mi Cartera › Pestaña Cobros y Recibos" badge="Vista de Interfaz">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm">
                <AlertCircle className="w-3.5 h-3.5" /> En Gracia / Confirmar (4)
              </span>
              <span className="px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 text-xs font-semibold">
                Próximos 30 días (12)
              </span>
              <span className="px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 text-xs font-semibold">
                Pagados (29)
              </span>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 divide-y divide-slate-100 dark:divide-zinc-800">
              {[
                { poliza: "POL-88412 · GNP", ramo: "GMM Individual", vencimiento: "En periodo de gracia (hace 5 días)", monto: "$14,850 MXN", urgente: true },
                { poliza: "POL-30914 · Monterrey NYL", ramo: "Vida Individual (VPL)", vencimiento: "Por confirmar pago (ayer)", monto: "$32,400 MXN", urgente: true },
                { poliza: "POL-77120 · Quálitas", ramo: "Autos Amplia", vencimiento: "Vence en 3 días", monto: "$11,200 MXN", urgente: false }
              ].map((rec, i) => (
                <div key={i} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">{rec.poliza}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 font-medium">
                        {rec.ramo}
                      </span>
                    </div>
                    <p className={`text-xs mt-1 font-medium ${rec.urgente ? "text-amber-600 dark:text-amber-400" : "text-slate-500"}`}>
                      Cliente reservado · {rec.vencimiento} · <strong>{rec.monto}</strong>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold flex items-center gap-1.5">
                      <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                    </span>
                    <span className="px-3 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Marcar Pagado
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </BrowserChrome>
      );

    case "nueva-poliza":
      return (
        <BrowserChrome title="Mi Cartera › Formulario Nueva Póliza" badge="Modal Interactivo">
          <div className="max-w-xl mx-auto bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 p-4 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Registrar Nueva Póliza</h4>
                <p className="text-[11px] text-slate-500">Los campos marcados con * son obligatorios</p>
              </div>
              <span className="px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Autocompletar con PDF
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950">
                <span className="text-[10px] font-bold text-slate-500 block">Cliente / Contratante *</span>
                <span className="font-semibold text-slate-800 dark:text-zinc-200">Seleccionar o escribir cliente...</span>
              </div>
              <div className="p-2.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950">
                <span className="text-[10px] font-bold text-slate-500 block">Número de Póliza *</span>
                <span className="font-semibold text-slate-800 dark:text-zinc-200">Ej. GMM-902814</span>
              </div>
              <div className="p-2.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950">
                <span className="text-[10px] font-bold text-slate-500 block">Aseguradora *</span>
                <span className="font-semibold text-slate-800 dark:text-zinc-200">GNP / AXA / Seguros Monterrey...</span>
              </div>
              <div className="p-2.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950">
                <span className="text-[10px] font-bold text-slate-500 block">Ramo *</span>
                <span className="font-semibold text-teal-700 dark:text-teal-400">Vida Individual · PPR · GMM · Autos · Vida Grupo · Daños</span>
              </div>
              <div className="p-2.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950">
                <span className="text-[10px] font-bold text-slate-500 block">Producto / Plan & Inicio de Vigencia</span>
                <span className="font-semibold text-slate-800 dark:text-zinc-200">Vida Pagos Limitados · 15/10/2026</span>
              </div>
              <div className="p-2.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950">
                <span className="text-[10px] font-bold text-slate-500 block">Forma de Pago & Prima Anual MXN *</span>
                <span className="font-semibold text-slate-800 dark:text-zinc-200">Anual · $48,000.00 MXN</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-zinc-800">
              <span className="text-xs font-semibold text-teal-600 dark:text-teal-400">▾ Opciones avanzadas (UDI / Moneda extranjera)</span>
              <span className="px-4 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-bold">Guardar Póliza</span>
            </div>
          </div>
        </BrowserChrome>
      );

    case "mis-referidores":
      return (
        <BrowserChrome title="Menú Superior › Mis Referidores" badge="Vista de Interfaz">
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-600" /> Mis Referidores Asignados
                </h4>
                <p className="text-xs text-slate-500">Aliados comerciales dados de alta por el administrador en Admin › Referidores</p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">
                2 Activos
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { nombre: "Lic. Roberto Gómez (Contador aliado)", estado: "Activo", prospectos: "6 prospectos referidos este mes" },
                { nombre: "Dra. Elena Martínez (Médico especialista)", estado: "Activo", prospectos: "3 prospectos referidos este mes" }
              ].map((ref, idx) => (
                <div key={idx} className="p-3.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">{ref.nombre}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{ref.prospectos}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
                    {ref.estado}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </BrowserChrome>
      );

    case "adn-menu":
      return (
        <BrowserChrome title="Herramientas › ADN (Menú Principal)" badge="Vista de Interfaz">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
            <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border-2 border-teal-500/40 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-teal-50 dark:bg-teal-950 text-teal-600 flex items-center justify-center mb-3">
                  <HeartPulse className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Capturar Nuevo ADN</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Inicia un diagnóstico financiero y patrimonial digital con tu cliente en modalidad extendida, resumida o exprés.
                </p>
              </div>
              <span className="mt-4 inline-flex items-center justify-center px-4 py-2 rounded-lg bg-teal-600 text-white text-xs font-bold w-full">
                Iniciar captura →
              </span>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center mb-3">
                  <Users className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Mi Base de Clientes (ADNs)</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Consulta el historial completo de tus diagnósticos realizados, ingresos, egresos y dictámenes guardados.
                </p>
              </div>
              <span className="mt-4 inline-flex items-center justify-center px-4 py-2 rounded-lg bg-slate-900 dark:bg-zinc-800 text-white text-xs font-bold w-full">
                Ver mis diagnósticos →
              </span>
            </div>
          </div>
        </BrowserChrome>
      );

    case "tips-promotoria":
      return (
        <BrowserChrome title="Herramientas › TIPS › Toda mi Promotoría" badge="Vista de Interfaz">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-lg bg-slate-200/70 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 text-xs font-semibold">
                  Mis Talleres
                </span>
                <span className="px-3 py-1 rounded-lg bg-indigo-600 text-white text-xs font-bold">
                  Toda mi Promotoría
                </span>
              </div>
              <span className="text-xs text-slate-500">Sesiones de todos los asesores de la agencia</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { titulo: "Taller Patrimonial Empresas", asesor: "Asesor: Carlos M.", estado: "En curso · Paso 6/8", conectados: 18, calientes: 7 },
                { titulo: "Planeación Retiro Joven", asesor: "Asesora: Laura R.", estado: "Finalizada · Paso 8/8", conectados: 24, calientes: 11 }
              ].map((s, idx) => (
                <div key={idx} className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-slate-200 dark:border-zinc-800">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{s.titulo}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300">
                      {s.estado}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mb-3">{s.asesor}</p>
                  <div className="flex items-center justify-between text-xs border-t border-slate-100 dark:border-zinc-800 pt-2">
                    <span>Conectados: <strong>{s.conectados}</strong></span>
                    <span className="text-rose-600 font-bold">🔥 Leads Calientes: {s.calientes}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </BrowserChrome>
      );

    case "asistente-ia":
      return (
        <BrowserChrome title="Inteligencia Artificial Avanzada › Asistente" badge="Motor IA aacomsoft">
          <div className="max-w-2xl mx-auto bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-zinc-800 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Asistente Comercial y Técnico IA</h4>
                <p className="text-[11px] text-slate-500">Entrenado con los cuadernos, bonos y condiciones generales de tu promotoría</p>
              </div>
            </div>
            <div className="p-4 space-y-3 bg-slate-50/50 dark:bg-zinc-950/50">
              <div className="flex flex-wrap gap-1.5">
                {[
                  "¿Cuáles son los periodos de espera en GMM?",
                  "¿Cómo funciona el bono de cuaderno trimestral?",
                  " Argumentos para deducibilidad PPR Art. 151"
                ].map((q, i) => (
                  <span key={i} className="text-[11px] px-2.5 py-1 rounded-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 font-medium">
                    💬 {q}
                  </span>
                ))}
              </div>
              <div className="p-3 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900 text-xs text-slate-700 dark:text-zinc-300">
                <strong>Asistente IA:</strong> Con base en los lineamientos cargados por tu promotoría, el Plan Personal de Retiro (Art. 151 LISR) permite deducir hasta el 10% de los ingresos acumulables con tope de 5 UMAs anuales...
              </div>
              <div className="flex items-center gap-2 pt-1">
                <div className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-slate-400">
                  Escribe tu duda comercial o técnica aquí...
                </div>
                <span className="p-2 rounded-lg bg-indigo-600 text-white">
                  <Send className="w-4 h-4" />
                </span>
              </div>
              <p className="text-[10px] text-slate-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-500" /> Verifica siempre condiciones y montos contra los documentos oficiales.
              </p>
            </div>
          </div>
        </BrowserChrome>
      );

    case "admin-adn":
      return (
        <BrowserChrome title="Dashboard Admin › 14.4.4 Diagnóstico ADN" badge="Vista Administrador">
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white dark:bg-zinc-900 p-3 rounded-lg border border-slate-200 dark:border-zinc-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase">ADNs Realizados</span>
                <p className="text-lg font-black text-slate-900 dark:text-white">48</p>
              </div>
              <div className="bg-white dark:bg-zinc-900 p-3 rounded-lg border border-slate-200 dark:border-zinc-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Cierres Vinculados</span>
                <p className="text-lg font-black text-emerald-600">19</p>
              </div>
              <div className="bg-white dark:bg-zinc-900 p-3 rounded-lg border border-slate-200 dark:border-zinc-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Efectividad</span>
                <p className="text-lg font-black text-teal-600">39.5%</p>
              </div>
            </div>
            <div className="bg-white dark:bg-zinc-900 p-3 rounded-lg border border-slate-200 dark:border-zinc-800 flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-zinc-300 font-medium flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-teal-600" /> Filtros por mes, año y agente · Historial de ADN por cliente
              </span>
              <span className="text-teal-600 font-bold">Consultar Dictamen →</span>
            </div>
          </div>
        </BrowserChrome>
      );

    case "admin-encuestas":
      return (
        <BrowserChrome title="Dashboard Admin › 14.4.10 Encuestas & Referidos" badge="Vista Administrador">
          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
              {[
                { label: "Encuestas", val: "64" },
                { label: "Referidos", val: "192" },
                { label: "Contactados", val: "140" },
                { label: "Propuestas", val: "52" },
                { label: "Cerrados", val: "21" }
              ].map((m, i) => (
                <div key={i} className="bg-white dark:bg-zinc-900 p-2.5 rounded-lg border border-slate-200 dark:border-zinc-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">{m.label}</span>
                  <span className="text-sm font-black text-slate-800 dark:text-zinc-100">{m.val}</span>
                </div>
              ))}
            </div>
            <div className="bg-white dark:bg-zinc-900 p-3 rounded-lg border border-slate-200 dark:border-zinc-800 text-xs text-slate-600 dark:text-zinc-400">
              <strong>Columnas de tabla:</strong> Asesor · Agencia · Encuestas · Referidos · Contactados · Agendados · Propuestas · Cerrados · Efectividad · Acción
            </div>
          </div>
        </BrowserChrome>
      );

    case "admin-nps":
      return (
        <BrowserChrome title="Dashboard Admin › 14.4.12 Calidad (NPS)" badge="Vista Administrador">
          <div className="flex flex-col sm:flex-row items-center gap-4 bg-white dark:bg-zinc-900 p-4 rounded-xl border border-slate-200 dark:border-zinc-800">
            <div className="text-center sm:border-r border-slate-100 dark:border-zinc-800 sm:pr-6">
              <div className="text-2xl font-black text-slate-900 dark:text-white flex items-center justify-center gap-1">
                4.9 <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
              </div>
              <p className="text-[11px] text-slate-500">Escala de 5 estrellas</p>
            </div>
            <div className="flex-1 text-xs text-slate-600 dark:text-zinc-300 space-y-1">
              <p className="font-bold text-slate-800 dark:text-zinc-100">Distribución por estrellas y comentarios de satisfacción</p>
              <p className="text-slate-500">Columnas: Usuario · Agencia · Rating · Comentarios · Permiso de contacto · Fecha</p>
            </div>
          </div>
        </BrowserChrome>
      );

    case "admin-votaciones":
      return (
        <BrowserChrome title="Dashboard Admin › 14.4.13 Control de Votaciones" badge="Vista Administrador">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-white dark:bg-zinc-900 p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-2">
              <h5 className="text-xs font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                <Vote className="w-4 h-4 text-amber-500" /> Lanzar nueva encuesta
              </h5>
              <p className="text-[11px] text-slate-500">Campos: Título, Pregunta, Opciones y botones Agregar Opción y Publicar.</p>
            </div>
            <div className="bg-white dark:bg-zinc-900 p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-2">
              <h5 className="text-xs font-bold text-slate-800 dark:text-zinc-200">Tabla de Resultados en Vivo</h5>
              <p className="text-[11px] text-slate-500">Columnas: Opción · Votos · % de participación.</p>
            </div>
          </div>
        </BrowserChrome>
      );

    case "mi-membresia":
      return (
        <BrowserChrome title="Menú de Usuario › Mi Membresía" badge="Suscripción & Referidos">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">Estado de la Licencia</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">ACTIVA</span>
              </div>
              <p className="text-xs text-slate-500">Muestra días restantes del periodo, cupón de descuento y planes disponibles.</p>
            </div>
            <div className="bg-gradient-to-br from-teal-700 to-emerald-800 text-white p-4 rounded-xl space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold">
                <Share2 className="w-4 h-4 text-teal-200" /> Programa Refiere y Gana
              </div>
              <p className="text-[11px] text-teal-100">Comparte tu enlace único con otras promotorías y obtén recompensas en tu suscripción.</p>
            </div>
          </div>
        </BrowserChrome>
      );

    case "mi-tarjeta-digital":
      return (
        <BrowserChrome title="Menú de Usuario › Mi Tarjeta Digital" badge="Tarjeta Interactiva (.vcf)">
          <div className="max-w-xs mx-auto bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-5 text-center shadow-sm space-y-3">
            <div className="w-14 h-14 rounded-full bg-teal-600 text-white font-black text-lg flex items-center justify-center mx-auto">
              AA
            </div>
            <div>
              <h5 className="text-sm font-bold text-slate-900 dark:text-white">Asesor Patrimonial</h5>
              <p className="text-[11px] text-teal-600 font-semibold">Promotoría Autorizada</p>
            </div>
            <div className="w-28 h-28 mx-auto rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center border border-slate-200 dark:border-zinc-700">
              <QrCode className="w-16 h-16 text-slate-700 dark:text-zinc-300" />
            </div>
            <span className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold">
              <Download className="w-3.5 h-3.5" /> Descargar Contacto (.vcf)
            </span>
          </div>
        </BrowserChrome>
      );

    case "ayuda-soporte":
      return (
        <BrowserChrome title="Menú de Usuario › Ayuda y Soporte" badge="Centro de Soporte">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-teal-50 dark:bg-teal-950 text-teal-600">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h5 className="text-xs font-bold text-slate-900 dark:text-white">Manual de Usuario Interactivo</h5>
                <p className="text-[11px] text-slate-500">Guías paso a paso, buscador en tiempo real y glosario.</p>
              </div>
            </div>
            <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600">
                <LifeBuoy className="w-5 h-5" />
              </div>
              <div>
                <h5 className="text-xs font-bold text-slate-900 dark:text-white">Levantar Nuevo Ticket</h5>
                <p className="text-[11px] text-slate-500">Reporta incidencias o solicita desarrollos adjuntando capturas.</p>
              </div>
            </div>
          </div>
        </BrowserChrome>
      );

    case "proyecto-200":
      return (
        <BrowserChrome title="Herramientas › Proyecto 200 (CRM, Piloto Automático y Tanques de Gasolina)" badge="Sistema Vivo de Prospección">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-slate-900 text-white p-4 rounded-xl border border-indigo-500/30">
                <div className="flex items-center justify-between text-[11px] text-indigo-300 font-bold uppercase">
                  <span>1. Inventario Total (Meta 200)</span>
                  <span className="text-emerald-400">¡Meta 200!</span>
                </div>
                <div className="text-xl font-black mt-1">200 / 200 registrados</div>
                <p className="text-[11px] text-slate-300 mt-1">
                  Carga inicial por Excel + Referidos de Encuesta de Satisfacción (4 SÍes).
                </p>
              </div>

              <div className="bg-slate-900 text-white p-4 rounded-xl border border-emerald-500/30">
                <div className="flex items-center justify-between text-[11px] text-amber-300 font-bold uppercase">
                  <span>⛽ 2. Tanque de Gasolina Comercial</span>
                  <span className="text-emerald-400">🟢 Tanque Lleno (≥100)</span>
                </div>
                <div className="text-xl font-black mt-1">118 / 100 calificados vivos</div>
                <p className="text-[11px] text-slate-300 mt-1">
                  Base: 82 · Referidos/COI: 36 · Ritmo óptimo para 4–5 semanas.
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                  Estación Piloto Automático · Prioridad #1 (95 pts)
                </span>
                <h5 className="text-sm font-black text-slate-900 dark:text-white mt-1">
                  Ing. Alejandro Villarreal · Sueldo Est. $85,000/mes
                </h5>
                <p className="text-[11px] text-slate-500">
                  📞 Regla de Oro Teléfono Primero: En el 1er contacto debes marcar por teléfono antes de desbloquear WhatsApp de rescate.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-black">
                  📞 Llamar Ahora
                </span>
                <span className="px-3 py-2 rounded-xl bg-slate-100 text-slate-500 border border-slate-200 text-xs font-bold">
                  🔒 WhatsApp (1er toque)
                </span>
              </div>
            </div>
          </div>
        </BrowserChrome>
      );
  }
}
