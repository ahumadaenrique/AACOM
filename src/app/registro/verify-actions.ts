"use server";

import { prisma } from "@/lib/prisma";
import { twilioClient } from "@/lib/twilio";

export async function sendVerificationSms(phone: string) {
  if (!twilioClient) {
    return { success: false, message: "Twilio no está configurado en el servidor. Faltan las claves de entorno." };
  }
  const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
  if (!serviceSid) {
    return { success: false, message: "Falta el TWILIO_VERIFY_SERVICE_SID en el servidor." };
  }

  // Format phone to E.164 (assuming Mexico if no country code)
  let formattedPhone = phone.trim();
  if (formattedPhone.length === 10 && !formattedPhone.startsWith("+")) {
    formattedPhone = `+52${formattedPhone}`;
  } else if (!formattedPhone.startsWith("+")) {
    return { success: false, message: "Por favor incluye el código de país (ej. +52) o ingresa tus 10 dígitos si estás en México." };
  }

  // Check if phone is already registered and verified
  const existingUser = await prisma.user.findFirst({
    where: { 
      phone: phone,
      phoneVerified: true,
      agency: {
        active: true
      }
    }
  });

  if (existingUser) {
    return { success: false, message: "Este número de teléfono ya ha sido utilizado para registrar otra agencia." };
  }

  try {
    const verification = await twilioClient.verify.v2.services(serviceSid)
      .verifications
      .create({ to: formattedPhone, channel: 'sms' });

    return { success: true, status: verification.status };
  } catch (error: any) {
    console.error("Twilio send error:", error);
    return { success: false, message: error.message || "Error al enviar el SMS. Verifica que el número sea correcto." };
  }
}

export async function checkVerificationCode(phone: string, code: string) {
  if (!twilioClient) {
    return { success: false, message: "Twilio no está configurado en el servidor." };
  }
  const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
  if (!serviceSid) {
    return { success: false, message: "Falta el TWILIO_VERIFY_SERVICE_SID en el servidor." };
  }

  let formattedPhone = phone.trim();
  if (formattedPhone.length === 10 && !formattedPhone.startsWith("+")) {
    formattedPhone = `+52${formattedPhone}`;
  }

  try {
    const verificationCheck = await twilioClient.verify.v2.services(serviceSid)
      .verificationChecks
      .create({ to: formattedPhone, code });

    if (verificationCheck.status === "approved") {
      return { success: true };
    } else {
      return { success: false, message: "El código es incorrecto o ha expirado." };
    }
  } catch (error: any) {
    console.error("Twilio check error:", error);
    return { success: false, message: "Código inválido. Intenta enviarlo nuevamente." };
  }
}
