"use server";

import { Groq } from 'groq-sdk';
import { Exercise, UserContext } from '@/types';

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

export async function swapExerciseAction(
    currentExercise: Exercise,
    reason: string,
    userContext: UserContext,
    availableExercises: { id: string, name: string }[] = []
): Promise<Exercise> {
    if (!process.env.GROQ_API_KEY) {
        throw new Error("GROQ_API_KEY is not defined");
    }

    const exercisesList = availableExercises.length > 0
        ? availableExercises.map(e => `- ${e.name} (ID: ${e.id})`).join('\n')
        : "No hay ejercicios personalizados disponibles.";

    const systemPrompt = `Eres un entrenador personal experto.
  Tu tarea es SUSTITUIR un ejercicio específico de una rutina por otro más adecuado, basándote en la razón del usuario.
  
  CONTEXTO DEL USUARIO:
  - Nivel: ${userContext.level || 'Intermedio'}
  - Equipo: ${userContext.equipment || 'Gimnasio Comercial'}
  - Género: ${userContext.gender || 'No especificado'}

  BIBLIOTECA DEL USUARIO (Prioridad si encaja):
  ${exercisesList}

  EJERCICIO A REEMPLAZAR: ${currentExercise.name} (${currentExercise.muscleGroup || 'General'})
  RAZÓN DEL CAMBIO: "${reason}"

  Genera UN SOLO ejercicio de reemplazo que cumpla la misma función biomecánica o se ajuste mejor a la limitación/preferencia indicada.
  Si el ejercicio está en la biblioteca, usa su ID exacto.
  IMPORTANTE: Especifica el tipo de agarre en el campo 'grip'.

  FORMATO DE RESPUESTA (JSON estricto):
  {
    "name": "Nombre del nuevo ejercicio",
    "exerciseId": "ID_SI_EXISTE_EN_BIBLIOTECA_O_NULL",
    "grip": "Tipo de agarre (Ej: Supino)",
    "sets": "Series recomendadas (ej: 3-4)",
    "reps": "Rango repeticiones (ej: 10-15)",
    "rest": "Descanso (seg)",
    "notes": "Por qué es un buen reemplazo y consejo técnico."
  }`;

    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: "Dame el reemplazo." }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.5,
            max_completion_tokens: 1000,
            response_format: { type: "json_object" }
        });

        const content = chatCompletion.choices[0]?.message?.content || "{}";
        return JSON.parse(content) as Exercise;
    } catch (error) {
        console.error("Error swapping exercise:", error);
        throw new Error("No se pudo reemplazar el ejercicio.");
    }
}
