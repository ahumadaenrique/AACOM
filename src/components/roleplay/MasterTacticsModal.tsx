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
                {isADN ? 'Manual Táctico de Diagnóstico ADN' : isObjeciones ? 'Manual de Cierre y Manejo de Objeciones' : 'Manual Táctico de Prospección Telefónica'}
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
                  <strong>El teléfono es exclusivamente para &quot;vender la cita&quot;, JAMÁS para vender la póliza, cotizar ni dar rangos o tasas.</strong> Está estrictamente prohibido mencionar montos o rangos de inversión (ej. <em>&quot;de $10,000 a $1 millón&quot;</em>) o tasas de interés/rendimiento (ej. <em>&quot;5%&quot;</em>). Si das cifras o porcentajes por teléfono, cometerás un <strong>Error Fatal</strong> y perderás la cita.
                </p>
              </div>

              {/* Los 4 Pilares */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
                    <CheckCircle2 className="h-4 w-4" /> 1. Identificación y Posicionamiento
                  </div>
                  <p className="text-xs text-slate-300">
                    Preséntate con tu nombre y tu empresa (<strong>Grupo AACOM</strong>, <strong>AACOM Seguros</strong>, <strong>AACOMSoft</strong> o tu promotoría), menciona el origen del contacto (referido o solicitud de informes) y ofrece una <em>asesoría personalizada</em>.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50 space-y-2">
                  <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs">
                    <ShieldCheck className="h-4 w-4" /> 2. Diagnóstico Antes de Recetar
                  </div>
                  <p className="text-xs text-slate-300">
                    Tu escudo contra la objeción <em>&quot;¿De qué números o tasas estamos hablando?&quot;</em>: <strong>&quot;Todos nuestros planes son 100% personalizados; sería irresponsable darle números o tasas sin antes conocer sus necesidades y objetivos en una breve reunión.&quot;</strong>
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50 space-y-2">
                  <div className="flex items-center gap-2 text-purple-400 font-semibold text-xs">
                    <Zap className="h-4 w-4" /> 3. Doble Alternativa de Cierre
                  </div>
                  <p className="text-xs text-slate-300">
                    Nunca preguntes <em>&quot;¿Cuándo podría?&quot;</em>. Da dos opciones cerradas: <strong>&quot;¿Le queda mejor el miércoles a las 10:00 am o el jueves a las 5:00 pm?&quot;</strong>
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs">
                    <CheckCircle2 className="h-4 w-4" /> 4. Tiempo Estipulado (20-30 min)
                  </div>
                  <p className="text-xs text-slate-300">
                    Garantiza que la reunión será ejecutiva y sin compromiso. Pide <strong>20 a 30 minutos</strong> para conocer sus metas y diseñarle un traje a la medida.
                  </p>
                </div>

              </div>

              {/* Manejo de Objeciones Frecuentes */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Respuestas Maestras a Objeciones</h3>
                
                <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800 space-y-1">
                  <div className="text-xs font-bold text-red-400">Objeción: &quot;Mándamelo por WhatsApp / Correo y yo lo checo&quot;</div>
                  <div className="text-xs text-slate-300 italic">
                    &quot;Con gusto le compartiría información, pero como todos nuestros planes se diseñan a la medida, no existe un folleto genérico que le haga justicia a lo que usted busca. Solo nos tomará 20 minutos platicar sobre sus objetivos para armarle una propuesta exacta. ¿Le queda mejor el miércoles a las 10:00 am o el jueves a las 5:00 pm?&quot;
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800 space-y-1">
                  <div className="text-xs font-bold text-red-400">Objeción: &quot;Ya tengo seguros con otra compañía / con mi banco&quot;</div>
                  <div className="text-xs text-slate-300 italic">
                    &quot;Excelente, lo felicito por esa previsión. Justamente la reunión no es para venderle un producto encimado, sino para conocer qué objetivos busca proteger hoy y ver cómo complementar o hacer más eficiente su estrategia actual. ¿Le queda mejor miércoles a las 10:00 am o jueves a las 5:00 pm?&quot;
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800 space-y-1">
                  <div className="text-xs font-bold text-red-400">Objeción: &quot;Dígame rápido de cuánto dinero al mes o qué tasa de rendimiento ofrecen&quot;</div>
                  <div className="text-xs text-slate-300 italic">
                    &quot;Precisamente porque cada estrategia es un traje a la medida, no manejamos tarifas ni tasas fijas por teléfono sin antes entender sus metas y su horizonte. En una sesión ejecutiva de 20 minutos revisamos su caso y le presento números exactos y personalizados. ¿Qué le queda mejor, miércoles a las 10:00 am o jueves a las 5:00 pm?&quot;
                  </div>
                  <div className="text-[11px] text-rose-400 font-medium pt-1">
                    ⚠️ Prohibido caer en la trampa de dar rangos (&quot;de $10 mil a $1 millón&quot;) o tasas (&quot;5% de interés&quot;).
                  </div>
                </div>

              </div>
            </>
          )}

          {/* Footer Motivacional */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">
              {isADN ? 'Metodología oficial de Diagnóstico ADN • Regla 50-30-20' : isObjeciones ? 'Metodología oficial de Cierre y Manejo de Objeciones' : 'Metodología oficial de prospección telefónica'}
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
