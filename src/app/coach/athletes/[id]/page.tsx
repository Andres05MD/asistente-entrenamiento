"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { UserProfile, RoutineAssignment } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Dumbbell, LineChart, MessageSquare } from "lucide-react";

import AssignRoutineDialog from "@/components/coach/AssignRoutineDialog";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default function AthleteDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { id } = params;

    const [athlete, setAthlete] = useState<UserProfile | null>(null);
    const [assignments, setAssignments] = useState<RoutineAssignment[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchAthleteData = async () => {
        if (!id || typeof id !== 'string') return;

        try {
            // Fetch Profile
            const docRef = doc(db, "users", id);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                setAthlete({ uid: id, ...docSnap.data() } as UserProfile);
            } else {
                console.error("No such athlete!");
                router.push("/coach/athletes");
            }

            // Fetch Assignments
            const q = query(
                collection(db, "assignments"),
                where("athleteId", "==", id),
                // orderBy("dateAssigned", "desc") // Requires index
            );
            const assignmentsSnap = await getDocs(q);
            const assignmentsData = assignmentsSnap.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as RoutineAssignment));

            // Client side sort since index might not exist yet
            assignmentsData.sort((a, b) => new Date(b.dateAssigned).getTime() - new Date(a.dateAssigned).getTime());

            setAssignments(assignmentsData);

        } catch (error) {
            console.error("Error fetching athlete details:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAthleteData();
    }, [id, router]);

    if (loading) return <div className="p-8">Cargando perfil...</div>;
    if (!athlete) return <div className="p-8">Atleta no encontrado.</div>;

    return (
        <div className="space-y-6">
            <Button variant="ghost" onClick={() => router.back()} className="pl-0 hover:bg-transparent hover:text-primary">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a Lista
            </Button>

            <div className="flex flex-col md:flex-row gap-6">
                {/* Profile Sidebar */}
                <Card className="md:w-1/3 h-fit">
                    <CardHeader className="flex flex-col items-center">
                        <Avatar className="h-24 w-24 mb-4">
                            <AvatarImage src={athlete.photoURL || ""} />
                            <AvatarFallback className="text-xl">{athlete.displayName?.slice(0, 2).toUpperCase() || "AT"}</AvatarFallback>
                        </Avatar>
                        <CardTitle className="text-xl text-center">{athlete.displayName}</CardTitle>
                        <CardDescription className="text-center">{athlete.email}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                                <span className="font-semibold block">Nivel:</span>
                                {athlete.level || "N/A"}
                            </div>
                            <div>
                                <span className="font-semibold block">Objetivo:</span>
                                {athlete.goal || "N/A"}
                            </div>
                            <div>
                                <span className="font-semibold block">Equipo:</span>
                                {athlete.equipment || "N/A"}
                            </div>
                            <div>
                                <span className="font-semibold block">Edad:</span>
                                {athlete.age || "N/A"}
                            </div>
                        </div>
                        <div className="pt-4 flex flex-col gap-2">
                            <Button className="w-full">
                                <MessageSquare className="mr-2 h-4 w-4" />
                                Enviar Mensaje
                            </Button>

                            {/* Assign Routine Dialog */}
                            <AssignRoutineDialog
                                athleteId={athlete.uid}
                                coachId={athlete.coachId || ""} // Should be current user uid, but usually matches
                                trigger={
                                    <Button variant="outline" className="w-full">
                                        <Dumbbell className="mr-2 h-4 w-4" />
                                        Asignar Rutina
                                    </Button>
                                }
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Main Content Area */}
                <div className="flex-1">
                    <Tabs defaultValue="overview" className="w-full">
                        <TabsList>
                            <TabsTrigger value="overview">Resumen</TabsTrigger>
                            <TabsTrigger value="assignments">Rutinas Asignadas</TabsTrigger>
                            <TabsTrigger value="stats">Estadísticas</TabsTrigger>
                            <TabsTrigger value="history">Historial</TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview" className="mt-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium">Cumplimiento Semanal</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">0%</div>
                                        <p className="text-xs text-muted-foreground">0/0 sesiones completadas</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium">Último Peso</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">-- kg</div>
                                        <p className="text-xs text-muted-foreground">Sin registros recientes</p>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        <TabsContent value="assignments" className="mt-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Historial de Asignaciones</CardTitle>
                                    <CardDescription>Entrenamientos programados reciente.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {assignments.length > 0 ? (
                                        <div className="space-y-4">
                                            {assignments.map(a => (
                                                <div key={a.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                                    <div>
                                                        <p className="font-medium">{a.customizedRoutine?.name || "Rutina sin nombre"}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {format(new Date(a.dateAssigned), "PPP", { locale: es })}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className={cn(
                                                            "text-xs px-2 py-1 rounded-full capitalize",
                                                            a.status === 'completed' ? "bg-green-100 text-green-700" :
                                                                a.status === 'pending' ? "bg-yellow-100 text-yellow-700" :
                                                                    "bg-red-100 text-red-700"
                                                        )}>
                                                            {a.status === 'pending' ? 'Pendiente' : a.status}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-muted-foreground">
                                            No hay rutinas asignadas actualmente.
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="stats" className="mt-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Progreso</CardTitle>
                                </CardHeader>
                                <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
                                    <LineChart className="h-16 w-16 mb-4 opacity-20" />
                                    <span className="sr-only">Gráfica de progreso (Placeholder)</span>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}
