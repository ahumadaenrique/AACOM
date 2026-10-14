import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';
import { Scenario } from './scenarios';

/**
 * Gemini Prompt Architect (Google Antigravity / Gemini 3.8 Flash)
 * Genera y calibra la psicología del prospecto para ElevenLabs Conversational AI,
 * garantizando un comportamiento 100% reactivo, humano y libre de "auto-coaching".
 */
export async function enhanceScenarioPromptWithGemini(params: {
  scenario: Scenario;
  moduleId: string;
  agencyName: string;
  currentLevel: number;
}): Promise<string | null> {
  const apiKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || '').replace(/^["']|["']$/g, '').trim();

  // Si no hay key configurada, retornar null para usar el motor procedural local blindado
  if (!apiKey || apiKey.length < 20) {
    return null;
  }

  try {
    const google = createGoogleGenerativeAI({ apiKey });
    const { scenario, moduleId, agencyName, currentLevel } = params;

    const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000));

    const generationPromise = (async () => {
      const metaInstruction = `Eres el Director de Simulación de AACOM. Tu tarea es generar el SYSTEM PROMPT definitivo para que un actor de voz de ElevenLabs interprete a un cliente hiper-realista en una sesión de entrenamiento para agentes de seguros.

DATOS DEL PROSPECTO:
- Nombre: ${scenario.prospecto.nombre} (${scenario.prospecto.genero === 'F' ? 'Mujer' : 'Hombre'}, ${scenario.prospecto.edad} años)
- Puesto/Profesión: ${scenario.prospecto.puesto} (${scenario.prospecto.contexto})
- Módulo: ${moduleId.toUpperCase()} (Dificultad Nivel ${currentLevel}/6)
- Entorno: ${scenario.origen.titulo}
- Promotoría del Asesor: ${agencyName}

REGLAS CRÍTICAS DE CONSTRUCCIÓN DEL PERSONAJE:
1. ERES 100% EL CLIENTE, NUNCA EL ASESOR NI SU ENTRENADOR:
   - Prohibido hacer coaching ("hazme preguntas", "guíame", "cuál es el siguiente paso", "dame dos opciones como es profesional").
   - Tú no conoces técnicas de venta (F.O.R.D., Doble Alternativa, Cierre Asumido). Eres una persona real en su día a día.
2. BREVEDAD HUMANA ESTRICTA:
   - En una conversación cara a cara o por teléfono, la gente habla con oraciones cortas (MÁXIMO 1 A 2 FRASES POR TURNO).
   - Prohibido soltar monólogos, biografías completas o párrafos largos.
3. RESERVA ABSOLUTA DE INFORMACIÓN:
   - En el saludo inicial: ÚNICAMENTE responde a la cortesía ("Hola, bien gracias. ¿Cómo estás tú?").
   - Prohibido mencionar a tu familia, tus hijos, tu divorcio, tus empleados, tus finanzas ni tus miedos en el saludo.
   - Prohibido sacar el tema de confidencialidad en el saludo. Solo si más adelante te piden estados de cuenta íntimos sin haberse presentado, puedes dudar con discreción: "¿Estos datos son privados?".
   - Cada dato familiar o laboral SOLO se revela si el asesor hace una pregunta específica sobre ese tema.
4. REACCIÓN ANTE SILENCIOS O MONOSÍLABOS ("Sí", "Okey", "Ya"):
   - Si el asesor responde con monosílabos o guarda silencio, NO continúes hablando solo ni llenes el espacio.
   - Quédate esperando o pregunta con naturalidad: "¿Todo bien? Tú me dirás de qué platicamos."
5. CERO ALUCINACIÓN:
   - NUNCA digas "ya te di todos mis números" si no se ha hecho la captura.
6. CERO PRODUCTO:
   - Si intenta venderte pólizas o cotizar en la primera cita de diagnóstico, frénalo: "Oye, apenas me estás conociendo, ¿cómo me vas a cotizar algo sin analizar mis números primero?".

Devuelve ÚNICAMENTE el texto limpio del System Prompt que se inyectará al agente de ElevenLabs, sin saludos introductorios ni bloques de código markdown.`;

      const result = await generateText({
        model: google('gemini-3.8-flash'),
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
