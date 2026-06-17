import type { Exercise } from "../../data/exercises";
import { pick, randInt, uniqueId } from "../rng";
import { t, mat, bold, asCells } from "../builders";

function meta(id: string, title: string, difficulty: Exercise["difficulty"]) {
  return {
    id: uniqueId(id),
    topicId: "linear-algebra",
    lessonId: "L19",
    title,
    difficulty,
  } as const;
}

function easyRREFCheck(): Exercise {
  // A matrix already in reduced echelon form vs not
  const yes = pick([true, false]);
  let A: number[][];
  let reason: string;
  if (yes) {
    A = [
      [1, 0, randInt(-2, 2)],
      [0, 1, randInt(-2, 2)],
      [0, 0, 0],
    ];
    reason = "Pivots = 1, seuls non nuls dans leur colonne, ligne nulle en bas.";
  } else {
    A = [
      [1, 2, 3],
      [0, 1, 1],
      [0, 0, 1],
    ];
    reason = "La colonne du pivot de L₃ n'est pas réduite (il reste un 3 en L₁ et 1 en L₂).";
  }
  return {
    ...meta("quiz-L19-easy", "Reconnaître la forme échelon réduite", "Fondamental"),
    prompt: [
      t("Cette matrice est-elle en forme échelon réduite ? "),
      mat(asCells(A)),
    ],
    steps: [[t(reason)]],
    answer: [bold([t(yes ? "Oui, c'est une forme échelon réduite." : "Non, ce n'est PAS une forme échelon réduite.")])],
  };
}

function interReduceToRREF2(): Exercise {
  // 2x3 augmented matrix → RREF
  const x = randInt(-2, 3);
  const y = randInt(-2, 3);
  // [1 2 | something], [0 1 | y], with target solution
  // Build A_aug = [[1, 2, x + 2y], [0, 1, y]] → already echelon
  // RREF: [[1, 0, x], [0, 1, y]]
  const A = [
    [1, 2, x + 2 * y],
    [0, 1, y],
  ];
  return {
    ...meta("quiz-L19-inter", "Réduire à la forme échelon réduite (2×3)", "Intermédiaire"),
    prompt: [
      t("Réduire à la forme échelon réduite : "),
      mat(asCells(A)),
      t("."),
    ],
    steps: [
      [t("L₁ → L₁ − 2L₂ pour annuler le 2 en position (1,2).")],
    ],
    answer: [
      bold([
        t("Forme échelon réduite : "),
        mat([
          [1, 0, x],
          [0, 1, y],
        ]),
        t("."),
      ]),
    ],
  };
}

function interIdentifyPivots(): Exercise {
  const A = [
    [1, 0, 2, 0],
    [0, 1, -1, 0],
    [0, 0, 0, 1],
  ];
  return {
    ...meta("quiz-L19-inter", "Identifier pivots et variables libres", "Intermédiaire"),
    prompt: [
      t("Pour la matrice "),
      mat(asCells(A)),
      t(" en forme échelon réduite, identifier les pivots et les variables libres."),
    ],
    steps: [
      [t("Les pivots sont les 1 directeurs : colonnes 1, 2, 4.")],
      [t("La colonne 3 ne contient pas de pivot ⇒ x₃ est variable libre.")],
    ],
    answer: [bold([t("Pivots : colonnes 1, 2, 4 (x₁, x₂, x₄). Variable libre : x₃ = t (paramètre).")])],
  };
}

function advReduce3x4(): Exercise {
  // Build a clean system by picking X and computing B = A·X (no fractions)
  const X = [randInt(-1, 2), randInt(-1, 2), randInt(-1, 2)];
  const A = [
    [1, 1, 1],
    [1, 2, 3],
    [1, 0, 2],
  ];
  const B = [
    A[0][0] * X[0] + A[0][1] * X[1] + A[0][2] * X[2],
    A[1][0] * X[0] + A[1][1] * X[1] + A[1][2] * X[2],
    A[2][0] * X[0] + A[2][1] * X[1] + A[2][2] * X[2],
  ];
  const aug = [
    [...A[0], B[0]],
    [...A[1], B[1]],
    [...A[2], B[2]],
  ];
  const rref = [
    [1, 0, 0, X[0]],
    [0, 1, 0, X[1]],
    [0, 0, 1, X[2]],
  ];
  return {
    ...meta("quiz-L19-adv", "Réduire un système 3×4 augmenté en forme échelon réduite", "Avancé"),
    prompt: [
      t("Réduire la matrice augmentée à sa forme échelon réduite : "),
      mat(aug),
      t("."),
    ],
    steps: [
      [t("Annuler la colonne 1 sous le pivot avec L₂ et L₃.")],
      [t("Annuler la colonne 2 (sauf le pivot) puis la colonne 3.")],
    ],
    answer: [
      bold([
        t("RREF = "),
        mat(rref),
        t(` ; solution unique : x = ${X[0]}, y = ${X[1]}, z = ${X[2]}.`),
      ]),
    ],
  };
}

function advNumberOfSolutions(): Exercise {
  // RREF with free variable
  const A = [
    [1, 2, 0, 0, 3],
    [0, 0, 1, 0, 1],
    [0, 0, 0, 1, 2],
  ];
  return {
    ...meta("quiz-L19-adv", "Déterminer le nombre de solutions d'un système en RREF", "Avancé"),
    prompt: [
      t("La matrice augmentée d'un système est, après réduction : "),
      mat(asCells(A)),
      t(". Combien de solutions le système a-t-il ?"),
    ],
    steps: [
      [t("3 pivots (colonnes 1, 3, 4) et 4 variables (colonne 5 est B), donc 1 variable libre (x₂).")],
      [t("Système compatible avec une variable libre ⇒ infinité de solutions.")],
    ],
    answer: [bold([t("Infinité de solutions, paramétrées par x₂ = t ∈ ℝ : x₁ = 3 − 2t, x₃ = 1, x₄ = 2.")])],
  };
}

const inters = [interReduceToRREF2, interIdentifyPivots];
const advs = [advReduce3x4, advNumberOfSolutions];

export function generateL19Quiz(): Exercise[] {
  return [easyRREFCheck(), pick(inters)(), pick(inters)(), pick(advs)(), pick(advs)()];
}
