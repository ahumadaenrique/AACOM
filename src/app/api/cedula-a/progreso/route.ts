import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

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
        const rows = await prisma.estudioProgreso.findMany({
          where: { email: targetEmail.toLowerCase() },
          select: { module: true, tiempo_segundos: true, pregunta_actual: true }
        })
        return NextResponse.json(rows)
      } else {
        // Return progress for all agents
        const rows = await prisma.estudioProgreso.findMany({
          select: { email: true, module: true, tiempo_segundos: true, pregunta_actual: true }
        })
        return NextResponse.json(rows)
      }
    } else {
      // Agent can only read their own progress
      const rows = await prisma.estudioProgreso.findMany({
        where: { email: currentUserEmail.toLowerCase() },
        select: { module: true, tiempo_segundos: true, pregunta_actual: true }
      })
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
    const { module, tiempo_segundos, pregunta_actual } = await req.json()

    if (!module || tiempo_segundos === undefined) {
      return NextResponse.json({ error: "Missing module or tiempo_segundos" }, { status: 400 })
    }

    // Upsert progress for the user including pregunta_actual
    const email = currentUserEmail.toLowerCase()
    await prisma.estudioProgreso.upsert({
      where: {
        email_module: { email, module }
      },
      update: {
        tiempo_segundos,
        pregunta_actual: pregunta_actual || 0,
        fecha_actualizacion: new Date()
      },
      create: {
        email,
        module,
        tiempo_segundos,
        pregunta_actual: pregunta_actual || 0
      }
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("Error in POST progreso:", err)
    return NextResponse.json({ error: "Database error", details: err.message }, { status: 500 })
  }
}
