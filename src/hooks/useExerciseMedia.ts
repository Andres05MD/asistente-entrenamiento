import { useState, useEffect } from 'react';
import { getExercisesMediaAction } from '@/app/actions/exercise-media';

interface ExerciseMedia {
    id: string;
    name: string;
    gifUrl?: string;
    videoUrl?: string;
    target?: string;
}

const CACHE_KEY = 'antigravity_exercise_media_cache';

export function useExerciseMedia(exerciseNames: string[]) {
    const [mediaMap, setMediaMap] = useState<Record<string, ExerciseMedia | null>>({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!exerciseNames || exerciseNames.length === 0) return;

        const fetchMedia = async () => {
            // 1. Leer caché local
            let cache: Record<string, ExerciseMedia | null> = {};
            try {
                const stored = localStorage.getItem(CACHE_KEY);
                if (stored) {
                    cache = JSON.parse(stored);
                }
            } catch (e) {
                console.error("Error reading exercise cache", e);
            }

            // 2. Identificar faltantes
            const missingNames = exerciseNames.filter(name => cache[name] === undefined);

            // Si ya tenemos todo, seteamos y salimos
            if (missingNames.length === 0) {
                // Filtramos solo los que necesitamos para el estado actual
                const currentMedia: Record<string, ExerciseMedia | null> = {};
                exerciseNames.forEach(name => {
                    currentMedia[name] = cache[name] || null;
                });
                setMediaMap(currentMedia);
                return;
            }

            // 3. Buscar faltantes
            setLoading(true);
            try {
                const newMedia = await getExercisesMediaAction(missingNames);

                // 4. Actualizar caché
                const updatedCache = { ...cache, ...newMedia };
                localStorage.setItem(CACHE_KEY, JSON.stringify(updatedCache));

                // 5. Actualizar estado
                const currentMedia: Record<string, ExerciseMedia | null> = {};
                exerciseNames.forEach(name => {
                    currentMedia[name] = updatedCache[name] || null;
                });
                setMediaMap(currentMedia);

            } catch (error) {
                console.error("Error fetching exercise media", error);
            } finally {
                setLoading(false);
            }
        };

        fetchMedia();
    }, [JSON.stringify(exerciseNames)]); // Re-run si cambia la lista de nombres

    return { mediaMap, loading };
}
