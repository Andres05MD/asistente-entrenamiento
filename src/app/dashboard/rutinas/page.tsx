"use client";

import { useRutinas, useUser } from "@/hooks/useData";
import { Button } from "@/components/ui/button";
import { PremiumButton } from "@/components/ui/premium-button";
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
        <div className="space-y-8 animate-in fade-in-50 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-6">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight text-white mb-2">Mis Rutinas</h1>
                    <p className="text-lg text-muted-foreground">Gestiona y personaliza tus planes de entrenamiento.</p>
                </div>
                <AIRoutineGenerator onRoutineGenerated={handleSaveRoutine} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex flex-col space-y-3">
                            <Skeleton className="h-[200px] w-full rounded-2xl bg-zinc-900/50" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-[60%] bg-zinc-900/50" />
                                <Skeleton className="h-4 w-[40%] bg-zinc-900/50" />
                            </div>
                        </div>
                    ))
                ) : rutinas.length === 0 ? (
                    <div className="col-span-full text-center py-20 bg-zinc-900/30 rounded-3xl border border-dashed border-white/10 flex flex-col items-center justify-center">
                        <div className="p-4 bg-zinc-800/50 rounded-full mb-4">
                            <FaDumbbell className="h-10 w-10 text-zinc-600" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">No tienes rutinas aún</h3>
                        <p className="text-zinc-400 mb-6 max-w-sm">Usa el generador con Inteligencia Artificial o crea una manualmente para empezar.</p>
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
                            <Link href={`/dashboard/rutinas/${rutina.id}`} className="block h-full group">
                                <Card className="h-full bg-gradient-to-br from-zinc-900/90 to-zinc-900/50 backdrop-blur-xl border-white/5 hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 rounded-2xl overflow-hidden flex flex-col">
                                    <div className="h-1 w-full bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <CardHeader>
                                        <CardTitle className="flex justify-between items-start gap-2">
                                            <span className="truncate text-xl group-hover:text-primary transition-colors">{rutina.routineName}</span>
                                            <AnimatedBadge variant="default" className="shrink-0 bg-primary/10 text-primary border-primary/20">
                                                {rutina.days?.length || 0} Días
                                            </AnimatedBadge>
                                        </CardTitle>
                                        <CardDescription className="line-clamp-2 text-zinc-400 pt-2">{rutina.description}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex-1">
                                        <div className="flex items-center gap-4 text-sm text-zinc-500 font-medium">
                                            <div className="flex items-center gap-2 bg-black/20 px-3 py-1.5 rounded-lg border border-white/5">
                                                <FaClock className="text-primary" />
                                                <span>~60 min/sesión</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="flex justify-end gap-2 border-t border-white/5 pt-4 mt-auto bg-black/20">
                                        <PremiumButton
                                            size="sm"
                                            variant="ghost"
                                            className="h-9 w-9 p-0 rounded-lg hover:bg-blue-500/10 hover:text-blue-400 transition-colors"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                // Edit logic
                                            }}
                                        >
                                            <FaEdit className="h-4 w-4" />
                                        </PremiumButton>
                                        <PremiumButton
                                            size="sm"
                                            variant="ghost"
                                            className="h-9 w-9 p-0 rounded-lg hover:bg-red-500/10 hover:text-red-400 transition-colors"
                                            onClick={(e) => {
                                                if (rutina.id) handleDelete(rutina.id, e);
                                            }}
                                        >
                                            <FaTrash className="h-4 w-4" />
                                        </PremiumButton>
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
