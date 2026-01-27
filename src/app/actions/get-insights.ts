"use server";

import { Groq } from 'groq-sdk';
import { WorkoutLog, UserProfile, WeightLog } from '@/types';

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

export async function getAIInsightsAction(
    profile: UserProfile,
    workoutLogs: WorkoutLog[],
    weightLogs: WeightLog[]
) {
    if (!process.env.GROQ_API_KEY) {
        throw new Error("GROQ_API_KEY is not defined");
    }

    // Prepare context for the AI
    const recentWorkouts = workoutLogs.slice(0, 5).map(log => ({
        date: log.date,
        routine: log.routineName,
        volume: log.totalVolume,
        exercises: log.detailedLogs?.map(e => e.exerciseName).join(", ")
    }));

    const recentWeights = weightLogs.slice(0, 5).map(w => ({
        date: w.date,
        weight: w.weight
    }));

    const systemPrompt = `Eres un Coach de IA analítico y proactivo. 
Tu tarea es analizar los datos recientes de un atleta (entrenamientos y peso) y proporcionar 3 "Insights" o recomendaciones breves y valiosas.

REGLAS:
1. Sé muy breve (máximo 20 palabras por insight).
2. Proporciona exactamente 3 insights en formato JSON.
3. Los insights deben ser variados: uno sobre consistencia, uno sobre rendimiento (volumen/peso) y uno motivacional o técnico.
4. Si faltan datos, sé creativo o anima a registrar más.
5. Usa un tono profesional pero cercano.

FORMATO DE RESPUESTA (JSON):
{
  "insights": [
    { "type": "performance", "text": "...", "icon": "trending-up" },
    { "type": "consistency", "text": "...", "icon": "calendar" },
    { "type": "tip", "text": "...", "icon": "lightbulb" }
  ]
}`;

    const userContext = `
ATLETA: ${profile.displayName}
NIVEL: ${profile.level}
OBJETIVO: ${profile.goal}

ÚLTIMOS ENTRENAMIENTOS:
${JSON.stringify(recentWorkouts, null, 2)}

ÚLTIMOS PESOS:
${JSON.stringify(recentWeights, null, 2)}
`;

    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userContext }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.7,
            response_format: { type: "json_object" }
        });

        const content = chatCompletion.choices[0]?.message?.content || "{}";
        return JSON.parse(content).insights;
    } catch (error) {
        console.error("Error fetching AI insights:", error);
        return [
            { type: "consistency", text: "Mantén el ritmo, ¡vas por buen camino!", icon: "calendar" },
            { type: "performance", text: "Registra más pesos para ver tu progresión.", icon: "trending-up" },
            { type: "tip", "text": "¿Sabías que el descanso es donde ocurre el crecimiento?", icon: "lightbulb" }
        ];
    }
}
