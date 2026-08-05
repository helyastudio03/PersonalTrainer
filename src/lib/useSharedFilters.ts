import { useState } from 'react';
import type { StrengthSession } from '../types';
import { listStrengthExerciseNames } from './records';

// Filtre exercice(s) + plage de dates partagé entre les pages Progression et
// Records, pour que la sélection reste cohérente en naviguant de l'une à
// l'autre.
export interface SharedExerciseFilters {
  selectedExercises: string[];
  setSelectedExercises: (update: string[] | ((prev: string[]) => string[])) => void;
  dateFrom: string;
  setDateFrom: (value: string) => void;
  dateTo: string;
  setDateTo: (value: string) => void;
}

export function useSharedExerciseFilters(sessions: StrengthSession[]): SharedExerciseFilters {
  const [selectedExercises, setSelectedExercises] = useState<string[]>(() => {
    const names = listStrengthExerciseNames(sessions);
    return names[0] ? [names[0]] : [];
  });
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  return { selectedExercises, setSelectedExercises, dateFrom, setDateFrom, dateTo, setDateTo };
}
