import { useMemo } from 'react';
import type { UseAppData } from '../lib/useAppData';
import type { SharedExerciseFilters } from '../lib/useSharedFilters';
import type { MuscleGroup } from '../types';
import { Card, EmptyState, IconButton, Input, Label } from '../components/ui';
import {
  getExerciseMuscleGroups,
  getStrengthPRsByRepWeight,
  listStrengthExerciseNames,
} from '../lib/records';

function chipClassName(active: boolean) {
  return `text-xs px-2 py-1 rounded-full border transition-colors ${
    active
      ? 'bg-ember-600 text-ash-100 border-transparent'
      : 'border-ash-300 text-ash-700 hover:bg-ash-100'
  }`;
}

export default function Records({
  appData,
  filters,
}: {
  appData: UseAppData;
  filters: SharedExerciseFilters;
}) {
  const { data } = appData;
  const { selectedExercises, setSelectedExercises, dateFrom, setDateFrom, dateTo, setDateTo } = filters;

  const exerciseMuscleGroups = useMemo(
    () => getExerciseMuscleGroups(data.programs),
    [data.programs],
  );
  const availableMuscleGroups = useMemo(() => {
    const set = new Set<MuscleGroup>();
    listStrengthExerciseNames(data.strengthSessions).forEach((name) => {
      const mg = exerciseMuscleGroups[name];
      if (mg) set.add(mg);
    });
    return [...set].sort();
  }, [data.strengthSessions, exerciseMuscleGroups]);

  const filteredSessions = useMemo(() => {
    if (!dateFrom && !dateTo) return data.strengthSessions;
    return data.strengthSessions.filter((s) => {
      if (dateFrom && s.date < dateFrom) return false;
      if (dateTo && s.date > dateTo) return false;
      return true;
    });
  }, [data.strengthSessions, dateFrom, dateTo]);

  const records = useMemo(() => getStrengthPRsByRepWeight(filteredSessions), [filteredSessions]);

  const availableExerciseNames = useMemo(
    () => [...new Set(records.map((r) => r.exerciseName))].sort(),
    [records],
  );

  const exercisesByGroup = useMemo(() => {
    const map = new Map<MuscleGroup, string[]>();
    const ungrouped: string[] = [];
    for (const name of availableExerciseNames) {
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
  }, [availableExerciseNames, exerciseMuscleGroups]);

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (selectedExercises.length > 0 && !selectedExercises.includes(r.exerciseName)) {
        return false;
      }
      return true;
    });
  }, [records, selectedExercises]);

  const byExercise = new Map<string, typeof filteredRecords>();
  for (const r of filteredRecords) {
    const list = byExercise.get(r.exerciseName);
    if (list) list.push(r);
    else byExercise.set(r.exerciseName, [r]);
  }

  function toggleMuscleGroup(mg: MuscleGroup) {
    const names = exercisesByGroup.map.get(mg) ?? [];
    const allSelected = names.every((n) => selectedExercises.includes(n));
    setSelectedExercises((prev) => {
      if (allSelected) return prev.filter((n) => !names.includes(n));
      return [...new Set([...prev, ...names])];
    });
  }

  function toggleExercise(name: string) {
    setSelectedExercises((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name],
    );
  }

  function resetFilters() {
    setSelectedExercises([]);
    setDateFrom('');
    setDateTo('');
  }

  return (
    <div className="space-y-3">
      <h1 className="text-xl font-bold">Records</h1>

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

        {availableExerciseNames.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-ash-600 mb-1.5">Exercice</p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {availableMuscleGroups.map((mg) => {
                const names = exercisesByGroup.map.get(mg);
                if (!names || names.length === 0) return null;
                const groupActive = names.every((n) => selectedExercises.includes(n));
                return (
                  <div
                    key={mg}
                    className="border border-ash-200 rounded-lg p-2 space-y-1.5"
                  >
                    <button
                      type="button"
                      onClick={() => toggleMuscleGroup(mg)}
                      title="Sélectionner/désélectionner tous les exercices de ce groupe"
                      className={`w-full text-left text-xs font-semibold uppercase tracking-wide ${
                        groupActive
                          ? 'text-ember-600'
                          : 'text-ash-600 hover:text-ash-800'
                      }`}
                    >
                      {mg}
                    </button>
                    <div className="flex flex-wrap gap-1.5">
                      {names.map((name) => (
                        <button
                          key={name}
                          type="button"
                          onClick={() => toggleExercise(name)}
                          className={chipClassName(selectedExercises.includes(name))}
                        >
                          {name}
                        </button>
                      ))}
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
                    {exercisesByGroup.ungrouped.map((name) => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => toggleExercise(name)}
                        className={chipClassName(selectedExercises.includes(name))}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-end gap-3">
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

      {filteredRecords.length === 0 ? (
        <EmptyState>Aucun record pour ce filtre.</EmptyState>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...byExercise.entries()].map(([exerciseName, exerciseRecords]) => (
            <Card key={exerciseName}>
              <h2 className="font-semibold mb-2">{exerciseName}</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-ash-600 border-b border-ash-200">
                      <th className="py-1 pr-3">Reps</th>
                      <th className="py-1 pr-3">Poids</th>
                      <th className="py-1">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exerciseRecords.map((r) => (
                      <tr key={r.reps} className="border-b border-ash-100">
                        <td className="py-1 pr-3 font-medium">{r.reps}</td>
                        <td className="py-1 pr-3">
                          {r.maxWeight} kg
                          {r.lastWeight < r.maxWeight && (
                            <span
                              className="ml-1 text-ash-500"
                              title={`Dernière perf: ${r.lastWeight} kg le ${r.lastDate}`}
                            >
                              ↘
                            </span>
                          )}
                        </td>
                        <td className="py-1 text-ash-600">{r.date}</td>
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
