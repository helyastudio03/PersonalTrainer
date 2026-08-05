import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { UseAppData } from '../lib/useAppData';
import type { AppData, StrengthSession } from '../types';
import { Button, Card, EmptyState, RECORD_COLOR, RecordStar } from '../components/ui';
import {
  getActualWeeklySetsByMuscleGroup,
  getExerciseMuscleGroups,
  getRecentPRImprovements,
  getRecordsByDate,
  getWeeklySetsByMuscleGroup,
  suggestNextProgramDay,
} from '../lib/records';

export default function Dashboard({ appData }: { appData: UseAppData }) {
  const { data, replaceData } = appData;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingImport, setPendingImport] = useState<AppData | null>(null);
  const [importError, setImportError] = useState('');
  const [monthOffset, setMonthOffset] = useState(0);
  const [exportJson, setExportJson] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle');

  // Le téléchargement direct (lien <a download>) ne fonctionne pas dans
  // certains contextes restreints (ex: iframe sandboxée d'un artefact
  // publié) : on ouvre systématiquement une popup avec le JSON, copiable
  // manuellement, en plus de tenter le téléchargement.
  function handleExport() {
    setExportJson(JSON.stringify(data, null, 2));
    setCopyStatus('idle');
  }

  function downloadExportFile() {
    if (!exportJson) return;
    const blob = new Blob([exportJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `training-tracker-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function copyExportJson() {
    if (!exportJson) return;
    try {
      await navigator.clipboard.writeText(exportJson);
      setCopyStatus('copied');
    } catch {
      setCopyStatus('error');
    }
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

  const recordsByDate = getRecordsByDate(data.strengthSessions);

  const sessionsByDate = new Map<string, StrengthSession[]>();
  for (const s of data.strengthSessions) {
    const list = sessionsByDate.get(s.date);
    if (list) list.push(s);
    else sessionsByDate.set(s.date, [s]);
  }

  function sessionLabel(s: StrengthSession): string {
    const programName = s.programId
      ? data.programs.find((p) => p.id === s.programId)?.name
      : undefined;
    const parts = [programName, s.name].filter((p): p is string => !!p);
    return parts.length > 0 ? parts.join(' · ') : 'Séance';
  }

  const today = new Date();
  const baseMonthDate = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const calendarYear = baseMonthDate.getFullYear();
  const calendarMonth = baseMonthDate.getMonth();
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
  const calendarMonthLabel = baseMonthDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-3">
      <h1 className="text-xl font-bold">Accueil</h1>

      <Card>
        <div className="flex justify-between items-center mb-2">
          <h2 className="font-semibold">
            Programme actif{activeProgram ? ` : ${activeProgram.name}` : ''}
          </h2>
          <Link to="/programmes" className="text-xs text-ember-600 hover:underline">
            Gérer les programmes
          </Link>
        </div>
        {activeProgram ? (
          <div className="flex items-center justify-between gap-3">
            {suggestedDay ? (
              <p className="text-sm text-ash-600">
                Prochaine séance : <span className="font-medium">{suggestedDay.name}</span>
              </p>
            ) : (
              <span />
            )}
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
          <h2 className="font-semibold mb-2">Volume hebdomadaire</h2>
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
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={() => setMonthOffset((o) => o - 1)}
              className="text-ash-500 hover:text-ash-800 w-6 h-6 flex items-center justify-center rounded"
              title="Mois précédent"
              aria-label="Mois précédent"
            >
              ‹
            </button>
            <h2 className="font-semibold capitalize text-sm flex items-center gap-1.5">
              Calendrier — {calendarMonthLabel}
              {monthOffset !== 0 && (
                <button
                  type="button"
                  onClick={() => setMonthOffset(0)}
                  className="text-xs font-normal text-ember-600 hover:underline normal-case"
                >
                  aujourd'hui
                </button>
              )}
            </h2>
            <button
              type="button"
              onClick={() => setMonthOffset((o) => Math.min(0, o + 1))}
              disabled={monthOffset >= 0}
              className="text-ash-500 hover:text-ash-800 w-6 h-6 flex items-center justify-center rounded disabled:opacity-30 disabled:cursor-not-allowed"
              title="Mois suivant"
              aria-label="Mois suivant"
            >
              ›
            </button>
          </div>
          <div className="grid grid-cols-7 gap-0.5 text-center max-w-56 mx-auto">
            {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
              <div key={i} className="text-[9px] font-semibold text-ash-500 uppercase">
                {d}
              </div>
            ))}
            {calendarCells.map((dateStr, i) => {
              if (!dateStr) return <div key={i} />;
              const daySessions = sessionsByDate.get(dateStr) ?? [];
              const hasSession = daySessions.length > 0;
              const isToday = dateStr === todayStr;
              const day = Number(dateStr.slice(-2));
              return (
                <div
                  key={i}
                  title={hasSession ? daySessions.map(sessionLabel).join(', ') : dateStr}
                  className={`w-6 h-6 flex items-center justify-center rounded-full text-[11px] cursor-default ${
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
          <div className="flex justify-between items-center mb-2">
            <h2 className="font-semibold">Records récents</h2>
            <Link to="/records" className="text-xs text-ember-600 hover:underline">
              Voir tout
            </Link>
          </div>
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
                  <span className="text-right whitespace-nowrap">
                    <span className="text-amber-600 font-medium">
                      {r.previousMaxReps}→{r.maxReps} reps
                    </span>{' '}
                    <span className="text-xs text-ash-500">{r.date}</span>
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
                const records = recordsByDate.get(s.date) ?? [];
                const setCount = s.exercises.reduce((sum, e) => sum + e.sets.length, 0);
                const recordsTooltip = records
                  .map((r) => `${r.exerciseName} ${r.weightKg}kg : ${r.previousMaxReps}→${r.maxReps} reps`)
                  .join('\n');
                return (
                  <li
                    key={s.id}
                    className="text-sm flex justify-between border-b border-ash-200 py-1"
                  >
                    <span>
                      {s.name ? `${s.name} · ${s.date}` : s.date}
                      {records.length > 0 && (
                        <span
                          className="ml-1.5 text-xs inline-flex items-center gap-0.5 p-1.5 -m-1.5 cursor-help"
                          style={{ color: RECORD_COLOR }}
                          title={recordsTooltip}
                        >
                          {records.length > 1 ? records.length : ''}
                          <RecordStar />
                        </span>
                      )}
                    </span>
                    <span className="text-ash-600">
                      {s.exercises.length} exercice{s.exercises.length > 1 ? 's' : ''} -{' '}
                      {setCount} série{setCount > 1 ? 's' : ''}
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

      {exportJson !== null && (
        <div
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4"
          onClick={() => setExportJson(null)}
        >
          <div
            className="bg-white rounded-lg p-4 max-w-lg w-full shadow-lg space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-sm">Exporter les données</h3>
              <button
                type="button"
                onClick={() => setExportJson(null)}
                className="text-ash-500 hover:text-ash-700 text-sm"
                aria-label="Fermer"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-ash-600">
              Copie ce texte dans un fichier .json pour le sauvegarder, ou essaie le téléchargement
              direct (peut ne pas fonctionner selon l'endroit où l'app est ouverte).
            </p>
            <textarea
              readOnly
              value={exportJson}
              onFocus={(e) => e.target.select()}
              className="w-full h-48 text-xs font-mono border border-ash-300 rounded p-2 bg-ash-50 resize-none"
            />
            <div className="flex flex-wrap gap-2">
              <Button onClick={copyExportJson}>
                {copyStatus === 'copied'
                  ? '✓ Copié'
                  : copyStatus === 'error'
                    ? 'Échec — sélectionne le texte et copie-le manuellement'
                    : '📋 Copier'}
              </Button>
              <Button variant="secondary" onClick={downloadExportFile}>
                ⬇️ Télécharger le fichier
              </Button>
              <Button variant="secondary" onClick={() => setExportJson(null)}>
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
