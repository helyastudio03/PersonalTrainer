import type { MuscleGroup } from '../types';

// Couleur discrète associée à chaque groupe musculaire, utilisée en petite
// touche (barre verticale, pastille) sur les pages Programmes, Séances,
// Progression et Records pour identifier le groupe d'un coup d'œil sans
// texte redondant.
export const MUSCLE_GROUP_COLORS: Record<MuscleGroup, string> = {
  Pectoraux: '#2E9E66',
  Dos: '#2E999E',
  Épaules: '#2E5C9E',
  Biceps: '#3D2E9E',
  Triceps: '#7A2E9E',
  Quadriceps: '#9E2E85',
  Ischios: '#9E2E47',
  Fessiers: '#9E522E',
  Abdominaux: '#9E8F2E',
  Mollets: '#709E2E',
  'Avant-bras': '#339E2E',
};

const FALLBACK_COLOR = '#a8a29e';

export function getMuscleGroupColor(muscleGroup: MuscleGroup | undefined): string {
  return muscleGroup ? MUSCLE_GROUP_COLORS[muscleGroup] : FALLBACK_COLOR;
}
