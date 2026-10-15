import zlib from "zlib";

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

const MONTHS_ES: Record<string, string> = {
  ene: "01",
  enero: "01",
  feb: "02",
  febrero: "02",
  mar: "03",
  marzo: "03",
  abr: "04",
  abril: "04",
  may: "05",
  mayo: "05",
  jun: "06",
  junio: "06",
  jul: "07",
  julio: "07",
  ago: "08",
  agosto: "08",
  sep: "09",
  sept: "09",
  septiembre: "09",
  oct: "10",
  octubre: "10",
  nov: "11",
  noviembre: "11",
  dic: "12",
  diciembre: "12",
};

/**
 * Descomprime streams FlateDecode de un PDF en Node.js y extrae su texto plano
 * para que funcione como respaldo instantáneo si la API externa falla o tarda.
 */
function extractRawTextFromPdfBuffer(buffer: Buffer): string {
  const chunks: string[] = [];
  const rawLatin1 = buffer.toString("latin1");

  // Extraer bloques stream...endstream y descomprimirlos si son FlateDecode
  const streamRegex = /stream[\r\n]+([\s\S]*?)[\r\n]+endstream/g;
  let match: RegExpExecArray | null;
  while ((match = streamRegex.exec(rawLatin1)) !== null) {
    const streamData = Buffer.from(match[1], "latin1");
    try {
      const inflated = zlib.inflateSync(streamData).toString("latin1");
      chunks.push(inflated);
    } catch {
      try {
        const inflatedRaw = zlib.inflateRawSync(streamData).toString("latin1");
        chunks.push(inflatedRaw);
      } catch {
        // Si no está comprimido con zlib, usar contenido directo si parece texto
        chunks.push(match[1]);
      }
    }
  }

  chunks.push(rawLatin1);
  const combined = chunks.join("\n");

  // Extraer cadenas dentro de paréntesis de operadores PDF Tj / TJ
  const textTokens: string[] = [];
  const parenRegex = /\(([^()\\]*(?:\\.[^()\\]*)*)\)/g;
  let pMatch: RegExpExecArray | null;
  while ((pMatch = parenRegex.exec(combined)) !== null) {
    const cleaned = pMatch[1]
      .replace(/\\n/g, " ")
      .replace(/\\r/g, " ")
      .replace(/\\t/g, " ")
      .replace(/\\\(/g, "(")
      .replace(/\\\)/g, ")")
      .replace(/\\(\d{3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)));
    if (/[a-zA-Z0-9]{2,}/.test(cleaned)) {
      textTokens.push(cleaned);
    }
  }

  return textTokens.join(" ").replace(/\s+/g, " ").trim();
}

function parseMexicanDatesFromText(text: string): string[] {
  const results: string[] = [];

  // 1. Formato DD/MM/YYYY o DD-MM-YYYY
  const dmyRegex = /\b(0?[1-9]|[12]\d|3[01])[\/\-](0?[1-9]|1[0-2])[\/\-](20\d{2}|19\d{2})\b/g;
  let m: RegExpExecArray | null;
  while ((m = dmyRegex.exec(text)) !== null) {
    const dd = m[1].padStart(2, "0");
    const mm = m[2].padStart(2, "0");
    const yyyy = m[3];
    results.push(`${yyyy}-${mm}-${dd}`);
  }

  // 2. Formato YYYY-MM-DD
  const ymdRegex = /\b(20\d{2}|19\d{2})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])\b/g;
  while ((m = ymdRegex.exec(text)) !== null) {
    results.push(`${m[1]}-${m[2]}-${m[3]}`);
  }

  // 3. Formato DD/MMM/YYYY (ej. 15/MAR/2024 o 15 de marzo de 2024)
  const textDateRegex =
    /\b(0?[1-9]|[12]\d|3[01])(?:\s*de\s*|[\/\-\s])(ene(?:ro)?|feb(?:rero)?|mar(?:zo)?|abr(?:il)?|may(?:o)?|jun(?:io)?|jul(?:io)?|ago(?:sto)?|sep(?:t(?:iembre)?)?|oct(?:ubre)?|nov(?:iembre)?|dic(?:iembre)?)(?:\s*de\s*|[\/\-\s])(20\d{2}|19\d{2})\b/gi;
  while ((m = textDateRegex.exec(text)) !== null) {
    const dd = m[1].padStart(2, "0");
    const mm = MONTHS_ES[m[2].toLowerCase()] || "01";
    const yyyy = m[3];
    results.push(`${yyyy}-${mm}-${dd}`);
  }

  return Array.from(new Set(results));
}

function birthDateFromRfc(rfc: string): string {
  const m = rfc.match(/^[A-ZÑ&]{4}(\d{2})(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])/);
  if (!m) return "";
  const yy = parseInt(m[1], 10);
  const yyyy = yy > 25 ? 1900 + yy : 2000 + yy;
  return `${yyyy}-${m[2]}-${m[3]}`;
}

export function extractPolicyFromPdfBufferLocal(
  buffer: Buffer,
  fileName: string = "poliza.pdf"
): ExtractedPolicyData {
  const text = extractRawTextFromPdfBuffer(buffer);
  const upper = text.toUpperCase();
  const cleanFileName = fileName.replace(/\.pdf$/i, "");

  // 1. Aseguradora
  let insuranceCompany = "Insignia Life";
  if (/GNP|GRUPO NACIONAL PROVINCIAL/i.test(text) || /GNP/i.test(cleanFileName)) {
    insuranceCompany = "GNP Seguros";
  } else if (/\bAXA\b/i.test(text) || /AXA/i.test(cleanFileName)) {
    insuranceCompany = "AXA Seguros";
  } else if (/MONTERREY|SMNYL|NEW YORK LIFE/i.test(text) || /SMNYL|MONTERREY/i.test(cleanFileName)) {
    insuranceCompany = "Seguros Monterrey (SMNYL)";
  } else if (/METLIFE/i.test(text) || /METLIFE/i.test(cleanFileName)) {
    insuranceCompany = "MetLife";
  } else if (/ALLIANZ/i.test(text) || /ALLIANZ/i.test(cleanFileName)) {
    insuranceCompany = "Allianz";
  } else if (/PRUDENTIAL/i.test(text) || /PRUDENTIAL/i.test(cleanFileName)) {
    insuranceCompany = "Prudential";
  } else if (/MAPFRE/i.test(text) || /MAPFRE/i.test(cleanFileName)) {
    insuranceCompany = "Mapfre";
  } else if (/QUALITAS|QUÁLITAS/i.test(text) || /QUALITAS/i.test(cleanFileName)) {
    insuranceCompany = "Quálitas";
  } else if (/INSIGNIA/i.test(text) || /INSIGNIA/i.test(cleanFileName)) {
    insuranceCompany = "Insignia Life";
  }

  // 2. Número de póliza
  let policyNumber = "";
  const polRegex =
    /(?:P[OÓ]LIZA\s*(?:N[OÚ]M(?:ERO)?\.?|#)?|NO\.\s*DE\s*P[OÓ]LIZA)[:\s]*([A-Z0-9\-]{4,20})/i;
  const polMatch = text.match(polRegex);
  if (polMatch && !/^(DE|DEL|LA|EL|EN|CON|POR|PARA)$/i.test(polMatch[1])) {
    policyNumber = polMatch[1].trim();
  }
  if (!policyNumber) {
    const fileNumMatch = cleanFileName.match(/\b(\d{4,12}|[A-Z]{1,4}\-?\d{4,10})\b/i);
    if (fileNumMatch) policyNumber = fileNumMatch[1];
  }

  // 3. RFC y Fecha de Nacimiento
  const rfcMatch = upper.match(/\b([A-ZÑ&]{3,4}\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])[A-Z0-9]{3})\b/);
  const contractorRfc = rfcMatch ? rfcMatch[1] : "";
  const insuredBirthDate = contractorRfc ? birthDateFromRfc(contractorRfc) : "";

  // 4. Contratante / Cliente
  let contractor = "";
  const contractorMatch = text.match(
    /(?:CONTRATANTE|ASEGURADO\s*TITULAR|NOMBRE\s*DEL\s*CONTRATANTE)[:\s]+([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑa-záéíóúñ\s,\.]{5,55}?)(?=\s+(?:RFC|DOMICILIO|DIRECCI|FECHA|EDAD|SEXO|TEL|MONEDA|VIGENCIA|PRODUCTO|PLAN|\d{2}[\/\-]))/i
  );
  if (contractorMatch) {
    contractor = contractorMatch[1].replace(/\s+/g, " ").trim();
  }

  // 5. Ramo y Producto
  let ramo: ExtractedPolicyData["ramo"] = "VIDA_INDIVIDUAL";
  let tipoVigencia: ExtractedPolicyData["tipoVigencia"] = "LARGO_PLAZO";
  let product = "";

  if (/GASTOS\s*M[EÉ]DICOS|ALFA\s*MEDICAL|L[IÍ]NEA\s*AZUL|SALUD|VIP\s*M[EÉ]DICO/i.test(text)) {
    ramo = "GMM";
    tipoVigencia = "ANUAL_RENOVABLE";
    product = "Gastos Médicos Mayores";
  } else if (/AUTOM[OÓ]VIL|VEH[IÍ]CULO|SERIE\s*VIN|PLACAS|COBERTURA\s*AMPLIA/i.test(text)) {
    ramo = "AUTOS";
    tipoVigencia = "ANUAL_RENOVABLE";
    product = "Seguro de Auto";
  } else if (/RETIRO|PPR|ART[IÍ]CULO\s*151|IMAGINA\s*SER|CONSOLIDA|OPTIMAXX|DOTAL/i.test(text)) {
    ramo = "AHORRO_RETIRO";
    tipoVigencia = "LARGO_PLAZO";
    product = "Plan de Ahorro / Retiro";
  } else {
    ramo = "VIDA_INDIVIDUAL";
    tipoVigencia = "LARGO_PLAZO";
    if (/VITALICIO/i.test(text)) product = "Vitalicio";
    else if (/TEMPORAL/i.test(text)) product = "Temporal";
    else if (/ORVI/i.test(text)) product = "Orvi";
    else product = "Vida Individual";
  }

  // 6. Fechas
  const dates = parseMexicanDatesFromText(text).filter((d) => d !== insuredBirthDate);
  const effectiveDate = dates[0] || "";
  const renewalDate = dates[1] || "";

  // 7. Moneda y Forma de Pago
  let currency: ExtractedPolicyData["currency"] = "MXN";
  if (/\bUDIS?\b|UNIDADES\s*DE\s*INVERSI[OÓ]N/i.test(text)) currency = "UDI";
  else if (/\bUSD\b|D[OÓ]LARES/i.test(text)) currency = "USD";

  let paymentMethod: ExtractedPolicyData["paymentMethod"] = "Anual";
  if (/\bMENSUAL\b/i.test(text)) paymentMethod = "Mensual";
  else if (/\bTRIMESTRAL\b/i.test(text)) paymentMethod = "Trimestral";
  else if (/\bSEMESTRAL\b/i.test(text)) paymentMethod = "Semestral";

  // 8. Prima Anual
  let annualPremium = 0;
  const premiumMatches = Array.from(
    text.matchAll(/(?:PRIMA\s*(?:ANUAL|TOTAL|NETA))[^0-9$]{0,25}\$?\s*([\d,]{3,12}(?:\.\d{2})?)/gi)
  );
  if (premiumMatches.length > 0) {
    const val = parseFloat(premiumMatches[0][1].replace(/,/g, ""));
    if (!isNaN(val) && val > 0) annualPremium = val;
  }

  return {
    policyNumber,
    insuranceCompany,
    product,
    ramo,
    tipoVigencia,
    contractor,
    contractorRfc,
    contractorEmail: "",
    contractorPhone: "",
    insured: contractor,
    insuredBirthDate,
    effectiveDate,
    renewalDate,
    paymentMethod,
    currency,
    annualPremium,
    originalPremium: currency !== "MXN" && annualPremium > 0 ? annualPremium : null,
    observations: `Carátula adjunta: ${fileName}`,
  };
}

export async function extractPolicyWithGeminiFromPdfBase64(
  base64Pdf: string,
  fileName: string = "poliza.pdf"
): Promise<ExtractedPolicyData> {
  const pdfBuffer = Buffer.from(base64Pdf, "base64");
  const isLargePdf = pdfBuffer.length > 8 * 1024 * 1024;
  const extractedRawText = isLargePdf ? extractRawTextFromPdfBuffer(pdfBuffer) : "";

  const apiKey = (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    ""
  )
    .replace(/^["']|["']$/g, "")
    .trim();

  if (apiKey) {
    const candidateModels = [
      "gemini-3.5-flash-lite",
      "gemini-3.8-flash",
      "gemini-2.5-flash",
      "gemini-2.0-flash",
    ];

    const parts =
      isLargePdf && extractedRawText.length > 100
        ? [
            {
              text: `${EXTRACTION_PROMPT}\n\nARCHIVO: ${fileName}\nTEXTO EXTRAÍDO DE LA CARÁTULA DEL PDF:\n${extractedRawText.slice(0, 35000)}`,
            },
          ]
        : [
            { text: EXTRACTION_PROMPT },
            {
              inline_data: {
                mime_type: "application/pdf",
                data: isLargePdf
                  ? pdfBuffer.subarray(0, 4 * 1024 * 1024).toString("base64")
                  : base64Pdf,
              },
            },
          ];

    for (const modelName of candidateModels) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: controller.signal,
            body: JSON.stringify({
              contents: [
                {
                  role: "user",
                  parts,
                },
              ],
              generationConfig: {
                temperature: 0.1,
                responseMimeType: "application/json",
              },
            }),
          }
        );
        clearTimeout(timeoutId);

        if (!response.ok) {
          continue;
        }

        const json = await response.json();
        const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        if (!rawText) continue;

        const cleaned = rawText
          .replace(/^```json\s*/i, "")
          .replace(/```\s*$/i, "")
          .trim();
        const parsed = JSON.parse(cleaned);

        return {
          policyNumber: String(parsed.policyNumber || "").trim(),
          insuranceCompany: String(
            parsed.insuranceCompany || "Insignia Life"
          ).trim(),
          product: String(parsed.product || "").trim(),
          ramo: ([
            "VIDA_INDIVIDUAL",
            "AHORRO_RETIRO",
            "GMM",
            "AUTOS",
            "VIDA_GRUPO",
            "DANOS",
          ].includes(parsed.ramo)
            ? parsed.ramo
            : "VIDA_INDIVIDUAL") as ExtractedPolicyData["ramo"],
          tipoVigencia:
            parsed.tipoVigencia === "ANUAL_RENOVABLE"
              ? "ANUAL_RENOVABLE"
              : "LARGO_PLAZO",
          contractor: String(parsed.contractor || "").trim(),
          contractorRfc: String(parsed.contractorRfc || "")
            .trim()
            .toUpperCase(),
          contractorEmail: String(parsed.contractorEmail || "").trim(),
          contractorPhone: String(parsed.contractorPhone || "").trim(),
          insured: String(parsed.insured || parsed.contractor || "").trim(),
          insuredBirthDate: String(parsed.insuredBirthDate || "").trim(),
          effectiveDate: String(parsed.effectiveDate || "").trim(),
          renewalDate: String(parsed.renewalDate || "").trim(),
          paymentMethod: ([
            "Anual",
            "Semestral",
            "Trimestral",
            "Mensual",
            "Pago Único",
          ].includes(parsed.paymentMethod)
            ? parsed.paymentMethod
            : "Anual") as ExtractedPolicyData["paymentMethod"],
          currency: (["MXN", "UDI", "USD"].includes(parsed.currency)
            ? parsed.currency
            : "MXN") as ExtractedPolicyData["currency"],
          annualPremium: Number(parsed.annualPremium) || 0,
          originalPremium:
            parsed.originalPremium != null &&
            Number(parsed.originalPremium) > 0
              ? Number(parsed.originalPremium)
              : null,
          observations: String(
            parsed.observations || `Extraído con IA de ${fileName}`
          ).trim(),
        };
      } catch {
        clearTimeout(timeoutId);
      }
    }
  }

  // Respaldo instantáneo local (descompresión FlateDecode + heurísticas de seguros México)
  return extractPolicyFromPdfBufferLocal(pdfBuffer, fileName);
}
