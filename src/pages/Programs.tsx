import { useMemo, useState } from 'react';
import { v4 as uuid } from 'uuid';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { UseAppData } from '../lib/useAppData';
import type { MuscleGroup, Program, ProgramDay, ProgramExerciseTarget } from '../types';
import { MUSCLE_GROUPS } from '../types';
import { Button, Card, EmptyState, Input, Label } from '../components/ui';
import { formatRepRange, getWeeklySetsByMuscleGroup, listAllExerciseNames } from '../lib/records';

const EXERCISE_DATALIST_ID = 'known-exercise-names';

function emptyDraft(): Omit<Program, 'id' | 'createdAt'> {
  const firstDay: ProgramDay = { id: uuid(), name: 'Jour 1' };
  return { name: '', description: '', days: [firstDay], strengthTargets: [] };
}

function VolumeChart({ strengthTargets }: { strengthTargets: ProgramExerciseTarget[] }) {
  const volumes = getWeeklySetsByMuscleGroup(strengthTargets);
  if (volumes.length === 0) return null;
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 mb-1">Séries par semaine et par groupe musculaire</p>
      <ResponsiveContainer width="100%" height={Math.max(volumes.length * 32, 80)}>
        <BarChart
          data={volumes}
          layout="vertical"
          barCategoryGap="25%"
          margin={{ left: 8, right: 16 }}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} horizontal={false} />
          <XAxis type="number" allowDecimals={false} fontSize={12} />
          <YAxis type="category" dataKey="muscleGroup" width={90} fontSize={12} />
          <Tooltip />
          <Bar
            dataKey="weeklySets"
            name="Séries/sem."
            fill="#6366f1"
            radius={[0, 4, 4, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function Programs({ appData }: { appData: UseAppData }) {
  const { data, addProgram, updateProgram, deleteProgram } = appData;
  const [draft, setDraft] = useState(emptyDraft());
  const [showForm, setShowForm] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);

  const knownExerciseNames = useMemo(
    () => listAllExerciseNames(data.programs, data.strengthSessions),
    [data.programs, data.strengthSessions],
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
    <div className="space-y-4">
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
        <Card className="space-y-4">
          <h2 className="text-sm font-semibold text-gray-500">
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

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-semibold">Jours</h3>
              <Button variant="secondary" onClick={addDay}>
                + Jour
              </Button>
            </div>

            {draft.days.length === 0 ? (
              <p className="text-xs text-gray-500">Ajoute un jour pour pouvoir y placer des exercices.</p>
            ) : (
              draft.days.map((day) => {
                const dayTargets = draft.strengthTargets.filter((t) => t.dayId === day.id);
                return (
                  <div key={day.id} className="border border-gray-200 dark:border-gray-800 rounded-lg p-3 space-y-3">
                    <div className="flex gap-2 items-center">
                      <Input
                        value={day.name}
                        onChange={(e) => updateDayName(day.id, e.target.value)}
                        placeholder="Nom du jour (ex: Jour 1 - Push)"
                      />
                      <button
                        type="button"
                        className="text-red-500 text-sm shrink-0"
                        onClick={() => removeDay(day.id)}
                      >
                        Supprimer le jour
                      </button>
                    </div>

                    <div className="space-y-2">
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
                            className="col-span-2 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm"
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
                            placeholder="Poids kg"
                            value={t.targetWeight ?? ''}
                            onChange={(e) =>
                              updateStrengthTarget(t.id, {
                                targetWeight: e.target.value ? Number(e.target.value) : undefined,
                              })
                            }
                          />
                          <button
                            className="col-span-1 text-red-500 text-sm"
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
        <div className="grid md:grid-cols-2 gap-4">
          {data.programs.map((p) => (
            <Card key={p.id} className="space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{p.name}</h3>
                  {p.description && <p className="text-sm text-gray-500">{p.description}</p>}
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button variant="secondary" onClick={() => startEdit(p)}>
                    Modifier
                  </Button>
                  <Button variant="danger" onClick={() => deleteProgram(p.id)}>
                    Supprimer
                  </Button>
                </div>
              </div>

              {p.days.map((day) => {
                const dayTargets = p.strengthTargets.filter((t) => t.dayId === day.id);
                if (dayTargets.length === 0) return null;
                return (
                  <div key={day.id}>
                    <p className="text-xs font-semibold text-gray-500 mb-1">{day.name}</p>
                    <ul className="text-sm space-y-0.5">
                      {dayTargets.map((t) => (
                        <li key={t.id}>
                          {t.exerciseName}{' '}
                          <span className="text-gray-400">({t.muscleGroup})</span>: {t.targetSets}×
                          {formatRepRange(t.targetRepsMin, t.targetRepsMax)}
                          {t.targetWeight ? ` @ ${t.targetWeight}kg` : ''}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}

              <VolumeChart strengthTargets={p.strengthTargets} />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
