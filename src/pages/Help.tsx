import { Card, RECORD_COLOR, RecordStar } from '../components/ui';
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
    <span className="inline-flex items-center gap-0.5 font-medium" style={{ color: RECORD_COLOR }}>
      {n ?? ''}
      <RecordStar />
    </span>
  );
}

export default function Help() {
  return (
    <div className="space-y-3">
      <h1 className="text-xl font-bold">Aide</h1>
      <p className="text-sm text-ash-600">
        Un tour d'horizon de l'application : ce que fait chaque page, et les petits signes visuels
        (couleurs, étoiles, flèches) qui reviennent partout une fois qu'on sait les lire.
      </p>

      <Section title="Avant de commencer">
        <p>
          Tout ce que tu saisis — programmes comme séances — reste dans ton navigateur, sur cet
          appareil : il n'y a ni compte ni serveur. C'est pratique et privé, mais ça veut dire qu'un
          nettoyage du navigateur ou un changement d'appareil peut tout effacer. La carte{' '}
          <strong>Sauvegarde</strong> sur l'Accueil exporte tout dans un fichier JSON téléchargeable, et
          permet de le réimporter plus tard — à faire de temps en temps, ou avant toute manipulation
          risquée.
        </p>
      </Section>

      <Section title="Programmes">
        <p>
          Un programme, c'est une suite de <strong>jours</strong> (Push, Pull, Legs, ou ce que tu veux),
          chacun avec ses exercices cibles : groupe musculaire, nombre de séries, plage de répétitions,
          et un RIR optionnel. L'étoile en haut d'une carte désigne le <strong>programme actif</strong> —
          celui que l'Accueil et les Séances utilisent pour te suggérer quoi faire ensuite.
        </p>
        <p>
          Chaque exercice porte une fine barre de couleur qui indique son groupe musculaire d'un coup
          d'œil (la légende complète est plus bas sur cette page). En bas de la carte, le résumé{' '}
          <strong>Nombre de séries par semaine</strong> ventile le volume par groupe musculaire ; clique
          sur un de ces badges pour mettre en surbrillance, juste au-dessus, tous les exercices qui
          travaillent ce groupe — le reste s'estompe le temps de repérer visuellement où porte l'effort.
        </p>
        <p>
          Si un badge <strong>🔀</strong> apparaît à côté d'un exercice, c'est qu'une ou plusieurs
          variantes ont été enregistrées à sa place lors de vraies séances (voir la section Séances
          ci-dessous). Cliquer dessus ouvre le détail : quelle variante, quelle performance, quel jour.
        </p>
      </Section>

      <Section title="Séances">
        <p>C'est ici que se logue l'entraînement, et que se consulte l'historique.</p>
        <SubHeading>Enregistrer</SubHeading>
        <p>
          <strong>+ Nouvelle séance</strong> propose directement le jour suivant du programme actif, avec
          ses exercices et ses cibles déjà en place — l'app suit la rotation des jours au fil des séances
          pour toujours suggérer le bon enchaînement. Si tu préfères repartir de zéro (séance improvisée,
          hors programme…), <strong>+ Séance vierge</strong> ouvre un formulaire complètement vide.
        </p>
        <p>
          Le bouton <strong>+ Exercice</strong> permet d'ajouter n'importe quel exercice à la volée. S'il
          ne fait pas partie du programme sélectionné, un badge d'avertissement propose de préciser s'il
          s'agit d'une variante d'un exercice prévu — par exemple "Développé incliné haltères" à la place
          de "Développé couché". C'est cette information qui remonte ensuite comme badge 🔀 sur la page
          Programmes.
        </p>
        <SubHeading>Historique</SubHeading>
        <p>
          Les séances sont classées par mois, et regroupées par <strong>cycle de programme</strong> :
          les séances qui s'enchaînent dans le cadre d'un même programme apparaissent côte à côte sur une
          même ligne, jusqu'à boucler un cycle complet — un bon moyen de visualiser la régularité de
          l'entraînement. Le titre de chaque séance combine programme, nom de la séance et date (les
          éléments manquants sont simplement omis), et chaque exercice garde sa barre de couleur par
          groupe musculaire.
        </p>
        <p>
          Une étoile <Star /> apparaît à droite d'un exercice quand la série réalisée bat un record
          personnel ; un chiffre devant l'étoile signale plusieurs records d'un coup. Passe la souris
          dessus pour voir exactement ce qui a été battu. Le filtre "Filtrer par programme", au-dessus de
          l'historique, restreint l'affichage à un ou plusieurs programmes. Sur chaque séance, ⧉ duplique
          (pratique pour repartir d'une séance existante), ✏️ modifie la date, le nom, le programme ou
          les notes, et chaque exercice peut être édité ou retiré individuellement.
        </p>
      </Section>

      <Section title="Progression">
        <p>
          Trace une ou plusieurs courbes pour les exercices choisis — poids, répétitions, poids×reps ou
          volume cumulé — vue par séance ou agrégée par semaine. Dans les filtres, les exercices sont
          rangés par groupe musculaire, chaque en-tête portant sa pastille de couleur ; cliquer dessus
          sélectionne ou désélectionne tout le groupe en un geste, sans toucher aux autres groupes déjà
          filtrés.
        </p>
        <p>
          Sur la courbe elle-même, une étoile marque un point qui constitue un nouveau record — jamais
          atteint jusque-là sur la métrique affichée. Survoler n'importe quel point ouvre une info-bulle
          avec sa valeur exacte et le nombre de répétitions associées.
        </p>
      </Section>

      <Section title="Records">
        <p>
          Pour chaque exercice, cette page affiche le poids maximal soulevé à chaque nombre de
          répétitions déjà réalisé — le record à 5 reps et celui à 8 reps n'ont aucune raison d'être
          liés, ils sont donc suivis séparément. Chaque bloc reprend la barre de couleur par groupe
          musculaire, et les filtres partagent la même logique de pastilles que sur Progression.
        </p>
        <p>
          Une flèche ↘ apparaît à côté d'un poids si la dernière tentative à ce nombre de répétitions n'a
          pas retrouvé le niveau du record ; elle indique, au survol, la date et le poids de cette
          dernière tentative.
        </p>
      </Section>

      <Section title="Accueil">
        <p>
          Le tableau de bord : le <strong>programme actif</strong> et sa prochaine séance suggérée, le{' '}
          <strong>volume hebdomadaire</strong> comparé aux cibles du programme (séries réalisées depuis
          lundi), un <strong>calendrier</strong> du mois en cours mettant en évidence les jours
          entraînés, ainsi que les <strong>records récents</strong> (14 derniers jours) et les{' '}
          <strong>dernières séances</strong>. Une étoile <Star n={2} /> à côté d'une date signale un ou
          plusieurs records battus ce jour-là — le détail apparaît au survol, comme sur la page Séances.
          Tout en bas, la carte <strong>Sauvegarde</strong> permet d'exporter ou de réimporter les
          données (voir "Avant de commencer" plus haut).
        </p>
      </Section>

      <Section title="Le code couleur par groupe musculaire">
        <p>
          Chaque groupe musculaire garde la même couleur partout dans l'application, en petites touches
          discrètes — barre verticale, pastille — plutôt qu'en texte répété. Une fois repérée, elle
          permet de reconnaître un exercice ou un filtre sans avoir à relire son nom.
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

      <Section title="Étoile et flèche : lire les indications de record">
        <p>
          Deux signes reviennent d'une page à l'autre, chacun avec un sens précis :
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            L'<strong>étoile</strong> (Séances, Accueil, courbes de Progression) signale qu'une série a
            dépassé, pour un poids donné, le nombre de répétitions précédemment réalisées avec ce même
            poids — un vrai record personnel. Plusieurs records le même jour se traduisent par un chiffre
            devant l'étoile, et le survol détaille toujours ce qui a été battu.
          </li>
          <li>
            La <strong>flèche ↘</strong> (page Records uniquement) va dans l'autre sens : elle signale
            qu'un record existant n'a pas été ré-atteint à la dernière tentative. Le survol précise la
            date et le poids de cette dernière tentative, pour comparer facilement.
          </li>
        </ul>
      </Section>

      <Section title="Filtres">
        <p>
          Sur Progression comme sur Records, les exercices sont regroupés par muscle dans les filtres, et
          cliquer sur le nom d'un groupe sélectionne ou désélectionne tous ses exercices en une fois, sans
          jamais masquer les autres groupes déjà filtrés. Ces deux pages partagent d'ailleurs le même
          filtre : les exercices et la période choisis sur l'une restent appliqués en passant à l'autre.
          L'icône ↺ en haut d'un bloc de filtres remet tout à zéro. Sur Séances, le filtre par programme
          fonctionne à part et ne concerne que l'historique affiché sur cette page.
        </p>
      </Section>
    </div>
  );
}
