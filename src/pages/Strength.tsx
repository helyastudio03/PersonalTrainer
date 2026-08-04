import { useState } from 'react';
import { v4 as uuid } from 'uuid';
import type { UseAppData } from '../lib/useAppData';
import type { StrengthExerciseEntry, StrengthSet } from '../types';
import { Button, Card, EmptyState, Input, Label } from '../components/ui';
import { suggestNextStrength } from '../lib/suggestions';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function emptyExercise(): StrengthExerciseEntry {
  return {
    id: uuid(),
    exerciseName: '',
    sets: [{ id: uuid(), reps: 8, weightKg: 0 }],
  };
}

export default function Strength({ appData }: { appData: UseAppData }) {
  const { data, addStrengthSession, deleteStrengthSession } = appData;
  const [date, setDate] = useState(todayIso());
  const [programId, setProgramId] = useState('');
  const [exercises, setExercises] = useState<StrengthExerciseEntry[]>([emptyExercise()]);
  const [showForm, setShowForm] = useState(false);

  function addExercise() {
    setExercises((ex) => [...ex, emptyExercise()]);
  }

  function updateExercise(id: string, name: string) {
    setExercises((ex) => ex.map((e) => (e.id === id ? { ...e, exerciseName: name } : e)));
  }

  function removeExercise(id: string) {
    setExercises((ex) => ex.filter((e) => e.id !== id));
  }

  function addSet(exerciseId: string) {
    setExercises((ex) =>
      ex.map((e) =>
        e.id === exerciseId
          ? { ...e, sets: [...e.sets, { id: uuid(), reps: 8, weightKg: 0 }] }
          : e,
      ),
    );
  }

  function updateSet(exerciseId: string, setId: string, patch: Partial<StrengthSet>) {
    setExercises((ex) =>
      ex.map((e) =>
        e.id === exerciseId
          ? { ...e, sets: e.sets.map((s) => (s.id === setId ? { ...s, ...patch } : s)) }
          : e,
      ),
    );
  }

  function removeSet(exerciseId: string, setId: string) {
    setExercises((ex) =>
      ex.map((e) =>
        e.id === exerciseId ? { ...e, sets: e.sets.filter((s) => s.id !== setId) } : e,
      ),
    );
  }

  function submit() {
    const validExercises = exercises.filter((e) => e.exerciseName.trim() && e.sets.length > 0);
    if (validExercises.length === 0) return;
    addStrengthSession({
      date,
      programId: programId || undefined,
      exercises: validExercises,
    });
    setExercises([emptyExercise()]);
    setDate(todayIso());
    setShowForm(false);
  }

  const sortedSessions = [...data.strengthSessions].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Musculation</h1>
        <Button onClick={() => setShowForm((s) => !s)}>
          {showForm ? 'Annuler' : '+ Nouvelle séance'}
        </Button>
      </div>

      {showForm && (
        <Card className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <Label>Programme (optionnel)</Label>
              <select
                className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm"
                value={programId}
                onChange={(e) => setProgramId(e.target.value)}
              >
                <option value="">Aucun</option>
                {data.programs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-4">
            {exercises.map((ex) => {
              const suggestion = ex.exerciseName
                ? suggestNextStrength(data.strengthSessions, ex.exerciseName)
                : null;
              return (
                <div key={ex.id} className="border border-gray-200 dark:border-gray-800 rounded-lg p-3">
                  <div className="flex gap-2 items-center mb-2">
                    <Input
                      placeholder="Nom de l'exercice (ex: Squat)"
                      value={ex.exerciseName}
                      onChange={(e) => updateExercise(ex.id, e.target.value)}
                    />
                    <button className="text-red-500 text-sm" onClick={() => removeExercise(ex.id)}>
                      ✕
                    </button>
                  </div>

                  {suggestion && (
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 mb-2">
                      💡 {suggestion.message}
                    </p>
                  )}

                  <div className="space-y-1">
                    {ex.sets.map((s, i) => (
                      <div key={s.id} className="grid grid-cols-12 gap-2 items-center">
                        <span className="col-span-1 text-xs text-gray-400">#{i + 1}</span>
                        <Input
                          className="col-span-4"
                          type="number"
                          min={0}
                          placeholder="Reps"
                          value={s.reps}
                          onChange={(e) => updateSet(ex.id, s.id, { reps: Number(e.target.value) })}
                        />
                        <Input
                          className="col-span-4"
                          type="number"
                          min={0}
                          step={0.5}
                          placeholder="Poids kg"
                          value={s.weightKg}
                          onChange={(e) =>
                            updateSet(ex.id, s.id, { weightKg: Number(e.target.value) })
                          }
                        />
                        <button
                          className="col-span-1 text-red-500 text-sm"
                          onClick={() => removeSet(ex.id, s.id)}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                  <Button variant="secondary" className="mt-2" onClick={() => addSet(ex.id)}>
                    + Série
                  </Button>
                </div>
              );
            })}
          </div>

          <div className="flex gap-2">
            <Button variant="secondary" onClick={addExercise}>
              + Exercice
            </Button>
            <Button onClick={submit}>Enregistrer la séance</Button>
          </div>
        </Card>
      )}

      {sortedSessions.length === 0 ? (
        <EmptyState>Aucune séance de musculation enregistrée.</EmptyState>
      ) : (
        <div className="space-y-3">
          {sortedSessions.map((s) => (
            <Card key={s.id}>
              <div className="flex justify-between items-start">
                <h3 className="font-semibold">{s.date}</h3>
                <Button variant="danger" onClick={() => deleteStrengthSession(s.id)}>
                  Supprimer
                </Button>
              </div>
              <div className="mt-2 space-y-1">
                {s.exercises.map((e) => (
                  <div key={e.id} className="text-sm">
                    <span className="font-medium">{e.exerciseName}: </span>
                    {e.sets.map((set) => `${set.reps}×${set.weightKg}kg`).join(', ')}
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
