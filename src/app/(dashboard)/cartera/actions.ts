"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { clientSchema, policySchema } from "./schema";
import {
  toUTCNoonDate,
  buildPolicyReceiptsDrafts,
} from "./dateUtils";
import {
  classifyPolicyRamo,
  canonicalCompanyName,
  resolveImportedRowRamo,
} from "@/lib/ramosCatalog";
import { z } from "zod";
import { put, del } from "@vercel/blob";

async function getSessionContext(requestedAgencyId?: string | null) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autorizado");

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, agencyId: true },
  });

  const role = dbUser?.role || session.user.role || "AGENTE";
  const impersonateId =
    role === "SUPER_ADMIN" ? cookies().get("impersonateAgencyId")?.value : undefined;
  const superAdminRequestedAgency =
    role === "SUPER_ADMIN" &&
    requestedAgencyId &&
    requestedAgencyId !== "ALL" &&
    requestedAgencyId !== "DEFAULT"
      ? requestedAgencyId
      : undefined;
  const agencyId = (superAdminRequestedAgency ||
    impersonateId ||
    session.user.agencyId ||
    dbUser?.agencyId ||
    "aacom") as string;
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";

  return {
    userId: session.user.id,
    role,
    agencyId,
    isAdmin,
  };
}

async function shouldAutoApproveForActor(agencyId: string, isAdmin: boolean): Promise<boolean> {
  if (isAdmin) return true;
  try {
    const cfg = await prisma.setting.findUnique({
      where: { key: `ranking_config_${agencyId}` },
    });
    if (!cfg?.value) return true;
    const parsed = JSON.parse(cfg.value);
    if (parsed && parsed.requireAdminApproval === true) {
      return false;
    }
  } catch {
    // Fallback seguro: reflejo inmediato
  }
  return true;
}

export async function getCarteraFormCatalogs(targetAgencyId?: string) {
  const ctx = await getSessionContext(targetAgencyId);

  const [agencyAgents, agencyCompanies] = await Promise.all([
    prisma.user.findMany({
      where: {
        agencyId: ctx.agencyId,
        active: true,
        role: { in: ["AGENTE", "AGENTE_LITE", "ADMIN", "SUPER_ADMIN"] },
      },
      select: { id: true, name: true, email: true, role: true },
      orderBy: [{ name: "asc" }, { email: "asc" }],
    }),
    prisma.insuranceCompany.findMany({
      where: { agencyId: ctx.agencyId },
      select: { id: true, name: true, active: true, color: true },
      orderBy: [{ active: "desc" }, { order: "asc" }, { name: "asc" }],
    }),
  ]);

  return {
    isAdmin: ctx.isAdmin,
    currentUserId: ctx.userId,
    agencyId: ctx.agencyId,
    agencyAgents: agencyAgents.map((a) => ({
      id: a.id,
      name: a.name || a.email,
      email: a.email,
      role: a.role,
    })),
    agencyCompanies,
  };
}

function inferRamoAndVigencia(
  product?: string | null,
  company?: string | null,
  explicitRamo?: string | null,
  explicitTipo?: string | null,
  explicitSubRamo?: string | null,
  explicitVidaObjetivo?: string | null,
  observations?: string | null,
  contractor?: string | null
) {
  const resolved = resolveImportedRowRamo({
    ramo: explicitRamo,
    subRamo: explicitSubRamo,
    vidaObjetivo: explicitVidaObjetivo,
    product,
    insuranceCompany: company,
    observations,
    contractor,
    explicitTipoVigencia: explicitTipo,
  });

  return {
    ramo: resolved.ramo,
    subRamo: resolved.subRamo,
    vidaObjetivo: resolved.vidaObjetivo,
    tipoVigencia: resolved.tipoVigencia,
  };
}

/**
 * Genera o sincroniza los recibos del ciclo anual en curso para una póliza.
 */
export async function syncReceiptsForPolicy(
  policy: any,
  options: { autoMarkHistoricalPaid?: boolean; replacePending?: boolean } = {}
) {
  if (!policy?.id || policy.isArchived) return;
  if (policy.status === "CANCELADA" || policy.status === "TERMINADA") return;

  const drafts = buildPolicyReceiptsDrafts(policy, {
    autoMarkHistoricalPaid: options.autoMarkHistoricalPaid ?? false,
  });

  if (drafts.length === 0) return;

  if (options.replacePending) {
    // Si cambió la prima o forma de pago, borrar recibos aún no pagados del año actual para regenerarlos
    await prisma.policyReceipt.deleteMany({
      where: {
        policyId: policy.id,
        status: { in: ["PENDIENTE", "EN_GRACIA", "POR_CONFIRMAR"] },
      },
    });
  }

  await prisma.policyReceipt.createMany({
    data: drafts,
    skipDuplicates: true,
  });
}

/**
 * Asegura que todas las pólizas activas de la lista tengan su calendario de recibos generado.
 */
export async function ensurePoliciesHaveReceipts(policies: any[]) {
  const policiesWithoutReceipts = policies.filter(
    (p) =>
      !p.isArchived &&
      p.status !== "CANCELADA" &&
      p.status !== "TERMINADA" &&
      (!p.receipts || p.receipts.length === 0)
  );

  if (policiesWithoutReceipts.length === 0) return false;

  const allDrafts = policiesWithoutReceipts.flatMap((p) =>
    buildPolicyReceiptsDrafts(p, { autoMarkHistoricalPaid: true })
  );

  if (allDrafts.length > 0) {
    await prisma.policyReceipt.createMany({
      data: allDrafts,
      skipDuplicates: true,
    });
    return true;
  }

  return false;
}

/**
 * Marca un recibo como PAGADO en Pesos (MXN), actualiza el estatus de la póliza a VIGENTE y
 * alimenta en vivo Producción y Primas + Ranking directamente desde Mi Cartera
 * (sin duplicar ni mutar filas históricas de AgentEmission).
 */
export async function markReceiptAsPaid(data: {
  receiptId: string;
  paidDate?: string;
  paidAmount?: number | null;
  paymentNotes?: string;
}) {
  const ctx = await getSessionContext();

  const receipt = await prisma.policyReceipt.findFirst({
    where: ctx.isAdmin
      ? { id: data.receiptId, agencyId: ctx.agencyId }
      : {
          id: data.receiptId,
          OR: [{ userId: ctx.userId }, { policy: { sharedWithUserId: ctx.userId } }],
        },
    include: {
      policy: {
        include: { client: true },
      },
    },
  });

  if (!receipt) {
    throw new Error("Recibo no encontrado o sin permisos");
  }

  const paidAtDate = toUTCNoonDate(data.paidDate) || new Date();
  const policy = receipt.policy;
  const resolvedPaidAmount =
    data.paidAmount !== undefined &&
    data.paidAmount !== null &&
    !isNaN(Number(data.paidAmount)) &&
    Number(data.paidAmount) > 0
      ? Number(data.paidAmount)
      : Number(receipt.amount) || 0;

  const adminApproved = await shouldAutoApproveForActor(
    policy.agencyId || ctx.agencyId,
    ctx.isAdmin
  );

  const updatedReceipt = await prisma.policyReceipt.update({
    where: { id: receipt.id },
    data: {
      status: "PAGADO",
      paidAt: paidAtDate,
      paidAmount: resolvedPaidAmount,
      adminApproved: policy.adminApproved === false ? adminApproved : true,
      paymentNotes: data.paymentNotes?.trim() || receipt.paymentNotes || null,
      updatedAt: new Date(),
    },
  });

  // Si la póliza estaba en riesgo o por confirmar, devolverla a VIGENTE al recibir el pago
  if (policy.status === "EN_RIESGO" || policy.status === "POR_CONFIRMAR") {
    await prisma.policy.update({
      where: { id: policy.id },
      data: { status: "VIGENTE" },
    });
  }

  revalidatePath("/cartera");
  revalidatePath("/cartera/clientes");
  if (policy.clientId) revalidatePath(`/cartera/clientes/${policy.clientId}`);
  revalidatePath("/admin");
  revalidatePath("/admin/produccion");
  revalidatePath("/ranking");

  return {
    success: true,
    receipt: updatedReceipt,
    syncedToProduction: true,
  };
}

/**
 * Cambia el estatus de un recibo (ej. deshacer pago a PENDIENTE o marcar como NO_PAGADO).
 */
export async function updateReceiptStatus(data: {
  receiptId: string;
  status: "PENDIENTE" | "EN_GRACIA" | "POR_CONFIRMAR" | "NO_PAGADO";
}) {
  const ctx = await getSessionContext();

  const receipt = await prisma.policyReceipt.findFirst({
    where: ctx.isAdmin
      ? { id: data.receiptId, agencyId: ctx.agencyId }
      : { id: data.receiptId, userId: ctx.userId },
    include: { policy: true },
  });

  if (!receipt) {
    throw new Error("Recibo no encontrado o sin permisos");
  }

  const updated = await prisma.policyReceipt.update({
    where: { id: receipt.id },
    data: {
      status: data.status,
      paidAt: null,
      paidAmount: null,
      syncedEmissionId: null,
      updatedAt: new Date(),
    },
  });

  // Si se marca explícitamente como NO_PAGADO, poner la póliza en POR_CONFIRMAR / EN_RIESGO
  if (data.status === "NO_PAGADO" && receipt.policy.status === "VIGENTE") {
    await prisma.policy.update({
      where: { id: receipt.policyId },
      data: { status: "POR_CONFIRMAR" },
    });
  }

  revalidatePath("/cartera");
  revalidatePath("/cartera/clientes");
  if (receipt.policy.clientId) {
    revalidatePath(`/cartera/clientes/${receipt.policy.clientId}`);
  }
  revalidatePath("/admin");
  revalidatePath("/admin/produccion");
  revalidatePath("/ranking");

  return { success: true, receipt: updated };
}

export async function togglePolicyAdminApproval(policyId: string, approved: boolean) {
  const ctx = await getSessionContext();
  if (!ctx.isAdmin) {
    throw new Error("Solo un Administrador puede aprobar o desaprobar pólizas.");
  }

  const existing = await prisma.policy.findFirst({
    where: { id: policyId, agencyId: ctx.agencyId, isArchived: false },
  });
  if (!existing) throw new Error("Póliza no encontrada en tu agencia.");

  await prisma.$transaction([
    prisma.policy.update({
      where: { id: policyId },
      data: { adminApproved: approved },
    }),
    prisma.policyReceipt.updateMany({
      where: { policyId },
      data: { adminApproved: approved },
    }),
  ]);

  revalidatePath("/cartera");
  revalidatePath("/admin");
  revalidatePath("/admin/produccion");
  revalidatePath("/ranking");
  return { success: true, adminApproved: approved };
}

export async function togglePolicyRenewalFlag(policyId: string, isRenewalCapture: boolean) {
  const ctx = await getSessionContext();

  const existing = await prisma.policy.findFirst({
    where: ctx.isAdmin
      ? { id: policyId, agencyId: ctx.agencyId, isArchived: false }
      : { id: policyId, userId: ctx.userId, isArchived: false },
  });
  if (!existing) throw new Error("Póliza no encontrada o sin permisos.");

  await prisma.policy.update({
    where: { id: policyId },
    data: {
      isRenewalCapture,
      subStatus: isRenewalCapture ? "RENOVACION" : (existing.subStatus === "RENOVACION" ? null : existing.subStatus),
    },
  });

  revalidatePath("/cartera");
  revalidatePath("/admin");
  revalidatePath("/admin/produccion");
  revalidatePath("/ranking");
  return { success: true, isRenewalCapture };
}

export async function getClients() {
  const ctx = await getSessionContext();

  const whereClause: any = { isArchived: false };
  if (ctx.isAdmin) {
    whereClause.agencyId = ctx.agencyId;
  } else {
    whereClause.userId = ctx.userId;
  }

  return await prisma.client.findMany({
    where: whereClause,
    include: {
      policies: { where: { isArchived: false } },
      user: { select: { name: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function getClientById(id: string) {
  const ctx = await getSessionContext();

  return await prisma.client.findFirst({
    where: ctx.isAdmin
      ? { id, agencyId: ctx.agencyId, isArchived: false }
      : { id, userId: ctx.userId, isArchived: false },
    include: {
      policies: {
        where: { isArchived: false },
        include: {
          receipts: { orderBy: [{ policyYear: "asc" }, { receiptNumber: "asc" }] },
        },
      },
    },
  });
}

export async function createClient(data: z.infer<typeof clientSchema>) {
  const ctx = await getSessionContext();
  const parsed = clientSchema.parse(data);

  if (ctx.agencyId === "demo-agency-id") {
    const clientCount = await prisma.client.count({
      where: { agencyId: "demo-agency-id", isArchived: false },
    });
    if (clientCount >= 5) {
      throw new Error(
        "Límite de demostración alcanzado (máx. 5 clientes). Adquiere una suscripción para uso ilimitado."
      );
    }
  }

  const client = await prisma.client.create({
    data: {
      agencyId: ctx.agencyId,
      name: parsed.name.trim(),
      email: parsed.email?.trim() || null,
      phone: parsed.phone?.trim() || null,
      birthDate: toUTCNoonDate(parsed.birthDate),
      rfc: parsed.rfc?.trim().toUpperCase() || null,
      curp: parsed.curp?.trim().toUpperCase() || null,
      notes: parsed.notes?.trim() || null,
      userId: ctx.userId,
    },
  });

  revalidatePath("/cartera");
  revalidatePath("/cartera/clientes");
  return client;
}

export async function updateClient(id: string, data: z.infer<typeof clientSchema>) {
  const ctx = await getSessionContext();
  const parsed = clientSchema.parse(data);

  const existing = await prisma.client.findFirst({
    where: ctx.isAdmin
      ? { id, agencyId: ctx.agencyId }
      : { id, userId: ctx.userId },
  });
  if (!existing) throw new Error("Cliente no encontrado o sin permisos");

  const client = await prisma.client.update({
    where: { id },
    data: {
      name: parsed.name.trim(),
      email: parsed.email?.trim() || null,
      phone: parsed.phone?.trim() || null,
      birthDate: toUTCNoonDate(parsed.birthDate),
      rfc: parsed.rfc !== undefined ? (parsed.rfc?.trim().toUpperCase() || null) : existing.rfc,
      curp: parsed.curp !== undefined ? (parsed.curp?.trim().toUpperCase() || null) : existing.curp,
      notes: parsed.notes !== undefined ? (parsed.notes?.trim() || null) : existing.notes,
    },
  });

  revalidatePath("/cartera");
  revalidatePath("/cartera/clientes");
  revalidatePath(`/cartera/clientes/${id}`);
  return client;
}

export async function deleteClient(id: string) {
  const ctx = await getSessionContext();

  const existing = await prisma.client.findFirst({
    where: ctx.isAdmin
      ? { id, agencyId: ctx.agencyId }
      : { id, userId: ctx.userId },
    include: { policies: true },
  });
  if (!existing) throw new Error("Cliente no encontrado o sin permisos");

  const now = new Date();
  await prisma.$transaction([
    prisma.policy.updateMany({
      where: { clientId: id },
      data: { isArchived: true, deletedAt: now },
    }),
    prisma.client.update({
      where: { id },
      data: { isArchived: true, deletedAt: now },
    }),
  ]);

  revalidatePath("/cartera");
  revalidatePath("/cartera/clientes");
  return { success: true };
}

export async function getPolicies() {
  const ctx = await getSessionContext();

  const whereClause: any = { isArchived: false };
  if (ctx.isAdmin) {
    whereClause.agencyId = ctx.agencyId;
  } else {
    whereClause.OR = [
      { userId: ctx.userId },
      { sharedWithUserId: ctx.userId },
    ];
  }

  return await prisma.policy.findMany({
    where: whereClause,
    include: {
      client: true,
      user: { select: { name: true } },
      sharedWithUser: { select: { id: true, name: true } },
      receipts: { orderBy: [{ policyYear: "asc" }, { receiptNumber: "asc" }] },
    },
    orderBy: { renewalDate: "asc" },
  });
}

async function resolveAgencyMemberId(agencyId: string, candidateId?: string | null): Promise<string | null> {
  if (!candidateId || !candidateId.trim()) return null;
  const user = await prisma.user.findFirst({
    where: { id: candidateId.trim(), agencyId, active: true },
    select: { id: true },
  });
  return user?.id || null;
}

export async function createPolicy(
  data: z.infer<typeof policySchema>,
  targetAgencyId?: string
) {
  const ctx = await getSessionContext(targetAgencyId);
  const parsed = policySchema.parse(data);

  let ownerUserId = ctx.userId;

  if (parsed.clientId) {
    const clientExists = await prisma.client.findFirst({
      where: ctx.isAdmin
        ? { id: parsed.clientId, agencyId: ctx.agencyId }
        : { id: parsed.clientId, userId: ctx.userId },
    });
    if (!clientExists) throw new Error("Cliente no encontrado");
    ownerUserId = clientExists.userId;
  }

  // Si un Admin asigna explícitamente un Agente Titular de la agencia, usarlo
  if (ctx.isAdmin && parsed.ownerAgentId) {
    const validOwner = await resolveAgencyMemberId(ctx.agencyId, parsed.ownerAgentId);
    if (validOwner) ownerUserId = validOwner;
  }

  // Validar co-agente en póliza compartida (solo dentro de la misma agencia y distinto al titular)
  let validSharedUserId: string | null = null;
  let validSharedPct = 0;
  if (parsed.sharedWithUserId && Number(parsed.sharedPercentage) > 0) {
    const candidateShared = await resolveAgencyMemberId(ctx.agencyId, parsed.sharedWithUserId);
    if (candidateShared && candidateShared !== ownerUserId) {
      validSharedUserId = candidateShared;
      validSharedPct = Math.min(100, Math.max(0, Number(parsed.sharedPercentage) || 0));
    }
  }

  if (ctx.agencyId === "demo-agency-id") {
    const policyCount = await prisma.policy.count({
      where: { agencyId: "demo-agency-id", isArchived: false },
    });
    if (policyCount >= 5) {
      throw new Error(
        "Límite de demostración alcanzado (máx. 5 pólizas). Adquiere una suscripción para uso ilimitado."
      );
    }
  }

  const effectiveDateUTC = toUTCNoonDate(parsed.effectiveDate);
  const renewalDateUTC = toUTCNoonDate(parsed.renewalDate);

  const annivDay =
    parsed.anniversaryDay ||
    (effectiveDateUTC ? effectiveDateUTC.getUTCDate() : null);
  const annivMonth =
    parsed.anniversaryMonth ||
    (effectiveDateUTC ? effectiveDateUTC.getUTCMonth() + 1 : null);

  const { ramo, subRamo, vidaObjetivo, tipoVigencia } = inferRamoAndVigencia(
    parsed.product,
    parsed.insuranceCompany,
    parsed.ramo,
    parsed.tipoVigencia,
    parsed.subRamo,
    parsed.vidaObjetivo
  );

  const cleanCompany = parsed.insuranceCompany?.trim()
    ? canonicalCompanyName(parsed.insuranceCompany.trim())
    : null;

  const adminApproved = await shouldAutoApproveForActor(ctx.agencyId, ctx.isAdmin);
  const isRenewal = Boolean(parsed.isRenewalCapture) || parsed.subStatus === "RENOVACION";

  const policy = await prisma.policy.create({
    data: {
      agencyId: ctx.agencyId,
      policyNumber: parsed.policyNumber.trim(),
      clientId: parsed.clientId || null,
      contractor: parsed.contractor?.trim() || null,
      insured: parsed.insured?.trim() || null,
      product: parsed.product?.trim() || null,
      insuranceCompany: cleanCompany,
      ramo,
      subRamo,
      vidaObjetivo,
      tipoVigencia,
      currency: parsed.currency || "MXN",
      originalPremium: parsed.originalPremium ?? null,
      status: parsed.status || "VIGENTE",
      subStatus: isRenewal ? "RENOVACION" : (parsed.subStatus || null),
      isRenewalCapture: isRenewal,
      adminApproved,
      sharedWithUserId: validSharedUserId,
      sharedPercentage: validSharedPct,
      effectiveDate: effectiveDateUTC,
      renewalDate: renewalDateUTC,
      anniversaryDay: annivDay,
      anniversaryMonth: annivMonth,
      annualPremium: parsed.annualPremium || 0,
      paymentMethod: parsed.paymentMethod || "Anual",
      approximateCommission: parsed.approximateCommission || 0,
      approximateBonus: parsed.approximateBonus || 0,
      observations: parsed.observations?.trim() || null,
      pdfUrl: parsed.pdfUrl || null,
      userId: ownerUserId,
    },
  });

  // Generar recibos del ciclo actual SIN auto-marcar pagados si no fue confirmado
  await syncReceiptsForPolicy(policy, { autoMarkHistoricalPaid: false });

  // Si el usuario marcó "Primer recibo ya pagado", registrar el pago exacto en el Recibo #1
  if (parsed.firstReceiptPaid) {
    const firstReceipt = await prisma.policyReceipt.findFirst({
      where: { policyId: policy.id },
      orderBy: [{ policyYear: "asc" }, { receiptNumber: "asc" }],
    });
    if (firstReceipt) {
      const paidAt =
        toUTCNoonDate(parsed.firstReceiptPaidDate) ||
        effectiveDateUTC ||
        new Date();
      const paidAmount =
        parsed.firstReceiptPaidAmount !== undefined &&
        parsed.firstReceiptPaidAmount !== null &&
        Number(parsed.firstReceiptPaidAmount) > 0
          ? Number(parsed.firstReceiptPaidAmount)
          : Number(firstReceipt.amount) || 0;

      await prisma.policyReceipt.update({
        where: { id: firstReceipt.id },
        data: {
          status: "PAGADO",
          paidAt,
          paidAmount,
          adminApproved,
          paymentNotes: "Primer recibo marcado como pagado al capturar póliza",
        },
      });
    }
  }

  revalidatePath("/cartera");
  revalidatePath("/cartera/clientes");
  if (parsed.clientId) revalidatePath(`/cartera/clientes/${parsed.clientId}`);
  revalidatePath("/admin");
  revalidatePath("/admin/produccion");
  revalidatePath("/ranking");
  return policy;
}

export async function updatePolicy(id: string, data: z.infer<typeof policySchema>) {
  const ctx = await getSessionContext();
  const parsed = policySchema.parse(data);

  const existing = await prisma.policy.findFirst({
    where: ctx.isAdmin
      ? { id, agencyId: ctx.agencyId }
      : { id, userId: ctx.userId },
  });
  if (!existing) throw new Error("Póliza no encontrada o sin permisos");

  let nextOwnerUserId = existing.userId;
  if (ctx.isAdmin && parsed.ownerAgentId) {
    const validOwner = await resolveAgencyMemberId(ctx.agencyId, parsed.ownerAgentId);
    if (validOwner) nextOwnerUserId = validOwner;
  }

  let validSharedUserId: string | null = null;
  let validSharedPct = 0;
  if (parsed.sharedWithUserId && Number(parsed.sharedPercentage) > 0) {
    const candidateShared = await resolveAgencyMemberId(ctx.agencyId, parsed.sharedWithUserId);
    if (candidateShared && candidateShared !== nextOwnerUserId) {
      validSharedUserId = candidateShared;
      validSharedPct = Math.min(100, Math.max(0, Number(parsed.sharedPercentage) || 0));
    }
  }

  const effectiveDateUTC = toUTCNoonDate(parsed.effectiveDate);
  const renewalDateUTC = toUTCNoonDate(parsed.renewalDate);

  const annivDay =
    parsed.anniversaryDay ||
    (effectiveDateUTC ? effectiveDateUTC.getUTCDate() : existing.anniversaryDay);
  const annivMonth =
    parsed.anniversaryMonth ||
    (effectiveDateUTC ? effectiveDateUTC.getUTCMonth() + 1 : existing.anniversaryMonth);

  const { ramo, subRamo, vidaObjetivo, tipoVigencia } = inferRamoAndVigencia(
    parsed.product,
    parsed.insuranceCompany,
    parsed.ramo,
    parsed.tipoVigencia,
    parsed.subRamo,
    parsed.vidaObjetivo
  );

  const paymentOrPremiumChanged =
    existing.paymentMethod !== (parsed.paymentMethod || null) ||
    existing.annualPremium !== (parsed.annualPremium || 0) ||
    existing.effectiveDate?.getTime() !== effectiveDateUTC?.getTime();

  const cleanCompany = parsed.insuranceCompany?.trim()
    ? canonicalCompanyName(parsed.insuranceCompany.trim())
    : null;

  const isRenewal = Boolean(parsed.isRenewalCapture) || parsed.subStatus === "RENOVACION";

  const policy = await prisma.policy.update({
    where: { id },
    data: {
      userId: nextOwnerUserId,
      policyNumber: parsed.policyNumber.trim(),
      clientId: parsed.clientId !== undefined ? (parsed.clientId || null) : existing.clientId,
      contractor: parsed.contractor?.trim() || null,
      insured: parsed.insured?.trim() || null,
      product: parsed.product?.trim() || null,
      insuranceCompany: cleanCompany,
      ramo,
      subRamo,
      vidaObjetivo,
      tipoVigencia,
      currency: parsed.currency || existing.currency || "MXN",
      originalPremium: parsed.originalPremium !== undefined ? parsed.originalPremium : existing.originalPremium,
      status: parsed.status || existing.status || "VIGENTE",
      subStatus: isRenewal
        ? "RENOVACION"
        : parsed.subStatus !== undefined
        ? (parsed.subStatus || null)
        : existing.subStatus,
      isRenewalCapture: isRenewal,
      sharedWithUserId: validSharedUserId,
      sharedPercentage: validSharedPct,
      effectiveDate: effectiveDateUTC,
      renewalDate: renewalDateUTC,
      anniversaryDay: annivDay,
      anniversaryMonth: annivMonth,
      annualPremium: parsed.annualPremium || 0,
      paymentMethod: parsed.paymentMethod || null,
      approximateCommission: parsed.approximateCommission ?? existing.approximateCommission ?? 0,
      approximateBonus: parsed.approximateBonus ?? existing.approximateBonus ?? 0,
      observations: parsed.observations?.trim() || null,
      pdfUrl: parsed.pdfUrl !== undefined ? parsed.pdfUrl : existing.pdfUrl,
    },
  });

  if (nextOwnerUserId !== existing.userId) {
    await prisma.policyReceipt.updateMany({
      where: { policyId: id },
      data: { userId: nextOwnerUserId },
    });
  }

  await syncReceiptsForPolicy(policy, {
    autoMarkHistoricalPaid: false,
    replacePending: paymentOrPremiumChanged,
  });

  revalidatePath("/cartera");
  revalidatePath("/cartera/clientes");
  if (existing.clientId) revalidatePath(`/cartera/clientes/${existing.clientId}`);
  revalidatePath("/admin");
  revalidatePath("/admin/produccion");
  revalidatePath("/ranking");
  return policy;
}

export async function deletePolicy(id: string) {
  const ctx = await getSessionContext();

  const existing = await prisma.policy.findFirst({
    where: ctx.isAdmin
      ? { id, agencyId: ctx.agencyId }
      : { id, userId: ctx.userId },
  });
  if (!existing) throw new Error("Póliza no encontrada o sin permisos");

  await prisma.policy.update({
    where: { id },
    data: {
      isArchived: true,
      deletedAt: new Date(),
    },
  });

  revalidatePath("/cartera");
  revalidatePath("/cartera/clientes");
  if (existing.clientId) revalidatePath(`/cartera/clientes/${existing.clientId}`);
  revalidatePath("/admin");
  revalidatePath("/admin/produccion");
  revalidatePath("/ranking");
  return { success: true };
}

export async function uploadPolicyPdf(formData: FormData) {
  try {
    const ctx = await getSessionContext();

    const file = formData.get("file") as File;
    if (!file) return { error: "No se proporcionó archivo" };

    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      return { error: "Configuración de almacenamiento BLOB_READ_WRITE_TOKEN no disponible" };
    }

    const blob = await put(`policies/${ctx.userId}/${Date.now()}-${file.name}`, file, {
      access: "public",
      token,
    });

    return { success: true, url: blob.url };
  } catch (error: any) {
    console.error("Vercel Blob Upload Error:", error);
    return { error: error.message || "Error al subir a Vercel Blob" };
  }
}

export async function deletePolicyPdf(url: string) {
  try {
    await getSessionContext();
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      return { error: "Configuración de almacenamiento BLOB_READ_WRITE_TOKEN no disponible" };
    }

    await del(url, { token });
    return { success: true };
  } catch (error: any) {
    console.error("Vercel Blob Delete Error:", error);
    return { error: error.message || "Error al eliminar de Vercel Blob" };
  }
}

export async function updatePolicyPdfUrl(id: string, pdfUrl: string | null) {
  try {
    const ctx = await getSessionContext();

    const existing = await prisma.policy.findFirst({
      where: ctx.isAdmin
        ? { id, agencyId: ctx.agencyId }
        : { id, userId: ctx.userId },
    });
    if (!existing) return { error: "Póliza no encontrada o sin permisos" };

    await prisma.policy.update({
      where: { id },
      data: { pdfUrl },
    });

    revalidatePath("/cartera");
    revalidatePath("/cartera/clientes");
    if (existing.clientId) revalidatePath(`/cartera/clientes/${existing.clientId}`);
    return { success: true };
  } catch (error: any) {
    console.error("DB Update Error:", error);
    return { error: error.message || "Error al actualizar la URL en la BD" };
  }
}

export async function uploadPoliciesLayout(parsedData: any[]) {
  try {
    const ctx = await getSessionContext();

    let createdClients = 0;
    let createdPolicies = 0;
    let updatedPolicies = 0;

    const safeDateUTCNoon = (val: any): Date | null => {
      if (!val) return null;
      if (typeof val === "number") {
        const excelEpoch = new Date(Math.round((val - 25569) * 864e5));
        return toUTCNoonDate(excelEpoch);
      }

      const dateStr = String(val).trim();
      if (!dateStr) return null;

      const textDateMatch = dateStr
        .toLowerCase()
        .match(/^(\d{1,2})\s+de\s+([a-záéíóú]+)\s+(?:del?|de)\s+(\d{4})$/);
      if (textDateMatch) {
        const [, day, monthStr, year] = textDateMatch;
        const months: Record<string, number> = {
          enero: 0,
          febrero: 1,
          marzo: 2,
          abril: 3,
          mayo: 4,
          junio: 5,
          julio: 6,
          agosto: 7,
          septiembre: 8,
          octubre: 9,
          noviembre: 10,
          diciembre: 11,
        };
        if (months[monthStr] !== undefined) {
          return new Date(Date.UTC(parseInt(year, 10), months[monthStr], parseInt(day, 10), 12, 0, 0));
        }
      }

      return toUTCNoonDate(val);
    };

    const agencyId = ctx.agencyId;

    const uniqueClientNames = Array.from(
      new Set(parsedData.map((r) => (r.clientName ? String(r.clientName).trim() : "")).filter(Boolean))
    );
    const existingClients = await prisma.client.findMany({
      where: { userId: ctx.userId, name: { in: uniqueClientNames } },
    });
    const clientMap = new Map(existingClients.map((c) => [c.name, c]));

    const newClientsData = [];
    for (const name of uniqueClientNames) {
      if (!clientMap.has(name)) {
        const row = parsedData.find((r) => String(r.clientName || "").trim() === name);
        if (row) {
          newClientsData.push({
            agencyId,
            name,
            email: row.email ? String(row.email).trim() : null,
            phone: row.phone ? String(row.phone).trim() : null,
            birthDate: safeDateUTCNoon(row.birthDate),
            userId: ctx.userId,
          });
        }
      }
    }

    if (newClientsData.length > 0) {
      await prisma.client.createMany({ data: newClientsData, skipDuplicates: true });
      createdClients += newClientsData.length;

      const updatedClients = await prisma.client.findMany({
        where: { userId: ctx.userId, name: { in: uniqueClientNames } },
      });
      updatedClients.forEach((c) => clientMap.set(c.name, c));
    }

    const policyNumbers = Array.from(
      new Set(parsedData.map((r) => (r.policyNumber ? String(r.policyNumber).trim() : null)).filter(Boolean))
    );
    const existingPolicies = await prisma.policy.findMany({
      where: { policyNumber: { in: policyNumbers as string[] } },
    });
    const policyMap = new Map(existingPolicies.map((p) => [p.policyNumber, p]));

    const newPoliciesData = [];
    for (const row of parsedData) {
      const clientName = row.clientName ? String(row.clientName).trim() : "";
      const pNum = row.policyNumber ? String(row.policyNumber).trim() : "";
      if (!clientName || !pNum) continue;

      const effectiveDateUTC = safeDateUTCNoon(row.effectiveDate);
      const renewalDateUTC = safeDateUTCNoon(row.renewalDate);
      const productStr = row.product ? String(row.product).trim() : null;
      const companyStr = row.insuranceCompany ? String(row.insuranceCompany).trim() : null;
      const obsStr = row.observations ? String(row.observations).trim() : null;
      const { ramo, subRamo, vidaObjetivo, tipoVigencia } = inferRamoAndVigencia(
        productStr,
        companyStr,
        row.subRamoKey || row.ramo,
        row.tipoVigencia,
        row.subRamo,
        row.vidaObjetivo,
        obsStr,
        clientName
      );

      const annivDay = effectiveDateUTC ? effectiveDateUTC.getUTCDate() : null;
      const annivMonth = effectiveDateUTC ? effectiveDateUTC.getUTCMonth() + 1 : null;

      if (!policyMap.has(pNum)) {
        const client = clientMap.get(clientName);
        if (client) {
          newPoliciesData.push({
            agencyId,
            policyNumber: pNum,
            clientId: client.id,
            contractor: clientName,
            insured: row.insured ? String(row.insured).trim() : clientName,
            product: productStr,
            insuranceCompany: companyStr ? canonicalCompanyName(companyStr) : null,
            ramo,
            subRamo,
            vidaObjetivo,
            tipoVigencia,
            currency: row.currency ? String(row.currency).trim().toUpperCase() : "MXN",
            status: "VIGENTE",
            effectiveDate: effectiveDateUTC,
            renewalDate: renewalDateUTC,
            anniversaryDay: annivDay,
            anniversaryMonth: annivMonth,
            annualPremium: row.annualPremium
              ? parseFloat(String(row.annualPremium).replace(/[^0-9.-]+/g, "")) || 0
              : 0,
            paymentMethod: row.paymentMethod ? String(row.paymentMethod).trim() : "Anual",
            approximateCommission: row.approximateCommission
              ? parseFloat(String(row.approximateCommission).replace(/[^0-9.-]+/g, "")) || 0
              : 0,
            approximateBonus: row.approximateBonus
              ? parseFloat(String(row.approximateBonus).replace(/[^0-9.-]+/g, "")) || 0
              : 0,
            observations: row.observations ? String(row.observations).trim() : null,
            userId: ctx.userId,
          });
          policyMap.set(pNum, true as any);
        }
      } else {
        const existingPol = policyMap.get(pNum);
        if (existingPol && typeof existingPol === "object" && existingPol.userId === ctx.userId && existingPol.isArchived) {
          await prisma.policy.update({
            where: { id: existingPol.id },
            data: { isArchived: false, deletedAt: null },
          });
          updatedPolicies++;
        }
      }
    }

    if (newPoliciesData.length > 0) {
      await prisma.policy.createMany({ data: newPoliciesData, skipDuplicates: true });
      createdPolicies += newPoliciesData.length;

      // Generar recibos para las pólizas recién importadas
      const insertedPolicies = await prisma.policy.findMany({
        where: { policyNumber: { in: newPoliciesData.map((p) => p.policyNumber) } },
      });
      const allDrafts = insertedPolicies.flatMap((p) =>
        buildPolicyReceiptsDrafts(p, { autoMarkHistoricalPaid: true })
      );
      if (allDrafts.length > 0) {
        await prisma.policyReceipt.createMany({
          data: allDrafts,
          skipDuplicates: true,
        });
      }
    }

    revalidatePath("/cartera");
    revalidatePath("/cartera/clientes");
    revalidatePath("/admin");
    revalidatePath("/admin/produccion");
    revalidatePath("/ranking");
    return { success: true, createdClients, createdPolicies, updatedPolicies };
  } catch (e: any) {
    console.error("Upload error:", e);
    return { error: String(e.message || e) };
  }
}

/**
 * ETAPA 3: Extrae automáticamente los datos de una carátula PDF usando Gemini 3.5/3.8
 * y sube el archivo a Vercel Blob si está configurado.
 */
export async function extractPolicyFromPdfAction(formData: FormData) {
  try {
    const ctx = await getSessionContext();
    const file = formData.get("file") as File;
    if (!file) {
      return { error: "No se proporcionó ningún archivo PDF." };
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64Pdf = Buffer.from(arrayBuffer).toString("base64");

    // 1. Subir en paralelo a Vercel Blob si existe token
    let pdfUrl: string | null = null;
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
    if (blobToken) {
      try {
        const blob = await put(
          `policies/${ctx.userId}/${Date.now()}-${file.name}`,
          file,
          { access: "public", token: blobToken }
        );
        pdfUrl = blob.url;
      } catch (blobErr) {
        console.warn("Advertencia: no se pudo subir a Vercel Blob durante extracción IA:", blobErr);
      }
    }

    // 2. Extraer campos con Gemini
    const { extractPolicyWithGeminiFromPdfBase64 } = await import("./pdfExtractorAi");
    const extracted = await extractPolicyWithGeminiFromPdfBase64(base64Pdf, file.name);

    return {
      success: true,
      extracted,
      pdfUrl,
    };
  } catch (error: any) {
    console.error("extractPolicyFromPdfAction error:", error);
    return {
      error: error.message || "Error al analizar la carátula PDF con IA.",
    };
  }
}

/**
 * Crea (o vincula) el Cliente + crea la Póliza + genera sus Recibos en 1 solo paso
 * (con soporte para Agente Titular asignado por Admin, Póliza Compartida y Primer Recibo Pagado).
 */
export async function createClientAndPolicyFromAi(payload: {
  existingClientId?: string | null;
  clientName: string;
  clientRfc?: string | null;
  clientEmail?: string | null;
  clientPhone?: string | null;
  clientBirthDate?: string | null;
  targetAgencyId?: string;
  policyData: z.infer<typeof policySchema>;
}) {
  const ctx = await getSessionContext(payload.targetAgencyId);

  const cleanName = (payload.clientName || payload.policyData.contractor || "").trim();
  const validatedClient = clientSchema.parse({
    name: cleanName,
    email: payload.clientEmail?.trim() || "",
    phone: payload.clientPhone?.trim() || "",
    birthDate: payload.clientBirthDate || null,
    rfc: payload.clientRfc?.trim() || null,
  });

  // Validar también la póliza antes de crear el cliente para evitar crear clientes huérfanos si la póliza es inválida
  policySchema.parse(payload.policyData);

  let targetOwnerUserId = ctx.userId;
  if (ctx.isAdmin && payload.policyData.ownerAgentId) {
    const validOwner = await resolveAgencyMemberId(ctx.agencyId, payload.policyData.ownerAgentId);
    if (validOwner) targetOwnerUserId = validOwner;
  }

  let targetClientId = payload.existingClientId || null;

  if (!targetClientId) {
    const existingClient = await prisma.client.findFirst({
      where: ctx.isAdmin
        ? { agencyId: ctx.agencyId, name: { equals: validatedClient.name, mode: "insensitive" }, isArchived: false }
        : { userId: ctx.userId, name: { equals: validatedClient.name, mode: "insensitive" }, isArchived: false },
    });

    if (existingClient) {
      targetClientId = existingClient.id;
      await prisma.client.update({
        where: { id: existingClient.id },
        data: {
          rfc: existingClient.rfc || validatedClient.rfc?.trim().toUpperCase() || null,
          email: existingClient.email || validatedClient.email?.trim() || null,
          phone: existingClient.phone || validatedClient.phone?.trim() || null,
          birthDate: existingClient.birthDate || toUTCNoonDate(validatedClient.birthDate),
        },
      });
    } else {
      const createdClient = await prisma.client.create({
        data: {
          agencyId: ctx.agencyId,
          userId: targetOwnerUserId,
          name: validatedClient.name,
          rfc: validatedClient.rfc?.trim().toUpperCase() || null,
          email: validatedClient.email?.trim() || null,
          phone: validatedClient.phone?.trim() || null,
          birthDate: toUTCNoonDate(validatedClient.birthDate),
        },
      });
      targetClientId = createdClient.id;
    }
  }

  const createdPolicy = await createPolicy(
    {
      ...payload.policyData,
      clientId: targetClientId,
    },
    payload.targetAgencyId
  );

  revalidatePath("/cartera");
  revalidatePath("/cartera/clientes");
  if (targetClientId) revalidatePath(`/cartera/clientes/${targetClientId}`);

  return {
    success: true,
    clientId: targetClientId,
    policy: createdPolicy,
  };
}
