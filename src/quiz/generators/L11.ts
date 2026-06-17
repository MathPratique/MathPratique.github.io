import type { Exercise } from "../../data/exercises";
import { det3, randMat } from "../math";
import { pick, randInt, uniqueId } from "../rng";
import { t, mat, bold, asCells } from "../builders";

function meta(id: string, title: string, difficulty: Exercise["difficulty"]) {
  return {
    id: uniqueId(id),
    topicId: "linear-algebra",
    lessonId: "L11",
    title,
    difficulty,
  } as const;
}

function easyDet3Cofactor(): Exercise {
  const A = randMat(3, 3, -2, 3);
  const d = det3(A);
  return {
    ...meta("quiz-L11-easy", "Déterminant 3×3 par développement de Laplace", "Fondamental"),
    prompt: [t("Calculer det(A) pour "), mat(asCells(A), "A ="), t(".")],
    steps: [
      [t("Développer selon la première ligne.")],
    ],
    answer: [bold([t(`det(A) = ${d}.`)])],
  };
}

function easyZeroRow(): Exercise {
  const A = randMat(3, 3, -2, 3);
  // Force a row of zeros
  const zRow = randInt(0, 2);
  A[zRow] = [0, 0, 0];
  return {
    ...meta("quiz-L11-easy", "Déterminant d'une matrice avec ligne nulle", "Fondamental"),
    prompt: [t("Sans calculer, donner det(A) pour "), mat(asCells(A), "A ="), t(".")],
    steps: [
      [t(`La ligne ${zRow + 1} est nulle, donc det(A) = 0.`)],
    ],
    answer: [bold([t("det(A) = 0 (matrice singulière).")])],
  };
}

function interDevAlongCol(): Exercise {
  // Develop along a column with many zeros
  const A = [
    [randInt(-2, 3), 0, randInt(-2, 3)],
    [randInt(-2, 3), pick([2, 3]), randInt(-2, 3)],
    [randInt(-2, 3), 0, randInt(-2, 3)],
  ];
  const d = det3(A);
  return {
    ...meta("quiz-L11-inter", "Choisir la meilleure ligne pour développer", "Intermédiaire"),
    prompt: [
      t("Calculer det(A) pour "),
      mat(asCells(A), "A ="),
      t(" en choisissant la ligne ou colonne contenant le plus de zéros."),
    ],
    steps: [
      [t("La colonne 2 contient deux zéros : développer selon cette colonne réduit le travail.")],
    ],
    answer: [bold([t(`det(A) = ${d}.`)])],
  };
}

function interIdentical(): Exercise {
  // Matrix with two identical rows → det = 0
  const A = randMat(3, 3, -2, 3);
  A[1] = A[0].slice();
  return {
    ...meta("quiz-L11-inter", "Reconnaître det = 0 par lignes proportionnelles", "Intermédiaire"),
    prompt: [t("Sans tout calculer, déterminer det(A) pour "), mat(asCells(A), "A ="), t(".")],
    steps: [
      [t("Les lignes 1 et 2 sont identiques (donc proportionnelles avec coefficient 1).")],
      [t("Propriété : si deux lignes sont proportionnelles, det = 0.")],
    ],
    answer: [bold([t("det(A) = 0.")])],
  };
}

function advCombineProps(): Exercise {
  const d = pick([2, 3, -4]);
  return {
    ...meta("quiz-L11-adv", "det(kA) en fonction de la dimension", "Avancé"),
    prompt: [
      t(`Si A est une matrice 3×3 avec det(A) = ${d}, calculer det(2A) et det(−A).`),
    ],
    steps: [
      [t("det(kA) = kⁿ·det(A) pour une matrice n×n.")],
      [t(`Ici n = 3, donc det(2A) = 2³·${d} = ${8 * d} et det(−A) = (−1)³·${d} = ${-d}.`)],
    ],
    answer: [bold([t(`det(2A) = ${8 * d}, det(−A) = ${-d}.`)])],
  };
}

function advProdDet(): Exercise {
  const da = pick([2, 3, -3]);
  const db = pick([2, 4, -2]);
  return {
    ...meta("quiz-L11-adv", "Déterminant d'un produit", "Avancé"),
    prompt: [
      t(`Si A et B sont 3×3 avec det(A) = ${da} et det(B) = ${db}, calculer det(AB), det(A`),
      t("²B), det((AB)"),
      t("⁻¹)."),
    ],
    steps: [
      [t("Propriétés : det(AB) = det(A)·det(B), det(A²B) = det(A)²·det(B), det(M⁻¹) = 1/det(M).")],
    ],
    answer: [
      bold([
        t(
          `det(AB) = ${da * db}, det(A²B) = ${da * da * db}, det((AB)⁻¹) = 1/${da * db}.`
        ),
      ]),
    ],
  };
}

const inters = [interDevAlongCol, interIdentical];
const advs = [advCombineProps, advProdDet];

export function generateL11Quiz(): Exercise[] {
  const easies = [easyDet3Cofactor, easyZeroRow];
  return [pick(easies)(), pick(inters)(), pick(inters)(), pick(advs)(), pick(advs)()];
}
