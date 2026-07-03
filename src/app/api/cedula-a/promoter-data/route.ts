import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import fs from "fs"
import path from "path"

function isPromoter(email: string, role?: string) {
  const lowerEmail = email.toLowerCase();
  return lowerEmail.includes("promotor") || role === "ADMIN" || role === "SUPER_ADMIN" || role === "PROMOTER" || role === "PROMOTOR";
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
    // 1. Get promoter balance
    let tokens = 7;
    const promotorEmailLow = promoterEmail.toLowerCase();
    const saldo = await prisma.promotorSaldo.findUnique({
      where: { promotor_email: promotorEmailLow }
    });
    if (saldo) {
      tokens = saldo.dias_disponibles || 0;
    } else {
      // Initialize welcome balance in database
      await prisma.promotorSaldo.create({
        data: { promotor_email: promotorEmailLow, dias_disponibles: 7 }
      });
    }

    // 2. Load promoter's agency details
    const dbUser = await prisma.user.findUnique({
      where: { email: promoterEmail.toLowerCase() }
    })
    
    const agencyId = dbUser?.agencyId
    
    // Find all real agents/users belonging to this agency (including admins/promoters except current promoter)
    let dbAgents: Array<{ email: string; name: string | null }> = []
    if (agencyId) {
      dbAgents = await prisma.user.findMany({
        where: {
          agencyId
        },
        select: {
          email: true,
          name: true
        }
      })
    } else if (dbUser?.role === 'SUPER_ADMIN') {
      // Super admin sees all users in the platform
      dbAgents = await prisma.user.findMany({
        select: {
          email: true,
          name: true
        }
      })
    }

    // Filter out the current promoter themselves to avoid duplication
    dbAgents = dbAgents.filter(a => a.email.toLowerCase() !== promoterEmail.toLowerCase())

    const emails = dbAgents.map(a => a.email.toLowerCase());
    
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

      // Bulk 2: Progress
      const progressRows = await prisma.estudioProgreso.findMany({
        where: { email: { in: emails } },
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
        progressMap[email][row.module] = (row.tiempo_segundos || 0) / 60; // convert to minutes
        progressIndexMap[email][row.module] = row.pregunta_actual || 0;
      });

      // Bulk 3: Attempts
      const attemptsRows = await prisma.examenIntento.findMany({
        where: { email: { in: emails } },
        orderBy: { fecha: 'asc' },
        select: { email: true, calificacion: true, aprobado: true, fecha: true, detalles_modulos: true }
      });
      attemptsRows.forEach(row => {
        const email = row.email.toLowerCase();
        if (!attemptsMap[email]) {
          attemptsMap[email] = [];
        }
        attemptsMap[email].push({
          date: row.fecha ? new Date(row.fecha).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          score: Number(row.calificacion),
          passed: row.aprobado,
          details: row.detalles_modulos
        });
        // Last processed item is the latest attempt
        latestAttemptMap[email] = row.detalles_modulos;
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
          if (modData && modData.total > 0) {
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

    // Add promoter's own study account if they study
    let promoterSelfAgent = agentsList.find(a => a.email === promoterEmail.toLowerCase());
    if (!promoterSelfAgent) {
      const promoterProgressRows = await prisma.estudioProgreso.findMany({
        where: { email: promoterEmail.toLowerCase() },
        select: { module: true, tiempo_segundos: true, pregunta_actual: true }
      });
      
      const promoterTimesPerModule: Record<string, number> = {
        "Aspectos Generales": 0,
        "Regulación CNSF": 0,
        "Vida Individual": 0,
        "Accidentes y Enfermedades": 0,
        "Seguros de Daños": 0,
        "Sistema y Mercados Financieros": 0
      };
      
      const promoterStudyProgress: Record<string, number> = {
        "Aspectos Generales": 0,
        "Regulación CNSF": 0,
        "Vida Individual": 0,
        "Accidentes y Enfermedades": 0,
        "Seguros de Daños": 0,
        "Sistema y Mercados Financieros": 0
      };
      
      promoterProgressRows.forEach(row => {
        if (promoterTimesPerModule[row.module] !== undefined) {
          promoterTimesPerModule[row.module] = (row.tiempo_segundos || 0) / 60;
          promoterStudyProgress[row.module] = row.pregunta_actual || 0;
        }
      });

      let promoterStudyTime = 0;
      Object.values(promoterTimesPerModule).forEach(v => {
        promoterStudyTime += v;
      });

      // Load promoter's own attempts
      const promoterAttemptsRows = await prisma.examenIntento.findMany({
        where: { email: promoterEmail.toLowerCase() },
        orderBy: { fecha: 'asc' },
        select: { calificacion: true, aprobado: true, fecha: true, detalles_modulos: true }
      });
      
      const promoterAttempts = promoterAttemptsRows.map(row => ({
        date: row.fecha ? new Date(row.fecha).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        score: Number(row.calificacion),
        passed: row.aprobado,
        details: row.detalles_modulos
      }));

      // Calculate promoter's own module scores based on latest attempt
      const promoterModuleScores: Record<string, number> = {
        "Aspectos Generales": 0,
        "Regulación CNSF": 0,
        "Vida Individual": 0,
        "Accidentes y Enfermedades": 0,
        "Seguros de Daños": 0,
        "Sistema y Mercados Financieros": 0
      };
      
      if (promoterAttemptsRows.length > 0) {
        const latestDetails = promoterAttemptsRows[promoterAttemptsRows.length - 1].detalles_modulos as Record<string, any>;
        if (latestDetails) {
          Object.keys(latestDetails).forEach(mod => {
            const modData = latestDetails[mod];
            if (modData && modData.total > 0) {
              promoterModuleScores[mod] = Math.round((modData.correct / modData.total) * 100);
            }
          });
        }
      }

      agentsList.push({
        id: 99, // promoter self-study ID matches existing switchRole expectations
        name: "Tú (Cuenta de Estudio)",
        initials: "PR",
        email: promoterEmail.toLowerCase(),
        status: "active",
        studyTime: promoterStudyTime,
        remainingDays: 999, // promoter has permanent access
        attempts: promoterAttempts,
        timesPerModule: promoterTimesPerModule,
        moduleScores: promoterModuleScores,
        studyProgress: promoterStudyProgress
      });
    }

    return NextResponse.json({
      tokens,
      totalGiftedThisQuarter: 7, // mock
      agents: agentsList
    });

  } catch (err: any) {
    console.error("Error in GET promoter-data:", err)
    return NextResponse.json({ error: "Database error", details: err.message }, { status: 500 })
  }
}
