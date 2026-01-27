"use server";

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY!;
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST!;

interface ExerciseMedia {
    id: string;
    name: string;
    gifUrl?: string;
    videoUrl?: string; // Algunas versiones de esta API tienen videos
    target?: string;
}

// Mapa simple para caché en memoria del servidor (opcional, dura lo que viva la instancia lambda/server)
const serverCache: Record<string, ExerciseMedia[]> = {};

export async function getExercisesMediaAction(exerciseNames: string[]): Promise<Record<string, ExerciseMedia | null>> {
    if (!exerciseNames || exerciseNames.length === 0) return {};

    const results: Record<string, ExerciseMedia | null> = {};
    const exercisesToFetch: string[] = [];

    // 1. Verificar si ya tenemos algún resultado simulado o en caché básico (opcional)
    // Por ahora, procesamos todo.

    // 2. Ejecutar peticiones en paralelo (limitando concurrencia si fuera necesario, para 5-10 ejs está bien)
    // Nota: La API de ExerciseDB busca por nombre exacto o parcial (/exercises/name/{name})

    // IMPORTANTE: Los nombres en la app pueden estar en español. La API espera inglés.
    // Esta es una limitación conocida. Por ahora intentaremos buscar el término.
    // Si quisieramos ser muy pro, usaríamos la IA para traducir antes de buscar.

    const promises = exerciseNames.map(async (name) => {
        try {
            // Intentamos buscar por el nombre. Limpiamos espacios extras.
            const cleanName = name.trim().toLowerCase();

            // Si tuviéramos un diccionario de traducción simple, lo usaríamos aquí.
            const searchTerm = cleanName;

            // Construir URL. Usamos 'search' si la API lo permite, o 'name'. 
            // La API standard de ExerciseDB es /exercises/name/{name}
            const url = `https://${RAPIDAPI_HOST}/api/v1/exercises/name/${encodeURIComponent(searchTerm)}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'x-rapidapi-key': RAPIDAPI_KEY,
                    'x-rapidapi-host': RAPIDAPI_HOST
                },
                next: { revalidate: 3600 } // Cachear en Next.js por 1 hora
            });

            if (!response.ok) {
                // Si falla (ej. 404), retornamos null para este ejercicio
                return { originalName: name, data: null };
            }

            const data = await response.json();

            // La API suele devolver un array. Tomamos el primer match si existe.
            if (Array.isArray(data) && data.length > 0) {
                return { originalName: name, data: data[0] }; // Tomamos el mejor match
            }

            return { originalName: name, data: null };

        } catch (error) {
            console.error(`Error fetching media for ${name}:`, error);
            return { originalName: name, data: null };
        }
    });

    const responses = await Promise.all(promises);

    responses.forEach(r => {
        if (r.data) {
            results[r.originalName] = {
                id: r.data.id,
                name: r.data.name,
                gifUrl: r.data.gifUrl,
                videoUrl: r.data.videoUrl || r.data.video, // Ajustar según respuesta real
                target: r.data.target
            };
        } else {
            results[r.originalName] = null;
        }
    });

    return results;
}
