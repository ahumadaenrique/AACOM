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

    // Self-healing check: Ensure pregunta_actual column is added
    try {
      await prisma.$executeRawUnsafe("ALTER TABLE estudio_progreso ADD COLUMN IF NOT EXISTS pregunta_actual INT DEFAULT 0;")
    } catch (alterErr) {
      console.log("Column check/add failed or already exists:", alterErr)
    }

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
        `SELECT email, module, tiempo_segundos, pregunta_actual FROM estudio_progreso WHERE email IN (${placeholders})`,
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
          progressIndexMap[email] = {
            "Aspectos Generales": 0,
            "Regulación CNSF": 0,
            "Vida Individual": 0,
            "Accidentes y Enfermedades": 0,
            "Seguros de Daños": 0,
            "Sistema y Mercados Financieros": 0
          };
        }
        progressMap[email][row.module] = row.tiempo_segundos / 60; // convert to minutes
        progressIndexMap[email][row.module] = row.pregunta_actual || 0;
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
        moduleScores,
        studyProgress
      });
    }

    // Add promoter's own study account if they study
    let promoterSelfAgent = agentsList.find(a => a.email === promoterEmail.toLowerCase());
    if (!promoterSelfAgent) {
      const promoterProgressRows = await prisma.$queryRawUnsafe<any[]>(
        "SELECT module, tiempo_segundos, pregunta_actual FROM estudio_progreso WHERE email = $1",
        promoterEmail.toLowerCase()
      );
      
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
          promoterTimesPerModule[row.module] = row.tiempo_segundos / 60;
          promoterStudyProgress[row.module] = row.pregunta_actual || 0;
        }
      });

      let promoterStudyTime = 0;
      Object.values(promoterTimesPerModule).forEach(v => {
        promoterStudyTime += v;
      });

      // Load promoter's own attempts
      const promoterAttemptsRows = await prisma.$queryRawUnsafe<any[]>(
        "SELECT calificacion, aprobado, fecha, detalles_modulos FROM examen_intentos WHERE email = $1 ORDER BY fecha ASC",
        promoterEmail.toLowerCase()
      );
      
      const promoterAttempts = promoterAttemptsRows.map(row => ({
        date: new Date(row.fecha).toISOString().split('T')[0],
        score: parseFloat(row.calificacion),
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
        const latestDetails = promoterAttemptsRows[promoterAttemptsRows.length - 1].detalles_modulos;
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
