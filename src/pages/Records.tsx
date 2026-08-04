import { useMemo, useState } from 'react';
import type { UseAppData } from '../lib/useAppData';
import type { MuscleGroup } from '../types';
import { Card, EmptyState, Input, Label } from '../components/ui';
import {
  getExerciseMuscleGroups,
  getStrengthPRsByRepWeight,
  listStrengthExerciseNames,
} from '../lib/records';

function chipClassName(active: boolean) {
  return `text-xs px-2 py-1 rounded-full border transition-colors ${
    active
      ? 'bg-indigo-600 text-white border-transparent'
      : 'border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
  }`;
}

export default function Records({ appData }: { appData: UseAppData }) {
  const { data } = appData;

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

  const [selectedMuscleGroups, setSelectedMuscleGroups] = useState<MuscleGroup[]>([]);
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const filteredSessions = useMemo(() => {
    if (!dateFrom && !dateTo) return data.strengthSessions;
    return data.strengthSessions.filter((s) => {
      if (dateFrom && s.date < dateFrom) return false;
      if (dateTo && s.date > dateTo) return false;
      return true;
    });
  }, [data.strengthSessions, dateFrom, dateTo]);

  const records = useMemo(() => getStrengthPRsByRepWeight(filteredSessions), [filteredSessions]);

  const availableExerciseNames = useMemo(() => {
    const names = [...new Set(records.map((r) => r.exerciseName))];
    if (selectedMuscleGroups.length === 0) return names.sort();
    return names
      .filter((name) => {
        const mg = exerciseMuscleGroups[name];
        return mg ? selectedMuscleGroups.includes(mg) : false;
      })
      .sort();
  }, [records, selectedMuscleGroups, exerciseMuscleGroups]);

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (selectedMuscleGroups.length > 0) {
        const mg = exerciseMuscleGroups[r.exerciseName];
        if (!mg || !selectedMuscleGroups.includes(mg)) return false;
      }
      if (selectedExercises.length > 0 && !selectedExercises.includes(r.exerciseName)) {
        return false;
      }
      return true;
    });
  }, [records, selectedMuscleGroups, selectedExercises, exerciseMuscleGroups]);

  const byExercise = new Map<string, typeof filteredRecords>();
  for (const r of filteredRecords) {
    const list = byExercise.get(r.exerciseName);
    if (list) list.push(r);
    else byExercise.set(r.exerciseName, [r]);
  }

  function toggleMuscleGroup(mg: MuscleGroup) {
    setSelectedMuscleGroups((prev) =>
      prev.includes(mg) ? prev.filter((g) => g !== mg) : [...prev, mg],
    );
  }

  function toggleExercise(name: string) {
    setSelectedExercises((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name],
    );
  }

  function resetFilters() {
    setSelectedMuscleGroups([]);
    setSelectedExercises([]);
    setDateFrom('');
    setDateTo('');
  }

  return (
    <div className="space-y-3">
      <h1 className="text-xl font-bold">Records personnels</h1>

      <Card className="space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-semibold text-gray-500">Filtres</h2>
          <button
            type="button"
            onClick={resetFilters}
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Réinitialiser
          </button>
        </div>

        {availableMuscleGroups.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-1">Groupe musculaire</p>
            <div className="flex flex-wrap gap-1.5">
              {availableMuscleGroups.map((mg) => (
                <button
                  key={mg}
                  type="button"
                  onClick={() => toggleMuscleGroup(mg)}
                  className={chipClassName(selectedMuscleGroups.includes(mg))}
                >
                  {mg}
                </button>
              ))}
            </div>
          </div>
        )}

        {availableExerciseNames.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-1">Exercice</p>
            <div className="flex flex-wrap gap-1.5">
              {availableExerciseNames.map((name) => (
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
                        <td className="py-1 pr-4">
                          {r.maxWeight} kg
                          {r.previousMaxWeight !== null && (
                            <span
                              className="ml-1 text-green-600 dark:text-green-400"
                              title={`Précédent record: ${r.previousMaxWeight} kg`}
                            >
                              ↗
                            </span>
                          )}
                        </td>
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
