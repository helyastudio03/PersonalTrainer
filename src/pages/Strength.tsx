import { useMemo, useState } from 'react';
import { v4 as uuid } from 'uuid';
import type { UseAppData } from '../lib/useAppData';
import type {
  MuscleGroup,
  Program,
  ProgramExerciseTarget,
  StrengthExerciseEntry,
  StrengthSession,
  StrengthSet,
} from '../types';
import { Button, Card, EmptyState, IconButton, Input, Label, RECORD_COLOR, RecordStar } from '../components/ui';
import {
  formatMonthLabel,
  formatRepRange,
  formatSetsSummary,
  getExerciseMuscleGroups,
  getLastPerformance,
  getRecordsByExerciseDate,
  groupSessionsIntoCycleRows,
  monthKey,
  suggestNextProgramDay,
} from '../lib/records';
import type { WeightRepsRecord } from '../lib/records';
import { getMuscleGroupColor } from '../lib/muscleColors';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

// Normalise un nom d'exercice pour comparaison (casse, espaces multiples,
// espaces en bord) afin d'éviter de traiter "développé couché" et
// "Développé  couché" comme deux exercices différents.
function normalizeExerciseName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
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
  'px-3 py-1.5 rounded-lg border border-ash-300 bg-white text-sm';

function chipClassName(active: boolean) {
  return `text-xs px-2 py-1 rounded-full border transition-colors ${
    active
      ? 'bg-ember-600 text-ash-100 border-transparent'
      : 'border-ash-300 text-ash-700 hover:bg-ash-100'
  }`;
}

function SessionCard({
  session,
  programs,
  exerciseMuscleGroups,
  recordsByExerciseDate,
  updateStrengthSession,
  deleteStrengthSession,
  onDuplicate,
}: {
  session: StrengthSession;
  programs: Program[];
  exerciseMuscleGroups: Record<string, MuscleGroup>;
  recordsByExerciseDate: Map<string, WeightRepsRecord[]>;
  updateStrengthSession: UseAppData['updateStrengthSession'];
  deleteStrengthSession: UseAppData['deleteStrengthSession'];
  onDuplicate: (session: StrengthSession) => void;
}) {
  const [editingMeta, setEditingMeta] = useState(false);
  const [metaDate, setMetaDate] = useState(session.date);
  const [metaName, setMetaName] = useState(session.name ?? '');
  const [metaProgramId, setMetaProgramId] = useState(session.programId ?? '');
  const [metaNotes, setMetaNotes] = useState(session.notes ?? '');

  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null);
  const [exerciseDraft, setExerciseDraft] = useState<StrengthSet[]>([]);
  const [exerciseNotesDraft, setExerciseNotesDraft] = useState('');
  const [confirmingDelete, setConfirmingDelete] = useState(false);

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
    setExerciseNotesDraft(entry.notes ?? '');
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
        e.id === editingExerciseId
          ? { ...e, sets: exerciseDraft, notes: exerciseNotesDraft.trim() || undefined }
          : e,
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
              {(() => {
                const programName = session.programId
                  ? (programs.find((p) => p.id === session.programId)?.name ?? 'programme supprimé')
                  : undefined;
                const parts = [programName, session.name, session.date].filter(
                  (part): part is string => !!part,
                );
                return parts.join(' · ');
              })()}
            </h3>
            {session.notes && (
              <p className="text-xs text-ash-600 italic mt-0.5">{session.notes}</p>
            )}
          </div>
        )}
        <div className="flex gap-1.5 shrink-0 items-center">
          {confirmingDelete ? (
            <>
              <span className="text-xs text-ash-600">Supprimer ?</span>
              <Button variant="danger" onClick={() => deleteStrengthSession(session.id)}>
                Confirmer
              </Button>
              <Button variant="secondary" onClick={() => setConfirmingDelete(false)}>
                Annuler
              </Button>
            </>
          ) : (
            <>
              {!editingMeta && (
                <>
                  <IconButton
                    variant="secondary"
                    onClick={() => onDuplicate(session)}
                    title="Dupliquer la séance"
                    aria-label="Dupliquer la séance"
                  >
                    ⧉
                  </IconButton>
                  <IconButton
                    variant="secondary"
                    onClick={startEditMeta}
                    title="Modifier la date / le programme / les notes"
                    aria-label="Modifier la date, le programme ou les notes"
                  >
                    ✏️
                  </IconButton>
                </>
              )}
              <IconButton
                variant="danger"
                onClick={() => setConfirmingDelete(true)}
                title="Supprimer la séance"
                aria-label="Supprimer la séance"
              >
                ✕
              </IconButton>
            </>
          )}
        </div>
      </div>

      <div className="mt-1.5 grid grid-cols-[auto_minmax(4rem,auto)_1fr_auto] gap-x-2 gap-y-0.5">
        {session.exercises.map((e) =>
          editingExerciseId === e.id ? (
            <div
              key={e.id}
              className="col-span-4 border border-ember-300 rounded-lg p-2 space-y-1"
            >
              <p className="text-sm font-medium">{e.exerciseName}</p>
              {exerciseDraft.map((s, i) => (
                <div key={s.id} className="flex items-center gap-2">
                  <span className="w-5 shrink-0 text-xs text-ash-500">#{i + 1}</span>
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
                    className="shrink-0 text-red-600 text-sm"
                    onClick={() => removeDraftSet(s.id)}
                  >
                    ✕
                  </button>
                </div>
              ))}
              <Input
                value={exerciseNotesDraft}
                onChange={(ev) => setExerciseNotesDraft(ev.target.value)}
                placeholder="Ressenti (optionnel): douleur, facile, dur..."
              />
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
            <div key={e.id} className="contents group">
              <span
                className="w-1 rounded-full self-stretch shrink-0"
                style={{ backgroundColor: getMuscleGroupColor(exerciseMuscleGroups[e.exerciseName]) }}
                title={exerciseMuscleGroups[e.exerciseName]}
              />
              <span className="text-sm text-ash-500 truncate">
                {e.exerciseName}
                {e.variantOf && (
                  <span className="text-ash-400 italic"> (var. de {e.variantOf})</span>
                )}
              </span>
              <div className="relative text-sm">
                <div
                  className="whitespace-nowrap overflow-hidden text-ellipsis pr-14"
                  title={`${e.exerciseName}: ${formatSetsSummary(e.sets)}${e.notes ? ` — ${e.notes}` : ''}`}
                >
                  {formatSetsSummary(e.sets)}
                  {e.notes && <span className="text-ash-500 italic"> — {e.notes}</span>}
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
              {(() => {
                const records = recordsByExerciseDate.get(`${e.exerciseName}__${session.date}`) ?? [];
                if (records.length === 0) return <span />;
                const tooltip = records
                  .map((r) => `${r.weightKg}kg : ${r.previousMaxReps}→${r.maxReps} reps`)
                  .join('\n');
                return (
                  <span
                    className="text-xs shrink-0 flex items-center gap-0.5 p-1.5 -m-1.5 cursor-help"
                    style={{ color: RECORD_COLOR }}
                    title={tooltip}
                  >
                    {records.length > 1 ? records.length : ''}
                    <RecordStar />
                  </span>
                );
              })()}
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
  const exerciseMuscleGroups = useMemo(
    () => getExerciseMuscleGroups(data.programs),
    [data.programs],
  );
  const recordsByExerciseDate = useMemo(
    () => getRecordsByExerciseDate(data.strengthSessions),
    [data.strengthSessions],
  );
  const [programFilter, setProgramFilter] = useState<string[]>([]);
  const [variantPromptId, setVariantPromptId] = useState<string | null>(null);
  const [variantSelectDraft, setVariantSelectDraft] = useState('');

  function toggleProgramFilter(id: string) {
    setProgramFilter((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  }

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

  function updateExerciseNotes(id: string, notes: string) {
    setExercises((ex) => ex.map((e) => (e.id === id ? { ...e, notes } : e)));
  }

  function updateExerciseVariantOf(id: string, variantOf: string | undefined) {
    setExercises((ex) => ex.map((e) => (e.id === id ? { ...e, variantOf } : e)));
  }

  function openVariantPrompt(exerciseId: string, defaultValue: string) {
    setVariantPromptId(exerciseId);
    setVariantSelectDraft(defaultValue);
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

  function cancelForm() {
    resetDraft();
    setShowForm(false);
  }

  function startSuggestedSession() {
    resetDraft();
    const activeProgram = data.programs.find((p) => p.id === data.activeProgramId);
    if (activeProgram) {
      setProgramId(activeProgram.id);
      const suggested = suggestNextProgramDay(activeProgram, data.strengthSessions);
      if (suggested) {
        setName(suggested.name);
        const dayTargets = activeProgram.strengthTargets.filter((t) => t.dayId === suggested.id);
        if (dayTargets.length > 0) {
          setExercises(dayTargets.map((t) => exerciseFromTarget(t)));
        }
      }
    }
    setShowForm(true);
  }

  function startBlankSession() {
    resetDraft();
    setShowForm(true);
  }

  function clearHistory() {
    clearStrengthSessions();
    setConfirmingClear(false);
  }

  function duplicateSession(session: StrengthSession) {
    setDate(todayIso());
    setName(session.name ?? '');
    setNotes('');
    setProgramId(session.programId ?? '');
    setExercises(
      session.exercises.map((e) => ({
        id: uuid(),
        exerciseName: e.exerciseName,
        sets: e.sets.map((s) => ({ id: uuid(), reps: s.reps, weightKg: s.weightKg })),
        variantOf: e.variantOf,
      })),
    );
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const sortedSessions = [...data.strengthSessions].sort((a, b) => b.date.localeCompare(a.date));
  const selectedProgram = data.programs.find((p) => p.id === programId);

  const usedProgramIds = useMemo(
    () => [...new Set(data.strengthSessions.map((s) => s.programId).filter(Boolean))] as string[],
    [data.strengthSessions],
  );
  const filterablePrograms = data.programs.filter((p) => usedProgramIds.includes(p.id));

  const filteredHistory = useMemo(() => {
    if (programFilter.length === 0) return data.strengthSessions;
    return data.strengthSessions.filter((s) => s.programId && programFilter.includes(s.programId));
  }, [data.strengthSessions, programFilter]);

  const monthGroups = useMemo(() => {
    const chronological = [...filteredHistory].sort((a, b) => a.date.localeCompare(b.date));
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
  }, [filteredHistory, data.programs]);

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Séances</h1>
        <div className="flex gap-2">
          {sortedSessions.length > 0 &&
            (confirmingClear ? (
              <>
                <span className="text-sm text-ash-600 self-center">Tout supprimer ?</span>
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
          {showForm ? (
            <Button onClick={cancelForm}>Annuler</Button>
          ) : (
            <>
              <Button variant="secondary" onClick={startBlankSession}>
                + Séance vierge
              </Button>
              <Button onClick={startSuggestedSession}>+ Nouvelle séance</Button>
            </>
          )}
        </div>
      </div>

      {showForm && (
        <Card className="space-y-3">
          <h2 className="text-sm font-semibold text-ash-600">Nouvelle séance</h2>
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
                className="w-full px-3 py-1.5 rounded-lg border border-ash-300 bg-white text-sm"
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
            <div className="border border-ember-200 bg-ember-50 rounded-lg p-2 space-y-2">
              <p className="text-xs font-semibold text-ember-700">
                Exercices de "{selectedProgram.name}"
              </p>
              {selectedProgram.days.map((day) => {
                const dayTargets = selectedProgram.strengthTargets.filter((t) => t.dayId === day.id);
                if (dayTargets.length === 0) return null;
                return (
                  <div key={day.id}>
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-xs text-ember-600/70">{day.name}</p>
                      <button
                        type="button"
                        className="text-xs text-ember-600 hover:underline"
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
                          className="text-xs px-2 py-1 rounded-full border border-ember-300 text-ember-700 hover:bg-ember-100"
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
                const otherNames = [
                  ...new Set(
                    exercises
                      .filter((other) => other.id !== ex.id && other.exerciseName.trim())
                      .map((other) => other.exerciseName),
                  ),
                ];
                const trimmedName = ex.exerciseName.trim();
                const normalizedName = normalizeExerciseName(ex.exerciseName);
                const isOffProgram =
                  !!selectedProgram &&
                  !!trimmedName &&
                  !selectedProgram.strengthTargets.some(
                    (t) => normalizeExerciseName(t.exerciseName) === normalizedName,
                  );
                return (
                  <div key={ex.id} className="border border-ash-200 rounded-lg p-2">
                    <div className="flex gap-2 items-center mb-1.5">
                      <Input
                        placeholder="Nom de l'exercice (ex: Squat)"
                        value={ex.exerciseName}
                        onChange={(e) => updateExercise(ex.id, e.target.value)}
                      />
                      <button className="text-red-600 text-sm shrink-0" onClick={() => removeExercise(ex.id)}>
                        ✕
                      </button>
                    </div>

                    {isOffProgram && otherNames.length > 0 && (
                      <div className="mb-1.5 text-xs">
                        {ex.variantOf ? (
                          <div className="flex items-center gap-1.5 text-ash-600">
                            <span>
                              ↳ Variante de <span className="font-medium">{ex.variantOf}</span>
                            </span>
                            <button
                              type="button"
                              className="text-ember-600 hover:underline"
                              onClick={() => openVariantPrompt(ex.id, ex.variantOf!)}
                            >
                              modifier
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openVariantPrompt(ex.id, otherNames[0])}
                            className="text-amber-700 bg-amber-100 rounded px-1.5 py-0.5 hover:bg-amber-200"
                          >
                            ⚠️ Hors programme — variante ?
                          </button>
                        )}
                      </div>
                    )}

                    <div className="space-y-1">
                      {ex.sets.map((s, i) => {
                        const lastSet = lastPerformance?.sets[i];
                        return (
                          <div key={s.id} className="flex items-center gap-2">
                            <span className="w-5 shrink-0 text-xs text-ash-500">#{i + 1}</span>
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
                              className="shrink-0 text-red-600 text-sm"
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
                    <Input
                      className="mt-1.5"
                      value={ex.notes ?? ''}
                      onChange={(e) => updateExerciseNotes(ex.id, e.target.value)}
                      placeholder="Ressenti (optionnel): douleur, facile, dur..."
                    />
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
          {filterablePrograms.length > 1 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-semibold text-ash-600">Filtrer par programme :</span>
              {filterablePrograms.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggleProgramFilter(p.id)}
                  className={chipClassName(programFilter.includes(p.id))}
                >
                  {p.name}
                </button>
              ))}
              {programFilter.length > 0 && (
                <button
                  type="button"
                  onClick={() => setProgramFilter([])}
                  className="text-xs text-ash-500 hover:underline"
                >
                  Réinitialiser
                </button>
              )}
            </div>
          )}
          <p className="text-xs text-ash-500">Format des séries : poids (kg) × répétitions</p>
          {monthGroups.length === 0 ? (
            <EmptyState>Aucune séance pour ce filtre.</EmptyState>
          ) : (
          <div className="space-y-4">
            {monthGroups.map((group) => (
              <div key={group.key} className="space-y-2">
                <h2 className="text-sm font-semibold text-ash-600 uppercase tracking-wide border-b border-ash-200 pb-1">
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
                            exerciseMuscleGroups={exerciseMuscleGroups}
                            recordsByExerciseDate={recordsByExerciseDate}
                            updateStrengthSession={updateStrengthSession}
                            deleteStrengthSession={deleteStrengthSession}
                            onDuplicate={duplicateSession}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          )}
        </>
      )}

      {variantPromptId &&
        (() => {
          const ex = exercises.find((e) => e.id === variantPromptId);
          if (!ex) return null;
          const otherNames = [
            ...new Set(
              exercises
                .filter((other) => other.id !== ex.id && other.exerciseName.trim())
                .map((other) => other.exerciseName),
            ),
          ];
          return (
            <div
              className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4"
              onClick={() => setVariantPromptId(null)}
            >
              <div
                className="bg-white rounded-lg p-3 max-w-sm w-full shadow-lg space-y-2"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-sm font-semibold">
                  "{ex.exerciseName}" n'est pas dans le programme
                </h3>
                <p className="text-xs text-ash-600">Est-ce une variante d'un exercice prévu ?</p>
                <select
                  className="w-full px-2 py-1.5 rounded-lg border border-ash-300 bg-white text-sm"
                  value={variantSelectDraft}
                  onChange={(e) => setVariantSelectDraft(e.target.value)}
                >
                  {otherNames.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2 pt-1">
                  <Button
                    onClick={() => {
                      updateExerciseVariantOf(ex.id, variantSelectDraft);
                      setVariantPromptId(null);
                    }}
                  >
                    Valider
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      updateExerciseVariantOf(ex.id, undefined);
                      setVariantPromptId(null);
                    }}
                  >
                    Ce n'est pas une variante
                  </Button>
                </div>
              </div>
            </div>
          );
        })()}
    </div>
  );
}
