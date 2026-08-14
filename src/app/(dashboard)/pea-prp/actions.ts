"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { startOfMonth, format, isWeekend, addDays } from "date-fns";

// 1. Obtener los Puntos y ADNs del MES en curso para el agente autenticado
export async function getCurrentMonthStats() {
    try {
        const session = await auth();
        if (!session?.user?.id) throw new Error("No autenticado");

        const userId = session.user.id;
        const now = new Date();
        const start = startOfMonth(now); // Día 1 del mes

        // Calcular días hábiles transcurridos hasta hoy
        let businessDays = 0;
        let currentDate = start;
        while (currentDate <= now) {
            if (!isWeekend(currentDate)) {
                businessDays++;
            }
            currentDate = addDays(currentDate, 1);
        }

        const expectedPoints = businessDays * 25;
        const expectedAdns = businessDays * 2;

        // Formato para activityLogs dateStr
        const startStr = format(start, 'yyyy-MM-dd');
        const endStr = format(now, 'yyyy-MM-dd');

        // Sumar puntos
        const logs = await prisma.activityLog.findMany({
            where: {
                userId,
                dateStr: { gte: startStr, lte: endStr }
            }
        });
        const totalPoints = logs.reduce((acc, log) => acc + log.points, 0);

        // Contar ADNs
        const adnsCount = await prisma.adnDiagnostic.count({
            where: {
                userId,
                createdAt: { gte: start, lte: now }
            }
        });

        return { success: true, points: totalPoints, adns: adnsCount, expectedPoints, expectedAdns };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}

// 2. Enviar Evaluación (Agente) -> Dispara IA
export async function submitPerformanceReview(data: {
    reviewId?: string;
    evalMonth?: string;
    evalWeek?: string;
    metaPrimasMensual: number;
    avancePrimasActual: number;
    puntosActividad: number;
    adnsRealizados: number;
    compromisos: string;
}) {
    try {
        const session = await auth();
        if (!session?.user?.id) throw new Error("No autenticado");

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { id: true, name: true, agencyId: true, agency: { select: { name: true } } }
        });

        if (!user) throw new Error("Usuario no encontrado");

        const agencyName = user.agency?.name || "AACOM";

        // Calcular prorrateo para la IA
        let factorProrrateo = 1;
        if (data.evalWeek === "Semana 1") factorProrrateo = 0.25;
        if (data.evalWeek === "Semana 2") factorProrrateo = 0.50;
        if (data.evalWeek === "Semana 3") factorProrrateo = 0.75;
        if (data.evalWeek === "Semana 4" || data.evalWeek === "Cierre de Mes") factorProrrateo = 1;

        // Asumimos un mes promedio de 20 días hábiles (500 pts / 40 ADNs al mes)
        const expectedPuntos = 500 * factorProrrateo;
        const expectedAdns = 40 * factorProrrateo;

        // Preparar el PROMPT MAESTRO
        const systemInstruction = `
Rol: Eres el "Motor de Inteligencia de Desempeño" de ${agencyName}. Tu función es gestionar el ciclo de vida de metas del agente, integrando estrictamente la actividad operativa con la ejecución financiera.

Contexto Temporal (CRÍTICO):
- Mes Evaluado: ${data.evalMonth || "Mes actual"}
- Corte de Evaluación: ${data.evalWeek || "Cierre de Mes"}
- Progreso Teórico del Mes transcurrido (Run Rate esperado): ${factorProrrateo * 100}%

Entradas de datos a procesar:
- Data Operativa Mensual (Prorrateada al corte temporal actual): Puntos logrados = ${data.puntosActividad} (Meta esperada al corte: ${expectedPuntos}), ADN's nuevos logrados = ${data.adnsRealizados} (Meta esperada al corte: ${expectedAdns}).
- Compromisos cualitativos pactados: "${data.compromisos || "Ninguno"}"
- Data Financiera: Meta Primas Mensual: $${data.metaPrimasMensual}, Avance Primas Actual: $${data.avancePrimasActual}.

Tu metodología de procesamiento:
1. Evaluación de Sostenibilidad: Analiza el progreso del agente tomando en cuenta el "Corte de Evaluación". Si estamos en la "Semana 1", el avance financiero esperado es solo del 25% de la meta mensual. Evalúa el progreso basándote en este "Run Rate" esperado y bajo ninguna circunstancia asumas que el mes ha terminado. No castigues un avance financiero bajo si es el inicio del periodo; enfócate en trazar la ruta para lograr el 100% al cierre del mes.
2. Correlación Actividad vs Resultado: 
   - Analiza si la actividad real está alineada a la actividad esperada para el corte actual.
   - Si avance es bajo pero actividad es alta, analiza si el problema es la tasa de conversión (calidad del ADN o cierre).
   - Si la actividad es baja, advierte que el incumplimiento es inminente.
3. Gestión de Entradas: Calcula el "gap" diario o semanal necesario para alcanzar la meta y recomiéndale acciones.

Salida del Output (Reporte Estructurado):
Debes generar tu respuesta en HTML limpio usando exactamente la siguiente estructura de etiquetas para poder ser renderizada:

<div class="ai-resumen bg-slate-50 dark:bg-zinc-900 p-4 rounded-lg border border-slate-200 dark:border-zinc-800 mb-4">
  <h3 class="text-lg font-bold text-slate-800 dark:text-zinc-100 mb-2">Resumen Ejecutivo</h3>
  <p class="text-slate-600 dark:text-zinc-300">[Genera el resumen aquí]</p>
</div>
<div class="ai-diagnostico bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg border border-amber-200 dark:border-amber-900 mb-4">
  <h3 class="text-lg font-bold text-amber-800 dark:text-amber-500 mb-2">Diagnóstico</h3>
  <p class="text-amber-700 dark:text-amber-400">[Genera el diagnóstico aquí]</p>
</div>
<div class="ai-accion bg-teal-50 dark:bg-teal-950/20 p-4 rounded-lg border border-teal-200 dark:border-teal-900 mb-4">
  <h3 class="text-lg font-bold text-teal-800 dark:text-teal-500 mb-2">Acción Inmediata</h3>
  <ul class="list-disc pl-5 text-teal-700 dark:text-teal-400">
    <li>[Genera paso 1]</li>
  </ul>
</div>

Tono: Exigente, analítico, enfocado en el crecimiento profesional y la excelencia operativa de ${agencyName}. Dirígete en segunda persona (tú) al Agente.
No uses markdown (\`\`\`), devuelve únicamente el HTML exacto con las clases de Tailwind especificadas.
`;

        const apiKey = process.env.GEMINI_API_KEY;
        let aiResultHTML = "";

        if (apiKey) {
            const apiRes = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.7-flash:generateContent?key=" + apiKey, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ role: "user", parts: [{ text: systemInstruction }] }],
                    generationConfig: { temperature: 0.3 }
                })
            });

            if (apiRes.ok) {
                const apiData = await apiRes.json();
                if (apiData.candidates?.[0]?.content?.parts?.[0]?.text) {
                    aiResultHTML = apiData.candidates[0].content.parts[0].text;
                    aiResultHTML = aiResultHTML.replace(/\`\`\`html/g, "").replace(/\`\`\`/g, "").trim();
                }
            } else {
                console.error("Gemini Error:", await apiRes.text());
                aiResultHTML = "<p><em>Error al procesar el dictamen con IA. Los datos fueron guardados.</em></p>";
            }
        } else {
            aiResultHTML = "<p><em>Motor de IA inactivo (Falta API Key). Los datos fueron guardados.</em></p>";
        }

        const updateData = {
            status: "PENDING",
            evalMonth: data.evalMonth,
            evalWeek: data.evalWeek,
            metaPrimasMensual: data.metaPrimasMensual,
            avancePrimasActual: data.avancePrimasActual,
            puntosActividad: data.puntosActividad,
            adnsRealizados: data.adnsRealizados,
            compromisos: data.compromisos,
            aiAnalysisResult: aiResultHTML,
            feedback: null // Limpiamos cualquier feedback anterior
        };

        if (data.reviewId) {
            // Actualizar reporte existente
            await prisma.performanceReview.update({
                where: { id: data.reviewId, agentId: user.id }, // Solo el dueño puede editar
                data: updateData
            });
            revalidatePath('/pea-prp');
            return { success: true, reviewId: data.reviewId };
        } else {
            // Guardar en Base de Datos
            const review = await prisma.performanceReview.create({
                data: {
                    agentId: user.id,
                    agencyId: ((session?.user?.agencyId || user.agencyId) as string),
                    ...updateData
                }
            });
            revalidatePath('/pea-prp');
            return { success: true, reviewId: review.id };
        }

    } catch (e: any) {
        return { success: false, message: e.message };
    }
}

// 3. Obtener Evaluaciones
export async function getPerformanceReviews() {
    try {
        const session = await auth();
        if (!session?.user?.id) throw new Error("No autenticado");

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true, agencyId: true, id: true }
        });

        if (!user) throw new Error("Usuario no encontrado");

        // Si es Admin, trae las de su agencia. Si es agente, trae solo las suyas.
        const whereClause: any = {};
        if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") {
            whereClause.agencyId = ((session?.user?.agencyId || user.agencyId) as string);
        } else {
            whereClause.agentId = user.id;
        }

        const reviews = await prisma.performanceReview.findMany({
            where: whereClause,
            include: { agent: { select: { name: true } }, evaluator: { select: { name: true } } },
            orderBy: { createdAt: 'desc' }
        });

        return { success: true, reviews };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}

// 4. Autorizar Revisión (Admin)
export async function authorizeReview(reviewId: string, feedback?: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) throw new Error("No autenticado");

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true, id: true }
        });

        if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
            throw new Error("No tienes permisos para autorizar.");
        }

        await prisma.performanceReview.update({
            where: { id: reviewId },
            data: {
                status: 'REVIEWED',
                evaluatorId: user.id,
                ...(feedback && { feedback })
            }
        });

        revalidatePath('/pea-prp');
        return { success: true };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}

// 5. Rechazar Revisión (Admin)
export async function rejectReview(reviewId: string, feedback: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) throw new Error("No autenticado");

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true, id: true }
        });

        if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
            throw new Error("No tienes permisos para rechazar.");
        }

        await prisma.performanceReview.update({
            where: { id: reviewId },
            data: { status: "REJECTED", evaluatorId: user.id, feedback }
        });

        revalidatePath('/pea-prp');
        return { success: true };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}

// 6. Eliminar Revisión (Admin)
export async function deleteReview(reviewId: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) throw new Error("No autenticado");

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true, agencyId: true }
        });

        if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
            throw new Error("No tienes permisos para eliminar.");
        }

        const review = await prisma.performanceReview.findUnique({
            where: { id: reviewId },
            select: { agencyId: true }
        });

        if (!review) throw new Error("Reporte no encontrado.");
        if (review.agencyId !== ((session?.user?.agencyId || user.agencyId) as string)) throw new Error("No puedes eliminar reportes de otra agencia.");

        await prisma.performanceReview.delete({
            where: { id: reviewId }
        });

        revalidatePath('/pea-prp');
        return { success: true };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}
