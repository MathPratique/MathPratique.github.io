// Les cours qui ont une page Devoirs, avec ce qu'il faut pour nommer leurs
// exercices. Un cours absent d'ici n'a pas de page (et les règles Firestore
// refusent d'en écrire les devoirs : voir COURS_DEVOIRS et formeValide).

import type { Repere } from "../data/banque-types";
import {
  FICHES_CATALOGUE,
  INDEX_CAHIER,
  type FicheCatalogue,
} from "../data/calcul-differentiel/cahier";

export type CoursDevoirs = {
  nom: string;
  /** Fiches dans l'ordre du catalogue : sert au choix des exercices. */
  fiches: FicheCatalogue[];
  index: Map<string, Repere>;
  /** La page des cartes, cible des liens « n° 26 ». */
  pageExercices: string;
};

export const COURS_AVEC_DEVOIRS: Record<string, CoursDevoirs> = {
  "calcul-differentiel": {
    nom: "Calcul différentiel",
    fiches: FICHES_CATALOGUE,
    index: INDEX_CAHIER,
    pageExercices: "/exercices/calcul-differentiel",
  },
};

/** Le lien vers une carte : le chapitre filtré, l'ancre sur l'exercice. */
export function lienCarte(cours: CoursDevoirs, chapitre: number, id: string): string {
  return `${cours.pageExercices}?chapitre=${chapitre}#${id}`;
}
