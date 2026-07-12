'use server'

import { appendToSheet } from "@/lib/google-sheets";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { SALES_ACTIVITIES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import webpush from "web-push";

function enforceDemoSafety(session: any) {
    if (session?.user?.id === 'demo-user-id') {
        throw new Error("Estás en Modo Demo (Solo Lectura). Esta acción ha sido bloqueada para proteger la base de datos.");
    }
}

export interface ActivityInput {
    activityId: string;
    planned: number;
    real: number;
}

export async function saveActivity(records: ActivityInput[]) {
    const session = await auth();

    if (!session?.user?.email) {
        return { success: false, message: "No autenticado" };
    }
    
    enforceDemoSafety(session);

    const userEmail = session.user.email;
    // Use Mexico City time to avoid UTC rollover issues late at night
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' });

    // Prepare data for Google Sheets (Wide Format)
    // Columns:
    // A: ID_USUARIO (User Email)
    // B: FECHA (YYYY-MM-DD)
    // C: PLANEACION_TOTAL_PUNTOS (Sum of all planned * value)
    // D: REAL_TOTAL_PUNTOS (Sum of all real * value)
    // E: LLAMADAS_REALES (Activity 1 Real)
    // F: CITAS_AGENDADAS_PLANEADA (Activity 2 Planned)
    // G: CITAS_AGENDADAS_REALES (Activity 2 Real)
    // H: CITAS_EFECTIVAS_PLANEADAS (Activity 3 Planned)
    // I: CITAS_EFECTIVAS_REALES (Activity 3 Real)
    // J: CIERRE_DE_POLIZA_PLANEADA (Activity 5 Planned - Cierre de Ventas)
    // K: CIERRE_DE_POLIZA_REALES (Activity 5 Real - Cierre de Ventas)
    // L: SOLICITUD_REFERIDOS_PLANEADA (Activity 6 Planned)
    // M: SOLICITUD_REFERIDOS_REALES (Activity 6 Real)
    // N: ENTREGA_POLIZA_PLANEADA (Activity 7 Planned)
    // O: ENTREGA_POLIZA_REALES (Activity 7 Real)
    // P: PRESENTACION_PROPUESTAS_PLANEADA (Activity 4 Planned)
    // Q: PRESENTACION_PROPUESTAS_REALES (Activity 4 Real)
    // R: PROSPECCION_PLANEADA (Activity 1 Planned)

    // NOTE: Mapping is based on best guess from screenshot headings. 
    // Ideally we would double check strict column order.
    // For now assuming:
    // 1. Llamadas, 2. Citas Iniciales, 3. Analisis, 4. Propuestas, 5. Cierre, 6. Referidos, 7. Entrega

    let totalPlannedPoints = 0;
    let totalRealPoints = 0;

    const map = new Map<string, { planned: number, real: number, value: number }>();

    records.forEach(r => {
        const activity = SALES_ACTIVITIES.find(a => a.id === r.activityId);
        if (activity) {
            map.set(activity.id, {
                planned: r.planned,
                real: r.real,
                value: activity.value
            });
            totalPlannedPoints += r.planned * activity.value;
            totalRealPoints += r.real * activity.value;
        }
    });

    const getVal = (id: string, type: 'planned' | 'real') => (map.get(id)?.[type] || 0).toString();

    // Mapping based on headers observed:
    // E: LLAMADAS_REALES -> Act 1 (Real)
    // F: CITAS_AGENDADAS_PLAN -> Act 2 (Plan)
    // G: CITAS_AGENDADAS_REAL -> Act 2 (Real)
    // H: CITAS_EFECTIVAS_PLAN -> Act 3 (Analisis? or Citas Efectivas is a different name for Analisis?) -> Assuming Act 3 (Analisis) matches contextually or user custom name
    // ... This is tricky without exact ID mapping.

    // STRICT MAPPING ATTEMPT based on screenshot vs constants:
    // "Llamadas de ProspecciÃƒÆ’Ã‚Â³n" (1) -> LLAMADAS (E)
    // "Citas Iniciales" (2) -> CITAS AGENDADAS (F, G)
    // "AnÃƒÆ’Ã‚Â¡lisis de Necesidades" (3) -> CITAS EFECTIVAS (H, I) ?? (Analysis often implies an effective meeting)
    // "Cierre de Ventas" (5) -> CIERRE DE POLIZA (J, K)

    // Let's try to follow the ID order from constants constants.ts:
    // 1: Prospeccion, 2: Citas In, 3: Analisis, 4: Propuestas, 5: Cierre, 6: Referidos, 7: Entrega

    // Warning: The screenshot columns after K are cut off. 
    // I will write a generic row based on ID order which is robust if limits match, 
    // OR likely:
    // A, B, C, D
    // E: Act 1 Real (Llamadas) - NO PLANNED COLUMN? Screenshot E is LLAMADAS_REALES.
    // F: Act 2 Planned (Citas Agendadas)
    // G: Act 2 Real
    // H: Act 3 Planned (Analisis/Citas Efectivas)
    // I: Act 3 Real
    // J: Act 5 Planned (Cierre - Note jump to 5)
    // K: Act 5 Real

    // It seems the user's sheet has a custom order. I will try to map common ones.

    const row = [
        userEmail, // A
        today,     // B
        totalPlannedPoints.toString(), // C
        totalRealPoints.toString(),    // D
        getVal('1', 'real'), // E: LLAMADAS_REALES
        getVal('2', 'planned'), // F: CITAS_AGENDADAS_PLAN
        getVal('2', 'real'),    // G: CITAS_AGENDADAS_REAL
        getVal('3', 'planned'), // H: CITAS_EFECTIVAS_PLAN (Analisis)
        getVal('3', 'real'),    // I: CITAS_EFECTIVAS_REAL (Analisis)
        getVal('5', 'planned'), // J: CIERRE_POLIZA_PLAN
        getVal('5', 'real'),    // K: CIERRE_POLIZA_REAL
        getVal('4', 'planned'), // L: PROPUESTAS_PLAN (Guessing next cols)
        getVal('4', 'real'),    // M: PROPUESTAS_REAL
        getVal('6', 'planned'), // N: REFERIDOS_PLAN
        getVal('6', 'real'),    // O: REFERIDOS_REAL
        getVal('7', 'planned'), // P: ENTREGA_PLAN
        getVal('7', 'real'),    // Q: ENTREGA_REAL
    ];

    const sheetRows = [row];

    try {
        // 1. Save to Google Sheets
        if (sheetRows.length > 0) {
            await appendToSheet(sheetRows, 'ACTIVIDAD_DIARIA!A1');
        }

        // 2. Save to DB (Prisma) - Placeholder for now
        // await prisma.dailyRecord.createMany(...)

        revalidatePath('/activity');
        return { success: true, message: "Guardado correctamente" };
    } catch (error: any) {
        console.error("Error saving activity:", error);
        // Return explicit error for debugging
        return { success: false, message: `Error al guardar: ${error.message || 'Desconocido'}` };
    }
}

export async function saveCotizacion(data: {
    cliente: string;
    telefono: string;
    agente: string;
    producto: string;
    primaAnual: number;
    totalPrima: number;
    ahorro: number;
    rendimiento: number;
    valorUdi?: number;
    inflacionUdi?: number;
    duracion?: string;
    isr?: number;
    coberturas?: string;
    projectionData?: string;
}) {
    const session = await auth();
    if (!session?.user?.email) {
        return { success: false, message: "No autenticado" };
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user) {
            return { success: false, message: "Usuario no encontrado" };
        }

        if (user.agencyId === 'demo-agency-id') {
            const count = await prisma.cotizacion.count({ where: { agencyId: 'demo-agency-id' } });
            if (count >= 5) {
                return { success: false, message: "Límite de demostración alcanzado (máx. 5 cotizaciones). Adquiere una suscripción para uso ilimitado." };
            }
        }

        const newCotizacion = await prisma.cotizacion.create({
            data: {
                userId: user.id,
                agencyId: user.agencyId,
                cliente: data.cliente,
                telefono: data.telefono,
                agente: data.agente,
                producto: data.producto,
                primaAnual: data.primaAnual,
                totalPrima: data.totalPrima,
                ahorro: data.ahorro,
                rendimiento: data.rendimiento,
                valorUdi: data.valorUdi,
                inflacionUdi: data.inflacionUdi,
                duracion: data.duracion,
                isr: data.isr,
                coberturas: data.coberturas,
                projectionData: data.projectionData,
            }
        });
        return { success: true, cotizacion: newCotizacion };
    } catch (error: any) {
        console.error("Error saving cotizacion:", error);
        return { success: false, message: error.message || "Error al guardar cotizaciÃƒÆ’Ã‚Â³n" };
    }
}

export async function getCotizaciones(options?: { month?: number, year?: number, limitTo30Days?: boolean }) {
    const session = await auth();
    if (!session?.user?.email) {
        return { success: false, message: "No autenticado", cotizaciones: [] };
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user) {
            return { success: false, message: "Usuario no encontrado", cotizaciones: [] };
        }

        let whereClause: any = { agencyId: user.agencyId };
        if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
            whereClause.userId = user.id;
        }

        if (options?.year !== undefined) {
            if (options?.month !== undefined) {
                const startDate = new Date(options.year, options.month, 1);
                const endDate = new Date(options.year, options.month + 1, 1);
                whereClause.createdAt = {
                    gte: startDate,
                    lt: endDate
                };
            } else {
                const startDate = new Date(options.year, 0, 1);
                const endDate = new Date(options.year + 1, 0, 1);
                whereClause.createdAt = {
                    gte: startDate,
                    lt: endDate
                };
            }
        } else if (options?.limitTo30Days !== false) {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            whereClause.createdAt = {
                gte: thirtyDaysAgo
            };
        }

        const list = await prisma.cotizacion.findMany({
            where: whereClause,
            orderBy: {
                createdAt: 'desc'
            }
        });
        return { success: true, cotizaciones: list };
    } catch (error: any) {
        console.error("Error fetching cotizaciones:", error);
        return { success: false, message: error.message || "Error al consultar cotizaciones" };
    }
}

export async function getAdminDashboardStats() {
    const session = await auth();
    if (!session?.user?.email) {
        return { success: false, message: "No autenticado" };
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
            return { success: false, message: "No autorizado" };
        }

        // Obtener solo campos necesarios para TODO el historial
        const list = await prisma.cotizacion.findMany({
            where: { agencyId: user.agencyId },
            select: { agente: true, createdAt: true, producto: true, primaAnual: true }
        });

        const agentStatsMap: any = {};
        const globalProductCounts: any = {};
        const agentProductCounts: any = {};

        const rightNow = new Date();
        const currYear = rightNow.getFullYear();
        const currMonth = rightNow.getMonth();

        const isThisMonth = (date: Date) => date.getFullYear() === currYear && date.getMonth() === currMonth;
        const isLastMonth = (date: Date) => {
            const targetYear = currMonth === 0 ? currYear - 1 : currYear;
            const targetMonth = currMonth === 0 ? 11 : currMonth - 1;
            return date.getFullYear() === targetYear && date.getMonth() === targetMonth;
        };
        const isThisYear = (date: Date) => date.getFullYear() === currYear;
        const getWeekDiff = (date: Date) => {
            const diffTime = rightNow.getTime() - date.getTime();
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            return Math.floor(diffDays / 7);
        };

        list.forEach((item: any) => {
            const agentName = item.agente || "Sin Agente";
            const date = new Date(item.createdAt);
            const prod = item.producto;

            globalProductCounts[prod] = (globalProductCounts[prod] || 0) + 1;

            if (!agentProductCounts[agentName]) agentProductCounts[agentName] = {};
            agentProductCounts[agentName][prod] = (agentProductCounts[agentName][prod] || 0) + 1;

            if (!agentStatsMap[agentName]) {
                agentStatsMap[agentName] = {
                    name: agentName,
                    total: 0,
                    thisMonth: 0,
                    lastMonth: 0,
                    thisYear: 0,
                    totalPremium: 0,
                    avgPremium: 0,
                    mostCotizedProduct: "",
                    weeklyCounts: [0, 0, 0, 0]
                };
            }

            const stats = agentStatsMap[agentName];
            stats.total += 1;
            stats.totalPremium += item.primaAnual;

            if (isThisMonth(date)) stats.thisMonth += 1;
            if (isLastMonth(date)) stats.lastMonth += 1;
            if (isThisYear(date)) stats.thisYear += 1;

            const weekDiff = getWeekDiff(date);
            if (weekDiff >= 0 && weekDiff < 4) {
                stats.weeklyCounts[weekDiff] += 1;
            }
        });

        const agentStatsList = Object.values(agentStatsMap).map((stats: any) => {
            stats.avgPremium = stats.total > 0 ? stats.totalPremium / stats.total : 0;
            const counts = agentProductCounts[stats.name];
            let favoriteProduct = "Ninguno";
            let maxCount = -1;
            if (counts) {
                Object.entries(counts).forEach(([prod, count]: any) => {
                    if (count > maxCount) {
                        maxCount = count;
                        favoriteProduct = prod;
                    }
                });
            }
            stats.mostCotizedProduct = favoriteProduct;
            return stats;
        }).sort((a: any, b: any) => b.total - a.total);

        const totalCount = list.length;
        const totalPrimasPesos = list.reduce((acc: number, item: any) => acc + item.primaAnual, 0);

        return { 
            success: true, 
            agentStatsList, 
            globalProductCounts,
            totalCount,
            totalPrimasPesos
        };
    } catch (error: any) {
        console.error("Error computing dashboard stats:", error);
        return { success: false, message: error.message || "Error al calcular estadísticas" };
    }
}

export async function saveUdiSetting(value: number) {
    try {
        const setting = await prisma.setting.upsert({
            where: { key: "udi_default" },
            update: { value: value.toString() },
            create: { key: "udi_default", value: value.toString() }
        });
        return { success: true, setting };
    } catch (error: any) {
        console.error("Error saving UDI setting:", error);
        return { success: false, message: error.message || "Error al guardar valor de UDI" };
    }
}

export async function getUdiSetting() {
    try {
        const setting = await prisma.setting.findUnique({
            where: { key: "udi_default" }
        });
        return { success: true, value: setting ? parseFloat(setting.value) : 8.25 };
    } catch (error: any) {
        console.error("Error fetching UDI setting:", error);
        return { success: false, value: 8.25 };
    }
}

export async function saveRankingBanner(base64Image: string) {
    try {
        const setting = await prisma.setting.upsert({
            where: { key: "ranking_banner_image" },
            update: { value: base64Image },
            create: { key: "ranking_banner_image", value: base64Image }
        });
        return { success: true, setting };
    } catch (error: any) {
        console.error("Error saving ranking banner:", error);
        return { success: false, message: error.message || "Error al guardar imagen de ranking" };
    }
}

export async function getRankingBanner() {
    try {
        const setting = await prisma.setting.findUnique({
            where: { key: "ranking_banner_image" }
        });
        return { success: true, value: setting ? setting.value : null };
    } catch (error: any) {
        console.error("Error fetching ranking banner:", error);
        return { success: false, value: null };
    }
}

export async function getAgents() {
    try {
        const session = await auth();
        if (!session?.user?.email) throw new Error("No autenticado");
        const user = await prisma.user.findUnique({where: {email: session.user.email}});
        if (!user) throw new Error("Usuario no encontrado");

        const agents = await prisma.agent.findMany({
            where: { agencyId: user.agencyId || null },
            orderBy: { name: 'asc' }
        });
        return { success: true, agents };
    } catch (error: any) {
        console.error("Error fetching agents:", error);
        return { success: false, message: error.message || "Error al obtener agentes", agents: [] };
    }
}

export async function createAgent(name: string) {
    try {
        const session = await auth();
        if (!session?.user?.email) throw new Error("No autenticado");
        const user = await prisma.user.findUnique({where: {email: session.user.email}});
        if (!user) throw new Error("Usuario no encontrado");

        const trimmedName = name.trim();
        if (!trimmedName) {
            return { success: false, message: "El nombre del agente no puede estar vacío" };
        }
        
        const existing = await prisma.agent.findUnique({
            where: { name_agencyId: { name: trimmedName, agencyId: user.agencyId || '' } }
        });
        
        if (existing) {
            return { success: false, message: "Este agente ya se encuentra registrado" };
        }

        const newAgent = await prisma.agent.create({
            data: { name: trimmedName, agencyId: user.agencyId || null }
        });
        return { success: true, agent: newAgent };
    } catch (error: any) {
        console.error("Error creating agent:", error);
        return { success: false, message: error.message || "Error al registrar el agente" };
    }
}

export async function deleteAgent(id: string) {
    try {
        const session = await auth();
        if (!session?.user?.email) throw new Error("No autenticado");
        const user = await prisma.user.findUnique({where: {email: session.user.email}});
        if (!user) throw new Error("Usuario no encontrado");

        const existing = await prisma.agent.findUnique({ where: { id } });
        if (!existing || existing.agencyId !== (user.agencyId || null)) {
            return { success: false, message: "No autorizado" };
        }

        const deleted = await prisma.agent.delete({
            where: { id }
        });
        return { success: true, agent: deleted };
    } catch (error: any) {
        console.error("Error deleting agent:", error);
        return { success: false, message: error.message || "Error al eliminar el agente" };
    }
}

export async function deleteUserAccount(userId: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) throw new Error("No autenticado");
        const currentUser = await prisma.user.findUnique({ where: { id: session.user.id } });
        if (currentUser?.role !== "SUPER_ADMIN") throw new Error("Solo el SUPER_ADMIN puede borrar usuarios");

        // Primero borrar dependencias si no hay CASCADE
        await prisma.adnDiagnostic.deleteMany({ where: { userId } }).catch(() => {});
        await prisma.cotizacion.deleteMany({ where: { userId } }).catch(() => {});
        await prisma.activityLog.deleteMany({ where: { userId } }).catch(() => {});
        await prisma.client.deleteMany({ where: { userId } }).catch(() => {});
        
        await prisma.user.delete({ where: { id: userId } });
        return { success: true };
    } catch (err: any) {
        console.error("Error al borrar usuario", err);
        return { success: false, message: err.message || "Error al borrar usuario" };
    }
}

export interface AdnDiagnosticInput {
    modalidad: string;
    clienteNombre: string;
    clienteEdad: number;
    conyugeNombre?: string;
    conyugeEdad?: number;
    situacionLaboral: string;
    hijosData?: string;
    estatura?: string;
    peso?: string;
    fumador: boolean;
    padecimientos?: string;
    hasSeguroAhorro: boolean;
    ahorroAporte?: number;
    ahorroFrecuencia?: string;
    hasPpr: boolean;
    pprAporte?: number;
    pprFrecuencia?: string;
    pprAniosPlazo?: string;
    hasGmm: boolean;
    hasSeguroVida: boolean;
    vidaSumaAsegurada?: number;
    ingresosTotales: number;
    ingresosNetos: number;
    ahorroActual: number;
    hasTarjetasCredito: boolean;
    tarjetasCuales?: string;
    tarjetasLimite?: string;
    gastosData: string;
    totalGastos: number;
    evidenciaBase64?: string;
    latitude?: number;
    longitude?: number;
}

export async function saveAdnDiagnostic(data: AdnDiagnosticInput) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return { success: false, message: "No autenticado" };
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user) {
            return { success: false, message: "Usuario no encontrado en base de datos" };
        }

        if (user.agencyId === 'demo-agency-id') {
            const count = await prisma.adnDiagnostic.count({ where: { agencyId: 'demo-agency-id' } });
            if (count >= 5) {
                return { success: false, message: "Límite de demostración alcanzado (máx. 5 diagnósticos ADN). Adquiere una suscripción para uso ilimitado." };
            }
        }

        const newDiagnostic = await prisma.adnDiagnostic.create({
            data: {
                userId: user.id,
                agencyId: user.agencyId,
                modalidad: data.modalidad,
                clienteNombre: data.clienteNombre,
                clienteEdad: data.clienteEdad,
                conyugeNombre: data.conyugeNombre || null,
                conyugeEdad: data.conyugeEdad || null,
                situacionLaboral: data.situacionLaboral,
                hijosData: data.hijosData || null,
                estatura: data.estatura || null,
                peso: data.peso || null,
                fumador: data.fumador,
                padecimientos: data.padecimientos || null,
                hasSeguroAhorro: data.hasSeguroAhorro,
                ahorroAporte: data.ahorroAporte || null,
                ahorroFrecuencia: data.ahorroFrecuencia || null,
                hasPpr: data.hasPpr,
                pprAporte: data.pprAporte || null,
                pprFrecuencia: data.pprFrecuencia || null,
                pprAniosPlazo: data.pprAniosPlazo || null,
                hasGmm: data.hasGmm,
                hasSeguroVida: data.hasSeguroVida,
                vidaSumaAsegurada: data.vidaSumaAsegurada || null,
                ingresosTotales: data.ingresosTotales,
                ingresosNetos: data.ingresosNetos,
                ahorroActual: data.ahorroActual,
                hasTarjetasCredito: data.hasTarjetasCredito,
                tarjetasCuales: data.tarjetasCuales || null,
                tarjetasLimite: data.tarjetasLimite || null,
                gastosData: data.gastosData,
                totalGastos: data.totalGastos,
                evidenciaBase64: data.evidenciaBase64 || null,
                latitude: data.latitude || null,
                longitude: data.longitude || null,
            }
        });

        revalidatePath('/adn');
        revalidatePath('/admin');
        return { success: true, diagnostic: newDiagnostic };
    } catch (error: any) {
        console.error("Error saving ADN diagnostic:", error);
        return { success: false, message: error.message || "Error al guardar el diagnÃƒÆ’Ã‚Â³stico de ADN" };
    }
}

export async function getAdnDiagnostics(options?: { month?: number, year?: number, limitTo30Days?: boolean }) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return { success: false, message: "No autenticado" };
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user) {
            return { success: false, message: "Usuario no encontrado en base de datos" };
        }

        let whereClause: any = {};
        if ((user.role === 'ADMIN' || user.role === 'SUPER_ADMIN')) {
            whereClause = { agencyId: user.agencyId };
        } else {
            whereClause = { userId: user.id };
        }

        if (options?.year !== undefined) {
            if (options?.month !== undefined) {
                const startDate = new Date(options.year, options.month, 1);
                const endDate = new Date(options.year, options.month + 1, 1);
                whereClause.createdAt = {
                    gte: startDate,
                    lt: endDate
                };
            } else {
                const startDate = new Date(options.year, 0, 1);
                const endDate = new Date(options.year + 1, 0, 1);
                whereClause.createdAt = {
                    gte: startDate,
                    lt: endDate
                };
            }
        } else if (options?.limitTo30Days !== false) {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            whereClause.createdAt = {
                gte: thirtyDaysAgo
            };
        }

        let diagnostics;
        if ((user.role === 'ADMIN' || user.role === 'SUPER_ADMIN')) {
            // Admin sees all diagnostics from their agency
            diagnostics = await prisma.adnDiagnostic.findMany({
                where: whereClause,
                include: {
                    user: {
                        select: { name: true }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });
        } else {
            // Agent only sees their own diagnostics
            diagnostics = await prisma.adnDiagnostic.findMany({
                where: whereClause,
                include: {
                    user: {
                        select: {
                            name: true,
                            email: true
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });
        }

        return { success: true, diagnostics };
    } catch (error: any) {
        console.error("Error fetching ADN diagnostics:", error);
        return { success: false, message: error.message || "Error al obtener diagnÃƒÆ’Ã‚Â³sticos de ADN" };
    }
}

export async function createAgentUser(data: { name: string; email: string; role: string; phone?: string; active?: boolean; password?: string; syncToAgent?: boolean }) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return { success: false, message: "No autenticado" };
        }

        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: { agency: true }
        });

        if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN')) {
            return { success: false, message: "Permisos insuficientes" };
        }

        // Restricción: solo el propietario (enrique.ahumada@aacommx.com) puede dar de alta a otros administradores
        if (data.role === 'ADMIN' && !(process.env.SUPER_ADMIN_EMAILS || "enrique.ahumada@aacommx.com").includes(currentUser.email)) {
            return { success: false, message: "Solo el administrador principal (Enrique Ahumada) está facultado para dar de alta cuentas administrativas." };
        }

        // Restricción adicional: límite de máximo 2 ADMINS por Agencia/Promotoría
        if (data.role === 'ADMIN' && currentUser.agencyId) {
            const activeAdminsCount = await prisma.user.count({
                where: {
                    agencyId: currentUser.agencyId,
                    role: 'ADMIN',
                    active: true
                }
            });
            if (activeAdminsCount >= 2) {
                return { success: false, message: "Límite alcanzado: solo se permiten un máximo de 2 administradores activos por Agencia/Promotoría." };
            }
        }

        const existingUser = await prisma.user.findUnique({
            where: { email: data.email }
        });

        if (existingUser) {
            return { success: false, message: "Ya existe un usuario registrado con este correo" };
        }

        // Limit Check
        if (currentUser.agencyId) {
            const activeUsersCount = await prisma.user.count({
                where: { agencyId: currentUser.agencyId, active: true }
            });
            const limit = 10 + (currentUser.agency?.purchasedSeats || 0);
            if (activeUsersCount >= limit) {
                return { 
                    success: false, 
                    message: `LÃƒÆ’Ã‚Â­mite alcanzado (${limit} usuarios). Adquiere mÃƒÆ’Ã‚Â¡s licencias en tu Portal de Pagos o envÃƒÆ’Ã‚Â­ale a este agente una invitaciÃƒÆ’Ã‚Â³n para que pague su propia cuenta.` 
                };
            }
        }

        const plainPassword = data.password || "password123";
        const hashedPassword = await bcrypt.hash(plainPassword, 10);

        const newUser = await prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                role: data.role,
                agencyId: currentUser.agencyId,
                phone: data.phone || null,
                active: data.active !== undefined ? data.active : true,
                password: hashedPassword,
                mustChangePassword: true // Bloqueo temporal para obligar a que cambie su contraseÃƒÆ’Ã‚Â±a
            }
        });

        // Sincronización con el modelo Agent para el Cotizador
        if (data.syncToAgent) {
            const trimmedName = data.name.trim();
            const existingAgent = await prisma.agent.findUnique({
                where: { name_agencyId: { name: trimmedName, agencyId: currentUser.agencyId || '' } }
            });
            if (!existingAgent) {
                await prisma.agent.create({
                    data: { name: trimmedName, agencyId: currentUser.agencyId || null }
                });
            }
        }

        revalidatePath('/admin');
        return { success: true, user: newUser };
    } catch (error: any) {
        console.error("Error creating agent user:", error);
        return { success: false, message: error.message || "Error al crear usuario del agente" };
    }
}

export async function getUsers() {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return { success: false, message: "No autenticado", users: [] };
        }

        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN')) {
            return { success: false, message: "Permisos insuficientes", users: [] };
        }

        const users = await prisma.user.findMany({
            where: {
                agencyId: currentUser.agencyId
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return { success: true, users };
    } catch (error: any) {
        console.error("Error fetching users:", error);
        return { success: false, message: error.message || "Error al obtener usuarios", users: [] };
    }
}

export async function updateUserPassword(id: string, newPassword: string) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return { success: false, message: "No autenticado" };
        }

        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN')) {
            return { success: false, message: "Permisos insuficientes" };
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const updatedUser = await prisma.user.update({
            where: { id },
            data: { 
                password: hashedPassword,
                mustChangePassword: true 
            }
        });

        revalidatePath('/admin');
        return { success: true, user: updatedUser };
    } catch (error: any) {
        console.error("Error updating user password:", error);
        return { success: false, message: error.message || "Error al actualizar contraseÃƒÆ’Ã‚Â±a" };
    }
}

export async function toggleUserActiveStatus(id: string) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return { success: false, message: "No autenticado" };
        }

        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN')) {
            return { success: false, message: "Permisos insuficientes" };
        }

        const targetUser = await prisma.user.findUnique({
            where: { id }
        });

        if (!targetUser) {
            return { success: false, message: "Usuario no encontrado" };
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: { active: !targetUser.active }
        });

        revalidatePath('/admin');
        return { success: true, user: updatedUser };
    } catch (error: any) {
        console.error("Error toggling user active status:", error);
        return { success: false, message: error.message || "Error al cambiar estatus" };
    }
}

export async function deleteUser(id: string) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return { success: false, message: "No autenticado" };
        }

        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN')) {
            return { success: false, message: "Permisos insuficientes" };
        }

        // Evitar que el administrador se elimine a sÃƒÆ’Ã‚Â­ mismo
        if (currentUser.id === id) {
            return { success: false, message: "No puedes eliminar tu propia cuenta de administrador" };
        }

        const targetUser = await prisma.user.findUnique({
            where: { id }
        });

        if (!targetUser) {
            return { success: false, message: "Usuario no encontrado" };
        }

        // RestricciÃƒÆ’Ã‚Â³n: impedir la eliminaciÃƒÆ’Ã‚Â³n del propietario Enrique Ahumada
        if ((process.env.SUPER_ADMIN_EMAILS || "enrique.ahumada@aacommx.com").includes(targetUser.email)) {
            return { success: false, message: "No estÃƒÆ’Ã‚Â¡ permitido eliminar la cuenta principal del propietario (Enrique Ahumada)." };
        }

        // Primero borrar dependencias si no hay CASCADE
        await prisma.adnDiagnostic.deleteMany({ where: { userId: id } }).catch(() => {});
        await prisma.cotizacion.deleteMany({ where: { userId: id } }).catch(() => {});
        await prisma.activityLog.deleteMany({ where: { userId: id } }).catch(() => {});
        await prisma.client.deleteMany({ where: { userId: id } }).catch(() => {});

        const deleted = await prisma.user.delete({
            where: { id }
        });

        revalidatePath('/admin');
        return { success: true, user: deleted };
    } catch (error: any) {
        console.error("Error deleting user:", error);
        return { success: false, message: error.message || "Error al eliminar el usuario" };
    }
}

export async function toggleAdnDiagnosticClosedStatus(id: string) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return { success: false, message: "No autenticado" };
        }

        const adn = await prisma.adnDiagnostic.findUnique({
            where: { id }
        });

        if (!adn) {
            return { success: false, message: "DiagnÃƒÆ’Ã‚Â³stico no encontrado" };
        }

        const updated = await prisma.adnDiagnostic.update({
            where: { id },
            data: { cerradaPagada: !adn.cerradaPagada }
        });

        revalidatePath('/adn');
        revalidatePath('/admin');
        return { success: true, diagnostic: updated };
    } catch (error: any) {
        console.error("Error toggling ADN closed status:", error);
        return { success: false, message: error.message || "Error al actualizar estado" };
    }
}

export async function getAnnouncements(type: string = 'HOME_AD') {
    try {
        const session = await auth();
        let userAgencyId: string | null = null;
        if (session?.user?.email) {
            const u = await prisma.user.findUnique({ where: { email: session.user.email } });
            userAgencyId = u?.agencyId || null;
        }

        const list = await prisma.content.findMany({
            where: { 
                type,
                agencyId: userAgencyId
            },
            orderBy: { createdAt: 'desc' }
        });
        return { success: true, announcements: list };
    } catch (error: any) {
        console.error("Error fetching announcements:", error);
        return { success: false, message: error.message || "Error al obtener comunicados", announcements: [] };
    }
}

export async function createAnnouncement(base64Data: string, fileName: string, linkUrl?: string, type: string = 'HOME_AD') {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return { success: false, message: "No autenticado" };
        }

        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN')) {
            return { success: false, message: "Permisos insuficientes" };
        }

        // Validate file type from name extension
        const allowedExts = ['.jpg', '.jpeg', '.png', '.gif'];
        const path = await import('path');
        const ext = path.extname(fileName).toLowerCase();
        if (!allowedExts.includes(ext)) {
            return { success: false, message: "Tipo de archivo no permitido. Solo JPG, JPEG, PNG o GIF." };
        }

        // Convert base64 data to buffer and validate size
        const base64Clean = base64Data.split(';base64,').pop() || base64Data;
        const buffer = Buffer.from(base64Clean, 'base64');
        
        // Double-check file size is under 5MB (5 * 1024 * 1024 bytes)
        if (buffer.length > 5 * 1024 * 1024) {
            return { success: false, message: "El tamaÃƒÆ’Ã‚Â±o del archivo supera los 5 MB permitidos." };
        }

        // Save image as base64 data URI directly in database
        // This is 100% serverless-friendly (e.g. Vercel) as it avoids read-only filesystem writes
        const imageUrl = base64Data;

        const newAd = await prisma.content.create({
            data: {
                type,
                imageUrl,
                linkUrl: linkUrl || null,
                active: true,
                order: 0,
                agencyId: currentUser.agencyId || null
            }
        });

        revalidatePath('/');
        revalidatePath('/admin');
        return { success: true, announcement: newAd };
    } catch (error: any) {
        console.error("Error creating announcement:", error);
        return { success: false, message: error.message || "Error al subir comunicado" };
    }
}

export async function toggleAnnouncementActiveStatus(id: string) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return { success: false, message: "No autenticado" };
        }

        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN')) {
            return { success: false, message: "Permisos insuficientes" };
        }

        const ad = await prisma.content.findUnique({
            where: { id }
        });

        if (!ad) {
            return { success: false, message: "Comunicado no encontrado" };
        }

        const updated = await prisma.content.update({
            where: { id },
            data: { active: !ad.active }
        });

        revalidatePath('/');
        revalidatePath('/admin');
        return { success: true, announcement: updated };
    } catch (error: any) {
        console.error("Error toggling announcement active status:", error);
        return { success: false, message: error.message || "Error al alternar estatus" };
    }
}

export async function deleteAnnouncement(id: string) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return { success: false, message: "No autenticado" };
        }

        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN')) {
            return { success: false, message: "Permisos insuficientes" };
        }

        const ad = await prisma.content.findUnique({
            where: { id }
        });

        if (!ad) {
            return { success: false, message: "Comunicado no encontrado" };
        }

        // Delete physical file only if it is a legacy file path (starts with /uploads/)
        if (ad.imageUrl.startsWith('/uploads/')) {
            try {
                const fs = await import('fs');
                const path = await import('path');
                const filePath = path.join(process.cwd(), 'public', ad.imageUrl);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            } catch (err) {
                console.error("Failed to delete legacy physical file:", err);
            }
        }

        const deleted = await prisma.content.delete({
            where: { id }
        });

        revalidatePath('/');
        revalidatePath('/admin');
        return { success: true, announcement: deleted };
    } catch (error: any) {
        console.error("Error deleting announcement:", error);
        return { success: false, message: error.message || "Error al eliminar comunicado" };
    }
}

// ==========================================
// MÃƒÆ’Ã¢â‚¬Å“DULO AACOM 25 & ACTIVIDAD DIARIA ACTIONS
// ==========================================

export async function isAgentVerified(email: string) {
    const user = await prisma.user.findUnique({
        where: { email },
        select: { phoneVerified: true }
    })
    return user?.phoneVerified ?? false
}

export async function acceptTermsAndConditions(email: string) {
    try {
        await prisma.user.update({
            where: { email },
            data: {
                termsAccepted: true,
                termsAcceptedAt: new Date(),
            }
        });
        return { success: true };
    } catch (error) {
        console.error("Error accepting terms:", error);
        return { success: false, error: "No se pudieron aceptar los términos." };
    }
}

export async function saveActivityLogEntry(activityId: string, prospectName?: string) {
    const session = await auth();

    if (!session?.user?.email) {
        return { success: false, message: "No autenticado" };
    }

    enforceDemoSafety(session);

    const user = await prisma.user.findUnique({
        where: { email: session.user.email }
    });

    if (!user) {
        return { success: false, message: "Usuario no encontrado" };
    }

    const activity = SALES_ACTIVITIES.find(a => a.id === activityId);
    if (!activity) {
        return { success: false, message: "Actividad no válida" };
    }

    // Validation: prospectName is mandatory for 'Cita agendada' (ID '2') or 'Cita Efectiva' (ID '3')
    if ((activityId === '2' || activityId === '3') && !prospectName?.trim()) {
        return { success: false, message: "El nombre del prospecto es obligatorio para citas iniciales/efectivas." };
    }

    // Calculate Mexico City date YYYY-MM-DD
    const dateStr = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' });

    try {
        const log = await prisma.activityLog.create({
            data: {
                userId: user.id,
                agencyId: user.agencyId,
                activityId,
                activityName: activity.name,
                points: activity.value,
                prospectName: prospectName?.trim() || null,
                dateStr,
            }
        });

        revalidatePath('/activity');
        revalidatePath('/admin');
        revalidatePath('/');
        return { success: true, message: `Actividad registrada: +${activity.value} pts`, log };
    } catch (error: any) {
        console.error("Error saving activity log:", error);
        return { success: false, message: error.message || "Error al registrar la actividad" };
    }
}

export async function deleteActivityLogEntry(logId: string) {
    const session = await auth();

    if (!session?.user?.email) {
        return { success: false, message: "No autenticado" };
    }

    enforceDemoSafety(session);

    try {
        const log = await prisma.activityLog.findUnique({
            where: { id: logId }
        });

        if (!log) {
            return { success: false, message: "Registro no encontrado" };
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user || (log.userId !== user.id && user.role !== 'ADMIN')) {
            return { success: false, message: "Permisos insuficientes" };
        }

        await prisma.activityLog.delete({
            where: { id: logId }
        });

        revalidatePath('/activity');
        revalidatePath('/admin');
        revalidatePath('/');
        return { success: true, message: "Registro eliminado correctamente" };
    } catch (error: any) {
        console.error("Error deleting activity log:", error);
        return { success: false, message: error.message || "Error al eliminar el registro" };
    }
}

export async function getDailyActivitySummary() {
    const session = await auth();

    if (!session?.user?.email) {
        return { success: false, message: "No autenticado", logs: [], totalPoints: 0, remainingPoints: 25 };
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user) {
            return { success: false, message: "Usuario no encontrado", logs: [], totalPoints: 0, remainingPoints: 25 };
        }

        const dateStr = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' });

        const logs = await prisma.activityLog.findMany({
            where: {
                userId: user.id,
                dateStr,
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        const totalPoints = logs.reduce((acc, log) => acc + log.points, 0);
        const remainingPoints = Math.max(0, 25 - totalPoints);

        return {
            success: true,
            logs,
            totalPoints,
            remainingPoints,
        };
    } catch (error: any) {
        console.error("Error fetching daily summary:", error);
        return { success: false, message: error.message, logs: [], totalPoints: 0, remainingPoints: 25 };
    }
}

export async function getActivityHistory(targetUserId?: string) {
    const session = await auth();

    if (!session?.user?.email) {
        return { success: false, message: "No autenticado", history: [] };
    }

    try {
        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!currentUser) {
            return { success: false, message: "Usuario no encontrado", history: [] };
        }

        const userId = ((currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN') && targetUserId) ? targetUserId : currentUser.id;

        // Get all activity logs for this user sorted by date and time
        const logs = await prisma.activityLog.findMany({
            where: { userId },
            orderBy: [
                { dateStr: 'desc' },
                { createdAt: 'desc' }
            ]
        });

        // Group by dateStr in JS for clean structures
        const groups: Record<string, { dateStr: string; totalPoints: number; logs: typeof logs }> = {};

        logs.forEach(log => {
            if (!groups[log.dateStr]) {
                groups[log.dateStr] = {
                    dateStr: log.dateStr,
                    totalPoints: 0,
                    logs: []
                };
            }
            groups[log.dateStr].totalPoints += log.points;
            groups[log.dateStr].logs.push(log);
        });

        const history = Object.values(groups).sort((a, b) => b.dateStr.localeCompare(a.dateStr));

        return {
            success: true,
            history
        };
    } catch (error: any) {
        console.error("Error fetching activity history:", error);
        return { success: false, message: error.message, history: [] };
    }
}

// ==========================================
// RANKING DE AGENTES & ADNs ACTIONS
// ==========================================

export async function getMonthlyAdnRankings(selectedMonth?: number, selectedYear?: number) {
    try {
        const session = await auth();
        if (!session?.user?.email) return { success: false, rankings: [], rankingAd: null, message: "No autenticado" };
        
        const user = await prisma.user.findUnique({ 
            where: { email: session.user.email },
            include: { agency: true }
        });
        if (!user) return { success: false, rankings: [], rankingAd: null, message: "Usuario no encontrado" };

        // --- MIGRACIÓN DE RESCATE (ADNs y Cotizaciones huérfanas) ---
        await prisma.adnDiagnostic.updateMany({
            where: { agencyId: null },
            data: { agencyId: process.env.NEXT_PUBLIC_DEFAULT_AGENCY_SLUG || 'aacom' }
        });
        await prisma.cotizacion.updateMany({
            where: { agencyId: null },
            data: { agencyId: process.env.NEXT_PUBLIC_DEFAULT_AGENCY_SLUG || 'aacom' }
        });
        // -------------------------------------------------------------

        const now = new Date();
        const year = selectedYear !== undefined ? selectedYear : now.getFullYear();
        const month = selectedMonth !== undefined ? selectedMonth : now.getMonth(); // 0-indexed

        // Mexico City Time Month Start and End
        // We can do it safely by defining standard dates:
        const startOfMonth = new Date(year, month, 1, 0, 0, 0, 0);
        const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);

        const diagnostics = await prisma.adnDiagnostic.findMany({
            where: {
                agencyId: user.agencyId,
                createdAt: {
                    gte: startOfMonth,
                    lte: endOfMonth
                }
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true,
                        active: true
                    }
                }
            }
        });

        // Fetch all active agents to initialize 0 points
        const allAgents = await prisma.user.findMany({
            where: { agencyId: user.agencyId, active: true, role: 'USER' },
            select: {
                id: true,
                name: true,
                email: true,
                image: true
            }
        });

        const counts: Record<string, { user: { id: string; name: string; email: string; image: string | null }; count: number }> = {};

        allAgents.forEach(agent => {
            counts[agent.id] = {
                user: {
                    id: agent.id,
                    name: agent.name || agent.email.split('@')[0],
                    email: agent.email,
                    image: agent.image // base64
                },
                count: 0
            };
        });

        diagnostics.forEach(diag => {
            if (counts[diag.userId]) {
                counts[diag.userId].count += 1;
            } else if (diag.user && diag.user.active) {
                // If agent is not in the list for some reason but exists
                counts[diag.userId] = {
                    user: {
                        id: diag.userId,
                        name: diag.user.name || diag.user.email.split('@')[0],
                        email: diag.user.email,
                        image: diag.user.image
                    },
                    count: 1
                };
            }
        });

        const rankings = Object.values(counts)
            .sort((a, b) => b.count - a.count || a.user.name.localeCompare(b.user.name))
            .slice(0, 10);

        // Fetch the customizable admin campaign banner for Ranking page
        const rankingAd = await prisma.content.findFirst({
            where: {
                type: 'RANKING_AD',
                active: true,
                agencyId: user.agencyId || null
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return {
            success: true,
            rankings,
            rankingAd,
            agencyName: user.agency?.name || 'la Agencia'
        };
    } catch (error: any) {
        console.error("Error fetching monthly ADN rankings:", error);
        return { success: false, rankings: [], rankingAd: null, message: error.message };
    }
}

export async function createRankingAd(base64Data: string, fileName: string, linkUrl?: string) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return { success: false, message: "No autenticado" };
        }

        enforceDemoSafety(session);

        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN')) {
            return { success: false, message: "Permisos insuficientes" };
        }

        const allowedExts = ['.jpg', '.jpeg', '.png', '.gif'];
        const path = await import('path');
        const ext = path.extname(fileName).toLowerCase();
        if (!allowedExts.includes(ext)) {
            return { success: false, message: "Tipo de archivo no permitido. Solo JPG, JPEG, PNG o GIF." };
        }

        // Deactivate other ranking ads to keep only the newest active
        await prisma.content.updateMany({
            where: { 
                type: 'RANKING_AD',
                agencyId: currentUser.agencyId || null
            },
            data: { active: false }
        });

        const newAd = await prisma.content.create({
            data: {
                type: 'RANKING_AD',
                imageUrl: base64Data,
                linkUrl: linkUrl || null,
                active: true,
                order: 0,
                agencyId: currentUser.agencyId || null
            }
        });

        revalidatePath('/ranking');
        revalidatePath('/admin');
        return { success: true, rankingAd: newAd };
    } catch (error: any) {
        console.error("Error creating ranking ad:", error);
        return { success: false, message: error.message || "Error al subir campaña de incentivo" };
    }
}

export async function deleteRankingAd() {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return { success: false, message: "No autenticado" };
        }

        enforceDemoSafety(session);

        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN')) {
            return { success: false, message: "Permisos insuficientes" };
        }

        // Deactivate all ranking ads
        await prisma.content.updateMany({
            where: { type: 'RANKING_AD' },
            data: { active: false }
        });

        revalidatePath('/ranking');
        revalidatePath('/admin');
        return { success: true };
    } catch (error: any) {
        console.error("Error deleting ranking ad:", error);
        return { success: false, message: error.message || "Error al eliminar la campaña" };
    }
}

// ==========================================
// ADMIN AACOM 25 REPORTS & PROFILE ACTIONS
// ==========================================

export async function getAdminActivityReport(userId?: string, startDate?: string, endDate?: string) {
    const session = await auth();
    if (!session?.user?.email) {
        return { success: false, message: "No autenticado", logs: [] };
    }

    try {
        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN')) {
            return { success: false, message: "Permisos insuficientes", logs: [] };
        }

        const whereClause: any = { agencyId: currentUser.agencyId };
        if (userId && userId !== 'ALL') {
            whereClause.userId = userId;
        }

        if (startDate || endDate) {
            whereClause.dateStr = {};
            if (startDate) whereClause.dateStr.gte = startDate;
            if (endDate) whereClause.dateStr.lte = endDate;
        }

        const logs = await prisma.activityLog.findMany({
            where: whereClause,
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        image: true
                    }
                }
            },
            orderBy: [
                { dateStr: 'desc' },
                { createdAt: 'desc' }
            ]
        });

        return { success: true, logs };
    } catch (error: any) {
        console.error("Error fetching admin activity report:", error);
        return { success: false, message: error.message, logs: [] };
    }
}

export async function updateAgentProfile(userId: string, data: { name?: string; phone?: string; birthDate?: string; image?: string; password?: string; active?: boolean }) {
    const session = await auth();
    if (!session?.user?.email) {
        return { success: false, message: "No autenticado" };
    }

    enforceDemoSafety(session);

    try {
        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!currentUser) {
            return { success: false, message: "Usuario no encontrado" };
        }

        // Only allow self updates or ADMIN updates
        if (currentUser.id !== userId && (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN')) {
            return { success: false, message: "Permisos insuficientes" };
        }

        const updateData: any = {};
        if (data.name !== undefined) updateData.name = data.name;
        if (data.phone !== undefined) updateData.phone = data.phone;
        if (data.image !== undefined) updateData.image = data.image; // Base64
        if (data.password !== undefined && data.password.trim() !== '') updateData.password = data.password;
        if (data.active !== undefined && (currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN')) updateData.active = data.active;
        
        if (data.birthDate !== undefined) {
            updateData.birthDate = data.birthDate ? new Date(data.birthDate) : null;
        }

        const updated = await prisma.user.update({
            where: { id: userId },
            data: updateData
        });

        // Also sync name to Agent table if agent exists
        if (data.name && (currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN')) {
            const trimmedName = data.name.trim();
            const existingAgent = await prisma.agent.findUnique({
                where: { name_agencyId: { name: trimmedName, agencyId: currentUser.agencyId || '' } }
            });
            if (!existingAgent) {
                // Find if there is an agent with old name and update or create
                // Simply create if not found, as we don't have secondary relation
                await prisma.agent.upsert({
                    where: { name_agencyId: { name: trimmedName, agencyId: currentUser.agencyId || '' } },
                    update: {},
                    create: { name: trimmedName, agencyId: currentUser.agencyId || null }
                });
            }
        }

        revalidatePath('/admin');
        revalidatePath('/ranking');
        revalidatePath('/');
        return { success: true, message: "Perfil actualizado correctamente", user: updated };
    } catch (error: any) {
        console.error("Error updating agent profile:", error);
        return { success: false, message: error.message || "Error al actualizar perfil" };
    }
}

export async function getCurrentUser() {
    const session = await auth();
    if (!session?.user?.email) {
        return { success: false, message: "No autenticado" };
    }
    try {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true, name: true, email: true, role: true, agencyId: true, agency: { select: { purchasedSeats: true } } }
        });
        if (!user) {
            return { success: false, message: "Usuario no encontrado" };
        }
        return { success: true, user };
    } catch (error: any) {
        console.error("Error fetching current user:", error);
        return { success: false, message: error.message || "Error al obtener usuario actual" };
    }
}

export async function removeLastActivityLogEntry(activityId: string) {
    const session = await auth();
    if (!session?.user?.email) {
        return { success: false, message: "No autenticado" };
    }

    enforceDemoSafety(session);

    try {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user) {
            return { success: false, message: "Usuario no encontrado" };
        }

        const dateStr = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' });

        const lastLog = await prisma.activityLog.findFirst({
            where: {
                userId: user.id,
                activityId,
                dateStr,
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        if (!lastLog) {
            return { success: false, message: "No se encontraron registros de esta actividad hoy." };
        }

        await prisma.activityLog.delete({
            where: { id: lastLog.id }
        });

        revalidatePath('/activity');
        revalidatePath('/admin');
        revalidatePath('/');
        return { success: true, message: `Registro de "${lastLog.activityName}" removido.` };
    } catch (error: any) {
        console.error("Error removing last activity log entry:", error);
        return { success: false, message: error.message || "Error al remover la actividad" };
    }
}

export async function getTeamDirectory() {
    const session = await auth();
    if (!session?.user?.email) {
        return { success: false, message: "No autenticado" };
    }

    try {
        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        const users = await prisma.user.findMany({
            where: {
                active: true,
                agencyId: currentUser?.agencyId,
                role: {
                    not: 'SELLER'
                }
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                image: true,
                birthDate: true,
                role: true,
                active: true,
                instagram: true,
                facebook: true,
                linkedin: true,
                twitter: true,
                insurances: true,
                favoriteBook: true,
                hobby: true
            },
            orderBy: {
                name: 'asc'
            }
        });

        return { success: true, users };
    } catch (error: any) {
        console.error("Error fetching team directory:", error);
        return { success: false, message: error.message || "Error al obtener el directorio" };
    }
}

export async function updateUserProfileDetails(targetUserId: string, data: {
    name?: string;
    email?: string;
    phone?: string;
    birthDate?: string | null;
    image?: string;
    instagram?: string | null;
    facebook?: string | null;
    linkedin?: string | null;
    twitter?: string | null;
    insurances?: string | null;
    favoriteBook?: string | null;
    hobby?: string | null;
}) {
    const session = await auth();
    if (!session?.user?.email) {
        return { success: false, message: "No autenticado" };
    }

    enforceDemoSafety(session);

    try {
        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!currentUser) {
            return { success: false, message: "Usuario en sesión no encontrado" };
        }

        const isAdmin = (currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN');
        const isSelf = currentUser.id === targetUserId;

        if (!isAdmin && !isSelf) {
            return { success: false, message: "Permisos insuficientes" };
        }

        const updateData: any = {};

        // ADMIN ONLY fields
        if (isAdmin) {
            if (data.email !== undefined) updateData.email = data.email;
        }

        // ADMIN or SELF fields
        if (isAdmin || isSelf) {
            if (data.name !== undefined) updateData.name = data.name;
            if (data.phone !== undefined) updateData.phone = data.phone;
            if (data.image !== undefined) updateData.image = data.image;
            if (data.birthDate !== undefined) {
                updateData.birthDate = data.birthDate ? new Date(data.birthDate) : null;
            }
        }

        // Both ADMIN and Self can update extended fields
        if (data.instagram !== undefined) updateData.instagram = data.instagram;
        if (data.facebook !== undefined) updateData.facebook = data.facebook;
        if (data.linkedin !== undefined) updateData.linkedin = data.linkedin;
        if (data.twitter !== undefined) updateData.twitter = data.twitter;
        if (data.insurances !== undefined) updateData.insurances = data.insurances;
        if (data.favoriteBook !== undefined) updateData.favoriteBook = data.favoriteBook;
        if (data.hobby !== undefined) updateData.hobby = data.hobby;

        const updatedUser = await prisma.user.update({
            where: { id: targetUserId },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                image: true,
                birthDate: true,
                role: true,
                instagram: true,
                facebook: true,
                linkedin: true,
                twitter: true,
                insurances: true,
                favoriteBook: true,
                hobby: true
            }
        });

        revalidatePath('/team');
        revalidatePath('/ranking');
        revalidatePath('/admin');
        revalidatePath('/');

        return { success: true, user: updatedUser, message: "Perfil actualizado con éxito" };
    } catch (error: any) {
        console.error("Error updating user profile details:", error);
        return { success: false, message: error.message || "Error al actualizar perfil" };
    }
}

// ==========================================
// ASISTENTE INTELIGENTE AACOM (GEMINI 1.5) ACTIONS
// ==========================================

export async function getKnowledgeDocuments() {
    const session = await auth();
    if (!session?.user?.email) {
        return { success: false, message: "No autenticado" };
    }

    try {
        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user || !user.agencyId) return { success: false, message: "Sin agencia asignada" };

        if (user.role === 'SUPER_ADMIN') {
            await prisma.knowledgeDocument.updateMany({
                where: { agencyId: null },
                data: { agencyId: user.agencyId }
            });
        }

        const docs = await prisma.knowledgeDocument.findMany({
            where: { 
                OR: [
                    { agencyId: user.agencyId },
                    { isGlobalTemplate: true }
                ]
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        return { success: true, docs };
    } catch (error: any) {
        console.error("Error getting knowledge documents:", error);
        return { success: false, message: error.message || "Error al obtener documentos" };
    }
}

export async function saveKnowledgeDocument(id: string | null, title: string, content: string, isGlobalTemplate: boolean = false) {
    const session = await auth();
    if (!session?.user?.email) {
        return { success: false, message: "No autenticado" };
    }

    enforceDemoSafety(session);

    try {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
            return { success: false, message: "Permisos insuficientes" };
        }
        if (!user.agencyId) {
            return { success: false, message: "Sin agencia asignada" };
        }

        if (id) {
            const existingDoc = await prisma.knowledgeDocument.findUnique({ where: { id } });
            if (existingDoc?.isGlobalTemplate && user.role !== 'SUPER_ADMIN') {
                return { success: false, message: "No tienes permiso para editar una Plantilla Global." };
            }
            const updated = await prisma.knowledgeDocument.update({
                where: { id },
                data: { title, content, isGlobalTemplate: user.role === 'SUPER_ADMIN' ? isGlobalTemplate : undefined }
            });
            revalidatePath('/admin');
            return { success: true, doc: updated, message: "Documento actualizado" };
        } else {
            const created = await prisma.knowledgeDocument.create({
                data: { title, content, agencyId: user.agencyId, isGlobalTemplate: user.role === 'SUPER_ADMIN' ? isGlobalTemplate : false }
            });
            revalidatePath('/admin');
            return { success: true, doc: created, message: "Documento guardado con ÃƒÆ’Ã‚Â©xito" };
        }
    } catch (error: any) {
        console.error("Error saving knowledge document:", error);
        return { success: false, message: error.message || "Error al guardar documento" };
    }
}

export async function deleteKnowledgeDocument(id: string) {
    const session = await auth();
    if (!session?.user?.email) {
        return { success: false, message: "No autenticado" };
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
            return { success: false, message: "Permisos insuficientes" };
        }

        const doc = await prisma.knowledgeDocument.findUnique({ where: { id } });
        if (doc?.isGlobalTemplate && user.role !== 'SUPER_ADMIN') {
            return { success: false, message: "No puedes borrar una Plantilla Global." };
        }

        await prisma.knowledgeDocument.delete({
            where: { id }
        });

        revalidatePath('/admin');
        return { success: true, message: "Documento eliminado permanentemente" };
    } catch (error: any) {
        console.error("Error deleting knowledge document:", error);
        return { success: false, message: error.message || "Error al eliminar documento" };
    }
}

export async function toggleKnowledgeDocumentActiveStatus(id: string) {
    const session = await auth();
    if (!session?.user?.email) {
        return { success: false, message: "No autenticado" };
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
            return { success: false, message: "Permisos insuficientes" };
        }

        const doc = await prisma.knowledgeDocument.findUnique({
            where: { id }
        });

        if (!doc) {
            return { success: false, message: "Documento no encontrado" };
        }
        
        if (doc.isGlobalTemplate && user.role !== 'SUPER_ADMIN') {
            return { success: false, message: "No tienes permiso para modificar una Plantilla Global." };
        }

        const updated = await prisma.knowledgeDocument.update({
            where: { id },
            data: { active: !doc.active }
        });

        revalidatePath('/admin');
        return { success: true, doc: updated, message: `Documento ${updated.active ? 'activado' : 'desactivado'}` };
    } catch (error: any) {
        console.error("Error toggling document active status:", error);
        return { success: false, message: error.message || "Error al cambiar estatus" };
    }
}

// ==========================================
// MÃƒÆ’Ã¢â‚¬Å“DULO PUSH NOTIFICATIONS
// ==========================================

export async function savePushSubscription(subscription: any) {
    try {
        const session = await auth();
        if (!session?.user?.email) return { success: false, message: "No autenticado" };
        
        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) return { success: false, message: "Usuario no encontrado" };

        const { endpoint, keys } = subscription;
        if (!endpoint || !keys?.p256dh || !keys?.auth) return { success: false, message: "SuscripciÃƒÆ’Ã‚Â³n invÃƒÆ’Ã‚Â¡lida" };

        await prisma.pushSubscription.upsert({
            where: { endpoint },
            create: {
                userId: user.id,
                endpoint,
                p256dh: keys.p256dh,
                auth: keys.auth
            },
            update: {
                userId: user.id,
                p256dh: keys.p256dh,
                auth: keys.auth
            }
        });

        return { success: true, message: "SuscripciÃƒÆ’Ã‚Â³n guardada" };
    } catch (err: any) {
        console.error("Error saving push subscription:", err);
        return { success: false, message: err.message };
    }
}

export async function sendTestPushNotification(userId: string) {
    try {
        const session = await auth();
        if (!session?.user?.email) return { success: false, message: "No autenticado" };

        const currentUser = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (currentUser?.role !== 'ADMIN') return { success: false, message: "Permisos insuficientes" };

        const subs = await prisma.pushSubscription.findMany({ where: { userId } });
        if (!subs || subs.length === 0) return { success: false, message: "El usuario no tiene dispositivos suscritos" };

        webpush.setVapidDetails(
            process.env.VAPID_SUBJECT || 'mailto:test@aacommx.com',
            process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
            process.env.VAPID_PRIVATE_KEY || ''
        );

        const payload = JSON.stringify({
            title: "Prueba AACOM",
            body: "Esta es una notificaciÃƒÆ’Ã‚Â³n de prueba desde el sistema.",
            url: "/"
        });

        const promises = subs.map(sub => 
            webpush.sendNotification({
                endpoint: sub.endpoint,
                keys: { p256dh: sub.p256dh, auth: sub.auth }
            }, payload, { urgency: 'high' })
        );

        await Promise.all(promises);

        return { success: true, message: "NotificaciÃƒÆ’Ã‚Â³n enviada" };
    } catch (err: any) {
        console.error("Error sending push notification:", err);
        return { success: false, message: err.message };
    }
}

export async function sendAdminPushNotification(recipientId: string, message: string, pin: string) {
    try {
        const session = await auth();
        if (!session?.user?.email) return { success: false, message: "No autenticado." };

        const currentUser = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN')) {
            return { success: false, message: "Permisos insuficientes." };
        }
        
        if (currentUser.password !== pin) {
            return { success: false, message: "ContraseÃƒÆ’Ã‚Â±a incorrecta." };
        }

        let subs = [];
        if (recipientId === 'ALL') {
            const agencyUsers = await prisma.user.findMany({
                where: { agencyId: currentUser.agencyId },
                select: { id: true }
            });
            const agencyUserIds = agencyUsers.map(u => u.id);
            subs = await prisma.pushSubscription.findMany({ where: { userId: { in: agencyUserIds } } });
        } else {
            subs = await prisma.pushSubscription.findMany({ where: { userId: recipientId } });
        }

        if (!subs || subs.length === 0) return { success: false, message: "No hay dispositivos suscritos para este destinatario." };

        webpush.setVapidDetails(
            process.env.VAPID_SUBJECT || 'mailto:test@aacommx.com',
            process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
            process.env.VAPID_PRIVATE_KEY || ''
        );

        const payload = JSON.stringify({
            title: "AACOM NotificaciÃƒÆ’Ã‚Â³n",
            body: message,
            url: "/"
        });

        const promises = subs.map(sub => 
            webpush.sendNotification({
                endpoint: sub.endpoint,
                keys: { p256dh: sub.p256dh, auth: sub.auth }
            }, payload, { urgency: 'high' }).catch(err => {
                console.error("Error pushing to sub", sub.endpoint.substring(0, 30), err.statusCode);
            })
        );

        await Promise.all(promises);

        return { success: true, message: `NotificaciÃƒÆ’Ã‚Â³n enviada a ${subs.length} dispositivo(s).` };
    } catch (err: any) {
        console.error("Error sending admin push notification:", err);
        return { success: false, message: err.message };
    }
}

export async function forceUpdatePassword(userId: string, newPassword: string) {
    try {
        const session = await auth();
        if (!session?.user?.email) return { success: false, message: "No autenticado" };

        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!currentUser || currentUser.id !== userId) {
            return { success: false, message: "No tienes permiso para actualizar esta contraseÃƒÆ’Ã‚Â±a" };
        }

        await prisma.user.update({
            where: { id: userId },
            data: { 
                password: await bcrypt.hash(newPassword, 10),
                mustChangePassword: false 
            }
        });

        return { success: true, message: "ContraseÃƒÆ’Ã‚Â±a actualizada correctamente" };
    } catch (error: any) {
        console.error("Error al actualizar la contraseÃƒÆ’Ã‚Â±a:", error);
        return { success: false, message: error.message || "Error al actualizar contraseÃƒÆ’Ã‚Â±a" };
    }
}

export async function getWeeklyReportData(startDate: string, endDate: string) {
    const session = await auth();
    if (!session?.user?.email) return { success: false, message: "No autenticado" };

    try {
        // --- MIGRACIÃƒÆ’Ã¢â‚¬Å“N MASIVA DE RESCATE ---
        // Vercel estaba apuntando a una DB que nunca recibiÃƒÆ’Ã‚Â³ la migraciÃƒÆ’Ã‚Â³n local.
        // Forzamos a que todos los usuarios y actividades huÃƒÆ’Ã‚Â©rfanas se asignen a 'aacom'.
        await prisma.user.updateMany({
            where: { agencyId: null },
            data: { agencyId: process.env.NEXT_PUBLIC_DEFAULT_AGENCY_SLUG || 'aacom' }
        });
        await prisma.activityLog.updateMany({
            where: { agencyId: null },
            data: { agencyId: process.env.NEXT_PUBLIC_DEFAULT_AGENCY_SLUG || 'aacom' }
        });
        // -----------------------------------

        const currentUser = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN')) {
            return { success: false, message: "Permisos insuficientes" };
        }

        const agencyId = currentUser.agencyId;
        if (!agencyId) return { success: false, message: "El administrador no tiene una agencia vÃƒÆ’Ã‚Â¡lida asignada." };

        const agents = await prisma.user.findMany({
            where: { active: true, agencyId },
            select: { id: true, name: true, image: true }
        });

        const logs = await prisma.activityLog.findMany({
            where: {
                agencyId,
                dateStr: { gte: startDate, lte: endDate }
            }
        });

        // Parse CDMX dates to UTC for accurate AdnDiagnostic filtering
        const start = new Date(startDate + "T00:00:00.000-06:00");
        const end = new Date(endDate + "T23:59:59.999-06:00");

        const adns = await prisma.adnDiagnostic.findMany({
            where: {
                agencyId,
                createdAt: { gte: start, lte: end }
            },
            select: { userId: true, clienteNombre: true }
        });

        return { success: true, agents, logs, adns };

    } catch (error: any) {
        console.error("Error fetching weekly report data:", error);
        return { success: false, message: error.message };
    }
}



// ==========================================
// PUSH SETTINGS & SCHEDULING (ADMIN)
// ==========================================

export async function getAdminSettings() {
    const pointsSetting = await prisma.setting.findUnique({ where: { key: 'push_points_enabled' } });
    const planningSetting = await prisma.setting.findUnique({ where: { key: 'push_planning_enabled' } });
    
    return {
        pushPointsEnabled: pointsSetting ? pointsSetting.value === 'true' : true,
        pushPlanningEnabled: planningSetting ? planningSetting.value === 'true' : true,
    };
}

export async function toggleAdminSetting(key: string, enabled: boolean, pin: string) {
    if (pin !== "5515015502") return { success: false, message: "PIN de seguridad incorrecto." };
    
    const session = await auth();
    if (!session?.user?.email) return { success: false, message: "No autenticado." };
    
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (user?.role !== 'ADMIN') return { success: false, message: "No autorizado." };

    try {
        await prisma.setting.upsert({
            where: { key },
            update: { value: enabled ? 'true' : 'false' },
            create: { key, value: enabled ? 'true' : 'false' }
        });
        return { success: true };
    } catch (err: any) {
        return { success: false, message: err.message };
    }
}

export async function getScheduledPushes() {
    return await prisma.scheduledPush.findMany({
        orderBy: { createdAt: 'desc' }
    });
}

export async function createScheduledPush(data: { message: string, frequency: string, timeHour: number, recipientId: string, runDate?: string }, pin: string) {
    const session = await auth();
    if (!session?.user?.email) return { success: false, message: "No autenticado." };
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) return { success: false, message: "No autorizado." };
    
    if (user.password !== pin) return { success: false, message: "ContraseÃƒÆ’Ã‚Â±a incorrecta." };

    try {
        await prisma.scheduledPush.create({ data });
        return { success: true };
    } catch (err: any) {
        return { success: false, message: err.message };
    }
}

export async function deleteScheduledPush(id: string, pin: string) {
    const session = await auth();
    if (!session?.user?.email) return { success: false, message: "No autenticado." };
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) return { success: false, message: "No autorizado." };
    
    if (user.password !== pin) return { success: false, message: "ContraseÃƒÆ’Ã‚Â±a incorrecta." };

    try {
        await prisma.scheduledPush.delete({ where: { id } });
        return { success: true };
    } catch (err: any) {
        return { success: false, message: err.message };
    }
}

export async function resolveTicket(ticketId: string) {
    const session = await auth();
    if (!session?.user?.email) return { success: false, message: "Unauthorized" };

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user || user.role !== "SUPER_ADMIN") return { success: false, message: "Only Super Admins can resolve tickets." };

    try {
        await prisma.ticket.update({
            where: { id: ticketId },
            data: { status: "RESOLVED" }
        });
        revalidatePath('/admin/tickets');
        revalidatePath('/'); // To update the badge count on the layout
        return { success: true };
    } catch (err: any) {
        return { success: false, message: err.message };
    }
}


// ----------------------------------------------------------------------------
// MÃƒÂ³dulo de Votaciones (Polls)
// ----------------------------------------------------------------------------

export async function createPoll(title: string, question: string, optionsText: string[]) {
    try {
        const session = await auth();
        if (!session?.user?.email) return { success: false, message: "No autenticado" };
        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user || user.role !== 'SUPER_ADMIN') return { success: false, message: "Permisos insuficientes" };

        if (!title || !question || optionsText.length < 2) {
            return { success: false, message: "Faltan datos para crear la encuesta" };
        }

        const poll = await prisma.poll.create({
            data: {
                title,
                question,
                options: {
                    create: optionsText.map(text => ({ text }))
                }
            }
        });
        return { success: true, poll };
    } catch (error: any) {
        console.error("Error creating poll:", error);
        return { success: false, message: error.message || "Error al crear encuesta" };
    }
}

export async function getActivePolls() {
    try {
        const session = await auth();
        if (!session?.user?.email) return { success: false, message: "No autenticado", polls: [] };
        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) return { success: false, message: "Usuario no encontrado", polls: [] };

        const polls = await prisma.poll.findMany({
            where: { active: true },
            include: {
                options: {
                    include: {
                        _count: { select: { votes: true } }
                    }
                },
                _count: { select: { votes: true } },
                votes: {
                    where: { userId: user.id } // Traemos solo los votos de este usuario para ver si ya votÃƒÂ³
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return { success: true, polls };
    } catch (error: any) {
        console.error("Error fetching polls:", error);
        return { success: false, message: "Error al obtener encuestas", polls: [] };
    }
}

export async function voteOnPoll(pollId: string, optionId: string) {
    try {
        const session = await auth();
        if (!session?.user?.email) return { success: false, message: "No autenticado" };
        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user || !user.agencyId) return { success: false, message: "Usuario no vÃƒÂ¡lido" };

        // Check if poll is active
        const poll = await prisma.poll.findUnique({ where: { id: pollId } });
        if (!poll || !poll.active) return { success: false, message: "La encuesta ya no estÃƒÂ¡ activa" };

        // Upsert para garantizar un solo voto (create or fail by unique constraint)
        const vote = await prisma.pollVote.create({
            data: {
                pollId,
                optionId,
                userId: user.id,
                agencyId: user.agencyId
            }
        });
        return { success: true, vote };
    } catch (error: any) {
        if (error.code === 'P2002') {
            return { success: false, message: "Ya has registrado tu voto en esta encuesta." };
        }
        console.error("Error voting:", error);
        return { success: false, message: "Error al registrar voto" };
    }
}

export async function getPollResults() {
    try {
        const session = await auth();
        if (!session?.user?.email) return { success: false, message: "No autenticado", polls: [] };
        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user || user.role !== 'SUPER_ADMIN') return { success: false, message: "Permisos insuficientes", polls: [] };

        const polls = await prisma.poll.findMany({
            include: {
                options: {
                    include: {
                        _count: {
                            select: { votes: true }
                        }
                    }
                },
                _count: {
                    select: { votes: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return { success: true, polls };
    } catch (error: any) {
        console.error("Error fetching poll results:", error);
        return { success: false, message: "Error al obtener resultados", polls: [] };
    }
}

export async function deactivatePoll(pollId: string, status: boolean) {
    try {
        const session = await auth();
        if (!session?.user?.email) return { success: false, message: "No autenticado" };
        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user || user.role !== 'SUPER_ADMIN') return { success: false, message: "Permisos insuficientes" };

        const updated = await prisma.poll.update({
            where: { id: pollId },
            data: { active: status }
        });
        return { success: true, poll: updated };
    } catch (error: any) {
        return { success: false, message: "Error al cambiar estatus" };
    }
}

export async function deletePoll(pollId: string) {
    try {
        const session = await auth();
        if (!session?.user?.email) return { success: false, message: "No autenticado" };
        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user || user.role !== 'SUPER_ADMIN') return { success: false, message: "Permisos insuficientes" };

        await prisma.poll.delete({
            where: { id: pollId }
        });
        return { success: true };
    } catch (error: any) {
        return { success: false, message: "Error al borrar encuesta" };
    }
}

export async function getContacts() {
    try {
        const session = await auth();
        if (!session?.user?.email) return { success: false, message: "No autenticado", contacts: [] };
        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) return { success: false, message: "Usuario no encontrado", contacts: [] };

        const contacts = await prisma.frequentContact.findMany({
            where: { userId: user.id },
            orderBy: { name: 'asc' }
        });
        return { success: true, contacts };
    } catch (error: any) {
        console.error("Error fetching contacts:", error);
        return { success: false, message: "Error al obtener contactos", contacts: [] };
    }
}

export async function createContact(name: string, email: string) {
    try {
        const session = await auth();
        if (!session?.user?.email) return { success: false, message: "No autenticado" };
        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) return { success: false, message: "Usuario no encontrado" };

        const cleanName = name.trim();
        const cleanEmail = email.trim().toLowerCase();

        if (!cleanName || !cleanEmail) {
            return { success: false, message: "Nombre y correo son obligatorios" };
        }

        // Basic email format check
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(cleanEmail)) {
            return { success: false, message: "Formato de correo inválido" };
        }

        // Check if contact already exists
        const existing = await prisma.frequentContact.findUnique({
            where: {
                userId_email: {
                    userId: user.id,
                    email: cleanEmail
                }
            }
        });

        if (existing) {
            return { success: false, message: "Ya tienes un contacto registrado con este correo" };
        }

        const newContact = await prisma.frequentContact.create({
            data: {
                name: cleanName,
                email: cleanEmail,
                userId: user.id
            }
        });

        return { success: true, contact: newContact };
    } catch (error: any) {
        console.error("Error creating contact:", error);
        return { success: false, message: error.message || "Error al crear contacto" };
    }
}

export async function deleteContact(id: string) {
    try {
        const session = await auth();
        if (!session?.user?.email) return { success: false, message: "No autenticado" };
        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) return { success: false, message: "Usuario no encontrado" };

        // Verify contact ownership
        const contact = await prisma.frequentContact.findUnique({ where: { id } });
        if (!contact || contact.userId !== user.id) {
            return { success: false, message: "Contacto no encontrado o sin autorización" };
        }

        await prisma.frequentContact.delete({ where: { id } });
        return { success: true };
    } catch (error: any) {
        console.error("Error deleting contact:", error);
        return { success: false, message: error.message || "Error al eliminar contacto" };
    }
}


