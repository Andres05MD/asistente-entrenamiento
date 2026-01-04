"use client";

import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { HiMenuAlt2 } from "react-icons/hi";
import {
    FaHome,
    FaDumbbell,
    FaRunning,
    FaChartLine,
    FaUser,
    FaSignOutAlt
} from "react-icons/fa";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { signOut } from "firebase/auth";
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

export default function MobileNav() {
    const [open, setOpen] = useState(false);
    const pathname = usePathname();
    const router = useRouter();

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
        <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-black/50 backdrop-blur-lg border-b border-white/10 flex items-center justify-between px-4 z-50">
            <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
                    <FaDumbbell className="text-white text-md" />
                </div>
                <span className="font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                    Entrenador IA
                </span>
            </Link>

            <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-white" suppressHydrationWarning>
                        <HiMenuAlt2 className="text-2xl" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="bg-zinc-950/95 backdrop-blur-xl border-r border-white/10 p-0">
                    <div className="p-6 flex items-center gap-2 border-b border-white/5">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
                            <FaDumbbell className="text-white text-lg" />
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                            Entrenador IA
                        </span>
                        <SheetTitle className="sr-only">Menu de Navegación</SheetTitle>
                    </div>

                    <div className="flex flex-col h-[calc(100vh-80px)] p-4">
                        <nav className="flex-1 space-y-2">
                            {sidebarItems.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setOpen(false)}
                                        className={cn(
                                            "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors duration-200",
                                            isActive
                                                ? "bg-primary/10 text-primary font-medium border border-primary/20"
                                                : "text-muted-foreground hover:text-white hover:bg-white/5"
                                        )}
                                    >
                                        <item.icon className="text-lg" />
                                        <span>{item.label}</span>
                                    </Link>
                                );
                            })}
                        </nav>

                        <div className="mt-auto pt-4 border-t border-white/10">
                            <Button
                                variant="ghost"
                                className="w-full justify-start gap-3 text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
                                onClick={() => {
                                    setOpen(false);
                                    handleLogout();
                                }}
                            >
                                <FaSignOutAlt />
                                Cerrar Sesión
                            </Button>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}
