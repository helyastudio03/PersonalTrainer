# Personal Trainer

Application web simple pour suivre ses entrainements de musculation et de course à pied.

## Fonctionnalités

- **Programmes**: créer des programmes d'entrainement (objectifs par exercice en musculation, objectifs de sorties en course à pied).
- **Musculation**: enregistrer des séances (exercices, séries, répétitions, poids).
- **Course à pied**: enregistrer des sorties (distance, temps), avec calcul automatique de l'allure et de la vitesse.
- **Progression**: courbes d'évolution (1RM estimé et poids max par exercice, allure et distance par sortie).
- **Records personnels**: calcul automatique du 1RM estimé, du poids max levé, de la meilleure allure et de la plus longue distance.
- **Suggestions**: proposition simple de cible pour la prochaine séance (surcharge progressive en musculation, distance/allure en course), basée sur une règle simple plutôt que du machine learning.

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
