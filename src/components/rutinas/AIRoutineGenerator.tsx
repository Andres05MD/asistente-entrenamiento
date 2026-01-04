"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FaMagic, FaSpinner } from "react-icons/fa";
import { generateRoutineAction } from "@/app/actions/generate-routine";
import { swapExerciseAction } from "@/app/actions/swap-exercise";
import toast from "react-hot-toast";
import { Routine, Exercise, WorkoutLog } from "@/types";
import { useUser, useAvances, useEjercicios } from "@/hooks/useData";
import { RoutinePreferencesForm } from "./RoutinePreferencesForm";
import { GeneratedRoutinePreview } from "./GeneratedRoutinePreview";

export default function AIRoutineGenerator({ onRoutineGenerated }: { onRoutineGenerated: (routine: Routine) => void }) {
    const { profile } = useUser();
    const { workoutLogs } = useAvances();
    const { ejercicios: availableExercises } = useEjercicios();

    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [prompt, setPrompt] = useState("");
    const [generatedRoutine, setGeneratedRoutine] = useState<Routine | null>(null);

    // Swap State
    const [swappingExercise, setSwappingExercise] = useState<{ dayIndex: number, exerciseIndex: number, exercise: Exercise } | null>(null);
    const [swapReason, setSwapReason] = useState("");
    const [isSwapping, setIsSwapping] = useState(false);

    // Advanced Options
    const [splitType, setSplitType] = useState("auto");
    const [sessionDuration, setSessionDuration] = useState("45");
    const [intensity, setIntensity] = useState("moderate");
    const [specificFocus, setSpecificFocus] = useState("balanced");
    const [repRange, setRepRange] = useState("auto");
    const [showAdvanced, setShowAdvanced] = useState(false);

    const getHistorySummary = () => {
        if (!workoutLogs || workoutLogs.length === 0) return "";
        const recentLogs = workoutLogs.slice(-5);

        return recentLogs.map((log: WorkoutLog) => {
            const date = new Date(log.date).toLocaleDateString();
            const volume = (log.totalVolume / 1000).toFixed(1) + "t";
            return `- ${date}: ${log.exercisesCompleted} ejercicios (${volume})`;
        }).join("\n");
    };

    const handleGenerate = async () => {
        if (!prompt) return;
        setLoading(true);
        try {
            const userContext = {
                level: profile?.level || "Intermedio",
                goal: profile?.goal || "Hipertrofia",
                days: profile?.days || 4,
                equipment: profile?.equipment || "Gimnasio Comercial",
                gender: profile?.gender,
                age: profile?.age
            };

            const historySummary = getHistorySummary();

            const cleanExercises = availableExercises
                .filter(e => e.id)
                .map(e => ({ id: e.id!, name: e.name }));

            const enhancedContext = {
                ...userContext,
                splitType: splitType !== "auto" ? splitType : undefined,
                sessionDuration: parseInt(sessionDuration),
                intensity,
                specificFocus: specificFocus !== "balanced" ? specificFocus : undefined,
                repRange: repRange !== "auto" ? repRange : undefined,
            };

            const result = await generateRoutineAction(prompt, enhancedContext, cleanExercises, historySummary);
            setGeneratedRoutine(result);
            toast.success("¡Rutina generada con éxito!");
        } catch {
            toast.error("Error al generar la rutina");
        } finally {
            setLoading(false);
        }
    };

    const handleSwapExercise = async () => {
        if (!swappingExercise || !generatedRoutine) return;
        setIsSwapping(true);

        try {
            const userContext = {
                level: profile?.level || "Intermedio",
                goal: profile?.goal || "Hipertrofia",
                days: profile?.days || 4,
                equipment: profile?.equipment || "Gimnasio Comercial",
                gender: profile?.gender,
                age: profile?.age
            };

            const cleanExercises = availableExercises
                .filter(e => e.id)
                .map(e => ({ id: e.id!, name: e.name }));

            const newExercise = await swapExerciseAction(
                swappingExercise.exercise,
                swapReason,
                userContext,
                cleanExercises
            );

            const updatedRoutine = { ...generatedRoutine };
            updatedRoutine.days[swappingExercise.dayIndex].exercises[swappingExercise.exerciseIndex] = newExercise;

            setGeneratedRoutine(updatedRoutine);
            setSwappingExercise(null);
            setSwapReason("");
            toast.success("Ejercicio reemplazado");
        } catch (error) {
            toast.error("No se pudo reemplazar el ejercicio");
        } finally {
            setIsSwapping(false);
        }
    };

    const handleSave = () => {
        if (generatedRoutine) {
            onRoutineGenerated(generatedRoutine);
            setOpen(false);
            setGeneratedRoutine(null);
            setPrompt("");
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gradient-ai-routine hover:gradient-ai-routine-hover text-white shadow-lg shadow-purple-500/25">
                    <FaMagic className="mr-2" /> Generar con IA
                </Button>
            </DialogTrigger>
            <DialogContent className="glass-dialog w-full max-w-2xl md:max-w-4xl lg:max-w-5xl h-[85vh] flex flex-col p-6">
                <DialogHeader className="shrink-0">
                    <DialogTitle className="flex items-center gap-2 text-2xl bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                        <FaMagic /> Diseñador de Rutinas IA
                    </DialogTitle>
                    <DialogDescription>
                        La IA utilizará tu biblioteca y tu historial para crear el plan perfecto.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 min-h-0 mt-4 overflow-hidden flex flex-col">
                    {!generatedRoutine ? (
                        <RoutinePreferencesForm
                            prompt={prompt}
                            setPrompt={setPrompt}
                            loading={loading}
                            showAdvanced={showAdvanced}
                            setShowAdvanced={setShowAdvanced}
                            handleGenerate={handleGenerate}
                            workoutLogs={workoutLogs}
                            splitType={splitType}
                            setSplitType={setSplitType}
                            sessionDuration={sessionDuration}
                            setSessionDuration={setSessionDuration}
                            intensity={intensity}
                            setIntensity={setIntensity}
                            repRange={repRange}
                            setRepRange={setRepRange}
                            specificFocus={specificFocus}
                            setSpecificFocus={setSpecificFocus}
                        />
                    ) : (
                        <GeneratedRoutinePreview
                            routine={generatedRoutine}
                            onDiscard={() => setGeneratedRoutine(null)}
                            onSave={handleSave}
                            onSwapExercise={(dayIndex, exerciseIndex, exercise) =>
                                setSwappingExercise({ dayIndex, exerciseIndex, exercise })
                            }
                        />
                    )}
                </div>

                {/* Swap Dialog */}
                <Dialog open={!!swappingExercise} onOpenChange={(open) => !open && setSwappingExercise(null)}>
                    <DialogContent className="bg-zinc-950/95 backdrop-blur-xl border-white/10 text-white z-50">
                        <DialogHeader>
                            <DialogTitle>Cambiar Ejercicio</DialogTitle>
                            <DialogDescription>
                                Reemplazando: <span className="text-primary font-bold">{swappingExercise?.exercise.name}</span>
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                            <Label>¿Por qué quieres cambiarlo? (Opcional)</Label>
                            <Input
                                placeholder="Ej: Me duelen los hombros, no tengo esa máquina..."
                                value={swapReason}
                                onChange={(e) => setSwapReason(e.target.value)}
                                className="bg-white/5 border-white/10"
                            />
                            <p className="text-xs text-muted-foreground">La IA te sugerirá la mejor alternativa biomecánica.</p>
                        </div>
                        <DialogFooter>
                            <Button variant="ghost" onClick={() => setSwappingExercise(null)}>Cancelar</Button>
                            <Button onClick={handleSwapExercise} disabled={isSwapping} className="bg-primary">
                                {isSwapping ? <FaSpinner className="animate-spin" /> : "Buscar Reemplazo"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

            </DialogContent>
        </Dialog >
    );
}
