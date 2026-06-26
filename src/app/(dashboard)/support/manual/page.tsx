import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, Building2, UserCircle2 } from "lucide-react";
import Link from "next/link";

export default function ManualPage() {
    return (
        <div className="max-w-4xl mx-auto p-4 md:p-6 pb-20">
            <div className="flex items-center gap-4 mb-6">
                <Link href="/support">
                    <Button variant="outline" size="icon" className="h-10 w-10 shrink-0">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <BookOpen className="h-6 w-6 text-blue-600" />
                        Manual de Usuario Oficial
                    </h1>
                    <p className="text-slate-500 dark:text-zinc-400">Todo lo que necesitas saber para dominar SYSGPYA.</p>
                </div>
            </div>

            <div className="space-y-8">
                {/* MANUAL DEL ADMIN */}
                <Card className="border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                    <div className="bg-slate-900 dark:bg-black p-6 text-white flex items-center gap-3">
                        <Building2 className="h-8 w-8 text-blue-400" />
                        <div>
                            <h2 className="text-xl font-bold">SECCIÓN 1: MANUAL DEL ADMINISTRADOR (Dueño de Agencia)</h2>
                            <p className="text-sm text-slate-300">Como Administrador, tu panel de control es tu centro de comando. Desde aquí auditas el desempeño de tus agentes y mides la productividad en tiempo real.</p>
                        </div>
                    </div>
                    <CardContent className="p-6 space-y-6">
                        
                        <div className="space-y-2">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 border-b pb-2">1. Productividad de Agentes</h3>
                            <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-400">
                                <li><strong className="text-slate-700 dark:text-slate-300">Propósito:</strong> Medir y auditar la actividad diaria y el avance comercial de tu equipo.</li>
                                <li><strong className="text-slate-700 dark:text-slate-300">Campaña de Premiación (Ranking #1):</strong> Sube un banner (imagen) promocional (ej. "Gánate 4 boletos VIP para Cinépolis"). Esta imagen aparecerá en la parte superior de la pantalla de todos tus agentes para motivarlos a competir.</li>
                                <li><strong className="text-slate-700 dark:text-slate-300">Mix de Productos:</strong> Visualiza en gráficas qué productos se están cotizando más en tu agencia (ej. VPL, Insignia Life, Vida, etc.).</li>
                                <li><strong className="text-slate-700 dark:text-slate-300">Métricas Globales:</strong> Revisa el número de agentes activos y el volumen de primas globales cotizadas en tiempo real.</li>
                            </ul>
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 border-b pb-2">2. Historial de Cotizaciones</h3>
                            <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-400">
                                <li><strong className="text-slate-700 dark:text-slate-300">Propósito:</strong> Un registro maestro de todas las cotizaciones generadas por tus asesores.</li>
                                <li><strong className="text-slate-700 dark:text-slate-300">Uso:</strong> Puedes filtrar las cotizaciones por agente o buscar por nombre de cliente. Esto te permite auditar el trabajo, ver qué productos se ofrecen y dar seguimiento a cotizaciones estancadas o perdidas.</li>
                            </ul>
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 border-b pb-2">3. Gestión de Agentes</h3>
                            <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-400">
                                <li><strong className="text-slate-700 dark:text-slate-300">Propósito:</strong> Alta, baja y administración de tu fuerza de ventas.</li>
                                <li><strong className="text-slate-700 dark:text-slate-300">Creación de Agentes:</strong> Registra a nuevos asesores ingresando su Nombre, Correo, Cédula y seleccionando su nivel (Consolidado, En Desarrollo, Novato). El sistema les enviará automáticamente sus credenciales de acceso.</li>
                                <li><strong className="text-slate-700 dark:text-slate-300">Control de Acceso:</strong> Puedes desactivar temporalmente el acceso de un agente o eliminarlo definitivamente si ya no colabora en la agencia.</li>
                            </ul>
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 border-b pb-2">4. Diagnóstico ADN</h3>
                            <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-400">
                                <li><strong className="text-slate-700 dark:text-slate-300">Propósito:</strong> Revisar los análisis de necesidades financieras (ADN) que los agentes han realizado a sus clientes.</li>
                                <li><strong className="text-slate-700 dark:text-slate-300">Uso:</strong> Al hacer clic en el nombre del cliente, podrás ver todas sus metas financieras, el dictamen generado por la IA y sugerir estrategias de cierre a tu agente.</li>
                            </ul>
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 border-b pb-2">5. Banners de Inicio</h3>
                            <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-400">
                                <li><strong className="text-slate-700 dark:text-slate-300">Propósito:</strong> Comunicación interna.</li>
                                <li><strong className="text-slate-700 dark:text-slate-300">Uso:</strong> Sube imágenes tipo "Comunicado" que aparecerán en la pantalla de inicio de todos tus agentes apenas inicien sesión. Útil para avisos, felicitaciones o promociones exclusivas de la agencia.</li>
                            </ul>
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 border-b pb-2">6. Actividad 25</h3>
                            <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-400">
                                <li><strong className="text-slate-700 dark:text-slate-300">Propósito:</strong> Medición micrométrica de la prospección diaria.</li>
                                <li><strong className="text-slate-700 dark:text-slate-300">Uso:</strong> Filtra por fechas y por agente para ver exactamente cuántas llamadas, citas, cierres y referidos registraron en su día a día. Te ayudará a detectar si un agente está fallando en la prospección o en el cierre.</li>
                            </ul>
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 border-b pb-2">7. Asistente (Conocimiento)</h3>
                            <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-400">
                                <li><strong className="text-slate-700 dark:text-slate-300">Propósito:</strong> Entrenar a la Inteligencia Artificial de la agencia.</li>
                                <li><strong className="text-slate-700 dark:text-slate-300">Uso:</strong> Carga documentos PDF, reglamentos, condiciones generales de seguros o pega texto directamente. El Asistente IA leerá estos documentos y los usará para responder automáticamente a las dudas técnicas de tus agentes las 24 horas del día.</li>
                            </ul>
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 border-b pb-2">8. Push Notifications (Notificaciones)</h3>
                            <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-400">
                                <li><strong className="text-slate-700 dark:text-slate-300">Propósito:</strong> Mantener a tu equipo conectado.</li>
                                <li><strong className="text-slate-700 dark:text-slate-300">Automáticas:</strong> Enciende o apaga los recordatorios del sistema (ej. Recordarles a las 2:30 PM llenar su planeación diaria).</li>
                                <li><strong className="text-slate-700 dark:text-slate-300">Manuales:</strong> Envía un mensaje directo al celular o computadora de tus agentes al instante.</li>
                            </ul>
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 border-b pb-2">9. Votaciones</h3>
                            <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-400">
                                <li><strong className="text-slate-700 dark:text-slate-300">Propósito:</strong> Participar en el futuro de la plataforma.</li>
                                <li><strong className="text-slate-700 dark:text-slate-300">Uso:</strong> Ocasionalmente, el corporativo lanzará encuestas. Desde aquí podrás votar por la mejora o función que más te gustaría ver implementada en la siguiente actualización.</li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>

                {/* MANUAL DEL AGENTE */}
                <Card className="border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                    <div className="bg-teal-700 dark:bg-teal-900 p-6 text-white flex items-center gap-3">
                        <UserCircle2 className="h-8 w-8 text-teal-200" />
                        <div>
                            <h2 className="text-xl font-bold">SECCIÓN 2: MANUAL DEL AGENTE (Asesor Comercial)</h2>
                            <p className="text-sm text-teal-100">Como Agente, esta plataforma es tu asistente personal, tu cotizador y tu CRM. Todo está diseñado para ahorrarte tiempo y ayudarte a cerrar más negocios.</p>
                        </div>
                    </div>
                    <CardContent className="p-6 space-y-6">
                        
                        <div className="space-y-2">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 border-b pb-2">1. Dashboard Principal (Ranking)</h3>
                            <p className="text-slate-600 dark:text-slate-400">Al iniciar sesión, verás los comunicados de tu agencia y la campaña de premiación mensual. También tendrás acceso rápido a tus métricas mensuales para saber qué tan cerca estás de tus metas.</p>
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 border-b pb-2">2. PEA / PRP (Planeación Diaria)</h3>
                            <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-400">
                                <li><strong className="text-slate-700 dark:text-slate-300">Propósito:</strong> Estructurar tu día para el éxito.</li>
                                <li><strong className="text-slate-700 dark:text-slate-300">Uso:</strong> Todas las mañanas, entra a esta sección y anota tus metas de llamadas, citas nuevas, presentaciones y cierres. Al final del día, el sistema te pedirá que registres qué fue lo que realmente lograste para llevar tu estadística de efectividad.</li>
                            </ul>
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 border-b pb-2">3. Actividad 25</h3>
                            <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-400">
                                <li><strong className="text-slate-700 dark:text-slate-300">Propósito:</strong> Registrar tus prospectos en tiempo real.</li>
                                <li><strong className="text-slate-700 dark:text-slate-300">Uso:</strong> Cada vez que consigas un nombre, hagas una llamada o agendes una cita, anótalo aquí. El sistema te asignará puntos diarios. ¡Alcanzar 25 puntos diarios es la garantía matemática del éxito!</li>
                            </ul>
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 border-b pb-2">4. Cotizador Maestro</h3>
                            <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-400">
                                <li><strong className="text-slate-700 dark:text-slate-300">Propósito:</strong> Generar propuestas profesionales al instante.</li>
                                <li><strong className="text-slate-700 dark:text-slate-300">Uso:</strong> Ingresa los datos de tu prospecto, selecciona el tipo de seguro y ajusta la suma asegurada. El sistema calculará las primas usando el valor exacto de la UDI del día y te generará una presentación profesional en PDF.</li>
                            </ul>
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 border-b pb-2">5. Diagnóstico ADN (Análisis de Necesidades)</h3>
                            <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-400">
                                <li><strong className="text-slate-700 dark:text-slate-300">Propósito:</strong> Descubrir las verdaderas necesidades de tu cliente mediante Inteligencia Artificial.</li>
                                <li><strong className="text-slate-700 dark:text-slate-300">Uso:</strong> Llena el formulario financiero con tu cliente (ingresos, gastos, metas). Al terminar, la Inteligencia Artificial de AACOM analizará los datos y te entregará un "Dictamen" recomendando exactamente qué producto debes venderle y con qué argumentos.</li>
                            </ul>
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 border-b pb-2">6. Mi Cartera (Historial)</h3>
                            <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-400">
                                <li><strong className="text-slate-700 dark:text-slate-300">Propósito:</strong> Tu archivo de clientes.</li>
                                <li><strong className="text-slate-700 dark:text-slate-300">Uso:</strong> Aquí viven todas las cotizaciones y diagnósticos ADN que has generado. Puedes buscar clientes antiguos, descargar sus cotizaciones nuevamente o retomar un caso pendiente.</li>
                            </ul>
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 border-b pb-2">7. Asistente IA</h3>
                            <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-400">
                                <li><strong className="text-slate-700 dark:text-slate-300">Propósito:</strong> Resolver tus dudas al instante.</li>
                                <li><strong className="text-slate-700 dark:text-slate-300">Uso:</strong> Tienes un chat privado con un robot entrenado con los lineamientos y condiciones de tu agencia. Pregúntale cosas técnicas y te contestará en segundos, sin importar la hora.</li>
                            </ul>
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 border-b pb-2">8. Biblioteca de Documentos</h3>
                            <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-400">
                                <li><strong className="text-slate-700 dark:text-slate-300">Propósito:</strong> Material de apoyo.</li>
                                <li><strong className="text-slate-700 dark:text-slate-300">Uso:</strong> Descarga folletos, formatos de aseguradoras, calculadoras y manuales que tu agencia o el corporativo han puesto a tu disposición. Siempre tendrás la versión más actualizada.</li>
                            </ul>
                        </div>

                    </CardContent>
                </Card>

            </div>
        </div>
    );
}
