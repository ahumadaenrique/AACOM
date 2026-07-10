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

  const token = process.env.BLOB_READ_WRITE_TOKEN || "vercel_blob_rw_lXYhGKKGWTXJIQp0_j4iwqKaJJEy88BVAadlj42H1HNYn92";

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error(`PDF Proxy failed for URL: ${url}. Status: ${response.status}. Error: ${errorText}`);
      return new NextResponse(`Error al obtener PDF del servidor: HTTP ${response.status} - ${errorText}`, { status: response.status });
    }

    return new NextResponse(response.body, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline",
      }
    });
  } catch (err) {
    console.error("PDF Proxy Error:", err);
    return new NextResponse("Error interno al obtener el PDF", { status: 500 });
  }
}
