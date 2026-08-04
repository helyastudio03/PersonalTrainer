import { useMemo, useState } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { UseAppData } from '../lib/useAppData';
import type { MuscleGroup } from '../types';
import { Card, EmptyState, Input, Label } from '../components/ui';
import {
  getExerciseMuscleGroups,
  getMultiExerciseMetricSeries,
  listStrengthExerciseNames,
  PROGRESSION_METRIC_LABELS,
} from '../lib/records';
import type { ProgressionMetric, ProgressionPeriod } from '../lib/records';

const METRICS: ProgressionMetric[] = ['weight', 'reps', 'weightReps', 'volume'];

const periodLabel: Record<ProgressionPeriod, string> = {
  session: 'Par séance',
  week: 'Par semaine',
};

const LINE_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ec4899', '#06b6d4', '#ef4444', '#84cc16', '#a855f7'];

function selectClassName() {
  return 'px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm';
}

function chipClassName(active: boolean) {
  return `text-xs px-2 py-1 rounded-full border transition-colors ${
    active
      ? 'text-white border-transparent'
      : 'border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
  }`;
}

export default function Progression({ appData }: { appData: UseAppData }) {
  const { data } = appData;

  const allExerciseNames = useMemo(
    () => listStrengthExerciseNames(data.strengthSessions),
    [data.strengthSessions],
  );
  const exerciseMuscleGroups = useMemo(
    () => getExerciseMuscleGroups(data.programs),
    [data.programs],
  );
  const availableMuscleGroups = useMemo(() => {
    const set = new Set<MuscleGroup>();
    allExerciseNames.forEach((name) => {
      const mg = exerciseMuscleGroups[name];
      if (mg) set.add(mg);
    });
    return [...set].sort();
  }, [allExerciseNames, exerciseMuscleGroups]);

  const [selectedExercises, setSelectedExercises] = useState<string[]>(() =>
    allExerciseNames[0] ? [allExerciseNames[0]] : [],
  );
  const [selectedMuscleGroups, setSelectedMuscleGroups] = useState<MuscleGroup[]>([]);
  const [metric, setMetric] = useState<ProgressionMetric>('weight');
  const [period, setPeriod] = useState<ProgressionPeriod>('session');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const filteredExerciseNames = useMemo(() => {
    if (selectedMuscleGroups.length === 0) return allExerciseNames;
    return allExerciseNames.filter((name) => {
      const mg = exerciseMuscleGroups[name];
      return mg ? selectedMuscleGroups.includes(mg) : false;
    });
  }, [allExerciseNames, exerciseMuscleGroups, selectedMuscleGroups]);

  const activeExercises = selectedExercises.filter((name) => filteredExerciseNames.includes(name));

  const filteredSessions = useMemo(() => {
    if (!dateFrom && !dateTo) return data.strengthSessions;
    return data.strengthSessions.filter((s) => {
      if (dateFrom && s.date < dateFrom) return false;
      if (dateTo && s.date > dateTo) return false;
      return true;
    });
  }, [data.strengthSessions, dateFrom, dateTo]);

  const series = useMemo(
    () => getMultiExerciseMetricSeries(filteredSessions, activeExercises, metric, period),
    [filteredSessions, activeExercises, metric, period],
  );

  function toggleExercise(name: string) {
    setSelectedExercises((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name],
    );
  }

  function toggleMuscleGroup(mg: MuscleGroup) {
    setSelectedMuscleGroups((prev) =>
      prev.includes(mg) ? prev.filter((g) => g !== mg) : [...prev, mg],
    );
  }

  function resetFilters() {
    setSelectedMuscleGroups([]);
    setDateFrom('');
    setDateTo('');
    setSelectedExercises(allExerciseNames[0] ? [allExerciseNames[0]] : []);
  }

  return (
    <div className="space-y-3">
      <h1 className="text-xl font-bold">Progression</h1>

      <Card className="space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-semibold text-gray-500">Filtres</h2>
          <button
            type="button"
            onClick={resetFilters}
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            ↺ Réinitialiser
          </button>
        </div>

        {availableMuscleGroups.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-1">Groupe musculaire</p>
            <div className="flex flex-wrap gap-1.5">
              {availableMuscleGroups.map((mg) => (
                <button
                  key={mg}
                  type="button"
                  onClick={() => toggleMuscleGroup(mg)}
                  className={chipClassName(selectedMuscleGroups.includes(mg))}
                  style={selectedMuscleGroups.includes(mg) ? { backgroundColor: '#6366f1' } : undefined}
                >
                  {mg}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="text-xs font-semibold text-gray-500 mb-1">
            Exercices (une courbe par exercice sélectionné)
          </p>
          {filteredExerciseNames.length === 0 ? (
            <p className="text-xs text-gray-400">Aucun exercice pour ce filtre.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {filteredExerciseNames.map((name) => {
                const active = activeExercises.includes(name);
                const color = active
                  ? LINE_COLORS[activeExercises.indexOf(name) % LINE_COLORS.length]
                  : undefined;
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => toggleExercise(name)}
                    className={chipClassName(active)}
                    style={color ? { backgroundColor: color } : undefined}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div>
            <Label>Métrique</Label>
            <select
              className={selectClassName()}
              value={metric}
              onChange={(e) => setMetric(e.target.value as ProgressionMetric)}
            >
              {METRICS.map((m) => (
                <option key={m} value={m}>
                  {PROGRESSION_METRIC_LABELS[m]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Période</Label>
            <div className="flex rounded-lg border border-gray-300 dark:border-gray-700 overflow-hidden text-sm">
              {(['session', 'week'] as ProgressionPeriod[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 ${
                    period === p
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white dark:bg-gray-950 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  {periodLabel[p]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>Depuis</Label>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div>
            <Label>Jusqu'à</Label>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
        </div>
      </Card>

      <Card>
        {activeExercises.length === 0 ? (
          <EmptyState>Sélectionne au moins un exercice pour afficher une courbe.</EmptyState>
        ) : series.length === 0 ? (
          <EmptyState>Pas de données pour ce filtre.</EmptyState>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={series}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="label" fontSize={12} />
              <YAxis fontSize={12} allowDecimals={false} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {activeExercises.map((name, i) => (
                <Line
                  key={name}
                  type="monotone"
                  dataKey={name}
                  name={name}
                  stroke={LINE_COLORS[i % LINE_COLORS.length]}
                  strokeWidth={2}
                  connectNulls
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>
    </div>
  );
}
