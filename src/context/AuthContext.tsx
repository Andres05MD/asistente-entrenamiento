"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot, setDoc } from "firebase/firestore";

import { auth, db } from "@/lib/firebase";
import { UserProfile } from "@/types";

interface AuthContextType {
    user: User | null;
    profile: UserProfile | null;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    loading: true,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (!currentUser) {
                setProfile(null);
                setLoading(false);
            }
        });
        return () => unsubscribeAuth();
    }, []);

    useEffect(() => {
        if (user) {
            setLoading(true);
            const unsubscribeSnapshot = onSnapshot(doc(db, "users", user.uid), async (snapshot) => {
                if (snapshot.exists()) {
                    setProfile({
                        uid: user.uid,
                        email: user.email,
                        displayName: user.displayName,
                        photoURL: user.photoURL,
                        ...snapshot.data()
                    } as UserProfile);
                    setLoading(false);
                } else {
                    // Si el usuario existe en Auth pero no tiene perfil en Firestore (ej: Login Google nuevo)
                    // Crear perfil por defecto.
                    const newProfile: Partial<UserProfile> = {
                        uid: user.uid,
                        email: user.email || "",
                        displayName: user.displayName || "Usuario",
                        photoURL: user.photoURL || undefined,
                        role: "athlete",
                        createdAt: new Date().toISOString()
                    };

                    // Crear documento en Firestore de manera no bloqueante (optimista)
                    setDoc(doc(db, "users", user.uid), newProfile).catch(e => console.error("Error creating profile", e));

                    setProfile({ ...newProfile } as UserProfile);
                    setLoading(false);
                }
            });
            return () => unsubscribeSnapshot();
        }
    }, [user]);

    return (
        <AuthContext.Provider value={{ user, profile, loading }}>
            {children}
        </AuthContext.Provider>
    );
}
