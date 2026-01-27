"use client";

import { useState } from "react";
import { useAssignments } from "@/hooks/useData";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { es } from "date-fns/locale";
import { isSameDay, format, parseISO } from "date-fns";
import { CalendarDays, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function PlanPage() {
    const router = useRouter();
    const { assignments, isLoading } = useAssignments();
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

    const assignmentsOnSelectedDate = assignments?.filter(a =>
        selectedDate && isSameDay(parseISO(a.dateAssigned), selectedDate)
    ) || [];

    // Get days with assignments for indicators
    const daysWithAssignments = assignments?.map(a => parseISO(a.dateAssigned)) || [];

    return (
        <div className="space-y-6 animate-in fade-in-50 duration-500">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                    <CalendarDays className="text-primary" /> Mi Plan
                </h1>
                <p className="text-muted-foreground">Tu calendario de entrenamientos.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Calendar Section */}
                <Card className="lg:col-span-8 border-white/5 bg-zinc-900/50 backdrop-blur-xl">
                    <CardContent className="p-4 md:p-6 flex justify-center">
                        <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={setSelectedDate}
                            className="rounded-md border-white/5 p-4"
                            locale={es}
                            modifiers={{
                                booked: daysWithAssignments
                            }}
                            modifiersStyles={{
                                booked: {
                                    fontWeight: 'bold',
                                    textDecoration: 'underline',
                                    color: 'var(--primary)',
                                    backgroundColor: 'rgba(var(--primary), 0.1)'
                                }
                            }}
                        />
                    </CardContent>
                </Card>

                {/* Details Section */}
                <Card className="lg:col-span-4 border-white/5 bg-zinc-900/90 h-full">
                    <CardHeader>
                        <CardTitle>
                            {selectedDate ? format(selectedDate, "EEEE d 'o' MMMM", { locale: es }) : "Selecciona un día"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <AnimatePresence mode="wait">
                            {assignmentsOnSelectedDate.length > 0 ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="space-y-4"
                                >
                                    {assignmentsOnSelectedDate.map(assignment => (
                                        <div
                                            key={assignment.id}
                                            className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-primary/50 transition-colors group cursor-pointer"
                                            onClick={() => router.push(`/dashboard/workout/${assignment.id}`)}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-bold text-lg group-hover:text-primary transition-colors">
                                                    {assignment.customizedRoutine?.name}
                                                </h3>
                                                <Badge variant={assignment.status === 'completed' ? "success" : "default"}>
                                                    {assignment.status === 'completed' ? "Completado" : "Pendiente"}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                                {assignment.customizedRoutine?.description || "Sin descripción."}
                                            </p>
                                            <Button size="sm" className="w-full bg-white/10 hover:bg-white/20 text-white">
                                                {assignment.status === 'completed' ? "Ver Detalles" : "Ir a Entrenar"}
                                                <ChevronRight className="ml-2 w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </motion.div>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex flex-col items-center justify-center py-12 text-muted-foreground text-center"
                                >
                                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                                        <CalendarDays className="w-8 h-8 opacity-50" />
                                    </div>
                                    <p>No hay entrenamientos asignados para este día.</p>
                                    <Button variant="link" onClick={() => router.push("/dashboard/rutinas")}>
                                        Explorar tus rutinas
                                    </Button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
