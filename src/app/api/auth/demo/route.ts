import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    const session = await auth();
    
    // Solo vendedores o Super Admins pueden iniciar el modo demo de esta manera
    if (!session?.user || (session.user.role !== 'SELLER' && session.user.role !== 'SUPER_ADMIN')) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode") || "admin"; // "admin" o "agent"

    // Auto-crear la Agencia Demo si no existe en producción
    let demoAgency = await prisma.agency.findUnique({ where: { id: 'demo-agency-id' } });
    if (!demoAgency) {
        demoAgency = await prisma.agency.create({
            data: {
                id: 'demo-agency-id',
                name: 'Agencia Demo Élite',
                slug: 'demo',
                primaryColor: '#4f46e5',
                active: true,
                subscriptionStatus: 'active'
            }
        });
    }

    // Auto-crear el Usuario Demo Promotor si no existe en producción
    let demoUser = await prisma.user.findUnique({ where: { id: 'demo-user-id' } });
    if (!demoUser) {
        demoUser = await prisma.user.create({
            data: {
                id: 'demo-user-id',
                email: 'demo@aacommx.com',
                name: 'Promotor Demo (Modo Lectura)',
                role: 'ADMIN',
                active: true,
                agencyId: 'demo-agency-id'
            }
        });
    }

    // Auto-crear el Usuario Demo Agente si no existe en producción
    let demoAgent = await prisma.user.findUnique({ where: { id: 'demo-agent-user-id' } });
    if (!demoAgent) {
        demoAgent = await prisma.user.create({
            data: {
                id: 'demo-agent-user-id',
                email: 'agente.demo@aacommx.com',
                name: 'Carlos Agente Estrella (Modo Lectura)',
                role: 'AGENTE',
                active: true,
                agencyId: 'demo-agency-id'
            }
        });
    }

    // Auto-crear otros Agentes de Prueba para poblar el Ranking y la pestaña de Equipo
    let demoAgent2 = await prisma.user.findUnique({ where: { id: 'demo-agent-2-id' } });
    if (!demoAgent2) {
        demoAgent2 = await prisma.user.create({
            data: {
                id: 'demo-agent-2-id',
                email: 'sofia.agente@aacommx.com',
                name: 'Sofía Mendoza (Agente)',
                role: 'AGENTE',
                active: true,
                agencyId: 'demo-agency-id'
            }
        });
    }

    let demoAgent3 = await prisma.user.findUnique({ where: { id: 'demo-agent-3-id' } });
    if (!demoAgent3) {
        demoAgent3 = await prisma.user.create({
            data: {
                id: 'demo-agent-3-id',
                email: 'pedro.agente@aacommx.com',
                name: 'Pedro Rivas (Agente)',
                role: 'AGENTE',
                active: true,
                agencyId: 'demo-agency-id'
            }
        });
    }

    // Auto-crear Clientes Demo
    const client1 = await prisma.client.findUnique({ where: { id: 'demo-client-1' } });
    if (!client1) {
        await prisma.client.create({
            data: {
                id: 'demo-client-1',
                name: 'Juan Carlos Pérez',
                email: 'juan.perez@email.com',
                phone: '5512345678',
                birthDate: new Date('1988-05-15'),
                userId: 'demo-agent-user-id',
                agencyId: 'demo-agency-id'
            }
        });
    }

    const client2 = await prisma.client.findUnique({ where: { id: 'demo-client-2' } });
    if (!client2) {
        await prisma.client.create({
            data: {
                id: 'demo-client-2',
                name: 'María Elena Fuentes',
                email: 'maria.fuentes@email.com',
                phone: '5598765432',
                birthDate: new Date('1992-09-20'),
                userId: 'demo-agent-user-id',
                agencyId: 'demo-agency-id'
            }
        });
    }

    const client3 = await prisma.client.findUnique({ where: { id: 'demo-client-3' } });
    if (!client3) {
        await prisma.client.create({
            data: {
                id: 'demo-client-3',
                name: 'Roberto Garza',
                email: 'roberto.garza@email.com',
                phone: '5577668899',
                userId: 'demo-agent-2-id',
                agencyId: 'demo-agency-id'
            }
        });
    }

    // Auto-crear Pólizas Demo
    const policy1 = await prisma.policy.findUnique({ where: { id: 'demo-policy-1' } });
    if (!policy1) {
        await prisma.policy.create({
            data: {
                id: 'demo-policy-1',
                policyNumber: 'POL-DEMO-991',
                contractor: 'Juan Carlos Pérez',
                insured: 'Juan Carlos Pérez',
                product: 'Vida Inversión',
                insuranceCompany: 'Axa',
                annualPremium: 45000,
                approximateCommission: 13500,
                approximateBonus: 2250,
                userId: 'demo-agent-user-id',
                agencyId: 'demo-agency-id',
                clientId: 'demo-client-1',
                effectiveDate: new Date(),
                renewalDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365) // 1 año
            }
        });
    }

    const policy2 = await prisma.policy.findUnique({ where: { id: 'demo-policy-2' } });
    if (!policy2) {
        await prisma.policy.create({
            data: {
                id: 'demo-policy-2',
                policyNumber: 'POL-DEMO-992',
                contractor: 'María Elena Fuentes',
                insured: 'María Elena Fuentes',
                product: 'Gastos Médicos Mayores',
                insuranceCompany: 'MetLife',
                annualPremium: 32000,
                approximateCommission: 4800,
                approximateBonus: 800,
                userId: 'demo-agent-user-id',
                agencyId: 'demo-agency-id',
                clientId: 'demo-client-2',
                effectiveDate: new Date(),
                renewalDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 15) // Vence en 15 días
            }
        });
    }

    // Auto-crear Cotización Demo
    const cotiz1 = await prisma.cotizacion.findUnique({ where: { id: 'demo-cotiz-1' } });
    if (!cotiz1) {
        await prisma.cotizacion.create({
            data: {
                id: 'demo-cotiz-1',
                cliente: 'Juan Carlos Pérez',
                telefono: '5512345678',
                agente: 'Carlos Agente Estrella',
                producto: 'Orvi 99',
                primaAnual: 45000,
                totalPrima: 45000,
                ahorro: 30000,
                rendimiento: 5.5,
                userId: 'demo-agent-user-id',
                agencyId: 'demo-agency-id'
            }
        });
    }

    // Auto-crear Diagnóstico ADN Demo
    const adn1 = await prisma.adnDiagnostic.findUnique({ where: { id: 'demo-adn-1' } });
    if (!adn1) {
        await prisma.adnDiagnostic.create({
            data: {
                id: 'demo-adn-1',
                modalidad: 'DETALLADO',
                clienteNombre: 'Juan Carlos Pérez',
                clienteEdad: 35,
                situacionLaboral: 'Empleado asalariado',
                ingresosTotales: 75000,
                ingresosNetos: 60000,
                ahorroActual: 20000,
                totalGastos: 48000,
                gastosData: '[]',
                userId: 'demo-agent-user-id',
                agencyId: 'demo-agency-id'
            }
        });
    }

    // Auto-crear Evaluaciones PEA / Desempeño
    const pea1 = await prisma.performanceReview.findUnique({ where: { id: 'demo-pea-1' } });
    if (!pea1) {
        await prisma.performanceReview.create({
            data: {
                id: 'demo-pea-1',
                metaPrimasMensual: 50000,
                avancePrimasActual: 32000,
                puntosActividad: 22,
                adnsRealizados: 4,
                status: 'PENDING',
                evalMonth: 'Julio',
                evalWeek: 'Semana 1',
                agentId: 'demo-agent-user-id',
                agencyId: 'demo-agency-id'
            }
        });
    }

    const pea2 = await prisma.performanceReview.findUnique({ where: { id: 'demo-pea-2' } });
    if (!pea2) {
        await prisma.performanceReview.create({
            data: {
                id: 'demo-pea-2',
                metaPrimasMensual: 60000,
                avancePrimasActual: 62000,
                puntosActividad: 28,
                adnsRealizados: 6,
                status: 'REVIEWED',
                evalMonth: 'Julio',
                evalWeek: 'Semana 1',
                agentId: 'demo-agent-2-id',
                agencyId: 'demo-agency-id'
            }
        });
    }

    // Auto-crear Documento Demo en la Biblioteca
    const doc1 = await prisma.agencyDocument.findUnique({ where: { id: 'demo-doc-1' } });
    if (!doc1) {
        await prisma.agencyDocument.create({
            data: {
                id: 'demo-doc-1',
                name: 'Presentacion_Ventas_AACOM.pdf',
                fileUrl: 'https://aacomsoft.com/demo-presentacion.pdf',
                fileSize: 2048000,
                fileType: 'application/pdf',
                agencyId: 'demo-agency-id'
            }
        });
    }

    // Registrar bitácoras de actividades ficticias para Carlos y Sofía (para poblar el Ranking de Puntos)
    const todayStr = new Date().toISOString().split('T')[0];
    const logCheck = await prisma.activityLog.findFirst({ where: { agencyId: 'demo-agency-id' } });
    if (!logCheck) {
        // Sofia Mendoza (28 puntos)
        await prisma.activityLog.create({ data: { userId: 'demo-agent-2-id', agencyId: 'demo-agency-id', activityId: '3', activityName: 'Diagnóstico ADN', points: 5, prospectName: 'Alicia Ramos', dateStr: todayStr } });
        await prisma.activityLog.create({ data: { userId: 'demo-agent-2-id', agencyId: 'demo-agency-id', activityId: '3', activityName: 'Diagnóstico ADN', points: 5, prospectName: 'Damián Soto', dateStr: todayStr } });
        await prisma.activityLog.create({ data: { userId: 'demo-agent-2-id', agencyId: 'demo-agency-id', activityId: '6', activityName: 'Cierre Pagado', points: 5, prospectName: 'Roberto Garza', dateStr: todayStr } });
        await prisma.activityLog.create({ data: { userId: 'demo-agent-2-id', agencyId: 'demo-agency-id', activityId: '5', activityName: 'Intento de Cierre', points: 4, prospectName: 'Estela Cruz', dateStr: todayStr } });
        await prisma.activityLog.create({ data: { userId: 'demo-agent-2-id', agencyId: 'demo-agency-id', activityId: '4', activityName: 'Presentación', points: 3, prospectName: 'Gabriel Ortiz', dateStr: todayStr } });
        await prisma.activityLog.create({ data: { userId: 'demo-agent-2-id', agencyId: 'demo-agency-id', activityId: '4', activityName: 'Presentación', points: 3, prospectName: 'Lorena Ruiz', dateStr: todayStr } });
        await prisma.activityLog.create({ data: { userId: 'demo-agent-2-id', agencyId: 'demo-agency-id', activityId: '2', activityName: 'Llamada de Contacto', points: 2, prospectName: 'Lucas Vega', dateStr: todayStr } });
        await prisma.activityLog.create({ data: { userId: 'demo-agent-2-id', agencyId: 'demo-agency-id', activityId: '1', activityName: 'Referido', points: 1, prospectName: 'Diana Bernal', dateStr: todayStr } });

        // Carlos Agente Estrella (22 puntos)
        await prisma.activityLog.create({ data: { userId: 'demo-agent-user-id', agencyId: 'demo-agency-id', activityId: '3', activityName: 'Diagnóstico ADN', points: 5, prospectName: 'Juan Pérez', dateStr: todayStr } });
        await prisma.activityLog.create({ data: { userId: 'demo-agent-user-id', agencyId: 'demo-agency-id', activityId: '3', activityName: 'Diagnóstico ADN', points: 5, prospectName: 'Elena Fuentes', dateStr: todayStr } });
        await prisma.activityLog.create({ data: { userId: 'demo-agent-user-id', agencyId: 'demo-agency-id', activityId: '5', activityName: 'Intento de Cierre', points: 4, prospectName: 'Marcos Gil', dateStr: todayStr } });
        await prisma.activityLog.create({ data: { userId: 'demo-agent-user-id', agencyId: 'demo-agency-id', activityId: '4', activityName: 'Presentación', points: 3, prospectName: 'Karla Torres', dateStr: todayStr } });
        await prisma.activityLog.create({ data: { userId: 'demo-agent-user-id', agencyId: 'demo-agency-id', activityId: '2', activityName: 'Llamada de Contacto', points: 2, prospectName: 'Raúl Díaz', dateStr: todayStr } });
        await prisma.activityLog.create({ data: { userId: 'demo-agent-user-id', agencyId: 'demo-agency-id', activityId: '2', activityName: 'Llamada de Contacto', points: 2, prospectName: 'Sofía Rey', dateStr: todayStr } });
        await prisma.activityLog.create({ data: { userId: 'demo-agent-user-id', agencyId: 'demo-agency-id', activityId: '1', activityName: 'Referido', points: 1, prospectName: 'Óscar Mendoza', dateStr: todayStr } });

        // Pedro Rivas (15 puntos)
        await prisma.activityLog.create({ data: { userId: 'demo-agent-3-id', agencyId: 'demo-agency-id', activityId: '3', activityName: 'Diagnóstico ADN', points: 5, prospectName: 'Tomás Gómez', dateStr: todayStr } });
        await prisma.activityLog.create({ data: { userId: 'demo-agent-3-id', agencyId: 'demo-agency-id', activityId: '6', activityName: 'Cierre Pagado', points: 5, prospectName: 'Patricia León', dateStr: todayStr } });
        await prisma.activityLog.create({ data: { userId: 'demo-agent-3-id', agencyId: 'demo-agency-id', activityId: '4', activityName: 'Presentación', points: 3, prospectName: 'Hugo Blanco', dateStr: todayStr } });
        await prisma.activityLog.create({ data: { userId: 'demo-agent-3-id', agencyId: 'demo-agency-id', activityId: '2', activityName: 'Llamada de Contacto', points: 2, prospectName: 'Laura Merino', dateStr: todayStr } });
    }

    // Establecer una cookie segura HttpOnly que expira en 2 horas (tiempo suficiente para una demo)
    cookies().set('demoMode', mode, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 2, // 2 horas
        path: '/'
    });

    return NextResponse.json({ success: true });
}
