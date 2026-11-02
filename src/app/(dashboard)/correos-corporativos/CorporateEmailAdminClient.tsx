"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Mail,
  ShieldCheck,
  Users,
  Plus,
  RefreshCw,
  ArrowRightLeft,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  Globe,
  Building2,
  Trash2,
  Send,
  Smartphone,
  Loader2,
  Server,
  UserMinus,
  ArrowRight,
  FolderArchive,
  KeyRound,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { CorporateEmailUpsellBanner } from "@/components/corporate-email/CorporateEmailUpsellBanner";
import {
  createAgencyMailboxAction,
  deleteForwarderAction,
  releaseMailboxAndCreateForwardAction,
  resetCorporateEmailSandboxAction,
  runResellerClubAndFixieDiagnosticAction,
  simulateIncomingClientEmailAction,
  toggleMailboxSuspensionAction,
} from "./actions";
import { toggleAgencyCorporateEmailModule } from "@/app/(dashboard)/agencias/actions";

function getInitials(name: string): string {
  const parts = (name || "AG").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "AG";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function CorporateEmailAdminClient({ initialData }: { initialData: any }) {
  const router = useRouter();
  const [data, setData] = useState<any>(initialData);
  const [statusBanner, setStatusBanner] = useState<string>("");
  const [errorBanner, setErrorBanner] = useState<string>("");

  // Modal: Crear Buzón
  const [createOpen, setCreateOpen] = useState<boolean>(false);
  const [mailboxType, setMailboxType] = useState<"AGENT" | "DEPARTMENTAL">("AGENT");
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [localPart, setLocalPart] = useState<string>("");
  const [displayName, setDisplayName] = useState<string>("");
  const [creatingMailbox, setCreatingMailbox] = useState<boolean>(false);

  // Modal: Baja de Agente + Liberación de Asiento + Puente de Cartera
  const [releaseModalMailbox, setReleaseModalMailbox] = useState<any | null>(null);
  const [destinationMailboxId, setDestinationMailboxId] = useState<string>("");
  const [migrateEmails, setMigrateEmails] = useState<boolean>(true);
  const [releasingSeat, setReleasingSeat] = useState<boolean>(false);

  // Estados de acciones rápidas
  const [togglingMailboxId, setTogglingMailboxId] = useState<string | null>(null);
  const [simulatingEmail, setSimulatingEmail] = useState<string | null>(null);
  const [togglingModule, setTogglingModule] = useState<boolean>(false);
  const [showDnsDetails, setShowDnsDetails] = useState<boolean>(false);
  const [runningDiag, setRunningDiag] = useState<boolean>(false);

  const subscription = data.subscription;
  const activeMailboxes: any[] = data.activeMailboxes || [];
  const forwards: any[] = data.forwards || [];
  const agencyUsers: any[] = data.agencyUsers || [];

  const maxSeats = subscription?.maxSeats || 20;
  const usedSeats = activeMailboxes.length;
  const availableSeats = Math.max(0, maxSeats - usedSeats);
  const seatUsagePercent = Math.min(100, Math.round((usedSeats / maxSeats) * 100));

  // Agentes que aún no tienen buzón activo asignado
  const assignedUserIds = new Set(
    activeMailboxes.map((m) => m.agentUserId).filter(Boolean)
  );
  const unassignedAgents = agencyUsers.filter((u) => !assignedUserIds.has(u.id));

  const handleOpenCreateModal = () => {
    setErrorBanner("");
    if (unassignedAgents.length > 0) {
      const first = unassignedAgents[0];
      setMailboxType("AGENT");
      setSelectedAgentId(first.id);
      setLocalPart(first.suggestedLocalPart || "agente");
      setDisplayName(first.name || "Agente");
    } else {
      setMailboxType("DEPARTMENTAL");
      setSelectedAgentId("");
      setLocalPart("atencion");
      setDisplayName(`Atención a Clientes ${data.agency.name}`);
    }
    setCreateOpen(true);
  };

  const handleAgentSelectionChange = (userId: string) => {
    setSelectedAgentId(userId);
    const found = agencyUsers.find((u) => u.id === userId);
    if (found) {
      setLocalPart(found.suggestedLocalPart || "");
      setDisplayName(found.name || "");
    }
  };

  const handleCreateMailbox = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingMailbox(true);
    setErrorBanner("");
    try {
      const res = await createAgencyMailboxAction({
        targetAgencyId: data.agency.id,
        agentUserId: mailboxType === "AGENT" ? selectedAgentId : null,
        isDepartmental: mailboxType === "DEPARTMENTAL",
        localPart,
        displayName,
      });
      setCreateOpen(false);
      setStatusBanner(
        `Buzón ${res.mailbox.emailAddress} creado y aprovisionado con 10 GB en Titan Email.`
      );
      router.refresh();
      window.location.reload();
    } catch (err: any) {
      setErrorBanner(err.message || "Error al crear buzón corporativo.");
    } finally {
      setCreatingMailbox(false);
    }
  };

  const handleToggleSuspend = async (mailbox: any) => {
    setTogglingMailboxId(mailbox.id);
    setErrorBanner("");
    try {
      const nextSuspend = mailbox.status === "active";
      await toggleMailboxSuspensionAction({
        mailboxId: mailbox.id,
        suspend: nextSuspend,
        targetAgencyId: data.agency.id,
      });
      setStatusBanner(
        nextSuspend
          ? `Acceso revocado/suspendido en 1 clic para ${mailbox.emailAddress}.`
          : `Acceso reactivado para ${mailbox.emailAddress}.`
      );
      window.location.reload();
    } catch (err: any) {
      setErrorBanner(err.message || "No se pudo cambiar el estado del buzón.");
    } finally {
      setTogglingMailboxId(null);
    }
  };

  const handleOpenReleaseModal = (mailbox: any) => {
    const candidates = activeMailboxes.filter(
      (m) => m.id !== mailbox.id && m.status === "active"
    );
    setReleaseModalMailbox(mailbox);
    setDestinationMailboxId(candidates[0]?.id || "");
    setMigrateEmails(true);
  };

  const handleConfirmReleaseAndForward = async () => {
    if (!releaseModalMailbox || !destinationMailboxId) return;
    setReleasingSeat(true);
    setErrorBanner("");
    try {
      const res = await releaseMailboxAndCreateForwardAction({
        mailboxId: releaseModalMailbox.id,
        destinationMailboxId,
        migrateExistingEmails: migrateEmails,
        targetAgencyId: data.agency.id,
      });
      setReleaseModalMailbox(null);
      setStatusBanner(
        `Asiento liberado (${usedSeats}/${maxSeats} -> ${usedSeats - 1}/${maxSeats}). Puente de Cartera activo: ${res.forward.sourceEmail} -> ${res.forward.destinationEmail} (${res.migratedCount} correos históricos respaldados).`
      );
      window.location.reload();
    } catch (err: any) {
      setErrorBanner(err.message || "Error al dar de baja el buzón.");
    } finally {
      setReleasingSeat(false);
    }
  };

  const handleSimulateClientEmail = async (toEmail: string) => {
    setSimulatingEmail(toEmail);
    setErrorBanner("");
    try {
      const res = await simulateIncomingClientEmailAction({
        toEmail,
        targetAgencyId: data.agency.id,
      });
      setStatusBanner(
        res.routedViaForwarder
          ? `Prueba de Puente de Cartera exitosa: Un asegurado escribió a ${res.originalRecipient} y aacomsoft lo entregó automáticamente en la bandeja de ${res.deliveredTo}.`
          : `Correo de prueba de asegurado entregado en ${res.deliveredTo}. Ábrelo en "Mi Correo (Webmail)".`
      );
    } catch (err: any) {
      setErrorBanner(err.message || "Error al simular correo entrante.");
    } finally {
      setSimulatingEmail(null);
    }
  };

  const handleSuperAdminToggleModule = async () => {
    setTogglingModule(true);
    try {
      const nextVal = !data.agency.allowCorporateEmailModule;
      await toggleAgencyCorporateEmailModule(data.agency.id, nextVal);
      setData((prev: any) => ({
        ...prev,
        agency: { ...prev.agency, allowCorporateEmailModule: nextVal },
      }));
      setStatusBanner(
        nextVal
          ? `Módulo habilitado para la promotoría ${data.agency.name}.`
          : `Módulo ocultado/desactivado para la promotoría ${data.agency.name}.`
      );
      router.refresh();
    } catch (err: any) {
      setErrorBanner(err.message || "Error al cambiar visibilidad del módulo.");
    } finally {
      setTogglingModule(false);
    }
  };

  const handleDeleteForwarder = async (forwardId: string) => {
    if (!confirm("¿Eliminar esta redirección automática (Forwarder)?")) return;
    try {
      await deleteForwarderAction({ forwardId, targetAgencyId: data.agency.id });
      window.location.reload();
    } catch (err: any) {
      setErrorBanner(err.message || "No se pudo eliminar el Forwarder.");
    }
  };

  const primaryDomain =
    subscription?.domainName || data.upsellPreview?.primaryDomain || "tupromotoria.com";

  return (
    <div className="space-y-7 max-w-7xl mx-auto pb-10">
      {/* Barra Ejecutiva Super Admin: Discreta, de alto contraste y aislada por inquilino */}
      {data.currentUser?.isSuperAdmin && (
        <div className="rounded-2xl bg-[#0F172A] text-slate-200 border border-slate-800 px-4 py-3 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-sky-500/15 border border-sky-400/30 text-sky-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-widest text-sky-400">
                  Consola Multi-Inquilino Super Admin
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold border ${
                    data.agency.allowCorporateEmailModule
                      ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-300"
                      : "border-amber-400/30 bg-amber-500/15 text-amber-300"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      data.agency.allowCorporateEmailModule ? "bg-emerald-400" : "bg-amber-400"
                    }`}
                  />
                  {data.agency.allowCorporateEmailModule
                    ? "Módulo Activo en Agencia"
                    : "Módulo Oculto en Agencia"}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Aislamiento estricto activo: inspeccionando exclusivamente la promotoría{" "}
                <strong className="text-white font-semibold">{data.agency.name}</strong>.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 rounded-xl px-2.5 py-1">
              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={data.agency.id}
                onChange={(e) => {
                  window.location.href = `/correos-corporativos?agencyId=${encodeURIComponent(
                    e.target.value
                  )}`;
                }}
                className="h-7 bg-transparent text-xs font-semibold text-slate-100 focus:outline-none pr-2"
              >
                {(data.agenciesList || []).map((ag: any) => (
                  <option key={ag.id} value={ag.id} className="bg-slate-900 text-slate-100">
                    {ag.name} ({ag.slug}) {ag.allowCorporateEmailModule ? "✓ [Activo]" : "[Apagado]"}
                  </option>
                ))}
              </select>
            </div>

            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={runningDiag}
              onClick={async () => {
                setRunningDiag(true);
                setErrorBanner("");
                setStatusBanner("");
                try {
                  const diag = await runResellerClubAndFixieDiagnosticAction(data.agency.id);
                  if (diag.resellerClubConnected) {
                    setStatusBanner(
                      `[Diagnóstico Fixie + ResellerClub OK] Proxy Fixie: ${diag.fixieConfigured ? "ACTIVO" : "NO CONFIGURADO"} • IP Saliente detectada: ${diag.outboundIp || "N/A"} • ResellerClub API: ${diag.resellerClubMessage}`
                    );
                  } else {
                    setErrorBanner(
                      `[Diagnóstico Fixie + ResellerClub] Proxy Fixie: ${diag.fixieConfigured ? "ACTIVO" : "NO CONFIGURADO"} • IP Saliente: ${diag.outboundIp || "N/A"} • Respuesta ResellerClub: ${diag.resellerClubMessage}`
                    );
                  }
                } catch (err: any) {
                  setErrorBanner(err.message || "Error al ejecutar diagnóstico de Fixie y ResellerClub.");
                } finally {
                  setRunningDiag(false);
                }
              }}
              className="h-8 text-xs font-semibold rounded-xl border-sky-400/35 bg-sky-500/10 text-sky-300 hover:bg-sky-500/20 hover:text-sky-200"
            >
              {runningDiag ? (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : (
                <Server className="w-3.5 h-3.5 mr-1.5" />
              )}
              Probar Fixie + ResellerClub
            </Button>

            {subscription && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={async () => {
                  if (
                    !confirm(
                      "¿Reiniciar la demostración de esta promotoría a cero? Se borrarán los buzones de prueba y volverás al buscador de dominios ($0)."
                    )
                  )
                    return;
                  try {
                    await resetCorporateEmailSandboxAction(data.agency.id);
                    window.location.reload();
                  } catch (err: any) {
                    setErrorBanner(err.message || "Error al reiniciar demo.");
                  }
                }}
                className="h-8 text-xs font-semibold rounded-xl border-amber-400/35 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 hover:text-amber-200"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                Reiniciar Prueba ($0)
              </Button>
            )}

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleSuperAdminToggleModule}
              disabled={togglingModule}
              className={
                data.agency.allowCorporateEmailModule
                  ? "h-8 text-xs font-semibold rounded-xl border-slate-700 bg-slate-800/80 text-slate-300 hover:bg-rose-500/20 hover:text-rose-200 hover:border-rose-400/30"
                  : "h-8 text-xs font-semibold rounded-xl border-emerald-400/30 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25"
              }
            >
              {togglingModule ? (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : (
                <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
              )}
              {data.agency.allowCorporateEmailModule
                ? "Ocultar Módulo en Agencia"
                : "Habilitar Módulo en Agencia"}
            </Button>
          </div>
        </div>
      )}

      {/* Encabezado Ejecutivo de la Página */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 text-sky-300 text-[11px] font-bold tracking-wide uppercase">
            <Mail className="w-3.5 h-3.5 text-sky-400" />
            Infraestructura de Identidad Corporativa • aacomsoft
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Dominio Oficial y 20 Buzones Corporativos
          </h1>
          <p className="text-sm text-slate-600 max-w-2xl">
            Administra los 20 asientos institucionales de{" "}
            <strong className="text-slate-900 font-semibold">{data.agency.name}</strong>, asigna
            cuentas con 10 GB a tus agentes y protege las renovaciones con el Puente de Cartera
            automático.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Link href={`/mi-correo?agencyId=${encodeURIComponent(data.agency.id)}`}>
            <Button
              variant="outline"
              className="rounded-xl font-bold text-xs h-10 px-4 border-slate-300 bg-white text-slate-800 hover:bg-slate-50 shadow-sm"
            >
              <Mail className="w-4 h-4 mr-2 text-sky-600" />
              Abrir Mi Correo (Webmail)
            </Button>
          </Link>
          {subscription && (
            <Button
              onClick={handleOpenCreateModal}
              disabled={usedSeats >= maxSeats}
              className="rounded-xl font-bold text-xs h-10 px-4 bg-slate-900 hover:bg-slate-800 text-white shadow-sm"
            >
              <Plus className="w-4 h-4 mr-1.5 text-sky-400" />
              Asignar Nuevo Buzón ({availableSeats} libres)
            </Button>
          )}
        </div>
      </div>

      {/* Mensajes de estado */}
      {statusBanner && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 px-4 py-3 text-xs font-semibold text-emerald-900 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusBanner}</span>
          </div>
          <button
            onClick={() => setStatusBanner("")}
            className="text-emerald-700 hover:text-emerald-950 font-bold ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {errorBanner && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-900 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorBanner}</span>
          </div>
          <button
            onClick={() => setErrorBanner("")}
            className="text-rose-700 hover:text-rose-950 font-bold ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Vista 1: Sin paquete activo -> Hero Upsell + Bento Grid Arquitectónico Asimétrico */}
      {!subscription ? (
        <div className="space-y-6">
          <CorporateEmailUpsellBanner
            agencyId={data.agency.id}
            agencyName={data.agency.name}
            primaryDomain={data.upsellPreview.primaryDomain}
            domainSuggestions={data.domainSuggestions || []}
            sampleAgentEmails={data.upsellPreview.sampleAgentEmails || []}
            isSuperAdmin={data.currentUser?.isSuperAdmin}
            onActivated={() => window.location.reload()}
          />

          {/* Bento Grid Asimétrico (7 cols + 5 cols) siguiendo las reglas de taste-design */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Bento Izquierdo (7 cols): Motor Anti-Rotación y Puente de Cartera */}
            <div className="lg:col-span-7 rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-sm flex flex-col justify-between space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    Continuidad de Cartera Asegurada
                  </span>
                  <span className="text-xs font-mono font-semibold text-slate-400">
                    0 Asientos Consumidos por Ex-Agentes
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight pt-1">
                  Puente de Cartera Anti-Rotación en 1 Clic
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  En una promotoría los agentes rotan, pero los asegurados se quedan en{" "}
                  <strong className="text-slate-900">{data.agency.name}</strong>. Cuando un agente
                  causa baja, recuperas su asiento pagado al instante y creamos un alias permanente
                  gratuito para que ninguna renovación o siniestro se pierda.
                </p>
              </div>

              {/* Diagrama interactivo de 3 etapas del Puente de Cartera */}
              <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-4 space-y-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Flujo automatizado al dar de baja a un agente
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-stretch">
                  <div className="rounded-xl bg-white border border-slate-200 p-3 flex flex-col justify-between">
                    <span className="text-[10px] font-bold uppercase text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded self-start">
                      1. Baja de Agente
                    </span>
                    <div className="mt-2">
                      <div className="text-xs font-bold text-slate-900">Se libera el lugar</div>
                      <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                        18/20 <ArrowRight className="inline w-3 h-3 text-emerald-600" />{" "}
                        <strong className="text-emerald-700">17/20 usados</strong>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl bg-white border border-slate-200 p-3 flex flex-col justify-between">
                    <span className="text-[10px] font-bold uppercase text-sky-700 bg-sky-50 border border-sky-100 px-2 py-0.5 rounded self-start">
                      2. Respaldo Total
                    </span>
                    <div className="mt-2">
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1">
                        <FolderArchive className="w-3.5 h-3.5 text-sky-600" /> Cartera Heredada
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Historial copiado al nuevo responsable
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl bg-emerald-950 text-white border border-emerald-800 p-3 flex flex-col justify-between">
                    <span className="text-[10px] font-bold uppercase text-emerald-300 bg-emerald-500/20 border border-emerald-400/30 px-2 py-0.5 rounded self-start">
                      3. Forwarder Gratis
                    </span>
                    <div className="mt-2">
                      <div className="text-xs font-bold text-white">Redirección 24/7</div>
                      <div className="text-[11px] font-mono text-emerald-300 truncate mt-0.5">
                        ex.agente@{primaryDomain}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bento Derecho (5 cols): Infraestructura DNS Zero-Touch + Móvil */}
            <div className="lg:col-span-5 rounded-3xl border border-slate-200/90 bg-gradient-to-b from-slate-900 to-slate-950 text-white p-6 sm:p-7 shadow-sm flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-sky-300 bg-sky-500/15 border border-sky-400/30 px-3 py-1 rounded-full">
                  <Server className="w-3.5 h-3.5" />
                  Arquitectura Zero-Touch + Móvil
                </span>
                <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                  Entregabilidad Blindada y Acceso sin Contraseñas
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Configuramos automáticamente la zona DNS de{" "}
                  <span className="font-mono text-sky-300 font-semibold">{primaryDomain}</span> y
                  conectamos cada buzón con <strong className="text-white">app.aacomsoft.com</strong>{" "}
                  para despachar pólizas en 1 clic.
                </p>
              </div>

              <div className="space-y-2.5">
                <div className="rounded-2xl bg-white/[0.05] border border-white/10 p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-sky-500/15 text-sky-300">
                      <Globe className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">
                        Registros MX, SPF, DKIM y DMARC
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Inyección DNS automática anti-spam
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-400/30 px-2 py-0.5 rounded-md">
                    ACTIVO
                  </span>
                </div>

                <div className="rounded-2xl bg-white/[0.05] border border-white/10 p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-300">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">
                        Perfil .mobileconfig iOS y Android
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Sincronización nativa en Apple Mail y Gmail
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-sky-300 bg-sky-500/15 border border-sky-400/30 px-2 py-0.5 rounded-md">
                    1 CLIC
                  </span>
                </div>

                <div className="rounded-2xl bg-white/[0.05] border border-white/10 p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-sky-500/15 text-sky-300">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">
                        Revocación Instantánea de Seguridad
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Bloqueo de buzón en 1 clic ante extravío de celular
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-300 bg-white/10 px-2 py-0.5 rounded-md">
                    AES-256
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Vista 2: Suscripción Activa -> Consola Ejecutiva de 20 Asientos */
        <>
          {/* 5.1. Telemetría de Capacidad (Control de los 20 lugares) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <Card className="lg:col-span-8 rounded-3xl border-slate-200/90 bg-white shadow-sm overflow-hidden">
              <CardContent className="p-6 sm:p-7">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-widest text-sky-700">
                      Capacidad de Bolsa Corporativa (Titan Email 10 GB)
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 tabular-nums">
                      {usedSeats} / {maxSeats} Buzones asignados{" "}
                      <span className="text-sm sm:text-base font-bold text-emerald-600">
                        ({availableSeats} lugares disponibles)
                      </span>
                    </div>
                  </div>
                  <Badge className="bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-xs px-3 py-1 self-start">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                    Suscripción Activa ($999 MXN/mes)
                  </Badge>
                </div>

                {/* Barra visual de asientos */}
                <div className="w-full h-3.5 bg-slate-100 border border-slate-200/70 rounded-full overflow-hidden mb-3.5">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      seatUsagePercent >= 90 ? "bg-amber-500" : "bg-sky-600"
                    }`}
                    style={{ width: `${Math.max(4, seatUsagePercent)}%` }}
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                  <span>
                    Cada buzón incluye <strong className="text-slate-900">10 GB</strong> dedicados •
                    Los Puentes de Cartera (
                    <strong className="text-emerald-700">{forwards.length} activos</strong>) son
                    gratuitos y no consumen asiento.
                  </span>
                  <span className="font-semibold text-slate-800 tabular-nums">
                    Renovación:{" "}
                    {new Date(subscription.renewsAt).toLocaleDateString("es-MX", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Tarjeta de Dominio y Salud DNS */}
            <Card className="lg:col-span-4 rounded-3xl border-slate-800 bg-[#0B1120] text-white shadow-sm">
              <CardContent className="p-6 sm:p-7 flex flex-col justify-between h-full space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                      Dominio Oficial
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      DNS Verificado
                    </span>
                  </div>
                  <div className="text-lg sm:text-xl font-mono font-bold text-sky-300 mt-1.5 break-all">
                    {subscription.domainName}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-3.5">
                    {["MX Titan", "SPF", "DKIM", "DMARC"].map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/[0.06] text-slate-200 border border-white/10"
                      >
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" /> {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                  <span className="text-slate-400">
                    Orden: <code className="font-mono text-slate-200">{subscription.titanOrderId}</code>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowDnsDetails(!showDnsDetails)}
                    className="text-sky-400 hover:text-sky-300 underline font-semibold"
                  >
                    {showDnsDetails ? "Ocultar DNS" : "Ver zona DNS"}
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detalle de Registros DNS Inyectados Automáticamente */}
          {showDnsDetails && (
            <Card className="rounded-3xl border-slate-800 bg-slate-950 text-slate-100 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-sky-300">
                  <Server className="w-4 h-4" />
                  Zona DNS Inyectada Automáticamente en {subscription.domainName}
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Configuración Zero-Touch vía API para máxima entregabilidad en bandeja principal
                  de asegurados.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400">
                        <th className="py-2 pr-4">Tipo</th>
                        <th className="py-2 pr-4">Host</th>
                        <th className="py-2 pr-4">Valor</th>
                        <th className="py-2 pr-4">Prioridad</th>
                        <th className="py-2">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {((subscription.dnsRecordsJson as any[]) || []).map(
                        (rec: any, index: number) => (
                          <tr key={index} className="border-b border-slate-900">
                            <td className="py-2 pr-4 text-sky-400 font-bold">{rec.type}</td>
                            <td className="py-2 pr-4">{rec.host}</td>
                            <td className="py-2 pr-4 max-w-md truncate text-slate-300">
                              {rec.value}
                            </td>
                            <td className="py-2 pr-4">{rec.priority ?? "—"}</td>
                            <td className="py-2 text-emerald-400 font-sans font-bold">
                              ✓ Verificado
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 5.2. Tabla Ejecutiva de Buzones Activos */}
          <Card className="rounded-3xl border-slate-200/90 shadow-sm overflow-hidden bg-white">
            <CardHeader className="bg-slate-50/80 border-b border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-5">
              <div>
                <CardTitle className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-sky-600" />
                  Buzones Corporativos Asignados ({usedSeats} / {maxSeats})
                </CardTitle>
                <CardDescription className="text-xs text-slate-600 mt-0.5">
                  Vinculados al login de aacomsoft con credenciales IMAP/SMTP cifradas en bóveda
                  AES-256-GCM.
                </CardDescription>
              </div>
              <Button
                size="sm"
                onClick={handleOpenCreateModal}
                disabled={usedSeats >= maxSeats}
                className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs h-9 px-3.5"
              >
                <Plus className="w-3.5 h-3.5 mr-1.5 text-sky-400" />
                Crear Buzón
              </Button>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3.5 px-6">Buzón Corporativo</th>
                      <th className="py-3.5 px-4">Agente / Titular en aacomsoft</th>
                      <th className="py-3.5 px-4">Almacenamiento (10 GB)</th>
                      <th className="py-3.5 px-4">Estado</th>
                      <th className="py-3.5 px-6 text-right">Acciones de Administración</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activeMailboxes.map((mbx) => {
                      const usedGb = (mbx.storageUsedMb / 1024).toFixed(2);
                      const storagePct = Math.min(
                        100,
                        Math.round((mbx.storageUsedMb / (10 * 1024)) * 100)
                      );
                      return (
                        <tr key={mbx.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-xl bg-slate-900 text-sky-300 flex items-center justify-center text-xs font-bold shrink-0">
                                {getInitials(mbx.displayName || mbx.emailAddress)}
                              </div>
                              <div>
                                <div className="font-mono font-bold text-slate-900 text-xs sm:text-sm">
                                  {mbx.emailAddress}
                                </div>
                                <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                                  <span>{mbx.displayName}</span>
                                  {mbx.isDepartmental && (
                                    <Badge
                                      variant="secondary"
                                      className="text-[10px] px-1.5 py-0 bg-slate-100 text-slate-700 border border-slate-200"
                                    >
                                      Institucional
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-4">
                            {mbx.agentUser ? (
                              <div>
                                <div className="font-bold text-slate-800 text-xs">
                                  {mbx.agentUser.name}
                                </div>
                                <div className="text-[11px] text-slate-500 font-mono">
                                  {mbx.agentUser.email}
                                </div>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-500">
                                Cuenta Institucional (Acceso Admin)
                              </span>
                            )}
                          </td>

                          <td className="py-4 px-4">
                            <div className="w-36 space-y-1.5">
                              <div className="flex justify-between text-[11px] font-semibold text-slate-600 tabular-nums">
                                <span>{usedGb} GB</span>
                                <span>10 GB</span>
                              </div>
                              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-sky-600 rounded-full"
                                  style={{ width: `${Math.max(4, storagePct)}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-4">
                            {mbx.status === "active" ? (
                              <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                                Activo
                              </Badge>
                            ) : (
                              <Badge className="bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold">
                                Suspendido
                              </Badge>
                            )}
                          </td>

                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              <Link
                                href={`/mi-correo?mailboxId=${encodeURIComponent(
                                  mbx.id
                                )}&agencyId=${encodeURIComponent(data.agency.id)}`}
                              >
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 text-xs font-semibold rounded-lg border-slate-200 text-slate-700 hover:bg-slate-50"
                                  title="Abrir bandeja de este buzón en Mi Correo"
                                >
                                  <Mail className="w-3.5 h-3.5 mr-1 text-sky-600" />
                                  Bandeja
                                </Button>
                              </Link>

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSimulateClientEmail(mbx.emailAddress)}
                                disabled={simulatingEmail === mbx.emailAddress}
                                className="h-8 text-xs font-semibold rounded-lg border-slate-200 text-slate-700 hover:bg-slate-50"
                                title="Simular correo entrante de un asegurado a este buzón"
                              >
                                {simulatingEmail === mbx.emailAddress ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Send className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                                )}
                                Probar Recepción
                              </Button>

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleSuspend(mbx)}
                                disabled={togglingMailboxId === mbx.id}
                                className={`h-8 text-xs font-semibold rounded-lg ${
                                  mbx.status === "active"
                                    ? "border-amber-200 text-amber-700 hover:bg-amber-50"
                                    : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                }`}
                                title={
                                  mbx.status === "active"
                                    ? "Revocar/Bloquear acceso inmediatamente en 1 clic (ej. robo de celular)"
                                    : "Reactivar acceso al buzón"
                                }
                              >
                                {mbx.status === "active" ? (
                                  <>
                                    <Lock className="w-3.5 h-3.5 mr-1" /> Bloquear
                                  </>
                                ) : (
                                  <>
                                    <Unlock className="w-3.5 h-3.5 mr-1" /> Reactivar
                                  </>
                                )}
                              </Button>

                              {activeMailboxes.length > 1 && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOpenReleaseModal(mbx)}
                                  className="h-8 text-xs font-bold rounded-lg border-rose-200 bg-rose-50/60 text-rose-700 hover:bg-rose-100"
                                  title="Dar de baja buzón de agente, liberar lugar (18/20 -> 17/20) y activar Puente de Cartera"
                                >
                                  <UserMinus className="w-3.5 h-3.5 mr-1" />
                                  Dar de baja y liberar lugar
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* 5.3. Puentes de Cartera Activos (Forwarders / Alias Gratuitos de Ex-Agentes) */}
          <Card className="rounded-3xl border-emerald-200/90 bg-gradient-to-br from-white to-emerald-50/30 shadow-sm">
            <CardHeader className="pb-3 px-6 pt-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <ArrowRightLeft className="w-4 h-4 text-emerald-600" />
                    Puentes de Cartera Activos — Redirecciones de Ex-Agentes ({forwards.length})
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-600 mt-0.5">
                    Estos alias gratuitos redirigen automáticamente los correos que los asegurados
                    envíen a agentes dados de baja sin consumir ninguno de tus 20 asientos pagados.
                  </CardDescription>
                </div>
                <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold self-start">
                  0 Asientos Consumidos (Gratis)
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              {forwards.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-6 text-center text-xs text-slate-500">
                  Aún no has dado de baja ningún buzón de agente. Cuando un agente rote y uses el
                  botón <strong className="text-slate-700">&ldquo;Dar de baja y liberar lugar&rdquo;</strong>, su correo
                  aparecerá aquí redirigido automáticamente al nuevo responsable de la cartera.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {forwards.map((fwd) => (
                    <div
                      key={fwd.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-emerald-200/80 bg-white p-4 shadow-sm"
                    >
                      <div className="flex flex-wrap items-center gap-2.5">
                        <Badge
                          variant="outline"
                          className="border-rose-200 bg-rose-50 text-rose-700 font-mono text-xs"
                        >
                          {fwd.sourceEmail} (Asiento Liberado)
                        </Badge>
                        <ArrowRightLeft className="w-4 h-4 text-emerald-600 shrink-0" />
                        <Badge className="bg-emerald-600 text-white font-mono text-xs">
                          {fwd.destinationEmail}
                        </Badge>
                        <span className="text-xs text-slate-500">
                          • Ex-agente: <strong className="text-slate-800">{fwd.formerAgentName || "Agente"}</strong> (
                          {fwd.migratedMessagesCount} correos históricos respaldados)
                        </span>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSimulateClientEmail(fwd.sourceEmail)}
                          disabled={simulatingEmail === fwd.sourceEmail}
                          className="h-8 text-xs font-bold rounded-lg border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                        >
                          {simulatingEmail === fwd.sourceEmail ? (
                            <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                          ) : (
                            <Send className="w-3.5 h-3.5 mr-1" />
                          )}
                          Simular Asegurado Escribiendo al Ex-Agente
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteForwarder(fwd.id)}
                          className="h-8 text-xs text-slate-400 hover:text-rose-600"
                          title="Eliminar redirección"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Modal: Crear Nuevo Buzón Corporativo */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleCreateMailbox}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-sky-600" />
                Crear Buzón Corporativo (10 GB)
              </DialogTitle>
              <DialogDescription>
                Asigna uno de tus {availableSeats} lugares disponibles a un agente de{" "}
                <strong>{data.agency.name}</strong> o crea un buzón institucional.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setMailboxType("AGENT");
                    if (unassignedAgents[0]) {
                      handleAgentSelectionChange(unassignedAgents[0].id);
                    }
                  }}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    mailboxType === "AGENT"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Para Agente / Usuario
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMailboxType("DEPARTMENTAL");
                    setSelectedAgentId("");
                    setLocalPart("siniestros");
                    setDisplayName(`Siniestros ${data.agency.name}`);
                  }}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    mailboxType === "DEPARTMENTAL"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Buzón Institucional
                </button>
              </div>

              {mailboxType === "AGENT" && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">
                    Selecciona al Agente de aacomsoft
                  </Label>
                  <select
                    value={selectedAgentId}
                    onChange={(e) => handleAgentSelectionChange(e.target.value)}
                    required
                    className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800"
                  >
                    <option value="" disabled>
                      -- Selecciona un agente --
                    </option>
                    {agencyUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.email}) — {u.role}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Dirección de Correo Oficial</Label>
                <div className="flex items-center gap-1.5">
                  <Input
                    value={localPart}
                    onChange={(e) =>
                      setLocalPart(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ""))
                    }
                    placeholder="carlos.ramirez"
                    required
                    className="font-mono text-xs"
                  />
                  <span className="text-xs font-mono font-bold bg-slate-100 border border-slate-200 px-3 py-2.5 rounded-xl text-slate-700 shrink-0">
                    @{subscription?.domainName}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Nombre Visible en el Remitente</Label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Ej. Carlos Ramírez | Asesor Patrimonial"
                  required
                  className="text-xs"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setCreateOpen(false)}
                disabled={creatingMailbox}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={creatingMailbox}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold"
              >
                {creatingMailbox && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Crear Buzón y Vincular a aacomsoft
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal 5.3: Flujo Especial de Rotación ("Baja, Liberación de Asiento y Puente de Cartera") */}
      <Dialog
        open={Boolean(releaseModalMailbox)}
        onOpenChange={(open) => !open && setReleaseModalMailbox(null)}
      >
        <DialogContent className="sm:max-w-[540px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-700">
              <UserMinus className="w-5 h-5" />
              Dar de baja buzón de agente y liberar lugar
            </DialogTitle>
            <DialogDescription>
              Recicla este asiento inmediatamente y activa el{" "}
              <strong>Puente de Cartera (Forwarder Gratuito)</strong> para no perder ningún correo
              de tus asegurados.
            </DialogDescription>
          </DialogHeader>

          {releaseModalMailbox && (
            <div className="space-y-4 py-3">
              {/* Advertencia clara */}
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900 space-y-1">
                <div className="font-black flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  1. Liberación inmediata de asiento ({usedSeats}/{maxSeats} ➔{" "}
                  {Math.max(0, usedSeats - 1)}/{maxSeats})
                </div>
                <p>
                  El buzón <code>{releaseModalMailbox.emailAddress}</code> se eliminará en Titan
                  Email y tu contador regresará inmediatamente a{" "}
                  <strong>
                    {Math.max(0, usedSeats - 1)}/{maxSeats}
                  </strong>{" "}
                  para que puedas asignarlo a un nuevo agente sin costo extra.
                </p>
              </div>

              {/* Puente de Cartera */}
              <div className="space-y-2">
                <Label className="text-xs font-black text-slate-800">
                  2. Puente de Cartera: ¿A quién deseas redirigir automáticamente los correos
                  futuros que los clientes envíen a{" "}
                  <code className="text-rose-600">{releaseModalMailbox.emailAddress}</code>?
                </Label>
                <select
                  value={destinationMailboxId}
                  onChange={(e) => setDestinationMailboxId(e.target.value)}
                  className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-800"
                >
                  {activeMailboxes
                    .filter((m) => m.id !== releaseModalMailbox.id && m.status === "active")
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.emailAddress} — {m.displayName}
                      </option>
                    ))}
                </select>
                <p className="text-[11px] text-emerald-700 font-medium">
                  ✓ Este Forwarder / Alias es 100% gratuito y NO consume ninguno de tus 20 asientos
                  pagados.
                </p>
              </div>

              {/* Opción de migrar correos existentes */}
              <div className="flex items-center justify-between rounded-xl border border-sky-200 bg-sky-50/50 p-3.5">
                <div className="space-y-0.5 pr-3">
                  <div className="text-xs font-bold text-sky-950">
                    Respaldar y copiar correos existentes antes de eliminar el buzón
                  </div>
                  <div className="text-[11px] text-sky-800">
                    Copia automáticamente los correos actuales de{" "}
                    <code>{releaseModalMailbox.emailAddress}</code> a la carpeta{" "}
                    <strong>&ldquo;Cartera Heredada&rdquo;</strong> del buzón destino.
                  </div>
                </div>
                <Switch checked={migrateEmails} onCheckedChange={setMigrateEmails} />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setReleaseModalMailbox(null)}
              disabled={releasingSeat}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleConfirmReleaseAndForward}
              disabled={releasingSeat || !destinationMailboxId}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
            >
              {releasingSeat && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Liberar Asiento y Activar Puente de Cartera
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
