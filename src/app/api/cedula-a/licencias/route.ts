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

  try {
    if (isPromoter(currentUserEmail, session.user.role)) {
      // Get promoter balance
      // Usar el ID de la agencia para compartir saldo entre todos los admins de la agencia
      const email = session.user.agencyId ? `agency_${session.user.agencyId}` : currentUserEmail.toLowerCase();
      let promoterBalance = 7; // Default initial tokens
      const saldo = await prisma.promotorSaldo.findUnique({
        where: { promotor_email: email }
      });
      
      if (saldo) {
        promoterBalance = saldo.dias_disponibles || 0;
      } else {
        // Initialize balance
        await prisma.promotorSaldo.create({
          data: { promotor_email: email, dias_disponibles: 7 }
        });
      }

      // Get assigned licenses list
      const licensesRows = await prisma.estudioLicencia.findMany({
        where: { promotor_email: email },
        select: { agente_email: true, dias_asignados: true, fecha_asignacion: true, fecha_expiracion: true }
      });

      return NextResponse.json({
        role: "promoter",
        tokens: promoterBalance,
        licenses: licensesRows
      })
    } else {
      // Get agent license details
      const agentRows = await prisma.estudioLicencia.findMany({
        where: { agente_email: currentUserEmail.toLowerCase() },
        select: { dias_asignados: true, fecha_expiracion: true }
      });
      
      const license = agentRows[0] || { dias_asignados: 0, fecha_expiracion: null }
      
      // Calculate remaining days
      let remainingDays = 0
      if (license.fecha_expiracion) {
        const exp = new Date(license.fecha_expiracion).getTime()
        const now = new Date().getTime()
        if (exp > now) {
          remainingDays = Math.ceil((exp - now) / (1000 * 60 * 60 * 24))
        }
      }

      return NextResponse.json({
        role: "agent",
        dias_asignados: license.dias_asignados,
        remainingDays,
        fecha_expiracion: license.fecha_expiracion
      })
    }
  } catch (err: any) {
    console.error("Error in GET licencias:", err)
    return NextResponse.json({ error: "Database error", details: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  
  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const currentUserEmail = session.user.email
  
  if (!isPromoter(currentUserEmail, session.user.role)) {
    return NextResponse.json({ error: "No tienes permisos de promotor" }, { status: 403 })
  }

  const email = session.user.agencyId ? `agency_${session.user.agencyId}` : currentUserEmail.toLowerCase()

  try {
    const { action, agentEmail, days } = await req.json()

    if (action === "buy") {
      const buyDays = days || 7
      // Increment promoter tokens
      const result = await prisma.promotorSaldo.upsert({
        where: { promotor_email: email },
        update: { dias_disponibles: { increment: buyDays } },
        create: { promotor_email: email, dias_disponibles: buyDays }
      });
      return NextResponse.json({ success: true, tokens: result.dias_disponibles })
    }

    if (action === "assign") {
      if (!agentEmail || !days) {
        return NextResponse.json({ error: "Missing agentEmail or days to assign" }, { status: 400 })
      }

      const targetAgentEmail = agentEmail.toLowerCase();

      // Check promoter balance
      const saldo = await prisma.promotorSaldo.findUnique({
        where: { promotor_email: email }
      });
      const currentBalance = saldo?.dias_disponibles || 0

      if (currentBalance < days) {
        return NextResponse.json({ error: "Insufficient days in balance" }, { status: 400 })
      }

      await prisma.$transaction(async (tx) => {
        // Decrease balance
        await tx.promotorSaldo.update({
          where: { promotor_email: email },
          data: { dias_disponibles: { decrement: days } }
        });

        // Get existing license to calculate new expiration date
        const existingLic = await tx.estudioLicencia.findUnique({
          where: {
            promotor_email_agente_email: { promotor_email: email, agente_email: targetAgentEmail }
          }
        });

        let newExpDate = new Date();
        if (existingLic && existingLic.fecha_expiracion && existingLic.fecha_expiracion.getTime() > newExpDate.getTime()) {
          newExpDate = new Date(existingLic.fecha_expiracion.getTime());
        }
        newExpDate.setDate(newExpDate.getDate() + days);

        await tx.estudioLicencia.upsert({
          where: {
            promotor_email_agente_email: { promotor_email: email, agente_email: targetAgentEmail }
          },
          update: {
            dias_asignados: { increment: days },
            fecha_expiracion: newExpDate
          },
          create: {
            promotor_email: email,
            agente_email: targetAgentEmail,
            dias_asignados: days,
            fecha_expiracion: newExpDate
          }
        });
      });

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (err: any) {
    console.error("Error in POST licencias:", err)
    return NextResponse.json({ error: "Database error", details: err.message }, { status: 500 })
  }
}
