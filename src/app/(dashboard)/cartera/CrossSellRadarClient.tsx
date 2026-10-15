"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sparkles,
  MessageCircle,
  ShieldAlert,
  ArrowUpRight,
  Search,
} from "lucide-react";
import Link from "next/link";
import { analyzeClientBlindaje } from "./protectionGapUtils";

type PillarFilter = "ALL" | "TIPS" | "VIDA" | "RETIRO_AHORRO" | "GMM" | "PATRIMONIO";

export default function CrossSellRadarClient({
  clients,
  adnDiagnostics = [],
}: {
  clients: any[];
  adnDiagnostics?: any[];
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [pillarFilter, setPillarFilter] = useState<PillarFilter>("ALL");

  const opportunities = useMemo(() => {
    return clients
      .map((client) => {
        const analysis = analyzeClientBlindaje(client, adnDiagnostics, []);
        const totalPremium = (client.policies || []).reduce(
          (acc: number, p: any) => acc + (p.annualPremium || 0),
          0
        );
        const isTipsLead = String(client.notes || "")
          .toUpperCase()
          .includes("TIPS");
        return {
          client,
          analysis,
          totalPremium,
          isTipsLead,
        };
      })
      .filter(
        (item) =>
          ((item.client.policies || []).length > 0 || item.isTipsLead) &&
          item.analysis.primaryGap !== null &&
          item.analysis.coveredCount < 4
      )
      .sort((a, b) => {
        if (a.isTipsLead !== b.isTipsLead && a.totalPremium === 0 && b.totalPremium === 0) {
          return a.isTipsLead ? -1 : 1;
        }
        return b.totalPremium - a.totalPremium;
      });
  }, [clients, adnDiagnostics]);

  const filteredOpportunities = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return opportunities.filter(({ client, analysis, isTipsLead }) => {
      const matchesSearch =
        term === "" ||
        client.name?.toLowerCase().includes(term) ||
        client.email?.toLowerCase().includes(term) ||
        client.phone?.includes(term) ||
        client.notes?.toLowerCase().includes(term);

      const matchesPillar =
        pillarFilter === "ALL" ||
        (pillarFilter === "TIPS" && isTipsLead) ||
        (pillarFilter !== "TIPS" &&
          analysis.pillars.some(
            (p) =>
              p.id === pillarFilter &&
              !p.coveredInCartera &&
              !p.coveredInAdnExternal
          ));

      return matchesSearch && matchesPillar;
    });
  }, [opportunities, searchTerm, pillarFilter]);

  return (
    <Card className="border-indigo-500/20 bg-gradient-to-r from-indigo-500/5 via-background to-background">
      <CardHeader className="pb-3 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-500" />
              Oportunidades de Venta Cruzada y Leads TIPS ({filteredOpportunities.length} clientes)
            </CardTitle>
            <CardDescription>
              Clientes actuales de tu cartera y prospectos de talleres TIPS con brechas abiertas en Retiro/PPR, Gastos Médicos, Vida o Patrimonio.
            </CardDescription>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between pt-1">
          <div className="relative w-full md:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar cliente o taller TIPS..."
              className="pl-8 h-9 text-xs bg-background"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {(
              [
                { id: "ALL", label: "Todas las brechas" },
                { id: "TIPS", label: "🎯 Origen: TIPS" },
                { id: "RETIRO_AHORRO", label: "Falta Retiro / PPR" },
                { id: "GMM", label: "Falta Gastos Médicos" },
                { id: "VIDA", label: "Falta Vida" },
                { id: "PATRIMONIO", label: "Falta Autos / Daños" },
              ] as { id: PillarFilter; label: string }[]
            ).map((f) => (
              <Button
                key={f.id}
                size="sm"
                variant={pillarFilter === f.id ? "default" : "outline"}
                onClick={() => setPillarFilter(f.id)}
                className="h-8 text-xs"
              >
                {f.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {filteredOpportunities.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm border rounded-lg bg-background/60">
            No se encontraron clientes con brechas para este filtro.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {filteredOpportunities.slice(0, 32).map(({ client, analysis, isTipsLead }) => {
              const targetGap =
                pillarFilter !== "ALL" && pillarFilter !== "TIPS"
                  ? analysis.pillars.find(
                      (p) =>
                        p.id === pillarFilter &&
                        !p.coveredInCartera &&
                        !p.coveredInAdnExternal
                    ) || analysis.primaryGap!
                  : analysis.primaryGap!;

              const coveredPillars = analysis.pillars
                .filter((p) => p.coveredInCartera || p.coveredInAdnExternal)
                .map((p) => p.shortTitle);
              const cleanPhone = (client.phone || "").replace(/\D/g, "");

              return (
                <div
                  key={client.id}
                  className="p-3.5 rounded-lg border bg-background flex flex-col justify-between gap-2.5 hover:border-indigo-500/40 transition-colors shadow-sm"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                        <Link
                          href={`/cartera/clientes/${client.id}`}
                          className="font-semibold text-sm text-primary hover:underline line-clamp-1"
                        >
                          {client.name}
                        </Link>
                        {isTipsLead && (
                          <Badge
                            variant="outline"
                            className="text-[9px] px-1.5 py-0 bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30"
                          >
                            🎯 TIPS
                          </Badge>
                        )}
                      </div>
                      <Badge
                        variant="outline"
                        className="text-[10px] shrink-0 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20"
                      >
                        {analysis.shieldPercentage}% Blindaje
                      </Badge>
                    </div>

                    <div className="text-[11px] text-muted-foreground">
                      Ya tiene:{" "}
                      <strong className="text-foreground">
                        {coveredPillars.length > 0
                          ? coveredPillars.join(", ")
                          : "Sin cobertura activa"}
                      </strong>
                    </div>

                    <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-[11px] flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
                      <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                      <span className="truncate">
                        Ofrecer: <strong>{targetGap.shortTitle}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <Link
                      href={`/cartera/clientes/${client.id}`}
                      className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-0.5 font-medium"
                    >
                      Ver expediente <ArrowUpRight className="w-3 h-3" />
                    </Link>

                    {cleanPhone.length >= 10 && (
                      <a
                        href={`https://wa.me/${
                          cleanPhone.length === 10
                            ? "52" + cleanPhone
                            : cleanPhone
                        }?text=${encodeURIComponent(targetGap.crossSellPitch)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2.5 text-[11px] border-emerald-500/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10"
                        >
                          <MessageCircle className="w-3 h-3 mr-1" />
                          WhatsApp
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
