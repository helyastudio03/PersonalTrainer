import type { StrengthSession } from '../types';

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
