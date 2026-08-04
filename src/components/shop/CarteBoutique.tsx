// Carte de la grille Boutique.
//
// Deux états, aucun autre :
//   - **Disponible** : Link vers /boutique/<slug>. Fond plein, prix affiché.
//   - **À venir**    : élément inerte (div, pas de a/button, pas de curseur,
//                      pas de survol). Fond de la couleur du cours mais
//                      atténué (opacity-40) — reconnaissable, pas effacé en
//                      gris. `aria-disabled="true"`, tabindex="-1".
//
// La couleur du cours vient de topic.couleur (source unique dans
// src/data/topics.ts). Les prix viennent de la constante TARIFS partagée.

import { Link } from "react-router-dom";
import type { Topic } from "../../data/topics";

export type ProduitCarte = {
  /** Prix courant à afficher (souvent le prix de lancement). */
  prix: number;
  /** Prix rayé pour montrer le rabais. Optionnel. */
  prixOriginal?: number;
  /** « CAD », « USD »… */
  devise: string;
  /** URL de la page package correspondante, ex. « /boutique/calcul-differentiel ». */
  href: string;
  /** Si false, la carte devient « Bientôt disponible » (inerte). */
  disponible: boolean;
};

type CarteBoutiqueProps = {
  topic: Topic;
  produit: ProduitCarte;
};

export default function CarteBoutique({ topic, produit }: CarteBoutiqueProps) {
  const style = topic.couleur;

  const contenu = (
    <>
      <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${style.iconBg}`}>
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

      <div className="mt-5 flex-1">
        <h3 className="font-display text-2xl font-bold leading-tight !text-white sm:text-3xl">
          {topic.name}
        </h3>
        <p className="mt-3 text-base text-white/90">{topic.description}</p>
      </div>

      <div className="mt-6 flex w-full items-baseline justify-between gap-3">
        {produit.disponible ? (
          <>
            <span className="flex items-baseline gap-2 text-white">
              <span className="font-display text-2xl font-bold">
                {produit.prix} $
              </span>
              {produit.prixOriginal && (
                <span className="text-sm text-white/70 line-through">
                  {produit.prixOriginal} $
                </span>
              )}
              <span className="text-xs text-white/70">{produit.devise}</span>
            </span>
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-white transition-transform duration-300 group-hover:translate-x-1">
              Voir le package
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
          </>
        ) : (
          <span className="rounded-full bg-black/25 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
            Bientôt disponible
          </span>
        )}
      </div>
    </>
  );

  if (produit.disponible) {
    return (
      <Link
        to={produit.href}
        className={
          "group relative flex h-full w-full cursor-pointer flex-col items-start gap-4 " +
          "overflow-hidden rounded-3xl p-7 text-left text-white shadow-lg " +
          "shadow-black/5 ring-1 ring-white/10 transition-all duration-300 " +
          `hover:-translate-y-1 hover:shadow-xl hover:ring-4 sm:p-8 ${style.bg} ${style.hoverBg} ${style.ring}`
        }
      >
        {contenu}
      </Link>
    );
  }

  // Bientôt disponible : élément inerte. Pas de <a>, pas de <button>, pas de
  // curseur, pas de survol. aria-disabled pour les lecteurs d'écran.
  return (
    <div
      role="group"
      aria-disabled="true"
      aria-label={`${topic.name} — bientôt disponible`}
      tabIndex={-1}
      className={
        "relative flex h-full w-full flex-col items-start gap-4 overflow-hidden " +
        `rounded-3xl p-7 text-left text-white shadow-md shadow-black/5 opacity-40 sm:p-8 ${style.bg}`
      }
    >
      {contenu}
    </div>
  );
}
