import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const session = await auth()
  
  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const email = session.user.email
  const name = email.split('@')[0]
  const initials = name.substring(0, 2).toUpperCase()

  try {
    const emailLower = email.toLowerCase();
    
    // Check if the agency is trialing
    const dbUser = await prisma.user.findUnique({
      where: { email: emailLower },
      include: { agency: true }
    });

    if (dbUser?.agency?.subscriptionStatus === "trialing") {
      return NextResponse.json({ error: "Módulo se desbloquea con cuentas permanentes", trial: true }, { status: 403 })
    }

    // 1. Get license details
    let remainingDays = 0;
    let dias_asignados = 0;
    
    const licenseRows = await prisma.estudioLicencia.findMany({
      where: { agente_email: emailLower },
      orderBy: { fecha_expiracion: 'desc' },
      select: { dias_asignados: true, fecha_expiracion: true }
    });
    if (licenseRows.length > 0) {
      const license = licenseRows[0]
      dias_asignados = license.dias_asignados || 0
      if (license.fecha_expiracion) {
        const exp = new Date(license.fecha_expiracion).getTime()
        const now = new Date().getTime()
        if (exp > now) {
          remainingDays = Math.ceil((exp - now) / (1000 * 60 * 60 * 24))
        }
      }
    }

    // 2. Get study times per module (only Cédula A modules)
    const progressRows = await prisma.estudioProgreso.findMany({
      where: {
        email: emailLower,
        NOT: { module: { startsWith: "b:" } }
      },
      select: { module: true, tiempo_segundos: true, pregunta_actual: true }
    });
    
    const timesPerModule: Record<string, number> = {
      "Aspectos Generales": 0,
      "Regulación CNSF": 0,
      "Vida Individual": 0,
      "Accidentes y Enfermedades": 0,
      "Seguros de Daños": 0,
      "Sistema y Mercados Financieros": 0
    };

    const studyProgress: Record<string, number> = {
      "Aspectos Generales": 0,
      "Regulación CNSF": 0,
      "Vida Individual": 0,
      "Accidentes y Enfermedades": 0,
      "Seguros de Daños": 0,
      "Sistema y Mercados Financieros": 0
    };

    let totalStudySeconds = 0;
    progressRows.forEach(p => {
      if (timesPerModule[p.module] !== undefined) {
        timesPerModule[p.module] = (p.tiempo_segundos || 0) / 60; // convert to minutes
        totalStudySeconds += p.tiempo_segundos || 0;
        studyProgress[p.module] = p.pregunta_actual || 0;
      }
    });

    // 3. Get attempts (only Cédula A attempts)
    const attemptsRows = await prisma.examenIntento.findMany({
      where: { email: emailLower },
      orderBy: { fecha: 'asc' },
      select: { calificacion: true, aprobado: true, fecha: true, detalles_modulos: true }
    });

    const cedulaAAttempts = attemptsRows.filter(att => {
      const details = att.detalles_modulos as any;
      return !details || details._cedula !== 'B';
    });

    const attempts = cedulaAAttempts.map(att => {
      const rawDetails = (att.detalles_modulos as Record<string, any>) || {};
      const { _cedula, ...cleanDetails } = rawDetails;
      return {
        date: att.fecha ? new Date(att.fecha).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        score: Number(att.calificacion),
        passed: att.aprobado,
        details: cleanDetails
      };
    });

    // Calculate module scores based on last Cédula A attempt details
    const moduleScores: Record<string, number> = {
      "Aspectos Generales": 0,
      "Regulación CNSF": 0,
      "Vida Individual": 0,
      "Accidentes y Enfermedades": 0,
      "Seguros de Daños": 0,
      "Sistema y Mercados Financieros": 0
    };

    if (cedulaAAttempts.length > 0) {
      const latest = cedulaAAttempts[cedulaAAttempts.length - 1];
      if (latest && latest.detalles_modulos) {
        const details = latest.detalles_modulos as Record<string, any>;
        Object.keys(details).forEach(mod => {
          const modData = details[mod];
          if (modData && modData.total > 0 && moduleScores[mod] !== undefined) {
            moduleScores[mod] = Math.round((modData.correct / modData.total) * 100);
          }
        });
      }
    }

    return NextResponse.json({
      id: email,
      name: name.charAt(0).toUpperCase() + name.slice(1),
      initials,
      email,
      status: remainingDays > 0 ? "active" : "inactive",
      studyTime: totalStudySeconds / 60, // in minutes
      remainingDays,
      attempts,
      timesPerModule,
      moduleScores,
      studyProgress
    });

  } catch (err: any) {
    console.error("Error in GET agent-data:", err)
    return NextResponse.json({ error: "Database error", details: err.message }, { status: 500 })
  }
}
