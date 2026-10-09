import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

const CEDULA_B_MODULES = [
  "Seguro de Personas (Grupo y Colectivo)",
  "Seguro de Daños: Incendio y Catastróficos",
  "Marítimo, Transportes y Automóviles Flotillas",
  "Responsabilidad Civil y Admón. de Riesgos",
  "Ramos Técnicos de Daños",
  "Ramos Diversos y Misceláneos",
  "Regulación CNSF, Marco Legal y PLD"
];

const PREFIX = "b:";

export async function GET(req: NextRequest) {
  const session = await auth()
  
  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const email = session.user.email
  const emailLower = email.toLowerCase()
  const name = session.user.name || email.split("@")[0]
  const initials = name.split(" ").map((n: string) => n[0]).join("").toUpperCase().substring(0, 2)

  try {
    const dbUser = await prisma.user.findUnique({
      where: { email: emailLower },
      include: { agency: true }
    });

    if (dbUser?.agency?.subscriptionStatus === "trialing") {
      return NextResponse.json({ error: "Módulo se desbloquea con cuentas permanentes", trial: true }, { status: 403 })
    }

    // 1. Get license details (COMPARTIDO con Cédula A)
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

    // 2. Get study times per module for Cédula B
    const progressRows = await prisma.estudioProgreso.findMany({
      where: { 
        email: emailLower,
        module: { startsWith: PREFIX }
      },
      select: { module: true, tiempo_segundos: true, pregunta_actual: true }
    });
    
    const timesPerModule: Record<string, number> = {};
    const studyProgress: Record<string, number> = {};
    CEDULA_B_MODULES.forEach(mod => {
      timesPerModule[mod] = 0;
      studyProgress[mod] = 0;
    });

    let totalStudySeconds = 0;
    progressRows.forEach(p => {
      const cleanMod = p.module.replace(PREFIX, "");
      if (timesPerModule[cleanMod] !== undefined) {
        timesPerModule[cleanMod] = (p.tiempo_segundos || 0) / 60;
        totalStudySeconds += p.tiempo_segundos || 0;
        studyProgress[cleanMod] = p.pregunta_actual || 0;
      }
    });

    // 3. Get attempts for Cédula B
    const attemptsRows = await prisma.examenIntento.findMany({
      where: { email: emailLower },
      orderBy: { fecha: 'asc' },
      select: { calificacion: true, aprobado: true, fecha: true, detalles_modulos: true }
    });

    const cedulaBAttempts = attemptsRows.filter(att => {
      const details = att.detalles_modulos as any;
      return details && details._cedula === 'B';
    });

    const attempts = cedulaBAttempts.map(att => ({
      date: att.fecha ? new Date(att.fecha).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      score: Number(att.calificacion),
      passed: att.aprobado,
      details: att.detalles_modulos
    }));

    // Calculate module scores based on last attempt details
    const moduleScores: Record<string, number> = {};
    CEDULA_B_MODULES.forEach(mod => {
      moduleScores[mod] = 0;
    });

    if (cedulaBAttempts.length > 0) {
      const latest = cedulaBAttempts[cedulaBAttempts.length - 1];
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
      studyTime: totalStudySeconds / 60,
      remainingDays,
      attempts,
      timesPerModule,
      moduleScores,
      studyProgress
    });

  } catch (err: any) {
    console.error("Error in GET cedula-b agent-data:", err)
    return NextResponse.json({ error: "Database error", details: err.message }, { status: 500 })
  }
}
