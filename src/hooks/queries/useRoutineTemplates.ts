import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useUser } from "@/hooks/useUser";
import toast from "react-hot-toast";
import { RoutineTemplate } from "@/types";

export function useRoutineTemplates() {
    const { user } = useUser();
    const queryClient = useQueryClient();

    const { data: templates = [], isLoading } = useQuery({
        queryKey: ['routine_templates', user?.uid],
        queryFn: async () => {
            if (!user) return [];
            // Buscar templates creados por el coach
            const q = query(
                collection(db, "routine_templates"),
                where("authorId", "==", user.uid)
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RoutineTemplate));
        },
        enabled: !!user,
    });

    const createTemplate = useMutation({
        mutationFn: async (newTemplate: Omit<RoutineTemplate, 'id' | 'authorId' | 'createdAt' | 'updatedAt'>) => {
            if (!user) throw new Error("No user");

            const templateToSave = {
                ...newTemplate,
                authorId: user.uid,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            const docRef = await addDoc(collection(db, "routine_templates"), templateToSave);
            return { id: docRef.id, ...templateToSave };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['routine_templates'] });
            toast.success("Plantilla creada exitosamente");
        },
        onError: (error) => {
            console.error(error);
            toast.error("Error al crear la plantilla");
        },
    });

    const updateTemplate = useMutation({
        mutationFn: async ({ id, data }: { id: string, data: Partial<RoutineTemplate> }) => {
            const docRef = doc(db, "routine_templates", id);
            await updateDoc(docRef, { ...data, updatedAt: new Date().toISOString() });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['routine_templates'] });
            toast.success("Plantilla actualizada");
        },
        onError: () => toast.error("Error al actualizar"),
    });

    const deleteTemplate = useMutation({
        mutationFn: async (id: string) => {
            await deleteDoc(doc(db, "routine_templates", id));
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['routine_templates'] });
            toast.success("Plantilla eliminada");
        },
        onError: () => toast.error("Error al eliminar"),
    });

    return { templates, isLoading, createTemplate, updateTemplate, deleteTemplate };
}
