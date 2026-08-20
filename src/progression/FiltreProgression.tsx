// Filtre par état de progression pour la page Exercices.
//
// Rendu uniquement si l'utilisateur a un accès valide — sinon, filtrer n'a
// pas de sens, il n'y a pas de progression à ranger.

import type { FiltreProgression } from "./regles";
import { useProgression } from "./ProgressionContext";

const OPTIONS: { valeur: FiltreProgression; libelle: string }[] = [
  { valeur: "tous", libelle: "Tous" },
  { valeur: "completes", libelle: "Complétés" },
  { valeur: "non-completes", libelle: "Non complétés" },
  { valeur: "marques", libelle: "À revoir" },
];

export default function FiltreProgressionBarre({
  valeur,
  onChange,
}: {
  valeur: FiltreProgression;
  onChange(v: FiltreProgression): void;
}) {
  const { statut } = useProgression();
  if (statut === "desactive" || statut === "aucun-acces") return null;

  return (
    <div
      role="radiogroup"
      aria-label="Filtrer par état"
      className="inline-flex items-center gap-1 rounded-full border border-brand-200 bg-white p-1"
    >
      {OPTIONS.map((o) => {
        const actif = o.valeur === valeur;
        return (
          <button
            key={o.valeur}
            type="button"
            role="radio"
            aria-checked={actif}
            onClick={() => onChange(o.valeur)}
            disabled={statut === "chargement"}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              actif
                ? "bg-brand-600 text-white"
                : "text-brand-700 hover:bg-brand-50"
            } ${statut === "chargement" ? "cursor-wait opacity-60" : ""}`}
          >
            {o.libelle}
          </button>
        );
      })}
    </div>
  );
}
