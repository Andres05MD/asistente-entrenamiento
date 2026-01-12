"use client";

import * as React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { Slot } from "@radix-ui/react-slot";

interface PremiumButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
    children: React.ReactNode;
    variant?: "default" | "glass" | "neon" | "gradient" | "outline" | "ghost";
    size?: "default" | "sm" | "lg" | "icon";
    asChild?: boolean;
    glow?: boolean;
}

const PremiumButton = React.forwardRef<HTMLButtonElement, PremiumButtonProps>(
    ({ className, variant = "default", size = "default", asChild = false, glow = false, children, ...props }, ref) => {
        const Component = asChild ? Slot : motion.button;

        // Base styles
        const baseStyles = "inline-flex items-center justify-center rounded-xl font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden";

        // Variants
        const variants = {
            default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
            glass: "bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 hover:border-white/30 shadow-lg",
            neon: "bg-black border border-green-500/50 text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.3)] hover:shadow-[0_0_20px_rgba(34,197,94,0.6)] hover:bg-green-500/10",
            gradient: "bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-lg hover:shadow-blue-500/25 border border-white/10",
            outline: "border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground",
            ghost: "hover:bg-accent hover:text-accent-foreground",
        };

        // Sizes
        const sizes = {
            default: "h-9 px-4 py-2",
            sm: "h-8 rounded-md px-3 text-xs",
            lg: "h-10 rounded-md px-8",
            icon: "h-9 w-9",
        };

        // Framer Motion props only if NOT asChild (Slot handles its own ref/props mostly, but motion props work best on real elements)
        // If asChild is true, we assume the child will handle styling mostly, but here we enforce our classes.
        // NOTE: mixing motion with Slot can be tricky. For this specialized button, we default to motion.button usually.

        return (
            <motion.button
                ref={ref}
                className={cn(baseStyles, variants[variant], sizes[size], className)}
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                {...props}
            >
                {/* Glow Effect Layer */}
                {glow && (
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
                        initial={{ x: "-100%" }}
                        animate={{ x: "200%" }}
                        transition={{
                            repeat: Infinity,
                            repeatType: "loop",
                            duration: 2,
                            ease: "linear",
                            repeatDelay: 3
                        }}
                    />
                )}
                <span className="relative z-10 flex items-center gap-2">{children}</span>
            </motion.button>
        );
    }
);

PremiumButton.displayName = "PremiumButton";

export { PremiumButton };
