"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2, Sparkles } from "lucide-react";
import { getActivePolls, voteOnPoll } from "@/app/actions";

export default function VotacionesClient() {
  const [polls, setPolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);

  useEffect(() => {
    fetchPolls();
  }, []);

  const fetchPolls = async () => {
    setLoading(true);
    const res = await getActivePolls();
    if (res.success && res.polls) {
      setPolls(res.polls);
    }
    setLoading(false);
  };

  const handleVote = async (pollId: string) => {
    const optionId = selectedOptions[pollId];
    if (!optionId) return;

    setSubmitting(pollId);
    const res = await voteOnPoll(pollId, optionId);
    if (res.success) {
      await fetchPolls(); // Refresh to show results
    } else {
      alert(res.message);
    }
    setSubmitting(null);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600 mb-4" />
        <p className="text-slate-500 font-medium">Buscando encuestas activas...</p>
      </div>
    );
  }

  if (polls.length === 0) {
    return (
      <Card className="border-dashed border-2 shadow-sm bg-slate-50/50">
        <CardContent className="flex flex-col items-center justify-center h-64 text-center">
          <Sparkles className="h-12 w-12 text-slate-300 mb-4" />
          <h3 className="text-lg font-bold text-slate-700">No hay votaciones activas</h3>
          <p className="text-slate-500 max-w-sm mt-2">
            El equipo de dirección aún no ha publicado nuevas propuestas para votar. ¡Mantente atento a las próximas mejoras!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {polls.map((poll) => {
        const hasVoted = poll.votes && poll.votes.length > 0;
        const totalVotes = poll._count?.votes || 0;

        return (
          <Card key={poll.id} className="border shadow-sm overflow-hidden relative">
            {hasVoted && (
              <div className="absolute top-0 right-0 bg-teal-600 text-white text-[10px] font-bold uppercase px-3 py-1 rounded-bl-lg shadow-sm flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Voto Registrado
              </div>
            )}
            <CardHeader className="bg-slate-50/50 border-b pb-6">
              <CardTitle className="text-xl text-slate-800">{poll.title}</CardTitle>
              <CardDescription className="text-base text-slate-600 mt-2 font-medium">
                {poll.question}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {hasVoted ? (
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-700 mb-4">Resultados actuales:</h4>
                  {poll.options.map((option: any) => {
                    const optionVotes = option._count?.votes || 0;
                    const percentage = totalVotes > 0 ? Math.round((optionVotes / totalVotes) * 100) : 0;
                    const isMyVote = poll.votes.some((v: any) => v.optionId === option.id);

                    return (
                      <div key={option.id} className="relative">
                        <div className="flex justify-between text-sm mb-1 z-10 relative px-1">
                          <span className={`font-medium ${isMyVote ? 'text-teal-900 font-bold' : 'text-slate-700'}`}>
                            {option.text} {isMyVote && "(Tu voto)"}
                          </span>
                          <span className="font-bold text-slate-600">{percentage}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200">
                          <div 
                            className={`h-full rounded-full transition-all duration-1000 ease-out ${isMyVote ? 'bg-teal-500' : 'bg-slate-300'}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  <div className="mt-6 p-3 bg-teal-50 border border-teal-100 rounded-lg text-sm text-teal-800 text-center font-medium">
                    ¡Gracias por participar en la evolución de nuestra plataforma!
                  </div>
                </div>
              ) : (
                <RadioGroup 
                  onValueChange={(val) => setSelectedOptions(prev => ({ ...prev, [poll.id]: val }))}
                  value={selectedOptions[poll.id]}
                  className="space-y-3"
                >
                  {poll.options.map((option: any) => (
                    <div key={option.id} className={`flex items-center space-x-3 border p-4 rounded-lg cursor-pointer transition-all ${selectedOptions[poll.id] === option.id ? 'border-teal-600 bg-teal-50/30 shadow-sm' : 'border-slate-200 hover:border-teal-300'}`}>
                      <RadioGroupItem value={option.id} id={`opt-${option.id}`} className="text-teal-600" />
                      <Label htmlFor={`opt-${option.id}`} className="flex-1 cursor-pointer font-medium text-slate-700">
                        {option.text}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}
            </CardContent>
            {!hasVoted && (
              <CardFooter className="bg-slate-50 border-t py-4">
                <Button 
                  onClick={() => handleVote(poll.id)}
                  disabled={!selectedOptions[poll.id] || submitting === poll.id}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold"
                >
                  {submitting === poll.id ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Registrando voto...</>
                  ) : (
                    "Confirmar Mi Voto"
                  )}
                </Button>
              </CardFooter>
            )}
          </Card>
        );
      })}
    </div>
  );
}
