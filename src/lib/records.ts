import type { MuscleGroup, Program, ProgramDay, StrengthSession, StrengthSet } from '../types';

export function formatRepRange(min: number, max: number): string {
  return min === max ? `${min}` : `${min}-${max}`;
}

// Liste les séries d'une entrée, espacées (ex: "7×67.5  7×67.5  8×67.5"),
// au format répétitions×poids sans unité (voir la légende affichée à
// l'utilisateur).
export function formatSetsSummary(sets: StrengthSet[]): string {
  if (sets.length === 0) return '';
  return sets.map((s) => `${s.reps}×${s.weightKg}`).join('   ');
}

// Records personnels par couple (répétitions, poids): pour chaque exercice
// et chaque nombre de répétitions déjà réalisé, le poids maximal soulevé,
// ainsi que le précédent record (pour afficher une tendance de progression).
export interface RepWeightRecord {
  exerciseName: string;
  reps: number;
  maxWeight: number;
  date: string;
  previousMaxWeight: number | null;
}

export function getStrengthPRsByRepWeight(sessions: StrengthSession[]): RepWeightRecord[] {
  const byKey = new Map<string, { exerciseName: string; reps: number; weightKg: number; date: string }[]>();

  for (const session of sessions) {
    for (const entry of session.exercises) {
      for (const set of entry.sets) {
        const key = `${entry.exerciseName}__${set.reps}`;
        const point = { exerciseName: entry.exerciseName, reps: set.reps, weightKg: set.weightKg, date: session.date };
        const list = byKey.get(key);
        if (list) list.push(point);
        else byKey.set(key, [point]);
      }
    }
  }

  const records: RepWeightRecord[] = [];
  for (const points of byKey.values()) {
    const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date));

    let maxWeight = -Infinity;
    let maxDate = '';
    let previousMaxWeight: number | null = null;

    for (const p of sorted) {
      if (p.weightKg > maxWeight) {
        previousMaxWeight = maxWeight === -Infinity ? null : maxWeight;
        maxWeight = p.weightKg;
        maxDate = p.date;
      }
    }

    records.push({
      exerciseName: sorted[0].exerciseName,
      reps: sorted[0].reps,
      maxWeight,
      date: maxDate,
      previousMaxWeight,
    });
  }

  return records.sort((a, b) => {
    const nameCmp = a.exerciseName.localeCompare(b.exerciseName);
    return nameCmp !== 0 ? nameCmp : a.reps - b.reps;
  });
}

export interface LastPerformance {
  date: string;
  sets: StrengthSet[];
}

// Dernière séance où l'exercice a été réalisé, pour servir de référence
// pendant la saisie d'une nouvelle séance ("la dernière fois: ...").
export function getLastPerformance(
  sessions: StrengthSession[],
  exerciseName: string,
): LastPerformance | null {
  const relevant = sessions
    .filter((s) => s.exercises.some((e) => e.exerciseName === exerciseName))
    .sort((a, b) => b.date.localeCompare(a.date));

  const last = relevant[0];
  if (!last) return null;

  const entry = last.exercises.find((e) => e.exerciseName === exerciseName)!;
  return { date: last.date, sets: entry.sets };
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
export function startOfWeek(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  const day = d.getDay();
  const diffToMonday = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diffToMonday);
  return d.toISOString().slice(0, 10);
}

export interface ProgressionPoint {
  label: string; // date de séance, ou date de début de semaine
  value: number;
  isRecord: boolean; // nouveau maximum jamais atteint jusqu'à ce point
}

export function getStrengthMetricSeries(
  sessions: StrengthSession[],
  exerciseName: string,
  metric: ProgressionMetric,
  period: ProgressionPeriod,
): ProgressionPoint[] {
  const sessionMetrics = computeSessionSetMetrics(sessions, exerciseName);

  let points: { label: string; value: number }[];
  if (period === 'session') {
    points = sessionMetrics.map((m) => ({ label: m.date, value: pickMetric(m, metric) }));
  } else {
    const byWeek = new Map<string, SessionSetMetrics[]>();
    for (const m of sessionMetrics) {
      const week = startOfWeek(m.date);
      const list = byWeek.get(week);
      if (list) list.push(m);
      else byWeek.set(week, [m]);
    }

    points = [...byWeek.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([week, list]) => ({
        label: week,
        value:
          metric === 'volume'
            ? list.reduce((sum, m) => sum + m.volume, 0)
            : Math.max(...list.map((m) => pickMetric(m, metric))),
      }));
  }

  let runningMax = -Infinity;
  return points.map((p) => {
    const isRecord = p.value > runningMax;
    if (isRecord) runningMax = p.value;
    return { ...p, isRecord };
  });
}

export interface MultiExerciseProgressionPoint {
  label: string;
  [key: string]: string | number | boolean;
}

// Fusionne les séries de plusieurs exercices sur un même axe (une clé par
// exercice), pour afficher plusieurs courbes sur un seul graphique. Le
// record de chaque exercice à un point donné est stocké sous la clé
// "<exercice>__record" pour marquer les records sur le graphique.
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
      if (existing) {
        existing[name] = point.value;
        existing[`${name}__record`] = point.isRecord;
      } else {
        byLabel.set(point.label, {
          label: point.label,
          [name]: point.value,
          [`${name}__record`]: point.isRecord,
        });
      }
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

// Suggère le prochain jour de programme à réaliser, en comparant les
// exercices de la dernière séance liée à ce programme avec ceux de chaque
// jour, puis en proposant le jour suivant dans l'ordre du programme.
export function suggestNextProgramDay(
  program: Program,
  sessions: StrengthSession[],
): ProgramDay | null {
  if (program.days.length === 0) return null;

  const programSessions = sessions
    .filter((s) => s.programId === program.id)
    .sort((a, b) => b.date.localeCompare(a.date));

  const lastSession = programSessions[0];
  if (!lastSession) return program.days[0];

  const sessionExerciseNames = new Set(lastSession.exercises.map((e) => e.exerciseName));

  let bestDay = program.days[0];
  let bestScore = -1;
  for (const day of program.days) {
    const dayExerciseNames = program.strengthTargets
      .filter((t) => t.dayId === day.id)
      .map((t) => t.exerciseName);
    const score = dayExerciseNames.filter((name) => sessionExerciseNames.has(name)).length;
    if (score > bestScore) {
      bestScore = score;
      bestDay = day;
    }
  }

  const idx = program.days.findIndex((d) => d.id === bestDay.id);
  return program.days[(idx + 1) % program.days.length];
}

// Volume réellement réalisé cette semaine (depuis lundi) par groupe
// musculaire, à comparer à la cible du programme.
export function getActualWeeklySetsByMuscleGroup(
  sessions: StrengthSession[],
  exerciseMuscleGroups: Record<string, MuscleGroup>,
): MuscleGroupVolume[] {
  const currentWeek = startOfWeek(new Date().toISOString().slice(0, 10));
  const totals = new Map<MuscleGroup, number>();

  for (const session of sessions) {
    if (startOfWeek(session.date) !== currentWeek) continue;
    for (const entry of session.exercises) {
      const muscleGroup = exerciseMuscleGroups[entry.exerciseName];
      if (!muscleGroup) continue;
      totals.set(muscleGroup, (totals.get(muscleGroup) ?? 0) + entry.sets.length);
    }
  }

  return [...totals.entries()]
    .map(([muscleGroup, weeklySets]) => ({ muscleGroup, weeklySets }))
    .sort((a, b) => b.weeklySets - a.weeklySets);
}

// Records personnels battus récemment (par défaut, les 14 derniers jours),
// pour mettre en avant la progression sur le tableau de bord.
export function getRecentPRImprovements(
  sessions: StrengthSession[],
  days = 14,
): RepWeightRecord[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  return getStrengthPRsByRepWeight(sessions)
    .filter((r) => r.previousMaxWeight !== null && r.date >= cutoffStr)
    .sort((a, b) => b.date.localeCompare(a.date));
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
