# Training Tracker

Application web simple pour suivre ses entrainements de musculation.

## Fonctionnalités

- **Programmes**: créer des programmes multi-jours (exercices, groupe musculaire, séries, plage de répétitions, RIR optionnel), avec calcul du volume hebdomadaire par groupe musculaire.
- **Séances**: enregistrer des séances (nom optionnel, exercices, séries, répétitions, poids), avec édition ciblée par exercice et référence à la dernière performance.
- **Progression**: courbes configurables (poids, reps, poids×reps, volume) par séance ou par semaine, plusieurs exercices sur un même graphique, filtres par groupe musculaire et par plage de dates.
- **Records personnels**: poids maximal soulevé par couple répétitions/poids, avec indicateur de progression, filtrables par exercice et groupe musculaire.

Toutes les données sont stockées localement dans le navigateur (`localStorage`) — aucun backend n'est nécessaire.

## Développement

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```
