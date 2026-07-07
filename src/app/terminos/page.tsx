import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-teal-100 selection:text-teal-900">
      
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center gap-4">
          <Link href="/inicio">
            <Button variant="ghost" size="icon" className="shrink-0 text-slate-500">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="bg-teal-600 text-white p-1.5 rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="text-xl font-black tracking-tight text-slate-800">AACOM</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-white p-8 md:p-12 rounded-3xl border shadow-sm">
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-2 uppercase">Términos y Condiciones de Uso</h1>
          <h2 className="text-xl text-teal-600 font-bold mb-10">SYSGPYA – SISTEMA DE GESTIÓN DE PROMOTORÍAS Y AGENCIAS</h2>

          <div className="space-y-8 text-slate-600 leading-relaxed">
            
            <section>
              <h3 className="text-lg font-bold text-slate-900 mb-3 border-b pb-2 uppercase">1. PARTES</h3>
              <p>
                El presente documento (en adelante, los &quot;Términos y Condiciones&quot;) regula el acceso y uso de la aplicación SYSGPYA, propiedad de Ahumada Andrade Comercialización (en adelante &quot;AACOM&quot; o &quot;el Administrador&quot;), por parte de los usuarios que creen una cuenta en el sistema.
              </p>
              <p className="mt-4">
                Al crear una cuenta y hacer uso de SYSGPYA, el Usuario manifiesta haber leído, entendido y aceptado expresamente estos Términos y Condiciones.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-bold text-slate-900 mb-3 border-b pb-2 uppercase">2. DEFINICIONES</h3>
              <ul className="list-disc pl-5 space-y-3">
                <li><strong>AACOM / Administrador:</strong> Ahumada Andrade Comercialización, propietario y administrador de la plataforma SYSGPYA.</li>
                <li><strong>Usuario:</strong> Toda persona física que cree una cuenta en SYSGPYA, ya sea en calidad de Agente de Seguros o de Promotor/Director de Agencia.</li>
                <li><strong>Agente de Seguros:</strong> Usuario que utiliza SYSGPYA para registrar y gestionar la información de sus clientes, pólizas, pagos y solicitudes.</li>
                <li><strong>Promotor/Director de Agencia:</strong> Usuario responsable de la administración y supervisión de una promotoría o agencia de seguros, y que tiene acceso a la información cargada por los Agentes de Seguros pertenecientes a su promotoría o agencia.</li>
                <li><strong>Información del Agente:</strong> Todos los datos, documentos e información que el Agente de Seguros deposite, cargue o registre en SYSGPYA, incluyendo pero no limitado a: datos de clientes, datos de contacto, pólizas, primas, pagos, solicitudes, historiales y cualquier otro registro.</li>
                <li><strong>Ticket de Soporte:</strong> Solicitud de asistencia técnica o intervención administrativa realizada por un Usuario a través de la plataforma SYSGPYA, identificándose con su correo electrónico registrado y sus credenciales digitales de acceso.</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-bold text-slate-900 mb-3 border-b pb-2 uppercase">3. CREACIÓN DE CUENTA Y RESPONSABILIDAD DEL USUARIO</h3>
              <ul className="list-none space-y-3">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-teal-600">3.1.</span>
                  <span>Para crear una cuenta en SYSGPYA, el Usuario deberá proporcionar información veraz, completa y actualizada.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-teal-600">3.2.</span>
                  <span>El Usuario es el único responsable de mantener la confidencialidad de sus credenciales de acceso (correo electrónico y contraseña).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-teal-600">3.3.</span>
                  <span>El Usuario será responsable de todas las actividades que se realicen desde su cuenta. En caso de uso no autorizado, el Usuario deberá notificar de inmediato a AACOM.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-teal-600">3.4.</span>
                  <span>La creación de una cuenta por parte del Agente de Seguros implica necesariamente su vinculación a una promotoría o agencia registrada en el sistema.</span>
                </li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-bold text-slate-900 mb-3 border-b pb-2 uppercase">4. PERFILES DE USUARIO Y ALCANCE DE ACCESO</h3>
              <ul className="list-none space-y-3">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-teal-600">4.1. Perfil de Agente de Seguros:</span>
                  <span>El Agente podrá registrar, modificar, consultar y administrar su propia Información del Agente dentro de la plataforma. El acceso del Agente se limita a su propia información.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-teal-600">4.2. Perfil de Promotor/Director de Agencia:</span>
                  <span>El Promotor o Director de Agencia tendrá acceso a toda la Información del Agente de todos los Agentes de Seguros pertenecientes a su promotoría o agencia. Lo anterior es inherente a la naturaleza del negocio, dado que las emisiones, pagos, solicitudes y demás operaciones se procesan a través de la oficina de la promotoría o agencia y requieren supervisión y gestión por parte del Promotor o Director.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-teal-600">4.3. Perfil de Administrador (AACOM):</span>
                  <span>AACOM tendrá acceso a la plataforma únicamente para fines de administración técnica, soporte, seguridad y correcto funcionamiento del sistema, conforme a lo establecido en la Cláusula 7 del presente documento y en el Aviso de Privacidad correspondiente.</span>
                </li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-bold text-slate-900 mb-3 border-b pb-2 uppercase">5. CONSENTIMIENTO EXPRESO DEL AGENTE DE SEGUROS</h3>
              <p className="mb-4">
                El Agente de Seguros, al crear su cuenta en SYSGPYA y aceptar estos Términos y Condiciones, otorga su consentimiento expreso, libre, informado e inequívoco para:
              </p>
              <ul className="list-none space-y-3 mb-4">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-teal-600">a)</span>
                  <span>Que su Promotor o Director de Agencia tenga acceso total, en tiempo real, a toda la Información del Agente que éste deposite, cargue o registre en SYSGPYA.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-teal-600">b)</span>
                  <span>Que AACOM, como administrador de la aplicación, tenga acceso a dicha información en los términos y con las limitaciones establecidas en la Cláusula 7 del presente documento y en el Aviso de Privacidad.</span>
                </li>
              </ul>
              <p className="mb-2 font-semibold text-slate-800">El Agente reconoce y acepta que:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>La naturaleza del negocio de seguros requiere que el Promotor o Director de Agencia tenga visibilidad de la información operativa de sus Agentes para la correcta gestión, supervisión y operación de la promotoría o agencia.</li>
                <li>Las emisiones, pagos, solicitudes y demás operaciones se procesan a través de la oficina de la promotoría o agencia, por lo que el Promotor o Director necesita tener acceso a dicha información.</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-bold text-slate-900 mb-3 border-b pb-2 uppercase">6. PROPIEDAD DE LA INFORMACIÓN</h3>
              <ul className="list-none space-y-3">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-teal-600">6.1.</span>
                  <span>La Información del Agente registrada en SYSGPYA es propiedad del Agente de Seguros que la depositó.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-teal-600">6.2.</span>
                  <span>El Promotor o Director de Agencia tiene derecho de acceso y consulta sobre dicha información para los fines operativos y de gestión de la promotoría o agencia, pero no adquiere propiedad sobre la misma.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-teal-600">6.3.</span>
                  <span>AACOM no adquiere ningún derecho de propiedad sobre la Información del Agente. Su papel se limita a ser el administrador técnico de la plataforma.</span>
                </li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-bold text-slate-900 mb-3 border-b pb-2 uppercase">7. LIMITACIÓN DE ACCESO DE AACOM A LA INFORMACIÓN</h3>
              <ul className="list-none space-y-3">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-teal-600">7.1.</span>
                  <span>AACOM manifiesta que NO consultará, revisará, accederá ni dará tratamiento a la información particular de las promotorías, agencias, Agentes de Seguros o clientes finales depositada en SYSGPYA, salvo en los siguientes casos:</span>
                </li>
              </ul>
              <ul className="list-none pl-6 space-y-3 my-3">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-teal-600">a)</span>
                  <span>Cuando el Usuario titular de la información, o el Promotor/Director de Agencia correspondiente, solicite expresamente la intervención de AACOM mediante la apertura de un Ticket de Soporte dentro de la plataforma SYSGPYA.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-teal-600">a)</span>
                  <span>Dicho Ticket de Soporte deberá ser presentado por un Usuario debidamente identificado a través de su correo electrónico registrado en el sistema y sus credenciales digitales de acceso.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-teal-600">c)</span>
                  <span>La intervención de AACOM se limitará estrictamente al propósito específico señalado en el Ticket de Soporte y únicamente respecto de la información necesaria para atender dicha solicitud.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-teal-600">d)</span>
                  <span>En ningún caso AACOM utilizará la información a la que tenga acceso por este motivo para fines distintos a la atención del Ticket de Soporte, ni compartirá dicha información con terceros no autorizados.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-teal-600">e)</span>
                  <span>AACOM mantendrá un registro de los Tickets de Soporte atendidos, incluyendo fecha, usuario solicitante y motivo de la intervención.</span>
                </li>
              </ul>
              <ul className="list-none space-y-3">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-teal-600">7.2.</span>
                  <span>Cualquier acceso por parte de AACOM fuera de los supuestos anteriores constituirá una violación a estos Términos y Condiciones y al Aviso de Privacidad aplicable.</span>
                </li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-bold text-slate-900 mb-3 border-b pb-2 uppercase">8. OBLIGACIONES DEL USUARIO</h3>
              <p className="mb-2 font-semibold text-slate-800">El Usuario se obliga a:</p>
              <ul className="list-none space-y-3">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-teal-600">a)</span>
                  <span>Utilizar SYSGPYA de manera lícita, ética y conforme a estos Términos y Condiciones.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-teal-600">b)</span>
                  <span>No introducir información falsa, inexacta o fraudulenta en la plataforma.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-teal-600">c)</span>
                  <span>No compartir sus credenciales de acceso con terceros.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-teal-600">d)</span>
                  <span>No intentar acceder a información de otros Usuarios sin autorización.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-teal-600">e)</span>
                  <span>Cumplir con la legislación aplicable en materia de protección de datos personales respecto de la información de sus clientes finales.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-teal-600">f)</span>
                  <span>Notificar a AACOM cualquier falla de seguridad o acceso no autorizado a su cuenta.</span>
                </li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-bold text-slate-900 mb-3 border-b pb-2 uppercase">9. SOPORTE TÉCNICO</h3>
              <ul className="list-none space-y-3">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-teal-600">9.1.</span>
                  <span>AACOM brindará soporte técnico a los Usuarios de SYSGPYA a través del sistema de Tickets de Soporte integrado en la plataforma.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-teal-600">9.2.</span>
                  <span>El tiempo de respuesta y resolución dependerá de la naturaleza y complejidad del ticket, así como de la disponibilidad de recursos técnicos de AACOM.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-teal-600">9.3.</span>
                  <span>AACOM no garantiza la disponibilidad ininterrumpida del sistema, pero realizará esfuerzos comercialmente razonables para mantener la plataforma operativa.</span>
                </li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-bold text-slate-900 mb-3 border-b pb-2 uppercase">10. SUSPENSIÓN Y CANCELACIÓN DE CUENTA</h3>
              <ul className="list-none space-y-3">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-teal-600">10.1.</span>
                  <span>AACOM se reserva el derecho de suspender o cancelar la cuenta de un Usuario que:</span>
                </li>
              </ul>
              <ul className="list-none pl-6 space-y-2 my-2">
                <li>a) Violente estos Términos y Condiciones.</li>
                <li>b) Haga un uso indebido o fraudulento de la plataforma.</li>
                <li>c) Incumpla con la legislación aplicable.</li>
                <li>d) Así lo solicite el Promotor o Director de Agencia respecto de un Agente de Seguros perteneciente a su promotoría o agencia.</li>
              </ul>
              <ul className="list-none space-y-3">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-teal-600">10.2.</span>
                  <span>En caso de cancelación de cuenta, AACOM no estará obligada a conservar la Información del Agente por un período mayor al establecido en el Aviso de Privacidad.</span>
                </li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-bold text-slate-900 mb-3 border-b pb-2 uppercase">11. PROPIEDAD INTELECTUAL</h3>
              <ul className="list-none space-y-3">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-teal-600">11.1.</span>
                  <span>SYSGPYA, incluyendo su código fuente, diseño, interfaz, logotipos y nombre, es propiedad exclusiva de AACOM.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-teal-600">11.2.</span>
                  <span>El Usuario no adquiere ningún derecho de propiedad intelectual sobre la plataforma. Se le otorga una licencia limitada, no exclusiva e intransferible para usar SYSGPYA de acuerdo con estos Términos y Condiciones.</span>
                </li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-bold text-slate-900 mb-3 border-b pb-2 uppercase">12. LEGISLACIÓN APLICABLE Y JURISDICCIÓN</h3>
              <p>
                Estos Términos y Condiciones se rigen por las leyes de los Estados Unidos Mexicanos. Cualquier controversia relacionada con el presente documento será sometida a la jurisdicción de los tribunales competentes en la Ciudad de México, renunciando las partes a cualquier otra jurisdicción que pudiera corresponderles.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-bold text-slate-900 mb-3 border-b pb-2 uppercase">13. MODIFICACIONES</h3>
              <p>
                AACOM se reserva el derecho de modificar estos Términos y Condiciones en cualquier momento. Las modificaciones entrarán en vigor al momento de su publicación en la aplicación SYSGPYA o en el sitio web www.aacommx.com. El uso continuado de la plataforma después de dichas modificaciones constituye la aceptación de las mismas.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-bold text-slate-900 mb-3 border-b pb-2 uppercase">14. AVISO DE PRIVACIDAD</h3>
              <p>
                El tratamiento de los datos personales de los Usuarios se realiza conforme al Aviso de Privacidad de SYSGPYA, el cual forma parte integral de estos Términos y Condiciones. Se recomienda al Usuario leer dicho aviso antes de crear su cuenta.
              </p>
            </section>

            <div className="pt-8 text-sm text-slate-400 font-medium">
              Versión: 1.0 — Fecha de entrada en vigor: 25 de junio de 2026.
            </div>

          </div>
        </div>
      </main>

    </div>
  );
}
