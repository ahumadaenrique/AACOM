import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    const session = await auth();
    if (!session?.user?.email) {
        return NextResponse.json({ isAdmin: false, message: "No autenticado" });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { role: true }
        });

        return NextResponse.json({ 
            isAdmin: user?.role === 'ADMIN' 
        });
    } catch (error: any) {
        console.error("Error checking admin auth route:", error);
        return NextResponse.json({ isAdmin: false, error: error.message });
    }
}
