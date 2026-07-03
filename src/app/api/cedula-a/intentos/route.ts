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
      if (targetEmail) {
        const rows = await prisma.examenIntento.findMany({
          where: { email: targetEmail.toLowerCase() },
          orderBy: { fecha: 'desc' }
        })
        return NextResponse.json(rows)
      } else {
        const rows = await prisma.examenIntento.findMany({
          orderBy: { fecha: 'desc' }
        })
        return NextResponse.json(rows)
      }
    } else {
      const rows = await prisma.examenIntento.findMany({
        where: { email: currentUserEmail.toLowerCase() },
        orderBy: { fecha: 'desc' }
      })
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

    const intento = await prisma.examenIntento.create({
      data: {
        email: currentUserEmail.toLowerCase(),
        calificacion,
        aprobado,
        respuestas_correctas,
        total_preguntas,
        detalles_modulos: detalles_modulos || {}
      }
    })

    return NextResponse.json({ success: true, attempt: { id: intento.id, fecha: intento.fecha } })
  } catch (err: any) {
    console.error("Error in POST intentos:", err)
    return NextResponse.json({ error: "Database error", details: err.message }, { status: 500 })
  }
}
