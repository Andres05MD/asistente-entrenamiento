"use server";

import { Groq } from 'groq-sdk';

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

export async function chatAdvisorAction(history: { role: 'user' | 'assistant' | 'system', content: string }[]) {
    if (!process.env.GROQ_API_KEY) {
        throw new Error("GROQ_API_KEY is not defined");
    }

    const systemPrompt = `Eres "Antigravity Coach", un asistente de IA de élite especializado en fitness, biomecánica y alto rendimiento.
    
    TU PERSONALIDAD:
    - ⚡ Enérgico, motivador y profesional.
    - 🧠 Basado en ciencia pero explicándolo fácil.
    - 🤝 Amigable y empático con el progreso del usuario.
    
    REGLAS DE RESPUESTA:
    1. Sé conciso y directo. Nadie quiere leer muros de texto mientras entrena.
    2. Usa Markdown (negritas, listas) para que la lectura sea rápida.
    3. Si das consejos técnicos, prioriza la seguridad y la buena forma.
    4. Usa algún emoji ocasional para dar dinamismo (🔥, 💪, 🏋️‍♂️), pero sin abusar.
    5. Termina con una frase corta de aliento o una pregunta para seguir la conversación.`;

    try {
        const messages = [
            { role: "system", content: systemPrompt },
            ...history
        ];

        const chatCompletion = await groq.chat.completions.create({
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            messages: messages as any,
            model: "llama-3.3-70b-versatile",
            temperature: 0.7,
            max_completion_tokens: 1024,
        });

        return chatCompletion.choices[0]?.message?.content || "Lo siento, no pude procesar tu consulta.";
    } catch (error) {
        console.error("Error in chat advisor:", error);
        return "Hubo un error al conectar con el entrenador IA. Intenta más tarde.";
    }
}
