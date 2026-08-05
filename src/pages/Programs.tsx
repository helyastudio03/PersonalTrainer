import { useMemo, useState } from 'react';
import { v4 as uuid } from 'uuid';
import type { UseAppData } from '../lib/useAppData';
import type { MuscleGroup, Program, ProgramDay, ProgramExerciseTarget } from '../types';
import { MUSCLE_GROUPS } from '../types';
import { Button, Card, EmptyState, IconButton, Input, Label } from '../components/ui';
import {
  formatRepRange,
  formatSetsSummary,
  getExerciseVariants,
  getWeeklySetsByMuscleGroup,
  listAllExerciseNames,
} from '../lib/records';
import { generateFakeSessions } from '../lib/fakeData';
import { getMuscleGroupColor } from '../lib/muscleColors';

const EXERCISE_DATALIST_ID = 'known-exercise-names';

function emptyDraft(): Omit<Program, 'id' | 'createdAt'> {
  const firstDay: ProgramDay = { id: uuid(), name: 'Jour 1' };
  return { name: '', description: '', days: [firstDay], strengthTargets: [] };
}

function VolumeChart({
  strengthTargets,
  highlightedGroup,
  onToggleGroup,
}: {
  strengthTargets: ProgramExerciseTarget[];
  highlightedGroup?: MuscleGroup | null;
  onToggleGroup?: (mg: MuscleGroup) => void;
}) {
  const volumes = getWeeklySetsByMuscleGroup(strengthTargets);
  if (volumes.length === 0) return null;
  return (
    <div>
      <p className="text-xs font-semibold text-ash-600 mb-1.5">Nombre de séries par semaine</p>
      <div className="flex flex-wrap gap-1.5">
        {volumes.map((v) => {
          const active = highlightedGroup === v.muscleGroup;
          return (
            <button
              key={v.muscleGroup}
              type="button"
              onClick={() => onToggleGroup?.(v.muscleGroup)}
              className={`text-xs rounded-full pl-1.5 pr-2 py-1 flex items-center gap-1.5 transition-colors ${
                active ? 'bg-ash-300 text-ash-800' : 'bg-ash-200 text-ash-700 hover:bg-ash-300'
              }`}
            >
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: getMuscleGroupColor(v.muscleGroup) }}
              />
              {v.muscleGroup} <span className="font-semibold">{v.weeklySets}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ProgramCard({
  program,
  isActive,
  exerciseVariants,
  onToggleActive,
  onEdit,
  onDelete,
  onDuplicate,
  onGenerateFakeHistory,
  onOpenVariantsPopup,
}: {
  program: Program;
  isActive: boolean;
  exerciseVariants: Map<string, { variantName: string; date: string; sets: { reps: number; weightKg: number }[] }[]>;
  onToggleActive: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onGenerateFakeHistory: () => void;
  onOpenVariantsPopup: (exerciseName: string) => void;
}) {
  const [highlightedGroup, setHighlightedGroup] = useState<MuscleGroup | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function toggleHighlight(mg: MuscleGroup) {
    setHighlightedGroup((prev) => (prev === mg ? null : mg));
  }

  return (
    <Card className="group space-y-2">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold flex items-center gap-1.5">
            {program.name}
            {isActive && (
              <span className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-ember-100 text-ember-700">
                Actif
              </span>
            )}
          </h3>
          {program.description && <p className="text-sm text-ash-600">{program.description}</p>}
        </div>
        <div className="flex gap-1.5 shrink-0 items-center">
          {confirmingDelete ? (
            <>
              <span className="text-xs text-ash-600">Supprimer ?</span>
              <Button variant="danger" onClick={onDelete}>
                Confirmer
              </Button>
              <Button variant="secondary" onClick={() => setConfirmingDelete(false)}>
                Annuler
              </Button>
            </>
          ) : (
            <>
              <IconButton
                variant="secondary"
                onClick={onToggleActive}
                hoverOnly={!isActive}
                title={isActive ? 'Retirer comme programme actif' : 'Définir comme programme actif'}
                aria-label={isActive ? 'Retirer comme programme actif' : 'Définir comme programme actif'}
              >
                {isActive ? '⭐' : '☆'}
              </IconButton>
              <IconButton
                variant="secondary"
                onClick={onDuplicate}
                title="Dupliquer le programme"
                aria-label="Dupliquer le programme"
              >
                ⧉
              </IconButton>
              <IconButton variant="secondary" onClick={onEdit} title="Modifier" aria-label="Modifier">
                ✏️
              </IconButton>
              <IconButton
                variant="danger"
                onClick={() => setConfirmingDelete(true)}
                title="Supprimer"
                aria-label="Supprimer"
              >
                ✕
              </IconButton>
            </>
          )}
        </div>
      </div>

      {program.strengthTargets.length > 0 && (
        <button
          type="button"
          onClick={onGenerateFakeHistory}
          className="text-xs text-ember-600 hover:underline"
        >
          🧪 Générer un historique fictif (test des visualisations)
        </button>
      )}

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 items-start">
        {program.days.map((day) => {
          const dayTargets = program.strengthTargets.filter((t) => t.dayId === day.id);
          if (dayTargets.length === 0) return null;
          return (
            <div key={day.id} className="border border-ash-200 rounded-lg p-2">
              <p className="text-xs font-semibold text-ash-600 mb-1">{day.name}</p>
              <ul className="text-sm grid grid-cols-[auto_1fr_auto] gap-x-2 gap-y-0.5">
                {dayTargets.map((t) => {
                  const variants = exerciseVariants.get(t.exerciseName);
                  const dimmed = highlightedGroup !== null && highlightedGroup !== t.muscleGroup;
                  return (
                    <li key={t.id} className="contents">
                      <span
                        className="w-1 rounded-full self-stretch shrink-0 transition-opacity"
                        style={{
                          backgroundColor: getMuscleGroupColor(t.muscleGroup),
                          opacity: dimmed ? 0.25 : 1,
                        }}
                        title={t.muscleGroup}
                      />
                      <span
                        className={`min-w-0 flex items-center gap-1 transition-opacity ${
                          dimmed ? 'opacity-40' : ''
                        } text-ash-500`}
                      >
                        <span className="truncate">{t.exerciseName}</span>
                        {variants && variants.length > 0 && (
                          <button
                            type="button"
                            onClick={() => onOpenVariantsPopup(t.exerciseName)}
                            title="Voir les variantes réalisées"
                            className="shrink-0 text-ember-600"
                          >
                            🔀 {variants.length}
                          </button>
                        )}
                      </span>
                      <span
                        className={`whitespace-nowrap transition-opacity ${dimmed ? 'opacity-40' : ''}`}
                      >
                        {t.targetSets}×{formatRepRange(t.targetRepsMin, t.targetRepsMax)}
                        {t.targetRIR !== undefined ? ` @ RIR ${t.targetRIR}` : ''}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>

      <VolumeChart
        strengthTargets={program.strengthTargets}
        highlightedGroup={highlightedGroup}
        onToggleGroup={toggleHighlight}
      />
    </Card>
  );
}

export default function Programs({ appData }: { appData: UseAppData }) {
  const { data, addProgram, updateProgram, deleteProgram, setActiveProgram, addStrengthSession } = appData;
  const [draft, setDraft] = useState(emptyDraft());
  const [showForm, setShowForm] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [variantsPopup, setVariantsPopup] = useState<string | null>(null);

  const knownExerciseNames = useMemo(
    () => listAllExerciseNames(data.programs, data.strengthSessions),
    [data.programs, data.strengthSessions],
  );
  const exerciseVariants = useMemo(
    () => getExerciseVariants(data.strengthSessions),
    [data.strengthSessions],
  );

  function startCreate() {
    setEditingProgram(null);
    setDraft(emptyDraft());
    setShowForm(true);
  }

  function startEdit(program: Program) {
    setEditingProgram(program);
    setDraft({
      name: program.name,
      description: program.description ?? '',
      days: program.days,
      strengthTargets: program.strengthTargets,
    });
    setShowForm(true);
  }

  function cancelForm() {
    setEditingProgram(null);
    setDraft(emptyDraft());
    setShowForm(false);
  }

  function generateFakeHistory(program: Program) {
    const sessions = generateFakeSessions(program);
    sessions.forEach((session) => addStrengthSession(session));
  }

  function duplicateProgram(program: Program) {
    const dayIdMap = new Map(program.days.map((d) => [d.id, uuid()]));
    addProgram({
      name: `${program.name} (copie)`,
      description: program.description,
      days: program.days.map((d) => ({ ...d, id: dayIdMap.get(d.id)! })),
      strengthTargets: program.strengthTargets.map((t) => ({
        ...t,
        id: uuid(),
        dayId: dayIdMap.get(t.dayId)!,
      })),
    });
  }

  function addDay() {
    setDraft((d) => ({
      ...d,
      days: [...d.days, { id: uuid(), name: `Jour ${d.days.length + 1}` }],
    }));
  }

  function updateDayName(dayId: string, name: string) {
    setDraft((d) => ({
      ...d,
      days: d.days.map((day) => (day.id === dayId ? { ...day, name } : day)),
    }));
  }

  function removeDay(dayId: string) {
    setDraft((d) => ({
      ...d,
      days: d.days.filter((day) => day.id !== dayId),
      strengthTargets: d.strengthTargets.filter((t) => t.dayId !== dayId),
    }));
  }

  function addStrengthTarget(dayId: string) {
    const target: ProgramExerciseTarget = {
      id: uuid(),
      dayId,
      exerciseName: '',
      muscleGroup: MUSCLE_GROUPS[0],
      targetSets: 3,
      targetRepsMin: 6,
      targetRepsMax: 8,
    };
    setDraft((d) => ({ ...d, strengthTargets: [...d.strengthTargets, target] }));
  }

  function updateStrengthTarget(id: string, patch: Partial<ProgramExerciseTarget>) {
    setDraft((d) => ({
      ...d,
      strengthTargets: d.strengthTargets.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    }));
  }

  function removeStrengthTarget(id: string) {
    setDraft((d) => ({ ...d, strengthTargets: d.strengthTargets.filter((t) => t.id !== id) }));
  }

  function submit() {
    if (!draft.name.trim()) return;
    if (editingProgram) {
      updateProgram({ ...editingProgram, ...draft });
    } else {
      addProgram(draft);
    }
    setEditingProgram(null);
    setDraft(emptyDraft());
    setShowForm(false);
  }

  return (
    <div className="space-y-3">
      <datalist id={EXERCISE_DATALIST_ID}>
        {knownExerciseNames.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>

      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Programmes</h1>
        <Button onClick={() => (showForm ? cancelForm() : startCreate())}>
          {showForm ? 'Annuler' : '+ Nouveau programme'}
        </Button>
      </div>

      {showForm && (
        <Card className="space-y-3">
          <h2 className="text-sm font-semibold text-ash-600">
            {editingProgram ? `Modifier "${editingProgram.name}"` : 'Nouveau programme'}
          </h2>
          <div>
            <Label>Nom du programme</Label>
            <Input
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              placeholder="ex: Push/Pull/Legs, Full Body..."
            />
          </div>
          <div>
            <Label>Description</Label>
            <Input
              value={draft.description}
              onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
              placeholder="optionnel"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-semibold">Jours</h3>
              <Button variant="secondary" onClick={addDay}>
                + Jour
              </Button>
            </div>

            {draft.days.length === 0 ? (
              <p className="text-xs text-ash-600">Ajoute un jour pour pouvoir y placer des exercices.</p>
            ) : (
              draft.days.map((day) => {
                const dayTargets = draft.strengthTargets.filter((t) => t.dayId === day.id);
                return (
                  <div key={day.id} className="border border-ash-200 rounded-lg p-2 space-y-2">
                    <div className="flex gap-2 items-center">
                      <Input
                        value={day.name}
                        onChange={(e) => updateDayName(day.id, e.target.value)}
                        placeholder="Nom du jour (ex: Jour 1 - Push)"
                      />
                      <IconButton
                        variant="danger"
                        hoverOnly={false}
                        onClick={() => removeDay(day.id)}
                        title="Supprimer le jour"
                        aria-label="Supprimer le jour"
                      >
                        ✕
                      </IconButton>
                    </div>

                    <div className="space-y-1.5">
                      {dayTargets.map((t) => (
                        <div key={t.id} className="grid grid-cols-12 gap-2 items-center">
                          <Input
                            className="col-span-3"
                            placeholder="Exercice (ex: Développé couché)"
                            list={EXERCISE_DATALIST_ID}
                            value={t.exerciseName}
                            onChange={(e) => updateStrengthTarget(t.id, { exerciseName: e.target.value })}
                          />
                          <select
                            className="col-span-2 px-3 py-1.5 rounded-lg border border-ash-300 bg-white text-sm"
                            value={t.muscleGroup}
                            onChange={(e) =>
                              updateStrengthTarget(t.id, { muscleGroup: e.target.value as MuscleGroup })
                            }
                          >
                            {MUSCLE_GROUPS.map((mg) => (
                              <option key={mg} value={mg}>
                                {mg}
                              </option>
                            ))}
                          </select>
                          <Input
                            className="col-span-2"
                            type="number"
                            min={1}
                            placeholder="Séries"
                            value={t.targetSets}
                            onChange={(e) => updateStrengthTarget(t.id, { targetSets: Number(e.target.value) })}
                          />
                          <Input
                            className="col-span-1"
                            type="number"
                            min={1}
                            placeholder="Reps min"
                            title="Répétitions min"
                            value={t.targetRepsMin}
                            onChange={(e) =>
                              updateStrengthTarget(t.id, { targetRepsMin: Number(e.target.value) })
                            }
                          />
                          <Input
                            className="col-span-1"
                            type="number"
                            min={1}
                            placeholder="Reps max"
                            title="Répétitions max"
                            value={t.targetRepsMax}
                            onChange={(e) =>
                              updateStrengthTarget(t.id, { targetRepsMax: Number(e.target.value) })
                            }
                          />
                          <Input
                            className="col-span-2"
                            type="number"
                            min={0}
                            placeholder="RIR (optionnel)"
                            title="Reps in reserve"
                            value={t.targetRIR ?? ''}
                            onChange={(e) =>
                              updateStrengthTarget(t.id, {
                                targetRIR: e.target.value ? Number(e.target.value) : undefined,
                              })
                            }
                          />
                          <button
                            className="col-span-1 text-red-600 text-sm"
                            onClick={() => removeStrengthTarget(t.id)}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>

                    <Button variant="secondary" onClick={() => addStrengthTarget(day.id)}>
                      + Exercice
                    </Button>
                  </div>
                );
              })
            )}
          </div>

          <VolumeChart strengthTargets={draft.strengthTargets} />

          <div className="flex gap-2">
            <Button onClick={submit} disabled={!draft.name.trim()}>
              {editingProgram ? 'Enregistrer les modifications' : 'Enregistrer le programme'}
            </Button>
            <Button variant="secondary" onClick={cancelForm}>
              Annuler
            </Button>
          </div>
        </Card>
      )}

      {data.programs.length === 0 ? (
        <EmptyState>Aucun programme créé. Crée ton premier programme d'entrainement !</EmptyState>
      ) : (
        <div className="space-y-3">
          {data.programs.map((p) => (
            <ProgramCard
              key={p.id}
              program={p}
              isActive={data.activeProgramId === p.id}
              exerciseVariants={exerciseVariants}
              onToggleActive={() => setActiveProgram(data.activeProgramId === p.id ? undefined : p.id)}
              onEdit={() => startEdit(p)}
              onDelete={() => deleteProgram(p.id)}
              onDuplicate={() => duplicateProgram(p)}
              onGenerateFakeHistory={() => generateFakeHistory(p)}
              onOpenVariantsPopup={setVariantsPopup}
            />
          ))}
        </div>
      )}

      {variantsPopup && (
        <div
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4"
          onClick={() => setVariantsPopup(null)}
        >
          <div
            className="bg-white rounded-lg p-3 max-w-sm w-full shadow-lg space-y-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-semibold">Variantes réalisées : {variantsPopup}</h3>
              <button
                type="button"
                onClick={() => setVariantsPopup(null)}
                className="text-ash-500 hover:text-ash-700 text-sm"
                aria-label="Fermer"
              >
                ✕
              </button>
            </div>
            <ul className="text-sm space-y-1 max-h-64 overflow-y-auto">
              {(exerciseVariants.get(variantsPopup) ?? []).map((v, i) => (
                <li
                  key={i}
                  className="flex justify-between gap-2 border-b border-ash-100 py-1"
                >
                  <span className="text-ash-700">{v.variantName}</span>
                  <span className="text-ash-500 text-xs text-right">
                    {formatSetsSummary(v.sets)} · {v.date}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
