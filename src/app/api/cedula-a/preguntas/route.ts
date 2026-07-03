import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import fs from "fs"
import path from "path"


export async function GET(req: NextRequest) {
  const session = await auth()
  
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const isReseed = searchParams.get("reseed") === "true"

  try {
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
        await prisma.pregunta.createMany({
          data: batch.map((q: any) => ({
            number: q.number,
            module: q.module,
            question: q.question,
            options: q.options,
            correct: q.correct,
            has_error: q.has_error || false
          }))
        });
      }
      
      console.log("Forced re-seed completed successfully.")
      return NextResponse.json({ success: true, message: `Successfully re-seeded ${questionsData.length} questions.` })
    }

    const rows = await prisma.pregunta.findMany({
      orderBy: { id: 'asc' }
    });
    return NextResponse.json(rows)
  } catch (err: any) {
    console.error("Error in GET preguntas:", err)
    return NextResponse.json({ error: "Database error", details: err.message }, { status: 500 })
  }
}
