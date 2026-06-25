"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createPoll, getPollResults, deactivatePoll, deletePoll } from "@/app/actions";
import { Loader2, Plus, Trash2, PowerOff, Sparkles } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function AdminPollManager() {
  const [polls, setPolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);

  useEffect(() => {
    fetchPolls();
  }, []);

  const fetchPolls = async () => {
    const res = await getPollResults();
    if (res.success && res.polls) setPolls(res.polls);
  };

  const handleAddOption = () => {
    if (options.length < 5) setOptions([...options, ""]);
  };

  const handleOptionChange = (index: number, val: string) => {
    const newOptions = [...options];
    newOptions[index] = val;
    setOptions(newOptions);
  };

  const handleRemoveOption = (index: number) => {
    const newOptions = options.filter((_, i) => i !== index);
    setOptions(newOptions);
  };

  const handleCreatePoll = async () => {
    const validOptions = options.map(o => o.trim()).filter(o => o.length > 0);
    if (!title.trim() || !question.trim() || validOptions.length < 2) {
      alert("Por favor llena el título, la pregunta y al menos 2 opciones.");
      return;
    }
    
    setLoading(true);
    const res = await createPoll(title.trim(), question.trim(), validOptions);
    if (res.success) {
      setTitle("");
      setQuestion("");
      setOptions(["", ""]);
      await fetchPolls();
    } else {
      alert(res.message);
    }
    setLoading(false);
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    await deactivatePoll(id, !currentStatus);
    fetchPolls();
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Seguro que deseas eliminar esta encuesta permanentemente?")) {
      await deletePoll(id);
      fetchPolls();
    }
  };

  return (
    <div className="space-y-6">
      {/* Create Poll Card */}
      <Card className="border-indigo-100 shadow-sm bg-indigo-50/10">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            Lanzar Nueva Encuesta de Mejoras
          </CardTitle>
          <CardDescription>
            Publica una nueva pregunta para que los Administradores de todas las agencias puedan votar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label>Título de la Encuesta</Label>
            <Input 
              placeholder="Ej. Mejora de Q3: Nuevo módulo de facturación" 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
            />
          </div>
          <div className="grid gap-2">
            <Label>Pregunta</Label>
            <Input 
              placeholder="¿Qué característica prefieres que desarrollemos primero?" 
              value={question} 
              onChange={e => setQuestion(e.target.value)} 
            />
          </div>
          
          <div className="space-y-3 mt-4">
            <Label>Opciones de Votación (Máx 5)</Label>
            {options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input 
                  placeholder={`Opción ${i + 1}`} 
                  value={opt} 
                  onChange={e => handleOptionChange(i, e.target.value)} 
                />
                {options.length > 2 && (
                  <Button variant="ghost" size="icon" onClick={() => handleRemoveOption(i)}>
                    <Trash2 className="w-4 h-4 text-red-400 hover:text-red-600" />
                  </Button>
                )}
              </div>
            ))}
            {options.length < 5 && (
              <Button variant="outline" size="sm" onClick={handleAddOption} className="mt-2 text-xs">
                <Plus className="w-3 h-3 mr-1" /> Agregar Opción
              </Button>
            )}
          </div>
          
          <Button 
            className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white" 
            onClick={handleCreatePoll}
            disabled={loading}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
            Publicar Encuesta Oficial
          </Button>
        </CardContent>
      </Card>

      {/* Results Card */}
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Resultados y Panel de Control</CardTitle>
          <CardDescription>Visualiza las encuestas activas y el conteo de votos exacto.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {polls.length === 0 ? (
              <p className="text-slate-500 text-sm italic">No hay encuestas publicadas.</p>
            ) : (
              polls.map(poll => (
                <div key={poll.id} className="border border-slate-200 rounded-lg p-4 bg-slate-50 relative">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-bold text-slate-800">{poll.title}</h4>
                      <p className="text-xs text-slate-500">{poll.question}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${poll.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                          {poll.active ? 'Activa' : 'Cerrada'}
                        </span>
                        <span className="text-[10px] text-slate-500 font-bold">Total de votos: {poll._count.votes}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleToggleStatus(poll.id, poll.active)} className="text-xs h-7">
                        <PowerOff className={`w-3 h-3 mr-1 ${poll.active ? 'text-amber-500' : 'text-emerald-500'}`} />
                        {poll.active ? 'Apagar' : 'Encender'}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(poll.id)} className="text-red-500 hover:text-red-600 hover:bg-red-50 text-xs h-7">
                        <Trash2 className="w-3 h-3 mr-1" /> Borrar
                      </Button>
                    </div>
                  </div>
                  
                  <Table className="text-xs bg-white border rounded-md">
                    <TableHeader>
                      <TableRow className="bg-slate-100">
                        <TableHead className="font-bold w-full">Opción</TableHead>
                        <TableHead className="font-bold text-right">Votos Absolutos</TableHead>
                        <TableHead className="font-bold text-right">%</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {poll.options.map((opt: any) => {
                        const count = opt._count.votes || 0;
                        const percentage = poll._count.votes > 0 ? Math.round((count / poll._count.votes) * 100) : 0;
                        return (
                          <TableRow key={opt.id}>
                            <TableCell className="font-medium text-slate-700">{opt.text}</TableCell>
                            <TableCell className="text-right font-bold text-indigo-600">{count}</TableCell>
                            <TableCell className="text-right text-slate-500">{percentage}%</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
