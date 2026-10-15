import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Users, Upload } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import QuickPdfAiPolicyDialog from "./QuickPdfAiPolicyDialog";
import CarteraWorkspaceTabs from "./CarteraWorkspaceTabs";
import PremiumGuard from "@/components/PremiumGuard";
import {
  computePolicyCycleInfo,
  computeReceiptLiveStatus,
} from "./dateUtils";
import { ensurePoliciesHaveReceipts } from "./actions";

export const dynamic = "force-dynamic";

export default async function CarteraDashboard() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, agencyId: true },
  });
  const currentAgencyId = (session.user.agencyId || dbUser?.agencyId || "aacom") as string;
  const isAdmin = dbUser?.role === "ADMIN" || dbUser?.role === "SUPER_ADMIN";

  const policiesWhereClause: any = isAdmin
    ? { agencyId: currentAgencyId, isArchived: false }
    : { userId: session.user.id, isArchived: false };

  const clientsWhereClause: any = isAdmin
    ? { agencyId: currentAgencyId, isArchived: false }
    : { userId: session.user.id, isArchived: false };

  let policies = await prisma.policy.findMany({
    where: policiesWhereClause,
    include: {
      client: true,
      user: { select: { name: true } },
      receipts: {
        orderBy: [{ policyYear: "asc" }, { receiptNumber: "asc" }],
      },
    },
    orderBy: { effectiveDate: "desc" },
  });

  // Inicializar recibos automáticamente para las pólizas activas que aún no tengan recibos
  const generatedAny = await ensurePoliciesHaveReceipts(policies);
  if (generatedAny) {
    policies = await prisma.policy.findMany({
      where: policiesWhereClause,
      include: {
        client: true,
        user: { select: { name: true } },
        receipts: {
          orderBy: [{ policyYear: "asc" }, { receiptNumber: "asc" }],
        },
      },
      orderBy: { effectiveDate: "desc" },
    });
  }

  const [clientsWithPolicies, adnDiagnostics] = await Promise.all([
    prisma.client.findMany({
      where: clientsWhereClause,
      include: {
        policies: { where: { isArchived: false } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.adnDiagnostic.findMany({
      where: isAdmin
        ? { agencyId: currentAgencyId }
        : { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  const clientsCount = clientsWithPolicies.length;

  // Enriquecer cada póliza con su ciclo real (Aniversario vs Renovación) y estatus
  const enrichedPolicies = policies.map((p) => {
    const cycle = computePolicyCycleInfo(p);
    const hasReceiptInGrace = (p.receipts || []).some((r) => {
      const live = computeReceiptLiveStatus(r);
      return live.liveStatus === "EN_GRACIA" || live.liveStatus === "POR_CONFIRMAR";
    });
    return {
      ...p,
      cycle,
      hasReceiptInGrace,
    };
  });

  const activePolicies = enrichedPolicies.filter(
    (p) => p.cycle.computedStatus !== "CANCELADA" && p.cycle.computedStatus !== "TERMINADA"
  );

  const atRiskPolicies = activePolicies.filter(
    (p) =>
      p.cycle.computedStatus === "EN_RIESGO" ||
      p.cycle.computedStatus === "POR_CONFIRMAR" ||
      p.hasReceiptInGrace
  );

  const totalActivePremium = activePolicies.reduce(
    (acc, curr) => acc + (curr.annualPremium || 0),
    0
  );

  const atRiskPremium = atRiskPolicies.reduce(
    (acc, curr) => acc + (curr.annualPremium || 0),
    0
  );

  const avgPoliciesPerClient =
    clientsCount > 0 ? (activePolicies.length / clientsCount).toFixed(1) : "0.0";

  const userRole = dbUser?.role ?? null;

  return (
    <PremiumGuard userRole={userRole} moduleName="Gestion de Cartera y Renovaciones">
      <div className="flex flex-col gap-6 p-4 md:p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Mi Cartera</h1>
            <p className="text-muted-foreground">
              Tus pólizas, cobros programados, aniversarios y oportunidades de venta en un solo lugar.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <QuickPdfAiPolicyDialog
              existingClients={clientsWithPolicies.map((c) => ({
                id: c.id,
                name: c.name,
                phone: c.phone,
              }))}
            />
            <Link href="/cartera/clientes">
              <Button variant="outline">
                <Users className="mr-2 h-4 w-4" />
                Directorio de Clientes ({clientsCount})
              </Button>
            </Link>
            <Link href="/cartera/importar">
              <Button variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Importar Excel
              </Button>
            </Link>
          </div>
        </div>

        <CarteraWorkspaceTabs
          policies={policies}
          activePolicies={activePolicies}
          atRiskPolicies={atRiskPolicies}
          totalActivePremium={totalActivePremium}
          atRiskPremium={atRiskPremium}
          clientsCount={clientsCount}
          avgPoliciesPerClient={avgPoliciesPerClient}
          clientsWithPolicies={clientsWithPolicies}
          adnDiagnostics={adnDiagnostics}
          isAdmin={isAdmin}
        />
      </div>
    </PremiumGuard>
  );
}
