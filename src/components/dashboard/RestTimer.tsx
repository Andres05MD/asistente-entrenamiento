"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Minus, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RestTimerProps {
    isOpen: boolean;

    onClose: () => void;
    defaultDuration?: number; // seconds
}

export default function RestTimer({ isOpen, onClose, defaultDuration = 90 }: RestTimerProps) {
    const [timeLeft, setTimeLeft] = useState(defaultDuration);
    const [isActive, setIsActive] = useState(false);

    // Reset when opened
    useEffect(() => {
        if (isOpen) {
            setTimeLeft(defaultDuration);
            setIsActive(true);
        } else {
            setIsActive(false);
        }
    }, [isOpen, defaultDuration]);

    // Timer logic
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            // Timer finished
            // Vibration pattern if supported
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
                navigator.vibrate([200, 100, 200]);
            }
            // Optional: Play sound
            setIsActive(false);
            // Don't close automatically so user sees it finished, or concise auto-close?
            // Let's auto-close after 3s or wait for user. Let's wait for user or easy dismiss.
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const adjustTime = (amount: number) => {
        setTimeLeft(prev => Math.max(0, prev + amount));
    };

    const progressValue = Math.min(100, Math.max(0, ((defaultDuration - timeLeft) / defaultDuration) * 100));

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed bottom-[80px] left-4 right-4 z-50 md:left-1/2 md:-translate-x-1/2 md:w-96" // above bottom bar
                >
                    <div className="bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl shadow-black/50 overflow-hidden relative">
                        {/* Progress Bar Background */}
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
                            <motion.div
                                className="h-full bg-blue-500"
                                initial={{ width: 0 }}
                                animate={{ width: `${progressValue}%` }}
                                transition={{ duration: 1, ease: "linear" }}
                            />
                        </div>

                        <div className="flex items-center justify-between relative z-10">
                            <div className="flex items-center gap-4">
                                <div className="text-3xl font-mono font-bold text-white tabular-nums">
                                    {formatTime(timeLeft)}
                                </div>
                                <div className="flex flex-col text-xs text-muted-foreground">
                                    <span>Descanso</span>
                                    <span>Siguiente serie</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 rounded-full border-white/10 hover:bg-white/10"
                                    onClick={() => adjustTime(-10)}
                                >
                                    <Minus className="h-3 w-3" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 rounded-full border-white/10 hover:bg-white/10"
                                    onClick={() => adjustTime(30)}
                                >
                                    <Plus className="h-3 w-3" />
                                </Button>
                                <Button
                                    variant="secondary"
                                    className="h-8 px-3 text-xs font-bold bg-white text-black hover:bg-white/90 rounded-full"
                                    onClick={onClose}
                                >
                                    {timeLeft === 0 ? "¡Vamos!" : "Omitir"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
