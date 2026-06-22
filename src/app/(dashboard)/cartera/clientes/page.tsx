import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, ArrowLeft } from "lucide-react";
import Link from "next/link";
import ClientFormDialog from "./[id]/ClientFormDialog";
import ClientListTable from "./ClientListTable";

export const dynamic = "force-dynamic";

export default async function DirectorioClientes() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const dbUser = await prisma.user.findUnique({where: {id: session.user.id}, select: {role: true, agencyId: true}});

  let clientsWhereClause: any = { userId: session.user.id };
  if ((dbUser?.role === 'ADMIN' || dbUser?.role === 'SUPER_ADMIN') && dbUser?.agencyId) {
     clientsWhereClause = { agencyId: dbUser.agencyId };
  }

  const clients = await prisma.client.findMany({
    where: clientsWhereClause,
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
            Administra a tus clientes y visualiza sus pólizas asociadas.
          </p>
        </div>
        <div className="flex gap-2">
          <ClientFormDialog />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todos tus Clientes ({clients.length})</CardTitle>
          <CardDescription>
            Lista de clientes dados de alta manual o mediante la importación de tu Layout.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {clients.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground flex flex-col items-center border rounded-md">
              <User className="w-12 h-12 mb-3 text-muted/30" />
              <p>Aún no tienes clientes registrados.</p>
              <Link href="/cartera/importar" className="mt-4">
                <Button variant="outline">Ir a Cargar Layout</Button>
              </Link>
            </div>
          ) : (
            <ClientListTable clients={clients} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
