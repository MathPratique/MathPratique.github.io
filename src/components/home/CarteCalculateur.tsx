import { Link } from "react-router-dom";
import AnimatedSection from "../ui/AnimatedSection";

// Carte d'appel vers le calculateur de note, juste sous le bandeau
// principal. Même facture que les cartes de Features : un outil gratuit,
// présenté comme un atout du site plutôt que comme une publicité.
export default function CarteCalculateur() {
  return (
    // Remontée dans la marge basse du bandeau (jusqu'à 112 px) : sans cela,
    // près de 190 px de vide séparaient le bouton du bandeau de la carte.
    <section className="container-page relative -mt-6 pb-10 sm:-mt-10 sm:pb-12 lg:-mt-14">
      <AnimatedSection className="flex flex-col gap-5 rounded-2xl border border-brand-100 bg-white p-6 shadow-sm shadow-brand-900/5 sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M7 3h10a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2zM8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div>
            <h2 className="font-display text-xl font-semibold text-brand-900 sm:text-2xl">
              Fin de session? Calcule la note qu'il te faut
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-600 sm:text-base">
              Entre tes évaluations déjà faites : le calculateur te dit quelle moyenne viser
              sur ce qui reste, examen final compris. Gratuit et sans compte.
            </p>
          </div>
        </div>
        <Link
          to="/outils/note-examen-final"
          className="inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-brand-700"
        >
          Ouvrir le calculateur
        </Link>
      </AnimatedSection>
    </section>
  );
}
