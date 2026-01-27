"use client";

import { useState } from "react";
import { useRoutineTemplates } from "@/hooks/queries/useRoutineTemplates";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { addDoc, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { RoutineAssignment } from "@/types";
import toast from "react-hot-toast";

interface AssignRoutineParams {
    athleteId: string;
    coachId: string;
    trigger?: React.ReactNode;
}

export default function AssignRoutineDialog({ athleteId, coachId, trigger }: AssignRoutineParams) {
    const { templates, isLoading } = useRoutineTemplates();
    const [selectedRoutineId, setSelectedRoutineId] = useState("");
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [isAssigning, setIsAssigning] = useState(false);
    const [open, setOpen] = useState(false);

    const handleAssign = async () => {
        if (!selectedRoutineId || !date) {
            toast.error("Selecciona una rutina y una fecha");
            return;
        }

        setIsAssigning(true);
        try {
            const routineTemplate = templates.find(t => t.id === selectedRoutineId);
            if (!routineTemplate) throw new Error("Routine not found");

            const assignmentData: Omit<RoutineAssignment, 'id'> = {
                athleteId,
                coachId,
                routineId: selectedRoutineId,
                dateAssigned: date.toISOString(),
                status: 'pending',
                customizedRoutine: routineTemplate // Snapshot at assignment time
            };

            await addDoc(collection(db, "assignments"), assignmentData);
            toast.success("Rutina asignada correctamente");
            setOpen(false);
        } catch (error) {
            console.error("Error signing routine:", error);
            toast.error("Error al asignar la rutina");
        } finally {
            setIsAssigning(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || <Button>Asignar Rutina</Button>}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Asignar Rutina</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Seleccionar Rutina</label>
                        <Select value={selectedRoutineId} onValueChange={setSelectedRoutineId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Elige una rutina..." />
                            </SelectTrigger>
                            <SelectContent>
                                {isLoading ? (
                                    <div className="p-2 text-center text-sm text-muted-foreground">Cargando...</div>
                                ) : (
                                    templates.map(t => (
                                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2 flex flex-col">
                        <label className="text-sm font-medium">Fecha de Entrenamiento</label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !date && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date ? format(date, "PPP", { locale: es }) : <span>Seleccionar fecha</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={setDate}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                    <Button onClick={handleAssign} className="w-full mt-4" disabled={isAssigning}>
                        {isAssigning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Confirmar Asignación"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
