import type { UseAppData } from '../lib/useAppData';
import { Card, EmptyState } from '../components/ui';
import { formatPace, getRunPRs, getStrengthPRs } from '../lib/records';

export default function Records({ appData }: { appData: UseAppData }) {
  const { data } = appData;
  const strengthPRs = getStrengthPRs(data.strengthSessions);
  const runPRs = getRunPRs(data.runSessions);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Records personnels</h1>

      <Card>
        <h2 className="font-semibold mb-3">Musculation</h2>
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

      <Card>
        <h2 className="font-semibold mb-3">Course à pied</h2>
        {!runPRs ? (
          <EmptyState>Aucun record pour le moment. Enregistre des sorties pour en voir apparaître.</EmptyState>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-3">
              <p className="text-xs text-gray-500">Meilleure allure</p>
              <p className="text-lg font-bold">{formatPace(runPRs.bestPaceMinPerKm)}</p>
              <p className="text-xs text-gray-400">
                sur {runPRs.bestPaceDistanceKm} km, le {runPRs.bestPaceDate}
              </p>
            </div>
            <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-3">
              <p className="text-xs text-gray-500">Plus longue distance</p>
              <p className="text-lg font-bold">{runPRs.longestDistanceKm} km</p>
              <p className="text-xs text-gray-400">le {runPRs.longestDistanceDate}</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
