"use client";

import RoleGuard from "@/components/auth/RoleGuard";
import CoachSidebar from "@/components/layout/CoachSidebar";
import AnimatedBackground from "@/components/ui/animated-background";
import { Toaster } from "react-hot-toast";

export default function CoachLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <RoleGuard allowedRoles={['coach']}>
            <div className="flex h-screen w-full bg-background relative overflow-hidden">
                <AnimatedBackground />
                <CoachSidebar />
                <main className="flex-1 overflow-y-auto p-4 md:p-8 relative z-10">
                    <div className="max-w-7xl mx-auto h-full">
                        {children}
                    </div>
                </main>
                <Toaster position="bottom-right" />
            </div>
        </RoleGuard>
    );
}

