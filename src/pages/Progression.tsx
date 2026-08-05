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
import type { TooltipContentProps } from 'recharts';
import type { ValueType, NameType } from 'recharts/types/component/DefaultTooltipContent';
import type { UseAppData } from '../lib/useAppData';
import type { SharedExerciseFilters } from '../lib/useSharedFilters';
import type { MuscleGroup } from '../types';
import { Card, EmptyState, IconButton, Input, Label, RECORD_COLOR } from '../components/ui';
import {
  getExerciseMuscleGroups,
  getProgressionLines,
  listStrengthExerciseNames,
  mergeProgressionLines,
  PROGRESSION_METRIC_LABELS,
} from '../lib/records';
import type { ProgressionMetric, ProgressionPeriod } from '../lib/records';
import { getMuscleGroupColor } from '../lib/muscleColors';

const METRICS: ProgressionMetric[] = ['volume', 'reps', 'weight'];

const periodLabel: Record<ProgressionPeriod, string> = {
  session: 'Par séance',
  week: 'Par semaine',
};

const LINE_COLORS = ['#d93c15', '#7a6152', '#8f240f', '#b32d10', '#3d0f08', '#a88972', '#f2541f', '#554234'];

function selectClassName() {
  return 'px-3 py-1.5 rounded-lg border border-ash-300 bg-white text-sm';
}

function renderRecordDot(color: string, lineKey: string) {
  return (props: {
    cx?: number;
    cy?: number;
    index?: number;
    payload?: Record<string, string | number | boolean>;
  }) => {
    const { cx, cy, index, payload } = props;
    if (cx == null || cy == null) return <g key={`dot-${lineKey}-${index}`} />;
    const isRecord = payload?.[`${lineKey}__record`];
    if (isRecord) {
      return (
        <g key={`dot-${lineKey}-${index}`} transform={`translate(${cx - 6}, ${cy - 6}) scale(0.5)`}>
          <path
            d="M12 2 14.9 8.6 22 9.3 16.5 14 18.2 21 12 17.3 5.8 21 7.5 14 2 9.3 9.1 8.6 12 2Z"
            fill={RECORD_COLOR}
          />
        </g>
      );
    }
    return <circle key={`dot-${lineKey}-${index}`} cx={cx} cy={cy} r={3} fill={color} stroke={color} />;
  };
}

function renderTooltipContent(metric: ProgressionMetric) {
  const unit = metric === 'reps' ? ' reps' : ' kg';
  return ({ active, label, payload }: TooltipContentProps<ValueType, NameType>) => {
    if (!active || !payload || payload.length === 0) return null;
    return (
      <div className="bg-white border border-ash-200 rounded-lg shadow-sm px-3 py-2 text-xs space-y-1">
        <p className="font-semibold text-ash-700">{label}</p>
        {payload.map((entry, i) => (
          <p key={typeof entry.dataKey === 'string' ? entry.dataKey : i} style={{ color: entry.color }}>
            <span className="font-medium">{entry.name}</span> : {entry.value}
            {unit}
          </p>
        ))}
      </div>
    );
  };
}

function chipClassName(active: boolean) {
  return `text-xs px-2 py-1 rounded-full border transition-colors ${
    active
      ? 'bg-ember-600 text-ash-100 border-transparent'
      : 'border-ash-300 text-ash-700 hover:bg-ash-100'
  }`;
}

export default function Progression({
  appData,
  filters,
}: {
  appData: UseAppData;
  filters: SharedExerciseFilters;
}) {
  const { data } = appData;
  const { selectedExercises, setSelectedExercises, dateFrom, setDateFrom, dateTo, setDateTo } = filters;

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

  const [metric, setMetric] = useState<ProgressionMetric>('volume');
  const [period, setPeriod] = useState<ProgressionPeriod>('session');

  const activeExercises = selectedExercises.filter((name) => allExerciseNames.includes(name));

  const exercisesByGroup = useMemo(() => {
    const map = new Map<MuscleGroup, string[]>();
    const ungrouped: string[] = [];
    for (const name of allExerciseNames) {
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
  }, [allExerciseNames, exerciseMuscleGroups]);

  const filteredSessions = useMemo(() => {
    if (!dateFrom && !dateTo) return data.strengthSessions;
    return data.strengthSessions.filter((s) => {
      if (dateFrom && s.date < dateFrom) return false;
      if (dateTo && s.date > dateTo) return false;
      return true;
    });
  }, [data.strengthSessions, dateFrom, dateTo]);

  const lines = useMemo(
    () => getProgressionLines(filteredSessions, activeExercises, metric, period),
    [filteredSessions, activeExercises, metric, period],
  );
  const series = useMemo(() => mergeProgressionLines(lines), [lines]);

  function toggleExercise(name: string) {
    setSelectedExercises((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name],
    );
  }

  function toggleMuscleGroup(mg: MuscleGroup) {
    const names = exercisesByGroup.map.get(mg) ?? [];
    const allSelected = names.every((n) => selectedExercises.includes(n));
    setSelectedExercises((prev) => {
      if (allSelected) return prev.filter((n) => !names.includes(n));
      return [...new Set([...prev, ...names])];
    });
  }

  function resetFilters() {
    setDateFrom('');
    setDateTo('');
    setSelectedExercises(allExerciseNames[0] ? [allExerciseNames[0]] : []);
  }

  return (
    <div className="space-y-3">
      <h1 className="text-xl font-bold">Progression</h1>

      <Card className="space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-semibold text-ash-600">Filtres</h2>
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
          <p className="text-xs font-semibold text-ash-600 mb-1.5">Exercices</p>
          {allExerciseNames.length === 0 ? (
            <p className="text-xs text-ash-500">Aucun exercice pour ce filtre.</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {availableMuscleGroups.map((mg) => {
                const names = exercisesByGroup.map.get(mg);
                if (!names || names.length === 0) return null;
                const groupActive = names.every((n) => activeExercises.includes(n));
                return (
                  <div
                    key={mg}
                    className="border border-ash-200 rounded-lg p-2 space-y-1.5"
                  >
                    <button
                      type="button"
                      onClick={() => toggleMuscleGroup(mg)}
                      title="Sélectionner/désélectionner tous les exercices de ce groupe"
                      className={`w-full flex items-center gap-1.5 text-left text-xs font-semibold uppercase tracking-wide ${
                        groupActive
                          ? 'text-ember-600'
                          : 'text-ash-600 hover:text-ash-800'
                      }`}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: getMuscleGroupColor(mg) }}
                      />
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
                <div className="border border-ash-200 rounded-lg p-2 space-y-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ash-500">
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
            <div className="flex rounded-lg border border-ash-300 overflow-hidden text-sm">
              {(['session', 'week'] as ProgressionPeriod[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 ${
                    period === p
                      ? 'bg-ember-600 text-ash-100'
                      : 'bg-white text-ash-700'
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
              <Tooltip content={renderTooltipContent(metric)} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {lines.map((line, i) => {
                const color = LINE_COLORS[i % LINE_COLORS.length];
                return (
                  <Line
                    key={line.key}
                    type="monotone"
                    dataKey={line.key}
                    name={line.label}
                    stroke={color}
                    strokeWidth={2}
                    connectNulls
                    isAnimationActive={false}
                    dot={renderRecordDot(color, line.key)}
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
