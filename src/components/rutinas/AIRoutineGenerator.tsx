"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PremiumButton } from "@/components/ui/premium-button";
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
import { evaluateSplitAction } from "@/app/actions/evaluate-split";

export default function AIRoutineGenerator({ onRoutineGenerated }: { onRoutineGenerated: (routine: Routine) => void }) {
    // ... (existing hooks)
    const { profile } = useUser();
    const { workoutLogs } = useAvances();
    const { ejercicios: availableExercises } = useEjercicios();

    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [prompt, setPrompt] = useState("");
    const [generatedRoutine, setGeneratedRoutine] = useState<Routine | null>(null);

    // Generation Config State
    const [generationType, setGenerationType] = useState<"week" | "day">("week"); // New
    const [splitSelectionMode, setSplitSelectionMode] = useState<"auto" | "manual">("auto"); // New
    const [customSplit, setCustomSplit] = useState<{ day: number, muscles: string[] }[]>([
        { day: 1, muscles: [] }
    ]); // New
    const [splitEvaluation, setSplitEvaluation] = useState<{ score: number, explanation: string } | null>(null); // New

    // ... (existing swap state)
    const [swappingExercise, setSwappingExercise] = useState<{ dayIndex: number, exerciseIndex: number, exercise: Exercise } | null>(null);
    const [swapReason, setSwapReason] = useState("");
    const [isSwapping, setIsSwapping] = useState(false);

    // ... (existing advanced options)
    const [splitType, setSplitType] = useState("auto");
    const [sessionDuration, setSessionDuration] = useState("45");
    const [intensity, setIntensity] = useState("moderate");
    const [specificFocus, setSpecificFocus] = useState("balanced");
    const [repRange, setRepRange] = useState("auto");
    const [showAdvanced, setShowAdvanced] = useState(false);

    const getHistorySummary = () => {
        if (!workoutLogs || workoutLogs.length === 0) return "";

        // Ordenar por fecha descendente (más reciente primero) y tomar los últimos 7 días de entrenamiento efectivo
        const recentLogs = [...workoutLogs]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 7);

        return recentLogs.map((log: WorkoutLog) => {
            const date = new Date(log.date).toLocaleDateString("es-ES", { weekday: 'short', day: 'numeric', month: 'short' });

            // Extraer ejercicios detallados si existen
            const exercisesInfo = log.detailedLogs && log.detailedLogs.length > 0
                ? log.detailedLogs.map(l => l.exerciseName).join(", ")
                : `${log.exercisesCompleted} ejercicios (sin detalle)`;

            return `- ${date} [${log.routineName || 'Entrenamiento'}]: ${exercisesInfo}`;
        }).join("\n");
    };

    const handleAnalyzeSplit = async () => {
        const userContext = {
            level: profile?.level || "Intermedio",
            goal: profile?.goal || "Hipertrofia",
            days: customSplit.length, // Use custom split length
        };
        const result = await evaluateSplitAction(customSplit, userContext as any); // Cast for minimal context
        setSplitEvaluation(result);
    };

    const handleGenerate = async () => {
        if (!prompt && splitSelectionMode === 'auto') return; // Prompt required for auto

        // Validation for manual mode
        if (generationType === 'week' && splitSelectionMode === 'manual') {
            const emptyDays = customSplit.some(d => d.muscles.length === 0);
            if (emptyDays) {
                toast.error("Por favor selecciona músculos para todos los días definidos.");
                return;
            }
        }

        setLoading(true);
        try {
            const userContext = {
                level: profile?.level || "Intermedio",
                goal: profile?.goal || "Hipertrofia",
                days: generationType === 'week'
                    ? (splitSelectionMode === 'manual' ? customSplit.length : (profile?.days || 4))
                    : 1, // Single day = 1
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
                splitType: generationType === 'week' && splitSelectionMode === 'auto' && splitType !== "auto" ? splitType : undefined,
                sessionDuration: parseInt(sessionDuration),
                intensity,
                specificFocus: specificFocus !== "balanced" ? specificFocus : undefined,
                repRange: repRange !== "auto" ? repRange : undefined,
                // Pass Custom Split Info via context or a new param
                generationType,
                customSplit: splitSelectionMode === 'manual' ? customSplit : undefined
            };

            // Note: I need to update generateRoutineAction signature OR pack this into context.
            // For now, packing into checking context or a new argument?
            // The easiest is to inject it into the Prompt text or handle it inside the action if I pass it.
            // I will opt to pass it as part of the context object which is flexible, but I'll need to update the type definition of UserContext if I want to be strict,
            // OR just cast it here.
            // Let's rely on the prompt construction in the server action to handle "Custom Split".

            const result = await generateRoutineAction(prompt, enhancedContext as any, cleanExercises, historySummary);
            setGeneratedRoutine(result);
            toast.success("¡Rutina generada con éxito!");
        } catch (e) {
            console.error(e);
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
                <PremiumButton className="gradient-ai-routine hover:gradient-ai-routine-hover text-white shadow-lg shadow-purple-500/25">
                    <FaMagic className="mr-2" /> Generar con IA
                </PremiumButton>
            </DialogTrigger>
            <DialogContent className="glass-dialog w-full max-w-2xl md:max-w-4xl lg:max-w-5xl h-[85vh] flex flex-col p-6">
                <DialogHeader className="shrink-0">
                    <DialogTitle className="flex items-center gap-2 text-2xl bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                        <FaMagic /> Diseñador de Rutinas IA
                    </DialogTitle>
                    <DialogDescription>
                        Configura tu rutina semanal o sesión única.
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
                            // New Props
                            generationType={generationType}
                            setGenerationType={setGenerationType}
                            splitSelectionMode={splitSelectionMode}
                            setSplitSelectionMode={setSplitSelectionMode}
                            customSplit={customSplit}
                            setCustomSplit={setCustomSplit}
                            splitEvaluation={splitEvaluation}
                            onAnalyzeSplit={handleAnalyzeSplit}
                        />
                    ) : (
                        // ... existing preview
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

                {/* ... Swap Dialog ... */}
                <Dialog open={!!swappingExercise} onOpenChange={(open) => !open && setSwappingExercise(null)}>
                    {/* ... existing swap content ... */}
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
                            <PremiumButton variant="ghost" onClick={() => setSwappingExercise(null)}>Cancelar</PremiumButton>
                            <PremiumButton onClick={handleSwapExercise} disabled={isSwapping} className="bg-primary">
                                {isSwapping ? <FaSpinner className="animate-spin" /> : "Buscar Reemplazo"}
                            </PremiumButton>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

            </DialogContent>
        </Dialog >
    );
}
