import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const users = await prisma.user.findMany({
        where: {
            OR: [
                { name: { contains: "David", mode: "insensitive" } },
                { name: { contains: "Pavel", mode: "insensitive" } }
            ]
        },
        include: { agency: true }
    });
    
    const agencies = await prisma.agency.findMany({
        where: {
            OR: [
                { name: { contains: "David", mode: "insensitive" } },
                { name: { contains: "Pavel", mode: "insensitive" } }
            ]
        }
    });

    return NextResponse.json({ users, agencies });
}
