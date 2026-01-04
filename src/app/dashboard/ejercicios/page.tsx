"use client";

import { useEjercicios, useUser } from "@/hooks/useData";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { FaPlay, FaPlus, FaRunning, FaTrash } from "react-icons/fa";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import toast from "react-hot-toast";
import { Exercise } from "@/types";
import AIExerciseGenerator from "@/components/ejercicios/AIExerciseGenerator";
import { useRouter } from "next/navigation";

export default function EjerciciosPage() {
    const router = useRouter();
    const { user } = useUser();
    const { ejercicios, isLoading, createEjercicio, deleteEjercicio } = useEjercicios();
    const [open, setOpen] = useState(false);
    const [newExercise, setNewExercise] = useState<Omit<Exercise, 'id' | 'userId' | 'createdAt'>>({
        name: "",
        muscleGroup: "",
        videoUrl: "",
        description: "",
    });

    const muscleGroups = [
        "Pecho", "Espalda", "Piernas", "Hombros", "Bíceps", "Tríceps", "Abdominales", "Cardio", "Otro"
    ];

    const handleCreate = () => {
        if (!newExercise.name || !newExercise.muscleGroup || !user) {
            toast.error("Completa los campos obligatorios");
            return;
        }

        createEjercicio.mutate(newExercise, {
            onSuccess: () => {
                setOpen(false);
                setNewExercise({ name: "", muscleGroup: "", videoUrl: "", description: "" });
            }
        });
    };

    const handleSaveGeneratedExercise = (exercise: Exercise) => {
        createEjercicio.mutate(exercise);
    };

    const handleDelete = (id: string) => {
        if (confirm("¿Eliminar este ejercicio?")) {
            deleteEjercicio.mutate(id);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in-50 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Biblioteca de Ejercicios</h1>
                    <p className="text-muted-foreground">Administra tus ejercicios personalizados.</p>
                </div>
                <div className="flex gap-2">
                    <AIExerciseGenerator onExerciseGenerated={handleSaveGeneratedExercise} />

                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
                                <FaPlus className="mr-2" /> Nuevo Manual
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="glass-dialog text-white">
                            <DialogHeader>
                                <DialogTitle>Agregar Nuevo Ejercicio</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Nombre</Label>
                                    <Input
                                        placeholder="Ej: Press de Banca"
                                        value={newExercise.name}
                                        onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value })}
                                        className="bg-white/5 border-white/10 text-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Grupo Muscular</Label>
                                    <Select
                                        value={newExercise.muscleGroup}
                                        onValueChange={(val) => setNewExercise({ ...newExercise, muscleGroup: val })}
                                    >
                                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                            <SelectValue placeholder="Selecciona..." />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-900 border-white/10">
                                            {muscleGroups.map(g => (
                                                <SelectItem key={g} value={g}>{g}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>URL Video (Opcional)</Label>
                                    <Input
                                        placeholder="https://youtube.com/..."
                                        value={newExercise.videoUrl}
                                        onChange={(e) => setNewExercise({ ...newExercise, videoUrl: e.target.value })}
                                        className="bg-white/5 border-white/10 text-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Descripción (Opcional)</Label>
                                    <Input
                                        placeholder="Notas sobre la técnica..."
                                        value={newExercise.description || ""}
                                        onChange={(e) => setNewExercise({ ...newExercise, description: e.target.value })}
                                        className="bg-white/5 border-white/10 text-white"
                                    />
                                </div>
                                <Button onClick={handleCreate} className="w-full bg-primary mt-4" disabled={createEjercicio.isPending}>
                                    {createEjercicio.isPending ? "Guardando..." : "Guardar"}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="space-y-8">
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <Skeleton key={i} className="h-[150px] w-full rounded-xl bg-white/5" />
                        ))}
                    </div>
                ) : ejercicios.length === 0 ? (
                    <div className="col-span-full py-12 text-center bg-white/5 rounded-xl border border-dashed border-white/10">
                        <FaRunning className="mx-auto h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                        <h3 className="text-lg font-medium text-white">Sin ejercicios</h3>
                        <p className="text-muted-foreground">Comienza agregando tus ejercicios favoritos.</p>
                    </div>
                ) : (
                    Object.entries(
                        ejercicios.reduce((acc, ex) => {
                            const group = ex.muscleGroup || "Otros";
                            if (!acc[group]) acc[group] = [];
                            acc[group].push(ex);
                            return acc;
                        }, {} as Record<string, Exercise[]>)
                    ).sort((a, b) => a[0].localeCompare(b[0])).map(([groupName, groupExercises]) => (
                        <div key={groupName} className="space-y-4">
                            <h2 className="text-xl font-semibold text-white border-b border-white/10 pb-2 flex items-center gap-2 sticky top-0 bg-background/80 backdrop-blur-md z-10 py-2">
                                <span className="w-1.5 h-6 bg-primary rounded-full"></span>
                                {groupName}
                                <span className="text-xs font-normal text-muted-foreground ml-auto bg-white/5 px-2 py-0.5 rounded-full">{groupExercises.length}</span>
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {groupExercises.map((ex: Exercise) => (
                                    <Card
                                        key={ex.id}
                                        className="bg-card/50 backdrop-blur-sm border-white/5 hover:border-primary/20 transition-all group cursor-pointer relative"
                                        onClick={() => router.push(`/dashboard/ejercicios/${ex.id}`)}
                                    >
                                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                                            <CardTitle className="text-lg truncate text-white">{ex.name}</CardTitle>
                                            <Badge variant="secondary" className="bg-white/10 hover:bg-white/20 text-white">{ex.muscleGroup}</Badge>
                                        </CardHeader>
                                        <CardContent>
                                            {ex.videoUrl && (
                                                <div className="aspect-video rounded-md bg-black/50 mb-3 flex items-center justify-center border border-white/5">
                                                    <FaPlay className="text-white/50" />
                                                </div>
                                            )}
                                            {ex.description && (
                                                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{ex.description}</p>
                                            )}
                                            <div className="flex justify-end pt-2">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="hover:bg-red-500/20 hover:text-red-400 h-8 w-8 z-10"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (ex.id) handleDelete(ex.id)
                                                    }}
                                                >
                                                    <FaTrash className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
