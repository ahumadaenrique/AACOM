import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

export default function PrivacidadPage() {
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
            <span className="text-xl font-black tracking-tight text-slate-800">SYSGPYA</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-white p-8 md:p-12 rounded-3xl border shadow-sm">
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-2">AVISO DE PRIVACIDAD INTEGRAL</h1>
          <h2 className="text-xl text-teal-600 font-bold mb-10">SYSGPYA – SISTEMA DE GESTIÓN DE PROMOTORÍAS Y AGENCIAS</h2>

          <div className="space-y-8 text-slate-600 leading-relaxed">
            
            <section>
              <h3 className="text-lg font-bold text-slate-900 mb-3 border-b pb-2">1. IDENTIDAD Y DOMICILIO DEL RESPONSABLE</h3>
              <p>
                Ahumada Andrade Comercialización (en lo sucesivo, "AACOM"), con domicilio en Van Dick 14 - 409, col. Santa Maria Nonoalco, Del. Benito Juarez, cdmx 03700, y portal web aacomsoft.com/inicio, es el responsable del tratamiento de los datos personales recabados a través de la aplicación informática denominada SYSGPYA (Sistema de Gestión de Promotorías y Agencias). AACOM se compromete a salvaguardar la privacidad de la información de conformidad con la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP).
              </p>
            </section>

            <section>
              <h3 className="text-lg font-bold text-slate-900 mb-3 border-b pb-2">2. FINALIDADES DEL TRATAMIENTO DE DATOS</h3>
              <p className="mb-4">Los datos personales que se recaben a través de SYSGPYA serán utilizados para las siguientes finalidades:</p>
              
              <h4 className="font-bold text-slate-800 mb-2">Primarias (necesarias):</h4>
              <ul className="list-disc pl-5 space-y-2 mb-4">
                <li>Permitir la operación y administración de la aplicación SYSGPYA.</li>
                <li>Proveer herramientas de gestión de relaciones con clientes (CRM) para agentes y promotorías.</li>
                <li>Permitir el seguimiento de la actividad comercial, carga de pólizas, datos de contacto y administración de cartera.</li>
                <li>Que el promotor o director de la agencia pueda consultar la actividad, información y datos cargados por los agentes de seguros pertenecientes a su promotoría o agencia.</li>
                <li>Facilitar la supervisión operativa por parte de los Directores de Agencia o Promotores sobre la actividad de sus agentes vinculados.</li>
                <li>Que AACOM, como administrador de la aplicación, pueda brindar soporte técnico, mantenimiento y resolución de incidencias técnicas.</li>
                <li>Que AACOM, como administrador de la aplicación, pueda gestionar el acceso, la seguridad y el correcto funcionamiento del sistema.</li>
                <li>Brindar soporte técnico y mantenimiento de la aplicación bajo solicitud expresa.</li>
              </ul>

              <h4 className="font-bold text-slate-800 mb-2">Secundarias (no necesarias):</h4>
              <ul className="list-disc pl-5 space-y-2">
                <li>No se realizarán tratamientos secundarios sin el consentimiento por separado del titular.</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-bold text-slate-900 mb-3 border-b pb-2">3. DATOS PERSONALES TRATADOS</h3>
              <p className="mb-4">Para cumplir con las finalidades descritas, se tratarán datos personales tanto de los Agentes de Seguros como de sus Clientes finales, incluyendo de manera enunciativa más no limitativa:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Nombre completo</li>
                <li>Correo electrónico</li>
                <li>Teléfono de contacto</li>
                <li>Datos de pólizas (número, tipo, vigencia, prima, aseguradora)</li>
                <li>Historial de pagos y solicitudes</li>
                <li>Datos de contacto de clientes finales</li>
                <li>Cualquier otra información que el agente deposite voluntariamente en la aplicación</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-bold text-slate-900 mb-3 border-b pb-2">4. CONSENTIMIENTO EXPRESO DEL AGENTE DE SEGUROS</h3>
              <p className="mb-4">Al utilizar SYSGPYA y aceptar el presente Aviso de Privacidad, el AGENTE DE SEGUROS otorga su consentimiento expreso, libre e informado para que:</p>
              <ul className="list-none space-y-4 mb-4">
                <li className="flex gap-3">
                  <span className="font-bold text-teal-600">a)</span>
                  <span>Su promotor o director de agencia tenga acceso a toda la información que el agente deposite en la aplicación, incluyendo datos de clientes, pólizas, pagos, solicitudes y cualquier otro dato cargado en el sistema.</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-teal-600">b)</span>
                  <span>AACOM, como administrador de la aplicación, tenga acceso a dicha información para los fines de administración, soporte técnico, seguridad y correcto funcionamiento del sistema conforme a lo descrito en este aviso.</span>
                </li>
              </ul>
              <p>El agente reconoce que, dada la naturaleza del sistema, el promotor o director de agencia, como dueño de la promotoría/agencia, requiere tener visibilidad de la información operativa de sus agentes para la gestión y operación del negocio, ya que las emisiones, pagos y solicitudes se procesan a través de la oficina de la promotoría o agencia.</p>
            </section>

            <section>
              <h3 className="text-lg font-bold text-slate-900 mb-3 border-b pb-2">5. LIMITACIÓN DE ACCESO POR PARTE DE AACOM</h3>
              <p className="mb-4">Ahumada Andrade Comercialización (AACOM) manifiesta que NO consultará, revisará, accederá ni dará tratamiento a la información particular de las promotorías, agencias, agentes de seguros o clientes finales depositada en SYSGPYA, salvo en los siguientes casos:</p>
              <ul className="list-none space-y-4">
                <li className="flex gap-3">
                  <span className="font-bold text-teal-600">a)</span>
                  <span>Cuando el usuario titular de la información o el promotor/director de agencia correspondiente solicite expresamente la intervención de AACOM mediante la apertura de un ticket de soporte o ayuda dentro de la plataforma.</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-teal-600">b)</span>
                  <span>Dicho ticket deberá ser presentado por un usuario debidamente identificado a través de su correo electrónico registrado y sus credenciales digitales de acceso al sistema.</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-teal-600">c)</span>
                  <span>La intervención de AACOM se limitará estrictamente al propósito específico señalado en el ticket de soporte y únicamente respecto de la información necesaria para atender dicha solicitud.</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-teal-600">d)</span>
                  <span>En ningún caso AACOM utilizará la información a la que tenga acceso por este motivo para fines distintos a la atención del ticket de soporte, ni compartirá dicha información con terceros no autorizados.</span>
                </li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-bold text-slate-900 mb-3 border-b pb-2">6. TRANSFERENCIA DE DATOS</h3>
              <p className="mb-4">Se informa que los datos personales de los agentes podrán ser transferidos y consultados dentro del territorio mexicano por:</p>
              <ul className="list-disc pl-5 space-y-2 mb-4">
                <li>El promotor o director de agencia correspondiente, para fines de administración, supervisión y operación del negocio.</li>
                <li>AACOM, para fines de administración técnica, soporte y mantenimiento del sistema, en los términos y limitaciones establecidos en el presente aviso.</li>
              </ul>
              <p className="mb-2">No se realizarán transferencias internacionales de datos personales sin el consentimiento previo del titular.</p>
              <p>AACOM no transferirá datos personales a terceros ajenos a la relación contractual de la plataforma, salvo las excepciones previstas en el artículo 37 de la LFPDPPP o cuando sea requerido por autoridad competente mediante mandato legal.</p>
            </section>

            <section>
              <h3 className="text-lg font-bold text-slate-900 mb-3 border-b pb-2">7. MEDIOS PARA EJERCER LOS DERECHOS ARCO</h3>
              <p className="mb-4">El titular de los datos personales tiene derecho a:</p>
              <ul className="list-disc pl-5 space-y-2 mb-4">
                <li><strong className="text-slate-800">Acceso:</strong> Acceder a sus datos personales en posesión de AACOM y conocer los detalles de su tratamiento.</li>
                <li><strong className="text-slate-800">Rectificación:</strong> Rectificar sus datos personales cuando sean inexactos o incompletos.</li>
                <li><strong className="text-slate-800">Cancelación:</strong> Cancelar sus datos personales cuando considere que no son necesarios para las finalidades señaladas o cuando haya concluido el tratamiento.</li>
                <li><strong className="text-slate-800">Oposición:</strong> Oponerse al tratamiento de sus datos personales para fines específicos.</li>
              </ul>
              <p className="mb-4">
                Para ejercer cualquiera de estos derechos, el titular deberá presentar una solicitud por escrito al correo electrónico: <a href="mailto:soporte@aacomsoft.com" className="text-teal-600 font-bold hover:underline">soporte@aacomsoft.com</a> o al domicilio de AACOM antes señalado, indicando:
              </p>
              <ul className="list-disc pl-5 space-y-2 mb-4">
                <li>Nombre completo del titular</li>
                <li>Correo electrónico registrado en SYSGPYA</li>
                <li>Descripción clara y precisa del derecho que desea ejercer</li>
                <li>Cualquier documento o información que acredite la identidad del titular</li>
              </ul>
              <p className="mb-4">AACOM dará respuesta a la solicitud en un plazo máximo de 20 días hábiles contados desde la fecha de recepción, conforme a lo dispuesto en la LFPDPPP.</p>
              
              <h4 className="font-bold text-slate-800 mb-2">Limitación del uso o divulgación de los datos personales:</h4>
              <p>El titular podrá limitar el uso o divulgación de sus datos personales enviando una solicitud al correo electrónico: <a href="mailto:soporte@aacomsoft.com" className="text-teal-600 font-bold hover:underline">soporte@aacomsoft.com</a>. La solicitud deberá contener los mismos elementos señalados para el ejercicio de derechos ARCO.</p>
            </section>

            <section>
              <h3 className="text-lg font-bold text-slate-900 mb-3 border-b pb-2">8. MEDIDAS DE SEGURIDAD</h3>
              <p>AACOM ha implementado medidas de seguridad administrativas, técnicas y físicas para proteger sus datos personales contra daño, pérdida, alteración, destrucción o el uso, acceso o tratamiento no autorizado.</p>
            </section>

            <section>
              <h3 className="text-lg font-bold text-slate-900 mb-3 border-b pb-2">9. CAMBIOS AL AVISO DE PRIVACIDAD</h3>
              <p>El presente aviso de privacidad puede sufrir modificaciones, cambios o actualizaciones derivadas de nuevos requerimientos legales o de nuestras propias necesidades por los servicios que ofrecemos. AACOM notificará dichos cambios a través de la interfaz de la aplicación SYSGPYA o mediante el correo electrónico registrado por los usuarios.</p>
            </section>

            <div className="pt-8 text-sm text-slate-400 font-medium">
              Última actualización: 25 de junio de 2026.
            </div>

          </div>
        </div>
      </main>

    </div>
  );
}
