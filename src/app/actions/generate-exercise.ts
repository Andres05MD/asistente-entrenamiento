"use server";

import { Groq } from 'groq-sdk';
import { Exercise, UserContext } from '@/types';

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

export async function generateExerciseAction(
    userPrompt: string,
    userContext: UserContext
): Promise<Exercise> {
    if (!process.env.GROQ_API_KEY) {
        throw new Error("GROQ_API_KEY is not defined");
    }

    const systemPrompt = `Eres un experto en biomecánica y entrenamiento físico.
  Tu tarea es diseñar UN ejercicio detallado y técnicamente correcto basado en la solicitud del usuario.
  
  CONTEXTO DEL USUARIO:
  - Nivel: ${userContext.level || 'Intermedio'}
  - Equipo: ${userContext.equipment || 'Gimnasio Comercial'}
  - Género: ${userContext.gender || 'No especificado'}

  Genera un ejercicio que sea seguro, efectivo y adecuado para el contexto.
  IMPORTANTE: Define el tipo de agarre óptimo (supino, prono, neutro...) y cómo maximiza la activación.
  
  FORMATO DE RESPUESTA (JSON estricto):
  Devuelve SOLO un objeto JSON con la siguiente estructura:
  {
    "name": "Nombre técnico del ejercicio (Ej: Press de Banca Plano con Barra)",
    "muscleGroup": "Grupo muscular principal (Ej: Pecho)",
    "grip": "Tipo de agarre y efecto biomecánico (Ej: 'Prono ancho - énfasis pectoral')",
    "description": "Explicación detallada de la técnica correcta, paso a paso, enfocada en la ejecución segura y máxima estimulación.",
    "videoUrl": ""  // Dejar vacío, el usuario lo puede rellenar luego
  }`;

    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.6,
            max_completion_tokens: 1500,
            response_format: { type: "json_object" }
        });

        const content = chatCompletion.choices[0]?.message?.content || "{}";
        return JSON.parse(content) as Exercise;
    } catch (error) {
        console.error("Error generating exercise server action:", error);
        throw new Error("No se pudo generar el ejercicio.");
    }
}
