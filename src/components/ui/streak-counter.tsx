"use client";

import { motion } from "framer-motion";
import { FaFire, FaTrophy } from "react-icons/fa";
import { cn } from "@/lib/utils";

interface StreakCounterProps {
    currentStreak: number;
    bestStreak?: number;
    className?: string;
}

export default function StreakCounter({
    currentStreak,
    bestStreak,
    className,
}: StreakCounterProps) {
    const flames = Math.min(Math.floor(currentStreak / 3), 5);

    return (
        <div className={cn("relative", className)}>
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative p-6 rounded-2xl bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20 backdrop-blur-sm overflow-hidden"
            >
                {/* Animated background glow */}
                <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-red-500/20"
                    animate={{
                        opacity: [0.3, 0.6, 0.3],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />

                <div className="relative z-10 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-orange-200/80 mb-1">Racha Actual</p>
                        <div className="flex items-center gap-2">
                            <motion.div
                                animate={currentStreak > 0 ? {
                                    scale: [1, 1.2, 1],
                                } : {}}
                                transition={{
                                    duration: 0.5,
                                    repeat: currentStreak > 0 ? Infinity : 0,
                                    repeatDelay: 2,
                                }}
                            >
                                <FaFire
                                    className={cn(
                                        "text-3xl",
                                        currentStreak === 0
                                            ? "text-gray-500"
                                            : currentStreak < 7
                                                ? "text-orange-400"
                                                : currentStreak < 14
                                                    ? "text-orange-500"
                                                    : "text-red-500"
                                    )}
                                />
                            </motion.div>
                            <motion.span
                                className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent"
                                key={currentStreak}
                                initial={{ scale: 1.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                            >
                                {currentStreak}
                            </motion.span>
                            <span className="text-sm text-orange-200/60">días</span>
                        </div>

                        {/* Flame indicators */}
                        {currentStreak > 0 && (
                            <div className="flex gap-1 mt-2">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{
                                            opacity: i < flames ? 1 : 0.2,
                                            y: i < flames ? [0, -3, 0] : 0,
                                        }}
                                        transition={{
                                            duration: 0.5,
                                            delay: i * 0.1,
                                            repeat: i < flames ? Infinity : 0,
                                            repeatDelay: 1,
                                        }}
                                        className={cn(
                                            "w-2 h-3 rounded-full",
                                            i < flames
                                                ? "bg-gradient-to-t from-orange-500 to-yellow-400"
                                                : "bg-gray-600"
                                        )}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {bestStreak !== undefined && bestStreak > 0 && (
                        <div className="text-right">
                            <div className="flex items-center gap-1 text-yellow-400 mb-1">
                                <FaTrophy className="text-sm" />
                                <p className="text-xs text-yellow-200/80">Mejor</p>
                            </div>
                            <p className="text-2xl font-bold text-yellow-400">{bestStreak}</p>
                        </div>
                    )}
                </div>

                {/* Motivational message */}
                {currentStreak > 0 && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="text-xs text-orange-200/60 mt-3 text-center"
                    >
                        {currentStreak < 3 && "¡Sigue así! 💪"}
                        {currentStreak >= 3 && currentStreak < 7 && "¡Estás en fuego! 🔥"}
                        {currentStreak >= 7 && currentStreak < 14 && "¡Increíble racha! ⭐"}
                        {currentStreak >= 14 && "¡Imparable! 🚀"}
                    </motion.p>
                )}
            </motion.div>
        </div>
    );
}
