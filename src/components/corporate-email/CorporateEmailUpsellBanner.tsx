"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Rocket,
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  activateCorporateEmailSubscriptionAction,
  searchCustomDomainAction,
} from "@/app/(dashboard)/correos-corporativos/actions";
import { buildAgentEmailLocalPart } from "@/lib/corporate-email/provider";

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
  const [showDomainPicker, setShowDomainPicker] = useState<boolean>(false);

  const dynamicAgentPreviews = sampleAgentEmails.slice(0, 2).map((agent) => {
    const localPart = buildAgentEmailLocalPart(agent.name);
    return {
      ...agent,
      email: `${localPart}@${selectedDomain}`,
    };
  });

  const handleSearchDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSearch.trim()) return;
    setSearching(true);
    setErrorMessage("");
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
          `✓ Se encontraron ${mapped.length} variante(s) disponibles elegibles dentro del paquete.`
        );
      } else {
        setErrorMessage(
          "Ese dominio no está disponible o es un dominio Premium que supera el tope incluido ($15 USD). Prueba con otra variante."
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
      `Verificando disponibilidad en tiempo real de ${selectedDomain} y aprovisionando DNS + 20 asientos Titan Email...`
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
        `🎉 ¡Dominio ${res.domainName} registrado y configurado con éxito! Redirigiendo a tu panel de 20 buzones...`
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
    <div className="relative overflow-hidden rounded-3xl border border-sky-200/80 bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 text-white shadow-xl">
      {/* Glow decorativo */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-sky-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-indigo-500/15 blur-3xl" />

      <div className={`relative z-10 ${compact ? "p-5 md:p-6" : "p-6 md:p-8"}`}>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Columna Izquierda: Propuesta de Valor Hiper-Personalizada */}
          <div className="space-y-4 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 px-3 py-1 text-xs font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                DOMINIO OFICIAL DISPONIBLE Y VERIFICADO HOY
              </Badge>
              <Badge className="bg-sky-500/20 text-sky-200 border border-sky-400/30 px-2.5 py-1 text-[11px] font-semibold">
                <ShieldCheck className="w-3 h-3 mr-1 text-sky-300" />
                Filtro Anti-Premium Activo (Incluido 100%)
              </Badge>
            </div>

            <h2 className="text-2xl md:text-3xl font-black tracking-tight leading-tight">
              🚀 ¡El dominio{" "}
              <span className="underline decoration-sky-400 decoration-2 underline-offset-4 text-sky-300 font-mono">
                {selectedDomain}
              </span>{" "}
              está disponible hoy!
            </h2>

            <p className="text-sm md:text-base text-slate-200 leading-relaxed">
              Profesionaliza <strong>{agencyName}</strong> por{" "}
              <span className="text-white font-black bg-sky-500/30 px-2 py-0.5 rounded-md border border-sky-400/40">
                $999 MXN/mes
              </span>
              . Incluye tu dominio oficial renovado anualmente y hasta{" "}
              <strong className="text-sky-300">20 buzones de 10 GB</strong> integrados
              directamente en <strong>aacomsoft</strong>:
            </p>

            {/* Lista de correos personalizados con los agentes reales de la promotoría */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              {dynamicAgentPreviews.map((item) => (
                <div
                  key={item.userId}
                  className="flex items-center gap-2.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15 px-3.5 py-2.5"
                >
                  <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-300 shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] text-slate-300 font-medium truncate">
                      {item.name}
                    </div>
                    <div className="text-xs font-mono font-bold text-white truncate">
                      {item.email}
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex items-center gap-2.5 rounded-xl bg-sky-500/15 backdrop-blur-sm border border-sky-400/30 px-3.5 py-2.5">
                <div className="p-1.5 rounded-lg bg-sky-400/20 text-sky-200 shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] text-sky-200 font-semibold truncate">
                    +17 lugares más reutilizables
                  </div>
                  <div className="text-xs font-mono font-bold text-white truncate">
                    direccion@{selectedDomain}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-1">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
                Configuración automática MX, SPF, DKIM y DMARC
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
                Recicla asientos cuando un agente rote sin perder clientes
              </span>
            </div>
          </div>

          {/* Columna Derecha: CTA en 1 Clic y Selector de Variante */}
          <div className="flex flex-col gap-3 lg:w-96 shrink-0 bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/15">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-slate-300 font-bold">
                Paquete Corporativo Promotoría
              </span>
              <span className="text-xl font-black text-sky-300">
                $999 <span className="text-xs font-normal text-slate-300">MXN/mes</span>
              </span>
            </div>

            {/* Variantes de dominio verificadas */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-sky-400" /> Dominio elegido:
                </span>
                <button
                  type="button"
                  onClick={() => setShowDomainPicker(!showDomainPicker)}
                  className="text-sky-300 hover:text-sky-200 underline text-[11px] font-semibold"
                >
                  {showDomainPicker ? "Ocultar variantes" : "Cambiar variante (.com / .mx)"}
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {availableDomains.slice(0, 3).map((d) => (
                  <button
                    key={d.suggestedDomain}
                    type="button"
                    onClick={() => setSelectedDomain(d.suggestedDomain)}
                    className={`text-xs font-mono px-2.5 py-1.5 rounded-lg border transition-all ${
                      selectedDomain === d.suggestedDomain
                        ? "bg-sky-500 text-white border-sky-300 font-bold shadow-sm"
                        : "bg-slate-900/70 text-slate-300 border-white/15 hover:bg-white/10"
                    }`}
                  >
                    {d.suggestedDomain}
                  </button>
                ))}
              </div>
            </div>

            {showDomainPicker && (
              <form onSubmit={handleSearchDomain} className="flex gap-2 pt-1">
                <Input
                  value={customSearch}
                  onChange={(e) => setCustomSearch(e.target.value)}
                  placeholder="Buscar otro dominio..."
                  className="h-9 text-xs bg-slate-900/90 border-white/20 text-white placeholder:text-slate-400"
                />
                <Button
                  type="submit"
                  size="sm"
                  variant="secondary"
                  disabled={searching}
                  className="h-9 px-3 text-xs font-bold shrink-0"
                >
                  {searching ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Search className="w-3.5 h-3.5" />
                  )}
                </Button>
              </form>
            )}

            <Button
              type="button"
              onClick={() => handleOneClickActivate("SANDBOX_CHECKOUT")}
              disabled={activating}
              className="w-full h-12 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-sky-950/50 transition-all"
            >
              {activating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Activando Dominio y 20 Correos...
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4 mr-2 shrink-0" />
                  Reclamar mi dominio y activar mis 20 correos en 1 clic
                </>
              )}
            </Button>

            {isSuperAdmin && (
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOneClickActivate("COURTESY_SUPERADMIN")}
                disabled={activating}
                className="w-full h-9 text-xs font-bold border-emerald-400/40 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20 hover:text-white rounded-xl"
              >
                <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                Super Admin: Activar Paquete como Cortesía / Manual ($0)
              </Button>
            )}

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 text-center">
              <Lock className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>
                Doble verificación en &lt;500 ms + Registro WHOIS Privado Zero-Touch
              </span>
            </div>
          </div>
        </div>

        {statusMessage && (
          <div className="mt-4 rounded-xl bg-sky-500/20 border border-sky-400/40 px-4 py-2.5 text-xs font-bold text-sky-200 flex items-center gap-2">
            <RefreshCw className={`w-4 h-4 ${activating ? "animate-spin" : ""}`} />
            {statusMessage}
          </div>
        )}

        {errorMessage && (
          <div className="mt-4 rounded-xl bg-red-500/20 border border-red-400/40 px-4 py-2.5 text-xs font-bold text-red-200">
            ⚠️ {errorMessage}
          </div>
        )}
      </div>
    </div>
  );
}
