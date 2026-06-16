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

  return await prisma.client.findMany({
    where: { userId: session.user.id },
    include: { policies: true },
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

  const client = await prisma.client.create({
    data: {
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

  return await prisma.policy.findMany({
    where: { userId: session.user.id },
    include: { client: true },
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

  const policy = await prisma.policy.create({
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
      pdfUrl: parsed.pdfUrl || null,
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
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autorizado");

  const file = formData.get("file") as File;
  if (!file) throw new Error("No se proporcionó archivo");

  const blob = await put(`policies/${session.user.id}/${Date.now()}-${file.name}`, file, {
    access: "public",
  });

  return blob.url;
}

export async function deletePolicyPdf(url: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autorizado");
  
  await del(url);
  return { success: true };
}

export async function uploadPoliciesLayout(parsedData: any[]) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autorizado");

  // In real life we should wrap this in a transaction or iterate carefully
  let createdClients = 0;
  let createdPolicies = 0;

  for (const row of parsedData) {
    if (!row.clientName) continue; // Skip invalid rows

    // Find or create client
    let client = await prisma.client.findFirst({
      where: { name: row.clientName, userId: session.user.id },
    });

    if (!client) {
      client = await prisma.client.create({
        data: {
          name: row.clientName,
          email: row.email || null,
          phone: row.phone || null,
          birthDate: row.birthDate ? new Date(row.birthDate) : null,
          userId: session.user.id,
        },
      });
      createdClients++;
    }

    // Create policy if policy number exists
    if (row.policyNumber) {
      const existingPolicy = await prisma.policy.findFirst({
        where: { policyNumber: row.policyNumber },
      });

      if (!existingPolicy) {
        await prisma.policy.create({
          data: {
            policyNumber: row.policyNumber,
            clientId: client.id,
            contractor: row.clientName, // Default to client name
            insured: row.clientName,
            product: row.product || null,
            insuranceCompany: row.insuranceCompany || null,
            effectiveDate: row.effectiveDate ? new Date(row.effectiveDate) : null,
            renewalDate: row.renewalDate ? new Date(row.renewalDate) : null,
            annualPremium: row.annualPremium ? parseFloat(row.annualPremium) : 0,
            paymentMethod: row.paymentMethod || null,
            approximateCommission: row.approximateCommission ? parseFloat(row.approximateCommission) : 0,
            approximateBonus: row.approximateBonus ? parseFloat(row.approximateBonus) : 0,
            observations: row.observations || null,
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
}

