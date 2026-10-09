import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { getAgencyStudyDaysLimit } from "@/lib/cedula/studyLimits"

function isPromoter(email: string, role?: string) {
  const lowerEmail = email.toLowerCase();
  const isSuperAdminEmail = (process.env.SUPER_ADMIN_EMAILS || "enrique.ahumada@aacommx.com,desarrollo.agencias@gmail.com").includes(lowerEmail);
  return lowerEmail.includes("promotor") || isSuperAdminEmail || role === "ADMIN" || role === "SUPER_ADMIN" || role === "PROMOTER" || role === "PROMOTOR";
}

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

    // 1. Get promoter balance (compartido con Cédula A)
    const planLimit = getAgencyStudyDaysLimit(dbUser?.agency);
    let tokens = planLimit;
    const promotorEmailLow = session.user.agencyId ? `agency_${session.user.agencyId}` : promoterEmail.toLowerCase();
    
    const saldo = await prisma.promotorSaldo.findUnique({
      where: { promotor_email: promotorEmailLow }
    });

    if (saldo) {
      tokens = saldo.dias_disponibles !== null && saldo.dias_disponibles !== undefined ? saldo.dias_disponibles : planLimit;
      const lastUpdate = saldo.fecha_actualizacion ? new Date(saldo.fecha_actualizacion) : new Date(0);
      if (lastUpdate.getTime() < lastReplenishDate.getTime()) {
        tokens = Math.max(planLimit, tokens);
        await prisma.promotorSaldo.update({
          where: { promotor_email: promotorEmailLow },
          data: {
            dias_disponibles: tokens,
            fecha_actualizacion: new Date()
          }
        });
      }
    } else {
      await prisma.promotorSaldo.create({
        data: {
          promotor_email: promotorEmailLow,
          dias_disponibles: planLimit,
          fecha_actualizacion: new Date()
        }
      });
    }
    
    const agencyId = dbUser?.agencyId
    
    // Find all real agents/users belonging to this agency
    let dbAgents: Array<{ email: string; name: string | null }> = []
    if (agencyId) {
      dbAgents = await prisma.user.findMany({
        where: { agencyId },
        select: { email: true, name: true }
      })
    } else if (dbUser?.role === 'SUPER_ADMIN') {
      dbAgents = await prisma.user.findMany({
        select: { email: true, name: true }
      })
    }
    
    const allEmails = dbAgents.map(a => a.email.toLowerCase())
    
    // 2. Fetch licenses for all agents in agency
    let licensesMap: Record<string, { dias_asignados: number | null; fecha_expiracion: Date | null }> = {}
    if (allEmails.length > 0) {
      const licensesRows = await prisma.estudioLicencia.findMany({
        where: { agente_email: { in: allEmails } },
        select: { agente_email: true, dias_asignados: true, fecha_expiracion: true }
      })
      licensesRows.forEach(row => {
        licensesMap[row.agente_email.toLowerCase()] = {
          dias_asignados: row.dias_asignados,
          fecha_expiracion: row.fecha_expiracion
        }
      })
    }

    // 3. Fetch progress for all agents in Cédula B
    let progressMap: Record<string, Record<string, number>> = {}
    let progressIndexMap: Record<string, Record<string, number>> = {}
    if (allEmails.length > 0) {
      const progressRows = await prisma.estudioProgreso.findMany({
        where: { 
          email: { in: allEmails },
          module: { startsWith: PREFIX }
        },
        select: { email: true, module: true, tiempo_segundos: true, pregunta_actual: true }
      })
      progressRows.forEach(row => {
        const email = row.email.toLowerCase()
        const cleanMod = row.module.replace(PREFIX, '')
        if (!progressMap[email]) {
          progressMap[email] = {}
          progressIndexMap[email] = {}
          CEDULA_B_MODULES.forEach(m => {
            progressMap[email][m] = 0
            progressIndexMap[email][m] = 0
          })
        }
        if (progressMap[email][cleanMod] !== undefined) {
          progressMap[email][cleanMod] = (row.tiempo_segundos || 0) / 60
          progressIndexMap[email][cleanMod] = row.pregunta_actual || 0
        }
      })
    }

    // 4. Fetch attempts for all agents in Cédula B
    let attemptsMap: Record<string, Array<any>> = {}
    let latestAttemptMap: Record<string, any> = {}
    if (allEmails.length > 0) {
      const attemptsRows = await prisma.examenIntento.findMany({
        where: { email: { in: allEmails } },
        orderBy: { fecha: 'asc' },
        select: { email: true, calificacion: true, aprobado: true, fecha: true, detalles_modulos: true }
      })
      attemptsRows.forEach(row => {
        const details = row.detalles_modulos as any;
        if (details && details._cedula === 'B') {
          const email = row.email.toLowerCase()
          if (!attemptsMap[email]) attemptsMap[email] = []
          attemptsMap[email].push({
            date: row.fecha ? new Date(row.fecha).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            score: Number(row.calificacion),
            passed: row.aprobado
          })
          latestAttemptMap[email] = row.detalles_modulos
        }
      })
    }

    const agentsList = []
    let idCounter = 1

    for (const dbAgent of dbAgents) {
      const email = dbAgent.email.toLowerCase()
      const name = dbAgent.name || email.split('@')[0]
      const initials = name.substring(0, 2).toUpperCase()
      
      const lic = licensesMap[email]
      let remainingDays = 0
      if (lic && lic.fecha_expiracion) {
        const exp = new Date(lic.fecha_expiracion).getTime()
        const now = new Date().getTime()
        if (exp > now) {
          remainingDays = Math.ceil((exp - now) / (1000 * 60 * 60 * 24))
        }
      }

      const timesPerModule: Record<string, number> = {}
      const studyProgress: Record<string, number> = {}
      CEDULA_B_MODULES.forEach(m => {
        timesPerModule[m] = (progressMap[email] && progressMap[email][m]) || 0
        studyProgress[m] = (progressIndexMap[email] && progressIndexMap[email][m]) || 0
      })

      let totalStudyMinutes = 0
      Object.values(timesPerModule).forEach(v => {
        totalStudyMinutes += v
      })

      const agentAttempts = attemptsMap[email] || []

      const moduleScores: Record<string, number> = {}
      CEDULA_B_MODULES.forEach(m => { moduleScores[m] = 0 })

      const latestDetails = latestAttemptMap[email] as Record<string, any>
      if (latestDetails) {
        Object.keys(latestDetails).forEach(mod => {
          const modData = latestDetails[mod]
          if (modData && modData.total > 0 && moduleScores[mod] !== undefined) {
            moduleScores[mod] = Math.round((modData.correct / modData.total) * 100)
          }
        })
      }

      agentsList.push({
        id: idCounter++,
        name: name.charAt(0).toUpperCase() + name.slice(1),
        initials,
        email,
        status: remainingDays > 0 ? "active" : "inactive",
        studyTime: totalStudyMinutes,
        remainingDays,
        attempts: agentAttempts,
        timesPerModule,
        moduleScores,
        studyProgress
      })
    }

    // Promotor self-account
    const promoterSelfEmail = promoterEmail.toLowerCase()
    const promoterLic = await prisma.estudioLicencia.findUnique({
      where: {
        promotor_email_agente_email: { promotor_email: promotorEmailLow, agente_email: promoterSelfEmail }
      }
    })

    let promoterRemainingDays = 0
    if (promoterLic && promoterLic.fecha_expiracion) {
      const exp = new Date(promoterLic.fecha_expiracion).getTime()
      const now = new Date().getTime()
      if (exp > now) {
        promoterRemainingDays = Math.ceil((exp - now) / (1000 * 60 * 60 * 24))
      }
    } else {
      promoterRemainingDays = tokens > 0 ? tokens : 0
    }

    const promoterSelfAccount = {
      id: "promoter-self",
      name: (dbUser?.name || promoterEmail.split('@')[0]) + " (Mi Cuenta)",
      initials: (dbUser?.name ? dbUser.name.substring(0, 2) : "PR").toUpperCase(),
      email: promoterSelfEmail,
      status: promoterRemainingDays > 0 ? "active" : "inactive",
      studyTime: 0,
      remainingDays: promoterRemainingDays,
      attempts: [],
      timesPerModule: {},
      moduleScores: {},
      studyProgress: {}
    }

    return NextResponse.json({
      promoter: {
        name: dbUser?.name || promoterEmail.split('@')[0],
        email: promoterEmail,
        agency: dbUser?.agency?.name || "Mi Promotoría",
        planLimit,
        tokens,
        nextReplenish: nextReplenishDate.toISOString().split('T')[0],
        lastReplenish: lastReplenishDate.toISOString().split('T')[0]
      },
      agents: agentsList,
      promoterSelfAccount
    })

  } catch (err: any) {
    console.error("Error in GET cedula-b promoter-data:", err)
    return NextResponse.json({ error: "Database error", details: err.message }, { status: 500 })
  }
}
