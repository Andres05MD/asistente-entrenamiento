"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useRutinas, useAvances } from "@/hooks/useData";
import { useEntrenamiento } from "@/hooks/useEntrenamiento";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { FaClock, FaCheckCircle, FaSave } from "react-icons/fa";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Exercise, DayRoutine, ExerciseLog } from "@/types";

interface ActiveSet {
    reps: string;
    weight: string;
    completed: boolean;
    isSuggested?: boolean;
}

interface ActiveExercise extends Exercise {
    activeSets: ActiveSet[];
    rpe?: number; // 1-10 Scale
    feedback?: string;
}

export default function ActiveTrainingPage() {
    const params = useParams();
    const router = useRouter();
    const { rutinas, isLoading: loadingRoutine } = useRutinas();
    const { workoutLogs } = useAvances(); // Get history
    const { saveWorkoutLog } = useEntrenamiento();

    const [activeRoutine, setActiveRoutine] = useState<DayRoutine | null>(null);
    const [routineName, setRoutineName] = useState("");
    const [elapsedTime, setElapsedTime] = useState(0);
    const [isRunning, setIsRunning] = useState(false); // Timer state
    const [exercises, setExercises] = useState<ActiveExercise[]>([]);

    // Rest Timer State
    const [restTimer, setRestTimer] = useState(0);
    const [isResting, setIsResting] = useState(false);

    // Smart History: Process logs to find the last time each exercise was performed
    const lastPerformances = useMemo(() => {
        if (!workoutLogs || workoutLogs.length === 0) return {};

        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const map: Record<string, any[]> = {};

            // Limit to last 50 logs to prevent performance issues on huge histories
            const recentLogs = workoutLogs.slice(-50).reverse(); // Newest first

            for (const log of recentLogs) {
                if (!log.detailedLogs) continue;

                for (const detail of log.detailedLogs) {
                    // Only store if we haven't found a more recent one
                    if (!map[detail.exerciseName]) {
                        map[detail.exerciseName] = detail.sets;
                    }
                }
            }
            return map;
        } catch (error) {
            console.error("Error processing history", error);
            return {};
        }
    }, [workoutLogs]);

    // Find routine and apply Smart Suggestions
    useEffect(() => {
        if (rutinas.length > 0 && params.id && Object.keys(lastPerformances).length >= 0) {
            const routine = rutinas.find(r => r.id === params.id);
            if (routine && routine.days.length > 0) {
                const day = routine.days[0];
                setRoutineName(routine.routineName);
                setActiveRoutine(day);

                // Initialize exercises with Progressive Overload Logic
                const initialExercises = day.exercises.map(ex => {
                    const numSets = parseInt(ex.sets || "3", 10) || 3;
                    const prevSets = lastPerformances[ex.name];

                    // Find best previous set (max weight) to base suggestions on
                    const bestPrevSet = prevSets ? [...prevSets].sort((a, b) => b.weight - a.weight)[0] : null;

                    return {
                        ...ex,
                        activeSets: Array(numSets).fill(null).map((_, idx) => {
                            let suggestedWeight = "0";
                            let suggestedReps = ex.reps?.split('-')[0] || "10"; // Default to bottom of range
                            let isSuggested = false;

                            if (bestPrevSet) {
                                isSuggested = true;
                                const lastWeight = parseFloat(bestPrevSet.weight);
                                const lastReps = parseFloat(bestPrevSet.reps);

                                // Progressive Overload Algo:
                                // If last time they did > 10 reps or hit the top of typical range, suggest +2.5kg
                                if (lastReps >= 10) {
                                    suggestedWeight = (lastWeight + 2.5).toString();
                                    suggestedReps = (Math.max(6, lastReps - 2)).toString(); // Drop reps slightly when increasing weight
                                } else {
                                    // Otherwise keep weight, try to add 1 rep
                                    suggestedWeight = lastWeight.toString();
                                    suggestedReps = (lastReps + 1).toString();
                                }
                            }

                            return {
                                reps: suggestedReps,
                                weight: suggestedWeight,
                                completed: false,
                                isSuggested
                            };
                        })
                    };
                });
                setExercises(initialExercises);
                setIsRunning(true);
            }
        }
    }, [rutinas, params.id, lastPerformances]);

    // Timer Logic (Workout Duration)
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isRunning) {
            interval = setInterval(() => {
                setElapsedTime(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isRunning]);

    // Rest Timer Logic
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isResting && restTimer > 0) {
            interval = setInterval(() => {
                setRestTimer(prev => prev - 1);
            }, 1000);
        } else if (isResting && restTimer === 0) {
            playTimerFinishedSound();
            setIsResting(false);
            toast.success("¡Descanso terminado!", { icon: '🔔' });
        }
        return () => clearInterval(interval);
    }, [isResting, restTimer]);

    const playTimerFinishedSound = () => {
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContext) return;

            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.type = "sine";
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.5);
            gain.gain.setValueAtTime(0.5, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

            osc.start();
            osc.stop(ctx.currentTime + 0.5);
        } catch (e) {
            console.error("Audio playback failed", e);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleSetChange = (exIndex: number, setIndex: number, field: keyof ActiveSet, value: string | boolean) => {
        setExercises(prevExercises => {
            const newExercises = [...prevExercises];
            const updatedExercise = { ...newExercises[exIndex] };
            const updatedSets = [...updatedExercise.activeSets];

            updatedSets[setIndex] = {
                ...updatedSets[setIndex],
                [field]: value
            };

            updatedExercise.activeSets = updatedSets;
            newExercises[exIndex] = updatedExercise;

            return newExercises;
        });

        if (field === "completed" && value === true) {
            const exercise = exercises[exIndex];
            const exerciseRestString = exercise.rest || "60s";
            const restSeconds = parseInt(exerciseRestString.replace(/\D/g, '')) || 60;

            setRestTimer(restSeconds);
            setIsResting(true);
        }
    };

    const handleFeedbackChange = (exIndex: number, field: 'rpe' | 'feedback', value: number | string) => {
        setExercises(prev => {
            const newEx = [...prev];
            newEx[exIndex] = { ...newEx[exIndex], [field]: value };
            return newEx;
        });
    };

    const skipRest = () => {
        setIsResting(false);
        setRestTimer(0);
    };

    const finishWorkout = async () => {
        setIsRunning(false);

        let totalVolume = 0;
        let setsCompleted = 0;

        exercises.forEach(ex => {
            ex.activeSets.forEach(set => {
                if (set.completed) {
                    const weight = parseFloat(set.weight) || 0;
                    const reps = parseFloat(set.reps) || 0;
                    totalVolume += weight * reps;
                    setsCompleted++;
                }
            });
        });

        const detailedLogs = exercises.map(ex => {
            const completedSets = ex.activeSets.map((set, index) => ({
                setNumber: index + 1,
                weight: parseFloat(set.weight) || 0,
                reps: parseFloat(set.reps) || 0,
                completed: set.completed
            })).filter(set => set.completed);

            if (completedSets.length === 0) return null;

            return {
                exerciseName: ex.name,
                exerciseId: ex.id,
                sets: completedSets,
                // Add optional feedback to logs if needed in backend (currently not in ExerciseLog type but good to have prepared)
                notes: ex.feedback,
                rpe: ex.rpe
            };
        }).filter(Boolean) as ExerciseLog[];

        if (setsCompleted === 0) {
            toast.error("No has completado ninguna serie.");
            return;
        }

        try {
            await saveWorkoutLog.mutateAsync({
                date: new Date().toISOString(),
                duration: Math.floor(elapsedTime / 60),
                totalVolume,
                routineName: routineName,
                exercisesCompleted: setsCompleted,
                detailedLogs: detailedLogs
            });

            router.push("/dashboard/avances");
        } catch (error) {
            console.error(error);
            setIsRunning(true);
        }
    };

    if (loadingRoutine || !activeRoutine) {
        return <div className="p-8 text-center text-muted-foreground">Cargando entrenamiento...</div>;
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6 pb-24">
            {/* Header / Timer Sticky */}
            <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-md border-b border-white/10 p-4 -mx-4 md:mx-0 md:rounded-b-xl flex justify-between items-center transition-colors duration-300">
                <div>
                    <h1 className="text-lg font-bold text-white truncate max-w-[200px]">{routineName}</h1>
                    <p className="text-xs text-muted-foreground">{activeRoutine.dayName}</p>
                </div>

                <div className="flex items-center gap-4">
                    {/* Rest Timer Badge */}
                    {isResting && (
                        <div
                            className="flex items-center gap-2 bg-blue-900/50 border border-blue-500/30 px-3 py-1.5 rounded-full cursor-pointer hover:bg-blue-900/70 transition-colors animate-pulse"
                            onClick={skipRest}
                        >
                            <span className="text-xs text-blue-200 font-medium uppercase">Descanso</span>
                            <span className="font-mono text-lg font-bold text-blue-400 w-[50px] text-center">
                                {formatTime(restTimer)}
                            </span>
                        </div>
                    )}

                    {/* Main Timer */}
                    <div className={`flex items-center gap-2 font-mono text-xl font-bold ${isResting ? 'text-muted-foreground text-base' : 'text-primary'}`}>
                        <FaClock className={isResting ? "w-4 h-4" : ""} />
                        {formatTime(elapsedTime)}
                    </div>
                </div>
            </div>

            {/* Exercise List */}
            <div className="space-y-6">
                {exercises.map((exercise, exIndex) => {
                    const prevSets = lastPerformances[exercise.name];

                    return (
                        <Card key={exIndex} className="bg-card/50 backdrop-blur-xl border-white/5 overflow-hidden">
                            <CardHeader className="bg-white/5 py-3">
                                <CardTitle className="text-base flex justify-between items-start">
                                    <div className="flex flex-col gap-1">
                                        <span>{exercise.name}</span>
                                        {exercise.grip && (
                                            <span className="text-[10px] text-orange-400 font-normal">
                                                {exercise.grip}
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-xs font-normal text-muted-foreground bg-black/40 px-2 py-1 rounded shrink-0 ml-2">
                                        {exercise.rest || "60s"} descanso
                                    </span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                {/* Headers */}
                                <div className="grid grid-cols-10 gap-2 p-2 text-xs text-muted-foreground text-center bg-black/20">
                                    <div className="col-span-1">SET</div>
                                    <div className="col-span-2">PREV</div>
                                    <div className="col-span-3">KG</div>
                                    <div className="col-span-3">REPS</div>
                                    <div className="col-span-1"><FaCheckCircle className="mx-auto" /></div>
                                </div>

                                {/* Sets */}
                                {exercise.activeSets.map((set, setIndex) => {
                                    const prevSet = prevSets ? prevSets[setIndex] : null;

                                    return (
                                        <motion.div
                                            key={setIndex}
                                            initial={false}
                                            animate={{ backgroundColor: set.completed ? "rgba(16, 185, 129, 0.1)" : "transparent" }}
                                            className={`grid grid-cols-10 gap-2 p-2 items-center border-b border-white/5 last:border-0 ${set.completed ? "text-green-400" : ""}`}
                                        >
                                            <div className="col-span-1 text-center font-mono text-sm opacity-50">{setIndex + 1}</div>
                                            <div className="col-span-2 text-center text-xs opacity-50 font-mono">
                                                {prevSet ? `${prevSet.reps}x${prevSet.weight}` : "-"}
                                            </div>
                                            <div className="col-span-3 relative">
                                                <Input
                                                    type="number"
                                                    value={set.weight}
                                                    onChange={(e) => handleSetChange(exIndex, setIndex, "weight", e.target.value)}
                                                    className={`h-8 text-center bg-black/20 focus:border-primary/50 ${set.isSuggested && !set.completed ? 'border-purple-500/60 text-purple-200' : 'border-white/10'}`}
                                                    placeholder="0"
                                                />
                                                {set.isSuggested && !set.completed && (
                                                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-purple-500 rounded-full animate-pulse" title="Sugerencia Inteligente" />
                                                )}
                                            </div>
                                            <div className="col-span-3 relative">
                                                <Input
                                                    type="number"
                                                    value={set.reps}
                                                    onChange={(e) => handleSetChange(exIndex, setIndex, "reps", e.target.value)}
                                                    className={`h-8 text-center bg-black/20 focus:border-primary/50 ${set.isSuggested && !set.completed ? 'border-purple-500/60 text-purple-200' : 'border-white/10'}`}
                                                    placeholder="0"
                                                />
                                            </div>
                                            <div className="col-span-1 flex justify-center">
                                                <Checkbox
                                                    checked={set.completed}
                                                    onCheckedChange={(checked: boolean | string) => handleSetChange(exIndex, setIndex, "completed", !!checked)}
                                                    className="data-[state=checked]:bg-green-500 border-white/20"
                                                />
                                            </div>
                                        </motion.div>
                                    );
                                })}

                                {/* Feedback Section */}
                                <div className="p-3 border-t border-white/5 bg-black/40 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-muted-foreground">Dificultad (RPE):</span>
                                        <div className="flex gap-1">
                                            {[
                                                { val: 7, label: "Justo", color: "bg-green-500/20 text-green-400 hover:bg-green-500/30 border-green-500/20" },
                                                { val: 9, label: "Difícil", color: "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 border-yellow-500/20" },
                                                { val: 10, label: "Fallo", color: "bg-red-500/20 text-red-400 hover:bg-red-500/30 border-red-500/20" }
                                            ].map((opt) => (
                                                <button
                                                    key={opt.val}
                                                    onClick={() => handleFeedbackChange(exIndex, 'rpe', exercise.rpe === opt.val ? 0 : opt.val)}
                                                    className={`px-3 py-1 rounded text-xs border transition-all ${exercise.rpe === opt.val ? opt.color.replace('/20', '/50') : 'border-transparent bg-white/5 text-muted-foreground hover:bg-white/10'}`}
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {(exercise.rpe && exercise.rpe >= 9) && (
                                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                                            <Input
                                                placeholder="¿Qué complicación tuviste?"
                                                className="h-8 text-xs bg-black/20 border-white/10 mt-2"
                                                value={exercise.feedback || ""}
                                                onChange={(e) => handleFeedbackChange(exIndex, 'feedback', e.target.value)}
                                            />
                                        </motion.div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Finish Button Fixed Bottom */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/95 to-transparent z-20 md:relative md:bg-none md:p-0">
                <Button
                    size="lg"
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-bold h-14 shadow-green-900/20 shadow-lg text-lg"
                    onClick={finishWorkout}
                    disabled={saveWorkoutLog.isPending}
                >
                    {saveWorkoutLog.isPending ? "Guardando..." : <><FaSave className="mr-2" /> Completar Entrenamiento</>}
                </Button>
            </div>
        </div>
    );
}
