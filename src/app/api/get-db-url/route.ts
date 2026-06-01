import { NextResponse } from "next/server"

export async function GET() {
    return NextResponse.json({
        database_url: process.env.DATABASE_URL || "No configurada"
    })
}
