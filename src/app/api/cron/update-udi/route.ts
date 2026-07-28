import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    // Vercel Cron Authentication
    const authHeader = request.headers.get('authorization');
    const { searchParams } = new URL(request.url);
    const bypass = searchParams.get('bypass');

    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        if (process.env.NODE_ENV === 'production') {
            return new Response('Unauthorized', { status: 401 });
        }
    }

    const token = process.env.BANXICO_TOKEN;
    if (!token) {
        return NextResponse.json({ success: false, error: "Falta configurar BANXICO_TOKEN en las variables de entorno" }, { status: 500 });
    }

    try {
        // Query UDI, USD, EUR, and GBP from Banxico REST API (oportuno endpoint)
        const url = `https://www.banxico.org.mx/SieAPIRest/service/v1/series/SP68257,SF43718,SF46410,SF46407/datos/oportuno`;
        const res = await fetch(url, {
            headers: { 'Bmx-Token': token },
            next: { revalidate: 0 }
        });
        
        if (!res.ok) {
            throw new Error(`API Banxico respondió con status: ${res.status}`);
        }
        
        const data = await res.json();
        const seriesList = data.bmx?.series;
        
        if (!seriesList || !Array.isArray(seriesList)) {
            throw new Error("El API de Banxico no devolvió la estructura de datos esperada");
        }

        const updatedValues: Record<string, number> = {};

        // Series ID map
        const keyMap: Record<string, string> = {
            "SP68257": "udi_default",
            "SF43718": "usd_default",
            "SF46410": "eur_default",
            "SF46407": "gbp_default"
        };

        for (const series of seriesList) {
            const id = series.idSerie;
            const key = keyMap[id];
            if (!key) continue;

            const latestData = series.datos?.[0];
            if (latestData && latestData.dato) {
                const val = parseFloat(latestData.dato);
                if (!isNaN(val)) {
                    await prisma.setting.upsert({
                        where: { key },
                        update: { value: val.toString() },
                        create: { key, value: val.toString() }
                    });
                    updatedValues[key] = val;
                }
            }
        }
        
        return NextResponse.json({ 
            success: true, 
            message: "Valores financieros actualizados correctamente desde Banxico", 
            values: updatedValues 
        });
    } catch (error: any) {
        console.error("Error en CRON update-indicators:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
