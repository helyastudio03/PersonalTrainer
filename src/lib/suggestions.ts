import type { AppData } from '../types';
import { suggestNextProgramDay } from './records';

export interface Suggestion {
  id: string;
  text: string;
  linkTo?: string;
  linkLabel?: string;
}

const RANDOM_TIPS: Suggestion[] = [
  {
    id: 'tip-muscle-filter',
    text: "Clique sur un groupe musculaire dans les filtres (Progression, Records) pour sélectionner tous ses exercices d'un coup.",
  },
  {
    id: 'tip-variant',
    text: "Sur Séances, tu peux ajouter un exercice hors programme et le marquer comme variante — il apparaîtra en badge 🔀 sur Programmes.",
  },
  {
    id: 'tip-duplicate-session',
    text: 'Sur Séances, le bouton ⧉ duplique une séance existante — pratique pour recommencer un entraînement similaire.',
  },
  {
    id: 'tip-duplicate-program',
    text: 'Sur Programmes, un programme peut être dupliqué pour créer une variante sans repartir de zéro.',
  },
  {
    id: 'tip-export',
    text: "Pense à exporter tes données de temps en temps depuis la carte Sauvegarde de l'Accueil — tout est stocké uniquement dans ce navigateur.",
  },
  {
    id: 'tip-records-arrow',
    text: "Sur Records, une flèche ↘ indique quand la dernière tentative n'a pas retrouvé le niveau du record — survole-la pour le détail.",
  },
  {
    id: 'tip-progression-metrics',
    text: 'Sur Progression, trois métriques (Reps, Poids, Poids x reps) donnent des angles différents sur le même exercice.',
  },
];

function daysSince(dateStr: string, today: Date): number {
  const d = new Date(dateStr);
  const diffMs = today.getTime() - d.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

// Checklist fixe pour un utilisateur qui n'a encore ni programme ni séance.
export function getOnboardingChecklist(): Suggestion[] {
  return [
    {
      id: 'onboarding-1',
      text: 'Crée ton premier programme.',
      linkTo: '/programmes',
      linkLabel: 'Programmes',
    },
    {
      id: 'onboarding-2',
      text: "Définis-le comme actif (étoile en haut de sa carte).",
      linkTo: '/programmes',
      linkLabel: 'Programmes',
    },
    {
      id: 'onboarding-3',
      text: 'Démarre ta première séance.',
      linkTo: '/musculation',
      linkLabel: 'Séances',
    },
    {
      id: 'onboarding-4',
      text: 'Reviens voir ta progression et tes records.',
      linkTo: '/progression',
      linkLabel: 'Progression',
    },
  ];
}

// Suggestions contextuelles pour un utilisateur qui a déjà des données.
export function getContextualSuggestions(data: AppData, today: Date = new Date()): Suggestion[] {
  const suggestions: Suggestion[] = [];

  const activeProgram = data.programs.find((p) => p.id === data.activeProgramId);

  if (data.programs.length > 0 && !activeProgram) {
    suggestions.push({
      id: 'no-active-program',
      text: 'Des programmes existent mais aucun n\'est actif. Active-en un pour recevoir des suggestions de séance.',
      linkTo: '/programmes',
      linkLabel: 'Programmes',
    });
  }

  if (activeProgram) {
    const programSessions = data.strengthSessions.filter((s) => s.programId === activeProgram.id);
    if (programSessions.length === 0) {
      suggestions.push({
        id: 'active-no-sessions',
        text: `Le programme "${activeProgram.name}" est actif mais aucune séance n'a encore été loguée avec. Démarre ta première séance.`,
        linkTo: '/musculation',
        linkLabel: 'Séances',
      });
    } else {
      const lastDate = [...programSessions].sort((a, b) => b.date.localeCompare(a.date))[0].date;
      const gap = daysSince(lastDate, today);
      if (gap > 10) {
        const suggestedDay = suggestNextProgramDay(activeProgram, data.strengthSessions);
        suggestions.push({
          id: 'long-gap',
          text: suggestedDay
            ? `Ça fait ${gap} jours depuis ta dernière séance. Prochaine séance suggérée : "${suggestedDay.name}".`
            : `Ça fait ${gap} jours depuis ta dernière séance.`,
          linkTo: '/musculation',
          linkLabel: 'Séances',
        });
      }
    }
  }

  if (suggestions.length === 0) {
    const tip = RANDOM_TIPS[Math.floor(Math.random() * RANDOM_TIPS.length)];
    suggestions.push(tip);
  }

  return suggestions;
}

export function isNewUser(data: AppData): boolean {
  return data.programs.length === 0 && data.strengthSessions.length === 0;
}

export function getSuggestions(data: AppData, today: Date = new Date()): Suggestion[] {
  if (isNewUser(data)) return getOnboardingChecklist();
  return getContextualSuggestions(data, today);
}
