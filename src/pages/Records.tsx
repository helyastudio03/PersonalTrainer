import type { UseAppData } from '../lib/useAppData';
import { Card, EmptyState } from '../components/ui';
import { getStrengthPRsByRepWeight } from '../lib/records';

export default function Records({ appData }: { appData: UseAppData }) {
  const { data } = appData;
  const records = getStrengthPRsByRepWeight(data.strengthSessions);

  const byExercise = new Map<string, typeof records>();
  for (const r of records) {
    const list = byExercise.get(r.exerciseName);
    if (list) list.push(r);
    else byExercise.set(r.exerciseName, [r]);
  }

  return (
    <div className="space-y-3">
      <h1 className="text-xl font-bold">Records personnels</h1>

      {records.length === 0 ? (
        <EmptyState>Aucun record pour le moment. Enregistre des séances pour en voir apparaître.</EmptyState>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {[...byExercise.entries()].map(([exerciseName, exerciseRecords]) => (
            <Card key={exerciseName}>
              <h2 className="font-semibold mb-2">{exerciseName}</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b border-gray-200 dark:border-gray-800">
                      <th className="py-1 pr-4">Répétitions</th>
                      <th className="py-1 pr-4">Poids max</th>
                      <th className="py-1 pr-4">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exerciseRecords.map((r) => (
                      <tr key={r.reps} className="border-b border-gray-100 dark:border-gray-900">
                        <td className="py-1 pr-4 font-medium">{r.reps}</td>
                        <td className="py-1 pr-4">{r.maxWeight} kg</td>
                        <td className="py-1 pr-4 text-gray-500">{r.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
