"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { FaArrowLeft, FaCalendarAlt, FaDumbbell, FaClock, FaStickyNote, FaLink } from "react-icons/fa";
import { Routine, DayRoutine, Exercise } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";

export default function RoutineDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;

    const [rutina, setRutina] = useState<Routine | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            const fetchRutina = async () => {
                try {
                    const docRef = doc(db, "rutinas", id);
                    const docSnap = await getDoc(docRef);

                    if (docSnap.exists()) {
                        setRutina({ id: docSnap.id, ...docSnap.data() } as Routine);
                    } else {
                        console.log("No such document!");
                    }
                } catch (error) {
                    console.error("Error fetching document:", error);
                } finally {
                    setLoading(false);
                }
            };

            fetchRutina();
        }
    }, [id]);

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full bg-white/5" />
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-64 bg-white/5" />
                        <Skeleton className="h-4 w-40 bg-white/5" />
                    </div>
                </div>
                <Skeleton className="h-[400px] w-full rounded-xl bg-white/5" />
            </div>
        )
    }

    if (!rutina) return <div className="text-white">Rutina no encontrada</div>;

    return (
        <div className="space-y-6">
            <Button
                variant="ghost"
                className="text-muted-foreground hover:text-white mb-4 pl-0 hover:bg-transparent transition-colors"
                onClick={() => router.back()}
            >
                <FaArrowLeft className="mr-2 h-4 w-4" /> Volver a mis rutinas
            </Button>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">{rutina.routineName}</h1>
                    <p className="text-muted-foreground max-w-2xl">{rutina.description}</p>
                </div>
                <Badge variant="outline" className="text-lg py-1 px-4 border-primary/20 bg-primary/5 text-primary">
                    <FaCalendarAlt className="mr-2" /> {rutina.days?.length || 0} Días / Semana
                </Badge>
            </div>

            <Tabs defaultValue="day-0" className="w-full">
                <TabsList className="bg-white/5 border border-white/10 p-1 mb-6 flex-wrap h-auto">
                    {rutina.days?.map((day: DayRoutine, index: number) => (
                        <TabsTrigger
                            key={index}
                            value={`day-${index}`}
                            className="data-[state=active]:bg-primary data-[state=active]:text-white flex-1 min-w-[120px]"
                        >
                            Día {index + 1}
                        </TabsTrigger>
                    ))}
                </TabsList>

                {rutina.days?.map((day: DayRoutine, index: number) => (
                    <TabsContent key={index} value={`day-${index}`} className="space-y-6">
                        <Card className="bg-card/50 backdrop-blur-xl border-white/10">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-2xl text-primary flex items-center gap-3">
                                        <FaDumbbell /> {day.dayName}
                                    </CardTitle>
                                    <CardDescription className="flex gap-2 mt-2">
                                        {day.muscleGroups.map((mg: string, i: number) => (
                                            <Badge key={i} variant="secondary" className="bg-white/10">{mg}</Badge>
                                        ))}
                                    </CardDescription>
                                </div>
                                <Button
                                    className="bg-green-500 hover:bg-green-600 text-white font-bold shadow-lg shadow-green-900/20"
                                    onClick={() => router.push(`/dashboard/entrenamiento/${rutina.id}`)}
                                >
                                    <FaClock className="mr-2" /> Iniciar Rutina
                                </Button>
                            </CardHeader>
                            <CardContent className="space-y-0">
                                {day.exercises.map((exercise: Exercise, exIndex: number) => (
                                    <div
                                        key={exIndex}
                                        className="flex flex-col md:flex-row md:items-center justify-between p-4 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors gap-4"
                                    >
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                                {exercise.name}
                                                {exercise.exerciseId && (
                                                    <span title="Vinculado a tu biblioteca" className="text-green-400 bg-green-500/10 p-1 rounded-full text-xs">
                                                        <FaLink />
                                                    </span>
                                                )}
                                            </h3>
                                            {exercise.muscleGroup && (
                                                <Badge variant="outline" className="mt-1 text-[10px] px-2 py-0 h-auto border-purple-500/30 text-purple-400 bg-purple-500/10">
                                                    {exercise.muscleGroup}
                                                </Badge>
                                            )}
                                            {exercise.grip && (
                                                <Badge variant="outline" className="mt-1 ml-2 text-[10px] px-2 py-0 h-auto border-orange-500/30 text-orange-400 bg-orange-500/10">
                                                    {exercise.grip}
                                                </Badge>
                                            )}
                                            {exercise.notes && (
                                                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                                    <FaStickyNote className="text-yellow-500/50" /> {exercise.notes}
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-6 text-sm">
                                            <div className="text-center min-w-[60px]">
                                                <div className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Series</div>
                                                <div className="font-bold text-white text-lg">{exercise.sets}</div>
                                            </div>
                                            <div className="text-center min-w-[60px]">
                                                <div className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Reps</div>
                                                <div className="font-bold text-white text-lg">{exercise.reps}</div>
                                            </div>
                                            <div className="text-center min-w-[60px]">
                                                <div className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Descanso</div>
                                                <div className="font-bold text-primary flex items-center justify-center gap-1">
                                                    <FaClock className="h-3 w-3" /> {exercise.rest}s
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    );
}
