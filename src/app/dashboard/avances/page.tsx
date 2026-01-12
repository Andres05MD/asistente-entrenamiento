"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FaTrophy, FaFire, FaCalendarCheck, FaChartLine, FaWeight, FaRuler, FaDumbbell } from "react-icons/fa";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PremiumButton } from "@/components/ui/premium-button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
} from "recharts";
import { useAvances } from "@/hooks/useData";
import { useEntrenamiento } from "@/hooks/useEntrenamiento";
import AnimatedCounter from "@/components/ui/animated-counter";
import AnimatedBadge from "@/components/ui/animated-badge";
import CircularProgress from "@/components/ui/circular-progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import StreakCounter from "@/components/ui/streak-counter";
import ProgressBar from "@/components/ui/progress-bar";
import AchievementCard from "@/components/ui/achievement-card";
import { WorkoutLog, WeightLog } from "@/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-zinc-950/90 border border-white/10 p-3 rounded-xl backdrop-blur-md shadow-xl">
                <p className="text-white font-medium mb-1">{label}</p>
                <p className="text-primary text-sm">
                    {payload[0].value} {payload[0].dataKey === 'weight' ? 'kg' : ''}
                </p>
            </div>
        );
    }
    return null;
};

export default function AvancesPage() {
    const { workoutLogs, weightLogs, isLoading } = useAvances();
    const { saveWeightLog, saveMeasurementsLog } = useEntrenamiento();

    // Dialog State
    const [openWeightDialog, setOpenWeightDialog] = useState(false);
    const [weightInput, setWeightInput] = useState("");

    const [openMeasurementsDialog, setOpenMeasurementsDialog] = useState(false);
    const [measurementsInput, setMeasurementsInput] = useState({
        chest: "", waist: "", hips: "",
        armLeft: "", armRight: "",
        thighLeft: "", thighRight: "",
        calfLeft: "", calfRight: "",
        shoulders: "", neck: ""
    });

    const handleSaveWeight = async () => {
        const weight = parseFloat(weightInput);
        if (!weight || isNaN(weight)) return;

        await saveWeightLog.mutateAsync(weight);
        setOpenWeightDialog(false);
        setWeightInput("");
    };

    const handleSaveMeasurements = async () => {
        const measurements: any = {};
        Object.entries(measurementsInput).forEach(([key, value]) => {
            if (value) measurements[key] = parseFloat(value);
        });

        if (Object.keys(measurements).length === 0) return;

        await saveMeasurementsLog.mutateAsync(measurements);
        setOpenMeasurementsDialog(false);
        setMeasurementsInput({
            chest: "", waist: "", hips: "",
            armLeft: "", armRight: "",
            thighLeft: "", thighRight: "",
            calfLeft: "", calfRight: "",
            shoulders: "", neck: ""
        });
    };

    // Calculate Stats
    const totalWorkouts = workoutLogs.length;
    const totalVolume = workoutLogs.reduce((acc: number, log: WorkoutLog) => acc + (log.totalVolume || 0), 0);

    // Calculate Real Streaks (Consecutive Days)
    let currentStreak = 0;
    const uniqueDates = Array.from(new Set(workoutLogs.map(log => new Date(log.date).toDateString())))
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime()); // Newest first

    if (uniqueDates.length > 0) {
        const todayStr = new Date().toDateString();
        const yesterdayStr = new Date(Date.now() - 86400000).toDateString();
        const lastWorkout = uniqueDates[0];

        if (lastWorkout === todayStr || lastWorkout === yesterdayStr) {
            currentStreak = 1;
            for (let i = 0; i < uniqueDates.length - 1; i++) {
                const curr = new Date(uniqueDates[i]);
                const prev = new Date(uniqueDates[i + 1]);
                const diffTime = Math.abs(curr.getTime() - prev.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays === 1) {
                    currentStreak++;
                } else {
                    break;
                }
            }
        }
    }

    // Workouts this month
    const now = new Date();
    const workoutsThisMonth = workoutLogs.filter((log: WorkoutLog) => {
        const d = new Date(log.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;

    // Weekly Data Processing (Current Week)
    const getStartOfWeek = (date: Date) => {
        const d = new Date(date);
        const day = d.getDay() || 7; // Get current day number, converting Sun. to 7
        if (day !== 1) d.setHours(-24 * (day - 1)); // Set to Monday past
        return d;
    };

    const startOfWeek = getStartOfWeek(new Date());
    startOfWeek.setHours(0, 0, 0, 0);

    const weeklyData = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((dayName, index) => {
        const targetDate = new Date(startOfWeek);
        targetDate.setDate(startOfWeek.getDate() + index);

        const count = workoutLogs.filter(log => {
            const d = new Date(log.date);
            return d.getDate() === targetDate.getDate() &&
                d.getMonth() === targetDate.getMonth() &&
                d.getFullYear() === targetDate.getFullYear();
        }).length;

        return { name: dayName, workouts: count };
    });

    const volumeData = workoutLogs
        .slice(0, 30) // Show last 30 workouts only for cleaner chart
        .reverse()
        .map((log: WorkoutLog) => ({
            name: new Date(log.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
            volume: log.totalVolume
        }));

    const weightData = weightLogs
        .slice(0, 30)
        .map((log: WeightLog) => ({
            name: new Date(log.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
            weight: log.weight
        }));

    const stats = [
        {
            title: "Entrenamientos Completados",
            value: totalWorkouts.toString(),
            icon: FaTrophy,
            color: "from-yellow-400 to-orange-500",
            description: "En total"
        },
        {
            title: "Racha Actual",
            value: currentStreak.toString(),
            icon: FaFire,
            color: "from-red-500 to-pink-500",
            description: "Días seguidos"
        },
        {
            title: "Este Mes",
            value: workoutsThisMonth.toString(),
            icon: FaCalendarCheck,
            color: "from-blue-400 to-indigo-500",
            description: "Sesiones realizadas"
        },
        {
            title: "Volumen Total",
            value: `${(totalVolume / 1000).toFixed(1)} t`,
            icon: FaChartLine,
            color: "from-green-400 to-emerald-500",
            description: "Levantados"
        }
    ];

    return (
        <div className="space-y-8 animate-in fade-in-50 duration-500" suppressHydrationWarning>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold text-white">Tu Progreso</h1>
                    <p className="text-muted-foreground">Visualiza tus logros y mantén la motivación.</p>
                </div>

                <div className="flex gap-2">
                    <Dialog open={openMeasurementsDialog} onOpenChange={setOpenMeasurementsDialog}>
                        <DialogTrigger asChild>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <PremiumButton className="bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-900/20">
                                        <FaRuler className="mr-2" /> Registrar Medidas
                                    </PremiumButton>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Registra tus medidas corporales</p>
                                </TooltipContent>
                            </Tooltip>
                        </DialogTrigger>
                        <DialogContent className="glass-dialog max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Registrar Medidas Corporales</DialogTitle>
                                <DialogDescription>
                                    Ingresa tus medidas en centímetros para realizar el seguimiento.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                                {/* Torso */}
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-white/50 uppercase">Pecho</label>
                                    <Input
                                        type="number"
                                        placeholder="cm"
                                        className="bg-white/5 border-white/10"
                                        value={measurementsInput.chest}
                                        onChange={(e) => setMeasurementsInput({ ...measurementsInput, chest: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-white/50 uppercase">Espalda/Hombros</label>
                                    <Input
                                        type="number"
                                        placeholder="cm"
                                        className="bg-white/5 border-white/10"
                                        value={measurementsInput.shoulders}
                                        onChange={(e) => setMeasurementsInput({ ...measurementsInput, shoulders: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-white/50 uppercase">Cintura</label>
                                    <Input
                                        type="number"
                                        placeholder="cm"
                                        className="bg-white/5 border-white/10"
                                        value={measurementsInput.waist}
                                        onChange={(e) => setMeasurementsInput({ ...measurementsInput, waist: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-white/50 uppercase">Caderas</label>
                                    <Input
                                        type="number"
                                        placeholder="cm"
                                        className="bg-white/5 border-white/10"
                                        value={measurementsInput.hips}
                                        onChange={(e) => setMeasurementsInput({ ...measurementsInput, hips: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-white/50 uppercase">Cuello</label>
                                    <Input
                                        type="number"
                                        placeholder="cm"
                                        className="bg-white/5 border-white/10"
                                        value={measurementsInput.neck}
                                        onChange={(e) => setMeasurementsInput({ ...measurementsInput, neck: e.target.value })}
                                    />
                                </div>

                                {/* Brazos */}
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-white/50 uppercase">Brazo Izquierdo</label>
                                    <Input
                                        type="number"
                                        placeholder="cm"
                                        className="bg-white/5 border-white/10"
                                        value={measurementsInput.armLeft}
                                        onChange={(e) => setMeasurementsInput({ ...measurementsInput, armLeft: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-white/50 uppercase">Brazo Derecho</label>
                                    <Input
                                        type="number"
                                        placeholder="cm"
                                        className="bg-white/5 border-white/10"
                                        value={measurementsInput.armRight}
                                        onChange={(e) => setMeasurementsInput({ ...measurementsInput, armRight: e.target.value })}
                                    />
                                </div>

                                {/* Piernas */}
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-white/50 uppercase">Muslo Izquierdo</label>
                                    <Input
                                        type="number"
                                        placeholder="cm"
                                        className="bg-white/5 border-white/10"
                                        value={measurementsInput.thighLeft}
                                        onChange={(e) => setMeasurementsInput({ ...measurementsInput, thighLeft: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-white/50 uppercase">Muslo Derecho</label>
                                    <Input
                                        type="number"
                                        placeholder="cm"
                                        className="bg-white/5 border-white/10"
                                        value={measurementsInput.thighRight}
                                        onChange={(e) => setMeasurementsInput({ ...measurementsInput, thighRight: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-white/50 uppercase">Pantorrilla Izquierda</label>
                                    <Input
                                        type="number"
                                        placeholder="cm"
                                        className="bg-white/5 border-white/10"
                                        value={measurementsInput.calfLeft}
                                        onChange={(e) => setMeasurementsInput({ ...measurementsInput, calfLeft: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-white/50 uppercase">Pantorrilla Derecha</label>
                                    <Input
                                        type="number"
                                        placeholder="cm"
                                        className="bg-white/5 border-white/10"
                                        value={measurementsInput.calfRight}
                                        onChange={(e) => setMeasurementsInput({ ...measurementsInput, calfRight: e.target.value })}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <PremiumButton
                                    onClick={handleSaveMeasurements}
                                    className="bg-blue-600 hover:bg-blue-700 text-white w-full"
                                    disabled={saveMeasurementsLog.isPending}
                                >
                                    {saveMeasurementsLog.isPending ? "Guardando..." : "Guardar Medidas"}
                                </PremiumButton>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={openWeightDialog} onOpenChange={setOpenWeightDialog}>
                        <DialogTrigger asChild>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <PremiumButton className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-900/20">
                                        <FaWeight className="mr-2" /> Registrar Peso
                                    </PremiumButton>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Registra tu peso corporal actual</p>
                                </TooltipContent>
                            </Tooltip>
                        </DialogTrigger>
                        <DialogContent className="glass-dialog">
                            <DialogHeader>
                                <DialogTitle>Registrar Peso Corporal</DialogTitle>
                                <DialogDescription>
                                    Ingresa tu peso actual para realizar el seguimiento en tu gráfica de progreso.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="flex items-center gap-4">
                                    <Input
                                        id="weight"
                                        type="number"
                                        placeholder="Ej: 75.5"
                                        className="col-span-3 bg-white/5 border-white/10"
                                        value={weightInput}
                                        onChange={(e) => setWeightInput(e.target.value)}
                                    />
                                    <span className="text-white font-bold">kg</span>
                                </div>
                            </div>
                            <DialogFooter>
                                <PremiumButton
                                    onClick={handleSaveWeight}
                                    className="bg-emerald-500 hover:bg-emerald-600 text-white w-full"
                                    disabled={saveWeightLog.isPending}
                                >
                                    {saveWeightLog.isPending ? "Guardando..." : "Guardar Registro"}
                                </PremiumButton>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="rounded-xl border border-white/5 bg-card/50 p-6 space-y-3">
                            <Skeleton className="h-8 w-8 bg-white/5 rounded-lg mb-2" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-[120px] bg-white/5" />
                                <Skeleton className="h-8 w-[80px] bg-white/5" />
                            </div>
                        </div>
                    ))
                ) : (
                    stats.map((stat, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Card className="bg-card/50 backdrop-blur-xl border-white/5 overflow-hidden relative group hover:border-white/10 transition-colors">
                                <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity bg-gradient-to-br ${stat.color} bg-clip-text text-transparent`}>
                                    <stat.icon className="w-24 h-24" />
                                </div>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">
                                        {stat.title}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-2">
                                        <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.color} bg-opacity-10`}>
                                            <stat.icon className="w-5 h-5 text-white" />
                                        </div>
                                        <div className="text-2xl font-bold text-white">
                                            <AnimatedCounter
                                                value={parseFloat(stat.value.toString().replace(/[^0-9.]/g, '')) || 0}
                                                suffix={stat.value.toString().match(/[^0-9.]/g)?.join('') || ''}
                                                decimals={stat.value.toString().includes('.') ? 1 : 0}
                                            />
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        {stat.description}
                                    </p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Monthly Progress Circle */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="flex justify-center"
            >
                <Card className="glass-card hover:border-primary/20 transition-all inline-flex">
                    <CardContent className="p-8">
                        {isLoading ? (
                            <div className="flex flex-col items-center space-y-4">
                                <Skeleton className="h-[160px] w-[160px] rounded-full bg-white/5" />
                                <div className="space-y-2">
                                    <Skeleton className="h-6 w-[120px] bg-white/5" />
                                    <Skeleton className="h-4 w-[160px] bg-white/5" />
                                </div>
                            </div>
                        ) : (
                            <div className="text-center space-y-4">
                                <CircularProgress
                                    value={workoutsThisMonth}
                                    max={20}
                                    size={160}
                                    strokeWidth={12}
                                    variant="success"
                                    showValue
                                    label="Este Mes"
                                />
                                <div>
                                    <h3 className="text-lg font-semibold text-white">Meta Mensual</h3>
                                    <p className="text-sm text-muted-foreground">20 entrenamientos objetivo</p>
                                    {workoutsThisMonth >= 20 && (
                                        <AnimatedBadge variant="success" pulse className="mt-2">
                                            ¡Meta Alcanzada!
                                        </AnimatedBadge>
                                    )}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>

            {/* Achievements & Progress Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="space-y-6"
            >
                {/* Streak Counter */}
                <StreakCounter
                    currentStreak={currentStreak}
                    bestStreak={7} // You can calculate this from your data
                />

                {/* Progress Bars */}
                <Card className="glass-card">
                    <CardHeader>
                        <CardTitle>Objetivos del Mes</CardTitle>
                        <CardDescription>Tu progreso hacia las metas establecidas</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {isLoading ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="space-y-2">
                                    <div className="flex justify-between">
                                        <Skeleton className="h-4 w-[100px] bg-white/5" />
                                        <Skeleton className="h-4 w-[30px] bg-white/5" />
                                    </div>
                                    <Skeleton className="h-3 w-full bg-white/5 rounded-full" />
                                </div>
                            ))
                        ) : (
                            <>
                                <ProgressBar
                                    value={workoutsThisMonth}
                                    max={20}
                                    label="Entrenamientos"
                                    variant={workoutsThisMonth >= 20 ? "success" : "default"}
                                    icon={<FaDumbbell />}
                                />
                                <ProgressBar
                                    value={totalVolume}
                                    max={50000}
                                    label="Volumen Total (kg)"
                                    variant={totalVolume >= 50000 ? "success" : "warning"}
                                    icon={<FaChartLine />}
                                />
                                <ProgressBar
                                    value={totalWorkouts}
                                    max={100}
                                    label="Camino a 100 entrenamientos"
                                    variant="default"
                                    icon={<FaTrophy />}
                                />
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Achievements Grid */}
                <div>
                    <h2 className="text-2xl font-bold text-white mb-4">Logros</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {isLoading ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <Skeleton key={i} className="h-[100px] w-full rounded-xl bg-white/5" />
                            ))
                        ) : (
                            <>
                                <AchievementCard
                                    title="Primer Entrenamiento"
                                    description="Completaste tu primer entrenamiento"
                                    icon={<FaDumbbell className="text-xl" />}
                                    unlocked={totalWorkouts >= 1}
                                    rarity="common"
                                />
                                <AchievementCard
                                    title="Racha de Fuego"
                                    description="Entrena 7 días seguidos"
                                    icon={<FaFire className="text-xl" />}
                                    unlocked={currentStreak >= 7}
                                    progress={currentStreak}
                                    maxProgress={7}
                                    rarity="rare"
                                />
                                <AchievementCard
                                    title="Dedicación Total"
                                    description="Alcanza 20 entrenamientos en un mes"
                                    icon={<FaCalendarCheck className="text-xl" />}
                                    unlocked={workoutsThisMonth >= 20}
                                    progress={workoutsThisMonth}
                                    maxProgress={20}
                                    rarity="epic"
                                />
                                <AchievementCard
                                    title="Maestro del Hierro"
                                    description="Levanta un total de 50 toneladas"
                                    icon={<FaWeight className="text-xl" />}
                                    unlocked={totalVolume >= 50000}
                                    progress={totalVolume}
                                    maxProgress={50000}
                                    rarity="epic"
                                />
                                <AchievementCard
                                    title="Centurión"
                                    description="Completa 100 entrenamientos"
                                    icon={<FaTrophy className="text-xl" />}
                                    unlocked={totalWorkouts >= 100}
                                    progress={totalWorkouts}
                                    maxProgress={100}
                                    rarity="legendary"
                                />
                                <AchievementCard
                                    title="Imparable"
                                    description="Mantén una racha de 30 días"
                                    icon={<FaFire className="text-xl" />}
                                    unlocked={currentStreak >= 30}
                                    progress={currentStreak}
                                    maxProgress={30}
                                    rarity="legendary"
                                />
                            </>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Activity Chart */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <Card className="bg-gradient-to-br from-zinc-900/90 to-zinc-900/50 backdrop-blur-xl border-white/5 h-full hover:border-white/10 transition-colors shadow-xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FaCalendarCheck className="text-blue-500" /> Actividad Semanal
                            </CardTitle>
                            <CardDescription>Sesiones de entrenamiento esta semana</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px] min-h-[300px] w-full">
                                {isLoading ? (
                                    <Skeleton className="h-full w-full bg-white/5 rounded-lg" />
                                ) : weeklyData && weeklyData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={weeklyData}>
                                            <defs>
                                                <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8} />
                                                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                            <XAxis
                                                dataKey="name"
                                                stroke="rgba(255,255,255,0.4)"
                                                fontSize={12}
                                                tickLine={false}
                                                axisLine={false}
                                                dy={10}
                                            />
                                            <YAxis
                                                stroke="rgba(255,255,255,0.4)"
                                                fontSize={12}
                                                tickLine={false}
                                                axisLine={false}
                                                tickFormatter={(value) => `${value}`}
                                            />
                                            <RechartsTooltip
                                                content={<CustomTooltip />}
                                                cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                                            />
                                            <Bar
                                                dataKey="workouts"
                                                fill="url(#colorBar)"
                                                radius={[6, 6, 0, 0]}
                                                maxBarSize={50}
                                                animationDuration={1500}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex h-full items-center justify-center text-muted-foreground">
                                        No hay datos de actividad semanal aún
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Volume Progress Chart */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <Card className="bg-gradient-to-br from-zinc-900/90 to-zinc-900/50 backdrop-blur-xl border-white/5 h-full hover:border-white/10 transition-colors shadow-xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FaChartLine className="text-purple-500" /> Volumen de Carga
                            </CardTitle>
                            <CardDescription>Progreso histórico (kg)</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px] min-h-[300px] w-full">
                                {isLoading ? (
                                    <Skeleton className="h-full w-full bg-white/5 rounded-lg" />
                                ) : volumeData && volumeData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <AreaChart data={volumeData}>
                                            <defs>
                                                <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                            <XAxis
                                                dataKey="name"
                                                stroke="rgba(255,255,255,0.4)"
                                                fontSize={12}
                                                tickLine={false}
                                                axisLine={false}
                                                dy={10}
                                            />
                                            <YAxis
                                                stroke="rgba(255,255,255,0.4)"
                                                fontSize={12}
                                                tickLine={false}
                                                axisLine={false}
                                                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                                            />
                                            <RechartsTooltip content={<CustomTooltip />} />
                                            <Area
                                                type="monotone"
                                                dataKey="volume"
                                                stroke="#8b5cf6"
                                                strokeWidth={3}
                                                fillOpacity={1}
                                                fill="url(#colorVolume)"
                                                animationDuration={1500}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex h-full items-center justify-center text-muted-foreground">
                                        No hay datos de entrenamientos aún
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Body Weight Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="lg:col-span-2"
                >
                    <Card className="bg-gradient-to-br from-zinc-900/90 to-zinc-900/50 backdrop-blur-xl border-white/5 hover:border-white/10 transition-colors shadow-xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FaWeight className="text-emerald-500" /> Peso Corporal
                            </CardTitle>
                            <CardDescription>Seguimiento de tu peso (kg)</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px] min-h-[300px] w-full">
                                {isLoading ? (
                                    <Skeleton className="h-full w-full bg-white/5 rounded-lg" />
                                ) : weightData && weightData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <AreaChart data={weightData}>
                                            <defs>
                                                <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                            <XAxis
                                                dataKey="name"
                                                stroke="rgba(255,255,255,0.4)"
                                                fontSize={12}
                                                tickLine={false}
                                                axisLine={false}
                                                dy={10}
                                            />
                                            <YAxis
                                                domain={['dataMin - 1', 'dataMax + 1']}
                                                stroke="rgba(255,255,255,0.4)"
                                                fontSize={12}
                                                tickLine={false}
                                                axisLine={false}
                                            />
                                            <RechartsTooltip content={<CustomTooltip />} />
                                            <Area
                                                type="monotone"
                                                dataKey="weight"
                                                stroke="#10b981"
                                                strokeWidth={3}
                                                fillOpacity={1}
                                                fill="url(#colorWeight)"
                                                animationDuration={1500}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex h-full items-center justify-center text-muted-foreground">
                                        No hay registros de peso aún
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}
