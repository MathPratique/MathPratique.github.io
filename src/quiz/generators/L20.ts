import type { Exercise } from "../../data/exercises";
import { pick, randInt, uniqueId } from "../rng";
import { t, mat, bold, asCells } from "../builders";

function meta(id: string, title: string, difficulty: Exercise["difficulty"]) {
  return {
    id: uniqueId(id),
    topicId: "linear-algebra",
    lessonId: "L20",
    title,
    difficulty,
  } as const;
}

function easyRankFromRREF(): Exercise {
  // A matrix already in RREF with known rank
  const r = pick([2, 3]);
  const A =
    r === 2
      ? [
          [1, 0, randInt(-2, 2)],
          [0, 1, randInt(-2, 2)],
          [0, 0, 0],
        ]
      : [
          [1, 0, 0, randInt(-2, 2)],
          [0, 1, 0, randInt(-2, 2)],
          [0, 0, 1, randInt(-2, 2)],
        ];
  return {
    ...meta("quiz-L20-easy", "Lire le rang directement d'une matrice en RREF", "Fondamental"),
    prompt: [
      t("Donner le rang de la matrice suivante (déjà en forme échelon réduite) : "),
      mat(asCells(A)),
      t("."),
    ],
    steps: [
      [t("Le rang est le nombre de pivots (lignes non nulles).")],
    ],
    answer: [bold([t(`rang(A) = ${r}.`)])],
  };
}

function interCompareRanks(): Exercise {
  // System with rank(A) = 2 but rank(A|B) = 3 → no solution
  const noSolution = pick([true, false]);
  const A_aug = noSolution
    ? [
        [1, 2, 3, 1],
        [0, 1, 1, 2],
        [0, 0, 0, 5],
      ]
    : [
        [1, 2, 3, 1],
        [0, 1, 1, 2],
        [0, 0, 0, 0],
      ];
  return {
    ...meta("quiz-L20-inter", "Comparer rang(A) et rang(A|B)", "Intermédiaire"),
    prompt: [
      t("Pour la matrice augmentée "),
      mat(asCells(A_aug)),
      t(", déterminer rang(A), rang(A|B), et conclure sur le nombre de solutions."),
    ],
    steps: [
      [t("Compter les pivots dans A (colonnes des coefficients) et dans (A|B).")],
    ],
    answer: [
      bold([
        t(
          noSolution
            ? "rang(A) = 2, rang(A|B) = 3 ⇒ rangs différents ⇒ aucune solution."
            : "rang(A) = 2 = rang(A|B), nombre d'inconnues = 3 ⇒ une variable libre ⇒ infinité de solutions."
        ),
      ]),
    ],
  };
}

function interRankFromNonRREF(): Exercise {
  const A = [
    [1, 2, 3],
    [2, 4, 6],
    [0, 0, 0],
  ];
  return {
    ...meta("quiz-L20-inter", "Trouver le rang en réduisant d'abord", "Intermédiaire"),
    prompt: [
      t("Trouver rang(A) pour "),
      mat(asCells(A), "A ="),
      t("."),
    ],
    steps: [
      [t("L₂ = 2·L₁ et L₃ = 0 : il ne reste qu'une seule ligne non nulle après réduction.")],
    ],
    answer: [bold([t("rang(A) = 1.")])],
  };
}

function advNumberOfSolutionsAnalysis(): Exercise {
  // Find values of k for which system has 0, 1, or ∞ solutions
  // System: [[1, k, 1], [k, 1, 1], [1, 1, k]] X = [[1], [1], [1]]
  // For specific k = 1: rank degenerates
  return {
    ...meta("quiz-L20-adv", "Discuter le nombre de solutions en fonction d'un paramètre", "Avancé"),
    prompt: [
      t("Soit le système ayant pour matrice augmentée "),
      mat([
        ["1", "k", "1", { type: "sep" }, "1"],
        ["k", "1", "1", { type: "sep" }, "1"],
        ["1", "1", "k", { type: "sep" }, "1"],
      ]),
      t(". Discuter le nombre de solutions selon les valeurs du paramètre k."),
    ],
    steps: [
      [t("Calculer det(A) = (k−1)²(k+2) (développement standard).")],
      [t("k ≠ 1 et k ≠ −2 ⇒ det ≠ 0 ⇒ une solution unique.")],
      [t("k = 1 : toutes les équations deviennent x + y + z = 1 ⇒ infinité de solutions.")],
      [t("k = −2 : système incompatible (à vérifier en réduisant) ⇒ aucune solution.")],
    ],
    answer: [
      bold([
        t(
          "k ∉ {1, −2} : solution unique ; k = 1 : infinité de solutions ; k = −2 : aucune solution."
        ),
      ]),
    ],
  };
}

function advRankProduct(): Exercise {
  const ra = pick([2, 3]);
  const rb = pick([1, 2]);
  return {
    ...meta("quiz-L20-adv", "Borner le rang d'un produit AB", "Avancé"),
    prompt: [
      t(`Si A est 4×3 avec rang(A) = ${ra}, et B est 3×5 avec rang(B) = ${rb}, donner une borne supérieure pour rang(AB).`),
    ],
    steps: [
      [t("Propriété : rang(AB) ≤ min(rang(A), rang(B)).")],
    ],
    answer: [bold([t(`rang(AB) ≤ min(${ra}, ${rb}) = ${Math.min(ra, rb)}.`)])],
  };
}

const inters = [interCompareRanks, interRankFromNonRREF];
const advs = [advNumberOfSolutionsAnalysis, advRankProduct];

export function generateL20Quiz(): Exercise[] {
  return [easyRankFromRREF(), pick(inters)(), pick(inters)(), pick(advs)(), pick(advs)()];
}
