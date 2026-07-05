import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function POST() {
    const session = await auth();
    
    // Solo vendedores o Super Admins pueden iniciar el modo demo de esta manera
    if (!session?.user || (session.user.role !== 'SELLER' && session.user.role !== 'SUPER_ADMIN')) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Establecer una cookie segura HttpOnly que expira en 2 horas (tiempo suficiente para una demo)
    cookies().set('demoMode', 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 2, // 2 horas
        path: '/'
    });

    return NextResponse.json({ success: true });
}
