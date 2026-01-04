"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addDoc, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useUser } from "./useData";
import toast from "react-hot-toast";
import { WorkoutLog, MeasurementLog } from "@/types";

export function useEntrenamiento() {
    const { user } = useUser();
    const queryClient = useQueryClient();

    // Guardar log de entrenamiento
    const saveWorkoutLog = useMutation({
        mutationFn: async (log: Omit<WorkoutLog, 'id' | 'userId'>) => {
            if (!user) throw new Error("No user logged in");

            const newLog = {
                ...log,
                userId: user.uid,
                date: new Date().toISOString(), // Ensure date is ISO string
            };

            await addDoc(collection(db, "workout_logs"), newLog);
            return newLog;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workoutLogs'] });
            toast.success("¡Entrenamiento guardado!");
        },
        onError: (error) => {
            console.error(error);
            toast.error("Error al guardar el entrenamiento");
        }
    });

    // Guardar peso corporal
    const saveWeightLog = useMutation({
        mutationFn: async (weight: number) => {
            if (!user) throw new Error("No user logged in");

            const newLog = {
                userId: user.uid,
                weight,
                date: new Date().toISOString()
            };

            await addDoc(collection(db, "weight_logs"), newLog);
            return newLog;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['weightLogs'] });
            toast.success("Peso registrado correctamente");
        },
        onError: () => toast.error("Error al registrar peso")
    });

    // Guardar medidas corporales
    const saveMeasurementsLog = useMutation({
        mutationFn: async (measurements: Omit<MeasurementLog, 'id' | 'userId' | 'date'>) => {
            if (!user) throw new Error("No user logged in");

            const newLog = {
                ...measurements,
                userId: user.uid,
                date: new Date().toISOString()
            };

            await addDoc(collection(db, "measurement_logs"), newLog);
            return newLog;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['measurementLogs'] }); // Assuming we have a hook for this eventually, or general invalidation
            toast.success("Medidas registradas correctamente");
        },
        onError: () => toast.error("Error al registrar medidas")
    });

    return { saveWorkoutLog, saveWeightLog, saveMeasurementsLog };
}
