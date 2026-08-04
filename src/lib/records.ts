import type { RunSession, StrengthSession } from '../types';

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

export interface RunRecord {
  bestPaceMinPerKm: number;
  bestPaceDate: string;
  bestPaceDistanceKm: number;
  longestDistanceKm: number;
  longestDistanceDate: string;
}

export function paceMinPerKm(run: RunSession): number {
  if (run.distanceKm <= 0) return Infinity;
  return run.durationMin / run.distanceKm;
}

export function getRunPRs(sessions: RunSession[]): RunRecord | null {
  if (sessions.length === 0) return null;

  let best = sessions[0];
  let bestPace = paceMinPerKm(sessions[0]);
  let longest = sessions[0];

  for (const run of sessions) {
    const pace = paceMinPerKm(run);
    if (pace < bestPace) {
      bestPace = pace;
      best = run;
    }
    if (run.distanceKm > longest.distanceKm) {
      longest = run;
    }
  }

  return {
    bestPaceMinPerKm: bestPace,
    bestPaceDate: best.date,
    bestPaceDistanceKm: best.distanceKm,
    longestDistanceKm: longest.distanceKm,
    longestDistanceDate: longest.date,
  };
}

export function formatPace(paceMinPerKmValue: number): string {
  if (!isFinite(paceMinPerKmValue)) return '-';
  const minutes = Math.floor(paceMinPerKmValue);
  const seconds = Math.round((paceMinPerKmValue - minutes) * 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')} /km`;
}

export function speedKmH(run: RunSession): number {
  if (run.durationMin <= 0) return 0;
  return run.distanceKm / (run.durationMin / 60);
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

export interface RunProgressionPoint {
  date: string;
  distanceKm: number;
  paceMinPerKm: number;
  speedKmH: number;
}

export function getRunProgressionSeries(sessions: RunSession[]): RunProgressionPoint[] {
  return [...sessions]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((run) => ({
      date: run.date,
      distanceKm: run.distanceKm,
      paceMinPerKm: Math.round(paceMinPerKm(run) * 100) / 100,
      speedKmH: Math.round(speedKmH(run) * 100) / 100,
    }));
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
