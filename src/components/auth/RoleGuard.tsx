"use client";

import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/types";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface RoleGuardProps {
    children: React.ReactNode;
    allowedRoles: UserRole[];
}

export default function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
    const { user, profile, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push("/login");
            } else if (!profile?.role) {
                // Usuario autenticado pero sin rol (Legacy o Error)
                console.warn("Acceso denegado: Usuario sin rol intentando acceder a ruta protegida.");
                // Aquí podríamos redirigir a una página de selección de rol si existiera
            } else if (allowedRoles.length > 0 && !allowedRoles.includes(profile.role)) {
                // Redirigir al dashboard correspondiente si el rol no coincide con el permitido
                if (profile.role === 'coach') {
                    router.push("/coach/dashboard");
                } else {
                    router.push("/dashboard");
                }
            }
        }
    }, [user, profile, loading, router, allowedRoles]);

    if (loading) {
        return <div className="flex h-screen w-full items-center justify-center">Cargando...</div>;
    }

    // Validación estricta:
    // 1. Debe haber usuario
    // 2. Si se requieren roles, el usuario debe tener rol y estar en la lista
    // 3. Si no se requieren roles (lista vacía), pasa si hay usuario
    const hasPermission = user && (
        allowedRoles.length === 0 ||
        (profile?.role && allowedRoles.includes(profile.role))
    );

    // NOTA: Para usuarios legacy sin rol, hasPermission será false si allowedRoles tiene elementos.
    // Esto significa que los usuarios existentes NO podrán entrar al dashboard hasta que se les asigne un rol.

    if (!hasPermission) {
        return null;
    }

    return <>{children}</>;
}
