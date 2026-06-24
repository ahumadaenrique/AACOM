import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

// Se inicializa el cliente solo si existen las variables, para no romper tu plataforma
// mientras las agregas en Vercel.
export const twilioClient = accountSid && authToken ? twilio(accountSid, authToken) : null;
