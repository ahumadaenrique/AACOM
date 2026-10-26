"use server"

import { prisma } from "@/lib/prisma"
import crypto from "crypto"
import bcrypt from "bcryptjs"
import nodemailer from "nodemailer"

export async function requestPasswordReset(email: string) {
  try {
    const emailLower = email.toLowerCase().trim()
    let user = await prisma.user.findUnique({
      where: { email: emailLower },
      include: { agency: true }
    })

    if (!user) {
      user = await prisma.user.findFirst({
        where: { email: { equals: emailLower, mode: 'insensitive' } },
        include: { agency: true }
      })
    }

    if (!user) {
      // Security: do not disclose if user exists
      return { success: true, message: "Si el correo está registrado, recibirás un enlace para restablecer tu contraseña." }
    }

    const agencyName = (user.agency?.name || "AACOMSOFT").replace(/[<>"'\r\n]/g, "").trim() || "AACOMSOFT"
    const recipientEmail = user.email.trim().toLowerCase()

    const token = crypto.randomBytes(32).toString("hex")
    const tokenExpiry = new Date(Date.now() + 3600000) // 1 hour expiration

    await prisma.user.update({
      where: { id: user.id },
      data: {
        email: recipientEmail,
        resetToken: token,
        resetTokenExpiry: tokenExpiry
      }
    })

    const baseUrl = process.env.NEXTAUTH_URL || "https://www.aacomsoft.com"
    const resetLink = `${baseUrl}/reset-password?token=${token}`

    const subject = `Restablecer tu contraseña de ${agencyName}`
    const htmlBody = `
      <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 500px; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px;">
        <h2 style="color: #4f46e5; margin-bottom: 16px;">Restablecer Contraseña</h2>
        <p style="color: #334155; font-size: 14px; line-height: 1.5;">Hola <strong>${user.name || ""}</strong>,</p>
        <p style="color: #334155; font-size: 14px; line-height: 1.5;">Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en <strong>${agencyName}</strong>. Haz clic en el botón de abajo para ingresar una nueva contraseña (este enlace expira en 1 hora):</p>
        <div style="margin: 24px 0;">
          <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 14px;">Restablecer Contraseña</a>
        </div>
        <p style="color: #64748b; font-size: 12px; line-height: 1.5;">Si el botón no funciona, puedes copiar y pegar el siguiente enlace en tu navegador:</p>
        <p style="color: #64748b; font-size: 12px; word-break: break-all;"><a href="${resetLink}" style="color: #4f46e5;">${resetLink}</a></p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="color: #94a3b8; font-size: 11px;">Si no solicitaste este cambio, puedes ignorar este correo con seguridad.</p>
      </div>
    `

    let emailSent = false
    let lastError = ""

    // 1. Intentar envío por Resend si existe RESEND_API_KEY
    if (process.env.RESEND_API_KEY) {
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.RESEND_API_KEY}`
          },
          body: JSON.stringify({
            from: `"${agencyName}" <no-reply@aacomsoft.com>`,
            to: [recipientEmail],
            subject,
            html: htmlBody
          })
        })

        if (res.ok) {
          emailSent = true
        } else {
          const errorText = await res.text()
          console.error("Resend API error:", errorText)
          lastError = `Resend HTTP ${res.status}: ${errorText}`
        }
      } catch (resendErr: any) {
        console.error("Resend fetch exception:", resendErr)
        lastError = resendErr.message || "Error de conexión con Resend"
      }
    }

    // 2. Respaldo automático con Nodemailer (SMTP_USER / SMTP_PASS) si Resend no está configurado o falló
    if (!emailSent && process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || "smtp.gmail.com",
          port: Number(process.env.SMTP_PORT) || 587,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        })

        await transporter.sendMail({
          from: `"${agencyName} - Soporte" <${process.env.SMTP_USER}>`,
          to: recipientEmail,
          subject,
          html: htmlBody,
        })

        emailSent = true
      } catch (smtpErr: any) {
        console.error("SMTP fallback error:", smtpErr)
        lastError = smtpErr.message || "Error al enviar por SMTP"
      }
    }

    if (!emailSent) {
      console.error("[PASSWORD RESET] No se pudo enviar el correo. Detalle:", lastError || "Sin proveedor configurado", "Link:", resetLink)
      return {
        success: false,
        message: "No se pudo entregar el correo de recuperación en este momento. Por favor solicita a tu Administrador que restablezca tu contraseña desde el panel de Usuarios."
      }
    }

    return { success: true, message: "Te hemos enviado un enlace a tu correo para restablecer tu contraseña. Revisa también tu bandeja de Spam o Promociones." }
  } catch (error: any) {
    console.error("requestPasswordReset error:", error)
    return { success: false, message: error.message || "Error al procesar la solicitud." }
  }
}

export async function resetPassword(token: string, newPassword: string) {
  try {
    if (!token) {
      return { success: false, message: "Token requerido" }
    }

    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date()
        }
      }
    })

    if (!user) {
      return { success: false, message: "El enlace es inválido o ha expirado." }
    }

    const hashedPassword = await bcrypt.hash(newPassword.trim(), 10)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        email: user.email.trim().toLowerCase(),
        password: hashedPassword,
        mustChangePassword: false,
        resetToken: null,
        resetTokenExpiry: null
      }
    })

    return { success: true, message: "Contraseña actualizada con éxito." }
  } catch (error: any) {
    console.error("resetPassword error:", error)
    return { success: false, message: error.message || "Error al restablecer la contraseña." }
  }
}
