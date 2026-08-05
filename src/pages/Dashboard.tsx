import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { UseAppData } from '../lib/useAppData';
import type { AppData } from '../types';
import { Button, Card, EmptyState } from '../components/ui';
import {
  getActualWeeklySetsByMuscleGroup,
  getExerciseMuscleGroups,
  getRecentPRImprovements,
  getStrengthPRsByWeightReps,
  getWeeklySetsByMuscleGroup,
  suggestNextProgramDay,
} from '../lib/records';

export default function Dashboard({ appData }: { appData: UseAppData }) {
  const { data, replaceData } = appData;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingImport, setPendingImport] = useState<AppData | null>(null);
  const [importError, setImportError] = useState('');

  function handleExport() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `plus-lourd-que-toi-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setImportError('');
    try {
      const parsed = JSON.parse(await file.text());
      if (!Array.isArray(parsed.programs) || !Array.isArray(parsed.strengthSessions)) {
        throw new Error('Format invalide');
      }
      setPendingImport({
        programs: parsed.programs,
        strengthSessions: parsed.strengthSessions,
        activeProgramId: parsed.activeProgramId,
      });
    } catch {
      setImportError("Fichier invalide : impossible d'importer ces données.");
    }
  }

  function confirmImport() {
    if (pendingImport) replaceData(pendingImport);
    setPendingImport(null);
  }

  const recentStrength = [...data.strengthSessions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  const activeProgram = data.programs.find((p) => p.id === data.activeProgramId);
  const suggestedDay = activeProgram
    ? suggestNextProgramDay(activeProgram, data.strengthSessions)
    : null;

  const exerciseMuscleGroups = getExerciseMuscleGroups(data.programs);
  const targetVolume = activeProgram ? getWeeklySetsByMuscleGroup(activeProgram.strengthTargets) : [];
  const actualVolume = getActualWeeklySetsByMuscleGroup(data.strengthSessions, exerciseMuscleGroups);
  const actualByGroup = new Map(actualVolume.map((v) => [v.muscleGroup, v.weeklySets]));

  const recentPRs = getRecentPRImprovements(data.strengthSessions, 14).slice(0, 5);

  const recordCountByDate = new Map<string, number>();
  for (const r of getStrengthPRsByWeightReps(data.strengthSessions)) {
    if (r.previousMaxReps === null) continue;
    recordCountByDate.set(r.date, (recordCountByDate.get(r.date) ?? 0) + 1);
  }

  const sessionDates = new Set(data.strengthSessions.map((s) => s.date));
  const today = new Date();
  const calendarYear = today.getFullYear();
  const calendarMonth = today.getMonth();
  const firstOfMonth = new Date(calendarYear, calendarMonth, 1);
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const leadingBlanks = (firstOfMonth.getDay() + 6) % 7; // lundi = 0
  const todayStr = today.toISOString().slice(0, 10);
  const calendarCells: (string | null)[] = [
    ...Array(leadingBlanks).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => {
      const d = i + 1;
      return `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }),
  ];
  const calendarMonthLabel = today.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-3">
      <h1 className="text-xl font-bold">Accueil</h1>

      <Card>
        <div className="flex justify-between items-center mb-2">
          <h2 className="font-semibold">Programme actif</h2>
          <Link to="/programmes" className="text-xs text-ember-600 hover:underline">
            Gérer les programmes
          </Link>
        </div>
        {activeProgram ? (
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-medium">{activeProgram.name}</p>
              {suggestedDay && (
                <p className="text-sm text-ash-600">
                  Prochaine séance suggérée : <span className="font-medium">{suggestedDay.name}</span>
                </p>
              )}
            </div>
            <Link
              to="/musculation"
              className="text-xs bg-ember-600 text-ash-100 rounded px-3 py-1.5 hover:bg-ember-700 shrink-0"
            >
              Démarrer une séance
            </Link>
          </div>
        ) : (
          <EmptyState>
            Aucun programme actif. Choisissez-en un depuis la page Programmes.
          </EmptyState>
        )}
      </Card>

      {activeProgram && targetVolume.length > 0 && (
        <Card>
          <h2 className="font-semibold mb-2">Volume hebdomadaire (cette semaine)</h2>
          <div className="flex flex-wrap gap-1.5">
            {targetVolume.map((t) => {
              const actual = actualByGroup.get(t.muscleGroup) ?? 0;
              const met = actual >= t.weeklySets;
              return (
                <span
                  key={t.muscleGroup}
                  className={`text-xs rounded-full px-2 py-1 ${
                    met
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-ash-200 text-ash-700'
                  }`}
                >
                  {t.muscleGroup} <span className="font-semibold">{actual}/{t.weeklySets}</span>
                </span>
              );
            })}
          </div>
        </Card>
      )}

      <div className="grid md:grid-cols-3 gap-3">
        <Card>
          <h2 className="font-semibold mb-2 capitalize">Calendrier — {calendarMonthLabel}</h2>
          <div className="grid grid-cols-7 gap-0.5 text-center max-w-56 mx-auto">
            {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
              <div key={i} className="text-[9px] font-semibold text-ash-500 uppercase">
                {d}
              </div>
            ))}
            {calendarCells.map((dateStr, i) => {
              if (!dateStr) return <div key={i} />;
              const hasSession = sessionDates.has(dateStr);
              const isToday = dateStr === todayStr;
              const day = Number(dateStr.slice(-2));
              return (
                <div
                  key={i}
                  title={hasSession ? `Séance le ${dateStr}` : dateStr}
                  className={`w-6 h-6 flex items-center justify-center rounded-full text-[11px] ${
                    hasSession
                      ? 'bg-ember-600 text-ash-100 font-semibold'
                      : isToday
                        ? 'border border-ember-600 text-ash-700'
                        : 'text-ash-600'
                  }`}
                >
                  {day}
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <h2 className="font-semibold mb-2">Records récents</h2>
          {recentPRs.length === 0 ? (
            <EmptyState>Aucun record battu ces 14 derniers jours.</EmptyState>
          ) : (
            <ul className="space-y-1">
              {recentPRs.map((r) => (
                <li
                  key={`${r.exerciseName}-${r.weightKg}`}
                  className="text-sm flex justify-between border-b border-ash-200 py-1"
                >
                  <span>
                    {r.exerciseName} <span className="text-ash-600">({r.weightKg} kg)</span>
                  </span>
                  <span className="text-amber-600 font-medium">
                    {r.previousMaxReps}→{r.maxReps} reps
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <div className="flex justify-between items-center mb-2">
            <h2 className="font-semibold">Dernières séances</h2>
            <Link to="/musculation" className="text-xs text-ember-600 hover:underline">
              Voir tout
            </Link>
          </div>
          {recentStrength.length === 0 ? (
            <EmptyState>Aucune séance enregistrée pour le moment.</EmptyState>
          ) : (
            <ul className="space-y-1">
              {recentStrength.map((s) => {
                const recordCount = recordCountByDate.get(s.date) ?? 0;
                return (
                  <li
                    key={s.id}
                    className="text-sm flex justify-between border-b border-ash-200 py-1"
                  >
                    <span>
                      {s.name ? `${s.name} · ${s.date}` : s.date}
                      {recordCount > 0 && (
                        <span className="ml-1.5 text-amber-600">
                          {recordCount > 1 ? recordCount : ''}⭐
                        </span>
                      )}
                    </span>
                    <span className="text-ash-600">
                      {s.exercises.length} exercice{s.exercises.length > 1 ? 's' : ''}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      <Card>
        <h2 className="font-semibold mb-2">Sauvegarde</h2>
        <p className="text-xs text-ash-600 mb-2">
          Exporte tes données (programmes, séances) dans un fichier pour les sauvegarder ailleurs,
          ou importe un fichier exporté précédemment.
        </p>
        <div className="flex flex-wrap gap-2 items-center">
          <Button variant="secondary" onClick={handleExport}>
            ⬇️ Exporter
          </Button>
          <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
            ⬆️ Importer
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
        {importError && <p className="text-xs text-red-600 mt-2">{importError}</p>}
        {pendingImport && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-xs text-ash-600">
              Remplacer toutes les données actuelles par ce fichier ({pendingImport.programs.length}{' '}
              programme{pendingImport.programs.length > 1 ? 's' : ''},{' '}
              {pendingImport.strengthSessions.length} séance
              {pendingImport.strengthSessions.length > 1 ? 's' : ''}) ?
            </span>
            <Button variant="danger" onClick={confirmImport}>
              Confirmer
            </Button>
            <Button variant="secondary" onClick={() => setPendingImport(null)}>
              Annuler
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
