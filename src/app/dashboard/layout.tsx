"use client";

import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";
import AIChat from "@/components/layout/AIChat";
import { Toaster } from "react-hot-toast";
import AnimatedBackground from "@/components/ui/animated-background";
import { TooltipProvider } from "@/components/ui/tooltip";
import RoleGuard from "@/components/auth/RoleGuard";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Usamos RoleGuard para proteger la ruta. 
    // Nota: Mantenemos el AuthProvider envolviendo todo en providers.tsx, aquí solo restringimos acceso.

    return (
        <RoleGuard allowedRoles={['athlete']}>
            <TooltipProvider>
                <div className="flex h-full min-h-screen bg-background relative">
                    <AnimatedBackground />
                    <Sidebar />
                    <MobileNav />
                    <AIChat />
                    <main className="flex-1 overflow-y-auto w-full p-4 md:p-8 pt-4 md:pt-8 pb-24 md:pb-8 scroll-smooth relative z-10">
                        <div className="max-w-7xl mx-auto space-y-8">
                            {children}
                        </div>
                    </main>
                    <Toaster
                        position="bottom-right"
                        toastOptions={{
                            style: {
                                background: '#333',
                                color: '#fff',
                                border: '1px solid rgba(255,255,255,0.1)',
                            },
                        }}
                    />
                </div>
            </TooltipProvider>
        </RoleGuard>
    );
}
