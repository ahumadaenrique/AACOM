import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CreditCard, Gift, ShieldCheck, Zap, Copy, CheckCircle2 } from "lucide-react";
import { createCheckoutSession } from "./actions";
import { differenceInDays, format } from "date-fns";
import { es } from "date-fns/locale";
import PlanSelector from "./PlanSelector";

export const dynamic = "force-dynamic";

export default async function SuscripcionPage({ searchParams }: { searchParams: { success?: string, canceled?: string } }) {
  const session = await auth();
  if (!session?.user?.id) return <div className="p-10 text-red-500">Error: No session user ID</div>;

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (user?.role !== "ADMIN" && user?.role !== "SUPER_ADMIN") return <div className="p-10 text-red-500">Error: Tu rol es {user?.role || "nulo"}, necesitas ser ADMIN o SUPER_ADMIN</div>;

  let agencyId = session.user.agencyId || user?.agencyId;
  let agency = null;

  if (agencyId) {
    agency = await prisma.agency.findUnique({ where: { id: agencyId } });
  }

  // Si el SUPER_ADMIN no tiene agencia O apunta a una agencia borrada, le asignamos la primera
  if (user?.role === "SUPER_ADMIN" && (!agencyId || !agency)) {
    const firstAgency = await prisma.agency.findFirst();
    if (firstAgency) {
      agencyId = firstAgency.id;
      agency = firstAgency;
      await prisma.user.update({
        where: { id: user.id },
        data: { agencyId: firstAgency.id }
      });
    }
  }

  if (!agency) return <div className="p-10 text-red-500">Error: agencyId {agencyId} no existe en la BD y no hay agencias disponibles para auto-asignar.</div>;

  const isSubscribed = agency.subscriptionStatus === "active";
  const endDate = agency.subscriptionEndDate;
  const daysLeft = endDate ? differenceInDays(endDate, new Date()) : 0;
  
  const referralLink = `https://aacomsoft.com/registro?ref=${agency.id}`;

  return (
    <div className="flex flex-col gap-8 p-4 md:p-8 max-w-5xl mx-auto w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-8 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>
        <div className="relative z-10">
          <Badge className="bg-white/10 hover:bg-white/20 text-indigo-200 border-white/10 mb-2">
            Gestión de Suscripción
          </Badge>
          <h1 className="text-3xl font-extrabold tracking-tight">Licencia de Agencia</h1>
          <p className="text-indigo-200 max-w-xl text-sm leading-relaxed mt-2 opacity-90">
            Administra tu suscripción SaaS, aplica códigos de descuento y obtén meses gratis refiriendo el sistema a otros dueños de agencias.
          </p>
        </div>
      </div>

      {searchParams.success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <p className="font-medium text-sm">¡Pago procesado con éxito! Tu suscripción ha sido activada/extendida correctamente.</p>
        </div>
      )}

      {searchParams.canceled && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl flex items-center gap-3">
          <p className="font-medium text-sm">El proceso de pago ha sido cancelado. Puedes intentarlo de nuevo cuando desees.</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Estado de Suscripción */}
        <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden flex flex-col">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <CardTitle className="text-xl flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-600" />
                  Estado Actual
                </CardTitle>
                <CardDescription>Resumen de tu licencia SaaS</CardDescription>
              </div>
              <Badge variant={isSubscribed ? "default" : "destructive"} className={isSubscribed ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-0" : ""}>
                {isSubscribed ? "Activa" : "Inactiva"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6 flex-1 border-b border-slate-100">
            <div className="flex flex-col gap-4">
              <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                <div className="text-sm font-medium text-slate-500 mb-1">Días Restantes</div>
                <div className="text-3xl font-black text-slate-800 flex items-baseline gap-2">
                  {daysLeft > 0 ? daysLeft : 0}
                  <span className="text-sm font-medium text-slate-500">días</span>
                </div>
              </div>

              {endDate && (
                <div className="text-sm text-slate-600 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-slate-400" />
                  Próximo corte: <strong>{format(endDate, "dd 'de' MMMM, yyyy", { locale: es })}</strong>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Refiere y Gana */}
        <Card className="border-indigo-100 shadow-sm rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-50 to-white flex flex-col">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl flex items-center gap-2 text-indigo-900">
              <Gift className="w-5 h-5 text-indigo-600" />
              Programa "Refiere y Gana"
            </CardTitle>
            <CardDescription className="text-indigo-700/70">
              Gana meses gratis invitando a otros colegas
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2 flex-1">
            <div className="prose prose-sm text-slate-600 mb-6 leading-relaxed">
              <p>
                Por cada agencia de seguros que se registre en AACOMSoft utilizando tu enlace único y pague su primera mensualidad, <strong>te agregaremos automáticamente 2 meses (60 días) de servicio gratuito</strong> a tu licencia actual.
              </p>
              <p>¡No hay límite de referidos!</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-indigo-900 uppercase tracking-wider">Tu Enlace Único de Referido</label>
              <div className="flex items-center gap-2 bg-white border border-indigo-200 p-2 rounded-xl shadow-sm">
                <Input readOnly value={referralLink} className="border-0 bg-transparent focus-visible:ring-0 text-sm text-indigo-900 font-medium" />
                {/* Client component copy button needed here for interactivity, using a generic visually appealing block for now */}
                <Button type="button" variant="secondary" className="shrink-0 bg-indigo-100 hover:bg-indigo-200 text-indigo-700" onClick={() => {
                  // This is a server component, so onclick won't work natively. Ideally this would be extracted.
                  // For MVP we just display it.
                }}>
                  Copiar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-extrabold text-slate-800 mb-6">Elige tu Plan de Suscripción</h2>
        <PlanSelector isSubscribed={isSubscribed} />
      </div>
    </div>
  );
}
