"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { FaHome, FaDumbbell, FaChartLine, FaUser, FaRunning } from "react-icons/fa";
import { cn } from "@/lib/utils";

const navItems = [
    { href: "/dashboard", icon: FaHome, label: "Inicio" },
    { href: "/dashboard/rutinas", icon: FaDumbbell, label: "Rutinas" },
    { href: "/dashboard/ejercicios", icon: FaRunning, label: "Ejercicios" },
    { href: "/dashboard/avances", icon: FaChartLine, label: "Progreso" },
    { href: "/dashboard/perfil", icon: FaUser, label: "Perfil" },
];

export default function MobileNav() {
    const pathname = usePathname();

    const isPathActive = (href: string) => {
        if (href === "/dashboard" && pathname === "/dashboard") return true;
        if (href !== "/dashboard" && pathname.startsWith(href)) return true;
        return false;
    };

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 h-[80px] bg-zinc-950/80 backdrop-blur-2xl border-t border-white/10 flex items-center justify-around px-2 z-50 pb-2 shadow-[0_-5px_30px_rgba(0,0,0,0.5)]">
            {navItems.map((item) => {
                const isActive = isPathActive(item.href);

                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className="relative flex flex-col items-center justify-center w-full h-full"
                    >
                        {isActive && (
                            <motion.div
                                layoutId="mobile-nav-indicator"
                                className="absolute top-0 w-12 h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50  rounded-b-full shadow-[0_2px_10px_rgba(16,185,129,0.5)]"
                                initial={false}
                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            />
                        )}

                        <motion.div
                            className={cn(
                                "flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300",
                            )}
                            animate={{
                                y: isActive ? -4 : 0,
                                scale: isActive ? 1.1 : 1
                            }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        >
                            <item.icon className={cn(
                                "text-2xl transition-colors duration-300",
                                isActive ? "text-primary drop-shadow-[0_0_10px_rgba(16,185,129,0.4)]" : "text-zinc-500"
                            )} />
                            <span className={cn(
                                "text-[10px] font-medium transition-colors duration-200",
                                isActive ? "text-primary" : "text-zinc-500"
                            )}>
                                {item.label}
                            </span>
                        </motion.div>
                    </Link>
                );
            })}
        </div>
    );
}

