import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import fs from "fs"
import path from "path"

export async function GET(req: NextRequest) {
  const session = await auth()
  
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const jsonPath = path.join(process.cwd(), 'public', 'cedula-b', 'preguntas.json')
    if (!fs.existsSync(jsonPath)) {
      return NextResponse.json({ error: "preguntas.json file not found" }, { status: 404 })
    }
    
    const fileContent = fs.readFileSync(jsonPath, 'utf8')
    const questions = JSON.parse(fileContent)
    
    return NextResponse.json(questions, {
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=86400"
      }
    })
  } catch (err: any) {
    console.error("Error in GET cedula-b preguntas:", err)
    return NextResponse.json({ error: "Database error", details: err.message }, { status: 500 })
  }
}
