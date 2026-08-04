import { useState } from 'react';
import { v4 as uuid } from 'uuid';
import type { UseAppData } from '../lib/useAppData';
import type {
  Program,
  ProgramExerciseTarget,
  StrengthExerciseEntry,
  StrengthSession,
  StrengthSet,
} from '../types';
import { Button, Card, EmptyState, IconButton, Input, Label } from '../components/ui';
import { suggestNextStrength } from '../lib/suggestions';
import { formatRepRange, formatSetsSummary, getLastPerformance } from '../lib/records';

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

const selectClassName =
  'px-2 py-1 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-xs';

function SessionCard({
  session,
  programs,
  updateStrengthSession,
  deleteStrengthSession,
}: {
  session: StrengthSession;
  programs: Program[];
  updateStrengthSession: UseAppData['updateStrengthSession'];
  deleteStrengthSession: UseAppData['deleteStrengthSession'];
}) {
  const [editingMeta, setEditingMeta] = useState(false);
  const [metaDate, setMetaDate] = useState(session.date);
  const [metaProgramId, setMetaProgramId] = useState(session.programId ?? '');

  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null);
  const [exerciseDraft, setExerciseDraft] = useState<StrengthSet[]>([]);

  function startEditMeta() {
    setMetaDate(session.date);
    setMetaProgramId(session.programId ?? '');
    setEditingMeta(true);
  }

  function saveMeta() {
    updateStrengthSession({ ...session, date: metaDate, programId: metaProgramId || undefined });
    setEditingMeta(false);
  }

  function startEditExercise(entry: StrengthExerciseEntry) {
    setEditingExerciseId(entry.id);
    setExerciseDraft(entry.sets.map((s) => ({ ...s })));
  }

  function updateDraftSet(setId: string, patch: Partial<StrengthSet>) {
    setExerciseDraft((sets) => sets.map((s) => (s.id === setId ? { ...s, ...patch } : s)));
  }

  function addDraftSet() {
    setExerciseDraft((sets) => [...sets, { id: uuid(), reps: 8, weightKg: 0 }]);
  }

  function removeDraftSet(setId: string) {
    setExerciseDraft((sets) => sets.filter((s) => s.id !== setId));
  }

  function saveExercise() {
    if (exerciseDraft.length === 0) return;
    updateStrengthSession({
      ...session,
      exercises: session.exercises.map((e) =>
        e.id === editingExerciseId ? { ...e, sets: exerciseDraft } : e,
      ),
    });
    setEditingExerciseId(null);
  }

  function removeExerciseFromSession(entryId: string) {
    if (session.exercises.length <= 1) {
      deleteStrengthSession(session.id);
      return;
    }
    updateStrengthSession({
      ...session,
      exercises: session.exercises.filter((e) => e.id !== entryId),
    });
  }

  return (
    <Card>
      <div className="flex justify-between items-start gap-2">
        {editingMeta ? (
          <div className="flex flex-wrap gap-1.5 items-center">
            <Input
              type="date"
              value={metaDate}
              onChange={(e) => setMetaDate(e.target.value)}
              className="w-36"
            />
            <select
              className={selectClassName}
              value={metaProgramId}
              onChange={(e) => setMetaProgramId(e.target.value)}
            >
              <option value="">Aucun programme</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <IconButton variant="secondary" onClick={saveMeta} title="Valider" aria-label="Valider">
              ✓
            </IconButton>
            <IconButton
              variant="secondary"
              onClick={() => setEditingMeta(false)}
              title="Annuler"
              aria-label="Annuler"
            >
              ✕
            </IconButton>
          </div>
        ) : (
          <h3 className="font-semibold">{session.date}</h3>
        )}
        <div className="flex gap-1.5 shrink-0">
          {!editingMeta && (
            <IconButton
              variant="secondary"
              onClick={startEditMeta}
              title="Modifier la date / le programme"
              aria-label="Modifier la date ou le programme"
            >
              📅
            </IconButton>
          )}
          <IconButton
            variant="danger"
            onClick={() => deleteStrengthSession(session.id)}
            title="Supprimer la séance"
            aria-label="Supprimer la séance"
          >
            ✕
          </IconButton>
        </div>
      </div>

      <div className="mt-1.5 space-y-1.5">
        {session.exercises.map((e) =>
          editingExerciseId === e.id ? (
            <div
              key={e.id}
              className="border border-indigo-200 dark:border-indigo-800 rounded-lg p-2 space-y-1"
            >
              <p className="text-sm font-medium">{e.exerciseName}</p>
              {exerciseDraft.map((s, i) => (
                <div key={s.id} className="flex items-center gap-2">
                  <span className="w-5 shrink-0 text-xs text-gray-400">#{i + 1}</span>
                  <Input
                    type="number"
                    min={0}
                    placeholder="Reps"
                    value={s.reps}
                    onChange={(ev) => updateDraftSet(s.id, { reps: Number(ev.target.value) })}
                  />
                  <Input
                    type="number"
                    min={0}
                    step={0.5}
                    placeholder="Poids kg"
                    value={s.weightKg === 0 ? '' : s.weightKg}
                    onChange={(ev) =>
                      updateDraftSet(s.id, {
                        weightKg: ev.target.value ? Number(ev.target.value) : 0,
                      })
                    }
                  />
                  <button
                    className="shrink-0 text-red-500 text-sm"
                    onClick={() => removeDraftSet(s.id)}
                  >
                    ✕
                  </button>
                </div>
              ))}
              <div className="flex gap-1.5 pt-1">
                <Button variant="secondary" onClick={addDraftSet}>
                  + Série
                </Button>
                <Button onClick={saveExercise}>Valider</Button>
                <Button variant="secondary" onClick={() => setEditingExerciseId(null)}>
                  Annuler
                </Button>
              </div>
            </div>
          ) : (
            <div key={e.id} className="flex justify-between items-start gap-2 text-sm">
              <div>
                <span className="font-medium">{e.exerciseName}: </span>
                {formatSetsSummary(e.sets)}
              </div>
              <div className="flex gap-1 shrink-0">
                <IconButton
                  variant="secondary"
                  onClick={() => startEditExercise(e)}
                  title={`Modifier ${e.exerciseName}`}
                  aria-label={`Modifier ${e.exerciseName}`}
                >
                  ✏️
                </IconButton>
                <IconButton
                  variant="danger"
                  onClick={() => removeExerciseFromSession(e.id)}
                  title={`Retirer ${e.exerciseName}`}
                  aria-label={`Retirer ${e.exerciseName}`}
                >
                  ✕
                </IconButton>
              </div>
            </div>
          ),
        )}
      </div>
    </Card>
  );
}

export default function Strength({ appData }: { appData: UseAppData }) {
  const { data, addStrengthSession, updateStrengthSession, deleteStrengthSession } = appData;
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

  function resetDraft() {
    setExercises([emptyExercise()]);
    setDate(todayIso());
    setProgramId('');
  }

  function submit() {
    const validExercises = exercises.filter((e) => e.exerciseName.trim() && e.sets.length > 0);
    if (validExercises.length === 0) return;
    addStrengthSession({
      date,
      programId: programId || undefined,
      exercises: validExercises,
    });
    resetDraft();
    setShowForm(false);
  }

  function toggleForm() {
    if (showForm) resetDraft();
    setShowForm((s) => !s);
  }

  const sortedSessions = [...data.strengthSessions].sort((a, b) => b.date.localeCompare(a.date));
  const selectedProgram = data.programs.find((p) => p.id === programId);

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Séances</h1>
        <Button onClick={toggleForm}>{showForm ? 'Annuler' : '+ Nouvelle séance'}</Button>
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

          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3 items-start">
            {exercises.map((ex) => {
              const suggestion = ex.exerciseName
                ? suggestNextStrength(data.strengthSessions, ex.exerciseName)
                : null;
              const lastPerformance = ex.exerciseName
                ? getLastPerformance(data.strengthSessions, ex.exerciseName)
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

                  {lastPerformance && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Dernière fois ({lastPerformance.date}): {formatSetsSummary(lastPerformance.sets)}
                    </p>
                  )}

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
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3 items-start">
          {sortedSessions.map((s) => (
            <SessionCard
              key={s.id}
              session={s}
              programs={data.programs}
              updateStrengthSession={updateStrengthSession}
              deleteStrengthSession={deleteStrengthSession}
            />
          ))}
        </div>
      )}
    </div>
  );
}
