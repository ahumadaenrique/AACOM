import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';
import { Scenario } from './scenarios';

/**
 * Gemini Prompt Architect (Google Antigravity / Gemini 3.8 Flash)
 * Preserva íntegramente el System Prompt determinista de scenarios.ts para los 3 módulos
 * (Prospección, Diagnóstico ADN y Objeciones/Cierre) para garantizar 0% de inversión de rol,
 * 0% de fuga de guion y 0ms de latencia extra al iniciar sesión.
 */
export async function enhanceScenarioPromptWithGemini(params: {
  scenario: Scenario;
  moduleId: string;
  agencyName: string;
  currentLevel: number;
}): Promise<string | null> {
  const { scenario, moduleId, agencyName } = params;

  // En los 3 módulos principales usamos directamente el System Prompt procedural determinista
  // de scenarios.ts porque contiene las reglas exactas de apertura, cláusula suprema anti-inversión de rol,
  // anclaje de identidad, reconocimiento de variantes (Grupo AACOM / AACOM Seguros / AACOMSoft / Acom),
  // límite de objeciones y trampas de auditoría sin riesgo de alteración ni latencia adicional.
  if (moduleId === 'prospeccion' || moduleId === 'adn' || moduleId === 'objeciones') {
    return scenario.systemPrompt;
  }

  const apiKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || '').replace(/^["']|["']$/g, '').trim();

  if (!apiKey || apiKey.length < 20) {
    return scenario.systemPrompt;
  }

  try {
    const google = createGoogleGenerativeAI({ apiKey });

    const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000));

    const generationPromise = (async () => {
      const metaInstruction = `Eres el Director de Simulación de ${agencyName} (Grupo AACOM / AACOM Seguros / AACOMSoft).
Revisa el siguiente System Prompt y asegúrate de conservar intactos todos sus números financieros, etapa familiar y reglas, mejorando únicamente la fluidez conversacional mexicana:

${scenario.systemPrompt}

Devuelve ÚNICAMENTE el texto limpio del System Prompt sin bloques markdown.`;

      const result = await generateText({
        model: google('gemini-3.5-flash-lite'),
        providerOptions: {
          google: {
            thinkingConfig: {
              thinkingLevel: 'minimal'
            }
          }
        },
        prompt: metaInstruction
      });

      const trimmed = result.text.trim();
      return trimmed.length > 100 ? trimmed : null;
    })();

    const winner = await Promise.race([generationPromise, timeoutPromise]);
    return winner || scenario.systemPrompt;
  } catch (err) {
    console.warn('[GeminiPromptArchitect] Fallback a motor procedural local:', err);
    return scenario.systemPrompt;
  }
}
