"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, CheckCircle2, ShieldCheck } from "lucide-react";
import { acceptTermsAndConditions } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";

interface TermsModalProps {
    email: string;
}

export default function TermsModal({ email }: TermsModalProps) {
    const [isAccepting, setIsAccepting] = useState(false);
    const { toast } = useToast();

    const handleAccept = async () => {
        setIsAccepting(true);
        try {
            const result = await acceptTermsAndConditions(email);
            if (result.success) {
                toast({
                    title: "Términos Aceptados",
                    description: "Tu firma electrónica ha sido registrada exitosamente.",
                });
                window.location.reload();
            } else {
                toast({
                    title: "Error",
                    description: "Hubo un problema al registrar tu firma. Inténtalo de nuevo.",
                    variant: "destructive"
                });
            }
        } catch (error) {
            toast({
                title: "Error de conexión",
                description: "No se pudo contactar al servidor.",
                variant: "destructive"
            });
        } finally {
            setIsAccepting(false);
        }
    };

    return (
        <Dialog open={true} onOpenChange={() => {}}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden outline-none bg-white dark:bg-slate-950">
                <DialogHeader className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-row items-center gap-4 space-y-0">
                    <div className="bg-teal-100 dark:bg-teal-900/30 p-3 rounded-xl">
                        <FileText className="w-8 h-8 text-teal-600 dark:text-teal-400" />
                    </div>
                    <div>
                        <DialogTitle className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
                            Actualización de Términos Legales
                        </DialogTitle>
                        <DialogDescription className="text-slate-500 dark:text-slate-400 mt-1">
                            Para continuar usando SYSGPYA, debes aceptar nuestros términos y condiciones actualizados.
                        </DialogDescription>
                    </div>
                </DialogHeader>

                <div className="flex-1 p-6 md:p-8 overflow-y-auto">
                    <div className="max-w-3xl mx-auto space-y-8 text-sm md:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                        
                        <div className="text-center mb-8 pb-8 border-b border-slate-100 dark:border-slate-800">
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">TÉRMINOS Y CONDICIONES DE USO</h2>
                            <h3 className="text-lg font-bold text-teal-600 dark:text-teal-400 mb-4">SYSGPYA – Sistema de Gestión de Promotorías y Agencias</h3>
                            <p className="text-sm text-slate-500 font-medium">Versión: 1.0 — Fecha de entrada en vigor: 01 de junio de 2026</p>
                        </div>

                        <section>
                            <h4 className="font-bold text-slate-900 dark:text-white text-lg mb-2">1. PARTES</h4>
                            <p>El presente documento (en adelante, los "Términos y Condiciones") regula el acceso y uso de la aplicación SYSGPYA, propiedad de Ahumada Andrade Comercialización (en adelante "AACOM" o "el Administrador"), por parte de los usuarios que creen una cuenta en el sistema.</p>
                            <p className="mt-2">Al crear una cuenta y hacer uso de SYSGPYA, el Usuario manifiesta haber leído, entendido y aceptado expresamente estos Términos y Condiciones.</p>
                        </section>

                        <section>
                            <h4 className="font-bold text-slate-900 dark:text-white text-lg mb-2">2. DEFINICIONES</h4>
                            <ul className="list-disc pl-5 space-y-2">
                                <li><strong className="text-slate-800 dark:text-slate-200">AACOM / Administrador:</strong> Ahumada Andrade Comercialización, propietario y administrador de la plataforma SYSGPYA.</li>
                                <li><strong className="text-slate-800 dark:text-slate-200">Usuario:</strong> Toda persona física que cree una cuenta en SYSGPYA, ya sea en calidad de Agente de Seguros o de Promotor/Director de Agencia.</li>
                                <li><strong className="text-slate-800 dark:text-slate-200">Agente de Seguros:</strong> Usuario que utiliza SYSGPYA para registrar y gestionar la información de sus clientes, pólizas, pagos y solicitudes.</li>
                                <li><strong className="text-slate-800 dark:text-slate-200">Promotor/Director de Agencia:</strong> Usuario responsable de la administración y supervisión de una promotoría o agencia de seguros, y que tiene acceso a la información cargada por los Agentes de Seguros pertenecientes a su promotoría o agencia.</li>
                                <li><strong className="text-slate-800 dark:text-slate-200">Información del Agente:</strong> Todos los datos, documentos e información que el Agente de Seguros deposite, cargue o registre en SYSGPYA, incluyendo pero no limitado a: datos de clientes, datos de contacto, pólizas, primas, pagos, solicitudes, historiales y cualquier otro registro.</li>
                                <li><strong className="text-slate-800 dark:text-slate-200">Ticket de Soporte:</strong> Solicitud de asistencia técnica o intervención administrativa realizada por un Usuario a través de la plataforma SYSGPYA, identificándose con su correo electrónico registrado y sus credenciales digitales de acceso.</li>
                            </ul>
                        </section>

                        <section>
                            <h4 className="font-bold text-slate-900 dark:text-white text-lg mb-2">3. CREACIÓN DE CUENTA Y RESPONSABILIDAD DEL USUARIO</h4>
                            <p><strong>3.1.</strong> Para crear una cuenta en SYSGPYA, el Usuario deberá proporcionar información veraz, completa y actualizada.</p>
                            <p><strong>3.2.</strong> El Usuario es el único responsable de mantener la confidencialidad de sus credenciales de acceso (correo electrónico y contraseña).</p>
                            <p><strong>3.3.</strong> El Usuario será responsable de todas las actividades que se realicen desde su cuenta. En caso de uso no autorizado, el Usuario deberá notificar de inmediato a AACOM.</p>
                            <p><strong>3.4.</strong> La creación de una cuenta por parte del Agente de Seguros implica necesariamente su vinculación a una promotoría o agencia registrada en el sistema.</p>
                        </section>

                        <section>
                            <h4 className="font-bold text-slate-900 dark:text-white text-lg mb-2">4. PERFILES DE USUARIO Y ALCANCE DE ACCESO</h4>
                            <p><strong>4.1. Perfil de Agente de Seguros:</strong> El Agente podrá registrar, modificar, consultar y administrar su propia Información del Agente dentro de la plataforma. El acceso del Agente se limita a su propia información.</p>
                            <p className="mt-2"><strong>4.2. Perfil de Promotor/Director de Agencia:</strong> El Promotor o Director de Agencia tendrá acceso a toda la Información del Agente de todos los Agentes de Seguros pertenecientes a su promotoría o agencia. Lo anterior es inherente a la naturaleza del negocio, dado que las emisiones, pagos, solicitudes y demás operaciones se procesan a través de la oficina de la promotoría o agencia y requieren supervisión y gestión por parte del Promotor o Director.</p>
                            <p className="mt-2"><strong>4.3. Perfil de Administrador (AACOM):</strong> AACOM tendrá acceso a la plataforma únicamente para fines de administración técnica, soporte, seguridad y correcto funcionamiento del sistema, conforme a lo establecido en la Cláusula 7 del presente documento y en el Aviso de Privacidad correspondiente.</p>
                        </section>

                        <section className="bg-teal-50 dark:bg-teal-900/10 p-6 rounded-2xl border border-teal-100 dark:border-teal-900/30">
                            <h4 className="font-bold text-teal-800 dark:text-teal-400 text-lg mb-4">5. CONSENTIMIENTO EXPRESO DEL AGENTE DE SEGUROS</h4>
                            <p className="mb-4">El Agente de Seguros, al crear su cuenta en SYSGPYA y aceptar estos Términos y Condiciones, otorga su consentimiento expreso, libre, informado e inequívoco para:</p>
                            <ul className="list-none space-y-3 mb-4">
                                <li className="flex gap-3">
                                    <span className="font-bold text-teal-600">a)</span>
                                    <span>Que su Promotor o Director de Agencia tenga acceso total, en tiempo real, a toda la Información del Agente que éste deposite, cargue o registre en SYSGPYA.</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="font-bold text-teal-600">b)</span>
                                    <span>Que AACOM, como administrador de la aplicación, tenga acceso a dicha información en los términos y con las limitaciones establecidas en la Cláusula 7 del presente documento y en el Aviso de Privacidad.</span>
                                </li>
                            </ul>
                            <p className="font-bold text-slate-800 dark:text-slate-200 mb-2">El Agente reconoce y acepta que:</p>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>La naturaleza del negocio de seguros requiere que el Promotor o Director de Agencia tenga visibilidad de la información operativa de sus Agentes para la correcta gestión, supervisión y operación de la promotoría o agencia.</li>
                                <li>Las emisiones, pagos, solicitudes y demás operaciones se procesan a través de la oficina de la promotoría o agencia, por lo que el Promotor o Director necesita tener acceso a dicha información.</li>
                            </ul>
                        </section>

                        <section>
                            <h4 className="font-bold text-slate-900 dark:text-white text-lg mb-2">6. PROPIEDAD DE LA INFORMACIÓN</h4>
                            <p><strong>6.1.</strong> La Información del Agente registrada en SYSGPYA es propiedad del Agente de Seguros que la depositó.</p>
                            <p><strong>6.2.</strong> El Promotor o Director de Agencia tiene derecho de acceso y consulta sobre dicha información para los fines operativos y de gestión de la promotoría o agencia, pero no adquiere propiedad sobre la misma.</p>
                            <p><strong>6.3.</strong> AACOM no adquiere ningún derecho de propiedad sobre la Información del Agente. Su papel se limita a ser el administrador técnico de la plataforma.</p>
                        </section>

                        <section>
                            <h4 className="font-bold text-slate-900 dark:text-white text-lg mb-2">7. LIMITACIÓN DE ACCESO DE AACOM A LA INFORMACIÓN</h4>
                            <p className="mb-4"><strong>7.1.</strong> AACOM manifiesta que NO consultará, revisará, accederá ni dará tratamiento a la información particular de las promotorías, agencias, Agentes de Seguros o clientes finales depositada en SYSGPYA, salvo en los siguientes casos:</p>
                            <ul className="list-none space-y-3 mb-4">
                                <li className="flex gap-3">
                                    <span className="font-bold text-teal-600">a)</span>
                                    <span>Cuando el Usuario titular de la información, o el Promotor/Director de Agencia correspondiente, solicite expresamente la intervención de AACOM mediante la apertura de un Ticket de Soporte dentro de la plataforma SYSGPYA.</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="font-bold text-teal-600">b)</span>
                                    <span>Dicho Ticket de Soporte deberá ser presentado por un Usuario debidamente identificado a través de su correo electrónico registrado en el sistema y sus credenciales digitales de acceso.</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="font-bold text-teal-600">c)</span>
                                    <span>La intervención de AACOM se limitará estrictamente al propósito específico señalado en el Ticket de Soporte y únicamente respecto de la información necesaria para atender dicha solicitud.</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="font-bold text-teal-600">d)</span>
                                    <span>En ningún caso AACOM utilizará la información a la que tenga acceso por este motivo para fines distintos a la atención del Ticket de Soporte, ni compartirá dicha información con terceros no autorizados.</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="font-bold text-teal-600">e)</span>
                                    <span>AACOM mantendrá un registro de los Tickets de Soporte atendidos, incluyendo fecha, usuario solicitante y motivo de la intervención.</span>
                                </li>
                            </ul>
                            <p><strong>7.2.</strong> Cualquier acceso por parte de AACOM fuera de los supuestos anteriores constituirá una violación a estos Términos y Condiciones y al Aviso de Privacidad aplicable.</p>
                        </section>

                        <section>
                            <h4 className="font-bold text-slate-900 dark:text-white text-lg mb-2">8. OBLIGACIONES DEL USUARIO</h4>
                            <p className="mb-2">El Usuario se obliga a:</p>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Utilizar SYSGPYA de manera lícita, ética y conforme a estos Términos y Condiciones.</li>
                                <li>No introducir información falsa, inexacta o fraudulenta en la plataforma.</li>
                                <li>No compartir sus credenciales de acceso con terceros.</li>
                                <li>No intentar acceder a información de otros Usuarios sin autorización.</li>
                                <li>Cumplir con la legislación aplicable en materia de protección de datos personales respecto de la información de sus clientes finales.</li>
                                <li>Notificar a AACOM cualquier falla de seguridad o acceso no autorizado a su cuenta.</li>
                            </ul>
                        </section>

                        <section>
                            <h4 className="font-bold text-slate-900 dark:text-white text-lg mb-2">9. SOPORTE TÉCNICO</h4>
                            <p><strong>9.1.</strong> AACOM brindará soporte técnico a los Usuarios de SYSGPYA a través del sistema de Tickets de Soporte integrado en la plataforma.</p>
                            <p><strong>9.2.</strong> El tiempo de respuesta y resolución dependerá de la naturaleza y complejidad del ticket, así como de la disponibilidad de recursos técnicos de AACOM.</p>
                            <p><strong>9.3.</strong> AACOM no garantiza la disponibilidad ininterrumpida del sistema, pero realizará esfuerzos comercialmente razonables para mantener la plataforma operativa.</p>
                        </section>

                        <section>
                            <h4 className="font-bold text-slate-900 dark:text-white text-lg mb-2">10. SUSPENSIÓN Y CANCELACIÓN DE CUENTA</h4>
                            <p className="mb-2"><strong>10.1.</strong> AACOM se reserva el derecho de suspender o cancelar la cuenta de un Usuario que:</p>
                            <ul className="list-disc pl-5 space-y-2 mb-4">
                                <li>Violente estos Términos y Condiciones.</li>
                                <li>Haga un uso indebido o fraudulento de la plataforma.</li>
                                <li>Incumpla con la legislación aplicable.</li>
                                <li>Así lo solicite el Promotor o Director de Agencia respecto de un Agente de Seguros perteneciente a su promotoría o agencia.</li>
                            </ul>
                            <p><strong>10.2.</strong> En caso de cancelación de cuenta, AACOM no estará obligada a conservar la Información del Agente por un período mayor al establecido en el Aviso de Privacidad.</p>
                        </section>

                        <section>
                            <h4 className="font-bold text-slate-900 dark:text-white text-lg mb-2">11. PROPIEDAD INTELECTUAL</h4>
                            <p><strong>11.1.</strong> SYSGPYA, incluyendo su código fuente, diseño, interfaz, logotipos y nombre, es propiedad exclusiva de AACOM.</p>
                            <p><strong>11.2.</strong> El Usuario no adquiere ningún derecho de propiedad intelectual sobre la plataforma. Se le otorga una licencia limitada, no exclusiva e intransferible para usar SYSGPYA de acuerdo con estos Términos y Condiciones.</p>
                        </section>

                        <section>
                            <h4 className="font-bold text-slate-900 dark:text-white text-lg mb-2">12. LEGISLACIÓN APLICABLE Y JURISDICCIÓN</h4>
                            <p>Estos Términos y Condiciones se rigen por las leyes de los Estados Unidos Mexicanos. Cualquier controversia relacionada con el presente documento será sometida a la jurisdicción de los tribunales competentes en la Ciudad de México, renunciando las partes a cualquier otra jurisdicción que pudiera corresponderles.</p>
                        </section>

                        <section>
                            <h4 className="font-bold text-slate-900 dark:text-white text-lg mb-2">13. MODIFICACIONES</h4>
                            <p>AACOM se reserva el derecho de modificar estos Términos y Condiciones en cualquier momento. Las modificaciones entrarán en vigor al momento de su publicación en la aplicación SYSGPYA o en el sitio web www.aacomsoft.com/inicio. El uso continuado de la plataforma después de dichas modificaciones constituye la aceptación de las mismas.</p>
                        </section>

                        <section>
                            <h4 className="font-bold text-slate-900 dark:text-white text-lg mb-2">14. AVISO DE PRIVACIDAD</h4>
                            <p>El tratamiento de los datos personales de los Usuarios se realiza conforme al Aviso de Privacidad de SYSGPYA, el cual forma parte integral de estos Términos y Condiciones. Se recomienda al Usuario leer dicho aviso antes de crear su cuenta.</p>
                        </section>

                    </div>
                </div>

                <DialogFooter className="p-4 md:p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                    <div className="flex flex-col md:flex-row items-center justify-between w-full gap-4">
                        <div className="flex items-center gap-2 text-sm text-slate-500 font-medium bg-slate-200/50 dark:bg-slate-800 px-4 py-2 rounded-lg">
                            <ShieldCheck className="w-5 h-5 text-teal-600" />
                            <span>Al aceptar, tu firma digital quedará registrada en el sistema.</span>
                        </div>
                        <Button 
                            onClick={handleAccept} 
                            disabled={isAccepting}
                            className="w-full md:w-auto h-12 px-8 bg-teal-600 hover:bg-teal-700 text-white font-bold text-base shadow-xl rounded-xl"
                        >
                            {isAccepting ? "Registrando firma..." : "HE LEÍDO Y ACEPTO LOS TÉRMINOS"}
                            {!isAccepting && <CheckCircle2 className="w-5 h-5 ml-2" />}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
