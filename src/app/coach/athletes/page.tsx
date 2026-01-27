"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { UserProfile } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, UserPlus } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function AthletesPage() {
    const { user } = useAuth();
    const [athletes, setAthletes] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const fetchAthletes = async () => {
            if (!user) return;

            try {
                // Consultar usuarios que tienen este coachId
                const q = query(
                    collection(db, "users"),
                    where("coachId", "==", user.uid)
                    // orderBy("displayName") // Requiere índice compuesto si se combina con where, lo omitimos por ahora o lo manejamos en cliente
                );

                const querySnapshot = await getDocs(q);
                const athletesData: UserProfile[] = [];

                querySnapshot.forEach((doc) => {
                    athletesData.push(doc.data() as UserProfile);
                });

                setAthletes(athletesData);
            } catch (error) {
                console.error("Error fetching athletes:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAthletes();
    }, [user]);

    const filteredAthletes = athletes.filter(athlete =>
        athlete.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        athlete.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Mis Atletas</h1>
                    <p className="text-muted-foreground">Gestiona y monitorea el progreso de tus atletas.</p>
                </div>
                <Button>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Invitar Atleta
                </Button>
            </div>

            <div className="flex items-center space-x-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Buscar por nombre o email..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <Card key={i} className="animate-pulse">
                            <CardHeader className="h-24 bg-muted/50" />
                            <CardContent className="h-32" />
                        </Card>
                    ))}
                </div>
            ) : filteredAthletes.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredAthletes.map((athlete) => (
                        <Link href={`/coach/athletes/${athlete.uid}`} key={athlete.uid}>
                            <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
                                <CardHeader className="flex flex-row items-center gap-4 pb-2">
                                    <Avatar className="h-12 w-12">
                                        <AvatarImage src={athlete.photoURL || ""} alt={athlete.displayName || "Atleta"} />
                                        <AvatarFallback>{athlete.displayName?.slice(0, 2).toUpperCase() || "AT"}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <CardTitle className="text-lg">{athlete.displayName || "Usuario sin nombre"}</CardTitle>
                                        <div className="text-sm text-muted-foreground">{athlete.email}</div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="font-medium text-muted-foreground">Nivel</p>
                                            <p>{athlete.level || "No definido"}</p>
                                        </div>
                                        <div>
                                            <p className="font-medium text-muted-foreground">Objetivo</p>
                                            <p>{athlete.goal || "No definido"}</p>
                                        </div>
                                    </div>
                                    {/* Aquí podríamos mostrar métricas rápidas como "Último entreno: Ayer" */}
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center border rounded-lg bg-muted/10 border-dashed min-h-[300px]">
                    <div className="rounded-full bg-muted/30 p-3 mb-4">
                        <UserPlus className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold">No tienes atletas asignados</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-4">
                        Comienza invitando a atletas para gestionar sus entrenamientos y ver su progreso.
                    </p>
                    <Button variant="outline">Invitar Atleta</Button>
                </div>
            )}
        </div>
    );
}
