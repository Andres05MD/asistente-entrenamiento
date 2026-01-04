import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useUser } from "@/hooks/useUser";
import toast from "react-hot-toast";
import { Exercise } from "@/types";

export function useEjercicios() {
    const { user } = useUser();
    const queryClient = useQueryClient();

    const { data: ejercicios = [], isLoading } = useQuery({
        queryKey: ['ejercicios', user?.uid],
        queryFn: async () => {
            if (!user) return [];
            const q = query(
                collection(db, "ejercicios"),
                where("userId", "==", user.uid),
                orderBy("name")
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exercise));
        },
        enabled: !!user,
    });

    const createEjercicio = useMutation({
        mutationFn: async (newExercise: Omit<Exercise, 'id' | 'userId' | 'createdAt'>) => {
            if (!user) throw new Error("No user");
            await addDoc(collection(db, "ejercicios"), {
                ...newExercise,
                userId: user.uid,
                createdAt: new Date().toISOString()
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ejercicios'] });
            toast.success("Ejercicio creado");
        },
        onError: () => toast.error("Error al crear ejercicio"),
    });

    const deleteEjercicio = useMutation({
        mutationFn: async (id: string) => {
            await deleteDoc(doc(db, "ejercicios", id));
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ejercicios'] });
            toast.success("Ejercicio eliminado");
        },
        onError: () => toast.error("Error al eliminar ejercicio"),
    });

    return { ejercicios, isLoading, createEjercicio, deleteEjercicio };
}
