export interface Exercise {
    id?: string;
    name: string;
    muscleGroup?: string;
    videoUrl?: string;
    description?: string;
    userId?: string;
    createdAt?: string;
    // Propiedades opcionales para cuando es parte de una rutina
    sets?: string;
    reps?: string;
    rest?: string;
    notes?: string;
    exerciseId?: string | null;
}

export interface DayRoutine {
    dayName: string;
    muscleGroups: string[];
    exercises: Exercise[];
}

export interface Routine {
    id?: string;
    routineName: string;
    description: string;
    days: DayRoutine[];
    userId: string;
    createdAt: string;
}

export type FitnessLevel = 'Principiante' | 'Intermedio' | 'Avanzado';
export type FitnessGoal = 'Hipertrofia' | 'Fuerza' | 'Perdida de Peso' | 'Resistencia';
export type EquipmentType = 'Gimnasio Comercial' | 'Gimnasio en Casa' | 'Mancuernas' | 'Peso Corporal';
export type GenderType = 'Hombre' | 'Mujer' | 'Otro';

export interface UserContext {
    level: FitnessLevel;
    goal: FitnessGoal;
    days: number;
    equipment?: EquipmentType;
    gender?: GenderType;
    age?: number;
    injuries?: string; // Added for future use
    // Advanced Generator Options
    splitType?: string;
    sessionDuration?: number;
    intensity?: string;
    repRange?: string;
    specificFocus?: string;
}

export interface UserProfile {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    // Fitness Context
    level?: FitnessLevel;
    goal?: FitnessGoal;
    days?: number;
    equipment?: EquipmentType;
    gender?: GenderType;
    age?: number;
    createdAt?: string;
    settings?: {
        theme: 'light' | 'dark';
        notifications: boolean;
    };
}

export interface WorkoutLog {
    id?: string;
    userId: string;
    date: string;
    duration: number; // minutes
    totalVolume: number; // kg
    routineName?: string;
    exercisesCompleted: number;
    detailedLogs?: ExerciseLog[];
}

export interface ExerciseSetLog {
    setNumber: number;
    weight: number;
    reps: number;
    completed: boolean;
}

export interface ExerciseLog {
    exerciseName: string;
    exerciseId?: string; // Links back to the exercise library
    sets: ExerciseSetLog[];
}

export interface WeightLog {
    id?: string;
    userId: string;
    date: string;
    weight: number;
}

export interface MeasurementLog {
    id?: string;
    userId: string;
    date: string;
    chest?: number;
    waist?: number;
    hips?: number;
    armLeft?: number;
    armRight?: number;
    thighLeft?: number;
    thighRight?: number;
    calfLeft?: number;
    calfRight?: number;
    shoulders?: number;
    neck?: number;
}
