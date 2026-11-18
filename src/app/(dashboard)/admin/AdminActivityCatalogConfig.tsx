"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getAgencyActivityCatalogAction,
  saveAgencyActivityCatalogAction,
  resetAgencyActivityCatalogAction,
} from "@/app/actions";
import {
  getDefaultSalesActivities,
  type SalesActivityItem,
} from "@/lib/constants";
import {
  Settings,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Save,
  Plus,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

const SPECIAL_CAPTURE_HINT: Record<string, string> = {
  "1": "Registro directo (+1 clic)",
  "2": "Pide nombre de prospecto",
  "3": "Pide nombre de cliente/prospecto",
  "4": "Pide Nombre y Apellido",
  "5": "Pide Nombre, Apellido, Teléfono y Comentarios (pasa a Proyecto 200)",
  "6": "Pide Contratante, Ramo y Prima (solo indicativo)",
  "7": "Registro directo (+1 clic)",
  "8": "Concepto personalizado (+1 clic)",
};

export default function AdminActivityCatalogConfig({
  onCatalogUpdated,
}: {
  onCatalogUpdated?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [items, setItems] = useState<SalesActivityItem[]>(getDefaultSalesActivities());
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadCatalog = async () => {
    setLoading(true);
    try {
      const res = await getAgencyActivityCatalogAction();
      if (res.success && Array.isArray(res.items)) {
        setItems(res.items);
      }
    } catch (err) {
      console.error("Error fetching activity catalog:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, []);

  const activeCount = items.filter((i) => i.active !== false).length;
  const hasEighthItem = items.some((i) => i.id === "8");

  const updateItem = (id: string, patch: Partial<SalesActivityItem>) => {
    setFeedback(null);
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, ...patch } : it))
    );
  };

  const handleToggleActive = (id: string) => {
    setFeedback(null);
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const nextActive = !it.active;
        const nextCount = prev.filter((x) => (x.id === id ? nextActive : x.active)).length;
        if (nextCount < 6) {
          setFeedback({
            type: "error",
            text: "Debes mantener mínimo 6 conceptos activos en tu promotoría.",
          });
          return it;
        }
        if (nextCount > 8) {
          setFeedback({
            type: "error",
            text: "Solo puedes tener máximo 8 conceptos activos.",
          });
          return it;
        }
        return { ...it, active: nextActive };
      })
    );
  };

  const handleAddEighthConcept = () => {
    setFeedback(null);
    if (hasEighthItem) {
      updateItem("8", { active: true });
      return;
    }
    setItems((prev) => [
      ...prev,
      {
        id: "8",
        name: "Actividad personalizada",
        value: 2,
        description: "Describe cuándo cuenta esta actividad adicional para sumar puntos.",
        captureType: "SIMPLE",
        active: prev.filter((x) => x.active).length < 8,
      },
    ]);
  };

  const handleSave = async () => {
    setFeedback(null);
    setSaving(true);
    try {
      const res = await saveAgencyActivityCatalogAction(items);
      if (res.success) {
        if (res.items) setItems(res.items);
        setFeedback({
          type: "success",
          text: res.message || "Catálogo de puntos guardado correctamente.",
        });
        onCatalogUpdated?.();
      } else {
        setFeedback({
          type: "error",
          text: res.message || "No se pudo guardar la configuración.",
        });
      }
    } catch (err: any) {
      setFeedback({
        type: "error",
        text: err?.message || "Error al guardar catálogo.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleResetSuggested = async () => {
    setFeedback(null);
    setResetting(true);
    try {
      const res = await resetAgencyActivityCatalogAction();
      if (res.success) {
        setItems(res.items);
        setFeedback({
          type: "success",
          text: res.message || "Se restauró la Actividad sugerida de 25 puntos.",
        });
        onCatalogUpdated?.();
      } else {
        setFeedback({
          type: "error",
          text: res.message || "No se pudo restaurar la actividad sugerida.",
        });
      }
    } catch (err: any) {
      setFeedback({
        type: "error",
        text: err?.message || "Error al restaurar valores default.",
      });
    } finally {
      setResetting(false);
    }
  };

  return (
    <Card className="border border-teal-200/80 dark:border-teal-900/40 bg-teal-50/20 dark:bg-teal-950/10 shadow-sm">
      <CardHeader className="py-3.5 px-4 sm:px-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <CardTitle className="text-xs sm:text-sm font-black text-slate-800 dark:text-zinc-100 flex items-center gap-2 flex-wrap">
              <Settings className="h-4 w-4 text-teal-600 shrink-0" />
              <span>Personalizar Conceptos y Puntajes (6 a 8 conceptos)</span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                {activeCount} activos · Meta diaria: 25 pts (15 Referidores)
              </span>
            </CardTitle>
            <CardDescription className="text-[11px]">
              Ajusta los conceptos, nombres, descripciones y puntos exclusivos para los agentes de tu promotoría sin alterar registros históricos.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResetSuggested}
              disabled={loading || saving || resetting}
              className="h-8 text-xs font-bold border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900/60"
            >
              {resetting ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              )}
              Actividad sugerida de 25 puntos
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setExpanded((prev) => !prev)}
              className="h-8 text-xs font-bold"
            >
              {expanded ? (
                <>
                  Ocultar editor <ChevronUp className="h-3.5 w-3.5 ml-1" />
                </>
              ) : (
                <>
                  Configurar puntos <ChevronDown className="h-3.5 w-3.5 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="p-4 sm:p-5 pt-0 space-y-4">
          {feedback && (
            <div
              className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                feedback.type === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-900/50 dark:text-emerald-300"
                  : "bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/30 dark:border-rose-900/50 dark:text-rose-300"
              }`}
            >
              {feedback.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0" />
              )}
              <span>{feedback.text}</span>
            </div>
          )}

          {loading ? (
            <div className="py-6 text-center text-xs text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin mx-auto mb-1 text-teal-600" />
              Cargando conceptos de tu promotoría...
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-xl border transition-all grid grid-cols-1 md:grid-cols-12 gap-3 items-start ${
                    item.active
                      ? "bg-white dark:bg-zinc-950 border-slate-200 dark:border-zinc-800"
                      : "bg-slate-100/70 dark:bg-zinc-900/40 border-dashed border-slate-300 dark:border-zinc-800 opacity-70"
                  }`}
                >
                  {/* Toggle + ID */}
                  <div className="md:col-span-2 flex items-center justify-between md:flex-col md:items-start gap-1.5">
                    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={item.active}
                        onChange={() => handleToggleActive(item.id)}
                        className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                      />
                      <span className="text-xs font-black text-slate-700 dark:text-zinc-200">
                        Concepto #{item.id}
                      </span>
                    </label>
                    <span className="text-[10px] text-slate-500 leading-tight">
                      {SPECIAL_CAPTURE_HINT[item.id] || "Personalizado"}
                    </span>
                  </div>

                  {/* Nombre */}
                  <div className="md:col-span-3 space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block">
                      Título de la actividad
                    </label>
                    <Input
                      type="text"
                      value={item.name}
                      disabled={!item.active}
                      onChange={(e) => updateItem(item.id, { name: e.target.value })}
                      className="h-9 text-xs font-bold"
                    />
                  </div>

                  {/* Puntaje */}
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block">
                      Puntos (1-25)
                    </label>
                    <Input
                      type="number"
                      min={1}
                      max={25}
                      value={item.value}
                      disabled={!item.active}
                      onChange={(e) =>
                        updateItem(item.id, {
                          value: Math.max(1, Math.min(25, parseInt(e.target.value, 10) || 1)),
                        })
                      }
                      className="h-9 text-xs font-black text-center"
                    />
                  </div>

                  {/* Descripción */}
                  <div className="md:col-span-5 space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block">
                      ¿Cuándo cuenta para puntos?
                    </label>
                    <Input
                      type="text"
                      value={item.description}
                      disabled={!item.active}
                      onChange={(e) => updateItem(item.id, { description: e.target.value })}
                      className="h-9 text-xs"
                    />
                  </div>
                </div>
              ))}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <div>
                  {!hasEighthItem && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddEighthConcept}
                      className="h-8 text-xs font-bold border-dashed border-teal-400 text-teal-700 hover:bg-teal-50 dark:text-teal-300"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Agregar 8º concepto personalizado
                    </Button>
                  )}
                </div>

                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || resetting}
                  className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold h-9 px-4"
                >
                  {saving ? (
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <Save className="h-3.5 w-3.5 mr-1.5" />
                  )}
                  Guardar Configuración ({activeCount} conceptos)
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
