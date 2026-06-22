"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { clientSchema, policySchema } from "./schema";
import { z } from "zod";
import * as xlsx from "xlsx";
import { put, del } from "@vercel/blob";

export async function getClients() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autorizado");

  const whereClause: any = {};
  if ((session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN') && session.user.agencyId) {
    whereClause.agencyId = session.user.agencyId;
  } else {
    whereClause.userId = session.user.id;
  }

  return await prisma.client.findMany({
    where: whereClause,
    include: { policies: true, user: { select: { name: true } } },
    orderBy: { name: "asc" },
  });
}

export async function getClientById(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autorizado");

  return await prisma.client.findFirst({
    where: { id, userId: session.user.id },
    include: { policies: true },
  });
}

export async function createClient(data: z.infer<typeof clientSchema>) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autorizado");

  const parsed = clientSchema.parse(data);

  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id }, select: { agencyId: true } });

  const client = await prisma.client.create({
    data: {
      agencyId: dbUser?.agencyId,
      name: parsed.name,
      email: parsed.email || null,
      phone: parsed.phone || null,
      birthDate: parsed.birthDate || null,
      userId: session.user.id,
    },
  });

  revalidatePath("/cartera");
  revalidatePath("/cartera/clientes");
  return client;
}

export async function updateClient(id: string, data: z.infer<typeof clientSchema>) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autorizado");

  const parsed = clientSchema.parse(data);

  const existing = await prisma.client.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) throw new Error("Cliente no encontrado");

  const client = await prisma.client.update({
    where: { id },
    data: {
      name: parsed.name,
      email: parsed.email || null,
      phone: parsed.phone || null,
      birthDate: parsed.birthDate || null,
    },
  });

  revalidatePath("/cartera");
  revalidatePath("/cartera/clientes");
  return client;
}

export async function deleteClient(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autorizado");

  const existing = await prisma.client.findFirst({
    where: { id, userId: session.user.id },
    include: { policies: true },
  });
  if (!existing) throw new Error("Cliente no encontrado");

  for (const policy of existing.policies) {
    if (policy.pdfUrl) {
      try {
        await del(policy.pdfUrl);
      } catch (e) {
        console.error("Failed to delete blob", e);
      }
    }
  }

  await prisma.client.delete({
    where: { id },
  });

  revalidatePath("/cartera");
  revalidatePath("/cartera/clientes");
  return { success: true };
}

export async function getPolicies() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autorizado");

  const whereClause: any = {};
  if ((session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN') && session.user.agencyId) {
    whereClause.agencyId = session.user.agencyId;
  } else {
    whereClause.userId = session.user.id;
  }

  return await prisma.policy.findMany({
    where: whereClause,
    include: { client: true, user: { select: { name: true } } },
    orderBy: { renewalDate: "asc" },
  });
}

export async function createPolicy(data: z.infer<typeof policySchema>) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autorizado");

  const parsed = policySchema.parse(data);

  if (parsed.clientId) {
    const clientExists = await prisma.client.findFirst({
      where: { id: parsed.clientId, userId: session.user.id },
    });
    if (!clientExists) throw new Error("Cliente no encontrado");
  }

  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id }, select: { agencyId: true } });

  const policy = await prisma.policy.create({
    data: {
      agencyId: dbUser?.agencyId,
      policyNumber: parsed.policyNumber,
      clientId: parsed.clientId || null,
      contractor: parsed.contractor || null,
      insured: parsed.insured || null,
      product: parsed.product || null,
      insuranceCompany: parsed.insuranceCompany || null,
      effectiveDate: parsed.effectiveDate || null,
      renewalDate: parsed.renewalDate || null,
      anniversaryDay: parsed.anniversaryDay || null,
      anniversaryMonth: parsed.anniversaryMonth || null,
      annualPremium: parsed.annualPremium || 0,
      paymentMethod: parsed.paymentMethod || null,
      approximateCommission: parsed.approximateCommission || 0,
      approximateBonus: parsed.approximateBonus || 0,
      observations: parsed.observations || null,
      pdfUrl: parsed.pdfUrl || null,
      userId: session.user.id,
    },
  });

  revalidatePath("/cartera");
  revalidatePath("/cartera/clientes");
  return policy;
}

export async function updatePolicy(id: string, data: z.infer<typeof policySchema>) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autorizado");

  const parsed = policySchema.parse(data);

  const existing = await prisma.policy.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) throw new Error("Póliza no encontrada");

  const policy = await prisma.policy.update({
    where: { id },
    data: {
      policyNumber: parsed.policyNumber,
      clientId: parsed.clientId || null,
      contractor: parsed.contractor || null,
      insured: parsed.insured || null,
      product: parsed.product || null,
      insuranceCompany: parsed.insuranceCompany || null,
      effectiveDate: parsed.effectiveDate || null,
      renewalDate: parsed.renewalDate || null,
      anniversaryDay: parsed.anniversaryDay || null,
      anniversaryMonth: parsed.anniversaryMonth || null,
      annualPremium: parsed.annualPremium || 0,
      paymentMethod: parsed.paymentMethod || null,
      approximateCommission: parsed.approximateCommission || 0,
      approximateBonus: parsed.approximateBonus || 0,
      observations: parsed.observations || null,
      pdfUrl: parsed.pdfUrl !== undefined ? parsed.pdfUrl : existing.pdfUrl,
    },
  });

  revalidatePath("/cartera");
  revalidatePath("/cartera/clientes");
  return policy;
}

export async function deletePolicy(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autorizado");

  const existing = await prisma.policy.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) throw new Error("Póliza no encontrada");

  if (existing.pdfUrl) {
    try {
      await del(existing.pdfUrl);
    } catch (e) {
      console.error("Failed to delete blob", e);
    }
  }

  await prisma.policy.delete({
    where: { id },
  });

  revalidatePath("/cartera");
  revalidatePath("/cartera/clientes");
  return { success: true };
}

// Upload PDF to Vercel Blob
export async function uploadPolicyPdf(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: "No autorizado" };

    const file = formData.get("file") as File;
    if (!file) return { error: "No se proporcionó archivo" };

    const token = process.env.BLOB_READ_WRITE_TOKEN || "vercel_blob_rw_lXYhGKKGWTXJIQp0_j4iwqKaJJEy88BVAadlj42H1HNYn92";

    const blob = await put(`policies/${session.user.id}/${Date.now()}-${file.name}`, file, {
      access: "private",
      token: token,
    });

    return { success: true, url: blob.url };
  } catch (error: any) {
    console.error("Vercel Blob Upload Error:", error);
    return { error: error.message || "Error al subir a Vercel Blob" };
  }
}

export async function deletePolicyPdf(url: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: "No autorizado" };
    
    const token = process.env.BLOB_READ_WRITE_TOKEN || "vercel_blob_rw_lXYhGKKGWTXJIQp0_j4iwqKaJJEy88BVAadlj42H1HNYn92";

    await del(url, { token });
    return { success: true };
  } catch (error: any) {
    console.error("Vercel Blob Delete Error:", error);
    return { error: error.message || "Error al eliminar de Vercel Blob" };
  }
}

export async function updatePolicyPdfUrl(id: string, pdfUrl: string | null) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: "No autorizado" };

    await prisma.policy.update({
      where: { id, userId: session.user.id },
      data: { pdfUrl },
    });

    revalidatePath("/cartera");
    revalidatePath("/cartera/clientes");
    return { success: true };
  } catch (error: any) {
    console.error("DB Update Error:", error);
    return { error: error.message || "Error al actualizar la URL en la BD" };
  }
}

export async function uploadPoliciesLayout(parsedData: any[]) {
    try {
        const session = await auth();
        if (!session?.user?.id) throw new Error("No autorizado");
    
        let createdClients = 0;
        let createdPolicies = 0;

        const safeDate = (val: any) => {
            if (!val) return null;
            if (typeof val === 'number') {
                return new Date(Math.round((val - 25569) * 864e5));
            }
            const d = new Date(val);
            return isNaN(d.getTime()) ? null : d;
        };
    
        const dbUser = await prisma.user.findUnique({ where: { id: session.user.id }, select: { agencyId: true } });

        for (const row of parsedData) {
            if (!row.clientName) continue;
    
            let client = await prisma.client.findFirst({
                where: { name: row.clientName, userId: session.user.id },
            });
    
            if (!client) {
                client = await prisma.client.create({
                    data: {
                        agencyId: dbUser?.agencyId,
                        name: row.clientName,
                        email: row.email ? String(row.email) : null,
                        phone: row.phone ? String(row.phone) : null,
                        birthDate: safeDate(row.birthDate),
                        userId: session.user.id,
                    },
                });
                createdClients++;
            }
    
            if (row.policyNumber) {
                const existingPolicy = await prisma.policy.findFirst({
                    where: { policyNumber: String(row.policyNumber) },
                });
    
                if (!existingPolicy) {
                    await prisma.policy.create({
                        data: {
                            agencyId: dbUser?.agencyId,
                            policyNumber: String(row.policyNumber),
                            clientId: client.id,
                            contractor: row.clientName,
                            insured: row.clientName,
                            product: row.product ? String(row.product) : null,
                            insuranceCompany: row.insuranceCompany ? String(row.insuranceCompany) : null,
                            effectiveDate: safeDate(row.effectiveDate),
                            renewalDate: safeDate(row.renewalDate),
                            annualPremium: row.annualPremium ? parseFloat(String(row.annualPremium).replace(/[^0-9.-]+/g, "")) || 0 : 0,
                            paymentMethod: row.paymentMethod ? String(row.paymentMethod) : null,
                            approximateCommission: row.approximateCommission ? parseFloat(String(row.approximateCommission).replace(/[^0-9.-]+/g, "")) || 0 : 0,
                            approximateBonus: row.approximateBonus ? parseFloat(String(row.approximateBonus).replace(/[^0-9.-]+/g, "")) || 0 : 0,
                            observations: row.observations ? String(row.observations) : null,
                            userId: session.user.id,
                        },
                    });
                    createdPolicies++;
                }
            }
        }
    
        revalidatePath("/cartera");
        revalidatePath("/cartera/clientes");
        return { success: true, createdClients, createdPolicies };
    } catch (e: any) {
        console.error("Upload error:", e);
        return { error: String(e.message || e) };
    }
}



