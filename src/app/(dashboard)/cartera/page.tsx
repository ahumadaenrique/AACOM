import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { format, addDays, isBefore, isAfter } from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, Wallet, Clock, FileText, Upload, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import CarteraTableClient from "./CarteraTableClient";

export const dynamic = "force-dynamic";

export default async function CarteraDashboard({
  searchParams,
}: {
  searchParams: { days?: string };
}) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const daysFilter = parseInt(searchParams.days || "30");
  const today = new Date();
  const futureDate = addDays(today, daysFilter);

  const dbUser = await prisma.user.findUnique({where: {id: session.user.id}, select: {role: true, agencyId: true}});

  let policiesWhereClause: any = { userId: session.user.id };
  let clientsWhereClause: any = { userId: session.user.id };

  if ((dbUser?.role === 'ADMIN' || dbUser?.role === 'SUPER_ADMIN') && dbUser?.agencyId) {
     policiesWhereClause = { agencyId: dbUser.agencyId };
     clientsWhereClause = { agencyId: dbUser.agencyId };
  }

  // --- MIGRACIÓN MASIVA DE RESCATE (Pólizas, Clientes y Registros huérfanos) ---
  await prisma.client.updateMany({ where: { agencyId: null }, data: { agencyId: 'aacom' } });
  await prisma.policy.updateMany({ where: { agencyId: null }, data: { agencyId: 'aacom' } });
  await prisma.dailyRecord.updateMany({ where: { agencyId: null }, data: { agencyId: 'aacom' } });
  // ----------------------------------------------------------------------------

  // Obtener todas las pólizas del agente o de la agencia (si es admin)
  const policies = await prisma.policy.findMany({
    where: policiesWhereClause,
    include: { client: true, user: { select: { name: true } } },
    orderBy: { renewalDate: "asc" },
  });

  const clientsCount = await prisma.client.count({
    where: clientsWhereClause,
  });

  const totalPremium = policies.reduce((acc, curr) => acc + (curr.annualPremium || 0), 0);

  // Filtrar las que están por vencer en los próximos X días
  const upcomingRenewals = policies.filter(
    (p) =>
      p.renewalDate &&
      isAfter(new Date(p.renewalDate), today) &&
      isBefore(new Date(p.renewalDate), futureDate)
  );

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mi Cartera</h1>
          <p className="text-muted-foreground">
            Resumen de tu cartera de seguros y próximas renovaciones.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/cartera/clientes">
            <Button variant="outline">
              <Users className="mr-2 h-4 w-4" />
              Directorio
            </Button>
          </Link>
          <Link href="/cartera/importar">
            <Button>
              <Upload className="mr-2 h-4 w-4" />
              Cargar Layout
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-primary/10 via-background to-background">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Prima Anualizada Total</CardTitle>
            <Wallet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(
                totalPremium
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Suma de tu cartera viva</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Clientes Activos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientsCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Registrados en la plataforma</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Pólizas Vigentes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{policies.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Pólizas individuales</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-500" />
            Línea de tiempo de Renovaciones
          </h2>
          <div className="flex space-x-1 border rounded-md p-1 bg-muted/20">
            <Link href="?days=30">
              <Badge variant={daysFilter === 30 ? "default" : "outline"} className="cursor-pointer">
                30 días
              </Badge>
            </Link>
            <Link href="?days=45">
              <Badge variant={daysFilter === 45 ? "default" : "outline"} className="cursor-pointer">
                45 días
              </Badge>
            </Link>
            <Link href="?days=60">
              <Badge variant={daysFilter === 60 ? "default" : "outline"} className="cursor-pointer">
                60 días
              </Badge>
            </Link>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            {upcomingRenewals.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
                <Building2 className="w-12 h-12 mb-3 text-muted/30" />
                <p>No tienes pólizas por vencer en los próximos {daysFilter} días.</p>
              </div>
            ) : (
              <div className="divide-y">
                {upcomingRenewals.map((policy) => (
                  <div
                    key={policy.id}
                    className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex flex-col">
                      <span className="font-semibold text-lg">{policy.contractor}</span>
                      <span className="text-sm text-muted-foreground">
                        {policy.product || "Producto no especificado"} â€¢ {policy.insuranceCompany}
                      </span>
                    </div>
                    <div className="flex flex-col items-end mt-2 md:mt-0 text-right">
                      <span className="font-bold text-orange-600">
                        Vence: {policy.renewalDate ? format(new Date(policy.renewalDate), "dd MMM yyyy", { locale: es }) : "N/A"}
                      </span>
                      <span className="text-sm">
                        Prima:{" "}
                        {new Intl.NumberFormat("es-MX", {
                          style: "currency",
                          currency: "MXN",
                        }).format(policy.annualPremium || 0)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* FULL POLICIES TABLE (CLIENT COMPONENT) */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-blue-500" />
          Detalle Completo de Pólizas
        </h2>
        <CarteraTableClient policies={policies} isAdmin={dbUser?.role === 'ADMIN' || dbUser?.role === 'SUPER_ADMIN'} />
      </div>
    </div>
  );
}



