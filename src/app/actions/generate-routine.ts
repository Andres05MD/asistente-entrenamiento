"use server";

import { Groq } from 'groq-sdk';
import { Routine, UserContext } from '@/types';

// Inicializar Groq solo en el servidor protegida
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

export async function generateRoutineAction(
    userPrompt: string,
    userContext: UserContext,
    availableExercises: { id: string, name: string }[] = [],
    workoutHistorySummary: string = ""
): Promise<Routine> {
    if (!process.env.GROQ_API_KEY) {
        throw new Error("GROQ_API_KEY is not defined");
    }

    // Optimizamos la lista para el prompt (nombre e ID)
    const exercisesList = availableExercises.length > 0
        ? availableExercises.map(e => `- ${e.name} (ID: ${e.id})`).join('\n')
        : "No hay ejercicios personalizados disponibles en la biblioteca del usuario.";

    const systemPrompt = `Eres un entrenador personal de élite experto en biomecánica, hipertrofia y fuerza.
  Tu objetivo es crear rutinas de entrenamiento altamente efectivas y personalizadas.
  
  CONTEXTO DEL USUARIO:
  - Nivel: ${userContext.level || 'Intermedio'}
  - Objetivo: ${userContext.goal || 'Hipertrofia'}
  - Días disponibles: ${userContext.days || '4'}
  - Equipo disponible: ${userContext.equipment || 'Gimnasio Comercial Completo'}
  - Género: ${userContext.gender || 'No especificado'}
  - Edad: ${userContext.age ? `${userContext.age} años` : 'No especificada'}${userContext.age ? `\n  IMPORTANTE: Con ${userContext.age} años, ajusta la intensidad, volumen y tiempo de recuperación apropiadamente. ${userContext.age < 20 ? 'Atleta joven con alta capacidad de recuperación.' : userContext.age < 30 ? 'Edad óptima para rendimiento atlético.' : userContext.age < 40 ? 'Prioriza la técnica y recuperación adecuada.' : userContext.age < 50 ? 'Enfócate en movilidad, prevención de lesiones y recuperación.' : userContext.age < 60 ? 'Emphasiza ejercicios de bajo impacto, movilidad y estabilidad.' : 'Programa de bajo impacto con énfasis en funcionalidad y calidad de vida.'}` : ''}

  OPCIONES AVANZADAS (ALTA PRIORIDAD):${userContext.splitType ? `\n  - TIPO DE DIVISIÓN: ${userContext.splitType.toUpperCase()} (OBLIGATORIO usar esta estructura)` : ''}${userContext.sessionDuration ? `\n  - DURACIÓN POR SESIÓN: ${userContext.sessionDuration} minutos (ajusta volumen y ejercicios)` : ''}${userContext.intensity ? `\n  - INTENSIDAD: ${userContext.intensity.toUpperCase()} - RPE ${userContext.intensity === 'light' ? '5-6' : userContext.intensity === 'moderate' ? '7-8' : userContext.intensity === 'high' ? '8-9' : '9-10'}` : ''}${userContext.repRange ? `\n  - RANGO DE REPETICIONES: ${userContext.repRange} (USA ESTE RANGO en todos los ejercicios)` : ''}${userContext.specificFocus ? `\n  - ÉNFASIS: ${userContext.specificFocus.toUpperCase()} (diseña esquemas de series/reps optimizados para esto)` : ''}

  HISTORIAL DE ENTRENAMIENTO (Últimos registros):
  ${workoutHistorySummary || "No hay historial reciente."}
  
  Usa este historial para asegurar sobrecarga progresiva o rotación de ejercicios si es necesario. Si el usuario ya hizo mucho volumen de cierto grupo muscular recientemente, ajusta la recomendación si el prompt lo sugiere (ej: "estoy cansado").

  BIBLIOTECA DE EJERCICIOS DEL USUARIO (IMPORTANTE):
  Estos son los ejercicios que el usuario ya conoce y tiene en su base de datos.
  Intenta PRIORIZAR el uso de estos ejercicios si encajan en el plan, vinculándolos con su ID.
  ${exercisesList}
  
  GUÍAS DE DISEÑO ESPECÍFICAS:
  - VOLUMEN DE LA SESIÓN: Genera OBLIGATORIAMENTE entre 6, 7 u 8 ejercicios por día (ni más, ni menos).${userContext.splitType === 'push-pull-legs' ? `\n  - PPL: Día 1=Push (pecho/hombro/tríceps), Día 2=Pull (espalda/bíceps), Día 3=Legs (cuádriceps/glúteos/isquios)` : ''}${userContext.splitType === 'upper-lower' ? `\n  - UPPER/LOWER: Alterna tren superior completo con tren inferior completo` : ''}${userContext.splitType === 'full-body' ? `\n  - FULL BODY: Cada día entrena todos los grupos musculares principales` : ''}${userContext.splitType === 'bro-split' ? `\n  - BRO SPLIT: Un grupo muscular principal por día (ej: Pecho, Espalda, Piernas, Hombros, Brazos)` : ''}${userContext.specificFocus === 'strength' ? `\n  - FUERZA: Prioriza ejercicios compuestos pesados con 3-6 reps, descansos largos (3-5 min)` : ''}${userContext.specificFocus === 'hypertrophy' ? `\n  - HIPERTROFIA: Enfoque en 8-12 reps, TUT, técnicas avanzadas (drop sets, rest-pause)` : ''}${userContext.specificFocus === 'endurance' ? `\n  - RESISTENCIA: 12-20 reps, descansos cortos (60s), super sets, circuitos` : ''}${userContext.specificFocus === 'power' ? `\n  - POTENCIA: Ejercicios explosivos, 3-5 reps, velocidad máxima, descansos completos` : ''}
  
  FORMATO DE RESPUESTA (JSON estricto):
  Devuelve SOLO un objeto JSON con la siguiente estructura, sin texto adicional ni markdown:
  {
    "routineName": "Nombre épico y descriptivo de la rutina",
    "description": "Breve descripción técnica y motivadora del plan",
    "days": [
      {
        "dayName": "Ej: Día 1 - Empuje (Pecho, Hombro, Tríceps)",
        "muscleGroups": ["Pecho", "Hombros"],
        "exercises": [
           {
              "name": "Nombre exacto del ejercicio",
              "exerciseId": "EL_ID_DE_LA_BIBLIOTECA_SI_COINCIDE_PERFECTAMENTE_SINO_NULL",
              "muscleGroup": "Grupo muscular principal (Ej: Pecho, Espalda, Piernas, Hombros, Bíceps, Tríceps, Abdominales, Cardio)",
              "sets": "Número de series (ej: 4)",
              "reps": "Rango de repeticiones (ej: 8-12)",
              "rest": "Descanso en segundos (ej: 90)",
              "notes": "Tip técnico clave o tempo"
           }
        ]
      }
    ]
  }`;

    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.6,
            max_completion_tokens: 4000,
            response_format: { type: "json_object" }
        });

        const content = chatCompletion.choices[0]?.message?.content || "{}";
        return JSON.parse(content) as Routine;
    } catch (error) {
        console.error("Error generating routine server action:", error);
        throw new Error("No se pudo generar la rutina. Por favor, intenta de nuevo.");
    }
}
