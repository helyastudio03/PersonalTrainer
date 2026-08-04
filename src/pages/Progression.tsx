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
import { Card, EmptyState, IconButton, Input, Label } from '../components/ui';
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

const LINE_COLORS = ['#f2541f', '#ffb347', '#b32d10', '#7a6152', '#d93c15', '#ff9c6e', '#8f240f', '#efe4d8'];

function selectClassName() {
  return 'px-3 py-1.5 rounded-lg border border-ash-600 bg-ash-950 text-sm';
}

function renderRecordDot(color: string, exerciseName: string) {
  return (props: {
    cx?: number;
    cy?: number;
    index?: number;
    payload?: Record<string, string | number | boolean>;
  }) => {
    const { cx, cy, index, payload } = props;
    if (cx == null || cy == null) return <g key={`dot-${exerciseName}-${index}`} />;
    const isRecord = payload?.[`${exerciseName}__record`];
    if (isRecord) {
      return (
        <text
          key={`dot-${exerciseName}-${index}`}
          x={cx}
          y={cy}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={14}
        >
          ⭐
        </text>
      );
    }
    return <circle key={`dot-${exerciseName}-${index}`} cx={cx} cy={cy} r={3} fill={color} stroke={color} />;
  };
}

function chipClassName(active: boolean) {
  return `text-xs px-2 py-1 rounded-full border transition-colors ${
    active
      ? 'bg-ember-600 text-white border-transparent'
      : 'border-ash-600 text-ash-200 hover:bg-ash-800'
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

  const exercisesByGroup = useMemo(() => {
    const map = new Map<MuscleGroup, string[]>();
    const ungrouped: string[] = [];
    for (const name of filteredExerciseNames) {
      const mg = exerciseMuscleGroups[name];
      if (mg) {
        const list = map.get(mg);
        if (list) list.push(name);
        else map.set(mg, [name]);
      } else {
        ungrouped.push(name);
      }
    }
    return { map, ungrouped };
  }, [filteredExerciseNames, exerciseMuscleGroups]);

  const groupsToShow = availableMuscleGroups.filter(
    (mg) => selectedMuscleGroups.length === 0 || selectedMuscleGroups.includes(mg),
  );

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
          <h2 className="text-sm font-semibold text-ash-300">Filtres</h2>
          <IconButton
            variant="secondary"
            hoverOnly={false}
            onClick={resetFilters}
            title="Réinitialiser les filtres"
            aria-label="Réinitialiser les filtres"
          >
            ↺
          </IconButton>
        </div>

        <div>
          <p className="text-xs font-semibold text-ash-300 mb-1.5">
            Exercices (une courbe par exercice sélectionné)
          </p>
          {filteredExerciseNames.length === 0 ? (
            <p className="text-xs text-ash-400">Aucun exercice pour ce filtre.</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {groupsToShow.map((mg) => {
                const names = exercisesByGroup.map.get(mg);
                if (!names || names.length === 0) return null;
                const groupActive = selectedMuscleGroups.includes(mg);
                return (
                  <div
                    key={mg}
                    className="border border-ash-700 rounded-lg p-2 space-y-1.5"
                  >
                    <button
                      type="button"
                      onClick={() => toggleMuscleGroup(mg)}
                      className={`w-full text-left text-xs font-semibold uppercase tracking-wide ${
                        groupActive
                          ? 'text-ember-400'
                          : 'text-ash-300 hover:text-ash-100'
                      }`}
                    >
                      {mg}
                    </button>
                    <div className="flex flex-wrap gap-1.5">
                      {names.map((name) => {
                        const active = activeExercises.includes(name);
                        return (
                          <button
                            key={name}
                            type="button"
                            onClick={() => toggleExercise(name)}
                            className={chipClassName(active)}
                          >
                            {name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              {exercisesByGroup.ungrouped.length > 0 && (
                <div className="border border-ash-700 rounded-lg p-2 space-y-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ash-400">
                    Sans groupe
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {exercisesByGroup.ungrouped.map((name) => {
                      const active = activeExercises.includes(name);
                      return (
                        <button
                          key={name}
                          type="button"
                          onClick={() => toggleExercise(name)}
                          className={chipClassName(active)}
                        >
                          {name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
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
            <div className="flex rounded-lg border border-ash-600 overflow-hidden text-sm">
              {(['session', 'week'] as ProgressionPeriod[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 ${
                    period === p
                      ? 'bg-ember-600 text-white'
                      : 'bg-ash-950 text-ash-200'
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
              {activeExercises.map((name, i) => {
                const color = LINE_COLORS[i % LINE_COLORS.length];
                return (
                  <Line
                    key={name}
                    type="monotone"
                    dataKey={name}
                    name={name}
                    stroke={color}
                    strokeWidth={2}
                    connectNulls
                    isAnimationActive={false}
                    dot={renderRecordDot(color, name)}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>
    </div>
  );
}
