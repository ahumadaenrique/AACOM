import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const { agencyId, name, email } = await req.json();

        if (!agencyId || !email || !name) {
            return NextResponse.json({ error: "Faltan datos requeridos." }, { status: 400 });
        }

        const agency = await prisma.agency.findUnique({ where: { id: agencyId } });
        if (!agency) {
            return NextResponse.json({ error: "Agencia no encontrada." }, { status: 404 });
        }

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return NextResponse.json({ error: "Este correo electrónico ya está registrado en el sistema." }, { status: 400 });
        }

        const protocol = req.headers.get("x-forwarded-proto") || "http";
        const host = req.headers.get("host") || "localhost:3000";
        const baseUrl = `${protocol}://${host}`;

        // Create Checkout Session
        // Note: The agent price ID MUST be set in Vercel env variables
        const priceId = process.env.STRIPE_AGENT_PRICE_ID; 

        if (!priceId) {
            console.error("Falta configurar STRIPE_AGENT_PRICE_ID en las variables de entorno.");
            return NextResponse.json({ error: "El sistema de cobros no está configurado por el administrador aún." }, { status: 500 });
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'subscription',
            customer_email: email,
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            metadata: {
                agencyId,
                name,
                email
            },
            success_url: `${baseUrl}/invite/${agencyId}?success=true`,
            cancel_url: `${baseUrl}/invite/${agencyId}?canceled=true`,
        });

        return NextResponse.json({ url: session.url });
    } catch (error: any) {
        console.error("Error creating checkout session:", error);
        return NextResponse.json({ error: "Hubo un error al procesar la solicitud." }, { status: 500 });
    }
}
