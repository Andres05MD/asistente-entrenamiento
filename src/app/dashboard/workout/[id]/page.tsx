"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { doc, getDoc, updateDoc, addDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { RoutineAssignment, WorkoutLog } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, Save, ArrowLeft, Play, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import Confetti from "canvas-confetti";
import { useExerciseMedia } from "@/hooks/useExerciseMedia";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { FaVideo } from "react-icons/fa";
import Image from "next/image";
import RestTimer from "@/components/dashboard/RestTimer";

interface ExerciseLog {
    exerciseId: string;
    name: string;
    sets: {
        setNumber: number;
        reps: number;
        weight: number | string;
        completed: boolean;
        prevWeight?: number;
    }[];
}

export default function WorkoutLoggerPage() {
    const params = useParams();
    const router = useRouter();
    const { id } = params;
    const queryClient = useQueryClient();

    const [exerciseLogs, setExerciseLogs] = useState<ExerciseLog[]>([]);

    // Media Integration
    const exerciseNames = exerciseLogs.map(e => e.name);
    const { mediaMap } = useExerciseMedia(exerciseNames.length > 0 ? exerciseNames : []);

    const [duration, setDuration] = useState(0);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [history, setHistory] = useState<Record<string, { weight: number, reps: number }>>({});

    // Rest Timer State
    const [showRestTimer, setShowRestTimer] = useState(false);

    // Fetch Assignment
    const { data: assignment, isLoading } = useQuery({
        queryKey: ['assignment', id],
        queryFn: async () => {
            if (!id || typeof id !== 'string') return null;
            const docRef = doc(db, "assignments", id);
            const snap = await getDoc(docRef);
            if (snap.exists()) {
                return { id: snap.id, ...snap.data() } as RoutineAssignment;
            }
            return null;
        },
        enabled: !!id
    });

    // Fetch History
    const { data: pastLogs } = useQuery({
        queryKey: ['workout_history', assignment?.athleteId],
        queryFn: async () => {
            if (!assignment?.athleteId) return [];
            const q = query(
                collection(db, "workout_logs"),
                where("userId", "==", assignment.athleteId)
            );
            const snap = await getDocs(q);
            const logs = snap.docs.map((d: any) => d.data() as WorkoutLog);
            return logs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
        },
        enabled: !!assignment?.athleteId
    });

    // Process History
    useEffect(() => {
        if (pastLogs && pastLogs.length > 0) {
            const newHistory: Record<string, { weight: number, reps: number }> = {};
            [...pastLogs].reverse().forEach((log) => {
                log.detailedLogs?.forEach((exLog) => {
                    if (exLog.exerciseId && exLog.sets && exLog.sets.length > 0) {
                        const bestSet = exLog.sets.reduce((prev, current) => (current.weight > prev.weight ? current : prev), exLog.sets[0]);
                        newHistory[exLog.exerciseId] = { weight: bestSet.weight, reps: bestSet.reps };
                    }
                });
            });
            setHistory(newHistory);
        }
    }, [pastLogs]);

    // Initialize Logs
    useEffect(() => {
        if (assignment && assignment.customizedRoutine && exerciseLogs.length === 0) {
            const initialLogs = assignment.customizedRoutine.exercises.map(ex => ({
                exerciseId: ex.exerciseId,
                name: ex.name,
                sets: Array.from({ length: ex.sets }).map((_, i) => ({
                    setNumber: i + 1,
                    reps: 0,
                    weight: "",
                    completed: false
                }))
            }));
            setExerciseLogs(initialLogs);
            setIsTimerRunning(true);
        }
    }, [assignment]);

    // Timer Interval
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isTimerRunning) {
            interval = setInterval(() => {
                setDuration(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isTimerRunning]);

    const formatTime = (secs: number) => {
        const mins = Math.floor(secs / 60);
        const seconds = secs % 60;
        return `${mins}:${seconds.toString().padStart(2, '0')}`;
    };

    const updateSet = (exIndex: number, setIndex: number, field: 'weight' | 'reps', value: string | number) => {
        const newLogs = [...exerciseLogs];
        const set = newLogs[exIndex].sets[setIndex];
        // @ts-ignore
        set[field] = value;
        setExerciseLogs(newLogs);
    };

    const toggleSetComplete = (exIndex: number, setIndex: number) => {
        const newLogs = [...exerciseLogs];
        const currentSet = newLogs[exIndex].sets[setIndex];
        const wasCompleted = currentSet.completed; // Estado ANTES del cambio

        // 1. Toggle completion
        currentSet.completed = !wasCompleted;
        setExerciseLogs(newLogs);

        // 2. Lógica Smart si SE ESTÁ COMPLETANDO (no desmarcando)
        if (!wasCompleted) {
            // A. Auto-Relleno de Siguiente Serie (Smart Fill)
            const nextSet = newLogs[exIndex].sets[setIndex + 1];
            if (nextSet && (!nextSet.weight || nextSet.weight === 0) && (!nextSet.reps || nextSet.reps === 0)) {
                nextSet.weight = currentSet.weight;
                nextSet.reps = currentSet.reps;
                toast("Siguiente serie autocompletada ✨", {
                    icon: '🤖',
                    position: 'bottom-center',
                    style: { background: '#18181b', color: '#fff', border: '1px solid #333' }
                });
            }

            // B. Activar Timer de Descanso
            // Solo si no es la última serie del ejercicio
            if (setIndex < newLogs[exIndex].sets.length - 1) {
                setShowRestTimer(true);
            } else {
                // Si es la última serie, timer de transición
                setShowRestTimer(true);
            }
        }
    };

    const finishWorkout = async () => {
        if (!assignment) return;

        const hasActivity = exerciseLogs.some(ex => ex.sets.some(s => s.completed));
        if (!hasActivity) {
            if (!confirm("No has registrado ninguna serie completa. ¿Terminar entrenamiento de todos modos?")) return;
        }

        setIsTimerRunning(false);

        try {
            const totalVolume = exerciseLogs.reduce((acc, ex) => {
                return acc + ex.sets.reduce((sAcc, set) => sAcc + (set.completed ? (Number(set.weight) * Number(set.reps)) : 0), 0);
            }, 0);

            const logData: Omit<WorkoutLog, 'id'> = {
                userId: assignment.athleteId,
                date: new Date().toISOString(),
                exercisesCompleted: exerciseLogs.filter(ex => ex.sets.some(s => s.completed)).length,
                routineName: assignment.customizedRoutine?.name || "Entrenamiento",
                duration,
                totalVolume,
                detailedLogs: exerciseLogs.map(ex => ({
                    exerciseId: ex.exerciseId,
                    exerciseName: ex.name,
                    sets: ex.sets.filter(s => s.completed).map(s => ({
                        setNumber: s.setNumber,
                        reps: Number(s.reps),
                        weight: Number(s.weight),
                        completed: true
                    }))
                }))
            };

            await addDoc(collection(db, "workout_logs"), logData);

            await updateDoc(doc(db, "assignments", id as string), {
                status: 'completed',
                completedAt: new Date().toISOString()
            });

            Confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });

            toast.success("¡Entrenamiento completado!");
            queryClient.invalidateQueries({ queryKey: ['assignments'] });
            queryClient.invalidateQueries({ queryKey: ['avances'] });

            setTimeout(() => {
                router.push("/dashboard");
            }, 2000);

        } catch (error) {
            console.error(error);
            toast.error("Error al guardar el entrenamiento");
        }
    };

    if (isLoading) return <div className="p-8 text-center">Cargando entrenamiento...</div>;
    if (!assignment) return <div className="p-8 text-center text-red-400">Entrenamiento no encontrado o ID inválido.</div>;

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col gap-4 sticky top-0 z-10 bg-background/95 backdrop-blur py-4 border-b">
                <div className="flex items-center justify-between">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex flex-col items-center">
                        <h1 className="font-bold text-lg">{assignment.customizedRoutine?.name}</h1>
                        <Badge variant="outline" className="font-mono flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTime(duration)}
                        </Badge>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => setIsTimerRunning(!isTimerRunning)}>
                        {isTimerRunning ? <Square className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current" />}
                    </Button>
                </div>
            </div>

            {/* Exercises */}
            <div className="space-y-6">
                {exerciseLogs.map((exercise, exIndex) => (
                    <Card key={exercise.exerciseId} className="overflow-hidden border-l-4 border-l-primary">
                        <CardHeader className="bg-muted/30 py-3">
                            <CardTitle className="text-base flex justify-between items-center">
                                {exercise.name}

                                <div className="flex items-center gap-2">
                                    {history[exercise.exerciseId] && (
                                        <Badge variant="secondary" className="text-xs font-normal hidden sm:inline-flex">
                                            Prev: {history[exercise.exerciseId].weight}kg x {history[exercise.exerciseId].reps}
                                        </Badge>
                                    )}

                                    {mediaMap[exercise.name]?.gifUrl && (
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button size="sm" variant="ghost" className="h-8 gap-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10">
                                                    <FaVideo /> <span className="hidden xs:inline">Demo</span>
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="bg-zinc-950 border-white/10 p-0 overflow-hidden max-w-sm mx-auto">
                                                <div className="relative aspect-square w-full bg-white">
                                                    <Image
                                                        src={mediaMap[exercise.name]!.gifUrl!}
                                                        alt={exercise.name}
                                                        fill
                                                        className="object-contain"
                                                        unoptimized
                                                    />
                                                </div>
                                                <div className="p-4">
                                                    <h3 className="font-bold text-lg text-white mb-1">{mediaMap[exercise.name]!.name}</h3>
                                                    <div className="flex gap-2">
                                                        <Badge variant="outline">{mediaMap[exercise.name]!.target}</Badge>
                                                    </div>
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    )}
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="grid grid-cols-10 gap-2 p-2 text-xs text-muted-foreground font-medium text-center bg-muted/10 border-b">
                                <div className="col-span-1">Set</div>
                                <div className="col-span-3">kg</div>
                                <div className="col-span-3">Reps</div>
                                <div className="col-span-1"></div>
                                <div className="col-span-2"></div>
                            </div>
                            {exercise.sets.map((set, setIndex) => (
                                <div
                                    key={setIndex}
                                    className={cn(
                                        "grid grid-cols-10 gap-2 p-3 items-center border-b last:border-0",
                                        set.completed && "bg-green-500/5"
                                    )}
                                >
                                    <div className="col-span-1 text-center font-bold text-sm bg-muted rounded-full w-6 h-6 flex items-center justify-center mx-auto">
                                        {set.setNumber}
                                    </div>
                                    <div className="col-span-3">
                                        <Input
                                            type="number"
                                            placeholder="kg"
                                            className="h-8 text-center"
                                            value={set.weight}
                                            onChange={(e) => updateSet(exIndex, setIndex, 'weight', e.target.value)}
                                        />
                                    </div>
                                    <div className="col-span-3">
                                        <Input
                                            type="number"
                                            placeholder="reps"
                                            className="h-8 text-center"
                                            value={set.reps || ""}
                                            onChange={(e) => updateSet(exIndex, setIndex, 'reps', e.target.value)}
                                        />
                                    </div>
                                    <div className="col-span-1 text-center text-xs text-muted-foreground">
                                        {/* History placeholder for mobile compactness */}
                                    </div>
                                    <div className="col-span-2 flex justify-end">
                                        <Button
                                            size="icon"
                                            variant={set.completed ? "default" : "secondary"}
                                            className={cn("h-8 w-8 transition-all", set.completed && "bg-green-500 hover:bg-green-600")}
                                            onClick={() => toggleSetComplete(exIndex, setIndex)}
                                        >
                                            <CheckCircle2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                ))}
            </div>

            <RestTimer
                isOpen={showRestTimer}
                onClose={() => setShowRestTimer(false)}
            />

            {/* Footer Action */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t">
                <Button className="w-full h-12 text-lg font-bold" onClick={finishWorkout}>
                    <Save className="mr-2 h-5 w-5" /> Finalizar Entrenamiento
                </Button>
            </div>
        </div>
    );
}
