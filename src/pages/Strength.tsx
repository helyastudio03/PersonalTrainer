import { useState } from 'react';
import { v4 as uuid } from 'uuid';
import type { UseAppData } from '../lib/useAppData';
import type { ProgramExerciseTarget, StrengthExerciseEntry, StrengthSet } from '../types';
import { Button, Card, EmptyState, Input, Label } from '../components/ui';
import { suggestNextStrength } from '../lib/suggestions';
import { formatRepRange } from '../lib/records';

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

function exerciseFromTarget(target: ProgramExerciseTarget): StrengthExerciseEntry {
  const reps = Math.round((target.targetRepsMin + target.targetRepsMax) / 2);
  return {
    id: uuid(),
    exerciseName: target.exerciseName,
    sets: Array.from({ length: Math.max(target.targetSets, 1) }, () => ({
      id: uuid(),
      reps,
      weightKg: 0,
    })),
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

  function addExerciseFromTarget(target: ProgramExerciseTarget) {
    setExercises((ex) => {
      const withoutBlanks = ex.filter((e) => e.exerciseName.trim() !== '');
      return [...withoutBlanks, exerciseFromTarget(target)];
    });
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
  const selectedProgram = data.programs.find((p) => p.id === programId);

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Séances</h1>
        <Button onClick={() => setShowForm((s) => !s)}>
          {showForm ? 'Annuler' : '+ Nouvelle séance'}
        </Button>
      </div>

      {showForm && (
        <Card className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
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

          {selectedProgram && selectedProgram.strengthTargets.length > 0 && (
            <div className="border border-indigo-200 dark:border-indigo-900 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg p-2 space-y-2">
              <div className="flex justify-between items-center">
                <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                  Exercices de "{selectedProgram.name}"
                </p>
                <button
                  type="button"
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                  onClick={() =>
                    selectedProgram.strengthTargets.forEach((t) => addExerciseFromTarget(t))
                  }
                >
                  + Tout ajouter
                </button>
              </div>
              {selectedProgram.days.map((day) => {
                const dayTargets = selectedProgram.strengthTargets.filter((t) => t.dayId === day.id);
                if (dayTargets.length === 0) return null;
                return (
                  <div key={day.id}>
                    <p className="text-xs text-indigo-600/70 dark:text-indigo-400/70 mb-1">{day.name}</p>
                    <div className="flex flex-wrap gap-2">
                      {dayTargets.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => addExerciseFromTarget(t)}
                          className="text-xs px-2 py-1 rounded-full border border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900"
                        >
                          + {t.exerciseName} ({t.targetSets}×
                          {formatRepRange(t.targetRepsMin, t.targetRepsMax)}
                          {t.targetRIR !== undefined ? ` @ RIR ${t.targetRIR}` : ''})
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="space-y-2">
            {exercises.map((ex) => {
              const suggestion = ex.exerciseName
                ? suggestNextStrength(data.strengthSessions, ex.exerciseName)
                : null;
              return (
                <div key={ex.id} className="border border-gray-200 dark:border-gray-800 rounded-lg p-2">
                  <div className="flex gap-2 items-center mb-1.5">
                    <Input
                      placeholder="Nom de l'exercice (ex: Squat)"
                      value={ex.exerciseName}
                      onChange={(e) => updateExercise(ex.id, e.target.value)}
                    />
                    <button className="text-red-500 text-sm shrink-0" onClick={() => removeExercise(ex.id)}>
                      ✕
                    </button>
                  </div>

                  {suggestion && (
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 mb-1.5">
                      💡 {suggestion.message}
                    </p>
                  )}

                  <div className="space-y-1">
                    {ex.sets.map((s, i) => (
                      <div key={s.id} className="flex items-center gap-2">
                        <span className="w-5 shrink-0 text-xs text-gray-400">#{i + 1}</span>
                        <Input
                          type="number"
                          min={0}
                          placeholder="Reps"
                          value={s.reps}
                          onChange={(e) => updateSet(ex.id, s.id, { reps: Number(e.target.value) })}
                        />
                        <Input
                          type="number"
                          min={0}
                          step={0.5}
                          placeholder="Poids kg"
                          value={s.weightKg === 0 ? '' : s.weightKg}
                          onChange={(e) =>
                            updateSet(ex.id, s.id, {
                              weightKg: e.target.value ? Number(e.target.value) : 0,
                            })
                          }
                        />
                        <button
                          className="shrink-0 text-red-500 text-sm"
                          onClick={() => removeSet(ex.id, s.id)}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                  <Button variant="secondary" className="mt-1.5" onClick={() => addSet(ex.id)}>
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
        <div className="space-y-2">
          {sortedSessions.map((s) => (
            <Card key={s.id}>
              <div className="flex justify-between items-start">
                <h3 className="font-semibold">{s.date}</h3>
                <Button variant="danger" onClick={() => deleteStrengthSession(s.id)}>
                  Supprimer
                </Button>
              </div>
              <div className="mt-1.5 space-y-0.5">
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
