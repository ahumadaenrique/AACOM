import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

function isPromoter(email: string, role?: string) {
  const lowerEmail = email.toLowerCase();
  return lowerEmail.includes("promotor") || role === "ADMIN" || role === "SUPER_ADMIN" || role === "PROMOTER" || role === "PROMOTOR";
}

const PREFIX = "b:";

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
        const rows = await prisma.estudioProgreso.findMany({
          where: { 
            email: targetEmail.toLowerCase(),
            module: { startsWith: PREFIX }
          },
          select: { module: true, tiempo_segundos: true, pregunta_actual: true }
        })
        return NextResponse.json(rows.map(r => ({ ...r, module: r.module.replace(PREFIX, '') })))
      } else {
        const rows = await prisma.estudioProgreso.findMany({
          where: { module: { startsWith: PREFIX } },
          select: { email: true, module: true, tiempo_segundos: true, pregunta_actual: true }
        })
        return NextResponse.json(rows.map(r => ({ ...r, module: r.module.replace(PREFIX, '') })))
      }
    } else {
      const rows = await prisma.estudioProgreso.findMany({
        where: { 
          email: currentUserEmail.toLowerCase(),
          module: { startsWith: PREFIX }
        },
        select: { module: true, tiempo_segundos: true, pregunta_actual: true }
      })
      return NextResponse.json(rows.map(r => ({ ...r, module: r.module.replace(PREFIX, '') })))
    }
  } catch (err: any) {
    console.error("Error in GET cedula-b progreso:", err)
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

    if (!module) {
      return NextResponse.json({ error: "Module name required" }, { status: 400 })
    }

    const email = currentUserEmail.toLowerCase()
    const moduleKey = `${PREFIX}${module}`

    const updated = await prisma.estudioProgreso.upsert({
      where: {
        email_module: {
          email,
          module: moduleKey
        }
      },
      update: {
        tiempo_segundos: tiempo_segundos !== undefined ? { increment: tiempo_segundos } : undefined,
        pregunta_actual: pregunta_actual !== undefined ? pregunta_actual : undefined,
        fecha_actualizacion: new Date()
      },
      create: {
        email,
        module: moduleKey,
        tiempo_segundos: tiempo_segundos || 0,
        pregunta_actual: pregunta_actual || 0,
        fecha_actualizacion: new Date()
      }
    })

    return NextResponse.json({ success: true, progress: updated })
  } catch (err: any) {
    console.error("Error in POST cedula-b progreso:", err)
    return NextResponse.json({ error: "Database error", details: err.message }, { status: 500 })
  }
}
