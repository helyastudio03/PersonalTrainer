import type { MuscleGroup, Program, StrengthSession } from '../types';

export function formatRepRange(min: number, max: number): string {
  return min === max ? `${min}` : `${min}-${max}`;
}

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

// Courbes de progression configurables (poids, reps, poids×reps, volume),
// par séance ou agrégées par semaine. Pas d'estimation de 1RM ici.

export type ProgressionMetric = 'weight' | 'reps' | 'weightReps' | 'volume';
export type ProgressionPeriod = 'session' | 'week';

export const PROGRESSION_METRIC_LABELS: Record<ProgressionMetric, string> = {
  weight: 'Poids (meilleure série)',
  reps: 'Répétitions (meilleure série)',
  weightReps: 'Poids × Reps (meilleure série)',
  volume: 'Volume (poids × reps cumulé)',
};

interface SessionSetMetrics {
  date: string;
  topWeight: number;
  topReps: number;
  weightReps: number;
  volume: number;
}

function computeSessionSetMetrics(
  sessions: StrengthSession[],
  exerciseName: string,
): SessionSetMetrics[] {
  const points: SessionSetMetrics[] = [];

  for (const session of sessions) {
    const entry = session.exercises.find((e) => e.exerciseName === exerciseName);
    if (!entry || entry.sets.length === 0) continue;

    let topWeight = 0;
    let topReps = 0;
    let volume = 0;
    for (const set of entry.sets) {
      volume += set.weightKg * set.reps;
      if (set.weightKg > topWeight || (set.weightKg === topWeight && set.reps > topReps)) {
        topWeight = set.weightKg;
        topReps = set.reps;
      }
    }

    points.push({ date: session.date, topWeight, topReps, weightReps: topWeight * topReps, volume });
  }

  return points.sort((a, b) => a.date.localeCompare(b.date));
}

function pickMetric(m: SessionSetMetrics, metric: ProgressionMetric): number {
  switch (metric) {
    case 'weight':
      return m.topWeight;
    case 'reps':
      return m.topReps;
    case 'weightReps':
      return m.weightReps;
    case 'volume':
      return m.volume;
  }
}

// Lundi de la semaine contenant la date donnée (yyyy-mm-dd).
function startOfWeek(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  const day = d.getDay();
  const diffToMonday = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diffToMonday);
  return d.toISOString().slice(0, 10);
}

export interface ProgressionPoint {
  label: string; // date de séance, ou date de début de semaine
  value: number;
}

export function getStrengthMetricSeries(
  sessions: StrengthSession[],
  exerciseName: string,
  metric: ProgressionMetric,
  period: ProgressionPeriod,
): ProgressionPoint[] {
  const sessionMetrics = computeSessionSetMetrics(sessions, exerciseName);

  if (period === 'session') {
    return sessionMetrics.map((m) => ({ label: m.date, value: pickMetric(m, metric) }));
  }

  const byWeek = new Map<string, SessionSetMetrics[]>();
  for (const m of sessionMetrics) {
    const week = startOfWeek(m.date);
    const list = byWeek.get(week);
    if (list) list.push(m);
    else byWeek.set(week, [m]);
  }

  return [...byWeek.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([week, list]) => ({
      label: week,
      value:
        metric === 'volume'
          ? list.reduce((sum, m) => sum + m.volume, 0)
          : Math.max(...list.map((m) => pickMetric(m, metric))),
    }));
}

export interface MultiExerciseProgressionPoint {
  label: string;
  [exerciseName: string]: string | number;
}

// Fusionne les séries de plusieurs exercices sur un même axe (une clé par
// exercice), pour afficher plusieurs courbes sur un seul graphique.
export function getMultiExerciseMetricSeries(
  sessions: StrengthSession[],
  exerciseNames: string[],
  metric: ProgressionMetric,
  period: ProgressionPeriod,
): MultiExerciseProgressionPoint[] {
  const byLabel = new Map<string, MultiExerciseProgressionPoint>();

  for (const name of exerciseNames) {
    const series = getStrengthMetricSeries(sessions, name, metric, period);
    for (const point of series) {
      const existing = byLabel.get(point.label);
      if (existing) existing[name] = point.value;
      else byLabel.set(point.label, { label: point.label, [name]: point.value });
    }
  }

  return [...byLabel.values()].sort((a, b) => a.label.localeCompare(b.label));
}

// Déduit le groupe musculaire de chaque exercice à partir des programmes,
// pour permettre de filtrer les exercices par groupe musculaire.
export function getExerciseMuscleGroups(programs: Program[]): Record<string, MuscleGroup> {
  const map: Record<string, MuscleGroup> = {};
  for (const program of programs) {
    for (const target of program.strengthTargets) {
      if (target.exerciseName.trim()) map[target.exerciseName] = target.muscleGroup;
    }
  }
  return map;
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

// Combine les noms d'exercices utilisés dans les programmes et dans les
// séances enregistrées, pour alimenter les suggestions de saisie.
export function listAllExerciseNames(programs: Program[], sessions: StrengthSession[]): string[] {
  const names = new Set<string>(listStrengthExerciseNames(sessions));
  for (const program of programs) {
    for (const target of program.strengthTargets) {
      if (target.exerciseName.trim()) names.add(target.exerciseName);
    }
  }
  return [...names].sort();
}
