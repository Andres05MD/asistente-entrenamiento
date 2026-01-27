"use client";

import { useRoutineTemplates } from "@/hooks/queries/useRoutineTemplates";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, Dumbbell, MoreVertical, Trash2, Edit } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

export default function CoachRoutinesPage() {
    const { templates, isLoading, deleteTemplate } = useRoutineTemplates();

    const handleDelete = (id: string) => {
        if (confirm("¿Estás seguro de eliminar esta rutina?")) {
            deleteTemplate.mutate(id);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Rutinas</h1>
                    <p className="text-muted-foreground">Crea y gestiona tus plantillas de entrenamiento.</p>
                </div>
                <Link href="/coach/routines/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Crear Nueva Rutina
                    </Button>
                </Link>
            </div>

            {isLoading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-[200px] w-full rounded-xl" />
                    ))}
                </div>
            ) : templates.length === 0 ? (
                <div className="text-center py-12 border rounded-lg border-dashed">
                    <div className="rounded-full bg-muted/30 p-3 mb-4 mx-auto w-fit">
                        <Dumbbell className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold">No tienes rutinas creadas</h3>
                    <p className="text-muted-foreground mb-4">Comienza diseñando tu primera rutina para asignarla a tus atletas.</p>
                    <Link href="/coach/routines/new">
                        <Button variant="outline">Crear Rutina</Button>
                    </Link>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {templates.map((routine) => (
                        <Card key={routine.id} className="group hover:border-primary/50 transition-all">
                            <CardHeader className="flex flex-row items-start justify-between pb-2">
                                <div>
                                    <CardTitle className="text-lg truncate pr-2">{routine.name}</CardTitle>
                                    <CardDescription className="line-clamp-1">{routine.description || "Sin descripción"}</CardDescription>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <Link href={`/coach/routines/${routine.id}/edit`}>
                                            <DropdownMenuItem>
                                                <Edit className="mr-2 h-4 w-4" /> Editar
                                            </DropdownMenuItem>
                                        </Link>
                                        <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(routine.id)}>
                                            <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <div className="text-sm font-medium">Ejercicios: {routine.exercises?.length || 0}</div>
                                    <div className="flex flex-wrap gap-1">
                                        {routine.tags?.map(tag => (
                                            <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                                        ))}
                                    </div>
                                    <div className="text-xs text-muted-foreground pt-2">
                                        Creada: {new Date(routine.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
