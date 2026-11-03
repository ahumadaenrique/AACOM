"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Mail,
  CheckCircle2,
  HardDrive,
  ShieldCheck,
  Globe,
  ExternalLink,
  Loader2,
  Sparkles,
  Server,
  Smartphone,
  AlertTriangle,
  Plus,
  RefreshCw,
} from "lucide-react";
import { updateCorporateMailboxesConfig } from "./actions";
import Link from "next/link";

const PACKAGES = [
  { count: 1, name: "Individual", priceMxn: 999, monthlyEq: 83, idealFor: "Agente Titular (contacto@)" },
  { count: 2, name: "Dúo", priceMxn: 1799, monthlyEq: 150, idealFor: "Agente + Asistente" },
  { count: 3, name: "Despacho 3", priceMxn: 2499, monthlyEq: 208, idealFor: "Titular + Asistente + Cobranza" },
  { count: 4, name: "Despacho 4", priceMxn: 3199, monthlyEq: 266, idealFor: "+ Área de Siniestros" },
  { count: 5, name: "Despacho Full", priceMxn: 3799, monthlyEq: 316, idealFor: "Equipo Operativo Completo (5 cuentas)" },
];

const DEFAULT_ROLES = [
  { prefix: "contacto", roleLabel: "Agente Titular" },
  { prefix: "asistente", roleLabel: "Asistente / Atención" },
  { prefix: "siniestros", roleLabel: "Cabina / Siniestros" },
  { prefix: "cobranza", roleLabel: "Renovaciones y Cobranza" },
  { prefix: "operaciones", roleLabel: "Emisión y Operaciones" },
];

interface CorporateEmailClientProps {
  agencyName: string;
  agencySlug: string;
  isSaasActive: boolean;
  corporateEmailActive: boolean;
  corporateEmailDomain: string | null;
  corporateEmailMailboxesCount: number;
  corporateEmailMailboxesJson: string | null;
  corporateEmailEndDate: string | null;
}

export default function CorporateEmailClient({
  agencyName,
  agencySlug,
  isSaasActive,
  corporateEmailActive,
  corporateEmailDomain,
  corporateEmailMailboxesCount,
  corporateEmailMailboxesJson,
  corporateEmailEndDate,
}: CorporateEmailClientProps) {
  const parsedExisting = (() => {
    try {
      if (corporateEmailMailboxesJson) {
        const arr = JSON.parse(corporateEmailMailboxesJson);
        if (Array.isArray(arr) && arr.length > 0) return arr;
      }
    } catch {}
    return DEFAULT_ROLES.slice(0, Math.max(1, corporateEmailMailboxesCount || 1)).map((r) => ({
      prefix: r.prefix,
      roleLabel: r.roleLabel,
      quotaGb: 10,
    }));
  })();

  const [selectedCount, setSelectedCount] = useState<number>(
    corporateEmailMailboxesCount >= 1 && corporateEmailMailboxesCount <= 5
      ? corporateEmailMailboxesCount
      : 1
  );
  const [domain, setDomain] = useState<string>(
    corporateEmailDomain || `${agencySlug || "midespacho"}.com`
  );
  const [mailboxes, setMailboxes] = useState<Array<{ prefix: string; roleLabel: string; quotaGb: number }>>(() => {
    const base = [...parsedExisting];
    while (base.length < 5) {
      const def = DEFAULT_ROLES[base.length] || { prefix: `cuenta${base.length + 1}`, roleLabel: "Buzón Adicional" };
      base.push({ prefix: def.prefix, roleLabel: def.roleLabel, quotaGb: 10 });
    }
    return base;
  });

  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const activePackage = PACKAGES.find((p) => p.count === selectedCount) || PACKAGES[0];
  const emailEndDateObj = corporateEmailEndDate ? new Date(corporateEmailEndDate) : null;
  const isEmailSubscriptionValid =
    corporateEmailActive && (!emailEndDateObj || emailEndDateObj.getTime() >= Date.now());

  const handleMailboxChange = (index: number, field: "prefix" | "roleLabel", value: string) => {
    setMailboxes((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        [field]: field === "prefix" ? value.toLowerCase().replace(/[^a-z0-9._-]/g, "") : value,
      };
      return copy;
    });
  };

  const handleSaveBoxesOnly = async () => {
    setMessage(null);
    setSavingConfig(true);
    try {
      const res = await updateCorporateMailboxesConfig({
        domain,
        mailboxes: mailboxes.slice(0, selectedCount),
      });
      if (res.success) {
        setMessage({ type: "success", text: "Configuración de buzones actualizada correctamente." });
      } else {
        setMessage({ type: "error", text: res.message || "Error al guardar." });
      }
    } catch (e: any) {
      setMessage({ type: "error", text: e.message || "Error inesperado." });
    } finally {
      setSavingConfig(false);
    }
  };

  const handleSubscribeEmail = async () => {
    setMessage(null);
    setLoadingCheckout(true);
    try {
      const response = await fetch("/api/checkout/corporate-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mailboxesCount: selectedCount,
          requestedDomain: domain,
          mailboxes: mailboxes.slice(0, selectedCount),
        }),
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setMessage({ type: "error", text: data.error || "No se pudo iniciar el proceso de pago." });
      }
    } catch (e: any) {
      setMessage({ type: "error", text: "Error de conexión con la pasarela de pagos." });
    } finally {
      setLoadingCheckout(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Banner si el SaaS está pausado pero el Correo Corporativo Anual sigue vigente */}
      {!isSaasActive && isEmailSubscriptionValid && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-extrabold text-amber-950 text-base">
                Tu Correo Corporativo sigue 100% Activo (Anualidad Cubierta)
              </h3>
              <p className="text-sm text-amber-800 mt-0.5">
                Tus buzones de 10 GB continúan operando con normalidad hasta el{" "}
                <strong>{emailEndDateObj ? emailEndDateObj.toLocaleDateString("es-MX") : "fin de tu periodo anual"}</strong>.
                Sin embargo, tu suscripción a <strong>AACOMSoft</strong> (Cartera, Portal de Clientes e IA) está pausada.
              </p>
            </div>
          </div>
          <Link href="/billing">
            <Button className="bg-amber-600 hover:bg-amber-700 text-white font-bold whitespace-nowrap">
              Reactivar AACOMSoft
            </Button>
          </Link>
        </div>
      )}

      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-teal-900 text-white p-7 rounded-3xl shadow-xl">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-bold uppercase tracking-wider">
            <Mail className="w-3.5 h-3.5" /> Correo Empresarial para Agentes de Seguros
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
            Correo Electrónico Corporativo (10 GB por Buzón)
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Proyecta máxima confianza ante tus asegurados y compañías con tu propio dominio{" "}
            <span className="text-teal-300 font-mono font-semibold">@{domain || "tudominio.com"}</span>.
            Cada buzón incluye <strong>10 GB de almacenamiento dedicado</strong>, filtro anti-spam empresarial y renovación automática anual.
          </p>
        </div>
        <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
          {isEmailSubscriptionValid ? (
            <div className="bg-emerald-500/20 border border-emerald-400/40 rounded-2xl px-5 py-3 text-right">
              <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
                <CheckCircle2 className="w-4 h-4" /> Paquete Anual Activo ({corporateEmailMailboxesCount} {corporateEmailMailboxesCount === 1 ? "Buzón" : "Buzones"})
              </div>
              {emailEndDateObj && (
                <p className="text-xs text-slate-300 mt-1">
                  Renovación automática: {emailEndDateObj.toLocaleDateString("es-MX")}
                </p>
              )}
            </div>
          ) : (
            <div className="bg-white/10 border border-white/15 rounded-2xl px-5 py-3 text-right">
              <span className="text-xs uppercase tracking-wider text-teal-300 font-bold block">Desde solo</span>
              <span className="text-3xl font-black text-white">$999 MXN</span>
              <span className="text-xs text-slate-300 block">por año (1 buzón de 10 GB)</span>
            </div>
          )}
        </div>
      </div>

      {/* Si ya tiene Correo Corporativo Activo, panel de acceso rápido a Webmail y conexión */}
      {isEmailSubscriptionValid && (
        <Card className="border-emerald-200 bg-emerald-50/30 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-emerald-600" />
                  Tus Buzones Corporativos Activos (@{corporateEmailDomain || domain})
                </CardTitle>
                <CardDescription>
                  Cada cuenta dispone de 10 GB de almacenamiento seguro para pólizas, endosos y comunicación con asegurados.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`https://webmail.${corporateEmailDomain || domain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2">
                    <ExternalLink className="w-4 h-4" /> Abrir Webmail
                  </Button>
                </a>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {mailboxes.slice(0, corporateEmailMailboxesCount || 1).map((mb, idx) => (
                <div
                  key={idx}
                  className="bg-white p-4 rounded-xl border border-emerald-200/80 flex items-center justify-between shadow-sm"
                >
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 block">
                      {mb.roleLabel || `Buzón #${idx + 1}`}
                    </span>
                    <p className="font-mono font-bold text-sm text-slate-900 mt-0.5">
                      {mb.prefix}@{corporateEmailDomain || domain}
                    </p>
                  </div>
                  <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 font-semibold">
                    <HardDrive className="w-3 h-3 mr-1 text-teal-600" /> 10 GB
                  </Badge>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-xl p-4 border border-slate-200 grid sm:grid-cols-3 gap-4 text-xs text-slate-600">
              <div className="flex items-start gap-2.5">
                <Server className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 block">Servidor Entrada (IMAP SSL)</strong>
                  <span>imap.{corporateEmailDomain || domain} • Puerto 993</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Mail className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 block">Servidor Salida (SMTP SSL)</strong>
                  <span>smtp.{corporateEmailDomain || domain} • Puerto 465 / 587</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Smartphone className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 block">Compatible con Celular y PC</strong>
                  <span>Apple Mail (iPhone), Gmail App, Outlook y Webmail.</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selector de 1 a 5 buzones anuales */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">
            1. Elige tu cantidad de buzones (de 1 a 5 cuentas de 10 GB c/u)
          </h2>
          <p className="text-sm text-slate-500">
            Ideal si trabajas solo o si tienes asistente, mesa de control, cobranza o atención a siniestros.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {PACKAGES.map((pkg) => {
            const isSelected = selectedCount === pkg.count;
            return (
              <button
                key={pkg.count}
                type="button"
                onClick={() => setSelectedCount(pkg.count)}
                className={`text-left rounded-2xl p-5 border-2 transition-all flex flex-col justify-between ${
                  isSelected
                    ? "border-teal-600 bg-teal-50/50 shadow-md ring-2 ring-teal-500/20"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-teal-700">
                      {pkg.name}
                    </span>
                    <Badge
                      variant={isSelected ? "default" : "secondary"}
                      className={isSelected ? "bg-teal-600 text-white" : ""}
                    >
                      {pkg.count} {pkg.count === 1 ? "Buzón" : "Buzones"}
                    </Badge>
                  </div>
                  <div className="mt-2">
                    <span className="text-2xl font-black text-slate-900">
                      ${pkg.priceMxn.toLocaleString("es-MX")}
                    </span>
                    <span className="text-xs text-slate-500 font-medium"> MXN / año</span>
                  </div>
                  <p className="text-[11px] text-teal-700 font-semibold mt-1">
                    Equivale a ~${pkg.monthlyEq} MXN / mes
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200/80 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5 font-medium text-slate-800">
                    <HardDrive className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span>{pkg.count * 10} GB totales (10 GB c/u)</span>
                  </div>
                  <p className="text-[11px] text-slate-500">{pkg.idealFor}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Configurador de Dominio y Nombres de Buzones */}
      <Card className="border-slate-200 shadow-md">
        <CardHeader>
          <CardTitle className="text-xl font-bold">
            2. Configura tu Dominio y tus {selectedCount} {selectedCount === 1 ? "Buzón" : "Buzones"} de 10 GB
          </CardTitle>
          <CardDescription>
            Indica el dominio que deseas usar (nuevo o propio) y cómo se llamará cada cuenta de correo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="max-w-lg space-y-2">
            <Label className="font-bold text-slate-800">Dominio de tu Despacho / Marca de Agente</Label>
            <div className="flex items-center">
              <span className="bg-slate-100 border border-r-0 border-slate-200 px-3 py-2 rounded-l-md text-sm text-slate-500 font-mono">
                @
              </span>
              <Input
                value={domain}
                onChange={(e) => setDomain(e.target.value.toLowerCase().replace(/[^a-z0-9.-]/g, ""))}
                placeholder="ej. segurosjuanperez.com"
                className="rounded-l-none font-mono"
              />
            </div>
            <p className="text-xs text-slate-500">
              Nosotros nos encargamos de dejar listos tus registros MX, SPF, DKIM y Webmail sin que tengas que configurar nada técnico.
            </p>
          </div>

          <div className="space-y-3">
            <Label className="font-bold text-slate-800">
              Cuentas de Correo Incluidas ({selectedCount} de 10 GB c/u)
            </Label>
            <div className="grid sm:grid-cols-2 gap-4">
              {mailboxes.slice(0, selectedCount).map((mb, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase text-slate-500">
                      Buzón #{idx + 1} (10 GB)
                    </span>
                    <Badge variant="outline" className="text-[11px] bg-white">
                      10 GB dedicados
                    </Badge>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Puesto o Uso (ej. Titular, Asistente, Siniestros)</Label>
                    <Input
                      value={mb.roleLabel}
                      onChange={(e) => handleMailboxChange(idx, "roleLabel", e.target.value)}
                      placeholder="Ej. Agente Titular"
                      className="bg-white h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Dirección de Correo</Label>
                    <div className="flex items-center">
                      <Input
                        value={mb.prefix}
                        onChange={(e) => handleMailboxChange(idx, "prefix", e.target.value)}
                        placeholder="contacto"
                        className="rounded-r-none bg-white h-9 font-mono text-sm"
                      />
                      <span className="bg-slate-200/70 border border-l-0 border-slate-200 px-3 py-1.5 rounded-r-md text-xs text-slate-700 font-mono truncate max-w-[180px]">
                        @{domain || "tudominio.com"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {message && (
            <div
              className={`p-3 rounded-xl text-sm font-medium ${
                message.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {message.text}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/80 border-t p-6 rounded-b-xl">
          <div className="space-y-0.5 text-center sm:text-left">
            <div className="text-sm font-semibold text-slate-600">
              Paquete seleccionado:{" "}
              <strong className="text-slate-900">
                {activePackage.name} ({selectedCount} {selectedCount === 1 ? "buzón" : "buzones"} de 10 GB)
              </strong>
            </div>
            <div className="text-xs text-slate-500 flex items-center gap-1.5 justify-center sm:justify-start">
              <RefreshCw className="w-3.5 h-3.5 text-teal-600" />
              Cargo automático anual con tarjeta en Stripe (${activePackage.priceMxn.toLocaleString("es-MX")} MXN / año).
            </div>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {isEmailSubscriptionValid && (
              <Button
                type="button"
                variant="outline"
                onClick={handleSaveBoxesOnly}
                disabled={savingConfig}
              >
                {savingConfig ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Guardar Nombres
              </Button>
            )}
            <Button
              type="button"
              onClick={handleSubscribeEmail}
              disabled={loadingCheckout}
              className="flex-1 sm:flex-initial bg-teal-600 hover:bg-teal-700 text-white font-bold h-11 px-6 shadow-md"
            >
              {loadingCheckout ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" /> Conectando con Stripe...
                </>
              ) : isEmailSubscriptionValid ? (
                `Actualizar a ${selectedCount} ${selectedCount === 1 ? "Buzón" : "Buzones"} ($${activePackage.priceMxn.toLocaleString("es-MX")}/año)`
              ) : (
                `Contratar ${selectedCount} ${selectedCount === 1 ? "Buzón" : "Buzones"} por $${activePackage.priceMxn.toLocaleString("es-MX")} / año`
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
