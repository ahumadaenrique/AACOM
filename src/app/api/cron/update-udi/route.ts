import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    // Vercel Cron Authentication
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        if (process.env.NODE_ENV === 'production') {
            return new Response('Unauthorized', { status: 401 });
        }
    }

    const token = process.env.BANXICO_TOKEN;
    if (!token) {
        return NextResponse.json({ success: false, error: "Falta configurar BANXICO_TOKEN en las variables de entorno" }, { status: 500 });
    }

    try {
        // Obtenemos la fecha actual forzada a la zona horaria de la Ciudad de México
        const mxDate = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Mexico_City" }));
        const year = mxDate.getFullYear();
        const month = String(mxDate.getMonth() + 1).padStart(2, '0');
        const day = String(mxDate.getDate()).padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;

        // Le pedimos a Banxico exclusivamente la UDI del día de HOY, no la "oportuna" que es la proyectada a futuro
        const url = `https://www.banxico.org.mx/SieAPIRest/service/v1/series/SP68257/datos/${todayStr}/${todayStr}`;
        const res = await fetch(url, {
            headers: { 'Bmx-Token': token },
            next: { revalidate: 0 }
        });
        
        if (!res.ok) {
            throw new Error(`API Banxico respondió con status: ${res.status}`);
        }
        
        const data = await res.json();
        
        if (data.bmx?.series?.[0]?.datos?.[0]?.dato) {
            const udiValue = parseFloat(data.bmx.series[0].datos[0].dato);
            
            // Upsert al valor de UDI global
            await prisma.setting.upsert({
                where: { key: "udi_default" },
                update: { value: udiValue.toString() },
                create: { key: "udi_default", value: udiValue.toString() }
            });
            
            return NextResponse.json({ success: true, message: `UDI actualizada correctamente a ${udiValue}`, newUdi: udiValue });
        } else {
            throw new Error("El API de Banxico no devolvió la estructura de datos esperada");
        }
    } catch (error: any) {
        console.error("Error en CRON update-udi:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
