import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FaCog, FaSpinner } from "react-icons/fa";
import { ScrollArea } from "@/components/ui/scroll-area";
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
}

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
    setSpecificFocus
}: RoutinePreferencesFormProps) {
    return (
        <div className="flex flex-col h-full">
            <ScrollArea className="flex-1 pr-4 -mr-4">
                <div className="space-y-6 pb-4">
                    <div className="space-y-2">
                        <Label className="text-white">¿Qué quieres entrenar?</Label>
                        <Textarea
                            placeholder="Ej: Rutina de empuje, tracción y pierna centrada en fuerza..."
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            className="glass-input text-white min-h-[100px]"
                        />
                    </div>

                    {/* Advanced Options Toggle */}
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="w-full justify-between text-muted-foreground hover:text-white"
                    >
                        <span className="flex items-center gap-2">
                            <FaCog className="text-sm" />
                            Opciones Avanzadas
                        </span>
                        <span className="text-xs">{showAdvanced ? "▼" : "▶"}</span>
                    </Button>

                    {/* Advanced Options */}
                    {showAdvanced && (
                        <div className="space-y-6 p-6 bg-zinc-900/60 rounded-lg border border-white/20">
                            {/* First Row - 2 on md, 3 on lg, 4 on xl */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
                                {/* Split Type */}
                                <div className="space-y-2">
                                    <Label className="text-sm text-white">Tipo de División</Label>
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
                                            <SelectItem value="ppl-arnold">PPL Arnold</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

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
                            </div>

                            {/* Second Row - 2 items */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 lg:gap-6">
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
                                            <SelectItem value="6-8">6-8 reps (Fuerza/Hipertrofia)</SelectItem>
                                            <SelectItem value="8-12">8-12 reps (Hipertrofia)</SelectItem>
                                            <SelectItem value="10-15">10-15 reps (Hipertrofia/Resistencia)</SelectItem>
                                            <SelectItem value="12-20">12-20 reps (Resistencia muscular)</SelectItem>
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
                                            <SelectItem value="strength">Fuerza Máxima</SelectItem>
                                            <SelectItem value="hypertrophy">Hipertrofia Pura</SelectItem>
                                            <SelectItem value="endurance">Resistencia Muscular</SelectItem>
                                            <SelectItem value="power">Potencia/Explosividad</SelectItem>
                                            <SelectItem value="aesthetic">Estética/Definición</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="flex items-start gap-2 p-3 bg-primary/10 border border-primary/20 rounded-lg">
                                <span className="text-lg">💡</span>
                                <p className="text-xs text-primary-foreground/80">
                                    La IA combinará estas opciones con tu perfil para resultados óptimos
                                </p>
                            </div>
                        </div>
                    )}

                    {workoutLogs.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-2">
                            * La IA tendrá en cuenta tus últimos {Math.min(workoutLogs.length, 5)} entrenamientos para ajustar el volumen.
                        </p>
                    )}
                    <Button
                        onClick={handleGenerate}
                        disabled={loading || !prompt}
                        className="w-full bg-primary"
                    >
                        {loading ? (
                            <><FaSpinner className="animate-spin mr-2" /> Analizando historial y ejercicios...</>
                        ) : (
                            "Generar Rutina"
                        )}
                    </Button>
                </div>
            </ScrollArea>
        </div>
    );
}
