import type { RunSession, StrengthSession } from '../types';
import { paceMinPerKm } from './records';

// Suggestions simples de surcharge progressive (règle de base, pas de ML).

export interface StrengthSuggestion {
  exerciseName: string;
  message: string;
  targetWeightKg?: number;
  targetReps?: number;
}

const WEIGHT_INCREMENT_KG = 2.5;
const REP_TARGET_THRESHOLD = 8;

export function suggestNextStrength(
  sessions: StrengthSession[],
  exerciseName: string,
): StrengthSuggestion | null {
  const relevant = sessions
    .filter((s) => s.exercises.some((e) => e.exerciseName === exerciseName))
    .sort((a, b) => b.date.localeCompare(a.date));

  const last = relevant[0];
  if (!last) return null;

  const entry = last.exercises.find((e) => e.exerciseName === exerciseName)!;
  if (entry.sets.length === 0) return null;

  const avgReps = entry.sets.reduce((sum, s) => sum + s.reps, 0) / entry.sets.length;
  const maxWeight = Math.max(...entry.sets.map((s) => s.weightKg));
  const allSetsHitTarget = entry.sets.every((s) => s.reps >= REP_TARGET_THRESHOLD);

  if (allSetsHitTarget) {
    return {
      exerciseName,
      message: `Dernière séance réussie (≥${REP_TARGET_THRESHOLD} reps sur toutes les séries). Essaie ${maxWeight + WEIGHT_INCREMENT_KG} kg la prochaine fois.`,
      targetWeightKg: maxWeight + WEIGHT_INCREMENT_KG,
      targetReps: REP_TARGET_THRESHOLD,
    };
  }

  return {
    exerciseName,
    message: `Reste sur ${maxWeight} kg et vise ${REP_TARGET_THRESHOLD} reps sur toutes les séries (moyenne actuelle: ${avgReps.toFixed(1)}).`,
    targetWeightKg: maxWeight,
    targetReps: REP_TARGET_THRESHOLD,
  };
}

export interface RunSuggestion {
  message: string;
  targetDistanceKm?: number;
  targetPaceMinPerKm?: number;
}

export function suggestNextRun(sessions: RunSession[]): RunSuggestion | null {
  const sorted = [...sessions].sort((a, b) => b.date.localeCompare(a.date));
  const last = sorted[0];
  if (!last) return null;

  const lastPace = paceMinPerKm(last);
  const paceImprovement = 0.05; // 3 secondes/km plus rapide, environ
  const distanceIncrease = 1.1; // +10% de distance

  // Alterne: une sortie sur deux on vise la distance, l'autre l'allure
  const targetsDistance = sorted.length % 2 === 0;

  if (targetsDistance) {
    const targetDistanceKm = Math.round(last.distanceKm * distanceIncrease * 10) / 10;
    return {
      message: `Vise une distance un peu plus longue: ${targetDistanceKm} km, à une allure proche de ${lastPace.toFixed(2)} min/km.`,
      targetDistanceKm,
      targetPaceMinPerKm: lastPace,
    };
  }

  const targetPace = Math.max(lastPace - paceImprovement, 0);
  return {
    message: `Vise la même distance (${last.distanceKm} km) mais un peu plus vite: ~${targetPace.toFixed(2)} min/km.`,
    targetDistanceKm: last.distanceKm,
    targetPaceMinPerKm: targetPace,
  };
}
