import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { pool } from "@/lib/db"

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
      let promoterBalance = 7; // Default initial tokens
      const balanceRes = await pool.query(
        "SELECT dias_disponibles FROM promotor_saldos WHERE promotor_email = $1",
        [currentUserEmail.toLowerCase()]
      )
      if (balanceRes.rows.length > 0) {
        promoterBalance = balanceRes.rows[0].dias_disponibles
      } else {
        // Initialize balance
        await pool.query(
          "INSERT INTO promotor_saldos (promotor_email, dias_disponibles) VALUES ($1, $2)",
          [currentUserEmail.toLowerCase(), 7]
        )
      }

      // Get assigned licenses list
      const licensesRes = await pool.query(
        "SELECT agente_email, dias_asignados, fecha_asignacion, fecha_expiracion FROM estudio_licencias WHERE promotor_email = $1",
        [currentUserEmail.toLowerCase()]
      )

      return NextResponse.json({
        role: "promoter",
        tokens: promoterBalance,
        licenses: licensesRes.rows
      })
    } else {
      // Get agent license details
      const agentRes = await pool.query(
        "SELECT dias_asignados, fecha_expiracion FROM estudio_licencias WHERE agente_email = $1",
        [currentUserEmail.toLowerCase()]
      )
      
      const license = agentRes.rows[0] || { dias_asignados: 0, fecha_expiracion: null }
      
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
    return NextResponse.json({ error: "Only promoters can purchase or assign licenses" }, { status: 403 })
  }

  try {
    const { action, agentEmail, days } = await req.json()

    if (action === "buy") {
      const buyDays = days || 7
      // Increment promoter tokens
      const { rows } = await pool.query(
        `INSERT INTO promotor_saldos (promotor_email, dias_disponibles) 
         VALUES ($1, $2) 
         ON CONFLICT (promotor_email) 
         DO UPDATE SET dias_disponibles = promotor_saldos.dias_disponibles + EXCLUDED.dias_disponibles 
         RETURNING dias_disponibles`,
        [currentUserEmail.toLowerCase(), buyDays]
      )
      return NextResponse.json({ success: true, tokens: rows[0].dias_disponibles })
    }

    if (action === "assign") {
      if (!agentEmail || !days) {
        return NextResponse.json({ error: "Missing agentEmail or days to assign" }, { status: 400 })
      }

      // Check promoter balance
      const balanceRes = await pool.query(
        "SELECT dias_disponibles FROM promotor_saldos WHERE promotor_email = $1",
        [currentUserEmail.toLowerCase()]
      )
      const currentBalance = balanceRes.rows[0]?.dias_disponibles || 0

      if (currentBalance < days) {
        return NextResponse.json({ error: "Insufficient days in balance" }, { status: 400 })
      }

      // Calculate expiration date
      const expDate = new Date()
      expDate.setDate(expDate.getDate() + days)

      // Start Transaction
      const client = await pool.connect()
      try {
        await client.query("BEGIN")

        // 1. Deduct from promoter
        await client.query(
          "UPDATE promotor_saldos SET dias_disponibles = dias_disponibles - $1 WHERE promotor_email = $2",
          [days, currentUserEmail.toLowerCase()]
        )

        // 2. Assign to agent
        await client.query(
          `INSERT INTO estudio_licencias (promotor_email, agente_email, dias_asignados, fecha_expiracion) 
           VALUES ($1, $2, $3, $4) 
           ON CONFLICT (promotor_email, agente_email) 
           DO UPDATE SET 
             dias_asignados = estudio_licencias.dias_asignados + EXCLUDED.dias_asignados,
             fecha_expiracion = CASE 
               WHEN estudio_licencias.fecha_expiracion > NOW() THEN estudio_licencias.fecha_expiracion + INTERVAL '${days} days'
               ELSE NOW() + INTERVAL '${days} days'
             END`,
          [currentUserEmail.toLowerCase(), agentEmail.toLowerCase(), days, expDate]
        )

        await client.query("COMMIT")
      } catch (transErr) {
        await client.query("ROLLBACK")
        throw transErr
      } finally {
        client.release()
      }

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (err: any) {
    console.error("Error in POST licencias:", err)
    return NextResponse.json({ error: "Database error", details: err.message }, { status: 500 })
  }
}
