import { Link } from 'react-router-dom';
import type { UseAppData } from '../lib/useAppData';
import { Card, EmptyState } from '../components/ui';
import { formatPace, getRunPRs, getStrengthPRs, speedKmH } from '../lib/records';

export default function Dashboard({ appData }: { appData: UseAppData }) {
  const { data } = appData;
  const strengthPRs = getStrengthPRs(data.strengthSessions);
  const runPRs = getRunPRs(data.runSessions);

  const recentStrength = [...data.strengthSessions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 3);
  const recentRuns = [...data.runSessions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 3);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <p className="text-xs text-gray-500">Programmes</p>
          <p className="text-2xl font-bold">{data.programs.length}</p>
        </Card>
        <Card>
          <p className="text-xs text-gray-500">Séances muscu</p>
          <p className="text-2xl font-bold">{data.strengthSessions.length}</p>
        </Card>
        <Card>
          <p className="text-xs text-gray-500">Sorties course</p>
          <p className="text-2xl font-bold">{data.runSessions.length}</p>
        </Card>
        <Card>
          <p className="text-xs text-gray-500">Exercices suivis</p>
          <p className="text-2xl font-bold">{strengthPRs.length}</p>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-semibold">Dernières séances muscu</h2>
            <Link to="/musculation" className="text-xs text-indigo-600 hover:underline">
              Voir tout
            </Link>
          </div>
          {recentStrength.length === 0 ? (
            <EmptyState>Aucune séance enregistrée pour le moment.</EmptyState>
          ) : (
            <ul className="space-y-2">
              {recentStrength.map((s) => (
                <li key={s.id} className="text-sm flex justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
                  <span>{s.date}</span>
                  <span className="text-gray-500">
                    {s.exercises.length} exercice{s.exercises.length > 1 ? 's' : ''}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-semibold">Dernières sorties course</h2>
            <Link to="/course" className="text-xs text-indigo-600 hover:underline">
              Voir tout
            </Link>
          </div>
          {recentRuns.length === 0 ? (
            <EmptyState>Aucune sortie enregistrée pour le moment.</EmptyState>
          ) : (
            <ul className="space-y-2">
              {recentRuns.map((r) => (
                <li key={r.id} className="text-sm flex justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
                  <span>{r.date}</span>
                  <span className="text-gray-500">
                    {r.distanceKm} km · {speedKmH(r).toFixed(1)} km/h
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {runPRs && (
        <Card>
          <h2 className="font-semibold mb-2">Record course actuel</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Meilleure allure: <strong>{formatPace(runPRs.bestPaceMinPerKm)}</strong> sur{' '}
            {runPRs.bestPaceDistanceKm} km (le {runPRs.bestPaceDate}) · Plus longue distance:{' '}
            <strong>{runPRs.longestDistanceKm} km</strong> (le {runPRs.longestDistanceDate})
          </p>
        </Card>
      )}
    </div>
  );
}
