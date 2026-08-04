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
import { getStrengthProgressionSeries, listStrengthExerciseNames } from '../lib/records';

export default function Progression({ appData }: { appData: UseAppData }) {
  const { data } = appData;
  const exerciseNames = useMemo(
    () => listStrengthExerciseNames(data.strengthSessions),
    [data.strengthSessions],
  );
  const [selectedExercise, setSelectedExercise] = useState(exerciseNames[0] ?? '');
  const activeExercise = selectedExercise || exerciseNames[0] || '';

  const strengthSeries = useMemo(
    () => getStrengthProgressionSeries(data.strengthSessions, activeExercise),
    [data.strengthSessions, activeExercise],
  );

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Progression</h1>

      <Card>
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold">1RM estimé & poids max</h2>
          {exerciseNames.length > 0 && (
            <select
              className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm"
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
        </div>
        {strengthSeries.length === 0 ? (
          <EmptyState>Pas encore de données pour cet exercice.</EmptyState>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={strengthSeries}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="date" fontSize={12} />
              <YAxis fontSize={12} unit="kg" />
              <Tooltip />
              <Line type="monotone" dataKey="best1RM" name="1RM estimé (kg)" stroke="#6366f1" strokeWidth={2} />
              <Line type="monotone" dataKey="maxWeight" name="Poids max (kg)" stroke="#22c55e" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>
    </div>
  );
}
