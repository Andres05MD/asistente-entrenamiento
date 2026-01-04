"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { FaCheck, FaLock, FaStar } from "react-icons/fa";

interface AchievementCardProps {
    title: string;
    description: string;
    icon?: ReactNode;
    unlocked?: boolean;
    progress?: number;
    maxProgress?: number;
    rarity?: "common" | "rare" | "epic" | "legendary";
    className?: string;
}

const rarityColors = {
    common: {
        border: "border-gray-500/30",
        bg: "from-gray-500/10 to-gray-600/10",
        glow: "shadow-gray-500/20",
        text: "text-gray-400",
    },
    rare: {
        border: "border-blue-500/30",
        bg: "from-blue-500/10 to-cyan-500/10",
        glow: "shadow-blue-500/20",
        text: "text-blue-400",
    },
    epic: {
        border: "border-purple-500/30",
        bg: "from-purple-500/10 to-pink-500/10",
        glow: "shadow-purple-500/20",
        text: "text-purple-400",
    },
    legendary: {
        border: "border-yellow-500/30",
        bg: "from-yellow-500/10 to-orange-500/10",
        glow: "shadow-yellow-500/20",
        text: "text-yellow-400",
    },
};

export default function AchievementCard({
    title,
    description,
    icon,
    unlocked = false,
    progress,
    maxProgress,
    rarity = "common",
    className,
}: AchievementCardProps) {
    const colors = rarityColors[rarity];
    const showProgress = progress !== undefined && maxProgress !== undefined;
    const progressPercentage = showProgress
        ? Math.min((progress / maxProgress) * 100, 100)
        : 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02, y: -4 }}
            className={cn(
                "relative p-4 rounded-xl border backdrop-blur-sm transition-all",
                unlocked
                    ? `bg-gradient-to-br ${colors.bg} ${colors.border} ${colors.glow} shadow-lg`
                    : "bg-zinc-900/50 border-white/10",
                className
            )}
        >
            {/* Unlock animation */}
            {unlocked && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.2, 1] }}
                    transition={{ duration: 0.5 }}
                    className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1.5 shadow-lg shadow-green-500/50"
                >
                    <FaCheck className="text-white text-xs" />
                </motion.div>
            )}

            {/* Rarity stars */}
            {unlocked && rarity !== "common" && (
                <div className="absolute top-2 right-2 flex gap-0.5">
                    {Array.from({
                        length: rarity === "rare" ? 2 : rarity === "epic" ? 3 : 4,
                    }).map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.1 + 0.3 }}
                        >
                            <FaStar className={cn("text-xs", colors.text)} />
                        </motion.div>
                    ))}
                </div>
            )}

            <div className="flex items-start gap-3">
                {/* Icon */}
                <div
                    className={cn(
                        "p-3 rounded-lg transition-all",
                        unlocked
                            ? `bg-gradient-to-br ${colors.bg} ${colors.border} border`
                            : "bg-zinc-800/50 border border-white/5"
                    )}
                >
                    {unlocked ? (
                        icon || <FaStar className={cn("text-xl", colors.text)} />
                    ) : (
                        <FaLock className="text-xl text-gray-600" />
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <h3
                        className={cn(
                            "font-semibold text-sm mb-1",
                            unlocked ? "text-white" : "text-gray-500"
                        )}
                    >
                        {title}
                    </h3>
                    <p
                        className={cn(
                            "text-xs line-clamp-2",
                            unlocked ? "text-muted-foreground" : "text-gray-600"
                        )}
                    >
                        {description}
                    </p>

                    {/* Progress bar */}
                    {showProgress && !unlocked && (
                        <div className="mt-2 space-y-1">
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Progreso</span>
                                <span>
                                    {progress}/{maxProgress}
                                </span>
                            </div>
                            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progressPercentage}%` }}
                                    className={cn(
                                        "h-full rounded-full bg-gradient-to-r",
                                        colors.bg.replace("/10", "/50")
                                    )}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
