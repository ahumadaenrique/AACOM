import { prisma } from '@/lib/prisma';

export interface ElevenLabsKeyValidation {
  valid: boolean;
  error?: string;
  userName?: string;
  tier?: string;
}

/**
 * Valida si la API Key proporcionada es legítima en ElevenLabs.
 */
export async function validateElevenLabsKey(apiKey: string): Promise<ElevenLabsKeyValidation> {
  try {
    const res = await fetch('https://api.elevenlabs.io/v1/user', {
      headers: {
        'xi-api-key': apiKey.trim()
      }
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        return { valid: false, error: 'API Key de ElevenLabs inválida o sin permisos.' };
      }
      return { valid: false, error: `Error de ElevenLabs (${res.status}): ${await res.text()}` };
    }

    const userData = await res.json();
    return {
      valid: true,
      userName: userData?.first_name || userData?.email || 'Usuario ElevenLabs',
      tier: userData?.subscription?.tier || 'free'
    };
  } catch (err: any) {
    return { valid: false, error: err.message || 'No se pudo conectar con ElevenLabs.' };
  }
}

/**
 * Garantiza que la cuenta de ElevenLabs de la agencia tenga un agente Conversational AI
 * listo y configurado ("AACOM Academia PRO").
 * Si no existe, lo crea automáticamente vía API de ElevenLabs con cero intervención manual.
 */
export async function getOrProvisionAgencyAgent(agencyId: string, apiKey: string, agencyName = 'AACOM Seguros'): Promise<string | null> {
  try {
    const cleanKey = apiKey.trim();

    // 1. Revisar si ya existe un agente creado previamente en la cuenta de ElevenLabs
    const listResp = await fetch('https://api.elevenlabs.io/v1/convai/agents', {
      headers: {
        'xi-api-key': cleanKey
      }
    });

    if (listResp.ok) {
      const data = await listResp.json();
      const agents = data.agents || [];
      const existing = agents.find((a: any) => 
        a.name === `${agencyName} Academia PRO` || a.name === 'AACOM Academia PRO' || a.name === 'AACOM Simulador PRO' || a.name?.includes('Academia PRO')
      );

      if (existing?.agent_id) {
        await prisma.agency.update({
          where: { id: agencyId },
          data: { elevenLabsVoiceId: existing.agent_id }
        });
        return existing.agent_id;
      }
    }

    // 2. Si no existe, crear automáticamente el agente Conversational AI en la cuenta del cliente
    const createResp = await fetch('https://api.elevenlabs.io/v1/convai/agents/create', {
      method: 'POST',
      headers: {
        'xi-api-key': cleanKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: `${agencyName} Academia PRO`,
        conversation_config: {
          agent: {
            prompt: {
              prompt: `Eres un prospecto mexicano participando en una sesión interactiva de entrenamiento comercial de ${agencyName}.`
            },
            first_message: 'Hola, buenas tardes.',
            language: 'es'
          },
          tts: {
            model_id: 'eleven_turbo_v2_5',
            voice_id: 'TNuNcwk4LzbPpi1XEANc'
          }
        }
      })
    });

    if (createResp.ok) {
      const createData = await createResp.json();
      const newAgentId = createData.agent_id;
      if (newAgentId) {
        await prisma.agency.update({
          where: { id: agencyId },
          data: { elevenLabsVoiceId: newAgentId }
        });
        return newAgentId;
      }
    } else {
      console.error('Error auto-provisioning ElevenLabs agent for agency:', await createResp.text());
    }

  } catch (error) {
    console.error('Exception in getOrProvisionAgencyAgent:', error);
  }

  return null;
}
