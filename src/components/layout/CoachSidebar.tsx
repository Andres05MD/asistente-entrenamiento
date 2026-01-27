"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
    FaHome,
    FaUsers,
    FaDumbbell,
    FaRunning,
    FaSignOutAlt,
    FaChartBar
} from "react-icons/fa";
import { cn } from "@/lib/utils";
import { PremiumButton } from "@/components/ui/premium-button";
import { signOut } from "firebase/auth";
import { useAuth } from "@/context/AuthContext";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const coachSidebarItems = [
    { href: "/coach/dashboard", icon: FaChartBar, label: "Panel Coach" },
    { href: "/coach/athletes", icon: FaUsers, label: "Mis Atletas" },
    { href: "/coach/routines", icon: FaDumbbell, label: "Biblioteca de Rutinas" },
    { href: "/coach/exercises", icon: FaRunning, label: "Gestor de Ejercicios" },
];

export default function CoachSidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { user, profile } = useAuth();

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
        <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 border-r border-white/10 bg-black/40 backdrop-blur-xl overflow-hidden">
            <Link href="/coach/dashboard" className="p-6 flex items-center gap-3 hover:opacity-80 transition-opacity flex-shrink-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <FaDumbbell className="text-white text-xl" />
                </div>
                <div>
                    <span className="text-xl font-bold block leading-none">Antigravity</span>
                    <span className="text-[10px] uppercase tracking-widest text-blue-400 font-bold">Coach Hub</span>
                </div>
            </Link>

            <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
                {coachSidebarItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== "/coach/dashboard" && pathname.startsWith(item.href));
                    return (
                        <Link key={item.href} href={item.href} className="block relative group">
                            {isActive && (
                                <motion.div
                                    layoutId="activeTabCoach"
                                    className="absolute inset-0 bg-blue-500/10 rounded-xl border border-blue-500/20"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                />
                            )}
                            <div
                                className={cn(
                                    "relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                                    isActive ? "text-blue-400 font-medium translate-x-1" : "text-muted-foreground hover:text-white hover:bg-white/5"
                                )}
                            >
                                <item.icon className={cn("text-lg", isActive ? "text-blue-400" : "opacity-70 group-hover:opacity-100")} />
                                <span>{item.label}</span>
                            </div>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-white/10 flex-shrink-0 space-y-4 bg-white/5 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white shadow-lg uppercase">
                        {profile?.displayName?.[0] || user?.email?.[0] || "C"}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{profile?.displayName || "Coach"}</p>
                        <p className="text-[10px] text-blue-400 font-bold uppercase">Plan Premium</p>
                    </div>
                </div>

                <PremiumButton
                    variant="ghost"
                    className="w-full justify-start gap-3 text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
                    onClick={handleLogout}
                >
                    <FaSignOutAlt />
                    Cerrar Sesión
                </PremiumButton>
            </div>
        </aside>
    );
}
