import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("No autorizado", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");
  if (!url) {
    return new NextResponse("Falta URL", { status: 400 });
  }

  const currentToken = process.env.BLOB_READ_WRITE_TOKEN;
  const oldToken = "vercel_blob_rw_lXYhGKKGWTXJIQp0_j4iwqKaJJEy88BVAadlj42H1HNYn92";
  const tokensToTry = [currentToken, oldToken].filter(Boolean) as string[];

  let response: Response | null = null;
  let errorText = "";

  try {
    for (const token of tokensToTry) {
      response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store'
      });
      if (response.ok) break;
      errorText = await response.text().catch(() => '');
    }

    if (!response || !response.ok) {
      console.error(`PDF Proxy failed for URL: ${url}. Status: ${response?.status}. Error: ${errorText}`);
      
      const htmlError = `
        <div style="font-family: sans-serif; padding: 2rem; text-align: center; color: #333;">
          <h2 style="color: #e11d48;">Error al cargar el documento</h2>
          <p>No pudimos cargar el PDF desde el servidor.</p>
          <div style="background: #f1f5f9; padding: 1rem; border-radius: 0.5rem; text-align: left; font-family: monospace; font-size: 12px; overflow-wrap: break-word;">
            <strong>URL intentada:</strong> ${url}<br/>
            <strong>Status:</strong> ${response?.status || 'Desconocido'}<br/>
            <strong>Detalle:</strong> ${errorText || 'Sin detalles adicionales'}
          </div>
        </div>
      `;
      return new NextResponse(htmlError, { 
        status: response?.status || 500,
        headers: { "Content-Type": "text/html" }
      });
    }

    return new NextResponse(response.body, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline",
      }
    });
  } catch (err: any) {
    console.error("PDF Proxy Error:", err);
    const htmlError = `
      <div style="font-family: sans-serif; padding: 2rem; text-align: center; color: #333;">
        <h2 style="color: #e11d48;">Error Interno</h2>
        <p>Hubo un fallo en el servidor al intentar procesar la URL del PDF.</p>
        <div style="background: #f1f5f9; padding: 1rem; border-radius: 0.5rem; text-align: left; font-family: monospace; font-size: 12px; overflow-wrap: break-word;">
          <strong>Error:</strong> ${err?.message || 'Error desconocido'}
        </div>
      </div>
    `;
    return new NextResponse(htmlError, { 
      status: 500,
      headers: { "Content-Type": "text/html" }
    });
  }
}
