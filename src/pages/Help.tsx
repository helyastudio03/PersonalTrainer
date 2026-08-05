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

      <Section title="Avant de commencer">
        <p>
          Tout reste dans ton navigateur : pas de compte, pas de serveur. Pratique, mais un nettoyage du
          navigateur peut tout effacer. Pense à la carte <strong>Sauvegarde</strong> sur l'Accueil pour
          exporter tes données en JSON, et les réimporter au besoin.
        </p>
      </Section>

      <Section title="Programmes">
        <p>
          Un programme regroupe des <strong>jours</strong> (Push, Pull, Legs…), chacun avec ses exercices
          cibles. L'étoile en haut d'une carte désigne le <strong>programme actif</strong>, utilisé pour
          suggérer la prochaine séance.
        </p>
        <p>
          Chaque exercice a une barre de couleur par groupe musculaire. En bas de la carte,{' '}
          <strong>Nombre de séries par semaine</strong> résume le volume ; clique sur un badge pour
          surligner les exercices concernés au-dessus.
        </p>
        <p>
          Un badge <strong>🔀</strong> signale des variantes réalisées à la place d'un exercice — clique
          dessus pour voir le détail.
        </p>
      </Section>

      <Section title="Séances">
        <p>Pour loguer l'entraînement et consulter l'historique.</p>
        <SubHeading>Enregistrer</SubHeading>
        <p>
          <strong>+ Nouvelle séance</strong> propose le prochain jour du programme actif, déjà rempli.{' '}
          <strong>+ Séance vierge</strong> ouvre un formulaire vide. Avec{' '}
          <strong>+ Exercice</strong>, un exercice hors programme peut être marqué comme variante d'un
          exercice prévu — ce qui alimente le badge 🔀 sur Programmes.
        </p>
        <SubHeading>Historique</SubHeading>
        <p>
          Les séances sont classées par mois et regroupées par <strong>cycle de programme</strong> :
          les séances d'un même cycle s'affichent côte à côte. Le titre combine programme, nom de séance
          et date.
        </p>
        <p>
          Une étoile <Star /> à droite d'un exercice signale un record (survole pour le détail). Le
          filtre "Filtrer par programme" limite l'historique affiché. Sur chaque séance : ⧉ pour
          dupliquer, ✏️ pour modifier date/nom/programme/notes, et chaque exercice s'édite ou se retire
          individuellement.
        </p>
      </Section>

      <Section title="Progression">
        <p>
          Trois façons de suivre un exercice, par séance ou par semaine : <strong>Reps</strong> (une
          courbe par poids réalisé, pour voir les reps progresser à charge fixe),{' '}
          <strong>Poids</strong> (une courbe par nombre de répétitions réalisé, pour voir la charge
          progresser à reps fixes) et <strong>Poids x reps</strong> (une courbe par exercice, sur la
          meilleure série de chaque séance). Dans les filtres, cliquer sur un groupe musculaire
          sélectionne tous ses exercices d'un coup.
        </p>
        <p>Une étoile sur la courbe marque un nouveau record ; survole un point pour son détail.</p>
      </Section>

      <Section title="Records">
        <p>
          Le poids maximal soulevé pour chaque nombre de répétitions, par exercice — le record à 5 reps
          et celui à 8 reps sont suivis séparément.
        </p>
        <p>
          Une flèche ↘ apparaît si la dernière tentative n'a pas retrouvé le niveau du record (survole
          pour la date et le poids).
        </p>
      </Section>

      <Section title="Accueil">
        <p>
          Le tableau de bord : <strong>programme actif</strong> et prochaine séance,{' '}
          <strong>volume hebdomadaire</strong>, <strong>calendrier</strong> du mois,{' '}
          <strong>records récents</strong> et <strong>dernières séances</strong> — une étoile{' '}
          <Star n={2} /> signale un record ce jour-là. En bas, la <strong>Sauvegarde</strong> pour
          exporter/importer les données.
        </p>
      </Section>

      <Section title="Le code couleur par groupe musculaire">
        <p>
          Chaque groupe musculaire a sa couleur, en petites touches discrètes (barre, pastille) sur
          toutes les pages.
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

      <Section title="Étoile et flèche">
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Étoile</strong> (Séances, Accueil, Progression) : record personnel battu. Plusieurs
            records le même jour = un chiffre devant l'étoile. Le survol détaille toujours.
          </li>
          <li>
            <strong>Flèche ↘</strong> (Records uniquement) : le record n'a pas été ré-atteint à la
            dernière tentative.
          </li>
        </ul>
      </Section>

      <Section title="Filtres">
        <p>
          Progression et Records partagent le même filtre exercices/dates : ce qui est choisi sur l'une
          reste appliqué sur l'autre. L'icône ↺ réinitialise les filtres d'une page. Sur Séances, le
          filtre par programme est indépendant.
        </p>
      </Section>
    </div>
  );
}
