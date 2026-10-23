import { NextRequest, NextResponse } from "next/server";
import { MANUAL_VIDEOS_CATALOG } from "@/lib/manualVideosCatalog";

const PROMO_BLOB_URL =
  "https://lxyhgkkgwtxjiqp0.private.blob.vercel-storage.com/manual-aacomsoft/video_promo_redes_sociales_aacomsoft_AAA.mp4";

export async function GET(
  req: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const key = params.key;
    const item = MANUAL_VIDEOS_CATALOG.find((v) => v.key === key);
    const targetBlobUrl =
      key === "promo" ? PROMO_BLOB_URL : item?.blobUrl;

    if (!targetBlobUrl) {
      return new NextResponse("Video no encontrado", { status: 404 });
    }

    const token =
      process.env.BLOB_READ_WRITE_TOKEN ||
      "vercel_blob_rw_lXYhGKKGWTXJIQp0_j4iwqKaJJEy88BVAadlj42H1HNYn92";

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
    };

    const range = req.headers.get("range");
    if (range) {
      headers["Range"] = range;
    }

    const upstream = await fetch(targetBlobUrl, {
      headers,
      cache: "no-store",
    });

    if (!upstream.ok && upstream.status !== 206) {
      return new NextResponse("Error al obtener video desde Vercel Blob", {
        status: upstream.status,
      });
    }

    const responseHeaders = new Headers();
    responseHeaders.set("Content-Type", "video/mp4");
    responseHeaders.set("Accept-Ranges", "bytes");
    responseHeaders.set("Cache-Control", "public, max-age=86400");

    const contentLength = upstream.headers.get("content-length");
    if (contentLength) {
      responseHeaders.set("Content-Length", contentLength);
    }

    const contentRange = upstream.headers.get("content-range");
    if (contentRange) {
      responseHeaders.set("Content-Range", contentRange);
    }

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch (err: any) {
    console.error("[ManualVideo Stream Error]:", err);
    return new NextResponse("Error interno al reproducir video", { status: 500 });
  }
}
