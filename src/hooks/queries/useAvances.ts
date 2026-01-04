import { useQuery } from "@tanstack/react-query";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useUser } from "@/hooks/useUser";
import { WorkoutLog, WeightLog, MeasurementLog } from "@/types";

export function useAvances() {
    const { user } = useUser();

    // Fetch Workout Logs
    const { data: workoutLogs = [], isLoading: loadingWorkouts } = useQuery({
        queryKey: ['workoutLogs', user?.uid],
        queryFn: async () => {
            if (!user) return [];
            const q = query(
                collection(db, "workout_logs"),
                where("userId", "==", user.uid),
            );
            const snapshot = await getDocs(q);
            // Client-side sorting because Firestore indexes might not be ready
            return snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() } as WorkoutLog))
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        },
        enabled: !!user,
    });

    // Fetch Weight Logs
    const { data: weightLogs = [], isLoading: loadingWeight } = useQuery({
        queryKey: ['weightLogs', user?.uid],
        queryFn: async () => {
            if (!user) return [];
            const q = query(
                collection(db, "weight_logs"),
                where("userId", "==", user.uid),
            );
            const snapshot = await getDocs(q);
            return snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() } as WeightLog))
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        },
        enabled: !!user,
    });

    // Fetch Measurement Logs
    const { data: measurementLogs = [], isLoading: loadingMeasurements } = useQuery({
        queryKey: ['measurementLogs', user?.uid],
        queryFn: async () => {
            if (!user) return [];
            const q = query(
                collection(db, "measurement_logs"),
                where("userId", "==", user.uid),
            );
            const snapshot = await getDocs(q);
            return snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() } as MeasurementLog))
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        },
        enabled: !!user,
    });

    return {
        workoutLogs,
        weightLogs,
        measurementLogs,
        isLoading: loadingWorkouts || loadingWeight || loadingMeasurements
    };
}
