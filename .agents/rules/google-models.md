---
description: Preferencias sobre la elección de modelos de Google (Gemini 3.x)
trigger: "always_on"
---

# Preferencia de Modelos de Google

Cuando se trate de elegir o sugerir modelos de IA para el proyecto (API de Google Generative AI / Gemini):
1. Estamos en la generación **Gemini 3.x** (2026). Jamás referencies modelos obsoletos como la serie 1.x.
2. Si el objetivo es velocidad y bajo costo (evaluaciones masivas, JSON simple), usa **`gemini-3.5-flash-lite`** por defecto, ya que es la versión ligera y económica.
3. Para razonamiento avanzado o agentes, sugiere `gemini-3.8-flash` o `gemini-3.1-pro`.
4. Mantente siempre al día con los nombres correctos de la API.
