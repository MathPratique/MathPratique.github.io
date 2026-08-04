import { Link } from "react-router-dom";
import { topics } from "../../data/topics";
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
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {topics.map((topic, i) => {
        const style = topic.couleur;
        // Le compte publié prime : le tableau `exercises` ne contient plus
        // qu'un exercice de calcul différentiel, vestige d'avant la banque.
        const count = topic.nbExercicesPublies ?? exercises.filter((e) => e.topicId === topic.id).length;
        // Quand la banque a une portion payante, on affiche « X sur Y »
        // — le total réel plutôt que la seule portion accessible, pour
        // qu'un acheteur potentiel voie ce qu'il obtient avec le package.
        const totalBanque = topic.nbExercicesTotal;
        const compteurTexte =
          totalBanque && totalBanque > count
            ? `${count} sur ${totalBanque}`
            : `${count} exercice${count > 1 ? "s" : ""}`;
        const vitrine = resterSurPlace ? undefined : topic.pageDediee;
        const classes =
          "group relative flex w-full cursor-pointer flex-col items-start gap-4 " +
          "overflow-hidden rounded-3xl p-7 text-left text-white shadow-lg " +
          "shadow-black/5 ring-1 ring-white/10 transition-all duration-300 " +
          `hover:-translate-y-1 hover:shadow-xl hover:ring-4 sm:p-8 ${style.bg} ${style.hoverBg} ${style.ring}`;

        const contenu = (
          <>
            <div
              className={`flex h-14 w-14 items-center justify-center rounded-2xl ${style.iconBg}`}
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d={topic.icon} />
              </svg>
            </div>

            <div className="flex-1">
              <h3 className="font-display text-2xl font-bold leading-tight !text-white sm:text-3xl">
                {topic.name}
              </h3>
              <p className="mt-3 text-base text-white/90">
                {topic.description}
              </p>
            </div>

            <div className="mt-2 flex w-full items-center justify-between">
              <span className="rounded-full bg-black/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                {compteurTexte}
              </span>
              <span className="inline-flex items-center gap-1 text-sm font-semibold transition-transform duration-300 group-hover:translate-x-1">
                Commencer
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M5 12h14M13 5l7 7-7 7" />
                </svg>
              </span>
            </div>
          </>
        );

        return (
          <AnimatedSection key={topic.id} delay={i * 0.08}>
            {vitrine ? (
              // Un vrai lien, pas un bouton : la vitrine a une adresse propre,
              // elle doit pouvoir s'ouvrir dans un onglet et être indexée.
              <Link to={vitrine} className={classes} aria-label={`Voir les exercices de ${topic.name}`}>
                {contenu}
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => onTopicSelect(topic.id)}
                className={classes}
                aria-label={`Choisir la matière ${topic.name}`}
              >
                {contenu}
              </button>
            )}
          </AnimatedSection>
        );
      })}
    </div>
  );
}
