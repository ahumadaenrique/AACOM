"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { RAMOS_CATALOGO, DEFAULT_COMPANIES, MONTH_NAMES_ES } from "@/lib/productionConstants";
import { toUTCNoonDate } from "@/app/(dashboard)/cartera/dateUtils";

const MIGRATION_SETTING_KEY = "production_companies_multitenant_v1";
let isProductionCompaniesMigratedInMemory = false;

function normalizeCompanyKey(raw: string | null | undefined): string {
  return (raw || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function canonicalCompanyName(raw: string | null | undefined): string {
  const key = normalizeCompanyKey(raw);
  switch (key) {
    case "insignia":
    case "insignia life":
      return "Insignia Life";
    case "gnp":
    case "gnp seguros":
    case "grupo nacional provincial":
      return "GNP Seguros";
    case "la latino":
    case "la latino seguros":
    case "la latinoamericana":
    case "la latinoamericana seguros":
      return "La Latinoamericana Seguros";
    case "plan seguro":
      return "Plan Seguro";
    case "smnyl":
    case "monterrey":
    case "seguros monterrey":
    case "seguros monterrey nyl":
      return "Seguros Monterrey NYL";
    case "axa":
    case "axa seguros":
      return "AXA Seguros";
    case "metlife":
      return "MetLife";
    case "qualitas":
      return "Quálitas";
    case "mapfre":
      return "Mapfre";
    case "allianz":
      return "Allianz";
    default:
      return (raw || "").trim();
  }
}

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

  const impersonateId = user.role === "SUPER_ADMIN" ? cookies().get("impersonateAgencyId")?.value : undefined;
  const effectiveUserAgencyId = (impersonateId || (session.user as any)?.agencyId || user.agencyId || "aacom") as string;

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
 * estrictamente por agencyId (eliminando filas globales agencyId = null)
 * y reconectar emisiones históricas.
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

    // Conservar logotipos y colores previamente cargados en filas globales o de agencia
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

      // Incluir cualquier compañía personalizada existente propia de esa agencia o presente en sus emisiones
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

      // Materializar filas aisladas para esta agencia y eliminar duplicados internos
      const resolvedCompanyIdByKey = new Map<string, { id: string; name: string }>();
      const matchedExistingIds = new Set<string>();

      for (const [k, desired] of Array.from(desiredMap.entries())) {
        const candidates = agencyExistingCompanies.filter(
          (c) => normalizeCompanyKey(canonicalCompanyName(c.name)) === k
        );

        if (candidates.length > 0) {
          const primary = candidates.find((c) => !!c.logoUrl) || candidates[0];
          matchedExistingIds.add(primary.id);
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

      // Reconectar todas las emisiones de esta agencia a su propia fila InsuranceCompany
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

    // Eliminar todas las filas globales huérfanas (agencyId IS NULL) para impedir contaminación futura
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

/**
 * Inicializa el catálogo aislado de 8 aseguradoras base APAGADAS (0 activas)
 * cuando una agencia nueva entra por primera vez al módulo.
 */
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
        // Ignorar colisiones si dos peticiones concurrentes inicializan la misma agencia
      }
    }
  }
}

/**
 * Fusiona y limpia duplicados dentro de una misma agencia preservando logos y emisiones.
 */
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
      where: {
        agencyId: effectiveAgencyId,
      },
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
      // Si ya existe en esta misma agencia (ej. apagada), la reactivamos y actualizamos sin duplicar
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
            name: nameTrimmed,
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
            name: nameTrimmed,
            logoUrl: data.logoUrl || null,
            color: data.color || "#0284c7",
            order: data.order ?? agencyCompanies.length + 1,
            active: data.active ?? true,
          },
        });
      }

      // Reconectar emisiones sin vínculo en esta misma agencia cuyo nombre coincida
      const unlinkedEmissions = await prisma.agentEmission.findMany({
        where: { agencyId: targetAgencyId, companyId: null },
        select: { id: true, companyName: true },
      });
      for (const em of unlinkedEmissions) {
        if (normalizeCompanyKey(canonicalCompanyName(em.companyName)) === targetKey) {
          await prisma.agentEmission.update({
            where: { id: em.id },
            data: { companyId: savedCompany.id },
          });
        }
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

    if (active) {
      const targetKey = normalizeCompanyKey(canonicalCompanyName(existing.name));
      const unlinkedEmissions = await prisma.agentEmission.findMany({
        where: { agencyId: targetAgencyId, companyId: null },
        select: { id: true, companyName: true },
      });
      for (const em of unlinkedEmissions) {
        if (normalizeCompanyKey(canonicalCompanyName(em.companyName)) === targetKey) {
          await prisma.agentEmission.update({
            where: { id: em.id },
            data: { companyId: updated.id },
          });
        }
      }
    }

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
      // Las 8 compañías base se apagan para esta agencia sin borrar la fila ni romper vínculos históricos
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

    const dateObj = toUTCNoonDate(data.issueDate) || toUTCNoonDate(new Date());
    if (!dateObj || isNaN(dateObj.getTime())) throw new Error("Fecha de emisión inválida.");

    const year = dateObj.getUTCFullYear();
    const month = dateObj.getUTCMonth() + 1; // 1-indexed

    const agent = await prisma.user.findUnique({
      where: { id: data.agentId },
      select: { id: true, agencyId: true, name: true },
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

// 6. Eliminar Emisión de Póliza
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
    const monthName = MONTH_NAMES_ES[month - 1]; // e.g. "Septiembre"

    // Search reviewed PEAs strictly for this agency
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
      orderBy: { createdAt: "asc" }, // First reviewed takes precedence
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
    return { success: true, syncedCount, totalFound: reviews.length };
  } catch (error: any) {
    console.error("Error syncBudgetsFromPea:", error);
    return { success: false, message: error.message || "Error al sincronizar presupuestos PEA" };
  }
}

// 9. Cargar Todo el Dashboard de Producción (100% Aislado por Agencia)
export async function getProductionDashboardData(options: {
  year: number;
  month: number;
  agencyId?: string;
  agentId?: string;
  companyId?: string;
}) {
  try {
    await ensureProductionCompaniesMigratedOnce();
    const user = await verifyAdminUser();
    const { year, month } = options;

    // SaaS Multi-tenancy Isolation:
    // Regular admins can NEVER access data outside their agency.
    // Super admins default to user.agencyId (including impersonateAgencyId cookie) unless selecting another agency.
    const effectiveAgencyId = resolveTargetAgencyId(user, options.agencyId);

    await ensureAgencyCompaniesSeeded(effectiveAgencyId);

    // 1. Fetch ALL companies strictly belonging to THIS agency (never agencyId = null)
    const rawAgencyCompanies = await prisma.insuranceCompany.findMany({
      where: {
        agencyId: effectiveAgencyId,
      },
      orderBy: [{ active: "desc" }, { order: "asc" }, { name: "asc" }],
    });

    const allAgencyCompanies = await deduplicateAgencyCompaniesIfNeeded(
      effectiveAgencyId,
      rawAgencyCompanies
    );

    const companies = allAgencyCompanies
      .filter((c) => c.active)
      .sort((a, b) => (a.order - b.order) || a.name.localeCompare(b.name));

    const companyIdByNormalizedName = new Map<string, string>();
    for (const comp of allAgencyCompanies) {
      companyIdByNormalizedName.set(normalizeCompanyKey(canonicalCompanyName(comp.name)), comp.id);
    }

    // 2. Fetch all agents strictly belonging to this agency
    const agents = await prisma.user.findMany({
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
    });

    // 3. Fetch emissions strictly for this agency
    let companyFilterCondition: any = {};
    if (options.companyId && options.companyId !== "ALL") {
      const selectedCompObj = allAgencyCompanies.find((c) => c.id === options.companyId);
      if (selectedCompObj) {
        companyFilterCondition = {
          OR: [
            { companyId: selectedCompObj.id },
            { companyName: { equals: selectedCompObj.name, mode: "insensitive" } },
          ],
        };
      } else {
        companyFilterCondition = { companyId: options.companyId };
      }
    }

    const emissionsWhere: any = {
      year,
      month,
      agencyId: effectiveAgencyId,
      ...(options.agentId && options.agentId !== "ALL" ? { agentId: options.agentId } : {}),
      ...companyFilterCondition,
    };

    const emissions = await prisma.agentEmission.findMany({
      where: emissionsWhere,
      orderBy: { issueDate: "desc" },
      include: {
        agent: { select: { id: true, name: true, email: true, image: true } },
        company: { select: { id: true, name: true, logoUrl: true, color: true } },
      },
    });

    // 4. Fetch budgets strictly for this agency
    const budgets = await prisma.agentMonthlyBudget.findMany({
      where: {
        year,
        month,
        agencyId: effectiveAgencyId,
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

    // Helper para resolver el companyId efectivo dentro de esta agencia (incluyendo fallback por nombre)
    const resolveEmissionCompanyKey = (em: { companyId: string | null; companyName: string }) => {
      if (em.companyId && allAgencyCompanies.some((c) => c.id === em.companyId)) {
        return em.companyId;
      }
      const matchedId = companyIdByNormalizedName.get(
        normalizeCompanyKey(canonicalCompanyName(em.companyName))
      );
      return matchedId || em.companyId || em.companyName;
    };

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

    // Pre-populate with active companies of this agency
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
      const cId = resolveEmissionCompanyKey(em);
      let comp = companyStatsMap.get(cId);
      if (!comp) {
        const knownAgencyComp = allAgencyCompanies.find((c) => c.id === cId);
        comp = {
          companyId: cId,
          name: knownAgencyComp?.name || em.companyName,
          logoUrl: knownAgencyComp?.logoUrl || em.company?.logoUrl || null,
          color: knownAgencyComp?.color || em.company?.color || "#0284c7",
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

    // Matrix Table Data: Agent Rows x Active Agency Companies
    const displayCompanies = [...companies];

    const agentMatrix = activeAgentsInScope.map((agent) => {
      const agentEmissions = emissions.filter((e) => e.agentId === agent.id);
      const companyEmissionsMap = new Map<string, { policies: number; pe: number; ppc: number }>();

      agentEmissions.forEach((em) => {
        const cId = resolveEmissionCompanyKey(em);
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

    agentMatrix.sort((a, b) => {
      if (b.totalPE !== a.totalPE) return b.totalPE - a.totalPE;
      if (b.totalPolicies !== a.totalPolicies) return b.totalPolicies - a.totalPolicies;
      return a.agentName.localeCompare(b.agentName);
    });

    return {
      success: true,
      currentUserRole: user.role,
      userAgencyId: user.agencyId,
      selectedAgencyId: effectiveAgencyId,
      agencies,
      companies: displayCompanies,
      catalogCompanies: allAgencyCompanies,
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
      catalogCompanies: [],
      agents: [],
      emissions: [],
      agentMatrix: [],
    };
  }
}
