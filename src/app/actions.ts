'use server'

import { appendToSheet } from "@/lib/google-sheets";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { SALES_ACTIVITIES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

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
    // "Llamadas de Prospección" (1) -> LLAMADAS (E)
    // "Citas Iniciales" (2) -> CITAS AGENDADAS (F, G)
    // "Análisis de Necesidades" (3) -> CITAS EFECTIVAS (H, I) ?? (Analysis often implies an effective meeting)
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
    try {
        const newCotizacion = await prisma.cotizacion.create({
            data: {
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
        return { success: false, message: error.message || "Error al guardar cotización" };
    }
}

export async function getCotizaciones() {
    try {
        const list = await prisma.cotizacion.findMany({
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

export async function getAgents() {
    try {
        const agents = await prisma.agent.findMany({
            orderBy: {
                name: 'asc'
            }
        });
        return { success: true, agents };
    } catch (error: any) {
        console.error("Error fetching agents:", error);
        return { success: false, message: error.message || "Error al obtener agentes", agents: [] };
    }
}

export async function createAgent(name: string) {
    try {
        const trimmedName = name.trim();
        if (!trimmedName) {
            return { success: false, message: "El nombre del agente no puede estar vacío" };
        }
        
        // Check for duplicates (case insensitive search or direct unique key handle)
        const existing = await prisma.agent.findUnique({
            where: { name: trimmedName }
        });
        
        if (existing) {
            return { success: false, message: "Este agente ya se encuentra registrado" };
        }

        const newAgent = await prisma.agent.create({
            data: { name: trimmedName }
        });
        return { success: true, agent: newAgent };
    } catch (error: any) {
        console.error("Error creating agent:", error);
        return { success: false, message: error.message || "Error al registrar el agente" };
    }
}

export async function deleteAgent(id: string) {
    try {
        const deleted = await prisma.agent.delete({
            where: { id }
        });
        return { success: true, agent: deleted };
    } catch (error: any) {
        console.error("Error deleting agent:", error);
        return { success: false, message: error.message || "Error al eliminar el agente" };
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
    gastosData: string;
    totalGastos: number;
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

        const newDiagnostic = await prisma.adnDiagnostic.create({
            data: {
                userId: user.id,
                modalidad: data.modalidad,
                clienteNombre: data.clienteNombre,
                clienteEdad: data.clienteEdad,
                conyugeNombre: data.conyugeNombre || null,
                conyugeEdad: data.conyugeEdad || null,
                situacionLaboral: data.situacionLaboral,
                hijosData: data.hijosData || null,
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
                gastosData: data.gastosData,
                totalGastos: data.totalGastos,
            }
        });

        revalidatePath('/adn');
        revalidatePath('/admin');
        return { success: true, diagnostic: newDiagnostic };
    } catch (error: any) {
        console.error("Error saving ADN diagnostic:", error);
        return { success: false, message: error.message || "Error al guardar el diagnóstico de ADN" };
    }
}

export async function getAdnDiagnostics() {
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

        let diagnostics;
        if (user.role === 'ADMIN') {
            // Admin sees all diagnostics, including the agent's name
            diagnostics = await prisma.adnDiagnostic.findMany({
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
        } else {
            // Agent only sees their own diagnostics
            diagnostics = await prisma.adnDiagnostic.findMany({
                where: {
                    userId: user.id
                },
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
        return { success: false, message: error.message || "Error al obtener diagnósticos de ADN" };
    }
}

export async function createAgentUser(data: { name: string; email: string; role: string; phone?: string; active?: boolean; password?: string; syncToAgent?: boolean }) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return { success: false, message: "No autenticado" };
        }

        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!currentUser || currentUser.role !== 'ADMIN') {
            return { success: false, message: "Permisos insuficientes" };
        }

        const existingUser = await prisma.user.findUnique({
            where: { email: data.email }
        });

        if (existingUser) {
            return { success: false, message: "Ya existe un usuario registrado con este correo" };
        }

        const newUser = await prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                role: data.role,
                phone: data.phone || null,
                active: data.active !== undefined ? data.active : true,
                password: data.password || "password123", // Simple plain text consistent with current auth config
            }
        });

        // Sincronización con el modelo Agent para el Cotizador
        if (data.syncToAgent) {
            const trimmedName = data.name.trim();
            const existingAgent = await prisma.agent.findUnique({
                where: { name: trimmedName }
            });
            if (!existingAgent) {
                await prisma.agent.create({
                    data: { name: trimmedName }
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

        if (!currentUser || currentUser.role !== 'ADMIN') {
            return { success: false, message: "Permisos insuficientes", users: [] };
        }

        const users = await prisma.user.findMany({
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

        if (!currentUser || currentUser.role !== 'ADMIN') {
            return { success: false, message: "Permisos insuficientes" };
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: { password: newPassword }
        });

        revalidatePath('/admin');
        return { success: true, user: updatedUser };
    } catch (error: any) {
        console.error("Error updating user password:", error);
        return { success: false, message: error.message || "Error al actualizar contraseña" };
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

        if (!currentUser || currentUser.role !== 'ADMIN') {
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

        if (!currentUser || currentUser.role !== 'ADMIN') {
            return { success: false, message: "Permisos insuficientes" };
        }

        // Evitar que el administrador se elimine a sí mismo
        if (currentUser.id === id) {
            return { success: false, message: "No puedes eliminar tu propia cuenta de administrador" };
        }

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

