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
    const filterEmail = targetEmail && isPromoter(currentUserEmail, session.user.role) 
      ? targetEmail.toLowerCase() 
      : (!isPromoter(currentUserEmail, session.user.role) ? currentUserEmail.toLowerCase() : undefined);

    const rows = await prisma.examenIntento.findMany({
      where: filterEmail ? { email: filterEmail } : undefined,
      orderBy: { fecha: 'desc' }
    });

    // Filtrar intentos que corresponden a Cédula B
    const cedulaBRows = rows.filter((r: any) => {
      const details = r.detalles_modulos as any;
      return details && details._cedula === 'B';
    });

    return NextResponse.json(cedulaBRows)
  } catch (err: any) {
    console.error("Error in GET cedula-b intentos:", err)
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

    const payloadDetalles = {
      ...(detalles_modulos || {}),
      _cedula: 'B'
    };

    const newIntento = await prisma.examenIntento.create({
      data: {
        email: currentUserEmail.toLowerCase(),
        calificacion,
        aprobado,
        respuestas_correctas,
        total_preguntas,
        detalles_modulos: payloadDetalles
      }
    })

    return NextResponse.json({ success: true, intento: newIntento })
  } catch (err: any) {
    console.error("Error in POST cedula-b intentos:", err)
    return NextResponse.json({ error: "Database error", details: err.message }, { status: 500 })
  }
}
