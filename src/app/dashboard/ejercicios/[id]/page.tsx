"use client";

import { useParams, useRouter } from "next/navigation";
import { useEjercicios, useAvances } from "@/hooks/useData";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FaArrowLeft, FaHistory, FaUtensilSpoon } from "react-icons/fa";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from "recharts";
import { ExerciseLog, WorkoutLog } from "@/types";

// Helper to calculate estimated 1RM (Epley formula)
const calculate1RM = (weight: number, reps: number) => {
    if (reps === 1) return weight;
    return weight * (1 + reps / 30);
};

export default function ExerciseDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;

    const { ejercicios } = useEjercicios();
    const { workoutLogs, isLoading } = useAvances();

    // 1. Find the exercise definition
    const exercise = ejercicios.find(e => e.id === id);

    // 2. Find historical logs for this exercise
    const history = workoutLogs
        .map(log => {
            // Find if this exercise was performed in this workout
            const exerciseLog = log.detailedLogs?.find((d: ExerciseLog) => d.exerciseId === id || d.exerciseName === exercise?.name);

            if (!exerciseLog) return null;

            // Calculate stats for this session (e.g., best set)
            const bestSet = exerciseLog.sets.reduce((prev, current) => {
                const prev1RM = calculate1RM(prev.weight, prev.reps);
                const curr1RM = calculate1RM(current.weight, current.reps);
                return curr1RM > prev1RM ? current : prev;
            }, exerciseLog.sets[0]);

            const totalVolume = exerciseLog.sets.reduce((acc, set) => acc + (set.weight * set.reps), 0);

            return {
                date: log.date,
                routineName: log.routineName,
                bestSet,
                oneRepMax: calculate1RM(bestSet.weight, bestSet.reps),
                totalVolume,
                rawLog: exerciseLog
            };
        })
        .filter(Boolean)
        .sort((a, b) => new Date(a!.date).getTime() - new Date(b!.date).getTime()); // Sort chronological

    if (!exercise) {
        return <div className="p-8">Ejercicio no encontrado o cargando...</div>;
    }

    const chartData = history.map(h => ({
        date: new Date(h!.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        rm: h!.oneRepMax,
        vol: h!.totalVolume
    }));

    return (
        <div className="space-y-6 animate-in fade-in-50 duration-500">
            <Button
                variant="ghost"
                className="text-muted-foreground hover:text-white pl-0 mb-2"
                onClick={() => router.back()}
            >
                <FaArrowLeft className="mr-2" /> Volver a Biblioteca
            </Button>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">{exercise.name}</h1>
                    <div className="flex gap-2">
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                            {exercise.muscleGroup}
                        </Badge>
                        {exercise.grip && (
                            <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/20">
                                {exercise.grip}
                            </Badge>
                        )}
                    </div>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-card/50 backdrop-blur-xl border-white/5">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-muted-foreground">Progreso de Fuerza (1RM Est.)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[250px] w-full">
                            {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={250}>
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="colorRm" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                        <XAxis dataKey="date" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} domain={['dataMin', 'auto']} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a' }}
                                            itemStyle={{ color: '#fff' }}
                                            formatter={(value: number | undefined) => [`${Number(value || 0).toFixed(1)} kg`, '1RM Estimado']}
                                        />
                                        <Area type="monotone" dataKey="rm" stroke="#f59e0b" fillOpacity={1} fill="url(#colorRm)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                                    No hay datos suficientes
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-card/50 backdrop-blur-xl border-white/5">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-muted-foreground">Volumen por Sesión</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[250px] w-full">
                            {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={250}>
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="colorVol" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                        <XAxis dataKey="date" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a' }}
                                            itemStyle={{ color: '#fff' }}
                                            formatter={(value: number | undefined) => [`${Number(value || 0).toLocaleString()} kg`, 'Volumen Total']}
                                        />
                                        <Area type="monotone" dataKey="vol" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorVol)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                                    No hay datos suficientes
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Logs List */}
            <h2 className="text-xl font-bold text-white mt-8 flex items-center gap-2">
                <FaHistory className="text-muted-foreground" /> Historial de Sesiones
            </h2>
            <div className="space-y-4">
                {history.length > 0 ? (
                    history.slice().reverse().map((h, i) => (
                        <Card key={i} className="bg-card/50 backdrop-blur-md border-white/5">
                            <CardHeader className="py-3 bg-white/5 flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-base text-white">{new Date(h!.date).toLocaleDateString()}</CardTitle>
                                    <CardDescription>{h!.routineName || "Entrenamiento Libre"}</CardDescription>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-bold text-primary">1RM: {h!.oneRepMax.toFixed(1)} kg</div>
                                </div>
                            </CardHeader>
                            <CardContent className="py-4">
                                <div className="flex flex-wrap gap-2">
                                    {h!.rawLog.sets.map((set, sIndex) => (
                                        <div key={sIndex} className="bg-black/40 px-3 py-2 rounded border border-white/5 text-sm">
                                            <span className="text-muted-foreground text-xs mr-2">#{set.setNumber}</span>
                                            <span className="font-bold text-white">{set.weight}kg</span>
                                            <span className="text-muted-foreground mx-1">x</span>
                                            <span className="text-white">{set.reps}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <div className="text-center py-12 text-muted-foreground bg-white/5 rounded-xl border border-dashed border-white/10">
                        No hay registros históricos para este ejercicio.
                    </div>
                )}
            </div>
        </div>
    );
}
