"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { RAMOS_CATALOGO, DEFAULT_COMPANIES, MONTH_NAMES_ES } from "@/lib/productionConstants";
import {
  buildPolicyReceiptsDrafts,
  toUTCNoonDate,
} from "@/app/(dashboard)/cartera/dateUtils";
import {
  BusinessScope,
  CanonicalSubRamoKey,
  PeriodMode,
  RamoGroupKey,
  VidaObjetivoKey,
  canonicalCompanyName,
  classifyPolicyRamo,
  getDefaultSubPeriodForMonth,
  mapHistoricalEmissionRamoToPolicy,
  normalizeCompanyKey,
  resolvePeriodDateRange,
  toYmdKey,
} from "@/lib/ramosCatalog";
import { computeAgencyCarteraProduction } from "@/lib/carteraProductionEngine";

const MIGRATION_SETTING_KEY = "production_companies_multitenant_v1";
let isProductionCompaniesMigratedInMemory = false;

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

  const impersonateId =
    user.role === "SUPER_ADMIN" ? cookies().get("impersonateAgencyId")?.value : undefined;
  const effectiveUserAgencyId = (impersonateId ||
    (session.user as any)?.agencyId ||
    user.agencyId ||
    "aacom") as string;

  return {
    ...user,
    agencyId: effectiveUserAgencyId,
  };
}

function resolveTargetAgencyId(
  user: { role: string; agencyId: string },
  requestedAgencyId?: string | null
): string {
  if (
    user.role === "SUPER_ADMIN" &&
    requestedAgencyId &&
    requestedAgencyId !== "ALL" &&
    requestedAgencyId !== "DEFAULT"
  ) {
    return requestedAgencyId;
  }
  return user.agencyId || "aacom";
}

/**
 * Migración única e idempotente para aislar el catálogo InsuranceCompany
 * estrictamente por agencyId (eliminando filas globales agencyId = null).
 */
async function ensureProductionCompaniesMigratedOnce() {
  if (isProductionCompaniesMigratedInMemory) return;

  try {
    const existingFlag = await prisma.setting.findUnique({
      where: { key: MIGRATION_SETTING_KEY },
    });
    if (existingFlag?.value === "true") {
      isProductionCompaniesMigratedInMemory = true;
      return;
    }

    const [agencies, allCompanies, allEmissions] = await Promise.all([
      prisma.agency.findMany({ select: { id: true, name: true, slug: true } }),
      prisma.insuranceCompany.findMany({ orderBy: [{ order: "asc" }, { createdAt: "asc" }] }),
      prisma.agentEmission.findMany({
        select: { id: true, agencyId: true, companyId: true, companyName: true },
      }),
    ]);

    const sharedLogoByKey = new Map<string, string>();
    const sharedColorByKey = new Map<string, string>();
    for (const c of allCompanies) {
      const k = normalizeCompanyKey(canonicalCompanyName(c.name));
      if (c.logoUrl && !sharedLogoByKey.has(k)) sharedLogoByKey.set(k, c.logoUrl);
      if (c.color && !sharedColorByKey.has(k)) sharedColorByKey.set(k, c.color);
    }

    for (const agency of agencies) {
      const isMainAgency = agency.id === "aacom" || agency.slug === "aacom";
      const isRcMejorandoVidas =
        /mejorando\s*vidas/i.test(agency.name || "") ||
        /mejorando/i.test(agency.slug || "");

      const agencyEmissions = allEmissions.filter((e) => e.agencyId === agency.id);
      const agencyExistingCompanies = allCompanies.filter((c) => c.agencyId === agency.id);

      const desiredMap = new Map<
        string,
        { name: string; color: string; order: number; active: boolean; logoUrl?: string | null }
      >();

      if (isMainAgency) {
        const mainActiveList = [
          { name: "Insignia Life", color: "#1e3a8a", order: 1 },
          { name: "La Latinoamericana Seguros", color: "#0284c7", order: 2 },
          { name: "Plan Seguro", color: "#16a34a", order: 3 },
        ];
        for (const item of mainActiveList) {
          const k = normalizeCompanyKey(item.name);
          desiredMap.set(k, {
            name: item.name,
            color: sharedColorByKey.get(k) || item.color,
            order: item.order,
            active: true,
            logoUrl: sharedLogoByKey.get(k) || null,
          });
        }
        let nextOrder = 4;
        for (const base of DEFAULT_COMPANIES) {
          const k = normalizeCompanyKey(base.name);
          if (!desiredMap.has(k)) {
            desiredMap.set(k, {
              name: base.name,
              color: sharedColorByKey.get(k) || base.color,
              order: nextOrder++,
              active: false,
              logoUrl: sharedLogoByKey.get(k) || null,
            });
          }
        }
      } else if (isRcMejorandoVidas) {
        for (const base of DEFAULT_COMPANIES) {
          const k = normalizeCompanyKey(base.name);
          const isGnp = k === normalizeCompanyKey("GNP Seguros");
          desiredMap.set(k, {
            name: base.name,
            color: sharedColorByKey.get(k) || base.color,
            order: isGnp ? 1 : base.order + 1,
            active: isGnp,
            logoUrl: sharedLogoByKey.get(k) || null,
          });
        }
      } else {
        const emittedKeys = new Set(
          agency.id === "demo-agency-id"
            ? []
            : agencyEmissions.map((e) => normalizeCompanyKey(canonicalCompanyName(e.companyName)))
        );
        for (const base of DEFAULT_COMPANIES) {
          const k = normalizeCompanyKey(base.name);
          desiredMap.set(k, {
            name: base.name,
            color: base.color,
            order: base.order,
            active: emittedKeys.has(k),
            logoUrl: sharedLogoByKey.get(k) || null,
          });
        }
      }

      for (const existingComp of agencyExistingCompanies) {
        const canonName = canonicalCompanyName(existingComp.name);
        const k = normalizeCompanyKey(canonName);
        const prev = desiredMap.get(k);
        if (prev) {
          if (existingComp.logoUrl) prev.logoUrl = existingComp.logoUrl;
          if (existingComp.color) prev.color = existingComp.color;
        } else if (!isRcMejorandoVidas || k !== normalizeCompanyKey("Insignia Life")) {
          desiredMap.set(k, {
            name: canonName,
            color: existingComp.color || "#0284c7",
            order: desiredMap.size + 1,
            active: isMainAgency
              ? false
              : isRcMejorandoVidas
              ? k === normalizeCompanyKey("GNP Seguros")
              : existingComp.active,
            logoUrl: existingComp.logoUrl || null,
          });
        }
      }

      for (const em of agencyEmissions) {
        const canonName = canonicalCompanyName(em.companyName);
        const k = normalizeCompanyKey(canonName);
        if (k && !desiredMap.has(k)) {
          desiredMap.set(k, {
            name: canonName,
            color: sharedColorByKey.get(k) || "#0284c7",
            order: desiredMap.size + 1,
            active: true,
            logoUrl: sharedLogoByKey.get(k) || null,
          });
        }
      }

      const resolvedCompanyIdByKey = new Map<string, { id: string; name: string }>();
      for (const [k, desired] of Array.from(desiredMap.entries())) {
        const candidates = agencyExistingCompanies.filter(
          (c) => normalizeCompanyKey(canonicalCompanyName(c.name)) === k
        );

        if (candidates.length > 0) {
          const primary = candidates.find((c) => !!c.logoUrl) || candidates[0];
          const updated = await prisma.insuranceCompany.update({
            where: { id: primary.id },
            data: {
              agencyId: agency.id,
              name: desired.name,
              color: primary.color || desired.color,
              logoUrl: primary.logoUrl || desired.logoUrl || null,
              order: desired.order,
              active: desired.active,
            },
          });
          resolvedCompanyIdByKey.set(k, { id: updated.id, name: updated.name });

          for (const dup of candidates) {
            if (dup.id !== primary.id) {
              await prisma.insuranceCompany.delete({ where: { id: dup.id } });
            }
          }
        } else {
          const created = await prisma.insuranceCompany.create({
            data: {
              agencyId: agency.id,
              name: desired.name,
              color: desired.color,
              logoUrl: desired.logoUrl || null,
              order: desired.order,
              active: desired.active,
            },
          });
          resolvedCompanyIdByKey.set(k, { id: created.id, name: created.name });
        }
      }

      for (const em of agencyEmissions) {
        const k = normalizeCompanyKey(canonicalCompanyName(em.companyName));
        const targetComp = resolvedCompanyIdByKey.get(k);
        if (targetComp && (em.companyId !== targetComp.id || em.companyName !== targetComp.name)) {
          await prisma.agentEmission.update({
            where: { id: em.id },
            data: {
              companyId: targetComp.id,
              companyName: targetComp.name,
            },
          });
        }
      }
    }

    await prisma.insuranceCompany.deleteMany({
      where: { agencyId: null },
    });

    await prisma.setting.upsert({
      where: { key: MIGRATION_SETTING_KEY },
      update: { value: "true" },
      create: { key: MIGRATION_SETTING_KEY, value: "true" },
    });

    isProductionCompaniesMigratedInMemory = true;
  } catch (err) {
    console.error("[ensureProductionCompaniesMigratedOnce] Error:", err);
  }
}

async function ensureAgencyCompaniesSeeded(agencyId: string) {
  if (!agencyId || agencyId === "ALL" || agencyId === "DEFAULT") return;

  const existingCount = await prisma.insuranceCompany.count({
    where: { agencyId },
  });

  if (existingCount === 0) {
    for (const comp of DEFAULT_COMPANIES) {
      try {
        await prisma.insuranceCompany.create({
          data: {
            agencyId,
            name: comp.name,
            color: comp.color,
            order: comp.order,
            active: false,
          },
        });
      } catch {
        // Ignorar colisiones concurrentes
      }
    }
  }
}

async function deduplicateAgencyCompaniesIfNeeded<
  T extends {
    id: string;
    agencyId: string | null;
    name: string;
    logoUrl: string | null;
    color: string | null;
    order: number;
    active: boolean;
    createdAt: Date;
  }
>(agencyId: string, rows: T[]): Promise<T[]> {
  const groups = new Map<string, T[]>();
  for (const r of rows) {
    const k = normalizeCompanyKey(canonicalCompanyName(r.name));
    const arr = groups.get(k) || [];
    arr.push(r);
    groups.set(k, arr);
  }

  let hasDuplicates = false;
  for (const arr of Array.from(groups.values())) {
    if (arr.length > 1) {
      hasDuplicates = true;
      break;
    }
  }
  if (!hasDuplicates) return rows;

  const emissionCounts = await prisma.agentEmission.groupBy({
    by: ["companyId"],
    where: { agencyId, companyId: { not: null } },
    _count: { _all: true },
  });
  const countMap = new Map<string, number>();
  for (const g of emissionCounts) {
    if (g.companyId) countMap.set(g.companyId, g._count._all);
  }

  const cleanList: T[] = [];
  for (const arr of Array.from(groups.values())) {
    if (arr.length === 1) {
      cleanList.push(arr[0]);
      continue;
    }

    arr.sort((a, b) => {
      const ca = countMap.get(a.id) || 0;
      const cb = countMap.get(b.id) || 0;
      if (cb !== ca) return cb - ca;
      const la = a.logoUrl ? 1 : 0;
      const lb = b.logoUrl ? 1 : 0;
      if (lb !== la) return lb - la;
      if (a.order !== b.order) return a.order - b.order;
      return a.createdAt.getTime() - b.createdAt.getTime();
    });

    const winner = arr[0];
    const losers = arr.slice(1);
    const bestLogo = winner.logoUrl || arr.find((x) => !!x.logoUrl)?.logoUrl || null;
    const bestColor = winner.color || arr.find((x) => !!x.color)?.color || "#0284c7";
    const bestOrder = Math.min(...arr.map((x) => x.order));
    const canon = canonicalCompanyName(winner.name) || winner.name.trim();

    const updatedWinner = (await prisma.insuranceCompany.update({
      where: { id: winner.id },
      data: {
        name: canon,
        logoUrl: bestLogo,
        color: bestColor,
        order: bestOrder,
      },
    })) as unknown as T;

    const loserIds = losers.map((l) => l.id);
    await prisma.agentEmission.updateMany({
      where: { companyId: { in: loserIds } },
      data: { companyId: winner.id },
    });
    await prisma.insuranceCompany.deleteMany({
      where: { id: { in: loserIds } },
    });

    cleanList.push(updatedWinner);
  }

  return cleanList.sort((a, b) => {
    if (a.active !== b.active) return a.active ? -1 : 1;
    if (a.order !== b.order) return a.order - b.order;
    return a.name.localeCompare(b.name);
  });
}

// 1. Obtener Compañías Activas de la Agencia
export async function getInsuranceCompanies(agencyId?: string) {
  try {
    await ensureProductionCompaniesMigratedOnce();
    const user = await verifyAdminUser();
    const effectiveAgencyId = resolveTargetAgencyId(user, agencyId);

    await ensureAgencyCompaniesSeeded(effectiveAgencyId);

    const rawCompanies = await prisma.insuranceCompany.findMany({
      where: { agencyId: effectiveAgencyId },
      orderBy: [{ active: "desc" }, { order: "asc" }, { name: "asc" }],
    });

    const cleanAll = await deduplicateAgencyCompaniesIfNeeded(effectiveAgencyId, rawCompanies);
    const companies = cleanAll
      .filter((c) => c.active)
      .sort((a, b) => (a.order - b.order) || a.name.localeCompare(b.name));

    return { success: true, companies };
  } catch (error: any) {
    console.error("Error getInsuranceCompanies:", error);
    return { success: false, message: error.message || "Error al cargar compañías", companies: [] };
  }
}

// 2. Guardar o Editar Compañía de Seguros (Estrictamente aislada por agencia)
export async function saveInsuranceCompany(data: {
  id?: string;
  name: string;
  logoUrl?: string;
  color?: string;
  order?: number;
  active?: boolean;
  agencyId?: string | null;
}) {
  try {
    await ensureProductionCompaniesMigratedOnce();
    const user = await verifyAdminUser();
    const nameTrimmed = data.name.trim();
    if (!nameTrimmed) throw new Error("El nombre de la compañía es obligatorio.");

    const targetAgencyId = resolveTargetAgencyId(user, data.agencyId);

    if (data.id) {
      const existing = await prisma.insuranceCompany.findFirst({
        where: { id: data.id, agencyId: targetAgencyId },
      });
      if (!existing) {
        throw new Error("Aseguradora no encontrada en esta agencia o sin permisos.");
      }

      const updated = await prisma.insuranceCompany.update({
        where: { id: existing.id },
        data: {
          name: nameTrimmed,
          ...(data.logoUrl !== undefined && { logoUrl: data.logoUrl || null }),
          ...(data.color !== undefined && { color: data.color }),
          ...(data.order !== undefined && { order: data.order }),
          ...(data.active !== undefined && { active: data.active }),
        },
      });

      revalidatePath("/admin");
      revalidatePath("/admin/produccion");
      return { success: true, company: updated };
    } else {
      const agencyCompanies = await prisma.insuranceCompany.findMany({
        where: { agencyId: targetAgencyId },
      });
      const targetKey = normalizeCompanyKey(canonicalCompanyName(nameTrimmed));
      const duplicateInAgency = agencyCompanies.find(
        (c) => normalizeCompanyKey(canonicalCompanyName(c.name)) === targetKey
      );

      let savedCompany;
      if (duplicateInAgency) {
        savedCompany = await prisma.insuranceCompany.update({
          where: { id: duplicateInAgency.id },
          data: {
            name: canonicalCompanyName(nameTrimmed) || nameTrimmed,
            ...(data.logoUrl ? { logoUrl: data.logoUrl } : {}),
            ...(data.color ? { color: data.color } : {}),
            ...(data.order !== undefined ? { order: data.order } : {}),
            active: data.active ?? true,
          },
        });
      } else {
        savedCompany = await prisma.insuranceCompany.create({
          data: {
            agencyId: targetAgencyId,
            name: canonicalCompanyName(nameTrimmed) || nameTrimmed,
            logoUrl: data.logoUrl || null,
            color: data.color || "#0284c7",
            order: data.order ?? agencyCompanies.length + 1,
            active: data.active ?? true,
          },
        });
      }

      revalidatePath("/admin");
      revalidatePath("/admin/produccion");
      return { success: true, company: savedCompany };
    }
  } catch (error: any) {
    console.error("Error saveInsuranceCompany:", error);
    return { success: false, message: error.message || "Error al guardar aseguradora" };
  }
}

// 2.1 Encender o Apagar Aseguradora únicamente para la agencia seleccionada
export async function toggleInsuranceCompanyActive(
  companyId: string,
  active: boolean,
  agencyId?: string | null
) {
  try {
    await ensureProductionCompaniesMigratedOnce();
    const user = await verifyAdminUser();
    const targetAgencyId = resolveTargetAgencyId(user, agencyId);

    const existing = await prisma.insuranceCompany.findFirst({
      where: { id: companyId, agencyId: targetAgencyId },
    });
    if (!existing) {
      throw new Error("Aseguradora no encontrada en esta agencia.");
    }

    const updated = await prisma.insuranceCompany.update({
      where: { id: existing.id },
      data: { active },
    });

    revalidatePath("/admin");
    revalidatePath("/admin/produccion");
    return { success: true, company: updated };
  } catch (error: any) {
    console.error("Error toggleInsuranceCompanyActive:", error);
    return { success: false, message: error.message || "Error al actualizar estado de la aseguradora" };
  }
}

// 3. Eliminar Compañía de Seguros (Estrictamente acotado a la agencia)
export async function deleteInsuranceCompany(companyId: string, agencyId?: string | null) {
  try {
    await ensureProductionCompaniesMigratedOnce();
    const user = await verifyAdminUser();
    const targetAgencyId = resolveTargetAgencyId(user, agencyId);

    const existing = await prisma.insuranceCompany.findFirst({
      where: { id: companyId, agencyId: targetAgencyId },
    });
    if (!existing) {
      throw new Error("Aseguradora no encontrada en esta agencia o sin permisos.");
    }

    const isBaseCatalogCompany = DEFAULT_COMPANIES.some(
      (base) => normalizeCompanyKey(base.name) === normalizeCompanyKey(existing.name)
    );

    if (isBaseCatalogCompany) {
      await prisma.insuranceCompany.update({
        where: { id: existing.id },
        data: { active: false },
      });
    } else {
      await prisma.insuranceCompany.delete({
        where: { id: existing.id },
      });
    }

    revalidatePath("/admin");
    revalidatePath("/admin/produccion");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleteInsuranceCompany:", error);
    return { success: false, message: error.message || "Error al eliminar compañía" };
  }
}

// 4-6. Emisiones Históricas Manuales (Conservadas por compatibilidad; la operación vive en Mi Cartera)
export async function createEmission(data: {
  agentId: string;
  companyId?: string;
  companyName: string;
  policyNumber?: string;
  clientName?: string;
  ramo?: string;
  issueDate: string;
  primaEmitida: number;
  primaPagada: number;
  status?: string;
  notes?: string;
}) {
  try {
    const user = await verifyAdminUser();
    if (!data.agentId) throw new Error("Debes seleccionar un agente.");
    if (!data.companyName?.trim()) throw new Error("Debes especificar la aseguradora.");

    const dateObj = toUTCNoonDate(data.issueDate) || toUTCNoonDate(new Date());
    if (!dateObj || isNaN(dateObj.getTime())) throw new Error("Fecha de emisión inválida.");

    const year = dateObj.getUTCFullYear();
    const month = dateObj.getUTCMonth() + 1;

    const agent = await prisma.user.findUnique({
      where: { id: data.agentId },
      select: { id: true, agencyId: true },
    });
    if (!agent) throw new Error("Agente no encontrado.");
    if (user.role !== "SUPER_ADMIN" && agent.agencyId !== user.agencyId) {
      throw new Error("No tienes permisos para registrar emisiones en otra agencia.");
    }

    const effectiveEmissionAgencyId = agent.agencyId || user.agencyId;
    let verifiedCompanyId: string | null = null;
    if (data.companyId) {
      const comp = await prisma.insuranceCompany.findFirst({
        where: { id: data.companyId, agencyId: effectiveEmissionAgencyId },
        select: { id: true },
      });
      verifiedCompanyId = comp?.id || null;
    }

    const emission = await prisma.agentEmission.create({
      data: {
        agencyId: effectiveEmissionAgencyId,
        agentId: data.agentId,
        companyId: verifiedCompanyId,
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
    revalidatePath("/admin/produccion");
    revalidatePath("/ranking");
    return { success: true, emission };
  } catch (error: any) {
    console.error("Error createEmission:", error);
    return { success: false, message: error.message || "Error al registrar la póliza" };
  }
}

export async function updateEmission(
  id: string,
  data: {
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
  }
) {
  try {
    const user = await verifyAdminUser();

    const existing = await prisma.agentEmission.findUnique({
      where: { id },
      select: { id: true, agencyId: true },
    });
    if (!existing) throw new Error("Emisión no encontrada.");
    if (user.role !== "SUPER_ADMIN" && existing.agencyId !== user.agencyId) {
      throw new Error("No tienes permisos para editar pólizas de otra agencia.");
    }

    const updatePayload: any = {};
    if (data.agentId) {
      const targetAgent = await prisma.user.findUnique({
        where: { id: data.agentId },
        select: { id: true, agencyId: true },
      });
      if (!targetAgent || (user.role !== "SUPER_ADMIN" && targetAgent.agencyId !== user.agencyId)) {
        throw new Error("Agente inválido para esta agencia.");
      }
      updatePayload.agentId = data.agentId;
    }
    if (data.companyId !== undefined) {
      if (data.companyId) {
        const comp = await prisma.insuranceCompany.findFirst({
          where: { id: data.companyId, agencyId: existing.agencyId || user.agencyId },
          select: { id: true },
        });
        updatePayload.companyId = comp?.id || null;
      } else {
        updatePayload.companyId = null;
      }
    }
    if (data.companyName) updatePayload.companyName = data.companyName.trim();
    if (data.policyNumber !== undefined) updatePayload.policyNumber = data.policyNumber?.trim() || null;
    if (data.clientName !== undefined) updatePayload.clientName = data.clientName?.trim() || null;
    if (data.ramo !== undefined) updatePayload.ramo = data.ramo?.trim() || "Protección";
    if (data.primaEmitida !== undefined) updatePayload.primaEmitida = Number(data.primaEmitida) || 0;
    if (data.primaPagada !== undefined) updatePayload.primaPagada = Number(data.primaPagada) || 0;
    if (data.status) updatePayload.status = data.status;
    if (data.notes !== undefined) updatePayload.notes = data.notes?.trim() || null;

    if (data.issueDate) {
      const d = toUTCNoonDate(data.issueDate);
      if (d && !isNaN(d.getTime())) {
        updatePayload.issueDate = d;
        updatePayload.year = d.getUTCFullYear();
        updatePayload.month = d.getUTCMonth() + 1;
      }
    }

    const updated = await prisma.agentEmission.update({
      where: { id: existing.id },
      data: updatePayload,
    });

    revalidatePath("/admin");
    revalidatePath("/admin/produccion");
    revalidatePath("/ranking");
    return { success: true, emission: updated };
  } catch (error: any) {
    console.error("Error updateEmission:", error);
    return { success: false, message: error.message || "Error al actualizar póliza" };
  }
}

export async function deleteEmission(id: string) {
  try {
    const user = await verifyAdminUser();

    const existing = await prisma.agentEmission.findUnique({
      where: { id },
      select: { id: true, agencyId: true },
    });
    if (!existing) throw new Error("Emisión no encontrada.");
    if (user.role !== "SUPER_ADMIN" && existing.agencyId !== user.agencyId) {
      throw new Error("No tienes permisos para eliminar pólizas de otra agencia.");
    }

    await prisma.agentEmission.delete({ where: { id: existing.id } });
    revalidatePath("/admin");
    revalidatePath("/admin/produccion");
    revalidatePath("/ranking");
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
    if (user.role !== "SUPER_ADMIN" && agent.agencyId !== user.agencyId) {
      throw new Error("No tienes permisos para modificar presupuestos de otra agencia.");
    }

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
    revalidatePath("/admin/produccion");
    return { success: true, budget };
  } catch (error: any) {
    console.error("Error updateAgentBudget:", error);
    return { success: false, message: error.message || "Error al actualizar presupuesto" };
  }
}

// 8. Sincronizar Presupuestos desde PEA Autorizados
export async function syncBudgetsFromPea(year: number, month: number, agencyId?: string) {
  try {
    const user = await verifyAdminUser();
    const effectiveAgencyId = resolveTargetAgencyId(user, agencyId);
    const monthName = MONTH_NAMES_ES[month - 1];

    const reviews = await prisma.performanceReview.findMany({
      where: {
        agencyId: effectiveAgencyId,
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
      orderBy: { createdAt: "asc" },
    });

    let syncedCount = 0;
    for (const rev of reviews) {
      const existing = await prisma.agentMonthlyBudget.findUnique({
        where: {
          agentId_year_month: {
            agentId: rev.agentId,
            year,
            month,
          },
        },
      });

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
    revalidatePath("/admin/produccion");
    return { success: true, syncedCount, totalFound: reviews.length };
  } catch (error: any) {
    console.error("Error syncBudgetsFromPea:", error);
    return { success: false, message: error.message || "Error al sincronizar presupuestos PEA" };
  }
}

// 9. Cargar Dashboard Unificado de Producción (Fuente Única: Mi Cartera en MXN)
export async function getProductionDashboardData(options: {
  year: number;
  month: number;
  agencyId?: string;
  agentId?: string;
  companyId?: string;
  periodMode?: PeriodMode;
  subPeriod?: number;
  startDate?: string;
  endDate?: string;
  businessScope?: BusinessScope;
  ramoGroupFilter?: RamoGroupKey | "ALL";
  subRamoFilter?: CanonicalSubRamoKey | "ALL";
  vidaObjetivoFilter?: VidaObjetivoKey | "ALL";
  onlyAdminApproved?: boolean;
}) {
  try {
    await ensureProductionCompaniesMigratedOnce();
    const user = await verifyAdminUser();
    const { year, month } = options;

    const effectiveAgencyId = resolveTargetAgencyId(user, options.agencyId);
    await ensureAgencyCompaniesSeeded(effectiveAgencyId);

    const periodMode: PeriodMode = options.periodMode || "MENSUAL";
    const subPeriod =
      options.subPeriod ?? getDefaultSubPeriodForMonth(periodMode, month);
    const periodInfo = resolvePeriodDateRange({
      periodMode,
      year,
      subPeriod,
      startDate: options.startDate,
      endDate: options.endDate,
    });

    const [rawAgencyCompanies, agents, agencies, legacyEmissionsCount] = await Promise.all([
      prisma.insuranceCompany.findMany({
        where: { agencyId: effectiveAgencyId },
        orderBy: [{ active: "desc" }, { order: "asc" }, { name: "asc" }],
      }),
      prisma.user.findMany({
        where: {
          agencyId: effectiveAgencyId,
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
      }),
      user.role === "SUPER_ADMIN"
        ? prisma.agency.findMany({ select: { id: true, name: true, slug: true }, orderBy: { name: "asc" } })
        : Promise.resolve([]),
      prisma.agentEmission.count({
        where: { agencyId: effectiveAgencyId },
      }),
    ]);

    const allAgencyCompanies = await deduplicateAgencyCompaniesIfNeeded(
      effectiveAgencyId,
      rawAgencyCompanies
    );

    const companies = allAgencyCompanies
      .filter((c) => c.active)
      .sort((a, b) => (a.order - b.order) || a.name.localeCompare(b.name));

    let filterCompanyKey: string | undefined;
    if (options.companyId && options.companyId !== "ALL") {
      const selectedCompObj = allAgencyCompanies.find((c) => c.id === options.companyId);
      if (selectedCompObj) {
        filterCompanyKey = normalizeCompanyKey(canonicalCompanyName(selectedCompObj.name));
      }
    }

    const carteraProd = await computeAgencyCarteraProduction({
      agencyId: effectiveAgencyId,
      startYmd: periodInfo.startYmd,
      endYmd: periodInfo.endYmd,
      businessScope: options.businessScope || "NUEVA",
      ramoGroupFilter: options.ramoGroupFilter || "ALL",
      subRamoFilter: options.subRamoFilter || "ALL",
      vidaObjetivoFilter: options.vidaObjetivoFilter || "ALL",
      onlyAdminApproved: options.onlyAdminApproved ?? false,
      filterAgentId:
        options.agentId && options.agentId !== "ALL" ? options.agentId : undefined,
      filterCompanyKey,
    });

    // Fetch budgets for all months included in the selected period
    const budgets =
      periodInfo.monthsIncluded.length > 0
        ? await prisma.agentMonthlyBudget.findMany({
            where: {
              agencyId: effectiveAgencyId,
              OR: periodInfo.monthsIncluded.map((m) => ({
                year: m.year,
                month: m.month,
              })),
            },
          })
        : [];

    const periodBudgetByAgent = new Map<string, number>();
    const selectedMonthBudgetMap = new Map<string, any>();
    for (const b of budgets) {
      periodBudgetByAgent.set(
        b.agentId,
        (periodBudgetByAgent.get(b.agentId) || 0) + (Number(b.budgetPE) || 0)
      );
      if (b.year === year && b.month === month) {
        selectedMonthBudgetMap.set(b.agentId, b);
      }
    }

    const activeAgentsInScope =
      options.agentId && options.agentId !== "ALL"
        ? agents.filter((a) => a.id === options.agentId)
        : agents;

    let totalBudget = 0;
    activeAgentsInScope.forEach((ag) => {
      totalBudget += periodBudgetByAgent.get(ag.id) || 0;
    });

    const totalPolicies = carteraProd.totals.uniquePoliciesCount;
    const totalPE = carteraProd.totals.totalPE;
    const totalPPC = carteraProd.totals.totalPPC;
    const compliancePercent =
      totalBudget > 0 ? Math.round((totalPE / totalBudget) * 100) : 0;

    // Breakdown by active agency company + detect insurers with Cartera policies but inactive in columns
    const activeKeyMap = new Map<string, (typeof companies)[number]>();
    for (const c of companies) {
      activeKeyMap.set(normalizeCompanyKey(canonicalCompanyName(c.name)), c);
    }

    const allCatalogByKey = new Map<string, (typeof allAgencyCompanies)[number]>();
    for (const c of allAgencyCompanies) {
      allCatalogByKey.set(normalizeCompanyKey(canonicalCompanyName(c.name)), c);
    }

    const prodByCompKey = new Map<string, (typeof carteraProd.byCompany)[number]>();
    for (const pc of carteraProd.byCompany) {
      prodByCompKey.set(pc.companyKey, pc);
    }

    const byCompany = companies.map((comp) => {
      const k = normalizeCompanyKey(canonicalCompanyName(comp.name));
      const prod = prodByCompKey.get(k);
      const pe = prod?.totalPE || 0;
      const ppc = prod?.totalPPC || 0;
      return {
        companyId: comp.id,
        name: comp.name,
        logoUrl: comp.logoUrl,
        color: comp.color || "#0284c7",
        policies: prod?.count || 0,
        pe,
        ppc,
        pePercentage: totalPE > 0 ? Math.round((pe / totalPE) * 100) : 0,
      };
    });

    const unmappedInsurersSummary = carteraProd.byCompany
      .filter((pc) => !activeKeyMap.has(pc.companyKey) && (pc.totalPE > 0 || pc.totalPPC > 0 || pc.count > 0))
      .map((pc) => {
        const existingInCatalog = allCatalogByKey.get(pc.companyKey);
        return {
          companyKey: pc.companyKey,
          companyName: pc.companyName,
          count: pc.count,
          totalPE: pc.totalPE,
          totalPPC: pc.totalPPC,
          existingCompanyId: existingInCatalog?.id || null,
        };
      });

    // Legacy byRamo compatibility mapped from RAMOS_CATALOGO + canonical sub-ramos
    const byRamo = RAMOS_CATALOGO.map((r) => {
      let pe = 0;
      let ppc = 0;
      let count = 0;
      if (r.id === "Protección") {
        const v = carteraProd.byVidaObjetivo.find((x) => x.key === "PROTECCION");
        pe = v?.totalPE || 0;
        ppc = v?.totalPPC || 0;
        count = v?.count || 0;
      } else if (r.id === "Ahorro") {
        const v = carteraProd.byVidaObjetivo.find((x) => x.key === "AHORRO");
        pe = v?.totalPE || 0;
        ppc = v?.totalPPC || 0;
        count = v?.count || 0;
      } else if (r.id === "Retiro") {
        const v = carteraProd.byVidaObjetivo.find((x) => x.key === "RETIRO");
        pe = v?.totalPE || 0;
        ppc = v?.totalPPC || 0;
        count = v?.count || 0;
      } else if (r.id === "Educación") {
        const v = carteraProd.byVidaObjetivo.find((x) => x.key === "EDUCACION");
        pe = v?.totalPE || 0;
        ppc = v?.totalPPC || 0;
        count = v?.count || 0;
      } else if (r.id === "Gastos Médicos") {
        const v = carteraProd.byRamoGroup.find((x) => x.key === "GMM");
        pe = v?.totalPE || 0;
        ppc = v?.totalPPC || 0;
        count = v?.count || 0;
      } else if (r.id === "Autos") {
        const v = carteraProd.byRamoGroup.find((x) => x.key === "AUTOS");
        pe = v?.totalPE || 0;
        ppc = v?.totalPPC || 0;
        count = v?.count || 0;
      } else if (r.id === "Daños") {
        const v = carteraProd.byRamoGroup.find((x) => x.key === "DANOS");
        pe = v?.totalPE || 0;
        ppc = v?.totalPPC || 0;
        count = v?.count || 0;
      } else if (r.id === "Otro") {
        const v = carteraProd.byRamoGroup.find((x) => x.key === "OTROS");
        const vg = carteraProd.bySubRamo.find((x) => x.key === "VIDA_GRUPO");
        pe = (v?.totalPE || 0) + (vg?.totalPE || 0);
        ppc = (v?.totalPPC || 0) + (vg?.totalPPC || 0);
        count = (v?.count || 0) + (vg?.count || 0);
      }
      return { ramo: r.id, count, pe, ppc };
    }).filter((x) => x.count > 0 || x.pe > 0 || x.ppc > 0);

    // Build agentMatrix
    const agentMatrix = activeAgentsInScope.map((agent) => {
      const agentEntry = carteraProd.byAgent.get(agent.id);
      const companiesData: Record<string, { policies: number; pe: number; ppc: number }> = {};

      for (const comp of companies) {
        const compKey = normalizeCompanyKey(canonicalCompanyName(comp.name));
        const cell = agentEntry?.byCompany[compKey];
        companiesData[comp.id] = {
          policies: cell?.count || 0,
          pe: Number((cell?.totalPE || 0).toFixed(2)),
          ppc: Number((cell?.totalPPC || 0).toFixed(2)),
        };
      }

      const agentTotalPolicies = agentEntry?.policyCount || 0;
      const agentTotalPE = Number((agentEntry?.totalPE || 0).toFixed(2));
      const agentTotalPPC = Number((agentEntry?.totalPPC || 0).toFixed(2));
      const agentBudget = Number((periodBudgetByAgent.get(agent.id) || 0).toFixed(2));
      const selectedMonthBudget = selectedMonthBudgetMap.get(agent.id);
      const agentCompliance =
        agentBudget > 0 ? Math.round((agentTotalPE / agentBudget) * 100) : 0;

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
        selectedMonthBudgetPE: selectedMonthBudget?.budgetPE ?? 0,
        budgetSource: selectedMonthBudget?.source || "NONE",
        budgetRecordId: selectedMonthBudget?.id || null,
        compliancePercent: agentCompliance,
        hasEmissionsOrBudget:
          agentTotalPolicies > 0 || agentTotalPE > 0 || agentTotalPPC > 0 || agentBudget > 0,
      };
    });

    agentMatrix.sort((a, b) => {
      if (b.totalPE !== a.totalPE) return b.totalPE - a.totalPE;
      if (b.totalPPC !== a.totalPPC) return b.totalPPC - a.totalPPC;
      if (b.totalPolicies !== a.totalPolicies) return b.totalPolicies - a.totalPolicies;
      return a.agentName.localeCompare(b.agentName);
    });

    const selectedAgencyObj =
      user.role === "SUPER_ADMIN"
        ? agencies.find((ag) => ag.id === effectiveAgencyId)
        : null;
    const canAccessGrokbotBridge =
      user.role === "SUPER_ADMIN" &&
      Boolean(
        selectedAgencyObj &&
          (selectedAgencyObj.id === "aacom" || selectedAgencyObj.slug === "aacom")
      );

    return {
      success: true,
      currentUserRole: user.role,
      userAgencyId: user.agencyId,
      selectedAgencyId: effectiveAgencyId,
      canAccessGrokbotBridge,
      agencies,
      companies,
      catalogCompanies: allAgencyCompanies,
      agents,
      emissions: [],
      ledgerRows: carteraProd.ledgerRows,
      periodInfo,
      unmappedInsurersSummary,
      legacyEmissionsCount,
      kpis: {
        totalPolicies,
        emittedPoliciesCount: carteraProd.totals.emittedPoliciesCount,
        paidReceiptsCount: carteraProd.totals.paidReceiptsCount,
        pendingApprovalCount: carteraProd.totals.pendingApprovalCount,
        totalPE,
        totalPPC,
        totalBudget,
        compliancePercent,
        byCompany,
        byRamo,
        byRamoGroup: carteraProd.byRamoGroup,
        bySubRamo: carteraProd.bySubRamo,
        byVidaObjetivo: carteraProd.byVidaObjetivo,
      },
      agentMatrix,
    };
  } catch (error: any) {
    console.error("Error getProductionDashboardData:", error);
    return {
      success: false,
      message: error.message || "Error al cargar datos del dashboard de producción",
      companies: [],
      catalogCompanies: [],
      agents: [],
      emissions: [],
      ledgerRows: [],
      agentMatrix: [],
    };
  }
}

// =====================================================================
// EVALUADOR HISTÓRICO ANTES VS. DESPUÉS Y CONCILIACIÓN NO DESTRUCTIVA
// =====================================================================

function normalizeClientForAudit(raw: string | null | undefined): string {
  return (raw || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseEmissionNoteMeta(notes: string | null | undefined) {
  const txt = notes || "";
  const fracMatch = txt.match(/recibo\s*#?\s*(\d+)\s*(?:\/|de)\s*(\d+)/i);
  const singleReceiptMatch = !fracMatch ? txt.match(/recibo\s*#?\s*(\d+)/i) : null;
  const pctMatch =
    txt.match(/participaci[oó]n\s*(\d+(?:\.\d+)?)\s*%/i) ||
    txt.match(/(\d+(?:\.\d+)?)\s*%/);

  return {
    receiptNum: fracMatch
      ? parseInt(fracMatch[1], 10)
      : singleReceiptMatch
      ? parseInt(singleReceiptMatch[1], 10)
      : null,
    totalInstallments: fracMatch ? parseInt(fracMatch[2], 10) : null,
    standaloneReceiptId: singleReceiptMatch ? singleReceiptMatch[1] : null,
    explicitPct: pctMatch ? parseFloat(pctMatch[1]) : null,
  };
}

function subtractMonthsUTC(date: Date, months: number): Date {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() - months;
  const d = date.getUTCDate();
  const target = new Date(Date.UTC(y, m, 1, 12, 0, 0));
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0, 12, 0, 0)
  ).getUTCDate();
  target.setUTCDate(Math.min(d, lastDay));
  return target;
}

interface ParsedLogicalGroup {
  groupKey: string;
  policyNumber: string;
  isSyntheticFolio: boolean;
  primaryEmissionId: string;
  emissionIds: string[];
  clientName: string;
  companyName: string;
  companyKey: string;
  rawRamo: string;
  mappedRamo: ReturnType<typeof mapHistoricalEmissionRamoToPolicy>;
  ownerAgentId: string;
  ownerAgentName: string;
  sharedWithUserId: string | null;
  sharedWithAgentName: string | null;
  sharedPercentage: number;
  isShared: boolean;
  isFractionalMultiMonth: boolean;
  estimatedEffectiveYmd: string;
  estimatedEffectiveDateUTC: Date;
  estimatedAnnualPremium: number;
  paymentMethod: string;
  beforeTotalPE: number;
  beforeTotalPPC: number;
  notesCombined: string;
  receiptEvents: Array<{
    emissionId: string;
    month: number;
    year: number;
    issueYmd: string;
    receiptNumber: number;
    totalInstallments: number;
    pe: number;
    ppc: number;
  }>;
}

async function buildHistoricalLogicalGroups(
  agencyId: string,
  targetYear: number
): Promise<{
  emissions: any[];
  logicalGroups: ParsedLogicalGroup[];
}> {
  const emissions = await prisma.agentEmission.findMany({
    where: { agencyId, year: targetYear },
    include: {
      agent: { select: { id: true, name: true, email: true } },
    },
    orderBy: [{ issueDate: "asc" }, { createdAt: "asc" }],
  });

  // Group pass 1: rows with folio
  const folioBuckets = new Map<string, any[]>();
  const noFolioRows: any[] = [];

  for (const em of emissions) {
    const cleanFolio = (em.policyNumber || "").trim();
    if (cleanFolio) {
      const k = `FOLIO:${cleanFolio.toUpperCase()}`;
      const list = folioBuckets.get(k) || [];
      list.push(em);
      folioBuckets.set(k, list);
    } else {
      noFolioRows.push(em);
    }
  }

  // Group pass 2: attach no-folio rows to matching folio bucket if receiptId OR (client+company+year+month) matches
  for (const em of noFolioRows) {
    const meta = parseEmissionNoteMeta(em.notes);
    const normClient = normalizeClientForAudit(em.clientName);
    const compKey = normalizeCompanyKey(canonicalCompanyName(em.companyName));
    let matchedKey: string | null = null;

    for (const [fKey, list] of Array.from(folioBuckets.entries())) {
      const hasReceiptMatch =
        meta.standaloneReceiptId &&
        list.some((cand) => {
          const cMeta = parseEmissionNoteMeta(cand.notes);
          return cMeta.standaloneReceiptId === meta.standaloneReceiptId;
        });

      const hasContextMatch =
        normClient &&
        list.some(
          (cand) =>
            normalizeClientForAudit(cand.clientName) === normClient &&
            normalizeCompanyKey(canonicalCompanyName(cand.companyName)) === compKey &&
            cand.month === em.month &&
            cand.year === em.year
        );

      if (hasReceiptMatch || hasContextMatch) {
        matchedKey = fKey;
        break;
      }
    }

    if (matchedKey) {
      folioBuckets.get(matchedKey)!.push(em);
    } else {
      folioBuckets.set(`NOFOLIO:${em.id}`, [em]);
    }
  }

  const logicalGroups: ParsedLogicalGroup[] = [];

  for (const [gKey, rows] of Array.from(folioBuckets.entries())) {
    rows.sort(
      (a, b) => new Date(a.issueDate).getTime() - new Date(b.issueDate).getTime()
    );
    const first = rows[0];
    const explicitFolio = rows.find((r) => (r.policyNumber || "").trim())?.policyNumber?.trim();
    const policyNumber = explicitFolio || `HIST-${first.id.slice(-6).toUpperCase()}`;
    const isSyntheticFolio = !explicitFolio;

    const beforeTotalPE = rows.reduce((s, r) => s + (Number(r.primaEmitida) || 0), 0);
    const beforeTotalPPC = rows.reduce((s, r) => s + (Number(r.primaPagada) || 0), 0);

    // Agent participation resolution
    const agentShares = new Map<
      string,
      { agentId: string; name: string; totalPE: number; totalPPC: number; pctFromNote: number | null }
    >();
    for (const r of rows) {
      const m = parseEmissionNoteMeta(r.notes);
      const cur = agentShares.get(r.agentId) || {
        agentId: r.agentId,
        name: r.agent?.name || r.agent?.email || "Agente",
        totalPE: 0,
        totalPPC: 0,
        pctFromNote: null,
      };
      cur.totalPE += Number(r.primaEmitida) || 0;
      cur.totalPPC += Number(r.primaPagada) || 0;
      if (m.explicitPct && m.explicitPct > 0 && m.explicitPct < 100) {
        cur.pctFromNote = m.explicitPct;
      }
      agentShares.set(r.agentId, cur);
    }

    const orderedAgents = Array.from(agentShares.values()).sort(
      (a, b) => (b.totalPE || b.totalPPC) - (a.totalPE || a.totalPPC)
    );
    const owner = orderedAgents[0];
    const second = orderedAgents.length > 1 ? orderedAgents[1] : null;

    let sharedPercentage = 0;
    if (second) {
      const totalAmt = (owner.totalPE || owner.totalPPC) + (second.totalPE || second.totalPPC);
      if (second.pctFromNote) {
        sharedPercentage = Number(second.pctFromNote.toFixed(2));
      } else if (owner.pctFromNote) {
        sharedPercentage = Number((100 - owner.pctFromNote).toFixed(2));
      } else if (totalAmt > 0) {
        sharedPercentage = Number(
          (((second.totalPE || second.totalPPC) / totalAmt) * 100).toFixed(2)
        );
      } else {
        sharedPercentage = 50;
      }
    }

    // Group rows by month/date event (combining co-participations in the same month)
    const eventMap = new Map<
      string,
      {
        emissionId: string;
        month: number;
        year: number;
        issueDate: Date;
        pe: number;
        ppc: number;
        receiptNum: number | null;
        totalInstallments: number | null;
      }
    >();

    for (const r of rows) {
      const meta = parseEmissionNoteMeta(r.notes);
      const bucketKey = meta.receiptNum
        ? `R:${meta.receiptNum}:${meta.totalInstallments || 0}:${r.year}-${r.month}`
        : `M:${r.year}-${r.month}`;
      const prev = eventMap.get(bucketKey);
      if (!prev) {
        eventMap.set(bucketKey, {
          emissionId: r.id,
          month: r.month,
          year: r.year,
          issueDate: new Date(r.issueDate),
          pe: Number(r.primaEmitida) || 0,
          ppc: Number(r.primaPagada) || 0,
          receiptNum: meta.totalInstallments ? meta.receiptNum : null,
          totalInstallments: meta.totalInstallments,
        });
      } else {
        prev.pe += Number(r.primaEmitida) || 0;
        prev.ppc += Number(r.primaPagada) || 0;
        if (new Date(r.issueDate).getTime() < prev.issueDate.getTime()) {
          prev.issueDate = new Date(r.issueDate);
        }
      }
    }

    const events = Array.from(eventMap.values()).sort(
      (a, b) => a.issueDate.getTime() - b.issueDate.getTime()
    );

    const parsedTotals = events
      .map((e) => e.totalInstallments)
      .filter((x): x is number => typeof x === "number" && x > 1);
    const totalInstallments =
      parsedTotals.length > 0
        ? Math.max(...parsedTotals)
        : events.length > 1
        ? 12
        : 1;

    const paymentMethod =
      totalInstallments === 12
        ? "Mensual"
        : totalInstallments === 4
        ? "Trimestral"
        : totalInstallments === 2
        ? "Semestral"
        : "Anual";

    const parsedNums = events
      .map((e) => e.receiptNum)
      .filter((x): x is number => typeof x === "number" && x >= 1);
    const minReceiptNum = parsedNums.length > 0 ? Math.min(...parsedNums) : 1;

    const earliestDate = events[0].issueDate;
    const monthsPerInstallment = Math.max(1, Math.round(12 / totalInstallments));
    const estimatedEffectiveDateUTC =
      minReceiptNum > 1
        ? subtractMonthsUTC(earliestDate, (minReceiptNum - 1) * monthsPerInstallment)
        : earliestDate;
    const estimatedEffectiveYmd = toYmdKey(estimatedEffectiveDateUTC) || `${targetYear}-01-01`;

    const avgEventPE =
      events.reduce((s, e) => s + (e.pe || e.ppc), 0) / Math.max(1, events.length);
    const estimatedAnnualPremium = Number(
      (parsedTotals.length > 0 || events.length > 1
        ? avgEventPE * totalInstallments
        : beforeTotalPE || beforeTotalPPC
      ).toFixed(2)
    );

    const isFractionalMultiMonth = parsedTotals.length > 0 || events.length > 1;
    const receiptEvents = events.map((ev, idx) => ({
      emissionId: ev.emissionId,
      month: ev.month,
      year: ev.year,
      issueYmd: toYmdKey(ev.issueDate) || `${ev.year}-${String(ev.month).padStart(2, "0")}-15`,
      receiptNumber: ev.receiptNum || minReceiptNum + idx,
      totalInstallments,
      pe: Number(ev.pe.toFixed(2)),
      ppc: Number(ev.ppc.toFixed(2)),
    }));

    const canonCompany = canonicalCompanyName(first.companyName || "Sin Aseguradora") || "Sin Aseguradora";
    const companyKey = normalizeCompanyKey(canonCompany);
    const notesCombined = rows
      .map((r) => r.notes)
      .filter(Boolean)
      .join(" | ");
    const clientName =
      rows.find((r) => (r.clientName || "").trim())?.clientName?.trim() || "Cliente Sin Nombre";
    const mappedRamo = mapHistoricalEmissionRamoToPolicy(first.ramo, notesCombined, clientName);

    logicalGroups.push({
      groupKey: gKey,
      policyNumber,
      isSyntheticFolio,
      primaryEmissionId: first.id,
      emissionIds: rows.map((r) => r.id),
      clientName,
      companyName: canonCompany,
      companyKey,
      rawRamo: first.ramo || "Protección",
      mappedRamo,
      ownerAgentId: owner.agentId,
      ownerAgentName: owner.name,
      sharedWithUserId: second ? second.agentId : null,
      sharedWithAgentName: second ? second.name : null,
      sharedPercentage,
      isShared: Boolean(second),
      isFractionalMultiMonth,
      estimatedEffectiveYmd,
      estimatedEffectiveDateUTC,
      estimatedAnnualPremium,
      paymentMethod,
      beforeTotalPE: Number(beforeTotalPE.toFixed(2)),
      beforeTotalPPC: Number(beforeTotalPPC.toFixed(2)),
      notesCombined,
      receiptEvents,
    });
  }

  return { emissions, logicalGroups };
}

export async function getProductionReconciliationAudit(options?: {
  year?: number;
  agencyId?: string;
}) {
  try {
    const user = await verifyAdminUser();
    const effectiveAgencyId = resolveTargetAgencyId(user, options?.agencyId);
    const targetYear = options?.year || new Date().getFullYear();

    const [{ emissions, logicalGroups }, policies, yearCarteraProd] = await Promise.all([
      buildHistoricalLogicalGroups(effectiveAgencyId, targetYear),
      prisma.policy.findMany({
        where: {
          isArchived: false,
          deletedAt: null,
          OR: [
            { agencyId: effectiveAgencyId },
            { agencyId: null, user: { agencyId: effectiveAgencyId } },
          ],
        },
        include: {
          client: { select: { id: true, name: true } },
          user: { select: { id: true, name: true, email: true } },
          sharedWithUser: { select: { id: true, name: true, email: true } },
          receipts: { orderBy: [{ policyYear: "asc" }, { receiptNumber: "asc" }] },
        },
      }),
      computeAgencyCarteraProduction({
        agencyId: effectiveAgencyId,
        startYmd: `${targetYear}-01-01`,
        endYmd: `${targetYear}-12-31`,
        businessScope: "NUEVA",
        onlyAdminApproved: false,
      }),
    ]);

    const policyByNumber = new Map<string, (typeof policies)[number]>();
    const policyBySourceEmission = new Map<string, (typeof policies)[number]>();
    for (const p of policies) {
      if (p.policyNumber) {
        policyByNumber.set(p.policyNumber.trim().toUpperCase(), p);
      }
      if (p.sourceEmissionId) {
        policyBySourceEmission.set(p.sourceEmissionId, p);
      }
    }

    const matchedPolicyIds = new Set<string>();
    const reconciliationItems: any[] = [];
    let additionalProjectedPE = 0;
    let additionalProjectedPPC = 0;

    for (const g of logicalGroups) {
      let existing =
        g.emissionIds
          .map((eid) => policyBySourceEmission.get(eid))
          .find(Boolean) ||
        (!g.isSyntheticFolio
          ? policyByNumber.get(g.policyNumber.trim().toUpperCase())
          : undefined);

      if (existing) {
        matchedPolicyIds.add(existing.id);
      }

      if (!existing) {
        // Falta en Cartera
        const peInTargetYear =
          g.estimatedEffectiveYmd >= `${targetYear}-01-01` &&
          g.estimatedEffectiveYmd <= `${targetYear}-12-31`
            ? g.estimatedAnnualPremium
            : 0;
        additionalProjectedPE += peInTargetYear;
        additionalProjectedPPC += g.beforeTotalPPC;

        reconciliationItems.push({
          groupKey: g.groupKey,
          status: "FALTA_EN_CARTERA",
          policyNumber: g.policyNumber,
          isSyntheticFolio: g.isSyntheticFolio,
          clientName: g.clientName,
          companyName: g.companyName,
          ownerAgentId: g.ownerAgentId,
          ownerAgentName: g.ownerAgentName,
          sharedWithUserId: g.sharedWithUserId,
          sharedWithAgentName: g.sharedWithAgentName,
          sharedPercentage: g.sharedPercentage,
          isShared: g.isShared,
          isFractionalMultiMonth: g.isFractionalMultiMonth,
          ramoLabel: g.mappedRamo.subRamoKey,
          paymentMethod: g.paymentMethod,
          beforePE: g.beforeTotalPE,
          beforePPC: g.beforeTotalPPC,
          afterPE: 0,
          afterPPC: 0,
          existingPolicyId: null,
          existingCompanyName: null,
          estimatedEffectiveYmd: g.estimatedEffectiveYmd,
          estimatedAnnualPremium: g.estimatedAnnualPremium,
          differences: [
            "No existe aún en Mi Cartera",
            ...(g.isShared
              ? [`Co-participación detectada (${g.ownerAgentName} / ${g.sharedWithAgentName} ${g.sharedPercentage}%)`]
              : []),
            ...(g.isFractionalMultiMonth
              ? [`Póliza fraccionada multi-mes (${g.receiptEvents.length} recibos registrados)`]
              : []),
          ],
          receiptEvents: g.receiptEvents,
        });
      } else {
        const differences: string[] = [];
        const existingCompCanon = canonicalCompanyName(existing.insuranceCompany);
        if (normalizeCompanyKey(existingCompCanon) !== g.companyKey) {
          differences.push(
            `Aseguradora distinta: Cartera dice "${existing.insuranceCompany || "Sin especificar"}" vs Producción "${g.companyName}"`
          );
        }

        if (g.isShared && (!existing.sharedWithUserId || Number(existing.sharedPercentage) <= 0)) {
          differences.push(
            `Falta configurar co-agente compartido: ${g.sharedWithAgentName} (${g.sharedPercentage}%)`
          );
        }

        const existingEffYmd = toYmdKey(existing.effectiveDate);
        const existingIsNewInYear =
          !existing.isRenewalCapture &&
          existing.subStatus !== "RENOVACION" &&
          existingEffYmd &&
          existingEffYmd >= `${targetYear}-01-01` &&
          existingEffYmd <= `${targetYear}-12-31`;
        const afterPE = existingIsNewInYear ? Number(existing.annualPremium) || 0 : 0;

        let afterPPC = 0;
        let expectedUnpaidPPC = 0;
        for (const ev of g.receiptEvents) {
          const matchingRec = existing.receipts.find(
            (r) =>
              r.policyYear === 1 &&
              (r.receiptNumber === ev.receiptNumber ||
                (g.receiptEvents.length === 1 && r.receiptNumber === 1))
          );
          if (matchingRec && matchingRec.status === "PAGADO") {
            afterPPC += Number(matchingRec.paidAmount ?? matchingRec.amount ?? 0);
          } else if (ev.ppc > 0) {
            expectedUnpaidPPC += ev.ppc;
            differences.push(
              `Recibo #${ev.receiptNumber} cobrado en Producción ($${ev.ppc.toLocaleString("es-MX")}) sigue pendiente en Cartera`
            );
          }
        }

        // Fallback sum of all Year 1 PAGADO receipts if receipt numbering differs
        const totalCarteraPaidY1 = existing.receipts
          .filter((r) => r.status === "PAGADO" && r.policyYear <= 1)
          .reduce((s, r) => s + Number(r.paidAmount ?? r.amount ?? 0), 0);
        if (afterPPC === 0 && totalCarteraPaidY1 > 0 && expectedUnpaidPPC === 0) {
          afterPPC = totalCarteraPaidY1;
        }

        additionalProjectedPPC += expectedUnpaidPPC;

        const status =
          differences.length === 0 ? "CONCILIADO_EXACTO" : "EXISTE_CON_DIFERENCIA";

        reconciliationItems.push({
          groupKey: g.groupKey,
          status,
          policyNumber: g.policyNumber,
          isSyntheticFolio: false,
          clientName: g.clientName,
          companyName: g.companyName,
          ownerAgentId: g.ownerAgentId,
          ownerAgentName: g.ownerAgentName,
          sharedWithUserId: g.sharedWithUserId,
          sharedWithAgentName: g.sharedWithAgentName,
          sharedPercentage: g.sharedPercentage,
          isShared: g.isShared,
          isFractionalMultiMonth: g.isFractionalMultiMonth,
          ramoLabel: classifyPolicyRamo(existing).fullLabel,
          paymentMethod: existing.paymentMethod || g.paymentMethod,
          beforePE: g.beforeTotalPE,
          beforePPC: g.beforeTotalPPC,
          afterPE: Number(afterPE.toFixed(2)),
          afterPPC: Number(afterPPC.toFixed(2)),
          existingPolicyId: existing.id,
          existingCompanyName: existing.insuranceCompany,
          estimatedEffectiveYmd: existingEffYmd || g.estimatedEffectiveYmd,
          estimatedAnnualPremium: existing.annualPremium || g.estimatedAnnualPremium,
          differences,
          receiptEvents: g.receiptEvents,
        });
      }
    }

    // Policies in Mi Cartera with effectiveDate in targetYear NOT present in AgentEmission
    const carteraOnlyItems = policies
      .filter((p) => {
        if (matchedPolicyIds.has(p.id)) return false;
        const effYmd = toYmdKey(p.effectiveDate);
        return Boolean(
          effYmd &&
            effYmd >= `${targetYear}-01-01` &&
            effYmd <= `${targetYear}-12-31`
        );
      })
      .map((p) => {
        const ramoInfo = classifyPolicyRamo(p);
        const paidTotal = (p.receipts || [])
          .filter((r) => r.status === "PAGADO")
          .reduce((s, r) => s + Number(r.paidAmount ?? r.amount ?? 0), 0);
        return {
          policyId: p.id,
          clientId: p.clientId,
          policyNumber: p.policyNumber,
          clientName: p.contractor || p.client?.name || "Cliente",
          insuranceCompany: p.insuranceCompany || "Sin aseguradora",
          agentName: p.user?.name || p.user?.email || "Agente",
          effectiveDate: toYmdKey(p.effectiveDate),
          annualPremium: Number(p.annualPremium) || 0,
          paidTotal: Number(paidTotal.toFixed(2)),
          ramoLabel: ramoInfo.fullLabel,
          isRenewalCapture: Boolean(p.isRenewalCapture) || p.subStatus === "RENOVACION",
          subStatus: p.subStatus,
        };
      });

    // Monthly comparison (1..12)
    const monthlyComparison: any[] = [];
    for (let m = 1; m <= 12; m++) {
      const mStr = String(m).padStart(2, "0");
      const mStart = `${targetYear}-${mStr}-01`;
      const mEnd = `${targetYear}-${mStr}-31`;

      const monthEmissions = emissions.filter((e) => e.month === m);
      const beforePE = monthEmissions.reduce((s, e) => s + (Number(e.primaEmitida) || 0), 0);
      const beforePPC = monthEmissions.reduce((s, e) => s + (Number(e.primaPagada) || 0), 0);

      let afterPE = 0;
      let afterPPC = 0;
      for (const p of policies) {
        if (p.status === "CANCELADA" || p.subStatus === "NO_TOMADA") continue;
        const effYmd = toYmdKey(p.effectiveDate);
        if (
          !p.isRenewalCapture &&
          p.subStatus !== "RENOVACION" &&
          effYmd &&
          effYmd >= mStart &&
          effYmd <= mEnd
        ) {
          afterPE += Number(p.annualPremium) || 0;
        }
        for (const r of p.receipts || []) {
          if (r.status !== "PAGADO" || r.policyYear > 1) continue;
          const pYmd = toYmdKey(r.paidAt || r.dueDate);
          if (pYmd && pYmd >= mStart && pYmd <= mEnd) {
            afterPPC += Number(r.paidAmount ?? r.amount ?? 0);
          }
        }
      }

      if (beforePE > 0 || beforePPC > 0 || afterPE > 0 || afterPPC > 0) {
        monthlyComparison.push({
          month: m,
          monthName: MONTH_NAMES_ES[m - 1],
          beforeCount: monthEmissions.length,
          beforePE: Number(beforePE.toFixed(2)),
          beforePPC: Number(beforePPC.toFixed(2)),
          afterPE: Number(afterPE.toFixed(2)),
          afterPPC: Number(afterPPC.toFixed(2)),
          diffPE: Number((afterPE - beforePE).toFixed(2)),
          diffPPC: Number((afterPPC - beforePPC).toFixed(2)),
        });
      }
    }

    // Agent comparison
    const agentCompMap = new Map<
      string,
      {
        agentId: string;
        agentName: string;
        beforePE: number;
        beforePPC: number;
        afterPE: number;
        afterPPC: number;
      }
    >();
    for (const em of emissions) {
      const cur = agentCompMap.get(em.agentId) || {
        agentId: em.agentId,
        agentName: em.agent?.name || em.agent?.email || "Agente",
        beforePE: 0,
        beforePPC: 0,
        afterPE: 0,
        afterPPC: 0,
      };
      cur.beforePE += Number(em.primaEmitida) || 0;
      cur.beforePPC += Number(em.primaPagada) || 0;
      agentCompMap.set(em.agentId, cur);
    }

    const agencyUsers = await prisma.user.findMany({
      where: { agencyId: effectiveAgencyId },
      select: { id: true, name: true, email: true },
    });
    const userNameMap = new Map(agencyUsers.map((u) => [u.id, u.name || u.email]));

    for (const [agId, entry] of Array.from(yearCarteraProd.byAgent.entries())) {
      const cur = agentCompMap.get(agId) || {
        agentId: agId,
        agentName: userNameMap.get(agId) || "Agente",
        beforePE: 0,
        beforePPC: 0,
        afterPE: 0,
        afterPPC: 0,
      };
      cur.afterPE += entry.totalPE;
      cur.afterPPC += entry.totalPPC;
      agentCompMap.set(agId, cur);
    }

    const agentComparison = Array.from(agentCompMap.values())
      .map((a) => ({
        ...a,
        beforePE: Number(a.beforePE.toFixed(2)),
        beforePPC: Number(a.beforePPC.toFixed(2)),
        afterPE: Number(a.afterPE.toFixed(2)),
        afterPPC: Number(a.afterPPC.toFixed(2)),
        diffPE: Number((a.afterPE - a.beforePE).toFixed(2)),
        diffPPC: Number((a.afterPPC - a.beforePPC).toFixed(2)),
      }))
      .sort((a, b) => b.beforePE + b.afterPE - (a.beforePE + a.afterPE));

    const kpiBefore = {
      emissionRowsCount: emissions.length,
      uniquePoliciesCount: logicalGroups.length,
      totalPE: Number(
        emissions.reduce((s, e) => s + (Number(e.primaEmitida) || 0), 0).toFixed(2)
      ),
      totalPPC: Number(
        emissions.reduce((s, e) => s + (Number(e.primaPagada) || 0), 0).toFixed(2)
      ),
    };

    const kpiAfter = {
      policiesCount: yearCarteraProd.totals.uniquePoliciesCount,
      totalPE: yearCarteraProd.totals.totalPE,
      totalPPC: yearCarteraProd.totals.totalPPC,
    };

    const kpiProjectedAfterReconcile = {
      totalPE: Number((kpiAfter.totalPE + additionalProjectedPE).toFixed(2)),
      totalPPC: Number((kpiAfter.totalPPC + additionalProjectedPPC).toFixed(2)),
    };

    return {
      success: true,
      year: targetYear,
      agencyId: effectiveAgencyId,
      kpiBefore,
      kpiAfter,
      kpiProjectedAfterReconcile,
      monthlyComparison,
      agentComparison,
      reconciliationItems,
      carteraOnlyItems,
      summaryCounts: {
        totalGroups: reconciliationItems.length,
        exactMatch: reconciliationItems.filter((i) => i.status === "CONCILIADO_EXACTO").length,
        withDifference: reconciliationItems.filter((i) => i.status === "EXISTE_CON_DIFERENCIA").length,
        missingInCartera: reconciliationItems.filter((i) => i.status === "FALTA_EN_CARTERA").length,
      },
    };
  } catch (error: any) {
    console.error("Error getProductionReconciliationAudit:", error);
    return {
      success: false,
      message: error.message || "Error al generar evaluación Antes vs. Después",
    };
  }
}

export async function reconcileHistoricalEmissionsToCartera(params: {
  agencyId?: string;
  year?: number;
  groupKeys?: string[];
  dryRun?: boolean;
}) {
  try {
    const user = await verifyAdminUser();
    const effectiveAgencyId = resolveTargetAgencyId(user, params.agencyId);
    const targetYear = params.year || new Date().getFullYear();
    const dryRun = Boolean(params.dryRun);

    const { logicalGroups } = await buildHistoricalLogicalGroups(
      effectiveAgencyId,
      targetYear
    );

    const selectedKeys =
      params.groupKeys && params.groupKeys.length > 0
        ? new Set(params.groupKeys)
        : null;

    const targetGroups = selectedKeys
      ? logicalGroups.filter((g) => selectedKeys.has(g.groupKey))
      : logicalGroups;

    let createdPolicies = 0;
    let updatedPolicies = 0;
    let markedReceiptsPaid = 0;
    let skippedCrossTenant = 0;
    const warnings: string[] = [];
    const previewActions: Array<{
      groupKey: string;
      policyNumber: string;
      clientName: string;
      action: string;
      details: string;
    }> = [];

    for (const g of targetGroups) {
      const existingBySource = await prisma.policy.findFirst({
        where: {
          agencyId: effectiveAgencyId,
          sourceEmissionId: { in: g.emissionIds },
          isArchived: false,
        },
        include: { receipts: true },
      });

      const existingByFolio =
        !existingBySource && !g.isSyntheticFolio
          ? await prisma.policy.findUnique({
              where: { policyNumber: g.policyNumber },
              include: { receipts: true },
            })
          : null;

      if (
        existingByFolio &&
        existingByFolio.agencyId &&
        existingByFolio.agencyId !== effectiveAgencyId
      ) {
        skippedCrossTenant++;
        warnings.push(
          `Póliza ${g.policyNumber} omitida porque ya pertenece a otra agencia.`
        );
        continue;
      }

      const existing = existingBySource || existingByFolio;

      if (!existing) {
        if (dryRun) {
          createdPolicies++;
          const paidCount = g.receiptEvents.filter((r) => r.ppc > 0).length;
          markedReceiptsPaid += paidCount;
          previewActions.push({
            groupKey: g.groupKey,
            policyNumber: g.policyNumber,
            clientName: g.clientName,
            action: "CREAR_EN_CARTERA",
            details: `Crear póliza ${g.companyName} (${g.mappedRamo.subRamoKey}), vigencia ${g.estimatedEffectiveYmd}, prima anual $${g.estimatedAnnualPremium.toLocaleString("es-MX")}${
              g.isShared ? `, compartida con ${g.sharedWithAgentName} (${g.sharedPercentage}%)` : ""
            } y ${paidCount} recibo(s) pagado(s).`,
          });
          continue;
        }

        // Find or create Client within same agency & owner
        let client = await prisma.client.findFirst({
          where: {
            agencyId: effectiveAgencyId,
            name: { equals: g.clientName, mode: "insensitive" },
            isArchived: false,
          },
        });
        if (!client) {
          client = await prisma.client.create({
            data: {
              agencyId: effectiveAgencyId,
              userId: g.ownerAgentId,
              name: g.clientName,
              notes: "Cliente creado automáticamente por Conciliación Producción -> Mi Cartera",
            },
          });
        }

        const newPolicy = await prisma.policy.create({
          data: {
            agencyId: effectiveAgencyId,
            userId: g.ownerAgentId,
            clientId: client.id,
            policyNumber: g.policyNumber,
            contractor: g.clientName,
            insured: g.clientName,
            product: g.rawRamo,
            insuranceCompany: g.companyName,
            ramo: g.mappedRamo.ramo,
            subRamo: g.mappedRamo.subRamo,
            vidaObjetivo: g.mappedRamo.vidaObjetivo,
            tipoVigencia: g.mappedRamo.tipoVigencia,
            currency: "MXN",
            status: "VIGENTE",
            subStatus: "NUEVA",
            isRenewalCapture: false,
            adminApproved: true,
            sharedWithUserId: g.sharedWithUserId,
            sharedPercentage: g.sharedPercentage,
            sourceEmissionId: g.primaryEmissionId,
            effectiveDate: toUTCNoonDate(g.estimatedEffectiveYmd) || g.estimatedEffectiveDateUTC,
            annualPremium: g.estimatedAnnualPremium,
            paymentMethod: g.paymentMethod,
            observations: g.notesCombined || "Conciliada desde historial de Producción",
          },
        });

        const drafts = buildPolicyReceiptsDrafts(newPolicy, {
          autoMarkHistoricalPaid: false,
        });
        if (drafts.length > 0) {
          await prisma.policyReceipt.createMany({
            data: drafts,
            skipDuplicates: true,
          });
        }

        const insertedReceipts = await prisma.policyReceipt.findMany({
          where: { policyId: newPolicy.id, policyYear: 1 },
          orderBy: { receiptNumber: "asc" },
        });

        for (const ev of g.receiptEvents) {
          if (ev.ppc <= 0) continue;
          const targetRec =
            insertedReceipts.find((r) => r.receiptNumber === ev.receiptNumber) ||
            insertedReceipts.find((r) => r.status !== "PAGADO");
          if (targetRec) {
            await prisma.policyReceipt.update({
              where: { id: targetRec.id },
              data: {
                status: "PAGADO",
                paidAt: toUTCNoonDate(ev.issueYmd),
                paidAmount: ev.ppc,
                adminApproved: true,
                paymentNotes: `Conciliado desde emisión histórica (${ev.issueYmd})`,
              },
            });
            markedReceiptsPaid++;
          }
        }

        createdPolicies++;
      } else {
        // Enrich existing policy non-destructively
        const updateData: any = {};
        const reasons: string[] = [];

        if (!existing.sourceEmissionId) {
          updateData.sourceEmissionId = g.primaryEmissionId;
        }
        if (
          normalizeCompanyKey(canonicalCompanyName(existing.insuranceCompany)) !== g.companyKey &&
          g.companyName &&
          g.companyName !== "Sin Aseguradora"
        ) {
          updateData.insuranceCompany = g.companyName;
          reasons.push(`Aseguradora -> ${g.companyName}`);
        }
        if (g.isShared && (!existing.sharedWithUserId || Number(existing.sharedPercentage) <= 0)) {
          updateData.sharedWithUserId = g.sharedWithUserId;
          updateData.sharedPercentage = g.sharedPercentage;
          reasons.push(`Co-agente ${g.sharedWithAgentName} (${g.sharedPercentage}%)`);
        }
        if (!existing.subRamo) {
          updateData.subRamo = g.mappedRamo.subRamo;
        }
        if (!existing.vidaObjetivo && g.mappedRamo.vidaObjetivo) {
          updateData.vidaObjetivo = g.mappedRamo.vidaObjetivo;
        }

        let receiptsToMarkPaid = 0;
        if (dryRun) {
          for (const ev of g.receiptEvents) {
            if (ev.ppc <= 0) continue;
            const matchRec = existing.receipts.find(
              (r) =>
                r.policyYear === 1 &&
                (r.receiptNumber === ev.receiptNumber ||
                  (g.receiptEvents.length === 1 && r.receiptNumber === 1))
            );
            if (!matchRec || matchRec.status !== "PAGADO") {
              receiptsToMarkPaid++;
              reasons.push(`Marcar recibo #${ev.receiptNumber} pagado ($${ev.ppc})`);
            }
          }
          if (reasons.length > 0) {
            updatedPolicies++;
            markedReceiptsPaid += receiptsToMarkPaid;
            previewActions.push({
              groupKey: g.groupKey,
              policyNumber: g.policyNumber,
              clientName: g.clientName,
              action: "ENRIQUECER_EXISTENTE",
              details: reasons.join(" • "),
            });
          }
          continue;
        }

        if (Object.keys(updateData).length > 0) {
          await prisma.policy.update({
            where: { id: existing.id },
            data: updateData,
          });
        }

        let currentReceipts = existing.receipts;
        if (currentReceipts.length === 0) {
          const drafts = buildPolicyReceiptsDrafts(existing, { autoMarkHistoricalPaid: false });
          if (drafts.length > 0) {
            await prisma.policyReceipt.createMany({ data: drafts, skipDuplicates: true });
            currentReceipts = await prisma.policyReceipt.findMany({
              where: { policyId: existing.id },
              orderBy: [{ policyYear: "asc" }, { receiptNumber: "asc" }],
            });
          }
        }

        for (const ev of g.receiptEvents) {
          if (ev.ppc <= 0) continue;
          const matchRec =
            currentReceipts.find(
              (r) =>
                r.policyYear === 1 &&
                (r.receiptNumber === ev.receiptNumber ||
                  (g.receiptEvents.length === 1 && r.receiptNumber === 1))
            ) || currentReceipts.find((r) => r.policyYear === 1 && r.status !== "PAGADO");

          if (matchRec && matchRec.status !== "PAGADO") {
            await prisma.policyReceipt.update({
              where: { id: matchRec.id },
              data: {
                status: "PAGADO",
                paidAt: toUTCNoonDate(ev.issueYmd),
                paidAmount: ev.ppc,
                adminApproved: true,
                paymentNotes:
                  matchRec.paymentNotes ||
                  `Conciliado desde emisión histórica (${ev.issueYmd})`,
              },
            });
            receiptsToMarkPaid++;
            markedReceiptsPaid++;
          }
        }

        if (Object.keys(updateData).length > 0 || receiptsToMarkPaid > 0) {
          updatedPolicies++;
        }
      }
    }

    if (!dryRun) {
      revalidatePath("/cartera");
      revalidatePath("/cartera/clientes");
      revalidatePath("/admin");
      revalidatePath("/admin/produccion");
      revalidatePath("/ranking");
    }

    return {
      success: true,
      dryRun,
      createdPolicies,
      updatedPolicies,
      markedReceiptsPaid,
      skippedCrossTenant,
      warnings,
      previewActions,
    };
  } catch (error: any) {
    console.error("Error reconcileHistoricalEmissionsToCartera:", error);
    return {
      success: false,
      message: error.message || "Error al conciliar historial hacia Mi Cartera",
    };
  }
}
