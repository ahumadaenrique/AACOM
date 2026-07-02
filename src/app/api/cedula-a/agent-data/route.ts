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
    // 1. Get license details
    let remainingDays = 0;
    let dias_asignados = 0;
    const licenseRows = await prisma.$queryRawUnsafe<any[]>(
      "SELECT dias_asignados, fecha_expiracion FROM estudio_licencias WHERE agente_email = $1",
      email.toLowerCase()
    )
    if (licenseRows.length > 0) {
      const license = licenseRows[0]
      dias_asignados = license.dias_asignados
      if (license.fecha_expiracion) {
        const exp = new Date(license.fecha_expiracion).getTime()
        const now = new Date().getTime()
        if (exp > now) {
          remainingDays = Math.ceil((exp - now) / (1000 * 60 * 60 * 24))
        }
      }
    } else {
      // If user is promoter, they have permanent access to study
      const isPromoter = email.toLowerCase().includes("promotor") || session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN" || session.user.role === "PROMOTER" || session.user.role === "PROMOTOR";
      if (isPromoter) {
        remainingDays = 999
      }
    }

    // 2. Get study times per module
    const progressRows = await prisma.$queryRawUnsafe<any[]>(
      "SELECT module, tiempo_segundos FROM estudio_progreso WHERE email = $1",
      email.toLowerCase()
    )
    
    const timesPerModule: Record<string, number> = {
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
        timesPerModule[p.module] = p.tiempo_segundos / 60; // convert to minutes
        totalStudySeconds += p.tiempo_segundos;
      }
    });

    // 3. Get attempts
    const attemptsRows = await prisma.$queryRawUnsafe<any[]>(
      "SELECT calificacion, aprobado, fecha FROM examen_intentos WHERE email = $1 ORDER BY fecha ASC",
      email.toLowerCase()
    )

    const attempts = attemptsRows.map(att => ({
      date: new Date(att.fecha).toISOString().split('T')[0],
      score: parseFloat(att.calificacion),
      passed: att.aprobado
    }));

    // Calculate module scores based on last attempt details
    const moduleScores: Record<string, number> = {
      "Aspectos Generales": 0,
      "Regulación CNSF": 0,
      "Vida Individual": 0,
      "Accidentes y Enfermedades": 0,
      "Seguros de Daños": 0,
      "Sistema y Mercados Financieros": 0
    };

    const latestAttemptRows = await prisma.$queryRawUnsafe<any[]>(
      "SELECT detalles_modulos FROM examen_intentos WHERE email = $1 ORDER BY fecha DESC LIMIT 1",
      email.toLowerCase()
    )
    if (latestAttemptRows.length > 0 && latestAttemptRows[0].detalles_modulos) {
      const details = latestAttemptRows[0].detalles_modulos;
      Object.keys(details).forEach(mod => {
        const modData = details[mod];
        if (modData && modData.total > 0) {
          moduleScores[mod] = Math.round((modData.correct / modData.total) * 100);
        }
      });
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
      moduleScores
    });

  } catch (err: any) {
    console.error("Error in GET agent-data:", err)
    return NextResponse.json({ error: "Database error", details: err.message }, { status: 500 })
  }
}
