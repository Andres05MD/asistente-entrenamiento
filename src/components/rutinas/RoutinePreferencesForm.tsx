import { Button } from "@/components/ui/button";
import { PremiumButton } from "@/components/ui/premium-button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { FaCog, FaSpinner, FaPlus, FaTrash, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";
import { WorkoutLog } from "@/types";

interface RoutinePreferencesFormProps {
    prompt: string;
    setPrompt: (value: string) => void;
    loading: boolean;
    showAdvanced: boolean;
    setShowAdvanced: (value: boolean) => void;
    handleGenerate: () => void;
    workoutLogs: WorkoutLog[];
    // Advanced Options State
    splitType: string;
    setSplitType: (value: string) => void;
    sessionDuration: string;
    setSessionDuration: (value: string) => void;
    intensity: string;
    setIntensity: (value: string) => void;
    repRange: string;
    setRepRange: (value: string) => void;
    specificFocus: string;
    setSpecificFocus: (value: string) => void;
    // New Props for Split Logic
    generationType: "week" | "day";
    setGenerationType: (value: "week" | "day") => void;
    splitSelectionMode: "auto" | "manual";
    setSplitSelectionMode: (value: "auto" | "manual") => void;
    customSplit: { day: number, muscles: string[] }[];
    setCustomSplit: (value: { day: number, muscles: string[] }[]) => void;
    splitEvaluation: { score: number, explanation: string } | null;
    onAnalyzeSplit: () => void;
}

const MUSCLE_GROUPS = [
    "Pecho", "Espalda", "Piernas", "Hombros", "Bíceps", "Tríceps", "Abdominales", "Cardio"
];

export function RoutinePreferencesForm({
    prompt,
    setPrompt,
    loading,
    showAdvanced,
    setShowAdvanced,
    handleGenerate,
    workoutLogs,
    splitType,
    setSplitType,
    sessionDuration,
    setSessionDuration,
    intensity,
    setIntensity,
    repRange,
    setRepRange,
    specificFocus,
    setSpecificFocus,
    generationType,
    setGenerationType,
    splitSelectionMode,
    setSplitSelectionMode,
    customSplit,
    setCustomSplit,
    splitEvaluation,
    onAnalyzeSplit
}: RoutinePreferencesFormProps) {

    const toggleMuscleForDay = (dayIndex: number, muscle: string) => {
        const newSplit = [...customSplit];
        const dayMuscles = newSplit[dayIndex].muscles;
        if (dayMuscles.includes(muscle)) {
            newSplit[dayIndex].muscles = dayMuscles.filter(m => m !== muscle);
        } else {
            newSplit[dayIndex].muscles = [...dayMuscles, muscle];
        }
        setCustomSplit(newSplit);
    };

    const addDay = () => {
        setCustomSplit([...customSplit, { day: customSplit.length + 1, muscles: [] }]);
    };

    const removeDay = (index: number) => {
        const newSplit = customSplit.filter((_, i) => i !== index).map((d, i) => ({ ...d, day: i + 1 }));
        setCustomSplit(newSplit);
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <div className="space-y-6 pb-4">

                    {/* Routine Type Tabs */}
                    <Tabs value={generationType} onValueChange={(v) => setGenerationType(v as "week" | "day")} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 bg-white/5 border border-white/10">
                            <TabsTrigger value="week">Rutina Semanal</TabsTrigger>
                            <TabsTrigger value="day">Sesión Única</TabsTrigger>
                        </TabsList>
                    </Tabs>

                    {/* Main Prompt (Only for Auto or Single Day optional context) */}
                    <div className="space-y-2">
                        <Label className="text-white">Objetivo / Contexto</Label>
                        <Textarea
                            placeholder={generationType === 'week'
                                ? "Ej: Rutina enfocada en fuerza..."
                                : "Ej: Hoy quiero destruir mis piernas, tengo 1 hora..."}
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            className="glass-input text-white min-h-[80px]"
                        />
                    </div>

                    {/* Split Configuration (Weekly Only) */}
                    {generationType === 'week' && (
                        <div className="space-y-4 p-4 bg-white/5 rounded-xl border border-white/10">
                            <Label className="text-white text-base font-semibold">Distribución de Entrenamiento</Label>

                            <div className="flex gap-4">
                                <PremiumButton
                                    variant={splitSelectionMode === 'auto' ? "default" : "outline"}
                                    onClick={() => setSplitSelectionMode('auto')}
                                    className="flex-1 border-white/20"
                                >
                                    Automático (IA)
                                </PremiumButton>
                                <PremiumButton
                                    variant={splitSelectionMode === 'manual' ? "default" : "outline"}
                                    onClick={() => setSplitSelectionMode('manual')}
                                    className="flex-1 border-white/20"
                                >
                                    Manual (Diseñar Split)
                                </PremiumButton>
                            </div>

                            {/* Manual Split Editor */}
                            {splitSelectionMode === 'manual' && (
                                <div className="space-y-4 mt-4 animate-in fade-in slide-in-from-top-2">
                                    {customSplit.map((day, index) => (
                                        <div key={index} className="bg-black/40 p-3 rounded-lg border border-white/5">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-sm font-bold text-primary">Día {day.day}</span>
                                                {customSplit.length > 1 && (
                                                    <button onClick={() => removeDay(index)} className="text-muted-foreground hover:text-red-400">
                                                        <FaTrash size={12} />
                                                    </button>
                                                )}
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {MUSCLE_GROUPS.map(muscle => (
                                                    <Badge
                                                        key={muscle}
                                                        variant={day.muscles.includes(muscle) ? "default" : "outline"}
                                                        className={`cursor-pointer select-none ${day.muscles.includes(muscle) ? 'bg-primary hover:bg-primary/80' : 'bg-transparent text-muted-foreground hover:text-white hover:bg-white/10 border-white/10'}`}
                                                        onClick={() => toggleMuscleForDay(index, muscle)}
                                                    >
                                                        {muscle}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    ))}

                                    <div className="flex gap-2">
                                        <PremiumButton variant="outline" size="sm" onClick={addDay} className="flex-1 border-dashed border-white/20 hover:border-primary/50 text-muted-foreground hover:text-primary">
                                            <FaPlus className="mr-2" /> Agregar Día
                                        </PremiumButton>
                                        <PremiumButton
                                            variant="glass"
                                            size="sm"
                                            onClick={onAnalyzeSplit}
                                            className="bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-500/30"
                                        >
                                            <FaCheckCircle className="mr-2" /> Analizar Distribución
                                        </PremiumButton>
                                    </div>

                                    {/* Analysis Feeback */}
                                    {splitEvaluation && (
                                        <div className={`p-3 rounded border text-sm flex gap-3 ${splitEvaluation.score >= 70 ? 'bg-green-500/10 border-green-500/20 text-green-300' : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-300'}`}>
                                            <div className="text-2xl font-bold">{splitEvaluation.score}%</div>
                                            <div>
                                                <div className="font-bold mb-1">Análisis de IA:</div>
                                                {splitEvaluation.explanation}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Auto Split Type Selector */}
                            {splitSelectionMode === 'auto' && (
                                <div className="space-y-2">
                                    <Label className="text-sm text-muted-foreground">Preferencia de Estructura</Label>
                                    <Select value={splitType} onValueChange={setSplitType}>
                                        <SelectTrigger className="glass-input text-white h-10">
                                            <SelectValue placeholder="Selecciona tipo..." />
                                        </SelectTrigger>
                                        <SelectContent className="glass-dialog">
                                            <SelectItem value="auto">Auto (IA decide)</SelectItem>
                                            <SelectItem value="push-pull-legs">Push/Pull/Legs</SelectItem>
                                            <SelectItem value="upper-lower">Upper/Lower</SelectItem>
                                            <SelectItem value="full-body">Full Body</SelectItem>
                                            <SelectItem value="bro-split">Bro Split (músculo/día)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>
                    )}


                    {/* Advanced Options Toggle */}
                    <div className="pt-2">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className="w-full justify-between text-muted-foreground hover:text-white"
                        >
                            <span className="flex items-center gap-2">
                                <FaCog className="text-sm" />
                                {showAdvanced ? "Ocultar Opciones de Sesión" : "Mostrar Opciones de Sesión (Duración, Intensidad...)"}
                            </span>
                            <span className="text-xs">{showAdvanced ? "▼" : "▶"}</span>
                        </Button>
                    </div>

                    {/* Advanced Options */}
                    {showAdvanced && (
                        <div className="space-y-6 p-6 bg-zinc-900/60 rounded-lg border border-white/20">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 lg:gap-6">
                                {/* Session Duration */}
                                <div className="space-y-2">
                                    <Label className="text-sm text-white">Duración Sesión</Label>
                                    <Select value={sessionDuration} onValueChange={setSessionDuration}>
                                        <SelectTrigger className="glass-input text-white h-10">
                                            <SelectValue placeholder="Selecciona duración..." />
                                        </SelectTrigger>
                                        <SelectContent className="glass-dialog">
                                            <SelectItem value="45">45 min (Estándar)</SelectItem>
                                            <SelectItem value="60">60 min (Completo)</SelectItem>
                                            <SelectItem value="75">75 min (Extendido)</SelectItem>
                                            <SelectItem value="90">90 min (Máximo)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Intensity */}
                                <div className="space-y-2">
                                    <Label className="text-sm text-white">Intensidad</Label>
                                    <Select value={intensity} onValueChange={setIntensity}>
                                        <SelectTrigger className="glass-input text-white h-10">
                                            <SelectValue placeholder="Selecciona intensidad..." />
                                        </SelectTrigger>
                                        <SelectContent className="glass-dialog">
                                            <SelectItem value="light">Ligera (RPE 5-6)</SelectItem>
                                            <SelectItem value="moderate">Moderada (RPE 7-8)</SelectItem>
                                            <SelectItem value="high">Alta (RPE 8-9)</SelectItem>
                                            <SelectItem value="max">Máxima (RPE 9-10)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Rep Range */}
                                <div className="space-y-2">
                                    <Label className="text-sm text-white">Rango de Repeticiones</Label>
                                    <Select value={repRange} onValueChange={setRepRange}>
                                        <SelectTrigger className="glass-input text-white h-10">
                                            <SelectValue placeholder="Selecciona rango..." />
                                        </SelectTrigger>
                                        <SelectContent className="glass-dialog">
                                            <SelectItem value="auto">Auto (IA decide)</SelectItem>
                                            <SelectItem value="1-5">1-5 reps (Fuerza máxima)</SelectItem>
                                            <SelectItem value="8-12">8-12 reps (Hipertrofia)</SelectItem>
                                            <SelectItem value="12-20">12-20 reps (Resistencia)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Specific Focus */}
                                <div className="space-y-2">
                                    <Label className="text-sm text-white">Énfasis Específico</Label>
                                    <Select value={specificFocus} onValueChange={setSpecificFocus}>
                                        <SelectTrigger className="glass-input text-white h-10">
                                            <SelectValue placeholder="Selecciona énfasis..." />
                                        </SelectTrigger>
                                        <SelectContent className="glass-dialog">
                                            <SelectItem value="balanced">Balanceado</SelectItem>
                                            <SelectItem value="strength">Fuerza</SelectItem>
                                            <SelectItem value="hypertrophy">Hipertrofia</SelectItem>
                                            <SelectItem value="endurance">Resistencia</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-4 pt-4 border-t border-white/10 shrink-0">
                <PremiumButton
                    onClick={handleGenerate}
                    disabled={loading || (splitSelectionMode === 'manual' && generationType === 'week' ? false : !prompt)}
                    className="w-full bg-primary font-bold text-lg h-12"
                    glow // Added glow for emphasis
                >
                    {loading ? (
                        <><FaSpinner className="animate-spin mr-2" /> Analizando y Generando...</>
                    ) : (
                        "Generar Rutina Ahora"
                    )}
                </PremiumButton>
            </div>
        </div>
    );
}
