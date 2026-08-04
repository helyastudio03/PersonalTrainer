// Domaine: musculation

export interface ProgramExerciseTarget {
  id: string;
  exerciseName: string;
  targetSets: number;
  targetReps: number;
  targetWeight?: number; // kg, optionnel
  notes?: string;
}

export interface ProgramRunTarget {
  id: string;
  label: string; // ex: "Sortie longue", "Fractionné"
  targetDistanceKm?: number;
  targetPaceMinPerKm?: number; // min/km cible
  notes?: string;
}

export interface Program {
  id: string;
  name: string;
  description?: string;
  createdAt: string; // ISO
  strengthTargets: ProgramExerciseTarget[];
  runTargets: ProgramRunTarget[];
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

export interface RunSession {
  id: string;
  date: string; // ISO date
  programId?: string;
  distanceKm: number;
  durationMin: number; // temps total en minutes
  notes?: string;
}

export interface AppData {
  programs: Program[];
  strengthSessions: StrengthSession[];
  runSessions: RunSession[];
}

export const emptyAppData: AppData = {
  programs: [],
  strengthSessions: [],
  runSessions: [],
};
