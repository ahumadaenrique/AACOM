import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Phone,
  Mail,
  MessageCircle,
  ShieldCheck,
  FileText,
  AlertTriangle,
  ExternalLink,
  Download,
  Calendar,
  BookOpen,
  UserCheck,
  HeartPulse,
  Building2,
} from "lucide-react";
import { resolveImageUrl } from "@/lib/utils";
import { computePolicyCycleInfo, formatDateSafe, RAMO_LABELS } from "../cartera/dateUtils";

export const dynamic = "force-dynamic";

const CATEGORY_LABELS: Record<string, { label: string; badgeClass: string }> = {
  SINIESTRO: {
    label: "🚨 Qué hacer en caso de Siniestro",
    badgeClass: "bg-red-100 text-red-800 border-red-200",
  },
  REEMBOLSO: {
    label: "💳 Guía de Reembolso / Trámite",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-200",
  },
  RED_MEDICA: {
    label: "🏥 Red Hospitalaria y Directorio",
    badgeClass: "bg-teal-100 text-teal-800 border-teal-200",
  },
  INSTRUCTIVO: {
    label: "📘 Instructivo / Manual del Asegurado",
    badgeClass: "bg-indigo-100 text-indigo-800 border-indigo-200",
  },
  CONTACTO_EMERGENCIA: {
    label: "📞 Teléfonos de Emergencia",
    badgeClass: "bg-rose-100 text-rose-800 border-rose-200",
  },
};

export default async function MiPortalClientePage() {
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

  // Buscar el expediente Client vinculado a este usuario (o si es el Agente previsualizando con ?clientId=...)
  const client = await prisma.client.findFirst({
    where: {
      OR: [
        { portalUserId: currentUser.id } as any,
        { email: { equals: currentUser.email, mode: "insensitive" } },
      ],
      isArchived: false,
    },
    include: {
      user: true,
      agency: true,
      policies: {
        where: { isArchived: false },
        include: {
          receipts: {
            orderBy: [{ policyYear: "desc" }, { receiptNumber: "asc" }],
          },
        },
        orderBy: { effectiveDate: "desc" },
      },
      portalItems: {
        where: { active: true },
        orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      },
    } as any,
  });

  if (!client) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4 text-center space-y-4">
        <div className="w-16 h-16 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mx-auto">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900">Portal de Asegurados</h1>
        <p className="text-slate-600 max-w-md mx-auto">
          No encontramos pólizas vinculadas a este correo todavía. Si eres el Agente titular, puedes configurar y previsualizar el portal de cada cliente desde <strong>Mi Cartera</strong>.
        </p>
      </div>
    );
  }

  const cAny = client as any;
  const agent = cAny.user;
  const agency = cAny.agency || currentUser.agency;
  const agentPhoneClean = (agent?.phone || "").replace(/\D/g, "");
  const agentWhatsapp =
    agentPhoneClean.length === 10 ? `52${agentPhoneClean}` : agentPhoneClean;
  const agentImage = resolveImageUrl(agent?.image);
  const agencyLogo = agency?.logoUrl ? resolveImageUrl(agency.logoUrl) : null;
  const brandColor = agency?.primaryColor || "#0d9488";

  const hiddenIds: string[] = (() => {
    try {
      if (cAny.portalHiddenPolicyIds) {
        const arr = JSON.parse(cAny.portalHiddenPolicyIds);
        if (Array.isArray(arr)) return arr;
      }
    } catch {}
    return [];
  })();

  const visiblePolicies = ((cAny.policies || []) as any[])
    .filter((p) => !hiddenIds.includes(p.id))
    .map((p) => ({
      ...p,
      cycle: computePolicyCycleInfo(p),
    }));

  const clientItems = (cAny.portalItems || []) as any[];

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Tarjeta de Contacto del Agente Titular */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            {agentImage ? (
              <img
                src={agentImage}
                alt={agent?.name || "Tu Agente"}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-teal-400/50 shadow-md shrink-0"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-teal-500/20 border-2 border-teal-400/40 flex items-center justify-center shrink-0">
                <UserCheck className="w-10 h-10 text-teal-300" />
              </div>
            )}
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-teal-300 bg-teal-500/20 px-3 py-0.5 rounded-full border border-teal-400/30" style={{ borderColor: `${brandColor}66` }}>
                {agencyLogo && (
                  <img src={agencyLogo} alt={agency?.name || "Marca"} className="h-4 w-auto object-contain rounded-sm bg-white/90 px-1" />
                )}
                Tu Agente de Seguros Personal
              </span>
              <h1 className="text-2xl sm:text-3xl font-black mt-1.5">
                {agent?.name || agency?.name || "Agente Certificado"}
              </h1>
              <p className="text-sm text-slate-300 mt-0.5">
                {agency?.name ? `${agency.name} • ` : ""}Atención personalizada a pólizas, renovaciones y siniestros
              </p>
              <div className="flex flex-wrap items-center gap-4 mt-3 text-xs sm:text-sm text-slate-200">
                {agent?.email && (
                  <a
                    href={`mailto:${agent.email}`}
                    className="flex items-center gap-1.5 hover:text-teal-300 transition-colors"
                  >
                    <Mail className="w-4 h-4 text-teal-400" />
                    {agent.email}
                  </a>
                )}
                {agent?.phone && (
                  <a
                    href={`tel:${agent.phone}`}
                    className="flex items-center gap-1.5 hover:text-teal-300 transition-colors font-semibold"
                  >
                    <Phone className="w-4 h-4 text-teal-400" />
                    {agent.phone}
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap sm:flex-col gap-2.5 shrink-0">
            {agentWhatsapp.length >= 10 && (
              <a
                href={`https://wa.me/${agentWhatsapp}?text=${encodeURIComponent(
                  `Hola ${agent?.name || ""}, soy ${client.name}. Te escribo desde mi Portal de Asegurado.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold gap-2 shadow-lg">
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp Directo con mi Agente
                </Button>
              </a>
            )}
            {agent?.phone && (
              <a href={`tel:${agent.phone}`}>
                <Button
                  variant="outline"
                  className="w-full bg-white/10 hover:bg-white/20 text-white border-white/20 font-semibold gap-2"
                >
                  <Phone className="w-4 h-4" />
                  Llamar a mi Agente
                </Button>
              </a>
            )}
          </div>
        </div>

        {/* Nota de bienvenida personalizada por el agente para este cliente */}
        {cAny.portalWelcomeNote && (
          <div className="mt-6 pt-5 border-t border-white/15 bg-white/5 rounded-2xl p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-teal-300 mb-1">
              Mensaje de tu Agente para ti ({client.name}):
            </p>
            <p className="text-sm text-slate-100 whitespace-pre-line leading-relaxed">
              {cAny.portalWelcomeNote}
            </p>
          </div>
        )}
      </div>

      {/* SECCIÓN 1: Instructivos y Qué Hacer en Caso de Siniestro */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              Instructivos y ¿Qué hacer en caso de Siniestro?
            </h2>
            <p className="text-sm text-slate-500">
              Guías rápidas, teléfonos de emergencia y formatos preparados por tu agente especialmente para tus pólizas.
            </p>
          </div>
        </div>

        {clientItems.length === 0 ? (
          <Card className="border-slate-200 bg-slate-50/60">
            <CardContent className="py-8 text-center text-slate-500 text-sm">
              En caso de cualquier siniestro o urgencia médica/vehicular, comunícate de inmediato con tu agente usando los botones de arriba para recibir asistencia paso a paso.
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-5">
            {clientItems.map((item) => {
              const catInfo = CATEGORY_LABELS[item.category] || {
                label: "📘 Instructivo",
                badgeClass: "bg-slate-100 text-slate-800 border-slate-200",
              };
              return (
                <Card
                  key={item.id}
                  className="border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap mb-1.5">
                      <Badge variant="outline" className={`font-bold text-xs ${catInfo.badgeClass}`}>
                        {catInfo.label}
                      </Badge>
                      {item.ramo && item.ramo !== "GENERAL" && (
                        <Badge variant="secondary" className="text-xs">
                          {RAMO_LABELS[item.ramo] || item.ramo}
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg font-extrabold text-slate-900">
                      {item.title}
                    </CardTitle>
                    {item.description && (
                      <CardDescription className="text-slate-600 font-medium">
                        {item.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {item.content && (
                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                        {item.content}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2.5 pt-1">
                      {item.emergencyPhone && (
                        <a href={`tel:${item.emergencyPhone}`}>
                          <Button
                            size="sm"
                            className="bg-red-600 hover:bg-red-700 text-white font-bold gap-1.5"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            Cabina Siniestros: {item.emergencyPhone}
                          </Button>
                        </a>
                      )}
                      {item.fileUrl && (
                        <a
                          href={item.fileUrl}
                          download={item.fileName || `${item.title}.pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button size="sm" variant="outline" className="font-semibold gap-1.5">
                            <Download className="w-3.5 h-3.5 text-teal-600" />
                            {item.fileName || "Descargar Instructivo PDF"}
                          </Button>
                        </a>
                      )}
                      {item.externalUrl && (
                        <a href={item.externalUrl} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="secondary" className="font-semibold gap-1.5">
                            <ExternalLink className="w-3.5 h-3.5" />
                            Abrir Enlace / Red Médica
                          </Button>
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* SECCIÓN 2: Mis Pólizas Contratadas */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-teal-600" />
            Mis Pólizas ({visiblePolicies.length})
          </h2>
          <p className="text-sm text-slate-500">
            Consulta tus números de póliza, aseguradoras, fechas de renovación y descarga tus carátulas en PDF.
          </p>
        </div>

        {visiblePolicies.length === 0 ? (
          <Card className="border-slate-200">
            <CardContent className="py-12 text-center text-slate-500">
              Tu agente está actualizando tus carátulas de póliza. Muy pronto aparecerán aquí.
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-5">
            {visiblePolicies.map((pol) => {
              const isVigente =
                pol.cycle.computedStatus !== "CANCELADA" &&
                pol.cycle.computedStatus !== "TERMINADA";
              return (
                <Card
                  key={pol.id}
                  className="border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden"
                >
                  <div
                    className={`h-1.5 w-full ${
                      isVigente ? "bg-teal-500" : "bg-slate-300"
                    }`}
                  />
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <Badge
                        variant="outline"
                        className="font-bold text-xs bg-teal-50 text-teal-800 border-teal-200"
                      >
                        {RAMO_LABELS[pol.ramo || "VIDA_INDIVIDUAL"] || pol.ramo || "Seguro"}
                      </Badge>
                      <Badge
                        variant={isVigente ? "default" : "secondary"}
                        className={isVigente ? "bg-emerald-600 text-white" : ""}
                      >
                        {pol.cycle.computedStatus}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl font-black text-slate-900 mt-2">
                      {pol.insuranceCompany || "Aseguradora"} —{" "}
                      <span className="font-mono text-indigo-700">#{pol.policyNumber}</span>
                    </CardTitle>
                    {pol.product && (
                      <CardDescription className="font-semibold text-slate-700">
                        Plan / Producto: {pol.product}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                      <div>
                        <span className="text-[11px] font-bold uppercase text-slate-400 block">
                          Asegurado / Contratante
                        </span>
                        <span className="font-semibold text-slate-800">
                          {pol.insured || pol.contractor || client.name}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] font-bold uppercase text-slate-400 block">
                          Forma de Pago
                        </span>
                        <span className="font-semibold text-slate-800">
                          {pol.paymentMethod || "Anual"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] font-bold uppercase text-slate-400 block">
                          Inicio de Vigencia
                        </span>
                        <span className="font-semibold text-slate-800">
                          {formatDateSafe(pol.effectiveDate)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] font-bold uppercase text-slate-400 block">
                          Próxima Renovación
                        </span>
                        <span className="font-semibold text-teal-700">
                          {pol.cycle.nextEventDate
                            ? formatDateSafe(pol.cycle.nextEventDate)
                            : formatDateSafe(pol.renewalDate)}
                        </span>
                      </div>
                    </div>

                    {pol.observations && (
                      <div className="text-xs text-slate-600 bg-amber-50/60 border border-amber-200/70 rounded-lg p-3">
                        <strong className="text-amber-900 block mb-0.5">
                          Notas y Coberturas Importantes:
                        </strong>
                        {pol.observations}
                      </div>
                    )}

                    <div className="pt-1 flex items-center justify-between gap-3">
                      {pol.pdfUrl ? (
                        <a
                          href={pol.pdfUrl}
                          download={`Poliza_${pol.policyNumber}.pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full"
                        >
                          <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-2">
                            <FileText className="w-4 h-4" />
                            Ver / Descargar Carátula de Póliza (PDF)
                          </Button>
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400 italic">
                          Carátula PDF en proceso de carga por tu agente.
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
