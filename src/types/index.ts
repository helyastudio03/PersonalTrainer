// Domaine: musculation

export const MUSCLE_GROUPS = [
  'Pectoraux',
  'Dos',
  'Épaules',
  'Biceps',
  'Triceps',
  'Quadriceps',
  'Ischios',
  'Fessiers',
  'Abdominaux',
  'Mollets',
  'Avant-bras',
] as const;

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

export interface ProgramDay {
  id: string;
  name: string; // ex: "Jour 1 - Push"
}

export interface ProgramExerciseTarget {
  id: string;
  dayId: string;
  exerciseName: string;
  muscleGroup: MuscleGroup;
  targetSets: number;
  targetRepsMin: number;
  targetRepsMax: number;
  targetWeight?: number; // kg, optionnel
  notes?: string;
}

export interface Program {
  id: string;
  name: string;
  description?: string;
  createdAt: string; // ISO
  days: ProgramDay[];
  strengthTargets: ProgramExerciseTarget[];
}

export interface StrengthSet {
  id: string;
  reps: number;
  weightKg: number;
}

export interface StrengthExerciseEntry {
  id: string;
  exerciseName: string;
  sets: StrengthSet[];
}

export interface StrengthSession {
  id: string;
  date: string; // ISO date (yyyy-mm-dd)
  programId?: string;
  exercises: StrengthExerciseEntry[];
  notes?: string;
}

export interface AppData {
  programs: Program[];
  strengthSessions: StrengthSession[];
}

export const emptyAppData: AppData = {
  programs: [],
  strengthSessions: [],
};
