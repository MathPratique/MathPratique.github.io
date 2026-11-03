// Le numéro du cahier de chacun des exercices, gratuits comme réservés —
// celui des recueils imprimés —, calculé sur le catalogue public seul.
//
// Module à part, sans les chNN.json : la page Devoirs nomme les exercices
// sans charger le contenu de la vitrine. Les cartes de la page Exercices
// affichent ce même numéro, quel que soit le filtre.

import catalogue from "./catalogue.json";
import {
  indexerCahier,
  type Difficulte,
  type FicheNumerotee,
  type TypeExercice,
} from "../banque-types";

/** Une fiche du catalogue, sans contenu : ce qui sert à choisir un exercice. */
export type FicheCatalogue = FicheNumerotee & { type: TypeExercice; difficulte: Difficulte };

export const FICHES_CATALOGUE = (catalogue as { exercices: FicheCatalogue[] }).exercices;

export const INDEX_CAHIER = indexerCahier(FICHES_CATALOGUE);
