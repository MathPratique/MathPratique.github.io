// ===========================================================================
//  La vitrine de Probabilités et statistique (201-SN1-RE).
// ===========================================================================
//
// Deux sources, produites par le projet de matériel de cours et recopiées ici
// par scripts/sync-banque-ps.js :
//
//   chNN.json       le CONTENU des exercices ouverts, et rien d'autre
//   catalogue.json  une fiche signalétique par exercice — les 451, ouverts
//                   comme réservés — sans le moindre contenu
//
// La séparation est faite à la source, par liste blanche. Il n'y a pas de
// filtrage à faire côté navigateur, et il ne doit pas y en avoir : ce qui
// n'est pas dans le fichier ne peut pas fuir.
//
// ─── ÉTAT AU 2026-08-29 ────────────────────────────────────────────────────
//
// Zéro exercice ouvert. La sélection éditoriale n'a pas eu lieu et tout est
// réservé en attendant — réglage temporaire assumé. Les quatre chNN.json ont
// donc un tableau `exercices` vide, et le catalogue porte 451 fiches
// verrouillées. Le jour de la sélection, poser `acces: "gratuit"` dans la
// banque et relancer la synchronisation suffira : rien à changer ici.

import catalogue from "./catalogue.json";
import ch01 from "./ch01.json";
import ch02 from "./ch02.json";
import ch03 from "./ch03.json";
import ch04 from "./ch04.json";
import type { Chapitre, Exercice } from "../banque-types";

export type { Chapitre, Exercice };

const BRUTS = [ch01, ch02, ch03, ch04] as unknown as {
  chapitre: number;
  titre: string;
  exercices: Exercice[];
}[];

/**
 * Intitulés destinés aux en-têtes de section et aux moteurs de recherche.
 *
 * Les titres de la banque — « Probabilités », « Inférence statistique » — sont
 * exacts mais ne disent rien à quelqu'un qui cherche « loi binomiale » ou
 * « intervalle de confiance ». On garde le titre court pour la navigation et
 * on ajoute un intitulé qui nomme les notions réellement travaillées.
 */
const INTITULES: Record<number, string> = {
  1: "Vocabulaire, tableaux, mesures de tendance centrale et cote z",
  2: "Dénombrement, probabilités conditionnelles, loi binomiale et loi normale",
  3: "Théorème central limite, intervalles de confiance et tests d'hypothèse",
  4: "Corrélation, droite de régression et test d'indépendance du khi-carré",
};

/** Compte des exercices par chapitre, tiré des fiches signalétiques. */
const FICHES = (catalogue as { exercices: { chapitre: number; acces: string }[] }).exercices;

export const CHAPITRES: Chapitre[] = BRUTS.map((c) => {
  const total = FICHES.filter((f) => f.chapitre === c.chapitre).length;
  return {
    numero: c.chapitre,
    titre: c.titre,
    intitule: INTITULES[c.chapitre] ?? c.titre,
    exercices: c.exercices,
    autres: total - c.exercices.length,
    total,
  };
});

export const TOTAL_GRATUITS = CHAPITRES.reduce((n, c) => n + c.exercices.length, 0);
export const TOTAL_BANQUE = FICHES.length;
