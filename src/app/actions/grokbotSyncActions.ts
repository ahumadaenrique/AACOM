"use server";

import crypto from "crypto";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  GROKBOT_SETTING_KEYS,
  InsurerKey,
  applyQuarantinedItems,
  getCdmxTodayYmd,
  getGrokbotBridgeSecurityState,
  normalizeIncomingGrokbotPayload,
  previewRollbackByDateRange,
  resolveLockedAacomAgency,
  rollbackBatchById,
  rollbackByDateRange,
  runGrokbotIngestion,
} from "@/lib/grokbotIngestEngine";

async function verifyAacomExclusiveAdmin() {
  const session = await auth();
  if (!session?.user?.email) {
    throw new Error("No autenticado.");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true, agencyId: true, name: true, active: true },
  });

  if (!user || !user.active || user.role !== "SUPER_ADMIN") {
    throw new Error("Acceso exclusivo para Super Administrador.");
  }

  const aacomAgency = await resolveLockedAacomAgency();
  const impersonateId = cookies().get("impersonateAgencyId")?.value;

  if (impersonateId && impersonateId !== aacomAgency.id) {
    throw new Error("El puente Grokbot solo está disponible dentro de la promotoría titular.");
  }

  return { user, agency: aacomAgency };
}

function revalidateProductionPaths() {
  revalidatePath("/admin");
  revalidatePath("/admin/produccion");
  revalidatePath("/cartera");
}

export async function getGrokbotBridgeDashboard() {
  try {
    const { agency } = await verifyAacomExclusiveAdmin();
    const todayYmd = getCdmxTodayYmd();

    const [
      security,
      agents,
      agentMaps,
      quarantinedItems,
      batches,
      appliedTotals,
      todayTotals,
    ] = await Promise.all([
      getGrokbotBridgeSecurityState(),
      prisma.user.findMany({
        where: {
          agencyId: agency.id,
          active: true,
          role: { in: ["AGENTE", "AGENTE_LITE", "ADMIN", "SUPER_ADMIN"] },
        },
        select: { id: true, name: true, email: true, role: true },
        orderBy: { name: "asc" },
      }),
      prisma.grokbotAgentMap.findMany({
        where: { agencyId: agency.id },
        orderBy: [{ insurerKey: "asc" }, { externalAgentName: "asc" }],
      }),
      prisma.grokbotSyncItem.findMany({
        where: { agencyId: agency.id, status: "QUARANTINED" },
        orderBy: [{ createdAt: "desc" }],
        take: 150,
        select: {
          id: true,
          batchId: true,
          insurerKey: true,
          itemType: true,
          policyNumber: true,
          receiptRef: true,
          clientName: true,
          externalAgentCode: true,
          externalAgentName: true,
          secondaryAgentCode: true,
          amountMxn: true,
          eventDateStr: true,
          quarantineReason: true,
          createdAt: true,
        },
      }),
      prisma.grokbotSyncBatch.findMany({
        where: { agencyId: agency.id },
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
      prisma.grokbotSyncItem.aggregate({
        where: { agencyId: agency.id, status: "APPLIED" },
        _count: { _all: true },
        _sum: { amountMxn: true },
      }),
      prisma.grokbotSyncItem.aggregate({
        where: {
          agencyId: agency.id,
          status: "APPLIED",
          appliedDateStr: todayYmd,
        },
        _count: { _all: true },
        _sum: { amountMxn: true },
      }),
    ]);

    // Contar cuántos items en cuarentena esperan por cada código externo
    const pendingByAgentKey = new Map<string, number>();
    for (const q of quarantinedItems) {
      const k1 = `${q.insurerKey}:${q.externalAgentCode}`;
      pendingByAgentKey.set(k1, (pendingByAgentKey.get(k1) || 0) + 1);
      if (q.secondaryAgentCode) {
        const k2 = `${q.insurerKey}:${q.secondaryAgentCode}`;
        pendingByAgentKey.set(k2, (pendingByAgentKey.get(k2) || 0) + 1);
      }
    }

    const enrichedMaps = agentMaps.map((m) => ({
      ...m,
      pendingCount: pendingByAgentKey.get(`${m.insurerKey}:${m.externalAgentCode}`) || 0,
    }));

    return {
      success: true,
      agency,
      todayYmd,
      security: {
        hasEnvKey: security.hasEnvKey,
        hasDbKey: security.hasDbKey,
        keyHint: security.keyHint,
        isPaused: security.isPaused,
      },
      agents,
      agentMaps: enrichedMaps,
      quarantinedItems,
      batches,
      stats: {
        totalAppliedItems: appliedTotals._count._all || 0,
        totalAppliedMxn: Number((appliedTotals._sum.amountMxn || 0).toFixed(2)),
        todayAppliedItems: todayTotals._count._all || 0,
        todayAppliedMxn: Number((todayTotals._sum.amountMxn || 0).toFixed(2)),
        totalQuarantined: quarantinedItems.length,
        unmappedCodesCount: agentMaps.filter((m) => !m.userId).length,
      },
    };
  } catch (err: any) {
    console.error("getGrokbotBridgeDashboard error:", err);
    return {
      success: false,
      message: err?.message || "No se pudo cargar el panel del puente Grokbot.",
    };
  }
}

export async function generateOrRotateGrokbotIngestKey() {
  try {
    await verifyAacomExclusiveAdmin();

    const plainKey = `grok_live_${crypto.randomBytes(28).toString("hex")}`;
    const sha256 = crypto.createHash("sha256").update(plainKey, "utf8").digest("hex");
    const stamp = new Date().toLocaleString("es-MX", {
      timeZone: "America/Mexico_City",
      dateStyle: "short",
      timeStyle: "short",
    });
    const keyHint = `${plainKey.slice(0, 14)}...${plainKey.slice(-6)} (${stamp})`;

    await prisma.$transaction([
      prisma.setting.upsert({
        where: { key: GROKBOT_SETTING_KEYS.KEY_SHA256 },
        create: { key: GROKBOT_SETTING_KEYS.KEY_SHA256, value: sha256 },
        update: { value: sha256 },
      }),
      prisma.setting.upsert({
        where: { key: GROKBOT_SETTING_KEYS.KEY_HINT },
        create: { key: GROKBOT_SETTING_KEYS.KEY_HINT, value: keyHint },
        update: { value: keyHint },
      }),
      prisma.setting.upsert({
        where: { key: GROKBOT_SETTING_KEYS.PAUSED },
        create: { key: GROKBOT_SETTING_KEYS.PAUSED, value: "false" },
        update: { value: "false" },
      }),
    ]);

    return { success: true, plainKey, keyHint };
  } catch (err: any) {
    console.error("generateOrRotateGrokbotIngestKey error:", err);
    return { success: false, message: err?.message || "Error generando API Key." };
  }
}

export async function toggleGrokbotIngestPause(paused: boolean) {
  try {
    await verifyAacomExclusiveAdmin();
    await prisma.setting.upsert({
      where: { key: GROKBOT_SETTING_KEYS.PAUSED },
      create: { key: GROKBOT_SETTING_KEYS.PAUSED, value: paused ? "true" : "false" },
      update: { value: paused ? "true" : "false" },
    });
    return { success: true, isPaused: paused };
  } catch (err: any) {
    return { success: false, message: err?.message || "Error cambiando estado de pausa." };
  }
}

export async function saveGrokbotAgentMapping(input: {
  insurerKey: InsurerKey;
  externalAgentCode: string;
  externalAgentName?: string | null;
  userId: string | null;
  applyPending?: boolean;
}) {
  try {
    const { user, agency } = await verifyAacomExclusiveAdmin();
    const code = input.externalAgentCode.trim();
    if (!code) throw new Error("Código externo inválido.");

    if (input.userId) {
      const targetUser = await prisma.user.findFirst({
        where: { id: input.userId, agencyId: agency.id, active: true },
        select: { id: true },
      });
      if (!targetUser) {
        throw new Error("El asesor seleccionado no pertenece a la promotoría titular.");
      }
    }

    await prisma.grokbotAgentMap.upsert({
      where: {
        agencyId_insurerKey_externalAgentCode: {
          agencyId: agency.id,
          insurerKey: input.insurerKey,
          externalAgentCode: code,
        },
      },
      create: {
        agencyId: agency.id,
        insurerKey: input.insurerKey,
        externalAgentCode: code,
        externalAgentName: input.externalAgentName || null,
        userId: input.userId || null,
        autoMatched: false,
        updatedById: user.id,
      },
      update: {
        userId: input.userId || null,
        autoMatched: false,
        updatedById: user.id,
      },
    });

    let appliedPendingCount = 0;
    if (input.applyPending && input.userId) {
      const res = await applyQuarantinedItems({
        insurerKey: input.insurerKey,
        externalAgentCode: code,
      });
      appliedPendingCount = res.appliedCount;
      if (appliedPendingCount > 0) {
        revalidateProductionPaths();
      }
    }

    return { success: true, appliedPendingCount };
  } catch (err: any) {
    console.error("saveGrokbotAgentMapping error:", err);
    return {
      success: false,
      message: err?.message || "No se pudo guardar el mapeo de agente.",
    };
  }
}

export async function resolveQuarantinedItemAction(input: {
  itemId: string;
  action: "APPROVE" | "IGNORE";
}) {
  try {
    const { agency } = await verifyAacomExclusiveAdmin();

    const item = await prisma.grokbotSyncItem.findFirst({
      where: { id: input.itemId, agencyId: agency.id, status: "QUARANTINED" },
      select: { id: true, batchId: true },
    });
    if (!item) {
      throw new Error("Registro en cuarentena no encontrado o ya resuelto.");
    }

    if (input.action === "IGNORE") {
      await prisma.grokbotSyncItem.update({
        where: { id: item.id },
        data: { status: "IGNORED" },
      });

      const remainingApplied = await prisma.grokbotSyncItem.count({
        where: { batchId: item.batchId, status: "APPLIED" },
      });
      const remainingQuar = await prisma.grokbotSyncItem.count({
        where: { batchId: item.batchId, status: "QUARANTINED" },
      });
      await prisma.grokbotSyncBatch.update({
        where: { id: item.batchId },
        data: {
          quarantinedCount: remainingQuar,
          status:
            remainingApplied > 0 && remainingQuar > 0
              ? "PARTIAL_QUARANTINE"
              : remainingApplied > 0
              ? "APPLIED"
              : remainingQuar > 0
              ? "QUARANTINED_ONLY"
              : "NO_CHANGES",
        },
      });
      return { success: true, appliedCount: 0 };
    }

    const res = await applyQuarantinedItems({
      itemIds: [item.id],
      forceApproveAnomalies: true,
    });

    if (res.appliedCount === 0) {
      const updated = await prisma.grokbotSyncItem.findUnique({
        where: { id: item.id },
        select: { quarantineReason: true },
      });
      return {
        success: false,
        message:
          updated?.quarantineReason === "UNMAPPED_AGENT" ||
          updated?.quarantineReason === "UNMAPPED_SHARED_AGENT"
            ? "Primero asigna el código de agente externo al asesor correspondiente en la tabla superior."
            : `No se pudo aplicar (${updated?.quarantineReason || "revisa motivo"}).`,
      };
    }

    revalidateProductionPaths();
    return { success: true, appliedCount: res.appliedCount };
  } catch (err: any) {
    console.error("resolveQuarantinedItemAction error:", err);
    return {
      success: false,
      message: err?.message || "Error al resolver registro en cuarentena.",
    };
  }
}

export async function runManualGrokbotJsonIngest(input: {
  rawJsonText: string;
  dryRun: boolean;
}) {
  try {
    await verifyAacomExclusiveAdmin();
    let parsed: any;
    try {
      parsed = JSON.parse(input.rawJsonText);
    } catch {
      return { success: false, message: "El texto o archivo proporcionado no es un JSON válido." };
    }

    const preview = normalizeIncomingGrokbotPayload(parsed, getCdmxTodayYmd());
    if (preview.items.length === 0) {
      return {
        success: false,
        message:
          "No se detectaron registros de Insignia (/primas.json) ni de La Latinoamericana (/latino/todo.json) dentro del JSON.",
      };
    }

    const result = await runGrokbotIngestion({
      payload: parsed,
      dryRun: input.dryRun,
      triggeredBy: "ADMIN_UI",
    });

    if (!input.dryRun && result.counts.applied > 0) {
      revalidateProductionPaths();
    }

    return { success: true, result };
  } catch (err: any) {
    console.error("runManualGrokbotJsonIngest error:", err);
    return { success: false, message: err?.message || "Error procesando JSON manual." };
  }
}

export async function previewGrokbotRollbackByDateAction(input: {
  fromDateStr: string;
  toDateStr?: string;
  dateField?: "appliedDateStr" | "eventDateStr";
}) {
  try {
    await verifyAacomExclusiveAdmin();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.fromDateStr)) {
      throw new Error("Fecha inicial inválida (usa formato YYYY-MM-DD).");
    }
    const toDate = input.toDateStr?.trim() || input.fromDateStr;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(toDate)) {
      throw new Error("Fecha final inválida (usa formato YYYY-MM-DD).");
    }

    const preview = await previewRollbackByDateRange({
      fromDateStr: input.fromDateStr,
      toDateStr: toDate,
      dateField: input.dateField || "appliedDateStr",
    });
    return { success: true, preview };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || "No se pudo calcular la previsualización del rollback.",
    };
  }
}

export async function executeGrokbotRollbackByDateAction(input: {
  fromDateStr: string;
  toDateStr?: string;
  dateField?: "appliedDateStr" | "eventDateStr";
}) {
  try {
    const { user } = await verifyAacomExclusiveAdmin();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.fromDateStr)) {
      throw new Error("Fecha inicial inválida.");
    }
    const toDate = input.toDateStr?.trim() || input.fromDateStr;
    const summary = await rollbackByDateRange({
      fromDateStr: input.fromDateStr,
      toDateStr: toDate,
      dateField: input.dateField || "appliedDateStr",
      adminUserId: user.id,
    });
    revalidateProductionPaths();
    return { success: true, summary };
  } catch (err: any) {
    console.error("executeGrokbotRollbackByDateAction error:", err);
    return { success: false, message: err?.message || "Error ejecutando rollback por fecha." };
  }
}

export async function executeGrokbotRollbackBatchAction(batchId: string) {
  try {
    const { user } = await verifyAacomExclusiveAdmin();
    const summary = await rollbackBatchById({
      batchId,
      adminUserId: user.id,
    });
    revalidateProductionPaths();
    return { success: true, summary };
  } catch (err: any) {
    console.error("executeGrokbotRollbackBatchAction error:", err);
    return { success: false, message: err?.message || "Error revirtiendo lote." };
  }
}
