import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  getGrokbotBridgeSecurityState,
  normalizeIncomingGrokbotPayload,
  getCdmxTodayYmd,
  resolveLockedAacomAgency,
  runGrokbotIngestion,
  verifyGrokbotIngestToken,
} from "@/lib/grokbotIngestEngine";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 60;

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  "X-Content-Type-Options": "nosniff",
};

function jsonResponse(payload: unknown, status = 200) {
  return NextResponse.json(payload, {
    status,
    headers: NO_STORE_HEADERS,
  });
}

function methodNotAllowedResponse() {
  return NextResponse.json(
    {
      ok: false,
      error:
        "Método no permitido en el puente de ingesta Grokbot de aacomsoft. Usa POST para enviar lotes o GET para consultar estado.",
    },
    {
      status: 405,
      headers: {
        ...NO_STORE_HEADERS,
        Allow: "GET, POST",
      },
    }
  );
}

function extractProvidedToken(req: NextRequest): string {
  const authHeader = req.headers.get("authorization")?.trim() || "";
  if (authHeader.toLowerCase().startsWith("bearer ")) {
    return authHeader.slice(7).trim();
  }
  return req.headers.get("x-api-key")?.trim() || "";
}

export async function GET(req: NextRequest) {
  const authRes = await verifyGrokbotIngestToken(extractProvidedToken(req));
  if (!authRes.ok) {
    return jsonResponse({ ok: false, error: authRes.error }, authRes.status);
  }

  try {
    const agency = await resolveLockedAacomAgency();
    const secState = await getGrokbotBridgeSecurityState();

    const [recentBatches, quarantinedCount, unmappedAgents] = await Promise.all([
      prisma.grokbotSyncBatch.findMany({
        where: { agencyId: agency.id },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          batchDateStr: true,
          source: true,
          status: true,
          appliedCount: true,
          quarantinedCount: true,
          skippedCount: true,
          totalAppliedMxn: true,
          createdAt: true,
        },
      }),
      prisma.grokbotSyncItem.count({
        where: { agencyId: agency.id, status: "QUARANTINED" },
      }),
      prisma.grokbotAgentMap.findMany({
        where: { agencyId: agency.id, userId: null },
        select: {
          insurerKey: true,
          externalAgentCode: true,
          externalAgentName: true,
        },
      }),
    ]);

    return jsonResponse({
      ok: true,
      platform: "aacomsoft",
      agency: { id: agency.id, slug: agency.slug, name: agency.name },
      isPaused: secState.isPaused,
      quarantinedCount,
      unmappedAgentsCount: unmappedAgents.length,
      unmappedAgents,
      recentBatches,
    });
  } catch (err: any) {
    console.error("GET /api/internal/grokbot/ingest error:", err);
    return jsonResponse(
      { ok: false, error: err?.message || "Error consultando estado del puente." },
      500
    );
  }
}

export async function POST(req: NextRequest) {
  const authRes = await verifyGrokbotIngestToken(extractProvidedToken(req));
  if (!authRes.ok) {
    return jsonResponse({ ok: false, error: authRes.error }, authRes.status);
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return jsonResponse(
      {
        ok: false,
        error:
          "Body JSON inválido. Envía directamente el JSON de /primas.json, /latino/todo.json o { insignia, latino, dryRun }.",
      },
      400
    );
  }

  if (!body || typeof body !== "object") {
    return jsonResponse({ ok: false, error: "Payload vacío o inválido." }, 400);
  }

  const dryRunQuery = req.nextUrl.searchParams.get("dryRun");
  const dryRun =
    dryRunQuery === "1" ||
    dryRunQuery === "true" ||
    body?.dryRun === true;
  const allowEmpty = body?.allowEmpty === true;

  // Circuit breaker contra payloads vacíos o mal ruteados
  const preview = normalizeIncomingGrokbotPayload(body, getCdmxTodayYmd());
  if (preview.items.length === 0 && !allowEmpty) {
    return jsonResponse(
      {
        ok: false,
        error:
          "Circuit breaker: El payload no contiene registros válidos de Insignia (/primas.json) ni de La Latinoamericana (/latino/todo.json). Ningún cambio fue aplicado.",
      },
      422
    );
  }

  try {
    const result = await runGrokbotIngestion({
      payload: body,
      dryRun,
      triggeredBy: "GROKBOT_API",
    });

    if (!dryRun && result.counts.applied > 0) {
      try {
        revalidatePath("/admin");
        revalidatePath("/admin/produccion");
        revalidatePath("/cartera");
      } catch {
        // Ignore revalidation errors inside API route context
      }
    }

    return jsonResponse({
      platform: "aacomsoft",
      ...result,
    });
  } catch (err: any) {
    console.error("POST /api/internal/grokbot/ingest error:", err);
    return jsonResponse(
      { ok: false, error: err?.message || "Error interno procesando lote Grokbot." },
      500
    );
  }
}

export async function PUT() {
  return methodNotAllowedResponse();
}

export async function PATCH() {
  return methodNotAllowedResponse();
}

export async function DELETE() {
  return methodNotAllowedResponse();
}
