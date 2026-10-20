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
                  <AlertTriangle className="h-4 w-4" /> LO QUE A TODA COSTA DEBES EVITAR (ERRORES FATALES)
                </div>
                <p className="text-xs text-amber-200/90 leading-relaxed">
                  <strong>1) Enviar información previa por WhatsApp o correo:</strong> Jamás cedas a mandar folletos antes de la cita.<br />
                  <strong>2) Mencionar productos explícitamente, tasas o números previos a la cita:</strong> Prohibido hablar de pólizas específicas, montos/rangos (ej. <em>&quot;de $1,500 a $50,000&quot;</em>) o tasas de rendimiento (ej. <em>&quot;5%&quot;</em>).<br />
                  <strong>3) Colgar sin lograr la reunión:</strong> Siempre cierra con la técnica de los 2 horarios.
                </p>
              </div>

              {/* Los 5 Pilares Obligatorios */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
                    <CheckCircle2 className="h-4 w-4" /> 1. Nombre, Empresa y Origen
                  </div>
                  <p className="text-xs text-slate-300">
                    Preséntate con tu nombre, menciona a la empresa (<strong>Grupo AACOM</strong>, <strong>AACOM Seguros</strong> o <strong>AACOMSoft</strong>) y di claramente <strong>de dónde sacaste sus datos/contacto</strong> (referido, desayuno o solicitud de informes).
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50 space-y-2">
                  <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs">
                    <ShieldCheck className="h-4 w-4" /> 2. Explicar de qué trata la Asesoría
                  </div>
                  <p className="text-xs text-slate-300">
                    Explica el valor de la sesión: que es una <strong>asesoría financiera gratuita</strong>, que somos como <strong>médicos de las finanzas</strong> o <strong>expertos en finanzas</strong> realizando un diagnóstico personalizado.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50 space-y-2">
                  <div className="flex items-center gap-2 text-purple-400 font-semibold text-xs">
                    <Zap className="h-4 w-4" /> 3. Técnica de los 2 Horarios
                  </div>
                  <p className="text-xs text-slate-300">
                    Nunca preguntes abierto <em>&quot;¿Cuándo puedes?&quot;</em> ni des días sin hora. Aplica siempre dos opciones con día y hora: <strong>&quot;¿Te queda mejor el miércoles a las 10:00 am o el jueves a las 5:00 pm?&quot;</strong>
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs">
                    <CheckCircle2 className="h-4 w-4" /> 4. Rebote + Volver a dar 2 Horarios
                  </div>
                  <p className="text-xs text-slate-300">
                    El prospecto siempre pondrá al menos <strong>1 objeción realista</strong>. Rebátela con argumentos sólidos y <strong>vuelve a cerrar proponiendo tus 2 opciones de horario</strong>.
                  </p>
                </div>

              </div>

              {/* Manejo de Objeciones Frecuentes */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Manejo Maestro de las Objeciones</h3>
                
                <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800 space-y-1">
                  <div className="text-xs font-bold text-red-400">Objeción: &quot;Envíamelo por correo / WhatsApp&quot;</div>
                  <div className="text-xs text-slate-300 italic">
                    &quot;Para poder enviarte algo primero necesitamos conocer tu situación, porque la situación de un soltero no es la misma que la de un casado o un padre de familia, y las prioridades de cada persona son distintas. En una breve sesión de 20 minutos hacemos tu diagnóstico a la medida. ¿Te queda mejor miércoles a las 10:00 am o jueves a las 5:00 pm?&quot;
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800 space-y-1">
                  <div className="text-xs font-bold text-red-400">Objeción: &quot;¿Qué es? ¿Son seguros?&quot;</div>
                  <div className="text-xs text-slate-300 italic">
                    &quot;Una parte de nuestro portafolio sí podría ser seguros, pero no forzosamente; tenemos una gama de productos tan amplia que la solución no solamente está enfocada en protección. Para poder determinarlo y darte una solución a tu medida, necesitaríamos conocer primero tu situación. ¿Te queda mejor miércoles a las 10:00 am o jueves a las 5:00 pm?&quot;
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800 space-y-1">
                  <div className="text-xs font-bold text-red-400">Objeción: &quot;Por el momento ando muy gastado&quot;</div>
                  <div className="text-xs text-slate-300 italic">
                    &quot;No te preocupes, justamente nuestra asesoría es para ayudar a personas que necesitan poner orden en sus finanzas personales, y es totalmente gratuita y sin ningún compromiso de tener que adquirir algo que no necesitas. ¿Qué horario te acomoda mejor, miércoles a las 10:00 am o jueves a las 5:00 pm?&quot;
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800 space-y-1">
                  <div className="text-xs font-bold text-red-400">Objeción: &quot;No tengo tiempo&quot; / &quot;¿De qué montos o tasas hablamos?&quot;</div>
                  <div className="text-xs text-slate-300 italic">
                    &quot;Somos como médicos de las finanzas: sería irresponsable darte números al aire sin antes diagnosticar tu caso. Es una asesoría ejecutiva y gratuita de solo 20 a 30 minutos para ir directo al grano. ¿Te queda mejor miércoles a las 10:00 am o jueves a las 5:00 pm?&quot;
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
