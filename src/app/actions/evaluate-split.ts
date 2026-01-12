"use server";

import { Groq } from 'groq-sdk';
import { UserContext } from '@/types';

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

export async function evaluateSplitAction(
    customSplit: { day: number, muscles: string[] }[],
    userContext: UserContext
): Promise<{ score: number, explanation: string }> {
    if (!process.env.GROQ_API_KEY) {
        throw new Error("GROQ_API_KEY is not defined");
    }

    const systemPrompt = `Eres un experto en biomecánica y programación de entrenamiento.
  Tu tarea es evaluar la calidad de una distribución de entrenamiento (Split) propuesta por el usuario.
  
  CONTEXTO DEL USUARIO:
  - Nivel: ${userContext.level || 'Intermedio'}
  - Días disponibles: ${customSplit.length}

  DISTRIBUCIÓN PROPUESTA:
  ${customSplit.map(d => `Día ${d.day}: ${d.muscles.join(', ')}`).join('\n')}

  Evalúa esta distribución basándote en:
  1. Frecuencia de entrenamiento por grupo muscular (¿suficiente recuperación?).
  2. Sinergia muscular (ej: Pecho y Tríceps es bueno, Pecho y Espalda puede ser agotador pero viable, Piernas todos los días es malo).
  3. Equilibrio estructural.

  Devuelve un JSON estricto con:
  - score: Un número del 0 al 100 indicando qué tan recomendable es.
  - explanation: Una breve explicación de por qué es buena o mala idea (max 2 frases).

  FORMATO RESPUESTA:
  {
    "score": 85,
    "explanation": "Buena distribución push-pull, permite recuperación adecuada."
  }`;

    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: "Evalúa mi split." }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.3,
            max_completion_tokens: 500,
            response_format: { type: "json_object" }
        });

        const content = chatCompletion.choices[0]?.message?.content || "{}";
        return JSON.parse(content);
    } catch (error) {
        console.error("Error evaluating split:", error);
        return { score: 0, explanation: "No se pudo evaluar la distribución." };
    }
}
