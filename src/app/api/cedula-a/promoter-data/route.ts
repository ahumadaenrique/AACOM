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

  const promoterEmail = session.user.email

  if (!isPromoter(promoterEmail)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    // 1. Get promoter balance
    let tokens = 7;
    const balanceRes = await pool.query(
      "SELECT dias_disponibles FROM promotor_saldos WHERE promotor_email = $1",
      [promoterEmail.toLowerCase()]
    )
    if (balanceRes.rows.length > 0) {
      tokens = balanceRes.rows[0].dias_disponibles
    }

    // 2. Get promoter's agents (from licenses table)
    const agentsRes = await pool.query(
      "SELECT agente_email, dias_asignados, fecha_expiracion FROM estudio_licencias WHERE promotor_email = $1",
      [promoterEmail.toLowerCase()]
    )

    const agentsList = [];

    for (const row of agentsRes.rows) {
      const email = row.agente_email;
      const name = email.split('@')[0]; // fallback name
      const initials = name.substring(0, 2).toUpperCase();
      
      // Calculate remaining days
      let remainingDays = 0;
      if (row.fecha_expiracion) {
        const exp = new Date(row.fecha_expiracion).getTime();
        const now = new Date().getTime();
        if (exp > now) {
          remainingDays = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
        }
      }

      // 3. Get study times per module for this agent
      const progressRes = await pool.query(
        "SELECT module, tiempo_segundos FROM estudio_progreso WHERE email = $1",
        [email.toLowerCase()]
      )
      
      const timesPerModule: Record<string, number> = {
        "Aspectos Generales": 0,
        "Regulación CNSF": 0,
        "Vida Individual": 0,
        "Accidentes y Enfermedades": 0,
        "Seguros de Daños": 0,
        "Sistema y Mercados Financieros": 0
      };

      let totalStudySeconds = 0;
      progressRes.rows.forEach(p => {
        if (timesPerModule[p.module] !== undefined) {
          // Convert seconds to minutes (decimal)
          timesPerModule[p.module] = p.tiempo_segundos / 60;
          totalStudySeconds += p.tiempo_segundos;
        }
      });

      // 4. Get attempts for this agent
      const attemptsRes = await pool.query(
        "SELECT calificacion, aprobado, fecha FROM examen_intentos WHERE email = $1 ORDER BY fecha ASC",
        [email.toLowerCase()]
      )

      const attempts = attemptsRes.rows.map(att => ({
        date: new Date(att.fecha).toISOString().split('T')[0],
        score: parseFloat(att.calificacion),
        passed: att.aprobado
      }));

      // Calculate module scores based on last attempt details if available
      const moduleScores: Record<string, number> = {
        "Aspectos Generales": 0,
        "Regulación CNSF": 0,
        "Vida Individual": 0,
        "Accidentes y Enfermedades": 0,
        "Seguros de Daños": 0,
        "Sistema y Mercados Financieros": 0
      };

      // Get latest scores from last exam attempt if available
      const latestAttemptRes = await pool.query(
        "SELECT detalles_modulos FROM examen_intentos WHERE email = $1 ORDER BY fecha DESC LIMIT 1",
        [email.toLowerCase()]
      )
      if (latestAttemptRes.rows.length > 0 && latestAttemptRes.rows[0].detalles_modulos) {
        const details = latestAttemptRes.rows[0].detalles_modulos;
        // Format of details: { "Aspectos Generales": { correct: X, total: Y }, ... }
        Object.keys(details).forEach(mod => {
          const modData = details[mod];
          if (modData && modData.total > 0) {
            moduleScores[mod] = Math.round((modData.correct / modData.total) * 100);
          }
        });
      }

      agentsList.push({
        id: email,
        name: name.charAt(0).toUpperCase() + name.slice(1),
        initials,
        email,
        status: remainingDays > 0 ? "active" : "inactive",
        studyTime: totalStudySeconds / 60, // in minutes
        remainingDays,
        attempts,
        timesPerModule,
        moduleScores
      });
    }

    // Add promoter's own study account if they study
    let promoterSelfAgent = agentsList.find(a => a.email === promoterEmail.toLowerCase());
    if (!promoterSelfAgent) {
      // Create empty record for promoter
      agentsList.push({
        id: promoterEmail.toLowerCase(),
        name: "Tú (Cuenta de Estudio)",
        initials: "PR",
        email: promoterEmail.toLowerCase(),
        status: "active",
        studyTime: 0,
        remainingDays: 999, // promoter has permanent access
        attempts: [],
        timesPerModule: {
          "Aspectos Generales": 0,
          "Regulación CNSF": 0,
          "Vida Individual": 0,
          "Accidentes y Enfermedades": 0,
          "Seguros de Daños": 0,
          "Sistema y Mercados Financieros": 0
        },
        moduleScores: {
          "Aspectos Generales": 0,
          "Regulación CNSF": 0,
          "Vida Individual": 0,
          "Accidentes y Enfermedades": 0,
          "Seguros de Daños": 0,
          "Sistema y Mercados Financieros": 0
        }
      });
    }

    return NextResponse.json({
      tokens,
      totalGiftedThisQuarter: 7, // mock
      agents: agentsList
    });

  } catch (err: any) {
    console.error("Error in GET promoter-data:", err)
    return NextResponse.json({ error: "Database error", details: err.message }, { status: 500 })
  }
}
