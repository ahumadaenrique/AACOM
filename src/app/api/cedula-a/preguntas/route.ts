import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { pool } from "@/lib/db"

export async function GET() {
  const session = await auth()
  
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { rows } = await pool.query(
      "SELECT id, number, module, question, options, correct, has_error FROM preguntas ORDER BY id ASC"
    )
    return NextResponse.json(rows)
  } catch (err: any) {
    console.error("Error fetching questions from Neon DB:", err)
    return NextResponse.json({ error: "Database error", details: err.message }, { status: 500 })
  }
}
