/**
 * Calculateur « Quelle note me faut-il à l'examen final? » — le calcul seul.
 *
 * Aucun React ici : la page `CalculateurNoteFinale.tsx` ne fait que lire les
 * champs et afficher ce que ce module retourne. Le séparer permet de tester
 * les cas qui comptent (objectif atteint, impossible, cours terminé, arrondi)
 * sans navigateur, avec `npm test`.
 *
 * Toutes les notes et pondérations sont en pourcentage, de 0 à 100.
 *
 * L'étudiant n'entre que ses évaluations DÉJÀ FAITES. Tout le reste — examen
 * final compris — forme « le reste du cours » :
 *
 *   pondération restante = 100 − Σ pondérations faites
 *   points acquis        = Σ (note × pondération) / 100
 *   moyenne requise      = (cible − points acquis) / (pondération restante / 100)
 *
 * Une première version demandait la pondération du final et la traitait
 * comme le seul reste : avec 20 % d'évaluations faites et un final à 30 %,
 * les 50 % manquants passaient à la trappe et un objectif atteignable était
 * déclaré impossible.
 *
 * Option « moyenne d'examens » : certains cours exigent aussi que la moyenne
 * PONDÉRÉE des examens atteigne un seuil. Elle se calcule à part, sur les
 * examens restants que l'étudiant a détaillés — seulement si ce détail
 * couvre tout ce qui reste :
 *
 *   (seuil × (Σ pond. examens faits + Σ pond. examens restants)
 *      − Σ note × pond. examens faits) / Σ pond. examens restants
 */

/**
 * Tolérance des comparaisons de flottants. Les pondérations en pourcentage
 * produisent des valeurs comme 51,400000000000006 : sans marge, un objectif
 * atteignable à 100 % exactement serait déclaré impossible, et l'arrondi
 * vers le haut transformerait 51,4 en 51,5.
 */
export const EPS = 1e-9;

/**
 * Tolérance sur un TOTAL de pondérations. Trois évaluations à 33,33 %
 * totalisent 99,99 % : c'est un cours terminé, pas un reste de 0,01 % qui
 * rendrait n'importe quelle cible impossible.
 */
export const TOLERANCE_TOTAL = 0.05;

// ---------------------------------------------------------------------------
//  Lecture des champs
// ---------------------------------------------------------------------------

export type ErreurChamp = "vide" | "invalide" | "hors-bornes";

export type Champ = { valeur: number | null; erreur: ErreurChamp | null };

/**
 * Lit un nombre tapé par l'étudiant. La virgule décimale est acceptée
 * (« 72,5 ») : c'est celle qu'on tape au Québec, et un clavier de téléphone
 * en français ne propose souvent qu'elle.
 */
export function lireChamp(brut: string, min = 0, max = 100): Champ {
  const texte = brut.trim().replace(/\s/g, "").replace(",", ".");
  if (texte === "") return { valeur: null, erreur: "vide" };
  if (!/^-?\d*\.?\d+$|^-?\d+\.$/.test(texte)) return { valeur: null, erreur: "invalide" };
  const n = Number(texte);
  if (!Number.isFinite(n)) return { valeur: null, erreur: "invalide" };
  if (n < min || n > max) return { valeur: null, erreur: "hors-bornes" };
  return { valeur: n, erreur: null };
}

// ---------------------------------------------------------------------------
//  Arrondis et affichage
// ---------------------------------------------------------------------------

/**
 * Arrondi VERS LE HAUT au dixième : 51,44 → 51,5, jamais 51,4. Réservé aux
 * moyennes REQUISES. Les arrondir vers le bas ferait croire à l'étudiant
 * qu'une note un peu trop basse lui suffit.
 */
export function arrondiHaut(x: number): number {
  return Math.ceil(x * 10 - EPS) / 10 + 0;
}

/** Arrondi vers le bas au dixième : un maximum atteignable ne doit pas être gonflé. */
export function arrondiBas(x: number): number {
  return Math.floor(x * 10 + EPS) / 10 + 0;
}

/** Arrondi usuel au dixième, pour toutes les autres valeurs affichées. */
export function arrondi(x: number): number {
  return Math.round(x * 10) / 10 + 0;
}

/** « 51,5 % », avec l'espace insécable de la typographie française. */
export function pourcentage(x: number): string {
  return `${x.toFixed(1).replace(".", ",")}\u00a0%`;
}

/** Deux totaux de pondérations sont-ils égaux, à la tolérance près? */
export function totauxEgaux(a: number, b: number): boolean {
  return Math.abs(a - b) < TOLERANCE_TOTAL;
}

// ---------------------------------------------------------------------------
//  Calcul principal : la moyenne requise sur le reste du cours
// ---------------------------------------------------------------------------

export type EvaluationFaite = { note: number; ponderation: number; examen: boolean };

/** Une évaluation à venir, détaillée par l'étudiant : on n'en connaît que le poids. */
export type EvaluationRestante = { ponderation: number; examen: boolean };

export type LigneTableau = {
  /** Moyenne obtenue sur tout ce qui reste. */
  x: number;
  /** Note finale du cours qui en résulte. */
  note: number;
  reussit: boolean;
};

export const MOYENNES_DU_TABLEAU = [50, 60, 70, 80, 90, 100];

export type Analyse =
  /** Les évaluations faites pèsent plus de 100 % : aucun calcul n'a de sens. */
  | { statut: "trop"; ponderationFaite: number }
  /** Tout est évalué : la note finale est connue. */
  | { statut: "termine"; ponderationFaite: number; noteFinale: number; cibleAtteinte: boolean }
  | {
      statut: "atteint" | "possible" | "impossible";
      ponderationFaite: number;
      ponderationRestante: number;
      acquis: number;
      /** Moyenne requise sur le reste, non arrondie. */
      requise: number;
      /** Note finale avec 100 % sur tout ce qui reste. */
      noteMax: number;
      tableau: LigneTableau[];
    };

export function ponderationTotale(evaluations: { ponderation: number }[]): number {
  return evaluations.reduce((s, e) => s + e.ponderation, 0);
}

export function pointsAcquis(faites: EvaluationFaite[]): number {
  return faites.reduce((s, e) => s + (e.note * e.ponderation) / 100, 0);
}

export function analyser(faites: EvaluationFaite[], cible: number): Analyse {
  const ponderationFaite = ponderationTotale(faites);
  if (ponderationFaite > 100 + TOLERANCE_TOTAL) return { statut: "trop", ponderationFaite };

  const acquis = pointsAcquis(faites);
  if (ponderationFaite >= 100 - TOLERANCE_TOTAL) {
    return { statut: "termine", ponderationFaite, noteFinale: acquis, cibleAtteinte: acquis >= cible - EPS };
  }

  const ponderationRestante = 100 - ponderationFaite;
  const requise = (cible - acquis) / (ponderationRestante / 100);
  const statut = requise <= EPS ? "atteint" : requise > 100 + EPS ? "impossible" : "possible";
  const noteAvec = (x: number) => acquis + (x * ponderationRestante) / 100;

  return {
    statut,
    ponderationFaite,
    ponderationRestante,
    acquis,
    requise,
    noteMax: noteAvec(100),
    tableau: MOYENNES_DU_TABLEAU.map((x) => ({
      x,
      note: noteAvec(x),
      reussit: noteAvec(x) >= cible - EPS,
    })),
  };
}

// ---------------------------------------------------------------------------
//  Option : seuil de moyenne d'examens
// ---------------------------------------------------------------------------

/** Moyenne pondérée des examens déjà faits, ou null s'il n'y en a aucun. */
export function moyenneExamensFaits(faites: EvaluationFaite[]): number | null {
  const examens = faites.filter((e) => e.examen);
  const poids = ponderationTotale(examens);
  if (poids <= EPS) return null;
  return examens.reduce((s, e) => s + e.note * e.ponderation, 0) / poids;
}

export type AnalyseSeuil =
  /** Le reste n'est pas détaillé : on ne devine pas quels examens restent. */
  | { statut: "sans-detail" }
  /**
   * Le détail ne couvre pas exactement ce qui reste. Aucun chiffre : avec
   * l'Examen 2 seul détaillé (20 % sur 80 %), le calcul donnait 63,8 % alors
   * que l'exigence réelle, final compris, était de 61,4 %. Un chiffre faux
   * affiché avec assurance est pire qu'une invitation à compléter.
   */
  | { statut: "detail-incomplet"; totalDetaille: number; ponderationRestante: number }
  /** Aucun examen restant : la moyenne d'examens est déjà fixée (null sans examen coché). */
  | { statut: "fixe"; moyenne: number | null; respecte: boolean | null }
  | {
      statut: "atteint" | "possible" | "impossible";
      /** Moyenne requise sur les examens restants, non arrondie. */
      requise: number;
      ponderationExamensRestants: number;
      /** Moyenne d'examens avec 100 % sur les examens restants. */
      moyenneMax: number;
    };

/**
 * @param restantes  le détail de ce qui reste ; vide si l'étudiant ne l'a pas rempli.
 *                   Il doit totaliser la pondération restante (à TOLERANCE_TOTAL
 *                   près), sans quoi le seuil n'est pas calculé.
 */
export function analyserSeuil(
  faites: EvaluationFaite[],
  restantes: EvaluationRestante[],
  seuil: number,
): AnalyseSeuil {
  if (restantes.length === 0) return { statut: "sans-detail" };

  const totalDetaille = ponderationTotale(restantes);
  const ponderationRestante = 100 - ponderationTotale(faites);
  if (!totauxEgaux(totalDetaille, ponderationRestante)) {
    return { statut: "detail-incomplet", totalDetaille, ponderationRestante };
  }

  const examensFaits = faites.filter((e) => e.examen);
  const poidsFaits = ponderationTotale(examensFaits);
  const pointsFaits = examensFaits.reduce((s, e) => s + e.note * e.ponderation, 0);
  const poidsRestants = ponderationTotale(restantes.filter((e) => e.examen));

  if (poidsRestants <= EPS) {
    const moyenne = moyenneExamensFaits(faites);
    return { statut: "fixe", moyenne, respecte: moyenne === null ? null : moyenne >= seuil - EPS };
  }

  const requise = (seuil * (poidsFaits + poidsRestants) - pointsFaits) / poidsRestants;
  return {
    statut: requise <= EPS ? "atteint" : requise > 100 + EPS ? "impossible" : "possible",
    requise,
    ponderationExamensRestants: poidsRestants,
    moyenneMax: (pointsFaits + 100 * poidsRestants) / (poidsFaits + poidsRestants),
  };
}
