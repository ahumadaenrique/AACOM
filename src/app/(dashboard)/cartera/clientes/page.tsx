import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, User, FileText, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function DirectorioClientes() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const clients = await prisma.client.findMany({
    where: { userId: session.user.id },
    include: { policies: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/cartera">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold tracking-tight">Directorio de Clientes</h1>
          </div>
          <p className="text-muted-foreground pl-10">
            Administra a tus clientes y visualiza sus pÃ³lizas asociadas.
          </p>
        </div>
        <div className="flex gap-2">
          {/* MÃ³dulo de "Nuevo Cliente" pendiente de implementarse en formulario modal */}
          <Button variant="default">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Cliente (PrÃ³ximamente)
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todos tus Clientes ({clients.length})</CardTitle>
          <CardDescription>
            Lista de clientes dados de alta manual o mediante la importaciÃ³n de tu Layout.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {clients.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground flex flex-col items-center border rounded-md">
              <User className="w-12 h-12 mb-3 text-muted/30" />
              <p>AÃºn no tienes clientes registrados.</p>
              <Link href="/cartera/importar" className="mt-4">
                <Button variant="outline">Ir a Cargar Layout</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-auto max-h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre / Contacto</TableHead>
                    <TableHead>Nacimiento</TableHead>
                    <TableHead className="text-center">PÃ³lizas</TableHead>
                    <TableHead className="text-right">Prima Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((client) => {
                    const totalPremium = client.policies.reduce((acc, p) => acc + (p.annualPremium || 0), 0);
                    return (
                      <TableRow key={client.id}>
                        <TableCell>
                          <Link href={`/cartera/clientes/${client.id}`} className="font-semibold text-primary hover:underline">{client.name}</Link>
                          <div className="text-xs text-muted-foreground flex flex-col mt-1">
                            {client.email && <span>{client.email}</span>}
                            {client.phone && <span>{client.phone}</span>}
                          </div>
                        </TableCell>
                        <TableCell>
                          {client.birthDate ? format(new Date(client.birthDate), "dd MMM yyyy", { locale: es }) : "N/A"}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="flex items-center w-fit mx-auto gap-1">
                            <FileText className="w-3 h-3" />
                            {client.policies.length}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(totalPremium)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


