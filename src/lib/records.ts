import type { MuscleGroup, Program, ProgramDay, StrengthSession, StrengthSet } from '../types';

export function formatRepRange(min: number, max: number): string {
  return min === max ? `${min}` : `${min}-${max}`;
}

// Liste les séries d'une entrée, poids d'abord, en regroupant les séries
// consécutives au même poids (ex: "67.5kg×8-8-6  70kg×5"), puisque c'est
// le cas la plupart du temps.
export function formatSetsSummary(sets: StrengthSet[]): string {
  if (sets.length === 0) return '';
  const groups: { weightKg: number; reps: number[] }[] = [];
  for (const s of sets) {
    const last = groups[groups.length - 1];
    if (last && last.weightKg === s.weightKg) {
      last.reps.push(s.reps);
    } else {
      groups.push({ weightKg: s.weightKg, reps: [s.reps] });
    }
  }
  return groups.map((g) => `${g.weightKg}kg×${g.reps.join('-')}`).join('   ');
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
  lastWeight: number;
  lastDate: string;
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

    const last = sorted[sorted.length - 1];

    records.push({
      exerciseName: sorted[0].exerciseName,
      reps: sorted[0].reps,
      maxWeight,
      date: maxDate,
      previousMaxWeight,
      lastWeight: last.weightKg,
      lastDate: last.date,
    });
  }

  return records.sort((a, b) => {
    const nameCmp = a.exerciseName.localeCompare(b.exerciseName);
    return nameCmp !== 0 ? nameCmp : a.reps - b.reps;
  });
}

// Records personnels par couple (poids, répétitions): pour chaque exercice
// et chaque poids déjà soulevé, le nombre maximal de répétitions réalisées,
// ainsi que le précédent record (pour le fil "records récents").
export interface WeightRepsRecord {
  exerciseName: string;
  weightKg: number;
  maxReps: number;
  date: string;
  previousMaxReps: number | null;
}

export function getStrengthPRsByWeightReps(sessions: StrengthSession[]): WeightRepsRecord[] {
  const byKey = new Map<string, { exerciseName: string; weightKg: number; reps: number; date: string }[]>();

  for (const session of sessions) {
    for (const entry of session.exercises) {
      for (const set of entry.sets) {
        const key = `${entry.exerciseName}__${set.weightKg}`;
        const point = { exerciseName: entry.exerciseName, weightKg: set.weightKg, reps: set.reps, date: session.date };
        const list = byKey.get(key);
        if (list) list.push(point);
        else byKey.set(key, [point]);
      }
    }
  }

  const records: WeightRepsRecord[] = [];
  for (const points of byKey.values()) {
    const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date));

    let maxReps = -Infinity;
    let maxDate = '';
    let previousMaxReps: number | null = null;

    for (const p of sorted) {
      if (p.reps > maxReps) {
        previousMaxReps = maxReps === -Infinity ? null : maxReps;
        maxReps = p.reps;
        maxDate = p.date;
      }
    }

    records.push({
      exerciseName: sorted[0].exerciseName,
      weightKg: sorted[0].weightKg,
      maxReps,
      date: maxDate,
      previousMaxReps,
    });
  }

  return records.sort((a, b) => {
    const nameCmp = a.exerciseName.localeCompare(b.exerciseName);
    return nameCmp !== 0 ? nameCmp : a.weightKg - b.weightKg;
  });
}

// Regroupe les records (poids, reps) effectivement battus (progression par
// rapport au précédent record, donc previousMaxReps non nul) par exercice et
// par date, pour afficher une étoile sur les séries concernées et détailler
// quel(s) record(s) ont été battus ce jour-là (page Séances, Accueil).
export function getRecordsByExerciseDate(sessions: StrengthSession[]): Map<string, WeightRepsRecord[]> {
  const map = new Map<string, WeightRepsRecord[]>();
  for (const r of getStrengthPRsByWeightReps(sessions)) {
    if (r.previousMaxReps === null) continue;
    const key = `${r.exerciseName}__${r.date}`;
    const list = map.get(key);
    if (list) list.push(r);
    else map.set(key, [r]);
  }
  return map;
}

// Même regroupement, mais uniquement par date (tous exercices confondus),
// pour le résumé "records récents" de l'accueil.
export function getRecordsByDate(sessions: StrengthSession[]): Map<string, WeightRepsRecord[]> {
  const map = new Map<string, WeightRepsRecord[]>();
  for (const r of getStrengthPRsByWeightReps(sessions)) {
    if (r.previousMaxReps === null) continue;
    const list = map.get(r.date);
    if (list) list.push(r);
    else map.set(r.date, [r]);
  }
  return map;
}

export interface ExerciseVariantRecord {
  variantName: string;
  date: string;
  sets: StrengthSet[];
}

// Regroupe, pour chaque exercice du programme, les variantes réalisées à sa
// place (StrengthExerciseEntry.variantOf), pour l'afficher sur la page
// Programmes (popup "variantes réalisées").
export function getExerciseVariants(sessions: StrengthSession[]): Map<string, ExerciseVariantRecord[]> {
  const map = new Map<string, ExerciseVariantRecord[]>();
  for (const session of sessions) {
    for (const entry of session.exercises) {
      if (!entry.variantOf) continue;
      const record: ExerciseVariantRecord = {
        variantName: entry.exerciseName,
        date: session.date,
        sets: entry.sets,
      };
      const list = map.get(entry.variantOf);
      if (list) list.push(record);
      else map.set(entry.variantOf, [record]);
    }
  }
  for (const list of map.values()) list.sort((a, b) => b.date.localeCompare(a.date));
  return map;
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

// Courbes de progression : volume total, ou détail par poids/répétitions
// (une courbe par poids réalisé, ou par nombre de répétitions réalisé),
// par séance ou agrégées par semaine. Pas d'estimation de 1RM ici.

export type ProgressionMetric = 'volume' | 'reps' | 'weight';
export type ProgressionPeriod = 'session' | 'week';

export const PROGRESSION_METRIC_LABELS: Record<ProgressionMetric, string> = {
  volume: 'Volume (poids × reps cumulé)',
  reps: 'Répétitions, par poids réalisé',
  weight: 'Poids, par répétitions réalisées',
};

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

// Une courbe du graphique de progression: soit le volume total d'un
// exercice, soit un exercice décomposé par poids (courbe des reps à ce
// poids) ou par répétitions (courbe du poids à ce nombre de reps).
export interface ProgressionLine {
  key: string; // clé unique (dataKey du graphique)
  label: string; // libellé affiché (légende, info-bulle)
  points: ProgressionPoint[];
}

function withRunningRecord(points: { label: string; value: number }[]): ProgressionPoint[] {
  let runningMax = -Infinity;
  return points.map((p) => {
    const isRecord = p.value > runningMax;
    if (isRecord) runningMax = p.value;
    return { ...p, isRecord };
  });
}

function groupPointsByPeriod(
  points: { date: string; value: number }[],
  period: ProgressionPeriod,
  aggregate: (values: number[]) => number,
): { label: string; value: number }[] {
  const byKey = new Map<string, number[]>();
  for (const p of points) {
    const key = period === 'session' ? p.date : startOfWeek(p.date);
    const list = byKey.get(key);
    if (list) list.push(p.value);
    else byKey.set(key, [p.value]);
  }
  return [...byKey.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([label, values]) => ({ label, value: aggregate(values) }));
}

// Courbe de volume total (poids × reps cumulé sur toutes les séries) d'un
// exercice, par séance ou par semaine.
function getVolumeLine(
  sessions: StrengthSession[],
  exerciseName: string,
  period: ProgressionPeriod,
): ProgressionLine {
  const perSession: { date: string; value: number }[] = [];
  for (const session of sessions) {
    const entry = session.exercises.find((e) => e.exerciseName === exerciseName);
    if (!entry || entry.sets.length === 0) continue;
    const volume = entry.sets.reduce((sum, s) => sum + s.weightKg * s.reps, 0);
    perSession.push({ date: session.date, value: volume });
  }
  const points = groupPointsByPeriod(perSession, period, (values) =>
    values.reduce((a, b) => a + b, 0),
  );
  return { key: exerciseName, label: exerciseName, points: withRunningRecord(points) };
}

// Décompose un exercice en une courbe par valeur fixée d'une dimension
// (poids ou reps), l'autre dimension étant la valeur tracée. Ex: pour
// "reps par poids", une courbe par poids réalisé, traçant les reps max
// atteintes à ce poids au fil du temps.
function getDecomposedLines(
  sessions: StrengthSession[],
  exerciseName: string,
  period: ProgressionPeriod,
  bucketOf: (weightKg: number, reps: number) => number,
  valueOf: (weightKg: number, reps: number) => number,
  labelSuffix: (bucket: number) => string,
): ProgressionLine[] {
  const byBucket = new Map<number, { date: string; value: number }[]>();
  for (const session of sessions) {
    const entry = session.exercises.find((e) => e.exerciseName === exerciseName);
    if (!entry) continue;
    for (const set of entry.sets) {
      const bucket = bucketOf(set.weightKg, set.reps);
      const value = valueOf(set.weightKg, set.reps);
      const list = byBucket.get(bucket);
      if (list) list.push({ date: session.date, value });
      else byBucket.set(bucket, [{ date: session.date, value }]);
    }
  }

  return [...byBucket.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([bucket, rawPoints]) => {
      const points = groupPointsByPeriod(rawPoints, period, (values) => Math.max(...values));
      return {
        key: `${exerciseName}__${bucket}`,
        label: `${exerciseName} ${labelSuffix(bucket)}`,
        points: withRunningRecord(points),
      };
    });
}

// Calcule les courbes de progression pour une liste d'exercices, selon la
// métrique choisie: "volume" donne une courbe par exercice, "reps" et
// "weight" décomposent chaque exercice en une courbe par poids (resp. par
// nombre de reps) réalisé dans l'historique.
export function getProgressionLines(
  sessions: StrengthSession[],
  exerciseNames: string[],
  metric: ProgressionMetric,
  period: ProgressionPeriod,
): ProgressionLine[] {
  const lines: ProgressionLine[] = [];
  for (const name of exerciseNames) {
    if (metric === 'volume') {
      lines.push(getVolumeLine(sessions, name, period));
    } else if (metric === 'reps') {
      lines.push(
        ...getDecomposedLines(
          sessions,
          name,
          period,
          (weightKg) => weightKg,
          (_weightKg, reps) => reps,
          (weightKg) => `${weightKg}kg`,
        ),
      );
    } else {
      lines.push(
        ...getDecomposedLines(
          sessions,
          name,
          period,
          (_weightKg, reps) => reps,
          (weightKg) => weightKg,
          (reps) => `${reps} reps`,
        ),
      );
    }
  }
  return lines;
}

export interface MultiLineProgressionPoint {
  label: string;
  [key: string]: string | number | boolean;
}

// Fusionne plusieurs courbes sur un même axe (une clé par courbe), pour les
// afficher sur un seul graphique. Le record de chaque courbe à un point
// donné est stocké sous la clé "<clé>__record" pour marquer les records.
export function mergeProgressionLines(lines: ProgressionLine[]): MultiLineProgressionPoint[] {
  const byLabel = new Map<string, MultiLineProgressionPoint>();

  for (const line of lines) {
    for (const point of line.points) {
      const existing = byLabel.get(point.label);
      if (existing) {
        existing[line.key] = point.value;
        existing[`${line.key}__record`] = point.isRecord;
      } else {
        byLabel.set(point.label, {
          label: point.label,
          [line.key]: point.value,
          [`${line.key}__record`]: point.isRecord,
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
): WeightRepsRecord[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  return getStrengthPRsByWeightReps(sessions)
    .filter((r) => r.previousMaxReps !== null && r.date >= cutoffStr)
    .sort((a, b) => b.date.localeCompare(a.date));
}

// Regroupe des séances (triées du plus ancien au plus récent) en "lignes de
// cycle": les séances consécutives d'un même programme, jusqu'à un maximum
// égal au nombre de jours de ce programme, avant de repartir sur une
// nouvelle ligne (nouveau cycle). Les séances sans programme forment leur
// propre ligne.
export function groupSessionsIntoCycleRows(
  sessions: StrengthSession[],
  programs: Program[],
): StrengthSession[][] {
  const rows: StrengthSession[][] = [];
  let currentRow: StrengthSession[] = [];
  let currentProgramId: string | undefined;
  let currentCycleSize = 1;

  for (const s of sessions) {
    const cycleSize = s.programId
      ? Math.max(programs.find((p) => p.id === s.programId)?.days.length ?? 1, 1)
      : 1;
    if (
      currentRow.length > 0 &&
      s.programId === currentProgramId &&
      currentProgramId !== undefined &&
      currentRow.length < currentCycleSize
    ) {
      currentRow.push(s);
    } else {
      if (currentRow.length > 0) rows.push(currentRow);
      currentRow = [s];
      currentProgramId = s.programId;
      currentCycleSize = cycleSize;
    }
  }
  if (currentRow.length > 0) rows.push(currentRow);
  return rows;
}

// Clé "aaaa-mm" pour grouper des séances par mois.
export function monthKey(dateStr: string): string {
  return dateStr.slice(0, 7);
}

// Libellé "Mois aaaa" en français, capitalisé (ex: "Août 2026").
export function formatMonthLabel(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  const label = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1);
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
