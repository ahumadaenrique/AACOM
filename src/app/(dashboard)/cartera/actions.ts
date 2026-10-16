"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { clientSchema, policySchema } from "./schema";
import {
  toUTCNoonDate,
  buildPolicyReceiptsDrafts,
} from "./dateUtils";
import { z } from "zod";
import { put, del } from "@vercel/blob";

async function getSessionContext() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autorizado");

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, agencyId: true },
  });

  const role = dbUser?.role || session.user.role || "AGENTE";
  const agencyId = (session.user.agencyId || dbUser?.agencyId || "aacom") as string;
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";

  return {
    userId: session.user.id,
    role,
    agencyId,
    isAdmin,
  };
}

function inferRamoAndVigencia(
  product?: string | null,
  company?: string | null,
  explicitRamo?: string | null,
  explicitTipo?: string | null
) {
  const p = (product || "").toLowerCase();
  const c = (company || "").toLowerCase();

  let ramo = explicitRamo || "VIDA_INDIVIDUAL";
  if (!explicitRamo) {
    if (p.includes("gmm") || p.includes("gastos med") || p.includes("salud")) {
      ramo = "GMM";
    } else if (p.includes("auto")) {
      ramo = "AUTOS";
    } else if (p.includes("grupo") || p.includes("colectiv")) {
      ramo = "VIDA_GRUPO";
    } else if (p.includes("hogar") || p.includes("daño") || p.includes("pyme")) {
      ramo = "DANOS";
    } else if (p.includes("ppr") || p.includes("retiro") || p.includes("dotal")) {
      ramo = "AHORRO_RETIRO";
    } else {
      ramo = "VIDA_INDIVIDUAL";
    }
  }

  let tipoVigencia = explicitTipo || "LARGO_PLAZO";
  if (!explicitTipo) {
    if (["GMM", "AUTOS", "VIDA_GRUPO", "DANOS"].includes(ramo)) {
      tipoVigencia = "ANUAL_RENOVABLE";
    } else if (
      c.includes("insignia") ||
      ["VIDA_INDIVIDUAL", "AHORRO_RETIRO"].includes(ramo)
    ) {
      tipoVigencia = "LARGO_PLAZO";
    }
  }

  return { ramo, tipoVigencia };
}

function mapCarteraRamoToProductionRamo(ramo?: string | null, product?: string | null): string {
  const r = (ramo || "").toUpperCase();
  const p = (product || "").toLowerCase();
  if (r === "GMM") return "Gastos Médicos";
  if (r === "AHORRO_RETIRO") {
    if (p.includes("ahorro") || p.includes("dotal") || p.includes("educa")) {
      return "Ahorro";
    }
    return "Retiro";
  }
  return "Protección";
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
    autoMarkHistoricalPaid: options.autoMarkHistoricalPaid ?? true,
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
 * Marca un recibo como PAGADO, actualiza el estatus de la póliza a VIGENTE y
 * sincroniza automáticamente con el módulo de Producción (AgentEmission) cuando es prima computable.
 */
export async function markReceiptAsPaid(data: {
  receiptId: string;
  paidDate?: string;
  paymentNotes?: string;
}) {
  const ctx = await getSessionContext();

  const receipt = await prisma.policyReceipt.findFirst({
    where: ctx.isAdmin
      ? { id: data.receiptId, agencyId: ctx.agencyId }
      : { id: data.receiptId, userId: ctx.userId },
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
  const paidYear = paidAtDate.getUTCFullYear();
  const paidMonth = paidAtDate.getUTCMonth() + 1;

  const policy = receipt.policy;
  const ramo = (policy.ramo || "VIDA_INDIVIDUAL").toUpperCase();

  // Regla de Negocio Asegurador (Etapa 2):
  // - Vida Individual / Ahorro Retiro: Computa a Producción en su Primer Año (policyYear === 1).
  // - GMM, Autos, Vida Grupo, Daños: Todos los recibos pagados computan a Producción.
  const isComputableForProduction =
    receipt.policyYear <= 1 ||
    ["GMM", "AUTOS", "VIDA_GRUPO", "DANOS"].includes(ramo);

  let syncedEmissionId = receipt.syncedEmissionId;

  if (isComputableForProduction && (receipt.amount || 0) > 0) {
    const prodRamo = mapCarteraRamoToProductionRamo(policy.ramo, policy.product);
    const companyName = (policy.insuranceCompany || "Insignia Life").trim();
    const clientName = (
      policy.contractor ||
      policy.client?.name ||
      policy.insured ||
      "Cliente Cartera"
    ).trim();

    // Buscar si existe la compañía en el catálogo de InsuranceCompany
    const companyRecord = await prisma.insuranceCompany.findFirst({
      where: {
        active: true,
        name: { equals: companyName, mode: "insensitive" },
        OR: [{ agencyId: policy.agencyId }, { agencyId: null }],
      },
    });

    if (syncedEmissionId) {
      const existingEmission = await prisma.agentEmission.findUnique({
        where: { id: syncedEmissionId },
      });
      if (existingEmission) {
        await prisma.agentEmission.update({
          where: { id: syncedEmissionId },
          data: {
            primaPagada: receipt.amount,
            primaEmitida: Math.max(existingEmission.primaEmitida, receipt.amount),
            status: "PAGADA",
            issueDate: paidAtDate,
            year: paidYear,
            month: paidMonth,
          },
        });
      } else {
        syncedEmissionId = null;
      }
    }

    if (!syncedEmissionId) {
      const createdEmission = await prisma.agentEmission.create({
        data: {
          agencyId: policy.agencyId || ctx.agencyId,
          agentId: policy.userId,
          companyId: companyRecord?.id || null,
          companyName: companyRecord?.name || companyName,
          policyNumber: `${policy.policyNumber}${
            receipt.totalInstallments > 1
              ? ` (Recibo ${receipt.receiptNumber}/${receipt.totalInstallments})`
              : ""
          }`,
          clientName,
          ramo: prodRamo,
          issueDate: paidAtDate,
          year: paidYear,
          month: paidMonth,
          primaEmitida: receipt.amount,
          primaPagada: receipt.amount,
          status: "PAGADA",
          notes:
            data.paymentNotes?.trim() ||
            `Sincronizado automáticamente desde Cartera (Año Póliza ${receipt.policyYear})`,
          createdById: ctx.userId,
        },
      });
      syncedEmissionId = createdEmission.id;
    }
  }

  const updatedReceipt = await prisma.policyReceipt.update({
    where: { id: receipt.id },
    data: {
      status: "PAGADO",
      paidAt: paidAtDate,
      paymentNotes: data.paymentNotes?.trim() || receipt.paymentNotes || null,
      syncedEmissionId,
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

  return {
    success: true,
    receipt: updatedReceipt,
    syncedToProduction: !!syncedEmissionId,
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

  // Si tenía una emisión sincronizada en Producción y se revierte el pago, eliminar la emisión sincronizada
  if (receipt.syncedEmissionId) {
    try {
      await prisma.agentEmission.delete({
        where: { id: receipt.syncedEmissionId },
      });
    } catch {
      // Ignorar si ya fue borrada manualmente en producción
    }
  }

  const updated = await prisma.policyReceipt.update({
    where: { id: receipt.id },
    data: {
      status: data.status,
      paidAt: null,
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

  return { success: true, receipt: updated };
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
    whereClause.userId = ctx.userId;
  }

  return await prisma.policy.findMany({
    where: whereClause,
    include: {
      client: true,
      user: { select: { name: true } },
      receipts: { orderBy: [{ policyYear: "asc" }, { receiptNumber: "asc" }] },
    },
    orderBy: { renewalDate: "asc" },
  });
}

export async function createPolicy(data: z.infer<typeof policySchema>) {
  const ctx = await getSessionContext();
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

  const { ramo, tipoVigencia } = inferRamoAndVigencia(
    parsed.product,
    parsed.insuranceCompany,
    parsed.ramo,
    parsed.tipoVigencia
  );

  const policy = await prisma.policy.create({
    data: {
      agencyId: ctx.agencyId,
      policyNumber: parsed.policyNumber.trim(),
      clientId: parsed.clientId || null,
      contractor: parsed.contractor?.trim() || null,
      insured: parsed.insured?.trim() || null,
      product: parsed.product?.trim() || null,
      insuranceCompany: parsed.insuranceCompany?.trim() || null,
      ramo,
      tipoVigencia,
      currency: parsed.currency || "MXN",
      originalPremium: parsed.originalPremium ?? null,
      status: parsed.status || "VIGENTE",
      subStatus: parsed.subStatus || null,
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

  // Generar recibos del ciclo actual para la nueva póliza
  await syncReceiptsForPolicy(policy, { autoMarkHistoricalPaid: true });

  revalidatePath("/cartera");
  revalidatePath("/cartera/clientes");
  if (parsed.clientId) revalidatePath(`/cartera/clientes/${parsed.clientId}`);
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

  const effectiveDateUTC = toUTCNoonDate(parsed.effectiveDate);
  const renewalDateUTC = toUTCNoonDate(parsed.renewalDate);

  const annivDay =
    parsed.anniversaryDay ||
    (effectiveDateUTC ? effectiveDateUTC.getUTCDate() : existing.anniversaryDay);
  const annivMonth =
    parsed.anniversaryMonth ||
    (effectiveDateUTC ? effectiveDateUTC.getUTCMonth() + 1 : existing.anniversaryMonth);

  const { ramo, tipoVigencia } = inferRamoAndVigencia(
    parsed.product,
    parsed.insuranceCompany,
    parsed.ramo,
    parsed.tipoVigencia
  );

  const paymentOrPremiumChanged =
    existing.paymentMethod !== (parsed.paymentMethod || null) ||
    existing.annualPremium !== (parsed.annualPremium || 0) ||
    existing.effectiveDate?.getTime() !== effectiveDateUTC?.getTime();

  const policy = await prisma.policy.update({
    where: { id },
    data: {
      policyNumber: parsed.policyNumber.trim(),
      clientId: parsed.clientId !== undefined ? (parsed.clientId || null) : existing.clientId,
      contractor: parsed.contractor?.trim() || null,
      insured: parsed.insured?.trim() || null,
      product: parsed.product?.trim() || null,
      insuranceCompany: parsed.insuranceCompany?.trim() || null,
      ramo,
      tipoVigencia,
      currency: parsed.currency || existing.currency || "MXN",
      originalPremium: parsed.originalPremium !== undefined ? parsed.originalPremium : existing.originalPremium,
      status: parsed.status || existing.status || "VIGENTE",
      subStatus: parsed.subStatus !== undefined ? (parsed.subStatus || null) : existing.subStatus,
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

  await syncReceiptsForPolicy(policy, {
    autoMarkHistoricalPaid: true,
    replacePending: paymentOrPremiumChanged,
  });

  revalidatePath("/cartera");
  revalidatePath("/cartera/clientes");
  if (existing.clientId) revalidatePath(`/cartera/clientes/${existing.clientId}`);
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
      const { ramo, tipoVigencia } = inferRamoAndVigencia(productStr, companyStr, row.ramo, row.tipoVigencia);

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
            insuranceCompany: companyStr,
            ramo,
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
 * ETAPA 3: Crea (o vincula) el Cliente + crea la Póliza + genera sus Recibos en 1 solo paso
 * a partir de la lectura inteligente de una carátula PDF.
 */
export async function createClientAndPolicyFromAi(payload: {
  existingClientId?: string | null;
  clientName: string;
  clientRfc?: string | null;
  clientEmail?: string | null;
  clientPhone?: string | null;
  clientBirthDate?: string | null;
  policyData: z.infer<typeof policySchema>;
}) {
  const ctx = await getSessionContext();

  let targetClientId = payload.existingClientId || null;

  if (!targetClientId) {
    const cleanName = (payload.clientName || payload.policyData.contractor || "Cliente").trim();
    // Buscar si ya existe un cliente con ese nombre exacto para este agente/agencia
    const existingClient = await prisma.client.findFirst({
      where: ctx.isAdmin
        ? { agencyId: ctx.agencyId, name: { equals: cleanName, mode: "insensitive" }, isArchived: false }
        : { userId: ctx.userId, name: { equals: cleanName, mode: "insensitive" }, isArchived: false },
    });

    if (existingClient) {
      targetClientId = existingClient.id;
      // Enriquecer datos del cliente si estaban vacíos
      await prisma.client.update({
        where: { id: existingClient.id },
        data: {
          rfc: existingClient.rfc || payload.clientRfc?.trim().toUpperCase() || null,
          email: existingClient.email || payload.clientEmail?.trim() || null,
          phone: existingClient.phone || payload.clientPhone?.trim() || null,
          birthDate: existingClient.birthDate || toUTCNoonDate(payload.clientBirthDate),
        },
      });
    } else {
      const createdClient = await prisma.client.create({
        data: {
          agencyId: ctx.agencyId,
          userId: ctx.userId,
          name: cleanName,
          rfc: payload.clientRfc?.trim().toUpperCase() || null,
          email: payload.clientEmail?.trim() || null,
          phone: payload.clientPhone?.trim() || null,
          birthDate: toUTCNoonDate(payload.clientBirthDate),
        },
      });
      targetClientId = createdClient.id;
    }
  }

  const createdPolicy = await createPolicy({
    ...payload.policyData,
    clientId: targetClientId,
  });

  revalidatePath("/cartera");
  revalidatePath("/cartera/clientes");
  if (targetClientId) revalidatePath(`/cartera/clientes/${targetClientId}`);

  return {
    success: true,
    clientId: targetClientId,
    policy: createdPolicy,
  };
}

