'use client';

import React, { useEffect, useState } from 'react';
import { ShieldCheck, Volume2, Award, Users, CheckCircle2, XCircle, Clock, ChevronDown, ChevronUp, RefreshCw, Sparkles } from 'lucide-react';

export function SupervisionPanel() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCallId, setExpandedCallId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/roleplay/admin');
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'No tienes permisos de supervisor/admin.');
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || 'Error cargando auditoría');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-400 text-sm gap-3">
        <RefreshCw className="h-5 w-5 animate-spin text-indigo-500" />
        <span>Cargando auditoría de llamadas y panel de supervisión...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
        ⚠️ {error}
      </div>
    );
  }

  const calls = data?.calls || [];
  const agentStats = data?.agentStats || [];
  const levelsConfig = data?.levelsConfig || {};
  const defaultBenefits = data?.defaultBenefits || {};

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-indigo-400" />
            Panel de Supervisión y Grabaciones
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Audita el desempeño telefónico de los asesores, escucha grabaciones de llamadas y revisa beneficios activos.
          </p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Actualizar
        </button>
      </div>

      {/* Grid: Leaderboard & Benefits */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Leaderboard de Agentes */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Users className="h-4 w-4 text-cyan-400" /> Escalafón y Récord de Agentes
            </h3>
            <span className="text-[11px] text-slate-500">{agentStats.length} Asesores activos</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                  <th className="pb-2">Asesor</th>
                  <th className="pb-2">Nivel</th>
                  <th className="pb-2">XP Total</th>
                  <th className="pb-2">Racha</th>
                  <th className="pb-2">Llamadas</th>
                  <th className="pb-2">Citas Logradas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {agentStats.map((st: any) => {
                  const lvl = levelsConfig[st.level] || { title: `Nivel ${st.level}`, icon: '⭐' };
                  return (
                    <tr key={st.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-2.5 font-medium text-slate-200">
                        {st.user?.name || st.user?.email || 'Asesor'}
                      </td>
                      <td className="py-2.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          {lvl.icon} Nivel {st.level}
                        </span>
                      </td>
                      <td className="py-2.5 font-bold text-amber-400">{st.xp} XP</td>
                      <td className="py-2.5 text-orange-400">🔥 {st.streak} d</td>
                      <td className="py-2.5 text-slate-400">{st.totalCalls}</td>
                      <td className="py-2.5 text-emerald-400 font-bold">{st.closedCalls}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Beneficios por Nivel */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-400" /> Beneficios por Nivel
          </h3>
          <div className="space-y-3 text-xs">
            {[1, 2, 3, 4, 5, 6].map(lvl => {
              const cfg = levelsConfig[lvl] || { title: `Nivel ${lvl}`, icon: '⭐' };
              const perks = defaultBenefits[lvl] || [];
              return (
                <div key={lvl} className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-slate-200">
                    <span>{cfg.icon}</span>
                    <span>Nivel {lvl}: {cfg.title}</span>
                  </div>
                  <ul className="text-[11px] text-slate-400 list-disc list-inside space-y-0.5">
                    {perks.map((p: string, idx: number) => (
                      <li key={idx}>{p}</li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Bitácora de Llamadas con Audios */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Volume2 className="h-4 w-4 text-emerald-400" /> Bitácora Reciente de Llamadas y Grabaciones
          </h3>
          <span className="text-xs text-slate-500">{calls.length} llamadas registradas</span>
        </div>

        {calls.length === 0 ? (
          <div className="text-center p-8 text-xs text-slate-500 italic">
            Aún no hay llamadas registradas en el simulador.
          </div>
        ) : (
          <div className="space-y-3">
            {calls.map((call: any) => {
              const isExpanded = expandedCallId === call.id;
              const dateStr = new Date(call.createdAt).toLocaleString('es-MX', {
                dateStyle: 'short',
                timeStyle: 'short'
              });

              return (
                <div
                  key={call.id}
                  className="rounded-xl bg-slate-800/40 border border-slate-800 p-4 transition-all"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`h-9 w-9 rounded-xl flex items-center justify-center font-bold text-xs ${call.appointmentClosed ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-700 text-slate-300'}`}>
                        {call.score}
                      </div>
                      <div>
                        <div className="font-bold text-white text-xs flex items-center gap-2">
                          <span>{call.user?.name || call.user?.email || 'Asesor'}</span>
                          <span className="text-slate-500">→</span>
                          <span className="text-indigo-300">{call.prospectName}</span>
                          {call.appointmentClosed && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                              ✓ Cita Lograda
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-3">
                          <span>{dateStr}</span>
                          <span>•</span>
                          <span>Duración: {call.durationSeconds}s</span>
                          <span>•</span>
                          <span className="text-amber-400">+{call.xpEarned} XP</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 ml-auto">
                      {call.conversationId && (
                        <audio
                          controls
                          className="h-8 max-w-[200px]"
                          src={`/api/roleplay/audio/${call.conversationId}`}
                        />
                      )}

                      <button
                        onClick={() => setExpandedCallId(isExpanded ? null : call.id)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
                        title="Ver detalle y transcripción"
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Detail */}
                  {isExpanded && (
                    <div className="mt-4 pt-3 border-t border-slate-700/60 space-y-3 text-xs animate-in fade-in duration-150">
                      {call.coachTip && (
                        <div className="p-3 rounded-lg bg-indigo-950/30 border border-indigo-500/20 text-indigo-300">
                          <strong>Coach Tip:</strong> {call.coachTip}
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/20 text-emerald-300 space-y-1">
                          <div className="font-bold flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Aciertos:</div>
                          {call.aciertos?.map((a: string, i: number) => (
                            <div key={i}>• {a}</div>
                          ))}
                        </div>

                        <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-500/20 text-rose-300 space-y-1">
                          <div className="font-bold flex items-center gap-1"><XCircle className="h-3.5 w-3.5" /> Oportunidades:</div>
                          {call.errores?.map((e: string, i: number) => (
                            <div key={i}>• {e}</div>
                          ))}
                        </div>
                      </div>

                      {/* Transcripción completa */}
                      {Array.isArray(call.transcript) && call.transcript.length > 0 && (
                        <div className="space-y-1 pt-1">
                          <div className="text-[11px] font-bold text-slate-400">Transcripción completa:</div>
                          <div className="max-h-48 overflow-y-auto p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1 text-slate-300">
                            {call.transcript.map((t: any, idx: number) => (
                              <div key={idx} className={t.source === 'ai' ? 'text-indigo-300' : 'text-slate-100 font-medium'}>
                                <strong>{t.source === 'ai' ? call.prospectName : 'Asesor'}:</strong> {t.message}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
