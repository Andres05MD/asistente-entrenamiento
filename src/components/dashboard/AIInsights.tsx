"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaLightbulb, FaChartLine, FaCalendarAlt, FaRobot } from "react-icons/fa";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getAIInsightsAction } from "@/app/actions/get-insights";
import { UserProfile, WorkoutLog, WeightLog } from "@/types";

interface Insight {
    type: string;
    text: string;
    icon: string;
}

interface AIInsightsProps {
    profile: UserProfile;
    workoutLogs: WorkoutLog[];
    weightLogs: WeightLog[];
}

export default function AIInsights({ profile, workoutLogs, weightLogs }: AIInsightsProps) {
    const [insights, setInsights] = useState<Insight[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchInsights() {
            setLoading(true);
            try {
                const data = await getAIInsightsAction(profile, workoutLogs || [], weightLogs || []);
                setInsights(data);
            } catch (error) {
                console.error("Failed to fetch AI insights", error);
            } finally {
                setLoading(false);
            }
        }

        if (profile) {
            fetchInsights();
        }
    }, [profile, workoutLogs, weightLogs]);

    const getIcon = (iconName: string) => {
        switch (iconName) {
            case "trending-up":
            case "performance":
                return <FaChartLine className="text-blue-500" />;
            case "calendar":
            case "consistency":
                return <FaCalendarAlt className="text-emerald-500" />;
            case "lightbulb":
            case "tip":
                return <FaLightbulb className="text-yellow-500" />;
            default:
                return <FaRobot className="text-purple-500" />;
        }
    };

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {[1, 2, 3].map((i) => (
                    <Card key={i} className="bg-zinc-900/50 border-white/5 p-4 rounded-2xl">
                        <div className="flex items-start gap-3">
                            <Skeleton className="h-10 w-10 rounded-xl bg-white/5 shrink-0" />
                            <div className="space-y-2 w-full">
                                <Skeleton className="h-4 w-3/4 bg-white/5" />
                                <Skeleton className="h-3 w-1/2 bg-white/5" />
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <AnimatePresence mode="popLayout">
                {insights.map((insight, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        whileHover={{ scale: 1.02 }}
                    >
                        <Card className="bg-zinc-900/50 backdrop-blur-xl border-white/5 hover:border-white/10 transition-colors p-4 rounded-2xl shadow-lg relative overflow-hidden group">
                            <div className="flex items-start gap-3 relative z-10">
                                <div className="p-3 rounded-xl bg-white/5 group-hover:bg-white/10 transition-colors">
                                    {getIcon(insight.icon || insight.type)}
                                </div>
                                <p className="text-sm text-zinc-300 leading-relaxed group-hover:text-white transition-colors">
                                    {insight.text}
                                </p>
                            </div>
                            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                                <FaRobot className="w-12 h-12" />
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
