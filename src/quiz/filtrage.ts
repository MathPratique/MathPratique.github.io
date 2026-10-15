// ===========================================================================
//  Choisir les exercices tirables — logique pure, partagée par les pickers
// ===========================================================================
//
// Avant, probStatPicker.ts et calcDiffPicker.ts portaient chacun leur copie
// de ce filtre. Les deux copies ont divergé une fois déjà (l'exclusion des
// figures manquantes n'existe que du côté calcul différentiel). Le filtre
// vit donc ici, en un seul exemplaire, et ce qui est propre à un cours passe
// par le paramètre `utilisable`.
//
// Ce module ne parle QUE le vocabulaire de la banque (`facile`, `qcm`…) et
// n'importe rien d'autre que des types : il est compilé tel quel par le banc
// d'essai, qui ne sait pas résoudre les imports JSON ni `import.meta.glob`.

import type { Difficulte, Exercice, TypeExercice } from "../data/banque-types";

/** Les trois canaux du quiz : CALC, QCM, V/F. */
export type Canal = "exercise" | "mcq" | "tf";

export type Critere = {
  chapitre: number;
  canal: Canal;
  /** Absente : les trois niveaux sont acceptés. */
  difficulte?: Difficulte;
  /**
   * Les sections visées, telles qu'écrites dans la banque (« 3.3 »).
   * Absente ou vide : tout le chapitre, ce qui est le comportement d'avant
   * le mode « à partir de mes notes ».
   */
  sections?: readonly string[];
};

/** Les deux formats de calcul de la banque tombent dans le canal CALC. */
export function correspondAuCanal(type: TypeExercice, canal: Canal): boolean {
  if (canal === "mcq") return type === "qcm";
  if (canal === "tf") return type === "vrai-faux";
  return type === "calcul-court" || type === "calcul-long";
}

/**
 * Le partage d'un bassin en deux files, pour un critère donné.
 *
 * `cibles` est ce que l'étudiant a demandé. `complements` est le reste du
 * chapitre — vide tant qu'aucune section n'est visée, puisqu'il n'y a alors
 * rien « à côté ».
 *
 * Le complément existe pour une raison précise : une section peut n'avoir
 * qu'un ou deux exercices (PS-3.11 en a un seul), et un visiteur sans accès
 * n'a parfois aucun gratuit dans la section détectée. Plutôt que de rendre
 * un quiz vide, on complète avec le même chapitre — et l'interface le dit à
 * l'étudiant. Un complément silencieux serait pire que le quiz vide : il
 * ferait croire que la notion révisée est celle de ses notes.
 */
export function filtrerPool(
  pool: readonly Exercice[],
  critere: Critere,
  utilisable: (ex: Exercice) => boolean = () => true,
): { cibles: Exercice[]; complements: Exercice[] } {
  const sections = critere.sections ?? [];
  const viseDesSections = sections.length > 0;
  const voulues = new Set(sections);

  const cibles: Exercice[] = [];
  const complements: Exercice[] = [];

  for (const ex of pool) {
    if (ex.chapitre !== critere.chapitre) continue;
    if (!correspondAuCanal(ex.type, critere.canal)) continue;
    if (critere.difficulte && ex.difficulte !== critere.difficulte) continue;
    if (!utilisable(ex)) continue;
    if (!viseDesSections || voulues.has(ex.section)) cibles.push(ex);
    else complements.push(ex);
  }
  return { cibles, complements };
}

/**
 * Combien d'exercices l'étudiant peut espérer pour ce critère. Sert à
 * griser les champs de l'interface : on annonce les cibles, jamais le
 * complément — il ne doit pas gonfler un chiffre qui promet la notion
 * demandée.
 */
export function compterCibles(
  pool: readonly Exercice[],
  critere: Critere,
  utilisable?: (ex: Exercice) => boolean,
): number {
  return filtrerPool(pool, critere, utilisable).cibles.length;
}
