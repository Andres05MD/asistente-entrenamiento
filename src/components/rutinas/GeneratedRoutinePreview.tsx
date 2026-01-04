import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Routine, DayRoutine, Exercise } from "@/types";
import { FaLink, FaExchangeAlt } from "react-icons/fa";

interface GeneratedRoutinePreviewProps {
    routine: Routine;
    onDiscard: () => void;
    onSave: () => void;
    onSwapExercise: (dayIndex: number, exerciseIndex: number, exercise: Exercise) => void;
}

export function GeneratedRoutinePreview({
    routine,
    onDiscard,
    onSave,
    onSwapExercise
}: GeneratedRoutinePreviewProps) {
    return (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <div className="space-y-4 pb-4">
                    <div className="border-b border-white/10 pb-4">
                        <h3 className="text-xl font-bold text-white mb-1">{routine.routineName}</h3>
                        <p className="text-sm text-muted-foreground">{routine.description}</p>
                    </div>

                    {routine.days.map((day: DayRoutine, dayIdx: number) => (
                        <Card key={dayIdx} className="bg-white/5 border-white/10">
                            <CardContent className="p-4">
                                <h4 className="font-semibold text-primary mb-3 text-lg">{day.dayName}</h4>
                                <div className="space-y-3">
                                    {day.exercises.map((ex: Exercise, exIdx: number) => (
                                        <div
                                            key={exIdx}
                                            className="flex items-start justify-between text-sm py-2 border-b border-white/5 last:border-0 last:pb-0 hover:bg-white/5 p-2 rounded cursor-pointer transition-colors group"
                                            onClick={() => onSwapExercise(dayIdx, exIdx, ex)}
                                            title="Clic para cambiar ejercicio"
                                        >
                                            <div>
                                                <div className="font-medium text-white flex flex-col gap-1">
                                                    <div className="flex items-center gap-2">
                                                        {ex.name}
                                                        {ex.exerciseId && (
                                                            <span className="text-green-400 text-[10px] bg-green-500/10 px-1 py-0.5 rounded flex items-center gap-1">
                                                                <FaLink /> Vinculado
                                                            </span>
                                                        )}
                                                    </div>
                                                    {ex.muscleGroup && (
                                                        <span className="text-[10px] text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded w-fit border border-purple-500/20">
                                                            {ex.muscleGroup}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-muted-foreground mt-0.5 group-hover:text-primary transition-colors">
                                                    <FaExchangeAlt className="inline mr-1" /> Click para cambiar
                                                </div>
                                            </div>
                                            <div className="text-right text-xs bg-white/5 px-2 py-1 rounded">
                                                <div className="text-white">{ex.sets} x {ex.reps}</div>
                                                <div className="text-muted-foreground">{ex.rest}s descanso</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            <div className="pt-4 mt-auto border-t border-white/10 flex gap-2">
                <Button variant="outline" onClick={onDiscard} className="flex-1">
                    Descartar
                </Button>
                <Button onClick={onSave} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                    Guardar Rutina
                </Button>
            </div>
        </div>
    );
}
