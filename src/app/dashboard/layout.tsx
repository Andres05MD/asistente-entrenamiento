"use client";

import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";
import AIChat from "@/components/layout/AIChat";
import { Toaster } from "react-hot-toast";
import AnimatedBackground from "@/components/ui/animated-background";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <TooltipProvider>
            <div className="flex h-full min-h-screen bg-background relative">
                <AnimatedBackground />
                <Sidebar />
                <MobileNav />
                <AIChat />
                <main className="flex-1 overflow-y-auto w-full p-4 md:p-8 pt-20 md:pt-8 scroll-smooth relative z-10">
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
    );
}
