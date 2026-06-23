import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const revs = await prisma.performanceReview.findMany({ 
            where: { avancePrimasActual: 12000 },
            include: { agent: true }
        });
        
        let count = 0;
        
        for (const rev of revs) {
            if (rev.agent.name.includes("Raul") || rev.agent.name.includes("Coka")) {
                await prisma.performanceReview.update({
                    where: { id: rev.id },
                    data: { avancePrimasActual: 120000 }
                });
                count++;
            }
        }
        
        return NextResponse.json({ success: true, message: `Se actualizo el avance de ${count} reporte(s) de Raul a 120,000.` });
    } catch (e: any) {
        return NextResponse.json({ success: false, message: e.message });
    }
}
