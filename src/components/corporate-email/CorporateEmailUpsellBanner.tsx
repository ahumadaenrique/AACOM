"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Mail,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Search,
  Loader2,
  RefreshCw,
  ArrowRight,
  Lock,
  Globe,
  Building2,
  Check,
  Server,
  ArrowRightLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  activateCorporateEmailSubscriptionAction,
  searchCustomDomainAction,
} from "@/app/(dashboard)/correos-corporativos/actions";

function buildAgentEmailLocalPart(fullName: string): string {
  const parts = (fullName || "agente")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return "agente";
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return `${parts[0]}.${parts[1]}`;
  if (parts.length >= 3) {
    return `${parts[0]}.${parts[parts.length - 2]}`;
  }
  return `${parts[0]}.${parts[1]}`;
}

function getInitials(name: string): string {
  const parts = (name || "AG").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "AG";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

interface DomainOption {
  suggestedDomain: string;
  tld: string;
  isAvailable: boolean;
  wholesalePriceUsd: number;
  isPremium: boolean;
}

interface SampleAgentEmail {
  userId: string;
  name: string;
  emailPreview: string;
}

interface CorporateEmailUpsellBannerProps {
  agencyId: string;
  agencyName: string;
  primaryDomain: string;
  domainSuggestions: DomainOption[];
  sampleAgentEmails: SampleAgentEmail[];
  isSuperAdmin?: boolean;
  compact?: boolean;
  onActivated?: () => void;
}

export function CorporateEmailUpsellBanner({
  agencyId,
  agencyName,
  primaryDomain,
  domainSuggestions,
  sampleAgentEmails,
  isSuperAdmin = false,
  compact = false,
  onActivated,
}: CorporateEmailUpsellBannerProps) {
  const router = useRouter();
  const [selectedDomain, setSelectedDomain] = useState<string>(primaryDomain);
  const [availableDomains, setAvailableDomains] = useState<DomainOption[]>(
    domainSuggestions.length > 0
      ? domainSuggestions
      : [
          {
            suggestedDomain: primaryDomain,
            tld: ".com",
            isAvailable: true,
            wholesalePriceUsd: 11.49,
            isPremium: false,
          },
        ]
  );
  const [customSearch, setCustomSearch] = useState<string>("");
  const [searching, setSearching] = useState<boolean>(false);
  const [activating, setActivating] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const dynamicAgentPreviews = sampleAgentEmails.slice(0, 3).map((agent) => {
    const localPart = buildAgentEmailLocalPart(agent.name);
    return {
      ...agent,
      localPart,
      email: `${localPart}@${selectedDomain}`,
      initials: getInitials(agent.name),
    };
  });

  const handleSearchDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSearch.trim()) return;
    setSearching(true);
    setErrorMessage("");
    setStatusMessage("");
    try {
      const res = await searchCustomDomainAction(customSearch.trim(), agencyId);
      if (res.eligible.length > 0) {
        const mapped: DomainOption[] = res.eligible.map((d) => ({
          suggestedDomain: d.domain,
          tld: d.tld,
          isAvailable: d.isAvailable,
          wholesalePriceUsd: d.wholesalePriceUsd,
          isPremium: d.isPremium,
        }));
        setAvailableDomains(mapped);
        setSelectedDomain(mapped[0].suggestedDomain);
        setStatusMessage(
          `Se encontraron ${mapped.length} variante(s) disponibles incluidas en tu paquete.`
        );
      } else {
        setErrorMessage(
          "Ese dominio ya se encuentra ocupado o reservado en internet. Prueba con otra variante disponible."
        );
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Error al verificar disponibilidad del dominio.");
    } finally {
      setSearching(false);
    }
  };

  const handleOneClickActivate = async (
    billingMode: "SANDBOX_CHECKOUT" | "COURTESY_SUPERADMIN" = "SANDBOX_CHECKOUT"
  ) => {
    setActivating(true);
    setErrorMessage("");
    setStatusMessage(
      `Verificando disponibilidad en tiempo real de ${selectedDomain} y aprovisionando DNS + 20 asientos corporativos...`
    );

    try {
      const res = await activateCorporateEmailSubscriptionAction({
        domainName: selectedDomain,
        billingMode,
        targetAgencyId: agencyId,
      });

      if (res.requiresRedirect && res.checkoutUrl) {
        window.location.href = res.checkoutUrl;
        return;
      }

      setStatusMessage(
        `Dominio ${res.domainName} registrado y configurado con éxito. Abriendo tu consola de 20 buzones...`
      );
      if (onActivated) {
        onActivated();
      } else {
        router.push("/correos-corporativos");
        router.refresh();
      }
    } catch (err: any) {
      setErrorMessage(err.message || "No se pudo completar el aprovisionamiento.");
      setStatusMessage("");
    } finally {
      setActivating(false);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-[28px] bg-[#0B1120] text-slate-100 shadow-[0_24px_60px_-15px_rgba(15,23,42,0.55)] ring-1 ring-white/10">
      {/* Textura arquitectónica de cuadrícula sutil */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage:
            "radial-gradient(rgba(148, 163, 184, 0.45) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />

      {/* Iluminación atmosférica controlada */}
      <div className="pointer-events-none absolute -top-32 left-1/4 h-80 w-96 rounded-full bg-sky-500/15 blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-32 right-10 h-72 w-80 rounded-full bg-emerald-500/10 blur-[100px]" />

      <div className={`relative z-10 ${compact ? "p-6 md:p-7" : "p-6 sm:p-8 lg:p-10"}`}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* Columna Izquierda (7 cols): Propuesta de Valor y Vista Previa de Identidad */}
          <div className="lg:col-span-7 space-y-6">
            {/* Etiquetas de estado verificadas */}
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 border border-emerald-400/30 px-3.5 py-1 text-xs font-semibold text-emerald-300 tracking-wide">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                DOMINIO DISPONIBLE Y VERIFICADO HOY
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] border border-white/10 px-3 py-1 text-xs font-medium text-slate-300">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                Registro Anual + WHOIS Privado Incluidos
              </span>
            </div>

            {/* Titular Principal sin emojis genéricos y con jerarquía tipográfica limpia */}
            <div className="space-y-3">
              <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-extrabold tracking-tight text-white leading-[1.18]">
                Tu dominio oficial{" "}
                <span className="inline-block font-mono text-sky-300 bg-sky-500/10 border border-sky-400/30 px-3 py-0.5 rounded-xl shadow-inner">
                  {selectedDomain}
                </span>{" "}
                está libre para activar hoy
              </h2>

              <p className="text-sm sm:text-[15px] text-slate-300 leading-relaxed max-w-2xl">
                Consolida la presencia institucional de <strong className="text-white font-semibold">{agencyName}</strong> con{" "}
                <strong className="text-sky-300 font-semibold">20 buzones corporativos de 3 GB</strong>{" "}
                conectados de forma nativa a <strong className="text-white font-semibold">aacomsoft</strong>. Tus agentes envían pólizas y cotizaciones desde su propio correo oficial sin salir de su cartera.
              </p>
            </div>

            {/* Tarjetas de Vista Previa de Buzones Reales (Sin truncar el dominio) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold uppercase tracking-wider text-slate-400">
                  Vista previa de cuentas listas para tus agentes
                </span>
                <span className="text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 20 lugares incluidos (3 GB c/u)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {dynamicAgentPreviews.slice(0, 2).map((item) => (
                  <div
                    key={item.userId}
                    className="group flex items-center gap-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/10 px-4 py-3 transition-colors"
                  >
                    <div className="h-9 w-9 rounded-xl bg-sky-500/15 border border-sky-400/30 text-sky-300 flex items-center justify-center text-xs font-bold shrink-0">
                      {item.initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-200 truncate">
                          {item.name}
                        </span>
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/20 shrink-0">
                          3 GB
                        </span>
                      </div>
                      <div className="text-xs font-mono text-sky-300 break-all mt-0.5">
                        <span className="text-white font-semibold">{item.localPart}</span>@{selectedDomain}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Cuenta institucional + lugares restantes */}
                <div className="sm:col-span-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-2xl bg-gradient-to-r from-sky-500/10 via-white/[0.03] to-emerald-500/10 border border-sky-400/25 px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 flex items-center justify-center shrink-0">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-white">
                        Cuentas Institucionales y de Agentes (+18 lugares adicionales)
                      </div>
                      <div className="text-xs font-mono text-slate-300 flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                        <span>
                          <strong className="text-emerald-300">direccion</strong>@{selectedDomain}
                        </span>
                        <span className="text-slate-600">•</span>
                        <span>
                          <strong className="text-sky-300">siniestros</strong>@{selectedDomain}
                        </span>
                        <span className="text-slate-600">•</span>
                        <span>
                          <strong className="text-sky-300">emision</strong>@{selectedDomain}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-sky-200 bg-sky-500/20 border border-sky-400/30 px-2.5 py-1 rounded-lg self-start sm:self-center shrink-0">
                    Reutilizables sin costo
                  </span>
                </div>
              </div>
            </div>

            {/* Pilares técnicos inferiores */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-white/10">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <Server className="w-4 h-4 text-sky-400 shrink-0" />
                <span>DNS MX, SPF, DKIM y DMARC automáticos</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <ArrowRightLeft className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Puente de Cartera al rotar agentes</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <Lock className="w-4 h-4 text-sky-400 shrink-0" />
                <span>Bóveda AES-256 + Webmail integrado</span>
              </div>
            </div>
          </div>

          {/* Columna Derecha (5 cols): Tarjeta Ejecutiva de Selección de Dominio y Activación */}
          <div className="lg:col-span-5 w-full">
            <div className="rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-white/15 p-5 sm:p-6 shadow-2xl space-y-5">
              {/* Encabezado de Precio perfectamente alineado */}
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-white/10">
                <div>
                  <span className="inline-block text-[11px] font-bold uppercase tracking-widest text-sky-400">
                    Paquete Corporativo Promotoría
                  </span>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Dominio oficial + 20 buzones de 3 GB
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div className="flex items-baseline justify-end gap-1">
                    <span className="text-2xl sm:text-3xl font-black tracking-tight text-white tabular-nums">
                      $999
                    </span>
                    <span className="text-xs font-semibold text-slate-400">
                      MXN/mes
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-medium">
                    Renovación anual incluida
                  </span>
                </div>
              </div>

              {/* Selector de Variantes Sugeridas */}
              <div className="space-y-2.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-sky-400" />
                    1. Elige tu variante de dominio disponible:
                  </span>
                  <span className="text-[11px] text-emerald-400 font-mono">
                    ● Verificado
                  </span>
                </label>

                <div className="grid grid-cols-1 gap-2">
                  {availableDomains.slice(0, 3).map((d) => {
                    const isSelected = selectedDomain === d.suggestedDomain;
                    return (
                      <button
                        key={d.suggestedDomain}
                        type="button"
                        onClick={() => setSelectedDomain(d.suggestedDomain)}
                        className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-left transition-all ${
                          isSelected
                            ? "bg-sky-500/20 border-sky-400 text-white shadow-[0_0_20px_-5px_rgba(56,189,248,0.35)]"
                            : "bg-slate-950/60 border-white/10 text-slate-300 hover:bg-white/[0.06] hover:border-white/20"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`h-4 w-4 rounded-full flex items-center justify-center border shrink-0 ${
                              isSelected
                                ? "border-sky-400 bg-sky-400 text-slate-950"
                                : "border-slate-600 bg-transparent"
                            }`}
                          >
                            {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                          <span className="text-xs sm:text-sm font-mono font-bold truncate">
                            {d.suggestedDomain}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-md shrink-0 ${
                            isSelected
                              ? "bg-sky-400/20 text-sky-200 border border-sky-400/30"
                              : "bg-white/5 text-slate-400"
                          }`}
                        >
                          Incluido
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Buscador integrado de dominio personalizado */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-slate-400">
                  ¿Prefieres buscar otro nombre de dominio (.com, .com.mx, .mx)?
                </label>
                <form onSubmit={handleSearchDomain} className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <Input
                      value={customSearch}
                      onChange={(e) => setCustomSearch(e.target.value)}
                      placeholder="Ej. promotoriamexico.com"
                      className="h-9 pl-8 text-xs font-mono bg-slate-950/80 border-white/15 text-white placeholder:text-slate-500 rounded-xl focus-visible:ring-sky-400"
                    />
                  </div>
                  <Button
                    type="submit"
                    size="sm"
                    variant="secondary"
                    disabled={searching}
                    className="h-9 px-3.5 text-xs font-bold rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/10 shrink-0"
                  >
                    {searching ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      "Verificar"
                    )}
                  </Button>
                </form>
              </div>

              {/* Botón Principal de Activación sin desbordamiento de texto */}
              <div className="space-y-2.5 pt-1">
                <Button
                  type="button"
                  onClick={() => handleOneClickActivate("SANDBOX_CHECKOUT")}
                  disabled={activating}
                  className="group w-full h-auto min-h-[48px] py-3 px-4 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-[0_10px_25px_-5px_rgba(14,165,233,0.45)] transition-all whitespace-normal leading-snug flex items-center justify-center gap-2"
                >
                  {activating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                      <span>Activando dominio y 20 buzones...</span>
                    </>
                  ) : (
                    <>
                      <span>Activar mi dominio y 20 correos en 1 clic</span>
                      <ArrowRight className="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </Button>

                {isSuperAdmin && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleOneClickActivate("COURTESY_SUPERADMIN")}
                    disabled={activating}
                    className="w-full h-auto min-h-[38px] py-2 px-3 text-xs font-bold border-emerald-400/35 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 hover:text-emerald-200 rounded-xl whitespace-normal leading-snug"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-emerald-400 shrink-0" />
                    <span>Super Admin: Activar como Cortesía / Demo ($0)</span>
                  </Button>
                )}
              </div>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 text-center pt-1">
                <Lock className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>
                  Verificación DNS en tiempo real + Activación automática Zero-Touch
                </span>
              </div>
            </div>
          </div>
        </div>

        {statusMessage && (
          <div className="mt-6 rounded-xl bg-sky-500/15 border border-sky-400/35 px-4 py-3 text-xs font-semibold text-sky-200 flex items-center gap-2.5">
            <RefreshCw className={`w-4 h-4 text-sky-300 shrink-0 ${activating ? "animate-spin" : ""}`} />
            <span>{statusMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mt-6 rounded-xl bg-rose-500/15 border border-rose-400/35 px-4 py-3 text-xs font-semibold text-rose-200 flex items-center gap-2.5">
            <span className="h-2 w-2 rounded-full bg-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
}
