"use client";

import { useEjercicios, useUser } from "@/hooks/useData";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import toast from "react-hot-toast";
import { Exercise } from "@/types";
import { Play, Plus, Trash2, Search, Filter } from "lucide-react";
import AnimatedBackground from "@/components/ui/animated-background";

export default function CoachExercisesPage() {
    const { user } = useUser();
    const { ejercicios, isLoading, createEjercicio, deleteEjercicio } = useEjercicios();
    const [open, setOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterMuscle, setFilterMuscle] = useState("Todos");

    const [newExercise, setNewExercise] = useState<Omit<Exercise, 'id' | 'userId' | 'createdAt'>>({
        name: "",
        muscleGroup: "",
        targetArea: "",
        videoUrl: "",
        description: "",
    });

    const muscleGroups = [
        "Pecho", "Espalda", "Piernas", "Hombros", "Bíceps", "Tríceps", "Abdominales", "Cardio", "Otro"
    ];

    const handleCreate = () => {
        if (!newExercise.name || !newExercise.muscleGroup || !user) {
            toast.error("Completa el nombre y grupo muscular.");
            return;
        }

        createEjercicio.mutate(newExercise, {
            onSuccess: () => {
                setOpen(false);
                setNewExercise({ name: "", muscleGroup: "", targetArea: "", videoUrl: "", description: "" });
                toast.success("Ejercicio creado exitosamente.");
            }
        });
    };

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm("¿Eliminar este ejercicio?")) {
            deleteEjercicio.mutate(id);
        }
    };

    const filteredExercises = ejercicios?.filter((ex) => {
        const matchesSearch = ex.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesMuscle = filterMuscle === "Todos" || ex.muscleGroup === filterMuscle;
        return matchesSearch && matchesMuscle;
    }) || [];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Biblioteca de Ejercicios</h1>
                    <p className="text-muted-foreground">Gestiona los ejercicios disponibles para tus atletas.</p>
                </div>

                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Nuevo Ejercicio
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
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
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Grupo Muscular</Label>
                                    <Select
                                        value={newExercise.muscleGroup}
                                        onValueChange={(val) => setNewExercise({ ...newExercise, muscleGroup: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecciona..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {muscleGroups.map(g => (
                                                <SelectItem key={g} value={g}>{g}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Zona Específica</Label>
                                    <Input
                                        placeholder="Ej: Superior, Cabeza Larga"
                                        value={newExercise.targetArea || ""}
                                        onChange={(e) => setNewExercise({ ...newExercise, targetArea: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>URL Video (Opcional)</Label>
                                <Input
                                    placeholder="https://youtube.com/..."
                                    value={newExercise.videoUrl || ""}
                                    onChange={(e) => setNewExercise({ ...newExercise, videoUrl: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Descripción (Opcional)</Label>
                                <Input
                                    placeholder="Notas sobre la técnica..."
                                    value={newExercise.description || ""}
                                    onChange={(e) => setNewExercise({ ...newExercise, description: e.target.value })}
                                />
                            </div>
                            <Button onClick={handleCreate} className="w-full mt-4" disabled={createEjercicio.isPending}>
                                {createEjercicio.isPending ? "Guardando..." : "Guardar Ejercicio"}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar ejercicios..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Select value={filterMuscle} onValueChange={setFilterMuscle}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filtrar por músculo" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Todos">Todos</SelectItem>
                        {muscleGroups.map(g => (
                            <SelectItem key={g} value={g}>{g}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="h-[120px] w-full rounded-xl" />
                    ))}
                </div>
            ) : filteredExercises.length === 0 ? (
                <div className="text-center py-12 border rounded-lg border-dashed">
                    <p className="text-muted-foreground">No se encontraron ejercicios.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredExercises.map((ex) => (
                        <Card key={ex.id} className="group hover:border-primary/50 transition-all cursor-pointer">
                            <CardHeader className="flex flex-row items-start justify-between pb-2 space-y-0">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <CardTitle className="text-base truncate">{ex.name}</CardTitle>
                                        {ex.videoUrl && <Play className="h-3 w-3 text-muted-foreground" />}
                                    </div>
                                    <CardTitle className="text-xs font-normal text-muted-foreground mt-1">
                                        {ex.muscleGroup} {ex.targetArea && `• ${ex.targetArea}`}
                                    </CardTitle>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => ex.id && handleDelete(ex.id, e)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </CardHeader>
                            <CardContent>
                                {ex.description && (
                                    <p className="text-sm text-muted-foreground line-clamp-2">{ex.description}</p>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
