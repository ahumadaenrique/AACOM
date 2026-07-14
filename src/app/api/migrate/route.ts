import { NextResponse } from 'next/server';
import twilio from 'twilio';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const fromNumber = process.env.TWILIO_PHONE_NUMBER;
        const targetPhone = '5515015502'; // Enrique's phone number

        const envStatus = {
            TWILIO_ACCOUNT_SID: !!accountSid,
            TWILIO_AUTH_TOKEN: !!authToken,
            TWILIO_PHONE_NUMBER: fromNumber || 'MISSING'
        };

        if (!accountSid || !authToken || !fromNumber) {
            return NextResponse.json({ success: false, message: "Missing Twilio variables on Vercel.", envStatus });
        }

        const client = twilio(accountSid, authToken);

        let formattedPhone = targetPhone.trim().replace(/[\s\-\(\)]/g, '');
        if (formattedPhone.length === 10) {
            formattedPhone = `+52${formattedPhone}`;
        } else if (!formattedPhone.startsWith('+')) {
            formattedPhone = `+${formattedPhone}`;
        }

        try {
            const message = await client.messages.create({
                body: 'Mensaje de diagnóstico desde Vercel de AACOM.',
                from: `whatsapp:${fromNumber.startsWith('+') ? fromNumber : '+' + fromNumber}`,
                to: `whatsapp:${formattedPhone}`
            });

            return NextResponse.json({
                success: true,
                message: "Twilio API accepted the request",
                sid: message.sid,
                status: message.status,
                envStatus
            });
        } catch (twilioError: any) {
            return NextResponse.json({
                success: false,
                message: "Twilio API returned an error",
                error: {
                    message: twilioError.message,
                    code: twilioError.code,
                    status: twilioError.status
                },
                envStatus
            }, { status: 400 });
        }
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
