import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import nodemailer from 'nodemailer';
import { SITE_CONFIG } from '@/config/site';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      fullName,
      agencyName,
      insurers,
      city,
      agentsCount,
      whatsapp,
      email,
      privacyAccepted,
      honeypot, // Campo anti-spam trampa
      utmSource,
      utmMedium,
      utmCampaign,
      utmContent,
      utmTerm,
      originPage
    } = body;

    // 1. Anti-spam honeypot
    if (honeypot && String(honeypot).trim() !== '') {
      console.warn('[Leads API] Bot detectado vía honeypot');
      return NextResponse.json({ success: true, message: 'Solicitud procesada.' });
    }

    // 2. Validaciones estrictas
    if (!fullName || fullName.trim().length < 3 || fullName.trim().length > 80) {
      return NextResponse.json({ error: 'El nombre completo debe tener entre 3 y 80 caracteres.' }, { status: 400 });
    }

    if (!agencyName || agencyName.trim().length < 2 || agencyName.trim().length > 120) {
      return NextResponse.json({ error: 'El nombre de la promotoría/agencia debe tener entre 2 y 120 caracteres.' }, { status: 400 });
    }

    if (!city || city.trim().length < 2 || city.trim().length > 80) {
      return NextResponse.json({ error: 'La ciudad debe tener entre 2 y 80 caracteres.' }, { status: 400 });
    }

    const cleanWhatsapp = String(whatsapp || '').replace(/\D/g, '');
    if (cleanWhatsapp.length < 10) {
      return NextResponse.json({ error: 'Proporciona un número de WhatsApp válido (mínimo 10 dígitos).' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return NextResponse.json({ error: 'Proporciona un correo electrónico válido.' }, { status: 400 });
    }

    if (!privacyAccepted) {
      return NextResponse.json({ error: 'Debes aceptar el aviso de privacidad para agendar la demo.' }, { status: 400 });
    }

    const formattedInsurers = Array.isArray(insurers) ? insurers.join(', ') : String(insurers || 'No especificada');

    // 3. Guardar Lead en Base de Datos
    let lead = null;
    try {
      lead = await prisma.lead.create({
        data: {
          fullName: fullName.trim(),
          agencyName: agencyName.trim(),
          insurers: formattedInsurers,
          city: city.trim(),
          agentsCount: String(agentsCount || '1-10'),
          whatsapp: cleanWhatsapp,
          email: email.trim().toLowerCase(),
          privacyAccepted: Boolean(privacyAccepted),
          utmSource: utmSource ? String(utmSource) : null,
          utmMedium: utmMedium ? String(utmMedium) : null,
          utmCampaign: utmCampaign ? String(utmCampaign) : null,
          utmContent: utmContent ? String(utmContent) : null,
          utmTerm: utmTerm ? String(utmTerm) : null,
          originPage: originPage ? String(originPage) : '/inicio',
          status: 'NUEVO'
        }
      });
    } catch (dbErr) {
      console.error('[Leads API] Error guardando lead en BD:', dbErr);
      // Continuamos para no perder la alerta por email si la BD tuviera un problema transitorio
    }

    // 4. Enviar notificación inmediata por correo a Enrique
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: Number(process.env.SMTP_PORT) || 587,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        const mailHtml = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
            <div style="background-color: #0d9488; padding: 16px; border-radius: 8px; text-align: center; margin-bottom: 24px;">
              <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 700;">🚀 Nueva Solicitud de Demo (20 min)</h1>
              <p style="color: #ccfbf1; margin: 4px 0 0 0; font-size: 13px;">aacomsoft.com</p>
            </div>

            <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #334155;">
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-weight: 600; width: 40%;">Nombre Completo:</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-weight: bold;">${fullName}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-weight: 600;">Promotoría / Agencia:</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9;">${agencyName}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-weight: 600;">WhatsApp / Celular:</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9;">
                  <a href="https://wa.me/52${cleanWhatsapp}?text=Hola%20${encodeURIComponent(fullName)},%20te%20contacto%20de%20aacomsoft%20respecto%20a%20tu%20solicitud%20de%20demo" style="color: #0d9488; font-weight: bold; text-decoration: none;">
                    +52 ${cleanWhatsapp} 📲 (Clic para WhatsApp)
                  </a>
                </td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-weight: 600;">Correo Electrónico:</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9;">
                  <a href="mailto:${email}" style="color: #0d9488; text-decoration: none;">${email}</a>
                </td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-weight: 600;">Ciudad:</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9;">${city}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-weight: 600;">Número de Agentes:</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9;">${agentsCount || '1-10'}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-weight: 600;">Aseguradora(s):</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9;">${formattedInsurers}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-weight: 600;">Página Origen:</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9;">${originPage || '/inicio'}</td>
              </tr>
              ${utmSource ? `
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-weight: 600;">Campaña / UTM:</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 12px; color: #64748b;">
                  Source: ${utmSource || '-'} | Medium: ${utmMedium || '-'} | Campaign: ${utmCampaign || '-'}
                </td>
              </tr>
              ` : ''}
            </table>

            <div style="margin-top: 24px; padding: 14px; background-color: #f8fafc; border-radius: 8px; font-size: 12px; color: #64748b; text-align: center;">
              Compromiso de respuesta: <strong>${SITE_CONFIG.responseTime}</strong>.
            </div>
          </div>
        `;

        await transporter.sendMail({
          from: `"aacomsoft Demos" <${process.env.SMTP_USER}>`,
          to: SITE_CONFIG.leadsEmail,
          replyTo: email,
          subject: `[Nueva Demo] ${agencyName} - ${fullName}`,
          html: mailHtml,
        });
      } catch (mailErr) {
        console.error('[Leads API] Error enviando correo:', mailErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Demo solicitada exitosamente.',
      leadId: lead?.id || null
    });
  } catch (error: any) {
    console.error('[Leads API] Error general:', error);
    return NextResponse.json({ error: 'Error procesando solicitud. Por favor intenta de nuevo o escríbenos por WhatsApp.' }, { status: 500 });
  }
}
