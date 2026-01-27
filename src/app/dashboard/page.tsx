"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FaFire, FaCalendarCheck, FaDumbbell, FaPlus, FaWeight, FaArrowRight, FaTrophy, FaRuler, FaMagic, FaCheckCircle } from "react-icons/fa";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useUser, useAvances, useRutinas, useAssignments } from "@/hooks/useData";
import AnimatedCounter from "@/components/ui/animated-counter";
import AnimatedBadge from "@/components/ui/animated-badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { PremiumButton } from "@/components/ui/premium-button";
import { isToday, isFuture, format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import AIInsights from "@/components/dashboard/AIInsights";


export default function DashboardPage() {
    const router = useRouter();
    const { user, profile } = useUser();
    const { workoutLogs, weightLogs, isLoading: isLoadingAvances } = useAvances();
    const { rutinas, isLoading: isLoadingRutinas } = useRutinas();

    const { assignments, isLoading: isLoadingAssignments } = useAssignments();

    const isLoading = isLoadingAvances || isLoadingRutinas || isLoadingAssignments;

    // Assignment Logic
    const todaysAssignment = assignments?.find(a => isToday(new Date(a.dateAssigned)));
    // If no assignment today, show the next upcoming one
    const nextAssignment = assignments?.find(a => isFuture(new Date(a.dateAssigned)));
    const activeAssignment = todaysAssignment || nextAssignment;

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

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: "spring" as const, stiffness: 300, damping: 24 }
        }
    };

    return (
        <motion.div
            className="space-y-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {/* Header */}
            <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-white via-white/90 to-white/50 bg-clip-text text-transparent">
                        Hola, {user?.displayName?.split(' ')[0] || 'Atleta'} 👋
                    </h1>
                    <p className="text-muted-foreground mt-2 text-lg">
                        ¿Listo para superar tus límites hoy?
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md shadow-sm">
                        <span className="text-sm font-medium text-zinc-300 capitalize">
                            {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </span>
                    </div>
                </div>
            </motion.div>

            {/* Stats Grid */}
            <motion.div variants={itemVariants} className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="rounded-2xl border border-white/5 bg-zinc-900/50 p-6 space-y-4">
                            <div className="flex justify-between items-center">
                                <Skeleton className="h-4 w-[100px] bg-white/5" />
                                <Skeleton className="h-10 w-10 rounded-xl bg-white/5" />
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
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <Card className="rounded-2xl bg-gradient-to-br from-zinc-900/90 to-zinc-900/50 backdrop-blur-xl border-white/5 shadow-lg group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                                <div className={`absolute top-0 right-0 p-8 ${stat.color} opacity-5 blur-2xl group-hover:opacity-10 transition-opacity`} />
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-zinc-400 group-hover:text-zinc-300 transition-colors">
                                        {stat.title}
                                    </CardTitle>
                                    <div className={`p-2.5 rounded-xl ${stat.bg} ${stat.color} bg-opacity-10 shadow-inner group-hover:scale-110 transition-transform duration-300`}>
                                        <stat.icon className="h-5 w-5" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-white tracking-tight">
                                        {stat.value}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1 font-medium">
                                        {stat.description}
                                    </p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))
                )}
            </motion.div>

            <motion.div variants={itemVariants}>
                <AIInsights
                    profile={profile as any}
                    workoutLogs={workoutLogs}
                    weightLogs={weightLogs}
                />
            </motion.div>


            {/* Quick Actions */}
            <motion.div variants={itemVariants}>

                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <FaMagic className="text-purple-500 w-5 h-5" /> Accesos Rápidos
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <PremiumButton
                        variant="glass"
                        className="h-auto py-6 flex flex-col gap-3 rounded-2xl bg-zinc-900/50 border-white/5 hover:bg-zinc-800/80 hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300 group justify-center text-center items-center"
                        onClick={() => router.push("/dashboard/avances")}
                    >
                        <div className="p-3 rounded-full bg-emerald-500/10 text-emerald-500 group-hover:scale-110 transition-transform">
                            <FaWeight className="text-2xl" />
                        </div>
                        <span className="font-medium text-zinc-300 group-hover:text-white">Registrar Peso</span>
                    </PremiumButton>
                    <PremiumButton
                        variant="glass"
                        className="h-auto py-6 flex flex-col gap-3 rounded-2xl bg-zinc-900/50 border-white/5 hover:bg-zinc-800/80 hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 group justify-center text-center items-center"
                        onClick={() => router.push("/dashboard/avances")}
                    >
                        <div className="p-3 rounded-full bg-blue-500/10 text-blue-500 group-hover:scale-110 transition-transform">
                            <FaRuler className="text-2xl" />
                        </div>
                        <span className="font-medium text-zinc-300 group-hover:text-white">Registrar Medidas</span>
                    </PremiumButton>
                    <PremiumButton
                        variant="glass"
                        className="h-auto py-6 flex flex-col gap-3 rounded-2xl bg-zinc-900/50 border-white/5 hover:bg-zinc-800/80 hover:border-orange-500/30 hover:shadow-lg hover:shadow-orange-500/10 transition-all duration-300 group justify-center text-center items-center"
                        onClick={() => router.push("/dashboard/rutinas")}
                    >
                        <div className="p-3 rounded-full bg-orange-500/10 text-orange-500 group-hover:scale-110 transition-transform">
                            <FaPlus className="text-2xl" />
                        </div>
                        <span className="font-medium text-zinc-300 group-hover:text-white">Nueva Rutina</span>
                    </PremiumButton>
                    <PremiumButton
                        variant="gradient"
                        glow
                        className="h-auto py-6 flex flex-col gap-3 rounded-2xl bg-gradient-to-br from-purple-600/20 to-indigo-600/20 border border-purple-500/30 hover:from-purple-600/30 hover:to-indigo-600/30 hover:border-purple-500/60 hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300 group relative overflow-hidden justify-center text-center items-center"
                        onClick={() => router.push("/dashboard/rutinas")}
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shimmer" />
                        <div className="p-3 rounded-full bg-purple-500/20 text-purple-300 group-hover:scale-110 transition-transform shadow-inner shadow-purple-500/20">
                            <FaMagic className="text-2xl" />
                        </div>
                        <span className="font-bold text-purple-100 group-hover:text-white">Generar con IA</span>
                    </PremiumButton>
                </div>
            </motion.div>

            {/* Main Content Area */}
            <motion.div variants={itemVariants} className="grid gap-6 md:grid-cols-7">
                {/* Daily Workout / Next Assignment */}
                <Card className="col-span-12 md:col-span-7 lg:col-span-4 bg-gradient-to-br from-zinc-900 to-black border-white/10 overflow-hidden relative group rounded-3xl shadow-2xl">
                    <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-700 pointer-events-none transform rotate-12 scale-150">
                        <FaDumbbell className="w-64 h-64 text-white" />
                    </div>
                    <div className="absolute bottom-0 left-0 w-full h-full bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

                    <CardHeader className="relative z-10 pb-2">
                        <CardTitle className="text-2xl text-white flex items-center gap-2">
                            <span className={cn(
                                "w-2 h-8 rounded-full mr-2",
                                todaysAssignment ? "bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.6)]" : "bg-zinc-600"
                            )} />
                            {todaysAssignment ? "Tu Entrenamiento de Hoy" : "Siguiente Sesión"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        {isLoadingAssignments ? (
                            <div className="space-y-4">
                                <Skeleton className="h-[140px] w-full rounded-2xl bg-white/5" />
                            </div>
                        ) : activeAssignment ? (
                            <div className="space-y-6">
                                <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 backdrop-blur-md shadow-inner">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="font-bold text-2xl text-green-400">
                                            {activeAssignment.customizedRoutine?.name || "Entrenamiento Asignado"}
                                        </span>
                                        <div className="flex flex-col items-end">
                                            <AnimatedBadge
                                                variant="default"
                                                className={cn(
                                                    "shrink-0 mb-1",
                                                    isToday(new Date(activeAssignment.dateAssigned))
                                                        ? "bg-green-500/20 text-green-300 border-green-500/30"
                                                        : "bg-blue-500/20 text-blue-300 border-blue-500/30"
                                                )}
                                            >
                                                {isToday(new Date(activeAssignment.dateAssigned)) ? "HOY" : format(new Date(activeAssignment.dateAssigned), "EEEE d", { locale: es })}
                                            </AnimatedBadge>
                                        </div>
                                    </div>
                                    <p className="text-base text-zinc-400 line-clamp-2 leading-relaxed mb-4">
                                        {activeAssignment.customizedRoutine?.description || "Sin descripción disponible."}
                                    </p>
                                    <div className="flex gap-2 text-sm text-zinc-500">
                                        <span className="flex items-center gap-1"><FaDumbbell /> {activeAssignment.customizedRoutine?.exercises?.length || 0} Ejercicios</span>
                                    </div>
                                </div>
                                <PremiumButton
                                    onClick={() => router.push(`/dashboard/workout/${activeAssignment.id}`)}
                                    className={cn(
                                        "w-full h-14 text-lg font-bold rounded-xl shadow-lg transition-all duration-300",
                                        todaysAssignment
                                            ? "bg-green-500 hover:bg-green-400 text-black shadow-green-500/20 hover:shadow-green-500/40"
                                            : "bg-zinc-700 hover:bg-zinc-600 text-white"
                                    )}
                                >
                                    {todaysAssignment ? "¡Comenzar Ahora!" : "Ver Detalles"}
                                    <FaArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                                </PremiumButton>
                            </div>
                        ) : (
                            <div className="text-center py-12 space-y-6">
                                <div className="p-4 bg-zinc-800/50 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
                                    <FaCalendarCheck className="text-4xl text-zinc-600" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-2">¡Día de Descanso!</h3>
                                    <p className="text-zinc-400 max-w-[300px] mx-auto">
                                        No tienes asignaciones pendientes para hoy. ¡Disfruta tu recuperación!
                                    </p>
                                </div>
                                <PremiumButton
                                    onClick={() => router.push("/dashboard/rutinas")}
                                    variant="outline"
                                    className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                                >
                                    Ver todas mis rutinas
                                </PremiumButton>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Progress Mini-Summary */}
                <Card className="col-span-12 md:col-span-7 lg:col-span-3 bg-zinc-900/40 backdrop-blur-xl border-white/5 rounded-3xl overflow-hidden shadow-lg h-full">
                    <CardHeader className="border-b border-white/5 pb-4">
                        <CardTitle className="flex items-center gap-2">
                            <FaCalendarCheck className="text-zinc-400" /> Historial Reciente
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="space-y-4">
                            {isLoading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <Skeleton key={i} className="h-20 w-full rounded-xl bg-white/5" />
                                ))
                            ) : workoutLogs && workoutLogs.length > 0 ? (
                                <div className="space-y-3">
                                    {workoutLogs.slice(0, 4).map((log, i) => (
                                        <div key={i} className="group flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 transition-all duration-300 cursor-default">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                    <FaCheckCircle className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-zinc-200 group-hover:text-white transition-colors">{log.routineName || "Entrenamiento"}</p>
                                                    <p className="text-xs text-zinc-500 font-mono">
                                                        {new Date(log.date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold text-zinc-400 bg-zinc-900 border border-white/5 group-hover:border-primary/20 group-hover:text-primary transition-colors">
                                                    {(log.totalVolume || 0).toLocaleString()} kg
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-[200px] text-zinc-500">
                                    <FaCalendarCheck className="text-4xl mb-3 opacity-20" />
                                    <p className="text-sm">Sin historial reciente.</p>
                                </div>
                            )}
                            {(workoutLogs && workoutLogs.length > 0) && (
                                <PremiumButton
                                    variant="ghost"
                                    className="w-full text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 mt-2"
                                    onClick={() => router.push("/dashboard/avances")}
                                >
                                    Ver todo el historial <FaArrowRight className="ml-2 w-3 h-3" />
                                </PremiumButton>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </motion.div>
    );
}
