"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { clientSchema, policySchema } from "./schema";
import { toUTCNoonDate } from "./dateUtils";
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

function inferRamoAndVigencia(product?: string | null, company?: string | null, explicitRamo?: string | null, explicitTipo?: string | null) {
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
    } else if (c.includes("insignia") || ["VIDA_INDIVIDUAL", "AHORRO_RETIRO"].includes(ramo)) {
      tipoVigencia = "LARGO_PLAZO";
    }
  }

  return { ramo, tipoVigencia };
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
      policies: { where: { isArchived: false } },
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

/**
 * Baja lógica (Soft Delete / Archivo) de cliente y sus pólizas (corrige BUG-06).
 * Preserva el historial y evita pérdidas accidentales en cascada.
 */
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
    include: { client: true, user: { select: { name: true } } },
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
      paymentMethod: parsed.paymentMethod || null,
      approximateCommission: parsed.approximateCommission || 0,
      approximateBonus: parsed.approximateBonus || 0,
      observations: parsed.observations?.trim() || null,
      pdfUrl: parsed.pdfUrl || null,
      userId: ownerUserId,
    },
  });

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

  revalidatePath("/cartera");
  revalidatePath("/cartera/clientes");
  if (existing.clientId) revalidatePath(`/cartera/clientes/${existing.clientId}`);
  return policy;
}

/**
 * Baja lógica (Soft Delete / Archivo) de una póliza (corrige BUG-06).
 * Evita pérdida irreparable de datos y documentos por clics accidentales.
 */
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

// Upload PDF to Vercel Blob
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
        // Número serial de fecha de Excel
        const excelEpoch = new Date(Math.round((val - 25569) * 864e5));
        return toUTCNoonDate(excelEpoch);
      }

      const dateStr = String(val).trim();
      if (!dateStr) return null;

      // Intento 1: Textos en español como "19 de agosto de 2026"
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

    // 1. Obtener todos los clientes existentes del usuario
    const uniqueClientNames = Array.from(
      new Set(parsedData.map((r) => (r.clientName ? String(r.clientName).trim() : "")).filter(Boolean))
    );
    const existingClients = await prisma.client.findMany({
      where: { userId: ctx.userId, name: { in: uniqueClientNames } },
    });
    const clientMap = new Map(existingClients.map((c) => [c.name, c]));

    // 2. Crear clientes faltantes
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

    // 3. Obtener todas las pólizas existentes (por número de póliza)
    const policyNumbers = Array.from(
      new Set(parsedData.map((r) => (r.policyNumber ? String(r.policyNumber).trim() : null)).filter(Boolean))
    );
    const existingPolicies = await prisma.policy.findMany({
      where: { policyNumber: { in: policyNumbers as string[] } },
    });
    const policyMap = new Map(existingPolicies.map((p) => [p.policyNumber, p]));

    // 4. Crear o reactivar pólizas
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
            paymentMethod: row.paymentMethod ? String(row.paymentMethod).trim() : null,
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
    }

    revalidatePath("/cartera");
    revalidatePath("/cartera/clientes");
    return { success: true, createdClients, createdPolicies, updatedPolicies };
  } catch (e: any) {
    console.error("Upload error:", e);
    return { error: String(e.message || e) };
  }
}
