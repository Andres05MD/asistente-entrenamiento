"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FaFire, FaCalendarCheck, FaDumbbell, FaPlus, FaWeight, FaArrowRight, FaTrophy, FaRuler, FaMagic } from "react-icons/fa";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useUser, useAvances, useRutinas } from "@/hooks/useData";
import AnimatedCounter from "@/components/ui/animated-counter";
import AnimatedBadge from "@/components/ui/animated-badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
    const router = useRouter();
    const { user, profile } = useUser();
    const { workoutLogs, isLoading: isLoadingAvances } = useAvances();
    const { rutinas, isLoading: isLoadingRutinas } = useRutinas();

    const isLoading = isLoadingAvances || isLoadingRutinas;

    // Stats Logic
    const totalWorkouts = workoutLogs?.length || 0;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday as start
    startOfWeek.setHours(0, 0, 0, 0);

    const workoutsThisMonth = workoutLogs?.filter(log => new Date(log.date) >= startOfMonth).length || 0;
    const workoutsThisWeek = workoutLogs?.filter(log => new Date(log.date) >= startOfWeek).length || 0;
    const weeklyGoal = profile?.days || 4;

    // Calculate weekly volume
    const volumeThisWeek = workoutLogs
        ?.filter(log => new Date(log.date) >= startOfWeek)
        .reduce((sum, log) => sum + (log.totalVolume || 0), 0) || 0;

    const stats = [
        {
            title: "Objetivo Semanal",
            value: `${workoutsThisWeek}/${weeklyGoal}`,
            description: "Sesiones completadas",
            icon: FaCalendarCheck,
            color: "text-green-500",
            bg: "bg-green-500/10",
        },
        {
            title: "Voluman Semanal",
            value: `${(volumeThisWeek / 1000).toFixed(1)}t`,
            description: "Kilos levantados",
            icon: FaDumbbell,
            color: "text-purple-500",
            bg: "bg-purple-500/10",
        },
        {
            title: "Entrenamientos",
            value: workoutsThisMonth.toString(),
            description: "Este mes",
            icon: FaFire,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
        },
        {
            title: "Total Historico",
            value: totalWorkouts.toString(),
            description: "Desde el inicio",
            icon: FaTrophy, // Changed icon for variety
            color: "text-orange-500",
            bg: "bg-orange-500/10",
        }
    ];

    // Find latest routine
    const latestRoutine = rutinas?.[0];

    return (
        <div className="space-y-8 animate-in fade-in-50 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                        Hola, {user?.displayName?.split(' ')[0] || 'Atleta'}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        ¿Listo para superar tus límites hoy?
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground bg-white/5 border border-white/5 px-3 py-1.5 rounded-full">
                        {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => ( // Increased skeleton count
                        <div key={i} className="rounded-xl border border-white/5 bg-card/50 p-6 space-y-3">
                            <div className="flex justify-between items-center">
                                <Skeleton className="h-4 w-[100px] bg-white/5" />
                                <Skeleton className="h-8 w-8 rounded-lg bg-white/5" />
                            </div>
                            <div className="space-y-2">
                                <Skeleton className="h-8 w-[60px] bg-white/5" />
                                <Skeleton className="h-3 w-[80px] bg-white/5" />
                            </div>
                        </div>
                    ))
                ) : (
                    stats.map((stat, index) => (
                        <motion.div
                            key={stat.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Card className="bg-card/50 backdrop-blur-sm border-white/5 hover:border-primary/20 transition-all duration-300">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">
                                        {stat.title}
                                    </CardTitle>
                                    <div className={`p-2 rounded-lg ${stat.bg}`}>
                                        <stat.icon className={`h-4 w-4 ${stat.color}`} />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {stat.value}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {stat.description}
                                    </p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Quick Actions */}
            <div>
                <h2 className="text-lg font-semibold text-white mb-4">Accesos Rápidos</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Button
                        variant="outline"
                        className="h-auto py-6 flex flex-col gap-2 bg-white/5 border-white/10 hover:bg-primary/20 hover:text-primary hover:border-primary/50 transition-all"
                        onClick={() => router.push("/dashboard/avances")}
                    >
                        <FaWeight className="text-xl mb-1" />
                        <span>Registrar Peso</span>
                    </Button>
                    <Button
                        variant="outline"
                        className="h-auto py-6 flex flex-col gap-2 bg-white/5 border-white/10 hover:bg-primary/20 hover:text-primary hover:border-primary/50 transition-all"
                        onClick={() => router.push("/dashboard/avances")}
                    >
                        <FaRuler className="text-xl mb-1" />
                        <span>Mis Medidas</span>
                    </Button>
                    <Button
                        variant="outline"
                        className="h-auto py-6 flex flex-col gap-2 bg-white/5 border-white/10 hover:bg-primary/20 hover:text-primary hover:border-primary/50 transition-all"
                        onClick={() => router.push("/dashboard/rutinas")}
                    >
                        <FaPlus className="text-xl mb-1" />
                        <span>Nueva Rutina</span>
                    </Button>
                    <Button
                        variant="outline"
                        className="h-auto py-6 flex flex-col gap-2 bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-white/10 hover:from-purple-500/20 hover:to-blue-500/20 hover:border-purple-500/50 transition-all"
                        onClick={() => router.push("/dashboard/rutinas")}
                    >
                        <FaMagic className="text-xl mb-1 text-purple-400" />
                        <span>Generar con IA</span>
                    </Button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="grid gap-4 md:grid-cols-7">
                {/* Quick Start / Next Workout */}
                <Card className="col-span-12 md:col-span-7 lg:col-span-4 bg-gradient-to-br from-zinc-900 to-black border-white/10 overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none">
                        <FaDumbbell className="w-48 h-48 text-white rotate-12" />
                    </div>
                    <CardHeader>
                        <CardTitle className="text-white">Entrenamiento Rápido</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="space-y-4">
                                <Skeleton className="h-[120px] w-full rounded-xl bg-white/5" />
                            </div>
                        ) : latestRoutine ? (
                            <div className="space-y-4 relative z-10">
                                <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-bold text-lg text-primary">{latestRoutine.routineName}</span>
                                        <AnimatedBadge variant="default" className="shrink-0">
                                            {latestRoutine.days?.length || 0} Días
                                        </AnimatedBadge>
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                                        {latestRoutine.description || "Tu rutina personalizada."}
                                    </p>
                                    <Button
                                        onClick={() => router.push(`/dashboard/rutinas/${latestRoutine.id}`)}
                                        className="w-full bg-green-500 hover:bg-green-600 text-white font-bold shadow-lg shadow-green-900/20"
                                    >
                                        Ir a Entrenar <FaArrowRight className="ml-2" />
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8 space-y-4 relative z-10">
                                <p className="text-muted-foreground">No tienes rutinas activas.</p>
                                <Button
                                    onClick={() => router.push("/dashboard/rutinas")}
                                    variant="secondary"
                                >
                                    Crear Rutina con IA
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Progress Mini-Summary */}
                <Card className="col-span-12 md:col-span-7 lg:col-span-3 bg-card/50 backdrop-blur-sm border-white/5">
                    <CardHeader>
                        <CardTitle>Historial Reciente</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {isLoading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <Skeleton key={i} className="h-16 w-full rounded-lg bg-white/5" />
                                ))
                            ) : workoutLogs && workoutLogs.length > 0 ? (
                                workoutLogs.slice(0, 3).map((log, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                        <div>
                                            <p className="font-medium text-white">{log.routineName || "Entrenamiento Libre"}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(log.date).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-1 rounded">
                                                {(log.totalVolume || 0).toLocaleString()} kg
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    Sin historial reciente.
                                </p>
                            )}
                            <Button
                                variant="ghost"
                                className="w-full text-xs text-muted-foreground hover:text-white"
                                onClick={() => router.push("/dashboard/avances")}
                            >
                                Ver todo el historial
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div >
    );
}
