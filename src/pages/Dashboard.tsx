import { Link } from 'react-router-dom';
import type { UseAppData } from '../lib/useAppData';
import { Card, EmptyState } from '../components/ui';
import { getStrengthPRs } from '../lib/records';

export default function Dashboard({ appData }: { appData: UseAppData }) {
  const { data } = appData;
  const strengthPRs = getStrengthPRs(data.strengthSessions);

  const recentStrength = [...data.strengthSessions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <p className="text-xs text-gray-500">Programmes</p>
          <p className="text-2xl font-bold">{data.programs.length}</p>
        </Card>
        <Card>
          <p className="text-xs text-gray-500">Séances</p>
          <p className="text-2xl font-bold">{data.strengthSessions.length}</p>
        </Card>
        <Card>
          <p className="text-xs text-gray-500">Exercices suivis</p>
          <p className="text-2xl font-bold">{strengthPRs.length}</p>
        </Card>
      </div>

      <Card>
        <div className="flex justify-between items-center mb-2">
          <h2 className="font-semibold">Dernières séances</h2>
          <Link to="/musculation" className="text-xs text-indigo-600 hover:underline">
            Voir tout
          </Link>
        </div>
        {recentStrength.length === 0 ? (
          <EmptyState>Aucune séance enregistrée pour le moment.</EmptyState>
        ) : (
          <ul className="space-y-1">
            {recentStrength.map((s) => (
              <li
                key={s.id}
                className="text-sm flex justify-between border-b border-gray-100 dark:border-gray-800 py-1"
              >
                <span>{s.date}</span>
                <span className="text-gray-500">
                  {s.exercises.length} exercice{s.exercises.length > 1 ? 's' : ''}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
