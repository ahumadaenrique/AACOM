import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Wallet, Users, FileText, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AdminCartera() {
  const session = await auth();
  
  const userRole = await prisma.user.findUnique({
    where: { id: session?.user?.id },
    select: { role: true, agencyId: true },
  });

  const currentAgencyId = session?.user?.agencyId || userRole?.agencyId;

  if (userRole?.role !== "ADMIN" && userRole?.role !== "SUPER_ADMIN") {
    return <div>Acceso denegado</div>;
  }

  const allClients = await prisma.client.findMany({
    where: { agencyId: currentAgencyId },
    include: {
      policies: true,
      user: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalClients = allClients.length;
  const totalPolicies = allClients.reduce((acc, client) => acc + client.policies.length, 0);
  const globalPremium = allClients.reduce((acc, client) => {
    const clientPremium = client.policies.reduce((sum, p) => sum + (p.annualPremium || 0), 0);
    return acc + clientPremium;
  }, 0);

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-6xl mx-auto">
      <div className="flex items-center gap-2 mb-2">
        <Link href="/admin">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cartera Global</h1>
          <p className="text-muted-foreground">
            Vista general de la cartera de todos los agentes de la promotoría.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-primary/10 via-background to-background">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Prima Global Anualizada</CardTitle>
            <Wallet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(
                globalPremium
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Clientes Totales</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClients}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Pólizas Totales</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPolicies}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Directorio Global</CardTitle>
          <CardDescription>
            Listado de clientes registrados y a qué agente pertenecen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto max-h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Agente Asignado</TableHead>
                  <TableHead className="text-center">Pólizas</TableHead>
                  <TableHead className="text-right">Prima Aportada</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allClients.map((client) => {
                  const clientPremium = client.policies.reduce((acc, p) => acc + (p.annualPremium || 0), 0);
                  return (
                    <TableRow key={client.id}>
                      <TableCell>
                        <div className="font-semibold">{client.name}</div>
                        <div className="text-xs text-muted-foreground">{client.email}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{client.user?.name || "Desconocido"}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {client.policies.length}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(clientPremium)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

