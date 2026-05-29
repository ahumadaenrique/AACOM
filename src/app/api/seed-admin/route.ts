import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
    try {
        console.log("[SEED] Ejecutando migración SQL en base de datos en vivo...");
        
        // 1. Agregar la columna 'phone' si no existe
        try {
            await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phone" TEXT;`)
            console.log("[SEED] Columna 'phone' verificada/creada.");
        } catch (err: any) {
            console.error("[SEED] Error al crear columna 'phone':", err.message);
        }

        // 2. Agregar la columna 'active' si no existe
        try {
            await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "active" BOOLEAN NOT NULL DEFAULT true;`)
            console.log("[SEED] Columna 'active' verificada/creada.");
        } catch (err: any) {
            console.error("[SEED] Error al crear columna 'active':", err.message);
        }

        // 3. Agregar la columna 'cerradaPagada' si no existe
        try {
            await prisma.$executeRawUnsafe(`ALTER TABLE "AdnDiagnostic" ADD COLUMN IF NOT EXISTS "cerradaPagada" BOOLEAN NOT NULL DEFAULT false;`)
            console.log("[SEED] Columna 'cerradaPagada' verificada/creada.");
        } catch (err: any) {
            console.error("[SEED] Error al crear columna 'cerradaPagada':", err.message);
        }

        console.log("[SEED] Registrando usuarios administradores...");

        // 4. Registrar admin por defecto
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

        // 5. Registrar a Enrique Ahumada como dueño ADMIN
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
            message: "¡Base de datos de producción migrada y registrada con éxito!",
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
