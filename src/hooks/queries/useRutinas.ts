import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { collection, query, where, getDocs, addDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useUser } from "@/hooks/useUser";
import toast from "react-hot-toast";
import { Routine } from "@/types";

export function useRutinas() {
    const { user } = useUser();
    const queryClient = useQueryClient();

    const { data: rutinas = [], isLoading } = useQuery({
        queryKey: ['rutinas', user?.uid],
        queryFn: async () => {
            if (!user) return [];
            const q = query(collection(db, "rutinas"), where("userId", "==", user.uid));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Routine));
        },
        enabled: !!user,
    });

    const createRutina = useMutation({
        mutationFn: async (newRutina: Omit<Routine, 'id' | 'userId' | 'createdAt'>) => {
            if (!user) throw new Error("No user");
            const rutinaToSave = {
                ...newRutina,
                userId: user.uid,
                createdAt: new Date().toISOString()
            };

            const docRef = await addDoc(collection(db, "rutinas"), rutinaToSave);
            return { id: docRef.id, ...rutinaToSave };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rutinas'] });
            toast.success("Rutina guardada correctamente");
        },
        onError: () => toast.error("Error al guardar rutina"),
    });

    const deleteRutina = useMutation({
        mutationFn: async (id: string) => {
            await deleteDoc(doc(db, "rutinas", id));
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rutinas'] });
            toast.success("Rutina eliminada");
        },
        onError: () => toast.error("Error al eliminar rutina"),
    });

    return { rutinas, isLoading, createRutina, deleteRutina };
}
