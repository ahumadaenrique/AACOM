import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { startOfMonth, format } from "date-fns";

export async function GET() {
    try {
        const revs = await prisma.performanceReview.findMany({ 
            where: { puntosActividad: 0 } 
        });
        
        let count = 0;
        
        for (const rev of revs) {
            const startStr = format(startOfMonth(rev.createdAt), 'yyyy-MM-dd');
            const endStr = format(rev.createdAt, 'yyyy-MM-dd');
            
            const logs = await prisma.activityLog.findMany({
                where: { 
                    userId: rev.agentId, 
                    dateStr: { gte: startStr, lte: endStr } 
                }
            });
            const points = logs.reduce((acc, log) => acc + log.points, 0);
            
            const adns = await prisma.adnDiagnostic.count({
                where: { 
                    userId: rev.agentId, 
                    createdAt: { gte: startOfMonth(rev.createdAt), lte: rev.createdAt } 
                }
            });
            
            if (points > 0 || adns > 0) {
                await prisma.performanceReview.update({
                    where: { id: rev.id },
                    data: { puntosActividad: points, adnsRealizados: adns }
                });
                count++;
            }
        }
        
        return NextResponse.json({ success: true, message: `Se actualizaron ${count} reportes historicos.` });
    } catch (e: any) {
        return NextResponse.json({ success: false, message: e.message });
    }
}
