import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import fs from "fs"
import path from "path"

function isPromoter(email: string, role?: string) {
  const lowerEmail = email.toLowerCase();
  return lowerEmail.includes("promotor") || role === "ADMIN" || role === "SUPER_ADMIN" || role === "PROMOTER" || role === "PROMOTOR";
}

async function ensureTablesExist() {
  try {
    // Check if tables already exist
    await prisma.$queryRawUnsafe("SELECT 1 FROM promotor_saldos LIMIT 1")
  } catch (e) {
    console.log("Simulator tables not found. Initializing database schema...")
    
    // 1. Create promotor_saldos
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS promotor_saldos (
          promotor_email VARCHAR(255) PRIMARY KEY,
          dias_disponibles INT DEFAULT 7,
          fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `)

    // 2. Create estudio_licencias
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS estudio_licencias (
          id SERIAL PRIMARY KEY,
          promotor_email VARCHAR(255) NOT NULL,
          agente_email VARCHAR(255) NOT NULL,
          dias_asignados INT DEFAULT 0,
          fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          fecha_expiracion TIMESTAMP,
          UNIQUE(promotor_email, agente_email)
      );
    `)

    // 3. Create estudio_progreso
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS estudio_progreso (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) NOT NULL,
          module VARCHAR(100) NOT NULL,
          tiempo_segundos INT DEFAULT 0,
          fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(email, module)
      );
    `)

    // 4. Create examen_intentos
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS examen_intentos (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) NOT NULL,
          calificacion NUMERIC(5, 2) NOT NULL,
          aprobado BOOLEAN NOT NULL,
          respuestas_correctas INT NOT NULL,
          total_preguntas INT NOT NULL,
          detalles_modulos JSONB,
          fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `)

    // 5. Create preguntas
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS preguntas (
          id SERIAL PRIMARY KEY,
          number INT NOT NULL,
          module VARCHAR(100) NOT NULL,
          question TEXT NOT NULL,
          options JSONB NOT NULL,
          correct INT NOT NULL,
          has_error BOOLEAN DEFAULT FALSE
      );
    `)

    console.log("Simulator tables initialized successfully.")

    // Seed questions from preguntas.json if empty
    try {
      const questionsCount = await prisma.$queryRawUnsafe<any[]>("SELECT COUNT(*) FROM preguntas")
      const count = parseInt(questionsCount[0]?.count || "0")
      if (count === 0) {
        const jsonPath = path.join(process.cwd(), 'public', 'cedula-a', 'preguntas.json')
        if (fs.existsSync(jsonPath)) {
          const questionsData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))
          console.log(`Seeding ${questionsData.length} questions into questions database...`)
          // Batch seed in chunks of 50
          for (let i = 0; i < questionsData.length; i += 50) {
            const batch = questionsData.slice(i, i + 50)
            for (const q of batch) {
              await prisma.$executeRawUnsafe(
                "INSERT INTO preguntas (number, module, question, options, correct, has_error) VALUES ($1, $2, $3, $4::jsonb, $5, $6)",
                q.number, q.module, q.question, JSON.stringify(q.options), q.correct, q.has_error || false
              )
            }
          }
          console.log("Questions database successfully seeded.")
        } else {
          console.warn("preguntas.json file not found, skipping questions seeding.")
        }
      }
    } catch (seedErr) {
      console.error("Error seeding questions:", seedErr)
    }
  }
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
    // Ensure all tables exist before querying them
    await ensureTablesExist()

    // 1. Get promoter balance
    let tokens = 7;
    const balanceRows = await prisma.$queryRawUnsafe<any[]>(
      "SELECT dias_disponibles FROM promotor_saldos WHERE promotor_email = $1",
      promoterEmail.toLowerCase()
    )
    if (balanceRows.length > 0) {
      tokens = balanceRows[0].dias_disponibles
    } else {
      // Initialize welcome balance in database
      await prisma.$queryRawUnsafe(
        "INSERT INTO promotor_saldos (promotor_email, dias_disponibles) VALUES ($1, $2)",
        promoterEmail.toLowerCase(),
        7
      )
    }

    // 2. Load promoter's agency details
    const dbUser = await prisma.user.findUnique({
      where: { email: promoterEmail.toLowerCase() }
    })
    
    const agencyId = dbUser?.agencyId
    
    // Find all real agents belonging to this agency
    let dbAgents: Array<{ email: string; name: string | null }> = []
    if (agencyId) {
      dbAgents = await prisma.user.findMany({
        where: {
          agencyId,
          role: "AGENTE"
        },
        select: {
          email: true,
          name: true
        }
      })
    } else if (dbUser?.role === 'SUPER_ADMIN') {
      // Super admin sees all agents in the platform
      dbAgents = await prisma.user.findMany({
        where: { role: "AGENTE" },
        select: {
          email: true,
          name: true
        }
      })
    }

    const emails = dbAgents.map(a => a.email.toLowerCase());
    
    // Pre-load data in bulk to avoid N+1 serverless timeouts
    const licensesMap: Record<string, any> = {};
    const progressMap: Record<string, Record<string, number>> = {};
    const attemptsMap: Record<string, any[]> = {};
    const latestAttemptMap: Record<string, any> = {};

    if (emails.length > 0) {
      const placeholders = emails.map((_, i) => `$${i + 1}`).join(", ");

      // Bulk 1: Licenses
      const licensesRows = await prisma.$queryRawUnsafe<any[]>(
        `SELECT agente_email, dias_asignados, fecha_expiracion FROM estudio_licencias WHERE agente_email IN (${placeholders})`,
        ...emails
      );
      licensesRows.forEach(row => {
        licensesMap[row.agente_email.toLowerCase()] = row;
      });

      // Bulk 2: Progress
      const progressRows = await prisma.$queryRawUnsafe<any[]>(
        `SELECT email, module, tiempo_segundos FROM estudio_progreso WHERE email IN (${placeholders})`,
        ...emails
      );
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
        }
        progressMap[email][row.module] = row.tiempo_segundos / 60; // convert to minutes
      });

      // Bulk 3: Attempts
      const attemptsRows = await prisma.$queryRawUnsafe<any[]>(
        `SELECT email, calificacion, aprobado, fecha, detalles_modulos FROM examen_intentos WHERE email IN (${placeholders}) ORDER BY fecha ASC`,
        ...emails
      );
      attemptsRows.forEach(row => {
        const email = row.email.toLowerCase();
        if (!attemptsMap[email]) {
          attemptsMap[email] = [];
        }
        attemptsMap[email].push({
          date: new Date(row.fecha).toISOString().split('T')[0],
          score: parseFloat(row.calificacion),
          passed: row.aprobado
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

      const latestDetails = latestAttemptMap[email];
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
        moduleScores
      });
    }

    // Add promoter's own study account if they study
    let promoterSelfAgent = agentsList.find(a => a.email === promoterEmail.toLowerCase());
    if (!promoterSelfAgent) {
      agentsList.push({
        id: 99, // promoter self-study ID matches existing switchRole expectations
        name: "Tú (Cuenta de Estudio)",
        initials: "PR",
        email: promoterEmail.toLowerCase(),
        status: "active",
        studyTime: 0,
        remainingDays: 999, // promoter has permanent access
        attempts: [],
        timesPerModule: {
          "Aspectos Generales": 0,
          "Regulación CNSF": 0,
          "Vida Individual": 0,
          "Accidentes y Enfermedades": 0,
          "Seguros de Daños": 0,
          "Sistema y Mercados Financieros": 0
        },
        moduleScores: {
          "Aspectos Generales": 0,
          "Regulación CNSF": 0,
          "Vida Individual": 0,
          "Accidentes y Enfermedades": 0,
          "Seguros de Daños": 0,
          "Sistema y Mercados Financieros": 0
        }
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
