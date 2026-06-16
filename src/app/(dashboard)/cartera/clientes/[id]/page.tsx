import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, Phone, Mail, Calendar, Edit, FileText } from "lucide-react";
import Link from "next/link";
import PolicyUpload from "./PolicyUpload";

export const dynamic = "force-dynamic";

export default async function ClienteDetalle({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const client = await prisma.client.findFirst({
    where: { id: params.id, userId: session.user.id },
    include: { policies: true },
  });

  if (!client) {
    notFound();
  }

  const totalPremium = client.policies.reduce((acc, p) => acc + (p.annualPremium || 0), 0);

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/cartera/clientes">
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{client.name}</h1>
            <p className="text-muted-foreground">Perfil del cliente y listado de pólizas contratadas.</p>
          </div>
        </div>
        <Button variant="secondary">
          <Edit className="w-4 h-4 mr-2" />
          Editar Cliente
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Información Personal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-muted-foreground" />
              <span>{client.email || "Sin correo"}</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-muted-foreground" />
              <span>{client.phone || "Sin teléfono"}</span>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <span>
                {client.birthDate ? format(new Date(client.birthDate), "dd 'de' MMMM 'de' yyyy", { locale: es }) : "Fecha no registrada"}
              </span>
            </div>
            <hr className="my-4" />
            <div className="pt-2">
              <div className="text-sm font-semibold text-muted-foreground mb-1">Valor Total del Cliente</div>
              <div className="text-2xl font-bold text-primary">
                {new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(totalPremium)}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Pólizas Activas ({client.policies.length})</CardTitle>
              <CardDescription>Pólizas asociadas a este cliente.</CardDescription>
            </div>
            <Button size="sm">
              <FileText className="w-4 h-4 mr-2" />
              Agregar Póliza
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {client.policies.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <p>El cliente no cuenta con pólizas registradas.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Póliza</TableHead>
                      <TableHead>Producto</TableHead>
                      <TableHead>Vigencia</TableHead>
                      <TableHead className="text-right">Prima</TableHead>
                      <TableHead className="text-center">Documento</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {client.policies.map((policy) => (
                      <TableRow key={policy.id}>
                        <TableCell className="font-medium text-xs">
                          {policy.policyNumber}
                          <div className="text-muted-foreground mt-1">{policy.insuranceCompany}</div>
                        </TableCell>
                        <TableCell>{policy.product}</TableCell>
                        <TableCell className="text-xs">
                          {policy.effectiveDate ? format(new Date(policy.effectiveDate), "dd/MM/yyyy") : "-"} a{" "}
                          {policy.renewalDate ? format(new Date(policy.renewalDate), "dd/MM/yyyy") : "-"}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(policy.annualPremium || 0)}
                        </TableCell>
                        <TableCell className="text-center">
                          {/* Componente para subir o ver el PDF */}
                          <PolicyUpload policy={policy} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
