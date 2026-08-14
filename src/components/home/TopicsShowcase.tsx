import { Link } from "react-router-dom";
import { topics, badgeMatiere } from "../../data/topics";
import { exercises } from "../../data/exercises";
import AnimatedSection from "../ui/AnimatedSection";

export default function TopicsShowcase() {
  // On garde le filtre `masquerListe` (mécanisme conservé pour usage
  // futur) même si aucun topic ne l'active actuellement — un cours
  // marqué `enPreparation` reste visible ici, comme carte inerte.
  const topicsVisibles = topics.filter((t) => !t.masquerListe);
  return (
    <section id="topics" className="container-page scroll-mt-28 py-20 sm:py-24">
      <AnimatedSection className="mx-auto max-w-2xl text-center">
        <h2 className="text-balance text-3xl font-bold sm:text-4xl">
          Choisis une matière et avance à ton rythme
        </h2>
        <p className="mt-4 text-balance text-lg text-ink-600">
          Quatre matières clés du parcours collégial, chaque problème
          accompagné de sa solution complète prête à être consultée.
        </p>
      </AnimatedSection>

      <div className="mt-14 grid gap-6 sm:grid-cols-2">
        {topicsVisibles.map((topic, i) => {
          // Le compte gratuit vient soit d'un champ posé (`nbExercicesPublies`
          // pour un cours à banque hors du tableau `exercises`), soit du
          // décompte dans `exercises` (matières procédurales — linalg,
          // prob-stat). Le badge est ensuite dérivé par `badgeMatiere` :
          // « À venir » pour enPreparation, « X gratuits · Y avec le
          // package » quand un total existe, sinon « X exercices ».
          const gratuits =
            topic.nbExercicesPublies
            ?? exercises.filter((e) => e.topicId === topic.id).length;
          const badge = badgeMatiere(topic, gratuits);
          return (
            <AnimatedSection key={topic.id} delay={i * 0.08}>
              <CarteMatiere topic={topic} badge={badge} />
            </AnimatedSection>
          );
        })}
      </div>
    </section>
  );
}

/**
 * Une carte de matière — active (Link vers la vitrine) ou inerte (div avec
 * mention « À venir »). Le rendu inerte est atténué, sans flèche « Commencer »,
 * sans focus clavier, sans curseur main.
 */
function CarteMatiere({ topic, badge }: { topic: (typeof topics)[number]; badge: string }) {
  const style = topic.couleur;
  const classesCommunes =
    "group relative flex h-full w-full flex-col gap-4 overflow-hidden rounded-3xl " +
    `p-7 text-white shadow-lg shadow-black/5 ring-1 ring-white/10 sm:p-8 ${style.bg}`;
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
    // Rendu inerte : `<div>` avec `aria-disabled`, opacité réduite,
    // pas de curseur main, pas de focus clavier (pas de tabIndex), pas
    // de Link. La carte se lit comme une promesse.
    return (
      <div aria-disabled className={`${classesCommunes} cursor-default opacity-60`}>
        {contenu}
      </div>
    );
  }
  return (
    <Link
      to={topic.pageDediee ?? `/practice?topic=${topic.id}`}
      className={`${classesCommunes} cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:ring-4 ${style.hoverBg} ${style.ring}`}
      aria-label={`Pratiquer la matière ${topic.name}`}
    >
      {contenu}
    </Link>
  );
}
