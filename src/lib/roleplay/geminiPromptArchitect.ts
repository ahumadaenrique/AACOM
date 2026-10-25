import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';
import { Scenario } from './scenarios';

/**
 * Gemini Prompt Architect (Google Antigravity / Gemini 3.8 Flash)
 * Calibra la psicología del prospecto exclusivamente cuando se requiere enriquecimiento en ADN,
 * preservando las reglas deterministas del escenario procedural en Prospección y Cierre.
 */
export async function enhanceScenarioPromptWithGemini(params: {
  scenario: Scenario;
  moduleId: string;
  agencyName: string;
  currentLevel: number;
}): Promise<string | null> {
  const { scenario, moduleId, agencyName } = params;

  // En Prospección y Objeciones/Cierre usamos directamente el System Prompt procedural determinista
  // de scenarios.ts porque contiene las reglas exactas de apertura, reconocimiento de variantes
  // (Grupo AACOM / AACOM Seguros / AACOMSoft / Acom), límite de 1 objeción y la trampa de no dar tasas/montos.
  if (moduleId === 'prospeccion' || moduleId === 'objeciones') {
    return scenario.systemPrompt;
  }

  const apiKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || '').replace(/^["']|["']$/g, '').trim();

  if (!apiKey || apiKey.length < 20) {
    return null;
  }

  try {
    const google = createGoogleGenerativeAI({ apiKey });

    const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000));

    const generationPromise = (async () => {
      const metaInstruction = `Eres el Director de Simulación de ${agencyName} (Grupo AACOM / AACOM Seguros / AACOMSoft).
Revisa el siguiente System Prompt para el módulo de Diagnóstico ADN y asegúrate de conservar intactos todos sus números financieros, etapa familiar y reglas, mejorando únicamente la fluidez conversacional mexicana:

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
    return winner;
  } catch (err) {
    console.warn('[GeminiPromptArchitect] Fallback a motor procedural local:', err);
    return null;
  }
}
