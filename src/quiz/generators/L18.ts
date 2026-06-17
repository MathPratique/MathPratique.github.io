import type { Exercise } from "../../data/exercises";
import { randMat } from "../math";
import { pick, randInt, uniqueId } from "../rng";
import { t, mat, bold, asCells } from "../builders";

function meta(id: string, title: string, difficulty: Exercise["difficulty"]) {
  return {
    id: uniqueId(id),
    topicId: "linear-algebra",
    lessonId: "L18",
    title,
    difficulty,
  } as const;
}

function easyOneOperation(): Exercise {
  const A = randMat(3, 3, -3, 4);
  const k = pick([-2, -1, 2, 3]);
  // L₂ → L₂ + k·L₁
  const B = A.map((row) => row.slice());
  B[1] = B[1].map((v, j) => v + k * A[0][j]);
  return {
    ...meta("quiz-L18-easy", "Effectuer une opération élémentaire sur une matrice", "Fondamental"),
    prompt: [
      t("Effectuer l'opération L₂ → L₂ + "),
      t(`${k}`),
      t("·L₁ sur "),
      mat(asCells(A), "A ="),
      t("."),
    ],
    steps: [
      [t(`Pour chaque colonne j, remplacer A[2][j] par A[2][j] + ${k}·A[1][j].`)],
    ],
    answer: [bold([t("Résultat : "), mat(asCells(B))])],
  };
}

function interMakeZeroBelowPivot(): Exercise {
  // 2x3 matrix where we eliminate below the (1,1) pivot
  const a = pick([1, 2]);
  const A = [
    [a, randInt(-3, 3), randInt(-3, 3)],
    [pick([2, 3, 4]) * a, randInt(-3, 3), randInt(-3, 3)],
    [pick([-2, -1, 2, 3]) * a, randInt(-3, 3), randInt(-3, 3)],
  ];
  const k2 = -A[1][0] / A[0][0];
  const k3 = -A[2][0] / A[0][0];
  const B = A.map((row) => row.slice());
  B[1] = B[1].map((v, j) => v + k2 * A[0][j]);
  B[2] = B[2].map((v, j) => v + k3 * A[0][j]);
  return {
    ...meta("quiz-L18-inter", "Annuler la colonne 1 sous le pivot", "Intermédiaire"),
    prompt: [
      t("Pour "),
      mat(asCells(A), "A ="),
      t(", appliquer les opérations qui annulent les coefficients sous le pivot en position (1,1)."),
    ],
    steps: [
      [t(`L₂ → L₂ + (${k2})·L₁ pour annuler A[2][1].`)],
      [t(`L₃ → L₃ + (${k3})·L₁ pour annuler A[3][1].`)],
    ],
    answer: [bold([t("Résultat : "), mat(asCells(B))])],
  };
}

function interTwoOps(): Exercise {
  const A = randMat(2, 3, -3, 3);
  // L₁ → 2L₁ then L₂ → L₂ − L₁
  const B = A.map((row) => row.slice());
  B[0] = B[0].map((v) => 2 * v);
  B[1] = B[1].map((v, j) => v - B[0][j]);
  return {
    ...meta("quiz-L18-inter", "Enchaîner deux opérations élémentaires", "Intermédiaire"),
    prompt: [
      t("Appliquer dans l'ordre L₁ → 2L₁ puis L₂ → L₂ − L₁ à "),
      mat(asCells(A), "A ="),
      t("."),
    ],
    steps: [
      [t("Première opération : multiplier toute la ligne 1 par 2.")],
      [t("Deuxième opération : soustraire la nouvelle L₁ de L₂.")],
    ],
    answer: [bold([t("Résultat : "), mat(asCells(B))])],
  };
}

function advReduceToEchelon(): Exercise {
  // Build an upper-triangular target, then create a perturbation
  // Easier: hand-craft a specific 3x3 system that reduces nicely
  const A = [
    [1, 2, 3],
    [2, 4, 7],
    [1, 3, 5],
  ];
  // After reduction: [[1,2,3],[0,0,1],[0,1,2]] then swap → [[1,2,3],[0,1,2],[0,0,1]]
  const echelon = [
    [1, 2, 3],
    [0, 1, 2],
    [0, 0, 1],
  ];
  return {
    ...meta("quiz-L18-adv", "Réduire à la forme échelon", "Avancé"),
    prompt: [
      t("Réduire la matrice à sa forme échelon : "),
      mat(asCells(A), "A ="),
      t("."),
    ],
    steps: [
      [t("L₂ → L₂ − 2L₁ et L₃ → L₃ − L₁ : on annule la colonne 1 sous le pivot.")],
      [t("Échanger L₂ et L₃ pour faire apparaître un pivot non nul en position (2,2).")],
    ],
    answer: [bold([t("Forme échelon : "), mat(asCells(echelon))])],
  };
}

function advRescaleRow(): Exercise {
  // L₁ → (1/3)L₁ for a 2x3 matrix with first row divisible by 3
  const a = randInt(1, 3);
  const b = randInt(-2, 3);
  const c = randInt(-2, 3);
  const A = [
    [3 * a, 3 * b, 3 * c],
    [randInt(-3, 4), randInt(-3, 4), randInt(-3, 4)],
  ];
  const B = [[a, b, c], A[1]];
  return {
    ...meta("quiz-L18-adv", "Normaliser une ligne", "Avancé"),
    prompt: [
      t("Appliquer L₁ → (1/3)·L₁ à "),
      mat(asCells(A), "A ="),
      t(" pour normaliser le pivot."),
    ],
    steps: [
      [t("Diviser chaque entrée de L₁ par 3.")],
    ],
    answer: [bold([t("Résultat : "), mat(asCells(B))])],
  };
}

const inters = [interMakeZeroBelowPivot, interTwoOps];
const advs = [advReduceToEchelon, advRescaleRow];

export function generateL18Quiz(): Exercise[] {
  return [easyOneOperation(), pick(inters)(), pick(inters)(), pick(advs)(), pick(advs)()];
}
