import type { Exercise } from "../../data/exercises";
import {
  cofactorMatrix3,
  det3,
  mul,
  randInvertible3x3,
  transpose,
} from "../math";
import { pick, randInt, uniqueId } from "../rng";
import { t, sup, mat, bold, asCells } from "../builders";

function meta(id: string, title: string, difficulty: Exercise["difficulty"]) {
  return {
    id: uniqueId(id),
    topicId: "linear-algebra",
    lessonId: "L17",
    title,
    difficulty,
  } as const;
}

function fmtFrac(n: number, d: number): string {
  if (d === 1) return String(n);
  if (d === -1) return String(-n);
  if (n === 0) return "0";
  const sign = (n < 0) !== (d < 0) ? "-" : "";
  return `${sign}${Math.abs(n)}/${Math.abs(d)}`;
}

function easyMatrixForm(): Exercise {
  // 3-variable system → 3×3 A, 3×1 B
  const A = [
    [randInt(-3, 4), randInt(-3, 4), randInt(-3, 4)],
    [randInt(-3, 4), randInt(-3, 4), randInt(-3, 4)],
    [randInt(-3, 4), randInt(-3, 4), randInt(-3, 4)],
  ];
  const X = [[randInt(-2, 3)], [randInt(-2, 3)], [randInt(-2, 3)]];
  const B = mul(A, X);
  return {
    ...meta("quiz-L17-easy", "Écrire un système 3×3 sous forme matricielle AX = B", "Fondamental"),
    prompt: [
      t(
        `Écrire le système suivant sous forme matricielle AX = B :\n${A[0][0]}x + ${A[0][1]}y + ${A[0][2]}z = ${B[0][0]}\n${A[1][0]}x + ${A[1][1]}y + ${A[1][2]}z = ${B[1][0]}\n${A[2][0]}x + ${A[2][1]}y + ${A[2][2]}z = ${B[2][0]}`
      ),
    ],
    steps: [
      [t("A = matrice des coefficients (3×3), X = vecteur des inconnues (3×1), B = vecteur des constantes (3×1).")],
    ],
    answer: [
      bold([
        t("A = "),
        mat(asCells(A)),
        t(", X = "),
        mat([["x"], ["y"], ["z"]]),
        t(", B = "),
        mat(asCells(B)),
        t("."),
      ]),
    ],
  };
}

function interSolve3x3(): Exercise {
  // 3x3 system, solve via X = A⁻¹·B (matrix inverse method, NOT Cramer)
  const A = randInvertible3x3();
  const X = [[randInt(-2, 3)], [randInt(-2, 3)], [randInt(-2, 3)]];
  const B = mul(A, X);
  return {
    ...meta("quiz-L17-inter", "Résoudre un système 3×3 par la méthode de la matrice inverse", "Intermédiaire"),
    prompt: [
      t("Résoudre par la méthode de la matrice inverse le système 3×3 :\n"),
      t(`${A[0][0]}x + ${A[0][1]}y + ${A[0][2]}z = ${B[0][0]}\n`),
      t(`${A[1][0]}x + ${A[1][1]}y + ${A[1][2]}z = ${B[1][0]}\n`),
      t(`${A[2][0]}x + ${A[2][1]}y + ${A[2][2]}z = ${B[2][0]}`),
    ],
    steps: [
      [t(`Vérifier que det(A) = ${det3(A)} ≠ 0, donc A est inversible.`)],
      [t("Calculer A"), sup("-1"), t(" par la méthode des cofacteurs : A"), sup("-1"), t(" = adj(A)/det(A).")],
      [t("X = A"), sup("-1"), t("·B.")],
    ],
    answer: [bold([t(`x = ${X[0][0]}, y = ${X[1][0]}, z = ${X[2][0]}.`)])],
  };
}

function interApplyGivenInverse3(): Exercise {
  // Provide A and A⁻¹ already; ask user to compute X = A⁻¹·B for a 3x3 system
  const A = randInvertible3x3();
  const X = [[randInt(-2, 3)], [randInt(-2, 3)], [randInt(-2, 3)]];
  const B = mul(A, X);
  const d = det3(A);
  const adj = transpose(cofactorMatrix3(A));
  const invStr = adj.map((row) => row.map((v) => fmtFrac(v, d)));
  return {
    ...meta("quiz-L17-inter", "Appliquer A⁻¹·B pour résoudre un système 3×3", "Intermédiaire"),
    prompt: [
      t("Le système AX = B avec "),
      mat(asCells(A), "A ="),
      t(" et "),
      mat(asCells(B), "B ="),
      t(" se résout par X = A"),
      sup("-1"),
      t("·B. Sachant que A"),
      sup("-1"),
      t(" = "),
      mat(invStr),
      t(", calculer X."),
    ],
    steps: [
      [
        t("Effectuer directement le produit matriciel A"),
        sup("-1"),
        t("·B entrée par entrée — c'est la méthode de la matrice inverse."),
      ],
    ],
    answer: [bold([t("X = A"), sup("-1"), t("·B = "), mat(asCells(X))])],
  };
}

function advSolve3x3(): Exercise {
  // Similar to interSolve3x3 but with potentially less round numbers
  const A = randInvertible3x3();
  const X = [[randInt(-3, 3)], [randInt(-3, 3)], [randInt(-3, 3)]];
  const B = mul(A, X);
  return {
    ...meta("quiz-L17-adv", "Résoudre un système 3×3 (méthode de la matrice inverse)", "Avancé"),
    prompt: [
      t(
        `Résoudre le système suivant par la méthode de la matrice inverse :\n${A[0][0]}x + ${A[0][1]}y + ${A[0][2]}z = ${B[0][0]}\n${A[1][0]}x + ${A[1][1]}y + ${A[1][2]}z = ${B[1][0]}\n${A[2][0]}x + ${A[2][1]}y + ${A[2][2]}z = ${B[2][0]}`
      ),
    ],
    steps: [
      [t(`Vérifier que det(A) = ${det3(A)} ≠ 0.`)],
      [t("Calculer A"), sup("-1"), t(" par cofacteurs, puis X = A"), sup("-1"), t("·B.")],
    ],
    answer: [bold([t(`x = ${X[0][0]}, y = ${X[1][0]}, z = ${X[2][0]}.`)])],
  };
}

function advDetermineSingular(): Exercise {
  // 3×3 singular matrix where matrix inverse method fails
  const A = [
    [1, 2, 3],
    [2, 4, 6],
    [randInt(1, 3), randInt(-2, 2), randInt(-2, 2)],
  ];
  return {
    ...meta("quiz-L17-adv", "Quand la méthode de la matrice inverse échoue", "Avancé"),
    prompt: [
      t("Examiner la matrice "),
      mat(asCells(A), "A ="),
      t(". Le système AX = B peut-il être résolu par la méthode X = A"),
      sup("-1"),
      t("·B ? Pourquoi ?"),
    ],
    steps: [
      [t("L₂ = 2·L₁ ⇒ det(A) = 0 ⇒ A non inversible.")],
      [t("La méthode de la matrice inverse exige A inversible ; ici elle ne s'applique pas.")],
    ],
    answer: [
      bold([
        t("Non, car det(A) = 0 (L₂ = 2L₁). La matrice n'est pas inversible, donc la méthode A"),
        sup("-1"),
        t("·B ne s'applique pas — il faudrait utiliser Gauss-Jordan."),
      ]),
    ],
  };
}

const inters = [interSolve3x3, interApplyGivenInverse3];
const advs = [advSolve3x3, advDetermineSingular];

export function generateL17Quiz(): Exercise[] {
  return [easyMatrixForm(), pick(inters)(), pick(inters)(), pick(advs)(), pick(advs)()];
}
