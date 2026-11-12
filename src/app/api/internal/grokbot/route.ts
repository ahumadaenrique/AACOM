import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { SALES_ACTIVITIES } from "@/lib/constants";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const LOCKED_AGENCY_SLUG = "aacom";

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
        "Esta API de aacomsoft es estrictamente de SOLO LECTURA (GET). Ninguna operación de escritura, modificación o borrado está permitida.",
    },
    {
      status: 405,
      headers: {
        ...NO_STORE_HEADERS,
        Allow: "GET",
      },
    }
  );
}

function verifyReadOnlyApiKey(req: NextRequest): { ok: true } | { ok: false; status: number; error: string } {
  const configuredSecret = process.env.GROKBOT_READONLY_API_KEY?.trim();
  if (!configuredSecret || configuredSecret.length < 32) {
    return {
      ok: false,
      status: 503,
      error: "GROKBOT_READONLY_API_KEY no está configurada en el servidor.",
    };
  }

  const authHeader = req.headers.get("authorization")?.trim() || "";
  const customKeyHeader = req.headers.get("x-api-key")?.trim() || "";

  let providedToken = "";
  if (authHeader.toLowerCase().startsWith("bearer ")) {
    providedToken = authHeader.slice(7).trim();
  } else if (customKeyHeader) {
    providedToken = customKeyHeader;
  }

  if (!providedToken) {
    return {
      ok: false,
      status: 401,
      error: "No autorizado. Envía el header Authorization: Bearer <GROKBOT_READONLY_API_KEY>.",
    };
  }

  const expectedDigest = crypto.createHash("sha256").update(configuredSecret, "utf8").digest();
  const providedDigest = crypto.createHash("sha256").update(providedToken, "utf8").digest();

  if (!crypto.timingSafeEqual(expectedDigest, providedDigest)) {
    return {
      ok: false,
      status: 401,
      error: "Credencial inválida.",
    };
  }

  return { ok: true };
}

function getCdmxNowParts() {
  const now = new Date();
  const todayDateStr = now.toLocaleDateString("en-CA", {
    timeZone: "America/Mexico_City",
  });
  const [yearStr, monthStr, dayStr] = todayDateStr.split("-");
  return {
    now,
    todayDateStr,
    year: Number(yearStr),
    month: Number(monthStr), // 1..12
    day: Number(dayStr),
    monthStartDateStr: `${yearStr}-${monthStr}-01`,
  };
}

function clampInt(raw: string | null, fallback: number, min: number, max: number): number {
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function parseCdmxRangeUtc(startDateStr: string, endDateStr: string) {
  return {
    startUtc: new Date(`${startDateStr}T00:00:00.000-06:00`),
    endUtc: new Date(`${endDateStr}T23:59:59.999-06:00`),
  };
}

type AgencyUserSummary = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: string;
  active: boolean;
  phoneVerified: boolean;
  isSelfPaid: boolean;
  promotoriaJoinDate: Date | null;
  cedulaValidUntil: Date | null;
  rcPolicyValidUntil: Date | null;
  linkedAgentId: string | null;
  referidorCommissionPct: number | null;
  referidorBonusPct: number | null;
  createdAt: Date;
  linkedAgent: { id: string; name: string | null; email: string } | null;
};

function resolveAgentFilterIds(
  agencyUsers: AgencyUserSummary[],
  searchParams: URLSearchParams
): string[] | null {
  const agentIdParam = searchParams.get("agentId")?.trim();
  const agentEmailParam = searchParams.get("agentEmail")?.trim().toLowerCase();

  if (!agentIdParam && !agentEmailParam) {
    return null; // All users in the locked agency
  }

  const matched = agencyUsers.filter((u) => {
    if (agentIdParam && u.id === agentIdParam) return true;
    if (agentEmailParam && u.email.toLowerCase() === agentEmailParam) return true;
    return false;
  });

  return matched.map((u) => u.id);
}

export async function GET(req: NextRequest) {
  const authCheck = verifyReadOnlyApiKey(req);
  if (!authCheck.ok) {
    return jsonResponse({ ok: false, error: authCheck.error }, authCheck.status);
  }

  const { searchParams } = req.nextUrl;

  // Hard guard: reject any attempt to target another agency
  const attemptedAgency =
    searchParams.get("agencyId")?.trim() || searchParams.get("agencySlug")?.trim();
  if (attemptedAgency && attemptedAgency.toLowerCase() !== LOCKED_AGENCY_SLUG) {
    return jsonResponse(
      {
        ok: false,
        error: "Acceso bloqueado: esta llave está anclada exclusivamente a tu promotoría principal.",
      },
      403
    );
  }

  try {
    const agency = await prisma.agency.findFirst({
      where: {
        OR: [{ slug: LOCKED_AGENCY_SLUG }, { id: LOCKED_AGENCY_SLUG }],
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    if (!agency) {
      return jsonResponse(
        { ok: false, error: "Promotoría principal no encontrada en base de datos." },
        404
      );
    }

    const lockedAgencyId = agency.id;

    const agencyUsers = await prisma.user.findMany({
      where: { agencyId: lockedAgencyId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        active: true,
        phoneVerified: true,
        isSelfPaid: true,
        promotoriaJoinDate: true,
        cedulaValidUntil: true,
        rcPolicyValidUntil: true,
        linkedAgentId: true,
        referidorCommissionPct: true,
        referidorBonusPct: true,
        createdAt: true,
        linkedAgent: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [{ active: "desc" }, { name: "asc" }],
    });

    const userMap = new Map(agencyUsers.map((u) => [u.id, u]));
    const allAgencyUserIds = agencyUsers.map((u) => u.id);
    const cdmx = getCdmxNowParts();
    const resource = (searchParams.get("resource") || "overview").trim().toLowerCase();

    // ------------------------------------------------------------------
    // 1. DIRECTORY OF AGENTS & REFERIDORES (?resource=agents)
    // ------------------------------------------------------------------
    if (resource === "agents") {
      const activeParam = (searchParams.get("active") || "all").toLowerCase();
      const roleParam = searchParams.get("role")?.trim().toUpperCase();

      const filtered = agencyUsers.filter((u) => {
        if (activeParam === "true" && !u.active) return false;
        if (activeParam === "false" && u.active) return false;
        if (roleParam && u.role !== roleParam) return false;
        return true;
      });

      return jsonResponse({
        ok: true,
        mode: "READ_ONLY",
        resource: "agents",
        agency: { id: agency.id, name: agency.name, slug: agency.slug },
        total: filtered.length,
        agents: filtered,
      });
    }

    // ------------------------------------------------------------------
    // 2. ACTIVITY 25/15 POINTS + DAILY MORNING PLAN (?resource=activity)
    // ------------------------------------------------------------------
    if (resource === "activity") {
      const startDate = searchParams.get("startDate")?.trim() || cdmx.monthStartDateStr;
      const endDate = searchParams.get("endDate")?.trim() || cdmx.todayDateStr;
      const includeLogs = searchParams.get("includeLogs") !== "false";
      const limit = clampInt(searchParams.get("limit"), 500, 1, 2000);
      const filteredAgentIds = resolveAgentFilterIds(agencyUsers, searchParams);
      const targetUserIds = filteredAgentIds ?? allAgencyUserIds;

      if (targetUserIds.length === 0) {
        return jsonResponse({
          ok: true,
          mode: "READ_ONLY",
          resource: "activity",
          filters: { startDate, endDate },
          agentSummaries: [],
          dailyPlans: [],
          activityLogs: [],
        });
      }

      const [rawLogs, rawDailyPlans] = await Promise.all([
        prisma.activityLog.findMany({
          where: {
            agencyId: lockedAgencyId,
            userId: { in: targetUserIds },
            dateStr: { gte: startDate, lte: endDate },
          },
          orderBy: [{ dateStr: "desc" }, { createdAt: "desc" }],
          take: limit,
        }),
        prisma.dailyRecord.findMany({
          where: {
            userId: { in: targetUserIds },
            planned: { gt: 0 },
            date: {
              gte: new Date(`${startDate}T00:00:00.000Z`),
              lte: new Date(`${endDate}T23:59:59.999Z`),
            },
          },
          select: {
            userId: true,
            activityId: true,
            date: true,
            planned: true,
          },
          orderBy: [{ date: "desc" }, { activityId: "asc" }],
        }),
      ]);

      // Fetch full aggregation across all logs in the date range even if `limit` capped detailed rows
      const allRangeLogsForRollup =
        rawLogs.length === limit
          ? await prisma.activityLog.findMany({
              where: {
                agencyId: lockedAgencyId,
                userId: { in: targetUserIds },
                dateStr: { gte: startDate, lte: endDate },
              },
              select: {
                userId: true,
                dateStr: true,
                points: true,
              },
            })
          : rawLogs;

      const planGroupMap = new Map<
        string,
        {
          userId: string;
          agentName: string;
          agentEmail: string;
          agentRole: string;
          dateStr: string;
          plannedPoints: number;
          items: Array<{
            activityId: string;
            activityName: string;
            plannedCount: number;
            unitPoints: number;
            subtotalPoints: number;
          }>;
        }
      >();

      for (const rec of rawDailyPlans) {
        const dateStr = rec.date.toISOString().split("T")[0];
        const act = SALES_ACTIVITIES.find((a) => a.id === rec.activityId);
        if (!act || rec.planned <= 0) continue;

        const key = `${rec.userId}_${dateStr}`;
        const uObj = userMap.get(rec.userId);
        if (!planGroupMap.has(key)) {
          planGroupMap.set(key, {
            userId: rec.userId,
            agentName: uObj?.name || uObj?.email || "Agente",
            agentEmail: uObj?.email || "",
            agentRole: uObj?.role || "AGENTE",
            dateStr,
            plannedPoints: 0,
            items: [],
          });
        }
        const grp = planGroupMap.get(key)!;
        const subtotal = rec.planned * act.value;
        grp.plannedPoints += subtotal;
        grp.items.push({
          activityId: rec.activityId,
          activityName: act.name,
          plannedCount: rec.planned,
          unitPoints: act.value,
          subtotalPoints: subtotal,
        });
      }

      const dailyPlans = Array.from(planGroupMap.values()).sort(
        (a, b) => b.dateStr.localeCompare(a.dateStr) || b.plannedPoints - a.plannedPoints
      );

      // Per-agent summary
      const targetUsers = agencyUsers.filter(
        (u) => targetUserIds.includes(u.id) && (u.active || filteredAgentIds !== null)
      );

      const agentSummaries = targetUsers
        .filter((u) => ["AGENTE", "AGENTE_LITE", "REFERIDOR", "ADMIN"].includes(u.role))
        .map((u) => {
          const userPlans = dailyPlans.filter((p) => p.userId === u.id);
          const userLogs = allRangeLogsForRollup.filter((l) => l.userId === u.id);

          const totalPlannedPoints = userPlans.reduce((s, p) => s + p.plannedPoints, 0);
          const totalRealPoints = userLogs.reduce((s, l) => s + l.points, 0);
          const activeDates = new Set(userLogs.map((l) => l.dateStr));
          const allDates = new Set<string>([
            ...userPlans.map((p) => p.dateStr),
            ...Array.from(activeDates),
          ]);

          const dailyBreakdown = Array.from(allDates)
            .sort((a, b) => b.localeCompare(a))
            .map((d) => {
              const plan = planGroupMap.get(`${u.id}_${d}`);
              const realPts = userLogs
                .filter((l) => l.dateStr === d)
                .reduce((s, l) => s + l.points, 0);
              return {
                dateStr: d,
                plannedPoints: plan?.plannedPoints || 0,
                realPoints: realPts,
                plannedItems: plan?.items || [],
              };
            });

          return {
            userId: u.id,
            name: u.name || u.email,
            email: u.email,
            role: u.role,
            active: u.active,
            dailyGoalPoints: u.role === "REFERIDOR" ? 15 : 25,
            daysPlanned: userPlans.length,
            totalPlannedPoints,
            daysWithActivity: activeDates.size,
            totalRealPoints,
            planFulfillmentPct:
              totalPlannedPoints > 0
                ? Number(((totalRealPoints / totalPlannedPoints) * 100).toFixed(1))
                : null,
            dailyBreakdown,
          };
        })
        .sort((a, b) => b.totalRealPoints - a.totalRealPoints || b.totalPlannedPoints - a.totalPlannedPoints);

      return jsonResponse({
        ok: true,
        mode: "READ_ONLY",
        resource: "activity",
        agency: { id: agency.id, name: agency.name, slug: agency.slug },
        filters: { startDate, endDate, limit },
        catalogActivities: SALES_ACTIVITIES,
        totals: {
          totalPlannedPoints: dailyPlans.reduce((s, p) => s + p.plannedPoints, 0),
          totalRealPoints: allRangeLogsForRollup.reduce((s, l) => s + l.points, 0),
          totalActivityEntries: allRangeLogsForRollup.length,
        },
        agentSummaries,
        dailyPlans,
        activityLogs: includeLogs
          ? rawLogs.map((l) => {
              const u = userMap.get(l.userId);
              return {
                id: l.id,
                userId: l.userId,
                agentName: u?.name || u?.email || "Agente",
                agentEmail: u?.email || "",
                agentRole: u?.role || "AGENTE",
                activityId: l.activityId,
                activityName: l.activityName,
                points: l.points,
                prospectName: l.prospectName,
                dateStr: l.dateStr,
                createdAt: l.createdAt,
              };
            })
          : undefined,
      });
    }

    // ------------------------------------------------------------------
    // 3. PRODUCTION, EMISSIONS, BUDGETS & RANKING (?resource=production)
    // ------------------------------------------------------------------
    if (resource === "production") {
      const year = clampInt(searchParams.get("year"), cdmx.year, 2020, 2100);
      const monthRaw = searchParams.get("month")?.trim().toLowerCase();
      const month =
        monthRaw === "all" ? null : clampInt(searchParams.get("month"), cdmx.month, 1, 12);
      const filteredAgentIds = resolveAgentFilterIds(agencyUsers, searchParams);
      const targetUserIds = filteredAgentIds ?? allAgencyUserIds;

      const [emissions, budgets, rankingSetting] = await Promise.all([
        prisma.agentEmission.findMany({
          where: {
            agencyId: lockedAgencyId,
            agentId: { in: targetUserIds },
            year,
            ...(month !== null ? { month } : {}),
          },
          orderBy: [{ issueDate: "desc" }, { createdAt: "desc" }],
        }),
        prisma.agentMonthlyBudget.findMany({
          where: {
            agencyId: lockedAgencyId,
            agentId: { in: targetUserIds },
            year,
            ...(month !== null ? { month } : {}),
          },
        }),
        prisma.setting.findUnique({
          where: { key: `ranking_metric_${lockedAgencyId}` },
        }),
      ]);

      const byAgentMap = new Map<
        string,
        {
          agentId: string;
          name: string;
          email: string;
          active: boolean;
          budgetPE: number;
          primaEmitida: number;
          primaPagada: number;
          emissionsCount: number;
          fulfillmentEmitidaPct: number | null;
        }
      >();

      for (const u of agencyUsers) {
        if (!targetUserIds.includes(u.id)) continue;
        if (!["AGENTE", "AGENTE_LITE", "ADMIN"].includes(u.role)) continue;
        if (!u.active && filteredAgentIds === null) continue;
        byAgentMap.set(u.id, {
          agentId: u.id,
          name: u.name || u.email,
          email: u.email,
          active: u.active,
          budgetPE: 0,
          primaEmitida: 0,
          primaPagada: 0,
          emissionsCount: 0,
          fulfillmentEmitidaPct: null,
        });
      }

      for (const b of budgets) {
        const u = userMap.get(b.agentId);
        if (!byAgentMap.has(b.agentId)) {
          byAgentMap.set(b.agentId, {
            agentId: b.agentId,
            name: u?.name || u?.email || "Agente",
            email: u?.email || "",
            active: u?.active ?? false,
            budgetPE: 0,
            primaEmitida: 0,
            primaPagada: 0,
            emissionsCount: 0,
            fulfillmentEmitidaPct: null,
          });
        }
        byAgentMap.get(b.agentId)!.budgetPE += Number(b.budgetPE) || 0;
      }

      const byCompanyMap = new Map<
        string,
        { companyName: string; primaEmitida: number; primaPagada: number; count: number }
      >();

      for (const em of emissions) {
        const u = userMap.get(em.agentId);
        if (!byAgentMap.has(em.agentId)) {
          byAgentMap.set(em.agentId, {
            agentId: em.agentId,
            name: u?.name || u?.email || "Agente",
            email: u?.email || "",
            active: u?.active ?? false,
            budgetPE: 0,
            primaEmitida: 0,
            primaPagada: 0,
            emissionsCount: 0,
            fulfillmentEmitidaPct: null,
          });
        }
        const entry = byAgentMap.get(em.agentId)!;
        entry.primaEmitida += Number(em.primaEmitida) || 0;
        entry.primaPagada += Number(em.primaPagada) || 0;
        entry.emissionsCount += 1;

        const compKey = em.companyName || "Sin Aseguradora";
        if (!byCompanyMap.has(compKey)) {
          byCompanyMap.set(compKey, {
            companyName: compKey,
            primaEmitida: 0,
            primaPagada: 0,
            count: 0,
          });
        }
        const comp = byCompanyMap.get(compKey)!;
        comp.primaEmitida += Number(em.primaEmitida) || 0;
        comp.primaPagada += Number(em.primaPagada) || 0;
        comp.count += 1;
      }

      const byAgent = Array.from(byAgentMap.values())
        .map((a) => ({
          ...a,
          fulfillmentEmitidaPct:
            a.budgetPE > 0 ? Number(((a.primaEmitida / a.budgetPE) * 100).toFixed(1)) : null,
        }))
        .sort((a, b) => b.primaPagada - a.primaPagada || b.primaEmitida - a.primaEmitida);

      const totalBudgetPE = byAgent.reduce((s, a) => s + a.budgetPE, 0);
      const totalPrimaEmitida = emissions.reduce((s, e) => s + (Number(e.primaEmitida) || 0), 0);
      const totalPrimaPagada = emissions.reduce((s, e) => s + (Number(e.primaPagada) || 0), 0);

      return jsonResponse({
        ok: true,
        mode: "READ_ONLY",
        resource: "production",
        agency: { id: agency.id, name: agency.name, slug: agency.slug },
        filters: { year, month: month ?? "all" },
        rankingConfiguredMetric: rankingSetting?.value || "ADN",
        totals: {
          totalBudgetPE,
          totalPrimaEmitida,
          totalPrimaPagada,
          emissionsCount: emissions.length,
          budgetFulfillmentEmitidaPct:
            totalBudgetPE > 0
              ? Number(((totalPrimaEmitida / totalBudgetPE) * 100).toFixed(1))
              : null,
          budgetFulfillmentPagadaPct:
            totalBudgetPE > 0
              ? Number(((totalPrimaPagada / totalBudgetPE) * 100).toFixed(1))
              : null,
        },
        byAgent,
        byCompany: Array.from(byCompanyMap.values()).sort(
          (a, b) => b.primaPagada - a.primaPagada || b.primaEmitida - a.primaEmitida
        ),
        emissions: emissions.map((em) => {
          const u = userMap.get(em.agentId);
          return {
            id: em.id,
            agentId: em.agentId,
            agentName: u?.name || u?.email || "Agente",
            agentEmail: u?.email || "",
            companyName: em.companyName,
            policyNumber: em.policyNumber,
            clientName: em.clientName,
            ramo: em.ramo,
            issueDate: em.issueDate,
            year: em.year,
            month: em.month,
            primaEmitida: em.primaEmitida,
            primaPagada: em.primaPagada,
            status: em.status,
            notes: em.notes,
          };
        }),
      });
    }

    // ------------------------------------------------------------------
    // 4. ADN FINANCIAL DIAGNOSTICS (?resource=adn)
    // ------------------------------------------------------------------
    if (resource === "adn") {
      const startDate = searchParams.get("startDate")?.trim() || cdmx.monthStartDateStr;
      const endDate = searchParams.get("endDate")?.trim() || cdmx.todayDateStr;
      const cerradaParam = searchParams.get("cerradaPagada")?.trim().toLowerCase();
      const limit = clampInt(searchParams.get("limit"), 200, 1, 1000);
      const offset = clampInt(searchParams.get("offset"), 0, 0, 100000);
      const filteredAgentIds = resolveAgentFilterIds(agencyUsers, searchParams);
      const targetUserIds = filteredAgentIds ?? allAgencyUserIds;
      const { startUtc, endUtc } = parseCdmxRangeUtc(startDate, endDate);

      const whereClause: any = {
        agencyId: lockedAgencyId,
        userId: { in: targetUserIds },
        createdAt: { gte: startUtc, lte: endUtc },
      };
      if (cerradaParam === "true") whereClause.cerradaPagada = true;
      if (cerradaParam === "false") whereClause.cerradaPagada = false;

      const [totalMatching, closedMatching, diagnostics] = await Promise.all([
        prisma.adnDiagnostic.count({ where: whereClause }),
        prisma.adnDiagnostic.count({ where: { ...whereClause, cerradaPagada: true } }),
        prisma.adnDiagnostic.findMany({
          where: whereClause,
          select: {
            id: true,
            userId: true,
            modalidad: true,
            clienteNombre: true,
            clienteEdad: true,
            conyugeNombre: true,
            conyugeEdad: true,
            situacionLaboral: true,
            hijosData: true,
            hasSeguroAhorro: true,
            ahorroAporte: true,
            ahorroFrecuencia: true,
            hasPpr: true,
            pprAporte: true,
            pprFrecuencia: true,
            pprAniosPlazo: true,
            hasGmm: true,
            hasSeguroVida: true,
            vidaSumaAsegurada: true,
            ingresosTotales: true,
            ingresosNetos: true,
            ahorroActual: true,
            gastosData: true,
            totalGastos: true,
            cerradaPagada: true,
            fumador: true,
            padecimientos: true,
            latitude: true,
            longitude: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          skip: offset,
          take: limit,
        }),
      ]);

      return jsonResponse({
        ok: true,
        mode: "READ_ONLY",
        resource: "adn",
        agency: { id: agency.id, name: agency.name, slug: agency.slug },
        filters: { startDate, endDate, limit, offset },
        summary: {
          totalMatching,
          closedCount: closedMatching,
          conversionPct:
            totalMatching > 0 ? Number(((closedMatching / totalMatching) * 100).toFixed(1)) : 0,
        },
        diagnostics: diagnostics.map((d) => {
          const u = userMap.get(d.userId);
          return {
            ...d,
            agentName: u?.name || u?.email || "Agente",
            agentEmail: u?.email || "",
          };
        }),
      });
    }

    // ------------------------------------------------------------------
    // 5. QUOTES / COTIZACIONES (?resource=quotes)
    // ------------------------------------------------------------------
    if (resource === "quotes") {
      const quoteId = searchParams.get("quoteId")?.trim();
      if (quoteId) {
        const quote = await prisma.cotizacion.findFirst({
          where: { id: quoteId, agencyId: lockedAgencyId },
        });
        if (!quote) {
          return jsonResponse({ ok: false, error: "Cotización no encontrada." }, 404);
        }
        return jsonResponse({
          ok: true,
          mode: "READ_ONLY",
          resource: "quotes",
          quote,
        });
      }

      const startDate = searchParams.get("startDate")?.trim() || cdmx.monthStartDateStr;
      const endDate = searchParams.get("endDate")?.trim() || cdmx.todayDateStr;
      const productoParam = searchParams.get("producto")?.trim();
      const limit = clampInt(searchParams.get("limit"), 200, 1, 1000);
      const offset = clampInt(searchParams.get("offset"), 0, 0, 100000);
      const filteredAgentIds = resolveAgentFilterIds(agencyUsers, searchParams);
      const { startUtc, endUtc } = parseCdmxRangeUtc(startDate, endDate);

      const whereClause: any = {
        agencyId: lockedAgencyId,
        createdAt: { gte: startUtc, lte: endUtc },
      };
      if (filteredAgentIds !== null) {
        whereClause.userId = { in: filteredAgentIds };
      }
      if (productoParam) {
        whereClause.producto = productoParam;
      }

      const [agg, quotes] = await Promise.all([
        prisma.cotizacion.aggregate({
          where: whereClause,
          _count: { _all: true },
          _sum: { primaAnual: true, ahorro: true },
        }),
        prisma.cotizacion.findMany({
          where: whereClause,
          select: {
            id: true,
            userId: true,
            cliente: true,
            telefono: true,
            agente: true,
            producto: true,
            primaAnual: true,
            totalPrima: true,
            ahorro: true,
            rendimiento: true,
            valorUdi: true,
            inflacionUdi: true,
            duracion: true,
            isr: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          skip: offset,
          take: limit,
        }),
      ]);

      return jsonResponse({
        ok: true,
        mode: "READ_ONLY",
        resource: "quotes",
        agency: { id: agency.id, name: agency.name, slug: agency.slug },
        filters: { startDate, endDate, producto: productoParam || "all", limit, offset },
        summary: {
          totalQuotes: agg._count._all,
          totalPrimaAnual: agg._sum.primaAnual || 0,
          totalAhorroProyectado: agg._sum.ahorro || 0,
        },
        quotes,
      });
    }

    // ------------------------------------------------------------------
    // 6. PORTFOLIO 360°: CLIENTS, POLICIES & RECEIPTS (?resource=portfolio)
    // ------------------------------------------------------------------
    if (resource === "portfolio") {
      const statusParam = (searchParams.get("status") || "VIGENTE").trim().toUpperCase();
      const ramoParam = searchParams.get("ramo")?.trim();
      const companyParam = searchParams.get("insuranceCompany")?.trim();
      const searchParam = searchParams.get("search")?.trim();
      const upcomingDays = clampInt(searchParams.get("upcomingDays"), 30, 1, 365);
      const limit = clampInt(searchParams.get("limit"), 200, 1, 1000);
      const offset = clampInt(searchParams.get("offset"), 0, 0, 100000);
      const filteredAgentIds = resolveAgentFilterIds(agencyUsers, searchParams);
      const targetUserIds = filteredAgentIds ?? allAgencyUserIds;

      const policyWhere: any = {
        userId: { in: targetUserIds },
        OR: [{ agencyId: lockedAgencyId }, { agencyId: null }],
        isArchived: false,
        deletedAt: null,
      };
      if (statusParam !== "ALL") {
        policyWhere.status = statusParam;
      }
      if (ramoParam) {
        policyWhere.ramo = ramoParam;
      }
      if (companyParam) {
        policyWhere.insuranceCompany = { contains: companyParam, mode: "insensitive" };
      }
      if (searchParam) {
        policyWhere.AND = [
          {
            OR: [
              { policyNumber: { contains: searchParam, mode: "insensitive" } },
              { contractor: { contains: searchParam, mode: "insensitive" } },
              { insured: { contains: searchParam, mode: "insensitive" } },
              { client: { name: { contains: searchParam, mode: "insensitive" } } },
            ],
          },
        ];
      }

      const horizonDate = new Date(cdmx.now.getTime() + upcomingDays * 24 * 60 * 60 * 1000);

      const [
        totalClients,
        policyAgg,
        policies,
        upcomingReceipts,
      ] = await Promise.all([
        prisma.client.count({
          where: {
            userId: { in: targetUserIds },
            OR: [{ agencyId: lockedAgencyId }, { agencyId: null }],
            isArchived: false,
            deletedAt: null,
          },
        }),
        prisma.policy.aggregate({
          where: policyWhere,
          _count: { _all: true },
          _sum: {
            annualPremium: true,
            approximateCommission: true,
            approximateBonus: true,
          },
        }),
        prisma.policy.findMany({
          where: policyWhere,
          select: {
            id: true,
            policyNumber: true,
            status: true,
            subStatus: true,
            insuranceCompany: true,
            product: true,
            ramo: true,
            tipoVigencia: true,
            currency: true,
            annualPremium: true,
            originalPremium: true,
            paymentMethod: true,
            effectiveDate: true,
            renewalDate: true,
            approximateCommission: true,
            approximateBonus: true,
            observations: true,
            userId: true,
            client: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                birthDate: true,
                rfc: true,
              },
            },
          },
          orderBy: [{ renewalDate: "asc" }, { createdAt: "desc" }],
          skip: offset,
          take: limit,
        }),
        prisma.policyReceipt.findMany({
          where: {
            userId: { in: targetUserIds },
            OR: [{ agencyId: lockedAgencyId }, { agencyId: null }],
            status: { in: ["PENDIENTE", "EN_GRACIA", "VENCIDO"] },
            dueDate: { lte: horizonDate },
            policy: {
              isArchived: false,
              deletedAt: null,
            },
          },
          select: {
            id: true,
            userId: true,
            receiptNumber: true,
            totalInstallments: true,
            policyYear: true,
            dueDate: true,
            graceEndDate: true,
            amount: true,
            status: true,
            paymentNotes: true,
            policy: {
              select: {
                id: true,
                policyNumber: true,
                insuranceCompany: true,
                product: true,
                ramo: true,
                currency: true,
                client: {
                  select: {
                    id: true,
                    name: true,
                    phone: true,
                    email: true,
                  },
                },
              },
            },
          },
          orderBy: { dueDate: "asc" },
          take: 300,
        }),
      ]);

      return jsonResponse({
        ok: true,
        mode: "READ_ONLY",
        resource: "portfolio",
        agency: { id: agency.id, name: agency.name, slug: agency.slug },
        filters: { status: statusParam, upcomingDays, limit, offset },
        summary: {
          totalActiveClients: totalClients,
          matchingPoliciesCount: policyAgg._count._all,
          totalAnnualPremium: policyAgg._sum.annualPremium || 0,
          totalApproximateCommission: policyAgg._sum.approximateCommission || 0,
          totalApproximateBonus: policyAgg._sum.approximateBonus || 0,
          upcomingOrPendingReceiptsCount: upcomingReceipts.length,
        },
        upcomingReceipts: upcomingReceipts.map((r) => {
          const u = userMap.get(r.userId);
          return {
            ...r,
            agentName: u?.name || u?.email || "Agente",
            agentEmail: u?.email || "",
          };
        }),
        policies: policies.map((p) => {
          const u = userMap.get(p.userId);
          return {
            ...p,
            agentName: u?.name || u?.email || "Agente",
            agentEmail: u?.email || "",
          };
        }),
      });
    }

    // ------------------------------------------------------------------
    // 7. PROSPECTION: PROYECTO 200 + SURVEYS & REFERRALS (?resource=prospection)
    // ------------------------------------------------------------------
    if (resource === "prospection") {
      const statusParam = searchParams.get("status")?.trim().toUpperCase();
      const classificationParam = searchParams.get("classification")?.trim().toUpperCase();
      const limit = clampInt(searchParams.get("limit"), 200, 1, 1000);
      const offset = clampInt(searchParams.get("offset"), 0, 0, 100000);
      const filteredAgentIds = resolveAgentFilterIds(agencyUsers, searchParams);
      const targetUserIds = filteredAgentIds ?? allAgencyUserIds;

      const p200Where: any = {
        userId: { in: targetUserIds },
        OR: [{ agencyId: lockedAgencyId }, { agencyId: null }],
      };
      if (statusParam) p200Where.status = statusParam;
      if (classificationParam) p200Where.classification = classificationParam;

      const [
        p200Total,
        p200Contacts,
        surveys,
        referrals,
      ] = await Promise.all([
        prisma.project200Contact.count({ where: p200Where }),
        prisma.project200Contact.findMany({
          where: p200Where,
          select: {
            id: true,
            userId: true,
            fullName: true,
            phone: true,
            relationship: true,
            estimatedSalary: true,
            closingProbability: true,
            classification: true,
            status: true,
            priorityScore: true,
            attemptsCount: true,
            lastAttemptAt: true,
            nextActionAt: true,
            scheduledMeetingAt: true,
            source: true,
            referredByName: true,
            notes: true,
            createdAt: true,
          },
          orderBy: [{ priorityScore: "desc" }, { createdAt: "desc" }],
          skip: offset,
          take: limit,
        }),
        prisma.satisfactionSurvey.findMany({
          where: {
            userId: { in: targetUserIds },
            OR: [{ agencyId: lockedAgencyId }, { agencyId: null }],
          },
          select: {
            id: true,
            userId: true,
            intervieweeName: true,
            q1Useful: true,
            q2Attractive: true,
            q3Professional: true,
            q4Clear: true,
            q5WouldRecommend: true,
            notes: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 200,
        }),
        prisma.surveyReferral.findMany({
          where: {
            userId: { in: targetUserIds },
            OR: [{ agencyId: lockedAgencyId }, { agencyId: null }],
          },
          select: {
            id: true,
            surveyId: true,
            userId: true,
            fullName: true,
            phone: true,
            status: true,
            notes: true,
            createdAt: true,
            survey: {
              select: {
                intervieweeName: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: limit,
        }),
      ]);

      const wouldRecommendCount = surveys.filter((s) => s.q5WouldRecommend).length;

      return jsonResponse({
        ok: true,
        mode: "READ_ONLY",
        resource: "prospection",
        agency: { id: agency.id, name: agency.name, slug: agency.slug },
        filters: {
          status: statusParam || "all",
          classification: classificationParam || "all",
          limit,
          offset,
        },
        project200: {
          totalMatching: p200Total,
          contacts: p200Contacts.map((c) => {
            const u = userMap.get(c.userId);
            return {
              ...c,
              agentName: u?.name || u?.email || "Agente",
              agentEmail: u?.email || "",
            };
          }),
        },
        satisfactionSurveys: {
          totalCount: surveys.length,
          wouldRecommendPct:
            surveys.length > 0
              ? Number(((wouldRecommendCount / surveys.length) * 100).toFixed(1))
              : null,
          surveys: surveys.map((s) => {
            const u = userMap.get(s.userId);
            return {
              ...s,
              agentName: u?.name || u?.email || "Agente",
              agentEmail: u?.email || "",
            };
          }),
        },
        surveyReferrals: {
          totalCount: referrals.length,
          referrals: referrals.map((r) => {
            const u = userMap.get(r.userId);
            return {
              id: r.id,
              surveyId: r.surveyId,
              intervieweeName: r.survey?.intervieweeName || null,
              fullName: r.fullName,
              phone: r.phone,
              status: r.status,
              notes: r.notes,
              createdAt: r.createdAt,
              agentId: r.userId,
              agentName: u?.name || u?.email || "Agente",
              agentEmail: u?.email || "",
            };
          }),
        },
      });
    }

    // ------------------------------------------------------------------
    // 8. EXECUTIVE OVERVIEW + SELF-DESCRIBING SCHEMA (?resource=overview)
    // ------------------------------------------------------------------
    if (resource !== "overview") {
      return jsonResponse(
        {
          ok: false,
          error: `Recurso desconocido "${resource}". Valores permitidos: overview, agents, activity, production, adn, quotes, portfolio, prospection.`,
        },
        400
      );
    }

    const { startUtc: monthStartUtc, endUtc: todayEndUtc } = parseCdmxRangeUtc(
      cdmx.monthStartDateStr,
      cdmx.todayDateStr
    );
    const horizon30Days = new Date(cdmx.now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [
      todayPlansRaw,
      todayLogsRaw,
      mtdLogsAgg,
      mtdAdnTotal,
      mtdAdnClosed,
      mtdQuotesAgg,
      mtdEmissionsAgg,
      mtdBudgetAgg,
      activeClientsCount,
      activePoliciesAgg,
      upcomingReceipts30dCount,
      p200TotalCount,
      p200PorContactarCount,
      referralsTotalCount,
      referralsPendingCount,
    ] = await Promise.all([
      allAgencyUserIds.length > 0
        ? prisma.dailyRecord.findMany({
            where: {
              userId: { in: allAgencyUserIds },
              planned: { gt: 0 },
              date: new Date(`${cdmx.todayDateStr}T00:00:00.000Z`),
            },
            select: { userId: true, activityId: true, planned: true },
          })
        : Promise.resolve([]),
      prisma.activityLog.findMany({
        where: {
          agencyId: lockedAgencyId,
          dateStr: cdmx.todayDateStr,
        },
        select: { userId: true, points: true },
      }),
      prisma.activityLog.aggregate({
        where: {
          agencyId: lockedAgencyId,
          dateStr: { gte: cdmx.monthStartDateStr, lte: cdmx.todayDateStr },
        },
        _count: { _all: true },
        _sum: { points: true },
      }),
      prisma.adnDiagnostic.count({
        where: {
          agencyId: lockedAgencyId,
          createdAt: { gte: monthStartUtc, lte: todayEndUtc },
        },
      }),
      prisma.adnDiagnostic.count({
        where: {
          agencyId: lockedAgencyId,
          cerradaPagada: true,
          createdAt: { gte: monthStartUtc, lte: todayEndUtc },
        },
      }),
      prisma.cotizacion.aggregate({
        where: {
          agencyId: lockedAgencyId,
          createdAt: { gte: monthStartUtc, lte: todayEndUtc },
        },
        _count: { _all: true },
        _sum: { primaAnual: true },
      }),
      prisma.agentEmission.aggregate({
        where: {
          agencyId: lockedAgencyId,
          year: cdmx.year,
          month: cdmx.month,
        },
        _count: { _all: true },
        _sum: { primaEmitida: true, primaPagada: true },
      }),
      prisma.agentMonthlyBudget.aggregate({
        where: {
          agencyId: lockedAgencyId,
          year: cdmx.year,
          month: cdmx.month,
        },
        _sum: { budgetPE: true },
      }),
      prisma.client.count({
        where: {
          userId: { in: allAgencyUserIds },
          OR: [{ agencyId: lockedAgencyId }, { agencyId: null }],
          isArchived: false,
          deletedAt: null,
        },
      }),
      prisma.policy.aggregate({
        where: {
          userId: { in: allAgencyUserIds },
          OR: [{ agencyId: lockedAgencyId }, { agencyId: null }],
          status: "VIGENTE",
          isArchived: false,
          deletedAt: null,
        },
        _count: { _all: true },
        _sum: { annualPremium: true },
      }),
      prisma.policyReceipt.count({
        where: {
          userId: { in: allAgencyUserIds },
          OR: [{ agencyId: lockedAgencyId }, { agencyId: null }],
          status: { in: ["PENDIENTE", "EN_GRACIA", "VENCIDO"] },
          dueDate: { lte: horizon30Days },
          policy: { isArchived: false, deletedAt: null },
        },
      }),
      prisma.project200Contact.count({
        where: {
          userId: { in: allAgencyUserIds },
          OR: [{ agencyId: lockedAgencyId }, { agencyId: null }],
        },
      }),
      prisma.project200Contact.count({
        where: {
          userId: { in: allAgencyUserIds },
          OR: [{ agencyId: lockedAgencyId }, { agencyId: null }],
          status: "POR_CONTACTAR",
        },
      }),
      prisma.surveyReferral.count({
        where: {
          userId: { in: allAgencyUserIds },
          OR: [{ agencyId: lockedAgencyId }, { agencyId: null }],
        },
      }),
      prisma.surveyReferral.count({
        where: {
          userId: { in: allAgencyUserIds },
          OR: [{ agencyId: lockedAgencyId }, { agencyId: null }],
          status: "NO_CONTACTADO",
        },
      }),
    ]);

    let todayPlannedPoints = 0;
    const todayPlannedUsers = new Set<string>();
    for (const rec of todayPlansRaw) {
      const act = SALES_ACTIVITIES.find((a) => a.id === rec.activityId);
      if (!act) continue;
      todayPlannedUsers.add(rec.userId);
      todayPlannedPoints += rec.planned * act.value;
    }
    const todayRealPoints = todayLogsRaw.reduce((s, l) => s + l.points, 0);
    const todayActiveUsers = new Set(todayLogsRaw.map((l) => l.userId));

    const activeUsers = agencyUsers.filter((u) => u.active);

    return jsonResponse({
      ok: true,
      mode: "READ_ONLY",
      resource: "overview",
      agency: {
        id: agency.id,
        name: agency.name,
        slug: agency.slug,
        timezone: "America/Mexico_City",
        todayDateStr: cdmx.todayDateStr,
        currentYear: cdmx.year,
        currentMonth: cdmx.month,
      },
      teamSummary: {
        totalUsers: agencyUsers.length,
        activeUsers: activeUsers.length,
        activeAgentes: activeUsers.filter((u) => u.role === "AGENTE").length,
        activeAgentesLite: activeUsers.filter((u) => u.role === "AGENTE_LITE").length,
        activeReferidores: activeUsers.filter((u) => u.role === "REFERIDOR").length,
        activeAdmins: activeUsers.filter(
          (u) => u.role === "ADMIN" || u.role === "SUPER_ADMIN"
        ).length,
      },
      todayActivity: {
        dateStr: cdmx.todayDateStr,
        agentsWhoPlannedCount: todayPlannedUsers.size,
        totalPlannedPoints: todayPlannedPoints,
        agentsWithRealActivityCount: todayActiveUsers.size,
        totalRealPoints: todayRealPoints,
      },
      monthToDate: {
        period: `${cdmx.monthStartDateStr} a ${cdmx.todayDateStr}`,
        activityPointsTotal: mtdLogsAgg._sum.points || 0,
        activityEntriesCount: mtdLogsAgg._count._all,
        adnDiagnosticsTotal: mtdAdnTotal,
        adnDiagnosticsClosed: mtdAdnClosed,
        quotesCount: mtdQuotesAgg._count._all,
        quotesPrimaAnualTotal: mtdQuotesAgg._sum.primaAnual || 0,
        productionBudgetPE: mtdBudgetAgg._sum.budgetPE || 0,
        productionPrimaEmitida: mtdEmissionsAgg._sum.primaEmitida || 0,
        productionPrimaPagada: mtdEmissionsAgg._sum.primaPagada || 0,
        productionEmissionsCount: mtdEmissionsAgg._count._all,
      },
      portfolioSummary: {
        activeClients: activeClientsCount,
        vigentePolicies: activePoliciesAgg._count._all,
        vigenteAnnualPremiumTotal: activePoliciesAgg._sum.annualPremium || 0,
        pendingOrUpcomingReceiptsNext30Days: upcomingReceipts30dCount,
      },
      prospectionSummary: {
        project200TotalContacts: p200TotalCount,
        project200PorContactar: p200PorContactarCount,
        surveyReferralsTotal: referralsTotalCount,
        surveyReferralsNoContactado: referralsPendingCount,
      },
      availableResources: {
        overview: "GET /api/internal/grokbot?resource=overview",
        agents:
          "GET /api/internal/grokbot?resource=agents&active=true|false|all&role=AGENTE|REFERIDOR|ADMIN",
        activity:
          "GET /api/internal/grokbot?resource=activity&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&agentEmail=...&agentId=...&includeLogs=true|false&limit=500",
        production:
          "GET /api/internal/grokbot?resource=production&year=2026&month=1..12|all&agentEmail=...&agentId=...",
        adn: "GET /api/internal/grokbot?resource=adn&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&cerradaPagada=true|false&agentEmail=...&limit=200&offset=0",
        quotes:
          "GET /api/internal/grokbot?resource=quotes&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&producto=...&quoteId=...&limit=200&offset=0",
        portfolio:
          "GET /api/internal/grokbot?resource=portfolio&status=VIGENTE|ALL&upcomingDays=30&insuranceCompany=...&ramo=...&search=...&agentEmail=...&limit=200&offset=0",
        prospection:
          "GET /api/internal/grokbot?resource=prospection&status=...&classification=...&agentEmail=...&limit=200&offset=0",
      },
    });
  } catch (error: any) {
    console.error("[GROKBOT_READONLY_API_ERROR]", error);
    return jsonResponse(
      {
        ok: false,
        error: "Error interno al consultar datos de solo lectura.",
        detail: error?.message || "Unknown error",
      },
      500
    );
  }
}

export async function POST() {
  return methodNotAllowedResponse();
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
