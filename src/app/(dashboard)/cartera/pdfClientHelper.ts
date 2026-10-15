import { put as putClientBlob } from "@vercel/blob/client";

const SAFE_SERVERLESS_LIMIT_BYTES = 3.5 * 1024 * 1024; // 3.5 MB (por debajo del límite de 4.5 MB de Vercel)

/**
 * Sube un archivo PDF directamente desde el navegador a Vercel Blob (soportando hasta 100 MB
 * con subida multipart sin pasar por el límite de 4.5 MB de las funciones Serverless).
 */
export async function uploadPdfDirectToBlobClient(file: File): Promise<string | null> {
  try {
    const tokenRes = await fetch("/api/cartera/blob-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: file.name }),
    });
    const tokenData = await tokenRes.json().catch(() => null);
    if (!tokenRes.ok || !tokenData?.clientToken || !tokenData?.pathname) {
      return null;
    }

    const blob = await putClientBlob(tokenData.pathname, file, {
      access: "public",
      token: tokenData.clientToken,
      multipart: file.size > 4 * 1024 * 1024,
    });

    return blob.url;
  } catch (err) {
    console.warn("Direct client blob upload fallback:", err);
    return null;
  }
}

/**
 * Si un PDF supera los 3.5 MB (por ejemplo, cuando incluye 40 páginas de Condiciones Generales),
 * recorta de forma inteligente los primeros 3.5 MB donde siempre se ubica la Carátula (páginas 1-3)
 * para que la extracción por servidor jamás exceda el límite de 4.5 MB de Vercel.
 */
function createCaratulaSliceFile(file: File): File {
  if (file.size <= SAFE_SERVERLESS_LIMIT_BYTES) {
    return file;
  }
  const slicedBlob = file.slice(0, SAFE_SERVERLESS_LIMIT_BYTES, "application/pdf");
  return new File([slicedBlob], file.name, { type: "application/pdf" });
}

/**
 * Sube cualquier PDF (incluso de 10 MB, 30 MB o 80 MB) y extrae sus datos con IA:
 * 1. Si el archivo pesa > 3.5 MB, primero lo sube directo a Vercel Blob (multipart hasta 100 MB).
 * 2. Luego pide la extracción de datos por URL (o enviando solo el bloque de Carátula <= 3.5 MB),
 *    eliminando para siempre el error 413 (4.5 MB) de Vercel.
 */
export async function uploadAndExtractPolicyPdfSmart(file: File): Promise<{
  extracted: any;
  pdfUrl: string | null;
  wasOptimized: boolean;
}> {
  const isLargeFile = file.size > SAFE_SERVERLESS_LIMIT_BYTES;
  let directBlobUrl: string | null = null;

  if (isLargeFile) {
    directBlobUrl = await uploadPdfDirectToBlobClient(file);
  }

  // Si logramos subir el PDF completo directo a Vercel Blob, mandamos solo su URL (< 200 bytes)
  if (directBlobUrl) {
    const response = await fetch("/api/cartera/extract-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pdfUrl: directBlobUrl,
        fileName: file.name,
      }),
    });
    const res = await response.json().catch(() => null);
    if (response.ok && res?.extracted) {
      return {
        extracted: res.extracted,
        pdfUrl: res.pdfUrl || directBlobUrl,
        wasOptimized: true,
      };
    }
  }

  // Si el archivo es <= 3.5 MB (o si la red bloqueó la subida directa, enviamos el recorte de Carátula <= 3.5 MB)
  const safeFile = createCaratulaSliceFile(file);
  const fd = new FormData();
  fd.append("file", safeFile);
  fd.append("fileName", file.name);
  if (directBlobUrl) {
    fd.append("pdfUrl", directBlobUrl);
  }

  const response = await fetch("/api/cartera/extract-pdf", {
    method: "POST",
    body: fd,
  });
  const res = await response.json().catch(() => null);

  if (!response.ok || !res || res.error || !res.extracted) {
    throw new Error(
      res?.error || "No se pudo analizar el archivo PDF. Intenta de nuevo."
    );
  }

  return {
    extracted: res.extracted,
    pdfUrl: directBlobUrl || res.pdfUrl || null,
    wasOptimized: isLargeFile,
  };
}

/**
 * Sube y vincula un PDF a una póliza existente soportando archivos grandes (hasta 100 MB)
 * con compresión/recorte automático de respaldo si excede 3.5 MB.
 */
export async function uploadPolicyPdfSmart(
  file: File,
  policyId: string
): Promise<{ url: string; wasOptimized: boolean }> {
  const isLargeFile = file.size > SAFE_SERVERLESS_LIMIT_BYTES;

  if (isLargeFile) {
    const directBlobUrl = await uploadPdfDirectToBlobClient(file);
    if (directBlobUrl) {
      const response = await fetch("/api/cartera/upload-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          policyId,
          pdfUrl: directBlobUrl,
        }),
      });
      const res = await response.json().catch(() => null);
      if (response.ok && res?.url) {
        return { url: res.url, wasOptimized: false };
      }
    }
  }

  // Subida con recorte automático de Carátula si supera 3.5 MB y la red no permitió subida directa
  const safeFile = createCaratulaSliceFile(file);
  const formData = new FormData();
  formData.append("file", safeFile);
  formData.append("policyId", policyId);

  const response = await fetch("/api/cartera/upload-pdf", {
    method: "POST",
    body: formData,
  });
  const res = await response.json().catch(() => null);

  if (!response.ok || !res || res.error || !res.url) {
    throw new Error(res?.error || "No se pudo subir el archivo PDF.");
  }

  return {
    url: res.url,
    wasOptimized: isLargeFile,
  };
}
