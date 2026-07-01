import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { pool } from "@/lib/db"

function isPromoter(email: string) {
  return email.toLowerCase().includes("promotor");
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
    if (isPromoter(currentUserEmail)) {
      if (targetEmail) {
        const { rows } = await pool.query(
          "SELECT id, calificacion, aprobado, respuestas_correctas, total_preguntas, detalles_modulos, fecha FROM examen_intentos WHERE email = $1 ORDER BY fecha DESC",
          [targetEmail.toLowerCase()]
        )
        return NextResponse.json(rows)
      } else {
        const { rows } = await pool.query(
          "SELECT id, email, calificacion, aprobado, respuestas_correctas, total_preguntas, detalles_modulos, fecha FROM examen_intentos ORDER BY fecha DESC"
        )
        return NextResponse.json(rows)
      }
    } else {
      const { rows } = await pool.query(
        "SELECT id, calificacion, aprobado, respuestas_correctas, total_preguntas, detalles_modulos, fecha FROM examen_intentos WHERE email = $1 ORDER BY fecha DESC",
        [currentUserEmail.toLowerCase()]
      )
      return NextResponse.json(rows)
    }
  } catch (err: any) {
    console.error("Error in GET intentos:", err)
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
    const { calificacion, aprobado, respuestas_correctas, total_preguntas, detalles_modulos } = await req.json()

    if (calificacion === undefined || aprobado === undefined || respuestas_correctas === undefined || total_preguntas === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const { rows } = await pool.query(
      `INSERT INTO examen_intentos (email, calificacion, aprobado, respuestas_correctas, total_preguntas, detalles_modulos) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id, fecha`,
      [currentUserEmail.toLowerCase(), calificacion, aprobado, respuestas_correctas, total_preguntas, JSON.stringify(detalles_modulos || {})]
    )

    return NextResponse.json({ success: true, attempt: rows[0] })
  } catch (err: any) {
    console.error("Error in POST intentos:", err)
    return NextResponse.json({ error: "Database error", details: err.message }, { status: 500 })
  }
}
