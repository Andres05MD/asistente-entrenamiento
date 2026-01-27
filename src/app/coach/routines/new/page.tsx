"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useRoutineTemplates } from "@/hooks/queries/useRoutineTemplates";
import { useEjercicios } from "@/hooks/useData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Exercise, RoutineExercise, RoutineTemplate } from "@/types";
import { Plus, Search, Trash2, Save, GripVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import toast from "react-hot-toast";

export default function RoutineBuilderPage() {
    const router = useRouter();
    const { createTemplate } = useRoutineTemplates();
    const { ejercicios, isLoading: loadingEx } = useEjercicios();

    const [routineName, setRoutineName] = useState("");
    const [description, setDescription] = useState("");
    const [selectedExercises, setSelectedExercises] = useState<RoutineExercise[]>([]);
    const [searchTerm, setSearchTerm] = useState("");

    const handleAddExercise = (ex: Exercise) => {
        const newRoutineExercise: RoutineExercise = {
            exerciseId: ex.id!,
            name: ex.name,
            order: selectedExercises.length + 1,
            sets: 3,
            reps: "10-12",
            rest: "60",
            muscleGroup: ex.muscleGroup,
            notes: ""
        };
        setSelectedExercises([...selectedExercises, newRoutineExercise]);
    };

    const handleRemoveExercise = (index: number) => {
        const newExercises = selectedExercises.filter((_, i) => i !== index);
        setSelectedExercises(newExercises);
    };

    const updateExerciseParam = (index: number, field: keyof RoutineExercise, value: string | number) => {
        const newExercises = [...selectedExercises];
        newExercises[index] = { ...newExercises[index], [field]: value };
        setSelectedExercises(newExercises);
    };

    const handleSave = () => {
        if (!routineName) {
            toast.error("El nombre de la rutina es obligatorio.");
            return;
        }
        if (selectedExercises.length === 0) {
            toast.error("Añade al menos un ejercicio.");
            return;
        }

        const template: Omit<RoutineTemplate, 'id' | 'authorId' | 'createdAt' | 'updatedAt'> = {
            name: routineName,
            description,
            exercises: selectedExercises,
            isPublic: false, // Default private for now
            tags: [], // Todo: implement tags
        };

        createTemplate.mutate(template, {
            onSuccess: () => {
                router.push("/coach/routines");
            }
        });
    };

    const filteredLibrary = ejercicios?.filter(ex =>
        ex.name.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    return (
        <div className="h-[calc(100vh-2rem)] flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Nueva Rutina</h1>
                    <p className="text-muted-foreground">Diseña tu sesión de entrenamiento.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => router.back()}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={createTemplate.isPending}>
                        <Save className="mr-2 h-4 w-4" />
                        {createTemplate.isPending ? "Guardando..." : "Guardar Rutina"}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden">
                {/* Left Panel: Routine Details & Exercises List */}
                <div className="lg:col-span-2 flex flex-col gap-6 overflow-hidden">
                    <Card className="flex-shrink-0">
                        <CardContent className="pt-6 space-y-4">
                            <div className="space-y-2">
                                <Label>Nombre de la Rutina</Label>
                                <Input
                                    placeholder="Ej: Pierna Hipertrofia A"
                                    value={routineName}
                                    onChange={(e) => setRoutineName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Descripción</Label>
                                <Textarea
                                    placeholder="Objetivos de la sesión, enfoque..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="flex-1 flex flex-col overflow-hidden bg-muted/20">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                                Ejercicios ({selectedExercises.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto pr-2 space-y-3">
                            {selectedExercises.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-muted-foreground text-sm border-2 border-dashed rounded-lg">
                                    Arrastra o añade ejercicios desde el panel derecho.
                                </div>
                            ) : (
                                selectedExercises.map((ex, index) => (
                                    <div key={index} className="flex gap-3 bg-background p-3 rounded-lg border shadow-sm group">
                                        <div className="mt-2 text-muted-foreground cursor-grab">
                                            <GripVertical className="h-5 w-5" />
                                        </div>
                                        <div className="flex-1 space-y-3">
                                            <div className="flex justify-between items-start">
                                                <span className="font-semibold">{ex.name}</span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                                    onClick={() => handleRemoveExercise(index)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <div className="grid grid-cols-3 gap-3">
                                                <div className="space-y-1">
                                                    <Label className="text-xs text-muted-foreground">Series</Label>
                                                    <Input
                                                        type="number"
                                                        className="h-8"
                                                        value={ex.sets}
                                                        onChange={(e) => updateExerciseParam(index, 'sets', parseInt(e.target.value))}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs text-muted-foreground">Reps</Label>
                                                    <Input
                                                        className="h-8"
                                                        value={ex.reps}
                                                        onChange={(e) => updateExerciseParam(index, 'reps', e.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs text-muted-foreground">Descanso (s)</Label>
                                                    <Input
                                                        className="h-8"
                                                        value={ex.rest}
                                                        onChange={(e) => updateExerciseParam(index, 'rest', e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                            <Input
                                                className="h-8 text-xs bg-muted/30"
                                                placeholder="Notas (opcional)"
                                                value={ex.notes || ""}
                                                onChange={(e) => updateExerciseParam(index, 'notes', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Panel: Exercise Library */}
                <Card className="flex flex-col h-full overflow-hidden border-l">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Biblioteca</CardTitle>
                        <div className="relative mt-2">
                            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                            <Input
                                placeholder="Buscar..."
                                className="pl-8 h-8 text-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto p-0">
                        <ScrollArea className="h-full px-4 pb-4">
                            <div className="space-y-2">
                                {loadingEx ? (
                                    <div className="p-4 text-center text-sm text-muted-foreground">Cargando...</div>
                                ) : filteredLibrary.map(ex => (
                                    <div
                                        key={ex.id}
                                        className="flex items-center justify-between p-2 rounded-md hover:bg-muted cursor-pointer transition-colors border border-transparent hover:border-border"
                                        onClick={() => handleAddExercise(ex)}
                                    >
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-sm font-medium">{ex.name}</span>
                                            <span className="text-xs text-muted-foreground">{ex.muscleGroup}</span>
                                        </div>
                                        <Button size="icon" variant="ghost" className="h-6 w-6">
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
