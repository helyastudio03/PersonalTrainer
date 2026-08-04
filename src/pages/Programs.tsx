import { useState } from 'react';
import { v4 as uuid } from 'uuid';
import type { UseAppData } from '../lib/useAppData';
import type { Program, ProgramExerciseTarget, ProgramRunTarget } from '../types';
import { Button, Card, EmptyState, Input, Label } from '../components/ui';

function emptyDraft(): Omit<Program, 'id' | 'createdAt'> {
  return { name: '', description: '', strengthTargets: [], runTargets: [] };
}

export default function Programs({ appData }: { appData: UseAppData }) {
  const { data, addProgram, deleteProgram } = appData;
  const [draft, setDraft] = useState(emptyDraft());
  const [showForm, setShowForm] = useState(false);

  function addStrengthTarget() {
    const target: ProgramExerciseTarget = {
      id: uuid(),
      exerciseName: '',
      targetSets: 3,
      targetReps: 8,
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

  function addRunTarget() {
    const target: ProgramRunTarget = { id: uuid(), label: '' };
    setDraft((d) => ({ ...d, runTargets: [...d.runTargets, target] }));
  }

  function updateRunTarget(id: string, patch: Partial<ProgramRunTarget>) {
    setDraft((d) => ({
      ...d,
      runTargets: d.runTargets.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    }));
  }

  function removeRunTarget(id: string) {
    setDraft((d) => ({ ...d, runTargets: d.runTargets.filter((t) => t.id !== id) }));
  }

  function submit() {
    if (!draft.name.trim()) return;
    addProgram(draft);
    setDraft(emptyDraft());
    setShowForm(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Programmes</h1>
        <Button onClick={() => setShowForm((s) => !s)}>
          {showForm ? 'Annuler' : '+ Nouveau programme'}
        </Button>
      </div>

      {showForm && (
        <Card className="space-y-4">
          <div>
            <Label>Nom du programme</Label>
            <Input
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              placeholder="ex: Push/Pull/Legs, Préparation 10km..."
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

          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-semibold">Objectifs musculation</h3>
              <Button variant="secondary" onClick={addStrengthTarget}>
                + Exercice
              </Button>
            </div>
            <div className="space-y-2">
              {draft.strengthTargets.map((t) => (
                <div key={t.id} className="grid grid-cols-12 gap-2 items-center">
                  <Input
                    className="col-span-5"
                    placeholder="Exercice (ex: Développé couché)"
                    value={t.exerciseName}
                    onChange={(e) => updateStrengthTarget(t.id, { exerciseName: e.target.value })}
                  />
                  <Input
                    className="col-span-2"
                    type="number"
                    min={1}
                    placeholder="Séries"
                    value={t.targetSets}
                    onChange={(e) => updateStrengthTarget(t.id, { targetSets: Number(e.target.value) })}
                  />
                  <Input
                    className="col-span-2"
                    type="number"
                    min={1}
                    placeholder="Reps"
                    value={t.targetReps}
                    onChange={(e) => updateStrengthTarget(t.id, { targetReps: Number(e.target.value) })}
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
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-semibold">Objectifs course à pied</h3>
              <Button variant="secondary" onClick={addRunTarget}>
                + Sortie
              </Button>
            </div>
            <div className="space-y-2">
              {draft.runTargets.map((t) => (
                <div key={t.id} className="grid grid-cols-12 gap-2 items-center">
                  <Input
                    className="col-span-5"
                    placeholder="Label (ex: Sortie longue)"
                    value={t.label}
                    onChange={(e) => updateRunTarget(t.id, { label: e.target.value })}
                  />
                  <Input
                    className="col-span-3"
                    type="number"
                    min={0}
                    step={0.1}
                    placeholder="Distance km"
                    value={t.targetDistanceKm ?? ''}
                    onChange={(e) =>
                      updateRunTarget(t.id, {
                        targetDistanceKm: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                  />
                  <Input
                    className="col-span-3"
                    type="number"
                    min={0}
                    step={0.1}
                    placeholder="Allure min/km"
                    value={t.targetPaceMinPerKm ?? ''}
                    onChange={(e) =>
                      updateRunTarget(t.id, {
                        targetPaceMinPerKm: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                  />
                  <button
                    className="col-span-1 text-red-500 text-sm"
                    onClick={() => removeRunTarget(t.id)}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          <Button onClick={submit} disabled={!draft.name.trim()}>
            Enregistrer le programme
          </Button>
        </Card>
      )}

      {data.programs.length === 0 ? (
        <EmptyState>Aucun programme créé. Crée ton premier programme d'entrainement !</EmptyState>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {data.programs.map((p) => (
            <Card key={p.id}>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{p.name}</h3>
                  {p.description && <p className="text-sm text-gray-500">{p.description}</p>}
                </div>
                <Button variant="danger" onClick={() => deleteProgram(p.id)}>
                  Supprimer
                </Button>
              </div>
              {p.strengthTargets.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-semibold text-gray-500 mb-1">Musculation</p>
                  <ul className="text-sm space-y-0.5">
                    {p.strengthTargets.map((t) => (
                      <li key={t.id}>
                        {t.exerciseName}: {t.targetSets}×{t.targetReps}
                        {t.targetWeight ? ` @ ${t.targetWeight}kg` : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {p.runTargets.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-semibold text-gray-500 mb-1">Course à pied</p>
                  <ul className="text-sm space-y-0.5">
                    {p.runTargets.map((t) => (
                      <li key={t.id}>
                        {t.label}
                        {t.targetDistanceKm ? ` — ${t.targetDistanceKm}km` : ''}
                        {t.targetPaceMinPerKm ? ` @ ${t.targetPaceMinPerKm}min/km` : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
