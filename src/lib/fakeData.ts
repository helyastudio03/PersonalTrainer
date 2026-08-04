import { v4 as uuid } from 'uuid';
import type { Program, StrengthExerciseEntry, StrengthSession, StrengthSet } from '../types';

function hashString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function seededRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// Génère un historique fictif de séances à partir des exercices d'un
// programme, avec une progression de charge crédible semaine après
// semaine, pour tester les courbes de progression et les records.
export function generateFakeSessions(
  program: Program,
  weeksBack = 6,
): Omit<StrengthSession, 'id'>[] {
  const sessions: Omit<StrengthSession, 'id'>[] = [];
  const today = new Date();

  for (let w = weeksBack - 1; w >= 0; w--) {
    program.days.forEach((day, dayIndex) => {
      const dayTargets = program.strengthTargets.filter((t) => t.dayId === day.id);
      if (dayTargets.length === 0) return;

      const daysAgo = w * 7 + dayIndex * 2;
      const date = new Date(today);
      date.setDate(date.getDate() - daysAgo);
      const dateStr = date.toISOString().slice(0, 10);

      const exercises: StrengthExerciseEntry[] = dayTargets.map((target) => {
        const rand = seededRandom(hashString(target.exerciseName) + w * 97 + dayIndex * 13 + 1);
        const baseWeight = 20 + Math.round(rand() * 60);
        const weeksElapsed = weeksBack - 1 - w;
        const progression = weeksElapsed * (1 + rand() * 1.5);
        const weight = Math.max(0, Math.round((baseWeight + progression) / 2.5) * 2.5);

        const sets: StrengthSet[] = Array.from({ length: Math.max(target.targetSets, 1) }, () => {
          const spread = target.targetRepsMax - target.targetRepsMin;
          const reps = target.targetRepsMin + Math.floor(rand() * (spread + 1));
          return { id: uuid(), reps, weightKg: weight };
        });

        return { id: uuid(), exerciseName: target.exerciseName, sets };
      });

      sessions.push({ date: dateStr, programId: program.id, exercises });
    });
  }

  return sessions.sort((a, b) => a.date.localeCompare(b.date));
}
