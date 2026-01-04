"use client";

import { useRutinas, useUser } from "@/hooks/useData";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AIRoutineGenerator from "@/components/rutinas/AIRoutineGenerator";
import { FaTrash, FaEdit, FaClock, FaDumbbell } from "react-icons/fa";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { Routine } from "@/types";
import AnimatedBadge from "@/components/ui/animated-badge";
import { addDoc, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";
import toast from "react-hot-toast";

export default function RutinasPage() {
    const { user } = useUser();
    const { rutinas, isLoading, createRutina, deleteRutina } = useRutinas();

    const handleSaveRoutine = async (routineData: Omit<Routine, 'id' | 'userId' | 'createdAt'>) => {
        if (!user) return;

        const updatedRoutine = { ...routineData };
        let newExercisesCount = 0;

        try {
            // Recorrer todos los días y ejercicios para verificar cuáles son nuevos
            for (const day of updatedRoutine.days) {
                for (const exercise of day.exercises) {
                    if (!exercise.exerciseId) {
                        // Es un ejercicio nuevo, hay que crearlo
                        // Aseguramos que tenga un grupo muscular por defecto si viene vacío (aunque el prompt lo pide)
                        const muscleGroup = exercise.muscleGroup || "Otro";

                        const newExerciseRef = await addDoc(collection(db, "ejercicios"), {
                            name: exercise.name,
                            muscleGroup: muscleGroup,
                            userId: user.uid,
                            createdAt: new Date().toISOString(),
                            videoUrl: "",
                            description: exercise.notes || "Generado por IA"
                        });

                        exercise.exerciseId = newExerciseRef.id;
                        newExercisesCount++;
                    }
                }
            }

            if (newExercisesCount > 0) {
                toast.success(`Se agregaron ${newExercisesCount} ejercicios nuevos a tu biblioteca.`);
            }

            createRutina.mutate(updatedRoutine);
        } catch (error) {
            console.error("Error al procesar la rutina:", error);
            toast.error("Error al guardar la rutina y sus ejercicios.");
        }
    };

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (confirm("¿Estás seguro de eliminar esta rutina?")) {
            deleteRutina.mutate(id);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">Mis Rutinas</h1>
                    <p className="text-muted-foreground">Gestiona y personaliza tus planes de entrenamiento.</p>
                </div>
                <AIRoutineGenerator onRoutineGenerated={handleSaveRoutine} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                    // Skeleton Loading
                    Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex flex-col space-y-3">
                            <Skeleton className="h-[200px] w-full rounded-xl bg-white/5" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-[250px] bg-white/5" />
                                <Skeleton className="h-4 w-[200px] bg-white/5" />
                            </div>
                        </div>
                    ))
                ) : rutinas.length === 0 ? (
                    <div className="col-span-full text-center py-12 bg-white/5 rounded-xl border border-dashed border-white/10">
                        <FaDumbbell className="mx-auto h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                        <h3 className="text-lg font-medium text-white">No tienes rutinas aún</h3>
                        <p className="text-muted-foreground mb-4">Usa el generador IA o crea una manualmente.</p>
                    </div>
                ) : (
                    rutinas.map((rutina: Routine, index: number) => (
                        <motion.div
                            key={rutina.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="h-full"
                        >
                            <Link href={`/dashboard/rutinas/${rutina.id}`} className="block h-full">
                                <Card className="h-full bg-card/50 backdrop-blur-sm border-white/5 hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/5 group cursor-pointer flex flex-col">
                                    <CardHeader>
                                        <CardTitle className="flex justify-between items-start gap-2">
                                            <span className="truncate group-hover:text-primary transition-colors">{rutina.routineName}</span>
                                            <AnimatedBadge variant="default" className="shrink-0">
                                                {rutina.days?.length || 0} Días
                                            </AnimatedBadge>
                                        </CardTitle>
                                        <CardDescription className="line-clamp-2">{rutina.description}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex-1">
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <FaClock className="text-primary/70" />
                                                <span>~60 min/sesión</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="flex justify-end gap-2 border-t border-white/5 pt-4 mt-auto">
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8 hover:bg-white/10 hover:text-white"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                // Edit logic
                                            }}
                                        >
                                            <FaEdit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8 hover:bg-red-500/20 hover:text-red-400"
                                            onClick={(e) => {
                                                if (rutina.id) handleDelete(rutina.id, e);
                                            }}
                                        >
                                            <FaTrash className="h-4 w-4" />
                                        </Button>
                                    </CardFooter>
                                </Card>
                            </Link>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
}
