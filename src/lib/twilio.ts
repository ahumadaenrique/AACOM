import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

// Se inicializa el cliente solo si existen las variables, para no romper tu plataforma
// mientras las agregas en Vercel.
export const twilioClient = accountSid && authToken ? twilio(accountSid, authToken) : null;

/**
 * Limpia y homogeniza cualquier número telefónico al formato E.164 para Twilio (+52XXXXXXXXXX).
 * - Elimina espacios, guiones, paréntesis, puntos y prefijo "whatsapp:".
 * - Si tiene 10 dígitos nacionales (ej. "5540884207"), antepone "+52".
 * - Si tiene 13 dígitos con el antiguo prefijo móvil "521" (ej. "5215540884207"), lo homogeniza a "+52" + 10 dígitos.
 * - Si tiene 12 dígitos empezando con "52" (ej. "525540884207"), antepone "+".
 */
export function normalizePhoneForTwilio(raw?: string | null): string {
    if (!raw) return "";
    const digits = raw.replace(/^whatsapp:/i, "").replace(/[^\d]/g, "");
    if (!digits) return "";
    if (digits.length === 10) {
        return `+52${digits}`;
    }
    if (digits.length === 13 && digits.startsWith("521")) {
        return `+52${digits.slice(3)}`;
    }
    if (digits.length === 12 && digits.startsWith("52")) {
        return `+${digits}`;
    }
    return `+${digits}`;
}
