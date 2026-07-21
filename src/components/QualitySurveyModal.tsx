"use client";

import React, { useState, useEffect } from "react";
import { Star, X, Loader2, HeartHandshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { checkSurveyEligibility, submitFeedbackSurvey } from "@/app/actions";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export function QualitySurveyModal() {
    const [open, setOpen] = useState(false);
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comments, setComments] = useState("");
    const [canContact, setCanContact] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        // Delay checking to not impact initial page load performance
        const checkEligibility = async () => {
            // Give the app time to load the main UI (3 seconds)
            await new Promise(resolve => setTimeout(resolve, 3000));
            const res = await checkSurveyEligibility();
            if (res.eligible) {
                setOpen(true);
            }
        };

        checkEligibility();
    }, []);

    const handleSubmit = async () => {
        if (rating === 0) return;
        setSubmitting(true);
        const res = await submitFeedbackSurvey({ rating, comments, canContact });
        setSubmitting(false);
        if (res.success) {
            setSubmitted(true);
            setTimeout(() => {
                setOpen(false);
            }, 3000);
        } else {
            alert(res.message || "Ocurrió un error al enviar tus respuestas.");
        }
    };

    const isLowRating = rating > 0 && rating <= 3;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[425px] overflow-hidden p-0 bg-white dark:bg-zinc-950 border-0 shadow-2xl rounded-2xl">
                {!submitted ? (
                    <div className="flex flex-col relative">
                        {/* Header Gradient */}
                        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-indigo-50 dark:from-indigo-950/30 to-transparent pointer-events-none"></div>
                        
                        <div className="p-6 pt-8 relative z-10 flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-white dark:bg-zinc-900 shadow-xl rounded-2xl flex items-center justify-center mb-6 border border-slate-100 dark:border-zinc-800 rotate-3 transition-transform hover:rotate-6">
                                <HeartHandshake className="w-8 h-8 text-indigo-500" />
                            </div>
                            
                            <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-2 tracking-tight">¿Qué tal tu experiencia?</h2>
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium px-4 mb-8">
                                Tu opinión es vital para nosotros. Califícanos para seguir mejorando.
                            </p>

                            {/* Stars */}
                            <div className="flex gap-2 mb-8 justify-center">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        className="relative group transition-all duration-200 focus:outline-none"
                                        onMouseEnter={() => setHoverRating(star)}
                                        onMouseLeave={() => setHoverRating(0)}
                                        onClick={() => setRating(star)}
                                    >
                                        <Star 
                                            className={`w-10 h-10 sm:w-12 sm:h-12 transition-all duration-300 ${
                                                (hoverRating || rating) >= star 
                                                    ? "fill-yellow-400 text-yellow-400 scale-110 drop-shadow-md" 
                                                    : "text-slate-200 dark:text-zinc-800 scale-100 hover:scale-105"
                                            }`} 
                                        />
                                    </button>
                                ))}
                            </div>

                            {/* Conditional form fields for low rating */}
                            {isLowRating && (
                                <div className="w-full text-left space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300 mb-6 bg-slate-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-slate-100 dark:border-zinc-800">
                                    <div className="space-y-2">
                                        <label htmlFor="comments" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                                            ¿Qué podríamos mejorar para ganar 5 estrellas?
                                        </label>
                                        <textarea 
                                            id="comments"
                                            className="w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none placeholder:text-slate-400 dark:placeholder:text-zinc-600 transition-all"
                                            rows={3}
                                            placeholder="Tus comentarios son muy valiosos..."
                                            value={comments}
                                            onChange={(e) => setComments(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-5 items-center">
                                            <input 
                                                id="contact" 
                                                type="checkbox" 
                                                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:checked:bg-indigo-500 cursor-pointer"
                                                checked={canContact}
                                                onChange={(e) => setCanContact(e.target.checked)}
                                            />
                                        </div>
                                        <label htmlFor="contact" className="text-xs font-medium text-slate-600 dark:text-slate-400 leading-snug cursor-pointer select-none">
                                            ¿Nos permites contactarte para entender mejor tu caso?
                                        </label>
                                    </div>
                                </div>
                            )}

                            {/* Submit Button */}
                            <Button 
                                onClick={handleSubmit} 
                                disabled={rating === 0 || submitting}
                                className={`w-full font-bold h-12 text-sm transition-all duration-300 shadow-lg ${
                                    rating > 0 
                                        ? "bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-indigo-500/25" 
                                        : "bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 opacity-50 cursor-not-allowed shadow-none"
                                }`}
                            >
                                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Enviar Calificación"}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="p-10 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-500 h-64">
                        <div className="w-20 h-20 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-6">
                            <Star className="w-10 h-10 fill-green-500 text-green-500" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-2">¡Gracias por tu opinión!</h2>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">Hemos registrado tu calificación.</p>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
