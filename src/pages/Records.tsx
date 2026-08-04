import type { UseAppData } from '../lib/useAppData';
import { Card, EmptyState } from '../components/ui';
import { getStrengthPRs } from '../lib/records';

export default function Records({ appData }: { appData: UseAppData }) {
  const { data } = appData;
  const strengthPRs = getStrengthPRs(data.strengthSessions);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Records personnels</h1>

      <Card>
        {strengthPRs.length === 0 ? (
          <EmptyState>Aucun record pour le moment. Enregistre des séances pour en voir apparaître.</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-200 dark:border-gray-800">
                  <th className="py-2 pr-4">Exercice</th>
                  <th className="py-2 pr-4">1RM estimé</th>
                  <th className="py-2 pr-4">Poids max levé</th>
                  <th className="py-2 pr-4">Date poids max</th>
                </tr>
              </thead>
              <tbody>
                {strengthPRs.map((r) => (
                  <tr key={r.exerciseName} className="border-b border-gray-100 dark:border-gray-900">
                    <td className="py-2 pr-4 font-medium">{r.exerciseName}</td>
                    <td className="py-2 pr-4">{r.best1RM.toFixed(1)} kg</td>
                    <td className="py-2 pr-4">
                      {r.maxWeight} kg × {r.maxWeightReps}
                    </td>
                    <td className="py-2 pr-4 text-gray-500">{r.maxWeightDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
