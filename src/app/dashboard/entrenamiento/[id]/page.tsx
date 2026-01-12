"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useRutinas, useAvances } from "@/hooks/useData";
import { useEntrenamiento } from "@/hooks/useEntrenamiento";
import { useGamification } from "@/hooks/useGamification";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { FaClock, FaCheckCircle, FaSave, FaTrophy } from "react-icons/fa";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import confetti from "canvas-confetti";
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
    const { addXP } = useGamification();

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

    // 1RM Calculation Helper
    const calculate1RM = (weight: number, reps: number) => {
        if (weight === 0 || reps === 0) return 0;
        if (reps === 1) return weight;
        return Math.round(weight * (1 + reps / 30));
    };

    // Calculate Personal Records (All Time Best 1RM per exercise)
    const personalRecords = useMemo(() => {
        const records: Record<string, number> = {};
        if (!workoutLogs) return records;

        workoutLogs.forEach(log => {
            log.detailedLogs?.forEach(detail => {
                detail.sets.forEach(set => {
                    const oneRM = calculate1RM(set.weight, set.reps);
                    if (!records[detail.exerciseName] || oneRM > records[detail.exerciseName]) {
                        records[detail.exerciseName] = oneRM;
                    }
                });
            });
        });
        return records;
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
            toast("¡Tiempo de descanso terminado! A darle duro �", {
                icon: "🔔",
                style: {
                    borderRadius: '10px',
                    background: '#333',
                    color: '#fff',
                },
            });
        }
        return () => clearInterval(interval);
    }, [isResting, restTimer]);

    const playTimerFinishedSound = () => {
        const audio = new Audio('/sounds/timer-done.mp3'); // Ensure this file exists or use a robust solution
        audio.play().catch(e => console.log("Audio play failed", e));
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const handleSetChange = (exIndex: number, setIndex: number, field: keyof ActiveSet, value: string | boolean) => {
        setExercises(prev => {
            const newExercises = [...prev];
            const updatedExercise = { ...newExercises[exIndex] };
            const updatedSets = [...updatedExercise.activeSets];
            const updatedSet = { ...updatedSets[setIndex] };

            if (field === "weight" || field === "reps") {
                updatedSet[field] = value as string;
            } else if (field === "completed") {
                updatedSet.completed = value as boolean;
            }

            updatedSets[setIndex] = updatedSet;
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
        const newRecords: string[] = [];

        exercises.forEach(ex => {
            let maxOneRM = 0;
            ex.activeSets.forEach(set => {
                if (set.completed) {
                    const weight = parseFloat(set.weight) || 0;
                    const reps = parseFloat(set.reps) || 0;
                    totalVolume += weight * reps;
                    setsCompleted++;

                    // Calculate 1RM for this set
                    const estimated1RM = calculate1RM(weight, reps);
                    if (estimated1RM > maxOneRM) maxOneRM = estimated1RM;
                }
            });

            // Check if this is a new PR
            const previousRecord = personalRecords[ex.name] || 0;
            if (maxOneRM > previousRecord && maxOneRM > 0) {
                newRecords.push(`${ex.name}: ${maxOneRM}kg (Estimado 1RM)`);
            }
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
            setIsRunning(true);
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

            // Gamification: Calculate and Award XP
            const baseXP = 100;
            const durationXP = Math.floor(elapsedTime / 60) * 2;
            const volumeXP = Math.min(100, Math.floor(totalVolume / 1000) * 5);
            const setsXP = setsCompleted * 5;
            const prXP = newRecords.length * 50;

            const totalXP = baseXP + durationXP + volumeXP + setsXP + prXP;
            const gamificationResult = await addXP(totalXP);

            // Celebration Effect
            const duration = 3 * 1000;
            const animationEnd = Date.now() + duration;
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

            const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

            const interval: any = setInterval(function () {
                const timeLeft = animationEnd - Date.now();

                if (timeLeft <= 0) {
                    return clearInterval(interval);
                }

                const particleCount = 50 * (timeLeft / duration);
                confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
                confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
            }, 250);

            // Handle Level Up or Standard Success
            if (gamificationResult?.leveledUp) {
                // Play Level Up Sound if available (optional)

                toast.custom((t) => (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        exit={{ opacity: 0, scale: 0.5, y: -100 }}
                        className="bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-900 border border-white/20 p-6 rounded-2xl shadow-2xl flex flex-col items-center gap-4 text-center pointer-events-auto w-full max-w-sm"
                    >
                        <div className="text-6xl animate-bounce">🆙</div>
                        <div>
                            <h3 className="font-black text-3xl text-white tracking-wider uppercase drop-shadow-md">¡Nivel {gamificationResult.newLevel}!</h3>
                            <p className="text-indigo-200 mt-1 font-medium">¡Has subido de nivel! Eres imparable.</p>
                        </div>
                        <div className="text-sm font-mono text-white/80 bg-black/30 px-4 py-2 rounded-full border border-white/10">
                            +{totalXP} XP Ganados
                        </div>
                    </motion.div>
                ), { duration: 6000 });
            } else {
                // Show PR Toast if exists, else Standard Success
                if (newRecords.length > 0) {
                    toast.custom((t) => (
                        <motion.div
                            initial={{ opacity: 0, y: 50, scale: 0.3 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            className="bg-zinc-900 border border-amber-500/50 p-4 rounded-xl shadow-2xl flex items-center gap-4 max-w-sm pointer-events-auto"
                        >
                            <div className="bg-amber-500/20 p-3 rounded-full">
                                <FaTrophy className="text-3xl text-amber-500" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-amber-500">¡Nuevo Récord! 🏆</h3>
                                <div className="text-sm text-zinc-300 space-y-1 mt-1">
                                    {newRecords.map((rec, i) => (
                                        <div key={i} className="flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" /> {rec}
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-2 text-xs text-amber-500/70 font-mono">
                                    +{totalXP} XP
                                </div>
                            </div>
                        </motion.div>
                    ), { duration: 6000 });
                } else {
                    toast.success(
                        <div className="flex flex-col">
                            <span>¡Entrenamiento completado! 🎉</span>
                            <span className="text-xs text-green-200 mt-1">+{totalXP} XP Ganados</span>
                        </div>,
                        {
                            duration: 4000,
                            style: {
                                background: 'rgba(16, 185, 129, 0.9)',
                                color: '#fff',
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255,255,255,0.1)',
                            },
                        }
                    );
                }
            }

            setTimeout(() => {
                router.push("/dashboard/avances");
            }, (gamificationResult?.leveledUp || newRecords.length > 0) ? 6000 : 2500);

        } catch (error) {
            console.error(error);
            setIsRunning(true); // Resume on error
        }
    };

    if (loadingRoutine || !activeRoutine) {
        return <div className="p-8 text-center text-muted-foreground">Cargando entrenamiento...</div>;
    }

    return (
        <motion.div
            className="max-w-3xl mx-auto space-y-6 pb-24"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
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
            <motion.div
                className="space-y-6"
                initial="hidden"
                animate="visible"
                variants={{
                    hidden: { opacity: 0 },
                    visible: {
                        opacity: 1,
                        transition: { staggerChildren: 0.15 }
                    }
                }}
            >
                {exercises.map((exercise, exIndex) => {
                    const prevSets = lastPerformances[exercise.name];

                    return (
                        <motion.div
                            key={exIndex}
                            variants={{
                                hidden: { y: 20, opacity: 0 },
                                visible: {
                                    y: 0,
                                    opacity: 1,
                                    transition: { type: "spring" as const, stiffness: 300, damping: 24 }
                                }
                            }}
                        >
                            <Card className="bg-zinc-900/80 backdrop-blur-xl border-white/10 overflow-hidden shadow-xl">
                                <CardHeader className="bg-white/5 py-4 border-b border-white/5">
                                    <CardTitle className="text-base flex justify-between items-start">
                                        <div className="flex flex-col gap-1.5">
                                            <span className="font-bold text-lg text-white">{exercise.name}</span>
                                            {exercise.grip && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-orange-500/10 text-orange-400 border border-orange-500/20 w-fit">
                                                    {exercise.grip}
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-xs font-semibold text-zinc-400 bg-black/40 px-3 py-1.5 rounded-full shrink-0 ml-2 border border-white/5">
                                            <FaClock className="inline mr-1.5 w-3 h-3 mb-0.5" />
                                            {exercise.rest || "60s"}
                                        </span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    {/* Headers */}
                                    <div className="grid grid-cols-10 gap-2 p-3 text-[10px] font-bold text-zinc-500 tracking-wider text-center bg-black/20 uppercase">
                                        <div className="col-span-1">#</div>
                                        <div className="col-span-2">Prev</div>
                                        <div className="col-span-3">Peso (kg)</div>
                                        <div className="col-span-3">Reps</div>
                                        <div className="col-span-1">OK</div>
                                    </div>

                                    {/* Sets */}
                                    {exercise.activeSets.map((set, setIndex) => {
                                        const prevSet = prevSets ? prevSets[setIndex] : null;

                                        return (
                                            <motion.div
                                                key={setIndex}
                                                initial={false}
                                                animate={{ backgroundColor: set.completed ? "rgba(16, 185, 129, 0.15)" : "transparent" }}
                                                className={`grid grid-cols-10 gap-2 p-3 items-center border-b border-white/5 last:border-0 transition-colors duration-300 ${set.completed ? "border-emerald-500/20" : ""}`}
                                            >
                                                <div className="col-span-1 text-center font-mono text-sm text-zinc-500">{setIndex + 1}</div>
                                                <div className="col-span-2 text-center text-xs text-zinc-600 font-mono">
                                                    {prevSet ? (
                                                        <span className="opacity-70">{prevSet.weight}kg x{prevSet.reps}</span>
                                                    ) : "-"}
                                                </div>
                                                <div className="col-span-3 relative">
                                                    <Input
                                                        type="number"
                                                        value={set.weight}
                                                        onChange={(e) => handleSetChange(exIndex, setIndex, "weight", e.target.value)}
                                                        className={`h-10 text-center font-bold text-lg bg-black/20 focus:scale-105 transition-all duration-200 ${set.isSuggested && !set.completed ? 'border-purple-500/60 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.15)]' : 'border-white/10 text-white focus:border-primary/50'}`}
                                                        placeholder="0"
                                                    />
                                                    {set.isSuggested && !set.completed && (
                                                        <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-purple-500 rounded-full animate-pulse shadow-lg shadow-purple-500/50 ring-2 ring-black" title="Sugerencia Inteligente IA" />
                                                    )}
                                                </div>
                                                <div className="col-span-3 relative">
                                                    <Input
                                                        type="number"
                                                        value={set.reps}
                                                        onChange={(e) => handleSetChange(exIndex, setIndex, "reps", e.target.value)}
                                                        className={`h-10 text-center font-bold text-lg bg-black/20 focus:scale-105 transition-all duration-200 ${set.isSuggested && !set.completed ? 'border-purple-500/60 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.15)]' : 'border-white/10 text-white focus:border-primary/50'}`}
                                                        placeholder="0"
                                                    />
                                                </div>
                                                <div className="col-span-1 flex justify-center">
                                                    <Checkbox
                                                        checked={set.completed}
                                                        onCheckedChange={(checked: boolean | string) => handleSetChange(exIndex, setIndex, "completed", !!checked)}
                                                        className="w-6 h-6 rounded-full data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500 border-zinc-600 transition-all duration-200 hover:scale-110"
                                                    />
                                                </div>
                                            </motion.div>
                                        );
                                    })}

                                    {/* Feedback Section */}
                                    <div className="p-4 border-t border-white/5 bg-black/20 space-y-3">
                                        <div className="flex flex-col gap-2">
                                            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">¿Cómo se sintió? (RPE)</span>
                                            <div className="grid grid-cols-3 gap-2">
                                                {[
                                                    { val: 7, label: "Bien / Justo", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20", active: "bg-emerald-500 text-black border-emerald-500" },
                                                    { val: 9, label: "Pesado", color: "bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20", active: "bg-amber-500 text-black border-amber-500" },
                                                    { val: 10, label: "Al Fallo", color: "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20", active: "bg-red-600 text-white border-red-600" }
                                                ].map((opt) => (
                                                    <button
                                                        key={opt.val}
                                                        onClick={() => handleFeedbackChange(exIndex, 'rpe', exercise.rpe === opt.val ? 0 : opt.val)}
                                                        className={`py-2 px-1 rounded-lg text-xs font-bold border transition-all duration-200 ${exercise.rpe === opt.val ? opt.active : opt.color}`}
                                                    >
                                                        {opt.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <motion.div
                                            initial={false}
                                            animate={{
                                                height: (exercise.rpe && exercise.rpe >= 9) ? 'auto' : 0,
                                                opacity: (exercise.rpe && exercise.rpe >= 9) ? 1 : 0
                                            }}
                                            className="overflow-hidden"
                                        >
                                            <div className="pt-2">
                                                <Input
                                                    placeholder="⚠️ ¿Qué complicación tuviste? (Ej: Dolor hombro, técnica...)"
                                                    className="h-9 text-xs bg-red-500/5 border-red-500/20 focus:border-red-500/50 text-red-200 placeholder:text-red-500/40"
                                                    value={exercise.feedback || ""}
                                                    onChange={(e) => handleFeedbackChange(exIndex, 'feedback', e.target.value)}
                                                />
                                            </div>
                                        </motion.div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    );
                })}
            </motion.div>

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
        </motion.div>
    );
}
