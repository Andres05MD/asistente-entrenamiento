"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
    FaHome,
    FaDumbbell,
    FaRunning,
    FaChartLine,
    FaUser,
    FaSignOutAlt
} from "react-icons/fa";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { signOut } from "firebase/auth";
import { useGamification } from "@/hooks/useGamification";
import { useAuth } from "@/context/AuthContext";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const sidebarItems = [
    { href: "/dashboard", icon: FaHome, label: "Dashboard" },
    { href: "/dashboard/rutinas", icon: FaDumbbell, label: "Rutinas" },
    { href: "/dashboard/ejercicios", icon: FaRunning, label: "Ejercicios" },
    { href: "/dashboard/avances", icon: FaChartLine, label: "Avances" },
    { href: "/dashboard/perfil", icon: FaUser, label: "Perfil" },
];

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { user, profile } = useAuth();
    const { currentLevel, progress } = useGamification();

    const handleLogout = async () => {
        try {
            await signOut(auth);
            toast.success("Sesión cerrada");
            router.push("/login");
        } catch (error) {
            console.error(error);
            toast.error("Error al cerrar sesión");
        }
    };

    return (
        <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 border-r border-white/10 bg-black/40 backdrop-blur-xl supports-[backdrop-filter]:bg-black/20 overflow-hidden">
            <Link href="/dashboard" className="p-6 flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer flex-shrink-0">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
                    <FaDumbbell className="text-white text-lg" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                    Entrenador IA
                </span>
            </Link>

            <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
                {sidebarItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link key={item.href} href={item.href} className="block relative group">
                            {isActive && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute inset-0 bg-primary/10 rounded-xl"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                />
                            )}
                            <div
                                className={cn(
                                    "relative flex items-center gap-3 px-4 py-3 rounded-xl transition-colors duration-200",
                                    isActive ? "text-primary font-medium" : "text-muted-foreground hover:text-white hover:bg-white/5"
                                )}
                            >
                                <item.icon className={cn("text-lg", isActive ? "text-primary" : "opacity-70 group-hover:opacity-100")} />
                                <span>{item.label}</span>
                            </div>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-white/10 flex-shrink-0 space-y-4">
                {/* Profile Card & Gamification */}
                <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white shadow-lg uppercase">
                            {profile?.displayName?.[0] || user?.email?.[0] || "U"}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{profile?.displayName || "Usuario"}</p>
                            <p className="text-xs text-muted-foreground">Nivel {currentLevel}</p>
                        </div>
                        <div className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded">
                            Lvl {currentLevel}
                        </div>
                    </div>

                    {/* XP Bar */}
                    <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-muted-foreground">
                            <span>XP</span>
                            <span>{Math.floor(progress)}%</span>
                        </div>
                        <div className="h-1.5 bg-black/50 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                            />
                        </div>
                    </div>
                </div>

                <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
                    onClick={handleLogout}
                >
                    <FaSignOutAlt />
                    Cerrar Sesión
                </Button>
            </div>
        </aside>
    );
}
