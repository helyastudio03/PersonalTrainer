import type { MuscleGroup, Program, StrengthSession } from '../types';

// Formule d'Epley pour estimer le 1RM (répétition maximale)
export function estimate1RM(weightKg: number, reps: number): number {
  if (reps <= 1) return weightKg;
  return weightKg * (1 + reps / 30);
}

export interface StrengthExerciseRecord {
  exerciseName: string;
  best1RM: number;
  best1RMDate: string;
  maxWeight: number;
  maxWeightDate: string;
  maxWeightReps: number;
}

export function getStrengthPRs(sessions: StrengthSession[]): StrengthExerciseRecord[] {
  const byExercise = new Map<string, StrengthExerciseRecord>();

  for (const session of sessions) {
    for (const entry of session.exercises) {
      for (const set of entry.sets) {
        const oneRM = estimate1RM(set.weightKg, set.reps);
        const existing = byExercise.get(entry.exerciseName);

        if (!existing) {
          byExercise.set(entry.exerciseName, {
            exerciseName: entry.exerciseName,
            best1RM: oneRM,
            best1RMDate: session.date,
            maxWeight: set.weightKg,
            maxWeightDate: session.date,
            maxWeightReps: set.reps,
          });
          continue;
        }

        if (oneRM > existing.best1RM) {
          existing.best1RM = oneRM;
          existing.best1RMDate = session.date;
        }
        if (set.weightKg > existing.maxWeight) {
          existing.maxWeight = set.weightKg;
          existing.maxWeightDate = session.date;
          existing.maxWeightReps = set.reps;
        }
      }
    }
  }

  return [...byExercise.values()].sort((a, b) => a.exerciseName.localeCompare(b.exerciseName));
}

// Séries pour graphiques de progression

export interface StrengthProgressionPoint {
  date: string;
  best1RM: number;
  maxWeight: number;
}

export function getStrengthProgressionSeries(
  sessions: StrengthSession[],
  exerciseName: string,
): StrengthProgressionPoint[] {
  const points: StrengthProgressionPoint[] = [];

  for (const session of sessions) {
    const entry = session.exercises.find((e) => e.exerciseName === exerciseName);
    if (!entry || entry.sets.length === 0) continue;

    let best1RM = 0;
    let maxWeight = 0;
    for (const set of entry.sets) {
      const oneRM = estimate1RM(set.weightKg, set.reps);
      if (oneRM > best1RM) best1RM = oneRM;
      if (set.weightKg > maxWeight) maxWeight = set.weightKg;
    }

    points.push({ date: session.date, best1RM: Math.round(best1RM * 10) / 10, maxWeight });
  }

  return points.sort((a, b) => a.date.localeCompare(b.date));
}

// Volume hebdomadaire par groupe musculaire, déduit du programme (chaque jour
// du programme est supposé réalisé une fois par semaine).

export interface MuscleGroupVolume {
  muscleGroup: MuscleGroup;
  weeklySets: number;
}

export function getWeeklySetsByMuscleGroup(
  strengthTargets: Program['strengthTargets'],
): MuscleGroupVolume[] {
  const totals = new Map<MuscleGroup, number>();
  for (const target of strengthTargets) {
    totals.set(target.muscleGroup, (totals.get(target.muscleGroup) ?? 0) + target.targetSets);
  }
  return [...totals.entries()]
    .map(([muscleGroup, weeklySets]) => ({ muscleGroup, weeklySets }))
    .sort((a, b) => b.weeklySets - a.weeklySets);
}

export function listStrengthExerciseNames(sessions: StrengthSession[]): string[] {
  const names = new Set<string>();
  for (const session of sessions) {
    for (const entry of session.exercises) {
      names.add(entry.exerciseName);
    }
  }
  return [...names].sort();
}
