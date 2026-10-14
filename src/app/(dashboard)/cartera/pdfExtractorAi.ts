export interface ExtractedPolicyData {
  policyNumber: string;
  insuranceCompany: string;
  product: string;
  ramo: "VIDA_INDIVIDUAL" | "AHORRO_RETIRO" | "GMM" | "AUTOS" | "VIDA_GRUPO" | "DANOS";
  tipoVigencia: "LARGO_PLAZO" | "ANUAL_RENOVABLE";
  contractor: string;
  contractorRfc: string;
  contractorEmail: string;
  contractorPhone: string;
  insured: string;
  insuredBirthDate: string; // YYYY-MM-DD
  effectiveDate: string; // YYYY-MM-DD
  renewalDate: string; // YYYY-MM-DD
  paymentMethod: "Anual" | "Semestral" | "Trimestral" | "Mensual" | "Pago Único";
  currency: "MXN" | "UDI" | "USD";
  annualPremium: number;
  originalPremium: number | null;
  observations: string;
}

const EXTRACTION_PROMPT = `Eres un experto suscriptor y analista de pólizas de seguros en México (Insignia Life, GNP, AXA, Seguros Monterrey New York Life, MetLife, Allianz, Prudential, Mapfre, Quálitas, Skandia, Bupa, Chubb, Zurich).
Analiza el documento PDF adjunto (carátula de póliza de seguro) y extrae con precisión quirúrgica los datos solicitados en formato JSON estricto.

REGLAS DE EXTRACCIÓN PARA MÉXICO:
1. "policyNumber": Número de póliza exacto (sin la palabra "Póliza", solo el identificador alfanumérico).
2. "insuranceCompany": Nombre comercial limpio de la aseguradora (ej. "Insignia Life", "GNP Seguros", "AXA Seguros", "Seguros Monterrey (SMNYL)", "MetLife", "Allianz", "Prudential", "Mapfre", "Quálitas").
3. "product": Nombre del plan o producto en la carátula (ej. "Temporal 20", "Orvi 99", "Vida Pagos Limitados", "Alfa Medical", "Línea Azul", "Imagina Ser").
4. "ramo": Clasifica en uno de estos valores exactos:
   - "VIDA_INDIVIDUAL" (seguros de vida protección, temporales, vitalicios, pagos limitados)
   - "AHORRO_RETIRO" (PPR, planes de retiro Art. 151/93, dotales mixtos o educativos)
   - "GMM" (Gastos Médicos Mayores o salud individual/familiar)
   - "AUTOS" (seguro de automóviles o pickups)
   - "VIDA_GRUPO" (vida colectivo o empresarial)
   - "DANOS" (hogar, empresarial, responsabilidad civil, daños)
5. "tipoVigencia":
   - "LARGO_PLAZO" si es Vida Individual o Ahorro/Retiro (plazo > 1 año, ej. 10, 15, 20 años o vitalicio).
   - "ANUAL_RENOVABLE" si es GMM, Autos, Daños o Vida Grupo de vigencia anual.
6. "contractor": Nombre completo del contratante (en formato Nombre Apellidos, capitalizado limpiamente).
7. "contractorRfc": RFC del contratante si aparece en la carátula, o "" si no aparece.
8. "contractorEmail": Correo electrónico si aparece, o "".
9. "contractorPhone": Teléfono celular/fijo si aparece, o "".
10. "insured": Nombre completo del asegurado titular (si es el mismo contratante, repite el nombre).
11. "insuredBirthDate": Fecha de nacimiento del asegurado titular en formato estricto "YYYY-MM-DD" (o "" si no aparece, o dedúcela de los dígitos del RFC si tiene formato AAMMDD válido).
12. "effectiveDate": Fecha de inicio de vigencia o fecha de emisión en formato estricto "YYYY-MM-DD".
13. "renewalDate":
    - Si es anual renovable, fecha de fin de vigencia ("YYYY-MM-DD").
    - Si es largo plazo, calcula su próximo aniversario anual o fecha de fin de vigencia que marque la carátula ("YYYY-MM-DD").
14. "paymentMethod": Uno de: "Anual", "Semestral", "Trimestral", "Mensual", "Pago Único".
15. "currency": Uno de: "MXN", "UDI", "USD".
16. "annualPremium": Prima anual total expresada en Pesos Mexicanos (MXN).
    - Si la carátula muestra Prima Neta y Prima Total Anual, usa la Prima Total Anual (o anualiza el recibo multiplicando por 12 si solo muestra el recibo mensual, 4 si es trimestral, 2 si es semestral).
    - Si la póliza está en UDI y no trae impreso el monto en MXN, multiplica las UDIs anuales por 8.45 para estimar MXN.
    - Si está en USD y no trae impreso el monto en MXN, multiplica los USD anuales por 19.50 para estimar MXN.
17. "originalPremium": Si la moneda es "UDI" o "USD", coloca aquí el monto anual en esa moneda original (ej. 3500 UDIs); si la moneda es "MXN", devuelve null.
18. "observations": Breve resumen en 1 línea con la Suma Asegurada principal y coberturas o beneficiarios relevantes (ej. "Suma Asegurada: $5,000,000 MXN • Plazo 20 años").

Devuelve ÚNICAMENTE un objeto JSON válido con esas propiedades exactas, sin bloques markdown.`;

export async function extractPolicyWithGeminiFromPdfBase64(
  base64Pdf: string,
  fileName: string = "poliza.pdf"
): Promise<ExtractedPolicyData> {
  const apiKey = (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    ""
  )
    .replace(/^["']|["']$/g, "")
    .trim();

  if (!apiKey) {
    throw new Error(
      "No se encontró la clave GEMINI_API_KEY en el servidor para analizar el PDF."
    );
  }

  // Preferencia de modelos generación Gemini 3.x (con respaldo automático)
  const candidateModels = [
    "gemini-3.5-flash-lite",
    "gemini-3.8-flash",
    "gemini-2.5-flash",
  ];

  let lastError = "";

  for (const modelName of candidateModels) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  { text: EXTRACTION_PROMPT },
                  {
                    inline_data: {
                      mime_type: "application/pdf",
                      data: base64Pdf,
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.1,
              responseMimeType: "application/json",
            },
          }),
        }
      );

      if (!response.ok) {
        const errBody = await response.text();
        lastError = `HTTP ${response.status} (${modelName}): ${errBody.slice(0, 200)}`;
        continue;
      }

      const json = await response.json();
      const rawText =
        json?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      if (!rawText) {
        lastError = `Respuesta vacía del modelo ${modelName}`;
        continue;
      }

      const cleaned = rawText
        .replace(/^```json\s*/i, "")
        .replace(/```\s*$/i, "")
        .trim();
      const parsed = JSON.parse(cleaned);

      return {
        policyNumber: String(parsed.policyNumber || "").trim(),
        insuranceCompany: String(parsed.insuranceCompany || "Insignia Life").trim(),
        product: String(parsed.product || "").trim(),
        ramo: (["VIDA_INDIVIDUAL", "AHORRO_RETIRO", "GMM", "AUTOS", "VIDA_GRUPO", "DANOS"].includes(
          parsed.ramo
        )
          ? parsed.ramo
          : "VIDA_INDIVIDUAL") as ExtractedPolicyData["ramo"],
        tipoVigencia:
          parsed.tipoVigencia === "ANUAL_RENOVABLE"
            ? "ANUAL_RENOVABLE"
            : "LARGO_PLAZO",
        contractor: String(parsed.contractor || "").trim(),
        contractorRfc: String(parsed.contractorRfc || "").trim().toUpperCase(),
        contractorEmail: String(parsed.contractorEmail || "").trim(),
        contractorPhone: String(parsed.contractorPhone || "").trim(),
        insured: String(parsed.insured || parsed.contractor || "").trim(),
        insuredBirthDate: String(parsed.insuredBirthDate || "").trim(),
        effectiveDate: String(parsed.effectiveDate || "").trim(),
        renewalDate: String(parsed.renewalDate || "").trim(),
        paymentMethod: (["Anual", "Semestral", "Trimestral", "Mensual", "Pago Único"].includes(
          parsed.paymentMethod
        )
          ? parsed.paymentMethod
          : "Anual") as ExtractedPolicyData["paymentMethod"],
        currency: (["MXN", "UDI", "USD"].includes(parsed.currency)
          ? parsed.currency
          : "MXN") as ExtractedPolicyData["currency"],
        annualPremium: Number(parsed.annualPremium) || 0,
        originalPremium:
          parsed.originalPremium != null && Number(parsed.originalPremium) > 0
            ? Number(parsed.originalPremium)
            : null,
        observations: String(parsed.observations || `Extraído con IA de ${fileName}`).trim(),
      };
    } catch (err: any) {
      lastError = err?.message || String(err);
    }
  }

  throw new Error(
    `No fue posible extraer los datos de la carátula PDF (${lastError})`
  );
}
