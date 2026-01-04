"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
    value: number;
    max?: number;
    label?: string;
    className?: string;
    showPercentage?: boolean;
    variant?: "default" | "success" | "warning" | "danger";
    animated?: boolean;
    icon?: ReactNode;
}

const variants = {
    default: {
        bg: "bg-primary/20",
        fill: "bg-gradient-to-r from-purple-500 to-blue-500",
        glow: "shadow-lg shadow-primary/30",
    },
    success: {
        bg: "bg-green-500/20",
        fill: "bg-gradient-to-r from-green-400 to-emerald-500",
        glow: "shadow-lg shadow-green-500/30",
    },
    warning: {
        bg: "bg-orange-500/20",
        fill: "bg-gradient-to-r from-orange-400 to-amber-500",
        glow: "shadow-lg shadow-orange-500/30",
    },
    danger: {
        bg: "bg-red-500/20",
        fill: "bg-gradient-to-r from-red-400 to-rose-500",
        glow: "shadow-lg shadow-red-500/30",
    },
};

export default function ProgressBar({
    value,
    max = 100,
    label,
    className,
    showPercentage = true,
    variant = "default",
    animated = true,
    icon,
}: ProgressBarProps) {
    const percentage = Math.min((value / max) * 100, 100);
    const colors = variants[variant];

    return (
        <div className={cn("space-y-2", className)}>
            {(label || showPercentage) && (
                <div className="flex items-center justify-between text-sm">
                    {label && (
                        <span className="font-medium text-white flex items-center gap-2">
                            {icon}
                            {label}
                        </span>
                    )}
                    {showPercentage && (
                        <span className="text-muted-foreground">
                            {Math.round(percentage)}%
                        </span>
                    )}
                </div>
            )}

            <div className={cn("h-3 rounded-full overflow-hidden", colors.bg)}>
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{
                        duration: animated ? 1.5 : 0,
                        ease: "easeOut",
                        delay: animated ? 0.2 : 0,
                    }}
                    className={cn(
                        "h-full relative overflow-hidden",
                        colors.fill,
                        colors.glow
                    )}
                >
                    {animated && (
                        <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                            animate={{
                                x: ["-100%", "200%"],
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "linear",
                            }}
                        />
                    )}
                </motion.div>
            </div>
        </div>
    );
}
