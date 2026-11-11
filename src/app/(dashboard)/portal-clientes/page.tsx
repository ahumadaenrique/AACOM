import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldCheck, KeyRound, Users, FileText, ArrowRight, CheckCircle2 } from "lucide-react";
import ClientPortalManagerDialog from "../cartera/clientes/[id]/ClientPortalManagerDialog";

export const dynamic = "force-dynamic";

export default async function PortalClientesHubPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { agency: true },
  });

  if (!currentUser) {
    redirect("/login");
  }

  if (currentUser.role === "CLIENTE") {
    redirect("/mi-portal");
  }

  // Aislamiento estricto de producto: Exclusivo para cuentas SOLO_AGENT (nunca para Promotorías/Agencias)
  if ((currentUser.agency as any)?.accountType !== "SOLO_AGENT") {
    redirect("/cartera");
  }

  const isAdmin = currentUser.role === "ADMIN" || currentUser.role === "SUPER_ADMIN";
  const effectiveAgencyId = (session.user.agencyId || currentUser.agencyId || "aacom") as string;

  const [clients, agentTemplates] = await Promise.all([
    prisma.client.findMany({
      where: isAdmin
        ? { agencyId: effectiveAgencyId, isArchived: false }
        : { userId: currentUser.id, isArchived: false },
      include: {
        policies: {
          where: { isArchived: false },
        },
        portalItems: {
          orderBy: { createdAt: "desc" },
        },
      } as any,
      orderBy: { name: "asc" },
    }),
    (prisma as any).clientPortalItem
      ? (prisma as any).clientPortalItem
          .findMany({
            where: { userId: currentUser.id, isTemplate: true },
            orderBy: { createdAt: "desc" },
          })
          .catch((err: any) => {
            console.error("Error fetching agentTemplates in portal-clientes:", err);
            return [];
          })
      : Promise.resolve([]),
  ]);

  const activePortalClientsCount = clients.filter(
    (c: any) => c.portalUserId && c.portalEnabled
  ).length;

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-7 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" /> Módulo Exclusivo de Fidelización
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
            Portal de Clientes Asegurados
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Crea un usuario y contraseña temporal para cada cliente de tu cartera. Al ingresar, el cliente elegirá su contraseña personal y verá únicamente tus datos de contacto, sus pólizas vigentes y los instructivos de siniestro o reembolso que tú configures para él.
          </p>
        </div>
        <div className="bg-white/10 border border-white/15 rounded-2xl px-6 py-4 text-center shrink-0">
          <span className="text-3xl font-black text-teal-300 block">
            {activePortalClientsCount} / {clients.length}
          </span>
          <span className="text-xs text-slate-300 font-semibold">
            Clientes con Portal Activo
          </span>
        </div>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Users className="w-5 h-5 text-teal-600" />
              Configuración de Acceso e Instructivos por Cliente
            </CardTitle>
            <CardDescription>
              Haz clic en <strong>Portal del Cliente</strong> en cualquier fila para generar su contraseña temporal, enviarla por WhatsApp y subir instructivos personalizados.
            </CardDescription>
          </div>
          <Link href="/cartera">
            <Button variant="outline" size="sm" className="font-semibold gap-1.5">
              Ir a Mi Cartera <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {clients.length === 0 ? (
            <div className="text-center py-12 text-slate-500 space-y-3">
              <p>Aún no tienes clientes registrados en Mi Cartera.</p>
              <Link href="/cartera">
                <Button className="bg-teal-600 hover:bg-teal-700 text-white font-bold">
                  Agregar mi primer cliente en Mi Cartera
                </Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y border rounded-2xl overflow-hidden">
              {clients.map((client: any) => {
                const hasPortal = Boolean(client.portalUserId && client.portalEnabled);
                const instructionsCount = (client.portalItems || []).length;
                const policiesCount = (client.policies || []).length;
                return (
                  <div
                    key={client.id}
                    className="p-4 bg-white hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <Link
                          href={`/cartera/clientes/${client.id}`}
                          className="font-bold text-slate-900 hover:text-teal-700 hover:underline text-base"
                        >
                          {client.name}
                        </Link>
                        {hasPortal ? (
                          <Badge className="bg-emerald-600 text-white text-[11px] gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Portal Activo
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[11px] text-slate-500">
                            Sin acceso creado
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                        <span>Correo / Usuario: {client.email || "Sin correo asignado"}</span>
                        <span>•</span>
                        <span>{policiesCount} Póliza(s)</span>
                        <span>•</span>
                        <span>{instructionsCount} Instructivo(s) asignados</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <ClientPortalManagerDialog
                        client={client}
                        agentTemplates={agentTemplates}
                        agencySlug={currentUser.agency?.slug || "app"}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
