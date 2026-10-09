'use client';

import React from 'react';
import { BookOpen, X, CheckCircle2, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';

interface MasterTacticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  moduleId?: 'prospeccion' | 'adn' | 'objeciones';
}

export function MasterTacticsModal({ isOpen, onClose, moduleId = 'prospeccion' }: MasterTacticsModalProps) {
  if (!isOpen) return null;

  const isADN = moduleId === 'adn';
  const isObjeciones = moduleId === 'objeciones';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[85vh] bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${isADN ? 'bg-indigo-500/10 border border-indigo-500/30 text-indigo-400' : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'}`}>
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {isADN ? 'Manual Táctico de Diagnóstico ADN' : isObjeciones ? 'Manual de Cierre y Manejo de Objeciones' : 'Manual Táctico de Prospección AACOM'}
              </h2>
              <p className="text-xs text-slate-400">
                {isADN
                  ? 'Metodología basada en la Regla 50-30-20 de Elizabeth Warren y los 5 Pilares Patrimoniales'
                  : isObjeciones
                  ? 'Desmantelamiento de cortinas de humo, técnicas de rebote y cierre asumido'
                  : 'Guía metodológica para agendar citas de 30-40 minutos sin vender por teléfono'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 space-y-6 text-sm text-slate-300">
          
          {isADN ? (
            <>
              {/* Regla de Oro ADN */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <AlertTriangle className="h-4 w-4" /> REGLA DE ORO DEL ANÁLISIS DE NECESIDADES (ADN)
                </div>
                <p className="text-xs text-amber-200/90 leading-relaxed">
                  <strong>El ADN es exclusivamente para diagnosticar y descubrir necesidades, JAMÁS para cotizar o vender pólizas en esa cita.</strong> En cuanto mencionas nombres de aseguradoras o precios de primas antes de terminar el diagnóstico, el cliente se pone a la defensiva y pierdes la postura de consultor fiduciario.
                </p>
              </div>

              {/* Los 4 Pilares del ADN */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50 space-y-2">
                  <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs">
                    <CheckCircle2 className="h-4 w-4" /> 1. Posicionamiento: Regla 50-30-20
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Preséntate como Asesor Patrimonial y explica que te riges por el estándar de oro de <strong>Elizabeth Warren</strong>: 50% Necesidades básicas, 30% Estilo de vida y 20% Ahorro/Protección para el futuro.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50 space-y-2">
                  <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs">
                    <ShieldCheck className="h-4 w-4" /> 2. Permiso & Analogía Médica
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Pide permiso antes del cuestionario: <em>"Así como un médico no puede recetar sin un análisis previo, mi rol es hacer un diagnóstico integral 100% confidencial."</em>
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50 space-y-2">
                  <div className="flex items-center gap-2 text-purple-400 font-semibold text-xs">
                    <Zap className="h-4 w-4" /> 3. Detalle vs. Grandes Bloques
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Si el cliente está abierto, indaga servicios a detalle. <strong>Si muestra resistencia a centavos de luz/gas, no insistas:</strong> agrupa en bloques grandes (Vivienda total, Transporte, Hobbies, etc.).
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
                    <CheckCircle2 className="h-4 w-4" /> 4. Cierre del ADN: Cita de Estrategia
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Al descubrir el dolor principal (Retiro, Blindaje de hijos, Universidad o Deudas), concluye diciendo que te llevas los datos a tu despacho y agenda la <strong>Cita de Presentación</strong> con doble alternativa.
                  </p>
                </div>
              </div>

              {/* Respuestas Maestras a Objeciones en ADN */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Objeciones Típicas en el ADN</h3>
                
                <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800 space-y-1">
                  <div className="text-xs font-bold text-amber-400">Objeción: "¿Por qué necesitas saber cuánto gano o en qué gasto mi dinero?"</div>
                  <div className="text-xs text-slate-300 italic">
                    "Totalmente entendible su inquietud. Así como un médico requiere un análisis previo para no dar una receta equivocada, toda esta información es 100% confidencial y nos permite comparar su estructura financiera contra la Regla 50-30-20 de Elizabeth Warren para ver dónde tiene fugas y oportunidades."
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800 space-y-1">
                  <div className="text-xs font-bold text-amber-400">Objeción: "Yo sé más o menos cuánto gasto, no me sé los centavos de la luz ni el gas"</div>
                  <div className="text-xs text-slate-300 italic">
                    "Perfecto, no se preocupe por los centavos. Veámoslo en bloques grandes: ¿cuánto calcula que destina al mes a vivienda completa, incluyendo todos los servicios y mantenimiento?"
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800 space-y-1">
                  <div className="text-xs font-bold text-amber-400">Objeción: "¿Y de qué póliza o seguro me estás hablando? ¿Cuánto cuesta?"</div>
                  <div className="text-xs text-slate-300 italic">
                    "Justamente como no hemos terminado de diagnosticar sus metas ni su capacidad de ahorro del 20%, sería poco profesional darle un número al azar. Déjeme concluir el análisis y en la siguiente sesión le presento un traje a su medida."
                  </div>
                </div>
              </div>
            </>
          ) : isObjeciones ? (
            <>
              {/* Regla de Oro Cierre y Objeciones */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <AlertTriangle className="h-4 w-4" /> REGLA DE ORO DEL CIERRE CONSULTIVO
                </div>
                <p className="text-xs text-amber-200/90 leading-relaxed">
                  <strong>El 90% de las primeras dudas del cliente son cortinas de humo ("déjame pensarlo", "está caro", "tengo que hablar con mi esposa").</strong> Si el asesor debate el pretexto o dice <em>"bueno, piénsalo y me avisas"</em>, la venta muere de inmediato. Tu trabajo es: <strong>1) Validar con empatía</strong>, <strong>2) Aislar la duda raíz</strong>, <strong>3) Rebatir con técnica de valor</strong> (Boomerang, Siente-Sentían-Comprobaron o Costo Diario), y <strong>4) Rematar con un Cierre Asumido</strong> con doble alternativa.
                </p>
              </div>

              {/* Los 4 Pilares del Cierre */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50 space-y-2">
                  <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs">
                    <CheckCircle2 className="h-4 w-4" /> 1. Validación Empática
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Nunca confrontes ni contradigas al cliente. Valida su postura: <em>"Te entiendo perfectamente, es una decisión muy importante para tu patrimonio familiar."</em>
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50 space-y-2">
                  <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs">
                    <ShieldCheck className="h-4 w-4" /> 2. Aislamiento Quirúrgico
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Despeja la cortina de humo: <em>"Además de analizar los números / consultar con tu pareja, ¿hay algo del plan o de las coberturas que no te termine de convencer?"</em>
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50 space-y-2">
                  <div className="flex items-center gap-2 text-purple-400 font-semibold text-xs">
                    <Zap className="h-4 w-4" /> 3. Técnicas de Rebote y Valor
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Aplica la <strong>Reducción al Costo Diario</strong> ($150-$200 al día), el <strong>Boomerang</strong> (tu misma objeción es la razón para comprar), o el <strong>Costo de la Inacción</strong> (la edad y salud no se congelan).
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
                    <CheckCircle2 className="h-4 w-4" /> 4. Cierre Asumido (Doble Alternativa)
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    No preguntes "¿Qué hacemos?". Asume el cierre con naturalidad ejecutiva: <em>"¿Para la emisión te queda más cómodo domiciliar a tarjeta Visa o MasterCard?"</em>
                  </p>
                </div>
              </div>

              {/* Respuestas Maestras a Objeciones en Cierre */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Objeciones Críticas en el Cierre</h3>
                
                <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800 space-y-1">
                  <div className="text-xs font-bold text-amber-400">Objeción: "Déjame pensarlo este fin de semana y yo te marco después"</div>
                  <div className="text-xs text-slate-300 italic">
                    "Entiendo perfectamente que quieras analizarlo. Solo para tener claridad: además del tiempo para pensarlo, ¿hay algo del plan que no te termine de convencer, o es solo tema de flujo? Recuerda que la edad y la salud no se congelan; el riesgo está corriendo desde hoy. ¿Qué te parece si metemos la solicitud preliminar y apartamos tu tarifa hoy mismo?"
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800 space-y-1">
                  <div className="text-xs font-bold text-amber-400">Objeción: "Está muy caro / Se me sale de presupuesto ahorita"</div>
                  <div className="text-xs text-slate-300 italic">
                    "Te entiendo, al verlo en un bloque mensual parece fuerte. Pero si lo dividimos entre 30 días, son $150 pesos diarios, menos que una comida fuera. La pregunta que debemos hacernos es: ¿vale la pena cambiar un café al día por garantizar 5 millones para tu familia y tu retiro garantizado?"
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800 space-y-1">
                  <div className="text-xs font-bold text-amber-400">Objeción: "Tengo que consultarlo con mi esposo/a / contador"</div>
                  <div className="text-xs text-slate-300 italic">
                    "Elogio muchísimo que tomen las decisiones juntos. Si tu pareja estuviera sentada aquí y supiera que este plan garantiza la universidad de los niños y la casa pase lo que pase, ¿crees que te diría que sí? ¿Qué te parece si llenamos los datos preliminares y si ella tiene alguna duda técnica la resolvemos juntos en una llamada breve de 10 minutos?"
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800 space-y-1">
                  <div className="text-xs font-bold text-amber-400">Objeción: "Prefiero meter ese dinero a CETES o comprar un terreno"</div>
                  <div className="text-xs text-slate-300 italic">
                    "CETES y bienes raíces son fabulosos para multiplicar capital. Pero si mañana tienes un accidente o una enfermedad grave, CETES no le pagará 5 millones de indemnización a tu familia al día siguiente. Este plan no compite con tus inversiones, es el cinturón de seguridad que las blinda ante imprevistos."
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Regla de Oro Prospección */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <AlertTriangle className="h-4 w-4" /> REGLA DE ORO DE LA LLAMADA TELEFÓNICA
                </div>
                <p className="text-xs text-amber-200/90 leading-relaxed">
                  <strong>El teléfono es exclusivamente para "vender la cita", JAMÁS para vender la póliza ni cotizar.</strong> En cuanto mencionas primas, sumas aseguradas o coberturas técnicas, el prospecto se desconecta y te pide que se lo mandes por correo.
                </p>
              </div>

              {/* Los 4 Pilares */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
                    <CheckCircle2 className="h-4 w-4" /> 1. Posicionamiento Consultivo
                  </div>
                  <p className="text-xs text-slate-300">
                    Preséntate como asesor de <strong>AACOM Seguros</strong> brindando una <em>asesoría financiera personalizada</em>. No eres un vendedor de seguros, eres un estratega patrimonial.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50 space-y-2">
                  <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs">
                    <ShieldCheck className="h-4 w-4" /> 2. Diagnóstico Antes de Recetar
                  </div>
                  <p className="text-xs text-slate-300">
                    Tu escudo contra la objeción <em>"¿De qué números estamos hablando?"</em>: <strong>"Manejamos tantas soluciones y opciones que sería irresponsable recomendarle una sin antes platicar y conocer su situación."</strong>
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50 space-y-2">
                  <div className="flex items-center gap-2 text-purple-400 font-semibold text-xs">
                    <Zap className="h-4 w-4" /> 3. Doble Alternativa de Cierre
                  </div>
                  <p className="text-xs text-slate-300">
                    Nunca preguntes <em>"¿Cuándo podría?"</em>. Da dos opciones cerradas: <strong>"¿Le queda mejor el martes a las 11:00 am o el jueves a las 4:00 pm en su oficina?"</strong>
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs">
                    <CheckCircle2 className="h-4 w-4" /> 4. Tiempo Estipulado (30-40 min)
                  </div>
                  <p className="text-xs text-slate-300">
                    Garantiza que la reunión no le quitará toda la tarde. Pide <strong>30 a 40 minutos</strong>. Esto genera confianza y elimina el miedo a una reunión interminable.
                  </p>
                </div>

              </div>

              {/* Manejo de Objeciones Frecuentes */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Respuestas Maestras a Objeciones</h3>
                
                <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800 space-y-1">
                  <div className="text-xs font-bold text-red-400">Objeción: "Mándamelo por WhatsApp / Correo y yo lo checo"</div>
                  <div className="text-xs text-slate-300 italic">
                    "Con gusto se lo comparto, pero justamente como manejamos un abanico tan amplio de opciones, no sabría exactamente qué enviarle sin conocer sus metas primero. Tomará solo 30 minutos platicarlo. ¿Prefiere que nos veamos el martes o el jueves?"
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800 space-y-1">
                  <div className="text-xs font-bold text-red-400">Objeción: "Ya tengo seguros con otra compañía / con mi banco"</div>
                  <div className="text-xs text-slate-300 italic">
                    "Excelente, me da mucho gusto que tenga esa previsión. Justamente lo que hacemos no es competir ni venderle otro seguro, sino una auditoría para verificar que sus coberturas actuales no tengan duplicidades y optimizar deducibles. ¿Le queda mejor el miércoles o el viernes?"
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800 space-y-1">
                  <div className="text-xs font-bold text-red-400">Objeción: "Dígame rápido de cuánto dinero estamos hablando al mes"</div>
                  <div className="text-xs text-slate-300 italic">
                    "Precisamente por respeto a su presupuesto no le puedo dar un número genérico; hay proyectos desde montos muy cómodos hasta estrategias más amplias. El objetivo de la reunión de 30 minutos es ver qué le hace sentido a usted. ¿Le queda mejor el lunes o el martes?"
                  </div>
                </div>

              </div>
            </>
          )}

          {/* Footer Motivacional */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">
              {isADN ? 'Metodología oficial de Diagnóstico ADN • AACOM Seguros' : 'Metodología oficial de prospección telefónica • AACOM Seguros'}
            </span>
            <span className="text-emerald-400 font-semibold">
              {isADN ? 'Estándar 50-30-20' : 'Efectividad > 80% en citas'}
            </span>
          </div>

        </div>

      </div>
    </div>
  );
}
