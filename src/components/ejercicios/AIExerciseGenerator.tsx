"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FaMagic, FaSpinner, FaDumbbell } from "react-icons/fa";
import { generateExerciseAction } from "@/app/actions/generate-exercise";
import toast from "react-hot-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Exercise } from "@/types";
import { useUser } from "@/hooks/useData";

export default function AIExerciseGenerator({ onExerciseGenerated }: { onExerciseGenerated: (exercise: Exercise) => void }) {
    const { profile } = useUser();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [prompt, setPrompt] = useState("");
    const [generatedExercise, setGeneratedExercise] = useState<Exercise | null>(null);

    const handleGenerate = async () => {
        if (!prompt) return;
        setLoading(true);
        try {
            const userContext = {
                level: profile?.level || "Intermedio",
                goal: profile?.goal || "Hipertrofia",
                days: profile?.days || 4,
                equipment: profile?.equipment || "Gimnasio Comercial",
                gender: profile?.gender // Pass gender
            };

            const result = await generateExerciseAction(prompt, userContext);
            setGeneratedExercise(result);
            toast.success("¡Ejercicio generado con éxito!");
        } catch {
            toast.error("Error al generar el ejercicio");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = () => {
        if (generatedExercise) {
            onExerciseGenerated(generatedExercise);
            setOpen(false);
            setGeneratedExercise(null);
            setPrompt("");
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gradient-ai-exercise hover:gradient-ai-exercise-hover text-white shadow-lg shadow-teal-500/20">
                    <FaMagic className="mr-2" /> Crear Ejercicio IA
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl bg-zinc-950/95 backdrop-blur-xl border-white/10 max-h-[85vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-2xl bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
                        <FaMagic /> Diseñador de Ejercicios IA
                    </DialogTitle>
                    <DialogDescription>
                        Describre lo que necesitas y la IA diseñará el ejercicio perfecto para ti.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 flex-1 overflow-y-auto">
                    {!generatedExercise ? (
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Descripción del ejercicio</Label>
                                <Textarea
                                    placeholder="Ej: Un ejercicio para tríceps que no dañe los codos..."
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    className="bg-white/5 border-white/10 min-h-[100px]"
                                />
                            </div>
                            <Button
                                onClick={handleGenerate}
                                disabled={loading || !prompt}
                                className="w-full bg-emerald-600 hover:bg-emerald-700"
                            >
                                {loading ? (
                                    <><FaSpinner className="animate-spin mr-2" /> Diseñando ejercicio...</>
                                ) : (
                                    "Generar Ejercicio"
                                )}
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <Card className="bg-white/5 border-white/10">
                                <CardContent className="p-6 space-y-4">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="text-xl font-bold text-white mb-1">{generatedExercise.name}</h3>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full border border-emerald-500/20">
                                                    {generatedExercise.muscleGroup || "General"}
                                                </span>
                                                {generatedExercise.grip && (
                                                    <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded-full border border-orange-500/20">
                                                        {generatedExercise.grip}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="p-3 bg-white/5 rounded-full">
                                            <FaDumbbell className="text-2xl text-white/50" />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-white/60 text-xs uppercase tracking-wider">Técnica</Label>
                                        <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                                            {generatedExercise.description}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <Button variant="outline" onClick={() => setGeneratedExercise(null)}>
                                    Descartar
                                </Button>
                                <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                    Guardar a mi Biblioteca
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
