import { useQuery } from "@tanstack/react-query";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useUser } from "@/hooks/useUser";
import { RoutineAssignment } from "@/types";

export function useAssignments() {
    const { user } = useUser();

    const { data: assignments = [], isLoading } = useQuery({
        queryKey: ['assignments', user?.uid],
        queryFn: async () => {
            if (!user) return [];

            // Note: Firebase requires an index for compound queries with orderBy usually.
            // For now, we fetch by athleteId and filter/sort client-side if needed, 
            // or we can add the index.
            const q = query(
                collection(db, "assignments"),
                where("athleteId", "==", user.uid)
            );

            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RoutineAssignment));

            // Sort by date descending (newest first)
            return data.sort((a, b) => new Date(b.dateAssigned).getTime() - new Date(a.dateAssigned).getTime());
        },
        enabled: !!user,
    });

    return { assignments, isLoading };
}
