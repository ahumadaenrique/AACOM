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
  HardDrive,
  Globe,
  Building2,
  Sparkles,
  Trash2,
  Send,
  Smartphone,
  ExternalLink,
  Loader2,
  Server,
  UserMinus,
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
  simulateIncomingClientEmailAction,
  toggleMailboxSuspensionAction,
} from "./actions";
import { toggleAgencyCorporateEmailModule } from "@/app/(dashboard)/agencias/actions";

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
        `✓ Buzón ${res.mailbox.emailAddress} creado y aprovisionado con 10 GB en Titan Email.`
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
          ? `🔒 Acceso revocado/suspendido en 1 clic para ${mailbox.emailAddress}.`
          : `🔓 Acceso reactivado para ${mailbox.emailAddress}.`
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
        `✓ Asiento liberado (${usedSeats}/${maxSeats} ➔ ${usedSeats - 1}/${maxSeats}). Puente de Cartera activo: ${res.forward.sourceEmail} ➔ ${res.forward.destinationEmail} (${res.migratedCount} correos históricos respaldados).`
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
          ? `📨 ¡Prueba de Puente de Cartera exitosa! Un asegurado escribió a ${res.originalRecipient} y Titan/aacomsoft lo entregó automáticamente en la bandeja de ${res.deliveredTo}.`
          : `📨 Correo de prueba de asegurado entregado en ${res.deliveredTo}. Ábrelo en "📧 Mi Correo".`
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
          ? `✓ Módulo habilitado para la promotoría ${data.agency.name}.`
          : `⚠️ Módulo ocultado/desactivado para la promotoría ${data.agency.name}.`
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Barra Exclusiva Super Admin: Selector Aislado por Agencia + Interruptor Maestro */}
      {data.currentUser?.isSuperAdmin && (
        <div className="rounded-2xl border border-rose-200 bg-gradient-to-r from-rose-50 via-white to-sky-50 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-600 text-white shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-rose-700">
                  Control Maestro Super Admin
                </span>
                <Badge
                  variant="outline"
                  className={
                    data.agency.allowCorporateEmailModule
                      ? "border-emerald-300 bg-emerald-50 text-emerald-700 font-bold text-[10px]"
                      : "border-amber-300 bg-amber-50 text-amber-800 font-bold text-[10px]"
                  }
                >
                  {data.agency.allowCorporateEmailModule
                    ? "Módulo Visible para esta Agencia"
                    : "Módulo Oculto para esta Agencia"}
                </Badge>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Aislamiento Multi-Inquilino activo: Estás inspeccionando únicamente la promotoría{" "}
                <strong>{data.agency.name}</strong>.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-500" />
              <select
                value={data.agency.id}
                onChange={(e) => {
                  window.location.href = `/correos-corporativos?agencyId=${encodeURIComponent(
                    e.target.value
                  )}`;
                }}
                className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-800 shadow-sm"
              >
                {(data.agenciesList || []).map((ag: any) => (
                  <option key={ag.id} value={ag.id}>
                    {ag.name} ({ag.slug}) {ag.allowCorporateEmailModule ? "✓ [Activo]" : "[Apagado]"}
                  </option>
                ))}
              </select>
            </div>

            <Button
              type="button"
              size="sm"
              variant={data.agency.allowCorporateEmailModule ? "outline" : "default"}
              onClick={handleSuperAdminToggleModule}
              disabled={togglingModule}
              className={
                data.agency.allowCorporateEmailModule
                  ? "h-9 text-xs font-bold border-rose-300 text-rose-700 hover:bg-rose-50"
                  : "h-9 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
              }
            >
              {togglingModule ? (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : (
                <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
              )}
              {data.agency.allowCorporateEmailModule
                ? "Desactivar Módulo en esta Agencia"
                : "Activar Módulo en esta Agencia"}
            </Button>
          </div>
        </div>
      )}

      {/* Encabezado Principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-100 text-sky-800 text-xs font-bold mb-2">
            <Mail className="w-3.5 h-3.5" /> Identidad Corporativa Promotoría aacomsoft
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            Dominio Oficial y 20 Buzones Corporativos
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Administra los 20 asientos de correo de <strong>{data.agency.name}</strong>, asigna
            cuentas a tus agentes y recicla lugares con redirección automática de cartera.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href={`/mi-correo?agencyId=${encodeURIComponent(data.agency.id)}`}>
            <Button variant="outline" className="rounded-xl font-bold text-xs h-10 border-sky-200 text-sky-700 hover:bg-sky-50">
              <Mail className="w-4 h-4 mr-1.5" />
              Ir a 📧 Mi Correo (Webmail)
            </Button>
          </Link>
          {subscription && (
            <Button
              onClick={handleOpenCreateModal}
              disabled={usedSeats >= maxSeats}
              className="rounded-xl font-bold text-xs h-10 bg-sky-600 hover:bg-sky-700 text-white shadow-sm"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Asignar Nuevo Buzón ({availableSeats} libres)
            </Button>
          )}
        </div>
      </div>

      {/* Mensajes de estado */}
      {statusBanner && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800 flex items-center justify-between">
          <span>{statusBanner}</span>
          <button
            onClick={() => setStatusBanner("")}
            className="text-emerald-600 hover:text-emerald-900 font-black ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {errorBanner && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-800 flex items-center justify-between">
          <span>⚠️ {errorBanner}</span>
          <button
            onClick={() => setErrorBanner("")}
            className="text-red-600 hover:text-red-900 font-black ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Vista 1: Si aún no tiene paquete contratado -> Mostrar Banner Inteligente de Upsell */}
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="rounded-2xl border-slate-200 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-black flex items-center gap-2 text-slate-800">
                  <Globe className="w-4 h-4 text-sky-600" />
                  1. Dominio Oficial Zero-Touch
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-slate-600 leading-relaxed">
                Registramos tu dominio <code>.com</code>, <code>.com.mx</code> o <code>.mx</code>{" "}
                y configuramos automáticamente los registros <strong>MX, SPF, DKIM y DMARC</strong>{" "}
                para que las pólizas lleguen siempre a la bandeja principal de tus asegurados.
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-200 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-black flex items-center gap-2 text-slate-800">
                  <Smartphone className="w-4 h-4 text-indigo-600" />
                  2. Integrado en aacomsoft + Móvil
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-slate-600 leading-relaxed">
                Tus agentes entran desde <strong>app.aacomsoft.com</strong> sin recordar otra
                contraseña, envían pólizas desde su cartera en 1 clic y pueden instalar su perfil{" "}
                <code>.mobileconfig</code> en iPhone o Android.
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-200 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-black flex items-center gap-2 text-slate-800">
                  <ArrowRightLeft className="w-4 h-4 text-emerald-600" />
                  3. Puente de Cartera Anti-Rotación
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-slate-600 leading-relaxed">
                Si un agente causa baja, liberas su asiento de inmediato (ej. de <code>18/20</code>{" "}
                a <code>17/20</code>) y creamos un <strong>Forwarder gratuito</strong> hacia el
                nuevo agente sin perder renovaciones ni siniestros.
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        /* Vista 2: Suscripción Activa -> Dashboard de 20 Asientos, Gestión de Buzones y Flujo de Rotación */
        <>
          {/* 5.1. Dashboard de Capacidad (Control de los 20 lugares) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2 rounded-2xl border-sky-200 bg-gradient-to-br from-white to-sky-50/40 shadow-sm">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-sky-700">
                      Capacidad de Bolsa Corporativa (Titan Email 10 GB)
                    </div>
                    <div className="text-2xl md:text-3xl font-black text-slate-900 mt-1">
                      {usedSeats} / {maxSeats} Buzones asignados{" "}
                      <span className="text-base font-bold text-emerald-600">
                        ({availableSeats} lugares disponibles)
                      </span>
                    </div>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs px-3 py-1 self-start">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                    Suscripción Activa ($999 MXN/mes)
                  </Badge>
                </div>

                {/* Barra visual de asientos */}
                <div className="w-full h-3.5 bg-slate-200 rounded-full overflow-hidden mb-3">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      seatUsagePercent >= 90
                        ? "bg-amber-500"
                        : "bg-gradient-to-r from-sky-500 to-indigo-600"
                    }`}
                    style={{ width: `${Math.max(4, seatUsagePercent)}%` }}
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                  <span>
                    Cada buzón incluye <strong>10 GB</strong> dedicados • Los Puentes de Cartera (
                    <strong>{forwards.length} activos</strong>) son gratuitos y no consumen
                    asiento.
                  </span>
                  <span className="font-semibold text-slate-800">
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
            <Card className="rounded-2xl border-slate-200 shadow-sm">
              <CardContent className="p-6 flex flex-col justify-between h-full space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Dominio Oficial
                    </span>
                    <Badge
                      variant="outline"
                      className="border-sky-300 bg-sky-50 text-sky-800 text-[10px] font-bold"
                    >
                      DNS Zero-Touch Activo
                    </Badge>
                  </div>
                  <div className="text-xl font-mono font-black text-slate-900 mt-1 break-all">
                    {subscription.domainName}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {["MX Titan", "SPF", "DKIM", "DMARC"].map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200"
                      >
                        <CheckCircle2 className="w-3 h-3" /> {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    Orden: <code className="font-mono">{subscription.titanOrderId}</code>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowDnsDetails(!showDnsDetails)}
                    className="text-sky-600 hover:underline font-bold"
                  >
                    {showDnsDetails ? "Ocultar DNS" : "Ver zona DNS"}
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detalle de Registros DNS Inyectados Automáticamente */}
          {showDnsDetails && (
            <Card className="rounded-2xl border-sky-200 bg-slate-950 text-slate-100 shadow-md">
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

          {/* 5.2. Tabla de Buzones Activos y Gestión de Asientos */}
          <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/70 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-black text-slate-800 flex items-center gap-2">
                  <Users className="w-4 h-4 text-sky-600" />
                  Buzones Corporativos Asignados ({usedSeats} / {maxSeats})
                </CardTitle>
                <CardDescription className="text-xs">
                  Vinculados al login de aacomsoft con credenciales IMAP/SMTP cifradas en bóveda
                  AES-256-GCM.
                </CardDescription>
              </div>
              <Button
                size="sm"
                onClick={handleOpenCreateModal}
                disabled={usedSeats >= maxSeats}
                className="rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs"
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Crear Buzón
              </Button>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100 text-left text-xs font-bold text-slate-500 uppercase">
                      <th className="py-3.5 px-4">Buzón Corporativo</th>
                      <th className="py-3.5 px-4">Agente / Titular en aacomsoft</th>
                      <th className="py-3.5 px-4">Almacenamiento (10 GB)</th>
                      <th className="py-3.5 px-4">Estado</th>
                      <th className="py-3.5 px-4 text-right">Acciones de Administración</th>
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
                        <tr key={mbx.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-mono font-bold text-slate-900 text-xs sm:text-sm">
                              {mbx.emailAddress}
                            </div>
                            <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                              <span>{mbx.displayName}</span>
                              {mbx.isDepartmental && (
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] px-1.5 py-0 bg-indigo-50 text-indigo-700"
                                >
                                  Departamental
                                </Badge>
                              )}
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            {mbx.agentUser ? (
                              <div>
                                <div className="font-bold text-slate-800 text-xs">
                                  {mbx.agentUser.name}
                                </div>
                                <div className="text-[11px] text-slate-500">
                                  Login: {mbx.agentUser.email}
                                </div>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-500 italic">
                                Buzón Institucional (Acceso Admin)
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="w-36 space-y-1">
                              <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                                <span>{usedGb} GB</span>
                                <span>10 GB</span>
                              </div>
                              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-sky-500 rounded-full"
                                  style={{ width: `${Math.max(4, storagePct)}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
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

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              <Link
                                href={`/mi-correo?mailboxId=${encodeURIComponent(
                                  mbx.id
                                )}&agencyId=${encodeURIComponent(data.agency.id)}`}
                              >
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 text-xs font-semibold border-sky-200 text-sky-700 hover:bg-sky-50"
                                  title="Abrir bandeja de este buzón en Mi Correo"
                                >
                                  <Mail className="w-3.5 h-3.5 mr-1" />
                                  Bandeja
                                </Button>
                              </Link>

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSimulateClientEmail(mbx.emailAddress)}
                                disabled={simulatingEmail === mbx.emailAddress}
                                className="h-8 text-xs font-semibold border-slate-200 text-slate-700"
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
                                className={`h-8 text-xs font-semibold ${
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
                                  className="h-8 text-xs font-bold border-rose-200 bg-rose-50/60 text-rose-700 hover:bg-rose-100"
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
          <Card className="rounded-2xl border-emerald-200 bg-gradient-to-br from-white to-emerald-50/30 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base font-black text-slate-800 flex items-center gap-2">
                    <ArrowRightLeft className="w-4 h-4 text-emerald-600" />
                    Puentes de Cartera Activos — Redirecciones de Ex-Agentes ({forwards.length})
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Estos alias gratuitos redirigen automáticamente los correos que los asegurados
                    envíen a agentes dados de baja sin consumir ninguno de tus 20 asientos pagados.
                  </CardDescription>
                </div>
                <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold self-start">
                  0 Asientos Consumidos (Gratis)
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {forwards.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-500">
                  Aún no has dado de baja ningún buzón de agente. Cuando un agente rote y uses el
                  botón <strong>&ldquo;Dar de baja y liberar lugar&rdquo;</strong>, su correo
                  aparecerá aquí redirigido automáticamente al nuevo responsable de la cartera.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {forwards.map((fwd) => (
                    <div
                      key={fwd.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-emerald-200/80 bg-white p-3.5 shadow-sm"
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
                          • Ex-agente: <strong>{fwd.formerAgentName || "Agente"}</strong> (
                          {fwd.migratedMessagesCount} correos históricos respaldados)
                        </span>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSimulateClientEmail(fwd.sourceEmail)}
                          disabled={simulatingEmail === fwd.sourceEmail}
                          className="h-8 text-xs font-bold border-emerald-300 text-emerald-700 hover:bg-emerald-50"
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
                          className="h-8 text-xs text-slate-400 hover:text-red-600"
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
                      ? "bg-white text-sky-700 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  👤 Para Agente / Usuario
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
                      ? "bg-white text-sky-700 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  🏢 Buzón Institucional
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
                className="bg-sky-600 hover:bg-sky-700 text-white font-bold"
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
