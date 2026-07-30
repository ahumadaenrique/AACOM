import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
    const url = new URL(request.url);
    const search = url.searchParams.get("q") || "";
    
    const agencies = await prisma.agency.findMany({
        where: { name: { contains: search, mode: "insensitive" } }
    });
    
    const users = await prisma.user.findMany({
        where: { name: { contains: search, mode: "insensitive" } }
    });

    return NextResponse.json({ agencies, users });
}
