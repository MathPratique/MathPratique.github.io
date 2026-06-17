import type { Exercise } from "../../data/exercises";
import { det3, randMat } from "../math";
import { pick, randInt, uniqueId } from "../rng";
import { t, mat, bold, asCells } from "../builders";

function meta(id: string, title: string, difficulty: Exercise["difficulty"]) {
  return {
    id: uniqueId(id),
    topicId: "linear-algebra",
    lessonId: "L14",
    title,
    difficulty,
  } as const;
}

function easyTranspose(): Exercise {
  const A = randMat(3, 3, -2, 3);
  const d = det3(A);
  return {
    ...meta("quiz-L14-easy", "det(Aᵀ) en utilisant les propriétés", "Fondamental"),
    prompt: [
      t("Sans tout recalculer, donner det(Aᵀ) si "),
      mat(asCells(A), "A ="),
      t(`. (On donnera aussi det(A).)`),
    ],
    steps: [
      [t("Propriété : det(Aᵀ) = det(A).")],
      [t(`Calcul de det(A) : ${d}.`)],
    ],
    answer: [bold([t(`det(A) = det(A`), t("ᵀ"), t(`) = ${d}.`)])],
  };
}

function interSwap(): Exercise {
  const d = pick([3, -4, 5, 8]);
  return {
    ...meta("quiz-L14-inter", "Effet d'un échange de lignes", "Intermédiaire"),
    prompt: [
      t(`Si det(A) = ${d}, et B est obtenue en échangeant deux lignes de A, calculer det(B). Puis si C est obtenue en multipliant deux lignes différentes par 2 et 3, calculer det(C).`),
    ],
    steps: [
      [t("Échange de deux lignes : det change de signe.")],
      [t("Multiplier une ligne par k multiplie det par k. Deux lignes par 2 et 3 ⇒ det × 2·3 = ×6.")],
    ],
    answer: [bold([t(`det(B) = ${-d}, det(C) = ${6 * d}.`)])],
  };
}

function interReplaceRow(): Exercise {
  const d = pick([2, 3, 5]);
  return {
    ...meta("quiz-L14-inter", "Effet de Lᵢ ← Lᵢ + kLⱼ", "Intermédiaire"),
    prompt: [
      t(`Si det(A) = ${d}, et B est obtenue en remplaçant L₂ par L₂ + 5L₁ dans A, calculer det(B).`),
    ],
    steps: [
      [t("Propriété : Lᵢ ← Lᵢ + k·Lⱼ ne change pas le déterminant.")],
    ],
    answer: [bold([t(`det(B) = det(A) = ${d}.`)])],
  };
}

function advReduceToTriangular(): Exercise {
  // Use row operations to find det(A) for a specific matrix where reducing is easy
  // Pick an upper-triangular result
  const A = [
    [randInt(1, 3), randInt(-2, 3), randInt(-2, 3)],
    [randInt(-2, 3), randInt(1, 3), randInt(-2, 3)],
    [randInt(-2, 3), randInt(-2, 3), randInt(1, 3)],
  ];
  const d = det3(A);
  return {
    ...meta("quiz-L14-adv", "Calculer det(A) par opérations sur les lignes", "Avancé"),
    prompt: [
      t("Calculer det(A) en réduisant A à une forme triangulaire par opérations sur les lignes, sans modifier le déterminant. "),
      mat(asCells(A), "A ="),
      t("."),
    ],
    steps: [
      [t("Appliquer des opérations Lᵢ ← Lᵢ + kLⱼ pour faire apparaître des zéros sous la diagonale.")],
      [t("Le déterminant ne change pas pendant ces opérations.")],
      [t("Une fois triangulaire, det = produit des éléments diagonaux.")],
    ],
    answer: [bold([t(`det(A) = ${d}.`)])],
  };
}

function advFindParam(): Exercise {
  // Find k such that det(A) = c
  const k = pick([2, 3, -2]);
  // A = [[1, k, 0], [0, 1, 1], [k, 0, 1]]
  // det = 1·(1 − 0) − k·(0 − k) + 0 = 1 + k²
  return {
    ...meta("quiz-L14-adv", "Trouver k pour un déterminant donné", "Avancé"),
    prompt: [
      t("Trouver les valeurs de k telles que det("),
      mat([
        ["1", "k", "0"],
        ["0", "1", "1"],
        ["k", "0", "1"],
      ]),
      t(`) = ${1 + k * k}.`),
    ],
    steps: [
      [t("Développer selon la première ligne : det = 1·(1·1 − 1·0) − k·(0·1 − 1·k) + 0 = 1 + k².")],
      [t(`Équation : 1 + k² = ${1 + k * k} ⇒ k² = ${k * k} ⇒ k = ±${Math.abs(k)}.`)],
    ],
    answer: [bold([t(`k = ${Math.abs(k)} ou k = ${-Math.abs(k)}.`)])],
  };
}

const inters = [interSwap, interReplaceRow];
const advs = [advReduceToTriangular, advFindParam];

export function generateL14Quiz(): Exercise[] {
  return [easyTranspose(), pick(inters)(), pick(inters)(), pick(advs)(), pick(advs)()];
}
