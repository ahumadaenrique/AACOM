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
import {
  Sparkles,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import { analyzeClientBlindaje } from "./protectionGapUtils";

export default function CrossSellRadarClient({
  clients,
  adnDiagnostics = [],
}: {
  clients: any[];
  adnDiagnostics?: any[];
}) {
  const [expanded, setExpanded] = useState(false);

  const opportunities = useMemo(() => {
    return clients
      .map((client) => {
        const analysis = analyzeClientBlindaje(client, adnDiagnostics, []);
        const totalPremium = (client.policies || []).reduce(
          (acc: number, p: any) => acc + (p.annualPremium || 0),
          0
        );
        return {
          client,
          analysis,
          totalPremium,
        };
      })
      .filter((item) => item.analysis.primaryGap !== null && item.analysis.coveredCount < 3)
      .sort((a, b) => b.totalPremium - a.totalPremium);
  }, [clients, adnDiagnostics]);

  if (opportunities.length === 0) return null;

  const visibleList = expanded ? opportunities.slice(0, 20) : opportunities.slice(0, 4);

  return (
    <Card className="border-indigo-500/20 bg-gradient-to-r from-indigo-500/5 via-background to-background">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-500" />
              Radar de Venta Cruzada y Brechas de Blindaje ({opportunities.length} clientes)
            </CardTitle>
            <CardDescription>
              Clientes actuales de tu cartera con brechas abiertas en Retiro/PPR, Gastos Médicos o Vida listos para profundización.
            </CardDescription>
          </div>
          {opportunities.length > 4 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="text-xs self-start sm:self-center"
            >
              {expanded ? (
                <>
                  Ver menos <ChevronUp className="w-4 h-4 ml-1" />
                </>
              ) : (
                <>
                  Ver {Math.min(20, opportunities.length)} oportunidades{" "}
                  <ChevronDown className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {visibleList.map(({ client, analysis }) => {
            const gap = analysis.primaryGap!;
            const coveredPillars = analysis.pillars
              .filter((p) => p.coveredInCartera || p.coveredInAdnExternal)
              .map((p) => p.shortTitle);
            const cleanPhone = (client.phone || "").replace(/\D/g, "");

            return (
              <div
                key={client.id}
                className="p-3 rounded-lg border bg-background flex flex-col justify-between gap-2.5 hover:border-indigo-500/40 transition-colors"
              >
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={`/cartera/clientes/${client.id}`}
                      className="font-semibold text-sm text-primary hover:underline line-clamp-1"
                    >
                      {client.name}
                    </Link>
                    <Badge
                      variant="outline"
                      className="text-[10px] shrink-0 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20"
                    >
                      {analysis.shieldPercentage}% Blindaje
                    </Badge>
                  </div>

                  <div className="text-[11px] text-muted-foreground">
                    Tiene:{" "}
                    <strong className="text-foreground">
                      {coveredPillars.length > 0
                        ? coveredPillars.join(", ")
                        : "Sin cobertura activa"}
                    </strong>
                  </div>

                  <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-[11px] flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
                    <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                    <span className="truncate">
                      Sugerido: <strong>{gap.shortTitle}</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-border/50">
                  <Link
                    href={`/cartera/clientes/${client.id}`}
                    className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-0.5"
                  >
                    Ver expediente <ArrowUpRight className="w-3 h-3" />
                  </Link>

                  {cleanPhone.length >= 10 && (
                    <a
                      href={`https://wa.me/${
                        cleanPhone.length === 10 ? "52" + cleanPhone : cleanPhone
                      }?text=${encodeURIComponent(gap.crossSellPitch)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-[11px] border-emerald-500/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10"
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
      </CardContent>
    </Card>
  );
}
