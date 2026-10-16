import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { getAgencyStudyDaysLimit } from "@/lib/cedula/studyLimits"
import fs from "fs"
import path from "path"

function isPromoter(email: string, role?: string) {
  const lowerEmail = email.toLowerCase();
  const isSuperAdminEmail = (process.env.SUPER_ADMIN_EMAILS || "enrique.ahumada@aacommx.com,desarrollo.agencias@gmail.com").includes(lowerEmail);
  return lowerEmail.includes("promotor") || isSuperAdminEmail || role === "ADMIN" || role === "SUPER_ADMIN" || role === "PROMOTER" || role === "PROMOTOR";
}

function getNextReplenishDate(createdAt: Date): Date {
  const now = new Date();
  const created = new Date(createdAt);
  let replenish = new Date(created);
  while (replenish.getTime() <= now.getTime()) {
    replenish.setMonth(replenish.getMonth() + 3);
  }
  return replenish;
}

export async function GET(req: NextRequest) {
  const session = await auth()
  
  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const promoterEmail = session.user.email

  if (!isPromoter(promoterEmail, session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    // Load promoter's user and agency details
    const dbUser = await prisma.user.findUnique({
      where: { email: promoterEmail.toLowerCase() },
      include: { agency: true }
    })

    if (dbUser?.agency?.subscriptionStatus === "trialing") {
      return NextResponse.json({ error: "Módulo se desbloquea con cuentas permanentes", trial: true }, { status: 403 })
    }

    const createdDate = dbUser?.createdAt ? new Date(dbUser.createdAt) : new Date();
    const nextReplenishDate = getNextReplenishDate(createdDate);
    const lastReplenishDate = new Date(nextReplenishDate);
    lastReplenishDate.setMonth(lastReplenishDate.getMonth() - 3);

    // 1. Get promoter balance based on subscription plan (52 Anual, 25 Semestral, 12 Trimestral)
    const planLimit = getAgencyStudyDaysLimit(dbUser?.agency);
    let tokens = planLimit;
    const agencyKey = session.user.agencyId ? `agency_${session.user.agencyId}` : promoterEmail.toLowerCase();
    
    // Buscar primero por agencyKey y luego por email para no perder saldos históricos
    let saldo = await prisma.promotorSaldo.findUnique({
      where: { promotor_email: agencyKey }
    });
    if (!saldo && session.user.agencyId) {
      saldo = await prisma.promotorSaldo.findUnique({
        where: { promotor_email: promoterEmail.toLowerCase() }
      });
    }

    const currentDays = saldo?.dias_disponibles ?? 0;
    const lastUpdate = saldo?.fecha_actualizacion ? new Date(saldo.fecha_actualizacion) : new Date(0);
    const isQuarterlyReplenishDue = lastUpdate.getTime() < lastReplenishDate.getTime();

    // Auto-sincronización y garantía de plan:
    // Si no tiene saldo, o si su saldo es inferior a la cuota mínima garantizada por su suscripción (ej. tenía el default de 7 días y su plan es Anual de 52),
    // o si venció su ciclo trimestral, elevamos su saldo a planLimit.
    if (!saldo || currentDays < planLimit || isQuarterlyReplenishDue) {
      tokens = Math.max(planLimit, currentDays);
      await prisma.promotorSaldo.upsert({
        where: { promotor_email: agencyKey },
        update: {
          dias_disponibles: tokens,
          fecha_actualizacion: new Date()
        },
        create: {
          promotor_email: agencyKey,
          dias_disponibles: tokens,
          fecha_actualizacion: new Date()
        }
      });
    } else {
      tokens = currentDays;
    }
    
    const effectiveAgencyId = dbUser?.agencyId || (dbUser?.role === 'SUPER_ADMIN' ? 'aacom' : null)
    
    // Find all real agents/users belonging to this agency (strictly isolated by agencyId)
    let dbAgents: Array<{ email: string; name: string | null }> = []
    if (effectiveAgencyId) {
      dbAgents = await prisma.user.findMany({
        where: {
          agencyId: effectiveAgencyId
        },
        select: {
          email: true,
          name: true
        }
      })
    }

    // Filter out the current promoter themselves to avoid duplication in agents list
    dbAgents = dbAgents.filter(a => a.email.toLowerCase() !== promoterEmail.toLowerCase())

    // Include promoter email in bulk data loading
    const emails = [promoterEmail.toLowerCase(), ...dbAgents.map(a => a.email.toLowerCase())];
    
    // Pre-load data in bulk to avoid N+1 serverless timeouts
    const licensesMap: Record<string, any> = {};
    const progressMap: Record<string, Record<string, number>> = {};
    const progressIndexMap: Record<string, Record<string, number>> = {};
    const attemptsMap: Record<string, any[]> = {};
    const latestAttemptMap: Record<string, any> = {};

    if (emails.length > 0) {
      // Bulk 1: Licenses
      const licensesRows = await prisma.estudioLicencia.findMany({
        where: { agente_email: { in: emails } },
        select: { agente_email: true, dias_asignados: true, fecha_expiracion: true }
      });
      licensesRows.forEach(row => {
        licensesMap[row.agente_email.toLowerCase()] = row;
      });

      // Bulk 2: Progress (only Cédula A modules)
      const progressRows = await prisma.estudioProgreso.findMany({
        where: {
          email: { in: emails },
          NOT: { module: { startsWith: "b:" } }
        },
        select: { email: true, module: true, tiempo_segundos: true, pregunta_actual: true }
      });
      progressRows.forEach(row => {
        const email = row.email.toLowerCase();
        if (!progressMap[email]) {
          progressMap[email] = {
            "Aspectos Generales": 0,
            "Regulación CNSF": 0,
            "Vida Individual": 0,
            "Accidentes y Enfermedades": 0,
            "Seguros de Daños": 0,
            "Sistema y Mercados Financieros": 0
          };
          progressIndexMap[email] = {
            "Aspectos Generales": 0,
            "Regulación CNSF": 0,
            "Vida Individual": 0,
            "Accidentes y Enfermedades": 0,
            "Seguros de Daños": 0,
            "Sistema y Mercados Financieros": 0
          };
        }
        if (progressMap[email][row.module] !== undefined) {
          progressMap[email][row.module] = (row.tiempo_segundos || 0) / 60; // convert to minutes
          progressIndexMap[email][row.module] = row.pregunta_actual || 0;
        }
      });

      // Bulk 3: Attempts (only Cédula A attempts)
      const attemptsRows = await prisma.examenIntento.findMany({
        where: { email: { in: emails } },
        orderBy: { fecha: 'asc' },
        select: { email: true, calificacion: true, aprobado: true, fecha: true, detalles_modulos: true }
      });
      attemptsRows.forEach(row => {
        const rawDetails = (row.detalles_modulos as Record<string, any>) || {};
        if (rawDetails._cedula === 'B') return; // Skip Cédula B attempts
        const { _cedula, ...cleanDetails } = rawDetails;
        const email = row.email.toLowerCase();
        if (!attemptsMap[email]) {
          attemptsMap[email] = [];
        }
        attemptsMap[email].push({
          date: row.fecha ? new Date(row.fecha).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          score: Number(row.calificacion),
          passed: row.aprobado,
          details: cleanDetails
        });
        // Last processed Cédula A item is the latest attempt
        latestAttemptMap[email] = cleanDetails;
      });
    }

    const agentsList = [];
    let idCounter = 1; // start sequential IDs from 1

    for (const dbAgent of dbAgents) {
      const email = dbAgent.email.toLowerCase();
      const name = dbAgent.name || email.split('@')[0];
      const initials = name.substring(0, 2).toUpperCase();
      
      const lic = licensesMap[email];
      let remainingDays = 0;
      if (lic && lic.fecha_expiracion) {
        const exp = new Date(lic.fecha_expiracion).getTime();
        const now = new Date().getTime();
        if (exp > now) {
          remainingDays = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
        }
      }

      const timesPerModule = progressMap[email] || {
        "Aspectos Generales": 0,
        "Regulación CNSF": 0,
        "Vida Individual": 0,
        "Accidentes y Enfermedades": 0,
        "Seguros de Daños": 0,
        "Sistema y Mercados Financieros": 0
      };

      const studyProgress = progressIndexMap[email] || {
        "Aspectos Generales": 0,
        "Regulación CNSF": 0,
        "Vida Individual": 0,
        "Accidentes y Enfermedades": 0,
        "Seguros de Daños": 0,
        "Sistema y Mercados Financieros": 0
      };

      let totalStudyMinutes = 0;
      Object.values(timesPerModule).forEach(v => {
        totalStudyMinutes += v;
      });

      const agentAttempts = attemptsMap[email] || [];

      const moduleScores: Record<string, number> = {
        "Aspectos Generales": 0,
        "Regulación CNSF": 0,
        "Vida Individual": 0,
        "Accidentes y Enfermedades": 0,
        "Seguros de Daños": 0,
        "Sistema y Mercados Financieros": 0
      };

      const latestDetails = latestAttemptMap[email] as Record<string, any>;
      if (latestDetails) {
        Object.keys(latestDetails).forEach(mod => {
          const modData = latestDetails[mod];
          if (modData && modData.total > 0 && moduleScores[mod] !== undefined) {
            moduleScores[mod] = Math.round((modData.correct / modData.total) * 100);
          }
        });
      }

      agentsList.push({
        id: idCounter++, // Integer ID to prevent string quotes and parsing errors
        name: name.charAt(0).toUpperCase() + name.slice(1),
        initials,
        email,
        status: remainingDays > 0 ? "active" : "inactive",
        studyTime: totalStudyMinutes, // in minutes
        remainingDays,
        attempts: agentAttempts,
        timesPerModule,
        moduleScores,
        studyProgress
      });
    }

    // Add promoter's own study account if they study (using already-filtered maps)
    const promoterSelfEmail = promoterEmail.toLowerCase();
    const promoterTimesPerModule: Record<string, number> = progressMap[promoterSelfEmail] || {
      "Aspectos Generales": 0,
      "Regulación CNSF": 0,
      "Vida Individual": 0,
      "Accidentes y Enfermedades": 0,
      "Seguros de Daños": 0,
      "Sistema y Mercados Financieros": 0
    };
    
    const promoterStudyProgress: Record<string, number> = progressIndexMap[promoterSelfEmail] || {
      "Aspectos Generales": 0,
      "Regulación CNSF": 0,
      "Vida Individual": 0,
      "Accidentes y Enfermedades": 0,
      "Seguros de Daños": 0,
      "Sistema y Mercados Financieros": 0
    };

    let promoterStudyTime = 0;
    Object.values(promoterTimesPerModule).forEach(v => {
      promoterStudyTime += v;
    });

    const promoterAttempts = attemptsMap[promoterSelfEmail] || [];

    // Calculate promoter's own module scores based on latest Cédula A attempt
    const promoterModuleScores: Record<string, number> = {
      "Aspectos Generales": 0,
      "Regulación CNSF": 0,
      "Vida Individual": 0,
      "Accidentes y Enfermedades": 0,
      "Seguros de Daños": 0,
      "Sistema y Mercados Financieros": 0
    };
    
    const promoterLatestDetails = latestAttemptMap[promoterSelfEmail] as Record<string, any>;
    if (promoterLatestDetails) {
      Object.keys(promoterLatestDetails).forEach(mod => {
        const modData = promoterLatestDetails[mod];
        if (modData && modData.total > 0 && promoterModuleScores[mod] !== undefined) {
          promoterModuleScores[mod] = Math.round((modData.correct / modData.total) * 100);
        }
      });
    }

    // Fetch actual remaining days from license for promoter
    const promoterLic = licensesMap[promoterSelfEmail];
    let promoterRemainingDays = 0;
    if (promoterLic && promoterLic.fecha_expiracion) {
      const exp = new Date(promoterLic.fecha_expiracion).getTime();
      const now = new Date().getTime();
      if (exp > now) {
        promoterRemainingDays = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
      }
    }

    agentsList.unshift({
      id: 99, // promoter self-study ID matches existing switchRole expectations
      name: `Tú (${dbUser?.name || 'Cuenta de Estudio'})`,
      initials: (dbUser?.name ? dbUser.name.substring(0, 2) : "PR").toUpperCase(),
      email: promoterSelfEmail,
      status: promoterRemainingDays > 0 ? "active" : "inactive",
      studyTime: promoterStudyTime,
      remainingDays: promoterRemainingDays,
      attempts: promoterAttempts,
      timesPerModule: promoterTimesPerModule,
      moduleScores: promoterModuleScores,
      studyProgress: promoterStudyProgress
    });

    return NextResponse.json({
      tokens,
      planLimit,
      totalGiftedThisQuarter: planLimit,
      nextReplenishDate: nextReplenishDate.toISOString(),
      agents: agentsList
    });

  } catch (err: any) {
    console.error("Error in GET promoter-data:", err)
    return NextResponse.json({ error: "Database error", details: err.message }, { status: 500 })
  }
}
