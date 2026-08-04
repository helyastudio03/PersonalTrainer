import { useMemo, useState } from 'react';
import type { UseAppData } from '../lib/useAppData';
import { Button, Card, EmptyState, Input, Label } from '../components/ui';
import { formatPace, paceMinPerKm, speedKmH } from '../lib/records';
import { suggestNextRun } from '../lib/suggestions';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function Running({ appData }: { appData: UseAppData }) {
  const { data, addRunSession, deleteRunSession } = appData;
  const [date, setDate] = useState(todayIso());
  const [programId, setProgramId] = useState('');
  const [distanceKm, setDistanceKm] = useState('');
  const [durationMin, setDurationMin] = useState('');
  const [notes, setNotes] = useState('');
  const [showForm, setShowForm] = useState(false);

  const suggestion = useMemo(() => suggestNextRun(data.runSessions), [data.runSessions]);

  const preview = useMemo(() => {
    const d = Number(distanceKm);
    const t = Number(durationMin);
    if (!d || !t) return null;
    return {
      pace: formatPace(t / d),
      speed: (d / (t / 60)).toFixed(1),
    };
  }, [distanceKm, durationMin]);

  function submit() {
    const d = Number(distanceKm);
    const t = Number(durationMin);
    if (!d || !t) return;
    addRunSession({
      date,
      programId: programId || undefined,
      distanceKm: d,
      durationMin: t,
      notes: notes || undefined,
    });
    setDistanceKm('');
    setDurationMin('');
    setNotes('');
    setDate(todayIso());
    setShowForm(false);
  }

  const sortedSessions = [...data.runSessions].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Course à pied</h1>
        <Button onClick={() => setShowForm((s) => !s)}>
          {showForm ? 'Annuler' : '+ Nouvelle sortie'}
        </Button>
      </div>

      {suggestion && (
        <Card>
          <p className="text-sm text-indigo-600 dark:text-indigo-400">💡 {suggestion.message}</p>
        </Card>
      )}

      {showForm && (
        <Card className="space-y-3">
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
            <div>
              <Label>Distance (km)</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={distanceKm}
                onChange={(e) => setDistanceKm(e.target.value)}
              />
            </div>
            <div>
              <Label>Temps (minutes)</Label>
              <Input
                type="number"
                min={0}
                step={0.1}
                value={durationMin}
                onChange={(e) => setDurationMin(e.target.value)}
              />
            </div>
          </div>
          {preview && (
            <p className="text-xs text-gray-500">
              Allure: <strong>{preview.pace}</strong> · Vitesse: <strong>{preview.speed} km/h</strong>
            </p>
          )}
          <div>
            <Label>Notes</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="optionnel" />
          </div>
          <Button onClick={submit} disabled={!distanceKm || !durationMin}>
            Enregistrer la sortie
          </Button>
        </Card>
      )}

      {sortedSessions.length === 0 ? (
        <EmptyState>Aucune sortie course enregistrée.</EmptyState>
      ) : (
        <div className="space-y-3">
          {sortedSessions.map((r) => (
            <Card key={r.id}>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{r.date}</h3>
                  <p className="text-sm text-gray-500">
                    {r.distanceKm} km · {r.durationMin} min · {formatPace(paceMinPerKm(r))} ·{' '}
                    {speedKmH(r).toFixed(1)} km/h
                  </p>
                  {r.notes && <p className="text-xs text-gray-400 mt-1">{r.notes}</p>}
                </div>
                <Button variant="danger" onClick={() => deleteRunSession(r.id)}>
                  Supprimer
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
