import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, FileText, Globe, Plus, ExternalLink, ShieldCheck, Palette, Layers, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAgencies, getDiscountCodes } from "./actions";
import { AgencyFormModal } from "./AgencyFormModal";
import { SwitchAgencyButton } from "./SwitchAgencyButton";
import { resolveImageUrl } from "@/lib/utils";
import { AgenciesTable } from "./AgenciesTable";
import { DiscountCodesTable } from "./DiscountCodesTable";
import { DiscountCodeFormModal } from "./DiscountCodeFormModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AgenciasPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (dbUser?.role !== "SUPER_ADMIN") redirect("/");

  const agencies = await getAgencies();
  const discountCodes = await getDiscountCodes();

  return (
    <div className="flex flex-col gap-8 p-4 md:p-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white p-8 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
        <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
        
        <div className="relative z-10 flex flex-col gap-2">
          <Badge className="bg-white/20 hover:bg-white/30 text-white w-fit border-white/10 backdrop-blur-md mb-2">
            <ShieldCheck className="w-3 h-3 mr-1" /> Panel de Control Global
          </Badge>
          <h1 className="text-4xl font-extrabold tracking-tight">Gestión de Agencias SaaS</h1>
          <p className="text-indigo-100 max-w-xl text-sm leading-relaxed opacity-90">
            Administra todas las instancias, configura marcas blancas, asigna colores corporativos y monitorea el volumen de usuarios y pólizas de cada agencia cliente.
          </p>
        </div>
      </div>

      <Tabs defaultValue="agencias" className="w-full">
        <div className="flex justify-between items-center mb-6">
          <TabsList className="bg-slate-100/80 p-1">
            <TabsTrigger value="agencias" className="data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm">
              <Building2 className="w-4 h-4 mr-2" /> Agencias
            </TabsTrigger>
            <TabsTrigger value="cupones" className="data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm">
              <Ticket className="w-4 h-4 mr-2" /> Cupones de Descuento
            </TabsTrigger>
          </TabsList>
          
          {/* Action buttons depending on active tab would ideally require client state, 
              but we can just put both buttons here and they apply to their respective domains,
              or put the buttons inside the TabsContent. Let's put them inside TabsContent for clarity. */}
        </div>

        <TabsContent value="agencias" className="space-y-6 mt-0 border-0 p-0 focus-visible:outline-none">
          <div className="flex justify-end">
            <AgencyFormModal>
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md">
                <Plus className="mr-2 h-4 w-4" />
                Nueva Agencia
              </Button>
            </AgencyFormModal>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {agencies.map((agency) => (
              <Card key={agency.id} className="group overflow-hidden border-slate-200/60 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white/50 backdrop-blur-xl rounded-2xl relative">
                <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: agency.primaryColor || '#0f172a' }}></div>
                
                <CardHeader className="pb-4 pt-6 relative">
                  <div className="absolute right-4 top-4">
                    <Badge variant={agency.active ? "default" : "destructive"} className={agency.active ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-0" : ""}>
                      {agency.active ? 'Activa' : 'Inactiva'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center shadow-inner border border-slate-100 overflow-hidden bg-white shrink-0">
                      {agency.logoUrl ? (
                        <img src={resolveImageUrl(agency.logoUrl)} alt={agency.name} className="w-full h-full object-contain p-2" />
                      ) : (
                        <Building2 className="w-6 h-6 text-slate-400" />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <CardTitle className="text-xl font-bold text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                        {agency.name}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1.5 text-xs font-medium mt-1">
                        <Globe className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-slate-500">{agency.slug}.aacomsoft.com</span>
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="grid grid-cols-3 gap-2 bg-slate-50/80 rounded-xl p-3 border border-slate-100">
                    <div className="flex flex-col items-center justify-center text-center p-2 rounded-lg bg-white shadow-sm border border-slate-100/50">
                      <Users className="w-4 h-4 text-blue-500 mb-1" />
                      <span className="text-xs text-slate-500 font-medium">Usuarios</span>
                      <span className="text-lg font-bold text-slate-800">{agency._count.users}</span>
                    </div>
                    <div className="flex flex-col items-center justify-center text-center p-2 rounded-lg bg-white shadow-sm border border-slate-100/50">
                      <Layers className="w-4 h-4 text-emerald-500 mb-1" />
                      <span className="text-xs text-slate-500 font-medium">Clientes</span>
                      <span className="text-lg font-bold text-slate-800">{agency._count.clients}</span>
                    </div>
                    <div className="flex flex-col items-center justify-center text-center p-2 rounded-lg bg-white shadow-sm border border-slate-100/50">
                      <FileText className="w-4 h-4 text-amber-500 mb-1" />
                      <span className="text-xs text-slate-500 font-medium">Pólizas</span>
                      <span className="text-lg font-bold text-slate-800">{agency._count.policies}</span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2 text-xs text-slate-500 bg-white border border-slate-100 rounded-lg p-2.5">
                    <Palette className="w-4 h-4" />
                    <span>Color Primario:</span>
                    <div className="flex items-center gap-1.5 ml-auto">
                      <span className="font-mono">{agency.primaryColor || '#0f172a'}</span>
                      <div className="w-4 h-4 rounded-full shadow-inner border border-black/10" style={{ backgroundColor: agency.primaryColor || '#0f172a' }}></div>
                    </div>
                  </div>
                </CardContent>
                
                <CardFooter className="pt-2 pb-6 flex gap-2">
                  <AgencyFormModal agency={agency}>
                    <Button variant="outline" className="w-full bg-white hover:bg-slate-50 border-slate-200">
                      Configurar
                    </Button>
                  </AgencyFormModal>
                  <SwitchAgencyButton agencyId={agency.id} agencyName={agency.name} />
                  <Link href={`https://${agency.slug}.aacomsoft.com`} target="_blank" className="w-full" title="Visitar">
                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}

            {agencies.length === 0 && (
              <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50 flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <Building2 className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-700">Aún no hay agencias</h3>
                <p className="text-slate-500 max-w-sm mx-auto mt-2 mb-6">
                  Comienza a expandir tu SaaS creando la primera agencia cliente.
                </p>
                <AgencyFormModal>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Crear Primera Agencia
                  </Button>
                </AgencyFormModal>
              </div>
            )}
          </div>

          {agencies.length > 0 && (
            <AgenciesTable agencies={agencies} />
          )}
        </TabsContent>

        <TabsContent value="cupones" className="space-y-6 mt-0 border-0 p-0 focus-visible:outline-none">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Códigos de Promoción</h2>
              <p className="text-sm text-slate-500">Crea cupones que las agencias podrán usar al pagar en la pasarela.</p>
            </div>
            <DiscountCodeFormModal>
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md">
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Cupón
              </Button>
            </DiscountCodeFormModal>
          </div>
          
          <DiscountCodesTable discountCodes={discountCodes} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
