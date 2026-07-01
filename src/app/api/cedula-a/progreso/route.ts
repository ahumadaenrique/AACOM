import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { pool } from "@/lib/db"

// Helper to check if email belongs to promoter
function isPromoter(email: string, role?: string) {
  const lowerEmail = email.toLowerCase();
  return lowerEmail.includes("promotor") || role === "ADMIN" || role === "SUPER_ADMIN" || role === "PROMOTER" || role === "PROMOTOR";
}

export async function GET(req: NextRequest) {
  const session = await auth()
  
  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const currentUserEmail = session.user.email
  const { searchParams } = new URL(req.url)
  const targetEmail = searchParams.get("email")

  try {
    if (isPromoter(currentUserEmail, session.user.role)) {
      // Promoter can read any agent's progress
      if (targetEmail) {
        const { rows } = await pool.query(
          "SELECT module, tiempo_segundos FROM estudio_progreso WHERE email = $1",
          [targetEmail.toLowerCase()]
        )
        return NextResponse.json(rows)
      } else {
        // Return progress for all agents
        const { rows } = await pool.query(
          "SELECT email, module, tiempo_segundos FROM estudio_progreso"
        )
        return NextResponse.json(rows)
      }
    } else {
      // Agent can only read their own progress
      const { rows } = await pool.query(
        "SELECT module, tiempo_segundos FROM estudio_progreso WHERE email = $1",
        [currentUserEmail.toLowerCase()]
      )
      return NextResponse.json(rows)
    }
  } catch (err: any) {
    console.error("Error in GET progreso:", err)
    return NextResponse.json({ error: "Database error", details: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  
  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const currentUserEmail = session.user.email

  try {
    const { module, tiempo_segundos } = await req.json()

    if (!module || tiempo_segundos === undefined) {
      return NextResponse.json({ error: "Missing module or tiempo_segundos" }, { status: 400 })
    }

    // Upsert progress for the user
    await pool.query(
      `INSERT INTO estudio_progreso (email, module, tiempo_segundos) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (email, module) 
       DO UPDATE SET tiempo_segundos = EXCLUDED.tiempo_segundos, fecha_actualizacion = CURRENT_TIMESTAMP`,
      [currentUserEmail.toLowerCase(), module, tiempo_segundos]
    )

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("Error in POST progreso:", err)
    return NextResponse.json({ error: "Database error", details: err.message }, { status: 500 })
  }
}
