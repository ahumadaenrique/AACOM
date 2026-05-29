import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
    try {
        // Seed default admin
        const admin = await prisma.user.upsert({
            where: { email: "admin@example.com" },
            update: {
                name: "Admin User",
                password: "password123",
                role: "ADMIN",
                active: true
            },
            create: {
                email: "admin@example.com",
                name: "Admin User",
                password: "password123",
                role: "ADMIN",
                active: true
            }
        })

        // Seed Enrique Ahumada owner ADMIN
        const owner = await prisma.user.upsert({
            where: { email: "enrique.ahumada@aacommx.com" },
            update: {
                name: "Enrique Ahumada",
                password: "Saldivar0",
                role: "ADMIN",
                active: true
            },
            create: {
                email: "enrique.ahumada@aacommx.com",
                name: "Enrique Ahumada",
                password: "Saldivar0",
                role: "ADMIN",
                active: true
            }
        })

        return NextResponse.json({
            success: true,
            message: "¡Base de datos de producción registrada con éxito!",
            database_host: process.env.DATABASE_URL ? process.env.DATABASE_URL.split("@").pop()?.split("/")[0] : "No Configurada",
            users: [
                { email: admin.email, role: admin.role, active: admin.active },
                { email: owner.email, role: owner.role, active: owner.active }
            ]
        })
    } catch (error: any) {
        console.error("Seeding error:", error)
        return NextResponse.json({
            success: false,
            message: "Error al registrar la base de datos",
            error: error.message || error
        }, { status: 500 })
    }
}
