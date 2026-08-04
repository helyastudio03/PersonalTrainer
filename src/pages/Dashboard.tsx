import { Link } from 'react-router-dom';
import type { UseAppData } from '../lib/useAppData';
import { Card, EmptyState } from '../components/ui';
import {
  getActualWeeklySetsByMuscleGroup,
  getExerciseMuscleGroups,
  getRecentPRImprovements,
  getStrengthPRsByWeightReps,
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

  const recordCountByDate = new Map<string, number>();
  for (const r of getStrengthPRsByWeightReps(data.strengthSessions)) {
    if (r.previousMaxReps === null) continue;
    recordCountByDate.set(r.date, (recordCountByDate.get(r.date) ?? 0) + 1);
  }

  return (
    <div className="space-y-3">
      <h1 className="text-xl font-bold">Accueil</h1>

      <div className="grid grid-cols-3 gap-3">
        <Card>
          <p className="text-xs text-ash-300">Programmes</p>
          <p className="text-2xl font-bold">{data.programs.length}</p>
        </Card>
        <Card>
          <p className="text-xs text-ash-300">Séances</p>
          <p className="text-2xl font-bold">{data.strengthSessions.length}</p>
        </Card>
        <Card>
          <p className="text-xs text-ash-300">Exercices suivis</p>
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
                <p className="text-sm text-ash-300">
                  Prochaine séance suggérée : <span className="font-medium">{suggestedDay.name}</span>
                </p>
              )}
            </div>
            <Link
              to="/musculation"
              className="text-xs bg-ember-600 text-ash-200 rounded px-3 py-1.5 hover:bg-ember-700 shrink-0"
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
                      ? 'bg-amber-950 text-amber-400'
                      : 'bg-ash-800 text-ash-200'
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
                  key={`${r.exerciseName}-${r.weightKg}`}
                  className="text-sm flex justify-between border-b border-ash-800 py-1"
                >
                  <span>
                    {r.exerciseName} <span className="text-ash-300">({r.weightKg} kg)</span>
                  </span>
                  <span className="text-amber-400 font-medium">
                    {r.previousMaxReps} reps → {r.maxReps} reps
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
              {recentStrength.map((s) => {
                const recordCount = recordCountByDate.get(s.date) ?? 0;
                return (
                  <li
                    key={s.id}
                    className="text-sm flex justify-between border-b border-ash-800 py-1"
                  >
                    <span>
                      {s.name ? `${s.name} · ${s.date}` : s.date}
                      {recordCount > 0 && (
                        <span className="ml-1.5 text-amber-400">
                          {recordCount > 1 ? recordCount : ''}⭐
                        </span>
                      )}
                    </span>
                    <span className="text-ash-300">
                      {s.exercises.length} exercice{s.exercises.length > 1 ? 's' : ''}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
