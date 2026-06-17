import type { Exercise } from "../../data/exercises";
import { det3, randMat } from "../math";
import { pick, randInt, uniqueId } from "../rng";
import { t, mat, bold, asCells } from "../builders";

function meta(id: string, title: string, difficulty: Exercise["difficulty"]) {
  return {
    id: uniqueId(id),
    topicId: "linear-algebra",
    lessonId: "L12",
    title,
    difficulty,
  } as const;
}

function easyDet3Mixed(): Exercise {
  const A = randMat(3, 3, -3, 3);
  const d = det3(A);
  return {
    ...meta("quiz-L12-easy", "Déterminant 3×3 — calcul direct", "Fondamental"),
    prompt: [t("Calculer det(A) pour "), mat(asCells(A), "A ="), t(".")],
    steps: [
      [t("Développer selon la ligne ou colonne la plus pratique.")],
    ],
    answer: [bold([t(`det(A) = ${d}.`)])],
  };
}

function interCofactorRule(): Exercise {
  // Compute a single cofactor C_{i,j}
  const A = randMat(3, 3, -2, 3);
  const i = randInt(0, 2);
  const j = randInt(0, 2);
  // Build the 2x2 minor by removing row i and column j
  const minor: number[][] = [];
  for (let r = 0; r < 3; r++) {
    if (r === i) continue;
    const row: number[] = [];
    for (let c = 0; c < 3; c++) {
      if (c === j) continue;
      row.push(A[r][c]);
    }
    minor.push(row);
  }
  const m = minor[0][0] * minor[1][1] - minor[0][1] * minor[1][0];
  const cof = ((i + j) % 2 === 0 ? 1 : -1) * m;
  return {
    ...meta("quiz-L12-inter", "Calculer un cofacteur d'une matrice 3×3", "Intermédiaire"),
    prompt: [
      t("Pour "),
      mat(asCells(A), "A ="),
      t(`, calculer le cofacteur C${i + 1}${j + 1}.`),
    ],
    steps: [
      [t(`Mineur M${i + 1}${j + 1} = `), mat(asCells(minor)), t(` = ${m}.`)],
      [t(`C${i + 1}${j + 1} = (−1)^(${i + 1}+${j + 1})·M${i + 1}${j + 1} = ${(i + j) % 2 === 0 ? "+" : "−"}${Math.abs(m)} = ${cof}.`)],
    ],
    answer: [bold([t(`C${i + 1}${j + 1} = ${cof}.`)])],
  };
}

function interSarrus(): Exercise {
  // Sarrus rule for 3x3
  const A = randMat(3, 3, -2, 3);
  const d = det3(A);
  return {
    ...meta("quiz-L12-inter", "Déterminant 3×3 par la règle de Sarrus", "Intermédiaire"),
    prompt: [
      t("Appliquer la règle de Sarrus pour calculer det(A) où "),
      mat(asCells(A), "A ="),
      t("."),
    ],
    steps: [
      [t("Sarrus : somme des trois diagonales descendantes − somme des trois diagonales montantes.")],
    ],
    answer: [bold([t(`det(A) = ${d}.`)])],
  };
}

function advParameterized(): Exercise {
  // det of a parameterized matrix; find values of x that make it singular
  const A = [
    ["x", "1", "0"],
    ["1", "x", "1"],
    ["0", "1", "x"],
  ];
  // det = x(x² − 1) − 1·(x − 0) + 0 = x³ − x − x = x³ − 2x = x(x² − 2)
  return {
    ...meta("quiz-L12-adv", "Trouver x pour rendre A singulière", "Avancé"),
    prompt: [
      t("Trouver toutes les valeurs de x telles que det(A) = 0 où "),
      mat(A),
      t("."),
    ],
    steps: [
      [t("Développer : det(A) = x(x² − 1) − (x − 0) = x³ − 2x = x(x² − 2).")],
      [t("Annulation : x = 0 ou x² = 2 ⇒ x = ±√2.")],
    ],
    answer: [bold([t("x ∈ {0, √2, −√2}.")])],
  };
}

function advBlock(): Exercise {
  // Block triangular matrix
  const a = pick([2, 3]);
  const b = pick([1, 2]);
  const c = pick([1, 2, 3]);
  const A = [
    [a, 1, 0, 0],
    [0, b, 0, 0],
    [randInt(-2, 2), randInt(-2, 2), c, 1],
    [randInt(-2, 2), randInt(-2, 2), 0, 2],
  ];
  // det = (a·b) · (c·2 − 0·1) = a·b·2c
  return {
    ...meta("quiz-L12-adv", "Déterminant d'une matrice 4×4 triangulaire par blocs", "Avancé"),
    prompt: [
      t("Calculer det(A) pour la matrice triangulaire par blocs "),
      mat(asCells(A), "A ="),
      t("."),
    ],
    steps: [
      [t("Pour une matrice triangulaire par blocs, det = produit des déterminants des blocs diagonaux.")],
      [t(`Bloc 1 (2×2) : det = ${a}·${b} = ${a * b}. Bloc 2 (2×2) : det = ${c}·2 = ${2 * c}.`)],
    ],
    answer: [bold([t(`det(A) = ${a * b * 2 * c}.`)])],
  };
}

const inters = [interCofactorRule, interSarrus];
const advs = [advParameterized, advBlock];

export function generateL12Quiz(): Exercise[] {
  return [easyDet3Mixed(), pick(inters)(), pick(inters)(), pick(advs)(), pick(advs)()];
}
