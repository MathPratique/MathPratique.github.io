import type { Exercise } from "../../data/exercises";
import { det2, det3, randMat } from "../math";
import { pick, randInt, uniqueId } from "../rng";
import { t, mat, bold, asCells } from "../builders";

function meta(id: string, title: string, difficulty: Exercise["difficulty"]) {
  return {
    id: uniqueId(id),
    topicId: "linear-algebra",
    lessonId: "L10",
    title,
    difficulty,
  } as const;
}

function easyDet2(): Exercise {
  const A = randMat(2, 2, -4, 5);
  const d = det2(A);
  return {
    ...meta("quiz-L10-easy", "Déterminant 2×2", "Fondamental"),
    prompt: [t("Calculer le déterminant de "), mat(asCells(A), "A ="), t(".")],
    steps: [[t(`det(A) = ${A[0][0]}·${A[1][1]} − ${A[0][1]}·${A[1][0]} = ${d}.`)]],
    answer: [bold([t(`det(A) = ${d}.`)])],
  };
}

function inter2x2Param(): Exercise {
  // Solve det(A) = c for unknown
  const a = pick([1, 2, 3]);
  const c = pick([2, 4, 6]);
  // A = [[x, 1], [2, a]] → det = ax − 2 = c → x = (c + 2)/a
  const x = (c + 2) / a;
  return {
    ...meta("quiz-L10-inter", "Trouver une valeur pour obtenir un déterminant donné", "Intermédiaire"),
    prompt: [
      t("Trouver la valeur de x telle que det("),
      mat([
        ["x", "1"],
        ["2", String(a)],
      ]),
      t(`) = ${c}.`),
    ],
    steps: [
      [t(`det = ${a}x − 2 = ${c} ⇒ ${a}x = ${c + 2} ⇒ x = ${x}.`)],
    ],
    answer: [bold([t(`x = ${x}.`)])],
  };
}

function interDet3(): Exercise {
  const A = randMat(3, 3, -2, 3);
  const d = det3(A);
  return {
    ...meta("quiz-L10-inter", "Déterminant 3×3 par cofacteurs", "Intermédiaire"),
    prompt: [t("Calculer le déterminant de "), mat(asCells(A), "A ="), t(".")],
    steps: [
      [t("Développer selon la première ligne : det(A) = a₁₁·M₁₁ − a₁₂·M₁₂ + a₁₃·M₁₃.")],
      [
        t(
          `= ${A[0][0]}·(${A[1][1]}·${A[2][2]} − ${A[1][2]}·${A[2][1]}) − ${A[0][1]}·(${A[1][0]}·${A[2][2]} − ${A[1][2]}·${A[2][0]}) + ${A[0][2]}·(${A[1][0]}·${A[2][1]} − ${A[1][1]}·${A[2][0]}).`
        ),
      ],
    ],
    answer: [bold([t(`det(A) = ${d}.`)])],
  };
}

function advDetTriangular(): Exercise {
  // Upper triangular matrix → det = product of diagonal
  const a = pick([1, 2, 3]);
  const b = pick([-2, 1, 2, 4]);
  const c = pick([-1, 2, 3]);
  const A = [
    [a, randInt(-3, 3), randInt(-3, 3)],
    [0, b, randInt(-3, 3)],
    [0, 0, c],
  ];
  return {
    ...meta("quiz-L10-adv", "Déterminant d'une matrice triangulaire", "Avancé"),
    prompt: [t("Calculer le déterminant de la matrice triangulaire "), mat(asCells(A), "A ="), t(".")],
    steps: [
      [t("Pour une matrice triangulaire (supérieure ou inférieure), det = produit des éléments diagonaux.")],
    ],
    answer: [bold([t(`det(A) = ${a}·${b}·${c} = ${a * b * c}.`)])],
  };
}

function advDetWithRowOp(): Exercise {
  // If we know det(A) = d, what is det of matrix obtained by row swap, scaling, etc.
  const d = pick([2, 3, -4, 5]);
  const k = pick([2, 3]);
  return {
    ...meta("quiz-L10-adv", "Effet d'une opération sur le déterminant", "Avancé"),
    prompt: [
      t(`Si A est une matrice 3×3 avec det(A) = ${d}, et B est obtenue en multipliant une ligne de A par ${k}, calculer det(B).`),
    ],
    steps: [
      [t("Multiplier une ligne par k multiplie le déterminant par k.")],
    ],
    answer: [bold([t(`det(B) = ${k}·${d} = ${k * d}.`)])],
  };
}

const inters = [inter2x2Param, interDet3];
const advs = [advDetTriangular, advDetWithRowOp];

export function generateL10Quiz(): Exercise[] {
  return [easyDet2(), pick(inters)(), pick(inters)(), pick(advs)(), pick(advs)()];
}
