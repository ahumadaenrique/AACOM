import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import fs from "fs"
import path from "path"

async function ensureTablesExist() {
  try {
    // Check if tables already exist
    await prisma.$queryRawUnsafe("SELECT 1 FROM preguntas LIMIT 1")
  } catch (e) {
    console.log("preguntas table not found. Initializing database schema...")
    
    // Create all 5 tables
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS promotor_saldos (
          promotor_email VARCHAR(255) PRIMARY KEY,
          dias_disponibles INT DEFAULT 7,
          fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `)

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
      }
    } catch (seedErr) {
      console.error("Error seeding questions:", seedErr)
    }
  }
}

export async function GET(req: NextRequest) {
  const session = await auth()
  
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const isReseed = searchParams.get("reseed") === "true"

  try {
    // Ensure all tables exist before querying them
    await ensureTablesExist()

    if (isReseed) {
      console.log("Forced re-seed triggered via API query parameter.")
      
      // 1. Truncate table
      await prisma.$executeRawUnsafe("TRUNCATE TABLE preguntas RESTART IDENTITY CASCADE;")
      
      // 2. Read updated preguntas.json
      const jsonPath = path.join(process.cwd(), 'public', 'cedula-a', 'preguntas.json')
      if (!fs.existsSync(jsonPath)) {
        return NextResponse.json({ error: "preguntas.json file not found" }, { status: 404 })
      }
      
      const questionsData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))
      console.log(`Re-seeding ${questionsData.length} questions into preguntas table...`)
      
      // 3. Batch seed in chunks of 50
      for (let i = 0; i < questionsData.length; i += 50) {
        const batch = questionsData.slice(i, i + 50)
        await prisma.$transaction(
          batch.map((q: any) => prisma.$executeRawUnsafe(
            "INSERT INTO preguntas (number, module, question, options, correct, has_error) VALUES ($1, $2, $3, $4::jsonb, $5, $6)",
            q.number, q.module, q.question, JSON.stringify(q.options), q.correct, q.has_error || false
          ))
        )
      }
      
      console.log("Forced re-seed completed successfully.")
      return NextResponse.json({ success: true, message: `Successfully re-seeded ${questionsData.length} questions.` })
    }

    const rows = await prisma.$queryRawUnsafe<any[]>(
      "SELECT id, number, module, question, options, correct, has_error FROM preguntas ORDER BY id ASC"
    )
    return NextResponse.json(rows)
  } catch (err: any) {
    console.error("Error in GET preguntas:", err)
    return NextResponse.json({ error: "Database error", details: err.message }, { status: 500 })
  }
}
