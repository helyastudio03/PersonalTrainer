import { useMemo, useState } from 'react';
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
import {
  formatMonthLabel,
  formatRepRange,
  formatSetsSummary,
  getLastPerformance,
  groupSessionsIntoCycleRows,
  monthKey,
} from '../lib/records';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function emptyExercise(): StrengthExerciseEntry {
  return {
    id: uuid(),
    exerciseName: '',
    sets: [],
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
  'px-3 py-1.5 rounded-lg border border-ash-600 bg-ash-950 text-sm';

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
  const [metaName, setMetaName] = useState(session.name ?? '');
  const [metaProgramId, setMetaProgramId] = useState(session.programId ?? '');
  const [metaNotes, setMetaNotes] = useState(session.notes ?? '');

  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null);
  const [exerciseDraft, setExerciseDraft] = useState<StrengthSet[]>([]);

  function startEditMeta() {
    setMetaDate(session.date);
    setMetaName(session.name ?? '');
    setMetaProgramId(session.programId ?? '');
    setMetaNotes(session.notes ?? '');
    setEditingMeta(true);
  }

  function saveMeta() {
    updateStrengthSession({
      ...session,
      date: metaDate,
      name: metaName.trim() || undefined,
      programId: metaProgramId || undefined,
      notes: metaNotes.trim() || undefined,
    });
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
      <div className="group flex justify-between items-start gap-2">
        {editingMeta ? (
          <div className="flex-1 space-y-1.5">
            <div className="flex flex-wrap gap-1.5 items-center">
              <Input
                value={metaName}
                onChange={(e) => setMetaName(e.target.value)}
                placeholder="Nom (ex: Upper 1)"
                className="w-32"
              />
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
              <IconButton
                variant="secondary"
                hoverOnly={false}
                onClick={saveMeta}
                title="Valider"
                aria-label="Valider"
              >
                ✓
              </IconButton>
              <IconButton
                variant="secondary"
                hoverOnly={false}
                onClick={() => setEditingMeta(false)}
                title="Annuler"
                aria-label="Annuler"
              >
                ✕
              </IconButton>
            </div>
            <Input
              value={metaNotes}
              onChange={(e) => setMetaNotes(e.target.value)}
              placeholder="Notes (optionnel): fatigue, douleur, ressenti..."
            />
          </div>
        ) : (
          <div>
            <h3 className="font-semibold">
              {session.name ? `${session.name} · ${session.date}` : session.date}
            </h3>
            {session.notes && (
              <p className="text-xs text-ash-300 italic mt-0.5">{session.notes}</p>
            )}
          </div>
        )}
        <div className="flex gap-1.5 shrink-0">
          {!editingMeta && (
            <IconButton
              variant="secondary"
              onClick={startEditMeta}
              title="Modifier la date / le programme / les notes"
              aria-label="Modifier la date, le programme ou les notes"
            >
              ✏️
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

      <div className="mt-1.5 space-y-0.5">
        {session.exercises.map((e) =>
          editingExerciseId === e.id ? (
            <div
              key={e.id}
              className="border border-ember-800 rounded-lg p-2 space-y-1"
            >
              <p className="text-sm font-medium">{e.exerciseName}</p>
              {exerciseDraft.map((s, i) => (
                <div key={s.id} className="flex items-center gap-2">
                  <span className="w-5 shrink-0 text-xs text-ash-400">#{i + 1}</span>
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
                    className="shrink-0 text-red-400 text-sm"
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
            <div key={e.id} className="group relative text-sm">
              <div
                className="whitespace-nowrap overflow-hidden text-ellipsis pr-0 group-hover:pr-14 transition-[padding-right]"
                title={`${e.exerciseName}: ${formatSetsSummary(e.sets)}`}
              >
                <span className="text-ash-400">{e.exerciseName}</span>: {formatSetsSummary(e.sets)}
              </div>
              <div className="absolute right-0 top-0 flex gap-1">
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
  const { data, addStrengthSession, updateStrengthSession, deleteStrengthSession, clearStrengthSessions } =
    appData;
  const [date, setDate] = useState(todayIso());
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [programId, setProgramId] = useState('');
  const [exercises, setExercises] = useState<StrengthExerciseEntry[]>([emptyExercise()]);
  const [showForm, setShowForm] = useState(false);
  const [confirmingClear, setConfirmingClear] = useState(false);

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
          ? { ...e, sets: [...e.sets, { id: uuid(), reps: 0, weightKg: 0 }] }
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
    setName('');
    setNotes('');
    setProgramId('');
  }

  function submit() {
    const validExercises = exercises.filter((e) => e.exerciseName.trim() && e.sets.length > 0);
    if (validExercises.length === 0) return;
    addStrengthSession({
      date,
      name: name.trim() || undefined,
      notes: notes.trim() || undefined,
      programId: programId || undefined,
      exercises: validExercises,
    });
    resetDraft();
    setShowForm(false);
  }

  function toggleForm() {
    if (showForm) {
      resetDraft();
      setShowForm(false);
    } else {
      if (data.activeProgramId) setProgramId(data.activeProgramId);
      setShowForm(true);
    }
  }

  function clearHistory() {
    clearStrengthSessions();
    setConfirmingClear(false);
  }

  const sortedSessions = [...data.strengthSessions].sort((a, b) => b.date.localeCompare(a.date));
  const selectedProgram = data.programs.find((p) => p.id === programId);

  const monthGroups = useMemo(() => {
    const chronological = [...data.strengthSessions].sort((a, b) => a.date.localeCompare(b.date));
    const rows = groupSessionsIntoCycleRows(chronological, data.programs);

    const byMonth = new Map<string, StrengthSession[][]>();
    for (const row of rows) {
      const key = monthKey(row[0].date);
      const list = byMonth.get(key);
      if (list) list.push(row);
      else byMonth.set(key, [row]);
    }
    return [...byMonth.entries()]
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([key, monthRows]) => ({
        key,
        label: formatMonthLabel(monthRows[0][0].date),
        rows: [...monthRows].reverse(),
      }));
  }, [data.strengthSessions, data.programs]);

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Séances</h1>
        <div className="flex gap-2">
          {sortedSessions.length > 0 &&
            (confirmingClear ? (
              <>
                <span className="text-sm text-ash-300 self-center">Tout supprimer ?</span>
                <Button variant="danger" onClick={clearHistory}>
                  Confirmer
                </Button>
                <Button variant="secondary" onClick={() => setConfirmingClear(false)}>
                  Annuler
                </Button>
              </>
            ) : (
              <Button variant="danger" onClick={() => setConfirmingClear(true)}>
                Supprimer l'historique
              </Button>
            ))}
          <Button onClick={toggleForm}>{showForm ? 'Annuler' : '+ Nouvelle séance'}</Button>
        </div>
      </div>

      {showForm && (
        <Card className="space-y-3">
          <h2 className="text-sm font-semibold text-ash-300">Nouvelle séance</h2>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label>Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <Label>Nom (optionnel)</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="ex: Upper 1" />
            </div>
            <div>
              <Label>Programme (optionnel)</Label>
              <select
                className="w-full px-3 py-1.5 rounded-lg border border-ash-600 bg-ash-950 text-sm"
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

          <div>
            <Label>Notes (optionnel)</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="fatigue, douleur, ressenti..."
            />
          </div>

          {selectedProgram && selectedProgram.strengthTargets.length > 0 && (
            <div className="border border-ember-900 bg-ember-950/40 rounded-lg p-2 space-y-2">
              <p className="text-xs font-semibold text-ember-300">
                Exercices de "{selectedProgram.name}"
              </p>
              {selectedProgram.days.map((day) => {
                const dayTargets = selectedProgram.strengthTargets.filter((t) => t.dayId === day.id);
                if (dayTargets.length === 0) return null;
                return (
                  <div key={day.id}>
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-xs text-ember-400/70">{day.name}</p>
                      <button
                        type="button"
                        className="text-xs text-ember-400 hover:underline"
                        onClick={() => dayTargets.forEach((t) => addExerciseFromTarget(t))}
                      >
                        + Tout ajouter
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {dayTargets.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => addExerciseFromTarget(t)}
                          className="text-xs px-2 py-1 rounded-full border border-ember-700 text-ember-300 hover:bg-ember-900"
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
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-semibold">Exercices</h3>
              <Button variant="secondary" onClick={addExercise}>
                + Exercice
              </Button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 items-start">
              {exercises.map((ex) => {
                const lastPerformance = ex.exerciseName
                  ? getLastPerformance(data.strengthSessions, ex.exerciseName)
                  : null;
                return (
                  <div key={ex.id} className="border border-ash-700 rounded-lg p-2">
                    <div className="flex gap-2 items-center mb-1.5">
                      <Input
                        placeholder="Nom de l'exercice (ex: Squat)"
                        value={ex.exerciseName}
                        onChange={(e) => updateExercise(ex.id, e.target.value)}
                      />
                      <button className="text-red-400 text-sm shrink-0" onClick={() => removeExercise(ex.id)}>
                        ✕
                      </button>
                    </div>

                    <div className="space-y-1">
                      {ex.sets.map((s, i) => {
                        const lastSet = lastPerformance?.sets[i];
                        return (
                          <div key={s.id} className="flex items-center gap-2">
                            <span className="w-5 shrink-0 text-xs text-ash-400">#{i + 1}</span>
                            <Input
                              type="number"
                              min={0}
                              placeholder={lastSet ? `${lastSet.reps}` : 'Reps'}
                              value={s.reps === 0 ? '' : s.reps}
                              onChange={(e) =>
                                updateSet(ex.id, s.id, {
                                  reps: e.target.value ? Number(e.target.value) : 0,
                                })
                              }
                            />
                            <Input
                              type="number"
                              min={0}
                              step={0.5}
                              placeholder={lastSet ? `${lastSet.weightKg} kg` : 'Poids kg'}
                              value={s.weightKg === 0 ? '' : s.weightKg}
                              onChange={(e) =>
                                updateSet(ex.id, s.id, {
                                  weightKg: e.target.value ? Number(e.target.value) : 0,
                                })
                              }
                            />
                            <button
                              className="shrink-0 text-red-400 text-sm"
                              onClick={() => removeSet(ex.id, s.id)}
                            >
                              ✕
                            </button>
                          </div>
                        );
                      })}
                    </div>
                    <Button variant="secondary" className="mt-1.5" onClick={() => addSet(ex.id)}>
                      + Série
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>

          <Button onClick={submit}>Enregistrer la séance</Button>
        </Card>
      )}

      {sortedSessions.length === 0 ? (
        <EmptyState>Aucune séance de musculation enregistrée.</EmptyState>
      ) : (
        <>
          <p className="text-xs text-ash-400">Format des séries : poids (kg) × répétitions</p>
          <div className="space-y-4">
            {monthGroups.map((group) => (
              <div key={group.key} className="space-y-2">
                <h2 className="text-sm font-semibold text-ash-300 uppercase tracking-wide border-b border-ash-800 pb-1">
                  {group.label}
                </h2>
                <div className="space-y-2">
                  {group.rows.map((row) => (
                    <div key={row[0].id} className="overflow-x-auto pb-1">
                      <div
                        className="grid gap-2 items-start"
                        style={{ gridTemplateColumns: `repeat(${row.length}, minmax(240px, 1fr))` }}
                      >
                        {row.map((s) => (
                          <SessionCard
                            key={s.id}
                            session={s}
                            programs={data.programs}
                            updateStrengthSession={updateStrengthSession}
                            deleteStrengthSession={deleteStrengthSession}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
