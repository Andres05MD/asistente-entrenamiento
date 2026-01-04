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
}

interface ActiveExercise extends Exercise {
    activeSets: ActiveSet[];
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

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const map: Record<string, any[]> = {};

        // Iterate backwards (newest to oldest)
        for (let i = workoutLogs.length - 1; i >= 0; i--) {
            const log = workoutLogs[i];
            if (!log.detailedLogs) continue;

            for (const detail of log.detailedLogs) {
                // Only store if we haven't found a more recent one
                if (!map[detail.exerciseName]) {
                    map[detail.exerciseName] = detail.sets;
                }
            }
        }
        return map;
    }, [workoutLogs]);

    // Find routine and initialize state
    useEffect(() => {
        if (rutinas.length > 0 && params.id) {
            const routine = rutinas.find(r => r.id === params.id);
            if (routine && routine.days.length > 0) {
                // For simplicity, picking the first day or letting user choose could be an option.
                // Assuming we clicked "Start" on a specific day from the previous screen would be better,
                // but for now let's default to the first day of the routine.
                const day = routine.days[0];
                setRoutineName(routine.routineName);
                setActiveRoutine(day);

                // Initialize exercises with empty sets structure based on prescribed sets
                const initialExercises = day.exercises.map(ex => {
                    const numSets = parseInt(ex.sets || "3", 10) || 3;
                    return {
                        ...ex,
                        activeSets: Array(numSets).fill({ reps: ex.reps || "0", weight: "0", completed: false })
                    };
                });
                setExercises(initialExercises);
                setIsRunning(true);
            }
        }
    }, [rutinas, params.id]);

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
            osc.frequency.setValueAtTime(880, ctx.currentTime); // High pitch beep
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
        const newExercises = [...exercises];
        newExercises[exIndex].activeSets[setIndex] = {
            ...newExercises[exIndex].activeSets[setIndex],
            [field]: value
        };
        setExercises(newExercises);

        // Validar si el set está marcado como completado y el timer no está corriendo
        if (field === "completed" && value === true) {
            const exerciseRestString = exercises[exIndex].rest || "60s";
            // Extraer solo los números del string (ej: "90s" -> 90)
            const restSeconds = parseInt(exerciseRestString.replace(/\D/g, '')) || 60;

            setRestTimer(restSeconds);
            setIsResting(true);
        }
    };

    const skipRest = () => {
        setIsResting(false);
        setRestTimer(0);
    };

    const finishWorkout = async () => {
        setIsRunning(false);

        // Calculate total stats
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

        // Prepare detailed logs
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
                sets: completedSets // Include sets in the log
            };
        }).filter(Boolean) as ExerciseLog[]; // Remove nulls

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
            setIsRunning(true); // Resume on error
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
                                <CardTitle className="text-base flex justify-between">
                                    <span>{exercise.name}</span>
                                    <span className="text-xs font-normal text-muted-foreground bg-black/40 px-2 py-1 rounded">
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
                                            <div className="col-span-3">
                                                <Input
                                                    type="number"
                                                    value={set.weight}
                                                    onChange={(e) => handleSetChange(exIndex, setIndex, "weight", e.target.value)}
                                                    className="h-8 text-center bg-black/20 border-white/10 focus:border-primary/50"
                                                    placeholder="0"
                                                />
                                            </div>
                                            <div className="col-span-3">
                                                <Input
                                                    type="number"
                                                    value={set.reps}
                                                    onChange={(e) => handleSetChange(exIndex, setIndex, "reps", e.target.value)}
                                                    className="h-8 text-center bg-black/20 border-white/10 focus:border-primary/50"
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
