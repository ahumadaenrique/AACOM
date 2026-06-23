import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: "No autenticado" }, { status: 401 });
        }

        const { subject, description } = await req.json();

        if (!subject || !description) {
            return NextResponse.json({ error: "Faltan datos en el ticket" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({ 
            where: { email: session.user.email },
            include: { agency: true }
        });

        if (!user) {
            return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
        }

        // 1. Guardar el Ticket en la Base de Datos
        const newTicket = await prisma.ticket.create({
            data: {
                userId: user.id,
                agencyId: user.agencyId,
                subject,
                description,
                status: "OPEN"
            }
        });

        // 2. Enviar el correo de notificación al SuperAdmin (Enrique)
        if (process.env.SMTP_USER && process.env.SMTP_PASS) {
            try {
                const transporter = nodemailer.createTransport({
                    host: process.env.SMTP_HOST || "smtp.gmail.com",
                    port: Number(process.env.SMTP_PORT) || 587,
                    auth: {
                        user: process.env.SMTP_USER,
                        pass: process.env.SMTP_PASS,
                    },
                });

                const mailOptions = {
                    from: `"Soporte AACOM" <${process.env.SMTP_USER}>`,
                    to: "enrique.ahumada@aacommx.com", // Tu correo para recibir alertas
                    subject: `[Nuevo Ticket] ${subject}`,
                    html: `
                        <h2>Nuevo Ticket de Soporte Registrado</h2>
                        <p><strong>Agencia:</strong> ${user.agency?.name || 'Independiente'}</p>
                        <p><strong>Usuario:</strong> ${user.name} (${user.email})</p>
                        <hr />
                        <h3>Descripción del Problema:</h3>
                        <p>${description}</p>
                        <br />
                        <p><i>Para responder a este ticket, contacta directamente al usuario o revisa tu panel de SuperAdmin.</i></p>
                    `
                };

                await transporter.sendMail(mailOptions);
                console.log("Correo de soporte enviado exitosamente.");
            } catch (mailError) {
                console.error("Error al enviar correo de soporte (el ticket sí se guardó):", mailError);
                // No rompemos la ejecución si el correo falla, lo importante es que se guardó en BD.
            }
        } else {
            console.warn("Credenciales SMTP no configuradas. El ticket se guardó en BD pero el correo no fue enviado.");
        }

        return NextResponse.json({ success: true, ticketId: newTicket.id });

    } catch (error: any) {
        console.error("Error en API de Soporte:", error);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}
