// Boutons « complété » et « à revoir » pour un exercice.
//
// Rendu conditionnel :
//   - statut "actif"     → les deux boutons, cliquables
//   - statut "chargement"→ squelette : formes grises inertes, pas de flash
//   - autres statuts     → RIEN (ni grisé, ni invitation ici — c'est aux
//                          pages de proposer une découverte du package
//                          globalement, pas exercice par exercice)
//
// Les deux boutons vivent côte à côte, la même hauteur, et le mode « actif »
// se distingue par une couleur pleine — pas seulement par une bordure, pour
// que ça se voie de loin quand on scanne une longue liste d'exercices.

import { estComplete, estMarque } from "./regles";
import { useProgression } from "./ProgressionContext";

export default function BoutonsProgression({ id }: { id: string }) {
  const { statut, progression, basculer } = useProgression();

  if (statut === "desactive" || statut === "aucun-acces") return null;

  if (statut === "chargement") {
    return (
      <div className="flex items-center gap-2" aria-hidden>
        <div className="h-7 w-7 animate-pulse rounded-md bg-brand-100" />
        <div className="h-7 w-7 animate-pulse rounded-md bg-brand-100" />
      </div>
    );
  }

  const complete = estComplete(progression, id);
  const marque = estMarque(progression, id);

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => basculer("completes", id)}
        aria-pressed={complete}
        aria-label={complete ? "Marquer comme non complété" : "Marquer comme complété"}
        title={complete ? "Complété — cliquer pour retirer" : "Marquer comme complété"}
        className={`inline-flex h-7 w-7 items-center justify-center rounded-md border transition-colors ${
          complete
            ? "border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700"
            : "border-brand-200 bg-white text-brand-500 hover:border-emerald-400 hover:text-emerald-600"
        }`}
      >
        {/* Coche SVG plutôt qu'un caractère : plus stable en tailles. */}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden>
          <polyline points="5 12 10 17 19 8" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => basculer("marques", id)}
        aria-pressed={marque}
        aria-label={marque ? "Retirer le marquage à revoir" : "Marquer comme à revoir"}
        title={marque ? "À revoir — cliquer pour retirer" : "Marquer comme à revoir"}
        className={`inline-flex h-7 w-7 items-center justify-center rounded-md border transition-colors ${
          marque
            ? "border-amber-500 bg-amber-500 text-white hover:bg-amber-600"
            : "border-brand-200 bg-white text-brand-500 hover:border-amber-400 hover:text-amber-600"
        }`}
      >
        {/* Drapeau SVG. Rempli en mode actif via la couleur du bouton. */}
        <svg width="16" height="16" viewBox="0 0 24 24" fill={marque ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" aria-hidden>
          <path d="M5 3v18" />
          <path d="M5 4h12l-2 4 2 4H5" />
        </svg>
      </button>
    </div>
  );
}
