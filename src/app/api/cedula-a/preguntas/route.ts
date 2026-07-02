import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const rows = await prisma.$queryRawUnsafe<any[]>(
      "SELECT id, number, module, question, options, correct, has_error FROM preguntas ORDER BY id ASC"
    )
    return NextResponse.json(rows)
  } catch (err: any) {
    console.error("Error fetching questions from Neon DB:", err)
    return NextResponse.json({ error: "Database error", details: err.message }, { status: 500 })
  }
}
