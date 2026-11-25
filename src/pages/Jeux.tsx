import { useEffect } from "react";
import { Link } from "react-router-dom";
import AnimatedSection from "../components/ui/AnimatedSection";
import { JEUX } from "../data/jeux";

// Liste des jeux du site. Une carte par entrée de src/data/jeux.ts : ajouter
// un jeu ne demande aucune modification de cette page.

// Recopiés dans scripts/prerendre.mjs (les effets ne s'exécutent pas au
// pré-rendu) ; un test vérifie qu'ils restent identiques.
const TITRE = "Jeux de maths — MathPratique";
const DESCRIPTION =
  "Des jeux pour pratiquer les maths autrement, comme un labyrinthe en 3D où chaque grille s'ouvre avec la bonne dérivée. Gratuits, sans compte.";

export default function Jeux() {
  useEffect(() => {
    document.title = TITRE;
    document.querySelector('meta[name="description"]')?.setAttribute("content", DESCRIPTION);
  }, []);

  return (
    <div className="container-page py-12 sm:py-16">
      <AnimatedSection className="mx-auto max-w-3xl text-center">
        <span className="inline-block rounded-full bg-brand-100 px-4 py-1.5 text-sm font-semibold text-brand-700">
          Gratuit, sans compte
        </span>
        <h1 className="mt-4 text-balance text-3xl font-bold sm:text-5xl">Jeux</h1>
        <p className="mt-4 text-balance text-base text-ink-600 sm:text-lg">
          Pour pratiquer les maths autrement : chaque bonne réponse te fait avancer.
        </p>
      </AnimatedSection>

      <ul className="mx-auto mt-10 grid max-w-5xl gap-6 md:grid-cols-2">
        {JEUX.map((jeu) => (
          <li key={jeu.slug}>
            <Link
              to={`/jeux/${jeu.slug}`}
              className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-3xl border border-brand-100 bg-white shadow-sm shadow-brand-900/5 transition-shadow duration-200 hover:shadow-md"
            >
              <img
                src={jeu.image}
                alt={jeu.imageAlt}
                width={680}
                height={382}
                loading="lazy"
                className="aspect-video w-full bg-[#10241a] object-cover"
              />
              <div className="flex flex-1 flex-col p-6">
                <h2 className="text-2xl font-bold">{jeu.titre}</h2>
                <p className="mt-2 text-ink-600">{jeu.resume}</p>
                <p className="mt-3 text-sm text-ink-600">
                  <span className="font-semibold text-ink-700">Notions : </span>
                  {jeu.notions}
                </p>
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                    À l'ordinateur · clavier et souris
                  </span>
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 transition-transform duration-300 group-hover:translate-x-1">
                    Jouer
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </span>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
