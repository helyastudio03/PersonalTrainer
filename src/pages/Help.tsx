import { Card } from '../components/ui';
import { MUSCLE_GROUPS } from '../types';
import { getMuscleGroupColor } from '../lib/muscleColors';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="space-y-2">
      <h2 className="font-semibold text-ash-800">{title}</h2>
      <div className="text-sm text-ash-700 space-y-2">{children}</div>
    </Card>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-semibold text-ash-700 mt-3 first:mt-0">{children}</h3>;
}

function Star({ n }: { n?: number }) {
  return (
    <span className="text-amber-600 font-medium">
      {n ? `${n}⭐` : '⭐'}
    </span>
  );
}

export default function Help() {
  return (
    <div className="space-y-3">
      <h1 className="text-xl font-bold">Aide</h1>
      <p className="text-sm text-ash-600">
        Ce guide décrit le fonctionnement de Training Tracker : la navigation entre les pages, ce que
        fait chaque page, et les éléments visuels transversaux (couleurs, étoiles de record, filtres)
        qu'on retrouve à plusieurs endroits.
      </p>

      <Section title="Navigation">
        <p>
          Cinq pages sont accessibles depuis le menu en haut : <strong>Accueil</strong>,{' '}
          <strong>Programmes</strong>, <strong>Séances</strong>, <strong>Progression</strong> et{' '}
          <strong>Records</strong>. Toutes les données (programmes et séances) sont stockées uniquement
          dans le navigateur (aucun compte, aucun serveur) — pense à utiliser la sauvegarde
          Export/Import sur l'Accueil si tu changes d'appareil ou de navigateur.
        </p>
      </Section>

      <Section title="Programmes">
        <p>
          Un programme regroupe plusieurs <strong>jours</strong> (ex: "Push", "Pull", "Legs"), chacun
          avec une liste d'exercices cibles : groupe musculaire, nombre de séries, plage de répétitions
          et RIR (reps in reserve) optionnel.
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            L'étoile ⭐/☆ en haut d'une carte programme le définit comme <strong>programme actif</strong> —
            celui utilisé par l'Accueil et les Séances pour suggérer la prochaine séance.
          </li>
          <li>
            Chaque exercice affiche une fine <strong>barre verticale colorée</strong> à gauche de son nom,
            indiquant son groupe musculaire (voir la légende des couleurs plus bas).
          </li>
          <li>
            En bas de la carte, <strong>"Nombre de séries par semaine"</strong> résume le volume par
            groupe musculaire. Cliquer sur un badge de groupe musculaire met en surbrillance les
            exercices correspondants dans les blocs de jours au-dessus (et estompe les autres) — pratique
            pour repérer d'un coup d'œil tous les exercices qui travaillent un même groupe.
          </li>
          <li>
            Un badge <strong>🔀 N</strong> peut apparaître à côté d'un exercice : il indique que des{' '}
            <strong>variantes</strong> ont été réalisées à sa place lors de séances (voir plus bas). Cliquer
            dessus ouvre une popup listant ces variantes avec leur performance et leur date.
          </li>
        </ul>
      </Section>

      <Section title="Séances">
        <p>Cette page sert à enregistrer les séances réalisées et à consulter l'historique.</p>
        <SubHeading>Enregistrer une séance</SubHeading>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>+ Nouvelle séance</strong> pré-remplit le formulaire avec la séance suggérée du
            programme actif (nom du jour, exercices, séries/reps cibles), en alternant les jours du
            programme au fil des séances.
          </li>
          <li>
            <strong>+ Séance vierge</strong> ouvre un formulaire complètement vide, pour une séance hors
            programme ou une saisie libre.
          </li>
          <li>
            <strong>+ Exercice</strong> ajoute un exercice libre au formulaire. Si le nom saisi ne
            correspond à aucun exercice du programme sélectionné, un badge{' '}
            <span className="text-amber-700 bg-amber-100 rounded px-1">⚠️ Hors programme — variante ?</span>{' '}
            apparaît : il permet de préciser que cet exercice est une <strong>variante</strong> d'un
            exercice prévu (ex: "Développé incliné haltères" en variante de "Développé couché"). Cette
            information alimente ensuite le badge 🔀 sur la page Programmes.
          </li>
        </ul>
        <SubHeading>Historique</SubHeading>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            Les séances sont groupées par mois, puis par <strong>cycle de programme</strong> : les
            séances consécutives d'un même programme sont affichées côte à côte sur une même ligne
            (jusqu'à un cycle complet), pour visualiser la régularité d'un enchaînement de jours.
          </li>
          <li>
            Le titre de chaque séance affiche <em>programme · nom de la séance · date</em> (les parties
            absentes sont simplement omises).
          </li>
          <li>
            Une fine barre verticale colorée précède chaque exercice (même code couleur par groupe
            musculaire que sur Programmes).
          </li>
          <li>
            Une étoile <Star /> apparaît à droite d'un exercice quand la série réalisée bat un record
            personnel ce jour-là ; un chiffre devant l'étoile indique plusieurs records sur cet exercice
            le même jour. Survole l'étoile pour voir le détail (poids et progression en répétitions).
          </li>
          <li>
            Un filtre <strong>"Filtrer par programme"</strong> permet de n'afficher que les séances d'un
            ou plusieurs programmes.
          </li>
          <li>
            Sur chaque séance : ⧉ pour la dupliquer (nouvelle séance pré-remplie avec les mêmes
            exercices), ✏️ pour modifier la date/le nom/le programme/les notes, et un clic sur un exercice
            permet de le modifier ou de le supprimer individuellement.
          </li>
        </ul>
      </Section>

      <Section title="Progression">
        <p>
          Affiche une ou plusieurs courbes de progression pour les exercices sélectionnés : poids,
          répétitions, poids×reps ou volume cumulé — par séance ou agrégé par semaine.
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            La partie <strong>Filtres</strong> regroupe les exercices par groupe musculaire ; chaque
            en-tête de groupe affiche une <strong>pastille de couleur</strong> avant son nom. Cliquer sur
            l'en-tête d'un groupe sélectionne/désélectionne tous ses exercices d'un coup, sans masquer
            les autres groupes.
          </li>
          <li>
            Sur la courbe, une étoile ⭐ marque un point qui est un nouveau record (jamais atteint
            jusque-là) pour la métrique choisie. Survoler un point affiche une info-bulle avec la valeur
            et le nombre de répétitions associées.
          </li>
        </ul>
      </Section>

      <Section title="Records">
        <p>
          Liste, pour chaque exercice, le <strong>poids maximal soulevé pour chaque nombre de
          répétitions</strong> déjà réalisé (ex: le record à 5 reps, à 8 reps, etc. peuvent être
          différents).
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            Chaque bloc de records affiche une barre verticale colorée à gauche du nom de l'exercice, et
            les groupes musculaires du filtre affichent la même pastille de couleur que sur Progression.
          </li>
          <li>
            Une flèche ↘ apparaît à côté d'un poids si la dernière tentative sur ce nombre de
            répétitions est en dessous du record (survole-la pour voir la date et le poids de cette
            dernière tentative).
          </li>
        </ul>
      </Section>

      <Section title="Accueil">
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Programme actif</strong> : nom du programme en cours, prochaine séance suggérée, et
            accès rapide pour démarrer une séance.
          </li>
          <li>
            <strong>Volume hebdomadaire</strong> : compare les séries réalisées cette semaine (depuis
            lundi) aux séries cibles du programme actif, par groupe musculaire.
          </li>
          <li>
            <strong>Calendrier</strong> : mini calendrier du mois en cours, avec les jours ayant une
            séance enregistrée mis en évidence.
          </li>
          <li>
            <strong>Records récents</strong> et <strong>Dernières séances</strong> : les 5 records les
            plus récents (14 derniers jours) et les 5 dernières séances. Une étoile{' '}
            <Star n={2} /> à côté d'une date indique un ou plusieurs records battus ce jour ; survole-la
            pour le détail.
          </li>
          <li>
            <strong>Sauvegarde</strong> : exporte toutes les données (programmes + séances) dans un
            fichier JSON téléchargeable, ou importe un fichier exporté précédemment pour restaurer ou
            transférer les données. Comme tout est stocké localement dans le navigateur, c'est le seul
            moyen de conserver une copie ou de changer d'appareil.
          </li>
        </ul>
      </Section>

      <Section title="Code couleur par groupe musculaire">
        <p>
          Chaque groupe musculaire a une couleur fixe, utilisée en petite touche discrète (barre
          verticale, pastille) sur Programmes, Séances, Progression et Records pour identifier un
          exercice ou un filtre d'un coup d'œil, sans texte redondant.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pt-1">
          {MUSCLE_GROUPS.map((mg) => (
            <div key={mg} className="flex items-center gap-2 text-xs">
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: getMuscleGroupColor(mg) }}
              />
              {mg}
            </div>
          ))}
        </div>
      </Section>

      <Section title="Indications de records">
        <p>Deux formes différentes selon la page, mais toujours le même principe : une amélioration.</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Étoile ⭐</strong> (Séances, Accueil, courbes de Progression) : une série a battu un
            record personnel — c'est-à-dire dépassé, pour un poids donné, le nombre de répétitions
            précédemment réalisées avec ce poids. Un chiffre devant l'étoile indique plusieurs records le
            même jour. Le survol affiche toujours le détail (poids et progression en reps).
          </li>
          <li>
            <strong>Flèche ↘</strong> (page Records) : indicateur inverse — le record à un nombre de
            répétitions donné n'a pas été ré-atteint lors de la dernière tentative. Le survol indique la
            date et le poids de cette dernière tentative.
          </li>
        </ul>
      </Section>

      <Section title="Filtres">
        <ul className="list-disc pl-5 space-y-1">
          <li>
            Sur Progression et Records, les exercices sont regroupés par groupe musculaire ; cliquer sur
            l'en-tête d'un groupe sélectionne/désélectionne tous ses exercices sans masquer les autres
            groupes filtrés.
          </li>
          <li>
            <strong>Ces deux pages partagent le même filtre</strong> : les exercices et la plage de dates
            choisis sur l'une restent appliqués en naviguant vers l'autre.
          </li>
          <li>
            L'icône ↺ en haut de chaque bloc de filtres réinitialise les filtres de la page.
          </li>
          <li>
            Sur Séances, le filtre "par programme" est indépendant et ne concerne que l'historique des
            séances affichées.
          </li>
        </ul>
      </Section>
    </div>
  );
}
