"use server"

import { prisma } from "@/lib/prisma"
import crypto from "crypto"

export async function requestPasswordReset(email: string) {
  try {
    const emailLower = email.toLowerCase().trim()
    const user = await prisma.user.findUnique({
      where: { email: emailLower }
    })

    if (!user) {
      // Security: do not disclose if user exists
      return { success: true, message: "Si el correo está registrado, recibirás un enlace para restablecer tu contraseña." }
    }

    const token = crypto.randomBytes(32).toString("hex")
    const tokenExpiry = new Date(Date.now() + 3600000) // 1 hour expiration

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: token,
        resetTokenExpiry: tokenExpiry
      }
    })

    const baseUrl = process.env.NEXTAUTH_URL || "https://www.aacomsoft.com"
    const resetLink = `${baseUrl}/reset-password?token=${token}`

    if (!process.env.RESEND_API_KEY) {
      console.warn("RESEND_API_KEY is not defined. Simulating email reset link:")
      console.log(`[PASSWORD RESET LINK]: ${resetLink}`)
      return { success: true, message: "Enlace generado con éxito (Simulación en consola de servidor)." }
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: "AACOM Seguros <no-reply@aacomsoft.com>",
        to: [user.email],
        subject: "Restablecer tu contraseña de AACOM Seguros",
        html: `
          <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 500px; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px;">
            <h2 style="color: #4f46e5; margin-bottom: 16px;">Restablecer Contraseña</h2>
            <p style="color: #334155; font-size: 14px; line-height: 1.5;">Hola,</p>
            <p style="color: #334155; font-size: 14px; line-height: 1.5;">Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en AACOM Seguros. Haz clic en el botón de abajo para ingresar una nueva contraseña (este enlace expira en 1 hora):</p>
            <div style="margin: 24px 0;">
              <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 14px;">Restablecer Contraseña</a>
            </div>
            <p style="color: #64748b; font-size: 12px; line-height: 1.5;">Si el botón no funciona, puedes copiar y pegar el siguiente enlace en tu navegador:</p>
            <p style="color: #64748b; font-size: 12px; word-break: break-all;"><a href="${resetLink}" style="color: #4f46e5;">${resetLink}</a></p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
            <p style="color: #94a3b8; font-size: 11px;">Si no solicitaste este cambio, puedes ignorar este correo con seguridad.</p>
          </div>
        `
      })
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.error("Resend API error:", errorText)
      throw new Error("No se pudo enviar el correo de restablecimiento.")
    }

    return { success: true, message: "Si el correo está registrado, recibirás un enlace para restablecer tu contraseña." }
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

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: newPassword, // stored as plain text per codebase design
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
