import { NextResponse } from "next/server";
import { checkAllSystemsStatus } from "@/app/(dashboard)/admin/system-status/actions";
import twilio from "twilio";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        // En producción requerimos el token del cron, pero en local podemos permitirlo
        if (process.env.NODE_ENV === 'production') {
            return new NextResponse('Unauthorized', { status: 401 });
        }
    }

    try {
        const res = await checkAllSystemsStatus();
        
        if (res.success && res.results) {
            const failedApis = res.results.filter((sys: any) => sys.status === 'error');
            
            if (failedApis.length > 0) {
                const apiNames = failedApis.map((sys: any) => sys.name).join(", ");
                
                // Enviar SMS a los Super Admins
                const superAdmins = await prisma.user.findMany({
                    where: { 
                        role: "SUPER_ADMIN",
                        phone: { not: null },
                        active: true
                    },
                    select: { phone: true }
                });

                const accountSid = process.env.TWILIO_ACCOUNT_SID;
                const authToken = process.env.TWILIO_AUTH_TOKEN;
                const fromNumber = process.env.TWILIO_PHONE_NUMBER;

                if (accountSid && authToken && fromNumber && superAdmins.length > 0) {
                    const client = twilio(accountSid, authToken);
                    
                    for (const admin of superAdmins) {
                        if (admin.phone) {
                            try {
                                await client.messages.create({
                                    body: `URGENTE: La API de ${apiNames} esta fallando en AACOM. Revisa el centro de comando inmediatamente.`,
                                    from: fromNumber,
                                    to: `+52${admin.phone}` // Asumiendo teléfonos de México
                                });
                            } catch (smsErr) {
                                console.error(`Error enviando SMS a ${admin.phone}:`, smsErr);
                            }
                        }
                    }
                }
            }
        }
        
        return NextResponse.json({ success: true, message: "APIs checked" });
    } catch (error: any) {
        console.error("Cron check-apis error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
