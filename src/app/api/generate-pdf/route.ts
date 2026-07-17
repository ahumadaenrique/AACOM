import { NextResponse } from "next/server"
import { auth } from "@/auth"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { quoteId } = await req.json()
    if (!quoteId) {
      return NextResponse.json({ error: "Se requiere quoteId" }, { status: 400 })
    }

    // This URL must be accessible publicly by the PDF API.
    // In production, use your actual domain. In dev, we use ngrok or similar, but for now we fallback.
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://aacom-25-dev.vercel.app"
    const targetUrl = `${baseUrl}/print/cotizacion/${quoteId}`

    const apiKey = process.env.PDFSHIFT_API_KEY
    if (!apiKey) {
      console.error("PDFSHIFT_API_KEY not configured")
      return NextResponse.json({ error: "El servicio de PDF no está configurado (Falta API Key)" }, { status: 500 })
    }

    // Call PDFShift API
    const response = await fetch("https://api.pdfshift.io/v3/convert/pdf", {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(`api:${apiKey}`).toString("base64"),
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        source: targetUrl,
        landscape: false,
        use_print: true, // Uses CSS @media print
        format: "A4",
        margin: "10mm",
        wait_for: "networkidle0", // Wait until Recharts finishes rendering
        delay: 1500 // Extra delay to ensure charts are fully drawn
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("PDF API Error:", errorText)
      return NextResponse.json({ error: "Error generando el documento PDF" }, { status: 500 })
    }

    // The response is a binary PDF
    const pdfBuffer = await response.arrayBuffer()

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Cotizacion_${quoteId}.pdf"`
      }
    })
  } catch (error) {
    console.error("PDF Generation exception:", error)
    return NextResponse.json({ error: "Error interno en la generación del PDF" }, { status: 500 })
  }
}
