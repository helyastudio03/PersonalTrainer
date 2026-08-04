import { useMemo, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { UseAppData } from '../lib/useAppData';
import { Card, EmptyState } from '../components/ui';
import {
  getStrengthMetricSeries,
  listStrengthExerciseNames,
  PROGRESSION_METRIC_LABELS,
} from '../lib/records';
import type { ProgressionMetric, ProgressionPeriod } from '../lib/records';

const METRICS: ProgressionMetric[] = ['weight', 'reps', 'weightReps', 'volume'];

const periodLabel: Record<ProgressionPeriod, string> = {
  session: 'Par séance',
  week: 'Par semaine',
};

function selectClassName() {
  return 'px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm';
}

export default function Progression({ appData }: { appData: UseAppData }) {
  const { data } = appData;
  const exerciseNames = useMemo(
    () => listStrengthExerciseNames(data.strengthSessions),
    [data.strengthSessions],
  );
  const [selectedExercise, setSelectedExercise] = useState(exerciseNames[0] ?? '');
  const activeExercise = selectedExercise || exerciseNames[0] || '';
  const [metric, setMetric] = useState<ProgressionMetric>('weight');
  const [period, setPeriod] = useState<ProgressionPeriod>('session');

  const series = useMemo(
    () => getStrengthMetricSeries(data.strengthSessions, activeExercise, metric, period),
    [data.strengthSessions, activeExercise, metric, period],
  );

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Progression</h1>

      <Card>
        <div className="flex flex-wrap justify-between items-center gap-3 mb-3">
          <div className="flex flex-wrap gap-2">
            {exerciseNames.length > 0 && (
              <select
                className={selectClassName()}
                value={activeExercise}
                onChange={(e) => setSelectedExercise(e.target.value)}
              >
                {exerciseNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            )}
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

        {series.length === 0 ? (
          <EmptyState>Pas encore de données pour cet exercice.</EmptyState>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={series}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="label" fontSize={12} />
              <YAxis fontSize={12} allowDecimals={false} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="value"
                name={PROGRESSION_METRIC_LABELS[metric]}
                stroke="#6366f1"
                strokeWidth={2}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>
    </div>
  );
}
