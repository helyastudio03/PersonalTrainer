import { Link } from 'react-router-dom';
import type { UseAppData } from '../lib/useAppData';
import { Card, EmptyState } from '../components/ui';
import {
  getActualWeeklySetsByMuscleGroup,
  getExerciseMuscleGroups,
  getRecentPRImprovements,
  getWeeklySetsByMuscleGroup,
  listStrengthExerciseNames,
  suggestNextProgramDay,
} from '../lib/records';

export default function Dashboard({ appData }: { appData: UseAppData }) {
  const { data } = appData;
  const exerciseNames = listStrengthExerciseNames(data.strengthSessions);

  const recentStrength = [...data.strengthSessions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  const activeProgram = data.programs.find((p) => p.id === data.activeProgramId);
  const suggestedDay = activeProgram
    ? suggestNextProgramDay(activeProgram, data.strengthSessions)
    : null;

  const exerciseMuscleGroups = getExerciseMuscleGroups(data.programs);
  const targetVolume = activeProgram ? getWeeklySetsByMuscleGroup(activeProgram.strengthTargets) : [];
  const actualVolume = getActualWeeklySetsByMuscleGroup(data.strengthSessions, exerciseMuscleGroups);
  const actualByGroup = new Map(actualVolume.map((v) => [v.muscleGroup, v.weeklySets]));

  const recentPRs = getRecentPRImprovements(data.strengthSessions, 14).slice(0, 5);

  return (
    <div className="space-y-3">
      <h1 className="text-xl font-bold">Dashboard</h1>

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
          <p className="text-2xl font-bold">{exerciseNames.length}</p>
        </Card>
      </div>

      <Card>
        <div className="flex justify-between items-center mb-2">
          <h2 className="font-semibold">Programme actif</h2>
          <Link to="/programmes" className="text-xs text-ember-600 hover:underline">
            Gérer les programmes
          </Link>
        </div>
        {activeProgram ? (
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-medium">{activeProgram.name}</p>
              {suggestedDay && (
                <p className="text-sm text-gray-500">
                  Prochaine séance suggérée : <span className="font-medium">{suggestedDay.name}</span>
                </p>
              )}
            </div>
            <Link
              to="/musculation"
              className="text-xs bg-ember-600 text-white rounded px-3 py-1.5 hover:bg-ember-700 shrink-0"
            >
              Démarrer une séance
            </Link>
          </div>
        ) : (
          <EmptyState>
            Aucun programme actif. Choisissez-en un depuis la page Programmes.
          </EmptyState>
        )}
      </Card>

      {activeProgram && targetVolume.length > 0 && (
        <Card>
          <h2 className="font-semibold mb-2">Volume hebdomadaire (cette semaine)</h2>
          <div className="flex flex-wrap gap-1.5">
            {targetVolume.map((t) => {
              const actual = actualByGroup.get(t.muscleGroup) ?? 0;
              const met = actual >= t.weeklySets;
              return (
                <span
                  key={t.muscleGroup}
                  className={`text-xs rounded-full px-2 py-1 ${
                    met
                      ? 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                  }`}
                >
                  {t.muscleGroup} <span className="font-semibold">{actual}/{t.weeklySets}</span>
                </span>
              );
            })}
          </div>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-3">
        <Card>
          <h2 className="font-semibold mb-2">Records récents</h2>
          {recentPRs.length === 0 ? (
            <EmptyState>Aucun record battu ces 14 derniers jours.</EmptyState>
          ) : (
            <ul className="space-y-1">
              {recentPRs.map((r) => (
                <li
                  key={`${r.exerciseName}-${r.reps}`}
                  className="text-sm flex justify-between border-b border-gray-100 dark:border-gray-800 py-1"
                >
                  <span>
                    {r.exerciseName} <span className="text-gray-500">({r.reps} reps)</span>
                  </span>
                  <span className="text-green-600 dark:text-green-400 font-medium">
                    {r.previousMaxWeight} → {r.maxWeight} kg
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <div className="flex justify-between items-center mb-2">
            <h2 className="font-semibold">Dernières séances</h2>
            <Link to="/musculation" className="text-xs text-ember-600 hover:underline">
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
    </div>
  );
}
