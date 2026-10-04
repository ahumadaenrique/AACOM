"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { RAMOS_CATALOGO, DEFAULT_COMPANIES, MONTH_NAMES_ES } from "@/lib/productionConstants";


// Helper to check admin access
async function verifyAdminUser() {
  const session = await auth();
  if (!session?.user?.email) throw new Error("No autenticado");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true, agencyId: true, name: true },
  });

  if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
    throw new Error("Acceso restringido para administradores.");
  }

  return user;
}

// 1. Obtener o Sembrar Compañías de Seguros
export async function getInsuranceCompanies(agencyId?: string) {
  try {
    const user = await verifyAdminUser();
    const effectiveAgencyId = user.role === "SUPER_ADMIN" ? (agencyId || user.agencyId) : user.agencyId;

    let companies = await prisma.insuranceCompany.findMany({
      where: {
        OR: [
          { agencyId: effectiveAgencyId },
          { agencyId: null },
        ],
      },
      orderBy: [{ order: "asc" }, { name: "asc" }],
    });

    // Seed default companies if table is completely empty
    if (companies.length === 0) {
      for (const comp of DEFAULT_COMPANIES) {
        await prisma.insuranceCompany.create({
          data: {
            agencyId: effectiveAgencyId,
            name: comp.name,
            color: comp.color,
            order: comp.order,
            active: true,
          },
        });
      }
      companies = await prisma.insuranceCompany.findMany({
        where: {
          OR: [
            { agencyId: effectiveAgencyId },
            { agencyId: null },
          ],
        },
        orderBy: [{ order: "asc" }, { name: "asc" }],
      });
    }

    return { success: true, companies };
  } catch (error: any) {
    console.error("Error getInsuranceCompanies:", error);
    return { success: false, message: error.message || "Error al cargar compañías", companies: [] };
  }
}

// 2. Guardar o Editar Compañía de Seguros
export async function saveInsuranceCompany(data: {
  id?: string;
  name: string;
  logoUrl?: string;
  color?: string;
  order?: number;
  active?: boolean;
}) {
  try {
    const user = await verifyAdminUser();
    const nameTrimmed = data.name.trim();
    if (!nameTrimmed) throw new Error("El nombre de la compañía es obligatorio.");

    if (data.id) {
      const updated = await prisma.insuranceCompany.update({
        where: { id: data.id },
        data: {
          name: nameTrimmed,
          ...(data.logoUrl !== undefined && { logoUrl: data.logoUrl }),
          ...(data.color !== undefined && { color: data.color }),
          ...(data.order !== undefined && { order: data.order }),
          ...(data.active !== undefined && { active: data.active }),
        },
      });
      revalidatePath("/admin");
      return { success: true, company: updated };
    } else {
      const created = await prisma.insuranceCompany.create({
        data: {
          agencyId: user.agencyId,
          name: nameTrimmed,
          logoUrl: data.logoUrl || null,
          color: data.color || "#0284c7",
          order: data.order ?? 0,
          active: data.active ?? true,
        },
      });
      revalidatePath("/admin");
      return { success: true, company: created };
    }
  } catch (error: any) {
    console.error("Error saveInsuranceCompany:", error);
    return { success: false, message: error.message || "Error al guardar aseguradora" };
  }
}

// 3. Eliminar Compañía de Seguros
export async function deleteInsuranceCompany(companyId: string) {
  try {
    await verifyAdminUser();
    await prisma.insuranceCompany.delete({ where: { id: companyId } });
    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleteInsuranceCompany:", error);
    return { success: false, message: error.message || "Error al eliminar compañía" };
  }
}

// 4. Crear Emisión Manual de Póliza
export async function createEmission(data: {
  agentId: string;
  companyId?: string;
  companyName: string;
  policyNumber?: string;
  clientName?: string;
  ramo?: string;
  issueDate: string; // "YYYY-MM-DD"
  primaEmitida: number;
  primaPagada: number;
  status?: string;
  notes?: string;
}) {
  try {
    const user = await verifyAdminUser();

    if (!data.agentId) throw new Error("Debes seleccionar un agente.");
    if (!data.companyName?.trim()) throw new Error("Debes especificar la aseguradora.");

    const dateObj = new Date(data.issueDate || Date.now());
    if (isNaN(dateObj.getTime())) throw new Error("Fecha de emisión inválida.");

    const year = dateObj.getFullYear();
    const month = dateObj.getMonth() + 1; // 1-indexed

    // Agent agency check
    const agent = await prisma.user.findUnique({
      where: { id: data.agentId },
      select: { id: true, agencyId: true, name: true },
    });
    if (!agent) throw new Error("Agente no encontrado.");

    const emission = await prisma.agentEmission.create({
      data: {
        agencyId: agent.agencyId || user.agencyId,
        agentId: data.agentId,
        companyId: data.companyId || null,
        companyName: data.companyName.trim(),
        policyNumber: data.policyNumber?.trim() || null,
        clientName: data.clientName?.trim() || null,
        ramo: data.ramo?.trim() || "Protección",
        issueDate: dateObj,
        year,
        month,
        primaEmitida: Number(data.primaEmitida) || 0,
        primaPagada: Number(data.primaPagada) || 0,
        status: data.status || "EMITIDA",
        notes: data.notes?.trim() || null,
        createdById: user.id,
      },
    });

    revalidatePath("/admin");
    return { success: true, emission };
  } catch (error: any) {
    console.error("Error createEmission:", error);
    return { success: false, message: error.message || "Error al registrar la póliza" };
  }
}

// 5. Actualizar Emisión de Póliza
export async function updateEmission(id: string, data: {
  agentId?: string;
  companyId?: string;
  companyName?: string;
  policyNumber?: string;
  clientName?: string;
  ramo?: string;
  issueDate?: string;
  primaEmitida?: number;
  primaPagada?: number;
  status?: string;
  notes?: string;
}) {
  try {
    await verifyAdminUser();

    const updatePayload: any = {};
    if (data.agentId) updatePayload.agentId = data.agentId;
    if (data.companyId !== undefined) updatePayload.companyId = data.companyId || null;
    if (data.companyName) updatePayload.companyName = data.companyName.trim();
    if (data.policyNumber !== undefined) updatePayload.policyNumber = data.policyNumber?.trim() || null;
    if (data.clientName !== undefined) updatePayload.clientName = data.clientName?.trim() || null;
    if (data.ramo !== undefined) updatePayload.ramo = data.ramo?.trim() || "Protección";
    if (data.primaEmitida !== undefined) updatePayload.primaEmitida = Number(data.primaEmitida) || 0;
    if (data.primaPagada !== undefined) updatePayload.primaPagada = Number(data.primaPagada) || 0;
    if (data.status) updatePayload.status = data.status;
    if (data.notes !== undefined) updatePayload.notes = data.notes?.trim() || null;

    if (data.issueDate) {
      const d = new Date(data.issueDate);
      if (!isNaN(d.getTime())) {
        updatePayload.issueDate = d;
        updatePayload.year = d.getFullYear();
        updatePayload.month = d.getMonth() + 1;
      }
    }

    const updated = await prisma.agentEmission.update({
      where: { id },
      data: updatePayload,
    });

    revalidatePath("/admin");
    return { success: true, emission: updated };
  } catch (error: any) {
    console.error("Error updateEmission:", error);
    return { success: false, message: error.message || "Error al actualizar póliza" };
  }
}

// 6. Eliminar Emisión de Póliza
export async function deleteEmission(id: string) {
  try {
    await verifyAdminUser();
    await prisma.agentEmission.delete({ where: { id } });
    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleteEmission:", error);
    return { success: false, message: error.message || "Error al eliminar póliza" };
  }
}

// 7. Modificar Presupuesto Mensual de un Agente (Manual Admin)
export async function updateAgentBudget(data: {
  agentId: string;
  year: number;
  month: number;
  budgetPE: number;
  notes?: string;
}) {
  try {
    const user = await verifyAdminUser();

    const agent = await prisma.user.findUnique({
      where: { id: data.agentId },
      select: { id: true, agencyId: true },
    });
    if (!agent) throw new Error("Agente no encontrado.");

    const budget = await prisma.agentMonthlyBudget.upsert({
      where: {
        agentId_year_month: {
          agentId: data.agentId,
          year: data.year,
          month: data.month,
        },
      },
      update: {
        budgetPE: Number(data.budgetPE) || 0,
        source: "MANUAL_ADMIN",
        notes: data.notes?.trim() || null,
        updatedById: user.id,
      },
      create: {
        agencyId: agent.agencyId || user.agencyId,
        agentId: data.agentId,
        year: data.year,
        month: data.month,
        budgetPE: Number(data.budgetPE) || 0,
        source: "MANUAL_ADMIN",
        notes: data.notes?.trim() || null,
        updatedById: user.id,
      },
    });

    revalidatePath("/admin");
    return { success: true, budget };
  } catch (error: any) {
    console.error("Error updateAgentBudget:", error);
    return { success: false, message: error.message || "Error al actualizar presupuesto" };
  }
}

// 8. Sincronizar Presupuestos desde PEA Autorizados
export async function syncBudgetsFromPea(year: number, month: number) {
  try {
    await verifyAdminUser();
    const monthName = MONTH_NAMES_ES[month - 1]; // e.g. "Septiembre"

    // Search reviewed PEAs for this month name or created in this month/year
    const reviews = await prisma.performanceReview.findMany({
      where: {
        status: "REVIEWED",
        OR: [
          { evalMonth: { contains: monthName, mode: "insensitive" } },
          {
            createdAt: {
              gte: new Date(year, month - 1, 1),
              lt: new Date(year, month, 1),
            },
          },
        ],
      },
      orderBy: { createdAt: "asc" }, // First reviewed takes precedence
    });

    let syncedCount = 0;
    for (const rev of reviews) {
      // Check if budget already exists
      const existing = await prisma.agentMonthlyBudget.findUnique({
        where: {
          agentId_year_month: {
            agentId: rev.agentId,
            year,
            month,
          },
        },
      });

      // Only import if not already created or if it came from PEA_AUTO
      if (!existing) {
        await prisma.agentMonthlyBudget.create({
          data: {
            agencyId: rev.agencyId,
            agentId: rev.agentId,
            year,
            month,
            budgetPE: rev.metaPrimasMensual || 0,
            source: "PEA_AUTO",
            sourceReviewId: rev.id,
          },
        });
        syncedCount++;
      }
    }

    revalidatePath("/admin");
    return { success: true, syncedCount, totalFound: reviews.length };
  } catch (error: any) {
    console.error("Error syncBudgetsFromPea:", error);
    return { success: false, message: error.message || "Error al sincronizar presupuestos PEA" };
  }
}

// 9. Cargar Todo el Dashboard de Producción
export async function getProductionDashboardData(options: {
  year: number;
  month: number;
  agencyId?: string;
  agentId?: string;
  companyId?: string;
}) {
  try {
    const user = await verifyAdminUser();
    const { year, month } = options;

    const effectiveAgencyId = user.role === "SUPER_ADMIN" ? (options.agencyId || undefined) : (user.agencyId || undefined);

    const whereAgencyScope = effectiveAgencyId && effectiveAgencyId !== "ALL" ? { agencyId: effectiveAgencyId } : {};

    // 1. Fetch companies
    let companies = await prisma.insuranceCompany.findMany({
      where: {
        active: true,
        OR: [
          ...(effectiveAgencyId && effectiveAgencyId !== "ALL" ? [{ agencyId: effectiveAgencyId }] : []),
          { agencyId: null },
        ],
      },
      orderBy: [{ order: "asc" }, { name: "asc" }],
    });

    if (companies.length === 0) {
      // Seed defaults
      for (const comp of DEFAULT_COMPANIES) {
        await prisma.insuranceCompany.create({
          data: {
            agencyId: effectiveAgencyId !== "ALL" ? effectiveAgencyId : null,
            name: comp.name,
            color: comp.color,
            order: comp.order,
            active: true,
          },
        });
      }
      companies = await prisma.insuranceCompany.findMany({
        where: { active: true },
        orderBy: [{ order: "asc" }, { name: "asc" }],
      });
    }

    // 2. Fetch all agents in agency
    const agents = await prisma.user.findMany({
      where: {
        ...whereAgencyScope,
        active: true,
        role: { in: ["AGENTE", "AGENTE_LITE", "ADMIN", "SUPER_ADMIN"] },
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        agencyId: true,
        agency: { select: { id: true, name: true } },
      },
      orderBy: { name: "asc" },
    });

    // 3. Fetch emissions for the month & year
    const emissionsWhere: any = {
      year,
      month,
      ...(effectiveAgencyId && effectiveAgencyId !== "ALL" ? { agencyId: effectiveAgencyId } : {}),
      ...(options.agentId && options.agentId !== "ALL" ? { agentId: options.agentId } : {}),
      ...(options.companyId && options.companyId !== "ALL" ? { companyId: options.companyId } : {}),
    };

    const emissions = await prisma.agentEmission.findMany({
      where: emissionsWhere,
      orderBy: { issueDate: "desc" },
      include: {
        agent: { select: { id: true, name: true, email: true, image: true } },
        company: { select: { id: true, name: true, logoUrl: true, color: true } },
      },
    });

    // 4. Fetch budgets for the month & year
    const budgets = await prisma.agentMonthlyBudget.findMany({
      where: {
        year,
        month,
        ...(effectiveAgencyId && effectiveAgencyId !== "ALL" ? { agencyId: effectiveAgencyId } : {}),
      },
    });
    const budgetMap = new Map<string, any>();
    budgets.forEach((b) => budgetMap.set(b.agentId, b));

    // 5. Agencies for Super Admin
    const agencies = user.role === "SUPER_ADMIN"
      ? await prisma.agency.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } })
      : [];

    // Calculate Global KPIs
    const totalPolicies = emissions.length;
    const totalPE = emissions.reduce((acc, curr) => acc + (curr.primaEmitida || 0), 0);
    const totalPPC = emissions.reduce((acc, curr) => acc + (curr.primaPagada || 0), 0);

    // Sum budgets for agents in scope (or filtered agent)
    let totalBudget = 0;
    const activeAgentsInScope = options.agentId && options.agentId !== "ALL"
      ? agents.filter((a) => a.id === options.agentId)
      : agents;

    activeAgentsInScope.forEach((ag) => {
      const b = budgetMap.get(ag.id);
      if (b && b.budgetPE) {
        totalBudget += b.budgetPE;
      }
    });

    const compliancePercent = totalBudget > 0 ? Math.round((totalPE / totalBudget) * 100) : 0;

    // Breakdown by Company
    const companyStatsMap = new Map<string, {
      companyId: string;
      name: string;
      logoUrl: string | null;
      color: string;
      policies: number;
      pe: number;
      ppc: number;
    }>();

    // Pre-populate with active companies
    companies.forEach((comp) => {
      companyStatsMap.set(comp.id, {
        companyId: comp.id,
        name: comp.name,
        logoUrl: comp.logoUrl,
        color: comp.color || "#0284c7",
        policies: 0,
        pe: 0,
        ppc: 0,
      });
    });

    emissions.forEach((em) => {
      const cId = em.companyId || em.companyName;
      let comp = companyStatsMap.get(cId);
      if (!comp) {
        comp = {
          companyId: cId,
          name: em.companyName,
          logoUrl: em.company?.logoUrl || null,
          color: em.company?.color || "#0284c7",
          policies: 0,
          pe: 0,
          ppc: 0,
        };
        companyStatsMap.set(cId, comp);
      }
      comp.policies += 1;
      comp.pe += em.primaEmitida || 0;
      comp.ppc += em.primaPagada || 0;
    });

    const byCompany = Array.from(companyStatsMap.values())
      .filter((c) => c.policies > 0 || companies.some((orig) => orig.id === c.companyId))
      .map((c) => ({
        ...c,
        pePercentage: totalPE > 0 ? Math.round((c.pe / totalPE) * 100) : 0,
      }));

    // Breakdown by Ramo
    const ramoStatsMap = new Map<string, { ramo: string; count: number; pe: number; ppc: number }>();
    RAMOS_CATALOGO.forEach((r) => {
      ramoStatsMap.set(r.id, { ramo: r.id, count: 0, pe: 0, ppc: 0 });
    });

    emissions.forEach((em) => {
      const rKey = em.ramo || "Protección";
      let rItem = ramoStatsMap.get(rKey);
      if (!rItem) {
        rItem = { ramo: rKey, count: 0, pe: 0, ppc: 0 };
        ramoStatsMap.set(rKey, rItem);
      }
      rItem.count += 1;
      rItem.pe += em.primaEmitida || 0;
      rItem.ppc += em.primaPagada || 0;
    });

    const byRamo = Array.from(ramoStatsMap.values()).filter((r) => r.count > 0);

    // Matrix Table Data: Agent Rows x Companies
    // Identify top companies to display as columns (e.g. Insignia Life, and others, or all active companies)
    // We prioritize Insignia Life first, followed by others that have emissions or are in catalog
    const displayCompanies = [...companies];

    const agentMatrix = activeAgentsInScope.map((agent) => {
      const agentEmissions = emissions.filter((e) => e.agentId === agent.id);

      // Group emissions by company for this agent
      const companyEmissionsMap = new Map<string, { policies: number; pe: number; ppc: number }>();

      agentEmissions.forEach((em) => {
        const cId = em.companyId || em.companyName;
        const cur = companyEmissionsMap.get(cId) || { policies: 0, pe: 0, ppc: 0 };
        cur.policies += 1;
        cur.pe += em.primaEmitida || 0;
        cur.ppc += em.primaPagada || 0;
        companyEmissionsMap.set(cId, cur);
      });

      const agentTotalPolicies = agentEmissions.length;
      const agentTotalPE = agentEmissions.reduce((acc, curr) => acc + (curr.primaEmitida || 0), 0);
      const agentTotalPPC = agentEmissions.reduce((acc, curr) => acc + (curr.primaPagada || 0), 0);

      const bRecord = budgetMap.get(agent.id);
      const agentBudget = bRecord?.budgetPE || 0;
      const agentCompliance = agentBudget > 0 ? Math.round((agentTotalPE / agentBudget) * 100) : 0;

      // Map values for each display company
      const companiesData: Record<string, { policies: number; pe: number; ppc: number }> = {};
      displayCompanies.forEach((comp) => {
        companiesData[comp.id] = companyEmissionsMap.get(comp.id) || { policies: 0, pe: 0, ppc: 0 };
      });

      return {
        agentId: agent.id,
        agentName: agent.name || agent.email,
        agentEmail: agent.email,
        agentImage: agent.image,
        companiesData,
        totalPolicies: agentTotalPolicies,
        totalPE: agentTotalPE,
        totalPPC: agentTotalPPC,
        budget: agentBudget,
        budgetSource: bRecord?.source || "NONE",
        budgetRecordId: bRecord?.id || null,
        compliancePercent: agentCompliance,
        hasEmissionsOrBudget: agentTotalPolicies > 0 || agentBudget > 0,
      };
    });

    // Sort agents: agents with emissions or budgets first, then alphabetically
    agentMatrix.sort((a, b) => {
      if (b.totalPE !== a.totalPE) return b.totalPE - a.totalPE;
      if (b.totalPolicies !== a.totalPolicies) return b.totalPolicies - a.totalPolicies;
      return a.agentName.localeCompare(b.agentName);
    });

    return {
      success: true,
      currentUserRole: user.role,
      userAgencyId: user.agencyId,
      agencies,
      companies: displayCompanies,
      agents,
      emissions,
      kpis: {
        totalPolicies,
        totalPE,
        totalPPC,
        totalBudget,
        compliancePercent,
        byCompany,
        byRamo,
      },
      agentMatrix,
    };
  } catch (error: any) {
    console.error("Error getProductionDashboardData:", error);
    return {
      success: false,
      message: error.message || "Error al cargar datos del dashboard de producción",
      companies: [],
      agents: [],
      emissions: [],
      agentMatrix: [],
    };
  }
}
