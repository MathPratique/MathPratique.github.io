import { Link } from "react-router-dom";
import { topics, badgeMatiere, type Topic } from "../../data/topics";
import { exercises } from "../../data/exercises";
import AnimatedSection from "../ui/AnimatedSection";

type TopicPickerProps = {
  onTopicSelect: (topicId: string) => void;
  /**
   * Ignorer les vitrines dédiées et toujours appeler `onTopicSelect`.
   *
   * Le quiz personnalisé se sert de ce sélecteur pour choisir une matière,
   * pas pour naviguer : l'envoyer vers la vitrine du calcul différentiel
   * l'empêcherait de composer son quiz.
   */
  resterSurPlace?: boolean;
};

export default function TopicPicker({ onTopicSelect, resterSurPlace = false }: TopicPickerProps) {
  // Un seul filtre : `masquerListe` bloque partout. Les cartes
  // `enPreparation` restent visibles (dans /practice ET dans le quiz),
  // rendues inertes par CarteMatiere — l'utilisateur les voit comme une
  // promesse, sans pouvoir cliquer. La garde qui empêche de générer un
  // quiz vide sur ces cours vit ailleurs (CustomQuiz.tsx pour l'URL
  // directe, customGenerators.ts pour la génération).
  const topicsVisibles = topics.filter((t) => !t.masquerListe);
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {topicsVisibles.map((topic, i) => {
        // Le compte gratuit vient soit d'un champ posé sur le topic, soit
        // du décompte dans `exercises` (matières procédurales). Le badge
        // est ensuite dérivé par `badgeMatiere` — la forme dépend des
        // données, aucune condition en dur sur un `id`.
        const gratuits =
          topic.nbExercicesPublies
          ?? exercises.filter((e) => e.topicId === topic.id).length;
        const badge = badgeMatiere(topic, gratuits);
        return (
          <AnimatedSection key={topic.id} delay={i * 0.08}>
            <CarteMatiere
              topic={topic}
              badge={badge}
              destination={resterSurPlace ? undefined : topic.pageDediee}
              onSelect={() => onTopicSelect(topic.id)}
            />
          </AnimatedSection>
        );
      })}
    </div>
  );
}

/**
 * Une carte de matière — trois modes de rendu, gouvernés par les données :
 *   1. `enPreparation` → `<div>` inerte, atténué, sans flèche ni focus
 *   2. `destination` renseigné → `<Link>` vers la vitrine dédiée
 *   3. sinon → `<button>` qui déclenche `onSelect` (mode quiz)
 */
function CarteMatiere({
  topic,
  badge,
  destination,
  onSelect,
}: {
  topic: Topic;
  badge: string;
  destination: string | undefined;
  onSelect: () => void;
}) {
  const style = topic.couleur;
  const classesCommunes =
    "group relative flex w-full flex-col items-start gap-4 overflow-hidden " +
    `rounded-3xl p-7 text-left text-white shadow-lg shadow-black/5 ring-1 ring-white/10 sm:p-8 ${style.bg}`;
  const contenu = (
    <>
      <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${style.iconBg}`}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d={topic.icon} />
        </svg>
      </div>

      <div className="flex-1">
        <h3 className="font-display text-2xl font-bold leading-tight !text-white sm:text-3xl">
          {topic.name}
        </h3>
        <p className="mt-3 text-base text-white/90">{topic.description}</p>
      </div>

      <div className="mt-2 flex w-full items-center justify-between">
        <span className="rounded-full bg-black/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
          {badge}
        </span>
        {/* Pas de flèche « Commencer » pour un cours à venir : la carte
            n'est pas cliquable, promettre l'action serait mensonger. */}
        {!topic.enPreparation && (
          <span className="inline-flex items-center gap-1 text-sm font-semibold transition-transform duration-300 group-hover:translate-x-1">
            Commencer
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </span>
        )}
      </div>
    </>
  );

  if (topic.enPreparation) {
    return (
      <div aria-disabled className={`${classesCommunes} cursor-default opacity-60`}>
        {contenu}
      </div>
    );
  }
  const interactif = `cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:ring-4 ${style.hoverBg} ${style.ring}`;
  if (destination) {
    return (
      <Link
        to={destination}
        className={`${classesCommunes} ${interactif}`}
        aria-label={`Voir les exercices de ${topic.name}`}
      >
        {contenu}
      </Link>
    );
  }
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`${classesCommunes} ${interactif}`}
      aria-label={`Choisir la matière ${topic.name}`}
    >
      {contenu}
    </button>
  );
}
